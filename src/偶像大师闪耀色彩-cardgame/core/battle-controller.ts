/**
 * 战斗流程控制器
 *
 * 负责管理整个战斗的流程，包括回合管理、卡牌抽取、得分计算等
 */

import type { BattleConfig, BattleResult, BattleState, SkillCard } from '../types';
import { EventBus, GameEvents } from '../utils/event-bus';
import { AttributeManager } from './attribute-manager';
import { BuffManager } from './buff-manager';
import { ResourceManager } from './resource-manager';
import { SkillCardExecutor } from './skill-card-executor';

export class BattleController {
  private state: BattleState;
  private attributeManager: AttributeManager;
  private executor: SkillCardExecutor;

  constructor(config: BattleConfig) {
    this.state = this.initializeBattleState(config);
    this.attributeManager = new AttributeManager(this.state);
    this.executor = new SkillCardExecutor(this.state);
  }

  /**
   * 初始化战斗状态
   */
  private initializeBattleState(config: BattleConfig): BattleState {
    const state: BattleState = {
      id: `battle_${Date.now()}`,
      mode: config.mode,
      planType: config.planType,
      currentTurn: 1,
      maxTurns: config.maxTurns || 12,
      startTime: Date.now(),
      stamina: config.initialStamina || 60,
      maxStamina: config.maxStamina || 60,
      genki: 0,
      attributes: {
        concentration: 0,
        motivation: 0,
        goodImpression: 0,
        allPower: 0,
        heat: 0,
        anomalyState: null,
        stateLevel: 1,
        pointerLocked: false,
        energy: 0,
      },
      stats: { ...config.stats },
      score: {
        current: 0,
        target: config.targetScore || 1000,
        perfectTarget: config.perfectScore || 2000,
      },
      buffs: new Map(),
      deck: [...config.skillDeck],
      hand: [],
      discardPile: [],
      removedPile: [],
      turnState: {
        cardsUsed: 0,
        maxCardsPerTurn: 1,
        drawnThisTurn: 0,
        attribute: null,
        skippedActions: 0,
      },
      support: config.support || null,
      history: [],
      metadata: {},
    };

    // 洗牌
    this.shuffleDeck(state.deck);

    // 抽初始手牌（3张）
    for (let i = 0; i < 3; i++) {
      this.drawCard(state);
    }

    return state;
  }

  /**
   * 开始战斗
   */
  start(): void {
    EventBus.emit(GameEvents.BATTLE_STARTED, {
      battleId: this.state.id,
      mode: this.state.mode,
      planType: this.state.planType,
    });

    this.addHistoryEntry('战斗开始', '', 0, 0, 0);
  }

  /**
   * 开始回合
   */
  async startTurn(): Promise<void> {
    // 1. 回合数+1
    if (this.state.currentTurn > 1) {
      this.state.currentTurn++;
    }

    // 2. 重置回合状态
    this.state.turnState = {
      cardsUsed: 0,
      maxCardsPerTurn: 1,
      drawnThisTurn: 0,
      attribute: this.state.mode === 'exam' ? this.determineExamAttribute() : null,
      skippedActions: 0,
    };

    // 3. 触发回合开始Buff效果
    BuffManager.updateBuffsOnTurnStart(this.state);

    // 4. 抽牌（每回合抽2张）
    for (let i = 0; i < 2; i++) {
      this.drawCard(this.state);
    }

    // 5. 触发回合开始事件
    EventBus.emit(GameEvents.TURN_STARTED, {
      turn: this.state.currentTurn,
      maxTurns: this.state.maxTurns,
      attribute: this.state.turnState.attribute,
    });

    this.addHistoryEntry(
      `第${this.state.currentTurn}回合开始`,
      this.state.turnState.attribute ? `本回合属性：${this.state.turnState.attribute}` : '',
      0,
      0,
      0,
    );
  }

