/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable import-x/no-nodejs-modules */
const fs = require('fs');
const path = require('path');
const { generateAndValidate } = require('./llm_utils');

// ============ 配置 ============
const SOURCE_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json');
const DRAFT_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库_AI_Draft.json');
const PROGRESS_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/migration_progress.json');

// ============ System Prompt (完整版 V4) ============
const SYSTEM_PROMPT = `You are an expert game data engineer for "学园偶像大师 (Gakuen Idolmaster)".
Your task is to convert legacy skill card data into the new \`engine_data\` format for the "Battle Engine NG".

---

## ⚠️ 输出规则 (OUTPUT RULES)

### 1. 只输出 engine_data
**禁止**输出 \`id\`, \`display\`, \`effectEntries\`, \`restrictions\` 等外层字段。
你只需输出一个纯 \`engine_data\` 对象：
{
  "cost": { "genki": 0 },
  "logic_chain": [ ... ],
  "logic_chain_enhanced": [ ... ],
  "constraints": { ... }
}

### 2. 禁止 Markdown
**禁止**使用 Markdown 代码块（如 \`\`\`json）。直接输出裸 JSON。

### 3. engine_data 必须完整
- \`cost\` 必须存在（即使是 \`{genki:0}\`）
- \`logic_chain\` 必须是**非空数组**
- 如果无法完整理解效果，输出 { "_uncertain": true, "engine_data": {...} }，脚本会将其加入人工队列

### 4. restrictions 放根字段
\`restrictions.is_unique\` 由脚本处理，**禁止**在 \`engine_data\` 内输出 \`restrictions\`。

---

## 战斗系统机制参考

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
| \`ON_CARD_ENTER_ZONE\`   | 卡牌进入区域时           | **T8: 用于 intrinsic_hooks** |

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

---

## Translation Rules (CRITICAL)

### Rule 1: Hook Definition
\`hook_def\` **必须**包含 \`id\` 和 \`name\`。
- \`id\`: 格式 \`\${card_id}::\${suffix}\` (**使用输入中提供的 card_id**)
- \`name\`: 中文可读名称

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
- 正确: { "constraints": { "exhaust_on_play": true } }
- 错误: { "restrictions": { "uses_per_battle": 1 } }
注意: \`uses_per_battle\` 是我们自定义的机制，用于限制AI逆天卡，官方卡不使用此字段。

### Rule 8: when vs condition (重要!)
- 逻辑链步骤: 使用 \`when\` (e.g., { "when": {...}, "do": [...] })
- Hook 内部条件: 使用 \`condition\` (e.g., hook_def.condition)
- **禁止**在逻辑链步骤中使用 \`condition\`

### Rule 9: 状态切换变量
ON_STATE_SWITCH 时检测目标状态，使用 { "var": "new_state" }
- 正确: { "==": [{ "var": "new_state" }, "AlloutState"] }
- 错误: { "==": [{ "var": "context.state" }, "AlloutState"] }

### Rule 10: cost 和体力消耗
- 源数据 \`cost: "6"\` → \`engine_data.cost.genki: 6\` (普通卡牌消耗，优先消耗元气)
- effectEntry 中的"体力消耗X" → \`{ action: "MODIFY_STAMINA", value: -X }\` (强制消耗体力)

### Rule 11: 区域名称与机制 (Zone Names) - 重要!
| 区域名称 (中文/日本語) | zone值    | DBG术语      | 核心功能                                               | 可见性       |
| ---------------------- | --------- | ------------ | ------------------------------------------------------ | ------------ |
| 抽牌堆 (山札)          | \`deck\`    | Draw Pile    | 存放待抽取的卡牌队列，每回合手牌来源                   | 数量可见     |
| 手牌 (手札)            | \`hand\`    | Hand         | 当前可打出的卡牌，回合结束时强制清空                   | 完全可见     |
| 弃牌堆 (捨て札)        | \`discard\` | Discard Pile | 已结算/丢弃的卡牌存放区，牌堆耗尽时洗回                | 完全可见     |
| 除外区 (除外)          | \`removed\` | Exhaust      | 永久移除出战斗循环的卡牌，用于压缩牌库                 | 可见不可复用 |
| 保留区 (手元)          | \`reserve\` | Reserve      | Anomaly专属: 进入全力状态时释放，不影响正常3张手牌抽取 | 可见独立循环 |

**保留区特殊说明**: 保留区是非凡(Anomaly)偶像独有机制，卡牌从手牌/牌堆/弃牌堆移入保留区后暂存。
进入全力状态时，保留区卡牌加入手牌（额外手牌，可达4-5张）。对于不常进全力的flow（强气/悠闲），
相当于牌组压缩；对于全力流，相当于确定全力回合手牌组合。

**禁止使用**: \`keep\`, \`deckPile\`, \`handPile\`, \`discardPile\`, \`graveyard\`, \`exile\`, \`banished\`

### Rule 12: 按卡名过滤 (Card Name Selector)
使用 \`matchCardName\` JSON Logic 操作符匹配卡名（支持中文名和日文名）:
\`\`\`json
{
  "action": "MOVE_CARD_TO_ZONE",
  "from_zone": "discard",
  "to_zone": "hand",
  "selector": { "matchCardName": ["スターライト", { "var": "current_card.card_name" }] }
}
\`\`\`

### Rule 13: 效果重放 (Effect Replay)
"下一张使用的技能卡效果额外发动1次" → \`REPLAY_NEXT_CARD\`:
\`\`\`json
{ "action": "REPLAY_NEXT_CARD", "count": 1 }
\`\`\`

### Rule 14: 强化手牌 (Enhance Hand)
"强化手牌中的所有主动卡" → \`ENHANCE_HAND\`:
\`\`\`json
{ "action": "ENHANCE_HAND", "filter": { "type": "主动" } }
\`\`\`

### Rule 15: 生成眠気卡 (Create Drowsy Card)
"将一张眠気加入手牌/牌堆" → \`CREATE_CARD\` + \`card_id: "trap_n_1"\`:
\`\`\`json
// 眠気加入手牌
{ "action": "CREATE_CARD", "card_id": "trap_n_1", "zone": "hand" }
// 眠気加入牌堆随机位置
{ "action": "CREATE_CARD", "card_id": "trap_n_1", "zone": "deck", "position": "random" }
// 眠気加入牌堆顶部
{ "action": "CREATE_CARD", "card_id": "trap_n_1", "zone": "deck", "position": "top" }
\`\`\`

### Rule 16: 最后N回合条件 (包含本回合) - 重要!
"最后3回合"判断需 +1 包含当前回合:
\`\`\`json
// ❌ 错误: max_turns - turn <= 3 (不含本回合)
// ✅ 正确: (max_turns - turn) + 1 <= 3 (含本回合)
{
  "<=": [
    { "+": [{ "-": [{ "var": "max_turns" }, { "var": "turn" }] }, 1] },
    3
  ]
}
\`\`\`

### Rule 17: 使用条件 (usable_when)
"状态切换4次以上才可使用" → \`constraints.usable_when\`:
\`\`\`json
{
  "constraints": {
    "usable_when": {
      ">=": [
        { "+": [
          { "var": "player.state_switch_count.AlloutState" },
          { "var": "player.state_switch_count.ConserveState" },
          { "var": "player.state_switch_count.ResoluteState" }
        ]},
        4
      ]
    }
  }
}
\`\`\`

### Rule 18: 固有能力 (Intrinsic Abilities) - 重要!
"移動至手牌時"、"进入手牌时" 等被动效果 → 使用 \`intrinsic_hooks\` 而不是 logic_chain

**关键区分**:
- \`logic_chain\`: 打出卡牌时执行
- \`intrinsic_hooks\`: 卡牌存在于牌组时始终监听，不需要打出

**触发点**: \`ON_CARD_ENTER_ZONE\` - 卡牌进入任意区域时触发

**上下文变量**:
- \`card_id\`: 移动的卡牌 ID
- \`from_zone\`: 来源区域 (deck/hand/discard/reserve/removed/none)
- \`to_zone\`: 目标区域

**示例: 移動至手牌時选择卡牌移动至保留区**
\`\`\`json
{
  "engine_data": {
    "cost": { "genki": -2 },
    "logic_chain": [
      // 打出时的效果...
    ],
    "intrinsic_hooks": [
      {
        "id": "on_draw_fetch",
        "name": "进入手牌时检索",
        "trigger": "ON_CARD_ENTER_ZONE",
        "max_triggers": 1,
        "condition": {
          "and": [
            { "==": [{ "var": "to_zone" }, "hand"] },
            { "==": [{ "var": "card_id" }, "THIS_CARD_ID"] }
          ]
        },
        "actions": [
          {
            "action": "MOVE_CARD_TO_ZONE",
            "from_zones": ["deck", "discard"],
            "zone": "reserve",
            "selector": { "==": [{ "var": "type" }, "A"] },
            "count": 1
          }
        ]
      }
    ]
  }
}
\`\`\`

> **禁止**: 不要将"移動至手牌時"效果写在 logic_chain 里！

### Rule 19: 禁止嵌套 REGISTER_HOOK - 重要!
\`REGISTER_HOOK.hook_def.actions[]\` 内只能放置基础 Action（如 GAIN_SCORE, ADD_BUFF 等）。
**绝对禁止**在 \`actions[]\` 内再次使用 \`REGISTER_HOOK\`！

错误示例 ❌:
\`\`\`json
{ "action": "REGISTER_HOOK", "hook_def": {
  "actions": [{ "action": "REGISTER_HOOK", ... }]  // 禁止嵌套！
}}
\`\`\`

正确示例 ✅:
\`\`\`json
{ "action": "REGISTER_HOOK", "hook_def": {
  "actions": [{ "action": "GAIN_SCORE", "value": 10 }]
}}
\`\`\`

---

## 完整示例 (Few-Shot Examples)

### 示例1: 简单得分卡
效果: "获得30分数"
{
  "cost": { "genki": 0 },
  "logic_chain": [
    { "do": [{ "action": "GAIN_SCORE", "value": 30 }] }
  ]
}

### 示例2: 条件触发卡
效果: "若已进入温存状态两次以上，回合数+1"
{
  "cost": { "genki": 0 },
  "logic_chain": [
    {
      "when": { ">=": [{ "var": "player.state_switch_count.ConserveState" }, 2] },
      "do": [{ "action": "MODIFY_TURN_COUNT", "value": 1 }]
    }
  ]
}

### 示例3: 下回合效果 + 训练中限1次
效果: "下回合抽2张卡 ※训练中限1次"
{
  "cost": { "genki": 0 },
  "logic_chain": [
    {
      "do": [{
        "action": "REGISTER_HOOK",
        "hook_def": {
          "id": "card_id::next_turn_draw",
          "name": "下回合抽卡",
          "trigger": "ON_TURN_START",
          "duration_turns": 2,
          "max_triggers": 1,
          "actions": [{ "action": "DRAW_CARD", "count": 2 }]
        }
      }]
    }
  ],
  "constraints": { "exhaust_on_play": true }
}

### 示例4: 消耗干劲 + 元气%得分
效果: "干劲消耗3，获得元气110%的分数"
{
  "cost": { "genki": 0 },
  "logic_chain": [
    {
      "do": [
        { "action": "REMOVE_BUFF", "buff_id": "Motivation", "stacks": 3 },
        { "action": "GAIN_SCORE", "value_expression": { "*": [{ "var": "player.genki" }, 1.1] } }
      ]
    }
  ]
}

### 示例5: 复杂UR卡 (状态切换Hook)
效果: "剩余回合不大于3时，进入全力状态时，打分值+120%（1回合），最多3次"
{
  "cost": { "genki": 0 },
  "logic_chain": [
    {
      "do": [{
        "action": "REGISTER_HOOK",
        "hook_def": {
          "id": "card_id::allout_boost",
          "name": "全力得分加成",
          "trigger": "ON_STATE_SWITCH",
          "condition": {
            "and": [
              { "==": [{ "var": "new_state" }, "AlloutState"] },
              { "<=": [{ "-": [{ "var": "max_turns" }, { "var": "turn" }] }, 3] }
            ]
          },
          "max_triggers": 3,
          "actions": [{ "action": "ADD_BUFF", "buff_id": "ScoreFinalMultiplier", "value": 120, "turns": 1 }]
        }
      }]
    }
  ]
}`;

