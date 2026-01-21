/**
 * 考试回合生成器 (ExamTurnGenerator.ts)
 * Phase 7.2: 基于"受限池化抽取模型"生成考试回合属性序列
 *
 * 规则来源: Gemini 研究报告
 * - 50% 主属性, 30% 副属性, 20% 差属性
 * - 最后3回合固定: 差→副→主
 * - 首回合偏置: 几乎不会出差属性
 * - 额外回合: 强制为主属性
 */

// ==================== 类型定义 ====================

/** 属性类型 (三维) */
export type AttributeStat = 'vocal' | 'dance' | 'visual';

/** 属性优先级 (流行度) */
export type TrendPriority = 'main' | 'sub' | 'weak';

/** 回合属性分配 */
export interface TurnAttribute {
  turnNumber: number;
  priority: TrendPriority;
  attribute: AttributeStat;
  isFixed: boolean; // 是否为固定回合 (最后3回合)
  isExtraTurn: boolean; // 是否为额外回合
}

/** 考试回合配置 */
export interface ExamTurnConfig {
  totalTurns: number;
  mainAttribute: AttributeStat; // 偶像主属性
  subAttribute: AttributeStat; // 偶像副属性
  weakAttribute: AttributeStat; // 偶像弱属性
  pool: { main: number; sub: number; weak: number };
}

// ==================== 属性池配置 ====================

/**
 * 根据回合数获取属性池配置
 * 遵循 50/30/20 分配规则
 */
export function getPoolConfig(totalTurns: number): { main: number; sub: number; weak: number } {
  switch (totalTurns) {
    case 6:
      return { main: 3, sub: 2, weak: 1 }; // 50%/33%/17%
    case 8:
      return { main: 4, sub: 2, weak: 2 }; // 50%/25%/25%
    case 9:
      return { main: 5, sub: 2, weak: 2 }; // 56%/22%/22% (中间试验)
    case 10:
      return { main: 5, sub: 3, weak: 2 }; // 50%/30%/20%
    case 12:
      return { main: 6, sub: 4, weak: 2 }; // 50%/33%/17%
    default:
      // 默认: 按 50/30/20 比例计算
      const main = Math.ceil(totalTurns * 0.5);
      const weak = Math.max(2, Math.floor(totalTurns * 0.2));
      const sub = totalTurns - main - weak;
      return { main, sub, weak };
  }
}

// ==================== 回合序列生成 ====================

/**
 * 生成考试回合属性序列
 * @param config 考试回合配置
 * @returns 回合属性数组 (从 T1 到 T_N)
 */
export function generateExamTurnSequence(config: ExamTurnConfig): TurnAttribute[] {
  const { totalTurns, mainAttribute, subAttribute, weakAttribute, pool } = config;

  // 1. 构建固定尾部 (最后3回合: 差→副→主)
  const fixedTail: TurnAttribute[] = [
    {
      turnNumber: totalTurns - 2,
      priority: 'weak',
      attribute: weakAttribute,
      isFixed: true,
      isExtraTurn: false,
    },
    {
      turnNumber: totalTurns - 1,
      priority: 'sub',
      attribute: subAttribute,
      isFixed: true,
      isExtraTurn: false,
    },
    {
      turnNumber: totalTurns,
      priority: 'main',
      attribute: mainAttribute,
      isFixed: true,
      isExtraTurn: false,
    },
  ];

  // 2. 构建随机袋 (扣除固定尾部)
  const randomBag: TrendPriority[] = [];

  // 主属性: pool.main - 1 (固定尾部占用1个)
  for (let i = 0; i < pool.main - 1; i++) {
    randomBag.push('main');
  }

  // 副属性: pool.sub - 1 (固定尾部占用1个)
  for (let i = 0; i < pool.sub - 1; i++) {
    randomBag.push('sub');
  }

  // 差属性: pool.weak - 1 (固定尾部占用1个)
  for (let i = 0; i < pool.weak - 1; i++) {
    randomBag.push('weak');
  }

  // 3. 洗牌 (Fisher-Yates)
  shuffleArray(randomBag);

  // 4. 首回合偏置: 如果 T1 是差属性，与后面的非差属性交换
  if (randomBag.length > 0 && randomBag[0] === 'weak') {
    // 找到第一个非差属性的位置
    const swapIndex = randomBag.findIndex((p, i) => i > 0 && p !== 'weak');
    if (swapIndex > 0) {
      [randomBag[0], randomBag[swapIndex]] = [randomBag[swapIndex], randomBag[0]];
    }
  }

  // 5. 构建完整序列
  const sequence: TurnAttribute[] = [];

  // 随机段 (T1 到 T_{N-3})
  for (let i = 0; i < randomBag.length; i++) {
    const priority = randomBag[i];
    const attribute = priorityToAttribute(priority, mainAttribute, subAttribute, weakAttribute);

    sequence.push({
      turnNumber: i + 1,
      priority,
      attribute,
      isFixed: false,
      isExtraTurn: false,
    });
  }

  // 固定尾部 (T_{N-2}, T_{N-1}, T_N)
  sequence.push(...fixedTail);

  console.log(
    `[ExamTurnGenerator] 生成 ${totalTurns} 回合序列:`,
    sequence.map(t => `T${t.turnNumber}:${t.attribute}`).join(' → '),
  );

  return sequence;
}

