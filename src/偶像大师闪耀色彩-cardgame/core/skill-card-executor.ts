/**
 * 技能卡效果执行引擎
 *
 * 负责解析和执行技能卡的所有效果
 */

import { BuffPresets } from '../presets/buff-presets';
import type { BattleState, EffectCondition, EffectExecutionResult, SkillCard, SkillCardEffect } from '../types';
import { EventBus, GameEvents } from '../utils/event-bus';
import { AttributeManager } from './attribute-manager';
import { BuffManager } from './buff-manager';
import { ResourceManager } from './resource-manager';

export class SkillCardExecutor {
  private state: BattleState;
  private attributeManager: AttributeManager;

  constructor(state: BattleState) {
    this.state = state;
    this.attributeManager = new AttributeManager(state);
  }

  /**
   * 执行技能卡
   *
   * @param card 技能卡
   * @returns 执行结果
   */
  async executeCard(card: SkillCard): Promise<EffectExecutionResult> {
    const result: EffectExecutionResult = {
      success: false,
      changes: {},
    };

    try {
      // 1. 检查是否可用
      if (!this.canUseCard(card)) {
        result.message = '无法使用该卡牌';
        return result;
      }

      // 2. 消耗资源（元气/体力）
      if (!this.consumeCardCost(card)) {
        result.message = '资源不足';
        return result;
      }

      // 3. 检查是否有"下一张卡效果×2" Buff
      const hasDoubleEffect = BuffManager.hasBuff(this.state, 'double_effect');
      const effectMultiplier = hasDoubleEffect ? 2 : 1;

      // 4. 执行所有效果
      for (let i = 0; i < effectMultiplier; i++) {
        for (const effect of card.effects) {
          const effectResult = await this.executeEffect(effect, card);
          this.mergeResults(result, effectResult);
        }
      }

      // 5. 消耗"下一张卡效果×2" Buff
      if (hasDoubleEffect) {
        BuffManager.consumeBuff(this.state, 'double_effect');
      }

      // 6. 触发卡牌使用事件
      EventBus.emit(GameEvents.CARD_USED, {
        card,
        result,
      });

      // 7. 触发所有Buff的"使用卡牌时"效果
      for (const buff of this.state.buffs.values()) {
        BuffManager.triggerBuffEffects(this.state, buff, 'card_used', { card });
      }

      result.success = true;
      return result;
    } catch (error) {
      console.error('[SkillCardExecutor] Error executing card:', error);
      result.message = `执行失败: ${error}`;
      return result;
    }
  }

  /**
   * 执行单个效果
   *
   * @param effect 效果数据
   * @param card 技能卡（用于上下文）
   * @returns 执行结果
   */
  private async executeEffect(effect: SkillCardEffect, card: SkillCard): Promise<EffectExecutionResult> {
    const result: EffectExecutionResult = {
      success: true,
      changes: {},
    };

    try {
      switch (effect.type) {
        case 'score_multiplier':
          this.executeScoreMultiplier(effect, result);
          break;

        case 'gain_stamina':
          this.executeGainStamina(effect, result);
          break;

        case 'gain_genki':
          this.executeGainGenki(effect, result);
          break;

        case 'add_buff':
          this.executeAddBuff(effect, result);
          break;

        case 'draw_cards':
          this.executeDrawCards(effect, result);
          break;

        case 'extra_card_use':
          this.executeExtraCardUse(effect, result);
          break;

        case 'extra_turn':
          this.executeExtraTurn(effect, result);
          break;

        case 'gain_all_power':
          this.executeGainAllPower(effect, result);
          break;

        case 'gain_heat':
          this.executeGainHeat(effect, result);
          break;

        case 'change_anomaly_state':
          this.executeChangeAnomalyState(effect, result);
          break;

        case 'lock_pointer':
          this.executeLockPointer(effect, result);
          break;

        case 'consume_stamina':
          this.executeConsumeStamina(effect, result);
          break;

        case 'consume_concentration':
          this.executeConsumeConcentration(effect, result);
          break;

        case 'consume_motivation':
          this.executeConsumeMotivation(effect, result);
          break;

        case 'consume_all_power':
          this.executeConsumeAllPower(effect, result);
          break;

        case 'consume_buff':
          this.executeConsumeBuff(effect, result);
          break;

        case 'amplify_score':
          this.executeAmplifyScore(effect, result);
          break;

        case 'amplify_good_impression':
          this.executeAmplifyGoodImpression(effect, result);
          break;

        case 'conditional_effect':
          await this.executeConditionalEffect(effect, card, result);
          break;

        case 'chain_effect':
          await this.executeChainEffect(effect, card, result);
          break;

        case 'special_effect':
          this.executeSpecialEffect(effect, result);
          break;

        default:
          console.warn(`[SkillCardExecutor] Unknown effect type: ${effect.type}`);
      }
    } catch (error) {
      console.error(`[SkillCardExecutor] Error executing effect ${effect.type}:`, error);
      result.success = false;
      result.message = `效果执行失败: ${error}`;
    }

    return result;
  }

