/**
 * Spine动画控制脚本
 *
 * 功能：
 * 1. 监听AI消息，自动检测情感并播放对应动画
 * 2. 支持 <emotion> 标签手动指定动画
 * 3. 在AI生成消息期间播放说话动画
 * 4. 消息完成后播放情感动画或返回待机
 */

import { detectEmotion, detectEmotionIntensity, estimateSpeakingDuration } from './emotion-detector';

// ==================== 配置区 ====================

/**
 * 是否启用自动情感检测
 */
const AUTO_EMOTION_DETECTION = true;

/**
 * 是否在AI回复时播放说话动画
 */
const AUTO_PLAY_TALK_ANIMATION = true;

/**
 * 说话动画列表（随机选择）
 */
const TALK_ANIMATIONS = ['Talk_01', 'Talk_Happy', 'Talk_Serious'];

/**
 * 情感动画映射（与emotion-detector.ts保持一致）
 */
const EMOTION_ANIMATION_MAP: Record<string, string> = {
  高兴: 'Emotion_Happy',
  开心: 'Emotion_Happy',
  笑: 'Emotion_Happy',
  难过: 'Emotion_Sad',
  伤心: 'Emotion_Sad',
  哭: 'Emotion_Sad',
  生气: 'Emotion_Angry',
  愤怒: 'Emotion_Angry',
  惊讶: 'Emotion_Surprise',
  吓: 'Emotion_Surprise',
  害羞: 'Emotion_Shy',
  脸红: 'Emotion_Shy',
  疑惑: 'Emotion_Confusion',
  困惑: 'Emotion_Confusion',
  思考: 'Think',
};

// ==================== 核心逻辑 ====================

/**
 * 向前端界面发送动画指令
 */
function sendAnimationCommand(command: {
  type: 'PLAY_ANIMATION' | 'PLAY_EMOTION' | 'PLAY_TALK' | 'STOP_TALK' | 'SET_TIME_SCALE';
  payload: any;
}) {
  console.log('📤 发送动画指令:', command);

  // 向所有iframe发送消息
  window.postMessage(command, '*');

  // 也向父窗口发送（如果是在iframe中运行）
  if (window.parent !== window) {
    window.parent.postMessage(command, '*');
  }
}

/**
 * 播放Spine动画
 */
function playAnimation(animationName: string, loop = false) {
  sendAnimationCommand({
    type: 'PLAY_ANIMATION',
    payload: { animation: animationName, loop },
  });
}

/**
 * 播放情绪动画
 */
function playEmotion(emotion: string) {
  sendAnimationCommand({
    type: 'PLAY_EMOTION',
    payload: { emotion },
  });
}

/**
 * 播放说话动画
 */
function playTalk() {
  // 随机选择一个说话动画
  const talkAnim = TALK_ANIMATIONS[Math.floor(Math.random() * TALK_ANIMATIONS.length)];

  sendAnimationCommand({
    type: 'PLAY_TALK',
    payload: { animation: talkAnim },
  });
}

/**
 * 停止说话
 */
function stopTalk() {
  sendAnimationCommand({
    type: 'STOP_TALK',
    payload: {},
  });
}

/**
 * 设置动画速度
 */
function setTimeScale(scale: number) {
  sendAnimationCommand({
    type: 'SET_TIME_SCALE',
    payload: { scale },
  });
}

/**
 * 解析消息中的 <emotion> 标签
 */
function parseEmotionTag(text: string): string | null {
  const match = text.match(/<emotion>(.*?)<\/emotion>/);
  if (match) {
    const emotion = match[1].trim();
    console.log(`🏷️ 检测到emotion标签: ${emotion}`);
    return EMOTION_ANIMATION_MAP[emotion] || emotion;
  }
  return null;
}

/**
 * 处理AI消息接收事件
 */
