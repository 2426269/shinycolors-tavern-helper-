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
