<template>
  <div class="phone-peek">
    <!-- 裁切窗口：决定"露出多少屏幕" -->
    <div class="peek-viewport">
      <!-- 真正的"手机屏幕"本体：9:16，但会被 viewport 裁掉下面 -->
      <div class="device" :style="deviceStyle">
        <!-- 很薄的金属边 + 黑色内边框 -->
        <div class="device-frame">
          <div class="device-bezel">
            <div class="device-screen">
              <!-- 壁纸 -->
              <div class="wallpaper" aria-hidden="true"></div>

              <!-- 状态栏 -->
              <div class="status-bar">
                <span class="time">{{ currentTime }}</span>
                <div class="status-icons">
                  <span class="signal">📶</span>
                  <span class="battery">🔋</span>
                </div>
              </div>

              <!-- App 网格 -->
              <div class="apps-grid" role="menu" aria-label="手机主屏幕">
                <button
                  v-for="app in apps"
                  :key="app.id"
                  class="app"
                  :style="{ gridArea: app.id }"
                  type="button"
                  role="menuitem"
                  :aria-label="`${app.label}${unread(app.id) ? `，${unread(app.id)}条未读` : ''}`"
                  @click="handleOpen(app.id, $event)"
                >
                  <div class="icon" :class="`icon--${app.id}`">
                    <span v-if="unread(app.id) > 0" class="badge" aria-hidden="true"></span>

                    <!-- Twesta -->
                    <svg v-if="app.id === 'twesta'" class="icon-svg" viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="28" fill="none" stroke="white" stroke-width="10" />
                      <circle cx="50" cy="50" r="6" fill="white" opacity="0.95" />
                      <circle cx="67" cy="33" r="5.5" fill="white" opacity="0.95" />
                    </svg>

                    <!-- CHAIN -->
                    <div v-else-if="app.id === 'chain'" class="chain-bubble" aria-hidden="true">
                      <span class="chain-text">CHAIN</span>
                      <span class="chain-tail"></span>
                    </div>

                    <!-- 電話（仿 WhatsApp 风格：白圈+绿电话） -->
                    <svg v-else-if="app.id === 'phone'" class="icon-svg" viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="32" fill="white" />
                      <path
                        d="M38 33c3-3 8-3 11 0l2 2c2 2 2 6 0 8l-2 2c5 7 10 12 17 17l2-2c2-2 6-2 8 0l2 2c3 3 3 8 0 11l-2 2c-3 3-7 4-11 3-22-6-39-23-45-45-1-4 0-8 3-11l2-2z"
                        fill="currentColor"
                      />
                    </svg>

                    <!-- OurSTREAM -->
                    <div v-else class="our-mark" aria-hidden="true">
                      <div class="our-play">
                        <span class="our-tri"></span>
                      </div>
                      <div class="our-ur">ur</div>
                    </div>
                  </div>

                  <div class="label">{{ app.label }}</div>
                </button>
              </div>

              <!-- 设置按钮 -->
              <button class="settings-btn" aria-label="设置" @click="$emit('openSettings')">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
                  />
                </svg>
              </button>

              <!-- Home 指示条 -->
              <div class="home-indicator"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap';
import { computed, onMounted, onUnmounted, ref } from 'vue';

export type AppId = 'twesta' | 'chain' | 'phone' | 'ourstream';

interface AppDef {
  id: AppId;
  label: string;
}

const props = withDefaults(
  defineProps<{
    /** 未读红点：例如 { chain: 2, phone: 1 } */
    unreads?: Partial<Record<AppId, number>>;
    /**
     * 裁切可调参数
     * - peekScale：整体放大（>1 会更"贴脸"，露出更少底部）
     * - peekX/peekY：整体偏移
     */
    peekScale?: number;
    peekX?: string;
    peekY?: string;
  }>(),
  {
    unreads: () => ({ chain: 1, phone: 1 }),
    peekScale: 1,
    peekX: '0%',
    peekY: '0%',
  },
);

const emit = defineEmits<{
  (e: 'open', id: AppId): void;
  (e: 'openSettings'): void;
}>();

// 当前时间显示
const currentTime = ref('');
let timeInterval: number | undefined;

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
});

function updateTime() {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const apps = computed<AppDef[]>(() => [
  { id: 'twesta', label: 'Twesta' },
  { id: 'chain', label: 'CHAIN' },
  { id: 'phone', label: '電話' },
  { id: 'ourstream', label: 'OurSTREAM' },
]);

function unread(id: AppId): number {
  return Math.max(0, Number(props.unreads?.[id] ?? 0) || 0);
}

const deviceStyle = computed(() => {
  return {
    '--peek-scale': String(props.peekScale),
    '--peek-x': props.peekX,
    '--peek-y': props.peekY,
  } as Record<string, string>;
});

function handleOpen(id: AppId, evt: MouseEvent) {
  const btn = evt.currentTarget as HTMLElement | null;
  if (btn) {
    gsap.killTweensOf(btn);
    gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.2, ease: 'back.out(1.5)' });
  }
  emit('open', id);
}
</script>

