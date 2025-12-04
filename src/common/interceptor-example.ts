/**
 * 消息拦截器使用示例
 *
 * 展示如何使用 messageInterceptor 监听和响应消息
 */

import { messageInterceptor, type InterceptedMessage } from './message-interceptor';

// ============================================================================
// 示例 1: 监听用户消息
// ============================================================================

export function setupUserMessageListener() {
  const unsubscribe = messageInterceptor.onUserMessage((message: InterceptedMessage) => {
    console.log('收到用户消息:', message.content);

    // 检测特定关键词
    if (message.content.includes('生成技能卡')) {
      console.log('🎨 检测到生成请求！');
      handleSkillCardGenerationRequest(message);
    }

    if (message.content.includes('查看卡牌')) {
      console.log('📋 显示卡牌列表');
      // TODO: 打开卡牌管理界面
    }
  });

  // 在页面卸载时取消订阅
  $(window).on('pagehide', unsubscribe);
}

// ============================================================================
// 示例 2: 监听AI回复
// ============================================================================

export function setupAIMessageListener() {
  const unsubscribe = messageInterceptor.onAIMessage((message: InterceptedMessage) => {
    console.log('收到AI消息:', message.content);

    // 尝试解析结构化内容
    const parsed = parseSkillCardFromAI(message.content);

    if (parsed) {
      console.log('✅ 解析到技能卡:', parsed);
      saveGeneratedSkillCard(parsed);
      toastr.success(`新技能卡已生成：${parsed.name}`);
    }
  });

  $(window).on('pagehide', unsubscribe);
}

// ============================================================================
// 示例 3: 监听生成事件
// ============================================================================

export function setupGenerationListener() {
  const unsubscribe = messageInterceptor.onGeneration(event => {
    if (event.type === 'started') {
      console.log('🚀 AI开始生成...');
      // 可以在这里注入额外的上下文
    }

    if (event.type === 'stopped') {
      console.log('⏸️ AI生成已停止');
    }

    if (event.type === 'finished') {
      console.log('✅ AI生成完成');
    }
  });

  $(window).on('pagehide', unsubscribe);
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 处理技能卡生成请求
 */
async function handleSkillCardGenerationRequest(message: InterceptedMessage) {
  // 提取参数
  const params = extractGenerationParams(message.content);

  // 组装提示词（简化版，完整版在 prompt-factory.ts）
  const prompt = `
请生成一张技能卡：
- 属性：${params.attribute || '理性'}
- 稀有度：${params.rarity || 'SSR'}

输出格式：
\`\`\`json
{
  "name": "卡牌名称",
  "attribute": "理性",
  "rarity": "SSR",
  "cost": 5,
  "effect_before": "效果描述",
  "effect_after": "强化后效果"
}
\`\`\`
  `;

  // 注入提示词
  await messageInterceptor.appendToSystemPrompt(prompt);

  console.log('✅ 提示词已注入');
}

/**
 * 提取生成参数
 */
function extractGenerationParams(content: string): {
  attribute?: string;
  rarity?: string;
} {
  const params: any = {};

  // 检测属性
  if (content.includes('理性')) params.attribute = '理性';
  if (content.includes('感性')) params.attribute = '感性';
  if (content.includes('非凡')) params.attribute = '非凡';
  if (content.includes('自由')) params.attribute = '自由';

  // 检测稀有度
  if (content.includes('SSR')) params.rarity = 'SSR';
  if (content.includes('SR')) params.rarity = 'SR';
  if (content.includes('R')) params.rarity = 'R';
  if (content.includes('N')) params.rarity = 'N';

  return params;
}

/**
 * 从AI回复中解析技能卡
 */
function parseSkillCardFromAI(content: string): any {
  // 尝试解析JSON代码块
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.name && parsed.attribute) {
        return parsed;
      }
    } catch (e) {
      console.warn('JSON解析失败:', e);
    }
  }

  return null;
}

/**
 * 保存AI生成的技能卡
 */
async function saveGeneratedSkillCard(card: any) {
  // 导入存储函数
  const { getGachaData, saveGachaData } = await import('../偶像大师闪耀色彩/utils/game-data');

  // 读取现有数据
  const gameData = await getGachaData();

  // 添加生成的技能卡
  if (!gameData.generatedSkillCards) {
    (gameData as any).generatedSkillCards = [];
  }

  (gameData as any).generatedSkillCards.push({
    ...card,
    generatedAt: Date.now(),
    id: `generated_${Date.now()}`,
  });

  // 保存
  await saveGachaData(gameData);

  console.log('💾 技能卡已保存到IndexedDB');
}

// ============================================================================
// 初始化所有监听器
// ============================================================================

export function initializeAllListeners() {
  setupUserMessageListener();
  setupAIMessageListener();
  setupGenerationListener();

  console.log('✅ 所有消息监听器已初始化');
}




