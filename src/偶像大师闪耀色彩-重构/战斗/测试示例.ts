/**
 * 技能卡库测试示例
 * 演示如何使用技能卡库的各种功能
 */

import {
  SKILL_CARD_STATS,
  // 服务
  canUseSkillCard,
  enhanceSkillCard,
  filterSkillCards,
  getRandomSkillCards,
  getRecommendedSkillCards,
  getSkillCardById,
  getSkillCardEffect,
  getSkillCardsByName,
  getSkillCardsByPlan,
  getSkillCardsByRarity,
  parseCost,
} from './index';

// ============================================
// 1. 查看技能卡库统计信息
// ============================================
export function showSkillCardStats() {
  console.log('==========================================');
  console.log('📚 技能卡库统计信息');
  console.log('==========================================');
  console.log(`总卡数: ${SKILL_CARD_STATS.total}`);
  console.log('\n按稀有度:');
  console.log(`  - SSR: ${SKILL_CARD_STATS.byRarity.SSR} 张`);
  console.log(`  - SR:  ${SKILL_CARD_STATS.byRarity.SR} 张`);
  console.log(`  - R:   ${SKILL_CARD_STATS.byRarity.R} 张`);
  console.log(`  - N:   ${SKILL_CARD_STATS.byRarity.N} 张`);
  console.log('\n按培育计划:');
  console.log(`  - 非凡: ${SKILL_CARD_STATS.byPlan['非凡']} 张`);
  console.log(`  - 理性: ${SKILL_CARD_STATS.byPlan['理性']} 张`);
  console.log(`  - 感性: ${SKILL_CARD_STATS.byPlan['感性']} 张`);
  console.log(`  - 自由: ${SKILL_CARD_STATS.byPlan['自由']} 张`);
  console.log('==========================================\n');
}

// ============================================
// 2. 获取特定培育计划的技能卡
// ============================================
export function demonstrateGetByPlan() {
  console.log('==========================================');
  console.log('🎯 按培育计划获取技能卡');
  console.log('==========================================');

  const logicCards = getSkillCardsByPlan('理性');
  console.log(`理性计划共有 ${logicCards.length} 张技能卡`);

  // 显示前5张
  console.log('\n前5张理性技能卡:');
  logicCards.slice(0, 5).forEach((card, index) => {
    console.log(`${index + 1}. [${card.rarity}] ${card.name} (Cost: ${card.cost})`);
  });
  console.log('==========================================\n');
}

// ============================================
// 3. 按稀有度筛选
// ============================================
export function demonstrateGetByRarity() {
  console.log('==========================================');
  console.log('💎 按稀有度筛选技能卡');
  console.log('==========================================');

  // 获取所有SSR卡
  const ssrCards = getSkillCardsByRarity('SSR');
  console.log(`全部SSR卡: ${ssrCards.length} 张`);

  // 获取理性计划的SSR卡
  const logicSSR = getSkillCardsByRarity('SSR', '理性');
  console.log(`理性计划的SSR卡: ${logicSSR.length} 张`);

  // 显示几张示例
  console.log('\n示例 SSR 卡:');
  logicSSR.slice(0, 3).forEach((card, index) => {
    console.log(`${index + 1}. ${card.name}`);
    console.log(`   效果: ${card.effect_before.substring(0, 50)}...`);
  });
  console.log('==========================================\n');
}

