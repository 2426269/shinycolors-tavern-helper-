<template>
  <div class="spine-showcase-page">
    <!-- 背景层 -->
    <div class="background-layer" :style="{ backgroundImage: `url(${currentBackground})` }">
      <div class="background-overlay"></div>
    </div>

    <!-- Spine角色层 -->
    <div class="character-layer">
      <Spine播放器
        ref="spinePlayerRef"
        :idol-id="currentIdolId"
        :width="800"
        :height="800"
        :scale="0.5"
        :auto-play="true"
        :show-debug-info="showDebugPanel"
        @loaded="onSpineLoaded"
        @error="onSpineError"
      />

      <!-- 交互层 -->
      <Spine交互层 @click="onInteractionClick" />
    </div>

    <!-- UI控制面板 -->
    <div v-if="showControlPanel" class="control-panel">
      <div class="panel-header">
        <h3>Spine控制面板</h3>
        <button @click="showControlPanel = false">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="panel-body">
        <!-- 偶像选择 -->
        <div class="control-group">
          <label>当前偶像:</label>
          <select v-model="currentIdolId">
            <option value="mano">樱木真乃</option>
            <option value="hiori">风野灯织</option>
            <option value="meguru">八宫惠</option>
          </select>
        </div>

        <!-- 背景选择 -->
        <div class="control-group">
          <label>背景:</label>
          <select v-model="currentBackground">
            <option v-for="bg in backgrounds" :key="bg.name" :value="bg.url">
              {{ bg.name }}
            </option>
          </select>
        </div>

        <!-- 动画测试 -->
        <div class="control-group">
          <label>测试动画:</label>
          <div class="animation-buttons">
            <button
              v-for="anim in testAnimations"
              :key="anim.name"
              @click="playTestAnimation(anim.animation)"
              class="anim-btn"
            >
              {{ anim.name }}
            </button>
          </div>
        </div>

        <!-- 情感检测测试 -->
        <div class="control-group">
          <label>测试情感检测:</label>
          <input v-model="testText" type="text" placeholder="输入测试文本..." @keyup.enter="testEmotionDetection" />
          <button @click="testEmotionDetection">检测</button>
        </div>

        <div v-if="detectionResult" class="detection-result">
          <strong>检测结果:</strong>
          <div>情感: {{ detectionResult.emotion }}</div>
          <div>动画: {{ detectionResult.animation }}</div>
          <div>置信度: {{ (detectionResult.confidence * 100).toFixed(1) }}%</div>
        </div>
      </div>
    </div>

    <!-- 快捷按钮 -->
    <div class="quick-actions">
      <button @click="showControlPanel = !showControlPanel" title="控制面板">
        <i class="fas fa-cog"></i>
      </button>
      <button @click="showDebugPanel = !showDebugPanel" title="调试信息">
        <i class="fas fa-bug"></i>
      </button>
      <button @click="toggleFullscreen" title="全屏">
        <i class="fas fa-expand"></i>
      </button>
    </div>

    <!-- 状态提示 -->
    <div v-if="statusMessage" class="status-message" :class="statusType">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Spine } from '@pixi/spine-pixi';
import toastr from 'toastr';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { detectEmotion } from '../../脚本示例/spine-controller/emotion-detector';
import Spine交互层 from '../组件/Spine交互层.vue';
import Spine播放器 from '../组件/Spine播放器.vue';

// ==================== 状态管理 ====================

const spinePlayerRef = ref<InstanceType<typeof Spine播放器> | null>(null);
const currentIdolId = ref('mano');
const currentBackground = ref('https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/default.jpg');
const showControlPanel = ref(false);
const showDebugPanel = ref(false);
const statusMessage = ref('');
const statusType = ref<'info' | 'success' | 'error'>('info');
const testText = ref('');
const detectionResult = ref<any>(null);

// ==================== 配置数据 ====================

const backgrounds = [
  {
    name: '默认',
    url: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/default.jpg',
  },
  {
    name: '海滩',
    url: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/beach.jpg',
  },
  {
    name: '图书馆',
    url: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/library.jpg',
  },
  {
    name: '咖啡厅',
    url: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/cafe.jpg',
  },
  {
    name: '录音室',
    url: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/背景/studio.jpg',
  },
];

const testAnimations = [
  { name: '待机', animation: 'Idle' },
  { name: '高兴', animation: 'Emotion_Happy' },
  { name: '难过', animation: 'Emotion_Sad' },
  { name: '生气', animation: 'Emotion_Angry' },
  { name: '惊讶', animation: 'Emotion_Surprise' },
  { name: '害羞', animation: 'Emotion_Shy' },
  { name: '疑惑', animation: 'Emotion_Confusion' },
  { name: '说话', animation: 'Talk_01' },
  { name: '思考', animation: 'Think' },
];

// ==================== 事件处理 ====================

/**
 * Spine加载完成
 */
function onSpineLoaded(spine: Spine) {
  console.log('✅ Spine加载完成', spine);
  showStatus('Spine加载完成！', 'success');
}

/**
 * Spine加载失败
 */
function onSpineError(error: Error) {
  console.error('❌ Spine加载失败', error);
  showStatus(`加载失败: ${error.message}`, 'error');
  toastr.error(error.message, 'Spine加载失败');
}

/**
 * 交互点击
 */
function onInteractionClick(area: 'head' | 'body' | 'hand' | 'other') {
  console.log('👆 点击区域:', area);
  showStatus(`点击了${area}`, 'info');
}

/**
 * 播放测试动画
 */
