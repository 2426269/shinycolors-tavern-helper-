/**
 * RuleEvaluator - JSON Logic 规则求值器
 * 用于评估卡牌效果的条件表达式
 */

import jsonLogic from 'json-logic-js';
import type { BattleContext, JsonLogicExpression } from './types';

/**
 * 规则求值器
 * 封装 json-logic-js，提供类型安全的接口
 */
export class RuleEvaluator {
  private rngSeed: number;
  private rngFn?: () => number; // T-2: 注入的 RNG 函数

  constructor(seed?: number) {
    this.rngSeed = seed ?? Date.now();
    this.registerCustomOperations();
  }

  /**
   * T-2: 注入 RNG 函数
   */
  public setRng(fn: () => number): void {
    this.rngFn = fn;
  }

  /**
   * T-2: 统一随机数入口 - 优先使用注入的 rngFn
   */
  public random(): number {
    if (this.rngFn) {
      return this.rngFn();
    }
    return this.nextRandom();
  }

  /**
   * 注册自定义操作符
   */
  private registerCustomOperations(): void {
    // 随机数操作符（T-2: 使用 this.random() 统一入口）
    jsonLogic.add_operation('rand', () => {
      return this.random();
    });

    // 检查是否有 Tag (支持前缀兼容)
    jsonLogic.add_operation('hasTag', (tag: string, tags: string[]) => {
      if (!tags || !Array.isArray(tags)) return false;

      // 1. 精确匹配
      if (tags.includes(tag)) return true;

      // 2. 若 tag 不含冒号，尝试 ai:${tag} 和 std:${tag}
      if (!tag.includes(':')) {
        if (tags.includes(`ai:${tag}`)) return true;
        if (tags.includes(`std:${tag}`)) return true;
      }

      // 3. 若 tag 含冒号，仅精确匹配（已在步骤1处理）
      return false;
    });

    // 检查是否有 Buff
    jsonLogic.add_operation('hasBuff', (buffId: string, buffs: Record<string, number>) => {
      return (buffs?.[buffId] ?? 0) > 0;
    });

    // 获取 Buff 层数
    jsonLogic.add_operation('buffStacks', (buffId: string, buffs: Record<string, number>) => {
      return buffs?.[buffId] ?? 0;
    });

    // 百分比计算
    jsonLogic.add_operation('percent', (value: number, total: number) => {
      if (total === 0) return 0;
      return (value / total) * 100;
    });

    // 取整
    jsonLogic.add_operation('floor', (value: number) => Math.floor(value));
    jsonLogic.add_operation('ceil', (value: number) => Math.ceil(value));
    jsonLogic.add_operation('round', (value: number) => Math.round(value));

    // 限制范围
    jsonLogic.add_operation('clamp', (value: number, min: number, max: number) => {
      return Math.min(Math.max(value, min), max);
    });

    // T7: 匹配卡名（支持中文名和日文名）
    jsonLogic.add_operation(
      'matchCardName',
      (targetNames: string | string[], cardName: string, cardNameJP?: string) => {
        const names = Array.isArray(targetNames) ? targetNames : [targetNames];
        return names.includes(cardName) || (cardNameJP && names.includes(cardNameJP));
      },
    );
  }

  /**
   * 生成可复现的随机数 (0-1)
   */
  private nextRandom(): number {
    // 简单的 LCG 算法
    this.rngSeed = (this.rngSeed * 1103515245 + 12345) % 2147483648;
    return this.rngSeed / 2147483648;
  }

  /**
   * 重置随机数种子
   */
  public resetSeed(seed: number): void {
    this.rngSeed = seed;
  }

  /**
   * 评估布尔条件
   * @param rule JSON Logic 规则
   * @param context 战斗上下文
   * @returns 条件是否满足
   */
  public evaluateCondition(rule: JsonLogicExpression | undefined, context: BattleContext): boolean {
    // 无条件时默认为 true
    if (rule === undefined || rule === null) {
      return true;
    }

    try {
      const result = jsonLogic.apply(rule, context);
      return Boolean(result);
    } catch (error) {
      console.error('❌ [RuleEvaluator] 条件评估失败:', error);
      console.error('规则:', JSON.stringify(rule));
      return false; // 失败时默认不执行
    }
  }

