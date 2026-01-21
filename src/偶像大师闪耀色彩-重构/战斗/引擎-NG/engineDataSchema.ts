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
/**
 * 原子动作定义 (基础部分，不含递归)
 */
const AtomicActionBaseSchema = z.discriminatedUnion('action', [
  // 获得分数
  z.object({
    action: z.literal('GAIN_SCORE'),
    value: z.number().optional(),
    value_expression: JsonLogicExpr.optional(),
    multiplier_expression: JsonLogicExpr.optional(),
  }),
  // 修改元气
  z.object({
    action: z.literal('MODIFY_GENKI'),
    value: z.number().optional(), // 固定值
    value_expression: JsonLogicExpr.optional(), // 动态公式
    multiplier_expression: JsonLogicExpr.optional(), // 倍率公式
  }),
  // 修改体力
  z.object({
    action: z.literal('MODIFY_STAMINA'),
    value: z.number().optional(), // 固定值
    value_expression: JsonLogicExpr.optional(), // 动态公式
    multiplier_expression: JsonLogicExpr.optional(), // 倍率公式
  }),
  // 添加 Buff
  z.object({
    action: z.literal('ADD_BUFF'),
    buff_id: z.string(),
    value: z.number().optional(),
    value_expression: JsonLogicExpr.optional(), // T-Fix: 支持动态层数
    turns: z.number().optional(),
    turns_expression: JsonLogicExpr.optional(), // T-Fix: 支持动态回合数
    decay_per_turn: z.number().optional(), // T-1: 每回合衰减量
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
    selector: z.any().optional(),
    filter: z.any().optional(), // 兼容旧字段，normalize 时转为 selector
  }),
  // 移动卡牌
  // T-6: 添加 from_zones 支持多区选择
  z.object({
    action: z.literal('MOVE_CARD_TO_ZONE'),
    from_zone: z.string().optional(), // 兼容旧字段
    from_zones: z.array(z.string()).optional(), // T-6: 多区选择
    to_zone: z.string(),
    selector: z.any().optional(),
    filter: z.any().optional(), // 兼容旧字段，normalize 时转为 selector
  }),
  // 消耗卡牌（移至除外区）
  z.object({
    action: z.literal('EXHAUST_CARD'),
    card_id: z.string().optional(),
  }),
  // 随机打出卡牌
  z.object({
    action: z.literal('PLAY_RANDOM_CARDS'),
    count: z.number(),
    from_zone: z.string().optional(), // 来源区域，默认 'hand'
    selector: z.any().optional(), // JSON Logic 选择器（优先使用）
    filter: z
      .object({
        rarity: z.array(z.string()).optional(),
        type: z.array(z.string()).optional(),
      })
      .optional(),
    free: z.boolean().optional(),
  }),

  // 批量修改卡牌
  z.object({
    action: z.literal('MODIFY_ALL_CARDS'),
    target_zone: z.string().optional(),
    modifier: z.object({
      stat: z.string(),
      value: z.number(),
    }),
  }),
  // 修改 Buff 倍率
  z.object({
    action: z.literal('MODIFY_BUFF_MULTIPLIER'),
    buff_id: z.string(),
    multiplier: z.number(),
  }),
  // T-B2: 确保 Buff 至少保持 N 回合
  z.object({
    action: z.literal('ENSURE_BUFF_TURNS'),
    buff_id: z.string(),
    turns: z.number(),
  }),
  // T-B4: 设置 Buff 效果倍率
  z.object({
    action: z.literal('MODIFY_BUFF_EFFECT_MULTIPLIER'),
    buff_id: z.string(),
    multiplier: z.number(),
  }),
  // T2: 强化手牌
  z.object({
    action: z.literal('ENHANCE_HAND'),
    filter: z
      .object({
        type: z.enum(['主动', '精神']).optional(),
        rarity: z.string().optional(),
      })
      .optional(),
  }),
  // T3: 生成卡牌
  z.object({
    action: z.literal('CREATE_CARD'),
    card_id: z.string(),
    zone: z.string(),
    position: z.enum(['top', 'bottom', 'random']).optional(),
    count: z.number().optional(),
  }),
  // T6: 效果重放
  z.object({
    action: z.literal('REPLAY_NEXT_CARD'),
    count: z.number().optional(),
  }),
]);

// 基础动作类型
type AtomicActionBase = z.infer<typeof AtomicActionBaseSchema>;

// 注册 Hook 动作 (递归定义)
export interface RegisterHookAction {
  action: 'REGISTER_HOOK';
  hook_def?: {
    id: string;
    name?: string;
    trigger: string;
    duration_turns?: number;
    max_triggers?: number;
    condition?: any;
    actions: AtomicAction[]; // 递归引用
  };
  hook?: any;
}

// 完整的原子动作类型
export type AtomicAction = AtomicActionBase | RegisterHookAction;

/**
 * 完整的原子动作 Schema (包含递归)
 */
