/**
 * 回忆卡类型定义
 */

// 回忆卡效果类型
export type MemoryEffectType =
  | 'stat_boost' // 属性加成
  | 'skill_card' // 获得技能卡
  | 'lesson_bonus' // 训练加成
  | 'stamina_boost' // 体力加成
  | 'event_trigger'; // 触发事件

// 回忆卡效果
export interface MemoryEffect {
  type: MemoryEffectType;
  target?: string; // vocal/dance/visual 等
  value: number;
  description: string;
}

// 回忆卡稀有度
export type MemoryRarity = 'SSR' | 'SR' | 'R';

// 回忆卡数据
export interface MemoryCard {
  id: string;
  cardName: string; // 卡名
  characterId: string; // 角色ID
  characterName: string; // 角色名
  imageUrl: string; // 卡面图片
  rarity: MemoryRarity; // 稀有度
  level: number; // 等级
  maxLevel: number; // 最大等级
  uncap: number; // 解放次数 (0-4)
  effects: MemoryEffect[]; // 效果列表
  skillCards?: string[]; // 获得的技能卡
}

// 回忆卡槽位
export interface MemorySlot {
  card: MemoryCard | null;
}

// 回忆卡编成 (4张)
export interface MemoryFormation {
  name: string;
  slots: MemorySlot[];
}

// 创建空槽位
export function createEmptyMemorySlot(): MemorySlot {
  return { card: null };
}

// 创建空编成 (4槽位)
export function createEmptyMemoryFormation(): MemoryFormation {
  return {
    name: '回忆编成 1',
    slots: Array.from({ length: 4 }, () => createEmptyMemorySlot()),
  };
}

// 计算编成加成
export function calculateMemoryBonus(formation: MemoryFormation): {
  vocal: number;
  dance: number;
  visual: number;
} {
  const bonus = { vocal: 0, dance: 0, visual: 0 };

  for (const slot of formation.slots) {
    if (!slot.card) continue;

    for (const effect of slot.card.effects) {
      if (effect.type === 'stat_boost' || effect.type === 'lesson_bonus') {
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
        }
      }
    }
  }

  return bonus;
}