<style scoped lang="scss">
.phone-peek {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
}

/* 裁切窗口 */
.peek-viewport {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: transparent;
}

/* 手机本体 */
.device {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  transform: translate(var(--peek-x), var(--peek-y)) scale(var(--peek-scale));
  transform-origin: top left;
}

/* 金属边框 */
.device-frame {
  width: 100%;
  height: 100%;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  padding: 6px 6px 0 6px;
  background: linear-gradient(135deg, #f2f2f2 0%, #9b9b9b 18%, #3a3a3a 48%, #bdbdbd 78%, #f7f7f7 100%);
  box-shadow:
    0 -8px 32px rgba(0, 0, 0, 0.3),
    inset 0 0 0 2px rgba(255, 255, 255, 0.4);
}

/* 黑色内边框 */
.device-bezel {
  width: 100%;
  height: 100%;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background: rgba(0, 0, 0, 0.92);
  padding: 8px 8px 0 8px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

/* 屏幕区域 */
.device-screen {
  width: 100%;
  height: 100%;
  border-top-left-radius: 22px;
  border-top-right-radius: 22px;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  overflow: hidden;
  position: relative;
}

/* 壁纸 */
.wallpaper {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(900px 700px at 30% 20%, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0) 55%),
    linear-gradient(135deg, #070822 0%, #071a57 42%, #056b80 100%);
}

.wallpaper::before,
.wallpaper::after {
  content: '';
  position: absolute;
  inset: -20%;
  transform: rotate(-14deg);
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0));
  opacity: 0.4;
}

.wallpaper::after {
  transform: rotate(-14deg) translateY(200px);
  opacity: 0.25;
}

/* 状态栏 */
.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
  z-index: 10;
}

.status-icons {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

/* App 网格 */
.apps-grid {
  position: absolute;
  inset: 80px 32px auto 32px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-areas:
    'twesta chain'
    'phone ourstream';
  gap: 24px;
  align-items: start;
  justify-items: center;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease;
}

.app:hover {
  transform: scale(1.05);
}

.app:active {
  transform: scale(0.95);
}

.icon {
  --icon-size: clamp(64px, 18vw, 80px);
  width: var(--icon-size);
  height: var(--icon-size);
  border-radius: 20px;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.label {
  font-size: clamp(12px, 3vw, 14px);
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  font-weight: 500;
}

/* 红点 */
.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #ff3b30;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 5;
}

.badge::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.9);
}

/* App 图标样式 */
.icon--twesta {
  background: linear-gradient(135deg, #79c8ff 0%, #b48cff 52%, #ff6aa7 100%);
}

.icon--chain {
  background: linear-gradient(135deg, #6ee9ff 0%, #74c6ff 100%);
}

.icon--phone {
  background: linear-gradient(135deg, #63ff6a 0%, #1fe05a 100%);
  color: #2bbf56;
}

.icon--ourstream {
  background: linear-gradient(135deg, #ff004a 0%, #ff3f79 100%);
}

.icon-svg {
  width: 70%;
  height: 70%;
}

/* CHAIN 气泡 */
.chain-bubble {
  width: 75%;
  height: 55%;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 14px;
  position: relative;
  display: grid;
  place-items: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.chain-text {
  font-weight: 800;
  letter-spacing: 1.5px;
  font-size: clamp(12px, 3.5vw, 16px);
  color: rgba(85, 210, 236, 0.95);
}

.chain-tail {
  position: absolute;
  left: 16px;
  bottom: -8px;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 12px solid rgba(255, 255, 255, 0.98);
}

/* OurSTREAM 标记 */
.our-mark {
  width: 70%;
  height: 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.98);
}

.our-play {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 4px solid rgba(255, 255, 255, 0.98);
  display: grid;
  place-items: center;
}

.our-tri {
  width: 0;
  height: 0;
  border-left: 10px solid rgba(255, 255, 255, 0.98);
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  margin-left: 3px;
}

.our-ur {
  font-weight: 900;
  font-size: 28px;
  letter-spacing: -1px;
}

/* 设置按钮 */
.settings-btn {
  position: absolute;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    color: white;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

/* Home 指示条 */
.home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2px;
}

/* 小屏适配 */
@media (max-width: 380px) {
  .apps-grid {
    inset: 60px 20px auto 20px;
    gap: 16px;
  }
  .icon {
    border-radius: 16px;
  }
}
</style>
