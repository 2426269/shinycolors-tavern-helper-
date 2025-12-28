const fs = require('fs');
const path = require('path');

const files = [
  'src/偶像大师闪耀色彩-重构/战斗/数据/技能卡库.json',
  'src/偶像大师闪耀色彩-重构/战斗/数据/角色专属技能卡库.json',
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace 状态绝佳 with 绝好调
  const count1 = (content.match(/状态绝佳/g) || []).length;
  content = content.replace(/状态绝佳/g, '绝好调');

  // Replace 状态良好 with 好调
  const count2 = (content.match(/状态良好/g) || []).length;
  content = content.replace(/状态良好/g, '好调');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ ${file}: 替换了 ${count1} 个 状态绝佳, ${count2} 个 状态良好`);
}

console.log('✅ 术语替换完成！');
