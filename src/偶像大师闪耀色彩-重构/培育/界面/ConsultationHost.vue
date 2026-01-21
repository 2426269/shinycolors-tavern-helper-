<template>
  <div class="consultation-host">
    <!-- 顶部状态栏 (复用 ProduceMainPage 样式) -->
    <div class="top-bar">
      <!-- 左侧：相談标签 -->
      <div class="top-left">
        <div class="label-box">
          <span class="label">相谈</span>
          <div class="avatar-placeholder">😊</div>
        </div>
      </div>

      <!-- 中间：体力条和 P 点 -->
      <div class="status-bars">
        <!-- 体力条 -->
        <div class="hp-container">
          <div class="hp-bar-wrapper">
            <div class="hp-bar-bg"></div>
            <div class="hp-bar-fill" :style="{ width: staminaPercent + '%' }"></div>
          </div>
          <div class="hp-info">
            <span class="hp-icon">💚</span>
            <span class="hp-value">{{ stamina }}/{{ maxStamina }}</span>
          </div>
        </div>
        <!-- P 点 -->
        <div class="p-point-container">
          <div class="p-point-bar">
            <span class="p-label">Ⓟ</span>
            <span class="p-value">{{ pPoints }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：审查基准 -->
      <div class="right-section">
        <div class="score-target">
          <span class="label">审查基准</span>
          <span class="value">{{ targetScore }}</span>
        </div>
      </div>
    </div>

    <!-- 对话框 -->
    <div class="dialog-box">
      <p>请选择要用 P 点交换的物品</p>
    </div>

    <!-- 商品区域 -->
    <div class="shop-area">
      <!-- 卡牌区 (上排 4个) -->
      <div class="product-row cards-row">
        <ProductCard
          v-for="item in cardItems"
          :key="item.id"
          :item="item"
          :can-afford="pPoints >= item.price"
          :is-selected="selectedItem?.id === item.id"
          @click="handleItemClick(item)"
        />
      </div>

      <!-- 饮料区 (下排 4个) -->
      <div class="product-row drinks-row">
        <ProductCard
          v-for="item in drinkItems"
          :key="item.id"
          :item="item"
          :can-afford="pPoints >= item.price"
          :is-selected="selectedItem?.id === item.id"
          @click="handleItemClick(item)"
        />
      </div>
    </div>

    <!-- 强化/删除提示 -->
    <div class="management-hint">可以对持有的技能卡进行强化或删除</div>

    <!-- 强化/删除按钮 -->
    <div class="management-buttons">
      <button class="btn-enhance" :disabled="!canEnhance" @click="handleEnhance">
        <span class="icon">✦</span>
        <span class="text">强化</span>
        <span class="p-badge">Ⓟ {{ enhancePrice }}</span>
      </button>
      <button class="btn-delete" :disabled="!canDelete" @click="handleDelete">
        <span class="icon">✕</span>
        <span class="text">删除</span>
        <span class="p-badge">Ⓟ {{ deletePrice }}</span>
      </button>
    </div>

    <!-- 底部操作栏 -->
    <div class="bottom-bar">
      <button class="btn-confirm" :disabled="!hasSelection" @click="handleConfirm">
        <span class="icon">⇌</span>
        <span>交换</span>
      </button>
      <button class="btn-exit" @click="handleExit">
        <span class="icon">✕</span>
        <span>结束</span>
      </button>
    </div>

    <!-- 饮料选择弹窗 -->
    <DrinkSelectModal
      :visible="showDrinkSelectModal"
      :drinks="drinkSelectOptions"
      :max-select="DRINK_INVENTORY_LIMIT"
      @confirm="handleDrinkSelectConfirm"
      @cancel="showDrinkSelectModal = false"
    />

    <!-- 卡牌选择弹窗 (强化/删除) -->
    <CardSelectModal
      :visible="showCardSelectModal"
      :cards="deckCardsForModal"
      :title="cardModalConfig.title"
      :description="cardModalConfig.description"
      :confirm-text="cardModalConfig.confirmText"
      :mode="cardModalConfig.mode"
      :price="cardModalConfig.price"
      @confirm="handleCardSelectConfirm"
      @cancel="showCardSelectModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PDrink } from '../../战斗/类型/P饮料类型';
import {
  DRINK_INVENTORY_LIMIT,
  ENHANCE_LIMIT_PER_CONSULTATION,
  generateInventory,
  getShopItemImageUrl,
  REMOVE_LIMIT_PER_CONSULTATION,
} from '../服务/ConsultationService';
import type { ShopItem } from '../类型/ConsultationTypes';
import CardSelectModal from './CardSelectModal.vue';
import DrinkSelectModal from './DrinkSelectModal.vue';
import ProductCard from './ProductCard.vue';

// Props - 与 ProduceMainPage 共用的数据
const props = defineProps<{
  // 共用状态栏数据
  pPoints: number;
  stamina: number;
  maxStamina: number;
  targetScore: number;
  // 商店生成参数
  cardPool: any[];
  plan: 'sense' | 'logic' | 'anomaly';
  progress: number;
  // 当前持有的饮料列表 (用于选择弹窗)
  currentDrinks?: Array<{ id: string; nameCN: string; iconUrl: string }>;
  // 当前牌组 (用于强化/删除)
  currentDeck?: Array<{ id: string; name: string; imageUrl: string; isEnhanced: boolean }>;
  // 累计强化/删除次数 (用于计算价格)
  totalEnhanceCount?: number;
  totalDeleteCount?: number;
}>();

// Emits
const emit = defineEmits<{
  (e: 'purchase', item: ShopItem): void;
  (e: 'purchaseDrinkWithSwap', item: ShopItem, selectedDrinks: any[]): void;
  (e: 'enhanceCard', cardId: string): void;
  (e: 'deleteCard', cardId: string): void;
  (e: 'exit'): void;
  (e: 'update:pPoints', value: number): void;
}>();

// State
const inventory = ref<ShopItem[]>([]);
const selectedItem = ref<ShopItem | null>(null);
const enhanceCount = ref(0);
const deleteCount = ref(0);

// 饮料选择弹窗状态
const showDrinkSelectModal = ref(false);
const pendingDrinkPurchase = ref<ShopItem | null>(null);
const drinkSelectOptions = ref<Array<{ id: string; nameCN: string; iconUrl: string }>>([]);

// 卡牌选择弹窗状态 (强化/删除)
const showCardSelectModal = ref(false);
const cardModalMode = ref<'enhance' | 'delete'>('enhance');

interface CardModalConfig {
  title: string;
  description: string;
  confirmText: string;
  mode: 'enhance' | 'delete';
  price: number;
}

const cardModalConfig = computed<CardModalConfig>(() => ({
  title: cardModalMode.value === 'enhance' ? '选择要强化的卡牌' : '选择要删除的卡牌',
  description: cardModalMode.value === 'enhance' ? '强化后卡牌效果将提升' : '删除后卡牌将从牌组中移除',
  confirmText: cardModalMode.value === 'enhance' ? '强化' : '删除',
  mode: cardModalMode.value,
  price: cardModalMode.value === 'enhance' ? enhancePrice.value : deletePrice.value,
}));

// 牌组卡牌 (modal用)
const deckCardsForModal = computed(() => props.currentDeck || []);

// Computed
const staminaPercent = computed(() => (props.stamina / props.maxStamina) * 100);

const cardItems = computed(() => inventory.value.filter(i => i.type === 'card'));
const drinkItems = computed(() => inventory.value.filter(i => i.type === 'drink'));

// 动态价格计算：基础 100 + 次数 * 25
const enhancePrice = computed(() => 100 + (props.totalEnhanceCount || 0) * 25);
const deletePrice = computed(() => 100 + (props.totalDeleteCount || 0) * 25);

const canEnhance = computed(
  () => props.pPoints >= enhancePrice.value && enhanceCount.value < ENHANCE_LIMIT_PER_CONSULTATION,
);

const canDelete = computed(
  () => props.pPoints >= deletePrice.value && deleteCount.value < REMOVE_LIMIT_PER_CONSULTATION,
);

const hasSelection = computed(() => selectedItem.value !== null && !selectedItem.value.isSoldOut);

// Methods
function handleItemClick(item: ShopItem) {
  if (item.isSoldOut) return;
  if (props.pPoints < item.price) return;
  selectedItem.value = selectedItem.value?.id === item.id ? null : item;
}

function handleConfirm() {
  if (!selectedItem.value) return;

  const item = selectedItem.value;

  // 如果是饮料且背包已满，弹出选择弹窗
  if (item.type === 'drink') {
    const currentCount = props.currentDrinks?.length ?? 0;
    if (currentCount >= DRINK_INVENTORY_LIMIT) {
      // 准备选择弹窗数据：当前持有的 + 新购买的
      const newDrink = item.data as PDrink;
      const newDrinkWithIcon = {
        id: newDrink.id,
        nameCN: newDrink.nameCN,
        iconUrl: getShopItemImageUrl(item),
      };
      drinkSelectOptions.value = [...(props.currentDrinks || []), newDrinkWithIcon];
      pendingDrinkPurchase.value = item;
      showDrinkSelectModal.value = true;
      return;
    }
  }

  // 正常购买流程
  emit('purchase', item);
  item.isSoldOut = true;
  selectedItem.value = null;
}

// 饮料选择确认
function handleDrinkSelectConfirm(selectedDrinks: any[]) {
  if (!pendingDrinkPurchase.value) return;

  emit('purchaseDrinkWithSwap', pendingDrinkPurchase.value, selectedDrinks);
  pendingDrinkPurchase.value.isSoldOut = true;

  // 重置状态
  showDrinkSelectModal.value = false;
  pendingDrinkPurchase.value = null;
  selectedItem.value = null;
}

// 强化按钮点击 - 打开卡牌选择弹窗
function handleEnhance() {
  if (!canEnhance.value) return;
  cardModalMode.value = 'enhance';
  showCardSelectModal.value = true;
}

// 删除按钮点击 - 打开卡牌选择弹窗
function handleDelete() {
  if (!canDelete.value) return;
  cardModalMode.value = 'delete';
  showCardSelectModal.value = true;
}

// 卡牌选择确认 (强化/删除)
function handleCardSelectConfirm(card: { id: string; name: string; imageUrl: string; isEnhanced: boolean }) {
  if (cardModalMode.value === 'enhance') {
    enhanceCount.value++;
    emit('enhanceCard', card.id);
  } else {
    deleteCount.value++;
    emit('deleteCard', card.id);
  }
  showCardSelectModal.value = false;
}

function handleExit() {
  emit('exit');
}

// Initialize
function initInventory() {
  inventory.value = generateInventory(props.plan, props.progress, props.cardPool);
}

// Watch for cardPool changes
watch(() => props.cardPool, initInventory, { immediate: true });
</script>

<style scoped>
.consultation-host {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  background: linear-gradient(135deg, #e8f5e9 0%, #fff9c4 50%, #fce4ec 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Noto Sans SC', 'Noto Sans JP', sans-serif;
}

/* 顶部状态栏 - 复用 ProduceMainPage 样式 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(8px);
}

.top-left {
  display: flex;
  align-items: center;
}

.label-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 12px;
}

.label-box .label {
  font-size: 10px;
  color: #666;
  margin-bottom: 4px;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  background: #c8e6c9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.status-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

/* 体力条 */
.hp-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hp-bar-wrapper {
  width: 100px;
  height: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  overflow: hidden;
  position: relative;
}

.hp-bar-bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.1);
}

