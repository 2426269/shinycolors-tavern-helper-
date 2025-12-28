/**
 * 游戏机制数据库
 * 提供培育计划、Buff、技能卡效果等游戏机制的详细说明
 * 用于AI生成技能卡时的参考
 */

import type { ProducePlan } from '../战斗/类型/技能卡类型';

/**
 * 培育计划机制说明
 */
export interface ProducePlanMechanic {
  /** 计划名称 */
  name: ProducePlan;
  /** 日文名 */
  nameJP: string;
  /** 英文名 */
  nameEN: string;
  /** 核心机制描述 */
  coreMechanic: string;
  /** 关键效果列表 */
  keyEffects: {
    name: string;
    nameJP: string;
    description: string;
  }[];
  /** 玩法特点 */
  playstyle: string;
  /** 典型词汇（用于命名） */
  vocabulary: string[];
}

/**
 * 培育计划机制数据
 */
export const PRODUCE_PLAN_MECHANICS: Record<ProducePlan, ProducePlanMechanic> = {
  感性: {
    name: '感性',
    nameJP: 'センス',
    nameEN: 'Sense',
    coreMechanic: '通过堆叠"好调"和"集中"层数，爆发式地提高得分',
    keyEffects: [
      {
        name: '好调',
        nameJP: '好調',
        description: '技能卡的得分量增加50%，层数在每回合开始时-1',
      },
      {
        name: '集中',
        nameJP: '集中',
        description: '每层集中增加N点技能卡得分',
      },
      {
        name: '绝好调',
        nameJP: '絶好調',
        description: '使"好调"的得分增加倍率额外提升（N×10）%',
      },
    ],
    playstyle: '爆发型得分流，通过堆叠Buff在关键回合打出高分',
    vocabulary: ['好調', '集中', '絶好調', '輝き', '情熱', '感動', '心', '笑顔', '幸せ', '光', '夢', '希望'],
  },

  理性: {
    name: '理性',
    nameJP: 'ロジック',
    nameEN: 'Logic',
    coreMechanic: '通过稳定积累"好印象"和"有干劲"，持续获得分数和元气资源',
    keyEffects: [
      {
        name: '好印象',
        nameJP: '好印象',
        description: '每层好印象在回合结束时直接获得N点得分，层数在每回合开始时-1',
      },
      {
        name: '有干劲',
        nameJP: 'やる気',
        description: '每层有干劲在打出提供元气的技能卡时，额外获得N点元气',
      },
    ],
    playstyle: '稳定型持续流，通过被动效果持续积累分数和资源',
    vocabulary: ['好印象', 'やる気', '論理', '計算', '努力', '成長', '積み重ね', '戦略', '冷静', '分析'],
  },

  非凡: {
    name: '非凡',
    nameJP: 'アノマリー',
    nameEN: 'Anomaly',
    coreMechanic: '通过灵活切换三种指针状态（全力、强气、温存），适应不同的战术需求',
    keyEffects: [
      {
        name: '全力',
        nameJP: '全力',
        description:
          '积累全力值（最大10点），全力值满后可转化为全力状态。全力状态下：分数提升量增加200%，技能卡使用次数+1',
      },
      {
        name: '强气',
        nameJP: '強気',
        description:
          '第一阶段：分数提升量和体力消耗均增加100%；第二阶段：分数提升量增加150%，体力消耗增加100%，且每使用一张技能卡额外消耗1点体力',
      },
      {
        name: '温存',
        nameJP: '温存',
        description:
          '第一阶段：分数提升量和体力消耗均减少50%，解除时热情+5，技能卡使用次数+1；第二阶段：分数提升量和体力消耗均减少75%，解除时热情+8，元气+5',
      },
      {
        name: '热意',
        nameJP: '熱意',
        description: '每点热意在回合结束时分数+1（仅当前回合有效）',
      },
    ],
    playstyle: '灵活型策略流，根据局势切换状态，兼具爆发、稳健、蓄力',
    vocabulary: [
      '全力',
      '強気',
      '温存',
      '熱意',
      '爆発',
      '覚醒',
      '限界',
      '突破',
      '奇跡',
      '異常',
      '特異',
      '超越',
      '悠闲',
    ],
  },

  自由: {
    name: '自由',
    nameJP: '自由',
    nameEN: 'Free',
    coreMechanic: '通用型卡牌，不绑定特定培育计划，可在任何计划中使用',
    keyEffects: [],
    playstyle: '通用型，提供基础效果，不依赖特定计划的机制',
    vocabulary: ['基本', '基礎', '万能', '汎用', '自由', 'フリー', '共通'],
  },
};

