<template>
  <div
    class="battle-card"
    :class="[
      `rarity-${card.rarity.toLowerCase()}`,
      { 'is-playable': isPlayable, 'is-selected': isSelected, 'is-unplayable': !isPlayable },
    ]"
    @mouseenter="$emit('hover')"
    @mouseleave="$emit('leave')"
    @dblclick="handleDoubleClick"
  >
    <!-- 费用徽章 -->
    <div class="cost-badge">
      <span class="cost-value">{{ card.cost }}</span>
    </div>

    <!-- 卡牌顶部：名称 -->
    <div class="card-header">
      <div class="card-name">{{ card.name }}</div>
    </div>

    <!-- 卡牌插图 -->
    <div class="card-art">
      <!-- 这里使用占位图或根据 ID 加载图片 -->
      <img :src="cardImage" alt="Card Art" class="art-image" />
      <div class="card-type-icon" :class="card.type === '主动' ? 'type-active' : 'type-mental'">
        {{ card.type === '主动' ? '⚔️' : '🧠' }}
      </div>
    </div>

    <!-- 卡牌描述 -->
    <div class="card-body">
      <div class="description-text">
        <div v-for="(entry, index) in card.effectEntries" :key="index" class="effect-line">
          <span class="effect-icon">
            <img v-if="entry.icon.startsWith('http')" :src="entry.icon" class="icon-img" />
            <span v-else>{{ entry.icon }}</span>
          </span>
          <span class="effect-desc">{{ entry.effect }}</span>
        </div>
        <div v-if="card.engine_data?.constraints?.exhaust_on_play" class="exhaust-hint">课程中限1回</div>
      </div>
    </div>

    <!-- 预计算得分徽章 -->
    <div v-if="predictedScore !== undefined && predictedScore > 0" class="score-badge">+{{ predictedScore }}</div>

    <!-- 不可用遮罩 -->
    <div v-if="!isPlayable" class="unplayable-overlay">
      <span class="overlay-text">条件不满足</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DeckSkillCard } from '../服务/StartingDeckService';

const props = defineProps<{
  card: DeckSkillCard;
  isPlayable?: boolean;
  predictedScore?: number;
  isSelected?: boolean;
}>();

const emit = defineEmits<{
  (e: 'play', card: DeckSkillCard): void;
  (e: 'hover'): void;
  (e: 'leave'): void;
}>();

const isPlayable = computed(() => props.isPlayable ?? true);

// 根据卡牌 ID 获取图片
const cardImage = computed(() => {
  // T6: 优先使用 card.imageUrl (支持 AI 卡和普通卡)
  // AI 卡在 StartingDeckService 中已生成正确的觉醒缩略图 URL
  if (props.card.imageUrl) {
    return props.card.imageUrl;
  }
  // 回退逻辑 (通常不应触发)
  return `https://283pro.site/shinycolors/技能卡卡面/${encodeURIComponent(props.card.name)}.webp`;
});

function handleDoubleClick() {
  // 子任务2: 调试日志
  console.log('[DEBUG] BattleCard.handleDoubleClick', {
    cardId: props.card.id,
    isPlayable: isPlayable.value,
  });
  if (isPlayable.value) {
    emit('play', props.card);
  }
}
</script>

<style scoped>
.battle-card {
  position: relative;
  width: 200px; /* T6: 增大卡牌尺寸 */
  height: 280px;
  border-radius: 12px;
  background: #2c3e50; /* 默认底色 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  color: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  user-select: none;
  cursor: pointer;
  border: 2px solid #4a5568;
}

/* 稀有度边框颜色 */
.rarity-n {
  border-color: #a0aec0;
}
.rarity-r {
  border-color: #63b3ed;
}
.rarity-sr {
  border-color: #f6e05e;
}
.rarity-ssr {
  border-color: #f687b3;
}
.rarity-ur {
  border-color: #9f7aea;
  box-shadow: 0 0 10px #9f7aea;
}

/* 悬停效果 */
.battle-card.is-playable:hover {
  transform: translateY(-20px) scale(1.05);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.battle-card.is-selected {
  transform: translateY(-30px) scale(1.1);
  box-shadow: 0 0 15px #4fd1c5;
  border-color: #4fd1c5;
}

/* 不可用状态 */
.battle-card.is-unplayable {
  filter: grayscale(0.8) brightness(0.7);
  cursor: not-allowed;
}

/* 费用徽章 */
.cost-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%);
  border: 2px solid #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.cost-value {
  font-size: 20px;
  font-weight: bold;
  color: #2d3748;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}

/* 卡牌头部 */
.card-header {
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 24px 0 16px; /* 右侧留空给费用 */
}

.card-name {
  font-size: 14px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 卡牌插图 */
.card-art {
  flex: 1;
  background: #1a202c;
  position: relative;
  overflow: hidden;
}

.art-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-type-icon {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

/* 卡牌描述区 */
.card-body {
  height: 90px;
  background: linear-gradient(to bottom, rgba(45, 55, 72, 0.95), rgba(26, 32, 44, 1));
  padding: 8px;
  font-size: 14px; /* T6: 增大字体 */
  line-height: 1.4;
  overflow-y: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 滚动条样式 */
.card-body::-webkit-scrollbar {
  width: 4px;
}
.card-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.effect-line {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.effect-icon {
  font-size: 18px; /* T6: 增大图标容器 */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px; /* T6: 增大图标容器 */
}

.icon-img {
  width: 20px; /* T6: 增大图标 */
  height: 20px;
  object-fit: contain;
}

.exhaust-hint {
  color: #fc8181;
  font-style: italic;
  font-size: 11px;
  margin-top: 4px;
  text-align: center;
}

/* 预计算得分徽章 */
.score-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #48bb78;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 5;
}

/* 不可用遮罩 */
.unplayable-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4;
  border-radius: 10px;
}

.overlay-text {
  color: #fff;
  font-weight: bold;
  background: rgba(0, 0, 0, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
