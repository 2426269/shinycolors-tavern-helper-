/**
 * AI生成助手
 * 集成世界书服务和通信系统，提供完整的AI技能卡生成流程
 */

import { z } from 'zod';
import { mechanicRegistry } from '../战斗/引擎-NG/MechanicRegistry';
import type { FlowDef, MechanicDef } from '../战斗/引擎-NG/types';
import type { ProducePlan, SkillCard, SkillCardRarity } from '../战斗/类型/技能卡类型';
import { MessageService } from '../通信/消息服务';
import { ChainOfThoughtManager, ChainOfThoughtMode } from './思维链区';
import { PromptManager, PromptMode, type PromptVariables } from './提示词区';
import { getFullMechanicExplanation, getProducePlanMechanicMarkdown } from './游戏机制数据库';
import { ExampleCardSelector, type ExampleCardConfig } from './示例卡抽取区';

/**
 * 从 URL 获取图片并转换为 Base64
 * @param url 图片 URL
 * @returns Promise<string> Base64 编码的图片数据（含 data URI 前缀）
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    console.log('📷 正在获取图片:', url);
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('⚠️ 图片获取失败:', response.status);
      return null;
    }

    const blob = await response.blob();
    const mimeType = blob.type || 'image/png';

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        console.log('✅ 图片转换成功，大小:', Math.round(base64.length / 1024), 'KB');
        resolve(base64);
      };
      reader.onerror = () => {
        console.warn('⚠️ 图片 Base64 转换失败');
        reject(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('⚠️ 获取图片出错:', error);
    return null;
  }
}

/**
 * 技能卡生成选项
 */
export interface SkillCardGenerationOptions {
  /** 角色名称 */
  characterName: string;
  /** 完整卡片名（含主题前缀，如【硝子少女】杜野凛世） */
  fullCardName?: string;
  /** 卡牌稀有度 */
  rarity: SkillCardRarity;
  /** 培育计划 */
  producePlan: ProducePlan;
  /** 推荐打法（可选） */
  recommendedStyle?: string;
  /** 卡牌主题（可选） */
  theme?: string;
  /** 是否流式输出 */
  streaming?: boolean;
  /** 未觉醒卡面图片 URL（可选，多模态 AI 可用） */
  cardImageUrl?: string;
  /** 觉醒卡面图片 URL（可选，多模态 AI 可用） */
  awakenedImageUrl?: string;
}

/**
 * 流派生成选项
 */
export interface FlowGenerationOptions {
  /** 用户输入的灵感描述 */
  userDescription: string;
  /** 倾向的培育计划 */
  producePlan: ProducePlan;
}

/**
 * 流派配套卡生成选项
 */
export interface FlowCardGenerationOptions {
  /** 角色名称 */
  characterName: string;
  /** 卡牌稀有度 */
  rarity: SkillCardRarity;
  /** 角色定位 */
  rolePosition: string;
  /** 流派定义 */
  flowDef: FlowDef;
  /** 是否流式输出 */
  streaming?: boolean;
}

/**
 * 生成结果
 */
export interface GenerationResult {
  /** 是否成功 */
  success: boolean;
  /** 生成的技能卡（如果成功） */
  skillCard?: SkillCard;
  /** 错误信息（如果失败） */
  error?: string;
  /** AI原始输出 */
  rawOutput?: string;
}

/**
 * 效果词条Schema（词条式格式）
 */
const EffectEntrySchema = z.object({
  /** 图标URL */
  icon: z.string(),
  /** 效果描述（纯中文） */
  effect: z.string(),
  /** 是否为消耗型效果 */
  isConsumption: z.boolean(),
});

/**
 * 条件效果Schema（词条式格式）
 */
const ConditionalEffectEntrySchema = z.object({
  /** 图标URL */
  icon: z.string(),
  /** 触发条件 */
  condition: z.string(),
  /** 效果描述（纯中文） */
  effect: z.string(),
  /** 是否为消耗型效果 */
  isConsumption: z.boolean(),
});

/**
 * 限制信息Schema
 */
