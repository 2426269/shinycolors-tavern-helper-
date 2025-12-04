/**
 * 偶像组合配置
 *
 * 数据来源：用户提供（2025-10-31）
 * 注意：此文件为权威数据源，其他地方引用组合信息应导入此文件
 */

// CDN基础URL
const CDN_BASE = 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main';
const UNIT_ICON_BASE = `${CDN_BASE}/组合小图标`;

/**
 * 构建组合图标URL
 */
function buildUnitIconUrl(unitName: string): string {
  return `${UNIT_ICON_BASE}/${encodeURIComponent(unitName)}.webp`;
}

export interface IdolUnit {
  id: string;
  name: string;
  nameJa: string; // 日文名称
  icon: string; // emoji图标（用于文本显示）
  iconUrl: string; // 图片URL（用于实际显示）
  members: string[]; // 成员日文名称
}

/**
 * 所有偶像组合
 */
export const IDOL_UNITS: IdolUnit[] = [
  {
    id: 'illumination',
    name: 'illumination STARS',
    nameJa: 'illumination STARS',
    icon: '🌟',
    iconUrl: buildUnitIconUrl('illumination STARS'),
    members: ['櫻木真乃', '風野灯織', '八宮めぐる'],
  },
  {
    id: 'lantica',
    name: "L'Antica",
    nameJa: "L'Antica",
    icon: '🎭',
    iconUrl: buildUnitIconUrl("L'Antica"),
    members: ['月岡恋鐘', '田中摩美々', '白瀬咲耶', '三峰結華', '幽谷霧子'],
  },
  {
    id: 'climax',
    name: '放課後CLIMAX GIRLS',
    nameJa: '放課後CLIMAX GIRLS',
    icon: '🎸',
    iconUrl: buildUnitIconUrl('放学后CLIMAX GIRLS'), // 注意：文件名是"放学后"不是"放課後"
    members: ['小宮果穂', '園田智代子', '西城樹里', '杜野凛世', '有栖川夏葉'],
  },
  {
    id: 'alstroemeria',
    name: 'ALSTROEMERIA',
    nameJa: 'ALSTROEMERIA',
    icon: '🌺',
    iconUrl: buildUnitIconUrl('ALSTROEMERIA'),
    members: ['大崎甘奈', '大崎甜花', '桑山千雪'],
  },
  {
    id: 'straylight',
    name: 'Straylight',
    nameJa: 'Straylight',
    icon: '⚡',
    iconUrl: buildUnitIconUrl('Straylight'),
    members: ['芹沢あさひ', '黛冬優子', '和泉愛依'],
  },
  {
    id: 'noctchill',
    name: 'noctchill',
    nameJa: 'noctchill',
    icon: '🌙',
    iconUrl: buildUnitIconUrl('noctchill'),
    members: ['浅倉透', '樋口円香', '福丸小糸', '市川雛菜'],
  },
  {
    id: 'shhis',
    name: 'SHHis',
    nameJa: 'SHHis',
    icon: '🎪',
    iconUrl: buildUnitIconUrl('SHHis'),
    members: ['七草にちか', '緋田美琴'],
  },
  {
    id: 'cometik',
    name: 'CoMETIK',
    nameJa: 'CoMETIK',
    icon: '☄️',
    iconUrl: buildUnitIconUrl('CoMETIK'),
    members: ['斑鳩ルカ', '鈴木羽那', '郁田はるき'],
  },
];

/**
 * 根据角色名获取所属组合
 */
export function getUnitsByCharacter(characterName: string): IdolUnit[] {
  return IDOL_UNITS.filter(unit => unit.members.includes(characterName));
}

/**
 * 根据组合ID获取组合信息
 */
export function getUnitById(unitId: string): IdolUnit | undefined {
  return IDOL_UNITS.find(unit => unit.id === unitId);
}

/**
 * 获取所有偶像名称（去重）
 */
export function getAllIdolNames(): string[] {
  const names = new Set<string>();
  IDOL_UNITS.forEach(unit => {
    unit.members.forEach(member => names.add(member));
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'ja'));
}

/**
 * 组合成员数量统计
 */
export const UNIT_STATS = {
  totalUnits: IDOL_UNITS.length,
  totalIdols: getAllIdolNames().length,
  unitSizes: IDOL_UNITS.map(unit => ({
    name: unit.name,
    memberCount: unit.members.length,
  })),
};


