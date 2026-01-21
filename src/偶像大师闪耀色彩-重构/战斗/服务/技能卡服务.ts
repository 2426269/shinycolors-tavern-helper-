/**
 * 技能卡服务
 * 提供技能卡的筛选、搜索、强化等功能
 */

import skillCardsData from '../数据/技能卡库.json';
import type { ProducePlan, SkillCard, SkillCardFilter, SkillCardRarity } from '../类型/技能卡类型';

// 技能卡库按培育计划索引
const SKILL_CARD_LIBRARY: Record<ProducePlan, SkillCard[]> = {
  非凡: [],
  理性: [],
  感性: [],
  自由: [],
};

// 从 JSON 数据构建卡库
const planMapping: Record<string, ProducePlan> = {
  非凡: '非凡',
  理性: '理性',
  感性: '感性',
  自由: '自由',
};

for (const [planKey, rarities] of Object.entries(skillCardsData)) {
  const plan = planMapping[planKey];
  if (plan && typeof rarities === 'object') {
    for (const cards of Object.values(rarities as Record<string, unknown[]>)) {
      if (Array.isArray(cards)) {
        for (const card of cards) {
          const skillCard = card as SkillCard;
          // 设置 plan 字段
          skillCard.plan = plan;
          // 映射 type 到 cardType
          if (!skillCard.cardType && skillCard.type) {
            skillCard.cardType = skillCard.type === '主动' ? 'A' : skillCard.type === '精神' ? 'M' : 'A';
          }
          SKILL_CARD_LIBRARY[plan].push(skillCard);
        }
      }
    }
  }
}

/**
 * 获取所有技能卡
 */
export function getAllSkillCards(): SkillCard[] {
  return Object.values(SKILL_CARD_LIBRARY).flat();
}

/**
 * 根据培育计划获取技能卡
 */
export function getSkillCardsByPlan(plan: ProducePlan): SkillCard[] {
  return [...SKILL_CARD_LIBRARY[plan]];
}

/**
 * 根据稀有度筛选技能卡
 */
export function getSkillCardsByRarity(rarity: SkillCardRarity, plan?: ProducePlan): SkillCard[] {
  const cards = plan ? getSkillCardsByPlan(plan) : getAllSkillCards();
  return cards.filter((card: SkillCard) => card.rarity === rarity);
}

/**
 * 根据ID查找技能卡
 */
export function getSkillCardById(id: string): SkillCard | undefined {
  return getAllSkillCards().find((card: SkillCard) => card.id === id);
}

/**
 * 根据名称查找技能卡
 */
export function getSkillCardsByName(name: string, exactMatch: boolean = false): SkillCard[] {
  const all = getAllSkillCards();
  if (exactMatch) {
    return all.filter((card: SkillCard) => card.name === name);
  }
  return all.filter((card: SkillCard) => card.name.includes(name));
}

/**
 * 筛选技能卡
 */
export function filterSkillCards(filter: SkillCardFilter): SkillCard[] {
  let cards = getAllSkillCards();

  // 按稀有度筛选
  if (filter.rarity) {
    const rarities = Array.isArray(filter.rarity) ? filter.rarity : [filter.rarity];
    cards = cards.filter((card: SkillCard) => rarities.includes(card.rarity));
  }

  // 按培育计划筛选
  if (filter.plan) {
    const plans = Array.isArray(filter.plan) ? filter.plan : [filter.plan];
    cards = cards.filter((card: SkillCard) => plans.includes(card.plan));
  }

  // 按卡牌类型筛选
  if (filter.cardType) {
    const types = Array.isArray(filter.cardType) ? filter.cardType : [filter.cardType];
    cards = cards.filter((card: SkillCard) => types.includes(card.cardType));
  }

  // 按强化状态筛选
  if (filter.enhanced !== undefined) {
    cards = cards.filter((card: SkillCard) => card.enhanced === filter.enhanced);
  }

  // 按专属卡筛选
  if (filter.isExclusive !== undefined) {
    cards = cards.filter((card: SkillCard) => card.isExclusive === filter.isExclusive);
  }

  // 按关键词搜索
  if (filter.keyword) {
    const keyword = filter.keyword.toLowerCase();
    cards = cards.filter(
      (card: SkillCard) =>
        card.name.toLowerCase().includes(keyword) ||
        card.effect_before.toLowerCase().includes(keyword) ||
        card.effect_after.toLowerCase().includes(keyword),
    );
  }

  return cards;
}

