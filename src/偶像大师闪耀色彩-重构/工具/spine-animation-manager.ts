/**
 * Spine动画管理器
 * 负责动画播放控制、队列管理、自动过渡
 * 兼容 Spine Web Player
 */

import { ref, type Ref } from 'vue';

// 通用 Spine 接口，兼容 Spine Web Player 和 pixi-spine
export interface ISpine {
  skeleton: any;
  state: any;
}

export interface AnimationQueueItem {
  name: string; // 动画名称
  loop: boolean; // 是否循环
  trackIndex?: number; // 轨道索引，默认0
  priority?: number; // 优先级，数字越大优先级越高
}

/**
 * 动画管理器类
 */
export class SpineAnimationManager {
  private spine: ISpine | null = null;
  private animationQueue: AnimationQueueItem[] = [];
  private isPlaying = false;
  private currentAnimation: Ref<string> = ref('Idle');
  private idleAnimation = 'Idle'; // 默认待机动画

  constructor() {
    console.log('🎬 SpineAnimationManager 已初始化');
  }

  /**
   * 设置Spine实例
   */
  setSpine(spine: ISpine | any | null) {
    this.spine = spine;

    if (spine) {
      console.log('✅ Spine实例已绑定到动画管理器');

      // 监听动画完成事件
      if (spine.state && spine.state.addListener) {
        spine.state.addListener({
          complete: (entry: any) => {
            console.log(`🎬 动画完成: ${entry.animation?.name}`);
            this.onAnimationComplete(entry.animation?.name || '');
          },
          start: (entry: any) => {
            console.log(`▶️ 动画开始: ${entry.animation?.name}`);
            this.currentAnimation.value = entry.animation?.name || '';
          },
        });
      }

      // 不自动播放待机动画，由组件自行控制
      // this.playIdle();
    }
  }

  /**
   * 设置待机动画
   */
  setIdleAnimation(animationName: string) {
    this.idleAnimation = animationName;
    console.log(`🎬 设置待机动画: ${animationName}`);
  }

  /**
   * 播放动画
   * @param name 动画名称
   * @param loop 是否循环
   * @param trackIndex 轨道索引
   */
  play(name: string, loop = false, trackIndex = 0) {
    if (!this.spine) {
      console.warn('⚠️ Spine实例未设置');
      return;
    }

    try {
      // 检查动画是否存在
      if (!this.hasAnimation(name)) {
        console.warn(`⚠️ 动画 ${name} 不存在，可用动画:`, this.getAvailableAnimations());
        return;
      }

      console.log(`▶️ 播放动画: ${name} (loop: ${loop}, track: ${trackIndex})`);
      this.spine.state.setAnimation(trackIndex, name, loop);
      this.isPlaying = true;
      this.currentAnimation.value = name;
    } catch (error) {
      console.error(`❌ 播放动画 ${name} 失败:`, error);
    }
  }

  /**
   * 添加动画到队列
   */
  addToQueue(item: AnimationQueueItem) {
    console.log(`➕ 添加动画到队列: ${item.name}`);
    this.animationQueue.push(item);

    // 如果当前没有播放动画，立即播放队列中的第一个
    if (!this.isPlaying) {
      this.playNextInQueue();
    }
  }

  /**
   * 播放下一个队列中的动画
   */
  private playNextInQueue() {
    if (this.animationQueue.length === 0) {
      // 队列为空，播放待机动画
      this.playIdle();
      return;
    }

    // 按优先级排序
    this.animationQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const next = this.animationQueue.shift();
    if (next) {
      this.play(next.name, next.loop, next.trackIndex || 0);
    }
  }

  /**
   * 动画完成回调
   */
  private onAnimationComplete(animationName: string) {
    this.isPlaying = false;

    // 如果 spine 已销毁，不处理
    if (!this.spine || !this.spine.state) {
      return;
    }

    // 如果是循环动画，不处理队列
    const currentTrack = this.spine.state.getCurrent(0);
    if (currentTrack && currentTrack.loop) {
      return;
    }

    // 播放队列中的下一个动画
    this.playNextInQueue();
  }

  /**
   * 播放待机动画
   */
  playIdle() {
    this.play(this.idleAnimation, true, 0);
  }

  /**
   * 停止当前动画
   */
  stop(trackIndex = 0) {
    if (!this.spine) return;

    console.log(`⏹️ 停止动画 (track: ${trackIndex})`);
    this.spine.state.clearTrack(trackIndex);
    this.isPlaying = false;
  }

