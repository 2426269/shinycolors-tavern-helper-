/**
 * 评分服务 (ScoreService)
 * 实现 Gakumas 社区研究的评分公式
 */

import type { IdolStats, JudgeRate } from '../类型/ProduceTypes';
// T5: 移除 stateManager 单例导入，改为参数注入

// ==================== 阶梯函数: 属性补正 ====================

/**
 * 计算补正后属性 (CorrectedStat)
 * 使用阶梯函数实现收益递减
 *
 * | 原属性范围 | 公式 |
 * |:---|:---|
 * | 0~300 | S×5+1 |
 * | 301~600 | S×4+300 |
 * | 601~900 | S×3+900 |
 * | 901~1200 | S×2+1800 |
 * | 1201+ | S+3000 |
 */
export function calculateCorrectedStat(stat: number): number {
  if (stat <= 300) {
    return stat * 5 + 1;
  } else if (stat <= 600) {
    return stat * 4 + 300;
  } else if (stat <= 900) {
    return stat * 3 + 900;
  } else if (stat <= 1200) {
    return stat * 2 + 1800;
  } else {
    return stat + 3000;
  }
}

// ==================== 惩罚计算 ====================

/**
 * 计算低属性惩罚 (Penalty)
 * 属性为0时惩罚25%，达到阈值后归零
 */
export function calculatePenalty(stat: number, judgeRate: number): number {
  if (stat === 0) return 0.25;

  const threshold = (8000 * judgeRate) / 9;
  const penalty = 0.25 - (stat / threshold) * 0.15;

  return Math.max(0, Math.floor(penalty * 1000) / 1000);
}

// ==================== ScoreBonus 计算 ====================

/**
 * 计算 ScoreBonus (主公式)
 * ScoreBonus = ⌈⌊⌈CorrectedStat × JudgeRate × (1-Penalty) + 100⌉ × (1+SupportBonus)⌋₀.₁⌉%
 */
export function calculateScoreBonus(
  stat: number,
  judgeRate: number,
  supportBonus: number = 0, // 本项目固定满级，可传入固定值
): number {
  const correctedStat = calculateCorrectedStat(stat);
  const penalty = calculatePenalty(stat, judgeRate);

  // 内层计算
  const inner = Math.ceil(correctedStat * judgeRate * (1 - penalty) + 100);

  // 应用支援卡加成
  const withSupport = inner * (1 + supportBonus);

  // 向下取整到0.1
  const flooredToTenth = Math.floor(withSupport * 10) / 10;

  // 向上取整
  const final = Math.ceil(flooredToTenth);

  return final / 100; // 返回百分比形式 (e.g., 1.5 = 150%)
}

/**
 * 计算单次出牌得分 (初星组)
 * Score = ⌊(CardBase + Concentration) × ScoreBonus⌋
 *
 * T5: stateManagerInstance 参数现在是必须的，避免依赖单例
 */
export function calculateCardScore(
  cardBase: number,
  stats: IdolStats,
  judgeRate: JudgeRate,
  supportBonus: number = 0,
  stateManagerInstance: { getBuffStacks: (id: string) => number; hasBuff: (id: string) => boolean },
): number {
  // T5: 使用传入的实例（必须）
  const sm = stateManagerInstance;

  // 从 StateManager 读取 Buff 状态
  const concentration = sm.getBuffStacks('Concentration');
  const goodCondition = sm.hasBuff('GoodCondition');
  const excellentCondition = sm.hasBuff('ExcellentCondition');
  const goodImpression = sm.getBuffStacks('GoodImpression');

  // 计算各属性的 ScoreBonus 加权
  const vocalBonus = calculateScoreBonus(stats.vocal, judgeRate.vocal, supportBonus);
  const danceBonus = calculateScoreBonus(stats.dance, judgeRate.dance, supportBonus);
  const visualBonus = calculateScoreBonus(stats.visual, judgeRate.visual, supportBonus);

  // 加权平均 (按 JudgeRate 权重)
  const totalJudgeRate = judgeRate.vocal + judgeRate.dance + judgeRate.visual;
  const weightedBonus =
    (vocalBonus * judgeRate.vocal + danceBonus * judgeRate.dance + visualBonus * judgeRate.visual) / totalJudgeRate;

  // 应用 Buff 乘区
  let buffMultiplier = 1;
  if (goodCondition) buffMultiplier += 0.5;
  if (excellentCondition) buffMultiplier += 0.3; // 绝好调额外加成
  if (goodImpression > 0) {
    // 好印象采用 sqrt 模型避免指数爆炸
    buffMultiplier += 0.1 * Math.sqrt(goodImpression);
  }

  // 最终计算
  const base = cardBase + concentration;
  const score = Math.floor(base * weightedBonus * buffMultiplier);

  return score;
}

// ==================== ExamBonus 分段递减 ====================

/**
 * 计算考试分数转化为评价点
 * 分段递减函数
 */
export function calculateExamBonus(examScore: number): number {
  let bonus = 0;
  let remaining = examScore;

  // 0~5000: 30%
  if (remaining > 0) {
    const segment = Math.min(remaining, 5000);
    bonus += segment * 0.3;
    remaining -= segment;
  }

  // 5001~10000: 15%
  if (remaining > 0) {
    const segment = Math.min(remaining, 5000);
    bonus += segment * 0.15;
    remaining -= segment;
  }

  // 10001~20000: 8%
  if (remaining > 0) {
    const segment = Math.min(remaining, 10000);
    bonus += segment * 0.08;
    remaining -= segment;
  }

  // 20000+: 2%
  if (remaining > 0) {
    bonus += remaining * 0.02;
  }

  return Math.floor(bonus);
}

// ==================== 最终评价 (Rank) ====================

/**
 * 计算最终评价点 (初星组)
 * RankPoint = Vo + Da + Vi + ExamBonus
 */
export function calculateRankPoint(stats: IdolStats, finalExamScore: number): number {
  const statTotal = stats.vocal + stats.dance + stats.visual;
  const examBonus = calculateExamBonus(finalExamScore);

  return statTotal + examBonus;
}

/**
 * 根据评价点获取评价等级
 */
export function getRankGrade(rankPoint: number): string {
  if (rankPoint >= 16000) return 'SSS';
  if (rankPoint >= 14500) return 'SS';
  if (rankPoint >= 13000) return 'S+';
  if (rankPoint >= 11500) return 'S';
  if (rankPoint >= 10000) return 'A+';
  if (rankPoint >= 8500) return 'A';
  if (rankPoint >= 7000) return 'B+';
  if (rankPoint >= 5500) return 'B';
  if (rankPoint >= 4000) return 'C+';
  return 'C';
}

// ==================== NIA 评分公式 ====================

/**
 * 计算 NIA 最终评价
 * 评价 = 2.3 × 面板 + 5200 + 粉丝 × 0.03 (粉丝 > 140000)
 */
export function calculateNIARank(stats: IdolStats, fans: number): number {
  const statTotal = stats.vocal + stats.dance + stats.visual;

  // 粉丝加成只在超过140000时生效
  const fansBonus = fans > 140000 ? fans * 0.03 : 0;

  return Math.floor(2.3 * statTotal + 5200 + fansBonus);
}
