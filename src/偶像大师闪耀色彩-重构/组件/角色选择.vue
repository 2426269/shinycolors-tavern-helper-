<template>
  <div class="training-selection-screen">
    <!-- 顶部装饰栏 -->
    <div class="top-decoration">
      <div class="step-indicator">
        <div class="step active">1.选择偶像</div>
      </div>
      <div class="true-end-badge" :class="{ achieved: isTrueEndAchieved }">
        <i class="fas fa-star"></i>
        <span>True End条件：{{ isTrueEndAchieved ? '达成' : '未达成' }}</span>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>加载中...</p>
    </div>

    <div v-else-if="ownedCardsList.length === 0" class="empty-state">
      <i class="fas fa-inbox"></i>
      <p>还没有任何角色卡</p>
      <p class="hint">前往抽卡获取角色吧！</p>
      <button class="back-btn" @click="$emit('close')">
        <i class="fas fa-arrow-left"></i>
        返回
      </button>
    </div>

    <div v-else class="main-content">
      <!-- 角色卡面背景 - 优化：使用 CSS 背景替代 img 标签 -->
      <transition name="fade-bg" mode="out-in">
        <div
          :key="currentCard.id"
          class="character-background"
          :style="{ backgroundImage: `url(${currentCard.imageUrl})` }"
        >
          <div class="background-overlay"></div>
        </div>
      </transition>

      <!-- 内容层 -->
      <div class="content-layer">
        <!-- 角色信息和立绘 -->
        <div class="character-display">
          <!-- 角色名和主题 (右侧) -->
          <div class="character-header">
            <div class="card-theme-badge">【{{ currentCard.theme }}】</div>
            <div class="character-name">{{ currentCard.characterName }}</div>
            <div class="card-song">
              <i class="fas fa-music"></i>
              {{ currentCard.theme }}
            </div>
          </div>

          <!-- 属性面板 (左侧) -->
          <div class="attributes-panel-left">
            <!-- 亲密度 -->
            <div class="affection-display">
              <div class="affection-label">亲密度</div>
              <div class="affection-value">
                <span class="current">0</span>
                <span class="separator">/</span>
                <span class="max">10</span>
              </div>
            </div>

            <!-- 体力 -->
            <div class="stamina-display">
              <img src="https://283pro.site/shinycolors/游戏图标/体力.png" alt="体力" class="stat-icon" />
              <span class="stamina-value">{{ currentCard.attribute?.stamina || 30 }}</span>
            </div>

            <!-- 三维属性等级圆 -->
            <div class="dimension-circles">
              <div class="circle-item vocal">
                <div class="circle-bg">
                  <span class="grade">{{ getGrade(currentCard.attribute?.stats.vocal || 0) }}</span>
                </div>
                <div class="stat-bottom">
                  <img src="https://283pro.site/shinycolors/游戏图标/Vocal.png" alt="Vo" class="dimension-icon" />
                  <span class="stat-value">{{ currentCard.attribute?.stats.vocal || 0 }}</span>
                </div>
                <div class="lesson-bonus" :class="getBonusClass(currentLessonBonus?.vocal)">
                  +{{ formatBonus(currentLessonBonus?.vocal) }}%
                </div>
              </div>

              <div class="circle-item dance">
                <div class="circle-bg">
                  <span class="grade">{{ getGrade(currentCard.attribute?.stats.dance || 0) }}</span>
                </div>
                <div class="stat-bottom">
                  <img src="https://283pro.site/shinycolors/游戏图标/Dance.png" alt="Da" class="dimension-icon" />
                  <span class="stat-value">{{ currentCard.attribute?.stats.dance || 0 }}</span>
                </div>
                <div class="lesson-bonus" :class="getBonusClass(currentLessonBonus?.dance)">
                  +{{ formatBonus(currentLessonBonus?.dance) }}%
                </div>
              </div>

              <div class="circle-item visual">
                <div class="circle-bg">
                  <span class="grade">{{ getGrade(currentCard.attribute?.stats.visual || 0) }}</span>
                </div>
                <div class="stat-bottom">
                  <img src="https://283pro.site/shinycolors/游戏图标/Visual.png" alt="Vi" class="dimension-icon" />
                  <span class="stat-value">{{ currentCard.attribute?.stats.visual || 0 }}</span>
                </div>
                <div class="lesson-bonus" :class="getBonusClass(currentLessonBonus?.visual)">
                  +{{ formatBonus(currentLessonBonus?.visual) }}%
                </div>
              </div>
            </div>

            <!-- 属性类型标签 -->
            <div v-if="currentCard.attribute" class="attribute-type-tag">
              <img
                :src="getAttributeIcon(currentCard.attribute.attributeType)"
                :alt="currentCard.attribute.attributeType"
              />
              <span>{{ currentCard.attribute.attributeType }}</span>
            </div>
          </div>
        </div>

        <!-- 底部角色列表 -->
        <div class="idol-list-section">
          <!-- 工具栏: 筛选/排序/搜索 -->
          <div class="toolbar">
            <div class="section-label">Pアイドル一覧 ({{ filteredCardsList.length }})</div>
            <div class="toolbar-actions">
              <!-- 搜索框 -->
              <div class="search-box" :class="{ expanded: isSearchExpanded }">
                <button class="icon-btn" @click="toggleSearch">
                  <i class="fas fa-search"></i>
                </button>
                <input
                  v-show="isSearchExpanded"
                  ref="searchInputRef"
                  v-model="searchQuery"
                  type="text"
                  placeholder="検索..."
                  @blur="onSearchBlur"
                />
              </div>
              <!-- 筛选按钮 -->
              <button class="icon-btn" :class="{ active: hasActiveFilter }" @click="showFilterPanel = !showFilterPanel">
                <i class="fas fa-filter"></i>
              </button>
              <!-- 排序按钮 -->
              <button class="icon-btn" @click="cycleSortMode">
                <i :class="sortIcon"></i>
              </button>
            </div>
          </div>

          <!-- 筛选面板 -->
          <div v-if="showFilterPanel" class="filter-panel">
            <div class="filter-section">
              <div class="filter-label">ユニット</div>
              <div class="filter-tags">
                <button
                  v-for="unit in unitList"
                  :key="unit"
                  class="filter-tag"
                  :class="{ active: filterState.units.includes(unit) }"
                  @click="toggleUnitFilter(unit)"
                >
                  {{ unit }}
                </button>
              </div>
            </div>
            <div class="filter-section">
              <div class="filter-label">レアリティ</div>
              <div class="filter-tags">
                <button
                  v-for="rarity in rarityList"
                  :key="rarity"
                  class="filter-tag"
                  :class="{ active: filterState.rarities.includes(rarity) }"
                  @click="toggleRarityFilter(rarity)"
                >
                  {{ rarity }}
                </button>
              </div>
            </div>
            <div class="filter-section">
              <div class="filter-label">属性</div>
              <div class="filter-tags">
                <button
                  v-for="attr in attributeList"
                  :key="attr"
                  class="filter-tag"
                  :class="{ active: filterState.attributes.includes(attr) }"
                  @click="toggleAttributeFilter(attr)"
                >
                  {{ attr }}
                </button>
              </div>
            </div>
            <button class="clear-filter-btn" @click="clearFilters"><i class="fas fa-times"></i> クリア</button>
          </div>
          <div class="idol-carousel">
            <button class="scroll-btn left" :disabled="!canScrollLeft" @click="scrollLeft">
              <i class="fas fa-chevron-left"></i>
            </button>

            <div ref="carouselRef" class="idol-cards-wrapper" @scroll="checkScroll">
              <div
                v-for="(card, index) in filteredCardsList"
                :key="card.id"
                class="idol-card"
                :class="{ active: selectedCardId === card.id, 'has-plan': card.rarity === 'UR' }"
                @click="selectCard(card, index)"
              >
                <img :src="card.imageUrl" :alt="card.fullName" class="idol-thumbnail" @error="onImageError" />
                <div v-if="card.rarity === 'UR'" class="plan-icon">
                  <i class="fas fa-chess-rook"></i>
                </div>
              </div>
            </div>

            <button class="scroll-btn right" :disabled="!canScrollRight" @click="scrollRight">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <!-- 底部按钮组 -->
        <div class="bottom-actions">
          <button class="action-btn info-btn" @click="showInfo">
            <i class="fas fa-chart-line"></i>
            <span>育成情报</span>
          </button>

          <button class="action-btn next-btn" @click="confirmSelection">
            <i class="fas fa-arrow-right"></i>
            <span>下一步</span>
          </button>

          <button class="action-btn detail-btn" @click="showDetail">
            <i class="fas fa-list"></i>
            <span>编成详细</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 关闭按钮 -->
    <button class="close-button" @click="$emit('close')">
      <i class="fas fa-times"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import type { GachaData } from '../../偶像大师闪耀色彩/utils/game-data';
