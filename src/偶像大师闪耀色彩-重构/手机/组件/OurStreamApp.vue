<template>
  <div class="ourstream-app">
    <!-- 顶部标题栏（粉色渐变） -->
    <div class="app-header">
      <button class="back-btn" @click="handleBack">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>

      <div class="logo">
        <span class="play-icon">▶</span>
        <span class="our-text">Our</span>
        <span class="stream-text">STREAM</span>
      </div>

      <div class="header-right">
        <div class="ticket-count">
          <span class="ticket-icon">🎫</span>
          <span class="ticket-num">{{ ticketCount }}</span>
        </div>
        <button class="favorite-btn" :class="{ active: showFavoritesOnly }" @click="toggleFavorites">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              fill="currentColor"
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: currentTab === tab.id }"
        @click="currentTab = tab.id"
      >
        {{ tab.label }}
        <span v-if="currentTab === tab.id" class="tab-arrow">▼</span>
      </button>
    </div>

    <!-- 视频列表视图 -->
    <div v-if="currentView === 'list'" class="video-list">
      <div v-if="filteredVideos.length === 0" class="empty-state">
        <span class="empty-icon">📺</span>
        <span class="empty-text">暂无视频</span>
      </div>

      <!-- 视频卡片 -->
      <div v-for="video in filteredVideos" :key="video.id" class="video-card" @click="openVideo(video)">
        <!-- 缩略图 -->
        <div class="thumbnail-container">
          <img :src="video.thumbnail" :alt="video.title" class="thumbnail" />
          <span class="duration">{{ video.duration }}</span>
        </div>

        <!-- 视频信息 -->
        <div class="video-info">
          <h3 class="video-title">{{ video.title }}</h3>
          <div class="video-meta">
            <span class="release-label">配信日時</span>
            <span class="release-date">{{ video.releaseDate }}</span>
          </div>
          <div class="unlock-status" :class="{ unlocked: video.unlocked }">
            <span class="unlock-icon">🎫</span>
            <span class="unlock-text">{{ video.unlocked ? '解放済み' : '未解放' }}</span>
          </div>
        </div>
      </div>

      <!-- 底部填充 -->
      <div class="list-padding"></div>
    </div>

    <!-- 视频播放视图 -->
    <div v-else-if="currentView === 'player' && selectedVideo" class="video-player-view">
      <!-- 视频播放器 -->
      <div class="player-container">
        <video
          ref="videoPlayer"
          :src="selectedVideo.videoUrl"
          :poster="selectedVideo.thumbnail"
          controls
          playsinline
          @ended="onVideoEnded"
        >
          您的浏览器不支持视频播放
        </video>
      </div>

      <!-- 视频详情 -->
      <div class="video-detail">
        <h2 class="detail-title">{{ selectedVideo.title }}</h2>
        <div class="detail-meta">
          <span class="release-label">配信日時</span>
          <span class="release-date">{{ selectedVideo.releaseDate }}</span>
        </div>
        <p v-if="selectedVideo.description" class="video-description">
          {{ selectedVideo.description }}
        </p>
      </div>

      <!-- 相关视频 -->
      <div class="related-section">
        <h3 class="related-title">関連動画</h3>
        <div class="related-list">
          <div v-for="video in relatedVideos" :key="video.id" class="related-card" @click="openVideo(video)">
            <img :src="video.thumbnail" :alt="video.title" class="related-thumbnail" />
            <div class="related-info">
              <span class="related-video-title">{{ video.title }}</span>
              <span class="related-date">{{ video.releaseDate }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { STREAM_VIDEOS, type StreamVideo } from '../数据/OurStreamAssets';

// ============ Props & Emits ============
defineProps<{
  ticketCount?: number;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

// ============ State ============
const currentView = ref<'list' | 'player'>('list');
const currentTab = ref<'idol' | 'unit' | 'etc'>('idol');
const showFavoritesOnly = ref(false);
const selectedVideo = ref<StreamVideo | null>(null);
const videoPlayer = ref<HTMLVideoElement | null>(null);

// ============ Tabs ============
const tabs = [
  { id: 'idol' as const, label: 'アイドル' },
  { id: 'unit' as const, label: 'ユニット' },
  { id: 'etc' as const, label: 'エトセトラ' },
];

// ============ Video Data ============
const videos = ref<StreamVideo[]>(STREAM_VIDEOS);

// ============ Computed ============
const filteredVideos = computed(() => {
  return videos.value.filter(v => v.category === currentTab.value);
});

const relatedVideos = computed(() => {
  if (!selectedVideo.value) return [];
  return videos.value
    .filter(v => v.id !== selectedVideo.value!.id && v.category === selectedVideo.value!.category)
    .slice(0, 3);
});

// ============ Methods ============
function handleBack() {
  if (currentView.value === 'player') {
    currentView.value = 'list';
    selectedVideo.value = null;
  } else {
    emit('back');
  }
}

function toggleFavorites() {
  showFavoritesOnly.value = !showFavoritesOnly.value;
}

function openVideo(video: StreamVideo) {
  if (!video.unlocked) {
    // TODO: 显示解锁提示或消耗票券
    alert('この動画はまだ解放されていません');
    return;
  }
  selectedVideo.value = video;
  currentView.value = 'player';
}

function onVideoEnded() {
  // 视频播放结束处理
  console.log('Video ended');
}

// ============ Public API ============
/**
 * 从外部加载视频列表
 * @param videoList 视频数据数组
 */
function loadVideos(videoList: StreamVideo[]) {
  videos.value = videoList;
}

/**
 * 解锁指定视频
 * @param videoId 视频ID
 */
function unlockVideo(videoId: string) {
  const video = videos.value.find(v => v.id === videoId);
  if (video) {
    video.unlocked = true;
  }
}

defineExpose({
  loadVideos,
  unlockVideo,
});
</script>

<style scoped>
.ourstream-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  font-family: 'Hiragino Sans', 'Meiryo', sans-serif;
}

/* ============ Header ============ */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
  color: #fff;
  position: relative;
}

