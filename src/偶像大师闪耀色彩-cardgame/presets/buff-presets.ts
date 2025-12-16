/**
 * Buff预设库
 *
 * 包含所有常用Buff的工厂函数
 */

import type { Buff } from '../types';
import { EventBus, GameEvents } from '../utils/event-bus';

/**
 * Buff预设对象
 */
export const BuffPresets = {
  // ========== 感性系统 ==========

  /**
   * 好調（得分+50%）
   */
  好調: (duration: number = 3): Buff => ({
    id: 'good_condition',
    name: '好調',
    type: 'good_condition',
    category: 'positive',
    stacks: 0,
    duration: duration,
    effects: [
      {
        trigger: 'score_calculated',
        effect: state => {
          // 得分+50% (在计分时应用)
          state.score.current = Math.floor(state.score.current * 1.5);
        },
      },
    ],
    iconUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好调.png',
    color: '#4CAF50',
  }),

  /**
   * 集中（每层+15分）
   */
  集中: (stacks: number = 1): Buff => ({
    id: 'concentration',
    name: '集中',
    type: 'concentration',
    category: 'positive',
    stacks: stacks,
    duration: -1, // 永久（直到消耗）
    effects: [
      {
        trigger: 'score_calculated',
        effect: state => {
          const buff = state.buffs.get('concentration');
          if (buff) {
            const bonus = buff.stacks * 15;
            state.score.current += bonus;
          }
        },
      },
    ],
    iconUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/集中.png',
    color: '#2196F3',
  }),

  /**
   * 絶好調（强化好調）
   */
  絶好調: (duration: number = 3): Buff => ({
    id: 'excellent_condition',
    name: '絶好調',
    type: 'excellent_condition',
    category: 'positive',
    stacks: 0,
    duration: duration,
    effects: [
      {
        trigger: 'score_calculated',
        effect: state => {
          // 得分+100%
          state.score.current = Math.floor(state.score.current * 2);
        },
      },
    ],
    iconUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好调.png', // 使用好调图标
    color: '#FF9800',
  }),

  /**
   * 状态良好
   */
  状态良好: (duration: number = 2): Buff => ({
    id: 'state_good',
    name: '状态良好',
    type: 'state_good',
    category: 'positive',
    stacks: 0,
    duration: duration,
    effects: [
      {
        trigger: 'score_calculated',
        effect: state => {
          // 得分+20%
          state.score.current = Math.floor(state.score.current * 1.2);
        },
      },
    ],
    color: '#8BC34A',
  }),

  /**
   * 状态绝佳
   */
  状态绝佳: (duration: number = 3): Buff => ({
    id: 'great_condition',
    name: '状态绝佳',
    type: 'great_condition',
    category: 'positive',
    stacks: 0,
    duration: duration,
    effects: [
      {
        trigger: 'score_calculated',
        effect: state => {
          // 得分+80%
          state.score.current = Math.floor(state.score.current * 1.8);
        },
      },
    ],
    color: '#FFC107',
  }),

  // ========== 理性系统 ==========

  /**
   * 好印象（回合结束直接得分）
   */
  好印象: (stacks: number = 1): Buff => ({
    id: 'good_impression',
    name: '好印象',
    type: 'good_impression',
    category: 'positive',
    stacks: stacks,
    duration: -1, // 永久（直到消耗）
    effects: [
      {
        trigger: 'turn_end',
        effect: state => {
          const buff = state.buffs.get('good_impression');
          if (buff) {
            const score = buff.stacks * 10; // 每层回合结束获得10分
            state.score.current += score;
            EventBus.emit(GameEvents.SCORE_CHANGED, {
              delta: score,
              source: 'good_impression',
            });
          }
        },
      },
    ],
    iconUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好印象.png',
    color: '#9C27B0',
  }),

  /**
   * 有干劲（元气获取量+30%）
   */
  有干劲: (duration: number = 3): Buff => ({
    id: 'motivated',
    name: '有干劲',
    type: 'motivated',
    category: 'positive',
    stacks: 0,
    duration: duration,
    effects: [],
    // 效果在ResourceManager中处理
    iconUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/干劲.png',
    color: '#F44336',
  }),

  // ========== 非凡系统 ==========

  /**
   * 全力状态（得分+200%）
   */
  全力状态: (level: 1 | 2 = 1): Buff => ({
    id: `allout_state_${level}`,
    name: `全力状态（${level === 1 ? '一阶段' : '二阶段'}）`,
    type: level === 1 ? 'allout_state' : 'allout_state_2',
    category: 'positive',
    stacks: level,
    duration: 3,
    effects: [
      {
        trigger: 'score_calculated',
        effect: state => {
          if (level === 1) {
            state.score.current = Math.floor(state.score.current * 3); // 得分+200%
          } else {
            state.score.current = Math.floor(state.score.current * 4); // 得分+300%
          }
        },
      },
    ],
    iconUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/全力.png',
    color: '#E91E63',
  }),

  /**
   * 温存状态
   */
  温存状态: (level: 1 | 2 = 1): Buff => ({
    id: `conserve_state_${level}`,
    name: `温存状态（${level === 1 ? '一阶段' : '二阶段'}）`,
    type: level === 1 ? 'conserve_state' : 'conserve_state_2',
    category: 'positive',
    stacks: level,
    duration: 3,
    effects: [
      {
        trigger: 'turn_end',
        effect: state => {
          // 回合结束获得热意值
          const heatGain = level === 1 ? 2 : 3;
          state.attributes.heat += heatGain;
        },
      },
    ],
    color: '#00BCD4',
  }),

  /**
   * 强气状态（強気）
   */
  强气状态: (level: 1 | 2 = 1): Buff => ({
    id: `resolute_state_${level}`,
    name: `强气状态（${level === 1 ? '一阶段' : '二阶段'}）`,
    type: level === 1 ? 'resolute_state' : 'resolute_state_2',
    category: 'positive',
    stacks: level,
    duration: 3,
    effects: [
      {
        trigger: 'card_used',
        effect: state => {
          // 使用卡牌时获得额外全力值
          const allPowerGain = level === 1 ? 1 : 2;
          state.attributes.allPower += allPowerGain;
        },
      },
    ],
    iconUrl: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/强气.png',
    color: '#FF5722',
  }),

  // ========== 通用正面Buff ==========

  /**
   * 体力消耗减少
   */
  体力消耗减少: (reduction: number = 1, duration: number = 3): Buff => ({
    id: 'stamina_reduction',
    name: `体力消耗-${reduction}`,
    type: 'stamina_reduction',
    category: 'positive',
    stacks: reduction,
    duration: duration,
    effects: [],
    // 效果在ResourceManager中处理
    color: '#4CAF50',
  }),

  /**
   * 元气获取增加
   */
  元气获取增加: (duration: number = 3): Buff => ({
    id: 'genki_boost',
    name: '元气获取+30%',
    type: 'genki_boost',
    category: 'positive',
    stacks: 0,
    duration: duration,
    effects: [],
    // 效果在ResourceManager中处理
    color: '#FFEB3B',
  }),

  /**
   * 得分增加
   */
  得分增加: (percentage: number = 20, duration: number = 3): Buff => ({
    id: 'score_boost',
    name: `得分+${percentage}%`,
    type: 'score_boost',
    category: 'positive',
    stacks: percentage,
    duration: duration,
    effects: [
      {
        trigger: 'score_calculated',
        effect: state => {
          const buff = state.buffs.get('score_boost');
          if (buff) {
            const multiplier = 1 + buff.stacks / 100;
            state.score.current = Math.floor(state.score.current * multiplier);
          }
        },
      },
    ],
    color: '#FFC107',
  }),

  /**
   * 下一张卡效果×2
   */
  下一张卡效果x2: (): Buff => ({
    id: 'double_effect',
    name: '下一张卡效果×2',
    type: 'double_effect',
    category: 'positive',
    stacks: 1,
    duration: 1,
    effects: [],
    // 效果在SkillCardExecutor中处理
    color: '#9C27B0',
  }),

  // ========== 负面Buff（Debuff） ==========

  /**
   * 疲劳（得分-20%）
   */
  疲劳: (duration: number = 2): Buff => ({
    id: 'tired',
    name: '疲劳',
    type: 'tired',
    category: 'negative',
    stacks: 0,
    duration: duration,
    effects: [
      {
        trigger: 'score_calculated',
        effect: state => {
          state.score.current = Math.floor(state.score.current * 0.8);
        },
      },
    ],
    color: '#757575',
  }),

  /**
   * 体力流失（回合开始-5体力）
   */
  体力流失: (duration: number = 3): Buff => ({
    id: 'stamina_drain',
    name: '体力流失',
    type: 'stamina_drain',
    category: 'negative',
    stacks: 5,
    duration: duration,
    effects: [
      {
        trigger: 'turn_start',
        effect: state => {
          const buff = state.buffs.get('stamina_drain');
          if (buff) {
            state.stamina = Math.max(0, state.stamina - buff.stacks);
            EventBus.emit(GameEvents.STAMINA_CHANGED, {
              delta: -buff.stacks,
              current: state.stamina,
              max: state.maxStamina,
            });
          }
        },
      },
    ],
    color: '#F44336',
  }),
};

/**
 * 根据Buff类型创建Buff
 *
 * @param buffType Buff类型名称
 * @param params 参数（如duration、stacks等）
 * @returns Buff对象
 */
export function createBuff(buffType: keyof typeof BuffPresets, ...params: any[]): Buff | null {
  const factory = BuffPresets[buffType];
  if (!factory) {
    console.error(`[BuffPresets] Unknown buff type: ${buffType}`);
    return null;
  }

  try {
    return factory(...params);
  } catch (error) {
    console.error(`[BuffPresets] Error creating buff ${buffType}:`, error);
    return null;
  }
}
