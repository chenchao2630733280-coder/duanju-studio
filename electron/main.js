'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

// 固定用户数据目录，避免打包后 productName 变化导致历史项目“消失”
app.setPath('userData', path.join(app.getPath('appData'), 'duanju-studio'));

let mainWindow = null;
let allowClose = false;

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
}

/* ------------------------------------------------------------------ */
/* 工作区与常量                                                        */
/* ------------------------------------------------------------------ */

function workspaceRoot() {
  return app.isPackaged
    ? path.join(app.getPath('userData'), 'workspace')
    : path.join(app.getAppPath(), 'workspace');
}

function projectsRoot() {
  return path.join(workspaceRoot(), 'projects');
}

function settingsFile() {
  return path.join(workspaceRoot(), 'settings.json');
}

async function ensureDirs() {
  await fs.mkdir(projectsRoot(), { recursive: true });
}

function safeId(id) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{6,64}$/.test(id)) {
    throw new Error('非法的项目 ID');
  }
  return id;
}

function projectDir(id) {
  return path.join(projectsRoot(), safeId(id));
}

const DEFAULT_SETTINGS = {
  theme: 'dark',
  density: 'comfortable',
  defaultProvider: '',
  providers: [],
  routing: { development: '', script: '', storyboard: '', image: '', video: '', tts: '' },
  autoSave: true,
  lastProjectId: ''
};

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const writeQueues = new Map();

