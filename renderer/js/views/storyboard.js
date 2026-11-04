/* 分镜台（阶段 06 · 分镜与成片） */
(function () {
  const U = window.U;
  const D = window.D;

  window.Views.storyboard = function (root, params) {
    if (!App.guardProject(root)) return;
    const p = window.Store.project;
    const N = Number(p.overview?.episodes || 60);
    const hasImage = window.Store.hasAI('image');
    const outline = (p.outline || []).slice().sort((a, b) => Number(a.ep) - Number(b.ep));
    const firstEp = outline.find(o => (p.shots || []).some(s => Number(s.ep) === Number(o.ep)))?.ep || outline[0]?.ep || 1;
    const ep = Number(params?.ep || firstEp);
    const shots = (p.shots || []).filter(s => Number(s.ep) === Number(ep)).sort((a, b) => Number(a.no) - Number(b.no));
    const total = shots.reduce((a, s) => a + Number(s.duration || 0), 0);
    const images = (p.assets || []).filter(a => a.type === 'image');

    const epChips = outline.slice(0, Math.min(20, outline.length)).map(o => {
      const n = (p.shots || []).filter(s => Number(s.ep) === Number(o.ep)).length;
      return `<button class="chip ${Number(o.ep) === ep ? 'accent' : ''}" data-board-ep="${o.ep}">EP${String(o.ep).padStart(2, '0')}${n ? ` · ${n}镜` : ''}</button>`;
    }).join('');

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="ph-main">
            <div class="crumb">${D.phaseLabel(D.gateOf('storyboard'))} · 分镜与成片</div>
            <div class="page-title">分镜台</div>
            <div class="page-desc">剧本 → 逐镜头画面 → 参考图。每个镜头都带有可出图提示、景别、时长与情绪；可用图像模型直接生成首帧参考。</div>
          </div>
          <div class="page-actions">
            <button class="btn" id="export-board">${window.Icons.export} 导出分镜表</button>
            <button class="btn" id="gen-prompts">${window.Icons.spark} AI 补齐提示词</button>
            ${hasImage ? `<button class="btn btn-ai" id="batch-image">${window.Icons.image} 批量生成参考图</button>` : `<button class="btn btn-ai" id="to-models">${window.Icons.model} 配置图像模型</button>`}
            <button class="btn btn-primary" id="to-assets">资产库 ${window.Icons.arrowRight}</button>
          </div>
        </div>

        <div class="card" style="padding:14px 18px;margin-bottom:18px">
          <div class="flex between center wrap gap-8">
            <div class="flex wrap gap-6">${epChips || '<span class="tiny faint">尚未生成分集大纲</span>'}</div>
            <div class="flex gap-12 center">
              <span class="chip">${shots.length} 镜</span>
              <span class="chip">${total} 秒</span>
              <span class="chip">${images.length} 张图</span>
            </div>
          </div>
        </div>

        ${shots.length ? `
        <div class="board-grid">
          ${shots.map((s, i) => boardCard(s, i, p)).join('')}
        </div>` : U.empty('还没有分镜', '先在剧本工作室生成第 ' + ep + ' 集剧本，或直接生成镜头。', `<div class="flex gap-8"><button class="btn" onclick="App.go('scripts',{ep:${ep}})">去写剧本</button><button class="btn btn-ai" id="gen-board">${window.Icons.spark} AI 生成镜头</button></div>`)}
      </div>`;

    root.querySelectorAll('[data-board-ep]').forEach(el => el.addEventListener('click', () => App.go('storyboard', { ep: Number(el.dataset.boardEp) })));

    root.querySelector('#export-board').addEventListener('click', () => App.exportDocs());
    root.querySelector('#to-assets').addEventListener('click', () => App.go('assets'));
    const toModels = root.querySelector('#to-models');
    if (toModels) toModels.addEventListener('click', () => App.go('models'));

    root.querySelectorAll('[data-prompt]').forEach(function (el) {
      el.addEventListener('input', function () {
        const s = window.Store.project.shots.find(x => x.id === el.dataset.prompt);
        if (s) { s.prompt = el.value; window.Store.touch(); }
      });
    });

    root.querySelectorAll('[data-shot-image]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        const s = window.Store.project.shots.find(x => x.id === btn.dataset.shotImage);
        if (!s) return;
        const prompt = s.prompt || autoPrompt(s, p);
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>';
        try {
          await window.Gen.image(p, prompt, { name: `EP${s.ep}-镜${s.no}`, linkId: s.id, size: '1024x1536', tags: ['分镜参考图', 'EP' + s.ep] });
          U.toast('参考图已生成并存入资产库', 'ok');
          App.go('storyboard', { ep });
        } catch (e) {
          U.toast('生成失败：' + e.message, 'err');
          btn.disabled = false;
          btn.innerHTML = window.Icons.image + ' 生成';
        }
      });
    });

    root.querySelector('#gen-prompts').addEventListener('click', async function () {
      if (!App.requireAI('llm')) return;
      const btn = root.querySelector('#gen-prompts');
      const origin = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> AI 写提示词中…';
      try {
        const n = await window.Gen.aiPrompts(p, ep);
        U.toast(`AI 已补齐 ${n} 条出图提示词${window.Gen.usageText()}`, 'ok');
        App.go('storyboard', { ep });
      } catch (e) {
        U.toast('生成失败：' + e.message, 'err');
        btn.disabled = false;
        btn.innerHTML = origin;
      }
    });

    const batch = root.querySelector('#batch-image');
    if (batch) batch.addEventListener('click', async function () {
      if (!App.requireAI('image')) return;
      const missing = shots.filter(s => !findImage(p, s.id));
      if (!missing.length) { U.toast('本集镜头都已有参考图', 'ok'); return; }
      const ok = await U.confirm('批量生成参考图', `将为第 ${ep} 集 ${missing.length} 个镜头调用图像模型，可能产生费用。是否继续？`, '开始生成');
      if (!ok) return;
      batch.disabled = true;
      let done = 0;
      for (const s of missing) {
        batch.innerHTML = `<span class="spinner"></span> 生成中 ${done}/${missing.length}`;
        try {
          await window.Gen.image(p, s.prompt || autoPrompt(s, p), { name: `EP${s.ep}-镜${s.no}`, linkId: s.id, size: '1024x1536' });
          done++;
        } catch (e) {
          U.toast(`第 ${s.no} 镜失败：${e.message}`, 'err');
          break;
        }
      }
      U.toast(`已生成 ${done} 张参考图`, 'ok');
      App.go('storyboard', { ep });
    });

    const genBoard = root.querySelector('#gen-board');
    if (genBoard) genBoard.addEventListener('click', async function () {
      if (!App.requireAI('llm')) return;
      if (!(p.outline || []).some(o => Number(o.ep) === Number(ep))) {
        U.toast('本集还没有大纲，请先在分集大纲中生成', 'err');
        return;
      }
      const existed = (p.shots || []).filter(s => Number(s.ep) === Number(ep)).length;
      if (existed && !(await U.confirm('生成本集镜头', `第 ${ep} 集已有 ${existed} 个镜头，继续生成会覆盖当前分镜编辑。是否继续？`, '覆盖生成'))) return;
      genBoard.disabled = true;
      genBoard.innerHTML = '<span class="spinner"></span> AI 生成中…';
      try {
        await window.Gen.aiScript(p, ep);
        U.toast('AI 已拆出本集镜头，请在剧本工作室逐镜复核', 'ok');
        App.go('storyboard', { ep });
      } catch (e) {
        U.toast('生成失败：' + e.message, 'err');
        genBoard.disabled = false;
        genBoard.innerHTML = window.Icons.spark + ' AI 生成镜头';
      }
    });

    function autoPrompt(s, pr) {
      const genre = pr.overview?.genre || '都市';
      return `竖屏 9:16，${s.size || '中景'}，${s.sceneTitle || '室内场景'}，${(s.action || '').replace(/（.*?）/g, '')}；情绪：${s.emotion || '紧张'}；电影感光影，写实中国${genre}短剧，高细节，35mm 质感。`;
    }

    function findImage(pr, shotId) {
      return (pr.assets || []).find(a => a.type === 'image' && a.linkId === shotId);
    }

    function boardCard(s, i, pr) {
      const asset = findImage(pr, s.id);
      const src = asset ? window.Store.assetUrl(asset) : '';
      return `<div class="board-card">
        <div class="board-thumb">
          ${src ? `<img src="${src}" />` : `<div class="bt-empty"><span class="tiny faint">9:16 参考位</span></div>`}
          <span class="bt-no">${String(s.no).padStart(2, '0')}</span>
          <span class="bt-size">${U.escape(s.size || '')}</span>
        </div>
        <div class="board-body">
          <div class="tiny faint">${U.escape(s.sceneTitle || '')} · ${Number(s.duration || 0)}s</div>
          <div class="board-action">${U.escape(s.action || '—')}</div>
          <div class="board-dialogue">${U.escape(s.dialogue || '')}</div>
          <textarea class="textarea board-prompt" data-prompt="${s.id}" placeholder="出图提示词">${U.escape(s.prompt || '')}</textarea>
          <div class="flex between center mt-8">
            <span class="chip tiny">${U.escape(s.emotion || '')}</span>
            <button class="btn btn-sm ${hasImage ? '' : 'btn-ghost'}" data-shot-image="${s.id}">${window.Icons.image} ${asset ? '重绘' : '生成'}</button>
          </div>
        </div>
      </div>`;
    }
  };
})();
