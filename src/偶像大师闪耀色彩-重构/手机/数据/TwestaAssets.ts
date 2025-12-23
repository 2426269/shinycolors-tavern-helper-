/**
 * Twesta (推特应用) 资源管理
 * 管理 Twesta 头像、配图等资源
 */

// ==================== 服务器配置 ====================

const TWESTA_BASE_URL = 'http://124.221.50.133/shinycolors';
const TWESTA_AVATAR_PATH = 'twesta头像';
const TWESTA_IMAGE_PATH = 'Shiny_Prism_Twesta';

// ==================== 可用角色列表 ====================

/** 所有 Twesta 可用角色 (32个) */
export const TWESTA_CHARACTERS = [
  // 偶像 (28个)
  'Amana',
  'Asahi',
  'Chiyoko',
  'Chiyuki',
  'Fuyuko',
  'Hana',
  'Haruki',
  'Hinana',
  'Hiori',
  'Juri',
  'Kaho',
  'Kiriko',
  'Kogane',
  'Koito',
  'Luca',
  'Madoka',
  'Mamimi',
  'Mano',
  'Meguru',
  'Mei',
  'Mikoto',
  'Natsuha',
  'Nichika',
  'Rinze',
  'Sakuya',
  'Tenka',
  'Toru',
  'Yuika',
  // 特殊角色
  '283pro', // 283 事务所官方账号
  'Hazuki', // 七草叶月
  'Amai', // 天井努 (社长)
  'Producer', // 制作人
] as const;

export type TwestaCharacterId = (typeof TWESTA_CHARACTERS)[number];

/** 角色中文名映射 */
export const TWESTA_CHARACTER_NAMES: Record<TwestaCharacterId, string> = {
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
  // 特殊角色
  '283pro': '283 Production 官方',
  Hazuki: '七草叶月',
  Amai: '天井努',
  Producer: '制作人',
};

/** 有配图的偶像列表 */
export const TWESTA_IDOLS_WITH_IMAGES = [
  '283pro',
  'Amana',
  'Asahi',
  'Chiyoko',
  'Chiyuki',
  'Fuyuko',
  'Hana',
  'Haruki',
  'Hinana',
  'Hiori',
  'Juri',
  'Kaho',
  'Kiriko',
  'Kogane',
  'Koito',
  'Luca',
  'Madoka',
  'Mamimi',
  'Mano',
  'Meguru',
  'Mei',
  'Mikoto',
  'Natsuha',
  'Nichika',
  'Rinze',
  'Sakuya',
  'Tenka',
  'Toru',
  'Yuika',
] as const;

// ==================== 配图静态映射表 ====================
// 每个偶像的可用图片列表（避免 HEAD 请求）

