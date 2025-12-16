/**
 * 战斗状态类型定义
 *
 * 这个文件定义了战斗系统的核心状态数据结构
 */

import type { Buff } from './buff';
import type { SkillCard } from './skill-card';

/**
 * 战斗模式
 */
export type BattleMode =
  | 'training' // 训练模式（目标得分）
  | 'exam'; // 比赛模式（排名竞争）

/**
 * 培育计划类型
 */
export type PlanType =
  | 'sense' // 感性（センス）
  | 'logic' // 理性（ロジック）
  | 'anomaly'; // 非凡（アノマリー）

/**
 * 非凡状态
 */
export type AnomalyState =
  | 'allout' // 全力状态
  | 'conserve' // 温存状态
  | 'resolute' // 坚决状态（強気）
  | 'relaxed' // のんびり状态
  | null; // 无状态

/**
 * 属性系统
 *
 * 包含三套培育计划的所有属性
 */
export interface BattleAttributes {
  // ========== 感性系统 ==========
  concentration: number; // 专注（集中）- 用于得分计算

  // ========== 理性系统 ==========
  motivation: number; // 干劲 - 影响卡牌效果
  goodImpression: number; // 好印象 - 回合结束直接得分

  // ========== 非凡系统 ==========
  allPower: number; // 全力值（0-10，满10转化）
  heat: number; // 热意值 - 影响状态切换
  anomalyState: AnomalyState; // 当前状态
  stateLevel: 1 | 2; // 状态阶段（一阶段/二阶段）
  pointerLocked: boolean; // 指针是否锁定

  // ========== 通用 ==========
  energy: number; // 活力
}

/**
 * 偶像三维属性
 *
 * 用于计算得分乘区
 */
export interface IdolStats {
  vocal: number; // Vocal（歌唱）
  dance: number; // Dance（舞蹈）
  visual: number; // Visual（视觉）
}

/**
 * 得分系统
 */
export interface ScoreSystem {
  current: number; // 当前得分
  target: number; // 目标得分（Clear标准）
  perfectTarget: number; // Perfect目标（2x）
}

/**
 * 回合状态
 */
export interface TurnState {
  cardsUsed: number; // 本回合已使用卡牌数
  maxCardsPerTurn: number; // 本回合最多使用数（默认1）
  drawnThisTurn: number; // 本回合已抽牌数
  attribute: 'vocal' | 'dance' | 'visual' | null; // 本回合属性（比赛模式）
  skippedActions: number; // 跳过次数（连续跳过3次则强制结束）
}

/**
 * 应援效果（训练模式）
 */
export interface SupportEffect {
  active: boolean; // 是否激活
  description: string; // 描述
  requirement: string; // 达成要求
  reward: any; // 奖励
  turns: number; // 剩余回合数
  progress: number; // 当前进度（0-100）
}

/**
 * 战斗状态（核心数据结构）
 *
 * 存储一场战斗/训练的所有数据
 */
export interface BattleState {
  // ========== 基础信息 ==========
  id: string; // 战斗ID
  mode: BattleMode; // 战斗模式
  planType: PlanType; // 培育计划类型
  currentTurn: number; // 当前回合（1-based）
  maxTurns: number; // 最大回合数
  startTime: number; // 开始时间戳

  // ========== 资源 ==========
  stamina: number; // 当前体力（0-100）
  maxStamina: number; // 最大体力
  genki: number; // 元气（0-100）

  // ========== 属性系统 ==========
  attributes: BattleAttributes; // 所有属性

  // ========== 三维属性 ==========
  stats: IdolStats; // 偶像三维（用于计分）

  // ========== 得分系统 ==========
  score: ScoreSystem; // 得分相关

  // ========== Buff管理 ==========
  buffs: Map<string, Buff>; // 激活的Buff（key = Buff.id）

  // ========== 卡牌系统 ==========
  deck: SkillCard[]; // 牌堆
  hand: SkillCard[]; // 手牌（最多5张）
  discardPile: SkillCard[]; // 弃牌堆
  removedPile: SkillCard[]; // 除外堆