.back-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: bold;
  font-size: 18px;
  background: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  color: #ff6b9d;
}

.play-icon {
  color: #ff6b9d;
  font-size: 14px;
}

.our-text {
  color: #ff6b9d;
}

.stream-text {
  color: #333;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ticket-count {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
}

.ticket-icon {
  font-size: 14px;
}

.ticket-num {
  font-weight: bold;
}

.favorite-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.favorite-btn.active {
  color: #fff;
}

/* ============ Tabs ============ */
.category-tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.tab-btn {
  flex: 1;
  padding: 12px 8px;
  background: none;
  border: none;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: color 0.2s;
}

.tab-btn.active {
  color: #ff6b9d;
  font-weight: bold;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: #ff6b9d;
}

.tab-arrow {
  font-size: 10px;
  color: #ff6b9d;
}

/* ============ Video List ============ */
.video-list {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
}

/* ============ Video Card ============ */
.video-card {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.video-card:hover {
  background: #fafafa;
}

.thumbnail-container {
  position: relative;
  flex-shrink: 0;
  width: 140px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.duration {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
}

.video-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.release-label {
  background: #eee;
  color: #666;
  padding: 2px 8px;
  border-radius: 3px;
}

.release-date {
  color: #999;
}

.unlock-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #ff6b9d;
  border: 1px solid #ff6b9d;
  padding: 2px 10px;
  border-radius: 12px;
  width: fit-content;
}

.unlock-status.unlocked {
  color: #4caf50;
  border-color: #4caf50;
}

.unlock-icon {
  font-size: 11px;
}

.list-padding {
  height: 20px;
}

/* ============ Video Player View ============ */
.video-player-view {
  flex: 1;
  overflow-y: auto;
  background: #000;
}

.player-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.player-container video {
  width: 100%;
  height: 100%;
}

.video-detail {
  padding: 16px;
  background: #fff;
}

.detail-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 12px;
}

.video-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}

/* ============ Related Videos ============ */
.related-section {
  padding: 16px;
  background: #f9f9f9;
}

.related-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 0 0 12px 0;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-card {
  display: flex;
  gap: 12px;
  cursor: pointer;
}

.related-thumbnail {
  width: 100px;
  height: 56px;
  object-fit: cover;
  border-radius: 4px;
}

.related-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.related-video-title {
  font-size: 13px;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-date {
  font-size: 11px;
  color: #999;
}
</style>
