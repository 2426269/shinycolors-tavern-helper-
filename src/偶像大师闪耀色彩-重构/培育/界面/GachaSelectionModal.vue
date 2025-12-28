<template>
  <div class="gacha-selection-modal" @click="handleBackdropClick">
    <div class="modal-content" @click.stop>
      <!-- 标题 -->
      <div class="modal-header">
        <h2>🎁 获得奖励</h2>
        <p class="subtitle">{{ currentStep === 'type' ? '选择奖励类型' : '从3张卡中选择1张' }}</p>
      </div>

      <!-- Step 1: 选择类型（技能卡/饮料） -->
      <div v-if="currentStep === 'type'" class="selection-options">
        <button
          class="option-btn skill-card"
          :class="{ selected: selectedType === 'skillCard' }"
          @click="selectType('skillCard')"
        >
          <div class="option-icon">🃏</div>
          <div class="option-label">技能卡</div>
          <div class="option-desc">3选1获得技能卡</div>
        </button>

        <button class="option-btn drink" :class="{ selected: selectedType === 'drink' }" @click="selectType('drink')">
          <div class="option-icon">🥤</div>
          <div class="option-label">P饮料</div>
          <div class="option-desc">3选1获得饮料</div>
        </button>
      </div>

      <!-- Step 2: 3选1卡牌 -->
      <div v-else-if="currentStep === 'pick'" class="pick-options">
        <div
          v-for="(option, index) in pickOptions"
          :key="index"
          class="pick-card"
          :class="{ selected: selectedIndex === index, [option.rarity?.toLowerCase()]: true }"
          @click="selectCard(index)"
        >
          <img :src="option.imageUrl" :alt="option.name" class="pick-image" @error="handleImageError" />
          <div class="pick-info">
            <span class="pick-rarity">{{ option.rarity }}</span>
            <span class="pick-name">{{ option.name }}</span>
          </div>
        </div>
      </div>

      <!-- 选中卡片的效果详情 -->
      <div v-if="currentStep === 'pick' && selectedIndex !== null" class="effect-detail-panel">
        <div class="effect-header">
          <span class="effect-card-name">{{ pickOptions[selectedIndex]?.name }}</span>
          <span v-if="pickOptions[selectedIndex]?.cost" class="effect-cost">
            <i class="fas fa-bolt"></i> {{ pickOptions[selectedIndex]?.cost }}
          </span>
          <span v-if="pickOptions[selectedIndex]?.type" class="effect-type">{{
            pickOptions[selectedIndex]?.type
          }}</span>
        </div>
        <div class="effect-entries">
          <!-- 技能卡效果词条 -->
          <template v-if="pickOptions[selectedIndex]?.effectEntries?.length">
            <div
              v-for="(entry, idx) in pickOptions[selectedIndex].effectEntries"
              :key="idx"
              class="effect-entry"
              :class="{ consumption: entry.isConsumption }"
            >
              <img v-if="entry.icon" :src="entry.icon" class="effect-icon" @error="handleIconError" />
              <span v-else class="effect-bullet">●</span>
              <span class="effect-text">{{ entry.effect }}</span>
            </div>
          </template>
          <!-- 饮料效果 -->
          <div v-else-if="pickOptions[selectedIndex]?.effect" class="effect-entry drink-effect">
            <span class="effect-bullet">🥤</span>
            <span class="effect-text">{{ pickOptions[selectedIndex]?.effect }}</span>
          </div>
        </div>
      </div>

      <!-- Step 3: 确认结果 -->
      <div v-else-if="currentStep === 'confirm'" class="result-display">
        <div class="result-card" :class="selectedOption?.rarity?.toLowerCase()">
          <img
            v-if="selectedOption?.imageUrl"
            :src="selectedOption.imageUrl"
            :alt="selectedOption.name"
            class="result-image"
          />
          <div class="result-info">
            <div class="result-rarity">{{ selectedOption?.rarity }}</div>
            <div class="result-name">{{ selectedOption?.name }}</div>
            <div v-if="selectedOption?.effect" class="result-effect">{{ selectedOption?.effect }}</div>
          </div>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="modal-actions">
        <button v-if="currentStep === 'type'" class="confirm-btn" :disabled="!selectedType" @click="generateOptions">
          <i class="fas fa-dice"></i>
          抽取
        </button>
        <button
          v-else-if="currentStep === 'pick'"
          class="confirm-btn"
          :disabled="selectedIndex === null"
          @click="confirmPick"
        >
          <i class="fas fa-hand-pointer"></i>
          选择
        </button>
        <button v-else class="confirm-btn" @click="acceptResult">
          <i class="fas fa-check"></i>
          确认获得
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { rollDrinkSelection, rollSkillCardSelection, type GachaContext } from '../服务/GachaService';

interface PickOption {
  id?: string;
  name: string;
  rarity: string;
  imageUrl: string;
  effect?: string;
  type?: string;
  cost?: string;
  effectEntries?: any[];
  effectEntriesEnhanced?: any[];
  raw?: any;
}

const props = defineProps<{
  gachaContext: GachaContext;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [type: 'skillCard' | 'drink', item: any];
}>();

onMounted(() => {
  console.log('🎲 GachaSelectionModal 组件已挂载!', props.gachaContext);
});

