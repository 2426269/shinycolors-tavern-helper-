<template>
  <div class="twesta-app">
    <!-- 顶部标题栏（蓝->粉渐变） -->
    <div class="app-header">
      <button class="back-btn" @click="handleBack">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>

      <div class="logo">
        <span class="logo-text">Twesta</span>
      </div>

      <button class="favorite-btn" :class="{ active: showFollowedOnly }" @click="toggleFollowedOnly">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path
            fill="currentColor"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
      </button>

      <!-- 装饰星星 -->
      <div class="stars">
        <span class="star star-1">✦</span>
        <span class="star star-2">✧</span>
        <span class="star star-3">✦</span>
        <span class="star star-4">✧</span>
      </div>
    </div>

    <!-- 时间线视图 -->
    <div v-if="currentView === 'timeline'" class="tweet-list">
      <!-- 筛选标签 -->
      <div class="filter-bar">
        <span class="filter-label" :class="{ active: !showFollowedOnly }" @click="showFollowedOnly = false">全部</span>
        <span class="filter-label" :class="{ active: showFollowedOnly }" @click="showFollowedOnly = true">已关注</span>
      </div>

      <div v-if="displayedTweets.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <span class="empty-text">还没有推文</span>
      </div>

      <!-- 推文列表 -->
      <div v-for="tweet in displayedTweets" :key="tweet.id" class="tweet-item" @click="openTweetDetail(tweet)">
        <!-- 转发标记 -->
        <div v-if="tweet.originalTweet" class="retweet-indicator">
          <i class="fas fa-retweet"></i> {{ tweet.name }} 转发
        </div>

        <!-- 头像和用户名 -->
        <div class="tweet-header">
          <div class="user-info">
            <img :src="tweet.avatar" :alt="tweet.name" class="avatar" />
            <div class="user-meta">
              <span class="user-name">{{ tweet.name }}</span>
              <span class="tweet-time">{{ tweet.time }}</span>
            </div>
          </div>
          <button class="like-btn" :class="{ liked: tweet.likedByMe }" @click.stop="toggleLike(tweet)">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          </button>
        </div>

        <!-- 配图 -->
        <div v-if="tweet.image" class="tweet-image">
          <img :src="tweet.image" :alt="'Tweet image'" @click.stop="openImage(tweet.image)" />
        </div>

        <!-- 推文内容 -->
        <div class="tweet-content">
          <p class="tweet-text" v-html="formatTweetText(tweet.text)"></p>
        </div>

        <!-- 互动按钮 -->
        <div class="tweet-actions">
          <button class="action-btn" @click.stop="openCommentInput(tweet)">
            <i class="fas fa-comment"></i>
            <span>{{ tweet.comments?.length || 0 }}</span>
          </button>
          <button class="action-btn" @click.stop="openRetweetModal(tweet)">
            <i class="fas fa-retweet"></i>
            <span>{{ tweet.retweets || 0 }}</span>
          </button>
          <button class="action-btn" :class="{ active: tweet.likedByMe }" @click.stop="toggleLike(tweet)">
            <i class="fas fa-heart"></i>
            <span>{{ tweet.likes || 0 }}</span>
          </button>
        </div>

        <!-- 评论预览 (最多显示2条) -->
        <div v-if="tweet.comments && tweet.comments.length > 0" class="comments-preview">
          <div v-for="comment in tweet.comments.slice(0, 2)" :key="comment.id" class="comment-item">
            <img :src="comment.avatar" :alt="comment.name" class="comment-avatar" />
            <div class="comment-content">
              <span class="comment-name">{{ comment.name }}</span>
              <span class="comment-text">{{ comment.text }}</span>
            </div>
          </div>
          <div v-if="tweet.comments.length > 2" class="view-more-comments" @click.stop="openTweetDetail(tweet)">
            查看全部 {{ tweet.comments.length }} 条评论
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more" @click="loadMore">
        <span>加载更多</span>
      </div>

      <!-- 底部填充 -->
      <div class="list-padding"></div>
    </div>

    <!-- 推文详情视图 -->
    <div v-else-if="currentView === 'detail' && selectedTweet" class="tweet-detail">
      <div class="detail-tweet">
        <!-- 完整推文内容 -->
        <div class="tweet-header">
          <div class="user-info">
            <img :src="selectedTweet.avatar" :alt="selectedTweet.name" class="avatar avatar-large" />
            <div class="user-meta">
              <span class="user-name">{{ selectedTweet.name }}</span>
              <span class="tweet-time">{{ selectedTweet.time }}</span>
            </div>
          </div>
          <!-- 关注按钮 (仅偶像推文显示) -->
          <button
            v-if="selectedTweet.authorType === 'idol'"
            class="follow-btn"
            :class="{ following: isFollowing(selectedTweet.authorId) }"
            @click="toggleFollow(selectedTweet.authorId)"
          >
            {{ isFollowing(selectedTweet.authorId) ? '已关注' : '关注' }}
          </button>
        </div>

        <!-- 节奏进度条 (仅偶像推文显示) -->
        <div v-if="selectedTweet.authorType === 'idol'" class="drama-progress-bar">
          <div class="drama-label">
            <span>节奏值</span>
            <span class="drama-value">{{ getDramaProgress(selectedTweet.authorId) }}%</span>
          </div>
          <div class="drama-track">
            <div class="drama-fill" :style="{ width: getDramaProgress(selectedTweet.authorId) + '%' }"></div>
          </div>
        </div>

        <div v-if="selectedTweet.image" class="tweet-image">
          <img :src="selectedTweet.image" @click="openImage(selectedTweet.image)" />
        </div>

        <div class="tweet-content">
          <p class="tweet-text" v-html="formatTweetText(selectedTweet.text)"></p>
        </div>

        <div class="tweet-stats">
          <span
            ><strong>{{ selectedTweet.likes || 0 }}</strong> 喜欢</span
          >
          <span
            ><strong>{{ selectedTweet.retweets || 0 }}</strong> 转发</span
          >
          <span
            ><strong>{{ selectedTweet.comments?.length || 0 }}</strong> 评论</span
          >
        </div>

        <div class="tweet-actions detail-actions">
          <button class="action-btn" @click="showCommentInput = true"><i class="fas fa-comment"></i> 评论</button>
          <button class="action-btn" @click="openRetweetModal(selectedTweet)">
            <i class="fas fa-retweet"></i> 转发
          </button>
          <button class="action-btn" :class="{ active: selectedTweet.likedByMe }" @click="toggleLike(selectedTweet)">
            <i class="fas fa-heart"></i> 喜欢
          </button>
          <!-- 删除按钮 (仅制作人自己的推文可见) -->
          <button
            v-if="selectedTweet.authorType === 'producer'"
            class="action-btn delete-btn"
            @click="deleteTweet(selectedTweet)"
          >
            <i class="fas fa-trash"></i> 删除
          </button>
        </div>
      </div>

      <!-- 评论输入框 -->
      <div v-if="showCommentInput" class="comment-input-area">
        <textarea v-model="commentText" placeholder="写下你的评论..." rows="2"></textarea>
        <div class="input-actions">
          <button class="cancel-btn" @click="showCommentInput = false">取消</button>
          <button class="send-btn" :disabled="!commentText.trim()" @click="submitComment">发送</button>
        </div>
      </div>

      <!-- 完整评论列表 -->
      <div class="comments-section">
        <h3 class="comments-title">评论 ({{ selectedTweet.comments?.length || 0 }})</h3>

        <div v-for="comment in selectedTweet.comments" :key="comment.id" class="comment-full">
          <div class="comment-main">
            <img :src="comment.avatar" :alt="comment.name" class="comment-avatar" />
            <div class="comment-body">
              <div class="comment-header">
                <span class="comment-name">{{ comment.name }}</span>
                <span class="comment-time">{{ comment.time }}</span>
              </div>
              <p class="comment-text">{{ comment.text }}</p>
              <button class="reply-btn" @click="startReply(comment)">回复</button>
            </div>
          </div>

          <!-- 楼中楼回复 (最多2层) -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies-section">
            <div v-for="reply in comment.replies.slice(0, 3)" :key="reply.id" class="reply-item">
              <img :src="reply.avatar" :alt="reply.name" class="reply-avatar" />
              <div class="reply-body">
                <span class="reply-name">{{ reply.name }}</span>
                <span class="reply-text">{{ reply.text }}</span>
              </div>
            </div>
            <div v-if="comment.replies.length > 3" class="view-more-replies">
              查看更多回复 ({{ comment.replies.length - 3 }})
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 转发弹窗 -->
    <div v-if="showRetweetModal" class="modal-overlay" @click="showRetweetModal = false">
      <div class="retweet-modal" @click.stop>
        <h3>转发推文</h3>
        <textarea v-model="retweetText" placeholder="添加评论（可选）..." rows="3"></textarea>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showRetweetModal = false">取消</button>
          <button class="send-btn" @click="submitRetweet">转发</button>
        </div>
      </div>
    </div>

    <!-- 浮动发帖按钮 (仿推特) -->
    <button class="fab-compose" title="发推" @click="openComposeModal">
      <i class="fas fa-feather-alt"></i>
    </button>

    <!-- 发帖弹窗 -->
    <div v-if="showComposeModal" class="modal-overlay" @click="showComposeModal = false">
      <div class="compose-modal" @click.stop>
        <div class="compose-header">
          <button class="close-btn" @click="closeComposeModal">
            <i class="fas fa-times"></i>
          </button>
          <h3>发布推文</h3>
          <button class="post-btn" :disabled="!canSubmitPost" @click="submitPost">发推</button>
        </div>

        <div class="compose-body">
          <div class="compose-user">
            <img :src="producerAvatar" alt="制作人" class="compose-avatar" />
            <!-- 账号切换下拉 -->
            <select v-model="activeAccountId" class="account-switcher">
              <option value="main">{{ twestaData.userProfile.mainAccount.name || '制作人' }}</option>
              <option v-for="alt in twestaData.userProfile.altAccounts" :key="alt.id" :value="alt.id">
                {{ alt.name }} (小号)
              </option>
              <option value="_create_new_">＋ 创建小号</option>
            </select>
          </div>
          <textarea
            v-model="composeText"
            placeholder="有什么新鲜事想分享？"
            rows="4"
            class="compose-textarea"
          ></textarea>

          <!-- 图片预览 -->
          <div v-if="composeImage" class="compose-image-preview">
            <img :src="composeImage" alt="预览图片" />
            <button class="remove-image-btn" @click="removeComposeImage">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="compose-footer">
          <!-- 操作按钮 -->
          <div class="compose-actions">
            <button class="action-icon-btn" title="添加图片" @click="triggerImageUpload">
              <i class="fas fa-image"></i>
            </button>
          </div>
          <span class="char-count" :class="{ warning: composeText.length > 200 }"> {{ composeText.length }}/280 </span>
        </div>

        <!-- 隐藏的文件上传 input -->
        <input
          ref="composeImageInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleComposeImageUpload"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  generateFanReplyToProducer,
  generateIdolReplyToProducer,
  generateRepliesToProducerPost,
  loadTwestaData,
  saveTwestaData,
} from '../composables/useTwestaScheduler';
import { getTwestaAvatarUrl } from '../数据/TwestaAssets';
import { TweetComment, TweetData } from '../数据/TwestaTypes';

