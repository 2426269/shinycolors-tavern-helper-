/**
 * 角色卡属性类型定义
 */

export type AttributeType = '理性' | '感性' | '非凡';

export type RecommendedStyle =
  | '坚决'
  | '全力' // 非凡
  | '好印象'
  | '干劲' // 理性
  | '好调'
  | '集中'; // 感性

export interface CardAttribute {
  attributeType: AttributeType;
  stamina: number; // 25-35
  recommendedStyle: RecommendedStyle;
  stats: {
    vocal: number;
    dance: number;
    visual: number;
  };
}

/**
 * 根据属性类型获取图标
 */
export function getAttributeIcon(attributeType: AttributeType): string {
  const iconMap = {
    理性: 'https://283pro.site/shinycolors/游戏图标/理性.png',
    感性: 'https://283pro.site/shinycolors/游戏图标/感性.png',
    非凡: 'https://283pro.site/shinycolors/游戏图标/非凡.png',
  };
  return iconMap[attributeType];
}

/**
 * 根据推荐流派获取图标
 */
export function getStyleIcon(style: RecommendedStyle): string {
  const iconMap = {
    好调: 'https://283pro.site/shinycolors/游戏图标/好调.png',
    集中: 'https://283pro.site/shinycolors/游戏图标/集中.png',
    好印象: 'https://283pro.site/shinycolors/游戏图标/好印象.png',
    干劲: 'https://283pro.site/shinycolors/游戏图标/干劲.png',
    全力: 'https://283pro.site/shinycolors/游戏图标/全力.png',
    坚决: 'https://283pro.site/shinycolors/游戏图标/坚决.png',
  };
  return iconMap[style];
}

/**
 * 获取属性类型的颜色
 */
export function getAttributeColor(attributeType: AttributeType): string {
  const colorMap = {
    理性: '#4A90E2', // 蓝色
    感性: '#FF69B4', // 粉色
    非凡: '#9B59B6', // 紫色
  };
  return colorMap[attributeType];
}