import { getGachaData } from '../../偶像大师闪耀色彩/utils/game-data';
import { ALL_CARDS } from '../卡牌管理/全部卡牌数据';
import { getCardAttribute } from '../卡牌管理/卡牌属性';
import { getLessonBonusFromData } from '../培育/服务/ProduceControlService';
import { buildUrlFromFileName } from '../工具/卡牌工具';
import { getAttributeIcon } from '../类型/卡牌属性类型';
import { SPINE_CHARACTERS } from '../角色管理/spine资源映射';
import { getAllUnits, IDOLS } from '../角色管理/角色数据';

const emit = defineEmits<{
  close: [];
  select: [card: any];
  next: [card: any]; // 进入支援卡选择
}>();

// 数据状态
const loading = ref(true);
const ownedCardsList = ref<any[]>([]);
const currentIndex = ref(0);
const selectedCardId = ref<string | null>(null);
const carouselRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);
const affectionMap = ref<Map<string, number>>(new Map());
const imagePreloadMap = new Map<string, HTMLImageElement>();

// 搜索/筛选/排序状态
const searchQuery = ref('');
const isSearchExpanded = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);
const showFilterPanel = ref(false);
const filterState = ref({
  units: [] as string[],
  rarities: [] as string[],
  attributes: [] as string[],
});
const sortMode = ref<'default' | 'time-desc' | 'time-asc' | 'rarity-desc' | 'rarity-asc'>('default');

