<template>
  <div
    class="dynamic-badge"
    :class="[isDebuff ? 'debuff' : 'buff', { 'has-stacks': stacks > 1 }, { 'has-turns': turns > 0 }]"
    :style="badgeStyle"
    :title="tooltipText"
  >
    <!-- 图标区域 -->
    <div class="badge-icon">
      <img v-if="iconUrl" :src="iconUrl" :alt="shortName" class="icon-image" @error="handleImageError" />
      <span v-else class="icon-symbol">{{ symbol }}</span>
    </div>

    <!-- 层数显示 -->
    <span v-if="stacks > 1" class="badge-stacks">{{ stacks }}</span>

    <!-- 回合数显示 -->
    <span v-if="turns > 0" class="badge-turns">{{ turns }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Props {
  /** 唯一标识符 */
  id: string;
  /** 显示符号（1-2个字符） */
  symbol: string;
  /** 简短名称 */
  shortName: string;
  /** 详细描述 */
  description?: string;
  /** 主题颜色（十六进制） */
  color: string;
  /** 是否为负面效果 */
  isDebuff?: boolean;
  /** 层数 */
  stacks?: number;
  /** 剩余回合数 */
  turns?: number;
  /** 图标URL（可选，优先于symbol） */
  iconUrl?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isDebuff: false,
  stacks: 1,
  turns: 0,
  description: '',
});

const imageError = ref(false);

/** 计算 badge 样式 */
const badgeStyle = computed(() => {
  const baseColor = props.color || (props.isDebuff ? '#FF6B6B' : '#7A5CFF');
  return {
    '--badge-color': baseColor,
    '--badge-color-light': `${baseColor}33`,
    '--badge-color-dark': adjustColor(baseColor, -30),
  };
});

/** 计算 tooltip 文本 */
const tooltipText = computed(() => {
  let text = props.shortName;
  if (props.stacks > 1) {
    text += ` (${props.stacks}层)`;
  }
  if (props.turns > 0) {
    text += ` [${props.turns}回合]`;
  }
  if (props.description) {
    text += `\n${props.description}`;
  }
  return text;
});

/** 处理图片加载错误 */
function handleImageError() {
  imageError.value = true;
}

/** 调整颜色亮度 */
function adjustColor(hex: string, amount: number): string {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
</script>

<style scoped>
.dynamic-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--badge-color-light) 0%, var(--badge-color) 100%);
  border: 2px solid var(--badge-color);
  box-shadow: 0 2px 8px var(--badge-color-light);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dynamic-badge:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px var(--badge-color);
}

.dynamic-badge.debuff {
  border-style: dashed;
}

/* 图标区域 */
.badge-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.icon-image {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.icon-symbol {
  font-size: 16px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 层数显示 */
.badge-stacks {
  position: absolute;
  bottom: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--badge-color-dark);
  color: white;
  font-size: 10px;
  font-weight: bold;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* 回合数显示 */
.badge-turns {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 14px;
  height: 14px;
  padding: 0 3px;
  background: #333;
  color: #ffd700;
  font-size: 9px;
  font-weight: bold;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ffd700;
}

/* 同时有层数和回合时调整位置 */
.has-stacks.has-turns .badge-turns {
  top: -4px;
  left: -4px;
  right: auto;
}
</style>
