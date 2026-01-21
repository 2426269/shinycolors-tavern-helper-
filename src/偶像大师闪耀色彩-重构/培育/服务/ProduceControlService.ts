/**
 * 培育控制服务 (ProduceControlService)
 * 管理培育流程的状态机
 */

import type { AttributeType } from '../../类型/卡牌属性类型';
import type {
  ActionRecord,
  IdolStats,
  LessonBonus,
  ProduceState,
  ScenarioId,
  WeekActionType,
} from '../类型/ProduceTypes';
import { canRest, getScenarioConfig, getWeekAction } from './ScenarioConfigService';

// ==================== 初始状态 ====================

/**
 * 创建初始培育状态
 */
export function createInitialProduceState(
  scenarioId: ScenarioId,
  idolId: string,
  idolName: string,
  attributeType: AttributeType,
  supportFormationIds: string[],
  memoryFormationIds: string[],
): ProduceState {
  return {
    scenarioId,
    currentWeek: 1,
    currentPhase: 'WEEK_ACTION',

    idolId,
    idolName,
    attributeType,
    stats: { vocal: 0, dance: 0, visual: 0 },
    lessonBonus: generateLessonBonus(attributeType),

    stamina: 100,
    maxStamina: 100,
    pPoints: 50,
    fans: 0,
    genki: 0,

    deckCardIds: [],
    drinkIds: [],
    drinks: [null, null, null],

    supportFormationIds,
    memoryFormationIds,

    actionHistory: [],
    examResults: [],

    restCount: 0,
    outingCount: 0,
    specialGuidanceCount: 0,

    aiCardMissing: false,
  };
}

// ==================== 天赋加成数据 ====================

import lessonBonusData from '../数据/character-lesson-bonus.json';

interface LessonBonusEntry {
  enzaId: string;
  characterId: string;
  lessonBonus: {
    vocal: number;
    dance: number;
    visual: number;
  };
}

const LESSON_BONUS_DATA = lessonBonusData as Record<string, LessonBonusEntry>;

/**
 * 根据角色卡名称获取训练加成
 * 使用预生成的 character-lesson-bonus.json 数据
 * @param cardName 角色卡名称 (如 "【ナチュラルモード】櫻木真乃")
 */
export function getLessonBonusFromData(cardName: string): LessonBonus {
  const entry = LESSON_BONUS_DATA[cardName];
  if (entry) {
    // JSON 中存储的是百分比数值 (如 24.5)，需要转换为小数 (0.245)
    return {
      vocal: entry.lessonBonus.vocal / 100,
      dance: entry.lessonBonus.dance / 100,
      visual: entry.lessonBonus.visual / 100,
    };
  }

  // 如果找不到，使用默认值
  console.warn(`[getLessonBonusFromData] Card not found: ${cardName}, using default`);
  return { vocal: 0.15, dance: 0.15, visual: 0.15 };
}

/**
 * 根据属性类型生成训练加成 (备用/向后兼容)
 * 主属性 > 副属性 > 第三属性
 */
function generateLessonBonus(attributeType: AttributeType): LessonBonus {
  const bonusMap: Record<AttributeType, LessonBonus> = {
    感性: { vocal: 0.25, dance: 0.15, visual: 0.1 },
    理性: { vocal: 0.1, dance: 0.25, visual: 0.15 },
    非凡: { vocal: 0.15, dance: 0.1, visual: 0.25 },
  };

  const base = bonusMap[attributeType];
  const randomize = (v: number) => v + (Math.random() - 0.5) * 0.1;

  return {
    vocal: Math.max(0.05, Math.min(0.35, randomize(base.vocal))),
    dance: Math.max(0.05, Math.min(0.35, randomize(base.dance))),
    visual: Math.max(0.05, Math.min(0.35, randomize(base.visual))),
  };
}

// ==================== 状态机控制 ====================

/**
 * 推进到下一周
 */
export function advanceWeek(state: ProduceState): ProduceState {
  const config = getScenarioConfig(state.scenarioId);

  if (state.currentWeek >= config.totalWeeks) {
    // 培育结束
    return { ...state, currentPhase: 'RESULT' };
  }

  return {
    ...state,
    currentWeek: state.currentWeek + 1,
    currentPhase: 'WEEK_ACTION',
  };
}

/**
 * 执行周行动
 */
