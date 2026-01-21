<template>
  <div class="idol-collection">
    <div class="collection-header">
      <h2>
        <i class="fas fa-book"></i>
        偶像图鉴
      </h2>
      <div class="collection-stats">
        <span class="stat-item">
          <i class="fas fa-users"></i>
          已获得: {{ ownedCount }} / {{ totalCount }}
        </span>
        <span class="stat-progress"> 完成度: {{ completionRate }}% </span>
      </div>

      <!-- 筛选和排序按钮 -->
      <div class="collection-controls">
        <button class="control-btn" @click="showFilterPanel = !showFilterPanel">
          <i class="fas fa-filter"></i>
          筛选
        </button>
        <button class="control-btn" @click="showSortPanel = !showSortPanel">
          <i class="fas fa-sort"></i>
          排序
          <i class="fas" :class="sortOrder === 'asc' ? 'fa-sort-amount-up' : 'fa-sort-amount-down'"></i>
        </button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilterPanel" class="filter-panel">
      <div class="panel-header">
        <h3><i class="fas fa-filter"></i> 筛选</h3>
        <button class="close-panel-btn" @click="showFilterPanel = false">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 偶像筛选 -->
      <div class="filter-section">
        <h4><i class="fas fa-star"></i> 偶像</h4>
        <div class="unit-filters">
          <div v-for="unit in units" :key="unit.id" class="unit-filter-item" @click="toggleUnitFilter(unit.id)">
            <div class="unit-header">
              <i class="fas fa-check-circle" :class="{ active: filters.units.includes(unit.id) }"></i>
              <img :src="unit.iconUrl" :alt="unit.name" class="unit-icon-img" />
              <span class="unit-name">{{ unit.name }}</span>
            </div>
            <div class="unit-members">
              <span
                v-for="member in unit.members"
                :key="member"
                class="member-name"
                :class="{ active: filters.members.includes(member) }"
                @click.stop="toggleMemberFilter(member)"
              >
                <i class="fas fa-check-circle"></i>
                {{ member }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 持有状态筛选 -->
      <div class="filter-section">
        <h4><i class="fas fa-archive"></i> 持有</h4>
        <div class="ownership-filters">
          <div
            class="ownership-item"
            :class="{ active: filters.ownership === 'owned' }"
            @click="filters.ownership = filters.ownership === 'owned' ? 'all' : 'owned'"
          >
            <i class="fas fa-check-circle"></i>
            <span>已持有</span>
          </div>
          <div
            class="ownership-item"
            :class="{ active: filters.ownership === 'not-owned' }"
            @click="filters.ownership = filters.ownership === 'not-owned' ? 'all' : 'not-owned'"
          >
            <i class="fas fa-check-circle"></i>
            <span>未持有</span>
          </div>
        </div>
      </div>

      <!-- 属性筛选 -->
      <div class="filter-section">
        <h4><i class="fas fa-chess-queen"></i> 属性</h4>
        <div class="attribute-filters">
          <div
            v-for="attr in attributes"
            :key="attr.id"
            class="attribute-item"
            :class="[{ active: filters.attributes.includes(attr.id) }, `attr-${attr.id}`]"
            @click="toggleAttributeFilter(attr.id)"
          >
            <i class="fas fa-check-circle"></i>
            <img :src="getAttributeIcon(attr.id as AttributeType)" :alt="attr.name" class="attr-icon-small" />
            <span>{{ attr.name }}</span>
          </div>
        </div>
      </div>

      <!-- 应用筛选按钮 -->
      <div class="filter-actions">
        <button class="reset-btn" @click="resetFilters">
          <i class="fas fa-undo"></i>
          重置
        </button>
        <button class="apply-btn" @click="applyFilters">
          <i class="fas fa-check"></i>
          应用
        </button>
      </div>
    </div>

    <!-- 排序面板 -->
    <div v-if="showSortPanel" class="sort-panel">
      <div class="panel-header">
        <h3><i class="fas fa-sort"></i> 排序</h3>
        <button class="close-panel-btn" @click="showSortPanel = false">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="sort-options">
        <button class="sort-option-btn" :class="{ active: sortBy === 'default' }" @click="setSortBy('default')">
          <i class="fas fa-list"></i>
          默认
        </button>
        <button class="sort-option-btn" :class="{ active: sortBy === 'rarity' }" @click="setSortBy('rarity')">
          <i class="fas fa-gem"></i>
          品阶
        </button>
        <button class="sort-option-btn" :class="{ active: sortBy === 'obtained' }" @click="setSortBy('obtained')">
          <i class="fas fa-clock"></i>
          加入顺序
        </button>
      </div>

      <!-- 排序方向切换 -->
      <div class="sort-order-toggle">
        <button class="order-btn" :class="{ active: sortOrder === 'asc' }" @click="toggleSortOrder">
          <i class="fas fa-sort-amount-up"></i>
          正序
        </button>
        <button class="order-btn" :class="{ active: sortOrder === 'desc' }" @click="toggleSortOrder">
          <i class="fas fa-sort-amount-down"></i>
          倒序
        </button>
      </div>
    </div>

    <div class="collection-grid">
      <div
        v-for="card in displayCards"
        :key="`${card.fullCardName}_${card.rarity}`"
        class="card-slot"
        :class="{
          owned: card.isOwned,
          locked: !card.isOwned,
          [`rarity-${card.rarity.toLowerCase()}`]: true,
        }"
        @click="handleCardClick(card)"
      >
        <!-- 卡面图片 -->
        <div class="card-image-wrapper">
          <img
            v-if="card.isOwned && card.imageUrl"
            :src="card.imageUrl"
            :alt="card.fullCardName"
            class="card-image"
            loading="lazy"
            @error="handleImageError($event, card)"
          />
          <div v-else class="card-locked">
            <i class="fas fa-lock"></i>
            <p>未获得</p>
          </div>
        </div>

        <!-- 卡片信息 -->
        <div class="card-info">
          <div class="card-rarity-badge" :class="`rarity-${card.rarity.toLowerCase()}`">
            {{ card.rarity }}
          </div>
          <p class="card-name" :title="card.fullCardName">{{ card.fullCardName }}</p>
        </div>

        <!-- 新卡标记 -->
        <div v-if="card.isNew" class="new-badge">
          <i class="fas fa-star"></i>
          NEW
        </div>
      </div>
    </div>

    <!-- 卡片详情弹窗 -->
    <div v-if="selectedCard" class="card-detail-modal" @click="closeCardDetail">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="closeCardDetail">
          <i class="fas fa-times"></i>
        </button>

        <div class="detail-layout">
          <!-- 左侧：卡面图片 -->
          <div class="detail-image" @click="openFullscreenImage">
            <img
              :src="isAwakenedMode ? selectedCard.awakenedImageUrl : selectedCard.fullImageUrl || selectedCard.imageUrl"
              :alt="selectedCard.fullCardName"
              class="full-card-image"
              @error="handleImageError($event, selectedCard)"
            />
            <div class="detail-rarity-badge" :class="`rarity-${selectedCard.rarity.toLowerCase()}`">
              {{ selectedCard.rarity }}
            </div>

            <!-- 觉醒翻转按钮 -->
            <button
              class="awaken-toggle-btn"
              :class="{ awakened: isAwakenedMode }"
              title="切换觉醒状态"
              @click.stop="toggleAwakenedMode"
            >
              <i class="fas fa-sync-alt"></i>
            </button>

            <div class="fullscreen-hint">
              <i class="fas fa-expand"></i>
              <span>点击查看大图</span>
            </div>
          </div>

          <!-- 右侧：角色属性 / 技能卡 -->
          <div class="detail-info">
            <h3 class="detail-card-name">{{ selectedCard.fullCardName }}</h3>

            <!-- 未觉醒模式：显示角色属性 -->
            <template v-if="!isAwakenedMode">
              <!-- 属性类型 -->
              <div v-if="selectedCard.attribute" class="attribute-section">
                <div class="attribute-badge" :style="{ background: selectedCard.attribute.color }">
                  <img :src="selectedCard.attribute.icon" :alt="selectedCard.attribute.type" class="attr-icon" />
                  <span>{{ selectedCard.attribute.type }}</span>
                </div>
              </div>

              <!-- 体力 -->
              <div v-if="selectedCard.attribute" class="stat-row">
                <div class="stat-label">
                  <img src="https://283pro.site/shinycolors/游戏图标/体力.png" alt="体力" class="stat-icon" />
                  <span>体力</span>
                </div>
                <div class="stat-value">{{ selectedCard.attribute.stamina }}</div>
              </div>

              <!-- 推荐流派 -->
              <div v-if="selectedCard.attribute" class="stat-row">
                <div class="stat-label">
                  <img :src="selectedCard.attribute.styleIcon" :alt="selectedCard.attribute.style" class="stat-icon" />
                  <span>推荐流派</span>
                </div>
                <div class="stat-value">{{ selectedCard.attribute.style }}</div>
              </div>

              <!-- 三维属性柱状图 -->
              <div v-if="selectedCard.attribute" class="stats-chart">
                <h4>三维属性</h4>
                <div class="chart-item">
                  <div class="chart-label">
                    <img src="https://283pro.site/shinycolors/游戏图标/Vocal.png" alt="Vocal" class="chart-icon" />
                    <span>Vocal</span>
                  </div>
                  <div class="chart-bar-wrapper">
                    <div
                      class="chart-bar vocal"
                      :style="{ width: `${(selectedCard.attribute.stats.vocal / 100) * 100}%` }"
                    >
                      <span class="bar-value">{{ selectedCard.attribute.stats.vocal }}</span>
                    </div>
                  </div>
                </div>

                <div class="chart-item">
                  <div class="chart-label">
                    <img src="https://283pro.site/shinycolors/游戏图标/Dance.png" alt="Dance" class="chart-icon" />
                    <span>Dance</span>
                  </div>
                  <div class="chart-bar-wrapper">
                    <div
                      class="chart-bar dance"
                      :style="{ width: `${(selectedCard.attribute.stats.dance / 100) * 100}%` }"
                    >
                      <span class="bar-value">{{ selectedCard.attribute.stats.dance }}</span>
                    </div>
                  </div>
                </div>

                <div class="chart-item">
                  <div class="chart-label">
                    <img src="https://283pro.site/shinycolors/游戏图标/Visual.png" alt="Visual" class="chart-icon" />
                    <span>Visual</span>
                  </div>
                  <div class="chart-bar-wrapper">
                    <div
                      class="chart-bar visual"
                      :style="{ width: `${(selectedCard.attribute.stats.visual / 100) * 100}%` }"
                    >
                      <span class="bar-value">{{ selectedCard.attribute.stats.visual }}</span>
                    </div>
                  </div>
                </div>

                <div class="stats-total">
                  总和:
                  {{
                    selectedCard.attribute.stats.vocal +
                    selectedCard.attribute.stats.dance +
                    selectedCard.attribute.stats.visual
                  }}
                </div>
              </div>
            </template>

            <!-- 觉醒模式：显示技能卡 -->
            <template v-else>
              <!-- 技能卡未生成：封印效果 -->
              <div v-if="selectedCard.skill === null" class="skill-sealed">
                <div class="sealed-background">
                  <div class="chain-decoration chain-1"></div>
                  <div class="chain-decoration chain-2"></div>
                  <div class="chain-decoration chain-3"></div>
                </div>
                <div class="sealed-content">
                  <i class="fas fa-lock sealed-lock" :class="{ spinning: isGenerating }"></i>
                  <h3 class="sealed-title">{{ isGenerating ? '正在生成中...' : '技能卡尚未生成' }}</h3>
                  <p class="sealed-hint">{{ isGenerating ? 'AI 正在为你打造专属技能' : '需要AI生成此卡的专属技能' }}</p>
                  <!-- 用户描述输入框 -->
                  <div class="user-description-input">
                    <label for="userDescInput"> <i class="fas fa-lightbulb"></i> 特殊要求（可选） </label>
                    <input
                      id="userDescInput"
                      v-model="userDescriptionInput"
                      type="text"
                      placeholder="例如：无限抽牌、消耗所有元气获得大量得分..."
                      :disabled="isGenerating"
                    />
                  </div>
                  <button class="generate-skill-btn" :disabled="isGenerating" @click="handleGenerateSkill">
                    <i class="fas" :class="isGenerating ? 'fa-spinner fa-spin' : 'fa-magic'"></i>
                    <span>{{ isGenerating ? '生成中...' : '生成技能卡' }}</span>
                  </button>
                  <button v-if="rawAIOutput" class="view-raw-output-btn" @click="showRawOutput = !showRawOutput">
                    <i class="fas" :class="showRawOutput ? 'fa-eye-slash' : 'fa-code'"></i>
                    <span>{{ showRawOutput ? '隐藏原始输出' : '查看原始输出' }}</span>
                  </button>
                  <p v-if="generateError" class="generate-error">{{ generateError }}</p>
                  <!-- 原始输出显示区域 -->
                  <div v-if="showRawOutput && rawAIOutput" class="raw-output-container">
                    <div class="raw-output-header">
                      <h4><i class="fas fa-code"></i> AI 原始输出</h4>
                      <button class="copy-output-btn" @click="copyRawOutput"><i class="fas fa-copy"></i> 复制</button>
                    </div>
                    <pre class="raw-output-content">{{ rawAIOutput }}</pre>
                  </div>
                </div>
              </div>

              <!-- 技能卡已生成：显示技能信息（词条式格式） -->
              <div v-else-if="selectedCard.skill" class="skill-card-new">
                <!-- 顶部区域：图片和卡牌名 -->
                <div class="skill-card-header">
                  <!-- 左侧：卡片缩略图 -->
                  <div class="skill-card-thumbnail">
                    <img
                      :src="selectedCard.awakenedImageUrl || selectedCard.imageUrl"
                      :alt="selectedCard.skill.name"
                      class="skill-thumbnail-image"
                    />
                  </div>

                  <!-- 右侧：卡牌名称和属性 -->
                  <div class="skill-card-title-area">
                    <h3 class="skill-name">{{ selectedCard.skill.name }}</h3>

                    <div class="skill-meta-row">
                      <!-- 费用显示 -->
                      <div v-if="selectedCard.skill.cost" class="skill-cost-badge">
                        <i class="fas fa-coins"></i>
                        <span>费用: {{ selectedCard.skill.cost }}</span>
                      </div>

                      <!-- 属性标签 -->
                      <div v-if="selectedCard.attribute" class="skill-plan-tag">
                        <img :src="selectedCard.attribute.icon" :alt="selectedCard.attribute.type" class="plan-icon" />
                        <span>{{ selectedCard.attribute.type }}のみ</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 效果词条区域 -->
                <div class="skill-card-body">
                  <div class="effect-entries-list">
                    <template v-if="selectedCard.skill.effectEntries && selectedCard.skill.effectEntries.length > 0">
                      <!-- 基础效果词条 -->
                      <div
                        v-for="(entry, index) in isSkillEnhanced
                          ? selectedCard.skill.effectEntriesEnhanced
                          : selectedCard.skill.effectEntries"
                        :key="index"
                        class="effect-entry-item"
                        :class="{ consumption: entry.isConsumption }"
                      >
                        <img
                          v-if="entry.icon && entry.icon.trim()"
                          :src="entry.icon"
                          :alt="entry.effect"
                          class="entry-icon"
                          @error="handleIconError"
                        />
                        <span v-else class="entry-icon-bullet">●</span>
                        <span class="entry-text">{{ entry.effect || formatEffectEntry(entry) }}</span>
                      </div>

                      <!-- 条件效果词条 -->
                      <template
                        v-if="
                          (isSkillEnhanced
                            ? selectedCard.skill.conditionalEffectsEnhanced
                            : selectedCard.skill.conditionalEffects
                          )?.length
                        "
                      >
                        <div
                          v-for="(ce, index) in isSkillEnhanced
                            ? selectedCard.skill.conditionalEffectsEnhanced
                            : selectedCard.skill.conditionalEffects"
                          :key="'cond-' + index"
                          class="effect-entry-item conditional-effect"
                        >
                          <img
                            v-if="ce.icon && ce.icon.trim()"
                            :src="ce.icon"
                            :alt="ce.condition"
                            class="entry-icon"
                            @error="handleIconError"
                          />
                          <span v-else class="entry-icon-bullet">💡</span>
                          <span class="entry-text">{{ ce.condition }} {{ ce.effect }}</span>
                        </div>
                      </template>
                    </template>

                    <!-- 降级到旧格式 -->
                    <template v-else>
                      <div class="effect-entry-item legacy">
                        <span class="entry-text">{{ selectedCard.skill.effect }}</span>
                      </div>
                    </template>
                  </div>

                  <!-- 卡牌简介 -->
                  <!-- 卡牌简介 -->
                  <div v-if="selectedCard.skill.flavor || selectedCard.skill.flavorJP" class="skill-flavor-text">
                    <div v-if="selectedCard.skill.flavorJP" class="flavor-jp">{{ selectedCard.skill.flavorJP }}</div>
                    <div v-if="selectedCard.skill.flavor" class="flavor-cn">{{ selectedCard.skill.flavor }}</div>
                  </div>

                  <!-- 限制信息 -->
                  <div v-if="selectedCard.skill.restrictions" class="skill-restrictions-line">
                    {{ formatRestrictions(selectedCard.skill.restrictions) }}
                  </div>

                  <!-- 强化切换按钮 -->
                  <button class="toggle-enhancement-btn" @click="toggleSkillEnhancement">
                    <i :class="isSkillEnhanced ? 'fas fa-star' : 'far fa-star'"></i>
                    {{ isSkillEnhanced ? '觉醒效果' : '基础效果' }}
                  </button>

                  <!-- 查看原始输出按钮 -->
                  <button v-if="rawAIOutput" class="view-raw-output-btn" @click="showRawOutput = !showRawOutput">
                    <i class="fas" :class="showRawOutput ? 'fa-eye-slash' : 'fa-code'"></i>
                    <span>{{ showRawOutput ? '隐藏原始输出' : '查看原始输出' }}</span>
                  </button>

                  <!-- 修复按钮 (图标版) -->
                  <button v-if="selectedCard.skill" class="repair-icon-btn" title="修复技能" @click="openRepairModal">
                    <i class="fas fa-tools"></i>
                  </button>
                  <!-- 原始输出显示区域 -->
                  <div v-if="showRawOutput && rawAIOutput" class="raw-output-container">
                    <div class="raw-output-header">
                      <h4><i class="fas fa-code"></i> AI 原始输出</h4>
                      <button class="copy-output-btn" @click="copyRawOutput"><i class="fas fa-copy"></i> 复制</button>
                    </div>
                    <pre class="raw-output-content">{{ rawAIOutput }}</pre>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 全屏查看卡面 -->
    <div v-if="showFullscreenImage" class="fullscreen-modal" @click="closeFullscreenImage">
      <button class="fullscreen-close-btn" @click="closeFullscreenImage">
        <i class="fas fa-times"></i>
      </button>
      <img
        :src="isAwakenedMode ? selectedCard?.awakenedImageUrl : selectedCard?.fullImageUrl || selectedCard?.imageUrl"
        :alt="selectedCard?.fullCardName"
        class="fullscreen-image"
        @click.stop
      />
    </div>

    <!-- 技能卡修复弹窗 -->
    <div v-if="showRepairModal" class="repair-modal" @click="closeRepairModal">
      <div class="modal-content repair-content" @click.stop>
        <div class="modal-header">
          <h3><i class="fas fa-tools"></i> 修复技能卡</h3>
          <button class="close-btn" @click="closeRepairModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="repair-info">
            <p>如果技能卡描述与实际效果不符，或存在数值错误，请在此描述问题，AI 将尝试修复。</p>
            <div class="original-preview">
              <h4>当前技能: {{ selectedCard?.skill?.name }}</h4>
              <div class="preview-desc">
                <template v-if="selectedCard?.skill?.effectEntries && selectedCard.skill.effectEntries.length > 0">
                  <div
                    v-for="(entry, index) in selectedCard.skill.effectEntries"
                    :key="index"
                    class="effect-entry-item"
                  >
                    <span class="entry-bullet">●</span>
                    <span class="entry-text">{{ entry.effect || formatEffectEntry(entry) }}</span>
                  </div>
                  <template v-if="selectedCard.skill.conditionalEffects?.length">
                    <div
                      v-for="(ce, index) in selectedCard.skill.conditionalEffects"
                      :key="'cond-' + index"
                      class="effect-entry-item conditional-effect"
                    >
                      <span class="entry-bullet">💡</span>
                      <span class="entry-text">{{ ce.condition }} {{ ce.effect }}</span>
                    </div>
                  </template>
                </template>
                <template v-else>
                  {{ selectedCard?.skill?.description }}
                </template>
              </div>
            </div>
            <!-- Engine Data 展示区域 -->
            <div class="engine-data-preview">
              <h4>Engine Data (只读):</h4>
              <pre>{{
                selectedCard?.skill?.engine_data ? JSON.stringify(selectedCard.skill.engine_data, null, 2) : '{}'
              }}</pre>
            </div>
          </div>

          <div class="repair-input-area">
            <label for="repairIssue">问题描述:</label>
            <textarea
              id="repairIssue"
              v-model="repairIssueInput"
              placeholder="例如：效果描述说是增加30元气，但实际只增加了20..."
              rows="4"
              :disabled="isRepairing"
            ></textarea>
          </div>

          <div v-if="repairError" class="repair-error"><i class="fas fa-exclamation-circle"></i> {{ repairError }}</div>
        </div>

        <div class="modal-footer">
          <button class="cancel-btn" :disabled="isRepairing" @click="closeRepairModal">取消</button>
          <button class="confirm-btn" :disabled="isRepairing" @click="handleRepairSkill">
            <i class="fas" :class="isRepairing ? 'fa-spinner fa-spin' : 'fa-check'"></i>
            <span>{{ isRepairing ? '修复中...' : '开始修复' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { GachaUserData } from '../../../偶像大师闪耀色彩-gacha/types';
import { loadImageWithCache } from '../../工具/图片缓存';
import { loadUserData } from '../../工具/存储';

// 导入真实卡池数据
import { ALL_CARDS } from '../../卡牌管理/全部卡牌数据';
import { buildUrlFromFileName } from '../../工具/卡牌工具';
import { IDOL_UNITS } from '../../角色管理/组合数据';

// 导入角色卡属性数据
import { getCardAttribute } from '../../卡牌管理/卡牌属性';
import type { AttributeType, RecommendedStyle } from '../../类型/卡牌属性类型';
import { getAttributeColor, getAttributeIcon, getStyleIcon } from '../../类型/卡牌属性类型';

// 导入 AI 生成助手
import { generateSkillCard, generateSkillCardRepair } from '../../世界书管理';
import type {
  CardRestrictions,
  ConditionalEffectEntry,
  EffectEntry,
  ProducePlan,
  SkillCardRarity,
} from '../../战斗/类型/技能卡类型';
import { saveSkillCard } from '../服务/图鉴服务';

interface DisplayCard {
  fullCardName: string;
  characterName: string;
  theme: string;
  rarity: string;
  imageUrl: string; // 缩略图URL
  fullImageUrl?: string; // 完整卡面URL（用于详情弹窗）
  awakenedImageUrl?: string; // 觉醒后卡面URL
  isOwned: boolean;
  isNew: boolean;
  obtainedDate?: string;
  attribute?: {
    type: AttributeType;
    icon: string;
    color: string;
    stamina: number;
    style: RecommendedStyle;
    styleIcon: string;
    stats: {
      vocal: number;
      dance: number;
      visual: number;
    };
  };
  skill?: {
    name: string;
    description: string;
    effect: string; // 兼容旧格式
    // 词条式格式
    effectEntries?: EffectEntry[];
    effectEntriesEnhanced?: EffectEntry[];
    conditionalEffects?: ConditionalEffectEntry[];
    conditionalEffectsEnhanced?: ConditionalEffectEntry[];
    restrictions?: CardRestrictions;
    flavor?: string;
    flavorJP?: string; // T-12: 日语氛围文本
    cost?: string; // 费用
    display?: {
      name: string;
      description: string;
      flavor: string;
    }; // 显示信息
    // T-Repair: 修复模式字段
    engine_data?: any;
    engine_data_original?: any;
    repair_meta?: {
      issue: string;
      repairedAt: number;
      version: number;
    };
  } | null; // 技能卡信息（null 表示未生成）
}

// 用户数据（初始化为空，稍后异步加载）
const userData = ref<GachaUserData>({
  stardust: 0,
  level: 1,
  exp: 0,
  ownedCards: {},
  pity: { totalPulls: 0, ssrPity: 0, urPity: 0 },
  history: [],
});

// 选中的卡片（用于详情弹窗）
const selectedCard = ref<DisplayCard | null>(null);

// 全屏查看图片状态
const showFullscreenImage = ref(false);

// 觉醒模式状态
const isAwakenedMode = ref(false);

// AI 生成状态
const isGenerating = ref(false);
const generateError = ref<string | null>(null);
const rawAIOutput = ref<string | null>(null); // 存储 AI 原始输出
const showRawOutput = ref(false); // 控制原始输出显示
const isSkillEnhanced = ref(false); // 控制技能卡强化状态

// 修复模式状态
const showRepairModal = ref(false);
const repairIssueInput = ref('');
const isRepairing = ref(false);
const repairError = ref<string | null>(null);

// 原始卡片列表和显示的卡片列表
const allCards = ref<DisplayCard[]>([]);
const displayCards = ref<DisplayCard[]>([]);

// 筛选和排序面板显示状态
const showFilterPanel = ref(false);
const showSortPanel = ref(false);

// 排序设置
const sortBy = ref<'default' | 'rarity' | 'obtained'>('default');
const sortOrder = ref<'asc' | 'desc'>('asc');

// 筛选设置
const filters = ref({
  units: [] as string[],
  members: [] as string[], // 单个角色筛选
  ownership: 'all' as 'all' | 'owned' | 'not-owned',
  attributes: [] as string[],
});

// AI 生成用户特殊要求输入
const userDescriptionInput = ref('');

// 组合数据（从配置文件导入 - 权威数据源）
const units = IDOL_UNITS;

// 属性数据
const attributes = [
  { id: '理性', name: '理性' },
  { id: '感性', name: '感性' },
  { id: '非凡', name: '非凡' },
];

// 统计数据
const ownedCount = computed(() => displayCards.value.filter(c => c.isOwned).length);
const totalCount = computed(() => displayCards.value.length);
const completionRate = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.floor((ownedCount.value / totalCount.value) * 100);
});

