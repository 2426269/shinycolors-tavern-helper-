/**
 * 战斗系统统一导出
 */

// 新战斗系统类型
export * from './类型';

// 新战斗引擎
export * from './引擎';

// Demo卡牌数据
export * from './数据/DemoCards';

// Demo界面
export { default as BattleDemo } from './界面/BattleDemo.vue';

// ==================== 旧版兼容导出 ====================
// 注意：不再导出旧的 技能卡类型 以避免与新类型冲突

// P饮料相关（无冲突）
export * from './数据/P饮料数据库';
export * from './服务/P饮料服务';
export * from './类型/P饮料类型';
