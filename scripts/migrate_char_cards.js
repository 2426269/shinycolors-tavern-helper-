/**
 * 角色专属技能卡库 engine_data 迁移脚本
 * 从 技能卡库.json 按卡牌 name 匹配并复制 engine_data 到 角色专属技能卡库.json
 */

const fs = require('fs');
const path = require('path');

// 文件路径
const MAIN_LIBRARY_PATH = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json');
const CHAR_LIBRARY_PATH = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/角色专属技能卡库.json');
const OUTPUT_PATH = CHAR_LIBRARY_PATH; // 原地更新

// 读取技能卡库，构建 name -> card 映射
function buildNameToCardMap(mainLibrary) {
  const nameMap = new Map();

  // 遍历 { plan: { rarity: Card[] } } 结构
  for (const planCards of Object.values(mainLibrary)) {
    for (const rarityCards of Object.values(planCards)) {
      if (!Array.isArray(rarityCards)) continue;
      for (const card of rarityCards) {
        if (card.name && card.engine_data) {
          // 如果已存在同名卡，检查是否有更完整的 engine_data
          const existing = nameMap.get(card.name);
          if (!existing || (card.engine_data.logic_chain && card.engine_data.logic_chain.length > 0)) {
            nameMap.set(card.name, card);
          }
        }
      }
    }
  }

  console.log(`📚 主库映射构建完成: ${nameMap.size} 张卡有 engine_data`);
  return nameMap;
}

// 迁移角色专属技能卡库
function migrateCharacterLibrary(charLibrary, nameMap) {
  let totalCards = 0;
  let migratedCards = 0;
  const notFoundCards = [];

  // 遍历 { plan: { rarity: Card[] } } 结构
  for (const [plan, rarityMap] of Object.entries(charLibrary)) {
    for (const [rarity, cards] of Object.entries(rarityMap)) {
      if (!Array.isArray(cards)) continue;

      for (const card of cards) {
        totalCards++;

        // 跳过已有 engine_data 的卡
        if (card.engine_data) {
          console.log(`⏭️ 跳过 (已有): ${card.name}`);
          migratedCards++;
          continue;
        }

        // 按 name 查找
        const sourceCard = nameMap.get(card.name);
        if (sourceCard && sourceCard.engine_data) {
          card.engine_data = sourceCard.engine_data;
          migratedCards++;
          console.log(`✅ 迁移成功: ${card.name}`);
        } else {
          notFoundCards.push({ plan, rarity, id: card.id, name: card.name });
          console.log(`❌ 未找到: ${card.name} (${plan}/${rarity})`);
        }
      }
    }
  }

  return { totalCards, migratedCards, notFoundCards };
}

// 主函数
function main() {
  console.log('🚀 开始角色专属技能卡库 engine_data 迁移...\n');

  // 读取文件
  const mainLibrary = JSON.parse(fs.readFileSync(MAIN_LIBRARY_PATH, 'utf-8'));
  const charLibrary = JSON.parse(fs.readFileSync(CHAR_LIBRARY_PATH, 'utf-8'));

  // 构建映射
  const nameMap = buildNameToCardMap(mainLibrary);

  // 迁移
  const result = migrateCharacterLibrary(charLibrary, nameMap);

  // 保存
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(charLibrary, null, 2));

  // 报告
  console.log('\n========== 迁移报告 ==========');
  console.log(`📊 总卡牌数: ${result.totalCards}`);
  console.log(`✅ 成功迁移: ${result.migratedCards}`);
  console.log(`❌ 未找到: ${result.notFoundCards.length}`);

  if (result.notFoundCards.length > 0) {
    console.log('\n未匹配到的卡牌:');
    for (const card of result.notFoundCards) {
      console.log(`  - [${card.plan}/${card.rarity}] ${card.name} (id: ${card.id})`);
    }
  }

  console.log('\n✅ 迁移完成!');
}

main();
