/**
 * 战斗配置服务 (BattleConfigs.ts)
 * Phase 7.2 Step 1: 定义各副本战斗参数
 */

// ==================== 类型定义 ====================

/** 课程类型 */
export type LessonType = 'NORMAL' | 'SP';

/** 战斗类型 */
export type BattleType =
  | 'LESSON' // 普通课程
  | 'SP_LESSON' // SP 课程
  | 'OIKOMI' // 追い込みレッスン
  | 'MIDTERM_EXAM' // 中間試験
  | 'FINAL_EXAM' // 最終試験
  | 'AUDITION_1' // 1次オーディション
  | 'AUDITION_2' // 2次オーディション
  | 'AUDITION_FINAL'; // 最終オーディション

/** 评级类型 */
export type RankGrade = 'PERFECT' | 'GREAT' | 'PASS' | 'FAIL';

/** 体力状态 */
export type StaminaState = 'ENERGETIC' | 'NORMAL' | 'EXHAUSTED';

/** 课程配置 */
export interface LessonBattleConfig {
  type: BattleType;
  maxTurns: number;
  earlyFinish: boolean; // 达标即止
  targetScore: number; // Perfect 目标分
  baseStatGain: number; // 课程基础属性值
  staminaCost: number; // 体力消耗
}

/** 支援卡效果接口 (预留) */
export interface SupportCardEffect {
  spProbabilityBonus?: number; // SP课程概率加成 (由支援卡具体效果决定)
  lessonStatMultiplier?: number; // 课程属性加成
  examScoreMultiplier?: number; // 考试分数加成
  // ... 其他效果待支援卡系统定义
}

// ==================== 回合数配置 ====================

/** 初星 (Hatsuboshi) 战斗回合数 */
export const HATSU_BATTLE_TURNS: Record<BattleType, number> = {
  LESSON: 8,
  SP_LESSON: 8,
  OIKOMI: 8,
  MIDTERM_EXAM: 10,
  FINAL_EXAM: 12,
  AUDITION_1: 0, // 初星无试镜
  AUDITION_2: 0,
  AUDITION_FINAL: 0,
};

/** NIA 战斗回合数 */
export const NIA_BATTLE_TURNS: Record<BattleType, number> = {
  LESSON: 8,
  SP_LESSON: 8,
  OIKOMI: 0, // NIA 无追い込み
  MIDTERM_EXAM: 0, // NIA 无中间/最终试验
  FINAL_EXAM: 0,
  AUDITION_1: 12,
  AUDITION_2: 8,
  AUDITION_FINAL: 12,
};

// ==================== 剧本配置 ====================

import type { ScenarioId } from '../类型/ProduceTypes';

/**
 * 各剧本的课程 Perfect 目标分数
 * 注：这是"课程"的 Perfect 线，不是考试
 * 考试目标分数在 ScenarioConfigService.ExamConfig.targetScore 中定义
 */
export const LESSON_TARGET_SCORES: Record<
  ScenarioId,
  {
    normal: number; // 普通课程 Perfect
    sp: number; // SP课程 Perfect
    oikomi: number; // 追い込み Perfect
  }
> = {
  // 育成培育
  wing: { normal: 100, sp: 150, oikomi: 180 }, // W.I.N.G.
  grad: { normal: 150, sp: 220, oikomi: 260 }, // G.R.A.D.
  landing_point: { normal: 200, sp: 300, oikomi: 350 }, // Landing Point
  kanshasai: { normal: 300, sp: 450, oikomi: 500 }, // ファン感謝祭
  // 特化培育 - 无追い込み
  step: { normal: 180, sp: 270, oikomi: 0 }, // S.T.E.P.
  say_halo: { normal: 250, sp: 380, oikomi: 0 }, // say"Halo"
};

/**
 * 各剧本的课程基础属性增益
 */
export const LESSON_BASE_GAINS: Record<
  ScenarioId,
  {
    normal: number; // 普通课程基础值
    sp: number; // SP课程基础值
    oikomi: number; // 追い込み基础值
  }
