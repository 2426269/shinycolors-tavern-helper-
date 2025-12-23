<template>
  <div class="produce-main-page">
    <!-- Spine背景层（固定，与其他UI不在同一图层） -->
    <div class="spine-background-layer">
      <SpinePlayer v-if="idol?.spineUrl" :idol-id="idol.spineUrl" costume="normal" class="spine-player" />
      <!-- 如果没有Spine则显示卡面 -->
      <div v-else-if="idol?.cardImageUrl" class="fallback-card">
        <img :src="idol.cardImageUrl" alt="角色" class="fallback-image" />
      </div>
    </div>

    <!-- UI层 -->
    <div class="ui-layer">
      <!-- 顶部栏 -->
      <div class="top-bar">
        <!-- 左侧区域 -->
        <div class="top-left">
          <!-- 返回按钮 -->
          <button class="back-btn" @click="$emit('goBack')">
            <i class="fas fa-arrow-left"></i>
          </button>
          <!-- 时间显示 -->
          <div class="time-display" @click="showCalendar = true">
            <div class="date-text">{{ formattedDate }}</div>
            <div class="weeks-info">第 {{ currentWeek }} 周</div>
          </div>
        </div>

        <!-- 顶部中间：体力条和P点条 -->
        <div class="status-bars">
          <!-- 体力条 (绿色) -->
          <div class="hp-container">
            <div class="hp-bar-wrapper">
              <div class="hp-bar-bg"></div>
              <div class="hp-bar-fill" :style="{ width: `${(stamina / maxStamina) * 100}%` }"></div>
            </div>
            <div class="hp-info">
              <img
                src="https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/体力.png"
                alt="体力"
                class="hp-icon"
              />
              <span class="hp-value">{{ stamina }}/{{ maxStamina }}</span>
            </div>
          </div>
          <!-- P点条 -->
          <div class="p-point-container">
            <div class="p-point-bar">
              <span class="p-label">P</span>
              <span class="p-value">{{ genki }}</span>
            </div>
          </div>
        </div>

        <!-- 右上：角色头像 -->
        <div class="character-avatar">
          <img v-if="idol?.avatarUrl" :src="idol.avatarUrl" alt="头像" />
        </div>
      </div>

      <!-- 三维属性显示 (带弧形进度) -->
      <div class="stats-section">
        <!-- Vocal -->
        <div class="stat-item vocal">
          <div class="stat-arc-container">
            <svg class="stat-arc-svg" viewBox="0 0 100 60">
              <path
                class="arc-bg"
                d="M 10 55 A 40 40 0 0 1 90 55"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="6"
              />
              <path
                class="arc-fill"
                d="M 10 55 A 40 40 0 0 1 90 55"
                fill="none"
                stroke="#ff69b4"
                stroke-width="6"
                :stroke-dasharray="getStatArcDashArray(stats.vocal)"
                stroke-linecap="round"
              />
            </svg>
            <div class="stat-grade-letter">
              <span class="grade">{{ getGrade(stats.vocal) }}</span>
            </div>
          </div>
          <div class="stat-details">
            <img
              src="https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/Vocal.png"
              alt="Vo"
              class="stat-icon"
            />
            <span class="stat-value">{{ stats.vocal }}</span>
            <span class="stat-max">/1000</span>
          </div>
          <div class="stat-multiplier">
            <span v-if="vocalMultiplier" class="multiplier-value">▲ {{ vocalMultiplier }}%</span>
          </div>
        </div>

        <!-- Dance -->
        <div class="stat-item dance">
          <div class="stat-arc-container">
            <svg class="stat-arc-svg" viewBox="0 0 100 60">
              <path
                class="arc-bg"
                d="M 10 55 A 40 40 0 0 1 90 55"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="6"
              />
              <path
                class="arc-fill"
                d="M 10 55 A 40 40 0 0 1 90 55"
                fill="none"
                stroke="#4fc3f7"
                stroke-width="6"
                :stroke-dasharray="getStatArcDashArray(stats.dance)"
                stroke-linecap="round"
              />
            </svg>
            <div class="stat-grade-letter">
              <span class="grade">{{ getGrade(stats.dance) }}</span>
            </div>
          </div>
          <div class="stat-details">
            <img
              src="https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/Dance.png"
              alt="Da"
              class="stat-icon"
            />
            <span class="stat-value">{{ stats.dance }}</span>
            <span class="stat-max">/1000</span>
          </div>
          <div class="stat-multiplier">
            <span v-if="danceMultiplier" class="multiplier-value">▲ {{ danceMultiplier }}%</span>
          </div>
        </div>

        <!-- Visual -->
        <div class="stat-item visual">
          <div class="stat-arc-container">
            <svg class="stat-arc-svg" viewBox="0 0 100 60">
              <path
                class="arc-bg"
                d="M 10 55 A 40 40 0 0 1 90 55"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="6"
              />
              <path
                class="arc-fill"
                d="M 10 55 A 40 40 0 0 1 90 55"
                fill="none"
                stroke="#ffd54f"
                stroke-width="6"
                :stroke-dasharray="getStatArcDashArray(stats.visual)"
                stroke-linecap="round"
              />
            </svg>
            <div class="stat-grade-letter">
              <span class="grade">{{ getGrade(stats.visual) }}</span>
            </div>
          </div>
          <div class="stat-details">
            <img
              src="https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/Visual.png"
              alt="Vi"
              class="stat-icon"
            />
            <span class="stat-value">{{ stats.visual }}</span>
            <span class="stat-max">/1000</span>
          </div>
          <div class="stat-multiplier">
            <span v-if="visualMultiplier" class="multiplier-value">▲ {{ visualMultiplier }}%</span>
          </div>
        </div>
      </div>

      <!-- 行动提示 -->
      <div class="action-prompt">
        <span>请选择行动</span>
      </div>

      <!-- 活动组件区域（接口预留） -->
      <div class="activity-section">
        <div class="activity-slot" @click="$emit('activity', 0)">
          <div class="activity-placeholder">
            <i class="fas fa-plus"></i>
            <span>活动1</span>
          </div>
        </div>
        <div class="activity-slot" @click="$emit('activity', 1)">
          <div class="activity-placeholder">
            <i class="fas fa-plus"></i>
            <span>活动2</span>
          </div>
        </div>
        <div class="activity-slot" @click="$emit('activity', 2)">
          <div class="activity-placeholder">
            <i class="fas fa-plus"></i>
            <span>活动3</span>
          </div>
        </div>
      </div>

      <!-- 底部工具栏 -->
      <div class="bottom-toolbar">
        <!-- 左侧：饮料槽 -->
        <div class="drinks-section">
          <div v-for="(drink, index) in drinks" :key="index" class="drink-slot" @click="$emit('useDrink', index)">
            <template v-if="drink">
              <img :src="drink.iconUrl" :alt="drink.name" class="drink-icon" />
            </template>
            <template v-else>
              <div class="empty-drink">
                <i class="fas fa-flask"></i>
              </div>
            </template>
          </div>
        </div>

        <!-- 右侧：功能按钮 -->
        <div class="action-buttons">
          <button class="action-btn deck-btn" @click="$emit('openDeck')">
            <i class="fas fa-layer-group"></i>
            <span>牌组</span>
          </button>
          <button class="action-btn phone-btn" @click="showPhone = true">
            <i class="fas fa-mobile-alt"></i>
            <span>电话</span>
          </button>
          <button class="action-btn diary-btn" @click="$emit('openDiary')">
            <i class="fas fa-book"></i>
            <span>日记</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 日历页面 (全屏) -->
    <Calendar
      v-if="showCalendar"
      :produce-name="scenarioName || 'W.I.N.G.'"
      :current-date="currentDate"
      :current-week="currentWeek"
      :stamina="stamina"
      :max-stamina="maxStamina"
      :p-points="genki"
      @close="showCalendar = false"
    />

    <!-- 手机页面 -->
    <PhoneContainer v-model="showPhone" :unreads="{ chain: 2, phone: 1 }" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import PhoneContainer from '../../手机/组件/PhoneContainer.vue';