function handleMessageReceived(messageId: number) {
  console.log('📨 收到AI消息:', messageId);

  try {
    // 获取消息内容
    const message = SillyTavern.chat[messageId];
    if (!message) {
      console.warn('⚠️ 消息不存在');
      return;
    }

    const text = message.mes;
    console.log('📝 消息内容:', text);

    // 停止说话动画
    if (AUTO_PLAY_TALK_ANIMATION) {
      stopTalk();
    }

    // 1. 优先检测 <emotion> 标签
    const tagEmotion = parseEmotionTag(text);
    if (tagEmotion) {
      playEmotion(tagEmotion);
      return;
    }

    // 2. 自动情感检测
    if (AUTO_EMOTION_DETECTION) {
      const detected = detectEmotion(text);
      if (detected && detected.confidence >= 0.2) {
        // 根据情感强度调整动画速度
        const intensity = detectEmotionIntensity(text);
        if (intensity > 1.0) {
          setTimeScale(intensity);
          // 播放完后恢复速度
          setTimeout(() => setTimeScale(1.0), 2000);
        }

        playEmotion(detected.animation);
        return;
      }
    }

    // 3. 没有检测到情感，播放默认说话动画一小段时间后返回待机
    if (AUTO_PLAY_TALK_ANIMATION) {
      playTalk();
      const duration = Math.min(estimateSpeakingDuration(text), 3000);
      setTimeout(() => stopTalk(), duration);
    }
  } catch (error) {
    console.error('❌ 处理消息失败:', error);
  }
}

/**
 * 处理AI开始生成消息事件
 */
function handleMessageGenerationStarted() {
  console.log('✍️ AI开始生成消息');

  // 播放说话动画
  if (AUTO_PLAY_TALK_ANIMATION) {
    playTalk();
  }
}

/**
 * 处理聊天变更事件（切换角色）
 */
function handleChatChanged(newChatId: string) {
  console.log('🔄 聊天已切换:', newChatId);

  // 停止所有动画，返回待机
  stopTalk();
}

/**
 * 处理角色切换事件
 */
function handleCharacterChanged(newCharacterId: string) {
  console.log('🔄 角色已切换:', newCharacterId);

  // 停止所有动画，返回待机
  stopTalk();

  // TODO: 根据新角色ID加载对应的Spine资源
  // 这需要前端界面支持动态切换Spine
}

// ==================== 初始化 ====================

$(() => {
  console.log('🎬 Spine控制脚本已加载');

  try {
    // 监听AI消息接收事件
    eventOn(tavern_events.MESSAGE_RECEIVED, handleMessageReceived);
    console.log('✅ 已注册MESSAGE_RECEIVED事件监听器');

    // 监听AI开始生成消息事件
    eventOn(tavern_events.GENERATION_STARTED, handleMessageGenerationStarted);
    console.log('✅ 已注册GENERATION_STARTED事件监听器');

    // 监听聊天变更事件
    eventOn(tavern_events.CHAT_CHANGED, handleChatChanged);
    console.log('✅ 已注册CHAT_CHANGED事件监听器');

    // 监听角色切换事件
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, handleCharacterChanged);
    console.log('✅ 已注册CHARACTER_MESSAGE_RENDERED事件监听器');

    console.log('🎉 Spine控制脚本初始化完成！');
    console.log('📋 配置:');
    console.log('  - 自动情感检测:', AUTO_EMOTION_DETECTION);
    console.log('  - 自动说话动画:', AUTO_PLAY_TALK_ANIMATION);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    toastr.error('Spine控制脚本初始化失败，请检查控制台');
  }
});

// ==================== 卸载 ====================

$(window).on('pagehide', () => {
  console.log('🗑️ Spine控制脚本已卸载');
});

// ==================== 调试工具 ====================

// 在全局暴露调试接口
(window as any).__spineController = {
  playAnimation,
  playEmotion,
  playTalk,
  stopTalk,
  setTimeScale,
  testEmotion: (text: string) => {
    console.log('🧪 测试情感检测:', text);
    const result = detectEmotion(text);
    console.log('结果:', result);
    return result;
  },
};

console.log('🔧 调试工具已挂载到 window.__spineController');
console.log('使用示例:');
console.log('  window.__spineController.playEmotion("Emotion_Happy")');
console.log('  window.__spineController.testEmotion("今天真开心！")');