// ============================================
// 4. 高级筛选功能
// ============================================
export function demonstrateFilterCards() {
  console.log('==========================================');
  console.log('🔍 高级筛选功能');
  console.log('==========================================');

  // 筛选：感性计划的SSR和SR卡
  const senseHighRarity = filterSkillCards({
    plan: '感性',
    rarity: ['SSR', 'SR'],
  });
  console.log(`感性计划的SSR+SR卡: ${senseHighRarity.length} 张`);

  // 筛选：包含"元気"关键词的卡
  const energyCards = filterSkillCards({
    keyword: '元気',
  });
  console.log(`包含"元気"的卡: ${energyCards.length} 张`);

  // 筛选：非凡计划的行动类卡牌
  const anomalyActiveCards = filterSkillCards({
    plan: '非凡',
    cardType: 'A',
  });
  console.log(`非凡计划的行动类卡: ${anomalyActiveCards.length} 张`);

  console.log('\n示例筛选结果:');
  energyCards.slice(0, 3).forEach((card, index) => {
    console.log(`${index + 1}. [${card.plan}][${card.rarity}] ${card.name}`);
  });
  console.log('==========================================\n');
}

// ============================================
// 5. 随机抽取技能卡
// ============================================
export function demonstrateRandomCards() {
  console.log('==========================================');
  console.log('🎲 随机抽取技能卡');
  console.log('==========================================');

  // 随机获取5张卡
  const randomCards = getRandomSkillCards(5);
  console.log('随机抽取5张卡:');
  randomCards.forEach((card, index) => {
    console.log(`${index + 1}. [${card.plan}][${card.rarity}] ${card.name}`);
  });

  // 随机获取3张SSR卡
  console.log('\n随机抽取3张SSR卡:');
  const randomSSR = getRandomSkillCards(3, { rarity: 'SSR' });
  randomSSR.forEach((card, index) => {
    console.log(`${index + 1}. [${card.plan}] ${card.name}`);
  });

  console.log('==========================================\n');
}

// ============================================
// 6. 推荐技能卡系统
// ============================================
export function demonstrateRecommendedCards() {
  console.log('==========================================');
  console.log('⭐ 推荐技能卡系统');
  console.log('==========================================');

  const recommended = getRecommendedSkillCards('非凡', 10);
  console.log('为非凡计划推荐10张技能卡（优先SSR/SR）:');
  recommended.forEach((card, index) => {
    console.log(`${index + 1}. [${card.rarity}] ${card.name} (Cost: ${card.cost})`);
  });
  console.log('==========================================\n');
}

// ============================================
// 7. 技能卡强化系统
// ============================================
export function demonstrateEnhancement() {
  console.log('==========================================');
  console.log('⚡ 技能卡强化系统');
  console.log('==========================================');

  // 获取一张卡
  const card = getSkillCardById('理性_1');
  if (!card) {
    console.log('未找到卡牌');
    return;
  }

  console.log(`原始卡牌: ${card.name}`);
  console.log(`强化前效果: ${card.effect_before}`);
  console.log(`强化状态: ${card.enhanced ? '已强化' : '未强化'}`);

  // 强化卡牌
  const enhancedCard = enhanceSkillCard(card);
  console.log(`\n强化后效果: ${getSkillCardEffect(enhancedCard)}`);
  console.log(`强化状态: ${enhancedCard.enhanced ? '已强化' : '未强化'}`);

  console.log('==========================================\n');
}

// ============================================
// 8. 成本解析
// ============================================
export function demonstrateCostParsing() {
  console.log('==========================================');
  console.log('💰 成本解析');
  console.log('==========================================');

  const testCosts = ['0', '3', '5', '10', '-5', '元気-3'];

  testCosts.forEach(costString => {
    const parsed = parseCost(costString);
    console.log(`"${costString}" -> ${parsed}`);
  });

  console.log('==========================================\n');
}

// ============================================
// 9. 检查是否可以使用技能卡
// ============================================
export function demonstrateCanUseCard() {
  console.log('==========================================');
  console.log('✅ 检查是否可以使用技能卡');
  console.log('==========================================');

  const card = getSkillCardById('感性_1');
  if (!card) {
    console.log('未找到卡牌');
    return;
  }

  const resources = {
    energy: 10,
    stamina: 20,
    goodImpression: 5,
  };

  console.log(`卡牌: ${card.name}`);
  console.log(`消耗: ${card.cost}`);
  console.log(`当前资源: 元气=${resources.energy}, 体力=${resources.stamina}, 好印象=${resources.goodImpression}`);

  const canUse = canUseSkillCard(card, resources);
  console.log(`是否可以使用: ${canUse ? '✅ 可以' : '❌ 不可以'}`);

  console.log('==========================================\n');
}