const emit = defineEmits<{
  (e: 'back'): void;
}>();

// ========== 视图状态 ==========
type ViewType = 'timeline' | 'detail';
const currentView = ref<ViewType>('timeline');
const selectedTweet = ref<TweetData | null>(null);

// ========== 数据状态 ==========
const twestaData = ref(loadTwestaData());
const tweets = computed(() => twestaData.value.tweets);

// ========== 过滤状态 ==========
const showFollowedOnly = ref(false);
const displayLimit = ref(20);
const hasMore = computed(() => displayedTweets.value.length < filteredTweets.value.length);

// ========== 输入状态 ==========
const showCommentInput = ref(false);
const commentText = ref('');
const showRetweetModal = ref(false);
const retweetText = ref('');
const retweetTarget = ref<TweetData | null>(null);
const replyTarget = ref<TweetComment | null>(null);

// ========== 发帖状态 ==========
const showComposeModal = ref(false);
const composeText = ref('');
const composeImage = ref<string | null>(null);
const composeImageInput = ref<HTMLInputElement | null>(null);
const canSubmitPost = computed(() => composeText.value.trim() || composeImage.value);

// ========== 小号状态 ==========
// 'main' 或 小号 ID
const activeAccountId = ref<string>('main');
const activeAccount = computed(() => {
  if (activeAccountId.value === 'main') {
    return {
      id: 'main',
      name: twestaData.value.userProfile.mainAccount.name || '制作人',
      avatar: getTwestaAvatarUrl('Producer'),
      isAlt: false,
    };
  }
  const alt = twestaData.value.userProfile.altAccounts.find(a => a.id === activeAccountId.value);
  if (alt) {
    return {
      id: alt.id,
      name: alt.name,
      avatar: alt.avatar || getTwestaAvatarUrl('Producer'),
      isAlt: true,
    };
  }
  // fallback
  return {
    id: 'main',
    name: twestaData.value.userProfile.mainAccount.name || '制作人',
    avatar: getTwestaAvatarUrl('Producer'),
    isAlt: false,
  };
});

