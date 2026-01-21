/**
 * 培育主机核心 (ProduceHostCore.ts)
 * T2: 纯 TypeScript 类，不依赖 Vue
 *
 * 职责:
 * - 管理培育状态流转
 * - 处理课程/考试战斗流程
 * - 协调事件与服务层
 *
 * 注意: 这是闪耀色彩 (Shiny Colors) 同人作品，使用学マス游戏系统
 */

// T2: 不再导入 Vue，改为接受外部注入的状态对象
import {
  BattleEventType,
  buildBattleContext,
  createBattleEngine,
  type ActionResult,
  type BattleEngineInstances,
  type BattleStateNG,
  type SkillCardV2,
} from '../../战斗/引擎-NG';
import { convertEffectEntriesToLogicChain } from '../../战斗/引擎-NG/effectTextParser';
import { predictScore } from '../../战斗/引擎-NG/ScorePredictor';
import type { AttributeType, RecommendedStyle } from '../../类型/卡牌属性类型';
import { getExamBattleConfig, getLessonBattleConfig } from '../数据/BattleConfigs';
import type { BuffInstance, IdolStats, ProduceState, ScenarioId, WeekActionType } from '../类型/ProduceTypes';
import {
  calculateAllScoreBonuses,
  calculateFinalEvaluation,
  type FinalEvaluationResult,
  type JudgeRateConfig,
} from './ExamScoreCalculator';
import { createExtraTurn, quickGenerateExamSequence, type TurnAttribute } from './ExamTurnGenerator';
import {
  handleExamBattleComplete,
  handleLessonBattleComplete,
  startLessonBattle,
  type BattleCompleteData,
  type LessonStartResult,
} from './LessonBattleAdapter';
import { getScenarioConfig } from './ScenarioConfigService';
import type { DeckSkillCard } from './StartingDeckService';

// ==================== 类型定义 ====================

/** 战斗模式 */
export type BattleMode = 'idle' | 'lesson' | 'exam';

/** 战斗状态 (T3-fix: 使用 readonly 数组支持深度只读) */
export interface BattleState {
  mode: BattleMode;
  isSP: boolean;
  primaryStat: 'vocal' | 'dance' | 'visual';
  currentTurn: number;
  maxTurns: number;
  turnSequence: readonly TurnAttribute[];
  currentScore: number;
  targetScore: number;
  // T4b: 战斗引擎状态同步 (UI 展示用)
  hand: readonly DeckSkillCard[];
  drawPile: readonly DeckSkillCard[];
  discardPile: readonly DeckSkillCard[];
  excludePile: readonly DeckSkillCard[];
  buffs: readonly BuffData[];
  stamina: number; // 战斗体力
  genki: number; // 战斗元气
  predictedScores: Record<string, number>; // T7: 预计算得分
  // 子任务1: 战斗结束判定由 Core 计算
  isBattleEnded: boolean;
  battleEndReason?: 'turn_limit' | 'perfect' | 'target';
  perfectScore: number; // 由 Core 写入，UI 只读
  // 子任务2: 动画事件桥接，由 Core 写入，UI 只读
  // 使用 any[] 以兼容不同事件类型
  _initialEvents?: any[];
  _pendingEvents?: any[];
}

/** 战斗 Buff 数据 (UI 展示用) */
export interface BuffData {
  id: string;
  name: string;
  iconFile: string;
  value: number;
  duration?: number;
}

/** ProduceHostCore 配置 - 使用闪耀色彩卡牌属性 */
export interface ProduceHostConfig {
  scenarioId: ScenarioId;
  // 角色信息
  characterId: string; // 角色ID (如 'mano', 'hiori')
  characterName: string; // 角色名 (如 '櫻木真乃')
  pCardFullName: string; // P卡完整名称 (如 '【ナチュラルモード】櫻木真乃')
  // 卡牌属性 (来自 card-attributes.json)
  attributeType: AttributeType; // 感性/理性/非凡
  recommendedStyle: RecommendedStyle; // 好调/集中/好印象/干劲/坚决/全力
  stamina: number; // 初始体力
  initialStats: IdolStats; // 初始三维
}

/** UI 回调接口 */
export interface ProduceHostCallbacks {
  onStateChange?: (state: ProduceState) => void;
  onBattleStart?: (battleState: BattleState) => void;
  onBattleEnd?: (result: any) => void;
  onWeekAdvance?: (week: number) => void;
  onProduceComplete?: (evaluation: FinalEvaluationResult) => void;
}

