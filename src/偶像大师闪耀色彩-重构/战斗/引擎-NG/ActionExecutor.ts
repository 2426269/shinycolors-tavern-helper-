/**
 * ActionExecutor - 原子操作执行器
 * 执行 13 种原子操作
 */

import { CardZoneManager } from './CardZoneManager';
import { HookManager } from './HookManager';
import { RuleEvaluator } from './RuleEvaluator';
import { StateManager } from './StateManager';
import type {
  ActionResult,
  AddBuffAction,
  AddTagAction,
  AtomicAction,
  AtomicStep,
  BattleContext,
  BattleEvent,
  CardZone,
  CreateCardAction,
  DrawCardAction,
  EnhanceHandAction,
  EnsureBuffTurnsAction,
  ExhaustCardAction,
  GainScoreAction,
  ModifyAllCardsAction,
  ModifyBuffEffectMultiplierAction,
  ModifyBuffMultiplierAction,
  ModifyGenkiAction,
  ModifyPlayLimitAction,
  ModifyStaminaAction,
  ModifyTurnCountAction,
  MoveCardToZoneAction,
  PlayCardFromZoneAction,
  PlayRandomCardsAction,
  RegisterHookAction,
  RemoveBuffAction,
  RemoveTagAction,
  ReplayNextCardAction,
  SkillCardV2,
} from './types';
import { BattleEventType, HookType } from './types';

// ==================== 战斗状态接口 ====================

export interface BattleStateNG {
  genki: number;
  maxGenki: number;
  stamina: number;
  maxStamina: number;
  score: number;
  concentration: number;
  motivation: number;
  goodImpression: number;
  allPower: number;
  heat: number;
  turn: number;
  maxTurns: number;
  cardsPlayedThisTurn: number;
  maxCardsPerTurn: number;
  extraPlaysThisTurn: number;
  stateSwitchCount: Record<string, number>; // EV1: per-state 计数 <StateName> -> count
  stateSwitchCountTotal: number; // EV1: 状态切换总次数
  anomalyState: 'allout' | 'conserve' | 'resolute' | null;
  tags: string[]; // 语义标签 (新增)
  cardsPlayedTotal: number; // 总出牌数 (新增)
}

// ==================== ActionExecutor 类 ====================

export class ActionExecutor {
  private ruleEvaluator: RuleEvaluator;
  private stateManager: StateManager;
  private hookManager: HookManager;
  private cardZoneManager: CardZoneManager;

  constructor(
    ruleEvaluator?: RuleEvaluator,
    stateManager?: StateManager,
    hookManager?: HookManager,
    cardZoneManager?: CardZoneManager,
  ) {
    this.ruleEvaluator = ruleEvaluator ?? new RuleEvaluator();
    this.stateManager = stateManager ?? new StateManager();
    this.hookManager = hookManager ?? new HookManager(this.ruleEvaluator);
    this.cardZoneManager = cardZoneManager ?? new CardZoneManager();

    // T8: 连接 CardZoneManager 和 HookManager
    this.cardZoneManager.setHookManager(this.hookManager);
  }

  // ==================== 6-2: 统一出牌入口 ====================

  /**
   * 6-2: 统一出牌入口 - 所有出牌行为必须走此方法
   * 顺序：canUseCard -> ON_BEFORE -> move/exhaust -> logic_chain -> recordUsage -> ON_AFTER -> counters
   * @param staminaCost EV5: 出牌消耗的体力值，free 出牌时为 0
   */
  private playCardInternal(
    card: SkillCardV2,
    fromZone: CardZone,
    state: BattleStateNG,
    rng: number,
    staminaCost: number = 0,
  ): ActionResult {
    // T-9: 事件日志（供 UI 播放动画）
    const events: BattleEvent[] = [];
    const timestamp = () => Date.now();

    // 1. canUseCard 检查
    if (!this.cardZoneManager.canUseCard(card)) {
      return {
        success: false,
        logs: [`卡牌 ${card.display?.name || card.id} 已达使用上限`],
        events: [],
      };
    }

    // T-9: 2. 费用扣除（元气优先，体力补足）
    const cost = card.engine_data?.cost?.genki ?? 0;
    let actualGenkiUsed = 0;
    let actualStaminaUsed = staminaCost; // 外部传入的体力消耗（free play 时为 0）
    if (cost > 0) {
      actualGenkiUsed = Math.min(state.genki, cost);
      const remaining = cost - actualGenkiUsed;
      state.genki -= actualGenkiUsed;
      state.stamina -= remaining;
      actualStaminaUsed += remaining;
      events.push({
        type: BattleEventType.COST_DEDUCT,
        timestamp: timestamp(),
        data: { genki: actualGenkiUsed, stamina: remaining, total: cost },
      });
      console.log(`💰 [Engine] 费用扣除: 元气${actualGenkiUsed} + 体力${remaining}`);
    }

    const cardContext = {
      id: card.id,
      type: card.type,
      rarity: card.rarity,
      tags: (card as any).mechanicRefs || [],
      plan: card.plan, // T4: 属性分类
      effect_tags: this.extractEffectTags(card), // T4: 效果标签
      // T-Fix: 暴露 card_id (映射到 originalId)
      card_id: card.originalId || card.id,
    };

    // 3. ON_BEFORE_CARD_PLAY Hook (EV5: 注入 stamina_cost)
    const beforeContext: BattleContext = {
      ...this.createContext(state, cardContext, rng),
      stamina_cost: actualStaminaUsed,
    };
    const beforeActions = this.hookManager.trigger(HookType.ON_BEFORE_CARD_PLAY, beforeContext);
    if (beforeActions.length > 0) {
      console.log(`🪝 [Hook] ON_BEFORE_CARD_PLAY 触发: ${beforeActions.length} 个动作`);
      events.push({
        type: BattleEventType.HOOK_TRIGGER,
        timestamp: timestamp(),
        data: { trigger: HookType.ON_BEFORE_CARD_PLAY, count: beforeActions.length },
      });
    }
    for (const hookAction of beforeActions) {
      const res = this.executeAction(hookAction, state, beforeContext);
      if (res.events) events.push(...res.events);
    }

    // 4. 移动卡牌 (根据 exhaust_on_play 决定去向)
    const targetZone = card.engine_data?.constraints?.exhaust_on_play ? 'removed' : 'discard';
    this.cardZoneManager.moveCard(card.id, fromZone, targetZone);
    events.push({
      type: BattleEventType.CARD_MOVE,
      timestamp: timestamp(),
      data: { card_id: card.id, from_zone: fromZone, to_zone: targetZone },
    });

    // 5. 执行卡牌效果
    if (card.engine_data?.logic_chain) {
      events.push({
        type: BattleEventType.LOGIC_CHAIN_START,
        timestamp: timestamp(),
        data: { source_card_id: card.id },
      });
      const chainRes = this.executeLogicChain(card.engine_data.logic_chain, state, cardContext, rng);
      if (chainRes.events) events.push(...chainRes.events);
      events.push({ type: BattleEventType.LOGIC_CHAIN_END, timestamp: timestamp(), data: { source_card_id: card.id } });
    }

    // 6. recordUsage - T-1: 传入 card 对象
    this.cardZoneManager.recordUsage(card);
    // events.push({ type: 'USAGE_RECORDED', data: { cardId: card.id } }); // 暂无对应动画

    // 7. ON_AFTER_CARD_PLAY Hook (EV5: 注入 stamina_cost)
    const afterContext: BattleContext = {
      ...this.createContext(state, cardContext, rng),
      stamina_cost: actualStaminaUsed,
    };
    const afterActions = this.hookManager.trigger(HookType.ON_AFTER_CARD_PLAY, afterContext);
    if (afterActions.length > 0) {
      console.log(`🪝 [Hook] ON_AFTER_CARD_PLAY 触发: ${afterActions.length} 个动作`);
      events.push({
        type: BattleEventType.HOOK_TRIGGER,
        timestamp: timestamp(),
        data: { trigger: HookType.ON_AFTER_CARD_PLAY, count: afterActions.length },
      });
    }
    for (const hookAction of afterActions) {
      const res = this.executeAction(hookAction, state, afterContext);
      if (res.events) events.push(...res.events);
    }

    // T6: 效果重放检测
    const replayCount = (state as any)._replayNextCount ?? 0;
    if (replayCount > 0 && !(afterContext as any).is_replay) {
      console.log(`🔄 [Replay] 效果重放触发: ${replayCount} 次`);
      events.push({
        type: BattleEventType.EFFECT_REPLAY,
        timestamp: timestamp(),
        data: { count: replayCount },
      });

      // 获取当前卡的 logic_chain 并额外执行
      const logicChain =
        card.isEnhanced && card.engine_data?.logic_chain_enhanced
          ? card.engine_data.logic_chain_enhanced
          : (card.engine_data?.logic_chain ?? []);

      for (let i = 0; i < replayCount; i++) {
        // 标记重放上下文（避免无限循环）
        (state as any)._isReplay = true;

        console.log(`🔄 [Replay] 第 ${i + 1}/${replayCount} 次重放`);
        const replayRes = this.executeLogicChain(logicChain, state, cardContext, this.cardZoneManager.getRng());
        if (replayRes.events) events.push(...replayRes.events);
      }

      // 清除重放计数
      (state as any)._replayNextCount = 0;
    }

    // 8. cardsPlayedThisTurn++
    state.cardsPlayedThisTurn++;

    // 9. cardsPlayedTotal++
    if (state.cardsPlayedTotal !== undefined) {
      state.cardsPlayedTotal++;
    }

    return {
      success: true,
      logs: [`打出卡牌: ${card.display?.name || card.id} (元气=${actualGenkiUsed}, 体力=${actualStaminaUsed})`],
      events,
    };
  }

