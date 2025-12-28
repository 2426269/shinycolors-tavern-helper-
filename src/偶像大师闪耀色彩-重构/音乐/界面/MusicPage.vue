<template>
  <div class="music-page">
    <!-- 返回按钮 -->
    <button class="music-back-btn" @click="closeMusicPage">
      <i class="fas fa-arrow-left"></i>
      <span>返回</span>
    </button>

    <!-- 顶部标题 -->
    <div class="music-header">
      <div class="music-icon">
        <i class="fas fa-music"></i>
      </div>
      <h2>歌曲试听</h2>
    </div>

    <!-- 主内容区：左右布局 -->
    <div class="music-content">
      <!-- 左侧：专辑封面 -->
      <div class="album-cover-section">
        <div class="album-cover-frame">
          <img
            v-if="currentCoverUrl"
            :key="currentCoverUrl"
            :src="currentCoverUrl"
            :alt="songs[currentSongIndex]?.title"
            class="album-cover-img"
            @load="() => console.log('📸 [img] 图片加载完成:', currentCoverUrl)"
            @error="handleCoverError"
          />
          <div v-else class="album-cover-placeholder">
            <i class="fas fa-compact-disc"></i>
          </div>
        </div>

        <!-- 歌词显示 -->
        <div class="lyrics-display">
          <!-- 仅中文模式 -->
          <template v-if="lyricsMode === 'zh'">
            <div v-if="currentLyric.translation" class="lyrics-main">{{ currentLyric.translation }}</div>
            <div v-else class="lyrics-main">{{ currentLyric.main }}</div>
          </template>
          <!-- 仅日文模式 -->
          <template v-else-if="lyricsMode === 'ja'">
            <div class="lyrics-main">{{ currentLyric.main }}</div>
          </template>
          <!-- 双语模式 -->
          <template v-else>
            <div class="lyrics-main">{{ currentLyric.main }}</div>
            <div v-if="currentLyric.translation" class="lyrics-trans">{{ currentLyric.translation }}</div>
          </template>
        </div>

        <!-- 进度条 -->
        <div class="progress-container" @click="handleProgressClick">
          <div class="progress-bar" :style="{ width: `${currentProgress * 100}%` }"></div>
        </div>

        <!-- 播放控制 -->
        <div class="playback-controls">
          <button
            class="control-btn prev"
            :disabled="playbackMode === 'random' ? songs.length <= 1 : currentSongIndex === 0"
            @click="prevSong"
          >
            <i class="fas fa-step-backward"></i>
          </button>
          <button class="control-btn play" @click="togglePlay">
            <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
          </button>
          <button
            class="control-btn next"
            :disabled="playbackMode === 'random' ? songs.length <= 1 : currentSongIndex === songs.length - 1"
            @click="nextSong"
          >
            <i class="fas fa-step-forward"></i>
          </button>
        </div>

        <!-- 额外控制 -->
        <div class="extra-controls">
          <button
            class="extra-btn"
            :class="{ active: lyricsMode !== 'ja' }"
            :title="lyricsMode === 'both' ? '双语模式' : lyricsMode === 'zh' ? '中文模式' : '日文模式'"
            @click="toggleLyricsMode"
          >
            <i class="fas fa-language"></i>
          </button>
          <button
            class="extra-btn"
            :title="playbackMode === 'single' ? '单曲循环' : playbackMode === 'sequence' ? '顺序播放' : '随机播放'"
            @click="togglePlaybackMode"
          >
            <i
              :class="
                playbackMode === 'single'
                  ? 'fas fa-redo'
                  : playbackMode === 'sequence'
                    ? 'fas fa-list'
                    : 'fas fa-random'
              "
            ></i>
          </button>
          <div class="volume-control">
            <i class="fas fa-volume-up"></i>
            <input
              type="range"
              class="volume-slider"
              :value="volume * 100"
              min="0"
              max="100"
              @input="handleVolumeChange(($event.target as HTMLInputElement).valueAsNumber / 100)"
            />
          </div>
        </div>
      </div>

      <!-- 右侧：歌曲列表（支持滚轮和拖拽） -->
      <div class="song-list-container">
        <!-- 歌曲类型过滤按钮 -->
        <div class="song-filter-buttons">
          <button class="filter-btn" :class="{ active: songFilter === 'all' }" @click="songFilter = 'all'">
            全部 ({{ songs.length }})
          </button>
          <button class="filter-btn" :class="{ active: songFilter === '个人曲' }" @click="songFilter = '个人曲'">
            个人曲 ({{ songsByType['个人曲'].length }})
          </button>
          <button class="filter-btn" :class="{ active: songFilter === '组合曲' }" @click="songFilter = '组合曲'">
            组合曲 ({{ songsByType['组合曲'].length }})
          </button>
          <button class="filter-btn" :class="{ active: songFilter === '全体曲' }" @click="songFilter = '全体曲'">
            全体曲 ({{ songsByType['全体曲'].length }})
          </button>
          <button class="filter-btn" :class="{ active: songFilter === '团体曲' }" @click="songFilter = '团体曲'">
            团体曲 ({{ songsByType['团体曲'].length }})
          </button>
        </div>

        <!-- 歌曲列表 -->
        <div
          ref="songListRef"
          class="song-list-section"
          :class="{ dragging: isDragging }"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        >
          <div
            v-for="song in filteredSongs"
            :key="song.id"
            class="song-item"
            :class="{
              active: song.id === songs[currentSongIndex]?.id,
              disabled: !song.audioUrl,
            }"
            @click="song.audioUrl ? selectSongById(song.id) : null"
          >
            <!-- 歌曲图标 -->
            <div class="song-item-icon">
              <i v-if="!song.audioUrl" class="fas fa-lock" title="音频文件未上传"></i>
              <i v-else-if="song.id === songs[currentSongIndex]?.id && isPlaying" class="fas fa-volume-up"></i>
              <i v-else-if="song.id === songs[currentSongIndex]?.id" class="fas fa-music"></i>
              <i v-else class="fas fa-circle"></i>
            </div>

            <!-- 歌曲标题（始终显示） -->
            <div class="song-item-title">
              {{ song.title }}
              <span v-if="!song.audioUrl" class="no-audio-tag">(未上传)</span>
            </div>

            <!-- 展开的详细信息（仅当前歌曲） -->
            <div v-if="song.id === songs[currentSongIndex]?.id" class="song-item-details">
              <!-- 个人曲显示：角色 + 演唱（声优） -->
              <template v-if="song.type === '个人曲'">
                <div class="detail-row-compact">
                  <span class="detail-label-compact">角色:</span>
                  <span class="detail-value-compact">{{ song.artist }}</span>
                </div>
                <div v-if="song.voiceActor" class="detail-row-compact">
                  <span class="detail-label-compact">演唱:</span>
                  <span class="detail-value-compact">{{ song.voiceActor }}</span>
                </div>
              </template>
              <!-- 组合曲/全体曲显示：演唱 -->
              <template v-else>
                <div class="detail-row-compact">
                  <span class="detail-label-compact">演唱:</span>
                  <span class="detail-value-compact">{{ song.artist }}</span>
                </div>
              </template>
              <div class="detail-row-compact">
                <span class="detail-label-compact">作词:</span>
                <span class="detail-value-compact">{{ song.lyrics || '待添加' }}</span>
              </div>
              <div class="detail-row-compact">
                <span class="detail-label-compact">作曲:</span>
                <span class="detail-value-compact">{{ song.music || '待添加' }}</span>
              </div>
              <div class="detail-row-compact">
                <span class="detail-label-compact">收录:</span>
                <span class="detail-value-compact">{{ song.album || '待添加' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { TOAST_SUCCESS_DURATION_MS } from '../../工具/constants';
import { songs } from '../歌曲数据';
import { MusicPlayer } from '../音乐播放器';

const emit = defineEmits(['close']);

// 从localStorage读取保存的设置
const savedMusicSettings = JSON.parse(localStorage.getItem('musicSettings') || '{}');
const currentSongIndex = ref(savedMusicSettings.currentSongIndex ?? 0); // 当前选中的歌曲索引
const isPlaying = ref(false); // 是否正在播放
const currentProgress = ref(0); // 当前播放进度 (0-1)

const currentLyric = ref({ main: '♪', translation: '' }); // 当前歌词
const showTranslation = ref(false); // 是否显示翻译
const playbackMode = ref<'single' | 'sequence' | 'random'>(savedMusicSettings.playbackMode ?? 'single'); // 播放模式
const volume = ref(savedMusicSettings.volume ?? 0.3); // 音量 (0-1)
const currentCoverUrl = ref<string | null>(null); // 当前封面URL
const songFilter = ref<'all' | '个人曲' | '组合曲' | '全体曲' | '团体曲'>(savedMusicSettings.songFilter ?? 'all'); // 歌曲过滤类型
const lyricsMode = ref<'zh' | 'ja' | 'both'>(savedMusicSettings.lyricsMode ?? 'both'); // 歌词显示模式：中文/日文/双语
const lastScrollPosition = ref(0); // 记住上次滚动位置

// 自动保存音乐设置到localStorage
const saveMusicSettings = () => {
  const settings = {
    currentSongIndex: currentSongIndex.value,
    playbackMode: playbackMode.value,
    volume: volume.value,
    songFilter: songFilter.value,
    lyricsMode: lyricsMode.value,
  };
  localStorage.setItem('musicSettings', JSON.stringify(settings));
};

// 监听设置变化并自动保存
watch([currentSongIndex, playbackMode, volume, songFilter, lyricsMode], saveMusicSettings, { deep: true });

// 歌曲列表拖动控制
const songListRef = ref<HTMLElement | null>(null); // 歌曲列表容器引用
const isDragging = ref(false); // 是否正在拖拽
const dragStartY = ref(0); // 拖拽开始的Y坐标
const dragStartScrollTop = ref(0); // 拖拽开始时的滚动位置

// 按类型分组歌曲
const songsByType = computed(() => {
  return {
    个人曲: songs.filter(s => s.type === '个人曲'),
    组合曲: songs.filter(s => s.type === '组合曲'),
    全体曲: songs.filter(s => s.type === '全体曲'),
    团体曲: songs.filter(s => s.type === '团体曲'),
  };
});

// 过滤后的歌曲列表
const filteredSongs = computed(() => {
  if (songFilter.value === 'all') {
    return songs;
  }
  return songsByType.value[songFilter.value] || [];
});

// 关闭音乐页面
const closeMusicPage = () => {
  // 保存当前滚动位置
  if (songListRef.value) {
    lastScrollPosition.value = songListRef.value.scrollTop;
  }
  emit('close');
};

// 加载并播放歌曲
const loadSong = async (index: number) => {
  if (index < 0 || index >= songs.length) return;

  currentSongIndex.value = index;
  const song = songs[index];

  console.log('🎵 [loadSong] 开始切歌:', {
    songTitle: song.title,
    newCover: song.albumCover,
    currentCover: currentCoverUrl.value,
  });

  try {
    // 先设置封面（即使播放失败也显示封面）
    currentCoverUrl.value = song.albumCover || null;
    console.log('🖼️ [loadSong] 封面已设置:', currentCoverUrl.value);
    await nextTick();

    // 如果有音频URL，尝试播放歌曲
    if (song.audioUrl) {
      const success = await MusicPlayer.loadAndPlaySong(song);

      if (success) {
        console.log('✅ [loadSong] 播放成功');
        toastr.success(`♪ ${song.title}`, '播放成功', {
          timeOut: TOAST_SUCCESS_DURATION_MS,
        });
      }
      // 注意：播放失败的情况由 MusicPlayer 内部处理，这里不再重复提示
    } else {
      console.log('⚠️ [loadSong] 无音频文件');
      toastr.info(`《${song.title}》`, '音频文件未上传');
    }
  } catch (e) {
    console.error('加载歌曲失败:', e);
    // 即使播放失败，也保留封面显示
  }
};

// 滚动到指定歌曲（带动画）
const scrollToSong = (index: number) => {
  if (!songListRef.value) return;

  // 获取目标歌曲元素
  const songItems = songListRef.value.querySelectorAll('.song-item');
  const targetItem = songItems[index] as HTMLElement;

  if (targetItem) {
    // 平滑滚动到目标位置
    targetItem.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  }
};

// 选择歌曲（通过ID）
const selectSongById = (songId: number) => {
  const index = songs.findIndex(s => s.id === songId);
  if (index === -1) return;
  if (index === currentSongIndex.value) return; // 已经是当前歌曲，不处理

  // 加载新歌曲
  loadSong(index);

  // 自动滚动到选中的歌曲
  setTimeout(() => {
    scrollToSong(index);
  }, 50);
};

// 选择歌曲（通过索引，保留兼容性）
const selectSong = (index: number) => {
  if (index === currentSongIndex.value) return;
  loadSong(index);
  setTimeout(() => {
    scrollToSong(index);
  }, 50);
};

// 处理封面图片加载错误
const handleCoverError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.error('❌ [img] 图片加载失败:', {
    failedSrc: img.src,
    currentCoverUrl: currentCoverUrl.value,
    songTitle: songs[currentSongIndex.value]?.title,
  });
  // 不要清空封面，保持显示（避免图片闪烁消失）
  // 如果真的需要占位图，应该设置为默认图片URL而不是null
  console.log('⚠️ 保留当前封面显示，不清空');
};

// 鼠标拖动事件
const handleMouseDown = (event: MouseEvent) => {
  if (!songListRef.value) return;

  isDragging.value = true;
  dragStartY.value = event.clientY;
  dragStartScrollTop.value = songListRef.value.scrollTop;

  // 阻止文本选择
  event.preventDefault();
};

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !songListRef.value) return;

  const deltaY = dragStartY.value - event.clientY;
  songListRef.value.scrollTop = dragStartScrollTop.value + deltaY;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// 播放控制
