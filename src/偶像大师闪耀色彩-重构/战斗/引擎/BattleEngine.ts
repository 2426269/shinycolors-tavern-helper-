/**
 * 战斗引擎
 * 管理整个战斗流程：回合、出牌、结算
 */

import type { BattleState, ProducePlan, SkillCard } from '../类型';
import { createInitialBattleState } from '../类型';
import { BuffManager } from './BuffManager';
import { EffectEngine, type EffectResult } from './EffectEngine';

export type BattleResult = 'continue' | 'clear' | 'perfect' | 'fail';

export interface CardUseResult {
  success: boolean;
  effectResult: EffectResult;
  message: string;
}

export class BattleEngine {
  private state: BattleState;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(planType: ProducePlan, deck: SkillCard[], options?: Partial<BattleState>) {
    this.state = createInitialBattleState(planType, deck, options);
    this.shuffleDeck();
  }

  // ==================== 状态获取 ====================

  getState(): Readonly<BattleState> {
    return this.state;
  }

  // ==================== 战斗流程 ====================

  /**
   * 开始战斗
   */
  startBattle(): void {
    console.log('=== 战斗开始 ===');
    this.state.turn = 0;
    this.startTurn();
  }

  /**
   * 开始新回合
   */
  startTurn(): void {
    this.state.turn++;
    this.state.cardsUsedThisTurn = 0;
    this.state.maxCardsPerTurn = 1;
    this.state.nextCardDouble = false;

    console.log(`\n=== 回合 ${this.state.turn}/${this.state.maxTurns} ===`);

    // 回合开始时处理Buff
    BuffManager.onTurnStart(this.state);

    // 抽牌
    this.drawCards(3);

    this.emit('turnStart', { turn: this.state.turn });
  }

  /**
   * 使用卡牌
   */
  useCard(cardIndex: number): CardUseResult {
    const card = this.state.hand[cardIndex];

    if (!card) {
      return {
        success: false,
        effectResult: { success: false, scoreGained: 0, logs: [] },
        message: '无效的卡牌索引',
      };
    }

    // 检查使用次数
    if (this.state.cardsUsedThisTurn >= this.state.maxCardsPerTurn) {
      return {
        success: false,
        effectResult: { success: false, scoreGained: 0, logs: [] },
        message: '本回合已无法使用更多卡牌',
      };
    }

    // 检查课程限制
    if (card.limitPerBattle && card.usedThisBattle >= card.limitPerBattle) {
      return {
        success: false,
        effectResult: { success: false, scoreGained: 0, logs: [] },
        message: `此卡本战斗已达使用上限 (${card.limitPerBattle}次)`,
      };
    }

    // 检查并消耗Cost
    if (!this.consumeCardCost(card)) {
      return {
        success: false,
        effectResult: { success: false, scoreGained: 0, logs: [] },
        message: '资源不足，无法使用此卡',
      };
    }

    console.log(`\n[使用卡牌] ${card.name} (${card.rarity})`);

    // 执行效果
    const doubleEffect = this.state.nextCardDouble;
    if (doubleEffect) {
      console.log('[效果翻倍]');
      this.state.nextCardDouble = false;
    }

    const effects = card.isEnhanced && card.effectsEnhanced ? card.effectsEnhanced : card.effects;

    const effectResult = EffectEngine.execute(this.state, effects, doubleEffect);

    // 更新卡牌状态
    card.usedThisBattle++;
    this.state.cardsUsedThisTurn++;

    // 移动到弃牌堆
    this.state.hand.splice(cardIndex, 1);
    this.state.discardPile.push(card);

    this.emit('cardUsed', { card, effectResult });

    return {
      success: true,
      effectResult,
      message: effectResult.logs.join('\n'),
    };
  }

  /**
   * 跳过出牌（回复2体力）
   */
  skipTurn(): void {
    if (this.state.cardsUsedThisTurn < this.state.maxCardsPerTurn) {
      this.state.stamina = Math.min(this.state.maxStamina, this.state.stamina + 2);
      console.log(`[跳过] 体力 +2 → ${this.state.stamina}`);
    }
    this.endTurn();
  }

