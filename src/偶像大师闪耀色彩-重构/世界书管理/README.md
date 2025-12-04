# 世界书 AI 生卡系统

## 📚 系统概述

本系统通过 SillyTavern 的世界书功能，实现 AI 自动生成技能卡的完整流程。

### ⚠️ 重要特性：生卡系统使用独立 Bot

**⚠️ 【仅生卡系统】** 本系统使用 **`generateRaw()`** 函数而不是 `generate()`

**为什么只有生卡使用独立Bot？**

✅ **生卡系统（本模块）**：使用 `generateRaw()` - 独立Bot
- **原因**：技能卡生成需要严格遵循游戏规则和平衡性
- 完全不受用户外部预设（角色卡、人设、Jailbreak）的影响
- 完全不受用户自行添加的世界书的影响
- 确保每次生成都基于相同的提示词框架，保证质量一致性

✅ **其他系统（通信、培育、剧情）**：使用 `generate()` - 正常Bot
- **原因**：这些系统需要提供个性化体验
- 使用用户在 SillyTavern 中配置的角色卡和人设
- 使用用户自行添加的世界书（角色背景、世界观设定）
- 提供符合用户期望的对话和剧情体验

### 三大核心模块

```
┌─────────────────────────────────────────────────┐
│               AI 生卡工作流                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. 提示词区 (Order: 200, UID: 999999998)      │
│     ↓ 提供任务框架、设计原则、输出格式         │
│                                                 │
│  2. 示例卡抽取区 (Order: 250, UID: 999999900)  │
│     ↓ 智能抽取示例卡、强度参考、对比卡         │
│                                                 │
│  3. 思维链区 (Order: 300, UID: 999999999)      │
│     ↓ 引导 AI 思考过程、质量检查               │
│                                                 │
│  → AI 生成 JSON 格式技能卡                     │
│  → Zod 验证 + 存储到 IndexedDB                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🎯 模块详解

### 1️⃣ 提示词区 (`提示词区.ts`)

**功能**：提供完整的任务指令和设计框架

**核心内容**：
- 🎭 角色定位（类学园偶像大师卡牌设计师）
- 📋 任务说明（生成专属技能卡）
- 🎨 设计原则（稀有度平衡、培育计划特色、命名规范）
- 📚 示例卡说明（强度校准系统）
- ⚠️ 重要限制（禁止事项、必须包含）
- 📤 输出格式（严格 JSON 模板）

**动态变量**：
```typescript
const variables: PromptVariables = {
  characterName: '樱木真乃',
  rarity: 'SSR',
  producePlan: '感性',
  recommendedStyle: '得分型',
  theme: '舞台表演',
  exampleCards: '（由示例卡抽取区自动填充）',
};
```

**使用示例**：
```typescript
import { PromptManager, PromptMode } from './提示词区';

// 添加到世界书
await PromptManager.addPromptToWorldbook('偶像大师', PromptMode.SKILL_CARD_GENERATION, {
  characterName: '樱木真乃',
  rarity: 'SSR',
  producePlan: '感性',
  exampleCards: '...',
});
```

---

### 2️⃣ 示例卡抽取区 (`示例卡抽取区.ts`)

**功能**：智能抽取示例卡，提供强度参考

**抽取策略**：

| 目标稀有度 | 主示例卡            | 低稀有度参考      | 高稀有度对比       | 总计 |
| ---------- | ------------------- | ----------------- | ------------------ | ---- |
| **UR**     | 10张SSR（必须超越） | -                 | -                  | 10张 |
| **SSR**    | 6张SSR（设计参考）  | 2张SR（强度下限） | 2张R（提醒下限）   | 10张 |
| **SR**     | 6张SR（设计参考）   | 2张R（强度下限）  | 2张SSR（强度上限） | 10张 |
| **R**      | 6张R（设计参考）    | 2张N（强度下限）  | 2张SR（强度上限）  | 10张 |
| **N**      | 8张N（设计参考）    | -                 | 2张R（强度上限）   | 10张 |

**核心功能**：
```typescript
// 1. 抽取示例卡
const result = ExampleCardSelector.selectExampleCards({
  targetRarity: 'SSR',
  targetPlan: '感性',
  targetAttribute: 'Vocal', // 可选
});

