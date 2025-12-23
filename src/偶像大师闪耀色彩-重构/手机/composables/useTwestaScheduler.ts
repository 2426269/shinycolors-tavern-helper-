/**
 * Twesta 发推调度器
 * 独立于 Chain 调度器，管理 Twesta 推文的定时生成
 */

import { computed } from 'vue';
import { getGenerateApiConfig, loadPhoneApiSettings } from '../数据/PhoneApiSettings';
import {
  getCharacterName,
  getRandomIdolId,
  getRandomUnusedTwestaImage,
  getTwestaAvatarUrl,
  TWESTA_CHARACTERS,
} from '../数据/TwestaAssets';
import { DEFAULT_USER_PROFILE, IdolDramaState, TweetComment, TweetData, TwestaStorageData } from '../数据/TwestaTypes';
import {
  getTwestaPostWithCommentsChain,
  getTwestaPostWithCommentsPrompt,
  getTwestaProducerPostChain,
  getTwestaProducerPostPrompt,
  getTwestaUserInteractionChain,
  getTwestaUserInteractionPrompt,
} from '../数据/Twesta提示词';

// ==================== 存储 Key ====================
const TWESTA_STORAGE_KEY = 'shinycolors_twesta_data';
const TWESTA_DRAMA_KEY = 'shinycolors_twesta_drama';

// ==================== 状态管理 ====================

