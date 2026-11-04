/* 项目库 */
(function () {
  const U = window.U;

  window.Views = window.Views || {};
  window.Views.projects = function (root) {
    const projects = window.Store.projects || [];
    root.innerHTML = `
      <div class="page">
        <div class="library-hero">
          <div>
            <div class="crumb">DUANJU STUDIO · 短剧可视化制作工作台</div>
            <h1>从一句私货，到<span>可开拍的短剧</span>。</h1>
            <p>按短剧 Skill 的 13 步开发框架推进：私货采集 → 选题复核 → 故事发动机 → 规则 / 人物 / 秘密 → 阶段与卡点 → 分集大纲 → 正式剧本 → 分镜与资产。</p>
            <div class="chip-row mt-16">
              <span class="chip accent">故事发动机优先</span>
              <span class="chip">目标对立冲突</span>
              <span class="chip">规则必有代价</span>
              <span class="chip teal">每集强卡点</span>
            </div>
          </div>
          <div class="page-actions">
            <button class="btn" id="refresh-projects">${window.Icons.refresh} 刷新</button>
            <button class="btn btn-primary" id="new-project">${window.Icons.plus} 新建项目</button>
          </div>
        </div>

        <div class="section-head" style="margin-top:6px">
          <div class="section-title">全部项目 · ${projects.length}</div>
          <div class="section-line"></div>
          <div class="section-hint">工作区：${U.escape(window.Store.info.workspace)}</div>
        </div>

        <div class="project-grid">
          ${projects.map(p => projectCard(p)).join('')}
          <div class="new-card" id="new-project-2">
            <div>
              <div class="plus">${window.Icons.plus}</div>
              <b>新建短剧项目</b>
              <span>从私货与高概念开始</span>
            </div>
          </div>
        </div>

        <div class="section mt-24">
          <div class="card" style="display:flex;gap:22px;align-items:flex-start">
            <div style="flex:1">
              <div class="card-title">${window.Icons.wand} 这套工作台如何工作？</div>
              <div class="card-sub mt-8" style="line-height:1.9">
                每个阶段都提供结构化表单与自检清单：结构化表单随时可手填；点生成时调用模型（需先在「模型配置」添加 Provider），按 Skill 框架产出可编辑草稿。所有产物可一键导出为 Markdown，路径与 Skill 约定一致（<span class="mono">docs/SHORT_DRAMA_BLUEPRINT.md</span>、<span class="mono">docs/STORY_SPEC.md</span>、<span class="mono">docs/EPISODE_OUTLINE.md</span>、<span class="mono">docs/scripts/EPxx.md</span>）。
              </div>
            </div>
            <div style="width:300px;flex:0 0 300px">
              <div class="dash-stat-row"><span>开发步骤</span><b>13 步</b></div>
              <div class="dash-stat-row"><span>默认集数</span><b>60 集 · 1—3 分钟</b></div>
              <div class="dash-stat-row"><span>资产类型</span><b>角色 / 场景 / 道具 / 图 / 音 / 视频</b></div>
              <div class="dash-stat-row"><span>模型协议</span><b>OpenAI 兼容</b></div>
            </div>
          </div>
        </div>
      </div>`;

    const create = () => openCreateModal();
    root.querySelector('#new-project').addEventListener('click', create);
    root.querySelector('#new-project-2').addEventListener('click', create);
    root.querySelector('#refresh-projects').addEventListener('click', async function () {
      await window.Store.reloadProjects();
      App.refresh();
    });

    root.querySelectorAll('[data-open]').forEach(function (el) {
      el.addEventListener('click', async function (e) {
        if (e.target.closest('[data-del]')) return;
        await window.Store.openProject(el.dataset.open);
        App.go('dashboard');
      });
    });
    root.querySelectorAll('[data-del]').forEach(function (el) {
      el.addEventListener('click', async function (e) {
        e.stopPropagation();
        const p = projects.find(x => x.id === el.dataset.del);
        const ok = await U.confirm('删除项目', `确认删除「${U.escape(p.name)}」？项目目录、文档与资产都会被移除，且不可恢复。`, '删除');
        if (!ok) return;
        await window.Store.deleteProject(el.dataset.del);
        U.toast('项目已删除');
        App.refresh();
      });
    });
  };

  function projectCard(p) {
    const root = String(window.Store.info.workspace || '').replace(/\\/g, '/');
    const cover = p.cover ? 'file:///' + encodeURI(root + '/projects/' + p.id + '/' + p.cover).replace(/#/g, '%23') : '';
    return `<div class="card card-hover project-card" data-open="${p.id}">
      <div class="pc-bg"></div>
      ${cover ? `<div class="pc-cover"><img src="${cover}" /></div>` : ''}
      <div class="pc-inner">
        <div class="badge-row" style="display:flex;gap:6px;margin-bottom:10px">
          ${p.genre ? `<span class="chip">${U.escape(p.genre)}</span>` : ''}
          <span class="chip ${p.progress >= 70 ? 'teal' : ''}">${p.progress}%</span>
        </div>
        <h3>${U.escape(p.name)}</h3>
        <div class="pc-logline">${U.escape(p.logline || '尚未填写一句话高概念。')}</div>
        <div class="pc-bar"><div class="bar"><i style="width:${p.progress}%"></i></div></div>
        <div class="pc-foot mt-8">
          <span class="tiny faint">${p.episodes} 集 · 已写 ${p.written} 集</span>
          <span class="pc-stat">${U.relTime(p.updatedAt)}</span>
          <button class="btn btn-icon btn-sm btn-ghost" data-del="${p.id}" title="删除">${window.Icons.trash}</button>
        </div>
      </div>
    </div>`;
  }

  function openCreateModal() {
    const emotions = ['爽感', '悬疑', '情感拉扯', '治愈', '虐恋', '复仇', '逆袭'];
    const m = U.modal({
      title: '新建短剧项目',
      wide: true,
      body: `
        <div class="grid-2">
          <div class="field">
            <div class="field-label">项目名称<span class="req">必填</span></div>
            <input class="input" id="np-name" placeholder="如：最后三秒" />
          </div>
          <div class="field">
            <div class="field-label">故事类型</div>
            <select class="select" id="np-genre">${(window.D.genreGroups || []).map(g => `<optgroup label="${g.label}">${g.items.map(x => `<option>${x}</option>`).join('')}</optgroup>`).join('')}</select>
          </div>
          <div class="field">
            <div class="field-label">总集数</div>
            <input class="input" id="np-eps" type="number" value="60" min="8" max="200" />
          </div>
          <div class="field">
            <div class="field-label">单集时长</div>
            <input class="input" id="np-dur" value="1—3分钟" />
          </div>
        </div>
        <div class="field">
          <div class="field-label">一句话高概念<span class="req">必填</span><span class="hint">人物 / 冲突 / 独特设定</span></div>
          <textarea class="textarea" id="np-logline" placeholder="如：声音修复师能从旧磁带里听见死者最后三秒的声音，直到她听见母亲在求救。"></textarea>
        </div>
        <div class="field">
          <div class="field-label">私货主题<span class="hint">你最想表达的一句话，AI 只放大、不拥有</span></div>
          <input class="input" id="np-theme" placeholder="如：爱会让人变得自私" />
        </div>
        <div class="field">
          <div class="field-label">核心情绪</div>
          <div class="chip-row" id="np-emotions">
            ${emotions.map((e, i) => `<button class="chip ${i < 3 ? 'accent' : ''}" data-emo="${e}">${e}</button>`).join('')}
          </div>
        </div>
        <div class="card-sub" style="line-height:1.8">创建后进入「私货与选题」，可继续补齐 7 项私货，再让模型生成 9 个跨类型高概念候选。</div>`,
      footer: `<button class="btn" data-close>取消</button><button class="btn btn-primary" id="np-create">${window.Icons.plus} 创建并进入</button>`
    });

    const selected = new Set(['爽感', '悬疑', '情感拉扯']);
    m.root.querySelectorAll('[data-emo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const e = btn.dataset.emo;
        if (selected.has(e)) selected.delete(e); else selected.add(e);
        btn.classList.toggle('accent', selected.has(e));
      });
    });

    m.root.querySelector('#np-create').addEventListener('click', async function () {
      const name = m.root.querySelector('#np-name').value.trim();
      const logline = m.root.querySelector('#np-logline').value.trim();
      if (!name) { U.toast('请填写项目名称', 'err'); return; }
      if (!logline) { U.toast('请填写一句话高概念', 'err'); return; }
      const overview = {
        title: name,
        logline,
        genre: m.root.querySelector('#np-genre').value,
        episodes: Number(m.root.querySelector('#np-eps').value || 60),
        duration: m.root.querySelector('#np-dur').value,
        emotions: Array.from(selected),
        privateGoods: {
          theme: m.root.querySelector('#np-theme').value.trim(),
          moment: '', hatedTrope: '', recentScene: '', belief: '', childhood: '', regret: ''
        }
      };
      try {
        await window.Store.createProject(name, overview);
        m.close();
        U.toast('项目已创建', 'ok');
        App.go('topic');
      } catch (e) {
        U.toast('创建失败：' + e.message, 'err');
      }
    });
  }
})();