/**
 * Buff/Debuff效果数据
 */
export interface EffectData {
  /** 效果名（中文） */
  name: string;
  /** 效果名（日文） */
  nameJP: string;
  /** 效果说明 */
  description: string;
  /** 所属计划 */
  belongTo: ProducePlan | '通用';
  /** 效果类型 */
  type: '正面' | '负面' | '中立';
}

/**
 * 所有Buff/Debuff效果
 */
export const ALL_EFFECTS: EffectData[] = [
  // === 正面效果 ===
  {
    name: '好调',
    nameJP: '好調',
    description: '技能卡得分量增加50%，每回合-1层',
    belongTo: '感性',
    type: '正面',
  },
  {
    name: '集中',
    nameJP: '集中',
    description: 'N层时，技能卡得分量增加N点',
    belongTo: '感性',
    type: '正面',
  },
  {
    name: '绝好调',
    nameJP: '絶好調',
    description: '使"好调"的倍率额外增加（N×10）%，每回合-1层',
    belongTo: '感性',
    type: '正面',
  },
  {
    name: '好印象',
    nameJP: '好印象',
    description: 'N层时，回合结束直接获得N点得分，每回合-1层',
    belongTo: '理性',
    type: '正面',
  },
  {
    name: '好印象增加量增加',
    nameJP: '好印象増加量アップ',
    description: 'N回合内，获得好印象时，好印象获得量增加N%',
    belongTo: '理性',
    type: '正面',
  },
  {
    name: '好印象强化',
    nameJP: '好印象効果アップ',
    description: 'N回合内，好印象提供的得分增加N%',
    belongTo: '理性',
    type: '正面',
  },
  {
    name: '有干劲',
    nameJP: 'やる気',
    description: 'N层时，打出提供元气的技能卡时，额外获得N点元气',
    belongTo: '理性',
    type: '正面',
  },
  {
    name: '消费体力减少',
    nameJP: '消費体力減少',
    description: '技能卡所需体力减为原来的50%（向上取整），每回合-1层',
    belongTo: '通用',
    type: '正面',
  },
  {
    name: '消费体力削减',
    nameJP: '消費体力削減',
    description: 'N层时，技能卡所需体力减少N点（最低为0）',
    belongTo: '通用',
    type: '正面',
  },
  {
    name: '低下状态无效',
    nameJP: '低下状態無効',
    description: '打出带有负面效果的技能卡时，不会获得此负面效果，随后该状态层数-1',
    belongTo: '通用',
    type: '正面',
  },
  {
    name: '技能卡使用数追加',
    nameJP: 'スキルカード使用数追加',
    description: 'N层时，此出牌回合可追加打出N张技能卡，打出后-1层',
    belongTo: '通用',
    type: '正面',
  },
  {
    name: '回合数追加',
    nameJP: 'ターン追加',
    description: '直接增加剩余的出牌回合数',
    belongTo: '通用',
    type: '正面',
  },
  {
    name: '训练中强化',
    nameJP: 'レッスン中強化',
    description: '使未被强化的技能卡在训练过程中获得强化（训练结束后移除）',
    belongTo: '通用',
    type: '正面',
  },
  {
    name: '热意',
    nameJP: '熱意',
    description: '每点热意在回合结束时分数+1（仅当前回合有效）',
    belongTo: '非凡',
    type: '正面',
  },
  {
    name: '温存状态',
    nameJP: '温存',
    description:
      '降低分数上升量和体力消耗。如果当前「指针」已为「温存」，可最多叠加至二阶段。▼一阶段：分数上升量和体力消耗降低50%，解除时热忱+5、技能卡使用次数+1。▼二阶段：分数上升量和体力消耗降低75%，解除时热忱+8、元气+5、技能卡使用次数+1。温存不会与「强气」「全力」同时存在。',
    belongTo: '非凡',
    type: '正面',
  },
  {
    name: '悠闲状态',
    nameJP: 'のんびり',
    description:
      '分数上升量和消费体力减少100%。当该状态被解除时，元气+5，技能卡使用次数+1。变更为「强气」或被解除时，热意+10。变更为「全力」时，所有技能卡数值+10。悠闲无法切换为「温存」，温存切换为悠闲时不会触发温存切换效果。',
    belongTo: '非凡',
    type: '正面',
  },
  {
    name: '数值提升',
    nameJP: 'パラメータ上昇',
    description:
      'N层时，技能卡数值最终提升N%。此效果在所有其他数值增幅效果（好调、集中等）之后生效，是最终的百分比提升，而不是对某一buff的单独提升。',
    belongTo: '通用',
    type: '正面',
  },

  // === 中立效果 ===
  {
    name: '生成',
    nameJP: '生成',
    description: '直接获得一张技能卡，此技能卡不受牌库中"重复不可"类型限制（训练结束后移除）',
    belongTo: '通用',
    type: '中立',
  },

  // === 负面效果 ===
  {
    name: '消费体力增加',
    nameJP: '消費体力増加',
    description: '技能卡所需体力增加为原来的2倍，每回合-1层',
    belongTo: '通用',
    type: '负面',
  },
  {
    name: '元气增加无效',
    nameJP: '元気増加無効',
    description: '打出提供元气的技能卡时，不会获得任何元气（对固定量元气卡无效），每回合-1层',
    belongTo: '通用',
    type: '负面',
  },
  {
    name: '不调',
    nameJP: '不調',
    description: '技能卡得分量减少33%，每回合-1层',
    belongTo: '通用',
    type: '负面',
  },
  {
    name: '低迷',
    nameJP: 'スランプ',
    description: '技能卡得分量变为0，每回合-1层',
    belongTo: '通用',
    type: '负面',
  },
  {
    name: '变化无常',
    nameJP: '気まぐれ',
    description: '手牌中技能卡需要消费的体力会随机变化，每回合-1层',
    belongTo: '通用',
    type: '负面',
  },
  {
    name: '手牌减少',
    nameJP: '手札減少',
    description: 'N层时，每回合开始时获得的手牌减少N张',
    belongTo: '通用',
    type: '负面',
  },
  {
    name: '消费体力追加',
    nameJP: '消費体力追加',
    description: 'N层时，技能卡所需体力增加N点',
    belongTo: '通用',
    type: '负面',
  },
  {
    name: '特定技能卡使用不可',
    nameJP: '特定のスキルカード使用不可',
    description: '特定类型的技能卡无法在本回合打出，每回合-1层',
    belongTo: '通用',
    type: '负面',
  },
  {
    name: '不安',
    nameJP: '不安',
    description: '打出提供元气的技能卡时，获得的元气量减少33%（对固定量元气卡无效），每回合-1层',
    belongTo: '通用',
    type: '负面',
  },
  {
    name: '弱气',
    nameJP: '弱気',
    description: 'N层时，打出提供元气的技能卡时，获得的元气值减少N点（最低为0，对固定量元气卡无效）',
    belongTo: '通用',
    type: '负面',
  },
  {
    name: '指针固定',
    nameJP: '指針固定',
    description:
      '非凡角色的指针无法更改至"强气"、"温存"，全力值达10点时也无法进入"全力"状态（但不阻止"全力"状态的结束）',
    belongTo: '非凡',
    type: '负面',
  },
];

