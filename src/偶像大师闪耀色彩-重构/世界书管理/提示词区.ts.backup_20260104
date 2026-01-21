/**
 * 提示词区（简化版）
 * 负责为AI生成模式提供简洁明确的提示词框架
 */

/**
 * 提示词模式枚举
 */
export enum PromptMode {
  /** 技能卡生成模式 */
  SKILL_CARD_GENERATION = 'skill_card_generation',
  /** P-Lab 流派设计模式 */
  STYLE_DESIGN = 'style_design',
  /** P-Lab 流派配套卡生成模式 */
  FLOW_CARD_GEN = 'flow_card_gen',
}

/**
 * 提示词变量接口（用于动态替换）
 */
export interface PromptVariables {
  /** 角色名称 */
  characterName?: string;
  /** 卡牌稀有度 */
  rarity?: string;
  /** 培育计划 */
  producePlan?: string;
  /** 推荐打法 */
  recommendedStyle?: string;
  /** 示例卡牌列表（Markdown表格） */
  exampleCards?: string;
  /** 卡牌主题/概念 */
  theme?: string;
  /** 培育计划机制说明（Markdown格式） */
  producePlanMechanic?: string;
  /** 用户输入的灵感描述 */
  userDescription?: string;
  /** 流派定义 JSON */
  flowDefJson?: string;
  /** 角色定位（Center/启动器等） */
  rolePosition?: string;
  /** 已有机制列表（Markdown） */
  existingMechanics?: string;
}

/**
 * 提示词管理器
 */
