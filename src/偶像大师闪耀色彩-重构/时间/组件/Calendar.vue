<template>
  <div class="schedule-page">
    <!-- 左侧：状态与当前周操作面板 -->
    <div class="left-panel">
      <!-- 头部信息卡片 -->
      <div class="status-card">
        <!-- 装饰性背景文字 -->
        <div class="bg-decoration font-marker">283</div>

        <div class="status-content">
          <div class="status-header">
            <div>
              <h2 class="subtitle">PRODUCER SCHEDULE</h2>
              <h1 class="date-text font-marker">{{ formatDate(currentDateObj) }}</h1>
              <p class="week-text font-pen">
                第 {{ currentWeek }} 周
                <span class="season-tag">/ Season 1</span>
              </p>
            </div>
            <div class="produce-tag font-marker">
              {{ produceName }}
            </div>
          </div>

          <!-- 资源展示 -->
          <div class="resource-row">
            <div class="resource-item">
              <span class="resource-label">体力</span>
              <span class="resource-value font-marker">{{ stamina }}/{{ maxStamina }}</span>
            </div>
            <div class="resource-item">
              <span class="resource-label">P点</span>
              <span class="resource-value ppoints font-marker">{{ pPoints }}</span>
            </div>
            <div class="resource-item fans">
              <span class="resource-label">粉丝数</span>
              <span class="resource-value font-marker">{{ formatNumber(fans) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 本周行动选择 -->
      <div class="action-card">
        <h3 class="action-title font-marker">
          <i class="fas fa-calendar-check"></i>
          本周预定
        </h3>

        <!-- 有活动数据时显示 -->
        <div v-if="weeklyActivities.length > 0" class="action-list">
          <button
            v-for="action in weeklyActivities"
            :key="action.id"
            :class="['action-btn', action.type, { selected: selectedAction === action.id }]"
            @click="selectAction(action.id)"
          >
            <div class="action-icon" :class="action.type">
              <i :class="action.icon"></i>
            </div>
            <div class="action-info">
              <div class="action-name font-marker">{{ action.name }}</div>
              <div class="action-desc font-pen">{{ action.description }}</div>
            </div>
            <!-- 选中标记 -->
            <div v-if="selectedAction === action.id" class="check-mark font-pen">✓</div>
          </button>
        </div>

        <!-- 占位符：日程系统开发中 -->
        <div v-else class="schedule-placeholder">
          <div class="placeholder-icon">
            <i class="fas fa-tools"></i>
          </div>
          <p class="placeholder-text font-pen">日程规划系统开发中...</p>
          <p class="placeholder-hint">活动选择功能将在后续版本提供</p>
        </div>

        <div v-if="weeklyActivities.length > 0" class="confirm-section">
          <button class="confirm-btn font-marker" @click="$emit('confirmSchedule')">
            <span>确认日程</span>
            <i class="fas fa-arrow-right"></i>
          </button>
          <p class="confirm-hint font-pen">点击将推进 1 周时间 (+7 Days)</p>
        </div>
      </div>
    </div>

    <!-- 右侧：月历视图 -->
    <div class="right-panel">
      <!-- 螺旋装订孔装饰 -->
      <div class="binding-holes">
        <div v-for="i in 8" :key="i" class="hole"></div>
      </div>

      <!-- 月历头部导航 -->
      <div class="calendar-nav">
        <button class="nav-btn" @click="changeMonth(-1)">
          <i class="fas fa-chevron-left"></i>
        </button>
        <h2 class="month-title font-marker">
          {{ displayYear }} <span class="month-num">.{{ displayMonth + 1 }}</span>
        </h2>
        <button class="nav-btn" @click="changeMonth(1)">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <!-- 星期表头 -->
      <div class="weekday-header">
        <div v-for="day in weekDays" :key="day" class="weekday-cell font-marker">
          {{ day }}
        </div>
      </div>

      <!-- 日历网格 -->
      <div class="calendar-grid">
        <!-- 空白占位 -->
        <div v-for="blank in firstDayOfMonth" :key="'blank-' + blank" class="day-cell empty"></div>

        <!-- 日期单元格 -->
        <div
          v-for="date in daysInMonth"
          :key="date.day"
          :class="[
            'day-cell',
            { 'current-week': isDateInCurrentWeek(date.fullDate) },
            { today: isToday(date.fullDate) },
          ]"
        >
          <!-- 日期数字 -->
          <span :class="['day-number', { 'today-number': isToday(date.fullDate) }]">
            {{ date.day }}
          </span>

          <!-- 事件标记 -->
          <div class="event-container">
            <!-- Today 标记 -->
            <div v-if="isDateInCurrentWeek(date.fullDate) && isToday(date.fullDate)" class="today-label font-pen">
              Today!
            </div>

            <!-- 事件渲染 -->
            <template v-for="event in getEventsForDay(date.fullDate)" :key="event.title">
              <!-- 比赛日 (红笔圈) -->
              <div v-if="event.type === 'audition'" class="event-audition">
                <div class="circle-border"></div>
                <div class="event-content">
                  <span class="important-tag font-marker">IMPORTANT</span>
                  <span class="event-title font-pen">{{ event.title }}</span>
                </div>
              </div>

              <!-- 生日 -->
              <div v-else-if="event.type === 'birthday'" class="event-birthday">
                <i class="fas fa-birthday-cake"></i>
                <span class="event-title font-marker highlight-pink">{{ event.title }}</span>
              </div>

              <!-- 节日/活动 -->
              <div v-else-if="event.type === 'festival'" class="event-festival">
                <span class="event-title font-pen highlight-yellow">★ {{ event.title }}</span>
              </div>

              <!-- 普通剧情 -->
              <div v-else class="event-story">
                <span class="event-title font-pen">{{ event.title }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 关闭按钮 -->
    <button class="close-btn" @click="$emit('close')">
      <i class="fas fa-times"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { getEventsForDate, type CalendarEvent } from '../服务/CalendarEvents';

// Props
const props = withDefaults(
  defineProps<{
    /** 副本名称 */
    produceName?: string;
    /** 当前日期 YYYY-MM-DD */
    currentDate?: string;
    /** 当前周数 */
    currentWeek?: number;
    /** 体力 */
    stamina?: number;
    /** 最大体力 */
    maxStamina?: number;
    /** P点 */
    pPoints?: number;
    /** 粉丝数 */
    fans?: number;
    /** 本周可选行动（接口预留） */
    weeklyActivities?: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      type: string;
    }>;
  }>(),
  {
    produceName: 'W.I.N.G.',
    currentDate: '2018-04-24',
    currentWeek: 1,
    stamina: 30,
    maxStamina: 30,
    pPoints: 0,
    fans: 0,
    weeklyActivities: () => [],
  },
);

// Emits
defineEmits<{
  close: [];
  confirmSchedule: [];
  selectAction: [actionId: string];
}>();

// 选中的行动
const selectedAction = ref('lesson');

// 星期显示
const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// 视图控制
const viewDate = ref(new Date(props.currentDate));

// 计算属性
const displayYear = computed(() => viewDate.value.getFullYear());
const displayMonth = computed(() => viewDate.value.getMonth());

const currentDateObj = computed(() => new Date(props.currentDate));

const firstDayOfMonth = computed(() => {
  return new Date(displayYear.value, displayMonth.value, 1).getDay();
});

const daysInMonth = computed(() => {
  const days = new Date(displayYear.value, displayMonth.value + 1, 0).getDate();
  const result = [];
  for (let i = 1; i <= days; i++) {
    const fullDate = new Date(displayYear.value, displayMonth.value, i);
    result.push({ day: i, fullDate });
  }
  return result;
});

// 方法
const formatDate = (date: Date): string => {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const formatDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isToday = (date: Date): boolean => {
  return date.toDateString() === currentDateObj.value.toDateString();
};

const isDateInCurrentWeek = (date: Date): boolean => {
  const start = new Date(currentDateObj.value);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return date >= start && date <= end;
};

const getEventsForDay = (date: Date): CalendarEvent[] => {
  const dateStr = formatDateStr(date);
  return getEventsForDate(dateStr);
};

const changeMonth = (delta: number) => {
  const newDate = new Date(viewDate.value);
  newDate.setMonth(newDate.getMonth() + delta);
  viewDate.value = newDate;
};

const selectAction = (actionId: string) => {
  selectedAction.value = actionId;
};
</script>

<style scoped lang="scss">
/* 手写字体 */
@import url('https://fonts.googleapis.com/css2?family=Long+Cang&family=ZCOOL+KuaiLe&display=swap');

.font-marker {
  font-family: 'ZCOOL KuaiLe', 'Microsoft YaHei', cursive;
}
.font-pen {
  font-family: 'Long Cang', 'Microsoft YaHei', cursive;
}

.schedule-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20000;
  display: flex;
  background: #f8f9fa;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

/* 左侧面板 */
.left-panel {
  width: 33%;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.status-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #60a5fa;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  right: -20px;
  top: -20px;
  font-size: 100px;
  color: rgba(0, 0, 0, 0.03);
  transform: rotate(12deg);
  pointer-events: none;
}

.status-content {
  position: relative;
  z-index: 1;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.subtitle {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 1px;
  margin: 0;
}

.date-text {
  font-size: 28px;
  color: #1f2937;
  margin: 4px 0;
}

.week-text {
  font-size: 18px;
  color: #3b82f6;
  margin: 0;
}

.season-tag {
  font-size: 12px;
  color: #9ca3af;
  font-family: sans-serif;
}

.produce-tag {
  background: white;
  border: 2px solid #bfdbfe;
  color: #3b82f6;
  padding: 4px 12px;
  font-size: 13px;
  transform: rotate(3deg);
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.05);
}

.resource-row {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 2px dashed #e5e7eb;
}

.resource-item {
  display: flex;
  flex-direction: column;
  align-items: center;

  &.fans {
    margin-left: auto;
  }
}

.resource-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 700;
}

.resource-value {
  font-size: 18px;
  color: #374151;

  &.ppoints {
    color: #8b5cf6;
  }
}

/* 行动选择卡片 */
.action-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.action-title {
  font-size: 16px;
  color: #374151;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 8px;

  i {
    color: #3b82f6;
  }
}

/* 占位符样式 */
.schedule-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  flex: 1;
}

