# 偶像大师闪耀色彩 - 通信模块

这个模块提供了与SillyTavern的消息通信功能，包括消息发送、接收、格式化、历史加载和事件监听。

## 📁 文件结构

```
通信/
├── 消息类型.ts         # 类型定义
├── 消息服务.ts         # 核心服务类
├── 消息聊天.ts         # Vue Composable
├── 事件监听.ts         # 事件监听系统
├── index.ts           # 统一导出
└── README.md          # 使用说明（本文件）
```

## 🚀 快速开始

### 1. 在 Vue 组件中使用

```vue
<template>
  <div class="chat-container">
    <!-- 消息列表 -->
    <div ref="containerRef" class="messages">
      <div v-for="message in messages" :key="message.message_id" class="message">
        <div class="message-header">
          <span class="sender">{{ message.sender }}</span>
          <span class="time">{{ message.time }}</span>
        </div>
        <div class="message-body" v-html="formatMessage(message.content)"></div>

        <!-- 显示奖励信息 -->
        <div v-if="message.metadata?.rewards" class="rewards">
          <span v-if="message.metadata.rewards.stamina">体力 +{{ message.metadata.rewards.stamina }}</span>
          <span v-if="message.metadata.rewards.love">好感度 +{{ message.metadata.rewards.love }}</span>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <textarea
        v-model="currentMessage"
        @keydown.enter.prevent="sendMessage"
        placeholder="输入消息..."
      ></textarea>
      <button @click="sendMessage" :disabled="isLoading">
        {{ isLoading ? '发送中...' : '发送' }}
      </button>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <button @click="clearMessages">清空</button>
      <button @click="exportMessages({ format: 'txt' })">导出TXT</button>
      <button @click="exportMessages({ format: 'json', includeMetadata: true })">导出JSON</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessageChat } from '../通信';

// 使用消息聊天功能
const {
  messages,
  currentMessage,
  isLoading,
  containerRef,
  sendMessage,
  clearMessages,
  formatMessage,
  exportMessages,
} = useMessageChat({
  autoLoadHistory: true, // 自动加载历史消息
});
</script>
```

### 2. 培育场景示例

```vue
<script setup lang="ts">
import { useMessageChat } from '../通信';

const {
  messages,
  currentMessage,
  sendMessage,
  addSystemMessage,
} = useMessageChat();

// 训练场景
const handleTraining = async (type: 'Vocal' | 'Dance' | 'Visual') => {
  addSystemMessage(`制作人决定进行${type}训练...`);

  await sendMessage({
    userInput: `进行${type}训练`,
    scene: 'training', // 自动配置训练场景的世界书
    enableStream: true, // 启用流式传输
    onStreamUpdate: (text) => {
      console.log('流式更新:', text);
    },
    onSuccess: (response) => {
      console.log('训练完成:', response);
      // AI回复会自动解析 <reward> 标签并应用奖励
    },
  });
};

// 自由活动场景
const handleActivity = async (location: string) => {
  await sendMessage({
    userInput: `和偶像一起去${location}`,
    scene: 'activity', // 自动配置活动场景的世界书
  });
};
</script>
```

### 3. 直接使用 MessageService

```typescript
import { MessageService } from '../通信';

// 发送消息
const aiResponse = await MessageService.sendMessage({
  userInput: '你好',
  scene: 'normal',
  onSuccess: (response) => console.log('AI回复:', response),
  onError: (error) => console.error('发送失败:', error),
});

// 加载历史消息
const history = await MessageService.loadHistoryMessages({
  messageRange: '0-10', // 加载前10条
  filterRole: 'assistant', // 只加载AI消息
  limit: 5, // 限制5条
});

// 格式化消息
const formatted = MessageService.formatMessage('**粗体** 和 `代码`', {
  enableMarkdown: true,
  enableRewardParsing: true, // 移除 <reward> 标签
});
```

## 🎧 事件监听系统

### 初始化事件监听

```typescript
import { initializeEventListeners, cleanupEventListeners } from '../通信';

// 在应用启动时初始化
$(() => {
  initializeEventListeners();
  console.log('✅ 通信系统已启动');
});

// 在应用卸载时清理
$(window).on('pagehide', () => {
  cleanupEventListeners();
});
```

### 监听的事件

事件监听系统会自动监听以下SillyTavern事件：

1. **MESSAGE_RECEIVED** - AI消息接收
   - 自动解析 `<reward>` 标签并应用奖励
   - 自动解析 `<emotion>` 标签并触发动画
   - 自动解析 `<background>` 标签并切换背景

2. **CHAT_CHANGED** - 聊天切换
   - 通知主页面重新加载培育状态

3. **CHARACTER_CHANGED** - 角色切换
   - 通知主页面更新显示的偶像

4. **GENERATION_STARTED/ENDED** - AI生成开始/结束
   - 通知主页面显示加载状态

### 接收事件消息

