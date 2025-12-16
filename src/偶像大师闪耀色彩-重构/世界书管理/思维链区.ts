/**
 * 思维链区
 * 负责为不同AI生成模式提供思维链提示词
 */

/**
 * 思维链模式枚举
 */
export enum ChainOfThoughtMode {
  /** 技能卡生成模式 */
  SKILL_CARD_GENERATION = 'skill_card_generation',
  // 未来可扩展其他模式：
  // PRODUCE_EVENT = 'produce_event',
  // STORY_GENERATION = 'story_generation',
  // etc.
}

/**
 * 思维链管理器
 */
export class ChainOfThoughtManager {
  /**
   * 技能卡生成模式思维链
   */
  static getSkillCardGenerationChain(): string {
    return `[Chain of thought]
<think>
## 1. 角色理解
- 角色名称和主题卡是什么？
- 这位偶像的核心性格特点？
- 如果有卡面图，图中展现了什么场景/氛围？

## 2. 卡牌类型选择
- 这张卡应该是主动卡还是精神卡？
- 主动卡：包含"数值+X"，直接提分
- 精神卡：仅资源/状态，不含数值

## 3. 命名构思
- 命名灵感来源：角色性格、卡牌主题、角色台词、故事场景
- ❌ 禁止：从培育计划联想（理性→演算、非凡→挑战）

## 4. 流派确认
- 当前推荐流派是什么？
- 该流派的核心资源是什么？
- 效果是否围绕核心资源设计？

## 5. 效果设计
- 参考示例卡的数值范围
- 主动卡必须包含"数值+X"
- 强化后提升是否明显？

## 6. 格式检查
- type字段是否为"主动"或"精神"？
- effectEntries 数组非空？
- 所有 effect 字段纯中文？
</think>

以下是生成的技能卡JSON：
[/Chain of thought]
`;
  }

  /**
   * 获取指定模式的思维链（优先使用自定义格式）
   */
  static getChain(mode: ChainOfThoughtMode): string {
    // 先尝试从全局变量读取自定义格式
    try {
      const globalVars = getVariables({ type: 'global' });
      const customChainKey = `chain_of_thought_${mode}`;
      if (typeof globalVars[customChainKey] === 'string' && globalVars[customChainKey].trim()) {
        console.log(`✅ 使用自定义思维链格式: ${mode}`);
        return globalVars[customChainKey];
      }
    } catch (error) {
      console.warn('⚠️ 读取自定义思维链格式失败，使用默认格式:', error);
    }

    // 如果没有自定义格式，使用默认格式
    switch (mode) {
      case ChainOfThoughtMode.SKILL_CARD_GENERATION:
        return this.getSkillCardGenerationChain();
      default:
        console.error(`❌ 未知的思维链模式: ${mode}`);
        return '';
    }
  }

  /**
   * 获取指定模式的默认思维链（用于显示和恢复）
   */
  static getDefaultChain(mode: ChainOfThoughtMode): string {
    switch (mode) {
      case ChainOfThoughtMode.SKILL_CARD_GENERATION:
        return this.getSkillCardGenerationChain();
      default:
        return '';
    }
  }

  /**
   * 获取模式对应的名称
   */
  private static getModeName(mode: ChainOfThoughtMode): string {
    const modeNames: Record<ChainOfThoughtMode, string> = {
      [ChainOfThoughtMode.SKILL_CARD_GENERATION]: '技能卡生成思维链',
    };
    return modeNames[mode] || '未知模式思维链';
  }

  /**
   * 所有思维链共用的固定UID
   */
  private static readonly CHAIN_UID = 999999999; // 使用固定的大数字作为UID

  /**
   * 将思维链添加到/更新到世界书（所有模式共用同一个条目）
   * @param worldbookName 世界书名称
   * @param mode 思维链模式
   * @returns Promise<void>
   */
  static async addChainToWorldbook(worldbookName: string, mode: ChainOfThoughtMode): Promise<void> {
    const chainContent = this.getChain(mode);
    const modeName = this.getModeName(mode);

    // 确保世界书存在
    const worldbooks = getWorldbookNames();
    if (!worldbooks.includes(worldbookName)) {
      console.log(`📚 创建新世界书: ${worldbookName}`);
      createWorldbook(worldbookName);
    }

    // 获取世界书内容
    const worldbook = await getWorldbook(worldbookName);

    // 检查条目是否已存在
    const entryIndex = worldbook.findIndex(entry => entry.uid === this.CHAIN_UID);

    const entry = {
      name: `思维链提示词（当前模式: ${modeName}）`,
      content: chainContent,
      uid: this.CHAIN_UID,
      enabled: true,
      strategy: {
        type: 'constant' as const,
        keys: [],
        keys_secondary: {
          logic: 'and_any' as const,
          keys: [],
        },
        scan_depth: 'same_as_global' as const,
      },
      position: {
        type: 'at_depth' as const,
        role: 'system' as const,
        depth: 0,
        order: 300,
      },
      probability: 100,
      recursion: {
        prevent_incoming: true,
        prevent_outgoing: true,
        delay_until: null,
      },
      effect: {
        sticky: null,
        cooldown: null,
        delay: null,
      },
      extra: {
        entry_type: 'chain_of_thought',
        mode: mode,
        current_mode: modeName,
      },
    };

    if (entryIndex !== -1) {
      // 更新现有条目
      worldbook[entryIndex] = entry;
      console.log(`🔄 更新思维链条目内容: ${modeName}`);
    } else {
      // 添加新条目
      worldbook.push(entry);
      console.log(`✨ 创建思维链条目: ${modeName}`);
    }

    replaceWorldbook(worldbookName, worldbook);
  }

  /**
   * 初始化思维链条目到世界书（使用技能卡生成模式）
   * @param worldbookName 世界书名称
   * @returns Promise<void>
   */
  static async initializeChainToWorldbook(worldbookName: string): Promise<void> {
    await this.addChainToWorldbook(worldbookName, ChainOfThoughtMode.SKILL_CARD_GENERATION);
    console.log(`🎉 思维链条目已初始化到世界书: ${worldbookName}`);
  }

  /**
   * 从世界书中移除思维链条目
   * @param worldbookName 世界书名称
   * @returns Promise<void>
   */
  static async removeChainFromWorldbook(worldbookName: string): Promise<void> {
    const worldbook = await getWorldbook(worldbookName);
    const entryIndex = worldbook.findIndex(entry => entry.uid === this.CHAIN_UID);

    if (entryIndex !== -1) {
      worldbook.splice(entryIndex, 1);
      replaceWorldbook(worldbookName, worldbook);
      console.log('🗑️ 已从世界书移除思维链条目');
    }
  }

  /**
   * 检查思维链条目是否存在
   * @param worldbookName 世界书名称
   * @returns boolean
   */
  static async chainExistsInWorldbook(worldbookName: string): Promise<boolean> {
    const worldbook = await getWorldbook(worldbookName);
    return worldbook.some(entry => entry.uid === this.CHAIN_UID);
  }
}
