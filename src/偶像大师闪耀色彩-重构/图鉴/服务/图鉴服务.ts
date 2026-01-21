/**
 * 偶像图鉴服务
 *
 * 负责处理图鉴相关的业务逻辑
 */

import { buildUrlFromFileName } from '../../工具/卡牌工具';
import type { DisplayCard, FilterOptions, RealCard, SortOption } from '../../类型/游戏数据类型';

/**
 * 将RealCard转换为DisplayCard
 */
export function convertToDisplayCard(card: RealCard, owned: boolean = false): DisplayCard {
  return {
    ...card,
    owned,
    imageUrl: buildUrlFromFileName(card.image, false),
    fullImageUrl: buildUrlFromFileName(card.image, false),
    awakenedImageUrl: buildUrlFromFileName(card.awakenedImage || card.image, true),
    skill: null, // 默认未生成技能卡
  };
}

/**
 * 筛选卡牌
 */
export function filterCards(cards: DisplayCard[], filters: FilterOptions): DisplayCard[] {
  let filtered = [...cards];

  // 稀有度筛选
  if (filters.rarity && filters.rarity.length > 0) {
    filtered = filtered.filter(card => filters.rarity!.includes(card.rarity));
  }

  // 属性筛选
  if (filters.attribute && filters.attribute.length > 0) {
    filtered = filtered.filter(card => filters.attribute!.includes(card.attribute));
  }

  // 角色筛选
  if (filters.character && filters.character.length > 0) {
    filtered = filtered.filter(card => filters.character!.includes(card.characterName));
  }

  // 组合筛选
  if (filters.unit && filters.unit.length > 0) {
    filtered = filtered.filter(card => filters.unit!.includes(card.unit));
  }

  // 拥有筛选
  if (filters.owned !== undefined) {
    filtered = filtered.filter(card => card.owned === filters.owned);
  }

  // 限定筛选
  if (filters.limited !== undefined) {
    filtered = filtered.filter(card => card.limited === filters.limited);
  }

  // Fes筛选
  if (filters.fes !== undefined) {
    filtered = filtered.filter(card => card.fes === filters.fes);
  }

  return filtered;
}

/**
 * 排序卡牌
 */
export function sortCards(cards: DisplayCard[], sortBy: SortOption): DisplayCard[] {
  const sorted = [...cards];
  const rarityOrder = { UR: 4, SSR: 3, SR: 2, R: 1 };
  const attributeOrder = { Vocal: 1, Dance: 2, Visual: 3 };

  switch (sortBy) {
    case 'rarity':
      // SSR > SR > R
      sorted.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
      break;

    case 'date':
      // 按发布日期排序
      sorted.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
      break;

    case 'character':
      // 按角色名排序
      sorted.sort((a, b) => a.characterName.localeCompare(b.characterName));
      break;

    case 'attribute':
      // 按属性排序：Vocal > Dance > Visual
      sorted.sort((a, b) => attributeOrder[a.attribute] - attributeOrder[b.attribute]);
      break;
  }

  return sorted;
}

/**
 * 从localStorage加载技能卡数据
 * T-15: 返回完整卡牌对象（包括 engine_data）
 */
export function loadSkillCard(cardFullName: string): any | null {
  try {
    const skillData = localStorage.getItem(`skill_${cardFullName}`);
    if (skillData) {
      return JSON.parse(skillData);
    }
  } catch (error) {
    console.error(`加载技能卡失败: ${cardFullName}`, error);
  }
  return null;
}

/**
 * 保存技能卡数据到localStorage
 * T-15: 保存完整卡牌对象（包括 engine_data、display、effectEntries 等）
 */
export function saveSkillCard(cardFullName: string, skill: any): void {
  try {
    // T-Repair: 检查是否为修复模式保存
    if (skill.repair_meta) {
      const existing = loadSkillCard(cardFullName);
      if (existing && existing.engine_data) {
        // 如果现有数据有 engine_data，且没有 engine_data_original，则备份
        if (!existing.engine_data_original) {
          skill.engine_data_original = existing.engine_data;
          console.log(`🔧 [saveSkillCard] 备份原始 engine_data`);
        } else {
          // 如果已有备份，保留原备份
          skill.engine_data_original = existing.engine_data_original;
        }
      }
    }

    localStorage.setItem(`skill_${cardFullName}`, JSON.stringify(skill));
    console.log(`💾 [saveSkillCard] 已保存完整卡牌数据: ${cardFullName}`, {
      hasEngineData: !!skill.engine_data,
      hasDisplay: !!skill.display,
      isRepair: !!skill.repair_meta,
    });
  } catch (error) {
    console.error(`保存技能卡失败: ${cardFullName}`, error);
  }
}
