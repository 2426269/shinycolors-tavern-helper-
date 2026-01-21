/**
 * Legacy to V2 Adapter
 * 将旧格式 SkillCard 转换为 SkillCardV2（仅支持白名单动作）
 */

import { validateEngineData } from '../战斗/引擎-NG/engineDataSchema';
import type { SkillCard } from '../战斗/类型/技能卡类型';

// ==================== 白名单定义 ====================

/**
 * 白名单动作类型
 * 仅允许这些动作进行自动转换
 * P4: 扩展 7 个新动作（传说卡需要）
 */
const WHITELIST_ACTIONS = [
  // 原有 10 种
  'GAIN_SCORE',
  'MODIFY_GENKI',
  'MODIFY_STAMINA',
  'DRAW_CARD',
  'MODIFY_PLAY_LIMIT',
  'ADD_BUFF',
  'REMOVE_BUFF',
  'ADD_TAG',
  'REMOVE_TAG',
  'REGISTER_HOOK',
  // P4 新增 7 种（传说卡需要）
  'MOVE_CARD_TO_ZONE', // 移动卡到区域
  'PLAY_RANDOM_CARDS', // 随机打出满足条件的卡
  'PLAY_CARD_FROM_ZONE', // 从指定区域打出卡
  'MODIFY_BUFF_MULTIPLIER', // Buff 增益倍率
  'MODIFY_ALL_CARDS', // 批量修改卡属性
  'MODIFY_TURN_COUNT', // 回合数+/-
  'EXHAUST_CARD', // 消耗卡牌进入除外区
] as const;

/**
 * P3: 真正模糊词（无法量化，直接拒绝）
 */
const TRUE_FUZZY_WORDS = ['稀微', '大幅', '按比例', '概略', '概率'];

/**
 * P3: 条件触发词（尝试解析条件结构）
 * 这些词表示条件句，不应直接拒绝，而是尝试解析
 */
const CONDITIONAL_TRIGGERS = ['若', '当', '仅在'];

/**
 * P3: 旧模糊词列表（为兼容性保留，部分移入条件触发词）
 * @deprecated 使用 TRUE_FUZZY_WORDS + CONDITIONAL_TRIGGERS
 */
const FUZZY_WORDS = [...TRUE_FUZZY_WORDS, '直到'];

/**
 * 旧 Buff 别名映射
 */
const BUFF_ALIAS_MAP: Record<string, string> = {
  // 中文别名 -> StandardBuffId
  好调: 'GoodCondition',
  绝好调: 'ExcellentCondition',
  集中: 'Concentration',
  干劲: 'Motivation',
  好印象: 'GoodImpression',
  体力消耗减少: 'StaminaReduction',
  全力: 'AlloutState',
  温存: 'ConserveState',
  强气: 'ResoluteState',
  全力值: 'AllPower',
  热意: 'Heat',
  悠闲: 'LeisureState',
  体力消耗削减: 'StaminaCut',
  体力消耗增加: 'StaminaIncrease',
  得分加成: 'ScoreBonus',
  好印象加成: 'GoodImpressionBonus',
  // 日文别名
  好調: 'GoodCondition',
  絶好調: 'ExcellentCondition',
  やる気: 'Motivation',
};

/**
 * F1: 类型规范化映射（宽松匹配）
 * 支持多种变体写法，统一映射到 A/M
 */
const TYPE_NORMALIZE_MAP: Record<string, 'A' | 'M'> = {
  // 中文标准
  主动: 'A',
  精神: 'M',
  // 中文变体
  主动卡: 'A',
  精神卡: 'M',
  P技能: 'A',
  技能卡: 'A',
  'P-技能': 'A',
  P卡: 'A',
  M卡: 'M',
  // 英文标准
  A: 'A',
  M: 'M',
  // 英文变体
  Active: 'A',
  Mental: 'M',
  active: 'A',
  mental: 'M',
  Skill: 'A',
  skill: 'A',
  PSkill: 'A',
  'P-Skill': 'A',
};

// ==================== 类型定义 ====================

/**
 * 示例置信度等级
 */
export type ExampleConfidence = 'manual_gold' | 'high' | 'high_partial' | 'low_text_only';

/**
 * 转换覆盖参数
 */
export interface ConvertOverrides {
  plan?: 'sense' | 'logic' | 'anomaly';
  type?: 'A' | 'M';
  rarity?: 'R' | 'SR' | 'SSR' | 'UR';
}

/**
 * 带置信度的 SkillCardV2
 */
export interface SkillCardV2WithConfidence {
  example_confidence: ExampleConfidence;
  /** 示例来源稀有度（仅在示例上下文中使用，标注下限示例的原始稀有度） */
  example_source_rarity?: 'R' | 'SR' | 'SSR' | 'UR';
  id: string;
  rarity: string;
  type: 'A' | 'M';
  plan: string;
  /** P2: 保留原始 effectEntries（含 icon URL），用于展示层 */
  effectEntries?: EffectEntry[];
  /** P2: 强化后 effectEntries（可选） */
  effectEntriesEnhanced?: EffectEntry[];
  engine_data: {
    cost: { genki: number };
    logic_chain: any[];
    logic_chain_enhanced?: any[];
    constraints?: { exhaust_on_play?: boolean };
    /** P2: 无法转换为 logic_chain 的词条文本 */
    partial_effects?: string[];
  };
  display: {
    name: string;
    nameJP?: string;
    description: string;
    flavor?: string;
  };
  restrictions?: {
    is_unique?: boolean;
    uses_per_battle?: number;
  };
  flowRefs?: string[];
  mechanicRefs?: string[];
}

/** P2: 效果词条结构（从原卡保留） */
interface EffectEntry {
  icon?: string;
  effect: string;
  isConsumption?: boolean;
}

// ==================== 转换器 ====================

/**
 * Legacy to V2 Adapter
 * 仅处理简单效果，复杂效果返回 null
 */
export class LegacyToV2Adapter {
  private static hookIdCounter = 0;