// 2. 格式化为Markdown（添加到世界书）
const markdown = ExampleCardSelector.formatAsMarkdown(result, 'SSR');

// 3. 添加到世界书
await ExampleCardSelector.addExampleCardsToWorldbook('偶像大师', {
  targetRarity: 'SSR',
  targetPlan: '感性',
});
```

**强度校准原则**：
- ✅ **主示例卡**：学习命名、格式、机制设计
- ⚠️ **低稀有度参考**：确保你的设计明显更强
- 🔺 **高稀有度对比**：确保不会过强或失衡
- 🚀 **UR特殊规则**：必须在数值/机制/协同性三方面超越SSR

---

### 3️⃣ 思维链区 (`思维链区.ts`)

**功能**：引导 AI 自主思考，确保生成质量

**思考问题清单**（18个核心问题）：
1. 模式确认
2. 输出格式
3. 角色信息提取
4. 卡牌主题
5. 成本平衡
6. 示例学习
7. 命名设计
8. 效果设计
9. 质量检查
10. 最终确认

**使用示例**：
```typescript
import { ChainOfThoughtManager, ChainOfThoughtMode } from './思维链区';

// 添加到世界书
await ChainOfThoughtManager.addChainToWorldbook(
  '偶像大师',
  ChainOfThoughtMode.SKILL_CARD_GENERATION,
);
```

---

## 🚀 完整使用流程

### 步骤 1：初始化世界书
```typescript
import { WorldbookService, getAIAssistant } from './世界书管理';

// 方法1：使用 WorldbookService（推荐）
await WorldbookService.initializeWorldbook();

// 方法2：使用 AI 生成助手
const assistant = getAIAssistant();
await assistant.initialize();
```

### 步骤 2：生成技能卡（简化方式）
```typescript
import { generateSkillCard } from './世界书管理';

// 用户点击"生成技能卡"按钮
const result = await generateSkillCard({
  characterName: '樱木真乃',
  rarity: 'SSR',
  producePlan: '感性',
  recommendedStyle: '得分型', // 可选
  theme: '闪耀舞台', // 可选
  streaming: true, // 可选，默认true
});

if (result.success) {
  console.log('生成成功！', result.skillCard);
  // 存储到 IndexedDB
  await saveSkillCardToDatabase(result.skillCard);
} else {
  console.error('生成失败：', result.error);
}
```

### 步骤 3：高级用法（手动控制流程）
```typescript
import { WorldbookService, ExampleCardSelector, PromptManager } from './世界书管理';
import { getProducePlanMechanicMarkdown } from './世界书管理';

// 1. 准备游戏机制说明
const mechanicExplanation = getProducePlanMechanicMarkdown('感性');

// 2. 准备提示词变量
const promptVariables = {
  characterName: '樱木真乃',
  rarity: 'SSR',
  producePlan: '感性',
  recommendedStyle: '得分型',
  theme: '闪耀舞台',
  producePlanMechanic: mechanicExplanation, // 自动填充游戏机制
};

// 3. 准备示例卡配置
const exampleConfig = {
  targetRarity: 'SSR',
  targetPlan: '感性',
};

// 4. 准备世界书
await WorldbookService.prepareSkillCardGeneration(promptVariables, exampleConfig);

// 5. 调用AI生成（使用通信系统）
// ... 自定义生成逻辑 ...

