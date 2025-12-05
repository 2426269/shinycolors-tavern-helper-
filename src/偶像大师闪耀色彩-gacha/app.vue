<template>
  <div class="gacha-system">
    <!-- 资源栏（不含等级） -->
    <ResourceBar :gems="props.resources.featherStones" :stardust="userData.stardust" />

    <div class="gacha-main">
      <!-- 左侧：卡池选择 -->
      <div class="pool-sidebar">
        <div class="pool-item active">
          <div class="pool-thumbnail">
            <img
              src="https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/卡池缩略图/星月夜を歩いて.webp"
              alt="星月夜を歩いて"
            />
          </div>
          <div class="pool-name">星月夜を歩いて</div>
        </div>
      </div>

      <!-- 右侧：抽卡区域 -->
      <div class="gacha-area">
        <!-- 全屏背景卡面 -->
        <div class="fullscreen-card-bg">
          <img
            src="https://raw.githubusercontent.com/2426269/shinycolors-assets-cdn/main/角色卡面/絵空靴 杜野凛世.webp"
            alt="【絵空靴】杜野凛世"
            class="bg-card-image"
            loading="lazy"
          />
          <div class="bg-overlay"></div>
        </div>

        <!-- 内容层 -->
        <div class="gacha-content">
          <div class="pool-header">
            <h2 class="pool-title">星月夜を歩いて</h2>
            <p class="pool-desc">【絵空靴】杜野凛世 期间限定</p>
            <div class="pickup-badge">
              <i class="fas fa-star"></i>
              PICKUP
            </div>
          </div>

          <!-- 抽卡概率按钮 -->
          <button class="show-rates-btn" @click="showRatesModal = true">
            <i class="fas fa-chart-bar"></i>
            抽卡概率
          </button>

          <!-- 占位区域 -->
          <div class="spacer"></div>

          <!-- 抽卡按钮 - 移到底部 -->
          <div class="gacha-buttons-bottom">
            <GachaButton
              type="single"
              :cost="GACHA_COST.SINGLE"
              :gems="props.resources.featherStones"
              @click="handleSinglePull"
            />
            <GachaButton
              type="ten"
              :cost="GACHA_COST.TEN"
              :gems="props.resources.featherStones"
              @click="handleTenPull"
            />
          </div>
        </div>

        <!-- 开发调试工具 -->
        <div v-if="isDev" class="dev-tools">
          <button @click="devAddGems(10000)">+10000羽石</button>
          <button @click="devSetPity(89, 199)">设置保底(SSR 89, UR 199)</button>
          <button @click="devReset">重置数据</button>
        </div>
      </div>
    </div>

    <!-- 抽卡概率弹窗 -->
    <div v-if="showRatesModal" class="rates-modal" @click="showRatesModal = false">
      <div class="rates-content" @click.stop>
        <button class="close-btn" @click="showRatesModal = false">
          <i class="fas fa-times"></i>
        </button>
        <h3>抽卡结果概率</h3>

        <!-- 总体概率（已移除R卡） -->
        <div class="rates-grid">
          <div class="rate-item ur">
            <span class="rarity">UR</span>
            <span class="percentage">2.00%</span>
          </div>
          <div class="rate-item ssr">
            <span class="rarity">SSR</span>
            <span class="percentage">20.00%</span>
          </div>
          <div class="rate-item sr">
            <span class="rarity">SR</span>
            <span class="percentage">78.00%</span>
          </div>
        </div>

        <!-- 卡池详情 -->
        <div class="pool-details">
          <h4>卡池所含偶像一览</h4>

          <!-- UR卡列表 -->
          <div class="rarity-section ur-section">
            <div class="section-header">
              <span class="section-title">UR Produce型偶像（{{ cardProbabilities.UR.length }}种）</span>
            </div>
            <div class="card-list">
              <div v-for="card in cardProbabilities.UR" :key="card.fullName" class="card-row">
                <span class="card-name">
                  {{ card.fullName }}
                  <i v-if="card.isPickup" class="fas fa-star pickup-star"></i>
                </span>
                <span class="card-prob">{{ card.probability.toFixed(4) }}%</span>
              </div>
            </div>
          </div>

          <!-- SSR卡列表 -->
          <div class="rarity-section ssr-section">
            <div class="section-header">
              <span class="section-title">SSR Produce型偶像（{{ cardProbabilities.SSR.length }}种）</span>
            </div>
            <div class="card-list collapsed">
              <div v-for="card in cardProbabilities.SSR" :key="card.fullName" class="card-row">
                <span class="card-name">{{ card.fullName }}</span>
                <span class="card-prob">{{ card.probability.toFixed(4) }}%</span>
              </div>
            </div>
          </div>

          <!-- SR卡列表 -->
          <div class="rarity-section sr-section">
            <div class="section-header">
              <span class="section-title">SR Produce型偶像（{{ cardProbabilities.SR.length }}种）</span>
            </div>
            <div class="card-list collapsed">
              <div v-for="card in cardProbabilities.SR" :key="card.fullName" class="card-row">
                <span class="card-name">{{ card.fullName }}</span>
                <span class="card-prob">{{ card.probability.toFixed(4) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 抽卡动画 -->
    <GachaAnimation :results="currentResults" :is-animating="isAnimating" @complete="handleAnimationComplete" />

    <!-- 结果弹窗 -->
    <ResultDisplay v-if="showResult" :results="currentResults" @close="handleCloseResult" @again="handlePullAgain" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { GACHA_COST } from './constants';
import { getAvailableCardPools, performSinglePullReal, performTenPullReal } from './gacha-core-real';
import type { GachaResult, GachaUserData } from './types';
import { preloadCommonSSRCards, preloadPickupCard } from './utils/image-preloader';
import { loadUserData, resetUserData, saveUserData } from './utils/storage';

import GachaAnimation from './components/GachaAnimation.vue';
import GachaButton from './components/GachaButton.vue';
import ResourceBar from './components/ResourceBar.vue';
import ResultDisplay from './components/ResultDisplay.vue';

// 接收主界面传入的 resources（包含羽石）
const props = defineProps<{
  resources: {
    featherStones: number;
    fans: number;
  };
}>();

const emit = defineEmits<{
  'update:featherStones': [value: number];
}>();

// 用户数据（不再包含羽石，羽石由主界面管理）
const userData = ref<GachaUserData>({
  stardust: 0,
  level: 1,
  exp: 0,
  ownedCards: {},
  pity: { totalPulls: 0, ssrPity: 0, urPity: 0 },
  history: [],
});

// UI状态
const showResult = ref(false);
const showRatesModal = ref(false); // 概率弹窗显示状态
const currentResults = ref<GachaResult[]>([]);
const lastPullType = ref<'single' | 'ten'>('single');
const isAnimating = ref(false); // 抽卡动画播放状态

// 开发模式（可以在控制台设置 window.GACHA_DEV = true）
const isDev = ref(false);

// 计算各卡概率（基于当前卡池，已移除R卡）
const cardProbabilities = computed(() => {
  const RATES_PERCENT = {
    UR: 2.0, // 2%
    SSR: 20.0, // 20%
    SR: 78.0, // 78%
  };

  const availablePools = getAvailableCardPools();

  // UP角色概率特殊处理：50% * 2% = 1%
  // 其他UR：(50% * 2%) / (其他UR数量)
  const urCards = availablePools.UR;
  const pickupCard = urCards.find(card => card.isPickup);
  const otherURCards = urCards.filter(card => !card.isPickup);

  const urProbabilities = [
    ...(pickupCard
      ? [
          {
            ...pickupCard,
            probability: RATES_PERCENT.UR * 0.5, // UP角色: 1%
          },
        ]
      : []),
    ...otherURCards.map(card => ({
      ...card,
      probability: otherURCards.length > 0 ? (RATES_PERCENT.UR * 0.5) / otherURCards.length : 0, // 其他UR平分剩余1%
    })),
  ];

  return {
    // UR卡：UP角色1%，其他UR平分1%
    UR: urProbabilities,

    // SSR卡：平均分配概率
    SSR: availablePools.SSR.map(card => ({
      ...card,
      probability: RATES_PERCENT.SSR / availablePools.SSR.length,
    })),

    // SR卡：平均分配概率
    SR: availablePools.SR.map(card => ({
      ...card,
      probability: RATES_PERCENT.SR / availablePools.SR.length,
    })),
  };
});

// 单抽
function handleSinglePull() {
  if (props.resources.featherStones < GACHA_COST.SINGLE) {
    toastr.error('羽石不足！', '', { timeOut: 2000 });
    return;
  }

  emit('update:featherStones', props.resources.featherStones - GACHA_COST.SINGLE);

  try {
    const result = performSinglePullReal(userData.value);
    currentResults.value = [result];
    lastPullType.value = 'single';

    // 播放抽卡动画
    isAnimating.value = true;

    saveUserData(userData.value);
  } catch (error) {
    console.error('抽卡失败:', error);
    toastr.error('抽卡失败！');
    emit('update:featherStones', props.resources.featherStones + GACHA_COST.SINGLE); // 退回羽石
  }
}

// 十连
function handleTenPull() {
  if (props.resources.featherStones < GACHA_COST.TEN) {
    toastr.error('羽石不足！', '', { timeOut: 2000 });
    return;
  }

  emit('update:featherStones', props.resources.featherStones - GACHA_COST.TEN);

  try {
    const results = performTenPullReal(userData.value);
    currentResults.value = results;
    lastPullType.value = 'ten';

    // 播放抽卡动画
    isAnimating.value = true;

    saveUserData(userData.value);

    // 检查是否有SSR+（等动画完成后再提示）
  } catch (error) {
    console.error('抽卡失败:', error);
    toastr.error('抽卡失败！');
    emit('update:featherStones', props.resources.featherStones + GACHA_COST.TEN); // 退回羽石
  }
}

// 抽卡动画完成
function handleAnimationComplete() {
  isAnimating.value = false;
  showResult.value = true;

  // 保存抽卡结果到localStorage
  saveGachaResults(currentResults.value);

  // 检查是否有SSR+
  const hasSSRPlus = currentResults.value.some(r => r.rarity === 'SSR' || r.rarity === 'UR');
  if (hasSSRPlus) {
    toastr.success('恭喜获得SSR以上卡片！', '', { timeOut: 3000 });
  }
}

/**
 * 保存抽卡结果到localStorage
 */
function saveGachaResults(results: GachaResult[]) {
  try {
    const GACHA_RESULTS_KEY = 'shinycolors_gacha_results';

    // 读取现有记录
    const existingData = localStorage.getItem(GACHA_RESULTS_KEY);
    let gachaHistory: Array<{
      timestamp: string;
      type: 'single' | 'ten';
      results: Array<{
        cardName: string;
        characterName: string;
        rarity: string;
        isNew: boolean;
      }>;
    }> = existingData ? JSON.parse(existingData) : [];

    // 添加新记录
    gachaHistory.push({
      timestamp: new Date().toISOString(),
      type: lastPullType.value,
      results: results.map(r => ({
        cardName: r.fullCardName,
        characterName: r.characterName,
        rarity: r.rarity,
        isNew: r.isNew,
      })),
    });

    // 只保留最近100次抽卡记录
    if (gachaHistory.length > 100) {
      gachaHistory = gachaHistory.slice(-100);
    }

    // 抽卡记录现在包含在userData.history中
    // 这里不再需要单独保存，因为已经在saveUserData中保存到IndexedDB
    console.log('💾 抽卡结果已保存到IndexedDB:', {
      总记录数: gachaHistory.length,
      本次抽卡: results.length,
    });
  } catch (error) {
    console.error('保存抽卡结果失败:', error);
  }
}

// 关闭结果
function handleCloseResult() {
  showResult.value = false;
}

// 再抽一次
function handlePullAgain() {
  showResult.value = false;
  if (lastPullType.value === 'single') {
    handleSinglePull();
  } else {
    handleTenPull();
  }
}

// 开发工具函数
function devAddGems(amount: number) {
  emit('update:featherStones', props.resources.featherStones + amount);
  toastr.success(`已添加${amount}羽石！`);
}

function devSetPity(ssr: number, ur: number) {
  userData.value.pity.ssrPity = ssr;
  userData.value.pity.urPity = ur;
  saveUserData(userData.value);
  toastr.success(`保底已设置：SSR ${ssr}, UR ${ur}`);
}

async function devReset() {
  if (confirm('确定要重置所有数据吗？')) {
    await resetUserData();
    userData.value = await loadUserData();
  }
}

// 加载时
onMounted(async () => {
  // 异步加载用户数据
  userData.value = await loadUserData();

  toastr.success('抽卡系统加载成功！', '', { timeOut: 2000 });

  // 检查开发模式
  if ((window as any).GACHA_DEV) {
    isDev.value = true;
  }

  // 预加载关键图片
  preloadPickupCard(); // 高优先级：UP角色卡
  preloadCommonSSRCards(10); // 后台加载：常见SSR
});
</script>

<style scoped lang="scss">
.gacha-system {
  padding: 20px;
  height: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
}

.gacha-main {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 25px;
  margin-top: 25px;
  flex: 1;
  align-items: stretch;
}

.pool-sidebar {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  .pool-item {
    padding: 15px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;

    &.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    &:hover:not(.active) {
      background: #f5f5f5;
    }

    .pool-thumbnail {
      width: 100%;
      aspect-ratio: 16 / 9;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      border-radius: 8px;
      margin-bottom: 10px;
      overflow: hidden;
      position: relative;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
    }

    .pool-name {
      text-align: center;
      font-weight: bold;
    }
  }
}

.gacha-area {
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  height: 100%;
}

.fullscreen-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;

  .bg-card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .bg-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.5) 100%);
  }
}