// 筛选选项列表
const unitList = getAllUnits();
const rarityList = ['UR', 'SSR', 'SR', 'R'];
const attributeList = ['理性', '感性', '非凡'];

// 获取已拥有的卡片列表
onMounted(async () => {
  try {
    const gachaData: GachaData = await getGachaData();
    const ownedCards = gachaData.ownedCards || {};

    const cards: any[] = [];
    for (const card of ALL_CARDS) {
      const cardId = card.fullName;
      if (ownedCards[cardId]) {
        const attribute = getCardAttribute(card.fullName);

        // 查找对应的 Spine ID
        let spineId = '';
        const spineChar = SPINE_CHARACTERS.find(c => c.chineseName === card.character);
        if (spineChar) {
          // 尝试通过 enzaId 匹配
          const spineCard = spineChar.cards.find(c => c.enzaId === (card.enzaId || ''));
          if (spineCard) {
            spineId = `${spineChar.japaneseName}_${spineCard.name}`;
          } else {
            // 尝试通过主题匹配
            const spineCardByTheme = spineChar.cards.find(c => c.displayName === card.theme);
            if (spineCardByTheme) {
              spineId = `${spineChar.japaneseName}_${spineCardByTheme.name}`;
            }
          }
        }

        cards.push({
          id: cardId,
          fullName: card.fullName,
          characterName: card.character,
          theme: card.theme,
          rarity: card.rarity,
          enzaId: card.enzaId || '',
          imageUrl: buildUrlFromFileName(card.baseImage, false),
          obtainedAt: ownedCards[cardId].obtainedAt,
          attribute,
          spineId, // 添加正确的 Spine ID
        });
      }
    }

    // 不在这里排序，让 filteredCardsList 的排序逻辑来处理

    ownedCardsList.value = cards;
    console.log('已拥有的卡片列表:', cards);

    // 初始化好感度（TODO: 从 IndexedDB 获取真实数据）
    cards.forEach(card => {
      if (!affectionMap.value.has(card.characterName)) {
        affectionMap.value.set(card.characterName, Math.floor(Math.random() * 50) + 20);
      }
    });

    // 仅预加载前 10 张和当前可见的卡片图片（优化内存占用）
    const PRELOAD_COUNT = 10;
    cards.slice(0, PRELOAD_COUNT).forEach(card => {
      const img = new Image();
      img.src = card.imageUrl;
      imagePreloadMap.set(card.id, img);
    });

    await nextTick();
    checkScroll();
  } catch (error) {
    console.error('加载卡片失败:', error);
  } finally {
    loading.value = false;
  }
});

