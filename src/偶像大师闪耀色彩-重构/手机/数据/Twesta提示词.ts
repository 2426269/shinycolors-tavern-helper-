/**
 * Twesta (推特应用) 提示词管理
 *
 * 核心流程:
 * 1. 发推+评论: 偶像发推时同时生成评论
 * 2. 用户互动: 制作人操作后触发AI回复
 */

import { getCharacterName } from './TwestaAssets';

// ==================== 规则常量 ====================

/** 制作人评论后偶像必定回复 */
export const PRODUCER_ALWAYS_GETS_REPLY = true;

/** 黑粉评论概率(%) - kirakira世界观，保持低概率 */
export const ANTI_FAN_PROBABILITY = 5;

/** 黑粉评论尺度提示 */
export const ANTI_FAN_STYLE_GUIDE = `
黑粉评论必须非常温和，这是kirakira的偶像大师世界观:
- ❌ 不允许: 人身攻击、恶意诋毁、脏话
- ✅ 允许: 轻微质疑、不理解、小酸话
- 示例: "又是这种营业内容..."、"感觉最近没什么进步啊"、"这张照片P得太明显了吧"
`;

// ==================== 发推+评论模式 ====================

/**
 * 发推+评论思维链
 */
export function getTwestaPostWithCommentsChain(): string {
  return `[Chain of thought]
<think>
## 1. 营业模式确认
- 公开推文，面向粉丝，不透露与制作人的私密关系
- 风格比Chain私聊更正式、友好

## 2. 发帖者类型判断
- **偶像**: 个人风格发帖，日常/工作/心情
- **283pro官方账号**: 发布官方公告、活动信息、配图（如演出照片）
- 注意: 配图可能由官方账号发布，不一定是偶像本人

## 3. 推文设计
- 这位偶像的Twesta说话风格？
- 话题: 日常分享/工作宣传/感谢粉丝/心情表达
- 使用emoji和#标签增加活力

## 4. 同步生成评论（2-4条）
- 选1-2个关系近的偶像来评论
- 生成1-2条粉丝支持评论
- 默认不生成黑粉评论（只有节奏事件时才触发）
- 总数控制在2-4条，不要太多
</think>
[/Chain of thought]
`;
}

/**
 * 发推+评论提示词
 */
export function getTwestaPostWithCommentsPrompt(params: {
  idolId: string;
  currentTime: string;
  specialEvent?: string;
  recentPosts?: string;
  relatedIdols?: string[];
  includeAntiFan?: boolean;
  commentCount?: number;
  hasImage?: boolean; // 是否有配图（AI 会看到图片）
}): string {
  const idolName = getCharacterName(params.idolId);
  const targetCommentCount = params.commentCount ?? 3;

  // 如果有配图，添加看图说话的提示
  const imagePrompt = params.hasImage
    ? `## ⚠️ 配图模式（重要！）
本次推文**附带了一张图片**，你可以看到这张图片。
**请仔细观察图片内容**，然后根据图片生成相关的推文：
- 如果图片是演出/活动场景 → 感谢粉丝支持、分享活动感想
- 如果图片是日常/美食/风景 → 描述此刻心情、分享生活
- 如果图片是自拍/写真 → 展示近况、询问粉丝意见
**推文内容必须与图片内容相关！**\n\n`
    : '';

  // 根据是否有黑粉生成不同的评论规则
  const commentRules = params.includeAntiFan
    ? `## 评论规则（本次含黑粉事件）
- 偶像评论: ${params.relatedIdols?.map(id => getCharacterName(id)).join('、') || '选择1-2个关系近的偶像'}
- 粉丝评论: 热情支持（若干条）
- **黑粉评论**: 必须生成1条温和的黑粉评论
${ANTI_FAN_STYLE_GUIDE}
- 总评论数: **恰好 ${targetCommentCount} 条**（不多不少）

## ⚠️ 节奏值判定
根据黑粉评论的严重程度，在 rhythmIncrease 字段填写 1-10:
- 1-3: 轻微酸话，无伤大雅
- 4-6: 明显质疑，引发小范围讨论
- 7-10: 较严重的负面评价，可能引发争议`
    : `## 评论规则（普通模式）
- 偶像评论: ${params.relatedIdols?.map(id => getCharacterName(id)).join('、') || '选择1-2个关系近的偶像'}
- 粉丝评论: 热情支持，表达喜欢
- 黑粉评论: **本次不生成黑粉**
- 总评论数: **恰好 ${targetCommentCount} 条**（不多不少）`;

  return `# Twesta 发推+评论任务

## 角色信息
- 偶像: ${idolName} (${params.idolId})
- 当前时间: ${params.currentTime}
${params.specialEvent ? `- 特殊事件: ${params.specialEvent}` : ''}

${imagePrompt}## 任务
1. 生成一条偶像的营业模式推文
2. 生成${targetCommentCount}条评论

## 营业模式提醒
- 公开面向粉丝，不透露与P的私密关系
- 积极正能量、专业友好

${commentRules}

${params.recentPosts ? `## 最近推文记忆（避免重复话题）\n${params.recentPosts}\n` : ''}

## 输出格式（JSON）
\`\`\`json
{
  "tweet": {
    "textJP": "日语推文",
    "textCN": "中文翻译",
    "hashtags": ["标签1", "标签2"]
  },
  "comments": [
    {
      "authorType": "idol|fan|anti",
      "authorId": "偶像英文名(仅idol类型需要)",
      "authorName": "显示名称",
      "textJP": "日语评论",
      "textCN": "中文翻译"
    }
  ]${
    params.includeAntiFan
      ? `,
  "rhythmIncrease": 1-10  // 黑粉严重度导致的节奏值增加`
      : ''
  }
}
\`\`\``;
}

