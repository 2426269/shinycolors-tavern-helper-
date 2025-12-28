/**
 * BackgroundService - 背景图管理服务
 *
 * 采用混合架构：
 * 1. 固定锚点（Hard Anchors）：核心场景直接映射
 * 2. 语义检索（Semantic Search）：其他场景使用向量匹配
 */

import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';

// ============ 类型定义 ============

export interface BackgroundMeta {
  id: string;
  filename: string;
  location: string;
  time: 'DAY' | 'EVENING' | 'NIGHT' | 'INDOOR_NO_TIME';
  tags: string[];
  mood: string;
  is_vertical: boolean;
  embedding?: number[]; // 预计算的向量（可选）
}

export interface BackgroundSearchResult {
  background: BackgroundMeta;
  score: number;
}

// ============ 固定锚点 ============

const ANCHORS: Record<string, string> = {
  // 事务所系列
  OFFICE_DAY: '00001.jpg',
  OFFICE_NIGHT: '00002.jpg',
  OFFICE: '00001.jpg', // 默认白天

  // 练习室
  LESSON_ROOM: '00014.jpg',
  LESSON_ROOM_NIGHT: '00021.jpg',
  DANCE_STUDIO: '00014.jpg',

  // 街道
  STREET_DAY: '00003.jpg',
  STREET_NIGHT: '00004.jpg',
  STREET_RAIN: '00024.jpg',

  // 公园
  PARK_DAY: '00013.jpg',
  PARK_NIGHT: '00016.jpg',
  PARK_EVENING: '00017.jpg',
  PARK: '00013.jpg',

  // 舞台
  STAGE: '00015.jpg',
  BACKSTAGE: '00007.jpg',

  // 海滩
  BEACH: '00053.jpg',

  // 学校
  CLASSROOM: '00039.jpg',
  SCHOOL_CORRIDOR: '00042.jpg',

  // 咖啡馆/餐厅
  CAFE: '00011.jpg',
  RESTAURANT: '00022.jpg',

  // 其他
  BLACK: '00000.jpg',
  TRANSITION: '00000.jpg',
};

// ============ 背景图 URL 配置 ============

const BACKGROUND_BASE_URL = 'https://283pro.site/shinycolors/background/';

// ============ BackgroundService 类 ============

