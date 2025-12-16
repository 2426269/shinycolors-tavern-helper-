<template>
  <div class="support-selection-screen">
    <!-- 顶部步骤指示器 -->
    <div class="top-decoration">
      <div class="step-indicator">
        <div class="step completed">1</div>
        <div class="step-line"></div>
        <div class="step active">2.支援卡选择</div>
        <div class="step-line"></div>
        <div class="step">3</div>
        <div class="step-line"></div>
        <div class="step">4</div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：P偶像卡面背景 + 属性 -->
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
          <div class="idol-song">
            <i class="fas fa-music"></i>
            {{ selectedIdol?.theme || '' }}
          </div>
        </div>

        <!-- 左侧属性面板 -->
        <div class="idol-stats-left">
          <!-- 亲密度 -->
          <div class="affection-row">
            <span class="label">亲密度</span>
            <span class="value">0<small>/10</small></span>
          </div>
          <!-- 体力 -->
          <div class="stamina-row">
            <img
              src="https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/体力.png"
              alt="体力"
              class="stat-icon"
            />
            <span class="value">{{ selectedIdol?.stamina || 30 }}</span>
          </div>
        </div>

        <!-- 三维属性圆圈 (左下角) -->
        <div class="dimension-circles-bottom">
          <div class="circle-item vocal">
            <div class="circle-bg">
              <span class="grade">{{ getGrade(selectedIdol?.stats?.vocal || 0) }}</span>
            </div>
            <div class="stat-info">
              <img
                src="https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/Vocal.png"
                alt="Vo"
                class="dim-icon"
              />
              <span class="stat-value">{{ selectedIdol?.stats?.vocal || 0 }}</span>
            </div>
          </div>
          <div class="circle-item dance">
            <div class="circle-bg">
              <span class="grade">{{ getGrade(selectedIdol?.stats?.dance || 0) }}</span>
            </div>
            <div class="stat-info">
              <img
                src="https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/Dance.png"
                alt="Da"
                class="dim-icon"
              />
              <span class="stat-value">{{ selectedIdol?.stats?.dance || 0 }}</span>
            </div>
          </div>
          <div class="circle-item visual">
            <div class="circle-bg">
              <span class="grade">{{ getGrade(selectedIdol?.stats?.visual || 0) }}</span>
            </div>
            <div class="stat-info">
              <img
                src="https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/Visual.png"
                alt="Vi"
                class="dim-icon"
              />
              <span class="stat-value">{{ selectedIdol?.stats?.visual || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- 加成预览 -->
        <div class="bonus-preview">
          <div class="bonus-title">
            <i class="fas fa-chart-bar"></i>
            训练加成
          </div>
          <div class="bonus-content">
            <span class="label">参数获得</span>
            <span class="bonus-value"
              >合计 <strong>+{{ totalBonusPercent }}%</strong></span
            >
          </div>
        </div>
      </div>

      <!-- 右侧：支援卡槽位 -->
      <div class="support-section">
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

        <!-- 支援卡槽位 (6格，2行3列) -->
        <div class="support-slots">
          <div
            v-for="(slot, index) in formation.slots"
            :key="index"
            class="support-slot"
            :class="{
              filled: slot.card,
              selected: selectedSlotIndex === index,
            }"
            @click="openCardPicker(index)"
          >
            <template v-if="slot.card">
              <img :src="slot.card.imageUrl" :alt="slot.card.cardName" class="slot-image" />
              <div class="slot-level">Lv{{ slot.card.level }}</div>
              <div class="slot-stars">
                <span v-for="s in slot.card.uncap" :key="s" class="star filled">★</span>
                <span v-for="s in 4 - slot.card.uncap" :key="'e' + s" class="star empty">☆</span>
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
      <button class="action-btn info-btn" @click="showInfo">
        <i class="fas fa-chart-line"></i>
        <span>育成情报</span>
      </button>

      <button class="action-btn next-btn" @click="confirmSelection">
        <i class="fas fa-arrow-right"></i>
        <span>下一步</span>
      </button>

      <button class="action-btn detail-btn" @click="showDetail">
        <i class="fas fa-list"></i>
        <span>编成详细</span>
      </button>
    </div>

    <!-- 关闭按钮 -->
    <button class="close-button" @click="$emit('close')">
      <i class="fas fa-times"></i>
    </button>

    <!-- 支援卡选择弹窗 -->
    <div v-if="showCardPickerModal" class="card-picker-modal" @click.self="closeCardPicker">
      <div class="card-picker-content">
        <!-- 弹窗头部 -->
        <div class="picker-header">
          <h3>选择支援卡</h3>
          <button class="picker-close" @click="closeCardPicker">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- 选中卡片的详情区域 -->
        <div v-if="previewCard" class="card-detail-area">
          <!-- 左侧：获得物品/技能卡 -->
          <div class="detail-left">
            <div class="detail-header">{{ previewCard.cardName }}</div>
            <div class="acquired-items">
              <div class="item-card">
                <div class="item-label">获得</div>
                <div class="item-content">
                  <i class="fas fa-gift"></i>
                  <span>待实现</span>
                </div>
              </div>
            </div>
            <div class="skill-support">
              <i class="fas fa-plus"></i>
              技能卡支援：待实现
            </div>
          </div>

          <!-- 右侧：效果列表 -->
          <div class="detail-right">
            <div class="effects-list">
              <div v-for="(effect, idx) in previewCard.effects" :key="idx" class="effect-item">
                <i class="fas fa-arrow-up"></i>
                <span>{{ effect.description }}</span>
              </div>
              <div v-if="previewCard.effects.length === 0" class="effect-item">
                <span>暂无效果</span>
              </div>
            </div>
          </div>

          <!-- 翻页 -->
          <div class="page-indicator">
            <button class="page-btn" @click="effectPage = Math.max(0, effectPage - 1)">
              <i class="fas fa-chevron-left"></i>
            </button>
            <span>{{ effectPage + 1 }} / 2</span>
            <button class="page-btn" @click="effectPage = Math.min(1, effectPage + 1)">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <!-- 卡片列表 -->
        <div class="card-grid">
          <div
            v-for="card in ownedSupportCards"
            :key="card.id"
            class="picker-card"
            :class="{
              selected: isCardSelected(card.id),
              disabled: isCardDisabled(card.id),
              preview: previewCard?.id === card.id,
            }"
            @click="selectCardForPreview(card)"
            @dblclick="confirmCardSelection(card)"
          >
            <img :src="card.imageUrl" :alt="card.cardName" class="picker-card-image" />
            <div class="picker-card-level">Lv{{ card.level }}</div>
            <div class="picker-card-stars">
              <span v-for="s in card.uncap" :key="s">★</span>
            </div>
            <div v-if="isCardSelected(card.id)" class="picker-selected-badge">编成中</div>
          </div>
          <div v-if="ownedSupportCards.length === 0" class="no-cards-message">暂无支援卡，请先收集</div>
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
import {
  type SupportCard,
  type SupportFormation,
  calculateFormationBonus,
  createEmptyFormation,
} from '../类型/SupportCard';

