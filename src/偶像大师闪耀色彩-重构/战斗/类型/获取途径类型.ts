/**
 * 技能卡和P饮料的获取途径类型定义
 */

/**
 * 获取途径类型
 */
export type AcquisitionSource =
  | 'P卡专属' // P卡自带的专属技能卡
  | '回忆卡_初期' // 回忆卡提供，一开始就获得
  | '回忆卡_期中后' // 回忆卡提供，期中后获得
  | '训练完成' // 训练完成后奖励
  | '授课' // 授课活动奖励
  | '活动补给' // 活动补给获得
  | '自由活动' // 自由活动获得
  | '交谈' // 与角色交谈获得
  | '期中比赛' // 期中比赛奖励
  | '期末比赛' // 期末比赛奖励
  | '商店购买' // 商店购买
  | '初始拥有'; // 游戏初始就拥有

/**
 * 回忆卡类型
 */
export type SupportCardType = '初期型' | '期中后型';

/**
 * 回忆卡（S卡）数据
 */
export interface SupportCard {
  /** 回忆卡ID */
  id: string;

  /** 回忆卡名称 */
  name: string;

  /** 回忆卡类型（决定技能卡何时获得） */
  type: SupportCardType;

  /** 提供的技能卡ID列表（最多4张） */
  skillCardIds: string[];

  /** 稀有度 */
  rarity: 'R' | 'SR' | 'SSR';
}

/**
 * 获取途径配置
 */
export interface AcquisitionConfig {
  /** 获取来源 */
  source: AcquisitionSource;

  /** 获取时机描述 */
  timing?: string;

  /** 获取概率（0-1），如果是固定获得则为1 */
  probability?: number;

  /** 绑定的P卡ID（如果是P卡专属） */
  produceCardId?: string;

  /** 绑定的回忆卡ID（如果是回忆卡提供） */
  supportCardId?: string;

  /** 额外条件 */
  condition?: string;
}

/**
 * 培育事件类型
 */
export type ProduceEventType =
  | '训练_Vocal'
  | '训练_Dance'
  | '训练_Visual'
  | '授课'
  | '活动补给'
  | '自由活动'
  | '交谈'
  | '期中比赛'
  | '期末比赛'
  | '休息';

/**
 * 培育事件结果
 */
export interface ProduceEventResult {
  /** 事件类型 */
  eventType: ProduceEventType;

  /** 评价等级 */
  grade?: 'Perfect' | 'Great' | 'Good' | 'Normal' | 'Bad';

  /** 是否成功 */
  success: boolean;

  /** 获得的技能卡ID列表 */
  acquiredSkillCardIds?: string[];

  /** 获得的P饮料ID列表 */
  acquiredPDrinkIds?: string[];

  /** 属性变化 */
  attributeChanges?: {
    vocal?: number;
    dance?: number;
    visual?: number;
    stamina?: number;
  };
}

/**
 * 培育阶段
 */
export type ProducePhase = '初期' | '中期' | '期中后' | '后期' | '期末';

/**
 * 卡组构建来源
 */
export interface DeckBuildSource {
  /** P卡专属技能卡 */
  produceCardExclusive: string[];

  /** 回忆卡提供（初期） */
  supportCardsEarly: string[];

  /** 回忆卡提供（期中后） */
  supportCardsLate: string[];

  /** 培育过程获得 */
  acquiredDuringProduce: string[];
}