.gacha-content {
  position: relative;
  z-index: 1;
  padding: 35px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pool-header {
  text-align: center;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  .pool-title {
    font-size: 32px;
    margin: 0 0 10px 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
  }

  .pool-desc {
    font-size: 16px;
    color: #666;
    margin: 0 0 15px 0;
  }

  .pickup-badge {
    display: inline-block;
    padding: 8px 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%);
    color: white;
    font-weight: bold;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
    animation: pickupPulse 2s ease-in-out infinite;

    i {
      margin-right: 6px;
      animation: starRotate 4s linear infinite;
    }
  }
}

@keyframes pickupPulse {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
  }
  50% {
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
  }
}

@keyframes starRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.pool-rates {
  margin-bottom: 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;

  h3 {
    margin: 0 0 15px 0;
    font-size: 18px;
    color: #333;
  }

  .rates-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .rate-item {
    padding: 12px;
    border-radius: 8px;
    text-align: center;

    &.ur {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    }

    &.ssr {
      background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
      color: white;
    }

    &.sr {
      background: linear-gradient(135deg, #9370db 0%, #ba55d3 100%);
      color: white;
    }

    &.r {
      background: linear-gradient(135deg, #999 0%, #bbb 100%);
      color: white;
    }

    .rarity {
      display: block;
      font-weight: bold;
      font-size: 16px;
      margin-bottom: 5px;
    }

    .percentage {
      display: block;
      font-size: 14px;
    }
  }
}

.spacer {
  flex: 1;
}

.show-rates-btn {
  margin: 0 auto 20px;
  display: block;
  padding: 12px 30px;
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  border: 2px solid #667eea;
  font-weight: bold;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

  i {
    margin-right: 8px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }
}

.pool-preview-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: linear-gradient(135deg, #f5f5ff 0%, #fff5f8 100%);
  border-radius: 12px;
  margin: 20px 0;
  position: relative;
  overflow: hidden;
}

.pickup-card-display {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: cardEntrance 0.8s ease-out;
}

.pickup-card-image {
  max-width: 100%;
  max-height: 500px;
  height: auto;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.pickup-label {
  position: absolute;
  top: 20px;
  right: -10px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%);
  color: white;
  padding: 8px 20px;
  font-weight: bold;
  font-size: 16px;
  border-radius: 20px 0 0 20px;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.5);
  display: flex;
  align-items: center;
  gap: 6px;
  animation: pickupPulse 2s ease-in-out infinite;

  i {
    animation: starRotate 4s linear infinite;
  }
}

@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes pickupPulse {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.5);
  }
  50% {
    box-shadow: 0 6px 24px rgba(255, 107, 107, 0.8);
  }
}

