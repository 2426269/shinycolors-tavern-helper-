<template>
  <div class="memory-selection-container">
    <!-- 顶部步骤指示器 -->
    <div class="top-bar">
      <div class="step-indicator">
        <div class="step completed">1</div>
        <div class="step-line"></div>
        <div class="step completed">2</div>
        <div class="step-line"></div>
        <div class="step active">3.回忆卡选择</div>
        <div class="step-line"></div>
        <div class="step">4</div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：P偶像预览 -->
      <div class="idol-preview-section">
        <!-- 角色卡背景 -->
        <div
          v-if="selectedIdol?.imageUrl"
          class="idol-card-bg"
          :style="{ backgroundImage: `url(${selectedIdol.imageUrl})` }"
        ></div>

        <!-- 右上角：角色名和歌曲 -->
        <div class="idol-info-right">
          <div class="card-theme">【{{ selectedIdol?.theme || '' }}】</div>
          <div class="idol-name">{{ selectedIdol?.characterName || '' }}</div>
        </div>

        <!-- 左侧属性面板 -->
        <div class="idol-stats-left">
          <div class="affection-row">
            <span class="label">亲密度</span>
            <span class="value">0<small>/10</small></span>
          </div>
        </div>

        <!-- 加成预览 -->
        <div class="bonus-preview">
          <div class="bonus-title">
            <i class="fas fa-star"></i>
            回忆加成
          </div>
          <div class="bonus-content">
            <span class="label">编成效果</span>
            <span class="bonus-value">{{ selectedCount }}/4</span>
          </div>
        </div>
      </div>

      <!-- 右侧：回忆卡槽位 -->
      <div class="memory-section">
        <!-- 预设切换区域 -->
        <div class="preset-navigation">
          <button class="preset-arrow" @click="prevPreset">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div class="preset-info">
            <div v-if="!isEditingPresetName" class="preset-name-display" @click="startEditPresetName">
              <span>{{ currentPreset.name }}</span>
              <i class="fas fa-edit"></i>
            </div>
            <input
              v-else
              ref="presetNameInput"
              v-model="editingPresetName"
              class="preset-name-input"
              @blur="savePresetName"
              @keyup.enter="savePresetName"
            />
            <div class="preset-index">{{ currentPresetIndex + 1 }} / {{ presets.length }}</div>
          </div>
          <button class="preset-arrow" @click="nextPreset">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <!-- 回忆卡槽位 (4格，1行4列，更大空间) -->
        <div class="memory-slots">
          <div
            v-for="(slot, index) in formation.slots"
            :key="index"
            class="memory-slot"
            :class="{
              filled: slot.card,
              selected: selectedSlotIndex === index,
            }"
            @click="openCardPicker(index)"
          >
            <template v-if="slot.card">
              <img :src="slot.card.imageUrl" :alt="slot.card.cardName" class="slot-image" />
              <div class="slot-name">{{ slot.card.cardName }}</div>
              <div class="slot-stars">
                <span v-for="s in slot.card.uncap" :key="s" class="star filled">★</span>
              </div>
            </template>
            <template v-else>
              <div class="empty-slot">
                <i class="fas fa-plus"></i>
              </div>
            </template>
          </div>
        </div>

        <!-- 编成操作按钮 -->
        <div class="formation-actions">
          <button class="save-btn" @click="saveCurrentPreset"><i class="fas fa-save"></i> 保存预设</button>
          <button class="reset-btn" @click="resetFormation">重置</button>
          <button class="auto-btn" @click="autoSelect">自动选择</button>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-actions">
      <button class="action-btn back-btn" @click="$emit('back')">
        <i class="fas fa-arrow-left"></i>
        <span>返回</span>
      </button>

      <button class="action-btn next-btn" @click="confirmSelection">
        <i class="fas fa-arrow-right"></i>
        <span>下一步</span>
      </button>
    </div>

    <!-- 关闭按钮 -->
    <button class="close-button" @click="$emit('close')">
      <i class="fas fa-times"></i>
    </button>

    <!-- 回忆卡选择弹窗 -->
    <div v-if="showCardPickerModal" class="card-picker-modal" @click.self="closeCardPicker">
      <div class="card-picker-content">
        <!-- 弹窗头部 -->
        <div class="picker-header">
          <h3>选择回忆卡</h3>
          <button class="picker-close" @click="closeCardPicker">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 选中卡片的详情区域 -->
        <div v-if="previewCard" class="card-detail-area">
          <div class="detail-left">
            <div class="detail-header">{{ previewCard.cardName }}</div>
            <div class="detail-character">{{ previewCard.characterName }}</div>
            <div class="skill-cards">
              <div class="skill-label">获得技能卡</div>
              <div class="skill-list">
                <span v-if="previewCard.skillCards?.length">
                  {{ previewCard.skillCards.join(', ') }}
                </span>
                <span v-else>待实现</span>
              </div>
            </div>
          </div>

          <div class="detail-right">
            <div class="effects-list">
              <div v-for="(effect, idx) in previewCard.effects" :key="idx" class="effect-item">
                <i class="fas fa-star"></i>
                <span>{{ effect.description }}</span>
              </div>
              <div v-if="previewCard.effects.length === 0" class="effect-item">
                <span>暂无效果</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片列表 -->
        <div class="card-grid">
          <div
            v-for="card in ownedMemoryCards"
            :key="card.id"
            class="picker-card"
            :class="{
              selected: isCardSelected(card.id),
              preview: previewCard?.id === card.id,
            }"
            @click="selectCardForPreview(card)"
            @dblclick="confirmCardSelection(card)"
          >
            <img :src="card.imageUrl" :alt="card.cardName" class="picker-card-image" />
            <div class="picker-card-name">{{ card.cardName }}</div>
            <div class="picker-card-stars">
              <span v-for="s in card.uncap" :key="s">★</span>
            </div>
            <div v-if="isCardSelected(card.id)" class="picker-selected-badge">已选</div>
          </div>
          <div v-if="ownedMemoryCards.length === 0" class="no-cards-message">暂无回忆卡，请先收集</div>
        </div>

        <!-- 弹窗底部按钮 -->
        <div class="picker-actions">
          <button class="picker-btn cancel" @click="closeCardPicker"><i class="fas fa-times"></i> 取消</button>
          <button class="picker-btn confirm" :disabled="!previewCard" @click="confirmPickerSelection">
            <i class="fas fa-arrow-right"></i> 确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { type MemoryCard, type MemoryFormation, createEmptyMemoryFormation } from '../类型/MemoryCard';

