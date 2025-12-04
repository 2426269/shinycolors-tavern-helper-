const fs = require('fs');
const path = require('path');

// 读取技能卡库（从备份文件）
const backupPath = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库-原始.json');
const skillCardLibraryPath = fs.existsSync(backupPath)
  ? backupPath
  : path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json');
const skillCardLibrary = JSON.parse(fs.readFileSync(skillCardLibraryPath, 'utf-8'));

// 日文到中文的术语映射
const terminologyMap = {
  // 基础属性
  パラメータ: '数值',
  体力: '体力',
  元気: '元气',
  やる気: '干劲',
  好印象: '好印象',
  集中: '集中',
  全力値: '全力值',
  スコア: '得分',
  熱意: '热意',

  // 状态效果
  好調: '好调',
  絶好調: '状态绝佳',
  温存: '温存',
  強気: '强气',
  消費体力減少: '消费体力减少',
  消費体力削減: '消费体力削减',
  のんびり: '悠闲',
  低下状態無効: '低下状态无效',
  低下状態回復: '低下状态恢复',
  低下状態: '低下状态',
  元気増加無効: '元气增加无效',

  // 通用术语（长词在前）
  レッスン開始時手札に入る: '演出开始时加入手牌',
  レッスン開始時: '演出开始时',
  レッスンCLEAR: '演出目标',
  このレッスン中: '本次演出中',
  レッスン中: '演出中',
  レッスン: '演出',
  このスキルカード: '本技能卡',
  全てのスキルカード: '所有技能卡',
  このターン: '本回合',
  次のターン: '下回合',
  ターン終了時: '回合结束时',
  ターン開始時: '回合开始时',
  ターン追加: '回合追加',
  ターン: '回合',
  重複不可: '不可重复',
  使用可能: '可重复获得',
  スキルカード使用数追加: '技能卡使用数+',
  スキルカード使用回数追加: '技能卡使用次数追加',
  スキルカード: '技能卡',
  アクティブスキルカード: 'A卡',
  メンタルスキルカード: 'M卡',
  Aアクティブ: 'A卡',
  Mメンタル: 'M卡',
  手札をすべてレッスン中強化: '手牌全部演出中强化',
  手札をすべて入れ替える: '手牌全部替换',
  手札を全てレッスン中強化: '手牌全部演出中强化',
  手札のパラメータ上昇回数増加: '手牌数值上升次数增加',
  '手札を選択し、保留に移動': '选择手牌移至保留',
  手札: '手牌',
  すべて: '所有',
  すべての: '所有',
  全ての: '所有',
  選択し: '选择',
  選択: '选择',
  '山札か捨て札にあるスキルカードを選択し、保留に移動': '选择牌组或弃牌堆中的技能卡移至保留',
  '山札か捨札にあるスキルカードを選択し、保留に移動': '选择牌组或弃牌堆中的技能卡移至保留',
  山札か捨て札にあるスキルカード: '牌组或弃牌堆中的技能卡',
  山札か捨札にあるスキルカード: '牌组或弃牌堆中的技能卡',
  '山札にあるスキルカードを選択し、保留に移動': '选择牌组中的技能卡移至保留',
  山札にあるスキルカード: '牌组中的技能卡',
  山札: '牌组',
  捨て札: '弃牌堆',
  捨札: '弃牌堆',
  保留にあるスキルカード: '保留区的技能卡',
  保留に移動: '移至保留',
  保留: '保留',
  除外に移動: '移至除外',
  除外: '除外',
  自身を保留に移動: '自身移至保留',
  自身: '自身',
  スキルカードを引く: '抽取技能卡',
  スキルカードを2枚引く: '抽取2张技能卡',
  スキルカードを3枚引く: '抽取3张技能卡',
  技能卡1張ごと: '每1张技能卡',
  '1張ごと': '每1张',
  ごと: '每',
  使用效果ない干扰卡: '使用无效果的干扰卡',
  使用何効果ないお邪魔カード: '使用无任何效果的干扰卡',
  何効果ないお邪魔カード: '无任何效果的干扰卡',
  効果ない: '无效果',
  何効果ない: '无任何效果',
  お邪魔カード: '干扰卡',
  ない: '无',
  何: '',

  // 常用词组
  'コストを元気-': '费用变为元气-',
  コストをなしに変更: '费用变为无',
  コストを: '费用变为',
  コスト値増加: '费用值增加',
  コスト値減少: '费用值减少',
  コスト: '费用',
  体力消費: '体力消耗',
  最大体力: '最大体力',
  体力回復: '体力回复',
  '体力が50%以上': '体力在50%以上',
  '体力が50%以下': '体力在50%以下',

  // 效果相关
  '以降、ターン開始時': '之后每回合开始时',
  '以降、ターン終了時': '之后每回合结束时',
  '以降、': '之后，',
  以降: '之后',
  次に使用したスキルカードの消費体力を0にする: '下次使用的技能卡体力消耗变为0',
  次に使用するスキルカードの効果をもう1回発動: '下次使用的技能卡效果再发动1次',
  次に使用するアクティブスキルカードの効果をもう1回発動: '下次使用的A卡效果再发动1次',
  '次のターン、温存2段階目に変更': '下回合，切换至温存2段状态',
  '次のターン、温存に変更': '下回合，切换至温存状态',
  '次のターン、強気に変更': '下回合，切换至强气状态',
  '次のターン、強気2段階目に変更': '下回合，切换至强气2段状态',
  温存2段階目に変更: '切换至温存2段状态',
  温存に変更: '切换至温存状态',
  強気2段階目に変更: '切换至强气2段状态',
  強気に変更: '切换至强气状态',
  のんびりに変更: '切换至悠闲状态',
  '次のターン、': '下回合，',
  次のターン: '下回合',
  '2ターン後': '2回合后',
  '3ターン後': '3回合后',
  '4ターン後': '4回合后',
  最終ターンのターン終了時: '最后回合结束时',
  '3ターン目以降': '第3回合起',
  '5ターンの間': '5回合期间',

  // 条件
  '場合、使用可': '时可使用',
  場合使用可: '时可使用',
  '場合、': '时，',
  場合: '时',
  全力の場合: '全力时',
  温存の場合: '温存时',
  強気の場合: '强气时',
  非全力状態の場合: '非全力时',
  非強気状態の場合: '非强气时',
  全力効果のアクティブスキルカード: '全力效果的A卡',
  全力効果のスキルカード: '全力效果的技能卡',
  強気効果のスキルカード: '强气效果的技能卡',
  温存効果のスキルカード: '温存效果的技能卡',
  メンタルスキルカード使用時: 'M卡使用时',
  アクティブスキルカード使用時: 'A卡使用时',
  全力効果: '全力效果',
  強気効果: '强气效果',
  温存効果: '温存效果',
  好調状態の場合: '好调状态时',
  好調状態: '好调状态',
  絶好調: '状态绝佳',
  全力: '全力',
  非強気状態: '非强气状态',
  非温存状態: '非温存状态',

  // 特殊复合效果（必须在单词之前匹配）
  '温存に変更 以降、強気効果のスキルカード使用後、強気効果のスキルカードのパラメータ増加値':
    '切换为温存后，使用强气效果技能卡时，该技能卡的数值增加',
  '以降、強気効果のスキルカード使用後、強気効果のスキルカードのパラメータ増加値':
    '之后，使用强气效果技能卡时，该技能卡的数值增加',
  '強気効果のスキルカード使用後、強気効果のスキルカードのパラメータ増加値': '使用强气效果技能卡时，该技能卡的数值增加',
  '以降3回まで、全力を解除後、非全力状態の場合、温存に変更': '此后3回合内，退出全力状态时，切换至温存状态',

  // 数值相关
  パラメータ上昇量増加: '数值上升量增加',
  パラメータ値増加: '数值增加',
  パラメータ値減少: '数值减少',
  パラメータ増加値: '数值增加',
  パラメータ: '数值',
  消費体力増加: '消费体力增加',

  // 增益相关
  強化済みスキルカード: '已强化技能卡',
  強化済み: '已强化',
  ランダムな強化済みスキルカード: '随机已强化技能卡',
  'ランダムな山札か捨札にあるスキルカード（SSR）': '随机牌组或弃牌堆中的SSR技能卡',
  ランダムな: '随机',
  レッスン中強化: '演出中强化',
  強化: '强化',
  パラメータ上昇回数増加: '数值上升次数增加',
  増加量増加: '增加量增加',
  効果をもう1回発動: '效果再发动1次',
  効果を: '效果',
  効果: '效果',

  // 指针相关
  指針を変更するたび: '每次变更指针时',
  指針固定: '指针固定',
  指針: '指针',
  いずれかの指針: '任一指针',

  // 其他状态
  全力値消費: '全力值消耗',
  好印象消費: '好印象消耗',
  やる気消費: '干劲消耗',
  好調消費: '好调消耗',
  集中消費: '集中消耗',
  熱意追加: '热意追加',
  全力になった時: '成为全力时',
  全力を解除後: '解除全力后',
  強気2段階目の場合: '强气2段时',
  強気2段階目: '强气2段',
  温存2段階目: '温存2段',
  のんびり: '悠闲',
  レッスン内: '演出中',
  強気になった時: '变为强气时',
  累積全力値: '累积全力值',
  増加した全力値: '增加的全力值',
  '累積全力値の100%分、パラメータ上昇量増加': '累积全力值的100%，数值上升量增加',
  '増加した全力値の100%分、パラメータ上昇量増加': '增加的全力值的100%，数值上升量增加',
  '増加した全力値の50%分、パラメータ上昇量増加': '增加的全力值的50%，数值上升量增加',
  全ての: '所有',
  全力値が: '全力值',
  好印象が: '好印象',
  集中が: '集中',
  やる気が: '干劲',
  元気が: '元气',
  '元気を0にして、減少前の元気の': '元气变为0，减少前元气的',
  '元気を半分にして、減少前の元気の': '元气减半，减少前元气的',
  元気を: '元气',
  好印象を: '好印象',
  全力値を: '全力值',
  好調を0にする: '好调变为0',
  '分、パラメータ上昇量増加': '，数值上升量增加',

  // 助词和其他（保留一些以便后续处理）
  のスキルカード: '技能卡',
  の間: '期间',
  の場合: '时',
  の: '',
  と: '和',
  を選択し: '选择',
  を引く: '抽取',
  を: '',
  に変更: '变更',
  に移動: '移至',
  に入る: '加入',
  に: '',
  が: '',
  で: '',
  は: '',
  も: '',
  から: '',
  より: '',
  '、': ' ',
  '。': '。',

  // 动作
  使用後: '使用后',
  使用時: '使用时',
  使用した: '使用了',
  使用: '使用',
  '追加+': '+',
  '増加+': '+',
  上昇させ: '上升',
  上昇: '上升',
  減少: '减少',
  削減: '削减',
  変更: '变更',
  消費: '消耗',
  回復: '回复',
  生成: '生成',
  適用: '适用',
  発動: '发动',
  移動: '移动',
  移至除外した時: '移至除外时',
  した時: '时',
  する事: '时',
  使って: '使用',
  なった時: '时',
  なった: '变为',
  なし: '无',

  // 效果类型
  直接効果で: '直接效果',
  直接効果: '直接效果',
  '［成長］': '[成长]',
  '成長：': '成长：',
  成長: '成长',
  固定: '固定',

  // 倍率和百分比
  '1.1倍': '1.1倍',
  '1.3倍': '1.3倍',
  '1.5倍': '1.5倍',
  '1.8倍': '1.8倍',
  '2倍': '2倍',
  '2.3倍': '2.3倍',
  '2.5倍': '2.5倍',
  '2.6倍': '2.6倍',
  '3倍': '3倍',
  '100%': '100%',
  '110%': '110%',
  '120%': '120%',
  '130%': '130%',
  '140%': '140%',
  '150%': '150%',
  '160%': '160%',
  '170%': '170%',
  '180%': '180%',
  '190%': '190%',
  '200%': '200%',
  '220%': '220%',
  '250%': '250%',
  '260%': '260%',
  '270%': '270%',
  '300%': '300%',
  '340%': '340%',
  '350%': '350%',
  '400%': '400%',
  '1100%': '1100%',
  分パラメータ上昇: '的数值',
  分: '',

  // 数字（具体的数字+单位组合，必须在单个助词之前）
  '1ターン': '1回合',
  '2ターン': '2回合',
  '3ターン': '3回合',
  '4ターン': '4回合',
  '5ターン': '5回合',
  '6ターン': '6回合',
  '7ターン': '7回合',
  '8ターン': '8回合',
  '12ターン': '12回合',
  '1回': '1次',
  '2回': '2次',
  '3回': '3次',
  '4回': '4次',
  '5回': '5次',
  '1枚': '1张',
  '2枚': '2张',
  '3枚': '3张',
  段階目: '段',
  '回（': '次（',
  '回）': '次）',
  '回、': '次，',
  回まで: '次为止',
  枚: '张',

  // 特殊符号
  '・': ' ', // 日文中点替换为空格
  '※': '',
  '＊': '',
  '（': '（',
  '）': '）',
};