.placeholder-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;

  i {
    font-size: 24px;
    color: #9ca3af;
  }
}

.placeholder-text {
  font-size: 18px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.placeholder-hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid #f3f4f6;
  background: white;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    border-color: #e5e7eb;
  }

  &.selected {
    &.lesson {
      border-color: #60a5fa;
      background: #eff6ff;
    }
    &.work {
      border-color: #4ade80;
      background: #f0fdf4;
    }
    &.rest {
      border-color: #fbbf24;
      background: #fefce8;
    }
  }
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;

  &.lesson {
    background: #dbeafe;
    color: #3b82f6;
  }
  &.work {
    background: #dcfce7;
    color: #22c55e;
  }
  &.rest {
    background: #fef3c7;
    color: #f59e0b;
  }
}

.action-name {
  font-size: 16px;
  color: #1f2937;
}

.action-desc {
  font-size: 14px;
  color: #6b7280;
}

.check-mark {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%) rotate(-12deg);
  font-size: 48px;
  opacity: 0.2;

  .lesson & {
    color: #3b82f6;
  }
  .work & {
    color: #22c55e;
  }
  .rest & {
    color: #f59e0b;
  }
}

.confirm-section {
  margin-top: auto;
  padding-top: 24px;
}

.confirm-btn {
  width: 100%;
  background: #1f2937;
  color: white;
  border: none;
  padding: 14px 24px;
  font-size: 18px;
  border-radius: 4px 4px 20px 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;

  &:hover {
    background: #374151;
  }

  &:active {
    transform: scale(0.98);
  }
}

