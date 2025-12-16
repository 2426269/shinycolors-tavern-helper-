/**
 * Spine卡面解锁检查工具
 *
 * 根据抽卡获得的卡牌，判断Spine卡面是否已解锁
 * - P_SSR和P_SR类型需要抽到对应卡牌才能解锁
 * - 其他类型（Anniversary, Mizugi, Special等）默认解锁
 */

import { ALL_CARDS } from '../卡牌管理/全部卡牌数据';
import type { SpineCard } from './spine资源映射';

// 需要通过抽卡解锁的dressType
const GACHA_REQUIRED_TYPES = ['P_SSR', 'P_SR'];

// 默认解锁的特殊卡牌（R卡，没有对应的抽卡数据）
const DEFAULT_UNLOCKED_ENZAIDS = [
  '1930260010', // 【白いツバサ】斑鳩ルカ (P_SR/R卡)
  '1930270010', // 【白いツバサ】鈴木羽那 (P_SR/R卡)
  '1930280010', // 【白いツバサ】郁田はるき (P_SR/R卡)
];

/**
 * 检查单个Spine卡面是否已解锁
 * @param spineCard Spine卡面数据
 * @param ownedEnzaIds 已拥有卡牌的enzaId集合
 */
export function isSpineCardUnlocked(spineCard: SpineCard, ownedEnzaIds: Set<string>): boolean {
  // 非P卡类型默认解锁
  if (!GACHA_REQUIRED_TYPES.includes(spineCard.dressType)) {
    return true;
  }

  // 特殊R卡默认解锁
  if (DEFAULT_UNLOCKED_ENZAIDS.includes(spineCard.enzaId)) {
    return true;
  }

  // P卡需要检查是否拥有对应enzaId的卡牌
  return ownedEnzaIds.has(spineCard.enzaId);
}

/**
 * 从拥有的卡牌数据中提取enzaId集合
 * @param ownedCards 图鉴store中的ownedCards数据
 */
export function getOwnedEnzaIds(ownedCards: Record<string, any>): Set<string> {
  const enzaIds = new Set<string>();

  for (const cardKey of Object.keys(ownedCards)) {
    const cardData = ownedCards[cardKey];
    // 兼容不同格式：可能有count字段，也可能直接存在就表示拥有
    if (cardData) {
      // 查找对应的fullName（cardKey可能是fullName或其他ID）
      const card = ALL_CARDS.find(c => c.fullName === cardKey || c.fullName === cardData.fullName);
      if (card && (card as any).enzaId) {
        enzaIds.add((card as any).enzaId);
      }
    }
  }

  return enzaIds;
}

/**
 * 检查是否需要解锁（是否是P_SSR/P_SR类型）
 */
export function requiresUnlock(dressType: string): boolean {
  return GACHA_REQUIRED_TYPES.includes(dressType);
}
