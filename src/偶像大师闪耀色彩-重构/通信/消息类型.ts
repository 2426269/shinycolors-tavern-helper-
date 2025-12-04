/**
 * 偶像大师闪耀色彩 - 消息类型定义
 */

/**
 * 消息角色
 */
export type MessageRole = 'system' | 'assistant' | 'user';

/**
 * 消息对象
 */
export interface Message {
  message_id?: number; // 消息ID（酒馆消息ID）
  role: MessageRole; // 消息角色
  sender: string; // 发送者名称
  time: string; // 发送时间
  content: string; // 消息内容
  metadata?: MessageMetadata; // 扩展元数据
}

/**
 * 消息元数据（偶像大师特有）
 */
export interface MessageMetadata {
  // 奖励信息
  rewards?: {
    stamina?: number; // 体力变化
    love?: number; // 好感度变化
    vo?: number; // Vocal属性变化
    da?: number; // Dance属性变化
    vi?: number; // Visual属性变化
    gems?: number; // 羽石变化
    fans?: number; // 粉丝变化
  };

  // 表情/动画信息
  emotion?: string; // 表情动画（如 'happy', 'sad'等）
  spineAnimation?: string; // Spine动画名称

  // 背景信息
  background?: string; // 背景图片
  location?: string; // 地点名称

  // 培育相关
  trainingType?: 'Vocal' | 'Dance' | 'Visual'; // 训练类型
  trainingResult?: 'Perfect' | 'Clear' | 'Fail'; // 训练结果

  // 其他
  isSystemMessage?: boolean; // 是否为系统消息
  timestamp?: number; // Unix时间戳
}

/**
 * 消息发送选项
 */
export interface MessageSendOptions {
  userInput: string; // 用户输入
  onSuccess?: (response: string) => void; // 成功回调
  onError?: (error: Error) => void; // 错误回调
  enableStream?: boolean; // 是否启用流式传输
  onStreamUpdate?: (text: string) => void; // 流式传输更新回调
  scene?: SceneType; // 场景类型（用于配置世界书）
  customPrompt?: string; // 自定义提示词
}

/**
 * 场景类型（对应世界书配置）
 */
export type SceneType =
  | 'training' // 训练场景
  | 'activity' // 自由活动场景
  | 'ending' // 结局场景
  | 'skill_generation' // 技能卡生成场景
  | 'normal' // 普通对话场景
  | 'battle'; // 战斗场景

/**
 * 消息格式化选项
 */
export interface MessageFormatOptions {
  enableMarkdown?: boolean; // 启用Markdown格式
  enableCodeHighlight?: boolean; // 启用代码高亮
  enableQuote?: boolean; // 启用引用格式
  enableRewardParsing?: boolean; // 启用奖励标签解析
  enableEmotionParsing?: boolean; // 启用表情标签解析
}

/**
 * 消息导出选项
 */
export interface MessageExportOptions {
  format: 'txt' | 'json'; // 导出格式
  filename?: string; // 文件名
  includeMetadata?: boolean; // 是否包含元数据
}

/**
 * 历史消息加载选项
 */
export interface HistoryLoadOptions {
  messageRange?: string; // 消息范围（如 '0-10' 或 '0-{{lastMessageId}}'）
  filterRole?: MessageRole; // 按角色过滤
  limit?: number; // 限制数量
}




