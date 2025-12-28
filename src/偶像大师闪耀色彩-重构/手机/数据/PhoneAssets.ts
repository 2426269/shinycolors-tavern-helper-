/**
 * Phone 应用图片资源映射
 * Twesta头像共用
 * 服务器: https://283pro.site/shinycolors/twesta头像/
 */

const PHONE_CDN_BASE = 'https://283pro.site/shinycolors/twesta头像';

import { IDOL_ENGLISH_NAMES, IDOL_NAMES } from './ChainAssets';

// 获取头像 URL（Twesta头像）
export function getPhoneAvatarUrl(idolEnglishName: string): string {
  return `${PHONE_CDN_BASE}/${idolEnglishName}.webp`;
}

// 283事务所头像
export function get283ProAvatarUrl(): string {
  return `${PHONE_CDN_BASE}/283pro.webp`;
}

// 所有偶像的 Phone 联系人数据
export interface PhoneContactData {
  id: string;
  englishName: string;
  chineseName: string;
  avatarUrl: string;
  hasUnread: boolean;
}

// 获取所有偶像的联系人数据
export function getAllPhoneContacts(): PhoneContactData[] {
  return IDOL_ENGLISH_NAMES.map((englishName, index) => ({
    id: `contact_${index + 1}`,
    englishName,
    chineseName: IDOL_NAMES[englishName] || englishName,
    avatarUrl: getPhoneAvatarUrl(englishName),
    hasUnread: false,
  }));
}

// 导出 CDN 基础路径和偶像数据
export { IDOL_ENGLISH_NAMES, IDOL_NAMES, PHONE_CDN_BASE };
