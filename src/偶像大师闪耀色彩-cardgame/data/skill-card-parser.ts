/**
 * 技能卡解析器
 *
 * 将299张真实技能卡数据解析为SkillCard对象
 */

import type { CardAttribute, CardRarity, SkillCard, SkillCardEffect } from '../types';

// 导入技能卡数据库
import skillCardDatabase from './skill-cards.json';

export class SkillCardParser {
  /**
   * 解析所有技能卡
   */
  static parseAllCards(enhanced: boolean = false): SkillCard[] {
    const cards: SkillCard[] = [];

    // 遍历所有属性
    for (const [attribute, rarities] of Object.entries(skillCardDatabase)) {
      // 遍历所有品阶
      for (const [rarity, cardList] of Object.entries(rarities as any)) {
        for (const rawCard of cardList as any[]) {
          const card = this.parseCard(rawCard, attribute as CardAttribute, enhanced);
          if (card) {
            cards.push(card);
          }
        }
      }
    }

    return cards;
  }

  /**
   * 按属性获取技能卡
   */
  static getCardsByAttribute(attribute: CardAttribute, enhanced: boolean = false): SkillCard[] {
    const cards: SkillCard[] = [];
    const attributeData = skillCardDatabase[attribute];

    if (!attributeData) return cards;

    for (const [rarity, cardList] of Object.entries(attributeData)) {
      for (const rawCard of cardList as any[]) {
        const card = this.parseCard(rawCard, attribute, enhanced);
        if (card) {
          cards.push(card);
        }
      }
    }

    return cards;
  }

  /**
   * 按品阶获取技能卡
   */
  static getCardsByRarity(rarityFilter: CardRarity, enhanced: boolean = false): SkillCard[] {
    const cards: SkillCard[] = [];

    for (const [attribute, rarities] of Object.entries(skillCardDatabase)) {
      const cardList = (rarities as any)[rarityFilter];
      if (cardList) {
        for (const rawCard of cardList) {
          const card = this.parseCard(rawCard, attribute as CardAttribute, enhanced);
          if (card) {
            cards.push(card);
          }
        }
      }
    }

    return cards;
  }