const togglePlay = () => {
  MusicPlayer.togglePlay();
};

// 上一首（根据播放模式）
const prevSong = () => {
  if (playbackMode.value === 'random') {
    // 随机模式：随机选择一首（不是当前歌曲）
    if (songs.length > 1) {
      let randomIndex = currentSongIndex.value;
      while (randomIndex === currentSongIndex.value) {
        randomIndex = Math.floor(Math.random() * songs.length);
      }
      console.log('🎲 随机播放上一首，索引:', randomIndex);
      selectSong(randomIndex);
    }
  } else if (currentSongIndex.value > 0) {
    // 单曲循环或顺序播放：跳到上一首
    selectSong(currentSongIndex.value - 1);
  }
};

// 下一首（根据播放模式）
const nextSong = () => {
  if (playbackMode.value === 'random') {
    // 随机模式：随机选择一首（不是当前歌曲）
    if (songs.length > 1) {
      let randomIndex = currentSongIndex.value;
      while (randomIndex === currentSongIndex.value) {
        randomIndex = Math.floor(Math.random() * songs.length);
      }
      console.log('🎲 随机播放下一首，索引:', randomIndex);
      selectSong(randomIndex);
    }
  } else if (currentSongIndex.value < songs.length - 1) {
    // 单曲循环或顺序播放：跳到下一首
    selectSong(currentSongIndex.value + 1);
  }
};

