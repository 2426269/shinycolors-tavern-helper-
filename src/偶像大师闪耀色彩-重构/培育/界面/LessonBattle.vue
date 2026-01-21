<template>
  <div class="lesson-battle" @click="handleBackgroundClick">
    <!-- 背景层 -->
    <div class="background-layer">
      <img src="https://283pro.site/shinycolors/background/00014.webp" alt="背景" class="background-image" />
    </div>

    <!-- Spine 角色层 -->
    <div class="character-layer">
      <SpinePlayer
        v-if="idolId"
        :idol-id="idolId"
        costume="normal"
        :selected-animation="currentAnimation"
        class="spine-character"
      />
    </div>

    <!-- UI 层 -->
    <div class="ui-layer">
      <!-- 左上角: 剩余回合 -->
      <div class="turn-display">
        <span class="turn-label">剩余回合</span>
        <span class="turn-number">{{ remainingTurns }}</span>
      </div>

      <!-- 中上: 分数圆环 -->
      <div class="score-gauge-container">
        <svg class="score-gauge" viewBox="0 0 140 140">
          <circle class="gauge-bg" cx="70" cy="70" r="55" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="8" />
          <circle
            class="gauge-progress"
            cx="70"
            cy="70"
            r="55"
            fill="none"
            stroke="#ff69b4"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressOffset"
          />
        </svg>
        <div class="score-text">
          <span v-if="isSP" class="sp-badge">SP</span>
          <div class="score-label">{{ isCleared ? '完美分' : '通关分' }}</div>
          <div :ref="el => setElementRef(el, 'score-value')" class="score-value">{{ scoreToDisplay }}</div>
          <div v-if="isCleared" class="clear-badge">已通关</div>
        </div>
      </div>

      <!-- 右上角: 属性显示 -->
      <div class="right-status">
        <!-- 属性值 -->
        <div class="attribute-box" :class="primaryStat">
          <img :src="attributeIconUrl" :alt="primaryStat" class="attribute-icon" />
          <span class="attribute-value">{{ currentStatValue }}</span>
        </div>

        <!-- HP + 元气条 -->
        <div class="hp-container">
          <div class="hp-bar-outer">
            <!-- 元气蓝边 -->
            <div
              v-if="genki > 0"
              :ref="el => setElementRef(el, 'genki-bar')"
              class="genki-border"
              :style="{ width: genkiWidth + '%' }"
            ></div>
            <!-- HP绿条 -->
            <div
              :ref="el => setElementRef(el, 'hp-bar')"
              class="hp-bar-inner"
              :style="{ width: hpPercent + '%' }"
            ></div>
          </div>
          <div class="hp-info">
            <img src="https://283pro.site/shinycolors/游戏图标/体力.png" alt="体力" class="hp-icon" />
            <span class="hp-text">{{ hp }}</span>
            <span v-if="genki > 0" class="genki-text">+{{ genki }}</span>
          </div>
        </div>
      </div>

      <!-- 左侧: Buff 区 -->
      <div :ref="el => setElementRef(el, 'buff-area')" class="buff-area">
        <div v-for="buff in buffs" :key="buff.id" class="buff-item">
          <img
            :src="`https://283pro.site/shinycolors/游戏图标/${encodeURIComponent(buff.iconFile)}`"
            :alt="buff.name"
            class="buff-icon"
          />
          <span class="buff-count">{{ buff.value }}</span>
        </div>
      </div>

      <!-- 右侧: 跳过按钮 -->
      <div class="skip-area">
        <button class="skip-btn" @click="$emit('skip')">
          <span class="skip-icon">➕</span>
          <span class="skip-num">2</span>
          <span class="skip-label">跳过</span>
        </button>
      </div>

      <!-- 底部: 手牌区 -->
      <div :ref="el => setElementRef(el, 'hand-area')" class="hand-area">
        <div class="hand-cards">
          <div
            v-for="(card, index) in hand"
            :key="card.id"
            :ref="el => setCardRef(el, card.id)"
            class="card-wrapper"
            :style="getCardTransform(index)"
            @mouseenter="selectedCardIndex = index"
            @mouseleave="selectedCardIndex = null"
          >
            <!-- T6: 隐形 Hitbox，确保鼠标离开卡牌视觉区域但仍在原位时保持选中 -->
            <div class="hitbox"></div>

            <BattleCard
              :card="card"
              :is-playable="!isCardDisabled(card)"
              :is-selected="selectedCardIndex === index"
              :predicted-score="predictedScores?.[card.id]"
              :style="getPopupStyle(card)"
              @play="$emit('playCard', card)"
            />
          </div>
        </div>
      </div>

      <!-- 左下角: 饮料槽 -->
      <div class="drink-area">
        <div
          v-for="(drink, index) in drinks"
          :key="index"
          class="drink-slot"
          :class="{ empty: !drink }"
          @click="useDrink(index)"
        >
          <img v-if="drink" :src="drink.iconUrl" :alt="drink.name" class="drink-icon" />
        </div>
      </div>

      <!-- 右下角: 功能按钮 -->
      <div class="bottom-buttons">
        <button class="reserve-btn" @click="$emit('openReserve')">
          <span class="reserve-label">保留</span>
          <span class="reserve-count">{{ reserveCount }}/{{ maxReserve }}</span>
        </button>
        <button :ref="el => setElementRef(el, 'deck-btn')" class="deck-btn" @click="showDeckModal = true">
          <i class="fas fa-layer-group"></i>
        </button>
        <button class="menu-btn" @click="$emit('openMenu')">
          <i class="fas fa-bars"></i>
        </button>
      </div>
    </div>

    <!-- 卡组弹窗 -->
    <div v-if="showDeckModal" class="deck-modal-overlay" @click="showDeckModal = false">
      <div class="deck-modal" @click.stop>
        <div class="deck-modal-header">
          <h3>卡组详情</h3>
          <button class="close-btn" @click="showDeckModal = false">&times;</button>
        </div>
        <div class="deck-modal-content">
          <div class="deck-section">
            <div class="section-header">手牌 ({{ hand.length }})</div>
            <div class="section-cards">
              <div v-for="card in hand" :key="'h-' + card.id" class="mini-card">{{ card.name }}</div>
              <div v-if="hand.length === 0" class="empty-zone">无</div>
            </div>
          </div>
          <div class="deck-section">
            <div class="section-header">牌堆 ({{ drawPile.length }})</div>
            <div class="section-cards">
              <div v-for="card in drawPile" :key="'d-' + card.id" class="mini-card">{{ card.name }}</div>
              <div v-if="drawPile.length === 0" class="empty-zone">无</div>
            </div>
          </div>
          <div class="deck-section">
            <div class="section-header">弃牌堆 ({{ discardPile.length }})</div>
            <div class="section-cards">
              <div v-for="card in discardPile" :key="'x-' + card.id" class="mini-card">{{ card.name }}</div>
              <div v-if="discardPile.length === 0" class="empty-zone">无</div>
            </div>
          </div>
          <!-- P3-1: 始终显示保留区与除外区 -->
          <div class="deck-section reserve-section">
            <div class="section-header">保留区 ({{ reservePile.length }})</div>
            <div class="section-cards">
              <div v-for="card in reservePile" :key="'r-' + card.id" class="mini-card reserved">{{ card.name }}</div>
              <div v-if="reservePile.length === 0" class="empty-zone">无</div>
            </div>
          </div>
          <div class="deck-section exclude-section">
            <div class="section-header">除外区 ({{ excludePile.length }})</div>
            <div class="section-cards">
              <div v-for="card in excludePile" :key="'e-' + card.id" class="mini-card exhausted">{{ card.name }}</div>
              <div v-if="excludePile.length === 0" class="empty-zone">无</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { animationController } from '../../战斗/动画/AnimationController';