/**
 * 初始化卡片列表
 */
async function initializeCards() {
  // 使用 ALL_CARDS，已经包含所有399张卡面
  const cards: DisplayCard[] = [];

  for (const card of ALL_CARDS) {
    const characterName = card.character;
    const theme = card.theme;

    // 使用角色缩略图（未觉醒版本）
    const thumbnailUrl = `https://283pro.site/shinycolors/角色缩略图/${card.fullName}.webp`;

    // 保存完整卡面URL用于详情弹窗
    const fullImageUrl = buildUrlFromFileName(card.baseImage, false);
    const awakenedImageUrl = buildUrlFromFileName(card.awakenedImage, false);

    // 检查是否已拥有 - 使用 fullName 作为 cardId
    const cardId = card.fullName;
    const isOwned = !!userData.value.ownedCards[cardId];

    // 使用缩略图作为显示图片
    let imageUrl = thumbnailUrl;
    if (isOwned) {
      try {
        imageUrl = await loadImageWithCache(thumbnailUrl);
      } catch (error) {
        console.warn(`加载缩略图失败，使用原始URL: ${card.fullName}`, error);
      }
    }

    // 获取角色卡属性数据（使用fullName作为key）
    const cardAttr = getCardAttribute(card.fullName);
    let attribute: DisplayCard['attribute'];
    if (cardAttr) {
      attribute = {
        type: cardAttr.attributeType,
        icon: getAttributeIcon(cardAttr.attributeType),
        color: getAttributeColor(cardAttr.attributeType),
        stamina: cardAttr.stamina,
        style: cardAttr.recommendedStyle,
        styleIcon: getStyleIcon(cardAttr.recommendedStyle),
        stats: {
          vocal: cardAttr.stats.vocal,
          dance: cardAttr.stats.dance,
          visual: cardAttr.stats.visual,
        },
      };
    }

    // 从 localStorage 加载技能卡数据
    const skillKey = `skill_${card.fullName}`;
    const savedSkill = localStorage.getItem(skillKey);
    let skill: DisplayCard['skill'] = null;
    if (savedSkill) {
      try {
        skill = JSON.parse(savedSkill);
      } catch (e) {
        console.warn(`解析技能卡数据失败: ${card.fullName}`, e);
      }
    }

    cards.push({
      fullCardName: card.fullName,
      characterName,
      theme,
      rarity: card.rarity,
      imageUrl, // 缩略图
      fullImageUrl, // 完整卡面
      awakenedImageUrl, // 觉醒后卡面
      isOwned,
      isNew: false, // TODO: 可以通过时间戳判断是否为新获得的卡
      obtainedDate: isOwned ? userData.value.ownedCards[cardId]?.obtainedAt : undefined,
      attribute,
      skill,
    });
  }

  // 排序：已拥有的优先，然后按稀有度，最后按卡面全名
  cards.sort((a, b) => {
    // 1. 已拥有的排在前面
    if (a.isOwned !== b.isOwned) {
      return a.isOwned ? -1 : 1;
    }

    // 2. 按稀有度排序
    const rarityOrder = { UR: 0, SSR: 1, SR: 2, R: 3 };
    const rarityDiff =
      rarityOrder[a.rarity as keyof typeof rarityOrder] - rarityOrder[b.rarity as keyof typeof rarityOrder];
    if (rarityDiff !== 0) return rarityDiff;

    // 3. 按卡面全名排序（包含主题）
    return a.fullCardName.localeCompare(b.fullCardName, 'ja');
  });

  allCards.value = cards;
  displayCards.value = cards;
}