  /**
   * P3: 检查效果文本是否包含真正模糊词（无法量化）
   */
  private static containsFuzzyWords(text: string): boolean {
    return TRUE_FUZZY_WORDS.some(word => text.includes(word));
  }

  /**
   * F1: 规范化类型字段（宽松匹配）
   * 支持多种变体写法，统一映射到 A/M
   */
  private static normalizeType(raw: string | undefined): 'A' | 'M' | null {
    if (!raw) return null;

    // 去除空格、trim
    const cleaned = raw.replace(/\s+/g, '').trim();

    // 直接匹配
    if (TYPE_NORMALIZE_MAP[cleaned]) {
      return TYPE_NORMALIZE_MAP[cleaned];
    }

    // 包含匹配（宽松）
    if (cleaned.includes('主动') || cleaned.includes('Active') || cleaned.includes('Skill') || cleaned.includes('P')) {
      return 'A';
    }
    if (cleaned.includes('精神') || cleaned.includes('Mental')) {
      return 'M';
    }

    console.log(`⚠️ [normalizeType] 无法识别类型: "${raw}"`);
    return null;
  }

  /**
   * P3: 检查效果文本是否包含条件触发词
   */
  private static containsConditionalTrigger(text: string): boolean {
    return CONDITIONAL_TRIGGERS.some(word => text.includes(word));
  }

  /**
   * 模糊词消歧：仅放行可安全解析的模式
   */
  private static isDisambiguatedFuzzy(text: string): boolean {
    // 放行时序性模式
    if (/此后每回合结束时/.test(text) || /(?:下回合|下一回合)/.test(text)) {
      return true;
    }
    // P3: 放行条件触发词（会尝试解析）
    if (this.containsConditionalTrigger(text)) {
      return true;
    }
    return false;
  }

  private static nextHookId(prefix: string): string {
    this.hookIdCounter += 1;
    return `${prefix}_${this.hookIdCounter}`;
  }

  private static buildHookAction(
    trigger: string,
    actions: any[],
    options: { name?: string; duration_turns?: number; max_triggers?: number; condition?: any; scope?: string } = {},
  ): any {
    return {
      action: 'REGISTER_HOOK',
      hook_def: {
        id: this.nextHookId('legacy_hook'),
        name: options.name,
        trigger,
        duration_turns: options.duration_turns,
        max_triggers: options.max_triggers,
        condition: options.condition,
        scope: options.scope, // P5: 成长效果绑定到卡牌
        actions,
      },
    };
  }

