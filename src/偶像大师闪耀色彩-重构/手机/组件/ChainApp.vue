<template>
  <div class="chain-app">
    <!-- 1. 列表视图 (List View) -->
    <Transition name="slide-left">
      <div v-if="currentView === 'list'" class="view-container list-view">
        <!-- Header -->
        <div class="app-header">
          <div class="header-top">
            <h1 class="app-title">Chain</h1>
            <div class="header-actions">
              <button class="icon-btn"><i class="fas fa-search"></i></button>
              <button class="icon-btn" @click="$emit('back')"><i class="fas fa-times"></i></button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tabs">
            <button
              v-for="tab in tabs"
              :key="tab"
              class="tab-btn"
              :class="{ active: activeTab === tab }"
              @click="activeTab = tab"
            >
              {{ tab }}
              <div v-if="activeTab === tab" class="tab-indicator"></div>
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="chat-list">
          <!-- 群组 Tab -->
          <template v-if="activeTab === '群组'">
            <!-- 创建群组按钮 -->
            <div class="create-group-btn" @click="showCreateGroup = true">
              <i class="fas fa-plus"></i>
              <span>创建群组</span>
            </div>

            <div v-if="groupList.length === 0" class="empty-state">
              <i class="fas fa-users"></i>
              <span>暂无群组</span>
            </div>

            <!-- 群组列表 -->
            <div v-for="group in groupList" :key="group.id" class="chat-item group-item" @click="enterGroupChat(group)">
              <!-- 群组头像拼接 -->
              <div class="group-avatar-container">
                <div class="group-avatars" :class="`avatars-${Math.min(getGroupAvatars(group).length, 4)}`">
                  <img v-for="(avatar, i) in getGroupAvatars(group)" :key="i" :src="avatar" class="group-avatar-img" />
                </div>
              </div>

              <!-- 群组信息 -->
              <div class="chat-content">
                <div class="chat-info-top">
                  <div class="name-row">
                    <h3 class="chat-name">{{ group.name }}</h3>
                    <span class="member-count">{{ group.memberIds.length }}人</span>
                  </div>
                  <span class="chat-time">{{ group.lastTime }}</span>
                </div>
                <p class="chat-preview">
                  <span v-if="group.lastSender" class="last-sender">{{ group.lastSender }}:</span>
                  {{ group.lastMsg || '暂无消息' }}
                </p>
              </div>

              <!-- 删除按钮 -->
              <button class="delete-group-btn" title="解散群组" @click.stop="deleteGroup(group.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </template>

          <!-- 其他 Tab（个人聊天） -->
          <template v-else>
            <div v-if="filteredChatList.length === 0" class="empty-state">
              <i class="fas fa-inbox"></i>
              <span>无消息</span>
            </div>

            <div v-for="chat in filteredChatList" :key="chat.id" class="chat-item" @click="enterChat(chat)">
              <!-- 头像 -->
              <div class="avatar-container">
                <img :src="chat.avatar" class="avatar-img" />
                <div v-if="chat.online" class="online-dot"></div>
              </div>

              <!-- 内容 -->
              <div class="chat-content">
                <div class="chat-info-top">
                  <div class="name-row">
                    <h3 class="chat-name">{{ chat.name }}</h3>
                    <i
                      :class="['favorite-icon', 'fas', chat.isFavorite ? 'fa-star' : 'fa-star-o']"
                      :title="chat.isFavorite ? '取消关注' : '特别关注'"
                      @click="toggleFavorite(chat.id, $event)"
                    ></i>
                  </div>
                  <span class="chat-time">{{ chat.lastTime }}</span>
                </div>
                <p class="chat-preview" :class="{ unread: chat.unread > 0 }">
                  {{ chat.lastMsg }}
                </p>
              </div>

              <!-- 未读气泡 -->
              <div v-if="chat.unread > 0" class="unread-badge">
                {{ chat.unread }}
              </div>
            </div>
          </template>

          <!-- 底部填充 -->
          <div class="list-padding"></div>
        </div>

        <!-- 创建群组弹窗 -->
        <Transition name="fade">
          <div v-if="showCreateGroup" class="modal-overlay" @click="showCreateGroup = false">
            <div class="modal-content create-group-modal" @click.stop>
              <h3 class="modal-title">创建群组</h3>

              <div class="form-group">
                <label>群组名称</label>
                <input v-model="newGroupName" type="text" placeholder="输入群组名称..." class="form-input" />
              </div>

              <div class="form-group">
                <label>选择成员 ({{ selectedMembers.length }}人)</label>
                <div class="member-grid">
                  <div
                    v-for="chat in chatList"
                    :key="chat.id"
                    class="member-option"
                    :class="{ selected: selectedMembers.includes(chat.id) }"
                    @click="toggleMemberSelection(chat.id)"
                  >
                    <img :src="chat.avatar" class="member-avatar" />
                    <span class="member-name">{{ chat.name }}</span>
                    <i v-if="selectedMembers.includes(chat.id)" class="fas fa-check check-icon"></i>
                  </div>
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn-cancel" @click="showCreateGroup = false">取消</button>
                <button
                  class="btn-confirm"
                  :disabled="!newGroupName.trim() || selectedMembers.length === 0"
                  @click="createGroup"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <!-- 群组设置弹窗 -->
        <Transition name="fade">
          <div v-if="showGroupSettings && activeGroup" class="modal-overlay" @click="showGroupSettings = false">
            <div class="modal-content group-settings-modal" @click.stop>
              <h3 class="modal-title">群组设置</h3>

              <!-- 群头像上传 -->
              <div class="form-group">
                <label>群组头像</label>
                <div class="avatar-upload-row">
                  <div class="current-avatar">
                    <template v-if="activeGroup.customAvatar">
                      <img :src="activeGroup.customAvatar" class="preview-avatar" />
                    </template>
                    <div v-else class="group-avatars avatars-4">
                      <img
                        v-for="(avatar, i) in getGroupAvatars(activeGroup).slice(0, 4)"
                        :key="i"
                        :src="avatar"
                        class="group-avatar-img"
                      />
                    </div>
                  </div>
                  <div class="upload-btns">
                    <label class="upload-btn">
                      <i class="fas fa-upload"></i> 上传图片
                      <input type="file" accept="image/*" hidden @change="handleAvatarUpload($event)" />
                    </label>
                    <button v-if="activeGroup.customAvatar" class="upload-btn reset" @click="resetGroupAvatar">
                      <i class="fas fa-undo"></i> 恢复默认
                    </button>
                  </div>
                </div>
              </div>

              <!-- 群背景上传 -->
              <div class="form-group">
                <label>聊天背景</label>
                <div class="bg-upload-row">
                  <div
                    class="bg-preview"
                    :style="activeGroup.customBg ? { backgroundImage: `url(${activeGroup.customBg})` } : {}"
                  >
                    <span v-if="!activeGroup.customBg">默认渐变</span>
                  </div>
                  <div class="upload-btns">
                    <label class="upload-btn">
                      <i class="fas fa-image"></i> 上传背景
                      <input type="file" accept="image/*" hidden @change="handleBgUpload($event)" />
                    </label>
                    <button v-if="activeGroup.customBg" class="upload-btn reset" @click="resetGroupBg">
                      <i class="fas fa-undo"></i> 恢复默认
                    </button>
                  </div>
                </div>
              </div>

              <!-- 群名编辑 -->
              <div class="form-group">
                <label>群组名称</label>
                <input v-model="editingGroupName" type="text" class="form-input" />
              </div>

              <!-- 成员管理 -->
              <div class="form-group">
                <label>群成员 ({{ activeGroup.memberIds.length }}人)</label>
                <div class="member-grid compact">
                  <div
                    v-for="chat in chatList"
                    :key="chat.id"
                    class="member-option"
                    :class="{ selected: activeGroup.memberIds.includes(chat.id) }"
                    @click="toggleGroupMember(chat.id)"
                  >
                    <img :src="chat.avatar" class="member-avatar" />
                    <span class="member-name">{{ chat.name }}</span>
                    <i v-if="activeGroup.memberIds.includes(chat.id)" class="fas fa-check check-icon"></i>
                  </div>
                </div>
              </div>

              <div class="modal-actions">
                <button class="btn-cancel" @click="showGroupSettings = false">取消</button>
                <button class="btn-confirm" @click="saveGroupSettings">保存</button>
              </div>

              <button class="delete-group-text-btn" @click="confirmDeleteGroup">
                <i class="fas fa-trash"></i> 解散群组
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- 2. 聊天详情视图 (Chat View) -->
    <Transition name="slide-right">
      <div v-if="currentView === 'chat'" class="view-container chat-view">
        <!-- Top Bar -->
        <div class="chat-header">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div class="chat-title-container">
            <h2 class="chat-title">{{ activeChat?.name }}</h2>
            <div v-if="activeChat?.online" class="online-status">
              <span class="status-dot"></span>
              <span class="status-text">Online</span>
            </div>
          </div>
          <button class="favorite-btn" :class="{ active: activeChat?.isFavorite }" @click="toggleFavorite()">
            <i :class="['fas', activeChat?.isFavorite ? 'fa-heart' : 'fa-heart']"></i>
          </button>
        </div>

        <!-- 聊天区域 -->
        <div class="chat-area">
          <!-- 背景 -->
          <div class="chat-bg">
            <img :src="config.bgImage" class="bg-img" />
            <div class="bg-overlay"></div>
          </div>

          <!-- 消息列表 -->
          <div ref="chatRef" class="messages-container">
            <div class="time-divider">
              <span>Today 10:23 AM</span>
            </div>

            <div v-for="(msg, index) in activeMessages" :key="index" class="message-row" :class="{ 'is-me': msg.isMe }">
              <!-- 对方头像 -->
              <div v-if="!msg.isMe" class="message-avatar">
                <img :src="activeChat?.avatar" />
              </div>

              <!-- 气泡主体 -->
              <div class="message-bubble-wrapper">
                <!-- 贴纸/图片单独显示（类似微信：图片是独立的消息） -->
                <div
                  v-if="msg.sticker || msg.image"
                  class="sticker-bubble"
                  :class="msg.isMe ? 'bubble-me' : 'bubble-other'"
                >
                  <img v-if="msg.sticker" :src="getStickerUrl(msg.sticker)" class="sticker-image" />
                  <img v-else-if="msg.image" :src="msg.image" class="message-image" />
                </div>
                <!-- 文字气泡（如果有文字才显示） -->
                <div
                  v-if="msg.text || editingMessageIndex === index"
                  class="message-bubble"
                  :class="msg.isMe ? 'bubble-me' : 'bubble-other'"
                >
                  <!-- 编辑模式 -->
                  <template v-if="editingMessageIndex === index">
                    <textarea v-model="editingText" class="edit-textarea" rows="2"></textarea>
                    <div class="edit-actions">
                      <button class="edit-btn save" @click="saveEditMessage(index)">保存</button>
                      <button class="edit-btn cancel" @click="cancelEdit">取消</button>
                    </div>
                  </template>
                  <!-- 正常显示 -->
                  <template v-else>
                    <!-- 双语显示：日语在上，中文在下 -->
                    <div v-if="msg.textJP && !msg.isMe" class="bilingual-message">
                      <div class="text-jp">{{ msg.textJP }}</div>
                      <div class="text-cn">{{ msg.text }}</div>
                    </div>
                    <!-- 单语显示（用户消息或无日语） -->
                    <template v-else-if="msg.text">{{ msg.text }}</template>
                    <div class="message-time">{{ msg.time }}</div>
                  </template>
                </div>
                <!-- 如果只有贴纸没有文字，也显示时间 -->
                <div
                  v-if="(msg.sticker || msg.image) && !msg.text && editingMessageIndex !== index"
                  class="sticker-time"
                >
                  {{ msg.time }}
                </div>
                <!-- Hover 操作按钮 -->
                <div v-if="editingMessageIndex !== index" class="message-actions">
                  <button class="action-btn" title="编辑" @click="startEditMessage(index, msg.text)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-btn delete" title="删除" @click="deleteMessage(index)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="list-padding"></div>
          </div>
        </div>

        <!-- 底部输入栏 -->
        <div class="input-area">
          <!-- 贴纸面板 -->
          <Transition name="slide-up">
            <div v-if="showStickerPanel" class="sticker-panel">
              <div class="sticker-panel-header">
                <span>贴纸</span>
                <label class="upload-local-btn">
                  <i class="fas fa-image"></i> 上传图片
                  <input type="file" accept="image/*" hidden @change="handleLocalImageUpload($event)" />
                </label>
              </div>
              <div class="sticker-grid">
                <img
                  v-for="sticker in stickers"
                  :key="sticker"
                  :src="getStickerUrl(sticker)"
                  class="sticker-item"
                  @click="selectSticker(sticker)"
                />
              </div>
            </div>
          </Transition>

          <!-- 待发送图片预览 -->
          <div v-if="pendingImage" class="pending-image-area">
            <img :src="pendingImage" class="pending-image" />
            <button class="remove-pending" @click="pendingImage = null">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="input-wrapper">
            <button class="plus-btn" @click="showStickerPanel = !showStickerPanel">
              <i :class="['fas', showStickerPanel ? 'fa-times' : 'fa-plus']"></i>
            </button>
            <textarea
              v-model="inputText"
              placeholder="发送消息..."
              rows="1"
              class="message-input"
              @keydown.enter.prevent="sendMessage"
            ></textarea>
            <button class="send-btn" :class="{ active: inputText.trim() || pendingImage }" @click="sendMessage">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 3. 群组聊天视图 (Group Chat View) -->
    <Transition name="slide-left">
      <div v-if="currentView === 'group-chat' && activeGroup" class="view-container chat-view">
        <!-- 群聊头部 -->
        <div class="chat-header">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i>
          </button>
          <div class="chat-contact-info">
            <h2 class="contact-name">{{ activeGroup.name }}</h2>
            <div class="contact-status">
              <span class="status-text">{{ activeGroup.memberIds.length }}人</span>
            </div>
          </div>
          <button class="settings-btn" title="群组设置" @click="openGroupSettings">
            <i class="fas fa-cog"></i>
          </button>
          <button class="close-btn" @click="emit('back')">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"
              />
            </svg>
          </button>
        </div>

        <!-- 群聊区域 -->
        <div class="chat-area">
          <div class="chat-bg">
            <div class="bg-overlay" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"></div>
          </div>

          <!-- 群消息列表 -->
          <div ref="chatRef" class="messages-container">
            <div class="time-divider">
              <span>群组聊天</span>
            </div>

            <div
              v-for="(msg, index) in activeGroup.messages"
              :key="index"
              class="message-row"
              :class="{ 'is-me': msg.senderId === -1 }"
            >
              <!-- 群成员头像 -->
              <div v-if="msg.senderId !== -1" class="message-avatar">
                <img :src="chatList.find(c => c.id === msg.senderId)?.avatar || ''" />
              </div>

              <!-- 气泡主体 -->
              <div class="message-bubble-wrapper">
                <!-- 发送者名称 -->
                <div v-if="msg.senderId !== -1" class="sender-name">{{ msg.senderName }}</div>
                <!-- 贴纸单独显示（类似微信） -->
                <div
                  v-if="msg.sticker"
                  class="sticker-bubble"
                  :class="msg.senderId === -1 ? 'bubble-me' : 'bubble-other'"
                >
                  <img :src="getStickerUrl(msg.sticker)" class="sticker-image" />
                </div>
                <!-- 文字气泡（如果有文字才显示） -->
                <div v-if="msg.text" class="message-bubble" :class="msg.senderId === -1 ? 'bubble-me' : 'bubble-other'">
                  <!-- 双语显示 -->
                  <div v-if="msg.textJP && msg.senderId !== -1" class="bilingual-message">
                    <div class="text-jp">{{ msg.textJP }}</div>
                    <div class="text-cn">{{ msg.text }}</div>
                  </div>
                  <template v-else>{{ msg.text }}</template>
                  <div class="message-time">{{ msg.time }}</div>
                </div>
                <!-- 如果只有贴纸没有文字，也显示时间 -->
                <div v-if="msg.sticker && !msg.text" class="sticker-time">{{ msg.time }}</div>
                <!-- Hover 操作按钮 (群聊消息) -->
                <div class="message-actions">
                  <button class="action-btn" title="编辑" @click="startEditGroupMessage(index, msg.text)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-btn delete" title="删除" @click="deleteGroupMessage(index)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="list-padding"></div>
          </div>
        </div>

        <!-- 底部输入栏 -->
        <div class="input-area">
          <!-- 贴纸面板 -->
          <Transition name="slide-up">
            <div v-if="showStickerPanel" class="sticker-panel">
              <div class="sticker-panel-header">
                <span>贴纸</span>
                <label class="upload-local-btn">
                  <i class="fas fa-image"></i> 上传图片
                  <input type="file" accept="image/*" hidden @change="handleLocalImageUpload($event)" />
                </label>
              </div>
              <div class="sticker-grid">
                <img
                  v-for="sticker in stickers"
                  :key="sticker"
                  :src="getStickerUrl(sticker)"
                  class="sticker-item"
                  @click="selectSticker(sticker)"
                />
              </div>
            </div>
          </Transition>

          <!-- 待发送图片预览 -->
          <div v-if="pendingImage" class="pending-image-area">
            <img :src="pendingImage" class="pending-image" />
            <button class="remove-pending" @click="pendingImage = null">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="input-wrapper">
            <button class="plus-btn" @click="showStickerPanel = !showStickerPanel">
              <i :class="['fas', showStickerPanel ? 'fa-times' : 'fa-plus']"></i>
            </button>
            <textarea
              v-model="inputText"
              placeholder="发送消息到群组..."
              rows="1"
              class="message-input"
              @keydown.enter.prevent="sendGroupMessage"
            ></textarea>
            <button class="send-btn" :class="{ active: inputText.trim() || pendingImage }" @click="sendGroupMessage">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 群组设置弹窗（根级别，确保在所有视图都能显示） -->
    <Transition name="fade">
      <div v-if="showGroupSettings && activeGroup" class="modal-overlay" @click="showGroupSettings = false">
        <div class="modal-content group-settings-modal" @click.stop>
          <h3 class="modal-title">群组设置</h3>

          <!-- 群头像上传 -->
          <div class="form-group">
            <label>群组头像</label>
            <div class="avatar-upload-row">
              <div class="current-avatar">
                <template v-if="activeGroup.customAvatar">
                  <img :src="activeGroup.customAvatar" class="preview-avatar" />
                </template>
                <div v-else class="group-avatars avatars-4">
                  <img
                    v-for="(avatar, i) in getGroupAvatars(activeGroup).slice(0, 4)"
                    :key="i"
                    :src="avatar"
                    class="group-avatar-img"
                  />
                </div>
              </div>
              <div class="upload-btns">
                <label class="upload-btn">
                  <i class="fas fa-upload"></i> 上传图片
                  <input type="file" accept="image/*" hidden @change="handleAvatarUpload($event)" />
                </label>
                <button v-if="activeGroup.customAvatar" class="upload-btn reset" @click="resetGroupAvatar">
                  <i class="fas fa-undo"></i> 恢复默认
                </button>
              </div>
            </div>
          </div>

          <!-- 群背景上传 -->
          <div class="form-group">
            <label>聊天背景</label>
            <div class="bg-upload-row">
              <div
                class="bg-preview"
                :style="activeGroup.customBg ? { backgroundImage: `url(${activeGroup.customBg})` } : {}"
              >
                <span v-if="!activeGroup.customBg">默认渐变</span>
              </div>
              <div class="upload-btns">
                <label class="upload-btn">
                  <i class="fas fa-image"></i> 上传背景
                  <input type="file" accept="image/*" hidden @change="handleBgUpload($event)" />
                </label>
                <button v-if="activeGroup.customBg" class="upload-btn reset" @click="resetGroupBg">
                  <i class="fas fa-undo"></i> 恢复默认
                </button>
              </div>
            </div>
          </div>

          <!-- 群名编辑 -->
          <div class="form-group">
            <label>群组名称</label>
            <input v-model="editingGroupName" type="text" class="form-input" />
          </div>

          <!-- 成员管理 -->
          <div class="form-group">
            <label>群成员 ({{ activeGroup.memberIds.length }}人)</label>
            <div class="member-grid compact">
              <div
                v-for="chat in chatList"
                :key="chat.id"
                class="member-option"
                :class="{ selected: activeGroup.memberIds.includes(chat.id) }"
                @click="toggleGroupMember(chat.id)"
              >
                <img :src="chat.avatar" class="member-avatar" />
                <span class="member-name">{{ chat.name }}</span>
                <i v-if="activeGroup.memberIds.includes(chat.id)" class="fas fa-check check-icon"></i>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click="showGroupSettings = false">取消</button>
            <button class="btn-confirm" @click="saveGroupSettings">保存</button>
          </div>

          <button class="delete-group-text-btn" @click="confirmDeleteGroup">
            <i class="fas fa-trash"></i> 解散群组
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { CHAIN_STICKERS, ChainMessageMode, ChainPromptManager, getStickerUrl } from '../../世界书管理/Chain提示词';
import { ChainOfThoughtManager, ChainOfThoughtMode } from '../../世界书管理/思维链区';
import { getAllChainIdolData, getChainProfileBgUrl } from '../数据/ChainAssets';
import { getGenerateApiConfig } from '../数据/PhoneApiSettings';

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'unread-update', count: number): void;
}>();

