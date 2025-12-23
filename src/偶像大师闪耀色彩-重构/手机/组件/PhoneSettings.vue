<template>
  <div class="phone-settings">
    <!-- 标题栏 -->
    <div class="settings-header">
      <button class="back-btn" @click="$emit('close')">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>
      <span class="header-title">设置</span>
      <button class="save-btn" @click="saveSettings">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      </button>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <!-- API 选择 -->
      <div class="setting-section">
        <h3 class="section-title">🤖 AI API 设置</h3>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.useCustomApi" type="radio" :value="false" class="radio-input" />
            <span class="radio-label">使用主 API（酒馆默认）</span>
          </label>
          <p class="setting-hint">使用 SillyTavern 当前配置的 API</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input v-model="settings.useCustomApi" type="radio" :value="true" class="radio-input" />
            <span class="radio-label">使用自定义 API</span>
          </label>
          <p class="setting-hint">填写独立的 API 地址和密钥</p>
        </div>
      </div>

      <!-- 自定义 API 配置 -->
      <Transition name="slide-down">
        <div v-if="settings.useCustomApi" class="setting-section custom-api-section">
          <h3 class="section-title">⚙️ 自定义 API 配置</h3>

          <div class="input-group">
            <label class="input-label">API 地址 *</label>
            <input
              v-model="settings.customApi.apiurl"
              type="url"
              placeholder="https://api.openai.com/v1"
              class="text-input"
            />
          </div>

          <div class="input-group">
            <label class="input-label">API Key</label>
            <input v-model="settings.customApi.key" type="password" placeholder="sk-..." class="text-input" />
          </div>

          <div class="input-group">
            <label class="input-label">模型 *</label>
            <div class="model-select-row">
              <select v-model="settings.customApi.model" class="select-input" :disabled="isLoadingModels">
                <option value="" disabled>请选择模型</option>
                <option v-for="model in modelList" :key="model" :value="model">{{ model }}</option>
              </select>
              <button
                type="button"
                class="refresh-btn"
                :disabled="isLoadingModels"
                title="刷新模型列表"
                @click="fetchModels"
              >
                <svg v-if="!isLoadingModels" viewBox="0 0 24 24" width="18" height="18">
                  <path
                    fill="currentColor"
                    d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
                  />
                </svg>
                <span v-else class="loading-spinner"></span>
              </button>
            </div>
            <p v-if="settings.customApi.model" class="selected-model">已选择: {{ settings.customApi.model }}</p>
            <p v-if="modelError" class="model-error">{{ modelError }}</p>
          </div>

          <div class="input-row">
            <div class="input-group half">
              <label class="input-label">最大 Tokens</label>
              <input
                v-model.number="settings.customApi.max_tokens"
                type="number"
                placeholder="1000"
                class="text-input"
              />
            </div>
            <div class="input-group half">
              <label class="input-label">温度</label>
              <input
                v-model.number="settings.customApi.temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                placeholder="0.8"
                class="text-input"
              />
            </div>
          </div>

          <!-- 验证状态 -->
          <div v-if="validationError" class="validation-error">
            <span class="error-icon">⚠️</span>
            <span>{{ validationError }}</span>
          </div>
        </div>
      </Transition>

      <!-- 提示信息 -->
      <div class="info-section">
        <p class="info-text">💡 手机应用（Chain、Twesta、电话）将使用选定的 API 生成对话内容。</p>
      </div>

      <!-- 偶像主动消息设置 -->
      <div class="setting-section">
        <h3 class="section-title">💬 偶像主动消息</h3>

        <div class="setting-item">
          <label class="toggle-label">
            <span class="toggle-text">启用偶像主动发消息</span>
            <input v-model="settings.proactive.enabled" type="checkbox" class="toggle-input" />
            <span class="toggle-switch"></span>
          </label>
          <p class="setting-hint">偶像和群组成员会主动给你发消息</p>
        </div>

        <Transition name="slide-down">
          <div v-if="settings.proactive.enabled" class="proactive-options">
            <div class="input-row">
              <div class="input-group half">
                <label class="input-label">频率（分钟）</label>
                <input
                  v-model.number="settings.proactive.intervalMinutes"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="10"
                  class="text-input"
                />
              </div>
              <div class="input-group half">
                <label class="input-label">概率（%）</label>
                <input
                  v-model.number="settings.proactive.probability"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="40"
                  class="text-input"
                />
              </div>
            </div>

            <div class="setting-item">
              <label class="toggle-label">
                <span class="toggle-text">深夜降低概率</span>
                <input v-model="settings.proactive.nightModeEnabled" type="checkbox" class="toggle-input" />
                <span class="toggle-switch"></span>
              </label>
              <p class="setting-hint">0:00-7:00 期间降低发消息概率</p>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Twesta 设置 -->
      <div class="setting-section">
        <h3 class="section-title">📱 Twesta 推文设置</h3>

        <div class="setting-item">
          <label class="toggle-label">
            <span class="toggle-text">启用偶像自动发推</span>
            <input v-model="settings.twesta.enabled" type="checkbox" class="toggle-input" />
            <span class="toggle-switch"></span>
          </label>
          <p class="setting-hint">偶像会定期在 Twesta 上发布推文</p>
        </div>

        <Transition name="slide-down">
          <div v-if="settings.twesta.enabled" class="twesta-options">
            <div class="input-row">
              <div class="input-group half">
                <label class="input-label">发推频率（分钟）</label>
                <input
                  v-model.number="settings.twesta.intervalMinutes"
                  type="number"
                  min="5"
                  max="120"
                  class="text-input"
                />
              </div>
              <div class="input-group half">
                <label class="input-label">发推概率（%）</label>
                <input
                  v-model.number="settings.twesta.probability"
                  type="number"
                  min="10"
                  max="100"
                  class="text-input"
                />
              </div>
            </div>

            <div class="input-row">
              <div class="input-group half">
                <label class="input-label">配图概率（%）</label>
                <input
                  v-model.number="settings.twesta.imageProbability"
                  type="number"
                  min="0"
                  max="100"
                  class="text-input"
                />
                <p class="setting-hint">⚠️ 仅主API支持看图说话，自定义API无法识图</p>
              </div>
              <div class="input-group half">
                <label class="input-label">评论数量</label>
                <input
                  v-model.number="settings.twesta.commentCount"
                  type="number"
                  min="0"
                  max="10"
                  class="text-input"
                />
              </div>
            </div>

            <div class="setting-item">
              <label class="toggle-label">
                <span class="toggle-text">深夜降低发推概率</span>
                <input v-model="settings.twesta.nightModeEnabled" type="checkbox" class="toggle-input" />
                <span class="toggle-switch"></span>
              </label>
              <p class="setting-hint">0:00-7:00 期间降低发推概率</p>
            </div>

            <div class="input-group">
              <label class="input-label">黑粉概率（%）</label>
              <input
                v-model.number="settings.twesta.antiFanProbability"
                type="number"
                min="0"
                max="100"
                placeholder="5"
                class="text-input"
              />
              <p class="setting-hint">每条推文触发黑粉评论的概率，默认 5%</p>
            </div>

            <div class="input-group">
              <label class="input-label">制作人显示名</label>
              <input
                v-model="settings.twesta.producerDisplayName"
                type="text"
                placeholder="制作人"
                class="text-input"
              />
              <p class="setting-hint">发推和评论时显示的名称</p>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 底部填充 -->
      <div class="bottom-padding"></div>
    </div>

    <!-- 固定保存按钮 -->
    <div class="save-footer">
      <button class="save-button" :disabled="!!validationError" @click="saveSettings">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        保存设置
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  loadPhoneApiSettings,
  savePhoneApiSettings,
  validateCustomApiConfig,
  type PhoneApiSettings,
} from '../数据/PhoneApiSettings';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'saved'): void;
}>();