// 音量控制
const handleVolumeChange = (value: number) => {
  volume.value = value;
  MusicPlayer.setVolume(value);
};

// 进度条控制
const handleProgressClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  MusicPlayer.seek(percent);
};

// 切换歌词模式（日文 → 双语 → 中文 → 日文）
const toggleLyricsMode = () => {
  if (lyricsMode.value === 'ja') {
    lyricsMode.value = 'both';
  } else if (lyricsMode.value === 'both') {
    lyricsMode.value = 'zh';
  } else {
    lyricsMode.value = 'ja';
  }
};

// 切换播放模式（单曲循环 → 顺序播放 → 随机播放 → 单曲循环）
const togglePlaybackMode = () => {
  const modes: ('single' | 'sequence' | 'random')[] = ['single', 'sequence', 'random'];
  const currentIndex = modes.indexOf(playbackMode.value);
  const newMode = modes[(currentIndex + 1) % modes.length];
  playbackMode.value = newMode;
  MusicPlayer.setPlaybackMode(newMode);

  // 显示提示
  const modeNames = { single: '单曲循环', sequence: '顺序播放', random: '随机播放' };
  toastr.info(`播放模式：${modeNames[newMode]}`, '', { timeOut: 1000 });
};

// 处理播放结束（用于顺序播放和随机播放）
const handleSongEnded = () => {
  console.log('🎵 歌曲播放结束，当前模式:', playbackMode.value);

  if (playbackMode.value === 'sequence') {
    // 顺序播放：播放下一首
    if (currentSongIndex.value < songs.length - 1) {
      console.log('📀 顺序播放下一首');
      selectSong(currentSongIndex.value + 1);
    } else {
      console.log('📀 已是最后一首，停止播放');
      isPlaying.value = false;
    }
  } else if (playbackMode.value === 'random') {
    // 随机播放：随机选择下一首（不重复当前歌曲）
    let randomIndex = currentSongIndex.value;
    if (songs.length > 1) {
      // 确保随机到的不是当前歌曲
      while (randomIndex === currentSongIndex.value) {
        randomIndex = Math.floor(Math.random() * songs.length);
      }
      console.log('🎲 随机播放下一首，索引:', randomIndex);
      selectSong(randomIndex);
    }
  }
};