// 动态预加载相邻卡片
watch(currentIndex, newIndex => {
  const ADJACENT_PRELOAD = 3; // 预加载前后各3张
  const cards = ownedCardsList.value;

  for (let i = -ADJACENT_PRELOAD; i <= ADJACENT_PRELOAD; i++) {
    const targetIndex = newIndex + i;
    if (targetIndex >= 0 && targetIndex < cards.length) {
      const card = cards[targetIndex];
      // 如果还没有预加载过，则预加载
      if (!imagePreloadMap.has(card.id)) {
        const img = new Image();
        img.src = card.imageUrl;
        imagePreloadMap.set(card.id, img);
      }
    }
  }
});

// 当前显示的卡片（使用筛选后的列表）
const currentCard = computed(() => {
  if (filteredCardsList.value.length === 0) {
    return null;
  }
  // 确保 currentIndex 在有效范围内
  const safeIndex = Math.min(currentIndex.value, filteredCardsList.value.length - 1);
  return filteredCardsList.value[safeIndex];
});

// 当前角色的好感度（一个角色的所有卡片共享好感度，0-10等级）
const currentAffection = computed(() => {
  if (!currentCard.value) return 0;
  const affection = affectionMap.value.get(currentCard.value.characterName) || 0;
  // 将0-100映射到0-10
  return Math.floor(affection / 10);
});

// 当前角色卡的训练加成
const currentLessonBonus = computed(() => {
  if (!currentCard.value) return null;
  // 使用卡牌的 fullName 来获取训练加成
  return getLessonBonusFromData(currentCard.value.fullName);
});

// 根据加成值获取样式类名 (bonusValue 是小数如 0.245)
const getBonusClass = (bonusValue: number | undefined): string => {
  if (!bonusValue) return 'low';
  if (bonusValue >= 0.2) return 'high'; // >= 20%
  if (bonusValue >= 0.13) return 'mid'; // >= 13%
  return 'low';
};

// 格式化加成值为百分比显示 (0.245 -> "24.5")
const formatBonus = (bonusValue: number | undefined): string => {
  if (!bonusValue) return '0.0';
  return (bonusValue * 100).toFixed(1);
};

// 获取角色所属组合
const getCharacterUnit = (characterName: string): string => {
  const idol = IDOLS.find(i => i.name === characterName);
  return idol?.unit || '';
};

