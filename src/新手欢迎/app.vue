<template>
  <div class="welcome-container">
    <div class="welcome-content">
      <!-- 标题 -->
      <h1 class="welcome-title">
        <i class="fas fa-star"></i>
        欢迎来到偶像大师闪耀色彩
        <i class="fas fa-star"></i>
      </h1>

      <!-- 标签页导航 -->
      <div class="tabs-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          <i :class="tab.icon"></i>
          {{ tab.name }}
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 欢迎致辞 -->
        <div v-if="currentTab === 'welcome'" class="content-section">
          <h2>【祝大家玩的开心！】</h2>
          <p>欢迎来到偶像大师闪耀色彩的世界！在这里，你将成为283事务所的制作人，培育偶像，见证她们的成长与闪耀。</p>
          <p>这是一个为SillyTavern平台设计的角色扮演体验，让你能与闪耀色彩的偶像们进行深度互动。</p>
        </div>

        <!-- 偶像介绍 -->
        <div v-if="currentTab === 'idols'" class="content-section idols-section">
          <h2>283事务所的偶像们</h2>
          <p class="idols-intro">这里有来自8个不同组合的28位个性鲜明的偶像。点击偶像卡片查看详细信息：</p>

          <!-- 组合标签 -->
          <div class="unit-filter">
            <button
              v-for="unit in units"
              :key="unit"
              class="unit-filter-btn"
              :class="{ active: selectedUnit === unit }"
              @click="selectedUnit = unit"
            >
              {{ unit }}
            </button>
          </div>

          <!-- 偶像网格 -->
          <div class="idols-grid">
            <div v-for="idol in filteredIdols" :key="idol.id" class="idol-card" @click="showIdolDetail(idol)">
              <div class="idol-image-wrapper">
                <img :src="idol.thumbnailUrl" :alt="idol.name" class="idol-thumb" loading="lazy" />
              </div>
              <div class="idol-info-brief">
                <h4>{{ idol.name }}</h4>
                <p class="idol-unit-tag">{{ idol.unit }}</p>
              </div>
            </div>
          </div>

          <!-- 偶像详情弹窗 -->
          <div v-if="selectedIdol" class="idol-detail-modal" @click="closeIdolDetail">
            <div class="idol-detail-content" @click.stop>
              <button class="detail-close-btn" @click="closeIdolDetail">
                <i class="fas fa-times"></i>
              </button>

              <div class="detail-layout">
                <div class="detail-left">
                  <img :src="selectedIdol.imageUrl" :alt="selectedIdol.name" class="detail-idol-image" />
                </div>

                <div class="detail-right">
                  <h3>{{ selectedIdol.name }}</h3>
                  <div class="detail-unit" :style="{ borderColor: selectedIdol.color }">
                    {{ selectedIdol.unit }}
                  </div>

                  <div class="detail-info-grid">
                    <div class="info-item">
                      <i class="fas fa-birthday-cake"></i>
                      <span>{{ selectedIdol.birthday }}</span>
                    </div>
                    <div class="info-item">
                      <i class="fas fa-ruler-vertical"></i>
                      <span>{{ selectedIdol.height }}</span>
                    </div>
                    <div class="info-item">
                      <i class="fas fa-microphone"></i>
                      <span>{{ selectedIdol.voiceActor }}</span>
                    </div>
                  </div>

                  <div class="detail-description">
                    <h4>角色简介</h4>
                    <p>{{ selectedIdol.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 玩法说明 -->
        <div v-if="currentTab === 'gameplay'" class="content-section">
          <h2>核心玩法</h2>
          <div class="gameplay-item">
            <i class="fas fa-gift"></i>
            <div>
              <strong>抽卡系统</strong>
              <p>使用羽石抽取角色卡，收集不同稀有度的卡片（UR/SSR/SR）</p>
            </div>
          </div>
          <div class="gameplay-item">
            <i class="fas fa-book"></i>
            <div>
              <strong>偶像图鉴</strong>
              <p>查看已获得的角色卡，了解角色信息</p>
            </div>
          </div>
          <div class="gameplay-item">
            <i class="fas fa-music"></i>
            <div>
              <strong>音乐鉴赏</strong>
              <p>欣赏偶像们的歌曲，包含个人曲、组合曲和全体曲</p>
            </div>
          </div>
          <div class="gameplay-item">
            <i class="fas fa-chart-line"></i>
            <div>
              <strong>培育系统</strong>
              <p>（开发中）培养偶像，提升她们的能力</p>
            </div>
          </div>
        </div>

        <!-- 注意事项 -->
        <div v-if="currentTab === 'notes'" class="content-section">
          <h2>重要说明</h2>
          <div class="note-item warning">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <strong>必备前置：酒馆助手</strong>
              <p>本项目需要在SillyTavern中配合酒馆助手使用</p>
            </div>
          </div>
          <div class="note-item info">
            <i class="fas fa-info-circle"></i>
            <div>
              <strong>数据保存</strong>
              <p>游戏数据保存在浏览器localStorage中，清除浏览器数据将丢失进度</p>
            </div>
          </div>
          <div class="note-item tip">
            <i class="fas fa-lightbulb"></i>
            <div>
              <strong>开发工具</strong>
              <p>设置中包含开发工具，可用于测试（无限羽石、解锁全部角色等）</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 进入游戏按钮 -->
      <button class="enter-game-btn" @click="enterGame">
        <i class="fas fa-play"></i>
        进入游戏
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

// GitHub Release CDN基础路径
const CDN_BASE = 'https://github.com/2426269/shinycolors-assets/releases/download';

// 标签页配置
const tabs = [
  { id: 'welcome', name: '欢迎致辞', icon: 'fas fa-home' },
  { id: 'idols', name: '偶像介绍', icon: 'fas fa-users' },
  { id: 'gameplay', name: '玩法说明', icon: 'fas fa-gamepad' },
  { id: 'notes', name: '注意事项', icon: 'fas fa-exclamation-circle' },
];

const currentTab = ref('welcome');

// 偶像介绍相关
const units = [
  '全部',
  'Illumination STARS',
  "L'Antica",
  'ALSTROEMERIA',
  'Straylight',
  'noctchill',
  '放学后CLIMAX GIRLS',
  'SHHis',
  'CoMETIK',
];

const selectedUnit = ref('全部');
const selectedIdol = ref<any>(null);

// 偶像数据（精简版）
const idolsData = [
  {
    id: 1,
    name: '樱木真乃',
    imageUrl: `${CDN_BASE}/人物立绘/illumination.STARS/樱木真乃/Mano_intial.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/illumination.STARS/樱木真乃/SC-Mano_Thumb.png`,
    age: '16岁',
    height: '154cm',
    birthday: '5月2日',
    unit: 'Illumination STARS',
    voiceActor: '成海瑠奈（初代）→ 希水汐',
    color: '#FFB6D9',
    description: '和蔼可亲的治愈系女孩，心地善良，易于激发保护欲的类型。仅仅待在一起就令人产生幸福感。',
  },
  {
    id: 2,
    name: '风野灯织',
    imageUrl: `${CDN_BASE}/人物立绘/illumination.STARS/风野灯织/Hiori_intial.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/illumination.STARS/风野灯织/thumb.png`,
    age: '16岁',
    height: '163cm',
    birthday: '8月13日',
    unit: 'Illumination STARS',
    voiceActor: '近藤玲奈',
    color: '#92CFBB',
    description: '扎在头后的黑发给人深刻印象的高冷系美少女。在得到自己认可之前不吝惜努力的克己的性格。',
  },
  {
    id: 3,
    name: '八宫巡',
    imageUrl: `${CDN_BASE}/人物立绘/illumination.STARS/八宫巡/Meguru_intial.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/illumination.STARS/八宫巡/thumb.png`,
    age: '16岁',
    height: '161cm',
    birthday: '7月28日',
    unit: 'Illumination STARS',
    voiceActor: '峯田茉优',
    color: '#FFEC47',
    description:
      '性格天真烂漫，无论对方是谁都会积极地搭话。富有活力、爱为朋友着想的女孩。父亲为日本人，母亲为美国人的混血儿。',
  },
  {
    id: 4,
    name: '月冈恋钟',
    imageUrl: `${CDN_BASE}/人物立绘/L'Antica/月冈恋钟/242px-Kogane_intial.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/L'Antica/月冈恋钟/thumb.png`,
    age: '17岁',
    height: '149cm',
    birthday: '10月2日',
    unit: "L'Antica",
    voiceActor: '礒部花凜',
    color: '#FFE012',
    description:
      '自信满满无论什么情况都积极乐观的性格，拥有引人注目的可爱程度与好身材，但也有常跌倒，会搞错舞步等笨手笨脚的一面。',
  },
  {
    id: 5,
    name: '田中摩美美',
    imageUrl: `${CDN_BASE}/人物立绘/L'Antica/田中摩美美/272px-Mamimi_intial.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/L'Antica/田中摩美美/thumb.png`,
    age: '18岁',
    height: '167cm',
    birthday: '4月12日',
    unit: "L'Antica",
    voiceActor: '菅沼千纱',
    color: '#EE762E',
    description:
      '讨厌麻烦事的消极系朋克女孩。虽然论身材与颜值都算出类拔萃的美少女，但对自己感兴趣的事情以外都漫不经心的性格。',
  },
  // 可以添加更多偶像...
];

// 过滤后的偶像列表
const filteredIdols = computed(() => {
  if (selectedUnit.value === '全部') {
    return idolsData;
  }
  return idolsData.filter(idol => idol.unit === selectedUnit.value);
});

/**
 * 显示偶像详情
 */
function showIdolDetail(idol: any) {
  selectedIdol.value = idol;
}

/**
 * 关闭偶像详情
 */
function closeIdolDetail() {
  selectedIdol.value = null;
}

/**
 * 进入游戏
 */
function enterGame() {
  // 设置标记表示已查看欢迎页面
  localStorage.setItem('shinycolors_welcome_viewed', 'true');
  toastr.success('欢迎来到283事务所！', '', { timeOut: 2000 });

  // 关闭当前页面（如果是在iframe中）
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'welcome_complete' }, '*');
  }
}
</script>