// ========== 制作人信息 (使用当前激活账号) ==========
const producerName = computed(() => activeAccount.value.name);
const producerAvatar = computed(() => activeAccount.value.avatar);

// ========== 计算属性 ==========
const filteredTweets = computed(() => {
  let result = [...tweets.value].sort((a, b) => b.timestamp - a.timestamp);

  if (showFollowedOnly.value) {
    const followedIdols = twestaData.value.userProfile.followedIdols;
    result = result.filter(t => followedIdols.includes(t.authorId));
  }

  return result;
});

const displayedTweets = computed(() => {
  return filteredTweets.value.slice(0, displayLimit.value);
});

// ========== 方法 ==========
function handleBack() {
  if (currentView.value === 'detail') {
    currentView.value = 'timeline';
    selectedTweet.value = null;
  } else {
    emit('back');
  }
}

function toggleFollowedOnly() {
  showFollowedOnly.value = !showFollowedOnly.value;
}

// ========== 小号管理 ==========
// 监听账号切换，处理创建新小号
watch(activeAccountId, newVal => {
  if (newVal === '_create_new_') {
    const name = prompt('请输入小号名称:');
    if (name && name.trim()) {
      createAltAccount(name.trim());
    } else {
      // 取消创建，切回主账号
      activeAccountId.value = 'main';
    }
  }
});