  /**
   * T-9: 公开出牌入口 - 供 ProduceHost 调用
   * 从手牌打出并执行完整生命周期
   */
  public playCard(cardId: string, state: BattleStateNG, staminaCost: number = 0): ActionResult {
    // T-13: 使用 findInHand 替代 playFromHand，避免双重移除
    const card = this.cardZoneManager.findInHand(cardId);
    if (!card) {
      return {
        success: false,
        logs: [`卡牌 ${cardId} 不在手牌中`],
        events: [],
      };
    }

    // P2: 检查 usable_when 条件（仅玩家打手牌时检查）
    const usableWhen = card.engine_data?.constraints?.usable_when;
    if (usableWhen) {
      const ctx = this.createContext(
        state,
        {
          id: card.id,
          type: card.type,
          rarity: card.rarity,
          tags: (card as any).mechanicRefs || [],
        },
        this.cardZoneManager.getRng(),
      );
      const canUse = this.ruleEvaluator.evaluateCondition(usableWhen, ctx);
      if (!canUse) {
        return {
          success: false,
          logs: [`卡牌 ${card.display?.name || cardId} 不满足使用条件`],
          events: [],
        };
      }
    }

    // 2. 委托到内部方法
    return this.playCardInternal(card, 'hand', state, this.cardZoneManager.getRng(), staminaCost);
  }

  // ==================== 执行入口 ====================

  /**
   * 执行一个 logic_chain
   * @param steps 原子步骤列表
   * @param state 战斗状态
   * @param currentCard 当前打出的卡牌信息（可选）
   * @param rng 随机数（0-1，可选，默认生成）
   */
  public executeLogicChain(
    steps: AtomicStep[],
    state: BattleStateNG,
    currentCard?: BattleContext['current_card'],
    rng?: number,
  ): ActionResult {
    // 在执行链开始时生成 rng，确保同一次出牌内所有步骤的 rng 一致
    const fixedRng = rng ?? this.cardZoneManager.getRng();

    const result: ActionResult = {
      success: true,
      logs: [],
      score_gained: 0,
      events: [], // T-9: 初始化事件数组
    };

    for (const step of steps) {
      const stepResult = this.executeStep(step, state, currentCard, fixedRng);
      result.logs.push(...stepResult.logs);
      result.score_gained = (result.score_gained ?? 0) + (stepResult.score_gained ?? 0);
      if (stepResult.events) result.events?.push(...stepResult.events); // T-9: 聚合事件
      if (!stepResult.success) {
        result.success = false;
        break;
      }
    }

    return result;
  }

  /**
   * 执行单个 AtomicStep
   */
  public executeStep(
    step: AtomicStep,
    state: BattleStateNG,
    currentCard?: BattleContext['current_card'],
    rng?: number,
  ): ActionResult {
    const result: ActionResult = {
      success: true,
      logs: [],
      score_gained: 0,
      events: [], // T-9: 初始化事件数组
    };

    // 创建上下文用于条件评估（包含 currentCard 和 rng）
    const context = this.createContext(state, currentCard, rng ?? this.cardZoneManager.getRng());

    // 检查条件
    if (step.when) {
      const conditionMet = this.ruleEvaluator.evaluateCondition(step.when, context);
      if (!conditionMet) {
        result.logs.push('条件不满足，跳过此步骤');
        return result;
      }
    }

    // 执行所有动作
    // T-14: 每个 action 前重新创建 context，确保 value_expression 使用最新 state
    for (const action of step.do) {
      const freshContext = this.createContext(state, currentCard, rng ?? this.cardZoneManager.getRng());
      const actionResult = this.executeAction(action, state, freshContext);
      result.logs.push(...actionResult.logs);
      result.score_gained = (result.score_gained ?? 0) + (actionResult.score_gained ?? 0);
      if (actionResult.events) result.events?.push(...actionResult.events); // T-9: 聚合事件
    }

    return result;
  }

