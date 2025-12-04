/**
 * 技能卡类型定义
 * 基于学园偶像大师的技能卡系统
 */

/**
 * 技能卡稀有度
 * UR为AI生成的专属技能卡
 */
export type SkillCardRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

/**
 * 培育计划类型
 * 注：'自由' 表示通用型卡牌，不绑定特定培育计划
 */
export type ProducePlan = '非凡' | '理性' | '感性' | '自由';

/**
 * 技能卡类型
 * - A: Active (行动) - 六边形外框,可直接获取得分
 * - M: Mental (精神) - 圆形外框,仅提供加成效果
 * - T: Trap (陷阱) - 方形外框,仅提供负面效果
 */
export type SkillCardType = 'A' | 'M' | 'T';

/**
 * 技能卡成本类型
 */
export interface SkillCardCost {
  type: 'energy' | 'stamina' | 'goodImpression' | 'motivation' | 'concentration' | 'fullPower' | 'goodCondition';
  amount: number;
}

/**
 * 技能卡数据结构
 */
export interface SkillCard {
  /** 卡牌ID */
  id: string;

  /** 卡牌名称 */
  name: string;

  /** 稀有度 */
  rarity: SkillCardRarity;

  /** 所属培育计划 */
  plan: ProducePlan;

  /** 卡牌类型 (A/M/T) */
  cardType: SkillCardType;

  /** 消耗成本 */
  cost: string;

  /** 强化前效果描述（旧格式，保留兼容） */
  effect_before: string;

  /** 强化后效果描述（旧格式，保留兼容） */
  effect_after: string;

  /** 强化前效果词条（新格式，推荐使用） */
  effectEntries?: EffectEntry[];

  /** 强化后效果词条（新格式，推荐使用） */
  effectEntriesEnhanced?: EffectEntry[];

  /** 条件效果（强化前） */
  conditionalEffects?: ConditionalEffectEntry[];

  /** 条件效果（强化后） */
  conditionalEffectsEnhanced?: ConditionalEffectEntry[];

  /** 卡牌限制信息 */
  restrictions?: CardRestrictions;

  /** 是否已强化 */
  enhanced?: boolean;

  /** 是否为专属技能卡 (由AI生成) */
  isExclusive?: boolean;

  /** 绑定的P卡ID (仅专属技能卡有效) */
  bindingCardId?: string;

  /** 风味文本（卡牌背景故事） */
  flavor?: string;
}

/**
 * 单个效果词条（词条式格式）
 */
export interface EffectEntry {
  /** 图标URL */
  icon: string;

  /** 效果描述（中文，如："数值+10"、"元气+3"、"抽取1张技能卡"） */
  effect: string;

  /** 是否为消耗型效果（如干劲消耗、好调消耗） */
  isConsumption: boolean;
}

/**
 * 条件效果词条（词条式格式）
 */
export interface ConditionalEffectEntry {
  /** 图标URL */
  icon: string;

  /** 触发条件描述（如："好印象10以上时"、"全力时"） */
  condition: string;

  /** 效果描述（中文，如："数值+10"、"元气+3"） */
  effect: string;

  /** 是否为消耗型效果 */
  isConsumption: boolean;
}

/**
 * 技能卡限制信息
 */
export interface CardRestrictions {
  /** 是否可重复获得 */
  isDuplicatable: boolean;

  /** 演出中使用次数限制（1表示限1次，null表示无限制） */
  usesPerBattle: number | null;
}

/**
 * 卡牌效果类型（旧版结构化格式，保留用于战斗系统）
 */
export interface SkillCardEffect {
  /** 元气 */
  energy?: number;

  /** 干劲 */
  motivation?: number;

  /** 好印象 */
  goodImpression?: number;

  /** 集中 */
  concentration?: number;

  /** 全力值 */
  fullPower?: number;

  /** 好调 (回合数) */
  goodCondition?: number;

  /** 绝好调 (回合数) */
  perfectCondition?: number;

  /** 消费体力减少 (回合数) */
  staminaCostReduction?: number;

  /** 消费体力削减 (层数) */
  staminaCostDeduction?: number;

  /** 技能卡使用数追加 */
  additionalCardUse?: number;

  /** 直接获得分数 */
  directScore?: number;

  /** 分数倍率 (百分比) */
  scoreMultiplier?: number;

  /** 体力消耗 */
  staminaCost?: number;

  /** 体力回复 */
  staminaRecovery?: number;

  /** 其他特殊效果描述 */
  specialEffect?: string;
}

/**
 * 卡牌筛选条件
 */
export interface SkillCardFilter {
  /** 稀有度 */
  rarity?: SkillCardRarity | SkillCardRarity[];

  /** 培育计划 */
  plan?: ProducePlan | ProducePlan[];

  /** 卡牌类型 */
  cardType?: SkillCardType | SkillCardType[];

  /** 是否已强化 */
  enhanced?: boolean;

  /** 是否为专属卡 */
  isExclusive?: boolean;

  /** 搜索关键词 (名称或效果) */
  keyword?: string;
}

/**
 * 卡组 (Deck) 类型
 */
export interface Deck {
  /** 卡组ID */
  id: string;

  /** 卡组名称 */
  name: string;

  /** 卡组中的技能卡 */
  cards: SkillCard[];

  /** 卡组所属培育计划 */
  plan: ProducePlan;

  /** 创建时间 */
  createdAt: Date;

  /** 最后更新时间 */
  updatedAt: Date;
}

/**
 * 战斗状态中的卡牌位置
 */
export type CardLocation = 'hand' | 'deck' | 'discard' | 'excluded' | 'reserved';

/**
 * 战斗中的卡牌实例
 */
export interface BattleCard extends SkillCard {
  /** 实例ID (用于区分同名卡) */
  instanceId: string;

  /** 当前位置 */
  location: CardLocation;

  /** 本局是否已使用 */
  usedThisBattle?: boolean;

  /** 临时强化状态 (仅本局有效) */
  temporaryEnhanced?: boolean;
}
