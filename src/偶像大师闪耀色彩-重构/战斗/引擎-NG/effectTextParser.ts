/**
 * 效果文本解析器 (Effect Text Parser)
 * 作为旧版文本效果和新版 NG 战斗引擎之间的桥梁
 *
 * 将 effectEntries 中的中文/日文效果文本解析为 AtomicAction[]
 */

import type { AtomicAction, AtomicStep, JsonLogicExpression } from './types';

// ==================== 条件模式定义 ====================

interface ConditionPattern {
  /** 正则表达式模式 */
  pattern: RegExp;
  /** 转换为 JSON Logic 条件的函数 */
  convert: (match: RegExpMatchArray) => JsonLogicExpression;
}

// Buff 名称映射表
const BUFF_NAME_MAP: Record<string, string> = {
  好调: 'GoodCondition',
  好調: 'GoodCondition',
  绝好调: 'ExcellentCondition',
  絶好調: 'ExcellentCondition',
  集中: 'Concentration',
  好印象: 'GoodImpression',
  干劲: 'Motivation',
  やる気: 'Motivation',
  温存: 'ConserveState',
  强气: 'ResoluteState',
  全力: 'AlloutState',
};

// 条件模式列表 (用于提取 when 条件)
const CONDITION_PATTERNS: ConditionPattern[] = [
  {
    // 好调状态可以使用 / 好调状态时可以使用 (实际卡牌格式)
    pattern: /(好调|好調|绝好调|絶好調)状态(?:时)?(?:可以)?使用/,
    convert: match => {
      const buffName = match[1];
      const buffId = BUFF_NAME_MAP[buffName] || 'GoodCondition';
      return { '>': [{ var: `player.buffs.${buffId}` }, 0] };
    },
  },
  {
    // 好调状态时，... (条件前缀)
    pattern: /(好调|好調|绝好调|絶好調)状态时[，,]/,
    convert: match => {
      const buffName = match[1];
      const buffId = BUFF_NAME_MAP[buffName] || 'GoodCondition';
      return { '>': [{ var: `player.buffs.${buffId}` }, 0] };
    },
  },
  {
    // 若处于[状态名]状态下 / 若处于[状态名]状态时
    pattern: /若处于(.+?)状态(?:下|时)/,
    convert: match => {
      const buffName = match[1].trim();
      const buffId = BUFF_NAME_MAP[buffName] || `ai:${buffName}`;
      return { '>': [{ var: `player.buffs.${buffId}` }, 0] };
    },
  },
  {
    // 仅在[状态名]状态时可使用
    pattern: /仅在(.+?)状态时可使用/,
    convert: match => {
      const buffName = match[1].trim();
      const buffId = BUFF_NAME_MAP[buffName] || `ai:${buffName}`;
      return { '>': [{ var: `player.buffs.${buffId}` }, 0] };
    },
  },
  {
    // 若[状态名]层数>=X
    pattern: /若(.+?)层数[>≥>=]\s*(\d+)/,
    convert: match => {
      const buffName = match[1].trim();
      const value = parseInt(match[2], 10);
      const buffId = BUFF_NAME_MAP[buffName] || `ai:${buffName}`;
      return { '>=': [{ var: `player.buffs.${buffId}` }, value] };
    },
  },
  {
    // X回合目以降 / 第X回合起
    pattern: /(?:(\d+)回合目?以降|第(\d+)回合起)/,
    convert: match => {
      const turn = parseInt(match[1] || match[2], 10);
      return { '>=': [{ var: 'turn' }, turn] };
    },
  },

  // ===== 子任务2新增 =====
  {
    // 元気が0の場合 / 元气为0时 / 元气=0
    pattern: /(?:元気が0の場合|元气[为為]?0(?:时|時)?|元気?[=＝]0)/,
    convert: () => ({ '==': [{ var: 'player.genki' }, 0] }),
  },
  {
    // 体力が50%以上の場合 / 体力≥50%时 / 体力>=50%
    pattern: /体力[がが]?(\d+)%(?:以上|以上の場合)|体力[≥>=]+\s*(\d+)\s*%/,
    convert: match => {
      const percent = parseInt(match[1] || match[2], 10);
      return { '>=': [{ var: 'player.stamina_percent' }, percent] };
    },
  },
];