// 状态
const currentView = ref<'list' | 'chat' | 'group-chat'>('list');
const inputText = ref('');
const chatRef = ref<HTMLElement | null>(null);
const isGenerating = ref(false); // AI 生成中状态
const editingMessageIndex = ref<number | null>(null); // 正在编辑的消息索引
const editingText = ref(''); // 编辑中的文本
const showCreateGroup = ref(false); // 创建群组弹窗
const showGroupSettings = ref(false); // 群组设置弹窗
const newGroupName = ref(''); // 新群组名称
const selectedMembers = ref<number[]>([]); // 选中的成员ID
const editingGroupName = ref(''); // 编辑中的群名
const showStickerPanel = ref(false); // 贴纸面板显示
const pendingImage = ref<string | null>(null); // 待发送的图片URL
const stickers = CHAIN_STICKERS; // 导出给模板使用

// localStorage 键名
const STORAGE_KEY = 'chain_chat_history';
const GROUP_STORAGE_KEY = 'chain_group_list';

// Tabs
const tabs = ['全部', '未读', '特别关注', '群组'];
const activeTab = ref('全部');

// 配置 - 默认使用真乃的背景图
const config = ref({
  bgImage: getChainProfileBgUrl('Mano'),
});

// 群组消息类型
type GroupMessage = {
  senderId: number; // 发送者ID，-1表示用户
  senderName: string;
  text: string;
  textJP?: string;
  time: string;
  sticker?: string;
  // RAG 兼容元数据
  timestamp?: number; // Unix 时间戳
  stageType?: 'FRONT' | 'BACK' | 'MIDDLE'; // FRONT=公开营业, BACK=私密, MIDDLE=工作
  affectionLevel?: number; // 当时的好感度（预留，默认0）
};