/**
 * 切换组合筛选
 */
function toggleUnitFilter(unitId: string) {
  const index = filters.value.units.indexOf(unitId);
  if (index > -1) {
    filters.value.units.splice(index, 1);
  } else {
    filters.value.units.push(unitId);
  }
}

/**
 * 切换角色筛选
 */
function toggleMemberFilter(member: string) {
  const index = filters.value.members.indexOf(member);
  if (index > -1) {
    filters.value.members.splice(index, 1);
  } else {
    filters.value.members.push(member);
  }
}

/**
 * 切换属性筛选
 */
function toggleAttributeFilter(attrId: string) {
  const index = filters.value.attributes.indexOf(attrId);
  if (index > -1) {
    filters.value.attributes.splice(index, 1);
  } else {
    filters.value.attributes.push(attrId);
  }
}

/**
 * 重置筛选
 */
function resetFilters() {
  filters.value.units = [];
  filters.value.members = [];
  filters.value.ownership = 'all';
  filters.value.attributes = [];
}

/**
 * 应用筛选
 */
function applyFilters() {
  let filtered = [...allCards.value];

  // 按组合或单个角色筛选
  if (filters.value.units.length > 0 || filters.value.members.length > 0) {
    const selectedMembers = new Set<string>();

    // 添加选中组合的所有成员
    filters.value.units.forEach(unitId => {
      const unit = units.find(u => u.id === unitId);
      if (unit) {
        unit.members.forEach(member => selectedMembers.add(member));
      }
    });

    // 添加单独选中的角色
    filters.value.members.forEach(member => selectedMembers.add(member));

    filtered = filtered.filter(card => selectedMembers.has(card.characterName));
  }

  // 按持有状态筛选
  if (filters.value.ownership === 'owned') {
    filtered = filtered.filter(card => card.isOwned);
  } else if (filters.value.ownership === 'not-owned') {
    filtered = filtered.filter(card => !card.isOwned);
  }

  // 按属性筛选
  if (filters.value.attributes.length > 0) {
    filtered = filtered.filter(card => {
      // 如果卡片有属性数据，检查是否在筛选列表中
      if (card.attribute) {
        return filters.value.attributes.includes(card.attribute.type);
      }
      // 如果卡片没有属性数据，则不显示
      return false;
    });
  }

  displayCards.value = filtered;
  applySorting();
  showFilterPanel.value = false;
  toastr.success('筛选已应用', '', { timeOut: 1500 });
}

