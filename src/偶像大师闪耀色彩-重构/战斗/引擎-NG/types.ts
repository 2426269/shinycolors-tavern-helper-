/**
 * 战斗系统 NG (Next Generation) 类型定义
 * 基于 Hooks + Atomic Actions + JSON Logic 架构
 */

// ==================== JSON Logic 类型 ====================

/** JSON Logic 表达式（任意对象格式） */
export type JsonLogicExpression = object | boolean | number | string;

// ==================== 原子操作类型 ====================

/**
 * 13 种原子操作类型
 * 涵盖原版 298 张卡 + 传说卡（UR）的所有效果
 */
export type AtomicActionType =
  // 原有 8 种
  | 'GAIN_SCORE' // 获得分数（支持公式）
  | 'MODIFY_GENKI' // 元气增减
  | 'MODIFY_STAMINA' // 体力增减（新增）
  | 'ADD_BUFF' // 添加标准 Buff
  | 'ADD_TAG' // 动态语义标签
  | 'DRAW_CARD' // 抽牌
  | 'REGISTER_HOOK' // 注册持续触发
  | 'MODIFY_TURN_COUNT' // 回合数+/-
  | 'MODIFY_PLAY_LIMIT' // 出牌次数+/-
  // 新增 5 种（传说卡需要）
  | 'PLAY_CARD_FROM_ZONE' // 从指定区域打出卡
  | 'MOVE_CARD_TO_ZONE' // 移动卡到区域
  | 'MODIFY_BUFF_MULTIPLIER' // Buff 增益倍率
  | 'MODIFY_ALL_CARDS' // 批量修改卡属性
  | 'PLAY_RANDOM_CARDS' // 随机打出满足条件的卡
  // 新增（消耗机制）
  | 'EXHAUST_CARD' // 消耗卡牌进入除外区
  // 新增（移除机制）
  | 'REMOVE_BUFF' // 移除 Buff
  | 'REMOVE_TAG' // 移除标签
  // T-B2: 新增确保 Buff 持续回合动作
  | 'ENSURE_BUFF_TURNS' // 确保 Buff 至少保持 N 回合
  // T-B4: 新增效果倍率动作
  | 'MODIFY_BUFF_EFFECT_MULTIPLIER' // 设置 Buff 效果倍率（有效层数×N）
  // T2: 新增强化手牌动作
  | 'ENHANCE_HAND' // 强化手牌区的卡牌
  // T3: 新增生成卡牌动作
  | 'CREATE_CARD' // 在指定区域生成卡牌
  // T6: 新增效果重放动作
  | 'REPLAY_NEXT_CARD'; // 下一张卡效果额外发动

// ==================== Hooks 生命周期 ====================

/**
 * 战斗生命周期钩子类型
 */
/**
 * 战斗生命周期钩子类型
 */
export const HookType = {
  // 核心生命周期
  ON_LESSON_START: 'ON_LESSON_START', // 训练开始
  ON_TURN_START: 'ON_TURN_START', // 回合开始
  ON_BEFORE_CARD_PLAY: 'ON_BEFORE_CARD_PLAY', // 打出卡牌前
  ON_AFTER_CARD_PLAY: 'ON_AFTER_CARD_PLAY', // 打出卡牌后
  ON_BEFORE_SCORE_CALC: 'ON_BEFORE_SCORE_CALC', // 得分计算前
  ON_AFTER_SCORE_CALC: 'ON_AFTER_SCORE_CALC', // 得分计算后
  ON_TURN_END: 'ON_TURN_END', // 回合结束
  ON_LESSON_END: 'ON_LESSON_END', // 训练结束
  // 新增（传说卡需要）
  ON_TURN_SKIP: 'ON_TURN_SKIP', // 跳过回合时
  ON_STATE_SWITCH: 'ON_STATE_SWITCH', // 状态切换时
  ON_CARD_DRAW: 'ON_CARD_DRAW', // 卡牌进入手牌时
  // T8: 固有能力支持
  ON_CARD_ENTER_ZONE: 'ON_CARD_ENTER_ZONE', // 卡牌进入任意区域时
} as const;

export type HookType = (typeof HookType)[keyof typeof HookType];

// ==================== 标准 Buff 白名单 ====================