.confirm-hint {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin: 8px 0 0 0;
}

/* 右侧月历面板 */
.right-panel {
  flex: 1;
  background: white;
  border-radius: 16px;
  margin: 20px;
  margin-left: 0;
  padding: 24px;
  padding-left: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  display: flex;
  flex-direction: column;
}

.binding-holes {
  position: absolute;
  left: -12px;
  top: 60px;
  bottom: 60px;
  width: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}

.hole {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  border-right: 2px solid #d1d5db;
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.calendar-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-left: 16px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f3f4f6;
  }
}

.month-title {
  font-size: 28px;
  color: #1f2937;
  margin: 0;

  .month-num {
    color: #3b82f6;
  }
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
  padding-left: 16px;
}

.weekday-cell {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  padding: 8px 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  flex: 1;
  padding-left: 16px;
}

.day-cell {
  min-height: 100px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #f3f4f6;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &.empty {
    border: none;
  }

  &.current-week {
    background: rgba(239, 246, 255, 0.6);
    border: 2px dashed #93c5fd;
  }
}

.day-number {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;

  &.today-number {
    background: #1f2937;
    color: white;
    border-radius: 50%;
  }
}

.event-container {
  margin-top: 4px;
  position: relative;
}

.today-label {
  position: absolute;
  top: -28px;
  right: -8px;
  transform: rotate(12deg);
  color: #3b82f6;
  font-size: 14px;
  font-weight: 600;
}

.event-audition {
  position: relative;
  margin-top: 8px;
  text-align: center;
  transform: rotate(-2deg);

  .circle-border {
    position: absolute;
    inset: -4px;
    border: 3px solid #ef4444;
    border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
    box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.05);
  }

  .event-content {
    position: relative;
    z-index: 1;
  }

  .important-tag {
    display: block;
    font-size: 10px;
    color: #ef4444;
    letter-spacing: 0.5px;
  }

  .event-title {
    font-size: 12px;
    color: #1f2937;
  }
}

.event-birthday {
  text-align: center;
  margin-top: 4px;

  i {
    color: #ec4899;
    font-size: 14px;
  }

  .event-title {
    display: block;
    font-size: 12px;
    color: #ec4899;
    margin-top: 2px;
  }
}

.highlight-pink {
  background: linear-gradient(120deg, rgba(249, 168, 212, 0) 0%, rgba(249, 168, 212, 0.4) 100%);
  padding: 0 4px;
}

.event-festival {
  margin-top: 4px;

  .event-title {
    font-size: 12px;
    color: #d97706;
    transform: rotate(1deg);
    display: inline-block;
  }
}

.highlight-yellow {
  background: linear-gradient(120deg, rgba(253, 224, 71, 0) 0%, rgba(253, 224, 71, 0.6) 100%);
  border-bottom: 2px solid rgba(234, 179, 8, 0.4);
  padding: 0 4px;
}

.event-story {
  margin-top: 4px;
  padding-left: 8px;
  border-left: 2px solid #d1d5db;

  .event-title {
    font-size: 11px;
    color: #4b5563;
  }
}

/* 关闭按钮 */
.close-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.2);
    color: #1f2937;
  }
}
</style>