function createAltAccount(name: string) {
  const newAlt = {
    id: `alt_${Date.now()}`,
    name,
    avatar: undefined, // 使用默认头像
  };
  twestaData.value.userProfile.altAccounts.push(newAlt);
  saveTwestaData(twestaData.value);
  activeAccountId.value = newAlt.id;
  console.log('[Twesta] Created alt account:', name);
}

function toggleLike(tweet: TweetData) {
  tweet.likedByMe = !tweet.likedByMe;
  tweet.likes = (tweet.likes || 0) + (tweet.likedByMe ? 1 : -1);
  saveTwestaData(twestaData.value);
}

function openImage(imageUrl: string) {
  window.open(imageUrl, '_blank');
}

function formatTweetText(text: string): string {
  return text.replace(/(#\S+)/g, '<span class="hashtag">$1</span>');
}

function openTweetDetail(tweet: TweetData) {
  selectedTweet.value = tweet;
  currentView.value = 'detail';
}

function openCommentInput(tweet: TweetData) {
  selectedTweet.value = tweet;
  currentView.value = 'detail';
  showCommentInput.value = true;
}

function openRetweetModal(tweet: TweetData) {
  retweetTarget.value = tweet;
  retweetText.value = '';
  showRetweetModal.value = true;
}

function startReply(comment: TweetComment) {
  replyTarget.value = comment;
  commentText.value = `@${comment.name} `;
  showCommentInput.value = true;
}

function loadMore() {
  displayLimit.value += 20;
}

// ========== 关注功能 ==========
function isFollowing(idolId: string): boolean {
  return twestaData.value.userProfile.followedIdols.includes(idolId);
}

function toggleFollow(idolId: string) {
  const followedIdols = twestaData.value.userProfile.followedIdols;
  const index = followedIdols.indexOf(idolId);
  if (index > -1) {
    followedIdols.splice(index, 1);
  } else {
    followedIdols.push(idolId);
  }
  saveTwestaData(twestaData.value);
}

// ========== 节奏进度 ==========
function getDramaProgress(idolId: string): number {
  const state = twestaData.value.idolDramaStates.find(s => s.idolId === idolId);
  return state?.rhythmGauge || 0;
}

// ========== 删除推文 ==========
function deleteTweet(tweet: TweetData) {
  if (tweet.authorType !== 'producer') return;

  if (!confirm('确定要删除这条推文吗？')) return;

  const index = twestaData.value.tweets.findIndex(t => t.id === tweet.id);
  if (index > -1) {
    twestaData.value.tweets.splice(index, 1);
    saveTwestaData(twestaData.value);
    // 返回时间线
    currentView.value = 'timeline';
    selectedTweet.value = null;
  }
}

async function submitComment() {
  if (!commentText.value.trim() || !selectedTweet.value) return;

  // TODO: 调用AI生成回复
  const producerComment: TweetComment = {
    id: `comment_${Date.now()}`,
    authorId: 'Producer',
    authorType: 'producer',
    name: twestaData.value.userProfile.mainAccount.name || '制作人',
    avatar: getTwestaAvatarUrl('Producer'),
    text: commentText.value,
    time: new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    likes: 0,
    likedByMe: false,
    replies: [],
    stageType: 'FRONT',
  };

  if (!selectedTweet.value.comments) {
    selectedTweet.value.comments = [];
  }

  // 如果有 replyTarget，则将评论添加为该评论的回复
  if (replyTarget.value) {
    const targetComment = selectedTweet.value.comments.find(c => c.id === replyTarget.value!.id);
    if (targetComment) {
      if (!targetComment.replies) targetComment.replies = [];
      targetComment.replies.push(producerComment);
    }
  } else {
    // 直接评论推文
    selectedTweet.value.comments.push(producerComment);
  }

  saveTwestaData(twestaData.value);
  const savedReplyTarget = replyTarget.value; // 保存回复目标引用
  commentText.value = '';
  showCommentInput.value = false;
  replyTarget.value = null;

  // 触发AI生成回复 (异步，不阻塞UI)
  // 1. 如果回复的是偶像的推文，偶像会回复
  if (!savedReplyTarget && selectedTweet.value.authorType === 'idol') {
    generateIdolReplyToProducer(selectedTweet.value, producerComment).then(idolReply => {
      if (idolReply && selectedTweet.value) {
        const targetComment = selectedTweet.value.comments.find(c => c.id === producerComment.id);
        if (targetComment) {
          if (!targetComment.replies) targetComment.replies = [];
          targetComment.replies.push(idolReply);
          saveTwestaData(twestaData.value);
          console.log('[Twesta] Idol reply generated:', idolReply.text.slice(0, 30));
        }
      }
    });
  }

  // 2. 如果回复的是粉丝/黑粉的评论，调用 AI 生成该粉丝/黑粉的回复
  if (savedReplyTarget && (savedReplyTarget.authorType === 'fan' || savedReplyTarget.authorType === 'anti')) {
    generateFanReplyToProducer(savedReplyTarget, producerComment).then(fanReply => {
      if (fanReply && selectedTweet.value) {
        // 找到原评论并添加回复
        const targetComment = selectedTweet.value.comments.find(c => c.id === savedReplyTarget.id);
        if (targetComment) {
          if (!targetComment.replies) targetComment.replies = [];
          targetComment.replies.push(fanReply);
          saveTwestaData(twestaData.value);
          console.log(`[Twesta] ${savedReplyTarget.authorType} reply generated:`, fanReply.text);
        }
      }
    });
  }
}

// ========== 发帖功能 ==========
function openComposeModal() {
  composeText.value = '';
  composeImage.value = null;
  showComposeModal.value = true;
}

function closeComposeModal() {
  composeText.value = '';
  composeImage.value = null;
  showComposeModal.value = false;
}

function triggerImageUpload() {
  composeImageInput.value?.click();
}

function handleComposeImageUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    if (e.target?.result) {
      composeImage.value = e.target.result as string;
    }
  };
  reader.readAsDataURL(file);
  input.value = ''; // 重置 input 以便重复选择同一文件
}

