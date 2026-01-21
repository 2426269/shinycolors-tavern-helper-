/**
 * 提示词区（简化版）
 * 负责为AI生成模式提供简洁明确的提示词框架
 */

import type { ProducePlan } from '../战斗/类型/技能卡类型';
import {
  getEffectCategoriesMarkdown,
  getEffectsByPlanMarkdown,
  getImportantRulesMarkdown,
  getProducePlanMechanicMarkdown,
} from './游戏机制数据库';

/**
 * 提示词模式枚举
 */
export enum PromptMode {
  /** 技能卡生成模式 */
  SKILL_CARD_GENERATION = 'skill_card_generation',
  /** 技能卡修复模式 */
  SKILL_CARD_REPAIR = 'skill_card_repair',
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
  /** Buff效果列表（从游戏机制数据库动态生成） */
  buffEffectsMarkdown?: string;
  /** 效果类型分类（从游戏机制数据库动态生成） */
  effectCategoriesMarkdown?: string;
  /** 重要规则（从游戏机制数据库动态生成） */
  importantRulesMarkdown?: string;

  // T-Repair: 修复模式变量
  /** 原始卡牌 JSON */
  originalCardJson?: string;
  /** 原始 Engine Data JSON */
  originalEngineData?: string;
  /** 修复问题描述 */
  repairIssue?: string;
}

/**
 * 提示词管理器
 */
