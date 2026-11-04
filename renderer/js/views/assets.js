/* 资产库 */
(function () {
  const U = window.U;
  const D = window.D;

  let currentType = 'all';
  let query = '';

  function matches(a, v) {
    return !v || (a.name + ' ' + (a.tags || []).join(' ') + ' ' + (a.prompt || '')).toLowerCase().includes(v.toLowerCase());
  }

  function countsFor(all, v) {
    const counts = {};
    all.forEach(a => { if (matches(a, v)) counts[a.type] = (counts[a.type] || 0) + 1; });
    return counts;
  }

  window.Views.assets = function (root, params) {
    if (!App.guardProject(root)) return;
    const p = window.Store.project;
    const all = p.assets || [];
    const hasImage = window.Store.hasAI('image');

    const types = D.assetTypes;
    const filtered = all.filter(a => (currentType === 'all' || a.type === currentType) && matches(a, query));

    const counts = countsFor(all, query);

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="ph-main">
            <div class="crumb">RESOURCE · 资产库</div>
            <div class="page-title">资产库</div>
            <div class="page-desc">角色设定、场景、道具、参考图、配音与视频素材集中管理。导入的文件会复制到项目 <span class="mono">assets/</span> 目录，随项目一起备份。</div>
          </div>
          <div class="page-actions">
            <button class="btn" id="import-file">${window.Icons.upload} 导入素材</button>
            ${hasImage ? `<button class="btn btn-ai" id="ai-image">${window.Icons.image} AI 生成图片</button>` : ''}
            <button class="btn btn-primary" id="open-folder">${window.Icons.folder} 打开资产目录</button>
          </div>
        </div>

        <div class="asset-toolbar">
          <div class="seg" id="asset-tabs">
            ${types.map(t => `<button class="${currentType === t.key ? 'active' : ''}" data-type="${t.key}">${t.label}${t.key !== 'all' && counts[t.key] ? ` ${counts[t.key]}` : ''}</button>`).join('')}
          </div>
          <div class="flex1"></div>
          <div style="position:relative;width:260px">
            <input class="input" id="asset-search" placeholder="搜索名称 / 标签 / 提示词" value="${U.escape(query)}" style="padding-left:32px" />
            <span style="position:absolute;left:10px;top:9px;color:var(--faint)">${window.Icons.search}</span>
          </div>
        </div>

        <div class="dropzone" id="dropzone">
          ${window.Icons.upload}
          <div class="mt-8 small">点击导入图片 / 音频 / 视频 / 参考文件<span class="tiny faint"> · 支持多选，文件会复制进项目 assets/</span></div>
        </div>

        ${filtered.length ? `<div class="asset-grid">${filtered.map(a => assetCard(a, p)).join('')}</div>` :
          `<div class="asset-empty">${U.empty(query ? '没有匹配的素材' : '这个分类还没有素材', query ? `没有找到包含「${U.escape(query)}」的素材，换个关键词试试。` : '导入角色设定图、场景参考、配音或视频片段，并在人物卡中绑定。', '<button class="btn" id="import-empty">' + window.Icons.upload + ' 导入素材</button>', window.Icons.assets)}</div>`}
      </div>`;

    root.querySelectorAll('[data-type]').forEach(function (el) {
      el.addEventListener('click', function () {
        currentType = el.dataset.type;
        App.refresh();
      });
    });

    const search = root.querySelector('#asset-search');
    let timer = null;
    search.addEventListener('input', function () {
      query = search.value;
      clearTimeout(timer);
      timer = setTimeout(applyFilter, 120);
    });

    // 局部过滤，避免输入时失焦
    function applyFilter() {
      const v = query;
      const list = all.filter(a => (currentType === 'all' || a.type === currentType) && matches(a, v));
      const oldGrid = root.querySelector('.asset-grid');
      if (oldGrid) oldGrid.remove();
      const oldEmpty = root.querySelector('.asset-empty');
      if (oldEmpty) oldEmpty.remove();
      const anchor = root.querySelector('.dropzone');
      if (!anchor) return;
      const box = document.createElement('div');
      box.className = list.length ? 'asset-grid' : 'asset-empty';
      box.innerHTML = list.length ? list.map(a => assetCard(a, p)).join('') :
        U.empty(v ? '没有匹配的素材' : '这个分类还没有素材', v ? `没有找到包含「${U.escape(v)}」的素材，换个关键词试试。` : '导入角色设定图、场景参考、配音或视频片段，并在人物卡中绑定。', '<button class="btn" id="import-empty">' + window.Icons.upload + ' 导入素材</button>', window.Icons.assets);
      anchor.after(box);
      if (list.length) bindCards(box);
      const impEmpty = root.querySelector('#import-empty');
      if (impEmpty) impEmpty.addEventListener('click', () => importFiles());
      const counts = countsFor(all, v);
      root.querySelectorAll('#asset-tabs [data-type]').forEach(function (btn) {
        const key = btn.dataset.type;
        const label = (D.assetTypes.find(x => x.key === key) || {}).label || key;
        const n = key === 'all' ? (v ? list.length : all.length) : (counts[key] || 0);
        btn.textContent = key !== 'all' && n ? `${label} ${n}` : label;
      });
    }

    async function importFiles(type) {
      try {
        const files = await window.duanju.pickAssets(type || (currentType === 'all' ? undefined : currentType));
        if (!files.length) return;
        const res = await window.duanju.importAssets({ projectId: p.id, type: type || (currentType === 'all' ? undefined : currentType), files, meta: {} });
        p.assets = res.project.assets;
        window.Store.touch();
        U.toast(`已导入 ${files.length} 个素材`, 'ok');
        App.refresh();
      } catch (e) {
        U.toast('导入失败：' + e.message, 'err');
      }
    }

    root.querySelector('#dropzone').addEventListener('click', () => importFiles());
    root.querySelector('#import-file').addEventListener('click', () => importFiles());
    const impEmpty = root.querySelector('#import-empty');
    if (impEmpty) impEmpty.addEventListener('click', () => importFiles());
    root.querySelector('#open-folder').addEventListener('click', () => window.duanju.openProjectFolder(p.id));

    bindCards(root);

    const aiBtn = root.querySelector('#ai-image');
    if (aiBtn) aiBtn.addEventListener('click', function () {
      if (!App.requireAI('image')) return;
      const m = U.modal({
        title: 'AI 生成图片素材',
        body: `
          <div class="field"><div class="field-label">画面描述<span class="hint">建议包含人物 / 场景 / 光线 / 风格</span></div>
          <textarea class="textarea" id="img-prompt" style="min-height:100px" placeholder="如：竖屏 9:16，夜晚旧楼道，年轻女人戴着旧耳机，特写，冷光，电影质感。"></textarea></div>
          <div class="grid-2">
            <div class="field"><div class="field-label">素材名称</div><input class="input" id="img-name" placeholder="角色设定图" /></div>
            <div class="field"><div class="field-label">尺寸</div><select class="select" id="img-size"><option value="1024x1536">竖版 1024×1536</option><option value="1024x1024">方图 1024×1024</option><option value="1536x1024">横版 1536×1024</option></select></div>
          </div>`,
        footer: `<button class="btn" data-close>取消</button><button class="btn btn-ai" id="run-img">${window.Icons.image} 生成</button>`
      });
      m.root.querySelector('#run-img').addEventListener('click', async function () {
        const prompt = m.root.querySelector('#img-prompt').value.trim();
        if (!prompt) { U.toast('请填写画面描述', 'err'); return; }
        const btn = m.root.querySelector('#run-img');
        btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> 生成中';
        try {
          await window.Gen.image(p, prompt, {
            name: m.root.querySelector('#img-name').value.trim() || 'AI 素材',
            size: m.root.querySelector('#img-size').value
          });
          m.close();
          U.toast('图片已生成', 'ok');
          App.refresh();
        } catch (e) {
          U.toast('生成失败：' + e.message, 'err');
          btn.disabled = false; btn.innerHTML = window.Icons.image + ' 生成';
        }
      });
    });

    function bindCards(scope) {
      scope.querySelectorAll('[data-preview]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          const a = all.find(x => x.id === el.dataset.preview);
          previewAsset(a);
        });
      });
      scope.querySelectorAll('[data-reveal]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          window.duanju.revealAsset({ projectId: p.id, assetId: el.dataset.reveal });
        });
      });
      scope.querySelectorAll('[data-del-asset]').forEach(function (el) {
        el.addEventListener('click', async function (e) {
          e.stopPropagation();
          const a = all.find(x => x.id === el.dataset.delAsset);
          const ok = await U.confirm('删除素材', `确认删除「${U.escape(a.name)}」？文件会同时从 assets/ 移除。`, '删除');
          if (!ok) return;
          try {
            const updated = await window.duanju.deleteAsset({ projectId: p.id, assetId: a.id });
            p.assets = updated.assets;
            window.Store.touch();
            App.refresh();
          } catch (err) { U.toast('删除失败：' + err.message, 'err'); }
        });
      });
      scope.querySelectorAll('[data-cover]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          p.cover = el.dataset.cover;
          window.Store.touch();
          U.toast('已设为项目封面', 'ok');
          App.refresh();
        });
      });
    }

    function previewAsset(a) {
      if (!a) return;
      const src = window.Store.assetUrl(a);
      let media = '';
      if (a.type === 'image') media = `<img src="${src}" style="width:100%;border-radius:10px" />`;
      else if (a.type === 'audio') media = `<audio controls src="${src}" style="width:100%"></audio>`;
      else if (a.type === 'video') media = `<video controls src="${src}" style="width:100%;border-radius:10px"></video>`;
      else media = `<div class="card-sub">该文件类型暂不支持内嵌预览，可在文件夹中打开。</div>`;
      const m = U.modal({
        title: a.name,
        wide: true,
        body: `${media}
          <div class="tiny faint mt-12" style="line-height:1.8">
            路径：${U.escape(a.path)}<br/>类型：${U.escape(a.type)} · 创建：${U.fmtDate(a.createdAt)}${a.tags?.length ? '<br/>标签：' + U.escape(a.tags.join('、')) : ''}${a.prompt ? '<br/>提示词：' + U.escape(a.prompt) : ''}
          </div>`,
        footer: `<button class="btn" data-close>关闭</button><button class="btn" id="pf">在文件夹中显示</button>`
      });
      m.root.querySelector('#pf').addEventListener('click', () => window.duanju.revealAsset({ projectId: p.id, assetId: a.id }));
    }
  };

  function assetCard(a, p) {
    const src = window.Store.assetUrl(a);
    const isImg = ['image', 'character'].includes(a.type);
    const icon = a.type === 'audio' ? window.Icons.audio : a.type === 'video' ? window.Icons.video : a.type === 'scene' ? window.Icons.image : a.type === 'prop' ? window.Icons.assets : window.Icons.file || window.Icons.assets;
    return `<div class="asset-card">
      <div class="asset-thumb" data-preview="${a.id}">
        ${isImg ? `<img src="${src}" />` : `<div class="at-icon">${icon}</div>`}
        <span class="chip tiny at-type">${labelOf(a.type)}</span>
        ${p.cover === a.id ? '<span class="chip accent tiny" style="position:absolute;top:8px;right:8px">封面</span>' : ''}
      </div>
      <div class="asset-body">
        <h5 title="${U.escape(a.name)}">${U.escape(a.name)}</h5>
        <div class="ab-sub"><span>${U.relTime(a.createdAt)}</span>${a.tags?.length ? `<span class="chip tiny">${U.escape(a.tags[0])}</span>` : ''}</div>
        <div class="asset-actions">
          <button class="btn btn-icon btn-sm btn-ghost" data-preview="${a.id}" title="预览">${window.Icons.eye}</button>
          ${isImg ? `<button class="btn btn-icon btn-sm btn-ghost" data-cover="${a.id}" title="设为封面">${window.Icons.film}</button>` : ''}
          <button class="btn btn-icon btn-sm btn-ghost" data-reveal="${a.id}" title="在文件夹中显示">${window.Icons.folder}</button>
          <button class="btn btn-icon btn-sm btn-ghost" data-del-asset="${a.id}" title="删除">${window.Icons.trash}</button>
        </div>
      </div>
    </div>`;
  }

  function labelOf(type) {
    const t = window.D.assetTypes.find(x => x.key === type);
    return t ? t.label : type;
  }
})();
