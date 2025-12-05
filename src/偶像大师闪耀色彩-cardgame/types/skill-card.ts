/**
 * 技能卡类型定义
 *
 * 这个文件定义了技能卡相关的所有类型
 */

import type { SkillCardEffect } from './effect';

/**
 * 卡牌稀有度
 */
export type CardRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

/**
 * 卡牌类型
 *
 * A = Active (主动卡，六边形)
 * M = Mental (心理卡，圆形)
 * T = Trap (陷阱卡，方形)
 */
export type CardType = 'A' | 'M' | 'T';

/**
 * 卡牌Cost类型
 *
 * normal = 绿色图标（元气优先，不足时消耗体力）
 * stamina_only = 红色图标（只消耗体力）
 */
export type CardCostType = 'normal' | 'stamina_only';

/**
 * 培育计划类型
 */
export type PlanType = 'sense' | 'logic' | 'anomaly';

/**
 * 卡牌属性（从真实数据库）
 */
export type CardAttribute = '非凡' | '理性' | '感性' | '自由';

/**
 * 技能卡完整数据结构
 */
export interface SkillCard {
  // ========== 基础信息 ==========
  id: string; // 卡牌唯一ID
  name: string; // 卡牌名称
  rarity: CardRarity; // 稀有度
  type: CardType; // 卡牌类型
  attribute: CardAttribute; // 卡牌属性

  // ========== Cost相关 ==========
  cost: number; // 元气消耗（负数，如-3表示消耗3元气）
  costType: CardCostType; // Cost类型（绿色/红色图标）

  // ========== 使用限制 ==========
  unique: boolean; // 是否"重复不可"（不可重复）
  enhanced: boolean; // 是否已强化
  limitPerLesson: number | null; // 课程中限X次（null表示无限制）
  usedThisLesson: number; // 本课程已使用次数

  // ========== 效果定义 ==========
  effects: SkillCardEffect[]; // 效果列表
  effectsEnhanced?: SkillCardEffect[]; // 强化后的效果（可选）

  // ========== 显示相关 ==========
  description: string; // 效果描述文本（强化前）
  descriptionEnhanced?: string; // 强化后的效果描述
  imageUrl?: string; // 卡面URL
  frameColor?: string; // 外框颜色（white/yellow/rainbow）

  // ========== 元数据 ==========
  source: 'official' | 'ai' | 'custom'; // 来源（官方/AI生成/自定义）
  sourceId?: string; // 来源ID（如P卡ID）
  tags?: string[]; // 标签（用于检索）
  timestamp?: number; // 创建/获得时间戳
  metadata?: Record<string, any>; // 额外数据
}

/**
 * 技能卡使用结果
 */
export interface CardUsageResult {
  success: boolean; // 是否成功使用
  card: SkillCard; // 使用的卡牌
  logs: string[]; // 日志信息
  scoreGained: number; // 获得的分数
  staminaConsumed: number; // 消耗的体力
  genkiConsumed: number; // 消耗的元气
  buffsAdded: string[]; // 添加的Buff ID列表
  cardsDrawn: number; // 抽到的牌数
  extraUses: number; // 额外获得的使用次数
  timestamp: number; // 使用时间戳
}

/**
 * 卡牌过滤器
 *
 * 用于筛选卡牌
 */
export interface CardFilter {
  rarity?: CardRarity[]; // 稀有度筛选
  type?: CardType[]; // 类型筛选
  attribute?: CardAttribute[]; // 属性筛选
  costMin?: number; // 最小Cost（绝对值）
  costMax?: number; // 最大Cost（绝对值）
  unique?: boolean; // 是否只要重复不可
  enhanced?: boolean; // 是否只要已强化
  source?: ('official' | 'ai' | 'custom')[]; // 来源筛选
  tags?: string[]; // 标签筛选（包含任一标签即可）
  searchText?: string; // 搜索文本（名称或描述）
}

/**
 * 卡组（牌堆）
 */
export interface Deck {
  cards: SkillCard[]; // 卡牌列表
  shuffled: boolean; // 是否已洗牌
  timestamp: number; // 创建时间戳
}

/**
 * 手牌
 */
export interface Hand {
  cards: SkillCard[]; // 卡牌列表
  maxSize: number; // 最大手牌数（通常为5）
}

/**
 * 卡牌移动事件
 */
export interface CardMoveEvent {
  card: SkillCard;
  from: CardZone;
  to: CardZone;
  timestamp: number;
}

/**
 * 卡牌区域
 */
export type CardZone =
  | 'deck' // 牌堆
  | 'hand' // 手牌
  | 'discard' // 弃牌堆
  | 'removed' // 除外区
  | 'play'; // 正在使用

/**
 * 卡牌统计数据
 */
export interface CardStats {
  totalCards: number; // 总卡牌数
  byRarity: Record<CardRarity, number>; // 按稀有度统计
  byType: Record<CardType, number>; // 按类型统计
  byAttribute: Record<CardAttribute, number>; // 按属性统计
  averageCost: number; // 平均Cost
  uniqueCards: number; // 重复不可的卡牌数
  enhancedCards: number; // 已强化的卡牌数
}

/**
 * 卡牌构建器（用于AI生成）
 */
export interface CardBuilder {
  setName(name: string): CardBuilder;
  setRarity(rarity: CardRarity): CardBuilder;
  setType(type: CardType): CardBuilder;
  setAttribute(attribute: CardAttribute): CardBuilder;
  setCost(cost: number): CardBuilder;
  setCostType(costType: CardCostType): CardBuilder;
  setUnique(unique: boolean): CardBuilder;
  setLimitPerLesson(limit: number | null): CardBuilder;
  addEffect(effect: SkillCardEffect): CardBuilder;
  setDescription(description: string): CardBuilder;
  setImageUrl(url: string): CardBuilder;
  build(): SkillCard;
}
