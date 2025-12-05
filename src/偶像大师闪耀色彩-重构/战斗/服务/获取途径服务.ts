/**
 * 技能卡获取途径服务
 * 处理技能卡在培育过程中的获取逻辑
 */

import type {
  AcquisitionSource,
  DeckBuildSource,
  ProduceEventResult,
  ProduceEventType,
  ProducePhase,
} from '../类型/获取途径类型';
import type { PDrink } from '../类型/P饮料类型';
import type { ProducePlan, SkillCard } from '../类型/技能卡类型';
import { filterPDrinks, getPDrinksForPlan, getRandomPDrinks } from './P饮料服务';
import { filterSkillCards, getRandomSkillCards, getSkillCardsByPlan } from './技能卡服务';

/**
 * 根据培育事件类型和结果，决定奖励
 */
export function getProduceEventReward(
  eventType: ProduceEventType,
  plan: ProducePlan,
  grade?: 'Perfect' | 'Great' | 'Good' | 'Normal' | 'Bad',
): ProduceEventResult {
  const result: ProduceEventResult = {
    eventType,
    grade,
    success: grade !== 'Bad',
    acquiredSkillCardIds: [],
    acquiredPDrinkIds: [],
  };

  // 失败不给奖励
  if (!result.success) {
    return result;
  }

  // 根据事件类型和评价决定奖励
  switch (eventType) {
    case '训练_Vocal':
    case '训练_Dance':
    case '训练_Visual': {
      // 训练完成有概率获得技能卡或P饮料
      if (grade === 'Perfect') {
        // Perfect：高概率获得技能卡或高级P饮料
        if (Math.random() < 0.7) {
          const cards = getRandomSkillCards(1, {
            plan,
            rarity: ['SR', 'SSR'],
          });
          result.acquiredSkillCardIds = cards.map(c => c.id);
        } else {
          const drinks = getRandomPDrinks(1, {
            rarity: ['高级', '特级'],
          });
          result.acquiredPDrinkIds = drinks.map(d => d.id);
        }
      } else if (grade === 'Great') {
        // Great：中等概率获得技能卡或P饮料
        if (Math.random() < 0.4) {
          const cards = getRandomSkillCards(1, {
            plan,
            rarity: ['R', 'SR'],
          });
          result.acquiredSkillCardIds = cards.map(c => c.id);
        } else if (Math.random() < 0.5) {
          const drinks = getRandomPDrinks(1, {
            rarity: ['普通', '高级'],
          });
          result.acquiredPDrinkIds = drinks.map(d => d.id);
        }
      }
      break;
    }

    case '授课': {
      // 授课：固定获得1张技能卡
      const cards = getRandomSkillCards(1, {
        plan,
        rarity: ['R', 'SR'],
      });
      result.acquiredSkillCardIds = cards.map(c => c.id);
      break;
    }

    case '活动补给': {
      // 活动补给：随机获得技能卡或P饮料
      if (Math.random() < 0.5) {
        const cards = getRandomSkillCards(1, { plan });
        result.acquiredSkillCardIds = cards.map(c => c.id);
      } else {
        const drinks = getRandomPDrinks(1);
        result.acquiredPDrinkIds = drinks.map(d => d.id);
      }
      break;
    }

    case '自由活动':
    case '交谈': {
      // 自由活动/交谈：低概率获得
      if (Math.random() < 0.3) {
        const drinks = getRandomPDrinks(1, { rarity: '普通' });
        result.acquiredPDrinkIds = drinks.map(d => d.id);
      }
      break;
    }

    case '期中比赛':
    case '期末比赛': {
      // 比赛：根据成绩获得奖励
      if (grade === 'Perfect') {
        const cards = getRandomSkillCards(2, {
          plan,
          rarity: ['SR', 'SSR'],
        });
        result.acquiredSkillCardIds = cards.map(c => c.id);
        const drinks = getRandomPDrinks(1, { rarity: '特级' });
        result.acquiredPDrinkIds = drinks.map(d => d.id);
      } else if (grade === 'Great') {
        const cards = getRandomSkillCards(1, {
          plan,
          rarity: ['R', 'SR'],
        });
        result.acquiredSkillCardIds = cards.map(c => c.id);
      }
      break;
    }
  }

  return result;
}

/**
 * 获取P卡的专属技能卡
 * @param produceCardId P卡ID
 * @returns 专属技能卡（如果存在）
 */
