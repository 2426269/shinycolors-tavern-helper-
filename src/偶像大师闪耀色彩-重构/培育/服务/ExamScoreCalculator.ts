/**
 * 考试分数计算器 (ExamScoreCalculator.ts)
 * Phase 7.2: 基于社区验证公式实现考试分数计算
 *
 * 公式来源: Gemini 研究笔记 + WikiWiki
 * - CorrectedStat: 补正后三维 (收益递减)
 * - JudgeRate: 审查基准倍率
 * - Penalty: 低属性惩罚
 * - ScoreBonus: 最终分数加成百分比
 */

import type { IdolStats } from '../类型/ProduceTypes';

// ==================== 类型定义 ====================

/** 审查基准倍率配置 */
export interface JudgeRateConfig {
  vocal: number; // Vo 审查倍率 (0-1)
  dance: number; // Da 审查倍率 (0-1)
  visual: number; // Vi 审查倍率 (0-1)
}

/** 分数加成结果 */
export interface ScoreBonusResult {
  vocal: number; // Vo 加成百分比
  dance: number; // Da 加成百分比
  visual: number; // Vi 加成百分比
  total: number; // 总加成
}

/** 最终评价结果 */
export interface FinalEvaluationResult {
  parameterScore: number; // 三维合计 × 2.3
  rankScore: number; // 排名得分
  examScoreBonus: number; // 考试分数换算
  totalEvaluation: number; // 最终评价点
  grade: string; // 评级 (SS/S+/S/A+/...)
}

// ==================== 补正后三维计算 ====================

/**
 * 计算补正后三维 (CorrectedStat)
 * 阶梯式收益递减
 *
 * 0~300:   S × 5 + 1
 * 301~600: S × 4 + 300
 * 601~900: S × 3 + 900
 * 901~1200: S × 2 + 1800
 * 1201+:   S + 3000
 */
export function calculateCorrectedStat(rawStat: number): number {
  if (rawStat <= 0) return 1;

  if (rawStat <= 300) {
    return rawStat * 5 + 1;
  } else if (rawStat <= 600) {
    return rawStat * 4 + 300;
  } else if (rawStat <= 900) {
    return rawStat * 3 + 900;
  } else if (rawStat <= 1200) {
    return rawStat * 2 + 1800;
  } else {
    return rawStat + 3000;
  }
}

/**
 * 计算三维的补正后值
 */
export function calculateCorrectedStats(stats: IdolStats): IdolStats {
  return {
    vocal: calculateCorrectedStat(stats.vocal),
    dance: calculateCorrectedStat(stats.dance),
    visual: calculateCorrectedStat(stats.visual),
  };
}

// ==================== 惩罚计算 ====================

/**
 * 计算低属性惩罚 (Penalty)
 *
 * Penalty = rounddown(0.25 - S / (8000 × JudgeRate / 9) × 0.15)
 * 属性为 0 时惩罚 25%, 达到阈值后归零
 *
 * @param stat 原始属性值
 * @param judgeRate 该属性的审查倍率
 * @returns 惩罚值 (0 - 0.25)
 */
export function calculatePenalty(stat: number, judgeRate: number): number {
  if (judgeRate <= 0) return 0;

  const threshold = (8000 * judgeRate) / 9;
  const penalty = 0.25 - (stat / threshold) * 0.15;

  // 向下取整到 0.001
  const roundedPenalty = Math.floor(penalty * 1000) / 1000;

  // 限制在 0-0.25 范围内
  return Math.max(0, Math.min(0.25, roundedPenalty));
}

/**
 * 计算总惩罚 (所有属性中的最大惩罚)
 */
export function calculateTotalPenalty(stats: IdolStats, judgeRates: JudgeRateConfig): number {
  const vocalPenalty = calculatePenalty(stats.vocal, judgeRates.vocal);
  const dancePenalty = calculatePenalty(stats.dance, judgeRates.dance);
  const visualPenalty = calculatePenalty(stats.visual, judgeRates.visual);

  // 返回最大惩罚 (任何一维太低都会拖累整体)
  return Math.max(vocalPenalty, dancePenalty, visualPenalty);
}

// ==================== 分数加成计算 ====================

/**
 * 计算单属性的分数加成 (ScoreBonus)
 *
 * ScoreBonus = ceil(rounddown(ceil(CorrectedStat × JudgeRate × (1 - Penalty) + 100) × (1 + SupportBonus), 0.1))%
 *
 * @param correctedStat 补正后属性
 * @param judgeRate 审查倍率
 * @param penalty 惩罚值
 * @param supportBonus 支援卡加成 (默认 0)
 * @returns 分数加成百分比
 */
export function calculateScoreBonus(
  correctedStat: number,
  judgeRate: number,
  penalty: number,
  supportBonus: number = 0,
): number {
  // 基础分数
  const baseScore = correctedStat * judgeRate * (1 - penalty) + 100;

  // 向上取整
  const ceilScore = Math.ceil(baseScore);

  // 乘以支援卡加成
  const withSupport = ceilScore * (1 + supportBonus);

  // 向下取整到 0.1
  const rounded = Math.floor(withSupport * 10) / 10;

  // 最终向上取整
  return Math.ceil(rounded);
}

/**
 * 计算三维的分数加成
 */