// 效果类型图标映射
const effectIconMap = {
  体力: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/体力.png',
  元气: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/元气.png',
  好印象: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好印象.png',
  干劲: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/干劲.png',
  集中: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/集中.png',
  好调: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好调.png',
  状态绝佳: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/绝好调.png',
  全力值: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/全力值.png',
  强气: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/强气.png',
  温存: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/温存.png',
  数值: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/数值.png',
  消费体力减少: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/消费体力减少.png',
  消费体力削减: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/消费体力削减.png',
};

// 翻译文本
function translateText(text) {
  if (!text) return '';

  let translated = text;

  // 按照长度排序，先替换长的术语
  const sortedTerms = Object.entries(terminologyMap).sort((a, b) => b[0].length - a[0].length);

  for (const [japanese, chinese] of sortedTerms) {
    translated = translated.replace(new RegExp(japanese, 'g'), chinese);
  }

  // 后处理：修正常见的语序问题
  translated = translated
    // 修正"的的"连续
    .replace(/的的+/g, '的')
    // 修正"效果的技能卡的数值" -> "效果技能卡的数值"
    .replace(/效果的技能卡的/g, '效果技能卡的')
    // 修正"X次合" -> "X回合" (因为"ターン"替换时的问题)
    .replace(/(\d+)次合/g, '$1回合')
    // 修正"变更为X，Y" -> "X，变更为Y" 的语序问题（已通过预定义短语解决大部分）
    .replace(/变更为(下回合|本回合)，(\S+)/g, '$1，变更为$2')
    // 修正"値++" -> "值+"
    .replace(/値\+\+/g, '值+')
    // 修正"ー+" -> "值+"
    .replace(/ー\+/g, '值+')
    // 修正"ー" -> 移除（用作连接符时）
    .replace(/ー/g, '')
    // 修正"値+" -> "值+"
    .replace(/値\+/g, '值+')
    // 修正"数值增加值+X" -> "数值增加X"
    .replace(/数值增加值\+/g, '数值增加')
    // 修正"数值增加+X" -> "数值增加X"
    .replace(/数值增加\+/g, '数值增加')
    // 修正 "++" -> "+"
    .replace(/\+\+/g, '+')
    // 修正"使用了技能卡" -> "每使用1张技能卡"
    .replace(/演出中使用了技能卡/g, '演出中每使用1张技能卡')
    // 修正"1张每1张" -> "每1张"
    .replace(/1张每1张/g, '每1张')
    // 清理多余的空格
    .replace(/\s+/g, ' ')
    // 修正逗号
    .replace(/\s*，\s*/g, '，')
    .replace(/\s+，/g, '，')
    .replace(/，\s+/g, '，')
    // 去除行首行尾空格
    .trim();

  return translated;
}