const AtomicActionSchema: z.ZodType<AtomicAction> = z.lazy(() =>
  z.union([
    AtomicActionBaseSchema,
    z.object({
      action: z.literal('REGISTER_HOOK'),
      hook_def: z
        .object({
          id: z.string(),
          name: z.string().optional(),
          trigger: z.string(),
          duration_turns: z.number().optional(),
          max_triggers: z.number().optional(),
          condition: JsonLogicExpr.optional(),
          actions: z.array(AtomicActionSchema), // T-3: 严格使用 AtomicActionSchema
        })
        .optional(),
      hook: z.any().optional(),
    }),
  ]),
);

/**
 * 原子步骤定义
 */
const AtomicStepSchema = z
  .object({
    // T-11: 允许 AI 生成的额外字段通过（宽容输入）
    when: JsonLogicExpr.optional(),
    do: z.array(AtomicActionSchema),
  })
  .passthrough();

/**
 * Engine Data 完整结构
 * T-11: 使用 .passthrough() 允许 AI 生成的额外字段
 */
export const EngineDataSchema = z
  .object({
    cost: z
      .object({
        genki: z.number(),
      })
      .passthrough(), // T-11: cost 也允许未知字段
    constraints: z
      .object({
        exhaust_on_play: z.boolean().optional(),
      })
      .passthrough() // T-11: constraints 也允许未知字段
      .optional(),
    logic_chain: z.array(AtomicStepSchema),
    logic_chain_enhanced: z.array(AtomicStepSchema).optional(),
  })
  .passthrough(); // T-11: 根对象允许未知字段

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

  // 修复 REGISTER_HOOK 中的问题（兼容旧版 hook/do 字段）
  if (a.action === 'REGISTER_HOOK') {
    // 兼容旧版 hook 字段 -> hook_def
    if (a.hook && !a.hook_def) {
      a.hook_def = a.hook;
      delete a.hook;
      console.log('🔧 修复: hook → hook_def');
    }

    if (a.hook_def) {
      const hookDef = a.hook_def as Record<string, unknown>;

      // 兼容旧版 do 字段 -> actions
      if (hookDef.do && !hookDef.actions) {
        hookDef.actions = hookDef.do;
        delete hookDef.do;
        console.log('🔧 修复: hook.do → hook_def.actions');
      }

      // 修复无效的 trigger 名称
      if (hookDef.trigger) {
        hookDef.trigger = normalizeTrigger(hookDef.trigger as string);
      }

      // T-3: 禁止嵌套 when/do，发现时报错
      if (Array.isArray(hookDef.actions)) {
        for (const act of hookDef.actions) {
          if (
            act &&
            typeof act === 'object' &&
            ((act as any).when || (act as any).if) &&
            ((act as any).do || (act as any).then)
          ) {
            throw new Error('T-3: Hook actions 中禁止嵌套 when/do 结构，请直接使用 AtomicAction[]');
          }
        }
      }

      // 确保有 name 字段
      if (!hookDef.name && hookDef.id) {
        hookDef.name = hookDef.id;
      }
    }
  }

  // 修复 PLAY_CARD_FROM_ZONE / MOVE_CARD_TO_ZONE 的 filter -> selector
  if ((a.action === 'PLAY_CARD_FROM_ZONE' || a.action === 'MOVE_CARD_TO_ZONE') && a.filter && !a.selector) {
    a.selector = a.filter;
    delete a.filter;
    console.log('🔧 修复: filter → selector');
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

export type EngineData = z.infer<typeof EngineDataSchema>;
// export type AtomicAction = z.infer<typeof AtomicActionSchema>; // 已在上方定义
export type AtomicStep = z.infer<typeof AtomicStepSchema>;

// ==================== T-12: AI 卡牌生成校验 Schema ====================

/**
 * AI 生成卡牌的 display 结构校验
 * - name: 必填，中文名称
 * - flavorJP: 必填，日语氛围文本
 * - flavorCN: 必填，中文氛围文本翻译
 */
const DisplaySchema = z.object({
  name: z.string().min(1, 'display.name 不能为空'),
  flavorJP: z.string().min(1, 'display.flavorJP 不能为空'),
  flavorCN: z.string().min(1, 'display.flavorCN 不能为空'),
});

/**
 * AI 生成卡牌完整结构校验 Schema
 * T-12: 强制校验 display 字段
 */
export const SkillCardGenerationSchema = z
  .object({
    id: z.string(),
    rarity: z.string(),
    type: z.string(),
    plan: z.string(),
    display: DisplaySchema,
    effectEntries: z.array(
      z
        .object({
          icon: z.string().optional(),
          effect: z.string(),
          isConsumption: z.boolean().optional(),
        })
        .passthrough(),
    ),
    effectEntriesEnhanced: z.array(z.any()).optional(),
    engine_data: EngineDataSchema,
    restrictions: z
      .object({
        is_unique: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type SkillCardGeneration = z.infer<typeof SkillCardGenerationSchema>;