/**
 * 标准 Buff ID（原版游戏机制）
 * AI 在严格模式下只能使用这些 Buff
 */
export type StandardBuffId =
  | 'GoodCondition' // 好调
  | 'ExcellentCondition' // 绝好调
  | 'Concentration' // 集中
  | 'Motivation' // 干劲
  | 'GoodImpression' // 好印象
  | 'StaminaReduction' // 体力消耗减少50%
  | 'AlloutState' // 全力状态
  | 'ConserveState' // 温存状态
  | 'ResoluteState' // 强气状态
  // ===== 子任务1新增 =====
  | 'AllPower' // 全力值
  | 'Heat' // 热意
  | 'StaminaCut' // 体力消耗削减
  | 'StaminaIncrease' // 体力消耗增加(50%)
  | 'StaminaExtra' // 体力消耗追加
  | 'ScoreFinalMultiplier' // 最终得分倍率
  // ===== 新增: 通用得分加成 =====
  | 'ScoreBonus' // 得分增加xx%
  | 'GoodImpressionBonus'; // 好印象效果增加xx%

// ==================== 卡牌区域 ====================

/** 卡牌区域类型 */
export type CardZone =
  | 'deck' // 抽牌堆
  | 'hand' // 手牌
  | 'discard' // 弃牌堆
  | 'reserve' // 保留区
  | 'removed'; // 除外区

// ==================== 原子动作数据结构 ====================

/** 基础原子动作接口 */
interface BaseAtomicAction {
  action: AtomicActionType;
  tags?: string[]; // 语义标签，用于联动检测
}

/** 获得分数 */
export interface GainScoreAction extends BaseAtomicAction {
  action: 'GAIN_SCORE';
  value?: number; // 固定值
  value_expression?: JsonLogicExpression; // 动态公式
  multiplier_expression?: JsonLogicExpression; // 倍率公式
}

/** 修改元气 */
export interface ModifyGenkiAction extends BaseAtomicAction {
  action: 'MODIFY_GENKI';
  value?: number; // 固定值（正数恢复，负数消耗）
  value_expression?: JsonLogicExpression; // 动态公式（如基于干劲计算）
  multiplier_expression?: JsonLogicExpression; // 倍率公式
}

/** 修改体力 */
export interface ModifyStaminaAction extends BaseAtomicAction {
  action: 'MODIFY_STAMINA';
  value?: number; // 固定值（正数恢复，负数消耗）
  value_expression?: JsonLogicExpression; // 动态公式
  multiplier_expression?: JsonLogicExpression; // 倍率公式
}

/** 添加 Buff */
export interface AddBuffAction extends BaseAtomicAction {
  action: 'ADD_BUFF';
  buff_id: StandardBuffId | string; // 标准或自定义
  value?: number; // 层数
  value_expression?: JsonLogicExpression; // 动态层数公式
  turns?: number; // 持续回合
  turns_expression?: JsonLogicExpression; // 动态回合数公式
  decay_per_turn?: number; // 每回合衰减层数
}

/** 添加语义标签 */
export interface AddTagAction extends BaseAtomicAction {
  action: 'ADD_TAG';
  tag: string; // 标签名（命名空间：std: / ai: / flow:）
  turns?: number; // 持续回合
}

/** 移除 Buff */
export interface RemoveBuffAction extends BaseAtomicAction {
  action: 'REMOVE_BUFF';
  buff_id: string;
  stacks?: number; // 移除层数，省略则全部移除
}

/** 移除语义标签 */
export interface RemoveTagAction extends BaseAtomicAction {
  action: 'REMOVE_TAG';
  tag: string;
}

/** 抽牌 */
export interface DrawCardAction extends BaseAtomicAction {
  action: 'DRAW_CARD';
  count: number;
}

/** 注册 Hook */
export interface RegisterHookAction extends BaseAtomicAction {
  action: 'REGISTER_HOOK';
  hook_def: HookDef;
}

/** 修改回合数 */
export interface ModifyTurnCountAction extends BaseAtomicAction {
  action: 'MODIFY_TURN_COUNT';
  value: number; // 正数增加，负数减少
}

/** 修改出牌次数 */
export interface ModifyPlayLimitAction extends BaseAtomicAction {
  action: 'MODIFY_PLAY_LIMIT';
  value: number; // 当回合额外可出牌数
}

