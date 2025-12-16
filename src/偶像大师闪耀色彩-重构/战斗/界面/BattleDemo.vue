<template>
  <div class="battle-demo">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="turn-info">回合 {{ state.turn }}/{{ state.maxTurns }}</div>
      <div class="score-info">
        <span class="score">{{ state.score }}</span>
        <span class="target">/{{ state.targetScore }}</span>
        <span class="perfect">(P:{{ state.perfectScore }})</span>
      </div>
    </div>

    <!-- 资源栏 -->
    <div class="resource-bar">
      <div class="resource genki">
        <span class="label">元气</span>
        <div class="bar">
          <div class="fill" :style="{ width: `${state.genki}%` }"></div>
        </div>
        <span class="value">{{ state.genki }}</span>
      </div>
      <div class="resource stamina">
        <span class="label">体力</span>
        <div class="bar">
          <div class="fill" :style="{ width: `${(state.stamina / state.maxStamina) * 100}%` }"></div>
        </div>
        <span class="value">{{ state.stamina }}/{{ state.maxStamina }}</span>
      </div>
    </div>

    <!-- 属性栏 -->
    <div class="attributes-bar">
      <div class="attribute" v-if="state.concentration > 0">
        <span class="name">集中</span>
        <span class="value">{{ state.concentration }}</span>
      </div>
      <div class="attribute" v-if="state.motivation > 0">
        <span class="name">干劲</span>
        <span class="value">{{ state.motivation }}</span>
      </div>
      <div class="attribute" v-if="state.goodImpression > 0">
        <span class="name">好印象</span>
        <span class="value">{{ state.goodImpression }}</span>
      </div>
      <div class="attribute" v-if="state.allPower > 0">
        <span class="name">全力值</span>
        <span class="value">{{ state.allPower }}/10</span>
      </div>
    </div>

    <!-- Buff栏 -->
    <div class="buff-bar" v-if="buffs.length > 0">
      <div
        v-for="buff in buffs"
        :key="buff.id"
        class="buff-icon"
        :class="buff.category"
        :title="`${buff.name} (${buff.stacks > 0 ? buff.stacks + '层' : buff.duration + '回合'})`"
      >
        {{ buff.name.slice(0, 2) }}
        <span class="buff-count" v-if="buff.stacks > 1">{{ buff.stacks }}</span>
        <span class="buff-duration" v-else-if="buff.duration > 0">{{ buff.duration }}</span>
      </div>
    </div>

    <!-- 手牌区域 -->
    <div class="hand-area">
      <div class="hand-label">手牌 ({{ state.cardsUsedThisTurn }}/{{ state.maxCardsPerTurn }})</div>
      <div class="hand">
        <div
          v-for="(card, index) in state.hand"
          :key="card.id"
          class="skill-card"
          :class="[card.rarity.toLowerCase(), card.type.toLowerCase(), { disabled: !canUseCard(card) }]"
          @click="useCard(index)"
        >
          <div class="card-header">
            <span class="card-rarity">{{ card.rarity }}</span>
            <span class="card-cost" :class="card.costType">{{ card.cost }}</span>
          </div>
          <div class="card-name">{{ card.name }}</div>
          <div class="card-description">{{ card.description }}</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <button class="skip-btn" @click="skipTurn" :disabled="state.cardsUsedThisTurn >= state.maxCardsPerTurn">
        跳过 (+2体力)
      </button>
      <button class="end-turn-btn" @click="endTurn">结束回合</button>
    </div>

    <!-- 日志区域 -->
    <div class="log-area">
      <div class="log-header">战斗日志</div>
      <div class="log-content" ref="logContent">
        <div v-for="(log, i) in logs" :key="i" class="log-entry">{{ log }}</div>
      </div>
    </div>

    <!-- 战斗结束弹窗 -->
    <div class="battle-end-modal" v-if="battleResult">
      <div class="modal-content" :class="battleResult">
        <div class="result-title">
          {{ battleResult === 'perfect' ? 'PERFECT!' : battleResult === 'clear' ? 'CLEAR!' : 'FAIL...' }}
        </div>
        <div class="result-score">最终得分: {{ state.score }}</div>
        <button @click="restartBattle">再来一次</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { BattleEngine, type BattleResult } from '../引擎';