// 设置数据
const settings = ref<PhoneApiSettings>(loadPhoneApiSettings());

// 模型列表相关
const modelList = ref<string[]>([]);
const isLoadingModels = ref(false);
const modelError = ref('');

// 验证错误
const validationError = computed(() => {
  if (!settings.value.useCustomApi) return '';
  const result = validateCustomApiConfig(settings.value.customApi);
  return result.valid ? '' : result.error;
});

// 获取模型列表
async function fetchModels() {
  const apiUrl = settings.value.customApi.apiurl;
  const apiKey = settings.value.customApi.key;

  if (!apiUrl) {
    modelError.value = '请先填写 API 地址';
    return;
  }

  isLoadingModels.value = true;
  modelError.value = '';

  try {
    // 构建模型列表 URL
    let modelsUrl = apiUrl.replace(/\/+$/, '');
    if (!modelsUrl.endsWith('/models')) {
      modelsUrl += '/models';
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(modelsUrl, { headers });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // OpenAI 兼容格式
    if (data.data && Array.isArray(data.data)) {
      modelList.value = data.data.map((m: { id?: string; name?: string }) => m.id || m.name || '').filter(Boolean);
    } else if (Array.isArray(data)) {
      modelList.value = data
        .map((m: string | { id?: string; name?: string }) => (typeof m === 'string' ? m : m.id || m.name || ''))
        .filter(Boolean);
    } else {
      modelList.value = [];
    }

    // 排序
    modelList.value.sort();

    if (modelList.value.length === 0) {
      modelError.value = '未找到可用模型';
    }
  } catch (err) {
    console.error('[Phone] Failed to fetch models:', err);
    modelError.value = `获取失败: ${err instanceof Error ? err.message : '未知错误'}`;
    modelList.value = [];
  } finally {
    isLoadingModels.value = false;
  }
}

// 保存设置
function saveSettings() {
  if (settings.value.useCustomApi) {
    const validation = validateCustomApiConfig(settings.value.customApi);
    if (!validation.valid) {
      return;
    }
  }
  savePhoneApiSettings(settings.value);

  // 通知全局调度器重启（读取新设置）
  window.dispatchEvent(new CustomEvent('proactive-settings-changed'));
  console.log('[PhoneSettings] 设置已保存，通知调度器重启');

  emit('saved');
  emit('close');
}

// 加载设置
onMounted(() => {
  settings.value = loadPhoneApiSettings();
});
</script>

<style scoped lang="scss">
.phone-settings {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f7;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  overflow: hidden;
}

.settings-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  min-height: 60px;
}

