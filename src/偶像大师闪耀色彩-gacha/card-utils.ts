/**
 * 卡面工具函数（使用日文原名）
 */

import { CARD_IMAGE_BASE } from './constants';

/**
 * 构建卡面图片 URL
 * @param themeName 主题名（日文）
 * @param characterName 角色名（日文）
 * @param awakened 是否为觉醒版
 */
export function buildCardImageUrl(themeName: string, characterName: string, awakened: boolean = false): string {
  const suffix = awakened ? '+' : '';
  const fileName = `${themeName} ${characterName}${suffix}.webp`;
  return `${CARD_IMAGE_BASE}/${encodeURIComponent(fileName)}`;
}

/**
 * 从完整卡名构建图片 URL
 * @param fullCardName 完整卡名，格式：【主题名】角色名
 * @param awakened 是否为觉醒版
 */
export function buildCardImageUrlFromName(fullCardName: string, awakened: boolean = false): string {
  // 解析格式：【主题名】角色名
  const match = fullCardName.match(/【(.+?)】(.+)/);
  if (!match) {
    console.warn(`⚠️  无法解析卡名: ${fullCardName}`);
    return '';
  }

  const [, themeName, characterName] = match;
  return buildCardImageUrl(themeName, characterName, awakened);
}

/**
 * 从基础图片文件名构建 URL
 * @param baseImage 基础图片文件名（不含路径）
 * @param awakened 是否为觉醒版
 */
export function buildUrlFromFileName(baseImage: string, awakened: boolean = false): string {
  // 移除 .webp 后缀（如果有）
  let fileName = baseImage.replace(/\.webp$/, '');

  // 添加觉醒版后缀
  if (awakened) {
    fileName += '+';
  }

  // 添加 .webp 后缀
  fileName += '.webp';

  return `${CARD_IMAGE_BASE}/${encodeURIComponent(fileName)}`;
}

/**
 * 获取卡面的基础版和觉醒版 URL
 */
export function getCardImageUrls(themeName: string, characterName: string) {
  return {
    base: buildCardImageUrl(themeName, characterName, false),
    awakened: buildCardImageUrl(themeName, characterName, true),
  };
}

/**
 * 预加载卡面图片
 */
export function preloadCardImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * 批量预加载卡面
 */
export async function preloadCardImages(urls: string[]): Promise<void> {
  await Promise.all(
    urls.map(url =>
      preloadCardImage(url).catch(() => {
        console.warn(`⚠️  预加载失败: ${url}`);
      }),
    ),
  );
}

/**
 * 从完整卡名中提取角色名
 * @param fullCardName 完整卡名，格式：【主题名】角色名
 */
export function extractCharacterName(fullCardName: string): string {
  const match = fullCardName.match(/【.+?】(.+)/);
  return match ? match[1] : fullCardName;
}

/**
 * 从完整卡名中提取主题名
 * @param fullCardName 完整卡名，格式：【主题名】角色名
 */
export function extractTheme(fullCardName: string): string {
  const match = fullCardName.match(/【(.+?)】/);
  return match ? match[1] : '';
}
