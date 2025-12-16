/**
 * 背景切换控制脚本
 *
 * 功能：
 * 1. 根据AI消息中的地点关键词自动切换背景
 * 2. 支持 <background> 标签手动指定背景
 * 3. 平滑的过渡动画
 */

// ==================== 配置区 ====================

/**
 * 是否启用自动背景检测
 */
const AUTO_BACKGROUND_DETECTION = true;

/**
 * 背景图片映射
 */
const BACKGROUND_MAP: Record<string, string> = {
  // 训练场所
  录音室: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/studio.jpg',
  舞蹈室: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/dance_room.jpg',
  练习室: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/practice_room.jpg',

  // 日常场所
  事务所: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/office.jpg',
  咖啡厅: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/cafe.jpg',
  图书馆: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/library.jpg',
  公园: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/park.jpg',
  商店街: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/shopping_street.jpg',

  // 休闲场所
  海滩: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/beach.jpg',
  游泳池: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/pool.jpg',
  温泉: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/hot_spring.jpg',
  电影院: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/cinema.jpg',
  水族馆: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/aquarium.jpg',

  // 演出场所
  舞台: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/stage.jpg',
  后台: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/backstage.jpg',
  演唱会: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/concert.jpg',

  // 特殊场景
  夜景: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/night_view.jpg',
  日落: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/sunset.jpg',
  星空: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/starry_sky.jpg',

  // 默认
  默认: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/default.jpg',
};

/**
 * 当前背景
 */
let currentBackground: string | null = null;

/**
 * 过渡动画时长（毫秒）
 */
const TRANSITION_DURATION = 1000;

// ==================== 核心逻辑 ====================

/**
 * 向前端界面发送背景切换指令
 */
function sendBackgroundCommand(backgroundUrl: string) {
  if (currentBackground === backgroundUrl) {
    console.log('🖼️ 背景未变化，跳过');
    return;
  }

  console.log('📤 发送背景切换指令:', backgroundUrl);
  currentBackground = backgroundUrl;

  // 向所有iframe发送消息
  window.postMessage(
    {
      type: 'CHANGE_BACKGROUND',
      payload: {
        background: backgroundUrl,
        transition: TRANSITION_DURATION,
      },
    },
    '*',
  );

  // 也向父窗口发送（如果是在iframe中运行）
  if (window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'CHANGE_BACKGROUND',
        payload: {
          background: backgroundUrl,
          transition: TRANSITION_DURATION,
        },
      },
      '*',
    );
  }

  toastr.info(`背景切换: ${getBackgroundName(backgroundUrl)}`, '', { timeOut: 2000 });
}

/**
 * 根据URL获取背景名称
 */
function getBackgroundName(url: string): string {
  for (const [name, bgUrl] of Object.entries(BACKGROUND_MAP)) {
    if (bgUrl === url) {
      return name;
    }
  }
  return '未知';
}

/**
 * 切换背景（根据名称）
 */
function changeBackground(name: string) {
  const url = BACKGROUND_MAP[name];
  if (url) {
    sendBackgroundCommand(url);
  } else {
    console.warn(`⚠️ 未找到背景: ${name}`);
    // 使用默认背景
    sendBackgroundCommand(BACKGROUND_MAP['默认']);
  }
}

/**
 * 解析消息中的 <background> 标签
 */
function parseBackgroundTag(text: string): string | null {
  const match = text.match(/<background>(.*?)<\/background>/);
  if (match) {
    const bgName = match[1].trim();
    console.log(`🏷️ 检测到background标签: ${bgName}`);
    return bgName;
  }
  return null;
}

/**
 * 自动检测地点关键词
 */