// 群组数据类型
interface GroupChat {
  id: number;
  name: string;
  customAvatar?: string; // 用户上传的头像
  customBg?: string; // 用户上传的背景
  memberIds: number[];
  messages: GroupMessage[];
  lastMsg: string;
  lastSender: string;
  lastTime: string;
  createdAt: string;
}

// 群组列表
const groupList = ref<GroupChat[]>([]);
const activeGroupId = ref<number | null>(null);
const activeGroup = computed(() => {
  return groupList.value.find(g => g.id === activeGroupId.value) || null;
});

// 群组消息编辑状态
const editingGroupMessageIndex = ref<number | null>(null);
const editingGroupText = ref('');

// 聊天列表数据类型
interface ChatItem {
  id: number;
  englishName: string;
  name: string;
  avatar: string;
  profileBg: string;
  lastMsg: string;
  lastTime: string;
  unread: number;
  online: boolean;
  isFavorite: boolean;
  messages: {
    text: string;
    textJP?: string;
    isMe: boolean;
    time: string;
    sticker?: string;
    image?: string;
    // RAG 兼容元数据
    timestamp?: number; // Unix 时间戳
    stageType?: 'FRONT' | 'BACK' | 'MIDDLE'; // Chain 私聊是 BACK
    affectionLevel?: number; // 当时的好感度
  }[];
}