// 筛选和排序后的卡片列表
const filteredCardsList = computed(() => {
  let cards = [...ownedCardsList.value];

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    cards = cards.filter(
      card =>
        card.characterName.toLowerCase().includes(query) ||
        card.theme.toLowerCase().includes(query) ||
        card.fullName.toLowerCase().includes(query),
    );
  }

  // 组合过滤
  if (filterState.value.units.length > 0) {
    cards = cards.filter(card => {
      const unit = getCharacterUnit(card.characterName);
      return filterState.value.units.includes(unit);
    });
  }

  // 品阶过滤
  if (filterState.value.rarities.length > 0) {
    cards = cards.filter(card => filterState.value.rarities.includes(card.rarity));
  }

  // 属性过滤
  if (filterState.value.attributes.length > 0) {
    cards = cards.filter(card => {
      const attrType = card.attribute?.type || card.attribute?.attributeType;
      return filterState.value.attributes.includes(attrType);
    });
  }

  // 排序
  const rarityOrder: Record<string, number> = { UR: 4, SSR: 3, SR: 2, R: 1 };
  cards.sort((a, b) => {
    switch (sortMode.value) {
      case 'default':
        return (a.enzaId || '').localeCompare(b.enzaId || '');
      case 'time-desc':
        return new Date(b.obtainedAt).getTime() - new Date(a.obtainedAt).getTime();
      case 'time-asc':
        return new Date(a.obtainedAt).getTime() - new Date(b.obtainedAt).getTime();
      case 'rarity-desc':
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
      case 'rarity-asc':
        return (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
      default:
        return 0;
    }
  });

  return cards;
});

// 是否有激活的筛选条件
const hasActiveFilter = computed(() => {
  return (
    filterState.value.units.length > 0 ||
    filterState.value.rarities.length > 0 ||
    filterState.value.attributes.length > 0
  );
});

// 排序图标
const sortIcon = computed(() => {
  switch (sortMode.value) {
    case 'default':
      return 'fas fa-sort-numeric-down';
    case 'time-desc':
      return 'fas fa-clock';
    case 'time-asc':
      return 'fas fa-history';
    case 'rarity-desc':
      return 'fas fa-star';
    case 'rarity-asc':
      return 'far fa-star';
    default:
      return 'fas fa-sort';
  }
});

// 切换搜索框展开
const toggleSearch = () => {
  isSearchExpanded.value = !isSearchExpanded.value;
  if (isSearchExpanded.value) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
};

// 搜索框失焦
const onSearchBlur = () => {
  if (!searchQuery.value.trim()) {
    isSearchExpanded.value = false;
  }
};

// 切换组合筛选
const toggleUnitFilter = (unit: string) => {
  const idx = filterState.value.units.indexOf(unit);
  if (idx >= 0) {
    filterState.value.units.splice(idx, 1);
  } else {
    filterState.value.units.push(unit);
  }
};

// 切换品阶筛选
const toggleRarityFilter = (rarity: string) => {
  const idx = filterState.value.rarities.indexOf(rarity);
  if (idx >= 0) {
    filterState.value.rarities.splice(idx, 1);
  } else {
    filterState.value.rarities.push(rarity);
  }
};

// 切换属性筛选
const toggleAttributeFilter = (attr: string) => {
  const idx = filterState.value.attributes.indexOf(attr);
  if (idx >= 0) {
    filterState.value.attributes.splice(idx, 1);
  } else {
    filterState.value.attributes.push(attr);
  }
};

// 清空筛选
const clearFilters = () => {
  filterState.value.units = [];
  filterState.value.rarities = [];
  filterState.value.attributes = [];
  searchQuery.value = '';
};

// 切换排序模式
const cycleSortMode = () => {
  const modes: Array<'default' | 'time-desc' | 'time-asc' | 'rarity-desc' | 'rarity-asc'> = [
    'default',
    'time-desc',
    'time-asc',
    'rarity-desc',
    'rarity-asc',
  ];
  const currentIdx = modes.indexOf(sortMode.value);
  sortMode.value = modes[(currentIdx + 1) % modes.length];
};

// 选择卡片
const selectCard = (card: any, index: number) => {
  selectedCardId.value = card.id;
  // 使用在筛选列表中的索引
  currentIndex.value = index;
  scrollToCard(index);
};

// TrueEnd是否达成（从变量中读取）
const isTrueEndAchieved = ref(false);

