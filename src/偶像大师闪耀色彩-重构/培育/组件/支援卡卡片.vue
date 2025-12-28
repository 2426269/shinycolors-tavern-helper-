<template>
  <div
    class="support-card"
    :class="{
      selected: selected,
      disabled: disabled,
      ssr: rarity === 'SSR',
      sr: rarity === 'SR',
      r: rarity === 'R',
    }"
    @click="handleClick"
  >
    <!-- 卡面图片 -->
    <div class="card-image-container">
      <img :src="imageUrl" :alt="cardName" class="card-image" @error="onImageError" />

      <!-- 稀有度边框光效 -->
      <div class="rarity-border"></div>
    </div>

    <!-- 等级显示 -->
    <div class="card-level">
      <span class="lv">Lv</span>
      <span class="level-value">{{ level }}</span>
    </div>

    <!-- 突破星星 -->
    <div class="card-stars">
      <span v-for="i in uncap" :key="'f' + i" class="star filled">★</span>
      <span v-for="i in maxUncap - uncap" :key="'e' + i" class="star empty">☆</span>
    </div>

    <!-- 角色名 -->
    <div class="card-name">{{ characterName }}</div>

    <!-- 选中遮罩 -->
    <div v-if="selected" class="selected-overlay">
      <i class="fas fa-check-circle"></i>
    </div>

    <!-- 禁用遮罩 -->
    <div v-if="disabled" class="disabled-overlay">
      <i class="fas fa-ban"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  id: string;
  imageUrl: string;
  cardName: string;
  characterName: string;
  rarity: 'R' | 'SR' | 'SSR';
  level: number;
  uncap: number;
  maxUncap?: number;
  selected?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  click: [id: string];
}>();

const maxUncap = computed(() => props.maxUncap ?? 4);

function handleClick() {
  if (!props.disabled) {
    emit('click', props.id);
  }
}

function onImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.src = 'https://placehold.co/200x280?text=No+Image';
}
</script>

<style scoped lang="scss">
.support-card {
  width: 120px;
  height: 168px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  background: #1a1a2e;

  &:hover:not(.disabled) {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }

  &.selected {
    opacity: 0.8;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // 稀有度样式
  &.ssr {
    .rarity-border {
      border: 3px solid;
      border-image: linear-gradient(135deg, #ffd700, #ff6b6b, #ffd700) 1;
      animation: rainbow-border 2s linear infinite;
    }
    .card-level {
      background: linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%);
    }
  }

  &.sr {
    .rarity-border {
      border: 3px solid #ffd700;
    }
    .card-level {
      background: linear-gradient(135deg, #ffd700 0%, #f0c000 100%);
    }
  }

  &.r {
    .rarity-border {
      border: 3px solid #c0c0c0;
    }
    .card-level {
      background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
    }
  }
}

@keyframes rainbow-border {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}

.card-image-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rarity-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border-radius: 12px;
}

.card-level {
  position: absolute;
  bottom: 35px;
  left: 5px;
  padding: 3px 8px;
  border-radius: 10px;
  display: flex;
  align-items: baseline;
  gap: 2px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);

  .lv {
    font-size: 10px;
    color: rgba(0, 0, 0, 0.7);
    font-weight: bold;
  }

  .level-value {
    font-size: 14px;
    font-weight: bold;
    color: #333;
  }
}

.card-stars {
  position: absolute;
  bottom: 18px;
  left: 5px;
  right: 5px;
  display: flex;
  justify-content: center;
  gap: 1px;

  .star {
    font-size: 12px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);

    &.filled {
      color: #ffd700;
    }

    &.empty {
      color: rgba(255, 255, 255, 0.4);
    }
  }
}

.card-name {
  position: absolute;
  bottom: 2px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 10px;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 5px;
}

.selected-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 105, 180, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;

  i {
    font-size: 40px;
    color: white;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }
}

.disabled-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;

  i {
    font-size: 30px;
    color: rgba(255, 255, 255, 0.7);
  }
}
</style>
