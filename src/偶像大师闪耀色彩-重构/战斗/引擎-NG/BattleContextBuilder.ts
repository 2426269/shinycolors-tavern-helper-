/**
 * BattleContextBuilder - 共享的战斗上下文构建器
 * T-17: 从 TurnController.buildContextWithZone 和 ActionExecutor.createContext 抽取
 *
 * 统一生成 BattleContext，确保所有模块使用一致的上下文结构
 */

import { BattleStateNG } from './ActionExecutor';
import { CardZoneManager } from './CardZoneManager';
import { StateManager } from './StateManager';
import { BattleContext, CardTypeNG, SkillCardV2 } from './types';

/**
 * 构建完整的战斗上下文
 * @param battleState 战斗状态
 * @param stateManager 状态管理器
 * @param cardZoneManager 卡牌区域管理器
 * @param rng 随机数 (0-1)
 * @param currentCard 可选的当前卡牌（用于 Hook 条件）
 */
export function buildBattleContext(
  battleState: BattleStateNG,
  stateManager: StateManager,
  cardZoneManager: CardZoneManager,
  rng: number,
  currentCard?: SkillCardV2,
): BattleContext {
  // T-10: 分离 Raw (条件判断) 和 Effective (得分计算)
  const buffsRaw = stateManager.toBuffRawRecord();
  const buffsEffective = stateManager.toBuffEffectiveRecord();

  // 计算手牌按稀有度统计
  const cardsInHandByRarity: Record<string, number> = { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 };
  for (const card of cardZoneManager.getHand()) {
    const rarity = card.rarity || 'N';
    cardsInHandByRarity[rarity] = (cardsInHandByRarity[rarity] ?? 0) + 1;
  }

  // 构建当前卡牌上下文（如果有）
  const currentCardContext = currentCard
    ? {
        id: currentCard.id,
        type: currentCard.type as CardTypeNG,
        tags: currentCard.engine_data?.logic_chain?.flatMap(step => step.do.flatMap(a => a.tags || [])) || [],
        rarity: currentCard.rarity,
        plan: currentCard.plan,
        card_name: currentCard.display?.name,
        card_name_jp: currentCard.display?.nameJP,
      }
    : undefined;

  return {
    player: {
      genki: battleState.genki ?? 0,
      genki_percent: battleState.maxGenki > 0 ? (battleState.genki / battleState.maxGenki) * 100 : 0,
      stamina: battleState.stamina ?? 0,
      stamina_percent: battleState.maxStamina > 0 ? (battleState.stamina / battleState.maxStamina) * 100 : 0,
      score: battleState.score ?? 0,
      // T-10: 使用 Effective 层数用于得分快捷访问
      concentration: buffsEffective['Concentration'] ?? 0,
      motivation: buffsEffective['Motivation'] ?? 0,
      good_impression: buffsEffective['GoodImpression'] ?? 0,
      all_power: buffsEffective['AllPower'] ?? 0,
      heat: buffsEffective['Heat'] ?? 0,
      // T-10: player.buffs 使用 Raw 层数（用于条件判断）
      buffs: buffsRaw,
      tags: stateManager.getAllTags(),
      state_switch_count: battleState.stateSwitchCount ?? {},
      state_switch_count_total: battleState.stateSwitchCountTotal ?? 0,
    },
    turn: battleState.turn ?? 1,
    max_turns: battleState.maxTurns ?? 12,
    cards_played_this_turn: battleState.cardsPlayedThisTurn ?? 0,
    cards_played_total: battleState.cardsPlayedTotal ?? 0,
    rng,
    play_turn: battleState.turn ?? 1,
    deck_count: cardZoneManager.getDeckCount(),
    discard_count: cardZoneManager.getDiscardCount(),
    cards_in_hand_by_rarity: cardsInHandByRarity,
    new_state: undefined,
    stamina_cost: 0,
    // T-10: 有效层数记录（用于得分计算）
    buffs_effective: buffsEffective,
    // 当前卡牌信息
    current_card: currentCardContext,
  };
}

/**
 * 扩展上下文以包含状态切换信息
 */
export function extendContextWithState(context: BattleContext, newState: string): BattleContext {
  return { ...context, new_state: newState };
}

/**
 * 扩展上下文以包含体力消耗信息
 */
export function extendContextWithStaminaCost(context: BattleContext, staminaCost: number): BattleContext {
  return { ...context, stamina_cost: staminaCost };
}