// 解析单个效果文本为词条数组
function parseEffectText(effectText) {
  if (!effectText) return [];

  const entries = [];

  // 移除使用限制标记
  let cleanText = effectText.replace(/[※＊].*$/, '').trim();

  // 在翻译前先保护日语复合短语，避免被空格分割
  const protectedJPParts = [];
  const protectJPPatterns = [
    /温存に変更 以降、強気効果のスキルカード使用後、強気効果のスキルカードのパラメータ増加値\+\d+/,
    /以降3回まで、全力を解除後、非全力状態の場合、温存に変更/,
    /以降、ターン開始時、いずれかの指針の場合、全てのスキルカードのパラメータ値増加\+\d+/,
  ];

  protectJPPatterns.forEach((pattern, index) => {
    const match = cleanText.match(pattern);
    if (match) {
      const placeholder = `__JP_PROTECTED_${index}__`;
      protectedJPParts.push(match[0]);
      cleanText = cleanText.replace(match[0], placeholder);
    }
  });

  // 翻译文本
  cleanText = translateText(cleanText);

  // 按空格分割效果
  let parts = cleanText.split(/\s+/).filter(p => p.trim());

  // 恢复被保护的复合效果（现在是中文）
  parts = parts.map(part => {
    const match = part.match(/__JP_PROTECTED_(\d+)__/);
    if (match) {
      // 单独翻译这个被保护的部分
      return translateText(protectedJPParts[parseInt(match[1])]);
    }
    return part;
  });

  for (const part of parts) {
    if (!part) continue;

    let entry = {
      icon: '',
      effect: part,
      isConsumption: false,
    };

    // 检测消耗效果
    if (part.includes('体力消耗') || part.includes('消耗') || part.includes('体力-') || part.match(/^体力/)) {
      entry.isConsumption = true;
      entry.icon = effectIconMap['体力'];
    }
    // 检测元气
    else if (part.includes('元气')) {
      entry.icon = effectIconMap['元气'];
    }
    // 检测好印象
    else if (part.includes('好印象')) {
      entry.icon = effectIconMap['好印象'];
    }
    // 检测干劲
    else if (part.includes('干劲')) {
      entry.icon = effectIconMap['干劲'];
    }
    // 检测集中
    else if (part.includes('集中')) {
      entry.icon = effectIconMap['集中'];
    }
    // 检测好调
    else if (part.includes('好调') && !part.includes('状态绝佳')) {
      entry.icon = effectIconMap['好调'];
    }
    // 检测状态绝佳
    else if (part.includes('状态绝佳')) {
      entry.icon = effectIconMap['状态绝佳'];
    }
    // 检测全力值
    else if (part.includes('全力值')) {
      entry.icon = effectIconMap['全力值'];
    }
    // 检测强气
    else if (part.includes('强气')) {
      entry.icon = effectIconMap['强气'];
    }
    // 检测温存
    else if (part.includes('温存')) {
      entry.icon = effectIconMap['温存'];
    }
    // 检测数值
    else if (part.includes('数值')) {
      entry.icon = effectIconMap['数值'];
    }
    // 检测消费体力减少
    else if (part.includes('消费体力减少')) {
      entry.icon = effectIconMap['消费体力减少'];
    }
    // 检测消费体力削减
    else if (part.includes('消费体力削减')) {
      entry.icon = effectIconMap['消费体力削减'];
    }

    entries.push(entry);
  }

  return entries;
}

