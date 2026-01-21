<template>
  <div class="produce-host">
    <!-- Step 1: 角色选择 -->
    <CharacterSelection v-if="currentStep === 1" @close="handleClose" @next="handleCharacterSelected" />

    <!-- Step 2: 支援卡选择 -->
    <SupportCardSelection
      v-if="currentStep === 2"
      :selected-idol="selectedIdol"
      @close="handleClose"
      @confirm="handleSupportConfirmed"
      @back="currentStep = 1"
    />

    <!-- Step 3: 回忆卡选择 -->
    <MemoryCardSelection
      v-if="currentStep === 3"
      :selected-idol="selectedIdol"
      @close="handleClose"
      @confirm="handleMemoryConfirmed"
      @back="currentStep = 2"
    />

    <!-- Step 4: 副本选择 -->
    <ProduceSelection
      v-if="currentStep === 4"
      :selected-idol="selectedIdol"
      @back="currentStep = 3"
      @start="handleScenarioSelected"
    />

    <!-- Step 5: 副本主页面 -->
    <ProduceMainPage
      v-if="currentStep === 5 && !showBattle"
      :idol="produceIdolData"
      :current-date="gameTime.currentDate"
      :current-week="gameTime.totalWeeksPassed + 1"
      :weeks-until-competition="12 - gameTime.totalWeeksPassed"
      :target-label="targetLabel"
      :stats="produceHostStats"
      :stamina="produceHostStamina"
      :max-stamina="30"
      :genki="produceHostGenki"
      :drinks="produceHostDrinks"
      @activity="handleActivitySelect"
      @use-drink="handleUseDrink"
      @open-deck="handleOpenDeck"
      @open-phone="handleOpenPhone"
      @open-diary="handleOpenDiary"
      @go-back="handleClose"
      @start-lesson="handleStartLesson"
      @start-exam="handleStartExam"
    />

    <!-- Step 6: 课程战斗界面 -->
    <LessonBattle
      v-if="showBattle && battleType === 'lesson' && produceHost"
      :turn="produceHost.state.battleState.currentTurn"
      :max-turn="produceHost.state.battleState.maxTurns"
      :score="produceHost.state.battleState.currentScore"
      :target-score="produceHost.state.battleState.targetScore"
      :perfect-score="battlePerfectScore"
      :is-s-p="produceHost.state.battleState.isSP"
      :primary-stat="produceHost.state.battleState.primaryStat"
      :current-stat-value="currentBattleStatValue"
      :hp="produceHost.state.battleState.stamina"
      :max-hp="30"
      :genki="produceHost.state.battleState.genki"
      :hand="produceHost.state.battleState.hand"
      :draw-pile="produceHost.state.battleState.drawPile"
      :discard-pile="produceHost.state.battleState.discardPile"
      :exclude-pile="produceHost.state.battleState.excludePile"
      :buffs="produceHost.state.battleState.buffs"
      :drinks="produceHostDrinks"
      :idol-id="selectedIdol?.spineId"
      :disabled-card-ids="disabledCardIds"
      :predicted-scores="produceHost.state.battleState.predictedScores"
      @play-card="handlePlayCard"
      @skip="handleSkipTurn"
      @use-drink="handleUseDrink"
    />

    <!-- 抽卡选择弹窗 -->
    <GachaSelectionModal v-if="showGachaModal" :gacha-context="gachaContext" @confirm="handleGachaConfirm" />

    <!-- 牌组查看器 -->
    <DeckViewerModal v-if="showDeckViewer" :deck="produceHostDeck" @close="showDeckViewer = false" />

    <!-- AI卡生成提醒 -->
    <div v-if="showAICardWarning" class="ai-card-warning-modal" @click="dismissAICardWarning">
      <div class="warning-content" @click.stop>
        <h3>⚠️ 专属技能卡未生成</h3>
        <p>该角色还没有AI生成的专属技能卡</p>
        <p>
          请在偶像图鉴中为 <strong>{{ selectedIdol?.characterName }}</strong> 生成专属技能
        </p>
        <button @click="dismissAICardWarning">我知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import CharacterSelection from '../../组件/角色选择.vue';
