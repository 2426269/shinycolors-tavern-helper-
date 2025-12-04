/**
 * 角色卡属性数据库
 * 自动生成于 2025-11-01T21:41:06.446Z
 * 总计: 414 张卡片
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
  "total": 414,
  "byAttribute": {
    "理性": 136,
    "感性": 139,
    "非凡": 139
  },
  "byRarity": {
    "UR": 3,
    "SSR": 283,
    "SR": 85,
    "R": 43
  }
};