/** 从区域打出卡 */
export interface PlayCardFromZoneAction extends BaseAtomicAction {
  action: 'PLAY_CARD_FROM_ZONE';
  zone: CardZone;
  selector?: JsonLogicExpression; // 选择条件 (新增)
  free?: boolean; // 是否免费
}

/** 移动卡到区域 */
export interface MoveCardToZoneAction extends BaseAtomicAction {
  action: 'MOVE_CARD_TO_ZONE';
  from_zone: CardZone;
  to_zone: CardZone;
  from_zones?: CardZone[]; // 子任务4: 多区选择能力
  selector?: JsonLogicExpression; // 选择条件
}

/** 修改 Buff 倍率 */
export interface ModifyBuffMultiplierAction extends BaseAtomicAction {
  action: 'MODIFY_BUFF_MULTIPLIER';
  buff_id: StandardBuffId | string;
  multiplier: number; // 如 1.5 表示 +50%
}

/** T-B2: 确保 Buff 至少保持 N 回合 */
export interface EnsureBuffTurnsAction extends BaseAtomicAction {
  action: 'ENSURE_BUFF_TURNS';
  buff_id: StandardBuffId | string;
  turns: number;
}

/** T-B4: 设置 Buff 效果倍率（有效层数×N） */
export interface ModifyBuffEffectMultiplierAction extends BaseAtomicAction {
  action: 'MODIFY_BUFF_EFFECT_MULTIPLIER';
  buff_id: StandardBuffId | string;
  multiplier: number;
}

/** 批量修改卡属性 */
export interface ModifyAllCardsAction extends BaseAtomicAction {
  action: 'MODIFY_ALL_CARDS';
  target_zone?: CardZone; // 目标区域，默认 all
  modifier: {
    stat: string; // 属性名
    value: number; // 修改值
  };
}

/** 随机打出卡 */
export interface PlayRandomCardsAction extends BaseAtomicAction {
  action: 'PLAY_RANDOM_CARDS';
  count: number;
  /** 来源区域，默认 'hand' */
  from_zone?: CardZone;
  /** JSON Logic 选择器（优先使用） */
  selector?: JsonLogicExpression;
  /** 旧版过滤器（向后兼容） */
  filter?: {
    rarity?: CardRarity[];
    type?: CardTypeNG[];
  };
  free?: boolean;
}

/** 消耗卡牌（进入除外区） */
export interface ExhaustCardAction extends BaseAtomicAction {
  action: 'EXHAUST_CARD';
  card_id?: string; // 省略时消耗当前打出的卡
}

/** T2: 强化手牌 */
export interface EnhanceHandAction extends BaseAtomicAction {
  action: 'ENHANCE_HAND';
  filter?: {
    type?: CardTypeNG; // 'A' = 主动, 'M' = 精神, 'T' = 陷阱
    rarity?: CardRarity;
  };
}

/** T3: 生成卡牌 */
export interface CreateCardAction extends BaseAtomicAction {
  action: 'CREATE_CARD';
  card_id: string; // 要生成的卡的 ID（如 trap_n_1 眠気）
  zone: CardZone; // 目标区域 (deck, hand, discard, reserve)
  position?: 'top' | 'bottom' | 'random'; // 插入位置，默认 random
  count?: number; // 生成数量，默认 1
}

/** 所有原子动作的联合类型 */
export type AtomicAction =
  | GainScoreAction
  | ModifyGenkiAction
  | ModifyStaminaAction
  | AddBuffAction
  | AddTagAction
  | RemoveBuffAction
  | RemoveTagAction
  | DrawCardAction
  | RegisterHookAction
  | ModifyTurnCountAction
  | ModifyPlayLimitAction
  | PlayCardFromZoneAction
  | MoveCardToZoneAction
  | ModifyBuffMultiplierAction
  | ModifyAllCardsAction
  | PlayRandomCardsAction
  | ExhaustCardAction
  | EnsureBuffTurnsAction // T-B2
  | ModifyBuffEffectMultiplierAction // T-B4
  | EnhanceHandAction // T2
  | CreateCardAction // T3
  | ReplayNextCardAction; // T6

/** T6: 效果重放（下一张卡效果额外发动） */
export interface ReplayNextCardAction extends BaseAtomicAction {
  action: 'REPLAY_NEXT_CARD';
  count?: number; // 额外发动次数，默认 1
}