/**
 * 强化技能卡
 */
export function enhanceSkillCard(card: SkillCard): SkillCard {
  if (card.enhanced) {
    console.warn(`技能卡 "${card.name}" 已经强化过了`);
    return card;
  }

  if (card.cardType === 'T') {
    console.warn(`陷阱卡 "${card.name}" 无法强化`);
    return card;
  }

  return {
    ...card,
    enhanced: true,
  };
}

/**
 * 获取技能卡当前效果描述
 */
export function getSkillCardEffect(card: SkillCard): string {
  return card.enhanced ? card.effect_after : card.effect_before;
}

/**
 * 随机获取技能卡
 * @param count 数量
 * @param filter 筛选条件
 */
export function getRandomSkillCards(count: number, filter?: SkillCardFilter): SkillCard[] {
  const pool = filter ? filterSkillCards(filter) : getAllSkillCards();

  if (pool.length === 0) {
    return [];
  }

  const result: SkillCard[] = [];
  const poolCopy = [...pool];

  for (let i = 0; i < count && poolCopy.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * poolCopy.length);
    result.push(poolCopy[randomIndex]);
    poolCopy.splice(randomIndex, 1);
  }

  return result;
}

/**
 * 克隆技能卡 (用于创建独立实例)
 */
export function cloneSkillCard(card: SkillCard): SkillCard {
  return { ...card };
}

/**
 * 根据培育计划推荐技能卡 (SSR/SR卡为主)
 */
export function getRecommendedSkillCards(plan: ProducePlan, count: number = 10): SkillCard[] {
  const planCards = getSkillCardsByPlan(plan);

  // 优先推荐SSR和SR卡
  const ssrCards = planCards.filter(c => c.rarity === 'SSR');
  const srCards = planCards.filter(c => c.rarity === 'SR');

  const recommended: SkillCard[] = [];

  // 先添加部分SSR
  const ssrCount = Math.min(Math.ceil(count / 2), ssrCards.length);
  for (let i = 0; i < ssrCount; i++) {
    const randomIndex = Math.floor(Math.random() * ssrCards.length);
    recommended.push(ssrCards[randomIndex]);
    ssrCards.splice(randomIndex, 1);
  }

  // 再添加SR
  const srCount = Math.min(count - recommended.length, srCards.length);
  for (let i = 0; i < srCount; i++) {
    const randomIndex = Math.floor(Math.random() * srCards.length);
    recommended.push(srCards[randomIndex]);
    srCards.splice(randomIndex, 1);
  }

  // 如果还不够,添加R卡
  if (recommended.length < count) {
    const rCards = planCards.filter(c => c.rarity === 'R');
    const remaining = count - recommended.length;
    for (let i = 0; i < remaining && rCards.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * rCards.length);
      recommended.push(rCards[randomIndex]);
      rCards.splice(randomIndex, 1);
    }
  }

  return recommended;
}

/**
 * 解析成本字符串为数值
 * @example "3" -> 3, "0" -> 0, "-5" -> -5
 */
export function parseCost(costString: string): number {
  // 移除所有空格
  const cleaned = costString.trim();

  // 解析数字
  const num = parseInt(cleaned, 10);

  return isNaN(num) ? 0 : num;
}

/**
 * 判断技能卡是否可以使用
 * @param card 技能卡
 * @param currentResources 当前资源 (元气、体力等)
 */
export function canUseSkillCard(
  card: SkillCard,
  currentResources: { energy: number; stamina: number; goodImpression?: number },
): boolean {
  const cost = parseCost(card.cost);

  // 如果成本为0或负数(提供资源),总是可以使用
  if (cost <= 0) {
    return true;
  }

  // 检查是否有消费体力的特殊标记
  const effect = getSkillCardEffect(card);
  if (effect.includes('体力消費') || effect.includes('体力消费')) {
    return currentResources.stamina >= cost;
  }

  // 检查是否消费好印象
  if (effect.includes('好印象消費') || effect.includes('好印象消费')) {
    return (currentResources.goodImpression || 0) >= cost;
  }

  // 默认优先消耗元气
  return currentResources.energy >= cost || currentResources.stamina >= cost;
}
