/**
 * 偶像大师闪耀色彩 - 通信模块
 *
 * 统一导出所有通信相关功能
 */

// 类型定义
export type {
  HistoryLoadOptions,
  Message,
  MessageExportOptions,
  MessageFormatOptions,
  MessageMetadata,
  MessageRole,
  MessageSendOptions,
  SceneType,
} from './消息类型';

// 服务类
export { MessageService } from './消息服务';

// Vue Composable
export { useMessageChat } from './消息聊天';
export type { UseMessageChatOptions } from './消息聊天';

// 事件监听
export { EventListenerManager, cleanupEventListeners, initializeEventListeners } from './事件监听';
