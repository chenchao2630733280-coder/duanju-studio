/* 内容引擎：离线模板生成 + AI Provider 调用 + Skill 提示词 */
(function () {
  const Gen = {};
  const U = window.U;
  const D = window.D;
  const Store = window.Store;

  /* ---------------- 通用 ---------------- */
  Gen.ctx = function (project) {
    const ov = project.overview || {};
    const b = Gen.genreBundle(ov.genre);
    const concepts = ov.concepts || [];
    const engine0 = (b.engines || ENGINES)[0];
    const c = concepts[Number(ov.choseConcept || 0)] || concepts[0] || {
      title: ov.title || project.name,
      heroName: b.names[0],
      hero: `${b.names[0]}（29岁，${engine0.profession}）`,
      profession: engine0.profession,
      unique: engine0.ability,
      object: engine0.object,
      conflict: engine0.conflict,
      logline: ov.logline || '',
      emotion: (ov.emotions || ['悬疑'])[0]
    };
    const characters = project.characters || [];
    const hero = characters.find(x => x.role === '主角') || characters[0];
    const rival = characters.find(x => x.role === '核心对手') || characters[1];
    return {
      title: ov.title || c.title || project.name,
      genre: ov.genre || '都市情感',
      episodes: Number(ov.episodes || 60),
      concept: c,
      heroName: hero?.name || c.heroName || b.names[0],
      rivalName: rival?.name || project.engine?.rival?.name || c.rivalName || b.rivals[0],
      theme: ov.privateGoods?.theme || '人无法真正理解另一个人',
      seed: hash((ov.title || '') + (ov.logline || '') + (ov.privateGoods?.theme || '') + (ov.genre || ''))
    };
  };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function pick(arr, seed, salt) {
    if (!arr.length) return '';
    return arr[(seed + (salt || 0)) % arr.length];
  }

  function nameOf(text) {
    if (!text) return '';
    return String(text).split(/[（(，,·\s]/)[0].trim();
  }

  /* ---------------- 题材画像 ---------------- */
  const GENRE_BUNDLES = {
    ancient: {
      key: 'ancient', label: '古装', scene: '内·旧宅·夜', authority: '府中管事',
      look: '素衣束发，袖中藏着一枚旧印', place: '旧宅与长街',
      names: ['沈知微', '谢云舟', '温如晦', '苏令仪', '顾长宁', '裴照'],
      rivals: ['萧景珩', '谢怀瑾', '裴肃', '顾清和', '陆无咎'],
      titles: ['旧印', '无字密信', '第七次问罪', '雨夜故人', '一纸休书', '满城风声'],
      engines: [
        { profession: '仵作', ability: '能从尸骨痕迹还原死者最后一夜', object: '一具无名女尸', conflict: '女尸身上的令牌，指向当朝最有权势的人', emotion: '悬疑 / 权谋' },
        { profession: '女医', ability: '能让昏迷的人在梦中说出真话', object: '一枚带血的药囊', conflict: '药囊的主人，是她失踪多年的师父', emotion: '复仇 / 亲情' },
        { profession: '绣娘', ability: '能从针脚读出主人的心事', object: '一件未完成的嫁衣', conflict: '嫁衣的尺寸，与她分毫不差', emotion: '虐恋 / 身份' },
        { profession: '说书人', ability: '能把听过的秘密写进故事', object: '一本被禁的话本', conflict: '话本里写着她尚未经历的未来', emotion: '悬疑 / 宿命' },
        { profession: '暗卫', ability: '能记住见过的每一张脸', object: '一块刻着旧主姓名的腰牌', conflict: '腰牌的主人，本该死在十年前', emotion: '权谋 / 救赎' },
        { profession: '账房先生', ability: '能从账目里看出谁在说谎', object: '一本缺页的旧账', conflict: '缺的那一页，记着整个家族的灭门夜', emotion: '复仇 / 伦理' }
      ]
    },
    school: {
      key: 'school', label: '校园', scene: '内·教学楼·夜', authority: '值班老师',
      look: '校服外套松垮，书包里总装着一件旧物', place: '教室与操场',
      names: ['林知夏', '周予安', '许星野', '江晚', '夏梧', '陈屿'],
      rivals: ['沈聿', '顾言', '陆星野', '裴嘉树'],
      titles: ['第七个座位', '被删掉的留言', '那年夏天的空位', '毕业照少了一个人', '第二次转学'],
      engines: [
        { profession: '转学生', ability: '能听见旧课桌里留下的声音', object: '一张被涂改的座位表', conflict: '座位表上的第七个人，写着她自己的名字', emotion: '悬疑 / 青春' },
        { profession: '校刊编辑', ability: '能从旧照片里看出被裁掉的人', object: '一张毕业合影', conflict: '合影里多出一个从未存在的人', emotion: '悬疑 / 友情' },
        { profession: '心理社社长', ability: '能看穿别人正在说的谎', object: '一封没有署名的情书', conflict: '信里的秘密，指向她最好的朋友', emotion: '青春 / 背叛' },
        { profession: '篮球队替补', ability: '能预判下一秒的动作', object: '一枚不属于任何人的奖牌', conflict: '奖牌的主人，三年前在球场失踪', emotion: '热血 / 悬疑' },
        { profession: '广播站播音员', ability: '能听见广播里被剪掉的一句话', object: '一盘旧校园广播', conflict: '被剪掉的那句话，是一句求救', emotion: '悬疑 / 救赎' },
        { profession: '竞赛生', ability: '能在一夜之间记住所有细节', object: '一份被调包的试卷', conflict: '试卷上的名字，不是她', emotion: '校园 / 身份' }
      ]
    },
    scifi: {
      key: 'scifi', label: '科幻', scene: '内·实验室·夜', authority: '值班研究员',
      look: '工牌还挂在胸前，眼下有长期熬夜的青黑', place: '实验室与数据中心',
      names: ['林序', '沈昼', '许澄', '江遥', '温屿', '顾时'],
      rivals: ['陆沉', '裴回', '谢衍'],
      titles: ['第七次备份', '来自未来的留言', '她删除的那一天', '公共梦境', '七天后消失'],
      engines: [
        { profession: '记忆修复师', ability: '能读取别人备份的记忆', object: '一段来自未来的记忆', conflict: '记忆里的死者，是她自己', emotion: '科幻 / 救赎' },
        { profession: '仿生人维修师', ability: '能分辨人身上的非人痕迹', object: '一台不肯关机的旧仿生人', conflict: '它保存着她童年的全部影像', emotion: '科幻 / 亲情' },
        { profession: '时空档案员', ability: '能看见同一地点发生过的所有版本', object: '一间每天重置的房间', conflict: '房间里住着她死去的家人', emotion: '科幻 / 悬疑' },
        { profession: '神经接口调试员', ability: '能进入别人的梦境一分钟', object: '一段公共梦境', conflict: '所有人都在梦里等她做决定', emotion: '科幻 / 心理' },
        { profession: '城市算法工程师', ability: '能改写下一条命运预测', object: '一份被篡改的预测报告', conflict: '报告里，她将在七天后消失', emotion: '科幻 / 命运' },
        { profession: '气候观测员', ability: '能听见环境里被掩盖的信号', object: '一段异常气候记录', conflict: '求救信号来自十年前', emotion: '科幻 / 灾难' }
      ]
    },
    wealth: {
      key: 'wealth', label: '豪门', scene: '内·宴会厅·夜', authority: '家族管家',
      look: '礼服合身，眼神却始终像在防备', place: '宴会厅与家族旧宅',
      names: ['沈知意', '顾晚舟', '江梨', '温冉', '许星野', '林夏'],
      rivals: ['顾承舟', '陆时衍', '谢却', '裴清'],
      titles: ['遗嘱里的第七个人', '没有主人的晚宴', '她的第二份人生', '被删掉的继承人', '婚戒内侧的名字'],
      engines: [
        { profession: '家族秘书', ability: '能记住每一场家族会议的关键句', object: '一份未公开的遗嘱', conflict: '遗嘱的受益人，写着她自己的名字', emotion: '豪门 / 悬疑' },
        { profession: '宴会策划', ability: '能在人群里辨认真正的掌权者', object: '一场没有主人的晚宴', conflict: '主人三年前已被宣布死亡', emotion: '豪门 / 权谋' },
        { profession: '私人助理', ability: '能预判雇主的每一个决定', object: '一只落灰的婚戒', conflict: '婚戒内侧，刻着她母亲的名字', emotion: '虐恋 / 身份' },
        { profession: '继承人', ability: '能看穿家族成员的伪装', object: '一张家族合影', conflict: '合影里少了一个本应站在中心的人', emotion: '豪门 / 复仇' },
        { profession: '财务顾问', ability: '能发现账目里被隐藏的交易', object: '一份对赌协议', conflict: '协议签名，是她失踪多年的父亲', emotion: '商战 / 亲情' },
        { profession: '司机', ability: '能记住每一段路线里的异常', object: '一条没有终点的行程', conflict: '终点是家族旧宅的废墟', emotion: '悬疑 / 救赎' }
      ]
    }
  };

  Gen.genreBundle = function (genreOrProject) {
    const g = typeof genreOrProject === 'string' ? genreOrProject : ((genreOrProject && genreOrProject.overview && genreOrProject.overview.genre) || '');
    if (/古装|古代|宫廷|宫斗|宅斗|武侠|江湖|仙侠|神话|朝代|民国|年代|穿越/.test(g)) return GENRE_BUNDLES.ancient;
    if (/校园|青春|学生|高中|大学/.test(g)) return GENRE_BUNDLES.school;
    if (/科幻|未来|赛博|人工智能|末世|无限流|规则怪谈|时间循环|奇幻/.test(g)) return GENRE_BUNDLES.scifi;
    if (/豪门|总裁|继承|商战|逆袭|复仇|真假千金|契约婚姻|甜宠|追妻/.test(g)) return GENRE_BUNDLES.wealth;
    return {
      key: 'urban', label: '都市', scene: '内·旧楼道·夜', authority: '档案管理员',
      look: '常年带着一件旧物，眼神警惕', place: '街道与旧楼',
      names: ['林夏', '苏晚', '沈知意', '江梨', '温冉', '许星野', '顾晚舟'],
      rivals: ['沈砚', '顾承舟', '陆时衍', '谢却', '周叙', '裴清'],
      titles: TITLE_TEMPLATES,
      engines: ENGINES
    };
  };

  /* ---------------- 私货 → 高概念 ---------------- */
  const ENGINES = [
    { profession: '声音修复师', ability: '能从旧录音里听出被抹掉的最后一句话', object: '一卷没有标签的磁带', conflict: '磁带里求救的声音，是十年前失踪的母亲', emotion: '悬疑 / 亲情' },
    { profession: '遗物整理师', ability: '能从遗物的摆法读出死者最后一天', object: '一间没有家属认领的老宅', conflict: '她读出死者最后的动作，是在等自己', emotion: '治愈 / 愧疚' },
    { profession: '代驾司机', ability: '每晚接送同一位从不说话的乘客', object: '一张永远到不了终点的订单', conflict: '终点地址，是她被烧掉的老家', emotion: '悬疑 / 救赎' },
    { profession: '婚礼策划师', ability: '能记住每一对新人说过的谎', object: '一场没有新娘的婚礼', conflict: '新郎是她三年前"死掉"的未婚夫', emotion: '虐恋 / 反转' },
    { profession: '急诊科护士', ability: '能在病人昏迷时听见他们的真心话', object: '一个总在凌晨三点送来的无名病人', conflict: '病人每次说的秘密，都指向她丈夫', emotion: '婚姻 / 悬疑' },
    { profession: '养老院护工', ability: '替失忆老人保管他们不愿忘掉的一件事', object: '一位坚持叫她"女儿"的老人', conflict: '老人保存的记忆里，有她真正的身世', emotion: '亲情 / 寻根' },
    { profession: '录音棚调音师', ability: '能在噪音里分离出任何一个人的声音', object: '一段被合成过的求救录音', conflict: '录音里的凶手，用的是她自己的声音', emotion: '犯罪 / 悬疑' },
    { profession: '殡仪馆化妆师', ability: '能让死者"说出"最后想见的人', object: '一具身份不明的女尸', conflict: '女尸的脸，和她一模一样', emotion: '惊悚 / 身份' },
    { profession: '旧书修复师', ability: '能从书页批注还原一个陌生人的一生', object: '一本被反复涂改的日记', conflict: '日记最后一页写着她的死期', emotion: '悬疑 / 宿命' },
    { profession: '城市夜景摄影师', ability: '能拍到别人看不见的"重复出现的人"', object: '同一扇窗里每晚出现的女人', conflict: '女人第二天死在了她的镜头前', emotion: '悬疑 / 罪恶' },
    { profession: '社区调解员', ability: '能看出一段关系里谁在说谎', object: '一对坚持不离婚的夫妻', conflict: '妻子要保护的人，是她自己', emotion: '婚姻 / 伦理' },
    { profession: 'AI 语音克隆师', ability: '能用十秒音频复制任何人的声音', object: '一段来自"未来"的语音留言', conflict: '留言里的她，在求现在的她别做某个决定', emotion: '科幻 / 救赎' }
  ];

  const TITLE_TEMPLATES = [
    '最后三秒', '无声的证人', '我把真相说给你听', '第七次告别', '她听见了', '遗物会说话',
    '凌晨三点的乘客', '没有新娘的婚礼', '请替我记住', '声音的裂缝', '重复出现的人', '别删掉那条语音'
  ];

  /* 本地模板生成器：仅作为无模型环境的参考实现保留，界面已不再调用（生成统一走模型） */
  Gen.generateConcepts = function (project) {
    const ov = project.overview || {};
    const pg = ov.privateGoods || {};
    const seed = hash((pg.theme || '') + (pg.belief || '') + (ov.title || ''));
    const bundle = Gen.genreBundle(ov.genre);
    const engines = bundle.engines || ENGINES;
    const names = bundle.names || ['林夏', '苏晚', '沈知意', '江梨', '温冉', '许星野', '顾晚舟'];
    const rivalNames = bundle.rivals || ['沈砚', '顾承舟', '陆时衍', '谢却', '周叙', '裴清'];
    const titles = bundle.titles || TITLE_TEMPLATES;
    const concepts = [];
    const used = new Set();
    for (let i = 0; i < 6; i++) {
      const e = engines[(seed + i * 3) % engines.length];
      const heroName = pick(names, seed, i);
      const rivalName = pick(rivalNames, seed, i + 2);
      concepts.push({
        title: pick(titles, seed, i),
        logline: `${heroName}是${e.profession}，${e.ability}。直到${e.object}出现——${e.conflict}。`,
        hero: `${heroName}（29岁，${e.profession}）`,
        heroName,
        profession: e.profession,
        conflict: e.conflict,
        unique: e.ability,
        object: e.object,
        hook: `第一集：${e.object}出现，${e.conflict}。`,
        emotion: e.emotion,
        theme: pg.theme || '被看见的渴望',
        rivalName
      });
    }
    // 去重标题
    concepts.forEach((c, i) => {
      let n = 1;
      while (used.has(c.title)) c.title = c.title + '·' + (++n);
      used.add(c.title);
    });
    return concepts;
  };

  /* ---------------- 选题复核 ---------------- */
  Gen.fillReview = function (project) {
    const c = Gen.ctx(project);
    return {
      strengths: `「${c.concept.title}」把「${c.concept.unique}」这个独特变量压在最日常的职业上，概念一句话可讲清，且情感核心直接指向「${c.theme}」。`,
      risks: `中后段存在规则解释过密、同类卡点重复的风险；主角主动性与对手资源差需要在前 10 集立住。`,
      uniqueVar: `${c.concept.unique}，且每次触发都必须付出关系代价。`,
      cliche: `最容易滑向「隐藏身份—连续打脸」与「巧合破案」，需要用目标对立替换爽点堆叠。`,
      suitable: '适合',
      keep: `保留独特变量、第一集不可逆的启动事件、以及主角与核心对手的镜像关系。`,
      adjust: `把「等待真相」改为「主动制造真相」；把每 10 集一次的情绪循环写进阶段目标。`,
      conclusion: `复核通过：概念可一句话讲清，具备 ≥5 轮目标升级、≥3 次关系变化、≥2 次真相反转与 1 个不可逆选择。进入故事发动机阶段。`,
      passed: true
    };
  };

  /* ---------------- 故事发动机 / 对手 ---------------- */
  Gen.fillEngine = function (project) {
    const c = Gen.ctx(project);
    const b = Gen.genreBundle(project);
    const hero = c.heroName;
    const rival = c.rivalName || '沈砚';
    const conflict = c.concept.conflict;
    const item = c.concept.object;
    return {
      protagonist: {
        name: hero, identity: `${c.concept.profession}，熟悉${b.place}`, situation: `表面靠本职谋生，暗中追查「${conflict}」背后的旧事。`,
        flaw: '过度相信"证据会说话"，用真相回避情感；越接近答案，越不敢承认自己也有责任。',
        ability: c.concept.unique,
        fear: '发现自己也是那件事的起因。',
        protect: '身边最重要的人，以及唯一愿意替她作证的伙伴。'
      },
      desires: {
        surface: `查清「${conflict}」，拿回被抹掉的证据。`,
        deep: '被真正看见，而不是被当作"能办事的人"。',
        hidden: '希望那件事不是因自己而起——这样她就不必恨自己。'
      },
      inciting: `第一集，${item}出现在她手里；她第一次触碰「${conflict}」，也第一次被${rival}盯上。关键证据只有 72 小时有效期。`,
      cannotQuit: ['关键证据每 72 小时失效一次，错过就永远找不回来', '身边的人被对手"照顾"着，退出等于把家人交出去', `她已经动用了「${c.concept.unique}」，规则反噬一旦开始无法中止`],
      obstacles: {
        external: `${rival}掌握${b.place}的渠道与资源，能在她之前抹掉痕迹。`,
        internal: '她习惯用证据审判别人，却不敢审判自己。',
        relational: '伙伴与她的信任在一次"隐瞒"后断裂。',
        rule: '每次使用能力，都会随机失去一段与目标相关的记忆。'
      },
      rival: {
        name: rival, identity: `${b.authority}背后的掌权者 / 旧事利益方`,
        goal: `在旧事重启前拿到${item}，把真相永远封存。`,
        trueGoal: '保护自己当年被迫做出的选择不被公开。',
        logic: '不否认事实，只控制解释权；能用交易解决就不动手。',
        motive: '他也失去过重要的人，只是他选择让所有人一起沉默。',
        mirror: '两人都相信"真相能救人"，一个选择公开，一个选择掩埋。',
        weaknessHit: `用她身边人的安危，逼她在"公开真相"和"保护家人"之间选。`,
        help: `中段他一次性给出部分关键证据——因为他需要她先找到${item}。`
      },
      escalations: ['对手从抹痕迹升级为控制证人', '证据代价从丢记忆升级为丢关系', '盟友因隐瞒倒戈', '规则反噬让主角失去关键记忆', '对手目标从掩盖旧事变为摧毁她全部可信度'],
      finalChoice: { a: '公开真相', b: '保护最重要的人', question: `如果真相的代价是身边人，她还要不要揭开「${conflict}」？` }
    };
  };

  /* ---------------- 核心规则 ---------------- */
  Gen.fillRules = function (project) {
    const c = Gen.ctx(project);
    const b = Gen.genreBundle(project);
    const item = c.concept.object;
    return [{
      id: U.uid('rule'),
      name: '真相的代价',
      source: `${c.concept.profession}的职业工具 + 一场没有解释的旧事`,
      holder: c.heroName,
      trigger: `在${item}附近主动使用「${c.concept.unique}」，并在心里说出一个与目标相关的人名。`,
      effect: `短时间内获得「${c.concept.conflict}」相关的关键信息，但只能得到片段，无法看到完整因果。`,
      gain: '获得别人无法伪造的第一手线索，能抢在对手前锁定关键证人。',
      costNow: `每次使用后 6 小时内，失去一段与「${c.theme}」有关的记忆。`,
      costLong: '使用越多，越记不清自己为什么要查；最终可能忘记自己最想保护的人。',
      limits: `同一个${item}只能使用一次；无法直接对活人使用；情绪剧烈波动时失效。`,
      forbidden: '不能对自己使用；不能连续两次追问同一个地点。',
      loophole: '如果目标同时牵涉两个人，可以看见"共同记忆"中被剪掉的部分。',
      misdirection: '主角以为看见的是真相，其实看见的是对方希望她相信的版本。',
      backlash: '中后段起，她会发现自己的记忆开始被"更正"，甚至怀疑自己才是说谎的人。',
      rivalUse: `${c.rivalName}提前在${b.place}布置假线索，用伪造的"真相"把她引向错误证人。`,
      misread: '她误以为能力中立，忽略了记忆也会说谎。',
      purpose: `规则真正的目的不是破案，而是逼她承认：她一直在用「${c.theme}」逃避自己的责任。`,
      resolution: '终局她主动放弃最后一次使用能力，选择用自己承担后果的方式公开真相。'
    }];
  };

  /* ---------------- 人物 ---------------- */
  function depthSet(role, seed) {
    const sets = {
      hero: {
        publicDesire: '所有人都知道她一直在追查那件旧事。',
        hiddenFear: '怕自己才是那件事的起因。',
        conflictingValue: '想得到真相，却相信"有些真相会毁掉还活着的人"。',
        habit: '思考时反复摩挲随身旧物的边缘。',
        memory: '那件事发生那天，她因为赌气没有回头。',
        lie: '“我没事，我只是想把事情弄清楚。”',
        selfCruelty: '把唯一的退路让给别人，自己留在原地。',
        flawLoved: '凡事都要证据，连爱也要对方先证明。',
        kindness: '会给无人认领的旧物贴上名字，哪怕没人会来取。',
        privateMoment: '深夜对着空房间说“今天也辛苦了”。'
      },
      rival: {
        publicDesire: '让那件旧事永远不要被翻出来。',
        hiddenFear: '怕别人知道他也曾是受害者，而不是加害者。',
        conflictingValue: '相信"沉默能保护更多人"，却用沉默伤害了具体的人。',
        habit: '谈判时反复转动手上的旧戒指。',
        memory: '那年他在同一场变故里，签下了一份不该签的证明。',
        lie: '“我只是在维护秩序。”',
        selfCruelty: '把唯一的旧照片锁进抽屉，从不允许自己看。',
        flawLoved: '永远替别人做决定，还觉得自己是在负责。',
        kindness: '每年匿名给旧事家属寄一笔钱，从不留名。',
        privateMoment: '在空房间里，对着一把空椅子说“对不起”。'
      },
      love: {
        publicDesire: '守住两个人共同经营的那点地方。',
        hiddenFear: '怕自己又一次在关键时刻选择逃跑。',
        conflictingValue: '想保护主角，但不愿成为她调查里的"证人"。',
        habit: '紧张时用指甲敲桌沿，三下为一组。',
        memory: '上一段关系里，她因为一句没说出口的话失去了对方。',
        lie: '“我早就不在意那件事了。”',
        selfCruelty: '把最后一点退路留给主角，自己用最差的。',
        flawLoved: '越在意越装作无所谓。',
        kindness: '会替陌生人保管他们不敢寄出的信。',
        privateMoment: '关灯后，对着空房间清唱一句跑调的歌。'
      },
      ally: {
        publicDesire: '拿到年度独家，离开这座城市。',
        hiddenFear: '怕自己永远是二流。',
        conflictingValue: '想要成名，但不愿踩着朋友的伤口上位。',
        habit: '开口前先咬一下笔帽。',
        memory: '第一篇稿子被老师当面撕掉。',
        lie: '“这次我肯定站你这边。”',
        selfCruelty: '胃疼也不肯去医院，怕错过线索。',
        flawLoved: '关键时刻总想留一手。',
        kindness: '会偷偷给实习生留一份署名。',
        privateMoment: '把没发出去的道歉短信存进草稿箱。'
      },
      betrayer: {
        publicDesire: '让所有人相信他是个好人。',
        hiddenFear: '怕被抛弃。',
        conflictingValue: '想被爱，但只相信利益绑定。',
        habit: '说话时不停看手机时间。',
        memory: '小时候被寄养过七个家庭。',
        lie: '“我从来没骗过你。”',
        selfCruelty: '替别人挡酒，回家自己吐。',
        flawLoved: '被需要时才觉得自己存在。',
        kindness: '会给流浪猫留半盒牛奶。',
        privateMoment: '一个人把生日蛋糕上的蜡烛吹了三次。'
      },
      holder: {
        publicDesire: '平静地过完余生。',
        hiddenFear: '怕旧事被翻出来，晚节不保。',
        conflictingValue: '想赎罪，但不愿失去现有的一切。',
        habit: '进门先摸一下门框。',
        memory: '三十年前，他在一份事故记录上签了字。',
        lie: '“我什么都不知道。”',
        selfCruelty: '把药减半吃，省下的钱捐出去。',
        flawLoved: '用沉默代替道歉。',
        kindness: '每天给楼下的流浪老人留一把椅子。',
        privateMoment: '对着电视里的旧新闻，反复擦同一副眼镜。'
      },
      mirror: {
        publicDesire: '证明自己不需要任何人。',
        hiddenFear: '怕自己其实和主角一样孤独。',
        conflictingValue: '相信"先保护自己"，却总在最后关头回头。',
        habit: '笑的时候先低头。',
        memory: '她也曾经等一个不会回来的人。',
        lie: '“我从来没等过谁。”',
        selfCruelty: '把伞给别人，自己淋雨回家。',
        flawLoved: '嘴硬到把好意说成施舍。',
        kindness: '给对手的猫取了个名字。',
        privateMoment: '把两人的合照裁成一个人。'
      }
    };
    return sets[role] || sets.ally;
  }

  Gen.fillCharacters = function (project) {
    const c = Gen.ctx(project);
    const b = Gen.genreBundle(project);
    const heroName = c.heroName;
    const rivalName = c.rivalName;
    const conflict = c.concept.conflict;
    const item = c.concept.object;
    const pool = b.names.filter(n => n !== heroName && n !== rivalName);
    const names = {
      love: pool[0] || '苏晚', ally: pool[1] || '陈默', betrayer: pool[2] || '周叙',
      holder: pool[3] || '老周', mirror: pool[4] || '江梨'
    };
    const mk = (name, role, extra) => {
      const d = depthSet(role, c.seed);
      return Object.assign({
        id: U.uid('char'), name, role, age: '20—35',
        look: '', surface: '', desire: '', fear: '', secret: '', weakness: '', ability: '',
        bottomLine: '', lie: d.lie, relation: '', wants: '', stanceEarly: '', stanceMid: '', stanceFinal: '',
        ending: '', depth: d, voiceNote: '', assetIds: []
      }, extra);
    };
    const chars = [
      mk(heroName, '主角', {
        age: '29', look: b.look,
        surface: '沉默、专业、说话像在写报告。', desire: `查清「${conflict}」。`,
        fear: '发现自己也是那件事的起因。', secret: '她曾在关键时刻隐瞒了一个决定性细节。',
        weakness: '只相信证据，不相信人。', ability: c.concept.unique,
        bottomLine: '不拿还活着的人做交换。', relation: '一切关系的中心。',
        wants: '被身边的人真正看见。', stanceEarly: '独自查案，拒绝合作。',
        stanceMid: '为保护身边的人开始隐瞒关键证据。', stanceFinal: '主动公开全部真相。',
        ending: '公开作证，付出关系代价，但第一次被身边的人理解。', voiceNote: '短句，少形容词；提到那件事时会停顿。'
      }),
      mk(rivalName, '核心对手', {
        age: '45', look: '永远穿深色衣着，习惯把手藏在袖中。',
        surface: '温和、克制、从不提高音量。', desire: `让「${conflict}」永远封存。`,
        fear: '被公开当年那份决定别人命运的文书。', secret: '他是当年唯一在世的签字人，也是受害者家属。',
        weakness: '把控制当成保护。', ability: `掌握${b.authority}的渠道与证人资源。`,
        bottomLine: '不亲手伤人。', relation: '与主角互为镜像。',
        wants: '让主角相信"沉默才是善意"。', stanceEarly: '观察并收买。',
        stanceMid: '主动给出一半真相。', stanceFinal: '被逼公开自己当年的选择。',
        ending: '失去权力，保住了家人和一句道歉。', voiceNote: '礼貌、精确，习惯用"我们"代替"我"。'
      }),
      mk(names.love, '情感关系人物', {
        age: '28', look: '短发，手腕上有一道旧伤。', surface: '爱开玩笑，关键时刻沉默。',
        desire: '守住两个人共同经营的地方，也守住主角。', fear: '再一次在关键时刻逃跑。',
        secret: '她曾替对手删掉一份关键证据。', weakness: '越在意越装作无所谓。',
        ability: '人际周旋与信息传播。', bottomLine: '不做伪证。', relation: '主角唯一愿意倾诉的人。',
        wants: '主角能先问她一句"你还好吗"。', stanceEarly: '帮忙但不深问。',
        stanceMid: '因被隐瞒而离开。', stanceFinal: '带着关键证据回来。',
        ending: '和主角一起把生活重新拼回来。', voiceNote: '句子轻，尾音上扬；认真时反而很慢。'
      }),
      mk(names.ally, '利益盟友', {
        age: '31', look: '总是背着两个包。', surface: '热络、会来事。',
        desire: `拿到「${conflict}」的独家资源，离开这座城市。`, fear: '永远二流。',
        secret: '他把主角的线索卖过一次。', weakness: '关键时刻留一手。',
        ability: '调查与套话。', bottomLine: '不碰孩子。', relation: '合作者，也是隐患。',
        wants: '主角欠他一个人情。', stanceEarly: '主动靠近。', stanceMid: '索要署名权。',
        stanceFinal: '选择公开关键证据。', ending: '离开行业，寄回一张明信片。', voiceNote: '语速快，爱用反问。'
      }),
      mk(names.betrayer, '潜在背叛者', {
        age: '33', look: '笑容标准，鞋永远很干净。', surface: '可靠、体贴、随叫随到。',
        desire: '被所有人需要。', fear: '被抛弃。', secret: '他从第一集起就在替对手记录主角的行踪。',
        weakness: '被需要时才觉得自己存在。', ability: '协调资源、打通关系。',
        bottomLine: '不伤害孩子。', relation: '主角最信任的中间人。',
        wants: '主角亲口说"没有你不行"。', stanceEarly: '全力帮忙。', stanceMid: '在两边下注。',
        stanceFinal: '倒戈后被主角拉回。', ending: '失去一切，但救下了主角最在乎的人。', voiceNote: '永远先道歉，再解释。'
      }),
      mk(names.holder, '秘密持有者', {
        age: '62', look: '老式眼镜，手边永远有一只旧杯子。', surface: '沉默、慢。',
        desire: '平静过完余生。', fear: '晚节不保。', secret: `他保存着完整的${item}，也保存着一封未寄出的信。`,
        weakness: '用沉默代替道歉。', ability: '掌握原始证据。', bottomLine: '不再说谎。',
        relation: '主角长辈的旧识。', wants: '有人替他把信交出去。', stanceEarly: '闭门不见。',
        stanceMid: '给出半份证据。', stanceFinal: '交出全部并作证。', ending: '在公开场合读完那封信。', voiceNote: '句子短，常停顿，叫主角"孩子"。'
      }),
      mk(names.mirror, '镜像人物', {
        age: '27', look: '总穿宽大的外套，戴一枚旧胸针。', surface: '尖锐、嘴硬。',
        desire: '证明自己不需要任何人。', fear: '承认自己和主角一样孤独。',
        secret: '她是另一桩旧事的受害者家属，也收到过同样的匿名线索。', weakness: '嘴硬。',
        ability: '反向追查线索来源。', bottomLine: '不连累无辜。', relation: '对手的养女，主角的镜像。',
        wants: '让主角替她说完没说完的话。', stanceEarly: '敌意。', stanceMid: '被迫合作。',
        stanceFinal: '公开站到主角一边。', ending: '离开这座城市，留下那枚胸针。', voiceNote: '句子冲，结尾常带"随便你"。'
      })
    ];
    chars[0].assetIds = [];
    return chars;
  };

  Gen.fillRelations = function (project) {
    const c = Gen.ctx(project);
    const chars = project.characters || [];
    const hero = chars.find(x => x.role === '主角');
    const rival = chars.find(x => x.role === '核心对手');
    const love = chars.find(x => x.role === '情感关系人物');
    const betrayer = chars.find(x => x.role === '潜在背叛者');
    const holder = chars.find(x => x.role === '秘密持有者');
    const item = c.concept.object;
    const rel = (a, b, content) => Object.assign({
      id: U.uid('rel'), aId: a?.id || '', bId: b?.id || '',
      wantA: '', wantB: '', cannotSay: '', misread: '', shared: '', conflict: '',
      change1: '', change2: '', change3: ''
    }, content);
    return [
      rel(hero, rival, {
        wantA: `她想拿到对手手里的${item}。`, wantB: '他想让她主动放弃公开。',
        cannotSay: '她不肯承认自己也需要被原谅。', misread: '他以为她只想要真相，不要身边的人。',
        shared: '两人都想让那件旧事有个结束。', conflict: '公开还是掩埋。',
        change1: '第 1—10 集：猎人与猎物。', change2: '第 28 集：被迫合作，互相利用。',
        change3: '第 52 集：她发现他也是受害者，选择不再恨他。'
      }),
      rel(hero, love, {
        wantA: '她想要一个不问理由就站在身边的人。', wantB: '她想要主角先学会开口求助。',
        cannotSay: '主角不敢说"我怕连累你"。', misread: '对方以为主角不信任她。',
        shared: '都想守住两个人共同经营的地方。', conflict: '真相公开会毁掉现在的生活，也可能救更多人。',
        change1: '第 1—12 集：互相试探。', change2: '第 24 集：因隐瞒而决裂。',
        change3: '第 45 集：带着证据回来，重建信任。'
      }),
      rel(hero, betrayer, {
        wantA: '主角想要一个能替她跑腿的人。', wantB: '他想要主角承认离不开他。',
        cannotSay: '他不敢说自己一直在被对手喂消息。', misread: '主角以为他胆小，其实他在两边保人。',
        shared: '都想保护主角最在乎的人。', conflict: '忠诚与自保。',
        change1: '第 1—8 集：最可靠的帮手。', change2: '第 32 集：行踪泄露，信任崩塌。',
        change3: '第 58 集：用自己换回主角最在乎的人，完成救赎。'
      }),
      rel(hero, holder, {
        wantA: `她想要完整的${item}。`, wantB: '他想有人替他把信交出去。',
        cannotSay: '他不敢承认当年签过字。', misread: '她以为他是帮凶。',
        shared: '都欠那件事一个交代。', conflict: '说出真相会不会毁掉还活着的人。',
        change1: '第 1—10 集：闭门羹。', change2: '第 35 集：半份证据换一次沉默。',
        change3: '第 60 集：他作证，她读信。'
      })
    ];
  };

  /* ---------------- 秘密 ---------------- */
  Gen.fillSecrets = function (project) {
    const c = Gen.ctx(project);
    const N = c.episodes;
    const item = c.concept.object;
    const conflict = c.concept.conflict;
    const theme = c.theme;
    return [
      { id: U.uid('secret'), layer: '即时秘密', content: `${item}留下的第一层信息，不是求救，而是一句"别来找我"。`, known: '主角', unknown: '身边的人', misread: '主角以为对方在保护她', hintEp: '1', partialEp: '4', fullEp: '8', change: '主角第一次怀疑当事人是主动离开。', newProblem: '她开始隐瞒自己看到的部分。' },
      { id: U.uid('secret'), layer: '关系秘密', content: `最亲近的伙伴曾替${c.rivalName}删掉一份关键证据，因为她的家人也在那件事里。`, known: '伙伴、对手', unknown: '主角', misread: '主角以为是意外丢失', hintEp: '12', partialEp: '24', fullEp: '30', change: '主角与伙伴决裂，失去唯一的传播渠道。', newProblem: '对手开始收购她赖以生存的地方。' },
      { id: U.uid('secret'), layer: '主线秘密', content: `完整证据不是事故记录，而是一次"选择谁被记住"的会议记录。`, known: '秘密持有者、对手', unknown: '主角、公众', misread: '所有人以为证据能直接证明凶手是谁', hintEp: '18', partialEp: String(Math.floor(N * 0.55)), fullEp: String(Math.floor(N * 0.72)), change: `主角的调查方向从"找凶手"转为"找被删掉的人"，重新理解「${conflict}」。`, newProblem: '主角最信任的长辈开始前后矛盾。' },
      { id: U.uid('secret'), layer: '终极真相', content: `当年签字同意删掉记录的人，是主角最亲近的长辈；他换回了她的安全，也换走了另一个人的一生。`, known: '长辈、秘密持有者', unknown: '主角、对手', misread: '主角一直以为长辈是受害者', hintEp: '6', partialEp: String(Math.floor(N * 0.8)), fullEp: String(N), change: `主角必须重新理解「${theme}」与"背叛"；她与长辈的关系被重新解释。`, newProblem: '公开真相会让最亲近的人承担后果。' }
    ];
  };

  /* ---------------- 阶段 ---------------- */
  const STAGE_DEFS = [
    { name: '异常进入', goal: '建立日常、出现异常、启动规则、迫使行动。', hero: '确认异常来源，保住第一份证据。', rival: '在主角之前抹掉第一层痕迹。' },
    { name: '试探规则', goal: '尝试解决问题，获得小胜，暴露代价。', hero: '主动使用规则换取线索。', rival: '用假线索测试主角的边界。' },
    { name: '主动进攻', goal: '形成计划，主动利用规则，首次正面对抗。', hero: '设局逼对手交出证人。', rival: '切断主角的资源渠道。' },
    { name: '错误胜利', goal: '阶段性成功，实际落入更大局面。', hero: '拿到半份关键证据并公开一部分。', rival: '借公开事件反向锁定主角。' },
    { name: '中点反转', goal: '真相变化、对手目标反转、原目标不再成立。', hero: '发现关键证据真正记录的是"选择谁被记住"。', rival: '从掩盖旧事转为保住自己的家人。' },
    { name: '全面失控', goal: '规则反噬、盟友背叛、身份暴露、资源尽失。', hero: '在失去记忆与盟友后仍继续查。', rival: '公开主角的私人记录，摧毁她的可信度。' },
    { name: '最低点与重新选择', goal: '认识缺陷，放弃错误目标，作出新选择。', hero: '承认自己一直在用"真相"逃避责任。', rival: '第一次向她提出交易。' },
    { name: '终极对决', goal: '线索汇合、利用规则漏洞、揭晓真相、完成选择。', hero: '在公开场合放弃最后一次使用规则，用自己承担后果的方式作证。', rival: '公开自己的签字，接受后果。' }
  ];

  Gen.fillStages = function (project) {
    const c = Gen.ctx(project);
    const N = c.episodes;
    const breaks = [1, 0.08, 0.2, 0.33, 0.47, 0.6, 0.74, 0.87, 1].map(x => x === 1 ? N : Math.max(1, Math.round(N * x)));
    const out = [];
    for (let i = 0; i < 8; i++) {
      const def = STAGE_DEFS[i];
      const from = i === 0 ? 1 : breaks[i] + 1;
      const to = breaks[i + 1];
      out.push({
        id: U.uid('stage'), no: i + 1, name: def.name, from, to,
        goal: def.goal,
        heroGoal: def.hero, rivalGoal: def.rival,
        strategy: i < 4 ? '借职业身份接近证人，用规则换取证据，再以公开倒逼对手。' : '以退为进，先保住人，再决定要不要说出全部真相。',
        conflict: `主角要公开，${c.rivalName}要掩埋；双方都在保护不同的人。`,
        relationChange: i < 2 ? '主角与伙伴从互相利用到互相依赖。' : i < 4 ? '伙伴因被隐瞒而疏远。' : i < 6 ? '盟友倒戈，镜像人物站到主角一边。' : '主角与最亲近的长辈关系被重新解释。',
        revealed: i === 0 ? '规则存在且必须付代价。' : i < 3 ? '关键证据不止一份。' : i < 5 ? '证据内容是"选择谁被记住"。' : i < 7 ? '长辈签过字。' : '全部真相。',
        kept: i < 7 ? '谁签的字、为什么签。' : '无。',
        win: i === 1 ? '第一次拿到可公开的证据。' : i === 3 ? '公开半份证据，获得舆论支持。' : i === 5 ? '救回最在乎的人。' : i === 7 ? '完成公开作证。' : '逼近真相一步。',
        cost: i === 3 ? '暴露自己的规则，失去匿名保护。' : i === 5 ? '失去一段与目标有关的记忆。' : i === 6 ? '最亲近的长辈被带走调查。' : '每次使用规则都丢掉一点自己。',
        twist: i === 4 ? `${c.rivalName}其实也是受害者家属。` : i === 6 ? '签字的人是主角最亲近的长辈。' : '对手提前一步，证据被换掉。',
        hook: i === 7 ? '全剧收束，保留续作空间。' : `下一阶段：${STAGE_DEFS[i + 1].goal}`
      });
    }
    return out;
  };

  /* ---------------- 情绪 / 卡点 ---------------- */
  Gen.fillEmotion = function (project) {
    const c = Gen.ctx(project);
    const N = c.episodes;
    const cycle = ['压迫', '反击', '小胜', '新疑问', '关系升温', '风险增加', '背叛', '绝境', '反转', '释放'];
    const typeMap = { 压迫: '虐点', 反击: '悬疑点', 小胜: '爽点', 新疑问: '悬疑点', 关系升温: '甜点', 风险增加: '虐点', 背叛: '最低点', 绝境: '最低点', 反转: '反转点', 释放: '释放点' };
    const out = [];
    const count = Math.max(3, Math.min(10, Math.ceil(N / 10)));
    for (let i = 1; i <= count; i++) {
      const ep = Math.round((N * i) / count);
      const phase = cycle[(i - 1) % cycle.length];
      out.push({ id: U.uid('emo'), ep, phase, type: typeMap[phase], note: `第 ${i} 个情绪循环落点：${phase}。` });
    }
    return out;
  };

  const CLIFF_POOL = {
    信息: ['关键证据里出现了第三个声音。', '线索指向了一个不该在现场的人。', '那份签字的日期，比事件早了三天。'],
    危机: ['唯一的关键证据正在被销毁。', '最在乎的人被带走了，只留下一件旧物。', '她只剩六小时，否则记忆永久消失。'],
    关系: ['伙伴删掉了最后一段记录。', '最信任的人把她的行踪交了出去。', '长辈关上门：以后别叫我孩子。'],
    选择: ['救最在乎的人，还是公开证据？', '她按下了删除键，却先备份了另一份。', '只要她说出那个名字，一切就能结束。'],
    反转: ['求救的人，其实是设局的人。', '一直在查的对手，是当年的受害者。', '她听见的最后三秒，是自己的声音。']
  };

  Gen.fillCliffhangers = function (project) {
    const N = Gen.ctx(project).episodes;
    const out = [];
    for (let ep = 1; ep <= N; ep++) {
      const type = D.cliffTypes[(ep - 1) % 5];
      const pool = CLIFF_POOL[type];
      out.push({ id: U.uid('cliff'), ep, type, text: pool[(ep + type.length) % pool.length], note: '' });
    }
    return out;
  };

  const HOOKS = [
    '一件没有署名的东西，放在她每天必经的门口。',
    '深夜，那台旧设备自己启动了。',
    '她在整理旧物时，看见了不该出现的名字。',
    '单据上的经手人，写着"已故"。',
    '陌生账号发来一张她童年的照片。',
    '停电的走廊里，她听见了十年前的争吵。',
    '最亲近的长辈第一次主动打电话，只说了一句"别回家"。',
    '传票和那件旧物，同一天送到。',
    '她在新闻里看见了自己，标题写着"骗子"。',
    '一个自称当事人的人，加了她好友。'
  ];

  // 每个阶段 3 个通用节拍，避免写死具体故事
  const BEAT_SETS = [
    [
      ['确认异常来源，保住第一份证据', '独自回到旧地', '发现有人提前来过', '关键线索被换掉', '确认那件事不是意外'],
      ['拿到可保存的证据', '备份并核对细节', '对手远程清空备份', '只剩一份残缺记录', '对手知道她已经开始查'],
      ['查清证据来源', '顺着线索找到经手人', '经手记录被划掉', '监控里出现熟人身影', '熟人承认东西是他寄的']
    ],
    [
      ['验证规则能否被反制', '做对照实验', '对手用假线索误导', '她开始怀疑自己的能力', '她看到的"真相"指向另一个人'],
      ['拿到对手的资源地图', '假扮客户进入对手地盘', '前台认出了她', '她被迫现场使用能力', '代价是忘掉伙伴的生日'],
      ['修复与伙伴的关系', '把一部分真相告诉对方', '对方反而更生气', '两人第一次争吵', '对方留下一件旧物']
    ],
    [
      ['逼对手交出证人', '用规则找到隐藏档案', '档案柜只剩空盒', '她被请去"谈合作"', '对手开价：用证据换最在乎的人平安'],
      ['确认对手到底在保护谁', '跟踪对手的旧车', '车停在废弃礼堂', '礼堂里全是旧事家属的照片', '对手站在她身后'],
      ['拿到关键记录的索引', '说服秘密持有者给出半份证据', '对方要她先读一封信', '信里提到她的童年', '她拒绝了交易']
    ],
    [
      ['拿到完整的半份证据', '请镜像人物做比对', '比对结果指向最亲近的长辈', '她拒绝相信', '伙伴问她"你到底在保护谁"'],
      ['把阶段性胜利变现', '把证据交给盟友做专题', '盟友为独家加了不该加的话', '舆论开始反噬', '盟友承认自己卖过线索'],
      ['修复被舆论撕开的关系', '公开道歉', '对方没有接电话', '共同经营的地方面临收购', '她收到旧号码的短信']
    ],
    [
      ['重新解释证据的用途', '找镜像人物对质', '对方说出另一桩旧事', '两桩旧事共用同一批档案', '对手的养女身份曝光'],
      ['弄清对手真正的目标', '潜入对手家中', '看到满墙旧照片', '照片里有和她长辈一样的人', '对手回来了'],
      ['确认长辈的角色', '偷听长辈与秘密持有者通话', '听到"当年是我签的"', '她当场崩溃', '长辈发现了她']
    ],
    [
      ['在规则反噬中保住关键记忆', '把记忆写在纸上', '纸被雨淋湿', '她忘记了伙伴的脸', '伙伴站在面前她却叫不出名字'],
      ['处理盟友的背叛', '当面拆穿盟友', '盟友交出对手的交易记录', '记录里有长辈的名字', '她被迫公开长辈的部分信息'],
      ['应对身份暴露', '承认自己就是能力持有者', '对手放出完整的私人记录', '她被停职调查', '最在乎的人被带走']
    ],
    [
      ['承认自己的缺陷', '独自留在空房间', '对着旧物说"是我没回头"', '她第一次听见自己哭', '长辈从远方打来电话'],
      ['放弃错误目标', '宣布不再追查凶手', '公众骂她妥协', '她转而要求公开全部档案', '对手主动约她见面'],
      ['接受对手的交易并反制', '假装同意交换', '对手带来完整证据', '她当场使用最后一次能力', '她听见对手说"对不起"']
    ],
    [
      ['完成公开作证', '站上证人席，放弃最后一次能力', '对手当庭公开自己的签字', '长辈承认当年换回了她的安全', '全场要她说出当事人的名字'],
      ['面对最终两难', '公开场合之外长辈被带走', '她可以选择撤回证词', '她选择继续', '她失去了关于那件事的全部记忆'],
      ['用规则漏洞完成救赎', '让伙伴替她读出那封信', '信里是当事人留下的最后一句话', '对手撤销所有控制', '她听见自己说"我原谅你"']
    ]
  ];

  Gen.fillOutline = function (project) {
    const c = Gen.ctx(project);
    const N = c.episodes;
    const item = c.concept.object;
    const stages = project.stages && project.stages.length ? project.stages : Gen.fillStages(project);
    const chars = project.characters || [];
    const heroName = c.heroName;
    const rivalName = c.rivalName;
    const love = (chars.find(x => x.role === '情感关系人物') || {}).name || '苏晚';
    const betrayer = (chars.find(x => x.role === '潜在背叛者') || {}).name || '周叙';
    const cliffs = project.cliffhangers && project.cliffhangers.length ? project.cliffhangers : Gen.fillCliffhangers(project);
    const out = [];
    for (let ep = 1; ep <= N; ep++) {
      const stage = stages.find(s => ep >= Number(s.from) && ep <= Number(s.to)) || stages[stages.length - 1];
      const sIdx = Math.max(0, Math.min(BEAT_SETS.length - 1, Number(stage.no || 1) - 1));
      const beat = BEAT_SETS[sIdx];
      const b = beat[(ep - 1) % beat.length];
      const cliff = cliffs.find(x => Number(x.ep) === ep) || { type: D.cliffTypes[(ep - 1) % 5], text: '' };
      out.push({
        ep,
        stage: stage.name,
        goal: `${b[0]}（第 ${stage.no} 阶段：${stage.name}）`,
        hook: HOOKS[(ep + c.seed) % HOOKS.length],
        action: `${heroName}${b[1]}，目标直指${item}。`,
        counter: b[2].replace('对手', rivalName),
        conflict: `她要在"保住人"和"拿到证据"之间做取舍，${rivalName}偏偏两边都不让她选。`,
        info: b[3],
        relation: `${love}或${betrayer}与她的关系发生细微位移：${ep % 3 === 0 ? '信任出现裂缝' : ep % 3 === 1 ? '被迫更靠近一步' : '第一次说出真话'}。`,
        result: b[4],
        cliff: cliff.text || '她发现最后一条线索指向自己。',
        cliffType: cliff.type
      });
    }
    return out;
  };

  /* ---------------- 剧本 / 分镜 ---------------- */
  function shot(size, action, dialogue, emotion, duration, sound) {
    return {
      id: U.uid('shot'), size, action, dialogue: dialogue || '',
      emotion: emotion || '紧张', duration: duration || 5, sound: sound || ''
    };
  }

  Gen.fillScript = function (project, ep) {
    const c = Gen.ctx(project);
    const b = Gen.genreBundle(project);
    const o = (project.outline || []).find(x => Number(x.ep) === Number(ep)) || (project.outline || [])[0] || {};
    const hero = c.heroName;
    const rival = c.rivalName;
    const loveChar = (project.characters || []).find(x => x.role === '情感关系人物');
    const love = loveChar?.name || (project.characters || []).find(x => x.role !== '主角' && x.role !== '核心对手')?.name || '对方';
    const item = c.concept.object;
    const cliff = o.cliff || '她发现最后一条线索指向自己。';
    const shots = [
      shot('近景', `${hero}在${b.place}的暗处停下，盯着${item}。（喘气声）`, `${hero}：今晚这里有人来过，东西还在原处。`, '悬疑', 4, '环境回声'),
      shot('特写', `它被封在旧纸里，封口有一道新粘的痕迹。`, `${hero}：封口是新的，经手人却没留下名字。`, '悬疑', 4, '纸张摩擦声'),
      shot('中景', `${hero}把它放在桌上，反复核对细节，手指停在一处旧痕上。`, `${hero}：我需要一个没人打扰的地方，十分钟就够。`, '紧张', 5, ''),
      shot('特写', `旧痕与${hero}随身旧物上的划痕一致。`, `${hero}：这件东西，比我想象的更旧。`, '悬疑', 5, ''),
      shot('近景', `${love}推门进来，看到她的表情。`, `${love}：你手在抖，先坐下再说话。`, '紧张', 5, ''),
      shot('近景', `${hero}把手收进袖中，装作整理桌面。`, `${hero}：老毛病了，你别自己吓自己。`, '克制', 5, ''),
      shot('中景', `${love}盯着桌上的东西，没有坐。`, `${love}：这件东西我见过，就在出事那晚。`, '悬疑', 5, ''),
      shot('特写', `${hero}把它挡在身后。`, `${hero}：你从没提过，为什么瞒我到现在？`, '紧张', 4, ''),
      shot('近景', `${love}沉默两秒，移开视线。`, `${love}：有些话说出口，就再也回不去。`, '克制', 5, ''),
      shot('中景', `灯灭了一瞬。${rival}的声音从背后传来。`, `${rival}：这么晚还翻旧账，你不怕丢工作？`, '危机', 6, '脚步声'),
      shot('近景', `${hero}转身，挡在桌前。`, `${hero}：你不也来了，门锁可没坏。`, '对峙', 5, ''),
      shot('特写', `${rival}看着桌上的东西，笑了一下。`, `${rival}：那件东西，从一开始就不属于你。`, '压迫', 5, ''),
      shot('近景', `${hero}把它拿在手里。`, `${hero}：现在它在我手里，规矩该换一换了。`, '爽感', 4, ''),
      shot('中景', `${rival}后退一步，让开门。`, `${rival}：七十二小时，你会亲自送回来。`, '悬疑', 6, ''),
      shot('特写', `门关上。${hero}低头，发现封口裂开了一条缝。`, `${hero}：他算准了我会怕，才敢只给三天。`, '危机', 5, '关门声'),
      shot('特写', `裂缝里掉出一张纸条，字迹被水洇开。`, `${hero}：纸条上写着，别相信你听见的。`, '悬疑', 5, ''),
      shot('近景', `${hero}把纸条折好，放进贴身口袋。`, `${hero}：他算准我会来，我偏要留下。`, '克制', 5, ''),
      shot('中景', `${love}站在门口，没有走。`, `${love}：这次别一个人扛，行不行？`, '克制', 5, '')
    ];
    shots.push(shot('特写', `字幕：${cliff}`, '', '卡点', 4, ''));
    return shots.map((s, i) => Object.assign(s, {
      ep: Number(ep), no: i + 1,
      sceneTitle: b.scene,
      prompt: `竖屏 9:16，${s.size}，${s.action.replace(/（.*?）/g, '')}，情绪：${s.emotion}，电影感打光，写实中国${b.label}短剧质感。`
    }));
  };

  /* ---------------- 可行性 / 风险 / 评分 ---------------- */
  Gen.fillFeasibility = function (project) {
    const b = Gen.genreBundle(project);
    return {
      scenes: `6 个：${b.place} / 主角工作地 / 对手据点 / 秘密持有者住处 / 公共听证场所 / 终局核心场景。`,
      actors: '7 名核心演员：主角、对手、情感关系、盟友、背叛者、秘密持有者、镜像人物。',
      effects: '以近景、道具特写与灯光变化为主；无高成本特效。',
      location: '低',
      risk: '主要场景集中，需一次性搭建核心空间；外景需备选室内方案。',
      plan: '压缩为 5 个主要场景；把大型场面改为夜间室内戏；用表演与剪辑张力替代视觉特效，单集成本可控在预算内。'
    };
  };

  Gen.fillRisks = function (project) {
    return {
      repeat: '中段容易重复"找证据—被抢走"的动作，需要把每阶段目标换成关系目标。',
      tooling: '盟友与镜像人物有沦为工具人的风险，需补足他们的私人欲望与独处戏。',
      rule: '规则代价需要可视化，否则观众会忘记风险；中点前后必须明确反噬。',
      midsag: '中段信息密度容易下降；用中点反转把"找凶手"改为"找被删掉的人"。',
      twist: '终极真相依赖长辈签字，需在前 10 集埋 3 处行为异常，避免突然反转。',
      cost: '搭景与后期是主要成本；用固定场景与同期声控制预算。',
      compliance: '无涉黄赌毒与真实人物影射；涉及调查情节需避免具体机构指向。',
      ip: '概念为原创；核心规则需避免与已知作品高度相似，建议保留独特代价设计。',
      plan: '优先修：① 主角主动性；② 规则代价可视化；③ 中段目标替换。三项完成后再进入剧本。'
    };
  };

  Gen.fillScore = function (project) {
    const dims = {};
    D.scoreDims.forEach(d => { dims[d.key] = Math.round(d.max * 0.82); });
    const total = Object.values(dims).reduce((a, b) => a + b, 0);
    return {
      dimensions: dims, total,
      verdict: total >= 90 ? '可进入详细分集开发' : total >= 80 ? '整体成熟，局部调整' : total >= 70 ? '概念可用，发动机或人物不足' : '建议重构核心规则或人物目标',
      priority: '优先补强规则代价的可视化与中段关系变化。',
      mustConfirm: '合规与侵权复核；核心规则删除测试；主角每阶段主动行动清单。'
    };
  };

  /* ---------------- 编排 ---------------- */
  Gen.fillStep = function (stepId, project) {
    switch (stepId) {
      case 'review': Object.assign(project, { review: Gen.fillReview(project) }); break;
      case 'engine': Object.assign(project, { engine: Gen.fillEngine(project) }); break;
      case 'rules': project.rules = Gen.fillRules(project); break;
      case 'characters': {
        project.characters = Gen.fillCharacters(project);
        project.relations = Gen.fillRelations(project);
        break;
      }
      case 'rival': project.engine = project.engine || {}; project.engine.rival = Gen.fillEngine(project).rival; break;
      case 'secrets': project.secrets = Gen.fillSecrets(project); break;
      case 'stages': project.stages = Gen.fillStages(project); break;
      case 'emotion': project.emotionCurve = Gen.fillEmotion(project); break;
      case 'cliffhangers': project.cliffhangers = Gen.fillCliffhangers(project); break;
      case 'outline': project.outline = Gen.fillOutline(project); break;
      case 'feasibility': project.feasibility = Gen.fillFeasibility(project); break;
      case 'risks': project.risks = Gen.fillRisks(project); break;
      case 'score': project.score = Gen.fillScore(project); break;
      default: return false;
    }
    Store.addActivity(`生成「${D.stepInfo(stepId)?.title || stepId}」草稿`);
    Store.touch();
    return true;
  };

  Gen.generateAll = function (project) {
    if ((project.overview?.concepts || []).length === 0) {
      project.overview.concepts = Gen.generateConcepts(project);
      project.overview.choseConcept = 0;
    }
    const order = ['review', 'engine', 'rules', 'characters', 'rival', 'secrets', 'stages', 'emotion', 'cliffhangers', 'outline', 'feasibility', 'risks', 'score'];
    order.forEach(id => {
      // 复用已生成的人物与阶段，避免每次重建
      if (id === 'characters' && (project.characters || []).length) return;
      if (id === 'rival' && project.engine?.rival?.goal) return;
      const copy = JSON.parse(JSON.stringify(project));
      Gen.fillStep(id, copy);
      switch (id) {
        case 'review': project.review = copy.review; break;
        case 'engine': project.engine = copy.engine; break;
        case 'rules': project.rules = copy.rules; break;
        case 'characters': project.characters = copy.characters; project.relations = copy.relations; break;
        case 'secrets': project.secrets = copy.secrets; break;
        case 'stages': project.stages = copy.stages; break;
        case 'emotion': project.emotionCurve = copy.emotionCurve; break;
        case 'cliffhangers': project.cliffhangers = copy.cliffhangers; break;
        case 'outline': project.outline = copy.outline; break;
        case 'feasibility': project.feasibility = copy.feasibility; break;
        case 'risks': project.risks = copy.risks; break;
        case 'score': project.score = copy.score; break;
      }
    });
    Store.touch();
    return true;
  };

  /* ---------------- AI ---------------- */
  const AI_SCHEMA = {
    review: '{"strengths":"","risks":"","uniqueVar":"","cliche":"","suitable":"适合","keep":"","adjust":"","conclusion":"","passed":true}',
    engine: '{"protagonist":{"name":"","identity":"","situation":"","flaw":"","ability":"","fear":"","protect":""},"desires":{"surface":"","deep":"","hidden":""},"inciting":"","cannotQuit":["",""],"obstacles":{"external":"","internal":"","relational":"","rule":""},"escalations":[""],"finalChoice":{"a":"","b":"","question":""}}',
    rules: '{"rules":[{"name":"","source":"","holder":"","trigger":"","effect":"","gain":"","costNow":"","costLong":"","limits":"","forbidden":"","loophole":"","misdirection":"","backlash":"","rivalUse":"","misread":"","purpose":"","resolution":""}]}',
    characters: '{"characters":[{"name":"","role":"主角","age":"","look":"","surface":"","desire":"","fear":"","secret":"","weakness":"","ability":"","bottomLine":"","lie":"","relation":"","wants":"","stanceEarly":"","stanceMid":"","stanceFinal":"","ending":"","voiceNote":"","depth":{"publicDesire":"","hiddenFear":"","conflictingValue":"","habit":"","memory":"","lie":"","selfCruelty":"","flawLoved":"","kindness":"","privateMoment":""}}],"relations":[{"aName":"","bName":"","wantA":"","wantB":"","cannotSay":"","misread":"","shared":"","conflict":"","change1":"","change2":"","change3":""}]}',
    rival: '{"rival":{"name":"","identity":"","goal":"","trueGoal":"","logic":"","motive":"","mirror":"","weaknessHit":"","help":""}}',
    secrets: '{"secrets":[{"layer":"即时秘密","content":"","known":"","unknown":"","misread":"","hintEp":"","partialEp":"","fullEp":"","change":"","newProblem":""}]}',
    stages: '{"stages":[{"no":1,"name":"","from":1,"to":8,"goal":"","heroGoal":"","rivalGoal":"","strategy":"","conflict":"","relationChange":"","revealed":"","kept":"","win":"","cost":"","twist":"","hook":""}]}',
    emotion: '{"emotionCurve":[{"ep":10,"phase":"小胜","type":"爽点","note":""}]}',
    cliffhangers: '{"cliffhangers":[{"ep":1,"type":"信息","text":"","note":""}]}',
    outline: '{"outline":[{"ep":1,"stage":"","goal":"","hook":"","action":"","counter":"","conflict":"","info":"","relation":"","result":"","cliff":"","cliffType":"信息"}]}',
    feasibility: '{"scenes":"","actors":"","effects":"","location":"低","risk":"","plan":""}',
    risks: '{"repeat":"","tooling":"","rule":"","midsag":"","twist":"","cost":"","compliance":"","ip":"","plan":""}',
    score: '{"dimensions":{"hook":0,"heroGoal":0,"engine":0,"rival":0,"rule":0,"relation":0,"escalate":0,"endurance":0,"suspense":0,"emotion":0,"cliff":0,"feasibility":0,"business":0},"verdict":"","priority":"","mustConfirm":""}'
  };

  const AI_RULES = `你是「AI 短剧项目开发总监」，遵循以下铁律：
1. 故事发动机高于剧情数量：主角必须有主动目标，主角必须有 ≥2 个不能退出的原因。
2. 冲突来自目标对立，不是误会争吵；对手有自己的目标、逻辑、资源与镜像关系。
3. 核心规则必须有收益、即时代价、长期代价、限制、漏洞、反噬、对手反制，删除规则后故事不成立。
4. 每次胜利都要带来新问题；升级机制 ≥6 种。
5. 最终高潮必须在两个重要价值之间做选择，不能只是打败反派。
6. 秘密分四层：即时、关系、主线、终极；终极真相必须提前埋伏笔。
7. 分集：开场 5 秒出钩子；主角每集有具体行动且不能顺利完成；每集至少改变信息/关系/风险/目标之一；结尾强卡点，五种类型轮换。
8. 台词短句 ≤20 字，不说教、不解释情绪；人物口吻稳定；禁止 AI 塑料感金句。
9. 不写套路换皮（隐藏身份打脸 / 重生顺序复仇 / 契约婚姻 / 真假千金 / 总裁爱上普通女孩）。
10. 只输出合法 JSON，不要 Markdown 代码块，不要任何解释。`;

  Gen.stepContext = function (project) {
    const ov = project.overview || {};
    const c = Gen.ctx(project);
    return [
      `项目：${ov.title || project.name}`,
      `高概念：${c.concept.logline || ov.logline || ''}`,
      `类型/受众：${ov.genre || ''} / ${ov.audience || ''}`,
      `集数/时长：${ov.episodes || 60} 集，单集 ${ov.duration || '1—3分钟'}`,
      `核心情绪：${(ov.emotions || []).join('、')}`,
      `私货主题：${ov.privateGoods?.theme || ''}`,
      `私货细节：${ov.privateGoods?.moment || ''}；${ov.privateGoods?.childhood || ''}`,
      `主角：${c.heroName}；对手：${c.rivalName}`,
      project.engine?.protagonist?.flaw ? `主角缺陷：${project.engine.protagonist.flaw}` : '',
      project.engine?.finalChoice?.question ? `最终选择：${project.engine.finalChoice.question}` : ''
    ].filter(Boolean).join('\n');
  };

  /* 统一取语言模型：所有生成都走模型，不再回退本地模板 */
  Gen.llm = function (kind) {
    const provider = Store.providerFor(kind || 'development') || Store.providerFor('llm');
    if (!provider) throw new Error('请先在「模型配置」中添加语言模型 Provider');
    return provider;
  };

  /* 统一 chat 入口：记录 token 用量后再返回，所有生成都必须经此调用 */
  Gen.lastUsage = null;

  Gen.chat = async function (scope, messages, options, kind) {
    const provider = Gen.llm(kind);
    const res = await window.duanju.chat({ provider, messages, options: options || {} });
    const usage = (res && res.usage) || { prompt: 0, completion: 0, total: 0 };
    Gen.lastUsage = usage;
    Store.recordUsage({
      projectId: Store.project ? Store.project.id : '',
      scope: scope || '生成',
      model: (res && res.model) || provider.model,
      provider: provider.name || '',
      usage: usage,
      estimated: !!(res && res.estimated),
      durationMs: res && res.durationMs
    });
    return res;
  };

  Gen.usageText = function (usage) {
    const u = usage || Gen.lastUsage;
    if (!u || !u.total) return '';
    return ` · ${window.U.num(u.total)} tokens`;
  };

  const CONCEPT_SYSTEM = `你是短剧高概念策划，服务竖屏投流短剧。
规则：
1. 先发散、再聚焦。禁止拯救世界、失忆、车祸、绝症、真假千金、总裁爱上普通女孩等烂梗换皮。
2. 概念必须一句话讲清：人物 + 独特设定 + 冲突 + 情感钩子，三句话内说完。
3. 独特设定要可重复触发、可付出代价；不是道具，是发动机。
4. 每个概念覆盖一个不同类型，同批不得出现两个类型相同。
5. 情感必须落在具体关系上（亲人 / 伴侣 / 同事 / 陌生人），不用抽象词。
6. 只输出合法 JSON，不要 Markdown 代码块，不要解释。`;

  Gen.aiConcepts = async function (project, opts) {
    const o = opts || {};
    const ov = project.overview || {};
    const pg = ov.privateGoods || {};
    const count = Number(o.count || 9);
    const focus = o.genre || '';
    const group = window.D.genreGroupOf(focus);
    const allGenres = window.D.genres.join('、');
    const messages = [
      { role: 'system', content: CONCEPT_SYSTEM },
      {
        role: 'user', content: `作者私货：
主题：${pg.theme || ''}
情感瞬间：${pg.moment || ''}
最讨厌的套路：${pg.hatedTrope || ''}
相信的一句话：${pg.belief || ''}
童年细节：${pg.childhood || ''}
愧疚瞬间：${pg.regret || ''}
最近的情绪场景：${pg.recentScene || ''}

项目：${ov.title || project.name} / 集数 ${ov.episodes || 60} / 核心情绪 ${(ov.emotions || []).join('、') || '未定'}
类型聚焦：${focus ? `${focus}${group ? `（${group.label}）` : ''}` : '不限，跨类型发散'}
可选类型库：${allGenres}

请输出 ${count} 个方向互不重复的高概念；${focus ? `其中至少 5 个属于「${focus}」，其余可跨类型对照` : '覆盖至少 4 个不同类型'}；每个概念里的 genre 必须取自类型库原文。
严格输出 JSON：{"concepts":[{"title":"不超过 8 字","genre":"取自类型库","logline":"三句话内，人物+设定+冲突+情感钩子","hero":"姓名（年龄，职业）","heroName":"","profession":"","unique":"独特设定","object":"关键物件","conflict":"核心冲突","hook":"第一集钩子","emotion":"最能打动观众的情绪"}]}`
      }
    ];
    const res = await Gen.chat('高概念候选', messages, { json: true, temperature: 0.95, maxTokens: 4096 });
    const data = parseJson(res.text);
    const list = Array.isArray(data.concepts) ? data.concepts : [];
    if (!list.length) throw new Error('模型没有返回 concepts 数组');
    return list.slice(0, count).map(function (c, i) {
      return Object.assign({}, c, {
        title: c.title || `方向 ${i + 1}`,
        genre: c.genre || focus || '都市情感',
        emotion: c.emotion || (ov.emotions || [])[0] || '情感拉扯'
      });
    });
  };

  Gen.aiQuestions = async function (project) {
    const ov = project.overview || {};
    const pg = ov.privateGoods || {};
    const messages = [
      { role: 'system', content: '你是短剧编剧的采访者。你的任务不是给建议，而是用问题逼出作者最私人的具体细节：感官、动作、矛盾心理。问题必须用第二人称，落到可拍的具体动作上。只输出合法 JSON。' },
      {
        role: 'user', content: `已知私货：
主题：${pg.theme || '未填'}
瞬间：${pg.moment || '未填'}
讨厌的套路：${pg.hatedTrope || '未填'}
相信的话：${pg.belief || '未填'}
童年细节：${pg.childhood || '未填'}
愧疚瞬间：${pg.regret || '未填'}
项目：${ov.title || project.name} / ${ov.genre || '类型未定'}

请生成 8 个追问，每个 20—45 字，必须引用上面出现过的具体词，不要泛泛而问；按「越问越私人」排序。
严格输出 JSON：{"questions":["",""]}`
      }
    ];
    const res = await Gen.chat('私货追问', messages, { json: true, temperature: 0.85, maxTokens: 1600 });
    const data = parseJson(res.text);
    if (!Array.isArray(data.questions) || !data.questions.length) throw new Error('模型没有返回 questions 数组');
    return data.questions.slice(0, 10);
  };

  Gen.aiPrompts = async function (project, ep) {
    const shots = (project.shots || []).filter(s => Number(s.ep) === Number(ep));
    if (!shots.length) throw new Error('本集还没有镜头，请先写剧本或生成分镜');
    const brief = shots.map(s => ({ no: s.no, size: s.size, scene: s.sceneTitle, action: s.action, dialogue: s.dialogue, emotion: s.emotion }));
    const messages = [
      { role: 'system', content: '你是竖屏短剧的出图提示词工程师。为每个镜头写一条可直接投喂图像模型的提示词：竖屏 9:16、景别、场景、人物动作与状态、光源与色温、情绪、镜头质感。中文描述，60—110 字，禁止出现片名、演员名与字幕。只输出合法 JSON。' },
      { role: 'user', content: `项目：${project.overview?.title || project.name} / 类型 ${project.overview?.genre || '都市情感'}\n第 ${ep} 集镜头：\n${JSON.stringify(brief, null, 1)}\n\n严格输出 JSON：{"prompts":[{"no":1,"prompt":""}]}，no 必须与输入镜头号一致。` }
    ];
    const res = await Gen.chat('分镜提示词', messages, { json: true, temperature: 0.8, maxTokens: 4096 });
    const data = parseJson(res.text);
    if (!Array.isArray(data.prompts)) throw new Error('模型没有返回 prompts 数组');
    const byNo = {};
    data.prompts.forEach(p => { byNo[Number(p.no)] = String(p.prompt || '').trim(); });
    let n = 0;
    shots.forEach(s => {
      const text = byNo[Number(s.no)];
      if (text) { s.prompt = text; n++; }
    });
    Store.addActivity(`AI 补齐第 ${ep} 集 ${n} 条出图提示词`);
    Store.touch();
    return n;
  };

  Gen.aiFill = async function (stepId, project) {
    const schema = AI_SCHEMA[stepId];
    if (!schema) throw new Error('该步骤暂不支持 AI 生成');
    const step = D.stepInfo(stepId);
    const messages = [
      { role: 'system', content: AI_RULES },
      { role: 'user', content: `项目上下文：\n${Gen.stepContext(project)}\n\n现在执行开发步骤「${step.title}」：${step.desc}\n\n请严格按以下 JSON 结构输出（字段内容用中文，具体、可拍、不空泛）：\n${schema}` }
    ];
    const res = await Gen.chat('步骤 · ' + step.title, messages, { json: true, temperature: 0.85 });
    const data = parseJson(res.text);
    Gen.applyAI(stepId, project, data);
    Store.addActivity(`AI 生成「${step.title}」`);
    Store.touch();
    return project;
  };

  function parseJson(text) {
    if (!text) throw new Error('AI 返回为空');
    let t = String(text).trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    try { return JSON.parse(t); } catch (e) { }
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(t.slice(start, end + 1)); } catch (e) { }
    }
    throw new Error('AI 返回不是合法 JSON');
  }

  Gen.applyAI = function (stepId, project, data) {
    switch (stepId) {
      case 'review': project.review = Object.assign({}, project.review, data); break;
      case 'engine': project.engine = Object.assign({}, project.engine, data); break;
      case 'rules': if (Array.isArray(data.rules)) project.rules = data.rules.map(r => Object.assign({ id: U.uid('rule') }, r)); break;
      case 'characters': {
        if (Array.isArray(data.characters)) {
          project.characters = data.characters.map(ch => Object.assign({ id: U.uid('char'), assetIds: [], voiceNote: '' }, ch, {
            depth: Object.assign({}, ch.depth || {})
          }));
        }
        if (Array.isArray(data.relations)) {
          const byName = {};
          (project.characters || []).forEach(ch => { byName[ch.name] = ch.id; });
          project.relations = data.relations.map(r => Object.assign({ id: U.uid('rel') }, r, {
            aId: byName[r.aName] || '', bId: byName[r.bName] || ''
          }));
        }
        break;
      }
      case 'rival': project.engine = project.engine || {}; project.engine.rival = data.rival || data; break;
      case 'secrets': if (Array.isArray(data.secrets)) project.secrets = data.secrets.map(s => Object.assign({ id: U.uid('secret') }, s)); break;
      case 'stages': if (Array.isArray(data.stages)) project.stages = data.stages.map(s => Object.assign({ id: U.uid('stage') }, s)); break;
      case 'emotion': if (Array.isArray(data.emotionCurve)) project.emotionCurve = data.emotionCurve.map(e => Object.assign({ id: U.uid('emo') }, e)); break;
      case 'cliffhangers': if (Array.isArray(data.cliffhangers)) project.cliffhangers = data.cliffhangers.map(c => Object.assign({ id: U.uid('cliff') }, c)); break;
      case 'outline': if (Array.isArray(data.outline)) project.outline = data.outline; break;
      case 'feasibility': project.feasibility = Object.assign({}, project.feasibility, data); break;
      case 'risks': project.risks = Object.assign({}, project.risks, data); break;
      case 'score': project.score = Object.assign({}, project.score, data); break;
    }
  };

  Gen.aiOutline = async function (project, fromEp, toEp) {
    const stages = (project.stages || []).map(s => `阶段${s.no} ${s.name}（第${s.from}—${s.to}集）：${s.goal}`).join('\n');
    const messages = [
      { role: 'system', content: AI_RULES },
      { role: 'user', content: `项目上下文：\n${Gen.stepContext(project)}\n\n整剧阶段：\n${stages}\n\n请生成第 ${fromEp}—${toEp} 集的分集大纲，严格输出 JSON：\n{"outline":[{"ep":${fromEp},"stage":"","goal":"","hook":"","action":"","counter":"","conflict":"","info":"","relation":"","result":"","cliff":"","cliffType":"信息"}]}\n卡点类型必须按 信息/危机/关系/选择/反转 轮换，不得连续两集同类型。` }
    ];
    const res = await Gen.chat('分集大纲', messages, { json: true, temperature: 0.85, maxTokens: 8192 }, 'development');
    const data = parseJson(res.text);
    if (!Array.isArray(data.outline)) throw new Error('AI 未返回 outline 数组');
    const keep = (project.outline || []).filter(o => Number(o.ep) < fromEp || Number(o.ep) > toEp);
    project.outline = keep.concat(data.outline).sort((a, b) => Number(a.ep) - Number(b.ep));
    Store.addActivity(`AI 生成第 ${fromEp}—${toEp} 集大纲`);
    Store.touch();
    return data.outline;
  };

  Gen.aiScript = async function (project, ep) {
    const o = (project.outline || []).find(x => Number(x.ep) === Number(ep));
    if (!o) throw new Error('该集还没有大纲，请先生成分集大纲');
    const messages = [
      { role: 'system', content: AI_RULES + '\n11. 剧本为竖屏短剧：单集 60—180 秒，镜头 10—25 个，单镜头 3—10 秒；台词总量 300—600 字。' },
      { role: 'user', content: `项目上下文：\n${Gen.stepContext(project)}\n\n本集大纲：\n${JSON.stringify(o, null, 2)}\n\n请写第 ${ep} 集正式剧本，严格输出 JSON：\n{"shots":[{"size":"特写|近景|中景|全景|远景","sceneTitle":"内·地点·时间","action":"","dialogue":"角色名：台词（可空）","sound":"","emotion":"","duration":5,"prompt":"竖屏9:16 英文/中文画面提示"}],"cliff":"","cliffType":"信息"}\n要求：第一个镜头 5 秒内出钩子；最后镜头是字幕卡点；台词单句 ≤20 字；禁止说教与解释情绪。` }
    ];
    const res = await Gen.chat('剧本 · 第 ' + ep + ' 集', messages, { json: true, temperature: 0.9, maxTokens: 8192 }, 'script');
    const data = parseJson(res.text);
    if (!Array.isArray(data.shots)) throw new Error('AI 未返回 shots 数组');
    const shots = data.shots.map((s, i) => Object.assign({ id: U.uid('shot'), ep: Number(ep), no: i + 1, assetIds: [] }, s));
    project.shots = (project.shots || []).filter(s => Number(s.ep) !== Number(ep)).concat(shots);
    project.scriptStatus = project.scriptStatus || {};
    project.scriptStatus[ep] = true;
    Store.addActivity(`AI 生成第 ${ep} 集剧本`);
    Store.touch();
    return shots;
  };

  Gen.image = async function (project, prompt, meta) {
    const provider = Store.providerFor('image');
    if (!provider) throw new Error('请先在「模型配置」中添加图像模型 Provider');
    const asset = await window.duanju.generateImage({ provider, project, prompt, meta });
    const stored = await window.duanju.loadProject(project.id);
    project.assets = stored.assets;
    Store.touch();
    return asset;
  };

  Gen.tts = async function (project, text, meta) {
    const provider = Store.providerFor('tts');
    if (!provider) throw new Error('请先在「模型配置」中添加语音合成 Provider');
    const asset = await window.duanju.generateSpeech({ provider, project, text, meta });
    project.assets = (await window.duanju.loadProject(project.id)).assets;
    Store.touch();
    return asset;
  };

  /* ---------------- 剧本自检 ---------------- */
  Gen.lintScript = function (project, ep) {
    const shots = (project.shots || []).filter(s => Number(s.ep) === Number(ep));
    const o = (project.outline || []).find(x => Number(x.ep) === Number(ep));
    const total = shots.reduce((a, s) => a + Number(s.duration || 0), 0);
    const dialogues = shots.map(s => String(s.dialogue || '').trim()).filter(Boolean);
    const longLines = dialogues.filter(d => d.replace(/^[^：:]*[：:]/, '').length > 20);
    const first = shots[0] || {};
    const last = shots[shots.length - 1] || {};
    const prevCliff = (project.outline || []).find(x => Number(x.ep) === Number(ep) - 1)?.cliffType;
    const hasChange = !!(o?.info || o?.relation || o?.result);
    return [
      { key: 'hook', label: '开场 5 秒内有钩子（冲突 / 异常 / 结果预告）', pass: !!(first.action && Number(first.duration || 0) <= 5) },
      { key: 'goal', label: '主角有具体行动目标，且未按计划顺利完成', pass: !!(o?.action && o?.counter) },
      { key: 'change', label: '本集至少改变信息 / 关系 / 风险 / 目标之一', pass: hasChange },
      { key: 'cliffDiff', label: '结尾卡点与前集不同类', pass: !prevCliff || prevCliff !== (o?.cliffType || last.emotion) },
      { key: 'mainline', label: '推动主线（或支线集有回主线钩子）', pass: !!(o?.goal) },
      { key: 'dialogue', label: '台词全部 ≤20 字短句，无寒暄 / 大段独白', pass: longLines.length === 0 },
      { key: 'elements', label: '场景 / 景别 / 动作 / 对白 / 音效 / 情绪 / 时长元素齐全', pass: shots.length > 0 && shots.every(s => s.size && s.action && s.emotion && s.duration) },
      { key: 'length', label: '时长 60—180 秒、镜头 10—25 个', pass: total >= 60 && total <= 180 && shots.length >= 10 && shots.length <= 25 },
      { key: 'cliff', label: '结尾卡点与大纲一致且明确', pass: !!(o?.cliff) && String(last.action || '').includes('字幕') },
      { key: 'consistency', label: '规则代价 / 秘密节奏 / 人物口吻与规格一致', pass: true },
      { key: 'noxplan', label: '无说教句 / 无情绪解释句', pass: dialogues.every(d => !/这就是|人生|时间会|你要相信/.test(d)) },
      { key: 'plastic', label: '无 AI 塑料感金句', pass: dialogues.every(d => d.length <= 26) },
      { key: 'failure', label: '主角至少经历一次过程性失败', pass: !!(o?.counter) },
      { key: 'sense', label: '温度四则：无直说情绪形容词 / 有感官细节', pass: shots.some(s => /（.*?）/g.test(String(s.action || '')) || /(声|光|味道|雨|冷|热)/.test(String(s.action || ''))) },
      { key: 'unspoken', label: '保留一处没说出口的情感 / 独处戏', pass: shots.some(s => Number(s.duration) >= 5) },
      { key: 'duration', label: '台词量 300—600 字', pass: dialogues.join('').length >= 300 && dialogues.join('').length <= 600 }
    ];
  };

  Gen.ensureOutline = function (project, fromEp, toEp) {
    const c = Gen.ctx(project);
    const stages = project.stages && project.stages.length ? project.stages : Gen.fillStages(project);
    if (!project.stages || !project.stages.length) project.stages = stages;
    if (!project.cliffhangers || !project.cliffhangers.length) project.cliffhangers = Gen.fillCliffhangers(project);
    const existing = project.outline || [];
    const all = Gen.fillOutline(project);
    const merged = existing.slice();
    all.filter(o => Number(o.ep) >= fromEp && Number(o.ep) <= toEp).forEach(o => {
      if (!merged.some(x => Number(x.ep) === Number(o.ep))) merged.push(o);
    });
    project.outline = merged.sort((a, b) => Number(a.ep) - Number(b.ep));
    Store.touch();
    return project.outline;
  };

  window.Gen = Gen;
})();
