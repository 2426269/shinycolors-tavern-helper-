/**
 * 属性管理器
 *
 * 管理游戏中的所有属性（专注、干劲、好印象、全力值、热意值等）
 */

import type { BattleAttributes, BattleState } from '../types';
import { EventBus, GameEvents } from '../utils/event-bus';

export class AttributeManager {
  private state: BattleState;

  constructor(state: BattleState) {
    this.state = state;
  }

  /**
   * 增加属性值
   *
   * @param attributeName 属性名称
   * @param value 增加的值
   */
  add(attributeName: keyof BattleAttributes, value: number): void {
    if (value <= 0) return;

    const current = this.state.attributes[attributeName] as number;
    const newValue = current + value;

    // 更新属性
    (this.state.attributes[attributeName] as number) = newValue;

    // 触发事件
    this.onAttributeChanged(attributeName, value);
  }

  /**
   * 消耗属性值
   *
   * @param attributeName 属性名称
   * @param value 消耗的值
   * @returns 是否成功消耗
   */
  consume(attributeName: keyof BattleAttributes, value: number): boolean {
    if (value <= 0) return true;

    const current = this.state.attributes[attributeName] as number;

    // 检查是否足够
    if (current < value) {
      return false; // 资源不足
    }

    // 消耗属性
    (this.state.attributes[attributeName] as number) = current - value;

    // 触发事件
    this.onAttributeChanged(attributeName, -value);

    return true;
  }

  /**
   * 获取属性值
   *
   * @param attributeName 属性名称
   * @returns 属性值
   */
  get(attributeName: keyof BattleAttributes): number {
    const value = this.state.attributes[attributeName];

    // 处理特殊类型
    if (typeof value === 'number') {
      return value;
    }

    // anomalyState、stateLevel、pointerLocked等非数字类型返回0
    return 0;
  }

  /**
   * 设置属性值
   *
   * @param attributeName 属性名称
   * @param value 新值
   */
  set(attributeName: keyof BattleAttributes, value: number): void {
    const oldValue = this.get(attributeName);
    (this.state.attributes[attributeName] as number) = Math.max(0, value);

    const delta = value - oldValue;
    if (delta !== 0) {
      this.onAttributeChanged(attributeName, delta);
    }
  }

  /**
   * 属性变化回调
   *
   * @param attributeName 属性名称
   * @param delta 变化量
   */
  private onAttributeChanged(attributeName: string, delta: number): void {
    // 触发通用属性变化事件
    EventBus.emit(GameEvents.ATTRIBUTE_CHANGED, {
      attributeName,
      delta,
      newValue: this.get(attributeName as keyof BattleAttributes),
    });

    // 特殊处理：全力值满10
    if (attributeName === 'allPower') {
      const allPower = this.get('allPower');
      if (allPower >= 10) {
        this.triggerAllPowerTransform();
      }
    }
  }

  /**
   * 全力值转化（非凡系统）
   *
   * 当全力值达到10时，转化为全力状态
   */
  private triggerAllPowerTransform(): void {
    // 消耗10全力值
    this.state.attributes.allPower = 0;

    // 切换到全力状态
    this.state.attributes.anomalyState = 'allout';
    this.state.attributes.stateLevel = 1;

    // 触发事件（BuffManager会监听此事件并添加全力状态Buff）
    EventBus.emit(GameEvents.ALL_POWER_FULL, {
      planType: this.state.planType,
    });

    // 触发非凡状态变化事件
    EventBus.emit(GameEvents.ANOMALY_STATE_CHANGED, {
      oldState: null,
      newState: 'allout',
      level: 1,
    });
  }

  /**
   * 切换非凡状态
   *
   * @param newState 新状态
   * @param level 状态阶段（1或2）
   */
  switchAnomalyState(newState: 'allout' | 'conserve' | 'resolute' | 'relaxed', level: 1 | 2 = 1): void {
    const oldState = this.state.attributes.anomalyState;

    // 更新状态
    this.state.attributes.anomalyState = newState;
    this.state.attributes.stateLevel = level;

    // 触发事件
    EventBus.emit(GameEvents.ANOMALY_STATE_CHANGED, {
      oldState,
      newState,
      level,
    });
  }

  /**
   * 清除非凡状态
   */
  clearAnomalyState(): void {
    const oldState = this.state.attributes.anomalyState;

    if (oldState) {
      this.state.attributes.anomalyState = null;
      this.state.attributes.stateLevel = 1;

      EventBus.emit(GameEvents.ANOMALY_STATE_CHANGED, {
        oldState,
        newState: null,
        level: 1,
      });
    }
  }

  /**
   * 锁定非凡指针
   */
  lockPointer(): void {
    if (!this.state.attributes.pointerLocked) {
      this.state.attributes.pointerLocked = true;
      EventBus.emit(GameEvents.POINTER_LOCKED);
    }
  }

  /**
   * 解锁非凡指针
   */
  unlockPointer(): void {
    if (this.state.attributes.pointerLocked) {
      this.state.attributes.pointerLocked = false;
      EventBus.emit(GameEvents.POINTER_UNLOCKED);
    }
  }

  /**
   * 重置所有属性
   */
  reset(): void {
    this.state.attributes = {
      concentration: 0,
      motivation: 0,
      goodImpression: 0,
      allPower: 0,
      heat: 0,
      anomalyState: null,
      stateLevel: 1,
      pointerLocked: false,
      energy: 0,
    };
  }

  /**
   * 获取所有属性的快照
   */
  snapshot(): BattleAttributes {
    return { ...this.state.attributes };
  }
}














