<template>
  <div v-if="isAnimating" class="gacha-animation-overlay" @click.stop>
    <!-- 右上角Skip按钮 -->
    <button class="skip-all-btn" @click="skipAll" title="跳过动画">
      <i class="fas fa-forward"></i>
      跳过
    </button>

    <div class="animation-container">
      <!-- 卡片背面 -->
      <div v-if="currentStep === 'flipping'" class="card-back" :class="`rarity-${currentCard?.rarity.toLowerCase()}`">
        <div class="card-pattern"></div>
      </div>

      <!-- 卡片正面（翻转后显示） -->
      <div v-if="currentStep === 'revealing'" class="card-front" :class="`rarity-${currentCard?.rarity.toLowerCase()}`">
        <div class="rarity-glow"></div>

        <!-- Loading占位图 -->
        <div v-if="imageLoading" class="image-loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 实际卡面图片 -->
        <img
          :src="cardImageUrl"
          :alt="currentCard?.fullCardName"
          class="card-image"
          :class="{ 'image-loaded': !imageLoading }"
          @load="handleImageLoaded"
          @error="handleImageError"
        />

        <div class="card-info">
          <div class="card-rarity">{{ currentCard?.rarity }}</div>
          <div class="card-name">{{ currentCard?.fullCardName }}</div>
        </div>
      </div>

      <!-- 底部导航按钮 -->
      <button v-if="currentStep === 'revealing'" class="next-btn" @click="handleNext">
        {{ isLastCard ? '查看结果' : '下一张' }}
        <i class="fas fa-arrow-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { GachaResult } from '../../../偶像大师闪耀色彩-gacha/types';
import { loadImageWithCache } from '../../工具/图片缓存';

const props = defineProps<{
  results: GachaResult[];
  isAnimating: boolean;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const currentIndex = ref(0);
const currentStep = ref<'flipping' | 'revealing'>('flipping');
const imageLoading = ref(true);
const cardImageUrl = ref('');

const currentCard = computed(() => props.results[currentIndex.value] || null);
const isLastCard = computed(() => currentIndex.value === props.results.length - 1);

// 使用 IndexedDB 缓存加载图片
watch(
  currentCard,
  async card => {
    if (card?.imageUrl) {
      imageLoading.value = true;
      try {
        cardImageUrl.value = await loadImageWithCache(card.imageUrl);
      } catch (error) {
        console.error('加载卡面失败:', error);
        cardImageUrl.value = card.imageUrl; // 降级到直接URL
      }
    }
  },
  { immediate: true },
);

// 监听动画开始
watch(
  () => props.isAnimating,
  isAnimating => {
    if (isAnimating) {
      currentIndex.value = 0;
      startAnimation();
    }
  },
);

function startAnimation() {
  currentStep.value = 'flipping';
  imageLoading.value = true; // 重置loading状态

  // 翻转动画：500ms
  setTimeout(() => {
    currentStep.value = 'revealing';
  }, 500);
}

function handleImageLoaded() {
  imageLoading.value = false;
}

function handleNext() {
  if (isLastCard.value) {
    // 最后一张，显示结果
    emit('complete');
  } else {
    // 下一张
    currentIndex.value++;
    startAnimation();
  }
}

function skipAll() {
  // 直接跳到最后一张并显示结果
  emit('complete');
}

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  console.error('卡面加载失败:', currentCard.value?.fullCardName, cardImageUrl.value);
  // 使用占位图
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
      <rect width="400" height="600" fill="#f0f0f0"/>
      <text x="200" y="280" font-family="Arial" font-size="24" fill="#999" text-anchor="middle">
        ${currentCard.value?.rarity || ''}
      </text>
      <text x="200" y="320" font-family="Arial" font-size="16" fill="#999" text-anchor="middle">
        ${currentCard.value?.characterName || ''}
      </text>
    </svg>
  `)}`;
}
</script>

<style scoped lang="scss">
.gacha-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
}

