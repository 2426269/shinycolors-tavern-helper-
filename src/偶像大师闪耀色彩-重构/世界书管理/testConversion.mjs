/**
 * 转换测试脚本（Node.js 独立运行版）
 * 使用真实技能卡数据测试转换逻辑
 * 运行方式: node testConversion.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 数据文件路径
const SKILL_CARD_DB_PATH = resolve(__dirname, '../战斗/数据/技能卡库.json');
const CHARACTER_CARD_DB_PATH = resolve(__dirname, '../战斗/数据/角色专属技能卡库.json');
const OUTPUT_PATH = resolve(__dirname, '../../../解析成功率统计报告.md');

// ==================== 简化版转换逻辑 ====================

const TRUE_FUZZY_WORDS = ['稀微', '大幅', '按比例', '概略', '概率'];
const CONDITIONAL_TRIGGERS = ['若', '当', '仅在'];
const TEMPORAL_TRIGGERS = ['此后', '下回合', '下一回合', '直到'];

const BUFF_ALIAS_MAP = {
  好调: 'GoodCondition',
  绝好调: 'ExcellentCondition',
  集中: 'Concentration',
  干劲: 'Motivation',
  好印象: 'GoodImpression',
  体力消耗减少: 'StaminaReduction',
  全力: 'AlloutState',
  温存: 'ConserveState',
  强气: 'ResoluteState',
  全力值: 'AllPower',
  热意: 'Heat',
};

// 简单效果模式
const SIMPLE_PATTERNS = [
  { regex: /(?:数值|得分|打分值|分数)[+＋](\d+)/, action: 'GAIN_SCORE' },
  { regex: /(?:元气|精力|元氣)([+＋-－])(\d+)/, action: 'MODIFY_GENKI' },
  { regex: /技能卡使用(?:数|次数)[+＋](\d+)/, action: 'MODIFY_PLAY_LIMIT' },
  { regex: /回合(?:数)?[+＋](\d+)/, action: 'MODIFY_TURN_COUNT' },
  { regex: /额外抽取(\d+)张(?:技能卡)?/, action: 'DRAW_CARD' },
  { regex: /抽取(\d+)张(?:技能卡)?/, action: 'DRAW_CARD' },
  { regex: /体力消耗(\d+)/, action: 'MODIFY_STAMINA' },
  { regex: /体力[+＋-－](\d+)/, action: 'MODIFY_STAMINA' },
];

// Buff 效果模式
const BUFF_PATTERNS = [
  { regex: /(好调|绝好调|集中|干劲|好印象|全力值|热意)[+＋](\d+)(?:回合|层)?/, action: 'ADD_BUFF' },
  { regex: /进入(温存|强气|全力)(?:\d+(?:段|阶段))?状态/, action: 'ADD_BUFF' },
  { regex: /切换(?:至|为)(温存|强气|全力)(?:\d+(?:段|阶段))?状态?/, action: 'ADD_BUFF' },
];

// P6: 百分比效果模式
const PERCENTAGE_PATTERNS = [
  { regex: /(?:打分值|得分|分数)[+＋](\d+)[%％]/, action: 'GAIN_SCORE_PERCENT' },
  { regex: /集中(?:效果|增益)(\d+)倍(?:计算)?/, action: 'GAIN_SCORE_MULT' },
  { regex: /干劲(?:效果|增益)(\d+)倍(?:计算)?/, action: 'MODIFY_GENKI_MULT' },
  { regex: /好印象(?:增强|强化)[+＋](\d+)[%％]/, action: 'ADD_BUFF' },
  { regex: /好调增加回合数[+＋](\d+)[%％]/, action: 'MODIFY_BUFF_MULTIPLIER' },
  { regex: /集中增加量[+＋](\d+)[%％]/, action: 'MODIFY_BUFF_MULTIPLIER' },
  { regex: /最终(?:得分|分数)[+＋](\d+)[%％]/, action: 'ADD_BUFF' },
  { regex: /(?:提升|增加)元气(\d+)[%％]的(?:数值|分数)/, action: 'GAIN_SCORE' },
  { regex: /(?:提升|增加)好印象(\d+)[%％]的(?:数值|分数)/, action: 'GAIN_SCORE' },
  { regex: /好印象增加量(?:增加|提升)(\d+)[%％]/, action: 'ADD_BUFF' },
  { regex: /(?:增加|提升)好调回合数(\d+)[%％]的集中/, action: 'ADD_BUFF' },
  { regex: /(?:提升|增加)好调回合数(\d+)[%％]的(?:数值|分数)/, action: 'GAIN_SCORE' },
  { regex: /随后(\d+)(?:个)?回合内.*(?:增加|提升).*(\d+)[%％]的(?:数值|分数)/, action: 'HOOK_GAIN_SCORE' },
];

function parseSimpleEffect(effect) {
  // 检查简单模式
  for (const pattern of SIMPLE_PATTERNS) {
    if (pattern.regex.test(effect)) {
      return { success: true, action: pattern.action };
    }
  }

  // 检查 Buff 模式
  for (const pattern of BUFF_PATTERNS) {
    if (pattern.regex.test(effect)) {
      return { success: true, action: pattern.action };
    }
  }

  // P6: 检查百分比模式
  for (const pattern of PERCENTAGE_PATTERNS) {
    if (pattern.regex.test(effect)) {
      return { success: true, action: pattern.action };
    }
  }

  return { success: false };
}

function analyzeEntry(entry) {
  const effect = entry.effect || '';

  // 检查真正模糊词
  for (const word of TRUE_FUZZY_WORDS) {
    if (effect.includes(word)) {
      return { parseable: false, reason: 'fuzzy', word };
    }
  }

  // 检查条件触发词（P3 改进：尝试解析）
  const hasConditional = CONDITIONAL_TRIGGERS.some(w => effect.includes(w));
  const hasTemporal = TEMPORAL_TRIGGERS.some(w => effect.includes(w));

  // 尝试解析
  const result = parseSimpleEffect(effect);

  if (result.success) {
    return { parseable: true, action: result.action, hasConditional, hasTemporal };
  }

  // 条件词条部分解析（high_partial）
  if (hasConditional || hasTemporal) {
    // 尝试提取条件后的动作部分
    const actionPart = effect.replace(/^.*[，,]\s*/, '');
    const innerResult = parseSimpleEffect(actionPart);
    if (innerResult.success) {
      return { parseable: true, partial: true, action: innerResult.action, hasConditional, hasTemporal };
    }
    return {
      parseable: false,
      reason: 'conditional_complex',
      word: CONDITIONAL_TRIGGERS.find(w => effect.includes(w)) || TEMPORAL_TRIGGERS.find(w => effect.includes(w)),
    };
  }

  return { parseable: false, reason: 'unmatched', pattern: effect.slice(0, 30) };
}

