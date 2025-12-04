# 🍹 P饮料系统

**P饮料** (P Drink) 是在训练、比赛中使用的道具，可以获得一定效果。

---

## 📊 数据统计

### 总览

- **总数**: 29种P饮料
- **通用饮料**: 10种
- **专属饮料**: 19种（感性5种、理性5种、非凡6种、其他3种）

### 按类型分类

| 类型     | 数量 | 说明                 |
| -------- | ---- | -------------------- |
| 通用     | 10   | 所有培育计划都可使用 |
| 感性专属 | 5    | 仅感性计划可用       |
| 理性专属 | 5    | 仅理性计划可用       |
| 非凡专属 | 6    | 仅非凡计划可用       |

### 按稀有度分类

| 稀有度 | 数量 | 说明               |
| ------ | ---- | ------------------ |
| 普通   | 12   | 基础效果，容易获得 |
| 高级   | 10   | 强力效果组合       |
| 特级   | 7    | 超强效果，稀有     |

---

## 🎯 使用方法

### 1. 导入模块

```typescript
import {
  // 类型
  PDrink,
  PDrinkType,
  PDrinkRarity,

  // 数据
  P_DRINK_DATABASE,
  P_DRINKS_BY_TYPE,
  P_DRINKS_BY_RARITY,
  P_DRINK_STATS,

  // 服务
  getAllPDrinks,
  getPDrinksByType,
  getPDrinksForPlan,
  filterPDrinks,
  getRandomPDrinks,
} from '../战斗';
```

### 2. 获取P饮料

#### 获取所有P饮料

```typescript
import { getAllPDrinks } from '../战斗';

const allDrinks = getAllPDrinks();
console.log(`共有 ${allDrinks.length} 种P饮料`);
```

#### 按类型获取

```typescript
import { getPDrinksByType } from '../战斗';

// 获取通用饮料
const commonDrinks = getPDrinksByType('通用');

// 获取感性专属饮料
const senseDrinks = getPDrinksByType('感性专属');
```

#### 按培育计划获取可用饮料

```typescript
import { getPDrinksForPlan } from '../战斗';

// 获取理性计划可用的所有饮料（通用 + 理性专属）
const logicDrinks = getPDrinksForPlan('理性');
```

#### 按稀有度获取

```typescript
import { getPDrinksByRarity } from '../战斗';

// 获取所有特级饮料
const premiumDrinks = getPDrinksByRarity('特级');
```

### 3. 筛选P饮料

```typescript
import { filterPDrinks } from '../战斗';

// 筛选：感性专属的高级饮料
const filtered = filterPDrinks({
  type: '感性专属',
  rarity: '高级',
});

// 筛选：包含"元气"关键词的饮料
const energyDrinks = filterPDrinks({
  keyword: '元气',
});

// 筛选：通用的普通和高级饮料
const commonAndHighDrinks = filterPDrinks({
  type: '通用',
  rarity: ['普通', '高级'],
});
```

### 4. 随机获取

```typescript
import { getRandomPDrinks } from '../战斗';

// 随机获取3种饮料
const random = getRandomPDrinks(3);

// 随机获取2种特级饮料
const randomPremium = getRandomPDrinks(2, { rarity: '特级' });
```

### 5. 按名称搜索

```typescript
import { getPDrinksByName } from '../战斗';

// 精确搜索
const exact = getPDrinksByName('初星水', true);

// 模糊搜索（包含"咖啡"的饮料）
const coffee = getPDrinksByName('咖啡');
```

### 6. 检查可用性

```typescript
import { isPDrinkAvailableForPlan } from '../战斗';

const drink = getPDrinkById('logic_001');
const available = isPDrinkAvailableForPlan(drink, '理性');
console.log(available); // true
```

---

## 📋 完整饮料列表

### 通用饮料 (10种)

