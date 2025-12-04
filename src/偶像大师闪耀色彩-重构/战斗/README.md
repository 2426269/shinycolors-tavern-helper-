# 战斗系统 - 技能卡库

## 📚 概述

本模块基于**学园偶像大师**的技能卡系统，提供完整的技能卡数据库和管理服务。

> **⚠️ 重要说明**: 技能卡的获取是一个**渐进式培育过程**，而不是随机分配！
>
> - P卡自带 **1张专属技能卡**
> - 回忆卡提供 **4张技能卡**（根据类型决定获取时机）
> - 通过**训练、授课、比赛**等培育活动逐步获得更多技能卡
>
> 详见：[获取途径说明.md](./获取途径说明.md)

### 数据来源

- **原始数据**: `学园偶像大师技能卡数据库.json`
- **卡牌总数**: 298张
- **培育计划**: 非凡、理性、感性、自由

### 卡牌分布

| 培育计划 | SSR | SR  | R   | N   | 合计    |
| -------- | --- | --- | --- | --- | ------- |
| **非凡** | 30  | 24  | 13  | 5   | **72**  |
| **理性** | 48  | 27  | 23  | 4   | **102** |
| **感性** | 43  | 28  | 22  | 4   | **97**  |
| **自由** | 13  | 9   | 2   | 3   | **27**  |

---

## 🎯 核心概念

### 技能卡类型

- **A (Active, 行动)**: 六边形外框，可直接获取得分的技能卡
- **M (Mental, 精神)**: 圆形外框，仅提供加成效果的技能卡
- **T (Trap, 陷阱)**: 方形外框，仅提供负面效果的技能卡

### 稀有度

- **N**: 基础卡（包括陷阱卡）
- **R**: 稀有卡
- **SR**: 超稀有卡
- **SSR**: 特超稀有卡

### 强化系统

- 每张技能卡可以进行**一次强化**，提升效果或降低消耗
- 强化后的卡显示 `+` 标记
- 陷阱卡不可强化

---

## 🚀 使用方法

### 1. 导入模块

```typescript
import {
  // 类型
  SkillCard,
  SkillCardRarity,
  ProducePlan,

  // 数据
  SKILL_CARD_LIBRARY,
  getAllSkillCards,
  SKILL_CARD_STATS,

  // 服务
  getSkillCardsByPlan,
  getSkillCardsByRarity,
  filterSkillCards,
  enhanceSkillCard,
} from '../战斗';
```

### 2. 获取技能卡

#### 按培育计划获取

```typescript
import { getSkillCardsByPlan } from '../战斗';

// 获取非凡计划的所有技能卡
const anomalyCards = getSkillCardsByPlan('非凡');

// 获取理性计划的所有技能卡
const logicCards = getSkillCardsByPlan('理性');
```

#### 按稀有度获取

```typescript
import { getSkillCardsByRarity } from '../战斗';

// 获取所有SSR卡
const ssrCards = getSkillCardsByRarity('SSR');

// 获取理性计划的SSR卡
const logicSSR = getSkillCardsByRarity('SSR', '理性');
```

#### 筛选技能卡

```typescript
import { filterSkillCards } from '../战斗';

// 筛选：理性计划的SSR和SR卡
const cards = filterSkillCards({
  plan: '理性',
  rarity: ['SSR', 'SR'],
});

// 筛选：包含"元気"关键词的卡
const energyCards = filterSkillCards({
  keyword: '元気',
});

// 筛选：已强化的行动类卡牌
const enhancedActiveCards = filterSkillCards({
  cardType: 'A',
  enhanced: true,
});
```

### 3. 获取培育事件奖励

**重要**: 技能卡不是随机分配的，而是通过培育过程逐步获取！

```typescript
import { getProduceEventReward } from '../战斗';

// 训练完成后获取奖励
const trainingResult = getProduceEventReward(
  '训练_Vocal',  // 事件类型
  '感性',        // 培育计划
  'Perfect',     // 评价等级
);

console.log('获得的技能卡:', trainingResult.acquiredSkillCardIds);
console.log('获得的P饮料:', trainingResult.acquiredPDrinkIds);
```

