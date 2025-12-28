<template>
  <div
    class="group relative flex h-48 w-32 cursor-pointer flex-col overflow-hidden rounded-lg border-2 bg-white shadow-md transition-transform select-none hover:scale-105"
    :class="borderColorClass"
  >
    <!-- 顶部：Cost -->
    <div class="absolute top-1 left-1 z-10 flex items-center gap-1">
      <div
        class="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-blue-500 text-xs font-bold text-white shadow-sm"
      >
        {{ costValue }}
      </div>
    </div>

    <!-- 卡面区域 (占 60%) -->
    <div class="relative h-[60%] overflow-hidden bg-gray-100">
      <!-- 占位图或实际图片 -->
      <div
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-xs text-gray-300"
      >
        <span v-if="!imageUrl">NO IMAGE</span>
        <img
          v-else
          :src="imageUrl"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>

      <!-- 稀有度标签 -->
      <div class="absolute top-1 right-1">
        <span class="rounded px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm" :class="rarityColorClass">
          {{ card.rarity }}
        </span>
      </div>
    </div>

    <!-- 底部信息区域 (占 40%) -->
    <div class="relative flex flex-1 flex-col justify-between bg-white p-2">
      <!-- 标题 -->
      <div class="mb-1 truncate border-b border-gray-100 pb-1 text-xs font-bold text-gray-800">
        {{ card.name }}
      </div>

      <!-- 效果描述 -->
      <div class="line-clamp-3 overflow-hidden text-[9px] leading-tight text-gray-600">
        {{ card.effect_before }}
      </div>

      <!-- 属性条 (装饰) -->
      <div class="mt-1 h-1 w-full rounded-full opacity-50" :class="planColorClass"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SkillCard } from '../战斗/类型/技能卡类型';

const props = defineProps<{
  card: SkillCard;
  imageUrl?: string;
}>();

// Cost 显示
const costValue = computed(() => {
  const match = props.card.cost.match(/(\d+)/);
  return match ? match[1] : '-';
});

// 边框颜色 (根据稀有度)
const borderColorClass = computed(() => {
  switch (props.card.rarity) {
    case 'UR':
      return 'border-purple-500';
    case 'SSR':
      return 'border-yellow-500';
    case 'SR':
      return 'border-yellow-300';
    case 'R':
      return 'border-gray-300';
    case 'N':
      return 'border-gray-200';
    default:
      return 'border-gray-200';
  }
});

// 稀有度背景色
const rarityColorClass = computed(() => {
  switch (props.card.rarity) {
    case 'UR':
      return 'bg-gradient-to-r from-purple-500 to-pink-500';
    case 'SSR':
      return 'bg-gradient-to-r from-yellow-400 to-orange-400';
    case 'SR':
      return 'bg-yellow-400';
    case 'R':
      return 'bg-blue-400';
    case 'N':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
});

// 计划颜色 (底部条)
const planColorClass = computed(() => {
  switch (props.card.plan) {
    case '感性':
      return 'bg-pink-400';
    case '理性':
      return 'bg-blue-400';
    case '非凡':
      return 'bg-orange-400';
    case '自由':
      return 'bg-green-400';
    default:
      return 'bg-gray-300';
  }
});
</script>
