/**
 * CardZoneManager - 卡牌区域管理器
 * 管理抽牌堆、手牌、弃牌堆、保留区、除外区
 */

import type { CardZone, SkillCardV2 } from './types';

// ==================== CardZoneManager 类 ====================

export class CardZoneManager {
  private deck: SkillCardV2[] = []; // 抽牌堆
  private hand: SkillCardV2[] = []; // 手牌（最多5张）
  private discard: SkillCardV2[] = []; // 弃牌堆
  private reserve: SkillCardV2[] = []; // 保留区（传说卡专用）
  private removed: SkillCardV2[] = []; // 除外区

  private readonly maxHandSize: number = 5;

  // ==================== 初始化 ====================

  /**
   * 初始化牌组
   */
  public initialize(cards: SkillCardV2[]): void {
    this.deck = [...cards];
    this.hand = [];
    this.discard = [];
    this.reserve = [];
    this.removed = [];
    console.log(`🃏 [CardZoneManager] 初始化牌组: ${cards.length}张`);
  }

  /**
   * 洗牌（Fisher-Yates 算法）
   */
  public shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
    console.log('🔀 [CardZoneManager] 已洗牌');
  }

  // ==================== 抽牌 ====================

  /**
   * 抽取指定数量的牌到手牌
   * @returns 实际抽取的牌
   */
  public draw(count: number): SkillCardV2[] {
    const drawn: SkillCardV2[] = [];

    for (let i = 0; i < count; i++) {
      // 手牌已满
      if (this.hand.length >= this.maxHandSize) {
        console.log('⚠️ [CardZoneManager] 手牌已满，停止抽牌');
        break;
      }

      // 抽牌堆空，将弃牌堆洗入
      if (this.deck.length === 0) {
        if (this.discard.length === 0) {
          console.log('⚠️ [CardZoneManager] 牌堆与弃牌堆均为空');
          break;
        }
        this.reshuffleDiscard();
      }

      // 抽一张牌
      const card = this.deck.shift();
      if (card) {
        this.hand.push(card);
        drawn.push(card);
      }
    }

    console.log(`📤 [CardZoneManager] 抽取${drawn.length}张牌`);
    return drawn;
  }

  /**
   * 将弃牌堆洗入抽牌堆
   */
  private reshuffleDiscard(): void {
    console.log('🔄 [CardZoneManager] 弃牌堆洗入抽牌堆');
    this.deck = [...this.discard];
    this.discard = [];
    this.shuffle();
  }

  // ==================== 卡牌移动 ====================

  /**
   * 从手牌打出一张牌
   */
  public playFromHand(cardId: string): SkillCardV2 | null {
    const index = this.hand.findIndex(c => c.id === cardId);
    if (index === -1) {
      console.error(`❌ [CardZoneManager] 手牌中找不到卡牌: ${cardId}`);
      return null;
    }

    const [card] = this.hand.splice(index, 1);
    // 打出后进入弃牌堆
    this.discard.push(card);
    console.log(`🎴 [CardZoneManager] 打出: ${card.display.name}`);
    return card;
  }

  /**
   * 从保留区打出一张牌
   */
  public playFromReserve(cardId: string): SkillCardV2 | null {
    const index = this.reserve.findIndex(c => c.id === cardId);
    if (index === -1) {
      console.error(`❌ [CardZoneManager] 保留区找不到卡牌: ${cardId}`);
      return null;
    }

    const [card] = this.reserve.splice(index, 1);
    this.discard.push(card);
    console.log(`🎴 [CardZoneManager] 从保留区打出: ${card.display.name}`);
    return card;
  }

  /**
   * 移动卡牌到指定区域
   */
  public moveCard(cardId: string, fromZone: CardZone, toZone: CardZone): boolean {
    const sourceZone = this.getZone(fromZone);
    const targetZone = this.getZone(toZone);

    if (!sourceZone || !targetZone) {
      console.error(`❌ [CardZoneManager] 无效区域: ${fromZone} → ${toZone}`);
      return false;
    }

    const index = sourceZone.findIndex(c => c.id === cardId);
    if (index === -1) {
      console.error(`❌ [CardZoneManager] 在${fromZone}找不到卡牌: ${cardId}`);
      return false;
    }

    const [card] = sourceZone.splice(index, 1);
    targetZone.push(card);
    console.log(`📦 [CardZoneManager] 移动: ${card.display.name} (${fromZone} → ${toZone})`);
    return true;
  }

  /**
   * 随机选择满足条件的卡
   */
  public selectRandom(zone: CardZone, count: number, filter?: (card: SkillCardV2) => boolean): SkillCardV2[] {
    const sourceZone = this.getZone(zone);
    if (!sourceZone) return [];

    let candidates = filter ? sourceZone.filter(filter) : [...sourceZone];

    // 洗牌以随机选择
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    return candidates.slice(0, count);
  }

  // ==================== 区域访问 ====================

  private getZone(zone: CardZone): SkillCardV2[] | null {
    switch (zone) {
      case 'deck':
        return this.deck;
      case 'hand':
        return this.hand;
      case 'discard':
        return this.discard;
      case 'reserve':
        return this.reserve;
      case 'removed':
        return this.removed;
      default:
        return null;
    }
  }

  public getDeck(): SkillCardV2[] {
    return this.deck;
  }
  public getHand(): SkillCardV2[] {
    return this.hand;
  }
  public getDiscard(): SkillCardV2[] {
    return this.discard;
  }
  public getReserve(): SkillCardV2[] {
    return this.reserve;
  }
  public getRemoved(): SkillCardV2[] {
    return this.removed;
  }

  // ==================== 查询 ====================

  public getDeckCount(): number {
    return this.deck.length;
  }
  public getHandCount(): number {
    return this.hand.length;
  }
  public getDiscardCount(): number {
    return this.discard.length;
  }
  public getReserveCount(): number {
    return this.reserve.length;
  }

  /**
   * 查找一张牌所在的区域
   */
  public findCardZone(cardId: string): CardZone | null {
    if (this.deck.some(c => c.id === cardId)) return 'deck';
    if (this.hand.some(c => c.id === cardId)) return 'hand';
    if (this.discard.some(c => c.id === cardId)) return 'discard';
    if (this.reserve.some(c => c.id === cardId)) return 'reserve';
    if (this.removed.some(c => c.id === cardId)) return 'removed';
    return null;
  }

  // ==================== 回合管理 ====================

  /**
   * 回合结束时丢弃手牌（可选）
   */
  public discardHand(): void {
    this.discard.push(...this.hand);
    this.hand = [];
    console.log('🗑️ [CardZoneManager] 手牌已丢弃');
  }

  // ==================== 重置 ====================

  public reset(): void {
    this.deck = [];
    this.hand = [];
    this.discard = [];
    this.reserve = [];
    this.removed = [];
    console.log('🔄 [CardZoneManager] 已重置');
  }
}

// 导出单例
export const cardZoneManager = new CardZoneManager();