  /**
   * P3: 解析条件效果（若/当/仅在）
   * 尝试将条件句拆分为 { when, do } 结构
   * @returns 带 when 条件的 step 或 null
   */
  private static parseConditionalEffect(effectText: string): any | null {
    // 模式1: "若/当/仅在 XXX 不小于/大于/等于 N 时，YYY"
    const thresholdMatch = effectText.match(/(?:若|当|仅在)(.+?)(?:不小于|大于等于|>=|≥)(\d+)(?:时|下)?[，,]?\s*(.+)$/);
    if (thresholdMatch) {
      const buffName = thresholdMatch[1].trim();
      const threshold = parseInt(thresholdMatch[2], 10);
      const actionText = thresholdMatch[3].trim();

      const action = this.parseSimpleEffect(actionText, false);
      if (!action) return null;

      const buffId = BUFF_ALIAS_MAP[buffName];
      if (buffId) {
        return {
          when: { '>=': [{ var: `player.buffs.${buffId}` }, threshold] },
          do: Array.isArray(action) ? action : [action],
        };
      }
      return null;
    }

    // 模式2: "若/当/仅在 处于 XXX 状态时，YYY"
    const stateMatch = effectText.match(/(?:若|当|仅在)(?:处于|在)?(.+?)(?:状态|階段)(?:时|下)?[，,]?\s*(.+)$/);
    if (stateMatch) {
      const stateName = stateMatch[1].trim();
      const actionText = stateMatch[2].trim();

      const action = this.parseSimpleEffect(actionText, false);
      if (!action) return null;

      const buffId = BUFF_ALIAS_MAP[stateName];
      if (buffId) {
        return {
          when: { '>=': [{ var: `player.buffs.${buffId}` }, 1] },
          do: Array.isArray(action) ? action : [action],
        };
      }
      return null;
    }

    // 模式3: "若/当/仅在 XXX 时，可使用" (使用条件 → constraint)
    // T-P5-1: 增强 - 解析具体状态名并返回 require_state
    const constraintMatch = effectText.match(/(?:若|当|仅在)?(?:处于)?(.+?)(?:状态)?(?:时|下)?[，,]?\s*可使用/);
    if (constraintMatch) {
      const stateName = constraintMatch[1].trim();
      // 尝试解析为已知状态
      const buffId = BUFF_ALIAS_MAP[stateName];
      if (buffId) {
        return { _constraint: true, require_state: buffId };
      }
      // 无法解析的状态，返回原始文本
      return { _constraint: true, text: stateName };
    }

    // 模式4: "若已进入 XXX 状态 N 次以上，YYY" (状态切换计数)
    const stateSwitchMatch = effectText.match(/(?:若|当)已进入(.+?)(?:状态)?(\d+)次以上[，,]?\s*(.+)$/);
    if (stateSwitchMatch) {
      const stateName = stateSwitchMatch[1].trim();
      const count = parseInt(stateSwitchMatch[2], 10);
      const actionText = stateSwitchMatch[3].trim();

      const action = this.parseSimpleEffect(actionText, false);
      if (!action) return null;

      const buffId = BUFF_ALIAS_MAP[stateName];
      if (buffId) {
        return {
          when: { '>=': [{ var: `player.state_switch_count.${buffId}` }, count] },
          do: Array.isArray(action) ? action : [action],
        };
      }
      return null;
    }

    // 模式5: "若状态切换 N 次以上时，YYY" (总切换计数)
    const totalSwitchMatch = effectText.match(/(?:若|当|仅在)状态切换(\d+)次以上(?:时)?[，,]?\s*(.+)$/);
    if (totalSwitchMatch) {
      const count = parseInt(totalSwitchMatch[1], 10);
      const actionText = totalSwitchMatch[2].trim();

      const action = this.parseSimpleEffect(actionText, false);
      if (!action) return null;

      return {
        when: { '>=': [{ var: 'player.state_switch_count_total' }, count] },
        do: Array.isArray(action) ? action : [action],
      };
    }

    // 模式6: "若剩余回合不大于 N 时，YYY" (回合数条件)
    const turnMatch = effectText.match(/(?:若|当|仅在)剩余回合(?:数)?(?:不大于|<=|≤)(\d+)(?:时)?[，,]?\s*(.+)$/);
    if (turnMatch) {
      const turns = parseInt(turnMatch[1], 10);
      const actionText = turnMatch[2].trim();

      const action = this.parseSimpleEffect(actionText, false);
      if (!action) return null;

      return {
        when: { '<=': [{ '-': [{ var: 'max_turns' }, { var: 'turn' }] }, turns] },
        do: Array.isArray(action) ? action : [action],
      };
    }

    // 模式7: "若手牌中 R/SR/SSR 技能卡在 N 张以上时，YYY" (卡牌区域计数)
    const cardCountMatch = effectText.match(
      /(?:若|当)手牌中(?:的)?(R|SR|SSR|UR)?技能卡(?:在)?(\d+)张以上(?:时)?[，,]?\s*(.+)$/,
    );
    if (cardCountMatch) {
      const rarity = cardCountMatch[1];
      const count = parseInt(cardCountMatch[2], 10);
      const actionText = cardCountMatch[3].trim();

      const action = this.parseSimpleEffect(actionText, false);
      if (!action) return null;

      const varName = rarity ? `hand.count_by_rarity.${rarity}` : 'hand.count';
      return {
        when: { '>=': [{ var: varName }, count] },
        do: Array.isArray(action) ? action : [action],
      };
    }

    // 模式8: "若抽牌堆或弃牌堆中的技能卡总数在 N 张以上时，YYY"
    const deckDiscardMatch = effectText.match(
      /(?:若|当)(?:抽牌堆或弃牌堆|抽弃牌堆)中(?:的)?技能卡总数(?:在)?(\d+)张以上(?:时)?[，,]?\s*(.+)$/,
    );
    if (deckDiscardMatch) {
      const count = parseInt(deckDiscardMatch[1], 10);
      const actionText = deckDiscardMatch[2].trim();

      const action = this.parseSimpleEffect(actionText, false);
      if (!action) return null;

      return {
        when: { '>=': [{ '+': [{ var: 'deck.count' }, { var: 'discard.count' }] }, count] },
        do: Array.isArray(action) ? action : [action],
      };
    }

    // 模式9: "若 XXX N 阶段下，可使用" (阶段等级条件)
    const levelMatch = effectText.match(/(?:若|当|仅在)(.+?)(\d+)阶段(?:下)?[，,]?\s*(.+)$/);
    if (levelMatch) {
      const stateName = levelMatch[1].trim();
      const level = parseInt(levelMatch[2], 10);
      const actionText = levelMatch[3].trim();

      // 检查是否是"可使用"
      if (actionText.includes('可使用')) {
        const buffId = BUFF_ALIAS_MAP[stateName];
        if (buffId) {
          return { _constraint: true, buff: buffId, level };
        }
      }

      const action = this.parseSimpleEffect(actionText, false);
      if (!action) return null;

      const buffId = BUFF_ALIAS_MAP[stateName];
      if (buffId) {
        return {
          when: {
            and: [
              { '>=': [{ var: `player.buffs.${buffId}` }, 1] },
              { '>=': [{ var: `player.buffs.${buffId}_level` }, level] },
            ],
          },
          do: Array.isArray(action) ? action : [action],
        };
      }
      return null;
    }

    // 模式10: "若使用技能卡消耗体力时，YYY" (体力消耗触发)
    const staminaCostMatch = effectText.match(/(?:若|当)使用技能卡消耗体力(?:时)?[，,]?\s*(.+)$/);
    if (staminaCostMatch) {
      const actionText = staminaCostMatch[1].trim();
      const action = this.parseSimpleEffect(actionText, false);
      if (!action) return null;

      return {
        when: { '>': [{ var: 'event.stamina_cost' }, 0] },
        do: Array.isArray(action) ? action : [action],
      };
    }

    return null;
  }