// ==================== 效果模式定义 ====================

interface EffectPattern {
  /** 正则表达式模式 */
  pattern: RegExp;
  /** 转换为 AtomicAction 的函数 */
  convert: (match: RegExpMatchArray, text: string) => AtomicAction | AtomicAction[] | null;
}

// ==================== 效果模式列表 ====================

const EFFECT_PATTERNS: EffectPattern[] = [
  // ========== 得分类 ==========
  {
    // 数值+X / パラメータ+X (支持 (N次) 后缀)
    pattern: /(?:数值|パラメータ)\s*[+＋]\s*(\d+)/,
    convert: (match, text) => {
      const value = parseInt(match[1], 10);
      const timesMatch = text.match(/[（(](\d+)\s*[次回][)）]/);
      const times = timesMatch ? parseInt(timesMatch[1], 10) : 1;
      return { action: 'GAIN_SCORE', value: value * times };
    },
  },
  {
    // 打分值+X%
    pattern: /打分值\s*[+＋]\s*(\d+)\s*%/,
    convert: match => ({
      action: 'GAIN_SCORE',
      multiplier_expression: { '+': [1, { '/': [parseInt(match[1], 10), 100] }] },
    }),
  },

  // ========== 元气类 ==========
  {
    // 元气+X / 元気+X
    pattern: /(?:元气|元気)\s*[+＋]\s*(\d+)/,
    convert: match => ({ action: 'MODIFY_GENKI', value: parseInt(match[1], 10) }),
  },
  {
    // 元气消耗X / 元気消費X
    pattern: /(?:元气|元気)\s*(?:消耗|消費)\s*(\d+)/,
    convert: match => ({ action: 'MODIFY_GENKI', value: -parseInt(match[1], 10) }),
  },

  // ========== 体力类 ==========
  {
    // 体力消耗X
    pattern: /体力消耗\s*(\d+)/,
    convert: match => ({ action: 'MODIFY_STAMINA', value: -parseInt(match[1], 10) }),
  },
  {
    // 体力回复X
    pattern: /体力(?:回复|恢复)\s*(\d+)/,
    convert: match => ({ action: 'MODIFY_STAMINA', value: parseInt(match[1], 10) }),
  },
  {
    // 消费体力减少X回合
    pattern: /消费体力减少\s*(\d+)\s*回合/,
    convert: match => ({ action: 'ADD_BUFF', buff_id: 'StaminaReduction', value: 1, turns: parseInt(match[1], 10) }),
  },

  // ========== 集中类 (感性) - 层数制，永久 ==========
  {
    // 集中+X (层数)
    pattern: /集中\s*[+＋]\s*(\d+)/,
    convert: match => ({ action: 'ADD_BUFF', buff_id: 'Concentration', value: parseInt(match[1], 10), turns: -1 }),
  },
  {
    // 集中消耗得分
    pattern: /(?:消耗|消費)\s*集中/,
    convert: () => ({
      action: 'GAIN_SCORE',
      value_expression: { '*': [{ var: 'player.concentration' }, 1] },
    }),
  },

  // ========== 好印象类 (理性) - 层数制，每回合-1 ==========
  {
    // 好印象+X (层数，每回合自动-1)
    pattern: /好印象\s*[+＋]\s*(\d+)/,
    convert: match => ({
      action: 'ADD_BUFF',
      buff_id: 'GoodImpression',
      value: parseInt(match[1], 10),
      turns: -1, // 永久，但每回合结束时-1层
      decay_per_turn: 1, // 标记：每回合衰减1层
    }),
  },
  {
    // 好印象消耗得分
    pattern: /(?:消耗|消費)\s*好印象/,
    convert: () => ({
      action: 'GAIN_SCORE',
      value_expression: { '*': [{ var: 'player.good_impression' }, 1] },
    }),
  },

  // ========== 干劲类 (理性) - 层数制，永久 ==========
  {
    // 干劲+X (层数)
    pattern: /(?:干劲|やる気)\s*[+＋]\s*(\d+)/,
    convert: match => ({ action: 'ADD_BUFF', buff_id: 'Motivation', value: parseInt(match[1], 10), turns: -1 }),
  },

  // ========== 修复子任务2: 得分加成类 ==========
  {
    // 得分增加X% (N回合) / 得点+X% (Nターン)
    // 示例: "得分增加30% 3回合" → ADD_BUFF ScoreBonus value=30 turns=3
    pattern: /(?:得分|得点)(?:增加|アップ)\s*(\d+)\s*%(?:\s*[（(]?(\d+)\s*(?:回合|ターン)[)）]?)?/,
    convert: match => ({
      action: 'ADD_BUFF',
      buff_id: 'ScoreBonus',
      value: parseInt(match[1], 10),
      turns: match[2] ? parseInt(match[2], 10) : -1,
    }),
  },
  {
    // 好印象效果增加X% / 好印象強化+X%
    // 示例: "好印象效果增加20% 2回合" → ADD_BUFF GoodImpressionBonus value=20 turns=2
    pattern:
      /好印象(?:効果|效果)?(?:増加|增加|強化|强化)\s*[+＋]?\s*(\d+)\s*%(?:\s*[（(]?(\d+)\s*(?:回合|ターン)[)）]?)?/,
    convert: match => ({
      action: 'ADD_BUFF',
      buff_id: 'GoodImpressionBonus',
      value: parseInt(match[1], 10),
      turns: match[2] ? parseInt(match[2], 10) : -1,
    }),
  },

  // ========== 全力值类 (非凡) - 6-5: 改为 Buff 模式 ==========
  {
    // 全力值+X
    pattern: /全力[値値]?\s*[+＋]\s*(\d+)/,
    convert: match => ({ action: 'ADD_BUFF', buff_id: 'AllPower', value: parseInt(match[1], 10), turns: -1 }),
  },
  {
    // 全力值消耗X
    pattern: /全力[値値]?\s*(?:消耗|消費)\s*(\d+)/,
    convert: match => ({ action: 'REMOVE_BUFF', buff_id: 'AllPower', stacks: parseInt(match[1], 10) }),
  },

  // ========== 好调类 - 回合制 (排除条件文本) ==========
  {
    // 好调+X回合 (解析回合数，明确有+号)
    pattern: /(?:好调|好調)\s*[+＋]\s*(\d+)\s*回合/,
    convert: match => ({ action: 'ADD_BUFF', buff_id: 'GoodCondition', value: 1, turns: parseInt(match[1], 10) }),
  },
  {
    // 好调X回合 (解析回合数，无+号)
    pattern: /(?:好调|好調)\s*(\d+)\s*回合/,
    convert: match => ({ action: 'ADD_BUFF', buff_id: 'GoodCondition', value: 1, turns: parseInt(match[1], 10) }),
  },
  {
    // 绝好调+X回合
    pattern: /(?:绝好调|絶好調)\s*[+＋]\s*(\d+)\s*回合/,
    convert: match => ({ action: 'ADD_BUFF', buff_id: 'ExcellentCondition', value: 1, turns: parseInt(match[1], 10) }),
  },
  {
    // 绝好调X回合
    pattern: /(?:绝好调|絶好調)\s*(\d+)\s*回合/,
    convert: match => ({ action: 'ADD_BUFF', buff_id: 'ExcellentCondition', value: 1, turns: parseInt(match[1], 10) }),
  },
  // 注意: 不再有无数字的好调/绝好调匹配，防止误匹配条件文本 "好调状态"

  // ========== 状态切换类 (非凡) ==========
  {
    // 切换至温存/温存に変更
    pattern: /(?:切换至?|変更)\s*温存/,
    convert: () => ({ action: 'ADD_BUFF', buff_id: 'ConserveState', value: 1, turns: -1 }),
  },
  {
    // 切换至强气X阶段 (带阶段数)
    pattern: /(?:切换至?|変更)\s*强气(\d+)阶段/,
    convert: match => ({ action: 'ADD_BUFF', buff_id: 'ResoluteState', value: parseInt(match[1], 10), turns: -1 }),
  },
  {
    // 切换至强气 (默认1阶段)
    pattern: /(?:切换至?|変更)\s*强气/,
    convert: () => ({ action: 'ADD_BUFF', buff_id: 'ResoluteState', value: 1, turns: -1 }),
  },
  {
    // 切换至全力
    pattern: /(?:切换至?|変更)\s*全力/,
    convert: () => ({ action: 'ADD_BUFF', buff_id: 'AlloutState', value: 1, turns: -1 }),
  },

  // ========== 卡牌操作类 ==========
  {
    // T-8: 合并抽牌模式，避免"额外抽取"双命中
    // 支持: 抽取X张技能卡, 额外抽取X张技能卡, スキルカードをX枚引く
    pattern: /(?:额外)?(?:抽取|引く)\s*(\d+)\s*张?(?:技能卡|スキルカード)?/,
    convert: match => ({ action: 'DRAW_CARD', count: parseInt(match[1], 10) }),
  },
  {
    // 技能卡使用数+X
    pattern: /(?:技能卡使用数|スキルカード使用数追加)\s*[+＋]\s*(\d+)/,
    convert: match => ({ action: 'MODIFY_PLAY_LIMIT', value: parseInt(match[1], 10) }),
  },

  // ========== 消耗类 ==========
  {
    // 消耗此卡 / 使用后消耗 / 消耗自身
    pattern: /消耗此卡|使用后消耗|消耗自身|このカードは消費される/,
    convert: () => ({ action: 'EXHAUST_CARD' }),
  },
  // 子任务5: 训练中限1次 不再输出 ADD_TAG，改由 engine_data.constraints.exhaust_on_play 处理
  // {
  //   pattern: /(?:训练|演出)中限\s*1\s*次/,
  //   convert: () => ({ action: 'ADD_TAG', tag: 'std:uses_per_battle_1', turns: -1 }),
  // },

  // ========== 回合操作类 ==========
  {
    // 回合数+X
    pattern: /回合数\s*[+＋]\s*(\d+)/,
    convert: match => ({ action: 'MODIFY_TURN_COUNT', value: parseInt(match[1], 10) }),
  },

  // ========== 热意值类 (非凡) ==========
  {
    // 热意值+X (P1-3: 改为 Buff 模式)
    pattern: /热意[值値]?\s*[+＋]\s*(\d+)/,
    convert: match => ({ action: 'ADD_BUFF', buff_id: 'Heat', value: parseInt(match[1], 10), turns: -1 }),
  },

  // ========== 子任务3新增: 次回合抽牌 ==========
  {
    // 次のターン、スキルカードを引く / 次のターン、スキルカードをX枚引く
    // 下回合抽取X张技能卡 / 下回合抽取技能卡
    pattern:
      /(?:次のターン|下回合)[，、,]?\s*(?:抽取|引く)?\s*(?:スキルカード|技能卡)?[をを]?\s*(\d+)?(?:枚|张)?(?:引く|抽取)?/,
    convert: match => ({
      action: 'REGISTER_HOOK',
      hook_def: {
        id: `next_turn_draw_${Date.now()}`,
        name: '次回合抽牌',
        trigger: 'ON_TURN_START',
        duration_turns: 1,
        max_triggers: 1,
        actions: [{ action: 'DRAW_CARD', count: parseInt(match[1], 10) || 1 }],
      },
    }),
  },

  // ========== 子任务4新增: 多区移动到保留区 ==========
  {
    // 山札か捨札にあるスキルカードを1枚選択し、保留に移動
    // 从牌堆或弃牌堆移动1张到保留区
    pattern: /(?:山札か捨札|(?:牌堆|牌库|deck)[或か](?:弃牌堆|discard)).*?(?:保留|reserve).*?移[動动]/,
    convert: () => ({
      action: 'MOVE_CARD_TO_ZONE',
      from_zone: 'deck' as const, // 旧字段保持兼容
      from_zones: ['deck', 'discard'], // 多区选择
      to_zone: 'reserve' as const,
    }),
  },
];

