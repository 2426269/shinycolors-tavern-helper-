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
      @start="handleProduceStart"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CharacterSelection from '../../组件/角色选择.vue';
import type { MemoryFormation } from '../类型/MemoryCard';
import type { SupportFormation } from '../类型/SupportCard';
import ProduceSelection from './副本选择.vue';
import MemoryCardSelection from './回忆卡选择.vue';
import SupportCardSelection from './支援卡选择.vue';

// Emits
const emit = defineEmits<{
  close: [];
  start: [idol: any, supportFormation: SupportFormation, memoryFormation: MemoryFormation, scenarioId: string];
}>();

// 当前步骤
const currentStep = ref(1);

// 选中的P偶像
const selectedIdol = ref<
  | {
      id: string;
      characterName: string;
      theme: string;
      imageUrl: string;
    }
  | undefined
>(undefined);

// 支援卡编成
const supportFormation = ref<SupportFormation | null>(null);

// 回忆卡编成
const memoryFormation = ref<MemoryFormation | null>(null);

// Step 1: 角色选择完成
function handleCharacterSelected(card: any) {
  selectedIdol.value = {
    id: card.id,
    characterName: card.characterName,
    theme: card.theme,
    imageUrl: card.imageUrl,
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

// Step 4: 副本选择并开始培育
function handleProduceStart(scenarioId: string) {
  if (selectedIdol.value && supportFormation.value && memoryFormation.value) {
    emit('start', selectedIdol.value, supportFormation.value, memoryFormation.value, scenarioId);
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

.produce-ready {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: white;

  h2 {
    font-size: 32px;
    color: #ff69b4;
  }

  p {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.8);
  }

  button {
    margin-top: 30px;
    padding: 15px 50px;
    font-size: 18px;
    font-weight: bold;
    background: linear-gradient(135deg, #ff9500 0%, #ff5e00 100%);
    border: none;
    border-radius: 30px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 25px rgba(255, 149, 0, 0.5);
    }
  }
}
</style>