/**
 * 效果类型分类（用于AI生成参考）
 */
export const EFFECT_CATEGORIES = {
  属性操作: {
    description: '获得/消耗：元气、干劲、精力、专注、集中、活力、全力值等',
    examples: ['元气+10', '消耗专注3', '干劲+4', '全力值+2'],
  },
  Buff获得: {
    description: '获得持续性状态效果',
    examples: ['好调+2回合', '好调+3回合', '集中+2层', '好印象+4层'],
  },
  Buff消耗: {
    description: '消耗Buff以触发更强效果',
    examples: ['消耗好调1回合，下一张卡效果发动2次', '消耗好印象2层，回合数+1'],
  },
  数值增幅: {
    description: '提升训练/比赛的得分效率',
    examples: ['数值上升量增加20%', '好印象增加为1.1倍', '得分+X（基于当前属性）'],
  },
  特殊效果: {
    description: '改变游戏规则的效果',
    examples: ['技能卡使用数+1', '将3张SSR移至牌堆顶', '下回合手牌+2', '回合数+1'],
  },
  消耗体力: {
    description: '需要消耗体力才能使用',
    examples: ['消耗5体力', '体力消耗减少+2回合'],
  },
  状态切换: {
    description: '非凡专属：切换指针状态',
    examples: ['切换至全力状态', '切换至温存状态', '切换至强气状态'],
  },
};

/**
 * 重要规则说明
 */
