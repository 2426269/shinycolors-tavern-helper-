/**
 * Buff管理器
 *
 * 管理游戏中的所有Buff/Debuff
 */

import type { BattleState, Buff, BuffEffectContext, BuffTrigger } from '../types';
import { EventBus, GameEvents } from '../utils/event-bus';

export class BuffManager {
  /**
   * 添加Buff
   *
   * @param state 战斗状态
   * @param buff Buff数据
   */
  static addBuff(state: BattleState, buff: Buff): void {
    const existing = state.buffs.get(buff.id);

    if (existing) {
      // 已存在同类Buff
      if (this.isStackableBuff(buff.type)) {
        // 可叠加型：增加层数
        existing.stacks += buff.stacks;
      } else {
        // 刷新型：重置持续时间
        existing.duration = buff.duration;
      }

      // 触发Buff更新事件
      EventBus.emit(GameEvents.BUFF_UPDATED, {
        buff: existing,
      });
    } else {
      // 新Buff
      state.buffs.set(buff.id, buff);

      // 触发Buff添加事件
      EventBus.emit(GameEvents.BUFF_ADDED, {
        buff,
      });
    }

    // 触发Buff获得时的效果
    this.triggerBuffEffects(state, buff, 'buff_gained');
  }

  /**
   * 移除Buff
   *
   * @param state 战斗状态
   * @param buffId Buff ID
   */
  static removeBuff(state: BattleState, buffId: string): void {
    const buff = state.buffs.get(buffId);
    if (!buff) return;

    // 移除Buff
    state.buffs.delete(buffId);

    // 触发Buff失去时的效果
    this.triggerBuffEffects(state, buff, 'buff_lost');

    // 触发Buff移除事件
    EventBus.emit(GameEvents.BUFF_REMOVED, {
      buff,
    });
  }

  /**
   * 消耗Buff（减少层数或回合数）
   *
   * @param state 战斗状态
   * @param buffId Buff ID
   * @param amount 消耗量
   * @returns 是否成功消耗
   */
  static consumeBuff(state: BattleState, buffId: string, amount: number = 1): boolean {
    const buff = state.buffs.get(buffId);
    if (!buff) return false;

    if (buff.stacks > 0) {
      // 减少层数
      buff.stacks -= amount;
      if (buff.stacks <= 0) {
        this.removeBuff(state, buffId);
      } else {
        EventBus.emit(GameEvents.BUFF_UPDATED, { buff });
      }
      return true;
    } else if (buff.duration > 0) {
      // 减少回合数
      buff.duration -= amount;
      if (buff.duration <= 0) {
        this.removeBuff(state, buffId);
      } else {
        EventBus.emit(GameEvents.BUFF_UPDATED, { buff });
      }
      return true;
    }

    return false;
  }

  /**
   * 回合开始时更新Buff
   *
   * @param state 战斗状态
   */
  static updateBuffsOnTurnStart(state: BattleState): void {
    const buffsToRemove: string[] = [];

    for (const [buffId, buff] of state.buffs.entries()) {
      // 触发回合开始效果
      this.triggerBuffEffects(state, buff, 'turn_start');

      // 减少持续时间（仅针对duration > 0的Buff）
      if (buff.duration > 0) {
        buff.duration--;
        if (buff.duration === 0) {
          buffsToRemove.push(buffId);
        } else {
          EventBus.emit(GameEvents.BUFF_UPDATED, { buff });
        }
      }
    }

    // 移除过期的Buff
    for (const buffId of buffsToRemove) {
      this.removeBuff(state, buffId);
    }
  }

  /**
   * 回合结束时更新Buff
   *
   * @param state 战斗状态
   */
  static updateBuffsOnTurnEnd(state: BattleState): void {
    for (const buff of state.buffs.values()) {
      // 触发回合结束效果（如好印象）
      this.triggerBuffEffects(state, buff, 'turn_end');
    }
  }

