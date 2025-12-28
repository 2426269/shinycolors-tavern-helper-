<template>
  <div class="relative h-full w-full overflow-hidden bg-gray-50 font-sans select-none">
    <!-- 背景 -->
    <div class="absolute inset-0 z-0">
      <img :src="bgUrl" class="h-full w-full object-cover opacity-80" />
      <div class="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/30"></div>
    </div>

    <!-- 顶部导航 -->
    <div
      class="absolute top-0 right-0 left-0 z-20 flex h-14 items-center justify-between border-b border-gray-100 bg-white/95 px-5 shadow-sm backdrop-blur-md"
    >
      <div class="flex items-center gap-3">
        <!-- 返回按钮 -->
        <button
          class="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
          @click="$emit('close')"
        >
          <i class="fas fa-arrow-left"></i>
        </button>

        <!-- 流派名称 -->
        <div class="flex items-center gap-2.5">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-white shadow-sm"
            :style="{ backgroundColor: flow?.visualTheme?.color || '#6366f1' }"
          >
            {{ flow?.visualTheme?.icon || '📁' }}
          </div>
          <div class="text-lg font-bold text-gray-800">{{ flow?.nameCN || '未命名流派' }}</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="absolute inset-0 z-10 flex gap-5 overflow-hidden px-5 pt-18 pb-5">
      <!-- 左侧：企划档案 -->
      <div class="scrollbar-thin flex w-96 flex-shrink-0 flex-col gap-4 overflow-y-auto pr-2">
        <!-- 流派概览卡 -->
        <OfficePanel class="overflow-hidden">
          <!-- 顶部彩带 -->
          <div class="h-1.5" :style="{ backgroundColor: flow?.visualTheme?.color || '#6366f1' }"></div>

          <div class="p-5">
            <!-- 父流派标识 -->
            <div v-if="flow?.parentCoreFlow" class="mb-3 flex items-center gap-2">
              <span class="text-xs text-gray-400">归属流派</span>
              <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                {{ flow.parentCoreFlow }}
              </span>
            </div>

            <!-- 描述 -->
            <div class="mb-5">
              <div class="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">概述</div>
              <p class="text-sm leading-relaxed text-gray-700">{{ flow?.description || '暂无描述' }}</p>
            </div>

            <!-- 标签 -->
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in flow?.tags || []"
                :key="tag"
                class="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
              >
                {{ formatTag(tag) }}
              </span>
              <span v-if="!flow?.tags?.length" class="text-xs text-gray-400">暂无标签</span>
            </div>
          </div>
        </OfficePanel>

        <!-- 核心机制详情 -->
        <OfficePanel class="p-5">
          <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
            <span class="flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-xs text-purple-600"
              >⚙</span
            >
            核心机制
          </h3>

          <div class="space-y-3">
            <div
              v-for="mech in flowMechanics"
              :key="mech.id"
              class="rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 transition-shadow hover:shadow-md"
            >
              <!-- 机制头部 -->
              <div class="mb-2 flex items-center gap-2">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm"
                  :style="{ backgroundColor: mech.visual?.color || '#6366f1' }"
                >
                  {{ mech.visual?.symbol || '?' }}
                </div>
                <div>
                  <div class="text-sm font-bold text-gray-800">{{ mech.name }}</div>
                  <div class="text-xs text-gray-400">{{ mech.id }}</div>
                </div>
              </div>

              <!-- 机制描述 -->
              <p class="mb-3 text-xs leading-relaxed text-gray-600">{{ mech.description }}</p>

              <!-- 触发时机 -->
              <div v-if="mech.triggerHook" class="flex items-center gap-1.5">
                <span class="text-xs text-gray-400">触发:</span>
                <span class="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {{ formatHookName(mech.triggerHook) }}
                </span>
              </div>
            </div>

            <div v-if="flowMechanics.length === 0" class="py-4 text-center text-sm text-gray-400">暂无已注册的机制</div>
          </div>
        </OfficePanel>

        <!-- AI 生成区 -->
        <OfficePanel class="p-5">
          <h3 class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700">
            <span class="flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-xs text-blue-600">🤖</span>
            AI 辅助
          </h3>

          <div class="space-y-3">
            <button
              class="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg"
              :disabled="isGenerating"
              @click="generateCoreCard"
            >
              <i
                class="fas transition-transform group-hover:scale-110"
                :class="isGenerating ? 'fa-spinner fa-spin' : 'fa-star'"
              ></i>
              {{ isGenerating ? '生成中...' : '生成核心卡 (UR/SSR)' }}
            </button>

            <button
              class="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:from-purple-600 hover:to-pink-600 hover:shadow-lg"
              :disabled="isGenerating"
              @click="generateFlowCard"
            >
              <i
                class="fas transition-transform group-hover:scale-110"
                :class="isGenerating ? 'fa-spinner fa-spin' : 'fa-layer-group'"
              ></i>
              {{ isGenerating ? '生成中...' : '生成配套卡 (SR/R)' }}
            </button>
          </div>

          <p class="mt-4 text-xs leading-relaxed text-gray-400">
            AI 将根据流派机制自动生成配套技能卡，并添加到右侧卡牌列表。
          </p>
        </OfficePanel>
      </div>

      <!-- 右侧：卡牌列表 -->
      <div class="flex flex-1 flex-col gap-3 overflow-hidden">
        <!-- 标题栏 -->
        <div class="flex items-center justify-between px-1">
          <h3 class="flex items-center gap-2 text-sm font-bold text-gray-700">
            <i class="fas fa-layer-group text-gray-400"></i>
            已收集卡牌
            <span class="font-normal text-gray-400">({{ collectedCards.length }})</span>
          </h3>

          <div class="flex items-center gap-2">
            <!-- 筛选器 -->
            <select
              v-model="filterRarity"
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-blue-300 focus:outline-none"
            >
              <option value="">全部稀有度</option>
              <option value="UR">UR</option>
              <option value="SSR">SSR</option>
              <option value="SR">SR</option>
              <option value="R">R</option>
            </select>
          </div>
        </div>

        <!-- 卡牌网格 -->
        <div class="scrollbar-thin flex-1 overflow-y-auto pr-1">
          <div
            v-if="filteredCards.length > 0"
            class="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            <ShinyCard
              v-for="card in filteredCards"
              :key="card.id"
              :card="card"
              class="cursor-pointer transition-all hover:ring-2 hover:ring-blue-300"
              @click="selectCard(card)"
            />
          </div>

          <!-- 空状态 (垂直水平居中) -->
          <div v-else class="flex h-full flex-col items-center justify-center text-center">
            <div class="mb-4 text-7xl text-gray-200">📦</div>
            <p class="text-lg font-medium text-gray-500">暂无卡牌</p>
            <p class="mt-2 text-sm text-gray-400">使用左侧的 AI 辅助功能生成卡牌</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 卡牌详情弹窗 -->
    <div
      v-if="selectedCard"
      class="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click="selectedCard = null"
    >
      <div class="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" @click.stop>
        <div class="mb-4 flex items-start justify-between">
          <h3 class="text-lg font-bold text-gray-800">{{ selectedCard.name }}</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="selectedCard = null">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="space-y-3 text-sm">
          <div><span class="text-gray-500">稀有度:</span> {{ selectedCard.rarity }}</div>
          <div><span class="text-gray-500">消耗:</span> {{ selectedCard.cost }}</div>
          <div><span class="text-gray-500">计划:</span> {{ selectedCard.plan }}</div>
          <div>
            <span class="text-gray-500">效果:</span>
            <p class="mt-1 text-gray-700">{{ selectedCard.effect_before }}</p>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            class="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            @click="selectedCard = null"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { CDN_BASE } from '../工具/constants';
