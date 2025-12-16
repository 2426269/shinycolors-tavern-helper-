/**
 * 偶像大师闪耀色彩 - 消息聊天 Composable
 *
 * 提供消息交互的响应式状态和方法
 */

import { onMounted, ref } from 'vue';
import { MessageService } from './消息服务';
import type {
  HistoryLoadOptions,
  Message,
  MessageExportOptions,
  MessageFormatOptions,
  MessageSendOptions,
} from './消息类型';

/**
 * 消息聊天配置选项
 */
export interface UseMessageChatOptions {
  autoLoadHistory?: boolean; // 是否自动加载历史消息
  historyOptions?: HistoryLoadOptions; // 历史消息加载选项
}

/**
 * 消息聊天 Composable
 */
export function useMessageChat(options: UseMessageChatOptions = {}) {
  const { autoLoadHistory = true, historyOptions = {} } = options;

  // ========== 响应式数据 ==========
  const messages = ref<Message[]>([]);
  const currentMessage = ref('');
  const isLoading = ref(false);
  const containerRef = ref<HTMLElement | null>(null);

  // ========== 历史消息加载 ==========
  /**
   * 加载历史消息
   */
  const loadHistoryMessages = async (customOptions?: HistoryLoadOptions) => {
    try {
      const options = customOptions || historyOptions;
      const historyMessages = await MessageService.loadHistoryMessages(options);
      messages.value = historyMessages;
      console.log(`📚 已加载 ${historyMessages.length} 条历史消息`);
    } catch (error) {
      console.error('❌ 加载历史消息失败:', error);
    }
  };

  // ========== 消息发送 ==========
  /**
   * 发送消息
   */
  const sendMessage = async (customOptions?: Partial<MessageSendOptions>) => {
    if (!currentMessage.value.trim()) return;

    const messageContent = currentMessage.value;
    currentMessage.value = '';

    // 添加玩家消息到本地
    const playerMessage = MessageService.createMessage('user', messageContent, '玩家');
    messages.value = [...messages.value, playerMessage];

    isLoading.value = true;

    try {
      // 发送消息并获取AI回复
      const aiMessage = await MessageService.sendMessage({
        userInput: messageContent,
        ...customOptions,
      });

      // 添加AI回复到本地
      messages.value = [...messages.value, aiMessage];

      console.log('✅ 消息发送成功');
    } catch (error) {
      console.error('❌ 发送消息失败:', error);

      // 添加错误消息
      const errorMessage = MessageService.createMessage('system', '抱歉，发送失败，请稍后再试。', '系统');
      messages.value = [...messages.value, errorMessage];
    } finally {
      isLoading.value = false;
    }
  };

  // ========== 消息管理 ==========
  /**
   * 清空消息
   */
  const clearMessages = () => {
    messages.value = [];
    console.log('🗑️ 已清空所有消息');
  };

  /**
   * 删除指定消息
   */
  const deleteMessage = (messageId: number) => {
    messages.value = messages.value.filter(msg => msg.message_id !== messageId);
    console.log(`🗑️ 已删除消息 #${messageId}`);
  };

  // ========== 消息格式化 ==========
  /**
   * 格式化消息内容
   */
  const formatMessage = (content: string, formatOptions?: MessageFormatOptions) => {
    return MessageService.formatMessage(content, formatOptions);
  };

  // ========== 消息导出 ==========
  /**
   * 导出消息
   */
  const exportMessages = (exportOptions?: MessageExportOptions) => {
    MessageService.exportMessages(messages.value, exportOptions);
    console.log('📤 消息导出成功');
  };

  // ========== 消息添加（不发送到AI） ==========
  /**
   * 添加系统消息
   */
  const addSystemMessage = (content: string) => {
    const systemMessage = MessageService.createMessage('system', content, '系统');
    messages.value = [...messages.value, systemMessage];
  };

  /**
   * 添加用户消息（不发送到AI）
   */
  const addUserMessage = (content: string, sender: string = '玩家') => {
    const userMessage = MessageService.createMessage('user', content, sender);
    messages.value = [...messages.value, userMessage];
  };

  /**
   * 添加AI消息（不发送请求）
   */
  const addAIMessage = (content: string, sender: string = '系统') => {
    const aiMessage = MessageService.createMessage('assistant', content, sender);
    messages.value = [...messages.value, aiMessage];
  };

  // ========== 工具方法 ==========
  /**
   * 获取最后一条消息
   */
  const getLastMessage = () => {
    return messages.value[messages.value.length - 1] || null;
  };

  /**
   * 获取最后一条AI消息
   */
  const getLastAIMessage = () => {
    for (let i = messages.value.length - 1; i >= 0; i--) {
      if (messages.value[i].role === 'assistant') {
        return messages.value[i];
      }
    }
    return null;
  };

  /**
   * 统计消息数量
   */
  const getMessageCount = () => {
    return {
      total: messages.value.length,
      user: messages.value.filter(msg => msg.role === 'user').length,
      assistant: messages.value.filter(msg => msg.role === 'assistant').length,
      system: messages.value.filter(msg => msg.role === 'system').length,
    };
  };

  // ========== 生命周期 ==========
  onMounted(() => {
    if (autoLoadHistory) {
      loadHistoryMessages();
    }
  });

  // ========== 返回值 ==========
  return {
    // 响应式数据
    messages,
    currentMessage,
    isLoading,
    containerRef,

    // 核心方法
    sendMessage,
    loadHistoryMessages,

    // 消息管理
    clearMessages,
    deleteMessage,

    // 消息格式化
    formatMessage,

    // 消息导出
    exportMessages,

    // 消息添加
    addSystemMessage,
    addUserMessage,
    addAIMessage,

    // 工具方法
    getLastMessage,
    getLastAIMessage,
    getMessageCount,
  };
}
