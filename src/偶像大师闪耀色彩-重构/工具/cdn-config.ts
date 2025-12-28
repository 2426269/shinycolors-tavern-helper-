/**
 * 统一的 CDN 配置文件
 * 所有资源 URL 的基础配置集中管理
 */

// ============ 主域名配置 ============
export const CDN_DOMAIN = 'https://283pro.site';
export const CDN_BASE = `${CDN_DOMAIN}/shinycolors`;

// ============ 资源路径配置 ============

// 背景图
export const BACKGROUND_CDN = `${CDN_BASE}/background`;

// Spine 动画
export const SPINE_CDN = `${CDN_BASE}/spine`;

// 角色相关
export const AVATAR_CDN = `${CDN_BASE}/角色头像`;
export const THUMBNAIL_CDN = `${CDN_BASE}/角色缩略图`;

// 游戏图标
export const ICON_CDN = `${CDN_BASE}/游戏图标`;

// 手机/社交相关
export const CHAIN_CDN = `${CDN_BASE}/chain`;
export const TWESTA_AVATAR_CDN = `${CDN_BASE}/twesta头像`;
export const TWESTA_IMAGE_CDN = `${CDN_BASE}/Shiny_Prism_Twesta`;
export const STICKER_CDN = `${CDN_BASE}/sticker`;

// 视频相关
export const VIDEO_CDN = `${CDN_BASE}/公开练习`;
export const VIDEO_THUMBNAIL_CDN = `${CDN_BASE}/视频封面`;

// 技能卡
export const SKILL_CARD_CDN = `${CDN_BASE}/技能卡卡面`;

// 歌曲/歌词
export const MUSIC_CDN = `${CDN_BASE}/音乐`;
export const LYRICS_CDN = `${CDN_BASE}/歌词`;

// 组合相关
export const UNIT_CDN = `${CDN_BASE}/组合`;

// ============ 辅助函数 ============

/**
 * 获取背景图 URL
 */
export function getBackgroundUrl(id: string, ext = 'webp'): string {
  return `${BACKGROUND_CDN}/${id}.${ext}`;
}

/**
 * 获取角色头像 URL
 */
export function getAvatarUrl(characterName: string): string {
  return `${AVATAR_CDN}/${encodeURIComponent(characterName)}.webp`;
}

/**
 * 获取游戏图标 URL
 */
export function getIconUrl(iconName: string): string {
  return `${ICON_CDN}/${encodeURIComponent(iconName)}.png`;
}

/**
 * 获取技能卡图片 URL
 */
export function getSkillCardUrl(cardName: string): string {
  return `${SKILL_CARD_CDN}/${encodeURIComponent(cardName)}.webp`;
}

/**
 * 获取贴纸 URL
 */
export function getStickerUrl(stickerName: string): string {
  return `${STICKER_CDN}/${encodeURIComponent(stickerName)}`;
}

/**
 * 获取角色缩略图 URL
 */
export function getThumbnailUrl(cardFullName: string, awakened = false): string {
  const suffix = awakened ? '_觉醒后' : '';
  return `${THUMBNAIL_CDN}/${encodeURIComponent(cardFullName)}${suffix}.webp`;
}