import SpinePlayer from '../../组件/Spine播放器.vue';
import type { DeckSkillCard } from '../服务/StartingDeckService';
import BattleCard from './BattleCard.vue';

// ==================== Props ====================

interface BuffData {
  id: string;
  name: string;
  iconFile: string;
  value: number;
}

interface DrinkSlot {
  id: string;
  name: string;
  iconUrl: string;
}

const props = withDefaults(
  defineProps<{
    turn: number;
    maxTurn: number;
    score: number;
    targetScore: number;
    perfectScore?: number;
    isSP?: boolean;
    primaryStat: 'vocal' | 'dance' | 'visual';
    currentStatValue?: number; // 当前属性真实值
    hp: number;
    maxHp: number;
    genki?: number;
    hand: readonly DeckSkillCard[];
    drawPile?: readonly DeckSkillCard[];
    discardPile?: readonly DeckSkillCard[];
    buffs?: readonly BuffData[];
    drinks?: (DrinkSlot | null)[];
    reserveCount?: number;
    maxReserve?: number;
    idolId?: string;
    disabledCardIds?: string[]; // 不满足条件的卡牌 ID 列表
    excludePile?: readonly DeckSkillCard[]; // 除外区（已消耗）
    reservePile?: readonly DeckSkillCard[]; // P3-1: 保留区
    predictedScores?: Record<string, number>; // T7: 预计算得分
  }>(),
  {
    perfectScore: 2000,
    isSP: false,
    currentStatValue: 0,
    genki: 0,
    drawPile: () => [],
    discardPile: () => [],
    buffs: () => [],
    drinks: () => [null, null, null],
    reserveCount: 0,
    maxReserve: 2,
    idolId: '',
    disabledCardIds: () => [],
    excludePile: () => [],
    reservePile: () => [], // P3-1
    predictedScores: () => ({}),
  },
);