export class PromptManager {
  /**
   * 技能卡生成提示词框架（简化版）
   */
  static getSkillCardGenerationPrompt(): string {
    return `# 为 {{characterName}} 生成 {{rarity}} 级技能卡

**培育计划**: {{producePlan}} | **打法**: {{recommendedStyle}} | **主题**: {{theme}}

---

## 📋 输出格式（词条式JSON）

**⚠️ 直接输出JSON，不要任何解释文字！**

\`\`\`json
{
  "id": "角色英文名_ssr_exclusive",
  "nameJP": "日文名",
  "nameCN": "中文名",
  "type": "主动",
  "rarity": "{{rarity}}",
  "cost": "体力消耗X",
  "producePlan": "{{producePlan}}",

  "effectEntries": [
    {
      "icon": "",
      "effect": "数值+10",
      "isConsumption": false
    }
  ],

  "effectEntriesEnhanced": [
    {
      "icon": "",
      "effect": "数值+15",
      "isConsumption": false
    }
  ],

  "restrictions": {
    "isDuplicatable": true,
    "usesPerBattle": null
  },

  "flavor": "风味文本",
  "isExclusive": true,
  "exclusiveCharacter": "{{characterName}}"
}
\`\`\`

**🚨 type字段必须是"主动"或"精神"，不得使用其他任何值！**

**🚨 UR卡不可强化：如果 rarity 是 "UR"，不要输出 effectEntriesEnhanced 字段！**

---

## 🎯 图标URL速查

| 效果类型 | 图标URL |
|---------|---------|
| 元气 | \`https://283pro.site/shinycolors/游戏图标/元气.png\` |
| 干劲 | \`https://283pro.site/shinycolors/游戏图标/干劲.png\` |
| 好印象 | \`https://283pro.site/shinycolors/游戏图标/好印象.png\` |
| 集中 | \`https://283pro.site/shinycolors/游戏图标/集中.png\` |
| 全力值 | \`https://283pro.site/shinycolors/游戏图标/全力值.png\` |
| 好调 | \`https://283pro.site/shinycolors/游戏图标/好调.png\` |
| 绝好调 | \`https://283pro.site/shinycolors/游戏图标/绝好调.png\` |
| 强气 | \`https://283pro.site/shinycolors/游戏图标/强气.png\` |
| 热意 | \`https://283pro.site/shinycolors/游戏图标/强气.png\` |
| 温存 | \`https://283pro.site/shinycolors/游戏图标/温存.png\` |
| 悠闲 | \`https://283pro.site/shinycolors/游戏图标/悠闲.png\` |
| 消费体力减少 | \`https://283pro.site/shinycolors/游戏图标/消费体力减少.png\` |
| 技能卡使用次数+1 | \`https://283pro.site/shinycolors/游戏图标/技能卡使用次数加一.png\` |
| 回合数追加 | \`https://283pro.site/shinycolors/游戏图标/回合数追加.png\` |
| 低下状态无效 | \`https://283pro.site/shinycolors/游戏图标/低下状态无效.png\` |
| 数值提升 | \`https://283pro.site/shinycolors/游戏图标/数值提升.png\` |
| 成长 | \`https://283pro.site/shinycolors/游戏图标/成长.png\` |
| 手牌 | \`https://283pro.site/shinycolors/游戏图标/手牌.png\` |
| 数值 | \`https://283pro.site/shinycolors/游戏图标/数值.png\` |
| 好印象增加量增加 | \`https://283pro.site/shinycolors/游戏图标/好印象增加量增加.png\` |
| 好印象强化 | \`https://283pro.site/shinycolors/游戏图标/好印象强化.png\` |
| 条件效果 | \`""\`（空字符串） |

---

## 🎮 当前培育计划机制（{{producePlan}}）

{{producePlanMechanic}}

**当前推荐流派：{{recommendedStyle}}**

⚠️ 技能卡效果必须围绕推荐流派的核心资源设计，避免混用其他流派资源。

---

## ⚠️ 核心规则

### 1. 命名禁忌（🔥 最重要！）
- ✅ 命名灵感来源：角色性格、卡牌主题、角色台词、故事背景
- ❌ **禁止**：从培育计划属性联想（理性→演算、非凡→挑战、感性→感动）
- ❌ **错误示例**："终点越えの演算"（"演算"从"理性"联想）

### 2. 词条格式
- ✅ effectEntries/effectEntriesEnhanced **必须非空**
- ✅ 每个词条：icon（URL或""）、effect（纯中文）、isConsumption（布尔）
- ❌ 禁止日文：パラメータ→数值、元気→元气、やる気→干劲

### 3. 卡牌类型（必须选择其一）

**主动卡（type填"主动"）**：
- 核心特征：**必须包含"数值+X"词条**
- 作用：直接提供分数，是得分的主要来源
- 典型效果：数值+10、元气+5、数值+8（全力值×200%）等
- 示例：所有包含直接得分的卡牌

**精神卡（type填"精神"）**：
- 核心特征：**不包含数值提升**，仅操作资源和状态
- 作用：调整游戏状态、积累资源、buff管理
- 典型效果：
  - 状态切换（切换至强气、全力、温存）
  - 资源获取（元气+X、全力值+X、好印象+X）
  - buff操作（好调+2回合、消费体力减少+3回合）
  - 特殊效果（技能卡使用数+1、回合数+1）
- **关键区别**：精神卡的"元气+X"、"全力值+X"等是**资源积累**，不是**最终得分**

**判断标准**：
- ✅ 有"数值+X" → 主动卡
- ✅ 无"数值+X"，只有资源/状态/buff → 精神卡

⚠️ **type字段只能是"主动"或"精神"，不要填写其他任何值！**

### 4. 限制信息
- isDuplicatable：false=不可重复，true=可重复
- usesPerBattle：1=演出限1次，null=无限制

### 5. 强度设计（🔥 UR级卡牌必读！）
- 参考示例卡的数值范围
- 明显强于低稀有度，不超过高稀有度
- ⚠️ **UR需全面超越SSR**：
  - 数值提升 30-50%（如 SSR 数值+34，UR 应 45-50）
  - **必须具备独特机制**（延时/钩子/多阶段/成长效果）
  - **禁止纯数值堆叠**（"集中+5, 数值+45" 只是 SSR 级别！）

### 5.1 🌟 UR级卡牌设计标准（关键！）

**UR 卡必须具备以下至少 2 种高级机制**：
1. **持续钩子**：此后每回合开始时/每使用一张卡时触发效果
2. **延时效果**：X回合后触发强力效果
3. **多阶段联动**：使用后触发连锁效果（A→B→C）
4. **资源联动**：消耗资源A获得资源B + 额外效果
5. **成长系统**：满足条件触发成长，最多N次
6. **全局增幅**：好调/集中增加量+25%（而非固定值）

**UR 禁止的简单设计**：
- ❌ 仅 "集中+X, 数值+Y" （这是 SSR 级别）
- ❌ 仅 "好调+X, 数值+Y" （这是 SSR 级别）
- ❌ 条件判断 + 额外数值（这只是 SSR 的复杂版）

**UR 必须像官方 UR 那样设计**：
- ✅ 王者风范：好调+3, 集中+3, 使用数+1, **此后跳过回合时若绝好调则下回合打分值+110%**
- ✅ 完美无缺：训练开始加入手牌, **好调增加量+25%**, **集中增加量+25%**
- ✅ 巅峰之作：消耗5干劲+5好调, 打分值+4(集中3倍计算), **此后3回合内回合开始时好调+2,集中+2,抽牌,使用数+1**

### 6. 🔥 复杂机制设计（重要！避免过于简单）

**SSR/UR级卡牌应具备复杂机制，不要只是简单的"数值+X"或"资源+X"！**

**常见的高级机制类型**：
1. **条件触发**：好调状态时额外数值+10、好印象6层以上时数值+15
2. **延时效果**：随后三回合内每回合结束时增加元气60%的数值
3. **持续效果**：此后每使用一张技能卡时干劲+1
4. **成长效果**：通过直接效果切换至强气状态时，数值+4（最多4次）
5. **状态联动**：切换至温存后全力值+1、切换至强气后使用M类卡数值+7
6. **使用条件**：仅处于好调状态可使用、仅好印象≥6可使用
7. **多阶段效果**：切换至强气→数值+10→下回合切换至温存

**精神卡设计参考**（不直接提分但具有战略价值）：
- 好印象增加量增加100%（3回合）
- 好印象+3，此后每使用一张技能卡干劲+1
- 温存状态下直接增加全力值后全力值+1
- 使用后5回合内回合开始时若不处于强气则切换至强气

**⚠️ 简单卡设计示例（避免）**：
- ❌ 仅"数值+20"
- ❌ 仅"好印象+5"
- ❌ 仅"切换至强气+元气+5"

**✅ 复杂卡设计示例（推荐）**：
- ✅ 数值+15，好调状态时额外+10并好调+2回合
- ✅ 好印象+4，好印象≥6时数值+15
- ✅ 切换至强气+数值+10+成长效果

---

## 📚 示例卡参考

{{exampleCards}}

---

## 🆕 新战斗引擎 DSL（可选输出）

你现在可以同时输出 \`engine_data\` 字段，让引擎直接执行卡牌效果：

### 输出格式示例
\`\`\`json
{
  "engine_data": {
    "cost": { "genki": 3 },
    "logic_chain": [
      { "do": [{ "action": "GAIN_SCORE", "value": 500 }] },
      {
        "when": { ">=": [{ "var": "player.concentration" }, 5] },
        "do": [{ "action": "GAIN_SCORE", "value": 200 }]
      }
    ]
  }
}
\`\`\`

### ⚠️ 格式规范
- 每个步骤是 \`{ when?: 条件, do: 动作数组 }\`
- 条件用 **JSON Logic** 格式（如 \`{ ">=": [{ "var": "..." }, 5] }\`）
- \`do\` 是动作数组，不是单个动作

### 可用原子动作 + 参数
| 动作 | 参数 | 说明 |
|------|------|------|
| \`GAIN_SCORE\` | \`value\`, \`value_expression\`, \`multiplier_expression\` | 获得分数（支持公式）|
| \`MODIFY_GENKI\` | \`value\`, \`value_expression\`, \`multiplier_expression\` | 体力增减（支持公式）|
| \`ADD_BUFF\` | \`buff_id\`, \`value\`, \`turns\` | 添加Buff |
| \`ADD_TAG\` | \`tag\`, \`turns\` | 添加自定义标签 |
| \`DRAW_CARD\` | \`count\` | 抽牌 |
| \`MODIFY_PLAY_LIMIT\` | \`value\` | 修改出牌次数 |
| \`MODIFY_TURN_COUNT\` | \`value\` | 修改回合数 |
| \`REGISTER_HOOK\` | \`hook_def\` | 注册持续触发 |

### 公式示例（元气+5，干劲×200%计算）
\\\`\\\`\\\`json
{
  "action": "MODIFY_GENKI",
  "value": 5,
  "multiplier_expression": { "*": [{ "var": "player.motivation" }, 0.02] }
}
\\\`\\\`\\\`

### 标准 buff_id
- 感性: \`GoodCondition\`(好调), \`ExcellentCondition\`(绝好调), \`Concentration\`(集中)
- 理性: \`Motivation\`(干劲), \`GoodImpression\`(好印象)
- 非凡: \`AlloutState\`(全力), \`ConserveState\`(温存), \`ResoluteState\`(强气)
- 通用: \`CostReduction\`(消费体力减少)

### 可用 JSON Logic 变量
\`player.genki\`, \`player.score\`, \`player.turn\`, \`player.concentration\`, \`player.motivation\`, \`player.good_impression\`, \`player.buffs.GoodCondition\`, \`current_card.tags\`...

### REGISTER_HOOK 示例（此后3回合内，使用卡时干劲+3）
\\\`\\\`\\\`json
{
  "action": "REGISTER_HOOK",
  "hook_def": {
    "id": "boost_motivation",
    "name": "干劲激励",
    "trigger": "ON_AFTER_CARD_PLAY",
    "duration_turns": 3,
    "condition": { "in": ["restore_genki", { "var": "current_card.tags" }] },
    "actions": [{ "action": "ADD_BUFF", "buff_id": "Motivation", "value": 3 }]
  }
}
\\\`\\\`\\\`

### ⚠️ Hook 有效 trigger 值（只能用这些！）
| trigger | 说明 |
|---------|------|
| \`ON_LESSON_START\` | 训练开始时 |
| \`ON_TURN_START\` | 回合开始时 |
| \`ON_BEFORE_CARD_PLAY\` | 打出卡牌前 |
| \`ON_AFTER_CARD_PLAY\` | 打出卡牌后 |
| \`ON_TURN_END\` | 回合结束时 |
| \`ON_STATE_SWITCH\` | 状态切换时 |

### ⚠️ engine_data 格式规范（必读！）
1. **禁止嵌套 when/do**：actions 是平板数组，不能包含 { when, do } 结构
2. **使用 value_expression 而非 bonus_expression**：没有 bonus_expression 这个字段
3. **分数用 value 不用 value_expression**：除非需要动态计算（如×干劲）

### 创造新机制
用 \`ADD_TAG\` + \`visuals\`：
\\\`\\\`\\\`json
{ "action": "ADD_TAG", "tag": "Anxiety", "turns": 2 }
\\\`\\\`\\\`
并在 \`visuals\` 中提供：\`{ "key": "Anxiety", "symbol": "焦", "color": "#FF6B6B", "isDebuff": true, "shortName": "焦虑", "description": "..." }\`

---

## ✅ 最终检查

1. effectEntries/effectEntriesEnhanced 非空？
2. effect字段纯中文？
3. icon URL正确或""？
4. 符合{{producePlan}}计划特色？
5. 仅输出JSON？
`;
  }