<style scoped lang="scss">
.welcome-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

.welcome-content {
  max-width: 900px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.welcome-title {
  text-align: center;
  font-size: 32px;
  color: #fff;
  margin: 0 0 30px 0;
  text-shadow: 0 0 20px rgba(167, 139, 250, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;

  i {
    color: #a78bfa;
    animation: starPulse 2s ease-in-out infinite;
  }
}

@keyframes starPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

.tabs-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.tab-btn {
  flex: 1;
  min-width: 150px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  i {
    font-size: 18px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(167, 139, 250, 0.5);
    color: #fff;
  }

  &.active {
    background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
    border-color: #a78bfa;
    color: #fff;
    box-shadow: 0 4px 15px rgba(167, 139, 250, 0.4);
  }
}

.tab-content {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  padding: 30px;
  min-height: 400px;
  margin-bottom: 30px;
  color: #fff;
}

.content-section {
  h2 {
    color: #a78bfa;
    font-size: 24px;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  p {
    line-height: 1.8;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 15px;
  }
}

.unit-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.unit-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px 20px;
  border-radius: 10px;
  border-left: 4px solid #a78bfa;
  display: flex;
  align-items: center;
  gap: 15px;

  i {
    font-size: 24px;
    color: #a78bfa;
  }

  strong {
    color: #ec4899;
    font-size: 18px;
  }
}

.gameplay-item,
.note-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
  gap: 15px;

  i {
    font-size: 28px;
    color: #a78bfa;
    flex-shrink: 0;
  }

  strong {
    font-size: 18px;
    color: #ec4899;
    display: block;
    margin-bottom: 8px;
  }

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
  }
}