// 聊天列表 - 使用真实图片初始化
const chatList = ref<ChatItem[]>([]);

// 保存聊天记录到 localStorage
function saveChatHistory() {
  try {
    const dataToSave = chatList.value.map(chat => ({
      id: chat.id,
      englishName: chat.englishName,
      lastMsg: chat.lastMsg,
      lastTime: chat.lastTime,
      unread: chat.unread,
      isFavorite: chat.isFavorite,
      messages: chat.messages,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('[Chain] 保存聊天记录失败:', error);
  }
}

/**
 * 计算并发送未读总数到父组件
 */
function emitUnreadUpdate() {
  const totalUnread = chatList.value.reduce((sum, chat) => sum + chat.unread, 0);
  emit('unread-update', totalUnread);
  console.log(`[Chain] 未读消息总数: ${totalUnread}`);
}

// 从 localStorage 加载聊天记录
function loadChatHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as Array<{
        id: number;
        englishName: string;
        lastMsg: string;
        lastTime: string;
        unread: number;
        isFavorite: boolean;
        messages: ChatItem['messages'];
      }>;
    }
  } catch (error) {
    console.error('[Chain] 加载聊天记录失败:', error);
  }
  return null;
}

// 保存群组列表到 localStorage
function saveGroupList() {
  try {
    localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groupList.value));
  } catch (error) {
    console.error('[Chain] 保存群组列表失败:', error);
  }
}

// 从 localStorage 加载群组列表
function loadGroupList(): GroupChat[] {
  try {
    const saved = localStorage.getItem(GROUP_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as GroupChat[];
    }
  } catch (error) {
    console.error('[Chain] 加载群组列表失败:', error);
  }
  return [];
}

// 初始化偶像列表和群组
onMounted(() => {
  const idolData = getAllChainIdolData();
  const savedHistory = loadChatHistory();

  chatList.value = idolData.map((idol, index) => {
    const saved = savedHistory?.find(s => s.englishName === idol.englishName);
    return {
      id: index + 1,
      englishName: idol.englishName,
      name: idol.chineseName,
      avatar: idol.iconUrl,
      profileBg: idol.profileBgUrl,
      lastMsg: saved?.lastMsg || '',
      lastTime: saved?.lastTime || '',
      unread: saved?.unread || 0,
      online: Math.random() > 0.5,
      isFavorite: saved?.isFavorite ?? index < 3,
      messages: saved?.messages || [],
    };
  });

  // 加载群组列表
  groupList.value = loadGroupList();

  // 发送初始未读计数到父组件（同步小红点）
  emitUnreadUpdate();

  // 监听数据更新事件（由全局调度器触发）
  window.addEventListener('chain-data-updated', handleDataUpdate);
});

// 处理数据更新事件
const handleDataUpdate = () => {
  console.log('[Chain] 收到数据更新通知，重新加载数据');
  // 重新加载聊天列表和群组列表
  // 注意：这里需要重新实现 loadChatList 逻辑，或者直接调用初始化时的逻辑
  // 由于 chatList 是 ref，我们可以直接更新它

  // 重新加载群组
  groupList.value = loadGroupList();

  // 重新加载聊天记录 (这里简化处理，直接重新挂载可能更好，但为了体验，我们手动更新)
  // 由于 chatList 初始化逻辑比较复杂（合并了静态数据和localStorage），我们需要提取初始化逻辑
  // 这里暂时只做简单的 unread 更新通知，因为完整重载比较复杂
  // 但为了正确显示新消息，必须重载

  // 重新执行初始化逻辑的一部分
  const savedHistory = loadChatHistory();

  // 更新 chatList
  chatList.value.forEach(chat => {
    const saved = savedHistory?.find((s: any) => s.englishName === chat.englishName);
    if (saved) {
      chat.lastMsg = saved.lastMsg;
      chat.lastTime = saved.lastTime;
      chat.unread = saved.unread;
      chat.messages = saved.messages;
      chat.isFavorite = saved.isFavorite;
    }
  });

  // 重新排序
  // (这里依赖 computed filteredChatList 自动更新)

  emitUnreadUpdate();
};

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('chain-data-updated', handleDataUpdate);
});

// 计算属性
const filteredChatList = computed(() => {
  let list = [...chatList.value];

  // 按标签过滤
  if (activeTab.value === '未读') {
    list = list.filter(chat => chat.unread > 0);
  } else if (activeTab.value === '特别关注') {
    list = list.filter(chat => chat.isFavorite);
  }

  // 按最后消息时间排序（新消息在上）
  return list.sort((a, b) => {
    // 获取最后一条消息的 timestamp
    const aLastMsg = a.messages[a.messages.length - 1];
    const bLastMsg = b.messages[b.messages.length - 1];

    const aTimestamp = aLastMsg?.timestamp || 0;
    const bTimestamp = bLastMsg?.timestamp || 0;

    // 降序排列（最新的在上）
    return bTimestamp - aTimestamp;
  });
});

const activeChatId = ref<number | null>(null);
const activeChat = computed(() => {
  const found = chatList.value.find(c => c.id === activeChatId.value);
  return found || null;
});
const activeMessages = computed(() => activeChat.value?.messages || []);

// 方法
function enterChat(chat: ChatItem) {
  activeChatId.value = chat.id;
  config.value.bgImage = chat.profileBg; // 使用该偶像的背景图
  currentView.value = 'chat';
  chat.unread = 0;
  saveChatHistory(); // 保存未读=0的状态
  emitUnreadUpdate(); // 同步到父组件
  scrollToBottom();
}

function goBack() {
  currentView.value = 'list';
  activeChatId.value = null;
  activeGroupId.value = null;
}

/**
 * 创建新群组
 */
function createGroup() {
  if (!newGroupName.value.trim() || selectedMembers.value.length === 0) return;

  const newGroup: GroupChat = {
    id: Date.now(),
    name: newGroupName.value.trim(),
    memberIds: [...selectedMembers.value],
    messages: [],
    lastMsg: '',
    lastSender: '',
    lastTime: '',
    createdAt: new Date().toISOString(),
  };

  groupList.value.push(newGroup);
  saveGroupList();

  // 重置状态
  newGroupName.value = '';
  selectedMembers.value = [];
  showCreateGroup.value = false;
}

/**
 * 删除群组
 */
