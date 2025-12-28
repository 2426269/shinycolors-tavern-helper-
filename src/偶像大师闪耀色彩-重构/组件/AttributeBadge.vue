<template>
  <div
    class="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs font-bold border border-gray-200 shadow-sm select-none"
    :class="colorClass"
  >
    <img v-if="iconUrl" :src="iconUrl" class="w-4 h-4 object-contain" />
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CDN_BASE } from '../工具/constants';

const props = defineProps<{
  type: 'Vo' | 'Da' | 'Vi' | 'Me' | 'Sense' | 'Logic' | 'Anomaly';
}>();

const iconUrl = computed(() => {
  switch (props.type) {
    case 'Sense':
      return `${CDN_BASE}/游戏图标/感性.png`;
    case 'Logic':
      return `${CDN_BASE}/游戏图标/成长.png`; // 暂代
    case 'Anomaly':
      return `${CDN_BASE}/游戏图标/非凡.png`;
    // TODO: Vo/Da/Vi 图标
    default:
      return '';
  }
});

const label = computed(() => {
  switch (props.type) {
    case 'Sense':
      return '感性';
    case 'Logic':
      return '理性';
    case 'Anomaly':
      return '非凡';
    default:
      return props.type;
  }
});

const colorClass = computed(() => {
  switch (props.type) {
    case 'Sense':
      return 'text-pink-600 bg-pink-50 border-pink-100';
    case 'Logic':
      return 'text-blue-600 bg-blue-50 border-blue-100';
    case 'Anomaly':
      return 'text-orange-600 bg-orange-50 border-orange-100';
    case 'Vo':
      return 'text-pink-600 bg-pink-50';
    case 'Da':
      return 'text-blue-600 bg-blue-50';
    case 'Vi':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
});
</script>
