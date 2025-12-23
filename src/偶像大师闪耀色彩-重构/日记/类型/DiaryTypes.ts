/**
 * 日记系统类型定义
 */

/** 日记条目类型 */
export type DiaryType = 'weekly' | 'competition_summary';

/** 日记条目 */
export interface DiaryEntry {
  /** 唯一ID */
  id: string;
  /** 日期 */
  date: string;
  /** 类型：周记/比赛总结 */
  type: DiaryType;
  /** AI生成的内容 */
  content: string;
  /** 玩家便签 */
  userNote?: string;
  /** 关联的副本ID */
  produceRunId?: string;
}

/** 日记本 */
export interface DiaryBook {
  /** 角色ID */
  characterId: string;
  /** 所有日记条目 */
  entries: DiaryEntry[];
}
