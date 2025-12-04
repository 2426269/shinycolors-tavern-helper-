<template>
  <div class="spine-interaction-layer" @click="handleClick">
    <!-- 点击区域划分 -->
    <div class="click-zone head" @click.stop="handleHeadClick"></div>
    <div class="click-zone body" @click.stop="handleBodyClick"></div>
    <div class="click-zone hand" @click.stop="handleHandClick"></div>

    <!-- 点击反馈效果 -->
    <div
      v-for="(ripple, index) in ripples"
      :key="index"
      class="ripple"
      :style="{
        left: `${ripple.x}px`,
        top: `${ripple.y}px`,
      }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { spineAnimationManager } from '../工具/spine-animation-manager';

interface Ripple {
  x: number;
  y: number;
}

const emit = defineEmits<{
  click: [area: 'head' | 'body' | 'hand' | 'other'];
}>();

const ripples = ref<Ripple[]>([]);

/**
 * 播放点击反馈动画
 */
function playClickRipple(x: number, y: number) {
  ripples.value.push({ x, y });

  // 1秒后移除
  setTimeout(() => {
    ripples.value.shift();
  }, 1000);
}

/**
 * 处理头部点击
 */
function handleHeadClick(event: MouseEvent) {
  console.log('👆 点击头部');
  playClickRipple(event.offsetX, event.offsetY);
  spineAnimationManager.playInteraction('Touch_Head');
  emit('click', 'head');
}

/**
 * 处理身体点击
 */
function handleBodyClick(event: MouseEvent) {
  console.log('👆 点击身体');
  playClickRipple(event.offsetX, event.offsetY);
  spineAnimationManager.playInteraction('Touch_Body');
  emit('click', 'body');
}

/**
 * 处理手部点击
 */
function handleHandClick(event: MouseEvent) {
  console.log('👆 点击手部');
  playClickRipple(event.offsetX, event.offsetY);
  spineAnimationManager.playInteraction('Touch_Hand');
  emit('click', 'hand');
}

/**
 * 处理其他区域点击
 */
function handleClick(event: MouseEvent) {
  console.log('👆 点击其他区域');
  playClickRipple(event.offsetX, event.offsetY);
  emit('click', 'other');
}
</script>

<style scoped lang="scss">
.spine-interaction-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: pointer;
  user-select: none;
}

.click-zone {
  position: absolute;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.head {
    top: 0;
    left: 30%;
    right: 30%;
    height: 25%;
    border-radius: 50% 50% 0 0;
  }

  &.body {
    top: 25%;
    left: 20%;
    right: 20%;
    height: 45%;
  }

  &.hand {
    top: 30%;
    left: 0;
    right: 0;
    height: 30%;
  }
}

.ripple {
  position: absolute;
  width: 60px;
  height: 60px;
  margin-left: -30px;
  margin-top: -30px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 70%);
  animation: ripple-expand 1s ease-out;
  pointer-events: none;
}

@keyframes ripple-expand {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}
</style>