function analyzeCard(card, plan) {
  const entries = card.effectEntries || [];

  if (entries.length === 0) {
    return { confidence: null, reason: 'no_entries' };
  }

  let allSuccess = true;
  let anySuccess = false;
  const partialEffects = [];
  const failedEffects = [];
  const fuzzyHits = [];
  const conditionalHits = [];

  for (const entry of entries) {
    const result = analyzeEntry(entry);

    if (result.parseable) {
      anySuccess = true;
      if (result.partial) {
        partialEffects.push(entry.effect);
      }
    } else {
      allSuccess = false;
      failedEffects.push({ effect: entry.effect, reason: result.reason, word: result.word });
      if (result.reason === 'fuzzy') {
        fuzzyHits.push(result.word);
      }
      if (result.reason === 'conditional_complex') {
        conditionalHits.push(result.word);
      }
    }
  }

  let confidence;
  if (allSuccess && anySuccess) {
    confidence = 'high';
  } else if (anySuccess) {
    confidence = 'high_partial';
  } else {
    confidence = null;
  }

  return {
    confidence,
    allSuccess,
    anySuccess,
    partialEffects,
    failedEffects,
    fuzzyHits,
    conditionalHits,
  };
}

function flattenCardDb(db) {
  const result = [];
  for (const [plan, rarities] of Object.entries(db)) {
    for (const [rarity, cards] of Object.entries(rarities)) {
      for (const card of cards) {
        result.push({ card, plan, rarity });
      }
    }
  }
  return result;
}

