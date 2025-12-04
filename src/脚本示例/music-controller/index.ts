/**
 * 音乐控制脚本
 *
 * 功能：
 * 1. 根据场景自动切换BGM
 * 2. 支持 <bgm> 标签手动指定音乐
 * 3. 平滑的淡入淡出效果
 * 4. 音量控制
 */

// ==================== 配置区 ====================

/**
 * 是否启用自动BGM切换
 */
const AUTO_BGM_DETECTION = true;

/**
 * 默认音量 (0-1)
 */
const DEFAULT_VOLUME = 0.3;

/**
 * 淡入淡出时长（毫秒）
 */
const FADE_DURATION = 2000;

/**
 * BGM映射表
 */
const BGM_MAP: Record<string, string> = {
  // 日常场景
  日常: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/daily.mp3',
  轻松: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/relax.mp3',
  温馨: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/warm.mp3',

  // 训练场景
  训练: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/training.mp3',
  练习: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/practice.mp3',

  // 比赛场景
  比赛: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/battle.mp3',
  演出: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/performance.mp3',
  紧张: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/tension.mp3',

  // 情感场景
  感动: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/emotional.mp3',
  悲伤: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/sad.mp3',
  欢乐: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/cheerful.mp3',

  // 特殊场景
  结局: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/ending.mp3',
  成功: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/success.mp3',
  失败: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/failure.mp3',

  // 地点场景
  海滩: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/beach.mp3',
  夜晚: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/night.mp3',

  // 默认
  默认: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/音乐/bgm/default.mp3',
};

/**
 * 场景关键词映射到BGM
 */
const SCENE_KEYWORD_TO_BGM: Record<string, string[]> = {
  训练: ['训练', '练习', '课程', 'Lesson'],
  比赛: ['比赛', '演出', '舞台', 'Live', 'Stage'],
  感动: ['感动', '泪水', '眼泪', '哭'],
  悲伤: ['悲伤', '难过', '伤心', '痛苦'],
  欢乐: ['高兴', '开心', '快乐', '欢呼'],
  海滩: ['海滩', '海边', '沙滩', 'Beach'],
  夜晚: ['夜晚', '深夜', '月光', '星空'],
  成功: ['成功', '完美', 'Perfect', '太棒了', 'Great'],
  失败: ['失败', '不行', '糟糕', '输了'],
};

// ==================== 状态管理 ====================

/**
 * 当前音频对象
 */
let currentAudio: HTMLAudioElement | null = null;

/**
 * 当前播放的BGM名称
 */
let currentBGM: string | null = null;

/**
 * 淡出定时器
 */
let fadeOutTimer: number | null = null;

/**
 * 淡入定时器
 */
let fadeInTimer: number | null = null;

// ==================== 核心逻辑 ====================

/**
 * 播放BGM
 */
function playBGM(url: string, name: string) {
  if (currentBGM === name) {
    console.log('🎵 BGM未变化，跳过');
    return;
  }

  console.log('🎵 播放BGM:', name);

  // 停止当前音乐（淡出）
  if (currentAudio) {
    fadeOut(currentAudio, () => {
      currentAudio?.pause();
      currentAudio = null;
    });
  }

  // 创建新音频对象
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = 0; // 从0开始淡入

  // 播放音乐
  audio
    .play()
    .then(() => {
      console.log('✅ BGM开始播放');
      currentAudio = audio;
      currentBGM = name;

      // 淡入效果
      fadeIn(audio, DEFAULT_VOLUME);

      toastr.info(`BGM: ${name}`, '', { timeOut: 2000 });
    })
    .catch(error => {
      console.error('❌ BGM播放失败:', error);
      toastr.warning('BGM播放失败，可能需要用户交互', '', { timeOut: 3000 });
    });
}

/**
 * 淡出效果
 */
function fadeOut(audio: HTMLAudioElement, onComplete?: () => void) {
  if (fadeOutTimer) clearInterval(fadeOutTimer);

  const startVolume = audio.volume;
  const step = startVolume / (FADE_DURATION / 50);

  fadeOutTimer = window.setInterval(() => {
    if (audio.volume > 0.01) {
      audio.volume = Math.max(0, audio.volume - step);
    } else {
      audio.volume = 0;
      if (fadeOutTimer) clearInterval(fadeOutTimer);
      onComplete?.();
    }
  }, 50);
}

/**
 * 淡入效果
 */
function fadeIn(audio: HTMLAudioElement, targetVolume: number) {
  if (fadeInTimer) clearInterval(fadeInTimer);

  const step = targetVolume / (FADE_DURATION / 50);

  fadeInTimer = window.setInterval(() => {
    if (audio.volume < targetVolume - 0.01) {
      audio.volume = Math.min(targetVolume, audio.volume + step);
    } else {
      audio.volume = targetVolume;
      if (fadeInTimer) clearInterval(fadeInTimer);
    }
  }, 50);
}

/**
 * 停止BGM
 */
function stopBGM() {
  if (!currentAudio) return;

  console.log('⏹️ 停止BGM');
  fadeOut(currentAudio, () => {
    currentAudio?.pause();
    currentAudio = null;
    currentBGM = null;
  });
}

/**
 * 设置音量
 */
function setVolume(volume: number) {
  if (!currentAudio) return;

  volume = Math.max(0, Math.min(1, volume));
  console.log('🔊 设置音量:', volume);

  // 平滑过渡到新音量
  const current = currentAudio.volume;
  const diff = volume - current;
  const steps = 20;
  const stepValue = diff / steps;

  let step = 0;
  const timer = setInterval(() => {
    if (step < steps && currentAudio) {
      currentAudio.volume = current + stepValue * step;
      step++;
    } else {
      if (currentAudio) currentAudio.volume = volume;
      clearInterval(timer);
    }
  }, 20);
}