// Props
const props = defineProps<{
  selectedIdol?: {
    id: string;
    characterName: string;
    theme: string;
    imageUrl: string;
    stamina?: number;
    stats?: {
      vocal: number;
      dance: number;
      visual: number;
    };
  };
}>();

// Emits
const emit = defineEmits<{
  close: [];
  confirm: [formation: SupportFormation];
  back: [];
}>();

// 预设系统
interface SupportPreset {
  name: string;
  slots: Array<{ cardId: string | null }>;
}

const STORAGE_KEY = 'support_presets';
const DEFAULT_PRESETS: SupportPreset[] = [
  { name: '支援卡编成 1', slots: Array(6).fill({ cardId: null }) },
  { name: '支援卡编成 2', slots: Array(6).fill({ cardId: null }) },
  { name: '支援卡编成 3', slots: Array(6).fill({ cardId: null }) },
];

const presets = ref<SupportPreset[]>([]);
const currentPresetIndex = ref(0);

// 加载预设
function loadPresets() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      presets.value = JSON.parse(stored);
    } else {
      presets.value = DEFAULT_PRESETS.map(p => ({
        ...p,
        slots: p.slots.map(() => ({ cardId: null })),
      }));
    }
  } catch {
    presets.value = DEFAULT_PRESETS.map(p => ({
      ...p,
      slots: p.slots.map(() => ({ cardId: null })),
    }));
  }
}

