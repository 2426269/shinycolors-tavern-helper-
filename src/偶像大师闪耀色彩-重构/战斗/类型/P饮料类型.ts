/**
 * P饮料类型定义
 * P饮料是在训练、比赛中使用的道具，可以获得一定效果
 */

import type { ProducePlan } from './技能卡类型';

/**
 * P饮料类型
 */
export type PDrinkType = '通用' | '感性专属' | '理性专属' | '非凡专属';

/**
 * P饮料稀有度（根据效果强度划分）
 */
export type PDrinkRarity = '普通' | '高级' | '特级';

/**
 * P饮料数据结构
 */
export interface PDrink {
  /** 饮料ID */
  id: string;

  /** 日文名称 */
  nameJP: string;

  /** 中文名称 */
  nameCN: string;

  /** 饮料类型 */
  type: PDrinkType;

  /** 稀有度 */
  rarity: PDrinkRarity;

  /** 效果描述 */
  effect: string;

  /** 绑定的培育计划（如果是专属饮料） */
  exclusivePlan?: ProducePlan;
}

/**
 * P饮料效果分类
 */
export interface PDrinkEffectCategory {
  /** 直接得分 */
  directScore?: number;

  /** 增加属性 */
  addAttribute?: {
    energy?: number;
    fullPower?: number;
  };

  /** 增加Buff */
  addBuff?: {
    goodCondition?: number; // 好调
    concentration?: number; // 集中
    goodImpression?: number; // 好印象
    motivation?: number; // 有干劲
    perfectCondition?: number; // 绝好调
    staminaCostReduction?: number; // 体力消耗减少
    additionalCardUse?: number; // 技能卡使用数追加
  };

  /** 体力相关 */
  stamina?: {
    recovery?: number; // 体力回复
    cost?: number; // 体力消耗
  };

  /** 特殊效果 */
  specialEffect?: string;
}

/**
 * P饮料筛选条件
 */
export interface PDrinkFilter {
  /** 饮料类型 */
  type?: PDrinkType | PDrinkType[];

  /** 稀有度 */
  rarity?: PDrinkRarity | PDrinkRarity[];

  /** 专属培育计划 */
  exclusivePlan?: ProducePlan;

  /** 搜索关键词 */
  keyword?: string;
}

/**
 * 玩家持有的P饮料
 */
export interface PlayerPDrink {
  /** 饮料数据 */
  drink: PDrink;

  /** 持有数量 */
  count: number;

  /** 获得时间 */
  acquiredAt: Date;
}