/**
 * 根据名称切换BGM
 */
function changeBGM(name: string) {
  const url = BGM_MAP[name];
  if (url) {
    playBGM(url, name);
  } else {
    console.warn(`⚠️ 未找到BGM: ${name}`);
    // 使用默认BGM
    playBGM(BGM_MAP['默认'], '默认');
  }
}

/**
 * 解析消息中的 <bgm> 标签
 */
function parseBGMTag(text: string): string | null {
  const match = text.match(/<bgm>(.*?)<\/bgm>/);
  if (match) {
    const bgmName = match[1].trim();
    console.log(`🏷️ 检测到bgm标签: ${bgmName}`);
    return bgmName;
  }
  return null;
}

/**
 * 自动检测场景关键词
 */
function detectBGMFromText(text: string): string | null {
  console.log('🔍 开始BGM检测:', text);

  // 遍历场景关键词映射
  for (const [bgmName, keywords] of Object.entries(SCENE_KEYWORD_TO_BGM)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        console.log(`✅ 检测到场景: ${bgmName} (关键词: ${keyword})`);
        return bgmName;
      }
    }
  }

  console.log('❌ 未检测到明显场景');
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

    // 1. 优先检测 <bgm> 标签
    const tagBGM = parseBGMTag(text);
    if (tagBGM) {
      changeBGM(tagBGM);
      return;
    }

    // 2. 自动检测场景关键词
    if (AUTO_BGM_DETECTION) {
      const detectedBGM = detectBGMFromText(text);
      if (detectedBGM) {
        changeBGM(detectedBGM);
        return;
      }
    }
  } catch (error) {
    console.error('❌ 处理消息失败:', error);
  }
}

/**
 * 处理聊天变更事件
 */
function handleChatChanged(newChatId: string) {
  console.log('🔄 聊天已切换:', newChatId);

  // 切换到默认BGM
  changeBGM('默认');
}

/**
 * 处理用户自定义BGM切换
 */
function handleCustomBGMChange(event: MessageEvent) {
  if (!event.data || event.data.type !== 'SET_BGM') return;

  const { bgm, volume } = event.data.payload;
  console.log('🎨 用户自定义BGM:', bgm);

  if (bgm === 'stop') {
    stopBGM();
  } else if (bgm === 'pause') {
    currentAudio?.pause();
  } else if (bgm === 'resume') {
    currentAudio?.play();
  } else if (typeof bgm === 'string') {
    // 如果是URL，直接使用
    if (bgm.startsWith('http')) {
      playBGM(bgm, '自定义');
    } else {
      // 否则作为名称查找
      changeBGM(bgm);
    }
  }

  // 设置音量
  if (typeof volume === 'number') {
    setVolume(volume);
  }
}

// ==================== 初始化 ====================

$(() => {
  console.log('🎵 音乐控制脚本已加载');

  try {
    // 监听AI消息接收事件
    eventOn(tavern_events.MESSAGE_RECEIVED, handleMessageReceived);
    console.log('✅ 已注册MESSAGE_RECEIVED事件监听器');

    // 监听聊天变更事件
    eventOn(tavern_events.CHAT_CHANGED, handleChatChanged);
    console.log('✅ 已注册CHAT_CHANGED事件监听器');

    // 监听自定义BGM切换消息
    window.addEventListener('message', handleCustomBGMChange);
    console.log('✅ 已注册自定义BGM切换监听器');

    // 播放默认BGM
    setTimeout(() => {
      // 延迟播放，避免浏览器自动播放策略限制
      changeBGM('默认');
    }, 1000);

    console.log('🎉 音乐控制脚本初始化完成！');
    console.log('📋 配置:');
    console.log('  - 自动BGM检测:', AUTO_BGM_DETECTION);
    console.log('  - 默认音量:', DEFAULT_VOLUME);
    console.log('  - 淡入淡出时长:', FADE_DURATION, 'ms');
    console.log('  - 可用BGM数:', Object.keys(BGM_MAP).length);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    toastr.error('音乐控制脚本初始化失败，请检查控制台');
  }
});

// ==================== 卸载 ====================

$(window).on('pagehide', () => {
  console.log('🗑️ 音乐控制脚本已卸载');

  // 停止音乐
  stopBGM();

  // 移除监听器
  window.removeEventListener('message', handleCustomBGMChange);
});

// ==================== 调试工具 ====================

// 在全局暴露调试接口
(window as any).__musicController = {
  play: changeBGM,
  stop: stopBGM,
  setVolume,
  getCurrentBGM: () => currentBGM,
  getAvailableBGM: () => Object.keys(BGM_MAP),
  testDetection: (text: string) => {
    console.log('🧪 测试BGM检测:', text);
    const result = detectBGMFromText(text);
    console.log('结果:', result);
    return result;
  },
  playCustom: (url: string, name = '自定义') => {
    console.log('🎨 播放自定义BGM:', url);
    playBGM(url, name);
  },
  pause: () => {
    currentAudio?.pause();
    console.log('⏸️ BGM已暂停');
  },
  resume: () => {
    currentAudio?.play();
    console.log('▶️ BGM已恢复');
  },
};

console.log('🔧 调试工具已挂载到 window.__musicController');
console.log('使用示例:');
console.log('  window.__musicController.play("训练")');
console.log('  window.__musicController.setVolume(0.5)');
console.log('  window.__musicController.stop()');
console.log('  window.__musicController.testDetection("今天要进行训练")');


