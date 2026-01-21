/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable import-x/no-nodejs-modules */
const fs = require('fs');
const path = require('path');
const { generateAndValidate } = require('./llm_utils');

// ============ 配置 ============
const SOURCE_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json');
const DRAFT_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库_AI_Draft.json');

// 复用 migrate_all_cards.js 的提示词
const SYSTEM_PROMPT = fs
  .readFileSync(path.join(__dirname, 'migrate_all_cards.js'), 'utf-8')
  .match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/)[1]
  .replace(/\\`/g, '`')
  .replace(/\\\$/g, '$');

// ============ 主逻辑 ============

function extractAllCards(sourceData) {
  const allCards = [];
  function recurse(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(item => recurse(item));
    } else if (typeof obj === 'object' && obj !== null) {
      if (obj.id && obj.name && (obj.effect_before || obj.effectEntries || obj.rarity)) {
        allCards.push(obj);
      } else {
        Object.values(obj).forEach(value => recurse(value));
      }
    }
  }
  recurse(sourceData);
  return allCards;
}

async function processCard(card) {
  console.log(`\n🔄 重试: ${card.id} (${card.name})...`);

  const userPrompt = `请为以下卡牌生成 engine_data。

**card_id**: "${card.id}"

**卡牌数据**:
name: ${card.name}
effect_before: ${card.effect_before || '(无)'}
effect_after: ${card.effect_after || '(无)'}
cost: ${card.cost || '0'}
effectEntries: ${JSON.stringify(card.effectEntries, null, 2)}

**要求**:
1. effect_before → logic_chain
2. effect_after → logic_chain_enhanced (如果有)
3. Hook id 必须使用: ${card.id}::xxx
4. 只输出 engine_data 对象，禁止 Markdown`;

  const result = await generateAndValidate(SYSTEM_PROMPT, userPrompt);

  if (result.success) {
    const engineData = result.data.engine_data || result.data;
    const status = result.needsReview ? 'needs_review' : 'success';
    if (result.needsReview) {
      console.log(`⚠️ 需人工审核: ${card.id}`);
    } else {
      console.log(`✅ 成功: ${card.id}`);
    }
    return {
      id: card.id,
      name: card.name,
      engine_data: engineData,
      _status: status,
      _uncertain: !!result.needsReview,
    };
  } else {
    console.error(`❌ 失败: ${card.id} - ${result.error}`);
    return {
      id: card.id,
      name: card.name,
      _status: 'failed',
      _error: result.error,
    };
  }
}

async function main() {
  console.log('📂 读取草稿文件...');

  if (!fs.existsSync(DRAFT_FILE)) {
    console.error('❌ 草稿文件不存在，请先运行 migrate_all_cards.js');
    return;
  }

  const draftCards = JSON.parse(fs.readFileSync(DRAFT_FILE, 'utf-8'));
  const failedCards = draftCards.filter(c => c._status !== 'success' && c._status !== 'needs_review');

  console.log(`📊 总计: ${draftCards.length} 张，失败: ${failedCards.length} 张`);

  if (failedCards.length === 0) {
    console.log('🎉 没有失败的卡牌需要重试！');
    return;
  }

  // 读取源卡库获取完整卡牌数据
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));
  const allSourceCards = extractAllCards(sourceData);
  const sourceCardMap = new Map(allSourceCards.map(c => [c.id, c]));

  console.log(`\n开始重试 ${failedCards.length} 张失败的卡牌...\n`);

  let successCount = 0;
  let stillFailedCount = 0;

  for (let i = 0; i < failedCards.length; i++) {
    const failedCard = failedCards[i];
    const sourceCard = sourceCardMap.get(failedCard.id);

    if (!sourceCard) {
      console.error(`❌ 找不到源卡: ${failedCard.id}`);
      stillFailedCount++;
      continue;
    }

    console.log(`📍 重试进度: ${i + 1}/${failedCards.length}`);

    try {
      const result = await processCard(sourceCard);

      // 更新草稿中的对应卡牌
      const index = draftCards.findIndex(c => c.id === failedCard.id);
      if (index !== -1) {
        draftCards[index] = result;
      }

      if (result._status === 'success' || result._status === 'needs_review') {
        successCount++;
      } else {
        stillFailedCount++;
      }

      // 保存进度
      fs.writeFileSync(DRAFT_FILE, JSON.stringify(draftCards, null, 2));
      console.log(`💾 已保存`);
    } catch (err) {
      console.error(`❌ 处理失败: ${failedCard.id} - ${err.message}`);
      stillFailedCount++;
    }
  }

  console.log(`\n🎉 重试完成！`);
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 仍失败: ${stillFailedCount}`);
}

main().catch(console.error);