// 根据数值获取等级 (学マス规格)
const getGrade = (value: number): string => {
  if (value >= 2000) return 'SS';
  if (value >= 1800) return 'S+';
  if (value >= 1500) return 'S';
  if (value >= 1200) return 'A+';
  if (value >= 1000) return 'A';
  if (value >= 800) return 'B+';
  if (value >= 600) return 'B';
  if (value >= 450) return 'C+';
  if (value >= 300) return 'C';
  if (value >= 200) return 'D';
  if (value >= 100) return 'E';
  return 'F';
};

// 节流函数 - 优化快速切换性能
let selectTimeoutId: number | null = null;
const selectIndex = (index: number) => {
  currentIndex.value = index;

  // 延迟滚动，避免频繁触发
  if (selectTimeoutId !== null) {
    clearTimeout(selectTimeoutId);
  }
  selectTimeoutId = window.setTimeout(() => {
    scrollToCard(index);
    selectTimeoutId = null;
  }, 50);
};

// 滚动到指定卡片
const scrollToCard = (index: number) => {
  if (!carouselRef.value) return;
  const cardWidth = 140; // 卡片宽度 + 间距
  const scrollPosition = index * cardWidth - carouselRef.value.clientWidth / 2 + cardWidth / 2;
  carouselRef.value.scrollTo({
    left: scrollPosition,
    behavior: 'smooth',
  });
};

// 检查滚动状态
const checkScroll = () => {
  if (!carouselRef.value) return;
  canScrollLeft.value = carouselRef.value.scrollLeft > 0;
  canScrollRight.value =
    carouselRef.value.scrollLeft < carouselRef.value.scrollWidth - carouselRef.value.clientWidth - 1;
};

// 向左滚动
const scrollLeft = () => {
  if (!carouselRef.value) return;
  carouselRef.value.scrollBy({ left: -300, behavior: 'smooth' });
};

// 向右滚动
const scrollRight = () => {
  if (!carouselRef.value) return;
  carouselRef.value.scrollBy({ left: 300, behavior: 'smooth' });
};

// 确认选择 - 进入支援卡选择
const confirmSelection = () => {
  if (currentCard.value) {
    emit('next', currentCard.value);
  }
};

// 显示信息
const showInfo = () => {
  console.log('显示育成情報');
};

// 显示详情
const showDetail = () => {
  console.log('显示編成詳細');
};

// 图片加载失败处理
const onImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.src = 'https://placehold.co/512x724?text=No+Image';
};

// 键盘导航
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentIndex.value > 0) {
      selectIndex(currentIndex.value - 1);
    } else if (e.key === 'ArrowRight' && currentIndex.value < ownedCardsList.value.length - 1) {
      selectIndex(currentIndex.value + 1);
    } else if (e.key === 'Escape') {
      emit('close');
    }
  };

  window.addEventListener('keydown', handleKeydown);

  return () => {
    window.removeEventListener('keydown', handleKeydown);
  };
});
</script>

<style scoped lang="scss">
.training-selection-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1a1a1a;
  z-index: 10000;
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 顶部装饰栏 */
.top-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  backdrop-filter: blur(5px);
  z-index: 10;
}

.step-indicator {
  .step {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 25px;
    padding: 8px 20px;
    font-size: 16px;
    font-weight: bold;
    color: #333;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

    &.active {
      background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%);
      color: white;
    }
  }
}

.true-end-badge {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 25px;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  box-shadow: 0 2px 10px rgba(255, 215, 0, 0.4);

  i {
    font-size: 16px;
  }
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  gap: 20px;

  i {
    font-size: 64px;
    opacity: 0.5;
  }

  p {
    font-size: 18px;
    text-align: center;
  }

  .hint {
    font-size: 14px;
    color: #999;
  }
}

.loading-state i {
  color: #667eea;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.back-btn {
  margin-top: 20px;
  padding: 12px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 25px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  }
}

/* 主要内容区域 */
.main-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: 60px;
  position: relative;
  overflow: hidden;
}

/* 角色卡面背景 - 优化 GPU 加速 */
.character-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(8px);
  transform: scale(1.05) translateZ(0);
  will-change: opacity, transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%);
  backdrop-filter: blur(2px);
  will-change: opacity;
}

