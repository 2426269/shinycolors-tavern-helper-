<template>
  <div
    class="skill-card"
    :class="[
      `rarity-${card.rarity}`,
      `type-${card.type}`,
      {
        selected: selected,
        enhanced: card.enhanced,
        unique: card.unique,
        disabled: !card.isUsable,
      },
    ]"
    @click="$emit('click')"
  >
    <!-- 卡牌背景图 -->
    <div class="card-bg">
      <img :src="card.imageUrl" :alt="card.name" @error="handleImageError" />
    </div>

    <!-- 卡牌框架 -->
    <div class="card-frame" :style="{ borderColor: frameColor }"></div>

    <!-- 卡牌头部 -->
    <div class="card-header">
      <div class="card-name">{{ card.name }}</div>
      <div class="card-rarity-badge" :style="{ background: rarityColor }">
        {{ card.rarity }}
      </div>
    </div>

    <!-- Cost显示 -->
    <div class="card-cost" :class="{ 'cost-stamina': card.costType === 'stamina_only' }">
      <div class="cost-value">{{ Math.abs(card.cost) }}</div>
      <div class="cost-label">{{ costLabel }}</div>
    </div>

    <!-- 卡牌类型图标 -->
    <div class="card-type-icon">{{ typeIcon }}</div>

    <!-- 卡牌效果描述 -->
    <div class="card-description">
      <div class="description-text">{{ truncatedDescription }}</div>
    </div>

    <!-- 强化标记 -->
    <div v-if="card.enhanced" class="enhanced-badge">强化</div>

    <!-- 重复不可标记 -->
    <div v-if="card.unique" class="unique-badge">重复不可</div>

    <!-- 光晕效果 -->
    <div v-if="selected" class="card-glow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SkillCard } from '../types';

// ========== Props ==========
interface Props {
  card: SkillCard;
  selected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
});

// ========== Emits ==========
defineEmits<{
  click: [];
}>();

// ========== Computed ==========
const frameColor = computed(() => {
  const colors: Record<string, string> = {
    N: '#ffffff',
    R: '#ffffff',
    SR: '#ffd700',
    SSR: 'linear-gradient(45deg, #ff6ec4, #7873f5, #4bffff)',
    UR: 'linear-gradient(45deg, #ffd700, #ff6ec4, #7873f5)',
    陷阱卡: '#8b008b',
  };
  return colors[props.card.rarity] || '#ffffff';
});

const rarityColor = computed(() => {
  const colors: Record<string, string> = {
    N: '#9e9e9e',
    R: '#2196f3',
    SR: '#ffa726',
    SSR: '#e91e63',
    UR: '#9c27b0',
    陷阱卡: '#8b008b',
  };
  return colors[props.card.rarity] || '#9e9e9e';
});

const typeIcon = computed(() => {
  const icons: Record<string, string> = {
    A: '⚡', // Active
    M: '🧠', // Mental
    T: '⚠️', // Trap
  };
  return icons[props.card.type] || '❓';
});

const costLabel = computed(() => {
  return props.card.costType === 'stamina_only' ? '体力' : '元气';
});

const truncatedDescription = computed(() => {
  const desc = props.card.description;
  return desc.length > 100 ? desc.substring(0, 100) + '...' : desc;
});

// ========== Methods ==========
function handleImageError(event: Event) {
  // 图片加载失败时使用占位图
  (event.target as HTMLImageElement).src = 'https://via.placeholder.com/200x280?text=No+Image';
}
</script>

<style scoped lang="scss">
.skill-card {
  position: relative;
  width: 200px;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;

  &:hover:not(.disabled) {
    transform: translateY(-10px) scale(1.05);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  &.selected {
    transform: translateY(-15px) scale(1.1);
    box-shadow: 0 15px 40px rgba(255, 215, 0, 0.6);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }
}

// 卡牌背景图
.card-bg {
  position: absolute;
  inset: 0;
  z-index: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

// 卡牌框架
.card-frame {
  position: absolute;
  inset: 0;
  z-index: 2;
  border: 4px solid;
  border-radius: 12px;
  pointer-events: none;
}

// 品阶特殊效果
.rarity-SSR .card-frame {
  border-image: linear-gradient(45deg, #ff6ec4, #7873f5, #4bffff) 1;
  animation: rainbow-border 3s linear infinite;
}

.rarity-UR .card-frame {
  border-image: linear-gradient(45deg, #ffd700, #ff6ec4, #7873f5) 1;
  animation: rainbow-border 2s linear infinite;
}

@keyframes rainbow-border {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}

// 卡牌头部
.card-header {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;

  .card-name {
    flex: 1;
    padding: 6px 10px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 6px;
    font-size: 14px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-rarity-badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
  }
}

// Cost显示
.card-cost {
  position: absolute;
  top: 50px;
  right: 8px;
  z-index: 3;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #ffeb3b, #ffc107);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  border: 3px solid #fff;

  &.cost-stamina {
    background: linear-gradient(135deg, #e91e63, #c2185b);
  }

  .cost-value {
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    line-height: 1;
  }

  .cost-label {
    font-size: 10px;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
}

// 卡牌类型图标
.card-type-icon {
  position: absolute;
  top: 50px;
  left: 8px;
  z-index: 3;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 2px solid #fff;
}

// 卡牌描述
.card-description {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  padding: 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  min-height: 80px;
  display: flex;
  align-items: flex-end;

  .description-text {
    font-size: 11px;
    line-height: 1.4;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }
}

// 强化标记
.enhanced-badge {
  position: absolute;
  top: 45px;
  left: -25px;
  z-index: 4;
  padding: 4px 30px;
  background: linear-gradient(135deg, #4caf50, #8bc34a);
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  transform: rotate(-45deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

// 重复不可标记
.unique-badge {
  position: absolute;
  top: 110px;
  left: 8px;
  z-index: 3;
  padding: 3px 8px;
  background: rgba(255, 87, 34, 0.9);
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

// 光晕效果
.card-glow {
  position: absolute;
  inset: -10px;
  z-index: 0;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.6), rgba(255, 215, 0, 0.3), transparent);
  border-radius: 20px;
  animation: glow-pulse 1.5s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
</style>