  /**
   * P5: 解析成长效果 [成长] 标签
   * 成长效果使用 REGISTER_HOOK 实现持续触发
   * @returns Hook 动作或 null
   */
  private static parseGrowthEffect(effectText: string): any | null {
    // 检测是否包含 [成长] 标签
    if (!effectText.includes('[成长]') && !effectText.includes('成长：') && !effectText.includes('成長：')) {
      return null;
    }

    // 提取成长内容
    const growthMatch = effectText.match(/(?:\[成长\]|成长：|成長：)\s*(.+)$/);
    if (!growthMatch) return null;

    const growthContent = growthMatch[1].trim();

    // 模式1: "回合开始时，XXX" → ON_TURN_START
    const turnStartMatch = growthContent.match(/回合开始时[，,]?\s*(.+)$/);
    if (turnStartMatch) {
      const actionText = turnStartMatch[1].trim();
      const actions = this.parseGrowthActions(actionText);
      if (actions.length > 0) {
        return this.buildHookAction('ON_TURN_START', actions, {
          name: 'growth_turn_start',
          scope: 'card', // 成长效果绑定到卡牌
        });
      }
    }

    // 模式2: "变更指针时，XXX" → ON_STATE_SWITCH
    const stateSwitchMatch = growthContent.match(/(?:变更指针|切换状态)(?:时)?[，,]?\s*(.+)$/);
    if (stateSwitchMatch) {
      const actionText = stateSwitchMatch[1].trim();
      const actions = this.parseGrowthActions(actionText);
      if (actions.length > 0) {
        return this.buildHookAction('ON_STATE_SWITCH', actions, {
          name: 'growth_state_switch',
          scope: 'card',
        });
      }
    }

    // 模式3: "成为全力/强气/温存状态时，XXX" → ON_STATE_SWITCH + condition
    const becomeStateMatch = growthContent.match(/成为(.+?)(?:状态)?(?:时)?[，,]?\s*(.+)$/);
    if (becomeStateMatch) {
      const stateName = becomeStateMatch[1].trim();
      const actionText = becomeStateMatch[2].trim();
      const actions = this.parseGrowthActions(actionText);
      const buffId = BUFF_ALIAS_MAP[stateName];

      if (actions.length > 0 && buffId) {
        return this.buildHookAction('ON_STATE_SWITCH', actions, {
          name: `growth_become_${stateName}`,
          scope: 'card',
          condition: { '==': [{ var: 'event.target_state' }, buffId] },
        });
      }
    }

    // 模式4: "使用X类技能卡时，XXX" → ON_AFTER_CARD_PLAY + condition
    const cardPlayMatch = growthContent.match(/使用(.+?)(?:类)?技能卡(?:时)?[，,]?\s*(.+)$/);
    if (cardPlayMatch) {
      const cardType = cardPlayMatch[1].trim();
      const actionText = cardPlayMatch[2].trim();
      const actions = this.parseGrowthActions(actionText);

      if (actions.length > 0) {
        const condition: any = {};
        if (cardType === '主动' || cardType === 'A') {
          condition['=='] = [{ var: 'event.card.type' }, 'A'];
        } else if (cardType === '精神' || cardType === 'M') {
          condition['=='] = [{ var: 'event.card.type' }, 'M'];
        }

        return this.buildHookAction('ON_AFTER_CARD_PLAY', actions, {
          name: `growth_card_play_${cardType}`,
          scope: 'card',
          condition: Object.keys(condition).length > 0 ? condition : undefined,
        });
      }
    }

    // 模式5: 无触发条件的成长效果 → 默认为 ON_TURN_START（永久生效）
    const actions = this.parseGrowthActions(growthContent);
    if (actions.length > 0) {
      return this.buildHookAction('ON_TURN_START', actions, {
        name: 'growth_passive',
        scope: 'card',
      });
    }

    return null;
  }

  /**
   * P5: 解析成长效果的动作列表
   * 支持 "自身的打分值+20，打分次数+1" 等复合效果
   */
  private static parseGrowthActions(actionText: string): any[] {
    const actions: any[] = [];

    // 分割多个效果
    const parts = actionText.split(/[，,；;]/);

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // 自身的打分值+N
      const scoreValueMatch = trimmed.match(/(?:自身的)?打分值[+＋](\d+)/);
      if (scoreValueMatch) {
        actions.push({
          action: 'MODIFY_CARD_PROPERTY',
          property: 'score_value',
          delta: parseInt(scoreValueMatch[1], 10),
        });
        continue;
      }

      // 打分次数+N
      const scoreTimesMatch = trimmed.match(/打分次数[+＋](\d+)/);
      if (scoreTimesMatch) {
        actions.push({
          action: 'MODIFY_CARD_PROPERTY',
          property: 'score_times',
          delta: parseInt(scoreTimesMatch[1], 10),
        });
        continue;
      }

      // 体力消耗值+N
      const staminaCostMatch = trimmed.match(/体力消耗(?:值)?[+＋](\d+)/);
      if (staminaCostMatch) {
        actions.push({
          action: 'MODIFY_CARD_PROPERTY',
          property: 'stamina_cost',
          delta: parseInt(staminaCostMatch[1], 10),
        });
        continue;
      }

      // 尝试使用通用解析器
      const parsed = this.parseSimpleEffect(trimmed, false);
      if (parsed) {
        if (Array.isArray(parsed)) {
          actions.push(...parsed);
        } else {
          actions.push(parsed);
        }
      }
    }

