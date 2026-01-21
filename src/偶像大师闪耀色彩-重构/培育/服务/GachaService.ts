/**
 * 副本内抽卡服务
 * 根据培育角色的属性类型筛选可用的技能卡和饮料
 */

import { P_DRINK_DATABASE, P_DRINKS_BY_TYPE } from '../../战斗/数据/P饮料数据库';
import skillCardsData from '../../战斗/数据/技能卡库.json';
import type { PDrink, PDrinkRarity } from '../../战斗/类型/P饮料类型';
import type { AttributeType } from '../../类型/卡牌属性类型';

// ============ 类型定义 ============

export type SkillCardRarity = 'R' | 'SR' | 'SSR';
export type SkillCardCategory = '感性' | '理性' | '非凡' | '自由';

export interface SkillCard {
  id: string;
  name: string;
  rarity: string;
  type: '主动' | '精神';
  cost: string;
  effect_before: string;
  effect_after: string;
  effectEntries: any[];
  effectEntriesEnhanced: any[];
  restrictions: {
    isDuplicatable: boolean;
    usesPerBattle: number | null;
  };
  flavor: string;
  // T8: engine_data 移除，由 ProduceHostCore.convertToSkillCardV2 从 effectEntries 生成
  display?: {
    name: string;
    nameJP?: string;
    description: string;
    flavor?: string;
  };
  visual_hint?: any;
}

export interface GachaContext {
  attributeType: AttributeType; // 培育角色属性（从选中P卡获取）
  week: number; // 当前周数 (1-12)
  isSPLesson?: boolean; // 是否为SP课程
  currentDeck?: string[]; // 当前卡组中的卡名列表，用于检查重复
}

export interface GachaResult<T> {
  item: T;
  pool: T[]; // 可选的其他候选项（用于三选一等场景）
}

// ============ 技能卡库解析 ============

const SKILL_CARDS_BY_CATEGORY: Record<SkillCardCategory, Record<SkillCardRarity, SkillCard[]>> = {
  感性: { R: [], SR: [], SSR: [] },
  理性: { R: [], SR: [], SSR: [] },
  非凡: { R: [], SR: [], SSR: [] },
  自由: { R: [], SR: [], SSR: [] },
};

// 初始化技能卡分类
function initSkillCards() {
  const data = skillCardsData as unknown as Record<string, Record<string, SkillCard[]>>;

  for (const [category, rarities] of Object.entries(data)) {
    const cat = category as SkillCardCategory;
    if (!SKILL_CARDS_BY_CATEGORY[cat]) continue;

    for (const [rarity, cards] of Object.entries(rarities)) {
      const r = rarity as SkillCardRarity;
      if (r === 'R' || r === 'SR' || r === 'SSR') {
        SKILL_CARDS_BY_CATEGORY[cat][r] = cards;
      }
    }
  }

  console.log('🎴 技能卡库初始化完成:', {
    感性: Object.values(SKILL_CARDS_BY_CATEGORY['感性']).flat().length,
    理性: Object.values(SKILL_CARDS_BY_CATEGORY['理性']).flat().length,
    非凡: Object.values(SKILL_CARDS_BY_CATEGORY['非凡']).flat().length,
    自由: Object.values(SKILL_CARDS_BY_CATEGORY['自由']).flat().length,
  });
}

initSkillCards();

// ============ 稀有度计算 ============

/**
 * 计算技能卡掉落稀有度
 */
export function rollCardRarity(week: number, isSPLesson: boolean = false): SkillCardRarity {
  let weights = { R: 85, SR: 14, SSR: 1 }; // 前期 (1-4周)

  if (week > 8) {
    weights = { R: 40, SR: 50, SSR: 10 }; // 后期 (9-12周)
  } else if (week > 4) {
    weights = { R: 60, SR: 35, SSR: 5 }; // 中期 (5-8周)
  }

  // SP课程加成
  if (isSPLesson) {
    weights.SSR = Math.min(100, weights.SSR * 2);
    weights.SR = Math.min(100, weights.SR + 20);
    weights.R = Math.max(0, 100 - weights.SSR - weights.SR);
  }

  const roll = Math.random() * 100;
  if (roll < weights.SSR) return 'SSR';
  if (roll < weights.SSR + weights.SR) return 'SR';
  return 'R';
}

/**
 * 计算饮料掉落稀有度
 */
export function rollDrinkRarity(week: number): PDrinkRarity {
  let weights = { 普通: 70, 高级: 28, 特级: 2 }; // 前期

  if (week > 8) {
    weights = { 普通: 30, 高级: 50, 特级: 20 }; // 后期
  } else if (week > 4) {
    weights = { 普通: 50, 高级: 40, 特级: 10 }; // 中期
  }

  const roll = Math.random() * 100;
  if (roll < weights.特级) return '特级';
  if (roll < weights.特级 + weights.高级) return '高级';
  return '普通';
}

// ============ 卡池获取 ============

/**
 * 获取可用技能卡池（角色属性 + 自由）
 */
export function getAvailableSkillCards(attributeType: AttributeType, rarity: SkillCardRarity): SkillCard[] {
  const attributeCards = SKILL_CARDS_BY_CATEGORY[attributeType]?.[rarity] || [];
  const freeCards = SKILL_CARDS_BY_CATEGORY['自由']?.[rarity] || [];
  return [...attributeCards, ...freeCards];
}

/**
 * 获取可用饮料池（角色属性专属 + 通用）
 */
