/**
 * 示例卡片抽取区
 * 负责从技能卡数据库中抽取示例卡，用于AI生成参考
 * 直接使用完整卡库（含 engine_data）
 */

import SKILL_CARD_LIBRARY from '../战斗/数据/技能卡库.json';
import CHARACTER_SKILL_CARDS from '../战斗/数据/角色专属技能卡库.json';
import type { ProducePlan, SkillCard, SkillCardRarity } from '../战斗/类型/技能卡类型';
import type { AttributeType } from '../类型/卡牌属性类型';

/**
 * 扩展的 SkillCard，包含示例卡元信息和 display 字段
 */
export interface SkillCardV2WithConfidence extends Omit<SkillCard, 'display'> {
  /** 示例置信度标签（兼容旧代码） */
  example_confidence?: 'manual_gold' | 'high' | 'high_partial' | 'low_text_only';
  /** 下限示例来源稀有度 */
  example_source_rarity?: SkillCardRarity;
  /** 展示层数据 */
  display?: {
    name: string;
    nameJP?: string;
    description?: string;
    description_enhanced?: string;
    flavor?: string;
  };
}

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
export interface ExampleCardConfig {
  /** 目标稀有度（用于确定抽取策略） */
  targetRarity: SkillCardRarity;
  /** 目标培育计划 */
  targetPlan: ProducePlan;
  /** 目标属性（可选，用于更精确的匹配） */
  targetAttribute?: AttributeType;
}

/**
 * 示例卡抽取管理器
 */
export class ExampleCardSelector {
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
    const markdown = this.getV2ExamplesMarkdown(config);

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

  // ==================== SkillCardV2 格式支持 ====================

  /**
   * 稀有度抽取配方
   */
  private static readonly RARITY_RECIPES: Record<
    string,
    {
      standardCount: number;
      standardSource: 'manual_gold' | 'high';
      lowerBoundCount: number;
      lowerBoundRarity: 'R' | 'SR' | 'SSR' | null;
    }
  > = {
    UR: { standardCount: 3, standardSource: 'manual_gold', lowerBoundCount: 2, lowerBoundRarity: 'SSR' },
    SSR: { standardCount: 5, standardSource: 'high', lowerBoundCount: 2, lowerBoundRarity: 'SR' },
    SR: { standardCount: 5, standardSource: 'high', lowerBoundCount: 2, lowerBoundRarity: 'R' },
    R: { standardCount: 5, standardSource: 'high', lowerBoundCount: 0, lowerBoundRarity: null },
  };

  /**
   * 获取按稀有度分层的示例卡（P1 新策略）
   * - UR: 3张 manual_gold(UR) + 2张 high(SSR)
   * - SSR: 5张 high(SSR) + 2张 high(SR)
   * - SR: 5张 high(SR) + 2张 high(R)
   * - R: 5张 high(R)
   * @param config 抽取配置
   * @returns 分层后的 SkillCardV2 数组
   */
  static getExamplesByRarityTier(config: ExampleCardConfig): SkillCardV2WithConfidence[] {
    const { targetRarity, targetPlan } = config;
    const recipe = this.RARITY_RECIPES[targetRarity] || this.RARITY_RECIPES['R'];

    const result: SkillCardV2WithConfidence[] = [];

    // 直接从技能卡库获取卡牌（现在都有 engine_data）
    const getCardsWithEngineData = (rarity: SkillCardRarity): SkillCardV2WithConfidence[] => {
      const cards = this.filterCards(rarity, targetPlan, config.targetAttribute);
      return cards
        .filter((c: any) => c.engine_data) // 只保留有 engine_data 的卡
        .map((c: any) => ({
          ...c,
          example_confidence: 'high' as const,
        }));
    };

    // 1. 抽取标准示范
    const standardCandidates = getCardsWithEngineData(targetRarity);
    const selectedStandard = this.randomSample(standardCandidates, recipe.standardCount);

    // UR 卡标记为 manual_gold（最高质量）
    for (const card of selectedStandard) {
      if (recipe.standardSource === 'manual_gold') {
        card.example_confidence = 'manual_gold';
      }
    }
    result.push(...selectedStandard);
    console.log(`📊 [分层示例] 标准示范(${targetRarity}): ${selectedStandard.length}/${recipe.standardCount}`);

    // 2. 抽取下限示例（如果有）
    if (recipe.lowerBoundRarity && recipe.lowerBoundCount > 0) {
      const lowerCandidates = getCardsWithEngineData(recipe.lowerBoundRarity);
      const selectedLower = this.randomSample(lowerCandidates, recipe.lowerBoundCount);

      // 为下限示例添加 example_source_rarity 标注
      for (const card of selectedLower) {
        card.example_source_rarity = recipe.lowerBoundRarity;
      }

      result.push(...selectedLower);
      console.log(
        `📊 [分层示例] 下限参考(${recipe.lowerBoundRarity}): ${selectedLower.length}/${recipe.lowerBoundCount}`,
      );
    }

    return result;
  }