const CardRestrictionsSchema = z.object({
  /** 是否可重复获得 */
  isDuplicatable: z.boolean(),
  /** 演出中使用限制（1或null） */
  usesPerBattle: z.union([z.literal(1), z.null()]),
});

/**
 * 技能卡JSON Schema（Zod验证 - 词条式格式）
 * ⚠️ 注意：这是AI生成的临时格式，需要转换为战斗系统的 SkillCard 格式
 */
const AIGeneratedSkillCardSchema = z.object({
  id: z.string(),
  nameJP: z.string(),
  nameCN: z.string(),
  type: z.enum(['主动', '精神', '陷阱']),
  rarity: z.enum(['N', 'R', 'SR', 'SSR', 'UR']),
  cost: z.string(),
  producePlan: z.enum(['感性', '理性', '非凡', '自由']),

  // 词条式效果（effectEntries 必须非空，effectEntriesEnhanced 对 UR 卡可选）
  effectEntries: z.array(EffectEntrySchema).min(1, '效果词条不能为空数组'),
  effectEntriesEnhanced: z.array(EffectEntrySchema).optional(), // UR 卡不可强化，无此字段

  // 条件效果（可选，但如果提供则必须是数组）
  conditionalEffects: z.array(ConditionalEffectEntrySchema).optional().default([]),
  conditionalEffectsEnhanced: z.array(ConditionalEffectEntrySchema).optional().default([]),

  // 限制信息
  restrictions: CardRestrictionsSchema,

  // 风味文本（可选）
  flavor: z.string().optional(),

  // 专属标识
  isExclusive: z.boolean().optional(),
  exclusiveCharacter: z.string().optional(),
});

/**
 * AI生成的临时技能卡类型
 */
type AIGeneratedSkillCard = z.infer<typeof AIGeneratedSkillCardSchema>;

/**
 * AI生成助手类
 */
export class AIGenerationAssistant {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  /**
   * 初始化助手
   */
  async initialize(): Promise<void> {
    console.log('🤖 初始化AI生成助手...');
    console.log('✅ AI生成助手初始化完成（使用内置数据库）！');
  }

  /**
   * 组装完整的系统提示词
   * @param options 生成选项
   * @returns 完整的系统提示词
   */
  private assembleSystemPrompt(options: SkillCardGenerationOptions): string {
    const { characterName, rarity, producePlan, recommendedStyle, theme } = options;

    const promptParts: string[] = [];

    // 1. 思维链（Chain of Thought）
    const chainOfThought = ChainOfThoughtManager.getChain('skill_card_generation');
    promptParts.push('# 技能卡生成思维链\n\n' + chainOfThought);

    // 2. 提示词框架
    const promptVariables: PromptVariables = {
      characterName,
      rarity,
      producePlan,
      recommendedStyle: recommendedStyle || this.getDefaultRecommendedStyle(producePlan),
      theme: theme || this.getDefaultTheme(characterName, rarity),
      producePlanMechanic: getProducePlanMechanicMarkdown(producePlan),
    };
    const promptFramework = PromptManager.getPrompt('skill_card_generation', promptVariables);
    promptParts.push('\n\n# 技能卡生成要求\n\n' + promptFramework);

    // 3. 完整的游戏机制说明（只包含当前培育计划的相关内容）
    const fullMechanicExplanation = getFullMechanicExplanation(producePlan);
    promptParts.push('\n\n# 游戏机制详细说明\n\n' + fullMechanicExplanation);

    // 4. 示例卡片
    const exampleConfig: ExampleCardConfig = {
      targetRarity: rarity,
      targetPlan: producePlan,
    };
    const exampleResult = ExampleCardSelector.selectExampleCards(exampleConfig);
    const exampleMarkdown = ExampleCardSelector.formatAsMarkdown(exampleResult, rarity);
    promptParts.push('\n\n# 示例技能卡参考\n\n' + exampleMarkdown);

    return promptParts.join('\n');
  }

