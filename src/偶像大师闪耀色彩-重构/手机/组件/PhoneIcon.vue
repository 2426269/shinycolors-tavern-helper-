<template>
  <button
    class="phone-icon"
    :class="{ 'has-notification': hasNotification }"
    @click="handleClick"
    aria-label="打开手机"
  >
    <!-- 手机图标 -->
    <div class="icon-body">
      <svg viewBox="0 0 24 24" class="phone-svg">
        <rect x="5" y="2" width="14" height="20" rx="2" fill="currentColor" />
        <rect x="7" y="4" width="10" height="14" rx="1" fill="#1a1a2e" />
        <circle cx="12" cy="20" r="1" fill="#666" />
      </svg>

      <!-- 通知红点 -->
      <span v-if="hasNotification" class="notification-dot">
        <span class="dot-ping"></span>
        <span class="dot-core"></span>
      </span>
    </div>

    <!-- 提示文字 -->
    <span class="icon-label">手机</span>
  </button>
</template>

<script setup lang="ts">
import { gsap } from 'gsap';
import { computed } from 'vue';
import type { UnreadCounts } from '../类型/PhoneTypes';

const props = withDefaults(
  defineProps<{
    unreads?: UnreadCounts;
  }>(),
  {
    unreads: () => ({}),
  },
);

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const hasNotification = computed(() => {
  const counts = props.unreads;
  return Object.values(counts).some(v => v && v > 0);
});

function handleClick(evt: MouseEvent) {
  const btn = evt.currentTarget as HTMLElement;

  // 点击动画
  gsap
    .timeline()
    .to(btn, { scale: 0.9, duration: 0.1 })
    .to(btn, { scale: 1.1, duration: 0.15 })
    .to(btn, { scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.5)' });

  emit('click');
}
</script>

<style scoped lang="scss">
.phone-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}

.icon-body {
  position: relative;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone-svg {
  width: 32px;
  height: 32px;
  color: #e0e0e0;
}

.notification-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
}

.dot-ping {
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: #ff3b30;
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.dot-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #ff3b30;
  box-shadow: 0 2px 4px rgba(255, 59, 48, 0.5);
}

@keyframes ping {
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.icon-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* 有通知时的强调效果 */
.has-notification {
  .icon-body {
    animation: shake 0.5s ease-in-out infinite;
    animation-delay: 3s;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}
</style>
