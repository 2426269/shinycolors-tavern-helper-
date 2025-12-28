/**
 * Engine Data Schema - Zod 校验器
 * 用于验证 AI 生成的 engine_data 结构
 */

import { z } from 'zod';

// JSON Logic 表达式 (允许任意结构)
const JsonLogicExpr = z.any();

/**
 * 原子动作定义
 */
const AtomicActionSchema = z.discriminatedUnion('action', [
  // 获得分数
  z.object({
    action: z.literal('GAIN_SCORE'),
    value: z.number().optional(),
    value_expression: JsonLogicExpr.optional(),
    multiplier_expression: JsonLogicExpr.optional(),
  }),
  // 修改体力
  z.object({
    action: z.literal('MODIFY_GENKI'),
    value: z.number().optional(), // 固定值
    value_expression: JsonLogicExpr.optional(), // 动态公式
    multiplier_expression: JsonLogicExpr.optional(), // 倍率公式
  }),
  // 添加 Buff
  z.object({
    action: z.literal('ADD_BUFF'),
    buff_id: z.string(),
    value: z.number().optional(),
    turns: z.number().optional(),
  }),
  // 移除 Buff
  z.object({
    action: z.literal('REMOVE_BUFF'),
    buff_id: z.string(),
    stacks: z.number().optional(),
  }),
  // 添加标签
  z.object({
    action: z.literal('ADD_TAG'),
    tag: z.string(),
    turns: z.number().optional(),
  }),
  // 移除标签
  z.object({
    action: z.literal('REMOVE_TAG'),
    tag: z.string(),
  }),
  // 抽牌
  z.object({
    action: z.literal('DRAW_CARD'),
    count: z.number(),
  }),
  // 修改出牌次数
  z.object({
    action: z.literal('MODIFY_PLAY_LIMIT'),
    value: z.number(),
  }),
  // 修改回合数
  z.object({
    action: z.literal('MODIFY_TURN_COUNT'),
    value: z.number(),
  }),
  // 从区域打出卡牌
  z.object({
    action: z.literal('PLAY_CARD_FROM_ZONE'),
    zone: z.string(),
    free: z.boolean().optional(),
    filter: z.any().optional(),
  }),
  // 移动卡牌
  z.object({
    action: z.literal('MOVE_CARD_TO_ZONE'),
    from_zone: z.string(),
    to_zone: z.string(),
    filter: z.any().optional(),
  }),
  // 修改 Buff 倍率
  z.object({
    action: z.literal('MODIFY_BUFF_MULTIPLIER'),
    buff_id: z.string(),
    multiplier: z.number(),
  }),
  // 注册 Hook
  z.object({
    action: z.literal('REGISTER_HOOK'),
    hook_def: z.object({
      id: z.string(),
      trigger: z.string(),
      duration_turns: z.number().optional(),
      max_triggers: z.number().optional(),
      condition: JsonLogicExpr.optional(),
      actions: z.array(z.any()),
    }),
  }),
]);

/**
 * 原子步骤定义
 */
const AtomicStepSchema = z.object({
  when: JsonLogicExpr.optional(),
  do: z.array(AtomicActionSchema),
});

/**
 * Engine Data 完整结构
 */
export const EngineDataSchema = z.object({
  cost: z.object({
    genki: z.number(),
  }),
  logic_chain: z.array(AtomicStepSchema),
  logic_chain_enhanced: z.array(AtomicStepSchema).optional(),
});

/**
 * Visual 定义 (用于自定义标签/Buff)
 */
export const DynamicVisualSchema = z.object({
  key: z.string(),
  kind: z.enum(['tag', 'buff']).optional(),
  symbol: z.string(),
  color: z.string(),
  isDebuff: z.boolean(),
  shortName: z.string(),
  description: z.string(),
});

/**
 * 校验 engine_data
 */
export function validateEngineData(data: unknown): {
  success: boolean;
  data?: z.infer<typeof EngineDataSchema>;
  errors?: z.ZodError;
} {
  const result = EngineDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

/**
 * 尝试修复常见的格式问题
 */
export function normalizeEngineData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;

  const obj = data as Record<string, unknown>;

  // 修复 logic_chain
  if (Array.isArray(obj.logic_chain)) {
    obj.logic_chain = obj.logic_chain.map((step: unknown) => normalizeStep(step));
  }

  // 修复 logic_chain_enhanced
  if (Array.isArray(obj.logic_chain_enhanced)) {
    obj.logic_chain_enhanced = obj.logic_chain_enhanced.map((step: unknown) => normalizeStep(step));
  }

  return obj;
}

