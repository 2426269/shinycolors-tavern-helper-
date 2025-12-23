<template>
  <div class="phone-app">
    <!-- 联系人列表视图 -->
    <Transition name="slide-left">
      <div v-if="currentView === 'list'" class="view-container list-view">
        <!-- 顶部标题栏 -->
        <div class="app-header">
          <button class="back-btn" @click="$emit('back')">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <span class="header-title">電話</span>
          <div class="header-spacer"></div>
        </div>

        <!-- 联系人列表 -->
        <div class="contact-list">
          <!-- 283Pro -->
          <div class="contact-item" @click="startCall('283pro', '283プロダクション', get283ProAvatarUrl())">
            <img :src="get283ProAvatarUrl()" alt="283pro" class="contact-avatar" />
            <span class="contact-name">283プロダクション</span>
            <span v-if="hasUnread['283pro']" class="unread-dot"></span>
          </div>

          <!-- 偶像列表 -->
          <div
            v-for="contact in contacts"
            :key="contact.id"
            class="contact-item"
            @click="startCall(contact.englishName, contact.chineseName, contact.avatarUrl)"
          >
            <img :src="contact.avatarUrl" :alt="contact.chineseName" class="contact-avatar" />
            <span class="contact-name">{{ contact.chineseName }}</span>
            <span v-if="contact.hasUnread" class="unread-dot"></span>
          </div>
        </div>

        <!-- 背景水印 -->
        <div class="bg-watermark">
          <svg viewBox="0 0 200 200" class="watermark-icon">
            <!-- 283pro logo简化版 -->
            <path
              d="M100 20 C60 20 30 60 30 100 C30 140 60 180 100 180 C140 180 170 140 170 100 C170 60 140 20 100 20 M100 40 C130 40 150 65 150 100 C150 135 130 160 100 160 C70 160 50 135 50 100 C50 65 70 40 100 40"
              fill="rgba(180, 220, 230, 0.3)"
            />
            <path
              d="M80 80 Q100 60 120 80 Q140 100 120 120 Q100 140 80 120 Q60 100 80 80"
              fill="rgba(180, 220, 230, 0.2)"
            />
            <!-- 皇冠装饰 -->
            <path d="M90 55 L100 45 L110 55 L105 50 L100 55 L95 50 Z" fill="rgba(180, 220, 230, 0.4)" />
          </svg>
        </div>
      </div>
    </Transition>

    <!-- 通话视图 -->
    <Transition name="slide-right">
      <div v-if="currentView === 'call'" class="view-container call-view">
        <!-- 蕾丝花纹背景 -->
        <div class="lace-bg"></div>

        <!-- 返回按钮 -->
        <button class="call-back-btn" @click="endCall">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <!-- 头像区域 -->
        <div class="call-avatar-area">
          <div class="avatar-glow"></div>
          <img :src="activeCall.avatar" :alt="activeCall.name" class="call-avatar" />
          <h2 class="call-name">{{ activeCall.name }}</h2>
        </div>

        <!-- 对话内容区域 -->
        <div class="call-content-area">
          <div class="call-messages">
            <div v-for="(msg, index) in activeCall.messages" :key="index" class="call-message">
              <p>{{ msg }}</p>
            </div>
            <div v-if="activeCall.messages.length === 0" class="call-message placeholder">
              <p>通話を開始...</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { get283ProAvatarUrl, getAllPhoneContacts, type PhoneContactData } from '../数据/PhoneAssets';

const emit = defineEmits<{
  (e: 'back'): void;
}>();

// ========== 类型定义 ==========
interface ActiveCallData {
  id: string;
  name: string;
  avatar: string;
  messages: string[];
}

// ========== 状态 ==========
const currentView = ref<'list' | 'call'>('list');
const contacts = ref<PhoneContactData[]>([]);
const hasUnread = ref<Record<string, boolean>>({});

const activeCall = ref<ActiveCallData>({
  id: '',
  name: '',
  avatar: '',
  messages: [],
});

// ========== 初始化 ==========
onMounted(() => {
  contacts.value = getAllPhoneContacts();
});

// ========== 方法 ==========
function startCall(id: string, name: string, avatar: string) {
  activeCall.value = {
    id,
    name,
    avatar,
    messages: [],
  };
  // 清除未读标记
  if (hasUnread.value[id]) {
    hasUnread.value[id] = false;
  }
  const contact = contacts.value.find(c => c.englishName === id);
  if (contact) {
    contact.hasUnread = false;
  }
  currentView.value = 'call';
}

