/**
 * 世界书服务
 * 统一管理思维链、提示词、示例卡的世界书操作
 */

import { ChainOfThoughtManager, ChainOfThoughtMode } from './思维链区';
import { PromptManager, PromptMode, type PromptVariables } from './提示词区';
import { ExampleCardSelector, type ExampleCardConfig } from './示例卡抽取区';
import type { SkillCardRarity } from '../战斗/类型/技能卡类型';
import type { ProducePlan } from '../战斗/类型/技能卡类型';

/**
 * 世界书管理配置
 */
export interface WorldbookConfig {
  /** 世界书名称 */
  worldbookName: string;
  /** 是否在生成后自动清理示例卡 */
  autoCleanup?: boolean;
}

/**
 * 世界书服务类
 * 提供世界书的统一管理接口
 */
export class WorldbookService {
  private static config: WorldbookConfig = {
    worldbookName: '偶像大师',
    autoCleanup: true,
  };

  /**
   * 初始化世界书配置
   * @param config 配置对象
   */
  static initialize(config: Partial<WorldbookConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📚 世界书服务已初始化:', this.config);
  }

  /**
   * 获取当前配置
   */
  static getConfig(): WorldbookConfig {
    return { ...this.config };
  }

  /**
   * 初始化世界书（创建思维链和提示词框架）
   * @returns Promise<void>
   */
  static async initializeWorldbook(): Promise<void> {
    const { worldbookName } = this.config;

    console.log('📚 开始初始化世界书...');

    // 初始化提示词框架
    await PromptManager.initializePromptToWorldbook(worldbookName);

    // 初始化思维链
    await ChainOfThoughtManager.initializeChainToWorldbook(worldbookName);

    console.log('✅ 世界书初始化完成！');
  }

  /**
   * 设置思维链模式（切换到指定模式）
   * @param mode 思维链模式
   * @returns Promise<void>
   */
  static async setChainOfThoughtMode(mode: ChainOfThoughtMode): Promise<void> {
    const { worldbookName } = this.config;
    await ChainOfThoughtManager.addChainToWorldbook(worldbookName, mode);
    console.log(`✅ 已切换思维链模式: ${mode}`);
  }

  /**
   * 准备技能卡生成（更新提示词和示例卡）
   * @param variables 提示词变量
   * @param exampleConfig 示例卡配置
   * @returns Promise<void>
   */
  static async prepareSkillCardGeneration(
    variables: PromptVariables,
    exampleConfig: ExampleCardConfig,
  ): Promise<void> {
    const { worldbookName } = this.config;

    console.log('📝 开始准备技能卡生成...');

    // 1. 抽取示例卡
    console.log('📊 抽取示例卡...');
    const exampleResult = ExampleCardSelector.selectExampleCards(exampleConfig);
    const exampleCardsMarkdown = ExampleCardSelector.formatAsMarkdown(exampleResult, exampleConfig.targetRarity);

    // 2. 填充示例卡到变量
    const completeVariables: PromptVariables = {
      ...variables,
      exampleCards: exampleCardsMarkdown,
    };

    // 3. 更新提示词框架
    console.log('📝 更新提示词框架...');
    await PromptManager.addPromptToWorldbook(worldbookName, PromptMode.SKILL_CARD_GENERATION, completeVariables);

    // 4. 更新示例卡条目
    console.log('📚 更新示例卡条目...');
    await ExampleCardSelector.addExampleCardsToWorldbook(worldbookName, exampleConfig);

    // 5. 确保思维链处于技能卡生成模式
    await this.setChainOfThoughtMode(ChainOfThoughtMode.SKILL_CARD_GENERATION);

    console.log('✅ 技能卡生成准备完成！');
  }

  /**
   * 清理世界书（移除示例卡等临时条目）
   * @returns Promise<void>
   */
  static async cleanup(): Promise<void> {
    const { worldbookName } = this.config;

    console.log('🧹 清理世界书临时条目...');

    // 移除示例卡
    await ExampleCardSelector.removeExampleCardsFromWorldbook(worldbookName);

    console.log('✅ 世界书清理完成！');
  }

  /**
   * 检查世界书是否已初始化
   * @returns boolean
   */
  static async isInitialized(): Promise<boolean> {
    const { worldbookName } = this.config;

    const hasChain = await ChainOfThoughtManager.chainExistsInWorldbook(worldbookName);
    const hasPrompt = await PromptManager.promptExistsInWorldbook(worldbookName);

    return hasChain && hasPrompt;
  }

  /**
   * 完全重置世界书（移除所有条目）
   * @returns Promise<void>
   */
  static async reset(): Promise<void> {
    const { worldbookName } = this.config;

    console.log('🔄 重置世界书...');

    // 移除思维链
    await ChainOfThoughtManager.removeChainFromWorldbook(worldbookName);

    // 移除提示词
    await PromptManager.removePromptFromWorldbook(worldbookName);

    // 移除示例卡
    await ExampleCardSelector.removeExampleCardsFromWorldbook(worldbookName);

    console.log('✅ 世界书已重置！');
  }

  /**
   * 获取世界书状态信息
   * @returns 状态对象
   */
  static async getStatus(): Promise<{
    worldbookName: string;
    initialized: boolean;
    hasChain: boolean;
    hasPrompt: boolean;
  }> {
    const { worldbookName } = this.config;

    const hasChain = await ChainOfThoughtManager.chainExistsInWorldbook(worldbookName);
    const hasPrompt = await PromptManager.promptExistsInWorldbook(worldbookName);

    return {
      worldbookName,
      initialized: hasChain && hasPrompt,
      hasChain,
      hasPrompt,
    };
  }
}

// 导出类型和枚举
export { ChainOfThoughtMode, PromptMode };
export type { PromptVariables, ExampleCardConfig };


