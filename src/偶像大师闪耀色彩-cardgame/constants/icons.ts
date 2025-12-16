/**
 * 游戏图标CDN URLs
 *
 * 所有图标托管在GitHub CDN上
 */

const CDN_BASE = 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标';

/**
 * V/D/V 三维属性图标
 */
export const ATTRIBUTE_ICONS = {
  vocal: `${CDN_BASE}/Vocal.png`,
  dance: `${CDN_BASE}/Dance.png`,
  visual: `${CDN_BASE}/Visual.png`,
} as const;

/**
 * 资源图标
 */
export const RESOURCE_ICONS = {
  stamina: `${CDN_BASE}/体力.png`, // 体力图标
} as const;

/**
 * 培育计划图标
 */
export const PLAN_ICONS = {
  sense: `${CDN_BASE}/感性.png`, // 感性（センス）
  logic: `${CDN_BASE}/理性.png`, // 理性（ロジック）
  anomaly: `${CDN_BASE}/非凡.png`, // 非凡（アノマリー）
} as const;

/**
 * Buff图标
 */
export const BUFF_ICONS = {
  // 感性系统
  好調: `${CDN_BASE}/好调.png`, // 好調（得分+50%）
  集中: `${CDN_BASE}/集中.png`, // 集中（每层+15分）
  絶好調: `${CDN_BASE}/好调.png`, // 絶好調（使用好調图标）

  // 理性系统
  好印象: `${CDN_BASE}/好印象.png`, // 好印象（回合结束得分）
  有干劲: `${CDN_BASE}/干劲.png`, // 有干劲（元气获取+30%）

  // 非凡系统
  全力状态: `${CDN_BASE}/全力.png`, // 全力状态（得分×3或×4）
  强气状态: `${CDN_BASE}/强气.png`, // 强气状态（使用卡牌+全力值）
  温存状态: `${CDN_BASE}/温存.png`, // 温存状态
  悠闲状态: `${CDN_BASE}/悠闲.png`, // 悠闲状态
  // 温存状态暂无图标
} as const;

/**
 * 获取属性图标URL
 */
export function getAttributeIcon(attribute: 'vocal' | 'dance' | 'visual'): string {
  return ATTRIBUTE_ICONS[attribute];
}

/**
 * 获取培育计划图标URL
 */
export function getPlanIcon(plan: 'sense' | 'logic' | 'anomaly'): string {
  return PLAN_ICONS[plan];
}

/**
 * 获取Buff图标URL
 */
export function getBuffIcon(buffType: string): string | undefined {
  return BUFF_ICONS[buffType as keyof typeof BUFF_ICONS];
}

/**
 * 获取资源图标URL
 */
export function getResourceIcon(resource: 'stamina'): string {
  return RESOURCE_ICONS[resource];
}

/**
 * 所有图标的完整映射
 */
export const GAME_ICONS = {
  ...ATTRIBUTE_ICONS,
  ...RESOURCE_ICONS,
  ...PLAN_ICONS,
  ...BUFF_ICONS,
} as const;

/**
 * 图标类型定义
 */
export type AttributeIcon = keyof typeof ATTRIBUTE_ICONS;
export type ResourceIcon = keyof typeof RESOURCE_ICONS;
export type PlanIcon = keyof typeof PLAN_ICONS;
export type BuffIcon = keyof typeof BUFF_ICONS;
export type GameIcon = keyof typeof GAME_ICONS;
