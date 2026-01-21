/**
 * 培育服务统一导出
 */

// 核心服务 - 状态机
export {
  advanceWeek,
  applyLessonResult,
  createInitialProduceState,
  executeWeekAction,
  getAvailableActions,
  getProduceProgress,
  isProduceComplete,
} from './ProduceControlService';

// 核心服务 - 评分
export {
  calculateCardScore,
  calculateCorrectedStat,
  calculateExamBonus,
  calculateNIARank,
  calculatePenalty,
  calculateRankPoint,
  calculateScoreBonus,
  getRankGrade,
} from './ScoreService';

// 核心服务 - 剧本配置
export {
  HATSU_REGULAR,
  NIA_PRO,
  SCENARIO_REGISTRY,
  // 注意: getAvailableActions 已从 ProduceControlService 导出
  canRest,
  getScenarioConfig,
  getWeekAction,
} from './ScenarioConfigService';

// 核心服务 - 课程结果计算
export {
  calculateLessonResult,
  estimateLessonGain,
  formatLessonResultText,
  type LessonBattleResult,
  type LessonFinalResult,
} from './LessonResultCalculator';

// 核心服务 - 课程战斗适配器
export {
  handleExamBattleComplete,
  handleLessonBattleComplete,
  startExamBattle,
  startLessonBattle,
  type BattleCompleteData,
  type BattleInitConfig,
  type LessonStartResult,
} from './LessonBattleAdapter';

// 核心服务 - 考试回合生成器
export {
  DEFAULT_JUDGE_RATES,
  createExtraTurn,
  generateExamTurnSequence,
  getAttributePriorities,
  getPoolConfig,
  getTurnJudgeRate,
  quickGenerateExamSequence,
  type AttributeStat,
  type ExamTurnConfig,
  type TrendPriority,
  type TurnAttribute,
} from './ExamTurnGenerator';

// 核心服务 - 考试分数计算器
export {
  calculateAllScoreBonuses,
  calculateCorrectedStats,
  calculateCorrectedStat as calculateExamCorrectedStat,
  calculateFinalEvaluation,
  calculateTotalPenalty,
  calculateTurnScore,
  convertExamScore,
  estimateGrade,
  getGradeFromEvaluation,
  type FinalEvaluationResult,
  type JudgeRateConfig,
  type ScoreBonusResult,
} from './ExamScoreCalculator';

// 核心服务 - 培育主机
export {
  ProduceHost,
  createProduceHost,
  type BattleMode,
  type BattleState,
  type ProduceHostCallbacks,
  type ProduceHostConfig,
} from './ProduceHost';

// 现有服务
export * from './GachaService';
export * from './GradeService';
export * from './StartingDeckService';
