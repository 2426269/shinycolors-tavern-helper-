/**
 * 手机/短信系统类型定义
 */

/** 短信消息 */
export interface Message {
  id: string;
  /** 发送者 ('player' | 角色ID) */
  senderId: string;
  /** 发送者名称 */
  senderName: string;
  /** 消息内容 */
  content: string;
  /** 情感标签 */
  emotion?: string;
  /** 发送时间 */
  timestamp: string;
  /** 是否已读 */
  isRead: boolean;
}

/** 对话线程 */
export interface ChatThread {
  /** 角色ID */
  characterId: string;
  /** 角色名称 */
  characterName: string;
  /** 头像URL */
  avatarUrl: string;
  /** 消息列表 */
  messages: Message[];
  /** 未读数 */
  unreadCount: number;
}
