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

---

## 🎯 图标URL速查

| 效果类型 | 图标URL |
|---------|---------|
| 元气 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/元气.png\` |
| 干劲 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/干劲.png\` |
| 好印象 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好印象.png\` |
| 集中 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/集中.png\` |
| 全力值 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/全力值.png\` |
| 好调 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好调.png\` |
| 绝好调 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/绝好调.png\` |
| 强气 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/强气.png\` |
| 热意 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/强气.png\` |
| 温存 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/温存.png\` |
| 悠闲 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/悠闲.png\` |
| 消费体力减少 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/消费体力减少.png\` |
| 技能卡使用次数+1 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/技能卡使用次数加一.png\` |
| 回合数追加 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/回合数追加.png\` |
| 低下状态无效 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/低下状态无效.png\` |
| 数值提升 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/数值提升.png\` |
| 成长 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/成长.png\` |
| 手牌 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/手牌.png\` |
| 数值 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/数值.png\` |
| 好印象增加量增加 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好印象增加量增加.png\` |
| 好印象强化 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好印象强化.png\` |
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

### 5. 强度设计
- 参考示例卡的数值范围
- 明显强于低稀有度，不超过高稀有度
- UR需全面超越SSR（数值+30-50%）

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

## ✅ 最终检查

1. effectEntries/effectEntriesEnhanced 非空？
2. effect字段纯中文？
3. icon URL正确或""？
4. 符合{{producePlan}}计划特色？
5. 仅输出JSON？
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
    };
    return modeNames[mode] || '未知模式提示词';
  }
}
