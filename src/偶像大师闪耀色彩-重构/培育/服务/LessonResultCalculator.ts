/**
 * 课程结果计算器 (LessonResultCalculator.ts)
 * Phase 7.2 Step 2: 整合 BattleConfigs 计算课程最终属性增益
 */

import {
  type LessonType,
  type RankGrade,
  calculateDistributionWeights,
  determineRankGrade,
  distributeStatGains,
  getLessonBattleConfig,
  getStaminaCorrection,
  RANK_MULTIPLIERS,
} from '../数据/BattleConfigs';
import type { IdolStats, LessonBonus, ScenarioId } from '../类型/ProduceTypes';

// ==================== 类型定义 ====================

/** 课程战斗结果 (来自战斗引擎) */
export interface LessonBattleResult {
  score: number; // 战斗分数
  finalStamina: number; // 战斗结束时体力
  maxStamina: number; // 最大体力
  cardsPlayed: number; // 打出卡牌数
  turnsUsed: number; // 使用回合数
}

/** 课程最终结果 */
export interface LessonFinalResult {
  // 战斗评价
  rankGrade: RankGrade;
  rankMultiplier: number;

  // 属性增益
  statGains: IdolStats;
  totalGain: number;

  // 计算细节 (用于 UI 展示)
  details: {
    baseGain: number;
    lessonBonusEffect: number;
    staminaCorrectionEffect: number;
    rankMultiplierEffect: number;
  };
}

// ==================== 核心计算函数 ====================

/**
 * 计算课程最终结果
 * @param scenarioId 剧本ID
 * @param lessonType 课程类型 (NORMAL/SP)
 * @param primaryStat 主训练属性 (vocal/dance/visual)
 * @param battleResult 战斗结果
 * @param lessonBonus 训练加成 (来自角色卡)
 * @param currentStats 当前属性值 (用于权重分配)
 */
export function calculateLessonResult(
  scenarioId: ScenarioId,
  lessonType: LessonType,
  primaryStat: 'vocal' | 'dance' | 'visual',
  battleResult: LessonBattleResult,
  lessonBonus: LessonBonus,
  currentStats: IdolStats,
): LessonFinalResult {
  // 1. 获取课程配置
  const config = getLessonBattleConfig(scenarioId, lessonType);

  // 2. 判定评级
  const rankGrade = determineRankGrade(battleResult.score, config.targetScore);
  const rankMultiplier = RANK_MULTIPLIERS[rankGrade];

  // 3. 获取体力补正
  const staminaCorrection = getStaminaCorrection(battleResult.finalStamina, battleResult.maxStamina);

  // 4. 获取对应属性的训练加成
  const primaryLessonBonus = lessonBonus[primaryStat];

  // 5. 计算总增益
  // 公式: ⌊基础值 × (1 + 训练加成 + 体力补正) × 评级倍率⌋
  const baseGain = config.baseStatGain;
  const bonusMultiplier = 1 + primaryLessonBonus + staminaCorrection;
  const totalGain = Math.floor(baseGain * bonusMultiplier * rankMultiplier);

  // 6. 权重分配到三维
  const weights = calculateDistributionWeights(primaryStat, currentStats, lessonType === 'SP');
  const statGains = distributeStatGains(totalGain, weights);

  // 7. 计算细节 (用于 UI 展示)
  const lessonBonusEffect = Math.floor(baseGain * primaryLessonBonus);
  const staminaCorrectionEffect = Math.floor(baseGain * staminaCorrection);
  const rankMultiplierEffect = Math.floor(baseGain * bonusMultiplier * (rankMultiplier - 1));

  return {
    rankGrade,
    rankMultiplier,
    statGains,
    totalGain,
    details: {
      baseGain,
      lessonBonusEffect,
      staminaCorrectionEffect,
      rankMultiplierEffect,
    },
  };
}

/**
 * 快速计算课程预估收益 (用于 UI 预览)
 * 假设 Perfect 评级和满体力
 */
export function estimateLessonGain(
  scenarioId: ScenarioId,
  lessonType: LessonType,
  primaryStat: 'vocal' | 'dance' | 'visual',
  lessonBonus: LessonBonus,
): number {
  const config = getLessonBattleConfig(scenarioId, lessonType);
  const primaryLessonBonusValue = lessonBonus[primaryStat];

  // 假设 Perfect + 满体力 (+10%)
  const bonusMultiplier = 1 + primaryLessonBonusValue + 0.1;
  const perfectMultiplier = RANK_MULTIPLIERS.PERFECT;

  return Math.floor(config.baseStatGain * bonusMultiplier * perfectMultiplier);
}

/**
 * 生成课程结果文本描述 (用于 UI)
 */
export function formatLessonResultText(result: LessonFinalResult): string {
  const gradeEmoji: Record<RankGrade, string> = {
    PERFECT: '🌟',
    GREAT: '⭐',
    PASS: '✓',
    FAIL: '✗',
  };

  const emoji = gradeEmoji[result.rankGrade];
  const gains = result.statGains;

  return (
    `${emoji} ${result.rankGrade} (${result.rankMultiplier}x)\n` +
    `Vo +${gains.vocal} / Da +${gains.dance} / Vi +${gains.visual}`
  );
}

// ==================== 导出 ====================

export default {
  calculateLessonResult,
  estimateLessonGain,
  formatLessonResultText,
};