### 4. 构建培育卡组

```typescript
import { buildInitialDeck, getFullDeck } from '../战斗';

// 构建初始卡组（P卡专属 + 回忆卡提供 + 基础卡）
const deckSource = buildInitialDeck(
  'mano_ssr_001',  // P卡ID
  ['support_001', 'support_002'],  // 回忆卡ID列表
  '感性',  // 培育计划
);

// 获取完整卡组
const fullDeck = getFullDeck(deckSource);
console.log(`当前卡组: ${fullDeck.length} 张卡`);
```

详见：[获取途径说明.md](./获取途径说明.md)

### 5. 强化技能卡

```typescript
import { enhanceSkillCard, getSkillCardEffect } from '../战斗';

// 强化一张卡
const card = getSkillCardById('理性_1');
const enhancedCard = enhanceSkillCard(card);

// 获取当前效果（强化前/强化后）
const effect = getSkillCardEffect(enhancedCard);
console.log(effect); // 显示强化后的效果
```

### 6. 检查是否可以使用

```typescript
import { canUseSkillCard } from '../战斗';

const card = getSkillCardById('感性_1');

const canUse = canUseSkillCard(card, {
  energy: 10,    // 当前元气
  stamina: 20,   // 当前体力
  goodImpression: 5, // 好印象
});

console.log(canUse); // true/false
```

---

## 📖 数据结构

### SkillCard 接口

```typescript
interface SkillCard {
  id: string;                  // 卡牌ID（如 "理性_1"）
  name: string;                // 卡牌名称
  rarity: SkillCardRarity;     // 稀有度
  plan: ProducePlan;           // 所属培育计划
  cardType: 'A' | 'M' | 'T';   // 卡牌类型
  cost: string;                // 消耗成本
  effect_before: string;       // 强化前效果
  effect_after: string;        // 强化后效果
  enhanced?: boolean;          // 是否已强化
  isExclusive?: boolean;       // 是否为专属技能卡
  bindingCardId?: string;      // 绑定的P卡ID
}
```

---

## 🎮 实战示例

### 完整的培育流程

```typescript
import {
  buildInitialDeck,
  getProduceEventReward,
  addAcquiredSkillCard,
  unlockMidtermSupportCardSkills,
  getFullDeck,
  type ProducePlan,
} from '../战斗';

// 1. 初始化培育
const plan: ProducePlan = '理性';
let deckSource = buildInitialDeck(
  'hiori_ssr_001',  // P卡ID
  ['support_001', 'support_002'],  // 回忆卡ID
  plan,
);

console.log(`初始卡组: ${getFullDeck(deckSource).length} 张卡`);

// 2. 培育过程 - 训练
const trainingResult = getProduceEventReward('训练_Vocal', plan, 'Perfect');
trainingResult.acquiredSkillCardIds?.forEach(id => {
  deckSource = addAcquiredSkillCard(deckSource, id);
});

// 3. 期中比赛
const midtermResult = getProduceEventReward('期中比赛', plan, 'Great');
midtermResult.acquiredSkillCardIds?.forEach(id => {
  deckSource = addAcquiredSkillCard(deckSource, id);
});

// 4. 解锁期中后型回忆卡的技能
deckSource = unlockMidtermSupportCardSkills(deckSource, ['support_002']);

console.log(`最终卡组: ${getFullDeck(deckSource).length} 张卡`);
```

### 战斗中使用技能卡

```typescript
import { getSkillCardEffect, canUseSkillCard, parseCost } from '../战斗';

function useCard(card: SkillCard, resources: { energy: number; stamina: number }) {
  // 检查是否可以使用
  if (!canUseSkillCard(card, resources)) {
    console.log('资源不足，无法使用此卡');
    return;
  }

  // 获取当前效果
  const effect = getSkillCardEffect(card);
  console.log(`使用技能卡: ${card.name}`);
  console.log(`效果: ${effect}`);

  // 扣除成本
  const cost = parseCost(card.cost);
  if (effect.includes('体力消費')) {
    resources.stamina -= cost;
  } else if (cost > 0) {
    resources.energy -= cost;
  }

  // 应用效果（由战斗系统处理）
  // ...
}
```

