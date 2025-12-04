/**
 * 抽卡核心逻辑（真实卡片数据版）
 *
 * 使用卡池系统，从当前活动卡池中抽取卡片
 */

import type { GachaResult, GachaUserData, Rarity, RealCard } from '../../../偶像大师闪耀色彩-gacha/types';
import { PITY_CONFIG, STARDUST_CONVERSION } from '../../工具/constants';
import { buildUrlFromFileName } from '../../工具/卡牌工具';
import { getAllCardsInPool, getCurrentPool } from './卡池管理器';
import { rollRarity, updatePityCount } from './概率计算';

// ============================================================================
// 卡池初始化
// ============================================================================

/**
 * 从当前卡池获取所有可抽取卡片
 */
function getPoolCards() {
  const currentPool = getCurrentPool();
  const allCards = getAllCardsInPool(currentPool);

  return {
    ALL_POOL_CARDS: allCards,
    AVAILABLE_UR_CARDS: allCards.filter(card => card.rarity === 'UR'),
    AVAILABLE_SSR_CARDS: allCards.filter(card => card.rarity === 'SSR'),
    AVAILABLE_SR_CARDS: allCards.filter(card => card.rarity === 'SR'),
    AVAILABLE_R_CARDS: allCards.filter(card => card.rarity === 'R'),
    PICKUP_CARD: currentPool.pickupCard,
  };
}

// 初始化卡池
const { ALL_POOL_CARDS, AVAILABLE_UR_CARDS, AVAILABLE_SSR_CARDS, AVAILABLE_SR_CARDS, AVAILABLE_R_CARDS, PICKUP_CARD } =
  getPoolCards();

console.log('🎴 卡池统计:', {
  总计: ALL_POOL_CARDS.length,
  UR: AVAILABLE_UR_CARDS.length,
  SSR: AVAILABLE_SSR_CARDS.length,
  SR: AVAILABLE_SR_CARDS.length,
  R: AVAILABLE_R_CARDS.length,
  UP角色: PICKUP_CARD.fullName,
});

/**
 * 从指定稀有度池中随机选择一张卡（仅从有卡面的卡片中选择）
 *
 * UR池特殊处理：
 * - 50% 概率抽到 UP 角色
 * - 50% 概率从其他 UR 中随机抽取
 */
function pickCardFromPool(rarity: Rarity): RealCard {
  let pool: RealCard[];

  switch (rarity) {
    case 'UR':
      // UP 角色概率提升：50% 概率直接返回 UP 角色
      if (Math.random() < 0.5) {
        console.log('✨ 抽到 UP 角色!', PICKUP_CARD.fullName);
        return PICKUP_CARD;
      }

      // 50% 概率从其他 UR 中抽取
      pool = AVAILABLE_UR_CARDS.filter(card => !card.isPickup);
      if (pool.length === 0) {
        // 如果没有其他UR，返回UP角色
        return PICKUP_CARD;
      }
      break;

    case 'SSR':
      pool = [...AVAILABLE_SSR_CARDS];
      break;

    case 'SR':
      pool = [...AVAILABLE_SR_CARDS];
      break;

    case 'R':
      pool = [...AVAILABLE_R_CARDS];
      // R卡池为空时，从SR卡池中选择（因为所有R卡都没有卡面）
      if (pool.length === 0) {
        console.warn('⚠️ R卡池为空，从SR卡池中选择');
        pool = [...AVAILABLE_SR_CARDS];
      }
      break;

    default:
      throw new Error(`未知的稀有度: ${rarity}`);
  }

  if (pool.length === 0) {
    throw new Error(`${rarity} 稀有度池为空！`);
  }

  // 随机选择一张卡
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * 获取可用卡片池（用于概率显示）
 */
export function getAvailableCardPools(): { UR: RealCard[]; SSR: RealCard[]; SR: RealCard[]; R: RealCard[] } {
  return {
    UR: AVAILABLE_UR_CARDS,
    SSR: AVAILABLE_SSR_CARDS,
    SR: AVAILABLE_SR_CARDS,
    R: AVAILABLE_R_CARDS,
  };
}

/**
 * 执行单次抽卡（真实数据版）
 */
export function performSinglePullReal(userData: GachaUserData, forcePity?: Rarity): GachaResult {
  // 1. 随机稀有度（考虑保底）
  const rarity = rollRarity(userData.pity.ssrPity, userData.pity.urPity, forcePity);

  // 2. 从该稀有度池中随机选择卡片
  const card = pickCardFromPool(rarity);

  // 3. 构建卡片ID（使用卡片全名作为唯一标识）
  const cardId = card.fullName;

  // 4. 检查是否已拥有
  const isNew = !userData.ownedCards[cardId];

  // 5. 计算星尘
  const stardust = isNew ? 0 : STARDUST_CONVERSION[rarity];

  // 6. 更新拥有记录
  if (isNew) {
    userData.ownedCards[cardId] = {
      fullName: card.fullName,
      obtainedAt: new Date().toISOString(),
      hasSkill: false,
    };
  } else {
    // 重复卡转星尘
    userData.stardust += stardust;
  }

  // 7. 更新保底计数
  updatePityCount(userData, rarity);

  // 8. 构建结果对象 - 使用baseImage直接构建URL
  const result: GachaResult = {
    characterEn: card.character, // 使用角色名的日文版
    characterName: card.character,
    rarity,
    cardNumber: 1, // 真实卡片不需要编号
    fullCardName: card.fullName,
    imageUrl: buildUrlFromFileName(card.baseImage, false), // 使用基础卡面
    isNew,
    stardust,
  };

  // 9. 日志输出
  console.log('🎴 抽卡结果:', {
    card: card.fullName,
    character: card.character,
    rarity,
    isNew: isNew ? 'NEW!' : '重复',
    pity: `SSR: ${userData.pity.ssrPity}/${PITY_CONFIG.SSR_PITY}, UR: ${userData.pity.urPity}/${PITY_CONFIG.UR_PITY}`,
  });

  return result;
}

/**
 * 执行十连抽卡（真实数据版）
 */
export function performTenPullReal(userData: GachaUserData): GachaResult[] {
  const results: GachaResult[] = [];

  // 前9抽正常抽取
  for (let i = 0; i < 9; i++) {
    const result = performSinglePullReal(userData);
    results.push(result);
  }

  // 第10抽保底SR
  const lastResult = performSinglePullReal(userData, 'SR');
  results.push(lastResult);

  // 按稀有度排序（UR > SSR > SR > R）
  const rarityOrder = { UR: 0, SSR: 1, SR: 2, R: 3 };
  results.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);

  console.log('🎁 十连结果:', {
    total: results.length,
    UR: results.filter(r => r.rarity === 'UR').length,
    SSR: results.filter(r => r.rarity === 'SSR').length,
    SR: results.filter(r => r.rarity === 'SR').length,
    R: results.filter(r => r.rarity === 'R').length,
  });

  return results;
}

/**
 * 获取UP角色的UR卡信息
 */
export function getPickupCardInfo(): RealCard {
  return PICKUP_CARD;
}