/** 偶像配图映射表 - 偶像们都是 31-34 */
export const TWESTA_IMAGE_MAP: Record<string, string[]> = {
  // 偶像们使用 SfpTwesta {Id}31-34.webp 格式
  Amana: ['SfpTwesta Amana31.webp', 'SfpTwesta Amana32.webp', 'SfpTwesta Amana33.webp', 'SfpTwesta Amana34.webp'],
  Asahi: ['SfpTwesta Asahi31.webp', 'SfpTwesta Asahi32.webp', 'SfpTwesta Asahi33.webp', 'SfpTwesta Asahi34.webp'],
  Chiyoko: [
    'SfpTwesta Chiyoko31.webp',
    'SfpTwesta Chiyoko32.webp',
    'SfpTwesta Chiyoko33.webp',
    'SfpTwesta Chiyoko34.webp',
  ],
  Chiyuki: [
    'SfpTwesta Chiyuki31.webp',
    'SfpTwesta Chiyuki32.webp',
    'SfpTwesta Chiyuki33.webp',
    'SfpTwesta Chiyuki34.webp',
  ],
  Fuyuko: ['SfpTwesta Fuyuko31.webp', 'SfpTwesta Fuyuko32.webp', 'SfpTwesta Fuyuko33.webp', 'SfpTwesta Fuyuko34.webp'],
  Hana: ['SfpTwesta Hana31.webp', 'SfpTwesta Hana32.webp', 'SfpTwesta Hana33.webp', 'SfpTwesta Hana34.webp'],
  Haruki: ['SfpTwesta Haruki31.webp', 'SfpTwesta Haruki32.webp', 'SfpTwesta Haruki33.webp', 'SfpTwesta Haruki34.webp'],
  Hinana: ['SfpTwesta Hinana31.webp', 'SfpTwesta Hinana32.webp', 'SfpTwesta Hinana33.webp', 'SfpTwesta Hinana34.webp'],
  Hiori: ['SfpTwesta Hiori31.webp', 'SfpTwesta Hiori32.webp', 'SfpTwesta Hiori33.webp', 'SfpTwesta Hiori34.webp'],
  Juri: ['SfpTwesta Juri31.webp', 'SfpTwesta Juri32.webp', 'SfpTwesta Juri33.webp', 'SfpTwesta Juri34.webp'],
  Kaho: ['SfpTwesta Kaho31.webp', 'SfpTwesta Kaho32.webp', 'SfpTwesta Kaho33.webp', 'SfpTwesta Kaho34.webp'],
  Kiriko: ['SfpTwesta Kiriko31.webp', 'SfpTwesta Kiriko32.webp', 'SfpTwesta Kiriko33.webp', 'SfpTwesta Kiriko34.webp'],
  Kogane: ['SfpTwesta Kogane31.webp', 'SfpTwesta Kogane32.webp', 'SfpTwesta Kogane33.webp', 'SfpTwesta Kogane34.webp'],
  Koito: ['SfpTwesta Koito31.webp', 'SfpTwesta Koito32.webp', 'SfpTwesta Koito33.webp', 'SfpTwesta Koito34.webp'],
  Luca: ['SfpTwesta Luca31.webp', 'SfpTwesta Luca32.webp', 'SfpTwesta Luca33.webp', 'SfpTwesta Luca34.webp'],
  Madoka: ['SfpTwesta Madoka31.webp', 'SfpTwesta Madoka32.webp', 'SfpTwesta Madoka33.webp', 'SfpTwesta Madoka34.webp'],
  Mamimi: ['SfpTwesta Mamimi31.webp', 'SfpTwesta Mamimi32.webp', 'SfpTwesta Mamimi33.webp', 'SfpTwesta Mamimi34.webp'],
  Mano: ['SfpTwesta Mano31.webp', 'SfpTwesta Mano32.webp', 'SfpTwesta Mano33.webp', 'SfpTwesta Mano34.webp'],
  Meguru: ['SfpTwesta Meguru31.webp', 'SfpTwesta Meguru32.webp', 'SfpTwesta Meguru33.webp', 'SfpTwesta Meguru34.webp'],
  Mei: ['SfpTwesta Mei31.webp', 'SfpTwesta Mei32.webp', 'SfpTwesta Mei33.webp', 'SfpTwesta Mei34.webp'],
  Mikoto: ['SfpTwesta Mikoto31.webp', 'SfpTwesta Mikoto32.webp', 'SfpTwesta Mikoto33.webp', 'SfpTwesta Mikoto34.webp'],
  Natsuha: [
    'SfpTwesta Natsuha31.webp',
    'SfpTwesta Natsuha32.webp',
    'SfpTwesta Natsuha33.webp',
    'SfpTwesta Natsuha34.webp',
  ],
  Nichika: [
    'SfpTwesta Nichika31.webp',
    'SfpTwesta Nichika32.webp',
    'SfpTwesta Nichika33.webp',
    'SfpTwesta Nichika34.webp',
  ],
  Rinze: ['SfpTwesta Rinze31.webp', 'SfpTwesta Rinze32.webp', 'SfpTwesta Rinze33.webp', 'SfpTwesta Rinze34.webp'],
  Sakuya: ['SfpTwesta Sakuya31.webp', 'SfpTwesta Sakuya32.webp', 'SfpTwesta Sakuya33.webp', 'SfpTwesta Sakuya34.webp'],
  Tenka: ['SfpTwesta Tenka31.webp', 'SfpTwesta Tenka32.webp', 'SfpTwesta Tenka33.webp', 'SfpTwesta Tenka34.webp'],
  Toru: ['SfpTwesta Toru31.webp', 'SfpTwesta Toru32.webp', 'SfpTwesta Toru33.webp', 'SfpTwesta Toru34.webp'],
  Yuika: ['SfpTwesta Yuika31.webp', 'SfpTwesta Yuika32.webp', 'SfpTwesta Yuika33.webp', 'SfpTwesta Yuika34.webp'],
  // 283pro 官方账号有 58 张图片
  '283pro': [
    'SfpTwesta 1.5Anni.webp',
    'SfpTwesta 100day.webp',
    'SfpTwesta 1stAnni.webp',
    'SfpTwesta 6.5Live Day1-1.webp',
    'SfpTwesta 6.5Live Day1-2.webp',
    'SfpTwesta 6.5Live Day2-1.webp',
    'SfpTwesta 6.5Live Day2-2.webp',
    'SfpTwesta Autmn2025.webp',
    'SfpTwesta Autumn2025.webp',
    'SfpTwesta Chocoidol.webp',
    'SfpTwesta Christmas2023.webp',
    'SfpTwesta Christmas2024.webp',
    'SfpTwesta Fall2024.webp',
    'SfpTwesta Fanletter.webp',
    'SfpTwesta Fes2025.webp',
    'SfpTwesta GW2024.webp',
    'SfpTwesta Halloween2024-1.webp',
    'SfpTwesta Halloween2024-2.webp',
    'SfpTwesta Halloween2025-1.webp',
    'SfpTwesta Halloween2025-2.webp',
    'SfpTwesta Halloween2025-3.webp',
    'SfpTwesta Halloween2025-4.webp',
    'SfpTwesta Hot night.webp',
    'SfpTwesta March2025.webp',
    'SfpTwesta NY2024 Alstromeria.webp',
    'SfpTwesta NY2024 Cometik.webp',
    'SfpTwesta NY2024 DoubleHa.webp',
    'SfpTwesta NY2024 HCG.webp',
    'SfpTwesta NY2024 IS.webp',
    'SfpTwesta NY2024 Lantica.webp',
    'SfpTwesta NY2024 Noctchill.webp',
    'SfpTwesta NY2024 Shhis.webp',
    'SfpTwesta NY2024 Straylight.webp',
    'SfpTwesta NY2025.webp',
    'SfpTwesta Newyear2025.webp',
    'SfpTwesta Overcast1.webp',
    'SfpTwesta PRISISM.webp',
    'SfpTwesta Pirate Kog.webp',
    'SfpTwesta Rain 2025.webp',
    'SfpTwesta Release.webp',
    'SfpTwesta Resistance Order.webp',
    'SfpTwesta Rest.webp',
    'SfpTwesta Retrostyle.webp',
    'SfpTwesta Sping2024-2.webp',
    'SfpTwesta Sping2024.webp',
    'SfpTwesta Spring2025.webp',
    'SfpTwesta Summer2024.webp',
    'SfpTwesta Summer2025-2.webp',
    'SfpTwesta Summer2025.webp',
    'SfpTwesta Tsuyu2024.webp',
    'SfpTwesta Valentine2024.webp',
    'SfpTwesta Valentine2025.webp',
    'SfpTwesta White2025.webp',
    'SfpTwesta WinterNotice2025.webp',
    'SfpTwesta wintersolstice2025.webp',
  ],
};