// ==================== 原子步骤 ====================

/**
 * 原子步骤：条件 + 动作列表
 * 统一格式：when?(可选条件) + do(动作数组)
 */
export interface AtomicStep {
  when?: JsonLogicExpression; // 可选条件，满足时执行
  do: AtomicAction[]; // 一次可执行多个动作
}

// ==================== Hook 定义 ====================

/**
 * Hook 机制定义（用于 REGISTER_HOOK）
 */
export interface HookDef {
  id: string; // 机制 ID
  name: string; // 显示名
  trigger: HookType; // 挂载点
  duration_turns?: number; // 持续回合数
  max_triggers?: number; // 最多触发次数
  condition?: JsonLogicExpression; // 触发条件
  actions: AtomicAction[]; // 触发时的动作
}

// ==================== 视觉提示 ====================

/**
 * AI 创造新机制时必须提供的视觉提示
 * 支持两种格式：
 * - 新格式 (TestCardsV2 使用)：key/symbol/color/isDebuff
 * - 旧格式 (原设计)：icon_char/color_hex/is_debuff
 */
export interface VisualHint {
  // 新格式字段
  key?: string; // 标识符
  kind?: 'tag' | 'buff'; // 类型
  symbol?: string; // 显示符号
  color?: string; // 颜色
  isDebuff?: boolean; // 是否负面
  shortName?: string; // 短名称
  description?: string; // 描述

  // 旧格式字段 (保留向后兼容)
  icon_char?: string; // 单字/双字图标
  color_hex?: string; // 颜色（如 #7A5CFF）
  is_debuff?: boolean; // 是否为负面效果
}

// ==================== 新版卡牌稀有度和类型 ====================

export type CardRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';
export type CardTypeNG = 'A' | 'M' | 'T'; // 主动/精神/陷阱
export type ProducePlanNG = 'sense' | 'logic' | 'anomaly';

// ==================== 新版技能卡数据结构 ====================

/**
 * SkillCardV2：新版技能卡结构
 * 分离展示层与引擎层
 */
export interface SkillCardV2 {
  // === 元数据 ===
  id: string;
  originalId?: string; // 实例化前的原始卡牌 ID (用于映射回 DeckSkillCard)
  rarity: CardRarity;
  type: CardTypeNG;
  plan: ProducePlanNG;

  // === 展示层（给玩家看）===
  display: {
    name: string;
    nameJP?: string;
    description: string;
    flavor?: string;
    flavorJP?: string; // T-12: 日语氛围文本
  };

  // === 视觉层（动态图标，AI 创造新机制时必填）===
  visual_hint?: VisualHint;

  // === 引擎层（可执行逻辑）===
  engine_data: {
    cost: { genki: number };
    logic_chain: AtomicStep[];
    logic_chain_enhanced?: AtomicStep[];
    constraints?: {
      exhaust_on_play?: boolean; // 打出后消耗（移除区）
      usable_when?: JsonLogicExpression; // P2: 使用条件（不满足时不可打出）
    };
    // T8: 固有能力 - 卡牌存在于牌组时始终监听
    intrinsic_hooks?: HookDef[];
  };

  // === 限制 ===
  restrictions?: {
    is_unique?: boolean; // 不可重复
    uses_per_battle?: number; // 训练中限 N 次
  };

  // === P-Lab 流派关联 ===
  /** 所属流派 ID 列表 */
  flowRefs?: string[];
  /** 使用的自定义机制 ID 列表 */
  mechanicRefs?: string[];

  // === 兼容层（旧卡支持）===
  legacy_effects?: any[]; // 旧版 Effect 数组

  // === 运行时状态 ===
  isEnhanced?: boolean; // T2: 是否已强化（运行时动态设置）
}

// ==================== 战斗状态上下文 ====================

/**
 * 战斗上下文（用于 JSON Logic 变量引用）
 */
