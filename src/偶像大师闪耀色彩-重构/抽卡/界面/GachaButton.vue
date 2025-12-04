<template>
  <button class="gacha-button" :class="[type, { disabled: !canAfford }]" :disabled="!canAfford" @click="handleClick">
    <div class="button-content">
      <span class="type-label">{{ label }}</span>
      <span class="cost">
        <img :src="FEATHER_STONE_IMAGE" alt="羽石" class="feather-icon" />
        {{ cost.toLocaleString() }}
      </span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FEATHER_STONE_IMAGE } from '../../工具/constants';

const props = defineProps<{
  type: 'single' | 'ten';
  cost: number;
  gems: number;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const label = computed(() => (props.type === 'single' ? '单抽' : '十连'));
const canAfford = computed(() => props.gems >= props.cost);

function handleClick() {
  if (canAfford.value) {
    emit('click');
  } else {
    toastr.error('羽石不足！');
  }
}
</script>

<style scoped lang="scss">
.gacha-button {
  padding: 25px 50px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }

  &:hover:not(.disabled)::before {
    left: 100%;
  }

  &.single {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.ten {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &:hover:not(.disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }

  &:active:not(.disabled) {
    transform: translateY(-1px);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: white;
  position: relative;
  z-index: 1;

  .type-label {
    font-size: 24px;
    font-weight: bold;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .cost {
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 8px;

    .feather-icon {
      width: 24px;
      height: 24px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
  }
}
</style>