import Calendar from '../../时间/组件/Calendar.vue';
import SpinePlayer from '../../组件/Spine播放器.vue';
import { getGrade, getGradeProgress } from '../服务/GradeService';

// Props
const props = withDefaults(
  defineProps<{
    // 培育角色信息
    idol?: {
      id: string;
      characterName: string;
      spineUrl?: string;
      cardImageUrl?: string;
      avatarUrl?: string;
    };
    // 时间信息
    currentDate?: string; // "2018-04-24"
    currentWeek?: number;
    weeksUntilCompetition?: number;
    targetLabel?: string; // "中間まで" 等
    scenarioName?: string; // "副本名称：W.I.N.G./STEP/...等"
    // 三维属性
    stats?: {
      vocal: number;
      dance: number;
      visual: number;
    };
    // 属性倍率（接口预留）
    vocalMultiplier?: number;
    danceMultiplier?: number;
    visualMultiplier?: number;
    // 状态
    stamina?: number;
    maxStamina?: number;
    genki?: number;
    // 饮料槽
    drinks?: Array<{ id: string; name: string; iconUrl: string } | null>;
  }>(),
  {
    currentDate: '2018-04-24',
    currentWeek: 1,
    weeksUntilCompetition: 12,
    targetLabel: '中間',
    stats: () => ({ vocal: 0, dance: 0, visual: 0 }),
    stamina: 30,
    maxStamina: 30,
    genki: 0,
    drinks: () => [null, null, null],
  },
);

// Emits
defineEmits<{
  goBack: [];
  activity: [index: number];
  useDrink: [index: number];
  openDeck: [];
  openPhone: [];
  openDiary: [];
}>();

