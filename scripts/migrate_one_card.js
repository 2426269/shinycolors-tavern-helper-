/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable import-x/no-nodejs-modules */
const fs = require('fs');
const path = require('path');
const { generateAndValidate } = require('./llm_utils');

// ============ 配置 ============
const SOURCE_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json');
const DRAFT_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库_AI_Draft.json');
const PROGRESS_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/migration_progress.json');

// ============ System Prompt (完整版 V3) ============
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
- 如果无法完整解析，也要给一个最小可执行版本

### 4. restrictions 放根字段
\`restrictions.is_unique\` 由脚本处理，**禁止**在 \`engine_data\` 内输出 \`restrictions\`。

---

## 战斗系统机制参考

### 标准 buff_id
| ID                     | 名称           | 效果                  | 计划    |
| ---------------------- | -------------- | --------------------- | ------- |
| \`GoodCondition\`        | 好调           | 技能卡得分量增加50%   | Sense   |
| \`ExcellentCondition\`   | 绝好调         | 使好调的倍率额外增加  | Sense   |
| \`Concentration\`        | 集中           | 每层增加技能卡得分    | Sense   |
| \`Motivation\`           | 干劲           | 增强元气回复效果      | Logic   |
| \`GoodImpression\`       | 好印象         | 回合结束时获得分数    | Logic   |
| \`GoodImpressionBonus\`  | 好印象效果增加 | 好印象效果增加xx%     | Logic   |
| \`AlloutState\`          | 全力           | 全力模式              | Anomaly |
| \`ConserveState\`        | 温存           | 温存模式              | Anomaly |
| \`ResoluteState\`        | 强气           | 强气模式              | Anomaly |
| \`AllPower\`             | 全力值         | 全力槽（0-100）       | Anomaly |
| \`Heat\`                 | 热意           | 热意机制              | Anomaly |
| \`StaminaReduction\`     | 体力消耗减少   | 技能卡所需体力减少50% | 通用    |
| \`StaminaCut\`           | 消费体力削减   | 技能卡所需体力减少N点 | 通用    |
| \`ScoreBonus\`           | 得分增加       | N层时得分增加N%       | 通用    |
| \`ScoreFinalMultiplier\` | 最终得分倍率   | 最终得分乘以倍率      | 通用    |

### 可用 Action 类型（17种）
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
| \`PLAY_CARD_FROM_ZONE\`           | \`zone\`, \`filter\`                                     | 从指定区域打出卡              |
| \`MOVE_CARD_TO_ZONE\`             | \`from_zone\`, \`to_zone\`, \`filter\`                     | 移动卡到区域                  |
| \`PLAY_RANDOM_CARDS\`             | \`zone\`, \`count\`, \`filter\`                            | 随机打出满足条件的卡          |
| \`EXHAUST_CARD\`                  | \`card_id\`                                            | 消耗卡牌进入除外区            |
| \`ENSURE_BUFF_TURNS\`             | \`buff_id\`, \`turns\`                                   | 确保Buff至少保持N回合         |
| \`MODIFY_BUFF_MULTIPLIER\`        | \`buff_id\`, \`multiplier\`                              | 设置Buff获得量倍率            |
| \`MODIFY_BUFF_EFFECT_MULTIPLIER\` | \`buff_id\`, \`multiplier\`                              | 设置Buff效果倍率              |

### Hook 触发器（11种）
| trigger                | 说明       |
| ---------------------- | ---------- |
| \`ON_LESSON_START\`      | 训练开始时 |
| \`ON_TURN_START\`        | 回合开始时 |
| \`ON_BEFORE_CARD_PLAY\`  | 打出卡牌前 |
| \`ON_AFTER_CARD_PLAY\`   | 打出卡牌后 |
| \`ON_BEFORE_SCORE_CALC\` | 得分计算前 |
| \`ON_AFTER_SCORE_CALC\`  | 得分计算后 |
| \`ON_TURN_END\`          | 回合结束时 |
| \`ON_LESSON_END\`        | 训练结束时 |
| \`ON_TURN_SKIP\`         | 跳过回合时 |
| \`ON_STATE_SWITCH\`      | 状态切换时 |
| \`ON_CARD_DRAW\`         | 抽牌时     |

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

### Rule 7: 训练中限1次
设置 \`constraints.exhaust_on_play = true\``;

// ============ 主逻辑 ============

function extractAllCards(sourceData) {
  const allCards = [];
  function recurse(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(item => recurse(item));
    } else if (typeof obj === 'object' && obj !== null) {
      if (obj.id && obj.name) {
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

  // generateAndValidate 已包含 Zod 校验和重试逻辑
  const result = await generateAndValidate(SYSTEM_PROMPT, userPrompt);

  if (result.success) {
    console.log(`✅ 成功: ${card.id}`);
    // 提取 engine_data (可能是根对象或嵌套)
    const engineData = result.data.engine_data || result.data;
    return {
      id: card.id,
      name: card.name,
      engine_data: engineData,
      _status: 'success',
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

  // 找到下一张要处理的卡
  const nextIndex = progress.lastIndex + 1;
  if (nextIndex >= allCards.length) {
    console.log('🎉 所有卡牌已处理完毕！');
    return;
  }

  const card = allCards[nextIndex];
  console.log(`📍 进度: ${nextIndex + 1}/${allCards.length}`);

  const result = await processCard(card);

  // 保存结果
  draftCards.push(result);
  fs.writeFileSync(DRAFT_FILE, JSON.stringify(draftCards, null, 2));

  // 更新进度
  progress.lastIndex = nextIndex;
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));

  console.log(`💾 已保存到: ${DRAFT_FILE}`);
  console.log(`📍 下次运行将处理: ${nextIndex + 2}/${allCards.length}`);
}

main().catch(console.error);
