/**
 * 资源管理器
 *
 * 管理游戏中的资源（体力、元气）
 */

import type { BattleState } from '../types';
import { EventBus, GameEvents } from '../utils/event-bus';

export class ResourceManager {
  /**
   * 回复体力
   *
   * @param state 战斗状态
   * @param amount 回复量
   * @returns 实际回复量
   */
  static recoverStamina(state: BattleState, amount: number): number {
    if (amount <= 0) return 0;

    const oldStamina = state.stamina;
    state.stamina = Math.min(state.maxStamina, state.stamina + amount);
    const actualRecovered = state.stamina - oldStamina;

    // 触发事件
    EventBus.emit(GameEvents.STAMINA_CHANGED, {
      delta: actualRecovered,
      current: state.stamina,
      max: state.maxStamina,
    });

    return actualRecovered;
  }

  /**
   * 消耗体力
   *
   * @param state 战斗状态
   * @param amount 消耗量
   * @returns 是否成功消耗
   */
  static consumeStamina(state: BattleState, amount: number): boolean {
    if (amount <= 0) return true;

    // 检查体力消耗减少Buff
    const reduction = this.getStaminaReduction(state);
    const actualCost = Math.max(0, amount - reduction);

    // 检查是否足够
    if (state.stamina < actualCost) {
      return false; // 体力不足
    }

    // 消耗体力
    state.stamina -= actualCost;

    // 触发事件
    EventBus.emit(GameEvents.STAMINA_CHANGED, {
      delta: -actualCost,
      current: state.stamina,
      max: state.maxStamina,
    });

    return true;
  }

  /**
   * 增加元气
   *
   * @param state 战斗状态
   * @param amount 增加量
   * @returns 实际增加量
   */
  static gainGenki(state: BattleState, amount: number): number {
    if (amount <= 0) return 0;

    // 检查元气增加Buff
    const boost = this.getGenkiBoost(state);
    const boostPercentage = boost * 0.01; // 转换为百分比
    const actualGain = Math.floor(amount * (1 + boostPercentage));

    const oldGenki = state.genki;
    state.genki = Math.min(100, state.genki + actualGain);
    const actualAdded = state.genki - oldGenki;

    // 触发事件
    EventBus.emit(GameEvents.GENKI_CHANGED, {
      delta: actualAdded,
      current: state.genki,
      max: 100,
    });

    return actualAdded;
  }

  /**
   * 消耗元气
   *
   * @param state 战斗状态
   * @param amount 消耗量
   * @returns 是否成功消耗
   */
  static consumeGenki(state: BattleState, amount: number): boolean {
    if (amount <= 0) return true;

    // 检查是否足够
    if (state.genki < amount) {
      return false; // 元气不足
    }

    // 消耗元气
    state.genki -= amount;

    // 触发事件
    EventBus.emit(GameEvents.GENKI_CHANGED, {
      delta: -amount,
      current: state.genki,
      max: 100,
    });

    return true;
  }

  /**
   * 获取体力消耗减少值
   *
   * 遍历所有Buff，累加体力消耗减少效果
   *
   * @param state 战斗状态
   * @returns 减少值
   */
  private static getStaminaReduction(state: BattleState): number {
    let reduction = 0;

    for (const buff of state.buffs.values()) {
      if (buff.type === 'stamina_reduction') {
        reduction += buff.stacks || 1;
      }
    }

    return reduction;
  }

  /**
   * 获取元气获取增加值（百分比）
   *
   * 遍历所有Buff，累加元气获取增加效果
   *
   * @param state 战斗状态
   * @returns 增加百分比（如30表示+30%）
   */
  private static getGenkiBoost(state: BattleState): number {
    let boost = 0;

    for (const buff of state.buffs.values()) {
      if (buff.type === 'genki_boost') {
        boost += 30; // 默认+30%
      } else if (buff.type === 'motivated') {
        // "有干劲"Buff：元气获取量增加
        boost += 30;
      }
    }

    return boost;
  }

  /**
   * 设置体力
   *
   * @param state 战斗状态
   * @param value 新值
   */
  static setStamina(state: BattleState, value: number): void {
    const oldValue = state.stamina;
    state.stamina = Math.max(0, Math.min(state.maxStamina, value));

    const delta = state.stamina - oldValue;
    if (delta !== 0) {
      EventBus.emit(GameEvents.STAMINA_CHANGED, {
        delta,
        current: state.stamina,
        max: state.maxStamina,
      });
    }
  }

  /**
   * 设置元气
   *
   * @param state 战斗状态
   * @param value 新值
   */
  static setGenki(state: BattleState, value: number): void {
    const oldValue = state.genki;
    state.genki = Math.max(0, Math.min(100, value));

    const delta = state.genki - oldValue;
    if (delta !== 0) {
      EventBus.emit(GameEvents.GENKI_CHANGED, {
        delta,
        current: state.genki,
        max: 100,
      });
    }
  }

  /**
   * 增加最大体力
   *
   * @param state 战斗状态
   * @param amount 增加量
   */
  static increaseMaxStamina(state: BattleState, amount: number): void {
    if (amount <= 0) return;

    state.maxStamina += amount;

    // 触发事件
    EventBus.emit(GameEvents.STAMINA_CHANGED, {
      delta: 0,
      current: state.stamina,
      max: state.maxStamina,
    });
  }

  /**
   * 检查是否有足够的资源
   *
   * @param state 战斗状态
   * @param staminaCost 体力消耗
   * @param genkiCost 元气消耗
   * @returns 是否足够
   */
  static hasEnoughResources(state: BattleState, staminaCost: number, genkiCost: number): boolean {
    // 应用体力消耗减少
    const reduction = this.getStaminaReduction(state);
    const actualStaminaCost = Math.max(0, staminaCost - reduction);

    return state.stamina >= actualStaminaCost && state.genki >= genkiCost;
  }

  /**
   * 获取资源状态快照
   *
   * @param state 战斗状态
   */
  static snapshot(state: BattleState): {
    stamina: number;
    maxStamina: number;
    genki: number;
  } {
    return {
      stamina: state.stamina,
      maxStamina: state.maxStamina,
      genki: state.genki,
    };
  }
}
