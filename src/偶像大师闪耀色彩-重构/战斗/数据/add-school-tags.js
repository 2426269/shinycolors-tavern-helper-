/**
 * 技能卡流派标签添加脚本
 *
 * 流派规则：
 * - 非凡: 全力 (提升全力值), 温存 (转为温存), 强气 (转为强气)
 * - 理性: 好印象, 干劲
 * - 感性: 集中, 好调
 * - 自由: 不添加流派
 *
 * 使用方法: node add-school-tags.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '技能卡库.json');
const OUTPUT_FILE = path.join(__dirname, '技能卡库.json');

// 流派关键词映射
const SCHOOL_PATTERNS = {
  // 非凡 (Anomaly) 流派
  全力: [/全力値?\+/, /全力值?\+/, /AllPower/i, /全力状态.*回合数/],
  温存: [/温存に変更/, /温存に切り替え/, /切换[为至]?温存/, /转为温存/, /温存状态/, /ConserveState/i],
  强气: [/強気に変更/, /強気に切り替え/, /切换[为至]?强气/, /转为强气/, /强气[12]?段/, /ResoluteState/i],

  // 理性 (Logic) 流派
  好印象: [/好印象\+/, /好印象を/, /加好印象/, /GoodImpression/i],
  干劲: [/やる気\+/, /やる気を/, /干劲\+/, /加干劲/, /Motivation/i],

  // 感性 (Sense) 流派
  集中: [/集中\+/, /集中を/, /加集中/, /Concentration/i],
  好调: [/好調\+/, /絶好調/, /好调\+/, /绝好调/, /加好调/, /GoodCondition/i, /PerfectCondition/i],
};

// 计划到流派的映射
const PLAN_SCHOOLS = {
  非凡: ['全力', '温存', '强气'],
  理性: ['好印象', '干劲'],
  感性: ['集中', '好调'],
};

/**
 * 检测卡牌效果文本中的流派
 */
function detectSchool(card, plan) {
  // 自由计划不添加流派
  if (plan === '自由') {
    return null;
  }

  const validSchools = PLAN_SCHOOLS[plan] || [];
  const effectText = card.effect_before || '';
  const effectAfter = card.effect_after || '';
  const fullText = effectText + ' ' + effectAfter;

  // 检查 engine_data 中的 buff_id
  let engineText = '';
  if (card.engine_data) {
    engineText = JSON.stringify(card.engine_data);
  }

  const combinedText = fullText + ' ' + engineText;

  // 统计每个流派的匹配次数
  const matchCounts = {};

  for (const school of validSchools) {
    const patterns = SCHOOL_PATTERNS[school] || [];
    let count = 0;

    for (const pattern of patterns) {
      const matches = combinedText.match(new RegExp(pattern, 'gi'));
      if (matches) {
        count += matches.length;
      }
    }

    if (count > 0) {
      matchCounts[school] = count;
    }
  }

  // 返回匹配次数最多的流派
  const schools = Object.keys(matchCounts);
  if (schools.length === 0) {
    return null; // 无法判断
  }

  if (schools.length === 1) {
    return schools[0];
  }

  // 多个匹配，选择次数最多的
  schools.sort((a, b) => matchCounts[b] - matchCounts[a]);
  return schools[0];
}

/**
 * 为单张卡牌添加流派标签
 */
function addSchoolToCard(card, plan) {
  const school = detectSchool(card, plan);

  // 创建新对象，在 type 后面插入 school
  const newCard = {};

  for (const key of Object.keys(card)) {
    newCard[key] = card[key];

    // 在 type 后面插入 school
    if (key === 'type') {
      newCard['school'] = school;
    }
  }

  return newCard;
}

/**
 * 主函数
 */
function main() {
  console.log('读取技能卡库...');
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

  const stats = {
    total: 0,
    detected: 0,
    undetected: 0,
    bySchool: {},
  };

  // 处理每个计划
  for (const plan of Object.keys(data)) {
    console.log(`\n处理计划: ${plan}`);
    const planData = data[plan];

    // 处理每个稀有度
    for (const rarity of Object.keys(planData)) {
      const cards = planData[rarity];

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const newCard = addSchoolToCard(card, plan);
        cards[i] = newCard;

        stats.total++;
        if (newCard.school) {
          stats.detected++;
          stats.bySchool[newCard.school] = (stats.bySchool[newCard.school] || 0) + 1;
        } else {
          stats.undetected++;
        }
      }
    }
  }

  // 保存结果
  console.log('\n保存结果...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log('\n=== 统计 ===');
  console.log(`总卡牌数: ${stats.total}`);
  console.log(`成功识别: ${stats.detected} (${((stats.detected / stats.total) * 100).toFixed(1)}%)`);
  console.log(`未能识别: ${stats.undetected}`);
  console.log('\n各流派分布:');
  for (const [school, count] of Object.entries(stats.bySchool)) {
    console.log(`  ${school}: ${count}`);
  }

  console.log('\n完成！请检查结果并手动修正错误的部分。');
}

main();
