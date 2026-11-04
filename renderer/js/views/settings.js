/* 导出与设置 */
(function () {
  const U = window.U;

  window.Views.settings = async function (root) {
    const p = window.Store.project;
    const info = window.Store.info;
    const s = window.Store.settings;
    const written = Object.values(p?.scriptStatus || {}).filter(Boolean).length;

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="ph-main">
            <div class="crumb">WORKSPACE · 导出与设置</div>
            <div class="page-title">导出与设置</div>
            <div class="page-desc">项目产物统一导出为 Markdown，路径与短剧 Skill 的约定一致，方便直接交给编剧、导演或进入下一步制作。</div>
          </div>
          <div class="page-actions">
            ${p ? `<button class="btn" id="open-folder">${window.Icons.folder} 打开项目目录</button>
                  <button class="btn btn-primary" id="export-all">${window.Icons.export} 导出全部文档</button>` : ''}
          </div>
        </div>

        <div class="split">
          <div>
            ${p ? `
            <div class="card">
              <div class="card-head">
                <div class="card-title">${window.Icons.export} 导出文档</div>
                <div class="card-more"><span class="chip">${written} 集剧本</span></div>
              </div>
              <div class="table-wrap">
                <table class="data">
                  <thead><tr><th>产物</th><th>路径</th><th>说明</th></tr></thead>
                  <tbody>
                    <tr><td>立项蓝图</td><td class="mono tiny">docs/SHORT_DRAMA_BLUEPRINT.md</td><td>项目信息 / 私货 / 高概念</td></tr>
                    <tr><td>故事规格</td><td class="mono tiny">docs/STORY_SPEC.md</td><td>发动机 / 规则 / 人物 / 阶段 / 评分</td></tr>
                    <tr><td>分集大纲</td><td class="mono tiny">docs/EPISODE_OUTLINE.md</td><td>全部分集，每集独立一节</td></tr>
                    <tr><td>分镜表</td><td class="mono tiny">docs/SHOT_LIST.md</td><td>镜头 + 出图提示词</td></tr>
                    <tr><td>正式剧本</td><td class="mono tiny">docs/scripts/EPxx.md</td><td>每集一个文件，逐镜头表</td></tr>
                  </tbody>
                </table>
              </div>
              <div class="flex between center mt-16">
                <div class="card-sub" style="line-height:1.8">每次导出都会覆盖同名文件；项目 JSON 也会同步保存。<br/>建议在阶段确认后再导出，保持“一个阶段一份主文档”。</div>
                <button class="btn btn-primary" id="export-all-2">${window.Icons.download} 导出</button>
              </div>
            </div>

            <div class="card mt-16">
              <div class="card-head">
                <div class="card-title">${window.Icons.script} 已生成的项目文档</div>
                <div class="card-more"><button class="btn btn-sm" id="refresh-docs">${window.Icons.refresh}</button></div>
              </div>
              <div id="docs-list"><div class="tiny faint">正在读取…</div></div>
            </div>

            <div class="card mt-16">
              <div class="card-head"><div class="card-title">${window.Icons.settings} 项目信息</div></div>
              <div class="grid-3">
                ${U.renderFields([
                  { key: 'name', label: '项目名称' },
                  { key: 'overview.episodes', label: '总集数' },
                  { key: 'overview.duration', label: '单集时长' }
                ], p)}
              </div>
              <div class="flex between center mt-12">
                <div class="tiny faint">项目 ID：<span class="mono">${U.escape(p.id)}</span></div>
                <button class="btn btn-danger btn-sm" id="delete-project">${window.Icons.trash} 删除整个项目</button>
              </div>
            </div>` : U.empty('未打开项目', '当前只展示工作区与全局设置。', '<button class="btn" onclick="App.go(\'projects\')">前往项目库</button>')}
          </div>

          <div class="aside-stack">
            <div class="aside-card">
              <h4>工作区</h4>
              <div class="tiny muted mono" style="line-height:1.8;word-break:break-all">${U.escape(info.workspace)}</div>
              <div class="divider" style="margin:12px 0"></div>
              <div class="dash-stat-row"><span>项目数</span><b>${window.Store.projects.length}</b></div>
              <div class="dash-stat-row"><span>Provider</span><b>${(s.providers || []).length}</b></div>
              <div class="dash-stat-row"><span>版本</span><b>v${U.escape(info.version)}</b></div>
              <div class="dash-stat-row"><span>运行模式</span><b>${window.Store.hasAI('llm') ? 'AI 已接入' : '未接入模型'}</b></div>
              <div class="dash-stat-row"><span>Token 累计</span><b>${U.num(window.Store.usageOf().total.total)}</b></div>
              <div class="dash-stat-row"><span>调用次数</span><b>${U.num(window.Store.usageOf().total.calls)}</b></div>
            </div>

            <div class="aside-card">
              <h4>工作流约定</h4>
              <ul class="aside-list">
                <li>每个阶段只产出一份主文档，避免冗余。</li>
                <li>阶段完成需人工确认后才进入下一步。</li>
                <li>资产文件随项目目录一起备份。</li>
                <li>所有生成都调用模型，不提供本地模板兜底。</li>
                <li>AI 生成一律视为草稿，必须人工复核。</li>
              </ul>
            </div>

            <div class="aside-card">
              <h4>快捷入口</h4>
              <div class="flex gap-6 wrap">
                <button class="btn btn-sm" onclick="App.go('models')">${window.Icons.model} 模型配置</button>
                <button class="btn btn-sm" onclick="App.go('assets')">${window.Icons.assets} 资产库</button>
                <button class="btn btn-sm" onclick="App.go('dashboard')">${window.Icons.grid} 总览</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    if (p) {
      U.bind(root, () => p, () => window.Store.touch());
      root.querySelector('#open-folder').addEventListener('click', () => window.duanju.openProjectFolder(p.id));
      const exp = () => App.exportDocs();
      root.querySelector('#export-all').addEventListener('click', exp);
      root.querySelector('#export-all-2').addEventListener('click', exp);

      root.querySelector('#delete-project').addEventListener('click', async function () {
        const ok = await U.confirm('删除项目', `确认删除「${U.escape(p.name)}」？项目目录、文档与资产会一并移除，无法恢复。`, '删除');
        if (!ok) return;
        await window.Store.deleteProject(p.id);
        U.toast('项目已删除');
        App.go('projects');
      });

      async function loadDocs() {
        const listEl = root.querySelector('#docs-list');
        try {
          const files = await window.duanju.listProjectFiles(p.id);
          if (!files.length) {
            listEl.innerHTML = '<div class="tiny faint" style="padding:8px 0">还没有导出过文档。点击「导出全部文档」生成。</div>';
            return;
          }
          listEl.innerHTML = `<div class="table-wrap"><table class="data"><thead><tr><th>文件</th><th></th></tr></thead><tbody>
            ${files.map(f => `<tr><td class="mono tiny">docs/${U.escape(f)}</td><td style="text-align:right"><button class="btn btn-sm btn-ghost" data-read="${U.escape(f)}">预览</button></td></tr>`).join('')}
          </tbody></table></div>`;
          listEl.querySelectorAll('[data-read]').forEach(function (btn) {
            btn.addEventListener('click', async function () {
              try {
                const text = await window.duanju.readProjectFile(p.id, btn.dataset.read);
                U.modal({ title: btn.dataset.read, wide: true, body: `<pre class="md-preview">${U.escape(text)}</pre>`, footer: '<button class="btn" data-close>关闭</button>' });
              } catch (e) { U.toast('读取失败：' + e.message, 'err'); }
            });
          });
        } catch (e) {
          listEl.innerHTML = `<div class="tiny faint">读取失败：${U.escape(e.message)}</div>`;
        }
      }
      loadDocs();
      root.querySelector('#refresh-docs').addEventListener('click', loadDocs);
    }
  };
})();