const emit = defineEmits<{
  playCard: [card: DeckSkillCard];
  skip: [];
  useDrink: [index: number];
  openReserve: [];
  openMenu: [];
}>();

// ==================== State ====================

const showDeckModal = ref(false);
const selectedCardIndex = ref<number | null>(null);
const currentAnimation = ref('wait');

// ==================== Element Registration ====================

// 注册卡牌元素
const setCardRef = (el: any, id: string) => {
  if (el) {
    animationController.registerElement(`card-${id}`, el);
  } else {
    animationController.unregisterElement(`card-${id}`);
  }
};

// 注册其他关键元素
const setElementRef = (el: any, id: string) => {
  if (el) {
    animationController.registerElement(id, el);
  } else {
    animationController.unregisterElement(id);
  }
};

onBeforeUnmount(() => {
  // 组件销毁时清理引用 (虽然 Controller 是单例，但为了避免内存泄漏最好清理)
  // 实际 Controller 可能需要一个 clearAll 方法，或者这里手动清理已知 ID
});

// ==================== Computed ====================

const remainingTurns = computed(() => Math.max(0, props.maxTurn - props.turn));

// 分数显示
const scoreToDisplay = computed(() => Math.floor(props.score));
const isCleared = computed(() => props.score >= props.targetScore);

// 圆环进度
const radius = 50;
const circumference = 2 * Math.PI * radius;
const progressOffset = computed(() => {
  const progress = Math.min(1, props.score / props.targetScore);
  return circumference * (1 - progress);
});

// 属性图标
const attributeIconUrl = computed(() => {
  const map: Record<string, string> = {
    vocal: 'https://283pro.site/shinycolors/assets/images/icon_vocal.png',
    dance: 'https://283pro.site/shinycolors/assets/images/icon_dance.png',
    visual: 'https://283pro.site/shinycolors/assets/images/icon_visual.png',
  };
  return map[props.primaryStat];
});

// 状态条宽度
const genkiWidth = computed(() => {
  if (!props.maxHp) return 0;
  return Math.min(100, ((props.genki || 0) / props.maxHp) * 100);
});

const hpPercent = computed(() => {
  if (!props.maxHp) return 0;
  return Math.min(100, (props.hp / props.maxHp) * 100);
});

