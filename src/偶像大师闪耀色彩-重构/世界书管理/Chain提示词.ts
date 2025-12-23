/**
 * Chain 应用提示词
 * 负责生成 Chain 消息应用的 AI 提示词
 */

/**
 * Chain 消息模式枚举
 */
export enum ChainMessageMode {
  /** 回复模式：偶像回复玩家消息 */
  REPLY = 'reply',
  /** 主动模式：偶像主动发消息 */
  PROACTIVE = 'proactive',
  /** 群组回复模式：多偶像群聊回复玩家 */
  GROUP_REPLY = 'group_reply',
  /** 群组主动模式：群内偶像主动发起话题 */
  GROUP_INITIATIVE = 'group_initiative',
}

/**
 * Chain 消息变量接口（单独聊天）
 */
export interface ChainPromptVariables {
  /** 偶像中文名 */
  idolName: string;
  /** 当前时间（格式：HH:MM） */
  currentTime: string;
  /** 完整对话记录（包含时间戳） */
  chatHistory: string;
}

/**
 * Chain 群组消息变量接口
 */
export interface ChainGroupPromptVariables {
  /** 群组名称 */
  groupName: string;
  /** 群组成员名称列表 */
  memberNames: string[];
  /** 当前时间（格式：HH:MM） */
  currentTime: string;
  /** 群组对话记录 */
  chatHistory: string;
  /** 各成员的历史记录摘要（可选） */
  memberHistories?: Record<string, string>;
}

/**
 * Chain 消息输出接口（双语模式）
 */
export interface ChainMessageOutput {
  messages: Array<{
    /** 日语原文（保留口癖、称呼等特色） */
    contentJP: string;
    /** 中文翻译 */
    contentCN: string;
    /** 贴纸名称 */
    sticker: string | null;
  }>;
}

/**
 * 贴纸列表
 */
export const CHAIN_STICKERS = [
  'OK',
  '且慢',
  '去锻炼',
  '发呆',
  '可以',
  '可以吗',
  '呀哈',
  '哎呀',
  '哼',
  '哼哼',
  '嘚瑟',
  '嘿嘿',
  '大哭道歉',
  '天才',
  '天真',
  '好厉害',
  '好耶',
  '好麻烦',
  '审视',
  '害羞',
  '对不起',
  '当然',
  '得意',
  '怎么了',
  '我在',
  '我就说嘛',
  '我能行',
  '才没有',
  '打Call',
  '拍照',
  '拜托了',
  '拿捏',
  '擦汗',
  '无语',
  '早安',
  '晚安',
  '爆笑',
  '爱你',
  '疑惑',
  '盯',
  '真可爱',
  '真好啊',
  '真的吗',
  '睡觉',
  '稍等',
  '第一',
  '自闭',
  '观察',
  '警觉',
  '请听',
  '谢谢',
  '趴',
  '辛苦了',
  '达咩',
  '闪亮登场',
  '震惊',
] as const;

/**
 * 贴纸服务器地址
 */
export const STICKER_BASE_URL = 'http://124.221.50.133/shinycolors/sticker/';

/**
 * 获取贴纸完整 URL（正确编码方括号和中文）
 */
export function getStickerUrl(stickerName: string): string {
  // 完整编码文件名：[贴纸名].webp → %5B贴纸名%5D.webp
  const encodedFilename = encodeURIComponent(`[${stickerName}].webp`);
  return `${STICKER_BASE_URL}${encodedFilename}`;
}

/**
 * Chain 提示词管理器
 */
export class ChainPromptManager {
  /**
   * 获取回复模式提示词
   */
  static getReplyPrompt(variables: ChainPromptVariables): string {
    const stickerList = CHAIN_STICKERS.join('、');

    return `# Chain 消息生成（回复模式）

你是283プロダクション的偶像「${variables.idolName}」，正在通过Chain应用与制作人聊天。

## 当前信息
- **偶像**: ${variables.idolName}
- **当前时间**: ${variables.currentTime}

## 对话记录
${variables.chatHistory}

---

## ⚠️ 关键要求

### 1. 双语模式（重要！）
- 先用**日语**写消息（保留口癖、称呼等特色）
- 再翻译为**中文**
- 例如 mana 的「ほわっ」、对制作人的称呼等要保留在日语中

### 2. 消息风格
- 每条消息**1-2句话**，像真实短信
- 可以分1-3条消息发送
- 语气符合该偶像的性格特点

### 3. 贴纸使用
可选择使用以下贴纸（填写名称即可）：
${stickerList}

---

## 📤 输出JSON格式

直接输出以下JSON，**不要任何解释文字**：

\`\`\`json
{
  "messages": [
    {
      "contentJP": "日语原文",
      "contentCN": "中文翻译",
      "sticker": null
    }
  ]
}
\`\`\`

### 字段说明
- contentJP: 日语原文（保留口癖、称呼等特色）
- contentCN: 中文翻译
- sticker: 贴纸名称或null
`;
  }