import { SPINE_CHARACTERS } from '../../角色管理/spine资源映射';
import type { GachaContext } from '../服务/GachaService';
import type { DeckSkillCard } from '../服务/StartingDeckService';
// T4a: 引入 useProduceHost composable（逐步替换本地状态）
import useProduceHost, { UseProduceHostConfig } from '../服务/useProduceHost';
import type { MemoryFormation } from '../类型/MemoryCard';
import type { SupportFormation } from '../类型/SupportCard';
import DeckViewerModal from './DeckViewerModal.vue';
import GachaSelectionModal from './GachaSelectionModal.vue';
import LessonBattle from './LessonBattle.vue';
import ProduceMainPage from './ProduceMainPage.vue';
import ProduceSelection from './副本选择.vue';
import MemoryCardSelection from './回忆卡选择.vue';
import SupportCardSelection from './支援卡选择.vue';

// ====== 时间系统（内联实现，避免路径问题）======
interface GameTime {
  producerJoinDate: string;
  currentDate: string;
  totalWeeksPassed: number;
}

const DEFAULT_START_DATE = '2018-04-24';

function createInitialGameTime(): GameTime {
  return {
    producerJoinDate: DEFAULT_START_DATE,
    currentDate: DEFAULT_START_DATE,
    totalWeeksPassed: 0,
  };
}

// Emits
const emit = defineEmits<{
  close: [];
  start: [idol: any, supportFormation: SupportFormation, memoryFormation: MemoryFormation, scenarioId: string];
}>();

// 当前步骤 (1-5)
const currentStep = ref(1);

// 选中的P偶像（包含属性类型用于抽卡过滤）
const selectedIdol = ref<
  | {
      id: string;
      characterName: string;
      theme: string;
      imageUrl: string;
      spineId?: string;
      attributeType?: '感性' | '理性' | '非凡'; // 用于抽卡池过滤
      recommendedStyle?: '好调' | '集中' | '好印象' | '干劲' | '坚决' | '全力'; // 推荐流派
    }
  | undefined
>(undefined);

// 支援卡编成
const supportFormation = ref<SupportFormation | null>(null);

// 回忆卡编成
const memoryFormation = ref<MemoryFormation | null>(null);

// 选择的副本
const selectedScenarioId = ref<string>('');

// ====== 副本运行状态 ======
// 时间系统
const gameTime = reactive<GameTime>(createInitialGameTime());

// Step 1: sessionId 移至 useProduceHost 内部管理

// Step 2: 培育数据移至 useProduceHost.state.produceState
// 通过 computed 包装，处理 produceHost 为 null 的情况
const produceHostStats = computed(
  () => produceHost.value?.state.produceState.stats ?? { vocal: 0, dance: 0, visual: 0 },
);
const produceHostStamina = computed(() => produceHost.value?.state.produceState.stamina ?? 30);
const produceHostGenki = computed(() => produceHost.value?.state.produceState.genki ?? 0);
const produceHostDrinks = computed(() => [...(produceHost.value?.state.produceState.drinks ?? [null, null, null])]);

// Step 1: currentDeck 移至 useProduceHost.state.deck
const showGachaModal = ref(false);
const showDeckViewer = ref(false);
// Step 5: showAICardWarning 改为 computed + 本地 dismissed 状态
const aiCardWarningDismissed = ref(false);
const showAICardWarning = computed(() => {
  if (aiCardWarningDismissed.value) return false;
  return produceHost.value?.state.produceState.aiCardMissing ?? false;
});
function dismissAICardWarning() {
  aiCardWarningDismissed.value = true;
}

// 抽卡上下文
const gachaContext = computed<GachaContext>(() => ({
  attributeType: selectedIdol.value?.attributeType || '感性',
  week: gameTime.totalWeeksPassed + 1,
  isSPLesson: false,
  currentDeck: produceHostDeck.value.map(card => card.name), // Step 1: 改为读取 produceHost.state.deck
}));

// Step 1: 通过 computed 包装 produceHost.state.deck、元气等（处理 null 情况）
const produceHostDeck = computed<DeckSkillCard[]>(() => produceHost.value?.state.deck ?? []);

// T4a: useProduceHost 实例（延迟初始化，角色选择后创建）
const produceHost = ref<ReturnType<typeof useProduceHost> | null>(null);

// ====== 战斗系统 ======
// showBattle 和 battleType 现在从 produceHost.value.state.battleState 获取
const showBattle = computed(() => produceHost.value?.state.battleState.mode !== 'idle');
const battleType = computed(() => produceHost.value?.state.battleState.mode || 'lesson');
// 子任务1: perfectScore 改为从 battleState 读取，由 Core 写入
const battlePerfectScore = computed(() => produceHost.value?.state.battleState.perfectScore ?? 2000);