/** T2: 上下文对象 - 由外部（useProduceHost）注入 */
export interface ProduceHostContext {
  produceState: ProduceState;
  battleState: BattleState;
  deck: DeckSkillCard[];
  sessionId: string;
}

// ==================== ProduceHostCore 类 ====================

export class ProduceHostCore {
  // 配置
  private readonly config: ProduceHostConfig;
  private readonly callbacks: ProduceHostCallbacks;
  private readonly ctx: ProduceHostContext;
  private readonly primaryStat: 'vocal' | 'dance' | 'visual';

  // T2: 不再持有 Ref，改为通过 ctx 访问
  constructor(config: ProduceHostConfig, callbacks: ProduceHostCallbacks, ctx: ProduceHostContext) {
    this.config = config;
    this.callbacks = callbacks;
    this.ctx = ctx;

    // 根据卡牌属性类型确定主属性
    this.primaryStat = this.getPrimaryStatFromAttributeType(config.attributeType);

    console.log('[ProduceHostCore] 初始化完成', {
      scenarioId: config.scenarioId,
      characterName: config.characterName,
      attributeType: config.attributeType,
      sessionId: ctx.sessionId,
      deckSize: ctx.deck.length,
    });
  }

  // T4b: 战斗引擎实例
  private engine?: BattleEngineInstances;
  private battleStateNG?: BattleStateNG;

  // ==================== 引擎辅助方法 ====================

  /**
   * T4b: 同步引擎状态到 UI
   */
  /**
   * T4b: 同步引擎状态到 UI
   */
  private syncEngineState(): void {
    if (!this.engine || !this.battleStateNG) return;

    const { cardZoneManager, stateManager } = this.engine;

    if (!cardZoneManager || !stateManager) return;

    // 1. 获取卡牌区域
    const handCards = cardZoneManager.getHand();
    const deckCards = cardZoneManager.getDeck();
    const discardCards = cardZoneManager.getDiscard();
    const removedCards = cardZoneManager.getRemoved();

    // 2. 映射回 DeckSkillCard
    // T2: DeckSkillCard.id 与 SkillCardV2.id 一致，直接查找
    const cardMap = new Map<string, DeckSkillCard>();
    this.ctx.deck.forEach(c => cardMap.set(c.id, c));

    // 辅助函数：映射卡牌，如果找不到则尝试转换
    const mapCards = (cards: SkillCardV2[]) =>
      cards
        .map(c => {
          const existing = cardMap.get(c.id);
          if (existing) return existing;

          // 如果是新生成的卡（如 trap_n_1），尝试转换
          // 注意：这里没有 imageUrl，使用默认或空
          return this.convertSkillCardV2ToDeckSkillCard(c);
        })
        .filter(Boolean) as DeckSkillCard[];

    this.ctx.battleState.hand = mapCards(handCards);
    this.ctx.battleState.drawPile = mapCards(deckCards);
    this.ctx.battleState.discardPile = mapCards(discardCards);
    this.ctx.battleState.excludePile = mapCards(removedCards);

    // 3. 同步数值
    this.ctx.battleState.currentScore = this.battleStateNG.score;
    this.ctx.battleState.currentTurn = this.battleStateNG.turn;
    this.ctx.battleState.stamina = this.battleStateNG.stamina;
    this.ctx.battleState.genki = this.battleStateNG.genki;

    // 4. 同步 Buff
    // Buff ID 到图标文件的映射 (内联，避免导入问题)
    const BUFF_ICON_MAP: Record<string, string> = {
      GoodCondition: '好调.png',
      ExcellentCondition: '绝好调.png',
      Concentration: '集中.png',
      GoodImpression: '好印象.png',
      Motivation: '干劲.png',
      StaminaReduction: '消费体力减少.png',
      ConserveState: '温存.png',
      ResoluteState: '强气.png',
      AlloutState: '全力.png',
    };

    this.ctx.battleState.buffs = stateManager.getAllBuffs().map((buff: BuffInstance) => ({
      id: String(buff.id),
      name: buff.name,
      iconFile: BUFF_ICON_MAP[String(buff.id)] || `${buff.id}.png`,
      value: buff.duration > 0 ? buff.duration : buff.stacks,
      duration: buff.duration,
    }));

    // 5. 计算预测得分
    this.ctx.battleState.predictedScores = this.getPredictedScores();

    console.log('[ProduceHostCore] 引擎状态同步完成', {
      hand: this.ctx.battleState.hand.length,
      score: this.ctx.battleState.currentScore,
      turn: this.ctx.battleState.currentTurn,
    });
  }