  /**
   * P-Lab 流派设计提示词
   */
  static getStyleDesignPrompt(): string {
    return `# 为《学园偶像大师》设计一个新的战斗流派

**用户灵感**: {{userDescription}}
**倾向计划**: {{producePlan}} (Sense感性/Logic理性/Anomaly非凡)

---

## 任务目标
设计一个完整的战斗流派 (FlowDef) 和核心机制 (MechanicDef)。
这个流派应该具有独特的玩法体验，并且不与官方流派冲突，而是作为子流派或独立体系存在。

---

## ⚙️ 战斗系统机制参考

### 标准 buff_id
| ID | 名称 | 效果 | 计划 |
|----|------|------|------|
| \`GoodCondition\` | 好调 | 技能卡得分量增加50% | Sense |
| \`ExcellentCondition\` | 绝好调 | 使好调的倍率额外增加 | Sense |
| \`Concentration\` | 集中 | 每层增加技能卡得分 | Sense |
| \`Motivation\` | 干劲 | 增强元气回复效果 | Logic |
| \`GoodImpression\` | 好印象 | 回合结束时获得分数 | Logic |
| \`AlloutState\` | 全力 | 全力模式 | Anomaly |
| \`ConserveState\` | 温存 | 温存模式 | Anomaly |
| \`ResoluteState\` | 强气 | 强气模式 | Anomaly |
| \`CostReduction\` | 消费体力减少 | 技能卡所需体力减少50% | 通用 |

### 可用 Action 类型
| action | 关键参数 | 说明 |
|--------|----------|------|
| \`GAIN_SCORE\` | \`value\`, \`value_expression\`, \`multiplier_expression\` | 获得分数 |
| \`MODIFY_GENKI\` | \`value\`, \`value_expression\` | 修改元气 |
| \`ADD_BUFF\` | \`buff_id\`, \`value\`, \`turns\` | 添加Buff |
| \`ADD_TAG\` | \`tag\`, \`turns\` | 添加自定义标签 |
| \`DRAW_CARD\` | \`count\` | 抽牌 |
| \`MODIFY_PLAY_LIMIT\` | \`value\` | 修改出牌次数 |
| \`REGISTER_HOOK\` | \`hook_def\` | 注册持续触发器 |

### Hook 触发器
| trigger | 说明 |
|---------|------|
| \`ON_LESSON_START\` | 训练开始时 |
| \`ON_TURN_START\` | 回合开始时 |
| \`ON_BEFORE_CARD_PLAY\` | 打出卡牌前 |
| \`ON_AFTER_CARD_PLAY\` | 打出卡牌后 |
| \`ON_TURN_END\` | 回合结束时 |
| \`ON_STATE_SWITCH\` | 状态切换时 |

### JSON Logic 变量速查表 (value_expression 可用)
| 变量路径 | 说明 |
|---------|------|
| \`player.genki\` | 当前元气 |
| \`player.stamina\` | 当前体力 |
| \`player.stamina_percent\` | 体力百分比 (0-100) |
| \`player.score\` | 当前分数 |
| \`player.concentration\` | 集中层数 |
| \`player.motivation\` | 干劲层数 |
| \`player.good_impression\` | 好印象层数 |
| \`player.all_power\` | 全力值 (0-10) |
| \`player.heat\` | 热意值 |
| \`player.buffs.GoodCondition\` | 好调层数 |
| \`player.buffs.Concentration\` | 集中层数 |
| \`player.state_switch_count\` | 状态切换次数 |
| \`turn\` | 当前回合 |
| \`max_turns\` | 总回合数 |
| \`cards_played_this_turn\` | 本回合已打出卡牌数 |

> ⚠️ **注意**：没有 \`player.max_hp\`、\`player.hp\`、\`buff.stack\` 等变量！体力相关请用 \`player.stamina\` 或 \`player.stamina_percent\`。


---

## 🎯 官方培育计划与流派机制

{{producePlanMechanic}}

## 📊 效果类型分类

{{existingMechanics}}

> **设计新流派时，考虑它是否可以作为上述某个大流派的分支（如"自残好印象"是好印象流的变种）**

---

## 核心要求
1. **机制创新**：可以发明新的 Tag 或 Buff，但必须有明确的运作逻辑。
2. **视觉统一**：为新机制设计一套视觉符号（图标/颜色）。
3. **体系化**：思考这个流派如何通过 3-5 张卡形成闭环。
4. **可实现**：机制必须能用上面的 Action 和 Hook 实现。
5. **归属明确**：如果属于某个大流派的分支，必须指定 parentCoreFlow。


## 输出格式 (仅JSON，无需其他文字)
\`\`\`json
{
  "flow": {
    "id": "英文ID (如 self_harm_style)",
    "nameCN": "中文流派名",
    "plan": "{{producePlan}}",
    "parentCoreFlow": "好调流|集中流|好印象流|干劲流|全力流|强气流|温存流|null(独立)",
    "description": "玩法简述（如何赚分、核心资源、关键时机）",
    "keyMechanics": ["mechanic_id_1", "mechanic_id_2"],
    "tags": ["tag1", "tag2"],
    "visualTheme": {
      "color": "#RRGGBB",
      "icon": "emoji或单字"
    }
  },
  "mechanics": [
    {
      "id": "mechanic_id_1",
      "name": "机制名",
      "description": "机制效果说明（必须可用上述Action实现）",
      "triggerHook": "ON_TURN_END",
      "actionTemplate": {
        "action": "GAIN_SCORE",
        "value_expression": { "*": [{ "var": "player.max_hp" }, 0.5, { "-": ["player.max_hp", { "var": "player.hp" }] }] }
      },
      "visual": {
        "symbol": "单字图标",
        "color": "#RRGGBB",
        "isDebuff": false
      }
    }
  ]
}
\`\`\`
`;
  }

