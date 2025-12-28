/**
 * LegacyEffectAdapter - 旧版效果适配器
 * 将旧版 Effect[] 转换为新版 AtomicStep[]
 */

import type { BuffType, Effect, EffectCondition } from '../类型';
import type { AtomicAction, AtomicStep, JsonLogicExpression, StandardBuffId } from './types';

// ==================== BuffType 映射 ====================

const BUFF_TYPE_MAP: Record<BuffType, StandardBuffId | string> = {
  GOOD_CONDITION: 'GoodCondition',
  EXCELLENT_CONDITION: 'ExcellentCondition',
  MOTIVATED: 'Motivation',
  STAMINA_REDUCTION: 'StaminaReduction',
  LESSON_ENHANCE: 'std:lesson_enhance',
  ALLOUT_STATE: 'AlloutState',
  CONSERVE_STATE: 'ConserveState',
  RESOLUTE_STATE: 'ResoluteState',
  BAD_CONDITION: 'std:bad_condition',
  SLUMP: 'std:slump',
};

// ==================== 条件转换 ====================

/**
 * 将旧版条件转换为 JSON Logic 表达式
 */
function convertCondition(condition: EffectCondition): JsonLogicExpression {
  const { type, target, value } = condition;

  switch (type) {
    case 'ATTRIBUTE_GTE':
      return { '>=': [{ var: `player.${target.toLowerCase()}` }, value ?? 0] };

    case 'ATTRIBUTE_LTE':
      return { '<=': [{ var: `player.${target.toLowerCase()}` }, value ?? 0] };

    case 'BUFF_EXISTS':
      return { '>': [{ var: `player.buffs.${BUFF_TYPE_MAP[target as BuffType] || target}` }, 0] };

    case 'BUFF_NOT_EXISTS':
      return { '<=': [{ var: `player.buffs.${BUFF_TYPE_MAP[target as BuffType] || target}` }, 0] };

    default:
      console.warn(`未知条件类型: ${type}`);
      return true; // 默认为真
  }
}

// ==================== 效果转换 ====================

/**
 * 将单个旧版 Effect 转换为 AtomicAction
 */