// ==================== 资源 URL 生成函数 ====================

/**
 * 获取 Twesta 头像 URL
 */
export function getTwestaAvatarUrl(characterId: string): string {
  return `${TWESTA_BASE_URL}/${TWESTA_AVATAR_PATH}/${characterId}.webp`;
}

/**
 * 获取 Twesta 配图基础路径
 */
export function getTwestaImageBasePath(idolId: string): string {
  return `${TWESTA_BASE_URL}/${TWESTA_IMAGE_PATH}/${idolId}`;
}

// ==================== 配图管理 ====================

/** 已使用图片存储 Key */
const USED_IMAGES_KEY = 'shinycolors_twesta_used_images';

/** 加载已使用的图片列表 */
export function loadUsedImages(): Record<string, string[]> {
  try {
    const saved = localStorage.getItem(USED_IMAGES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('[Twesta] Failed to load used images:', e);
  }
  return {};
}

/** 保存已使用的图片列表 */
export function saveUsedImages(usedImages: Record<string, string[]>): void {
  try {
    localStorage.setItem(USED_IMAGES_KEY, JSON.stringify(usedImages));
  } catch (e) {
    console.error('[Twesta] Failed to save used images:', e);
  }
}

/** 标记图片为已使用 */
export function markImageAsUsed(idolId: string, imageFilename: string): void {
  const usedImages = loadUsedImages();
  if (!usedImages[idolId]) usedImages[idolId] = [];
  if (!usedImages[idolId].includes(imageFilename)) {
    usedImages[idolId].push(imageFilename);
    saveUsedImages(usedImages);
  }
}

/**
 * 获取随机未使用的配图（使用静态映射表，无 HEAD 请求）
 * @param idolId 偶像 ID
 * @returns 图片 URL 或 undefined
 */
export function getRandomUnusedTwestaImage(idolId: string): string | undefined {
  // 从静态映射表获取可用图片列表
  const allImages = TWESTA_IMAGE_MAP[idolId];
  if (!allImages || allImages.length === 0) {
    console.log(`[Twesta] No images available for ${idolId}`);
    return undefined;
  }

  const basePath = getTwestaImageBasePath(idolId);
  const usedImages = loadUsedImages();
  const usedForIdol = usedImages[idolId] || [];

  // 过滤出未使用的图片
  const availableImages = allImages.filter(img => !usedForIdol.includes(img));

  if (availableImages.length === 0) {
    console.log(`[Twesta] All images used for ${idolId}, resetting...`);
    // 重置已使用列表
    usedImages[idolId] = [];
    saveUsedImages(usedImages);
    // 重新选择
    const randomIndex = Math.floor(Math.random() * allImages.length);
    const selectedFilename = allImages[randomIndex];
    markImageAsUsed(idolId, selectedFilename);
    return `${basePath}/${encodeURIComponent(selectedFilename)}`;
  }

  // 随机选一张
  const randomIndex = Math.floor(Math.random() * availableImages.length);
  const selectedFilename = availableImages[randomIndex];
  markImageAsUsed(idolId, selectedFilename);
  console.log(`[Twesta] Selected image for ${idolId}: ${selectedFilename}`);
  return `${basePath}/${encodeURIComponent(selectedFilename)}`;
}

/**
 * 获取随机配图 URL (需要图片列表)
 * @param idolId 偶像 ID
 * @param imageList 该偶像可用的图片列表
 */
export function getRandomTwestaImage(idolId: string, imageList: string[]): string | undefined {
  if (imageList.length === 0) return undefined;
  const basePath = getTwestaImageBasePath(idolId);
  const randomIndex = Math.floor(Math.random() * imageList.length);
  return `${basePath}/${imageList[randomIndex]}`;
}

// ==================== 默认头像 ====================

/** 获取制作人默认头像 */
export function getProducerDefaultAvatar(): string {
  return getTwestaAvatarUrl('Producer');
}

/** 获取粉丝默认头像 (随机选一个偶像头像) */
export function getFanDefaultAvatar(): string {
  // 使用简单的默认头像
  return getTwestaAvatarUrl('Producer');
}

/** 获取官方账号头像 */
export function getOfficialAvatar(): string {
  return getTwestaAvatarUrl('283pro');
}

// ==================== 辅助函数 ====================

/**
 * 检查角色是否有配图
 */
export function hasImages(characterId: string): boolean {
  return TWESTA_IDOLS_WITH_IMAGES.includes(characterId as any);
}

/**
 * 获取随机偶像 ID (用于 AI 选择发推偶像)
 */
export function getRandomIdolId(): TwestaCharacterId {
  // 排除特殊角色，只选偶像
  const idols = TWESTA_CHARACTERS.filter(c => c !== '283pro' && c !== 'Hazuki' && c !== 'Amai' && c !== 'Producer');
  return idols[Math.floor(Math.random() * idols.length)] as TwestaCharacterId;
}

/**
 * 获取角色显示名
 */
export function getCharacterName(characterId: string): string {
  return TWESTA_CHARACTER_NAMES[characterId as TwestaCharacterId] || characterId;
}
