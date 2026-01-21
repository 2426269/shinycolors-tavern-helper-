/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable import-x/no-nodejs-modules */
/**
 * T1: 技能卡库 ID 全新赋值脚本
 *
 * 格式: {PlanRarity}_{三位序号}
 * - A = 非凡, L = 理性, S = 感性, F = 自由
 * - 稀有度: N, R, SR, SSR, UR, T(陷阱)
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json');
const BACKUP_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库_backup.json');

// Plan 名称 -> 前缀字母
const PLAN_PREFIX = {
  非凡: 'A',
  理性: 'L',
  感性: 'S',
  自由: 'F',
};

// Rarity 名称 -> 后缀
const RARITY_SUFFIX = {
  N: 'N',
  R: 'R',
  SR: 'SR',
  SSR: 'SSR',
  UR: 'UR',
  陷阱卡: 'T', // 眠気
};

function generateNewId(planPrefix, raritySuffix, index) {
  const paddedIndex = String(index).padStart(3, '0');
  return `${planPrefix}${raritySuffix}_${paddedIndex}`;
}

function main() {
  console.log('📂 读取技能卡库...');

  // 读取源文件
  const data = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));

  // 备份
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2));
  console.log('💾 已创建备份: 技能卡库_backup.json');

  let totalCards = 0;
  const allIds = [];

  // 遍历所有分类和稀有度
  for (const [plan, rarities] of Object.entries(data)) {
    const planPrefix = PLAN_PREFIX[plan];
    if (!planPrefix) {
      console.warn(`⚠️ 未知分类: ${plan}`);
      continue;
    }

    for (const [rarity, cards] of Object.entries(rarities)) {
      const raritySuffix = RARITY_SUFFIX[rarity];
      if (!raritySuffix) {
        console.warn(`⚠️ 未知稀有度: ${rarity} in ${plan}`);
        continue;
      }

      if (!Array.isArray(cards)) continue;

      console.log(`📝 处理: ${plan}/${rarity} (${cards.length}张)`);

      cards.forEach((card, index) => {
        // 保存原始 ID
        card.originalId = card.id;

        // 生成新 ID
        const newId = generateNewId(planPrefix, raritySuffix, index + 1);
        card.id = newId;

        allIds.push(newId);
        totalCards++;
      });
    }
  }

  // 验证无重复
  const uniqueIds = new Set(allIds);
  const duplicateCount = allIds.length - uniqueIds.size;

  console.log('\n========== 验证结果 ==========');
  console.log(`📊 总卡牌数: ${totalCards}`);
  console.log(`📊 唯一ID数: ${uniqueIds.size}`);
  console.log(`📊 重复ID数: ${duplicateCount}`);

  if (duplicateCount > 0) {
    console.error('❌ 存在重复ID！');
    process.exit(1);
  }

  // 写入更新后的文件
  fs.writeFileSync(SOURCE_FILE, JSON.stringify(data, null, 2));
  console.log('\n✅ 技能卡库.json 已更新');

  // 显示示例
  console.log('\n========== 示例 ID ==========');
  const samples = [
    allIds[0],
    allIds[Math.floor(allIds.length / 4)],
    allIds[Math.floor(allIds.length / 2)],
    allIds[Math.floor((allIds.length * 3) / 4)],
    allIds[allIds.length - 1],
  ];
  samples.forEach(id => console.log(`  ${id}`));
}

main();