// 目标标签（根据周数变化）
const targetLabel = computed(() => {
  const week = gameTime.totalWeeksPassed + 1;
  if (week <= 4) return '中間';
  if (week <= 8) return '準決勝';
  return '決勝';
});

// 当前战斗属性的真实数值
const currentBattleStatValue = computed(() => {
  if (!produceHost.value) return 0;
  const stat = produceHost.value.state.battleState.primaryStat;
  const stats = produceHostStats.value;
  switch (stat) {
    case 'vocal':
      return stats.vocal;
    case 'dance':
      return stats.dance;
    case 'visual':
      return stats.visual;
    default:
      return 0;
  }
});

// 计算不满足条件的卡牌ID列表
const disabledCardIds = computed(() => {
  if (!produceHost.value) return [];

  const battleState = produceHost.value.state.battleState;
  const buffs = battleState.buffs;
  const hand = battleState.hand;

  const disabled: string[] = [];

  // 辅助函数：检查是否有 Buff
  const hasBuff = (buffId: string) => buffs.some((b: any) => b.id === buffId);

  for (const card of hand) {
    // 检查卡牌效果文本是否包含条件关键词
    const effectText = card.effectEntries?.map((e: any) => (typeof e === 'string' ? e : e.effect)).join(' ') || '';

    // 检查好调条件
    if (effectText.includes('好调状态') || effectText.includes('好調状態')) {
      if (!hasBuff('GoodCondition')) {
        disabled.push(card.id);
        continue;
      }
    }

    // 检查绝好调条件
    if (effectText.includes('绝好调状态') || effectText.includes('絶好調状態')) {
      if (!hasBuff('ExcellentCondition')) {
        disabled.push(card.id);
        continue;
      }
    }

    // TODO: 添加更多条件检查 (集中、干劲等)
  }

  return disabled;
});

// 副本角色数据（传给ProduceMainPage）
const produceIdolData = computed(() => {
  if (!selectedIdol.value) return undefined;
  return {
    id: selectedIdol.value.id,
    characterName: selectedIdol.value.characterName,
    spineUrl: selectedIdol.value.spineId,
    cardImageUrl: selectedIdol.value.imageUrl,
    avatarUrl: selectedIdol.value.imageUrl,
  };
});

// ====== 事件处理 ======

// Step 1: 角色选择完成
function handleCharacterSelected(card: any) {
  // 如果没有 spineId，尝试从 SPINE_CHARACTERS 中查找
  let spineId = card.spineId || '';
  if (!spineId && card.characterName) {
    // 同时匹配 japaneseName 和 chineseName，因为卡牌数据可能使用任一格式
    const spineChar = SPINE_CHARACTERS.find(
      c => c.chineseName === card.characterName || c.japaneseName === card.characterName,
    );
    if (spineChar) {
      // 尝试通过 enzaId 匹配
      const spineCard = spineChar.cards.find(c => c.enzaId === card.enzaId);
      if (spineCard) {
        spineId = `${spineChar.japaneseName}_${spineCard.name}`;
      } else {
        // 尝试通过主题匹配
        const spineCardByTheme = spineChar.cards.find(c => c.displayName === card.theme);
        if (spineCardByTheme) {
          spineId = `${spineChar.japaneseName}_${spineCardByTheme.name}`;
        } else if (spineChar.cards.length > 0) {
          // 使用第一张卡作为默认
          spineId = `${spineChar.japaneseName}_${spineChar.cards[0].name}`;
        }
      }
      console.log(
        `🎭 找到角色 ${spineChar.chineseName}, enzaId: ${card.enzaId}, 匹配的spineCard:`,
        spineChar.cards.find(c => c.enzaId === card.enzaId) ? 'enzaId匹配' : '使用fallback',
      );
    } else {
      console.log(`❌ 未找到角色: ${card.characterName}`);
    }
  }
  console.log(`🎭 Spine ID: ${spineId} (from card: ${card.spineId}, enzaId: ${card.enzaId})`);

  selectedIdol.value = {
    id: card.id,
    characterName: card.characterName,
    theme: card.theme,
    imageUrl: card.imageUrl,
    spineId,
    // 从卡牌属性获取属性类型（用于抽卡池过滤）
    attributeType: card.attribute?.attributeType || card.attribute?.type,
    // 从卡牌属性获取推荐流派（用于起始卡组）
    recommendedStyle: card.attribute?.recommendedStyle,
    // 添加三维属性值
    stats: card.attribute?.stats,
  } as any;
  console.log(
    `🎴 选择P偶像: ${card.characterName} [${selectedIdol.value?.attributeType}] 流派: ${selectedIdol.value?.recommendedStyle}`,
    `三维: Vo=${card.attribute?.stats?.vocal} Da=${card.attribute?.stats?.dance} Vi=${card.attribute?.stats?.visual}`,
  );
  currentStep.value = 2;
}