// ==================== 用户互动模式 ====================

/**
 * 用户互动思维链 (制作人评论/回复/转发后)
 */
export function getTwestaUserInteractionChain(): string {
  return `[Chain of thought]
<think>
## 1. 识别互动类型
- 制作人做了什么？(评论推文/回复评论/转发)
- 制作人说了什么内容？

## 2. 必定回复规则
- 制作人是偶像的制作人，偶像必定会回复
- 公开场合回复要得体，但可以表达开心

## 3. 回复设计
- 偶像本人: 感谢/开心/友好回应
- 其他粉丝: 可能羡慕/跟风互动（可选）

## 4. 营业模式
- 不能太亲密，保持专业但温暖的距离感
</think>
[/Chain of thought]
`;
}

/**
 * 用户互动提示词
 */
export function getTwestaUserInteractionPrompt(params: {
  interactionType: 'comment' | 'reply' | 'retweet';
  originalTweet: { author: string; text: string };
  userText: string;
  replyTarget?: { name: string; text: string };
  idolId: string;
}): string {
  const idolName = getCharacterName(params.idolId);

  const interactionDesc = {
    comment: '制作人直接评论了偶像的推文',
    reply: `制作人回复了「${params.replyTarget?.name}」的评论`,
    retweet: '制作人转发了推文并附上文字',
  };

  return `# 用户互动回复任务

## 互动信息
- 类型: ${interactionDesc[params.interactionType]}
- 偶像: ${idolName}

## 原推文
${params.originalTweet.author}: ${params.originalTweet.text}

${params.replyTarget ? `## 被回复的评论\n${params.replyTarget.name}: ${params.replyTarget.text}\n` : ''}

## 制作人的${params.interactionType === 'retweet' ? '转发文字' : '评论'}
${params.userText}

## 规则
1. **偶像必定回复制作人**（因为是她的制作人）
2. 公开场合要得体，但可以表达开心
3. 可选: 1-2条粉丝跟风互动

## 输出格式（JSON）
\`\`\`json
{
  "replies": [
    {
      "authorType": "idol|fan",
      "authorId": "偶像英文名(idol类型)",
      "authorName": "显示名称",
      "textJP": "日语回复",
      "textCN": "中文翻译",
      "replyTo": "producer|评论者名称"
    }
  ]
}
\`\`\``;
}

// ==================== 看图说话模式 ====================

/**
 * 看图说话思维链
 */
export function getTwestaImagePostChain(): string {
  return `[Chain of thought]
<think>
## 1. 观察图片
- 场景是什么？偶像在做什么？
- 氛围: 演出/日常/可爱/酷炫

## 2. 偶像视角
- 第一人称描述，结合性格
- 像真人发照片一样自然

## 3. 配文设计
- 分享心情/宣传工作/可爱自拍
- 添加相关#标签
</think>
[/Chain of thought]
`;
}

/**
 * 看图说话提示词
 */
export function getTwestaImagePostPrompt(params: { idolId: string; currentTime: string }): string {
  const idolName = getCharacterName(params.idolId);

  return `# 看图说话任务

偶像: ${idolName}
时间: ${params.currentTime}

请以${idolName}的身份，为这张图片写一条推文。
要求: 自然、营业模式、使用emoji和#标签

输出JSON:
\`\`\`json
{
  "textJP": "日语推文",
  "textCN": "中文翻译",
  "hashtags": ["标签"]
}
\`\`\``;
}