export interface BattleContext {
  player: {
    genki: number;
    genki_percent: number;
    stamina: number;
    stamina_percent: number;
    score: number;
    concentration: number;
    motivation: number;
    good_impression: number;
    all_power: number;
    heat: number;
    buffs: Record<string, number>; // buff_id -> stacks
    tags: string[];
    state_switch_count: Record<string, number>; // EV1: per-state 计数 <StateName> -> count
    state_switch_count_total: number; // EV1: 状态切换总次数
  };
  turn: number;
  max_turns: number;
  cards_played_this_turn: number;
  cards_played_total: number; // 总出牌数 (新增)
  rng?: number; // 随机数 (0-1) - 回放场景需传入确定性数值

  // EV1: 新增卡区统计变量
  play_turn?: number; // Hook 注册时的回合号
  deck_count?: number; // 抽牌堆卡牌数量
  discard_count?: number; // 弃牌堆卡牌数量
  cards_in_hand_by_rarity?: Record<string, number>; // 手牌按稀有度统计 { N: 2, R: 1, ... }

  // EV1: Hook 上下文变量
  new_state?: string; // ON_STATE_SWITCH 时的目标状态
  stamina_cost?: number; // 当前出牌消耗的体力

  // 新增：当前打出的卡牌信息（用于 Hook 条件检测）
  current_card?: {
    id: string;
    originalId?: string; // T8: 原始卡牌 ID (用于模板匹配)
    type: CardTypeNG;
    tags: string[]; // 卡牌标签（如 'restore_genki', 'score_card' 等）
    rarity: CardRarity;
    plan?: ProducePlanNG; // T4: 属性分类（感性/理性/非凡/自由）
    effect_tags?: string[]; // T4: 效果标签（如 '全力效果', '温存效果' 等）
    card_name?: string; // T7: 卡牌中文名
    card_name_jp?: string; // T7: 卡牌日文名
    card_id?: string; // T-Fix: 卡牌 ID (映射到 originalId)
  };

  // T-10: 有效层数记录（应用效果倍率后，用于得分计算）
  buffs_effective?: Record<string, number>;
}

// ==================== 战斗事件系统 (动画数据源) ====================

export enum BattleEventType {
  // 核心流程
  COST_DEDUCT = 'COST_DEDUCT', // 费用扣除
  CARD_MOVE = 'CARD_MOVE', // 卡牌移动 (通用)
  LOGIC_CHAIN_START = 'LOGIC_CHAIN_START', // 逻辑链开始
  LOGIC_CHAIN_END = 'LOGIC_CHAIN_END', // 逻辑链结束

  // 数值变化
  GAIN_SCORE = 'GAIN_SCORE', // 获得分数
  MODIFY_GENKI = 'MODIFY_GENKI', // 元气变化
  MODIFY_STAMINA = 'MODIFY_STAMINA', // 体力变化

  // 状态变化
  ADD_BUFF = 'ADD_BUFF', // 添加 Buff
  REMOVE_BUFF = 'REMOVE_BUFF', // 移除 Buff
  ADD_TAG = 'ADD_TAG', // 添加 Tag
  REMOVE_TAG = 'REMOVE_TAG', // 移除 Tag

  // 流程控制
  DRAW_CARD = 'DRAW_CARD', // 抽牌 (动作)
  MODIFY_TURN = 'MODIFY_TURN', // 回合数变化
  MODIFY_LIMIT = 'MODIFY_LIMIT', // 出牌限制变化
  REGISTER_HOOK = 'REGISTER_HOOK', // 注册 Hook

  // 特殊机制
  CREATE_CARD = 'CREATE_CARD', // 生成卡牌
  EXHAUST_CARD = 'EXHAUST_CARD', // 消耗卡牌
  ENHANCE_HAND = 'ENHANCE_HAND', // 强化手牌
  EFFECT_REPLAY = 'EFFECT_REPLAY', // 效果重放

  // Hook 触发
  HOOK_TRIGGER = 'HOOK_TRIGGER', // Hook 触发

  // ===== 新增事件类型 (Task 1 & Refinement) =====
  HAND_ENTER = 'HAND_ENTER', // 初始手牌入场
  TURN_START_DRAW = 'TURN_START_DRAW', // 回合开始抽牌
  TURN_END_DISCARD = 'TURN_END_DISCARD', // 回合结束弃牌
  HAND_REFRESH = 'HAND_REFRESH', // 手牌刷新
  CARD_PULL = 'CARD_PULL', // 区域拉牌