// ==================== 主解析函数 ====================

/**
 * 解析单条效果文本，返回对应的 AtomicAction[]
 */
export function parseEffectText(effectText: string): AtomicAction[] {
  const actions: AtomicAction[] = [];

  for (const { pattern, convert } of EFFECT_PATTERNS) {
    const match = effectText.match(pattern);
    if (match) {
      const result = convert(match, effectText);
      if (result) {
        if (Array.isArray(result)) {
          actions.push(...result);
        } else {
          actions.push(result);
        }
      }
    }
  }

  return actions;
}

/**
 * 动作执行优先级排序
 * 学马仕逻辑：得分效果先执行，Buff 效果后执行
 */
function sortActionsByPriority(actions: AtomicAction[]): AtomicAction[] {
  const priority: Record<string, number> = {
    GAIN_SCORE: 1, // 最先执行
    MODIFY_GENKI: 2, // 元气变化
    DRAW_CARD: 3, // 抽牌
    MODIFY_PLAY_LIMIT: 4, // 使用次数
    ADD_BUFF: 5, // Buff 最后执行
    ADD_TAG: 5,
  };

  return [...actions].sort((a, b) => {
    const pa = priority[a.action] ?? 10;
    const pb = priority[b.action] ?? 10;
    return pa - pb;
  });
}