function removeComposeImage() {
  composeImage.value = null;
}

async function submitPost() {
  if (!composeText.value.trim() && !composeImage.value) return;

  // 创建制作人发布的推文
  const producerTweet: TweetData = {
    id: `tweet_${Date.now()}`,
    authorId: 'Producer',
    authorType: 'producer',
    name: producerName.value,
    avatar: producerAvatar.value,
    text: composeText.value,
    image: composeImage.value || undefined, // 添加图片
    time: new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    likes: 0,
    likedByMe: false,
    retweets: 0,
    retweetedByMe: false,
    comments: [],
    stageType: 'FRONT',
  };

  // 添加到推文列表开头
  twestaData.value.tweets.unshift(producerTweet);
  saveTwestaData(twestaData.value);

  // 关闭弹窗并重置状态
  composeText.value = '';
  composeImage.value = null;
  showComposeModal.value = false;

  // 触发AI生成偶像/粉丝评论回复 (异步，不阻塞UI)
  generateRepliesToProducerPost(producerTweet).then(replies => {
    if (replies && replies.length > 0) {
      // 找到刚添加的推文并添加评论
      const targetTweet = twestaData.value.tweets.find(t => t.id === producerTweet.id);
      if (targetTweet) {
        if (!targetTweet.comments) targetTweet.comments = [];
        targetTweet.comments.push(...replies);
        saveTwestaData(twestaData.value);
        console.log(`[Twesta] Generated ${replies.length} replies to producer post`);
      }
    }
  });
}

