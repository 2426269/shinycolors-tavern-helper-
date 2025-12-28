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
  DrawCardAction,
  GainScoreAction,
  ModifyAllCardsAction,
  ModifyBuffMultiplierAction,
  ModifyGenkiAction,
  ModifyPlayLimitAction,
  ModifyTurnCountAction,
  MoveCardToZoneAction,
  PlayCardFromZoneAction,
  PlayRandomCardsAction,
  RegisterHookAction,
} from './types';

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
  stateSwitchCount: number;
  anomalyState: 'allout' | 'conserve' | 'resolute' | null;
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
  }

  // ==================== 执行入口 ====================

  /**
   * 执行一个 logic_chain
   */
  public executeLogicChain(steps: AtomicStep[], state: BattleStateNG): ActionResult {
    const result: ActionResult = {
      success: true,
      logs: [],
      score_gained: 0,
    };

    for (const step of steps) {
      const stepResult = this.executeStep(step, state);
      result.logs.push(...stepResult.logs);
      result.score_gained = (result.score_gained ?? 0) + (stepResult.score_gained ?? 0);
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
  public executeStep(step: AtomicStep, state: BattleStateNG): ActionResult {
    const result: ActionResult = {
      success: true,
      logs: [],
      score_gained: 0,
    };

    // 创建上下文用于条件评估
    const context = this.createContext(state);

    // 检查条件
    if (step.when) {
      const conditionMet = this.ruleEvaluator.evaluateCondition(step.when, context);
      if (!conditionMet) {
        result.logs.push('条件不满足，跳过此步骤');
        return result;
      }
    }

    // 执行所有动作
    for (const action of step.do) {
      const actionResult = this.executeAction(action, state, context);
      result.logs.push(...actionResult.logs);
      result.score_gained = (result.score_gained ?? 0) + (actionResult.score_gained ?? 0);
    }

    return result;
  }

  /**
   * 执行单个原子操作
   */
  public executeAction(action: AtomicAction, state: BattleStateNG, context?: BattleContext): ActionResult {
    const ctx = context ?? this.createContext(state);

    switch (action.action) {
      case 'GAIN_SCORE':
        return this.execGainScore(action, state, ctx);
      case 'MODIFY_GENKI':
        return this.execModifyGenki(action, state, ctx);
      case 'ADD_BUFF':
        return this.execAddBuff(action);
      case 'ADD_TAG':
        return this.execAddTag(action);
      case 'DRAW_CARD':
        return this.execDrawCard(action);
      case 'REGISTER_HOOK':
        return this.execRegisterHook(action);
      case 'MODIFY_TURN_COUNT':
        return this.execModifyTurnCount(action, state);
      case 'MODIFY_PLAY_LIMIT':
        return this.execModifyPlayLimit(action, state);
      case 'PLAY_CARD_FROM_ZONE':
        return this.execPlayCardFromZone(action, state);
      case 'MOVE_CARD_TO_ZONE':
        return this.execMoveCardToZone(action);
      case 'MODIFY_BUFF_MULTIPLIER':
        return this.execModifyBuffMultiplier(action);
      case 'MODIFY_ALL_CARDS':
        return this.execModifyAllCards(action);
      case 'PLAY_RANDOM_CARDS':
        return this.execPlayRandomCards(action, state);
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

    // 应用倍率
    let multiplier = 1.0;
    if (action.multiplier_expression) {
      multiplier = this.ruleEvaluator.evaluateNumber(action.multiplier_expression, context);
    }

    // 应用好调加成
    if (this.stateManager.hasBuff('GoodCondition')) {
      multiplier *= 1.5;
    }
    // 应用绝好调加成
    const excellentStacks = this.stateManager.getBuffStacks('ExcellentCondition');
    if (excellentStacks > 0) {
      multiplier *= 1 + excellentStacks * 0.1;
    }
    // 应用集中加成
    const concentration = this.stateManager.getBuffStacks('Concentration');
    if (concentration > 0) {
      baseValue += concentration;
    }

    const finalScore = Math.floor(baseValue * multiplier);
    state.score += finalScore;

    return {
      success: true,
      logs: [`获得分数: ${finalScore} (基础${baseValue} × ${multiplier.toFixed(2)})`],
      score_gained: finalScore,
    };
  }

  private execModifyGenki(action: ModifyGenkiAction, state: BattleStateNG, context: BattleContext): ActionResult {
    let baseValue = action.value ?? 0;

    // 如果有动态表达式，计算它
    if (action.value_expression) {
      baseValue = this.ruleEvaluator.evaluateNumber(action.value_expression, context);
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
        ? `${delta >= 0 ? '恢复' : '消耗'}体力: ${Math.abs(delta)} (基础${baseValue} × ${multiplier.toFixed(1)})`
        : `${delta >= 0 ? '恢复' : '消耗'}体力: ${Math.abs(delta)}`;

    return {
      success: true,
      logs: [logMsg],
    };
  }

  private execAddBuff(action: AddBuffAction): ActionResult {
    this.stateManager.addBuff(action.buff_id, action.value ?? 1, action.turns ?? -1);

    return {
      success: true,
      logs: [`添加Buff: ${action.buff_id} (${action.value ?? 1}层)`],
    };
  }

  private execAddTag(action: AddTagAction): ActionResult {
    this.stateManager.addTag(action.tag, action.turns ?? -1);

    return {
      success: true,
      logs: [`添加Tag: ${action.tag}`],
    };
  }

  private execDrawCard(action: DrawCardAction): ActionResult {
    const drawn = this.cardZoneManager.draw(action.count);

    return {
      success: true,
      logs: [`抽取${drawn.length}张牌`],
    };
  }

  private execRegisterHook(action: RegisterHookAction): ActionResult {
    this.hookManager.register(action.hook_def);

    return {
      success: true,
      logs: [`注册Hook: ${action.hook_def.name}`],
    };
  }

  private execModifyTurnCount(action: ModifyTurnCountAction, state: BattleStateNG): ActionResult {
    state.maxTurns += action.value;

    return {
      success: true,
      logs: [action.value > 0 ? `回合数+${action.value}` : `回合数${action.value}`],
    };
  }

  private execModifyPlayLimit(action: ModifyPlayLimitAction, state: BattleStateNG): ActionResult {
    state.extraPlaysThisTurn += action.value;

    return {
      success: true,
      logs: [`本回合额外出牌+${action.value}`],
    };
  }

  private execPlayCardFromZone(action: PlayCardFromZoneAction, state: BattleStateNG): ActionResult {
    // 从保留区获取第一张牌并打出
    const reserve = this.cardZoneManager.getReserve();
    if (reserve.length === 0) {
      return {
        success: false,
        logs: ['保留区没有卡牌'],
      };
    }

    const card = reserve[0];
    this.cardZoneManager.playFromReserve(card.id);

    return {
      success: true,
      logs: [`从${action.zone}打出: ${card.display.name}${action.free ? '(免费)' : ''}`],
    };
  }

  private execMoveCardToZone(action: MoveCardToZoneAction): ActionResult {
    // 简化实现：移动第一张符合条件的卡
    const source = this.cardZoneManager.selectRandom(action.from_zone, 1);
    if (source.length === 0) {
      return {
        success: false,
        logs: [`${action.from_zone}没有可移动的卡牌`],
      };
    }

    const card = source[0];
    this.cardZoneManager.moveCard(card.id, action.from_zone, action.to_zone);

    return {
      success: true,
      logs: [`移动卡牌: ${card.display.name} (${action.from_zone} → ${action.to_zone})`],
    };
  }

  private execModifyBuffMultiplier(action: ModifyBuffMultiplierAction): ActionResult {
    this.stateManager.setBuffMultiplier(action.buff_id, action.multiplier);

    return {
      success: true,
      logs: [`设置${action.buff_id}倍率: ${action.multiplier}x`],
    };
  }

  private execModifyAllCards(action: ModifyAllCardsAction): ActionResult {
    // 批量修改卡牌属性（简化实现）
    const zone = action.target_zone ?? 'deck';
    console.log(`📝 批量修改${zone}中所有卡的${action.modifier.stat}: +${action.modifier.value}`);

    return {
      success: true,
      logs: [`批量修改${zone}卡牌: ${action.modifier.stat} +${action.modifier.value}`],
    };
  }

  private execPlayRandomCards(action: PlayRandomCardsAction, state: BattleStateNG): ActionResult {
    const filter = (card: any) => {
      if (action.filter?.rarity && !action.filter.rarity.includes(card.rarity)) {
        return false;
      }
      if (action.filter?.type && !action.filter.type.includes(card.type)) {
        return false;
      }
      return true;
    };

    const selected = this.cardZoneManager.selectRandom('hand', action.count, filter);
    const names = selected.map(c => c.display.name).join(', ');

    // 这里应该递归执行选中卡牌的效果，简化实现只记录日志
    return {
      success: true,
      logs: [`随机打出${selected.length}张牌: ${names || '无'}`],
    };
  }

  // ==================== 辅助方法 ====================

  private createContext(state: BattleStateNG): BattleContext {
    return {
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
        buffs: this.stateManager.toBuffRecord(),
        tags: this.stateManager.getAllTags(),
        state_switch_count: state.stateSwitchCount,
      },
      turn: state.turn,
      max_turns: state.maxTurns,
      cards_played_this_turn: state.cardsPlayedThisTurn,
    };
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
}

// 导出默认实例
export const actionExecutor = new ActionExecutor();
