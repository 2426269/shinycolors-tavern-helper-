/**
 * 手机系统 API 设置
 * 用于管理手机应用使用的 AI API 配置
 */

// 自定义 API 配置类型（来自酒馆助手）
export interface CustomApiConfig {
  /** 自定义API地址 */
  apiurl: string;
  /** API密钥 */
  key?: string;
  /** 模型名称 */
  model: string;
  /** API源，默认为 'openai' */
  source?: string;
  /** 最大回复 tokens */
  max_tokens?: number;
  /** 温度 */
  temperature?: number;
  /** 频率惩罚 */
  frequency_penalty?: number;
  /** 存在惩罚 */
  presence_penalty?: number;
  top_p?: number;
}

// 偶像主动消息设置
export interface ProactiveSettings {
  /** 是否启用 */
  enabled: boolean;
  /** 检查频率（分钟） */
  intervalMinutes: number;
  /** 发送概率（%） */
  probability: number;
  /** 是否启用深夜模式（0:00-7:00 降低概率） */
  nightModeEnabled: boolean;
  /** 特别关注偶像概率加成（%） */
  favoriteBonus: number;
}

// Twesta 设置 (从 TwestaTypes 引用，这里定义避免循环依赖)
export interface TwestaProactiveSettings {
  /** 是否启用 */
  enabled: boolean;
  /** 发推间隔 (分钟) */
  intervalMinutes: number;
  /** 发推概率 (%) */
  probability: number;
  /** 配图概率 (%) - 低 */
  imageProbability: number;
  /** 评论数量 (每条推文自动生成的评论数) */
  commentCount: number;
  /** 深夜模式 */
  nightModeEnabled: boolean;
  /** 黑粉概率 (%) */
  antiFanProbability: number;
  /** 节奏事件概率 (%) */
  dramaEventProbability: number;
  /** 制作人显示名称 */
  producerDisplayName: string;
}

// 手机系统 API 设置
export interface PhoneApiSettings {
  /** 是否使用自定义API */
  useCustomApi: boolean;
  /** 自定义API配置 */
  customApi: CustomApiConfig;
  /** Chain 偶像主动消息设置 */
  proactive: ProactiveSettings;
  /** Twesta 发推设置 */
  twesta: TwestaProactiveSettings;
}

// 默认设置
const DEFAULT_SETTINGS: PhoneApiSettings = {
  useCustomApi: false,
  customApi: {
    apiurl: '',
    key: '',
    model: 'gpt-4o-mini',
    source: 'openai',
    max_tokens: 1000,
    temperature: 0.8,
  },
  proactive: {
    enabled: true,
    intervalMinutes: 10,
    probability: 40,
    nightModeEnabled: true,
    favoriteBonus: 20,
  },
  twesta: {
    enabled: true,
    intervalMinutes: 15,
    probability: 30,
    imageProbability: 15,
    commentCount: 3,
    nightModeEnabled: true,
    antiFanProbability: 5,
    dramaEventProbability: 2,
    producerDisplayName: '制作人',
  },
};

// 存储 key
const STORAGE_KEY = 'shinycolors_phone_api_settings';

/**
 * 加载 API 设置
 */
export function loadPhoneApiSettings(): PhoneApiSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        customApi: {
          ...DEFAULT_SETTINGS.customApi,
          ...parsed.customApi,
        },
        proactive: {
          ...DEFAULT_SETTINGS.proactive,
          ...parsed.proactive,
        },
        twesta: {
          ...DEFAULT_SETTINGS.twesta,
          ...parsed.twesta,
        },
      };
    }
  } catch (e) {
    console.error('[Phone] Failed to load API settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * 保存 API 设置
 */
export function savePhoneApiSettings(settings: PhoneApiSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[Phone] Failed to save API settings:', e);
  }
}

/**
 * 获取用于生成的 API 配置
 * 如果使用自定义API，返回配置；否则返回 undefined（使用主API）
 */
export function getGenerateApiConfig(): CustomApiConfig | undefined {
  const settings = loadPhoneApiSettings();
  if (settings.useCustomApi && settings.customApi.apiurl) {
    // 去除末尾斜杠，避免拼接 /chat/completions 时出现双斜杠
    return {
      ...settings.customApi,
      apiurl: settings.customApi.apiurl.replace(/\/+$/, ''),
    };
  }
  return undefined;
}

/**
 * 验证自定义 API 配置是否有效
 */
export function validateCustomApiConfig(config: CustomApiConfig): { valid: boolean; error?: string } {
  if (!config.apiurl) {
    return { valid: false, error: 'API 地址不能为空' };
  }
  if (!config.model) {
    return { valid: false, error: '模型名称不能为空' };
  }
  // 验证 URL 格式
  try {
    new URL(config.apiurl);
  } catch {
    return { valid: false, error: 'API 地址格式不正确' };
  }
  return { valid: true };
}