const currentStep = ref<'type' | 'pick' | 'confirm'>('type');
const selectedType = ref<'skillCard' | 'drink' | null>(null);
const pickOptions = ref<PickOption[]>([]);
const selectedIndex = ref<number | null>(null);
const selectedOption = ref<PickOption | null>(null);

function selectType(type: 'skillCard' | 'drink') {
  selectedType.value = type;
}

function generateOptions() {
  if (!selectedType.value) return;

  try {
    if (selectedType.value === 'skillCard') {
      const cards = rollSkillCardSelection(props.gachaContext, 3);
      pickOptions.value = cards.map(card => ({
        id: card.id,
        name: card.name,
        rarity: card.rarity,
        type: card.type,
        cost: card.cost,
        effectEntries: card.effectEntries,
        effectEntriesEnhanced: card.effectEntriesEnhanced,
        imageUrl: `https://283pro.site/shinycolors/技能卡卡面/${encodeURIComponent(card.name)}.webp`,
        raw: card,
      }));
    } else {
      const drinks = rollDrinkSelection(props.gachaContext, 3);
      pickOptions.value = drinks.map(drink => ({
        name: drink.nameCN,
        rarity: drink.rarity,
        effect: drink.effectCN,
        imageUrl: drink.iconUrl || '',
        raw: drink,
      }));
    }

    if (pickOptions.value.length > 0) {
      currentStep.value = 'pick';
      selectedIndex.value = null;
    }
  } catch (error) {
    console.error('生成选项失败:', error);
  }
}

function selectCard(index: number) {
  selectedIndex.value = index;
}

function confirmPick() {
  if (selectedIndex.value === null) return;
  selectedOption.value = pickOptions.value[selectedIndex.value];
  currentStep.value = 'confirm';
}

function acceptResult() {
  if (selectedOption.value && selectedType.value) {
    emit('confirm', selectedType.value, selectedOption.value);
  }
}

function handleBackdropClick() {
  // 不允许点击背景关闭
}

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.src = 'https://placehold.co/100x100?text=No+Image';
}

function handleIconError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
}
</script>

<style scoped lang="scss">
.gacha-selection-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 30px;
  min-width: 500px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  text-align: center;
  margin-bottom: 25px;

  h2 {
    font-size: 24px;
    color: #ffd700;
    margin: 0 0 8px;
  }

  .subtitle {
    color: #aaa;
    font-size: 14px;
    margin: 0;
  }
}

.selection-options {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 25px;
}

.option-btn {
  flex: 1;
  max-width: 180px;
  padding: 25px 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-3px);
  }

  &.selected {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
  }
}

.option-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.option-label {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 6px;
}

.option-desc {
  font-size: 12px;
  color: #888;
}

// 3选1卡牌区
.pick-options {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 25px;
}

.pick-card {
  width: 140px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 3px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  }

  &.selected {
    border-color: #ffd700;
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
    transform: scale(1.1);
  }

  &.ssr {
    border-color: #ffd700;
  }
  &.sr {
    border-color: #c0c0c0;
  }
  &.r {
    border-color: #cd7f32;
  }
  &.特级 {
    border-color: #ffd700;
  }
  &.高级 {
    border-color: #c0c0c0;
  }
  &.普通 {
    border-color: #666;
  }
}

.pick-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
}

.pick-info {
  padding: 10px;
  text-align: center;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.5));
}

.pick-rarity {
  display: block;
  font-size: 11px;
  color: #ffd700;
  font-weight: bold;
  margin-bottom: 2px;
}

.pick-name {
  display: block;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 结果展示
.result-display {
  margin-bottom: 25px;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);

  &.ssr,
  &.特级 {
    border-color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
  }
  &.sr,
  &.高级 {
    border-color: #c0c0c0;
    background: rgba(192, 192, 192, 0.1);
  }
}

.result-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 10px;
}

.result-info {
  flex: 1;
}

.result-rarity {
  font-size: 14px;
  color: #ffd700;
  font-weight: bold;
  margin-bottom: 6px;
}

.result-name {
  font-size: 18px;
  color: #fff;
  font-weight: bold;
  margin-bottom: 6px;
}

.result-effect {
  font-size: 13px;
  color: #aaa;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.confirm-btn {
  padding: 14px 50px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 5px 25px rgba(102, 126, 234, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
    font-size: 18px;
  }
}

// 效果详情面板
.effect-detail-panel {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.effect-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.effect-card-name {
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
}

.effect-cost {
  padding: 3px 10px;
  background: rgba(102, 126, 234, 0.3);
  border-radius: 10px;
  font-size: 12px;
  color: #a8c0ff;

  i {
    font-size: 11px;
  }
}

.effect-type {
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  font-size: 12px;
  color: #aaa;
}

.effect-entries {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.effect-entry {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;

  &.consumption {
    background: rgba(255, 100, 100, 0.1);
    border-left: 3px solid #ff6464;
  }

  &.drink-effect {
    background: rgba(100, 200, 255, 0.1);
  }
}

.effect-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.effect-bullet {
  color: #ffd700;
  font-size: 14px;
  flex-shrink: 0;
}

.effect-text {
  font-size: 13px;
  color: #ddd;
  line-height: 1.5;
}

// 添加图标错误处理函数需要在script中
</style>