    return actions;
  }

  /**
   * P6: 解析百分比效果（生成 multiplier_expression）
   * 例如：「打分值+120%」「集中效果2倍计算」「好印象增益+100%」
   * @returns 带 multiplier_expression 的动作或 null
   */
  private static parsePercentageEffect(effectText: string): any | null {
    // 模式1: "打分值+N%" / "得分+N%"
    const scorePercentMatch = effectText.match(/(?:打分值|得分|分数)[+＋](\d+)%/);
    if (scorePercentMatch) {
      const percent = parseInt(scorePercentMatch[1], 10);
      return {
        action: 'ADD_BUFF',
        buff_id: 'ScoreBonus',
        value: percent,
        turns: 1, // 默认1回合
      };
    }

    // 模2: "集中效果N倍计算" / "集中增益N倍"
    // T-B6: 使用 MODIFY_BUFF_EFFECT_MULTIPLIER 设置效果倍率
    const concentrationMultMatch = effectText.match(/集中(?:效果|增益)(\d+(?:\.\d+)?)倍(?:计算)?/);
    if (concentrationMultMatch) {
      const multiplier = parseFloat(concentrationMultMatch[1]);
      return {
        action: 'MODIFY_BUFF_EFFECT_MULTIPLIER',
        buff_id: 'Concentration',
        multiplier,
      };
    }

    // 模3: "干劲效果N倍计算"
    // T-B6: 使用 MODIFY_BUFF_EFFECT_MULTIPLIER 设置效果倍率
    const motivationMultMatch = effectText.match(/干劲(?:效果|增益)(\d+(?:\.\d+)?)倍(?:计算)?/);
    if (motivationMultMatch) {
      const multiplier = parseFloat(motivationMultMatch[1]);
      return {
        action: 'MODIFY_BUFF_EFFECT_MULTIPLIER',
        buff_id: 'Motivation',
        multiplier,
      };
    }

    // 模式4: "好印象增强+N%" / "好印象强化+N%"
    const goodImpressionBonusMatch = effectText.match(/好印象(?:增强|强化)[+＋](\d+)%/);
    if (goodImpressionBonusMatch) {
      const percent = parseInt(goodImpressionBonusMatch[1], 10);
      return {
        action: 'ADD_BUFF',
        buff_id: 'GoodImpressionBonus',
        value: percent,
      };
    }

    // 模式5: "好调增加回合数+N%"
    const goodConditionDurationMatch = effectText.match(/好调增加回合数[+＋](\d+)%/);
    if (goodConditionDurationMatch) {
      const percent = parseInt(goodConditionDurationMatch[1], 10);
      return {
        action: 'MODIFY_BUFF_MULTIPLIER',
        buff_id: 'GoodCondition',
        multiplier: 1 + percent / 100,
      };
    }

    // 模式6: "集中增加量+N%"
    const concentrationAmountMatch = effectText.match(/集中增加量[+＋](\d+)%/);
    if (concentrationAmountMatch) {
      const percent = parseInt(concentrationAmountMatch[1], 10);
      return {
        action: 'MODIFY_BUFF_MULTIPLIER',
        buff_id: 'Concentration',
        multiplier: 1 + percent / 100,
      };
    }

    // 模式7: "最终得分+N%"
    const finalScoreMatch = effectText.match(/最终(?:得分|分数)[+＋](\d+)%/);
    if (finalScoreMatch) {
      const percent = parseInt(finalScoreMatch[1], 10);
      return {
        action: 'ADD_BUFF',
        buff_id: 'ScoreFinalMultiplier',
        value: percent,
      };
    }

    // 模式8: 回合限定的百分比 "下一回合打分值+N%"
    const nextTurnScoreMatch = effectText.match(/(?:下一?回合|下回合)打分值[+＋](\d+)%/);
    if (nextTurnScoreMatch) {
      const percent = parseInt(nextTurnScoreMatch[1], 10);
      return this.buildHookAction(
        'ON_TURN_START',
        [{ action: 'ADD_BUFF', buff_id: 'ScoreBonus', value: percent, turns: 1 }],
        {
          name: 'next_turn_score_bonus',
          duration_turns: 1,
          max_triggers: 1,
        },
      );
    }

    // P6增强 模式9: "提升元气N%的数值" / "增加元气N%的数值"
    const genkiPercentScoreMatch = effectText.match(/(?:提升|增加)元气(\d+)[%％]的(?:数值|分数)/);
    if (genkiPercentScoreMatch) {
      const percent = parseInt(genkiPercentScoreMatch[1], 10);
      return {
        action: 'GAIN_SCORE',
        value_expression: { '*': [{ var: 'player.genki' }, percent / 100] },
      };
    }

    // P6增强 模式10: "提升好印象N%的数值"
    const goodImpressionPercentScoreMatch = effectText.match(/(?:提升|增加)好印象(\d+)[%％]的(?:数值|分数)/);
    if (goodImpressionPercentScoreMatch) {
      const percent = parseInt(goodImpressionPercentScoreMatch[1], 10);
      return {
        action: 'GAIN_SCORE',
        value_expression: { '*': [{ var: 'player.buffs.GoodImpression' }, percent / 100] },
      };
    }

    // P6增强 模式11: "好印象增加量增加N%（N回合）"
    const goodImpressionAmountMatch = effectText.match(/好印象增加量(?:增加|提升)(\d+)[%％](?:（(\d+)回合）)?/);
    if (goodImpressionAmountMatch) {
      const percent = parseInt(goodImpressionAmountMatch[1], 10);
      const turns = goodImpressionAmountMatch[2] ? parseInt(goodImpressionAmountMatch[2], 10) : undefined;
      return {
        action: 'ADD_BUFF',
        buff_id: 'GoodImpressionBonus',
        value: percent,
        turns,
      };
    }

    // P6增强 模式12: "增加好调回合数N%的集中"
    const goodConditionToConcentrationMatch = effectText.match(/(?:增加|提升)好调回合数(\d+)[%％]的集中/);
    if (goodConditionToConcentrationMatch) {
      const percent = parseInt(goodConditionToConcentrationMatch[1], 10);
      return {
        action: 'ADD_BUFF',
        buff_id: 'Concentration',
        value_expression: { '*': [{ var: 'player.buffs.GoodCondition.duration' }, percent / 100] },
      };
    }

    // P6增强 模式13: "提升好调回合数N%的数值"
    const goodConditionPercentScoreMatch = effectText.match(/(?:提升|增加)好调回合数(\d+)[%％]的(?:数值|分数)/);
    if (goodConditionPercentScoreMatch) {
      const percent = parseInt(goodConditionPercentScoreMatch[1], 10);
      return {
        action: 'GAIN_SCORE',
        value_expression: { '*': [{ var: 'player.buffs.GoodCondition.duration' }, percent / 100] },
      };
    }

    // P6增强 模式14: 带回合限定的百分比 "随后N回合内，回合结束时，增加元气N%的数值"
    const delayedPercentMatch = effectText.match(
      /随后(\d+)(?:个)?回合内[，,]回合结束时[，,](?:增加|提升)(.+?)(\d+)[%％]的(?:数值|分数)/,
    );
    if (delayedPercentMatch) {
      const turns = parseInt(delayedPercentMatch[1], 10);
      const buffName = delayedPercentMatch[2].trim();
      const percent = parseInt(delayedPercentMatch[3], 10);

      let varPath = 'player.genki';
      if (buffName.includes('元气')) varPath = 'player.genki';
      else if (buffName.includes('好印象')) varPath = 'player.buffs.GoodImpression';
      else if (buffName.includes('集中')) varPath = 'player.buffs.Concentration';
      else if (buffName.includes('干劲')) varPath = 'player.buffs.Motivation';

      return this.buildHookAction(
        'ON_TURN_END',
        [{ action: 'GAIN_SCORE', value_expression: { '*': [{ var: varPath }, percent / 100] } }],
        {
          name: 'delayed_percent_score',
          duration_turns: turns,
        },
      );
    }

    return null;
  }

  /**
   * 解析简单数值效果
   * 例如：「元气+3」「好印象+5」
   */
  private static parseSimpleEffect(effectText: string, allowFuzzyHooks: boolean = true): any | null {
    // P5: 优先检查成长效果
    const growthResult = this.parseGrowthEffect(effectText);
    if (growthResult) {
      return growthResult;
    }

    if (allowFuzzyHooks) {
      const afterTurnMatch = effectText.match(/此后每回合结束时[，,]?(.*)$/);
      if (afterTurnMatch) {
        const inner = this.parseSimpleEffect(afterTurnMatch[1].trim(), false);
        if (!inner) return null;
        const actions = Array.isArray(inner) ? inner : [inner];
        return this.buildHookAction('ON_TURN_END', actions, { name: 'after_turn_end' });
      }

      const nextTurnMatch = effectText.match(/(?:下回合|下一回合)(?:开始时)?[，,]?(.*)$/);
      if (nextTurnMatch) {
        const rest = nextTurnMatch[1].trim();
        if (rest) {
          const inner = this.parseSimpleEffect(rest, false);
          if (inner) {
            const actions = Array.isArray(inner) ? inner : [inner];
            return this.buildHookAction('ON_TURN_START', actions, {
              name: 'next_turn',
              duration_turns: 1,
              max_triggers: 1,
            });
          }
          if (/(抽取|抽).*(技能卡)?/.test(rest)) {
            return this.buildHookAction('ON_TURN_START', [{ action: 'DRAW_CARD', count: 1 }], {
              name: 'next_turn_draw',
              duration_turns: 1,
              max_triggers: 1,
            });
          }
          return null;
        }

        return this.buildHookAction('ON_TURN_START', [{ action: 'DRAW_CARD', count: 1 }], {
          name: 'next_turn_draw',
          duration_turns: 1,
          max_triggers: 1,
        });
      }
    }

    // P3: 条件触发词解析（若/当/仅在）
    if (this.containsConditionalTrigger(effectText)) {
      const conditionalResult = this.parseConditionalEffect(effectText);
      if (conditionalResult) {
        return conditionalResult;
      }
      // 如果解析失败，继续尝试其他模式或返回 null
    }

    const lessonStartMatch = effectText.match(/演出开始时加入手牌(?:\s*(\d+)张)?/);
    if (lessonStartMatch) {
      const count = lessonStartMatch[1] ? parseInt(lessonStartMatch[1], 10) : 1;
      return this.buildHookAction('ON_LESSON_START', [{ action: 'DRAW_CARD', count }], {
        name: 'lesson_start_draw',
        duration_turns: 1,
        max_triggers: 1,
      });
    }

    // P6: 百分比效果解析（生成 multiplier_expression）
    const percentageResult = this.parsePercentageEffect(effectText);
    if (percentageResult) {
      return percentageResult;
    }

    // 模式：数值/得分/打分值/分数 +N（可带多次）
    const multiScoreMatch = effectText.match(/(?:数值|得分|打分值|分数)[+＋](\d+)[（(](\d+)次[）)]/);
    if (multiScoreMatch) {
      return {
        action: 'GAIN_SCORE',
        value: parseInt(multiScoreMatch[1], 10),
        repeat: parseInt(multiScoreMatch[2], 10),
      };
    }

    const scoreMatch = effectText.match(/(?:数值|得分|打分值|分数)[+＋](\d+)/);
    if (scoreMatch) {
      return { action: 'GAIN_SCORE', value: parseInt(scoreMatch[1], 10) };
    }

    // 模式：元气/精力 ±N
    const genkiMatch = effectText.match(/(?:元气|精力|元氣)([+＋-－])(\d+)/);
    if (genkiMatch) {
      const sign = genkiMatch[1] === '+' || genkiMatch[1] === '＋' ? 1 : -1;
      return { action: 'MODIFY_GENKI', value: sign * parseInt(genkiMatch[2], 10) };
    }

    // 模式：体力+N / 体力-N
    const staminaMatch = effectText.match(/体力([+＋-－])(\d+)/);
    if (staminaMatch) {
      const sign = staminaMatch[1] === '+' || staminaMatch[1] === '＋' ? 1 : -1;
      return { action: 'MODIFY_STAMINA', value: sign * parseInt(staminaMatch[2], 10) };
    }

    // 模式：体力回复N / 体力消耗N
    const staminaRecoverMatch = effectText.match(/体力(?:回复|恢复)(\d+)/);
    if (staminaRecoverMatch) {
      return { action: 'MODIFY_STAMINA', value: parseInt(staminaRecoverMatch[1], 10) };
    }
    const staminaConsumeMatch = effectText.match(/体力消耗(\d+)/);
    if (staminaConsumeMatch) {
      return { action: 'MODIFY_STAMINA', value: -parseInt(staminaConsumeMatch[1], 10) };
    }

    // 模式：切换至温存/强气/全力状态
    const switchConserveStageMatch = effectText.match(/切换至温存(\d+)(?:段|阶段)?状态?/);
    if (switchConserveStageMatch) {
      return {
        action: 'ADD_BUFF',
        buff_id: 'ConserveState',
        value: parseInt(switchConserveStageMatch[1], 10),
        turns: -1,
      };
    }
    const switchConserveMatch = effectText.match(/切换至温存状态?/);
    if (switchConserveMatch) {
      return { action: 'ADD_BUFF', buff_id: 'ConserveState', value: 1, turns: -1 };
    }
    const switchResoluteStageMatch = effectText.match(/切换至强气(\d+)(?:段|阶段)?状态?/);
    if (switchResoluteStageMatch) {
      return {
        action: 'ADD_BUFF',
        buff_id: 'ResoluteState',
        value: parseInt(switchResoluteStageMatch[1], 10),
        turns: -1,
      };
    }
    const switchResoluteMatch = effectText.match(/切换至强气状态?/);
    if (switchResoluteMatch) {
      return { action: 'ADD_BUFF', buff_id: 'ResoluteState', value: 1, turns: -1 };
    }
    const switchAlloutMatch = effectText.match(/切换至全力状态?/);
    if (switchAlloutMatch) {
      return { action: 'ADD_BUFF', buff_id: 'AlloutState', value: 1, turns: -1 };
    }

    // 模式：全力值+N
    const allPowerMatch = effectText.match(/全力值\s*[+＋]\s*(\d+)/);
    if (allPowerMatch) {
      return {
        action: 'ADD_BUFF',
        buff_id: 'AllPower',
        value: parseInt(allPowerMatch[1], 10),
        turns: -1,
      };
    }

    // 模式：抽取N张技能卡
    const drawMatch = effectText.match(/(?:抽取|额外抽取)(\d+)张技能卡/);
    if (drawMatch) {
      return { action: 'DRAW_CARD', count: parseInt(drawMatch[1], 10) };
    }

    // 模式：技能卡使用数+N
    const playLimitMatch = effectText.match(/技能卡使用数[+＋](\d+)/);
    if (playLimitMatch) {
      return { action: 'MODIFY_PLAY_LIMIT', value: parseInt(playLimitMatch[1], 10) };
    }

    // 模式：消耗/减少 Buff 回合（如 好调消耗2回合 / 消耗2回合好调）
    const buffConsumeMatch = effectText.match(/(好调|绝好调|集中|干劲|好印象)消耗(\d+)(?:回合|層)?/);
    if (buffConsumeMatch) {
      const buffId = BUFF_ALIAS_MAP[buffConsumeMatch[1]];
      if (!buffId) return null;
      return { action: 'REMOVE_BUFF', buff_id: buffId, stacks: parseInt(buffConsumeMatch[2], 10) };
    }
    const buffConsumeMatch2 = effectText.match(/消耗(\d+)(?:回合|層)?(好调|绝好调|集中|干劲|好印象)/);
    if (buffConsumeMatch2) {
      const buffId = BUFF_ALIAS_MAP[buffConsumeMatch2[2]];
      if (!buffId) return null;
      return { action: 'REMOVE_BUFF', buff_id: buffId, stacks: parseInt(buffConsumeMatch2[1], 10) };
    }

    // 模式：好调+N回合 / 集中+N / 干劲+N
    const buffMatch = effectText.match(/(好调|绝好调|集中|干劲|好印象)[+＋](\d+)(?:回合|層)?/);
    if (buffMatch) {
      const buffId = BUFF_ALIAS_MAP[buffMatch[1]];
      if (!buffId) return null;
      const value = parseInt(buffMatch[2], 10);
      // 如果是"回合"，则作为 turns；否则作为 value
      if (effectText.includes('回合')) {
        return { action: 'ADD_BUFF', buff_id: buffId, turns: value };
      } else {
        return { action: 'ADD_BUFF', buff_id: buffId, value };
      }
    }

    // 模式：热意+N（Anomaly 机制）
    const heatMatch = effectText.match(/热意[+＋](\\d+)/);
    if (heatMatch) {
      return { action: 'ADD_BUFF', buff_id: 'Heat', value: parseInt(heatMatch[1], 10) };
    }
    // 无法解析
    return null;
  }

  /**
   * 将旧格式 SkillCard 转换为 SkillCardV2
   * @param card 旧格式技能卡
   * @param overrides 覆盖参数（plan/type/rarity），用于修正数据源字段缺失
   * @returns SkillCardV2WithConfidence | null（无法转换时返回 null）
   */
  static convert(card: SkillCard, overrides?: ConvertOverrides): SkillCardV2WithConfidence | null {
    // 0. 解析 plan/type，优先使用 overrides，否则读取 card 字段
    // F1: 使用 normalizeType() 进行宽松匹配
    const rawType = card.type ?? card.cardType;
    const cardType = overrides?.type ?? this.normalizeType(rawType);
    if (cardType === null) {
      console.log(`⚠️ [LegacyToV2Adapter] type 规范化失败：${card.name}, 原始值: "${rawType}"`);
      return null; // 拒转：type 字段无效
    }

    const plan =
      overrides?.plan ??
      (card.plan === '感性' ? 'sense' : card.plan === '理性' ? 'logic' : card.plan === '非凡' ? 'anomaly' : null);
    if (plan === null) {
      console.log(`⚠️ [LegacyToV2Adapter] plan/type 映射失败（plan 无效）：${card.name}`);
      return null; // 拒转：plan 字段无效
    }

    const rarity = overrides?.rarity ?? card.rarity;
    // 1. 检查模糊词（优先检查 effectEntries；仅当无词条时才检查 effect_before）
    const entries = card.effectEntries || [];
    if (entries.length === 0) {
      const effectText = card.effect_before || '';
      if (this.containsFuzzyWords(effectText)) {
        console.log(`⚠️ [LegacyToV2Adapter] 跳过含模糊词的卡（effect_before）：${card.name}`);
        return null;
      }
    }

    // P2: 不再因单个模糊词跳过整个卡，改为部分解析
    // 移除了 1.5 节（模糊词检查导致整卡失败）

    // 2. P2: 尝试解析 effectEntries（支持部分转换）
    const logicChain: any[] = [];
    const partialEffects: string[] = []; // 无法转换的词条

    for (const entry of entries) {
      // 检查是否是模糊词（不可安全解析）
      if (this.containsFuzzyWords(entry.effect) && !this.isDisambiguatedFuzzy(entry.effect)) {
        console.log(`⚡ [LegacyToV2Adapter] 部分转换 - 模糊词条：${entry.effect}`);
        partialEffects.push(entry.effect);
        continue; // 继续处理下一个词条
      }

      const parsed = this.parseSimpleEffect(entry.effect);
      if (!parsed) {
        console.log(`⚡ [LegacyToV2Adapter] 部分转换 - 无法解析：${entry.effect}`);
        partialEffects.push(entry.effect);
        continue; // 继续处理下一个词条
      }

      const actions = [];
      if (Array.isArray(parsed)) {
        actions.push(...parsed);
      } else if (parsed.repeat && parsed.action === 'GAIN_SCORE') {
        for (let i = 0; i < parsed.repeat; i++) {
          actions.push({ action: 'GAIN_SCORE', value: parsed.value });
        }
      } else {
        actions.push(parsed);
      }

      let allActionsValid = true;
      for (const action of actions) {
        if (!WHITELIST_ACTIONS.includes(action.action)) {
          console.log(`⚡ [LegacyToV2Adapter] 部分转换 - 非白名单动作：${action.action}`);
          allActionsValid = false;
          break;
        }
      }

      if (allActionsValid) {
        logicChain.push(...actions);
      } else {
        partialEffects.push(entry.effect);
      }
    }

    // 3. P2: 根据解析结果判定置信度
    let confidence: ExampleConfidence;
    if (partialEffects.length === 0 && logicChain.length > 0) {
      confidence = 'high'; // 全部成功
    } else if (logicChain.length > 0) {
      confidence = 'high_partial'; // 部分成功
    } else {
      // 全部失败 → 返回 null（不生成 low_text_only，由调用方处理）
      console.log(`⚠️ [LegacyToV2Adapter] 无可解析效果：${card.name}`);
      return null;
    }

    // 4. 构建 engine_data
    const costMatch = (card.cost || '0').match(/(\d+)/);
    const genkiCost = costMatch ? parseInt(costMatch[1], 10) : 0;

    const engineData: SkillCardV2WithConfidence['engine_data'] = {
      cost: { genki: genkiCost },
      logic_chain: logicChain.length > 0 ? [{ do: logicChain }] : [],
      constraints: {
        exhaust_on_play: card.restrictions?.usesPerBattle === 1,
      },
    };

    // P2: 添加 partial_effects（仅当有无法转换的词条时）
    if (partialEffects.length > 0) {
      engineData.partial_effects = partialEffects;
    }

    // 5. 验证 engine_data（仅对 high 置信度严格校验）
    if (confidence === 'high') {
      const validation = validateEngineData(engineData);
      if (!validation.success) {
        console.log(`⚠️ [LegacyToV2Adapter] engine_data 校验失败，降级为 high_partial：${card.name}`);
        confidence = 'high_partial';
      }
    }

    // 6. P2: 构建 SkillCardV2（保留 effectEntries）
    const nameParts = card.name.split(' / ');
    const description = entries.length > 0 ? entries.map(e => e.effect).join('\n') : card.effect_before || '';

    const result: SkillCardV2WithConfidence = {
      example_confidence: confidence,
      id: card.id,
      rarity: rarity,
      type: cardType,
      plan: plan,
      // P2: 保留原始 effectEntries（含 icon URL）
      effectEntries:
        entries.length > 0
          ? entries.map(e => ({
              icon: e.icon || '',
              effect: e.effect,
              isConsumption: e.isConsumption || false,
            }))
          : undefined,
      engine_data: engineData,
      display: {
        name: nameParts[1] || nameParts[0],
        nameJP: nameParts[0],
        description: description,
        flavor: card.flavor,
      },
      restrictions: {
        is_unique: !card.restrictions?.isDuplicatable,
      },
    };

    const confidenceEmoji = confidence === 'high' ? '✅' : '⚡';
    console.log(`${confidenceEmoji} [LegacyToV2Adapter] 转换完成 (${confidence})：${card.name}`);
    return result;
  }

  /**
   * 批量转换，仅返回成功的结果
   * @param cards 旧格式技能卡数组
   * @param overrides 覆盖参数（会应用到所有卡）
   */
  static convertBatch(cards: SkillCard[], overrides?: ConvertOverrides): SkillCardV2WithConfidence[] {
    return cards
      .map(card => this.convert(card, overrides))
      .filter((result): result is SkillCardV2WithConfidence => result !== null);
  }

  /**
   * 将无法转换的卡标记为 low_text_only
   * @param card 旧格式技能卡
   * @param overrides 覆盖参数（plan/type/rarity）
   * @returns SkillCardV2WithConfidence | null（plan/type 无效时返回 null）
   */
  static markAsLowTextOnly(card: SkillCard, overrides?: ConvertOverrides): SkillCardV2WithConfidence | null {
    const nameParts = card.name.split(' / ');
    // type 字段：JSON 数据使用 "主动"/"精神"，类型定义使用 cardType: A/M
    const rawType = card.type ?? card.cardType;
    const cardType =
      overrides?.type ??
      (rawType === '主动' ? 'A' : rawType === '精神' ? 'M' : rawType === 'A' ? 'A' : rawType === 'M' ? 'M' : null);
    if (cardType === null) {
      console.log(`⚠️ [LegacyToV2Adapter] markAsLowTextOnly plan/type 映射失败（type 无效）：${card.name}`);
      return null; // 拒转
    }

    const plan =
      overrides?.plan ??
      (card.plan === '感性' ? 'sense' : card.plan === '理性' ? 'logic' : card.plan === '非凡' ? 'anomaly' : null);
    if (plan === null) {
      console.log(`⚠️ [LegacyToV2Adapter] markAsLowTextOnly plan/type 映射失败（plan 无效）：${card.name}`);
      return null; // 拒转
    }

    const rarity = overrides?.rarity ?? card.rarity;
    return {
      example_confidence: 'low_text_only',
      id: card.id,
      rarity: rarity,
      type: cardType,
      plan: plan,
      engine_data: {
        cost: { genki: 0 },
        logic_chain: [], // 空：仅供风格参考
      },
      display: {
        name: nameParts[1] || nameParts[0],
        nameJP: nameParts[0],
        description: card.effect_before || '',
        flavor: card.flavor,
      },
    };
  }
}