// ============================================
// 10. 按名称搜索
// ============================================
export function demonstrateSearchByName() {
  console.log('==========================================');
  console.log('🔎 按名称搜索技能卡');
  console.log('==========================================');

  // 精确匹配
  const exactMatch = getSkillCardsByName('国民的アイドル', true);
  console.log('精确搜索 "国民的アイドル":');
  exactMatch.forEach(card => {
    console.log(`  - [${card.plan}][${card.rarity}] ${card.name}`);
  });

  // 模糊搜索
  console.log('\n模糊搜索包含 "アイドル" 的卡:');
  const fuzzyMatch = getSkillCardsByName('アイドル');
  console.log(`  找到 ${fuzzyMatch.length} 张卡`);
  fuzzyMatch.slice(0, 5).forEach(card => {
    console.log(`  - [${card.plan}][${card.rarity}] ${card.name}`);
  });

  console.log('==========================================\n');
}

// ============================================
// 11. 构建初始卡组示例
// ============================================
export function demonstrateDeckBuilding() {
  console.log('==========================================');
  console.log('🎴 构建初始卡组');
  console.log('==========================================');

  const plan = '理性';

  // 基础卡 (N卡)
  const nCards = getSkillCardsByRarity('N', plan);
  console.log(`添加 ${nCards.length} 张基础卡 (N卡)`);

  // 推荐卡 (SSR/SR为主)
  const recommended = getRecommendedSkillCards(plan, 15);
  console.log(`添加 ${recommended.length} 张推荐卡`);

  const deck = [...nCards, ...recommended];

  console.log(`\n卡组构建完成！`);
  console.log(`总卡数: ${deck.length}`);

  // 统计稀有度分布
  const rarityCount = {
    N: deck.filter(c => c.rarity === 'N').length,
    R: deck.filter(c => c.rarity === 'R').length,
    SR: deck.filter(c => c.rarity === 'SR').length,
    SSR: deck.filter(c => c.rarity === 'SSR').length,
  };

  console.log(`稀有度分布: N=${rarityCount.N}, R=${rarityCount.R}, SR=${rarityCount.SR}, SSR=${rarityCount.SSR}`);

  console.log('==========================================\n');
}

// ============================================
// 运行所有示例
// ============================================
export function runAllExamples() {
  console.clear();
  console.log('\n');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   技能卡库测试示例 - 完整演示             ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('\n');

  showSkillCardStats();
  demonstrateGetByPlan();
  demonstrateGetByRarity();
  demonstrateFilterCards();
  demonstrateRandomCards();
  demonstrateRecommendedCards();
  demonstrateEnhancement();
  demonstrateCostParsing();
  demonstrateCanUseCard();
  demonstrateSearchByName();
  demonstrateDeckBuilding();

  console.log('╔══════════════════════════════════════════╗');
  console.log('║   所有示例运行完成！                      ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('\n');
}

// 自动运行（如果直接执行此文件）
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以通过控制台调用
  (window as any).skillCardExamples = {
    runAll: runAllExamples,
    showStats: showSkillCardStats,
    byPlan: demonstrateGetByPlan,
    byRarity: demonstrateGetByRarity,
    filter: demonstrateFilterCards,
    random: demonstrateRandomCards,
    recommended: demonstrateRecommendedCards,
    enhance: demonstrateEnhancement,
    cost: demonstrateCostParsing,
    canUse: demonstrateCanUseCard,
    search: demonstrateSearchByName,
    buildDeck: demonstrateDeckBuilding,
  };

  console.log('💡 提示: 在控制台中输入 skillCardExamples.runAll() 运行所有示例');
}

