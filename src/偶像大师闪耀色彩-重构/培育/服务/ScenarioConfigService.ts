/**
 * 剧本配置服务 (ScenarioConfigService)
 * 定义初星和NIA各难度的剧本配置
 */

import type { ExamConfig, ScenarioConfig, ScenarioId, SpecialRule, WeekActionConfig } from '../类型/ProduceTypes';

// ==================== 初星 Regular (W.I.N.G.) ====================

const HATSU_REGULAR_SCHEDULE: WeekActionConfig[] = [
  // Phase 1: 1-6周 育成
  { week: 1, primaryAction: 'LESSON', statGain: 100 },
  { week: 2, primaryAction: 'LESSON', statGain: 100 },
  { week: 3, primaryAction: 'LESSON', statGain: 100, alternatives: ['OUTING', 'REST'] },
  { week: 4, primaryAction: 'LESSON', statGain: 100, alternatives: ['OUTING', 'REST'] },
  { week: 5, primaryAction: 'LESSON', statGain: 100, alternatives: ['OUTING', 'REST'] },
  { week: 6, primaryAction: 'LESSON', statGain: 100, alternatives: ['OUTING', 'REST'] },
  // 7周: 追い込みレッスン
  { week: 7, primaryAction: 'LESSON', statGain: 150, isFixed: true },
  // 8周: 中間試験
  { week: 8, primaryAction: 'EXAM_MIDTERM', isFixed: true },
  // Phase 2: 9-14周 育成
  { week: 9, primaryAction: 'LESSON', statGain: 120, alternatives: ['OUTING', 'REST'] },
  { week: 10, primaryAction: 'LESSON', statGain: 120, alternatives: ['OUTING', 'REST'] },
  { week: 11, primaryAction: 'LESSON', statGain: 120, alternatives: ['OUTING', 'REST'] },
  { week: 12, primaryAction: 'LESSON', statGain: 120, alternatives: ['OUTING', 'REST'] },
  { week: 13, primaryAction: 'LESSON', statGain: 120, alternatives: ['OUTING', 'REST'] },
  { week: 14, primaryAction: 'LESSON', statGain: 120, alternatives: ['OUTING', 'REST'] },
  // 15周: 追い込みレッスン -> 最終試験
  { week: 15, primaryAction: 'EXAM_FINAL', isFixed: true },
];

const HATSU_REGULAR_EXAMS: ExamConfig[] = [
  {
    week: 8,
    type: 'MIDTERM',
    thresholds: {
      balanced: { high: [200, 165, 135], mid: [180, 150, 120], low: [160, 135, 105] },
      singlePole: { high: [200, 165, 135], mid: [180, 150, 120], low: [160, 135, 105] },
    },
    aiMaxScore: 500,
    targetScore: 1000,
    statRewards: { main: 30, sub: 25, third: 20 },
  },
  {
    week: 15,
    type: 'FINAL',
    thresholds: {
      balanced: { high: [400, 330, 270], mid: [360, 300, 240], low: [320, 270, 210] },
      singlePole: { high: [400, 330, 270], mid: [360, 300, 240], low: [320, 270, 210] },
    },
    aiMaxScore: 2000,
    targetScore: 5000,
    statRewards: { main: 50, sub: 40, third: 30 },
  },
];

export const HATSU_REGULAR: ScenarioConfig = {
  id: 'wing',
  name: 'W.I.N.G.',
  gakumasName: 'Wonder Idol Nova Grandprix',
  totalWeeks: 15,
  statCap: 1000,
  schedule: HATSU_REGULAR_SCHEDULE,
  exams: HATSU_REGULAR_EXAMS,
  specialRules: [],
};

// ==================== NIA Pro (S.T.E.P.) ====================

const NIA_PRO_SCHEDULE: WeekActionConfig[] = [
  // Phase 1: 1-8周
  { week: 1, primaryAction: 'LESSON', statGain: 100 },
  { week: 2, primaryAction: 'BUSINESS', statGain: 60 },
  { week: 3, primaryAction: 'OUTING', alternatives: ['SUPPORT'] },
  { week: 4, primaryAction: 'LESSON', statGain: 100 },
  { week: 5, primaryAction: 'BUSINESS', statGain: 60 },
  { week: 6, primaryAction: 'OUTING', alternatives: ['SHOP'] },
  { week: 7, primaryAction: 'BUSINESS', statGain: 60 },
  { week: 8, primaryAction: 'SPECIAL_GUIDANCE' },
  // 9周: 一镜
  { week: 9, primaryAction: 'AUDITION_1', isFixed: true },
  // Phase 2: 10-17周
  { week: 10, primaryAction: 'OUTING', alternatives: ['SUPPORT'] },
  { week: 11, primaryAction: 'LESSON', statGain: 120 },
  { week: 12, primaryAction: 'BUSINESS', statGain: 80 },
  { week: 13, primaryAction: 'OUTING', alternatives: ['SHOP', 'SUPPORT'] },
  { week: 14, primaryAction: 'LESSON', statGain: 120 },
  { week: 15, primaryAction: 'BUSINESS', statGain: 80 },
  { week: 16, primaryAction: 'LESSON', statGain: 120 },
  { week: 17, primaryAction: 'SPECIAL_GUIDANCE' },
  // 18周: 二镜
  { week: 18, primaryAction: 'AUDITION_2', isFixed: true },
  // Phase 3: 19-26周
  { week: 19, primaryAction: 'OUTING', alternatives: ['SUPPORT'] },
  { week: 20, primaryAction: 'LESSON', statGain: 150 },
  { week: 21, primaryAction: 'BUSINESS', statGain: 100 },
  { week: 22, primaryAction: 'SHOP', alternatives: ['SUPPORT', 'SPECIAL_GUIDANCE'] },
  { week: 23, primaryAction: 'LESSON', statGain: 150 },
  { week: 24, primaryAction: 'BUSINESS', statGain: 100 },
  { week: 25, primaryAction: 'LESSON', statGain: 150 },
  { week: 26, primaryAction: 'OUTING', alternatives: ['SHOP', 'SPECIAL_GUIDANCE'] },
  // 27周: 三镜
  { week: 27, primaryAction: 'AUDITION_3', isFixed: true },
];

