/**
 * 简化版提示词管理器（词条式格式优化）
 */

export interface PromptVariables {
  characterName: string;
  rarity: string;
  producePlan: string;
  recommendedStyle?: string;
  theme?: string;
  exampleCards?: string;
}

export class PromptManagerSimplified {
  /**
   * 生成简化版技能卡生成提示词
   */
  static getSkillCardGenerationPrompt(): string {
    return `# 为 {{characterName}} 生成 {{rarity}} 级技能卡

**培育计划**: {{producePlan}} | **打法**: {{recommendedStyle}} | **主题**: {{theme}}

---

## 📋 输出格式（词条式）

**⚠️ 直接输出JSON，不要任何解释文字！**

\`\`\`json
{
  "id": "角色英文名_ssr_exclusive",
  "nameJP": "日文名",
  "nameCN": "中文名",
  "type": "主动",  // 或"精神"
  "rarity": "{{rarity}}",
  "cost": "体力消耗X",  // 或"元气消耗X"、"无消耗"
  "producePlan": "{{producePlan}}",
  
  "effectEntries": [
    {
      "icon": "图标URL或空字符串",
      "effect": "数值+10",
      "isConsumption": false
    }
  ],
  
  "effectEntriesEnhanced": [
    {
      "icon": "图标URL或空字符串",
      "effect": "数值+15",
      "isConsumption": false
    }
  ],
  
  "restrictions": {
    "isDuplicatable": true,  // false=不可重复
    "usesPerBattle": null    // 1=演出中限1次，null=无限制
  },
  
  "flavor": "风味文本",
  "isExclusive": true,
  "exclusiveCharacter": "{{characterName}}"
}
\`\`\`

---

## 🎯 图标URL速查

| 效果类型 | 图标URL |
|---------|---------|
| 数值 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/数值.png\` |
| 元气 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/元气.png\` |
| 干劲 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/干劲.png\` |
| 好印象 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好印象.png\` |
| 集中 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/集中.png\` |
| 全力值 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/全力值.png\` |
| 好调 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好调.png\` |
| 绝好调 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/绝好调.png\` |
| 强气 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/强气.png\` |
| 温存 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/温存.png\` |
| 消费体力减少 | \`https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/消费体力减少.png\` |
| 抽卡/条件等 | \`""\`（空字符串） |

---

## ⚠️ 关键规则

### 1. 词条格式要求
- ✅ **effectEntries** 和 **effectEntriesEnhanced** 必须是非空数组
- ✅ 每个词条对象包含：**icon**（图标URL）、**effect**（纯中文描述）、**isConsumption**（布尔值）
- ✅ effect示例："数值+10"、"元气+3"、"变更为强气2段"、"抽取1张技能卡"
- ❌ 禁止使用日文：パラメータ→数值、元気→元气、やる気→干劲

### 2. 卡牌类型区分
- **主动卡(A)**：必须包含"数值+X"词条，可附加其他效果
- **精神卡(M)**：不包含数值，仅提供资源/状态效果

### 3. 培育计划特色（{{producePlan}}）
${this.getProducePlanRule('{{producePlan}}')}

### 4. 强度设计
参考示例卡的效果强度和成本设计，确保：
- 明显强于低稀有度示例
- 不超过高稀有度示例太多
- UR卡需在数值、机制上全面超越SSR（提升30-50%）

---

## 📚 示例卡参考

{{exampleCards}}

---

## ✅ 最终检查
1. effectEntries/effectEntriesEnhanced 是否非空？
2. 所有effect字段是否纯中文？
3. icon字段是否正确填写？
4. isConsumption是否正确标记？
5. 是否符合{{producePlan}}计划特色？
6. 是否仅输出JSON（无解释文字）？
`;
  }

  /**
   * 获取培育计划的简化规则说明
   */
  private static getProducePlanRule(plan: string): string {
    const rules: Record<string, string> = {
      '感性': '- 核心效果：**好调**、**集中**\n- 玩法：爆发型，短期高额输出\n- 禁止混用：干劲、好印象（理性专属）',
      '理性': '- 核心效果：**好印象**、**干劲**\n- 玩法：持续型，稳定长期增益\n- 禁止混用：好调、集中（感性专属）',
      '非凡': '- 核心效果：**全力值**、**强气**、**温存**、**热意**\n- 玩法：灵活型，动态切换三种状态（全力、强气、温存）\n- 禁止混用：好调、集中、好印象、干劲（其他计划专属）',
      '自由': '- 可使用任何通用效果\n- 但应保持平衡，不要过强'
    };
    return rules[plan] || '- 遵循通用规则';
  }

  /**
   * 替换变量
   */
  static replaceVariables(template: string, variables: PromptVariables): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replaceAll(`{{${key}}}`, value || '');
    });
    return result.replace(/\{\{[^}]+\}\}/g, '（未指定）');
  }
}