export function executeWeekAction(state: ProduceState, action: WeekActionType): ProduceState {
  const config = getScenarioConfig(state.scenarioId);
  const weekConfig = getWeekAction(config, state.currentWeek);

  // 记录行动
  const record: ActionRecord = {
    week: state.currentWeek,
    action,
    result: {},
  };

  const newState = { ...state };

  switch (action) {
    case 'LESSON':
    case 'SP_LESSON': {
      // 训练: 进入战斗阶段
      newState.currentPhase = 'LESSON_BATTLE';
      // 消耗体力
      const staminaCost = action === 'SP_LESSON' ? 8 : 6;
      newState.stamina = Math.max(0, newState.stamina - staminaCost);
      record.result!.staminaChange = -staminaCost;
      break;
    }

    case 'BUSINESS': {
      // 营业: 获得属性和粉丝
      const statGain = weekConfig?.statGain || 60;
      const mainStat = getMainStatKey(state.attributeType);
      newState.stats = {
        ...newState.stats,
        [mainStat]: newState.stats[mainStat] + statGain,
      };
      newState.fans += 1000; // 基础粉丝数
      record.result!.statGain = { [mainStat]: statGain };
      record.result!.fansGained = 1000;
      break;
    }

    case 'REST': {
      // 休息
      if (!canRest(config, state.currentWeek, state.restCount)) {
        throw new Error('Cannot rest at this time');
      }
      newState.stamina = Math.min(newState.maxStamina, newState.stamina + 30);
      newState.restCount++;
      record.result!.staminaChange = 30;
      break;
    }

    case 'OUTING': {
      // 外出
      newState.stamina = Math.min(newState.maxStamina, newState.stamina + 20);
      newState.pPoints -= 20;
      newState.outingCount++;
      record.result!.staminaChange = 20;
      record.result!.pPointsGained = -20;
      break;
    }

    case 'SPECIAL_GUIDANCE': {
      // 特别指导
      newState.pPoints -= 30;
      newState.specialGuidanceCount++;
      record.result!.pPointsGained = -30;
      break;
    }

    case 'EXAM_MIDTERM':
    case 'EXAM_FINAL':
    case 'AUDITION_1':
    case 'AUDITION_2':
    case 'AUDITION_3': {
      // 考试/试镜: 进入战斗阶段
      newState.currentPhase = 'EXAM_BATTLE';
      break;
    }

    default:
      break;
  }

  newState.actionHistory = [...state.actionHistory, record];

  return newState;
}

/**
 * 应用训练结果
 */
export function applyLessonResult(
  state: ProduceState,
  statGains: Partial<IdolStats>,
  cardsGained?: string[],
): ProduceState {
  const config = getScenarioConfig(state.scenarioId);

  // 应用训练加成
  const applyBonus = (stat: keyof IdolStats, gain: number) => {
    const bonus = state.lessonBonus[stat];
    const finalGain = Math.floor(gain * (1 + bonus));
    return Math.min(config.statCap, state.stats[stat] + finalGain);
  };

  const newStats: IdolStats = {
    vocal: statGains.vocal ? applyBonus('vocal', statGains.vocal) : state.stats.vocal,
    dance: statGains.dance ? applyBonus('dance', statGains.dance) : state.stats.dance,
    visual: statGains.visual ? applyBonus('visual', statGains.visual) : state.stats.visual,
  };

  return {
    ...state,
    stats: newStats,
    deckCardIds: cardsGained ? [...state.deckCardIds, ...cardsGained] : state.deckCardIds,
    currentPhase: 'WEEK_ACTION',
  };
}

/**
 * 获取当前周可用行动
 */
export function getAvailableActions(state: ProduceState): WeekActionType[] {
  const config = getScenarioConfig(state.scenarioId);
  const weekConfig = getWeekAction(config, state.currentWeek);

  if (!weekConfig) return [];

  // 固定行动 (考试等) 只能执行该行动
  if (weekConfig.isFixed) {
    return [weekConfig.primaryAction];
  }

  const actions: WeekActionType[] = [weekConfig.primaryAction];

  if (weekConfig.alternatives) {
    actions.push(...weekConfig.alternatives);
  }

  // 检查是否可以休息
  if (canRest(config, state.currentWeek, state.restCount) && !actions.includes('REST')) {
    actions.push('REST');
  }

  return actions;
}

// ==================== 辅助函数 ====================

function getMainStatKey(attributeType: AttributeType): keyof IdolStats {
  switch (attributeType) {
    case '感性':
      return 'vocal';
    case '理性':
      return 'dance';
    case '非凡':
      return 'visual';
  }
}

/**
 * 检查培育是否结束
 */
export function isProduceComplete(state: ProduceState): boolean {
  return state.currentPhase === 'RESULT';
}

/**
 * 获取培育进度百分比
 */
export function getProduceProgress(state: ProduceState): number {
  const config = getScenarioConfig(state.scenarioId);
  return Math.floor((state.currentWeek / config.totalWeeks) * 100);
}
