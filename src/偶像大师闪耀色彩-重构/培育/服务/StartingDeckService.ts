/**
 * 起始卡组服务
 * 根据P卡属性和推荐流派配置副本起始技能卡
 */

import { loadSkillCard } from '../../图鉴/服务/图鉴服务';
import { getThumbnailUrl } from '../../工具/cdn-config';
import skillCardsData from '../../战斗/数据/技能卡库.json';
import type { AttributeType, RecommendedStyle } from '../../类型/卡牌属性类型';

// T1: 模块级实例 ID 计数器，确保每张卡牌在会话内有唯一 ID
// T1-refactor: 改为会话隔离的 Map
const counterBySession = new Map<string, number>();

/**
 * T1: 重置卡牌实例 ID 计数器
 * @param sessionId 指定会话 ID 清零，不传则清空所有
 */
export function resetDeckCardIdCounter(sessionId?: string): void {
  if (sessionId) {
    counterBySession.delete(sessionId);
  } else {
    counterBySession.clear();
  }
}

/**
 * T1: 生成唯一的卡牌实例 ID
 * @param baseId 原始卡牌 ID（如 LN_001 或 item.id）
 * @param sessionId 会话 ID（必填）
 * @returns 唯一实例 ID（如 sess_xxx__LN_001__1）
 */
export function generateDeckCardId(baseId: string, sessionId: string): string {
  const next = (counterBySession.get(sessionId) ?? 0) + 1;
  counterBySession.set(sessionId, next);
  return `${sessionId}__${baseId}__${next}`;
}

// ============ 类型定义 ============

export interface DeckSkillCard {
  id: string; // T1: 实例 ID（如 LN_001_1），用于 Vue key
  originalId?: string; // T1: 原始卡牌 ID（如 LN_001），用于映射回 SkillCardV2
  name: string;
  rarity: string;
  type: '主动' | '精神';
  plan?: string;
  cost: string;
  effectEntries: Array<{ icon: string; effect: string; isConsumption?: boolean }>;
  effectEntriesEnhanced: Array<{ icon: string; effect: string; isConsumption?: boolean }>;
  isEnhanced: boolean; // 是否已强化
  imageUrl: string; // 卡面URL
  isAIGenerated?: boolean; // 是否为AI生成的专属卡
  restrictions?: {
    uses_per_battle?: number; // 每场战斗可用次数
    is_unique?: boolean; // 不可重复
  };

  // ==================== NG 引擎字段 ====================

  /** NG 引擎执行数据（AI 生成时必填，旧卡可选） */
  engine_data?: {
    cost: { genki: number };
    logic_chain: any[];
    logic_chain_enhanced?: any[];
    constraints?: { exhaust_on_play?: boolean };
  };

  /** 显示信息（用于 UI 展示） */
  display?: {
    name: string;
    nameJP?: string;
    description: string;
    flavor?: string;
  };

  /** 视觉提示（用于自定义标签/Buff 的 UI 显示） */
  visual_hint?: {
    key: string;
    kind?: 'tag' | 'buff';
    symbol: string;
    color: string;
    isDebuff: boolean;
    shortName: string;
    description: string;
  };
}

