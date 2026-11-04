/* 通用开发步骤编辑器 */
(function () {
  const U = window.U;
  const D = window.D;

  window.Views.step = function (root, params) {
    if (!App.guardProject(root)) return;
    const step = D.stepInfo(params.id);
    if (!step) { App.go('dashboard'); return; }
    if (step.view) { App.go(step.view); return; }
    if (step.custom === 'characters') { App.go('characters'); return; }
    if (step.custom === 'outline') { App.go('outline'); return; }
    if (step.custom === 'scripts') { App.go('scripts'); return; }

    const p = window.Store.project;
    const idx = D.stepIndex(step.id);
    const gate = D.gateOf(step.id);
    const prevStep = D.steps[idx - 1];
    const nextStep = D.steps[idx + 1];

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="ph-main">
            <div class="crumb">${gate ? D.phaseLabel(gate) + ' · ' + gate.name : '开发流程'} / 步骤 ${step.no}</div>
            <div class="page-title"><span class="step-no">${step.no}</span>${step.title}</div>
            <div class="page-desc">${step.desc}</div>
          </div>
          <div class="page-actions">
            <button class="btn" id="prev-step">${window.Icons.arrowLeft} 上一步</button>
            <span class="chip ${D.stepDone(step, p) ? 'teal' : 'warn'}">${D.stepDone(step, p) ? '已完成' : '待完成'}</span>
            <button class="btn btn-ai" id="ai-gen">${window.Icons.spark} AI 生成</button>
            <button class="btn btn-primary" id="next-step">${nextStep ? nextStep.title : '完成'} ${window.Icons.arrowRight}</button>
          </div>
        </div>

        ${gate ? D.nodeRailHtml(gate, p, step.id) : ''}

        <div class="step-layout">
          <div>
            <div class="card">
              ${(step.fields || []).length ? U.renderFields(step.fields, p) : ''}
              ${step.repeaters ? step.repeaters.map(r => repeaterHtml(r, p)).join('') : ''}
              ${step.collection ? collectionHtml(step.collection, p) : ''}
              ${step.id === 'score' ? scoreHtml(p) : ''}
              ${!(step.fields || []).length && !step.repeaters && !step.collection && step.id !== 'score' ? U.empty('该步骤暂无结构化字段', '可通过右侧说明与 AI 提示进行讨论。') : ''}
            </div>
          </div>

          <div class="aside-stack">
            <div class="aside-card">
              <h4>本步自检</h4>
              <div class="tiny muted" style="line-height:1.8;margin-bottom:10px">${U.escape(step.desc)}</div>
              <div class="flex between center">
                <span class="tiny faint">完成度</span>
                <span class="tiny" style="color:var(--accent-2)">${step.id === 'score' ? Math.round(Number(p.score?.total || 0)) + '%' : D.stepDone(step, p) ? '100%' : '进行中'}</span>
              </div>
              <div class="bar mt-8"><i style="width:${step.id === 'score' ? Number(p.score?.total || 0) : stepCompletion(step, p)}%"></i></div>
            </div>
            <div class="aside-card">
              <h4>Skill 提示</h4>
              <ul class="aside-list">${(step.tips || []).map(t => `<li>${U.escape(t)}</li>`).join('')}</ul>
            </div>
            ${step.id === 'engine' ? `
            <div class="aside-card">
              <h4>发动机自检</h4>
              <ul class="aside-list">
                <li>主角是否在主动追求目标？</li>
                <li>是否存在 ≥2 个不能退出的原因？</li>
                <li>对手是否有自己的目标与逻辑？</li>
                <li>删除规则后，故事是否仍成立？</li>
              </ul>
            </div>` : ''}
            ${step.id === 'rules' ? `
            <div class="aside-card">
              <h4>规则删除测试</h4>
              <div class="tiny muted" style="line-height:1.8">删掉这条规则后，故事是否仍然成立？<br/>如果成立，它只是装饰，必须重写。</div>
            </div>` : ''}
            <div class="aside-card">
              <h4>流程</h4>
              <div class="tiny faint" style="line-height:1.9">上一步：${prevStep ? U.escape(prevStep.title) : '—'}<br/>当前：${U.escape(step.title)}<br/>下一步：${nextStep ? U.escape(nextStep.title) : '导出与分镜'}</div>
            </div>
          </div>
        </div>
      </div>`;

    U.bind(root, () => p, () => window.Store.touch());
    bindRepeaters(root, step, p);
    bindCollections(root, step, p);
    if (step.id === 'score') bindScore(root, p);
    App.bindNodes(root);

    function navigate(target) {
      if (!target) return;
      if (target.id === 'outline') App.go('outline');
      else if (target.id === 'scripts') App.go('scripts');
      else App.go('step', { id: target.id });
    }

    root.querySelector('#prev-step').addEventListener('click', () => navigate(prevStep));
    root.querySelector('#next-step').addEventListener('click', () => navigate(nextStep));

    async function run() {
      if (!App.requireAI('llm')) return;
      if (D.stepDone(step, p) && !(await U.confirm('覆盖当前步骤', `「${step.title}」已有内容，继续生成会覆盖当前编辑。是否继续？`, '覆盖生成'))) return;
      const btn = root.querySelector('#ai-gen');
      const original = btn.innerHTML;
      root.querySelectorAll('#ai-gen,#prev-step,#next-step').forEach(b => { b.disabled = true; });
      btn.innerHTML = '<span class="spinner"></span> AI 生成中…';
      try {
        await window.Gen.aiFill(step.id, p);
        U.toast('AI 已生成，请人工复核' + window.Gen.usageText(), 'ok');
        App.go('step', { id: step.id });
      } catch (e) {
        U.toast('生成失败：' + e.message, 'err');
        btn.innerHTML = original;
        root.querySelectorAll('#ai-gen,#prev-step,#next-step').forEach(b => { b.disabled = false; });
      }
    }

    root.querySelector('#ai-gen').addEventListener('click', run);
  };

  function stepCompletion(step, p) {
    const fields = (step.fields || []).map(f => U.getPath(p, f.key));
    let filled = fields.filter(v => String(v == null ? '' : v).trim()).length;
    let total = fields.length;
    if (step.collection) {
      total += 1;
      if ((p[step.collection.key] || []).length) filled += 1;
    }
    if (step.repeaters) {
      step.repeaters.forEach(r => {
        total += 1;
        if ((p[r.key] || []).length) filled += 1;
      });
    }
    return total ? Math.round((filled / total) * 100) : D.stepDone(step, p) ? 100 : 0;
  }

  function repeaterHtml(r, p) {
    const arr = p[r.key] || [];
    return `<div class="field">
      <div class="field-label">${r.label}<span class="hint">${arr.length} 项</span></div>
      <div class="repeat-list" data-repeat="${r.key}">
        ${arr.map((v, i) => `<div class="repeat-item">
          <input class="input" data-rep="${r.key}" data-idx="${i}" value="${U.escape(v)}" placeholder="${U.escape(r.placeholder || '')}" />
          <button class="btn btn-icon btn-ghost" data-rep-del="${r.key}" data-idx="${i}" title="删除">${window.Icons.trash}</button>
        </div>`).join('')}
        <button class="btn btn-sm" data-rep-add="${r.key}" style="align-self:flex-start">${window.Icons.plus} ${r.addText || '添加'}</button>
      </div>
    </div>`;
  }

  function collectionHtml(col, p) {
    const arr = p[col.key] || [];
    return `<div class="section" style="margin-top:4px">
      <div class="flex between center" style="margin-bottom:12px">
        <div class="section-title">${col.label} · ${arr.length}</div>
        <button class="btn btn-sm" data-col-add="${col.key}">${window.Icons.plus} ${col.addText}</button>
      </div>
      <div class="coll-list">
        ${arr.map((item, i) => `
          <div class="coll-item ${i === 0 ? 'open' : ''}" data-coll-item="${col.key}-${i}">
            <div class="coll-head" data-coll-toggle>
              <span class="coll-idx">${String(i + 1).padStart(2, '0')}</span>
              <span class="coll-title">${U.escape(col.rowTitle ? col.rowTitle(item) : (item.name || item.layer || ('条目 ' + (i + 1))))}</span>
              <button class="btn btn-icon btn-sm btn-ghost" data-coll-del="${col.key}" data-idx="${i}" title="删除">${window.Icons.trash}</button>
              <span class="coll-caret">${window.Icons.chevron}</span>
            </div>
            <div class="coll-body" data-coll-body="${col.key}-${i}">
              <div class="grid-2">${U.renderFields(col.fields, item)}</div>
            </div>
          </div>`).join('') || `<div class="tiny faint" style="padding:14px 0">暂无条目，点击右上角新增。</div>`}
      </div>
    </div>`;
  }

  function bindRepeaters(root, step, p) {
    if (!step.repeaters) return;
    step.repeaters.forEach(function (r) {
      const arr = () => (p[r.key] = p[r.key] || []);
      root.querySelectorAll(`[data-rep="${r.key}"]`).forEach(function (input) {
        input.addEventListener('input', function () {
          arr()[Number(input.dataset.idx)] = input.value;
          window.Store.touch();
        });
      });
      root.querySelectorAll(`[data-rep-add="${r.key}"]`).forEach(function (btn) {
        btn.addEventListener('click', function () {
          arr().push('');
          window.Store.touch();
          App.refresh();
        });
      });
      root.querySelectorAll(`[data-rep-del="${r.key}"]`).forEach(function (btn) {
        btn.addEventListener('click', function () {
          arr().splice(Number(btn.dataset.idx), 1);
          window.Store.touch();
          App.refresh();
        });
      });
    });
  }

  function bindCollections(root, step, p) {
    if (!step.collection) return;
    const col = step.collection;
    const arr = () => (p[col.key] = p[col.key] || []);
    root.querySelectorAll(`[data-col-add="${col.key}"]`).forEach(function (btn) {
      btn.addEventListener('click', function () {
        arr().push(col.newItem ? col.newItem() : {});
        window.Store.touch();
        App.refresh();
      });
    });
    root.querySelectorAll(`[data-coll-del="${col.key}"]`).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        arr().splice(Number(btn.dataset.idx), 1);
        window.Store.touch();
        App.refresh();
      });
    });
    root.querySelectorAll('[data-coll-toggle]').forEach(function (head) {
      head.addEventListener('click', function (e) {
        if (e.target.closest('[data-coll-del]')) return;
        head.closest('.coll-item').classList.toggle('open');
      });
    });
    arr().forEach(function (item, i) {
      const body = root.querySelector(`[data-coll-body="${col.key}-${i}"]`);
      if (body) U.bind(body, () => item, () => window.Store.touch());
    });
  }

  /* ---------------- 评分 ---------------- */
  function scoreHtml(p) {
    const s = p.score || (p.score = { dimensions: {} });
    const dims = s.dimensions || (s.dimensions = {});
    const total = D.scoreDims.reduce((a, d) => a + Number(dims[d.key] || 0), 0);
    s.total = total;
    s.verdict = total >= 90 ? '可进入详细分集开发' : total >= 80 ? '整体成熟，局部调整' : total >= 70 ? '概念可用，发动机或人物不足' : '建议重构核心规则或人物目标';
    return `<div>
      <div class="flex between center" style="margin-bottom:16px">
        <div>
          <div class="card-title">逐项评分</div>
          <div class="card-sub">总分 <b id="score-total" style="color:var(--accent-2);font-size:20px">${total}</b> / 100 · 90 分以上可进入详细分集开发</div>
        </div>
        <div class="aside-score" id="score-verdict" style="font-size:12px;font-weight:600;max-width:220px;text-align:right">${U.escape(s.verdict)}</div>
      </div>
      ${D.scoreDims.map(d => `
        <div class="score-row">
          <div class="score-label">${d.label}</div>
          <input type="range" class="score-range" min="0" max="${d.max}" value="${Number(dims[d.key] || 0)}" data-score="${d.key}" />
          <div class="score-val"><b data-score-val="${d.key}">${Number(dims[d.key] || 0)}</b> / ${d.max}</div>
        </div>`).join('')}
      <div class="grid-2 mt-16">
        ${U.renderFields([
          { key: 'priority', label: '优先修改项', type: 'textarea', rows: 2, placeholder: '先修发动机，再修局部' },
          { key: 'mustConfirm', label: '进入下一阶段前必须确认', type: 'textarea', rows: 2 }
        ], s)}
      </div>
      <div class="card-sub" style="line-height:1.8;margin-top:6px">合规与侵权为独立否决项：即使总分 ≥90，若存在违规或高度撞题，仍不得进入剧本阶段。</div>
    </div>`;
  }

  function bindScore(root, p) {
    const s = p.score;
    function recalc() {
      const total = D.scoreDims.reduce((a, d) => a + Number(s.dimensions[d.key] || 0), 0);
      s.total = total;
      s.verdict = total >= 90 ? '可进入详细分集开发' : total >= 80 ? '整体成熟，局部调整' : total >= 70 ? '概念可用，发动机或人物不足' : '建议重构核心规则或人物目标';
      const t = root.querySelector('#score-total');
      const v = root.querySelector('#score-verdict');
      if (t) t.textContent = total;
      if (v) v.textContent = s.verdict;
    }
    root.querySelectorAll('[data-score]').forEach(function (range) {
      range.addEventListener('input', function () {
        const key = range.dataset.score;
        s.dimensions[key] = Number(range.value);
        const val = root.querySelector(`[data-score-val="${key}"]`);
        if (val) val.textContent = range.value;
        recalc();
        window.Store.touch();
      });
    });
    U.bind(root, () => s, () => window.Store.touch());
  }
})();