  // ========== 效果执行方法 ==========

  /**
   * 得分乘区（根据V/D/V属性）
   */
  private executeScoreMultiplier(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const { attribute, multiplier } = effect.metadata as any;
    const attrValue = this.state.stats[attribute as 'vocal' | 'dance' | 'visual'];
    const score = Math.floor(attrValue * multiplier);

    this.state.score.current += score;
    result.changes!.score = (result.changes!.score || 0) + score;

    EventBus.emit(GameEvents.SCORE_CHANGED, {
      delta: score,
      source: 'skill_card',
      attribute,
    });
  }

  /**
   * 获得体力
   */
  private executeGainStamina(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 0;
    const recovered = ResourceManager.recoverStamina(this.state, amount);
    result.changes!.stamina = (result.changes!.stamina || 0) + recovered;
  }

  /**
   * 获得元气
   */
  private executeGainGenki(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 0;
    const gained = ResourceManager.gainGenki(this.state, amount);
    result.changes!.genki = (result.changes!.genki || 0) + gained;
  }

  /**
   * 添加Buff
   */
  private executeAddBuff(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const { type, stacks, duration } = effect.metadata as any;

    // 从预设库创建Buff
    let buff = null;
    if (type in BuffPresets) {
      buff = (BuffPresets as any)[type](stacks || duration);
    }

    if (buff) {
      BuffManager.addBuff(this.state, buff);
      result.changes!.buffsAdded = result.changes!.buffsAdded || [];
      result.changes!.buffsAdded.push({ type, stacks: buff.stacks });
    }
  }

  /**
   * 抽牌
   */
  private executeDrawCards(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 1;
    let drawn = 0;

    for (let i = 0; i < amount; i++) {
      if (this.state.hand.length >= 5) break; // 手牌上限5张
      if (this.state.deck.length === 0) break; // 牌堆为空

      const card = this.state.deck.shift()!;
      this.state.hand.push(card);
      drawn++;

      EventBus.emit(GameEvents.CARD_DRAWN, { card });
    }

    result.changes!.cardsDrawn = drawn;
  }

  /**
   * 额外技能卡使用次数
   */
  private executeExtraCardUse(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 1;
    this.state.turnState.maxCardsPerTurn += amount;
  }

  /**
   * 额外回合
   */
  private executeExtraTurn(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 1;
    this.state.maxTurns += amount;
  }

  /**
   * 获得全力值
   */
  private executeGainAllPower(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 1;
    this.attributeManager.add('allPower', amount);
  }

  /**
   * 获得热意值
   */
  private executeGainHeat(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 1;
    this.attributeManager.add('heat', amount);
  }

  /**
   * 切换非凡状态
   */
  private executeChangeAnomalyState(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const { newState, level } = effect.metadata as any;
    this.attributeManager.switchAnomalyState(newState, level || 1);
  }