  /**
   * P-Lab 流派配套卡生成提示词
   */
  static getFlowCardGenPrompt(): string {
    return `# 为流派【{{theme}}】生成配套技能卡

**角色**: {{characterName}}
**稀有度**: {{rarity}}
**定位**: {{rolePosition}} (Center/启动器/资源工/挂件)
**流派定义**:
\`\`\`json
{{flowDefJson}}
\`\`\`

**已有机制参考**:
{{existingMechanics}}

---

## 任务说明
生成一张符合该流派体系的技能卡。
必须引用流派的核心机制 (flowRefs / mechanicRefs)。

## 引擎数据要求 (engine_data)
1. **引用机制**：使用 \`ADD_TAG\` 或 \`ADD_BUFF\` 触发流派机制。
2. **视觉提示**：如果使用了新机制，必须在 \`visual_hint\` 中填入对应的视觉信息（参考流派定义）。
3. **逻辑闭环**：
   - Center (UR/SSR)：作为终结技或核心引擎，数值强大或机制独特。
   - 启动器 (SR/R)：低费，快速叠加层数或开启状态。
   - 资源工 (R)：回复体力或提供基础资源。

## 输出格式 (JSON)
\`\`\`json
{
  "display": {
    "name": "卡牌名",
    "description": "效果描述",
    "flavor": "风味文本"
  },
  "engine_data": {
    "cost": { "genki": 3 },
    "logic_chain": [ ... ]
  },
  "visual_hint": { ... }, // 如果用了新机制必填
  "flowRefs": ["流派ID"],
  "mechanicRefs": ["机制ID"]
}
\`\`\`
`;
  }

