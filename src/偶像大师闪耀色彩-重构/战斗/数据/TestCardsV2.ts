/**
 * 测试用技能卡 V2
 * 用于验证新战斗系统引擎
 */

import type { SkillCardV2 } from '../类型/v2-types';

/**
 * 测试卡 1：基础得分卡
 * 简单的固定数值得分
 */
export const TEST_CARD_BASIC_SCORE: SkillCardV2 = {
  id: 'test_basic_score',
  rarity: 'R',
  type: 'A',
  plan: 'sense',
  display: {
    name: '基础表现',
    nameJP: 'アピール',
    description: '获得 15 点分数',
  },
  visual_hint: null,
  engine_data: {
    cost: { genki: 2 },
    card_type: 'ACTIVE',
    logic_chain: [
      {
        do: [{ action: 'GAIN_SCORE', value: 15 }],
      },
    ],
  },
};

/**
 * 测试卡 2：条件得分卡
 * 体力越高分越多（体力 × 1.5）
 */
export const TEST_CARD_GENKI_SCALING: SkillCardV2 = {
  id: 'test_genki_scaling',
  rarity: 'SR',
  type: 'A',
  plan: 'logic',
  display: {
    name: '全力的掌声',
    nameJP: '全力の拍手',
    description: '根据当前体力获得分数（基础10 + 体力×1.5）',
  },
  visual_hint: null,
  engine_data: {
    cost: { genki: 3 },
    card_type: 'ACTIVE',
    logic_chain: [
      {
        do: [
          {
            action: 'GAIN_SCORE',
            value_expression: {
              '+': [10, { '*': [{ var: 'player.genki' }, 1.5] }],
            },
          },
        ],
      },
    ],
  },
};

/**
 * 测试卡 3：Buff 卡
 * 添加好调 3 回合 + 集中 5 层
 */
export const TEST_CARD_BUFF: SkillCardV2 = {
  id: 'test_buff',
  rarity: 'SR',
  type: 'M',
  plan: 'sense',
  display: {
    name: '状态调整',
    nameJP: 'コンディション調整',
    description: '好调 3 回合，集中 +5',
  },
  visual_hint: null,
  engine_data: {
    cost: { genki: 4 },
    card_type: 'MENTAL',
    logic_chain: [
      {
        do: [
          { action: 'ADD_BUFF', buff_id: 'GoodCondition', turns: 3 },
          { action: 'ADD_BUFF', buff_id: 'Concentration', value: 5 },
        ],
      },
    ],
  },
};

/**
 * 测试卡 4：条件分支卡（AI 风格）
 * 午夜忧郁：体力<30% 或有焦虑标签时，分数×3
 */
export const TEST_CARD_MIDNIGHT: SkillCardV2 = {
  id: 'test_midnight_melancholy',
  rarity: 'SSR',
  type: 'A',
  plan: 'sense',
  display: {
    name: '午夜忧郁',
    nameJP: 'ミッドナイト・メランコリー',
    description: '基础分 30。体力低于 30% 或处于焦虑状态时，分数翻 3 倍。附带焦虑状态 2 回合。',
    flavor: '夜色越深，越能听见心跳。',
  },
  visual_hint: {
    key: 'Anxiety',
    kind: 'tag',
    symbol: '焦',
    color: '#7A5CFF',
    isDebuff: true,
    shortName: '焦虑',
    description: '一种负面情绪标记，可被其他技能引用。',
  },
  engine_data: {
    cost: { genki: 5 },
    card_type: 'ACTIVE',
    logic_chain: [
      {
        do: [
          {
            action: 'GAIN_SCORE',
            value: 30,
            multiplier_expression: {
              if: [
                {
                  or: [{ '<': [{ var: 'player.genki_percent' }, 30] }, { in: ['Anxiety', { var: 'player.tags' }] }],
                },
                3.0,
                1.0,
              ],
            },
            tags: ['emo_style', 'burst'],
          },
          {
            action: 'ADD_TAG',
            tag: 'Anxiety',
            turns: 2,
          },
        ],
      },
    ],
    logic_chain_enhanced: [
      {
        do: [
          {
            action: 'GAIN_SCORE',
            value: 40,
            multiplier_expression: {
              if: [
                {
                  or: [{ '<': [{ var: 'player.genki_percent' }, 35] }, { in: ['Anxiety', { var: 'player.tags' }] }],
                },
                3.5,
                1.0,
              ],
            },
            tags: ['emo_style', 'burst'],
          },
          {
            action: 'ADD_TAG',
            tag: 'Anxiety',
            turns: 3,
          },
        ],
      },
    ],
  },
  restrictions: {
    isDuplicatable: true,
    usesPerBattle: undefined,
  },
  flowRefs: ['emo_style'],
  mechanicRefs: ['Anxiety'],
  isAIGenerated: true,
};

/**
 * 测试卡 5：Hook 注册卡
 * 时光倒流：接下来 3 回合，打卡后 50% 概率返还
 */
export const TEST_CARD_TIME_REWIND: SkillCardV2 = {
  id: 'test_time_rewind',
  rarity: 'SSR',
  type: 'M',
  plan: 'anomaly',
  display: {
    name: '时光倒流',
    nameJP: '時の巻き戻し',
    description: '接下来 3 回合，打出技能后有 50% 概率额外抽 1 张牌。',
    flavor: '如果能重来一次——我会更勇敢吗？',
  },
  visual_hint: {
    key: 'TimeRewind',
    kind: 'buff',
    symbol: '返',
    color: '#4ED6FF',
    isDebuff: false,
    shortName: '时光倒流',
    description: '打出卡牌后有概率触发额外抽牌。',
  },
  engine_data: {
    cost: { genki: 3 },
    card_type: 'MENTAL',
    logic_chain: [
      {
        do: [
          {
            action: 'REGISTER_HOOK',
            hook: {
              id: 'time_rewind_hook',
              name: '时光倒流',
              trigger: 'ON_AFTER_CARD_PLAY',
              duration_turns: 3,
              condition: {
                '<': [{ var: 'rng' }, 0.5],
              },
              do: [{ action: 'DRAW_CARD', count: 1 }],
            },
          },
          {
            action: 'ADD_TAG',
            tag: 'TimeRewind',
            turns: 3,
          },
        ],
      },
    ],
  },
  restrictions: {
    isDuplicatable: false,
    usesPerBattle: 1,
  },
  isAIGenerated: true,
};

/**
 * 所有测试卡列表
 */
export const TEST_CARDS_V2: SkillCardV2[] = [
  TEST_CARD_BASIC_SCORE,
  TEST_CARD_GENKI_SCALING,
  TEST_CARD_BUFF,
  TEST_CARD_MIDNIGHT,
  TEST_CARD_TIME_REWIND,
];