// 解析使用限制
function parseRestrictions(effectText) {
  const restrictions = {
    isDuplicatable: true,
    usesPerBattle: null,
  };

  if (!effectText) return restrictions;

  // 翻译文本
  const translated = translateText(effectText);

  // 检查"不可重复"
  if (translated.includes('不可重复')) {
    restrictions.isDuplicatable = false;
  }

  // 检查"演出中限1次"
  if (translated.includes('演出中1次')) {
    restrictions.usesPerBattle = 1;
  }

  return restrictions;
}

// 转换单张技能卡
function convertSkillCard(card) {
  const converted = {
    ...card,
    effectEntries: parseEffectText(card.effect_before),
    effectEntriesEnhanced: parseEffectText(card.effect_after),
    restrictions: parseRestrictions(card.effect_before),
    flavor: '', // 风味文本留空
  };

  return converted;
}

// 转换整个技能卡库
function convertSkillCardLibrary(library) {
  const converted = {};

  for (const [plan, rarities] of Object.entries(library)) {
    converted[plan] = {};

    for (const [rarity, cards] of Object.entries(rarities)) {
      converted[plan][rarity] = cards.map(convertSkillCard);
    }
  }

  return converted;
}

// 执行转换
console.log('开始转换技能卡库（含中文翻译）...');
const convertedLibrary = convertSkillCardLibrary(skillCardLibrary);

// 保存转换后的文件（替换原文件）
const outputPath = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json');

fs.writeFileSync(outputPath, JSON.stringify(convertedLibrary, null, 2), 'utf-8');

console.log(`转换完成！已保存到: ${outputPath}`);
console.log(
  `总共转换了 ${Object.values(convertedLibrary).flatMap(plan => Object.values(plan).flatMap(cards => cards)).length} 张技能卡`,
);

// 显示一些统计信息
const totalCards = Object.values(convertedLibrary).flatMap(plan => Object.values(plan).flatMap(cards => cards)).length;
const cardsWithRestrictions = Object.values(convertedLibrary)
  .flatMap(plan => Object.values(plan).flatMap(cards => cards))
  .filter(card => !card.restrictions.isDuplicatable || card.restrictions.usesPerBattle !== null).length;

console.log(`\n统计信息:`);
console.log(`- 总卡牌数: ${totalCards}`);
console.log(`- 有使用限制的卡牌: ${cardsWithRestrictions}`);
