<template>
  <div class="deck-viewer-modal" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <!-- 标题栏 -->
      <div class="modal-header">
        <h2>🃏 技能卡牌组</h2>
        <span class="card-count">{{ deck.length }}张</span>
        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <button
          v-for="filter in filters"
          :key="filter.key"
          class="filter-btn"
          :class="{ active: activeFilter === filter.key }"
          @click="activeFilter = filter.key"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- 卡牌列表 -->
      <div class="deck-grid">
        <div
          v-for="(card, index) in filteredDeck"
          :key="`${card.id}_${index}`"
          class="card-item"
          :class="[card.rarity?.toLowerCase(), { enhanced: card.isEnhanced }]"
          @click="selectedCard = card"
        >
          <img :src="card.imageUrl" :alt="card.name" class="card-image" @error="handleImageError" />
          <div class="card-overlay">
            <div class="card-rarity">{{ card.rarity }}</div>
            <div class="card-name">{{ card.name }}</div>
            <div v-if="card.isEnhanced" class="enhanced-badge">★ 强化</div>
          </div>
        </div>

        <div v-if="filteredDeck.length === 0" class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>暂无卡牌</p>
        </div>
      </div>

      <!-- 卡牌详情弹窗 -->
      <div v-if="selectedCard" class="card-detail-overlay" @click="selectedCard = null">
        <div class="card-detail" @click.stop>
          <button class="detail-close-btn" @click="selectedCard = null">
            <i class="fas fa-times"></i>
          </button>

          <div class="detail-header">
            <img :src="selectedCard.imageUrl" :alt="selectedCard.name" class="detail-image" />
            <div class="detail-info">
              <div class="detail-rarity" :class="selectedCard.rarity?.toLowerCase()">
                {{ selectedCard.rarity }}
              </div>
              <h3 class="detail-name">{{ selectedCard.name }}</h3>
              <div class="detail-meta">
                <span class="meta-item"> <i class="fas fa-coins"></i> 费用: {{ selectedCard.cost }} </span>
                <span class="meta-item"> <i class="fas fa-tag"></i> {{ selectedCard.type }} </span>
              </div>
            </div>
          </div>

          <!-- 效果词条 -->
          <div class="effect-list">
            <div
              v-for="(entry, idx) in displayEffects"
              :key="idx"
              class="effect-entry"
              :class="{ consumption: entry.isConsumption }"
            >
              <img
                v-if="entry.icon"
                :src="entry.icon"
                :alt="entry.effect"
                class="effect-icon"
                @error="handleIconError"
              />
              <span v-else class="effect-bullet">●</span>
              <span class="effect-text">{{ entry.effect }}</span>
            </div>
          </div>

          <!-- 强化切换 -->
          <button v-if="hasEnhancedEffects" class="toggle-enhanced-btn" @click="toggleEnhanced">
            <i :class="showEnhanced ? 'fas fa-star' : 'far fa-star'"></i>
            {{ showEnhanced ? '觉醒效果' : '基础效果' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DeckSkillCard } from '../服务/StartingDeckService';

const props = defineProps<{
  deck: DeckSkillCard[];
}>();

defineEmits<{
  close: [];
}>();

const selectedCard = ref<DeckSkillCard | null>(null);
const showEnhanced = ref(false);
const activeFilter = ref<string>('all');

const filters = [
  { key: 'all', label: '全部' },
  { key: '主动', label: '主动卡' },
  { key: '精神', label: '精神卡' },
];

const filteredDeck = computed(() => {
  if (activeFilter.value === 'all') return props.deck;
  return props.deck.filter(card => card.type === activeFilter.value);
});

const hasEnhancedEffects = computed(() => {
  if (!selectedCard.value) return false;
  return selectedCard.value.effectEntriesEnhanced && selectedCard.value.effectEntriesEnhanced.length > 0;
});

const displayEffects = computed(() => {
  if (!selectedCard.value) return [];
  if (showEnhanced.value && selectedCard.value.effectEntriesEnhanced?.length) {
    return selectedCard.value.effectEntriesEnhanced;
  }
  return selectedCard.value.effectEntries || [];
});

function toggleEnhanced() {
  showEnhanced.value = !showEnhanced.value;
}

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.src = 'https://placehold.co/120x120?text=No+Image';
}

function handleIconError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.display = 'none';
}
</script>

<style scoped lang="scss">
.deck-viewer-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  width: 95vw;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h2 {
    margin: 0;
    font-size: 20px;
    color: #fff;
  }

  .card-count {
    margin-left: 10px;
    padding: 4px 10px;
    background: rgba(255, 215, 0, 0.2);
    border-radius: 12px;
    font-size: 14px;
    color: #ffd700;
  }

  .close-btn {
    margin-left: auto;
    width: 36px;
    height: 36px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.filter-bar {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  background: transparent;
  color: #aaa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: #fff;
  }

  &.active {
    background: rgba(255, 215, 0, 0.2);
    border-color: #ffd700;
    color: #ffd700;
  }
}

.deck-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.card-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid rgba(255, 255, 255, 0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  &.ssr {
    border-color: #ffd700;
  }
  &.sr {
    border-color: #c0c0c0;
  }
  &.r {
    border-color: #cd7f32;
  }
  &.n {
    border-color: #666;
  }

  &.enhanced {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
  }
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
}

.card-rarity {
  font-size: 10px;
  color: #ffd700;
  font-weight: bold;
}

.card-name {
  font-size: 11px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.enhanced-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  border-radius: 8px;
  font-size: 9px;
  color: #000;
  font-weight: bold;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #666;

  i {
    font-size: 48px;
    margin-bottom: 15px;
  }
}

// 详情弹窗
.card-detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.card-detail {
  background: linear-gradient(135deg, #2a2a4e 0%, #1e1e3e 100%);
  border-radius: 16px;
  padding: 25px;
  max-width: 400px;
  width: 90vw;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.detail-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
}

.detail-header {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.detail-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
}

.detail-info {
  flex: 1;
}

.detail-rarity {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;

  &.ssr {
    background: linear-gradient(135deg, #ffd700, #ff8c00);
    color: #000;
  }
  &.sr {
    background: #c0c0c0;
    color: #000;
  }
  &.r {
    background: #cd7f32;
    color: #fff;
  }
  &.n {
    background: #666;
    color: #fff;
  }
}

.detail-name {
  margin: 0 0 10px;
  font-size: 18px;
  color: #fff;
}

.detail-meta {
  display: flex;
  gap: 15px;
  font-size: 13px;
  color: #aaa;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}

.effect-list {
  margin-bottom: 20px;
}

.effect-entry {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 8px;

  &.consumption {
    background: rgba(255, 100, 100, 0.1);
    border-left: 3px solid #ff6464;
  }
}

.effect-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.effect-bullet {
  color: #ffd700;
  font-size: 16px;
}

.effect-text {
  flex: 1;
  font-size: 14px;
  color: #ddd;
  line-height: 1.5;
}

.toggle-enhanced-btn {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 10px;
  background: rgba(255, 215, 0, 0.1);
  color: #ffd700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 215, 0, 0.2);
  }
}
</style>
