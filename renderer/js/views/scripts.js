/* 剧本工作室（阶段 04 · 正式剧本） */
(function () {
  const U = window.U;
  const D = window.D;

  window.Views.scripts = function (root, params) {
    if (!App.guardProject(root)) return;
    const p = window.Store.project;
    const N = Number(p.overview?.episodes || 60);
    const outline = (p.outline || []).slice().sort((a, b) => Number(a.ep) - Number(b.ep));
    const written = Object.values(p.scriptStatus || {}).filter(Boolean).length;
    const firstWritten = outline.find(o => p.scriptStatus?.[o.ep])?.ep || outline[0]?.ep || 1;
    const ep = Number(params?.ep || firstWritten);
    const shots = (p.shots || []).filter(s => Number(s.ep) === Number(ep)).sort((a, b) => Number(a.no) - Number(b.no));
    const o = outline.find(x => Number(x.ep) === Number(ep));
    const totalSec = shots.reduce((a, s) => a + Number(s.duration || 0), 0);
    const dialogueWords = U.words(shots.map(s => s.dialogue || '').join(''));

    const epItems = [];
    for (let i = 1; i <= N; i++) {
      const has = outline.some(x => Number(x.ep) === i);
      if (!has && i > outline.length) {
        // 未生成大纲的集数仍然显示，但标灰
      }
      epItems.push(`<div class="ep-item ${i === ep ? 'active' : ''}" data-ep="${i}">
        <span class="ep-no">${String(i).padStart(2, '0')}</span>
        <span>第 ${i} 集</span>
        <span class="ep-dot ${p.scriptStatus?.[i] ? 'done' : ''}"></span>
      </div>`);
    }

    const lint = window.Gen.lintScript(p, ep);
    const passCount = lint.filter(l => l.pass).length;

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="ph-main">
            <div class="crumb">${D.phaseLabel(D.gateOf('scripts'))} · 正式剧本 / 步骤 11</div>
            <div class="page-title"><span class="step-no">11</span>剧本工作室</div>
            <div class="page-desc">把分集大纲扩展为可直接拍摄的竖屏剧本。单集 60—180 秒，10—25 个镜头；开场 5 秒出钩子，结尾卡点与上一集不同类型。</div>
          </div>
          <div class="page-actions">
            <button class="btn" id="import-script" title="支持 .txt / .md，自动识别「第X集」「EP01」等标记">${window.Icons.upload} 导入剧本</button>
            <input type="file" id="script-file" accept=".txt,.md,.markdown,text/plain,text/markdown" style="display:none" />
            <button class="btn" id="export-ep">${window.Icons.export} 导出文档</button>
            <button class="btn btn-ai" id="ai-script">${window.Icons.spark} AI 写本集</button>
            <button class="btn btn-primary" id="to-board">去分镜台 ${window.Icons.arrowRight}</button>
          </div>
        </div>

        <div class="script-layout">
          <div>
            <div class="flex between center" style="margin-bottom:8px">
              <div class="section-title">集数 · ${written}/${N} 已写</div>
              <span class="chip tiny">${outline.length} 集大纲</span>
            </div>
            <div class="ep-list" style="max-height:calc(100vh - 250px)">${epItems.join('')}</div>
          </div>

          <div>
            <div class="card script-card">
              <div class="script-head">
                <div class="flex1">
                  <div class="flex center gap-8" style="flex-wrap:wrap">
                    <span class="chip accent">EP ${String(ep).padStart(2, '0')}</span>
                    <div style="font-size:15px;font-weight:650">第 ${ep} 集 · ${U.escape(p.overview?.title || p.name)}</div>
                    ${shots.length ? '<span class="chip teal">已生成</span>' : '<span class="chip warn">空</span>'}
                  </div>
                  <div class="shot-meta mt-8">
                    <span>${shots.length} 个镜头</span><span>·</span><span>${totalSec} 秒</span><span>·</span><span>台词 ${dialogueWords} 字</span>
                    ${o ? `<span>·</span><span class="cliff-tag ct-${U.escape(o.cliffType)}">${U.escape(o.cliffType)}型卡点</span>` : ''}
                  </div>
                </div>
                <button class="btn btn-sm" id="add-shot">${window.Icons.plus} 加镜头</button>
              </div>

              <div class="script-body">
                ${o ? `<div class="card" style="background:rgba(255,255,255,.02);padding:12px 14px;margin-bottom:16px">
                  <div class="tiny faint">本集大纲</div>
                  <div class="small muted mt-8" style="line-height:1.8">目标：${U.escape(o.goal)}<br/>钩子：${U.escape(o.hook)}<br/>卡点：${U.escape(o.cliff)}</div>
                </div>` : `<div class="card" style="background:rgba(255,255,255,.02);padding:12px 14px;margin-bottom:16px"><div class="tiny muted">该集还没有大纲。建议先生成分集大纲，再写剧本。</div></div>`}

                ${shots.length ? `<div class="shot-table-head">
                  <span>#</span><span>景别</span><span>场景 / 画面动作</span><span>对白 / OS</span><span>情绪</span><span>时长</span><span></span>
                </div>${shots.map(shotRow).join('')}` : U.empty('本集还没有剧本', '从当前大纲扩写成 10—25 个可拍摄镜头；生成会直接调用语言模型。', '<button class="btn btn-ai" id="gen-empty">' + window.Icons.spark + ' AI 写本集</button>')}
              </div>
            </div>

            <div class="card mt-16">
              <div class="card-head">
                <div class="card-title">${window.Icons.shield} 剧本自检 · ${passCount}/${lint.length}</div>
                <div class="card-more"><span class="chip ${passCount === lint.length ? 'teal' : 'warn'}">${passCount === lint.length ? '全部通过' : '需修改'}</span></div>
              </div>
              <div class="lint-panel">
                ${lint.map(l => `<div class="lint-row ${l.pass ? 'pass' : 'fail'}"><span class="lk">${l.pass ? '✓' : '×'}</span><span>${U.escape(l.label)}</span></div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>`;

    root.querySelectorAll('[data-ep]').forEach(function (el) {
      el.addEventListener('click', function () {
        App.go('scripts', { ep: Number(el.dataset.ep) });
      });
    });

    root.querySelectorAll('[data-shot]').forEach(function (el) {
      el.addEventListener('input', function () {
        const s = shots.find(x => x.id === el.dataset.shot);
        if (!s) return;
        const field = el.dataset.field;
        s[field] = field === 'duration' ? Number(el.value) : el.value;
        p.scriptStatus = p.scriptStatus || {};
        p.scriptStatus[ep] = true;
        window.Store.touch();
      });
    });

    root.querySelectorAll('[data-del-shot]').forEach(function (el) {
      el.addEventListener('click', function () {
        p.shots = (p.shots || []).filter(s => s.id !== el.dataset.delShot);
        renumber(ep);
        window.Store.touch();
        App.refresh();
      });
    });

    function renumber(e) {
      (p.shots || []).filter(s => Number(s.ep) === Number(e))
        .sort((a, b) => Number(a.no) - Number(b.no))
        .forEach((s, i) => { s.no = i + 1; });
    }

    async function generate() {
      if (!App.requireAI('llm')) return;
      const existed = (p.shots || []).filter(s => Number(s.ep) === Number(ep)).length;
      if (existed && !(await U.confirm('覆盖本集剧本', `第 ${ep} 集已有 ${existed} 个镜头，继续生成会覆盖当前编辑。是否继续？`, '覆盖生成'))) return;
      const btn = root.querySelector('#ai-script') || root.querySelector('#gen-empty');
      const original = btn ? btn.innerHTML : '';
      root.querySelectorAll('#ai-script,#gen-empty').forEach(b => { b.disabled = true; });
      if (btn) btn.innerHTML = '<span class="spinner"></span> AI 写作中…';
      try {
        await window.Gen.aiScript(p, ep);
        U.toast('AI 已写出本集，请逐镜复核' + window.Gen.usageText(), 'ok');
        App.go('scripts', { ep });
      } catch (e) {
        U.toast('生成失败：' + e.message, 'err');
        root.querySelectorAll('#ai-script,#gen-empty').forEach(b => { b.disabled = false; });
        if (btn) btn.innerHTML = original;
      }
    }

    const aiBtn = root.querySelector('#ai-script');
    if (aiBtn) aiBtn.addEventListener('click', generate);
    const genEmpty = root.querySelector('#gen-empty');
    if (genEmpty) genEmpty.addEventListener('click', generate);

    function shotRow(s) {
      return `<div class="shot-row">
        <div class="shot-no">${String(s.no).padStart(2, '0')}</div>
        <div class="shot-cell"><select class="select shot-size" data-shot="${s.id}" data-field="size">${D.shotSizes.map(x => `<option ${s.size === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
        <div class="shot-cell">
          <input class="input" data-shot="${s.id}" data-field="sceneTitle" value="${U.escape(s.sceneTitle || '')}" placeholder="内·地点·时间" style="font-size:10.5px;color:var(--muted)" />
          <textarea class="textarea" data-shot="${s.id}" data-field="action" style="margin-top:6px" placeholder="画面 / 动作">${U.escape(s.action || '')}</textarea>
        </div>
        <div class="shot-cell">
          <textarea class="textarea" data-shot="${s.id}" data-field="dialogue" placeholder="角色名：台词">${U.escape(s.dialogue || '')}</textarea>
          <input class="input" data-shot="${s.id}" data-field="sound" value="${U.escape(s.sound || '')}" placeholder="音效 / 音乐" style="margin-top:6px;font-size:10.5px" />
        </div>
        <div class="shot-cell"><input class="input" data-shot="${s.id}" data-field="emotion" value="${U.escape(s.emotion || '')}" placeholder="情绪" /></div>
        <div class="shot-cell"><input class="input" data-shot="${s.id}" data-field="duration" type="number" value="${Number(s.duration || 5)}" /></div>
        <div class="shot-cell"><button class="btn btn-icon btn-sm btn-ghost" data-del-shot="${s.id}" title="删除镜头">${window.Icons.trash}</button></div>
      </div>`;
    }

    root.querySelector('#add-shot').addEventListener('click', function () {
      const list = (p.shots || []).filter(s => Number(s.ep) === Number(ep));
      const shot = {
        id: U.uid('shot'), ep: Number(ep), no: list.length + 1, size: '中景',
        sceneTitle: '内·场景·夜', action: '', dialogue: '', sound: '', emotion: '', duration: 5,
        prompt: ''
      };
      p.shots = (p.shots || []).concat([shot]);
      p.scriptStatus = p.scriptStatus || {};
      p.scriptStatus[ep] = true;
      window.Store.touch();
      App.refresh();
    });

    const importBtn = root.querySelector('#import-script');
    const fileInput = root.querySelector('#script-file');
    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async function () {
        const file = fileInput.files && fileInput.files[0];
        fileInput.value = '';
        if (!file) return;
        const original = importBtn.innerHTML;
        try {
          const buffer = await file.arrayBuffer();
          let text = new TextDecoder('utf-8').decode(buffer);
          if (text.indexOf('\uFFFD') >= 0) {
            try { text = new TextDecoder('gbk').decode(buffer); } catch (e) { /* 保留 UTF-8 结果 */ }
          }
          const parsed = window.Gen.parseExistingScript(text, ep);
          if (!parsed.length) { U.toast('没有识别到剧本内容', 'err'); return; }
          const eps = parsed.map(x => Number(x.ep));
          const count = parsed.reduce((n, x) => n + x.shots.length, 0);
          const overlap = (p.shots || []).filter(s => eps.includes(Number(s.ep))).length;
          if (overlap && !(await U.confirm('覆盖已有剧本', `将导入 ${parsed.length} 集 / ${count} 个镜头，并覆盖 ${overlap} 个已有镜头。是否继续？`, '覆盖导入'))) return;
          importBtn.disabled = true;
          importBtn.innerHTML = '<span class="spinner"></span> 导入中…';
          const res = window.Gen.applyImportedScript(p, parsed);
          U.toast(`已导入 ${res.episodes} 集 / ${res.shots} 个镜头`, 'ok');
          App.go('scripts', { ep: parsed[0].ep });
        } catch (e) {
          importBtn.disabled = false;
          importBtn.innerHTML = original;
          U.toast('导入失败：' + e.message, 'err');
        }
      });
    }

    root.querySelector('#to-board').addEventListener('click', function () {
      App.go('storyboard', { ep });
    });
    root.querySelector('#export-ep').addEventListener('click', () => App.exportDocs({ episodes: [ep] }));
  };
})();