// 保存预设到localStorage
function savePresetsToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.value));
}

// 当前预设
const currentPreset = computed(() => presets.value[currentPresetIndex.value] || DEFAULT_PRESETS[0]);

// 状态
const formation = reactive<SupportFormation>(createEmptyFormation());
const selectedSlotIndex = ref<number | null>(null);
const cardListRef = ref<HTMLElement | null>(null);

// 模拟的已拥有支援卡列表
const ownedSupportCards = ref<SupportCard[]>([]);

// 预设名编辑
const isEditingPresetName = ref(false);
const editingPresetName = ref('');
const presetNameInput = ref<HTMLInputElement | null>(null);

// 根据数值获取等级 (学マス规格)
function getGrade(value: number): string {
  if (value >= 2000) return 'SS';
  if (value >= 1800) return 'S+';
  if (value >= 1500) return 'S';
  if (value >= 1200) return 'A+';
  if (value >= 1000) return 'A';
  if (value >= 800) return 'B+';
  if (value >= 600) return 'B';
  if (value >= 450) return 'C+';
  if (value >= 300) return 'C';
  if (value >= 200) return 'D';
  if (value >= 100) return 'E';
  return 'F';
}

// 计算总加成百分比
const totalBonusPercent = computed(() => {
  const bonus = calculateFormationBonus(formation);
  return bonus.vocal + bonus.dance + bonus.visual;
});

// 初始化
onMounted(() => {
  loadPresets();
  loadCurrentPreset();
  ownedSupportCards.value = [];
});

// 监听预设切换
watch(currentPresetIndex, () => {
  loadCurrentPreset();
});