export class PromptManager {
  /**
   * NG 引擎专用技能卡生成提示词
   *
   * 机制/规则：学园偶像大师风格（display.description）
   * 文案/氛围：闪耀色彩风格（display.flavor）
   *
   * 硬要求：engine_data-first、可执行、字段完全符合 SkillCardV2
   */
  static getSkillCardGenerationPrompt(): string {
    return `# 为 {{characterName}} 生成 {{rarity}} 级技能卡

**培育计划**: {{producePlan}} | **打法**: {{recommendedStyle}} | **主题**: {{theme}}

========================
【👑 用户最高指令 (HIGHEST PRIORITY)】
========================
**用户特别要求**: "{{userDescription}}"

**执行原则**:
1. **绝对优先**: 用户的要求优先级高于所有常规设计规范
2. **无视平衡**: 如果用户要求"无限抽牌"，请使用 Hook 实现：
   \`\`\`json
   { "action": "REGISTER_HOOK", "hook_def": { "id": "infinite_draw", "trigger": "ON_TURN_START", "actions": [{ "action": "DRAW_CARD", "count": 2 }] } }
   \`\`\`
   ⚠️ **引擎没有 DRAW_CARD 上限，但单次抽过多会超出手牌容量**
3. **引擎底线**: 必须翻译为 NG 引擎支持的 AtomicAction

---

你是"战斗引擎-NG"专用的技能卡生成器。
你的输出将被程序以 SkillCardV2 + EngineDataSchema 校验并直接执行。

========================
【最高优先级：输出格式】
========================
**必须按以下格式输出（两部分缺一不可）**：

## 设计理由
- **核心概念**：[一句话描述卡牌的设计理念]
- **机制联动**：[描述各效果如何相互配合形成完整的战术逻辑]
- **强度控制**：[成本/条件/收益的平衡分析]

\`\`\`json
{
  "effectEntries": [...],
  "engine_data": {...},
  ...
}
\`\`\`

**规则**：
- 先写设计理由（Markdown），再写 JSON（代码块内）
- JSON 必须同时包含 **effectEntries**（展示层）+ **engine_data**（执行层）
- effectEntries: 词条数组，必填，用于前端渲染图标和效果
- engine_data: 引擎数据，必填，用于战斗执行
- 若无法用允许的动作/变量表达效果：只输出 { "error": "UNSUPPORTED_EFFECT" }

========================
【学习规则：示例可信度】
========================
上下文示例可能带 example_confidence:
- manual_gold: 权威示例（允许复杂动作/Hook）→ 学习完整结构（effectEntries + engine_data）
- high: 高可信自动转码示例（严格白名单动作/变量）→ 学习完整结构（effectEntries + engine_data）
- high_partial: 部分可执行示例（engine_data 不完整）→ **仅学习词条组织和 icon 选择，禁止学习 engine_data**
- low_text_only: 仅供世界观/语气参考 → 禁止学习其结构/字段

**关键**：high_partial 示例的 engine_data.partial_effects 包含无法转换的词条，你不能模仿这些"半截逻辑"。
你只能学习 manual_gold / high 的 engine_data 结构与写法。

========================
【双文体分工：不要串戏】
========================
1) effectEntries（规则文本，学园偶像大师风格）
- 必须逐条对应 engine_data（忠实翻译，不新增机制）
- 句子克制、精确，条件/持续/次数/数值明确
- 禁止台词、比喻、情绪化修辞、梗

2) flavor（氛围文本，闪耀色彩风格）
- 允许舞台感/留白/内心独白/短台词风格/同人梗（轻微）
- 但【绝对禁止】任何可执行信息：
  - 禁止数字、回合、次数、概率、层数
  - 禁止 Buff/Tag/Action 名称
  - 禁止条件句（若/当/仅在/此后/直到…）
- flavor 只能写"人"和"场景"，不能写"规则"

========================
【engine_data-first（硬规则）】
========================
- 必须先完成 engine_data，再写effectEntries，再写 flavor。
- engine_data.logic_chain: AtomicStep[]
  - 每个 step 只能包含：
    - when?: JSON Logic（可选）
    - do: AtomicAction[]（必填）
  - do[] 里只能放 AtomicAction，禁止嵌套 {when, do}。
- 若用公式：使用 value_expression / multiplier_expression（JSON Logic）。
- 禁止使用旧字段与旧格式：usesPerBattle / visuals / player.turn / 旧 SkillCard 格式

========================
【输出结构（effectEntries + engine_data + display 三必填）】
========================
{
  "id": "角色英文名_稀有度_主题",
  // ⚡【必填】严格枚举值
  "rarity": "N" | "R" | "SR" | "SSR" | "UR",
  "type": "A" | "M", // A=Active(行动/红), M=Mental(精神/蓝)
  "plan": "sense" | "logic" | "anomaly" | "感性" | "理性" | "非凡" | "自由",

  // ⚡【必填】卡牌展示信息
  "display": {
    "name": "技能卡名称（中文，必填）", // 不要使用角色卡主题名做技能卡名称
    "flavorJP": "氛围文本日语原文（必填，先写日语）",
    "flavorCN": "氛围文本中文翻译（必填，后写中文）"
  },

  // ⚡【必填】前端展示层：词条数组（带图标）
  "effectEntries": [
    { "icon": "https://283pro.site/shinycolors/游戏图标/xxx.png", "effect": "效果描述（中文）", "isConsumption": false }
  ],
  "effectEntriesEnhanced": [],  // 强化后词条（UR卡可省略）

  // ⚡【必填】执行层：引擎数据
  "engine_data": {
    "cost": { "genki": 0 },
    "logic_chain": [
      { "do": [ { "action": "GAIN_SCORE", "value": 10 } ] }
    ],
    "logic_chain_enhanced": [],
    "constraints": { "exhaust_on_play": false }
  },

  "restrictions": { "is_unique": false }
}

⚠️ 关键规则：
1. display.name、display.flavorJP、display.flavorCN 三项均为必填
2. **display.name 禁止直接照抄卡面主题名**，不要用卡面主题名做display.name
3. **仅 flavor 需要双语**：先写日语原文(flavorJP)，再写中文翻译(flavorCN)
4. **其他所有项（effectEntries、设计思路、engine_data 等）必须使用中文**
5. effectEntries 和 engine_data 缺一不可
6. effectEntries[i].effect 必须与 engine_data.logic_chain[i] 一一对应
7. icon 必须使用【游戏图标速查表】中的 URL

注意：
- "训练中限1次"语义：engine_data.constraints.exhaust_on_play = true
- "重复不可"语义：restrictions.is_unique = true

========================
【effectEntries 规则】
========================
每个词条必须包含三个字段：
- icon: 游戏图标 URL（从【游戏图标速查表】选取）
- effect: 效果描述（纯中文，简洁精确）
- isConsumption: 是否为消耗型效果（消耗体力等为 true，通常 false）

图标选择原则：
- 涉及 Buff（好印象/集中/干劲等）→ 对应 Buff 图标
- 涉及得分/数值 → 数值.png
- 涉及元气 → 元气.png
- 涉及回合/使用次数 → 对应功能图标
- 涉及状态切换（温存/强气/全力）→ 对应状态图标
- 条件效果 → 使用条件相关的 Buff 图标

【允许的 AtomicAction（严格白名单）】
========================
GAIN_SCORE, MODIFY_GENKI, MODIFY_STAMINA, ADD_BUFF, REMOVE_BUFF, ADD_TAG, REMOVE_TAG,
DRAW_CARD, MODIFY_PLAY_LIMIT, MODIFY_TURN_COUNT, REGISTER_HOOK, MOVE_CARD_TO_ZONE, EXHAUST_CARD,
PLAY_CARD_FROM_ZONE, PLAY_RANDOM_CARDS, MODIFY_BUFF_MULTIPLIER, MODIFY_ALL_CARDS,
ENSURE_BUFF_TURNS, MODIFY_BUFF_EFFECT_MULTIPLIER, ENHANCE_HAND, CREATE_CARD, REPLAY_NEXT_CARD

========================
【📝 文本输出规则（必读）】
========================
- **规则文本（必填）**：写在 \`effectEntries[].effect\`，必须严格对应 \`engine_data\` 中的动作
- **氛围文本（可选）**：写在根级 \`flavor\`，禁止出现数值/回合/概率/层数/Buff名/Action名

========================
【允许的 Hook trigger（白名单）】
========================
ON_LESSON_START, ON_TURN_START, ON_BEFORE_CARD_PLAY, ON_AFTER_CARD_PLAY, ON_TURN_END, ON_STATE_SWITCH, ON_CARD_DRAW,
ON_BEFORE_SCORE_CALC, ON_AFTER_SCORE_CALC, ON_LESSON_END, ON_TURN_SKIP, ON_CARD_ENTER_ZONE

========================
【战斗系统机制参考（硬编码）】
========================

### ⚠️ State（状态）与 Buff（增益）的区别 - 重要!
| 类型   | 特性                                     | 使用方式                        |
| ------ | ---------------------------------------- | ------------------------------- |
| State  | 互斥状态，每回合只能处于一种，切换触发 ON_STATE_SWITCH | 使用 ADD_BUFF + turns: -1      |
| Buff   | 可叠加层数和回合                         | 使用 ADD_BUFF + turns: N        |

### Anomaly 状态 (State) - 互斥，自动触发 ON_STATE_SWITCH
| ID              | 名称   | 说明                           |
| --------------- | ------ | ------------------------------ |
| \`AlloutState\`   | 全力   | 全力模式，AllPower>=10时自动进入 |
| \`ConserveState\` | 温存   | 温存模式                        |
| \`ResoluteState\` | 强气   | 强气模式                        |

> **禁止**: 不要给 State 设置 turns: 1/2/3，必须使用 turns: -1

### 标准 buff_id (Buff 可叠加)
| ID                     | 名称           | 效果                  | 计划    |
| ---------------------- | -------------- | --------------------- | ------- |
| \`GoodCondition\`        | 好调           | 技能卡得分量增加50%   | Sense   |
| \`ExcellentCondition\`   | 绝好调         | 使好调的倍率额外增加  | Sense   |
| \`Concentration\`        | 集中           | 每层增加技能卡得分    | Sense   |
| \`Motivation\`           | 干劲           | 增强元气回复效果      | Logic   |
| \`GoodImpression\`       | 好印象         | 回合结束时获得分数    | Logic   |
| \`GoodImpressionBonus\`  | 好印象效果增加 | 好印象效果增加xx%     | Logic   |
| \`AllPower\`             | 全力值         | 全力槽（0-100）       | Anomaly |
| \`Heat\`                 | 热意           | 热意机制              | Anomaly |
| \`StaminaReduction\`     | 体力消耗减少   | 技能卡所需体力减少50% | 通用    |
| \`StaminaCut\`           | 消费体力削减   | 技能卡所需体力减少N点 | 通用    |
| \`ScoreBonus\`           | 得分增加       | N层时得分增加N%       | 通用    |
| \`ScoreFinalMultiplier\` | 最终得分倍率   | 最终得分乘以倍率      | 通用    |

### 可用 Action 类型（21种）
| action                          | 关键参数                                             | 说明                          |
| ------------------------------- | ---------------------------------------------------- | ----------------------------- |
| \`GAIN_SCORE\`                    | \`value\`, \`value_expression\`, \`multiplier_expression\` | 获得分数                      |
| \`MODIFY_GENKI\`                  | \`value\`, \`value_expression\`                          | 修改元气                      |
| \`MODIFY_STAMINA\`                | \`value\`                                              | 修改体力                      |
| \`ADD_BUFF\`                      | \`buff_id\`, \`value\`, \`value_expression\`, \`turns\`, \`turns_expression\` | 添加Buff（支持动态层数/回合） |
| \`REMOVE_BUFF\`                   | \`buff_id\`, \`stacks\`                                  | 移除Buff（用于消耗）          |
| \`ADD_TAG\`                       | \`tag\`, \`turns\`                                       | 添加自定义标签                |
| \`REMOVE_TAG\`                    | \`tag\`                                                | 移除标签                      |
| \`DRAW_CARD\`                     | \`count\`                                              | 抽牌                          |
| \`MODIFY_PLAY_LIMIT\`             | \`value\`                                              | 修改出牌次数                  |
| \`MODIFY_TURN_COUNT\`             | \`value\`                                              | 修改回合数                    |
| \`REGISTER_HOOK\`                 | \`hook_def\`                                           | 注册持续触发器                |
| \`PLAY_CARD_FROM_ZONE\`           | \`zone\`, \`selector\`                                   | 从指定区域打出卡              |
| \`MOVE_CARD_TO_ZONE\`             | \`from_zone\`, \`to_zone\`, \`selector\`                   | 移动卡到区域                  |
| \`PLAY_RANDOM_CARDS\`             | \`zone\`, \`count\`, \`selector\`                          | 随机打出满足条件的卡          |
| \`EXHAUST_CARD\`                  | \`card_id\`                                            | 消耗卡牌进入除外区            |
| \`ENSURE_BUFF_TURNS\`             | \`buff_id\`, \`turns\`                                   | 确保Buff至少保持N回合         |
| \`MODIFY_BUFF_MULTIPLIER\`        | \`buff_id\`, \`multiplier\`                              | 设置Buff获得量倍率            |
| \`MODIFY_BUFF_EFFECT_MULTIPLIER\` | \`buff_id\`, \`multiplier\`                              | 设置Buff效果倍率              |
| \`ENHANCE_HAND\`                  | \`filter.type\`, \`filter.rarity\`                       | 强化手牌区卡牌                |
| \`CREATE_CARD\`                   | \`card_id\`, \`zone\`, \`position\`, \`count\`               | 在指定区域生成卡牌            |
| \`REPLAY_NEXT_CARD\`              | \`count\`                                              | 下一张卡效果额外发动N次       |

### Hook 触发器（12种）
| trigger                | 说明                     | 备注 |
| ---------------------- | ------------------------ | ---- |
| \`ON_LESSON_START\`      | 训练开始时               | |
| \`ON_TURN_START\`        | 回合开始时               | |
| \`ON_BEFORE_CARD_PLAY\`  | 打出卡牌前               | |
| \`ON_AFTER_CARD_PLAY\`   | 打出卡牌后               | |
| \`ON_BEFORE_SCORE_CALC\` | 得分计算前               | |
| \`ON_AFTER_SCORE_CALC\`  | 得分计算后               | |
| \`ON_TURN_END\`          | 回合结束时               | |
| \`ON_LESSON_END\`        | 训练结束时               | |
| \`ON_TURN_SKIP\`         | 跳过回合时               | |
| \`ON_STATE_SWITCH\`      | 状态切换时               | |
| \`ON_CARD_DRAW\`         | 抽牌时                   | |
| \`ON_CARD_ENTER_ZONE\`   | 卡牌进入区域时           | **用于 intrinsic_hooks** |

### JSON Logic 变量速查表
| 变量路径                            | 说明               |
| ----------------------------------- | ------------------ |
| \`player.genki\`                      | 当前元气           |
| \`player.stamina\`                    | 当前体力           |
| \`player.stamina_percent\`            | 体力百分比 (0-100) |
| \`player.score\`                      | 当前分数           |
| \`player.buffs.<BuffId>\`             | 指定Buff层数 (raw) |
| \`player.state_switch_count.<State>\` | 状态切换次数       |
| \`turn\`                              | 当前回合           |
| \`max_turns\`                         | 总回合数           |
| \`cards_played_this_turn\`            | 本回合已打出卡牌数 |
| \`card_id\`                           | 卡牌ID (仅限 selector) |

> **注意**：剩余回合请用公式计算：\`{ "-": [{ "var": "max_turns" }, { "var": "turn" }] }\`

========================
【Translation Rules (19条)】
========================

### Rule 1: Hook Definition
\`hook_def\` **必须**包含 \`id\` 和 \`name\`。

### Rule 2: "下回合" 效果
使用 \`REGISTER_HOOK\`：\`trigger: "ON_TURN_START"\`, \`duration_turns: 2\`, \`max_triggers: 1\`

### Rule 3: 1回合限1次
**禁止** \`max_triggers_per_turn\`。用 \`condition\`。

### Rule 4: 消耗
- Buff消耗: \`REMOVE_BUFF\` + \`stacks\`。**禁止** \`ADD_BUFF\` 负值
- 元气/体力: \`MODIFY_GENKI\`/\`MODIFY_STAMINA\` 负值

### Rule 5: 元气%
\`GAIN_SCORE\` + \`value_expression: { "*": [{ "var": "player.genki" }, 1.1] }\`

### Rule 6: 条件判断
所有 \`when\` 条件只能读 \`player.buffs.*\` (raw)，**禁止**使用 \`buffs_effective\`。

### Rule 7: "训练中限1次" (重要!)
官方"训练中限1次" = \`constraints.exhaust_on_play = true\` (使用后进入除外区)

### Rule 8: when vs condition (重要!)
- 逻辑链步骤: 使用 \`when\`
- Hook 内部条件: 使用 \`condition\`

### Rule 9: 状态切换变量
ON_STATE_SWITCH 时检测目标状态，使用 { "var": "new_state" }

### Rule 10: cost 和体力消耗
- 源数据 \`cost: "6"\` → \`engine_data.cost.genki: 6\`
- effectEntry 中的"体力消耗X" → \`{ action: "MODIFY_STAMINA", value: -X }\`

### Rule 11: 区域名称与机制 (Zone Names) - 重要!
| 区域名称          | zone值    | 核心功能                                   |
| ----------------- | --------- | ------------------------------------------ |
| 抽牌堆 (山札)     | \`deck\`    | 存放待抽取的卡牌队列                       |
| 手牌 (手札)       | \`hand\`    | 当前可打出的卡牌                           |
| 弃牌堆 (捨て札)   | \`discard\` | 已结算/丢弃的卡牌存放区                    |
| 除外区 (除外)     | \`removed\` | 永久移除出战斗循环的卡牌                   |
| 保留区 (手元)     | \`reserve\` | Anomaly专属: 进入全力状态时释放            |

### Rule 12: 按卡名过滤 (Card Name Selector)
使用 \`matchCardName\` JSON Logic 操作符匹配卡名

### Rule 13: 效果重放 (Effect Replay)
"下一张使用的技能卡效果额外发动1次" → \`REPLAY_NEXT_CARD\`

### Rule 14: 强化手牌 (Enhance Hand)
"强化手牌中的所有主动卡" → \`{ "action": "ENHANCE_HAND", "filter": { "type": "主动" } }\`

### Rule 15: 生成眠気卡 (Create Drowsy Card)
\`{ "action": "CREATE_CARD", "card_id": "trap_n_1", "zone": "hand" }\`

### Rule 16: 最后N回合条件 (包含本回合) - 重要!
"最后3回合"判断需 +1 包含当前回合:
\`{ "<=": [{ "+": [{ "-": [{ "var": "max_turns" }, { "var": "turn" }] }, 1] }, 3] }\`

### Rule 17: 使用条件 (usable_when)
"状态切换4次以上才可使用" → \`constraints.usable_when\`

### Rule 18: 固有能力 (Intrinsic Abilities) - 重要!
"移動至手牌時"、"进入手牌时" 等被动效果 → 使用 \`intrinsic_hooks\` + \`ON_CARD_ENTER_ZONE\`
- \`logic_chain\`: 打出卡牌时执行
- \`intrinsic_hooks\`: 卡牌存在于牌组时始终监听，不需要打出

### Rule 19: 禁止嵌套 REGISTER_HOOK - 重要!
\`REGISTER_HOOK.hook_def.actions[]\` 内只能放置基础 Action。
**绝对禁止**在 \`actions[]\` 内再次使用 \`REGISTER_HOOK\`！

### Rule 20: 开局入手效果 (Opening Hand)
"战斗开始时将此卡移至手牌" 使用 \`intrinsic_hooks\` + \`ON_LESSON_START\`:
\`\`\`json
{
  "engine_data": {
    "cost": { "genki": 0 },
    "logic_chain": [...],
    "intrinsic_hooks": [
      {
        "id": "开局入手",
        "name": "开局入手",
        "trigger": "ON_LESSON_START",
        "max_triggers": 1,
        "actions": [
          {
            "action": "MOVE_CARD_TO_ZONE",
            "from_zone": "deck",
            "to_zone": "hand",
            "to_zone": "hand",
            "selector": { "==": [{ "var": "card_id" }, "此卡的ID"] }
          }
          }
        ]
      }
    ]
  }
}
\`\`\`
⚠️ **注意**：\`intrinsic_hooks\` 与 \`logic_chain\` 是平级的！
- \`logic_chain\`: 卡牌被打出时执行
- \`intrinsic_hooks\`: 卡牌存在于牌组时始终监听（无需打出）

### Rule 21: 动态层数/回合 (Dynamic Stacks/Turns)
使用 \`value_expression\` 或 \`turns_expression\` 引用当前状态：
- **层数翻倍** ("增加等同于当前的层数"):
  \`{ "action": "ADD_BUFF", "buff_id": "Concentration", "value_expression": { "var": "player.buffs.Concentration" } }\`
- **回合翻倍** ("增加等同于当前的回合数"):
  \`{ "action": "ADD_BUFF", "buff_id": "GoodCondition", "turns_expression": { "var": "player.buffs.GoodCondition" } }\`

========================
【🎯 稀有度设计规范 (Rarity Guidelines)】
========================
请根据当前卡牌的稀有度 **{{rarity}}** 选择以下设计策略：

### 🌟 UR (The Legend) - 规则破坏者
- **关键词**：\`Global\` (全局), \`Growth\` (成长), \`Rule-Bend\` (改写规则)
- **强度控制**：允许明显超模。可以设计"每回合自动获得资源"、"永久改变倍率"等效果
- **设计感**：必须包含独一无二的机制（Hook）
- **必备机制**（至少 2 种）：
  1. 持续钩子（此后每回合触发）
  2. 延时效果（X回合后触发）
  3. 多阶段联动（A→B→C）
  4. 资源联动（消耗A获得B）
  5. 成长系统（满足条件触发，最多N次）
  6. 全局增幅（好调/集中增加量+25%）

### ✨ SSR (The Core) - 体系核心
- **关键词**：\`Burst\` (爆发), \`Efficiency\` (高效率), \`Conditional\` (条件)
- **强度控制**：**数值很高，但有门槛**
- **设计模版**：
  1. **高风险高回报**：消耗 40% 体力，获得大量分数
  2. **终结技**：若好调 >= 10 层，得分翻倍
  3. **资源转化**：将所有元气转化为得分（干劲流核心）

### 💠 SR (The Utility) - 战术组件
- **关键词**：\`Support\` (辅助), \`Cycle\` (循环), \`Counter\` (对策)
- **强度控制**：**数值中等，侧重功能**
- **设计模版**：
  1. **润滑剂**：0 费，抽 1 张，回 2 点元气
  2. **启动器**：开局快速叠 3 层好调，但后续无力
  3. **绝境对策**：仅在体力 < 20% 时可用，回复大量体力

### ⚪ R/N (The Filler) - 基础填充
- **关键词**：\`Basic\` (基础), \`Flat\` (平滑)
- **设计**：朴实无华的数值交换（得分+X，元气+Y）

========================
【高级机制 engine_data 示例】
========================

**1. 持续钩子（此后每回合触发）**
\`\`\`json
{ "action": "REGISTER_HOOK", "hook_def": { "id": "hook_genki_per_turn", "trigger": "ON_TURN_START", "actions": [{ "action": "MODIFY_GENKI", "value": 3 }] } }
\`\`\`

**2. 延时效果（x回合后触发）**
\`\`\`json
{ "action": "REGISTER_HOOK", "hook_def": { "id": "hook_delayed_score", "trigger": "ON_TURN_START", "delay": 2, "max_triggers": 1, "actions": [{ "action": "ADD_BUFF", "buff_id": "ScoreBonus", "value": 50, "duration": 1 }] } }
\`\`\`

**3. 条件触发（xx状态时触发）**
\`\`\`json
{ "when": { ">=": [{ "var": "player.buffs.GoodCondition" }, 1] }, "do": [{ "action": "GAIN_SCORE", "value": 15 }] }
\`\`\`

**4. 成长系统（最多3次）**
\`\`\`json
{ "action": "REGISTER_HOOK", "hook_def": { "id": "hook_state_growth", "trigger": "ON_STATE_SWITCH", "condition": { "==": [{ "var": "event.target_state" }, "ResoluteState"] }, "max_triggers": 3, "actions": [{ "action": "GAIN_SCORE", "value": 10 }] } }
\`\`\`

**5. 资源联动（消耗资源获得分数或更多资源）**
\`\`\`json
{ "do": [{ "action": "ADD_BUFF", "buff_id": "Motivation", "value": -5 }, { "action": "GAIN_SCORE", "value_expression": { "*": [{ "var": "player.buffs.Motivation" }, 2] } }] }
\`\`\`

**6. 效果翻倍/数值翻倍 (Double Buff/Value)**
"使当前的集中翻倍" = "增加等同于当前层数的集中" (ADD_BUFF 支持 value_expression)
\`\`\`json
{ "action": "ADD_BUFF", "buff_id": "Concentration", "value_expression": { "var": "player.buffs.Concentration" } }
\`\`\`

========================
【⚠️ UR 主机制硬规则（MANDATORY）】
========================

1. **主机制白名单**：UR 必须使用以下动作之一作为主机制：
   - \`REGISTER_HOOK\`（且 hook 内不能只有 DRAW_CARD/MODIFY_GENKI/MODIFY_PLAY_LIMIT）
   - \`MODIFY_BUFF_MULTIPLIER\`
   - \`MODIFY_ALL_CARDS\`
   - \`MOVE_CARD_TO_ZONE\`
   - \`PLAY_RANDOM_CARDS\`
   - \`PLAY_CARD_FROM_ZONE\`

2. **保守三件套限制**：
   - \`DRAW_CARD\`、\`MODIFY_PLAY_LIMIT\`、\`MODIFY_GENKI\` 只能作为配套/代价/润滑
   - 每张卡最多出现 1 次抽牌、1 次出牌次数变更、1 次元气恢复
   - 三者不能同时出现两种以上

3. **复杂度下限**：
   - UR 至少包含 **3 种不同 AtomicAction**
   - UR 必须至少出现 **1 个条件 when**（引用 BattleContext 变量）

========================
【🏛️ 官方 UR 机制拆解 (Official Deconstruction)】
========================
学习以下官方 UR 的设计思路，像设计师一样思考：

#### 案例 1：[传奇之星 / レジェンドスター] (Anomaly / 状态流)
- **设计意图**：将"状态切换"这一动作转化为"额外回合"这一终极资源。
- **机制核心**：
  - 监控 \`player.state_switch_count.ConserveState/ResoluteState/AlloutState\` (各状态切换次数)
  - 奖励 \`MODIFY_TURN_COUNT\` (每满足条件，回合数+1)
  - 斩杀机制使用公式计算剩余回合：
    \`\`\`json
    { "<=": [{ "-": [{ "var": "max_turns" }, { "var": "turn" }] }, 3] }
    \`\`\`
    ⚠️ **不存在 \`remaining_turns\` 变量，必须用 \`max_turns - turn\` 计算**
  - 触发 \`REGISTER_HOOK(ON_STATE_SWITCH)\` -> 最后3回合进入全力时 ScoreBonus+120%
- **启示**：UR 的强不在于加分，而在于**打破游戏规则**（如增加回合数）。

#### 案例 2：[最强表演者 / 最強パフォーマー] (Logic / 干劲流)
- **设计意图**：干劲流的核心资源是**元气**，A卡（攻击卡）以体力为代价打出"元气xx%"的得分。这张卡是极致的资源引擎——每次攻击后回复大量元气，让下一次攻击更强，超越了单纯的资源卡，成为"攻击即回蓝"的永动核心。
- **机制核心**：
  - 门槛 \`when: { ">=": [{ "var": "player.buffs.Motivation" }, 9] }\`
  - 引擎 \`REGISTER_HOOK(ON_AFTER_CARD_PLAY)\` -> 消耗体力时，元气+8（干劲效果2倍）
  - 增益 \`ADD_BUFF (buff_id: 'Motivation', value: 5)\`
- **启示**：干劲流的 UR 应围绕**元气循环**设计。

#### 案例 3：[王者风范 / 王者の風格] (Sense / 好调流)
- **设计意图**：把"跳过回合"这个负面动作变成正面收益，鼓励战术跳过。
- **机制核心**：
  - 基础增益：好调+3、集中+3、使用数+1
  - 触发 \`REGISTER_HOOK(ON_TURN_SKIP)\` -> 绝好调时爆发（ScoreBonus+110%、抽2、使用数+1）
  - 代价：延迟惩罚 \`ADD_TAG('cannot_play_cards', duration: 1)\` 2回合后触发
- **启示**：代价越重、收益越高。**延迟惩罚**是设计 UR 的好工具。

> ⚠️ **禁止行为**：
> - 不允许使用 \`remaining_turns\`（不存在）
> - 不允许使用 \`MODIFY_HP\`（应使用 \`MODIFY_STAMINA\`）
> - 不允许使用 \`OP.*\` 目标前缀（单人战斗无对手）

========================
【P7: 游戏图标速查表（effectEntries.icon 专用）】
========================
生成 effectEntries 时，请使用以下标准图标 URL：

| 效果类型 | 图标 URL |
|----------|----------|
| 元气 | https://283pro.site/shinycolors/游戏图标/元气.png |
| 干劲 | https://283pro.site/shinycolors/游戏图标/干劲.png |
| 好印象 | https://283pro.site/shinycolors/游戏图标/好印象.png |
| 集中 | https://283pro.site/shinycolors/游戏图标/集中.png |
| 全力值 | https://283pro.site/shinycolors/游戏图标/全力值.png |
| 好调 | https://283pro.site/shinycolors/游戏图标/好调.png |
| 绝好调 | https://283pro.site/shinycolors/游戏图标/绝好调.png |
| 强气 | https://283pro.site/shinycolors/游戏图标/强气.png |
| 温存 | https://283pro.site/shinycolors/游戏图标/温存.png |
| 悠闲 | https://283pro.site/shinycolors/游戏图标/悠闲.png |
| 热意 | https://283pro.site/shinycolors/游戏图标/热意.png |
| 消费体力减少 | https://283pro.site/shinycolors/游戏图标/消费体力减少.png |
| 技能卡使用次数+1 | https://283pro.site/shinycolors/游戏图标/技能卡使用次数加一.png |
| 回合数追加 | https://283pro.site/shinycolors/游戏图标/回合数追加.png |
| 数值提升 | https://283pro.site/shinycolors/游戏图标/数值提升.png |
| 成长 | https://283pro.site/shinycolors/游戏图标/成长.png |
| 手牌 | https://283pro.site/shinycolors/游戏图标/手牌.png |
| 数值 | https://283pro.site/shinycolors/游戏图标/数值.png |
| 消费体力增加 | https://283pro.site/shinycolors/游戏图标/消费体力增加.png |
| 抽牌 | https://283pro.site/shinycolors/游戏图标/手牌.png |
| 体力回复 | https://283pro.site/shinycolors/游戏图标/体力.png |
| 好调倍率 | https://283pro.site/shinycolors/游戏图标/好调.png |

> 规则：effectEntries 中的 icon 必须使用上表中的 URL，不得自创图标名称。

========================
【不确定就停】
========================
无法100%确认语义时（此后/下回合/随机/直到…为止/按比例/大幅/稍微）:
- 只实现能确定的子集，或
- 输出 { "error": "UNSUPPORTED_EFFECT" }

========================
【当前培育计划机制】
========================
{{producePlanMechanic}}

========================
【效果类型分类】
========================
{{effectCategoriesMarkdown}}

========================
【重要规则】
========================
{{importantRulesMarkdown}}

**当前推荐流派：{{recommendedStyle}}**

========================
【示例卡参考】
========================
{{exampleCards}}

========================
【最终输出要求】
========================
- 只输出一个 JSON（无多余文字）
- engine_data 必填、description 必须对应 engine_data、flavor 绝不含规则信息
`;
  }

