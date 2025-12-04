<template>
  <div class="card-item" :class="`rarity-${result.rarity}`">
    <div class="rarity-badge">{{ result.rarity }}</div>
    
    <div class="card-image-wrapper">
      <img 
        :src="result.imageUrl" 
        :alt="result.fullCardName"
        class="card-image"
        @error="handleImageError"
      />
    </div>
    
    <div class="card-info">
      <div class="card-name">{{ result.fullCardName }}</div>
      
      <div v-if="result.isNew" class="new-badge">
        <span class="badge-text">NEW!</span>
      </div>
      <div v-else class="stardust-badge">
        <span class="stardust-icon">✨</span>
        <span class="stardust-value">+{{ result.stardust }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GachaResult } from '../types';

const props = defineProps<{
  result: GachaResult;
}>();

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  // 占位图（SVG）
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">
      <rect width="200" height="300" fill="#e0e0e0"/>
      <text x="50%" y="45%" font-family="Arial" font-size="16" fill="#999" text-anchor="middle">
        ${props.result.rarity}
      </text>
      <text x="50%" y="55%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle">
        ${props.result.characterName}
      </text>
    </svg>
  `)}`;
}
</script>

<style scoped lang="scss">
.card-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  }
  
  // 稀有度边框
  border: 3px solid;
  
  &.rarity-UR {
    border-color: #ffd700;
    box-shadow: 0 4px 20px rgba(255, 215, 0, 0.5);
  }
  
  &.rarity-SSR {
    border-color: #ff1493;
    box-shadow: 0 4px 20px rgba(255, 20, 147, 0.4);
  }
  
  &.rarity-SR {
    border-color: #9370db;
    box-shadow: 0 4px 20px rgba(147, 112, 219, 0.3);
  }
  
  &.rarity-R {
    border-color: #ccc;
  }
}

.rarity-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
  z-index: 10;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  
  .rarity-UR & {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    color: #333;
  }
  
  .rarity-SSR & {
    background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
    color: white;
  }
  
  .rarity-SR & {
    background: linear-gradient(135deg, #9370db 0%, #ba55d3 100%);
    color: white;
  }
  
  .rarity-R & {
    background: linear-gradient(135deg, #999 0%, #bbb 100%);
    color: white;
  }
}

.card-image-wrapper {
  aspect-ratio: 2 / 3;
  overflow: hidden;
  background: #f5f5f5;
  
  .card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .card-item:hover .card-image {
    transform: scale(1.05);
  }
}

.card-info {
  padding: 12px;
  background: rgba(255, 255, 255, 0.95);
  
  .card-name {
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    line-height: 1.4;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .rarity-UR & {
      color: #ffa500;
      text-shadow: 0 0 10px rgba(255, 165, 0, 0.3);
    }
    
    .rarity-SSR & {
      background: linear-gradient(45deg, #ff1493, #ff69b4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .rarity-SR & {
      color: #9370db;
    }
  }
}

.new-badge {
  margin-top: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #ff4444 0%, #ff6666 100%);
  color: white;
  border-radius: 20px;
  text-align: center;
  font-weight: bold;
  font-size: 13px;
  animation: pulse 1.5s infinite;
  box-shadow: 0 2px 10px rgba(255, 68, 68, 0.4);
}

.stardust-badge {
  margin-top: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #87ceeb 0%, #b0e0e6 100%);
  color: #333;
  border-radius: 20px;
  text-align: center;
  font-weight: bold;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>