export function getAvailableDrinks(attributeType: AttributeType, rarity: PDrinkRarity): PDrink[] {
  const exclusiveTypeName = `${attributeType}专属` as const;

  const exclusiveDrinks = P_DRINKS_BY_TYPE[exclusiveTypeName]?.filter(d => d.rarity === rarity) || [];
  const commonDrinks = P_DRINKS_BY_TYPE['通用']?.filter(d => d.rarity === rarity) || [];

  return [...exclusiveDrinks, ...commonDrinks];
}

// ============ 抽卡函数 ============

/**
 * 抽取一张技能卡
 */
export function rollSkillCard(context: GachaContext): GachaResult<SkillCard> {
  const rarity = rollCardRarity(context.week, context.isSPLesson);
  const pool = getAvailableSkillCards(context.attributeType, rarity);

  if (pool.length === 0) {
    throw new Error(`No skill cards available for ${context.attributeType} ${rarity}`);
  }

  const item = pool[Math.floor(Math.random() * pool.length)];

  console.log(`🎴 抽取技能卡: [${rarity}] ${item.name} (${context.attributeType})`);

  return { item, pool };
}

/**
 * 抽取多张技能卡供选择（三选一场景）
 * 每张卡独立抽取稀有度，可能出现 R+SR+SSR 混合
 * 会检查 isDuplicatable: false 的卡是否已在卡组中
 */
export function rollSkillCardSelection(context: GachaContext, count: number = 3): SkillCard[] {
  const result: SkillCard[] = [];
  const usedNames = new Set<string>();
  const deckCardNames = new Set(context.currentDeck || []);

  for (let i = 0; i < count; i++) {
    // 每张卡独立抽取稀有度
    const rarity = rollCardRarity(context.week, context.isSPLesson);
    const pool = getAvailableSkillCards(context.attributeType, rarity);

    if (pool.length === 0) continue;

    // 从池中找一张未重复且符合条件的卡
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const card of shuffled) {
      // 检查本次选项中是否已使用
      if (usedNames.has(card.name)) continue;

      // 检查 isDuplicatable
      // 如果卡片不可重复 (isDuplicatable: false) 且已在卡组中，跳过
      const isDuplicatable = card.restrictions?.isDuplicatable !== false;
      if (!isDuplicatable && deckCardNames.has(card.name)) {
        console.log(`⚠️ 跳过不可重复卡: ${card.name} (已在卡组中)`);
        continue;
      }

      result.push(card);
      usedNames.add(card.name);
      break;
    }
  }

  console.log(
    `🎴 生成技能卡选项:`,
    result.map(c => `[${c.rarity}] ${c.name} (dup:${c.restrictions?.isDuplicatable !== false})`),
  );
  return result;
}

/**
 * 抽取一个饮料
 */
export function rollDrink(context: GachaContext): GachaResult<PDrink> {
  const rarity = rollDrinkRarity(context.week);
  const pool = getAvailableDrinks(context.attributeType, rarity);

  if (pool.length === 0) {
    // 如果该稀有度没有对应饮料，降级到普通
    const fallbackPool = getAvailableDrinks(context.attributeType, '普通');
    if (fallbackPool.length === 0) {
      throw new Error(`No drinks available for ${context.attributeType}`);
    }
    const item = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
    return { item, pool: fallbackPool };
  }

  const item = pool[Math.floor(Math.random() * pool.length)];

  console.log(`🍹 抽取饮料: [${rarity}] ${item.nameCN} (${context.attributeType})`);

  return { item, pool };
}

/**
 * 抽取多个饮料供选择（三选一场景）
 * 每个饮料独立抽取稀有度
 */
export function rollDrinkSelection(context: GachaContext, count: number = 3): PDrink[] {
  const result: PDrink[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    // 每个饮料独立抽取稀有度
    const rarity = rollDrinkRarity(context.week);
    let pool = getAvailableDrinks(context.attributeType, rarity);

    // 如果该稀有度没有饮料，尝试普通稀有度
    if (pool.length === 0) {
      pool = getAvailableDrinks(context.attributeType, '普通');
    }

    if (pool.length === 0) continue;

    // 从池中找一个未重复的饮料
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    for (const drink of shuffled) {
      if (!usedIds.has(drink.id)) {
        result.push(drink);
        usedIds.add(drink.id);
        break;
      }
    }
  }

  console.log(
    `🍹 生成饮料选项:`,
    result.map(d => `[${d.rarity}] ${d.nameCN}`),
  );
  return result;
}

// ============ 统计信息 ============

export const GACHA_STATS = {
  skillCards: {
    感性: Object.values(SKILL_CARDS_BY_CATEGORY['感性']).flat().length,
    理性: Object.values(SKILL_CARDS_BY_CATEGORY['理性']).flat().length,
    非凡: Object.values(SKILL_CARDS_BY_CATEGORY['非凡']).flat().length,
    自由: Object.values(SKILL_CARDS_BY_CATEGORY['自由']).flat().length,
  },
  drinks: {
    total: P_DRINK_DATABASE.length,
    byType: {
      通用: P_DRINKS_BY_TYPE['通用'].length,
      感性专属: P_DRINKS_BY_TYPE['感性专属'].length,
      理性专属: P_DRINKS_BY_TYPE['理性专属'].length,
      非凡专属: P_DRINKS_BY_TYPE['非凡专属'].length,
    },
  },
};
