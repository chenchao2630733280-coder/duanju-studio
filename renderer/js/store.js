/* 全局状态与持久化 */
(function () {
  const api = window.duanju;

  const Store = {
    info: null,
    settings: { providers: [], routing: {} },
    projects: [],
    project: null,
    dirty: false,
    saving: false,
    listeners: [],

    on(fn) { this.listeners.push(fn); },
    emit() { this.listeners.forEach(fn => { try { fn(this); } catch (e) { console.error(e); } }); },

    async init() {
      this.info = await api.info();
      this.settings = await api.getSettings();
      this.ensureUsage();
      await this.reloadProjects();
    },

    async reloadProjects() {
      this.projects = await api.listProjects();
      this.emit();
    },

    async createProject(name, overview) {
      const project = await api.createProject({ name, overview });
      this.projects = await api.listProjects();
      await this.openProject(project.id);
      return project;
    },

    async openProject(id) {
      const project = await api.loadProject(id);
      this.project = project;
      window.U.projectDirCache = this.info.workspace.replace(/\\/g, '/') + '/projects/' + id;
      this.settings.lastProjectId = id;
      await api.saveSettings(this.settings);
      this.dirty = false;
      this.updateSaveState();
      this.emit();
      return project;
    },

    closeProject() {
      this.project = null;
      this.emit();
    },

    touch() {
      this.dirty = true;
      this.updateSaveState();
      this.emit();
      this.queueSave();
    },

    queueSave: null,

    updateSaveState() {
      const el = document.getElementById('save-state');
      if (!el) return;
      if (this.saving) {
        el.className = 'save-state dirty';
        el.innerHTML = '<i></i>保存中…';
      } else if (this.dirty) {
        el.className = 'save-state dirty';
        el.innerHTML = '<i></i>未保存';
      } else {
        el.className = 'save-state';
        el.innerHTML = '<i></i>已保存';
      }
    },

    async saveNow() {
      if (!this.project) return false;
      this.saving = true;
      this.updateSaveState();
      try {
        await api.saveProject(this.project);
        this.dirty = false;
        return true;
      } catch (e) {
        window.U.toast('保存失败：' + e.message, 'err');
        return false;
      } finally {
        this.saving = false;
        this.updateSaveState();
        try {
          this.projects = await api.listProjects();
        } catch { /* 列表刷新失败不影响保存结果 */ }
      }
    },

    async deleteProject(id) {
      await api.deleteProject(id);
      if (this.project && this.project.id === id) this.project = null;
      if (this.settings.lastProjectId === id) {
        this.settings.lastProjectId = '';
        await api.saveSettings(this.settings);
      }
      await this.reloadProjects();
      this.emit();
    },

    saveSettings() {
      api.saveSettings(this.settings);
    },

    providersFor(kind) {
      return (this.settings.providers || []).filter(p => p.kind === kind && p.enabled !== false);
    },

    providerFor(kind) {
      const route = this.settings.routing || {};
      const routed = route[kind];
      let p = routed ? (this.settings.providers || []).find(x => x.id === routed) : null;
      if (!p) p = this.providersFor(kind)[0];
      return p || null;
    },

    hasAI(kind) {
      const p = this.providerFor(kind || 'llm');
      return !!(p && p.baseUrl && p.model && p.apiKey);
    },

    /* ---------------- Token 用量统计 ---------------- */
    usage: null,

    ensureUsage() {
      const s = this.settings || (this.settings = {});
      const empty = function () { return { calls: 0, prompt: 0, completion: 0, total: 0 }; };
      const u = s.usage && typeof s.usage === 'object' ? s.usage : {};
      u.total = Object.assign(empty(), u.total || {});
      u.byProject = u.byProject || {};
      u.byModel = u.byModel || {};
      u.byScope = u.byScope || {};
      u.recent = Array.isArray(u.recent) ? u.recent : [];
      s.usage = u;
      this.usage = u;
      return u;
    },

    recordUsage(rec) {
      const u = this.ensureUsage();
      const t = (rec && rec.usage) || {};
      const prompt = Number(t.prompt || 0);
      const completion = Number(t.completion || 0);
      const total = Number(t.total || prompt + completion);
      const projectId = rec.projectId || (this.project && this.project.id) || '';
      const model = rec.model || '未命名模型';
      const scope = rec.scope || '生成';
      const bump = function (bucket) {
        bucket.calls = Number(bucket.calls || 0) + 1;
        bucket.prompt = Number(bucket.prompt || 0) + prompt;
        bucket.completion = Number(bucket.completion || 0) + completion;
        bucket.total = Number(bucket.total || 0) + total;
        return bucket;
      };
      bump(u.total);
      bump(u.byProject[projectId] || (u.byProject[projectId] = { calls: 0, prompt: 0, completion: 0, total: 0 }));
      bump(u.byModel[model] || (u.byModel[model] = { calls: 0, prompt: 0, completion: 0, total: 0 }));
      bump(u.byScope[scope] || (u.byScope[scope] = { calls: 0, prompt: 0, completion: 0, total: 0 }));
      u.recent.unshift({
        at: new Date().toISOString(),
        projectId, scope, model,
        provider: rec.provider || '',
        prompt, completion, total,
        estimated: !!rec.estimated,
        durationMs: Number(rec.durationMs || 0)
      });
      u.recent = u.recent.slice(0, 60);
      this.saveSettings();
      this.emit();
      return u.total;
    },

    usageOf(projectId) {
      const u = this.ensureUsage();
      const pid = projectId || (this.project && this.project.id) || '';
      return {
        total: u.total,
        project: u.byProject[pid] || { calls: 0, prompt: 0, completion: 0, total: 0 },
        byModel: u.byModel,
        byScope: u.byScope,
        recent: u.recent
      };
    },

    clearUsage() {
      const u = this.ensureUsage();
      u.total = { calls: 0, prompt: 0, completion: 0, total: 0 };
      u.byProject = {};
      u.byModel = {};
      u.byScope = {};
      u.recent = [];
      this.saveSettings();
      this.emit();
    },

    assetsOfType(type) {
      if (!this.project) return [];
      return (this.project.assets || []).filter(a => type === 'all' || a.type === type);
    },

    assetUrl(asset) {
      if (!asset) return '';
      return 'file:///' + encodeURI(window.U.projectDirCache + '/' + asset.path).replace(/#/g, '%23');
    },

    addActivity(text) {
      if (!this.project) return;
      this.project.activity = this.project.activity || [];
      this.project.activity.unshift({ at: new Date().toISOString(), text });
      this.project.activity = this.project.activity.slice(0, 30);
    }
  };

  Store.queueSave = window.U.debounce(function () { Store.saveNow(); }, 900);

  window.Store = Store;
})();
