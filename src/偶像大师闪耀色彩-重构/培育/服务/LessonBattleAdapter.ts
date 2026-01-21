/**
 * 课程战斗适配器 (LessonBattleAdapter.ts)
 * Phase 7.2 Step 3: 桥接培育系统卡组与战斗引擎
 */

import type { BattleType, LessonBattleConfig, LessonType, SupportCardEffect } from '../数据/BattleConfigs';
import { getExamBattleConfig, getLessonBattleConfig, rollForSPLesson } from '../数据/BattleConfigs';
import type { ProduceState, ScenarioId } from '../类型/ProduceTypes';
import type { LessonBattleResult, LessonFinalResult } from './LessonResultCalculator';
import { calculateLessonResult } from './LessonResultCalculator';
import type { DeckSkillCard } from './StartingDeckService';

// ==================== 类型定义 ====================

/** 战斗初始化配置 */
export interface BattleInitConfig {
  scenarioId: ScenarioId;
  battleType: BattleType;
  lessonType?: LessonType; // 课程类型 (课程战斗用)
  primaryStat: 'vocal' | 'dance' | 'visual'; // 主训练属性
  deck: DeckSkillCard[];
  stamina: number;
  maxStamina: number;
  targetScore: number; // 目标分 (考试从 ExamConfig 获取)
  maxTurns: number;
}

/** 战斗完成回调数据 */
export interface BattleCompleteData {
  score: number;
  finalStamina: number;
  maxStamina: number;
  cardsPlayed: number;
  turnsUsed: number;
}

/** 课程结果 (包含 SP 判定) */
export interface LessonStartResult {
  isSP: boolean;
  requiresBattle: boolean; // 是否需要战斗 (NIA 自主课程不需要)
  config: LessonBattleConfig;
  battleInitConfig: BattleInitConfig | null;
  autoResult?: LessonFinalResult; // NIA 自动完成时的结果
}

// ==================== 剧本判定 ====================

/** 判断是否为特化培育 (NIA: step/say_halo) */
function isNiaScenario(scenarioId: ScenarioId): boolean {
  return scenarioId === 'step' || scenarioId === 'say_halo';
}

/** 判断是否为育成培育 (wing/grad/landing_point/kanshasai) */
function isYuseiScenario(scenarioId: ScenarioId): boolean {
  return ['wing', 'grad', 'landing_point', 'kanshasai'].includes(scenarioId);
}

// ==================== NIA 自主课程 (跳过战斗) ====================

/**
 * NIA 自主课程自动完成 (不需要战斗)
 * @param produceState 当前培育状态
 * @param primaryStat 选择的训练属性
 * @param isSP 是否为 SP 课程
 */
function autoCompleteNiaLesson(
  produceState: ProduceState,
  primaryStat: 'vocal' | 'dance' | 'visual',
  isSP: boolean,
): LessonFinalResult {
  const lessonType: LessonType = isSP ? 'SP' : 'NORMAL';

  // 构建模拟的战斗结果 (假设达到 GREAT 评级)
  const mockBattleResult: LessonBattleResult = {
    score: 100, // 模拟分数
    finalStamina: produceState.stamina,
    maxStamina: produceState.maxStamina,
    cardsPlayed: 0,
    turnsUsed: 0,
  };

  // 使用 LessonResultCalculator 计算结果
  const result = calculateLessonResult(
    produceState.scenarioId,
    lessonType,
    primaryStat,
    mockBattleResult,
    produceState.lessonBonus,
    produceState.stats,
  );

  console.log(`[LessonBattleAdapter] NIA 自主课程自动完成:`, {
    primaryStat,
    isSP,
    totalGain: result.totalGain,
    statGains: result.statGains,
  });

  return result;
}

// ==================== 课程战斗适配器 ====================

/**
 * 开始课程战斗 (判定 SP + 初始化配置)
 * @param produceState 当前培育状态
 * @param primaryStat 选择的训练属性
 * @param supportCardEffects 支援卡效果列表
 */