在Vue组件中监听通信系统发出的消息：

```typescript
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  window.addEventListener('message', handleMessage);
});

onUnmounted(() => {
  window.removeEventListener('message', handleMessage);
});

function handleMessage(event: MessageEvent) {
  switch (event.data.type) {
    case 'REWARDS_APPLIED':
      console.log('奖励已应用:', event.data.payload);
      // 刷新UI显示
      break;

    case 'PLAY_EMOTION_ANIMATION':
      console.log('播放表情动画:', event.data.payload.emotion);
      // 触发Spine动画
      break;

    case 'CHANGE_BACKGROUND':
      console.log('切换背景:', event.data.payload.background);
      // 切换背景图片
      break;

    case 'CHAT_CHANGED':
      console.log('聊天已切换:', event.data.payload.chatId);
      // 重新加载状态
      break;
  }
}
```

## 📋 AI消息标签规范

### 奖励标签

```xml
<reward>{"stamina": 5, "love": 2, "vo": 10}</reward>
```

支持的奖励字段：
- `stamina` - 体力变化
- `love` - 好感度变化
- `vo` - Vocal属性变化
- `da` - Dance属性变化
- `vi` - Visual属性变化
- `gems` - 羽石变化（全局）
- `fans` - 粉丝变化（全局）

### 表情标签

```xml
<emotion>happy</emotion>
```

常用表情：`happy`, `sad`, `surprise`, `shy`, `angry`, `confused`

### 背景标签

```xml
<background>beach</background>
```

常用背景：`beach`, `library`, `cafe`, `studio`, `dance_room`, `office`

### 地点标签

```xml
<location>海滩</location>
```

## 🎯 场景类型

消息服务支持以下场景类型，会自动配置对应的世界书：

- `training` - 训练场景
- `activity` - 自由活动场景
- `ending` - 结局场景
- `skill_generation` - 技能卡生成场景
- `normal` - 普通对话场景
- `battle` - 战斗场景

## 🔧 高级用法

### 流式传输

```typescript
await sendMessage({
  userInput: '讲个故事吧',
  enableStream: true,
  onStreamUpdate: (text) => {
    // 实时更新UI显示流式文本
    console.log('流式更新:', text);
  },
  onSuccess: (finalText) => {
    console.log('完整文本:', finalText);
  },
});
```

### 自定义消息添加

```typescript
const { addSystemMessage, addUserMessage, addAIMessage } = useMessageChat();

// 添加系统消息（不发送到AI）
addSystemMessage('游戏开始！');

// 添加用户消息（不发送到AI）
addUserMessage('我选择攻击');

// 添加AI消息（不发送请求）
addAIMessage('你成功击败了敌人！');
```

### 消息统计

```typescript
const { getMessageCount, getLastMessage, getLastAIMessage } = useMessageChat();

// 获取消息统计
const stats = getMessageCount();
console.log('总消息数:', stats.total);
console.log('用户消息:', stats.user);
console.log('AI消息:', stats.assistant);

// 获取最后一条消息
const last = getLastMessage();

// 获取最后一条AI消息
const lastAI = getLastAIMessage();
```

## 📤 消息导出

```typescript
// 导出为TXT
exportMessages({
  format: 'txt',
  filename: 'chat_log'
});

// 导出为JSON（包含元数据）
exportMessages({
  format: 'json',
  filename: 'chat_data',
  includeMetadata: true
});
```

## 🎨 消息格式化

```typescript
const formatted = formatMessage(content, {
  enableMarkdown: true,        // 启用Markdown
  enableCodeHighlight: true,   // 启用代码高亮
  enableQuote: true,           // 启用引用格式
  enableRewardParsing: true,   // 移除奖励标签
  enableEmotionParsing: true,  // 移除表情标签
});
```

## 🔌 与酒馆变量集成

通信系统会自动将奖励应用到酒馆变量：

- **全局变量**: `偶像大师_羽石`, `偶像大师_粉丝`
- **聊天变量**: `培育_体力`, `培育_VO`, `培育_DA`, `培育_VI`, `好感度`

## 📝 注意事项

1. **自动化处理**: 奖励、表情、背景标签会被自动解析和应用，无需手动处理
2. **流式传输**: 启用流式传输时，`onStreamUpdate` 会实时触发，适合打字机效果
3. **事件监听**: 确保在应用启动时调用 `initializeEventListeners()`
4. **资源清理**: 在应用卸载时调用 `cleanupEventListeners()` 避免内存泄漏

## 🎯 最佳实践

1. **统一使用 useMessageChat**: 在Vue组件中优先使用Composable而不是直接调用Service
2. **场景配置**: 发送消息时指定正确的 `scene` 类型，让AI生成更符合场景的回复
3. **错误处理**: 始终提供 `onError` 回调处理失败情况
4. **流式体验**: 对于长文本生成（如剧情、故事），启用流式传输提升用户体验


