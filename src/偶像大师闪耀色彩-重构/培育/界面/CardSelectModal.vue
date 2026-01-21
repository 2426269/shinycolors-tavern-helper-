<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('cancel')">
      <div class="modal-content">
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>

        <div class="card-grid">
          <div
            v-for="card in cards"
            :key="card.id"
            class="card-item"
            :class="{ selected: selectedId === card.id, enhanced: card.isEnhanced }"
            @click="handleSelect(card)"
          >
            <img :src="card.imageUrl" :alt="card.name" class="card-image" />
            <div class="card-info">
              <span class="card-name">{{ card.name }}</span>
              <span v-if="card.isEnhanced" class="enhanced-badge">+</span>
            </div>
            <div v-if="selectedId === card.id" class="check-mark">✓</div>
          </div>
        </div>

        <div v-if="selectedCard" class="selected-info">
          已选择: {{ selectedCard.name }}{{ selectedCard.isEnhanced ? '+' : '' }}
        </div>

        <div class="modal-buttons">
          <button class="btn-confirm" :disabled="!selectedId" :data-mode="mode" @click="handleConfirm">
            {{ confirmText }} (Ⓟ {{ price }})
          </button>
          <button class="btn-cancel" @click="$emit('cancel')">取消</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface CardInfo {
  id: string;
  name: string;
  imageUrl: string;
  isEnhanced: boolean;
}

const props = defineProps<{
  visible: boolean;
  cards: CardInfo[];
  title: string;
  description: string;
  confirmText: string;
  mode: 'enhance' | 'delete';
  price: number;
}>();

const emit = defineEmits<{
  (e: 'confirm', card: CardInfo): void;
  (e: 'cancel'): void;
}>();

const selectedId = ref<string | null>(null);

const selectedCard = computed(() => props.cards.find(c => c.id === selectedId.value) || null);

// 重置选择状态
watch(
  () => props.visible,
  visible => {
    if (visible) {
      selectedId.value = null;
    }
  },
);

function handleSelect(card: CardInfo) {
  // 强化模式下，已强化的卡不能再强化
  if (props.mode === 'enhance' && card.isEnhanced) {
    return;
  }
  selectedId.value = selectedId.value === card.id ? null : card.id;
}

function handleConfirm() {
  if (!selectedCard.value) return;
  emit('confirm', selectedCard.value);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 20px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  text-align: center;
}

.modal-content h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
}

.modal-content p {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.card-item {
  position: relative;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-item:hover:not(.enhanced) {
  background: #e8f5e9;
}

.card-item.selected {
  border-color: #4caf50;
  background: #e8f5e9;
}

.card-item.enhanced {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 6px;
}

.card-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.card-name {
  font-size: 11px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.enhanced-badge {
  background: linear-gradient(135deg, #ffeb3b, #ff9800);
  color: #333;
  font-size: 10px;
  font-weight: bold;
  padding: 1px 4px;
  border-radius: 4px;
}

.check-mark {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: #4caf50;
  color: white;
  border-radius: 50%;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-info {
  font-size: 14px;
  color: #333;
  margin-bottom: 16px;
  padding: 8px;
  background: #e8f5e9;
  border-radius: 8px;
}

.modal-buttons {
  display: flex;
  gap: 12px;
}

.btn-confirm,
.btn-cancel {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-confirm {
  background: linear-gradient(135deg, #ffeb3b, #ff9800);
  color: #333;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #eee;
}

/* 删除模式样式 */
.modal-content:has(.btn-confirm[data-mode='delete']) .btn-confirm {
  background: linear-gradient(135deg, #f44336, #e53935);
  color: white;
}
</style>