// Props
const props = defineProps<{
  selectedIdol?: {
    id: string;
    characterName: string;
    theme: string;
    imageUrl: string;
  };
}>();

// Emits
const emit = defineEmits<{
  close: [];
  confirm: [formation: MemoryFormation];
  back: [];
}>();

// 预设系统
interface MemoryPreset {
  name: string;
  slots: Array<{ cardId: string | null }>;
}

const STORAGE_KEY = 'memory_presets';
const DEFAULT_PRESETS: MemoryPreset[] = [
  { name: '回忆编成 1', slots: [{ cardId: null }, { cardId: null }, { cardId: null }, { cardId: null }] },
  { name: '回忆编成 2', slots: [{ cardId: null }, { cardId: null }, { cardId: null }, { cardId: null }] },
  { name: '回忆编成 3', slots: [{ cardId: null }, { cardId: null }, { cardId: null }, { cardId: null }] },
];

const presets = ref<MemoryPreset[]>([]);
const currentPresetIndex = ref(0);

// 加载预设
function loadPresets() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      presets.value = JSON.parse(stored);
    } else {
      presets.value = [...DEFAULT_PRESETS];
    }
  } catch {
    presets.value = [...DEFAULT_PRESETS];
  }
}

// 保存预设到localStorage
function savePresetsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.value));
}

// 当前预设
const currentPreset = computed(() => presets.value[currentPresetIndex.value] || DEFAULT_PRESETS[0]);

// 状态
const formation = reactive<MemoryFormation>(createEmptyMemoryFormation());
const selectedSlotIndex = ref<number | null>(null);

// 已拥有的回忆卡列表
const ownedMemoryCards = ref<MemoryCard[]>([]);

// 弹窗状态
const showCardPickerModal = ref(false);
const previewCard = ref<MemoryCard | null>(null);
const pickerSlotIndex = ref<number | null>(null);

// 预设名编辑
const isEditingPresetName = ref(false);
const editingPresetName = ref('');
const presetNameInput = ref<HTMLInputElement | null>(null);

// 计算已选数量
const selectedCount = computed(() => formation.slots.filter(s => s.card).length);

// 初始化
onMounted(() => {
  loadPresets();
  loadCurrentPreset();
  ownedMemoryCards.value = [];
});

// 监听预设切换
watch(currentPresetIndex, () => {
  loadCurrentPreset();
});

// 加载当前预设到formation
function loadCurrentPreset() {
  const preset = currentPreset.value;
  formation.name = preset.name;
  for (let i = 0; i < 4; i++) {
    const cardId = preset.slots[i]?.cardId;
    if (cardId) {
      const card = ownedMemoryCards.value.find(c => c.id === cardId);
      formation.slots[i].card = card || null;
    } else {
      formation.slots[i].card = null;
    }
  }
}

