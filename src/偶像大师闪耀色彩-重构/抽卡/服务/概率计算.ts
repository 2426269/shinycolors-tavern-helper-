/**
 * 抽卡概率计算模块
 */

import type { GachaUserData, Rarity } from '../../../偶像大师闪耀色彩-gacha/types';
import { BASE_RATES, PITY_CONFIG } from '../../工具/constants';

/**
 * 随机稀有度（考虑保底机制）
 * @param ssrPity - 当前SSR保底计数
 * @param urPity - 当前UR保底计数
 * @param forcePity - 强制保底稀有度（用于十连保底）
 * @returns 抽取到的稀有度
 */
export function rollRarity(ssrPity: number, urPity: number, forcePity?: Rarity): Rarity {
  // 强制保底（十连最后一抽保证SR）
  if (forcePity) {
    return forcePity;
  }

  // UR保底检查
  if (urPity >= PITY_CONFIG.UR_PITY) {
    console.log('🎉 UR保底触发！');
    return 'UR';
  }

  // SSR保底检查
  if (ssrPity >= PITY_CONFIG.SSR_PITY) {
    console.log('🎉 SSR保底触发！');
    return 'SSR';
  }

  // 正常概率随机
  const random = Math.random();
  let cumulative = 0;

  for (const [rarity, rate] of Object.entries(BASE_RATES)) {
    cumulative += rate;
    if (random < cumulative) {
      return rarity as Rarity;
    }
  }

  // Fallback（理论上不应该到达这里）
  return 'R';
}

/**
 * 更新保底计数
 * @param userData - 用户数据
 * @param rarity - 本次抽取到的稀有度
 */
export function updatePityCount(userData: GachaUserData, rarity: Rarity): void {
  userData.pity.totalPulls++;

  if (rarity === 'UR') {
    // 抽到UR，重置所有保底
    userData.pity.urPity = 0;
    userData.pity.ssrPity = 0;
  } else if (rarity === 'SSR') {
    // 抽到SSR，重置SSR保底，UR保底+1
    userData.pity.ssrPity = 0;
    userData.pity.urPity++;
  } else {
    // 抽到SR或R，所有保底+1
    userData.pity.ssrPity++;
    userData.pity.urPity++;
  }
}

/**
 * 获取下一次保底的剩余抽数
 */
export function getNextPity(userData: GachaUserData): {
  ssrRemaining: number;
  urRemaining: number;
} {
  return {
    ssrRemaining: Math.max(0, PITY_CONFIG.SSR_PITY - userData.pity.ssrPity),
    urRemaining: Math.max(0, PITY_CONFIG.UR_PITY - userData.pity.urPity),
  };
}

/**
 * 检查稀有度是否合法
 */
export function isValidRarity(value: any): value is Rarity {
  return ['R', 'SR', 'SSR', 'UR'].includes(value);
}