  /**
   * @deprecated 使用 getExamplesByRarityTier() 代替（P1 策略回滚）
   * 获取混合示例卡（旧版 70/20/10 比例）
   */
  static getMixedV2Examples(config: ExampleCardConfig, totalCount = 10): SkillCardV2WithConfidence[] {
    // 重定向到新方法
    console.warn('⚠️ getMixedV2Examples 已弃用，请使用 getExamplesByRarityTier()');
    return this.getExamplesByRarityTier(config);
  }

  /**
   * 格式化 SkillCardV2 为 Markdown（effectEntries + engine_data 双必填格式）
   * F3.1: 确保输出包含 effectEntries 以教会 AI 输出词条格式
   */
  static formatV2AsMarkdown(cards: SkillCardV2WithConfidence[], title: string): string {
    if (cards.length === 0) return '';

    let markdown = `### ${title}\n\n`;
    markdown += `以下示例使用 SkillCardV2 格式（effectEntries + engine_data 双必填）：\n`;
    markdown += `> **学习规则**：只学习 manual_gold/high 的完整结构；high_partial 学习词条格式但禁止学习 partial_effects；low_text_only 仅供风格参考。\n\n`;

    cards.forEach((card, index) => {
      const confidenceLabel =
        card.example_confidence === 'manual_gold'
          ? '🏆'
          : card.example_confidence === 'high'
            ? '✓'
            : card.example_confidence === 'high_partial'
              ? '⚡'
              : '📝';

      // F3.3: low_text_only 仅输出氛围片段，不输出 JSON 结构
      if (card.example_confidence === 'low_text_only') {
        markdown += `**氛围参考 ${index + 1}** ${confidenceLabel} - ${card.display?.name || card.name}\n`;
        markdown += `> ${card.display?.flavor || card.flavor || '（无氛围文本）'}\n\n---\n\n`;
        return;
      }

      // 显示下限示例的来源稀有度
      const sourceRarityLabel = card.example_source_rarity ? ` [下限参考-${card.example_source_rarity}]` : '';
      markdown += `**示例 ${index + 1}** ${confidenceLabel} \`${card.example_confidence}\`${sourceRarityLabel} - ${card.display?.name || card.name} (${card.rarity} - ${card.plan})\n`;
      markdown += `\`\`\`json\n`;

      // F3.1: 自定义输出顺序，确保 effectEntries 在 engine_data 之前
      const orderedCard: Record<string, any> = {
        example_confidence: card.example_confidence,
      };
      // 仅当存在时才输出 example_source_rarity
      if (card.example_source_rarity) {
        orderedCard.example_source_rarity = card.example_source_rarity;
      }
      orderedCard.id = card.id;
      orderedCard.rarity = card.rarity;
      orderedCard.type = card.type;
      orderedCard.plan = card.plan;
      // ⚡ F3.1: 必须包含 effectEntries（展示层）
      orderedCard.effectEntries = card.effectEntries || [];
      orderedCard.effectEntriesEnhanced = card.effectEntriesEnhanced || [];
      // engine_data（执行层）
      orderedCard.engine_data = card.engine_data;
      // F4.3: 不再输出 display（省 Token，effectEntries 已作为前端展示）
      orderedCard.restrictions = card.restrictions;
      // 保留 flavor 作为可选氛围文本
      if (card.display?.flavor) {
        orderedCard.flavor = card.display.flavor;
      }

      markdown += JSON.stringify(orderedCard, null, 2);
      markdown += `\n\`\`\`\n\n`;
    });

    return markdown;
  }

  /**
   * 获取 V2 格式的示例 Markdown（用于世界书）
   */
  static getV2ExamplesMarkdown(config: ExampleCardConfig): string {
    // P1: 使用新的分层抽取策略
    const tieredCards = this.getExamplesByRarityTier(config);
    return this.formatV2AsMarkdown(tieredCards, `SkillCardV2 示例（${config.targetRarity} - ${config.targetPlan}）`);
  }
}
