/**
 * 预计算背景图 Embeddings (CommonJS 版本)
 * 运行: node precompute-embeddings.js
 */

const fs = require('fs');

const INPUT_FILE = 'E:\\偶像大师\\闪耀色彩图片-最终版\\backgrounds.json';
const OUTPUT_FILE = 'E:\\偶像大师\\闪耀色彩图片-最终版\\backgrounds_with_embeddings.json';

async function main() {
  console.log('加载嵌入模型...');

  // 动态导入 ESM 模块
  const { pipeline } = await import('@xenova/transformers');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  console.log('加载背景数据...');
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  console.log(`共 ${data.length} 条数据`);

  console.log('开始计算 embeddings...');
  for (let i = 0; i < data.length; i++) {
    const bg = data[i];

    // 构建文本描述
    const text = `${bg.location} ${bg.mood} ${bg.tags.join(' ')} ${bg.time}`;

    // 计算 embedding
    const result = await embedder(text, { pooling: 'mean', normalize: true });
    bg.embedding = Array.from(result.data);

    if ((i + 1) % 50 === 0) {
      console.log(`[${i + 1}/${data.length}] 已处理`);
      // 每 100 条保存一次，防止中断丢失
      if ((i + 1) % 100 === 0) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
      }
    }
  }

  console.log('保存结果...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`完成！输出: ${OUTPUT_FILE}`);
}

main().catch(console.error);