function deleteGroup(groupId: number) {
  groupList.value = groupList.value.filter(g => g.id !== groupId);
  saveGroupList();
  if (activeGroupId.value === groupId) {
    currentView.value = 'list';
    activeGroupId.value = null;
  }
}

/**
 * 删除群组消息
 */
function deleteGroupMessage(index: number) {
  if (!activeGroup.value) return;
  activeGroup.value.messages.splice(index, 1);
  saveGroupList();
}

/**
 * 开始编辑群组消息
 */
function startEditGroupMessage(index: number, text: string) {
  if (!activeGroup.value) return;
  editingGroupMessageIndex.value = index;
  editingGroupText.value = text || '';
}

/**
 * 保存编辑的群组消息
 */
function saveEditGroupMessage() {
  if (!activeGroup.value || editingGroupMessageIndex.value === null) return;
  if (editingGroupText.value.trim()) {
    activeGroup.value.messages[editingGroupMessageIndex.value].text = editingGroupText.value;
    saveGroupList();
  }
  editingGroupMessageIndex.value = null;
  editingGroupText.value = '';
}

/**
 * 取消编辑群组消息
 */
function cancelEditGroupMessage() {
  editingGroupMessageIndex.value = null;
  editingGroupText.value = '';
}

/**
 * 进入群组聊天
 */
function enterGroupChat(group: GroupChat) {
  activeGroupId.value = group.id;
  currentView.value = 'group-chat';
  scrollToBottom();
}

/**
 * 编辑群名
 */
function editGroupName(groupId: number, newName: string) {
  const group = groupList.value.find(g => g.id === groupId);
  if (group && newName.trim()) {
    group.name = newName.trim();
    saveGroupList();
  }
}

/**
 * 切换成员选择
 */
function toggleMemberSelection(memberId: number) {
  const index = selectedMembers.value.indexOf(memberId);
  if (index > -1) {
    selectedMembers.value.splice(index, 1);
  } else {
    selectedMembers.value.push(memberId);
  }
}

/**
 * 获取群组成员信息
 */
function getGroupMembers(group: GroupChat) {
  return group.memberIds.map(id => chatList.value.find(c => c.id === id)).filter(Boolean) as ChatItem[];
}

/**
 * 获取群组头像拼接（最多4个）
 */
function getGroupAvatars(group: GroupChat): string[] {
  return getGroupMembers(group)
    .slice(0, 4)
    .map(m => m.avatar);
}

/**
 * 选择贴纸 - 直接使用 URL（API 支持 URL 格式的图片）
 */
function selectSticker(stickerName: string) {
  const stickerUrl = getStickerUrl(stickerName);
  pendingImage.value = stickerUrl;
  showStickerPanel.value = false;
  console.log('[Chain] 已选择贴纸:', stickerName);
}

/**
 * 处理本地图片上传
 */
function handleLocalImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    if (e.target?.result) {
      pendingImage.value = e.target.result as string;
      showStickerPanel.value = false;
    }
  };
  reader.readAsDataURL(file);
  input.value = '';
}

/**
 * 打开群组设置
 */
function openGroupSettings() {
  if (!activeGroup.value) return;
  editingGroupName.value = activeGroup.value.name;
  showGroupSettings.value = true;
}

/**
 * 处理头像上传
 */
function handleAvatarUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !activeGroup.value) return;

  const reader = new FileReader();
  reader.onload = e => {
    if (activeGroup.value && e.target?.result) {
      activeGroup.value.customAvatar = e.target.result as string;
      saveGroupList();
    }
  };
  reader.readAsDataURL(file);
  input.value = ''; // 重置 input
}

/**
 * 重置群头像
 */
function resetGroupAvatar() {
  if (!activeGroup.value) return;
  activeGroup.value.customAvatar = undefined;
  saveGroupList();
}

/**
 * 处理背景上传
 */
function handleBgUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !activeGroup.value) return;

  const reader = new FileReader();
  reader.onload = e => {
    if (activeGroup.value && e.target?.result) {
      activeGroup.value.customBg = e.target.result as string;
      saveGroupList();
    }
  };
  reader.readAsDataURL(file);
  input.value = '';
}

/**
 * 重置群背景
 */
function resetGroupBg() {
  if (!activeGroup.value) return;
  activeGroup.value.customBg = undefined;
  saveGroupList();
}

/**
 * 切换群组成员（设置时用）
 */
function toggleGroupMember(memberId: number) {
  if (!activeGroup.value) return;
  const index = activeGroup.value.memberIds.indexOf(memberId);
  if (index > -1) {
    // 至少保留一个成员
    if (activeGroup.value.memberIds.length > 1) {
      activeGroup.value.memberIds.splice(index, 1);
    }
  } else {
    activeGroup.value.memberIds.push(memberId);
  }
}

/**
 * 保存群组设置
 */
function saveGroupSettings() {
  if (!activeGroup.value) return;
  if (editingGroupName.value.trim()) {
    activeGroup.value.name = editingGroupName.value.trim();
  }
  saveGroupList();
  showGroupSettings.value = false;
}

/**
 * 确认删除群组
 */
function confirmDeleteGroup() {
  if (!activeGroup.value) return;
  if (confirm('确定要解散这个群组吗？所有聊天记录将被删除。')) {
    deleteGroup(activeGroup.value.id);
    showGroupSettings.value = false;
  }
}

/**
 * 发送群组消息
 */
function sendGroupMessage() {
  const hasText = inputText.value.trim();
  const hasImage = pendingImage.value;

  if ((!hasText && !hasImage) || !activeGroup.value || isGenerating.value) return;

  const group = activeGroup.value;
  const nowTime = getCurrentTime();

  // 添加用户消息（可能包含图片）
  group.messages.push({
    senderId: -1, // -1 表示用户
    senderName: '制作人',
    text: inputText.value,
    time: nowTime,
    sticker: hasImage || undefined,
  });

  group.lastMsg = hasImage ? hasText || '[图片]' : inputText.value;
  group.lastSender = '制作人';
  group.lastTime = nowTime;

  const userMessage = inputText.value;
  inputText.value = '';
  pendingImage.value = null; // 清除待发送图片
  showStickerPanel.value = false;
  scrollToBottom();
  saveGroupList();

  // 如果有文字才调用群组 AI 生成
  if (userMessage.trim()) {
    generateGroupAIReply(group, userMessage);
  }
}

/**
 * 生成群组 AI 回复（多成员可能回复）
 */
async function generateGroupAIReply(group: GroupChat, userMessage: string) {
  isGenerating.value = true;

  try {
    // 获取成员信息
    const members = getGroupMembers(group);
    const memberNames = members.map(m => m.name).join('、');

    // 构建群组对话记录
    const groupChatHistory = group.messages.map(msg => `[${msg.time}] ${msg.senderName}: ${msg.text}`).join('\n');

    // 收集成员个人对话记录（重要：合并所有成员的个人聊天）
    const memberHistories = members
      .map(m => {
        if (m.messages.length === 0) return '';
        const history = m.messages
          .slice(-10) // 最近10条
          .map(msg => `[${msg.time}] ${msg.isMe ? '制作人' : m.name}: ${msg.text}`)
          .join('\n');
        return `【${m.name}的私聊记录】\n${history}`;
      })
      .filter(Boolean)
      .join('\n\n');

    // 构建群组提示词
    const prompt = getGroupPrompt({
      memberNames,
      groupChatHistory,
      memberHistories,
      currentTime: ChainPromptManager.getCurrentTimeString(),
    });

    // 获取思维链
    const cotPrompt = ChainOfThoughtManager.getChain(ChainOfThoughtMode.CHAIN_GROUP_REPLY);

    // 系统提示词 = 思维链 + 提示词框架
    const systemPrompt = cotPrompt + '\n\n' + prompt;

    // 用户输入
    const userInputText = userMessage || '(用户发送了消息)';

    // 调用 API
    const apiConfig = getGenerateApiConfig();
    let responseText: string;

    if (apiConfig) {
      responseText = await callCustomApi(systemPrompt, userInputText, apiConfig);
    } else {
      responseText = await callMainApi(systemPrompt, userInputText);
    }

    // 解析群组响应
    const parsed = parseGroupResponse(responseText);

    if (parsed && parsed.length > 0) {
      const nowTime = getCurrentTime();

      for (const reply of parsed) {
        // 找到对应的成员
        const member = members.find(m => m.name === reply.sender);
        if (member) {
          group.messages.push({
            senderId: member.id,
            senderName: reply.sender,
            text: reply.contentCN,
            textJP: reply.contentJP,
            time: nowTime,
          });
          group.lastMsg = reply.contentCN;
          group.lastSender = reply.sender;
          group.lastTime = nowTime;
        }
      }
    }

    saveGroupList();
    scrollToBottom();
  } catch (error) {
    console.error('[Chain] 群组AI生成失败:', error);
  } finally {
    isGenerating.value = false;
  }
}

