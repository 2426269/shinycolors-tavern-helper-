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
};

// ==================== StateManager 类 ====================

export class StateManager {
  private buffs: Map<string, BuffInstance> = new Map();
  private tags: Map<string, TagInstance> = new Map();
  private stateSwitchCount: number = 0;
  private buffMultipliers: Map<string, number> = new Map();

  // ==================== Buff 操作 ====================

  /**
   * 添加或叠加 Buff
   */
  public addBuff(
    buffId: StandardBuffId | string,
    stacks: number = 1,
    duration: number = -1,
    visualHint?: VisualHint,
    source?: string,
  ): void {
    const existing = this.buffs.get(buffId);

    if (existing) {
      // 叠加层数
      existing.stacks += stacks;
      // 刷新持续时间（取较大值）
      if (duration > existing.duration) {
        existing.duration = duration;
      }
      console.log(`✨ [StateManager] Buff叠加: ${buffId} → ${existing.stacks}层`);
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
      };
      this.buffs.set(buffId, newBuff);
      console.log(`✨ [StateManager] 新增Buff: ${buffId} (${stacks}层, ${duration}回合)`);
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
   * 设置 Buff 倍率
   */
  public setBuffMultiplier(buffId: string, multiplier: number): void {
    this.buffMultipliers.set(buffId, multiplier);
    const buff = this.buffs.get(buffId);
    if (buff) {
      buff.multiplier = multiplier;
    }
    console.log(`📊 [StateManager] 设置Buff倍率: ${buffId} → ${multiplier}x`);
  }

  /**
   * 获取 Buff 倍率
   */
  public getBuffMultiplier(buffId: string): number {
    return this.buffMultipliers.get(buffId) ?? 1.0;
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
    this.stateSwitchCount++;
    console.log(`🔄 [StateManager] 状态切换: ${fromState ?? 'null'} → ${toState} (总计: ${this.stateSwitchCount}次)`);
  }

  /**
   * 获取状态切换次数
   */
  public getStateSwitchCount(): number {
    return this.stateSwitchCount;
  }

  // ==================== 回合结束处理 ====================

  /**
   * 回合结束时更新持续时间
   */
  public onTurnEnd(): void {
    // 更新 Buff 持续时间
    for (const [id, buff] of this.buffs) {
      if (buff.duration > 0) {
        buff.duration--;
        if (buff.duration === 0) {
          this.buffs.delete(id);
          console.log(`⏰ [StateManager] Buff过期: ${id}`);
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
    this.buffMultipliers.clear();
    this.stateSwitchCount = 0;
    console.log('🔄 [StateManager] 状态已重置');
  }

  // ==================== 序列化 ====================

  /**
   * 导出为记录格式（用于 JSON Logic）
   */
  public toBuffRecord(): Record<string, number> {
    const record: Record<string, number> = {};
    for (const [id, buff] of this.buffs) {
      record[id] = buff.stacks;
    }
    return record;
  }
}

// 导出单例
export const stateManager = new StateManager();