function detectBackgroundFromText(text: string): string | null {
  console.log('🔍 开始背景检测:', text);

  // 按优先级排序（更具体的关键词优先）
  const sortedBackgrounds = Object.entries(BACKGROUND_MAP).sort((a, b) => b[0].length - a[0].length);

  for (const [name, url] of sortedBackgrounds) {
    if (name === '默认') continue; // 跳过默认背景

    if (text.includes(name)) {
      console.log(`✅ 检测到地点: ${name}`);
      return name;
    }
  }

  console.log('❌ 未检测到明显地点');
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

    // 1. 优先检测 <background> 标签
    const tagBackground = parseBackgroundTag(text);
    if (tagBackground) {
      changeBackground(tagBackground);
      return;
    }

    // 2. 自动检测地点关键词
    if (AUTO_BACKGROUND_DETECTION) {
      const detectedBackground = detectBackgroundFromText(text);
      if (detectedBackground) {
        changeBackground(detectedBackground);
        return;
      }
    }
  } catch (error) {
    console.error('❌ 处理消息失败:', error);
  }
}

/**
 * 处理聊天变更事件（重置背景）
 */
function handleChatChanged(newChatId: string) {
  console.log('🔄 聊天已切换:', newChatId);

  // 重置为默认背景
  currentBackground = null;
  changeBackground('默认');
}

/**
 * 处理用户自定义背景切换
 */
function handleCustomBackgroundChange(event: MessageEvent) {
  if (!event.data || event.data.type !== 'SET_BACKGROUND') return;

  const { background } = event.data.payload;
  console.log('🎨 用户自定义背景:', background);

  if (typeof background === 'string') {
    // 如果是URL，直接使用
    if (background.startsWith('http')) {
      sendBackgroundCommand(background);
    } else {
      // 否则作为名称查找
      changeBackground(background);
    }
  }
}

// ==================== 初始化 ====================

$(() => {
  console.log('🖼️ 背景切换脚本已加载');

  try {
    // 监听AI消息接收事件
    eventOn(tavern_events.MESSAGE_RECEIVED, handleMessageReceived);
    console.log('✅ 已注册MESSAGE_RECEIVED事件监听器');

    // 监听聊天变更事件
    eventOn(tavern_events.CHAT_CHANGED, handleChatChanged);
    console.log('✅ 已注册CHAT_CHANGED事件监听器');

    // 监听自定义背景切换消息
    window.addEventListener('message', handleCustomBackgroundChange);
    console.log('✅ 已注册自定义背景切换监听器');

    // 设置初始背景
    changeBackground('默认');

    console.log('🎉 背景切换脚本初始化完成！');
    console.log('📋 配置:');
    console.log('  - 自动背景检测:', AUTO_BACKGROUND_DETECTION);
    console.log('  - 可用背景数:', Object.keys(BACKGROUND_MAP).length);
    console.log('  - 过渡时长:', TRANSITION_DURATION, 'ms');
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    toastr.error('背景切换脚本初始化失败，请检查控制台');
  }
});

// ==================== 卸载 ====================

$(window).on('pagehide', () => {
  console.log('🗑️ 背景切换脚本已卸载');
  window.removeEventListener('message', handleCustomBackgroundChange);
});

// ==================== 调试工具 ====================

// 在全局暴露调试接口
(window as any).__backgroundController = {
  changeBackground,
  getCurrentBackground: () => currentBackground,
  getAvailableBackgrounds: () => Object.keys(BACKGROUND_MAP),
  testDetection: (text: string) => {
    console.log('🧪 测试背景检测:', text);
    const result = detectBackgroundFromText(text);
    console.log('结果:', result);
    return result;
  },
  setCustomBackground: (url: string) => {
    console.log('🎨 设置自定义背景:', url);
    sendBackgroundCommand(url);
  },
};

console.log('🔧 调试工具已挂载到 window.__backgroundController');
console.log('使用示例:');
console.log('  window.__backgroundController.changeBackground("海滩")');
console.log('  window.__backgroundController.testDetection("我们去海滩吧")');
console.log('  window.__backgroundController.getAvailableBackgrounds()');
