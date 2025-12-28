<template>
  <div class="idol-master-container">
    <!-- 背景图层 - 283事务所 -->
    <div class="background-layer">
      <div class="office-background">
        <!-- 背景图 -->
        <div
          v-if="backgroundImageUrl"
          class="background-image"
          :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
        ></div>
      </div>
    </div>

    <!-- 制作人信息（左上角） -->
    <div class="producer-info">
      <div class="producer-card">
        <div class="producer-avatar">
          <i class="fas fa-user-tie"></i>
        </div>
        <div class="producer-details">
          <div class="producer-name-row">
            <span class="producer-label">制作人</span>
            <span class="producer-name">{{ producerName }}</span>
          </div>
          <div class="producer-level-row">
            <span class="producer-level-label">Lv.</span>
            <span class="producer-level-value">{{ resources.producerLevel }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Spine动画层（居中显示，往下延展） -->
    <div class="character-layer">
      <div class="character-container-center">
        <!-- Spine播放器 -->
        <SpinePlayer
          v-if="currentSpineId"
          :key="currentSpineId + '_' + currentCostume"
          :idol-id="currentSpineId"
          :costume="currentCostume"
          :debug-offset-x="spineDebug.offsetX"
          :debug-offset-y="spineDebug.offsetY"
          :debug-scale="spineDebug.scale"
          class="spine-character"
        />
      </div>
    </div>

    <!-- 服装切换按钮（右上角） -->
    <div class="costume-toggle-container">
      <button class="costume-toggle-btn" :title="costumeTooltip" @click="toggleCostume">
        <i class="fas" :class="costumeIcon"></i>
        <span class="costume-label">{{ costumeLabel }}</span>
      </button>
    </div>

    <!-- 主页按钮（左下角） -->
    <div class="home-button-container">
      <button class="home-button" @click="toggleHomeMenu">
        <i class="fas fa-home"></i>
        <span>主页</span>
      </button>
      <!-- 手机按钮（左侧较大） -->
      <button class="phone-button" @click="showPhoneApp = true">
        <i class="fas fa-mobile-alt"></i>
        <span>手机</span>
        <span v-if="phoneUnreadCount > 0" class="phone-badge">{{ phoneUnreadCount }}</span>
      </button>
    </div>

    <!-- 角色选择全屏页面 -->
    <CharacterSelectPage
      v-if="showCharacterSelectPage"
      :current-spine-id="currentSpineId"
      :current-costume="currentCostume"
      @close="closeCharacterSelectPage"
      @apply="applyCharacterSelect"
    />

    <!-- 功能按钮层 -->
    <div class="function-layer">
      <div class="main-buttons">
        <button class="function-btn idol-btn" @click="openIdolCollection">
          <div class="btn-icon">
            <i class="fas fa-book"></i>
          </div>
          <span class="btn-text">偶像图鉴</span>
          <div class="btn-shine"></div>
        </button>

        <button class="function-btn gacha-btn" @click="openGacha">
          <div class="btn-icon">
            <i class="fas fa-gift"></i>
          </div>
          <span class="btn-text">抽卡</span>
          <div class="btn-shine"></div>
        </button>

        <button class="function-btn activity-btn" @click="openActivity">
          <div class="btn-icon">
            <i class="fas fa-heart"></i>
          </div>
          <span class="btn-text">自由活动</span>
          <div class="btn-shine"></div>
        </button>

        <button class="function-btn music-btn" @click="openMusic">
          <div class="btn-icon">
            <i class="fas fa-music"></i>
          </div>
          <span class="btn-text">音乐</span>
          <div class="btn-shine"></div>
        </button>

        <button class="function-btn produce-btn" @click="openTraining">
          <div class="btn-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <span class="btn-text">培育</span>
          <div class="btn-shine"></div>
        </button>

        <button class="function-btn plab-btn" @click="openPLab">
          <div class="btn-icon">
            <i class="fas fa-flask"></i>
          </div>
          <span class="btn-text">P-Lab</span>
          <div class="btn-shine"></div>
        </button>
      </div>
    </div>

    <!-- 偶像详情弹窗 -->
    <div v-if="showIdolDetails" class="idol-details-modal" @click="closeIdolDetails">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeIdolDetails">
          <i class="fas fa-times"></i>
        </button>

        <div class="idol-details-container">
          <!-- 左侧：立绘画廊 -->
          <div class="idol-gallery">
            <h3>立绘画廊</h3>
            <div class="gallery-main">
              <img
                v-if="currentCharacter.images && currentCharacter.images[selectedImageIndex]"
                :src="currentCharacter.images[selectedImageIndex]"
                :alt="currentCharacter.name"
                loading="lazy"
                class="gallery-main-image"
              />
              <div v-else class="gallery-placeholder">
                <i class="fas fa-image"></i>
                <p>暂无立绘</p>
              </div>
            </div>
            <div v-if="currentCharacter.images && currentCharacter.images.length > 0" class="gallery-thumbnails">
              <div
                v-for="(img, index) in currentCharacter.images"
                :key="index"
                class="thumbnail"
                :class="{ active: index === selectedImageIndex }"
                @click="selectedImageIndex = index"
              >
                <img :src="img" :alt="`立绘 ${index + 1}`" loading="lazy" />
              </div>
            </div>
          </div>

          <!-- 右侧：详细信息 -->
          <div class="idol-info">
            <h2 class="idol-name">{{ currentCharacter.name }}</h2>

            <div class="idol-details-section">
              <h3>基本信息</h3>
              <div class="detail-grid">
                <div v-if="currentCharacter.age" class="detail-item">
                  <span class="detail-label">年龄</span>
                  <span class="detail-value">{{ currentCharacter.age }}</span>
                </div>
                <div v-if="currentCharacter.height" class="detail-item">
                  <span class="detail-label">身高</span>
                  <span class="detail-value">{{ currentCharacter.height }}</span>
                </div>
                <div v-if="currentCharacter.birthday" class="detail-item">
                  <span class="detail-label">生日</span>
                  <span class="detail-value">{{ currentCharacter.birthday }}</span>
                </div>
                <div v-if="currentCharacter.unit" class="detail-item">
                  <span class="detail-label">组合</span>
                  <span class="detail-value">{{ currentCharacter.unit }}</span>
                </div>
                <div v-if="currentCharacter.voiceActor" class="detail-item">
                  <span class="detail-label">声优</span>
                  <span class="detail-value">{{ currentCharacter.voiceActor }}</span>
                </div>
                <div v-if="currentCharacter.color" class="detail-item">
                  <span class="detail-label">印象色</span>
                  <span class="detail-value">
                    <span class="color-preview" :style="{ backgroundColor: currentCharacter.color }"></span>
                    {{ currentCharacter.color }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="currentCharacter.description" class="idol-details-section">
              <h3>角色介绍</h3>
              <p class="idol-description">{{ currentCharacter.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 音乐播放器页面（全屏） -->
    <MusicPage v-if="showMusicPage" @close="closeMusicPage" />

    <!-- 抽卡页面 -->
    <div v-if="showGachaPage" class="gacha-page">
      <!-- 返回按钮 -->
      <button class="gacha-back-btn" @click="closeGachaPage">
        <i class="fas fa-arrow-left"></i>
        <span>返回</span>
      </button>

      <!-- 抽卡系统组件 -->
      <div class="gacha-container">
        <GachaApp :resources="resources" @update:feather-stones="resources.featherStones = $event" />
      </div>
    </div>

    <!-- 偶像图鉴页面（直接集成组件） -->
    <div v-if="showIdolCollection" class="idol-collection-page">
      <button class="collection-back-btn" @click="closeIdolCollection">
        <i class="fas fa-arrow-left"></i>
        <span>返回</span>
      </button>
      <div class="collection-container">
        <IdolCollectionApp />
      </div>
    </div>

    <!-- 副本系统（统一入口） -->
    <ProduceHost v-if="showProduceHost" @close="closeProduceHost" />

    <!-- 资源显示层 - 顶部横向布局 -->
    <div class="resource-display-top">
      <!-- 羽石 -->
      <div class="top-bar-pill feather-stone">
        <div class="pill-icon-wrapper">
          <img :src="RESOURCE_ICONS.FEATHER_JEWEL" alt="羽石" width="24" height="24" />
        </div>
        <span class="pill-value">{{ resources.featherStones.toLocaleString() }}</span>
      </div>

      <!-- 粉丝数 -->
      <div class="top-bar-pill fans">
        <div class="pill-icon-wrapper">
          <i class="fas fa-users"></i>
        </div>
        <span class="pill-value">{{ resources.fans.toLocaleString() }}</span>
      </div>

      <!-- 日期显示 (统一风格) -->
      <div class="top-bar-pill date-pill" @click="showCalendarPopup = true">
        <i class="fas fa-calendar-alt date-icon"></i>
        <div class="date-text-full">
          <span class="year-part">{{ currentYear }}</span>
          <span class="separator">/</span>
          <span class="month-day-part">{{ currentMonth }}/{{ currentDay }}</span>
        </div>
      </div>
    </div>

    <!-- 设置按钮 - 右上角位置 -->
    <div class="settings-button-top" title="设置" @click="showSettings = true">
      <i class="fas fa-cog"></i>
    </div>

    <!-- 全屏按钮 - 右侧中间位置 (仅在按钮模式显示) -->
    <div
      v-if="settings.fullscreenMode === 'button'"
      class="fullscreen-button"
      :title="isFullscreen ? '退出全屏' : '全屏'"
      @click="toggleFullscreen"
    >
      <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="settings-modal" @click="showSettings = false">
      <div class="settings-panel" @click.stop>
        <div class="settings-panel-header">
          <h2>主题切换</h2>
          <button class="panel-close-btn" @click="showSettings = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="settings-panel-body">
          <!-- 界面设置分类 -->
          <div class="settings-category">
            <h3 class="category-title">
              <i class="fas fa-desktop"></i>
              界面设置
            </h3>

            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-expand-arrows-alt"></i>
                双击全屏
              </div>
              <div class="setting-desc">双击空白区域进入全屏模式</div>
              <div class="setting-control-col">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    :checked="settings.fullscreenMode === 'doubleclick'"
                    @change="toggleFullscreenMode"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- 开发工具分类 -->
          <div class="settings-category">
            <h3 class="category-title">
              <i class="fas fa-code"></i>
              开发工具
            </h3>

            <!-- 无限羽石 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-gem"></i>
                无限羽石
              </div>
              <div class="setting-desc">开启后羽石数量保持在999999999</div>
              <div class="setting-control-col">
                <label class="toggle-switch">
                  <input type="checkbox" :checked="settings.devMode.infiniteGems" @change="toggleInfiniteGems" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- 解锁全部角色 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-users"></i>
                解锁全部角色
              </div>
              <div class="setting-desc">获得所有角色的R/SR/SSR/UR各1张卡</div>
              <div class="setting-control-col">
                <button class="dev-action-btn" @click="devUnlockAllCharacters">
                  <i class="fas fa-unlock"></i>
                  解锁
                </button>
              </div>
            </div>

            <!-- 清除AI生成技能卡 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-robot"></i>
                清除AI生成技能卡
              </div>
              <div class="setting-desc">清除所有AI生成的技能卡数据，方便重新测试生成功能</div>
              <div class="setting-control-col">
                <button
                  class="dev-action-btn"
                  style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                  @click="devClearAISkillCards"
                >
                  <i class="fas fa-broom"></i>
                  清除
                </button>
              </div>
            </div>

            <!-- 清除游戏数据 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-trash-alt"></i>
                清除游戏数据
              </div>
              <div class="setting-desc">清除资源、抽卡、AI技能卡等游戏数据（不含图片缓存）</div>
              <div class="setting-control-col">
                <button
                  class="dev-action-btn"
                  style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  @click="devClearGameData"
                >
                  <i class="fas fa-eraser"></i>
                  清除
                </button>
              </div>
            </div>

            <!-- 清除所有缓存 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-broom"></i>
                清除所有缓存
              </div>
              <div class="setting-desc">清除游戏数据、AI技能卡和图片缓存（完全重置）</div>
              <div class="setting-control-col">
                <button
                  class="dev-action-btn"
                  style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                  @click="devClearAllCache"
                >
                  <i class="fas fa-bomb"></i>
                  清除
                </button>
              </div>
            </div>

            <!-- 等级满级 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-level-up-alt"></i>
                等级满级
              </div>
              <div class="setting-desc">将制作人等级提升至60级</div>
              <div class="setting-control-col">
                <button class="dev-action-btn" @click="devMaxLevel">
                  <i class="fas fa-arrow-up"></i>
                  提升
                </button>
              </div>
            </div>

            <!-- Spine 调试工具 -->
            <div class="setting-row spine-debug-section">
              <div class="setting-label-col">
                <i class="fas fa-crosshairs"></i>
                Spine 立绘调试
              </div>
              <div class="setting-desc">调整立绘位置和大小（开发用）</div>
            </div>

            <!-- X轴偏移滑块 -->
            <div class="setting-row slider-row">
              <div class="setting-label-col slider-label">X 偏移</div>
              <div class="slider-control">
                <input
                  v-model.number="spineDebug.offsetX"
                  type="range"
                  class="debug-slider"
                  min="-800"
                  max="800"
                  step="10"
                />
                <span class="slider-value">{{ spineDebug.offsetX }}</span>
              </div>
            </div>

            <!-- Y轴偏移滑块 -->
            <div class="setting-row slider-row">
              <div class="setting-label-col slider-label">Y 偏移</div>
              <div class="slider-control">
                <input
                  v-model.number="spineDebug.offsetY"
                  type="range"
                  class="debug-slider"
                  min="-800"
                  max="800"
                  step="10"
                />
                <span class="slider-value">{{ spineDebug.offsetY }}</span>
              </div>
            </div>

            <!-- 缩放滑块 -->
            <div class="setting-row slider-row">
              <div class="setting-label-col slider-label">缩放</div>
              <div class="slider-control">
                <input
                  v-model.number="spineDebug.scale"
                  type="range"
                  class="debug-slider"
                  min="0.3"
                  max="2.0"
                  step="0.05"
                />
                <span class="slider-value">{{ spineDebug.scale.toFixed(2) }}</span>
              </div>
            </div>

            <!-- 复制参数按钮 -->
            <div class="setting-row">
              <div class="setting-label-col"></div>
              <div class="setting-control-col" style="flex: 1">
                <button
                  class="dev-action-btn"
                  style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100%"
                  @click="copySpineDebugParams"
                >
                  <i class="fas fa-copy"></i>
                  复制当前参数
                </button>
              </div>
            </div>
          </div>

          <!-- 缓存管理分类 -->
          <div class="settings-category">
            <h3 class="category-title">
              <i class="fas fa-database"></i>
              缓存管理
            </h3>

            <!-- 图片缓存统计 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-images"></i>
                图片缓存
              </div>
              <div class="setting-desc">{{ cacheStats.count }} 张图片 / {{ formatCacheSize(cacheStats.size) }}</div>
              <div class="setting-control-col">
                <button class="dev-action-btn" @click="updateCacheStats">
                  <i class="fas fa-sync-alt"></i>
                  刷新
                </button>
              </div>
            </div>

            <!-- 清除缓存按钮 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-trash-alt"></i>
                清除图片缓存
              </div>
              <div class="setting-desc">清除所有已缓存的图片，不影响游戏数据</div>
              <div class="setting-control-col">
                <button class="dev-action-btn danger" @click="handleClearCache">
                  <i class="fas fa-trash"></i>
                  清除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 抽卡页面 -->
    <GachaApp v-if="showGachaPage" @close="closeGachaPage" />

    <!-- 培育页面 -->
    <ProduceHost v-if="showProduceHost" @close="closeProduceHost" />

    <!-- 偶像图鉴 -->
    <IdolCollectionApp v-if="showIdolCollection" @close="closeIdolCollection" />

    <!-- 手机应用 -->
    <PhoneContainer
      v-model="showPhoneApp"
      :unreads="{ chain: phoneUnreadCount, phone: 0 }"
      @unread-update="handlePhoneUnreadUpdate"
    />

    <!-- P-Lab 页面 -->
    <div v-if="showPLab" class="plab-page-container absolute inset-0 z-[30000]">
      <PLabDashboard @close="closePLab" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import {
  clearAllGameData,
  getGachaData,
  getResources,
  getSettings,
  initGameData,
  saveGachaData,
  saveResources,
  saveSettings,
  type GameResources,
} from '../../偶像大师闪耀色彩/utils/game-data';
import PLabDashboard from '../P-Lab/PLabDashboard.vue';
import IdolCollectionApp from '../图鉴/界面/偶像图鉴.vue';
import ProduceHost from '../培育/界面/ProduceHost.vue';
import { RESOURCE_ICONS } from '../工具/constants';
import { startProactiveScheduler } from '../手机/composables/useProactiveScheduler';
import { startTwestaScheduler } from '../手机/composables/useTwestaScheduler';
import PhoneContainer from '../手机/组件/PhoneContainer.vue';
import GachaApp from '../抽卡/界面/抽卡主界面.vue';
import SpinePlayer from '../组件/Spine播放器.vue';
import { IDOLS, type Idol } from '../角色管理/角色数据';
import MusicPage from '../音乐/界面/MusicPage.vue';
import CharacterSelectPage from './角色选择页面.vue';

// 角色数据
const characters = ref<Idol[]>(IDOLS);
const currentCharacterIndex = ref(0);
const currentCharacter = computed(() => characters.value[currentCharacterIndex.value]);

// 背景图片URL - 基于现实时间动态切换
const BACKGROUND_BASE_URL = 'https://283pro.site/shinycolors/background';

// 获取基于当前时间的背景图ID
function getTimeBasedBackgroundId(): string {
  const hour = new Date().getHours();

  // 时间段划分：
  // 00:00-04:59 深夜 -> 00060
  // 05:00-06:59 凌晨/黎明 -> 00034
  // 07:00-16:59 白天 -> 00001
  // 17:00-18:59 傍晚 -> 00083
  // 19:00-23:59 夜晚 -> 00002

  if (hour >= 0 && hour < 5) {
    return '00060'; // 深夜
  } else if (hour >= 5 && hour < 7) {
    return '00034'; // 凌晨/黎明
  } else if (hour >= 7 && hour < 17) {
    return '00001'; // 白天
  } else if (hour >= 17 && hour < 19) {
    return '00083'; // 傍晚
  } else {
    return '00002'; // 夜晚
  }
}

// 响应式背景图URL
const currentBackgroundId = ref(getTimeBasedBackgroundId());
const backgroundImageUrl = computed(() => `${BACKGROUND_BASE_URL}/${currentBackgroundId.value}.webp`);

// 每分钟检查一次是否需要更新背景
setInterval(() => {
  const newId = getTimeBasedBackgroundId();
  if (newId !== currentBackgroundId.value) {
    currentBackgroundId.value = newId;
    console.log(`[背景] 时间变化，切换背景图: ${newId}`);
  }
}, 60000);

// ====== 时间系统（内联实现，避免路径问题）======
interface GameTime {
  producerJoinDate: string;
  currentDate: string;
  totalWeeksPassed: number;
}

const DEFAULT_START_DATE = '2018-04-24';

function createInitialGameTime(): GameTime {
  return {
    producerJoinDate: DEFAULT_START_DATE,
    currentDate: DEFAULT_START_DATE,
    totalWeeksPassed: 0,
  };
}

function formatDateChinese(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${year}年${parseInt(month)}月${parseInt(day)}日`;
}

const gameTime = reactive<GameTime>(createInitialGameTime());
const showCalendarPopup = ref(false);

// 手机应用状态
const showPhoneApp = ref(false);
const phoneUnreadCount = ref(0); // 改为0，由调度器动态更新

// P-Lab 状态
const showPLab = ref(false);
const openPLab = () => {
  showPLab.value = true;
};
const closePLab = () => {
  showPLab.value = false;
};

// 启动全局偶像主动消息调度器（不依赖 ChainApp 是否打开）
startProactiveScheduler((unreadCount: number) => {
  phoneUnreadCount.value = unreadCount;
  console.log(`[主页] 收到未读更新: ${unreadCount}`);
});

// 处理来自 PhoneContainer 的实时未读更新
function handlePhoneUnreadUpdate(count: number) {
  phoneUnreadCount.value = count;
  console.log(`[主页] 手机未读实时更新: ${count}`);
}

// 启动 Twesta 调度器 (偶像主动发推)
startTwestaScheduler();
console.log('[主页] Twesta 调度器已启动');

// 格式化的游戏日期显示
const formattedGameDate = computed(() => formatDateChinese(gameTime.currentDate));

// 日期各部分（用于精美UI显示）
const currentYear = computed(() => gameTime.currentDate.split('-')[0]);
const currentMonth = computed(() => parseInt(gameTime.currentDate.split('-')[1]));
const currentDay = computed(() => parseInt(gameTime.currentDate.split('-')[2]));

// Spine动画相关状态
// idolId格式: "偶像名_【卡片名】偶像名"
// 从localStorage读取保存的Spine设置
const savedSpineSettings = JSON.parse(localStorage.getItem('spineSettings') || '{}');
const currentSpineId = ref(savedSpineSettings.spineId || '櫻木真乃_【花風Smiley】櫻木真乃'); // 默认使用樱木真乃的初始卡

// 服装状态
const currentCostume = ref<'normal' | 'idol'>(savedSpineSettings.costume || 'normal');

// 自动保存Spine设置到localStorage
watch(
  [currentSpineId, currentCostume],
  () => {
    const settings = {
      spineId: currentSpineId.value,
      costume: currentCostume.value,
    };
    localStorage.setItem('spineSettings', JSON.stringify(settings));
  },
  { deep: true },
);

// 资源数据 - 从IndexedDB读取
const resources = reactive<GameResources>({
  featherStones: 999999999, // 测试用无限羽石（发布时改回3000）
  fans: 0,
  producerLevel: 1, // 制作人等级
  producerExp: 0, // 制作人经验
});

// 异步加载资源数据
const loadResourcesFromDB = async () => {
  try {
    const data = await getResources();
    Object.assign(resources, data);
    console.log('📦 资源数据已加载:', resources);
  } catch (error) {
    console.error('❌ 加载资源数据失败:', error);
  }
};

// 监听资源变化，自动保存到IndexedDB
watch(
  resources,
  async newValue => {
    try {
      await saveResources(newValue);
    } catch (error) {
      console.error('❌ 保存资源数据失败:', error);
    }
  },
  { deep: true },
);

// 制作人信息（从酒馆角色名读取）
const producerName = ref('');

// 获取制作人名称
const loadProducerName = () => {
  try {
    // 尝试从 SillyTavern 获取用户角色名
    if (typeof SillyTavern !== 'undefined' && SillyTavern.name1) {
      // name1 是用户/角色的名称
      producerName.value = SillyTavern.name1;
    } else {
      // 默认名称
      producerName.value = '制作人';
    }
  } catch (error) {
    console.warn('无法读取制作人名称:', error);
    producerName.value = '制作人';
  }
};

// 设置
const showSettings = ref(false);
const settings = reactive({
  fullscreenMode: 'button' as 'button' | 'doubleclick' | 'both',
  // 开发工具
  devMode: {
    infiniteGems: false, // 无限羽石
    unlockAllCharacters: false, // 解锁全角色
    maxLevel: false, // 等级满级
  },
});

// Spine 开发者调试参数
const spineDebug = reactive({
  offsetX: 0, // X轴偏移 (-300 ~ 300)
  offsetY: 0, // Y轴偏移 (-300 ~ 300)
  scale: 1.0, // 缩放比例 (0.3 ~ 2.0)
});

// 复制 Spine 调试参数到剪贴板
const copySpineDebugParams = () => {
  const params = `offsetX: ${spineDebug.offsetX}, offsetY: ${spineDebug.offsetY}, scale: ${spineDebug.scale.toFixed(2)}`;
  navigator.clipboard
    .writeText(params)
    .then(() => {
      toastr.success(`已复制: ${params}`, '', { timeOut: 2000 });
    })
    .catch(() => {
      toastr.error('复制失败');
    });
};

// 加载设置
const loadSettingsFromDB = async () => {
  try {
    const data = await getSettings();
    if (data.fullscreenMode) {
      settings.fullscreenMode = data.fullscreenMode;
    }
    if (data.devMode) {
      settings.devMode.infiniteGems = data.devMode.infiniteGems || false;
      settings.devMode.unlockAllCharacters = data.devMode.unlockAllCharacters || false;
      settings.devMode.maxLevel = data.devMode.maxLevel || false;
    }
    console.log('⚙️ 设置已加载:', settings);
  } catch (error) {
    console.error('❌ 加载设置失败:', error);
  }
};

// 切换全屏模式
const toggleFullscreenMode = async () => {
  settings.fullscreenMode = settings.fullscreenMode === 'button' ? 'doubleclick' : 'button';
  await saveSettingsToDB();
};

// 保存设置到IndexedDB
const saveSettingsToDB = async () => {
  try {
    await saveSettings(settings as any);
    toastr.success('设置已保存！', '', { timeOut: 1500 });
  } catch (error) {
    console.error('❌ 保存设置失败:', error);
    toastr.error('设置保存失败！');
  }
};

// ============================================================================
// 开发工具功能
// ============================================================================

/** 清除游戏数据（不含图片缓存） */
const devClearGameData = async () => {
  if (
    !confirm(
      '⚠️ 确定要清除所有游戏数据吗？\n\n这将清除：\n- 资源数据（羽石、等级等）\n- 抽卡记录\n- AI生成的技能卡\n- 游戏设置\n\n图片缓存将保留。',
    )
  ) {
    return;
  }

  try {
    await clearAllGameData();

    // 清除AI生成的技能卡
    const skillKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('skill_')) {
        skillKeysToRemove.push(key);
      }
    }
    skillKeysToRemove.forEach(key => localStorage.removeItem(key));

    toastr.success('游戏数据已清除！', '', { timeOut: 2000 });

    // 重新加载数据（恢复默认值）
    await loadResourcesFromDB();
    await loadSettingsFromDB();

    console.log('🗑️ 游戏数据已清除（包含', skillKeysToRemove.length, '个AI生成技能卡）');
  } catch (error) {
    console.error('❌ 清除游戏数据失败:', error);
    toastr.error('清除失败！');
  }
};

/** 清除所有缓存（包括图片） */
const devClearAllCache = async () => {
  if (
    !confirm(
      '⚠️ 确定要清除所有缓存吗？\n\n这将清除：\n- 所有游戏数据\n- AI生成的技能卡\n- 所有图片缓存\n\n此操作不可恢复！',
    )
  ) {
    return;
  }

  try {
    // 清除游戏数据
    const { clearAllData } = await import('../../偶像大师闪耀色彩/utils/game-data');
    await clearAllData();

    // 清除AI生成的技能卡
    const skillKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('skill_')) {
        skillKeysToRemove.push(key);
      }
    }
    skillKeysToRemove.forEach(key => localStorage.removeItem(key));

    // 清除图片缓存
    const imageCacheModule = await import('../工具/图片缓存');
    await imageCacheModule.clearAllCache();

    toastr.success('所有缓存已清除！页面将在3秒后刷新...', '', { timeOut: 3000 });

    // 刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 3000);

    console.log('🗑️ 所有缓存已清除（包含', skillKeysToRemove.length, '个AI生成技能卡）');
  } catch (error) {
    console.error('❌ 清除缓存失败:', error);
    toastr.error('清除失败！');
  }
};

/** 获得全部角色（所有稀有度的第1张卡） */
const devUnlockAllCharacters = async () => {
  if (!confirm('确定要解锁全部角色吗？（每个角色的R/SR/SSR/UR各1张）')) {
    return;
  }

  try {
    // 动态导入卡池数据
    const { ALL_CARDS } = await import('../卡牌管理/全部卡牌数据');

    // 读取抽卡数据
    const gachaData = await getGachaData();

    let addedCount = 0;

    // 添加所有卡片（使用 fullName 作为 ID）
    ALL_CARDS.forEach(card => {
      const cardId = card.fullName;

      // 如果还没拥有，添加
      if (!gachaData.ownedCards[cardId]) {
        gachaData.ownedCards[cardId] = {
          fullName: card.fullName,
          obtainedAt: new Date().toISOString(),
          hasSkill: false,
        };
        addedCount++;
      }
    });

    // 保存数据到IndexedDB
    await saveGachaData(gachaData);

    toastr.success(`已解锁 ${addedCount} 张角色卡！`, '', { timeOut: 2000 });
    console.log('🎴 已解锁全部角色:', gachaData.ownedCards);
  } catch (error) {
    console.error('解锁角色失败:', error);
    toastr.error('解锁角色失败！');
  }
};

/** 等级瞬间满级（60级） */
const devMaxLevel = () => {
  if (!confirm('确定要将制作人等级提升到60级吗？')) {
    return;
  }

  resources.producerLevel = 60;
  resources.producerExp = 0; // 满级后经验归零
  toastr.success('制作人等级已提升至60级！', '', { timeOut: 2000 });
};

/** 清除AI生成的技能卡数据 */
const devClearAISkillCards = () => {
  if (!confirm('⚠️ 确定要清除所有AI生成的技能卡数据吗？\n\n这将清除所有角色的AI生成技能卡，需要重新生成。')) {
    return;
  }

  try {
    let count = 0;
    // 遍历localStorage，查找所有skill_开头的key
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('skill_')) {
        keysToRemove.push(key);
        count++;
      }
    }

    // 删除所有skill_开头的key
    keysToRemove.forEach(key => localStorage.removeItem(key));

    toastr.success(`已清除 ${count} 个AI生成的技能卡！`, '', { timeOut: 2000 });
    console.log('🗑️ 已清除AI生成技能卡:', keysToRemove);
  } catch (error) {
    console.error('❌ 清除AI生成技能卡失败:', error);
    toastr.error('清除失败！');
  }
};

/** 切换无限羽石 */
const toggleInfiniteGems = async () => {
  settings.devMode.infiniteGems = !settings.devMode.infiniteGems;

  if (settings.devMode.infiniteGems) {
    resources.featherStones = 999999999;
    toastr.success('无限羽石已开启！', '', { timeOut: 1500 });
  } else {
    toastr.info('无限羽石已关闭', '', { timeOut: 1500 });
  }

  await saveSettingsToDB();
};

// ============================================================================
// 缓存管理
// ============================================================================

/** 缓存统计数据 */
const cacheStats = ref({ count: 0, size: 0 });

/** 格式化缓存大小 */
const formatCacheSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/** 更新缓存统计 */
const updateCacheStats = async () => {
  try {
    // 动态导入 image-cache 模块
    const imageCacheModule = await import('../工具/图片缓存');
    const stats = await imageCacheModule.getCacheStats();
    cacheStats.value = stats;
    toastr.success(`缓存统计已更新: ${stats.count} 张图片`, '', { timeOut: 1500 });
  } catch (error) {
    console.error('更新缓存统计失败:', error);
    toastr.error('更新缓存统计失败');
  }
};

/** 清除图片缓存 */
const handleClearCache = async () => {
  if (
    !confirm(
      `确定要清除所有图片缓存吗？\n\n当前缓存: ${cacheStats.value.count} 张图片 / ${formatCacheSize(cacheStats.value.size)}\n\n清除后首次加载会较慢，但不影响游戏数据。`,
    )
  ) {
    return;
  }

  try {
    // 动态导入 image-cache 模块
    const imageCacheModule = await import('../工具/图片缓存');
    await imageCacheModule.clearImageCache();
    cacheStats.value = { count: 0, size: 0 };
    toastr.success('图片缓存已清除！', '', { timeOut: 2000 });
  } catch (error) {
    console.error('清除缓存失败:', error);
    toastr.error('清除缓存失败');
  }
};

// 监听羽石变化，如果开启无限羽石且羽石<999999999，自动补充
watch(
  () => resources.featherStones,
  newValue => {
    if (settings.devMode.infiniteGems && newValue < 999999999) {
      // 延迟50ms补充，避免watch循环
      setTimeout(() => {
        resources.featherStones = 999999999;
      }, 50);
    }
  },
);

// 监听设置面板打开，重新加载设置和缓存统计
watch(
  () => showSettings.value,
  async isOpen => {
    if (isOpen) {
      await loadSettingsFromDB();
      await updateCacheStats(); // 更新缓存统计
    }
  },
);

// 双击全屏处理
const handleDoubleClick = () => {
  if (settings.fullscreenMode === 'doubleclick') {
    toggleFullscreen();
  }
};

// 主页菜单控制
const showHomeMenu = ref(false);

// 角色选择页面控制
const showCharacterSelectPage = ref(false);

// 切换主页菜单（改为打开角色选择页面）
const toggleHomeMenu = () => {
  showCharacterSelectPage.value = true;
};

// 关闭角色选择页面
const closeCharacterSelectPage = () => {
  showCharacterSelectPage.value = false;
};

// 应用角色选择
const applyCharacterSelect = (spineId: string, costume: 'normal' | 'idol') => {
  currentSpineId.value = spineId;
  currentCostume.value = costume;
  showCharacterSelectPage.value = false;
  console.log('应用角色选择:', spineId, costume);
};

// 服装切换相关计算属性
const costumeLabel = computed(() => (currentCostume.value === 'normal' ? '常服' : '偶像服'));
const costumeIcon = computed(() => (currentCostume.value === 'normal' ? 'fa-tshirt' : 'fa-star'));
const costumeTooltip = computed(() => (currentCostume.value === 'normal' ? '切换到偶像服' : '切换到常服'));

// 切换服装
const toggleCostume = () => {
  currentCostume.value = currentCostume.value === 'normal' ? 'idol' : 'normal';
  console.log('切换到服装:', currentCostume.value);
};

// 选择角色
const selectCharacter = (index: number) => {
  currentCharacterIndex.value = index;
  showHomeMenu.value = false;
  console.log('切换到角色:', characters.value[index].name);
};

// 组合列表（8个组合）
const units = [
  'Illumination STARS',
  "L'Antica",
  'ALSTROEMERIA',
  'Straylight',
  'noctchill',
  '放学后CLIMAX GIRLS',
  'SHHis',
  'CoMETIK',
];

// 音乐页面控制
const showMusicPage = ref(false); // 是否显示音乐页面

// 抽卡页面控制
const showGachaPage = ref(false); // 是否显示抽卡页面

// 全屏控制
const isFullscreen = ref(false);

// 切换全屏
const toggleFullscreen = () => {
  const elem = document.documentElement;

  if (!document.fullscreenElement) {
    // 进入全屏
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
    isFullscreen.value = true;
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
    isFullscreen.value = false;
  }
};

// 功能按钮事件
const openTraining = () => {
  console.log('打开培育系统');
  showProduceHost.value = true;
};

const openActivity = () => {
  console.log('打开自由活动界面 - 当前角色:', currentCharacter.value.name);
};

// 音乐页面功能
const openMusic = () => {
  showMusicPage.value = true;
  console.log('打开音乐播放器');
};

const closeMusicPage = () => {
  showMusicPage.value = false;
};

// 抽卡页面功能
const openGacha = () => {
  showGachaPage.value = true;
  console.log('打开抽卡系统');
};

const closeGachaPage = () => {
  showGachaPage.value = false;
  console.log('关闭抽卡系统');
};

// 偶像图鉴页面控制
const showIdolCollection = ref(false);

const openIdolCollection = () => {
  showIdolCollection.value = true;
  console.log('打开偶像图鉴');
};

const closeIdolCollection = () => {
  showIdolCollection.value = false;
  console.log('关闭偶像图鉴');
};

// ====== 副本系统（统一入口） ======
const showProduceHost = ref(false);

// 关闭副本系统（从ProduceHost触发）
const closeProduceHost = () => {
  showProduceHost.value = false;
  console.log('🎮 关闭副本系统');
};

// 组件挂载时加载制作人信息
onMounted(async () => {
  // 初始化IndexedDB游戏数据系统
  await initGameData();

  // 加载数据
  await loadResourcesFromDB();
  await loadSettingsFromDB();
  loadProducerName();

  // 双击全屏功能
  document.addEventListener('dblclick', handleDoubleClick);

  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
  document.addEventListener('webkitfullscreenchange', () => {
    isFullscreen.value = !!(document as any).webkitFullscreenElement;
  });
  document.addEventListener('msfullscreenchange', () => {
    isFullscreen.value = !!(document as any).msFullscreenElement;
  });
});

// 清理定时器和事件监听器（必须在 onMounted 外部调用）
onUnmounted(() => {
  document.removeEventListener('dblclick', handleDoubleClick);
  document.removeEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
  document.removeEventListener('webkitfullscreenchange', () => {
    isFullscreen.value = !!(document as any).webkitFullscreenElement;
  });
  document.removeEventListener('msfullscreenchange', () => {
    isFullscreen.value = !!(document as any).msFullscreenElement;
  });
});
</script>

<style lang="scss" scoped>
/* 重置样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 主容器 - 16:10比例设计 */
.idol-master-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10; /* 16:10 宽高比 */
  min-height: 600px; /* 确保最小高度 */
  max-height: 100vh; /* 不超过视口高度 */
  overflow: hidden;
  font-family: 'Arial', 'Hiragino Sans', 'Microsoft YaHei', sans-serif;
}

/* ===== 背景图层（Z-index: 1） ===== */
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.office-background {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* 背景图片（如果提供了URL） */
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* CSS 艺术283事务所场景 */
.css-office-scene {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* 天空/墙面背景 */
.sky-wall {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #e8f4f8 0%, #d4e9f2 20%, #c8dde8 40%, #b8cdd8 60%, #a8b5c0 80%, #95a5b0 100%);

  /* 墙面纹理 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 70%;
    background-image:
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 3px,
        rgba(255, 255, 255, 0.02) 3px,
        rgba(255, 255, 255, 0.02) 6px
      ),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        rgba(255, 255, 255, 0.02) 3px,
        rgba(255, 255, 255, 0.02) 6px
      );
  }
}

/* 窗户样式 */
.window {
  position: absolute;
  top: 12%;
  width: 16%;
  aspect-ratio: 2 / 3;
  background: linear-gradient(135deg, #e8f7ff 0%, #cfe9f8 50%, #b8dff0 100%);
  border: 4px solid #7a8fa0;
  border-radius: 8px;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.3),
    inset 0 0 30px rgba(255, 255, 255, 0.6);
  overflow: hidden;

  &.window-left {
    left: 8%;
  }

  &.window-right {
    right: 8%;
  }
}

.window-pane {
  position: absolute;
  width: 50%;
  height: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(200, 230, 255, 0.4) 40%,
    transparent 70%
  );

  &.pane-1 {
    top: 0;
    left: 0;
  }
  &.pane-2 {
    top: 0;
    right: 0;
  }
  &.pane-3 {
    bottom: 0;
    left: 0;
  }
  &.pane-4 {
    bottom: 0;
    right: 0;
  }
}

.window-cross {
  position: absolute;
  background: #7a8fa0;

  &.horizontal {
    top: 50%;
    left: 0;
    width: 100%;
    height: 4px;
    transform: translateY(-50%);
  }

  &.vertical {
    top: 0;
    left: 50%;
    width: 4px;
    height: 100%;
    transform: translateX(-50%);
  }
}

.window-shine {
  position: absolute;
  top: 15%;
  left: 15%;
  width: 30%;
  height: 40%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.3) 30%,
    transparent 60%
  );
  border-radius: 50%;
  filter: blur(10px);
}

/* 地板 */
.floor {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 35%;
  background: linear-gradient(
    to bottom,
    rgba(139, 126, 102, 0.1) 0%,
    rgba(139, 126, 102, 0.2) 20%,
    rgba(139, 126, 102, 0.35) 100%
  );
  transform-origin: center top;
  transform: perspective(800px) rotateX(45deg);
}

.floor-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: rgba(139, 126, 102, 0.15);

  @for $i from 1 through 15 {
    &:nth-child(#{$i}) {
      bottom: #{($i - 1) * 6.67%};
    }
  }
}

/* 装饰物容器 */
.decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 盆栽 */
.plant {
  position: absolute;
  bottom: 8%;
  width: 8%;
  aspect-ratio: 1;

  &.plant-left {
    left: 3%;
  }

  &.plant-right {
    right: 3%;
  }
}

.pot {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 40%;
  background: linear-gradient(135deg, #8b6f47 0%, #6b5535 100%);
  border-radius: 5px 5px 15px 15px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 -3px 5px rgba(0, 0, 0, 0.2);
}

.leaves {
  position: absolute;
  width: 35%;
  aspect-ratio: 1;
  background: radial-gradient(ellipse at center, #4a7c59 0%, #3d6b4b 50%, #2f5839 100%);
  border-radius: 50% 0 50% 0;

  &.leaf-1 {
    top: 10%;
    left: 50%;
    transform: translateX(-50%) rotate(-10deg);
  }

  &.leaf-2 {
    top: 20%;
    left: 20%;
    transform: rotate(-45deg);
  }

  &.leaf-3 {
    top: 20%;
    right: 20%;
    transform: rotate(45deg);
  }
}

/* 283 Logo */
.office-logo {
  position: absolute;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  padding: 15px 30px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.logo-text {
  font-size: clamp(32px, 4vw, 48px);
  font-weight: bold;
  color: #ff6b9d;
  text-shadow:
    0 2px 10px rgba(255, 107, 157, 0.5),
    0 0 20px rgba(255, 107, 157, 0.3);
  letter-spacing: 3px;
}

.logo-subtitle {
  font-size: clamp(10px, 1.2vw, 14px);
  font-weight: bold;
  color: rgba(0, 0, 0, 0.6);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 5px;
}

/* ===== 角色立绘层（Z-index: 2） ===== */
.character-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* ===== 制作人信息（左上角） ===== */
.producer-info {
  position: absolute;
  top: clamp(15px, 2.5vw, 30px);
  left: clamp(15px, 2.5vw, 30px);
  z-index: 4;
}

/* ===== 服装切换按钮（右上角） ===== */
.costume-toggle-container {
  position: absolute;
  top: clamp(80px, 9vw, 110px); /* 下移避开右上角设置按钮 */
  right: clamp(15px, 2.5vw, 30px);
  z-index: 4;
}

.costume-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(147, 39, 143, 0.8) 0%, rgba(70, 39, 133, 0.8) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow:
    0 4px 15px rgba(147, 39, 143, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.1);

  i {
    font-size: 16px;
    transition: transform 0.3s ease;
  }

  .costume-label {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  &:hover {
    transform: translateY(-2px) scale(1.05);
    background: linear-gradient(135deg, rgba(147, 39, 143, 0.95) 0%, rgba(70, 39, 133, 0.95) 100%);
    box-shadow:
      0 6px 20px rgba(147, 39, 143, 0.4),
      inset 0 0 15px rgba(255, 255, 255, 0.2);

    i {
      transform: rotate(15deg);
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
}

.producer-card {
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.5vw, 15px);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.75) 0%, rgba(20, 20, 40, 0.8) 100%);
  padding: clamp(10px, 1.5vw, 15px) clamp(15px, 2vw, 20px);
  border-radius: 50px;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.4),
      inset 0 0 15px rgba(255, 255, 255, 0.1);
  }
}

.producer-avatar {
  width: clamp(35px, 4.5vw, 45px);
  height: clamp(35px, 4.5vw, 45px);
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8eb3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: clamp(16px, 2vw, 20px);
  box-shadow: 0 0 15px rgba(255, 107, 157, 0.5);
}

.producer-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
}

.producer-name-row {
  display: flex;
  align-items: baseline;
  gap: 8px;

  .producer-label {
    font-size: clamp(10px, 1.1vw, 12px);
    color: rgba(255, 255, 255, 0.65);
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .producer-name {
    font-size: clamp(15px, 1.8vw, 20px);
    color: #fff;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
}

.producer-level-row {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .producer-level-label {
    font-size: clamp(11px, 1.2vw, 13px);
    color: rgba(255, 193, 7, 0.9);
    font-weight: 600;
    font-family: 'Courier New', Consolas, monospace;
  }

  .producer-level-value {
    font-size: clamp(16px, 1.9vw, 22px);
    color: #ffd700;
    font-weight: 700;
    font-family: 'Courier New', Consolas, monospace;
    text-shadow:
      0 0 8px rgba(255, 215, 0, 0.6),
      0 1px 2px rgba(0, 0, 0, 0.4);
  }
}

/* ===== 居中的角色立绘（往下延展） ===== */
.character-container-center {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding-bottom: 0;
}

.spine-character {
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.4));
  pointer-events: auto; // 允许交互

  // 确保 Spine 容器可见
  :deep(.spine-player-wrapper) {
    pointer-events: auto;
    width: 100%;
    height: 100%;
  }

  :deep(.spine-canvas) {
    pointer-events: auto;
    width: 100% !important;
    height: 100% !important;
  }
}

/* ===== 主页按钮（左下角） ===== */
.home-button-container {
  position: absolute;
  bottom: 30px;
  left: 30px;
  z-index: 100;
  display: flex;
  flex-direction: column-reverse; /* 让主页按钮在最下方，手机按钮在上方 */
  align-items: center;
}

.home-button {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.2vw, 12px);
  padding: clamp(12px, 1.8vw, 18px) clamp(18px, 2.5vw, 25px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50px;
  color: white;
  font-size: clamp(14px, 1.6vw, 18px);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 5px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  i {
    font-size: clamp(18px, 2.2vw, 24px);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  span {
    letter-spacing: 0.5px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }
}

/* 主页菜单 */
.home-menu {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;
  min-width: 300px;
  max-width: 400px;
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.95) 0%, rgba(40, 40, 60, 0.95) 100%);
  border-radius: 15px;
  padding: 15px;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: slideUpMenu 0.3s ease;
}

@keyframes slideUpMenu {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    color: #fff;
    font-size: clamp(16px, 1.8vw, 20px);
    margin: 0;
  }
}

.menu-close {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
}

.character-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
}

.character-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 107, 157, 0.5);
  }

  &.active {
    background: rgba(255, 107, 157, 0.2);
    border-color: #ff6b9d;
  }
}

.char-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a78bfa 0%, #c084fc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.char-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;

  .char-name {
    color: #fff;
    font-size: clamp(13px, 1.4vw, 16px);
    font-weight: bold;
  }

  .char-unit {
    color: rgba(255, 255, 255, 0.6);
    font-size: clamp(11px, 1.2vw, 13px);
  }
}

.active-icon {
  color: #ff6b9d;
  font-size: 20px;
  flex-shrink: 0;
}

/* ===== 功能按钮层（Z-index: 3） ===== */
.function-layer {
  position: absolute;
  bottom: 3%;
  left: 55%;
  transform: translateX(-50%);
  z-index: 3;
}

.main-buttons {
  display: flex;
  gap: clamp(15px, 2.5vw, 30px);
  padding: 0 20px;
  align-items: center;
}

.function-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 5px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  overflow: hidden;

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
  }

  .btn-text {
    letter-spacing: 0.5px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .btn-shine {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);

    .btn-shine {
      transform: translateX(100%);
    }
  }

  &:active {
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 4px 15px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  // 所有按钮统一为横向长方形
  flex-direction: row;
  border-radius: 14px;
  min-width: clamp(110px, 13vw, 150px);
  height: clamp(52px, 6.5vw, 74px);
  padding: clamp(10px, 1.5vw, 16px) clamp(16px, 2.2vw, 24px);
  gap: clamp(8px, 1.2vw, 12px);

  .btn-icon i {
    font-size: clamp(22px, 3vw, 36px);
  }

  .btn-text {
    font-size: clamp(12px, 1.5vw, 16px);
    white-space: nowrap;
    margin-top: 0;
  }

  // 偶像图鉴按钮 - 紫粉渐变
  &.idol-btn {
    background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
  }

  // 新手介绍按钮 - 橙黄渐变
  &.guide-btn {
    background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%);
  }

  // 抽卡按钮 - 金色渐变
  &.gacha-btn {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  }

  // 自由活动按钮 - 粉红渐变
  &.activity-btn {
    background: linear-gradient(135deg, #fecaca 0%, #fb7185 100%);
  }

  // 音乐按钮 - 蓝紫渐变
  &.music-btn {
    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  }

  // 培育按钮 - 绿色渐变
  &.produce-btn {
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  }
}

/* 组合名称 */
.character-unit {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: clamp(12px, 1.4vw, 16px);
  padding: clamp(6px, 1vw, 10px) clamp(12px, 1.5vw, 16px);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  margin-bottom: clamp(15px, 2vw, 20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* ===== 资源显示层（Z-index: 3） ===== */
/* 资源显示层 - 顶部横向布局 */
.resource-display-top {
  position: absolute;
  top: clamp(8px, 1vw, 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  gap: clamp(15px, 3vw, 30px);
  align-items: center;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1vw, 10px);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 20, 40, 0.75) 100%);
  padding: clamp(6px, 1vw, 10px) clamp(12px, 2vw, 20px);
  border-radius: 25px;
  color: white;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    0 3px 10px rgba(0, 0, 0, 0.3),
    inset 0 0 8px rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 5px 15px rgba(0, 0, 0, 0.4),
      inset 0 0 12px rgba(255, 255, 255, 0.1);
  }

  i {
    font-size: clamp(20px, 2.5vw, 28px);
    filter: drop-shadow(0 2px 5px currentColor);
  }

  .resource-icon {
    width: clamp(32px, 4vw, 48px);
    height: clamp(32px, 4vw, 48px);
    object-fit: contain;
    filter: drop-shadow(0 3px 10px rgba(255, 107, 157, 0.8));
    background: transparent;
    border: none;
  }

  .resource-value {
    font-weight: bold;
    font-size: clamp(16px, 2vw, 24px);
    text-shadow: 0 0 10px currentColor;
  }

  &.feather-stone {
    i {
      color: #ff6b9d;
    }
    .resource-value {
      color: #ff6b9d;
    }
  }

  &.fans {
    i {
      color: #6dd5ed;
    }
    .resource-value {
      color: #6dd5ed;
    }
  }
}

/* 设置按钮 - 右上角位置 */
.settings-button-top {
  position: absolute;
  right: clamp(15px, 2vw, 25px);
  top: clamp(15px, 2vw, 25px);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(45px, 5vw, 55px);
  height: clamp(45px, 5vw, 55px);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 20, 40, 0.75) 100%);
  border-radius: 50%;
  color: white;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.15);
    background: linear-gradient(135deg, rgba(255, 165, 0, 0.7), rgba(255, 105, 180, 0.7));
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow:
      0 6px 25px rgba(255, 165, 0, 0.4),
      inset 0 0 15px rgba(255, 255, 255, 0.1);

    i {
      animation: spin 2s linear infinite;
    }
  }

  i {
    font-size: clamp(20px, 2.5vw, 24px);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 全屏按钮 - 右侧中间位置 */
.fullscreen-button {
  position: absolute;
  right: clamp(15px, 2vw, 25px);
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(45px, 5vw, 55px);
  height: clamp(45px, 5vw, 55px);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 20, 40, 0.75) 100%);
  border-radius: 50%;
  color: white;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-50%) scale(1.15);
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.7), rgba(147, 112, 219, 0.7));
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow:
      0 8px 25px rgba(255, 105, 180, 0.6),
      inset 0 0 15px rgba(255, 255, 255, 0.1);
  }

  i {
    font-size: clamp(18px, 2.2vw, 24px);
    filter: drop-shadow(0 2px 5px currentColor);
  }
}

/* 设置弹窗 */
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: clamp(15px, 2vw, 25px);
  z-index: 1001;
  animation: fadeIn 0.2s ease;
}

.settings-panel {
  background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2e 100%);
  border-radius: 12px;
  width: clamp(320px, 35vw, 450px);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideInRight 0.3s ease;
  color: #fff;
}

.settings-panel-header {
  padding: 20px 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #fff;
  }

  .panel-close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #fff;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.settings-panel-body {
  padding: 15px 0;
}

.settings-category {
  padding: 0 25px 20px;

  & + .settings-category {
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.category-title {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    font-size: 16px;
  }
}

.setting-row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 8px 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  align-items: center;
  margin-bottom: 10px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.setting-label-col {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;

  i {
    color: rgba(255, 255, 255, 0.6);
    font-size: 18px;
  }
}

.setting-desc {
  grid-column: 1;
  grid-row: 2;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.setting-control-col {
  grid-column: 2;
  grid-row: 1 / 3;
  display: flex;
  align-items: center;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

      &::before {
        transform: translateX(22px);
      }
    }

    &:focus + .toggle-slider {
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.4);
    }
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 34px;
  transition: 0.3s;

  &::before {
    position: absolute;
    content: '';
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
    transition: 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

/* 开发工具按钮 */
.dev-action-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
  }

  &:active {
    transform: translateY(0);
  }

  i {
    font-size: 14px;
  }

  &.danger {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);

    &:hover {
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.5);
    }
  }
}

/* 手机按钮样式 */
.phone-button {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 240, 255, 0.9) 100%);
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  margin-bottom: 16px; /* 与主页按钮的间距 */

  &:hover {
    transform: scale(1.05) translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    background: white;
  }

  &:active {
    transform: scale(0.95);
  }

  i {
    font-size: 28px;
    color: #667eea;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  span {
    font-size: 12px;
    font-weight: 600;
    color: #555;
  }
}

.phone-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff3b30;
  color: white;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  animation: bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes bounceIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

/* Spine 调试工具样式 */
.spine-debug-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.slider-row {
  padding: 8px 15px !important;
  min-height: auto !important;
}

.slider-label {
  min-width: 60px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.slider-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.debug-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.15);
    }
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
  }
}

.slider-value {
  min-width: 50px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
  font-family: 'Consolas', monospace;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ===== 新界面：角色栏选择（第二层） ===== */
.character-gallery-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

.gallery-content {
  position: relative;
  width: 90%;
  max-width: 1400px;
  height: 90%; /* 从 85% 增加到 90%，角色栏界面更高 */
  max-height: 95vh; /* 不超过视口高度 */
  background: linear-gradient(135deg, rgba(30, 30, 60, 0.98), rgba(50, 50, 80, 0.98));
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(15px, 2vw, 25px) clamp(20px, 3vw, 40px);
  background: linear-gradient(90deg, rgba(255, 105, 180, 0.2), rgba(147, 112, 219, 0.2));
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.gallery-title {
  color: #fff;
  font-size: clamp(20px, 3vw, 32px);
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 15px;

  i {
    color: #ffb6d9;
  }
}

.gallery-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  font-size: 20px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 105, 180, 0.5);
    transform: rotate(90deg);
  }
}

.gallery-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(30px, 4vw, 50px); /* 增加 padding 给卡片更多空间 */
  position: relative;
  overflow-y: auto; /* 如果内容太多，允许滚动 */
}

.unit-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.8), rgba(147, 112, 219, 0.8));
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;

  &.prev {
    left: 20px;
  }

  &.next {
    right: 20px;
  }

  &:hover {
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 10px 30px rgba(255, 105, 180, 0.6);
  }
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(140px, 18vw, 200px), 1fr));
  gap: clamp(20px, 2.5vw, 35px);
  max-width: 1300px;
  width: 100%;
  justify-items: center;
  padding: clamp(10px, 2vw, 20px);
}

.character-card-item {
  cursor: pointer;
  transition: transform 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 100%;

  &:hover {
    transform: scale(1.05);

    .card-frame {
      box-shadow: 0 15px 40px rgba(255, 105, 180, 0.6);
      border-color: rgba(255, 105, 180, 0.8);
    }
  }
}

.card-frame {
  width: 100%;
  aspect-ratio: 9 / 16; /* 9:16 比例，匹配人物立绘 */
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 15px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* 防止在 flex 容器中缩小 */
  min-height: 0; /* 重置最小高度，让 aspect-ratio 生效 */
}

.char-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 完整显示，不裁剪 */
  object-position: center; /* 居中 */
}

.char-thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: rgba(255, 255, 255, 0.3);
}

.gallery-footer {
  padding: clamp(15px, 2vw, 25px);
  background: rgba(0, 0, 0, 0.3);
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.unit-indicators {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.unit-indicator {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(11px, 1.2vw, 14px);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;

  &.active {
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.6), rgba(147, 112, 219, 0.6));
    color: #fff;
    border-color: rgba(255, 255, 255, 0.5);
    font-weight: bold;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
}

/* ===== 新界面：卡牌详情（第三层） ===== */
.card-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(15px);
}

.card-content {
  position: relative;
  width: 90%;
  max-width: 1600px;
  height: 90%;
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.98), rgba(40, 40, 70, 0.98));
  border-radius: 25px;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(15px, 2vw, 25px) clamp(25px, 3vw, 45px);
  background: linear-gradient(90deg, rgba(147, 112, 219, 0.3), rgba(255, 105, 180, 0.3));
  border-bottom: 3px solid rgba(255, 255, 255, 0.15);
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 25px;
  color: #fff;
  font-size: clamp(14px, 1.5vw, 16px);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: rgba(255, 105, 180, 0.4);
    border-color: rgba(255, 105, 180, 0.8);
    transform: translateX(-5px);
  }
}

.card-character-name {
  color: #fff;
  font-size: clamp(22px, 3.5vw, 36px);
  font-weight: bold;
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
}

.card-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  font-size: 22px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 105, 180, 0.5);
    transform: rotate(90deg);
  }
}

.card-body {
  flex: 1;
  display: flex;
  gap: clamp(20px, 3vw, 40px);
  padding: clamp(20px, 3vw, 40px);
  overflow: hidden;
}

.card-display-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 400px;
}

.card-name-tag {
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.6), rgba(147, 112, 219, 0.6));
  padding: 12px 20px;
  border-radius: 15px;
  color: #fff;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: bold;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.4);
}

.card-image-container {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.1);
}

.awaken-toggle {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.8));
  border: 3px solid rgba(255, 255, 255, 0.5);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
  box-shadow: 0 5px 15px rgba(255, 215, 0, 0.5);

  &:hover {
    transform: rotate(180deg) scale(1.1);
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.8);
  }
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5));
}

.card-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: rgba(255, 255, 255, 0.4);

  i {
    font-size: 80px;
  }

  p {
    font-size: 18px;
  }
}

.card-thumbnails {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 15px;
  overflow-x: auto;
}

.card-thumb {
  width: 100px;
  aspect-ratio: 3 / 4;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 3px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s;

  &.active {
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow: 0 5px 20px rgba(255, 215, 0, 0.6);
    transform: scale(1.05);
  }

  &:hover {
    border-color: rgba(255, 105, 180, 0.8);
    transform: scale(1.08);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.card-rarity {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 165, 0, 0.9));
  padding: 3px 8px;
  border-radius: 8px;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.card-skills-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 350px;
  max-width: 600px;
}

.skills-title {
  color: #fff;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 15px;
  border-bottom: 3px solid rgba(255, 105, 180, 0.5);

  i {
    color: #ffd700;
  }
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-right: 10px;

  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 105, 180, 0.5);
    border-radius: 10px;

    &:hover {
      background: rgba(255, 105, 180, 0.7);
    }
  }
}

.skill-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 105, 180, 0.1);
    border-color: rgba(255, 105, 180, 0.5);
    transform: translateX(5px);
  }
}

.skill-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.7), rgba(255, 165, 0, 0.7));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);

  i {
    color: #fff;
    font-size: 24px;
  }
}

.skill-content {
  flex: 1;
}

.skill-name {
  color: #fff;
  font-size: clamp(14px, 1.8vw, 18px);
  font-weight: bold;
  margin-bottom: 8px;
}

.skill-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: clamp(12px, 1.5vw, 15px);
  line-height: 1.6;
}

.no-skills {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);

  i {
    font-size: 60px;
  }

  p {
    font-size: 18px;
  }
}

/* ===== 音乐播放器页面（左右布局） ===== */
.music-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(20, 30, 48, 0.98), rgba(36, 59, 85, 0.98));
  backdrop-filter: blur(20px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.4s ease-out;
}

.music-back-btn {
  position: absolute;
  top: clamp(20px, 3vw, 40px);
  left: clamp(20px, 3vw, 40px);
  padding: clamp(10px, 1.5vw, 15px) clamp(20px, 2.5vw, 30px);
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  color: #fff;
  font-size: clamp(14px, 1.8vw, 18px);
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
  z-index: 10;

  &:hover {
    background: rgba(255, 105, 180, 0.6);
    border-color: rgba(255, 105, 180, 0.8);
    transform: translateX(-5px);
  }

  i {
    font-size: clamp(16px, 2vw, 20px);
  }
}

.music-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: clamp(30px, 4vw, 50px) 20px clamp(20px, 3vw, 30px);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);

  .music-icon {
    width: clamp(50px, 6vw, 70px);
    height: clamp(50px, 6vw, 70px);
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.8), rgba(255, 20, 147, 0.8));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 5px 20px rgba(255, 105, 180, 0.5);

    i {
      color: #fff;
      font-size: clamp(24px, 3vw, 32px);
    }
  }

  h2 {
    color: #fff;
    font-size: clamp(28px, 4vw, 42px);
    font-weight: bold;
    text-shadow: 0 2px 10px rgba(255, 105, 180, 0.5);
    margin: 0;
  }
}

/* 主内容区：左右布局 */
.music-content {
  flex: 1;
  display: flex;
  gap: clamp(30px, 4vw, 50px);
  padding: clamp(30px, 4vw, 50px);
  overflow: hidden;
}

/* 左侧：专辑封面 */
.album-cover-section {
  flex: 0 0 clamp(300px, 35vw, 500px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(20px, 3vw, 30px);
}

.album-cover-frame {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: rotate(45deg);
    animation: shine 3s infinite;
  }
}

@keyframes shine {
  0%,
  100% {
    transform: rotate(45deg) translateY(-100%);
  }
  50% {
    transform: rotate(45deg) translateY(100%);
  }
}

.album-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);

  i {
    font-size: clamp(80px, 10vw, 120px);
  }
}

/* ===== 抽卡页面样式 ===== */
.gacha-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(20, 30, 48, 0.98), rgba(36, 59, 85, 0.98));
  backdrop-filter: blur(20px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.4s ease-out;
}

.gacha-back-btn {
  position: absolute;
  top: clamp(20px, 3vw, 40px);
  left: clamp(20px, 3vw, 40px);
  padding: clamp(10px, 1.5vw, 15px) clamp(20px, 2.5vw, 30px);
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  color: #fff;
  font-size: clamp(14px, 1.8vw, 18px);
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
  z-index: 10;

  &:hover {
    background: rgba(255, 215, 0, 0.6);
    border-color: rgba(255, 215, 0, 0.8);
    transform: translateX(-5px);
  }

  i {
    font-size: clamp(16px, 2vw, 20px);
  }
}

.gacha-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

/* ===== 偶像图鉴页面样式 ===== */
.idol-collection-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.4s ease-out;
}

.collection-back-btn {
  position: absolute;
  top: clamp(20px, 3vw, 40px);
  left: clamp(20px, 3vw, 40px);
  padding: clamp(10px, 1.5vw, 15px) clamp(20px, 2.5vw, 30px);
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(102, 126, 234, 0.5);
  border-radius: 25px;
  cursor: pointer;
  font-size: clamp(14px, 1.8vw, 18px);
  font-weight: bold;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.2vw, 12px);
  transition: all 0.3s;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    background: #667eea;
    color: white;
    transform: translateX(-5px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  i {
    font-size: clamp(16px, 2vw, 20px);
  }
}

.collection-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

/* 响应式优化 */
@media (max-width: 1024px) {
  .character-container {
    flex-direction: column;
    padding: 5% 3%;
  }

  .spine-character {
    max-width: 90%;
  }

  .function-layer {
    bottom: 2%;
  }

  .main-buttons {
    gap: clamp(8px, 1.5vw, 15px);
  }

  .music-content {
    flex-direction: column;
    overflow-y: auto;
  }

  .album-cover-section {
    flex: 0 0 auto;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .song-list-section {
    width: 100%;
  }
}

/* ===== 日期显示 - 精美玻璃效果 ===== */
/* ===== 日期显示 - 宽屏高级玻璃效果 ===== */
/* ===== 顶部资源栏容器 ===== */
.resource-display-top {
  position: absolute;
  top: 20px;
  right: 80px; /* 给右侧设置按钮留出空间 */
  display: flex;
  align-items: center;
  gap: 15px; /* 增加间距，防止拥挤 */
  z-index: 10;
}

/* ===== 通用顶部胶囊样式 (模仿原作UI) ===== */
.top-bar-pill {
  display: flex;
  align-items: center;
  height: 36px;
  background: rgba(0, 0, 0, 0.5); /* 深色半透明背景 */
  border-radius: 18px; /* 完整的圆角胶囊 */
  padding: 0 16px 0 4px; /* 左侧留给图标，右侧文字padding */
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  color: white;
  font-family: 'Hiragino Sans', 'Microsoft YaHei', sans-serif;
  min-width: 120px; /* 保证最小宽度 */

  &:hover {
    background: rgba(0, 0, 0, 0.65);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-1px);
  }
}

/* 资源图标容器 */
.pill-icon-wrapper {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;

  img,
  i {
    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.3));
  }

  i {
    font-size: 18px;
  }
}

/* 资源数值 */
.pill-value {
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 0.5px;
  flex-grow: 1;
  text-align: right; /* 数字靠右对齐 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 特殊资源颜色 */
.feather-stone .pill-icon-wrapper i {
  color: #e0aaff;
}
.fans .pill-icon-wrapper i {
  color: #4ade80;
}

/* ===== 日期显示 (胶囊风格) ===== */
.date-pill {
  cursor: pointer;
  padding: 0 20px; /* 日期不需要左侧图标的大padding */
  gap: 10px;
  min-width: auto; /* 日期宽度自适应 */

  .date-icon {
    color: #ffd700;
    font-size: 16px;
  }

  .date-text-full {
    font-size: 18px; /* 统一大字体 */
    font-weight: bold;
    font-family: 'DIN Alternate', 'Roboto', sans-serif; /* 数字字体 */
    letter-spacing: 1px;
    display: flex;
    align-items: baseline;
    gap: 6px;

    .year-part {
      font-size: 18px; /* 年份和其他一样大 */
    }

    .separator {
      opacity: 0.6;
      font-size: 16px;
    }
  }
}
@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes calendar-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
