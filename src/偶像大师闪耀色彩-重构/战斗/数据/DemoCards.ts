/**
 * Demo 测试卡牌
 * 用于验证战斗系统核心逻辑
 */

import type { SkillCard } from '../类型';

/**
 * 创建Demo卡牌列表
 * 包含感性、理性、非凡三种培育计划的代表性卡牌
 */
export function createDemoCards(): SkillCard[] {
  return [
    // ==================== 感性系统卡牌 ====================

    // R卡：简单得分
    {
      id: 'sense_r_1',
      name: '表現の基本',
      nameJP: '表現の基本',
      rarity: 'R',
      type: 'A',
      cost: -2,
      costType: 'normal',
      effects: [{ type: 'ADD_SCORE', value: 8 }],
      isEnhanced: false,
      isUnique: false,
      usedThisBattle: 0,
      description: '得分+8',
    },

    // R卡：获得集中
    {
      id: 'sense_r_2',
      name: '気持ちの準備',
      nameJP: '気持ちの準備',
      rarity: 'R',
      type: 'M',
      cost: -3,
      costType: 'normal',
      effects: [{ type: 'ADD_CONCENTRATION', value: 3 }],
      isEnhanced: false,
      isUnique: false,
      usedThisBattle: 0,
      description: '集中+3',
    },

    // SR卡：好调
    {
      id: 'sense_sr_1',
      name: 'ポジティブシンキング',
      nameJP: 'ポジティブシンキング',
      rarity: 'SR',
      type: 'M',
      cost: -4,
      costType: 'normal',
      effects: [{ type: 'ADD_BUFF', target: 'GOOD_CONDITION', duration: 3 }],
      isEnhanced: false,
      isUnique: false,
      usedThisBattle: 0,
      description: '好调+3回合',
    },

    // SSR卡：复合效果
    {
      id: 'sense_ssr_1',
      name: '国民的偶像',
      nameJP: '国民的偶像',
      rarity: 'SSR',
      type: 'A',
      cost: -1,
      costType: 'normal',
      effects: [
        { type: 'CONSUME_BUFF', target: 'GOOD_CONDITION', value: 1 },
        { type: 'DOUBLE_NEXT_CARD' },
        { type: 'EXTRA_CARD_USE', value: 1 },
      ],
      isEnhanced: false,
      isUnique: true,
      limitPerBattle: 1,
      usedThisBattle: 0,
      description: '消耗好调1回合，下一张卡效果翻倍，技能卡使用数+1',
    },

    // ==================== 理性系统卡牌 ====================

    // R卡：获得元气
    {
      id: 'logic_r_1',
      name: '深呼吸',
      nameJP: '深呼吸',
      rarity: 'R',
      type: 'M',
      cost: -2,
      costType: 'normal',
      effects: [{ type: 'ADD_GENKI', value: 5 }],
      isEnhanced: false,
      isUnique: false,
      usedThisBattle: 0,
      description: '元气+5',
    },

    // R卡：获得干劲
    {
      id: 'logic_r_2',
      name: 'やる気アップ',
      nameJP: 'やる気アップ',
      rarity: 'R',
      type: 'M',
      cost: -3,
      costType: 'normal',
      effects: [{ type: 'ADD_MOTIVATION', value: 3 }],
      isEnhanced: false,
      isUnique: false,
      usedThisBattle: 0,
      description: '干劲+3',
    },

    // SR卡：好印象
    {
      id: 'logic_sr_1',
      name: '幸せな時間',
      nameJP: '幸せな時間',
      rarity: 'SR',
      type: 'M',
      cost: -5,
      costType: 'normal',
      effects: [{ type: 'ADD_GOOD_IMPRESSION', value: 6 }],
      isEnhanced: false,
      isUnique: false,
      usedThisBattle: 0,
      description: '好印象+6',
    },

    // SSR卡：消耗干劲得分
    {
      id: 'logic_ssr_1',
      name: 'みんな大好き',
      nameJP: 'みんな大好き',
      rarity: 'SSR',
      type: 'A',
      cost: 0,
      costType: 'normal',
      effects: [
        { type: 'CONSUME_MOTIVATION', value: 3 },
        { type: 'ADD_SCORE_PERCENT', value: 90 }, // 好印象90%转得分
        { type: 'EXTRA_CARD_USE', value: 1 },
      ],
      isEnhanced: false,
      isUnique: true,
      usedThisBattle: 0,
      description: '消耗干劲3，好印象90%转得分，技能卡使用数+1',
    },

    // ==================== 非凡系统卡牌 ====================

    // R卡：增加全力值
    {
      id: 'anomaly_r_1',
      name: '一歩',
      nameJP: '一歩',
      rarity: 'R',
      type: 'A',
      cost: -4,
      costType: 'normal',
      effects: [{ type: 'ADD_SCORE', value: 15 }],
      isEnhanced: false,
      isUnique: false,
      usedThisBattle: 0,
      description: '得分+15',
    },

    // SR卡：全力值
    {
      id: 'anomaly_sr_1',
      name: 'トレーニングの成果',
      nameJP: 'トレーニングの成果',
      rarity: 'SR',
      type: 'A',
      cost: -5,
      costType: 'normal',
      effects: [{ type: 'ADD_ALL_POWER', value: 3 }, { type: 'ADD_SCORE', value: 9 }, { type: 'SWITCH_TO_CONSERVE' }],
      isEnhanced: false,
      isUnique: false,
      limitPerBattle: 1,
      usedThisBattle: 0,
      description: '全力值+3，得分+9，下回合切换至温存状态',
    },

    // ==================== 通用卡牌 ====================

    // R卡：回复体力
    {
      id: 'common_r_1',
      name: '小休憩',
      nameJP: '小休憩',
      rarity: 'R',
      type: 'M',
      cost: 0,
      costType: 'normal',
      effects: [{ type: 'ADD_STAMINA', value: 3 }],
      isEnhanced: false,
      isUnique: false,
      usedThisBattle: 0,
      description: '体力+3',
    },

    // SR卡：体力消耗减少（明确消耗体力的效果示例）
    {
      id: 'common_sr_1',
      name: '気合い入れ',
      nameJP: '気合い入れ',
      rarity: 'SR',
      type: 'M',
      cost: 0,
      costType: 'stamina_only', // ⚠️ 红色图标：必须消耗体力
      effects: [
        { type: 'CONSUME_STAMINA', value: 4, isConsumption: true },
        { type: 'ADD_BUFF', target: 'STAMINA_REDUCTION', value: 2, duration: 3 },
        { type: 'ADD_GENKI', value: 8 },
      ],
      isEnhanced: false,
      isUnique: false,
      usedThisBattle: 0,
      description: '消耗体力4，体力消耗减少+2层（3回合），元气+8',
    },

    // 陷阱卡
    {
      id: 'trap_n_1',
      name: '眠気',
      nameJP: '眠気',
      rarity: 'N',
      type: 'T',
      cost: -2,
      costType: 'normal',
      effects: [{ type: 'ADD_BUFF', target: 'BAD_CONDITION', duration: 2 }],
      isEnhanced: false,
      isUnique: false,
      usedThisBattle: 0,
      description: '不调+2回合',
    },
  ];
}

/**
 * 创建简化的Demo牌组（用于快速测试）
 */
export function createSimpleDemoDeck(): SkillCard[] {
  const cards = createDemoCards();
  // 返回部分卡牌，每种2张
  const selectedIds = ['sense_r_1', 'sense_r_2', 'sense_sr_1', 'logic_r_1', 'logic_sr_1', 'common_r_1'];

  const deck: SkillCard[] = [];
  for (const id of selectedIds) {
    const card = cards.find(c => c.id === id);
    if (card) {
      // 每张加入2份
      deck.push({ ...card, id: `${card.id}_1` });
      deck.push({ ...card, id: `${card.id}_2` });
    }
  }

  return deck;
}