// 加载当前预设到formation
function loadCurrentPreset() {
  const preset = currentPreset.value;
  formation.name = preset.name;
  for (let i = 0; i < 6; i++) {
    const cardId = preset.slots[i]?.cardId;
    if (cardId) {
      const card = ownedSupportCards.value.find(c => c.id === cardId);
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

// 弹窗状态
const showCardPickerModal = ref(false);
const previewCard = ref<SupportCard | null>(null);
const effectPage = ref(0);
const pickerSlotIndex = ref<number | null>(null);

// 打开卡片选择弹窗
function openCardPicker(index: number) {
  pickerSlotIndex.value = index;
  selectedSlotIndex.value = index;
  // 如果槽位已有卡片，默认预览该卡片
  const currentCard = formation.slots[index].card;
  previewCard.value = currentCard;
  effectPage.value = 0;
  showCardPickerModal.value = true;
}

// 关闭卡片选择弹窗
function closeCardPicker() {
  showCardPickerModal.value = false;
  previewCard.value = null;
  pickerSlotIndex.value = null;
}

// 选择卡片预览（单击）
function selectCardForPreview(card: SupportCard) {
  if (isCardDisabled(card.id)) return;
  previewCard.value = card;
  effectPage.value = 0;
}

// 确认卡片选择（双击）
function confirmCardSelection(card: SupportCard) {
  if (isCardDisabled(card.id)) return;
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

// 选择槽位（不再使用，改用openCardPicker）
function selectSlot(index: number) {
  selectedSlotIndex.value = selectedSlotIndex.value === index ? null : index;
}

// 检查卡片是否已被选中
function isCardSelected(cardId: string): boolean {
  return formation.slots.some(slot => slot.card?.id === cardId);
}

// 检查卡片是否禁用（同角色已选）
function isCardDisabled(cardId: string): boolean {
  const card = ownedSupportCards.value.find(c => c.id === cardId);
  if (!card) return false;

  // 检查是否有同角色的卡已被选中
  return formation.slots.some(
    slot => slot.card && slot.card.characterId === card.characterId && slot.card.id !== cardId,
  );
}

// 切换卡片选择
function toggleCard(card: SupportCard) {
  if (isCardDisabled(card.id)) return;

  // 如果已选中，则移除
  const existingSlotIndex = formation.slots.findIndex(slot => slot.card?.id === card.id);
  if (existingSlotIndex >= 0) {
    formation.slots[existingSlotIndex].card = null;
    return;
  }

  // 如果有选中的槽位，放入该槽位
  if (selectedSlotIndex.value !== null) {
    const slot = formation.slots[selectedSlotIndex.value];
    slot.card = card;
    selectedSlotIndex.value = null;
    return;
  }

  // 否则放入第一个空槽位
  const emptySlot = formation.slots.find(slot => !slot.card);
  if (emptySlot) {
    emptySlot.card = card;
  }
}

// 重置编成
function resetFormation() {
  formation.slots.forEach(slot => {
    slot.card = null;
  });
}

// 自动选择
function autoSelect() {
  resetFormation();
  const availableCards = [...ownedSupportCards.value];
  const usedCharacters = new Set<string>();

  for (const slot of formation.slots) {
    // 找一张未使用角色的卡
    const cardIndex = availableCards.findIndex(c => !usedCharacters.has(c.characterId));
    if (cardIndex >= 0) {
      const card = availableCards[cardIndex];
      slot.card = card;
      usedCharacters.add(card.characterId);
      availableCards.splice(cardIndex, 1);
    }
  }
}

// 滚动卡片列表
function scrollCardsLeft() {
  if (cardListRef.value) {
    cardListRef.value.scrollBy({ left: -300, behavior: 'smooth' });
  }
}

function scrollCardsRight() {
  if (cardListRef.value) {
    cardListRef.value.scrollBy({ left: 300, behavior: 'smooth' });
  }
}

// 确认选择
function confirmSelection() {
  formation.totalBonus = calculateFormationBonus(formation);
  emit('confirm', formation);
}

// 显示信息
function showInfo() {
  console.log('显示育成情報');
}

// 显示详情
function showDetail() {
  console.log('显示編成詳細');
}
</script>

<style scoped lang="scss">
.support-selection-screen {
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

/* 顶部步骤指示器 */
.top-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  z-index: 10;
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
      background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%);
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
  padding-top: 60px;
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

/* 角色卡背景 */
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

/* 右上角角色信息 */
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

  .idol-song {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 5px;
  }
}

/* 左侧属性面板 */
.idol-stats-left {
  position: absolute;
  top: 80px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 2;

  .affection-row,
  .stamina-row {
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 15px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .affection-row {
    .label {
      font-size: 12px;
      color: #666;
    }
    .value {
      font-size: 20px;
      font-weight: bold;
      color: #ff69b4;
      small {
        font-size: 14px;
        color: #999;
      }
    }
  }

  .stamina-row {
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
    .stat-icon {
      width: 20px;
      height: 20px;
    }
    .value {
      font-size: 20px;
      font-weight: bold;
      color: white;
    }
  }
}

/* 三维属性圆圈 (左下角) */
.dimension-circles-bottom {
  position: absolute;
  bottom: 80px;
  left: 20px;
  display: flex;
  gap: 15px;
  z-index: 2;

  .circle-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;

    .circle-bg {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;

      .grade {
        font-size: 24px;
        font-weight: bold;
        color: white;
      }
    }

    .stat-info {
      background: rgba(0, 0, 0, 0.6);
      padding: 4px 10px;
      border-radius: 15px;
      display: flex;
      align-items: center;
      gap: 5px;

      .dim-icon {
        width: 16px;
        height: 16px;
      }

      .stat-value {
        font-size: 14px;
        font-weight: bold;
        color: white;
      }
    }

    &.vocal .circle-bg {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    &.dance .circle-bg {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    &.visual .circle-bg {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }
  }
}

.idol-info {
  position: absolute;
  top: 20px;
  right: 20px;
  text-align: right;

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

  .idol-song {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 5px;
  }
}

.idol-stats {
  position: absolute;
  top: 120px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;

  .stat-row,
  .affection-row,
  .stamina-row {
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 15px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .affection-row {
    .label {
      font-size: 12px;
      color: #666;
    }
    .value {
      font-size: 20px;
      font-weight: bold;
      color: #ff69b4;
      small {
        font-size: 14px;
        color: #999;
      }
    }
  }

  .stamina-row {
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
    .stat-icon {
      width: 20px;
      height: 20px;
    }
    .value {
      font-size: 20px;
      font-weight: bold;
      color: white;
    }
  }
}

.dimension-circles {
  position: absolute;
  top: 250px;
  right: 20px;
  display: flex;
  gap: 15px;

  .circle-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;

    .circle-bg {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;

      .grade {
        font-size: 28px;
        font-weight: bold;
        color: white;
      }
    }

    .stat-info {
      background: rgba(0, 0, 0, 0.6);
      padding: 4px 10px;
      border-radius: 15px;
      display: flex;
      align-items: center;
      gap: 5px;

      .dim-icon {
        width: 16px;
        height: 16px;
      }

      .stat-value {
        font-size: 14px;
        font-weight: bold;
        color: white;
      }

      .stat-percent {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
      }
    }

    &.vocal .circle-bg {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    &.dance .circle-bg {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    &.visual .circle-bg {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }
  }
}

.bonus-preview {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 15px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  .bonus-title {
    font-size: 14px;
    color: #666;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    i {
      color: #667eea;
    }
  }

  .bonus-content {
    display: flex;
    align-items: center;
    gap: 15px;

    .label {
      font-size: 12px;
      color: #888;
    }

    .bonus-value {
      font-size: 18px;
      color: #ff69b4;

      strong {
        font-size: 24px;
      }
    }
  }
}

/* 右侧支援卡区域 */
.support-section {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 预设导航 */
.preset-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 10px;
}

.preset-arrow {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: rgba(255, 105, 180, 0.3);
  border: 2px solid rgba(255, 105, 180, 0.6);
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 105, 180, 0.5);
    transform: scale(1.1);
  }
}

.preset-info {
  text-align: center;
  min-width: 180px;
}

.preset-name-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  transition: all 0.2s;

  span {
    font-size: 16px;
    font-weight: bold;
    color: white;
  }

  i {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.preset-name-input {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid #ff69b4;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  text-align: center;
  width: 180px;
  outline: none;
}

.preset-index {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 5px;
}

.p-items-row {
  display: flex;
  gap: 10px;
  justify-content: flex-end;

  .p-item-slot {
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px dashed rgba(255, 255, 255, 0.3);

    i {
      color: rgba(255, 255, 255, 0.3);
      font-size: 20px;
    }
  }
}

.support-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  flex: 1;
}

.support-slot {
  aspect-ratio: 3/4;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  border: 3px dashed rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }

  &.selected {
    border-color: #ff69b4;
    border-style: solid;
    box-shadow: 0 0 20px rgba(255, 105, 180, 0.5);
  }

  &.filled {
    border-style: solid;
    border-color: rgba(255, 255, 255, 0.5);
  }

  &.rental-only {
    background: linear-gradient(135deg, rgba(100, 100, 100, 0.3) 0%, rgba(50, 50, 50, 0.3) 100%);
  }

  .slot-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
  }

  .slot-level {
    position: absolute;
    bottom: 30px;
    left: 5px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: bold;
  }

  .slot-stars {
    position: absolute;
    bottom: 5px;
    left: 5px;
    right: 5px;
    display: flex;
    justify-content: center;
    gap: 2px;

    .star {
      font-size: 14px;
      &.filled {
        color: #ffd700;
      }
      &.empty {
        color: rgba(255, 255, 255, 0.3);
      }
    }
  }

  .empty-slot {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.5);

    .rental-label {
      font-size: 12px;
    }

    i {
      font-size: 30px;
    }
  }
}

.formation-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  border-radius: 25px;

  .save-btn {
    background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%);
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
    color: white;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 15px rgba(255, 105, 180, 0.5);
    }
  }

  .reset-btn,
  .auto-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 20px;
    padding: 10px 20px;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

