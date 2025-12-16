/**
 * 卡牌战斗系统 - 类型定义导出
 *
 * 统一导出所有类型定义
 */

// 战斗状态相关
export type {
  AnomalyState,
  BattleAttributes,
  BattleConfig,
  BattleHistoryEntry,
  BattleMode,
  BattleResult,
  BattleResultStats,
  BattleRewards,
  BattleSnapshot,
  BattleState,
  ExamCriteria,
  IdolStats,
  PDrink,
  PItem,
  PlanType,
  ScoreSystem,
  SupportEffect,
  TurnState,
} from './battle-state';

// Buff相关
export type {
  Buff,
  BuffCategory,
  BuffChangeEvent,
  BuffEffect,
  BuffEffectContext,
  BuffManagerConfig,
  BuffStack,
  BuffTrigger,
  BuffType,
} from './buff';

// 效果相关
export type {
  AddBuffMetadata,
  ChainEffectMetadata,
  ConditionalEffectMetadata,
  EffectCondition,
  EffectConditionType,
  EffectExecutionResult,
  EffectTarget,
  EffectType,
  ScoreMultiplierMetadata,
  SkillCardEffect,
} from './effect';

// 技能卡相关
export type {
  CardAttribute,
  CardBuilder,
  CardCostType,
  CardFilter,
  CardMoveEvent,
  CardRarity,
  CardStats,
  CardType,
  CardUsageResult,
  CardZone,
  Deck,
  Hand,
  SkillCard,
} from './skill-card';
