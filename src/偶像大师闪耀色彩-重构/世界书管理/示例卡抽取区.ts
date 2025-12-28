/**
 * 示例卡片抽取区
 * 负责从技能卡数据库中抽取示例卡，用于AI生成参考
 */

import SKILL_CARD_LIBRARY from '../战斗/数据/技能卡库.json';
import CHARACTER_SKILL_CARDS from '../战斗/数据/角色专属技能卡库.json';
import type { ProducePlan, SkillCard, SkillCardRarity } from '../战斗/类型/技能卡类型';
import type { AttributeType } from '../类型/卡牌属性类型';

/**
 * 获取所有技能卡
 */
function getAllSkillCards(): SkillCard[] {
  const result: SkillCard[] = [];
  const library = SKILL_CARD_LIBRARY as unknown as Record<string, Record<string, SkillCard[]>>;

  // 遍历每个培育计划（感性、理性、非凡）
  for (const planCards of Object.values(library)) {
    // 遍历每个稀有度
    for (const rarityCards of Object.values(planCards)) {
      if (Array.isArray(rarityCards)) {
        result.push(...rarityCards);
      }
    }
  }
  return result;
}

/**
 * 示例卡抽取配置
 */
interface ExampleCardConfig {
  /** 目标稀有度（用于确定抽取策略） */
  targetRarity: SkillCardRarity;
  /** 目标培育计划 */
  targetPlan: ProducePlan;
  /** 目标属性（可选，用于更精确的匹配） */
  targetAttribute?: AttributeType;
}

/**
 * 抽取结果分类
 */
interface ExampleCardResult {
  /** 示例卡（与目标稀有度相同，用于提供设计参考） */
  exampleCards: SkillCard[];
  /** 参考卡（低于目标稀有度，提醒设计强度下限） */
  lowerRarityCards: SkillCard[];
  /** 对比卡（高于目标稀有度，提醒设计强度上限） */
  higherRarityCards: SkillCard[];
}

/**
 * 示例卡抽取管理器
 */
export class ExampleCardSelector {
  /**
   * 获取稀有度对应的抽取策略
   * @param rarity 目标稀有度
   * @returns 抽取策略 {主示例数量, 低稀有度, 低稀有度数量, 高稀有度, 高稀有度数量}
   */
  private static getSelectionStrategy(rarity: SkillCardRarity): {
    mainCount: number;
    lowerRarity: SkillCardRarity | null;
    lowerCount: number;
    higherRarity: SkillCardRarity | null;
    higherCount: number;
  } {
    switch (rarity) {
      case 'UR':
        // UR策略：3张相应计划的UR卡 + 7张角色专属SSR卡
        return {
          mainCount: 3, // 从技能卡库抽取UR
          lowerRarity: 'SSR',
          lowerCount: 7, // 从角色专属库抽取SSR
          higherRarity: null,
          higherCount: 0,
        };
      case 'SSR':
        // 6张SSR示例 + 2张SR参考 + 2张R参考
        return {
          mainCount: 6,
          lowerRarity: 'SR',
          lowerCount: 2,
          higherRarity: 'R',
          higherCount: 2,
        };
      case 'SR':
        // 6张SR示例 + 2张R参考 + 2张SSR对比
        return {
          mainCount: 6,
          lowerRarity: 'R',
          lowerCount: 2,
          higherRarity: 'SSR',
          higherCount: 2,
        };
      case 'R':
        // 6张R示例 + 2张N参考 + 2张SR对比
        return {
          mainCount: 6,
          lowerRarity: 'N',
          lowerCount: 2,
          higherRarity: 'SR',
          higherCount: 2,
        };
      case 'N':
        // 8张N示例 + 2张R对比
        return {
          mainCount: 8,
          lowerRarity: null,
          lowerCount: 0,
          higherRarity: 'R',
          higherCount: 2,
        };
      default:
        return {
          mainCount: 10,
          lowerRarity: null,
          lowerCount: 0,
          higherRarity: null,
          higherCount: 0,
        };
    }
  }