/**
 * 设置排序方式
 */
function setSortBy(type: 'default' | 'rarity' | 'obtained') {
  if (sortBy.value === type) {
    // 如果点击相同的排序，切换正序/倒序
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = type;
    sortOrder.value = 'asc';
  }
  applySorting();
}

/**
 * 切换排序方向（正序/倒序）
 */
function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  applySorting();
}

/**
 * 应用排序
 */
function applySorting() {
  const cards = [...displayCards.value];

  if (sortBy.value === 'default') {
    // 默认排序：已拥有优先，然后按稀有度，最后按卡面全名
    cards.sort((a, b) => {
      if (a.isOwned !== b.isOwned) {
        return a.isOwned ? -1 : 1;
      }
      const rarityOrder = { UR: 0, SSR: 1, SR: 2, R: 3 };
      const rarityDiff =
        rarityOrder[a.rarity as keyof typeof rarityOrder] - rarityOrder[b.rarity as keyof typeof rarityOrder];
      if (rarityDiff !== 0) return rarityDiff;
      return a.fullCardName.localeCompare(b.fullCardName, 'ja');
    });
  } else if (sortBy.value === 'rarity') {
    // 按品阶排序
    cards.sort((a, b) => {
      const rarityOrder = { UR: 0, SSR: 1, SR: 2, R: 3 };
      const rarityDiff =
        rarityOrder[a.rarity as keyof typeof rarityOrder] - rarityOrder[b.rarity as keyof typeof rarityOrder];
      if (rarityDiff !== 0) return sortOrder.value === 'asc' ? rarityDiff : -rarityDiff;
      return a.fullCardName.localeCompare(b.fullCardName, 'ja');
    });
  } else if (sortBy.value === 'obtained') {
    // 按加入顺序排序
    cards.sort((a, b) => {
      // 未拥有的卡片排在后面
      if (a.isOwned !== b.isOwned) {
        return a.isOwned ? -1 : 1;
      }
      if (!a.obtainedDate || !b.obtainedDate) {
        return 0;
      }
      const dateA = new Date(a.obtainedDate).getTime();
      const dateB = new Date(b.obtainedDate).getTime();
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }

  displayCards.value = cards;
}

/**
 * 点击卡片
 */
function handleCardClick(card: DisplayCard) {
  if (!card.isOwned) {
    toastr.info('尚未获得此卡片', '', { timeOut: 1500 });
    return;
  }
  selectedCard.value = card;
}

/**
 * 关闭详情弹窗
 */
function closeCardDetail() {
  selectedCard.value = null;
  showFullscreenImage.value = false;
  isAwakenedMode.value = false;
}

/**
 * 切换觉醒模式
 */
function toggleAwakenedMode() {
  isAwakenedMode.value = !isAwakenedMode.value;
}

/**
 * 打开全屏查看图片
 */
function openFullscreenImage() {
  showFullscreenImage.value = true;
}

/**
 * 关闭全屏查看图片
 */
function closeFullscreenImage() {
  showFullscreenImage.value = false;
}

/**
 * 处理图片加载错误
 */
function handleImageError(event: Event, card: DisplayCard) {
  console.error(`卡面加载失败: ${card.fullCardName}`, card.imageUrl);
  const img = event.target as HTMLImageElement;
  // 使用占位图
  img.src =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Crect width="400" height="600" fill="%23f0f0f0"/%3E%3Ctext x="200" y="280" font-family="Arial" font-size="24" fill="%23999" text-anchor="middle"%3E%E5%8D%A1%E9%9D%A2%E5%8A%A0%E8%BD%BD%E5%A4%B1%E8%B4%A5%3C/text%3E%3Ctext x="200" y="320" font-family="Arial" font-size="16" fill="%23999" text-anchor="middle"%3E' +
    encodeURIComponent(card.rarity) +
    '%3C/text%3E%3Ctext x="200" y="350" font-family="Arial" font-size="14" fill="%23999" text-anchor="middle"%3E' +
    encodeURIComponent(card.characterName) +
    '%3C/text%3E%3C/svg%3E';
}

/**
 * 生成技能卡
 */
async function handleGenerateSkill() {
  if (!selectedCard.value) return;
  if (isGenerating.value) {
    toastr.warning('正在生成中，请稍候...', '', { timeOut: 1500 });
    return;
  }

  // 重置错误状态
  generateError.value = null;
  rawAIOutput.value = null; // 清空之前的原始输出
  isGenerating.value = true;

  try {
    const card = selectedCard.value;

    // 确定培育计划（使用 attribute.type 而不是 attribute.style）
    let producePlan: ProducePlan = '感性'; // 默认
    if (card.attribute) {
      // 根据属性类型确定培育计划
      const attributeType = card.attribute.type;
      if (attributeType === '理性') {
        producePlan = '理性';
      } else if (attributeType === '非凡') {
        producePlan = '非凡';
      } else if (attributeType === '感性') {
        producePlan = '感性';
      }
    }

    toastr.info(`正在为 ${card.characterName} 生成 ${card.rarity} 级技能卡...`, '', {
      timeOut: 3000,
      progressBar: true,
    });

    // 调用 AI 生成助手（传递完整卡名和图片让AI了解主题）
    const result = await generateSkillCard({
      characterName: card.characterName,
      fullCardName: card.fullCardName, // 完整卡名如【硝子少女】杜野凛世
      rarity: card.rarity as SkillCardRarity,
      producePlan,
      recommendedStyle: card.attribute?.style,
      theme: card.theme,
      streaming: true, // 启用流式输出
      // 多模态支持：发送卡面图片（未觉醒 + 觉醒）
      cardImageUrl: card.fullImageUrl,
      awakenedImageUrl: card.awakenedImageUrl,
      // 用户特殊要求（高优先级）
      userDescription: userDescriptionInput.value,
    });

    // 保存原始输出（无论成功或失败）
    if (result.rawOutput) {
      rawAIOutput.value = result.rawOutput;
      console.log('📄 AI 原始输出已保存，长度:', result.rawOutput.length);
    }

    if (result.success && result.skillCard) {
      const skillCard = result.skillCard;
      console.log('🔍 [handleGenerateSkill] Generated card flavorJP:', skillCard.flavorJP);
      console.log('🔍 [handleGenerateSkill] Full skillCard object:', JSON.parse(JSON.stringify(skillCard)));

      // 保存到 localStorage（完整的技能卡数据）
      // T-15: 必须包含 engine_data 和其他 NG 引擎字段，否则战斗时无法正确执行
      const skillKey = `skill_${card.fullCardName}`;
      const skillData = JSON.stringify({
        name: skillCard.name,
        nameCN: skillCard.name, // 中文名
        cost: skillCard.cost,
        type: skillCard.type || '主动',
        plan: skillCard.plan,
        rarity: card.rarity,
        effect: skillCard.effect_before,
        effect_before: skillCard.effect_before,
        effect_after: skillCard.effect_after,
        effectEnhanced: skillCard.effect_after,
        description: '闪耀的偶像之力',
        // 词条式格式字段
        effectEntries: skillCard.effectEntries || [],
        effectEntriesEnhanced: skillCard.effectEntriesEnhanced || [],
        conditionalEffects: skillCard.conditionalEffects || [],
        conditionalEffectsEnhanced: skillCard.conditionalEffectsEnhanced || [],
        restrictions: skillCard.restrictions || { isDuplicatable: true, usesPerBattle: null },
        flavor: skillCard.flavor || '',
        flavorJP: skillCard.flavorJP || '',
        // T-15: NG 引擎必需字段 - 缺失这些字段会导致卡牌效果不执行
        engine_data: skillCard.engine_data,
        display: skillCard.display || {
          name: skillCard.name,
          description: skillCard.effect_before,
          flavor: skillCard.flavor || '',
        },
        visual_hint: skillCard.visual_hint,
      });

      try {
        localStorage.setItem(skillKey, skillData);
      } catch (storageError) {
        // 如果配额满了，尝试清理一些旧数据
        console.warn('⚠️ localStorage 配额不足，尝试清理旧数据...', storageError);

        // 清理以 'messageDetails' 开头的条目（酒馆消息缓存）
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('messageDetails')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🗑️ 已清理 ${keysToRemove.length} 条消息缓存`);

        // 再次尝试保存
        try {
          localStorage.setItem(skillKey, skillData);
          console.log('✅ 清理后保存成功');
        } catch (retryError) {
          console.error('❌ 清理后仍无法保存，跳过持久化', retryError);
          toastr.warning('存储空间不足，技能卡已生成但未持久化保存', '', { timeOut: 3000 });
        }
      }

      // 更新当前选中卡片的技能信息（完整对象）
      selectedCard.value.skill = {
        name: skillCard.name,
        cost: skillCard.cost,
        effect: skillCard.effect_before,
        description: '闪耀的偶像之力',
        // 新增：词条式格式字段
        effectEntries: skillCard.effectEntries || [],
        effectEntriesEnhanced: skillCard.effectEntriesEnhanced || [],
        conditionalEffects: skillCard.conditionalEffects || [],
        conditionalEffectsEnhanced: skillCard.conditionalEffectsEnhanced || [],
        restrictions: skillCard.restrictions || { isDuplicatable: true, usesPerBattle: null },
        flavor: skillCard.flavor || '',
        flavorJP: skillCard.flavorJP || '', // T-12: 更新日语 Flavor
        engine_data: skillCard.engine_data, // T-15: 确保内存中更新 engine_data
      };

      // 更新 allCards 和 displayCards 中对应的卡片
      const updateCardSkill = (cardsList: DisplayCard[]) => {
        const index = cardsList.findIndex(c => c.fullCardName === card.fullCardName);
        if (index !== -1 && selectedCard.value) {
          cardsList[index].skill = selectedCard.value.skill;
        }
      };
      updateCardSkill(allCards.value);
      updateCardSkill(displayCards.value);

      toastr.success(`技能卡生成成功！`, '', { timeOut: 2000 });
      console.log('✅ 技能卡已生成:', skillCard);
    } else {
      throw new Error(result.error || 'AI 生成失败');
    }
  } catch (error) {
    console.error('❌ 生成技能卡失败:', error);
    generateError.value = error instanceof Error ? error.message : '生成失败，请重试';
    toastr.error(`生成失败: ${generateError.value}`, '', { timeOut: 3000 });
  } finally {
    isGenerating.value = false;
  }
}

/**
 * 打开修复弹窗
 */
function openRepairModal() {
  if (!selectedCard.value || !selectedCard.value.skill) return;
  repairIssueInput.value = '';
  repairError.value = null;
  showRepairModal.value = true;
}

/**
 * 关闭修复弹窗
 */
function closeRepairModal() {
  showRepairModal.value = false;
  repairIssueInput.value = '';
  repairError.value = null;
}

/**
 * 处理技能卡修复
 */
async function handleRepairSkill() {
  if (!selectedCard.value || !selectedCard.value.skill) return;
  if (!repairIssueInput.value.trim()) {
    toastr.warning('请输入需要修复的问题', '', { timeOut: 1500 });
    return;
  }
  if (isRepairing.value) return;

  isRepairing.value = true;
  repairError.value = null;

  try {
    const card = selectedCard.value;
    const skill = card.skill;

    // 准备修复选项
    const options = {
      originalCardJson: JSON.stringify(skill),
      originalEngineData: JSON.stringify((skill as any).engine_data || {}),
      repairIssue: repairIssueInput.value,
      streaming: true,
    };

    const result = await generateSkillCardRepair(options);

    if (result.success && result.skillCard) {
      // 构造新的技能对象（保持 DisplayCard.skill 结构）
      const newSkill = {
        ...skill!, // 保留原有字段 (断言非空)
        ...result.skillCard, // 覆盖新字段
        // 确保 description 存在
        description: skill!.description,
        // 确保 effect 存在 (DisplayCard.skill 需要 effect 字段)
        effect: result.skillCard.effect_before || skill!.effect || '',
        // 确保 engine_data 更新
        engine_data: result.skillCard.engine_data,
        // 确保 repair_meta 更新
        repair_meta: (result.skillCard as any).repair_meta,
      };

      // 更新当前选中卡片
      selectedCard.value.skill = newSkill;

      // 更新列表中的卡片
      const updateCardSkill = (cardsList: DisplayCard[]) => {
        const index = cardsList.findIndex(c => c.fullCardName === card.fullCardName);
        if (index !== -1) {
          cardsList[index].skill = newSkill;
        }
      };
      updateCardSkill(allCards.value);
      updateCardSkill(displayCards.value);

      // 保存到本地存储
      saveSkillCard(card.fullCardName, newSkill);

      toastr.success('技能卡修复成功！', '', { timeOut: 1500 });
      closeRepairModal();
    } else {
      repairError.value = result.error || '修复失败，请重试';
    }
  } catch (error) {
    console.error('修复过程出错:', error);
    repairError.value = error instanceof Error ? error.message : String(error);
  } finally {
    isRepairing.value = false;
  }
}

/**
 * 复制原始输出到剪贴板
 */
function copyRawOutput() {
  if (!rawAIOutput.value) return;

  navigator.clipboard
    .writeText(rawAIOutput.value)
    .then(() => {
      toastr.success('原始输出已复制到剪贴板！', '', { timeOut: 1500 });
    })
    .catch(err => {
      console.error('复制失败:', err);
      toastr.error('复制失败，请手动复制', '', { timeOut: 1500 });
    });
}

/**
 * 切换技能强化状态
 */
function toggleSkillEnhancement() {
  isSkillEnhanced.value = !isSkillEnhanced.value;
}

/**
 * 处理图标加载错误
 */
function handleIconError(event: Event) {
  const img = event.target as HTMLImageElement;
  // 隐藏加载失败的图标
  img.style.display = 'none';
  console.warn('图标加载失败:', img.src);
}

/**
 * 格式化效果词条（词条式格式）
 */
function formatEffectEntry(entry: EffectEntry): string {
  if (!entry || !entry.effect) return '';
  return entry.effect;
}

/**
 * 格式化限制信息
 */
function formatRestrictions(restrictions: CardRestrictions): string {
  if (!restrictions) return '';

  const parts: string[] = [];

  // 检查是否可重复获得
  if (restrictions.isDuplicatable === false) {
    parts.push('重复不可');
  }

  // 检查演出中使用限制
  if (restrictions.usesPerBattle === 1) {
    parts.push('演出中限1次');
  }

  return parts.join('  '); // 使用双空格分隔
}

// 组件挂载时初始化
onMounted(async () => {
  // 先加载用户数据
  try {
    userData.value = await loadUserData();
  } catch (error) {
    console.error('加载用户数据失败:', error);
  }

  // 然后初始化卡片列表
  await initializeCards();
  toastr.success('偶像图鉴加载成功！', '', { timeOut: 2000 });
});
</script>

<style scoped lang="scss">
.idol-collection {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  overflow-y: auto;
}

.collection-header {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  h2 {
    margin: 0 0 15px 0;
    font-size: 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.collection-controls {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.control-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
}

.collection-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;

  .stat-item,
  .stat-progress {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    color: #333;
    font-weight: bold;

    i {
      color: #667eea;
    }
  }
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  padding-bottom: 20px;
}

.card-slot {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  &.locked {
    opacity: 0.5;
    filter: grayscale(100%);

    &:hover {
      transform: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }

  // 稀有度边框颜色
  &.rarity-ur.owned {
    border: 2px solid #ffd700;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
  }

  &.rarity-ssr.owned {
    border: 2px solid #ff1493;
    box-shadow: 0 0 12px rgba(255, 20, 147, 0.4);
  }

  &.rarity-sr.owned {
    border: 2px solid #9370db;
    box-shadow: 0 0 10px rgba(147, 112, 219, 0.4);
  }
}

.card-image-wrapper {
  width: 100%;
  aspect-ratio: 1 / 1; // 缩略图是正方形
  overflow: hidden;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-locked {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #999;

  i {
    font-size: 32px;
  }

  p {
    margin: 0;
    font-size: 11px;
  }
}

.card-info {
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.95);
}

.card-rarity-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  margin-bottom: 3px;

  &.rarity-ur {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    color: #333;
  }

  &.rarity-ssr {
    background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
    color: white;
  }

  &.rarity-sr {
    background: linear-gradient(135deg, #9370db 0%, #ba55d3 100%);
    color: white;
  }
}

.card-name {
  margin: 0;
  font-size: 11px;
  color: #333;
  font-weight: bold;
  line-height: 1.3;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2; /* 最多显示2行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 28px; /* 保持高度一致 */
}

.new-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffd93d 100%);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 2px;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.5);
  animation: newPulse 2s ease-in-out infinite;

  i {
    animation: starRotate 4s linear infinite;
    font-size: 8px;
  }
}

@keyframes newPulse {
  0%,
  100% {
    box-shadow: 0 2px 10px rgba(255, 107, 107, 0.5);
  }
  50% {
    box-shadow: 0 4px 20px rgba(255, 107, 107, 0.8);
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

/* 卡片详情弹窗 */
.card-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 1200px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideIn 0.3s ease;
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

.detail-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 30px;
  margin-top: 20px;
  height: 75vh;
  min-height: 600px;

  @media (max-width: 1024px) {
    grid-template-columns: 400px 1fr;
    height: auto;
    min-height: auto;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.detail-image {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);

    .fullscreen-hint {
      opacity: 1;
    }
  }

  .full-card-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  .detail-rarity-badge {
    position: absolute;
    top: 15px;
    left: 15px;
    padding: 8px 20px;
    border-radius: 20px;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    z-index: 2;

    &.rarity-ur {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      color: #333;
    }

    &.rarity-ssr {
      background: linear-gradient(135deg, #ff1493 0%, #ff69b4 100%);
      color: white;
    }

    &.rarity-sr {
      background: linear-gradient(135deg, #9370db 0%, #ba55d3 100%);
      color: white;
    }
  }

  .fullscreen-hint {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
    padding: 30px 20px 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: white;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 2;

    i {
      font-size: 18px;
    }
  }

  // 觉醒翻转按钮
  .awaken-toggle-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 50px;
    height: 50px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 215, 0, 0.5);
    border-radius: 50%;
    color: #667eea;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 3;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

    i {
      transition: transform 0.3s ease;
    }

    &:hover {
      transform: scale(1.1);
      background: rgba(255, 255, 255, 1);
      border-color: rgba(255, 215, 0, 0.8);
      box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);

      i {
        transform: rotate(180deg);
      }
    }

    &.awakened {
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      border-color: #ffd700;
      color: #333;
      animation: awakenPulse 2s ease-in-out infinite;

      &:hover {
        background: linear-gradient(135deg, #ffed4e 0%, #ffd700 100%);
      }
    }
  }
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  height: 100%;

  .detail-card-name {
    font-size: 22px;
    margin: 0;
    color: #333;
    font-weight: bold;
    padding-bottom: 15px;
    border-bottom: 2px solid #f0f0f0;
  }

  // 属性徽章
  .attribute-section {
    .attribute-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 12px 20px;
      border-radius: 25px;
      color: white;
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

      .attr-icon {
        width: 28px;
        height: 28px;
        object-fit: contain;
      }
    }
  }

  // 体力和流派行
  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 12px;
    border-left: 4px solid #667eea;

    .stat-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 16px;
      font-weight: bold;
      color: #333;

      .stat-icon {
        width: 24px;
        height: 24px;
        object-fit: contain;
      }
    }

    .stat-value {
      font-size: 20px;
      font-weight: bold;
      color: #667eea;
    }
  }

  // 三维属性柱状图
  .stats-chart {
    padding: 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 15px;

    h4 {
      margin: 0 0 20px 0;
      font-size: 18px;
      color: #333;
      font-weight: bold;
      text-align: center;
    }

    .chart-item {
      margin-bottom: 18px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .chart-label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      font-size: 15px;
      font-weight: bold;
      color: #333;

      .chart-icon {
        width: 20px;
        height: 20px;
        object-fit: contain;
      }
    }

    .chart-bar-wrapper {
      background: #e0e0e0;
      border-radius: 10px;
      height: 32px;
      overflow: hidden;
      position: relative;
    }

    .chart-bar {
      height: 100%;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 12px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);

      .bar-value {
        font-size: 14px;
        font-weight: bold;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      &.vocal {
        background: linear-gradient(90deg, #ff6b9d 0%, #ff1493 100%);
      }

      &.dance {
        background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
      }

      &.visual {
        background: linear-gradient(90deg, #ffd700 0%, #ffa500 100%);
      }
    }

    .stats-total {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #d0d0d0;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
      color: #667eea;
    }
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

/* 筛选面板 */
.filter-panel,
.sort-panel {
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;

  h3 {
    margin: 0;
    font-size: 20px;
    color: #667eea;
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.close-panel-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  width: 30px;
  height: 30px;
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

.filter-section {
  margin-bottom: 25px;

  h4 {
    margin: 0 0 15px 0;
    font-size: 16px;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

/* 组合筛选 */
.unit-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.unit-filter-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;

  &:hover {
    background: #e9ecef;
    border-color: #667eea;
  }
}

.unit-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .fa-check-circle {
    font-size: 20px;
    color: #ddd;
    transition: all 0.3s;

    &.active {
      color: #667eea;
    }
  }

  .unit-icon {
    font-size: 24px;
  }

  .unit-icon-img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  .unit-name {
    font-weight: bold;
    color: #333;
    flex: 1;
  }
}

.unit-members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 40px;

  .member-name {
    background: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    color: #666;
    border: 1px solid #e0e0e0;
    cursor: pointer;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 4px;

    i {
      font-size: 10px;
      color: #ddd;
      transition: all 0.3s;
    }

    &:hover {
      background: #f0f0f0;
      border-color: #667eea;
    }

    &.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: #667eea;

      i {
        color: white;
      }
    }
  }
}

/* 持有状态筛选 */
.ownership-filters {
  display: flex;
  gap: 12px;
}

.ownership-item {
  flex: 1;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  i {
    font-size: 20px;
    color: #ddd;
    transition: all 0.3s;
  }

  span {
    font-weight: bold;
    color: #666;
  }

  &:hover {
    background: #e9ecef;
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;

    i {
      color: white;
    }

    span {
      color: white;
    }
  }
}

/* 属性筛选 */
.attribute-filters {
  display: flex;
  gap: 12px;
}

.attribute-item {
  flex: 1;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  i {
    font-size: 20px;
    color: #ddd;
    transition: all 0.3s;
  }

  .attr-icon-small {
    width: 24px;
    height: 24px;
    object-fit: contain;
    opacity: 0.5;
    transition: all 0.3s;
  }

  span {
    font-weight: bold;
    color: #666;
    transition: all 0.3s;
  }

  &:hover {
    background: #e9ecef;
    transform: translateY(-2px);
  }

  // 理性（蓝色）
  &.attr-理性.active {
    background: linear-gradient(135deg, #4a90e2 0%, #5ba3f5 100%);
    border-color: #4a90e2;
    box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);

    i {
      color: white;
    }

    .attr-icon-small {
      opacity: 1;
      filter: brightness(0) invert(1);
    }

    span {
      color: white;
    }
  }

  // 感性（粉色）
  &.attr-感性.active {
    background: linear-gradient(135deg, #ff69b4 0%, #ff8cc7 100%);
    border-color: #ff69b4;
    box-shadow: 0 4px 15px rgba(255, 105, 180, 0.3);

    i {
      color: white;
    }

    .attr-icon-small {
      opacity: 1;
      filter: brightness(0) invert(1);
    }

    span {
      color: white;
    }
  }

  // 非凡（紫色）
  &.attr-非凡.active {
    background: linear-gradient(135deg, #9b59b6 0%, #b370cf 100%);
    border-color: #9b59b6;
    box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);

    i {
      color: white;
    }

    .attr-icon-small {
      opacity: 1;
      filter: brightness(0) invert(1);
    }

    span {
      color: white;
    }
  }
}

/* 筛选操作按钮 */
.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.reset-btn,
.apply-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}

.reset-btn {
  background: #f0f0f0;
  color: #666;

  &:hover {
    background: #e0e0e0;
    color: #333;
  }
}

.apply-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.5);
  }
}

/* 排序面板 */
.sort-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.sort-option-btn {
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #666;

  i {
    font-size: 24px;
    color: #999;
  }

  &:hover {
    background: #e9ecef;
    border-color: #667eea;
  }

  &.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
    color: white;

    i {
      color: white;
    }
  }
}

/* 排序方向切换 */
.sort-order-toggle {
  display: flex;
  gap: 12px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #f0f0f0;
}

.order-btn {
  flex: 1;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: bold;
  color: #666;

  i {
    font-size: 18px;
  }

  &:hover {
    background: #e9ecef;
    border-color: #667eea;
  }

  &.active {
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    border-color: #ffd700;
    color: #333;

    i {
      color: #333;
    }
  }
}

/* 全屏查看卡面 */
.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20000;
  animation: fadeIn 0.3s ease;
  cursor: zoom-out;
  padding: 20px;
}

.fullscreen-close-btn {
  position: fixed;
  top: 30px;
  right: 30px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  color: white;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 20001;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
    border-color: rgba(255, 255, 255, 0.5);
  }

  &:active {
    transform: rotate(90deg) scale(0.95);
  }
}

.fullscreen-image {
  max-width: 95%;
  max-height: 95vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
  animation: zoomIn 0.3s ease;
  cursor: default;
}

// 觉醒模式脉冲动画
@keyframes awakenPulse {
  0%,
  100% {
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  }
  50% {
    box-shadow: 0 6px 25px rgba(255, 215, 0, 0.8);
  }
}

// 技能卡封印效果
.skill-sealed {
  position: relative;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  padding: 40px;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.5);

  .sealed-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;

    .chain-decoration {
      position: absolute;
      width: 200%;
      height: 2px;
      background: repeating-linear-gradient(90deg, transparent, transparent 10px, #666 10px, #666 20px);
      animation: chainRotate 20s linear infinite;
    }

    .chain-1 {
      top: 20%;
      left: -50%;
      transform: rotate(-15deg);
    }

    .chain-2 {
      top: 50%;
      left: -50%;
      transform: rotate(15deg);
      animation-delay: -7s;
    }

    .chain-3 {
      top: 80%;
      left: -50%;
      transform: rotate(-10deg);
      animation-delay: -14s;
    }
  }

  .sealed-content {
    position: relative;
    z-index: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;

    .sealed-lock {
      font-size: 80px;
      color: #555;
      animation: lockShake 3s ease-in-out infinite;
    }

    .sealed-title {
      font-size: 28px;
      color: #999;
      margin: 0;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }

    .sealed-hint {
      font-size: 16px;
      color: #666;
      margin: 0;
    }

    .generate-skill-btn {
      margin-top: 20px;
      background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
      border: none;
      padding: 15px 40px;
      border-radius: 30px;
      font-size: 18px;
      font-weight: bold;
      color: #333;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);

      &:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 8px 30px rgba(255, 215, 0, 0.6);
      }

      &:active:not(:disabled) {
        transform: translateY(-1px) scale(1.02);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: linear-gradient(135deg, #999 0%, #bbb 100%);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      }
    }

    .generate-error {
      margin-top: 15px;
      color: #ff4444;
      font-size: 14px;
      text-align: center;
      background: rgba(255, 68, 68, 0.1);
      padding: 10px;
      border-radius: 8px;
      border: 1px solid rgba(255, 68, 68, 0.3);
    }

    .view-raw-output-btn {
      margin-top: 10px;
      background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
      border: none;
      padding: 10px 25px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 10px rgba(74, 144, 226, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(74, 144, 226, 0.5);
      }

      &:active {
        transform: translateY(0);
      }
    }

    .raw-output-container {
      margin-top: 20px;
      background: #1e1e1e;
      border-radius: 12px;
      padding: 15px;
      max-width: 100%;
      animation: slideIn 0.3s ease;

      .raw-output-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #333;

        h4 {
          margin: 0;
          color: #4a90e2;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .copy-output-btn {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border: none;
          padding: 6px 15px;
          border-radius: 15px;
          font-size: 12px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s ease;

          &:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 8px rgba(40, 167, 69, 0.4);
          }

          &:active {
            transform: scale(0.98);
          }
        }
      }

      .raw-output-content {
        margin: 0;
        padding: 15px;
        background: #0d0d0d;
        border-radius: 8px;
        color: #dcdcdc;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.6;
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
        max-height: 500px;
        overflow-y: auto;

        &::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        &::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
          background: #4a90e2;
          border-radius: 4px;

          &:hover {
            background: #357abd;
          }
        }
      }
    }

    .spinning {
      animation: lockShake 0.5s ease-in-out infinite;
    }
  }
}

@keyframes lockShake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

@keyframes chainRotate {
  from {
    transform: translateX(0) rotate(-15deg);
  }
  to {
    transform: translateX(50%) rotate(-15deg);
  }
}

// 技能卡信息显示（新版词条式格式）
.skill-card-new {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 20px;
  padding: 30px;
  height: 100%;
  overflow-y: auto;

  // 顶部区域：缩略图 + 卡牌名
  .skill-card-header {
    display: flex;
    gap: 20px;
    align-items: flex-start;

    .skill-card-thumbnail {
      flex-shrink: 0;
      width: 200px;
      height: 200px;

      .skill-thumbnail-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 15px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        transition: transform 0.3s ease;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    .skill-card-title-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 15px;

      .skill-name {
        margin: 0;
        font-size: 28px;
        font-weight: bold;
        color: #667eea;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        line-height: 1.3;
      }

      .skill-meta-row {
        display: flex;
        gap: 15px;
        align-items: center;
        flex-wrap: wrap;
      }

      .skill-cost-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 18px;
        background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
        border: 2px solid #f39c12;
        border-radius: 20px;
        font-size: 16px;
        font-weight: bold;
        color: #8b6914;
        box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);

        i {
          font-size: 18px;
        }
      }

      .skill-plan-tag {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: rgba(102, 126, 234, 0.15);
        border: 2px solid #667eea;
        border-radius: 25px;
        width: fit-content;
        font-size: 16px;
        font-weight: bold;
        color: #667eea;

        .plan-icon {
          width: 24px;
          height: 24px;
        }
      }
    }
  }

  // 主体区域：效果词条
  .skill-card-body {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .effect-entries-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .effect-entry-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 14px 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s ease;
        animation: skillCardSlideIn 0.4s ease;

        &:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .entry-icon {
          width: 32px;
          height: 32px;
          object-fit: contain;
          flex-shrink: 0;
          filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
        }

        .entry-icon-bullet {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #667eea;
          flex-shrink: 0;
        }

        .entry-text {
          font-size: 18px;
          color: #2d3748;
          font-weight: 500;
          flex: 1;
          line-height: 1.5;
        }

        &.consumption {
          background: linear-gradient(135deg, #ffe8e8 0%, #ffd0d0 100%);
          border-left: 4px solid #d63031;

          .entry-text {
            color: #d63031;
            font-weight: bold;
          }
        }

        &.conditional-effect {
          background: linear-gradient(135deg, #fff9e6 0%, #ffe9a3 100%);
          border-left: 4px solid #ffc107;

          .entry-text {
            color: #f39c12;
            font-weight: 600;
          }
        }

        &.legacy {
          .entry-text {
            color: #666;
            font-style: italic;
          }
        }
      }
    }

    // 卡牌简介
    .skill-flavor-text {
      padding: 18px 24px;
      background: rgba(102, 126, 234, 0.08);
      border-radius: 12px;
      border-left: 4px solid #667eea;
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .flavor-jp {
        font-size: 14px;
        color: #888;
        font-family: 'Yu Mincho', 'MS PMincho', serif;
        font-style: italic;
        line-height: 1.6;
      }

      .flavor-cn {
        font-size: 16px;
        color: #555;
        font-style: italic;
        line-height: 1.8;
      }
    }

    // 限制信息（单独一行，底部紫色）
    .skill-restrictions-line {
      padding: 14px 24px;
      background: linear-gradient(135deg, #e8e8ff 0%, #d0d0ff 100%);
      border-radius: 12px;
      border: 2px solid #9b59b6;
      font-size: 16px;
      font-weight: bold;
      color: #8e44ad;
      text-align: center;
      margin-top: 5px;
      box-shadow: 0 2px 8px rgba(155, 89, 182, 0.2);
    }

    // 强化切换按钮
    .toggle-enhancement-btn {
      align-self: center;
      padding: 12px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 30px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      margin-top: 15px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      }

      &:active {
        transform: translateY(0);
      }

      i {
        font-size: 18px;
        animation: awakenPulse 2s ease-in-out infinite;
      }
    }
  }
}

@keyframes skillCardSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 旧版技能卡样式（保留兼容）
.skill-card {
  padding: 30px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  animation: skillCardSlideIn 0.5s ease;

  .skill-attribute {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    align-self: flex-start;
    font-size: 14px;
    font-weight: bold;
    color: #666;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

    .skill-attr-icon {
      width: 20px;
      height: 20px;
      object-fit: contain;
    }
  }

  .skill-name {
    font-size: 32px;
    margin: 0;
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
    text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
    letter-spacing: 2px;
  }

  .skill-effect {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

    .effect-label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      font-weight: bold;

      i {
        font-size: 16px;
      }
    }

    .effect-value {
      font-size: 24px;
      font-weight: bold;
      color: white;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
  }

  .skill-description {
    padding: 20px;
    background: white;
    border-radius: 15px;
    border-left: 4px solid #667eea;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

    .description-label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      color: #667eea;
      font-size: 14px;
      font-weight: bold;

      i {
        font-size: 16px;
      }
    }

    .description-text {
      margin: 0;
      font-size: 16px;
      line-height: 1.6;
      color: #333;
    }
  }
}

@keyframes skillCardSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .sort-options {
    grid-template-columns: 1fr;
  }

  .ownership-filters,
  .attribute-filters {
    flex-direction: column;
  }

  .fullscreen-close-btn {
    width: 50px;
    height: 50px;
    font-size: 24px;
    top: 20px;
    right: 20px;
  }
}

/* AI 生成用户描述输入框 */
.user-description-input {
  width: 100%;
  max-width: 400px;
  margin: 15px auto;
  text-align: left;

  label {
    display: block;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    margin-bottom: 8px;

    i {
      color: #ffd700;
      margin-right: 6px;
    }
  }

  input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid rgba(255, 215, 0, 0.3);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.95);
    color: #333;
    font-size: 14px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

    &::placeholder {
      color: #999;
    }

    &:focus {
      outline: none;
      border-color: #ffd700;
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
    }

    &:disabled {
      background: rgba(200, 200, 200, 0.5);
      cursor: not-allowed;
    }
  }
}

/* 修复按钮样式 */
/* 修复按钮样式 (图标版) */
.repair-icon-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e0e0e0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 10;

  &:hover {
    background: #e74c3c;
    color: white;
    border-color: #e74c3c;
    transform: scale(1.1) rotate(15deg);
    box-shadow: 0 6px 15px rgba(231, 76, 60, 0.3);
  }

  i {
    font-size: 18px;
  }
}

/* 修复弹窗样式 */
.repair-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20000;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;

  .repair-content {
    width: 90%;
    max-width: 600px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    animation: zoomIn 0.3s ease;
  }

  .modal-header {
    padding: 20px;
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 0.3s;

      &:hover {
        opacity: 1;
      }
    }
  }

  .modal-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;

    .repair-info {
      p {
        margin: 0 0 15px;
        color: #666;
        font-size: 14px;
        line-height: 1.5;
      }

      .original-preview {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 10px;
        border-left: 4px solid #e74c3c;

        h4 {
          margin: 0 0 8px;
          color: #2c3e50;
          font-size: 16px;
        }

        .preview-desc {
          margin: 0;
          color: #555;
          font-size: 14px;
          line-height: 1.6;

          .effect-entry-item {
            margin-bottom: 6px;
            display: flex;
            align-items: flex-start;
            gap: 8px;

            .entry-bullet {
              color: #667eea;
              font-size: 12px;
              margin-top: 2px;
            }

            &.conditional-effect {
              color: #e67e22;
              margin-top: 8px;

              .entry-bullet {
                color: #e67e22;
              }
            }
          }
        }
      }

      .engine-data-preview {
        margin-top: 15px;
        background: #f8f9fa;
        padding: 15px;
        border-radius: 10px;
        border-left: 4px solid #3498db;

        h4 {
          margin: 0 0 8px;
          color: #2c3e50;
          font-size: 14px;
        }

        pre {
          margin: 0;
          color: #555;
          font-size: 12px;
          font-family: monospace;
          white-space: pre-wrap;
          word-wrap: break-word;
          max-height: 150px;
          overflow-y: auto;
          background: #fff;
          padding: 10px;
          border: 1px solid #eee;
          border-radius: 6px;
        }
      }
    }

    .repair-input-area {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-weight: bold;
        color: #2c3e50;
      }

      textarea {
        width: 100%;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        font-size: 14px;
        line-height: 1.6;
        resize: vertical;
        transition: all 0.3s ease;

        &:focus {
          outline: none;
          border-color: #e74c3c;
          box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
        }

        &:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }
      }
    }

    .repair-error {
      padding: 12px;
      background: #fdecea;
      border-radius: 8px;
      color: #e74c3c;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .modal-footer {
    padding: 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background: #f8f9fa;

    button {
      padding: 10px 24px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;

      &.cancel-btn {
        background: white;
        border: 1px solid #ddd;
        color: #666;

        &:hover {
          background: #f1f1f1;
        }
      }

      &.confirm-btn {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
        border: none;
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
      }
    }
  }
}
</style>
