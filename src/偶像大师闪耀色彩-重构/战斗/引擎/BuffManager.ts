/**
 * Buff管理器
 * 处理所有Buff的增删改查和回合更新
 */

import type { BattleState, Buff, BuffType } from '../类型';
import { createBuff } from '../类型';

export class BuffManager {
  /**
   * 添加Buff
   */
  static addBuff(state: BattleState, buffType: BuffType, value: number = 1, duration: number = -1): void {
    const existing = state.buffs.get(buffType);

    if (existing) {
      // 已存在：根据Buff类型决定叠加方式
      if (this.isStackableBuff(buffType)) {
        // 层数叠加型（集中、好印象等）
        existing.stacks += value;
      } else if (duration > 0) {
        // 持续时间型（好调等）：取最大值
        existing.duration = Math.max(existing.duration, duration);
        if (value > existing.stacks) {
          existing.stacks = value;
        }
      }
    } else {
      // 新Buff
      const newBuff = createBuff(buffType, value, duration);
      state.buffs.set(buffType, newBuff);
    }

    console.log(`[Buff] 添加 ${buffType}: ${value}层, ${duration}回合`);
  }

  /**
   * 移除Buff
   */
  static removeBuff(state: BattleState, buffType: BuffType): boolean {
    if (state.buffs.has(buffType)) {
      state.buffs.delete(buffType);
      console.log(`[Buff] 移除 ${buffType}`);
      return true;
    }
    return false;
  }

  /**
   * 消耗Buff（减少层数或回合数）
   * 返回是否成功消耗
   */
  static consumeBuff(state: BattleState, buffType: BuffType, amount: number = 1): boolean {
    const buff = state.buffs.get(buffType);
    if (!buff) return false;

    if (this.isStackableBuff(buffType)) {
      // 层数型：减少层数
      if (buff.stacks < amount) return false;
      buff.stacks -= amount;
      if (buff.stacks <= 0) {
        this.removeBuff(state, buffType);
      }
    } else {
      // 持续时间型：减少回合数
      if (buff.duration > 0 && buff.duration < amount) return false;
      buff.duration -= amount;
      if (buff.duration <= 0) {
        this.removeBuff(state, buffType);
      }
    }

    console.log(`[Buff] 消耗 ${buffType}: ${amount}`);
    return true;
  }

  /**
   * 检查是否有Buff
   */
  static hasBuff(state: BattleState, buffType: BuffType): boolean {
    return state.buffs.has(buffType);
  }

  /**
   * 获取Buff层数
   */
  static getStacks(state: BattleState, buffType: BuffType): number {
    const buff = state.buffs.get(buffType);
    return buff?.stacks || 0;
  }

  /**
   * 获取Buff剩余回合数
   */
  static getDuration(state: BattleState, buffType: BuffType): number {
    const buff = state.buffs.get(buffType);
    return buff?.duration || 0;
  }

  /**
   * 回合开始时更新Buff
   * - 减少持续时间
   * - 移除过期Buff
   */
  static onTurnStart(state: BattleState): void {
    const toRemove: BuffType[] = [];

    for (const [buffType, buff] of state.buffs) {
      // 只有持续时间型Buff在回合开始时减少
      if (!this.isStackableBuff(buffType) && buff.duration > 0) {
        buff.duration--;
        console.log(`[Buff] ${buffType} 剩余 ${buff.duration} 回合`);

        if (buff.duration <= 0) {
          toRemove.push(buffType);
        }
      }
    }

    // 移除过期Buff
    for (const buffType of toRemove) {
      this.removeBuff(state, buffType);
    }
  }

  /**
   * 回合结束时处理Buff效果
   * - 好印象结算得分
   * - 热意值结算
   */
  static onTurnEnd(state: BattleState): number {
    let scoreGained = 0;

    // 好印象结算：每层获得10分
    if (state.goodImpression > 0) {
      const impressionScore = state.goodImpression * 10;
      scoreGained += impressionScore;
      console.log(`[Buff] 好印象结算: ${state.goodImpression}层 x 10 = ${impressionScore}分`);

      // 好印象每回合-1层
      state.goodImpression = Math.max(0, state.goodImpression - 1);
    }

    // 热意值结算（非凡）
    if (state.heat > 0) {
      scoreGained += state.heat;
      console.log(`[Buff] 热意结算: ${state.heat}分`);
      state.heat = 0; // 热意每回合清零
    }

    return scoreGained;
  }

  /**
   * 判断是否为层数叠加型Buff
   */
  private static isStackableBuff(buffType: BuffType): boolean {
    // 这些Buff是层数型的
    const stackableBuffs: BuffType[] = [
      'EXCELLENT_CONDITION', // 绝好调
      'STAMINA_REDUCTION', // 体力消耗减少
    ];
    return stackableBuffs.includes(buffType);
  }

  /**
   * 获取所有活跃Buff列表（用于UI显示）
   */
  static getAllBuffs(state: BattleState): Buff[] {
    return Array.from(state.buffs.values());
  }

  /**
   * 获取正面Buff列表
   */
  static getPositiveBuffs(state: BattleState): Buff[] {
    return this.getAllBuffs(state).filter(b => b.category === 'positive');
  }

  /**
   * 获取负面Buff列表
   */
  static getNegativeBuffs(state: BattleState): Buff[] {
    return this.getAllBuffs(state).filter(b => b.category === 'negative');
  }
}
