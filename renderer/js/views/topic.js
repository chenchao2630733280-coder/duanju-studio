/* 私货与选题（阶段 01 · 立项） */
(function () {
  const U = window.U;
  const D = window.D;

  window.Views.topic = function (root) {
    if (!App.guardProject(root)) return;
    const p = window.Store.project;
    const ov = p.overview;
    const pg = ov.privateGoods || {};
    const concepts = ov.concepts || [];
    const chosen = concepts[Number(ov.choseConcept || 0)];

    const emoAll = D.emotions;
    const selected = new Set(ov.emotions || []);

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="ph-main">
            <div class="crumb">${D.phaseLabel(D.gateOf('topic'))} · 立项</div>
            <div class="page-title">私货与立项 <span class="step-no">第 0 步</span></div>
            <div class="page-desc">私货 = 不可替代性，AI 只放大、不拥有。先写下只有你能提供的主题与细节；高概念在「选题库」按参数生成，挑一个“心里一紧”的应用到这里。</div>
          </div>
          <div class="page-actions">
            <button class="btn" id="ask-me">${window.Icons.brain} 私货追问</button>
            <button class="btn" id="to-topics">${window.Icons.compass} 去选题库</button>
            <button class="btn" id="to-spec">故事规格（可选）</button>
            <button class="btn btn-primary" id="next">进入分集大纲 ${window.Icons.arrowRight}</button>
          </div>
        </div>

        <div class="split">
          <div>
            <div class="card">
              <div class="card-head">
                <div class="card-title">${window.Icons.film} 立项蓝图</div>
                <div class="card-more"><span class="chip accent">${D.phaseLabel(D.gateOf('topic'))}</span></div>
              </div>
              <div class="grid-2">
                ${U.renderFields([
                  { key: 'title', label: '项目名称', required: true },
                  { key: 'genre', label: '故事类型', type: 'select', groups: D.genreGroups, allowEmpty: true },
                  { key: 'episodes', label: '总集数' },
                  { key: 'duration', label: '单集时长' },
                  { key: 'platform', label: '目标平台' },
                  { key: 'audience', label: '目标用户' },
                  { key: 'budget', label: '制作预算' },
                  { key: 'businessModel', label: '商业模式' },
                  { key: 'ending', label: '结局倾向' }
                ], ov)}
              </div>
              <div class="field">
                <div class="field-label">一句话高概念<span class="req">必填</span><span class="hint">人物 / 冲突 / 独特设定 / 情感钩子</span></div>
                <textarea class="textarea" data-path="logline" style="min-height:84px" placeholder="如：声音修复师能从旧磁带里听见死者最后三秒的声音，直到她听见母亲在求救。">${U.escape(ov.logline || '')}</textarea>
              </div>
              <div class="field">
                <div class="field-label">核心情绪</div>
                <div class="chip-row" id="emo-chips">
                  ${emoAll.map(e => `<button class="chip ${selected.has(e) ? 'accent' : ''}" data-emo="${e}">${e}</button>`).join('')}
                </div>
              </div>
            </div>

            <div class="card mt-16">
              <div class="card-head">
                <div class="card-title"> 私货采集 · 7 问</div>
                <div class="card-more"><span class="chip">只有作者能回答</span></div>
              </div>
              <div class="card-sub" style="margin-bottom:16px">越具体越好。这里不是写简介，是找出“只有你经历过、无法被替换”的细节。后续人物习惯动作、独处戏与关键台词都从这里取材。</div>
              <div class="grid-2">
                ${U.renderFields([
                  { key: 'theme', label: '① 最想表达的一个主题', type: 'textarea', placeholder: '如：爱会让人变得自私', rows: 2 },
                  { key: 'moment', label: '② 亲身经历的一个情感瞬间', type: 'textarea', placeholder: '哪怕很小', rows: 2 },
                  { key: 'hatedTrope', label: '③ 最讨厌的套路', type: 'textarea', placeholder: '如：主角最后靠巧合胜利', rows: 2 },
                  { key: 'recentScene', label: '④ 最近一次愤怒 / 羞愧 / 心碎 / 荒诞场景', type: 'textarea', rows: 2 },
                  { key: 'belief', label: '⑤ 你相信的一句话', type: 'textarea', placeholder: '如：人无法真正理解另一个人', rows: 2 },
                  { key: 'childhood', label: '⑥ 童年味道 / 父母的小动作', type: 'textarea', placeholder: '从小习惯里挖细节', rows: 2 },
                  { key: 'regret', label: '⑦ 一段至今愧疚的瞬间', type: 'textarea', placeholder: '从不体面里挖温度', rows: 2 }
                ], pg, 'privateGoods')}
              </div>
            </div>
          </div>

          <div class="aside-stack">
            <div class="aside-card">
              <h4>私货，是故事的地基</h4>
              <ul class="aside-list">
                <li>没有私货的故事，再新颖的设定也是换皮套路。</li>
                <li>AI 可以放大私货，但不能替你拥有私货。</li>
                <li>追问具体感官细节，而不是给建议。</li>
                <li>最终台词、独处戏、习惯动作都应回到这些素材。</li>
              </ul>
            </div>
            <div class="aside-card">
              <h4>当前方向</h4>
              ${chosen ? `
                <div style="font-size:14px;font-weight:650">${U.escape(chosen.title)}</div>
                <div class="tiny muted mt-8" style="line-height:1.8">${U.escape(chosen.logline)}</div>
                <div class="mt-12"><span class="chip accent">${U.escape(chosen.emotion || '')}</span></div>
              ` : '<div class="tiny faint">尚未应用选题方向。去「选题库」生成候选，挑一个让你“心里一紧”的应用到这里。</div>'}
            </div>
            <div class="aside-card">
              <h4>选题复核门槛</h4>
              <ul class="aside-list">
                <li>一句话可以讲清</li>
                <li>存在独特变量，不是旧套路换皮</li>
                <li>能支撑 ≥5 轮目标升级</li>
                <li>≥3 次关系变化、≥2 次真相反转</li>
                <li>有 1 个不可逆选择</li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;

    U.bind(root, () => p, () => window.Store.touch());

    root.querySelectorAll('[data-emo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const e = btn.dataset.emo;
        const arr = ov.emotions || (ov.emotions = []);
        const i = arr.indexOf(e);
        if (i >= 0) arr.splice(i, 1); else arr.push(e);
        btn.classList.toggle('accent', arr.includes(e));
        window.Store.touch();
      });
    });

    root.querySelector('#ask-me').addEventListener('click', function () { showQuestions(p, pg); });
    root.querySelector('#to-topics').addEventListener('click', () => App.go('topics'));
    root.querySelector('#to-spec').addEventListener('click', () => App.go('step', { id: 'review' }));
    root.querySelector('#next').addEventListener('click', () => App.go('outline'));
  };

  async function showQuestions(p, pg) {
    if (!App.requireAI('llm')) return;
    const m = U.modal({
      title: 'AI 追问 · 逼出更私人的部分',
      wide: true,
      body: `<div class="flex center gap-8 tiny muted" style="padding:10px 0"><span class="spinner"></span> 正在读你的私货，准备追问…</div>`,
      footer: `<button class="btn" data-close>关闭</button>`
    });
    const body = m.root.querySelector('.modal-body');
    try {
      const qs = await window.Gen.aiQuestions(p);
      const answers = pg.answers || (pg.answers = []);
      pg.questions = qs;
      body.innerHTML = `<div class="small muted" style="line-height:1.8;margin-bottom:14px">不要急着给建议，先回答。越具体越好——感官、动作、矛盾心理。回答会保存在项目里。</div>
        <div class="repeat-list">
          ${qs.map((q, i) => `<div class="depth-item"><label><b>${String(i + 1).padStart(2, '0')}</b>${U.escape(q)}</label><textarea class="textarea" data-answer="${i}" style="min-height:56px" placeholder="写下你的回答">${U.escape(answers[i] || '')}</textarea></div>`).join('')}
        </div>`;
      body.querySelectorAll('[data-answer]').forEach(function (el) {
        el.addEventListener('input', function () {
          answers[Number(el.dataset.answer)] = el.value;
          window.Store.touch();
        });
      });
      window.Store.touch();
    } catch (e) {
      body.innerHTML = `<div class="small" style="color:var(--danger);line-height:1.9">追问生成失败：${U.escape(e.message)}<br/><span class="tiny faint">请检查「模型配置」中的语言模型是否可用。</span></div>`;
    }
  }
})();
