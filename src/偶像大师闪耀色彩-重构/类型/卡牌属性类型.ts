/**
 * 角色卡属性类型定义
 */

export type AttributeType = '理性' | '感性' | '非凡';

export type RecommendedStyle =
  | '强气'
  | '全力'
  | '温存' // 非凡
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
    理性: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/理性.png',
    感性: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/感性.png',
    非凡: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/非凡.png',
  };
  return iconMap[attributeType];
}

/**
 * 根据推荐流派获取图标
 */
export function getStyleIcon(style: RecommendedStyle): string {
  const iconMap = {
    好调: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好调.png',
    集中: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/集中.png',
    好印象: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好印象.png',
    干劲: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/干劲.png',
    全力: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/全力.png',
    强气: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/强气.png',
    温存: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/温存.png',
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

/**
 * Buff图标URL常量（基于CDN）
 */
const CDN_BASE = 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标';

/**
 * 获取Buff效果图标URL
 * @param buffName Buff名称（中文）
 * @returns 图标URL，如果未找到返回空字符串
 */
export function getBuffIcon(buffName: string): string {
  const iconMap: Record<string, string> = {
    // === 基础资源 ===
    元气: `${CDN_BASE}/元气.png`,
    体力: `${CDN_BASE}/体力.png`,
    手牌: `${CDN_BASE}/手牌.png`,
    全力值: `${CDN_BASE}/全力值.png`,
    数值: `${CDN_BASE}/数值.png`,

    // === 感性计划Buff ===
    好调: `${CDN_BASE}/好调.png`,
    状态良好: `${CDN_BASE}/好调.png`,
    集中: `${CDN_BASE}/集中.png`,
    绝好调: `${CDN_BASE}/绝好调.png`,
    状态绝佳: `${CDN_BASE}/绝好调.png`,
    状态极佳: `${CDN_BASE}/状态极佳.png`,

    // === 理性计划Buff ===
    好印象: `${CDN_BASE}/好印象.png`,
    好印象增加量增加: `${CDN_BASE}/好印象增加量增加.png`,
    好印象强化: `${CDN_BASE}/好印象强化.png`,
    干劲: `${CDN_BASE}/干劲.png`,
    有干劲: `${CDN_BASE}/干劲.png`,

    // === 非凡计划Buff ===
    全力: `${CDN_BASE}/全力.png`,
    全力状态: `${CDN_BASE}/全力.png`,
    强气: `${CDN_BASE}/强气.png`,
    强气状态: `${CDN_BASE}/强气.png`,
    温存: `${CDN_BASE}/温存.png`,
    温存状态: `${CDN_BASE}/温存.png`,
    悠闲: `${CDN_BASE}/悠闲.png`,
    悠闲状态: `${CDN_BASE}/悠闲.png`,
    热意: `${CDN_BASE}/强气.png`, // 热意使用强气图标

    // === 通用正面Buff ===
    消费体力减少: `${CDN_BASE}/消费体力减少.png`,
    消费体力削减: `${CDN_BASE}/消费体力削减.png`,
    技能卡使用数追加: `${CDN_BASE}/技能卡使用次数加一.png`,
    '技能卡使用次数+1': `${CDN_BASE}/技能卡使用次数加一.png`,
    应援: `${CDN_BASE}/应援.png`,
    数值提升: `${CDN_BASE}/数值提升.png`,
    成长: `${CDN_BASE}/成长.png`,
    回合数追加: `${CDN_BASE}/回合数追加.png`,
    低下状态无效: `${CDN_BASE}/低下状态无效.png`,

    // === 负面Buff ===
    消费体力增加: `${CDN_BASE}/消费体力增加.png`,
    消费体力追加: `${CDN_BASE}/消费体力追加.png`,
    元气增加无效: `${CDN_BASE}/元气增加无效.png`,
    不安: `${CDN_BASE}/不安.png`,
    手牌减少: `${CDN_BASE}/手牌减少.png`,
    特定技能卡使用不可: `${CDN_BASE}/禁用部分手牌.png`,
    不调: `${CDN_BASE}/状态不佳.png`,
    状态不佳: `${CDN_BASE}/状态不佳.png`,
    低迷: `${CDN_BASE}/精神萎靡.png`,
    精神萎靡: `${CDN_BASE}/精神萎靡.png`,
    变化无常: `${CDN_BASE}/心情浮躁.png`,
    心情浮躁: `${CDN_BASE}/心情浮躁.png`,
    弱气: `${CDN_BASE}/胆怯.png`,
    胆怯: `${CDN_BASE}/胆怯.png`,
  };

  return iconMap[buffName] || '';
}