function endCall() {
  currentView.value = 'list';
  activeCall.value = {
    id: '',
    name: '',
    avatar: '',
    messages: [],
  };
}

// ========== 外部接口 ==========
/**
 * 添加通话消息
 */
function addCallMessage(message: string) {
  activeCall.value.messages.push(message);
}

/**
 * 设置通话消息列表
 */
function setCallMessages(messages: string[]) {
  activeCall.value.messages = messages;
}

/**
 * 设置指定联系人的未读状态
 */
function setUnread(idolEnglishName: string, unread: boolean) {
  hasUnread.value[idolEnglishName] = unread;
  const contact = contacts.value.find(c => c.englishName === idolEnglishName);
  if (contact) {
    contact.hasUnread = unread;
  }
}

/**
 * 清空所有未读
 */
function clearAllUnread() {
  hasUnread.value = {};
  contacts.value.forEach(c => (c.hasUnread = false));
}

/**
 * 直接呼叫指定偶像
 */
function callIdol(idolEnglishName: string) {
  const contact = contacts.value.find(c => c.englishName === idolEnglishName);
  if (contact) {
    startCall(contact.englishName, contact.chineseName, contact.avatarUrl);
  }
}

// 导出方法
defineExpose({
  addCallMessage,
  setCallMessages,
  setUnread,
  clearAllUnread,
  callIdol,
  activeCall,
  contacts,
});
</script>

<style scoped lang="scss">
.phone-app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  overflow: hidden;
  position: relative;
}

.view-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

/* ========== 列表视图 ========== */
.list-view {
  background: #fafafa;
}

.app-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #66c4d6 0%, #88d4e0 100%);
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  min-height: 60px;
}

.back-btn {
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

.header-spacer {
  width: 40px;
}

.contact-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;

  &:hover {
    background: rgba(0, 0, 0, 0.03);
  }

  &:active {
    background: rgba(0, 0, 0, 0.06);
  }
}

.contact-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.contact-name {
  flex: 1;
  margin-left: 16px;
  font-size: 17px;
  font-weight: 500;
  color: #333;
}

.unread-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff6b8a;
  box-shadow: 0 2px 4px rgba(255, 107, 138, 0.4);
}

/* 背景水印 */
.bg-watermark {
  position: absolute;
  top: 50%;
  right: 10%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.6;
}

.watermark-icon {
  width: 200px;
  height: 200px;
}

/* ========== 通话视图 ========== */
.call-view {
  background: linear-gradient(180deg, #e8d5e0 0%, #d5c0cc 50%, #c8b0bc 100%);
}

/* 蕾丝花纹背景 */
.lace-bg {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.6) 0%, transparent 30%),
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 60px,
      rgba(255, 255, 255, 0.15) 60px,
      rgba(255, 255, 255, 0.15) 62px
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 60px,
      rgba(255, 255, 255, 0.08) 60px,
      rgba(255, 255, 255, 0.08) 62px
    );
  /* 蕾丝圆形装饰 - 使用伪元素模拟 */
  &::before {
    content: '';
    position: absolute;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    height: 120px;
    background:
      radial-gradient(ellipse 30px 30px at 50% 50%, rgba(255, 255, 255, 0.3), transparent),
      radial-gradient(ellipse 20px 20px at 20% 50%, rgba(255, 255, 255, 0.2), transparent),
      radial-gradient(ellipse 20px 20px at 80% 50%, rgba(255, 255, 255, 0.2), transparent);
  }
}

.call-back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.05);
  }
}

.call-avatar-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding-top: 60px;
}

.avatar-glow {
  position: absolute;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%);
}

.call-avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.15),
    0 0 0 8px rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.call-name {
  margin-top: 20px;
  font-size: 24px;
  font-weight: 700;
  color: #4a3a42;
  text-shadow:
    1px 1px 0 rgba(255, 255, 255, 0.5),
    -1px -1px 0 rgba(255, 255, 255, 0.5);
  letter-spacing: 2px;
}

.call-content-area {
  background: rgba(255, 255, 255, 0.9);
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px 20px;
  min-height: 150px;
  max-height: 40%;
  overflow-y: auto;
}

.call-messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.call-message {
  p {
    font-size: 15px;
    line-height: 1.6;
    color: #333;
  }

  &.placeholder p {
    color: #999;
    font-style: italic;
  }
}

/* ========== 过渡动画 ========== */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
