/**
 * 事件总线
 *
 * 用于游戏系统内部的事件通信
 */

type EventCallback = (...args: any[]) => void;

class EventBusClass {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * 监听事件
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;

    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;

    for (const callback of callbacks) {
      try {
        callback(...args);
      } catch (error) {
        console.error(`[EventBus] Error in ${event} handler:`, error);
      }
    }
  }

  /**
   * 只监听一次
   */
  once(event: string, callback: EventCallback): void {
    const onceCallback: EventCallback = (...args: any[]) => {
      callback(...args);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * 清除指定事件的所有监听器
   */
  clearEvent(event: string): void {
    this.events.delete(event);
  }
}

/**
 * 全局事件总线实例
 */
export const EventBus = new EventBusClass();

/**
 * 游戏事件类型定义
 */
export const GameEvents = {
  // 属性变化
  ATTRIBUTE_CHANGED: 'attribute_changed',
  ALL_POWER_FULL: 'all_power_full',

  // 资源变化
  STAMINA_CHANGED: 'stamina_changed',
  GENKI_CHANGED: 'genki_changed',

  // Buff变化
  BUFF_ADDED: 'buff_added',
  BUFF_REMOVED: 'buff_removed',
  BUFF_UPDATED: 'buff_updated',

  // 得分变化
  SCORE_CHANGED: 'score_changed',

  // 卡牌操作
  CARD_USED: 'card_used',
  CARD_DRAWN: 'card_drawn',
  CARD_DISCARDED: 'card_discarded',
  CARD_REMOVED: 'card_removed',

  // 回合变化
  TURN_STARTED: 'turn_started',
  TURN_ENDED: 'turn_ended',

  // 战斗状态
  BATTLE_STARTED: 'battle_started',
  BATTLE_ENDED: 'battle_ended',

  // 非凡系统
  ANOMALY_STATE_CHANGED: 'anomaly_state_changed',
  POINTER_LOCKED: 'pointer_locked',
  POINTER_UNLOCKED: 'pointer_unlocked',
} as const;







