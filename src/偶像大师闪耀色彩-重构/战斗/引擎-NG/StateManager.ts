/**
 * StateManager - 战斗状态管理器
 * 管理 Buffs、Tags、状态切换计数
 */

import type { StandardBuffId, VisualHint } from './types';

// ==================== Buff 数据结构 ====================

export interface BuffInstance {
  id: StandardBuffId | string;
  name: string;
  stacks: number; // 层数
  duration: number; // 剩余回合（-1 表示永久）
  category: 'positive' | 'negative';
  visual_hint?: VisualHint; // AI 创造的 Buff 需要
  multiplier?: number; // Buff 增益倍率（默认 1.0）
  source?: string; // 来源（卡牌 ID 或机制 ID）
  addedThisTurn?: boolean; // 本回合添加，跳过首次扣减
  decay_per_turn?: number; // 每回合层数衰减
}

// ==================== Tag 数据结构 ====================

export interface TagInstance {
  name: string; // 完整名称（含命名空间）
  duration: number; // 剩余回合（-1 表示永久）
  visual_hint?: VisualHint;
  source?: string;
}

// ==================== 标准 Buff 配置 ====================

const STANDARD_BUFF_CONFIG: Record<
  StandardBuffId,
  {
    name: string;
    category: 'positive' | 'negative';
  }
> = {
  GoodCondition: { name: '好调', category: 'positive' },
  ExcellentCondition: { name: '绝好调', category: 'positive' },
  Concentration: { name: '集中', category: 'positive' },
  Motivation: { name: '干劲', category: 'positive' },
  GoodImpression: { name: '好印象', category: 'positive' },
  StaminaReduction: { name: '体力消耗减少', category: 'positive' },
  AlloutState: { name: '全力状态', category: 'positive' },
  ConserveState: { name: '温存状态', category: 'positive' },
  ResoluteState: { name: '强气状态', category: 'positive' },
  // ===== 子任务1新增 =====
  AllPower: { name: '全力值', category: 'positive' },
  Heat: { name: '热意', category: 'positive' },
  StaminaCut: { name: '体力消耗削减', category: 'positive' },
  StaminaIncrease: { name: '体力消耗增加', category: 'negative' },
  StaminaExtra: { name: '体力消耗追加', category: 'negative' },
  ScoreFinalMultiplier: { name: '最终得分倍率', category: 'positive' },
  // ===== 新增: 通用得分加成 =====
  ScoreBonus: { name: '得分增加', category: 'positive' },
  GoodImpressionBonus: { name: '好印象效果增加', category: 'positive' },
};

// ==================== StateManager 类 ====================

export class StateManager {
  private buffs: Map<string, BuffInstance> = new Map();
  private tags: Map<string, TagInstance> = new Map();
  private stateSwitchCount: Record<string, number> = {}; // EV1: per-state 计数
  private stateSwitchCountTotal: number = 0; // EV1: 总次数
  private buffGainMultipliers: Map<string, number> = new Map(); // T-B3: 获得量倍率
  private buffEffectMultipliers: Map<string, number> = new Map(); // T-B4: 效果倍率

  /**
   * 添加或叠加 Buff
   * Buff 立即生效，但从下回合结束才开始扣减 duration
   *
   * 规则:
   * 1) duration > 0 的 Buff 仅刷新 duration，不叠加 stacks
   * 2) decay_per_turn 对 duration = -1 的 Buff 仍生效
   */
  public addBuff(
    buffId: StandardBuffId | string,
    stacks: number = 1,
    duration: number = -1,
    visualHint?: VisualHint,
    source?: string,
    decayPerTurn?: number,
  ): void {
    const existing = this.buffs.get(buffId);

    if (existing) {
      // 叠加层数 (回合制Buff只刷新duration，不叠加stacks)
      if (duration > 0) {
        // 回合制: 累加持续时间（T-B1修复：从 max() 改为 +=）
        existing.duration += duration;
        existing.addedThisTurn = true; // 刷新时也跳过本回合扣减
      } else {
        // 层数制: 叠加层数（T-B3: 应用获得量倍率）
        const gainMultiplier = this.getBuffGainMultiplier(buffId);
        const actualStacks = Math.ceil(stacks * gainMultiplier);
        existing.stacks += actualStacks;
      }
      // 更新衰减率（如果提供）
      if (decayPerTurn !== undefined) {
        existing.decay_per_turn = decayPerTurn;
      }
      console.log(`✨ [StateManager] Buff叠加: ${buffId} → ${existing.stacks}层, ${existing.duration}回合`);
    } else {
      // 新增 Buff
      const config = STANDARD_BUFF_CONFIG[buffId as StandardBuffId];
      const newBuff: BuffInstance = {
        id: buffId,
        name: config?.name ?? buffId,
        stacks,
        duration,
        category: config?.category ?? 'positive',
        visual_hint: visualHint,
        multiplier: 1.0,
        source,
        addedThisTurn: duration > 0, // 回合制Buff标记为本回合添加
        decay_per_turn: decayPerTurn,
      };
      this.buffs.set(buffId, newBuff);
      console.log(
        `✨ [StateManager] 新增Buff: ${buffId} (${stacks}层, ${duration}回合${decayPerTurn ? `, 每回合衰减${decayPerTurn}` : ''})`,
      );
    }
  }

