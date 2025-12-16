<template>
  <div class="produce-select-page">
    <!-- 左侧：舞台预览 -->
    <div class="stage-preview">
      <img :src="currentStageUrl" :alt="selectedScenario?.name" class="stage-image" />
      <div class="stage-overlay">
        <h2 class="stage-name">{{ selectedScenario?.name || '选择副本' }}</h2>
      </div>
    </div>

    <!-- 右侧：副本选择 -->
    <div class="scenario-panel">
      <div class="panel-header">
        <div class="produce-type-toggle">
          <button class="type-btn" :class="{ active: produceType === 'normal' }" @click="produceType = 'normal'">
            育成培育
          </button>
          <button class="type-btn" :class="{ active: produceType === 'special' }" @click="produceType = 'special'">
            特化培育
          </button>
        </div>
      </div>

      <div class="scenario-list">
        <div
          v-for="scenario in filteredScenarios"
          :key="scenario.id"
          class="scenario-card"
          :class="{ selected: selectedScenario?.id === scenario.id }"
          @click="selectScenario(scenario)"
        >
          <img :src="scenario.bannerUrl" :alt="scenario.name" class="scenario-banner" />
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="action-buttons">
        <button class="back-btn" @click="$emit('back')"><i class="fas fa-arrow-left"></i> 返回</button>
        <button class="start-btn" :disabled="!selectedScenario" @click="startProduce">
          <i class="fas fa-play"></i> 开始育成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/2426269/shinycolors-assets-cdn@main';

// Props
defineProps<{
  selectedIdol?: {
    id: string;
    characterName: string;
  };
}>();

// Emits
const emit = defineEmits<{
  back: [];
  start: [scenarioId: string];
}>();

// 副本类型
const produceType = ref<'normal' | 'special'>('normal');

// 副本数据
interface Scenario {
  id: string;
  name: string;
  type: 'normal' | 'special';
  stageImage: string;
  bannerImage: string;
}

const scenarios: Scenario[] = [
  {
    id: 'wing',
    name: 'W.I.N.G.',
    type: 'normal',
    stageImage: 'wing主舞台.webp',
    bannerImage: 'wing副本.webp',
  },
  {
    id: 'grad',
    name: 'G.R.A.D.',
    type: 'normal',
    stageImage: 'GRAD主舞台.webp',
    bannerImage: 'GARD副本.webp',
  },
  {
    id: 'landing_point',
    name: 'Landing Point',
    type: 'normal',
    stageImage: 'landing points主舞台.webp',
    bannerImage: 'landing point副本.webp',
  },
  {
    id: 'say_hello',
    name: 'say "Halo"',
    type: 'special',
    stageImage: 'say hello主舞台.webp',
    bannerImage: 'say hello副本.webp',
  },
  {
    id: 'step',
    name: 'STEP',
    type: 'special',
    stageImage: 'STEP主舞台.webp',
    bannerImage: 'step副本.webp',
  },
  {
    id: 'thanks',
    name: '感谢祭',
    type: 'normal',
    stageImage: '感谢祭主舞台.webp',
    bannerImage: '感谢祭副本.webp',
  },
];

// 当前选中
const selectedScenario = ref<Scenario | null>(scenarios[0]);

// 过滤副本
const filteredScenarios = computed(() => {
  return scenarios.filter(s => s.type === produceType.value);
});

// 当前舞台图
const currentStageUrl = computed(() => {
  if (!selectedScenario.value) return '';
  return `${CDN_BASE}/副本资源/${selectedScenario.value.stageImage}`;
});

// 选择副本
function selectScenario(scenario: Scenario) {
  selectedScenario.value = scenario;
}

// 开始育成
function startProduce() {
  if (selectedScenario.value) {
    emit('start', selectedScenario.value.id);
  }
}

// 给scenarios添加bannerUrl计算
scenarios.forEach(s => {
  (s as any).bannerUrl = `${CDN_BASE}/副本资源/${s.bannerImage}`;
});
</script>

<style scoped lang="scss">
.produce-select-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  z-index: 1000;
}

/* 左侧舞台预览 */
.stage-preview {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.stage-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stage-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
}

.stage-name {
  color: white;
  font-size: 2rem;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.stage-desc {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin: 0;
}

/* 右侧面板 */
.scenario-panel {
  width: 450px;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
}

.panel-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.produce-type-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  padding: 4px;
}

.type-btn {
  flex: 1;
  padding: 10px 15px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;

  &.active {
    background: linear-gradient(135deg, #ff6b9d 0%, #c44aca 100%);
    color: white;
  }

  &:hover:not(.active) {
    color: white;
  }
}

/* 副本列表 */
.scenario-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.scenario-card {
  position: relative;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 3px solid transparent;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  &.selected {
    border-color: #ff6b9d;
    box-shadow: 0 0 20px rgba(255, 107, 157, 0.4);
  }
}

.scenario-banner {
  width: 100%;
  height: auto;
  display: block;
}

.scenario-info {
  position: absolute;
  top: 10px;
  left: 10px;
}

.bonus-label {
  background: linear-gradient(135deg, #ff4757 0%, #ff6b9d 100%);
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
}

/* 副本说明 */
.scenario-detail {
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 0;
  }
}

/* 底部按钮 */
.action-buttons {
  display: flex;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn,
.start-btn {
  flex: 1;
  padding: 15px;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.start-btn {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44aca 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 157, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
