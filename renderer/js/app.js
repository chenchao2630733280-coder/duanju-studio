/* 应用入口、路由与侧边栏 */
(function () {
  const App = { view: 'projects', params: {}, current: null };
  const U = window.U;
  const D = window.D;

  App.go = function (view, params) {
    App.view = view;
    App.params = params || {};
    const root = document.getElementById('view');
    root.innerHTML = '';
    root.scrollTop = 0;
    const fn = window.Views[view] || window.Views.dashboard;
    try {
      fn(root, App.params);
    } catch (e) {
      console.error(e);
      root.innerHTML = `<div class="page">${U.empty('页面渲染失败', U.escape(e.message))}</div>`;
    }
    App.renderSidebar();
  };

  App.refresh = function () { App.go(App.view, App.params); };

  App.renderSidebar = function () {
    const s = document.getElementById('sidebar');
    const p = window.Store.project;
    const proj = window.Store.project;
    const tb = document.getElementById('tb-project');
    tb.textContent = proj ? proj.name : '未打开项目';

    if (!p) {
      s.innerHTML = `
        <div class="side-top">
          <div class="project-switch" data-go="projects">
            <div class="ps-cover">${window.Icons.film}</div>
            <div class="ps-meta">
              <div class="ps-name">短剧工作台</div>
              <div class="ps-sub">未打开项目</div>
            </div>
          </div>
        </div>
        <div class="side-scroll">
          <div class="nav-group">
            <div class="nav-title">工作区</div>
            <div class="nav-item ${App.view === 'projects' ? 'active' : ''}" data-go="projects"><span class="ni">${window.Icons.grid}</span>项目库</div>
            <div class="nav-item ${App.view === 'topics' ? 'active' : ''}" data-go="topics"><span class="ni">${window.Icons.compass}</span>选题库</div>
            <div class="nav-item ${App.view === 'models' ? 'active' : ''}" data-go="models"><span class="ni">${window.Icons.model}</span>模型配置</div>
            <div class="nav-item ${App.view === 'settings' ? 'active' : ''}" data-go="settings"><span class="ni">${window.Icons.settings}</span>设置</div>
          </div>
        </div>
        <div class="side-foot">
          <div class="sf-btn" data-act="workspace">${window.Icons.folder} 工作区目录</div>
        </div>`;
      App.bindSidebar();
      return;
    }

    const overview = p.overview || {};
    const overall = D.overallProgress(p);
    const currentStep = D.currentStep(p);
    const eps = Number(overview.episodes || 60);
    const cover = U.coverUrl(p);
    const gateIcons = { g0: 'compass', g1: 'engine', g2: 'list', g3: 'script', g4: 'scan', g5: 'storyboard' };
    const gateTarget = function (ph) {
      const steps = ph.steps.map(id => D.stepInfo(id)).filter(Boolean);
      const target = steps.find(s => !D.stepDone(s, p)) || steps[0];
      if (!target) return '';
      if (target.view) return `data-go="${target.view}"`;
      return `data-go="step" data-step="${target.id}"`;
    };
    const activeGate = App.view === 'topic' || App.view === 'topics' ? 'g0'
      : App.view === 'outline' ? 'g2'
        : App.view === 'scripts' ? 'g3'
          : App.view === 'storyboard' ? 'g5'
            : App.view === 'characters' ? 'g1'
              : App.view === 'step' ? (D.gateOf(App.params.id) || {}).id
                : null;
    const navGates = D.phases.map(function (ph) {
      const pr = D.gateProgress(ph.id, p);
      const nodes = D.phaseNodes(ph.id, p);
      const icon = `<span class="ni">${window.Icons[gateIcons[ph.id]]}</span>`;
      const count = ph.optional
        ? '<span class="num" title="可选增强：用于给剧本注入个性化设定">可选</span>'
        : `<span class="num">${pr.done}/${pr.total}</span>`;
      if (nodes.length > 1) {
        return `<div class="nav-item nav-item-steps ${activeGate === ph.id ? 'active' : ''}" ${gateTarget(ph)}>
          ${icon}
          <div class="nav-main">
            <div class="nav-row"><span class="nav-label">${ph.name}</span>${count}</div>
            ${D.nodesHtml(ph.id, p, { cls: 'sm nav-nodes' })}
          </div>
        </div>`;
      }
      return `<div class="nav-item ${activeGate === ph.id ? 'active' : ''}" ${gateTarget(ph)}>
        ${icon}<span class="nav-label">${ph.name}</span>${count}
      </div>`;
    }).join('');

    s.innerHTML = `
      <div class="side-top">
        <div class="project-switch" data-go="projects" title="切换项目">
          <div class="ps-cover">${cover ? `<img src="${cover}" />` : window.Icons.film}</div>
          <div class="ps-meta">
            <div class="ps-name">${U.escape(p.name)}</div>
            <div class="ps-sub"><b>${overview.genre || '未设定类型'}</b><span>·</span><span>${eps} 集</span></div>
          </div>
        </div>
      </div>
      <div class="side-scroll">
        <div class="nav-group">
          <div class="nav-title">项目</div>
          <div class="nav-item ${App.view === 'dashboard' ? 'active' : ''}" data-go="dashboard"><span class="ni">${window.Icons.grid}</span>项目总览</div>
          <div class="nav-item ${App.view === 'topics' ? 'active' : ''}" data-go="topics"><span class="ni">${window.Icons.compass}</span>选题库</div>
          ${navGates}
        </div>
        <div class="nav-group">
          <div class="nav-title">资源与工具</div>
          <div class="nav-item ${App.view === 'assets' ? 'active' : ''}" data-go="assets"><span class="ni">${window.Icons.assets}</span>资产库<span class="num">${(p.assets || []).length}</span></div>
          <div class="nav-item ${App.view === 'models' ? 'active' : ''}" data-go="models"><span class="ni">${window.Icons.model}</span>模型配置<span class="num">${(window.Store.settings.providers || []).length}</span></div>
          <div class="nav-item ${App.view === 'settings' ? 'active' : ''}" data-go="settings"><span class="ni">${window.Icons.folder}</span>导出与设置</div>
        </div>
        <div class="mini-progress">
          <div class="mp-head"><span>主线进度</span><b>${overall}%</b></div>
          <div class="bar"><i style="width:${overall}%"></i></div>
          <div class="tiny faint" style="margin-top:8px">下一步：${U.escape(currentStep.title)}</div>
        </div>
      </div>
      <div class="side-foot">
        <div class="sf-btn" data-go="projects">${window.Icons.grid} 项目库</div>
        <div class="sf-btn" data-act="export">${window.Icons.export} 导出</div>
      </div>`;
    App.bindSidebar();
  };

  App.bindSidebar = function () {
    const s = document.getElementById('sidebar');
    s.querySelectorAll('[data-go]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (el.dataset.go === 'step') App.go('step', { id: el.dataset.step });
        else App.go(el.dataset.go);
      });
    });
    const ws = s.querySelector('[data-act="workspace"]');
    if (ws) ws.addEventListener('click', function () {
      window.duanju.openWorkspace();
    });
    const exp = s.querySelector('[data-act="export"]');
    if (exp) exp.addEventListener('click', function () { App.exportDocs(); });
    s.querySelectorAll('[data-node-step]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        App.go('step', { id: el.dataset.nodeStep });
      });
    });
  };

  /* 阶段内节点跳转（节点条 / 节点轨） */
  App.bindNodes = function (root) {
    if (!root) return;
    root.querySelectorAll('[data-node-step]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        App.go('step', { id: el.dataset.nodeStep });
      });
    });
  };

  App.exportDocs = async function (opts) {
    if (!window.Store.project) return;
    try {
      const p = window.Store.project;
      const files = window.M.buildFiles(p, opts);
      const res = await window.duanju.exportProject({ project: p, files });
      await window.Store.reloadProjects();
      U.toast(`已导出 ${res.count} 份文档到项目 docs/`, 'ok');
      return res;
    } catch (e) {
      U.toast('导出失败：' + e.message, 'err');
    }
  };

  App.guardProject = function (root) {
    if (window.Store.project) return true;
    root.innerHTML = `<div class="page">${U.empty('尚未打开项目', '请先在项目库中创建或打开一个短剧项目。', '<button class="btn btn-primary" onclick="App.go(\'projects\')">前往项目库</button>')}</div>`;
    return false;
  };

  App.aiReady = function (kind) {
    return window.Store.hasAI(kind || 'llm');
  };

  /* ---------------- Token 用量 ---------------- */
  const sumUsage = function (o) {
    return Object.assign({ calls: 0, prompt: 0, completion: 0, total: 0 }, o || {});
  };

  App.usageStats = function () {
    const u = window.Store.usageOf();
    const byModel = Object.keys(u.byModel || {}).map(k => Object.assign({ name: k }, sumUsage(u.byModel[k]))).sort((a, b) => b.total - a.total);
    const byScope = Object.keys(u.byScope || {}).map(k => Object.assign({ name: k }, sumUsage(u.byScope[k]))).sort((a, b) => b.total - a.total);
    return { total: sumUsage(u.total), project: sumUsage(u.project), byModel, byScope, recent: u.recent || [] };
  };

  App.openUsage = function () {
    const st = App.usageStats();
    const hasProject = !!window.Store.project;
    const projName = function (id) {
      const p = window.Store.projects.find(x => x.id === id);
      return p ? p.name : (id ? '已删除项目' : '未归属');
    };
    const stat = function (label, value, sub) {
      return `<div class="card" style="padding:12px 14px">
        <div class="tiny faint">${label}</div>
        <div style="font-size:19px;font-weight:650;margin-top:6px;font-variant-numeric:tabular-nums">${value}</div>
        ${sub ? `<div class="tiny faint" style="margin-top:4px">${sub}</div>` : ''}
      </div>`;
    };
    const sectionTitle = function (text, hint) {
      return `<div class="section-head" style="margin:18px 0 10px">
        <div class="section-title">${text}</div><div class="section-line"></div>
        ${hint ? `<div class="section-hint">${hint}</div>` : ''}
      </div>`;
    };
    const emptyLine = '<div class="tiny faint" style="padding:6px 2px">还没有调用记录。生成内容后，这里会累计每次调用的输入 / 输出 tokens。</div>';

    const modelTable = st.byModel.length ? `<div class="table-wrap"><table class="data">
      <thead><tr><th>模型</th><th class="cell-num">调用</th><th class="cell-num">输入</th><th class="cell-num">输出</th><th class="cell-num">合计</th></tr></thead>
      <tbody>${st.byModel.map(m => `<tr>
        <td>${U.escape(m.name)}</td>
        <td class="cell-num">${U.num(m.calls)}</td>
        <td class="cell-num">${U.num(m.prompt)}</td>
        <td class="cell-num">${U.num(m.completion)}</td>
        <td class="cell-num"><b style="color:var(--accent-2)">${U.num(m.total)}</b></td>
      </tr>`).join('')}</tbody>
    </table></div>` : emptyLine;

    const scopeTable = st.byScope.length ? `<div class="table-wrap"><table class="data">
      <thead><tr><th>环节</th><th class="cell-num">调用</th><th class="cell-num">输入</th><th class="cell-num">输出</th><th class="cell-num">合计</th></tr></thead>
      <tbody>${st.byScope.map(m => `<tr>
        <td>${U.escape(m.name)}</td>
        <td class="cell-num">${U.num(m.calls)}</td>
        <td class="cell-num">${U.num(m.prompt)}</td>
        <td class="cell-num">${U.num(m.completion)}</td>
        <td class="cell-num"><b style="color:var(--accent-2)">${U.num(m.total)}</b></td>
      </tr>`).join('')}</tbody>
    </table></div>` : emptyLine;

    const recent = st.recent.slice(0, 12);
    const recentTable = recent.length ? `<div class="table-wrap"><table class="data">
      <thead><tr><th>时间</th><th>项目</th><th>环节</th><th>模型</th><th class="cell-num">tokens</th></tr></thead>
      <tbody>${recent.map(r => `<tr>
        <td>${U.relTime(r.at)}</td>
        <td>${U.escape(projName(r.projectId))}</td>
        <td>${U.escape(r.scope || '生成')}</td>
        <td>${U.escape(r.model || '—')}</td>
        <td class="cell-num">${r.estimated ? '≈ ' : ''}${U.num(r.total)}</td>
      </tr>`).join('')}</tbody>
    </table></div>` : emptyLine;

    const m = U.modal({
      title: 'Token 用量统计',
      wide: true,
      body: `
        <div class="grid-4" style="margin-bottom:4px">
          ${stat('全部项目', U.num(st.total.total), `${U.num(st.total.calls)} 次调用`)}
          ${stat(hasProject ? '本项目' : '本项目 · 未打开', hasProject ? U.num(st.project.total) : '—', hasProject ? `${U.num(st.project.calls)} 次调用` : '打开项目后统计')}
          ${stat('输入 tokens', U.num(st.total.prompt), 'prompt')}
          ${stat('输出 tokens', U.num(st.total.completion), 'completion')}
        </div>
        ${sectionTitle('按模型', 'Provider 未返回 usage 时按字符估算，标记为 ≈')}
        ${modelTable}
        ${sectionTitle('按环节')}
        ${scopeTable}
        ${sectionTitle('最近调用')}
        ${recentTable}
        <div class="tiny faint" style="margin-top:12px;line-height:1.8">统计随工作区保存在 settings.json；「清空统计」只清数字，不影响项目内容与已生成的文档。</div>`,
      footer: `<button class="btn btn-sm" id="usage-clear">清空统计</button><button class="btn" data-close>关闭</button>`
    });
    m.root.querySelector('#usage-clear').addEventListener('click', async function () {
      const ok = await U.confirm('清空用量统计', '将清除本机累计的调用次数与 token 记录（含各模型、各环节、最近调用），不影响项目内容。是否继续？', '清空');
      if (!ok) return;
      window.Store.clearUsage();
      m.close();
      U.toast('已清空 token 用量统计', 'ok');
      App.refresh();
    });
  };

  App.aiBadge = function () {
    const ok = App.aiReady('llm');
    return `<span class="chip ${ok ? 'teal' : 'warn'}">${ok ? '<i class="live-dot"></i> AI 已接入' : '未接入模型'}</span>`;
  };

  /* 所有生成都必须走模型：没有可用 Provider 时给出明确引导，不再回退本地模板 */
  App.requireAI = function (kind, label) {
    const type = kind || 'llm';
    const name = type === 'image' ? '图像模型' : type === 'tts' ? '语音合成模型' : type === 'video' ? '视频模型' : '语言模型';
    if (window.Store.hasAI(type)) return true;
    const m = U.modal({
      title: `还没有可用的${name}`,
      body: `<div class="small muted" style="line-height:1.9">
        生成统一走模型，本地模板已停用。<br/>
        请先在「模型配置」添加一个${name} Provider：填 Base URL、模型名、API Key，保存后即可生成。
      </div>`,
      footer: `<button class="btn" data-close>稍后</button><button class="btn btn-primary" id="go-models">去模型配置</button>`
    });
    m.root.querySelector('#go-models').addEventListener('click', function () {
      m.close();
      App.go('models');
    });
    return false;
  };

  /* 窗口控制 */
  function bindWindow() {
    document.getElementById('win-min').addEventListener('click', () => window.duanju.windowMinimize());
    document.getElementById('win-max').addEventListener('click', () => window.duanju.windowMaximize());
    document.getElementById('win-close').addEventListener('click', () => window.duanju.windowClose());
  }

  document.addEventListener('keydown', async function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && !e.repeat) {
      e.preventDefault();
      if (!window.Store.project) { U.toast('尚未打开项目', 'err'); return; }
      const ok = await window.Store.saveNow();
      if (ok) U.toast('已保存', 'ok');
    }
  });

  /* 启动 */
  async function boot() {
    bindWindow();
    if (window.duanju.onFlush) {
      let flushing = false;
      window.duanju.onFlush(async function () {
        if (flushing) return;
        flushing = true;
        try { await window.Store.saveNow(); } finally { window.duanju.forceClose(); }
      });
    }
    await window.Store.init();
    window.Store.on(function () {
      App.renderSidebar();
    });
    App.renderSidebar();
    const last = window.Store.settings.lastProjectId;
    const exists = window.Store.projects.find(p => p.id === last);
    if (last && exists) {
      try {
        await window.Store.openProject(last);
        App.go('dashboard');
        return;
      } catch (e) { /* ignore */ }
    }
    App.go('projects');
  }

  window.App = App;
  boot().catch(function (e) {
    console.error(e);
    document.getElementById('view').innerHTML = `<div class="page">${U.empty('初始化失败', U.escape(e.message))}</div>`;
  });
})();
