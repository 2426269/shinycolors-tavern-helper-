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
  /** Chain 回复模式（偶像回复玩家消息） */
  CHAIN_REPLY = 'chain_reply',
  /** Chain 主动模式（偶像主动发消息） */
  CHAIN_PROACTIVE = 'chain_proactive',
  /** Chain 群组回复模式（多偶像群聊回复玩家） */
  CHAIN_GROUP_REPLY = 'chain_group_reply',
  /** Chain 群组主动模式（群内偶像主动发起话题） */
  CHAIN_GROUP_INITIATIVE = 'chain_group_initiative',

  // Twesta 模式
  /** Twesta 发推模式（偶像发推文） */
  TWESTA_POST = 'twesta_post',
  /** Twesta 评论模式（生成推文评论） */
  TWESTA_COMMENT = 'twesta_comment',
  /** Twesta 看图说话模式 */
  TWESTA_IMAGE_POST = 'twesta_image_post',
  /** Twesta 节奏事件模式 */
  TWESTA_DRAMA_EVENT = 'twesta_drama_event',

  // P-Lab 模式
  /** 流派设计模式 */
  STYLE_DESIGN = 'style_design',
  /** 流派配套卡生成模式 */
  FLOW_CARD_GEN = 'flow_card_gen',
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

## 7. （可选）engine_data 设计
- 如果输出 engine_data，构建 logic_chain
- 持续效果用 REGISTER_HOOK
- 创造新机制用 ADD_TAG + visuals
</think>

以下是生成的技能卡JSON：
[/Chain of thought]
`;
  }

  /**
   * Chain 回复模式思维链（偶像回复玩家消息）
   */
  static getChainReplyChain(): string {
    return `[Chain of thought]
<think>
## 1. 识别对话偶像
- 当前对话的偶像是谁？
- 这位偶像在闪耀色彩中的性格和特点？
- 她的说话方式和口癖是什么？
- 她对制作人的称呼是什么？（如：プロデューサー、制作人さん等）

## 2. 理解对话内容
- 玩家刚才说了什么？
- 对话的情绪基调是什么（高兴/日常/担心/调侃）？
- 偶像应该如何自然回应？

## 3. 当前时间考量
- 现在是几点？
- 这个时间段偶像可能在做什么？
- 问候语是否需要根据时间调整？

## 4. 消息风格确认
- 短信要简短自然（1-3条，每条1-2句）
- 是否需要使用表情或贴纸？
- 语气是否符合偶像性格？
</think>
[/Chain of thought]
`;
  }

  /**
   * Chain 群组回复模式思维链（多偶像群聊）
   */
  static getChainGroupReplyChain(): string {
    return `[Chain of thought]
<think>
## 1. 识别群组成员
- 当前群组有哪些偶像？
- 每位偶像的性格特点？
- 她们之间的关系如何？
- 每位偶像对制作人的称呼是什么？

## 2. 理解对话内容
- 玩家刚才说了什么？
- 这条消息的话题是否与某些成员更相关？
- 最近群里的对话氛围如何？

## 3. 谁会回复？
- 考虑到话题和性格，哪些偶像可能会回复？
- 哪些偶像可能会潜水不说话？
- 回复的顺序应该是怎样的？

## 4. 消息风格
- 每个人的回复要符合自己的说话风格
- 群聊消息要更加随意、自然
- 可以有互相评论、接话的情况

## 5. 真实感
- 不是每个人都会回复，模拟真实群聊
- 有几个人不回复是正常的，不强求所有人回复
- 如果话题与某人无关，她可以不发言
</think>
[/Chain of thought]
`;
  }

  /**
   * Chain 主动模式思维链（偶像主动发消息）
   */
  static getChainProactiveChain(): string {
    return `[Chain of thought]
<think>
## 1. 识别对话偶像
- 当前需要发消息的偶像是谁？
- 这位偶像的性格和说话风格？

## 2. 主动发消息的理由
- 偶像为什么要主动联系玩家？
- 可能的话题：日常分享、工作汇报、想聊天、询问事情

## 3. 当前时间考量
- 现在是几点？
- 这个时间发消息合理吗？
- 消息内容是否与时间相符？

## 4. 消息设计
- 开场白是什么？
- 主要想表达/询问什么？
- 结尾是否需要等待回复？

## 5. 贴纸选择
- 是否需要附带贴纸增加可爱感？
</think>
[/Chain of thought]
`;
  }

  /**
   * Chain 群组主动模式思维链（群内偶像主动发起话题）
   */
  static getChainGroupInitiativeChain(): string {
    return `[Chain of thought]
<think>
## 1. 识别群组和成员
- 当前群组有哪些偶像？
- 每位偶像的性格特点和说话风格？
- 她们之间的关系如何（同组/好友/一般）？

## 2. 确定发起者
- 哪位偶像适合发起这次对话？
- 她通常会主动发起什么类型的话题？
- 发起的理由是什么（分享日常/询问大家/闲聊）？

## 3. 当前时间考量
- 现在是几点？这个时间发消息合理吗？
- 如果是深夜/清晨，消息内容是否合理？

## 4. 话题设计
- 发起者想聊什么话题？
- 这个话题能引发其他成员讨论吗？
- 其他成员会如何反应（回复/潜水）？

## 5. 群聊互动
- 哪些偶像可能会回复？
- 她们会怎么接话或评论？
- 模拟真实群聊的节奏和氛围

