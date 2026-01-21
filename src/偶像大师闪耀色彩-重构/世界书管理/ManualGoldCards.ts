/**
 * Manual Gold Cards
 * 真实游戏 UR 级 manual_gold 样本（完整 engine_data）
 * 这些卡是学园偶像大师的真实 UR 技能卡，作为 AI 学习的权威示例
 *
 * 来源：E:\偶像大师\项目进度记录\战斗系统\新卡.txt
 */

import type { SkillCardV2WithConfidence } from './LegacyToV2Adapter';

/**
 * Manual Gold 样本卡库
 * 共 9 张 UR 卡（感性×3、理性×3、非凡×3）
 * 每张卡都有完整的 engine_data 和原始 effectEntries
 */
export const MANUAL_GOLD_CARDS: SkillCardV2WithConfidence[] = [
  // ==================== 非凡 (Anomaly) - 3张 ====================

  // UR_anomaly_1: レジェンドスター / 传奇之星
  {
    example_confidence: 'manual_gold',
    id: 'UR_anomaly_1',
    rarity: 'UR',
    type: 'M',
    plan: 'anomaly',

    // F3.2: 展示层词条数组
    effectEntries: [
      { icon: 'https://283pro.site/shinycolors/游戏图标/使用次数.png', effect: '技能卡使用数+1', isConsumption: false },
      { icon: 'https://283pro.site/shinycolors/游戏图标/抽卡.png', effect: '额外抽取两张技能卡', isConsumption: false },
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
        icon: 'https://283pro.site/shinycolors/游戏图标/全力.png',
        effect: '若已进入全力状态两次以上，回合数+1',
        isConsumption: false,
      },
      {
        icon: 'https://283pro.site/shinycolors/游戏图标/数值.png',
        effect: '此后，剩余回合不大于3时，进入全力状态时，打分值+120%（1回合），最多3次',
        isConsumption: false,
      },
    ],

    engine_data: {
      cost: { genki: 6 },
      logic_chain: [
        {
          // 基础效果
          do: [
            { action: 'MODIFY_PLAY_LIMIT', value: 1 },
            { action: 'DRAW_CARD', count: 2 },
          ],
        },
        {
          // 若已进入温存状态两次以上，回合数+1
          when: { '>=': [{ var: 'player.state_switch_count.ConserveState' }, 2] },
          do: [{ action: 'MODIFY_TURN_COUNT', value: 1 }],
        },
        {
          // 若已进入强气状态两次以上，回合数+1
          when: { '>=': [{ var: 'player.state_switch_count.ResoluteState' }, 2] },
          do: [{ action: 'MODIFY_TURN_COUNT', value: 1 }],
        },
        {
          // 若已进入全力状态两次以上，回合数+1
          when: { '>=': [{ var: 'player.state_switch_count.AlloutState' }, 2] },
          do: [{ action: 'MODIFY_TURN_COUNT', value: 1 }],
        },
        {
          // 此后，剩余回合不大于3时，进入全力状态时，打分值+120%（1回合），最多3次
          do: [
            {
              action: 'REGISTER_HOOK',
              hook_def: {
                trigger: 'ON_STATE_SWITCH',
                condition: {
                  and: [
                    { '<=': [{ '-': [{ var: 'max_turns' }, { var: 'turn' }] }, 3] },
                    { '==': [{ var: 'event.target_state' }, 'AlloutState'] },
                  ],
                },
                max_triggers: 3,
                actions: [{ action: 'ADD_BUFF', buff_id: 'ScoreBonus', value: 120, turns: 1 }],
              },
            },
          ],
        },
      ],
      constraints: { exhaust_on_play: true },
    },

    display: {
      name: 'レジェンドスター / 传奇之星',
      description:
        '技能卡使用数+1；额外抽取两张技能卡；若已进入温存状态两次以上，回合数+1；若已进入强气状态两次以上，回合数+1；若已进入全力状态两次以上，回合数+1；此后，剩余回合不大于3时，进入全力状态时，打分值+120%（1回合），最多3次。',
      flavor: '',
    },
    restrictions: { is_unique: true, uses_per_battle: 1 },
  },

  // UR_anomaly_2: エキスパート / 专家
  {
    example_confidence: 'manual_gold',
    id: 'UR_anomaly_2',
    rarity: 'UR',
    type: 'M',
    plan: 'anomaly',

    // F3.2: 展示层词条数组
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

    engine_data: {
      cost: { genki: 2 },
      logic_chain: [
        {
          // 仅在状态切换4次以上时可使用
          constraint: { '>=': [{ var: 'player.state_switch_count_total' }, 4] },
        },
        {
          // 将保留区的技能卡不消耗体力地打出一次
          do: [{ action: 'PLAY_CARD_FROM_ZONE', zone: 'reserve', free: true, count: 1 }],
        },
        {
          // 技能卡使用数+1
          do: [{ action: 'MODIFY_PLAY_LIMIT', value: 1 }],
        },
        {
          // 下一回合，切换至温存状态
          do: [
            {
              action: 'REGISTER_HOOK',
              hook_def: {
                trigger: 'ON_TURN_START',
                delay: 1,
                max_triggers: 1,
                actions: [{ action: 'ADD_BUFF', buff_id: 'ConserveState', value: 1 }],
              },
            },
          ],
        },
        {
          // 移动至手牌时，选择抽牌堆或弃牌堆中的技能卡，移动至保留区（1回合内限1次）
          do: [
            {
              action: 'REGISTER_HOOK',
              hook_def: {
                trigger: 'ON_CARD_DRAW',
                condition: { '==': [{ var: 'event.card_id' }, 'UR_anomaly_2'] },
                max_triggers_per_turn: 1,
                actions: [{ action: 'MOVE_CARD_TO_ZONE', from: ['deck', 'discard'], to: 'reserve', count: 1 }],
              },
            },
          ],
        },
      ],
    },

    display: {
      name: 'エキスパート / 专家',
      description:
        '仅在状态切换4次以上时可使用；将保留区的技能卡不消耗体力地打出一次；技能卡使用数+1；下一回合，切换至温存状态。移动至手牌时，选择抽牌堆或弃牌堆中的技能卡，移动至保留区（1回合内限1次）。',
      flavor: '',
    },
    restrictions: { is_unique: true },
  },

  // UR_anomaly_3: スーパーノヴァ / 超新星
  {
    example_confidence: 'manual_gold',
    id: 'UR_anomaly_3',
    rarity: 'UR',
    type: 'A',
    plan: 'anomaly',

    // F3.2: 展示层词条数组
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

    engine_data: {
      cost: { genki: 1 },
      logic_chain: [
        {
          // 仅在强气2阶段下可使用
          constraint: {
            and: [
              { '>=': [{ var: 'player.buffs.ResoluteState' }, 1] },
              { '>=': [{ var: 'player.buffs.ResoluteState_level' }, 2] },
            ],
          },
        },
        {
          // 打分值+1
          do: [{ action: 'GAIN_SCORE', value: 1 }],
        },
        {
          // [成长] 回合开始时，自身的打分值+20，打分次数+1，体力消耗值+1
          do: [
            {
              action: 'REGISTER_HOOK',
              hook_def: {
                trigger: 'ON_TURN_START',
                scope: 'card',
                actions: [
                  { action: 'MODIFY_CARD_PROPERTY', property: 'score_value', delta: 20 },
                  { action: 'MODIFY_CARD_PROPERTY', property: 'score_times', delta: 1 },
                  { action: 'MODIFY_CARD_PROPERTY', property: 'stamina_cost', delta: 1 },
                ],
              },
            },
          ],
        },
        {
          // 移动至手牌时，额外抽取1张技能卡（1回合内限1次）
          do: [
            {
              action: 'REGISTER_HOOK',
              hook_def: {
                trigger: 'ON_CARD_DRAW',
                condition: { '==': [{ var: 'event.card_id' }, 'UR_anomaly_3'] },
                max_triggers_per_turn: 1,
                actions: [{ action: 'DRAW_CARD', count: 1 }],
              },
            },
          ],
        },
      ],
      constraints: { exhaust_on_play: true },
    },

    display: {
      name: 'スーパーノヴァ / 超新星',
      description:
        '仅在强气2阶段下，可使用；打分值+1；[成长] 回合开始时，自身的打分值+20，打分次数+1，体力消耗值+1。移动至手牌时，额外抽取1张技能卡（1回合内限1次）。',
      flavor: '',
    },
    restrictions: { is_unique: true, uses_per_battle: 1 },
  },

  // ==================== 理性 (Logic) - 3张 ====================

  // UR_logic_1: 最強パフォーマー / 最强表演者
  {
    example_confidence: 'manual_gold',
    id: 'UR_logic_1',
    rarity: 'UR',
    type: 'M',
    plan: 'logic',

    // F3.2: 展示层词条数组
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

    engine_data: {
      cost: { genki: 6 },
      logic_chain: [
        {
          // 仅在干劲不小于9时，可使用
          constraint: { '>=': [{ var: 'player.buffs.Motivation' }, 9] },
        },
        {
          // 技能卡使用数+1；干劲+5
          do: [
            { action: 'MODIFY_PLAY_LIMIT', value: 1 },
            { action: 'ADD_BUFF', buff_id: 'Motivation', value: 5 },
          ],
        },
        {
          // 此后，使用技能卡消耗体力时，精力+4（干劲效果2倍计算）
          do: [
            {
              action: 'REGISTER_HOOK',
              hook_def: {
                trigger: 'ON_AFTER_CARD_PLAY',
                condition: { '>': [{ var: 'event.stamina_cost' }, 0] },
                actions: [
                  {
                    action: 'MODIFY_GENKI',
                    value_expression: { '*': [4, 2] }, // 干劲效果2倍
                  },
                ],
              },
            },
          ],
        },
      ],
      constraints: { exhaust_on_play: true },
    },

    display: {
      name: '最強パフォーマー / 最强表演者',
      description:
        '仅在干劲不小于9时，可使用；技能卡使用数+1；干劲+5；此后，使用技能卡消耗体力时，精力+4（干劲效果2倍计算）。',
      flavor: '',
    },
    restrictions: { is_unique: true, uses_per_battle: 1 },
  },

  // UR_logic_2: 究極スマイル / 究极笑容
  {
    example_confidence: 'manual_gold',
    id: 'UR_logic_2',
    rarity: 'UR',
    type: 'A',
    plan: 'logic',

    // F3.2: 展示层词条数组
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

    engine_data: {
      cost: { genki: 5 },
      logic_chain: [
        {
          // 仅在好印象不小于6时，可使用
          constraint: { '>=': [{ var: 'player.buffs.GoodImpression' }, 6] },
        },
        {
          // 好印象强化+100%
          do: [{ action: 'ADD_BUFF', buff_id: 'GoodImpressionBonus', value: 100 }],
        },
        {
          // 所有技能卡的好印象值+5
          do: [{ action: 'MODIFY_ALL_CARDS', property: 'good_impression_value', delta: 5 }],
        },
        {
          // 技能卡使用数+1
          do: [{ action: 'MODIFY_PLAY_LIMIT', value: 1 }],
        },
      ],
      constraints: { exhaust_on_play: true },
    },

    display: {
      name: '究極スマイル / 究极笑容',
      description: '仅在好印象不小于6时，可使用；好印象强化+100%；所有技能卡的好印象值+5；技能卡使用数+1。',
      flavor: '',
    },
    restrictions: { is_unique: true, uses_per_battle: 1 },
  },

  // UR_logic_3: エクセレント♪ / 太棒了♪
  {
    example_confidence: 'manual_gold',
    id: 'UR_logic_3',
    rarity: 'UR',
    type: 'M',
    plan: 'logic',

    // F3.2: 展示层词条数组
    effectEntries: [
      { icon: '', effect: '技能卡使用数+1', isConsumption: false },
      {
        icon: '',
        effect: '此后，回合开始时，手牌中的R技能卡在1张以上时，随机将手牌中的两张R技能卡不消耗体力打出',
        isConsumption: false,
      },
    ],

    engine_data: {
      cost: { genki: 5 },
      logic_chain: [
        {
          // 技能卡使用数+1
          do: [{ action: 'MODIFY_PLAY_LIMIT', value: 1 }],
        },
        {
          // 此后，回合开始时，手牌中的R技能卡在1张以上时，随机将手牌中的两张R技能卡不消耗体力打出
          do: [
            {
              action: 'REGISTER_HOOK',
              hook_def: {
                trigger: 'ON_TURN_START',
                condition: { '>=': [{ var: 'hand.count_by_rarity.R' }, 1] },
                actions: [
                  {
                    action: 'PLAY_RANDOM_CARDS',
                    zone: 'hand',
                    filter: { rarity: 'R' },
                    count: 2,
                    free: true,
                  },
                ],
              },
            },
          ],
        },
      ],
      constraints: { exhaust_on_play: true },
    },

    display: {
      name: 'エクセレント♪ / 太棒了♪',
      description:
        '技能卡使用数+1；此后，回合开始时，手牌中的R技能卡在1张以上时，随机将手牌中的两张R技能卡不消耗体力打出。',
      flavor: '',
    },
    restrictions: { is_unique: true, uses_per_battle: 1 },
  },

  // ==================== 感性 (Sense) - 3张 ====================

  // UR_sense_1: 王者の風格 / 王者风范
  {
    example_confidence: 'manual_gold',
    id: 'UR_sense_1',
    rarity: 'UR',
    type: 'M',
    plan: 'sense',

    // F3.2: 展示层词条数组
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

    engine_data: {
      cost: { genki: 4 },
      logic_chain: [
        {
          // 好调+3回合；集中+3；技能卡使用数+1
          do: [
            { action: 'ADD_BUFF', buff_id: 'GoodCondition', turns: 3 },
            { action: 'ADD_BUFF', buff_id: 'Concentration', value: 3 },
            { action: 'MODIFY_PLAY_LIMIT', value: 1 },
          ],
        },
        {
          // 此后，跳过回合时，若处于绝好调状态下，下一回合打分值+110%，技能卡使用数+1，额外抽取2张技能卡
          do: [
            {
              action: 'REGISTER_HOOK',
              hook_def: {
                trigger: 'ON_TURN_SKIP',
                condition: { '>=': [{ var: 'player.buffs.ExcellentCondition' }, 1] },
                actions: [
                  { action: 'ADD_BUFF', buff_id: 'ScoreBonus', value: 110, turns: 1 },
                  { action: 'MODIFY_PLAY_LIMIT', value: 1 },
                  { action: 'DRAW_CARD', count: 2 },
                ],
              },
            },
          ],
        },
        {
          // 2回合后，不可使用技能卡（1回合）
          do: [
            {
              action: 'REGISTER_HOOK',
              hook_def: {
                trigger: 'ON_TURN_START',
                delay: 2,
                max_triggers: 1,
                actions: [{ action: 'ADD_TAG', tag: 'cannot_play_cards', turns: 1 }],
              },
            },
          ],
        },
      ],
      constraints: { exhaust_on_play: true },
    },

    display: {
      name: '王者の風格 / 王者风范',
      description:
        '好调+3回合；集中+3；技能卡使用数+1；此后，跳过回合时，若处于绝好调状态下，下一回合打分值+110%，技能卡使用数+1，额外抽取2张技能卡；2回合后，不可使用技能卡（1回合）。',
      flavor: '',
    },
    restrictions: { is_unique: true, uses_per_battle: 1 },
  },

  // UR_sense_2: 完全無欠 / 完美无缺
  {
    example_confidence: 'manual_gold',
    id: 'UR_sense_2',
    rarity: 'UR',
    type: 'M',
    plan: 'sense',

    // F3.2: 展示层词条数组
    effectEntries: [
      { icon: '', effect: '训练开始时加入手牌', isConsumption: false },
      { icon: 'https://283pro.site/shinycolors/游戏图标/好调.png', effect: '好调增加回合数+25%', isConsumption: false },
      { icon: 'https://283pro.site/shinycolors/游戏图标/集中.png', effect: '集中增加量+25%', isConsumption: false },
      { icon: '', effect: '技能卡使用数+1', isConsumption: false },
      { icon: '', effect: '额外抽取2张技能卡', isConsumption: false },
    ],

    engine_data: {
      cost: { genki: 6 },
      logic_chain: [
        {
          // 训练开始时加入手牌（通过标签实现）
          tags: ['start_in_hand'],
        },
        {
          // 好调增加回合数+25%；集中增加量+25%
          do: [
            { action: 'MODIFY_BUFF_MULTIPLIER', buff_id: 'GoodCondition', multiplier: 1.25 },
            { action: 'MODIFY_BUFF_MULTIPLIER', buff_id: 'Concentration', multiplier: 1.25 },
          ],
        },
        {
          // 技能卡使用数+1；额外抽取2张技能卡
          do: [
            { action: 'MODIFY_PLAY_LIMIT', value: 1 },
            { action: 'DRAW_CARD', count: 2 },
          ],
        },
      ],
      constraints: { exhaust_on_play: true },
    },

    display: {
      name: '完全無欠 / 完美无缺',
      description: '训练开始时加入手牌；好调增加回合数+25%；集中增加量+25%；技能卡使用数+1；额外抽取2张技能卡。',
      flavor: '',
    },
    restrictions: { is_unique: true, uses_per_battle: 1 },
  },

  // UR_sense_3: 最高傑作 / 巅峰之作
  {
    example_confidence: 'manual_gold',
    id: 'UR_sense_3',
    rarity: 'UR',
    type: 'A',
    plan: 'sense',

    // F3.2: 展示层词条数组
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

    engine_data: {
      cost: { genki: 0 },
      logic_chain: [
        {
          // 消耗5干劲；消耗5回合好调
          do: [
            { action: 'ADD_BUFF', buff_id: 'Motivation', value: -5 },
            { action: 'ADD_BUFF', buff_id: 'GoodCondition', turns: -5 },
          ],
        },
        {
          // 打分值+4（集中增益3倍计算）
          do: [
            {
              action: 'GAIN_SCORE',
              value: 4,
              multiplier_expression: { '+': [1, { '*': [{ var: 'player.buffs.Concentration' }, 3] }] },
            },
          ],
        },
        {
          // 抽牌堆或弃牌堆中的技能卡总数在9张以上时：此后3回合内...
          when: {
            '>=': [{ '+': [{ var: 'deck.count' }, { var: 'discard.count' }] }, 9],
          },
          do: [
            {
              action: 'REGISTER_HOOK',
              hook_def: {
                trigger: 'ON_TURN_START',
                turns: 3,
                actions: [
                  { action: 'ADD_BUFF', buff_id: 'GoodCondition', turns: 2 },
                  { action: 'ADD_BUFF', buff_id: 'Concentration', value: 2 },
                  { action: 'DRAW_CARD', count: 2 },
                  { action: 'MODIFY_PLAY_LIMIT', value: 1 },
                ],
              },
            },
          ],
        },
      ],
    },

    display: {
      name: '最高傑作 / 巅峰之作',
      description:
        '消耗5干劲；消耗5回合好调；打分值+4（集中增益3倍计算）；抽牌堆或弃牌堆中的技能卡总数在9张以上时：此后3回合内，回合开始时，好调+2回合，集中+2，额外抽取2张技能卡，技能卡使用数+1。',
      flavor: '',
    },
    restrictions: { is_unique: true },
  },
];

/**
 * 随机获取指定数量的 Manual Gold 样本
 * @param count 数量
 * @param plan 培育计划（可选，筛选特定计划的卡）
 */
export function getRandomManualGoldCards(
  count: number,
  plan?: 'sense' | 'logic' | 'anomaly',
): SkillCardV2WithConfidence[] {
  let pool = MANUAL_GOLD_CARDS;
  if (plan) {
    pool = pool.filter(card => card.plan === plan);
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