  // 补全缺失事件
  BUFF_MULTIPLIER_SET = 'BUFF_MULTIPLIER_SET', // 设置 Buff 倍率
  BUFF_TURNS_ENSURE = 'BUFF_TURNS_ENSURE', // 确保 Buff 回合
  BUFF_EFFECT_MULTIPLIER_SET = 'BUFF_EFFECT_MULTIPLIER_SET', // 设置 Buff 效果倍率
  ALL_CARDS_MODIFIED = 'ALL_CARDS_MODIFIED', // 批量修改卡牌
}

// ==================== 事件负载定义 (snake_case) ====================

export interface CostDeductEventData {
  genki: number;
  stamina: number;
  total: number;
}
export interface CardMoveEventData {
  card_id: string;
  from_zone: string;
  to_zone: string;
}
export interface LogicChainEventData {
  chain_id?: string;
  source_card_id?: string;
}
export interface GainScoreEventData {
  value: number;
  base: number;
  multiplier: number;
}
export interface ModifyGenkiEventData {
  delta: number;
  new_value: number;
}
export interface ModifyStaminaEventData {
  delta: number;
  new_value: number;
}
export interface AddBuffEventData {
  buff_id: string;
  stacks: number;
  turns?: number;
  decay?: number;
}
export interface RemoveBuffEventData {
  buff_id: string;
  stacks: number;
}
export interface AddTagEventData {
  tag: string;
  turns?: number;
}
export interface RemoveTagEventData {
  tag: string;
}
export interface DrawCardEventData {
  count: number;
  drawn_card_ids: string[];
}
export interface ModifyTurnEventData {
  delta: number;
  new_value: number;
}
export interface ModifyLimitEventData {
  delta: number;
  new_value: number;
}
export interface RegisterHookEventData {
  hook_id: string;
  trigger: string;
}
export interface CreateCardEventData {
  card_id: string;
  zone: string;
  count: number;
  position: string;
  instance_ids?: string[];
}
export interface ExhaustCardEventData {
  card_id: string;
}
export interface EnhanceHandEventData {
  count: number;
  enhanced_card_ids: string[];
}
export interface EffectReplayEventData {
  count: number;
}
export interface HookTriggerEventData {
  trigger: string;
  count: number;
  card_id?: string;
}

// 新增事件负载
export interface HandEnterEventData {
  card_ids: string[];
}
export interface TurnStartDrawEventData {
  count: number;
  drawn_card_ids: string[];
}
export interface TurnEndDiscardEventData {
  count: number;
  discarded_card_ids: string[];
}
export interface HandRefreshEventData {
  discarded_card_ids: string[];
  drawn_card_ids: string[];
}
export interface CardPullEventData {
  card_id: string;
  from_zone: string;
  to_zone: string;
}

// 补全缺失事件负载
export interface BuffMultiplierSetEventData {
  buff_id: string;
  multiplier: number;
}
export interface BuffTurnsEnsureEventData {
  buff_id: string;
  turns: number;
}
export interface BuffEffectMultiplierSetEventData {
  buff_id: string;
  multiplier: number;
}
export interface AllCardsModifiedEventData {
  target_zone: string;
  modifier: { stat: string; value: number };
  modified_count: number;
}

// ==================== 强类型事件联合 ====================

