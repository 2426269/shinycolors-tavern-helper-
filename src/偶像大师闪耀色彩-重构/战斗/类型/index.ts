/**
 * 战斗系统类型定义
 * 定义所有战斗相关的类型、接口和枚举
 */

// ==================== 基础类型 ====================

/** 培育计划类型 */
export type ProducePlan = 'sense' | 'logic' | 'anomaly';

/** 卡牌稀有度 */
export type CardRarity = 'N' | 'R' | 'SR' | 'SSR';

/** 卡牌类型 */
export type CardType = 'A' | 'M' | 'T'; // A=主动, M=心理, T=陷阱

/** 消耗类型 */
export type CostType = 'normal' | 'stamina_only'; // 绿色/红色图标

// ==================== 效果类型 ====================

/** 效果类型枚举 */
export type EffectType =
  // 资源操作
  | 'ADD_GENKI' // 增加元气
  | 'ADD_STAMINA' // 回复体力
  | 'CONSUME_GENKI' // 消耗元气
  | 'CONSUME_STAMINA' // 消耗体力（效果明确说体力消耗时使用）

  // 属性操作（感性）
  | 'ADD_CONCENTRATION' // 增加集中
  | 'CONSUME_CONCENTRATION' // 消耗集中

  // 属性操作（理性）
  | 'ADD_MOTIVATION' // 增加干劲
  | 'ADD_GOOD_IMPRESSION' // 增加好印象
  | 'CONSUME_MOTIVATION' // 消耗干劲
  | 'CONSUME_GOOD_IMPRESSION' // 消耗好印象

  // 属性操作（非凡）
  | 'ADD_ALL_POWER' // 增加全力值
  | 'ADD_HEAT' // 增加热意值
  | 'CONSUME_ALL_POWER' // 消耗全力值

  // Buff操作
  | 'ADD_BUFF' // 添加Buff
  | 'REMOVE_BUFF' // 移除Buff
  | 'CONSUME_BUFF' // 消耗Buff层数/回合

  // 得分操作
  | 'ADD_SCORE' // 直接加分
  | 'ADD_SCORE_PERCENT' // 百分比加分（基于某属性）

  // 卡牌操作
  | 'DRAW_CARDS' // 抽牌
  | 'EXTRA_CARD_USE' // 增加本回合使用数
  | 'DOUBLE_NEXT_CARD' // 下一张卡效果翻倍

  // 状态切换（非凡）
  | 'SWITCH_TO_ALLOUT' // 切换到全力状态
  | 'SWITCH_TO_CONSERVE' // 切换到温存状态
  | 'SWITCH_TO_RESOLUTE'; // 切换到强气状态

/** Buff类型枚举 */
export type BuffType =
  // 感性系统
  | 'GOOD_CONDITION' // 好调（得分+50%）
  | 'EXCELLENT_CONDITION' // 绝好调（每层额外+10%）

  // 理性系统
  | 'MOTIVATED' // 有干劲（元气获取+）

  // 通用正面
  | 'STAMINA_REDUCTION' // 体力消耗减少
  | 'LESSON_ENHANCE' // 训练中强化

  // 非凡系统
  | 'ALLOUT_STATE' // 全力状态
  | 'CONSERVE_STATE' // 温存状态
  | 'RESOLUTE_STATE' // 强气状态

  // 负面
  | 'BAD_CONDITION' // 不调（得分-33%）
  | 'SLUMP'; // 低迷（得分归零）

// ==================== 数据结构 ====================

/** 效果条件 */
export interface EffectCondition {
  type: 'ATTRIBUTE_GTE' | 'ATTRIBUTE_LTE' | 'BUFF_EXISTS' | 'BUFF_NOT_EXISTS';
  target: string; // 属性名或Buff类型
  value?: number; // 比较值
}

/** 技能卡效果 */
export interface Effect {
  type: EffectType;
  value?: number; // 数值
  target?: BuffType; // Buff目标（用于ADD_BUFF等）
  duration?: number; // 持续回合数（用于Buff）
  condition?: EffectCondition; // 触发条件
  isConsumption?: boolean; // 是否是消耗型效果（显示用）
}

/** 技能卡 */
export interface SkillCard {
  id: string;
  name: string;
  nameJP?: string; // 日文名
  rarity: CardRarity;
  type: CardType;
  cost: number; // 消耗（负数表示消耗）
  costType: CostType; // 消耗类型
  effects: Effect[]; // 效果列表
  effectsEnhanced?: Effect[]; // 强化后效果
  isEnhanced: boolean; // 是否已强化
  isUnique: boolean; // 是否重复不可
  limitPerBattle?: number; // 战斗中限X次
  usedThisBattle: number; // 本战斗已使用次数
  description?: string; // 效果描述
  flavor?: string; // 风味文本
  imageUrl?: string; // 卡面图片
}

