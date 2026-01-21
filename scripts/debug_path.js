const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../src/偶像大师闪耀色彩-重构/战斗/数据');
console.log(`Target Dir: ${targetDir}`);

try {
  const files = fs.readdirSync(targetDir);
  console.log('Files:', files);
} catch (e) {
  console.error('Error listing directory:', e);
}
