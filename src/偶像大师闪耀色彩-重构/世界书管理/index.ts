/**
 * 世界书管理模块统一导出
 */

// 核心服务
export { WorldbookService } from './世界书服务';
export { AIGenerationAssistant, getAIAssistant, generateSkillCard, batchGenerateSkillCards } from './AI生成助手';

// 子模块
export { ChainOfThoughtManager, ChainOfThoughtMode } from './思维链区';
export { PromptManager, PromptMode } from './提示词区';
export { ExampleCardSelector } from './示例卡抽取区';

// 游戏机制数据库
export {
  PRODUCE_PLAN_MECHANICS,
  ALL_EFFECTS,
  EFFECT_CATEGORIES,
  IMPORTANT_RULES,
  getProducePlanMechanicMarkdown,
  getAllProducePlanMechanicsMarkdown,
  getEffectsByPlanMarkdown,
  getEffectCategoriesMarkdown,
  getImportantRulesMarkdown,
  getFullMechanicExplanation,
} from './游戏机制数据库';

// 类型导出
export type { PromptVariables, ExampleCardConfig } from './世界书服务';
export type { SkillCardGenerationOptions, GenerationResult } from './AI生成助手';
export type { ProducePlanMechanic, EffectData } from './游戏机制数据库';
