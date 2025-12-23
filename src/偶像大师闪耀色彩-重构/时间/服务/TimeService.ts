/**
 * 时间服务
 * 管理游戏内时间系统
 */

import { DEFAULT_START_DATE, type GameTime } from '../类型/TimeTypes';

/** 创建初始时间状态 */
export function createInitialGameTime(): GameTime {
  return {
    producerJoinDate: DEFAULT_START_DATE,
    currentDate: DEFAULT_START_DATE,
    totalWeeksPassed: 0,
  };
}

/**
 * 推进时间（一周）
 * @param time 当前时间状态
 * @returns 更新后的时间状态
 */
export function advanceWeek(time: GameTime): GameTime {
  const current = new Date(time.currentDate);
  current.setDate(current.getDate() + 7);

  return {
    ...time,
    currentDate: formatDate(current),
    totalWeeksPassed: time.totalWeeksPassed + 1,
  };
}

/**
 * 推进时间（指定天数）
 * @param time 当前时间状态
 * @param days 天数
 * @returns 更新后的时间状态
 */
export function advanceDays(time: GameTime, days: number): GameTime {
  const current = new Date(time.currentDate);
  current.setDate(current.getDate() + days);

  return {
    ...time,
    currentDate: formatDate(current),
    totalWeeksPassed: time.totalWeeksPassed + Math.floor(days / 7),
  };
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期为中文显示
 * @param dateStr YYYY-MM-DD 格式
 * @returns 如 "2018年4月24日"
 */
export function formatDateChinese(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${year}年${parseInt(month)}月${parseInt(day)}日`;
}

/**
 * 计算两个日期之间的周数
 */
export function weeksBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

/**
 * 检查日期是否匹配特殊日期模式
 * @param dateStr 当前日期 YYYY-MM-DD
 * @param pattern 模式如 "*-04-24"
 */
export function matchesDatePattern(dateStr: string, pattern: string): boolean {
  const [, month, day] = dateStr.split('-');
  const [, patternMonth, patternDay] = pattern.split('-');
  return month === patternMonth && day === patternDay;
}