// 切换预设
function prevPreset() {
  if (currentPresetIndex.value > 0) {
    currentPresetIndex.value--;
  } else {
    currentPresetIndex.value = presets.value.length - 1;
  }
}

function nextPreset() {
  if (currentPresetIndex.value < presets.value.length - 1) {
    currentPresetIndex.value++;
  } else {
    currentPresetIndex.value = 0;
  }
}

// 编辑预设名
function startEditPresetName() {
  isEditingPresetName.value = true;
  editingPresetName.value = currentPreset.value.name;
  nextTick(() => {
    presetNameInput.value?.focus();
  });
}

function savePresetName() {
  if (editingPresetName.value.trim()) {
    presets.value[currentPresetIndex.value].name = editingPresetName.value.trim();
    formation.name = editingPresetName.value.trim();
    savePresetsToStorage();
  }
  isEditingPresetName.value = false;
}

// 保存当前编成到预设
function saveCurrentPreset() {
  presets.value[currentPresetIndex.value] = {
    name: formation.name,
    slots: formation.slots.map(s => ({ cardId: s.card?.id || null })),
  };
  savePresetsToStorage();
}

// 打开卡片选择弹窗
function openCardPicker(index: number) {
  pickerSlotIndex.value = index;
  selectedSlotIndex.value = index;
  const currentCard = formation.slots[index].card;
  previewCard.value = currentCard;
  showCardPickerModal.value = true;
}

// 关闭卡片选择弹窗
function closeCardPicker() {
  showCardPickerModal.value = false;
  previewCard.value = null;
  pickerSlotIndex.value = null;
}

// 选择卡片预览（单击）
function selectCardForPreview(card: MemoryCard) {
  previewCard.value = card;
}

// 确认卡片选择（双击）
function confirmCardSelection(card: MemoryCard) {
  if (pickerSlotIndex.value === null) return;

  // 如果卡片已在其他槽位，先移除
  const existingIndex = formation.slots.findIndex(s => s.card?.id === card.id);
  if (existingIndex >= 0) {
    formation.slots[existingIndex].card = null;
  }

  formation.slots[pickerSlotIndex.value].card = card;
  closeCardPicker();
}

// 确认弹窗选择
function confirmPickerSelection() {
  if (!previewCard.value) return;
  confirmCardSelection(previewCard.value);
}

// 检查卡片是否已被选中
function isCardSelected(cardId: string): boolean {
  return formation.slots.some(slot => slot.card?.id === cardId);
}

// 重置编成
function resetFormation() {
  for (const slot of formation.slots) {
    slot.card = null;
  }
}

// 自动选择
function autoSelect() {
  resetFormation();
  const availableCards = [...ownedMemoryCards.value];
  for (const slot of formation.slots) {
    if (availableCards.length === 0) break;
    const card = availableCards.shift();
    if (card) {
      slot.card = card;
    }
  }
}

// 确认选择
function confirmSelection() {
  emit('confirm', formation);
}
</script>

<style scoped lang="scss">
.memory-selection-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部导航 */
.top-bar {
  padding: 15px 20px;
  display: flex;
  justify-content: center;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 10px;

  .step {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    color: white;

    &.completed {
      background: #4ade80;
    }

    &.active {
      width: auto;
      padding: 8px 20px;
      border-radius: 25px;
      background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
    }
  }

  .step-line {
    width: 30px;
    height: 2px;
    background: rgba(255, 255, 255, 0.3);
  }
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  padding-top: 20px;
  overflow: hidden;
}

/* 左侧P偶像预览 */
.idol-preview-section {
  width: 40%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.idol-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  filter: blur(3px) brightness(0.7);
  transform: scale(1.1);
  z-index: 0;
}

