/**
 * 从技能卡库复制 type 字段到角色专属技能卡库
 * 仅通过名字精确匹配进行复制，不设置默认值
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载数据
const skillCardLibPath = path.join(__dirname, '../战斗/数据/技能卡库.json');
const characterCardLibPath = path.join(__dirname, '../战斗/数据/角色专属技能卡库.json');

const skillCardLib = JSON.parse(fs.readFileSync(skillCardLibPath, 'utf-8'));
const characterCardLib = JSON.parse(fs.readFileSync(characterCardLibPath, 'utf-8'));

// 构建 name -> type 映射
const nameToType = new Map();

for (const [plan, rarities] of Object.entries(skillCardLib)) {
  for (const [rarity, cards] of Object.entries(rarities)) {
    if (Array.isArray(cards)) {
      for (const card of cards) {
        if (card.name && card.type) {
          nameToType.set(card.name, card.type);
        }
      }
    }
  }
}

console.log(`📚 从技能卡库加载了 ${nameToType.size} 张卡的 type 映射`);

// 更新角色专属技能卡库（仅精确匹配）
let updatedCount = 0;
let skippedCount = 0;
const skippedNames = [];

for (const [plan, rarities] of Object.entries(characterCardLib)) {
  for (const [rarity, cards] of Object.entries(rarities)) {
    if (Array.isArray(cards)) {
      for (const card of cards) {
        if (!card.type) {
          const type = nameToType.get(card.name);
          if (type) {
            card.type = type;
            updatedCount++;
          } else {
            // 不设置默认值，只记录
            skippedCount++;
            skippedNames.push(card.name);
          }
        }
      }
    }
  }
}

console.log(`✅ 已更新 ${updatedCount} 张卡的 type 字段`);
console.log(`⚠️ 未匹配（跳过）: ${skippedCount} 张`);
if (skippedNames.length > 0) {
  console.log('  未匹配卡片:');
  skippedNames.forEach(name => console.log(`    - ${name}`));
}

// 保存更新后的角色专属技能卡库
fs.writeFileSync(characterCardLibPath, JSON.stringify(characterCardLib, null, 2), 'utf-8');
console.log(`💾 已保存更新后的角色专属技能卡库`);
