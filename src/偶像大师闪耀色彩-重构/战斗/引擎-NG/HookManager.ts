/**
 * HookManager - 生命周期钩子管理器
 * 管理战斗中的持续触发机制
 */

import { RuleEvaluator } from './RuleEvaluator';
import type { AtomicAction, BattleContext, HookDef, HookType } from './types';

// ==================== Hook 实例 ====================

interface HookInstance extends HookDef {
  remaining_turns: number; // 剩余触发回合
  trigger_count: number; // 已触发次数
  is_active: boolean; // 是否激活
  play_turn: number; // EV3: Hook 注册时的回合号
}

// ==================== HookManager 类 ====================

export class HookManager {
  private hooks: Map<string, HookInstance> = new Map();
  private ruleEvaluator: RuleEvaluator;

  constructor(ruleEvaluator?: RuleEvaluator) {
    this.ruleEvaluator = ruleEvaluator ?? new RuleEvaluator();
  }

  // ==================== 注册与注销 ====================

  /**
   * 注册一个新的 Hook
   * @param hookDef Hook 定义
   * @param currentTurn 当前回合号（EV3: 用于 play_turn 元数据）
   */
  public register(hookDef: HookDef, currentTurn: number = 1): void {
    // 如果同 ID 已存在，覆盖
    if (this.hooks.has(hookDef.id)) {
      console.log(`⚠️ [HookManager] 覆盖已存在的Hook: ${hookDef.id}`);
    }

    const instance: HookInstance = {
      ...hookDef,
      remaining_turns: hookDef.duration_turns ?? -1, // -1 表示永久
      trigger_count: 0,
      is_active: true,
      play_turn: currentTurn, // EV3: 记录注册时的回合号
    };

    this.hooks.set(hookDef.id, instance);
    console.log(`🪝 [HookManager] 注册Hook: ${hookDef.id} (${hookDef.trigger}) [play_turn=${currentTurn}]`);
  }

  /**
   * 注销指定 Hook
   */
  public unregister(hookId: string): boolean {
    if (this.hooks.has(hookId)) {
      this.hooks.delete(hookId);
      console.log(`🗑️ [HookManager] 注销Hook: ${hookId}`);
      return true;
    }
    return false;
  }

  /**
   * 暂停指定 Hook
   */
  public pause(hookId: string): void {
    const hook = this.hooks.get(hookId);
    if (hook) {
      hook.is_active = false;
      console.log(`⏸️ [HookManager] 暂停Hook: ${hookId}`);
    }
  }

  /**
   * 恢复指定 Hook
   */
  public resume(hookId: string): void {
    const hook = this.hooks.get(hookId);
    if (hook) {
      hook.is_active = true;
      console.log(`▶️ [HookManager] 恢复Hook: ${hookId}`);
    }
  }

  // ==================== 触发 ====================

  /**
   * 触发指定类型的所有 Hook
   * @returns 需要执行的动作列表
   */
  public trigger(hookType: HookType, context: BattleContext): AtomicAction[] {
    const actions: AtomicAction[] = [];

    for (const [id, hook] of this.hooks) {
      // 检查是否匹配触发点
      if (hook.trigger !== hookType) continue;

      // 检查是否激活
      if (!hook.is_active) continue;

      // 检查是否已过期
      if (hook.remaining_turns === 0) continue;

      // 检查触发次数限制
      if (hook.max_triggers && hook.trigger_count >= hook.max_triggers) {
        console.log(`🛑 [HookManager] Hook已达触发上限: ${id}`);
        continue;
      }

      // 检查条件
      if (hook.condition) {
        // EV3: 注入 play_turn 到上下文
        const contextWithPlayTurn: BattleContext = {
          ...context,
          play_turn: hook.play_turn,
        };
        const conditionMet = this.ruleEvaluator.evaluateCondition(hook.condition, contextWithPlayTurn);
        if (!conditionMet) {
          console.log(`❌ [HookManager] Hook条件不满足: ${id}`);
          continue;
        }
      }

      // 条件满足，收集动作
      console.log(`✅ [HookManager] 触发Hook: ${id}`);
      actions.push(...hook.actions);
      hook.trigger_count++;
    }

    return actions;
  }