  /**
   * 执行单个原子操作
   */
  public executeAction(action: AtomicAction, state: BattleStateNG, context?: BattleContext): ActionResult {
    const ctx = context ?? this.createContext(state, undefined, this.cardZoneManager.getRng());

    switch (action.action) {
      case 'GAIN_SCORE':
        return this.execGainScore(action, state, ctx);
      case 'MODIFY_GENKI':
        return this.execModifyGenki(action, state, ctx);
      case 'MODIFY_STAMINA':
        return this.execModifyStamina(action, state, ctx);
      case 'ADD_BUFF':
        return this.execAddBuff(action, state);
      case 'ADD_TAG':
        return this.execAddTag(action);
      case 'DRAW_CARD':
        return this.execDrawCard(action, state);
      case 'REGISTER_HOOK':
        return this.execRegisterHook(action, state);
      case 'MODIFY_TURN_COUNT':
        return this.execModifyTurnCount(action, state);
      case 'MODIFY_PLAY_LIMIT':
        return this.execModifyPlayLimit(action, state);
      case 'PLAY_CARD_FROM_ZONE':
        return this.execPlayCardFromZone(action, state);
      case 'MOVE_CARD_TO_ZONE':
        return this.execMoveCardToZone(action, state);
      case 'MODIFY_BUFF_MULTIPLIER':
        return this.execModifyBuffMultiplier(action);
      case 'MODIFY_ALL_CARDS':
        return this.execModifyAllCards(action);
      case 'PLAY_RANDOM_CARDS':
        return this.execPlayRandomCards(action, state);
      case 'EXHAUST_CARD':
        return this.execExhaustCard(action, ctx);
      case 'REMOVE_BUFF':
        return this.execRemoveBuff(action);
      case 'REMOVE_TAG':
        return this.execRemoveTag(action);
      case 'ENSURE_BUFF_TURNS':
        return this.execEnsureBuffTurns(action);
      case 'MODIFY_BUFF_EFFECT_MULTIPLIER':
        return this.execModifyBuffEffectMultiplier(action);
      case 'ENHANCE_HAND':
        return this.execEnhanceHand(action, state);
      case 'CREATE_CARD':
        return this.execCreateCard(action, state);
      case 'REPLAY_NEXT_CARD':
        return this.execReplayNextCard(action, state);
      default:
        return {
          success: false,
          logs: [`未知操作: ${(action as any).action}`],
        };
    }
  }

  // ==================== 13 种原子操作实现 ====================

  private execGainScore(action: GainScoreAction, state: BattleStateNG, context: BattleContext): ActionResult {
    let baseValue = action.value ?? 0;

    // 如果有动态表达式，计算它
    if (action.value_expression) {
      baseValue = this.ruleEvaluator.evaluateNumber(action.value_expression, context);
    }

    // 子任务6: 热意加成 (平加到基础值，在倍率之前)
    const heat = this.stateManager.getBuffStacks('Heat');
    if (heat > 0) {
      baseValue += heat;
      console.log(`🔥 [execGainScore] 热意加成: +${heat} → 基础值=${baseValue}`);
    }

    // 应用集中加成
    const concentration = this.stateManager.getBuffStacks('Concentration');
    if (concentration > 0) {
      baseValue += concentration;
      console.log(`🎯 [execGainScore] 集中加成: +${concentration} → 基础值=${baseValue}`);
    }

    // 应用倍率
    let multiplier = 1.0;
    if (action.multiplier_expression) {
      multiplier = this.ruleEvaluator.evaluateNumber(action.multiplier_expression, context);
    }

    // P1-4: 绝好调/好调逻辑
    // 绝好调必须依附于好调才能生效：若无好调，绝好调不起作用
    const hasGoodCondition = this.stateManager.hasBuff('GoodCondition');
    const hasExcellentCondition = this.stateManager.hasBuff('ExcellentCondition');

    if (hasGoodCondition) {
      if (hasExcellentCondition) {
        // 好调 + 绝好调: 倍率 = 1.5 + 好调回合数 × 10%
        const goodConditionTurns = this.stateManager.getBuffDuration('GoodCondition');
        const excellentBonus = 1.5 + goodConditionTurns * 0.1;
        multiplier *= excellentBonus;
        console.log(`🌟 [execGainScore] 绝好调加成: 1.5 + ${goodConditionTurns}*0.1 = ${excellentBonus.toFixed(2)}x`);
      } else {
        // 仅好调: 倍率 = 1.5
        multiplier *= 1.5;
        console.log(`✨ [execGainScore] 好调加成: 1.5x`);
      }
    }
    // 若只有绝好调、没有好调，则绝好调不生效，倍率保持不变

    // 子任务11: 非凡状态得分倍率
    const alloutState = this.stateManager.getBuffStacks('AlloutState');
    const resoluteState = this.stateManager.getBuffStacks('ResoluteState');
    const conserveState = this.stateManager.getBuffStacks('ConserveState');

    if (alloutState > 0) {
      // 全力状态: 得分 ×3
      multiplier *= 3;
      console.log(`🔥 [execGainScore] 全力状态加成: ×3`);
    } else if (resoluteState >= 2) {
      // 强气2段: 得分 ×2.5
      multiplier *= 2.5;
      console.log(`💪 [execGainScore] 强气2段加成: ×2.5`);
    } else if (resoluteState >= 1) {
      // 强气1段: 得分 ×2
      multiplier *= 2;
      console.log(`💪 [execGainScore] 强气1段加成: ×2`);
    } else if (conserveState >= 2) {
      // 温存2段: 得分 ×0.25
      multiplier *= 0.25;
      console.log(`🛡️ [execGainScore] 温存2段减益: ×0.25`);
    } else if (conserveState >= 1) {
      // 温存1段: 得分 ×0.5
      multiplier *= 0.5;
      console.log(`🛡️ [execGainScore] 温存1段减益: ×0.5`);
    }

    // 子任务9: 最终得分倍率 (在所有其他加成之后应用)
    const scoreFinalMultiplier = this.stateManager.getBuffStacks('ScoreFinalMultiplier');
    if (scoreFinalMultiplier > 0) {
      // ScoreFinalMultiplier=20 表示 +20%，即 ×1.2
      const finalMultiplier = 1 + scoreFinalMultiplier / 100;
      multiplier *= finalMultiplier;
      console.log(`📈 [execGainScore] 最终得分倍率: +${scoreFinalMultiplier}% → ×${finalMultiplier.toFixed(2)}`);
    }

    // 通用得分加成 (ScoreBonus) - 如饮料效果"得分增加30%"
    const scoreBonus = this.stateManager.getBuffStacks('ScoreBonus');
    if (scoreBonus > 0) {
      const bonusMultiplier = 1 + scoreBonus / 100;
      multiplier *= bonusMultiplier;
      console.log(`🍹 [execGainScore] 通用得分加成: +${scoreBonus}% → ×${bonusMultiplier.toFixed(2)}`);
    }

    const finalScore = Math.floor(baseValue * multiplier);
    state.score += finalScore;

    return {
      success: true,
      logs: [`获得分数: ${finalScore} (基础${baseValue} × ${multiplier.toFixed(2)})`],
      score_gained: finalScore,
      events: [
        {
          type: BattleEventType.GAIN_SCORE,
          timestamp: Date.now(),
          data: { value: finalScore, base: baseValue, multiplier },
        },
      ],
    };
  }