export function getProduceCardExclusiveSkill(produceCardId: string): SkillCard | undefined {
  const exclusiveCards = filterSkillCards({
    isExclusive: true,
  });
  return exclusiveCards.find(card => card.bindingCardId === produceCardId);
}

/**
 * 获取回忆卡提供的技能卡
 * @param supportCardId 回忆卡ID
 * @param phase 当前培育阶段
 * @returns 技能卡列表
 */
export function getSupportCardSkills(supportCardId: string, phase: ProducePhase): SkillCard[] {
  // TODO: 这里需要从回忆卡数据库中查询
  // 暂时返回空数组，等待回忆卡数据库建立
  return [];
}

/**
 * 构建初始卡组
 * @param produceCardId P卡ID
 * @param supportCardIds 回忆卡ID列表（最多5张）
 * @param plan 培育计划
 * @returns 卡组来源信息
 */
export function buildInitialDeck(produceCardId: string, supportCardIds: string[], plan: ProducePlan): DeckBuildSource {
  const deckSource: DeckBuildSource = {
    produceCardExclusive: [],
    supportCardsEarly: [],
    supportCardsLate: [],
    acquiredDuringProduce: [],
  };

  // 1. 添加P卡专属技能卡
  const exclusiveSkill = getProduceCardExclusiveSkill(produceCardId);
  if (exclusiveSkill) {
    deckSource.produceCardExclusive.push(exclusiveSkill.id);
  }

  // 2. 添加回忆卡提供的技能卡（初期）
  supportCardIds.forEach(supportCardId => {
    const skills = getSupportCardSkills(supportCardId, '初期');
    deckSource.supportCardsEarly.push(...skills.map(s => s.id));
  });

  // 3. 添加基础技能卡（N卡）
  const baseCards = filterSkillCards({
    plan,
    rarity: 'N',
  }).slice(0, 5);
  deckSource.acquiredDuringProduce.push(...baseCards.map(c => c.id));

  return deckSource;
}

/**
 * 在期中后解锁回忆卡提供的技能卡
 * @param deckSource 当前卡组来源
 * @param supportCardIds 回忆卡ID列表
 * @returns 更新后的卡组来源
 */
export function unlockMidtermSupportCardSkills(deckSource: DeckBuildSource, supportCardIds: string[]): DeckBuildSource {
  supportCardIds.forEach(supportCardId => {
    const skills = getSupportCardSkills(supportCardId, '期中后');
    deckSource.supportCardsLate.push(...skills.map(s => s.id));
  });

  return deckSource;
}

/**
 * 添加在培育过程中获得的技能卡
 * @param deckSource 当前卡组来源
 * @param skillCardId 新获得的技能卡ID
 * @returns 更新后的卡组来源
 */
export function addAcquiredSkillCard(deckSource: DeckBuildSource, skillCardId: string): DeckBuildSource {
  if (!deckSource.acquiredDuringProduce.includes(skillCardId)) {
    deckSource.acquiredDuringProduce.push(skillCardId);
  }
  return deckSource;
}

/**
 * 获取完整的卡组（所有来源合并）
 * @param deckSource 卡组来源
 * @returns 所有技能卡ID的数组
 */
export function getFullDeck(deckSource: DeckBuildSource): string[] {
  return [
    ...deckSource.produceCardExclusive,
    ...deckSource.supportCardsEarly,
    ...deckSource.supportCardsLate,
    ...deckSource.acquiredDuringProduce,
  ];
}

/**
 * 获取推荐的培育事件奖励池
 * @param plan 培育计划
 * @param phase 培育阶段
 * @returns 可能获得的技能卡和P饮料
 */
export function getRecommendedRewardPool(
  plan: ProducePlan,
  phase: ProducePhase,
): {
  skillCards: SkillCard[];
  pDrinks: PDrink[];
} {
  const rarityByPhase: Record<ProducePhase, ('N' | 'R' | 'SR' | 'SSR')[]> = {
    初期: ['N', 'R'],
    中期: ['R', 'SR'],
    期中后: ['SR', 'SSR'],
    后期: ['SR', 'SSR'],
    期末: ['SSR'],
  };

  const skillCards = filterSkillCards({
    plan,
    rarity: rarityByPhase[phase],
  });

  const pDrinks = getPDrinksForPlan(plan);

  return { skillCards, pDrinks };
}
