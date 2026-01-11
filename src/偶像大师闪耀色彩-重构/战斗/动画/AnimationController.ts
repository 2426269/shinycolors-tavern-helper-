import gsap from 'gsap';
import { readonly, ref } from 'vue';
import { BattleEvent, BattleEventType } from '../引擎-NG/types';

/**
 * 动画控制器
 * 负责接收战斗事件队列，按序播放动画，并管理 UI 锁定状态
 */
class AnimationController {
  private _isAnimating = ref(false);
  private _queue: BattleEvent[] = [];
  private _timeline: gsap.core.Timeline | null = null;

  // DOM 元素引用映射 (id -> HTMLElement)
  private _elementRefs: Map<string, HTMLElement> = new Map();

  constructor() {
    // 初始化
  }

  /**
   * 获取动画状态 (只读)
   */
  public get isAnimating() {
    return readonly(this._isAnimating);
  }

  /**
   * 注册 DOM 元素引用
   */
  public registerElement(id: string, element: HTMLElement) {
    this._elementRefs.set(id, element);
  }

  /**
   * 移除 DOM 元素引用
   */
  public unregisterElement(id: string) {
    this._elementRefs.delete(id);
  }

  /**
   * 将事件加入队列并开始播放
   */
  public async enqueue(events: BattleEvent[]) {
    if (events.length === 0) return;

    this._queue.push(...events);

    if (!this._isAnimating.value) {
      this._isAnimating.value = true;
      await this.processQueue();
      this._isAnimating.value = false;
    }
  }

  /**
   * 处理队列中的事件
   */
  private async processQueue() {
    // 创建新的 Timeline
    this._timeline = gsap.timeline({
      onComplete: () => {
        console.log('🎬 [Animation] 序列播放完成');
        this._timeline = null;
      },
    });

    while (this._queue.length > 0) {
      const event = this._queue.shift();
      if (!event) continue;

      console.log(`🎬 [Animation] 处理事件: ${event.type}`, event.data);

      // 根据事件类型构建动画步骤
      // 目前仅打印日志，后续在 Subtask 3 中实现具体视觉效果
      await this.playEventAnimation(event);
    }
  }

  /**
   * 播放单个事件的动画
   */
  private async playEventAnimation(event: BattleEvent): Promise<void> {
    const tl = gsap.timeline();
    // 将 timeline 挂载到实例以便 skip
    // 注意：这里是局部 timeline，processQueue 中的 _timeline 是主控
    // 实际应该将局部 tl 嵌套进主 _timeline，但由于 processQueue 是 await 逐个执行，
    // 这里直接 await tl 即可。

    switch (event.type) {
      case BattleEventType.COST_DEDUCT:
        await this.animateCostDeduct(event.data);
        break;
      case BattleEventType.GAIN_SCORE:
        await this.animateGainScore(event.data);
        break;
      case BattleEventType.CARD_MOVE:
        await this.animateCardMove(event.data);
        break;
      case BattleEventType.ADD_BUFF:
        await this.animateAddBuff(event.data);
        break;
      case BattleEventType.HOOK_TRIGGER:
        await this.animateHookTrigger(event.data);
        break;
      case BattleEventType.DRAW_CARD:
        await this.animateDrawCard(event.data);
        break;
      case BattleEventType.LOGIC_CHAIN_START:
        // 逻辑链开始，可以加个微小的视觉提示，或者忽略
        break;
      case BattleEventType.CREATE_CARD:
        await this.animateCreateCard(event.data);
        break;
      case BattleEventType.HAND_ENTER:
        await this.animateHandEnter(event.data);
        break;
      case BattleEventType.TURN_START_DRAW:
        await this.animateTurnStartDraw(event.data);
        break;
      case BattleEventType.TURN_END_DISCARD:
        await this.animateTurnEndDiscard(event.data);
        break;
      case BattleEventType.MODIFY_STAMINA:
        await this.animateModifyStamina(event.data);
        break;
      case BattleEventType.HAND_REFRESH:
        await this.animateHandRefresh(event.data);
        break;
      case BattleEventType.CARD_PULL:
        await this.animateCardPull(event.data);
        break;
      case BattleEventType.MODIFY_GENKI:
        await this.animateModifyGenki(event.data);
        break;
      case BattleEventType.REMOVE_BUFF:
        await this.animateRemoveBuff(event.data);
        break;
      case BattleEventType.ADD_TAG:
        await this.animateAddTag(event.data);
        break;
      case BattleEventType.REMOVE_TAG:
        await this.animateRemoveTag(event.data);
        break;
      case BattleEventType.BUFF_MULTIPLIER_SET:
      case BattleEventType.BUFF_TURNS_ENSURE:
      case BattleEventType.BUFF_EFFECT_MULTIPLIER_SET:
      case BattleEventType.ALL_CARDS_MODIFIED:
        // 简单日志反馈，暂无复杂视觉
        console.log(`🎬 [Animation] ${event.type}`, event.data);
        break;
      default:
        // 未实现的事件类型，默认等待一小段时间
        await new Promise(r => setTimeout(r, 50));
        break;
    }
  }