  /**
   * 技能卡修复模式提示词
   * 包含完整的机制详解和 engine_data 规则
   */
  static getSkillCardRepairPrompt(): string {
    return `# 修复技能卡数据 (SkillCardV2)

**任务**：接收完整的 SkillCardV2 JSON，根据用户反馈仅修复 \`engine_data\` (及对应的 \`effectEntries\`)，**严格保留**其他所有字段（如 flavor, display, rarity 等）。

**原始完整卡牌数据 (SkillCardV2)**：
\`\`\`json
{{originalCardJson}}
\`\`\`

**用户反馈/修复目标**：
"{{repairIssue}}"

**执行规则 (Strict Rules)**：
1.  **最小修改原则**：只修改与修复问题相关的 \`engine_data\` 和 \`effectEntries\`。
2.  **数据保留 (Preserve Data)**：
    -   **绝对不要修改** \`display.flavorJP\`, \`display.flavorCN\`, \`display.name\` (除非用户明确要求改名/改文案)。
    -   **绝对不要修改** \`rarity\`, \`type\`, \`plan\`, \`id\`。
    -   **必须完整输出**：输出包含未修改字段在内的完整 JSON。
3.  **一致性**：如果修改了 \`engine_data\` 的逻辑，必须同步更新 \`effectEntries\` 以匹配新逻辑。

**输出格式 (SkillCardV2 Standard)**：
\`\`\`json
{
  "id": "...",
  "rarity": "...", // 保持原样
  "type": "...",   // 保持原样
  "plan": "...",   // 保持原样

  // 必须完整保留 display 对象 (含 flavor)
  "display": {
    "name": "...",
    "description": "...",
    "flavorJP": "...", // 保持原样
    "flavorCN": "..."  // 保持原样
  },

  // 仅在逻辑变更时修改此项
  "effectEntries": [ ... ],

  // 重点修复此项
  "engine_data": { ... }
}
\`\`\`

========================
【engine_data-first（硬规则）】
========================
- 必须先完成 engine_data，再写effectEntries。
- engine_data.logic_chain: AtomicStep[]
  - 每个 step 只能包含：
    - when?: JSON Logic（可选）
    - do: AtomicAction[]（必填）
  - do[] 里只能放 AtomicAction，禁止嵌套 {when, do}。
- 若用公式：使用 value_expression / multiplier_expression（JSON Logic）。
- 禁止使用旧字段与旧格式：usesPerBattle / visuals / player.turn / 旧 SkillCard 格式

========================
【允许的 AtomicAction（严格白名单）】
========================
GAIN_SCORE, MODIFY_GENKI, MODIFY_STAMINA, ADD_BUFF, REMOVE_BUFF, ADD_TAG, REMOVE_TAG,
DRAW_CARD, MODIFY_PLAY_LIMIT, MODIFY_TURN_COUNT, REGISTER_HOOK, MOVE_CARD_TO_ZONE, EXHAUST_CARD,
PLAY_CARD_FROM_ZONE, PLAY_RANDOM_CARDS, MODIFY_BUFF_MULTIPLIER, MODIFY_ALL_CARDS,
ENSURE_BUFF_TURNS, MODIFY_BUFF_EFFECT_MULTIPLIER, ENHANCE_HAND, CREATE_CARD, REPLAY_NEXT_CARD

========================
【允许的 Hook trigger（白名单）】
========================
ON_LESSON_START, ON_TURN_START, ON_BEFORE_CARD_PLAY, ON_AFTER_CARD_PLAY, ON_TURN_END, ON_STATE_SWITCH, ON_CARD_DRAW,
ON_BEFORE_SCORE_CALC, ON_AFTER_SCORE_CALC, ON_LESSON_END, ON_TURN_SKIP, ON_CARD_ENTER_ZONE
| ------ | ---------------------------------------- | ------------------------------- |
| State  | 互斥状态，每回合只能处于一种，切换触发 ON_STATE_SWITCH | 使用 ADD_BUFF + turns: -1      |
| Buff   | 可叠加层数和回合                         | 使用 ADD_BUFF + turns: N        |

### Anomaly 状态 (State) - 互斥，自动触发 ON_STATE_SWITCH
| ID              | 名称   | 说明                           |
| --------------- | ------ | ------------------------------ |
| \`AlloutState\`   | 全力   | 全力模式，AllPower>=10时自动进入 |
| \`ConserveState\` | 温存   | 温存模式                        |
| \`ResoluteState\` | 强气   | 强气模式                        |

> **禁止**: 不要给 State 设置 turns: 1/2/3，必须使用 turns: -1

### 标准 buff_id (Buff 可叠加)
| ID                     | 名称           | 效果                  | 计划    |
| ---------------------- | -------------- | --------------------- | ------- |
| \`GoodCondition\`        | 好调           | 技能卡得分量增加50%   | Sense   |
| \`ExcellentCondition\`   | 绝好调         | 使好调的倍率额外增加  | Sense   |
| \`Concentration\`        | 集中           | 每层增加技能卡得分    | Sense   |
| \`Motivation\`           | 干劲           | 增强元气回复效果      | Logic   |
| \`GoodImpression\`       | 好印象         | 回合结束时获得分数    | Logic   |
| \`GoodImpressionBonus\`  | 好印象效果增加 | 好印象效果增加xx%     | Logic   |
| \`AllPower\`             | 全力值         | 全力槽（0-100）       | Anomaly |
| \`Heat\`                 | 热意           | 热意机制              | Anomaly |
| \`StaminaReduction\`     | 体力消耗减少   | 技能卡所需体力减少50% | 通用    |
| \`StaminaCut\`           | 消费体力削减   | 技能卡所需体力减少N点 | 通用    |
| \`ScoreBonus\`           | 得分增加       | N层时得分增加N%       | 通用    |
| \`ScoreFinalMultiplier\` | 最终得分倍率   | 最终得分乘以倍率      | 通用    |

### 可用 Action 类型（21种）
| action                          | 关键参数                                             | 说明                          |
| ------------------------------- | ---------------------------------------------------- | ----------------------------- |
| \`GAIN_SCORE\`                    | \`value\`, \`value_expression\`, \`multiplier_expression\` | 获得分数                      |
| \`MODIFY_GENKI\`                  | \`value\`, \`value_expression\`                          | 修改元气                      |
| \`MODIFY_STAMINA\`                | \`value\`                                              | 修改体力                      |
| \`ADD_BUFF\`                      | \`buff_id\`, \`value\`, \`turns\`                          | 添加Buff（turns是累加回合数） |
| \`REMOVE_BUFF\`                   | \`buff_id\`, \`stacks\`                                  | 移除Buff（用于消耗）          |
| \`ADD_TAG\`                       | \`tag\`, \`turns\`                                       | 添加自定义标签                |
| \`REMOVE_TAG\`                    | \`tag\`                                                | 移除标签                      |
| \`DRAW_CARD\`                     | \`count\`                                              | 抽牌                          |
| \`MODIFY_PLAY_LIMIT\`             | \`value\`                                              | 修改出牌次数                  |
| \`MODIFY_TURN_COUNT\`             | \`value\`                                              | 修改回合数                    |
| \`REGISTER_HOOK\`                 | \`hook_def\`                                           | 注册持续触发器                |
| \`PLAY_CARD_FROM_ZONE\`           | \`zone\`, \`selector\`                                   | 从指定区域打出卡              |
| \`MOVE_CARD_TO_ZONE\`             | \`from_zone\`, \`to_zone\`, \`selector\`                   | 移动卡到区域                  |
| \`PLAY_RANDOM_CARDS\`             | \`zone\`, \`count\`, \`selector\`                          | 随机打出满足条件的卡          |
| \`EXHAUST_CARD\`                  | \`card_id\`                                            | 消耗卡牌进入除外区            |
| \`ENSURE_BUFF_TURNS\`             | \`buff_id\`, \`turns\`                                   | 确保Buff至少保持N回合         |
| \`MODIFY_BUFF_MULTIPLIER\`        | \`buff_id\`, \`multiplier\`                              | 设置Buff获得量倍率            |
| \`MODIFY_BUFF_EFFECT_MULTIPLIER\` | \`buff_id\`, \`multiplier\`                              | 设置Buff效果倍率              |
| \`ENHANCE_HAND\`                  | \`filter.type\`, \`filter.rarity\`                       | 强化手牌区卡牌                |
| \`CREATE_CARD\`                   | \`card_id\`, \`zone\`, \`position\`, \`count\`               | 在指定区域生成卡牌            |
| \`REPLAY_NEXT_CARD\`              | \`count\`                                              | 下一张卡效果额外发动N次       |

### Hook 触发器（12种）
| trigger                | 说明                     | 备注 |
| ---------------------- | ------------------------ | ---- |
| \`ON_LESSON_START\`      | 训练开始时               | |
| \`ON_TURN_START\`        | 回合开始时               | |
| \`ON_BEFORE_CARD_PLAY\`  | 打出卡牌前               | |
| \`ON_AFTER_CARD_PLAY\`   | 打出卡牌后               | |
| \`ON_BEFORE_SCORE_CALC\` | 得分计算前               | |
| \`ON_AFTER_SCORE_CALC\`  | 得分计算后               | |
| \`ON_TURN_END\`          | 回合结束时               | |
| \`ON_LESSON_END\`        | 训练结束时               | |
| \`ON_TURN_SKIP\`         | 跳过回合时               | |
| \`ON_STATE_SWITCH\`      | 状态切换时               | |
| \`ON_CARD_DRAW\`         | 抽牌时                   | |
| \`ON_CARD_ENTER_ZONE\`   | 卡牌进入区域时           | **用于 intrinsic_hooks** |

### JSON Logic 变量速查表
| 变量路径                            | 说明               |
| ----------------------------------- | ------------------ |
| \`player.genki\`                      | 当前元气           |
| \`player.stamina\`                    | 当前体力           |
| \`player.stamina_percent\`            | 体力百分比 (0-100) |
| \`player.score\`                      | 当前分数           |
| \`player.buffs.<BuffId>\`             | 指定Buff层数 (raw) |
| \`player.state_switch_count.<State>\` | 状态切换次数       |
| \`turn\`                              | 当前回合           |
| \`max_turns\`                         | 总回合数           |
| \`cards_played_this_turn\`            | 本回合已打出卡牌数 |

> **注意**：剩余回合请用公式计算：\`{ "-": [{ "var": "max_turns" }, { "var": "turn" }] }\`

========================
【Translation Rules (19条)】
========================

### Rule 1: Hook Definition
\`hook_def\` **必须**包含 \`id\` 和 \`name\`。

### Rule 2: "下回合" 效果
使用 \`REGISTER_HOOK\`：\`trigger: "ON_TURN_START"\`, \`duration_turns: 2\`, \`max_triggers: 1\`

### Rule 3: 1回合限1次
**禁止** \`max_triggers_per_turn\`。用 \`condition\`。

### Rule 4: 消耗
- Buff消耗: \`REMOVE_BUFF\` + \`stacks\`。**禁止** \`ADD_BUFF\` 负值
- 元气/体力: \`MODIFY_GENKI\`/\`MODIFY_STAMINA\` 负值

### Rule 5: 元气%
\`GAIN_SCORE\` + \`value_expression: { "*": [{ "var": "player.genki" }, 1.1] }\`

### Rule 6: 条件判断
所有 \`when\` 条件只能读 \`player.buffs.*\` (raw)，**禁止**使用 \`buffs_effective\`。

### Rule 7: "训练中限1次" (重要!)
官方"训练中限1次" = \`constraints.exhaust_on_play = true\` (使用后进入除外区)

### Rule 8: when vs condition (重要!)
- 逻辑链步骤: 使用 \`when\`
- Hook 内部条件: 使用 \`condition\`

### Rule 9: 状态切换变量
ON_STATE_SWITCH 时检测目标状态，使用 { "var": "new_state" }

### Rule 10: cost 和体力消耗
- 源数据 \`cost: "6"\` → \`engine_data.cost.genki: 6\`
- effectEntry 中的"体力消耗X" → \`{ action: "MODIFY_STAMINA", value: -X }\`

### Rule 11: 区域名称与机制 (Zone Names) - 重要!
| 区域名称          | zone值    | 核心功能                                   |
| ----------------- | --------- | ------------------------------------------ |
| 抽牌堆 (山札)     | \`deck\`    | 存放待抽取的卡牌队列                       |
| 手牌 (手札)       | \`hand\`    | 当前可打出的卡牌                           |
| 弃牌堆 (捨て札)   | \`discard\` | 已结算/丢弃的卡牌存放区                    |
| 除外区 (除外)     | \`removed\` | 永久移除出战斗循环的卡牌                   |
| 保留区 (手元)     | \`reserve\` | Anomaly专属: 进入全力状态时释放            |

### Rule 12: 按卡名过滤 (Card Name Selector)
使用 \`matchCardName\` JSON Logic 操作符匹配卡名

### Rule 13: 效果重放 (Effect Replay)
"下一张使用的技能卡效果额外发动1次" → \`REPLAY_NEXT_CARD\`

### Rule 14: 强化手牌 (Enhance Hand)
"强化手牌中的所有主动卡" → \`{ "action": "ENHANCE_HAND", "filter": { "type": "主动" } }\`

### Rule 15: 生成眠気卡 (Create Drowsy Card)
\`{ "action": "CREATE_CARD", "card_id": "trap_n_1", "zone": "hand" }\`

### Rule 16: 最后N回合条件 (包含本回合) - 重要!
"最后3回合"判断需 +1 包含当前回合:
\`{ "<=": [{ "+": [{ "-": [{ "var": "max_turns" }, { "var": "turn" }] }, 1] }, 3] }\`

### Rule 17: 使用条件 (usable_when)
"状态切换4次以上才可使用" → \`constraints.usable_when\`

### Rule 18: 固有能力 (Intrinsic Abilities) - 重要!
"移動至手牌時"、"进入手牌时" 等被动效果 → 使用 \`intrinsic_hooks\` + \`ON_CARD_ENTER_ZONE\`
- \`logic_chain\`: 打出卡牌时执行
- \`intrinsic_hooks\`: 卡牌存在于牌组时始终监听，不需要打出

### Rule 19: 禁止嵌套 REGISTER_HOOK - 重要!
\`REGISTER_HOOK.hook_def.actions[]\` 内只能放置基础 Action。
**绝对禁止**在 \`actions[]\` 内再次使用 \`REGISTER_HOOK\`！

### Rule 20: 开局入手效果 (Opening Hand)
"战斗开始时将此卡移至手牌" 使用 \`intrinsic_hooks\` + \`ON_LESSON_START\`:
\`\`\`json
{
  "engine_data": {
    "cost": { "genki": 0 },
    "logic_chain": [...],
    "intrinsic_hooks": [
      {
        "id": "开局入手",
        "name": "开局入手",
        "trigger": "ON_LESSON_START",
        "max_triggers": 1,
        "actions": [
          {
            "action": "MOVE_CARD_TO_ZONE",
            "from_zone": "deck",
            "to_zone": "hand",
            "selector": { "==": [{ "var": "originalId" }, "此卡的ID"] }
          }
        ]
      }
    ]
  }
}
\`\`\`
⚠️ **注意**：\`intrinsic_hooks\` 与 \`logic_chain\` 是平级的！
- \`logic_chain\`: 卡牌被打出时执行
- \`intrinsic_hooks\`: 卡牌存在于牌组时始终监听（无需打出）
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
      case PromptMode.SKILL_CARD_REPAIR:
        template = this.getSkillCardRepairPrompt();
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

    // 动态注入游戏机制数据库内容（仅技能卡生成模式）
    if (mode === PromptMode.SKILL_CARD_GENERATION && variables.producePlan) {
      const plan = variables.producePlan as ProducePlan;

      // 培育计划机制说明
      if (!variables.producePlanMechanic) {
        variables.producePlanMechanic = getProducePlanMechanicMarkdown(plan);
      }

      // 该计划相关 Buff 效果列表
      if (!variables.buffEffectsMarkdown) {
        variables.buffEffectsMarkdown = getEffectsByPlanMarkdown(plan);
      }

      // 效果类型分类
      if (!variables.effectCategoriesMarkdown) {
        variables.effectCategoriesMarkdown = getEffectCategoriesMarkdown();
      }

      // 重要规则
      if (!variables.importantRulesMarkdown) {
        variables.importantRulesMarkdown = getImportantRulesMarkdown();
      }
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
      case PromptMode.SKILL_CARD_REPAIR:
        return this.getSkillCardRepairPrompt();
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
      [PromptMode.SKILL_CARD_REPAIR]: '技能卡修复提示词',
      [PromptMode.STYLE_DESIGN]: '流派设计提示词',
      [PromptMode.FLOW_CARD_GEN]: '流派配套卡生成提示词',
    };
    return modeNames[mode] || '未知模式提示词';
  }

  // ==================== T-4: 世界书集成方法 ====================

  /** T-4: 提示词条目固定 UID */
  private static readonly PROMPT_UID = 999999998;

  /** T-4: 兼容不同结构的 worldbook：array / {entries: []} / {entries: {uid: entry}} */
  private static getEntries(worldbook: any): any[] {
    if (Array.isArray(worldbook)) return worldbook;
    if (Array.isArray(worldbook?.entries)) return worldbook.entries;
    if (worldbook?.entries && typeof worldbook.entries === 'object') return Object.values(worldbook.entries);
    return [];
  }

  private static setEntries(worldbook: any, entries: any[]): any {
    if (Array.isArray(worldbook)) return entries;
    if (Array.isArray(worldbook?.entries)) {
      worldbook.entries = entries;
      return worldbook;
    }
    if (worldbook?.entries && typeof worldbook.entries === 'object') {
      const obj: Record<string, any> = {};
      for (const e of entries) obj[String(e.uid)] = e;
      worldbook.entries = obj;
      return worldbook;
    }
    return entries;
  }

  /** T-4: UID 比较（兼容 string/number） */
  private static sameUid(a: any, b: any): boolean {
    return String(a) === String(b);
  }

  /**
   * T-4: 初始化提示词框架到世界书
   */
  static async initializePromptToWorldbook(worldbookName: string): Promise<void> {
    const placeholderVars: PromptVariables = {
      characterName: '（未指定角色）',
      rarity: 'UR',
      producePlan: '感性',
      recommendedStyle: '',
      theme: '',
      userDescription: '',
      exampleCards: '',
    };

    await this.addPromptToWorldbook(worldbookName, PromptMode.SKILL_CARD_GENERATION, placeholderVars);
    console.log(`🎉 提示词框架已初始化到世界书: ${worldbookName}`);
  }

  /**
   * T-4: 添加/更新提示词到世界书
   */
  static async addPromptToWorldbook(
    worldbookName: string,
    mode: PromptMode,
    variables: PromptVariables,
  ): Promise<void> {
    const promptContent = this.getPrompt(mode, variables);
    const modeName = this.getModeName(mode);

    // 读取世界书 & 取 entries（使用 globalThis 访问 ST API）
    const stApi = (globalThis as any).SillyTavern?.getContext?.() || (globalThis as any);
    const getWorldbook = stApi.getWorldbook || (() => []);
    const replaceWorldbook = stApi.replaceWorldbook || (() => {});
    const getWorldbookNames = stApi.getWorldbookNames || (() => []);
    const createWorldbook = stApi.createWorldbook || (() => {});

    // 确保世界书存在
    const worldbooks = getWorldbookNames();
    if (!worldbooks.includes(worldbookName)) {
      console.log(`📚 创建新世界书: ${worldbookName}`);
      createWorldbook(worldbookName);
    }

    const worldbookRaw = await getWorldbook(worldbookName);
    const entries = this.getEntries(worldbookRaw);

    const entryIndex = entries.findIndex((e: any) => this.sameUid(e.uid, this.PROMPT_UID));

    const entry = {
      name: `提示词框架（当前模式: ${modeName}）`,
      content: promptContent,
      uid: this.PROMPT_UID,
      enabled: true,
      strategy: {
        type: 'constant' as const,
        keys: [],
        keys_secondary: { logic: 'and_any' as const, keys: [] },
        scan_depth: 'same_as_global' as const,
      },
      position: {
        type: 'at_depth' as const,
        role: 'system' as const,
        depth: 0,
        order: 200,
      },
      probability: 100,
      recursion: { prevent_incoming: true, prevent_outgoing: true, delay_until: null },
      effect: { sticky: null, cooldown: null, delay: null },
      extra: { entry_type: 'prompt_framework', mode, current_mode: modeName },
    };

    if (entryIndex !== -1) entries[entryIndex] = entry;
    else entries.push(entry);

    replaceWorldbook(worldbookName, this.setEntries(worldbookRaw, entries));
  }

  /**
   * T-4: 从世界书移除提示词条目
   */
  static async removePromptFromWorldbook(worldbookName: string): Promise<void> {
    const stApi = (globalThis as any).SillyTavern?.getContext?.() || (globalThis as any);
    const getWorldbook = stApi.getWorldbook || (() => []);
    const replaceWorldbook = stApi.replaceWorldbook || (() => {});

    const worldbookRaw = await getWorldbook(worldbookName);
    const entries = this.getEntries(worldbookRaw);

    const idx = entries.findIndex((e: any) => this.sameUid(e.uid, this.PROMPT_UID));
    if (idx !== -1) {
      entries.splice(idx, 1);
      replaceWorldbook(worldbookName, this.setEntries(worldbookRaw, entries));
      console.log('🗑️ 已从世界书移除提示词条目');
    }
  }

  /**
   * T-4: 检查提示词条目是否存在
   */
  static async promptExistsInWorldbook(worldbookName: string): Promise<boolean> {
    const stApi = (globalThis as any).SillyTavern?.getContext?.() || (globalThis as any);
    const getWorldbook = stApi.getWorldbook || (() => []);

    const worldbookRaw = await getWorldbook(worldbookName);
    const entries = this.getEntries(worldbookRaw);
    return entries.some((e: any) => this.sameUid(e.uid, this.PROMPT_UID));
  }
}
