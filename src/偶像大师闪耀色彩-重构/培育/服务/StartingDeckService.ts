/**
 * 起始卡组服务
 * 根据P卡属性和推荐流派配置副本起始技能卡
 */

import { loadSkillCard } from '../../图鉴/服务/图鉴服务';
import skillCardsData from '../../战斗/数据/技能卡库.json';
import type { AttributeType, RecommendedStyle } from '../../类型/卡牌属性类型';

// ============ 类型定义 ============

export interface DeckSkillCard {
  id: string;
  name: string;
  rarity: string;
  type: '主动' | '精神';
  cost: string;
  effectEntries: Array<{ icon: string; effect: string; isConsumption?: boolean }>;
  effectEntriesEnhanced: Array<{ icon: string; effect: string; isConsumption?: boolean }>;
  isEnhanced: boolean; // 是否已强化
  imageUrl: string; // 卡面URL
  isAIGenerated?: boolean; // 是否为AI生成的专属卡
}

export interface StartingDeckConfig {
  attributeType: AttributeType;
  recommendedStyle: RecommendedStyle;
  pCardFullName: string; // P卡全名，用于读取AI技能卡
}

// ============ 起始卡配置 ============

/** 基础卡 - 感性/理性 */
const BASE_CARDS_SENSE_LOGIC = [
  { name: 'アピールの基本', count: 2 },
  { name: 'ポーズの基本', count: 1 },
  { name: '表現の基本', count: 2 },
];

/** 基础卡 - 非凡 */
const BASE_CARDS_ANOMALY = [
  { name: 'アピールの基本', count: 2 },
  { name: '表現の基本', count: 2 },
];

/** 流派专属卡 */
const STYLE_CARDS: Record<RecommendedStyle, Array<{ name: string; count: number }>> = {
  好调: [
    { name: '振る舞いの基本', count: 2 },
    { name: '挑戦', count: 1 },
  ],
  集中: [
    { name: '表情の基本', count: 2 },
    { name: '試行錯誤', count: 1 },
  ],
  好印象: [
    { name: '目線の基本', count: 2 },
    { name: '可愛い仕草', count: 1 },
  ],
  干劲: [
    { name: '意識の基本', count: 2 },
    { name: '気分転換', count: 1 },
  ],
  坚决: [
    { name: 'イメージの基本', count: 2 },
    { name: '挨拶の基本', count: 1 },
    { name: 'はげしく', count: 1 },
  ],
  全力: [
    { name: 'メントレの基本', count: 2 },
    { name: 'スパート', count: 1 },
    { name: 'イメージの基本', count: 1 },
  ],
};

// 技能卡卡面CDN
const SKILL_CARD_CDN = 'https://283pro.site/shinycolors/技能卡卡面';

// ============ 辅助函数 ============

/**
 * 从技能卡库中查找卡片（N卡在自由分类）
 */
function findCardInDatabase(cardName: string): any | null {
  const data = skillCardsData as Record<string, Record<string, any[]>>;

  // N卡通常在自由分类
  const categories = ['自由', '感性', '理性', '非凡'];
  for (const category of categories) {
    if (data[category]?.['N']) {
      const card = data[category]['N'].find(c => c.name === cardName);
      if (card) return card;
    }
    // 也检查R卡
    if (data[category]?.['R']) {
      const card = data[category]['R'].find(c => c.name === cardName);
      if (card) return card;
    }
  }

  return null;
}

/**
 * 将数据库卡片转换为DeckSkillCard
 */
function toDeckCard(dbCard: any, isEnhanced: boolean = false): DeckSkillCard {
  return {
    id: dbCard.id || `card_${dbCard.name}`,
    name: dbCard.name,
    rarity: dbCard.rarity || 'N',
    type: dbCard.type || '主动',
    cost: dbCard.cost || '0',
    effectEntries: dbCard.effectEntries || [],
    effectEntriesEnhanced: dbCard.effectEntriesEnhanced || dbCard.effectEntries || [],
    isEnhanced,
    imageUrl: `${SKILL_CARD_CDN}/${encodeURIComponent(dbCard.name)}.webp`,
  };
}

// ============ 主函数 ============

/**
 * 获取起始卡组
 */
export function getStartingDeck(config: StartingDeckConfig): {
  deck: DeckSkillCard[];
  aiCardMissing: boolean;
} {
  const deck: DeckSkillCard[] = [];

  // 1. 添加基础卡
  const baseCards = config.attributeType === '非凡' ? BASE_CARDS_ANOMALY : BASE_CARDS_SENSE_LOGIC;

  for (const { name, count } of baseCards) {
    const dbCard = findCardInDatabase(name);
    if (dbCard) {
      for (let i = 0; i < count; i++) {
        deck.push(toDeckCard(dbCard, false)); // 未强化
      }
    } else {
      console.warn(`[StartingDeck] 未找到基础卡: ${name}`);
    }
  }

  // 2. 添加流派专属卡
  const styleCards = STYLE_CARDS[config.recommendedStyle] || [];
  for (const { name, count } of styleCards) {
    const dbCard = findCardInDatabase(name);
    if (dbCard) {
      for (let i = 0; i < count; i++) {
        deck.push(toDeckCard(dbCard, false)); // 未强化
      }
    } else {
      console.warn(`[StartingDeck] 未找到流派卡: ${name}`);
    }
  }

  // 3. 尝试添加AI生成的专属卡
  let aiCardMissing = false;
  const aiSkill = loadSkillCard(config.pCardFullName);

  if (aiSkill) {
    // AI卡图使用完整P卡名的觉醒缩略图
    // 文件格式: 【卡片名】角色名_觉醒后.webp
    const aiCardImageUrl = `https://283pro.site/shinycolors/角色缩略图/${encodeURIComponent(config.pCardFullName)}_觉醒后.webp`;

    console.log('[StartingDeck] AI卡图片URL:', aiCardImageUrl);

    deck.push({
      id: `ai_${config.pCardFullName}`,
      name: (aiSkill as any).nameCN || (aiSkill as any).name || '专属技能',
      rarity: 'SSR',
      type: (aiSkill as any).type || '主动',
      cost: (aiSkill as any).cost || '3',
      effectEntries: (aiSkill as any).effectEntries || [],
      effectEntriesEnhanced: (aiSkill as any).effectEntriesEnhanced || [],
      isEnhanced: false, // 默认未强化，后续可根据升星调整
      imageUrl: aiCardImageUrl,
      isAIGenerated: true,
    });
  } else {
    aiCardMissing = true;
    console.log(`[StartingDeck] AI技能卡未生成: ${config.pCardFullName}`);
  }

  console.log(
    `[StartingDeck] 起始卡组: ${deck.length}张`,
    deck.map(c => c.name),
  );

  return { deck, aiCardMissing };
}

/**
 * 获取起始卡组摘要
 */
export function getStartingDeckSummary(config: StartingDeckConfig): string {
  const { deck, aiCardMissing } = getStartingDeck(config);
  const cardNames = deck.map(c => c.name);
  const uniqueCards = [...new Set(cardNames)];
  return `${deck.length}张卡 (${uniqueCards.join(', ')})${aiCardMissing ? ' [缺AI卡]' : ''}`;
}
