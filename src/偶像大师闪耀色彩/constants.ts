/**
 * 偶像大师闪耀色彩 - 常量定义
 *
 * 集中管理所有常量，避免魔术数字和硬编码字符串
 */

// ============================================================================
// CDN 和资源路径
// ============================================================================

/** jsDelivr CDN 基础路径（图片资源） - 使用国内可访问的镜像 */
export const CDN_BASE = 'https://testingcf.jsdelivr.net/gh/2426269/shinycolors-assets@main';

/**
 * GitHub Releases 路径（音频和图片资源）
 *
 * 为不同类型资源创建不同的 Release 路径
 */

/** 专辑封面图片 Release 路径 */
export const ALBUM_COVER_BASE = 'https://github.com/2426269/shinycolors-assets/releases/download/歌曲图片';

/** 游戏UI图标 Release 路径 */
export const GAME_ICONS_BASE = 'https://github.com/2426269/shinycolors-assets/releases/download/游戏图标';

/** 游戏资源图标路径 */
export const RESOURCE_ICONS = {
  FEATHER_JEWEL: `${GAME_ICONS_BASE}/Feather_Jewel.png`,
  RAINBOW_PIECE: `${GAME_ICONS_BASE}/Rainbow_Memorial_Piece.png`,
} as const;

/** 个人曲音频 Release 路径 */
export const AUDIO_BASE_PERSONAL =
  'https://github.com/2426269/shinycolors-assets/releases/download/personal-songs-v1.0';

/** 组合曲音频 Release 路径 */
export const AUDIO_BASE_GROUP = 'https://github.com/2426269/shinycolors-assets/releases/download/group-songs-v1.0';

/** 全体曲音频 Release 路径 */
export const AUDIO_BASE_ALL = 'https://github.com/2426269/shinycolors-assets/releases/download/music-v1.0';

/** 保留 AUDIO_BASE 用于向后兼容（默认指向个人曲） */
export const AUDIO_BASE = AUDIO_BASE_PERSONAL;

// ============================================================================
// 组合/团体定义
// ============================================================================

/** 所有组合名称 */
export const UNITS = [
  'Illumination STARS',
  "L'Antica",
  'ALSTROEMERIA',
  'Straylight',
  'noctchill',
  '放学后CLIMAX GIRLS',
  'SHHis',
  'CoMETIK',
] as const;

/** 组合类型（从 UNITS 推导） */
export type Unit = (typeof UNITS)[number];

/** 歌曲类型 */
export const SONG_TYPES = {
  PERSONAL: '个人曲',
  UNIT: '组合曲',
  ALL: '全体曲',
  OTHER: '其他',
} as const;

// ============================================================================
// UI 时间常量
// ============================================================================

/** DOM 滚动延迟时间（等待渲染完成） */
export const SCROLL_DELAY_MS = 50;

/** Toast 提示持续时间 */
export const TOAST_DURATION_MS = 2000;

/** Toast 成功提示持续时间（较短） */
export const TOAST_SUCCESS_DURATION_MS = 1500;

/** 动画过渡时间 */
export const TRANSITION_DURATION_MS = 300;

/** 图片加载超时时间 */
export const IMAGE_LOAD_TIMEOUT_MS = 10000;

// ============================================================================
// 播放器配置
// ============================================================================

/** 默认音量（0-1） */
export const DEFAULT_VOLUME = 0.7;

/** 音量调节步进 */
export const VOLUME_STEP = 0.1;

/** 进度条更新间隔 */
export const PROGRESS_UPDATE_INTERVAL_MS = 100;

/** 播放模式 */
export const PLAYBACK_MODES = {
  SINGLE: 'single', // 单曲循环
  SEQUENCE: 'sequence', // 顺序播放
} as const;

export type PlaybackMode = (typeof PLAYBACK_MODES)[keyof typeof PLAYBACK_MODES];

// ============================================================================
// 角色属性
// ============================================================================

/** 角色属性类型 */
export const IDOL_ATTRIBUTES = {
  VOCAL: 'Vocal',
  DANCE: 'Dance',
  VISUAL: 'Visual',
} as const;

/** 卡片稀有度 */
export const CARD_RARITY = {
  N: 'N',
  R: 'R',
  SR: 'SR',
  SSR: 'SSR',
} as const;

// ============================================================================
// 界面状态
// ============================================================================

/** 可见的角色栏数量 */
export const VISIBLE_CHARACTER_COUNT = 3;

/** 角色切换动画时间 */
export const CHARACTER_SWITCH_DURATION_MS = 500;

// ============================================================================
// 资源类型
// ============================================================================

/** 资源类型枚举 */
export const RESOURCE_TYPES = {
  GEMS: 'gems', // 羽石
  FANS: 'fans', // 粉丝
  COINS: 'coins', // 金币
} as const;

/** 初始资源数量 */
export const INITIAL_RESOURCES = {
  gems: 1000,
  fans: 0,
  coins: 10000,
} as const;

// ============================================================================
// 错误消息
// ============================================================================

/** 错误提示消息 */
export const ERROR_MESSAGES = {
  IMAGE_LOAD_FAILED: '图片加载失败',
  AUDIO_LOAD_FAILED: '音频加载失败',
  NETWORK_ERROR: '网络连接错误',
  UNKNOWN_ERROR: '未知错误',
  CDN_NOT_SYNCED: 'CDN文件尚未同步，请稍后重试（约5-10分钟）',
  INTERACTION_REQUIRED: '请先与页面交互后再播放',
} as const;

// ============================================================================
// 成功消息
// ============================================================================

/** 成功提示消息 */
export const SUCCESS_MESSAGES = {
  PLAY_SUCCESS: '播放成功',
  LOAD_SUCCESS: '加载成功',
  SAVE_SUCCESS: '保存成功',
} as const;

// ============================================================================
// 调试选项
// ============================================================================

/** 是否启用调试模式 */
export const DEBUG_MODE = false;

/** 是否显示性能日志 */
export const SHOW_PERFORMANCE_LOGS = false;