/**
 * 群组提示词生成
 */
function getGroupPrompt(vars: {
  memberNames: string;
  groupChatHistory: string;
  memberHistories: string;
  currentTime: string;
}): string {
  return `# Chain 群组消息生成

你需要模拟群聊，扮演以下偶像成员回复制作人的消息。

## 群组成员
${vars.memberNames}

## 当前时间
${vars.currentTime}

## 群聊记录
${vars.groupChatHistory || '（暂无群聊记录）'}

## 成员私聊记录（了解每人与制作人的关系）
${vars.memberHistories || '（暂无私聊记录）'}

---

## ⚠️ 关键要求

### 1. 真实群聊模拟
- **不是每个人都会回复**！模拟真实群聊
- 根据话题和性格，0-3人回复是正常的
- 如果话题与某人无关，她可以不发言

### 2. 双语模式
- 先用**日语**写（保留口癖、称呼）
- 再翻译为**中文**

### 3. 消息风格
- 群聊更随意、自然
- 可以互相接话、评论
- 每人1条消息即可

---

## 📤 输出JSON格式

直接输出以下JSON，**不要任何解释文字**：

\`\`\`json
{
  "replies": [
    {
      "sender": "成员名字",
      "contentJP": "日语原文",
      "contentCN": "中文翻译"
    }
  ]
}
\`\`\`

如果没人回复，返回空数组：{"replies": []}
`;
}

/**
 * 解析群组响应
 */
function parseGroupResponse(
  responseText: string,
): Array<{ sender: string; contentJP: string; contentCN: string }> | null {
  try {
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText;

    const parsed = JSON.parse(jsonStr.trim());

    if (parsed.replies && Array.isArray(parsed.replies)) {
      return parsed.replies;
    }

    return [];
  } catch (error) {
    console.error('[Chain] 解析群组响应失败:', error);
    return null;
  }
}

/**
 * 切换特别关注状态
 * @param chatId 可选，如果不传则使用 activeChat
 * @param event 可选，用于阻止事件冒泡
 */
function toggleFavorite(chatId?: number, event?: Event) {
  event?.stopPropagation(); // 阻止冒泡，避免进入聊天
  const targetId = chatId ?? activeChatId.value;
  const chat = chatList.value.find(c => c.id === targetId);
  if (chat) {
    chat.isFavorite = !chat.isFavorite;
    saveChatHistory();
    console.log(`[Chain] ${chat.name} 关注状态: ${chat.isFavorite ? '已关注' : '取消关注'}`);
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatRef.value) {
      chatRef.value.scrollTop = chatRef.value.scrollHeight;
    }
  });
}

function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function sendMessage() {
  const hasText = inputText.value.trim();
  const hasImage = pendingImage.value;

  if ((!hasText && !hasImage) || !activeChatId.value || isGenerating.value) return;

  const chat = chatList.value.find(c => c.id === activeChatId.value);
  if (!chat) return;

  const nowTime = getCurrentTime();

  // 添加用户消息（可能包含图片）
  chat.messages.push({
    text: inputText.value,
    isMe: true,
    time: nowTime,
    image: hasImage || undefined,
  });

  chat.lastMsg = hasImage ? hasText || '[图片]' : inputText.value;
  chat.lastTime = nowTime;

  const userMessage = inputText.value;
  const userImage = hasImage || undefined; // 保存用户图片
  inputText.value = '';
  pendingImage.value = null; // 清除待发送图片
  showStickerPanel.value = false;
  scrollToBottom();
  saveChatHistory();

  // 如果有文字或图片，都调用 AI 生成回复
  if (userMessage.trim() || userImage) {
    generateAIReply(chat, userMessage, userImage);
  }
}

/**
 * 生成 AI 回复
 */
async function generateAIReply(chat: ChatItem, userMessage: string, userImage?: string) {
  isGenerating.value = true;

  try {
    // 构建对话记录
    const chatHistory = ChainPromptManager.formatChatHistory(
      chat.messages.map(msg => ({
        time: msg.time,
        sender: msg.isMe ? 'user' : 'idol',
        content: msg.text,
      })),
      chat.name,
    );

    // 构建提示词变量
    const variables = {
      idolName: chat.name,
      currentTime: ChainPromptManager.getCurrentTimeString(),
      chatHistory,
    };

    // 获取思维链和提示词
    const chainOfThought = ChainOfThoughtManager.getChain(ChainOfThoughtMode.CHAIN_REPLY);
    const prompt = ChainPromptManager.getPrompt(ChainMessageMode.REPLY, variables);

    // 系统提示词 = 思维链 + 提示词框架
    const systemPrompt = chainOfThought + '\n\n' + prompt;

    // 用户输入（如果有图片，添加说明）
    let userInputText = userMessage || '(用户发送了一张图片)';
    if (userImage) {
      userInputText += '\n\n📷 请结合用户发送的图片内容回复。';
      console.log('[Chain] 用户消息包含图片，已添加到用户输入');
    }

    // 获取 API 配置
    const customApi = getGenerateApiConfig();

    let responseText = '';

    if (customApi) {
      // 使用自定义 API（传递系统提示词、用户输入、图片）
      responseText = await callCustomApi(systemPrompt, userInputText, customApi, userImage);
    } else {
      // 使用主 API（传递系统提示词、用户输入、图片）
      responseText = await callMainApi(systemPrompt, userInputText, userImage);
    }

    // 解析响应
    const parsed = ChainPromptManager.parseResponse(responseText);

    if (parsed && parsed.messages.length > 0) {
      // 添加 AI 生成的消息（双语格式）
      for (const msg of parsed.messages) {
        const nowTime = getCurrentTime();
        chat.messages.push({
          text: msg.contentCN, // 中文翻译
          textJP: msg.contentJP, // 日语原文
          isMe: false,
          time: nowTime,
          sticker: msg.sticker ? getStickerUrl(msg.sticker) : undefined,
        });
        chat.lastMsg = msg.contentCN;
        chat.lastTime = nowTime;
      }
    } else {
      // 解析失败，添加默认消息
      chat.messages.push({
        text: '……',
        isMe: false,
        time: getCurrentTime(),
      });
    }

    saveChatHistory(); // 保存聊天记录
    scrollToBottom();
  } catch (error) {
    console.error('[Chain] AI 生成失败:', error);
    // 错误时添加提示
    chat.messages.push({
      text: '（消息发送失败，请重试）',
      isMe: false,
      time: getCurrentTime(),
    });
    saveChatHistory();
    scrollToBottom();
  } finally {
    isGenerating.value = false;
  }
}

/**
 * 开始编辑消息
 */
function startEditMessage(index: number, text: string) {
  editingMessageIndex.value = index;
  editingText.value = text;
}

