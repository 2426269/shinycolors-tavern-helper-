/**
 * FlowRegistry - 流派注册表服务
 * 管理 P-Lab 中创建的流派定义
 */

import type { FlowDef } from './types';

/** 存储键名 */
const STORAGE_KEY = 'plab_flow_registry';

/**
 * 流派注册表类
 */
class FlowRegistryService {
  private flows: Map<string, FlowDef> = new Map();
  private initialized = false;

  /**
   * 初始化注册表（从 localStorage 加载）
   */
  init(): void {
    if (this.initialized) return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: FlowDef[] = JSON.parse(stored);
        data.forEach(flow => this.flows.set(flow.id, flow));
        console.log(`[FlowRegistry] 已加载 ${this.flows.size} 个流派`);
      }
    } catch (e) {
      console.warn('[FlowRegistry] 加载失败:', e);
    }

    this.initialized = true;
  }

  /**
   * 保存到 localStorage
   */
  private persist(): void {
    try {
      const data = Array.from(this.flows.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('[FlowRegistry] 保存失败:', e);
    }
  }

  /**
   * 注册新流派
   */
  register(flow: FlowDef): void {
    flow.createdAt = flow.createdAt || new Date().toISOString();
    this.flows.set(flow.id, flow);
    this.persist();
    console.log(`[FlowRegistry] 注册流派: ${flow.nameCN} (${flow.id})`);
  }

  /**
   * 获取流派
   */
  get(id: string): FlowDef | undefined {
    this.init();
    return this.flows.get(id);
  }

  /**
   * 获取所有流派
   */
  getAll(): FlowDef[] {
    this.init();
    return Array.from(this.flows.values());
  }

  /**
   * 按培育计划筛选
   */
  getByPlan(plan: string): FlowDef[] {
    this.init();
    return this.getAll().filter(f => f.plan === plan || f.plan === 'mixed');
  }

  /**
   * 更新流派
   */
  update(id: string, updates: Partial<FlowDef>): void {
    const flow = this.flows.get(id);
    if (flow) {
      Object.assign(flow, updates);
      this.persist();
    }
  }

  /**
   * 删除流派
   */
  remove(id: string): boolean {
    const result = this.flows.delete(id);
    if (result) this.persist();
    return result;
  }

  /**
   * 将技能卡添加到流派的收集列表
   */
  addCardToFlow(flowId: string, cardId: string): void {
    const flow = this.flows.get(flowId);
    if (flow) {
      if (!flow.collectedCards) flow.collectedCards = [];
      if (!flow.collectedCards.includes(cardId)) {
        flow.collectedCards.push(cardId);
        this.persist();
      }
    }
  }

  /**
   * 获取流派的收集进度
   */
  getCollectionProgress(flowId: string): { collected: number; total: number } {
    const flow = this.flows.get(flowId);
    if (!flow) return { collected: 0, total: 0 };

    const collected = flow.collectedCards?.length || 0;
    // 默认目标：15 张卡为一个完整体系
    const total = 15;
    return { collected, total };
  }
}

/** 单例导出 */
export const flowRegistry = new FlowRegistryService();