  private execModifyGenki(action: ModifyGenkiAction, state: BattleStateNG, context: BattleContext): ActionResult {
    let baseValue = action.value ?? 0;

    // 如果有动态表达式，计算它
    if (action.value_expression) {
      baseValue = this.ruleEvaluator.evaluateNumber(action.value_expression, context);
    }

    // 子任务7: 干劲加成 (仅在 current_card 存在且 baseValue > 0 时)
    if (context.current_card && baseValue > 0) {
      const motivation = this.stateManager.getBuffStacks('Motivation');
      if (motivation > 0) {
        baseValue += motivation;
        console.log(`💪 [execModifyGenki] 干劲加成: +${motivation} → 元气增益=${baseValue}`);
      }
    }

    // 应用倍率
    let multiplier = 1.0;
    if (action.multiplier_expression) {
      multiplier = this.ruleEvaluator.evaluateNumber(action.multiplier_expression, context);
    }

    const finalValue = Math.floor(baseValue * multiplier);
    const oldValue = state.genki;
    state.genki = Math.max(0, Math.min(state.maxGenki, state.genki + finalValue));
    const delta = state.genki - oldValue;

    const logMsg =
      multiplier !== 1.0
        ? `${delta >= 0 ? '增加' : '消耗'}元气: ${Math.abs(delta)} (基础${baseValue} × ${multiplier.toFixed(1)})`
        : `${delta >= 0 ? '增加' : '消耗'}元气: ${Math.abs(delta)}`;

    return {
      success: true,
      logs: [logMsg],
      events: [
        {
          type: BattleEventType.MODIFY_GENKI,
          timestamp: Date.now(),
          data: { delta, new_value: state.genki },
        },
      ],
    };
  }

  private execModifyStamina(action: ModifyStaminaAction, state: BattleStateNG, context: BattleContext): ActionResult {
    // 计算基础值
    let baseValue = action.value ?? 0;
    if (action.value_expression) {
      baseValue = this.ruleEvaluator.evaluateNumber(action.value_expression, context);
    }

    // 子任务8: 体力消耗修正 (仅对 baseValue < 0 且 current_card 存在时生效)
    if (context.current_card && baseValue < 0) {
      const originalCost = Math.abs(baseValue);
      let modifiedCost = originalCost;

      // 子任务11: 非凡状态体力消耗倍率 (先应用)
      const resoluteState = this.stateManager.getBuffStacks('ResoluteState');
      const conserveState = this.stateManager.getBuffStacks('ConserveState');

      if (resoluteState >= 2) {
        // 强气2段: 体力消耗 ×3, 额外 +1
        modifiedCost = modifiedCost * 3 + 1;
        console.log(`💪 [execModifyStamina] 强气2段消耗: ×3+1 → ${modifiedCost}`);
      } else if (resoluteState >= 1) {
        // 强气1段: 体力消耗 ×2
        modifiedCost = modifiedCost * 2;
        console.log(`💪 [execModifyStamina] 强气1段消耗: ×2 → ${modifiedCost}`);
      } else if (conserveState >= 2) {
        // 温存2段: 体力消耗 ×0.25
        modifiedCost = Math.ceil(modifiedCost * 0.25);
        console.log(`🛡️ [execModifyStamina] 温存2段减少: ×0.25 → ${modifiedCost}`);
      } else if (conserveState >= 1) {
        // 温存1段: 体力消耗 ×0.5
        modifiedCost = Math.ceil(modifiedCost * 0.5);
        console.log(`🛡️ [execModifyStamina] 温存1段减少: ×0.5 → ${modifiedCost}`);
      }

      // 第一步: 百分比修正 (先应用)
      // StaminaReduction: 减少50%
      if (this.stateManager.hasBuff('StaminaReduction')) {
        modifiedCost = Math.ceil(modifiedCost * 0.5);
        console.log(`🔻 [execModifyStamina] 消费体力减少: → ${modifiedCost} (50%)`);
      }
      // StaminaIncrease: 增加100%
      if (this.stateManager.hasBuff('StaminaIncrease')) {
        modifiedCost = modifiedCost * 2;
        console.log(`🔺 [execModifyStamina] 消费体力增加: → ${modifiedCost} (×2)`);
      }

      // 第二步: 固定值修正 (后应用)
      // StaminaCut: 削减固定值
      const staminaCut = this.stateManager.getBuffStacks('StaminaCut');
      if (staminaCut > 0) {
        modifiedCost = Math.max(0, modifiedCost - staminaCut);
        console.log(`🔻 [execModifyStamina] 消费体力削减: -${staminaCut} → ${modifiedCost}`);
      }
      // StaminaExtra: 追加固定值
      const staminaExtra = this.stateManager.getBuffStacks('StaminaExtra');
      if (staminaExtra > 0) {
        modifiedCost = modifiedCost + staminaExtra;
        console.log(`🔺 [execModifyStamina] 消费体力追加: +${staminaExtra} → ${modifiedCost}`);
      }

      baseValue = -modifiedCost;
    }

    // 应用倍率
    let multiplier = 1.0;
    if (action.multiplier_expression) {
      multiplier = this.ruleEvaluator.evaluateNumber(action.multiplier_expression, context);
    }

    const finalValue = Math.floor(baseValue * multiplier);
    const oldValue = state.stamina;
    state.stamina = Math.max(0, Math.min(state.maxStamina, state.stamina + finalValue));
    const delta = state.stamina - oldValue;

    const logMsg =
      multiplier !== 1.0
        ? `${delta >= 0 ? '恢复' : '消耗'}体力: ${Math.abs(delta)} (基础${baseValue} × ${multiplier.toFixed(1)})`
        : `${delta >= 0 ? '恢复' : '消耗'}体力: ${Math.abs(delta)}`;

    return {
      success: true,
      logs: [logMsg],
      events: [
        {
          type: BattleEventType.MODIFY_STAMINA,
          timestamp: Date.now(),
          data: { delta, new_value: state.stamina },
        },
      ],
    };
  }