  /**
   * 替换提示词中的变量
   * @param template 提示词模板
   * @param variables 变量对象
   * @returns 替换后的提示词
   */
  static replaceVariables(template: string, variables: PromptVariables): string {
    let result = template;

    // 替换所有变量
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replaceAll(placeholder, value || '');
    });

    // 清理未替换的占位符（替换为空或默认值）
    result = result.replace(/\{\{[^}]+\}\}/g, '（未指定）');

    return result;
  }

  /**
   * 获取指定模式的提示词（直接替换变量）
   * @param mode 提示词模式
   * @param variables 变量对象
   * @returns 替换后的提示词
   */
  static getPrompt(mode: PromptMode, variables: PromptVariables): string {
    // 获取模板
    let template = '';
    switch (mode) {
      case PromptMode.SKILL_CARD_GENERATION:
        template = this.getSkillCardGenerationPrompt();
        break;
      case PromptMode.STYLE_DESIGN:
        template = this.getStyleDesignPrompt();
        break;
      case PromptMode.FLOW_CARD_GEN:
        template = this.getFlowCardGenPrompt();
        break;
      default:
        console.error(`❌ 未知的提示词模式: ${mode}`);
        return '';
    }

    // 替换变量
    return this.replaceVariables(template, variables);
  }

  /**
   * 获取指定模式的默认提示词（用于显示和恢复）
   */
  static getDefaultPrompt(mode: PromptMode): string {
    switch (mode) {
      case PromptMode.SKILL_CARD_GENERATION:
        return this.getSkillCardGenerationPrompt();
      default:
        return '';
    }
  }

  /**
   * 获取模式对应的名称
   */
  private static getModeName(mode: PromptMode): string {
    const modeNames: Record<PromptMode, string> = {
      [PromptMode.SKILL_CARD_GENERATION]: '技能卡生成提示词',
      [PromptMode.STYLE_DESIGN]: '流派设计提示词',
      [PromptMode.FLOW_CARD_GEN]: '流派配套卡生成提示词',
    };
    return modeNames[mode] || '未知模式提示词';
  }
}