.note-item {
  &.warning {
    border-left: 4px solid #f59e0b;
    i {
      color: #f59e0b;
    }
  }

  &.info {
    border-left: 4px solid #3b82f6;
    i {
      color: #3b82f6;
    }
  }

  &.tip {
    border-left: 4px solid #10b981;
    i {
      color: #10b981;
    }
  }
}

.enter-game-btn {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
  border: none;
  border-radius: 15px;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 6px 20px rgba(167, 139, 250, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;

  i {
    font-size: 28px;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(167, 139, 250, 0.6);
  }

  &:active {
    transform: translateY(-1px);
  }
}

/* ===== 偶像介绍样式 ===== */
.idols-section {
  .idols-intro {
    text-align: center;
    margin-bottom: 20px;
    font-size: 15px;
  }
}

.unit-filter {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.unit-filter-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }

  &.active {
    background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
    border-color: #a78bfa;
    color: #fff;
    box-shadow: 0 2px 10px rgba(167, 139, 250, 0.4);
  }
}

.idols-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(167, 139, 250, 0.5);
    border-radius: 10px;

    &:hover {
      background: rgba(167, 139, 250, 0.7);
    }
  }
}

.idol-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid rgba(255, 255, 255, 0.1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(167, 139, 250, 0.4);
    border-color: rgba(167, 139, 250, 0.6);
  }
}

.idol-image-wrapper {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(236, 72, 153, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
}

.idol-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.idol-info-brief {
  padding: 10px;
  text-align: center;

  h4 {
    margin: 0 0 5px 0;
    font-size: 14px;
    color: #fff;
  }

  .idol-unit-tag {
    margin: 0;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
  }
}

/* 偶像详情弹窗 */
.idol-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
  padding: 20px;
}

.idol-detail-content {
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  border-radius: 20px;
  padding: 30px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 2px solid rgba(167, 139, 250, 0.3);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.detail-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 0, 0, 0.3);
    color: #fff;
  }
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
  margin-top: 20px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.detail-idol-image {
  width: 100%;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.detail-right {
  h3 {
    font-size: 28px;
    color: #fff;
    margin: 0 0 15px 0;
  }
}

.detail-unit {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  border-left: 4px solid;
  background: rgba(255, 255, 255, 0.1);
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 20px;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.info-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-left: 3px solid #a78bfa;

  i {
    color: #a78bfa;
    font-size: 18px;
  }

  span {
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
  }
}

.detail-description {
  h4 {
    color: #a78bfa;
    font-size: 18px;
    margin: 0 0 10px 0;
  }

  p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 15px;
    line-height: 1.8;
    margin: 0;
  }
}
</style>