async function writeJson(file, data) {
  const prev = writeQueues.get(file) || Promise.resolve();
  const next = prev.catch(() => {}).then(async () => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${crypto.randomUUID()}.tmp`;
    try {
      await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
      await fs.rename(tmp, file);
    } finally {
      await fs.rm(tmp, { force: true }).catch(() => {});
    }
  });
  writeQueues.set(file, next);
  return next.finally(() => {
    if (writeQueues.get(file) === next) writeQueues.delete(file);
  });
}

/* ------------------------------------------------------------------ */
/* 项目读写                                                            */
/* ------------------------------------------------------------------ */

function blankProject(name, overview = {}) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name || '未命名短剧项目',
    createdAt: now,
    updatedAt: now,
    cover: '',
    overview: {
      title: name || '',
      logline: '',
      genre: '都市情感',
      platform: '中文短剧平台',
      audience: '18—40岁大众用户',
      episodes: 60,
      duration: '1—3分钟',
      budget: '中低成本',
      emotions: ['爽感', '悬疑', '情感拉扯'],
      ending: '完整结局，可保留续作空间',
      businessModel: '平台分账 + 投流',
      privateGoods: {
        theme: '', moment: '', hatedTrope: '', recentScene: '',
        belief: '', childhood: '', regret: ''
      },
      concepts: [],
      choseConcept: 0,
      ...overview
    },
    review: {},
    engine: { protagonist: {}, desires: {}, obstacles: {}, rival: {} },
    rules: [],
    characters: [],
    relations: [],
    secrets: [],
    stages: [],
    emotionCurve: [],
    cliffhangers: [],
    outline: [],
    feasibility: {},
    risks: {},
    score: { dimensions: {} },
    shots: [],
    assets: [],
    scriptStatus: {},
    activity: []
  };
}

function summarize(project) {
  const has = (v) => v != null && String(v).trim().length > 0;
  const episodes = Number(project.overview?.episodes || 0);
  const outlined = (project.outline || []).length;
  const written = Object.values(project.scriptStatus || {}).filter(Boolean).length;
  const checks = [
    has(project.overview?.privateGoods?.theme) && (project.overview?.concepts || []).length > 0,
    !!project.review?.passed && has(project.review?.conclusion),
    has(project.engine?.protagonist?.name) && has(project.engine?.desires?.surface) && (project.engine?.cannotQuit || []).length >= 2,
    (project.rules || []).length > 0,
    (project.characters || []).length >= 4 && (project.relations || []).length >= 2,
    has(project.engine?.rival?.goal) && has(project.engine?.rival?.mirror),
    (project.secrets || []).length >= 4,
    (project.stages || []).length >= 6,
    (project.emotionCurve || []).length >= 3,
    (project.cliffhangers || []).length >= Math.min(5, episodes),
    outlined >= episodes * 0.8,
    written > 0,
    has(project.feasibility?.plan) || has(project.feasibility?.scenes),
    has(project.risks?.plan),
    Number(project.score?.total || 0) > 0,
    (project.shots || []).length > 0
  ];
  const done = checks.filter(Boolean).length;
  const coverAsset = (project.assets || []).find(a => a.id === project.cover);
  return {
    id: project.id,
    name: project.name,
    cover: coverAsset ? coverAsset.path : '',
    logline: project.overview?.logline || '',
    genre: project.overview?.genre || '',
    episodes,
    outlined,
    written,
    progress: Math.round((done / checks.length) * 100),
    updatedAt: project.updatedAt,
    createdAt: project.createdAt
  };
}

/* ------------------------------------------------------------------ */
/* 资产                                                                */
/* ------------------------------------------------------------------ */

const ASSET_TYPES = ['character', 'scene', 'prop', 'image', 'audio', 'video', 'reference'];

function detectType(file, requested) {
  if (requested && ASSET_TYPES.includes(requested)) return requested;
  const ext = path.extname(file).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'].includes(ext)) return 'image';
  if (['.mp3', '.wav', '.m4a', '.ogg', '.flac'].includes(ext)) return 'audio';
  if (['.mp4', '.mov', '.webm', '.mkv'].includes(ext)) return 'video';
  return 'reference';
}

async function copyAsset(project, sourceFile, type, meta = {}) {
  const dir = path.join(projectDir(project.id), 'assets', type);
  await fs.mkdir(dir, { recursive: true });
  const ext = path.extname(sourceFile) || '.bin';
  const base = path.basename(sourceFile, ext).replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
  const fileName = `${Date.now()}-${base}${ext}`;
  await fs.copyFile(sourceFile, path.join(dir, fileName));
  const rel = path.join('assets', type, fileName).split(path.sep).join('/');
  const asset = {
    id: crypto.randomUUID(),
    type,
    name: meta.name || base || fileName,
    fileName,
    path: rel,
    tags: meta.tags || [],
    note: meta.note || '',
    linkId: meta.linkId || '',
    prompt: meta.prompt || '',
    createdAt: new Date().toISOString()
  };
  project.assets.push(asset);
  return asset;
}

/* ------------------------------------------------------------------ */
/* AI Provider                                                         */
/* ------------------------------------------------------------------ */

function endpoint(baseUrl, suffix) {
  const base = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!base) throw new Error('未配置 Base URL');
  return base + suffix;
}

async function httpJson(url, { method = 'POST', headers = {}, body, timeout = 180000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body == null ? undefined : JSON.stringify(body),
      signal: controller.signal
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!res.ok) {
      const msg = data?.error?.message || data?.message || text.slice(0, 300);
      throw new Error(`HTTP ${res.status}：${msg}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function authHeaders(provider) {
  return provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {};
}

async function testProvider(provider) {
  if (!provider || !provider.baseUrl) throw new Error('未填写 Base URL');
  if (provider.kind === 'llm') {
    const data = await httpJson(endpoint(provider.baseUrl, '/models'), {
      method: 'GET', headers: authHeaders(provider), timeout: 30000
    });
    const models = Array.isArray(data?.data) ? data.data.map(m => m.id).filter(Boolean) : [];
    return { ok: true, message: '连接成功', models: models.slice(0, 40) };
  }
  return { ok: true, message: '已保存配置（该类型将在生成时验证）' };
}

/* 模型未返回 usage 时按字符估算：中文约 1.5—2 字 / token，英文约 4 字符 / token，混合取 1.8 */
function estimateTokens(messages, content) {
  const inChars = (messages || []).map(m => String(m && m.content ? m.content : '')).join('').length;
  const outChars = String(content || '').length;
  return {
    prompt: Math.max(1, Math.round(inChars / 1.8)),
    completion: Math.max(1, Math.round(outChars / 1.8))
  };
}

async function chatCompletion(provider, messages, options = {}) {
  if (!provider || !provider.baseUrl || !provider.model) throw new Error('模型未配置完整（Base URL / 模型名）');
  const started = Date.now();
  const data = await httpJson(endpoint(provider.baseUrl, '/chat/completions'), {
    headers: authHeaders(provider),
    timeout: options.timeout || 180000,
    body: {
      model: provider.model,
      messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens || 8192,
      ...(options.json ? { response_format: { type: 'json_object' } } : {})
    }
  });
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('模型返回为空');

  const u = data?.usage || {};
  let prompt = Number(u.prompt_tokens ?? u.input_tokens ?? 0) || 0;
  let completion = Number(u.completion_tokens ?? u.output_tokens ?? 0) || 0;
  let total = Number(u.total_tokens ?? 0) || 0;
  let estimated = false;
  if (!total) {
    const est = estimateTokens(messages, content);
    prompt = est.prompt;
    completion = est.completion;
    total = prompt + completion;
    estimated = true;
  }
  if (!total) total = prompt + completion;

  return {
    text: content,
    usage: { prompt, completion, total },
    estimated,
    model: data?.model || provider.model,
    durationMs: Date.now() - started
  };
}

function assetFile(projectId, rel) {
  const root = projectDir(projectId);
  const assetsDir = path.join(root, 'assets');
  const abs = path.resolve(root, String(rel || ''));
  const diff = path.relative(assetsDir, abs);
  if (!diff || diff.startsWith('..') || path.isAbsolute(diff)) throw new Error('非法的资产路径');
  return abs;
}

async function appendAsset(projectId, asset) {
  const file = path.join(projectDir(projectId), 'project.json');
  const fresh = await readJson(file, null);
  if (!fresh) throw new Error('项目不存在，资产未写入');
  fresh.assets = Array.isArray(fresh.assets) ? fresh.assets : [];
  fresh.assets.push(asset);
  fresh.updatedAt = new Date().toISOString();
  await writeJson(file, fresh);
  return asset;
}

async function generateImage(provider, project, prompt, meta = {}) {
  if (!provider || !provider.baseUrl || !provider.model) throw new Error('图像模型未配置完整');
  const data = await httpJson(endpoint(provider.baseUrl, '/images/generations'), {
    headers: authHeaders(provider),
    timeout: 240000,
    body: {
      model: provider.model,
      prompt,
      n: 1,
      size: meta.size || '1024x1024',
      response_format: 'b64_json'
    }
  });
  const item = data?.data?.[0];
  if (!item) throw new Error('图像接口未返回结果');
  const dir = path.join(projectDir(project.id), 'assets', 'image');
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${Date.now()}-${(meta.name || 'image').replace(/[\\/:*?"<>|]/g, '_').slice(0, 30)}.png`;
  const target = path.join(dir, fileName);
  if (item.b64_json) {
    await fs.writeFile(target, Buffer.from(item.b64_json, 'base64'));
  } else if (item.url) {
    const res = await fetch(item.url);
    if (!res.ok) throw new Error('下载生成图片失败');
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(target, buf);
  } else {
    throw new Error('图像接口返回格式不支持');
  }
  const asset = {
    id: crypto.randomUUID(),
    type: 'image',
    name: meta.name || 'AI 生成图片',
    fileName,
    path: `assets/image/${fileName}`,
    tags: meta.tags || ['AI生成'],
    note: '',
    linkId: meta.linkId || '',
    prompt,
    createdAt: new Date().toISOString()
  };
  return appendAsset(project.id, asset);
}

async function generateSpeech(provider, project, text, meta = {}) {
  if (!provider || !provider.baseUrl || !provider.model) throw new Error('语音模型未配置完整');
  const controller = new AbortController();
  const res = await fetch(endpoint(provider.baseUrl, '/audio/speech'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(provider) },
    body: JSON.stringify({
      model: provider.model,
      input: text,
      voice: meta.voice || 'alloy',
      response_format: meta.format || 'mp3'
    })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`语音生成失败 HTTP ${res.status}：${t.slice(0, 200)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = meta.format === 'wav' ? '.wav' : '.mp3';
  const dir = path.join(projectDir(project.id), 'assets', 'audio');
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${Date.now()}-${(meta.name || 'tts').replace(/[\\/:*?"<>|]/g, '_').slice(0, 30)}${ext}`;
  await fs.writeFile(path.join(dir, fileName), buf);
  const asset = {
    id: crypto.randomUUID(), type: 'audio', name: meta.name || 'AI 配音',
    fileName, path: `assets/audio/${fileName}`, tags: ['AI生成'],
    note: '', linkId: meta.linkId || '', prompt: text, createdAt: new Date().toISOString()
  };
  return appendAsset(project.id, asset);
}

/* ------------------------------------------------------------------ */
/* IPC                                                                 */
/* ------------------------------------------------------------------ */

function registerIpc() {
  ipcMain.handle('app:info', async () => ({
    workspace: workspaceRoot(),
    projects: projectsRoot(),
    version: app.getVersion(),
    platform: process.platform,
    appPath: app.getAppPath()
  }));

  ipcMain.handle('settings:get', async () => {
    const s = await readJson(settingsFile(), DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS, ...s };
  });

  ipcMain.handle('settings:save', async (_e, settings) => {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    await writeJson(settingsFile(), merged);
    return merged;
  });

  ipcMain.handle('project:list', async () => {
    await ensureDirs();
    const dirs = await fs.readdir(projectsRoot(), { withFileTypes: true });
    const list = [];
    for (const d of dirs) {
      if (!d.isDirectory()) continue;
      const p = await readJson(path.join(projectsRoot(), d.name, 'project.json'), null);
      if (p) list.push(summarize(p));
    }
    list.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return list;
  });

  ipcMain.handle('project:create', async (_e, payload = {}) => {
    await ensureDirs();
    const project = blankProject(payload.name, payload.overview);
    project.id = crypto.randomUUID();
    project.updatedAt = new Date().toISOString();
    project.activity = [{ at: project.createdAt, text: '创建项目' }];
    const dir = projectDir(project.id);
    await fs.mkdir(path.join(dir, 'docs', 'scripts'), { recursive: true });
    await fs.mkdir(path.join(dir, 'assets'), { recursive: true });
    await writeJson(path.join(dir, 'project.json'), project);
    return project;
  });

  ipcMain.handle('project:load', async (_e, id) => {
    const p = await readJson(path.join(projectDir(id), 'project.json'), null);
    if (!p) throw new Error('项目不存在');
    return p;
  });

  ipcMain.handle('project:save', async (_e, project) => {
    const dir = projectDir(project.id);
    await fs.mkdir(dir, { recursive: true });
    project.updatedAt = new Date().toISOString();
    await writeJson(path.join(dir, 'project.json'), project);
    return { updatedAt: project.updatedAt };
  });

  ipcMain.handle('project:delete', async (_e, id) => {
    await fs.rm(projectDir(id), { recursive: true, force: true });
    return true;
  });

  ipcMain.handle('project:export', async (_e, { project, files = [] }) => {
    const dir = projectDir(project.id);
    for (const file of files) {
      const rel = String(file.path).replace(/\\/g, '/');
      if (rel.includes('..') || path.isAbsolute(rel)) throw new Error('导出路径非法');
      const target = path.join(dir, rel);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, file.content, 'utf8');
    }
    await writeJson(path.join(dir, 'project.json'), project);
    return { count: files.length };
  });

  ipcMain.handle('project:folder', async (_e, id) => {
    const dir = projectDir(id);
    await fs.mkdir(dir, { recursive: true });
    await shell.openPath(dir);
    return dir;
  });

  ipcMain.handle('workspace:open', async () => {
    await ensureDirs();
    await shell.openPath(workspaceRoot());
    return workspaceRoot();
  });

  ipcMain.handle('project:files', async (_e, id) => {
    const dir = path.join(projectDir(id), 'docs');
    async function walk(root, prefix = '') {
      const out = [];
      let entries = [];
      try { entries = await fs.readdir(root, { withFileTypes: true }); } catch { return out; }
      for (const e of entries) {
        const rel = prefix ? `${prefix}/${e.name}` : e.name;
        if (e.isDirectory()) out.push(...await walk(path.join(root, e.name), rel));
        else if (e.name.endsWith('.md')) out.push(rel);
      }
      return out;
    }
    return walk(dir);
  });

  ipcMain.handle('project:readFile', async (_e, { id, rel }) => {
    if (String(rel).includes('..')) throw new Error('非法路径');
    return fs.readFile(path.join(projectDir(id), 'docs', rel), 'utf8');
  });

  ipcMain.handle('asset:pick', async (_e, { type } = {}) => {
    const filters = type === 'image'
      ? [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
      : type === 'audio'
        ? [{ name: '音频', extensions: ['mp3', 'wav', 'm4a', 'ogg'] }]
        : type === 'video'
          ? [{ name: '视频', extensions: ['mp4', 'mov', 'webm'] }]
          : [{ name: '全部文件', extensions: ['*'] }];
    const res = await dialog.showOpenDialog(mainWindow, { properties: ['openFile', 'multiSelections'], filters });
    return res.canceled ? [] : res.filePaths;
  });

  ipcMain.handle('asset:import', async (_e, { projectId, type, files = [], meta = {} }) => {
    const project = await readJson(path.join(projectDir(projectId), 'project.json'), null);
    if (!project) throw new Error('项目不存在');
    const added = [];
    for (const file of files) added.push(await copyAsset(project, file, detectType(file, type), meta));
    await writeJson(path.join(projectDir(projectId), 'project.json'), project);
    return { assets: added, project };
  });

  ipcMain.handle('asset:delete', async (_e, { projectId, assetId }) => {
    const project = await readJson(path.join(projectDir(projectId), 'project.json'), null);
    if (!project) throw new Error('项目不存在');
    const asset = project.assets.find(a => a.id === assetId);
    if (asset) {
      await fs.rm(assetFile(projectId, asset.path), { force: true });
      project.assets = project.assets.filter(a => a.id !== assetId);
      await writeJson(path.join(projectDir(projectId), 'project.json'), project);
    }
    return project;
  });

  ipcMain.handle('asset:reveal', async (_e, { projectId, assetId }) => {
    const project = await readJson(path.join(projectDir(projectId), 'project.json'), null);
    const asset = project?.assets.find(a => a.id === assetId);
    if (asset) shell.showItemInFolder(assetFile(projectId, asset.path));
    return true;
  });

  ipcMain.handle('ai:test', async (_e, provider) => {
    try {
      return await testProvider(provider);
    } catch (err) {
      return { ok: false, message: String(err.message || err) };
    }
  });

  ipcMain.handle('ai:chat', async (_e, { provider, messages, options }) => {
    return chatCompletion(provider, messages, options);
  });

  ipcMain.handle('ai:image', async (_e, { provider, project, prompt, meta }) => {
    return generateImage(provider, project, prompt, meta);
  });

  ipcMain.handle('ai:tts', async (_e, { provider, project, text, meta }) => {
    try {
      return await generateSpeech(provider, project, text, meta);
    } catch (err) {
      throw new Error(String(err.message || err));
    }
  });

  ipcMain.handle('window:minimize', () => mainWindow && mainWindow.minimize());
  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
    return mainWindow.isMaximized();
  });
  ipcMain.handle('window:close', () => mainWindow && mainWindow.close());
  ipcMain.handle('window:force-close', () => {
    allowClose = true;
    if (mainWindow) mainWindow.close();
  });
}

/* ------------------------------------------------------------------ */
/* 窗口                                                                */
/* ------------------------------------------------------------------ */

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1180,
    minHeight: 720,
    show: false,
    backgroundColor: '#0a0c11',
    title: '短剧工作台 · Duanju Studio',
    autoHideMenuBar: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  mainWindow.on('close', (e) => {
    if (allowClose) return;
    e.preventDefault();
    mainWindow.webContents.send('app:flush');
    setTimeout(() => {
      if (!allowClose && mainWindow) {
        allowClose = true;
        mainWindow.close();
      }
    }, 2000);
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  if (process.argv.includes('--dev')) mainWindow.webContents.openDevTools({ mode: 'detach' });
}

/* ------------------------------------------------------------------ */
/* 自动更新（仅安装版；便携版不参与自更新）                            */
/* ------------------------------------------------------------------ */

function setupAutoUpdate() {
  if (!app.isPackaged) return;
  if (process.env.PORTABLE_EXECUTABLE_DIR) return;

  const owner = process.env.DUANJU_UPDATE_OWNER;
  const repo = process.env.DUANJU_UPDATE_REPO;
  if (owner && repo) autoUpdater.setFeedURL({ provider: 'github', owner, repo });

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    console.log(`[update] 发现新版本 ${info.version}，开始后台下载`);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    if (!mainWindow) return;
    const choice = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '更新已准备好',
      message: `新版本 ${info.version} 已下载完成`,
      detail: '重启应用即可完成安装。',
      buttons: ['立即重启', '稍后'],
      defaultId: 0,
      cancelId: 1
    });
    if (choice.response === 0) {
      allowClose = true;
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (err) => {
    console.warn('[update]', err && err.message ? err.message : err);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => console.warn('[update]', err.message));
  }, 5000);
}

app.whenReady().then(async () => {
  await ensureDirs();
  registerIpc();
  createWindow();
  setupAutoUpdate();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (_e, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
});

// 图标占位：保证 nativeImage 引用不报错
void nativeImage;