/* 优化背景切换动画 - 使用更流畅的过渡 */
.fade-bg-enter-active {
  transition:
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-bg-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.fade-bg-enter-from {
  opacity: 0;
  transform: scale(1.08) translateZ(0);
}

.fade-bg-leave-to {
  opacity: 0;
}

.fade-bg-enter-to,
.fade-bg-leave-from {
  opacity: 1;
  transform: scale(1.05) translateZ(0);
}

/* 内容层 */
.content-layer {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 角色显示区域 */
.character-display {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.character-header {
  position: absolute;
  top: 20px;
  right: 30px;
  text-align: right;
  z-index: 5;
}

.card-theme-badge {
  font-size: 18px;
  color: #333;
  font-weight: bold;
  margin-bottom: 5px;
}

.character-name {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
  text-shadow:
    2px 2px 4px rgba(0, 0, 0, 0.5),
    0 0 10px rgba(0, 0, 0, 0.3);
  margin-bottom: 5px;
}

.card-song {
  font-size: 16px;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

/* 左侧属性面板 */
.attributes-panel-left {
  position: absolute;
  top: 120px;
  left: 30px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  z-index: 5;
}

.affection-display {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 10px 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);

  .affection-label {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
  }

  .affection-value {
    font-size: 24px;
    font-weight: bold;
    color: #ff69b4;

    .current {
      font-size: 28px;
    }

    .separator {
      color: #ccc;
      margin: 0 5px;
    }

    .max {
      font-size: 20px;
      color: #999;
    }
  }
}

.stamina-display {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  border-radius: 15px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(74, 222, 128, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.3);

  .stat-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  i {
    font-size: 24px;
    color: white;
  }

  .stamina-value {
    font-size: 28px;
    font-weight: bold;
    color: white;
  }
}

.dimension-circles {
  display: flex;
  gap: 15px;
  will-change: contents;
}

.circle-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
  position: relative;

  .circle-bg {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px solid white;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    position: relative;
    will-change: transform;
    transform: translateZ(0);

    .grade {
      font-size: 32px;
      font-weight: bold;
      color: white;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
  }

  .stat-bottom {
    background: rgba(0, 0, 0, 0.6);
    border-radius: 20px;
    padding: 6px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.3);

    .dimension-icon {
      width: 20px;
      height: 20px;
      object-fit: contain;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    }

    .stat-value {
      font-size: 18px;
      font-weight: bold;
      color: white;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }
  }

  &.vocal .circle-bg {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  &.dance .circle-bg {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }

  &.visual .circle-bg {
    background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
  }

  .lesson-bonus {
    font-size: 12px;
    font-weight: bold;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.5);
    color: #aaa;
    transition: all 0.3s ease;

    &.high {
      background: linear-gradient(135deg, #ffd700, #ffaa00);
      color: #333;
      box-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
    }

    &.mid {
      background: rgba(100, 200, 255, 0.8);
      color: #fff;
    }

    &.low {
      background: rgba(100, 100, 100, 0.6);
      color: #ccc;
    }
  }
}

.attribute-type-tag {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.25);
  border: 2px solid rgba(255, 255, 255, 0.5);

  img {
    width: 24px;
    height: 24px;
  }

  span {
    font-size: 14px;
    font-weight: bold;
    color: #333;
  }
}

/* 底部角色列表 */
.idol-list-section {
  background: transparent;
  padding: 0;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(15px);
  padding: 10px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section-label {
  font-size: 14px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &.active {
    background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%);
  }
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0;
  transition: all 0.3s;

  input {
    width: 0;
    padding: 0;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    font-size: 14px;
    border-radius: 18px;
    outline: none;
    transition: all 0.3s;

    &::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  &.expanded input {
    width: 120px;
    padding: 8px 12px;
    margin-left: 8px;
  }
}

/* 筛选面板 */
.filter-panel {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  padding: 15px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-start;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: bold;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-tag {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  &.active {
    background: linear-gradient(135deg, #ff69b4 0%, #ff1493 100%);
    border-color: transparent;
  }
}

.clear-filter-btn {
  background: rgba(255, 59, 48, 0.8);
  border: none;
  color: white;
  padding: 6px 14px;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;

  &:hover {
    background: rgba(255, 59, 48, 1);
  }
}

.idol-carousel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(15px);
  padding: 15px 10px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.4);
}

.scroll-btn {
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: white;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.3s;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.15);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
  }

  &:disabled {
    opacity: 0.2;
    cursor: not-allowed;
  }

  &.left {
    margin-right: 8px;
  }

  &.right {
    margin-left: 8px;
  }
}

.idol-cards-wrapper {
  flex: 1;
  display: flex;
  gap: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  padding: 0;

  /* 隐藏滚动条 */
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.idol-card {
  position: relative;
  width: 120px;
  height: 180px;
  flex-shrink: 0;
  cursor: pointer;
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  border-radius: 0;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);

  &:first-child {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }

  &:last-child {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
    border-right: none;
  }

  &:hover {
    transform: translateY(-8px) scale(1.05) translateZ(0);
    z-index: 10;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6);
  }

  &.active {
    transform: translateY(-12px) scale(1.1) translateZ(0);
    z-index: 20;
    box-shadow:
      0 0 0 3px #ffd700,
      0 10px 40px rgba(255, 215, 0, 0.6);
    border-radius: 8px;
  }

  &.has-plan {
    .plan-icon {
      display: flex;
    }
  }
}

