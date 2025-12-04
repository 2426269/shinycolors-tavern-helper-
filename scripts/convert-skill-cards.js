const fs = require('fs');
const path = require('path');

// 读取技能卡库
const skillCardLibraryPath = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json');
const skillCardLibrary = JSON.parse(fs.readFileSync(skillCardLibraryPath, 'utf-8'));

// 效果类型图标映射
const effectIconMap = {
  体力消费: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/体力.png',
  元气: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/元气.png',
  好印象: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好印象.png',
  干劲: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/干劲.png',
  集中: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/集中.png',
  好调: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/好调.png',
  绝佳: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/绝好调.png',
  全力值: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/全力值.png',
  强气: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/强气.png',
  温存: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/温存.png',
  数值: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/数值.png',
  消费体力减少: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/消费体力减少.png',
  消费体力削减: 'https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/游戏图标/消费体力削减.png',
};

// 解析单个效果文本为词条数组
function parseEffectText(effectText) {
  if (!effectText) return [];

  const entries = [];

  // 移除"※レッスン中1回 重複不可"等使用限制标记（这些会单独处理）
  let cleanText = effectText.replace(/※.*$/, '').trim();

  // 按空格分割效果
  const parts = cleanText.split(/\s+/);

  for (const part of parts) {
    if (!part) continue;

    let entry = {
      icon: '',
      effect: part,
      isConsumption: false,
    };

    // 检测消耗效果
    if (part.includes('体力消費') || part.includes('消費') || part.includes('体力-')) {
      entry.isConsumption = true;
      entry.icon = effectIconMap['体力消费'];
    }
    // 检测元气相关
    else if (part.includes('元気')) {
      entry.icon = effectIconMap['元气'];
    }
    // 检测好印象
    else if (part.includes('好印象')) {
      entry.icon = effectIconMap['好印象'];
    }
    // 检测やる気/干劲
    else if (part.includes('やる気')) {
      entry.icon = effectIconMap['干劲'];
    }
    // 检测集中
    else if (part.includes('集中')) {
      entry.icon = effectIconMap['集中'];
    }
    // 检测好调
    else if (part.includes('好調') || part.includes('好调')) {
      entry.icon = effectIconMap['好调'];
    }
    // 检测绝好调
    else if (part.includes('絶好調') || part.includes('绝好调')) {
      entry.icon = effectIconMap['绝佳'];
    }
    // 检测全力值
    else if (part.includes('全力値') || part.includes('全力值')) {
      entry.icon = effectIconMap['全力值'];
    }
    // 检测强气
    else if (part.includes('強気') || part.includes('强气')) {
      entry.icon = effectIconMap['强气'];
    }
    // 检测温存
    else if (part.includes('温存')) {
      entry.icon = effectIconMap['温存'];
    }
    // 检测パラメータ/数值
    else if (part.includes('パラメータ') || part.includes('数值')) {
      entry.icon = effectIconMap['数值'];
    }
    // 检测消费体力减少
    else if (part.includes('消費体力減少') || part.includes('消费体力减少')) {
      entry.icon = effectIconMap['消费体力减少'];
    }
    // 检测消费体力削减
    else if (part.includes('消費体力削減') || part.includes('消费体力削减')) {
      entry.icon = effectIconMap['消费体力削减'];
    }

    entries.push(entry);
  }

  return entries;
}

// 解析使用限制
function parseRestrictions(effectText) {
  const restrictions = {
    isDuplicatable: true, // 默认可重复
    usesPerBattle: null, // null表示无限制
  };

  if (!effectText) return restrictions;

  // 检查"重複不可"
  if (effectText.includes('重複不可') || effectText.includes('重复不可')) {
    restrictions.isDuplicatable = false;
  }

  // 检查"レッスン中1回"或"演出中限1次"
  if (effectText.includes('レッスン中1回') || effectText.includes('演出中限1次')) {
    restrictions.usesPerBattle = 1;
  }

  return restrictions;
}

// 转换单张技能卡
function convertSkillCard(card) {
  const converted = {
    ...card,
    effectEntries: parseEffectText(card.effect_before),
    effectEntriesEnhanced: parseEffectText(card.effect_after),
    restrictions: parseRestrictions(card.effect_before),
    // 保留原始效果文本以向后兼容
    effect_before: card.effect_before,
    effect_after: card.effect_after,
  };

  return converted;
}

// 转换整个技能卡库
function convertSkillCardLibrary(library) {
  const converted = {};

  for (const [plan, rarities] of Object.entries(library)) {
    converted[plan] = {};

    for (const [rarity, cards] of Object.entries(rarities)) {
      converted[plan][rarity] = cards.map(convertSkillCard);
    }
  }

  return converted;
}

// 执行转换
console.log('开始转换技能卡库...');
const convertedLibrary = convertSkillCardLibrary(skillCardLibrary);

// 保存转换后的文件
const outputPath = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库-词条式.json');
fs.writeFileSync(outputPath, JSON.stringify(convertedLibrary, null, 2), 'utf-8');

console.log(`转换完成！已保存到: ${outputPath}`);
console.log(
  `总共转换了 ${Object.values(convertedLibrary).flatMap(plan => Object.values(plan).flatMap(cards => cards)).length} 张技能卡`,
);




