/**
 * DSL 编译器 (T7 实现)
 * 将简化的 effect_dsl 语法编译为 NG 引擎的 AtomicAction
 *
 * 设计目标：
 * 1. 让 AI 用更简单的语法描述效果
 * 2. 编译器负责转换为准确的 engine_data 格式
 * 3. 自动校验：禁止虚构概念（ME.hp, damage, OP.*）
 */

import { AtomicAction, AtomicStep, HookType } from '../战斗/引擎-NG/types';

// ==================== 禁止语法检测 ====================

const FORBIDDEN_PATTERNS = [/\bME\.hp\b/i, /\bOP\.hp\b/i, /\bOP\.\w+/i, /\bdamage\s*\(/i, /\bremaining_turns\b/i];

/**
 * 检查 DSL 是否包含禁止的概念
 */
export function checkForbiddenPatterns(dsl: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(dsl)) {
      errors.push(`禁止使用: ${pattern.source.replace(/\\b|\\s\*|\\/i / g, '')}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ==================== DSL 解析器 ====================

/**
 * 解析单行 DSL 语句为 AtomicAction
 */
export function parseDSLLine(line: string): AtomicAction | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('//')) return null;

  // 1. genki +/- N
  const genkiMatch = trimmed.match(/^genki\s*([+-])\s*(\d+)$/i);
  if (genkiMatch) {
    const sign = genkiMatch[1] === '+' ? 1 : -1;
    const value = parseInt(genkiMatch[2], 10) * sign;
    return { action: 'MODIFY_GENKI', value };
  }

  // 2. stamina +/- N
  const staminaMatch = trimmed.match(/^stamina\s*([+-])\s*(\d+)$/i);
  if (staminaMatch) {
    const sign = staminaMatch[1] === '+' ? 1 : -1;
    const value = parseInt(staminaMatch[2], 10) * sign;
    return { action: 'MODIFY_STAMINA', value };
  }

  // 3. score + N
  const scoreMatch = trimmed.match(/^score\s*\+\s*(\d+)$/i);
  if (scoreMatch) {
    return { action: 'GAIN_SCORE', value: parseInt(scoreMatch[1], 10) };
  }

  // 4. buff.add BuffId N [duration]
  const buffAddMatch = trimmed.match(/^buff\.add\s+(\w+)\s+(\d+)(?:\s+(\d+))?$/i);
  if (buffAddMatch) {
    const result: AtomicAction = {
      action: 'ADD_BUFF',
      buff_id: buffAddMatch[1],
      value: parseInt(buffAddMatch[2], 10),
    };
    if (buffAddMatch[3]) {
      (result as any).turns = parseInt(buffAddMatch[3], 10);
    }
    return result;
  }

  // 5. buff.remove BuffId
  const buffRemoveMatch = trimmed.match(/^buff\.remove\s+(\w+)$/i);
  if (buffRemoveMatch) {
    return { action: 'REMOVE_BUFF', buff_id: buffRemoveMatch[1] };
  }

  // 6. draw N
  const drawMatch = trimmed.match(/^draw\s+(\d+)$/i);
  if (drawMatch) {
    return { action: 'DRAW_CARD', count: parseInt(drawMatch[1], 10) };
  }

  // 7. play_limit +/- N
  const playLimitMatch = trimmed.match(/^play_limit\s*([+-])\s*(\d+)$/i);
  if (playLimitMatch) {
    const sign = playLimitMatch[1] === '+' ? 1 : -1;
    return { action: 'MODIFY_PLAY_LIMIT', value: parseInt(playLimitMatch[2], 10) * sign };
  }

  // 8. turn_count +/- N
  const turnCountMatch = trimmed.match(/^turn_count\s*([+-])\s*(\d+)$/i);
  if (turnCountMatch) {
    const sign = turnCountMatch[1] === '+' ? 1 : -1;
    return { action: 'MODIFY_TURN_COUNT', value: parseInt(turnCountMatch[2], 10) * sign };
  }

  console.warn(`⚠️ DSL 无法解析: "${trimmed}"`);
  return null;
}

// ==================== Hook 解析器 ====================

const HOOK_TRIGGER_MAP: Record<string, HookType> = {
  on_turn_start: 'ON_TURN_START',
  on_turn_end: 'ON_TURN_END',
  on_after_card_play: 'ON_AFTER_CARD_PLAY',
  on_before_card_play: 'ON_BEFORE_CARD_PLAY',
  on_state_switch: 'ON_STATE_SWITCH',
  on_card_draw: 'ON_CARD_DRAW',
  on_lesson_start: 'ON_LESSON_START',
  on_lesson_end: 'ON_LESSON_END',
  on_turn_skip: 'ON_TURN_SKIP',
  on_before_score_calc: 'ON_BEFORE_SCORE_CALC',
  on_after_score_calc: 'ON_AFTER_SCORE_CALC',
};

/**
 * 解析 Hook 块
 * 格式: on_<trigger> { ... }
 */
export function parseHookBlock(block: string): AtomicAction | null {
  // 匹配: on_trigger_name { actions... }
  const hookMatch = block.match(/^(on_\w+)\s*\{([^}]+)\}$/is);
  if (!hookMatch) return null;

  const triggerKey = hookMatch[1].toLowerCase();
  const trigger = HOOK_TRIGGER_MAP[triggerKey];

  if (!trigger) {
    console.warn(`⚠️ 未知的 Hook 触发器: "${triggerKey}"`);
    return null;
  }

  // 解析 Hook 内部的动作
  const innerActions: AtomicAction[] = [];
  const lines = hookMatch[2].split(/[;\n]/).filter(l => l.trim());

  for (const line of lines) {
    const action = parseDSLLine(line);
    if (action) {
      innerActions.push(action);
    }
  }

  if (innerActions.length === 0) {
    console.warn(`⚠️ Hook 内部没有有效动作`);
    return null;
  }

  return {
    action: 'REGISTER_HOOK',
    hook_def: {
      id: `hook_${triggerKey}_${Date.now()}`,
      name: `DSL Hook (${trigger})`,
      trigger,
      actions: innerActions,
    },
  };
}

// ==================== 条件块解析器 ====================

/**
 * 解析 when 条件块
 * 格式: when <condition> { ... }
 */
export function parseWhenBlock(block: string): AtomicStep | null {
  // 匹配: when condition { actions... }
  const whenMatch = block.match(/^when\s+(.+?)\s*\{([^}]+)\}$/is);
  if (!whenMatch) return null;

  const conditionStr = whenMatch[1].trim();
  const actionsBlock = whenMatch[2];

  // 解析条件表达式
  const condition = parseCondition(conditionStr);
  if (!condition) {
    console.warn(`⚠️ 无法解析条件: "${conditionStr}"`);
    return null;
  }

  // 解析动作
  const actions: AtomicAction[] = [];
  const lines = actionsBlock.split(/[;\n]/).filter(l => l.trim());

  for (const line of lines) {
    const action = parseDSLLine(line);
    if (action) {
      actions.push(action);
    }
  }

  if (actions.length === 0) return null;

  return { when: condition, do: actions };
}

/**
 * 解析简单条件表达式
 * 格式: player.buffs.BuffId >= N
 */
function parseCondition(conditionStr: string): object | null {
  // 匹配: variable >= N 或 variable <= N 或 variable == N
  const match = conditionStr.match(/^([\w.]+)\s*(>=|<=|==|>|<)\s*(\d+)$/);
  if (!match) return null;

  const [, varPath, operator, valueStr] = match;
  const value = parseInt(valueStr, 10);

  const operatorMap: Record<string, string> = {
    '>=': '>=',
    '<=': '<=',
    '==': '==',
    '>': '>',
    '<': '<',
  };

  return {
    [operatorMap[operator]]: [{ var: varPath }, value],
  };
}

// ==================== 完整 DSL 编译器 ====================

export interface DSLCompileResult {
  success: boolean;
  logicChain?: AtomicStep[];
  errors?: string[];
}

/**
 * 编译完整的 effect_dsl 文本为 logic_chain
 */
export function compileDSL(dsl: string): DSLCompileResult {
  // 1. 禁止语法检查
  const forbiddenCheck = checkForbiddenPatterns(dsl);
  if (!forbiddenCheck.valid) {
    return { success: false, errors: forbiddenCheck.errors };
  }

  const logicChain: AtomicStep[] = [];
  const errors: string[] = [];

  // 2. 按块解析（处理 {} 块）
  const blocks = splitIntoBlocks(dsl);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // 尝试解析为 Hook 块
    if (trimmed.startsWith('on_')) {
      const hookAction = parseHookBlock(trimmed);
      if (hookAction) {
        logicChain.push({ do: [hookAction] });
        continue;
      }
    }

    // 尝试解析为 when 条件块
    if (trimmed.startsWith('when ')) {
      const whenStep = parseWhenBlock(trimmed);
      if (whenStep) {
        logicChain.push(whenStep);
        continue;
      }
    }

    // 尝试解析为单行动作
    const action = parseDSLLine(trimmed);
    if (action) {
      logicChain.push({ do: [action] });
      continue;
    }

    // 无法解析
    if (trimmed && !trimmed.startsWith('//')) {
      errors.push(`无法解析: "${trimmed}"`);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  if (logicChain.length === 0) {
    return { success: false, errors: ['DSL 为空或没有有效语句'] };
  }

  return { success: true, logicChain };
}

/**
 * 将 DSL 文本按块分割（处理 {} 嵌套）
 */
function splitIntoBlocks(dsl: string): string[] {
  const blocks: string[] = [];
  let current = '';
  let braceDepth = 0;

  for (const char of dsl) {
    if (char === '{') {
      braceDepth++;
      current += char;
    } else if (char === '}') {
      braceDepth--;
      current += char;
      if (braceDepth === 0) {
        blocks.push(current.trim());
        current = '';
      }
    } else if (char === '\n' && braceDepth === 0) {
      if (current.trim()) {
        blocks.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    blocks.push(current.trim());
  }

  return blocks;
}

// ==================== 导出 ====================

export const DSLCompiler = {
  compile: compileDSL,
  parseLine: parseDSLLine,
  parseHook: parseHookBlock,
  parseWhen: parseWhenBlock,
  checkForbidden: checkForbiddenPatterns,
};

export default DSLCompiler;