  /**
   * 使用技能卡
   */
  async useCard(cardIndex: number): Promise<boolean> {
    // 检查卡牌索引
    if (cardIndex < 0 || cardIndex >= this.state.hand.length) {
      console.error('[BattleController] Invalid card index');
      return false;
    }

    const card = this.state.hand[cardIndex];

    // 执行卡牌效果
    const result = await this.executor.executeCard(card);

    if (result.success) {
      // 从手牌移除
      this.state.hand.splice(cardIndex, 1);

      // 移入弃牌堆
      this.state.discardPile.push(card);

      // 增加使用次数
      this.state.turnState.cardsUsed++;

      // 记录历史
      this.addHistoryEntry(
        `使用卡牌：${card.name}`,
        `${card.description}`,
        result.changes?.score || 0,
        result.changes?.stamina || 0,
        result.changes?.genki || 0,
      );

      return true;
    } else {
      console.error('[BattleController] Card execution failed:', result.message);
      return false;
    }
  }

  /**
   * 跳过行动
   */
  async skipAction(): Promise<void> {
    this.state.turnState.skippedActions++;

    // 跳过行动时获得5元气
    ResourceManager.gainGenki(this.state, 5);

    this.addHistoryEntry('跳过行动', '获得5元气', 0, 0, 5);

    // 连续跳过3次则强制结束战斗
    if (this.state.turnState.skippedActions >= 3) {
      await this.endBattle();
    }
  }

  /**
   * 结束回合
   */
  async endTurn(): Promise<void> {
    // 1. 触发回合结束Buff效果（如好印象）
    BuffManager.updateBuffsOnTurnEnd(this.state);

    // 2. 弃置所有手牌
    while (this.state.hand.length > 0) {
      const card = this.state.hand.shift()!;
      this.state.discardPile.push(card);
      EventBus.emit(GameEvents.CARD_DISCARDED, { card });
    }

    // 3. 触发回合结束事件
    EventBus.emit(GameEvents.TURN_ENDED, {
      turn: this.state.currentTurn,
      score: this.state.score.current,
      stamina: this.state.stamina,
      genki: this.state.genki,
    });

    this.addHistoryEntry(`第${this.state.currentTurn}回合结束`, `当前得分：${this.state.score.current}`, 0, 0, 0);

    // 4. 检查是否结束战斗
    if (this.shouldEndBattle()) {
      await this.endBattle();
    }
  }

  /**
   * 结束战斗
   */
  async endBattle(): Promise<BattleResult> {
    const endTime = Date.now();
    const duration = Math.floor((endTime - this.state.startTime) / 1000);

    // 计算评价
    const evaluation = this.calculateEvaluation();

    // 计算排名（比赛模式）
    let rank: number | undefined;
    let rivalScores: number[] | undefined;
    if (this.state.mode === 'exam') {
      // TODO: 实现排名计算逻辑
      rank = 1;
      rivalScores = [];
    }

    // 计算奖励
    const rewards = this.calculateRewards(evaluation);

    // 创建结果
    const result: BattleResult = {
      mode: this.state.mode,
      evaluation,
      finalScore: this.state.score.current,
      targetScore: this.state.score.target,
      perfectScore: this.state.score.perfectTarget,
      turns: this.state.currentTurn,
      remainingStamina: this.state.stamina,
      cardsUsed: this.state.history.filter(h => h.action.includes('使用卡牌')).length,
      buffsGained: this.state.history.filter(h => h.action.includes('获得Buff')).length,
      rank,
      rivalScores,
      stats: {
        totalCardsUsed: this.state.history.filter(h => h.action.includes('使用卡牌')).length,
        totalStaminaConsumed: -this.state.history.reduce((sum, h) => sum + h.staminaChange, 0),
        totalGenkiGained: this.state.history.reduce((sum, h) => sum + h.genkiChange, 0),
        totalBuffsGained: 0,
        maxScore: Math.max(...this.state.history.map(h => h.scoreChange)),
        averageScore: this.state.score.current / this.state.currentTurn,
        perfectTurns: 0,
      },
      rewards,
      startTime: this.state.startTime,
      endTime,
      duration,
    };

    // 触发战斗结束事件
    EventBus.emit(GameEvents.BATTLE_ENDED, {
      result,
    });

    this.addHistoryEntry('战斗结束', `最终得分：${this.state.score.current}`, 0, 0, 0);

    return result;
  }

