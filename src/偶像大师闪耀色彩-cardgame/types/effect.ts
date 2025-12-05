/**
 * 技能卡效果系统类型定义
 *
 * 这个文件定义了所有效果相关的类型，包括：
 * - 效果类型（EffectType）
 * - 效果目标（EffectTarget）
 * - 效果条件（EffectCondition）
 * - 技能卡效果（SkillCardEffect）
 */

import type { BattleState } from './battle-state';
import type { BuffType } from './buff';

/**
 * 效果类型枚举
 *
 * 定义了游戏中所有可能的效果类型
 */
export type EffectType =
  // ========== 资源操作 ==========
  | 'recover_stamina' // 回复体力
  | 'gain_genki' // 获得元气
  | 'consume_stamina' // 消耗体力
  | 'consume_genki' // 消耗元气

  // ========== 属性操作（感性系统） ==========
  | 'add_concentration' // 增加专注（集中）
  | 'consume_concentration' // 消耗专注

  // ========== 属性操作（理性系统） ==========
  | 'add_motivation' // 增加干劲
  | 'add_good_impression' // 增加好印象
  | 'consume_motivation' // 消耗干劲
  | 'consume_good_impression' // 消耗好印象

  // ========== 属性操作（非凡系统） ==========
  | 'add_all_power' // 增加全力值
  | 'add_heat' // 增加热意值
  | 'consume_all_power' // 消耗全力值

  // ========== 属性操作（通用） ==========
  | 'add_energy' // 增加活力
  | 'consume_energy' // 消耗活力

  // ========== Buff操作 ==========
  | 'add_buff' // 增加Buff
  | 'remove_buff' // 移除Buff
  | 'consume_buff' // 消耗Buff（减少层数/回合数）
  | 'extend_buff' // 延长Buff持续时间

  // ========== 得分相关 ==========
  | 'add_score' // 直接加分
  | 'add_score_multiplier' // 加分（基于三维，如 [Vocal] × 3.0）
  | 'add_score_percentage' // 加分（基于当前分数，如分数+20%）

  // ========== 卡牌操作 ==========
  | 'draw_cards' // 抽牌
  | 'add_card_uses' // 增加本回合使用数
  | 'duplicate_next_card' // 下一张卡效果发动2次
  | 'move_card_to_top' // 将卡移至牌堆顶
  | 'move_card_to_hand' // 将卡移至手牌
  | 'remove_card' // 除外卡牌（移出游戏）
  | 'discard_card' // 弃置卡牌
  | 'shuffle_deck' // 洗牌

  // ========== 回合操作 ==========
  | 'add_extra_turn' // 额外回合
  | 'skip_next_turn' // 跳过下一回合
  | 'end_turn_immediately' // 立即结束回合

  // ========== 状态切换（非凡系统） ==========
  | 'switch_anomaly_state' // 切换非凡状态
  | 'lock_anomaly_pointer' // 锁定指针
  | 'unlock_anomaly_pointer' // 解锁指针

  // ========== 特殊效果 ==========
  | 'heal_all' // 回复所有资源
  | 'clear_debuffs' // 清除所有负面Buff
  | 'random_effect' // 随机效果
  | 'conditional_effect' // 条件效果（if-then）
  | 'chain_effect'; // 连锁效果

/**
 * 效果目标
 *
 * 定义效果作用的目标范围
 */
export type EffectTarget =
  | 'self' // 自己
  | 'hand' // 手牌
  | 'deck' // 牌堆
  | 'discard' // 弃牌堆
  | 'removed' // 除外区
  | 'all' // 所有区域
  | 'random'; // 随机目标

/**
 * 效果条件类型
 */
export type EffectConditionType =
  | 'attribute_gte' // 属性 >= 值
  | 'attribute_lte' // 属性 <= 值
  | 'attribute_eq' // 属性 == 值
  | 'buff_exists' // Buff存在
  | 'buff_stacks_gte' // Buff层数 >= 值
  | 'turn_range' // 回合范围内
  | 'turn_gte' // 回合 >= 值
  | 'card_type' // 卡牌类型匹配
  | 'card_rarity' // 卡牌稀有度匹配
  | 'stamina_gte' // 体力 >= 值
  | 'genki_gte' // 元气 >= 值
  | 'score_gte' // 得分 >= 值
  | 'hand_size_gte' // 手牌数 >= 值
  | 'custom'; // 自定义检查函数

/**
 * 效果条件
 *
 * 定义效果触发的条件
 */
export interface EffectCondition {
  type: EffectConditionType; // 条件类型
  key?: string; // 属性键或Buff类型
  value?: number | string | boolean | [number, number]; // 比较值
  customCheck?: (state: BattleState) => boolean; // 自定义检查函数
}

/**
 * 技能卡效果
 *
 * 定义单个效果的完整数据结构
 */
export interface SkillCardEffect {
  type: EffectType; // 效果类型
  target?: EffectTarget; // 作用目标（可选）
  value?: number; // 数值参数（可选）
  condition?: EffectCondition; // 触发条件（可选）
  duration?: number; // 持续时间/回合数（可选）
  metadata?: Record<string, any>; // 额外数据（用于复杂效果）
}

/**
 * 效果执行结果
 */
export interface EffectExecutionResult {
  success: boolean; // 是否成功执行
  logs: string[]; // 日志信息
  scoreGained: number; // 获得的分数
  triggeredEffects?: SkillCardEffect[]; // 触发的连锁效果
}

/**
 * 效果元数据类型定义
 *
 * 为常用的metadata提供类型安全
 */
export interface AddBuffMetadata {
  buffType: BuffType; // Buff类型
  stacks?: number; // 层数（默认1）
  duration?: number; // 持续回合数（默认3）
}

export interface ScoreMultiplierMetadata {
  attribute: 'vocal' | 'dance' | 'visual'; // 属性
  multiplier: number; // 倍率
}

export interface ConditionalEffectMetadata {
  condition: EffectCondition; // 条件
  ifTrue: SkillCardEffect[]; // 条件为真时的效果
  ifFalse?: SkillCardEffect[]; // 条件为假时的效果（可选）
}

export interface ChainEffectMetadata {
  effects: SkillCardEffect[]; // 连锁效果列表
  delay?: number; // 延迟回合数（默认0，立即执行）
}