function playTestAnimation(animationName: string) {
  if (!spinePlayerRef.value) {
    toastr.warning('Spine播放器未初始化');
    return;
  }

  console.log('▶️ 播放测试动画:', animationName);
  spinePlayerRef.value.playAnimation(animationName, false);
  showStatus(`播放动画: ${animationName}`, 'info');
}

/**
 * 测试情感检测
 */
function testEmotionDetection() {
  if (!testText.value.trim()) {
    toastr.warning('请输入测试文本');
    return;
  }

  const result = detectEmotion(testText.value);
  detectionResult.value = result;

  if (result) {
    // 播放检测到的动画
    if (spinePlayerRef.value) {
      spinePlayerRef.value.playEmotion(result.animation);
    }
    showStatus(`检测到情感: ${result.emotion}`, 'success');
  } else {
    showStatus('未检测到明显情感', 'info');
  }
}

/**
 * 全屏切换
 */
function toggleFullscreen() {
  const elem = document.documentElement;

  if (!document.fullscreenElement) {
    elem.requestFullscreen().catch(err => {
      console.error('全屏失败:', err);
      toastr.error('全屏失败');
    });
  } else {
    document.exitFullscreen();
  }
}

/**
 * 显示状态消息
 */
function showStatus(message: string, type: 'info' | 'success' | 'error' = 'info') {
  statusMessage.value = message;
  statusType.value = type;

  setTimeout(() => {
    statusMessage.value = '';
  }, 3000);
}

// ==================== 消息监听 ====================

/**
 * 监听来自脚本的动画指令
 */
function handleAnimationCommand(event: MessageEvent) {
  if (!event.data || !event.data.type) return;

  const { type, payload } = event.data;

  console.log('📨 收到动画指令:', type, payload);

  if (!spinePlayerRef.value) {
    console.warn('⚠️ Spine播放器未初始化');
    return;
  }

  switch (type) {
    case 'PLAY_ANIMATION':
      spinePlayerRef.value.playAnimation(payload.animation, payload.loop || false);
      break;

    case 'PLAY_EMOTION':
      spinePlayerRef.value.playEmotion(payload.emotion);
      break;

    case 'PLAY_TALK':
      spinePlayerRef.value.playAnimation(payload.animation || 'Talk_01', true);
      break;

    case 'STOP_TALK':
      spinePlayerRef.value.playAnimation('Idle', true);
      break;

    case 'SET_TIME_SCALE':
      // TODO: 实现时间缩放
      console.log('设置时间缩放:', payload.scale);
      break;

    case 'CHANGE_BACKGROUND':
      if (payload.background) {
        const bg = backgrounds.find(b => b.name === payload.background);
        if (bg) {
          currentBackground.value = bg.url;
        }
      }
      break;

    default:
      console.warn('未知的动画指令:', type);
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  console.log('🎬 Spine展示页面已挂载');

  // 监听来自脚本的消息
  window.addEventListener('message', handleAnimationCommand);

  // 显示欢迎消息
  showStatus('Spine展示页面已加载', 'success');
  toastr.success('Spine展示页面已加载', '', { timeOut: 2000 });
});

onBeforeUnmount(() => {
  console.log('🗑️ Spine展示页面已卸载');
  window.removeEventListener('message', handleAnimationCommand);
});
</script>

<style scoped lang="scss">
.spine-showcase-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
}

// 背景层
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: background-image 0.5s ease;
  z-index: 1;

  .background-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
  }
}

// 角色层
.character-layer {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

// 控制面板
.control-panel {
  position: fixed;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  width: 320px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 100;
  overflow: hidden;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h3 {
      margin: 0;
      color: white;
      font-size: 16px;
    }

    button {
      background: transparent;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 5px;
      transition: color 0.2s;

      &:hover {
        color: #ff6b6b;
      }
    }
  }

  .panel-body {
    padding: 20px;
    max-height: calc(80vh - 60px);
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
  }

  .control-group {
    margin-bottom: 20px;

    label {
      display: block;
      color: white;
      font-size: 13px;
      margin-bottom: 8px;
      font-weight: 500;
    }

    select,
    input {
      width: 100%;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: white;
      font-size: 14px;
      transition: all 0.2s;

      &:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.15);
        border-color: #4ecdc4;
      }
    }

    button {
      margin-top: 8px;
      width: 100%;
      padding: 8px 16px;
      background: #4ecdc4;
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #45b7aa;
      }
    }

    .animation-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;

      .anim-btn {
        margin: 0;
        padding: 6px 10px;
        font-size: 12px;
        background: rgba(78, 205, 196, 0.3);
        border: 1px solid #4ecdc4;

        &:hover {
          background: rgba(78, 205, 196, 0.5);
        }
      }
    }
  }

  .detection-result {
    padding: 12px;
    background: rgba(78, 205, 196, 0.2);
    border-radius: 6px;
    color: white;
    font-size: 13px;

    strong {
      display: block;
      margin-bottom: 8px;
      color: #4ecdc4;
    }

    div {
      margin-bottom: 4px;
    }
  }
}

// 快捷按钮
.quick-actions {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 99;

  button {
    width: 50px;
    height: 50px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    color: white;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.3s;
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(78, 205, 196, 0.8);
      border-color: #4ecdc4;
      transform: scale(1.1);
    }
  }
}

// 状态消息
.status-message {
  position: fixed;
  bottom: 90px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  z-index: 98;
  animation: slideIn 0.3s ease;
  backdrop-filter: blur(10px);

  &.info {
    background: rgba(52, 152, 219, 0.9);
  }

  &.success {
    background: rgba(46, 204, 113, 0.9);
  }

  &.error {
    background: rgba(231, 76, 60, 0.9);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>