| 中文名       | 日文名               | 稀有度 | 效果                                                                                |
| ------------ | -------------------- | ------ | ----------------------------------------------------------------------------------- |
| 初星水       | 初星水               | 普通   | 得分+10                                                                             |
| 乌龙茶       | 烏龍茶               | 普通   | 元气+7                                                                              |
| 回复饮料     | リカバリドリンク     | 普通   | 回复6点体力                                                                         |
| 混合思慕雪   | ミックススムージー   | 高级   | 将所有手牌置入弃牌堆，重新抽取等同于原手牌数的技能卡，回复2点体力                   |
| 新鲜西洋醋   | フレッシュビネガー   | 高级   | 将所有手牌进行"训练中强化"，回复3点体力                                             |
| 增幅浓缩     | ブーストエキス       | 高级   | 得分增加30%（持续3回合），"消费体力减少"层数+3，体力消费2点                         |
| 强力草药饮料 | パワフル漢方ドリンク | 高级   | 将牌堆或弃牌堆中的一张偶像固有技能卡移动到手牌，"体力消耗减少"层数+3                |
| 初星乳清蛋白 | 初星ホエイプロテイン | 高级   | "技能卡使用数追加"+1                                                                |
| 初星特制青汁 | 初星スペシャル青汁   | 特级   | 在手牌中随机"生成"一张已强化的SSR稀有度技能卡                                       |
| 特制初星浓缩 | 特製ハツボシエキス   | 特级   | 下次使用的A类技能卡额外发动一次效果（1次·1回合），体力消费2点，"消费体力增加"层数+1 |

### 感性专属饮料 (5种)

| 中文名           | 日文名               | 稀有度 | 效果                                       |
| ---------------- | -------------------- | ------ | ------------------------------------------ |
| 维生素饮料       | ビタミンドリンク     | 普通   | "好调"层数+3                               |
| 冰咖啡           | アイスコーヒー       | 普通   | "集中"层数+3                               |
| 能量爆发饮料     | スタミナ爆発ドリンク | 高级   | "绝好调"层数+1，元气+9                     |
| 严选初星玛奇朵   | 厳選初星マキアート   | 特级   | 使用后，每个出牌回合结束时，"集中"层数+1   |
| 初星增幅能量饮料 | 初星ブーストエナジー | 特级   | "绝好调"层数+2，将所有手牌进行"训练中强化" |

### 理性专属饮料 (5种)

| 中文名           | 日文名               | 稀有度 | 效果                                       |
| ---------------- | -------------------- | ------ | ------------------------------------------ |
| 路易波士茶       | ルイボスティー       | 普通   | "好印象"层数+3                             |
| 热咖啡           | ホットコーヒー       | 普通   | "有干劲"层数+3                             |
| 时尚花草茶       | おしゃれハーブティー | 高级   | 提供"好印象"层数×100%的得分，元气+3        |
| 严选初星茶       | 厳選初星ティー       | 特级   | 使用后，每个出牌回合结束时，"好印象"层数+1 |
| 严选初星混合咖啡 | 厳選初星ブレンド     | 特级   | 使用后，每个出牌回合结束时，"有干劲"层数+1 |

### 非凡专属饮料 (6种)

| 中文名         | 日文名             | 稀有度 | 效果                                                                       |
| -------------- | ------------------ | ------ | -------------------------------------------------------------------------- |
| 姜汁汽水       | ジンジャーエール   | 普通   | 坚决转化，全力值+1                                                         |
| 焙茶           | ほうじ茶           | 普通   | 温存转化，全力值+2                                                         |
| 暖心的绿茶     | ほっと緑茶         | 高级   | 从牌堆或弃牌堆中选择一张技能卡，将其移动至温存卡堆中，指针转化为温存二阶段 |
| 初星超级苏打水 | 初星スーパーソーダ | 特级   | 指针转化为坚决二阶段，"体力消耗减少"层数+1                                 |
| 初星精选奶茶   | 厳選初星チャイ     | 特级   | 以后，回合开始时全力值+1                                                   |
| 初星汤         | 初星湯             | 特级   | "回合数追加"层数+1，体力消费2点，"消费体力增加"层数+1                      |

---

## 💡 使用建议

### 1. 训练奖励

推荐使用 `getRecommendedPDrinks()` 来为训练奖励选择饮料：

```typescript
// 为理性计划推荐高级饮料
const rewards = getRecommendedPDrinks('理性', true);
```

### 2. 随机掉落

实现训练后的随机掉落：

```typescript
// 随机获取1种通用饮料（普通或高级）
const drop = getRandomPDrinks(1, {
  type: '通用',
  rarity: ['普通', '高级'],
});
```

