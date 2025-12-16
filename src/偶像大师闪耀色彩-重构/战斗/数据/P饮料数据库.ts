/**
 * P饮料数据库
 * 来源: 闪耀色彩卡牌机制说明
 */

import type { PDrink, PDrinkRarity, PDrinkType } from '../类型/P饮料类型';

/**
 * P饮料完整列表
 */
export const P_DRINK_DATABASE: PDrink[] = [
  // ========== 通用饮料 ==========
  {
    id: 'common_001',
    nameJP: '初星水',
    nameCN: '初星水',
    type: '通用',
    rarity: '普通',
    effect: '得分+10',
  },
  {
    id: 'common_002',
    nameJP: '烏龍茶',
    nameCN: '乌龙茶',
    type: '通用',
    rarity: '普通',
    effect: '元气+7',
  },
  {
    id: 'common_003',
    nameJP: 'ミックススムージー',
    nameCN: '混合思慕雪',
    type: '通用',
    rarity: '高级',
    effect: '将所有手牌置入弃牌堆，重新抽取等同于原手牌数的技能卡，回复2点体力',
  },
  {
    id: 'common_004',
    nameJP: 'リカバリドリンク',
    nameCN: '回复饮料',
    type: '通用',
    rarity: '普通',
    effect: '回复6点体力',
  },
  {
    id: 'common_005',
    nameJP: 'フレッシュビネガー',
    nameCN: '新鲜西洋醋',
    type: '通用',
    rarity: '高级',
    effect: '将所有手牌进行"训练中强化"，回复3点体力',
  },
  {
    id: 'common_006',
    nameJP: 'ブーストエキス',
    nameCN: '增幅浓缩',
    type: '通用',
    rarity: '高级',
    effect: '得分增加30%（持续3回合），"消费体力减少"层数+3，体力消费2点',
  },
  {
    id: 'common_007',
    nameJP: 'パワフル漢方ドリンク',
    nameCN: '强力草药饮料',
    type: '通用',
    rarity: '高级',
    effect: '将牌堆或弃牌堆中的一张偶像固有技能卡移动到手牌，"体力消耗减少"层数+3',
  },
  {
    id: 'common_008',
    nameJP: '初星ホエイプロテイン',
    nameCN: '初星乳清蛋白',
    type: '通用',
    rarity: '高级',
    effect: '"技能卡使用数追加"+1',
  },
  {
    id: 'common_009',
    nameJP: '初星スペシャル青汁',
    nameCN: '初星特制青汁',
    type: '通用',
    rarity: '特级',
    effect: '在手牌中随机"生成"一张已强化的SSR稀有度技能卡',
  },
  {
    id: 'common_010',
    nameJP: '特製ハツボシエキス',
    nameCN: '特制初星浓缩',
    type: '通用',
    rarity: '特级',
    effect: '下次使用的A类技能卡额外发动一次效果（1次·1回合），体力消费2点，"消费体力增加"层数+1',
  },

  // ========== 感性专属饮料 ==========
  {
    id: 'sense_001',
    nameJP: 'ビタミンドリンク',
    nameCN: '维生素饮料',
    type: '感性专属',
    rarity: '普通',
    effect: '"好调"层数+3',
    exclusivePlan: '感性',
  },
  {
    id: 'sense_002',
    nameJP: 'アイスコーヒー',
    nameCN: '冰咖啡',
    type: '感性专属',
    rarity: '普通',
    effect: '"集中"层数+3',
    exclusivePlan: '感性',
  },
  {
    id: 'sense_003',
    nameJP: 'スタミナ爆発ドリンク',
    nameCN: '能量爆发饮料',
    type: '感性专属',
    rarity: '高级',
    effect: '"绝好调"层数+1，元气+9',
    exclusivePlan: '感性',
  },
  {
    id: 'sense_004',
    nameJP: '厳選初星マキアート',
    nameCN: '严选初星玛奇朵',
    type: '感性专属',
    rarity: '特级',
    effect: '使用后，每个出牌回合结束时，"集中"层数+1',
    exclusivePlan: '感性',
  },
  {
    id: 'sense_005',
    nameJP: '初星ブーストエナジー',
    nameCN: '初星增幅能量饮料',
    type: '感性专属',
    rarity: '特级',
    effect: '"绝好调"层数+2，将所有手牌进行"训练中强化"',
    exclusivePlan: '感性',
  },

  // ========== 理性专属饮料 ==========
  {
    id: 'logic_001',
    nameJP: 'ルイボスティー',
    nameCN: '路易波士茶',
    type: '理性专属',
    rarity: '普通',
    effect: '"好印象"层数+3',
    exclusivePlan: '理性',
  },
  {
    id: 'logic_002',
    nameJP: 'ホットコーヒー',
    nameCN: '热咖啡',
    type: '理性专属',
    rarity: '普通',
    effect: '"有干劲"层数+3',
    exclusivePlan: '理性',
  },
  {
    id: 'logic_003',
    nameJP: 'おしゃれハーブティー',
    nameCN: '时尚花草茶',
    type: '理性专属',
    rarity: '高级',
    effect: '提供"好印象"层数×100%的得分，元气+3',
    exclusivePlan: '理性',
  },
  {
    id: 'logic_004',
    nameJP: '厳選初星ティー',
    nameCN: '严选初星茶',
    type: '理性专属',
    rarity: '特级',
    effect: '使用后，每个出牌回合结束时，"好印象"层数+1',
    exclusivePlan: '理性',
  },
  {
    id: 'logic_005',
    nameJP: '厳選初星ブレンド',
    nameCN: '严选初星混合咖啡',
    type: '理性专属',
    rarity: '特级',
    effect: '使用后，每个出牌回合结束时，"有干劲"层数+1',
    exclusivePlan: '理性',
  },

  // ========== 非凡专属饮料 ==========
  {
    id: 'anomaly_001',
    nameJP: 'ジンジャーエール',
    nameCN: '姜汁汽水',
    type: '非凡专属',
    rarity: '普通',
    effect: '强气转化，全力值+1',
    exclusivePlan: '非凡',
  },
  {
    id: 'anomaly_002',
    nameJP: 'ほうじ茶',
    nameCN: '焙茶',
    type: '非凡专属',
    rarity: '普通',
    effect: '温存转化，全力值+2',
    exclusivePlan: '非凡',
  },
  {
    id: 'anomaly_003',
    nameJP: 'ほっと緑茶',
    nameCN: '暖心的绿茶',
    type: '非凡专属',
    rarity: '高级',
    effect: '从牌堆或弃牌堆中选择一张技能卡，将其移动至温存卡堆中，指针转化为温存二阶段',
    exclusivePlan: '非凡',
  },
  {
    id: 'anomaly_004',
    nameJP: '初星スーパーソーダ',
    nameCN: '初星超级苏打水',
    type: '非凡专属',
    rarity: '特级',
    effect: '指针转化为强气二阶段，"体力消耗减少"层数+1',
    exclusivePlan: '非凡',
  },
  {
    id: 'anomaly_005',
    nameJP: '厳選初星チャイ',
    nameCN: '初星精选奶茶',
    type: '非凡专属',
    rarity: '特级',
    effect: '以后，回合开始时全力值+1',
    exclusivePlan: '非凡',
  },
  {
    id: 'anomaly_006',
    nameJP: '初星湯',
    nameCN: '初星汤',
    type: '非凡专属',
    rarity: '特级',
    effect: '"回合数追加"层数+1，体力消费2点，"消费体力增加"层数+1',
    exclusivePlan: '非凡',
  },
];