/**
 * 解析单条效果文本 (增强版，支持条件)
 * 1. 先提取条件句 (若处于...状态)
 * 2. 删除条件文本，防止后续误判
 * 3. 解析剩余动作文本
 * 4. 按优先级排序：得分 > 元气 > 抽牌 > Buff
 */
export function parseLogicChainEnhanced(fullText: string): AtomicStep | null {
  let condition: JsonLogicExpression | undefined;
  let remainingText = fullText;

  // 1. 尝试提取条件
  for (const { pattern, convert } of CONDITION_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      condition = convert(match);
      // 🔥 关键：删除条件文本，防止后续误判
      remainingText = fullText.replace(match[0], '').trim();
      // 去掉残留标点
      remainingText = remainingText.replace(/^[,，:：、]\\s*/, '');
      break;
    }
  }

  // 2. 解析剩余文本中的动作
  const actions = parseEffectText(remainingText);

  if (actions.length === 0) return null;

  // 3. 按优先级排序：得分效果先于 Buff 效果
  const sortedActions = sortActionsByPriority(actions);

  // 4. 组装成 Step
  return {
    when: condition,
    do: sortedActions,
  };
}

/**
 * 将效果词条数组转换为 AtomicStep[] (增强版)
 */
export function convertEffectEntriesToLogicChain(
  entries: Array<{ icon?: string; effect: string; isConsumption?: boolean }> | undefined,
): AtomicStep[] {
  if (!entries || entries.length === 0) {
    return [{ do: [{ action: 'GAIN_SCORE', value: 10 }] }]; // 默认10分
  }

  const allSteps: AtomicStep[] = [];

  for (const entry of entries) {
    const effectText = typeof entry === 'string' ? entry : entry.effect;
    const step = parseLogicChainEnhanced(effectText);
    if (step) {
      allSteps.push(step);
    }
  }

  // 如果没有解析到任何步骤，默认加10分
  if (allSteps.length === 0) {
    allSteps.push({ do: [{ action: 'GAIN_SCORE', value: 10 }] });
  }

  return allSteps;
}

/**
 * 解析效果文本并打印调试信息
 */
export function debugParseEffect(effectText: string): void {
  console.log('=== 效果文本解析 ===');
  console.log('输入:', effectText);
  const actions = parseEffectText(effectText);
  console.log('解析结果:', JSON.stringify(actions, null, 2));
}

// ==================== 批量解析函数 ====================

/**
 * 解析多条效果文本
 */
export function parseMultipleEffects(texts: string[]): AtomicAction[] {
  return texts.flatMap(parseEffectText);
}

/**
 * 判断效果文本是否包含得分效果
 */
export function hasScoreEffect(effectText: string): boolean {
  const actions = parseEffectText(effectText);
  return actions.some(a => a.action === 'GAIN_SCORE');
}

/**
 * 获取效果文本中的总得分值
 */
export function getTotalScoreValue(effectText: string): number {
  const actions = parseEffectText(effectText);
  return actions
    .filter(
      (a): a is AtomicAction & { value: number } =>
        a.action === 'GAIN_SCORE' && 'value' in a && typeof a.value === 'number',
    )
    .reduce((sum, a) => sum + a.value, 0);
}
