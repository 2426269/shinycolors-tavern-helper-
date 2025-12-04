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
在正式创建技能卡前，需要进行以下思考
思考内容需要使用<think> </think>包裹，JSON输出紧跟在</think>后
<think>
- 当前模式是什么？技能卡生成模式
- 此模式无需输出正文剧情？只输出JSON格式的技能卡数据？
- 角色基本信息：名字、稀有度、培育计划分别是什么？
- 这张卡的主题和风格是什么？（如：舞台表演、日常训练、心理成长）
- ⚠️ **命名禁忌**：卡牌名称和简介绝对不能根据培育计划属性联想（如理性→演算、非凡→挑战）
  - "终点越えの演算"是错误示范（"演算"来自"理性"属性）
  - 命名应该基于：角色性格、卡牌主题、角色台词、角色故事
  - flavor简介应该描述角色在该场景的表现，不要提到"理性计划"等属性词
- 根据稀有度，技能卡的效果强度应该如何平衡？
  - 参考同稀有度的示例卡，学习它们的效果强度、成本设计、机制复杂度
  - 确保效果强度明显高于低稀有度示例，但不超过高稀有度对比卡
  - UR卡特别注意：必须在数值、机制、协同性三方面全面超越所有SSR示例
- 是否已查阅示例卡牌？从中学到了什么规律？
  - 效果文本的格式是否统一？
  - 培育计划专属效果是如何体现的？
  - 强化前后的差异是如何设计的？
- 技能名称是否符合以下要求？
  - **日文名**：符合偶像大师风格，体现角色人设和卡牌主题，避免与培育计划属性关联
  - **中文名**：准确传达技能含义，朗朗上口，同样基于角色和主题而非属性
  - **命名灵感来源**：角色性格、卡牌主题、角色台词、角色故事，而非"理性=演算"这类属性联想
  - 是否避免了平淡无奇的命名？
- 推荐流派检查（🔥 核心！）：
  - **当前推荐流派是什么？**（干劲/好印象/强气/全力/好调/集中）
  - **该流派的核心资源是什么？**
    - 干劲流派（理性）→元气+干劲
    - 好印象流派（理性）→好印象
    - 强气流派（非凡）→强气+温存+热意值
    - 全力流派（非凡）→全力值+全力状态
    - 好调流派（感性）→好调（固定+50%）/绝好调（在好调基础上额外+好调回合数×10%）
    - 集中流派（感性）→集中（提高基础数值）
  - **这张技能卡是否以推荐流派的核心资源为主效果？**
  - **是否避免了混用其他流派的核心资源？**（如全力流派不应主要提供元气，好印象流派不应主要提供元气）
  - **特别注意感性计划单卡设计**：
    - 如果推荐流派是"好调"→卡牌以好调/绝好调为主（可附带少量集中）
    - 如果推荐流派是"集中"→卡牌以集中为主（可附带少量好调）
    - 不能平均提供两种效果，必须有明确的主次
- 技能效果设计是否合理？
  - 效果类型是什么？（属性提升/Buff/得分/特殊效果/消耗）
  - 效果强度是否符合示例卡的平衡标准？
  - **是否优先使用了推荐流派的核心资源和效果？**
  - 强化后的提升是否明显但不失衡？
  - **使用限制是否合理？**（不要所有卡都是"演出中限1次"，低成本卡可以无限制）
- 质量检查清单：
  - ⚠️ effectEntries数组是否包含至少1个词条对象？（绝对不能是空数组[]）
  - ⚠️ effectEntriesEnhanced数组是否包含至少1个词条对象？（绝对不能是空数组[]）
  - 是否禁止了直接增加V/D/V属性的效果？（只能通过Buff）
  - effectEntries和effectEntriesEnhanced是否使用词条式格式（icon+effect+isConsumption）？
  - 每个词条对象是否包含全部3个字段：icon、effect、isConsumption？
  - 每个词条的icon字段是否填入了正确的图标URL（或条件词条使用""）？
  - 所有effect字段是否使用纯中文？（禁止日文，如：パラメータ、元気等）
  - 消耗型效果是否正确标记了isConsumption为true？
  - restrictions对象的isDuplicatable和usesPerBattle字段是否正确设置？
  - conditionalEffects条件效果是否包含icon、condition、effect、isConsumption字段？
  - 效果强度是否符合示例卡的平衡标准？
  - 是否符合培育计划的特色？
  - 强化前后是否都有完整的效果描述？
- 最后确认：
  - ❌ 绝对禁止使用旧格式的 "effect": "文本" 字段
  - ✅ 必须使用新格式的 "effectEntries": [{icon, effect, isConsumption}, ...] 数组
  - ✅ effectEntries和effectEntriesEnhanced数组必须非空
  - 是否只输出严格的JSON格式？
  - JSON中是否包含所有必需字段？
  - 是否避免了输出任何解释性文字？
</think>
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