> = {
  // 育成培育
  wing: { normal: 25, sp: 40, oikomi: 50 },
  grad: { normal: 30, sp: 50, oikomi: 60 },
  landing_point: { normal: 35, sp: 60, oikomi: 75 },
  kanshasai: { normal: 40, sp: 75, oikomi: 90 },
  // 特化培育
  step: { normal: 30, sp: 50, oikomi: 0 },
  say_halo: { normal: 38, sp: 65, oikomi: 0 },
};

/**
 * 各剧本的体力消耗
 */
export const LESSON_STAMINA_COSTS: Record<
  ScenarioId,
  {
    normal: number;
    sp: number;
  }
> = {
  wing: { normal: 5, sp: 7 },
  grad: { normal: 6, sp: 8 },
  landing_point: { normal: 6, sp: 8 },
  kanshasai: { normal: 7, sp: 9 },
  step: { normal: 6, sp: 8 },
  say_halo: { normal: 7, sp: 9 },
};

/**
 * NIA 试镜回合数配置
 */
export const NIA_AUDITION_TURNS: Record<'AUDITION_1' | 'AUDITION_2' | 'AUDITION_3', number> = {
  AUDITION_1: 12,
  AUDITION_2: 8,
  AUDITION_3: 12,
};

/**
 * 获取课程战斗配置
 * @param scenarioId 剧本ID
 * @param lessonType 课程类型
 */
export function getLessonBattleConfig(scenarioId: ScenarioId, lessonType: LessonType): LessonBattleConfig {
  // 育成培育使用 HATSU 回合数，特化培育使用 NIA 回合数
  const isYusei = ['wing', 'grad', 'landing_point', 'kanshasai'].includes(scenarioId);
  const battleType = lessonType === 'SP' ? 'SP_LESSON' : 'LESSON';
  const turns = isYusei ? HATSU_BATTLE_TURNS : NIA_BATTLE_TURNS;
  const targets = LESSON_TARGET_SCORES[scenarioId];
  const gains = LESSON_BASE_GAINS[scenarioId];
  const costs = LESSON_STAMINA_COSTS[scenarioId];

  return {
    type: battleType,
    maxTurns: turns[battleType],
    earlyFinish: true, // 课程可达标即止
    targetScore: lessonType === 'SP' ? targets.sp : targets.normal,
    baseStatGain: lessonType === 'SP' ? gains.sp : gains.normal,
    staminaCost: lessonType === 'SP' ? costs.sp : costs.normal,
  };
}

/**
 * 获取考试/试镜战斗配置
 * 注：targetScore 应从 ScenarioConfigService 的 ExamConfig 获取
 * @param scenarioId 剧本ID
 * @param examType 考试类型
 * @param targetScore 目标分数 (从 ExamConfig.targetScore 获取)
 */
export function getExamBattleConfig(
  scenarioId: ScenarioId,
  examType: BattleType,
  targetScore: number,
): LessonBattleConfig {
  // 育成培育使用 HATSU 回合数，特化培育使用 NIA 回合数
  const isYusei = ['wing', 'grad', 'landing_point', 'kanshasai'].includes(scenarioId);

  let maxTurns = 0;
  if (isYusei) {
    maxTurns = HATSU_BATTLE_TURNS[examType];
  } else {
    // 特化培育 试镜
    if (examType === 'AUDITION_1') maxTurns = NIA_AUDITION_TURNS.AUDITION_1;
    else if (examType === 'AUDITION_2') maxTurns = NIA_AUDITION_TURNS.AUDITION_2;
    else if (examType === 'AUDITION_FINAL') maxTurns = NIA_AUDITION_TURNS.AUDITION_3;
  }

  return {
    type: examType,
    maxTurns,
    earlyFinish: false, // 考试必须打完全部回合
    targetScore,
    baseStatGain: 0, // 考试不直接加属性，属性增益在 ExamConfig.statRewards 中
    staminaCost: 0,
  };
}