function submitRetweet() {
  if (!retweetTarget.value) return;

  const retweetedTweet: TweetData = {
    id: `tweet_${Date.now()}`,
    authorId: 'Producer',
    authorType: 'producer',
    name: twestaData.value.userProfile.mainAccount.name || '制作人',
    avatar: getTwestaAvatarUrl('Producer'),
    text: retweetText.value || '',
    time: new Date().toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    likes: 0,
    likedByMe: false,
    retweets: 0,
    retweetedByMe: false,
    comments: [],
    originalTweet: retweetTarget.value,
    stageType: 'FRONT',
  };

  twestaData.value.tweets.unshift(retweetedTweet);
  retweetTarget.value.retweets = (retweetTarget.value.retweets || 0) + 1;

  saveTwestaData(twestaData.value);
  showRetweetModal.value = false;

  // 触发 AI 生成偶像/粉丝回复 (异步，不阻塞UI)
  if (retweetTarget.value.authorType === 'idol') {
    generateRepliesToProducerPost(retweetedTweet).then(replies => {
      if (replies && replies.length > 0 && selectedTweet.value) {
        // 找到转发推文并添加评论
        const tweet = twestaData.value.tweets.find(t => t.id === retweetedTweet.id);
        if (tweet) {
          if (!tweet.comments) tweet.comments = [];
          tweet.comments.push(...replies);
          saveTwestaData(twestaData.value);
          console.log(`[Twesta] Generated ${replies.length} replies to retweet`);
        }
      }
    });
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  // 监听数据更新事件
  window.addEventListener('twesta-data-updated', (e: any) => {
    twestaData.value = e.detail;
  });
});

// ========== 导出 ==========
defineExpose({
  tweets,
  refreshData: () => {
    twestaData.value = loadTwestaData();
  },
});
</script>