export function calculateAllScoreBonuses(
  stats: IdolStats,
  judgeRates: JudgeRateConfig,
  supportBonus: number = 0,
): ScoreBonusResult {
  const corrected = calculateCorrectedStats(stats);
  const penalty = calculateTotalPenalty(stats, judgeRates);

  const vocal = calculateScoreBonus(corrected.vocal, judgeRates.vocal, penalty, supportBonus);
  const dance = calculateScoreBonus(corrected.dance, judgeRates.dance, penalty, supportBonus);
  const visual = calculateScoreBonus(corrected.visual, judgeRates.visual, penalty, supportBonus);

  return {
    vocal,
    dance,
    visual,
    total: vocal + dance + visual,
  };
}

// ==================== 最终评价计算 ====================

/** 排名得分映射 */
const RANK_SCORE_MAP: Record<number, number> = {
  1: 1700,
  2: 900,
  3: 500,
  4: 300,
  5: 200,
};

/** 评级阈值 */
const GRADE_THRESHOLDS = [
  { grade: 'SS', threshold: 16000 },
  { grade: 'S+', threshold: 14500 },
  { grade: 'S', threshold: 13000 },
  { grade: 'A+', threshold: 11500 },
  { grade: 'A', threshold: 10000 },
  { grade: 'B+', threshold: 8000 },
  { grade: 'B', threshold: 6000 },
  { grade: 'C+', threshold: 4500 },
  { grade: 'C', threshold: 3000 },
  { grade: 'D', threshold: 0 },
];

/**
 * 考试分数换算 (分段衰减)
 *
 * 0~5000: × 0.30
 * 5001~10000: × 0.15 + 750
 * 10001~20000: × 0.08 + 1450
 * 20001~30000: × 0.04 + 2250
 * 30001~40000: × 0.02 + 2850
 * 40001~199999: × 0.01 + 3250
 * 200000+: 5250 (上限)
 */
export function convertExamScore(rawScore: number): number {
  if (rawScore <= 0) return 0;

  if (rawScore <= 5000) {
    return Math.floor(rawScore * 0.3);
  } else if (rawScore <= 10000) {
    return Math.floor(rawScore * 0.15 + 750);
  } else if (rawScore <= 20000) {
    return Math.floor(rawScore * 0.08 + 1450);
  } else if (rawScore <= 30000) {
    return Math.floor(rawScore * 0.04 + 2250);
  } else if (rawScore <= 40000) {
    return Math.floor(rawScore * 0.02 + 2850);
  } else if (rawScore < 200000) {
    return Math.floor(rawScore * 0.01 + 3250);
  } else {
    return 5250; // 上限
  }
}

/**
 * 根据评价点获取评级
 */
export function getGradeFromEvaluation(evaluation: number): string {
  for (const { grade, threshold } of GRADE_THRESHOLDS) {
    if (evaluation >= threshold) {
      return grade;
    }
  }
  return 'D';
}

/**
 * 计算最终评价
 *
 * 评价点 = 三维合计 × 2.3 + 排名点 + 考试分数换算
 */
export function calculateFinalEvaluation(stats: IdolStats, examScore: number, rank: number): FinalEvaluationResult {
  // 1. 三维合计 × 2.3
  const totalStats = stats.vocal + stats.dance + stats.visual;
  const parameterScore = Math.floor(totalStats * 2.3);

  // 2. 排名得分
  const rankScore = RANK_SCORE_MAP[rank] || 0;

  // 3. 考试分数换算
  const examScoreBonus = convertExamScore(examScore);

  // 4. 总评价
  const totalEvaluation = parameterScore + rankScore + examScoreBonus;

  // 5. 评级
  const grade = getGradeFromEvaluation(totalEvaluation);

  console.log(`[ExamScoreCalculator] 最终评价:`, {
    parameterScore,
    rankScore,
    examScoreBonus,
    totalEvaluation,
    grade,
  });

  return {
    parameterScore,
    rankScore,
    examScoreBonus,
    totalEvaluation,
    grade,
  };
}

// ==================== 回合分数计算 ====================

/**
 * 计算单回合的分数
 *
 * @param cardPower 卡牌威力
 * @param scoreBonus 当前属性的分数加成 (%)
 * @param otherMultipliers 其他乘区 (如 Buff、好调等)
 */
export function calculateTurnScore(cardPower: number, scoreBonus: number, otherMultipliers: number = 1.0): number {
  // 分数 = 卡牌威力 × (1 + ScoreBonus/100) × 其他乘区
  return Math.floor(cardPower * (1 + scoreBonus / 100) * otherMultipliers);
}

// ==================== 预估函数 ====================

/**
 * 快速预估评级
 */
export function estimateGrade(totalStats: number, expectedExamScore: number): string {
  const parameterScore = Math.floor(totalStats * 2.3);
  const examBonus = convertExamScore(expectedExamScore);
  const rankScore = 1700; // 假设第一名

  return getGradeFromEvaluation(parameterScore + rankScore + examBonus);
}

// ==================== 导出 ====================

export default {
  calculateCorrectedStat,
  calculateCorrectedStats,
  calculatePenalty,
  calculateTotalPenalty,
  calculateScoreBonus,
  calculateAllScoreBonuses,
  convertExamScore,
  getGradeFromEvaluation,
  calculateFinalEvaluation,
  calculateTurnScore,
  estimateGrade,
};