  /**
   * 将 SkillCardV2 (引擎格式) 转换为 DeckSkillCard (UI 格式)
   * 用于处理战斗中新生成的卡牌 (如 CreateCardAction)
   */
  private convertSkillCardV2ToDeckSkillCard(card: SkillCardV2): DeckSkillCard {
    // 尝试根据 type 映射中文类型
    let typeCN: '主动' | '精神' = '主动';
    if (card.type === 'M') typeCN = '精神';
    if (card.type === 'T') typeCN = '精神'; // 陷阱卡在 UI 上通常显示为精神或特殊，暂映射为精神

    // 构造 effectEntries (如果有)
    // 注意：SkillCardV2 的 display.description 是文本，没有结构化的 effectEntries
    // 这里只能做一个简单的占位，或者如果 engine_data 里有 metadata 可以利用
    const effectEntries = [
      {
        icon: '', // 默认无图标
        effect: card.display.description,
        isConsumption: false,
      },
    ];

    return {
      id: card.id,
      originalId: card.originalId,
      name: card.display.name,
      rarity: card.rarity,
      type: typeCN,
      plan: card.plan,
      cost: String(card.engine_data.cost.genki),
      effectEntries: effectEntries,
      effectEntriesEnhanced: effectEntries, // 暂不区分强化
      isEnhanced: card.isEnhanced ?? false,
      imageUrl: '', // 生成卡没有卡面
      isAIGenerated: false,
      restrictions: {
        uses_per_battle: card.restrictions?.uses_per_battle,
        is_unique: card.restrictions?.is_unique,
      },
      // 保留 engine_data 以便再次转换回 V2 时不丢失逻辑
      engine_data: card.engine_data,
    } as DeckSkillCard;
  }

  /**
   * T7: 获取手牌预测得分
   */
  private getPredictedScores(): Record<string, number> {
    if (!this.engine || !this.battleStateNG) return {};

    const scores: Record<string, number> = {};
    const handCards = this.engine.cardZoneManager.getHand();

    for (const card of handCards) {
      scores[card.id] = predictScore(card, this.battleStateNG, this.engine.stateManager, this.engine.ruleEvaluator);
    }

    return scores;
  }