/**
 * 优先级转属性
 */
function priorityToAttribute(
  priority: TrendPriority,
  main: AttributeStat,
  sub: AttributeStat,
  weak: AttributeStat,
): AttributeStat {
  switch (priority) {
    case 'main':
      return main;
    case 'sub':
      return sub;
    case 'weak':
      return weak;
  }
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ==================== 额外回合 ====================

/**
 * 生成额外回合 (插入当前回合之后)
 * 额外回合强制为主属性
 */
export function createExtraTurn(afterTurnNumber: number, mainAttribute: AttributeStat): TurnAttribute {
  return {
    turnNumber: afterTurnNumber + 0.5, // 插入位置
    priority: 'main',
    attribute: mainAttribute,
    isFixed: true,
    isExtraTurn: true,
  };
}

// ==================== 倍率计算 ====================

/** 属性倍率配置 */
export interface JudgeRateConfig {
  main: number; // 主属性倍率 (如 0.40-0.50)
  sub: number; // 副属性倍率 (如 0.25-0.30)
  weak: number; // 差属性倍率 (如 0.10-0.15)
}

/** 默认审查基准倍率 */
export const DEFAULT_JUDGE_RATES: JudgeRateConfig = {
  main: 0.45,
  sub: 0.3,
  weak: 0.15,
};

/**
 * 获取当前回合的属性倍率
 */
export function getTurnJudgeRate(turn: TurnAttribute, judgeRates: JudgeRateConfig = DEFAULT_JUDGE_RATES): number {
  switch (turn.priority) {
    case 'main':
      return judgeRates.main;
    case 'sub':
      return judgeRates.sub;
    case 'weak':
      return judgeRates.weak;
  }
}

// ==================== 便捷函数 ====================

/**
 * 根据偶像属性类型确定三维优先级
 * @param idolAttributeType 偶像属性类型 (vocal/dance/visual)
 */
export function getAttributePriorities(idolAttributeType: 'vocal' | 'dance' | 'visual'): {
  main: AttributeStat;
  sub: AttributeStat;
  weak: AttributeStat;
} {
  // 默认顺序: 主属性 → 顺时针副属性 → 弱属性
  switch (idolAttributeType) {
    case 'vocal':
      return { main: 'vocal', sub: 'dance', weak: 'visual' };
    case 'dance':
      return { main: 'dance', sub: 'visual', weak: 'vocal' };
    case 'visual':
      return { main: 'visual', sub: 'vocal', weak: 'dance' };
  }
}

/**
 * 快速生成考试序列
 */
export function quickGenerateExamSequence(
  totalTurns: number,
  idolAttributeType: 'vocal' | 'dance' | 'visual',
): TurnAttribute[] {
  const priorities = getAttributePriorities(idolAttributeType);
  const pool = getPoolConfig(totalTurns);

  return generateExamTurnSequence({
    totalTurns,
    mainAttribute: priorities.main,
    subAttribute: priorities.sub,
    weakAttribute: priorities.weak,
    pool,
  });
}

// ==================== 导出 ====================

export default {
  getPoolConfig,
  generateExamTurnSequence,
  createExtraTurn,
  getTurnJudgeRate,
  getAttributePriorities,
  quickGenerateExamSequence,
  DEFAULT_JUDGE_RATES,
};