  /**
   * 结束回合
   */
  endTurn(): void {
    console.log(`\n--- 回合 ${this.state.turn} 结束 ---`);

    // 回合结束时处理Buff（好印象结算等）
    const endTurnScore = BuffManager.onTurnEnd(this.state);
    if (endTurnScore > 0) {
      this.state.score += endTurnScore;
      console.log(`[回合结算] 得分 +${endTurnScore} → ${this.state.score}`);
    }

    // 弃掉剩余手牌
    while (this.state.hand.length > 0) {
      const card = this.state.hand.pop()!;
      this.state.discardPile.push(card);
    }

    this.emit('turnEnd', { turn: this.state.turn, score: this.state.score });

    // 检查战斗结束
    const result = this.checkBattleEnd();
    if (result !== 'continue') {
      this.endBattle(result);
    } else {
      // 下一回合
      this.startTurn();
    }
  }

  /**
   * 检查战斗是否结束
   */
  checkBattleEnd(): BattleResult {
    // 回合用尽
    if (this.state.turn >= this.state.maxTurns) {
      if (this.state.score >= this.state.perfectScore) {
        return 'perfect';
      } else if (this.state.score >= this.state.targetScore) {
        return 'clear';
      } else {
        return 'fail';
      }
    }

    // 提前达成Perfect
    if (this.state.score >= this.state.perfectScore) {
      return 'perfect';
    }

    return 'continue';
  }

  /**
   * 结束战斗
   */
  private endBattle(result: BattleResult): void {
    console.log(`\n=== 战斗结束: ${result.toUpperCase()} ===`);
    console.log(`最终得分: ${this.state.score}/${this.state.targetScore} (Perfect: ${this.state.perfectScore})`);

    this.emit('battleEnd', { result, score: this.state.score });
  }

  // ==================== 卡牌操作 ====================

  /**
   * 消耗卡牌Cost
   */
  private consumeCardCost(card: SkillCard): boolean {
    const cost = Math.abs(card.cost);

    if (cost === 0) return true;

    // 计算体力消耗减少
    const staminaReduction = BuffManager.getStacks(this.state, 'STAMINA_REDUCTION');

    if (card.costType === 'stamina_only') {
      // ⚠️ 红色图标：只能消耗体力
      const actualCost = Math.max(0, cost - staminaReduction);
      if (this.state.stamina < actualCost) {
        return false;
      }
      this.state.stamina -= actualCost;
      console.log(`[消耗] 体力 -${actualCost} → ${this.state.stamina}`);
    } else {
      // 绿色图标：元气优先
      if (this.state.genki >= cost) {
        this.state.genki -= cost;
        console.log(`[消耗] 元气 -${cost} → ${this.state.genki}`);
      } else {
        // 元气不足，用体力补
        const remaining = cost - this.state.genki;
        const actualStaminaCost = Math.max(0, remaining - staminaReduction);

        if (this.state.stamina < actualStaminaCost) {
          return false;
        }

        console.log(`[消耗] 元气 -${this.state.genki} → 0`);
        this.state.genki = 0;
        this.state.stamina -= actualStaminaCost;
        console.log(`[消耗] 体力 -${actualStaminaCost} → ${this.state.stamina}`);
      }
    }

    return true;
  }

  /**
   * 抽牌
   */
  private drawCards(count: number): void {
    const maxHandSize = 5;
    const canDraw = Math.min(count, maxHandSize - this.state.hand.length);

    for (let i = 0; i < canDraw; i++) {
      // 牌堆空时洗牌
      if (this.state.deck.length === 0) {
        if (this.state.discardPile.length === 0) {
          break; // 没有牌可抽
        }
        this.state.deck = [...this.state.discardPile];
        this.state.discardPile = [];
        this.shuffleDeck();
        console.log('[洗牌] 弃牌堆重组为牌堆');
      }

      const card = this.state.deck.pop()!;
      this.state.hand.push(card);
    }

    console.log(`[抽牌] +${canDraw}张 (手牌: ${this.state.hand.length}张)`);
    this.emit('cardsDrawn', { count: canDraw, hand: this.state.hand });
  }

  /**
   * 洗牌
   */
  private shuffleDeck(): void {
    for (let i = this.state.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.state.deck[i], this.state.deck[j]] = [this.state.deck[j], this.state.deck[i]];
    }
  }

  // ==================== 事件系统 ====================

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      for (const callback of listeners) {
        callback(data);
      }
    }
  }
}
