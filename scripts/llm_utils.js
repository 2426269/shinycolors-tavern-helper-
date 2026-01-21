/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable import-x/no-nodejs-modules */
const https = require('https');
const { z } = require('zod');

// ============ Schema Definition (Copied from engineDataSchema.ts) ============

const JsonLogicExpr = z.any();

const AtomicActionBaseSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('GAIN_SCORE'),
    value: z.number().optional(),
    value_expression: JsonLogicExpr.optional(),
    multiplier_expression: JsonLogicExpr.optional(),
  }),
  z.object({
    action: z.literal('MODIFY_GENKI'),
    value: z.number().optional(),
    value_expression: JsonLogicExpr.optional(),
    multiplier_expression: JsonLogicExpr.optional(),
  }),
  z.object({
    action: z.literal('MODIFY_STAMINA'),
    value: z.number().optional(),
    value_expression: JsonLogicExpr.optional(),
    multiplier_expression: JsonLogicExpr.optional(),
  }),
  z.object({
    action: z.literal('ADD_BUFF'),
    buff_id: z.string(),
    value: z.number().optional(),
    turns: z.number().optional(),
    decay_per_turn: z.number().optional(),
  }),
  z.object({ action: z.literal('REMOVE_BUFF'), buff_id: z.string(), stacks: z.number().optional() }),
  z.object({ action: z.literal('ADD_TAG'), tag: z.string(), turns: z.number().optional() }),
  z.object({ action: z.literal('REMOVE_TAG'), tag: z.string() }),
  z.object({ action: z.literal('DRAW_CARD'), count: z.number() }),
  z.object({ action: z.literal('MODIFY_PLAY_LIMIT'), value: z.number() }),
  z.object({ action: z.literal('MODIFY_TURN_COUNT'), value: z.number() }),
  z.object({
    action: z.literal('PLAY_CARD_FROM_ZONE'),
    zone: z.string(),
    free: z.boolean().optional(),
    selector: z.any().optional(),
    filter: z.any().optional(),
  }),
  z.object({
    action: z.literal('MOVE_CARD_TO_ZONE'),
    from_zone: z.string().optional(),
    from_zones: z.array(z.string()).optional(),
    to_zone: z.string(),
    selector: z.any().optional(),
    filter: z.any().optional(),
  }),
  z.object({ action: z.literal('EXHAUST_CARD'), card_id: z.string().optional() }),
  z.object({
    action: z.literal('PLAY_RANDOM_CARDS'),
    count: z.number(),
    from_zone: z.string().optional(),
    selector: z.any().optional(),
    filter: z.object({ rarity: z.array(z.string()).optional(), type: z.array(z.string()).optional() }).optional(),
    free: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('MODIFY_ALL_CARDS'),
    target_zone: z.string().optional(),
    modifier: z.object({ stat: z.string(), value: z.number() }),
  }),
  z.object({ action: z.literal('MODIFY_BUFF_MULTIPLIER'), buff_id: z.string(), multiplier: z.number() }),
  z.object({ action: z.literal('ENSURE_BUFF_TURNS'), buff_id: z.string(), turns: z.number() }),
  z.object({ action: z.literal('MODIFY_BUFF_EFFECT_MULTIPLIER'), buff_id: z.string(), multiplier: z.number() }),
]);

const AtomicActionSchema = z.lazy(() =>
  z.union([
    AtomicActionBaseSchema,
    z.object({
      action: z.literal('REGISTER_HOOK'),
      hook_def: z
        .object({
          id: z.string(),
          name: z.string().optional(),
          trigger: z.string(),
          duration_turns: z.number().optional(),
          max_triggers: z.number().optional(),
          condition: JsonLogicExpr.optional(),
          actions: z.array(AtomicActionSchema),
        })
        .optional(),
      hook: z.any().optional(),
    }),
  ]),
);

const AtomicStepSchema = z
  .object({
    when: JsonLogicExpr.optional(),
    do: z.array(AtomicActionSchema),
  })
  .passthrough();