// ==================== 节奏事件模式 ====================

/**
 * 节奏事件思维链
 */
export function getTwestaDramaEventChain(): string {
  return `[Chain of thought]
<think>
## 1. 事件背景
- 当前事件是什么？进度多少？
- 用户采取了什么行动？

## 2. 剧情设计
- 接下来如何发展？
- 用户行动如何影响进度？

## 3. 平衡性
- 不过快结束，也不无限拖延
- 给用户选择空间
</think>
[/Chain of thought]
`;
}

/**
 * 节奏事件提示词
 */
export function getTwestaDramaEventPrompt(params: {
  idolId: string;
  eventTitle: string;
  currentProgress: number;
  userActions: string[];
  eventHistory?: string;
}): string {
  const idolName = getCharacterName(params.idolId);

  return `# 节奏事件剧情

偶像: ${idolName}
事件: ${params.eventTitle}
进度: ${params.currentProgress}% (0%=结束, 100%=最高潮)
用户行动: ${params.userActions.join(', ') || '无'}

${params.eventHistory ? `历史:\n${params.eventHistory}\n` : ''}

任务: 生成接下来的剧情发展

输出JSON:
\`\`\`json
{
  "storyUpdate": "剧情发展",
  "newTweets": [{ "authorType": "", "authorId": "", "textJP": "", "textCN": "" }],
  "progressChange": -10,
  "userOptions": ["选项1", "选项2"]
}
\`\`\``;
}

// ==================== 制作人发帖模式 ====================

/**
 * 制作人发帖思维链
 */
export function getTwestaProducerPostChain(): string {
  return `[Chain of thought]
<think>
## 1. 识别制作人的帖子
- 制作人发了什么内容？（日常/工作/偶像相关/个人感想）
- 帖子的语气和风格？

## 2. 谁会回复？
- **担当偶像**: 必定会回复制作人（公开场合但表达开心）
- **其他偶像**: 关系好的可能会评论
- **粉丝**: 制作人的粉丝、偶像的粉丝

## 3. 工作人员
- **七草叶月**: 如果是事务所相关话题，可能会评论
- **天井努社长**: 重要场合偶尔会评论

## 4. 回复风格
- 偶像: 公开场合得体但亲近
- 粉丝: 好奇、支持、羡慕
- 工作人员: 专业、友好
</think>
[/Chain of thought]
`;
}

/**
 * 制作人发帖提示词
 */
export function getTwestaProducerPostPrompt(params: {
  producerName: string;
  postText: string;
  担当Idol?: string;
  relatedIdols?: string[];
}): string {
  return `# 制作人发帖后的回复生成

## 帖子信息
- 制作人: ${params.producerName}
- 内容: ${params.postText}
${params.担当Idol ? `- 担当偶像: ${getCharacterName(params.担当Idol)}` : ''}

## 任务
生成3-6条回复，包括:
1. **担当偶像必定回复**（公开场合得体，但可以表达开心）
2. 可选: 其他偶像评论 (${params.relatedIdols?.map(id => getCharacterName(id)).join('、') || '选择关系近的偶像'})
3. 可选: 粉丝评论（好奇/支持/羡慕）
4. 可选: 工作人员评论（七草叶月、天井努社长）

## 可评论的角色类型
- idol: 偶像
- fan: 粉丝
- staff: 工作人员（Hazuki=七草叶月, Amai=天井努社长）

## 输出格式（JSON）
\`\`\`json
{
  "replies": [
    {
      "authorType": "idol|fan|staff",
      "authorId": "角色英文名",
      "authorName": "显示名称",
      "textJP": "日语评论",
      "textCN": "中文翻译"
    }
  ]
}
\`\`\``;
}

// ==================== 导出汇总 ====================

export const TwestaPrompts = {
  // 发推+评论
  getTwestaPostWithCommentsChain,
  getTwestaPostWithCommentsPrompt,
  // 用户互动
  getTwestaUserInteractionChain,
  getTwestaUserInteractionPrompt,
  // 看图说话
  getTwestaImagePostChain,
  getTwestaImagePostPrompt,
  // 节奏事件
  getTwestaDramaEventChain,
  getTwestaDramaEventPrompt,
  // 制作人发帖
  getTwestaProducerPostChain,
  getTwestaProducerPostPrompt,
};
