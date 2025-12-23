/**
 * 评价等级服务
 * 提取自支援卡选择.vue，用于计算属性值对应的等级
 */

/** 评价等级类型 */
export type Grade = 'SS' | 'S+' | 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'E' | 'F';

/** 评价等级阈值配置 */
const GRADE_THRESHOLDS: { min: number; grade: Grade }[] = [
  { min: 2000, grade: 'SS' },
  { min: 1800, grade: 'S+' },
  { min: 1500, grade: 'S' },
  { min: 1200, grade: 'A+' },
  { min: 1000, grade: 'A' },
  { min: 800, grade: 'B+' },
  { min: 600, grade: 'B' },
  { min: 450, grade: 'C+' },
  { min: 300, grade: 'C' },
  { min: 200, grade: 'D' },
  { min: 100, grade: 'E' },
  { min: 0, grade: 'F' },
];

/**
 * 根据数值获取评价等级
 * @param value 属性数值
 * @returns 评价等级字符串
 */
export function getGrade(value: number): Grade {
  for (const threshold of GRADE_THRESHOLDS) {
    if (value >= threshold.min) {
      return threshold.grade;
    }
  }
  return 'F';
}

/**
 * 获取评价等级对应的颜色
 * @param grade 评价等级
 * @returns CSS颜色值
 */
export function getGradeColor(grade: Grade): string {
  const colors: Record<Grade, string> = {
    SS: '#FFD700', // 金色
    'S+': '#FF6B6B', // 红色
    S: '#FF8C42', // 橙色
    'A+': '#FF69B4', // 粉色
    A: '#DA70D6', // 紫色
    'B+': '#4ECDC4', // 青色
    B: '#45B7D1', // 蓝色
    'C+': '#96CEB4', // 浅绿
    C: '#88D8B0', // 绿色
    D: '#FFEAA7', // 浅黄
    E: '#DFE6E9', // 灰色
    F: '#B2BEC3', // 深灰
  };
  return colors[grade];
}

/**
 * 获取到达下一等级所需的数值
 * @param currentValue 当前数值
 * @returns 下一等级阈值，如果已是最高则返回null
 */
export function getNextGradeThreshold(currentValue: number): number | null {
  for (let i = GRADE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (currentValue < GRADE_THRESHOLDS[i].min) {
      return GRADE_THRESHOLDS[i].min;
    }
  }
  return null; // 已达最高
}

/**
 * 获取当前等级内的进度（0-1）
 * @param value 当前属性值
 * @returns 在当前等级内的进度比例
 */
export function getGradeProgress(value: number): number {
  // 找到当前等级和下一等级的阈值
  let currentThreshold = 0;
  let nextThreshold = 100; // 默认F到E的阈值

  for (let i = 0; i < GRADE_THRESHOLDS.length; i++) {
    if (value >= GRADE_THRESHOLDS[i].min) {
      currentThreshold = GRADE_THRESHOLDS[i].min;
      // 找下一个等级的阈值
      if (i > 0) {
        nextThreshold = GRADE_THRESHOLDS[i - 1].min;
      } else {
        // 已经是最高级别SS，显示满进度
        return 1;
      }
      break;
    }
  }

  const range = nextThreshold - currentThreshold;
  const progress = (value - currentThreshold) / range;
  return Math.min(Math.max(progress, 0), 1);
}