/** 加载 Twesta 数据 */
export function loadTwestaData(): TwestaStorageData {
  try {
    const saved = localStorage.getItem(TWESTA_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('[Twesta] Failed to load data:', e);
  }
  return {
    tweets: [],
    userProfile: { ...DEFAULT_USER_PROFILE },
    idolDramaStates: [],
    lastUpdateTimestamp: Date.now(),
  };
}

/** 保存 Twesta 数据 */
export function saveTwestaData(data: TwestaStorageData): void {
  try {
    data.lastUpdateTimestamp = Date.now();
    localStorage.setItem(TWESTA_STORAGE_KEY, JSON.stringify(data));
    // 触发更新事件
    window.dispatchEvent(new CustomEvent('twesta-data-updated', { detail: data }));
  } catch (e) {
    console.error('[Twesta] Failed to save data:', e);
  }
}

/** 加载偶像节奏状态 */
export function loadDramaStates(): IdolDramaState[] {
  try {
    const saved = localStorage.getItem(TWESTA_DRAMA_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('[Twesta] Failed to load drama states:', e);
  }
  return [];
}

/** 保存偶像节奏状态 */
export function saveDramaStates(states: IdolDramaState[]): void {
  try {
    localStorage.setItem(TWESTA_DRAMA_KEY, JSON.stringify(states));
  } catch (e) {
    console.error('[Twesta] Failed to save drama states:', e);
  }
}

// ==================== 工具函数 ====================

/** 获取当前时间字符串 */
function getCurrentTimeString(): string {
  const now = new Date();
  return now.toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 生成唯一 ID */
function generateId(): string {
  return `tweet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 检查是否在深夜 */
function isNightTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 0 && hour < 7;
}

/** 概率判定 */
function shouldTrigger(probability: number): boolean {
  return Math.random() * 100 < probability;
}

/** 将图片 URL 转换为 Base64 Data URL (避免 CORS 问题) */
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    console.log(`[Twesta] Fetching image as Base64: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`[Twesta] Failed to fetch image: ${response.status}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('[Twesta] Failed to convert image to Base64:', e);
    return null;
  }
}

// ==================== API 调用 ====================

/** 声明 TavernHelper 类型 */
declare global {
  interface Window {
    TavernHelper?: {
      generateRaw: (params: {
        user_input?: string;
        prompt?: string;
        system_prompt?: string;
        ordered_prompts?: Array<{ role: string; content: string } | string>;
        max_chat_history?: number;
        should_stream?: boolean;
        custom_api?: {
          apiurl: string;
          key?: string;
          model?: string;
          source?: string;
          max_tokens?: number;
          temperature?: number;
        };
      }) => Promise<string>;
    };
    generateRaw?: (params: any) => Promise<string>;
  }
}

/**
 * 调用主 API (通过 TavernHelper) 生成推文
 * 使用 ordered_prompts 和 max_chat_history:0 绕过 SillyTavern 上下文
 */
async function callMainApi(systemPrompt: string, userInput: string, image?: string): Promise<string> {
  // 使用 ordered_prompts 确保只发送 Twesta 的提示词，不包含世界书等内容
  const params: any = {
    user_input: userInput,
    should_stream: false,
    ordered_prompts: [{ role: 'system', content: systemPrompt }, 'user_input'],
    max_chat_history: 0, // 不包含聊天历史
  };

  // 如果有配图，添加到请求中让 AI 看到
  // 如果有配图，尝试转换为 Base64 让 AI 看到
  if (image) {
    try {
      const base64 = await fetchImageAsBase64(image);
      if (base64) {
        params.image = [base64];
        console.log('[Twesta] Converted image to Base64 for main API');
      } else {
        console.warn('[Twesta] Failed to convert image to Base64 (likely CORS), sending text only');
      }
    } catch (e) {
      console.warn('[Twesta] Error processing image for main API:', e);
    }
  }

  try {
    // 使用 TavernHelper.generateRaw (新版接口)
    if (typeof window.TavernHelper?.generateRaw === 'function') {
      console.log('[Twesta] Calling TavernHelper.generateRaw with ordered_prompts...');
      const result = await window.TavernHelper.generateRaw(params);
      console.log('[Twesta] TavernHelper.generateRaw succeeded');
      return result || '';
    }

    // 兼容旧版 generateRaw
    if (typeof window.generateRaw === 'function') {
      console.log('[Twesta] Calling window.generateRaw with ordered_prompts...');
      const result = await window.generateRaw(params);
      console.log('[Twesta] window.generateRaw succeeded');
      return result || '';
    }

    console.warn('[Twesta] generateRaw function not available');
    return '';
  } catch (error) {
    console.error('[Twesta] Main API call failed:', error);
    return '';
  }
}

/** 调用自定义 API (支持图片) */
async function callCustomApi(
  systemPrompt: string,
  userInput: string,
  config: ReturnType<typeof getGenerateApiConfig>,
  image?: string,
): Promise<string> {
  if (!config) return '';

  // 构建 user 消息内容（支持图片）
  let userContent: any = userInput;
  if (image) {
    // OpenAI-compatible multimodal format
    userContent = [
      { type: 'text', text: userInput },
      { type: 'image_url', image_url: { url: image } },
    ];
    console.log('[Twesta] Adding image to custom API request');
  }

  const body = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    max_tokens: config.max_tokens || 1000,
    temperature: config.temperature || 0.8,
  };

  const apiUrl = config.apiurl.replace(/\/$/, '');
  const response = await fetch(apiUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.key || ''}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Custom API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ==================== 推文生成 ====================

/** 解析 AI 生成的推文+评论 JSON */
function parseTweetWithCommentsResponse(responseText: string): {
  tweet: { textJP: string; textCN: string; hashtags: string[] };
  comments: Array<{ authorType: string; authorId?: string; authorName: string; textJP: string; textCN: string }>;
  rhythmIncrease?: number; // AI 判断的节奏值增加 (仅黑粉事件时)
} | null {
  try {
    // 检查是否是 API 错误响应
    if (responseText.includes('失败') || responseText.includes('error') || responseText.includes('Error')) {
      console.error('[Twesta] API returned error response:', responseText.slice(0, 500));
      return null;
    }

    // 提取 JSON 部分
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error('[Twesta] Failed to parse tweet response:', e);
    console.error('[Twesta] Raw response (first 500 chars):', responseText.slice(0, 500));
    return null;
  }
}

/** 解析用户互动回复 JSON */
function parseReplyResponse(responseText: string): {
  replies: Array<{ authorType: string; authorId?: string; authorName: string; textJP: string; textCN: string }>;
} | null {
  try {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error('[Twesta] Failed to parse reply response:', e);
    return null;
  }
}

/** 将评论数据转换为 TweetComment 对象 */
function convertToTweetComment(comment: {
  authorType: string;
  authorId?: string;
  authorName: string;
  textJP: string;
  textCN: string;
}): TweetComment {
  // 验证 authorId 是否是有效的偶像 ID（AI 可能返回中文名或无效 ID）
  const validIdolId =
    comment.authorId && (TWESTA_CHARACTERS as readonly string[]).includes(comment.authorId) ? comment.authorId : null;

  // 对于偶像评论,使用有效的 authorId 获取头像; 无效则使用随机偶像头像
  let avatar: string;
  if (comment.authorType === 'idol') {
    if (validIdolId) {
      avatar = getTwestaAvatarUrl(validIdolId);
    } else {
      // authorId 无效（如中文名），使用随机偶像头像
      const randomId = getRandomIdolId();
      avatar = getTwestaAvatarUrl(randomId);
      console.log(`[Twesta] Invalid idol authorId "${comment.authorId}", using random avatar: ${randomId}`);
    }
  } else if (comment.authorType === 'fan' || comment.authorType === 'anti') {
    // 粉丝使用随机偶像头像作为 placeholder
    const randomId = getRandomIdolId();
    avatar = getTwestaAvatarUrl(randomId);
  } else {
    // 制作人/工作人员使用制作人头像
    avatar = getTwestaAvatarUrl('Producer');
  }

  return {
    id: generateId(),
    authorId: validIdolId || comment.authorId || 'fan_' + Math.random().toString(36).slice(2, 6),
    authorType: comment.authorType as 'idol' | 'fan' | 'anti' | 'producer' | 'staff',
    name: comment.authorName,
    avatar,
    text: comment.textCN,
    textJP: comment.textJP,
    time: getCurrentTimeString(),
    timestamp: Date.now(),
    likes: Math.floor(Math.random() * 30),
    likedByMe: false,
    replies: [],
    stageType: 'FRONT',
  };
}

/** 获取随机相关偶像ID列表 */
function getRelatedIdolIds(excludeId: string, count: number = 2): string[] {
  const idols = TWESTA_CHARACTERS.filter(
    c => c !== excludeId && c !== '283pro' && c !== 'Hazuki' && c !== 'Amai' && c !== 'Producer',
  );
  const shuffled = idols.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** 生成偶像推文 (含评论) */
async function generateIdolTweet(idolId: string): Promise<TweetData | null> {
  console.log(`[Twesta] Generating tweet with comments for ${idolId}...`);

  const settings = loadPhoneApiSettings();
  const relatedIdols = getRelatedIdolIds(idolId, 2);

  // 获取该偶像最近的推文作为记忆
  const twestaData = loadTwestaData();
  const recentTweets = twestaData.tweets
    .filter(t => t.authorId === idolId)
    .slice(0, 3) // 最近3条
    .map(t => `- ${t.text.slice(0, 50)}...`)
    .join('\n');

  // 检查节奏状态 (用于后续更新)
  let dramaState = twestaData.idolDramaStates.find(s => s.idolId === idolId);
  if (!dramaState) {
    dramaState = { idolId, rhythmGauge: 0, eventHistory: [] };
    twestaData.idolDramaStates.push(dramaState);
  }

  // 根据设置的黑粉概率决定是否触发黑粉事件
  const antiFanProbability = settings.twesta?.antiFanProbability ?? 5;
  const includeAntiFan = Math.random() * 100 < antiFanProbability;
  if (includeAntiFan) {
    console.log(`[Twesta] Anti-fan event triggered! (${antiFanProbability}% chance)`);
  }

  // 获取用户设置的评论数量
  const commentCount = settings.twesta?.commentCount ?? 3;
  console.log(`[Twesta] Comment count setting: ${commentCount}`);

  // 先决定是否配图（在 API 调用前决定，让 AI 能看到图片）
  const imageProbability = settings.twesta?.imageProbability ?? 15;
  let imageUrl: string | undefined;
  if (Math.random() * 100 < imageProbability) {
    imageUrl = getRandomUnusedTwestaImage(idolId);
    if (imageUrl) {
      console.log(`[Twesta] Will include image: ${imageUrl}`);
    }
  }

  // 使用 PostWithComments 提示词 (同时生成推文和评论)
  const chain = getTwestaPostWithCommentsChain();
  const prompt = getTwestaPostWithCommentsPrompt({
    idolId,
    currentTime: getCurrentTimeString(),
    relatedIdols,
    recentPosts: recentTweets || undefined,
    includeAntiFan,
    commentCount,
    hasImage: !!imageUrl, // 告诉提示词这次有配图
  });

  const fullPrompt = chain + '\n\n' + prompt;
  const apiConfig = getGenerateApiConfig();
  let responseText: string;

  try {
    // 优先使用用户配置的自定义 API
    if (apiConfig?.apiurl) {
      console.log(`[Twesta] Using custom API: ${apiConfig.model || 'default model'}`);
      try {
        // 尝试将图片转换为 Base64 (如果存在)
        let imageToSend = imageUrl;
        if (imageUrl) {
          const base64 = await fetchImageAsBase64(imageUrl);
          if (base64) {
            imageToSend = base64;
            console.log('[Twesta] Converted image to Base64 for custom API');
          }
        }

        // 尝试带图片调用
        responseText = await callCustomApi(
          fullPrompt,
          '请根据提示词生成推文和评论，输出JSON格式',
          apiConfig,
          imageToSend,
        );
        // 检查响应是否包含错误
        if (responseText.includes('失败') || responseText.includes('error')) {
          throw new Error('API returned error with image');
        }
      } catch (imgError) {
        // 如果带图片失败，尝试不带图片重试
        if (imageUrl) {
          console.log('[Twesta] Custom API failed with image, retrying without image...');
          responseText = await callCustomApi(fullPrompt, '请根据提示词生成推文和评论，输出JSON格式', apiConfig);
        } else {
          throw imgError;
        }
      }
    } else {
      // 如果没有配置自定义 API，使用 SillyTavern 主 API (传入图片让 AI 看)
      console.log('[Twesta] Using SillyTavern main API');
      responseText = await callMainApi(fullPrompt, '请根据提示词生成推文和评论，输出JSON格式', imageUrl);
    }
  } catch (e) {
    console.error('[Twesta] API call failed:', e);
    return null;
  }

  const parsed = parseTweetWithCommentsResponse(responseText);
  if (!parsed || !parsed.tweet) {
    console.error('[Twesta] Failed to parse response');
    return null;
  }

  // 创建推文对象
  const tweet: TweetData = {
    id: generateId(),
    authorId: idolId,
    authorType: 'idol',
    name: getCharacterName(idolId),
    avatar: getTwestaAvatarUrl(idolId),
    text: parsed.tweet.textCN,
    textJP: parsed.tweet.textJP,
    time: getCurrentTimeString(),
    timestamp: Date.now(),
    likes: Math.floor(Math.random() * 100) + 10,
    likedByMe: false,
    retweets: Math.floor(Math.random() * 20),
    retweetedByMe: false,
    comments: [],
    stageType: 'FRONT',
    affectionLevel: 0,
  };

  // 添加 hashtags 到内容
  if (parsed.tweet.hashtags && parsed.tweet.hashtags.length > 0) {
    tweet.text += '\n' + parsed.tweet.hashtags.map(t => `#${t}`).join(' ');
  }

  // 如果有配图，添加到推文对象
  if (imageUrl) {
    tweet.image = imageUrl;
    console.log(`[Twesta] Added image to tweet: ${imageUrl}`);
  }

  // 转换并添加评论
  if (parsed.comments && parsed.comments.length > 0) {
    tweet.comments = parsed.comments.map(convertToTweetComment);
    console.log(`[Twesta] Generated ${tweet.comments.length} comments`);
  }

  // 更新节奏条 (仅当触发黑粉事件时，使用AI判断的严重度)
  if (dramaState && includeAntiFan && parsed.rhythmIncrease) {
    const rhythmIncrease = Math.min(10, Math.max(1, parsed.rhythmIncrease || 0));
    dramaState.rhythmGauge = Math.min(100, dramaState.rhythmGauge + rhythmIncrease);
    saveTwestaData(twestaData);
    console.log(
      `[Twesta] Rhythm gauge for ${idolId}: ${dramaState.rhythmGauge}% (+${rhythmIncrease} from anti-fan event)`,
    );
  }

  return tweet;
}

/** 生成偶像对制作人评论的回复 */
export async function generateIdolReplyToProducer(
  tweet: TweetData,
  producerComment: TweetComment,
): Promise<TweetComment | null> {
  console.log(`[Twesta] Generating idol reply to producer comment...`);

  const chain = getTwestaUserInteractionChain();
  const prompt = getTwestaUserInteractionPrompt({
    interactionType: 'comment',
    originalTweet: { author: tweet.name, text: tweet.text },
    userText: producerComment.text,
    idolId: tweet.authorId,
  });

  const fullPrompt = chain + '\n\n' + prompt;
  const apiConfig = getGenerateApiConfig();
  let responseText: string;

  try {
    // 优先使用用户配置的自定义 API
    if (apiConfig?.apiurl) {
      responseText = await callCustomApi(fullPrompt, '请生成偶像的回复', apiConfig);
    } else {
      responseText = await callMainApi(fullPrompt, '请生成偶像的回复');
    }
  } catch (e) {
    console.error('[Twesta] API call failed:', e);
    return null;
  }

  const parsed = parseReplyResponse(responseText);
  if (!parsed || !parsed.replies || parsed.replies.length === 0) {
    return null;
  }

  // 返回第一条回复 (偶像回复)
  return convertToTweetComment(parsed.replies[0]);
}

/** 生成偶像/粉丝对制作人发帖的回复 */
export async function generateRepliesToProducerPost(
  producerTweet: TweetData,
  担当IdolId?: string,
): Promise<TweetComment[]> {
  console.log(`[Twesta] Generating replies to producer post...`);

  const settings = loadPhoneApiSettings();
  const chain = getTwestaProducerPostChain();
  const prompt = getTwestaProducerPostPrompt({
    producerName: producerTweet.name,
    postText: producerTweet.text,
    担当Idol: 担当IdolId,
    relatedIdols: getRelatedIdolIds(担当IdolId || '', 2),
  });

  const fullPrompt = chain + '\n\n' + prompt;
  const apiConfig = getGenerateApiConfig();
  let responseText: string;

  try {
    // 优先使用用户配置的自定义 API
    if (apiConfig?.apiurl) {
      responseText = await callCustomApi(fullPrompt, '请生成回复', apiConfig);
    } else {
      responseText = await callMainApi(fullPrompt, '请生成回复');
    }
  } catch (e) {
    console.error('[Twesta] API call failed:', e);
    return [];
  }

  const parsed = parseReplyResponse(responseText);
  if (!parsed || !parsed.replies) {
    return [];
  }

  return parsed.replies.map(convertToTweetComment);
}

/** 生成粉丝/黑粉对制作人回复的再回复 */
export async function generateFanReplyToProducer(
  originalComment: TweetComment,
  producerReply: TweetComment,
): Promise<TweetComment | null> {
  console.log(`[Twesta] Generating ${originalComment.authorType} reply to producer...`);

  const settings = loadPhoneApiSettings();

  // 根据评论类型生成不同风格的提示词
  const authorType = originalComment.authorType;
  const fanStyle =
    authorType === 'anti'
      ? `你是一个轻度黑粉。回复要略带讽刺或质疑，但不要太过分。
示例: "哼，是吗"、"呵……"、"所以呢？"、"我怎么知道"`
      : `你是一个热情的粉丝。回复要开心、感激。
示例: "太开心了！制作人居然回复我！"、"谢谢制作人！会继续支持的！"、"わー！嬉しい！"`;

  const prompt = `# 粉丝回复任务

## 场景
- 类型: ${authorType === 'anti' ? '黑粉' : '粉丝'}
- 原评论: ${originalComment.text}
- 制作人回复: ${producerReply.text}

## 任务
生成该${authorType === 'anti' ? '黑粉' : '粉丝'}对制作人回复的反应。

## 风格要求
${fanStyle}

## 输出格式（JSON）
\`\`\`json
{
  "reply": {
    "textJP": "日语回复",
    "textCN": "中文翻译"
  }
}
\`\`\``;

  const apiConfig = getGenerateApiConfig();
  let responseText: string;

  try {
    if (apiConfig?.apiurl) {
      responseText = await callCustomApi(prompt, '请生成粉丝回复', apiConfig);
    } else {
      responseText = await callMainApi(prompt, '请生成粉丝回复');
    }
  } catch (e) {
    console.error('[Twesta] API call failed:', e);
    return null;
  }

  // 解析回复
  try {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
    const parsed = JSON.parse(jsonStr.trim());

    if (parsed.reply) {
      const reply: TweetComment = {
        id: `comment_${Date.now()}_fanreply`,
        authorId: originalComment.authorId,
        authorType: originalComment.authorType,
        name: originalComment.name,
        avatar: originalComment.avatar || '',
        text: parsed.reply.textCN || parsed.reply.textJP || '',
        time: new Date().toLocaleString('ja-JP', {
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        timestamp: Date.now(),
        likes: 0,
        likedByMe: false,
        replies: [],
        stageType: 'FRONT',
      };
      console.log(`[Twesta] ${authorType} reply generated:`, reply.text.slice(0, 30));
      return reply;
    }
  } catch (e) {
    console.error('[Twesta] Failed to parse fan reply:', e);
  }

  return null;
}
// ==================== 调度器 ====================

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let isSchedulerRunning = false;

/** 启动 Twesta 调度器 */
export function startTwestaScheduler(): void {
  if (isSchedulerRunning) {
    console.log('[Twesta] Scheduler already running');
    return;
  }

  isSchedulerRunning = true;
  console.log('[Twesta] Starting scheduler...');

  const runScheduler = async () => {
    const settings = loadPhoneApiSettings();
    const twestaSettings = settings.twesta;

    if (!twestaSettings.enabled) {
      console.log('[Twesta] Scheduler disabled');
      return;
    }

    // 深夜模式检查
    if (twestaSettings.nightModeEnabled && isNightTime()) {
      console.log('[Twesta] Night mode active, skipping');
      return;
    }

    // 概率判定
    if (!shouldTrigger(twestaSettings.probability)) {
      console.log('[Twesta] Probability check failed');
      return;
    }

    // 选择随机偶像发推
    const idolId = getRandomIdolId();
    console.log(`[Twesta] Selected idol: ${idolId}`);

    // 生成推文
    const tweet = await generateIdolTweet(idolId);
    if (!tweet) {
      console.log('[Twesta] Failed to generate tweet');
      return;
    }

    // 保存推文
    const data = loadTwestaData();
    data.tweets.unshift(tweet);
    // 限制推文数量，避免存储过大
    if (data.tweets.length > 200) {
      data.tweets = data.tweets.slice(0, 200);
    }
    saveTwestaData(data);

    console.log('[Twesta] Tweet generated and saved:', tweet.text.slice(0, 50) + '...');
  };

  // 立即运行一次
  runScheduler();

  // 设置定时器
  const settings = loadPhoneApiSettings();
  const intervalMs = (settings.twesta.intervalMinutes || 15) * 60 * 1000;
  schedulerInterval = setInterval(runScheduler, intervalMs);
  console.log(`[Twesta] Scheduler started with interval: ${settings.twesta.intervalMinutes} minutes`);
}

/** 停止 Twesta 调度器 */
export function stopTwestaScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  isSchedulerRunning = false;
  console.log('[Twesta] Scheduler stopped');
}

/** 重启 Twesta 调度器 */
export function restartTwestaScheduler(): void {
  stopTwestaScheduler();
  startTwestaScheduler();
}

/** 手动触发一次推文生成 */
export async function triggerTwestaTweet(): Promise<TweetData | null> {
  const idolId = getRandomIdolId();
  const tweet = await generateIdolTweet(idolId);
  if (tweet) {
    const data = loadTwestaData();
    data.tweets.unshift(tweet);
    saveTwestaData(data);
  }
  return tweet;
}

// ==================== Composable ====================

export function useTwestaScheduler() {
  const tweetCount = computed(() => loadTwestaData().tweets.length);

  return {
    startTwestaScheduler,
    stopTwestaScheduler,
    restartTwestaScheduler,
    triggerTwestaTweet,
    loadTwestaData,
    saveTwestaData,
    tweetCount,
  };
}