.idol-info-right {
  position: absolute;
  top: 20px;
  right: 20px;
  text-align: right;
  z-index: 2;

  .card-theme {
    font-size: 14px;
    color: #333;
    background: rgba(255, 255, 255, 0.9);
    padding: 4px 12px;
    border-radius: 15px;
    display: inline-block;
    margin-bottom: 8px;
  }

  .idol-name {
    font-size: 28px;
    font-weight: bold;
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
}

.idol-stats-left {
  position: absolute;
  top: 80px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2;

  .affection-row {
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 15px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 10px;

    .label {
      font-size: 12px;
      color: #666;
    }
    .value {
      font-size: 20px;
      font-weight: bold;
      color: #a855f7;
      small {
        font-size: 14px;
        color: #999;
      }
    }
  }
}

.bonus-preview {
  position: absolute;
  bottom: 30px;
  left: 20px;
  background: rgba(20, 20, 40, 0.9);
  border-radius: 15px;
  padding: 15px 20px;
  border: 1px solid rgba(168, 85, 247, 0.5);
  z-index: 2;

  .bonus-title {
    font-size: 14px;
    color: #a855f7;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .bonus-content {
    display: flex;
    align-items: center;
    gap: 10px;

    .label {
      font-size: 12px;
      color: #888;
    }

    .bonus-value {
      font-size: 16px;
      font-weight: bold;
      color: white;
    }
  }
}

/* 右侧回忆卡区域 */
.memory-section {
  flex: 1;
  padding: 20px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* 预设导航 */
.preset-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.preset-arrow {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(168, 85, 247, 0.3);
  border: 2px solid rgba(168, 85, 247, 0.6);
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(168, 85, 247, 0.5);
    transform: scale(1.1);
  }
}

.preset-info {
  text-align: center;
  min-width: 200px;
}

.preset-name-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  transition: all 0.2s;

  span {
    font-size: 18px;
    font-weight: bold;
    color: white;
  }

  i {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.preset-name-input {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid #a855f7;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 18px;
  font-weight: bold;
  color: white;
  text-align: center;
  width: 200px;
  outline: none;
}

.preset-index {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.memory-slots {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  max-width: 100%;
  margin: 0 auto;
}

.memory-slot {
  aspect-ratio: 3/4;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: rgba(168, 85, 247, 0.8);
    background: rgba(168, 85, 247, 0.1);
  }

  &.filled {
    border-style: solid;
    border-color: #a855f7;
    background: rgba(168, 85, 247, 0.2);
  }

  &.selected {
    border-color: #a855f7;
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
  }

  .slot-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 13px;
  }

  .slot-name {
    position: absolute;
    bottom: 30px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 12px;
    color: white;
    background: rgba(0, 0, 0, 0.7);
    padding: 5px;
  }

  .slot-stars {
    position: absolute;
    bottom: 8px;
    color: gold;
    font-size: 12px;
  }

  .empty-slot {
    font-size: 40px;
    color: rgba(255, 255, 255, 0.3);
  }
}

.formation-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;

  .save-btn {
    padding: 10px 25px;
    background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
    border: none;
    color: white;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 15px rgba(168, 85, 247, 0.5);
    }
  }

  .reset-btn,
  .auto-btn {
    padding: 10px 25px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

/* 底部按钮 */
.bottom-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);

  .action-btn {
    padding: 15px 40px;
    border: none;
    border-radius: 30px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s;

    &.back-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }

    &.next-btn {
      background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
      color: white;

      &:hover {
        box-shadow: 0 4px 20px rgba(168, 85, 247, 0.5);
      }
    }
  }
}

/* 关闭按钮 */
.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

/* 卡片选择弹窗 */
.card-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-picker-content {
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  background: white;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
  color: white;

  h3 {
    margin: 0;
    font-size: 20px;
  }

  .picker-close {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 16px;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.card-detail-area {
  display: flex;
  padding: 20px;
  gap: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  min-height: 150px;
}

.detail-left {
  flex: 1;

  .detail-header {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
  }

  .detail-character {
    font-size: 14px;
    color: #666;
    margin-bottom: 15px;
  }

  .skill-cards {
    .skill-label {
      font-size: 12px;
      color: #a855f7;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .skill-list {
      font-size: 14px;
      color: #333;
    }
  }
}

.detail-right {
  flex: 1;

  .effects-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .effect-item {
    background: white;
    padding: 10px 15px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #333;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.08);

    i {
      color: #a855f7;
    }
  }
}

.card-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  padding: 15px;
  overflow-y: auto;
  max-height: 280px;
  background: #f8f9fa;
}

.picker-card {
  position: relative;
  aspect-ratio: 3/4;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  border: 3px solid transparent;

  &:hover {
    transform: scale(1.05);
  }

  &.preview {
    border-color: #a855f7;
    box-shadow: 0 0 15px rgba(168, 85, 247, 0.5);
  }

  &.selected {
    opacity: 0.6;
  }

  .picker-card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .picker-card-name {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 10px;
    padding: 3px 5px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .picker-card-stars {
    position: absolute;
    bottom: 3px;
    right: 5px;
    color: gold;
    font-size: 10px;
  }

  .picker-selected-badge {
    position: absolute;
    top: 5px;
    right: 5px;
    background: #a855f7;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 5px;
  }
}

.no-cards-message {
  grid-column: 1 / -1;
  text-align: center;
  color: #666;
  padding: 30px;
}

.picker-actions {
  display: flex;
  gap: 15px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;

  .picker-btn {
    flex: 1;
    padding: 15px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;

    &.cancel {
      background: #e9ecef;
      color: #666;

      &:hover {
        background: #dee2e6;
      }
    }

    &.confirm {
      background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
      color: white;

      &:hover {
        box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
      }

      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    }
  }
}
</style>