// 6. 清理
await WorldbookService.cleanup();
```

---

## 📊 强度平衡系统

### 稀有度效果强度参考表

| 稀有度 | 成本 | 得分效果 | 属性Buff | 持续时间 | 强度定位            |
| ------ | ---- | -------- | -------- | -------- | ------------------- |
| N      | 1-2  | +5~10    | 5%       | 单次     | 基础卡              |
| R      | 2-3  | +10~20   | 10%      | 1回合    | 必须强于N，弱于SR   |
| SR     | 3-4  | +20~40   | 15-20%   | 2-3回合  | 必须强于R，弱于SSR  |
| SSR    | 4-5  | +40~80   | 25-35%   | 全场     | 核心卡牌            |
| UR     | 5-6  | +100+    | 50%+     | 改变规则 | **必须超越SSR示例** |

### UR 卡特殊要求
生成 UR 卡时，系统会提供 10 张 SSR 卡作为参考，AI **必须在以下三方面超越**：

1. **数值强度**：至少提升 30-50%
2. **独特机制**：SSR 没有的特殊效果
3. **计划协同**：与培育计划深度绑定的增益

---

## 🎨 培育计划特色

| 计划     | 核心特色         | 典型效果                     |
| -------- | ---------------- | ---------------------------- |
| **感性** | 得分、光环、情绪 | 高得分、团队增益、情绪稳定   |
| **理性** | 属性、资源、稳定 | 属性提升、资源优化、稳定输出 |
| **非凡** | 爆发、风险、极限 | 高爆发、风险收益、极限操作   |
| **自由** | 灵活、选择、适应 | 多种选择、适应性强、灵活应对 |

---

## 📝 输出格式

AI 必须严格输出以下 JSON 格式：

```json
{
  "id": "mano_ssr_exclusive",
  "nameJP": "輝きのステージ",
  "nameCN": "闪耀舞台",
  "type": "主动",
  "rarity": "SSR",
  "cost": 4,
  "producePlan": "感性",
  "effect": "得分+50｜得分+50\nボーカルバフ+30%（3ターン）｜歌唱Buff+30%（3回合）",
  "effectEnhanced": "得分+80｜得分+80\nボーカルバフ+40%（全場）｜歌唱Buff+40%（全场）",
  "isExclusive": true,
  "exclusiveCharacter": "樱木真乃"
}
```

---

## 🔧 高级功能

### 自定义思维链/提示词
系统支持从全局变量读取自定义模板：

```typescript
// 自定义思维链
replaceVariables(
  { chain_of_thought_skill_card_generation: '你的自定义思维链...' },
  { type: 'global' },
);

// 自定义提示词
replaceVariables(
  { prompt_template_skill_card_generation: '你的自定义提示词...' },
  { type: 'global' },
);
```

### 检查条目是否存在
```typescript
// 检查思维链
const hasChain = ChainOfThoughtManager.chainExistsInWorldbook('偶像大师');

// 检查提示词
const hasPrompt = PromptManager.promptExistsInWorldbook('偶像大师');
```

---

## 🎯 最佳实践

1. **生成前准备**：
   - ✅ 初始化世界书三大模块
   - ✅ 确保技能卡数据库已加载
   - ✅ 准备角色信息（名称、稀有度、计划）

2. **生成过程**：
   - ✅ 动态抽取示例卡
   - ✅ 填充提示词变量
   - ✅ 更新世界书条目
   - ✅ 调用 SillyTavern 生成
   - ✅ 流式接收 AI 输出

3. **生成后处理**：
   - ✅ Zod 验证 JSON 格式
   - ✅ 存储到 IndexedDB
   - ✅ 清理临时世界书条目（可选）
   - ✅ 更新 UI 显示

---

## 📦 文件结构

```
世界书/
├── 思维链区.ts         # 思维链管理（UID: 999999999, Order: 300）
├── 提示词区.ts         # 提示词框架（UID: 999999998, Order: 200）
├── 示例卡抽取区.ts     # 示例卡智能抽取（UID: 999999900, Order: 250）
└── README.md          # 本文档
```

---

## 🚨 注意事项

1. **UID 冲突**：三大模块使用固定 UID，确保不与其他世界书条目冲突
2. **Order 顺序**：提示词(200) → 示例卡(250) → 思维链(300)，不要修改
3. **变量替换**：提示词中的 `{{变量名}}` 必须在添加到世界书前替换
4. **UR 卡生成**：特别注意强度校准，必须超越所有 SSR 示例
5. **清理条目**：长期运行建议定期清理未使用的示例卡条目

---

## 📖 相关文档

- [技能卡库](../src/偶像大师闪耀色彩-重构/战斗/README.md)
- [AI 生卡系统实现方案](../项目进度记录/AI生卡系统实现方案.md)
- [战斗系统实现方案](../项目进度记录/战斗系统实现方案.md)

