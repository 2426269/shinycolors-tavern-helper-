/**
 * Twesta (推特应用) 类型定义
 */

// ==================== 推文类型 ====================

/** 作者类型 */
export type AuthorType = 'idol' | 'producer' | 'fan' | 'anti' | 'official' | 'alt' | 'staff';

/** 推文评论 */
export interface TweetComment {
  id: string;
  authorId: string;
  authorType: AuthorType;
  name: string;
  avatar: string;
  text: string;
  textJP?: string;
  time: string;
  timestamp: number;
  likes: number;
  likedByMe: boolean;
  /** 回复列表 (最多 2 层嵌套) */
  replies: TweetComment[];
  // RAG 兼容
  stageType: 'FRONT';
  affectionLevel?: number;
}

/** 推文数据 */
export interface TweetData {
  id: string;
  authorId: string;
  authorType: AuthorType;
  name: string;
  avatar: string;
  text: string;
  textJP?: string;
  image?: string;
  time: string;
  timestamp: number;

  // 互动数据
  likes: number;
  likedByMe: boolean;
  retweets: number;
  retweetedByMe: boolean;
  comments: TweetComment[];

  /** 转发原推 */
  originalTweet?: TweetData;

  // RAG 兼容
  stageType: 'FRONT';
  affectionLevel?: number;
}

// ==================== 节奏事件系统 ====================

/** 节奏事件状态 */
export type DramaEventStatus = 'active' | 'resolved' | 'escalated';

/** 节奏事件 */
export interface DramaEvent {
  id: string;
  idolId: string;
  title: string;
  /** AI 预写的剧情模板 */
  storyTemplate: string;
  /** 节奏进度 (0-100, 0 = 结束) */
  progress: number;
  startTimestamp: number;
  /** 用户行为记录 */
  userActions: string[];
  status: DramaEventStatus;
}

/** 偶像节奏状态 (每个偶像独立) */
export interface IdolDramaState {
  idolId: string;
  /** 节奏累积值 (0-100, 满了触发事件) */
  rhythmGauge: number;
  currentEvent?: DramaEvent;
  eventHistory: DramaEvent[];
}

// ==================== 用户系统 ====================

/** 用户小号 */
export interface AltAccount {
  id: string;
  name: string;
  avatar?: string;
}

/** 用户档案 */
export interface TwestaUserProfile {
  mainAccount: {
    name: string;
    avatar: string;
  };
  altAccounts: AltAccount[];
  /** 关注的偶像 ID 列表 */
  followedIdols: string[];
}

// ==================== 设置类型 ====================

/** Twesta 设置 */
export interface TwestaSettings {
  /** 是否启用 */
  enabled: boolean;
  /** 发推间隔 (分钟) */
  intervalMinutes: number;
  /** 发推概率 (%) */
  probability: number;
  /** 配图概率 (%) - 低 */
  imageProbability: number;
  /** 深夜模式 */
  nightModeEnabled: boolean;
  /** 黑粉概率 (%) */
  antiFanProbability: number;
  /** 节奏事件概率 (%) */
  dramaEventProbability: number;
}

// ==================== 存储数据结构 ====================

/** Twesta 完整存储数据 */
export interface TwestaStorageData {
  tweets: TweetData[];
  userProfile: TwestaUserProfile;
  idolDramaStates: IdolDramaState[];
  lastUpdateTimestamp: number;
}

// ==================== 默认值 ====================

export const DEFAULT_TWESTA_SETTINGS: TwestaSettings = {
  enabled: true,
  intervalMinutes: 15,
  probability: 30,
  imageProbability: 15, // 低概率使用配图
  nightModeEnabled: true,
  antiFanProbability: 5,
  dramaEventProbability: 2,
};

export const DEFAULT_USER_PROFILE: TwestaUserProfile = {
  mainAccount: {
    name: '制作人',
    avatar: '', // 将在 TwestaAssets 中设置默认值
  },
  altAccounts: [],
  followedIdols: [],
};