/** Buff数据 */
export interface Buff {
  id: BuffType;
  name: string;
  stacks: number; // 层数（用于集中、好印象等）
  duration: number; // 剩余回合数（-1表示永久）
  category: 'positive' | 'negative';
  iconUrl?: string;
}

/** 战斗状态 */
export interface BattleState {
  // 模式
  mode: 'training' | 'exam';
  planType: ProducePlan;

  // 资源
  genki: number; // 元气（0-100）
  stamina: number; // 当前体力
  maxStamina: number; // 最大体力

  // 属性（感性）
  concentration: number; // 集中

  // 属性（理性）
  motivation: number; // 干劲
  goodImpression: number; // 好印象

  // 属性（非凡）
  allPower: number; // 全力值（0-10）
  heat: number; // 热意值
  anomalyState: 'allout' | 'conserve' | 'resolute' | null;
  anomalyPhase: 1 | 2; // 状态阶段

  // Buff
  buffs: Map<BuffType, Buff>;

  // 得分
  score: number;
  targetScore: number;
  perfectScore: number; // Perfect目标（2x）

  // 卡牌
  deck: SkillCard[]; // 牌堆
  hand: SkillCard[]; // 手牌（最多5张）
  discardPile: SkillCard[]; // 弃牌堆
  removedPile: SkillCard[]; // 除外堆

  // 回合
  turn: number;
  maxTurns: number;
  cardsUsedThisTurn: number;
  maxCardsPerTurn: number;

  // 特殊标记
  nextCardDouble: boolean; // 下一张卡效果翻倍
}

// ==================== 事件类型 ====================

/** 战斗事件类型 */
export type BattleEventType =
  | 'TURN_START'
  | 'TURN_END'
  | 'CARD_USED'
  | 'EFFECT_APPLIED'
  | 'BUFF_ADDED'
  | 'BUFF_REMOVED'
  | 'BUFF_CONSUMED'
  | 'SCORE_CHANGED'
  | 'GENKI_CHANGED'
  | 'STAMINA_CHANGED'
  | 'BATTLE_END';

/** 战斗事件 */
export interface BattleEvent {
  type: BattleEventType;
  data?: any;
}

// ==================== 工厂函数 ====================

/** 创建初始战斗状态 */
export function createInitialBattleState(
  planType: ProducePlan,
  deck: SkillCard[],
  options?: Partial<BattleState>,
): BattleState {
  return {
    mode: 'training',
    planType,
    genki: 0,
    stamina: options?.maxStamina || 50,
    maxStamina: options?.maxStamina || 50,
    concentration: 0,
    motivation: 0,
    goodImpression: 0,
    allPower: 0,
    heat: 0,
    anomalyState: null,
    anomalyPhase: 1,
    buffs: new Map(),
    score: 0,
    targetScore: options?.targetScore || 100,
    perfectScore: options?.perfectScore || 200,
    deck: [...deck],
    hand: [],
    discardPile: [],
    removedPile: [],
    turn: 0,
    maxTurns: options?.maxTurns || 12,
    cardsUsedThisTurn: 0,
    maxCardsPerTurn: 1,
    nextCardDouble: false,
    ...options,
  };
}

/** 创建Buff */
export function createBuff(type: BuffType, stacks: number = 1, duration: number = -1): Buff {
  const buffNames: Record<BuffType, { name: string; category: 'positive' | 'negative' }> = {
    GOOD_CONDITION: { name: '好调', category: 'positive' },
    EXCELLENT_CONDITION: { name: '绝好调', category: 'positive' },
    MOTIVATED: { name: '有干劲', category: 'positive' },
    STAMINA_REDUCTION: { name: '体力消耗减少', category: 'positive' },
    LESSON_ENHANCE: { name: '训练中强化', category: 'positive' },
    ALLOUT_STATE: { name: '全力状态', category: 'positive' },
    CONSERVE_STATE: { name: '温存状态', category: 'positive' },
    RESOLUTE_STATE: { name: '强气状态', category: 'positive' },
    BAD_CONDITION: { name: '不调', category: 'negative' },
    SLUMP: { name: '低迷', category: 'negative' },
  };

  const info = buffNames[type];
  return {
    id: type,
    name: info.name,
    stacks,
    duration,
    category: info.category,
  };
}