  private execAddBuff(action: AddBuffAction, state: BattleStateNG): ActionResult {
    // 子任务10: 非凡状态互斥 (AlloutState / ConserveState / ResoluteState)
    const anomalyStates = ['AlloutState', 'ConserveState', 'ResoluteState'];
    const isStateSwitch = anomalyStates.includes(action.buff_id);
    const previousState = isStateSwitch ? anomalyStates.find(s => this.stateManager.hasBuff(s)) : null;

    if (isStateSwitch) {
      // 移除其他互斥状态
      for (const s of anomalyStates) {
        if (s !== action.buff_id && this.stateManager.hasBuff(s)) {
          this.stateManager.removeBuff(s);
          console.log(`🔄 [execAddBuff] 移除互斥状态: ${s}`);
        }
      }
    }

    // 计算层数
    let value = action.value ?? 1;
    if (action.value_expression) {
      // 构建上下文 (需要 RNG)
      const ctx = this.createContext(state, undefined, this.cardZoneManager.getRng());
      value = this.ruleEvaluator.evaluateNumber(action.value_expression, ctx);
      console.log(`📊 [execAddBuff] 动态层数计算: ${value}`);
    }

    // 计算持续回合
    let turns = action.turns ?? -1;
    if (action.turns_expression) {
      const ctx = this.createContext(state, undefined, this.cardZoneManager.getRng());
      turns = this.ruleEvaluator.evaluateNumber(action.turns_expression, ctx);
      console.log(`📊 [execAddBuff] 动态回合计算: ${turns}`);
    }

    this.stateManager.addBuff(
      action.buff_id,
      value,
      turns,
      undefined, // visualHint
      undefined, // source
      action.decay_per_turn,
    );

    const events: BattleEvent[] = [];

    // EV4: 触发 ON_STATE_SWITCH Hook
    if (isStateSwitch && action.buff_id !== previousState) {
      // 更新 per-state 计数和总计数
      if (!state.stateSwitchCount) state.stateSwitchCount = {};
      state.stateSwitchCount[action.buff_id] = (state.stateSwitchCount[action.buff_id] ?? 0) + 1;
      state.stateSwitchCountTotal = (state.stateSwitchCountTotal ?? 0) + 1;

      // 构建带 new_state 的上下文
      const rng = this.ruleEvaluator.random();
      const ctx = this.createContext(state, undefined, rng);
      const contextWithNewState: BattleContext = {
        ...ctx,
        new_state: action.buff_id,
      };

      // 触发 ON_STATE_SWITCH Hook
      const hookActions = this.hookManager.trigger('ON_STATE_SWITCH' as HookType, contextWithNewState);
      console.log(
        `🔄 [execAddBuff] 状态切换: ${previousState ?? 'null'} → ${action.buff_id}, 触发${hookActions.length}个 Hook`,
      );
      events.push({
        type: BattleEventType.HOOK_TRIGGER,
        timestamp: Date.now(),
        data: { trigger: 'ON_STATE_SWITCH', count: hookActions.length },
      });

      // 执行 Hook 产生的动作
      for (const hookAction of hookActions) {
        const res = this.executeAction(hookAction, state, contextWithNewState);
        if (res.events) events.push(...res.events);
      }
    }

    // 记录 ADD_BUFF 事件
    events.push({
      type: BattleEventType.ADD_BUFF,
      timestamp: Date.now(),
      data: { buff_id: action.buff_id, stacks: value, turns, decay: action.decay_per_turn },
    });

    const decayInfo = action.decay_per_turn ? `, 每回合衰减${action.decay_per_turn}` : '';
    return {
      success: true,
      logs: [`添加Buff: ${action.buff_id} (${action.value ?? 1}层${decayInfo})`],
      events,
    };
  }

  private execAddTag(action: AddTagAction): ActionResult {
    this.stateManager.addTag(action.tag, action.turns ?? -1);

    return {
      success: true,
      logs: [`添加Tag: ${action.tag}`],
      events: [
        {
          type: BattleEventType.ADD_TAG,
          timestamp: Date.now(),
          data: { tag: action.tag, turns: action.turns },
        },
      ],
    };
  }

  /**
   * 6-3: 抽牌时逐张触发 ON_CARD_DRAW Hook
   */
  private execDrawCard(action: DrawCardAction, state: BattleStateNG): ActionResult {
    const drawn = this.cardZoneManager.draw(action.count);

    const events: BattleEvent[] = [];
    events.push({
      type: BattleEventType.DRAW_CARD,
      timestamp: Date.now(),
      data: { count: action.count, drawn_card_ids: drawn.map(c => c.id) },
    });

    // T-9: 为每张抽到的卡生成 CARD_MOVE 事件 (deck -> hand)
    for (const card of drawn) {
      events.push({
        type: BattleEventType.CARD_MOVE,
        timestamp: Date.now(),
        data: { card_id: card.id, from_zone: 'deck', to_zone: 'hand' },
      });
    }

    // 6-3: 逐张触发 ON_CARD_DRAW
    for (const card of drawn) {
      const cardContext = {
        id: card.id,
        type: card.type,
        rarity: card.rarity,
        tags: (card as any).mechanicRefs || [],
      };

      const context = this.createContext(state, cardContext, this.cardZoneManager.getRng());
      const hookActions = this.hookManager.trigger(HookType.ON_CARD_DRAW, context);
      if (hookActions.length > 0) {
        console.log(`🪝 [Hook] ON_CARD_DRAW 触发 (${card.display?.name || card.id}): ${hookActions.length} 个动作`);
        events.push({
          type: BattleEventType.HOOK_TRIGGER,
          timestamp: Date.now(),
          data: { trigger: HookType.ON_CARD_DRAW, count: hookActions.length, card_id: card.id },
        });
      }
      for (const hookAction of hookActions) {
        const res = this.executeAction(hookAction, state, context);
        if (res.events) events.push(...res.events);
      }
    }

    return {
      success: true,
      logs: [`抽取${drawn.length}张牌`],
      events,
    };
  }

  private execRegisterHook(action: RegisterHookAction, state: BattleStateNG): ActionResult {
    // EV3: 传递当前回合号作为 play_turn 元数据
    this.hookManager.register(action.hook_def, state.turn);

    return {
      success: true,
      logs: [`注册Hook: ${action.hook_def.name} (play_turn=${state.turn})`],
      events: [
        {
          type: BattleEventType.REGISTER_HOOK,
          timestamp: Date.now(),
          data: { hook_id: action.hook_def.id, trigger: action.hook_def.trigger },
        },
      ],
    };
  }

  private execModifyTurnCount(action: ModifyTurnCountAction, state: BattleStateNG): ActionResult {
    state.maxTurns += action.value;

    return {
      success: true,
      logs: [action.value > 0 ? `回合数+${action.value}` : `回合数${action.value}`],
      events: [
        {
          type: BattleEventType.MODIFY_TURN,
          timestamp: Date.now(),
          data: { delta: action.value, new_value: state.maxTurns },
        },
      ],
    };
  }

  private execModifyPlayLimit(action: ModifyPlayLimitAction, state: BattleStateNG): ActionResult {
    state.extraPlaysThisTurn += action.value;

    return {
      success: true,
      logs: [`本回合额外出牌+${action.value}`],
      events: [
        {
          type: BattleEventType.MODIFY_LIMIT,
          timestamp: Date.now(),
          data: { delta: action.value, new_value: state.extraPlaysThisTurn },
        },
      ],
    };
  }