  /**
   * 锁定指针
   */
  private executeLockPointer(effect: SkillCardEffect, result: EffectExecutionResult): void {
    this.attributeManager.lockPointer();
  }

  /**
   * 消耗体力
   */
  private executeConsumeStamina(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 0;
    const success = ResourceManager.consumeStamina(this.state, amount);
    if (!success) {
      result.success = false;
      result.message = '体力不足';
    }
  }

  /**
   * 消耗专注
   */
  private executeConsumeConcentration(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 0;
    const success = this.attributeManager.consume('concentration', amount);
    if (!success) {
      result.success = false;
      result.message = '专注不足';
    }
  }

  /**
   * 消耗干劲
   */
  private executeConsumeMotivation(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 0;
    const success = this.attributeManager.consume('motivation', amount);
    if (!success) {
      result.success = false;
      result.message = '干劲不足';
    }
  }

  /**
   * 消耗全力值
   */
  private executeConsumeAllPower(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const amount = effect.value || 0;
    const success = this.attributeManager.consume('allPower', amount);
    if (!success) {
      result.success = false;
      result.message = '全力值不足';
    }
  }

  /**
   * 消耗Buff
   */
  private executeConsumeBuff(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const { buffType, amount } = effect.metadata as any;
    let consumed = 0;

    for (const buff of this.state.buffs.values()) {
      if (buff.type === buffType) {
        const success = BuffManager.consumeBuff(this.state, buff.id, amount || 1);
        if (success) consumed++;
      }
    }

    result.changes!.buffsRemoved = result.changes!.buffsRemoved || [];
    result.changes!.buffsRemoved.push({ type: buffType, stacks: consumed });
  }

  /**
   * 放大得分
   */
  private executeAmplifyScore(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const multiplier = effect.value || 1;
    const oldScore = this.state.score.current;
    this.state.score.current = Math.floor(oldScore * multiplier);
    const delta = this.state.score.current - oldScore;

    result.changes!.score = (result.changes!.score || 0) + delta;

    EventBus.emit(GameEvents.SCORE_CHANGED, {
      delta,
      source: 'amplify_score',
    });
  }

  /**
   * 放大好印象
   */
  private executeAmplifyGoodImpression(effect: SkillCardEffect, result: EffectExecutionResult): void {
    const multiplier = effect.value || 2;

    for (const buff of this.state.buffs.values()) {
      if (buff.type === 'good_impression') {
        buff.stacks = Math.floor(buff.stacks * multiplier);
        EventBus.emit(GameEvents.BUFF_UPDATED, { buff });
      }
    }
  }

  /**
   * 条件效果
   */
  private async executeConditionalEffect(
    effect: SkillCardEffect,
    card: SkillCard,
    result: EffectExecutionResult,
  ): Promise<void> {
    const { condition, trueEffect, falseEffect } = effect.metadata as any;

    if (this.checkCondition(condition)) {
      // 条件满足，执行trueEffect
      const effectResult = await this.executeEffect(trueEffect, card);
      this.mergeResults(result, effectResult);
    } else if (falseEffect) {
      // 条件不满足，执行falseEffect
      const effectResult = await this.executeEffect(falseEffect, card);
      this.mergeResults(result, effectResult);
    }
  }

  /**
   * 链式效果
   */
  private async executeChainEffect(
    effect: SkillCardEffect,
    card: SkillCard,
    result: EffectExecutionResult,
  ): Promise<void> {
    const { effects } = effect.metadata as any;

    for (const chainEffect of effects) {
      const effectResult = await this.executeEffect(chainEffect, card);
      this.mergeResults(result, effectResult);
    }
  }

  /**
   * 特殊效果（占位符，用于未来扩展）
   */
  private executeSpecialEffect(effect: SkillCardEffect, result: EffectExecutionResult): void {
    console.log('[SkillCardExecutor] Special effect:', effect.metadata);
  }

