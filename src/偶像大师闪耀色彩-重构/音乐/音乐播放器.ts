/**
 * 音乐播放器核心模块
 * 直接从CDN加载音频文件，无需API搜索
 */

import type { Song } from './songs';

// ===================== 全局类型扩展 =====================
declare global {
  interface Window {
    globalVolume?: number;
  }
}

// ===================== 类型定义 =====================
interface LyricLine {
  time: number;
  content: string;
}

interface PlayerState {
  audio: HTMLAudioElement;
  lyrics: {
    current: LyricLine[];
    translated: LyricLine[];
    showTranslation: boolean;
    activeIndex: number;
  };
  ui: {
    playbackMode: 'single' | 'sequence' | 'random';
    onEndedCallback?: () => void; // 播放结束回调
  };
  nowPlaying: {
    name: string | null;
    coverUrl: string | null;
  };
}

// ===================== 全局状态 =====================
const STATE: PlayerState = {
  audio: new Audio(),
  lyrics: {
    current: [],
    translated: [],
    showTranslation: false,
    activeIndex: -1,
  },
  ui: {
    playbackMode: 'single',
  },
  nowPlaying: {
    name: null,
    coverUrl: null,
  },
};

const audioChannel = new BroadcastChannel('webapp_global_audio_channel');
const instanceId = Date.now() + Math.random();

// 全局音量
if (!window.globalVolume) {
  (window as any).globalVolume = 0.3;
}

// ===================== 音频加载 =====================
/**
 * 加载并播放指定歌曲
 */
async function loadAndPlaySong(song: Song): Promise<boolean> {
  try {
    console.log('🎵 准备播放:', song.title);
    console.log('🔗 音频URL:', song.audioUrl);

    // 检查是否有音频URL
    if (!song.audioUrl) {
      toastr.warning(`歌曲《${song.title}》暂无音频文件`, '无法播放');
      return false;
    }

    // 停止当前播放
    STATE.audio.pause();
    STATE.audio.currentTime = 0;

    // 设置新音频源
    STATE.audio.src = song.audioUrl;
    STATE.nowPlaying.name = song.title;
    STATE.nowPlaying.coverUrl = song.albumCover || null;

    // 清空歌词
    STATE.lyrics.current = [];
    STATE.lyrics.translated = [];
    STATE.lyrics.activeIndex = -1;

    // 通知其他实例停止播放
    audioChannel.postMessage({
      action: 'stop_playback_request',
      fromInstance: instanceId,
    });

    // 添加错误监听
    STATE.audio.onerror = e => {
      console.error('🔴 音频加载错误:', e);
      console.error('错误代码:', STATE.audio.error?.code);
      console.error('错误信息:', STATE.audio.error?.message);
      console.error('当前URL:', STATE.audio.src);
    };

    // 加载音频
    await STATE.audio.load();

    // 开始播放
    await STATE.audio.play();
    console.log('✅ 播放成功:', song.title);
    return true;
  } catch (error: any) {
    console.error('❌ 播放失败:', error);
    console.error('错误详情:', {
      name: error.name,
      message: error.message,
      code: STATE.audio.error?.code,
    });

    // 根据错误类型给出更具体的提示
    let errorMsg = '播放失败';
    if (error.name === 'NotSupportedError' || STATE.audio.error?.code === 4) {
      errorMsg = 'CDN文件尚未同步，请稍后重试（约5-10分钟）';
    } else if (error.name === 'NotAllowedError') {
      errorMsg = '请先与页面交互后再播放';
    }

    toastr.error(`无法播放《${song.title}》`, errorMsg);
    return false;
  }
}

// ===================== 播放控制 =====================
/**
 * 切换播放/暂停
 */
function togglePlay(): void {
  if (STATE.audio.paused) {
    STATE.audio.play().catch(err => {
      console.error('播放失败:', err);
      toastr.error('播放失败', '错误');
    });
  } else {
    STATE.audio.pause();
  }
}

/**
 * 设置音量（0-1）
 */
function setVolume(value: number): void {
  const vol = Math.max(0, Math.min(1, value));
  STATE.audio.volume = vol;
  (window as any).globalVolume = vol;

  // 广播音量变化
  audioChannel.postMessage({
    action: 'volume_changed',
    volume: vol,
    fromInstance: instanceId,
  });
}

/**
 * 跳转到指定位置（0-1）
 */
function seek(position: number): void {
  if (!STATE.audio.duration || isNaN(STATE.audio.duration)) return;
  const time = position * STATE.audio.duration;
  STATE.audio.currentTime = time;
}

/**
 * 设置播放模式
 */
function setPlaybackMode(mode: 'single' | 'sequence' | 'random'): void {
  STATE.ui.playbackMode = mode;
  const modeNames = { single: '单曲循环', sequence: '顺序播放', random: '随机播放' };
  console.log('播放模式:', modeNames[mode]);
}

/**
 * 设置播放结束回调
 */
function setOnEndedCallback(callback: () => void): void {
  STATE.ui.onEndedCallback = callback;
}

/**
 * 切换歌词翻译显示
 */
function toggleTranslation(): void {
  STATE.lyrics.showTranslation = !STATE.lyrics.showTranslation;
}

// ===================== 歌词相关 =====================
/**
 * 根据当前播放时间查找歌词索引
 */
function findLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (lyrics.length === 0) return -1;

  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      return i;
    }
  }
  return -1;
}

/**
 * 获取当前应显示的歌词
 */
function getCurrentLyric(): { main: string; translation: string } {
  const idx = findLyricIndex(STATE.lyrics.current, STATE.audio.currentTime);
  STATE.lyrics.activeIndex = idx;

  if (idx === -1) {
    return { main: '', translation: '' };
  }

  const main = STATE.lyrics.current[idx]?.content || '';
  const trans = STATE.lyrics.translated[idx]?.content || '';

  return { main, translation: trans };
}

// ===================== 初始化 =====================
/**
 * 初始化播放器
 */
function init(): void {
  // 设置初始音量
  STATE.audio.volume = (window as any).globalVolume || 0.3;

  // 监听音频结束事件
  STATE.audio.addEventListener('ended', () => {
    console.log('🎵 播放结束，当前模式:', STATE.ui.playbackMode);

    if (STATE.ui.playbackMode === 'single') {
      // 单曲循环
      STATE.audio.currentTime = 0;
      STATE.audio.play();
    } else if (STATE.ui.playbackMode === 'sequence' || STATE.ui.playbackMode === 'random') {
      // 顺序播放或随机播放：调用外部回调
      if (STATE.ui.onEndedCallback) {
        STATE.ui.onEndedCallback();
      }
    }
  });

  // 监听跨标签页消息
  audioChannel.onmessage = e => {
    if (e.data.fromInstance === instanceId) return;

    switch (e.data.action) {
      case 'stop_playback_request':
        STATE.audio.pause();
        break;
      case 'volume_changed':
        STATE.audio.volume = e.data.volume;
        (window as any).globalVolume = e.data.volume;
        break;
    }
  };

  console.log('🎵 音乐播放器初始化完成');
}

/**
 * 获取当前播放信息
 */
function getNowPlaying() {
  return {
    name: STATE.nowPlaying.name,
    coverUrl: STATE.nowPlaying.coverUrl,
    source: 'CDN', // 固定来源为CDN
  };
}

// ===================== 导出API =====================
export const MusicPlayer = {
  init,
  loadAndPlaySong,
  togglePlay,
  setVolume,
  seek,
  setPlaybackMode,
  setOnEndedCallback,
  toggleTranslation,
  getCurrentLyric,
  getNowPlaying,
  getState: () => STATE,
};
