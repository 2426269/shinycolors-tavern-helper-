/**
 * P饮料系统测试示例
 */

import {
  categorizePDrinksByEffect,
  createPlayerPDrink,
  filterPDrinks,
  getAllPDrinks,
  getPDrinkById,
  getPDrinksByName,
  getPDrinksByRarity,
  getPDrinksByType,
  getPDrinksForPlan,
  getRandomPDrinks,
  getRecommendedPDrinks,
  isPDrinkAvailableForPlan,
  P_DRINK_STATS,
  type PDrink,
  type PlayerPDrink,
  type ProducePlan,
} from './index';

/**
 * 示例1: 查看P饮料统计信息
 */
function example1_viewStats() {
  console.log('\n=== 示例1: P饮料统计信息 ===');
  console.log('总数:', P_DRINK_STATS.total);
  console.log('按类型:', P_DRINK_STATS.byType);
  console.log('按稀有度:', P_DRINK_STATS.byRarity);
}

/**
 * 示例2: 获取所有P饮料
 */
function example2_getAllDrinks() {
  console.log('\n=== 示例2: 获取所有P饮料 ===');
  const allDrinks = getAllPDrinks();
  console.log(`共有 ${allDrinks.length} 种P饮料`);
  console.log(
    '前5种:',
    allDrinks.slice(0, 5).map(d => d.nameCN),
  );
}

/**
 * 示例3: 按类型获取
 */
function example3_getDrinksByType() {
  console.log('\n=== 示例3: 按类型获取P饮料 ===');

  const commonDrinks = getPDrinksByType('通用');
  console.log(`通用饮料: ${commonDrinks.length}种`);
  commonDrinks.forEach(d => console.log(`  - ${d.nameCN}: ${d.effect}`));

  const senseDrinks = getPDrinksByType('感性专属');
  console.log(`\n感性专属饮料: ${senseDrinks.length}种`);
  senseDrinks.forEach(d => console.log(`  - ${d.nameCN}: ${d.effect}`));
}

/**
 * 示例4: 按培育计划获取可用饮料
 */
function example4_getDrinksForPlan() {
  console.log('\n=== 示例4: 按培育计划获取可用饮料 ===');

  const plans: ProducePlan[] = ['感性', '理性', '非凡'];
  plans.forEach(plan => {
    const drinks = getPDrinksForPlan(plan);
    console.log(`${plan}计划可用: ${drinks.length}种饮料`);
  });
}

/**
 * 示例5: 按稀有度获取
 */
function example5_getDrinksByRarity() {
  console.log('\n=== 示例5: 按稀有度获取 ===');

  const premiumDrinks = getPDrinksByRarity('特级');
  console.log(`特级饮料: ${premiumDrinks.length}种`);
  premiumDrinks.forEach(d => {
    console.log(`  - ${d.nameCN} (${d.type}): ${d.effect}`);
  });
}

/**
 * 示例6: 筛选P饮料
 */
function example6_filterDrinks() {
  console.log('\n=== 示例6: 筛选P饮料 ===');

  // 筛选1: 感性专属的特级饮料
  const filtered1 = filterPDrinks({
    type: '感性专属',
    rarity: '特级',
  });
  console.log(
    '感性专属的特级饮料:',
    filtered1.map(d => d.nameCN),
  );

  // 筛选2: 包含"元气"的饮料
  const filtered2 = filterPDrinks({
    keyword: '元气',
  });
  console.log(
    '\n包含"元气"的饮料:',
    filtered2.map(d => d.nameCN),
  );

  // 筛选3: 通用的高级饮料
  const filtered3 = filterPDrinks({
    type: '通用',
    rarity: '高级',
  });
  console.log(
    '\n通用的高级饮料:',
    filtered3.map(d => d.nameCN),
  );
}

/**
 * 示例7: 随机获取P饮料
 */