/**
 * 保存编辑的消息
 */
function saveEditMessage(index: number) {
  const chat = activeChat.value;
  if (!chat || !editingText.value.trim()) return;

  chat.messages[index].text = editingText.value.trim();

  // 更新最后消息（如果是最后一条）
  if (index === chat.messages.length - 1) {
    chat.lastMsg = editingText.value.trim();
  }

  editingMessageIndex.value = null;
  editingText.value = '';
  saveChatHistory();
}

/**
 * 取消编辑
 */
function cancelEdit() {
  editingMessageIndex.value = null;
  editingText.value = '';
}

/**
 * 删除消息
 */
function deleteMessage(index: number) {
  const chat = activeChat.value;
  if (!chat) return;

  chat.messages.splice(index, 1);

  // 更新最后消息
  if (chat.messages.length > 0) {
    const lastMsg = chat.messages[chat.messages.length - 1];
    chat.lastMsg = lastMsg.text;
    chat.lastTime = lastMsg.time;
  } else {
    chat.lastMsg = '';
    chat.lastTime = '';
  }

  saveChatHistory();
}

/**
 * 调用自定义 API（通过酒馆的 generateRaw 以便在后台显示）
 * 参考 AI生成助手.ts 的实现
 */
async function callCustomApi(
  systemPrompt: string,
  userInput: string,
  config: ReturnType<typeof getGenerateApiConfig>,
  image?: string,
): Promise<string> {
  if (!config) throw new Error('No custom API config');

  // 使用酒馆的 TavernHelper.generateRaw 函数
  if (typeof window.TavernHelper?.generateRaw === 'function') {
    try {
      const params: any = {
        user_input: userInput, // 用户输入放在顶层
        should_stream: false,
        // 使用 system 角色传递提示词框架，然后使用 'user_input' 内置标识符
        ordered_prompts: [{ role: 'system', content: systemPrompt }, 'user_input'],
        max_chat_history: 0,
        custom_api: {
          apiurl: config.apiurl.replace(/\/$/, ''), // 去除末尾斜杠
          key: config.key,
          model: config.model,
          source: config.source || 'openai',
          max_tokens: config.max_tokens,
          temperature: config.temperature,
        },
      };

      // 如果有图片，添加到顶层 image 字段
      if (image) {
        params.image = [image];
        console.log('[Chain] 已添加图片到自定义API请求');
      }

      const result = await window.TavernHelper.generateRaw(params);
      return result || '';
    } catch (error) {
      console.error('[Chain] TavernHelper.generateRaw with custom_api 失败:', error);
      throw error;
    }
  }

  // 兼容旧版 generateRaw
  if (typeof (window as any).generateRaw === 'function') {
    try {
      const params: any = {
        user_input: userInput,
        ordered_prompts: [{ role: 'system', content: systemPrompt }, 'user_input'],
        max_chat_history: 0,
        custom_api: {
          apiurl: config.apiurl.replace(/\/$/, ''), // 去除末尾斜杠
          key: config.key,
          model: config.model,
          source: config.source || 'openai',
          max_tokens: config.max_tokens,
          temperature: config.temperature,
        },
      };

      if (image) {
        params.image = [image];
      }

      const result = await (window as any).generateRaw(params);
      return result || '';
    } catch (error) {
      console.error('[Chain] generateRaw with custom_api 失败:', error);
      throw error;
    }
  }

  throw new Error('generateRaw 函数不可用');
}

/**
 * 调用主 API（酒馆 generate 函数）
 * 参考 AI生成助手.ts 的实现，使用 TavernHelper.generateRaw
 */
async function callMainApi(systemPrompt: string, userInput: string, image?: string): Promise<string> {
  // 使用酒馆的 TavernHelper.generateRaw 函数
  if (typeof window.TavernHelper?.generateRaw === 'function') {
    try {
      const params: any = {
        user_input: userInput,
        should_stream: false,
        ordered_prompts: [{ role: 'system', content: systemPrompt }, 'user_input'],
        max_chat_history: 0,
      };

      // 如果有图片，添加到顶层 image 字段
      if (image) {
        params.image = [image];
        console.log('[Chain] 已添加图片到请求');
      }

      const result = await window.TavernHelper.generateRaw(params);
      return result || '';
    } catch (error) {
      console.error('[Chain] TavernHelper.generateRaw 失败:', error);
      throw error;
    }
  }

  // 兼容旧版 generateRaw
  if (typeof (window as any).generateRaw === 'function') {
    try {
      const params: any = {
        user_input: userInput,
        ordered_prompts: [{ role: 'system', content: systemPrompt }, 'user_input'],
        max_chat_history: 0,
      };

      if (image) {
        params.image = [image];
      }

      const result = await (window as any).generateRaw(params);
      return result || '';
    } catch (error) {
      console.error('[Chain] generateRaw 失败:', error);
      throw error;
    }
  }

  throw new Error('generateRaw 函数不可用');
}
</script>

<style scoped lang="scss">
.chain-app {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fff;
  overflow: hidden;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
}

.view-container {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* Header Styles */
.app-header {
  background: #2563eb; /* blue-600 */
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 20;
}

.header-top {
  padding: 24px 24px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 0.025em;
  font-style: italic;
}

.header-actions {
  display: flex;
  gap: 24px;
  color: #bfdbfe; /* blue-100 */
}

.icon-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: white;
    transform: scale(1.1);
  }

  i {
    font-size: 20px;
  }
}

/* Tabs */
.tabs {
  display: flex;
  gap: 32px;
  padding: 0 24px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-btn {
  position: relative;
  padding-bottom: 12px;
  padding-top: 4px;
  background: none;
  border: none;
  color: #bfdbfe;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s;

  &.active {
    color: white;
  }

  &:hover {
    opacity: 1;
  }
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: white;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}

/* Chat List */
.chat-list {
  flex: 1;
  overflow-y: auto;
  background: white;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 128px 0;
  color: #9ca3af;

  i {
    font-size: 60px;
    margin-bottom: 16px;
    opacity: 0.2;
  }
  span {
    font-size: 18px;
    font-weight: 500;
  }
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f9fafb;
  }
  &:active {
    background-color: #eff6ff;
  }
}

.avatar-container {
  position: relative;
  width: 64px;
  height: 64px;
  margin-right: 16px;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f3f4f6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  background: #22c55e;
  border: 2px solid white;
  border-radius: 50%;
}

.chat-content {
  flex: 1;
  min-width: 0;
  padding: 4px 0;
}

.chat-info-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-name {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-icon {
  font-size: 14px;
  color: #facc15;
}

.chat-time {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
}

.chat-preview {
  font-size: 16px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;

  &.unread {
    color: #1f2937;
    font-weight: 600;
  }
}

.unread-badge {
  margin-left: 12px;
  flex-shrink: 0;
  background: #2563eb;
  color: white;
  font-size: 14px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 28px;
  text-align: center;
}

/* Chat View Styles */
.chat-view {
  background: #f9fafb;
  z-index: 20;
}

.chat-header {
  background: #2563eb;
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 30;
}

.back-btn,
.menu-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1d4ed8;
  }
  i {
    font-size: 20px;
  }
}

.chat-title-container {
  text-align: center;
}

.chat-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.025em;
}

.online-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0.9;
  margin-top: 2px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #86efac;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(134, 239, 172, 0.8);
}

.status-text {
  font-size: 12px;
  font-weight: 500;
}

.chat-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.bg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, transparent 30%);
}

