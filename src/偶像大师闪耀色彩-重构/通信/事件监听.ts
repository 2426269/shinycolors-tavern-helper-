/**
 * 偶像大师闪耀色彩 - 事件监听系统
 *
 * 监听SillyTavern事件并做出响应
 */

/**
 * 事件监听管理器
 */
export class EventListenerManager {
  private static listeners: Map<string, Function[]> = new Map();

  /**
   * 初始化所有事件监听器
   */
  static initialize() {
    console.log('🎧 初始化事件监听系统...');

    this.setupMessageListener();
    this.setupChatChangeListener();
    this.setupCharacterChangeListener();
    this.setupGenerationListener();

    console.log('✅ 事件监听系统已初始化');
  }

  /**
   * 监听AI消息接收事件
   */
  private static setupMessageListener() {
    const handler = async (messageId: number) => {
      try {
        const message = SillyTavern.chat[messageId];
        if (!message || message.is_user) return;

        const text = message.mes;
        console.log('📨 收到AI消息:', messageId);

        // 解析并应用奖励
        const rewardMatch = text.match(/<reward>(.*?)<\/reward>/);
        if (rewardMatch) {
          try {
            const rewards = JSON.parse(rewardMatch[1]);
            console.log('🎁 检测到奖励:', rewards);
            await this.applyRewards(rewards);
          } catch (error) {
            console.error('❌ 解析奖励失败:', error);
          }
        }

        // 解析并播放表情动画
        const emotionMatch = text.match(/<emotion>(.*?)<\/emotion>/);
        if (emotionMatch) {
          const emotion = emotionMatch[1];
          console.log('😊 检测到表情:', emotion);
          this.triggerEmotion(emotion);
        }

        // 解析并切换背景
        const bgMatch = text.match(/<background>(.*?)<\/background>/);
        if (bgMatch) {
          const background = bgMatch[1];
          console.log('🖼️ 检测到背景切换:', background);
          this.changeBackground(background);
        }

        // 解析地点信息
        const locationMatch = text.match(/<location>(.*?)<\/location>/);
        if (locationMatch) {
          const location = locationMatch[1];
          console.log('📍 检测到地点:', location);
          this.updateLocation(location);
        }
      } catch (error) {
        console.error('❌ 处理消息事件失败:', error);
      }
    };

    eventOn(tavern_events.MESSAGE_RECEIVED, handler);
    this.registerListener('MESSAGE_RECEIVED', handler);
  }

  /**
   * 监听聊天变更事件（培育会话切换）
   */
  private static setupChatChangeListener() {
    let currentChatId = SillyTavern.getCurrentChatId();

    const handler = (newChatId: string) => {
      if (currentChatId !== newChatId) {
        console.log('💬 聊天切换:', currentChatId, '->', newChatId);
        currentChatId = newChatId;

        // 通知主页面重新加载状态
        window.postMessage(
          {
            type: 'CHAT_CHANGED',
            payload: { chatId: newChatId },
          },
          '*',
        );
      }
    };

    eventOn(tavern_events.CHAT_CHANGED, handler);
    this.registerListener('CHAT_CHANGED', handler);
  }

  /**
   * 监听角色切换事件（偶像切换）
   */
  private static setupCharacterChangeListener() {
    const handler = (characterId: string) => {
      console.log('👤 角色切换:', characterId);

      // 通知主页面更新显示的偶像
      window.postMessage(
        {
          type: 'CHARACTER_CHANGED',
          payload: { characterId },
        },
        '*',
      );
    };

    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, handler);
    this.registerListener('CHARACTER_MESSAGE_RENDERED', handler);
  }

  /**
   * 监听生成开始/结束事件
   */
  private static setupGenerationListener() {
    const startHandler = () => {
      console.log('⏳ AI生成开始...');
      window.postMessage({ type: 'GENERATION_STARTED' }, '*');
    };

    const endHandler = () => {
      console.log('✅ AI生成完成');
      window.postMessage({ type: 'GENERATION_ENDED' }, '*');
    };

    eventOn(tavern_events.GENERATION_STARTED, startHandler);
    eventOn(tavern_events.GENERATION_ENDED, endHandler);

    this.registerListener('GENERATION_STARTED', startHandler);
    this.registerListener('GENERATION_ENDED', endHandler);
  }

  /**
   * 应用奖励到游戏变量
   */
  private static async applyRewards(rewards: any): Promise<void> {
    try {
      const currentState = getVariables({ type: 'chat' });
      const updates: Record<string, any> = {};

      // 培育属性
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

      // 应用培育更新
      if (Object.keys(updates).length > 0) {
        replaceVariables(updates, { type: 'chat' });
        console.log('✅ 培育属性已更新:', updates);
      }

      // 全局资源
      if (rewards.gems !== undefined || rewards.fans !== undefined) {
        const globalState = getVariables({ type: 'global' });
        const globalUpdates: Record<string, any> = {};

        if (rewards.gems !== undefined) {
          globalUpdates['偶像大师_羽石'] = (globalState['偶像大师_羽石'] || 3000) + rewards.gems;
        }

        if (rewards.fans !== undefined) {
          globalUpdates['偶像大师_粉丝'] = (globalState['偶像大师_粉丝'] || 0) + rewards.fans;
        }

        replaceVariables(globalUpdates, { type: 'global' });
        console.log('✅ 全局资源已更新:', globalUpdates);
      }

      // 通知主页面刷新显示
      window.postMessage({ type: 'REWARDS_APPLIED', payload: rewards }, '*');
    } catch (error) {
      console.error('❌ 应用奖励失败:', error);
    }
  }

  /**
   * 触发表情动画
   */
  private static triggerEmotion(emotion: string): void {
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
    window.postMessage(
      {
        type: 'CHANGE_BACKGROUND',
        payload: { background },
      },
      '*',
    );
  }

  /**
   * 更新地点信息
   */
  private static updateLocation(location: string): void {
    window.postMessage(
      {
        type: 'LOCATION_UPDATED',
        payload: { location },
      },
      '*',
    );
  }

  /**
   * 注册监听器（用于清理）
   */
  private static registerListener(eventName: string, handler: Function) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(handler);
  }

  /**
   * 清理所有监听器
   */
  static cleanup() {
    console.log('🧹 清理事件监听器...');

    // 这里可以移除所有注册的监听器
    // 注意：酒馆助手的 eventRemoveListener 可能需要具体的事件名称和处理函数

    this.listeners.clear();
    console.log('✅ 事件监听器已清理');
  }
}

/**
 * 在页面加载时自动初始化
 */
export function initializeEventListeners() {
  EventListenerManager.initialize();
}

/**
 * 在页面卸载时自动清理
 */
export function cleanupEventListeners() {
  EventListenerManager.cleanup();
}