  // ========== 辅助方法 ==========

  /**
   * 抽牌
   */
  private drawCard(state: BattleState): void {
    if (state.hand.length >= 5) return; // 手牌上限5张

    // 如果牌堆为空，将弃牌堆洗入牌堆
    if (state.deck.length === 0 && state.discardPile.length > 0) {
      state.deck = [...state.discardPile];
      state.discardPile = [];
      this.shuffleDeck(state.deck);
    }

    if (state.deck.length === 0) return; // 真的没牌了

    const card = state.deck.shift()!;
    state.hand.push(card);
    state.turnState.drawnThisTurn++;

    EventBus.emit(GameEvents.CARD_DRAWN, { card });
  }

  /**
   * 洗牌（Fisher-Yates算法）
   */
  private shuffleDeck(deck: SkillCard[]): void {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  /**
   * 确定考试回合属性（比赛模式）
   */
  private determineExamAttribute(): 'vocal' | 'dance' | 'visual' {
    // 简单实现：随机或按照既定顺序
    const attributes: ('vocal' | 'dance' | 'visual')[] = ['vocal', 'dance', 'visual'];
    const index = (this.state.currentTurn - 1) % 3;
    return attributes[index];
  }

  /**
   * 检查是否应该结束战斗
   */
  private shouldEndBattle(): boolean {
    // 回合数达到上限
    if (this.state.currentTurn >= this.state.maxTurns) {
      return true;
    }

    // 体力耗尽
    if (this.state.stamina <= 0) {
      return true;
    }

    return false;
  }

  /**
   * 计算评价
   */
  private calculateEvaluation(): 'perfect' | 'clear' | 'fail' {
    if (this.state.score.current >= this.state.score.perfectTarget) {
      return 'perfect';
    } else if (this.state.score.current >= this.state.score.target) {
      return 'clear';
    } else {
      return 'fail';
    }
  }

  /**
   * 计算奖励
   */
  private calculateRewards(evaluation: 'perfect' | 'clear' | 'fail'): any {
    const multiplier = evaluation === 'perfect' ? 2 : evaluation === 'clear' ? 1 : 0.5;

    return {
      pPoints: Math.floor(this.state.score.current * 0.1 * multiplier),
      pDrinks: [],
      pItems: [],
      skillCards: [],
      statGain: {
        vocal: Math.floor(Math.random() * 10 * multiplier),
        dance: Math.floor(Math.random() * 10 * multiplier),
        visual: Math.floor(Math.random() * 10 * multiplier),
      },
      love: Math.floor(5 * multiplier),
    };
  }

  /**
   * 添加历史记录
   */
  private addHistoryEntry(
    action: string,
    description: string,
    scoreChange: number,
    staminaChange: number,
    genkiChange: number,
  ): void {
    this.state.history.push({
      turn: this.state.currentTurn,
      action,
      description,
      scoreChange,
      staminaChange,
      genkiChange,
      timestamp: Date.now(),
    });
  }

  // ========== Getters ==========

  /**
   * 获取当前战斗状态
   */
  getState(): BattleState {
    return this.state;
  }

  /**
   * 获取当前回合数
   */
  getCurrentTurn(): number {
    return this.state.currentTurn;
  }

  /**
   * 获取手牌
   */
  getHand(): SkillCard[] {
    return this.state.hand;
  }

  /**
   * 获取当前得分
   */
  getScore(): number {
    return this.state.score.current;
  }

  /**
   * 获取历史记录
   */
  getHistory(): typeof this.state.history {
    return this.state.history;
  }
}
