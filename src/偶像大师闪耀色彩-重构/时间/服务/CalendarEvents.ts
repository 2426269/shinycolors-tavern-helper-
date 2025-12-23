/**
 * 日历事件数据
 * 包含偶像生日、节日、副本关键日期等
 */

import { IDOLS } from '../../角色管理/角色数据';

/** 事件类型 */
export type CalendarEventType = 'birthday' | 'festival' | 'audition' | 'story' | 'activity';

/** 日历事件 */
export interface CalendarEvent {
  /** 日期模式：MM-DD 格式，如 "04-25" */
  datePattern: string;
  /** 事件类型 */
  type: CalendarEventType;
  /** 事件标题 */
  title: string;
  /** 相关角色ID（可选） */
  idolId?: string;
}

/**
 * 解析角色生日字符串（如 "4月25日"）为 MM-DD 格式
 */
function parseBirthdayToPattern(birthday: string): string | null {
  const match = birthday.match(/(\d+)月(\d+)日/);
  if (!match) return null;
  const month = String(parseInt(match[1])).padStart(2, '0');
  const day = String(parseInt(match[2])).padStart(2, '0');
  return `${month}-${day}`;
}

/**
 * 从角色数据生成生日事件
 */
export function generateBirthdayEvents(): CalendarEvent[] {
  return IDOLS.map(idol => {
    const datePattern = parseBirthdayToPattern(idol.birthday);
    if (!datePattern) return null;
    return {
      datePattern,
      type: 'birthday' as CalendarEventType,
      title: `${idol.name}生日`,
      idolId: idol.id,
    };
  }).filter((event): event is CalendarEvent => event !== null);
}

/**
 * 特殊节日/活动事件
 */
export const SPECIAL_EVENTS: CalendarEvent[] = [
  // 日本节日
  { datePattern: '01-01', type: 'festival', title: '元旦' },
  { datePattern: '01-02', type: 'festival', title: '正月二日' },
  { datePattern: '01-03', type: 'festival', title: '正月三日' },
  { datePattern: '02-03', type: 'festival', title: '节分' },
  { datePattern: '02-14', type: 'festival', title: '情人节' },
  { datePattern: '03-03', type: 'festival', title: '女儿节' },
  { datePattern: '03-14', type: 'festival', title: '白色情人节' },
  { datePattern: '04-01', type: 'festival', title: '愚人节' },
  { datePattern: '05-05', type: 'festival', title: '儿童节' },
  { datePattern: '07-07', type: 'festival', title: '七夕' },
  { datePattern: '08-15', type: 'festival', title: '盂兰盆节' },
  { datePattern: '09-15', type: 'festival', title: '敬老日' },
  { datePattern: '10-31', type: 'festival', title: '万圣节' },
  { datePattern: '11-03', type: 'festival', title: '文化日' },
  { datePattern: '12-24', type: 'festival', title: '圣诞夜' },
  { datePattern: '12-25', type: 'festival', title: '圣诞节' },
  { datePattern: '12-31', type: 'festival', title: '除夕' },

  // 闪耀色彩特殊日期
  { datePattern: '04-24', type: 'festival', title: '283 Pro 创立纪念日' },
];

/**
 * 获取指定日期的所有事件
 * @param dateStr YYYY-MM-DD 格式的日期
 * @returns 该日期的所有事件
 */
export function getEventsForDate(dateStr: string): CalendarEvent[] {
  const [, month, day] = dateStr.split('-');
  const pattern = `${month}-${day}`;

  const birthdayEvents = generateBirthdayEvents();
  const allEvents = [...birthdayEvents, ...SPECIAL_EVENTS];

  return allEvents.filter(event => event.datePattern === pattern);
}

/**
 * 获取指定月份的所有事件
 * @param month 月份 (1-12)
 * @returns 该月份的所有事件及其日期
 */
export function getEventsForMonth(month: number): Map<number, CalendarEvent[]> {
  const monthStr = String(month).padStart(2, '0');
  const birthdayEvents = generateBirthdayEvents();
  const allEvents = [...birthdayEvents, ...SPECIAL_EVENTS];

  const result = new Map<number, CalendarEvent[]>();

  for (const event of allEvents) {
    const [eventMonth, eventDay] = event.datePattern.split('-');
    if (eventMonth === monthStr) {
      const day = parseInt(eventDay);
      const existing = result.get(day) || [];
      existing.push(event);
      result.set(day, existing);
    }
  }

  return result;
}
