/**
 * 偶像大师闪耀色彩 - 消息服务
 *
 * 处理与SillyTavern的消息通信
 */

import type {
  HistoryLoadOptions,
  Message,
  MessageExportOptions,
  MessageFormatOptions,
  MessageMetadata,
  MessageSendOptions,
  SceneType,
} from './消息类型';

/**
 * 消息服务类
 */
export class MessageService {
  /**
   * 格式化消息内容
   */
  static formatMessage(content: string, options: MessageFormatOptions = {}): string {
    const {
      enableMarkdown = true,
      enableCodeHighlight = true,
      enableQuote = true,
      enableRewardParsing = false,
      enableEmotionParsing = false,
    } = options;

    let formatted = content;

    if (enableMarkdown) {
      // 处理换行符
      formatted = formatted.replace(/\n/g, '<br>');

      // 处理引用格式
      if (enableQuote) {
        formatted = formatted.replace(/^> (.+)$/gm, '<blockquote class="quote">$1</blockquote>');
      }

      // 处理各种引号
      formatted = formatted.replace(/"([^"]*)"/g, '<span class="double-quote">"$1"</span>');
      formatted = formatted.replace(/"([^"]+)"/g, '<span class="double-quote">"$1"</span>');
      formatted = formatted.replace(/「([^」]+)」/g, '<span class="double-quote">「$1」</span>');
      formatted = formatted.replace(/『([^』]+)』/g, '<span class="double-quote">『$1』</span>');
      formatted = formatted.replace(/'([^']+)'/g, '<span class="single-quote">\'$1\'</span>');

      // 处理粗体和斜体
      formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="strong-text">$1</strong>');
      formatted = formatted.replace(/\*(.+?)\*/g, '<em class="italic-text">$1</em>');

      // 处理代码块
      if (enableCodeHighlight) {
        formatted = formatted.replace(/```([\s\S]*?)```/g, (_, code) => {
          return `<pre class="code-block"><code class="code-content">${code.trim()}</code></pre>`;
        });
        formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
      }
    }

    // 移除奖励标签（如果需要）
    if (enableRewardParsing) {
      formatted = formatted.replace(/<reward>.*?<\/reward>/g, '');
    }

    // 移除表情标签（如果需要）
    if (enableEmotionParsing) {
      formatted = formatted.replace(/<emotion>.*?<\/emotion>/g, '');
    }

    return formatted;
  }

  /**
   * 解析消息中的元数据
   */
  static parseMetadata(content: string): MessageMetadata {
    const metadata: MessageMetadata = {};

    // 解析奖励标签 <reward>{...}</reward>
    const rewardMatch = content.match(/<reward>(.*?)<\/reward>/);
    if (rewardMatch) {
      try {
        metadata.rewards = JSON.parse(rewardMatch[1]);
      } catch (error) {
        console.error('解析奖励失败:', error);
      }
    }

    // 解析表情标签 <emotion>...</emotion>
    const emotionMatch = content.match(/<emotion>(.*?)<\/emotion>/);
    if (emotionMatch) {
      metadata.emotion = emotionMatch[1];
    }

    // 解析背景标签 <background>...</background>
    const bgMatch = content.match(/<background>(.*?)<\/background>/);
    if (bgMatch) {
      metadata.background = bgMatch[1];
    }

    // 解析地点标签 <location>...</location>
    const locationMatch = content.match(/<location>(.*?)<\/location>/);
    if (locationMatch) {
      metadata.location = locationMatch[1];
    }

    metadata.timestamp = Date.now();

    return metadata;
  }

  /**
   * 获取当前时间字符串
   */
  static getCurrentTime(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * 创建消息对象
   */
  static createMessage(
    role: 'system' | 'assistant' | 'user',
    content: string,
    sender: string,
    messageId?: number,
    metadata?: MessageMetadata,
  ): Message {
    return {
      message_id: messageId,
      role,
      sender,
      time: this.getCurrentTime(),
      content,
      metadata: metadata || this.parseMetadata(content),
    };
  }

  /**
   * 发送消息并获取AI回复
   *
   * ✅ 本函数使用 `generate()` 而不是 `generateRaw()`
   *
   * 原因：通信系统、培育事件、剧情对话等功能需要：
   * 1. 使用用户在 SillyTavern 中配置的角色卡和人设
   * 2. 使用用户自行添加的世界书（角色背景、世界观设定等）
   * 3. 提供个性化的对话体验
   *
   * ⚠️ 只有生卡系统使用 `generateRaw()` 来实现独立Bot
   *    因为技能卡生成需要严格遵循游戏规则，不应受外部配置影响
   */
  static async sendMessage(options: MessageSendOptions): Promise<Message> {
    const { userInput, onSuccess, onError, enableStream, onStreamUpdate, scene = 'normal' } = options;

    try {
      // 1. 配置场景对应的世界书（如果需要）
      if (scene !== 'normal') {
        await this.configureWorldbookForScene(scene);
      }

      // 2. 创建用户消息到聊天历史
      await window.TavernHelper.createChatMessages([
        {
          role: 'user',
          message: userInput,
        },
      ]);

      let response = '';

      // 3. 根据是否启用流式传输选择不同的生成方式
      if (enableStream && onStreamUpdate) {
        console.log('🌊 启用流式传输');

        // 监听流式传输事件
        const handleStreamToken = (text: string) => {
          const regexResponse = formatAsTavernRegexedString(text, 'ai_output', 'display');
          onStreamUpdate(regexResponse);
        };

        eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);

        try {
          response = await window.TavernHelper.generate({
            user_input: userInput,
            should_stream: true,
          });

          eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);
        } catch (error) {
          eventRemoveListener(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, handleStreamToken);
          throw error;
        }
      } else {
        // 普通生成
        response = await window.TavernHelper.generate({
          user_input: userInput,
        });
      }

      // 4. 格式化AI回复（应用酒馆正则）
      const regexResponse = formatAsTavernRegexedString(response, 'ai_output', 'display');

      // 5. 创建AI回复消息到聊天历史
      await window.TavernHelper.createChatMessages([
        {
          role: 'assistant',
          message: regexResponse,
        },
      ]);

      // 6. 解析元数据
      const metadata = this.parseMetadata(regexResponse);

      // 7. 创建消息对象
      const aiMessage = this.createMessage('assistant', regexResponse, '系统', undefined, metadata);

      // 8. 处理奖励（如果有）
      if (metadata.rewards) {
        await this.applyRewards(metadata.rewards);
      }

      // 9. 处理表情动画（如果有）
      if (metadata.emotion) {
        this.triggerEmotion(metadata.emotion);
      }

      // 10. 处理背景切换（如果有）
      if (metadata.background) {
        this.changeBackground(metadata.background);
      }

      if (onSuccess) {
        onSuccess(regexResponse);
      }

      return aiMessage;
    } catch (error) {
      console.error('发送消息失败:', error);

      const errorMessage = this.createMessage('system', '抱歉，生成回复时出现错误，请稍后再试。', '系统');

      if (onError) {
        onError(error as Error);
      }

      return errorMessage;
    }
  }

  /**
   * 加载历史消息
   */
  static async loadHistoryMessages(options: HistoryLoadOptions = {}): Promise<Message[]> {
    const { messageRange = '0-{{lastMessageId}}', filterRole, limit } = options;

    try {
      let chatMessages = await window.TavernHelper.getChatMessages(messageRange);

      // 按角色过滤
      if (filterRole) {
        chatMessages = chatMessages.filter(msg => msg.role === filterRole);
      }

      // 限制数量
      if (limit) {
        chatMessages = chatMessages.slice(-limit);
      }

      return chatMessages.map(msg => {
        const metadata = this.parseMetadata(msg.message);
        return {
          message_id: msg.message_id,
          role: msg.role,
          sender: msg.role === 'user' ? '玩家' : '系统',
          time: this.getCurrentTime(),
          content: msg.message,
          metadata,
        };
      });
    } catch (error) {
      console.error('加载历史消息失败:', error);
      return [];
    }
  }

  /**
   * 导出消息
   */
  static exportMessages(messages: Message[], options: MessageExportOptions = { format: 'txt' }): void {
    const { format = 'txt', filename = 'messages', includeMetadata = false } = options;

    let content: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'json') {
      content = JSON.stringify(
        messages.map(msg => (includeMetadata ? msg : { ...msg, metadata: undefined })),
        null,
        2,
      );
      mimeType = 'application/json';
      fileExtension = 'json';
    } else {
      content = messages.map(msg => `[${msg.time}] ${msg.sender}: ${msg.content}`).join('\n');
      mimeType = 'text/plain';
      fileExtension = 'txt';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 配置场景对应的世界书（占位，需要实现）
   */
  private static async configureWorldbookForScene(scene: SceneType): Promise<void> {
    console.log(`🌍 配置世界书场景: ${scene}`);
    // TODO: 实现世界书配置逻辑
    // 根据场景启用/禁用不同的世界书条目
  }

  /**
   * 应用奖励到游戏变量
   */
  private static async applyRewards(rewards: NonNullable<MessageMetadata['rewards']>): Promise<void> {
    console.log('🎁 应用奖励:', rewards);

    // 读取当前培育状态
    const currentState = getVariables({ type: 'chat' });

    // 准备更新的变量
    const updates: Record<string, any> = {};

    if (rewards.stamina !== undefined) {
      updates['培育_体力'] = (currentState['培育_体力'] || 60) + rewards.stamina;
    }

    if (rewards.love !== undefined) {
      updates['好感度'] = (currentState['好感度'] || 0) + rewards.love;
    }

    if (rewards.vo !== undefined) {
      updates['培育_VO'] = (currentState['培育_VO'] || 100) + rewards.vo;
    }

    if (rewards.da !== undefined) {
      updates['培育_DA'] = (currentState['培育_DA'] || 100) + rewards.da;
    }

    if (rewards.vi !== undefined) {
      updates['培育_VI'] = (currentState['培育_VI'] || 100) + rewards.vi;
    }

    if (rewards.gems !== undefined) {
      const globalState = getVariables({ type: 'global' });
      replaceVariables({ 偶像大师_羽石: (globalState['偶像大师_羽石'] || 3000) + rewards.gems }, { type: 'global' });
    }

    if (rewards.fans !== undefined) {
      const globalState = getVariables({ type: 'global' });
      replaceVariables({ 偶像大师_粉丝: (globalState['偶像大师_粉丝'] || 0) + rewards.fans }, { type: 'global' });
    }

    // 应用培育相关的更新
    if (Object.keys(updates).length > 0) {
      replaceVariables(updates, { type: 'chat' });
    }

    console.log('✅ 奖励已应用');
  }

  /**
   * 触发表情动画
   */
  private static triggerEmotion(emotion: string): void {
    console.log('😊 触发表情动画:', emotion);
    // 通知主页面播放动画
    window.postMessage(
      {
        type: 'PLAY_EMOTION_ANIMATION',
        payload: { emotion },
      },
      '*',
    );
  }

  /**
   * 切换背景
   */
  private static changeBackground(background: string): void {
    console.log('🖼️ 切换背景:', background);
    // 通知主页面切换背景
    window.postMessage(
      {
        type: 'CHANGE_BACKGROUND',
        payload: { background },
      },
      '*',
    );
  }
}
