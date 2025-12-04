/**
 * SillyTavern 消息拦截器
 *
 * 功能：
 * - 监听用户发送的消息
 * - 监听AI生成的回复
 * - 监听生成事件（可注入提示词）
 * - 提供事件订阅机制
 */

// ============================================================================
// 类型定义
// ============================================================================

/** 拦截到的消息 */
export interface InterceptedMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  metadata?: {
    characterName?: string;
    swipeId?: number;
    messageId?: number;
  };
}

/** 生成事件数据 */
export interface GenerationEvent {
  type: 'started' | 'stopped' | 'finished';
  timestamp: number;
  metadata?: any;
}

/** 消息处理器 */
type MessageHandler = (message: InterceptedMessage) => void | Promise<void>;
type GenerationHandler = (event: GenerationEvent) => void | Promise<void>;

// ============================================================================
// 消息拦截器类
// ============================================================================

class MessageInterceptor {
  // 用户消息处理器集合
  private userMessageHandlers = new Set<MessageHandler>();

  // AI消息处理器集合
  private aiMessageHandlers = new Set<MessageHandler>();

  // 生成事件处理器集合
  private generationHandlers = new Set<GenerationHandler>();

  // 是否已初始化
  private initialized = false;

  /**
   * 初始化拦截器（监听酒馆事件）
   */
  initialize(): void {
    if (this.initialized) {
      console.warn('⚠️ MessageInterceptor 已经初始化过了');
      return;
    }

    console.log('🎯 初始化消息拦截器...');

    // 检查酒馆助手是否可用
    if (typeof eventOn === 'undefined') {
      console.error('❌ eventOn 函数不可用，请确保在酒馆环境中运行');
      return;
    }

    this.initializeEventListeners();
    this.initialized = true;

    console.log('✅ 消息拦截器初始化完成');
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听用户发送消息
    eventOn(tavern_events.MESSAGE_SENT, (data: any) => {
      this.handleUserMessage({
        type: 'user',
        content: data.text || data.message || '',
        timestamp: Date.now(),
        metadata: {
          messageId: data.mesId,
        },
      });
    });

    // 监听AI回复消息
    eventOn(tavern_events.MESSAGE_RECEIVED, (data: any) => {
      this.handleAIMessage({
        type: 'ai',
        content: data.text || data.message || '',
        timestamp: Date.now(),
        metadata: {
          characterName: data.character_name,
          swipeId: data.swipe_id,
          messageId: data.mesId,
        },
      });
    });

    // 监听生成开始
    eventOn(tavern_events.GENERATION_STARTED, (data: any) => {
      this.handleGenerationEvent({
        type: 'started',
        timestamp: Date.now(),
        metadata: data,
      });
    });

    // 监听生成结束
    eventOn(tavern_events.GENERATION_STOPPED, (data: any) => {
      this.handleGenerationEvent({
        type: 'stopped',
        timestamp: Date.now(),
        metadata: data,
      });
    });

    console.log('📡 事件监听器已注册');
  }

  /**
   * 处理用户消息
   */
  private handleUserMessage(message: InterceptedMessage): void {
    console.log('👤 [用户消息]:', message.content.substring(0, 100));

    // 通知所有处理器
    this.userMessageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('❌ 用户消息处理器错误:', error);
      }
    });
  }

  /**
   * 处理AI消息
   */
  private handleAIMessage(message: InterceptedMessage): void {
    console.log('🤖 [AI消息]:', message.content.substring(0, 100));

    // 通知所有处理器
    this.aiMessageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('❌ AI消息处理器错误:', error);
      }
    });
  }

  /**
   * 处理生成事件
   */
  private handleGenerationEvent(event: GenerationEvent): void {
    console.log('⚡ [生成事件]:', event.type);

    // 通知所有处理器
    this.generationHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('❌ 生成事件处理器错误:', error);
      }
    });
  }

  // ==========================================================================
  // 公共API - 订阅事件
  // ==========================================================================

  /**
   * 订阅用户消息
   * @returns 取消订阅函数
   */
  onUserMessage(handler: MessageHandler): () => void {
    this.userMessageHandlers.add(handler);
    return () => {
      this.userMessageHandlers.delete(handler);
    };
  }

  /**
   * 订阅AI消息
   * @returns 取消订阅函数
   */
  onAIMessage(handler: MessageHandler): () => void {
    this.aiMessageHandlers.add(handler);
    return () => {
      this.aiMessageHandlers.delete(handler);
    };
  }

  /**
   * 订阅生成事件
   * @returns 取消订阅函数
   */
  onGeneration(handler: GenerationHandler): () => void {
    this.generationHandlers.add(handler);
    return () => {
      this.generationHandlers.delete(handler);
    };
  }

  // ==========================================================================
  // 公共API - 向酒馆发送指令
  // ==========================================================================

  /**
   * 注入文本到当前对话（不会发送给LLM，仅显示在UI）
   */
  async injectText(text: string): Promise<void> {
    try {
      // 使用酒馆助手的slash命令
      await triggerSlash('/echo', text);
      console.log('✅ 文本已注入');
    } catch (error) {
      console.error('❌ 注入文本失败:', error);
      throw error;
    }
  }

  /**
   * 追加内容到系统提示词（会影响LLM）
   */
  async appendToSystemPrompt(content: string): Promise<void> {
    try {
      // 使用酒馆的setvar命令设置临时变量
      await triggerSlash('/setvar', `key=game_context ${content}`);
      console.log('✅ 系统提示词已更新');
    } catch (error) {
      console.error('❌ 更新系统提示词失败:', error);
      throw error;
    }
  }

  /**
   * 触发一次AI生成
   */
  async triggerGeneration(prompt?: string): Promise<void> {
    try {
      if (prompt) {
        // 先注入提示词
        await this.injectText(prompt);
      }

      // 触发生成
      await triggerSlash('/generate');
      console.log('✅ 已触发AI生成');
    } catch (error) {
      console.error('❌ 触发生成失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前角色卡信息
   */
  getCurrentCharacter(): any {
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
      const context = SillyTavern.getContext();
      return {
        name: context.name1 || '未知',
        characterId: context.characterId,
        chatId: context.chatId,
      };
    }
    return null;
  }

  /**
   * 获取当前聊天ID
   */
  getCurrentChatId(): string | null {
    if (typeof SillyTavern !== 'undefined' && SillyTavern.getCurrentChatId) {
      return SillyTavern.getCurrentChatId();
    }
    return null;
  }
}

// ============================================================================
// 导出单例
// ============================================================================

export const messageInterceptor = new MessageInterceptor();

// 自动初始化（在页面加载时）
$(() => {
  messageInterceptor.initialize();
});