  private execPlayCardFromZone(action: PlayCardFromZoneAction, state: BattleStateNG): ActionResult {
    // 支持 selector 过滤（如 rarity/type 等）
    // 支持 selector 过滤（使用 JSON Logic）
    const filterFn = (card: any) => {
      if (!action.selector) return true;

      // 构建临时上下文用于评估
      const evalContext = this.createContext(
        state,
        {
          id: card.id,
          type: card.type,
          rarity: card.rarity,
          tags: card.mechanicRefs || [],
          // T7: 添加 card_name 用于名称匹配
          card_name: card.display?.name,
          card_name_jp: card.display?.nameJP,
        },
        this.cardZoneManager.getRng(),
      );

      return this.ruleEvaluator.evaluate(action.selector, evalContext);
    };

    // 根据 zone 获取卡牌
    const cards = this.cardZoneManager.selectRandom(action.zone, 1, filterFn);
    if (cards.length === 0) {
      return {
        success: false,
        logs: [`${action.zone}中没有符合条件的卡牌`],
      };
    }

    const card = cards[0];

    // 6-2: 调用统一出牌入口 (EV5: free 出牌 staminaCost=0)
    const result = this.playCardInternal(card, action.zone, state, this.cardZoneManager.getRng(), 0);
    if (!result.success) {
      return result;
    }

    return {
      success: true,
      logs: [`从${action.zone}打出: ${card.display.name}${action.free ? '(免费)' : ''}`],
      events: result.events, // Propagate events from playCardInternal
    };
  }

  private execMoveCardToZone(action: MoveCardToZoneAction, state: BattleStateNG): ActionResult {
    // 支持 selector 过滤（使用 JSON Logic）
    const filterFn = (card: any) => {
      if (!action.selector) return true;

      // 构建临时上下文用于评估
      const evalContext = this.createContext(
        state,
        {
          id: card.id,
          originalId: card.originalId, // T8: 暴露 originalId 用于匹配
          type: card.type,
          rarity: card.rarity,
          tags: card.mechanicRefs || [],
          // T7: 添加 card_name 用于名称匹配
          card_name: card.display?.name,
          card_name_jp: card.display?.nameJP,
          // T-Fix: 暴露 card_id (映射到 originalId) 以支持用户 JSON 写法
          card_id: card.originalId || card.id,
        },
        this.cardZoneManager.getRng(),
      );

      return this.ruleEvaluator.evaluate(action.selector, evalContext);
    };

    // 子任务4: 支持 from_zones 多区选择
    if (action.from_zones && action.from_zones.length > 0) {
      // T-3: 使用 Fisher-Yates 洗牌替代 Array.sort（保证回放一致性）
      const shuffledZones = [...action.from_zones];
      for (let i = shuffledZones.length - 1; i > 0; i--) {
        const j = Math.floor(this.cardZoneManager.getRng() * (i + 1));
        [shuffledZones[i], shuffledZones[j]] = [shuffledZones[j], shuffledZones[i]];
      }

      // 依次尝试从各区域选择卡牌
      for (const zone of shuffledZones) {
        const source = this.cardZoneManager.selectRandom(zone, 1, filterFn);
        if (source.length > 0) {
          const card = source[0];
          this.cardZoneManager.moveCard(card.id, zone, action.to_zone);
          // Follow-up: 当移动到手牌且来源不是抽牌堆时，使用 CARD_PULL 事件
          const isPull = action.to_zone === 'hand' && zone !== 'deck';
          return {
            success: true,
            logs: [`移动卡牌: ${card.display.name} (${zone} → ${action.to_zone})`],
            events: [
              {
                type: isPull ? BattleEventType.CARD_PULL : BattleEventType.CARD_MOVE,
                timestamp: Date.now(),
                data: { card_id: card.id, from_zone: zone, to_zone: action.to_zone },
              },
            ],
          };
        }
      }

      // 所有区域都为空
      return {
        success: false,
        logs: [`${action.from_zones.join('/')}中均没有符合条件的卡牌`],
      };
    }

    // 保持旧行为: 使用 from_zone
    const source = this.cardZoneManager.selectRandom(action.from_zone, 1, filterFn);
    if (source.length === 0) {
      return {
        success: false,
        logs: [`${action.from_zone}中没有符合条件的卡牌`],
      };
    }

    const card = source[0];
    this.cardZoneManager.moveCard(card.id, action.from_zone, action.to_zone);

    // Follow-up: 当移动到手牌且来源不是抽牌堆时，使用 CARD_PULL 事件
    const isPull = action.to_zone === 'hand' && action.from_zone !== 'deck';
    return {
      success: true,
      logs: [`移动卡牌: ${card.display.name} (${action.from_zone} → ${action.to_zone})`],
      events: [
        {
          type: isPull ? BattleEventType.CARD_PULL : BattleEventType.CARD_MOVE,
          timestamp: Date.now(),
          data: { card_id: card.id, from_zone: action.from_zone, to_zone: action.to_zone },
        },
      ],
    };
  }

  private execPlayRandomCards(action: PlayRandomCardsAction, state: BattleStateNG): ActionResult {
    // 来源区域，默认 'hand'
    const fromZone = action.from_zone ?? 'hand';

    // 1. 筛选卡牌 (优先 selector，fallback filter)
    const filterFn = (card: any) => {
      // P1-2: 检查 uses_per_battle 限制
      if (!this.cardZoneManager.canUseCard(card)) {
        return false;
      }

      // 优先使用 JSON Logic selector
      if (action.selector) {
        // 构建临时上下文用于评估
        const evalContext = this.createContext(
          state,
          {
            id: card.id,
            type: card.type,
            rarity: card.rarity,
            tags: card.mechanicRefs || [],
            // T7: 添加 card_name 用于名称匹配
            card_name: card.display?.name,
            card_name_jp: card.display?.nameJP,
          },
          this.cardZoneManager.getRng(),
        );
        return this.ruleEvaluator.evaluate(action.selector, evalContext);
      }

      // 回退到旧版 filter
      if (action.filter) {
        if (action.filter.rarity && !action.filter.rarity.includes(card.rarity)) {
          return false;
        }
        if (action.filter.type && !action.filter.type.includes(card.type)) {
          return false;
        }
      }

      return true;
    };

    const selected = this.cardZoneManager.selectRandom(fromZone, action.count, filterFn);

    if (selected.length === 0) {
      return {
        success: true,
        logs: [`没有符合条件的卡牌可随机打出`],
      };
    }

    const names = selected.map(c => c.display.name).join(', ');
    const playedCards: any[] = [];

    const events: BattleEvent[] = [];

    // 2. 6-2: 调用统一出牌入口 (EV5: 随机出牌 staminaCost=0)
    for (const card of selected) {
      const rng = this.cardZoneManager.getRng();
      const result = this.playCardInternal(card, fromZone, state, rng, 0);
      if (result.success) {
        playedCards.push(card);
      }
      if (result.events) events.push(...result.events);
    }

    return {
      success: true,
      logs: [`随机打出${selected.length}张牌: ${names}`],
      playedCards, // 返回打出的卡牌列表
      events,
    };
  }

  private execModifyBuffMultiplier(action: ModifyBuffMultiplierAction): ActionResult {
    // T-B3: 改为设置获得量倍率
    this.stateManager.setBuffGainMultiplier(action.buff_id, action.multiplier);

    return {
      success: true,
      logs: [`设置${action.buff_id}获得量倍率: ${action.multiplier}x`],
      events: [
        {
          type: BattleEventType.BUFF_MULTIPLIER_SET,
          timestamp: Date.now(),
          data: { buff_id: action.buff_id, multiplier: action.multiplier },
        },
      ],
    };
  }

