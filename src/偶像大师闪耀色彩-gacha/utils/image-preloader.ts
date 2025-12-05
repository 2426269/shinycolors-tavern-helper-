/**
 * 图片预加载工具
 *
 * 功能：
 * - 预加载关键图片（UP角色卡、常见SSR）
 * - 提升用户体验（减少白屏等待）
 * - 后台加载，不阻塞主流程
 */

import { buildUrlFromFileName } from '../card-utils';
import { ALL_CARDS } from '../data/all-cards';
import { loadImageWithCache, preloadAndCacheImages } from './image-cache';

/**
 * 预加载UP角色卡（最高优先级）
 *
 * 在进入抽卡页面时立即加载，确保卡池背景快速显示
 */
export async function preloadPickupCard(): Promise<void> {
  // 从 ALL_CARDS 中查找标记为 pickup 的卡
  const pickupCard = ALL_CARDS.find(card => (card as any).isPickup);

  if (!pickupCard) {
    console.warn('[预加载] 未找到UP角色卡，跳过预加载');
    return;
  }

  const pickupCardUrl = buildUrlFromFileName(pickupCard.baseImage, false);

  console.log('[预加载] UP角色卡...', pickupCard.fullName);
  try {
    await loadImageWithCache(pickupCardUrl);
    console.log('[预加载完成] UP角色卡');
  } catch (error) {
    console.error('[预加载失败] UP角色卡:', error);
  }
}

/**
 * 预加载常见SSR卡面（后台加载）
 *
 * 在用户浏览卡池时，后台预加载最常抽到的SSR卡面
 * 不阻塞主流程，提升十连动画流畅度
 */
export async function preloadCommonSSRCards(limit: number = 10): Promise<void> {
  // 取前N张SSR卡（所有卡默认都是SSR）
  const ssrCards = ALL_CARDS.filter(card => card.rarity === 'SSR').slice(0, limit);

  const cardUrls = ssrCards.map(card => buildUrlFromFileName(card.baseImage, false));

  console.log(`[后台预加载] 前${limit}张SSR...`);
  try {
    await preloadAndCacheImages(cardUrls);
    console.log(`[后台预加载完成] ${limit}张SSR卡面`);
  } catch (error) {
    console.error('[后台预加载失败]:', error);
  }
}