  /**
   * 清空动画队列
   */
  clearQueue() {
    console.log('🗑️ 清空动画队列');
    this.animationQueue = [];
  }

  /**
   * 播放情绪动画（自动返回待机）
   */
  playEmotion(emotion: string) {
    console.log(`😊 播放情绪动画: ${emotion}`);
    this.addToQueue({
      name: emotion,
      loop: false,
      priority: 10,
    });
  }

  /**
   * 播放说话动画（循环）
   */
  playTalk(talkAnimation = 'Talk_01') {
    console.log(`💬 播放说话动画: ${talkAnimation}`);
    this.play(talkAnimation, true, 0);
  }

  /**
   * 停止说话，返回待机
   */
  stopTalk() {
    console.log('🤐 停止说话');
    this.playIdle();
  }

  /**
   * 播放交互动画（点击反馈）
   */
  playInteraction(interactionName: string) {
    console.log(`👆 播放交互动画: ${interactionName}`);
    this.addToQueue({
      name: interactionName,
      loop: false,
      priority: 20, // 交互动画优先级最高
    });
  }

  /**
   * 获取当前动画名称
   */
  getCurrentAnimation(): string {
    return this.currentAnimation.value;
  }

  /**
   * 获取所有可用动画列表
   */
  getAvailableAnimations(): string[] {
    if (!this.spine) return [];

    try {
      // 确保 skeleton 和 data 存在
      if (!this.spine.skeleton || !this.spine.skeleton.data) {
        console.warn('⚠️ Spine skeleton 或 data 未定义');
        return [];
      }

      if (!this.spine.skeleton.data.animations) {
        console.warn('⚠️ 未找到动画列表');
        return [];
      }

      return this.spine.skeleton.data.animations.map((anim: any) => anim.name);
    } catch (error) {
      console.error('获取可用动画列表时出错:', error);
      return [];
    }
  }

  /**
   * 检查动画是否存在
   */
  hasAnimation(name: string): boolean {
    if (!this.spine) return false;

    try {
      // 确保 skeleton 和 data 存在
      if (!this.spine.skeleton || !this.spine.skeleton.data) {
        console.warn('⚠️ Spine skeleton 或 data 未定义');
        return false;
      }

      // 尝试使用 findAnimation 方法（pixi-spine）
      if (this.spine.skeleton.data.findAnimation) {
        return !!this.spine.skeleton.data.findAnimation(name);
      }

      // 否则遍历 animations 数组（Spine Web Player）
      if (this.spine.skeleton.data.animations) {
        return this.spine.skeleton.data.animations.some((anim: any) => anim.name === name);
      }

      return false;
    } catch (error) {
      console.error('检查动画是否存在时出错:', error);
      return false;
    }
  }

  /**
   * 设置动画速度
   */
  setTimeScale(scale: number) {
    if (!this.spine) return;
    this.spine.state.timeScale = scale;
    console.log(`⏱️ 设置动画速度: ${scale}x`);
  }

  /**
   * 获取动画时长（秒）
   */
  getAnimationDuration(name: string): number {
    if (!this.spine) return 0;

    try {
      // 确保 skeleton 和 data 存在
      if (!this.spine.skeleton || !this.spine.skeleton.data) {
        console.warn('⚠️ Spine skeleton 或 data 未定义');
        return 0;
      }

      // 尝试使用 findAnimation 方法（pixi-spine）
      if (this.spine.skeleton.data.findAnimation) {
        const animation = this.spine.skeleton.data.findAnimation(name);
        return animation ? animation.duration : 0;
      }

      // 否则遍历 animations 数组（Spine Web Player）
      if (this.spine.skeleton.data.animations) {
        const animation = this.spine.skeleton.data.animations.find((anim: any) => anim.name === name);
        return animation ? animation.duration : 0;
      }

      return 0;
    } catch (error) {
      console.error('获取动画时长时出错:', error);
      return 0;
    }
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.stop();
    this.clearQueue();
    this.spine = null;
    console.log('🗑️ SpineAnimationManager 已销毁');
  }
}

// 导出单例实例
export const spineAnimationManager = new SpineAnimationManager();

/**
 * Vue Composable - 用于在组件中使用动画管理器
 */
export function useSpineAnimationManager() {
  return spineAnimationManager;
}