  /**
   * 触发Buff效果
   *
   * @param state 战斗状态
   * @param buff Buff数据
   * @param trigger 触发时机
   * @param context 上下文（可选）
   */
  static triggerBuffEffects(state: BattleState, buff: Buff, trigger: BuffTrigger, context?: BuffEffectContext): void {
    for (const buffEffect of buff.effects) {
      if (buffEffect.trigger === trigger) {
        try {
          buffEffect.effect(state, context);
        } catch (error) {
          console.error(`[BuffManager] Error executing ${buff.name} effect:`, error);
        }
      }
    }
  }

  /**
   * 获取Buff效果值（用于查询）
   *
   * @param state 战斗状态
   * @param buffType Buff类型
   * @returns 效果值（层数或1）
   */
  static getBuffEffect(state: BattleState, buffType: string): number {
    let total = 0;

    for (const buff of state.buffs.values()) {
      if (buff.type === buffType) {
        total += buff.stacks || 1;
      }
    }

    return total;
  }

  /**
   * 检查是否有Buff
   *
   * @param state 战斗状态
   * @param buffType Buff类型
   * @returns 是否存在
   */
  static hasBuff(state: BattleState, buffType: string): boolean {
    for (const buff of state.buffs.values()) {
      if (buff.type === buffType) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取Buff
   *
   * @param state 战斗状态
   * @param buffId Buff ID
   * @returns Buff数据
   */
  static getBuff(state: BattleState, buffId: string): Buff | undefined {
    return state.buffs.get(buffId);
  }

  /**
   * 获取所有正面Buff
   *
   * @param state 战斗状态
   * @returns Buff列表
   */
  static getPositiveBuffs(state: BattleState): Buff[] {
    return Array.from(state.buffs.values()).filter(buff => buff.category === 'positive');
  }

  /**
   * 获取所有负面Buff
   *
   * @param state 战斗状态
   * @returns Buff列表
   */
  static getNegativeBuffs(state: BattleState): Buff[] {
    return Array.from(state.buffs.values()).filter(buff => buff.category === 'negative');
  }

  /**
   * 清除所有负面Buff
   *
   * @param state 战斗状态
   */
  static clearNegativeBuffs(state: BattleState): void {
    const negativeBuffs = this.getNegativeBuffs(state);
    for (const buff of negativeBuffs) {
      this.removeBuff(state, buff.id);
    }
  }

  /**
   * 清除所有Buff
   *
   * @param state 战斗状态
   */
  static clearAllBuffs(state: BattleState): void {
    const allBuffIds = Array.from(state.buffs.keys());
    for (const buffId of allBuffIds) {
      this.removeBuff(state, buffId);
    }
  }

  /**
   * 延长Buff持续时间
   *
   * @param state 战斗状态
   * @param buffId Buff ID
   * @param turns 延长的回合数
   */
  static extendBuffDuration(state: BattleState, buffId: string, turns: number): void {
    const buff = state.buffs.get(buffId);
    if (!buff || buff.duration <= 0) return;

    buff.duration += turns;
    EventBus.emit(GameEvents.BUFF_UPDATED, { buff });
  }

  /**
   * 判断Buff类型是否可叠加
   *
   * @param buffType Buff类型
   * @returns 是否可叠加
   */
  private static isStackableBuff(buffType: string): boolean {
    // 可叠加的Buff类型
    const stackableTypes = ['concentration', 'good_impression'];
    return stackableTypes.includes(buffType);
  }

  /**
   * 获取Buff总数
   *
   * @param state 战斗状态
   * @returns Buff数量
   */
  static getBuffCount(state: BattleState): number {
    return state.buffs.size;
  }

  /**
   * 获取所有Buff的快照
   *
   * @param state 战斗状态
   * @returns Buff列表
   */
  static snapshot(state: BattleState): Buff[] {
    return Array.from(state.buffs.values()).map(buff => ({ ...buff }));
  }
}
