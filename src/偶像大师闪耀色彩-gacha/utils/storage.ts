/**
 * 数据持久化模块
 * 使用IndexedDB存储（通过主界面的game-data模块）
 */

import { INITIAL_RESOURCES } from '../constants';
import type { GachaUserData } from '../types';
import { getGachaData, saveGachaData } from '../../偶像大师闪耀色彩/utils/game-data';

/**
 * 加载用户数据
 */
export async function loadUserData(): Promise<GachaUserData> {
  try {
    const data = await getGachaData();
    console.log('📦 从IndexedDB加载用户数据成功');
    
    // 转换数据格式（兼容旧格式）
    return {
      stardust: data.stardust,
      level: INITIAL_RESOURCES.level,
      exp: INITIAL_RESOURCES.exp,
      ownedCards: data.ownedCards as any,
      pity: data.pity,
      history: data.history as any,
    };
  } catch (error) {
    console.error('❌ 加载用户数据失败:', error);
    return createInitialData();
  }
}

/**
 * 保存用户数据
 */
export async function saveUserData(userData: GachaUserData): Promise<void> {
  try {
    await saveGachaData({
      stardust: userData.stardust,
      ownedCards: userData.ownedCards as any,
      pity: userData.pity,
      history: userData.history as any,
    });
    console.log('💾 保存用户数据到IndexedDB成功');
  } catch (error) {
    console.error('❌ 保存用户数据失败:', error);
    toastr.error('数据保存失败！');
  }
}

/**
 * 创建初始数据
 * 注意：羽石由主界面管理，不在这里存储
 */
function createInitialData(): GachaUserData {
  return {
    stardust: INITIAL_RESOURCES.stardust,
    level: INITIAL_RESOURCES.level,
    exp: INITIAL_RESOURCES.exp,
    ownedCards: {},
    pity: {
      totalPulls: 0,
      ssrPity: 0,
      urPity: 0,
    },
    history: [],
  };
}

/**
 * 重置用户数据（开发测试用）
 * 注意：不会重置羽石，羽石由主界面管理
 */
export async function resetUserData(): Promise<void> {
  const initial = createInitialData();
  await saveUserData(initial);
  toastr.success('数据已重置！（羽石保留）');
  console.log('🔄 数据已重置');
}

/**
 * 设置保底（开发测试用）
 */
export async function devSetPity(ssrPity: number, urPity: number): Promise<void> {
  const userData = await loadUserData();
  userData.pity.ssrPity = ssrPity;
  userData.pity.urPity = urPity;
  await saveUserData(userData);
  toastr.success(`保底已设置：SSR ${ssrPity}, UR ${urPity}`);
  console.log(`🎯 设置保底: SSR ${ssrPity}, UR ${urPity}`);
}

/**
 * 导出数据（备份用）
 */
export async function exportUserData(): Promise<string> {
  const userData = await loadUserData();
  return JSON.stringify(userData, null, 2);
}

/**
 * 导入数据（恢复用）
 */
export async function importUserData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);

    // 基础验证（不再验证gems，因为它由主界面管理）
    if (!data.ownedCards || !data.pity) {
      throw new Error('数据格式不正确');
    }

    await saveUserData(data);
    toastr.success('数据导入成功！');
    return true;
  } catch (error) {
    console.error('❌ 导入数据失败:', error);
    toastr.error('数据导入失败！');
    return false;
  }
}