// Step 2: 支援卡选择完成
function handleSupportConfirmed(formation: SupportFormation) {
  supportFormation.value = formation;
  currentStep.value = 3;
}

// Step 3: 回忆卡选择完成
function handleMemoryConfirmed(formation: MemoryFormation) {
  memoryFormation.value = formation;
  currentStep.value = 4;
}

// Step 4: 副本选择并进入主页面
function handleScenarioSelected(scenarioId: string) {
  console.log('🎮 handleScenarioSelected called with:', scenarioId);
  selectedScenarioId.value = scenarioId;
  // 初始化副本状态
  Object.assign(gameTime, createInitialGameTime());

  // Step 2: 属性初始化已移至 useProduceHost（通过 config.initialStats）
  // T4a: 初始化 useProduceHost
  initProduceHost(scenarioId);

  // Step 1: initializeStartingDeck 已移至 useProduceHost 内部

  // 显示抽卡选择界面 (所有副本都显示，方便测试)
  console.log('🎰 Showing gacha modal');
  showGachaModal.value = true;

  // 进入主页面
  currentStep.value = 5;
}

// T4a: 初始化 useProduceHost composable
function initProduceHost(scenarioId: string) {
  if (!selectedIdol.value) {
    console.warn('[T4a] Cannot init ProduceHost: no idol selected');
    return;
  }

  const cardStats = (selectedIdol.value as any)?.stats;
  const config: UseProduceHostConfig = {
    scenarioId: scenarioId as any, // ScenarioId 类型兼容
    characterId: selectedIdol.value.id || 'unknown',
    characterName: selectedIdol.value.characterName || 'Unknown',
    pCardFullName: selectedIdol.value.id || '',
    attributeType: selectedIdol.value.attributeType || '感性',
    recommendedStyle: selectedIdol.value.recommendedStyle || '好调',
    stamina: 30,
    initialStats: {
      vocal: cardStats?.vocal || 0,
      dance: cardStats?.dance || 0,
      visual: cardStats?.visual || 0,
    },
  };

  // 创建 host 实例
  produceHost.value = useProduceHost(config, {
    onStateChange: (state: any) => {
      console.log('[T4a] ProduceHost state changed:', state.currentWeek);
      // Step 2: 同步时间系统（其他状态已通过 computed 自动响应）
      gameTime.currentDate = state.currentDate;
      gameTime.totalWeeksPassed = state.currentWeek - 1;
    },
    onBattleStart: (battleState: any) => {
      console.log('[T4a] Battle started:', battleState.mode);
      // 战斗开始时，Vue 组件会自动响应 showBattle computed 属性的变化
    },
    onBattleEnd: (battleResult: any) => {
      console.log('[T4a] Battle ended:', battleResult);
      // 战斗结束时，Vue 组件会自动响应 showBattle computed 属性的变化
      // 可以在这里处理战斗结果，例如属性提升等
      handleBattleComplete();
    },
  });

  // T4a: 安全访问 produceHost.value
  if (produceHost.value) {
    console.log('🎮 [T4a] ProduceHost initialized:', {
      sessionId: produceHost.value.sessionId,
      characterName: config.characterName,
    });
  }
}

// Step 1: initializeStartingDeck 已移至 useProduceHost 内部，已删除