/**
 * 修复单个 step
 */
function normalizeStep(step: unknown): unknown {
  if (typeof step !== 'object' || step === null) return step;
  const s = step as Record<string, unknown>;

  // 如果是单个动作 (没有 when/do 包装)
  if (s.action && !s.do) {
    return { do: [normalizeAction(s)] };
  }

  // 修复 if/then -> when/do
  if (s.if && s.then && !s.when && !s.do) {
    const actions = Array.isArray(s.then) ? s.then : [s.then];
    return {
      when: s.if,
      do: actions.map(normalizeAction),
    };
  }

  // 修复 do 中的动作
  if (Array.isArray(s.do)) {
    s.do = s.do.map(normalizeAction);
  }

  return step;
}

/**
 * 修复单个动作
 */
function normalizeAction(action: unknown): unknown {
  if (typeof action !== 'object' || action === null) return action;
  const a = action as Record<string, unknown>;

  // 修复 GAIN_SCORE 的 bonus_expression -> value_expression
  if (a.action === 'GAIN_SCORE' && a.bonus_expression && !a.value_expression) {
    a.value_expression = {
      '+': [{ var: 'base_value' }, a.bonus_expression],
    };
    delete a.bonus_expression;
    console.log('🔧 修复: bonus_expression → value_expression');
  }

  // 修复 REGISTER_HOOK 中的问题
  if (a.action === 'REGISTER_HOOK' && a.hook_def) {
    const hookDef = a.hook_def as Record<string, unknown>;

    // 修复无效的 trigger 名称
    hookDef.trigger = normalizeTrigger(hookDef.trigger as string);

    // 修复 actions 中嵌套的 when/do (将其展平为独立 actions)
    if (Array.isArray(hookDef.actions)) {
      hookDef.actions = flattenNestedActions(hookDef.actions);
    }

    // 确保有 name 字段
    if (!hookDef.name && hookDef.id) {
      hookDef.name = hookDef.id;
    }
  }

  return action;
}

/**
 * 标准化 trigger 名称
 */
function normalizeTrigger(trigger: string): string {
  const triggerMap: Record<string, string> = {
    // 常见的错误写法 -> 正确写法
    ON_CARD_PLAYED: 'ON_AFTER_CARD_PLAY',
    ON_CARD_PLAY: 'ON_AFTER_CARD_PLAY',
    ON_CONSUME_COST: 'ON_AFTER_CARD_PLAY',
    ON_AFTER_CONSUME_COST: 'ON_AFTER_CARD_PLAY',
    ON_SKILL_USE: 'ON_AFTER_CARD_PLAY',
    AFTER_CARD_PLAY: 'ON_AFTER_CARD_PLAY',
    BEFORE_CARD_PLAY: 'ON_BEFORE_CARD_PLAY',
    TURN_START: 'ON_TURN_START',
    TURN_END: 'ON_TURN_END',
    LESSON_START: 'ON_LESSON_START',
    LESSON_END: 'ON_LESSON_END',
    STATE_SWITCH: 'ON_STATE_SWITCH',
  };

  const normalized = triggerMap[trigger];
  if (normalized) {
    console.log(`🔧 修复 trigger: "${trigger}" → "${normalized}"`);
    return normalized;
  }
  return trigger;
}

/**
 * 展平嵌套的 when/do 结构
 * 把 { when: x, do: [...] } 转换为普通 actions（条件暂时忽略，记录警告）
 */
function flattenNestedActions(actions: unknown[]): unknown[] {
  const flattened: unknown[] = [];

  for (const item of actions) {
    if (typeof item !== 'object' || item === null) {
      flattened.push(item);
      continue;
    }

    const obj = item as Record<string, unknown>;

    // 如果是嵌套的 when/do 结构
    if ((obj.when || obj.if) && (obj.do || obj.then)) {
      console.warn('⚠️ Hook actions 中发现嵌套 when/do，将忽略条件直接展开');
      const nestedActions = obj.do || obj.then;
      if (Array.isArray(nestedActions)) {
        flattened.push(...nestedActions);
      }
    } else {
      flattened.push(item);
    }
  }

  return flattened;
}

export type EngineData = z.infer<typeof EngineDataSchema>;
export type AtomicAction = z.infer<typeof AtomicActionSchema>;
export type AtomicStep = z.infer<typeof AtomicStepSchema>;
