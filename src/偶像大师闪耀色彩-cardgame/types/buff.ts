/**
 * Buff系统类型定义
 *
 * 这个文件定义了所有Buff相关的类型，包括：
 * - Buff类型（BuffType）
 * - Buff触发时机（BuffTrigger）
 * - Buff效果（BuffEffect）
 * - Buff数据结构（Buff）
 */

import type { BattleState } from './battle-state';

/**
 * Buff类型枚举
 *
 * 基于学园偶像大师的真实Buff系统
 */
export type BuffType =
  // ========== 感性系统 ==========
  | 'good_condition' // 好調（得分+50%）
  | 'concentration' // 集中（每层+15分）
  | 'excellent_condition' // 絶好調（强化好調）
  | 'great_condition' // 状态绝佳
  | 'state_good' // 状态良好

  // ========== 理性系统 ==========
  | 'good_impression' // 好印象（回合结束直接得分）
  | 'motivated' // 有干劲（元气获取量+）
  | 'enthusiastic' // 热情（理性专属）

  // ========== 非凡系统 ==========
  | 'allout_state' // 全力状态（得分+200%）
  | 'allout_state_2' // 全力状态二阶段（得分+300%）
  | 'conserve_state' // 温存状态
  | 'conserve_state_2' // 温存状态二阶段
  | 'resolute_state' // 坚决状态（強気）
  | 'resolute_state_2' // 坚决状态二阶段
  | 'relaxed_state' // のんびり状态
  | 'heat_bonus' // 热意值加成

  // ========== 通用正面Buff ==========
  | 'stamina_reduction' // 体力消耗减少
  | 'genki_boost' // 元气获取增加
  | 'score_boost' // 得分增加
  | 'card_draw_boost' // 抽牌数增加
  | 'card_use_bonus' // 技能卡使用数增加
  | 'cost_reduction' // Cost减少
  | 'double_effect' // 下一张卡效果×2
  | 'attribute_boost' // 属性获取增加

  // ========== 负面Buff（Debuff） ==========
  | 'tired' // 疲劳（得分-20%）
  | 'confused' // 混乱（随机效果）
  | 'locked' // 锁定（无法使用卡牌）
  | 'stamina_drain' // 体力流失（回合开始-X）
  | 'genki_drain' // 元气流失
  | 'score_penalty'; // 得分惩罚

/**
 * Buff触发时机
 *
 * 定义Buff效果在什么时候触发
 */
export type BuffTrigger =
  | 'turn_start' // 回合开始时
  | 'turn_end' // 回合结束时
  | 'card_used' // 使用卡牌时
  | 'card_drawn' // 抽牌时
  | 'score_calculated' // 计算得分时
  | 'damage_taken' // 受到伤害时（体力消耗）
  | 'buff_gained' // 获得Buff时
  | 'buff_lost' // 失去Buff时
  | 'attribute_changed' // 属性变化时
  | 'battle_start' // 战斗开始时
  | 'battle_end'; // 战斗结束时

/**
 * Buff效果函数
 *
 * 定义Buff触发时执行的效果
 */
export interface BuffEffect {
  trigger: BuffTrigger; // 触发时机
  effect: (state: BattleState, context?: BuffEffectContext) => void; // 效果函数
  description?: string; // 效果描述（用于UI显示）
}

/**
 * Buff效果上下文
 *
 * 传递给Buff效果函数的额外信息
 */
export interface BuffEffectContext {
  // 通用
  sourceCard?: any; // 触发的技能卡
  triggeredBy?: string; // 触发者ID

  // 计算得分时
  baseScore?: number; // 基础分数
  attribute?: 'vocal' | 'dance' | 'visual'; // 得分属性

  // 使用卡牌时
  cardType?: 'A' | 'M' | 'T'; // 卡牌类型
  cardCost?: number; // 卡牌Cost

  // 属性变化时
  attributeName?: string; // 属性名称
  oldValue?: number; // 旧值
  newValue?: number; // 新值
  delta?: number; // 变化量

  // 其他
  metadata?: Record<string, any>; // 额外数据
}

/**
 * Buff分类
 */
export type BuffCategory =
  | 'positive' // 正面Buff
  | 'negative'; // 负面Buff（Debuff）

/**
 * Buff数据结构
 *
 * 定义一个完整的Buff
 */
export interface Buff {
  id: string; // Buff唯一ID（如 'good_condition_1'）
  name: string; // Buff名称（如 '好調'）
  type: BuffType; // Buff类型
  category: BuffCategory; // 分类（正面/负面）

  // 数值相关
  stacks: number; // 层数（0表示不可叠加）
  duration: number; // 持续回合数（-1表示永久，直到消耗）

  // 效果相关
  effects: BuffEffect[]; // Buff效果列表

  // UI相关
  iconUrl?: string; // 图标URL
  description?: string; // 描述文本
  color?: string; // 显示颜色（如 '#4CAF50' 表示绿色）

  // 元数据
  source?: string; // 来源（如技能卡ID）
  timestamp?: number; // 添加时间戳
  metadata?: Record<string, any>; // 额外数据
}

/**
 * Buff栈
 *
 * 管理同类型Buff的叠加
 */
export interface BuffStack {
  type: BuffType; // Buff类型
  instances: Buff[]; // Buff实例列表
  totalStacks: number; // 总层数
  maxDuration: number; // 最长持续时间
}

/**
 * Buff管理器配置
 */
export interface BuffManagerConfig {
  maxBuffs?: number; // 最大Buff数量（默认无限制）
  allowDuplicates?: boolean; // 是否允许重复同类型Buff（默认false）
  autoCleanup?: boolean; // 是否自动清理过期Buff（默认true）
}

/**
 * Buff变化事件
 */
export interface BuffChangeEvent {
  type: 'added' | 'removed' | 'updated' | 'expired';
  buff: Buff;
  oldValue?: number; // 旧层数/回合数
  newValue?: number; // 新层数/回合数
  timestamp: number;
}
