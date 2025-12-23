/**
 * 手机系统类型定义
 */

// 应用 ID
export type AppId = 'twesta' | 'chain' | 'phone' | 'ourstream';

// 应用定义
export interface AppDef {
  id: AppId;
  label: string;
  description?: string;
}

// 未读消息计数
export type UnreadCounts = Partial<Record<AppId, number>>;

// 手机状态
export interface PhoneState {
  isOpen: boolean;
  currentApp: AppId | null;
  unreads: UnreadCounts;
}

// 推文数据
export interface TweetData {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  isFromIdol: boolean;
}

// 消息数据
export interface MessageData {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
  isRead: boolean;
}

// 对话数据
export interface ConversationData {
  idolId: string;
  idolName: string;
  idolAvatar?: string;
  messages: MessageData[];
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

// 来电数据
export interface IncomingCallData {
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  timestamp: string;
}

// 视频数据
export interface VideoData {
  id: string;
  title: string;
  thumbnail?: string;
  duration: string;
  uploaderId: string;
  uploaderName: string;
  views: number;
  uploadDate: string;
}

// 手机 API 设置
export interface PhoneApiSettings {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  model: string;
}

// 随机更新类型
export type UpdateType = 'tweet' | 'message' | 'call';

// 随机更新事件
export interface RandomUpdateEvent {
  type: UpdateType;
  data: TweetData | MessageData | IncomingCallData;
  timestamp: string;
}
