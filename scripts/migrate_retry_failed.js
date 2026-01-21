/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * migrate_retry_failed.js
 * 只重跑失败/缺失的卡牌，追加到现有 Draft 文件
 */

const fs = require('fs');
const path = require('path');
const { generateAndValidate } = require('./llm_utils');

const SOURCE_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json');
const DRAFT_FILE = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库_AI_Draft.json');

// 从 migrate_all_cards.js 动态提取 SYSTEM_PROMPT
function getSystemPrompt() {
  const script = fs.readFileSync(path.join(__dirname, 'migrate_all_cards.js'), 'utf-8');
  const match = script.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/);
  if (!match) throw new Error('无法提取 SYSTEM_PROMPT');
  return match[1].replace(/\\`/g, '`').replace(/\\\$/g, '$');
}

// 从源数据提取卡牌（复用 migrate_all_cards.js 的逻辑）
function extractAllCards(sourceData) {
  const allCards = [];
  function recurse(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach(recurse);
    } else if (obj.id && obj.name && (obj.effect_before || obj.effectEntries || obj.rarity)) {
      allCards.push(obj);
    } else {
      Object.values(obj).forEach(recurse);
    }
  }
  recurse(sourceData);
  return allCards;
}

async function processCard(card, systemPrompt) {
  console.log(`\n🔄 转换: ${card.id} (${card.name})...`);

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

  const result = await generateAndValidate(systemPrompt, userPrompt);

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
  console.log('📂 读取源文件和 Draft...');

  // 获取 SYSTEM_PROMPT
  const systemPrompt = getSystemPrompt();
  console.log(`📋 已加载 SYSTEM_PROMPT (${systemPrompt.length} 字符)`);

  // 读取源卡牌
  const rawData = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const sourceData = JSON.parse(rawData);
  const allCards = extractAllCards(sourceData);
  console.log(`📊 源文件共 ${allCards.length} 张卡牌`);

  // 读取现有 Draft
  let draftCards = [];
  if (fs.existsSync(DRAFT_FILE)) {
    draftCards = JSON.parse(fs.readFileSync(DRAFT_FILE, 'utf-8'));
  }
  console.log(`📋 Draft 现有 ${draftCards.length} 张卡牌`);

  // 找出缺失的卡牌
  const draftIds = new Set(draftCards.map(c => c.id));
  const missingCards = allCards.filter(c => !draftIds.has(c.id));

  console.log(`❓ 缺失 ${missingCards.length} 张卡牌`);

  if (missingCards.length === 0) {
    console.log('✅ 没有需要重跑的卡牌！');
    return;
  }

  console.log('缺失卡牌 ID:', missingCards.map(c => c.id).join(', '));

  // 逐个处理缺失卡牌
  for (let i = 0; i < missingCards.length; i++) {
    const card = missingCards[i];
    console.log(`\n📍 进度: ${i + 1}/${missingCards.length}`);

    const result = await processCard(card, systemPrompt);
    draftCards.push(result);

    // 保存结果
    fs.writeFileSync(DRAFT_FILE, JSON.stringify(draftCards, null, 2));
    console.log(`💾 已保存 (${draftCards.length} 张)`);
  }

  console.log(`\n🎉 完成！现在 Draft 共 ${draftCards.length} 张卡牌`);

  // 统计结果
  const successCount = draftCards.filter(c => c._status === 'success').length;
  const failedCount = draftCards.filter(c => c._status === 'failed').length;
  console.log(`📊 成功: ${successCount}, 失败: ${failedCount}`);
}

main().catch(console.error);
