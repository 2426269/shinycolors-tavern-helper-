/**
 * 测试技能卡数据库加载
 */

import { SkillCardParser, getAllSkillCards } from './skill-card-parser';

export function testDatabaseLoad() {
  console.log('========== 测试技能卡数据库加载 ==========');

  try {
    // 测试1: 获取统计信息
    const stats = SkillCardParser.getStatistics();
    console.log('\n📊 数据库统计:');
    console.log(`总卡牌数: ${stats.totalCards}张`);
    console.log('\n按属性分类:');
    for (const [attr, count] of Object.entries(stats.byAttribute)) {
      console.log(`  ${attr}: ${count}张`);
    }
    console.log('\n按品阶分类:');
    for (const [rarity, count] of Object.entries(stats.byRarity)) {
      console.log(`  ${rarity}: ${count}张`);
    }

    // 测试2: 获取所有卡牌
    const allCards = getAllSkillCards();
    console.log(`\n✅ 成功加载 ${allCards.length} 张卡牌`);

    // 测试3: 显示每个属性的第一张SSR卡牌示例
    console.log('\n🎴 SSR卡牌示例:');
    const attributes: ('非凡' | '理性' | '感性' | '自由')[] = ['非凡', '理性', '感性', '自由'];
    for (const attr of attributes) {
      const cards = SkillCardParser.getCardsByAttribute(attr, false);
      const ssr = cards.find(c => c.rarity === 'SSR');
      if (ssr) {
        console.log(`\n  [${attr}] ${ssr.name}`);
        console.log(`    品阶: ${ssr.rarity}`);
        console.log(`    Cost: ${ssr.cost}`);
        console.log(`    效果数: ${ssr.effects.length}个`);
        console.log(`    描述: ${ssr.description.substring(0, 50)}...`);
      }
    }

    // 测试4: 创建初始牌组
    console.log('\n🎯 测试创建初始牌组:');
    const { createStarterDeck } = require('./skill-card-parser');
    const deck = createStarterDeck();
    console.log(`  牌组卡牌数: ${deck.length}张`);
    const deckStats = deck.reduce(
      (acc, card) => {
        acc[card.rarity] = (acc[card.rarity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    console.log('  品阶分布:', deckStats);

    console.log('\n✅ 所有测试通过！数据库集成成功！');
    return true;
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    return false;
  }
}

// 如果直接运行此文件
if (typeof window === 'undefined') {
  testDatabaseLoad();
}