.skip-all-btn {
  position: fixed;
  top: 30px;
  right: 30px;
  z-index: 10000;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 30px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    font-size: 18px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.animation-container {
  position: relative;
  width: 600px; // 从400px增大到600px
  height: 900px; // 从600px增大到900px
  perspective: 1000px;
}

.card-back,
.card-front {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  backface-visibility: hidden;
}

.card-back {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: cardFlip 0.5s ease-out forwards;

  &.rarity-r {
    background: linear-gradient(135deg, #74ebd5 0%, #acb6e5 100%);
  }

  &.rarity-sr {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &.rarity-ssr {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.rarity-ur {
    background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
    box-shadow: 0 10px 40px rgba(255, 215, 0, 0.6);
  }

  .card-pattern {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
    border-radius: 50%;
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes cardFlip {
  from {
    transform: rotateY(0deg) scale(0.8);
    opacity: 0;
  }
  to {
    transform: rotateY(0deg) scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.card-front {
  background: white;
  transform: rotateY(180deg);
  animation: cardReveal 0.6s ease-out forwards;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  &.rarity-r .rarity-glow {
    background: radial-gradient(ellipse at center, rgba(116, 235, 213, 0.3) 0%, transparent 70%);
  }

  &.rarity-sr .rarity-glow {
    background: radial-gradient(ellipse at center, rgba(102, 126, 234, 0.4) 0%, transparent 70%);
  }

  &.rarity-ssr .rarity-glow {
    background: radial-gradient(ellipse at center, rgba(240, 147, 251, 0.5) 0%, transparent 70%);
    animation: ssrGlow 2s ease-in-out infinite;
  }

  &.rarity-ur .rarity-glow {
    background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.6) 0%, transparent 70%);
    animation: urGlow 1.5s ease-in-out infinite;
  }

  .rarity-glow {
    position: absolute;
    top: -20%;
    left: -20%;
    right: -20%;
    bottom: -20%;
    pointer-events: none;
  }

  .image-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 70%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    z-index: 5;
    gap: 20px;
    border-radius: 20px 20px 0 0;

    p {
      font-size: 18px;
      color: #666;
      font-weight: 600;
      margin: 0;
    }
  }

  .loading-spinner {
    width: 60px;
    height: 60px;
    border: 6px solid #e0e0e0;
    border-top: 6px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .card-image {
    width: 100%;
    height: 70%;
    object-fit: cover;
    border-radius: 20px 20px 0 0;
    opacity: 0;
    transition: opacity 0.3s ease;

    &.image-loaded {
      opacity: 1;
    }
  }

  .card-info {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 1) 100%);

    .card-rarity {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      padding: 8px 16px;
      border-radius: 12px;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      align-self: center;
    }

    .card-name {
      font-size: 18px;
      font-weight: 500;
      text-align: center;
      color: #333;
      line-height: 1.4;
    }
  }
}

.rarity-r .card-rarity {
  background: linear-gradient(135deg, #74ebd5 0%, #acb6e5 100%);
}

.rarity-sr .card-rarity {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.rarity-ssr .card-rarity {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.rarity-ur .card-rarity {
  background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%);
  animation: urTextGlow 1.5s ease-in-out infinite;
}

@keyframes cardReveal {
  from {
    transform: rotateY(180deg) scale(0.8);
    opacity: 0;
  }
  to {
    transform: rotateY(0deg) scale(1);
    opacity: 1;
  }
}

@keyframes ssrGlow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes urGlow {
  0%,
  100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes urTextGlow {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
  }
}

.next-btn {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s;
  animation: btnFadeIn 0.5s ease-out 0.6s backwards;

  &:hover {
    transform: translateX(-50%) translateY(-3px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }

  &:active {
    transform: translateX(-50%) translateY(0);
  }

  i {
    transition: transform 0.3s;
  }

  &:hover i {
    transform: translateX(3px);
  }
}

@keyframes btnFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
