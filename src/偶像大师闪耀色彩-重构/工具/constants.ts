/**
 * 偶像大师闪耀色彩 - 常量配置（统一版本）
 */

// ============================================================================
// 资源路径
// ============================================================================

/**
 * 自有 CDN 基础路径
 * 使用 283pro.site 域名，所有资源统一托管
 */
export const CDN_DOMAIN = 'https://283pro.site';
export const CDN_BASE = `${CDN_DOMAIN}/shinycolors`;

/** 角色卡图片路径（WebP格式，日文原名） */
export const CARD_IMAGE_BASE = `${CDN_BASE}/角色卡面`;

/** 卡池缩略图路径（WebP格式） */
export const POOL_IMAGE_BASE = `${CDN_BASE}/卡池缩略图`;

/** 游戏图标路径 */
export const GAME_ICONS_BASE = `${CDN_BASE}/游戏图标`;

/** 羽石图标（与主页面一致） */
export const FEATHER_STONE_IMAGE = `${GAME_ICONS_BASE}/Feather_Jewel.png`;

/** 游戏资源图标路径 */
export const RESOURCE_ICONS = {
  FEATHER_JEWEL: `${GAME_ICONS_BASE}/Feather_Jewel.png`,
  RAINBOW_PIECE: `${GAME_ICONS_BASE}/Rainbow_Memorial_Piece.png`,
} as const;

/** 专辑封面图片路径 */
export const ALBUM_COVER_BASE = `${CDN_BASE}/歌曲封面`;

/** 音频文件基础路径（所有歌曲统一路径，不再区分个人曲/组合曲/全体曲） */
export const AUDIO_CDN_BASE = `${CDN_BASE}/歌曲`;

/** 保留向后兼容的别名 */
export const AUDIO_BASE = AUDIO_CDN_BASE;
export const AUDIO_BASE_PERSONAL = AUDIO_CDN_BASE;
export const AUDIO_BASE_GROUP = AUDIO_CDN_BASE;
export const AUDIO_BASE_ALL = AUDIO_CDN_BASE;
export const AUDIO_RELEASE_BASE = AUDIO_CDN_BASE;

/** 歌词文件路径 */
export const LYRICS_CDN_BASE = `${CDN_BASE}/歌词`;

/** Spine动画资源CDN路径 */
export const SPINE_CDN_BASE = `${CDN_BASE}/spine`;

// ============================================================================
// 概率配置
// ============================================================================

/**
 * 抽卡概率配置（已移除R卡）
 *
 * 设计理念：
 * - R卡由于全部无卡面已完全移除
 * - 原R卡的70%概率重新分配：
 *   - UR: +1.2% (让限定UP更容易获得)
 *   - SSR: +14% (大幅提升SSR获取率)
 *   - SR: +54.8% (成为最常见卡片)
 *
 * 新概率分配：
 * - UR (2%): 限定UP角色独占，相对稀有
 * - SSR (20%): 高稀有，核心卡池，五抽必出1张
 * - SR (78%): 基础卡池，几乎每抽必出
 *
 * 总概率 = 100% (2 + 20 + 78 = 100)
 */
export const BASE_RATES = {
  UR: 0.02, // 2%
  SSR: 0.2, // 20%
  SR: 0.78, // 78%
  R: 0, // 0% (已移除)
} as const;

/**
 * 保底机制配置
 *
 * 相比原游戏放宽了保底，让玩家更容易获得高稀有度卡片
 */
export const PITY_CONFIG = {
  SSR_PITY: 60, // 60抽必出SSR (从90降低)
  UR_PITY: 120, // 120抽必出UR (从200降低)
  TEN_PULL_SR: true, // 十连至少1个SR
} as const;

// ============================================================================
// 经济系统
// ============================================================================

/** 抽卡价格 */
export const GACHA_COST = {
  SINGLE: 300, // 单抽
  TEN: 3000, // 十连
} as const;

/** 星尘转换比例（重复卡） */
export const STARDUST_CONVERSION = {
  R: 10,
  SR: 50,
  SSR: 300,
  UR: 1500,
} as const;

/** 初始资源 */
export const INITIAL_RESOURCES = {
  gems: 3000, // 初始羽石（1次十连）
  stardust: 0, // 初始星尘
  level: 1, // 初始等级
  exp: 0, // 初始经验
} as const;

/** 羽石获取途径（预留） */
export const GEM_REWARDS = {
  MISSION_RANK_S: 500,
  MISSION_RANK_A: 300,
  MISSION_RANK_B: 150,
  MISSION_RANK_C: 50,
  BOND_LEVEL_UP: 100,
  PLAYER_LEVEL_UP: 200,
  FIRST_CLEAR: 500,
} as const;

// ============================================================================
// 数据存储
// ============================================================================

/** 数据存储键名 */
export const STORAGE_KEY = 'shinycolors_gacha_data';

/** 资源数据存储键名（localStorage） */
export const RESOURCES_STORAGE_KEY = 'shinycolors_resources';

// ============================================================================
// UI配置
// ============================================================================

/** 抽卡动画时长（毫秒） */
export const ANIMATION_DURATION = {
  CARD_FLIP: 500, // 卡片翻转
  RESULT_FADE_IN: 300, // 结果淡入
  RAINBOW_FLASH: 1000, // 彩虹闪光（SSR+）
} as const;

/** Toast提示持续时间 */
export const TOAST_DURATION = {
  SUCCESS: 2000,
  ERROR: 3000,
  WARNING: 2500,
} as const;

/** Toast 成功提示持续时间（主页面兼容） */
export const TOAST_SUCCESS_DURATION_MS = 1500;

/** Toast 提示持续时间（主页面兼容） */
export const TOAST_DURATION_MS = 2000;

// ============================================================================
// 卡池配置
// ============================================================================

/** 当前卡池配置 */
export const CURRENT_POOL = {
  name: '星月夜を歩いて',
  description: '【絵空靴】杜野凛世 期间限定',
  pickupCardName: '【絵空靴】杜野凛世',
  pickupCharacter: '杜野凛世',
  thumbnailImage: `${POOL_IMAGE_BASE}/星月夜を歩いて.webp`,
  poolImage: null, // 使用角色卡面代替
  startDate: '2025-01-01',
  endDate: '2025-02-01',
} as const;
