<template>
  <Teleport to="body">
    <Transition name="phone-overlay">
      <div v-if="isOpen" class="phone-overlay" @click.self="handleClose">
        <Transition name="phone-slide">
          <div v-if="isOpen" class="phone-container">
            <!-- 关闭按钮 -->
            <button class="close-btn" aria-label="关闭手机" @click="handleClose">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path
                  fill="currentColor"
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                />
              </svg>
            </button>

            <!-- 手机内容区域 -->
            <div class="phone-content">
              <!-- 设置页面 -->
              <PhoneSettings v-if="showSettings" @close="showSettings = false" @saved="handleSettingsSaved" />

              <!-- 主页 -->
              <PhoneHome
                v-else-if="currentApp === null"
                :unreads="unreads"
                @open="handleAppOpen"
                @open-settings="showSettings = true"
              />

              <!-- Chain 应用 -->
              <ChainApp v-else-if="currentApp === 'chain'" @back="handleBack" @unread-update="handleChainUnread" />

              <!-- Twesta 应用 -->
              <TwestaApp v-else-if="currentApp === 'twesta'" ref="twestaRef" @back="handleBack" />

              <!-- Phone 应用 -->
              <PhoneCallApp v-else-if="currentApp === 'phone'" ref="phoneRef" @back="handleBack" />

              <!-- OurStream 应用 -->
              <OurStreamApp v-else-if="currentApp === 'ourstream'" ref="ourstreamRef" @back="handleBack" />

              <!-- 其他应用页面 (占位符) -->
              <div v-else class="app-placeholder">
                <div class="placeholder-header">
                  <button class="back-btn" @click="handleBack">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                    返回
                  </button>
                  <span class="app-title">{{ currentAppTitle }}</span>
                </div>
                <div class="placeholder-content">
                  <span class="placeholder-icon">🚧</span>
                  <span class="placeholder-text">{{ currentAppTitle }} 开发中...</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { AppId, UnreadCounts } from '../类型/PhoneTypes';
import ChainApp from './ChainApp.vue';
import OurStreamApp from './OurStreamApp.vue';
import PhoneCallApp from './PhoneCallApp.vue';
import PhoneHome from './PhoneHome.vue';
import PhoneSettings from './PhoneSettings.vue';
import TwestaApp from './TwestaApp.vue';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    unreads?: UnreadCounts;
  }>(),
  {
    modelValue: false,
    unreads: () => ({ chain: 0, phone: 0 }),
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'app-open', id: AppId): void;
  (e: 'unread-update', count: number): void;
}>();

const isOpen = ref(props.modelValue);
const currentApp = ref<AppId | null>(null);
const showSettings = ref(false);
const chainUnreads = ref(0); // Chain 应用未读数

// 合并未读数
const unreads = computed(() => ({
  ...props.unreads,
  chain: chainUnreads.value,
}));

const currentAppTitle = computed(() => {
  const titles: Record<AppId, string> = {
    twesta: 'Twesta',
    chain: 'CHAIN',
    phone: '電話',
    ourstream: 'OurSTREAM',
  };
  return currentApp.value ? titles[currentApp.value] : '';
});

watch(
  () => props.modelValue,
  val => {
    isOpen.value = val;
    if (!val) {
      currentApp.value = null;
    }
  },
);

watch(isOpen, val => {
  emit('update:modelValue', val);
});

function handleClose() {
  isOpen.value = false;
}

function handleAppOpen(id: AppId) {
  currentApp.value = id;
  emit('app-open', id);
}

function handleBack() {
  currentApp.value = null;
}

function handleSettingsSaved() {
  // API 设置已保存，可以在这里添加通知
  console.log('[Phone] API settings saved');
}

function handleChainUnread(count: number) {
  chainUnreads.value = count;
  emit('unread-update', count); // 通知父组件更新未读红点
  console.log(`[Phone] Chain 未读更新: ${count}`);
}

defineExpose({
  open: () => {
    isOpen.value = true;
  },
  close: () => {
    isOpen.value = false;
  },
  openApp: (id: AppId) => {
    isOpen.value = true;
    currentApp.value = id;
  },
});
</script>

<style scoped lang="scss">
.phone-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-end; /* 底部对齐 */
  justify-content: center;
  z-index: 20000;
}

.phone-container {
  position: relative;
  width: min(520px, 95vw); /* 更宽 */
  height: 85vh; /* 更高，露出大部分 */
  max-height: 900px;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 100;

  &:hover {
    background: rgba(0, 0, 0, 0.5);
    transform: scale(1.1);
  }
}

.phone-content {
  width: 100%;
  height: 100%;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  border-bottom-left-radius: 0; /* 底部直角，制造无限延伸感 */
  border-bottom-right-radius: 0;
  overflow: hidden;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3);
}

.app-placeholder {
  width: 100%;
  aspect-ratio: 9 / 16;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  border-radius: 48px;
  overflow: hidden;
}

.placeholder-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.app-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.placeholder-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.placeholder-icon {
  font-size: 48px;
}

.placeholder-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

/* 过渡动画 */
.phone-overlay-enter-active,
.phone-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.phone-overlay-enter-from,
.phone-overlay-leave-to {
  opacity: 0;
}

.phone-slide-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.phone-slide-leave-active {
  transition: all 0.25s ease-in;
}

.phone-slide-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(40px);
}

.phone-slide-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