  /**
   * 随机抽取N张卡牌
   */
  static getRandomCards(count: number, enhanced: boolean = false): SkillCard[] {
    const allCards = this.parseAllCards(enhanced);
    const shuffled = allCards.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * 解析单张卡牌
   */
  private static parseCard(rawCard: any, attribute: CardAttribute, enhanced: boolean): SkillCard | null {
    try {
      const effectText = enhanced ? rawCard.effect_after : rawCard.effect_before;
      const effects = this.parseEffects(effectText, attribute);

      // 确定卡牌类型
      const type = this.determineCardType(effectText);

      // 检查是否"重复不可"
      const unique = effectText.includes('重複不可') || effectText.includes('レッスン中1回');

      // 获取Cost（已经是负数）
      const cost = -Math.abs(parseInt(rawCard.cost) || 0);

      // 确定Cost类型（默认为normal）
      const costType = this.determineCostType(effectText);

      // 生成卡牌ID
      const cardId = `${attribute}_${rawCard.rarity}_${rawCard.id}${enhanced ? '_enhanced' : ''}`;

      // 图片URL
      const imageUrl = `https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/技能卡卡面/${rawCard.name}.webp`;

      const card: SkillCard = {
        id: cardId,
        name: rawCard.name,
        rarity: rawCard.rarity as CardRarity,
        type,
        attribute,
        cost,
        costType,
        unique,
        enhanced,
        limitPerLesson: unique ? 1 : null,
        usedThisLesson: 0,
        effects,
        description: effectText,
        imageUrl,
        source: 'official',
      };

      return card;
    } catch (error) {
      console.error('[SkillCardParser] Error parsing card:', rawCard.name, error);
      return null;
    }
  }

  /**
   * 解析效果文本
   */
  private static parseEffects(effectText: string, attribute: CardAttribute): SkillCardEffect[] {
    const effects: SkillCardEffect[] = [];

    // ========== 属性增加 ==========
    const paramMatch = effectText.match(/パラメータ\+(\d+)/g);
    if (paramMatch) {
      for (const match of paramMatch) {
        const value = parseInt(match.match(/\d+/)![0]);
        effects.push({
          type: 'add_score',
          value: value, // 直接加分
        });
      }
    }

    // ========== 元气增加 ==========
    const genkiMatch = effectText.match(/元気\+(\d+)/);
    if (genkiMatch) {
      effects.push({
        type: 'gain_genki',
        value: parseInt(genkiMatch[1]),
      });
    }

    // ========== 体力回复 ==========
    const staminaMatch = effectText.match(/体力回復(\d+)/);
    if (staminaMatch) {
      effects.push({
        type: 'recover_stamina',
        value: parseInt(staminaMatch[1]),
      });
    }

    // ========== 全力值增加 ==========
    const allPowerMatch = effectText.match(/全力値\+(\d+)/);
    if (allPowerMatch) {
      effects.push({
        type: 'add_all_power',
        value: parseInt(allPowerMatch[1]),
      });
    }

    // ========== 抽牌 ==========
    const drawMatch = effectText.match(/スキルカードを(\d+)枚引く/);
    if (drawMatch) {
      effects.push({
        type: 'draw_cards',
        value: parseInt(drawMatch[1]),
      });
    }

    // ========== 额外使用次数 ==========
    const extraUseMatch = effectText.match(/スキルカード使用数追加\+(\d+)/);
    if (extraUseMatch) {
      effects.push({
        type: 'add_card_uses',
        value: parseInt(extraUseMatch[1]),
      });
    }

    // ========== 状态切换 ==========
    if (effectText.includes('温存に変更')) {
      const level = effectText.includes('温存2段階目') ? 2 : 1;
      effects.push({
        type: 'switch_anomaly_state',
        metadata: { newState: 'conserve', level },
      });
    }
    if (effectText.includes('強気に変更') || effectText.includes('強気2段階目')) {
      const level = effectText.includes('強気2段階目') ? 2 : 1;
      effects.push({
        type: 'switch_anomaly_state',
        metadata: { newState: 'resolute', level },
      });
    }

    // ========== Buff相关 ==========
    if (effectText.includes('消費体力減少')) {
      const durationMatch = effectText.match(/消費体力減少(\d+)ターン/);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 3;
      effects.push({
        type: 'add_buff',
        metadata: { type: '体力消耗减少', duration },
      });
    }

    // 如果没有解析到任何效果，添加一个默认效果
    if (effects.length === 0) {
      effects.push({
        type: 'add_score',
        value: 10,
        metadata: { rawText: effectText },
      });
    }

    return effects;
  }

  /**
   * 确定卡牌类型
   */
  private static determineCardType(effectText: string): 'A' | 'M' | 'T' {
    // 陷阱卡
    if (effectText.includes('陷阱') || effectText.includes('トラップ')) {
      return 'T';
    }

    // 精神型（通常有Buff、状态切换等）
    if (
      effectText.includes('好調') ||
      effectText.includes('集中') ||
      effectText.includes('好印象') ||
      effectText.includes('消費体力減少')
    ) {
      return 'M';
    }

    // 默认为主动型
    return 'A';
  }

  /**
   * 确定Cost类型
   */
  private static determineCostType(effectText: string): 'normal' | 'stamina_only' {
    // 如果明确提到消费体力，则为stamina_only
    if (effectText.includes('消費体力') || effectText.includes('体力消費')) {
      return 'stamina_only';
    }
    return 'normal';
  }

  /**
   * 映射属性到V/D/V
   */
  private static mapAttributeToVDV(attribute: CardAttribute): 'vocal' | 'dance' | 'visual' {
    switch (attribute) {
      case '感性':
        return 'vocal';
      case '理性':
        return 'dance';
      case '非凡':
        return 'visual';
      case '自由':
        return 'vocal'; // 自由卡默认映射到vocal
      default:
        return 'vocal';
    }
  }

  /**
   * 获取统计信息
   */
  static getStatistics(): {
    totalCards: number;
    byAttribute: Record<string, number>;
    byRarity: Record<string, number>;
  } {
    const allCards = this.parseAllCards(false);

    const byAttribute: Record<string, number> = {};
    const byRarity: Record<string, number> = {};

    for (const card of allCards) {
      byAttribute[card.attribute] = (byAttribute[card.attribute] || 0) + 1;
      byRarity[card.rarity] = (byRarity[card.rarity] || 0) + 1;
    }

    return {
      totalCards: allCards.length,
      byAttribute,
      byRarity,
    };
  }
}

/**
 * 导出便捷方法
 */

/**
 * 获取所有技能卡（未强化）
 */
export function getAllSkillCards(): SkillCard[] {
  return SkillCardParser.parseAllCards(false);
}

/**
 * 获取所有技能卡（已强化）
 */
export function getAllEnhancedSkillCards(): SkillCard[] {
  return SkillCardParser.parseAllCards(true);
}

/**
 * 创建初始牌组（30张）
 */
export function createStarterDeck(): SkillCard[] {
  const n_cards = SkillCardParser.getCardsByRarity('N', false);
  const r_cards = SkillCardParser.getCardsByRarity('R', false);

  // 20张N卡 + 10张R卡
  const deck: SkillCard[] = [];

  // 随机选20张N卡
  const shuffledN = n_cards.sort(() => Math.random() - 0.5);
  deck.push(...shuffledN.slice(0, 20));

  // 随机选10张R卡
  const shuffledR = r_cards.sort(() => Math.random() - 0.5);
  deck.push(...shuffledR.slice(0, 10));

  return deck;
}

/**
 * 创建高级牌组（包含SSR）
 */
export function createAdvancedDeck(): SkillCard[] {
  const sr_cards = SkillCardParser.getCardsByRarity('SR', false);
  const ssr_cards = SkillCardParser.getCardsByRarity('SSR', false);
  const r_cards = SkillCardParser.getCardsByRarity('R', false);

  const deck: SkillCard[] = [];

  // 5张SSR + 10张SR + 15张R
  const shuffledSSR = ssr_cards.sort(() => Math.random() - 0.5);
  deck.push(...shuffledSSR.slice(0, 5));

  const shuffledSR = sr_cards.sort(() => Math.random() - 0.5);
  deck.push(...shuffledSR.slice(0, 10));

  const shuffledR = r_cards.sort(() => Math.random() - 0.5);
  deck.push(...shuffledR.slice(0, 15));

  return deck;
}
