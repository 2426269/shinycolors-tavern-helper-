# 消息拦截器 - 使用文档

## 📋 概述

消息拦截器（Message Interceptor）是连接 iframe 内 Vue 应用与 SillyTavern 的通信桥梁，实现：

- ✅ 监听用户发送的消息
- ✅ 监听AI生成的回复
- ✅ 监听生成事件（开始/停止/完成）
- ✅ 向酒馆注入内容
- ✅ 触发AI生成

---

## 🚀 快速开始

### 1. 导入模块

```typescript
import { messageInterceptor } from '@/common';
```

### 2. 基本使用

```typescript
// 监听用户消息
const unsubscribe = messageInterceptor.onUserMessage((message) => {
  console.log('用户说:', message.content);

  if (message.content.includes('抽卡')) {
    // 打开抽卡界面
    openGachaUI();
  }
});

// 页面卸载时取消订阅
$(window).on('pagehide', unsubscribe);
```

---

## 📡 API 文档

### 事件监听

#### `onUserMessage(handler)`

监听用户发送的消息。

```typescript
messageInterceptor.onUserMessage((message) => {
  console.log('用户消息:', message.content);
  console.log('时间戳:', message.timestamp);
  console.log('消息ID:', message.metadata?.messageId);
});
```

**参数**：
- `message.type`: `'user'`
- `message.content`: 消息内容（字符串）
- `message.timestamp`: 时间戳
- `message.metadata`: 元数据（可选）

**返回**：取消订阅函数

---

#### `onAIMessage(handler)`

监听AI生成的回复。

```typescript
messageInterceptor.onAIMessage((message) => {
  console.log('AI回复:', message.content);

  // 解析结构化内容
  const jsonMatch = message.content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[1]);
    console.log('解析到数据:', data);
  }
});
```

**参数**：
- `message.type`: `'ai'`
- `message.content`: 消息内容
- `message.metadata.characterName`: 角色名称
- `message.metadata.swipeId`: Swipe ID

---

#### `onGeneration(handler)`

监听生成事件（开始/停止/完成）。

```typescript
messageInterceptor.onGeneration((event) => {
  if (event.type === 'started') {
    console.log('AI开始生成');
    showLoadingIndicator();
  }

  if (event.type === 'stopped') {
    console.log('AI停止生成');
    hideLoadingIndicator();
  }
});
```

**参数**：
- `event.type`: `'started' | 'stopped' | 'finished'`
- `event.timestamp`: 时间戳

---

### 向酒馆发送指令

#### `injectText(text)`

向当前对话注入文本（仅显示在UI，不发送给LLM）。

```typescript
await messageInterceptor.injectText('系统提示：抽卡成功！');
```

---

#### `appendToSystemPrompt(content)`

追加内容到系统提示词（会影响LLM生成）。

```typescript
await messageInterceptor.appendToSystemPrompt(`
当前游戏状态：
- 等级: 50
- 拥有卡牌: 120张
`);
```

---

#### `triggerGeneration(prompt?)`

触发一次AI生成。

```typescript
// 直接触发
await messageInterceptor.triggerGeneration();

// 先注入提示词再触发
await messageInterceptor.triggerGeneration('请生成一张技能卡');
```

---

### 获取酒馆信息

#### `getCurrentCharacter()`

获取当前角色卡信息。

```typescript
const character = messageInterceptor.getCurrentCharacter();
console.log('当前角色:', character?.name);
console.log('聊天ID:', character?.chatId);
```

---

#### `getCurrentChatId()`

获取当前聊天ID。

```typescript
const chatId = messageInterceptor.getCurrentChatId();
console.log('聊天ID:', chatId);
```

---

## 💡 使用场景

### 场景1：检测用户请求生成技能卡

```typescript
messageInterceptor.onUserMessage((message) => {
  if (message.content.includes('生成技能卡')) {
    // 提取参数
    const params = {
      attribute: message.content.includes('理性') ? '理性' : '感性',
      rarity: message.content.includes('SSR') ? 'SSR' : 'SR',
    };

    // 注入提示词
    const prompt = generateSkillCardPrompt(params);
    messageInterceptor.appendToSystemPrompt(prompt);
  }
});
```

---

### 场景2：解析AI生成的技能卡

```typescript
messageInterceptor.onAIMessage((message) => {
  // 尝试解析JSON
  const jsonMatch = message.content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const skillCard = JSON.parse(jsonMatch[1]);

      if (skillCard.name && skillCard.attribute) {
        // 保存到IndexedDB
        await saveSkillCard(skillCard);

        // 显示通知
        toastr.success(`新技能卡：${skillCard.name}`);
      }
    } catch (e) {
      console.warn('JSON解析失败');
    }
  }
});
```

---

### 场景3：生成时显示加载动画

```typescript
let isGenerating = false;

messageInterceptor.onGeneration((event) => {
  if (event.type === 'started') {
    isGenerating = true;
    showLoadingSpinner();
  }

  if (event.type === 'stopped' || event.type === 'finished') {
    isGenerating = false;
    hideLoadingSpinner();
  }
});
```

---

### 场景4：根据角色卡自动注入上下文

```typescript
// 监听聊天变更
eventOn(tavern_events.CHAT_CHANGED, async () => {
  const character = messageInterceptor.getCurrentCharacter();

  if (character) {
    // 加载该角色的游戏数据
    const gameData = await loadGameDataForCharacter(character.characterId);

    // 注入到系统提示词
    await messageInterceptor.appendToSystemPrompt(`
# 角色游戏数据
- 等级: ${gameData.level}
- 拥有卡牌: ${gameData.ownedCards.length}张
- 当前剧情: ${gameData.storyProgress}
    `);
  }
});
```

---

## 🔧 高级用法

### 自定义内容解析器

```typescript
function parseCustomFormat(content: string) {
  // 解析自定义格式
  // 【卡名】闪耀之心
  // 【属性】理性
  // 【消耗】5

  const pattern = /【卡名】(.+?)\n【属性】(.+?)\n【消耗】(.+?)/;
  const match = content.match(pattern);

  if (match) {
    return {
      name: match[1].trim(),
      attribute: match[2].trim(),
      cost: parseInt(match[3].trim()),
    };
  }

  return null;
}

messageInterceptor.onAIMessage((message) => {
  const parsed = parseCustomFormat(message.content);
  if (parsed) {
    console.log('解析成功:', parsed);
  }
});
```

---

## 📊 调试

### 启用详细日志

消息拦截器会自动在控制台输出日志：

- `👤 [用户消息]` - 用户发送的消息
- `🤖 [AI消息]` - AI的回复
- `⚡ [生成事件]` - 生成开始/停止事件

### 检查拦截器状态

```typescript
console.log('拦截器已初始化:', messageInterceptor);
```

---

## ⚠️ 注意事项

1. **必须在酒馆环境中运行**
   拦截器依赖 `eventOn` 和 `triggerSlash` 等酒馆助手函数。

2. **自动初始化**
   拦截器会在页面加载时自动初始化，无需手动调用 `initialize()`。

3. **取消订阅**
   建议在页面卸载时取消订阅，避免内存泄漏。

4. **异步操作**
   `injectText`、`appendToSystemPrompt` 等方法是异步的，使用时需要 `await`。

---

## 📚 相关文件

- `message-interceptor.ts` - 核心实现
- `interceptor-example.ts` - 使用示例
- `index.ts` - 模块导出

---

**更新时间**: 2025-11-02
**版本**: v1.0.0





