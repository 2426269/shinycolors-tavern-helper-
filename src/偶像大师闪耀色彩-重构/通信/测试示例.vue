<template>
  <div class="communication-test">
    <h1>🧪 通信系统测试</h1>

    <!-- 状态信息 -->
    <div class="status-panel">
      <h2>📊 系统状态</h2>
      <div class="status-item">
        <span>消息总数:</span>
        <strong>{{ messageStats.total }}</strong>
      </div>
      <div class="status-item">
        <span>用户消息:</span>
        <strong>{{ messageStats.user }}</strong>
      </div>
      <div class="status-item">
        <span>AI消息:</span>
        <strong>{{ messageStats.assistant }}</strong>
      </div>
      <div class="status-item">
        <span>系统消息:</span>
        <strong>{{ messageStats.system }}</strong>
      </div>
      <div class="status-item">
        <span>加载状态:</span>
        <strong :class="{ loading: isLoading }">{{ isLoading ? '⏳ 生成中...' : '✅ 就绪' }}</strong>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="message-panel">
      <h2>💬 消息列表</h2>
      <div ref="containerRef" class="messages">
        <div
          v-for="message in messages"
          :key="message.message_id || message.time"
          class="message"
          :class="`message-${message.role}`"
        >
          <div class="message-header">
            <span class="sender">{{ message.sender }}</span>
            <span class="time">{{ message.time }}</span>
          </div>
          <div
            class="message-body"
            v-html="formatMessage(message.content, { enableRewardParsing: true, enableEmotionParsing: true })"
          ></div>

          <!-- 元数据显示 -->
          <div v-if="message.metadata" class="metadata">
            <div v-if="message.metadata.rewards" class="rewards">
              <span v-if="message.metadata.rewards.stamina">💪 体力 +{{ message.metadata.rewards.stamina }}</span>
              <span v-if="message.metadata.rewards.love">❤️ 好感度 +{{ message.metadata.rewards.love }}</span>
              <span v-if="message.metadata.rewards.vo">🎤 Vocal +{{ message.metadata.rewards.vo }}</span>
              <span v-if="message.metadata.rewards.da">💃 Dance +{{ message.metadata.rewards.da }}</span>
              <span v-if="message.metadata.rewards.vi">✨ Visual +{{ message.metadata.rewards.vi }}</span>
              <span v-if="message.metadata.rewards.gems">💎 羽石 +{{ message.metadata.rewards.gems }}</span>
              <span v-if="message.metadata.rewards.fans">👥 粉丝 +{{ message.metadata.rewards.fans }}</span>
            </div>
            <div v-if="message.metadata.emotion" class="emotion">😊 表情: {{ message.metadata.emotion }}</div>
            <div v-if="message.metadata.background" class="background">🖼️ 背景: {{ message.metadata.background }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-panel">
      <h2>✏️ 发送消息</h2>
      <div class="input-group">
        <select v-model="selectedScene" class="scene-select">
          <option value="normal">普通对话</option>
          <option value="training">训练场景</option>
          <option value="activity">自由活动</option>
          <option value="battle">战斗场景</option>
          <option value="ending">结局场景</option>
        </select>
        <label>
          <input v-model="enableStream" type="checkbox" />
          启用流式传输
        </label>
      </div>
      <textarea v-model="currentMessage" placeholder="输入消息..." @keydown.ctrl.enter="handleSendMessage"></textarea>
      <button @click="handleSendMessage" :disabled="isLoading || !currentMessage.trim()">
        {{ isLoading ? '⏳ 发送中...' : '📤 发送 (Ctrl+Enter)' }}
      </button>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <h2>🎮 控制面板</h2>
      <div class="button-group">
        <button @click="handleClearMessages">🗑️ 清空消息</button>
        <button @click="handleExportTxt">📄 导出TXT</button>
        <button @click="handleExportJson">📋 导出JSON</button>
        <button @click="handleLoadHistory">📚 加载历史</button>
      </div>
      <div class="button-group">
        <button @click="addSystemMessage('系统消息测试')">➕ 添加系统消息</button>
        <button @click="addUserMessage('用户消息测试')">➕ 添加用户消息</button>
        <button @click="addAIMessage('AI消息测试')">➕ 添加AI消息</button>
      </div>
      <div class="button-group">
        <button @click="testRewardMessage">🎁 测试奖励消息</button>
        <button @click="testEmotionMessage">😊 测试表情消息</button>
        <button @click="testBackgroundMessage">🖼️ 测试背景消息</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SceneType } from './消息类型';
