/* 业务元数据：流水线、字段结构、评分、资产与模型类型 */
(function () {
  const D = {};

  D.phases = [
    { id: 'g0', no: '01', name: '立项', steps: ['topic'] },
    { id: 'g1', no: '02', name: '故事规格', optional: true, steps: ['review', 'engine', 'rules', 'characters', 'rival', 'secrets', 'stages', 'emotion', 'cliffhangers'] },
    { id: 'g2', no: '03', name: '分集大纲', steps: ['outline'] },
    { id: 'g3', no: '04', name: '正式剧本', steps: ['scripts'] },
    { id: 'g4', no: '05', name: '制作评估', steps: ['feasibility', 'risks', 'score'] },
    { id: 'g5', no: '06', name: '分镜与成片', steps: ['storyboard'] }
  ];

  D.steps = [
    {
      id: 'topic', no: '00', title: '私货与立项', icon: 'compass', gate: 'g0', view: 'topic',
      desc: '私货是不可替代性，AI 只放大、不拥有。先写下作者真实的主题、瞬间与细节；高概念在「选题库」中按参数生成，应用后写入这里的立项蓝图。',
      tips: ['缺失项逐项询问作者，不替作者编造私货', '选题在「选题库」生成，5—9 个方向，剔除正确但平庸的', '先发散、再聚焦，挑一个让你心里一紧的'],
      fields: [
        { key: 'privateGoods.theme', label: '最想表达的主题', type: 'textarea', placeholder: '如：爱会让人变得自私', hint: '唯一允许向作者提问的环节' },
        { key: 'privateGoods.moment', label: '亲身经历的情感瞬间', type: 'textarea', placeholder: '哪怕很小：一次没说出口的告别' },
        { key: 'privateGoods.hatedTrope', label: '最讨厌的套路', type: 'textarea', placeholder: '如：主角最后靠巧合胜利' },
        { key: 'privateGoods.recentScene', label: '最近一次愤怒 / 羞愧 / 心碎 / 荒诞的具体场景', type: 'textarea' },
        { key: 'privateGoods.belief', label: '你相信的一句话', type: 'textarea' },
        { key: 'privateGoods.childhood', label: '童年味道 / 父母的一个小动作', type: 'textarea' },
        { key: 'privateGoods.regret', label: '一段至今愧疚的瞬间', type: 'textarea' }
      ]
    },
    {
      id: 'review', no: '01', title: '选题复核', icon: 'shield', gate: 'g1',
      desc: '检查概念能否一句话讲清、是否有独特变量、否只是旧套路换皮，并确认它有足够的目标升级与真相反转。',
      tips: ['概念能否一句话讲清', '是否具备 ≥5 轮目标升级', '≥3 次关系变化、≥2 次真相反转、1 个不可逆选择', '发现相似度过高：至少替换两个核心变量'],
      fields: [
        { key: 'strengths', label: '选题优势', type: 'textarea', rows: 3 },
        { key: 'risks', label: '选题风险', type: 'textarea', rows: 3 },
        { key: 'uniqueVar', label: '最独特的变量', type: 'textarea', rows: 2 },
        { key: 'cliche', label: '最容易俗套的部分', type: 'textarea', rows: 2 },
        { key: 'suitable', label: '是否适合短剧', type: 'select', options: ['适合', '需调整', '不适合'] },
        { key: 'keep', label: '建议保留', type: 'textarea', rows: 2 },
        { key: 'adjust', label: '建议调整', type: 'textarea', rows: 2 },
        { key: 'conclusion', label: '开发结论', type: 'textarea', rows: 3 },
        { key: 'passed', label: '复核通过（可进入故事规格）', type: 'checkbox' }
      ]
    },
    {
      id: 'engine', no: '02', title: '故事发动机', icon: 'engine', gate: 'g1',
      desc: '发动机高于剧情数量。先回答“这个故事为什么能持续发生”，再写任何一集剧情。',
      tips: ['主角必须有主动目标，不能长期被动', '至少两个不能退出的原因', '冲突来自目标对立，而非无意义争吵', '最终选择必须在两个价值之间'],
      fields: [
        { key: 'protagonist.name', label: '主角姓名' },
        { key: 'protagonist.identity', label: '表面身份' },
        { key: 'protagonist.situation', label: '真实处境', type: 'textarea', rows: 2 },
        { key: 'protagonist.flaw', label: '最大性格缺陷', type: 'textarea', rows: 2 },
        { key: 'protagonist.ability', label: '最擅长的能力' },
        { key: 'protagonist.fear', label: '最害怕面对的事', type: 'textarea', rows: 2 },
        { key: 'protagonist.protect', label: '最想保护的人' },
        { key: 'desires.surface', label: '表层目标', type: 'textarea', rows: 2 },
        { key: 'desires.deep', label: '深层需求', type: 'textarea', rows: 2 },
        { key: 'desires.hidden', label: '隐藏欲望', type: 'textarea', rows: 2 },
        { key: 'inciting', label: '启动事件（第一集发生、不可逆、与规则相关）', type: 'textarea', rows: 3 },
        { key: 'obstacles.external', label: '外部阻碍', type: 'textarea', rows: 2 },
        { key: 'obstacles.internal', label: '内部阻碍', type: 'textarea', rows: 2 },
        { key: 'obstacles.relational', label: '关系阻碍', type: 'textarea', rows: 2 },
        { key: 'obstacles.rule', label: '规则阻碍', type: 'textarea', rows: 2 },
        { key: 'finalChoice.a', label: '最终选择 · 价值 A' },
        { key: 'finalChoice.b', label: '最终选择 · 价值 B' },
        { key: 'finalChoice.question', label: '不可逆的两难问题', type: 'textarea', rows: 2 }
      ],
      repeaters: [
        { key: 'cannotQuit', label: '主角为什么不能退出', placeholder: '时间压力 / 亲人安全 / 无法解除的契约 / 道德责任…', addText: '添加退出阻碍' },
        { key: 'escalations', label: '升级机制（至少 6 种）', placeholder: '对手升级 / 信息升级 / 代价升级 / 关系破裂…', addText: '添加升级维度' }
      ]
    },
    {
      id: 'rules', no: '03', title: '核心规则', icon: 'bolt', gate: 'g1',
      desc: '删除规则后故事仍然成立，说明规则只是装饰，必须重写。每条规则都要有收益、代价、限制、漏洞与反噬。',
      tips: ['容易理解，难以逃避', '可重复触发，每次结果不同', '使用越多风险越大', '对手能利用或反制'],
      fields: [],
      collection: {
        key: 'rules', label: '规则', addText: '新增核心规则', newItem: () => ({ id: window.U.uid('rule'), name: '新规则' }),
        fields: [
          { key: 'name', label: '规则名称', required: true },
          { key: 'source', label: '规则来源' },
          { key: 'holder', label: '规则持有者' },
          { key: 'trigger', label: '触发条件', type: 'textarea', rows: 2 },
          { key: 'effect', label: '规则效果', type: 'textarea', rows: 2 },
          { key: 'gain', label: '使用收益', type: 'textarea', rows: 2 },
          { key: 'costNow', label: '即时代价', type: 'textarea', rows: 2 },
          { key: 'costLong', label: '长期代价', type: 'textarea', rows: 2 },
          { key: 'limits', label: '使用限制', type: 'textarea', rows: 2 },
          { key: 'forbidden', label: '禁止事项', type: 'textarea', rows: 2 },
          { key: 'loophole', label: '规则漏洞', type: 'textarea', rows: 2 },
          { key: 'misdirection', label: '规则误导', type: 'textarea', rows: 2 },
          { key: 'backlash', label: '规则反噬', type: 'textarea', rows: 2 },
          { key: 'rivalUse', label: '对手利用方式', type: 'textarea', rows: 2 },
          { key: 'misread', label: '主角错误理解', type: 'textarea', rows: 2 },
          { key: 'purpose', label: '规则真实目的', type: 'textarea', rows: 2 },
          { key: 'resolution', label: '最终解决方式', type: 'textarea', rows: 2 }
        ]
      }
    },
    {
      id: 'characters', no: '04', title: '人物系统', icon: 'users', gate: 'g1',
      desc: '人物卡回答“你是谁”，深度工坊回答“你像不像活人”。主角与核心对手至少填 5 项，④⑤⑥⑧ 必填。',
      tips: ['每个主要角色都有欲望，不只是功能', '关键关系回答 7 问', '至少三段关系发生变化', '对手不是纯恶，至少一次真正帮助主角'],
      custom: 'characters'
    },
    {
      id: 'rival', no: '05', title: '对手系统', icon: 'target', gate: 'g1',
      desc: '对手必须有自己的目标、行动逻辑、资源优势与合理动机，并与主角形成镜像关系。',
      tips: ['对手应有识别主角弱点的能力', '至少一次真正帮助主角', '至少一次抓住主角内部弱点', '终局迫使主角面对自身缺陷'],
      fields: [
        { key: 'name', label: '核心对手' },
        { key: 'identity', label: '身份 / 资源优势' },
        { key: 'goal', label: '表层目标', type: 'textarea', rows: 2 },
        { key: 'trueGoal', label: '真实目标', type: 'textarea', rows: 2 },
        { key: 'logic', label: '行动逻辑', type: 'textarea', rows: 2 },
        { key: 'motive', label: '情感动机', type: 'textarea', rows: 2 },
        { key: 'mirror', label: '与主角的镜像关系', type: 'textarea', rows: 2 },
        { key: 'weaknessHit', label: '如何击中主角内部弱点', type: 'textarea', rows: 2 },
        { key: 'help', label: '哪一次真正帮助了主角', type: 'textarea', rows: 2 }
      ]
    },
    {
      id: 'secrets', no: '06', title: '核心秘密', icon: 'lock', gate: 'g1',
      desc: '四层秘密：即时秘密负责追更，关系秘密改变立场，主线秘密改变目标，终极真相重新解释全文。',
      tips: ['终极真相必须提前埋行为异常 / 道具线索 / 时间矛盾', '每层秘密都有暗示、部分揭露、完全揭露节点', '揭露后必须改变什么，并产生新问题'],
      collection: {
        key: 'secrets', label: '秘密', addText: '新增秘密', newItem: () => ({ id: window.U.uid('secret'), layer: '即时秘密' }),
        fields: [
          { key: 'layer', label: '秘密层级', type: 'select', options: ['即时秘密', '关系秘密', '主线秘密', '终极真相'] },
          { key: 'content', label: '秘密内容', type: 'textarea', rows: 2 },
          { key: 'known', label: '谁知道' },
          { key: 'unknown', label: '谁不知道' },
          { key: 'misread', label: '谁误解' },
          { key: 'hintEp', label: '首次暗示集数' },
          { key: 'partialEp', label: '部分揭露集数' },
          { key: 'fullEp', label: '完全揭露集数' },
          { key: 'change', label: '揭露后改变什么', type: 'textarea', rows: 2 },
          { key: 'newProblem', label: '是否产生新问题', type: 'textarea', rows: 2 }
        ]
      }
    },
    {
      id: 'stages', no: '07', title: '故事阶段', icon: 'layers', gate: 'g1',
      desc: '先分 6—8 个阶段，再写分集。中点必须发生根本变化，后半段不能是前半段重复。',
      tips: ['异常进入 → 试探规则 → 主动进攻 → 错误胜利', '中点反转 → 全面失控 → 最低点 → 终极对决'],
      collection: {
        key: 'stages', label: '阶段', addText: '新增阶段', newItem: () => ({ id: window.U.uid('stage'), no: (window.Store && window.Store.project ? window.Store.project.stages.length + 1 : 1), name: '新阶段' }),
        rowTitle: (item) => `阶段 ${item.no || ''} · ${item.name || '未命名'}`,
        fields: [
          { key: 'no', label: '阶段序号' },
          { key: 'name', label: '阶段名称' },
          { key: 'from', label: '起始集' },
          { key: 'to', label: '结束集' },
          { key: 'goal', label: '阶段目标', type: 'textarea', rows: 2 },
          { key: 'heroGoal', label: '主角当前目标', type: 'textarea', rows: 2 },
          { key: 'rivalGoal', label: '对手当前目标', type: 'textarea', rows: 2 },
          { key: 'strategy', label: '主角行动策略', type: 'textarea', rows: 2 },
          { key: 'conflict', label: '核心冲突', type: 'textarea', rows: 2 },
          { key: 'relationChange', label: '主要关系变化', type: 'textarea', rows: 2 },
          { key: 'revealed', label: '揭露的信息', type: 'textarea', rows: 2 },
          { key: 'kept', label: '保留的信息', type: 'textarea', rows: 2 },
          { key: 'win', label: '阶段性胜利', type: 'textarea', rows: 2 },
          { key: 'cost', label: '阶段性代价', type: 'textarea', rows: 2 },
          { key: 'twist', label: '阶段末大反转', type: 'textarea', rows: 2 },
          { key: 'hook', label: '下一阶段进入钩子', type: 'textarea', rows: 2 }
        ]
      }
    },
    {
      id: 'emotion', no: '08', title: '情绪曲线', icon: 'pulse', gate: 'g1',
      desc: '每 10 集左右形成一次情绪循环：压迫 → 反击 → 小胜 → 新疑问 → 关系升温 → 风险增加 → 背叛 → 绝境 → 反转 → 释放。',
      tips: ['全剧至少 3 次爽点高潮', '2 次关系重大变化、2 次真相级反转', '1 次主角最低点、1 次不可逆损失、1 次最终释放'],
      collection: {
        key: 'emotionCurve', label: '情绪节点', addText: '新增情绪节点', newItem: () => ({ id: window.U.uid('emo'), ep: 1, phase: '压迫', type: '虐点' }),
        fields: [
          { key: 'ep', label: '集数' },
          { key: 'phase', label: '循环位置', type: 'select', options: ['压迫', '反击', '小胜', '新疑问', '关系升温', '风险增加', '背叛', '绝境', '反转', '释放'] },
          { key: 'type', label: '情绪类型', type: 'select', options: ['爽点', '虐点', '甜点', '悬疑点', '反转点', '最低点', '释放点'] },
          { key: 'note', label: '说明', type: 'textarea', rows: 2 }
        ]
      }
    },
    {
      id: 'cliffhangers', no: '09', title: '悬念与卡点', icon: 'hook', gate: 'g1',
      desc: '每集结尾必须有强卡点，且禁止连续两集同类型。五种类型轮换：信息 / 危机 / 关系 / 选择 / 反转。',
      tips: ['信息型：关键证据、真相反转、错误对象', '危机型：被抓、将死、规则触发、时间耗尽', '关系型：盟友背叛、恋人倒戈', '选择型：二选一、牺牲关系', '反转型：受害者是操控者、记忆为假'],
      collection: {
        key: 'cliffhangers', label: '卡点', addText: '新增卡点', newItem: () => ({ id: window.U.uid('cliff'), ep: 1, type: '信息', text: '' }),
        rowTitle: (item) => `第 ${item.ep} 集 · ${item.type}型`,
        fields: [
          { key: 'ep', label: '集数' },
          { key: 'type', label: '卡点类型', type: 'select', options: ['信息', '危机', '关系', '选择', '反转'] },
          { key: 'text', label: '卡点句', type: 'textarea', rows: 2 },
          { key: 'note', label: '说明', type: 'textarea', rows: 2 }
        ]
      }
    },
    {
      id: 'outline', no: '10', title: '分集大纲', icon: 'list', gate: 'g2',
      desc: '每集必须包含目标、开场钩子、主角行动、对手反制、核心冲突、新增信息、关系变化、结果与结尾卡点。',
      tips: ['开场 5 秒内出冲突 / 异常 / 危险', '主角每集想完成一件具体的事，且不能顺利完成', '每集至少改变信息 / 关系 / 风险 / 目标之一', '结尾必须产生追更动力，卡点类型轮换'],
      custom: 'outline'
    },
    {
      id: 'scripts', no: '11', title: '正式剧本', icon: 'script', gate: 'g3',
      desc: '把每集大纲扩展为可直接拍摄的竖屏剧本：钩子开场 + 冲突推进 + 卡点收尾，台词 300—600 字，镜头 10—25 个。',
      tips: ['开场 5 秒内出钩子', '单句台词 ≤20 字，一次发言 ≤2 句', '结尾卡点引用大纲设计且与前集不同类型', '保留一处没说出口的情感'],
      custom: 'scripts'
    },
    {
      id: 'feasibility', no: '12', title: '制作与商业可行性', icon: 'scan', gate: 'g4',
      desc: '场景与演员数量可控、特效可实现、主要冲突可通过表演和场景完成，不依赖大量不可控外景。',
      tips: ['默认 6—8 名核心演员、4—6 个主要场景', '中低成本预算，避免高成本外景与复杂特效', '制作问题不阻断大纲，只标注风险'],
      fields: [
        { key: 'scenes', label: '主要场景数量与清单', type: 'textarea', rows: 2 },
        { key: 'actors', label: '核心演员数量与配置', type: 'textarea', rows: 2 },
        { key: 'effects', label: '特效 / 特殊拍摄需求', type: 'textarea', rows: 2 },
        { key: 'location', label: '外景依赖程度', type: 'select', options: ['低', '中', '高'] },
        { key: 'risk', label: '主要成本风险', type: 'textarea', rows: 2 },
        { key: 'plan', label: '降级方案', type: 'textarea', rows: 3 }
      ]
    },
    {
      id: 'risks', no: '13', title: '风险诊断', icon: 'shield', gate: 'g4',
      desc: '逐项诊断剧情重复、人物工具化、规则失控、中段疲软、反转过度、成本、合规与侵权风险。',
      tips: ['合规与侵权风险为独立否决项', '先修最影响发动机的问题，再修局部'],
      fields: [
        { key: 'repeat', label: '剧情重复风险', type: 'textarea', rows: 2 },
        { key: 'tooling', label: '人物工具化风险', type: 'textarea', rows: 2 },
        { key: 'rule', label: '规则失控风险', type: 'textarea', rows: 2 },
        { key: 'midsag', label: '中段疲软风险', type: 'textarea', rows: 2 },
        { key: 'twist', label: '反转过度风险', type: 'textarea', rows: 2 },
        { key: 'cost', label: '制作成本风险', type: 'textarea', rows: 2 },
        { key: 'compliance', label: '内容合规风险', type: 'textarea', rows: 2 },
        { key: 'ip', label: '侵权撞题风险', type: 'textarea', rows: 2 },
        { key: 'plan', label: '具体优化方案', type: 'textarea', rows: 4 }
      ]
    },
    {
      id: 'score', no: '14', title: '综合评分', icon: 'brain', gate: 'g4',
      desc: '按 Skill 评分模型逐项打分，90—100 可进入详细分集开发；合规与侵权为独立否决项。',
      custom: 'score'
    },
    {
      id: 'storyboard', no: '15', title: '分镜与成片', icon: 'storyboard', gate: 'g5', view: 'storyboard',
      desc: '把正式剧本拆成逐镜头画面：景别、时长、情绪与出图提示，并生成首帧参考图。',
      tips: ['镜头数量 10—25 个', '单镜头时长 2—6 秒', '每集至少一个可出图的高光镜头']
    }
  ];

  D.scoreDims = [
    { key: 'hook', label: '选题钩子', max: 8 },
    { key: 'heroGoal', label: '主角目标清晰度', max: 8 },
    { key: 'engine', label: '故事发动机强度', max: 12 },
    { key: 'rival', label: '对手系统', max: 8 },
    { key: 'rule', label: '核心规则完整度', max: 10 },
    { key: 'relation', label: '人物关系张力', max: 10 },
    { key: 'escalate', label: '剧情升级能力', max: 10 },
    { key: 'endurance', label: '长线续航能力', max: 10 },
    { key: 'suspense', label: '悬念与反转能力', max: 8 },
    { key: 'emotion', label: '情绪价值', max: 6 },
    { key: 'cliff', label: '单集卡点能力', max: 5 },
    { key: 'feasibility', label: '制作可行性', max: 3 },
    { key: 'business', label: '商业传播性', max: 2 }
  ];

  D.depths = [
    { key: 'publicDesire', label: '一个公开的欲望', no: '①' },
    { key: 'hiddenFear', label: '一个隐藏的恐惧', no: '②' },
    { key: 'conflictingValue', label: '一个与欲望冲突的价值观', no: '③' },
    { key: 'habit', label: '一个反复出现的习惯动作', no: '④', must: true, ph: '具体到可拍：玩打火机、把碗洗两遍' },
    { key: 'memory', label: '一段不愿提起的记忆', no: '⑤', must: true, ph: '一提就停顿 / 转移话题' },
    { key: 'lie', label: '一句常说的谎话', no: '⑥', must: true, ph: '小而具体，不是弥天大谎' },
    { key: 'selfCruelty', label: '一个对自己残忍的时刻', no: '⑦' },
    { key: 'flawLoved', label: '一个让观众又爱又气的缺点', no: '⑧', must: true, ph: '越共情越来气的性格缺陷' },
    { key: 'kindness', label: '一个不合逻辑的温柔', no: '⑨', ph: '没必要、不划算甚至有点傻' },
    { key: 'privateMoment', label: '一个独处时的不体面瞬间', no: '⑩', ph: '对锅说“今天辛苦了”' }
  ];

  D.roles = ['主角', '核心对手', '情感关系人物', '利益盟友', '潜在背叛者', '秘密持有者', '规则解释者', '镜像人物'];

  D.cliffTypes = ['信息', '危机', '关系', '选择', '反转'];
  D.emotions = ['爽感', '悬疑', '情感拉扯', '治愈', '虐恋', '复仇', '逆袭', '科幻', '悬疑惊悚', '家庭伦理'];

  /* 故事类型分类：按大类分组，供下拉与高概念聚焦使用 */
  D.genreGroups = [
    { key: 'urban', label: '都市现实', items: ['都市情感', '职场逆袭', '婚恋家庭', '婆媳家斗', '姐弟恋', '市井群像', '银发情感'] },
    { key: 'costume', label: '古装年代', items: ['古装复仇', '宫斗宅斗', '武侠江湖', '民国虐恋', '年代情感', '神话仙侠'] },
    { key: 'suspense', label: '悬疑脑洞', items: ['悬疑推理', '犯罪追踪', '时间循环', '规则怪谈', '无限流', '末世求生', '科幻近未来', '奇幻脑洞'] },
    { key: 'wealth', label: '豪门商战', items: ['豪门逆袭', '真假千金', '契约婚姻', '总裁甜宠', '商战权谋', '追妻火葬场'] },
    { key: 'cool', label: '爽感垂类', items: ['战神归来', '神医高手', '穿越重生', '系统流', '赘婿逆袭', '萌宝助攻', '复仇爽剧', '乡村致富'] }
  ];
  D.genres = D.genreGroups.reduce((all, g) => all.concat(g.items), []);

  D.genreGroupOf = function (genre) {
    return D.genreGroups.find(g => g.items.includes(genre)) || null;
  };
  D.shotSizes = ['特写', '近景', '中景', '全景', '远景'];
  D.assetTypes = [
    { key: 'all', label: '全部' },
    { key: 'character', label: '角色' },
    { key: 'scene', label: '场景' },
    { key: 'prop', label: '道具' },
    { key: 'image', label: '图片' },
    { key: 'audio', label: '音频' },
    { key: 'video', label: '视频' },
    { key: 'reference', label: '参考' }
  ];
  D.providerKinds = [
    { key: 'llm', label: '语言模型', badge: 'LLM', hint: 'OpenAI 兼容 /chat/completions' },
    { key: 'image', label: '图像模型', badge: 'IMG', hint: 'OpenAI 兼容 /images/generations' },
    { key: 'video', label: '视频模型', badge: 'VID', hint: '预留：自定义端点' },
    { key: 'tts', label: '语音合成', badge: 'TTS', hint: 'OpenAI 兼容 /audio/speech' }
  ];
  D.routing = [
    { key: 'development', label: '故事开发' },
    { key: 'script', label: '剧本撰写' },
    { key: 'storyboard', label: '分镜提示' },
    { key: 'image', label: '参考图生成' },
    { key: 'video', label: '视频生成' },
    { key: 'tts', label: '角色配音' }
  ];

  D.stepDone = function (step, project) {
    if (!project) return false;
    const val = (key) => window.U.getPath(project, key);
    const has = (v) => v != null && String(v).trim().length > 0;
    switch (step.id) {
      case 'topic':
        return !!project.overview?.privateGoods?.theme && ((project.overview?.concepts || []).length > 0 || !!project.overview?.logline);
      case 'review':
        return !!project.review?.passed && has(project.review?.conclusion);
      case 'engine':
        return has(project.engine?.protagonist?.name) && has(project.engine?.desires?.surface) && (project.engine?.cannotQuit || []).length >= 2;
      case 'rules':
        return (project.rules || []).length > 0;
      case 'characters':
        return (project.characters || []).length >= 4 && (project.relations || []).length >= 2;
      case 'rival':
        return has(project.engine?.rival?.goal) && has(project.engine?.rival?.mirror);
      case 'secrets':
        return (project.secrets || []).length >= 4;
      case 'stages':
        return (project.stages || []).length >= 6;
      case 'emotion':
        return (project.emotionCurve || []).length >= 3;
      case 'cliffhangers':
        return (project.cliffhangers || []).length >= Math.min(5, Number(project.overview?.episodes || 5));
      case 'outline':
        return (project.outline || []).length >= Number(project.overview?.episodes || 0) * 0.8;
      case 'scripts':
        return Object.values(project.scriptStatus || {}).filter(Boolean).length > 0;
      case 'feasibility':
        return has(project.feasibility?.plan) || has(project.feasibility?.scenes);
      case 'risks':
        return has(project.risks?.plan);
      case 'score':
        return Number(project.score?.total || 0) > 0;
      case 'storyboard':
        return (project.shots || []).length > 0;
      default:
        return false;
    }
  };

  D.stepInfo = function (id) {
    return D.steps.find(s => s.id === id);
  };

  D.devSteps = D.steps.slice();
  D.devTotal = D.devSteps.length;

  /* 故事规格是“可选增强”，不计入主流程进度 */
  D.coreSteps = D.steps.filter(function (s) {
    const gate = D.phases.find(function (ph) { return ph.steps.indexOf(s.id) >= 0; });
    return !(gate && gate.optional);
  });
  D.coreTotal = D.coreSteps.length;
  D.isOptionalStep = function (id) {
    const step = D.stepInfo(id);
    if (!step) return false;
    const gate = D.gateOf(id);
    return !!(gate && gate.optional);
  };

  D.stepIndex = function (id) {
    return D.steps.findIndex(s => s.id === id);
  };

  D.nextStep = function (id) {
    const i = D.stepIndex(id);
    return D.steps[i + 1] || null;
  };

  D.gateProgress = function (gateId, project) {
    const phase = D.phases.find(p => p.id === gateId);
    if (!phase) return { done: 0, total: 0, percent: 0 };
    const steps = phase.steps.map(id => D.stepInfo(id)).filter(Boolean);
    const done = steps.filter(s => D.stepDone(s, project)).length;
    return { done, total: steps.length, percent: steps.length ? Math.round((done / steps.length) * 100) : 0 };
  };

  D.gateOf = function (stepId) {
    return D.phases.find(ph => ph.steps.includes(stepId)) || null;
  };

  /* ---- 阶段（分类）内的节点进度 ---- */
  D.phaseLabel = function (phase) {
    if (!phase) return '';
    const ph = typeof phase === 'string' ? D.phases.find(x => x.id === phase) : phase;
    return ph ? '阶段 ' + ph.no : '';
  };

  D.phaseNodes = function (phaseOrId, project) {
    const phase = typeof phaseOrId === 'string' ? D.phases.find(x => x.id === phaseOrId) : phaseOrId;
    if (!phase) return [];
    return phase.steps.map(id => D.stepInfo(id)).filter(Boolean).map(function (s) {
      return { id: s.id, no: s.no, title: s.title, done: D.stepDone(s, project) };
    });
  };

  /* 分段节点条：一个节点一段，多节点阶段才渲染 */
  D.nodesHtml = function (phaseOrId, project, opts) {
    opts = opts || {};
    const nodes = D.phaseNodes(phaseOrId, project);
    if (nodes.length < 2) return '';
    const currentIdx = nodes.findIndex(n => !n.done);
    const segs = nodes.map(function (n, i) {
      const cls = n.done ? 'done' : i === currentIdx ? 'current' : '';
      const title = `${n.no} ${n.title} · ${n.done ? '已完成' : '待完成'}`;
      return `<i class="ns-seg ${cls}" data-node-step="${n.id}" title="${window.U.escape(title)}"></i>`;
    }).join('');
    return `<div class="node-strip ${opts.cls || ''}">${segs}</div>`;
  };

  /* 节点轨：带编号的节点胶囊，用于步骤页展示分类内节点进度 */
  D.nodeRailHtml = function (phaseOrId, project, currentId) {
    const nodes = D.phaseNodes(phaseOrId, project);
    if (nodes.length < 2) return '';
    const phase = typeof phaseOrId === 'string' ? D.phases.find(x => x.id === phaseOrId) : phaseOrId;
    const done = nodes.filter(n => n.done).length;
    const chips = nodes.map(function (n) {
      const cls = n.id === currentId ? 'active' : n.done ? 'done' : '';
      return `<button class="node-chip ${cls}" data-node-step="${n.id}"><b>${n.no}</b>${window.U.escape(n.title)}</button>`;
    }).join('');
    return `<div class="node-rail" title="${window.U.escape(D.phaseLabel(phase) + ' · ' + (phase ? phase.name : ''))}">
      <span class="nr-label">节点 ${done}/${nodes.length}</span>
      <div class="nr-items">${chips}</div>
    </div>`;
  };

  D.overallProgress = function (project) {
    const done = D.coreSteps.filter(s => D.stepDone(s, project)).length;
    return Math.round((done / D.coreTotal) * 100);
  };

  D.currentStep = function (project) {
    return D.coreSteps.find(s => !D.stepDone(s, project)) || D.coreSteps[D.coreSteps.length - 1];
  };

  window.D = D;
})();
