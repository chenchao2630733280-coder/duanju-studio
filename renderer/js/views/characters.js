/* 人物系统：人物卡 + 深度工坊 + 关系 7 问 */
(function () {
  const U = window.U;
  const D = window.D;

  window.Views.characters = function (root, params) {
    if (!App.guardProject(root)) return;
    const p = window.Store.project;
    const chars = p.characters || [];
    const rels = p.relations || [];

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="ph-main">
            <div class="crumb">${D.phaseLabel(D.gateOf('characters'))} · 故事规格 / 节点 04</div>
            <div class="page-title"><span class="step-no">04</span>人物系统</div>
            <div class="page-desc">人物卡回答“你是谁”，深度工坊回答“你像不像活人”。主角与核心对手至少填 5 项；④ 习惯动作、⑤ 不愿提的记忆、⑥ 常说的谎、⑧ 又爱又气的缺点为必填。</div>
          </div>
          <div class="page-actions">
            <button class="btn" id="add-char">${window.Icons.plus} 新增人物</button>
            <button class="btn btn-ai" id="ai-chars">${window.Icons.spark} AI 生成人物系统</button>
            <button class="btn btn-primary" id="next-step">对手系统 ${window.Icons.arrowRight}</button>
          </div>
        </div>

        ${D.nodeRailHtml('g1', p, 'characters')}

        ${chars.length ? `<div class="char-grid">${chars.map(charCard).join('')}</div>` : U.empty('还没有人物', '至少需要 6—8 名核心人物：主角、核心对手、情感关系、盟友、潜在背叛者、秘密持有者与镜像人物。', '<button class="btn btn-ai" id="empty-gen">' + window.Icons.spark + ' AI 生成人物系统</button>')}

        <div class="section">
          <div class="section-head">
            <div class="section-title">人物关系 · 7 问 · ${rels.length}</div>
            <div class="section-line"></div>
            <button class="btn btn-sm" id="add-rel">${window.Icons.plus} 新增关系</button>
          </div>
          ${rels.length ? `<div class="grid-2">${rels.map(relCard).join('')}</div>` : `<div class="card"><div class="tiny faint" style="line-height:1.8">关系不是“他们认识”，而是“他们互相想得到什么、为什么不能说、误解了什么、共同利益、最终冲突，以及三次变化”。</div></div>`}
        </div>
      </div>`;

    App.bindNodes(root);

    root.querySelectorAll('.char-card').forEach(function (el) {
      el.addEventListener('click', function () {
        const ch = chars.find(c => c.id === el.dataset.char);
        if (ch) openDrawer(ch);
      });
    });

    root.querySelector('#add-char').addEventListener('click', function () {
      const ch = {
        id: U.uid('char'), name: '新人物', role: '主角', age: '', look: '', surface: '', desire: '',
        fear: '', secret: '', weakness: '', ability: '', bottomLine: '', lie: '', relation: '', wants: '',
        stanceEarly: '', stanceMid: '', stanceFinal: '', ending: '', depth: {}, voiceNote: '', assetIds: []
      };
      p.characters = chars.concat([ch]);
      window.Store.touch();
      openDrawer(ch);
    });

    async function generate() {
      if (!App.requireAI('llm')) return;
      if ((p.characters || []).length && !(await U.confirm('覆盖人物系统', 'AI 将整体替换当前人物与关系，已有手工编辑会丢失。是否继续？', '覆盖生成'))) return;
      const btn = root.querySelector('#ai-chars') || root.querySelector('#empty-gen');
      const origin = btn ? btn.innerHTML : '';
      root.querySelectorAll('#ai-chars,#empty-gen').forEach(b => { b.disabled = true; });
      if (btn) btn.innerHTML = '<span class="spinner"></span> AI 生成中…';
      try {
        await window.Gen.aiFill('characters', p);
        U.toast('AI 已生成人物系统，请复核' + window.Gen.usageText(), 'ok');
        App.refresh();
      } catch (e) {
        U.toast('生成失败：' + e.message, 'err');
        root.querySelectorAll('#ai-chars,#empty-gen').forEach(b => { b.disabled = false; });
        if (btn) btn.innerHTML = origin;
      }
    }
    const aiBtn = root.querySelector('#ai-chars');
    if (aiBtn) aiBtn.addEventListener('click', generate);
    const emptyGen = root.querySelector('#empty-gen');
    if (emptyGen) emptyGen.addEventListener('click', generate);

    root.querySelector('#add-rel').addEventListener('click', function () {
      openRelation(null);
    });
    root.querySelectorAll('[data-rel]').forEach(function (el) {
      el.addEventListener('click', function () {
        openRelation(rels.find(r => r.id === el.dataset.rel));
      });
    });

    root.querySelector('#next-step').addEventListener('click', () => App.go('step', { id: 'rival' }));

    /* ---------------- 人物卡 ---------------- */
    function charCard(ch) {
      const filled = D.depths.filter(d => String(ch.depth?.[d.key] || '').trim()).length;
      const initial = (ch.name || '?').slice(0, 1);
      const assets = (ch.assetIds || []).length;
      return `<div class="card card-hover char-card" data-char="${ch.id}">
        <div class="flex between" style="align-items:flex-start">
          <div class="char-avatar">${U.escape(initial)}</div>
          ${ch.role === '主角' ? '<span class="chip accent">主角</span>' : ch.role === '核心对手' ? '<span class="chip violet">对手</span>' : `<span class="chip">${U.escape(ch.role || '')}</span>`}
        </div>
        <h4>${U.escape(ch.name || '未命名')}</h4>
        <div class="cc-role">${U.escape(ch.age || '')}${ch.age ? ' · ' : ''}${U.escape(ch.role || '')}</div>
        <div class="cc-line">${U.escape(ch.surface || ch.desire || '尚未填写人物卡。')}</div>
        <div class="cc-foot">
          <span class="chip ${filled >= 5 ? 'teal' : 'warn'}">深度 ${filled}/10</span>
          ${assets ? `<span class="chip">${assets} 素材</span>` : ''}
          <span class="tiny faint" style="margin-left:auto">${U.escape((ch.voiceNote || '').slice(0, 12))}</span>
        </div>
      </div>`;
    }

    function relCard(rel) {
      const a = chars.find(c => c.id === rel.aId);
      const b = chars.find(c => c.id === rel.bId);
      return `<div class="card card-hover" data-rel="${rel.id}" style="cursor:pointer">
        <div class="flex between center">
          <div style="font-size:13.5px;font-weight:650">${U.escape(a?.name || rel.aName || 'A')} <span class="faint" style="font-weight:400">⇄</span> ${U.escape(b?.name || rel.bName || 'B')}</div>
          <span class="chip">${(rel.change1 || rel.change2 || rel.change3) ? '有变化' : '待补充'}</span>
        </div>
        <div class="tiny muted mt-8" style="line-height:1.75;height:38px;overflow:hidden">${U.escape(rel.conflict || rel.wantA || '尚未填写关系张力。')}</div>
        <div class="tiny faint mt-8">${U.escape(rel.change1 || '')}</div>
      </div>`;
    }

    /* ---------------- 人物抽屉 ---------------- */
    function openDrawer(ch) {
      const root2 = document.getElementById('modal-root');
      const mask = document.createElement('div');
      mask.className = 'drawer-mask';
      const assets = (p.assets || []).filter(a => a.type === 'image' || a.type === 'character');
      mask.innerHTML = `
        <div class="drawer">
          <div class="drawer-head">
            <div class="char-avatar" style="width:34px;height:34px;font-size:13px">${U.escape((ch.name || '?').slice(0, 1))}</div>
            <div style="flex:1">
              <div class="flex gap-8 center"><input class="input" data-path="name" value="${U.escape(ch.name)}" style="font-size:14px;font-weight:650;background:transparent;border-color:transparent;padding:2px 4px;width:180px" /></div>
              <div class="tiny faint">人物卡 · 深度工坊 · 素材绑定</div>
            </div>
            <button class="btn btn-icon btn-ghost" data-close>${window.Icons.x}</button>
          </div>
          <div class="drawer-body">
            <div class="section-head"><div class="section-title">人物卡</div><div class="section-line"></div></div>
            <div class="grid-2">
              ${U.renderFields([
                { key: 'role', label: '角色定位', type: 'select', options: D.roles },
                { key: 'age', label: '年龄' },
                { key: 'look', label: '外在特征' },
                { key: 'surface', label: '表面性格' },
                { key: 'desire', label: '真实欲望', type: 'textarea', rows: 2 },
                { key: 'fear', label: '最怕面对的事', type: 'textarea', rows: 2 },
                { key: 'secret', label: '秘密', type: 'textarea', rows: 2 },
                { key: 'weakness', label: '弱点', type: 'textarea', rows: 2 },
                { key: 'ability', label: '最擅长能力' },
                { key: 'bottomLine', label: '底线' },
                { key: 'lie', label: '常说的谎话', type: 'textarea', rows: 2 },
                { key: 'relation', label: '与主角的关系' },
                { key: 'wants', label: '想从主角身上得到什么', type: 'textarea', rows: 2 },
                { key: 'stanceEarly', label: '立场 · 前期' },
                { key: 'stanceMid', label: '立场 · 中段' },
                { key: 'stanceFinal', label: '立场 · 终局' },
                { key: 'ending', label: '结局', type: 'textarea', rows: 2 }
              ], ch)}
            </div>
            <div class="field">
              <div class="field-label">口吻与说话方式</div>
              <textarea class="textarea" data-path="voiceNote" style="min-height:56px" placeholder="如：短句、少形容词；提到母亲时会停顿。">${U.escape(ch.voiceNote || '')}</textarea>
            </div>

            <div class="section-head" style="margin-top:22px">
              <div class="section-title">深度工坊 · 10 项</div>
              <div class="section-line"></div>
              <span class="section-hint">${D.depths.filter(d => String(ch.depth?.[d.key] || '').trim()).length}/10</span>
            </div>
            <div class="tiny muted" style="line-height:1.8;margin-bottom:12px">主角与核心对手至少填 5 项；④⑤⑥⑧ 必填。这里决定人物像不像活人。</div>
            ${D.depths.map(d => `
              <div class="depth-item">
                <label><b>${d.no}</b>${d.label}${d.must ? '<span class="req" style="color:var(--accent)">必填</span>' : ''}</label>
                <textarea class="textarea" data-depth="${d.key}" style="min-height:46px" placeholder="${U.escape(d.ph || '')}">${U.escape(ch.depth?.[d.key] || '')}</textarea>
              </div>`).join('')}

            <div class="section-head" style="margin-top:22px">
              <div class="section-title">绑定素材 · ${(ch.assetIds || []).length}</div>
              <div class="section-line"></div>
            </div>
            ${assets.length ? `<div class="chip-row">
              ${assets.map(a => `<button class="chip ${(ch.assetIds || []).includes(a.id) ? 'accent' : ''}" data-link-asset="${a.id}">${U.escape(a.name)}</button>`).join('')}
            </div>` : `<div class="tiny faint">资产库中还没有图片或角色素材。先到「资产库」上传角色设定图，再回来绑定。</div>`}

            <div class="divider" style="margin:24px 0 16px"></div>
            <div class="flex between center">
              <div class="tiny faint">所有修改即时保存到项目目录</div>
              <button class="btn btn-danger btn-sm" id="del-char">${window.Icons.trash} 删除人物</button>
            </div>
          </div>
        </div>`;
      root2.appendChild(mask);

      const close = () => { mask.remove(); App.refresh(); };
      mask.addEventListener('click', function (e) {
        if (e.target === mask || e.target.closest('[data-close]')) close();
      });
      U.bind(mask, () => ch, () => window.Store.touch());
      mask.querySelectorAll('[data-depth]').forEach(function (ta) {
        ta.addEventListener('input', function () {
          ch.depth = ch.depth || {};
          ch.depth[ta.dataset.depth] = ta.value;
          window.Store.touch();
        });
      });
      mask.querySelectorAll('[data-link-asset]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          ch.assetIds = ch.assetIds || [];
          const id = btn.dataset.linkAsset;
          const i = ch.assetIds.indexOf(id);
          if (i >= 0) ch.assetIds.splice(i, 1); else ch.assetIds.push(id);
          btn.classList.toggle('accent', ch.assetIds.includes(id));
          window.Store.touch();
        });
      });
      mask.querySelector('#del-char').addEventListener('click', async function () {
        const ok = await U.confirm('删除人物', `确认删除「${U.escape(ch.name)}」？相关关系条目会保留但失去关联。`, '删除');
        if (!ok) return;
        p.characters = (p.characters || []).filter(c => c.id !== ch.id);
        window.Store.touch();
        close();
      });
    }

    /* ---------------- 关系弹窗 ---------------- */
    function openRelation(rel) {
      const isNew = !rel;
      const item = rel || {
        id: U.uid('rel'), aId: chars[0]?.id || '', bId: chars[1]?.id || '',
        wantA: '', wantB: '', cannotSay: '', misread: '', shared: '', conflict: '',
        change1: '', change2: '', change3: ''
      };
      const options = chars.map(c => `<option value="${c.id}" ${c.id === item.aId ? 'selected' : ''}>${U.escape(c.name)}</option>`).join('');
      const optionsB = chars.map(c => `<option value="${c.id}" ${c.id === item.bId ? 'selected' : ''}>${U.escape(c.name)}</option>`).join('');
      const m = U.modal({
        title: isNew ? '新增人物关系' : '人物关系 · 7 问',
        wide: true,
        body: `
          <div class="grid-2">
            <div class="field"><div class="field-label">A 方</div><select class="select" id="rel-a">${options}</select></div>
            <div class="field"><div class="field-label">B 方</div><select class="select" id="rel-b">${optionsB}</select></div>
          </div>
          ${U.renderFields([
            { key: 'wantA', label: 'A 想从 B 得到什么', type: 'textarea', rows: 2 },
            { key: 'wantB', label: 'B 想从 A 得到什么', type: 'textarea', rows: 2 },
            { key: 'cannotSay', label: 'A 为什么不能直说', type: 'textarea', rows: 2 },
            { key: 'misread', label: 'B 误解了 A 什么', type: 'textarea', rows: 2 },
            { key: 'shared', label: '两人共同利益 / 共同伤口', type: 'textarea', rows: 2 },
            { key: 'conflict', label: '最终冲突点', type: 'textarea', rows: 2 },
            { key: 'change1', label: '第一次关系变化', type: 'textarea', rows: 2 },
            { key: 'change2', label: '第二次关系变化', type: 'textarea', rows: 2 },
            { key: 'change3', label: '第三次关系变化', type: 'textarea', rows: 2 }
          ], item)}`,
        footer: `<button class="btn" data-close>取消</button><button class="btn btn-primary" id="save-rel">保存关系</button>`
      });
      U.bind(m.root, () => item);
      m.root.querySelector('#save-rel').addEventListener('click', function () {
        item.aId = m.root.querySelector('#rel-a').value;
        item.bId = m.root.querySelector('#rel-b').value;
        if (isNew) p.relations = (p.relations || []).concat([item]);
        window.Store.touch();
        m.close();
        App.refresh();
      });
    }
  };
})();
