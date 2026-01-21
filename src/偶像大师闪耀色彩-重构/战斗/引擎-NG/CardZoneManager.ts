/**
 * CardZoneManager - 卡牌区域管理器
 * 管理抽牌堆、手牌、弃牌堆、保留区、除外区
 */

import type { HookManager } from './HookManager';
import type { CardZone, SkillCardV2 } from './types';
import { HookType } from './types';

// ==================== CardZoneManager 类 ====================

export class CardZoneManager {
  private deck: SkillCardV2[] = []; // 抽牌堆
  private hand: SkillCardV2[] = []; // 手牌（最多5张）
  private discard: SkillCardV2[] = []; // 弃牌堆
  private reserve: SkillCardV2[] = []; // 保留区（传说卡专用）
  private removed: SkillCardV2[] = []; // 除外区

  private readonly maxHandSize: number = 5;
  private usageCount: Map<string, number> = new Map(); // 使用次数追踪

  // P1-5: RNG 注入
  private rng: () => number = Math.random;

  // T8: HookManager 注入
  private hookManager: HookManager | null = null;

  /**
   * T8: 设置 HookManager 引用
   */
  public setHookManager(hm: HookManager): void {
    this.hookManager = hm;
  }

  /**
   * T8: 触发区域移动 Hook
   */
  private triggerZoneEnter(card: SkillCardV2, fromZone: CardZone | 'none', toZone: CardZone): void {
    if (!this.hookManager) return;
    this.hookManager.trigger(
      HookType.ON_CARD_ENTER_ZONE as any,
      {
        card_id: card.id,
        from_zone: fromZone,
        to_zone: toZone,
      } as any,
    );
    // 进入 removed 区时清理固有能力
    if (toZone === 'removed') {
      this.hookManager.unregisterCardHooks(card.id);
    }
  }

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

    // T8: 为所有卡牌注册固有能力
    if (this.hookManager) {
      for (const card of cards) {
        this.hookManager.registerIntrinsicHooks(card);
      }
    }