class BackgroundService {
  private embedder: FeatureExtractionPipeline | null = null;
  private backgrounds: BackgroundMeta[] = [];
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * 初始化服务（加载模型和数据）
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<void> {
    console.log('[BackgroundService] 初始化中...');

    try {
      // 加载嵌入模型（轻量级，适合浏览器）
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('[BackgroundService] 嵌入模型加载完成');

      // 加载背景数据
      // 注意：实际部署时，这里应该从服务器或本地文件加载
      // 这里假设 backgrounds.json 已被打包或通过 fetch 获取
      await this.loadBackgrounds();

      this.isInitialized = true;
      console.log('[BackgroundService] 初始化完成');
    } catch (error) {
      console.error('[BackgroundService] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载背景数据
   */
  private async loadBackgrounds(): Promise<void> {
    try {
      // 方式 1：从服务器加载
      // const response = await fetch('/data/backgrounds.json');
      // this.backgrounds = await response.json();

      // 方式 2：导入静态数据（需要在构建时处理）
      // import backgroundsData from './backgrounds.json';
      // this.backgrounds = backgroundsData;

      // 临时占位：假设数据已加载
      console.log('[BackgroundService] 背景数据加载完成');
    } catch (error) {
      console.error('[BackgroundService] 加载背景数据失败:', error);
    }
  }

  /**
   * 设置背景数据（供外部注入）
   */
  setBackgrounds(data: BackgroundMeta[]): void {
    this.backgrounds = data;
    console.log(`[BackgroundService] 已加载 ${data.length} 个背景`);
  }

  /**
   * 选择背景图
   * @param aiOutput LLM 输出的背景描述（可以是锚点代码或自然语言）
   * @returns 背景图 URL
   */
  async selectBackground(aiOutput: string): Promise<string> {
    await this.init();

    // 1. 优先匹配硬编码锚点
    const upperOutput = aiOutput.toUpperCase().replace(/\s+/g, '_');
    if (ANCHORS[upperOutput]) {
      return this.getBackgroundUrl(ANCHORS[upperOutput]);
    }

    // 2. 尝试精确匹配 location
    const exactMatch = this.backgrounds.find(bg => bg.location === aiOutput || bg.filename === aiOutput);
    if (exactMatch) {
      return this.getBackgroundUrl(exactMatch.filename);
    }

    // 3. 语义搜索
    const results = await this.semanticSearch(aiOutput, 1);
    if (results.length > 0) {
      return this.getBackgroundUrl(results[0].background.filename);
    }

    // 4. 降级：返回默认背景
    return this.getBackgroundUrl('00001.jpg');
  }

  /**
   * 语义搜索
   * @param query 查询文本
   * @param topK 返回前 K 个结果
   */
  async semanticSearch(query: string, topK: number = 5): Promise<BackgroundSearchResult[]> {
    await this.init();

    if (!this.embedder || this.backgrounds.length === 0) {
      console.warn('[BackgroundService] 未初始化或无背景数据');
      return [];
    }

    // 生成查询向量
    const queryVector = await this.getEmbedding(query);

    // 计算所有背景的相似度
    const scored = this.backgrounds.map(bg => {
      // 构建背景的文本描述
      const bgText = `${bg.location} ${bg.mood} ${bg.tags.join(' ')}`;
      // 如果有预计算的 embedding，直接使用
      const bgVector = bg.embedding || this.getEmbeddingSync(bgText);
      if (!bgVector) return { background: bg, score: 0 };

      const score = this.cosineSimilarity(queryVector, bgVector);
      return { background: bg, score };
    });

    // 按相似度排序
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }

  /**
   * 按条件筛选背景
   */
  filterBackgrounds(options: { location?: string; time?: BackgroundMeta['time']; tags?: string[] }): BackgroundMeta[] {
    return this.backgrounds.filter(bg => {
      if (options.location && !bg.location.includes(options.location)) {
        return false;
      }
      if (options.time && bg.time !== options.time) {
        return false;
      }
      if (options.tags && !options.tags.some(tag => bg.tags.includes(tag))) {
        return false;
      }
      return true;
    });
  }

  /**
   * 获取随机背景
   */
  getRandomBackground(options?: { location?: string; time?: BackgroundMeta['time'] }): BackgroundMeta | null {
    const filtered = options ? this.filterBackgrounds(options) : this.backgrounds;
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  /**
   * 获取背景图完整 URL
   */
  getBackgroundUrl(filename: string): string {
    return `${BACKGROUND_BASE_URL}${encodeURIComponent(filename)}`;
  }

  // ============ 向量计算 ============

  private async getEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) throw new Error('Embedder not initialized');
    const result = await this.embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data as Float32Array);
  }

  private getEmbeddingSync(text: string): number[] | null {
    // 同步版本（需要预计算）
    // 这里返回 null，实际使用时应该用预计算的 embedding
    return null;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0,
      magA = 0,
      magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
    return magnitude === 0 ? 0 : dot / magnitude;
  }
}

// ============ 导出单例 ============

export const backgroundService = new BackgroundService();
export default backgroundService;

// ============ LLM Prompt 辅助 ============

/**
 * 生成用于 LLM 的背景图指令
 */
export const BACKGROUND_PROMPT_INSTRUCTION = `
## 背景图指令
生成剧情时必须指定背景，使用 <background> 标签：

1. 常用场景使用标准代码（推荐，更精确）：
   OFFICE_DAY, OFFICE_NIGHT, LESSON_ROOM, STREET_DAY, STREET_NIGHT,
   PARK_DAY, PARK_NIGHT, BEACH, STAGE, BACKSTAGE, CAFE, CLASSROOM

2. 其他场景用自然语言描述氛围和地点：
   <background>夕阳下的河边，有点悲伤的氛围</background>
   <background>热闘的商业街，夜晚，霓虹灯</background>
   <background>安静的神社，秋天，落叶</background>
`;

/**
 * 从 LLM 输出中提取背景描述
 */
export function extractBackgroundFromLLMOutput(text: string): string | null {
  const match = text.match(/<background>(.*?)<\/background>/);
  return match ? match[1].trim() : null;
}