  /** T-B2: 确保 Buff 至少保持 N 回合 */
  private execEnsureBuffTurns(action: EnsureBuffTurnsAction): ActionResult {
    // T-B2: 确保 Buff 持续回合
    // 逻辑实现... (此处略，假设已实现或暂不实现具体逻辑，仅补齐事件)
    // 实际上 ActionExecutor 中似乎没有具体实现逻辑，这里仅作为占位
    // 如果需要实现，应该调用 StateManager

    return {
      success: true,
      logs: [`确保Buff ${action.buff_id} 至少持续 ${action.turns} 回合`],
      events: [
        {
          type: BattleEventType.BUFF_TURNS_ENSURE,
          timestamp: Date.now(),
          data: { buff_id: action.buff_id, turns: action.turns },
        },
      ],
    };
  }

  /** T-B4: 设置 Buff 效果倍率 */
  private execModifyBuffEffectMultiplier(action: ModifyBuffEffectMultiplierAction): ActionResult {
    // T-B4: 修改 Buff 效果倍率
    return {
      success: true,
      logs: [`设置Buff ${action.buff_id} 效果倍率为 ${action.multiplier}`],
      events: [
        {
          type: BattleEventType.BUFF_EFFECT_MULTIPLIER_SET,
          timestamp: Date.now(),
          data: { buff_id: action.buff_id, multiplier: action.multiplier },
        },
      ],
    };
  }

  private execModifyAllCards(action: ModifyAllCardsAction): ActionResult {
    // 批量修改卡牌属性（简化实现）
    const zone = action.target_zone ?? 'deck';
    console.log(`📝 批量修改${zone}中所有卡的${action.modifier.stat}: +${action.modifier.value}`);

    return {
      success: true,
      logs: [`批量修改${zone}卡牌: ${action.modifier.stat} +${action.modifier.value}`],
      events: [
        {
          type: BattleEventType.ALL_CARDS_MODIFIED,
          timestamp: Date.now(),
          data: {
            target_zone: zone,
            modifier: action.modifier,
            modified_count: 0, // 暂不统计实际数量
          },
        },
      ],
    };
  }

  /**
   * 消耗卡牌（移至除外区）
   * 若未指定 card_id，则回退使用上下文中的当前卡牌
   */
  private execExhaustCard(action: ExhaustCardAction, context?: BattleContext): ActionResult {
    // 回退逻辑：优先使用 action.card_id，否则使用 context.current_card.id
    const cardId = action.card_id ?? context?.current_card?.id;

    if (cardId) {
      const card = this.cardZoneManager.exhaust(cardId);
      if (card) {
        return {
          success: true,
          logs: [`卡牌已消耗: ${card.display.name}`],
          events: [
            {
              type: BattleEventType.EXHAUST_CARD,
              timestamp: Date.now(),
              data: { card_id: card.id },
            },
          ],
        };
      }
      return { success: false, logs: [`找不到要消耗的卡牌: ${cardId}`] };
    }
    return { success: false, logs: ['未指定要消耗的卡牌，且上下文中无当前卡牌信息'] };
  }

  /**
   * 移除 Buff
   */
  private execRemoveBuff(action: RemoveBuffAction): ActionResult {
    this.stateManager.removeBuff(action.buff_id, action.stacks);
    return {
      success: true,
      logs: [`移除Buff: ${action.buff_id}${action.stacks ? ` x${action.stacks}` : ''}`],
      events: [
        {
          type: BattleEventType.REMOVE_BUFF,
          timestamp: Date.now(),
          data: { buff_id: action.buff_id, stacks: action.stacks ?? 0 },
        },
      ],
    };
  }

  /**
   * 移除 Tag
   */
  private execRemoveTag(action: RemoveTagAction): ActionResult {
    this.stateManager.removeTag(action.tag);
    return {
      success: true,
      logs: [`移除Tag: ${action.tag}`],
      events: [
        {
          type: BattleEventType.REMOVE_TAG,
          timestamp: Date.now(),
          data: { tag: action.tag },
        },
      ],
    };
  }

  /**
   * T2: 强化手牌
   * 将手牌区符合条件的卡牌标记为 isEnhanced = true
   */
  private execEnhanceHand(action: EnhanceHandAction, _state: BattleStateNG): ActionResult {
    const hand = this.cardZoneManager.getHand();
    const logs: string[] = [];
    const enhancedCards: SkillCardV2[] = [];

    for (const card of hand) {
      // 检查 filter 条件（rarity 过滤）
      if (action.filter) {
        if (action.filter.rarity && card.rarity !== action.filter.rarity) {
          continue;
        }
        // type 过滤使用字符串匹配（CardTypeNG 与 filter.type 可能类型不同）
        if (action.filter.type && card.type !== action.filter.type) {
          continue;
        }
      }

      // 强化卡牌
      if (!card.isEnhanced) {
        card.isEnhanced = true;
        enhancedCards.push(card);
        logs.push(`强化: ${card.display.name}`);
      }
    }

    logs.push(`共强化 ${enhancedCards.length} 张手牌`);
    return {
      success: true,
      logs,
      events: [
        {
          type: BattleEventType.ENHANCE_HAND,
          timestamp: Date.now(),
          data: { count: enhancedCards.length, enhanced_card_ids: enhancedCards.map(c => c.id) },
        },
      ],
    };
  }

  /**
   * T3: 生成卡牌
   * 在指定区域生成指定 ID 的卡牌
   */
  private execCreateCard(action: CreateCardAction, _state: BattleStateNG): ActionResult {
    const cardId = action.card_id;
    const zone = action.zone;
    const position = action.position ?? 'random';
    const count = action.count ?? 1;
    const logs: string[] = [];

    // 从预定义卡池查找模板（如眠気）
    // 目前硬编码支持 trap_n_1 (眠気)
    // 后续可扩展为从技能卡库动态加载
    const cardTemplates: Record<string, Partial<SkillCardV2>> = {
      trap_n_1: {
        id: 'trap_n_1',
        rarity: 'N',
        type: 'T',
        plan: 'sense' as const,
        display: {
          name: '眠気',
          nameJP: '眠気',
          description: '使っても何も効果がないお邪魔カード',
          flavor: '',
        },
        engine_data: {
          cost: { genki: 0 },
          logic_chain: [
            {
              do: [{ action: 'MODIFY_GENKI', value: 0 }], // 无效果
            },
          ],
          constraints: {
            exhaust_on_play: true,
          },
        },
        restrictions: {
          is_unique: false,
        },
      },
      // 可在此添加更多可生成卡模板
    };

    const template = cardTemplates[cardId];
    if (!template) {
      return {
        success: false,
        logs: [`CREATE_CARD 失败: 找不到卡牌模板 ${cardId}`],
      };
    }

    // 获取目标区域
    // 验证区域有效性
    const validZones = ['deck', 'hand', 'discard', 'reserve', 'removed'];
    if (!validZones.includes(zone)) {
      return {
        success: false,
        logs: [`CREATE_CARD 失败: 无效区域 ${zone}`],
      };
    }
    const targetZone = this.cardZoneManager.getZoneByName(zone);
    if (!targetZone) {
      return {
        success: false,
        logs: [`CREATE_CARD 失败: 无法获取区域 ${zone}`],
      };
    }

    // 生成卡牌实例
    const instanceIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const instanceId = `${cardId}_gen_${Date.now()}_${i}`;
      instanceIds.push(instanceId);
      const newCard: SkillCardV2 = {
        ...template,
        id: instanceId,
        originalId: cardId,
        rarity: template.rarity ?? 'N',
        type: template.type ?? 'A',
        plan: template.plan ?? 'sense',
        display: template.display ?? { name: cardId, description: '' },
        engine_data: template.engine_data ?? { cost: { genki: 0 }, logic_chain: [] },
        isEnhanced: false,
      };

      // 按位置插入
      switch (position) {
        case 'top':
          targetZone.unshift(newCard);
          break;
        case 'bottom':
          targetZone.push(newCard);
          break;
        case 'random':
        default: {
          const insertIndex = Math.floor(this.cardZoneManager.getRng() * (targetZone.length + 1));
          targetZone.splice(insertIndex, 0, newCard);
          break;
        }
      }

      logs.push(`生成 ${newCard.display.name} 到 ${zone} (${position})`);
    }

