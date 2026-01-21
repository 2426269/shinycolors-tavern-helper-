import * as https from 'https';
import { validateEngineData } from '../src/偶像大师闪耀色彩-重构/战斗/引擎-NG/engineDataSchema';

// ============ 配置 ============
const CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || 'gg-gcli-6MVWNwwsNxnJNTPF2-eZFCnSDHWdXQ_e-OBVgtWPM4g', // Fallback for testing
  baseUrl: 'https://gcli.ggchan.dev/v1/chat/completions',
  model: 'gemini-3-flash-preview',
  maxRetries: 3,
};

// ============ 类型定义 ============
interface LLMResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// ============ 工具函数 ============

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 发送 LLM 请求 (包含指数退避重试)
 */
async function postRequest(payload: any, retryCount = 0): Promise<LLMResponse> {
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
      timeout: 60000, // 60s 超时
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonResponse = JSON.parse(data);
            resolve(jsonResponse);
          } catch (e: any) {
            reject(new Error(`API Response JSON Parse Error: ${e.message}`));
          }
        } else {
          // 遇到 429 或 5xx 错误尝试重试
          if ((res.statusCode === 429 || (res.statusCode && res.statusCode >= 500)) && retryCount < CONFIG.maxRetries) {
            console.log(`⚠️ API Error ${res.statusCode}. Retrying (${retryCount + 1}/${CONFIG.maxRetries})...`);
            setTimeout(
              () => {
                postRequest(payload, retryCount + 1)
                  .then(resolve)
                  .catch(reject);
              },
              2000 * Math.pow(2, retryCount),
            ); // 指数退避
          } else {
            reject(new Error(`API Error: ${res.statusCode} - ${data}`));
          }
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

/**
 * 调用 LLM 并获取 JSON 结果
 */
export async function callLLM(messages: any[], temperature = 0.1): Promise<any> {
  const payload = {
    model: CONFIG.model,
    messages: messages,
    max_tokens: 4000,
    temperature: temperature,
    response_format: { type: 'json_object' }, // 强制 JSON
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

/**
 * 验证并自动修复 (Self-Correction Loop)
 * @param systemPrompt 系统提示词
 * @param userPrompt 用户提示词
 * @param maxFixRetries 最大修复尝试次数
 */
export async function generateAndValidate(
  systemPrompt: string,
  userPrompt: string,
  maxFixRetries = 2,
): Promise<{ success: boolean; data?: any; error?: string }> {
  let messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  for (let i = 0; i <= maxFixRetries; i++) {
    try {
      if (i > 0) console.log(`🔄 Attempting fix (${i}/${maxFixRetries})...`);

      const result = await callLLM(messages);

      // 提取 engine_data (如果 LLM 返回了包裹结构)
      const engineData = result.engine_data || result;

      // Zod 校验
      const validation = validateEngineData(engineData);

      if (validation.success) {
        return { success: true, data: engineData };
      } else {
        const errorMsg = JSON.stringify(validation.errors, null, 2);
        console.warn(`❌ Validation Failed: ${errorMsg}`);

        // 将错误反馈给 LLM
        messages.push({ role: 'assistant', content: JSON.stringify(result) });
        messages.push({
          role: 'user',
          content: `JSON Validation Failed. Please fix the following errors and return the corrected JSON:\n${errorMsg}`,
        });
      }
    } catch (e: any) {
      console.error(`❌ LLM Call Failed: ${e.message}`);
      // 网络错误等通常不值得让 LLM 修复，直接抛出或重试
      if (i === maxFixRetries) return { success: false, error: e.message };
    }
  }

  return { success: false, error: 'Exceeded max fix retries' };
}