  // ==================== 具体动画实现 ====================

  private async animateCostDeduct(data: { genki: number; stamina: number; total: number }) {
    const hpBar = this._elementRefs.get('hp-bar');
    const genkiBar = this._elementRefs.get('genki-bar');

    if (data.genki > 0 && genkiBar) {
      // 元气扣除动画：闪烁红色 -> 缩短
      await gsap.to(genkiBar, {
        backgroundColor: '#ff4d4d',
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.set(genkiBar, { backgroundColor: '' }); // 恢复原色 (由 CSS 控制)
        },
      });
      // 宽度变化由 Vue 响应式数据驱动，这里主要做视觉反馈
      // 如果需要更平滑，可以拦截 Vue 数据更新，但这里保持简单
    }

    if (data.stamina > 0 && hpBar) {
      // 体力扣除动画：震动 -> 变色
      await gsap.to(hpBar, {
        x: 5,
        duration: 0.05,
        yoyo: true,
        repeat: 3,
      });
    }
  }

  private async animateGainScore(data: { value: number; base: number; multiplier: number }) {
    const scoreEl = this._elementRefs.get('score-value');
    if (!scoreEl) return;

    // 数字跳动 + 放大
    await gsap.fromTo(
      scoreEl,
      { scale: 1.5, color: '#ffeb3b' },
      { scale: 1, color: 'white', duration: 0.5, ease: 'back.out(1.7)' },
    );
  }

  private async animateCardMove(data: { card_id: string; from_zone: string; to_zone: string }) {
    const cardEl = this._elementRefs.get(`card-${data.card_id}`);

    if (data.to_zone === 'hand' && data.from_zone === 'deck') {
      // 抽牌动画：从右侧飞入
      if (cardEl) {
        await gsap.from(cardEl, {
          x: 100,
          opacity: 0,
          rotation: 10,
          duration: 0.4,
          ease: 'power2.out',
        });
      }
    } else if (data.from_zone === 'hand') {
      // 打出/弃牌动画
      if (cardEl) {
        if (data.to_zone === 'discard' || data.to_zone === 'removed') {
          // 弃牌：飞向右下角 (假设 deck-btn 位置)
          const target = this._elementRefs.get('deck-btn');
          const targetRect = target?.getBoundingClientRect();
          const startRect = cardEl.getBoundingClientRect();

          if (targetRect) {
            const x = targetRect.left - startRect.left;
            const y = targetRect.top - startRect.top;

            // 增强效果：放大 -> 移动 -> 消失
            const tl = gsap.timeline();
            await tl
              .to(cardEl, { scale: 1.2, duration: 0.2, ease: 'power1.out' }) // 放大
              .to(cardEl, {
                x: x,
                y: y,
                scale: 0.1,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.in',
              });
          } else {
            // 备用：直接淡出
            await gsap.to(cardEl, {
              y: -100,
              opacity: 0,
              duration: 0.3,
            });
          }
        }
      }
    }
  }

  private async animateAddBuff(data: { buff_id: string; stacks: number }) {
    const buffArea = this._elementRefs.get('buff-area');
    if (buffArea) {
      // 整个 Buff 区闪烁一下
      await gsap.fromTo(buffArea, { filter: 'brightness(2)' }, { filter: 'brightness(1)', duration: 0.3 });
    }
  }

  private async animateHookTrigger(data: { trigger: string; count: number }) {
    // Hook 触发：全屏轻微闪光
    console.log('⚡ Hook Triggered:', data.trigger);

    if (data.trigger === 'LESSON_START') {
      await this.animateBanner('Lesson Start');
      return;
    }

    const app = document.getElementById('app');
    if (app) {
      await gsap.fromTo(
        app,
        { boxShadow: 'inset 0 0 0 0 rgba(255, 255, 255, 0)' },
        {
          boxShadow: 'inset 0 0 50px 10px rgba(255, 255, 255, 0.3)',
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
        },
      );
    }
  }

  private async animateDrawCard(data: { count: number; drawn_card_ids: string[] }) {
    // 抽牌音效 placeholder
    console.log('🎴 [Animation] Draw Card:', data.count);
    // 实际的卡牌移动由 CARD_MOVE 事件处理
  }

  private async animateCreateCard(data: {
    card_id: string;
    zone: string;
    count: number;
    position: string;
    instance_ids?: string[];
  }) {
    console.log('✨ [Animation] Create Card:', data);

    if (data.zone === 'hand' && data.instance_ids) {
      // 等待 Vue 渲染新卡牌
      await new Promise(r => setTimeout(r, 100));

      for (const id of data.instance_ids) {
        const cardEl = this._elementRefs.get(`card-${id}`);
        if (cardEl) {
          // 从屏幕中心生成并飞入
          await gsap.from(cardEl, {
            scale: 0,
            opacity: 0,
            y: -200, // 从上方掉落
            duration: 0.5,
            ease: 'back.out(1.7)',
            clearProps: 'all', // 动画结束后清除样式，避免影响交互
          });
        }
      }
    }
  }

  /**
   * 强制跳过当前动画 (预留)
   */
  public skip() {
    if (this._timeline) {
      this._timeline.progress(1); // 直接跳到结束
    }
    this._queue = []; // 清空队列
  }

  private async animateHandEnter(data: { card_ids: string[] }) {
    console.log('🎬 [Animation] Hand Enter:', data.card_ids.length);

    // 课程开始 Banner (仅在第一回合或特定标记时？这里简单处理，每次 HandEnter 都检查是否需要 Banner)
    // 但 HandEnter 也可能发生在回合中刷新手牌。
    // 更好的方式是依靠事件流。如果是初始事件流，通常伴随 Lesson Start。
    // 这里我们假设 HandEnter 主要用于开局或刷新。
    // 为了简单起见，我们在 Turn 1 且是 HandEnter 时显示 Lesson Start?
    // 或者直接由 ProduceHostCore 发送专门的 Banner 事件。
    // 鉴于目前没有专门事件，我们可以在这里加一个简单的 "Lesson Start" Banner，如果它是初始事件的一部分。
    // 但 AnimationController 不知道上下文。
    // 妥协方案：在 animateTurnStartDraw 中显示 Turn Start。
    // 在 HandEnter 中，如果是首回合且之前没有 Turn Start，显示 Lesson Start？
    // 让我们先实现 animateBanner。

    // 等待 Vue 渲染
    await new Promise(r => setTimeout(r, 100));

    const tl = gsap.timeline();
    data.card_ids.forEach((id, index) => {
      const cardEl = this._elementRefs.get(`card-${id}`);
      if (cardEl) {
        tl.from(
          cardEl,
          {
            y: 100,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out(1.2)',
          },
          index * 0.1, // 错开播放
        );
      }
    });
    await tl;
  }

  private async animateTurnStartDraw(data: { count: number; drawn_card_ids: string[] }) {
    console.log('🎬 [Animation] Turn Start Draw:', data.count);

    // 显示 Turn Start Banner
    await this.animateBanner('Turn Start');

    // 回合开始抽牌，通常伴随 "Turn Start" UI，这里仅处理卡牌动画
    // 实际卡牌移动由 CARD_MOVE 处理，这里可以加个音效或全局提示
    await new Promise(r => setTimeout(r, 200));
  }

  // ... (animateTurnEndDiscard, animateModifyStamina, etc.)

  // ==================== 新增 Banner 动画 ====================

  /**
   * 显示流程 Banner
   */
  public async animateBanner(text: string) {
    console.log(`🎬 [Animation] Banner: ${text}`);

    // 创建临时 Banner 元素
    const banner = document.createElement('div');
    banner.className = 'battle-banner';
    banner.textContent = text;
    Object.assign(banner.style, {
      position: 'fixed',
      top: '40%',
      left: '0',
      width: '100%',
      textAlign: 'center',
      fontSize: '48px',
      fontWeight: 'bold',
      color: 'white',
      textShadow: '0 0 10px rgba(0,0,0,0.8)',
      background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.6), transparent)',
      padding: '20px 0',
      zIndex: '1000',
      pointerEvents: 'none',
      opacity: '0',
    });

    document.body.appendChild(banner);

    // 播放动画
    await gsap
      .timeline()
      .to(banner, { opacity: 1, duration: 0.3 })
      .to(banner, { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1 })
      .to(banner, { opacity: 0, duration: 0.3, delay: 0.8 })
      .call(() => {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      });
  }

  private async animateTurnEndDiscard(data: { count: number; discarded_card_ids: string[] }) {
    console.log('🎬 [Animation] Turn End Discard:', data.count);
    // 回合结束弃牌，卡牌飞向弃牌堆
    // 实际移动由 CARD_MOVE 处理，这里可以做一些批量效果
    // 例如：手牌区域整体变暗或下沉
    const handArea = this._elementRefs.get('hand-area'); // 假设有这个 ref
    if (handArea) {
      await gsap.to(handArea, { opacity: 0.5, duration: 0.2, yoyo: true, repeat: 1 });
    }
  }

  private async animateModifyStamina(data: { delta: number; new_value: number }) {
    const hpBar = this._elementRefs.get('hp-bar');
    if (!hpBar) return;

    if (data.delta < 0) {
      // 消耗体力：震动 + 变红
      await gsap.to(hpBar, {
        x: 5,
        backgroundColor: '#ff4d4d',
        duration: 0.05,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          gsap.set(hpBar, { backgroundColor: '', x: 0 });
        },
      });
    } else {
      // 恢复体力：绿色闪光
      await gsap.fromTo(
        hpBar,
        { filter: 'brightness(1.5) sepia(1) hue-rotate(50deg)' }, // 模拟绿色高亮
        { filter: 'none', duration: 0.5 },
      );
    }
  }

  private async animateHandRefresh(data: { discarded_card_ids: string[]; drawn_card_ids: string[] }) {
    console.log('🎬 [Animation] Hand Refresh:', data.drawn_card_ids.length);
    // 刷新手牌：先全部弃掉，再抽
    // 实际逻辑由 TURN_END_DISCARD + TURN_START_DRAW 组合，或者单独的事件序列
    // 如果是单独事件，这里可以做一个快速的旋转切换效果
    const handArea = this._elementRefs.get('hand-area');
    if (handArea) {
      await gsap.to(handArea, { rotationY: 360, duration: 0.5, ease: 'power2.inOut' });
    }
  }

  private async animateCardPull(data: { card_id: string; from_zone: string; to_zone: string }) {
    console.log('🎬 [Animation] Card Pull:', data);
    // 从牌堆/弃牌堆拉回手牌
    // 类似 Draw Card，但可能有特定的轨迹（如从弃牌堆飞回）
    const cardEl = this._elementRefs.get(`card-${data.card_id}`);
    if (cardEl) {
      // 假设弃牌堆在右下，手牌在下方
      // 这里简单做一个从右侧飞入的效果，区别于普通抽牌的旋转
      await gsap.from(cardEl, {
        x: 200,
        y: 100,
        opacity: 0,
        scale: 0.5,
        duration: 0.6,
        ease: 'elastic.out(1, 0.8)',
      });
    }
  }

  private async animateModifyGenki(data: { delta: number; new_value: number }) {
    const genkiBar = this._elementRefs.get('genki-bar');
    if (!genkiBar) return;

    if (data.delta > 0) {
      // 增加元气：蓝色闪光
      await gsap.fromTo(genkiBar, { filter: 'brightness(1.5) hue-rotate(180deg)' }, { filter: 'none', duration: 0.5 });
    } else {
      // 减少元气：红色闪烁
      await gsap.to(genkiBar, {
        backgroundColor: '#ff4d4d',
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.set(genkiBar, { backgroundColor: '' });
        },
      });
    }
  }

  private async animateRemoveBuff(data: { buff_id: string; stacks: number }) {
    console.log('🎬 [Animation] Remove Buff:', data.buff_id);
    // 移除 Buff 动画：Buff 图标淡出 (如果能获取到具体 DOM)
    // 这里简单让 Buff 区域震动一下
    const buffArea = this._elementRefs.get('buff-area');
    if (buffArea) {
      await gsap.to(buffArea, { x: 5, duration: 0.05, yoyo: true, repeat: 3 });
    }
  }

  private async animateAddTag(data: { tag: string; turns?: number }) {
    console.log('🎬 [Animation] Add Tag:', data.tag);
    // Tag 添加动画：右侧状态栏闪烁
    const rightStatus = document.querySelector('.right-status');
    if (rightStatus) {
      await gsap.fromTo(
        rightStatus,
        { filter: 'drop-shadow(0 0 0 rgba(255, 215, 0, 0))' },
        {
          filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))',
          duration: 0.3,
          yoyo: true,
          repeat: 1,
        },
      );
    }
  }

  private async animateRemoveTag(data: { tag: string }) {
    console.log('🎬 [Animation] Remove Tag:', data.tag);
    // Tag 移除动画：右侧状态栏灰色闪烁
    const rightStatus = document.querySelector('.right-status');
    if (rightStatus) {
      await gsap.fromTo(
        rightStatus,
        { filter: 'grayscale(0)' },
        {
          filter: 'grayscale(1)',
          duration: 0.2,
          yoyo: true,
          repeat: 1,
        },
      );
    }
  }
}

// 导出单例
export const animationController = new AnimationController();