// 抽卡结果处理
function handleGachaConfirm(type: 'skillCard' | 'drink', item: any) {
  showGachaModal.value = false;

  if (!produceHost.value) {
    console.error('[Step 3] handleGachaConfirm: produceHost not initialized');
    return;
  }

  if (type === 'skillCard' && item) {
    // Step 3: 通过 actions.addGachaCard 将卡牌添加到卡组
    produceHost.value.actions.addGachaCard({
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      type: item.type,
      plan: item.plan || item.producePlan,
      cost: item.cost,
      effectEntries: item.effectEntries,
      effectEntriesEnhanced: item.effectEntriesEnhanced,
      imageUrl: item.imageUrl,
      restrictions: item.restrictions,
      display: item.display,
      visual_hint: item.visual_hint,
    });
    console.log('🃏 [Step 3] 获得技能卡:', item.name);
  } else if (type === 'drink' && item) {
    // Step 3: 通过 actions.addDrink 将饮料添加到背包
    produceHost.value.actions.addDrink({
      id: item.id,
      name: item.name || item.nameCN,
      imageUrl: item.imageUrl,
    });
    console.log('🧃 [Step 3] 获得饮料:', item.name || item.nameCN);
  }
}

// 活动选择
function handleActivitySelect(index: number) {
  console.log('选择活动:', index);
  // TODO: 打开活动选择界面
}

// 使用饮料
function handleUseDrink(index: number) {
  console.log('使用饮料:', index);
  // TODO: 使用饮料逻辑
}

// 打开牌组
function handleOpenDeck() {
  showDeckViewer.value = true;
}

// 打开电话
function handleOpenPhone() {
  console.log('打开电话');
  // TODO: 打开电话界面
}

// 打开日记
function handleOpenDiary() {
  console.log('打开日记');
  // TODO: 打开日记界面
}

// ====== 战斗系统 (NG 引擎) ======

// 处理待处理的事件队列
async function processPendingEvents() {
  if (!produceHost.value) return;
  const battleState = produceHost.value.state.battleState as any;

  // 1. 处理初始事件 (HAND_ENTER)
  if (battleState._initialEvents && battleState._initialEvents.length > 0) {
    console.log(`🎬 [UI] 处理初始事件: ${battleState._initialEvents.length} 个`);
    try {
      await animationController.enqueue(battleState._initialEvents);
    } catch (e) {
      console.error('❌ [UI] 初始动画播放失败:', e);
      animationController.skip(); // 确保解锁
    }
    battleState._initialEvents = []; // 清空
  }

  // 2. 处理回合结束/其他挂起事件
  if (battleState._pendingEvents && battleState._pendingEvents.length > 0) {
    console.log(`🎬 [UI] 处理挂起事件: ${battleState._pendingEvents.length} 个`);
    try {
      await animationController.enqueue(battleState._pendingEvents);
    } catch (e) {
      console.error('❌ [UI] 挂起动画播放失败:', e);
      animationController.skip(); // 确保解锁
    }
    battleState._pendingEvents = []; // 清空
  }
}

// 开始课程
async function handleStartLesson(primaryStat: 'vocal' | 'dance' | 'visual', isSP: boolean) {
  console.log(`🎮 开始${isSP ? 'SP' : '普通'}课程:`, primaryStat);

  if (!produceHost.value) {
    console.error('❌ ProduceHost not initialized');
    return;
  }

  // T4b: 调用 actions.startLesson
  const result = produceHost.value.actions.startLesson(primaryStat);

  if (!result.requiresBattle) {
    // NIA 自主课程: 直接应用结果
    console.log('[ProduceHost] NIA 自主课程，跳过战斗');
    return;
  }

  // 处理初始事件 (HAND_ENTER)
  await processPendingEvents();
}

// 引入动画控制器
import { animationController } from '../../战斗/动画/AnimationController';

// 打出卡牌
async function handlePlayCard(card: DeckSkillCard) {
  if (!produceHost.value) return;

  // 子任务2: 调试日志
  console.log('[DEBUG] 出牌检查', {
    isAnimating: animationController.isAnimating.value,
    cardId: card.id,
  });

  // 1. UI 锁定检查
  if (animationController.isAnimating.value) {
    console.log('🚫 [UI] 动画播放中，禁止操作');
    return;
  }

  console.log('🃏 打出卡牌:', card.name);

  try {
    // T4b: 调用 actions.playCard
    const result = produceHost.value.actions.playCard(card.id);

    // 2. 动画队列处理 (出牌产生的即时事件)
    if (result.events && result.events.length > 0) {
      console.log(`🎬 [UI] 收到 ${result.events.length} 个战斗事件，加入动画队列`);
      await animationController.enqueue(result.events);
    }

    // 3. 处理挂起事件 (如回合结束弃牌)
    await processPendingEvents();

    // 检查战斗结束
    if (checkBattleEnd()) {
      handleBattleComplete();
    }
  } catch (e) {
    console.error('❌ [UI] 出牌处理异常:', e);
    animationController.skip(); // 确保解锁
  }
}