    console.log(`🃏 [CardZoneManager] 初始化牌组: ${cards.length}张`);
  }

  /**
   * 洗牌（Fisher-Yates 算法）
   * P1-5: 使用注入的 RNG
   */
  public shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
    console.log('🔀 [CardZoneManager] 已洗牌');
  }

  /**
   * P1-5: 设置 RNG 函数（用于回放一致性）
   */
  public setRng(rngFn: () => number): void {
    this.rng = rngFn;
  }

  /**
   * 6-5: 获取随机数 (供 ActionExecutor 使用)
   */
  public getRng(): number {
    return this.rng();
  }

  // ==================== 抽牌 ====================

  /**
   * 抽取指定数量的牌到手牌
   * @returns 实际抽取的牌
   */
  public draw(count: number): SkillCardV2[] {
    const drawn: SkillCardV2[] = [];

    for (let i = 0; i < count; i++) {
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
        // P1-5: 手牌已满 -> 溢出进弃牌堆
        if (this.hand.length >= this.maxHandSize) {
          this.discard.push(card);
          this.triggerZoneEnter(card, 'deck', 'discard'); // T8
          console.log(`⚠️ [CardZoneManager] 手牌已满，${card.display?.name || card.id} 直接进入弃牌堆`);
        } else {
          this.hand.push(card);
          this.triggerZoneEnter(card, 'deck', 'hand'); // T8
        }
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
   * T-13: 在手牌中查找卡牌（只读，不移除）
   * @param cardId 可以是原始ID或实例ID
   */
  public findInHand(cardId: string): SkillCardV2 | null {
    return this.hand.find(c => c.originalId === cardId || c.id === cardId) || null;
  }

  /**
   * T-13: 在保留区中查找卡牌（只读，不移除）
   */
  public findInReserve(cardId: string): SkillCardV2 | null {
    return this.reserve.find(c => c.originalId === cardId || c.id === cardId) || null;
  }

  /**
   * 从手牌打出一张牌
   * @param cardId 可以是原始ID或实例ID
   */
  public playFromHand(cardId: string): SkillCardV2 | null {
    // 优先匹配 originalId (原始卡牌ID)，然后匹配实例 id
    const index = this.hand.findIndex(c => c.originalId === cardId || c.id === cardId);
    if (index === -1) {
      console.error(`❌ [CardZoneManager] 手牌中找不到卡牌: ${cardId}`);
      return null;
    }

    const [card] = this.hand.splice(index, 1);
    // T-13: 移除副作用，由 ActionExecutor 决定去向
    // this.discard.push(card);
    console.log(`🎴 [CardZoneManager] 从手牌取出: ${card.display.name}`);
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
    // T-13: 移除副作用，由 ActionExecutor 决定去向
    // this.discard.push(card);
    console.log(`🎴 [CardZoneManager] 从保留区取出: ${card.display.name}`);
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
    this.triggerZoneEnter(card, fromZone, toZone); // T8
    console.log(`📦 [CardZoneManager] 移动: ${card.display.name} (${fromZone} → ${toZone})`);
    return true;
  }

  /**
   * 随机选择满足条件的卡
   * P1-5: 使用注入的 RNG
   */
  public selectRandom(zone: CardZone, count: number, filter?: (card: SkillCardV2) => boolean): SkillCardV2[] {
    const sourceZone = this.getZone(zone);
    if (!sourceZone) return [];

    const candidates = filter ? sourceZone.filter(filter) : [...sourceZone];

    // 洗牌以随机选择 (使用注入的 RNG)
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
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

  /**
   * T7: 按名称获取区域（公开包装器）
   */
  public getZoneByName(zone: CardZone): SkillCardV2[] | null {
    return this.getZone(zone);
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

  // ==================== 消耗与使用限制 ====================

  /**
   * 消耗卡牌（从弃牌堆移至除外区）
   */
  public exhaust(cardId: string): SkillCardV2 | null {
    const idx = this.discard.findIndex(c => c.id === cardId || c.originalId === cardId);
    if (idx >= 0) {
      const [card] = this.discard.splice(idx, 1);
      this.removed.push(card);
      this.triggerZoneEnter(card, 'discard', 'removed'); // T8: 进入removed区会自动清理固有能力
      console.log(`☠️ [CardZoneManager] 卡牌消耗: ${card.display.name}`);
      return card;
    }
    console.warn(`⚠️ [CardZoneManager] 找不到要消耗的卡牌: ${cardId}`);
    return null;
  }

  /**
   * T-1: 获取卡牌使用计数键
   */
  public getUsageKey(card: SkillCardV2): string {
    return (card as any).originalId ?? card.id;
  }

  /**
   * 记录卡牌使用次数
   * T-1: 必须传入 card 对象，使用 getUsageKey
   */
  public recordUsage(card: SkillCardV2): number {
    const key = this.getUsageKey(card);
    const count = (this.usageCount.get(key) || 0) + 1;
    this.usageCount.set(key, count);
    return count;
  }

  /**
   * 检查卡牌是否可以使用（基于 uses_per_battle 限制）
   * T-1: 使用 getUsageKey
   */
  public canUseCard(card: SkillCardV2): boolean {
    const limit = card.restrictions?.uses_per_battle;
    if (!limit) return true;
    const usageKey = this.getUsageKey(card);
    return (this.usageCount.get(usageKey) || 0) < limit;
  }

  /**
   * 获取卡牌使用次数
   * T-5: 支持传入 card 对象或 cardId，兼容 originalId 查询
   */
  public getUsageCount(cardOrId: SkillCardV2 | string): number {
    if (typeof cardOrId === 'string') {
      // 直接查询 cardId（可能是 originalId 或实例 id）
      const directResult = this.usageCount.get(cardOrId);
      if (directResult !== undefined) return directResult;
      // 如果查不到，返回 0（可能是从未使用过）
      return 0;
    }
    // 传入 card 对象时，使用 getUsageKey 获取正确的键
    const key = this.getUsageKey(cardOrId);
    return this.usageCount.get(key) || 0;
  }

  // ==================== 重置 ====================

  public reset(): void {
    this.deck = [];
    this.hand = [];
    this.discard = [];
    this.reserve = [];
    this.removed = [];
    this.usageCount.clear();
    console.log('🔄 [CardZoneManager] 已重置');
  }
}

// 导出单例
export const cardZoneManager = new CardZoneManager();