  /**
   * 从卡池中随机抽取指定数量的卡牌
   * @param pool 卡池
   * @param count 数量
   * @returns 抽取的卡牌
   */
  private static randomSample<T>(pool: T[], count: number): T[] {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * 从技能卡库抽取（用于UR卡）
   * @param rarity 稀有度
   * @param plan 培育计划
   * @returns 过滤后的技能卡列表
   */
  private static filterCardsFromSkillLib(rarity: SkillCardRarity, plan?: ProducePlan): SkillCard[] {
    const library = SKILL_CARD_LIBRARY as unknown as Record<string, Record<string, SkillCard[]>>;
    if (plan && library[plan]?.[rarity]) {
      console.log(`📊 从技能卡库抽取 ${library[plan][rarity].length} 张 ${plan} ${rarity} 卡`);
      return [...library[plan][rarity]];
    }
    // 无指定计划则返回所有
    const result: SkillCard[] = [];
    for (const planData of Object.values(library)) {
      if (planData[rarity]) {
        result.push(...planData[rarity]);
      }
    }
    console.log(`📊 从技能卡库抽取 ${result.length} 张 ${rarity} 卡（所有计划）`);
    return result;
  }

  /**
   * 过滤技能卡 - 优先从角色专属技能卡库抽取
   * @param rarity 稀有度
   * @param plan 培育计划（可选）
   * @param attribute 属性（可选）
   * @returns 过滤后的技能卡列表
   */
  private static filterCards(rarity: SkillCardRarity, plan?: ProducePlan, _attribute?: AttributeType): SkillCard[] {
    // 优先从角色专属技能卡库抽取
    const characterCardsLib = CHARACTER_SKILL_CARDS as unknown as Record<string, Record<string, SkillCard[]>>;
    let characterCards: SkillCard[] = [];

    if (plan) {
      // 获取指定计划的角色专属卡
      const planData = characterCardsLib[plan];
      if (planData && planData[rarity]) {
        characterCards = [...planData[rarity]];
      }
    } else {
      // 获取所有计划的角色专属卡
      for (const planCards of Object.values(characterCardsLib)) {
        if (planCards[rarity]) {
          characterCards.push(...planCards[rarity]);
        }
      }
    }

    // 如果角色专属卡足够，直接返回
    if (characterCards.length >= 6) {
      console.log(`📊 从角色专属卡库抽取 ${characterCards.length} 张 ${rarity} 卡`);
      return characterCards;
    }

    // 否则从全卡库补充
    let allCards: SkillCard[] = [];

    if (plan) {
      const library = SKILL_CARD_LIBRARY as unknown as Record<string, Record<string, SkillCard[]>>;
      const planData = library[plan];
      if (planData) {
        for (const rarityCards of Object.values(planData)) {
          if (Array.isArray(rarityCards)) {
            allCards.push(...rarityCards);
          }
        }
      }
    } else {
      allCards = getAllSkillCards().filter(card => card.plan !== '自由');
    }

    const filteredCards = allCards.filter(card => {
      if (card.rarity !== rarity) return false;
      if (card.plan === '自由') return false;
      return true;
    });

    // 合并：角色专属卡 + 部分全库卡（去重）
    const existingNames = new Set(characterCards.map(c => c.name));
    const supplementCards = filteredCards.filter(c => !existingNames.has(c.name));

    console.log(`📊 角色专属卡 ${characterCards.length} 张 + 补充 ${supplementCards.length} 张 ${rarity} 卡`);
    return [...characterCards, ...supplementCards];
  }

  /**
   * 抽取示例卡片
   * @param config 抽取配置
   * @returns 分类后的示例卡结果
   */
  static selectExampleCards(config: ExampleCardConfig): ExampleCardResult {
    const { targetRarity, targetPlan, targetAttribute } = config;
    const strategy = this.getSelectionStrategy(targetRarity);

    let exampleCards: SkillCard[] = [];
    let lowerRarityCards: SkillCard[] = [];
    let higherRarityCards: SkillCard[] = [];

    // UR特殊处理：3张UR（从技能卡库）+ 7张SSR（从角色专属库）
    if (targetRarity === 'UR') {
      // 从技能卡库抽取UR卡作为设计参考
      const urPool = this.filterCardsFromSkillLib('UR', targetPlan);
      exampleCards = this.randomSample(urPool, strategy.mainCount);
      console.log(`📊 [UR生成] 抽取 ${exampleCards.length} 张UR卡作为设计参考`);

      // 从角色专属库抽取SSR卡供超越
      const ssrPool = this.filterCards('SSR', targetPlan, targetAttribute);
      lowerRarityCards = this.randomSample(ssrPool, strategy.lowerCount);
      console.log(`📊 [UR生成] 抽取 ${lowerRarityCards.length} 张SSR卡（需超越这些卡）`);
    } else {
      // 抽取主示例卡
      const mainPool = this.filterCards(targetRarity, targetPlan, targetAttribute);
      exampleCards = this.randomSample(mainPool, strategy.mainCount);
      console.log(`📊 [主示例] 抽取 ${exampleCards.length} 张 ${targetRarity} 卡作为设计参考`);

      // 抽取低稀有度参考卡
      if (strategy.lowerRarity && strategy.lowerCount > 0) {
        const lowerPool = this.filterCards(strategy.lowerRarity, targetPlan, targetAttribute);
        lowerRarityCards = this.randomSample(lowerPool, strategy.lowerCount);
        console.log(`📊 [强度下限] 抽取 ${lowerRarityCards.length} 张 ${strategy.lowerRarity} 卡提醒设计强度下限`);
      }

      // 抽取高稀有度对比卡
      if (strategy.higherRarity && strategy.higherCount > 0) {
        const higherPool = this.filterCards(strategy.higherRarity, targetPlan, targetAttribute);
        higherRarityCards = this.randomSample(higherPool, strategy.higherCount);
        console.log(`📊 [强度上限] 抽取 ${higherRarityCards.length} 张 ${strategy.higherRarity} 卡提醒设计强度上限`);
      }
    }

    return {
      exampleCards,
      lowerRarityCards,
      higherRarityCards,
    };
  }

  /**
   * 将示例卡格式化为Markdown表格（用于世界书展示）
   * @param result 抽取结果
   * @param targetRarity 目标稀有度
   * @returns Markdown格式的表格字符串
   */
  static formatAsMarkdown(result: ExampleCardResult, targetRarity: SkillCardRarity): string {
    let markdown = '';

    // UR特殊说明
    if (targetRarity === 'UR') {
      markdown += `## 🌟 UR卡设计要求\n`;
      markdown += `以下是当前培育计划的**官方UR卡（传说级）**，请严格遵循其强度和设计风格：\n\n`;
      markdown += this.formatCardTable(result.exampleCards, 'UR级示例（设计参考）');
      markdown += '\n';
      markdown += `---\n\n`;
      markdown += `以下是 **SSR卡**，你设计的UR卡**必须全面超越**这些卡：\n`;
      markdown += `- 更高的效果数值\n`;
      markdown += `- 更独特的机制\n`;
      markdown += `- 更强的培育计划协同性\n\n`;
      markdown += this.formatCardTable(result.lowerRarityCards, 'SSR参考（必须超越）');
      return markdown;
    }

    // 常规稀有度
    if (result.exampleCards.length > 0) {
      markdown += this.formatCardTable(result.exampleCards, `${targetRarity}级示例（设计参考）`);
      markdown += '\n';
    }

    if (result.lowerRarityCards.length > 0) {
      const lowerRarity = result.lowerRarityCards[0]?.rarity || '低稀有度';
      markdown += this.formatCardTable(result.lowerRarityCards, `${lowerRarity}级参考（强度下限）`);
      markdown += '\n';
    }

    if (result.higherRarityCards.length > 0) {
      const higherRarity = result.higherRarityCards[0]?.rarity || '高稀有度';
      markdown += this.formatCardTable(result.higherRarityCards, `${higherRarity}级对比（强度上限）`);
      markdown += '\n';
    }

    return markdown;
  }

  /**
   * 格式化卡牌列表为Markdown（词条式JSON格式）
   */
  private static formatCardTable(cards: SkillCard[], title: string): string {
    if (cards.length === 0) return '';

    let markdown = `### ${title}\n\n`;
    markdown += `以下示例卡均使用词条式格式（effectEntries数组），请严格参考这种格式输出：\n\n`;

    cards.forEach((card, index) => {
      markdown += `**示例 ${index + 1}：${card.name}** (${card.rarity} - ${card.plan})\n`;
      markdown += `\`\`\`json\n`;

      // 拆分卡牌名称为日文和中文
      const nameParts = card.name.split(' / ');
      const nameJP = nameParts[0] || card.name;
      const nameCN = nameParts[1] || nameJP;

      // 输出完整的技能卡JSON，包含词条式格式（不包含type字段，避免默认陷阱问题）
      const cardForDisplay: Record<string, unknown> = {
        id: card.id,
        nameJP: nameJP,
        nameCN: nameCN,
        rarity: card.rarity,
        cost: card.cost,
        producePlan: card.plan,
        effectEntries: card.effectEntries || [],
        effectEntriesEnhanced: card.effectEntriesEnhanced || [],
        conditionalEffects: card.conditionalEffects || [],
        conditionalEffectsEnhanced: card.conditionalEffectsEnhanced || [],
        restrictions: card.restrictions || { isDuplicatable: true, usesPerBattle: null },
        flavor: card.flavor || '',
      };

      // 只有当cardType有值时才添加type字段
      if (card.cardType) {
        const cardTypeText = card.cardType === 'A' ? '主动' : card.cardType === 'M' ? '精神' : '陷阱';
        cardForDisplay.type = cardTypeText;
      }

      markdown += JSON.stringify(cardForDisplay, null, 2);
      markdown += `\n\`\`\`\n\n`;
    });

    return markdown;
  }

  /**
   * 将示例卡格式化为JSON字符串（用于提示词变量替换）
   * @param result 抽取结果
   * @param targetRarity 目标稀有度
   * @returns JSON格式的字符串
   */
  static formatAsJSON(result: ExampleCardResult, targetRarity: SkillCardRarity): string {
    if (targetRarity === 'UR') {
      return JSON.stringify(
        {
          note: 'UR卡必须在所有方面超越以下SSR卡',
          reference_ssr_cards: result.exampleCards,
        },
        null,
        2,
      );
    }

    return JSON.stringify(
      {
        example_cards: result.exampleCards,
        lower_rarity_reference: result.lowerRarityCards,
        higher_rarity_ceiling: result.higherRarityCards,
      },
      null,
      2,
    );
  }

  /**
   * 所有示例卡的固定UID基数
   */
  private static readonly EXAMPLE_CARDS_UID_BASE = 999999900; // 为示例卡预留100个UID

  /**
   * 将示例卡添加到世界书
   * @param worldbookName 世界书名称
   * @param config 抽取配置
   * @returns Promise<void>
   */
  static async addExampleCardsToWorldbook(worldbookName: string, config: ExampleCardConfig): Promise<void> {
    const result = this.selectExampleCards(config);
    const markdown = this.formatAsMarkdown(result, config.targetRarity);

    // 确保世界书存在
    const worldbooks = getWorldbookNames();
    if (!worldbooks.includes(worldbookName)) {
      console.log(`📚 创建新世界书: ${worldbookName}`);
      createWorldbook(worldbookName);
    }

    // 获取世界书内容
    const worldbook = await getWorldbook(worldbookName);

    // 检查条目是否已存在
    const entryUID = this.EXAMPLE_CARDS_UID_BASE;
    const entryIndex = worldbook.findIndex(entry => entry.uid === entryUID);

    const entry = {
      name: `示例卡片库（${config.targetRarity}级 - ${config.targetPlan}）`,
      content: markdown,
      uid: entryUID,
      enabled: true,
      strategy: {
        type: 'constant' as const,
        keys: [],
        keys_secondary: {
          logic: 'and_any' as const,
          keys: [],
        },
        scan_depth: 'same_as_global' as const,
      },
      position: {
        type: 'at_depth' as const,
        role: 'system' as const,
        depth: 0,
        order: 250, // 在提示词框架(200)之后，思维链(300)之前
      },
      probability: 100,
      recursion: {
        prevent_incoming: true,
        prevent_outgoing: true,
        delay_until: null,
      },
      effect: {
        sticky: null,
        cooldown: null,
        delay: null,
      },
      extra: {
        entry_type: 'example_cards',
        target_rarity: config.targetRarity,
        target_plan: config.targetPlan,
      },
    };

    if (entryIndex !== -1) {
      // 更新现有条目
      worldbook[entryIndex] = entry;
      console.log(`🔄 更新示例卡片: ${config.targetRarity} - ${config.targetPlan}`);
    } else {
      // 添加新条目
      worldbook.push(entry);
      console.log(`✨ 创建示例卡片条目: ${config.targetRarity} - ${config.targetPlan}`);
    }

    replaceWorldbook(worldbookName, worldbook);
  }

  /**
   * 从世界书中移除示例卡
   * @param worldbookName 世界书名称
   * @returns Promise<void>
   */
  static async removeExampleCardsFromWorldbook(worldbookName: string): Promise<void> {
    const worldbook = await getWorldbook(worldbookName);
    const entryIndex = worldbook.findIndex(entry => entry.uid === this.EXAMPLE_CARDS_UID_BASE);

    if (entryIndex !== -1) {
      worldbook.splice(entryIndex, 1);
      replaceWorldbook(worldbookName, worldbook);
      console.log('🗑️ 已从世界书移除示例卡片');
    }
  }
}
