import { ActionExecutor, BattleStateNG } from './ActionExecutor';
import { buildBattleContext, extendContextWithState } from './BattleContextBuilder';
import { CardZoneManager } from './CardZoneManager';
import { HookManager } from './HookManager';
import { RuleEvaluator } from './RuleEvaluator';
import { StateManager } from './StateManager';
import { AtomicAction, BattleEvent, BattleEventType, HookType } from './types';

/**
 * TurnController - 回合流程控制器
 * T-6: 统一管理回合开始/结束流程
 */
export class TurnController {
  constructor(
    private stateManager: StateManager,
    private hookManager: HookManager,
    private cardZoneManager: CardZoneManager,
    private actionExecutor: ActionExecutor,
    private ruleEvaluator: RuleEvaluator,
  ) {}

  /**
   * 结束当前回合并开始下一回合
   * @param battleState 战斗状态
   * @returns 产生的战斗事件列表
   */
  public endTurn(battleState: BattleStateNG): BattleEvent[] {
    console.log('🔄 [TurnController] 回合结束处理开始');
    const events: BattleEvent[] = [];

    // 获取 RNG (T-2: 统一随机源)
    const rng = this.ruleEvaluator.random();

    // 1. 触发 ON_TURN_END Hook
    // T-17: 使用共享的 buildBattleContext
    const endContext = buildBattleContext(battleState, this.stateManager, this.cardZoneManager, rng);
    const endActions = this.hookManager.trigger(HookType.ON_TURN_END, endContext);
    if (endActions.length > 0) {
      console.log(`🪝 [TurnController] 触发 ON_TURN_END Hook: ${endActions.length} 个动作`);
      events.push({
        type: BattleEventType.HOOK_TRIGGER,
        timestamp: Date.now(),
        data: { trigger: HookType.ON_TURN_END, count: endActions.length },
      });
      endActions.forEach((action: AtomicAction) => {
        const result = this.actionExecutor.executeAction(action, battleState);
        if (result.logs.length > 0) console.log(result.logs.join('\n'));
        if (result.events) events.push(...result.events);
      });
    }

    // 3. hookManager.onTurnEnd()
    this.hookManager.onTurnEnd();

    // 子任务6: 好印象回合结算 (在 stateManager.onTurnEnd 之前，因为后者会衰减层数)
    // T-10: 使用 toBuffEffectiveRecord() 获取有效层数（用于得分计算）
    const buffs = this.stateManager.toBuffEffectiveRecord();
    const goodImpression = buffs['GoodImpression'] ?? 0;
    if (goodImpression > 0) {
      // T-17: 触发 ON_BEFORE_SCORE_CALC Hook
      const scoreCalcRng = this.ruleEvaluator.random();
      const beforeScoreCtx = buildBattleContext(battleState, this.stateManager, this.cardZoneManager, scoreCalcRng);
      const beforeScoreActions = this.hookManager.trigger(HookType.ON_BEFORE_SCORE_CALC, beforeScoreCtx);
      if (beforeScoreActions.length > 0) {
        console.log(`🪩 [TurnController] 触发 ON_BEFORE_SCORE_CALC Hook: ${beforeScoreActions.length} 个动作`);
        events.push({
          type: BattleEventType.HOOK_TRIGGER,
          timestamp: Date.now(),
          data: { trigger: HookType.ON_BEFORE_SCORE_CALC, count: beforeScoreActions.length },
        });
        beforeScoreActions.forEach((action: AtomicAction) => {
          const result = this.actionExecutor.executeAction(action, battleState);
          if (result.logs.length > 0) console.log(result.logs.join('\n'));
          if (result.events) events.push(...result.events);
        });
      }

      let finalGoodImpressionScore = goodImpression;

      // 好印象强化 (GoodImpressionBonus) - 如"好印象效果增加20%"
      const goodImpressionBonus = buffs['GoodImpressionBonus'] ?? 0;
      if (goodImpressionBonus > 0) {
        finalGoodImpressionScore = Math.floor(finalGoodImpressionScore * (1 + goodImpressionBonus / 100));
        console.log(`💕 [TurnController] 好印象强化: +${goodImpressionBonus}% → ${finalGoodImpressionScore}分`);
      }

      // 通用得分加成 (ScoreBonus) - 如饮料效果"得分增加30%"
      const scoreBonus = buffs['ScoreBonus'] ?? 0;
      if (scoreBonus > 0) {
        finalGoodImpressionScore = Math.floor(finalGoodImpressionScore * (1 + scoreBonus / 100));
        console.log(`🍹 [TurnController] 通用得分加成: +${scoreBonus}% → ${finalGoodImpressionScore}分`);
      }

      battleState.score += finalGoodImpressionScore;
      console.log(`💕 [TurnController] 好印象结算: 基础${goodImpression} → 最终+${finalGoodImpressionScore}分`);

      events.push({
        type: BattleEventType.GAIN_SCORE,
        timestamp: Date.now(),
        data: { value: finalGoodImpressionScore, base: goodImpression, multiplier: 1 }, // 简化
      });

      // T-17: 触发 ON_AFTER_SCORE_CALC Hook
      const afterScoreRng = this.ruleEvaluator.random();
      const afterScoreCtx = buildBattleContext(battleState, this.stateManager, this.cardZoneManager, afterScoreRng);
      const afterScoreActions = this.hookManager.trigger(HookType.ON_AFTER_SCORE_CALC, afterScoreCtx);
      if (afterScoreActions.length > 0) {
        console.log(`🪩 [TurnController] 触发 ON_AFTER_SCORE_CALC Hook: ${afterScoreActions.length} 个动作`);
        events.push({
          type: BattleEventType.HOOK_TRIGGER,
          timestamp: Date.now(),
          data: { trigger: HookType.ON_AFTER_SCORE_CALC, count: afterScoreActions.length },
        });
        afterScoreActions.forEach((action: AtomicAction) => {
          const result = this.actionExecutor.executeAction(action, battleState);
          if (result.logs.length > 0) console.log(result.logs.join('\n'));
          if (result.events) events.push(...result.events);
        });
      }
    }

    // 子任务6: 热意归零 (仅清空，不加分)
    // 热意也用 toBuffRecord 获取有效层数
    const heat = buffs['Heat'] ?? 0;
    if (heat > 0) {
      this.stateManager.removeBuff('Heat');
      console.log(`🔥 [TurnController] 热意归零: ${heat} → 0`);
      events.push({
        type: BattleEventType.REMOVE_BUFF,
        timestamp: Date.now(),
        data: { buff_id: 'Heat', stacks: heat },
      });
    }

    // 4. stateManager.onTurnEnd()
    this.stateManager.onTurnEnd();

    // 5. cardZoneManager.discardHand()
    const handCards = this.cardZoneManager.getHand();
    if (handCards.length > 0) {
      events.push({
        type: BattleEventType.TURN_END_DISCARD,
        timestamp: Date.now(),
        data: { count: handCards.length, discarded_card_ids: handCards.map(c => c.id) },
      });
      // 生成 CARD_MOVE 事件
      handCards.forEach(c => {
        events.push({
          type: BattleEventType.CARD_MOVE,
          timestamp: Date.now(),
          data: { card_id: c.id, from_zone: 'hand', to_zone: 'discard' },
        });
      });
    }
    this.cardZoneManager.discardHand();

    // 6. 更新回合计数
    battleState.turn++;
    battleState.cardsPlayedThisTurn = 0;
    battleState.extraPlaysThisTurn = 0;
    console.log(`⏩ [TurnController] 进入第 ${battleState.turn} 回合`);
    events.push({
      type: BattleEventType.MODIFY_TURN,
      timestamp: Date.now(),
      data: { delta: 1, new_value: battleState.turn },
    });

    // 7. 抽牌 (默认抽3张)
    // TODO: 抽牌数量应该可配置，目前保持与 ProduceHost 一致
    const drawnCards = this.cardZoneManager.draw(3);
    console.log(`🃏 [TurnController] 新回合抽牌: ${this.cardZoneManager.getHandCount()}张手牌`);

    events.push({
      type: BattleEventType.TURN_START_DRAW,
      timestamp: Date.now(),
      data: { count: drawnCards.length, drawn_card_ids: drawnCards.map(c => c.id) },
    });
    // 生成 CARD_MOVE 事件
    drawnCards.forEach(c => {
      events.push({
        type: BattleEventType.CARD_MOVE,
        timestamp: Date.now(),
        data: { card_id: c.id, from_zone: 'deck', to_zone: 'hand' },
      });
    });

    // 子任务10: AllPower >= 10 时进入 AlloutState
    const allPower = this.stateManager.getBuffStacks('AllPower');
    if (allPower >= 10) {
      // 子任务11: 检测温存阶段 (在移除前)
      const conserveStage = this.stateManager.getBuffStacks('ConserveState');

      // 结算溢出：AllPower -= 10
      const overflow = allPower - 10;
      this.stateManager.removeBuff('AllPower');
      if (overflow > 0) {
        this.stateManager.addBuff('AllPower', overflow, -1);
      }
      console.log(`⚡ [TurnController] 全力值达到阈值: ${allPower} → ${overflow}`);

      // 子任务10: 移除互斥状态并进入 AlloutState
      this.stateManager.removeBuff('ConserveState');
      this.stateManager.removeBuff('ResoluteState');
      this.stateManager.addBuff('AlloutState', 1, -1);
      // EV1: 更新 per-state 计数和总计数
      if (!battleState.stateSwitchCount) battleState.stateSwitchCount = {};
      battleState.stateSwitchCount['AlloutState'] = (battleState.stateSwitchCount['AlloutState'] ?? 0) + 1;
      battleState.stateSwitchCountTotal = (battleState.stateSwitchCountTotal ?? 0) + 1;
      console.log(
        `🔥 [TurnController] 进入全力状态! AlloutState=${battleState.stateSwitchCount['AlloutState']}, 总次数=${battleState.stateSwitchCountTotal}`,
      );

      events.push({
        type: BattleEventType.ADD_BUFF,
        timestamp: Date.now(),
        data: { buff_id: 'AlloutState', stacks: 1 },
      });

      // 子任务11: 温存转全力奖励 (仅在进入全力的那一回合触发一次)
      if (conserveStage >= 2) {
        // 温存2段 → 全力: Heat +8, 额外出牌 +1
        this.stateManager.addBuff('Heat', 8, -1);
        battleState.extraPlaysThisTurn = (battleState.extraPlaysThisTurn ?? 0) + 1;
        console.log(`🎁 [TurnController] 温存2段转全力奖励: Heat+8, 额外出牌+1`);
        events.push({ type: BattleEventType.ADD_BUFF, timestamp: Date.now(), data: { buff_id: 'Heat', stacks: 8 } });
      } else if (conserveStage >= 1) {
        // 温存1段 → 全力: Heat +5, 额外出牌 +1
        this.stateManager.addBuff('Heat', 5, -1);
        battleState.extraPlaysThisTurn = (battleState.extraPlaysThisTurn ?? 0) + 1;
        console.log(`🎁 [TurnController] 温存1段转全力奖励: Heat+5, 额外出牌+1`);
        events.push({ type: BattleEventType.ADD_BUFF, timestamp: Date.now(), data: { buff_id: 'Heat', stacks: 5 } });
      }

      // 子任务11: 全力状态自带额外出牌 +1
      battleState.extraPlaysThisTurn = (battleState.extraPlaysThisTurn ?? 0) + 1;
      console.log(`🃏 [TurnController] 全力状态额外出牌+1, 总额外出牌=${battleState.extraPlaysThisTurn}`);

      // EV4: 触发 ON_STATE_SWITCH Hook
      // T-17: 使用共享的 buildBattleContext + extendContextWithState
      const stateSwitchRng = this.ruleEvaluator.random();
      const stateSwitchCtx = buildBattleContext(battleState, this.stateManager, this.cardZoneManager, stateSwitchRng);
      const contextWithNewState = extendContextWithState(stateSwitchCtx, 'AlloutState');
      const hookActions = this.hookManager.trigger(HookType.ON_STATE_SWITCH as HookType, contextWithNewState);
      console.log(`🔄 [TurnController] 状态切换至 AlloutState, 触发${hookActions.length}个 Hook`);
      events.push({
        type: BattleEventType.HOOK_TRIGGER,
        timestamp: Date.now(),
        data: { trigger: 'ON_STATE_SWITCH', count: hookActions.length },
      });
      // 执行 Hook 产生的动作
      for (const action of hookActions) {
        const result = this.actionExecutor.executeAction(action, battleState);
        if (result.logs.length > 0) console.log(result.logs.join('\n'));
        if (result.events) events.push(...result.events);
      }
    }

    // 8. 触发 ON_TURN_START Hook
    // 注意：需要使用新的 RNG 值
    // T-17: 使用共享的 buildBattleContext
    const startRng = this.ruleEvaluator.random();
    const startContext = buildBattleContext(battleState, this.stateManager, this.cardZoneManager, startRng);
    const startActions = this.hookManager.trigger(HookType.ON_TURN_START, startContext);
    if (startActions.length > 0) {
      console.log(`🪝 [TurnController] 触发 ON_TURN_START Hook: ${startActions.length} 个动作`);
      events.push({
        type: BattleEventType.HOOK_TRIGGER,
        timestamp: Date.now(),
        data: { trigger: HookType.ON_TURN_START, count: startActions.length },
      });
      startActions.forEach((action: AtomicAction) => {
        const result = this.actionExecutor.executeAction(action, battleState);
        if (result.logs.length > 0) console.log(result.logs.join('\n'));
        if (result.events) events.push(...result.events);
      });
    }

    console.log('✅ [TurnController] 回合流程结束');
    return events;
  }
}
