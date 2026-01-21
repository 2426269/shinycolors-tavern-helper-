/**
 * 世界书管理模块统一导出
 */

// 核心服务
export {
  AIGenerationAssistant,
  batchGenerateSkillCards,
  generateSkillCard,
  generateSkillCardRepair,
  getAIAssistant,
} from './AI生成助手';
export { WorldbookService } from './世界书服务';

// 子模块
export { ChainOfThoughtManager, ChainOfThoughtMode } from './思维链区';
export { PromptManager, PromptMode } from './提示词区';
export { ExampleCardSelector } from './示例卡抽取区';

// 游戏机制数据库
export {
  ALL_EFFECTS,
  EFFECT_CATEGORIES,
  IMPORTANT_RULES,
  PRODUCE_PLAN_MECHANICS,
  getAllProducePlanMechanicsMarkdown,
  getEffectCategoriesMarkdown,
  getEffectsByPlanMarkdown,
  getFullMechanicExplanation,
  getImportantRulesMarkdown,
  getProducePlanMechanicMarkdown,
} from './游戏机制数据库';

// 类型导出
export type { GenerationResult, SkillCardGenerationOptions } from './AI生成助手';
export type { ExampleCardConfig, PromptVariables } from './世界书服务';
export type { EffectData, ProducePlanMechanic } from './游戏机制数据库';