const EngineDataSchema = z
  .object({
    cost: z.object({ genki: z.number() }).passthrough(),
    constraints: z.object({ exhaust_on_play: z.boolean().optional() }).passthrough().optional(),
    logic_chain: z.array(AtomicStepSchema),
    logic_chain_enhanced: z.array(AtomicStepSchema).optional(),
  })
  .passthrough();

function validateEngineData(data) {
  const result = EngineDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// Hook 触发器白名单
const VALID_TRIGGERS = [
  'ON_LESSON_START',
  'ON_TURN_START',
  'ON_BEFORE_CARD_PLAY',
  'ON_AFTER_CARD_PLAY',
  'ON_BEFORE_SCORE_CALC',
  'ON_AFTER_SCORE_CALC',
  'ON_TURN_END',
  'ON_LESSON_END',
  'ON_TURN_SKIP',
  'ON_STATE_SWITCH',
  'ON_CARD_DRAW',
];

/**
 * 语义校验：检查常见错误
 */
function semanticValidate(data) {
  const errors = [];

  // 1. logic_chain 不能为空
  if (!data.logic_chain || data.logic_chain.length === 0) {
    errors.push('logic_chain 不能为空数组');
  }

  // 递归检查 logic_chain
  function checkLogicChain(chain, path) {
    if (!Array.isArray(chain)) return;
    chain.forEach((step, i) => {
      const stepPath = `${path}[${i}]`;

      // 3. 检查逻辑链步骤中误用 condition
      if (step.condition !== undefined) {
        errors.push(`${stepPath}.condition 不允许，逻辑链步骤应使用 when`);
      }

      // 4. step.do 不能为空
      if (!step.do || step.do.length === 0) {
        errors.push(`${stepPath}.do 不能为空`);
      }

      // 检查 actions
      if (step.do) {
        step.do.forEach((action, j) => {
          // 5. REGISTER_HOOK 必须带 hook_def
          if (action.action === 'REGISTER_HOOK') {
            if (!action.hook_def) {
              errors.push(`${stepPath}.do[${j}] REGISTER_HOOK 必须包含 hook_def`);
              return;
            }

            const hookPath = `${stepPath}.do[${j}].hook_def`;
            const hd = action.hook_def;

            // 6. 检查 hook 缺 id/name
            if (!hd.id) {
              errors.push(`${hookPath}.id 缺失`);
            }
            if (!hd.name) {
              errors.push(`${hookPath}.name 缺失`);
            }

            // 7. trigger 必须在白名单
            if (!VALID_TRIGGERS.includes(hd.trigger)) {
              errors.push(`${hookPath}.trigger "${hd.trigger}" 无效，必须是: ${VALID_TRIGGERS.join(', ')}`);
            }

            // 8. 检查 context.state
            const hookStr = JSON.stringify(hd);
            if (hookStr.includes('context.state')) {
              errors.push(`${hookPath} 使用了 context.state，应使用 new_state`);
            }

            // 9. ON_STATE_SWITCH 必须包含 new_state
            if (hd.trigger === 'ON_STATE_SWITCH' && hd.condition) {
              if (!hookStr.includes('new_state')) {
                errors.push(`${hookPath} trigger=ON_STATE_SWITCH 但 condition 中未使用 new_state`);
              }
            }
          }
        });
      }
    });
  }

  checkLogicChain(data.logic_chain, 'logic_chain');
  checkLogicChain(data.logic_chain_enhanced, 'logic_chain_enhanced');

  if (errors.length > 0) {
    return { success: false, errors };
  }
  return { success: true };
}

// ============ Config ============
const CONFIG = {
  apiKey: process.env.GEMINI_API_KEY,
  baseUrl: 'https://gcli.ggchan.dev/v1/chat/completions',
  model: 'gemini-3-flash-preview',
  maxRetries: 3,
};

if (!CONFIG.apiKey) {
  console.error('❌ 错误: 请设置环境变量 GEMINI_API_KEY');
  process.exit(1);
}

// ============ Utils ============

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function postRequest(payload, retryCount = 0) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.baseUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CONFIG.apiKey}`,
      },
      timeout: 60000,
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonResponse = JSON.parse(data);
            resolve(jsonResponse);
          } catch (e) {
            reject(new Error(`API Response JSON Parse Error: ${e.message}`));
          }
        } else if (
          (res.statusCode === 429 || (res.statusCode && res.statusCode >= 500)) &&
          retryCount < CONFIG.maxRetries
        ) {
          console.log(`⚠️ API Error ${res.statusCode}. Retrying (${retryCount + 1}/${CONFIG.maxRetries})...`);
          setTimeout(
            () => {
              postRequest(payload, retryCount + 1)
                .then(resolve)
                .catch(reject);
            },
            2000 * Math.pow(2, retryCount),
          );
        } else {
          reject(new Error(`API Error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', e => {
      if (retryCount < CONFIG.maxRetries) {
        console.log(`⚠️ Network Error. Retrying (${retryCount + 1}/${CONFIG.maxRetries})...`);
        setTimeout(
          () => {
            postRequest(payload, retryCount + 1)
              .then(resolve)
              .catch(reject);
          },
          2000 * Math.pow(2, retryCount),
        );
      } else {
        reject(e);
      }
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function callLLM(messages, temperature = 0.1) {
  const payload = {
    model: CONFIG.model,
    messages: messages,
    max_tokens: 20000,
    temperature: temperature,
    response_format: { type: 'json_object' },
  };

  const response = await postRequest(payload);

  if (!response.choices || !response.choices[0] || !response.choices[0].message) {
    throw new Error('Invalid API response structure');
  }

  const content = response.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Failed to parse LLM response as JSON: ${content}`);
  }
}

async function generateAndValidate(systemPrompt, userPrompt, maxFixRetries = 3) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let lastError = null;

  for (let i = 0; i <= maxFixRetries; i++) {
    try {
      if (i > 0) console.log(`🔄 Attempting fix (${i}/${maxFixRetries})...`);

      const result = await callLLM(messages);
      const engineData = result.engine_data || result;

      // 1. 结构校验 (Zod)
      const structValidation = validateEngineData(engineData);
      if (!structValidation.success) {
        const errorMsg = JSON.stringify(structValidation.errors, null, 2);
        lastError = `结构校验失败: ${errorMsg}`;
        console.warn(`❌ Structure Validation Failed: ${errorMsg}`);
        messages.push({ role: 'assistant', content: JSON.stringify(result) });
        messages.push({
          role: 'user',
          content: `结构校验失败，请修复以下错误并返回正确的 JSON:\n${errorMsg}`,
        });
        continue;
      }

      // 2. 语义校验
      const semanticResult = semanticValidate(engineData);
      if (!semanticResult.success) {
        const errorMsg = semanticResult.errors.join('\n');
        lastError = `语义校验失败: ${errorMsg}`;
        console.warn(`❌ Semantic Validation Failed:\n${errorMsg}`);
        messages.push({ role: 'assistant', content: JSON.stringify(result) });
        messages.push({
          role: 'user',
          content: `语义校验失败，请修复以下错误并返回正确的 JSON:\n${errorMsg}`,
        });
        continue;
      }

      // 3. 检查 _uncertain 标记
      if (result._uncertain) {
        console.warn('⚠️ AI 标记此卡为不确定，需人工审核');
        return { success: true, data: result, needsReview: true };
      }

      return { success: true, data: result };
    } catch (e) {
      lastError = e.message;
      console.error(`❌ LLM Call Failed: ${e.message}`);
      if (i === maxFixRetries) return { success: false, error: e.message };
    }
  }

  return { success: false, error: `Exceeded max fix retries. Last error: ${lastError}` };
}

module.exports = { generateAndValidate, callLLM, validateEngineData, semanticValidate };