export const IMPORTANT_RULES = {
  禁止事项: [
    '❌ 技能卡**不直接提升Vocal/Dance/Visual三维**',
    '❌ 禁止使用不符合世界观的命名',
    '❌ 禁止超出稀有度对应的成本/效果范围',
  ],
  必须遵守: [
    '✅ 技能卡的效果主要包括：**属性操作**（元气、干劲、专注等）、**Buff效果**（好调、集中等）、**特殊效果**（使用数+1、数值增幅等）',
    '✅ Vocal/Dance/Visual三维的作用：设置**审查基准**、提供**分数乘区**',
    '✅ effect和effectEnhanced字段必须使用纯中文（禁止日文）',
    '✅ 强化前后都有完整的效果描述',
  ],
  三维作用说明:
    'Vocal/Dance/Visual三维不由技能卡直接提升，而是：1. 设置审查基准（决定比赛中各属性回合的分布）；2. 在比赛/训练中提供分数乘区（三维越高，在对应主题回合内，技能卡获得的分数越高）',
};

/**
 * 获取指定培育计划的机制说明（Markdown格式）
 */
export function getProducePlanMechanicMarkdown(plan: ProducePlan): string {
  const mechanic = PRODUCE_PLAN_MECHANICS[plan];
  if (!mechanic) return '';

  let markdown = `### ${mechanic.name}（${mechanic.nameJP}，${mechanic.nameEN}）\n\n`;
  markdown += `**核心机制**: ${mechanic.coreMechanic}\n\n`;
  markdown += `**关键效果**:\n`;
  mechanic.keyEffects.forEach(effect => {
    markdown += `- **${effect.name}**（${effect.nameJP}）: ${effect.description}\n`;
  });
  markdown += `\n**玩法特点**: ${mechanic.playstyle}\n`;
  // 不输出vocabulary，避免限制AI的命名思路

  return markdown;
}

/**
 * 获取所有培育计划的机制说明（Markdown格式）
 */
export function getAllProducePlanMechanicsMarkdown(): string {
  let markdown = `## 培育计划机制说明\n\n`;

  (['感性', '理性', '非凡'] as ProducePlan[]).forEach(plan => {
    markdown += getProducePlanMechanicMarkdown(plan);
    markdown += `\n---\n\n`;
  });

  return markdown;
}

/**
 * 获取指定计划的Buff效果列表（Markdown格式）
 */
export function getEffectsByPlanMarkdown(plan: ProducePlan | '通用'): string {
  const effects = ALL_EFFECTS.filter(e => e.belongTo === plan || e.belongTo === '通用');

  let markdown = `### ${plan}计划相关效果\n\n`;
  markdown += `| 效果名 | 日文名 | 说明 | 类型 |\n`;
  markdown += `|--------|--------|------|------|\n`;

  effects.forEach(effect => {
    markdown += `| ${effect.name} | ${effect.nameJP} | ${effect.description} | ${effect.type} |\n`;
  });

  return markdown;
}

/**
 * 获取效果类型分类说明（Markdown格式）
 */
export function getEffectCategoriesMarkdown(): string {
  let markdown = `## 效果类型分类\n\n`;

  Object.entries(EFFECT_CATEGORIES).forEach(([category, data]) => {
    markdown += `### ${category}\n`;
    markdown += `**说明**: ${data.description}\n\n`;
    markdown += `**示例**: ${data.examples.join('、')}\n\n`;
  });

  return markdown;
}

/**
 * 获取重要规则说明（Markdown格式）
 */
export function getImportantRulesMarkdown(): string {
  let markdown = `## ⚠️ 重要规则\n\n`;

  markdown += `### 禁止事项\n`;
  IMPORTANT_RULES.禁止事项.forEach(rule => {
    markdown += `${rule}\n`;
  });
  markdown += `\n`;

  markdown += `### 必须遵守\n`;
  IMPORTANT_RULES.必须遵守.forEach(rule => {
    markdown += `${rule}\n`;
  });
  markdown += `\n`;

  markdown += `### 三维作用说明\n`;
  markdown += `${IMPORTANT_RULES.三维作用说明}\n\n`;

  return markdown;
}

/**
 * 获取完整的游戏机制说明（用于提示词）
 */
export function getFullMechanicExplanation(plan: ProducePlan): string {
  let explanation = '';

  // 1. 当前培育计划的机制
  explanation += getProducePlanMechanicMarkdown(plan);
  explanation += '\n---\n\n';

  // 2. 当前计划的Buff效果
  explanation += getEffectsByPlanMarkdown(plan);
  explanation += '\n---\n\n';

  // 3. 效果类型分类
  explanation += getEffectCategoriesMarkdown();
  explanation += '\n---\n\n';

  // 4. 重要规则
  explanation += getImportantRulesMarkdown();

  return explanation;
}