import { useMessageChat } from './消息聊天';

// 使用消息聊天功能
const {
  messages,
  currentMessage,
  isLoading,
  containerRef,
  sendMessage,
  clearMessages,
  formatMessage,
  exportMessages,
  loadHistoryMessages,
  addSystemMessage,
  addUserMessage,
  addAIMessage,
  getMessageCount,
} = useMessageChat({
  autoLoadHistory: false, // 手动加载历史
});

// 场景选择
const selectedScene = ref<SceneType>('normal');
const enableStream = ref(false);

// 消息统计
const messageStats = computed(() => getMessageCount());

// 发送消息
const handleSendMessage = async () => {
  await sendMessage({
    scene: selectedScene.value,
    enableStream: enableStream.value,
    onStreamUpdate: text => {
      console.log('🌊 流式更新:', text);
    },
    onSuccess: response => {
      console.log('✅ 发送成功:', response);
    },
    onError: error => {
      console.error('❌ 发送失败:', error);
    },
  });
};

// 清空消息
const handleClearMessages = () => {
  if (confirm('确定要清空所有消息吗？')) {
    clearMessages();
  }
};

// 导出TXT
const handleExportTxt = () => {
  exportMessages({
    format: 'txt',
    filename: 'idolmaster_chat',
  });
};

// 导出JSON
const handleExportJson = () => {
  exportMessages({
    format: 'json',
    filename: 'idolmaster_chat_data',
    includeMetadata: true,
  });
};

// 加载历史
const handleLoadHistory = async () => {
  await loadHistoryMessages({
    messageRange: '0-{{lastMessageId}}',
  });
};

// 测试奖励消息
const testRewardMessage = () => {
  addAIMessage('训练完成！<reward>{"stamina": 5, "love": 2, "vo": 10, "da": 5, "vi": 3}</reward>你的努力得到了回报！');
};

// 测试表情消息
const testEmotionMessage = () => {
  addAIMessage('太好了！<emotion>happy</emotion>我们一起加油吧！');
};

// 测试背景消息
const testBackgroundMessage = () => {
  addAIMessage('我们来到了海滩...<background>beach</background><location>海滩</location>海风轻拂，阳光明媚。');
};
</script>

<style scoped lang="scss">
.communication-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;

  h1 {
    text-align: center;
    color: #ff69b4;
    margin-bottom: 30px;
  }

  h2 {
    font-size: 18px;
    color: #333;
    margin-bottom: 15px;
    border-bottom: 2px solid #ff69b4;
    padding-bottom: 5px;
  }
}

.status-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 20px;

  .status-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 14px;

    strong {
      font-size: 16px;

      &.loading {
        color: #ffd700;
        animation: pulse 1s infinite;
      }
    }
  }
}

.message-panel {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  .messages {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    padding: 15px;

    .message {
      margin-bottom: 15px;
      padding: 10px;
      border-radius: 8px;

      &.message-user {
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
      }

      &.message-assistant {
        background: #f3e5f5;
        border-left: 4px solid #9c27b0;
      }

      &.message-system {
        background: #fff3e0;
        border-left: 4px solid #ff9800;
      }

      .message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 12px;

        .sender {
          font-weight: bold;
          color: #333;
        }

        .time {
          color: #999;
        }
      }

      .message-body {
        font-size: 14px;
        line-height: 1.6;
        color: #333;
      }

      .metadata {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);

        .rewards {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;

          span {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
          }
        }

        .emotion,
        .background {
          margin-top: 5px;
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
}

.input-panel {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  .input-group {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    align-items: center;

    .scene-select {
      flex: 1;
      padding: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      font-size: 14px;
    }

    label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 14px;
      color: #666;
    }
  }

  textarea {
    width: 100%;
    min-height: 100px;
    padding: 10px;
    border: 1px solid #e0e0e0;
    border-radius: 5px;
    font-size: 14px;
    resize: vertical;
    margin-bottom: 10px;

    &:focus {
      outline: none;
      border-color: #ff69b4;
    }
  }

  button {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.control-panel {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  .button-group {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    flex-wrap: wrap;

    &:last-child {
      margin-bottom: 0;
    }

    button {
      flex: 1;
      padding: 10px 15px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