// 更新UI状态（定时调用）
const updatePlayerState = () => {
  const state = MusicPlayer.getState();
  const audio = state.audio;

  // 更新播放进度
  if (audio.duration && !isNaN(audio.duration)) {
    currentProgress.value = audio.currentTime / audio.duration;
  }

  // 更新当前歌词
  currentLyric.value = MusicPlayer.getCurrentLyric();

  // 更新翻译显示状态
  showTranslation.value = state.lyrics.showTranslation;

  // 注意：封面完全由 loadSong 手动控制，定时器不再更新封面
  // 这样可以彻底避免定时器覆盖封面的问题
};

// 定义更新定时器变量
let updateInterval: number;

onMounted(() => {
  // 初始化音乐播放器
  MusicPlayer.init();

  // 设置播放模式（从保存的设置恢复）
  MusicPlayer.setPlaybackMode(playbackMode.value);

  // 设置播放结束回调（用于顺序播放和随机播放）
  MusicPlayer.setOnEndedCallback(handleSongEnded);

  // 设置定时器更新播放器状态
  updateInterval = setInterval(updatePlayerState, 100);

  // 监听音频元素的播放/暂停事件
  const audio = MusicPlayer.getState().audio;
  audio.addEventListener('play', () => {
    isPlaying.value = true;
  });
  audio.addEventListener('pause', () => {
    isPlaying.value = false;
  });

  // 添加全局鼠标事件监听（用于歌曲列表拖动）
  document.addEventListener('mousemove', e => {
    if (isDragging.value && songListRef.value) {
      const deltaY = dragStartY.value - e.clientY;
      songListRef.value.scrollTop = dragStartScrollTop.value + deltaY;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging.value) {
      isDragging.value = false;
    }
  });

  // 恢复上次浏览位置
  nextTick(() => {
    if (songListRef.value) {
      // 如果有正在播放的歌曲，滚动到该歌曲
      if (songs[currentSongIndex.value]) {
        scrollToSong(currentSongIndex.value);
      } else {
        // 否则恢复上次滚动位置
        songListRef.value.scrollTop = lastScrollPosition.value;
      }
    }
  });

  // 恢复封面：如果播放器正在播放，恢复封面
  const nowPlaying = MusicPlayer.getNowPlaying();
  if (nowPlaying.name) {
    // 从当前歌曲索引恢复封面
    const currentSong = songs[currentSongIndex.value];
    if (currentSong) {
      currentCoverUrl.value = currentSong.albumCover || nowPlaying.coverUrl || null;
      console.log('🖼️ 恢复封面:', currentCoverUrl.value);
    }
    // 同步播放状态
    isPlaying.value = !MusicPlayer.getState().audio.paused;
  } else if (songs.length > 0) {
    // 如果还没有播放任何歌曲，加载第一首
    loadSong(0);
  }

  console.log('打开音乐播放器');
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
</script>

<style scoped>
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
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
}

.music-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: clamp(20px, 3vw, 40px);
  gap: clamp(30px, 5vw, 60px);
}

