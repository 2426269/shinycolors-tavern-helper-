<template>
  <div id="shinycolors-app" class="shinycolors-container">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <h1 class="app-title">
        <i class="fas fa-star"></i>
        偶像大师 闪耀色彩
      </h1>
      <nav class="app-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-btn', { active: currentTab === tab.id }]"
          @click="switchTab(tab.id)"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.name }}</span>
        </button>
      </nav>
    </header>

    <!-- 主内容区 -->
    <main class="app-main">
      <!-- 主页 -->
      <MainPage v-if="currentTab === 'home'" />

      <!-- 抽卡系统 -->
      <GachaMain v-else-if="currentTab === 'gacha'" />

      <!-- 偶像图鉴 -->
      <IdolCollection v-else-if="currentTab === 'collection'" />

      <!-- 音乐播放器 -->
      <div v-else-if="currentTab === 'music'" class="music-container">
        <h2 class="section-title">
          <i class="fas fa-music"></i>
          音乐播放器
        </h2>
        <div id="music-player-container"></div>
      </div>

      <!-- 其他页面占位 -->
      <div v-else class="placeholder">
        <i class="fas fa-hard-hat"></i>
        <h2>{{ currentTabName }} 正在开发中...</h2>
        <p>敬请期待！</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import IdolCollection from '../图鉴/界面/偶像图鉴.vue';
import GachaMain from '../抽卡/界面/抽卡主界面.vue';
import { initMusicPlayer } from '../音乐/音乐播放器';
import MainPage from './主页.vue';

/**
 * 导航标签配置
 */
const tabs = [
  { id: 'home', name: '主页', icon: 'fas fa-home' },
  { id: 'gacha', name: '抽卡', icon: 'fas fa-gift' },
  { id: 'collection', name: '图鉴', icon: 'fas fa-book' },
  { id: 'music', name: '音乐', icon: 'fas fa-music' },
  { id: 'produce', name: '培育', icon: 'fas fa-seedling' },
  { id: 'battle', name: '战斗', icon: 'fas fa-fist-raised' },
  { id: 'affection', name: '好感度', icon: 'fas fa-heart' },
];

/**
 * 当前激活的标签
 */
const currentTab = ref<string>('home');

/**
 * 当前标签名称
 */
const currentTabName = computed(() => {
  return tabs.find(tab => tab.id === currentTab.value)?.name || '';
});

/**
 * 切换标签
 */
function switchTab(tabId: string) {
  currentTab.value = tabId;
}

/**
 * 初始化音乐播放器
 */
watch(currentTab, async newTab => {
  if (newTab === 'music') {
    // 等待DOM更新后初始化音乐播放器
    await new Promise(resolve => setTimeout(resolve, 100));
    const container = document.getElementById('music-player-container');
    if (container && container.children.length === 0) {
      initMusicPlayer();
    }
  }
});

onMounted(() => {
  console.log('✨ 偶像大师闪耀色彩主应用加载完成！');
});
</script>

<style lang="scss" scoped>
.shinycolors-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  padding: 15px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.app-title {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;

  i {
    font-size: 28px;
    color: #ffd700;
    animation: starRotate 3s linear infinite;
  }
}

@keyframes starRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.app-nav {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.nav-btn {
  background: transparent;
  border: 2px solid #e0e0e0;
  padding: 10px 20px;
  border-radius: 25px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;

  i {
    font-size: 16px;
  }

  &:hover {
    background: rgba(102, 126, 234, 0.1);
    border-color: #667eea;
    color: #667eea;
    transform: translateY(-2px);
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

    &:hover {
      transform: translateY(-2px) scale(1.05);
    }
  }
}

.app-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.music-container {
  width: 100%;
  height: 100%;
  padding: 40px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);

  .section-title {
    font-size: 32px;
    font-weight: bold;
    color: #667eea;
    margin-bottom: 30px;
    display: flex;
    align-items: center;
    gap: 15px;

    i {
      font-size: 36px;
      color: #ffd700;
    }
  }
}

#music-player-container {
  width: 100%;
  min-height: 500px;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  gap: 20px;

  i {
    font-size: 80px;
    opacity: 0.5;
  }

  h2 {
    font-size: 32px;
    margin: 0;
  }

  p {
    font-size: 18px;
    opacity: 0.8;
    margin: 0;
  }
}
</style>