// ============ 主逻辑 ============

function extractAllCards(sourceData) {
  const allCards = [];
  function recurse(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(item => recurse(item));
    } else if (typeof obj === 'object' && obj !== null) {
      // 必须有 id + name + 技能卡特征字段
      if (obj.id && obj.name && (obj.effect_before || obj.effectEntries || obj.rarity)) {
        allCards.push(obj);
      } else {
        Object.values(obj).forEach(value => recurse(value));
      }
    }
  }
  recurse(sourceData);
  return allCards;
}

async function processCard(card) {
  console.log(`\n🔄 转换: ${card.id} (${card.name})...`);

  const userPrompt = `请为以下卡牌生成 engine_data。

**card_id**: "${card.id}"

**卡牌数据**:
name: ${card.name}
effect_before: ${card.effect_before || '(无)'}
effect_after: ${card.effect_after || '(无)'}
cost: ${card.cost || '0'}
effectEntries: ${JSON.stringify(card.effectEntries, null, 2)}

**要求**:
1. effect_before → logic_chain
2. effect_after → logic_chain_enhanced (如果有)
3. Hook id 必须使用: ${card.id}::xxx
4. 只输出 engine_data 对象，禁止 Markdown`;

  const result = await generateAndValidate(SYSTEM_PROMPT, userPrompt);

  if (result.success) {
    const engineData = result.data.engine_data || result.data;
    const status = result.needsReview ? 'needs_review' : 'success';
    if (result.needsReview) {
      console.log(`⚠️ 需人工审核: ${card.id}`);
    } else {
      console.log(`✅ 成功: ${card.id}`);
    }
    return {
      id: card.id,
      name: card.name,
      engine_data: engineData,
      _status: status,
      _uncertain: !!result.needsReview,
    };
  } else {
    console.error(`❌ 失败: ${card.id} - ${result.error}`);
    return {
      id: card.id,
      name: card.name,
      _status: 'failed',
      _error: result.error,
    };
  }
}

