/**
 * VisualRegistry - 动态图标注册表
 * 管理 AI 生成的自定义 Tag/Buff 视觉提示
 */

export interface DynamicVisual {
  /** 唯一标识符（与 Tag/Buff ID 对应） */
  key: string;
  /** 类型：tag 或 buff */
  kind?: 'tag' | 'buff';
  /** 显示符号（1-2个字符） */
  symbol: string;
  /** 主题颜色（十六进制） */
  color: string;
  /** 是否为负面效果 */
  isDebuff: boolean;
  /** 简短名称 */
  shortName: string;
  /** 详细描述 */
  description: string;
  /** 图标URL（可选） */
  iconUrl?: string;
}

/** 标准 Buff 图标映射 */
const STANDARD_BUFF_VISUALS: Record<string, DynamicVisual> = {
  // === 感性系 ===
  GoodCondition: {
    key: 'GoodCondition',
    kind: 'buff',
    symbol: '調',
    color: '#FF9800',
    isDebuff: false,
    shortName: '好调',
    description: '技能卡得分量增加50%',
    iconUrl: 'https://283pro.site/shinycolors/游戏图标/好调.png',
  },
  ExcellentCondition: {
    key: 'ExcellentCondition',
    kind: 'buff',
    symbol: '絶',
    color: '#FF5722',
    isDebuff: false,
    shortName: '绝好调',
    description: '使好调的倍率额外增加',
    iconUrl: 'https://283pro.site/shinycolors/游戏图标/绝好调.png',
  },
  Concentration: {
    key: 'Concentration',
    kind: 'buff',
    symbol: '集',
    color: '#2196F3',
    isDebuff: false,
    shortName: '集中',
    description: '每层增加技能卡得分',
    iconUrl: 'https://283pro.site/shinycolors/游戏图标/集中.png',
  },

  // === 理性系 ===
  Motivation: {
    key: 'Motivation',
    kind: 'buff',
    symbol: '劲',
    color: '#4CAF50',
    isDebuff: false,
    shortName: '干劲',
    description: '增强元气回复效果',
    iconUrl: 'https://283pro.site/shinycolors/游戏图标/干劲.png',
  },
  GoodImpression: {
    key: 'GoodImpression',
    kind: 'buff',
    symbol: '印',
    color: '#E91E63',
    isDebuff: false,
    shortName: '好印象',
    description: '回合结束时获得分数',
    iconUrl: 'https://283pro.site/shinycolors/游戏图标/好印象.png',
  },

  // === 非凡系 ===
  AlloutState: {
    key: 'AlloutState',
    kind: 'buff',
    symbol: '全',
    color: '#9C27B0',
    isDebuff: false,
    shortName: '全力',
    description: '全力状态',
    iconUrl: 'https://283pro.site/shinycolors/游戏图标/全力值.png',
  },
  ConserveState: {
    key: 'ConserveState',
    kind: 'buff',
    symbol: '温',
    color: '#00BCD4',
    isDebuff: false,
    shortName: '温存',
    description: '温存状态',
    iconUrl: 'https://283pro.site/shinycolors/游戏图标/温存.png',
  },
  ResoluteState: {
    key: 'ResoluteState',
    kind: 'buff',
    symbol: '强',
    color: '#F44336',
    isDebuff: false,
    shortName: '强气',
    description: '强气状态',
    iconUrl: 'https://283pro.site/shinycolors/游戏图标/强气.png',
  },

  // === 通用 ===
  CostReduction: {
    key: 'CostReduction',
    kind: 'buff',
    symbol: '减',
    color: '#607D8B',
    isDebuff: false,
    shortName: '消费体力减少',
    description: '技能卡所需体力减少50%',
    iconUrl: 'https://283pro.site/shinycolors/游戏图标/消费体力减少.png',
  },
};

/**
 * VisualRegistry 类
 */
class VisualRegistry {
  /** 动态注册的图标 */
  private dynamicVisuals: Map<string, DynamicVisual> = new Map();

  constructor() {
    // 初始化标准图标
    Object.entries(STANDARD_BUFF_VISUALS).forEach(([key, visual]) => {
      this.dynamicVisuals.set(key, visual);
    });
  }

  /**
   * 注册动态图标（来自 AI 生成的 visuals 数组）
   */
  register(visual: DynamicVisual): void {
    this.dynamicVisuals.set(visual.key, visual);
    console.log(`📌 注册动态图标: ${visual.shortName} (${visual.key})`);
  }

  /**
   * 批量注册
   */
  registerAll(visuals: DynamicVisual[]): void {
    visuals.forEach(v => this.register(v));
  }

  /**
   * 获取图标配置
   */
  get(key: string): DynamicVisual | undefined {
    return this.dynamicVisuals.get(key);
  }

  /**
   * 检查是否存在
   */
  has(key: string): boolean {
    return this.dynamicVisuals.has(key);
  }

  /**
   * 获取所有已注册的图标
   */
  getAll(): DynamicVisual[] {
    return Array.from(this.dynamicVisuals.values());
  }

  /**
   * 生成默认图标（用于未注册的 Tag/Buff）
   */
  generateDefault(key: string, isDebuff: boolean = false): DynamicVisual {
    // 取第一个字符作为符号
    const symbol = key.charAt(0).toUpperCase();

    return {
      key,
      kind: 'tag',
      symbol,
      color: isDebuff ? '#FF6B6B' : '#7A5CFF',
      isDebuff,
      shortName: key,
      description: '自定义效果',
    };
  }

  /**
   * 获取图标配置（不存在则生成默认）
   */
  getOrDefault(key: string, isDebuff: boolean = false): DynamicVisual {
    return this.get(key) || this.generateDefault(key, isDebuff);
  }

  /**
   * 清空动态注册（保留标准图标）
   */
  clearDynamic(): void {
    this.dynamicVisuals.clear();
    Object.entries(STANDARD_BUFF_VISUALS).forEach(([key, visual]) => {
      this.dynamicVisuals.set(key, visual);
    });
  }
}

// 导出单例
export const visualRegistry = new VisualRegistry();

// 导出类型和标准图标
export { STANDARD_BUFF_VISUALS };
