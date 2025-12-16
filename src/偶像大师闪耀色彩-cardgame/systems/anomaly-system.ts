/**
 * 非凡系统（アノマリー）
 *
 * 管理非凡系统的四态切换、全力值、热意值等机制
 */

import { AttributeManager } from '../core/attribute-manager';
import { BuffManager } from '../core/buff-manager';
import { BuffPresets } from '../presets/buff-presets';
import type { AnomalyState, BattleState } from '../types';
import { EventBus, GameEvents } from '../utils/event-bus';

/**
 * 非凡状态配置
 */
export interface AnomalyStateConfig {
  state: AnomalyState;
  level: 1 | 2;
  duration: number; // 持续回合数
  effects: {
    onEnter?: (battleState: BattleState) => void;
    onExit?: (battleState: BattleState) => void;
    onTurnStart?: (battleState: BattleState) => void;
    onTurnEnd?: (battleState: BattleState) => void;
  };
}

/**
 * 非凡系统管理器
 */
export class AnomalySystem {
  private state: BattleState;
  private attributeManager: AttributeManager;

  constructor(state: BattleState) {
    this.state = state;
    this.attributeManager = new AttributeManager(state);

    // 监听全力值满的事件
    EventBus.on(GameEvents.ALL_POWER_FULL, this.onAllPowerFull.bind(this));
  }

  /**
   * 全力值满时触发（自动转换为全力状态）
   */
  private onAllPowerFull(): void {
    // AttributeManager已经处理了状态切换，这里添加Buff
    const level = this.state.attributes.stateLevel;
    const buff = BuffPresets.全力状态(level);
    BuffManager.addBuff(this.state, buff);
  }

  /**
   * 切换到指定状态
   *
   * @param newState 新状态
   * @param level 状态阶段（1或2）
   */
  switchState(newState: 'allout' | 'conserve' | 'resolute' | 'relaxed', level: 1 | 2 = 1): void {
    const oldState = this.state.attributes.anomalyState;

    // 退出旧状态
    if (oldState) {
      this.exitState(oldState);
    }

    // 切换状态
    this.attributeManager.switchAnomalyState(newState, level);

    // 进入新状态
    this.enterState(newState, level);
  }

  /**
   * 进入状态时的处理
   */
  private enterState(state: AnomalyState, level: 1 | 2): void {
    if (!state) return;

    switch (state) {
      case 'allout':
        // 全力状态：添加全力状态Buff
        BuffManager.addBuff(this.state, BuffPresets.全力状态(level));
        break;

      case 'conserve':
        // 温存状态：添加温存状态Buff
        BuffManager.addBuff(this.state, BuffPresets.温存状态(level));
        break;

      case 'resolute':
        // 强气状态：添加强气状态Buff
        BuffManager.addBuff(this.state, BuffPresets.强气状态(level));
        break;

      case 'relaxed':
        // のんびり状态：特殊处理（未来扩展）
        console.log('[AnomalySystem] Entered relaxed state');
        break;
    }
  }

  /**
   * 退出状态时的处理
   */
  private exitState(state: AnomalyState): void {
    if (!state) return;

    // 移除对应的状态Buff
    const buffIds = [
      `allout_state_1`,
      `allout_state_2`,
      `conserve_state_1`,
      `conserve_state_2`,
      `resolute_state_1`,
      `resolute_state_2`,
    ];

    for (const buffId of buffIds) {
      if (this.state.buffs.has(buffId)) {
        BuffManager.removeBuff(this.state, buffId);
      }
    }
  }

  /**
   * 增加全力值
   *
   * @param amount 增加量
   */
  addAllPower(amount: number): void {
    this.attributeManager.add('allPower', amount);
  }

  /**
   * 消耗全力值
   *
   * @param amount 消耗量
   * @returns 是否成功消耗
   */
  consumeAllPower(amount: number): boolean {
    return this.attributeManager.consume('allPower', amount);
  }

  /**
   * 增加热意值
   *
   * @param amount 增加量
   */
  addHeat(amount: number): void {
    this.attributeManager.add('heat', amount);
  }

  /**
   * 升级当前状态（1阶段→2阶段）
   */
  upgradeState(): boolean {
    const currentState = this.state.attributes.anomalyState;
    const currentLevel = this.state.attributes.stateLevel;

    if (!currentState || currentLevel === 2) {
      return false; // 没有状态或已经是2阶段
    }

    // 升级到2阶段
    this.switchState(currentState, 2);
    return true;
  }

  /**
   * 锁定指针
   */
  lockPointer(): void {
    this.attributeManager.lockPointer();
  }

  /**
   * 解锁指针
   */
  unlockPointer(): void {
    this.attributeManager.unlockPointer();
  }

  /**
   * 检查是否可以进入全力状态
   */
  canEnterAllout(): boolean {
    return this.attributeManager.get('allPower') >= 10;
  }

  /**
   * 获取当前状态信息
   */
  getCurrentStateInfo(): {
    state: AnomalyState;
    level: 1 | 2;
    allPower: number;
    heat: number;
    pointerLocked: boolean;
  } {
    return {
      state: this.state.attributes.anomalyState,
      level: this.state.attributes.stateLevel,
      allPower: this.attributeManager.get('allPower'),
      heat: this.attributeManager.get('heat'),
      pointerLocked: this.state.attributes.pointerLocked,
    };
  }

  /**
   * 回合开始时的处理
   */
  onTurnStart(): void {
    const currentState = this.state.attributes.anomalyState;

    if (currentState === 'conserve') {
      // 温存状态：回合开始获得热意值（Buff中已处理）
    }
  }

  /**
   * 回合结束时的处理
   */
  onTurnEnd(): void {
    const currentState = this.state.attributes.anomalyState;

    if (currentState === 'conserve') {
      // 温存状态：回合结束获得热意值（Buff中已处理）
    }

    // 检查热意值是否达到升级条件
    const heat = this.attributeManager.get('heat');
    const level = this.state.attributes.stateLevel;

    if (heat >= 5 && level === 1 && currentState) {
      // 自动升级到2阶段
      this.upgradeState();
      // 消耗热意值
      this.state.attributes.heat = 0;
    }
  }

  /**
   * 清除当前状态
   */
  clearState(): void {
    this.attributeManager.clearAnomalyState();
  }

  /**
   * 销毁（移除事件监听）
   */
  destroy(): void {
    EventBus.off(GameEvents.ALL_POWER_FULL, this.onAllPowerFull.bind(this));
  }
}

/**
 * 非凡状态描述
 */
export const AnomalyStateDescriptions = {
  allout: {
    name: '全力状态',
    description: '得分大幅提升，持续3回合',
    icon: '🔥',
    color: '#E91E63',
  },
  conserve: {
    name: '温存状态',
    description: '每回合结束获得热意值',
    icon: '💧',
    color: '#00BCD4',
  },
  resolute: {
    name: '强气状态（強気）',
    description: '使用卡牌时获得全力值',
    icon: '⚡',
    color: '#FF5722',
  },
  relaxed: {
    name: 'のんびり状态',
    description: '放松状态',
    icon: '🌸',
    color: '#FF69B4',
  },
};

/**
 * 获取状态描述
 */
export function getAnomalyStateDescription(state: AnomalyState, level: 1 | 2) {
  if (!state) return null;

  const baseDesc = AnomalyStateDescriptions[state];
  return {
    ...baseDesc,
    level,
    fullName: `${baseDesc.name}（${level === 1 ? '一阶段' : '二阶段'}）`,
  };
}