/* 左侧：专辑封面与控制 */
.album-cover-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 45%;
  min-width: 350px;
}

.album-cover-frame {
  width: clamp(250px, 30vw, 450px);
  height: clamp(250px, 30vw, 450px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  border: 4px solid rgba(255, 255, 255, 0.1);
  position: relative;
  background: #000;
  margin-bottom: 30px;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.02);
  }
}

.album-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2e 100%);
  color: rgba(255, 255, 255, 0.2);

  i {
    font-size: 80px;
  }
}

.lyrics-display {
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-bottom: 20px;
  width: 100%;
}

.lyrics-main {
  color: #fff;
  font-size: clamp(18px, 2vw, 24px);
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 5px;
  min-height: 1.2em;
}

.lyrics-trans {
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(14px, 1.5vw, 18px);
  min-height: 1.2em;
}

.progress-container {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-bottom: 25px;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    height: 10px;
    background: rgba(255, 255, 255, 0.2);
  }
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d, #ff8e53);
  border-radius: 3px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
    opacity: 0;
    transition: opacity 0.2s;
  }
}

.progress-container:hover .progress-bar::after {
  opacity: 1;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 20px;
}

.control-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #ff6b9d;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    color: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
    transform: none;
  }

  &.play {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #fff;
    color: #ff6b9d;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);

    i {
      font-size: 24px;
      margin-left: 3px; /* 视觉修正 */
    }

    &:hover {
      background: #ff6b9d;
      color: #fff;
      box-shadow: 0 8px 20px rgba(255, 107, 157, 0.4);
    }
  }

  &.prev,
  &.next {
    i {
      font-size: 28px;
    }
  }
}

