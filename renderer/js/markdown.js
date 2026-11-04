/* Markdown 导出：对齐 duanju Skill 的产物路径与结构 */
(function () {
  const M = {};
  const U = window.U;
  const D = window.D;

  function line(v) { return String(v == null ? '' : v).trim(); }
  // 表格单元格：转义竖线与换行，避免破坏 Markdown 表格
  function cell(v) { return line(v).replace(/\|/g, '｜').replace(/\r?\n/g, ' '); }
  function section(title, body) {
    const b = line(body);
    return b ? `## ${title}\n\n${b}\n` : '';
  }
  function bulletList(arr, empty) {
    if (!arr || !arr.length) return empty || '';
    return arr.map(x => `- ${line(x)}`).filter(x => x !== '- ').join('\n') + '\n';
  }
  function kv(label, value) {
    const v = line(value);
    return v ? `- **${label}**：${v}\n` : '';
  }
  function conceptOf(project) {
    const ov = project.overview || {};
    return (ov.concepts || [])[Number(ov.choseConcept || 0)] || (ov.concepts || [])[0] || {};
  }

  M.blueprint = function (project) {
    const ov = project.overview || {};
    const pg = ov.privateGoods || {};
    const c = conceptOf(project);
    const concepts = (ov.concepts || []).map((x, i) =>
      `### ${i + 1}. ${line(x.title)}${i === Number(ov.choseConcept || 0) ? '（已选）' : ''}\n\n` +
      `- 一句话：${line(x.logline)}\n- 独特设定：${line(x.unique)}\n- 情感钩子：${line(x.hook)}\n- 最能打动：${line(x.emotion)}\n`
    ).join('\n');
    return `# 立项蓝图 · ${line(ov.title || project.name)}

> 阶段 0 产物。本文件决定“怎么拍、拍多少、给谁看”，故事规格阶段将据此展开。

## 一、项目信息

${kv('项目名称', ov.title || project.name)}
${kv('一句话高概念', ov.logline || c.logline)}
${kv('故事类型', ov.genre)}
${kv('目标平台', ov.platform)}
${kv('目标用户', ov.audience)}
${kv('总集数', ov.episodes)}
${kv('单集时长', ov.duration)}
${kv('制作预算', ov.budget)}
${kv('核心情绪', (ov.emotions || []).join('、'))}
${kv('结局倾向', ov.ending)}
${kv('商业模式', ov.businessModel)}

## 二、私货采集（不可替代性）

${kv('最想表达的主题', pg.theme)}
${kv('亲身经历的情感瞬间', pg.moment)}
${kv('最讨厌的套路', pg.hatedTrope)}
${kv('最近一次强烈情绪场景', pg.recentScene)}
${kv('你相信的一句话', pg.belief)}
${kv('童年味道 / 父母的小动作', pg.childhood)}
${kv('至今愧疚的瞬间', pg.regret)}
${section('高概念候选', concepts)}
${section('阶段裁剪建议', '本阶段完成立项与私货；故事规格阶段完成发动机、规则、人物、秘密、阶段、情绪曲线与分集大纲。')}
`;
  };

  M.spec = function (project) {
    const ov = project.overview || {};
    const c = conceptOf(project);
    const r = project.review || {};
    const e = project.engine || {};
    const p = e.protagonist || {};
    const d = e.desires || {};
    const o = e.obstacles || {};
    const fc = e.finalChoice || {};
    const rival = e.rival || {};
    const chars = project.characters || [];
    const rels = project.relations || [];
    const secrets = project.secrets || [];
    const stages = project.stages || [];
    const score = project.score || {};
    const total = Number(score.total || 0);

    const charBlocks = chars.map(ch => {
      const depth = ch.depth || {};
      return `### ${line(ch.name)}（${line(ch.role)}）

${kv('年龄', ch.age)}${kv('外在特征', ch.look)}${kv('表面性格', ch.surface)}${kv('真实欲望', ch.desire)}${kv('恐惧', ch.fear)}${kv('秘密', ch.secret)}${kv('弱点', ch.weakness)}${kv('能力', ch.ability)}${kv('底线', ch.bottomLine)}${kv('谎言', ch.lie)}${kv('与主角的关系', ch.relation)}${kv('想从主角身上得到', ch.wants)}${kv('立场 · 前期', ch.stanceEarly)}${kv('立场 · 中段', ch.stanceMid)}${kv('立场 · 终局', ch.stanceFinal)}${kv('结局', ch.ending)}${kv('口吻', ch.voiceNote)}

**深度工坊**

${D.depths.map(x => kv(x.no + ' ' + x.label, depth[x.key])).join('')}
`;
    }).join('\n');

    const relBlocks = rels.map((rel, i) => {
      const a = chars.find(x => x.id === rel.aId);
      const b = chars.find(x => x.id === rel.bId);
      return `### 关系 ${i + 1}：${line(a?.name || rel.aName || 'A')} ⇄ ${line(b?.name || rel.bName || 'B')}

${kv('A 想从 B 得到什么', rel.wantA)}${kv('B 想从 A 得到什么', rel.wantB)}${kv('A 为什么不能直说', rel.cannotSay)}${kv('B 误解了 A 什么', rel.misread)}${kv('共同利益', rel.shared)}${kv('最终冲突', rel.conflict)}${kv('第一次变化', rel.change1)}${kv('第二次变化', rel.change2)}${kv('第三次变化', rel.change3)}`;
    }).join('\n');

    const secretBlocks = secrets.map(s => `### ${line(s.layer)}

${kv('秘密内容', s.content)}${kv('谁知道', s.known)}${kv('谁不知道', s.unknown)}${kv('谁误解', s.misread)}${kv('首次暗示', s.hintEp ? '第 ' + s.hintEp + ' 集' : '')}${kv('部分揭露', s.partialEp ? '第 ' + s.partialEp + ' 集' : '')}${kv('完全揭露', s.fullEp ? '第 ' + s.fullEp + ' 集' : '')}${kv('揭露后改变什么', s.change)}${kv('是否产生新问题', s.newProblem)}`).join('\n');

    const stageBlocks = stages.map(s => `### 阶段 ${line(s.no)} · ${line(s.name)}（第 ${line(s.from)}—${line(s.to)} 集）

${kv('阶段目标', s.goal)}${kv('主角当前目标', s.heroGoal)}${kv('对手当前目标', s.rivalGoal)}${kv('主角行动策略', s.strategy)}${kv('核心冲突', s.conflict)}${kv('主要关系变化', s.relationChange)}${kv('揭露的信息', s.revealed)}${kv('保留的信息', s.kept)}${kv('阶段性胜利', s.win)}${kv('阶段性代价', s.cost)}${kv('阶段末大反转', s.twist)}${kv('下一阶段钩子', s.hook)}`).join('\n');

    const emotion = (project.emotionCurve || []).map(x => `| 第 ${cell(x.ep)} 集 | ${cell(x.phase)} | ${cell(x.type)} | ${cell(x.note)} |`).join('\n');
    const cliffs = (project.cliffhangers || []).slice(0, Math.min(20, ov.episodes || 20)).map(x => `| 第 ${cell(x.ep)} 集 | ${cell(x.type)} | ${cell(x.text)} |`).join('\n');

    return `# 故事规格 · ${line(ov.title || project.name)}

> 阶段 1 产物。遵循“先发动机、后分集”，删除核心规则后故事不成立。

## 一、项目理解

${kv('项目名称', ov.title || project.name)}
${kv('一句话高概念', ov.logline || c.logline)}
${kv('目标形式', '竖屏短剧 · ' + (ov.episodes || 60) + ' 集 · 单集 ' + (ov.duration || '1—3分钟'))}
${kv('目标用户', ov.audience)}
${kv('核心情绪', (ov.emotions || []).join('、'))}
${kv('私货主题', ov.privateGoods?.theme)}
${kv('采用的默认假设', '缺失字段按 Skill 默认值补齐：60 集、1—3 分钟、中低成本、6—8 名演员、4—6 个场景。')}

## 二、选题复核

${kv('选题优势', r.strengths)}${kv('选题风险', r.risks)}${kv('最独特的变量', r.uniqueVar)}${kv('最容易俗套的部分', r.cliche)}${kv('是否适合短剧', r.suitable)}${kv('建议保留', r.keep)}${kv('建议调整', r.adjust)}${kv('开发结论', r.conclusion)}${kv('复核状态', r.passed ? '通过，可进入故事规格' : '未通过 / 待复核')}

## 三、故事发动机

${kv('主角', p.name)}${kv('表面身份', p.identity)}${kv('真实处境', p.situation)}${kv('最大性格缺陷', p.flaw)}${kv('最擅长能力', p.ability)}${kv('最害怕面对的事', p.fear)}${kv('最想保护的人', p.protect)}
${kv('表层目标', d.surface)}${kv('深层需求', d.deep)}${kv('隐藏欲望', d.hidden)}
${kv('启动事件', e.inciting)}

**主角为什么不能退出**

${bulletList(e.cannotQuit, '待补充（至少 2 个原因）')}

**核心阻碍**

${kv('外部阻碍', o.external)}${kv('内部阻碍', o.internal)}${kv('关系阻碍', o.relational)}${kv('规则阻碍', o.rule)}
${kv('核心对手', rival.name)}${kv('对手目标', rival.goal)}${kv('对手真实目标', rival.trueGoal)}${kv('对手行动逻辑', rival.logic)}${kv('镜像关系', rival.mirror)}
${kv('双方冲突本质', rival.mirror)}
${kv('升级机制', (e.escalations || []).join('；'))}
${kv('最终选择', fc.question ? `${fc.a} vs ${fc.b}：${fc.question}` : '')}

## 四、核心规则

${(project.rules || []).map((rule, i) => `### 规则 ${i + 1} · ${line(rule.name)}

${kv('规则来源', rule.source)}${kv('规则持有者', rule.holder)}${kv('触发条件', rule.trigger)}${kv('规则效果', rule.effect)}${kv('使用收益', rule.gain)}${kv('即时代价', rule.costNow)}${kv('长期代价', rule.costLong)}${kv('使用限制', rule.limits)}${kv('禁止事项', rule.forbidden)}${kv('规则漏洞', rule.loophole)}${kv('规则误导', rule.misdirection)}${kv('规则反噬', rule.backlash)}${kv('对手利用方式', rule.rivalUse)}${kv('主角错误理解', rule.misread)}${kv('规则真实目的', rule.purpose)}${kv('最终解决方式', rule.resolution)}`).join('\n') || '待补充核心规则。'}

## 五、人物系统

${charBlocks || '待补充人物卡。'}

## 六、人物关系

${relBlocks || '待补充关键关系 7 问。'}

## 七、秘密与真相系统

${secretBlocks || '待补充四层秘密。'}

## 八、整剧阶段

${stageBlocks || '待补充 6—8 个阶段。'}

## 九、情绪曲线

| 集数 | 循环位置 | 情绪类型 | 说明 |
|---|---|---|---|
${emotion || '| — | — | — | 待补充 |'}

## 十、前 20 集卡点表

| 集数 | 类型 | 卡点句 |
|---|---|---|
${cliffs || '| — | — | 待补充 |'}

## 十一、制作与商业可行性

${kv('主要场景', project.feasibility?.scenes)}${kv('核心演员', project.feasibility?.actors)}${kv('特效需求', project.feasibility?.effects)}${kv('外景依赖', project.feasibility?.location)}${kv('成本风险', project.feasibility?.risk)}${kv('降级方案', project.feasibility?.plan)}

## 十二、风险诊断

${kv('剧情重复风险', project.risks?.repeat)}${kv('人物工具化风险', project.risks?.tooling)}${kv('规则失控风险', project.risks?.rule)}${kv('中段疲软风险', project.risks?.midsag)}${kv('反转过度风险', project.risks?.twist)}${kv('制作成本风险', project.risks?.cost)}${kv('内容合规风险', project.risks?.compliance)}${kv('侵权撞题风险', project.risks?.ip)}${kv('优化方案', project.risks?.plan)}

## 十三、综合评分

${D.scoreDims.map(x => `- ${x.label}：${Number(score.dimensions?.[x.key] || 0)} / ${x.max}`).join('\n')}
- **总分**：${total} / 100
${kv('结论', score.verdict)}${kv('优先修改', score.priority)}${kv('进入下一阶段前必须确认', score.mustConfirm)}
${total < 70 ? '\n> 总分低于 70：建议先重构核心规则或人物目标，再进入分集开发。' : ''}
`;
  };

  M.outline = function (project) {
    const ov = project.overview || {};
    const outline = (project.outline || []).slice().sort((a, b) => Number(a.ep) - Number(b.ep));
    const body = outline.map((o, i) => {
      const next = outline[i + 1];
      const stage = (project.stages || []).find(s => Number(o.ep) >= Number(s.from) && Number(o.ep) <= Number(s.to));
      return `## 第 ${o.ep} 集

- **所属阶段**：${line(o.stage || stage?.name)}
- **情绪循环位置**：${line((project.emotionCurve || []).find(e => Number(e.ep) === Number(o.ep))?.phase || '—')}
- **卡点类型**：${line(o.cliffType)}

| 要素 | 内容 |
|---|---|
| 本集目标 | ${cell(o.goal)} |
| 开场钩子 | ${cell(o.hook)} |
| 主角行动 | ${cell(o.action)} |
| 对手反制 | ${cell(o.counter)} |
| 核心冲突 | ${cell(o.conflict)} |
| 新增信息 | ${cell(o.info)} |
| 关系变化 | ${cell(o.relation)} |
| 本集结果 | ${cell(o.result)} |
| 结尾卡点 | ${cell(o.cliff)} |

> 衔接下集：${next ? `第 ${next.ep} 集开场「${line(next.hook)}」` : '全剧收束'}
`;
    }).join('\n');
    return `# 分集大纲 · ${line(ov.title || project.name)}

> 阶段 2 产物。集数与蓝图一致：共 ${(project.outline || []).length} / ${ov.episodes || 60} 集。每集独立一节，供阶段 3 剧本引用。

${body || '尚未生成分集大纲。'}
`;
  };

  M.script = function (project, ep) {
    const ov = project.overview || {};
    const shots = (project.shots || []).filter(s => Number(s.ep) === Number(ep)).sort((a, b) => Number(a.no) - Number(b.no));
    const o = (project.outline || []).find(x => Number(x.ep) === Number(ep));
    const totalSec = shots.reduce((a, s) => a + Number(s.duration || 0), 0);
    const dialogues = shots.map(s => line(s.dialogue)).filter(Boolean).join('\n');
    const table = shots.map(s => `| ${s.no} | ${cell(s.size)} | ${cell(s.sceneTitle)} | ${cell(s.action)} | ${cell(s.dialogue) || '—'} | ${cell(s.sound) || '—'} | ${cell(s.emotion) || '—'} | ${s.duration || 0}s |`).join('\n');
    return `# 第 ${ep} 集 · ${line(ov.title || project.name)}

> 竖屏 9:16 · 本集预计 ${totalSec} 秒 · 台词 ${U.words(dialogues)} 字 · 镜头 ${shots.length} 个

## 本集信息

${kv('所属阶段', o?.stage)}${kv('本集目标', o?.goal)}${kv('开场钩子', o?.hook)}${kv('结尾卡点', o?.cliff)}${kv('卡点类型', o?.cliffType)}

## 逐镜头表

| # | 景别 | 场景 | 动作 / 画面 | 对白 / OS | 音效 | 情绪 | 时长 |
|---|---|---|---|---|---|---|---|
${table || '| — | — | — | 尚未生成剧本 | — | — | — | — |'}
${o?.cliff ? `\n字幕：${line(o.cliff)}\n` : ''}
`;
  };

  M.shotList = function (project) {
    const shots = (project.shots || []).slice().sort((a, b) => Number(a.ep) - Number(b.ep) || Number(a.no) - Number(b.no));
    const body = shots.map(s => `| ${s.ep} | ${s.no} | ${cell(s.size)} | ${cell(s.sceneTitle)} | ${cell(s.action)} | ${cell(s.dialogue) || '—'} | ${s.duration || 0}s | ${cell(s.prompt)} |`).join('\n');
    return `# 分镜与出图提示 · ${line(project.overview?.title || project.name)}\n\n| 集 | 镜 | 景别 | 场景 | 画面 | 台词 | 时长 | 生成提示 |\n|---|---|---|---|---|---|---|---|\n${body || '| — | — | — | — | — | — | — | 尚未生成分镜 |'}\n`;
  };

  M.buildFiles = function (project, options) {
    const opts = options || {};
    const files = [
      { path: 'docs/SHORT_DRAMA_BLUEPRINT.md', content: M.blueprint(project) },
      { path: 'docs/STORY_SPEC.md', content: M.spec(project) },
      { path: 'docs/EPISODE_OUTLINE.md', content: M.outline(project) },
      { path: 'docs/SHOT_LIST.md', content: M.shotList(project) }
    ];
    const eps = opts.episodes || Object.keys(project.scriptStatus || {}).filter(k => project.scriptStatus[k]).map(Number);
    eps.sort((a, b) => a - b).forEach(ep => {
      files.push({ path: `docs/scripts/EP${String(ep).padStart(2, '0')}.md`, content: M.script(project, ep) });
    });
    return files;
  };

  window.M = M;
})();
