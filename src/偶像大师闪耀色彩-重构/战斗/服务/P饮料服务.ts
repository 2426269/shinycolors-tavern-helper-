/**
 * P饮料服务
 * 提供P饮料的查询、筛选、使用等功能
 */

import { P_DRINKS_BY_RARITY, P_DRINKS_BY_TYPE, P_DRINK_DATABASE } from '../数据/P饮料数据库';
import type { PDrink, PDrinkFilter, PDrinkRarity, PDrinkType, PlayerPDrink } from '../类型/P饮料类型';
import type { ProducePlan } from '../类型/技能卡类型';

/**
 * 获取所有P饮料
 */
export function getAllPDrinks(): PDrink[] {
  return [...P_DRINK_DATABASE];
}

/**
 * 按类型获取P饮料
 */
export function getPDrinksByType(type: PDrinkType): PDrink[] {
  return [...P_DRINKS_BY_TYPE[type]];
}

/**
 * 按稀有度获取P饮料
 */
export function getPDrinksByRarity(rarity: PDrinkRarity): PDrink[] {
  return [...P_DRINKS_BY_RARITY[rarity]];
}

/**
 * 按培育计划获取可用的P饮料
 * @param plan 培育计划
 * @returns 通用饮料 + 该计划专属饮料
 */
export function getPDrinksForPlan(plan: ProducePlan): PDrink[] {
  const commonDrinks = getPDrinksByType('通用');
  const exclusiveDrinks = P_DRINK_DATABASE.filter(d => d.exclusivePlan === plan);
  return [...commonDrinks, ...exclusiveDrinks];
}

/**
 * 根据ID查找P饮料
 */
export function getPDrinkById(id: string): PDrink | undefined {
  return P_DRINK_DATABASE.find(d => d.id === id);
}

/**
 * 按名称搜索P饮料
 * @param name 名称（中文或日文）
 * @param exactMatch 是否精确匹配
 */
export function getPDrinksByName(name: string, exactMatch: boolean = false): PDrink[] {
  if (exactMatch) {
    return P_DRINK_DATABASE.filter(d => d.nameCN === name || d.nameJP === name);
  }
  return P_DRINK_DATABASE.filter(d => d.nameCN.includes(name) || d.nameJP.includes(name));
}

/**
 * 筛选P饮料
 */
export function filterPDrinks(filter: PDrinkFilter): PDrink[] {
  let drinks = getAllPDrinks();

  // 按类型筛选
  if (filter.type) {
    const types = Array.isArray(filter.type) ? filter.type : [filter.type];
    drinks = drinks.filter(d => types.includes(d.type));
  }

  // 按稀有度筛选
  if (filter.rarity) {
    const rarities = Array.isArray(filter.rarity) ? filter.rarity : [filter.rarity];
    drinks = drinks.filter(d => rarities.includes(d.rarity));
  }

  // 按专属计划筛选
  if (filter.exclusivePlan) {
    drinks = drinks.filter(d => d.exclusivePlan === filter.exclusivePlan);
  }

  // 按关键词搜索
  if (filter.keyword) {
    const keyword = filter.keyword.toLowerCase();
    drinks = drinks.filter(
      d =>
        d.nameCN.toLowerCase().includes(keyword) ||
        d.nameJP.toLowerCase().includes(keyword) ||
        d.effect.toLowerCase().includes(keyword),
    );
  }

  return drinks;
}

/**
 * 随机获取P饮料
 * @param count 数量
 * @param filter 筛选条件
 */
export function getRandomPDrinks(count: number, filter?: PDrinkFilter): PDrink[] {
  const pool = filter ? filterPDrinks(filter) : getAllPDrinks();

  if (pool.length === 0) {
    return [];
  }

  const result: PDrink[] = [];
  const poolCopy = [...pool];

  for (let i = 0; i < count && poolCopy.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * poolCopy.length);
    result.push(poolCopy[randomIndex]);
    poolCopy.splice(randomIndex, 1);
  }

  return result;
}

/**
 * 推荐P饮料（用于训练奖励）
 * @param plan 培育计划
 * @param preferHighRarity 是否优先高稀有度
 */
export function getRecommendedPDrinks(plan: ProducePlan, preferHighRarity: boolean = false): PDrink[] {
  const availableDrinks = getPDrinksForPlan(plan);

  if (preferHighRarity) {
    // 优先推荐特级和高级
    const premium = availableDrinks.filter(d => d.rarity === '特级' || d.rarity === '高级');
    if (premium.length > 0) {
      return premium;
    }
  }

  return availableDrinks;
}

/**
 * 检查P饮料是否适用于当前培育计划
 */
export function isPDrinkAvailableForPlan(drink: PDrink, plan: ProducePlan): boolean {
  // 通用饮料对所有计划都可用
  if (drink.type === '通用') {
    return true;
  }

  // 专属饮料只对对应计划可用
  return drink.exclusivePlan === plan;
}

/**
 * 创建玩家持有的P饮料记录
 */
export function createPlayerPDrink(drink: PDrink, count: number = 1): PlayerPDrink {
  return {
    drink,
    count,
    acquiredAt: new Date(),
  };
}

/**
 * 克隆P饮料（用于创建独立实例）
 */
export function clonePDrink(drink: PDrink): PDrink {
  return { ...drink };
}

/**
 * 按效果类型分类P饮料
 */
export function categorizePDrinksByEffect(): {
  scoreBoost: PDrink[];
  attributeBoost: PDrink[];
  buffBoost: PDrink[];
  staminaRecovery: PDrink[];
  cardManipulation: PDrink[];
  special: PDrink[];
} {
  const all = getAllPDrinks();

  return {
    // 直接得分
    scoreBoost: all.filter(d => d.effect.includes('得分+')),
    // 增加属性
    attributeBoost: all.filter(d => d.effect.includes('元气+') || d.effect.includes('全力值+')),
    // 增加Buff
    buffBoost: all.filter(
      d =>
        d.effect.includes('好调') ||
        d.effect.includes('集中') ||
        d.effect.includes('好印象') ||
        d.effect.includes('干劲') ||
        d.effect.includes('绝好调'),
    ),
    // 体力回复
    staminaRecovery: all.filter(d => d.effect.includes('回复') && d.effect.includes('体力')),
    // 卡牌操作
    cardManipulation: all.filter(
      d =>
        d.effect.includes('手牌') ||
        d.effect.includes('弃牌堆') ||
        d.effect.includes('强化') ||
        d.effect.includes('生成'),
    ),
    // 特殊效果
    special: all.filter(d => d.effect.includes('转化') || d.effect.includes('回合数追加')),
  };
}