  /**
   * T4b: 将 DeckSkillCard 转换为 SkillCardV2 (NG 引擎格式)
   */
  private convertToSkillCardV2(card: DeckSkillCard): SkillCardV2 {
    // 1. 优先使用 engine_data
    if (card.engine_data) {
      const typeMap: Record<string, 'A' | 'M'> = { 主动: 'A', 精神: 'M' };
      const planMap: Record<string, 'sense' | 'logic' | 'anomaly'> = {
        sense: 'sense',
        logic: 'logic',
        anomaly: 'anomaly',
        感性: 'sense',
        理性: 'logic',
        非凡: 'anomaly',
        自由: 'sense',
        free: 'sense',
      };

      const plan = card.plan ? planMap[card.plan] || 'sense' : 'sense';

      return {
        id: card.id,
        rarity: (card.rarity as 'N' | 'R' | 'SR' | 'SSR' | 'UR') || 'N',
        type: typeMap[card.type] || 'A',
        plan,
        display: {
          name: card.display?.name || card.name,
          description: card.display?.description || '',
          flavor: card.display?.flavor,
        },
        engine_data:
          card.isEnhanced && card.engine_data.logic_chain_enhanced
            ? { ...card.engine_data, logic_chain: card.engine_data.logic_chain_enhanced }
            : card.engine_data,
        originalId: card.originalId || card.id,
        ...(card.visual_hint && { visual_hint: card.visual_hint }),
        ...(card.restrictions?.is_unique && { restrictions: { is_unique: true } }),
      };
    }

    // 2. 回退：解析 effectEntries
    const effectEntries = card.isEnhanced ? card.effectEntriesEnhanced || card.effectEntries : card.effectEntries;
    const logicChain = convertEffectEntriesToLogicChain(effectEntries);
    const usesLimit = card.restrictions?.uses_per_battle;
    const shouldExhaust = usesLimit === 1;

    // 解析费用
    const parseCost = (costStr: string): number => {
      if (!costStr) return 0;
      const match = costStr.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    return {
      id: card.id,
      rarity: (card.rarity as 'N' | 'R' | 'SR' | 'SSR' | 'UR') || 'N',
      type: 'A',
      plan: 'sense', // 默认
      display: {
        name: card.name,
        description: card.effectEntries?.map(e => e.effect).join('; ') || '',
      },
      engine_data: {
        cost: { genki: parseCost(card.cost) },
        logic_chain: logicChain,
        ...(shouldExhaust && { constraints: { exhaust_on_play: true } }),
      },
      originalId: card.originalId || card.id,
      ...(card.restrictions?.is_unique && { restrictions: { is_unique: true } }),
    };
  }

  // ==================== Getters (替代 computed) ====================

  /** T2: 替代 computed(() => this.battleState.value.mode !== 'idle') */
  get isInBattle(): boolean {
    return this.ctx.battleState.mode !== 'idle';
  }

  /** T2: 替代 computed(() => this.produceState.value.currentWeek) */
  get currentWeek(): number {
    return this.ctx.produceState.currentWeek;
  }

  /** T2: 替代 computed(() => this.produceState.value.stats) */
  get stats(): IdolStats {
    return this.ctx.produceState.stats;
  }

  // ==================== 辅助方法 ====================

  /**
   * 根据卡牌属性类型确定主属性 (用于回合生成)
   * 感性系: Visual 为主 (感性卡通常偏重 Vi)
   * 理性系: Dance 为主 (理性卡通常偏重 Da)
   * 非凡系: 根据初始三维最高属性决定
   */
  private getPrimaryStatFromAttributeType(attributeType: AttributeType): 'vocal' | 'dance' | 'visual' {
    switch (attributeType) {
      case '感性':
        return 'visual';
      case '理性':
        return 'dance';
      case '非凡': {
        // 非凡系根据初始三维最高属性决定
        const stats = this.config.initialStats;
        if (stats.vocal >= stats.dance && stats.vocal >= stats.visual) return 'vocal';
        if (stats.dance >= stats.visual) return 'dance';
        return 'visual';
      }
    }
  }

  // ==================== 课程战斗 ====================

  /**
   * 开始课程
   * @param primaryStat 选择的训练属性
   */
  public startLesson(primaryStat: 'vocal' | 'dance' | 'visual'): LessonStartResult {
    // T2: 直接访问 ctx.produceState 而非 .value
    const result = startLessonBattle(this.ctx.produceState, primaryStat);

    if (!result.requiresBattle) {
      // NIA 自主课程: 直接应用结果
      console.log('[ProduceHostCore] NIA 自主课程，跳过战斗');
      if (result.autoResult) {
        this.applyLessonResult(result.autoResult.statGains);
      }
      return result;
    }

    // 育成培育: 设置战斗状态
    const battleConfig = result.battleInitConfig!;

    // T4b: 初始化战斗引擎
    this.engine = createBattleEngine();

    // 转换卡组
    const skillCards = this.ctx.deck.map(c => this.convertToSkillCardV2(c));

    // 初始化引擎
    this.engine.cardZoneManager.initialize(skillCards);
    this.engine.cardZoneManager.shuffle();

    // 初始化引擎状态
    this.battleStateNG = {
      genki: this.ctx.produceState.stats.visual * 0, // 初始元气 (暂定0)
      maxGenki: 100,
      stamina: this.ctx.produceState.stamina,
      maxStamina: this.ctx.produceState.maxStamina,
      score: 0,
      concentration: 0,
      motivation: 0,
      goodImpression: 0,
      allPower: 0,
      heat: 0,
      tags: [],
      turn: 1,
      maxTurns: battleConfig.maxTurns,
      cardsPlayedThisTurn: 0,
      maxCardsPerTurn: 1,
      extraPlaysThisTurn: 0,
      stateSwitchCount: {},
      stateSwitchCountTotal: 0,
      anomalyState: null,
      cardsPlayedTotal: 0,
    };

    // 抽初始手牌 (Task 3: 使用 ActionExecutor)
    // 1. 执行 DRAW_CARD 动作 (生成 DRAW_CARD 和 CARD_MOVE 事件)
    const drawAction: any = {
      action: 'DRAW_CARD',
      count: 3,
    };
    const ctx = buildBattleContext(
      this.battleStateNG,
      this.engine.stateManager,
      this.engine.cardZoneManager,
      this.engine.ruleEvaluator.random(),
    );
    const drawResult = this.engine.actionExecutor.executeAction(drawAction, this.battleStateNG, ctx);

    // 暂存初始事件
    const initialEvents = [...(drawResult.events || [])];

    // T8: 触发 ON_LESSON_START Hook (用于开局入手等固有能力)
    // 使用 buildBattleContext 构建上下文
    const startContext = buildBattleContext(
      this.battleStateNG,
      this.engine.stateManager,
      this.engine.cardZoneManager,
      this.engine.ruleEvaluator.random(),
    );
    const startActions = this.engine.hookManager.trigger('ON_LESSON_START', startContext);
    if (startActions.length > 0) {
      console.log(`🪝 [ProduceHostCore] 触发 ON_LESSON_START Hook: ${startActions.length} 个动作`);

      // 记录 Hook 触发事件
      // T-Fix: 使用 BattleEventType 枚举
      initialEvents.push({
        type: BattleEventType.HOOK_TRIGGER,
        timestamp: Date.now(),
        data: { trigger: 'ON_LESSON_START', count: startActions.length },
      });

      startActions.forEach(action => {
        const result = this.engine!.actionExecutor.executeAction(action, this.battleStateNG!);
        if (result.logs.length > 0) console.log(result.logs.join('\n'));
        if (result.events) initialEvents.push(...result.events);
      });
    }

    // 2. 生成 HAND_ENTER 事件
    const handEnterEvent = this.engine.actionExecutor.createHandEnterEvent();

    // 3. 收集所有初始事件供 UI 播放
    // T-Fix: 添加 LESSON_START 伪 Hook 事件以触发 Banner
    const lessonStartEvent = {
      type: BattleEventType.HOOK_TRIGGER,
      timestamp: Date.now(),
      data: { trigger: 'LESSON_START', count: 0 },
    };

    // 子任务2: 将初始事件写入 ctx.battleState (UI 只读取该字段)
    this.ctx.battleState._initialEvents = [lessonStartEvent as any, ...initialEvents, handEnterEvent];

    console.log('[ProduceHostCore] 初始抽牌完成', {
      drawn: drawResult.logs,
      events: this.ctx.battleState._initialEvents!.length,
    });

    // T-Fix: 恢复 ctx.battleState 更新 (Regression Fix)
    this.ctx.battleState.mode = 'lesson';
    this.ctx.battleState.isSP = result.isSP;
    this.ctx.battleState.primaryStat = primaryStat;
    this.ctx.battleState.maxTurns = battleConfig.maxTurns;
    this.ctx.battleState.turnSequence = []; // 课程不需要回合序列
    this.ctx.battleState.targetScore = battleConfig.targetScore;
    // 子任务1: 设置 perfectScore 并重置结束状态
    this.ctx.battleState.perfectScore = result.isSP ? 3000 : 2000;
    this.ctx.battleState.isBattleEnded = false;
    this.ctx.battleState.battleEndReason = undefined;

    // T-Fix: 无条件同步引擎状态 (Regression Fix)
    this.syncEngineState();

    // T-Fix: 恢复 onBattleStart 回调 (Regression Fix)
    this.callbacks.onBattleStart?.(this.ctx.battleState);

    console.log('[ProduceHostCore] 开始课程战斗', {
      primaryStat,
      isSP: result.isSP,
      maxTurns: battleConfig.maxTurns,
      targetScore: battleConfig.targetScore,
    });

    return result;
  }

  /**
   * 课程战斗完成
   */
  public completeLessonBattle(battleComplete: BattleCompleteData): void {
    const { primaryStat, isSP } = this.ctx.battleState;
    const lessonType = isSP ? 'SP' : 'NORMAL';

    const result = handleLessonBattleComplete(this.ctx.produceState, lessonType, primaryStat, battleComplete);

    // 应用属性增益
    this.applyLessonResult(result.statGains);

    // 扣除体力
    const config = getLessonBattleConfig(this.config.scenarioId, lessonType);
    this.ctx.produceState.stamina = Math.max(0, this.ctx.produceState.stamina - config.staminaCost);

    // 重置战斗状态
    this.ctx.battleState.mode = 'idle';

    this.callbacks.onBattleEnd?.(result);

    console.log('[ProduceHostCore] 课程战斗完成', {
      rankGrade: result.rankGrade,
      totalGain: result.totalGain,
      statGains: result.statGains,
    });
  }

  private applyLessonResult(statGains: IdolStats): void {
    this.ctx.produceState.stats.vocal += statGains.vocal;
    this.ctx.produceState.stats.dance += statGains.dance;
    this.ctx.produceState.stats.visual += statGains.visual;

    this.callbacks.onStateChange?.(this.ctx.produceState);
  }

  // ==================== Step 3: 抽卡结果追加 ====================

  /**
   * Step 3: 将抽卡获得的技能卡添加到卡组
   * @param gachaItem 抽卡获得的技能卡数据
   */
  public addGachaCard(gachaItem: {
    id?: string;
    name: string;
    rarity: string;
    type?: '主动' | '精神';
    plan?: string;
    cost?: string;
    effectEntries?: any[];
    effectEntriesEnhanced?: any[];
    imageUrl?: string;
    restrictions?: { uses_per_battle?: number; is_unique?: boolean };
    display?: { name: string; nameJP?: string; description: string; flavor?: string };
    visual_hint?: any;
  }): void {
    const baseId = gachaItem.id || `gacha_${gachaItem.name}`;
    const instanceId = this.generateInstanceId(baseId);

    const newCard: DeckSkillCard = {
      id: instanceId,
      originalId: baseId,
      name: gachaItem.name,
      rarity: gachaItem.rarity,
      type: gachaItem.type || '主动',
      plan: gachaItem.plan,
      cost: gachaItem.cost || '0',
      effectEntries: gachaItem.effectEntries || [],
      effectEntriesEnhanced: gachaItem.effectEntriesEnhanced || [],
      isEnhanced: false,
      imageUrl: gachaItem.imageUrl || '',
      restrictions: gachaItem.restrictions,
      display: gachaItem.display,
      visual_hint: gachaItem.visual_hint,
    };

    this.ctx.deck.push(newCard);
    console.log('[ProduceHostCore] Step 3: 添加技能卡到卡组:', newCard.name, 'id:', instanceId);

    this.callbacks.onStateChange?.(this.ctx.produceState);
  }

  /**
   * Step 3: 将抽卡获得的饮料添加到背包
   * @param drinkItem 饮料数据
   */
  public addDrink(drinkItem: { id?: string; name: string; imageUrl?: string }): void {
    const drinks = this.ctx.produceState.drinks as (any | null)[];
    const emptySlot = drinks.findIndex(d => d === null);

    if (emptySlot === -1) {
      console.warn('[ProduceHostCore] Step 3: 饮料槽已满，无法添加:', drinkItem.name);
      return;
    }

    drinks[emptySlot] = {
      id: drinkItem.id || `drink_${Date.now()}`,
      name: drinkItem.name,
      iconUrl: drinkItem.imageUrl || '',
    };

    console.log('[ProduceHostCore] Step 3: 添加饮料到槽位:', emptySlot, drinkItem.name);
    this.callbacks.onStateChange?.(this.ctx.produceState);
  }

  /**
   * Step 3: 生成唯一的卡牌实例 ID
   */
  private generateInstanceId(baseId: string): string {
    // 使用简化的计数器模式
    const existingIds = this.ctx.deck.map(c => c.id);
    let counter = 1;
    let instanceId = `${this.ctx.sessionId}__${baseId}__${counter}`;
    while (existingIds.includes(instanceId)) {
      counter++;
      instanceId = `${this.ctx.sessionId}__${baseId}__${counter}`;
    }
    return instanceId;
  }

  // ==================== 考试战斗 ====================

  /**
   * 开始考试
   * @param examType 考试类型
   */
  public startExam(examType: WeekActionType): void {
    // 获取目标分数 (从剧本配置或默认值)
    const targetScore = this.getExamTargetScore(examType);

    // 获取考试配置
    const examConfig = getExamBattleConfig(this.config.scenarioId, examType as any, targetScore);

    // 生成回合序列
    const turnSequence = quickGenerateExamSequence(examConfig.maxTurns, this.primaryStat);

    // T2: 直接修改 ctx.battleState
    this.ctx.battleState.mode = 'exam';
    this.ctx.battleState.isSP = false;
    this.ctx.battleState.primaryStat = this.primaryStat;
    this.ctx.battleState.currentTurn = 1;
    this.ctx.battleState.maxTurns = examConfig.maxTurns;
    this.ctx.battleState.turnSequence = turnSequence;
    this.ctx.battleState.currentScore = 0;
    this.ctx.battleState.targetScore = targetScore;

    this.callbacks.onBattleStart?.(this.ctx.battleState);

    console.log('[ProduceHostCore] 开始考试', {
      examType,
      maxTurns: examConfig.maxTurns,
      targetScore,
      turnSequence: turnSequence.map(t => `T${t.turnNumber}:${t.attribute}`),
    });
  }

  /**
   * 考试战斗完成
   */
  public completeExamBattle(battleComplete: BattleCompleteData): void {
    const { targetScore } = this.ctx.battleState;

    const result = handleExamBattleComplete(battleComplete, targetScore);

    // 重置战斗状态
    this.ctx.battleState.mode = 'idle';

    this.callbacks.onBattleEnd?.(result);

    console.log('[ProduceHostCore] 考试战斗完成', result);
  }

  private getExamTargetScore(examType: WeekActionType): number {
    // P2-2: 从 ScenarioConfig 获取目标分数
    const config = getScenarioConfig(this.config.scenarioId);
    const examTypeMapping: Record<string, string> = {
      EXAM_MIDTERM: 'MIDTERM',
      EXAM_FINAL: 'FINAL',
      AUDITION_1: 'AUDITION_1',
      AUDITION_2: 'AUDITION_2',
      AUDITION_3: 'AUDITION_3',
    };
    const mappedType = examTypeMapping[examType] || examType;
    const examConfig = config.exams.find(e => e.type === mappedType);

    if (examConfig?.targetScore) {
      return examConfig.targetScore;
    }

    // 回退默认值
    const fallbackMap: Record<string, number> = {
      EXAM_MIDTERM: 5000,
      EXAM_FINAL: 10000,
      AUDITION_1: 8000,
      AUDITION_2: 12000,
      AUDITION_3: 20000,
    };
    return fallbackMap[examType] || 5000;
  }

  // ==================== 额外回合 ====================

  /**
   * 添加额外回合 (主属性)
   */
  public addExtraTurn(): void {
    if (this.ctx.battleState.mode !== 'exam') return;

    const currentTurn = this.ctx.battleState.currentTurn;
    const extraTurn = createExtraTurn(currentTurn, this.primaryStat);

    // T3-fix: readonly 数组不能用 splice，创建新数组
    const sequence = [...this.ctx.battleState.turnSequence];
    sequence.splice(currentTurn, 0, extraTurn);
    this.ctx.battleState.turnSequence = sequence;
    this.ctx.battleState.maxTurns++;

    console.log('[ProduceHostCore] 添加额外回合', extraTurn);
  }

  // ==================== 战斗动作 (T4b) ====================

  /**
   * 打出卡牌
   */
  public playCard(cardId: string): ActionResult {
    if (!this.engine || !this.battleStateNG) {
      return { success: false, logs: ['Engine not initialized'] };
    }

    console.log('[ProduceHostCore] 打出卡牌:', cardId);

    const result = this.engine.actionExecutor.playCard(cardId, this.battleStateNG);

    if (!result.success) {
      console.warn('⚠️ 出牌失败:', result.logs);
      return result;
    }

    // 同步状态
    this.syncEngineState();

    // 检查是否需要自动结束回合
    const state = this.battleStateNG;
    const maxPlays = state.maxCardsPerTurn + (state.extraPlaysThisTurn || 0);
    if (state.cardsPlayedThisTurn >= maxPlays) {
      this.endTurn();
    }

    // 检查战斗结束
    this.checkBattleEnd();

    return result;
  }

  /**
   * 结束回合
   */
  public endTurn(): void {
    if (!this.engine || !this.battleStateNG) return;

    const events = this.engine.turnController.endTurn(this.battleStateNG);

    // 子任务2: 将回合结束事件写入 ctx.battleState (UI 只读取该字段)
    if (events && events.length > 0) {
      if (!this.ctx.battleState._pendingEvents) {
        this.ctx.battleState._pendingEvents = [];
      }
      this.ctx.battleState._pendingEvents.push(...events);
      console.log(`[ProduceHostCore] 回合结束产生 ${events.length} 个事件，已写入 ctx.battleState`);
    }

    this.syncEngineState();

    // 子任务A: 修复 - endTurn 后必须调用 checkBattleEnd
    this.checkBattleEnd();
  }

  /**
   * 跳过回合 (恢复体力)
   */
  public skipTurn(): void {
    if (!this.engine || !this.battleStateNG) return;

    // 恢复2点体力
    const state = this.battleStateNG;
    state.stamina = Math.min(state.maxStamina, state.stamina + 2);

    this.endTurn();
  }

  /**
   * 子任务1: 检查战斗是否结束并写入 battleState
   * 由 Core 计算，UI 只读取 battleState.isBattleEnded
   */
  private checkBattleEnd(): void {
    if (!this.engine || !this.battleStateNG) return;

    const state = this.battleStateNG;
    const battleState = this.ctx.battleState;
    const perfectScore = battleState.perfectScore;

    // 判定条件 1: 回合耗尽 (子任务3: 修复差一错误，从 > 改为 >=)
    if (state.turn >= state.maxTurns) {
      battleState.isBattleEnded = true;
      battleState.battleEndReason = 'turn_limit';
      console.log('[ProduceHostCore] 战斗结束: 回合耗尽');
      return;
    }

    // 判定条件 2: 达到 Perfect 分数
    if (state.score >= perfectScore) {
      battleState.isBattleEnded = true;
      battleState.battleEndReason = 'perfect';
      console.log('[ProduceHostCore] 战斗结束: 达到 Perfect 分数', state.score, '>=', perfectScore);
      return;
    }

    // 判定条件 3: 达到目标分数 (target 与 perfect 的区别: target 是及格线，perfect 是满分线)
    const targetScore = battleState.targetScore;
    if (targetScore > 0 && state.score >= targetScore && perfectScore <= 0) {
      // 仅当没有设置 perfectScore 时，targetScore 才触发结束
      battleState.isBattleEnded = true;
      battleState.battleEndReason = 'target';
      console.log('[ProduceHostCore] 战斗结束: 达到目标分数', state.score, '>=', targetScore);
      return;
    }

    // 未结束
    battleState.isBattleEnded = false;
    battleState.battleEndReason = undefined;
  }

  // ==================== 周推进 ====================

  /**
   * 推进到下一周
   */
  public advanceWeek(): void {
    this.ctx.produceState.currentWeek++;
    this.callbacks.onWeekAdvance?.(this.ctx.produceState.currentWeek);
    this.callbacks.onStateChange?.(this.ctx.produceState);

    console.log('[ProduceHostCore] 推进到第', this.ctx.produceState.currentWeek, '周');
  }

  // ==================== 最终评价 ====================

  /**
   * 计算最终评价
   */
  public calculateFinalResult(examScore: number, rank: number): FinalEvaluationResult {
    const result = calculateFinalEvaluation(this.ctx.produceState.stats, examScore, rank);

    this.callbacks.onProduceComplete?.(result);

    return result;
  }

  // ==================== 获取当前分数加成 ====================

  /**
   * 获取当前三维的分数加成百分比 (用于 UI 显示)
   */
  public getScoreBonuses(judgeRates?: JudgeRateConfig) {
    const defaultRates: JudgeRateConfig = {
      vocal: 0.4,
      dance: 0.3,
      visual: 0.3,
    };

    return calculateAllScoreBonuses(this.ctx.produceState.stats, judgeRates || defaultRates);
  }

  // ==================== 便捷方法 ====================

  /**
   * 获取当前回合的属性信息
   */
  public getCurrentTurnAttribute(): TurnAttribute | null {
    if (this.ctx.battleState.mode !== 'exam') return null;

    const { currentTurn, turnSequence } = this.ctx.battleState;
    return turnSequence.find(t => Math.floor(t.turnNumber) === currentTurn) || null;
  }

  /**
   * 休息 (恢复体力)
   */
  public rest(): void {
    const recovery = Math.min(10, this.ctx.produceState.maxStamina - this.ctx.produceState.stamina);
    this.ctx.produceState.stamina += recovery;

    this.advanceWeek();

    console.log('[ProduceHostCore] 休息恢复体力', recovery);
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建初始培育状态
 */
export function createInitialProduceState(config: ProduceHostConfig): ProduceState {
  return {
    // 基础信息
    scenarioId: config.scenarioId,
    currentWeek: 1,
    currentPhase: 'WEEK_ACTION',

    // 偶像数据
    idolId: config.characterId,
    idolName: config.characterName,
    attributeType: config.attributeType,
    stats: { ...config.initialStats },
    lessonBonus: { vocal: 0, dance: 0, visual: 0 },

    // 资源
    stamina: config.stamina,
    maxStamina: config.stamina,
    pPoints: 0,
    fans: 0, // NIA 专属
    genki: 0, // Step 2: 元气
    drinks: [null, null, null], // Step 2: 饮料槽

    // 卡组
    deckCardIds: [],
    drinkIds: [],

    // 编队
    supportFormationIds: [],
    memoryFormationIds: [],

    // 记录
    actionHistory: [],
    examResults: [],

    // 计数器
    restCount: 0,
    outingCount: 0,
    specialGuidanceCount: 0,

    // Step 5: AI 专属卡缺失标志
    aiCardMissing: false,
  };
}

/**
 * 创建初始战斗状态
 */
export function createInitialBattleState(primaryStat: 'vocal' | 'dance' | 'visual' = 'visual'): BattleState {
  return {
    mode: 'idle',
    isSP: false,
    primaryStat,
    currentTurn: 0,
    maxTurns: 0,
    turnSequence: [],
    currentScore: 0,
    targetScore: 0,
    hand: [],
    drawPile: [],
    discardPile: [],
    excludePile: [],
    buffs: [],
    stamina: 0,
    genki: 0,
    predictedScores: {},
    // 子任务1: 战斗结束判定字段
    isBattleEnded: false,
    battleEndReason: undefined,
    perfectScore: 0,
    // 子任务2: 动画事件字段
    _initialEvents: undefined,
    _pendingEvents: undefined,
  };
}

// ==================== 导出 ====================

export default {
  ProduceHostCore,
  createInitialProduceState,
  createInitialBattleState,
};