const NIA_PRO_EXAMS: ExamConfig[] = [
  {
    week: 9,
    type: 'AUDITION_1',
    thresholds: {
      balanced: { high: [263, 217, 178], mid: [241, 199, 163], low: [220, 181, 148] },
      singlePole: { high: [331, 199, 132], mid: [304, 182, 121], low: [276, 166, 110] },
    },
    aiMaxScore: 2800,
    fanThreshold: 10110,
    targetScore: 5355,
    statRewards: { main: 92, sub: 76, third: 62 },
  },
  {
    week: 18,
    type: 'AUDITION_2',
    thresholds: {
      balanced: { high: [586, 483, 396], mid: [553, 457, 374], low: [521, 430, 352] },
      singlePole: { high: [737, 442, 295], mid: [696, 417, 278], low: [655, 393, 262] },
    },
    aiMaxScore: 25750,
    fanThreshold: 28594,
    targetScore: 64273,
    statRewards: { main: 119, sub: 98, third: 80 },
  },
  {
    week: 27,
    type: 'AUDITION_3',
    thresholds: {
      balanced: { high: [1104, 911, 745], mid: [930, 767, 628], low: [872, 719, 588] },
      singlePole: { high: [1388, 833, 555], mid: [1169, 701, 467], low: [1096, 657, 438] },
    },
    aiMaxScore: 84800,
    fanThreshold: 67039,
    targetScore: 199500,
    statRewards: { main: 172, sub: 142, third: 116 },
  },
];

const NIA_PRO_RULES: SpecialRule[] = [{ type: 'NO_REST_BEFORE_WEEK', value: 4 }];

export const NIA_PRO: ScenarioConfig = {
  id: 'step',
  name: 'S.T.E.P.',
  gakumasName: 'Shining To Evolving Performers',
  totalWeeks: 27,
  statCap: 2000,
  schedule: NIA_PRO_SCHEDULE,
  exams: NIA_PRO_EXAMS,
  specialRules: NIA_PRO_RULES,
  maxRestCount: 4,
  maxOutingCount: 6,
  maxSpecialGuidance: 4,
};

// ==================== 剧本注册表 ====================

export const SCENARIO_REGISTRY: Record<ScenarioId, ScenarioConfig> = {
  // 育成培育
  wing: HATSU_REGULAR,
  grad: HATSU_REGULAR, // TODO: 实现 G.R.A.D. 配置
  landing_point: HATSU_REGULAR, // TODO: 实现 Landing Point 配置
  kanshasai: HATSU_REGULAR, // TODO: 实现 ファン感謝祭 配置
  // 特化培育
  step: NIA_PRO,
  say_halo: NIA_PRO, // TODO: 实现 say"Halo" 配置
};

// ==================== 服务函数 ====================

/**
 * 获取剧本配置
 */
export function getScenarioConfig(id: ScenarioId): ScenarioConfig {
  return SCENARIO_REGISTRY[id];
}

/**
 * 获取当前周的行动配置
 */
export function getWeekAction(config: ScenarioConfig, week: number): WeekActionConfig | undefined {
  return config.schedule.find(s => s.week === week);
}

/**
 * 获取当前周可用的行动列表
 */
export function getAvailableActions(config: ScenarioConfig, week: number): string[] {
  const weekConfig = getWeekAction(config, week);
  if (!weekConfig) return [];

  const actions = [weekConfig.primaryAction];
  if (weekConfig.alternatives) {
    actions.push(...weekConfig.alternatives);
  }
  return actions;
}

/**
 * 检查是否可以休息
 */
export function canRest(config: ScenarioConfig, week: number, currentRestCount: number): boolean {
  // 检查特殊规则
  const noRestRule = config.specialRules.find(r => r.type === 'NO_REST_BEFORE_WEEK');
  if (noRestRule && week <= (noRestRule.value as number)) {
    return false;
  }

  // 检查休息次数上限
  if (config.maxRestCount !== undefined && currentRestCount >= config.maxRestCount) {
    return false;
  }

  return true;
}