function analyzeDatabase(cards) {
  const stats = {
    total: cards.length,
    withEntries: 0,
    high: 0,
    highPartial: 0,
    failed: 0,
    fuzzyHits: new Map(),
    conditionalHits: new Map(),
    unmatchedPatterns: new Map(),
    byPlanRarity: new Map(),
    successSamples: [],
    failureSamples: [],
  };

  for (const { card, plan, rarity } of cards) {
    if (card.effectEntries && card.effectEntries.length > 0) {
      stats.withEntries++;
    }

    const key = `${plan}/${rarity}`;
    if (!stats.byPlanRarity.has(key)) {
      stats.byPlanRarity.set(key, { total: 0, high: 0, highPartial: 0 });
    }
    const planStats = stats.byPlanRarity.get(key);
    planStats.total++;

    const result = analyzeCard(card, plan);

    if (result.confidence === 'high') {
      stats.high++;
      planStats.high++;
      if (stats.successSamples.length < 5) {
        stats.successSamples.push({ card, plan, rarity, confidence: 'high' });
      }
    } else if (result.confidence === 'high_partial') {
      stats.highPartial++;
      planStats.highPartial++;
      if (stats.successSamples.length < 5) {
        stats.successSamples.push({ card, plan, rarity, confidence: 'high_partial' });
      }
    } else {
      stats.failed++;

      // 统计失败原因
      for (const hit of result.fuzzyHits || []) {
        stats.fuzzyHits.set(hit, (stats.fuzzyHits.get(hit) || 0) + 1);
      }
      for (const hit of result.conditionalHits || []) {
        stats.conditionalHits.set(hit, (stats.conditionalHits.get(hit) || 0) + 1);
      }
      for (const failed of result.failedEffects || []) {
        if (failed.reason === 'unmatched') {
          const pattern = failed.effect.slice(0, 30);
          stats.unmatchedPatterns.set(pattern, (stats.unmatchedPatterns.get(pattern) || 0) + 1);
        }
      }

      if (stats.failureSamples.length < 5) {
        stats.failureSamples.push({ card, plan, rarity, failedEffects: result.failedEffects });
      }
    }
  }

  return stats;
}

function generateReport(skillStats, charStats) {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  let report = `# 解析成功率统计报告\n\n`;
  report += `**生成时间**: ${now}\n\n`;
  report += `## 数据来源\n`;
  report += `- 技能卡库: ${SKILL_CARD_DB_PATH}\n`;
  report += `- 角色专属技能卡库: ${CHARACTER_CARD_DB_PATH}\n\n`;
  report += `## 统计方法\n`;
  report += `- 模拟 LegacyToV2Adapter 转换逻辑\n`;
  report += `- high: 全部词条成功转换\n`;
  report += `- high_partial: 部分词条成功转换\n`;
  report += `- failed: 无法转换\n\n`;

  report += `---\n\n## 技能卡库\n\n`;
  report += generateStatsSection(skillStats);

  report += `\n---\n\n## 角色专属技能卡库\n\n`;
  report += generateStatsSection(charStats);

  // 汇总
  const total = skillStats.total + charStats.total;
  const totalHigh = skillStats.high + charStats.high;
  const totalHighPartial = skillStats.highPartial + charStats.highPartial;
  const totalSuccess = totalHigh + totalHighPartial;

  report += `\n---\n\n## 汇总\n\n`;
  report += `| 指标 | 数值 |\n`;
  report += `|:-----|:-----|\n`;
  report += `| 总卡数 | ${total} |\n`;
  report += `| 可转换 (high+high_partial) | ${totalSuccess} (${((totalSuccess / total) * 100).toFixed(1)}%) |\n`;
  report += `| high | ${totalHigh} (${((totalHigh / total) * 100).toFixed(1)}%) |\n`;
  report += `| high_partial | ${totalHighPartial} (${((totalHighPartial / total) * 100).toFixed(1)}%) |\n`;

  return report;
}

