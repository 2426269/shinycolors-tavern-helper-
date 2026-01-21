/**
 * 生成角色训练加成数据脚本
 * 使用 "基于排名的加权分配法" 生成神似原版的训练加成
 *
 * 执行方式: node generate-lesson-bonus.js
 */

const fs = require('fs');
const path = require('path');

// ==================== 核心算法 ====================

/**
 * 根据初始属性自动生成"神似原版"的训练加成
 * @param {Object} stats 初始三维 {vocal, dance, visual}
 * @returns {Object} lessonBonus {vocal, dance, visual} 百分比数值
 */
function generateLessonBonuses(stats) {
  const entries = [
    { type: 'vocal', val: stats.vocal },
    { type: 'dance', val: stats.dance },
    { type: 'visual', val: stats.visual },
  ];

  // 排序：按数值从大到小排
  // 如果数值一样，随机打乱顺序
  entries.sort((a, b) => b.val - a.val || Math.random() - 0.5);

  const bonuses = {};

  // --- 第1名 (特长项) ---
  // 基础 20% + (数值 * 0.05%)
  bonuses[entries[0].type] = 0.2 + entries[0].val * 0.0005;

  // --- 第2名 (普通项/潜力项) ---
  // 30% 概率触发 "高潜力"
  const isSecretTalent = Math.random() < 0.3;
  if (isSecretTalent) {
    bonuses[entries[1].type] = 0.18 + entries[1].val * 0.0004;
  } else {
    bonuses[entries[1].type] = 0.1 + entries[1].val * 0.0004;
  }

  // --- 第3名 (苦手项) ---
  bonuses[entries[2].type] = 0.08 + Math.random() * 0.02;

  // 格式化 & 钳制
  const format = val => {
    const clamped = Math.max(0.05, Math.min(0.35, val));
    return parseFloat((clamped * 100).toFixed(1));
  };

  return {
    vocal: format(bonuses['vocal']),
    dance: format(bonuses['dance']),
    visual: format(bonuses['visual']),
  };
}

// ==================== 主函数 ====================

function main() {
  const inputPath = path.join(__dirname, '../卡牌管理/card-attributes.json');
  const outputPath = path.join(__dirname, './数据/character-lesson-bonus.json');

  console.log('📖 Reading card-attributes.json...');
  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const cardData = JSON.parse(rawData);

  const result = {};
  let count = 0;

  console.log('🎲 Generating lesson bonuses...\n');

  for (const [cardName, card] of Object.entries(cardData)) {
    const lessonBonus = generateLessonBonuses(card.stats);

    result[cardName] = {
      enzaId: card.enzaId,
      characterId: card.characterId,
      lessonBonus,
    };

    count++;

    // 打印前10个作为示例
    if (count <= 10) {
      console.log(`[${count}] ${cardName}`);
      console.log(`    Stats: Vo ${card.stats.vocal} / Da ${card.stats.dance} / Vi ${card.stats.visual}`);
      console.log(`    Bonus: Vo ${lessonBonus.vocal}% / Da ${lessonBonus.dance}% / Vi ${lessonBonus.visual}%\n`);
    }
  }

  console.log(`\n✅ Generated ${count} lesson bonus entries.`);

  // 确保目录存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`📁 Saved to: ${outputPath}`);
}

main();