/* 底部卡片列表 */
.card-list-section {
  height: 180px;
  background: rgba(0, 0, 0, 0.4);
  padding: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.list-scroll-container {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 10px;

  .scroll-btn {
    width: 40px;
    height: 60px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.card-list {
  flex: 1;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 5px;

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
}

.support-card-item {
  flex-shrink: 0;
  width: 100px;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 3px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    border-color: rgba(255, 255, 255, 0.5);
  }

  &.selected {
    border-color: #ff69b4;
    opacity: 0.7;
  }

  &.disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-level {
    position: absolute;
    bottom: 25px;
    left: 5px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: bold;
  }

  .card-stars {
    position: absolute;
    bottom: 5px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 10px;
    color: #ffd700;
  }

  .selected-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 105, 180, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      font-size: 30px;
      color: white;
    }
  }
}

/* 底部按钮 */
.bottom-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 15px;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.5) 100%);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 25px;
  border-radius: 30px;
  border: none;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &.info-btn,
  &.detail-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  &.next-btn {
    background: linear-gradient(135deg, #ff9500 0%, #ff5e00 100%);
    color: white;
    padding: 15px 40px;
    font-size: 16px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(255, 149, 0, 0.5);
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
  max-width: 900px;
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
  background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%);
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
  min-height: 180px;
}