export function startLessonBattle(
  produceState: ProduceState,
  primaryStat: 'vocal' | 'dance' | 'visual',
  supportCardEffects: SupportCardEffect[] = [],
): LessonStartResult {
  // 1. 判定是否触发 SP 课程
  const isSP = rollForSPLesson(supportCardEffects);
  const lessonType: LessonType = isSP ? 'SP' : 'NORMAL';

  // 2. 获取课程配置
  const config = getLessonBattleConfig(produceState.scenarioId, lessonType);

  // 3. 判断是否需要战斗 (NIA 自主课程不需要)
  const isNia = isNiaScenario(produceState.scenarioId);

  if (isNia) {
    // NIA 自主课程: 直接自动完成，不需要战斗
    const autoResult = autoCompleteNiaLesson(produceState, primaryStat, isSP);

    return {
      isSP,
      requiresBattle: false,
      config,
      battleInitConfig: null,
      autoResult,
    };
  }

  // 4. 育成培育: 需要战斗
  const battleInitConfig: BattleInitConfig = {
    scenarioId: produceState.scenarioId,
    battleType: isSP ? 'SP_LESSON' : 'LESSON',
    lessonType,
    primaryStat,
    deck: [], // 由 ProduceHost 提供完整卡组
    stamina: produceState.stamina,
    maxStamina: produceState.maxStamina,
    targetScore: config.targetScore,
    maxTurns: config.maxTurns,
  };

  console.log(`[LessonBattleAdapter] 开始${isSP ? 'SP' : '普通'}课程战斗`, {
    scenarioId: produceState.scenarioId,
    primaryStat,
    targetScore: config.targetScore,
    maxTurns: config.maxTurns,
  });

  return { isSP, requiresBattle: true, config, battleInitConfig };
}

/**
 * 处理课程战斗完成
 * @param produceState 当前培育状态
 * @param lessonType 课程类型
 * @param primaryStat 主训练属性
 * @param battleComplete 战斗完成数据
 */
export function handleLessonBattleComplete(
  produceState: ProduceState,
  lessonType: LessonType,
  primaryStat: 'vocal' | 'dance' | 'visual',
  battleComplete: BattleCompleteData,
): LessonFinalResult {
  // 构建战斗结果
  const battleResult: LessonBattleResult = {
    score: battleComplete.score,
    finalStamina: battleComplete.finalStamina,
    maxStamina: battleComplete.maxStamina,
    cardsPlayed: battleComplete.cardsPlayed,
    turnsUsed: battleComplete.turnsUsed,
  };

  // 计算课程结果
  const result = calculateLessonResult(
    produceState.scenarioId,
    lessonType,
    primaryStat,
    battleResult,
    produceState.lessonBonus,
    produceState.stats,
  );

  console.log(`[LessonBattleAdapter] 课程结果:`, {
    rankGrade: result.rankGrade,
    totalGain: result.totalGain,
    statGains: result.statGains,
  });

  return result;
}

// ==================== 考试战斗适配器 ====================

/**
 * 开始考试/试镜战斗
 * @param produceState 当前培育状态
 * @param examType 考试类型
 * @param targetScore 目标分数 (从 ExamConfig.targetScore 获取)
 */
export function startExamBattle(
  produceState: ProduceState,
  examType: BattleType,
  targetScore: number,
): BattleInitConfig {
  // 获取考试配置
  const config = getExamBattleConfig(produceState.scenarioId, examType, targetScore);

  // 确定主属性 (根据当前最高属性)
  const stats = produceState.stats;
  let primaryStat: 'vocal' | 'dance' | 'visual' = 'vocal';
  if (stats.dance > stats.vocal && stats.dance > stats.visual) {
    primaryStat = 'dance';
  } else if (stats.visual > stats.vocal) {
    primaryStat = 'visual';
  }

  const battleInitConfig: BattleInitConfig = {
    scenarioId: produceState.scenarioId,
    battleType: examType,
    primaryStat,
    deck: [], // 由 ProduceHost 提供完整卡组
    stamina: produceState.stamina,
    maxStamina: produceState.maxStamina,
    targetScore,
    maxTurns: config.maxTurns,
  };

  console.log(`[LessonBattleAdapter] 开始考试战斗`, {
    examType,
    targetScore,
    maxTurns: config.maxTurns,
  });

  return battleInitConfig;
}

/**
 * 处理考试战斗完成
 * @param battleComplete 战斗完成数据
 * @param targetScore 目标分数
 */
export function handleExamBattleComplete(
  battleComplete: BattleCompleteData,
  targetScore: number,
): {
  score: number;
  passed: boolean;
  rank: number;
} {
  const score = battleComplete.score;
  const passed = score >= targetScore * 0.5; // 及格线 50%

  // 简化排名计算 (实际应根据 AI 对手分数)
  let rank = 1;
  if (score < targetScore) rank = 2;
  if (score < targetScore * 0.8) rank = 3;
  if (score < targetScore * 0.5) rank = 4;

  console.log(`[LessonBattleAdapter] 考试结果:`, { score, passed, rank });

  return { score, passed, rank };
}

// ==================== 导出 ====================

export default {
  startLessonBattle,
  handleLessonBattleComplete,
  startExamBattle,
  handleExamBattleComplete,
};
