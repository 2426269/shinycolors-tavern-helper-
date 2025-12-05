<template>
  <div class="card-game">
    <!-- 顶部信息栏 -->
    <div class="top-bar">
      <div class="turn-info">
        <span class="turn-number">第{{ currentTurn }}/{{ maxTurns }}回合</span>
        <span v-if="turnAttribute" class="turn-attribute"> 本回合属性：{{ attributeNames[turnAttribute] }} </span>
      </div>

      <div class="score-info">
        <div class="score-current">得分: {{ formatNumber(score.current) }}</div>
        <div class="score-target">目标: {{ formatNumber(score.target) }}</div>
        <div class="score-bar">
          <div class="score-progress" :style="{ width: scoreProgress + '%' }" :class="scoreProgressClass"></div>
        </div>
      </div>
    </div>

    <!-- 左侧：偶像信息 -->
    <div class="left-panel">
      <div class="idol-info">
        <div class="idol-avatar">
          <img :src="idolAvatar" alt="偶像头像" />
        </div>

        <div class="idol-stats">
          <div class="stat-item">
            <span class="stat-label">Vocal</span>
            <span class="stat-value">{{ stats.vocal }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Dance</span>
            <span class="stat-value">{{ stats.dance }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Visual</span>
            <span class="stat-value">{{ stats.visual }}</span>
          </div>
        </div>
      </div>

      <!-- 资源信息 -->
      <div class="resources">
        <div class="resource-item stamina">
          <div class="resource-label">体力</div>
          <div class="resource-bar">
            <div class="resource-fill" :style="{ width: (stamina / maxStamina) * 100 + '%' }"></div>
          </div>
          <div class="resource-text">{{ stamina }}/{{ maxStamina }}</div>
        </div>

        <div class="resource-item genki">
          <div class="resource-label">元气</div>
          <div class="resource-bar">
            <div class="resource-fill" :style="{ width: genki + '%' }"></div>
          </div>
          <div class="resource-text">{{ genki }}/100</div>
        </div>
      </div>

      <!-- 非凡系统 -->
      <div v-if="planType === 'anomaly'" class="anomaly-panel">
        <div class="anomaly-state" v-if="anomalyState">
          <div class="state-icon">{{ getStateIcon(anomalyState) }}</div>
          <div class="state-name">{{ getStateName(anomalyState, stateLevel) }}</div>
        </div>

        <div class="anomaly-values">
          <div class="anomaly-item">
            <span>全力值</span>
            <span class="value">{{ allPower }}/10</span>
          </div>
          <div class="anomaly-item">
            <span>热意值</span>
            <span class="value">{{ heat }}</span>
          </div>
        </div>
      </div>

      <!-- Buff栏 -->
      <BuffBar :buffs="buffs" />
    </div>

    <!-- 中央：战斗区域 -->
    <div class="center-panel">
      <!-- 牌堆信息 -->
      <div class="deck-info">
        <div class="deck-count">
          <span>牌堆: {{ deckCount }}</span>
          <span>弃牌: {{ discardCount }}</span>
        </div>
      </div>

      <!-- 手牌区 -->
      <div class="hand-area">
        <transition-group name="card" tag="div" class="hand-cards">
          <SkillCardComponent
            v-for="(card, index) in hand"
            :key="card.id + index"
            :card="card"
            :selected="selectedCardIndex === index"
            @click="selectCard(index)"
          />
        </transition-group>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="btn btn-use" :disabled="!canUseCard" @click="useCard">
          使用卡牌 ({{ cardsUsed }}/{{ maxCardsPerTurn }})
        </button>
        <button class="btn btn-skip" @click="skipAction">跳过行动</button>
        <button class="btn btn-end-turn" @click="endTurn">结束回合</button>
      </div>
    </div>

    <!-- 右侧：历史记录 -->
    <div class="right-panel">
      <div class="history-panel">
        <h3>战斗记录</h3>
        <div class="history-list">
          <div v-for="(entry, index) in recentHistory" :key="index" class="history-entry">
            <div class="history-action">{{ entry.action }}</div>
            <div class="history-changes">
              <span v-if="entry.scoreChange !== 0" class="change score">
                得分{{ entry.scoreChange > 0 ? '+' : '' }}{{ entry.scoreChange }}
              </span>
              <span v-if="entry.staminaChange !== 0" class="change stamina">
                体力{{ entry.staminaChange > 0 ? '+' : '' }}{{ entry.staminaChange }}
              </span>
              <span v-if="entry.genkiChange !== 0" class="change genki">
                元气{{ entry.genkiChange > 0 ? '+' : '' }}{{ entry.genkiChange }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 战斗结果弹窗 -->
    <transition name="modal">
      <div v-if="battleResult" class="modal-overlay" @click="closeBattleResult">
        <div class="battle-result-modal" @click.stop>
          <h2 class="result-title">
            {{ evaluationText[battleResult.evaluation] }}
          </h2>
          <div class="result-content">
            <div class="result-score">
              <div class="score-label">最终得分</div>
              <div class="score-value">{{ formatNumber(battleResult.finalScore) }}</div>
            </div>

            <div class="result-stats">
              <div class="stat">回合数: {{ battleResult.turns }}</div>
              <div class="stat">使用卡牌: {{ battleResult.cardsUsed }}张</div>
              <div class="stat">剩余体力: {{ battleResult.remainingStamina }}</div>
            </div>

            <div class="result-rewards">
              <h3>奖励</h3>
              <div class="reward-item">P点数: {{ battleResult.rewards.pPoints }}</div>
              <div class="reward-item">
                属性提升: Vo+{{ battleResult.rewards.statGain.vocal }} Da+{{
                  battleResult.rewards.statGain.dance
                }}
                Vi+{{ battleResult.rewards.statGain.visual }}
              </div>
              <div class="reward-item">好感度: +{{ battleResult.rewards.love }}</div>
            </div>
          </div>

          <button class="btn btn-close" @click="closeBattleResult">确认</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { BattleController } from '../core';
import type { BattleResult, BattleState } from '../types';
import { EventBus, GameEvents } from '../utils/event-bus';
import BuffBar from './BuffBar.vue';
import SkillCardComponent from './SkillCard.vue';

// ========== Props ==========
interface Props {
  controller: BattleController;
  idolAvatar?: string;
}

const props = withDefaults(defineProps<Props>(), {
  idolAvatar: 'https://via.placeholder.com/150',
});

// ========== Reactive State ==========
const state = ref<BattleState>(props.controller.getState());
const selectedCardIndex = ref<number>(-1);
const battleResult = ref<BattleResult | null>(null);

// ========== Computed ==========
const currentTurn = computed(() => state.value.currentTurn);
const maxTurns = computed(() => state.value.maxTurns);
const turnAttribute = computed(() => state.value.turnState.attribute);

const score = computed(() => state.value.score);
const scoreProgress = computed(() => Math.min((score.value.current / score.value.target) * 100, 100));
const scoreProgressClass = computed(() => {
  const progress = scoreProgress.value;
  if (progress >= 100) return 'excellent';
  if (progress >= 80) return 'good';
  if (progress >= 50) return 'normal';
  return 'low';
});

const stats = computed(() => state.value.stats);
const stamina = computed(() => state.value.stamina);
const maxStamina = computed(() => state.value.maxStamina);
const genki = computed(() => state.value.genki);

const planType = computed(() => state.value.planType);
const anomalyState = computed(() => state.value.attributes.anomalyState);
const stateLevel = computed(() => state.value.attributes.stateLevel);
const allPower = computed(() => state.value.attributes.allPower);
const heat = computed(() => state.value.attributes.heat);

const buffs = computed(() => Array.from(state.value.buffs.values()));

const hand = computed(() => state.value.hand);
const deckCount = computed(() => state.value.deck.length);
const discardCount = computed(() => state.value.discardPile.length);

const cardsUsed = computed(() => state.value.turnState.cardsUsed);
const maxCardsPerTurn = computed(() => state.value.turnState.maxCardsPerTurn);

const canUseCard = computed(() => selectedCardIndex.value >= 0 && cardsUsed.value < maxCardsPerTurn.value);

const recentHistory = computed(() => state.value.history.slice(-10).reverse());

// ========== Constants ==========
const attributeNames: Record<string, string> = {
  vocal: 'Vocal（歌唱）',
  dance: 'Dance（舞蹈）',
  visual: 'Visual（视觉）',
};

const evaluationText: Record<string, string> = {
  perfect: 'Perfect！',
  clear: 'Clear！',
  fail: '失败...',
};

// ========== Methods ==========
function updateState() {
  state.value = props.controller.getState();
}

function selectCard(index: number) {
  selectedCardIndex.value = selectedCardIndex.value === index ? -1 : index;
}

async function useCard() {
  if (!canUseCard.value) return;

  const success = await props.controller.useCard(selectedCardIndex.value);
  if (success) {
    selectedCardIndex.value = -1;
    updateState();
  }
}

async function skipAction() {
  await props.controller.skipAction();
  updateState();
}

async function endTurn() {
  await props.controller.endTurn();
  updateState();

  // 检查是否战斗结束
  if (state.value.currentTurn >= state.value.maxTurns || state.value.stamina <= 0) {
    battleResult.value = await props.controller.endBattle();
  } else {
    // 开始下一回合
    await props.controller.startTurn();
    updateState();
  }
}

function closeBattleResult() {
  battleResult.value = null;
  // 可以在这里处理返回逻辑
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function getStateIcon(state: string): string {
  const icons: Record<string, string> = {
    allout: '🔥',
    conserve: '💧',
    resolute: '⚡',
    relaxed: '🌸',
  };
  return icons[state] || '❓';
}

function getStateName(state: string, level: number): string {
  const names: Record<string, string> = {
    allout: '全力状态',
    conserve: '温存状态',
    resolute: '坚决状态',
    relaxed: 'のんびり状态',
  };
  return `${names[state] || '未知'}（${level === 1 ? '一阶段' : '二阶段'}）`;
}

// ========== Event Listeners ==========
function setupEventListeners() {
  EventBus.on(GameEvents.CARD_USED, updateState);
  EventBus.on(GameEvents.CARD_DRAWN, updateState);
  EventBus.on(GameEvents.BUFF_ADDED, updateState);
  EventBus.on(GameEvents.BUFF_REMOVED, updateState);
  EventBus.on(GameEvents.STAMINA_CHANGED, updateState);
  EventBus.on(GameEvents.GENKI_CHANGED, updateState);
  EventBus.on(GameEvents.SCORE_CHANGED, updateState);
}

function removeEventListeners() {
  EventBus.off(GameEvents.CARD_USED, updateState);
  EventBus.off(GameEvents.CARD_DRAWN, updateState);
  EventBus.off(GameEvents.BUFF_ADDED, updateState);
  EventBus.off(GameEvents.BUFF_REMOVED, updateState);
  EventBus.off(GameEvents.STAMINA_CHANGED, updateState);
  EventBus.off(GameEvents.GENKI_CHANGED, updateState);
  EventBus.off(GameEvents.SCORE_CHANGED, updateState);
}

// ========== Lifecycle ==========
onMounted(() => {
  setupEventListeners();
  props.controller.start();
  props.controller.startTurn();
  updateState();
});

onUnmounted(() => {
  removeEventListeners();
});
</script>

<style scoped lang="scss">
.card-game {
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  grid-template-rows: auto 1fr;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

// 顶部信息栏
.top-bar {
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.3);
  padding: 15px 20px;
  border-radius: 10px;
}

.turn-info {
  display: flex;
  flex-direction: column;
  gap: 5px;

  .turn-number {
    font-size: 24px;
    font-weight: bold;
  }

  .turn-attribute {
    font-size: 14px;
    color: #ffd700;
  }
}

.score-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 300px;

  .score-current {
    font-size: 28px;
    font-weight: bold;
  }

  .score-target {
    font-size: 14px;
    opacity: 0.8;
  }

  .score-bar {
    height: 10px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    overflow: hidden;

    .score-progress {
      height: 100%;
      transition:
        width 0.3s ease,
        background-color 0.3s ease;

      &.excellent {
        background: linear-gradient(90deg, #ffd700, #ffed4e);
      }

      &.good {
        background: linear-gradient(90deg, #4caf50, #8bc34a);
      }

      &.normal {
        background: linear-gradient(90deg, #2196f3, #64b5f6);
      }

      &.low {
        background: linear-gradient(90deg, #ff5722, #ff8a65);
      }
    }
  }
}

// 左侧面板
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.idol-info {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;

  .idol-avatar {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .idol-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;

      .stat-label {
        font-weight: bold;
      }

      .stat-value {
        color: #ffd700;
      }
    }
  }
}

.resources {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .resource-item {
    background: rgba(0, 0, 0, 0.3);
    padding: 10px;
    border-radius: 8px;

    .resource-label {
      font-size: 14px;
      margin-bottom: 5px;
    }

    .resource-bar {
      height: 20px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 5px;

      .resource-fill {
        height: 100%;
        transition: width 0.3s ease;
      }
    }

    &.stamina .resource-fill {
      background: linear-gradient(90deg, #e91e63, #f48fb1);
    }

    &.genki .resource-fill {
      background: linear-gradient(90deg, #ffeb3b, #fff59d);
    }

    .resource-text {
      text-align: center;
      font-size: 12px;
    }
  }
}

.anomaly-panel {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;

  .anomaly-state {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;

    .state-icon {
      font-size: 32px;
    }

    .state-name {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .anomaly-values {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .anomaly-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;

      .value {
        color: #ffd700;
        font-weight: bold;
      }
    }
  }
}

// 中央面板
.center-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.deck-info {
  text-align: center;
  font-size: 14px;
  opacity: 0.8;

  .deck-count {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
}

.hand-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  .hand-cards {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;

  .btn {
    padding: 12px 24px;
    font-size: 16px;
    font-weight: bold;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.btn-use {
      background: linear-gradient(135deg, #4caf50, #8bc34a);
      color: #fff;
    }

    &.btn-skip {
      background: linear-gradient(135deg, #ff9800, #ffb74d);
      color: #fff;
    }

    &.btn-end-turn {
      background: linear-gradient(135deg, #2196f3, #64b5f6);
      color: #fff;
    }
  }
}

// 右侧面板
.right-panel {
  display: flex;
  flex-direction: column;
}

.history-panel {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 10px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  h3 {
    margin: 0 0 10px 0;
    font-size: 18px;
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .history-entry {
      padding: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 5px;
      font-size: 12px;

      .history-action {
        font-weight: bold;
        margin-bottom: 4px;
      }

      .history-changes {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;

        .change {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;

          &.score {
            background: rgba(255, 215, 0, 0.3);
          }

          &.stamina {
            background: rgba(233, 30, 99, 0.3);
          }

          &.genki {
            background: rgba(255, 235, 59, 0.3);
          }
        }
      }
    }
  }
}

// 战斗结果弹窗
.modal-overlay {
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

.battle-result-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  color: #fff;

  .result-title {
    text-align: center;
    font-size: 36px;
    margin-bottom: 30px;
  }

  .result-content {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .result-score {
      text-align: center;

      .score-label {
        font-size: 18px;
        opacity: 0.8;
      }

      .score-value {
        font-size: 48px;
        font-weight: bold;
        color: #ffd700;
      }
    }

    .result-stats {
      display: flex;
      justify-content: space-around;
      padding: 15px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;

      .stat {
        text-align: center;
      }
    }

    .result-rewards {
      padding: 15px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;

      h3 {
        margin: 0 0 10px 0;
      }

      .reward-item {
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        &:last-child {
          border-bottom: none;
        }
      }
    }
  }

  .btn-close {
    width: 100%;
    padding: 15px;
    margin-top: 20px;
    background: linear-gradient(135deg, #4caf50, #8bc34a);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }
}

// 过渡动画
.card-enter-active,
.card-leave-active {
  transition: all 0.3s ease;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.card-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
