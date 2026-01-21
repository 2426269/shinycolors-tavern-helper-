import { BattleStateNG } from './ActionExecutor';
import { RuleEvaluator } from './RuleEvaluator';
import { StateManager } from './StateManager';
import { BattleContext, SkillCardV2 } from './types';

/**
 * 预测卡牌打出后的得分
 * @param card 技能卡
 * @param state 战斗状态
 * @param stateManager 状态管理器
 * @param ruleEvaluator 规则评估器
 * @returns 预测得分
 */
export function predictScore(
  card: SkillCardV2,
  state: BattleStateNG,
  stateManager: StateManager,
  ruleEvaluator: RuleEvaluator,
): number {
  if (!card.engine_data?.logic_chain) return 0;

  let totalScore = 0;

  // 创建上下文 (需匹配 BattleContext 接口)
  const context: BattleContext = {
    player: {
      genki: state.genki,
      genki_percent: state.maxGenki > 0 ? (state.genki / state.maxGenki) * 100 : 0,
      stamina: state.stamina,
      stamina_percent: state.maxStamina > 0 ? (state.stamina / state.maxStamina) * 100 : 0,
      score: state.score,
      concentration: state.concentration,
      motivation: state.motivation,
      good_impression: state.goodImpression,
      all_power: state.allPower,
      heat: state.heat,
      buffs: stateManager.toBuffRawRecord(),
      tags: state.tags,
      state_switch_count: state.stateSwitchCount || {},
      state_switch_count_total: state.stateSwitchCountTotal || 0,
    },
    turn: state.turn,
    max_turns: state.maxTurns,
    cards_played_this_turn: state.cardsPlayedThisTurn,
    cards_played_total: state.cardsPlayedTotal || 0,
    current_card: {
      id: card.id,
      type: card.type,
      rarity: card.rarity,
      tags: (card as any).mechanicRefs || [],
      plan: card.plan,
    },
    rng: 0.5, // 预测时使用固定 RNG
  };

  for (const step of card.engine_data.logic_chain) {
    // 检查条件
    if (step.when) {
      const conditionMet = ruleEvaluator.evaluateCondition(step.when, context);
      if (!conditionMet) continue;
    }

    for (const action of step.do) {
      if (action.action === 'GAIN_SCORE') {
        let baseValue = action.value ?? 0;

        // 动态表达式
        if (action.value_expression) {
          baseValue = ruleEvaluator.evaluateNumber(action.value_expression, context);
        }

        // 热意加成
        const heat = stateManager.getBuffStacks('Heat');
        if (heat > 0) baseValue += heat;

        // 集中加成
        const concentration = stateManager.getBuffStacks('Concentration');
        if (concentration > 0) baseValue += concentration;

        // 倍率
        let multiplier = 1.0;
        if (action.multiplier_expression) {
          multiplier = ruleEvaluator.evaluateNumber(action.multiplier_expression, context);
        }

        // 绝好调/好调
        const hasGoodCondition = stateManager.hasBuff('GoodCondition');
        const hasExcellentCondition = stateManager.hasBuff('ExcellentCondition');
        if (hasGoodCondition) {
          if (hasExcellentCondition) {
            const goodConditionTurns = stateManager.getBuffDuration('GoodCondition');
            multiplier *= 1.5 + goodConditionTurns * 0.1;
          } else {
            multiplier *= 1.5;
          }
        }

        // 非凡状态
        const alloutState = stateManager.getBuffStacks('AlloutState');
        const resoluteState = stateManager.getBuffStacks('ResoluteState');
        const conserveState = stateManager.getBuffStacks('ConserveState');

        if (alloutState > 0) multiplier *= 3;
        else if (resoluteState >= 2) multiplier *= 2.5;
        else if (resoluteState >= 1) multiplier *= 2;
        else if (conserveState >= 2) multiplier *= 0.25;
        else if (conserveState >= 1) multiplier *= 0.5;

        // 最终得分倍率
        const scoreFinalMultiplier = stateManager.getBuffStacks('ScoreFinalMultiplier');
        if (scoreFinalMultiplier > 0) multiplier *= 1 + scoreFinalMultiplier / 100;

        // 通用得分加成
        const scoreBonus = stateManager.getBuffStacks('ScoreBonus');
        if (scoreBonus > 0) multiplier *= 1 + scoreBonus / 100;

        totalScore += Math.floor(baseValue * multiplier);
      }
    }
  }

  return totalScore;
}