/**
 * 按类型分类的P饮料
 */
export const P_DRINKS_BY_TYPE: Record<PDrinkType, PDrink[]> = {
  通用: P_DRINK_DATABASE.filter(d => d.type === '通用'),
  感性专属: P_DRINK_DATABASE.filter(d => d.type === '感性专属'),
  理性专属: P_DRINK_DATABASE.filter(d => d.type === '理性专属'),
  非凡专属: P_DRINK_DATABASE.filter(d => d.type === '非凡专属'),
};

/**
 * 按稀有度分类的P饮料
 */
export const P_DRINKS_BY_RARITY: Record<PDrinkRarity, PDrink[]> = {
  普通: P_DRINK_DATABASE.filter(d => d.rarity === '普通'),
  高级: P_DRINK_DATABASE.filter(d => d.rarity === '高级'),
  特级: P_DRINK_DATABASE.filter(d => d.rarity === '特级'),
};

/**
 * P饮料统计信息
 */
export const P_DRINK_STATS = {
  total: P_DRINK_DATABASE.length,
  byType: {
    通用: P_DRINKS_BY_TYPE['通用'].length,
    感性专属: P_DRINKS_BY_TYPE['感性专属'].length,
    理性专属: P_DRINKS_BY_TYPE['理性专属'].length,
    非凡专属: P_DRINKS_BY_TYPE['非凡专属'].length,
  },
  byRarity: {
    普通: P_DRINKS_BY_RARITY['普通'].length,
    高级: P_DRINKS_BY_RARITY['高级'].length,
    特级: P_DRINKS_BY_RARITY['特级'].length,
  },
};

// 打印统计信息到控制台
console.log('🍹 P饮料数据库加载完成:');
console.log(`  - 总数: ${P_DRINK_STATS.total}`);
console.log(
  `  - 按类型: 通用=${P_DRINK_STATS.byType['通用']}, 感性=${P_DRINK_STATS.byType['感性专属']}, 理性=${P_DRINK_STATS.byType['理性专属']}, 非凡=${P_DRINK_STATS.byType['非凡专属']}`,
);
console.log(
  `  - 按稀有度: 普通=${P_DRINK_STATS.byRarity['普通']}, 高级=${P_DRINK_STATS.byRarity['高级']}, 特级=${P_DRINK_STATS.byRarity['特级']}`,
);
