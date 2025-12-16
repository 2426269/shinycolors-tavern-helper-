/**
 * 支援卡类型定义
 */

/** 支援卡效果类型 */
export type SupportEffectType =
  | 'lesson_bonus' // 课程属性加成
  | 'sp_rate' // SP课程出现率
  | 'stamina_recovery' // 体力恢复
  | 'initial_buff' // 初始Buff
  | 'card_effect' // 技能卡效果加成
  | 'exam_bonus'; // 比赛加成

/** 支援卡效果 */
export interface SupportEffect {
  type: SupportEffectType;
  /** 效果目标 (如 'vocal', 'dance', 'visual', 'all') */
  target?: string;
  /** 效果数值 */
  value: number;
  /** 效果描述 */
  description: string;
}

/** 支援卡数据 */
export interface SupportCard {
  id: string;
  /** 角色ID */
  characterId: string;
  /** 角色名 */
  characterName: string;
  /** 卡面名称 */
  cardName: string;
  /** 卡面图片URL */
  imageUrl: string;
  /** 稀有度 */
  rarity: 'R' | 'SR' | 'SSR';
  /** 等级 */
  level: number;
  /** 最大等级 */
  maxLevel: number;
  /** 突破次数 */
  uncap: number;
  /** 支援卡效果列表 */
  effects: SupportEffect[];
  /** 专属技能卡ID（可选） */
  exclusiveCardId?: string;
}

/** 支援卡槽位 */
export interface SupportSlot {
  index: number;
  card: SupportCard | null;
  /** 是否为租借槽位 */
  isRental: boolean;
}

/** 支援卡编成 */
export interface SupportFormation {
  /** 6个支援卡槽位 */
  slots: [SupportSlot, SupportSlot, SupportSlot, SupportSlot, SupportSlot, SupportSlot];
  /** 编成名称 */
  name: string;
  /** 总加成预览 */
  totalBonus: {
    vocal: number;
    dance: number;
    visual: number;
  };
}

/** 创建空槽位 */
export function createEmptySlot(index: number): SupportSlot {
  return {
    index,
    card: null,
    isRental: false,
  };
}

/** 创建空编成 */
export function createEmptyFormation(name = '支援卡编成'): SupportFormation {
  return {
    slots: [
      createEmptySlot(0),
      createEmptySlot(1),
      createEmptySlot(2),
      createEmptySlot(3),
      createEmptySlot(4),
      createEmptySlot(5),
    ],
    name,
    totalBonus: { vocal: 0, dance: 0, visual: 0 },
  };
}

/** 计算编成总加成 */
export function calculateFormationBonus(formation: SupportFormation): { vocal: number; dance: number; visual: number } {
  const bonus = { vocal: 0, dance: 0, visual: 0 };

  for (const slot of formation.slots) {
    if (!slot.card) continue;

    for (const effect of slot.card.effects) {
      if (effect.type === 'lesson_bonus') {
        switch (effect.target) {
          case 'vocal':
            bonus.vocal += effect.value;
            break;
          case 'dance':
            bonus.dance += effect.value;
            break;
          case 'visual':
            bonus.visual += effect.value;
            break;
          case 'all':
            bonus.vocal += effect.value;
            bonus.dance += effect.value;
            bonus.visual += effect.value;
            break;
        }
      }
    }
  }

  return bonus;
}
