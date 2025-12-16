/**
 * 效果引擎
 * 执行技能卡的所有效果
 */

import type { BattleState, BuffType, Effect } from '../类型';
import { BuffManager } from './BuffManager';
import { ScoreCalculator } from './ScoreCalculator';

export interface EffectResult {
  success: boolean;
  scoreGained: number;
  logs: string[];
}

export class EffectEngine {
  /**
   * 执行效果列表
   * @param state 战斗状态
   * @param effects 效果列表
   * @param doubleEffect 是否翻倍
   */
  static execute(state: BattleState, effects: Effect[], doubleEffect: boolean = false): EffectResult {
    const result: EffectResult = {
      success: true,
      scoreGained: 0,
      logs: [],
    };

    const multiplier = doubleEffect ? 2 : 1;

    for (const effect of effects) {
      // 检查条件
      if (effect.condition && !this.checkCondition(state, effect.condition)) {
        result.logs.push(`[条件不满足] ${effect.type}`);
        continue;
      }

      const effectResult = this.executeEffect(state, effect, multiplier);
      result.scoreGained += effectResult.scoreGained;
      result.logs.push(...effectResult.logs);

      if (!effectResult.success) {
        result.success = false;
        break;
      }
    }

    return result;
  }

  /**
   * 执行单个效果
   */
  private static executeEffect(state: BattleState, effect: Effect, multiplier: number): EffectResult {
    const result: EffectResult = {
      success: true,
      scoreGained: 0,
      logs: [],
    };

    const value = (effect.value || 0) * multiplier;

    switch (effect.type) {
      // ==================== 资源操作 ====================
      case 'ADD_GENKI':
        state.genki = Math.min(100, state.genki + value);
        result.logs.push(`元气 +${value} → ${state.genki}`);
        break;

      case 'ADD_STAMINA':
        state.stamina = Math.min(state.maxStamina, state.stamina + value);
        result.logs.push(`体力 +${value} → ${state.stamina}`);
        break;

      case 'CONSUME_GENKI':
        if (state.genki < value) {
          result.success = false;
          result.logs.push(`元气不足: 需要${value}, 当前${state.genki}`);
        } else {
          state.genki -= value;
          result.logs.push(`元气 -${value} → ${state.genki}`);
        }
        break;

      case 'CONSUME_STAMINA':
        // ⚠️ 明确的体力消耗，必须扣体力
        if (state.stamina < value) {
          result.success = false;
          result.logs.push(`体力不足: 需要${value}, 当前${state.stamina}`);
        } else {
          state.stamina -= value;
          result.logs.push(`体力 -${value} → ${state.stamina}`);
        }
        break;

      // ==================== 属性操作（感性） ====================
      case 'ADD_CONCENTRATION':
        state.concentration += value;
        result.logs.push(`集中 +${value} → ${state.concentration}`);
        break;

      case 'CONSUME_CONCENTRATION':
        if (state.concentration < value) {
          result.success = false;
          result.logs.push(`集中不足: 需要${value}, 当前${state.concentration}`);
        } else {
          state.concentration -= value;
          result.logs.push(`集中 -${value} → ${state.concentration}`);
        }
        break;

      // ==================== 属性操作（理性） ====================
      case 'ADD_MOTIVATION':
        state.motivation += value;
        result.logs.push(`干劲 +${value} → ${state.motivation}`);
        break;

      case 'ADD_GOOD_IMPRESSION':
        state.goodImpression += value;
        result.logs.push(`好印象 +${value} → ${state.goodImpression}`);
        break;

      case 'CONSUME_MOTIVATION':
        if (state.motivation < value) {
          result.success = false;
          result.logs.push(`干劲不足: 需要${value}, 当前${state.motivation}`);
        } else {
          state.motivation -= value;
          result.logs.push(`干劲 -${value} → ${state.motivation}`);
        }
        break;

      case 'CONSUME_GOOD_IMPRESSION':
        if (state.goodImpression < value) {
          result.success = false;
          result.logs.push(`好印象不足: 需要${value}`);
        } else {
          state.goodImpression -= value;
          result.logs.push(`好印象 -${value} → ${state.goodImpression}`);
        }
        break;

      // ==================== 属性操作（非凡） ====================
      case 'ADD_ALL_POWER':
        state.allPower = Math.min(10, state.allPower + value);
        result.logs.push(`全力值 +${value} → ${state.allPower}`);

        // 全力值满10时可以进入全力状态
        if (state.allPower >= 10) {
          result.logs.push(`全力值已满，可进入全力状态`);
        }
        break;

      case 'ADD_HEAT':
        state.heat += value;
        result.logs.push(`热意 +${value} → ${state.heat}`);
        break;

      case 'CONSUME_ALL_POWER':
        if (state.allPower < value) {
          result.success = false;
          result.logs.push(`全力值不足: 需要${value}`);
        } else {
          state.allPower -= value;
          result.logs.push(`全力值 -${value} → ${state.allPower}`);
        }
        break;

      // ==================== Buff操作 ====================
      case 'ADD_BUFF':
        if (effect.target) {
          BuffManager.addBuff(state, effect.target as BuffType, value || 1, effect.duration || -1);
          result.logs.push(`添加Buff: ${effect.target}`);
        }
        break;

      case 'REMOVE_BUFF':
        if (effect.target) {
          BuffManager.removeBuff(state, effect.target as BuffType);
          result.logs.push(`移除Buff: ${effect.target}`);
        }
        break;

      case 'CONSUME_BUFF':
        if (effect.target) {
          const consumed = BuffManager.consumeBuff(state, effect.target as BuffType, value || 1);
          if (!consumed) {
            result.success = false;
            result.logs.push(`Buff不足: ${effect.target}`);
          } else {
            result.logs.push(`消耗Buff: ${effect.target} x${value || 1}`);
          }
        }
        break;

      // ==================== 得分操作 ====================
      case 'ADD_SCORE':
        const finalScore = ScoreCalculator.calculate(value, state);
        state.score += finalScore;
        result.scoreGained = finalScore;
        result.logs.push(`得分 +${value} → 实际+${finalScore} (总分: ${state.score})`);
        break;

      case 'ADD_SCORE_PERCENT':
        // 百分比转换（基于好印象）
        const percentScore = ScoreCalculator.calculateFromGoodImpression(value, state);
        state.score += percentScore;
        result.scoreGained = percentScore;
        result.logs.push(`好印象${value}%转得分: +${percentScore}`);
        break;

      // ==================== 卡牌操作 ====================
      case 'DRAW_CARDS':
        // 抽牌逻辑在BattleEngine中处理
        result.logs.push(`抽牌 +${value}`);
        break;

      case 'EXTRA_CARD_USE':
        state.maxCardsPerTurn += value;
        result.logs.push(`技能卡使用数 +${value} (本回合可用: ${state.maxCardsPerTurn})`);
        break;

      case 'DOUBLE_NEXT_CARD':
        state.nextCardDouble = true;
        result.logs.push(`下一张卡效果翻倍`);
        break;

      // ==================== 状态切换（非凡） ====================
      case 'SWITCH_TO_ALLOUT':
        if (state.allPower >= 10) {
          state.allPower = 0;
          state.anomalyState = 'allout';
          state.anomalyPhase = 1;
          BuffManager.addBuff(state, 'ALLOUT_STATE', 1, 3);
          result.logs.push(`进入全力状态`);
        } else {
          result.logs.push(`全力值不足，无法进入全力状态`);
        }
        break;

      case 'SWITCH_TO_CONSERVE':
        state.anomalyState = 'conserve';
        state.anomalyPhase = 1;
        BuffManager.removeBuff(state, 'ALLOUT_STATE');
        BuffManager.removeBuff(state, 'RESOLUTE_STATE');
        BuffManager.addBuff(state, 'CONSERVE_STATE', 1, -1);
        result.logs.push(`切换至温存状态`);
        break;

      case 'SWITCH_TO_RESOLUTE':
        state.anomalyState = 'resolute';
        state.anomalyPhase = 1;
        BuffManager.removeBuff(state, 'ALLOUT_STATE');
        BuffManager.removeBuff(state, 'CONSERVE_STATE');
        BuffManager.addBuff(state, 'RESOLUTE_STATE', 1, -1);
        result.logs.push(`切换至强气状态`);
        break;

      default:
        result.logs.push(`未知效果类型: ${effect.type}`);
    }

    return result;
  }

  /**
   * 检查条件
   */
  private static checkCondition(state: BattleState, condition: Effect['condition']): boolean {
    if (!condition) return true;

    switch (condition.type) {
      case 'ATTRIBUTE_GTE':
        return this.getAttribute(state, condition.target) >= (condition.value || 0);

      case 'ATTRIBUTE_LTE':
        return this.getAttribute(state, condition.target) <= (condition.value || 0);

      case 'BUFF_EXISTS':
        return BuffManager.hasBuff(state, condition.target as BuffType);

      case 'BUFF_NOT_EXISTS':
        return !BuffManager.hasBuff(state, condition.target as BuffType);

      default:
        return true;
    }
  }

  /**
   * 获取属性值
   */
  private static getAttribute(state: BattleState, name: string): number {
    switch (name) {
      case 'genki':
        return state.genki;
      case 'stamina':
        return state.stamina;
      case 'concentration':
        return state.concentration;
      case 'motivation':
        return state.motivation;
      case 'goodImpression':
        return state.goodImpression;
      case 'allPower':
        return state.allPower;
      case 'heat':
        return state.heat;
      default:
        return 0;
    }
  }
}