<style scoped lang="scss">
.twesta-app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  overflow: hidden;
}

/* 顶部标题栏 */
.app-header {
  position: relative;
  background: linear-gradient(135deg, #5fc8d8 0%, #88b4e8 30%, #d794c8 70%, #f5a0c0 100%);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
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
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
}

.logo {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
}

.logo-text {
  font-size: 28px;
  font-weight: 700;
  color: white;
  font-style: italic;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  letter-spacing: 1px;
}

.favorite-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  color: #e0a0b0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &.active {
    color: #ff6b8a;
    background: white;
  }
  &:hover {
    transform: scale(1.05);
  }
}

/* 装饰星星 */
.stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.star {
  position: absolute;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  animation: twinkle 2s ease-in-out infinite;
}

.star-1 {
  top: 15%;
  left: 15%;
}
.star-2 {
  top: 25%;
  right: 25%;
  animation-delay: 0.5s;
  font-size: 12px;
}
.star-3 {
  bottom: 20%;
  left: 30%;
  animation-delay: 1s;
  font-size: 14px;
}
.star-4 {
  bottom: 30%;
  right: 15%;
  animation-delay: 1.5s;
  font-size: 10px;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.filter-label {
  font-size: 14px;
  color: #999;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 16px;
  transition: all 0.2s;

  &.active {
    color: #5fc8d8;
    background: rgba(95, 200, 216, 0.1);
    font-weight: 600;
  }
}

/* 推文列表 */
.tweet-list {
  flex: 1;
  overflow-y: auto;
  background: #fff;
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
  padding: 80px 20px;
  color: #999;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  .empty-text {
    font-size: 16px;
  }
}

/* 单条推文 */
.tweet-item {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 20px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #fafafa;
  }
}

.retweet-indicator {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  i {
    margin-right: 4px;
  }
}

.tweet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-large {
  width: 56px;
  height: 56px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.tweet-time {
  font-size: 12px;
  color: #999;
}

.like-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &.liked {
    color: #ff6b8a;
  }
  &:hover {
    transform: scale(1.1);
  }
}

/* 配图 */
.tweet-image {
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;

  img {
    width: 100%;
    display: block;
    cursor: pointer;
    transition: transform 0.2s;
    &:hover {
      transform: scale(1.02);
    }
  }
}

/* 推文内容 */
.tweet-content {
  margin-bottom: 8px;
}

.tweet-text {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;

  :deep(.hashtag) {
    color: #5fc8d8;
    font-weight: 500;
  }
}

/* 互动按钮 */
.tweet-actions {
  display: flex;
  gap: 24px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: #999;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #5fc8d8;
  }
  &.active {
    color: #ff6b8a;
  }

  i {
    font-size: 14px;
  }
}

.detail-actions {
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

/* 评论预览 */
.comments-preview {
  margin-top: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 12px;
}

.comment-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.comment-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
  font-size: 13px;
  line-height: 1.4;
}

.comment-name {
  font-weight: 600;
  color: #333;
  margin-right: 6px;
}

.comment-text {
  color: #666;
}

.view-more-comments {
  font-size: 12px;
  color: #5fc8d8;
  cursor: pointer;
  margin-top: 8px;
  &:hover {
    text-decoration: underline;
  }
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 20px;
  color: #5fc8d8;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
}

.list-padding {
  height: 80px;
}

/* 详情页 */
.tweet-detail {
  flex: 1;
  overflow-y: auto;
}

.detail-tweet {
  padding: 20px;
  border-bottom: 8px solid #f5f5f5;
}

/* 关注按钮 */
.follow-btn {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(135deg, #1da1f2, #e0245e);
  color: #fff;
  border: none;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(29, 161, 242, 0.4);
  }

  &.following {
    background: #fff;
    color: #1da1f2;
    border: 1.5px solid #1da1f2;

    &:hover {
      background: rgba(29, 161, 242, 0.1);
    }
  }
}

