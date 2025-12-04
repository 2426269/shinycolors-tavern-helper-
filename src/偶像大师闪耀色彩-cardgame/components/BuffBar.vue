<template>
  <div class="buff-bar">
    <h3 class="buff-bar-title">Buff状态</h3>

    <div class="buff-list">
      <!-- 正面Buff -->
      <div v-if="positiveBuffs.length > 0" class="buff-category positive">
        <div class="category-label">正面效果</div>
        <div class="buff-items">
          <div
            v-for="buff in positiveBuffs"
            :key="buff.id"
            class="buff-item"
            :title="getBuffTooltip(buff)"
            @click="showBuffDetail(buff)"
          >
            <div class="buff-icon" :style="{ background: buff.color }">
              {{ buff.iconUrl ? '🎯' : getBuffDefaultIcon(buff.type) }}
            </div>
            <div class="buff-info">
              <div class="buff-name">{{ buff.name }}</div>
              <div class="buff-meta">
                <span v-if="buff.stacks > 0" class="buff-stacks">×{{ buff.stacks }}</span>
                <span v-if="buff.duration > 0" class="buff-duration">{{ buff.duration }}回合</span>
                <span v-if="buff.duration === -1" class="buff-permanent">永久</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 负面Buff -->
      <div v-if="negativeBuffs.length > 0" class="buff-category negative">
        <div class="category-label">负面效果</div>
        <div class="buff-items">
          <div
            v-for="buff in negativeBuffs"
            :key="buff.id"
            class="buff-item"
            :title="getBuffTooltip(buff)"
            @click="showBuffDetail(buff)"
          >
            <div class="buff-icon negative-icon" :style="{ background: buff.color }">
              {{ buff.iconUrl ? '💀' : getBuffDefaultIcon(buff.type) }}
            </div>
            <div class="buff-info">
              <div class="buff-name">{{ buff.name }}</div>
              <div class="buff-meta">
                <span v-if="buff.stacks > 0" class="buff-stacks">×{{ buff.stacks }}</span>
                <span v-if="buff.duration > 0" class="buff-duration">{{ buff.duration }}回合</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无Buff提示 -->
      <div v-if="buffs.length === 0" class="no-buffs">当前没有Buff效果</div>
    </div>

    <!-- Buff详情弹窗 -->
    <transition name="fade">
      <div v-if="selectedBuff" class="buff-detail-overlay" @click="closeBuffDetail">
        <div class="buff-detail-modal" @click.stop>
          <div class="detail-header">
            <div class="detail-icon" :style="{ background: selectedBuff.color }">
              {{ selectedBuff.iconUrl ? '🎯' : getBuffDefaultIcon(selectedBuff.type) }}
            </div>
            <h3>{{ selectedBuff.name }}</h3>
          </div>

          <div class="detail-body">
            <div class="detail-description">{{ selectedBuff.description }}</div>

            <div class="detail-stats">
              <div v-if="selectedBuff.stacks > 0" class="stat-item">
                <span class="stat-label">层数</span>
                <span class="stat-value">{{ selectedBuff.stacks }}</span>
              </div>
              <div v-if="selectedBuff.duration > 0" class="stat-item">
                <span class="stat-label">剩余回合</span>
                <span class="stat-value">{{ selectedBuff.duration }}</span>
              </div>
              <div v-if="selectedBuff.duration === -1" class="stat-item">
                <span class="stat-label">持续时间</span>
                <span class="stat-value">永久</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">类型</span>
                <span class="stat-value">{{ categoryText[selectedBuff.category] }}</span>
              </div>
            </div>

            <div v-if="selectedBuff.effects.length > 0" class="detail-effects">
              <h4>触发效果</h4>
              <div v-for="(effect, index) in selectedBuff.effects" :key="index" class="effect-item">
                <span class="effect-trigger">{{ getTriggerText(effect.trigger) }}</span>
              </div>
            </div>
          </div>

          <button class="btn-close" @click="closeBuffDetail">关闭</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Buff } from '../types';

// ========== Props ==========
interface Props {
  buffs: Buff[];
}

const props = defineProps<Props>();

// ========== Reactive State ==========
const selectedBuff = ref<Buff | null>(null);

// ========== Computed ==========
const positiveBuffs = computed(() => props.buffs.filter(buff => buff.category === 'positive'));

const negativeBuffs = computed(() => props.buffs.filter(buff => buff.category === 'negative'));

// ========== Constants ==========
const categoryText: Record<string, string> = {
  positive: '正面效果',
  negative: '负面效果',
  neutral: '中性效果',
};

