import { computed, reactive, type ComputedRef } from 'vue';
import type { ActionResult } from '../../战斗/引擎-NG';
import type { IdolStats, ProduceState, WeekActionType } from '../类型/ProduceTypes';
import type { FinalEvaluationResult, JudgeRateConfig } from './ExamScoreCalculator';
import type { TurnAttribute } from './ExamTurnGenerator';
import type { BattleCompleteData, LessonStartResult } from './LessonBattleAdapter';
import {
  ProduceHostCore,
  createInitialBattleState,
  createInitialProduceState,
  type BattleState,
  type ProduceHostCallbacks,
  type ProduceHostConfig,
} from './ProduceHostCore';
import { getStartingDeck, resetDeckCardIdCounter, type DeckSkillCard } from './StartingDeckService';

// ==================== 类型定义 ====================

/** useProduceHost 配置（sessionId 可选，不传则自动生成） */
export type UseProduceHostConfig = Omit<ProduceHostConfig, 'sessionId'> & { sessionId?: string };

/** useProduceHost 返回的状态对象 */
export interface ProduceHostState {
  produceState: ProduceState;
  battleState: BattleState;
  deck: DeckSkillCard[];
  isInBattle: ComputedRef<boolean>;
  currentWeek: ComputedRef<number>;
  stats: ComputedRef<IdolStats>;
}

/** useProduceHost 返回的动作对象 */
export interface ProduceHostActions {
  startLesson: (stat: 'vocal' | 'dance' | 'visual') => LessonStartResult;
  completeLessonBattle: (battleComplete: BattleCompleteData) => void;
  startExam: (examType: WeekActionType) => void;
  completeExamBattle: (battleComplete: BattleCompleteData) => void;
  addExtraTurn: () => void;
  advanceWeek: () => void;
  calculateFinalResult: (examScore: number, rank: number) => FinalEvaluationResult;
  getScoreBonuses: (judgeRates?: JudgeRateConfig) => ReturnType<ProduceHostCore['getScoreBonuses']>;
  getCurrentTurnAttribute: () => TurnAttribute | null;
  rest: () => void;
  // T4b: 战斗动作
  playCard: (cardId: string) => ActionResult;
  endTurn: () => void;
  skipTurn: () => void;
  // Step 3: 抽卡结果
  addGachaCard: (gachaItem: any) => void;
  addDrink: (drinkItem: any) => void;
}

// ==================== 工具函数 ====================

/**
 * 生成 sessionId
 */
function createSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `sess_${crypto.randomUUID()}`;
  }
  return `sess_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

// ==================== Composable ====================

/**
 * useProduceHost - 培育主机 Composable
 *
 * 包装 ProduceHostCore，提供 Vue 响应式状态和动作
 *
 * @example
 * ```ts
 * const { state, actions, sessionId } = useProduceHost({
 *   scenarioId: 'HAJIME',
 *   characterId: 'mano',
 *   characterName: '櫻木真乃',
 *   // ...
 * });
 *
 * // 读取状态
 * console.log(state.produceState.currentWeek);
 * console.log(state.isInBattle.value);
 *
 * // 调用动作
 * actions.startLesson('vocal');
 * ```
 */
export function useProduceHost(
  config: UseProduceHostConfig,
  callbacks: ProduceHostCallbacks = {},
): {
  sessionId: string;
  state: Readonly<ProduceHostState>;
  actions: ProduceHostActions;
  /** 仅用于调试 */
  _core: ProduceHostCore;
} {
  // T3: 生成或使用传入的 sessionId
  const sessionId = config.sessionId ?? createSessionId();

  // T3: 清理旧会话计数器（如果复用 sessionId）
  if (config.sessionId) {
    resetDeckCardIdCounter(config.sessionId);
  }

  // 创建初始 ProduceState（使用 reactive 包装）
  const produceState = reactive(
    createInitialProduceState({
      ...config,
      sessionId,
    } as ProduceHostConfig),
  );

  // 确定 primaryStat（用于 BattleState 初始化）
  const primaryStat = getPrimaryStatFromAttributeType(config.attributeType, config.initialStats);

  // 创建初始 BattleState（使用 reactive 包装）
  const battleState = reactive(createInitialBattleState(primaryStat));

  // T3: 调用 getStartingDeck 获取卡组
  const { deck: initialDeck, aiCardMissing } = getStartingDeck({
    attributeType: config.attributeType,
    recommendedStyle: config.recommendedStyle,
    pCardFullName: config.pCardFullName,
    sessionId,
  });
  const deck = reactive(initialDeck);

  // Step 5: 设置 AI 专属卡缺失标志
  produceState.aiCardMissing = aiCardMissing;

  // 创建 ProduceHostCore 实例（注入 ctx）
  const core = new ProduceHostCore({ ...config } as ProduceHostConfig, callbacks, {
    produceState,
    battleState,
    deck,
    sessionId,
  });

  // 计算属性
  const isInBattle = computed(() => core.isInBattle);
  const currentWeek = computed(() => core.currentWeek);
  const stats = computed(() => core.stats);

  // 状态对象（readonly 包装防止外部修改）
  const state: ProduceHostState = {
    produceState,
    battleState,
    deck,
    isInBattle,
    currentWeek,
    stats,
  };

  // T3: 动作对象（所有方法 .bind(core)）
  const actions: ProduceHostActions = {
    startLesson: core.startLesson.bind(core),
    completeLessonBattle: core.completeLessonBattle.bind(core),
    startExam: core.startExam.bind(core),
    completeExamBattle: core.completeExamBattle.bind(core),
    addExtraTurn: core.addExtraTurn.bind(core),
    advanceWeek: core.advanceWeek.bind(core),
    calculateFinalResult: core.calculateFinalResult.bind(core),
    getScoreBonuses: core.getScoreBonuses.bind(core),
    getCurrentTurnAttribute: core.getCurrentTurnAttribute.bind(core),
    rest: core.rest.bind(core),
    playCard: core.playCard.bind(core),
    endTurn: core.endTurn.bind(core),
    skipTurn: core.skipTurn.bind(core),
    // Step 3: 抽卡结果
    addGachaCard: core.addGachaCard.bind(core),
    addDrink: core.addDrink.bind(core),
  };

  console.log('[useProduceHost] 初始化完成', {
    sessionId,
    characterName: config.characterName,
    deckSize: deck.length,
  });

  // T4: Vue readonly() 深度冻结导致下游类型不兼容，改用类型断言
  // 实际防止外部修改依靠文档约定，core 内部可以正常修改
  return {
    sessionId,
    state: state as Readonly<ProduceHostState>,
    actions,
    _core: core, // 仅用于调试
  };
}

// ==================== 辅助函数 ====================

/**
 * 根据卡牌属性类型确定主属性
 */
function getPrimaryStatFromAttributeType(
  attributeType: ProduceHostConfig['attributeType'],
  initialStats: IdolStats,
): 'vocal' | 'dance' | 'visual' {
  switch (attributeType) {
    case '感性':
      return 'visual';
    case '理性':
      return 'dance';
    case '非凡': {
      if (initialStats.vocal >= initialStats.dance && initialStats.vocal >= initialStats.visual) return 'vocal';
      if (initialStats.dance >= initialStats.visual) return 'dance';
      return 'visual';
    }
  }
}

// ==================== 导出 ====================

export default useProduceHost;
