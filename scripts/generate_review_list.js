/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable import-x/no-nodejs-modules */
const fs = require('fs');

const draftData = JSON.parse(fs.readFileSync('src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库_AI_Draft.json', 'utf-8'));
const sourceData = JSON.parse(fs.readFileSync('src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json', 'utf-8'));

function findCard(obj, id) {
  if (Array.isArray(obj)) {
    for (let item of obj) {
      let r = findCard(item, id);
      if (r) return r;
    }
  } else if (typeof obj === 'object' && obj) {
    if (obj.id === id) return obj;
    for (let v of Object.values(obj)) {
      let r = findCard(v, id);
      if (r) return r;
    }
  }
  return null;
}

const uncertainCards = draftData.filter(c => c._uncertain === true);
const output = [];

output.push('# 需人工审核卡牌清单');
output.push('');
output.push('共 ' + uncertainCards.length + ' 张卡牌需要审核');
output.push('');

uncertainCards.forEach((card, i) => {
  const source = findCard(sourceData, card.id);
  output.push('---');
  output.push('');
  output.push('## ' + (i + 1) + '. [' + card.id + '] ' + card.name);
  output.push('');
  output.push('### 源效果');
  output.push('');
  output.push('- **effect_before**: ' + (source?.effect_before || '(无)'));
  output.push('- **effect_after**: ' + (source?.effect_after || '(无)'));
  output.push('- **cost**: ' + (source?.cost || '0'));
  output.push('');
  output.push('### 生成的 engine_data');
  output.push('');
  output.push('```json');
  output.push(JSON.stringify(card.engine_data, null, 2));
  output.push('```');
  output.push('');
  output.push('### 审核结果');
  output.push('');
  output.push('- [ ] 确认无误');
  output.push('- [ ] 需要修改');
  output.push('');
});

fs.writeFileSync('src/偶像大师闪耀色彩-重构/战斗/数据/需审核卡牌清单.md', output.join('\n'));
console.log('已生成: 需审核卡牌清单.md');
