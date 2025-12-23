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
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import CharacterSelection from '../../组件/角色选择.vue';
import type { MemoryFormation } from '../类型/MemoryCard';
import type { SupportFormation } from '../类型/SupportCard';
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

// 选中的P偶像
const selectedIdol = ref<
  | {
      id: string;
      characterName: string;
      theme: string;
      imageUrl: string;
      spineId?: string;
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
  selectedIdol.value = {
    id: card.id,
    characterName: card.characterName,
    theme: card.theme,
    imageUrl: card.imageUrl,
    spineId: card.spineId || card.enzaId,
  };
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
  selectedScenarioId.value = scenarioId;
  // 初始化副本状态
  Object.assign(gameTime, createInitialGameTime());
  produceStats.vocal = selectedIdol.value ? 100 : 0;
  produceStats.dance = selectedIdol.value ? 100 : 0;
  produceStats.visual = selectedIdol.value ? 100 : 0;
  produceStamina.value = 30;
  produceGenki.value = 0;
  // 进入主页面
  currentStep.value = 5;
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
  console.log('打开牌组');
  // TODO: 打开牌组界面
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