// 跳过回合 (加体力)
async function handleSkipTurn() {
  if (!produceHost.value) return;

  // UI 锁定检查
  if (animationController.isAnimating.value) {
    console.log('🚫 [UI] 动画播放中，禁止操作');
    return;
  }

  console.log('⏭️ 跳过回合');

  try {
    // T4b: 调用 actions.skipTurn
    produceHost.value.actions.skipTurn();

    // 处理挂起事件 (回合结束/开始)
    await processPendingEvents();

    // 检查战斗结束
    if (checkBattleEnd()) {
      handleBattleComplete();
    }
  } catch (e) {
    console.error('❌ [UI] 跳过回合异常:', e);
    animationController.skip(); // 确保解锁
  }
}

// 子任务1: 检查战斗是否结束 (读取 Core 计算的 battleState.isBattleEnded)
// UI 不再自行计算，只读取 Core 写入的状态
function checkBattleEnd(): boolean {
  if (!produceHost.value) return false;
  return produceHost.value.state.battleState.isBattleEnded;
}

// 开始考试
// 开始考试
function handleStartExam(examType: string) {
  if (!produceHost.value) return;
  console.log('🎮 开始考试:', examType);
  // T4c: 调用 actions.startExam
  produceHost.value.actions.startExam(examType as any);
}

// 战斗完成
function handleBattleComplete() {
  if (!produceHost.value) return;

  const battle = produceHost.value.state.battleState;
  console.log('🎮 战斗完成, 分数:', battle.currentScore);

  // 调用 actions.completeLessonBattle
  // 调用 actions.completeLessonBattle
  produceHost.value.actions.completeLessonBattle({
    score: battle.currentScore,
    finalStamina: battle.stamina,
    maxStamina: 30, // 暂定
    cardsPlayed: 0, // 暂不统计
    turnsUsed: battle.currentTurn,
  });

  // 属性增加已由 completeLessonBattle 处理 (如果 Core 实现了)
  // 但目前 Core.completeLessonBattle 似乎只重置状态？
  // 检查 Core 实现：completeLessonBattle 只是重置状态。
  // 属性增加逻辑目前在 Vue 中。
  // 应该将属性增加逻辑移至 Core，或者在 Vue 中保留但使用新状态。

  // 暂时保留 Vue 中的属性增加逻辑，但使用新状态
  if (battle.mode === 'lesson') {
    // 子任务1: 改为读取 Core 写入的 perfectScore
    const perfectScore = battle.perfectScore || (battle.isSP ? 3000 : 2000);
    let grade: 'PERFECT' | 'GREAT' | 'PASS' | 'FAIL' = 'FAIL';
    const scoreRatio = battle.currentScore / perfectScore;
    if (scoreRatio >= 1.0) grade = 'PERFECT';
    else if (scoreRatio >= 0.7) grade = 'GREAT';
    else if (scoreRatio >= 0.4) grade = 'PASS';

    // 基础增益 + 评级倍率
    const baseGain = battle.isSP ? 15 : 10;
    const multiplier = { PERFECT: 1.5, GREAT: 1.2, PASS: 1.0, FAIL: 0.5 }[grade];
    const gain = Math.floor(baseGain * multiplier);

    // Step 2: 属性增加已由 ProduceHostCore.completeLessonBattle 处理
    // 仅输出日志
    console.log(`✅ ${battle.primaryStat} +${gain} (${grade})`);
  }
}

// 关闭
function handleClose() {
  emit('close');
}
</script>

<style scoped lang="scss">
.produce-host {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
}

// 战斗界面容器
.battle-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  z-index: 10001;

  .battle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.3);

    span {
      color: white;
      font-size: 24px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .battle-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }

  .battle-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;

    p {
      color: white;
      font-size: 20px;
      margin: 0;
    }

    .battle-complete-btn {
      padding: 15px 40px;
      font-size: 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 10px;
      color: white;
      cursor: pointer;
      margin-top: 30px;

      &:hover {
        transform: scale(1.05);
      }
    }
  }
}
</style>