.extra-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  justify-content: center;
}

.extra-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  &.active {
    color: #ff6b9d;
    background: rgba(255, 107, 157, 0.1);
  }

  i {
    font-size: 18px;
  }
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 15px;
  border-radius: 20px;
  width: 150px;

  i {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
  }
}

.volume-slider {
  flex: 1;
  min-width: 0; /* 防止溢出 */
  margin: 0;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: scale(1.2);
    }
  }
}

/* 右侧：歌曲列表 */
.song-list-container {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.song-filter-buttons {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */

  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }
}

.filter-btn {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  &.active {
    background: linear-gradient(135deg, #ff6b9d 0%, #ff8e53 100%);
    border-color: transparent;
    color: #fff;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
  }
}

.song-list-section {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  cursor: grab;

  &.dragging {
    cursor: grabbing;
    user-select: none;
  }

  /* 滚动条美化 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.song-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: rgba(255, 107, 157, 0.15);
    border-color: rgba(255, 107, 157, 0.5);

    .song-item-icon i {
      color: #ff6b9d;
      animation: pulse 1.5s infinite;
    }

    .song-item-title {
      color: #ff6b9d;
      font-weight: bold;
    }
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }
}

.song-item-icon {
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;

  i {
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
  }
}

.song-item-title {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px;
}

.no-audio-tag {
  font-size: 12px;
  color: #ff6b6b;
  margin-left: 5px;
}

.song-item-details {
  width: 100%;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  animation: slideDown 0.3s ease;
}

.detail-row-compact {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-label-compact {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  white-space: nowrap;
}

.detail-value-compact {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
