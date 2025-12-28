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
  | 'MODIFY_GENKI' // 体力增减
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
  | 'PLAY_RANDOM_CARDS'; // 随机打出满足条件的卡

// ==================== Hooks 生命周期 ====================

/**
 * 战斗生命周期钩子类型
 */
export type HookType =
  // 核心生命周期
  | 'ON_LESSON_START' // 训练开始
  | 'ON_TURN_START' // 回合开始
  | 'ON_BEFORE_CARD_PLAY' // 打出卡牌前
  | 'ON_AFTER_CARD_PLAY' // 打出卡牌后
  | 'ON_BEFORE_SCORE_CALC' // 得分计算前
  | 'ON_AFTER_SCORE_CALC' // 得分计算后
  | 'ON_TURN_END' // 回合结束
  | 'ON_LESSON_END' // 训练结束
  // 新增（传说卡需要）
  | 'ON_TURN_SKIP' // 跳过回合时
  | 'ON_STATE_SWITCH' // 状态切换时
  | 'ON_CARD_DRAW'; // 卡牌进入手牌时

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
  | 'StaminaReduction' // 体力消耗减少
  | 'AlloutState' // 全力状态
  | 'ConserveState' // 温存状态
  | 'ResoluteState'; // 强气状态

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

/** 修改体力 */
export interface ModifyGenkiAction extends BaseAtomicAction {
  action: 'MODIFY_GENKI';
  value?: number; // 固定值（正数恢复，负数消耗）
  value_expression?: JsonLogicExpression; // 动态公式（如基于干劲计算）
  multiplier_expression?: JsonLogicExpression; // 倍率公式
}

/** 添加 Buff */
export interface AddBuffAction extends BaseAtomicAction {
  action: 'ADD_BUFF';
  buff_id: StandardBuffId | string; // 标准或自定义
  value?: number; // 层数
  turns?: number; // 持续回合
}

/** 添加语义标签 */
export interface AddTagAction extends BaseAtomicAction {
  action: 'ADD_TAG';
  tag: string; // 标签名（命名空间：std: / ai: / flow:）
  turns?: number; // 持续回合
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
  free?: boolean; // 是否免费
}

/** 移动卡到区域 */
export interface MoveCardToZoneAction extends BaseAtomicAction {
  action: 'MOVE_CARD_TO_ZONE';
  from_zone: CardZone;
  to_zone: CardZone;
  selector?: JsonLogicExpression; // 选择条件
}

/** 修改 Buff 倍率 */
export interface ModifyBuffMultiplierAction extends BaseAtomicAction {
  action: 'MODIFY_BUFF_MULTIPLIER';
  buff_id: StandardBuffId | string;
  multiplier: number; // 如 1.5 表示 +50%
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
  filter?: {
    rarity?: CardRarity[];
    type?: CardTypeNG[];
  };
  free?: boolean;
}

/** 所有原子动作的联合类型 */
export type AtomicAction =
  | GainScoreAction
  | ModifyGenkiAction
  | AddBuffAction
  | AddTagAction
  | DrawCardAction
  | RegisterHookAction
  | ModifyTurnCountAction
  | ModifyPlayLimitAction
  | PlayCardFromZoneAction
  | MoveCardToZoneAction
  | ModifyBuffMultiplierAction
  | ModifyAllCardsAction
  | PlayRandomCardsAction;

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
 */
export interface VisualHint {
  icon_char: string; // 单字/双字图标
  color_hex: string; // 颜色（如 #7A5CFF）
  is_debuff: boolean; // 是否为负面效果
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
  rarity: CardRarity;
  type: CardTypeNG;
  plan: ProducePlanNG;

  // === 展示层（给玩家看）===
  display: {
    name: string;
    nameJP?: string;
    description: string;
    flavor?: string;
  };

  // === 视觉层（动态图标，AI 创造新机制时必填）===
  visual_hint?: VisualHint;

  // === 引擎层（可执行逻辑）===
  engine_data: {
    cost: { genki: number };
    logic_chain: AtomicStep[];
    logic_chain_enhanced?: AtomicStep[];
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
    state_switch_count: number; // 状态切换次数
  };
  turn: number;
  max_turns: number;
  cards_played_this_turn: number;
  rng?: number; // 随机数 (0-1)
  // 新增：当前打出的卡牌信息（用于 Hook 条件检测）
  current_card?: {
    id: string;
    type: CardTypeNG;
    tags: string[]; // 卡牌标签（如 'restore_genki', 'score_card' 等）
    rarity: CardRarity;
  };
}

// ==================== 执行结果 ====================

export interface ActionResult {
  success: boolean;
  logs: string[];
  score_gained?: number;
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