import { BuffManager } from '../引擎/BuffManager';
import { createSimpleDemoDeck } from '../数据/DemoCards';
import type { Buff, SkillCard } from '../类型';

// 战斗引擎
let engine: BattleEngine | null = null;

// 响应式状态
const state = ref({
  turn: 0,
  maxTurns: 12,
  score: 0,
  targetScore: 100,
  perfectScore: 200,
  genki: 0,
  stamina: 50,
  maxStamina: 50,
  concentration: 0,
  motivation: 0,
  goodImpression: 0,
  allPower: 0,
  heat: 0,
  cardsUsedThisTurn: 0,
  maxCardsPerTurn: 1,
  hand: [] as SkillCard[],
});

const buffs = ref<Buff[]>([]);
const logs = ref<string[]>([]);
const battleResult = ref<BattleResult | null>(null);
const logContent = ref<HTMLElement | null>(null);

// 同步状态
function syncState() {
  if (!engine) return;
  const s = engine.getState();
  state.value = {
    turn: s.turn,
    maxTurns: s.maxTurns,
    score: s.score,
    targetScore: s.targetScore,
    perfectScore: s.perfectScore,
    genki: s.genki,
    stamina: s.stamina,
    maxStamina: s.maxStamina,
    concentration: s.concentration,
    motivation: s.motivation,
    goodImpression: s.goodImpression,
    allPower: s.allPower,
    heat: s.heat,
    cardsUsedThisTurn: s.cardsUsedThisTurn,
    maxCardsPerTurn: s.maxCardsPerTurn,
    hand: [...s.hand],
  };
  buffs.value = BuffManager.getAllBuffs(engine.getState());
}

// 添加日志
function addLog(message: string) {
  logs.value.push(message);
  nextTick(() => {
    if (logContent.value) {
      logContent.value.scrollTop = logContent.value.scrollHeight;
    }
  });
}

// 检查是否可以使用卡牌
function canUseCard(card: SkillCard): boolean {
  if (state.value.cardsUsedThisTurn >= state.value.maxCardsPerTurn) return false;
  if (card.limitPerBattle && card.usedThisBattle >= card.limitPerBattle) return false;

  const cost = Math.abs(card.cost);
  if (card.costType === 'stamina_only') {
    return state.value.stamina >= cost;
  } else {
    return state.value.genki + state.value.stamina >= cost;
  }
}

// 使用卡牌
function useCard(index: number) {
  if (!engine) return;

  const card = state.value.hand[index];
  if (!card || !canUseCard(card)) return;

  addLog(`\n▶ 使用: ${card.name}`);

  const result = engine.useCard(index);

  if (result.success) {
    result.effectResult.logs.forEach(log => addLog(`  ${log}`));
  } else {
    addLog(`  ✗ ${result.message}`);
  }

  syncState();
}

// 跳过
function skipTurn() {
  if (!engine) return;
  addLog('\n▶ 跳过回合 (+2体力)');
  engine.skipTurn();
  syncState();
}

// 结束回合
function endTurn() {
  if (!engine) return;
  addLog(`\n--- 回合 ${state.value.turn} 结束 ---`);
  engine.endTurn();
  syncState();
}

// 开始战斗
function startBattle() {
  const deck = createSimpleDemoDeck();
  engine = new BattleEngine('sense', deck, {
    maxTurns: 12,
    targetScore: 100,
    perfectScore: 200,
    maxStamina: 50,
    stamina: 50,
  });

  // 监听事件
  engine.on('battleEnd', (data: { result: BattleResult; score: number }) => {
    battleResult.value = data.result;
    addLog(`\n=== 战斗结束: ${data.result.toUpperCase()} ===`);
  });

  battleResult.value = null;
  logs.value = ['=== 战斗开始 ==='];

  engine.startBattle();
  syncState();
}

// 重新开始
function restartBattle() {
  startBattle();
}

onMounted(() => {
  startBattle();
});
</script>