// ==================== SP 课程概率 ====================

/** SP 课程基础概率 */
export const SP_BASE_PROBABILITY = 0.1; // 10%

/**
 * 计算 SP 课程触发概率
 * @param supportCardEffects 支援卡效果列表
 * @returns 最终概率 (0-1)
 */
export function calculateSPProbability(supportCardEffects: SupportCardEffect[]): number {
  const bonus = supportCardEffects.reduce((sum, effect) => sum + (effect.spProbabilityBonus || 0), 0);
  return Math.min(SP_BASE_PROBABILITY + bonus, 1.0);
}

/**
 * 判定是否触发 SP 课程
 * @param supportCardEffects 支援卡效果列表
 */
export function rollForSPLesson(supportCardEffects: SupportCardEffect[]): boolean {
  const probability = calculateSPProbability(supportCardEffects);
  return Math.random() < probability;
}

// ==================== 评级倍率 ====================

/** 评级对应倍率 */
export const RANK_MULTIPLIERS: Record<RankGrade, number> = {
  PERFECT: 1.5,
  GREAT: 1.2,
  PASS: 1.0,
  FAIL: 0.5,
};

/**
 * 根据分数判定评级
 * @param score 战斗分数
 * @param targetScore Perfect 目标分
 */
export function determineRankGrade(score: number, targetScore: number): RankGrade {
  if (score >= targetScore) return 'PERFECT';
  if (score >= targetScore * 0.8) return 'GREAT';
  if (score >= targetScore * 0.5) return 'PASS';
  return 'FAIL';
}

// ==================== 体力补正 ====================

/** 体力补正系数 */
export const STAMINA_CORRECTIONS: Record<StaminaState, number> = {
  ENERGETIC: 0.1, // +10%
  NORMAL: 0, // 无修正
  EXHAUSTED: -0.15, // -15%
};

/**
 * 判定体力状态
 * @param currentStamina 当前体力
 * @param maxStamina 最大体力
 */
export function getStaminaState(currentStamina: number, maxStamina: number): StaminaState {
  const ratio = currentStamina / maxStamina;
  if (ratio > 0.8) return 'ENERGETIC';
  if (ratio >= 0.3) return 'NORMAL';
  return 'EXHAUSTED';
}

/**
 * 获取体力补正值
 */
export function getStaminaCorrection(currentStamina: number, maxStamina: number): number {
  const state = getStaminaState(currentStamina, maxStamina);
  return STAMINA_CORRECTIONS[state];
}

// ==================== 考试分数折算 (分段衰减) ====================

/** 分数折算系数表 */
const SCORE_CONVERSION_TIERS = [
  { max: 5000, multiplier: 0.3 },
  { max: 10000, multiplier: 0.15 },
  { max: 20000, multiplier: 0.08 },
  { max: 30000, multiplier: 0.04 },
  { max: 40000, multiplier: 0.02 },
  { max: Infinity, multiplier: 0.0 }, // 硬上限
];

/**
 * 考试分数折算 (分段衰减)
 * @param rawScore 原始战斗分数
 * @returns 折算后的评价点
 */
export function calculateExamScoreConversion(rawScore: number): number {
  let converted = 0;
  let remaining = rawScore;
  let prevMax = 0;

  for (const tier of SCORE_CONVERSION_TIERS) {
    const tierRange = tier.max - prevMax;
    const scoreInTier = Math.min(remaining, tierRange);

    if (scoreInTier <= 0) break;

    converted += scoreInTier * tier.multiplier;
    remaining -= scoreInTier;
    prevMax = tier.max;

    if (remaining <= 0) break;
  }

  return Math.floor(converted);
}

/** 排名点 */
export const RANK_POINTS: Record<number, number> = {
  1: 1700,
  2: 1200,
  3: 800,
  // ... 更多排名
};

