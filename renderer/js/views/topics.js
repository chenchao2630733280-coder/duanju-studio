/* 选题库：独立于项目，按参数生成高概念候选 */
(function () {
  const U = window.U;
  const D = window.D;

  window.Views.topics = function (root) {
    const Store = window.Store;
    const p = Store.project;
    const settings = Store.settings;
    const params = settings.topicParams || (settings.topicParams = {
      genre: '', count: 6, emotions: [], audience: '', platform: '抖音',
      episodes: 60, duration: '1—3分钟', preference: '', avoid: ''
    });
    const candidates = settings.topicCandidates || [];
    const emos = params.emotions || [];

    const genreOptions = D.genreGroups.map(g =>
      `<optgroup label="${U.escape(g.label)}">${g.items.map(x => `<option value="${U.escape(x)}" ${params.genre === x ? 'selected' : ''}>${U.escape(x)}</option>`).join('')}</optgroup>`
    ).join('');

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="ph-main">
            <div class="crumb">立项 · 选题</div>
            <div class="page-title">选题库</div>
            <div class="page-desc">候选独立于项目保存，可反复生成与比较。当前项目：${p ? U.escape(p.name) : '未打开（可直接新建项目）'}。</div>
          </div>
          <div class="page-actions">
            ${p ? `<button class="btn" id="back-project">${window.Icons.arrowLeft} 回当前项目</button>` : ''}
            <button class="btn btn-ai" id="gen-topics">${window.Icons.wand} 生成候选</button>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-title">${window.Icons.compass} 生成参数</div>
            <div class="card-more"><span class="chip">只影响本次生成</span></div>
          </div>
          <div class="grid-3">
            <div class="field">
              <div class="field-label">类型聚焦</div>
              <select class="select" id="tp-genre">
                <option value="">跨类型发散</option>
                ${genreOptions}
              </select>
            </div>
            <div class="field">
              <div class="field-label">候选数量<span class="hint">3—12 个</span></div>
              <input class="input" id="tp-count" type="number" min="3" max="12" value="${Number(params.count || 6)}" />
            </div>
            <div class="field">
              <div class="field-label">目标平台</div>
              <input class="input" id="tp-platform" value="${U.escape(params.platform || '')}" placeholder="抖音 / 快手 / 微信" />
            </div>
            <div class="field">
              <div class="field-label">目标受众</div>
              <input class="input" id="tp-audience" value="${U.escape(params.audience || '')}" placeholder="如：25—40 岁女性" />
            </div>
            <div class="field">
              <div class="field-label">总集数</div>
              <input class="input" id="tp-episodes" type="number" min="1" value="${Number(params.episodes || 60)}" />
            </div>
            <div class="field">
              <div class="field-label">单集时长</div>
              <input class="input" id="tp-duration" value="${U.escape(params.duration || '1—3分钟')}" />
            </div>
          </div>
          <div class="field">
            <div class="field-label">核心情绪<span class="hint">可多选</span></div>
            <div class="chip-row" id="tp-emos">
              ${D.emotions.map(e => `<button class="chip ${emos.includes(e) ? 'accent' : ''}" data-tp-emo="${U.escape(e)}">${U.escape(e)}</button>`).join('')}
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <div class="field-label">方向偏好<span class="hint">可写题材方向、人物职业、想试的设定</span></div>
              <textarea class="textarea" id="tp-preference" style="min-height:64px" placeholder="如：想做声音 / 遗物相关的职业，偏悬疑但不惊悚">${U.escape(params.preference || '')}</textarea>
            </div>
            <div class="field">
              <div class="field-label">必须规避</div>
              <textarea class="textarea" id="tp-avoid" style="min-height:64px" placeholder="如：不要总裁、不要重生复仇、不要失忆">${U.escape(params.avoid || '')}</textarea>
            </div>
          </div>
          <div class="flex between center mt-8">
            <span class="tiny faint">候选会保存在设置中，切换项目或重启应用都不会丢失。</span>
            <button class="btn btn-ai" id="gen-topics-2">${window.Icons.wand} 生成 ${Number(params.count || 6)} 个候选</button>
          </div>
        </div>

        <div class="section">
          <div class="section-head">
            <div class="section-title">高概念候选 · ${candidates.length}</div>
            <div class="section-line"></div>
            ${candidates.length ? `<span class="tiny faint">按生成时间倒序</span>` : ''}
          </div>
          <div class="section-hint" style="margin:-4px 0 12px">挑一个“心里一紧”的：应用到当前项目，或直接以它新建项目。应用后仍可在「私货与立项」中调整蓝图。</div>
          ${candidates.length
            ? `<div class="grid-3" id="topic-grid">${candidates.map((c, i) => card(c, i)).join('')}</div>`
            : U.empty('还没有候选', '设定类型、情绪、平台与方向偏好后生成：每个候选都会给出独特设定、关键物件、核心冲突与第一集钩子。', '<button class="btn btn-ai" id="gen-empty">' + window.Icons.wand + ' 生成候选</button>')}
        </div>
      </div>`;

    function card(c, i) {
      return `<div class="card card-hover" style="display:flex;flex-direction:column">
        <div class="flex between center">
          <span class="tiny faint mono">${String(i + 1).padStart(2, '0')}</span>
          <div class="flex gap-6">
            <button class="btn btn-icon btn-sm btn-ghost" data-tp-edit="${i}" title="编辑">${window.Icons.edit}</button>
            <button class="btn btn-icon btn-sm btn-ghost" data-tp-del="${i}" title="删除">${window.Icons.trash}</button>
          </div>
        </div>
        <div style="font-size:15px;font-weight:650;margin:8px 0 6px">${U.escape(c.title || '未命名')}</div>
        <div class="chip-row" style="margin-bottom:8px">
          ${c.genre ? `<span class="chip accent">${U.escape(c.genre)}</span>` : ''}
          ${c.emotion ? `<span class="chip teal">${U.escape(c.emotion)}</span>` : ''}
          ${c.profession ? `<span class="chip">${U.escape(c.profession)}</span>` : ''}
        </div>
        <div class="card-sub" style="min-height:66px">${U.escape(c.logline || '')}</div>
        <div class="tiny muted mt-8" style="line-height:1.7">独特设定：${U.escape(c.unique || '—')}</div>
        <div class="tiny muted" style="line-height:1.7">关键物件：${U.escape(c.object || '—')}</div>
        <div class="tiny muted" style="line-height:1.7">第一集钩子：${U.escape(c.hook || '—')}</div>
        <div class="flex gap-6 mt-12" style="margin-top:auto">
          <button class="btn btn-sm" data-tp-new="${i}">${window.Icons.plus} 新建项目</button>
          <button class="btn btn-sm ${p ? 'btn-ai' : 'btn-ghost'}" data-tp-apply="${i}" ${p ? '' : 'disabled title="先打开一个项目"'}>应用</button>
        </div>
      </div>`;
    }

    function collect() {
      params.genre = root.querySelector('#tp-genre').value;
      params.count = Math.min(12, Math.max(3, Number(root.querySelector('#tp-count').value) || 6));
      params.platform = root.querySelector('#tp-platform').value.trim();
      params.audience = root.querySelector('#tp-audience').value.trim();
      params.episodes = Math.max(1, Number(root.querySelector('#tp-episodes').value) || 60);
      params.duration = root.querySelector('#tp-duration').value.trim() || '1—3分钟';
      params.preference = root.querySelector('#tp-preference').value.trim();
      params.avoid = root.querySelector('#tp-avoid').value.trim();
      Store.saveSettings();
      return params;
    }

    root.querySelectorAll('[data-tp-emo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const e = btn.dataset.tpEmo;
        const arr = params.emotions || (params.emotions = []);
        const i = arr.indexOf(e);
        if (i >= 0) arr.splice(i, 1); else arr.push(e);
        btn.classList.toggle('accent', arr.includes(e));
        Store.saveSettings();
      });
    });

    root.querySelectorAll('#tp-genre,#tp-count,#tp-platform,#tp-audience,#tp-episodes,#tp-duration,#tp-preference,#tp-avoid').forEach(function (el) {
      el.addEventListener('change', collect);
    });

    async function generate(btn) {
      if (!App.requireAI('llm')) return;
      collect();
      const buttons = [root.querySelector('#gen-topics'), root.querySelector('#gen-topics-2'), root.querySelector('#gen-empty')].filter(Boolean);
      const origin = btn ? btn.innerHTML : '';
      buttons.forEach(b => { b.disabled = true; });
      if (btn) btn.innerHTML = '<span class="spinner"></span> 生成中';
      try {
        const list = await window.Gen.aiTopicCandidates(params);
        settings.topicCandidates = list.concat(candidates).slice(0, 32);
        Store.saveSettings();
        if (p) Store.addActivity(`生成 ${list.length} 个选题候选${params.genre ? `（${params.genre}）` : ''}`);
        U.toast(`已生成 ${list.length} 个选题候选${window.Gen.usageText ? window.Gen.usageText() : ''}`, 'ok');
        App.refresh();
      } catch (e) {
        U.toast('生成失败：' + e.message, 'err');
        buttons.forEach(b => { b.disabled = false; });
        if (btn) btn.innerHTML = origin;
      }
    }

    ['#gen-topics', '#gen-topics-2', '#gen-empty'].forEach(function (sel) {
      const el = root.querySelector(sel);
      if (el) el.addEventListener('click', function () { generate(el); });
    });

    const back = root.querySelector('#back-project');
    if (back) back.addEventListener('click', () => App.go('dashboard'));

    root.querySelectorAll('[data-tp-apply]').forEach(function (el) {
      el.addEventListener('click', function () {
        const c = candidates[Number(el.dataset.tpApply)];
        if (!c || !p) return;
        const ov = p.overview || (p.overview = {});
        ov.concepts = ov.concepts || [];
        let idx = ov.concepts.findIndex(x => x.title === c.title && x.logline === c.logline);
        if (idx < 0) { ov.concepts.push(c); idx = ov.concepts.length - 1; }
        ov.choseConcept = idx;
        ov.title = c.title;
        ov.logline = c.logline;
        if (c.genre) ov.genre = c.genre;
        if (c.emotion) {
          ov.emotions = ov.emotions || [];
          if (!ov.emotions.includes(c.emotion)) ov.emotions.push(c.emotion);
        }
        p.name = c.title;
        Store.addActivity('应用选题：' + c.title);
        Store.touch();
        U.toast('已应用到当前项目', 'ok');
        App.go('topic');
      });
    });

    root.querySelectorAll('[data-tp-new]').forEach(function (el) {
      el.addEventListener('click', async function () {
        const c = candidates[Number(el.dataset.tpNew)];
        if (!c) return;
        collect();
        el.disabled = true;
        try {
          await Store.createProject(c.title, {
            title: c.title,
            logline: c.logline,
            genre: c.genre || params.genre || '',
            episodes: params.episodes || 60,
            duration: params.duration || '1—3分钟',
            platform: params.platform || '',
            audience: params.audience || '',
            emotions: Array.from(new Set((params.emotions || []).concat(c.emotion ? [c.emotion] : []))),
            concepts: [c],
            choseConcept: 0,
            privateGoods: { theme: '', moment: '', hatedTrope: '', recentScene: '', belief: '', childhood: '', regret: '', questions: [], answers: [] }
          });
          Store.addActivity('以选题新建项目：' + c.title);
          U.toast('已新建项目《' + c.title + '》', 'ok');
          App.go('topic');
        } catch (e) {
          el.disabled = false;
          U.toast('新建项目失败：' + e.message, 'err');
        }
      });
    });

    root.querySelectorAll('[data-tp-del]').forEach(function (el) {
      el.addEventListener('click', async function () {
        const i = Number(el.dataset.tpDel);
        const c = candidates[i];
        if (!c) return;
        if (!(await U.confirm('删除候选', `确定删除「${c.title}」？`, '删除'))) return;
        settings.topicCandidates = candidates.filter(function (_, idx) { return idx !== i; });
        Store.saveSettings();
        App.refresh();
      });
    });

    root.querySelectorAll('[data-tp-edit]').forEach(function (el) {
      el.addEventListener('click', function () { edit(Number(el.dataset.tpEdit)); });
    });

    function edit(i) {
      const c = candidates[i];
      if (!c) return;
      const m = U.modal({
        title: '编辑选题候选',
        wide: true,
        body: `<div class="grid-2">
          ${U.renderFields([
            { key: 'title', label: '标题' },
            { key: 'genre', label: '类型', type: 'select', groups: D.genreGroups, allowEmpty: true },
            { key: 'emotion', label: '核心情绪' },
            { key: 'profession', label: '职业' },
            { key: 'hero', label: '主角（姓名 / 年龄 / 职业）' },
            { key: 'object', label: '关键物件' }
          ], c)}
        </div>
        <div class="field"><div class="field-label">一句话高概念</div><textarea class="textarea" data-path="logline" style="min-height:72px">${U.escape(c.logline || '')}</textarea></div>
        <div class="field"><div class="field-label">独特设定</div><textarea class="textarea" data-path="unique" style="min-height:56px">${U.escape(c.unique || '')}</textarea></div>
        <div class="grid-2">
          <div class="field"><div class="field-label">核心冲突</div><textarea class="textarea" data-path="conflict" style="min-height:56px">${U.escape(c.conflict || '')}</textarea></div>
          <div class="field"><div class="field-label">第一集钩子</div><textarea class="textarea" data-path="hook" style="min-height:56px">${U.escape(c.hook || '')}</textarea></div>
        </div>`,
        footer: `<button class="btn" data-close>取消</button><button class="btn btn-primary" id="save-topic">保存</button>`
      });
      m.root.querySelector('#save-topic').addEventListener('click', function () {
        candidates[i] = Object.assign({}, candidates[i], U.formObj(m.root));
        settings.topicCandidates = candidates;
        Store.saveSettings();
        m.close();
        App.refresh();
      });
    }
  };
})();