.messages-container {
  position: relative;
  z-index: 10;
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.time-divider {
  text-align: center;
  padding: 16px 0;

  span {
    font-size: 12px;
    font-weight: 700;
    color: #6b7280;
    background: rgba(255, 255, 255, 0.8);
    padding: 6px 16px;
    border-radius: 9999px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
}

.message-row {
  display: flex;
  width: 100%;

  &.is-me {
    justify-content: flex-end;
  }
}

/* 群聊发送者名称 */
.sender-name {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
  padding-left: 4px;
}

.message-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-right: 12px;
  flex-shrink: 0;
  align-self: flex-end;
  margin-bottom: 4px;
  background: #e5e7eb;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.message-bubble-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;

  &:hover .message-actions {
    opacity: 1;
    pointer-events: auto;
  }
}

/* 用户消息靠右 */
.is-me .message-bubble-wrapper {
  align-items: flex-end;
}

/* 群组发送者名称 */
.sender-name {
  font-size: 12px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 2px;
  padding-left: 12px;
}

/* 贴纸图片样式 */
.sticker-image {
  max-width: 100px;
  max-height: 100px;
  object-fit: contain;
  display: block;
  margin-bottom: 4px;
}

/* 爱心收藏按钮 - 加大左边距避免误触 */
.favorite-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-right: 12px; /* 和右边按钮保持距离 */

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  &.active {
    color: #ff4d6d;
    background: rgba(255, 77, 109, 0.2);
  }
}

/* 用户消息气泡最小宽度（防止竖排） */
.bubble-me {
  min-width: 60px;
}

/* 贴纸单独气泡（类似微信风格）*/
.sticker-bubble {
  padding: 8px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  margin-bottom: 8px;

  &.bubble-me {
    background: rgba(232, 245, 253, 0.95);
  }
}

/* 贴纸图片样式 */
.sticker-image {
  display: block;
  max-width: 120px;
  max-height: 120px;
  object-fit: contain;
}

/* 只有贴纸时的时间显示 */
.sticker-time {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.4);
  text-align: right;
  margin-top: -4px;
}

/* 贴纸单独显示（不和文字挤在一起） */
.sticker-image {
  display: block;
  max-width: 120px;
  max-height: 120px;
  object-fit: contain;
  margin-bottom: 8px;
}

.message-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.2);
    color: #374151;
  }

  &.delete:hover {
    background: #fee2e2;
    color: #dc2626;
  }
}

.edit-textarea {
  width: 100%;
  min-width: 200px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.edit-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.save {
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
    }
  }

  &.cancel {
    background: #e5e7eb;
    color: #374151;

    &:hover {
      background: #d1d5db;
    }
  }
}

.message-bubble {
  position: relative;
  max-width: 75%;
  padding: 12px 20px;
  border-radius: 16px;
  font-size: 16px;
  line-height: 1.6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  word-break: break-word;
}

.bubble-me {
  background: #dbeafe; /* blue-100 */
  color: #111827;
  border-bottom-right-radius: 2px;
}

.bubble-other {
  background: white;
  color: #111827;
  border-bottom-left-radius: 2px;
}

.message-time {
  text-align: right;
  margin-top: 6px;
  opacity: 0.5;
  font-size: 12px;
  font-weight: 500;
}

/* 双语消息样式 */
.bilingual-message {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.text-jp {
  font-size: 15px;
  color: #374151;
  line-height: 1.5;
}

.text-cn {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
  padding-top: 4px;
  border-top: 1px dashed #e5e7eb;
}

.message-image {
  max-width: 180px;
  max-height: 180px;
  border-radius: 8px;
  object-fit: contain;
  display: block;
  margin-bottom: 4px;
}

.input-area {
  background: white;
  padding: 8px 12px;
  border-top: 1px solid #f3f4f6;
  z-index: 30;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f3f4f6;
  border-radius: 24px;
  padding: 6px 10px;
}

.plus-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: none;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #2563eb;
  }
  i {
    font-size: 20px;
  }
}

.message-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  color: #1f2937;
  resize: none;
  padding: 4px 0;
  min-height: 20px;
  max-height: 80px;
  font-family: inherit;
  line-height: 1.4;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #d1d5db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #2563eb;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: scale(1.05);
    }
  }

  i {
    font-size: 18px;
    margin-left: 2px;
  }
}

/* 贴纸面板 */
.sticker-panel {
  background: white;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  padding: 12px;
  max-height: 250px;
  overflow-y: auto;
}

.sticker-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  span {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }
}

.upload-local-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }

  i {
    font-size: 12px;
  }
}

.sticker-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.sticker-item {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  padding: 4px;

  &:hover {
    background: #e5e7eb;
    transform: scale(1.1);
  }
}

/* 待发送图片 */
.pending-image-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 8px;
}

.pending-image {
  height: 60px;
  max-width: 120px;
  object-fit: contain;
  border-radius: 8px;
}

.remove-pending {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #ef4444;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    background: #dc2626;
  }
}

/* Slide up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* 创建群组按钮 */
.create-group-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  margin: 12px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
}

/* 群组头像容器 */
.group-avatar-container {
  width: 56px;
  height: 56px;
  margin-right: 16px;
  flex-shrink: 0;
}

.group-avatars {
  width: 100%;
  height: 100%;
  display: grid;
  gap: 2px;
  border-radius: 12px;
  overflow: hidden;
  background: #e5e7eb;

  &.avatars-1 {
    grid-template: 1fr / 1fr;
  }
  &.avatars-2 {
    grid-template: 1fr / 1fr 1fr;
  }
  &.avatars-3 {
    grid-template: 1fr 1fr / 1fr 1fr;
    .group-avatar-img:first-child {
      grid-column: span 2;
    }
  }
  &.avatars-4 {
    grid-template: 1fr 1fr / 1fr 1fr;
  }
}

.group-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 群组项 */
.group-item {
  position: relative;
}

.member-count {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 10px;
}

.last-sender {
  color: #3b82f6;
  font-weight: 500;
}

.delete-group-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;

  .chat-item:hover & {
    opacity: 1;
  }

  &:hover {
    background: #fee2e2;
    color: #dc2626;
  }
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.member-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border-radius: 12px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: #f3f4f6;
  }

  &.selected {
    background: #dbeafe;
    border: 2px solid #3b82f6;
  }
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.member-name {
  font-size: 12px;
  color: #374151;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #3b82f6;
  font-size: 12px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  border: none;
  color: #374151;

  &:hover {
    background: #e5e7eb;
  }
}

.btn-confirm {
  background: #3b82f6;
  border: none;
  color: white;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
}

/* 设置按钮 */
.settings-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  i {
    font-size: 16px;
  }
}

/* 群组设置弹窗 */
.group-settings-modal {
  max-width: 450px;
}

.avatar-upload-row,
.bg-upload-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-avatar {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
  flex-shrink: 0;
}

.preview-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bg-preview {
  width: 120px;
  height: 68px;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  flex-shrink: 0;

  span {
    font-size: 12px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
}

.upload-btns {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  background: #f3f4f6;
  border: none;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }

  &.reset {
    color: #dc2626;
  }

  i {
    font-size: 12px;
  }
}

.member-grid.compact {
  grid-template-columns: repeat(4, 1fr);
  max-height: 200px;

  .member-option {
    padding: 8px 4px;
  }

  .member-avatar {
    width: 36px;
    height: 36px;
  }

  .member-name {
    font-size: 10px;
  }
}

.delete-group-text-btn {
  margin-top: 16px;
  width: 100%;
  padding: 12px;
  border: none;
  background: transparent;
  color: #dc2626;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;

  &:hover {
    background: #fee2e2;
  }

  i {
    margin-right: 6px;
  }
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.list-padding {
  height: 80px;
}

/* Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease-out;
}

.slide-left-enter-from {
  transform: translateX(100%);
}
.slide-left-leave-to {
  transform: translateX(-20%);
  opacity: 0.8;
}

.slide-right-enter-from {
  transform: translateX(-20%);
  opacity: 0.8;
}
.slide-right-leave-to {
  transform: translateX(100%);
  z-index: 10;
}
</style>