  /**
   * 评估通用规则
   * @param rule JSON Logic 规则
   * @param context 战斗上下文
   * @returns 评估结果
   */
  public evaluate(rule: JsonLogicExpression | undefined, context: BattleContext): any {
    if (rule === undefined || rule === null) {
      return true; // 默认通过
    }
    try {
      return jsonLogic.apply(rule, context);
    } catch (error) {
      console.error('❌ [RuleEvaluator] 规则评估失败:', error);
      return false;
    }
  }

  /**
   * 评估数值表达式
   * @param expr JSON Logic 表达式
   * @param context 战斗上下文
   * @returns 计算结果
   */
  public evaluateNumber(expr: JsonLogicExpression | number | undefined, context: BattleContext): number {
    // 如果是直接数值，返回
    if (typeof expr === 'number') {
      return expr;
    }

    // 如果是 undefined，返回 0
    if (expr === undefined) {
      return 0;
    }

    try {
      const result = jsonLogic.apply(expr, context);
      return typeof result === 'number' ? result : 0;
    } catch (error) {
      console.error('❌ [RuleEvaluator] 数值评估失败:', error);
      return 0;
    }
  }

  /**
   * 验证规则语法
   * @param rule 要验证的规则
   * @returns 是否有效
   */
  public validateRule(rule: JsonLogicExpression): boolean {
    try {
      // 用空上下文测试规则
      const testContext: BattleContext = {
        player: {
          genki: 0,
          genki_percent: 0,
          stamina: 0,
          stamina_percent: 0,
          score: 0,
          concentration: 0,
          motivation: 0,
          good_impression: 0,
          all_power: 0,
          heat: 0,
          buffs: {},
          tags: [],
          state_switch_count: {}, // EV1: per-state 计数
          state_switch_count_total: 0, // EV1: 总次数
        },
        turn: 1,
        max_turns: 12,
        cards_played_this_turn: 0,
        cards_played_total: 0, // 总出牌数
        rng: 0.5,
        // EV1: 新增字段默认值
        play_turn: 1,
        deck_count: 0,
        discard_count: 0,
        cards_in_hand_by_rarity: { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 },
        new_state: undefined,
        stamina_cost: 0,
      };

      jsonLogic.apply(rule, testContext);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 创建战斗上下文（从战斗状态转换）
 * @param state 战斗状态对象
 * @param rng 随机数 (0-1)。回放/录制场景必须注入确定性数值。
 */
export function createBattleContext(state: any, rng: number): BattleContext {
  // T-2: rng 必须显式传入，禁止默认 Math.random()
  return {
    player: {
      genki: state.genki ?? 0,
      genki_percent: state.maxGenki > 0 ? (state.genki / state.maxGenki) * 100 : 0,
      stamina: state.stamina ?? 0,
      stamina_percent: state.maxStamina > 0 ? (state.stamina / state.maxStamina) * 100 : 0,
      score: state.score ?? 0,
      concentration: state.concentration ?? 0,
      motivation: state.motivation ?? 0,
      good_impression: state.goodImpression ?? 0,
      all_power: state.allPower ?? 0,
      heat: state.heat ?? 0,
      buffs: buffMapToRecord(state.buffs),
      tags: state.tags ?? [],
      state_switch_count: state.stateSwitchCount ?? {}, // EV1: per-state 计数
      state_switch_count_total: state.stateSwitchCountTotal ?? 0, // EV1: 总次数
    },
    turn: state.turn ?? 1,
    max_turns: state.maxTurns ?? 12,
    cards_played_this_turn: state.cardsPlayedThisTurn ?? 0,
    cards_played_total: state.cardsPlayedTotal ?? 0, // 总出牌数
    rng: rng, // 直接使用数值
    // EV1: 新增字段
    play_turn: state.playTurn ?? state.turn ?? 1,
    deck_count: state.deckCount ?? 0,
    discard_count: state.discardCount ?? 0,
    cards_in_hand_by_rarity: state.cardsInHandByRarity ?? { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 },
    new_state: state.newState,
    stamina_cost: state.staminaCost ?? 0,
  };
}

/**
 * 将 Buff Map 转换为 Record
 */
function buffMapToRecord(buffs: Map<string, any> | undefined): Record<string, number> {
  if (!buffs) return {};

  const record: Record<string, number> = {};
  buffs.forEach((buff, key) => {
    record[key] = buff.stacks ?? 1;
  });
  return record;
}

// 导出单例（可选）
export const ruleEvaluator = new RuleEvaluator();
