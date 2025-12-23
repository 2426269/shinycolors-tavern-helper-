/**
 * 时间系统类型定义
 */

/** 游戏时间状态 */
export interface GameTime {
  /** 锚点日期：制作人加入283的日子 (2018-04-24 闪耀色彩开服日) */
  producerJoinDate: string;
  /** 当前日期 */
  currentDate: string;
  /** 累计执教周数 */
  totalWeeksPassed: number;
}

/** 特殊日期配置 */
export interface SpecialDate {
  /** 日期模式 (如 "*-04-24" 表示每年4月24日) */
  pattern: string;
  /** 事件名称 */
  name: string;
  /** 事件类型 */
  type: 'birthday' | 'holiday' | 'anniversary';
  /** 关联角色ID (生日用) */
  characterId?: string;
}

/** 默认开始日期 */
export const DEFAULT_START_DATE = '2018-04-24';