const triggerTextMap: Record<string, string> = {
  turn_start: '回合开始时',
  turn_end: '回合结束时',
  card_used: '使用卡牌时',
  score_calculated: '计算得分时',
  stamina_gain: '获得体力时',
  genki_gain: '获得元气时',
  buff_gained: '获得Buff时',
  buff_lost: '失去Buff时',
  attribute_change: '属性变化时',
  anomaly_state_change: '非凡状态变化时',
  damage_taken: '受到伤害时',
  heal_received: '获得治疗时',
  skip_turn: '跳过行动时',
  battle_start: '战斗开始时',
  battle_end: '战斗结束时',
};

// ========== Methods ==========
function getBuffDefaultIcon(buffType: string): string {
  const icons: Record<string, string> = {
    good_condition: '✨',
    concentration: '🎯',
    good_impression: '💖',
    motivated: '🔥',
    allout_state: '💥',
    conserve_state: '💧',
    resolute_state: '⚡',
    stamina_reduction: '🛡️',
    genki_boost: '⚡',
    score_boost: '📈',
    double_effect: '×2',
    tired: '😓',
    stamina_drain: '💔',
  };
  return icons[buffType] || '❓';
}

function getBuffTooltip(buff: Buff): string {
  let tooltip = `${buff.name}\n${buff.description}`;

  if (buff.stacks > 0) {
    tooltip += `\n层数: ${buff.stacks}`;
  }

  if (buff.duration > 0) {
    tooltip += `\n剩余: ${buff.duration}回合`;
  } else if (buff.duration === -1) {
    tooltip += `\n持续: 永久`;
  }

  return tooltip;
}

function getTriggerText(trigger: string): string {
  return triggerTextMap[trigger] || trigger;
}

function showBuffDetail(buff: Buff) {
  selectedBuff.value = buff;
}

function closeBuffDetail() {
  selectedBuff.value = null;
}
</script>

<style scoped lang="scss">
.buff-bar {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
  max-height: 400px;
  display: flex;
  flex-direction: column;

  .buff-bar-title {
    margin: 0 0 10px 0;
    font-size: 16px;
    color: #fff;
  }

  .buff-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

// Buff分类
.buff-category {
  .category-label {
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 8px;
    padding: 4px 8px;
    border-radius: 4px;
  }

  &.positive .category-label {
    background: rgba(76, 175, 80, 0.3);
    color: #8bc34a;
  }

  &.negative .category-label {
    background: rgba(244, 67, 54, 0.3);
    color: #ff5252;
  }

  .buff-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
}

// Buff项目
.buff-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(3px);
  }

  .buff-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 20px;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

    &.negative-icon {
      filter: brightness(0.8);
    }
  }

  .buff-info {
    flex: 1;
    min-width: 0;

    .buff-name {
      font-size: 13px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .buff-meta {
      display: flex;
      gap: 6px;
      font-size: 11px;

      .buff-stacks {
        color: #ffd700;
        font-weight: bold;
      }

      .buff-duration {
        color: #64b5f6;
      }

      .buff-permanent {
        color: #4caf50;
      }
    }
  }
}

// 无Buff提示
.no-buffs {
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

// Buff详情弹窗
.buff-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.buff-detail-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px;
  border-radius: 15px;
  max-width: 400px;
  width: 90%;
  color: #fff;
  max-height: 80vh;
  overflow-y: auto;

  .detail-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);

    .detail-icon {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 32px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    h3 {
      margin: 0;
      font-size: 24px;
    }
  }

  .detail-body {
    .detail-description {
      padding: 15px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      margin-bottom: 15px;
      line-height: 1.6;
    }

    .detail-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 15px;

      .stat-item {
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .stat-label {
          font-size: 12px;
          opacity: 0.8;
        }

        .stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #ffd700;
        }
      }
    }

    .detail-effects {
      h4 {
        margin: 0 0 10px 0;
        font-size: 16px;
      }

      .effect-item {
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 6px;
        margin-bottom: 6px;

        .effect-trigger {
          font-size: 13px;
        }
      }
    }
  }

  .btn-close {
    width: 100%;
    padding: 12px;
    margin-top: 15px;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.02);
    }
  }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 滚动条样式
.buff-list::-webkit-scrollbar,
.buff-detail-modal::-webkit-scrollbar {
  width: 6px;
}

.buff-list::-webkit-scrollbar-track,
.buff-detail-modal::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.buff-list::-webkit-scrollbar-thumb,
.buff-detail-modal::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;

  &:hover {
    background: rgba(255, 255, 255, 0.5);
  }
}
</style>








