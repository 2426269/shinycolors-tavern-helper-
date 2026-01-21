import { z } from 'zod';
import { mechanicRegistry } from '../战斗/引擎-NG/MechanicRegistry';
import { DynamicVisualSchema, EngineDataSchema, validateEngineData } from '../战斗/引擎-NG/engineDataSchema';
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
  /** 用户特别要求（高优先级，注入提示词） */
  userDescription?: string;
}

/**
 * 技能卡修复选项
 */
export interface SkillCardRepairOptions {
  /** 原始卡牌 JSON 字符串 */
  originalCardJson: string;
  /** 原始 Engine Data JSON 字符串 */
  originalEngineData: string;
  /** 用户反馈的问题描述 */
  repairIssue: string;
  /** 是否流式输出 */
  streaming?: boolean;
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

// ==================== SkillCardV2 Schema (engine_data 必填) ====================

/**
 * Display 结构 Schema
 */
const DisplaySchema = z.object({
  name: z.string(),
  nameJP: z.string().optional(),
  description: z.string().optional(), // T-12: description 不再必填
  flavor: z.string().optional(), // 兼容旧格式
  flavorJP: z.string().optional(), // T-12: 日语氛围文本
  flavorCN: z.string().optional(), // T-12: 中文氛围文本
});

/**
 * Restrictions 结构 Schema
 */
const RestrictionsSchema = z.object({
  is_unique: z.boolean().optional(),
  uses_per_battle: z.number().optional(),
});

/**
 * 效果词条 Schema
 */
const EffectEntrySchema = z.object({
  icon: z.string(),
  effect: z.string(),
  isConsumption: z.boolean(),
});

/**
 * 条件效果词条 Schema
 */
const ConditionalEffectEntrySchema = z.object({
  icon: z.string(),
  condition: z.string(),
  effect: z.string(),
  isConsumption: z.boolean(),
});

/**
 * AI 生成的 SkillCardV2 Schema
 * ⚠️ engine_data 是必填字段！
 */
const AIGeneratedSkillCardV2Schema = z.object({
  id: z.string(),
  rarity: z.enum(['N', 'R', 'SR', 'SSR', 'UR']),
  type: z.enum(['A', 'M']),
  plan: z.enum(['sense', 'logic', 'anomaly', '感性', '理性', '非凡', '自由']),

  // ⚠️ engine_data 必填！
  engine_data: EngineDataSchema,

  // ⚠️ effectEntries 必填（前端展示层）
  effectEntries: z.array(EffectEntrySchema),
  effectEntriesEnhanced: z.array(EffectEntrySchema).optional(),

  // display 可选（省 Token，从 effectEntries 可自动拼接）
  display: DisplaySchema.optional(),

  // 可选：氛围文本（根级）
  flavor: z.string().optional(),
  flavorJP: z.string().optional(), // T-12: 根级 flavorJP (防止 AI 放错位置被 strip)

  // 可选：视觉提示（用于新机制）
  visual_hint: DynamicVisualSchema.optional(),

  // 可选：限制信息
  restrictions: RestrictionsSchema.optional(),

  // 可选：流派/机制引用
  flowRefs: z.array(z.string()).optional(),
  mechanicRefs: z.array(z.string()).optional(),
});

/**
 * AI生成的 SkillCardV2 类型
 */
type AIGeneratedSkillCardV2 = z.infer<typeof AIGeneratedSkillCardV2Schema>;

// ==================== 旧格式兼容 Schema (用于检测旧格式输出) ====================

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
    const { characterName, rarity, producePlan, recommendedStyle, theme, userDescription } = options;

    const promptParts: string[] = [];

    // 1. 思维链（Chain of Thought）
    const chainOfThought = ChainOfThoughtManager.getChain(ChainOfThoughtMode.SKILL_CARD_GENERATION);
    promptParts.push('# 技能卡生成思维链\n\n' + chainOfThought);

    // 2. 提示词框架
    const promptVariables: PromptVariables = {
      characterName,
      rarity,
      producePlan,
      recommendedStyle: recommendedStyle || this.getDefaultRecommendedStyle(producePlan),
      theme: theme || this.getDefaultTheme(characterName, rarity),
      producePlanMechanic: getProducePlanMechanicMarkdown(producePlan),
      userDescription: userDescription || '',
    };
    const promptFramework = PromptManager.getPrompt(PromptMode.SKILL_CARD_GENERATION, promptVariables);
    promptParts.push('\n\n# 技能卡生成要求\n\n' + promptFramework);

