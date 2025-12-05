/**
 * 战斗系统测试示例
 *
 * 演示如何使用卡牌战斗系统
 */

import { BattleController, createAdvancedDeck, createStarterDeck, EventBus, GameEvents } from '../index';
import type { BattleConfig } from '../types';

/**
 * 测试1: 基础战斗流程
 */
export async function testBasicBattle() {
  console.log('========== 测试1: 基础战斗流程 ==========');

  const config: BattleConfig = {
    mode: 'training',
    planType: 'sense',
    maxTurns: 5, // 短期测试
    stats: {
      vocal: 100,
      dance: 80,
      visual: 90,
    },
    skillDeck: createStarterDeck(),
    targetScore: 500,
    perfectScore: 1000,
  };

  const controller = new BattleController(config);

  // 监听事件
  EventBus.on(GameEvents.CARD_USED, ({ card }) => {
    console.log(`✓ 使用了卡牌: ${card.name}`);
  });

  EventBus.on(GameEvents.SCORE_CHANGED, ({ delta, source }) => {
    console.log(`✓ 得分变化: +${delta} (来源: ${source || '未知'})`);
  });

  controller.start();

  // 模拟5个回合
  for (let turn = 1; turn <= 5; turn++) {
    await controller.startTurn();
    console.log(`\n--- 第${turn}回合开始 ---`);

    const state = controller.getState();
    console.log(`手牌数: ${state.hand.length}`);
    console.log(`体力: ${state.stamina}/${state.maxStamina}`);
    console.log(`元气: ${state.genki}/100`);

    // 尝试使用第一张手牌
    if (state.hand.length > 0) {
      const success = await controller.useCard(0);
      if (success) {
        console.log(`✓ 成功使用卡牌`);
      } else {
        console.log(`✗ 使用卡牌失败`);
      }
    }

    await controller.endTurn();
    console.log(`当前得分: ${controller.getScore()}`);
  }

  // 结束战斗
  const result = await controller.endBattle();
  console.log('\n========== 战斗结果 ==========');
  console.log(`评价: ${result.evaluation}`);
  console.log(`最终得分: ${result.finalScore}`);
  console.log(`使用卡牌: ${result.cardsUsed}张`);
  console.log(`剩余体力: ${result.remainingStamina}`);
  console.log(`奖励P点: ${result.rewards.pPoints}`);
  console.log(
    `属性提升: Vo+${result.rewards.statGain.vocal} Da+${result.rewards.statGain.dance} Vi+${result.rewards.statGain.visual}`,
  );

  return result;
}

/**
 * 测试2: 非凡系统
 */
export async function testAnomalySystem() {
  console.log('\n========== 测试2: 非凡系统 ==========');

  const config: BattleConfig = {
    mode: 'training',
    planType: 'anomaly', // 非凡系统
    maxTurns: 8,
    stats: {
      vocal: 120,
      dance: 110,
      visual: 100,
    },
    skillDeck: createAdvancedDeck(),
    targetScore: 1000,
    perfectScore: 2000,
  };

  const controller = new BattleController(config);

  // 监听非凡状态变化
  EventBus.on(GameEvents.ANOMALY_STATE_CHANGED, ({ oldState, newState, level }) => {
    console.log(`✓ 非凡状态变化: ${oldState || '无'} → ${newState} (阶段${level})`);
  });

  EventBus.on(GameEvents.ALL_POWER_FULL, () => {
    console.log(`✓ 全力值已满！进入全力状态！`);
  });

  controller.start();

  for (let turn = 1; turn <= 3; turn++) {
    await controller.startTurn();
    console.log(`\n--- 第${turn}回合 ---`);

    const state = controller.getState();
    console.log(`全力值: ${state.attributes.allPower}/10`);
    console.log(`热意值: ${state.attributes.heat}`);
    console.log(`当前状态: ${state.attributes.anomalyState || '无'}`);

    // 使用卡牌
    if (state.hand.length > 0) {
      await controller.useCard(0);
    }

    await controller.endTurn();
  }

  const result = await controller.endBattle();
  console.log('\n非凡系统测试完成！');
  console.log(`最终得分: ${result.finalScore}`);

  return result;
}

/**
 * 测试3: Buff系统
 */
export async function testBuffSystem() {
  console.log('\n========== 测试3: Buff系统 ==========');

  const config: BattleConfig = {
    mode: 'training',
    planType: 'logic', // 理性系统（好印象等）
    maxTurns: 5,
    stats: {
      vocal: 100,
      dance: 100,
      visual: 100,
    },
    skillDeck: createStarterDeck(),
    targetScore: 800,
  };

  const controller = new BattleController(config);

  // 监听Buff事件
  EventBus.on(GameEvents.BUFF_ADDED, ({ buff }) => {
    console.log(`✓ 获得Buff: ${buff.name}`);
  });

  EventBus.on(GameEvents.BUFF_REMOVED, ({ buff }) => {
    console.log(`✓ 失去Buff: ${buff.name}`);
  });

  controller.start();

  for (let turn = 1; turn <= 5; turn++) {
    await controller.startTurn();
    console.log(`\n--- 第${turn}回合 ---`);

    const state = controller.getState();
    const buffCount = state.buffs.size;
    console.log(`当前Buff数: ${buffCount}`);

    if (buffCount > 0) {
      console.log('当前Buff:');
      for (const buff of state.buffs.values()) {
        console.log(`  - ${buff.name} (层数:${buff.stacks}, 剩余:${buff.duration}回合)`);
      }
    }

    // 使用卡牌
    if (state.hand.length > 0) {
      await controller.useCard(0);
    }

    await controller.endTurn();
  }

  const result = await controller.endBattle();
  console.log('\nBuff系统测试完成！');

  return result;
}

/**
 * 运行所有测试
 */
export async function runAllTests() {
  console.log('🎮 开始卡牌战斗系统测试...\n');

  try {
    await testBasicBattle();
    await testAnomalySystem();
    await testBuffSystem();

    console.log('\n✅ 所有测试完成！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  }
}

// 如果直接运行此文件
if (typeof window === 'undefined') {
  runAllTests();
}