  // ========== 辅助方法 ==========

  /**
   * 检查是否可以使用卡牌
   */
  private canUseCard(card: SkillCard): boolean {
    // 检查本回合使用次数
    if (this.state.turnState.cardsUsed >= this.state.turnState.maxCardsPerTurn) {
      return false;
    }

    // 检查资源
    const genkiCost = Math.abs(card.cost); // 元气消耗（负数转正）
    const staminaCost = card.costType === 'stamina_only' ? Math.abs(card.cost) : 0;

    return ResourceManager.hasEnoughResources(this.state, staminaCost, genkiCost);
  }

  /**
   * 消耗卡牌Cost
   */
  private consumeCardCost(card: SkillCard): boolean {
    const genkiCost = Math.abs(card.cost); // 元气消耗（负数转正）
    const staminaCost = card.costType === 'stamina_only' ? Math.abs(card.cost) : 0;

    // 消耗元气
    if (genkiCost > 0) {
      const success = ResourceManager.consumeGenki(this.state, genkiCost);
      if (!success) return false;
    }

    // 消耗体力
    if (staminaCost > 0) {
      const success = ResourceManager.consumeStamina(this.state, staminaCost);
      if (!success) return false;
    }

    return true;
  }

  /**
   * 检查条件
   */
  private checkCondition(condition: EffectCondition): boolean {
    switch (condition.type) {
      case 'has_buff':
        return BuffManager.hasBuff(this.state, condition.buffType!);

      case 'has_no_buff':
        return !BuffManager.hasBuff(this.state, condition.buffType!);

      case 'stamina_above':
        return this.state.stamina > (condition.value || 0);

      case 'stamina_below':
        return this.state.stamina < (condition.value || 0);

      case 'genki_above':
        return this.state.genki > (condition.value || 0);

      case 'genki_below':
        return this.state.genki < (condition.value || 0);

      case 'concentration_above':
        return this.attributeManager.get('concentration') > (condition.value || 0);

      case 'motivation_above':
        return this.attributeManager.get('motivation') > (condition.value || 0);

      case 'all_power_full':
        return this.attributeManager.get('allPower') >= 10;

      case 'anomaly_state_is':
        return this.state.attributes.anomalyState === condition.value;

      case 'cards_in_hand_above':
        return this.state.hand.length > (condition.value || 0);

      case 'cards_in_discard_above':
        return this.state.discardPile.length > (condition.value || 0);

      case 'turn_number_above':
        return this.state.currentTurn > (condition.value || 0);

      case 'turn_number_below':
        return this.state.currentTurn < (condition.value || 0);

      default:
        console.warn(`[SkillCardExecutor] Unknown condition type: ${condition.type}`);
        return false;
    }
  }

  /**
   * 合并结果
   */
  private mergeResults(target: EffectExecutionResult, source: EffectExecutionResult): void {
    if (!source.success) {
      target.success = false;
      target.message = source.message;
      return;
    }

    const changes = target.changes!;
    const sourceChanges = source.changes || {};

    // 合并数值变化
    if (sourceChanges.score) changes.score = (changes.score || 0) + sourceChanges.score;
    if (sourceChanges.stamina) changes.stamina = (changes.stamina || 0) + sourceChanges.stamina;
    if (sourceChanges.genki) changes.genki = (changes.genki || 0) + sourceChanges.genki;
    if (sourceChanges.cardsDrawn) changes.cardsDrawn = (changes.cardsDrawn || 0) + sourceChanges.cardsDrawn;

    // 合并Buff变化
    if (sourceChanges.buffsAdded) {
      changes.buffsAdded = [...(changes.buffsAdded || []), ...sourceChanges.buffsAdded];
    }
    if (sourceChanges.buffsRemoved) {
      changes.buffsRemoved = [...(changes.buffsRemoved || []), ...sourceChanges.buffsRemoved];
    }
  }
}