async function main() {
  console.log(`📂 读取源文件: ${SOURCE_FILE}`);

  const rawData = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const sourceData = JSON.parse(rawData);
  const allCards = extractAllCards(sourceData);
  console.log(`📊 共找到 ${allCards.length} 张卡牌`);

  // 读取进度
  let progress = { lastIndex: -1 };
  if (fs.existsSync(PROGRESS_FILE)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }

  // 读取草稿
  let draftCards = [];
  if (fs.existsSync(DRAFT_FILE)) {
    draftCards = JSON.parse(fs.readFileSync(DRAFT_FILE, 'utf-8'));
  }

  // 自动处理所有卡牌
  for (let i = progress.lastIndex + 1; i < allCards.length; i++) {
    const card = allCards[i];
    console.log(`\n📍 进度: ${i + 1}/${allCards.length}`);

    try {
      const result = await processCard(card);
      draftCards.push(result);

      // 保存结果和进度
      fs.writeFileSync(DRAFT_FILE, JSON.stringify(draftCards, null, 2));
      progress.lastIndex = i;
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

      console.log(`💾 已保存 (${i + 1}/${allCards.length})`);
    } catch (err) {
      console.error(`❌ 处理失败: ${card.id} - ${err.message}`);
      progress.lastIndex = i;
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
      draftCards.push({
        id: card.id,
        name: card.name,
        _status: 'error',
        _error: err.message,
      });
      fs.writeFileSync(DRAFT_FILE, JSON.stringify(draftCards, null, 2));
    }
  }

  console.log('\n🎉 所有卡牌处理完毕！');
}

main().catch(console.error);
