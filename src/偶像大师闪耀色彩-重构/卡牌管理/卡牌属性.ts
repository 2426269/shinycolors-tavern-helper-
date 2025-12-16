/**
 * 角色卡属性数据库
 * 自动生成于 2025-12-16
 * 总计: 452 张卡片 (SR/SSR/UR)
 */

import type { CardAttribute } from './card-attributes-types';
import attributesData from './card-attributes.json';

export const CARD_ATTRIBUTES: Record<string, CardAttribute> = attributesData as any;

/**
 * 根据卡片全名获取属性
 */
export function getCardAttribute(fullCardName: string): CardAttribute | undefined {
  return CARD_ATTRIBUTES[fullCardName];
}

/**
 * 统计信息
 */
export const ATTRIBUTE_STATS = {
  total: 452,
  byAttribute: {
    理性: 151,
    感性: 151,
    非凡: 150,
  },
  byRarity: {
    UR: 3,
    SSR: 340,
    SR: 109,
  },
};
