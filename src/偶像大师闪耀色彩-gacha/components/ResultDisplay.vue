<template>
  <div class="result-overlay" @click.self="handleClose">
    <div class="result-container">
      <div class="result-header">
        <h2 class="result-title">抽卡结果</h2>
        <button class="close-btn" @click="handleClose">×</button>
      </div>

      <div class="result-grid" :class="{ 'ten-pull': isTenPull }">
        <CardItem v-for="(result, index) in results" :key="index" :result="result" />
      </div>

      <div class="result-summary">
        <div class="summary-item" v-if="stats.newCards > 0">
          <span class="label">新卡片:</span>
          <span class="value new">{{ stats.newCards }}</span>
        </div>
        <div class="summary-item" v-if="stats.totalStardust > 0">
          <span class="label">获得星尘:</span>
          <span class="value stardust">+{{ stats.totalStardust }}</span>
        </div>
        <div class="summary-item">
          <span class="label">稀有度:</span>
          <span class="value">
            <span v-if="stats.UR > 0" class="rarity-stat ur">UR×{{ stats.UR }}</span>
            <span v-if="stats.SSR > 0" class="rarity-stat ssr">SSR×{{ stats.SSR }}</span>
            <span v-if="stats.SR > 0" class="rarity-stat sr">SR×{{ stats.SR }}</span>
            <span v-if="stats.R > 0" class="rarity-stat r">R×{{ stats.R }}</span>
          </span>
        </div>
      </div>

      <div class="result-actions">
        <button class="btn-again" @click="$emit('again')">再抽一次</button>
        <button class="btn-ok" @click="handleClose">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GachaResult } from '../types';
import CardItem from './CardItem.vue';

const props = defineProps<{
  results: GachaResult[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'again'): void;
}>();

const isTenPull = computed(() => props.results.length === 10);

const stats = computed(() => {
  return {
    newCards: props.results.filter(r => r.isNew).length,
    totalStardust: props.results.reduce((sum, r) => sum + (r.stardust || 0), 0),
    UR: props.results.filter(r => r.rarity === 'UR').length,
    SSR: props.results.filter(r => r.rarity === 'SSR').length,
    SR: props.results.filter(r => r.rarity === 'SR').length,
    R: props.results.filter(r => r.rarity === 'R').length,
  };
});

function handleClose() {
  emit('close');
}
</script>

<style scoped lang="scss">
.result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.result-container {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .result-title {
    font-size: 28px;
    margin: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .close-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: #f0f0f0;
    border-radius: 50%;
    font-size: 30px;
    line-height: 1;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: #e0e0e0;
      transform: rotate(90deg);
    }
  }
}

.result-grid {
  display: grid;
  gap: 20px;
  margin: 25px 0;

  // 单抽：1列
  grid-template-columns: 1fr;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;

  // 十连：5列
  &.ten-pull {
    grid-template-columns: repeat(5, 1fr);
    max-width: none;
  }
}

.result-summary {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;

    &:not(:last-child) {
      border-bottom: 1px solid #eee;
    }

    .label {
      font-weight: bold;
      color: #666;
    }

    .value {
      font-size: 18px;
      font-weight: bold;

      &.new {
        color: #ff4444;
      }

      &.stardust {
        color: #4a90e2;
      }
    }
  }
}

.rarity-stat {
  margin-left: 10px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;

  &.ur {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    color: #333;
  }

  &.ssr {
    background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
    color: white;
  }

  &.sr {
    background: linear-gradient(135deg, #9370db 0%, #ba55d3 100%);
    color: white;
  }

  &.r {
    background: linear-gradient(135deg, #999 0%, #bbb 100%);
    color: white;
  }
}

.result-actions {
  display: flex;
  gap: 15px;
  justify-content: center;

  button {
    padding: 15px 40px;
    border: none;
    border-radius: 10px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
  }

  .btn-again {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
  }

  .btn-ok {
    background: #e0e0e0;
    color: #333;

    &:hover {
      background: #d0d0d0;
    }
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

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