  /**
   * 移除 Buff
   */
  public removeBuff(buffId: string, stacks?: number): boolean {
    const existing = this.buffs.get(buffId);
    if (!existing) return false;

    if (stacks === undefined || stacks >= existing.stacks) {
      // 完全移除
      this.buffs.delete(buffId);
      console.log(`🗑️ [StateManager] 移除Buff: ${buffId}`);
    } else {
      // 减少层数
      existing.stacks -= stacks;
      console.log(`📉 [StateManager] 减少Buff: ${buffId} → ${existing.stacks}层`);
    }
    return true;
  }

  /**
   * 获取 Buff 层数
   */
  public getBuffStacks(buffId: string): number {
    return this.buffs.get(buffId)?.stacks ?? 0;
  }

  /**
   * 获取 Buff 剩余回合数
   */
  public getBuffDuration(buffId: string): number {
    return this.buffs.get(buffId)?.duration ?? 0;
  }

  /**
   * 检查是否有 Buff
   */
  public hasBuff(buffId: string): boolean {
    return this.buffs.has(buffId);
  }

  /**
   * 获取所有 Buff
   */
  public getAllBuffs(): BuffInstance[] {
    return Array.from(this.buffs.values());
  }

  /**
   * T-B3: 设置 Buff 获得量倍率
   */
  public setBuffGainMultiplier(buffId: string, multiplier: number): void {
    this.buffGainMultipliers.set(buffId, multiplier);
    const buff = this.buffs.get(buffId);
    if (buff) {
      buff.multiplier = multiplier;
    }
    console.log(`📊 [StateManager] 设置获得量倍率: ${buffId} → ${multiplier}x`);
  }

  /**
   * T-B3: 获取 Buff 获得量倍率
   */
  public getBuffGainMultiplier(buffId: string): number {
    return this.buffGainMultipliers.get(buffId) ?? 1.0;
  }

  /**
   * T-B4: 设置 Buff 效果倍率（有效层数×N）
   */
  public setBuffEffectMultiplier(buffId: string, multiplier: number): void {
    this.buffEffectMultipliers.set(buffId, multiplier);
    console.log(`📊 [StateManager] 设置效果倍率: ${buffId} → ${multiplier}x`);
  }

  /**
   * T-B4: 获取 Buff 效果倍率
   */
  public getBuffEffectMultiplier(buffId: string): number {
    return this.buffEffectMultipliers.get(buffId) ?? 1.0;
  }

  /**
   * T-B2: 确保 Buff 至少保持 N 回合（使用 max 逻辑）
   */
  public ensureBuffTurns(buffId: string, turns: number): void {
    const existing = this.buffs.get(buffId);
    if (existing) {
      if (turns > existing.duration) {
        existing.duration = turns;
        console.log(`⏰ [StateManager] 确保Buff回合: ${buffId} → ${turns}回合`);
      }
    } else {
      this.addBuff(buffId, 1, turns);
    }
  }

  // ==================== Tag 操作 ====================

  /**
   * 添加 Tag
   */
  public addTag(tag: string, duration: number = -1, visualHint?: VisualHint, source?: string): void {
    // 自动添加命名空间前缀
    const fullTag = this.normalizeTagName(tag);

    const existing = this.tags.get(fullTag);
    if (existing) {
      // 刷新持续时间
      if (duration > existing.duration) {
        existing.duration = duration;
      }
    } else {
      this.tags.set(fullTag, {
        name: fullTag,
        duration,
        visual_hint: visualHint,
        source,
      });
      console.log(`🏷️ [StateManager] 新增Tag: ${fullTag}`);
    }
  }

  /**
   * 移除 Tag
   */
  public removeTag(tag: string): boolean {
    const fullTag = this.normalizeTagName(tag);
    if (this.tags.has(fullTag)) {
      this.tags.delete(fullTag);
      console.log(`🗑️ [StateManager] 移除Tag: ${fullTag}`);
      return true;
    }
    return false;
  }

  /**
   * 检查是否有 Tag
   */
  public hasTag(tag: string): boolean {
    const fullTag = this.normalizeTagName(tag);
    return this.tags.has(fullTag);
  }