export type BattleEvent =
  | { type: BattleEventType.COST_DEDUCT; timestamp: number; data: CostDeductEventData }
  | { type: BattleEventType.CARD_MOVE; timestamp: number; data: CardMoveEventData }
  | { type: BattleEventType.LOGIC_CHAIN_START; timestamp: number; data: LogicChainEventData }
  | { type: BattleEventType.LOGIC_CHAIN_END; timestamp: number; data: LogicChainEventData }
  | { type: BattleEventType.GAIN_SCORE; timestamp: number; data: GainScoreEventData }
  | { type: BattleEventType.MODIFY_GENKI; timestamp: number; data: ModifyGenkiEventData }
  | { type: BattleEventType.MODIFY_STAMINA; timestamp: number; data: ModifyStaminaEventData }
  | { type: BattleEventType.ADD_BUFF; timestamp: number; data: AddBuffEventData }
  | { type: BattleEventType.REMOVE_BUFF; timestamp: number; data: RemoveBuffEventData }
  | { type: BattleEventType.ADD_TAG; timestamp: number; data: AddTagEventData }
  | { type: BattleEventType.REMOVE_TAG; timestamp: number; data: RemoveTagEventData }
  | { type: BattleEventType.DRAW_CARD; timestamp: number; data: DrawCardEventData }
  | { type: BattleEventType.MODIFY_TURN; timestamp: number; data: ModifyTurnEventData }
  | { type: BattleEventType.MODIFY_LIMIT; timestamp: number; data: ModifyLimitEventData }
  | { type: BattleEventType.REGISTER_HOOK; timestamp: number; data: RegisterHookEventData }
  | { type: BattleEventType.CREATE_CARD; timestamp: number; data: CreateCardEventData }
  | { type: BattleEventType.EXHAUST_CARD; timestamp: number; data: ExhaustCardEventData }
  | { type: BattleEventType.ENHANCE_HAND; timestamp: number; data: EnhanceHandEventData }
  | { type: BattleEventType.EFFECT_REPLAY; timestamp: number; data: EffectReplayEventData }
  | { type: BattleEventType.HOOK_TRIGGER; timestamp: number; data: HookTriggerEventData }
  // 新增
  | { type: BattleEventType.HAND_ENTER; timestamp: number; data: HandEnterEventData }
  | { type: BattleEventType.TURN_START_DRAW; timestamp: number; data: TurnStartDrawEventData }
  | { type: BattleEventType.TURN_END_DISCARD; timestamp: number; data: TurnEndDiscardEventData }
  | { type: BattleEventType.HAND_REFRESH; timestamp: number; data: HandRefreshEventData }
  | { type: BattleEventType.CARD_PULL; timestamp: number; data: CardPullEventData }
  // 补全
  | { type: BattleEventType.BUFF_MULTIPLIER_SET; timestamp: number; data: BuffMultiplierSetEventData }
  | { type: BattleEventType.BUFF_TURNS_ENSURE; timestamp: number; data: BuffTurnsEnsureEventData }
  | { type: BattleEventType.BUFF_EFFECT_MULTIPLIER_SET; timestamp: number; data: BuffEffectMultiplierSetEventData }
  | { type: BattleEventType.ALL_CARDS_MODIFIED; timestamp: number; data: AllCardsModifiedEventData };

// ==================== 执行结果 ====================

export interface ActionResult {
  success: boolean;
  logs: string[];
  score_gained?: number;
  playedCards?: any[]; // 随机打出时返回的卡牌列表
  // T-9: 事件日志，供 UI 播放动画 (强类型)
  events?: BattleEvent[];
}

// ==================== P-Lab 流派系统 ====================

/**
 * 流派定义 (FlowDef)
 * 用于 P-Lab 中定义新的战斗流派
 */
export interface FlowDef {
  /** 流派唯一 ID，如 "emo_style_01" */
  id: string;
  /** 中文名称 */
  nameCN: string;
  /** 日文名称（可选） */
  nameJP?: string;
  /** 所属培育计划 */
  plan: ProducePlanNG | 'mixed';
  /** 父级核心流派（可选），如挂靠在 "好调流" 下 */
  parentCoreFlow?: string;
  /** 流派描述 */
  description: string;
  /** 关联的核心机制 ID 列表 */
  keyMechanics: string[];
  /** 语义标签 */
  tags: string[];
  /** 视觉主题 */
  visualTheme: {
    color: string;
    icon: string;
  };
  /** 核心角色（角色卡 ID 列表） */
  coreCharacters?: string[];
  /** 已收集的技能卡 ID 列表 */
  collectedCards?: string[];
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 机制定义 (MechanicDef)
 * AI 发明的自定义机制（Tag/Buff）的持久化结构
 */
export interface MechanicDef {
  /** 机制唯一 ID，如 "Menhera" */
  id: string;
  /** 显示名称 */
  name: string;
  /** 机制描述 */
  description: string;
  /** 视觉样式（用于 DynamicBadge） */
  visual: {
    symbol: string;
    color: string;
    isDebuff: boolean;
  };
  /** 所属流派 ID（可选） */
  flowId?: string;
  /** 逻辑模板（可选，用于程序化生成变异卡） */
  logicTemplate?: AtomicStep[];
  /** 创建时间 */
  createdAt?: string;
}

// ==================== 导出 ====================

export default {
  // 便于整体导入
};
