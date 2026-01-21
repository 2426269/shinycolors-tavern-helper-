/**
 * 相谈服务 (ConsultationService)
 * 管理商店商品生成、购买逻辑
 */

import { getPDrinkUrl, getSkillCardUrl } from '../../工具/cdn-config';
import { P_DRINKS_BY_TYPE } from '../../战斗/数据/P饮料数据库';
import type { CardRarity, ProducePlan, SkillCard } from '../../战斗/类型';
import type { PDrink } from '../../战斗/类型/P饮料类型';
import {
  type ShopItem,
  DRINK_INVENTORY_LIMIT,
  DrinkRarityPrice,
  ENHANCE_LIMIT_PER_CONSULTATION,
  REMOVE_LIMIT_PER_CONSULTATION,
} from '../类型/ConsultationTypes';

// ==================== 配置常量 ====================

/** 稀有度权重 (用于卡牌) */
const RARITY_WEIGHTS: Record<CardRarity, number> = {
  N: 0.25,
  R: 0.2,
  SR: 0.35,
  SSR: 0.2,
};

/** SALE 概率 */
const SALE_PROBABILITY = 0.2;

/** SALE 折扣率 */
const SALE_DISCOUNT = 0.3;

/** 卡牌基础价格 */
const CARD_BASE_PRICE: Record<CardRarity, number> = {
  N: 50,
  R: 60,
  SR: 100,
  SSR: 150,
};

// ==================== 商品生成 ====================

/**
 * 生成商店商品列表
 * @param plan 当前培育计划
 * @param progress 培育进度 (0-100)
 * @param cardPool 可用卡池
 * @returns 8 个商品 (4 卡牌 + 4 饮料)
 */
export function generateInventory(plan: ProducePlan, progress: number, cardPool: SkillCard[]): ShopItem[] {
  const items: ShopItem[] = [];

  // 生成 4 个卡牌商品
  const filteredCards = filterCardsByPlan(cardPool, plan);
  for (let i = 0; i < 4; i++) {
    const card = pickRandomCard(filteredCards, progress);
    if (card) {
      items.push(createCardShopItem(card, `card_${i}`));
    }
  }

  // 生成 4 个饮料商品
  const drinks = generateDrinkInventory(plan);
  items.push(...drinks);

  return items;
}

/**
 * 根据培育计划过滤卡池
 */
function filterCardsByPlan(cardPool: SkillCard[], plan: ProducePlan): SkillCard[] {
  // 目前假设卡池已经是匹配当前流派的，直接返回
  // 如果需要更复杂的过滤逻辑，可以在这里实现
  return cardPool;
}

/**
 * 随机选择一张卡牌 (考虑稀有度权重)
 */
function pickRandomCard(cards: SkillCard[], progress: number): SkillCard | null {
  if (cards.length === 0) return null;

  // 根据进度调整 SSR 权重
  const progressBonus = Math.min(progress / 100, 0.5) * 0.1; // 最多增加 10%
  const adjustedWeights = { ...RARITY_WEIGHTS };
  adjustedWeights.SSR += progressBonus;

  // 随机选择稀有度
  const rarity = weightedRandomRarity(adjustedWeights);

  // 从对应稀有度的卡牌中随机选择
  const rarityCards = cards.filter(c => c.rarity === rarity);
  if (rarityCards.length === 0) {
    // 如果没有对应稀有度的卡，随机选一张
    return cards[Math.floor(Math.random() * cards.length)];
  }

  return rarityCards[Math.floor(Math.random() * rarityCards.length)];
}

/**
 * 加权随机选择稀有度
 */
function weightedRandomRarity(weights: Record<CardRarity, number>): CardRarity {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * total;

  for (const [rarity, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return rarity as CardRarity;
    }
  }

  return 'SR'; // 默认
}

/**
 * 生成饮料商品
 */
function generateDrinkInventory(plan: ProducePlan): ShopItem[] {
  const items: ShopItem[] = [];

  // 映射流派到饮料类型
  const planToType: Record<ProducePlan, string> = {
    sense: '感性专属',
    logic: '理性专属',
    anomaly: '非凡专属',
  };

  const exclusiveType = planToType[plan];

  // 从通用饮料和专属饮料中各选取
  const commonDrinks = P_DRINKS_BY_TYPE['通用'];
  const exclusiveDrinks = P_DRINKS_BY_TYPE[exclusiveType as keyof typeof P_DRINKS_BY_TYPE] || [];

  // 随机选取 2 个通用 + 2 个专属
  const selectedCommon = pickRandomItems(commonDrinks, 2);
  const selectedExclusive = pickRandomItems(exclusiveDrinks, 2);

  let index = 0;
  for (const drink of [...selectedCommon, ...selectedExclusive]) {
    items.push(createDrinkShopItem(drink, `drink_${index}`));
    index++;
  }

  return items;
}

/**
 * 从数组中随机选取 N 个元素
 */
function pickRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * 创建卡牌商品
 */
function createCardShopItem(card: SkillCard, instanceId: string): ShopItem {
  const basePrice = CARD_BASE_PRICE[card.rarity];
  const isSale = Math.random() < SALE_PROBABILITY;
  const price = isSale ? Math.floor(basePrice * (1 - SALE_DISCOUNT)) : basePrice;

  return {
    id: instanceId,
    type: 'card',
    itemId: card.id,
    price,
    basePrice,
    isSale,
    isSoldOut: false,
    data: card,
  };
}

/**
 * 创建饮料商品
 */
function createDrinkShopItem(drink: PDrink, instanceId: string): ShopItem {
  const basePrice = DrinkRarityPrice[drink.rarity] || 50;
  const isSale = Math.random() < SALE_PROBABILITY;
  const price = isSale ? Math.floor(basePrice * (1 - SALE_DISCOUNT)) : basePrice;

  return {
    id: instanceId,
    type: 'drink',
    itemId: drink.id,
    price,
    basePrice,
    isSale,
    isSoldOut: false,
    data: drink,
  };
}

// ==================== 辅助函数 ====================

/**
 * 获取商品图标 URL
 */
export function getShopItemImageUrl(item: ShopItem): string {
  if (item.type === 'card') {
    const card = item.data as SkillCard;
    return card.imageUrl || getSkillCardUrl(card.name);
  } else {
    const drink = item.data as PDrink;
    return getPDrinkUrl(drink.id);
  }
}

/**
 * 检查是否可以购买
 */
export function canPurchase(item: ShopItem, pPoints: number, drinkCount: number): { canBuy: boolean; reason?: string } {
  if (item.isSoldOut) {
    return { canBuy: false, reason: '已售罄' };
  }

  if (pPoints < item.price) {
    return { canBuy: false, reason: 'P点不足' };
  }

  if (item.type === 'drink' && drinkCount >= DRINK_INVENTORY_LIMIT) {
    return { canBuy: false, reason: '饮料背包已满' };
  }

  return { canBuy: true };
}

// ==================== 导出配置 ====================

export { DRINK_INVENTORY_LIMIT, ENHANCE_LIMIT_PER_CONSULTATION, REMOVE_LIMIT_PER_CONSULTATION };
