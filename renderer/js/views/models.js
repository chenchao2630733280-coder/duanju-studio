/* 模型配置 */
(function () {
  const U = window.U;
  const D = window.D;

  window.Views.models = function (root) {
    const s = window.Store.settings;
    const providers = s.providers || [];
    const routing = s.routing || {};
    const hasProject = !!window.Store.project;
    const usage = App.usageStats();

    const kindOf = (id) => providers.find(p => p.id === id);

    root.innerHTML = `
      <div class="page">
        <div class="page-head">
          <div class="ph-main">
            <div class="crumb">RESOURCE · 模型与接口</div>
            <div class="page-title">模型配置</div>
            <div class="page-desc">统一管理语言、图像、视频与语音模型。兼容 OpenAI 协议（/chat/completions、/images/generations、/audio/speech）。所有生成都调用模型：未配置 Provider 时，各步骤会引导你回到这里完成配置。</div>
          </div>
          <div class="page-actions">
            <button class="btn" id="open-settings">${window.Icons.settings} 工作区设置</button>
            <button class="btn btn-primary" id="add-provider">${window.Icons.plus} 添加模型 Provider</button>
          </div>
        </div>

        <div class="grid-4" style="margin-bottom:18px">
          <div class="card" style="padding:14px 16px">
            <div class="tiny faint">已配置 Provider</div>
            <div class="flex between center mt-8"><b style="font-size:20px">${providers.length}</b><span class="chip ${providers.length ? 'teal' : 'warn'}">${providers.length ? '可用' : '未配置'}</span></div>
          </div>
          <div class="card" style="padding:14px 16px">
            <div class="tiny faint">语言模型</div>
            <div class="flex between center mt-8"><b style="font-size:20px">${providers.filter(p => p.kind === 'llm').length}</b><span class="chip">故事开发 / 剧本</span></div>
          </div>
          <div class="card" style="padding:14px 16px">
            <div class="tiny faint">图像 / 语音 / 视频</div>
            <div class="flex between center mt-8"><b style="font-size:20px">${providers.filter(p => p.kind !== 'llm').length}</b><span class="chip">分镜与配音</span></div>
          </div>
          <div class="card" style="padding:14px 16px">
            <div class="tiny faint">Token 用量（全部项目）</div>
            <div class="flex between center mt-8"><b style="font-size:20px;font-variant-numeric:tabular-nums">${U.num(usage.total.total)}</b><span class="chip">${U.num(usage.total.calls)} 次调用</span></div>
            <div class="tiny faint mt-8">输入 ${U.num(usage.total.prompt)} · 输出 ${U.num(usage.total.completion)}</div>
          </div>
        </div>

        <div class="section-head">
          <div class="section-title">Provider 列表</div>
          <div class="section-line"></div>
          <div class="section-hint">API Key 仅保存在本机工作区 settings.json</div>
        </div>
        ${providers.length ? `<div class="model-grid">${providers.map(p => providerCard(p)).join('')}</div>` :
          U.empty('还没有配置模型', '生成统一走模型：添加 OpenAI 兼容接口（Base URL / 模型名 / API Key）后，各步骤即可按 Skill 框架生成内容。', '<button class="btn btn-primary" id="add-empty">' + window.Icons.plus + ' 添加 Provider</button>', window.Icons.model)}

        <div class="section-head" style="margin-top:24px">
          <div class="section-title">Token 用量 · 按模型</div>
          <div class="section-line"></div>
          <div class="section-hint">Provider 未返回 usage 时按字符估算</div>
          <button class="btn btn-sm" id="open-usage">用量明细</button>
        </div>
        ${usage.byModel.length ? `<div class="table-wrap"><table class="data">
          <thead><tr><th>模型</th><th class="cell-num">调用</th><th class="cell-num">输入</th><th class="cell-num">输出</th><th class="cell-num">合计</th></tr></thead>
          <tbody>${usage.byModel.slice(0, 8).map(m => `<tr>
            <td>${U.escape(m.name)}</td>
            <td class="cell-num">${U.num(m.calls)}</td>
            <td class="cell-num">${U.num(m.prompt)}</td>
            <td class="cell-num">${U.num(m.completion)}</td>
            <td class="cell-num"><b style="color:var(--accent-2)">${U.num(m.total)}</b></td>
          </tr>`).join('')}</tbody>
        </table></div>` : `<div class="card" style="padding:14px 16px"><div class="tiny faint">还没有调用记录：完成一次生成后，这里会按模型累计 token 用量。统计保存在工作区 settings.json，跨项目共用。</div></div>`}

        <div class="card mt-24">
          <div class="card-head">
            <div class="card-title">${window.Icons.link} 任务路由</div>
            <div class="card-more"><span class="chip">决定哪类任务使用哪个模型</span></div>
          </div>
          <div class="routing-grid">
            ${D.routing.map(r => {
              const kind = r.key === 'development' || r.key === 'script' || r.key === 'storyboard' ? 'llm' : r.key;
              const options = providers.filter(p => p.kind === kind).map(p => `<option value="${p.id}" ${routing[r.key] === p.id ? 'selected' : ''}>${U.escape(p.name)} · ${U.escape(p.model)}</option>`).join('');
              return `<div class="routing-row">
                <label>${r.label}</label>
                <select class="select" data-route="${r.key}">
                  <option value="">自动（第一个可用 ${kind.toUpperCase()}）</option>
                  ${options}
                </select>
              </div>`;
            }).join('')}
          </div>
          <div class="divider"></div>
          <div class="flex between center wrap gap-8">
            <div class="tiny faint" style="line-height:1.8">Ollama / LM Studio 本地模型可填 <span class="mono">http://localhost:11434/v1</span>，API Key 可留空。</div>
            <button class="btn btn-sm" id="save-routing">${window.Icons.check} 保存路由</button>
          </div>
        </div>

        <div class="card mt-16">
          <div class="card-title">${window.Icons.shield} 安全与代理说明</div>
          <div class="card-sub mt-8" style="line-height:1.9">
            1. API Key 只写入本机 <span class="mono">workspace/settings.json</span>，不会上传到任何第三方；请勿在公共电脑保存长期 Key。<br/>
            2. Base URL 需要包含版本路径，例如 <span class="mono">https://api.deepseek.com/v1</span>；程序会自动拼接 <span class="mono">/chat/completions</span>。<br/>
            3. 图像模型需支持 <span class="mono">/images/generations</span> 且返回 b64_json 或 url；语音需支持 <span class="mono">/audio/speech</span>。<br/>
            4. 所有 AI 生成结果都必须人工复核：Skill 要求的是可拍摄、可执行，而不是“看起来对”。
          </div>
        </div>
      </div>`;

    root.querySelectorAll('[data-edit-provider]').forEach(el => el.addEventListener('click', function () {
      openProvider(providers.find(p => p.id === el.dataset.editProvider));
    }));
    root.querySelectorAll('[data-del-provider]').forEach(el => el.addEventListener('click', async function () {
      const p = providers.find(x => x.id === el.dataset.delProvider);
      const ok = await U.confirm('删除 Provider', `确认删除「${U.escape(p.name)}」？相关任务路由会自动回退。`, '删除');
      if (!ok) return;
      s.providers = providers.filter(x => x.id !== p.id);
      Object.keys(routing).forEach(k => { if (routing[k] === p.id) routing[k] = ''; });
      window.Store.saveSettings();
      U.toast('已删除');
      App.refresh();
    }));
    root.querySelectorAll('[data-toggle-provider]').forEach(el => el.addEventListener('click', function () {
      const p = providers.find(x => x.id === el.dataset.toggleProvider);
      p.enabled = p.enabled === false;
      window.Store.saveSettings();
      App.refresh();
    }));

    root.querySelectorAll('[data-test]').forEach(el => el.addEventListener('click', async function () {
      const p = providers.find(x => x.id === el.dataset.test);
      if (!p) return;
      const btn = el;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> 测试中';
      try {
        const res = await window.duanju.testProvider(p);
        if (res.ok) {
          btn.innerHTML = window.Icons.check + ' 连接正常';
          U.toast('连接成功' + (res.models?.length ? `，可用模型 ${res.models.length} 个` : ''), 'ok');
        } else {
          btn.innerHTML = window.Icons.x + ' 连接失败';
          U.toast(res.message || '连接失败', 'err');
        }
      } catch (e) {
        btn.innerHTML = window.Icons.x + ' 连接失败';
        U.toast('测试失败：' + e.message, 'err');
      } finally {
        btn.disabled = false;
        btn.classList.remove('btn-ghost');
      }
    }));

    root.querySelector('#add-provider').addEventListener('click', () => openProvider(null));
    const addEmpty = root.querySelector('#add-empty');
    if (addEmpty) addEmpty.addEventListener('click', () => openProvider(null));
    root.querySelector('#open-settings').addEventListener('click', () => App.go('settings'));
    const openUsage = root.querySelector('#open-usage');
    if (openUsage) openUsage.addEventListener('click', () => App.openUsage());

    root.querySelector('#save-routing').addEventListener('click', function () {
      root.querySelectorAll('[data-route]').forEach(function (sel) {
        s.routing[sel.dataset.route] = sel.value;
      });
      window.Store.saveSettings();
      U.toast('任务路由已保存', 'ok');
      App.refresh();
    });

    function providerCard(p) {
      const kind = D.providerKinds.find(k => k.key === p.kind) || { label: p.kind, badge: '?' };
      const pu = (usage.byModel || []).find(x => x.name === p.model) || null;
      const routed = Object.entries(routing).filter(([k, v]) => v === p.id).map(([k]) => (D.routing.find(r => r.key === k) || {}).label).filter(Boolean);
      return `<div class="card provider-card ${p.enabled === false ? 'is-off' : ''}">
        <div class="pv-head">
          <div class="pv-logo" style="color:${p.kind === 'llm' ? 'var(--violet)' : p.kind === 'image' ? 'var(--accent-2)' : p.kind === 'tts' ? 'var(--teal)' : 'var(--accent)'}">${kind.badge}</div>
          <div class="flex1">
            <div class="pv-name">${U.escape(p.name)}</div>
            <div class="pv-kind">${kind.label} · ${p.enabled === false ? '已停用' : '已启用'}</div>
          </div>
          <div class="pv-status"><span class="chip ${p.enabled === false ? 'warn' : 'teal'}">${p.enabled === false ? '停用' : '启用'}</span></div>
        </div>
        <div class="pv-row"><span>Base URL</span><span title="${U.escape(p.baseUrl)}">${U.escape(p.baseUrl)}</span></div>
        <div class="pv-row"><span>模型</span><span>${U.escape(p.model || '未填写')}</span></div>
        <div class="pv-row"><span>API Key</span><span>${p.apiKey ? '••••••••' + U.escape(p.apiKey.slice(-4)) : '未填写（本地模型可留空）'}</span></div>
        ${routed.length ? `<div class="pv-row"><span>任务</span><span>${U.escape(routed.join('、'))}</span></div>` : ''}
        <div class="pv-row"><span>Token 用量</span><span>${pu ? `${U.num(pu.total)} · ${U.num(pu.calls)} 次` : '暂无调用'}</span></div>
        <div class="pv-actions">
          <button class="btn btn-sm btn-ghost" data-test="${p.id}">${window.Icons.bolt} 测试连接</button>
          <button class="btn btn-sm btn-ghost" data-edit-provider="${p.id}">${window.Icons.edit} 编辑</button>
          <button class="btn btn-sm btn-ghost" data-toggle-provider="${p.id}">${p.enabled === false ? '启用' : '停用'}</button>
          <button class="btn btn-sm btn-ghost" data-del-provider="${p.id}" style="margin-left:auto">${window.Icons.trash}</button>
        </div>
      </div>`;
    }

    function openProvider(p) {
      const isNew = !p;
      const item = p || { id: U.uid('prov'), name: '', kind: 'llm', baseUrl: '', apiKey: '', model: '', enabled: true, note: '' };
      const m = U.modal({
        title: isNew ? '添加模型 Provider' : '编辑 Provider',
        wide: true,
        body: `
          <div class="flex gap-6 wrap" style="margin-bottom:14px" id="preset-row">
            ${[
              ['DeepSeek', 'https://api.deepseek.com/v1', 'deepseek-chat', 'llm'],
              ['OpenAI', 'https://api.openai.com/v1', 'gpt-4o-mini', 'llm'],
              ['通义千问', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 'qwen-plus', 'llm'],
              ['智谱 GLM', 'https://open.bigmodel.cn/api/paas/v4', 'glm-4-flash', 'llm'],
              ['Ollama 本地', 'http://localhost:11434/v1', 'qwen2.5:7b', 'llm'],
              ['OpenAI 图像', 'https://api.openai.com/v1', 'gpt-image-1', 'image']
            ].map(x => `<button class="chip" data-preset="${x[1]}|${x[2]}|${x[3]}|${x[0]}">${x[0]}</button>`).join('')}
          </div>
          <div class="provider-form">
            <div class="field"><div class="field-label">名称<span class="req">必填</span></div><input class="input" id="pv-name" value="${U.escape(item.name)}" placeholder="如：DeepSeek 主模型" /></div>
            <div class="field"><div class="field-label">类型</div><select class="select" id="pv-kind">${D.providerKinds.map(k => `<option value="${k.key}" ${item.kind === k.key ? 'selected' : ''}>${k.label}（${k.badge}）</option>`).join('')}</select></div>
            <div class="field full"><div class="field-label">Base URL<span class="req">必填</span><span class="hint">${U.escape((D.providerKinds.find(k => k.key === item.kind) || {}).hint || '')}</span></div><input class="input" id="pv-base" value="${U.escape(item.baseUrl)}" placeholder="https://api.deepseek.com/v1" /></div>
            <div class="field"><div class="field-label">模型名称<span class="req">必填</span></div><input class="input" id="pv-model" value="${U.escape(item.model)}" placeholder="deepseek-chat" /></div>
            <div class="field"><div class="field-label">API Key<span class="hint">本地模型可留空</span></div><input class="input" id="pv-key" type="password" value="${U.escape(item.apiKey)}" placeholder="sk-..." /></div>
            <div class="field full"><div class="field-label">备注</div><input class="input" id="pv-note" value="${U.escape(item.note || '')}" placeholder="用途 / 额度 / 代理说明" /></div>
          </div>
          <div class="card-sub" style="line-height:1.8">提示：Anthropic、Gemini 等非 OpenAI 协议接口需先经兼容网关转换；视频模型目前为预留类型，可在后续版本接入自定义端点。</div>`,
        footer: `<button class="btn" data-close>取消</button><button class="btn btn-primary" id="save-provider">保存</button>`
      });

      m.root.querySelectorAll('[data-preset]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const [base, model, kind, name] = btn.dataset.preset.split('|');
          m.root.querySelector('#pv-base').value = base;
          m.root.querySelector('#pv-model').value = model;
          m.root.querySelector('#pv-kind').value = kind;
          if (!m.root.querySelector('#pv-name').value) m.root.querySelector('#pv-name').value = name;
        });
      });

      m.root.querySelector('#save-provider').addEventListener('click', function () {
        const name = m.root.querySelector('#pv-name').value.trim();
        const base = m.root.querySelector('#pv-base').value.trim();
        const model = m.root.querySelector('#pv-model').value.trim();
        if (!name || !base || !model) { U.toast('名称、Base URL、模型名称均为必填', 'err'); return; }
        item.name = name;
        item.kind = m.root.querySelector('#pv-kind').value;
        item.baseUrl = base;
        item.model = model;
        item.apiKey = m.root.querySelector('#pv-key').value.trim();
        item.note = m.root.querySelector('#pv-note').value.trim();
        if (isNew) s.providers = (s.providers || []).concat([item]);
        window.Store.saveSettings();
        m.close();
        U.toast('Provider 已保存', 'ok');
        App.refresh();
      });
    }
  };
})();
