/**
 * 抽卡系统类型定义
 */

/** 稀有度 */
export type Rarity = 'R' | 'SR' | 'SSR' | 'UR';

/** 角色基础信息 */
export interface Character {
  name: string; // 櫻木真乃
  en: string; // Sakuragi.Mano
  unit: string; // Illumination STARS
}

/** 抽卡结果 */
export interface GachaResult {
  characterEn: string; // Sakuragi.Mano
  characterName: string; // 櫻木真乃
  rarity: Rarity; // SSR
  cardNumber: number; // 3
  fullCardName: string; // 【駅線上の日常】櫻木 真乃
  imageUrl: string; // 完整图片URL
  isNew: boolean; // 是否新获得
  stardust?: number; // 重复转星尘数量
}

/** 用户抽卡数据 */
export interface GachaUserData {
  // 注意：羽石由主界面的 resources.featherStones 管理，不在这里存储
  stardust: number; // 星尘
  level: number; // 玩家等级
  exp: number; // 经验值

  // 拥有的角色卡
  ownedCards: {
    [cardId: string]: {
      // cardId格式: "Sakuragi.Mano_SSR_03"
      fullName: string; // 完整卡名
      obtainedAt: string; // 获得时间
      hasSkill: boolean; // 是否已生成独特技能
    };
  };

  // 保底计数
  pity: {
    totalPulls: number; // 总抽卡数
    ssrPity: number; // 距上次SSR的抽数
    urPity: number; // 距上次UR的抽数
  };

  // 抽卡历史（最近100条）
  history: GachaRecord[];
}

/** 抽卡记录 */
export interface GachaRecord {
  id: string;
  timestamp: number;
  type: 'single' | 'ten';
  cost: number;
  results: {
    cardId: string;
    rarity: Rarity;
    isNew: boolean;
    stardust?: number;
  }[];
}

/** 独特技能 */
export interface UniqueSkill {
  cardId: string; // 对应的角色卡ID
  name: string; // 技能名
  type: 'Vo' | 'Da' | 'Vi' | 'Mental' | 'Support';
  description: string; // 技能描述
  effect: {
    target: string; // 影响目标
    value: string; // 数值
    duration: string; // 持续时间
  };
  supportCardImage: string; // 支援卡图片URL
  generatedAt: string; // 生成时间
}

/** 卡池配置 */
export interface GachaPool {
  id: string; // 卡池ID，如 'starry-night'
  name: string; // 卡池名称，如 '星月夜を歩いて'
  description: string; // 卡池描述
  pickupCard: RealCard; // UP角色
  cards: RealCard[]; // 所有可抽取卡片（不包括UP角色）
  thumbnailUrl: string; // 缩略图URL
  backgroundUrl: string; // 背景图URL
  startDate: string; // 开始时间
  endDate: string; // 结束时间
  status: 'active' | 'upcoming' | 'expired'; // 卡池状态
}

/** 卡池统计信息 */
export interface PoolStats {
  total: number; // 总卡片数
  ur: number; // UR数量
  ssr: number; // SSR数量
  sr: number; // SR数量
  pickup: number; // UP角色数量
}

/** 真实卡片数据（基于实际图片资源） */
export interface RealCard {
  fullName: string; // 完整卡名，格式：【主题名】角色名
  theme: string; // 主题名（日文）
  character: string; // 角色名（日文）
  baseImage: string; // 基础卡面文件名（含.webp后缀）
  awakenedImage: string; // 觉醒卡面文件名（含+和.webp后缀）
  rarity: Rarity; // 稀有度
  isPickup?: boolean; // 是否为UP卡（可选）
}