/* 节奏进度条 */
.drama-progress-bar {
  margin: 12px 0;
  padding: 8px 12px;
  background: rgba(224, 36, 94, 0.08);
  border-radius: 8px;

  .drama-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #666;
    margin-bottom: 6px;

    .drama-value {
      color: #e0245e;
      font-weight: bold;
    }
  }

  .drama-track {
    height: 6px;
    background: #e1e8ed;
    border-radius: 3px;
    overflow: hidden;

    .drama-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff7eb3, #e0245e);
      transition: width 0.5s ease;
    }
  }
}

.tweet-stats {
  display: flex;
  gap: 24px;
  padding: 12px 0;
  font-size: 14px;
  color: #666;

  strong {
    color: #333;
  }
}

/* 评论输入 */
.comment-input-area {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;

  textarea {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    resize: none;
    outline: none;

    &:focus {
      border-color: #5fc8d8;
    }
  }

  .input-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 12px;
  }
}

.cancel-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  color: #666;
  cursor: pointer;
}

.send-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(135deg, #5fc8d8, #d794c8);
  color: white;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* 评论区 */
.comments-section {
  padding: 16px 20px;
}

.comments-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.comment-full {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-main {
  display: flex;
  gap: 12px;
}

.comment-body {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.reply-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;

  &:hover {
    color: #5fc8d8;
  }
}

/* 楼中楼 */
.replies-section {
  margin-left: 36px;
  margin-top: 12px;
  padding-left: 12px;
  border-left: 2px solid #f0f0f0;
}

.reply-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.reply-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.reply-body {
  font-size: 13px;
}

.reply-name {
  font-weight: 600;
  color: #333;
  margin-right: 6px;
}

.reply-text {
  color: #666;
}

.view-more-replies {
  font-size: 12px;
  color: #5fc8d8;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
}

/* 转发弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.retweet-modal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 400px;

  h3 {
    margin-bottom: 16px;
    color: #333;
  }

  textarea {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 12px;
    font-size: 14px;
    resize: none;
    outline: none;
    margin-bottom: 16px;

    &:focus {
      border-color: #5fc8d8;
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

/* 浮动发帖按钮 (仿推特) */
.fab-compose {
  position: fixed;
  bottom: 100px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5fc8d8, #d794c8);
  border: none;
  color: white;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(95, 200, 216, 0.4);
  transition: all 0.3s;
  z-index: 100;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(95, 200, 216, 0.5);
  }

  &:active {
    transform: scale(0.95);
  }
}

/* 发帖弹窗 */
.compose-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.compose-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: #333;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: #666;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #f0f0f0;
    }
  }

  .post-btn {
    padding: 8px 20px;
    border-radius: 20px;
    background: linear-gradient(135deg, #5fc8d8, #d794c8);
    border: none;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      filter: brightness(1.1);
    }
  }
}

.compose-body {
  padding: 16px;
  flex: 1;
}

.compose-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.compose-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.compose-username {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 账号切换下拉 */
.account-switcher {
  flex: 1;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  color: #333;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;

  &:hover {
    border-color: #1da1f2;
  }

  &:focus {
    outline: none;
    border-color: #1da1f2;
    box-shadow: 0 0 0 3px rgba(29, 161, 242, 0.1);
  }

  option {
    padding: 8px;
  }
}

.compose-textarea {
  width: 100%;
  border: none;
  outline: none;
  font-size: 16px;
  line-height: 1.5;
  resize: none;
  min-height: 100px;

  &::placeholder {
    color: #999;
  }
}

.compose-footer {
  padding: 12px 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compose-actions {
  display: flex;
  gap: 8px;
}

.action-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #5fc8d8;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(95, 200, 216, 0.1);
    transform: scale(1.1);
  }
}

.char-count {
  font-size: 13px;
  color: #999;

  &.warning {
    color: #ff6b8a;
  }
}

/* 图片预览 */
.compose-image-preview {
  position: relative;
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  max-height: 200px;

  img {
    width: 100%;
    height: auto;
    max-height: 200px;
    object-fit: cover;
    display: block;
  }
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
    transform: scale(1.1);
  }
}
</style>
