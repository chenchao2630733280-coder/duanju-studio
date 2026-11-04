/* 分集大纲（阶段 03） */
(function () {
  const U = window.U;
  const D = window.D;

  window.Views.outline = function (root, params) {
    if (!App.guardProject(root)) return;
    const p = window.Store.project;
    const N = Number(p.overview?.episodes || 60);
    const outline = (p.outline || []).slice().sort((a, b) => Number(a.ep) - Number(b.ep));
    const stages = p.stages || [];
    const written = Object.values(p.scriptStatus || {}).filter(Boolean).length;

    const stageChips = stages.map(s => `<span class="chip">阶段${s.no} · ${U.escape(s.name)}（${s.from}—${s.to}）</span>`).join('');

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="ph-main">
            <div class="crumb">${D.phaseLabel(D.gateOf('outline'))} · 分集大纲 / 步骤 10</div>
            <div class="page-title"><span class="step-no">10</span>分集大纲</div>
            <div class="page-desc">每集必须有：目标、开场钩子、主角行动、对手反制、核心冲突、新增信息、关系变化、结果与结尾卡点。卡点类型五选一轮换，禁止连续两集同类型。</div>
          </div>
          <div class="page-actions">
            <button class="btn" id="export-outline">${window.Icons.export} 导出</button>
            <button class="btn btn-ai" id="ai-outline">${window.Icons.spark} AI 生成大纲</button>
            <button class="btn btn-primary" id="to-scripts">进入剧本 ${window.Icons.arrowRight}</button>
          </div>
        </div>

        <div class="grid-3" style="margin-bottom:18px">
          <div class="card" style="padding:14px 16px">
            <div class="tiny faint">大纲完成度</div>
            <div class="flex between center mt-8"><b style="font-size:20px">${outline.length}<span class="tiny faint" style="font-weight:400"> / ${N} 集</span></b>
            <span class="chip ${outline.length >= N ? 'teal' : 'warn'}">${Math.round(outline.length / N * 100)}%</span></div>
            <div class="bar mt-8"><i style="width:${Math.min(100, outline.length / N * 100)}%"></i></div>
          </div>
          <div class="card" style="padding:14px 16px">
            <div class="tiny faint">已写剧本</div>
            <div class="flex between center mt-8"><b style="font-size:20px">${written}<span class="tiny faint" style="font-weight:400"> 集</span></b>
            <span class="chip">${outline.length ? Math.round(written / outline.length * 100) : 0}%</span></div>
            <div class="bar mt-8"><i style="width:${outline.length ? Math.min(100, written / outline.length * 100) : 0}%"></i></div>
          </div>
          <div class="card" style="padding:14px 16px">
            <div class="tiny faint">卡点类型分布</div>
            <div class="chip-row mt-8">
              ${D.cliffTypes.map(t => `<span class="chip ct-${t}">${t} ${outline.filter(o => o.cliffType === t).length}</span>`).join('')}
            </div>
          </div>
        </div>

        ${stages.length ? `<div class="chip-row" style="margin-bottom:14px">${stageChips}</div>` : `<div class="card-sub" style="margin-bottom:14px">尚未划分阶段。建议先完成「故事阶段」，再生成分集大纲。</div>`}

        <div class="table-wrap">
          <div class="table-scroll" style="max-height:calc(100vh - 360px)">
            <table class="data">
              <thead><tr>
                <th style="width:56px">集</th><th style="width:110px">阶段</th><th style="width:22%">本集目标</th>
                <th style="width:18%">开场钩子</th><th style="width:22%">结尾卡点</th><th style="width:80px">类型</th>
                <th style="width:64px">剧本</th><th style="width:44px"></th>
              </tr></thead>
              <tbody>
                ${outline.length ? outline.map(o => outlineRow(o, p)).join('') : `<tr><td colspan="8">${U.empty('还没有分集大纲', '按批次让模型生成：每批 10—15 集，每集都有独立冲突与卡点。', '<button class="btn btn-ai" id="gen-empty">' + window.Icons.spark + ' AI 生成大纲</button>')}</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card-sub mt-16" style="line-height:1.8">
          <b>缺失集数提示：</b>${missingText(outline, N)}
        </div>
      </div>`;

    function outlineRow(o, pr) {
      const stage = stages.find(s => Number(o.ep) >= Number(s.from) && Number(o.ep) <= Number(s.to));
      const done = !!(pr.scriptStatus || {})[o.ep];
      return `<tr data-ep="${o.ep}">
        <td class="ep">${String(o.ep).padStart(2, '0')}</td>
        <td><span class="chip tiny">${U.escape(stage ? 'S' + stage.no : (o.stage || '—'))}</span></td>
        <td><div class="cell-edit">${U.escape(o.goal || '—')}</div></td>
        <td><div class="cell-edit">${U.escape(o.hook || '—')}</div></td>
        <td><div class="cell-edit">${U.escape(o.cliff || '—')}</div></td>
        <td><span class="cliff-tag ct-${U.escape(o.cliffType)}">${U.escape(o.cliffType || '—')}</span></td>
        <td>${done ? '<span class="chip teal">已写</span>' : `<button class="btn btn-sm btn-ghost" data-write="${o.ep}">写</button>`}</td>
        <td><button class="btn btn-icon btn-sm btn-ghost" data-edit="${o.ep}">${window.Icons.edit}</button></td>
      </tr>`;
    }

    function missingText(list, n) {
      const have = new Set(list.map(o => Number(o.ep)));
      const missing = [];
      for (let i = 1; i <= n; i++) if (!have.has(i)) missing.push(i);
      if (!missing.length) return '全部集数已覆盖。';
      return missing.slice(0, 20).join('、') + (missing.length > 20 ? ` 等 ${missing.length} 集` : '');
    }

    const genEmpty = root.querySelector('#gen-empty');
    if (genEmpty) genEmpty.addEventListener('click', openAI);

    root.querySelector('#export-outline').addEventListener('click', () => App.exportDocs());
    root.querySelector('#to-scripts').addEventListener('click', () => App.go('scripts'));

    root.querySelectorAll('[data-edit]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        openEditor(outline.find(o => Number(o.ep) === Number(el.dataset.edit)));
      });
    });
    root.querySelectorAll('[data-write]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        App.go('scripts', { ep: Number(el.dataset.write) });
      });
    });

    const aiBtn = root.querySelector('#ai-outline');
    if (aiBtn) aiBtn.addEventListener('click', openAI);

    function openEditor(o) {
      if (!o) return;
      const m = U.modal({
        title: `第 ${o.ep} 集 · 分集大纲`,
        wide: true,
        body: `
          <div class="grid-2">
            ${U.renderFields([
              { key: 'stage', label: '所属阶段' },
              { key: 'cliffType', label: '卡点类型', type: 'select', options: D.cliffTypes },
              { key: 'goal', label: '本集目标', type: 'textarea', rows: 2 },
              { key: 'hook', label: '开场钩子（5 秒内）', type: 'textarea', rows: 2 },
              { key: 'action', label: '主角行动', type: 'textarea', rows: 2 },
              { key: 'counter', label: '对手反制', type: 'textarea', rows: 2 },
              { key: 'conflict', label: '核心冲突', type: 'textarea', rows: 2 },
              { key: 'info', label: '新增信息', type: 'textarea', rows: 2 },
              { key: 'relation', label: '关系变化', type: 'textarea', rows: 2 },
              { key: 'result', label: '本集结果', type: 'textarea', rows: 2 },
              { key: 'cliff', label: '结尾卡点', type: 'textarea', rows: 2 }
            ], o)}
          </div>`,
        footer: `<button class="btn" data-close>取消</button><button class="btn btn-primary" id="save-outline">保存</button>`
      });
      U.bind(m.root, () => o, () => window.Store.touch());
      m.root.querySelector('#save-outline').addEventListener('click', function () {
        m.close();
        App.refresh();
      });
    }

    function openAI() {
      if (!App.requireAI('llm')) return;
      const m = U.modal({
        title: 'AI 生成分集大纲',
        body: `
          <div class="card-sub" style="line-height:1.8;margin-bottom:14px">建议每批 10—15 集，保证每集都有独立冲突与卡点。已存在同集内容会被覆盖。</div>
          <div class="grid-2">
            <div class="field"><div class="field-label">起始集</div><input class="input" id="ai-from" type="number" value="1" min="1" max="${N}" /></div>
            <div class="field"><div class="field-label">结束集</div><input class="input" id="ai-to" type="number" value="${Math.min(10, N)}" min="1" max="${N}" /></div>
          </div>`,
        footer: `<button class="btn" data-close>取消</button><button class="btn btn-ai" id="ai-run">${window.Icons.spark} 开始生成</button>`
      });
      m.root.querySelector('#ai-run').addEventListener('click', async function () {
        const from = Math.max(1, Number(m.root.querySelector('#ai-from').value || 1));
        let to = Math.min(N, Number(m.root.querySelector('#ai-to').value || 10));
        if (to < from) { U.toast('结束集不能小于起始集', 'err'); return; }
        if (to - from + 1 > 20) {
          to = from + 19;
          U.toast(`为保证生成质量，本批已限制为第 ${from}—${to} 集；可分批生成剩余部分。`, 'warn');
        }
        const overlap = (p.outline || []).filter(o => Number(o.ep) >= from && Number(o.ep) <= to);
        m.close();
        if (overlap.length && !(await U.confirm('覆盖已有大纲', `第 ${from}—${to} 集中已有 ${overlap.length} 集内容，AI 将覆盖这些集的现有大纲。是否继续？`, '覆盖生成'))) return;
        aiBtn.disabled = true;
        aiBtn.innerHTML = '<span class="spinner"></span> AI 生成中…';
        try {
          await window.Gen.aiOutline(p, from, to);
          U.toast(`已生成第 ${from}—${to} 集大纲${window.Gen.usageText()}`, 'ok');
          App.refresh();
        } catch (e) {
          U.toast('AI 生成失败：' + e.message, 'err');
          aiBtn.disabled = false;
          aiBtn.innerHTML = window.Icons.spark + ' AI 生成';
        }
      });
    }
  };
})();