  /**
   * 获取所有 Tag 名称
   */
  public getAllTags(): string[] {
    return Array.from(this.tags.keys());
  }

  /**
   * 获取所有 Tag 实例
   */
  public getAllTagInstances(): TagInstance[] {
    return Array.from(this.tags.values());
  }

  /**
   * 标准化 Tag 名称（添加命名空间前缀）
   */
  private normalizeTagName(tag: string): string {
    // 如果已有命名空间，直接返回
    if (tag.includes(':')) {
      return tag;
    }
    // 否则添加 ai: 前缀（AI 创造的机制）
    return `ai:${tag}`;
  }

  // ==================== 状态切换计数 ====================

  /**
   * 记录状态切换
   */
  public recordStateSwitch(fromState: string | null, toState: string): void {
    // EV1: 更新 per-state 计数
    this.stateSwitchCount[toState] = (this.stateSwitchCount[toState] ?? 0) + 1;
    this.stateSwitchCountTotal++;
    console.log(
      `🔄 [StateManager] 状态切换: ${fromState ?? 'null'} → ${toState} (${toState}=${this.stateSwitchCount[toState]}, 总计=${this.stateSwitchCountTotal})`,
    );
  }

  /**
   * 获取状态切换次数 (per-state 计数)
   */
  public getStateSwitchCount(): Record<string, number> {
    return { ...this.stateSwitchCount };
  }

  /**
   * 获取状态切换总次数
   */
  public getStateSwitchCountTotal(): number {
    return this.stateSwitchCountTotal;
  }

  // ==================== 回合结束处理 ====================

  /**
   * 回合结束时更新持续时间
   * 本回合添加的 Buff 不扣减，从下回合结束开始扣
   */
  public onTurnEnd(): void {
    // 更新 Buff 持续时间
    for (const [id, buff] of this.buffs) {
      // 本回合添加的 Buff 跳过扣减
      if (buff.addedThisTurn) {
        buff.addedThisTurn = false;
        continue;
      }
      if (buff.duration > 0) {
        buff.duration--;
        if (buff.duration === 0) {
          this.buffs.delete(id);
          console.log(`⏰ [StateManager] Buff过期: ${id}`);
        }
      }
      // 层数衰减 (decay_per_turn)
      if (buff.decay_per_turn && buff.stacks > 0) {
        buff.stacks -= buff.decay_per_turn;
        if (buff.stacks <= 0) {
          this.buffs.delete(id);
          console.log(`⬇️ [StateManager] Buff层数衰减归零: ${id}`);
        } else {
          console.log(`⬇️ [StateManager] Buff衰减: ${id} 剩余${buff.stacks}层`);
        }
      }
    }

    // 更新 Tag 持续时间
    for (const [name, tag] of this.tags) {
      if (tag.duration > 0) {
        tag.duration--;
        if (tag.duration === 0) {
          this.tags.delete(name);
          console.log(`⏰ [StateManager] Tag过期: ${name}`);
        }
      }
    }
  }

  // ==================== 重置 ====================

  /**
   * 重置所有状态
   */
  public reset(): void {
    this.buffs.clear();
    this.tags.clear();
    this.buffGainMultipliers.clear(); // T-B3: 重命名
    this.buffEffectMultipliers.clear(); // T-B4: 效果倍率
    this.stateSwitchCount = {}; // EV1: per-state 计数
    this.stateSwitchCountTotal = 0; // EV1: 总次数
    console.log('🔄 [StateManager] 状态已重置');
  }

  // ==================== 序列化 ====================

  /**
   * T-10: 导出原始层数记录（不应用效果倍率）
   * 用于条件判断 (when)，判断物理层数
   */
  public toBuffRawRecord(): Record<string, number> {
    const record: Record<string, number> = {};
    for (const [id, buff] of this.buffs) {
      record[id] = buff.stacks; // 原始层数
    }
    return record;
  }

  /**
   * T-10: 导出有效层数记录（应用效果倍率）
   * 用于得分计算，层数 × effectMultiplier
   */
  public toBuffEffectiveRecord(): Record<string, number> {
    const record: Record<string, number> = {};
    for (const [id, buff] of this.buffs) {
      const effectMultiplier = this.getBuffEffectMultiplier(id);
      record[id] = buff.stacks * effectMultiplier;
    }
    return record;
  }

  /**
   * 导出为记录格式（用于 JSON Logic）
   * @deprecated 使用 toBuffRawRecord 或 toBuffEffectiveRecord
   * T-B4: 默认返回有效层数（向后兼容）
   */
  public toBuffRecord(): Record<string, number> {
    // T-10: 保持向后兼容，默认返回有效层数
    return this.toBuffEffectiveRecord();
  }
}

// 导出单例
export const stateManager = new StateManager();