import { mechanicRegistry } from '../战斗/引擎-NG/MechanicRegistry';
import type { FlowDef } from '../战斗/引擎-NG/types';
import type { SkillCard } from '../战斗/类型/技能卡类型';
import OfficePanel from '../组件/OfficePanel.vue';
import ShinyCard from '../组件/ShinyCard.vue';

const props = defineProps<{
  flow: FlowDef | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update', flow: FlowDef): void;
}>();

const bgUrl = `${CDN_BASE}/background/00001.webp`;

// 状态
const isGenerating = ref(false);
const selectedCard = ref<SkillCard | null>(null);
const filterRarity = ref('');

// 模拟收集的卡牌
const collectedCards = ref<SkillCard[]>([]);

// 筛选后的卡牌
const filteredCards = computed(() => {
  if (!filterRarity.value) return collectedCards.value;
  return collectedCards.value.filter(c => c.rarity === filterRarity.value);
});

// 获取流派对应的所有机制详情
const flowMechanics = computed(() => {
  if (!props.flow?.keyMechanics?.length) return [];
  return props.flow.keyMechanics
    .map(id => mechanicRegistry.get(id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
});

// Tag 格式化 (snake_case -> Title Case)
function formatTag(tag: string): string {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Hook 名称格式化
function formatHookName(hook: string): string {
  const hookNames: Record<string, string> = {
    ON_LESSON_START: '训练开始',
    ON_TURN_START: '回合开始',
    ON_BEFORE_CARD_PLAY: '出牌前',
    ON_AFTER_CARD_PLAY: '出牌后',
    ON_TURN_END: '回合结束',
    ON_STATE_SWITCH: '状态切换',
  };
  return hookNames[hook] || hook;
}

// 获取机制名称
function getMechanicName(mechId: string): string {
  const mech = mechanicRegistry.get(mechId);

  return mech?.name || mechId;
}

// 选择卡牌
function selectCard(card: SkillCard) {
  selectedCard.value = card;
}

// AI 生成核心卡
async function generateCoreCard() {
  if (isGenerating.value || !props.flow) return;
  isGenerating.value = true;

  try {
    // TODO: 调用 AI生成助手.generateFlowCard()
    console.log('[P-Lab] 生成核心卡 for flow:', props.flow.id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toastr.success('核心卡生成成功！', '', { timeOut: 2000 });
  } catch (error) {
    console.error('[P-Lab] 生成失败:', error);
    toastr.error('生成失败，请重试', '', { timeOut: 3000 });
  } finally {
    isGenerating.value = false;
  }
}

// AI 生成配套卡
async function generateFlowCard() {
  if (isGenerating.value || !props.flow) return;
  isGenerating.value = true;

  try {
    // TODO: 调用 AI生成助手.generateFlowCard()
    console.log('[P-Lab] 生成配套卡 for flow:', props.flow.id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toastr.success('配套卡生成成功！', '', { timeOut: 2000 });
  } catch (error) {
    console.error('[P-Lab] 生成失败:', error);
    toastr.error('生成失败，请重试', '', { timeOut: 3000 });
  } finally {
    isGenerating.value = false;
  }
}
</script>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}
.pt-18 {
  padding-top: 4.5rem;
}
</style>
