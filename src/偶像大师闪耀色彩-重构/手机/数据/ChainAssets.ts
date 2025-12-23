/**
 * Chain 应用图片资源映射
 * 服务器: http://124.221.50.133/shinycolors/chain/
 *
 * 偶像数据来源: 角色管理/角色数据.ts
 */

const CHAIN_CDN_BASE = 'http://124.221.50.133/shinycolors/chain';

// 偶像英文名（文件名用）到中文名的映射
// 注意：Chain 图片文件名使用 PascalCase，如 SfpChainIcon_Mano.webp
export const IDOL_NAMES: Record<string, string> = {
  // illumination STARS
  Mano: '樱木真乃',
  Hiori: '风野灯织',
  Meguru: '八宫巡',
  // L'Antica
  Kogane: '月冈恋钟',
  Mamimi: '田中摩美美',
  Sakuya: '白濑咲耶',
  Yuika: '三峰结华',
  Kiriko: '幽谷雾子',
  // 放学后 CLIMAX GIRLS
  Kaho: '小宫果穗',
  Chiyoko: '园田智代子',
  Juri: '西城树里',
  Rinze: '杜野凛世',
  Natsuha: '有栖川夏叶',
  // ALSTROEMERIA
  Amana: '大崎甘奈',
  Tenka: '大崎甜花',
  Chiyuki: '桑山千雪',
  // Straylight
  Asahi: '芹泽朝日',
  Fuyuko: '黛冬优子',
  Mei: '和泉爱依',
  // noctchill
  Toru: '浅仓透',
  Madoka: '樋口圆香',
  Koito: '福丸小糸',
  Hinana: '市川雏菜',
  // SHHis
  Nichika: '七草日花',
  Mikoto: '绯田美琴',
  // CoMETIK
  Luca: '斑鸠路加',
  Hana: '铃木羽那',
  Haruki: '郁田阳希',
};

// 获取头像 URL
export function getChainIconUrl(idolEnglishName: string): string {
  return `${CHAIN_CDN_BASE}/SfpChainIcon_${idolEnglishName}.webp`;
}

// 获取背景图 URL
export function getChainProfileBgUrl(idolEnglishName: string): string {
  return `${CHAIN_CDN_BASE}/SfpChainProfileBg_${idolEnglishName}.webp`;
}

// 获取偶像中文名
export function getIdolChineseName(englishName: string): string {
  return IDOL_NAMES[englishName] || englishName;
}

// 所有偶像英文名列表（按文件实际存在的）
export const IDOL_ENGLISH_NAMES = [
  // illumination STARS
  'Mano',
  'Hiori',
  'Meguru',
  // L'Antica
  'Kogane',
  'Mamimi',
  'Sakuya',
  'Yuika',
  'Kiriko',
  // 放学后 CLIMAX GIRLS
  'Kaho',
  'Chiyoko',
  'Juri',
  'Rinze',
  'Natsuha',
  // ALSTROEMERIA
  'Amana',
  'Tenka',
  'Chiyuki',
  // Straylight
  'Asahi',
  'Fuyuko',
  'Mei',
  // noctchill
  'Toru',
  'Madoka',
  'Koito',
  'Hinana',
  // SHHis
  'Nichika',
  'Mikoto',
  // CoMETIK
  'Luca',
  'Hana',
  'Haruki',
] as const;

export type IdolEnglishName = (typeof IDOL_ENGLISH_NAMES)[number];

// 所有偶像的 Chain 数据
export interface ChainIdolData {
  id: string;
  englishName: string;
  chineseName: string;
  iconUrl: string;
  profileBgUrl: string;
}

// 获取所有偶像的 Chain 数据
export function getAllChainIdolData(): ChainIdolData[] {
  return IDOL_ENGLISH_NAMES.map((englishName, index) => ({
    id: `idol_${index + 1}`,
    englishName,
    chineseName: IDOL_NAMES[englishName] || englishName,
    iconUrl: getChainIconUrl(englishName),
    profileBgUrl: getChainProfileBgUrl(englishName),
  }));
}

// 导出 CDN 基础路径
export { CHAIN_CDN_BASE };