// ==================== Methods ====================

// 卡牌变换样式
const getCardTransform = (index: number) => {
  const total = props.hand.length;
  if (total === 0) return {};

  const center = (total - 1) / 2;
  const offset = index - center;
  const rotate = offset * 5; // 旋转角度
  const y = Math.abs(offset) * 10; // 拱形排列

  // 子任务1: 添加 X 轴偏移以创建水平间距
  const cardWidth = 200; // 卡牌宽度
  const overlapRatio = 0.6; // 重叠系数（0.6 = 40% 可见）
  const x = offset * cardWidth * overlapRatio;

  // 选中时放大
  if (selectedCardIndex.value === index) {
    return {
      transform: `translateX(${x}px) translateY(-30px) scale(1.1) rotate(0deg)`,
      zIndex: 100,
    };
  }

  return {
    transform: `translateX(${x}px) translateY(${y}px) rotate(${rotate}deg)`,
    zIndex: index,
  };
};

// 检查卡牌是否不可用
const isCardDisabled = (card: DeckSkillCard) => {
  if (props.disabledCardIds?.includes(card.id)) return true;
  // 检查 Cost
  // DeckSkillCard.cost 是 number (genki cost)
  // 如果 cost 是对象结构，需要根据实际类型调整。
  // 假设 StartingDeckService 中 DeckSkillCard 定义 cost 为 number
  const cost = typeof card.cost === 'number' ? card.cost : (card.cost as any)?.genki || 0;

  if ((props.genki || 0) < cost) return true;

  return false;
};

// 弹窗样式
const getPopupStyle = (card: DeckSkillCard) => {
  // 简化：居中显示
  return {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };
};

// 处理背景点击
const handleBackgroundClick = () => {
  selectedCardIndex.value = null;
};

// 使用饮料
const useDrink = (index: number) => {
  emit('useDrink', index);
};
</script>

<style scoped lang="scss">
.lesson-battle {
  position: fixed;
  inset: 0;
  overflow: hidden;
  font-family: 'Noto Sans SC', sans-serif;
}

.background-layer {
  position: absolute;
  inset: 0;
  z-index: 0;

  .background-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.character-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;

  .spine-character {
    width: 50%;
    max-width: 500px;
    height: 80%;
  }
}

.ui-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

// 左上角: 回合数
.turn-display {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(50, 50, 60, 0.85);
  padding: 12px 20px;
  border-radius: 12px;

  .turn-label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }

  .turn-number {
    display: block;
    font-size: 48px;
    font-weight: 900;
    color: white;
    line-height: 1;
  }
}

// 中上: 分数圆环
.score-gauge-container {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 130px;
  height: 130px;

  .score-gauge {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);

    .gauge-progress {
      transition: stroke-dashoffset 0.5s ease;
    }
  }

  .score-text {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;

    .sp-badge {
      position: absolute;
      top: 10px;
      font-size: 10px;
      background: linear-gradient(135deg, #ff6b9d, #c44569);
      padding: 2px 8px;
      border-radius: 8px;
    }

    .score-label {
      font-size: 11px;
      opacity: 0.8;
    }

    .score-value {
      font-size: 36px;
      font-weight: 900;
    }

    .clear-badge {
      font-size: 10px;
      color: #4ade80;
      font-weight: bold;
    }
  }
}

// 右上角
.right-status {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;

  .attribute-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.6);
    padding: 8px 16px;
    border-radius: 25px;

    .attribute-icon {
      width: 28px;
      height: 28px;
    }

    .attribute-value {
      font-size: 28px;
      font-weight: 900;
      color: white;
    }
  }

  .hp-container {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .hp-bar-outer {
      position: relative;
      width: 140px;
      height: 18px;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 10px;
      overflow: visible;

      .hp-bar-inner {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: linear-gradient(90deg, #4ade80, #22c55e);
        border-radius: 10px;
        transition: width 0.3s;
        box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
      }

      .genki-border {
        position: absolute;
        left: -2px;
        top: -3px;
        bottom: -3px;
        border: 3px solid #60a5fa;
        border-radius: 12px;
        box-shadow: 0 0 10px rgba(96, 165, 250, 0.8);
        transition: width 0.3s;
      }
    }

    .hp-info {
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: flex-end;

      .hp-icon {
        width: 16px;
        height: 16px;
      }

      .hp-text {
        font-size: 14px;
        font-weight: bold;
        color: #4ade80;
      }

      .genki-text {
        font-size: 12px;
        color: #60a5fa;
      }
    }
  }
}

