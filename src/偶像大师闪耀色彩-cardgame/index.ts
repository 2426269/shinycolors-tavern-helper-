/**
 * 偶像大师闪耀色彩 - 卡牌战斗系统
 *
 * 主导出文件
 */

// ========== 类型定义 ==========
export * from './types';

// ========== 核心管理器 ==========
export {
  AttributeManager,
  ResourceManager,
  BuffManager,
  SkillCardExecutor,
  BattleController,
} from './core';

// ========== 预设库 ==========
export { BuffPresets, createBuff } from './presets/buff-presets';

// ========== 数据解析 ==========
export {
  SkillCardParser,
  getAllSkillCards,
  getAllEnhancedSkillCards,
  createStarterDeck,
  createAdvancedDeck,
} from './data/skill-card-parser';

// ========== 工具 ==========
export { EventBus, GameEvents } from './utils/event-bus';