function example7_getRandomDrinks() {
  console.log('\n=== 示例7: 随机获取P饮料 ===');

  // 随机获取3种饮料
  const random1 = getRandomPDrinks(3);
  console.log(
    '随机3种饮料:',
    random1.map(d => d.nameCN),
  );

  // 随机获取2种特级饮料
  const random2 = getRandomPDrinks(2, { rarity: '特级' });
  console.log(
    '随机2种特级饮料:',
    random2.map(d => d.nameCN),
  );

  // 随机获取1种感性专属饮料
  const random3 = getRandomPDrinks(1, { type: '感性专属' });
  console.log(
    '随机1种感性专属饮料:',
    random3.map(d => d.nameCN),
  );
}

/**
 * 示例8: 按名称搜索
 */
function example8_searchByName() {
  console.log('\n=== 示例8: 按名称搜索 ===');

  // 精确搜索
  const exact = getPDrinksByName('初星水', true);
  console.log(
    '精确搜索"初星水":',
    exact.map(d => d.nameCN),
  );

  // 模糊搜索
  const fuzzy1 = getPDrinksByName('咖啡');
  console.log(
    '模糊搜索"咖啡":',
    fuzzy1.map(d => d.nameCN),
  );

  const fuzzy2 = getPDrinksByName('初星');
  console.log(
    '模糊搜索"初星":',
    fuzzy2.map(d => d.nameCN),
  );
}

/**
 * 示例9: 推荐饮料
 */
function example9_getRecommended() {
  console.log('\n=== 示例9: 推荐饮料 ===');

  // 为理性计划推荐（优先高稀有度）
  const recommended1 = getRecommendedPDrinks('理性', true);
  console.log(
    '理性计划推荐（高稀有度）:',
    recommended1.slice(0, 5).map(d => `${d.nameCN}(${d.rarity})`),
  );

  // 为非凡计划推荐（不限稀有度）
  const recommended2 = getRecommendedPDrinks('非凡', false);
  console.log(
    '非凡计划推荐（全部）:',
    recommended2.slice(0, 5).map(d => `${d.nameCN}(${d.rarity})`),
  );
}

/**
 * 示例10: 检查可用性
 */
function example10_checkAvailability() {
  console.log('\n=== 示例10: 检查可用性 ===');

  const drink1 = getPDrinkById('logic_001'); // 理性专属
  const drink2 = getPDrinkById('common_001'); // 通用

  if (drink1) {
    console.log(`${drink1.nameCN} 对理性计划:`, isPDrinkAvailableForPlan(drink1, '理性'));
    console.log(`${drink1.nameCN} 对感性计划:`, isPDrinkAvailableForPlan(drink1, '感性'));
  }

  if (drink2) {
    console.log(`${drink2.nameCN} 对理性计划:`, isPDrinkAvailableForPlan(drink2, '理性'));
    console.log(`${drink2.nameCN} 对感性计划:`, isPDrinkAvailableForPlan(drink2, '感性'));
  }
}

/**
 * 示例11: 按效果分类
 */
function example11_categorizeByEffect() {
  console.log('\n=== 示例11: 按效果分类 ===');

  const categories = categorizePDrinksByEffect();

  console.log(
    '直接得分类:',
    categories.scoreBoost.map(d => d.nameCN),
  );
  console.log(
    '属性提升类:',
    categories.attributeBoost.map(d => d.nameCN),
  );
  console.log(
    'Buff增强类:',
    categories.buffBoost.slice(0, 5).map(d => d.nameCN),
    '...',
  );
  console.log(
    '体力回复类:',
    categories.staminaRecovery.map(d => d.nameCN),
  );
  console.log(
    '卡牌操作类:',
    categories.cardManipulation.map(d => d.nameCN),
  );
  console.log(
    '特殊效果类:',
    categories.special.map(d => d.nameCN),
  );
}

/**
 * 示例12: 玩家背包系统
 */