  /**
   * 生成技能卡
   * @param options 生成选项
   * @returns Promise<GenerationResult>
   */
  async generateSkillCard(options: SkillCardGenerationOptions): Promise<GenerationResult> {
    const {
      characterName,
      fullCardName,
      rarity,
      producePlan,
      streaming = true,
      cardImageUrl,
      awakenedImageUrl,
      recommendedStyle,
    } = options;

    console.log('🎨 开始生成技能卡...', { characterName, fullCardName, rarity, producePlan, recommendedStyle });

    try {
      // 1. 组装系统提示词
      console.log('📚 组装系统提示词...');
      const systemPrompt = this.assembleSystemPrompt(options);
      console.log(`✅ 系统提示词已组装，长度: ${systemPrompt.length} 字符`);

      // 2. 获取卡面图片 Base64（多模态 AI 可用）
      const imageBase64List: string[] = [];
      if (cardImageUrl) {
        console.log('📷 获取未觉醒卡面图片...');
        const base64 = await fetchImageAsBase64(cardImageUrl);
        if (base64) imageBase64List.push(base64);
      }
      if (awakenedImageUrl) {
        console.log('📷 获取觉醒卡面图片...');
        const base64 = await fetchImageAsBase64(awakenedImageUrl);
        if (base64) imageBase64List.push(base64);
      }
      if (imageBase64List.length > 0) {
        console.log(`📷 成功获取 ${imageBase64List.length} 张卡面图片`);
      }

      // 3. 调用AI生成（传递完整卡名、Base64 图片和推荐流派）
      console.log('🤖 调用AI生成...');
      const aiOutput = await this.callAI(
        characterName,
        fullCardName,
        systemPrompt,
        streaming,
        imageBase64List,
        recommendedStyle,
      );

      // 调试：保存原始输出
      console.log('📝 AI原始输出（前500字符）:', aiOutput.substring(0, 500));
      (window as any).__lastAIOutput = aiOutput; // 保存到全局变量供调试

      // 3. 解析JSON
      console.log('🔍 解析AI输出...');
      const aiCard = this.parseSkillCardJSON(aiOutput);

      if (!aiCard) {
        return {
          success: false,
          error: 'AI输出格式不正确，无法解析为技能卡',
          rawOutput: aiOutput,
        };
      }

      // 调试日志：输出解析后的完整数据
      console.log('📦 解析后的AI卡片数据（完整对象）:', aiCard);
      console.log('📋 数据结构分析:', {
        hasId: !!aiCard.id,
        hasNameJP: !!aiCard.nameJP,
        hasNameCN: !!aiCard.nameCN,
        hasType: !!aiCard.type,
        hasRarity: !!aiCard.rarity,
        hasCost: !!aiCard.cost,
        hasProducePlan: !!aiCard.producePlan,
        effectEntriesType: Array.isArray(aiCard.effectEntries) ? 'array' : typeof aiCard.effectEntries,
        effectEntriesLength: aiCard.effectEntries?.length,
        effectEntriesEnhancedType: Array.isArray(aiCard.effectEntriesEnhanced)
          ? 'array'
          : typeof aiCard.effectEntriesEnhanced,
        effectEntriesEnhancedLength: aiCard.effectEntriesEnhanced?.length,
        hasConditionalEffects: !!aiCard.conditionalEffects,
        hasRestrictions: !!aiCard.restrictions,
        restrictionsType: typeof aiCard.restrictions,
      });

      if (aiCard.effectEntries && aiCard.effectEntries.length > 0) {
        console.log('📋 第一个效果词条:', aiCard.effectEntries[0]);
      } else {
        console.warn('⚠️ effectEntries 为空或不存在！');
      }

      // 保存解析后的数据供调试
      (window as any).__lastParsedCard = aiCard;

      // 4.5 标准化字段（将 AI 输出转换为期望格式）
      console.log('🔧 标准化技能卡字段...');
      const normalizedCard = this.normalizeSkillCard(aiCard, producePlan);

      // 5. 验证AI生成的技能卡
      console.log('✅ 验证技能卡格式...');
      const validatedAICard = this.validateSkillCard(normalizedCard);

      // 5. 转换为战斗系统的SkillCard格式
      console.log('🔄 转换为战斗系统格式...');
      const skillCard = this.convertToSkillCard(validatedAICard, characterName);

      console.log('🎉 技能卡生成成功！', skillCard);

      return {
        success: true,
        skillCard: skillCard,
        rawOutput: aiOutput,
      };
    } catch (error) {
      console.error('❌ 技能卡生成失败:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 调用AI生成
   *
   * ⚠️ 【重要】生卡系统使用独立Bot
   *
   * 本函数使用 `generateRaw()` 而不是 `generate()`，原因：
   * 1. 技能卡生成需要严格遵循游戏规则和平衡性
   * 2. 不应该受到用户外部预设（角色卡、人设、Jailbreak等）的影响
   * 3. 不应该受到用户自行添加的世界书的影响
   * 4. 确保每次生成都基于相同的提示词框架，保证质量一致性
   *
   * ✅ 其他系统（如通信系统、培育事件等）使用正常的 `generate()`
   *    这些系统需要使用用户的预设和世界书来提供个性化体验
   *
   * @param characterName 角色名称
   * @param systemPrompt 系统提示词（从内置数据库组装）
   * @param streaming 是否流式输出
   * @param imageBase64List 卡面图片 Base64 列表（可选，多模态 AI 可用）
   * @param recommendedStyle 推荐流派（可选）
   * @returns Promise<string> AI输出
   */
  private async callAI(
    characterName: string,
    fullCardName: string | undefined,
    systemPrompt: string,
    streaming: boolean,
    imageBase64List?: string[],
    recommendedStyle?: string,
  ): Promise<string> {
    // 使用完整卡名（如【硝子少女】杜野凛世）或仅角色名
    const displayName = fullCardName || characterName;

    // 构建用户输入（包含推荐流派和图片参考说明）
    let userInput = `请为 ${displayName} 生成一张专属技能卡。`;
    if (recommendedStyle) {
      userInput += `\n\n🎯 推荐流派：${recommendedStyle}`;
    }
    if (imageBase64List && imageBase64List.length > 0) {
      userInput += '\n\n📷 已附上角色卡面图片供参考，请结合卡面的视觉风格（服装、场景、氛围）设计技能卡。';
    }

    console.log('📤 发送请求到AI...');
    console.log('  用户输入:', userInput);
    console.log('  系统提示词长度:', systemPrompt.length, '字符');
    if (imageBase64List && imageBase64List.length > 0) {
      console.log('  📷 附带图片数量:', imageBase64List.length);
    }

    // 构建请求参数
    // 根据文档：使用顶层 user_input 和 image 字段，配合 ordered_prompts 中的 'user_input' 内置提示词
    const requestParams: any = {
      user_input: userInput,
      should_stream: streaming,
      // ✅ 手动传递内置的系统提示词（思维链、提示词框架、示例卡、游戏机制）
      ordered_prompts: [
        {
          role: 'system',
          content: systemPrompt,
        },
        'user_input', // 使用内置的 user_input 提示词（会自动附带顶层的 user_input 和 image）
      ],
      // 不使用聊天历史，确保每次生成都是独立的
      max_chat_history: 0,
    };

    // ✅ 使用酒馆助手官方的顶层 image 字段
    // 文档示例：const result = await generate({ user_input: '你好', image: 'https://example.com/image.jpg' });
    if (imageBase64List && imageBase64List.length > 0) {
      requestParams.image = imageBase64List;
      console.log('📷 已添加图片到顶层 image 字段');
      console.log('📷 图片数量:', imageBase64List.length);
      console.log('📷 第一张图片格式:', imageBase64List[0].substring(0, 50));
    }

    // 调试：打印完整请求参数的 key 列表
    console.log('📤 请求参数 keys:', Object.keys(requestParams));
    console.log(
      '📤 ordered_prompts:',
      requestParams.ordered_prompts.map((p: any) => (typeof p === 'string' ? p : p.role)),
    );
    console.log('📤 包含 image?:', 'image' in requestParams);

    // 使用 generateRaw 实现独立生成Bot
    const response = await window.TavernHelper.generateRaw(requestParams);

    if (!response) {
      throw new Error('AI未返回有效响应');
    }

    console.log('📥 AI响应长度:', response.length, '字符');

    return response;
  }

  /**
   * 解析技能卡JSON
   * @param aiOutput AI输出
   * @returns AIGeneratedSkillCard | null
   */
  private parseSkillCardJSON(aiOutput: string): AIGeneratedSkillCard | null {
    try {
      // 尝试提取JSON代码块
      const jsonMatch = aiOutput.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[1]);
        return json as AIGeneratedSkillCard;
      }

      // 尝试提取裸JSON（以 { 开头，} 结尾）
      const bareJsonMatch = aiOutput.match(/\{[\s\S]*\}/);
      if (bareJsonMatch) {
        const json = JSON.parse(bareJsonMatch[0]);
        return json as AIGeneratedSkillCard;
      }

      console.error('❌ 无法从AI输出中提取JSON');
      return null;
    } catch (error) {
      console.error('❌ JSON解析失败:', error);
      return null;
    }
  }

  /**
   * 标准化技能卡字段（将 AI 输出转换为期望格式）
   * @param skillCard AI 生成的原始卡片
   * @param producePlan 培育计划（从选项传入）
   * @returns 标准化后的卡片
   */
  private normalizeSkillCard(skillCard: any, producePlan: ProducePlan): any {
    const normalized = { ...skillCard };

    // 转换 type 字段
    const typeMap: Record<string, string> = {
      // 主动卡映射
      技能: '主动',
      P技能: '主动',
      'P-Skill': '主动',
      PSkill: '主动',
      Active: '主动',
      active: '主动',
      Skill: '主动',
      skill: '主动',
      主动卡: '主动',
      'Active Card': '主动',
      'Produce Skill': '主动',
      // 精神卡映射
      Mental: '精神',
      mental: '精神',
      精神卡: '精神',
      'Mental Card': '精神',
      // 陷阱卡映射
      Trap: '陷阱',
      trap: '陷阱',
      陷阱卡: '陷阱',
      'Trap Card': '陷阱',
      'Trouble Card': '陷阱',
    };

    if (normalized.type && typeMap[normalized.type]) {
      console.log(`🔧 转换 type: "${normalized.type}" -> "${typeMap[normalized.type]}"`);
      normalized.type = typeMap[normalized.type];
    } else if (normalized.type && !['主动', '精神', '陷阱'].includes(normalized.type)) {
      // 如果是未知类型，默认转换为主动
      console.log(`🔧 未知 type: "${normalized.type}"，默认转换为 "主动"`);
      normalized.type = '主动';
    }

    // 如果缺少 producePlan，从参数添加
    if (!normalized.producePlan) {
      console.log(`🔧 添加缺失的 producePlan: "${producePlan}"`);
      normalized.producePlan = producePlan;
    }

    // 转换培育计划名称（如有需要）
    const planMap: Record<string, string> = {
      Sense: '感性',
      sense: '感性',
      Logic: '理性',
      logic: '理性',
      Anomaly: '非凡',
      anomaly: '非凡',
      Free: '自由',
      free: '自由',
    };

    if (normalized.producePlan && planMap[normalized.producePlan]) {
      console.log(`🔧 转换 producePlan: "${normalized.producePlan}" -> "${planMap[normalized.producePlan]}"`);
      normalized.producePlan = planMap[normalized.producePlan];
    }

    return normalized;
  }

  /**
   * 验证技能卡（使用Zod）
   * @param skillCard 技能卡对象
   * @returns AIGeneratedSkillCard
   */
  private validateSkillCard(skillCard: any): AIGeneratedSkillCard {
    try {
      const validated = AIGeneratedSkillCardSchema.parse(skillCard);
      console.log('✅ 技能卡验证通过');
      return validated;
    } catch (error) {
      // 调试：输出完整的错误对象
      console.error('❌ 技能卡验证失败（原始错误）:', error);
      console.error('错误类型:', error?.constructor?.name);

      if (error instanceof z.ZodError) {
        console.error('❌ 技能卡验证失败（Zod错误）:', error.errors);

        // 防御性编程：确保 error.errors 存在且是数组
        const errors = Array.isArray(error.errors) ? error.errors : [];

        if (errors.length === 0) {
          console.error('⚠️ 警告：ZodError 但 errors 数组为空');
        }

        // 格式化错误信息
        const errorMessages = errors
          .map(err => {
            const path = Array.isArray(err?.path) ? err.path.join('.') : 'unknown';
            return `字段 "${path}": ${err?.message || '未知错误'}`;
          })
          .join('\n');

        console.error('📋 格式化的错误信息:\n', errorMessages || '(无详细错误信息)');

        // 检查是否缺少词条式格式字段
        const hasOldFormat = skillCard.effect && skillCard.effectEnhanced;
        const hasEffectEntries = skillCard.effectEntries && skillCard.effectEntries.length > 0;

        let hint = '';
        if (hasOldFormat && !hasEffectEntries) {
          hint =
            '\n\n⚠️ 检测到旧格式输出！AI使用了 "effect" 和 "effectEnhanced" 字段，但新格式需要 "effectEntries" 数组。';
        } else if (!hasEffectEntries) {
          hint = '\n\n⚠️ 缺少必需的词条式格式字段："effectEntries"。（UR 卡无需 effectEntriesEnhanced）';
        }

        throw new Error(`技能卡格式验证失败:\n${errorMessages}${hint}`);
      }
      throw error;
    }
  }

  /**
   * 将效果词条数组转换为纯文本（用于向后兼容）
   * @param entries 效果词条数组
   * @param conditionalEffects 条件效果数组（可选）
   * @returns 效果文本
   */
  private convertEffectEntriesToText(
    entries: z.infer<typeof EffectEntrySchema>[],
    conditionalEffects?: z.infer<typeof ConditionalEffectEntrySchema>[],
  ): string {
    const parts: string[] = [];

    // 转换基础效果（新词条式格式：直接使用effect字段）
    if (entries && Array.isArray(entries)) {
      entries.forEach(entry => {
        if (entry && entry.effect) {
          parts.push(entry.effect);
        }
      });
    }

    // 转换条件效果（新词条式格式）
    if (conditionalEffects && Array.isArray(conditionalEffects)) {
      conditionalEffects.forEach(ce => {
        if (ce && ce.condition && ce.effect) {
          parts.push(`${ce.condition} ${ce.effect}`);
        }
      });
    }

    return parts.join(' ');
  }

  /**
   * 将AI生成的技能卡转换为战斗系统的SkillCard格式
   * @param aiCard AI生成的技能卡
   * @param characterName 角色名称
   * @returns SkillCard
   */
  private convertToSkillCard(aiCard: AIGeneratedSkillCard, characterName: string): SkillCard {
    // 类型映射
    const cardType: SkillCard['cardType'] = aiCard.type === '主动' ? 'A' : aiCard.type === '精神' ? 'M' : 'T';

    // 确保数组字段存在（防御性编程）
    const effectEntries = Array.isArray(aiCard.effectEntries) ? aiCard.effectEntries : [];
    const effectEntriesEnhanced = Array.isArray(aiCard.effectEntriesEnhanced) ? aiCard.effectEntriesEnhanced : [];
    const conditionalEffects = Array.isArray(aiCard.conditionalEffects) ? aiCard.conditionalEffects : [];
    const conditionalEffectsEnhanced = Array.isArray(aiCard.conditionalEffectsEnhanced)
      ? aiCard.conditionalEffectsEnhanced
      : [];

    // 将词条式效果转换为文本（向后兼容）
    const effect_before = this.convertEffectEntriesToText(effectEntries, conditionalEffects);
    const effect_after = this.convertEffectEntriesToText(effectEntriesEnhanced, conditionalEffectsEnhanced);

    // 添加限制信息到文本末尾
    const restrictionText = [
      !aiCard.restrictions?.isDuplicatable ? '不可重复' : '可重复获得',
      aiCard.restrictions?.usesPerBattle === 1 ? '演出中限1次' : null,
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: aiCard.id,
      name: `${aiCard.nameJP} / ${aiCard.nameCN}`,
      rarity: aiCard.rarity as SkillCardRarity,
      plan: aiCard.producePlan as ProducePlan,
      cardType,
      cost: aiCard.cost,

      // 旧格式（向后兼容）
      effect_before: `${effect_before} ※${restrictionText}`,
      effect_after: `${effect_after} ※${restrictionText}`,

      // 新格式（词条式）
      effectEntries,
      effectEntriesEnhanced,
      conditionalEffects,
      conditionalEffectsEnhanced,
      restrictions: aiCard.restrictions || { isDuplicatable: true, usesPerBattle: 0 },

      // 其他字段
      enhanced: false,
      isExclusive: true,
      bindingCardId: characterName, // 使用角色名作为绑定标识
      flavor: aiCard.flavor,
    };
  }

  /**
   * 获取默认推荐打法
   */
  private getDefaultRecommendedStyle(plan: ProducePlan): string {
    const styleMap: Record<ProducePlan, string> = {
      感性: '得分型',
      理性: '属性型',
      非凡: '爆发型',
      自由: '灵活型',
    };
    return styleMap[plan] || '均衡型';
  }

  /**
   * 获取默认主题
   */
  private getDefaultTheme(characterName: string, rarity: SkillCardRarity): string {
    const rarityThemes: Record<SkillCardRarity, string[]> = {
      N: ['日常训练', '基础练习', '初次挑战'],
      R: ['舞台练习', '技能提升', '团队合作'],
      SR: ['正式演出', '突破极限', '全力以赴'],
      SSR: ['梦想舞台', '闪耀时刻', '完美演绎'],
      UR: ['传说时刻', '奇迹绽放', '超越极限'],
    };

    const themes = rarityThemes[rarity] || ['舞台表演'];
    return themes[Math.floor(Math.random() * themes.length)];
  }

  /**
   * 批量生成技能卡
   * @param optionsList 生成选项列表
   * @returns Promise<GenerationResult[]>
   */
  async batchGenerateSkillCards(optionsList: SkillCardGenerationOptions[]): Promise<GenerationResult[]> {
    console.log(`🎨 开始批量生成 ${optionsList.length} 张技能卡...`);

    const results: GenerationResult[] = [];

    for (let i = 0; i < optionsList.length; i++) {
      const options = optionsList[i];
      console.log(`\n📝 生成第 ${i + 1}/${optionsList.length} 张卡...`);

      const result = await this.generateSkillCard(options);
      results.push(result);

      // 每次生成后等待一段时间，避免请求过快
      if (i < optionsList.length - 1) {
        console.log('⏳ 等待2秒后继续...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`\n✅ 批量生成完成！成功: ${successCount}/${optionsList.length}`);

    return results;
  }

  /**
   * 生成新流派 (P-Lab)
   */
  async generateFlow(
    options: FlowGenerationOptions,
  ): Promise<{ success: boolean; flow?: FlowDef; mechanics?: MechanicDef[]; error?: string; rawOutput?: string }> {
    console.log('🎨 开始生成新流派...', options);

    let rawOutput = '';

    try {
      // 1. 获取游戏机制说明
      const { getAllProducePlanMechanicsMarkdown, getEffectCategoriesMarkdown } = await import('./游戏机制数据库');
      const producePlanMechanics = getAllProducePlanMechanicsMarkdown();
      const effectCategories = getEffectCategoriesMarkdown();

      // 2. 组装提示词
      const chainOfThought = ChainOfThoughtManager.getChain(ChainOfThoughtMode.STYLE_DESIGN);
      const promptVariables: PromptVariables = {
        userDescription: options.userDescription,
        producePlan: options.producePlan,
        producePlanMechanic: producePlanMechanics,
        existingMechanics: effectCategories,
      };
      const promptFramework = PromptManager.getPrompt(PromptMode.STYLE_DESIGN, promptVariables);

      const systemPrompt = `# 流派设计思维链\n\n${chainOfThought}\n\n# 流派设计要求\n\n${promptFramework}`;

      // 3. 调用 AI
      rawOutput = await this.callAI('System', 'FlowDesigner', systemPrompt, true);

      // 4. 解析 JSON
      const jsonMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/) || rawOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('无法解析 AI 输出的 JSON');

      const data = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      // 5. 简单验证
      if (!data.flow || !data.mechanics) throw new Error('返回数据缺少 flow 或 mechanics 字段');

      return {
        success: true,
        flow: data.flow as FlowDef,
        mechanics: data.mechanics as MechanicDef[],
        rawOutput,
      };
    } catch (error) {
      console.error('❌ 流派生成失败:', error);
      return { success: false, error: String(error), rawOutput };
    }
  }

  /**
   * 生成流派配套卡 (P-Lab)
   */
  async generateFlowCard(options: FlowCardGenerationOptions): Promise<GenerationResult> {
    console.log('🎨 开始生成流派配套卡...', options.characterName);

    try {
      // 1. 准备上下文
      const existingMechanicsMd = mechanicRegistry.toPromptMarkdown(options.flowDef.id);

      // 2. 组装提示词
      const chainOfThought = ChainOfThoughtManager.getChain(ChainOfThoughtMode.FLOW_CARD_GEN);
      const promptVariables: PromptVariables = {
        characterName: options.characterName,
        rarity: options.rarity,
        rolePosition: options.rolePosition,
        theme: options.flowDef.nameCN,
        flowDefJson: JSON.stringify(options.flowDef, null, 2),
        existingMechanics: existingMechanicsMd,
      };
      const promptFramework = PromptManager.getPrompt(PromptMode.FLOW_CARD_GEN, promptVariables);

      const systemPrompt = `# 配套卡生成思维链\n\n${chainOfThought}\n\n# 生成要求\n\n${promptFramework}`;

      // 3. 调用 AI
      const aiOutput = await this.callAI(options.characterName, undefined, systemPrompt, options.streaming ?? true);

      // 4. 解析与转换
      // 复用现有的解析逻辑，但需要适配 engine_data
      const jsonMatch = aiOutput.match(/```json\s*([\s\S]*?)\s*```/) || aiOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('无法解析 JSON');

      const aiCard = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      // 构造 SkillCard
      const skillCard: SkillCard = {
        id: `plab_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: aiCard.display.name,
        rarity: options.rarity,
        plan: options.flowDef.plan === 'mixed' ? '感性' : options.flowDef.plan, // 兜底
        cardType: 'A', // 默认为主动，具体看 engine_data
        cost: aiCard.engine_data?.cost?.genki ? `体力消耗${aiCard.engine_data.cost.genki}` : '无消耗',

        // 兼容字段
        effect_before: aiCard.display.description,
        effect_after: aiCard.display.description,
        effectEntries: [],

        // 新字段
        flowRefs: aiCard.flowRefs,
        mechanicRefs: aiCard.mechanicRefs,
        // 注意：这里需要把 engine_data 存下来，但 SkillCard 接口目前可能还没完全适配 engine_data 的存储
        // 暂时存到 legacy_effects 或扩展 SkillCard 接口
        // 假设 SkillCardV2 已经生效，我们强行断言
        ...aiCard,
      };

      return { success: true, skillCard, rawOutput: aiOutput };
    } catch (error) {
      console.error('❌ 配套卡生成失败:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * 获取助手状态
   */
  getStatus(): {
    messageService: boolean;
  } {
    return {
      messageService: !!this.messageService,
    };
  }
}

/**
 * 创建单例实例
 */
let assistantInstance: AIGenerationAssistant | null = null;

/**
 * 获取AI生成助手实例（单例模式）
 */
export function getAIAssistant(): AIGenerationAssistant {
  if (!assistantInstance) {
    assistantInstance = new AIGenerationAssistant();
  }
  return assistantInstance;
}

/**
 * 快捷函数：生成技能卡
 */
export async function generateSkillCard(options: SkillCardGenerationOptions): Promise<GenerationResult> {
  const assistant = getAIAssistant();
  return await assistant.generateSkillCard(options);
}

/**
 * 快捷函数：批量生成技能卡
 */
export async function batchGenerateSkillCards(optionsList: SkillCardGenerationOptions[]): Promise<GenerationResult[]> {
  const assistant = getAIAssistant();
  return await assistant.batchGenerateSkillCards(optionsList);
}

/**
 * 快捷函数：生成新流派
 */
export async function generateFlow(options: FlowGenerationOptions) {
  return await getAIAssistant().generateFlow(options);
}

/**
 * 快捷函数：生成流派配套卡
 */
export async function generateFlowCard(options: FlowCardGenerationOptions) {
  return await getAIAssistant().generateFlowCard(options);
}
