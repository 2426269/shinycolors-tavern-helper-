<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('cancel')">
      <div class="modal-content">
        <h3>饮料背包已满</h3>
        <p>请选择要保留的 {{ maxSelect }} 个饮料</p>

        <div class="drink-grid">
          <div
            v-for="drink in drinks"
            :key="drink.id"
            class="drink-item"
            :class="{ selected: selectedIds.has(drink.id) }"
            @click="toggleSelect(drink.id)"
          >
            <img :src="drink.iconUrl" :alt="drink.nameCN" class="drink-icon" />
            <span class="drink-name">{{ drink.nameCN }}</span>
            <div v-if="selectedIds.has(drink.id)" class="check-mark">✓</div>
          </div>
        </div>

        <div class="selection-info">已选择 {{ selectedIds.size }} / {{ maxSelect }}</div>

        <div class="modal-buttons">
          <button class="btn-confirm" :disabled="selectedIds.size !== maxSelect" @click="handleConfirm">确认</button>
          <button class="btn-cancel" @click="$emit('cancel')">取消</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

// 简化的饮料类型，只需要显示所需的字段
interface DrinkWithIcon {
  id: string;
  nameCN: string;
  iconUrl: string;
}

const props = defineProps<{
  visible: boolean;
  drinks: DrinkWithIcon[];
  maxSelect: number; // 通常为 3
}>();

const emit = defineEmits<{
  (e: 'confirm', selectedDrinks: DrinkWithIcon[]): void;
  (e: 'cancel'): void;
}>();

const selectedIds = ref(new Set<string>());

// 重置选择状态
watch(
  () => props.visible,
  visible => {
    if (visible) {
      // 默认选择前 maxSelect 个
      selectedIds.value = new Set(props.drinks.slice(0, props.maxSelect).map(d => d.id));
    }
  },
);

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else if (selectedIds.value.size < props.maxSelect) {
    selectedIds.value.add(id);
  }
  // Force reactivity
  selectedIds.value = new Set(selectedIds.value);
}

function handleConfirm() {
  if (selectedIds.value.size !== props.maxSelect) return;
  const selected = props.drinks.filter(d => selectedIds.value.has(d.id));
  emit('confirm', selected);
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
  max-width: 360px;
  width: 90%;
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

.drink-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.drink-item {
  position: relative;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drink-item:hover {
  background: #e8f5e9;
}

.drink-item.selected {
  border-color: #4caf50;
  background: #e8f5e9;
}

.drink-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-bottom: 8px;
}

.drink-name {
  display: block;
  font-size: 12px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #4caf50;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
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
  background: linear-gradient(135deg, #4caf50, #66bb6a);
  color: white;
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
</style>
