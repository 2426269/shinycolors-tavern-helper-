/**
 * 添加 9 张 UR 卡到技能卡库.json
 * 注意：UR 卡不可强化，没有 effect_after 和 effectEntriesEnhanced
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json');

// 读取现有 JSON
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

// 非凡 UR 卡 (3张)
const anomalyUR = [
  {
    id: 'UR_anomaly_1',
    name: 'レジェンドスター / 传奇之星',
    rarity: 'UR',
    type: '精神',
    effect_before:
      '技能卡使用数+1；额外抽取两张技能卡；若已进入温存状态两次以上，回合数+1；若已进入强气状态两次以上，回合数+1；若已进入全力状态两次以上，回合数+1；此后，剩余回合不大于3时，进入全力状态时，打分值+120%（1回合），最多3次。 ※训练中限1次 重复不可',
    cost: '6',
    effectEntries: [
      { icon: '', effect: '技能卡使用数+1', isConsumption: false },
      { icon: '', effect: '额外抽取2张技能卡', isConsumption: false },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/温存.png',
        effect: '若已进入温存状态两次以上，回合数+1',
        isConsumption: false,
      },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/强气.png',
        effect: '若已进入强气状态两次以上，回合数+1',
        isConsumption: false,
      },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/全力值.png',
        effect: '若已进入全力状态两次以上，回合数+1',
        isConsumption: false,
      },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/数值.png',
        effect: '此后，剩余回合不大于3时，进入全力状态时，打分值+120%（1回合），最多3次',
        isConsumption: false,
      },
    ],
    restrictions: { isDuplicatable: false, usesPerBattle: 1 },
    flavor: '',
  },
  {
    id: 'UR_anomaly_2',
    name: 'エキスパート / 专家',
    rarity: 'UR',
    type: '精神',
    effect_before:
      '仅在状态切换4次以上时可使用；将保留区的技能卡不消耗体力地打出一次；技能卡使用数+1；下一回合，切换至温存状态。移动至手牌时，选择抽牌堆或弃牌堆中的技能卡，移动至保留区（1回合内限1次）。 ※重复不可',
    cost: '2',
    effectEntries: [
      { icon: '', effect: '仅在状态切换4次以上时可使用', isConsumption: false },
      { icon: '', effect: '将保留区的技能卡不消耗体力地打出一次', isConsumption: false },
      { icon: '', effect: '技能卡使用数+1', isConsumption: false },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/温存.png',
        effect: '下一回合，切换至温存状态',
        isConsumption: false,
      },
      {
        icon: '',
        effect: '移动至手牌时，选择抽牌堆或弃牌堆中的技能卡，移动至保留区（1回合内限1次）',
        isConsumption: false,
      },
    ],
    restrictions: { isDuplicatable: false, usesPerBattle: null },
    flavor: '',
  },
  {
    id: 'UR_anomaly_3',
    name: 'スーパーノヴァ / 超新星',
    rarity: 'UR',
    type: '主动',
    effect_before:
      '仅在强气2阶段下，可使用；打分值+1；成长：回合开始时，自身的打分值+20，打分次数+1，体力消耗值+1。移动至手牌时，额外抽取1张技能卡（1回合内限1次）。 ※训练中限1次 重复不可',
    cost: '1',
    effectEntries: [
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/强气.png',
        effect: '仅在强气2阶段下，可使用',
        isConsumption: false,
      },
      { icon: 'https://283pro.site/shinycolors/游戏图标/数值.png', effect: '打分值+1', isConsumption: false },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/数值.png',
        effect: '[成长] 回合开始时，自身的打分值+20，打分次数+1，体力消耗值+1',
        isConsumption: false,
      },
      { icon: '', effect: '移动至手牌时，额外抽取1张技能卡（1回合内限1次）', isConsumption: false },
    ],
    restrictions: { isDuplicatable: false, usesPerBattle: 1 },
    flavor: '',
  },
];

// 理性 UR 卡 (3张)
const logicUR = [
  {
    id: 'UR_logic_1',
    name: '最強パフォーマー / 最强表演者',
    rarity: 'UR',
    type: '精神',
    effect_before:
      '仅在干劲不小于9时，可使用；技能卡使用数+1；干劲+5；此后，使用技能卡消耗体力时，精力+4（干劲效果2倍计算）。 ※训练中限1次 重复不可',
    cost: '6',
    effectEntries: [
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/干劲.png',
        effect: '仅在干劲不小于9时，可使用',
        isConsumption: false,
      },
      { icon: '', effect: '技能卡使用数+1', isConsumption: false },
      { icon: 'https://283pro.site/shinycolors/游戏图标/干劲.png', effect: '干劲+5', isConsumption: false },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/元气.png',
        effect: '此后，使用技能卡消耗体力时，精力+4（干劲效果2倍计算）',
        isConsumption: false,
      },
    ],
    restrictions: { isDuplicatable: false, usesPerBattle: 1 },
    flavor: '',
  },
  {
    id: 'UR_logic_2',
    name: '究極スマイル / 究极笑容',
    rarity: 'UR',
    type: '主动',
    effect_before:
      '仅在好印象不小于6时，可使用；好印象强化+100%；所有技能卡的好印象值+5；技能卡使用数+1。 ※训练中限1次 重复不可',
    cost: '5',
    effectEntries: [
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/好印象.png',
        effect: '仅在好印象不小于6时，可使用',
        isConsumption: false,
      },
      { icon: 'https://283pro.site/shinycolors/游戏图标/好印象.png', effect: '好印象强化+100%', isConsumption: false },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/好印象.png',
        effect: '所有技能卡的好印象值+5',
        isConsumption: false,
      },
      { icon: '', effect: '技能卡使用数+1', isConsumption: false },
    ],
    restrictions: { isDuplicatable: false, usesPerBattle: 1 },
    flavor: '',
  },
  {
    id: 'UR_logic_3',
    name: 'エクセレント♪ / 太棒了♪',
    rarity: 'UR',
    type: '精神',
    effect_before:
      '技能卡使用数+1；此后，回合开始时，手牌中的R技能卡在1张以上时，随机将手牌中的两张R技能卡不消耗体力打出。 ※训练中限1次 重复不可',
    cost: '5',
    effectEntries: [
      { icon: '', effect: '技能卡使用数+1', isConsumption: false },
      {
        icon: '',
        effect: '此后，回合开始时，手牌中的R技能卡在1张以上时，随机将手牌中的两张R技能卡不消耗体力打出',
        isConsumption: false,
      },
    ],
    restrictions: { isDuplicatable: false, usesPerBattle: 1 },
    flavor: '',
  },
];

// 感性 UR 卡 (3张)
const senseUR = [
  {
    id: 'UR_sense_1',
    name: '王者の風格 / 王者风范',
    rarity: 'UR',
    type: '精神',
    effect_before:
      '好调+3回合；集中+3；技能卡使用数+1；此后，跳过回合时，若处于好调状态下，下一回合打分值+110%（1回合），技能卡使用数+1，额外抽取2张技能卡；2回合后，不可使用技能卡（1回合）。 ※训练中限1次 重复不可',
    cost: '4',
    effectEntries: [
      { icon: 'https://283pro.site/shinycolors/游戏图标/好调.png', effect: '好调+3回合', isConsumption: false },
      { icon: 'https://283pro.site/shinycolors/游戏图标/集中.png', effect: '集中+3', isConsumption: false },
      { icon: '', effect: '技能卡使用数+1', isConsumption: false },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/好调.png',
        effect: '此后，跳过回合时，若处于绝好调状态下，下一回合打分值+110%，技能卡使用数+1，额外抽取2张技能卡',
        isConsumption: false,
      },
      { icon: '', effect: '2回合后，不可使用技能卡（1回合）', isConsumption: true },
    ],
    restrictions: { isDuplicatable: false, usesPerBattle: 1 },
    flavor: '',
  },
  {
    id: 'UR_sense_2',
    name: '完全無欠 / 完美无缺',
    rarity: 'UR',
    type: '精神',
    effect_before:
      '训练开始时加入手牌；好调增加回合数+25%；集中增加量+25%；技能卡使用数+1；额外抽取2张技能卡。 ※训练中限1次 重复不可',
    cost: '6',
    effectEntries: [
      { icon: '', effect: '训练开始时加入手牌', isConsumption: false },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/好调.png',
        effect: '好调增加回合数+25%',
        isConsumption: false,
      },
      { icon: 'https://283pro.site/shinycolors/游戏图标/集中.png', effect: '集中增加量+25%', isConsumption: false },
      { icon: '', effect: '技能卡使用数+1', isConsumption: false },
      { icon: '', effect: '额外抽取2张技能卡', isConsumption: false },
    ],
    restrictions: { isDuplicatable: false, usesPerBattle: 1 },
    flavor: '',
  },
  {
    id: 'UR_sense_3',
    name: '最高傑作 / 巅峰之作',
    rarity: 'UR',
    type: '主动',
    effect_before:
      '消耗5干劲；消耗5回合好调；打分值+4（集中增益3倍计算）；抽牌堆或弃牌堆中的技能卡总数在9张以上时：此后3回合内，回合开始时，好调+2回合，集中+2，额外抽取2张技能卡，技能卡使用数+1。 ※重复不可',
    cost: '0',
    effectEntries: [
      { icon: 'https://283pro.site/shinycolors/游戏图标/干劲.png', effect: '消耗5干劲', isConsumption: true },
      { icon: 'https://283pro.site/shinycolors/游戏图标/好调.png', effect: '消耗5回合好调', isConsumption: true },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/数值.png',
        effect: '打分值+4（集中增益3倍计算）',
        isConsumption: false,
      },
      {
        icon: '',
        effect:
          '抽牌堆或弃牌堆中的技能卡总数在9张以上时：此后3回合内，回合开始时，好调+2回合，集中+2，额外抽取2张技能卡，技能卡使用数+1',
        isConsumption: false,
      },
    ],
    restrictions: { isDuplicatable: false, usesPerBattle: null },
    flavor: '',
  },
];

// 添加 UR 数组到各计划
data['非凡']['UR'] = anomalyUR;
data['理性']['UR'] = logicUR;
data['感性']['UR'] = senseUR;

// 重新排序，确保 UR 在 SSR 之前
function reorderPlan(plan) {
  const ur = plan['UR'];
  delete plan['UR'];
  return { UR: ur, ...plan };
}

data['非凡'] = reorderPlan(data['非凡']);
data['理性'] = reorderPlan(data['理性']);
data['感性'] = reorderPlan(data['感性']);

// 写入文件
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

console.log('✅ 成功添加 9 张 UR 卡到技能卡库.json');
console.log('  - 非凡: 3 张');
console.log('  - 理性: 3 张');
console.log('  - 感性: 3 张');
