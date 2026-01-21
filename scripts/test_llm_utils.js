const { generateAndValidate } = require('./llm_utils');

async function testValidation() {
  console.log('🧪 Testing LLM Validation & Self-Correction...');

  const systemPrompt = `
  You are a JSON generator.
  Output a JSON object with a 'cost' field.
  The 'cost' field MUST have a 'genki' number property.
  Example: { "cost": { "genki": 10 }, "logic_chain": [] }
  `;

  // 故意诱导错误的 Prompt (第一次可能不给 logic_chain)
  const userPrompt = `Generate a cost object for 5 genki. Do NOT output logic_chain yet (I know this is wrong, just testing validation).`;

  const result = await generateAndValidate(systemPrompt, userPrompt);

  if (result.success) {
    console.log('✅ Test Passed! Final Result:', JSON.stringify(result.data, null, 2));
  } else {
    console.error('❌ Test Failed:', result.error);
  }
}

testValidation();