---

## 🔧 高级功能

### 创建专属技能卡

```typescript
import type { SkillCard } from '../战斗';

// 为P卡创建专属技能卡（通过AI生成）
function createExclusiveSkillCard(
  pCardId: string,
  name: string,
  rarity: SkillCardRarity,
  plan: ProducePlan,
  effect_before: string,
  effect_after: string,
): SkillCard {
  return {
    id: `exclusive_${pCardId}_${Date.now()}`,
    name,
    rarity,
    plan,
    cardType: 'A', // 或根据效果判断
    cost: '0',
    effect_before,
    effect_after,
    enhanced: false,
    isExclusive: true,
    bindingCardId: pCardId,
  };
}

// 示例：为樱木真乃的UR卡生成专属技能卡
const manoExclusiveCard = createExclusiveSkillCard(
  'mano_ur_1',
  '笑顔の力',
  'SSR',
  '感性',
  '好調3ターン 集中+3 ※レッスン中1回',
  '好調5ターン 集中+5 ※レッスン中1回',
);
```

### 卡组管理

```typescript
import type { Deck } from '../战斗';

function createDeck(name: string, plan: ProducePlan, cards: SkillCard[]): Deck {
  return {
    id: `deck_${Date.now()}`,
    name,
    plan,
    cards,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// 保存到localStorage
function saveDeck(deck: Deck) {
  const decks = JSON.parse(localStorage.getItem('my_decks') || '[]');
  decks.push(deck);
  localStorage.setItem('my_decks', JSON.stringify(decks));
}
```

---

## 📊 统计信息

查看技能卡库的统计信息：

```typescript
import { SKILL_CARD_STATS } from '../战斗';

console.log('技能卡库统计:');
console.log(`总卡数: ${SKILL_CARD_STATS.total}`);
console.log('按稀有度:', SKILL_CARD_STATS.byRarity);
console.log('按培育计划:', SKILL_CARD_STATS.byPlan);
```

输出示例：

```
技能卡库统计:
总卡数: 298
按稀有度: { N: 12, R: 65, SR: 88, SSR: 134 }
按培育计划: { 非凡: 72, 理性: 102, 感性: 97, 自由: 27 }
```

---

## 🎨 效果标签说明

技能卡效果中常见的标签：

### 属性相关

- `元気+N` - 增加元气
- `やる気+N` - 增加干劲
- `好印象+N` - 增加好印象
- `集中+N` - 增加集中
- `全力値+N` - 增加全力值

### Buff相关

- `好調Nターン` - 好调状态持续N回合
- `絶好調Nターン` - 绝好调状态持续N回合
- `消費体力減少Nターン` - 体力消耗减少持续N回合
- `スキルカード使用数追加+N` - 增加N次技能卡使用次数

### 参数相关

- `パラメータ+N` - 直接增加分数
- `パラメータ+N（M回）` - 分M次增加N点分数

### 特殊效果

- `※レッスン中1回` - 本次训练限用1次
- `※重複不可` - 不可重复使用
- `体力消費N` - 消耗N点体力

---

## 🔮 未来扩展

### 计划中的功能

- [ ] 技能卡效果解析器（将效果文本转换为可执行代码）
- [ ] AI技能卡生成系统
- [ ] 技能卡动画系统
- [ ] 技能卡收集系统
- [ ] 卡组构筑辅助工具

---

## 📝 注意事项

1. **数据不可变性**: 直接使用 `SKILL_CARD_LIBRARY` 获取的卡牌是只读的，如需修改请先克隆
2. **专属技能卡**: 由AI生成，需要设置 `isExclusive: true` 和 `bindingCardId`
3. **成本解析**: 使用 `parseCost()` 将成本字符串转换为数值
4. **陷阱卡**: 不可强化，使用时不提供任何正面效果

---

## 🤝 贡献

如需添加新的技能卡或修改现有卡牌效果，请编辑 `学园偶像大师技能卡数据库.json` 文件。

---

**最后更新**: 2025-11-03
**版本**: v1.0.0
