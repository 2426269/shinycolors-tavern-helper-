/**
 * 偶像大师闪耀色彩 - 游戏数据类型定义
 *
 * 这个文件定义了整个游戏中使用的核心数据类型
 */

// ==================== 基础类型 ====================

/**
 * 稀有度类型
 */
export type Rarity = 'R' | 'SR' | 'SSR' | 'UR';

/**
 * 属性类型
 */
export type Attribute = 'Vocal' | 'Dance' | 'Visual';

/**
 * 卡牌类型（A/M/T）
 */
export type CardType = 'A' | 'M' | 'T';

/**
 * 培育计划类型
 */
export type PlanType = '感性' | '理性' | '非凡';

/**
 * 组合名称类型
 */
export type UnitName =
  | 'illumination STARS'
  | "L'Antica"
  | 'Houkago Climax Girls'
  | 'Alstroemeria'
  | 'Straylight'
  | 'noctchill'
  | 'CoMETIK'
  | 'SHHis';

// ==================== 偶像相关 ====================

/**
 * 偶像基础信息
 */
export interface Idol {
  id: string; // 偶像ID（如 'mano', 'hiori'）
  name: string; // 偶像名称（如 '樱木真乃'）
  unit: UnitName; // 所属组合
  color: string; // 代表颜色
  age: number; // 年龄
  birthday: string; // 生日（如 '4月25日'）
  zodiac: string; // 星座
  height: number; // 身高（cm）
  weight: number; // 体重（kg）
  handedness: string; // 利手（左/右/两利）
  threeSize: string; // 三围
  bloodType: string; // 血型
  shoeSize: string; // 鞋码
  hometown: string; // 出身地
  hobbies: string; // 兴趣
  skills: string; // 特技
  cv: string; // 声优
  description: string; // 简介
}

// ==================== 卡牌相关 ====================

/**
 * P卡（偶像卡）完整信息
 */
export interface RealCard {
  id: string; // 卡牌ID
  fullName: string; // 完整名称（偶像+主题）
  fullCardName: string; // 完整卡牌名称
  characterId: string; // 角色ID
  characterName: string; // 角色名称
  unit: UnitName; // 所属组合
  rarity: Rarity; // 稀有度
  attribute: Attribute; // 属性
  image: string; // 未觉醒卡面文件名
  awakenedImage: string; // 觉醒后卡面文件名
  theme: string; // 卡面主题
  releaseDate: string; // 发布日期
  limited: boolean; // 是否限定
  fes: boolean; // 是否Fes限定
  planType?: PlanType; // 培育计划类型
  stats?: CardStats; // 卡牌属性
}

/**
 * 卡牌属性值
 */
export interface CardStats {
  stamina: number; // 体力
  vocal: number; // Vocal
  dance: number; // Dance
  visual: number; // Visual
  style: string; // 推荐流派
  styleIcon: string; // 流派图标URL
}

/**
 * 技能卡（战斗用）
 */
export interface SkillCard {
  id: string; // 技能卡ID
  name: string; // 技能名称
  description: string; // 技能描述
  effect: string; // 技能效果
  rarity: Rarity; // 稀有度
  type: CardType; // 卡牌类型
  cost: number; // 体力消耗
  costType: 'normal' | 'stamina_only'; // 消耗类型
  unique: boolean; // 是否"重复不可"
  enhanced: boolean; // 是否已强化
  source: 'ai' | 'official'; // 来源（AI生成/官方数据）
}

// ==================== 抽卡相关 ====================

/**
 * 抽卡结果
 */
export interface GachaResult {
  cards: RealCard[]; // 抽到的卡牌
  isNew: boolean[]; // 是否新卡
  rarity: Rarity[]; // 稀有度
  stardust: number; // 获得的星尘
}

/**
 * 卡池配置
 */
export interface GachaPool {
  id: string; // 卡池ID
  name: string; // 卡池名称
  description: string; // 描述
  featured: string[]; // UP卡牌ID列表
  startDate: string; // 开始时间
  endDate: string; // 结束时间
  limited: boolean; // 是否限定卡池
  fes: boolean; // 是否Fes卡池
}

/**
 * 保底数据
 */
export interface PityData {
  totalPulls: number; // 总抽数
  ssrPity: number; // SSR保底计数
  urPity: number; // UR保底计数
  lastSSR: number; // 距离上次SSR的抽数
  lastUR: number; // 距离上次UR的抽数
}

// ==================== 培育相关 ====================

/**
 * 培育会话数据
 */
export interface ProduceSession {
  id: string; // 会话ID
  idolId: string; // 偶像ID
  cardId: string; // 使用的P卡ID
  scenario: string; // 剧本ID
  currentTurn: number; // 当前回合
  maxTurns: number; // 总回合数
  stats: ProduceStats; // 当前属性
  skillDeck: SkillCard[]; // 技能卡组
  pDrinks: PDrink[]; // P饮料列表
  pItems: PItem[]; // P道具列表
  bondLevel: number; // 好感度
  history: ProduceHistory[]; // 历史记录
}