.idol-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: filter 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
}

.idol-card:hover .idol-thumbnail {
  filter: brightness(1.1);
}

.plan-icon {
  display: none;
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  z-index: 5;
}

.month-badge {
  position: absolute;
  bottom: 45px;
  left: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 105, 180, 0.95) 15%,
    rgba(255, 105, 180, 0.95) 85%,
    transparent 100%
  );
  color: white;
  font-size: 9px;
  font-weight: bold;
  text-align: center;
  padding: 3px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.idol-stats {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.95) 50%);
  padding: 8px 4px 6px;
  backdrop-filter: blur(5px);
}

.stat-icons {
  display: flex;
  justify-content: center;
  gap: 4px;

  .stat {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: bold;
    color: white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.2);

    &.vocal {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    &.dance {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }

    &.visual {
      background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
    }
  }
}

/* 底部按钮组 */
.bottom-actions {
  display: flex;
  gap: 15px;
  padding: 20px 30px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(15px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
}

.action-btn {
  flex: 1;
  padding: 18px 30px;
  border: none;
  border-radius: 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  i {
    font-size: 20px;
  }

  &:hover {
    transform: translateY(-2px);
  }

  &.info-btn {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    color: white;

    &:hover {
      box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
    }
  }

  &.next-btn {
    flex: 2;
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    color: white;
    font-size: 20px;

    &:hover {
      box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5);
    }
  }

  &.detail-btn {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    color: white;

    &:hover {
      box-shadow: 0 6px 20px rgba(100, 116, 139, 0.4);
    }
  }
}

/* 关闭按钮 */
.close-button {
  position: absolute;
  top: 70px;
  left: 30px;
  width: 50px;
  height: 50px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
    transform: rotate(90deg);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .attributes-panel {
    right: 15px;
    gap: 10px;
  }

  .dimension-circles {
    gap: 10px;
  }

  .circle-item .circle-bg {
    width: 60px;
    height: 60px;

    .grade {
      font-size: 28px;
    }
  }
}

@media (max-width: 768px) {
  .character-header {
    right: 15px;
  }

  .character-name {
    font-size: 28px;
  }

  .attributes-panel {
    top: 100px;
    right: 10px;
  }

  .bottom-actions {
    flex-wrap: wrap;
    padding: 15px;
  }

  .action-btn {
    font-size: 14px;
    padding: 15px 20px;

    i {
      font-size: 16px;
    }
  }
}
</style>
