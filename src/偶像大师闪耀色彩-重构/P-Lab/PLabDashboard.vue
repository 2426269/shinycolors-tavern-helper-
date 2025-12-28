<template>
  <div class="relative h-full w-full overflow-hidden bg-gray-50 font-sans select-none">
    <!-- 背景 -->
    <div class="absolute inset-0 z-0">
      <img :src="bgUrl" class="h-full w-full object-cover opacity-90" />
      <div
        class="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-10"
      ></div>
    </div>

    <!-- Dashboard 模式 -->
    <template v-if="!selectedFlow">
      <!-- 顶部导航 -->
      <div
        class="absolute top-0 right-0 left-0 z-20 flex h-14 items-center justify-between border-b border-gray-100 bg-white/95 px-5 shadow-sm backdrop-blur-md"
      >
        <div class="flex items-center gap-3">
          <button
            class="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
            @click="$emit('close')"
          >
            <i class="fas fa-arrow-left"></i>
          </button>

          <div class="flex items-center gap-2">
            <div
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-xs font-bold text-white shadow-sm"
            >
              283
            </div>
            <div class="text-base font-bold tracking-wider text-gray-800">
              P-LAB <span class="ml-1 text-[10px] font-normal text-gray-400">流派开发室</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
            <i class="fas fa-robot mr-1 text-blue-500"></i>
            AI: <span class="text-green-500">在线</span>
          </div>
        </div>
      </div>

      <!-- 主要内容区 -->
      <div class="absolute inset-0 z-10 flex flex-col gap-5 overflow-hidden px-10 pt-18 pb-6">
        <!-- 上半部分：当前企划 -->
        <div class="flex min-h-0 flex-1 flex-col justify-center">
          <OfficePanel
            v-if="currentFlow"
            class="group relative mx-auto flex h-full max-h-[320px] w-full max-w-4xl cursor-pointer flex-col overflow-hidden transition-all hover:border-blue-300 hover:shadow-lg"
            @click="openFlow(currentFlow)"
          >
            <div class="flex h-full items-center">
              <div class="flex flex-1 flex-col justify-center p-8">
                <div class="mb-4 flex items-center gap-4">
                  <div
                    class="flex h-14 w-14 items-center justify-center rounded-xl text-2xl text-white shadow-md transition-transform group-hover:scale-110"
                    :style="{ backgroundColor: currentFlow.visualTheme?.color || '#6366f1' }"
                  >
                    {{ currentFlow.visualTheme?.icon || '📁' }}
                  </div>
                  <div>
                    <h2 class="mb-1 text-2xl font-bold text-gray-800">{{ currentFlow.nameCN }}</h2>
                    <div class="flex items-center gap-2">
                      <span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
                      <p class="text-sm font-medium text-gray-500">进行中</p>
                    </div>
                  </div>
                </div>
                <p class="mb-4 line-clamp-2 text-base leading-relaxed text-gray-600">{{ currentFlow.description }}</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in currentFlow.tags?.slice(0, 4)"
                    :key="tag"
                    class="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm text-blue-600"
                    >{{ formatTag(tag) }}</span
                  >
                </div>
              </div>
              <div
                class="flex h-full w-20 items-center justify-center bg-gray-50/50 text-gray-200 transition-colors group-hover:bg-blue-50/30 group-hover:text-blue-500"
              >
                <i class="fas fa-chevron-right transform text-3xl transition-transform group-hover:translate-x-1"></i>
              </div>
            </div>
          </OfficePanel>

          <OfficePanel
            v-else
            class="group relative mx-auto flex h-full max-h-[240px] w-full max-w-4xl cursor-pointer flex-col items-center justify-center overflow-hidden bg-white/80 transition-all hover:border-blue-300 hover:shadow-md"
            @click="showNewFlowModal = true"
          >
            <div class="p-8 text-center">
              <div class="mb-4 text-6xl text-gray-200 transition-colors duration-500 group-hover:text-blue-200">📁</div>
              <h2 class="mb-2 text-xl font-bold text-gray-700">当前没有进行中的企划</h2>
              <p class="text-gray-500">描述你的想法，让 AI 为你设计新流派</p>
            </div>
          </OfficePanel>
        </div>

        <!-- 下半部分：流派列表 -->
        <div class="flex h-48 w-full flex-shrink-0 flex-col">
          <div class="mb-2 flex items-center justify-between px-1">
            <h3 class="flex items-center gap-1.5 text-sm font-bold text-gray-600">
              <i class="fas fa-archive text-gray-400"></i>
              流派档案
            </h3>
            <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400"
              >{{ flows.length }} 个</span
            >
          </div>
          <div class="scrollbar-hide flex h-full w-full gap-4 overflow-x-auto px-1 pt-1 pb-3">
            <div
              v-for="flow in flows"
              :key="flow.id"
              class="group flex h-36 min-w-[200px] cursor-pointer flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              @click="openFlow(flow)"
            >
              <div>
                <div class="mb-2 flex items-center gap-2.5">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm transition-transform group-hover:scale-110"
                    :style="{ backgroundColor: flow.visualTheme?.color || '#6b7280' }"
                  >
                    {{ flow.visualTheme?.icon || '📁' }}
                  </div>
                  <div class="truncate font-bold text-gray-800">{{ flow.nameCN }}</div>
                </div>
                <div class="line-clamp-2 text-xs leading-relaxed text-gray-500">{{ flow.description }}</div>
              </div>
              <div class="flex items-center justify-between">
                <div class="text-[10px] text-gray-400">{{ formatDate(flow.createdAt) }}</div>
                <div
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-50 text-gray-300 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500"
                >
                  <i class="fas fa-arrow-right text-xs"></i>
                </div>
              </div>
            </div>

            <!-- 新建卡片 -->
            <div
              class="flex h-36 min-w-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 transition-all hover:border-blue-300 hover:bg-blue-50/30 hover:text-blue-500"
              @click="showNewFlowModal = true"
            >
              <i class="fas fa-plus mb-2 text-2xl"></i>
              <span class="text-xs font-medium">新建流派</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 流派详情页 -->
    <PLabProjectView v-else :flow="selectedFlow" @close="selectedFlow = null" @update="handleFlowUpdate" />

    <!-- 新建流派弹窗 (AI 生成) -->
    <div
      v-if="showNewFlowModal"
      class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      @click="showNewFlowModal = false"
    >
      <div
        class="mx-4 w-full max-w-lg scale-100 transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all"
        @click.stop
      >
        <div
          class="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5"
        >
          <div>
            <h3 class="text-xl font-bold text-gray-800">创建新流派</h3>
            <p class="mt-0.5 text-sm text-gray-500">描述你的想法，AI 将为你设计完整的战斗流派</p>
          </div>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/80 hover:text-gray-600"
            @click="showNewFlowModal = false"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="space-y-5 p-6">
          <div>
            <label class="mb-2 block text-sm font-bold text-gray-700"
              >流派名称 <span class="text-red-500">*</span></label
            >
            <input
              v-model="newFlow.name"
              type="text"
              class="w-full rounded-xl border border-gray-200 px-4 py-3 text-base transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-50 focus:outline-none"
              placeholder="如：病娇流、负面情绪流、逆境爆发流"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-gray-700"
              >创意描述 <span class="text-red-500">*</span></label
            >
            <textarea
              v-model="newFlow.description"
              rows="4"
              class="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-base transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-50 focus:outline-none"
              placeholder="详细描述你的流派构想。例如：我想做一个越痛越强的病娇流，核心机制是每回合自动扣血，但获得更高的得分倍率..."
            ></textarea>
            <p class="mt-1 text-xs text-gray-400">描述越详细，AI 设计的流派越精准</p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-bold text-gray-700">培育计划</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="plan in ['Sense', 'Logic', 'Anomaly', 'mixed']"
                :key="plan"
                :class="[
                  'rounded-lg border py-2.5 text-sm font-medium transition-all',
                  newFlow.plan === plan
                    ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-blue-300',
                ]"
                @click="newFlow.plan = plan"
              >
                {{ plan === 'Sense' ? '感性' : plan === 'Logic' ? '理性' : plan === 'Anomaly' ? '非凡' : '混合' }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-3 px-6 pt-2 pb-6">
          <button
            class="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-700 transition-colors hover:bg-gray-200"
            @click="showNewFlowModal = false"
          >
            取消
          </button>
          <button
            class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 font-bold text-white shadow-md transition-all hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg"
            :disabled="isGeneratingFlow"
            @click="createNewFlow"
          >
            <i class="fas" :class="isGeneratingFlow ? 'fa-spinner fa-spin' : 'fa-magic'"></i>
            {{ isGeneratingFlow ? 'AI 设计中...' : '让 AI 设计' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 原始输出查看器（作者调试用） -->
    <div
      v-if="showRawOutput"
      class="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      @click="showRawOutput = false"
    >
      <div
        class="mx-4 flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-gray-900 shadow-2xl"
        @click.stop
      >
        <div class="flex items-center justify-between border-b border-gray-700 px-5 py-4">
          <h3 class="text-lg font-bold text-white">🔧 AI 原始输出 (作者调试)</h3>
          <button
            class="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-700 hover:text-white"
            @click="showRawOutput = false"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="flex-1 overflow-auto p-4">
          <pre class="font-mono text-sm break-all whitespace-pre-wrap text-green-400">{{
            rawOutput || '暂无输出'
          }}</pre>
        </div>
      </div>
    </div>

    <!-- 作者调试按钮（右下角） -->
    <button
      v-if="rawOutput"
      class="absolute right-4 bottom-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg transition-colors hover:bg-gray-700"
      title="查看 AI 原始输出"
      @click="showRawOutput = true"
    >
      <i class="fas fa-terminal text-sm"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { AIGenerationAssistant } from '../世界书管理/AI生成助手';
import { CDN_BASE } from '../工具/constants';
import { flowRegistry } from '../战斗/引擎-NG/FlowRegistry';
import { mechanicRegistry } from '../战斗/引擎-NG/MechanicRegistry';
import type { FlowDef, ProducePlanNG } from '../战斗/引擎-NG/types';
import OfficePanel from '../组件/OfficePanel.vue';
import PLabProjectView from './PLabProjectView.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const bgUrl = `${CDN_BASE}/background/00001.webp`;

// AI 助手实例
const aiAssistant = new AIGenerationAssistant();

// 状态
const selectedFlow = ref<FlowDef | null>(null);
const showNewFlowModal = ref(false);
const currentFlow = ref<FlowDef | null>(null);
const isGeneratingFlow = ref(false);

// 新流派表单
const newFlow = reactive({
  name: '',
  description: '',
  plan: 'mixed' as ProducePlanNG | 'mixed',
});

// 流派数据 (从 FlowRegistry 获取)
const flows = ref<FlowDef[]>([]);

// 原始输出（作者调试用）
const rawOutput = ref<string>('');
const showRawOutput = ref(false);

// 初始化时加载已有流派
function loadFlows() {
  flows.value = flowRegistry.getAll();
}
loadFlows();

// 日期格式化
function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
}

// Tag 格式化（snake_case -> 可读）
function formatTag(tag: string): string {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// 打开流派详情
function openFlow(flow: FlowDef) {
  selectedFlow.value = flow;
}

// 处理流派更新
function handleFlowUpdate(updatedFlow: FlowDef) {
  flowRegistry.register(updatedFlow);
  loadFlows();
}

// 创建新流派 (调用 AI 生成)
async function createNewFlow() {
  if (!newFlow.name.trim()) {
    toastr.warning('请输入流派名称', '', { timeOut: 2000 });
    return;
  }
  if (!newFlow.description.trim()) {
    toastr.warning('请描述你的流派构想', '', { timeOut: 2000 });
    return;
  }

  isGeneratingFlow.value = true;
  rawOutput.value = '';

  try {
    // 组装用户描述
    const userDescription = `流派名称：${newFlow.name}\n\n创意描述：${newFlow.description}`;

    // 调用 AI 生成
    const result = await aiAssistant.generateFlow({
      userDescription,
      producePlan: newFlow.plan === 'mixed' ? 'Sense' : newFlow.plan, // 默认感性
    });

    // 保存原始输出（调试用）
    if (result.rawOutput) {
      rawOutput.value = result.rawOutput;
    }

    if (!result.success || !result.flow) {
      throw new Error(result.error || '生成失败');
    }

    // 注册生成的机制
    if (result.mechanics && result.mechanics.length > 0) {
      for (const mech of result.mechanics) {
        mechanicRegistry.register(mech);
      }
      console.log(`[P-Lab] 注册了 ${result.mechanics.length} 个新机制`);
    }

    // 注册生成的流派
    const flow = result.flow;
    flow.createdAt = new Date().toISOString();
    flowRegistry.register(flow);

    // 更新 UI
    loadFlows();
    currentFlow.value = flow;
    showNewFlowModal.value = false;

    // 重置表单
    newFlow.name = '';
    newFlow.description = '';
    newFlow.plan = 'mixed';

    toastr.success(`流派 "${flow.nameCN}" 创建成功！`, '', { timeOut: 3000 });
  } catch (error) {
    console.error('[P-Lab] 流派生成失败:', error);
    toastr.error(`生成失败: ${error}`, '', { timeOut: 5000 });
  } finally {
    isGeneratingFlow.value = false;
  }
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.pt-18 {
  padding-top: 4.5rem;
}
</style>