/**
 * 培育属性
 */
export interface ProduceStats {
  vocal: number; // Vocal
  dance: number; // Dance
  visual: number; // Visual
  stamina: number; // 当前体力
  maxStamina: number; // 最大体力
  genki: number; // 元气
}

/**
 * P饮料
 */
export interface PDrink {
  id: string; // 饮料ID
  name: string; // 饮料名称
  effect: any; // 效果（待详细定义）
}

/**
 * P道具
 */
export interface PItem {
  id: string; // 道具ID
  name: string; // 道具名称
  effect: any; // 效果（待详细定义）
}

/**
 * 培育历史记录
 */
export interface ProduceHistory {
  turn: number; // 回合数
  action: string; // 行动类型
  result: string; // 结果
  rewards: any; // 奖励
}

/**
 * 剧本配置
 */
export interface Scenario {
  id: string; // 剧本ID
  name: string; // 剧本名称
  description: string; // 描述
  turns: number; // 回合数
  difficulty: string[]; // 难度等级
  initialStats: ProduceStats; // 初始属性
  specialRules: Record<string, string>; // 特殊规则
  rivals: Rival[]; // 对手列表
  examCriteria: Record<string, ExamCriteria>; // 审查基准
}

/**
 * 对手信息
 */
export interface Rival {
  name: string; // 对手名称
  stats: {
    vocal: number;
    dance: number;
    visual: number;
  };
  difficulty: number; // 难度系数
}

/**
 * 审查基准（比赛属性权重）
 */
export interface ExamCriteria {
  vocal: number; // Vocal权重
  dance: number; // Dance权重
  visual: number; // Visual权重
}

// ==================== 好感度相关 ====================

/**
 * 好感度数据
 */
export interface AffectionData {
  idolId: string; // 偶像ID
  level: number; // 好感度等级（0-1850）
  stories: string[]; // 已解锁的剧情ID列表
}

/**
 * 好感度剧情
 */
export interface AffectionStory {
  id: string; // 剧情ID
  idolId: string; // 偶像ID
  level: number; // 解锁等级
  title: string; // 剧情标题
  unlocked: boolean; // 是否已解锁
}

// ==================== 游戏资源相关 ====================

/**
 * 游戏资源数据
 */
export interface GameResources {
  featherStones: number; // 羽石
  fans: number; // 粉丝数
  producerLevel: number; // 制作人等级
  producerExp: number; // 制作人经验
  stardust: number; // 星尘
}

/**
 * 拥有的卡牌数据
 */
export interface OwnedCards {
  [cardId: string]: {
    count: number; // 拥有数量
    new: boolean; // 是否新卡
    obtainedDate: string; // 获得日期
  };
}

// ==================== 图鉴相关 ====================

/**
 * 图鉴显示用的卡牌数据
 */
export interface DisplayCard extends RealCard {
  owned: boolean; // 是否拥有
  imageUrl: string; // 缩略图URL
  fullImageUrl?: string; // 完整卡面URL
  awakenedImageUrl?: string; // 觉醒后卡面URL
  skill?: {
    // 技能卡信息
    name: string;
    description: string;
    effect: string;
  } | null; // null表示未生成
}

/**
 * 筛选条件
 */
export interface FilterOptions {
  rarity?: Rarity[]; // 稀有度筛选
  attribute?: Attribute[]; // 属性筛选
  character?: string[]; // 角色筛选
  unit?: UnitName[]; // 组合筛选
  owned?: boolean; // 是否拥有
  limited?: boolean; // 是否限定
  fes?: boolean; // 是否Fes
}

/**
 * 排序选项
 */
export type SortOption = 'rarity' | 'date' | 'character' | 'attribute';

// ==================== Spine动画相关 ====================

/**
 * Spine资源配置
 */
export interface SpineResource {
  idolId: string; // 偶像ID
  costume: string; // 服装ID
  jsonUrl: string; // .json文件URL
  atlasUrl: string; // .atlas文件URL
  pngUrl: string; // .png文件URL
}

/**
 * 动画类型
 */
export type AnimationType =
  | 'Idle' // 待机
  | 'Talk_01' // 说话
  | 'Emotion_Happy' // 开心
  | 'Emotion_Sad' // 难过
  | 'Emotion_Surprise' // 惊讶
  | 'Emotion_Shy' // 害羞
  | 'Emotion_Angry' // 生气
  | 'Touch_Head' // 摸头
  | 'Touch_Hand' // 握手
  | 'Touch_Body' // 触碰身体
  | 'Battle_Idle' // 战斗待机
  | 'Battle_Cast' // 战斗施法
  | 'Battle_Attack' // 战斗攻击
  | 'Battle_Buff' // 战斗Buff
  | 'Battle_Hurt' // 战斗受伤
  | 'Battle_Victory' // 战斗胜利
  | 'Battle_Defeat'; // 战斗失败

// ==================== 导出所有类型 ====================

export type {};