export interface StartingDeckConfig {
  attributeType: AttributeType;
  recommendedStyle: RecommendedStyle;
  pCardFullName: string; // P卡全名，用于读取AI技能卡
  sessionId: string; // T1: 会话 ID，用于生成唯一实例 ID
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
 * @param sessionId T1: 会话 ID
 */
function toDeckCard(dbCard: any, sessionId: string, isEnhanced: boolean = false): DeckSkillCard {
  // 映射 usesPerBattle -> restrictions.uses_per_battle
  const restrictions: DeckSkillCard['restrictions'] = {};
  if (dbCard.restrictions?.usesPerBattle != null) {
    restrictions.uses_per_battle = dbCard.restrictions.usesPerBattle;
  } else if (dbCard.usesPerBattle != null) {
    restrictions.uses_per_battle = dbCard.usesPerBattle;
  }
  if (dbCard.restrictions?.uses_per_battle != null) {
    restrictions.uses_per_battle = dbCard.restrictions.uses_per_battle; // 已有则不覆盖前面的
  }
  if (dbCard.restrictions?.isDuplicatable === false || dbCard.restrictions?.is_unique === true) {
    restrictions.is_unique = true;
  }
  // T-15: 保留 NG 引擎字段，否则战斗时无法正确执行卡牌效果
  // T1: 生成唯一实例 ID，防止 Vue key 冲突
  const baseId = dbCard.id || `card_${dbCard.name}`;
  const instanceId = generateDeckCardId(baseId, sessionId);

  return {
    id: instanceId,
    originalId: baseId, // T1: 保留原始 ID 用于映射
    name: dbCard.name,
    rarity: dbCard.rarity || 'N',
    type: dbCard.type || '主动',
    plan: dbCard.plan,
    cost: dbCard.cost || '0',
    effectEntries: dbCard.effectEntries || [],
    effectEntriesEnhanced: dbCard.effectEntriesEnhanced || dbCard.effectEntries || [],
    isEnhanced,
    imageUrl: `${SKILL_CARD_CDN}/${encodeURIComponent(dbCard.name)}.webp`,
    restrictions: Object.keys(restrictions).length > 0 ? restrictions : undefined,
    // T-15: NG 引擎必需字段
    engine_data: dbCard.engine_data,
    display: dbCard.display,
    visual_hint: dbCard.visual_hint,
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
        deck.push(toDeckCard(dbCard, config.sessionId, false)); // 未强化
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
        deck.push(toDeckCard(dbCard, config.sessionId, false)); // 未强化
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
    const aiCardImageUrl = getThumbnailUrl(config.pCardFullName, true);

    console.log('[StartingDeck] AI卡图片URL:', aiCardImageUrl);

    // T1: AI卡也使用唯一实例 ID
    const aiBaseId = `ai_${config.pCardFullName}`;

    deck.push({
      id: generateDeckCardId(aiBaseId, config.sessionId),
      originalId: config.pCardFullName, // T1: 原始 ID 不带 ai_ 前缀，以便匹配
      name: (aiSkill as any).nameCN || (aiSkill as any).name || '专属技能',
      rarity: 'SSR',
      type: (aiSkill as any).type || '主动',
      plan: (aiSkill as any).plan || (aiSkill as any).producePlan,
      cost: (aiSkill as any).cost || '3',
      effectEntries: (aiSkill as any).effectEntries || [],
      effectEntriesEnhanced: (aiSkill as any).effectEntriesEnhanced || [],
      isEnhanced: false, // 默认未强化，后续可根据升星调整
      imageUrl: aiCardImageUrl,
      isAIGenerated: true,
      // T5: 保留 NG 引擎字段
      engine_data: (aiSkill as any).engine_data,
      display: (aiSkill as any).display,
      visual_hint: (aiSkill as any).visual_hint,
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
 * 获取起始卡组摘要（不实际生成卡组）
 * T3-fix: 不调用 getStartingDeck，避免 sessionId 要求
 */
export function getStartingDeckSummary(config: Omit<StartingDeckConfig, 'sessionId'>): string {
  // 计算卡片数量而不实际生成
  const baseCards = config.attributeType === '非凡' ? BASE_CARDS_ANOMALY : BASE_CARDS_SENSE_LOGIC;
  const styleCards = STYLE_CARDS[config.recommendedStyle] || [];

  const baseCount = baseCards.reduce((sum, c) => sum + c.count, 0);
  const styleCount = styleCards.reduce((sum, c) => sum + c.count, 0);
  const aiCardCount = 1; // 假设有 AI 卡

  const totalCount = baseCount + styleCount + aiCardCount;
  const cardNames = [...baseCards.map(c => c.name), ...styleCards.map(c => c.name), `${config.pCardFullName} 专属`];

  return `${totalCount}张卡 (${[...new Set(cardNames)].join(', ')})`;
}