// 左侧: Buff
.buff-area {
  position: absolute;
  left: 20px;
  top: 130px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .buff-item {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.4);
    padding: 4px 10px;
    border-radius: 16px;

    .buff-icon {
      width: 24px;
      height: 24px;
    }

    .buff-count {
      font-size: 16px;
      font-weight: bold;
      color: white;
    }
  }
}

// 右侧: 跳过
.skip-area {
  position: absolute;
  right: 20px;
  top: 45%;

  .skip-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 56px;
    height: 70px;
    background: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    .skip-cost {
      font-size: 20px;
      color: #333;
    }

    .skip-num {
      font-size: 18px;
      font-weight: 900;
      color: #333;
    }

    .skip-label {
      font-size: 11px;
      color: #666;
    }
  }
}

// 底部: 手牌
.hand-area {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 600px;

  .hand-cards {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    padding-bottom: 40px;

    .card-wrapper {
      position: absolute;
      bottom: 0;
      transform-origin: center 1000px; /* 调整旋转中心，制造扇形效果 */
      transition:
        transform 0.2s ease,
        z-index 0s;
      will-change: transform;

      /* 确保 BattleCard 不会被压缩 */
      flex-shrink: 0;
      width: 200px; /* T6: 显式设置宽度以匹配 BattleCard */
      height: 280px; /* T6: 显式设置高度 */

      .hitbox {
        position: absolute;
        inset: 0;
        z-index: 1; /* 位于底层 */
        pointer-events: none; /* 子任务B: 允许事件穿透到 BattleCard */
        /* background: rgba(255, 0, 0, 0.2);  调试用 */
      }
    }
  }
}

// 左下角: 饮料
.drink-area {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 10px;

  .drink-slot {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &.empty {
      opacity: 0.4;
    }

    .drink-icon {
      width: 36px;
      height: 36px;
    }
  }
}

// 右下角: 按钮
.bottom-buttons {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 10px;

  button {
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 10px;
    cursor: pointer;
    color: #333;

    &:hover {
      background: white;
    }
  }

  .reserve-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 16px;

    .reserve-label {
      font-size: 10px;
    }
    .reserve-count {
      font-size: 12px;
      font-weight: 700;
    }
  }

  .deck-btn,
  .menu-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
}

// 卡组弹窗
.deck-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: flex-end;
  z-index: 100;
}

.deck-modal {
  width: 350px;
  height: 100%;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;

  .deck-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #16213e;

    h3 {
      color: white;
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
    }
  }

  .deck-modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;

    .deck-section {
      margin-bottom: 20px;

      .section-header {
        font-size: 14px;
        color: #60a5fa;
        margin-bottom: 8px;
        padding-left: 8px;
        border-left: 3px solid #60a5fa;
      }

      .section-cards {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .mini-card {
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          color: white;

          &.exhausted {
            opacity: 0.5;
            text-decoration: line-through;
            background: rgba(100, 100, 100, 0.2);
          }

          // P3-1: 保留区卡牌样式
          &.reserved {
            background: rgba(255, 215, 0, 0.2);
            border: 1px solid rgba(255, 215, 0, 0.5);
          }
        }

        // P3-1: 空区域占位
        .empty-zone {
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          font-style: italic;
        }
      }

      // P3-1: 保留区区块样式
      &.reserve-section {
        .section-header {
          color: #fbbf24;
          border-left-color: #fbbf24;
        }
      }
    }
  }
}
</style>