/**
 * 计算最终评价点
 * @param totalStats 三维总和
 * @param examScore 考试分数
 * @param rank 排名
 */
export function calculateFinalEvaluation(totalStats: number, examScore: number, rank: number = 1): number {
  const statScore = totalStats * 2.3;
  const rankPoint = RANK_POINTS[rank] || 0;
  const scoreBonus = calculateExamScoreConversion(examScore);

  return Math.floor(statScore + rankPoint + scoreBonus);
}

// ==================== 课程属性分配 (权重动态分配) ====================

/** 分配权重参数 */
export const DISTRIBUTION_PARAMS = {
  baseFocusPrimary: 100, // 主属性基础专注
  baseFocusSecondary: 5, // 副属性基础专注
  baseFocusSecondarySP: 15, // SP课程副属性专注
  resonanceFactor: 0.05, // 共鸣系数
  randomMax: 10, // 随机扰动上限
};

export interface StatDistribution {
  vocal: number;
  dance: number;
  visual: number;
}

/**
 * 计算属性分配权重
 * @param primaryStat 主属性类型
 * @param currentStats 当前属性值
 * @param isSP 是否为 SP 课程
 */
export function calculateDistributionWeights(
  primaryStat: 'vocal' | 'dance' | 'visual',
  currentStats: StatDistribution,
  isSP: boolean = false,
): StatDistribution {
  const params = DISTRIBUTION_PARAMS;
  const secondaryFocus = isSP ? params.baseFocusSecondarySP : params.baseFocusSecondary;

  const calculateWeight = (stat: 'vocal' | 'dance' | 'visual'): number => {
    const baseFocus = stat === primaryStat ? params.baseFocusPrimary : secondaryFocus;
    const resonance = currentStats[stat] * params.resonanceFactor;
    const random = Math.random() * params.randomMax;
    return baseFocus + resonance + random;
  };

  return {
    vocal: calculateWeight('vocal'),
    dance: calculateWeight('dance'),
    visual: calculateWeight('visual'),
  };
}

/**
 * 根据权重分配属性增益
 * @param totalGain 总增益值
 * @param weights 分配权重
 */
export function distributeStatGains(totalGain: number, weights: StatDistribution): StatDistribution {
  const totalWeight = weights.vocal + weights.dance + weights.visual;

  const vocal = Math.floor(totalGain * (weights.vocal / totalWeight));
  const dance = Math.floor(totalGain * (weights.dance / totalWeight));
  const visual = Math.floor(totalGain * (weights.visual / totalWeight));

  // 余数补给主属性 (最高权重)
  const remainder = totalGain - vocal - dance - visual;
  const maxWeight = Math.max(weights.vocal, weights.dance, weights.visual);

  return {
    vocal: weights.vocal === maxWeight ? vocal + remainder : vocal,
    dance: weights.dance === maxWeight && weights.vocal !== maxWeight ? dance + remainder : dance,
    visual:
      weights.visual === maxWeight && weights.vocal !== maxWeight && weights.dance !== maxWeight
        ? visual + remainder
        : visual,
  };
}

// ==================== 课程结果计算 ====================

/**
 * 计算课程最终属性增益
 * @param baseGain 课程基础值
 * @param lessonBonus 训练加成 (0.xx)
 * @param rankGrade 评级
 * @param currentStamina 当前体力
 * @param maxStamina 最大体力
 */
export function calculateLessonStatGain(
  baseGain: number,
  lessonBonus: number,
  rankGrade: RankGrade,
  currentStamina: number,
  maxStamina: number,
): number {
  const staminaCorrection = getStaminaCorrection(currentStamina, maxStamina);
  const rankMultiplier = RANK_MULTIPLIERS[rankGrade];

  // 公式: ⌊(课程基础值) × (1 + 训练加成 + 体力补正) × 评级倍率⌋
  const result = baseGain * (1 + lessonBonus + staminaCorrection) * rankMultiplier;

  return Math.floor(result);
}
