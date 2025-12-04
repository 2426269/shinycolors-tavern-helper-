/**
 * 情感检测模块
 * 根据AI消息内容自动检测情感并返回对应的Spine动画名称
 */

export interface EmotionMatch {
  emotion: string; // 情感名称
  animation: string; // Spine动画名称
  confidence: number; // 匹配置信度 (0-1)
}

/**
 * 情感关键词映射表
 */
const EMOTION_KEYWORDS_MAP: Record<string, { keywords: string[]; animation: string; weight: number }> = {
  happy: {
    keywords: [
      '高兴',
      '开心',
      '快乐',
      '笑',
      '哈哈',
      '嘻嘻',
      '欢喜',
      '愉快',
      '兴奋',
      '喜悦',
      '😊',
      '😄',
      '😁',
      '😆',
      '🤗',
    ],
    animation: 'Emotion_Happy',
    weight: 1.0,
  },
  sad: {
    keywords: ['难过', '伤心', '悲伤', '哭', '呜呜', '痛苦', '失落', '沮丧', '😢', '😭', '😔', '😞'],
    animation: 'Emotion_Sad',
    weight: 1.0,
  },
  angry: {
    keywords: ['生气', '愤怒', '火', '哼', '讨厌', '可恶', '混蛋', '烦', '😠', '😡', '🤬'],
    animation: 'Emotion_Angry',
    weight: 1.0,
  },
  surprise: {
    keywords: ['惊讶', '吓', '诶', '咦', '哇', '天啊', '不会吧', '真的吗', '😲', '😮', '😯', '🤯'],
    animation: 'Emotion_Surprise',
    weight: 1.0,
  },
  shy: {
    keywords: ['害羞', '脸红', '不好意思', '有点', '那个', '羞', '😳', '🙈'],
    animation: 'Emotion_Shy',
    weight: 1.0,
  },
  confusion: {
    keywords: ['疑惑', '困惑', '不懂', '什么', '为什么', '怎么', '？', '?', '🤔', '😕'],
    animation: 'Emotion_Confusion',
    weight: 0.5, // 疑问权重较低，避免误判
  },
  think: {
    keywords: ['想', '考虑', '思考', '让我想想', '嗯', '唔'],
    animation: 'Think',
    weight: 0.6,
  },
};

/**
 * 特殊场景检测（优先级更高）
 */
const SCENE_KEYWORDS_MAP: Record<string, { keywords: string[]; animation: string }> = {
  greeting: {
    keywords: ['早上好', '你好', '见到你', '初次见面', '你来了'],
    animation: 'Greeting',
  },
  victory: {
    keywords: ['成功', '胜利', '完美', 'Perfect', '太棒了', '做到了'],
    animation: 'Victory',
  },
  defeat: {
    keywords: ['失败', '不行', '完了', '糟糕', '输了'],
    animation: 'Defeat',
  },
};

/**
 * 检测文本中的情感
 */
export function detectEmotion(text: string): EmotionMatch | null {
  console.log('🔍 开始情感检测:', text);

  // 1. 优先检测特殊场景
  for (const [emotion, config] of Object.entries(SCENE_KEYWORDS_MAP)) {
    for (const keyword of config.keywords) {
      if (text.includes(keyword)) {
        console.log(`✅ 检测到场景: ${emotion} (关键词: ${keyword})`);
        return {
          emotion,
          animation: config.animation,
          confidence: 1.0,
        };
      }
    }
  }

  // 2. 检测普通情感
  const matches: EmotionMatch[] = [];

  for (const [emotion, config] of Object.entries(EMOTION_KEYWORDS_MAP)) {
    let matchCount = 0;
    let matchedKeywords: string[] = [];

    for (const keyword of config.keywords) {
      // 计算关键词出现次数
      const regex = new RegExp(keyword, 'g');
      const count = (text.match(regex) || []).length;
      if (count > 0) {
        matchCount += count;
        matchedKeywords.push(keyword);
      }
    }

    if (matchCount > 0) {
      // 计算置信度：匹配次数 * 权重 / 文本长度
      const confidence = Math.min((matchCount * config.weight * 10) / text.length, 1.0);
      matches.push({
        emotion,
        animation: config.animation,
        confidence,
      });

      console.log(
        `  - ${emotion}: 匹配${matchCount}次 (${matchedKeywords.join(', ')}), 置信度${confidence.toFixed(2)}`,
      );
    }
  }

  // 3. 返回置信度最高的情感
  if (matches.length > 0) {
    matches.sort((a, b) => b.confidence - a.confidence);
    const best = matches[0];

    // 只有置信度超过阈值才返回
    if (best.confidence >= 0.1) {
      console.log(`✅ 检测到情感: ${best.emotion} (置信度: ${best.confidence.toFixed(2)})`);
      return best;
    }
  }

  console.log('❌ 未检测到明显情感，使用默认说话动画');
  return null;
}

/**
 * 检测是否为疑问句
 */
export function isQuestion(text: string): boolean {
  return text.includes('？') || text.includes('?') || text.endsWith('吗') || text.endsWith('呢');
}

/**
 * 检测情感强度（用于调整动画速度或幅度）
 */
export function detectEmotionIntensity(text: string): number {
  // 根据感叹号、重复字符等判断情感强度
  const exclamationCount = (text.match(/[！!]/g) || []).length;
  const repeatedChars = (text.match(/(.)\1{2,}/g) || []).length; // 如 "哈哈哈"

  const intensity = Math.min(1.0 + exclamationCount * 0.2 + repeatedChars * 0.1, 2.0);

  if (intensity > 1.0) {
    console.log(`💪 检测到强烈情感, 强度: ${intensity.toFixed(2)}`);
  }

  return intensity;
}

/**
 * 根据文本长度估算说话时长（秒）
 */
export function estimateSpeakingDuration(text: string): number {
  // 平均每个字0.3秒
  const duration = text.length * 0.3;
  return Math.max(duration, 1.0); // 最少1秒
}

