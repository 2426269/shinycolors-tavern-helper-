/**
 * 相谈组件类型定义
 */

import type { SkillCard } from '../../战斗/类型';
import type { PDrink } from '../../战斗/类型/P饮料类型';

// 商品类型
export type ShopItemType = 'card' | 'drink';

// 商店商品接口
export interface ShopItem {
  id: string; // 唯一实例 ID (用于列表渲染 key)
  type: ShopItemType; // 商品类型
  itemId: string; // 对应的 CardID 或 DrinkID
  price: number; // 最终价格
  basePrice: number; // 原价
  isSale: boolean; // 是否打折
  isSoldOut: boolean; // 是否已售出
  data: SkillCard | PDrink; // 原始数据
}

// 相谈状态
export interface ConsultationState {
  inventory: ShopItem[];
  refreshCount: number; // 刷新次数 (预留)
}

// 配置常量 (软上限)
export const DRINK_INVENTORY_LIMIT = 3; // 饮料背包上限
export const ENHANCE_LIMIT_PER_CONSULTATION = 1; // 每次相谈强化次数
export const REMOVE_LIMIT_PER_CONSULTATION = 1; // 每次相谈删除次数

// 饮料稀有度价格映射
export const DrinkRarityPrice: Record<string, number> = {
  普通: 50,
  高级: 75,
  特级: 100,
};