.hp-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 5px;
  transition: width 0.3s ease;
}

.hp-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hp-icon {
  font-size: 12px;
}

.hp-value {
  color: white;
  font-size: 12px;
  font-weight: bold;
}

/* P 点 */
.p-point-container {
  display: flex;
  align-items: center;
}

.p-point-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 152, 0, 0.3);
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 152, 0, 0.5);
}

.p-label {
  font-weight: bold;
  color: #ffb74d;
  font-size: 14px;
}

.p-value {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

/* 右侧 */
.right-section {
  text-align: right;
}

.score-target .label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  display: block;
}

.score-target .value {
  font-size: 16px;
  font-weight: bold;
  color: white;
}

/* 对话框 */
.dialog-box {
  margin: 12px 16px;
  padding: 20px 16px;
  background: linear-gradient(135deg, #fffde7, #fff8e1);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.dialog-box p {
  margin: 0;
  font-size: 14px;
  color: #333;
}

/* 商品区域 */
.shop-area {
  padding: 0 12px;
  flex: 1;
}

.product-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

/* 管理区域 */
.management-hint {
  text-align: center;
  font-size: 12px;
  color: #666;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.7);
  margin: 8px 16px;
  border-radius: 20px;
}

.management-buttons {
  display: flex;
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 12px;
}

.btn-enhance,
.btn-delete {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-enhance {
  background: linear-gradient(135deg, #ffeb3b, #ff9800);
  color: #333;
}

.btn-delete {
  background: linear-gradient(135deg, #e0f7fa, #80deea);
  color: #333;
}

.btn-enhance:disabled,
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-enhance:hover:not(:disabled),
.btn-delete:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.p-badge {
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

/* 底部操作栏 */
.bottom-bar {
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
}

.btn-confirm,
.btn-exit {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: none;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm {
  background: linear-gradient(135deg, #4dd0e1, #26c6da);
  color: white;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-exit {
  background: #f5f5f5;
  color: #666;
}

.btn-exit:hover {
  background: #eeeeee;
}
</style>