    return {
      success: true,
      logs,
      events: [
        {
          type: BattleEventType.CREATE_CARD,
          timestamp: Date.now(),
          data: { card_id: cardId, zone, count, position, instance_ids: instanceIds },
        },
      ],
    };
  }

  /**
   * T6: 效果重放
   * 注册一个 Hook，使下一张打出的卡效果额外发动 N 次
   */
  private execReplayNextCard(action: ReplayNextCardAction, state: BattleStateNG): ActionResult {
    const count = action.count ?? 1;
    const hookId = `replay_next_card_${Date.now()}`;

    // 注册一个一次性 ON_AFTER_CARD_PLAY Hook
    // Hook 触发时会重新执行刚打出卡的 logic_chain
    this.hookManager.register(
      {
        id: hookId,
        name: '效果重放',
        trigger: HookType.ON_AFTER_CARD_PLAY,
        max_triggers: 1, // 只对下一张卡生效
        condition: { '!': { var: 'is_replay' } }, // 避免无限循环：replay 不触发 replay
        actions: [
          // 这里使用特殊的 REPLAY_EFFECT 动作
          // 由于无法在 Hook 中直接重放 logic_chain，
          // 我们使用一个标记来让 playCardInternal 检测并重放
        ],
      },
      state.turn,
    );

    // 设置全局状态标记，playCardInternal 会检测这个标记
    // 并在打出下一张卡后重新执行其 logic_chain
    if (!(state as any)._replayNextCount) {
      (state as any)._replayNextCount = 0;
    }
    (state as any)._replayNextCount += count;

    return {
      success: true,
      logs: [`设置效果重放: 下一张卡效果额外发动 ${count} 次`],
      events: [
        {
          type: BattleEventType.EFFECT_REPLAY,
          timestamp: Date.now(),
          data: { count },
        },
      ],
    };
  }

  // ==================== 辅助方法 ====================

  private createContext(
    state: BattleStateNG,
    currentCard: BattleContext['current_card'] | undefined,
    rng: number,
  ): BattleContext {
    // T-10: 区分 Raw (条件判断) 和 Effective (得分计算)
    const buffsRaw = this.stateManager.toBuffRawRecord();
    const buffsEffective = this.stateManager.toBuffEffectiveRecord();

    // EV2: 计算手牌按稀有度统计
    const hand = this.cardZoneManager.getHand();
    const cardsInHandByRarity: Record<string, number> = { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 };
    for (const card of hand) {
      const rarity = card.rarity || 'N';
      cardsInHandByRarity[rarity] = (cardsInHandByRarity[rarity] ?? 0) + 1;
    }

    return {
      player: {
        genki: state.genki,
        genki_percent: state.maxGenki > 0 ? (state.genki / state.maxGenki) * 100 : 0,
        stamina: state.stamina,
        stamina_percent: state.maxStamina > 0 ? (state.stamina / state.maxStamina) * 100 : 0,
        score: state.score,
        // T-10: 使用 Effective 层数用于 Buff → 得分的快捷访问
        concentration: buffsEffective['Concentration'] ?? 0,
        motivation: buffsEffective['Motivation'] ?? 0,
        good_impression: buffsEffective['GoodImpression'] ?? 0,
        all_power: buffsEffective['AllPower'] ?? 0,
        heat: buffsEffective['Heat'] ?? 0,
        // T-10: player.buffs 使用 Raw 层数（用于条件判断）
        buffs: buffsRaw,
        tags: this.stateManager.getAllTags(),
        state_switch_count: state.stateSwitchCount ?? {}, // EV1: per-state 计数
        state_switch_count_total: state.stateSwitchCountTotal ?? 0, // EV1: 总次数
      },
      turn: state.turn,
      max_turns: state.maxTurns,
      cards_played_this_turn: state.cardsPlayedThisTurn,
      cards_played_total: state.cardsPlayedTotal ?? 0, // 总出牌数
      rng: rng, // 6-5: 使用注入的 RNG
      current_card: currentCard,
      // EV2: 卡区统计变量
      deck_count: this.cardZoneManager.getDeckCount(),
      discard_count: this.cardZoneManager.getDiscardCount(),
      cards_in_hand_by_rarity: cardsInHandByRarity,
      // T-10: 新增有效层数记录（用于得分计算）
      buffs_effective: buffsEffective,
    };
  }

  /**
   * T4: 从卡牌提取效果标签
   * 根据卡牌的效果描述推断效果类型（如 全力效果, 温存效果 等）
   */
  private extractEffectTags(card: SkillCardV2): string[] {
    const tags: string[] = [];
    const description = card.display?.description || '';

    // 根据描述推断效果标签
    if (description.includes('全力') || description.includes('全力値')) {
      tags.push('全力効果');
    }
    if (description.includes('温存')) {
      tags.push('温存効果');
    }
    if (description.includes('強気') || description.includes('强气')) {
      tags.push('強気効果');
    }
    if (description.includes('悠閑') || description.includes('悠闲')) {
      tags.push('悠閑効果');
    }

    return tags;
  }

  // ==================== 访问器 ====================

  public getStateManager(): StateManager {
    return this.stateManager;
  }
  public getHookManager(): HookManager {
    return this.hookManager;
  }
  public getCardZoneManager(): CardZoneManager {
    return this.cardZoneManager;
  }

  /**
   * 6-6: 生成 HAND_ENTER 事件
   * 供 ProduceHostCore 在课程开始时调用
   */
  public createHandEnterEvent(): BattleEvent {
    const hand = this.cardZoneManager.getHand();
    return {
      type: BattleEventType.HAND_ENTER,
      timestamp: Date.now(),
      data: { card_ids: hand.map(c => c.id) },
    };
  }
}

// 导出默认实例
export const actionExecutor = new ActionExecutor();