.back-btn,
.save-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.header-title {
  flex: 1;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.setting-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.setting-item {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.radio-input {
  width: 20px;
  height: 20px;
  accent-color: #667eea;
}

.radio-label {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.setting-hint {
  margin-top: 4px;
  margin-left: 32px;
  font-size: 13px;
  color: #888;
}

.custom-api-section {
  border: 2px solid #667eea;
}

.input-group {
  margin-bottom: 16px;

  &.half {
    flex: 1;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
}

.text-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  color: #333;
  background: #fafafa;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #aaa;
  }
}

/* 模型选择行 */
.model-select-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.select-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 15px;
  color: #333;
  background: #fafafa;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;

  &:focus {
    outline: none;
    border-color: #667eea;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.refresh-btn {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #667eea;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: #5a6fd6;
    transform: scale(1.02);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.selected-model {
  margin-top: 8px;
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
}

.model-error {
  margin-top: 8px;
  font-size: 13px;
  color: #dc2626;
}

.validation-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 10px;
  margin-top: 16px;

  .error-icon {
    font-size: 16px;
  }

  span {
    font-size: 14px;
    color: #dc2626;
  }
}

.info-section {
  padding: 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border-radius: 12px;
}

.info-text {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
}

/* 过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 底部填充 */
.bottom-padding {
  height: 80px;
}

/* 固定保存按钮 */
.save-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: linear-gradient(to top, white 60%, transparent);
}

.save-button {
  width: 100%;
  padding: 16px 24px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Toggle 开关样式 */
.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.toggle-text {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.toggle-input {
  display: none;
}

.toggle-switch {
  width: 52px;
  height: 28px;
  background: #ddd;
  border-radius: 14px;
  position: relative;
  transition: all 0.3s ease;

  &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

.toggle-input:checked + .toggle-switch {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &::after {
    transform: translateX(24px);
  }
}

/* 主动消息选项容器 */
.proactive-options {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}
</style>