    // 3. 完整的游戏机制说明（只包含当前培育计划的相关内容）
    const fullMechanicExplanation = getFullMechanicExplanation(producePlan);
    promptParts.push('\n\n# 游戏机制详细说明\n\n' + fullMechanicExplanation);

    // 4. 示例卡片（使用 V2 格式 + example_confidence）
    const exampleConfig: ExampleCardConfig = {
      targetRarity: rarity,
      targetPlan: producePlan,
    };
    // T2: 统一使用 V2 示例输出（包含 example_confidence 标注）
    const exampleMarkdown = ExampleCardSelector.getV2ExamplesMarkdown(exampleConfig);
    promptParts.push('\n\n# 示例技能卡参考（SkillCardV2 格式）\n\n' + exampleMarkdown);

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
        hasEngineData: !!aiCard.engine_data,
        hasDisplay: !!aiCard.display,
        hasType: !!aiCard.type,
        hasRarity: !!aiCard.rarity,
        hasPlan: !!aiCard.plan,
        // 检测旧格式
        hasOldEffectEntries: !!aiCard.effectEntries,
        hasOldNameJP: !!aiCard.nameJP,
      });

      // 4.1 清理无效 visual_hint（避免空对象导致校验失败）
      this.sanitizeVisualHint(aiCard);

      // 4.2 标准化 type 字段（精神->M, 主动->A, 陷阱->T）
      this.normalizeType(aiCard);

      // 保存解析后的数据供调试
      (window as any).__lastParsedCard = aiCard;

      // 4. 验证 SkillCardV2 格式（engine_data 必填）
      console.log('✅ 验证 SkillCardV2 格式...');
      const validatedV2Card = this.validateSkillCardV2(aiCard);

      if (!validatedV2Card) {
        return {
          success: false,
          error: 'AI 输出未通过 SkillCardV2 验证',
          rawOutput: aiOutput,
        };
      }

      // T6: 无聊卡检测（仅警告，不阻止生成）
      const boringResult = this.detectBoringCard(validatedV2Card, rarity);
      if (boringResult.isBoring) {
        console.warn(`⚠️ 无聊卡检测触发: ${boringResult.reason}`);
        // 当前仅警告，后续可改为返回失败或要求重新生成
      } else if (boringResult.bypassed) {
        console.log('🎫 用户要求绕过无聊检测');
      }

      // 5. 转换为战斗系统的SkillCard格式（保留 engine_data）
      console.log('🔄 转换为战斗系统格式...');
      const skillCard = this.convertSkillCardV2ToSkillCard(validatedV2Card, characterName);

      console.log('🎉 技能卡生成成功（含 engine_data）！', skillCard);

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
   * 组装修复模式系统提示词
   */
  private assembleRepairSystemPrompt(options: SkillCardRepairOptions): string {
    const { originalCardJson, originalEngineData, repairIssue } = options;

    const promptParts: string[] = [];

    // 1. 思维链
    const chainOfThought = ChainOfThoughtManager.getChain(ChainOfThoughtMode.SKILL_CARD_REPAIR);
    promptParts.push('# 技能卡修复思维链\n\n' + chainOfThought);

    // 2. 提示词框架
    const promptVariables: PromptVariables = {
      originalCardJson,
      originalEngineData,
      repairIssue,
    };
    const promptFramework = PromptManager.getPrompt(PromptMode.SKILL_CARD_REPAIR, promptVariables);
    promptParts.push('\n\n# 技能卡修复要求\n\n' + promptFramework);

    return promptParts.join('\n');
  }

  /**
   * 生成技能卡修复
   * @param options 修复选项
   * @returns Promise<GenerationResult>
   */
  async generateSkillCardRepair(options: SkillCardRepairOptions): Promise<GenerationResult> {
    const { originalCardJson, repairIssue, streaming = true } = options;

    console.log('🔧 开始修复技能卡...', { repairIssue });

    try {
      // 1. 组装系统提示词
      const systemPrompt = this.assembleRepairSystemPrompt(options);
      console.log(`✅ 修复系统提示词已组装，长度: ${systemPrompt.length} 字符`);

      // 2. 调用 AI (复用 callAI，但传入特定参数)
      // 尝试从原始 JSON 解析角色名，如果失败则使用默认值
      let characterName = 'Unknown';
      try {
        const card = JSON.parse(originalCardJson);
        // 尝试从 ID 或 display.name 获取信息，或者直接用 "RepairBot"
        if (card.id) characterName = card.id.split('_')[0];
      } catch (e) {
        console.warn('⚠️ 无法从原始 JSON 解析角色名');
      }

      const aiOutput = await this.callAI(
        characterName,
        undefined, // fullCardName
        systemPrompt,
        streaming,
        undefined, // imageBase64List
        undefined, // recommendedStyle
      );

      // 3. 解析与验证
      console.log('🔍 解析修复结果...');
      const aiCard = this.parseSkillCardJSON(aiOutput);

      if (!aiCard) {
        return {
          success: false,
          error: 'AI输出格式不正确，无法解析为技能卡',
          rawOutput: aiOutput,
        };
      }

      // 4. 清理与标准化
      this.sanitizeVisualHint(aiCard);
      this.normalizeType(aiCard);

      // 5. 验证 SkillCardV2 格式
      console.log('✅ 验证修复后的 SkillCardV2 格式...');
      const validatedV2Card = this.validateSkillCardV2(aiCard);

      if (!validatedV2Card) {
        return {
          success: false,
          error: '修复后的 AI 输出未通过 SkillCardV2 验证',
          rawOutput: aiOutput,
        };
      }

      // 6. 转换为战斗系统格式
      const skillCard = this.convertSkillCardV2ToSkillCard(validatedV2Card, characterName);

      // 7. 注入修复元数据 (Repair Meta)
      (skillCard as any).repair_meta = {
        issue: repairIssue,
        repairedAt: Date.now(),
        version: 1,
      };

      console.log('🎉 技能卡修复成功！', skillCard);

      return {
        success: true,
        skillCard: skillCard,
        rawOutput: aiOutput,
      };
    } catch (error) {
      console.error('❌ 技能卡修复失败:', error);
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
   * @returns any | null
   */
  private parseSkillCardJSON(aiOutput: string): any | null {
    try {
      // T-P2-1: 提取设计理由（仅记录日志，不传递给前端）
      const reasonMatch = aiOutput.match(/## 设计理由\s*([\s\S]*?)```json/);
      if (reasonMatch) {
        console.log('📝 设计理由:', reasonMatch[1].trim());
      } else {
        console.log('⚠️ AI 未输出设计理由块');
      }

      // 尝试提取JSON代码块
      const jsonMatch = aiOutput.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const json = JSON.parse(jsonMatch[1]);
        return json;
      }

      // 尝试提取裸JSON（以 { 开头，} 结尾）
      const bareJsonMatch = aiOutput.match(/\{[\s\S]*\}/);
      if (bareJsonMatch) {
        const json = JSON.parse(bareJsonMatch[0]);
        return json;
      }

      console.error('❌ 无法从AI输出中提取JSON');
      return null;
    } catch (error) {
      console.error('❌ JSON解析失败:', error);
      return null;
    }
  }

  /**
   * 检测无聊卡（保守设计检测器）
   * T6: 用于识别过于简单的高稀有度卡牌设计
   * @param skillCard AI 生成的技能卡
   * @param rarity 稀有度
   * @param userDescription 用户特别要求（如有则可跳过部分检测）
   * @returns 检测结果
   */
  private detectBoringCard(
    skillCard: AIGeneratedSkillCardV2,
    rarity: 'UR' | 'SSR' | 'SR' | 'R' | 'N',
    userDescription?: string,
  ): { isBoring: boolean; reason?: string; bypassed?: boolean } {
    // R/N 卡不做无聊检测
    if (rarity === 'R' || rarity === 'N') {
      return { isBoring: false };
    }

    const logicChain = skillCard.engine_data?.logic_chain || [];
    const allActions: string[] = [];

    // 收集所有动作类型
    for (const step of logicChain) {
      if (step.do) {
        for (const action of step.do) {
          if (action.action) {
            allActions.push(action.action);
          }
        }
      }
    }

    const uniqueActions = new Set(allActions);
    const hasDrawCard = uniqueActions.has('DRAW_CARD');
    const hasModifyPlayLimit = uniqueActions.has('MODIFY_PLAY_LIMIT');
    const hasModifyGenki = uniqueActions.has('MODIFY_GENKI');
    const hasRegisterHook = uniqueActions.has('REGISTER_HOOK');
    const hasWhenCondition = logicChain.some(step => step.when);

    // ============= R1: UR 必须有主机制 =============
    if (rarity === 'UR') {
      const URMainMechanics = [
        'REGISTER_HOOK',
        'MODIFY_BUFF_MULTIPLIER',
        'MODIFY_ALL_CARDS',
        'MOVE_CARD_TO_ZONE',
        'PLAY_RANDOM_CARDS',
        'PLAY_CARD_FROM_ZONE',
      ];
      const hasMainMechanic = URMainMechanics.some(m => uniqueActions.has(m));

      if (!hasMainMechanic) {
        return { isBoring: true, reason: 'R1: UR 必须包含至少一个主机制（REGISTER_HOOK 等）' };
      }
    }

    // ============= R2: 保守动作组合检测 =============
    if (hasDrawCard && hasModifyPlayLimit) {
      // T5/T6 兼容：如果用户明确要求了抽牌+出牌次数，跳过检测
      if (userDescription && /抽牌|出牌次数|使用数|手牌/.test(userDescription)) {
        console.log('🎫 用户要求包含抽牌/出牌次数相关需求，跳过 R2 检测');
        return { isBoring: false, bypassed: true };
      }

      if (rarity === 'UR' || rarity === 'SSR') {
        return { isBoring: true, reason: 'R2: UR/SSR 同时出现 DRAW_CARD + MODIFY_PLAY_LIMIT（保守三件套）' };
      }
    }

    // ============= R3: UR 复杂度下限 =============
    if (rarity === 'UR') {
      // UR 至少包含 3 种不同动作
      if (uniqueActions.size < 3) {
        return { isBoring: true, reason: `R3: UR 需要至少 3 种不同动作（当前 ${uniqueActions.size} 种）` };
      }

      // UR 必须至少有 1 个 when 条件
      if (!hasWhenCondition && !hasRegisterHook) {
        return { isBoring: true, reason: 'R3: UR 必须包含 when 条件或 REGISTER_HOOK' };
      }
    }

    // ============= R4: SSR 复杂度检查 =============
    if (rarity === 'SSR') {
      // SSR 至少包含 2 种不同动作
      if (uniqueActions.size < 2) {
        return { isBoring: true, reason: `R4: SSR 需要至少 2 种不同动作（当前 ${uniqueActions.size} 种）` };
      }
    }

    // ============= R5: 保守三件套计数 =============
    const conservativeCount = [hasDrawCard, hasModifyPlayLimit, hasModifyGenki].filter(Boolean).length;
    if (conservativeCount >= 2 && rarity === 'UR') {
      // T5/T6 兼容：如果用户明确要求了相关效果，跳过检测
      if (userDescription && /元气|抽牌|出牌次数|使用数|手牌|回复/.test(userDescription)) {
        console.log('🎫 用户要求包含保守三件套相关需求，跳过 R5 检测');
        return { isBoring: false, bypassed: true };
      }
      return {
        isBoring: true,
        reason: `R5: UR 不应同时使用 ${conservativeCount} 种保守动作（DRAW_CARD/MODIFY_PLAY_LIMIT/MODIFY_GENKI）`,
      };
    }

    return { isBoring: false };
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
   * 验证技能卡（使用 SkillCardV2 Schema）
   * @param skillCard 技能卡对象
   * @returns AIGeneratedSkillCardV2 | null
   */
  private validateSkillCardV2(skillCard: any): AIGeneratedSkillCardV2 | null {
    // 1. 首先检查是否有 engine_data（必填）
    if (!skillCard.engine_data) {
      console.error('❌ 技能卡缺少必填字段 engine_data');

      // 检查是否使用了旧格式
      if (skillCard.effectEntries) {
        console.error('⚠️ 检测到旧格式输出！AI 使用了 effectEntries，但新格式需要 engine_data。');
        throw new Error(
          '技能卡格式验证失败：缺少 engine_data 必填字段。AI 输出了旧格式 effectEntries，但新版本要求 engine_data-first。',
        );
      }

      throw new Error('技能卡格式验证失败：缺少 engine_data 必填字段。');
    }

    // 2. 验证 engine_data 结构
    const engineValidation = validateEngineData(skillCard.engine_data);
    if (!engineValidation.success) {
      console.error('❌ engine_data 校验失败:', engineValidation.errors);
      const zodError = engineValidation.errors;
      let errorMessages = '未知错误';
      if (zodError && zodError.issues) {
        errorMessages = zodError.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('\n');
      }
      throw new Error(`engine_data 校验失败:\n${errorMessages}`);
    }

    // 3. 完整 Schema 验证
    try {
      const validated = AIGeneratedSkillCardV2Schema.parse(skillCard);
      console.log('✅ SkillCardV2 验证通过（含 engine_data）');
      return validated;
    } catch (error) {
      console.error('❌ SkillCardV2 验证失败:', error);

      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map(issue => `字段 "${issue.path.join('.')}": ${issue.message}`).join('\n');

        throw new Error(`SkillCardV2 格式验证失败:\n${errorMessages}`);
      }
      throw error;
    }
  }

  /**
   * 清理无效 visual_hint（空对象或缺少必填字段时移除）
   */
  private sanitizeVisualHint(skillCard: any): void {
    if (!skillCard || !skillCard.visual_hint) return;
    const visualHint = skillCard.visual_hint;
    const requiredKeys = ['key', 'symbol', 'color', 'isDebuff', 'shortName', 'description'];
    const hasAllRequired = requiredKeys.every(key => visualHint[key] !== undefined && visualHint[key] !== null);

    if (!hasAllRequired) {
      console.warn('⚠️ 清理无效 visual_hint：缺少必填字段，将移除 visual_hint');
      delete skillCard.visual_hint;
    }
  }

  /**
   * 标准化 type 和 plan 字段（将中文/混合大小写转换为引擎格式）
   * type: 精神 -> M, 主动 -> A, 陷阱 -> T
   * plan: Sense/感性 -> sense, Logic/理性 -> logic, etc.
   */
  private normalizeType(skillCard: any): void {
    if (!skillCard) return;

    // 标准化 type 字段
    if (skillCard.type) {
      const typeMap: Record<string, string> = {
        精神: 'M',
        主动: 'A',
        陷阱: 'T',
        mental: 'M',
        active: 'A',
        trap: 'T',
      };
      // 先转小写再查找（大小写宽容）
      const typeLower = skillCard.type.toLowerCase();
      if (typeMap[skillCard.type]) {
        console.log(`🔧 标准化 type: "${skillCard.type}" -> "${typeMap[skillCard.type]}"`);
        skillCard.type = typeMap[skillCard.type];
      } else if (typeMap[typeLower]) {
        console.log(`🔧 标准化 type: "${skillCard.type}" -> "${typeMap[typeLower]}"`);
        skillCard.type = typeMap[typeLower];
      }
    }

    // 标准化 plan 字段（大小写宽容）
    if (skillCard.plan) {
      const planMap: Record<string, string> = {
        sense: 'sense',
        logic: 'logic',
        anomaly: 'anomaly',
        感性: 'sense',
        理性: 'logic',
        非凡: 'anomaly',
        自由: 'sense',
        free: 'sense',
      };
      const planLower = skillCard.plan.toLowerCase();
      if (planMap[planLower] && skillCard.plan !== planMap[planLower]) {
        console.log(`🔧 标准化 plan: "${skillCard.plan}" -> "${planMap[planLower]}"`);
        skillCard.plan = planMap[planLower];
      }
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
   * 将 AI 生成的 SkillCardV2 转换为战斗系统的 SkillCard 格式
   * ⚠️ 核心：保留 engine_data 原样传递给引擎
   * @param v2Card AI 生成的 SkillCardV2
   * @param characterName 角色名称
   * @returns SkillCard
   */
  private convertSkillCardV2ToSkillCard(v2Card: AIGeneratedSkillCardV2, characterName: string): SkillCard {
    // 培育计划映射（英文 -> 中文）
    const planMap: Record<string, ProducePlan> = {
      sense: '感性',
      logic: '理性',
      anomaly: '非凡',
      感性: '感性',
      理性: '理性',
      非凡: '非凡',
      自由: '自由',
    };

    const plan = planMap[v2Card.plan] || '感性';
    const cardType = v2Card.type as SkillCard['cardType'];

    // 从 engine_data.cost 获取费用
    const cost = `元气消耗${v2Card.engine_data.cost.genki}`;

    // 限制信息
    const restrictions = {
      isDuplicatable: !v2Card.restrictions?.is_unique,
      usesPerBattle: v2Card.restrictions?.uses_per_battle ?? null,
    };

    const restrictionText = [
      v2Card.restrictions?.is_unique ? '不可重复' : null,
      v2Card.engine_data.constraints?.exhaust_on_play ? '训练中限1次' : null,
    ]
      .filter(Boolean)
      .join(' ');

    // T-7: 处理 Name (display.name -> 根级 name -> id fallback)
    let name = v2Card.id;
    let nameJP = '';
    if (v2Card.display?.name) {
      // 优先使用 display.name
      name = v2Card.display.name;
      nameJP = v2Card.display.nameJP || '';
    } else if ((v2Card as any).name && typeof (v2Card as any).name === 'string') {
      // T-7: 尝试从根级 name 获取（AI 卡牌常见结构）
      name = (v2Card as any).name;
      nameJP = (v2Card as any).nameJP || '';
      console.log(`📝 [convertSkillCardV2ToSkillCard] 使用根级 name: ${name}`);
    } else {
      // 最后尝试从 ID 解析
      // ID 格式通常为: Character_Rarity_Theme 或更长
      // T-7: 使用最后一段作为名称（而非固定 parts[2]，避免取到 "ur"）
      const parts = v2Card.id.split('_');
      if (parts.length >= 1) {
        name = parts[parts.length - 1]; // 取最后一段
      }
      console.warn(`⚠️ [convertSkillCardV2ToSkillCard] 卡牌 ${v2Card.id} 缺失 name，使用 ID fallback: ${name}`);
    }
    const finalName = nameJP ? `${nameJP} / ${name}` : name;

    // 处理 Description (display.description -> effectEntries fallback)
    let description = '';
    if (v2Card.display?.description) {
      description = v2Card.display.description;
    } else {
      // 从 effectEntries 生成描述
      description = this.convertEffectEntriesToText(v2Card.effectEntries, []);
    }

    // 处理 Flavor (display.flavor -> root flavor)
    // T-12: 优先使用 flavorCN，支持双语
    const flavor = (v2Card.display as any)?.flavorCN || v2Card.display?.flavor || v2Card.flavor;
    // T-12: 尝试从 display 或 root 获取 flavorJP
    const flavorJP = (v2Card.display as any)?.flavorJP || (v2Card as any).flavorJP;

    console.log('🔍 [convertSkillCardV2ToSkillCard] Flavor extraction:', {
      display: v2Card.display,
      rootFlavorJP: (v2Card as any).flavorJP,
      extractedFlavor: flavor,
      extractedFlavorJP: flavorJP,
    });

    return {
      id: v2Card.id,
      name: finalName,
      rarity: v2Card.rarity as SkillCardRarity,
      plan,
      cardType,
      cost,

      // ⚠️ 核心：保留 engine_data 给引擎执行
      engine_data: v2Card.engine_data,
      // 旧格式（向后兼容，从 description 生成）
      effect_before: restrictionText ? `${description} ※${restrictionText}` : description,
      effect_after: description, // 简化：强化版也用同一描述

      // 新格式（词条式）
      effectEntries: v2Card.effectEntries,
      effectEntriesEnhanced: v2Card.effectEntriesEnhanced || [],
      conditionalEffects: [],
      conditionalEffectsEnhanced: [],
      restrictions,

      // 其他字段
      enhanced: false,
      isExclusive: true,
      bindingCardId: characterName,
      flavor: flavor,

      // 可选：visual_hint 传递
      visual_hint: v2Card.visual_hint,
    };
  }

  /**
   * [旧版] 将AI生成的技能卡转换为战斗系统的SkillCard格式
   * @deprecated 使用 convertSkillCardV2ToSkillCard 代替
   * @param aiCard AI生成的技能卡
   * @param characterName 角色名称
   * @returns SkillCard
   */
  private convertToSkillCard(aiCard: any, characterName: string): SkillCard {
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

/**
 * 快捷函数：生成技能卡修复
 */
export async function generateSkillCardRepair(options: SkillCardRepairOptions): Promise<GenerationResult> {
  const assistant = getAIAssistant();
  return await assistant.generateSkillCardRepair(options);
}
