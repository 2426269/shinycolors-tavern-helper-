/**
 * 卡池管理器
 *
 * 负责管理所有卡池，提供卡池查询和切换功能
 */

import { STARRY_NIGHT_POOL, POOL_STATS as STARRY_NIGHT_STATS } from './data/pools/starry-night';
import type { GachaPool, PoolStats, RealCard } from './types';

// ============================================================================
// 卡池注册表
// ============================================================================

/**
 * 所有可用卡池
 * 未来新增卡池时，在这里添加
 */
const AVAILABLE_POOLS: GachaPool[] = [
  STARRY_NIGHT_POOL,
  // 未来的卡池...
];

// ============================================================================
// 卡池查询
// ============================================================================

/**
 * 获取当前活动卡池
 * 目前固定返回 "星月夜を歩いて"
 * 未来可以根据日期或用户选择返回不同卡池
 */
export function getCurrentPool(): GachaPool {
  return STARRY_NIGHT_POOL;
}

/**
 * 根据ID获取卡池
 */
export function getPoolById(poolId: string): GachaPool | undefined {
  return AVAILABLE_POOLS.find(pool => pool.id === poolId);
}

/**
 * 获取所有可用卡池
 */
export function getAllPools(): GachaPool[] {
  return [...AVAILABLE_POOLS];
}

/**
 * 获取所有活动中的卡池
 */
export function getActivePools(): GachaPool[] {
  return AVAILABLE_POOLS.filter(pool => pool.status === 'active');
}

// ============================================================================
// 卡池统计
// ============================================================================

/**
 * 计算卡池统计信息
 */
export function getPoolStats(pool: GachaPool): PoolStats {
  const allCards = [pool.pickupCard, ...pool.cards];

  return {
    total: allCards.length,
    ur: allCards.filter(card => card.rarity === 'UR').length,
    ssr: allCards.filter(card => card.rarity === 'SSR').length,
    sr: allCards.filter(card => card.rarity === 'SR').length,
    pickup: 1, // UP角色始终为1
  };
}

/**
 * 获取当前卡池的统计信息
 * 使用预计算的统计数据，性能更好
 */
export function getCurrentPoolStats(): PoolStats {
  return STARRY_NIGHT_STATS;
}

/**
 * 获取卡池中的所有卡片（包括UP角色）
 */
export function getAllCardsInPool(pool: GachaPool): RealCard[] {
  return [pool.pickupCard, ...pool.cards];
}

/**
 * 获取卡池中指定稀有度的卡片
 */
export function getCardsByRarity(pool: GachaPool, rarity: 'UR' | 'SSR' | 'SR' | 'R'): RealCard[] {
  const allCards = getAllCardsInPool(pool);
  return allCards.filter(card => card.rarity === rarity);
}

// ============================================================================
// 调试信息
// ============================================================================

/**
 * 打印当前卡池信息（用于调试）
 */
export function logCurrentPoolInfo(): void {
  const pool = getCurrentPool();
  const stats = getCurrentPoolStats();

  console.log('📦 当前卡池信息:');
  console.log(`  ID: ${pool.id}`);
  console.log(`  名称: ${pool.name}`);
  console.log(`  描述: ${pool.description}`);
  console.log(`  状态: ${pool.status}`);
  console.log(`  UP角色: ${pool.pickupCard.fullName}`);
  console.log(`\n📊 卡池统计:`);
  console.log(`  总计: ${stats.total} 张`);
  console.log(`  UR: ${stats.ur} 张 (含 ${stats.pickup} 张UP)`);
  console.log(`  SSR: ${stats.ssr} 张`);
  console.log(`  SR: ${stats.sr} 张`);
}

// 自动打印卡池信息（可选）
// logCurrentPoolInfo();