function example12_playerInventory() {
  console.log('\n=== 示例12: 玩家背包系统 ===');

  const inventory: PlayerPDrink[] = [];
  const MAX_INVENTORY = 3;

  // 获得饮料函数
  function acquireDrink(drink: PDrink): boolean {
    if (inventory.length >= MAX_INVENTORY) {
      console.log('背包已满！');
      return false;
    }
    inventory.push(createPlayerPDrink(drink));
    console.log(`获得: ${drink.nameCN}`);
    return true;
  }

  // 使用饮料函数
  function useDrink(index: number): void {
    if (index >= inventory.length) {
      console.log('无效的索引');
      return;
    }
    const playerDrink = inventory[index];
    console.log(`使用: ${playerDrink.drink.nameCN}`);
    console.log(`效果: ${playerDrink.drink.effect}`);
    inventory.splice(index, 1);
  }

  // 显示背包函数
  function showInventory(): void {
    console.log('\n当前背包:');
    if (inventory.length === 0) {
      console.log('  (空)');
    } else {
      inventory.forEach((item, index) => {
        console.log(`  [${index}] ${item.drink.nameCN} (${item.drink.rarity})`);
      });
    }
  }

  // 测试流程
  const drink1 = getPDrinkById('common_001');
  const drink2 = getPDrinkById('sense_001');
  const drink3 = getPDrinkById('common_009');
  const drink4 = getPDrinkById('logic_001');

  if (drink1) acquireDrink(drink1);
  if (drink2) acquireDrink(drink2);
  if (drink3) acquireDrink(drink3);
  showInventory();

  if (drink4) acquireDrink(drink4); // 应该失败（背包已满）

  useDrink(1); // 使用第2个饮料
  showInventory();

  if (drink4) acquireDrink(drink4); // 现在应该成功
  showInventory();
}

/**
 * 示例13: 训练奖励系统
 */
function example13_trainingReward() {
  console.log('\n=== 示例13: 训练奖励系统 ===');

  function getTrainingReward(plan: ProducePlan, performance: 'Perfect' | 'Clear' | 'Fail'): PDrink[] {
    if (performance === 'Fail') {
      console.log('训练失败，没有奖励');
      return [];
    }

    if (performance === 'Perfect') {
      console.log('Perfect评价！获得高级奖励');
      return getRandomPDrinks(1, {
        rarity: ['高级', '特级'],
      });
    } else {
      console.log('Clear评价，获得普通奖励');
      return getRandomPDrinks(1, {
        type: '通用',
        rarity: ['普通', '高级'],
      });
    }
  }

  const reward1 = getTrainingReward('理性', 'Perfect');
  console.log(
    '获得:',
    reward1.map(d => `${d.nameCN}(${d.rarity})`),
  );

  const reward2 = getTrainingReward('感性', 'Clear');
  console.log(
    '获得:',
    reward2.map(d => `${d.nameCN}(${d.rarity})`),
  );

  const reward3 = getTrainingReward('非凡', 'Fail');
}

// 导出所有示例函数
export const pDrinkExamples = {
  runAll: () => {
    console.log('\n🍹 开始运行P饮料系统测试示例...\n');
    example1_viewStats();
    example2_getAllDrinks();
    example3_getDrinksByType();
    example4_getDrinksForPlan();
    example5_getDrinksByRarity();
    example6_filterDrinks();
    example7_getRandomDrinks();
    example8_searchByName();
    example9_getRecommended();
    example10_checkAvailability();
    example11_categorizeByEffect();
    example12_playerInventory();
    example13_trainingReward();
    console.log('\n✅ 所有P饮料示例运行完成！');
  },

  // 单独运行各个示例
  viewStats: example1_viewStats,
  getAllDrinks: example2_getAllDrinks,
  getDrinksByType: example3_getDrinksByType,
  getDrinksForPlan: example4_getDrinksForPlan,
  getDrinksByRarity: example5_getDrinksByRarity,
  filterDrinks: example6_filterDrinks,
  getRandomDrinks: example7_getRandomDrinks,
  searchByName: example8_searchByName,
  getRecommended: example9_getRecommended,
  checkAvailability: example10_checkAvailability,
  categorizeByEffect: example11_categorizeByEffect,
  playerInventory: example12_playerInventory,
  trainingReward: example13_trainingReward,
};

// 在开发环境下自动暴露到window对象
if (typeof window !== 'undefined') {
  (window as any).pDrinkExamples = pDrinkExamples;
  console.log('💡 P饮料测试示例已加载。在控制台输入 pDrinkExamples.runAll() 来运行所有示例。');
}