<style scoped lang="scss">
.battle-demo {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 16px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  color: #fff;
  font-family: 'Segoe UI', sans-serif;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 12px;

  .turn-info {
    font-size: 14px;
    color: #aaa;
  }

  .score-info {
    .score {
      font-size: 24px;
      font-weight: bold;
      color: #ffd700;
    }
    .target,
    .perfect {
      font-size: 12px;
      color: #888;
    }
  }
}

.resource-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;

  .resource {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      font-size: 12px;
      width: 32px;
    }

    .bar {
      flex: 1;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      overflow: hidden;

      .fill {
        height: 100%;
        transition: width 0.3s;
      }
    }

    .value {
      font-size: 12px;
      width: 40px;
      text-align: right;
    }

    &.genki .fill {
      background: linear-gradient(90deg, #4ade80, #22c55e);
    }

    &.stamina .fill {
      background: linear-gradient(90deg, #f87171, #ef4444);
    }
  }
}

.attributes-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;

  .attribute {
    padding: 4px 12px;
    background: rgba(139, 92, 246, 0.3);
    border-radius: 16px;
    font-size: 12px;

    .name {
      color: #c4b5fd;
    }

    .value {
      color: #fff;
      font-weight: bold;
      margin-left: 4px;
    }
  }
}

.buff-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;

  .buff-icon {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 10px;
    font-weight: bold;

    &.positive {
      background: linear-gradient(135deg, #4ade80, #22c55e);
    }

    &.negative {
      background: linear-gradient(135deg, #f87171, #ef4444);
    }

    .buff-count,
    .buff-duration {
      position: absolute;
      bottom: -4px;
      right: -4px;
      background: #1a1a2e;
      color: #fff;
      font-size: 10px;
      padding: 0 4px;
      border-radius: 8px;
    }
  }
}

.hand-area {
  margin-bottom: 12px;

  .hand-label {
    font-size: 12px;
    color: #888;
    margin-bottom: 8px;
  }

  .hand {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
  }
}

.skill-card {
  flex-shrink: 0;
  width: 100px;
  padding: 8px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2d2d44, #1f1f30);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(.disabled) {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.r {
    border-color: #9ca3af;
  }
  &.sr {
    border-color: #fbbf24;
  }
  &.ssr {
    border-color: #a78bfa;
  }
  &.n {
    border-color: #6b7280;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;

    .card-rarity {
      font-size: 10px;
      padding: 1px 4px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.2);
    }

    .card-cost {
      font-size: 12px;
      font-weight: bold;

      &.normal {
        color: #4ade80;
      }
      &.stamina_only {
        color: #f87171;
      }
    }
  }

  .card-name {
    font-size: 11px;
    font-weight: bold;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-description {
    font-size: 9px;
    color: #888;
    line-height: 1.3;
  }
}

.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .skip-btn {
    background: #374151;
    color: #fff;

    &:hover:not(:disabled) {
      background: #4b5563;
    }
  }

  .end-turn-btn {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: #fff;

    &:hover {
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
    }
  }
}

.log-area {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;

  .log-header {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    font-size: 12px;
    color: #888;
  }

  .log-content {
    height: 120px;
    overflow-y: auto;
    padding: 8px 12px;
    font-size: 11px;
    font-family: monospace;

    .log-entry {
      color: #aaa;
      white-space: pre-wrap;
    }
  }
}

.battle-end-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  .modal-content {
    padding: 32px 48px;
    border-radius: 16px;
    text-align: center;

    &.perfect {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
    }

    &.clear {
      background: linear-gradient(135deg, #4ade80, #22c55e);
    }

    &.fail {
      background: linear-gradient(135deg, #6b7280, #4b5563);
    }

    .result-title {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 16px;
    }

    .result-score {
      font-size: 18px;
      margin-bottom: 24px;
    }

    button {
      padding: 12px 32px;
      border: none;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.3);
      color: #fff;
      font-size: 16px;
      cursor: pointer;

      &:hover {
        background: rgba(0, 0, 0, 0.5);
      }
    }
  }
}
</style>