## 6. 真实感
- 不是每个人都会回复
- 有几个人不跟帖是正常的，不强求所有人回复
- 对话风格要符合各自性格
</think>
[/Chain of thought]
`;
  }

  /**
   * 流派设计模式思维链
   */
  static getStyleDesignChain(): string {
    return `[Chain of thought]
<think>
## 1. 灵感解析
- 用户想要什么样的流派？（关键词：病娇、负面、星空、机械...）
- 这个流派最适合哪种培育计划？（感性/理性/非凡）
- 核心体验是什么？（高风险高回报 / 稳扎稳打 / 资源循环）

## 2. 核心机制构思
- 需要发明什么新机制（Tag）吗？
- 机制的运作逻辑：
  - 触发条件（如：体力<30%）
  - 效果（如：得分倍率提升）
  - 视觉表现（图标、颜色）

## 3. 体系规划
- 核心资源是什么？（好调/集中/好印象/体力/新资源）
- 典型的战斗节奏是怎样的？（铺垫 -> 爆发 -> 收尾）
- 适合哪些角色担当 Center？

## 4. 输出检查
- FlowDef 结构完整？
- MechanicDef 定义清晰？
- 视觉主题是否契合？
</think>
[/Chain of thought]
`;
  }

  /**
   * 流派配套卡生成模式思维链
   */
  static getFlowCardGenChain(): string {
    return `[Chain of thought]
<think>
## 1. 流派理解
- 当前流派（FlowDef）的核心机制是什么？
- 关键 Tag 和资源是什么？
- 视觉主题颜色和图标？

## 2. 角色定位
- 当前角色在流派中扮演什么位置？（Center核心 / 启动器 / 资源工 / 挂件）
- 稀有度要求？（UR/SSR/SR/R）
- 角色性格如何融入技能描述？

## 3. 技能设计
- 必须引用流派的核心机制（flowRefs / mechanicRefs）
- UR/SSR：设计复杂的联动效果（Hook / 条件判断）
- SR/R：设计扎实的基础效果（数值 / 资源）
- 视觉提示：如果是新机制，确保 visuals 字段正确

## 4. 格式检查
- engine_data 逻辑闭环？
- flowRefs 正确指向当前流派？
- display 描述符合角色口吻？
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
      case ChainOfThoughtMode.CHAIN_REPLY:
        return this.getChainReplyChain();
      case ChainOfThoughtMode.CHAIN_PROACTIVE:
        return this.getChainProactiveChain();
      case ChainOfThoughtMode.CHAIN_GROUP_REPLY:
        return this.getChainGroupReplyChain();
      case ChainOfThoughtMode.CHAIN_GROUP_INITIATIVE:
        return this.getChainGroupInitiativeChain();
      // Twesta 模式 - 内联思维链
      case ChainOfThoughtMode.TWESTA_POST:
        return `[Chain of thought]\n<think>\n营业模式: 公开推文，不透露与P的私密关系\n话题: 日常/工作/感谢/心情\n同时生成评论\n</think>\n[/Chain of thought]`;
      case ChainOfThoughtMode.TWESTA_COMMENT:
        return `[Chain of thought]\n<think>\n制作人互动: 偶像必定回复\n公开场合要得体\n</think>\n[/Chain of thought]`;
      case ChainOfThoughtMode.TWESTA_IMAGE_POST:
        return `[Chain of thought]\n<think>\n看图说话: 以偶像视角自然描述\n营业模式配文\n</think>\n[/Chain of thought]`;
      case ChainOfThoughtMode.TWESTA_DRAMA_EVENT:
        return `[Chain of thought]\n<think>\n节奏事件: 剧情发展与用户行动\n保持平衡性\n</think>\n[/Chain of thought]`;
      // P-Lab 模式
      case ChainOfThoughtMode.STYLE_DESIGN:
        return this.getStyleDesignChain();
      case ChainOfThoughtMode.FLOW_CARD_GEN:
        return this.getFlowCardGenChain();
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
      case ChainOfThoughtMode.CHAIN_REPLY:
        return this.getChainReplyChain();
      case ChainOfThoughtMode.CHAIN_PROACTIVE:
        return this.getChainProactiveChain();
      case ChainOfThoughtMode.CHAIN_GROUP_REPLY:
        return this.getChainGroupReplyChain();
      case ChainOfThoughtMode.CHAIN_GROUP_INITIATIVE:
        return this.getChainGroupInitiativeChain();
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
      [ChainOfThoughtMode.CHAIN_REPLY]: 'Chain回复思维链',
      [ChainOfThoughtMode.CHAIN_PROACTIVE]: 'Chain主动思维链',
      [ChainOfThoughtMode.CHAIN_GROUP_REPLY]: 'Chain群组回复思维链',
      [ChainOfThoughtMode.CHAIN_GROUP_INITIATIVE]: 'Chain群组主动思维链',
      // Twesta
      [ChainOfThoughtMode.TWESTA_POST]: 'Twesta发推思维链',
      [ChainOfThoughtMode.TWESTA_COMMENT]: 'Twesta评论思维链',
      [ChainOfThoughtMode.TWESTA_IMAGE_POST]: 'Twesta看图说话思维链',
      [ChainOfThoughtMode.TWESTA_DRAMA_EVENT]: 'Twesta节奏事件思维链',
      // P-Lab
      [ChainOfThoughtMode.STYLE_DESIGN]: '流派设计思维链',
      [ChainOfThoughtMode.FLOW_CARD_GEN]: '流派配套卡生成思维链',
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
