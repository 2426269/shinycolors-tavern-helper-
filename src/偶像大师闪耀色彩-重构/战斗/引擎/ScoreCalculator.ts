/**
 * 得分计算器
 * 应用各种Buff加成计算最终得分
 */

import type { BattleState } from '../类型';
import { BuffManager } from './BuffManager';

export class ScoreCalculator {
  /**
   * 计算最终得分
   * @param baseScore 基础得分
   * @param state 战斗状态
   * @returns 最终得分
   */
  static calculate(baseScore: number, state: BattleState): number {
    let score = baseScore;
    const logs: string[] = [];

    // 1. 检查低迷（得分归零）
    if (BuffManager.hasBuff(state, 'SLUMP')) {
      logs.push('[低迷] 得分归零');
      console.log('[得分] ' + logs.join(' → '));
      return 0;
    }

    // 2. 检查不调（-33%）
    if (BuffManager.hasBuff(state, 'BAD_CONDITION')) {
      const newScore = Math.floor(score * 0.67);
      logs.push(`[不调] ${score} × 0.67 = ${newScore}`);
      score = newScore;
    }

    // 3. 好调加成（+50%）
    if (BuffManager.hasBuff(state, 'GOOD_CONDITION')) {
      const newScore = Math.floor(score * 1.5);
      logs.push(`[好调] ${score} × 1.5 = ${newScore}`);
      score = newScore;
    }

    // 4. 绝好调加成（每层+10%）
    const excellentStacks = BuffManager.getStacks(state, 'EXCELLENT_CONDITION');
    if (excellentStacks > 0) {
      const multiplier = 1 + excellentStacks * 0.1;
      const newScore = Math.floor(score * multiplier);
      logs.push(`[绝好调×${excellentStacks}] ${score} × ${multiplier} = ${newScore}`);
      score = newScore;
    }

    // 5. 集中加成（每层+固定值）
    if (state.concentration > 0) {
      const bonus = state.concentration;
      logs.push(`[集中×${state.concentration}] +${bonus}`);
      score += bonus;
    }

    // 6. 全力状态（+200%）
    if (BuffManager.hasBuff(state, 'ALLOUT_STATE')) {
      const newScore = score * 3;
      logs.push(`[全力状态] ${score} × 3 = ${newScore}`);
      score = newScore;
    }

    // 7. 强气状态一阶（+100%）
    if (BuffManager.hasBuff(state, 'RESOLUTE_STATE')) {
      const phase = state.anomalyPhase;
      const multiplier = phase === 1 ? 2 : 2.5; // 一阶+100%，二阶+150%
      const newScore = Math.floor(score * multiplier);
      logs.push(`[强气${phase}阶] ${score} × ${multiplier} = ${newScore}`);
      score = newScore;
    }

    // 8. 温存状态（-50%或-75%）
    if (BuffManager.hasBuff(state, 'CONSERVE_STATE')) {
      const phase = state.anomalyPhase;
      const multiplier = phase === 1 ? 0.5 : 0.25; // 一阶-50%，二阶-75%
      const newScore = Math.floor(score * multiplier);
      logs.push(`[温存${phase}阶] ${score} × ${multiplier} = ${newScore}`);
      score = newScore;
    }

    if (logs.length > 0) {
      console.log('[得分] ' + logs.join(' → '));
    }

    return Math.floor(score);
  }

  /**
   * 计算好印象百分比得分
   * @param percent 百分比（如90表示90%）
   * @param state 战斗状态
   */
  static calculateFromGoodImpression(percent: number, state: BattleState): number {
    const baseScore = Math.floor((state.goodImpression * percent) / 100);
    return this.calculate(baseScore, state);
  }

  /**
   * 计算集中百分比得分
   */
  static calculateFromConcentration(percent: number, state: BattleState): number {
    const baseScore = Math.floor((state.concentration * percent) / 100);
    return this.calculate(baseScore, state);
  }
}
