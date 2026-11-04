/* 通用工具 */
(function () {
  const U = {};

  U.escape = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  U.uid = function (prefix) {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  };

  U.getPath = function (obj, path) {
    return path.split('.').reduce(function (o, k) {
      if (o == null) return undefined;
      return o[k];
    }, obj);
  };

  U.setPath = function (obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      o = o[k];
    }
    o[keys[keys.length - 1]] = value;
  };

  U.debounce = function (fn, delay) {
    let t = null;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, delay);
    };
  };

  U.fmtDate = function (iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  U.relTime = function (iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return '刚刚';
    if (m < 60) return m + ' 分钟前';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' 小时前';
    const d = Math.floor(h / 24);
    if (d < 30) return d + ' 天前';
    return U.fmtDate(iso).slice(0, 10);
  };

  U.bytes = function (n) {
    if (!n) return '0 B';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(1) + ' MB';
  };

  /* 数字千分位，用于 token 用量 */
  U.num = function (n) {
    const v = Number(n || 0);
    return (Number.isFinite(v) ? v : 0).toLocaleString('zh-CN');
  };

  U.tokens = function (usage) {
    if (!usage) return '0';
    return U.num(usage.total || usage);
  };

  U.words = function (text) {
    return (String(text || '').replace(/\s/g, '') || '').length;
  };

  U.toast = function (message, type) {
    const root = document.getElementById('toast-root');
    const item = document.createElement('div');
    item.className = 'toast ' + (type || '');
    item.innerHTML = `<span class="t-dot"></span><span>${U.escape(message)}</span>`;
    root.appendChild(item);
    setTimeout(function () {
      item.style.opacity = '0';
      item.style.transform = 'translateY(6px)';
      item.style.transition = '.18s';
      setTimeout(function () { item.remove(); }, 220);
    }, type === 'err' ? 4200 : 2400);
  };

  U.modal = function (opts) {
    const root = document.getElementById('modal-root');
    const mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML = `
      <div class="modal ${opts.wide ? 'wide' : ''}">
        <div class="modal-head">
          <h3>${U.escape(opts.title || '')}</h3>
          <div style="margin-left:auto"><button class="btn btn-icon btn-ghost" data-close>${window.Icons.x}</button></div>
        </div>
        <div class="modal-body">${opts.body || ''}</div>
        ${opts.footer === null ? '' : `<div class="modal-foot">${opts.footer || '<button class="btn" data-close>关闭</button>'}</div>`}
      </div>`;
    root.appendChild(mask);
    const close = function () { mask.remove(); };
    mask.addEventListener('click', function (e) {
      if (e.target === mask || e.target.closest('[data-close]')) close();
    });
    if (opts.onMount) opts.onMount(mask, close);
    return { root: mask, close };
  };

  U.confirm = function (title, text, okText) {
    return new Promise(function (resolve) {
      const m = U.modal({
        title: title,
        body: `<div class="small muted" style="line-height:1.8">${text}</div>`,
        footer: `<button class="btn" data-close>取消</button><button class="btn btn-primary" data-ok>${okText || '确认'}</button>`
      });
      m.root.querySelector('[data-ok]').addEventListener('click', function () {
        m.close();
        resolve(true);
      });
      m.root.addEventListener('click', function (e) {
        if (e.target === m.root) resolve(false);
        if (e.target.closest('[data-close]')) resolve(false);
      });
    });
  };

  U.formObj = function (root) {
    const out = {};
    root.querySelectorAll('[data-path]').forEach(function (input) {
      const path = input.dataset.path;
      out[path] = input.type === 'checkbox' ? input.checked : input.value;
    });
    return out;
  };

  U.bind = function (root, getObj, onChange) {
    root.querySelectorAll('[data-path]').forEach(function (input) {
      const set = function () {
        const obj = getObj();
        const v = input.type === 'checkbox' ? input.checked : input.value;
        U.setPath(obj, input.dataset.path, v);
        if (onChange) onChange(input.dataset.path, v);
      };
      input.addEventListener('input', set);
      input.addEventListener('change', set);
    });
  };

  U.renderFields = function (fields, obj, prefix) {
    return fields.map(function (f) {
      const path = (prefix ? prefix + '.' : '') + f.key;
      const val = U.getPath(obj, path);
      if (f.type === 'textarea') {
        return `<div class="field">
          <div class="field-label">${f.label}${f.required ? '<span class="req">必填</span>' : ''}${f.hint ? `<span class="hint">${f.hint}</span>` : ''}</div>
          <textarea class="textarea" data-path="${path}" placeholder="${U.escape(f.placeholder || '')}" style="min-height:${f.rows ? f.rows * 22 + 28 : 76}px">${U.escape(val || '')}</textarea>
        </div>`;
      }
      if (f.type === 'select') {
        const option = (o) => `<option value="${U.escape(o)}" ${o === val ? 'selected' : ''}>${U.escape(o)}</option>`;
        const body = f.groups
          ? `${f.allowEmpty ? `<option value="" ${!val ? 'selected' : ''}>未选择</option>` : ''}${f.groups.map(g => `<optgroup label="${U.escape(g.label)}">${g.items.map(option).join('')}</optgroup>`).join('')}`
          : (f.options || []).map(option).join('');
        return `<div class="field">
          <div class="field-label">${f.label}${f.required ? '<span class="req">必填</span>' : ''}</div>
          <select class="select" data-path="${path}">${body}</select>
        </div>`;
      }
      if (f.type === 'checkbox') {
        return `<div class="field">
          <label class="field-label" style="cursor:pointer;display:flex;align-items:center;gap:8px">
            <input type="checkbox" data-path="${path}" ${val ? 'checked' : ''} style="width:15px;height:15px;accent-color:#ff6a4d" />
            ${f.label}
          </label>
        </div>`;
      }
      return `<div class="field">
        <div class="field-label">${f.label}${f.required ? '<span class="req">必填</span>' : ''}${f.hint ? `<span class="hint">${f.hint}</span>` : ''}</div>
        <input class="input" data-path="${path}" value="${U.escape(val || '')}" placeholder="${U.escape(f.placeholder || '')}" />
      </div>`;
    }).join('');
  };

  U.empty = function (title, desc, actionHtml, icon) {
    return `<div class="empty">
      <div class="e-icon">${icon || window.Icons.spark}</div>
      <h4>${U.escape(title)}</h4>
      <p>${desc || ''}</p>
      ${actionHtml || ''}
    </div>`;
  };

  U.byId = function (id) { return document.getElementById(id); };

  U.coverUrl = function (project) {
    const asset = (project.assets || []).find(a => a.id === project.cover || (a.type === 'image' && a.linkId === 'cover'));
    if (!asset) return '';
    return 'file:///' + encodeURI(U.projectAssetPath(asset.path));
  };

  U.projectDirCache = null;
  U.projectAssetPath = function (rel) {
    return (U.projectDirCache || '') + '/' + rel;
  };

  window.U = U;
})();
