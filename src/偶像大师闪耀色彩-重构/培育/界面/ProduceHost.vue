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
      v-if="currentStep === 5"
      :idol="produceIdolData"
      :current-date="gameTime.currentDate"
      :current-week="gameTime.totalWeeksPassed + 1"
      :weeks-until-competition="12 - gameTime.totalWeeksPassed"
      :target-label="targetLabel"
      :stats="produceStats"
      :stamina="produceStamina"
      :max-stamina="30"
      :genki="produceGenki"
      :drinks="produceDrinks"
      @activity="handleActivitySelect"
      @use-drink="handleUseDrink"
      @open-deck="handleOpenDeck"
      @open-phone="handleOpenPhone"
      @open-diary="handleOpenDiary"
      @go-back="handleClose"
    />

    <!-- 抽卡选择弹窗 -->
    <GachaSelectionModal v-if="showGachaModal" :gacha-context="gachaContext" @confirm="handleGachaConfirm" />

    <!-- 牌组查看器 -->
    <DeckViewerModal v-if="showDeckViewer" :deck="currentDeck" @close="showDeckViewer = false" />

    <!-- AI卡生成提醒 -->
    <div v-if="showAICardWarning" class="ai-card-warning-modal" @click="showAICardWarning = false">
      <div class="warning-content" @click.stop>
        <h3>⚠️ 专属技能卡未生成</h3>
        <p>该角色还没有AI生成的专属技能卡</p>
        <p>
          请在偶像图鉴中为 <strong>{{ selectedIdol?.characterName }}</strong> 生成专属技能
        </p>
        <button @click="showAICardWarning = false">我知道了</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import CharacterSelection from '../../组件/角色选择.vue';
import { SPINE_CHARACTERS } from '../../角色管理/spine资源映射';
import type { GachaContext } from '../服务/GachaService';
import { getStartingDeck, type DeckSkillCard } from '../服务/StartingDeckService';
import type { MemoryFormation } from '../类型/MemoryCard';
import type { SupportFormation } from '../类型/SupportCard';
import DeckViewerModal from './DeckViewerModal.vue';
import GachaSelectionModal from './GachaSelectionModal.vue';
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

// 培育数据
const produceStats = reactive({ vocal: 0, dance: 0, visual: 0 });
const produceStamina = ref(30);
const produceGenki = ref(0);
const produceDrinks = ref<Array<{ id: string; name: string; iconUrl: string } | null>>([null, null, null]);

// 牌组系统
const currentDeck = ref<DeckSkillCard[]>([]);
const showGachaModal = ref(false);
const showDeckViewer = ref(false);
const showAICardWarning = ref(false);

// 抽卡上下文
const gachaContext = computed<GachaContext>(() => ({
  attributeType: selectedIdol.value?.attributeType || '感性',
  week: gameTime.totalWeeksPassed + 1,
  isSPLesson: false,
  currentDeck: currentDeck.value.map(card => card.name), // 用于检查重复
}));

// 目标标签（根据周数变化）
const targetLabel = computed(() => {
  const week = gameTime.totalWeeksPassed + 1;
  if (week <= 4) return '中間';
  if (week <= 8) return '準決勝';
  return '決勝';
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

  // 使用角色卡的实际属性值（如果有的话）
  const cardStats = (selectedIdol.value as any)?.stats;
  produceStats.vocal = cardStats?.vocal || 0;
  produceStats.dance = cardStats?.dance || 0;
  produceStats.visual = cardStats?.visual || 0;

  produceStamina.value = 30;
  produceGenki.value = 0;

  // 初始化起始卡组
  initializeStartingDeck();

  // 显示抽卡选择界面 (所有副本都显示，方便测试)
  console.log('🎰 Showing gacha modal');
  showGachaModal.value = true;

  // 进入主页面
  currentStep.value = 5;
}

// 初始化起始卡组
function initializeStartingDeck() {
  if (!selectedIdol.value) return;

  const config = {
    attributeType: selectedIdol.value.attributeType || ('感性' as const),
    recommendedStyle: selectedIdol.value.recommendedStyle || ('好调' as const),
    pCardFullName: selectedIdol.value.id || '',
  };

  const { deck, aiCardMissing } = getStartingDeck(config);
  currentDeck.value = deck;

  if (aiCardMissing) {
    showAICardWarning.value = true;
  }

  console.log('🎴 起始卡组初始化完成:', deck.length, '张');
}

// 抽卡结果处理
function handleGachaConfirm(type: 'skillCard' | 'drink', item: any) {
  showGachaModal.value = false;

  if (type === 'skillCard' && item) {
    // 将抽到的卡加入卡组
    currentDeck.value.push({
      id: item.id,
      name: item.name,
      rarity: item.rarity,
      type: item.type || '主动',
      cost: item.cost || '0',
      effectEntries: item.effectEntries || [],
      effectEntriesEnhanced: item.effectEntriesEnhanced || [],
      isEnhanced: false,
      imageUrl: item.imageUrl,
    });
    console.log('🎴 获得技能卡:', item.name);
  } else if (type === 'drink' && item) {
    // 将饮料加入背包
    const emptySlot = produceDrinks.value.findIndex(d => d === null);
    if (emptySlot !== -1) {
      produceDrinks.value[emptySlot] = {
        id: item.id || 'drink_' + Date.now(),
        name: item.name,
        iconUrl: item.imageUrl || '',
      };
    }
    console.log('🥤 获得饮料:', item.name);
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
</style>