.detail-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;

  .detail-header {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }

  .acquired-items {
    display: flex;
    gap: 10px;
  }

  .item-card {
    background: white;
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    min-width: 120px;

    .item-label {
      font-size: 12px;
      color: #22c55e;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .item-content {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }
  }

  .skill-support {
    font-size: 14px;
    color: #ff69b4;
    display: flex;
    align-items: center;
    gap: 8px;
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
    padding: 12px 15px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #333;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.08);

    i {
      color: #3b82f6;
    }
  }
}

.page-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;

  span {
    font-size: 14px;
    color: #666;
  }

  .page-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: white;
    border: 1px solid #ddd;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f0f0f0;
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
  max-height: 300px;
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
    border-color: #ff69b4;
    box-shadow: 0 0 15px rgba(255, 105, 180, 0.5);
  }

  &.selected {
    opacity: 0.6;
  }

  &.disabled {
    filter: grayscale(1);
    opacity: 0.4;
    cursor: not-allowed;
  }

  .picker-card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .picker-card-level {
    position: absolute;
    bottom: 5px;
    left: 5px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 5px;
  }

  .picker-card-stars {
    position: absolute;
    bottom: 5px;
    right: 5px;
    color: gold;
    font-size: 10px;
  }

  .picker-selected-badge {
    position: absolute;
    top: 5px;
    right: 5px;
    background: #ff69b4;
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
      background: linear-gradient(135deg, #ff9500 0%, #ff5e00 100%);
      color: white;

      &:hover {
        box-shadow: 0 4px 15px rgba(255, 149, 0, 0.4);
      }

      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    }
  }
}
</style>
