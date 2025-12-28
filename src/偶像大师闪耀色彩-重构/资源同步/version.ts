/**
 * 版本号管理
 * 用于强制客户端刷新缓存
 */

// 当前版本号 - 每次更新时手动递增
export const APP_VERSION = '1.0.0';

// 构建时间戳 - 自动生成
export const BUILD_TIMESTAMP = '2024-12-24T18:40:00';

// 版本信息对象
export const VERSION_INFO = {
  version: APP_VERSION,
  buildTime: BUILD_TIMESTAMP,
  // 资源版本号 - 用于缓存失效
  resourceVersion: 1,
};

/**
 * 检查是否需要更新
 * @param cachedVersion 客户端缓存的版本号
 * @returns 是否需要强制刷新
 */
export function needsUpdate(cachedVersion: string | null): boolean {
  if (!cachedVersion) return true;
  return cachedVersion !== APP_VERSION;
}

/**
 * 获取带版本号的资源URL（用于缓存失效）
 * @param url 原始URL
 * @returns 带版本参数的URL
 */
export function versionedUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${VERSION_INFO.resourceVersion}`;
}

/**
 * 获取版本显示字符串
 */
export function getVersionString(): string {
  return `v${APP_VERSION} (${BUILD_TIMESTAMP.split('T')[0]})`;
}