function generateStatsSection(stats) {
  let section = ``;
  section += `- **总卡数**: ${stats.total}\n`;
  section += `- **含 effectEntries 的卡**: ${stats.withEntries}\n`;
  section += `- **high (全部成功)**: ${stats.high} (${((stats.high / stats.total) * 100).toFixed(1)}%)\n`;
  section += `- **high_partial (部分成功)**: ${stats.highPartial} (${((stats.highPartial / stats.total) * 100).toFixed(1)}%)\n`;
  section += `- **可转换总计**: ${stats.high + stats.highPartial} (${(((stats.high + stats.highPartial) / stats.total) * 100).toFixed(1)}%)\n`;
  section += `- **失败**: ${stats.failed}\n\n`;

  // 分计划-稀有度
  section += `### 分计划-稀有度成功率\n\n`;
  section += `| 计划/稀有度 | 总数 | high | high_partial | 合计 |\n`;
  section += `|:------------|:-----|:-----|:-------------|:-----|\n`;

  const sorted = Array.from(stats.byPlanRarity.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [key, data] of sorted) {
    const total = data.high + data.highPartial;
    const percent = data.total > 0 ? ((total / data.total) * 100).toFixed(1) : '0.0';
    section += `| ${key} | ${data.total} | ${data.high} | ${data.highPartial} | ${total} (${percent}%) |\n`;
  }

  // 关键词统计
  section += `\n### 模糊词命中 (Top 10)\n\n`;
  const sortedFuzzy = Array.from(stats.fuzzyHits.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  if (sortedFuzzy.length > 0) {
    section += `| 关键词 | 命中次数 |\n`;
    section += `|:-------|:---------|\n`;
    for (const [word, count] of sortedFuzzy) {
      section += `| ${word} | ${count} |\n`;
    }
  } else {
    section += `无\n`;
  }

  section += `\n### 条件词命中 (Top 10)\n\n`;
  const sortedCond = Array.from(stats.conditionalHits.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  if (sortedCond.length > 0) {
    section += `| 关键词 | 命中次数 |\n`;
    section += `|:-------|:---------|\n`;
    for (const [word, count] of sortedCond) {
      section += `| ${word} | ${count} |\n`;
    }
  } else {
    section += `无\n`;
  }

  section += `\n### 未匹配模式 (Top 10)\n\n`;
  const sortedUnmatched = Array.from(stats.unmatchedPatterns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  if (sortedUnmatched.length > 0) {
    section += `| 模式 | 次数 |\n`;
    section += `|:-----|:-----|\n`;
    for (const [pattern, count] of sortedUnmatched) {
      section += `| ${pattern} | ${count} |\n`;
    }
  } else {
    section += `无\n`;
  }

  // 样本
  section += `\n### 成功样本 (${stats.successSamples.length}条)\n\n`;
  for (const sample of stats.successSamples) {
    const entries = sample.card.effectEntries?.map(e => e.effect).join('；') || '';
    section += `- **${sample.card.name}** (${sample.plan}/${sample.rarity}) [${sample.confidence}]: ${entries.slice(0, 60)}...\n`;
  }

  section += `\n### 失败样本 (${stats.failureSamples.length}条)\n\n`;
  for (const sample of stats.failureSamples) {
    const entry = sample.card.effectEntries?.[0]?.effect || '';
    const reason = sample.failedEffects?.[0]?.reason || 'unknown';
    section += `- **${sample.card.name}** (${sample.plan}/${sample.rarity}) [${reason}]: ${entry.slice(0, 50)}...\n`;
  }

  return section;
}

// 主函数
function main() {
  console.log('📊 开始转换测试...\n');

  // 加载数据
  console.log('📂 加载技能卡库...');
  const skillCardDb = JSON.parse(readFileSync(SKILL_CARD_DB_PATH, 'utf-8'));
  const skillCards = flattenCardDb(skillCardDb);
  console.log(`   找到 ${skillCards.length} 张卡\n`);

  console.log('📂 加载角色专属技能卡库...');
  const charCardDb = JSON.parse(readFileSync(CHARACTER_CARD_DB_PATH, 'utf-8'));
  const charCards = flattenCardDb(charCardDb);
  console.log(`   找到 ${charCards.length} 张卡\n`);

  // 分析
  console.log('🔄 分析技能卡库...');
  const skillStats = analyzeDatabase(skillCards);
  console.log(`   high: ${skillStats.high}, high_partial: ${skillStats.highPartial}, failed: ${skillStats.failed}\n`);

  console.log('🔄 分析角色专属技能卡库...');
  const charStats = analyzeDatabase(charCards);
  console.log(`   high: ${charStats.high}, high_partial: ${charStats.highPartial}, failed: ${charStats.failed}\n`);

  // 生成报告
  console.log('📝 生成报告...');
  const report = generateReport(skillStats, charStats);
  writeFileSync(OUTPUT_PATH, report, 'utf-8');
  console.log(`✅ 报告已保存到: ${OUTPUT_PATH}\n`);

  // 汇总
  const total = skillStats.total + charStats.total;
  const totalHigh = skillStats.high + charStats.high;
  const totalHighPartial = skillStats.highPartial + charStats.highPartial;

  console.log('═══════════════════════════════════════');
  console.log('📊 汇总结果');
  console.log('═══════════════════════════════════════');
  console.log(`总卡数: ${total}`);
  console.log(
    `可转换 (high+high_partial): ${totalHigh + totalHighPartial} (${(((totalHigh + totalHighPartial) / total) * 100).toFixed(1)}%)`,
  );
  console.log(`  - high: ${totalHigh} (${((totalHigh / total) * 100).toFixed(1)}%)`);
  console.log(`  - high_partial: ${totalHighPartial} (${((totalHighPartial / total) * 100).toFixed(1)}%)`);
  console.log('═══════════════════════════════════════');
}

main();
