/**
 * 偶像大师闪耀色彩 - 工具函数
 *
 * 通用工具函数集合
 */

import { CDN_BASE } from './constants';

// ============================================================================
// 时间格式化
// ============================================================================

/**
 * 格式化时长为 MM:SS 格式
 * @param seconds 秒数
 * @returns 格式化后的字符串，如 "3:45"
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化进度为百分比
 * @param current 当前值
 * @param total 总值
 * @returns 百分比，如 "45.5%"
 */
export function formatProgress(current: number, total: number): string {
  if (!isFinite(total) || total === 0) {
    return '0%';
  }

  const percentage = (current / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

// ============================================================================
// URL 构建
// ============================================================================

/**
 * 获取角色立绘图片 URL
 * @param unit 组合名称
 * @param name 角色名称
 * @returns 完整的 CDN URL
 */
export function getCharacterImageUrl(unit: string, name: string): string {
  return `${CDN_BASE}/人物立绘/${unit}/${name}.png`;
}

/**
 * 获取角色栏缩略图 URL
 * @param unit 组合名称
 * @param name 角色名称
 * @returns 完整的 CDN URL
 */
export function getCharacterThumbnailUrl(unit: string, name: string): string {
  return `${CDN_BASE}/角色栏/${unit}/${name}/thumb.png`;
}

/**
 * 获取背景图片 URL
 * @param filename 文件名
 * @returns 完整的 CDN URL
 */
export function getBackgroundUrl(filename: string): string {
  return `${CDN_BASE}/背景图/283背景图/${filename}`;
}

/**
 * 获取专辑封面 URL
 * @param type 歌曲类型（全体曲/组合曲/个人曲）
 * @param albumName 专辑名称
 * @returns 完整的 CDN URL
 */
export function getAlbumCoverUrl(type: string, albumName: string): string {
  return `${CDN_BASE}/歌曲图片/${type}/${albumName}.jpg`;
}

// ============================================================================
// 数值处理
// ============================================================================

/**
 * 限制数值在指定范围内
 * @param value 原始值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 格式化数字为带千位分隔符的字符串
 * @param num 数字
 * @returns 格式化后的字符串，如 "1,000"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 格式化大数字（K/M/B）
 * @param num 数字
 * @returns 简化后的字符串，如 "1.2K"
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

// ============================================================================
// 数组操作
// ============================================================================

/**
 * 循环获取数组元素（支持负数索引）
 * @param array 数组
 * @param index 索引
 * @returns 数组元素
 */
export function getCircularItem<T>(array: T[], index: number): T {
  const length = array.length;
  const normalizedIndex = ((index % length) + length) % length;
  return array[normalizedIndex];
}

/**
 * 打乱数组（Fisher-Yates 算法）
 * @param array 原始数组
 * @returns 打乱后的新数组
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ============================================================================
// 字符串处理
// ============================================================================

/**
 * 截断字符串并添加省略号
 * @param str 原始字符串
 * @param maxLength 最大长度
 * @returns 截断后的字符串
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * 移除字符串中的特殊字符
 * @param str 原始字符串
 * @returns 清理后的字符串
 */
export function sanitizeString(str: string): string {
  return str.replace(/[^\w\s\u4e00-\u9fa5]/g, '');
}

// ============================================================================
// 延迟和异步
// ============================================================================

/**
 * 延迟执行（Promise 版本）
 * @param ms 延迟时间（毫秒）
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 防抖函数
 * @param fn 要执行的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, wait);
  };
}

/**
 * 节流函数
 * @param fn 要执行的函数
 * @param wait 等待时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, wait: number): (...args: Parameters<T>) => void {
  let lastTime = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn(...args);
    }
  };
}

// ============================================================================
// 错误处理
// ============================================================================

/**
 * 安全地获取错误消息
 * @param error 错误对象
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '未知错误';
}

/**
 * 判断是否为网络错误
 * @param error 错误对象
 * @returns 是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'NetworkError' || error.message.includes('network') || error.message.includes('fetch');
  }
  return false;
}

// ============================================================================
// 本地存储
// ============================================================================

/**
 * 安全地从 localStorage 获取数据
 * @param key 键名
 * @param defaultValue 默认值
 * @returns 存储的值或默认值
 */
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 安全地向 localStorage 存储数据
 * @param key 键名
 * @param value 要存储的值
 */
export function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('localStorage 写入失败:', getErrorMessage(error));
  }
}

/**
 * 安全地从 localStorage 删除数据
 * @param key 键名
 */
export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('localStorage 删除失败:', getErrorMessage(error));
  }
}

// ============================================================================
// 日期时间
// ============================================================================

/**
 * 格式化日期为 YYYY-MM-DD
 * @param date 日期对象
 * @returns 格式化后的字符串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH:MM:SS
 * @param date 日期对象
 * @returns 格式化后的字符串
 */
export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// ============================================================================
// 颜色处理
// ============================================================================

/**
 * 将十六进制颜色转换为 RGB
 * @param hex 十六进制颜色，如 "#e91e63"
 * @returns RGB 对象 { r, g, b }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * 将 RGB 转换为十六进制颜色
 * @param r 红色分量 (0-255)
 * @param g 绿色分量 (0-255)
 * @param b 蓝色分量 (0-255)
 * @returns 十六进制颜色字符串
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('')}`;
}
