/**
 * MechanicRegistry - 机制注册表服务
 * 管理 AI 发明的自定义机制（Tag/Buff）
 */

import type { MechanicDef } from './types';
import { visualRegistry } from './VisualRegistry';

/** 存储键名 */
const STORAGE_KEY = 'plab_mechanic_registry';

/**
 * 机制注册表类
 */
class MechanicRegistryService {
  private mechanics: Map<string, MechanicDef> = new Map();
  private initialized = false;

  /**
   * 初始化注册表（从 localStorage 加载）
   */
  init(): void {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: MechanicDef[] = JSON.parse(stored);
        data.forEach(mech => {
          this.mechanics.set(mech.id, mech);
          // 同步到 VisualRegistry
          this.syncToVisualRegistry(mech);
        });
        console.log(`[MechanicRegistry] 已加载 ${this.mechanics.size} 个机制`);
      }
    } catch (e) {
      console.warn('[MechanicRegistry] 加载失败:', e);
    }

    this.initialized = true;
  }

  /**
   * 同步机制的视觉信息到 VisualRegistry
   */
  private syncToVisualRegistry(mech: MechanicDef): void {
    visualRegistry.register({
      key: mech.id,
      kind: 'tag',
      symbol: mech.visual.symbol,
      color: mech.visual.color,
      isDebuff: mech.visual.isDebuff,
      shortName: mech.name,
      description: mech.description,
    });
  }

  /**
   * 保存到 localStorage
   */
  private persist(): void {
    try {
      const data = Array.from(this.mechanics.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[MechanicRegistry] 保存失败:', e);
    }
  }

  /**
   * 注册新机制
   */
  register(mech: MechanicDef): void {
    mech.createdAt = mech.createdAt || new Date().toISOString();
    this.mechanics.set(mech.id, mech);
    this.syncToVisualRegistry(mech);
    this.persist();
    console.log(`[MechanicRegistry] 注册机制: ${mech.name} (${mech.id})`);
  }

  /**
   * 获取机制
   */
  get(id: string): MechanicDef | undefined {
    this.init();
    return this.mechanics.get(id);
  }

  /**
   * 获取所有机制
   */
  getAll(): MechanicDef[] {
    this.init();
    return Array.from(this.mechanics.values());
  }

  /**
   * 按流派筛选机制
   */
  getByFlow(flowId: string): MechanicDef[] {
    this.init();
    return this.getAll().filter(m => m.flowId === flowId);
  }

  /**
   * 检查机制是否存在
   */
  has(id: string): boolean {
    this.init();
    return this.mechanics.has(id);
  }

  /**
   * 删除机制
   */
  remove(id: string): boolean {
    const result = this.mechanics.delete(id);
    if (result) this.persist();
    return result;
  }

  /**
   * 生成机制列表的 Markdown（用于 Prompt 注入）
   */
  toPromptMarkdown(flowId?: string): string {
    this.init();
    const mechs = flowId ? this.getByFlow(flowId) : this.getAll();
    if (mechs.length === 0) return '';

    let md = '## 已有可复用机制\n\n';
    mechs.forEach((m, idx) => {
      md += `${idx + 1}. **${m.name}** (id: \`${m.id}\`)\n`;
      md += `   - 说明: ${m.description}\n`;
      md += `   - 图标: ${m.visual.symbol} (${m.visual.isDebuff ? '负面' : '正面'})\n\n`;
    });
    return md;
  }
}

/** 单例导出 */
export const mechanicRegistry = new MechanicRegistryService();