### 3. 商店系统

按稀有度分类展示：

```typescript
const premium = getPDrinksByRarity('特级');
const high = getPDrinksByRarity('高级');
const common = getPDrinksByRarity('普通');
```

### 4. 按效果分类

```typescript
import { categorizePDrinksByEffect } from '../战斗';

const categories = categorizePDrinksByEffect();

console.log('直接得分:', categories.scoreBoost);
console.log('属性提升:', categories.attributeBoost);
console.log('Buff提升:', categories.buffBoost);
console.log('体力回复:', categories.staminaRecovery);
console.log('卡牌操作:', categories.cardManipulation);
console.log('特殊效果:', categories.special);
```

---

## 🎮 实战示例

### 训练奖励系统

```typescript
function getTrainingReward(
  plan: ProducePlan,
  performance: 'Perfect' | 'Clear' | 'Fail',
): PDrink[] {
  if (performance === 'Fail') {
    return []; // 失败不给饮料
  }

  const availableDrinks = getPDrinksForPlan(plan);

  if (performance === 'Perfect') {
    // Perfect评价：有机会获得高级或特级饮料
    return getRandomPDrinks(1, {
      type: [plan === '非凡' ? '非凡专属' : plan === '理性' ? '理性专属' : '感性专属', '通用'],
      rarity: ['高级', '特级'],
    });
  } else {
    // Clear评价：获得普通或高级饮料
    return getRandomPDrinks(1, {
      type: '通用',
      rarity: ['普通', '高级'],
    });
  }
}
```

### 玩家背包系统

```typescript
import type { PlayerPDrink } from '../战斗';
import { createPlayerPDrink } from '../战斗';

// 初始化背包（最多3个饮料）
const inventory: PlayerPDrink[] = [];

// 获得饮料
function acquireDrink(drink: PDrink) {
  if (inventory.length >= 3) {
    console.log('背包已满，需要丢弃一个饮料');
    return false;
  }

  inventory.push(createPlayerPDrink(drink));
  return true;
}

// 使用饮料
function useDrink(index: number) {
  if (index >= inventory.length) return;

  const playerDrink = inventory[index];
  console.log(`使用饮料: ${playerDrink.drink.nameCN}`);
  console.log(`效果: ${playerDrink.drink.effect}`);

  // 应用效果...

  // 从背包移除
  inventory.splice(index, 1);
}
```

---

## 📊 效果分类

### 直接得分类

- 初星水（得分+10）
- 增幅浓缩（得分增加30%，持续3回合）
- 时尚花草茶（提供"好印象"层数×100%的得分）

### 属性提升类

- 乌龙茶（元气+7）
- 能量爆发饮料（元气+9）
- 姜汁汽水（全力值+1）
- 焙茶（全力值+2）

### Buff增强类

- 维生素饮料（"好调"层数+3）
- 冰咖啡（"集中"层数+3）
- 路易波士茶（"好印象"层数+3）
- 热咖啡（"有干劲"层数+3）

### 体力管理类

- 回复饮料（回复6点体力）
- 混合思慕雪（回复2点体力 + 换牌）
- 新鲜西洋醋（回复3点体力 + 强化手牌）

### 卡牌操作类

- 混合思慕雪（换牌）
- 新鲜西洋醋（强化手牌）
- 强力草药饮料（搜索专属卡）
- 初星特制青汁（生成SSR卡）
- 暖心的绿茶（移动卡至温存堆）

### 特殊机制类

- 初星乳清蛋白（技能卡使用数+1）
- 特制初星浓缩（下次A卡效果翻倍）
- 非凡专属饮料（指针转化）
- 初星汤（回合数+1）

---

## 🔧 高级功能

### 推荐系统

```typescript
// 根据当前状态推荐饮料
function recommendDrink(
  plan: ProducePlan,
  currentHP: number,
  maxHP: number,
): PDrink[] {
  // 体力低于50%，推荐回复类
  if (currentHP < maxHP * 0.5) {
    return filterPDrinks({
      keyword: '回复',
    });
  }

  // 体力充足，推荐强力饮料
  return getRecommendedPDrinks(plan, true);
}
```

---

**最后更新**: 2025-11-03
**版本**: v1.0.0
**数据量**: 29种P饮料
