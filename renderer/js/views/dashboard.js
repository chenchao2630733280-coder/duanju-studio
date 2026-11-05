/* 项目总览与开发流水线 */
(function () {
  const U = window.U;
  const D = window.D;

  window.Views.dashboard = function (root) {
    if (!App.guardProject(root)) return;
    const p = window.Store.project;
    const ov = p.overview || {};
    const c = (ov.concepts || []).find((x, i) => i === Number(ov.choseConcept || 0)) || (ov.concepts || [])[0] || {};
    const overall = D.overallProgress(p);
    const current = D.currentStep(p);
    const cover = U.coverUrl(p);
    const written = Object.values(p.scriptStatus || {}).filter(Boolean).length;
    const eps = Number(ov.episodes || 60);
    const assets = (p.assets || []).length;
    const score = Number(p.score?.total || 0);

    const currentGate = D.gateOf(current.id);
    const shots = (p.shots || []).length;
    const usage = window.Store.usageOf(p.id);
    const lastCall = (usage.recent || [])[0] || null;

    const phaseCards = D.phases.map(function (ph) {
      const pr = D.gateProgress(ph.id, p);
      const active = !!currentGate && currentGate.id === ph.id && pr.percent < 100;
      const nodes = D.phaseNodes(ph.id, p);
      const meter = nodes.length > 1
        ? D.nodesHtml(ph.id, p)
        : `<div class="bar"><i style="width:${pr.percent}%"></i></div>`;
      const tally = nodes.length > 1 ? `${pr.done}/${pr.total} 节点` : (pr.percent === 100 ? '已完成' : '待开始');
      return `<div class="phase-card ${pr.percent === 100 ? 'done' : active ? 'active' : ''}" data-phase="${ph.id}">
        <div class="ph-num">${D.phaseLabel(ph)}</div>
        <div class="ph-name">${ph.name}${ph.optional ? '<span class="chip tiny" style="margin-left:5px;vertical-align:2px">可选</span>' : ''}</div>
        <div class="flex between center" style="font-size:10.5px;color:var(--muted);margin-bottom:7px">
          <span>${tally}</span><span>${pr.percent}%</span>
        </div>
        ${meter}
      </div>`;
    }).join('');

    const stepRow = function (s) {
      const done = D.stepDone(s, p);
      const isCurrent = current && current.id === s.id;
      let desc = s.desc;
      if (s.id === 'outline') desc = `已生成 ${(p.outline || []).length} / ${eps} 集，含目标、钩子、行动、反制与卡点。`;
      if (s.id === 'scripts') desc = `已写 ${written} 集正式剧本，逐镜头表格可直接转分镜。`;
      if (s.id === 'score') desc = score ? `当前综合评分 ${score} / 100，可作为进入分集开发的依据。` : '尚未评分，完成评分后判断是否进入分集开发。';
      if (s.id === 'storyboard') desc = shots ? `已生成 ${shots} 个镜头，可在分镜台继续补提示词与参考图。` : '尚未生成镜头，进入分镜台可一键生成镜头草稿。';
      return `<div class="step-row ${done ? 'done' : ''} ${isCurrent ? 'active' : ''}" data-step="${s.id}">
        <div class="sr-no">${done ? window.Icons.check : s.no}</div>
        <div class="sr-main">
          <div class="sr-title">${s.title}${isCurrent ? '<span class="chip accent" style="font-size:9px">下一步</span>' : ''}</div>
          <div class="sr-desc">${U.escape(desc)}</div>
        </div>
        <div class="sr-state ${done ? 'done' : isCurrent ? 'active' : ''}">${done ? '已完成' : isCurrent ? '进行中' : '待开始'}</div>
      </div>`;
    };

    const stepGroups = D.phases.map(function (ph) {
      const pr = D.gateProgress(ph.id, p);
      const nodes = D.phaseNodes(ph.id, p);
      const rows = ph.steps.map(id => D.stepInfo(id)).filter(Boolean).map(stepRow).join('');
      return `<div class="gate-group">
        <div class="gate-head">
          <span class="gate-no">${D.phaseLabel(ph)}</span>
          <span class="gate-name">${ph.name}</span>
          ${ph.optional ? '<span class="chip tiny">可选增强</span>' : ''}
          ${nodes.length > 1 ? `<span class="gh-nodes">${D.nodesHtml(ph.id, p, { cls: 'sm' })}</span>` : ''}
          <span class="gate-count">${pr.done}/${pr.total}</span>
        </div>
        <div class="step-list">${rows}</div>
      </div>`;
    }).join('');

    const activity = (p.activity || []).slice(0, 6).map(a =>
      `<div class="dash-stat-row"><span class="tiny">${U.escape(a.text)}</span><b class="tiny faint" style="font-weight:400">${U.relTime(a.at)}</b></div>`
    ).join('') || '<div class="tiny faint">暂无记录</div>';

    root.innerHTML = `
      <div class="page">
        <div class="dash-hero">
          <div class="dh-cover">${cover ? `<img src="${cover}"/>` : `<span style="color:var(--accent-2)">${window.Icons.film}</span>`}</div>
          <div class="dh-main">
            <div class="crumb">PROJECT OVERVIEW</div>
            <h1>${U.escape(p.name)}</h1>
            <div class="dh-logline">${U.escape(ov.logline || c.logline || '尚未填写一句话高概念，可先去「选题库」生成候选并应用。')}</div>
            <div class="dh-meta">
              <span class="chip">${U.escape(ov.genre || '类型待定')}</span>
              <span class="chip">${eps} 集 · ${U.escape(ov.duration || '1—3分钟')}</span>
              <span class="chip">${U.escape(ov.budget || '中低成本')}</span>
              ${(ov.emotions || []).map(e => `<span class="chip accent">${U.escape(e)}</span>`).join('')}
              ${App.aiBadge()}
            </div>
          </div>
          <div class="dh-side">
            <div class="dh-stat-row"><span>主线进度</span><b>${overall}%</b></div>
            <div class="bar" style="margin-bottom:10px"><i style="width:${overall}%"></i></div>
            <div class="dh-stat-row"><span>分集大纲</span><b>${(p.outline || []).length}/${eps}</b></div>
            <div class="dh-stat-row"><span>正式剧本</span><b>${written} 集</b></div>
            <div class="dh-stat-row"><span>资产</span><b>${assets} 项</b></div>
            <div class="dh-stat-row"><span>综合评分</span><b>${score ? score + ' / 100' : '未评分'}</b></div>
            <div class="flex gap-6 mt-12">
              <button class="btn btn-primary flex1" id="continue">继续开发</button>
              <button class="btn btn-icon" id="open-folder" title="打开项目文件夹">${window.Icons.folder}</button>
            </div>
          </div>
        </div>

        <div class="pipeline">${phaseCards}</div>

        <div class="split">
          <div>
            <div class="section-head">
              <div class="section-title">开发流水线 · ${D.coreTotal} 步主线 + ${D.devTotal - D.coreTotal} 步可选</div>
              <div class="section-line"></div>
              <div class="section-hint">主线 ${D.coreSteps.filter(s => D.stepDone(s, p)).length}/${D.coreTotal} 已完成 · 故事规格为可选增强</div>
            </div>
            <div class="step-groups">${stepGroups}</div>
          </div>

          <div class="aside-stack">
            <div class="aside-card">
              <h4>下一步</h4>
              <div style="font-size:15px;font-weight:650">${U.escape(current.title)}</div>
              <div class="small muted mt-8" style="line-height:1.75">${U.escape(current.desc)}</div>
              <div class="mt-12 flex gap-6">
                <button class="btn btn-primary btn-sm flex1" data-step="${current.id}">进入这一步</button>
                ${current.id !== 'topic' && current.id !== 'outline' && current.id !== 'scripts' && current.id !== 'storyboard' ? `<button class="btn btn-ai btn-sm" id="quick-draft">${window.Icons.spark} AI 起草</button>` : ''}
              </div>
            </div>

            <div class="aside-card">
              <h4>用量统计</h4>
              <div class="dh-stat-row"><span>本项目</span><b>${U.num(usage.project.total)}</b></div>
              <div class="dh-stat-row"><span>全部项目</span><b>${U.num(usage.total.total)}</b></div>
              <div class="dh-stat-row"><span>输入 / 输出</span><b>${U.num(usage.project.prompt)} / ${U.num(usage.project.completion)}</b></div>
              <div class="dh-stat-row"><span>调用次数</span><b>${U.num(usage.project.calls)}</b></div>
              <div class="tiny faint mt-8" style="line-height:1.7">${lastCall ? `最近：${U.escape(lastCall.model || '—')} · ${U.escape(lastCall.scope || '')} · ${U.relTime(lastCall.at)} · ${lastCall.estimated ? '≈ ' : ''}${U.num(lastCall.total)} tokens` : '还没有调用模型，生成后自动累计。'}</div>
              <button class="btn btn-sm mt-8" id="usage-detail">用量明细</button>
            </div>

            <div class="aside-card">
              <h4>创作地基</h4>
              <div class="tiny muted" style="line-height:1.8">
                私货主题：${U.escape(ov.privateGoods?.theme || '未填写')}<br/>
                主角：${U.escape((p.characters || []).find(x => x.role === '主角')?.name || p.engine?.protagonist?.name || '未设定')}<br/>
                对手：${U.escape((p.characters || []).find(x => x.role === '核心对手')?.name || p.engine?.rival?.name || '未设定')}<br/>
                最终选择：${U.escape(p.engine?.finalChoice?.question || '未设定')}
              </div>
              <div class="divider" style="margin:12px 0"></div>
              <div class="tiny faint" style="line-height:1.8">${(p.characters || []).length} 人物 · ${(p.secrets || []).length} 层秘密 · ${(p.stages || []).length} 个阶段</div>
            </div>

            <div class="aside-card">
              <h4>最近动态</h4>
              ${activity}
            </div>

            <div class="aside-card">
              <h4>交付与备份</h4>
              <div class="flex gap-6">
                <button class="btn btn-sm flex1" id="export-docs">${window.Icons.export} 导出文档</button>
                <button class="btn btn-sm flex1" id="open-folder-2">${window.Icons.folder} 打开目录</button>
              </div>
              <div class="tiny faint mt-8" style="line-height:1.7">导出路径与 Skill 约定一致：docs/ 下 4 份主文档 + docs/scripts/EPxx.md。</div>
            </div>
          </div>
        </div>
      </div>`;

    const goStep = function (id) {
      const s = D.stepInfo(id);
      if (!s) return;
      if (s.view) App.go(s.view);
      else App.go('step', { id });
    };
    root.querySelectorAll('[data-step]').forEach(el => el.addEventListener('click', () => goStep(el.dataset.step)));
    root.querySelector('#continue').addEventListener('click', () => goStep(current.id));
    root.querySelector('#open-folder').addEventListener('click', () => window.duanju.openProjectFolder(p.id));
    root.querySelector('#open-folder-2').addEventListener('click', () => window.duanju.openProjectFolder(p.id));
    root.querySelector('#export-docs').addEventListener('click', () => App.exportDocs());
    const usageBtn = root.querySelector('#usage-detail');
    if (usageBtn) usageBtn.addEventListener('click', () => App.openUsage());

    const quick = root.querySelector('#quick-draft');
    if (quick) quick.addEventListener('click', async function () {
      if (!App.requireAI('llm')) return;
      if (D.stepDone(current, p) && !(await U.confirm('覆盖草稿', `「${current.title}」已有内容，继续起草会覆盖当前编辑。是否继续？`, '继续起草'))) return;
      quick.disabled = true;
      quick.innerHTML = '<span class="spinner"></span> 生成中';
      try {
        await window.Gen.aiFill(current.id, p);
        if (current.id !== 'outline') {
          App.refresh();
        } else {
          App.go('outline');
        }
        U.toast('AI 已生成「' + current.title + '」' + window.Gen.usageText(), 'ok');
      } catch (e) {
        U.toast('生成失败：' + e.message, 'err');
        quick.disabled = false;
        quick.innerHTML = window.Icons.wand + ' AI 起草';
      }
    });

    root.querySelectorAll('[data-phase]').forEach(el => el.addEventListener('click', function () {
      const ph = D.phases.find(x => x.id === el.dataset.phase);
      if (!ph) return;
      const steps = ph.steps.map(id => D.stepInfo(id)).filter(Boolean);
      const target = steps.find(s => !D.stepDone(s, p)) || steps[0];
      if (target) goStep(target.id);
    }));

    App.bindNodes(root);
  };
})();