// 弹窗状态
const showCalendar = ref(false);
const showPhone = ref(false);

// 格式化日期显示
const formattedDate = computed(() => {
  if (!props.currentDate) return '';
  const [year, month, day] = props.currentDate.split('-');
  return `${year}年${parseInt(month)}月${parseInt(day)}日`;
});

const currentYear = computed(() => props.currentDate?.split('-')[0] || '2018');
const currentMonth = computed(() => parseInt(props.currentDate?.split('-')[1] || '4'));
const currentDay = computed(() => parseInt(props.currentDate?.split('-')[2] || '24'));

// 综合评价等级
const overallGrade = computed(() => {
  const total = props.stats.vocal + props.stats.dance + props.stats.visual;
  const avg = Math.floor(total / 3);
  return getGrade(avg);
});

// 单个属性的弧形进度条dash array计算（基于当前等级内的进度）
const getStatArcDashArray = (value: number) => {
  const progress = getGradeProgress(value);
  const circumference = Math.PI * 40; // 半圆弧长 (半径40)
  return `${progress * circumference} ${circumference}`;
};
</script>

<style scoped lang="scss">
.produce-main-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000; /* 确保显示在主页面上方 */
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  overflow: hidden;
}

/* Spine背景层 */
.spine-background-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none; /* 禁止拖动/交互 */
}

.spine-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spine-placeholder {
  .fallback-image {
    max-height: 70%;
    max-width: 60%;
    object-fit: contain;
    opacity: 0.8;
  }
}

/* UI层 */
.ui-layer {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

/* 顶部栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 20px;
}

.top-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.time-display {
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 15px;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }

  .date-text {
    font-size: 12px;
    color: #666;
  }

  .weeks-info {
    font-size: 20px;
    font-weight: bold;
    color: #1a1a2e;
  }
}

.status-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

/* 体力条 (绿色) */
.hp-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hp-bar-wrapper {
  width: 120px;
  height: 12px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.hp-bar-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
}

.hp-bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.hp-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.hp-icon {
  width: 16px;
  height: 16px;
}

.hp-value {
  color: white;
  font-size: 14px;
  font-weight: bold;
}

/* P点条 */
.p-point-container {
  display: flex;
  align-items: center;
}

.p-point-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(147, 51, 234, 0.3);
  padding: 5px 15px;
  border-radius: 15px;
  border: 1px solid rgba(147, 51, 234, 0.5);
}

.p-label {
  font-weight: bold;
  color: #a78bfa;
  font-size: 14px;
}

.p-value {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.character-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.5);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

/* 三维属性 */
.stats-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  padding: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-arc-container {
  position: relative;
  width: 100px;
  height: 60px;
}

.stat-arc-svg {
  width: 100%;
  height: 100%;
}

.stat-grade-letter {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -20%);

  .grade {
    font-size: 36px;
    font-weight: bold;
    color: white;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  }
}

.stat-details {
  display: flex;
  align-items: center;
  gap: 5px;
  color: white;

  .stat-icon {
    width: 18px;
    height: 18px;
  }

  .stat-value {
    font-size: 18px;
    font-weight: bold;
  }

  .stat-max {
    font-size: 12px;
    opacity: 0.7;
  }
}

.stat-multiplier {
  min-height: 16px;

  .multiplier-value {
    font-size: 12px;
    color: #4ade80;
  }
}

/* 行动提示 */
.action-prompt {
  text-align: center;
  padding: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

/* 活动区域 */
.activity-section {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
}

.activity-slot {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.activity-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: rgba(255, 255, 255, 0.5);

  i {
    font-size: 24px;
  }

  span {
    font-size: 12px;
  }
}

/* 底部工具栏 */
.bottom-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.5));
}

.drinks-section {
  display: flex;
  gap: 10px;
}

.drink-slot {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  .drink-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }

  .empty-drink {
    color: rgba(255, 255, 255, 0.3);
    font-size: 20px;
  }
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  i {
    font-size: 20px;
  }

  span {
    font-size: 12px;
  }

  &.deck-btn {
    color: #a78bfa;
  }
  &.phone-btn {
    color: #60a5fa;
  }
  &.diary-btn {
    color: #f472b6;
  }
}

/* 日历弹窗 */
.calendar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.calendar-popup {
  background: white;
  border-radius: 20px;
  padding: 20px;
  min-width: 300px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  }
}

.calendar-content {
  text-align: center;

  .current-date-display {
    font-size: 24px;
    font-weight: bold;
    color: #1a1a2e;
    margin-bottom: 20px;

    .year {
      color: #666;
      font-size: 18px;
    }
    .month {
      color: #ff69b4;
    }
    .day {
      color: #1a1a2e;
    }
  }

  .competition-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #666;

    i {
      color: #fbbf24;
    }
  }
}
</style>
