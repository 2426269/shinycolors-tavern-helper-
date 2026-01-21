/**
 * 培育系统类型定义
 * Produce System Types
 */

import type { AttributeType } from '../../类型/卡牌属性类型';

// ==================== 剧本类型 ====================

/** 剧本ID */
export type ScenarioId =
  // 育成培育
  | 'wing' // W.I.N.G. (Wonder Idol Nova Grandprix)
  | 'grad' // G.R.A.D. (Grand Repute Audition)
  | 'landing_point' // Landing Point (283 Production 单独Live)
  | 'kanshasai' // ファン感謝祭 (Fan Appreciation Festival)
  // 特化培育
  | 'step' // S.T.E.P. (Shining To Evolving Performers)
  | 'say_halo'; // say"Halo"

/** 周行动类型 */
export type WeekActionType =
  | 'LESSON' // 训练/自主课程
  | 'SP_LESSON' // SP训练
  | 'BUSINESS' // 营业 (NIA)
  | 'OUTING' // 外出
  | 'SHOP' // 商店
  | 'REST' // 休息
  | 'SUPPORT' // 慰问/活动补给
  | 'SPECIAL_GUIDANCE' // 特别指导 (NIA)
  | 'REMOVE_CARD' // 移除卡牌 (NIA)
  | 'EXAM_MIDTERM' // 中间试验 (初星)
  | 'EXAM_FINAL' // 最终试验 (初星)
  | 'AUDITION_1' // 一镜 (NIA)
  | 'AUDITION_2' // 二镜 (NIA)
  | 'AUDITION_3'; // 三镜 (NIA)

/** 培育阶段 */
export type ProducePhase =
  | 'CHARACTER_SELECT' // 角色选择
  | 'SUPPORT_SELECT' // 支援卡选择
  | 'MEMORY_SELECT' // 回忆卡选择
  | 'SCENARIO_SELECT' // 剧本选择
  | 'WEEK_ACTION' // 周行动
  | 'LESSON_BATTLE' // 训练战斗
  | 'EXAM_BATTLE' // 考试战斗
  | 'RESULT' // 结果页
  | 'IDLE'; // 空闲

// ==================== 剧本配置 ====================

/** 周行动配置 */
export interface WeekActionConfig {
  week: number;
  primaryAction: WeekActionType;
  alternatives?: WeekActionType[];
  statGain?: number; // 训练属性增益
  isFixed?: boolean; // 是否固定行动 (如考试)
}

/** 考试/试镜配置 */
export interface ExamConfig {
  week: number;
  type: 'MIDTERM' | 'FINAL' | 'AUDITION_1' | 'AUDITION_2' | 'AUDITION_3';
  // 通关阈值
  thresholds: {
    balanced: { high: number[]; mid: number[]; low: number[] };
    singlePole: { high: number[]; mid: number[]; low: number[] };
  };
  aiMaxScore: number;
  fanThreshold?: number; // 粉丝数阈值 (NIA)
  targetScore?: number; // 满分线
  statRewards: { main: number; sub: number; third: number };
}

/** 特殊规则 */
export interface SpecialRule {
  type: 'NO_REST_BEFORE_WEEK' | 'RANDOM_SCHEDULE' | 'CHALLENGE_ITEM' | 'LEGEND_SKILL';
  value?: number | boolean | string;
}

/** 剧本配置 */
export interface ScenarioConfig {
  id: ScenarioId;
  name: string; // 显示名称 (e.g., "W.I.N.G.")
  gakumasName: string; // Gakumas 原型名 (e.g., "初星 Regular")
  totalWeeks: number;
  statCap: number; // 属性上限
  schedule: WeekActionConfig[];
  exams: ExamConfig[];
  specialRules: SpecialRule[];
  // NIA 专属
  maxRestCount?: number; // 最大休息次数
  maxOutingCount?: number; // 最大外出次数
  maxSpecialGuidance?: number; // 最大特别指导次数
}

// ==================== 培育状态 ====================

/** 偶像三维属性 */
export interface IdolStats {
  vocal: number;
  dance: number;
  visual: number;
}

/** 训练加成 */
export interface LessonBonus {
  vocal: number; // 百分比加成
  dance: number;
  visual: number;
}

/** Step 2: 饮料槽 (UI 展示用) */
export interface DrinkSlot {
  id: string;
  name: string;
  iconUrl: string;
}

/** 培育状态 */
export interface ProduceState {
  // 基础信息
  scenarioId: ScenarioId;
  currentWeek: number;
  currentPhase: ProducePhase;

  // 偶像数据
  idolId: string;
  idolName: string;
  attributeType: AttributeType;
  stats: IdolStats;
  lessonBonus: LessonBonus;

  // 资源
  stamina: number;
  maxStamina: number;
  pPoints: number;
  fans: number; // NIA 专属
  genki: number; // Step 2: 元气 (培育阶段元气)
  // Step 2: 饮料槽 (UI 展示用)
  drinks: readonly (DrinkSlot | null)[];

  // 卡组 (T3-fix: 使用 readonly 数组支持深度只读)
  deckCardIds: readonly string[];
  drinkIds: readonly string[];

  // 编队
  supportFormationIds: readonly string[];
  memoryFormationIds: readonly string[];

  // 记录
  actionHistory: readonly ActionRecord[];
  examResults: readonly ExamResult[];

  // 计数器
  restCount: number;
  outingCount: number;
  specialGuidanceCount: number;

  // Step 5: AI 专属卡缺失标志 (由 Core 初始化时设置)
  aiCardMissing: boolean;
}

/** 行动记录 */
export interface ActionRecord {
  week: number;
  action: WeekActionType;
  result?: {
    statGain?: Partial<IdolStats>;
    cardGained?: readonly string[];
    drinkGained?: readonly string[];
    pPointsGained?: number;
    staminaChange?: number;
    fansGained?: number;
  };
}

/** 考试结果 */
export interface ExamResult {
  type: ExamConfig['type'];
  week: number;
  score: number;
  rank: number; // 1 = 第一名
  statReward: Partial<IdolStats>;
  fansReward?: number;
}

// ==================== 评分相关 ====================

/** 审查基准倍率 */
export interface JudgeRate {
  vocal: number; // 0~1
  dance: number;
  visual: number;
}

// ==================== Buff 状态 (复用战斗系统) ====================

// 直接复用战斗系统的 Buff 类型，保持一致性
// T5: 移除 stateManager 单例导出，避免培育域依赖战斗引擎单例
export type { BuffInstance } from '../../战斗/引擎-NG/StateManager';
export type { StandardBuffId } from '../../战斗/引擎-NG/types';