  /**
   * 获取主动模式提示词
   */
  static getProactivePrompt(variables: ChainPromptVariables): string {
    const stickerList = CHAIN_STICKERS.join('、');

    return `# Chain 消息生成（主动模式）

你是283プロダクション的偶像「${variables.idolName}」，正在主动通过Chain应用联系制作人。

## 当前信息
- **偶像**: ${variables.idolName}
- **当前时间**: ${variables.currentTime}

## 最近对话记录（仅供参考）
${variables.chatHistory || '（暂无历史记录）'}

---

## ⚠️ 关键要求

### 1. 双语模式（重要！）
- 先用**日语**写消息（保留口癖、称呼等特色）
- 再翻译为**中文**

### 2. 主动发消息场景
思考偶像为什么要主动联系：
- 分享今天发生的事情
- 询问玩家的近况
- 表达想念或关心
- 工作/练习的汇报
- 随意的日常闲聊

### 3. 贴纸使用
${stickerList}

---

## 📤 输出JSON格式

直接输出以下JSON，**不要任何解释文字**：

\`\`\`json
{
  "messages": [
    {
      "contentJP": "日语原文",
      "contentCN": "中文翻译",
      "sticker": null
    }
  ]
}
\`\`\`
`;
  }

  /**
   * 获取群组主动模式提示词（群内偶像主动发起话题）
   */
  static getGroupInitiativePrompt(variables: ChainGroupPromptVariables): string {
    const stickerList = CHAIN_STICKERS.join('、');
    const memberList = variables.memberNames.join('、');

    return `# Chain 群组消息生成（主动模式）

群组「${variables.groupName}」中的一位偶像要**主动发起话题**，其他成员可能跟帖回复或潜水。

## 当前信息
- **群组名称**: ${variables.groupName}
- **群组成员**: ${memberList}
- **当前时间**: ${variables.currentTime}

## 最近群组对话记录
${variables.chatHistory || '（暂无历史记录）'}

---

## ⚠️ 关键要求

### 1. 随机选择发起者
从群组成员中选择一位偶像发起话题，考虑：
- 谁的性格更可能主动发言
- 发起什么样的话题（日常分享、询问大家、闲聊等）

### 2. 其他成员反应
- 其他成员可能**回复**或**潜水**
- 不是每个人都要回复，0-3人跟帖是正常的
- 模拟真实群聊的节奏

### 3. 双语模式
- 每条消息先写**日语**（保留口癖）
- 再翻译为**中文**

### 4. 贴纸使用
${stickerList}

---

## 📤 输出JSON格式

直接输出以下JSON，**不要任何解释文字**：

\`\`\`json
{
  "messages": [
    {
      "sender": "发起者名字",
      "contentJP": "日语原文",
      "contentCN": "中文翻译",
      "sticker": null
    },
    {
      "sender": "回复者名字",
      "contentJP": "日语原文",
      "contentCN": "中文翻译",
      "sticker": null
    }
  ]
}
\`\`\`

### 字段说明
- sender: 发言者名字（必须是群组成员之一）
- contentJP: 日语原文
- contentCN: 中文翻译
- sticker: 贴纸名称或null
`;
  }

  /**
   * 获取指定模式的提示词
   */
  static getPrompt(mode: ChainMessageMode, variables: ChainPromptVariables): string {
    switch (mode) {
      case ChainMessageMode.REPLY:
        return this.getReplyPrompt(variables);
      case ChainMessageMode.PROACTIVE:
        return this.getProactivePrompt(variables);
      default:
        console.error(`❌ 未知的Chain消息模式: ${mode}`);
        return '';
    }
  }

  /**
   * 解析 AI 返回的 JSON 消息
   * 增强版：能处理 AI 在 JSON 后添加额外内容的情况
   */
  static parseResponse(responseText: string): ChainMessageOutput | null {
    try {
      // 尝试提取 JSON 块（优先 markdown 代码块）
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonStr = jsonMatch ? jsonMatch[1] : responseText;

      // 如果没有代码块，尝试提取 JSON 对象
      if (!jsonMatch) {
        // 找到第一个 { 和对应的 }
        const firstBrace = jsonStr.indexOf('{');
        if (firstBrace !== -1) {
          let braceCount = 0;
          let endIndex = -1;

          for (let i = firstBrace; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') braceCount++;
            else if (jsonStr[i] === '}') braceCount--;

            if (braceCount === 0) {
              endIndex = i;
              break;
            }
          }

          if (endIndex !== -1) {
            jsonStr = jsonStr.substring(firstBrace, endIndex + 1);
          }
        }
      }

      const parsed = JSON.parse(jsonStr.trim());

      // 验证结构
      if (!parsed.messages || !Array.isArray(parsed.messages)) {
        console.error('❌ Chain消息格式错误: messages 不是数组');
        return null;
      }

      return parsed as ChainMessageOutput;
    } catch (error) {
      console.error('❌ 解析Chain消息失败:', error);
      console.error('❌ 原始响应:', responseText.substring(0, 500));
      return null;
    }
  }

  /**
   * 格式化对话记录
   * @param messages 消息列表
   * @param idolName 偶像名称
   * @returns 格式化的对话记录字符串
   */
  static formatChatHistory(
    messages: Array<{ time: string; sender: 'user' | 'idol'; content: string }>,
    idolName: string,
  ): string {
    if (messages.length === 0) {
      return '（暂无对话记录）';
    }

    return messages
      .map(msg => {
        const senderName = msg.sender === 'user' ? '制作人' : idolName;
        return `[${msg.time}] ${senderName}: ${msg.content}`;
      })
      .join('\n');
  }

  /**
   * 获取当前时间字符串（HH:MM格式）
   */
  static getCurrentTimeString(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}