  // ==================== 回合管理 ====================

  /**
   * 回合结束时更新 Hook 状态
   */
  public onTurnEnd(): void {
    const expiredHooks: string[] = [];

    for (const [id, hook] of this.hooks) {
      if (hook.remaining_turns > 0) {
        hook.remaining_turns--;
        if (hook.remaining_turns === 0) {
          expiredHooks.push(id);
        }
      }
    }

    // 移除过期的 Hook
    for (const id of expiredHooks) {
      this.hooks.delete(id);
      console.log(`⏰ [HookManager] Hook过期: ${id}`);
    }
  }

  // ==================== 查询 ====================

  /**
   * 获取所有活跃的 Hook
   */
  public getActiveHooks(): HookInstance[] {
    return Array.from(this.hooks.values()).filter(h => h.is_active);
  }

  /**
   * 获取指定触发点的 Hook 数量
   */
  public getHookCountByType(hookType: HookType): number {
    return Array.from(this.hooks.values()).filter(h => h.trigger === hookType && h.is_active).length;
  }

  /**
   * 检查是否有指定 ID 的 Hook
   */
  public hasHook(hookId: string): boolean {
    return this.hooks.has(hookId);
  }

  // ==================== T8: 固有能力支持 ====================

  /**
   * T8: 为卡牌注册固有能力（战斗开始时调用）
   * @param card 卡牌实例
   */
  public registerIntrinsicHooks(card: { id: string; engine_data?: { intrinsic_hooks?: HookDef[] } }): void {
    const hooks = card.engine_data?.intrinsic_hooks ?? [];
    if (hooks.length === 0) return;

    for (const hookDef of hooks) {
      const intrinsicId = `${card.id}::intrinsic::${hookDef.id}`;
      const instance: HookInstance = {
        ...hookDef,
        id: intrinsicId,
        remaining_turns: -1, // 永久
        trigger_count: 0,
        is_active: true,
        play_turn: 0, // 固有能力从战斗开始就存在
        _cardId: card.id, // 绑定卡牌 ID 用于清理
      } as HookInstance & { _cardId: string };

      this.hooks.set(intrinsicId, instance);
      console.log(`🔮 [HookManager] 注册固有能力: ${intrinsicId}`);
    }
  }

  /**
   * T8: 注销指定卡牌的所有固有能力 Hook
   * @param cardId 卡牌 ID
   */
  public unregisterCardHooks(cardId: string): void {
    const toRemove: string[] = [];
    for (const [hookId, hook] of this.hooks) {
      // 检查 Hook ID 是否属于该卡牌
      if (hookId.startsWith(`${cardId}::intrinsic::`)) {
        toRemove.push(hookId);
      }
      // 检查 _cardId 属性（备用）
      if ((hook as any)._cardId === cardId) {
        toRemove.push(hookId);
      }
    }

    for (const hookId of toRemove) {
      this.hooks.delete(hookId);
      console.log(`☠️ [HookManager] 清理固有能力: ${hookId}`);
    }
  }

  // ==================== 重置 ====================

  /**
   * 重置所有 Hook
   */
  public reset(): void {
    this.hooks.clear();
    console.log('🔄 [HookManager] 所有Hook已重置');
  }

  // ==================== 调试 ====================

  /**
   * 打印当前所有 Hook 状态
   */
  public debugPrint(): void {
    console.log('📋 [HookManager] 当前Hook列表:');
    for (const [id, hook] of this.hooks) {
      console.log(
        `  - ${id}: ${hook.trigger}, active=${hook.is_active}, ` +
          `remaining=${hook.remaining_turns}, triggered=${hook.trigger_count}`,
      );
    }
  }
}

// 导出单例
export const hookManager = new HookManager();