@keyframes starRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.gacha-buttons-bottom {
  display: flex;
  gap: 25px;
  justify-content: center;
  padding: 20px 0 0 0;
  border-top: 2px solid #f0f0f0;
  margin-top: auto;
}

.pity-info {
  display: flex;
  gap: 30px;
  justify-content: center;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;

  .pity-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;

    .pity-label {
      color: #666;
    }

    .pity-value {
      font-weight: bold;
      color: #ff4444;
      font-size: 20px;
    }
  }
}

.dev-tools {
  margin-top: 30px;
  padding: 20px;
  background: #ffe5e5;
  border-radius: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  button {
    padding: 8px 16px;
    border: none;
    background: #ff6b6b;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;

    &:hover {
      background: #ff5252;
    }
  }
}

// 概率弹窗
.rates-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.rates-content {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 800px;
  max-height: 90vh;
  width: 90%;
  position: relative;
  animation: slideIn 0.3s ease;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  overflow-y: auto;

  h3 {
    margin: 0 0 25px 0;
    font-size: 28px;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  h4 {
    margin: 30px 0 20px 0;
    font-size: 22px;
    text-align: center;
    color: #333;
    padding-bottom: 10px;
    border-bottom: 2px solid #f0f0f0;
  }

  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s;

    &:hover {
      background: #f5f5f5;
      color: #333;
    }
  }

  .rates-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .rate-item {
    padding: 20px;
    border-radius: 12px;
    text-align: center;

    &.ur {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    }

    &.ssr {
      background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
      color: white;
    }

    &.sr {
      background: linear-gradient(135deg, #9370db 0%, #ba55d3 100%);
      color: white;
    }

    &.r {
      background: linear-gradient(135deg, #999 0%, #bbb 100%);
      color: white;
    }

    .rarity {
      display: block;
      font-weight: bold;
      font-size: 22px;
      margin-bottom: 8px;
    }

    .percentage {
      display: block;
      font-size: 18px;
    }
  }
}

// 卡池详情
.pool-details {
  margin-top: 30px;

  .rarity-section {
    margin-bottom: 25px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &.ur-section {
      background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%);
    }

    &.ssr-section {
      background: linear-gradient(135deg, #ffd93d 0%, #ffb366 100%);
    }

    &.sr-section {
      background: linear-gradient(135deg, #a78bfa 0%, #c4b5fd 100%);
    }

    &.r-section {
      background: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%);
    }
  }

  .section-header {
    padding: 15px 20px;
    color: white;
    font-weight: bold;
    font-size: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .card-list {
    background: white;
    max-height: 400px;
    overflow-y: auto;

    &.collapsed {
      max-height: 200px;
    }

    .card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      border-bottom: 1px solid #f0f0f0;
      transition: background 0.2s;

      &:hover {
        background: #f8f9fa;
      }

      &:last-child {
        border-bottom: none;
      }

      .card-name {
        flex: 1;
        font-size: 14px;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;

        .pickup-star {
          color: #ffd700;
          animation: starPulse 2s ease-in-out infinite;
        }
      }

      .card-prob {
        font-size: 14px;
        color: #667eea;
        font-weight: bold;
        min-width: 80px;
        text-align: right;
      }
    }
  }
}

@keyframes starPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