  // ========== 回合状态 ==========
  turnState: TurnState; // 回合相关状态

  // ========== 应援效果 ==========
  support: SupportEffect | null; // 应援效果（训练模式）

  // ========== 历史记录 ==========
  history: BattleHistoryEntry[]; // 历史记录

  // ========== 元数据 ==========
  metadata: Record<string, any>; // 额外数据
}

/**
 * 战斗历史条目
 */
export interface BattleHistoryEntry {
  turn: number; // 回合数
  action: string; // 行动类型
  description: string; // 描述
  scoreChange: number; // 分数变化
  staminaChange: number; // 体力变化
  genkiChange: number; // 元气变化
  timestamp: number; // 时间戳
}

/**
 * 战斗配置
 *
 * 用于初始化战斗状态
 */
export interface BattleConfig {
  mode: BattleMode; // 战斗模式
  planType: PlanType; // 培育计划类型
  maxTurns?: number; // 最大回合数（默认12）
  initialStamina?: number; // 初始体力（默认60）
  maxStamina?: number; // 最大体力（默认60）
  stats: IdolStats; // 偶像三维
  targetScore?: number; // 目标得分（默认1000）
  perfectScore?: number; // Perfect得分（默认2000）
  skillDeck: SkillCard[]; // 技能卡组
  support?: Partial<SupportEffect>; // 应援效果（可选）
  examCriteria?: ExamCriteria; // 审查基准（比赛模式）
}

/**
 * 审查基准（比赛模式）
 *
 * 决定各属性回合的分配比例
 */
export interface ExamCriteria {
  vocal: number; // Vocal权重（0-1）
  dance: number; // Dance权重（0-1）
  visual: number; // Visual权重（0-1）
}

/**
 * 战斗结果
 */
export interface BattleResult {
  mode: BattleMode; // 战斗模式
  evaluation: 'perfect' | 'clear' | 'fail'; // 评价
  finalScore: number; // 最终得分
  targetScore: number; // 目标得分
  perfectScore: number; // Perfect得分
  turns: number; // 使用的回合数
  remainingStamina: number; // 剩余体力
  cardsUsed: number; // 使用的卡牌数
  buffsGained: number; // 获得的Buff数

  // 比赛模式专属
  rank?: number; // 排名（1-6）
  rivalScores?: number[]; // 对手分数

  // 统计数据
  stats: BattleResultStats; // 详细统计

  // 奖励
  rewards: BattleRewards; // 获得的奖励

  // 时间
  startTime: number; // 开始时间
  endTime: number; // 结束时间
  duration: number; // 持续时间（秒）
}

/**
 * 战斗结果统计
 */
export interface BattleResultStats {
  totalCardsUsed: number; // 总使用卡牌数
  totalStaminaConsumed: number; // 总消耗体力
  totalGenkiGained: number; // 总获得元气
  totalBuffsGained: number; // 总获得Buff数
  maxScore: number; // 单回合最高得分
  averageScore: number; // 平均每回合得分
  perfectTurns: number; // Perfect回合数
}

/**
 * 战斗奖励
 */
export interface BattleRewards {
  // 资源奖励
  pPoints: number; // P点数
  pDrinks: PDrink[]; // P饮料
  pItems: PItem[]; // P道具
  skillCards: SkillCard[]; // 技能卡

  // 属性增长
  statGain: {
    vocal: number;
    dance: number;
    visual: number;
  };

  // 好感度
  love: number; // 好感度增加
}

/**
 * P饮料
 */
export interface PDrink {
  id: string;
  name: string;
  effect: string;
  rarity: 'common' | 'rare' | 'epic';
}

/**
 * P道具
 */
export interface PItem {
  id: string;
  name: string;
  effect: string;
  rarity: 'common' | 'rare' | 'epic';
}

/**
 * 战斗状态快照
 *
 * 用于保存/读取战斗进度
 */
export interface BattleSnapshot {
  state: BattleState;
  timestamp: number;
  version: string;
}