function convertEffect(effect: Effect): AtomicAction | null {
  const { type, value, target, duration } = effect;

  switch (type) {
    // ========== 资源操作 ==========
    case 'ADD_GENKI':
      return { action: 'MODIFY_GENKI', value: value ?? 0 };

    case 'CONSUME_GENKI':
      return { action: 'MODIFY_GENKI', value: -(value ?? 0) };

    case 'ADD_STAMINA':
      return { action: 'MODIFY_GENKI', value: value ?? 0 }; // 体力恢复也用 MODIFY_GENKI

    case 'CONSUME_STAMINA':
      return { action: 'MODIFY_GENKI', value: -(value ?? 0) };

    // ========== 属性操作（感性）==========
    case 'ADD_CONCENTRATION':
      return {
        action: 'ADD_BUFF',
        buff_id: 'Concentration',
        value: value ?? 1,
        turns: -1, // 永久
      };

    case 'CONSUME_CONCENTRATION':
      // 消耗集中得分
      return {
        action: 'GAIN_SCORE',
        value_expression: { '*': [{ var: 'player.concentration' }, value ?? 1] },
      };

    // ========== 属性操作（理性）==========
    case 'ADD_MOTIVATION':
      return {
        action: 'ADD_BUFF',
        buff_id: 'Motivation',
        value: value ?? 1,
        turns: -1,
      };

    case 'CONSUME_MOTIVATION':
      return {
        action: 'ADD_BUFF',
        buff_id: 'Motivation',
        value: -(value ?? 1),
        turns: -1,
      };

    case 'ADD_GOOD_IMPRESSION':
      return {
        action: 'ADD_BUFF',
        buff_id: 'GoodImpression',
        value: value ?? 1,
        turns: -1,
      };

    case 'CONSUME_GOOD_IMPRESSION':
      // 消耗好印象得分
      return {
        action: 'GAIN_SCORE',
        value_expression: { '*': [{ var: 'player.good_impression' }, value ?? 1] },
      };

    // ========== 属性操作（非凡）==========
    case 'ADD_ALL_POWER':
      return {
        action: 'ADD_TAG',
        tag: 'std:all_power_gained',
        turns: -1,
      };

    case 'CONSUME_ALL_POWER':
      return {
        action: 'ADD_TAG',
        tag: 'std:all_power_consumed',
        turns: 1,
      };

    case 'ADD_HEAT':
      return {
        action: 'ADD_TAG',
        tag: 'std:heat_gained',
        turns: -1,
      };

    // ========== Buff 操作 ==========
    case 'ADD_BUFF':
      if (!target) {
        console.warn('ADD_BUFF 缺少 target');
        return null;
      }
      return {
        action: 'ADD_BUFF',
        buff_id: BUFF_TYPE_MAP[target] || target,
        value: value ?? 1,
        turns: duration ?? -1,
      };

    case 'REMOVE_BUFF':
      // 移除 Buff 暂时用 ADD_BUFF 负值模拟
      return {
        action: 'ADD_BUFF',
        buff_id: BUFF_TYPE_MAP[target as BuffType] || target || '',
        value: -(value ?? 999), // 大负数以完全移除
        turns: -1,
      };

    case 'CONSUME_BUFF':
      return {
        action: 'ADD_BUFF',
        buff_id: BUFF_TYPE_MAP[target as BuffType] || target || '',
        value: -(value ?? 1),
        turns: -1,
      };

    // ========== 得分操作 ==========
    case 'ADD_SCORE':
      return { action: 'GAIN_SCORE', value: value ?? 0 };

    case 'ADD_SCORE_PERCENT':
      // 百分比加分，基于某属性
      return {
        action: 'GAIN_SCORE',
        multiplier_expression: { '+': [1, { '/': [value ?? 0, 100] }] },
      };

    // ========== 卡牌操作 ==========
    case 'DRAW_CARDS':
      return { action: 'DRAW_CARD', count: value ?? 1 };

    case 'EXTRA_CARD_USE':
      return { action: 'MODIFY_PLAY_LIMIT', value: value ?? 1 };

    case 'DOUBLE_NEXT_CARD':
      return {
        action: 'ADD_TAG',
        tag: 'std:double_next_card',
        turns: 1,
      };

    // ========== 状态切换（非凡）==========
    case 'SWITCH_TO_ALLOUT':
      return { action: 'ADD_BUFF', buff_id: 'AlloutState', value: 1, turns: -1 };

    case 'SWITCH_TO_CONSERVE':
      return { action: 'ADD_BUFF', buff_id: 'ConserveState', value: 1, turns: -1 };

    case 'SWITCH_TO_RESOLUTE':
      return { action: 'ADD_BUFF', buff_id: 'ResoluteState', value: 1, turns: -1 };

    default:
      console.warn(`未知效果类型: ${type}`);
      return null;
  }
}

// ==================== 主适配函数 ====================

/**
 * 将旧版 Effect[] 转换为新版 AtomicStep[]
 */
export function adaptLegacyEffects(effects: Effect[]): AtomicStep[] {
  const steps: AtomicStep[] = [];

  for (const effect of effects) {
    const action = convertEffect(effect);
    if (!action) continue;

    // 如果有条件，创建带条件的步骤
    if (effect.condition) {
      steps.push({
        when: convertCondition(effect.condition),
        do: [action],
      });
    } else {
      // 无条件，直接执行
      steps.push({
        do: [action],
      });
    }
  }

  return steps;
}

/**
 * 合并连续的无条件步骤
 * 优化：减少步骤数量
 */
export function optimizeSteps(steps: AtomicStep[]): AtomicStep[] {
  const result: AtomicStep[] = [];
  let currentUnconditional: AtomicAction[] = [];

  for (const step of steps) {
    if (!step.when) {
      // 无条件步骤，收集动作
      currentUnconditional.push(...step.do);
    } else {
      // 有条件步骤
      // 先推送之前收集的无条件动作
      if (currentUnconditional.length > 0) {
        result.push({ do: currentUnconditional });
        currentUnconditional = [];
      }
      // 推送有条件步骤
      result.push(step);
    }
  }

  // 推送剩余的无条件动作
  if (currentUnconditional.length > 0) {
    result.push({ do: currentUnconditional });
  }

  return result;
}

/**
 * 一站式转换并优化
 */
export function convertAndOptimize(effects: Effect[]): AtomicStep[] {
  const steps = adaptLegacyEffects(effects);
  return optimizeSteps(steps);
}

// ==================== 调试工具 ====================

/**
 * 打印转换结果（调试用）
 */
export function debugConversion(effects: Effect[]): void {
  console.log('=== Legacy Effects ===');
  console.log(JSON.stringify(effects, null, 2));

  console.log('\n=== Converted Steps ===');
  const steps = convertAndOptimize(effects);
  console.log(JSON.stringify(steps, null, 2));
}
