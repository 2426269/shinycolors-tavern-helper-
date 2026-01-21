/**
 * 战斗系统 NG (Next Generation) - 统一导出
 * 基于 Hooks + Atomic Actions + JSON Logic 架构
 */

// 类型导出
export * from './types';

// 核心模块导出
export { ActionExecutor, actionExecutor } from './ActionExecutor';
export type { BattleStateNG } from './ActionExecutor';
export { CardZoneManager, cardZoneManager } from './CardZoneManager';
export { HookManager, hookManager } from './HookManager';
export { createBattleContext, RuleEvaluator, ruleEvaluator } from './RuleEvaluator';
export { StateManager, stateManager } from './StateManager';
export type { BuffInstance, TagInstance } from './StateManager';
export { TurnController } from './TurnController'; // T-6: 导出 TurnController
// T-17: 共享的战斗上下文构建器
export { buildBattleContext, extendContextWithStaminaCost, extendContextWithState } from './BattleContextBuilder';

// 兼容层导出
export { adaptLegacyEffects, convertAndOptimize, debugConversion, optimizeSteps } from './legacyEffectAdapter';

// Schema 验证导出
export { DynamicVisualSchema, EngineDataSchema, normalizeEngineData, validateEngineData } from './engineDataSchema';
export type { EngineData } from './engineDataSchema';

// 视觉注册表导出
export { STANDARD_BUFF_VISUALS, visualRegistry } from './VisualRegistry';
export type { DynamicVisual } from './VisualRegistry';

// P-Lab 流派系统导出
export { flowRegistry } from './FlowRegistry';
export { mechanicRegistry } from './MechanicRegistry';

// 效果文本解析器导出 (新旧系统桥梁)
export {
  convertEffectEntriesToLogicChain,
  debugParseEffect,
  getTotalScoreValue,
  hasScoreEffect,
  parseEffectText,
  parseMultipleEffects,
} from './effectTextParser';

// ==================== P2-3: 工厂函数 ====================

import { ActionExecutor } from './ActionExecutor';
import { CardZoneManager } from './CardZoneManager';
import { HookManager } from './HookManager';
import { RuleEvaluator } from './RuleEvaluator';
import { StateManager } from './StateManager';
import { TurnController } from './TurnController';

/**
 * 创建战斗引擎实例组
 * P2-3: 确保 Hook 注册与触发在同一实例链路
 * 所有战斗相关操作应使用同一组实例，避免单例混用导致的 Hook 失效问题
 */
export interface BattleEngineInstances {
  stateManager: StateManager;
  hookManager: HookManager;
  cardZoneManager: CardZoneManager;
  ruleEvaluator: RuleEvaluator;
  actionExecutor: ActionExecutor;
  turnController: TurnController; // T-6: 新增
}

export function createBattleEngine(rngSeed?: number): BattleEngineInstances {
  const stateManager = new StateManager();
  // T-1: 必须先创建 RuleEvaluator，再注入给 HookManager
  const ruleEvaluator = new RuleEvaluator(rngSeed);
  const hookManager = new HookManager(ruleEvaluator);
  const cardZoneManager = new CardZoneManager();
  // T-5: 参数顺序修正 (ruleEvaluator, stateManager, hookManager, cardZoneManager)
  const actionExecutor = new ActionExecutor(ruleEvaluator, stateManager, hookManager, cardZoneManager);
  // T-6: 创建 TurnController
  const turnController = new TurnController(stateManager, hookManager, cardZoneManager, actionExecutor, ruleEvaluator);

  // T-2: RNG 注入必须同时注入到 CardZoneManager 和 RuleEvaluator
  if (rngSeed !== undefined) {
    // 使用 Mulberry32 算法创建可复现的 PRNG
    let seed = rngSeed;
    const seededRng = () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    cardZoneManager.setRng(seededRng);
    ruleEvaluator.setRng(seededRng); // T-2: 同时注入 RuleEvaluator
    console.log(`🎲 [createBattleEngine] 注入 RNG (seed=${rngSeed})`);
  } else {
    // T-2: 无 seed 时使用 Math.random
    const rngFn = () => Math.random();
    cardZoneManager.setRng(rngFn);
    ruleEvaluator.setRng(rngFn); // T-2: 同时注入 RuleEvaluator
    console.log('🎲 [createBattleEngine] 注入 RNG (Math.random)');
  }

  console.log('🎮 [createBattleEngine] 创建战斗引擎实例组');
  return {
    stateManager,
    hookManager,
    cardZoneManager,
    ruleEvaluator,
    actionExecutor,
    turnController,
  };
}
