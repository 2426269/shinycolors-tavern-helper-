<template>
  <div
    class="product-card"
    :class="{
      'is-card': item.type === 'card',
      'is-drink': item.type === 'drink',
      'is-sold-out': item.isSoldOut,
      'is-selected': isSelected,
      'cant-afford': !canAfford && !item.isSoldOut,
    }"
    @click="$emit('click')"
  >
    <!-- 卡牌数字 (仅卡牌显示) -->
    <div v-if="item.type === 'card'" class="card-number">
      {{ cardNumber }}
    </div>

    <!-- 商品图片 -->
    <div class="product-image">
      <img :src="imageUrl" :alt="itemName" @error="handleImageError" />

      <!-- SALE 标签 -->
      <div v-if="item.isSale && !item.isSoldOut" class="sale-tag">SALE</div>

      <!-- NEW 标签 -->
      <div v-if="isNew && !item.isSoldOut" class="new-tag">NEW</div>

      <!-- 售罄遮罩 -->
      <div v-if="item.isSoldOut" class="sold-out-overlay">
        <span>售罄</span>
      </div>
    </div>

    <!-- 价格区域 -->
    <div class="price-area">
      <span class="p-icon">Ⓟ</span>
      <span v-if="item.isSale" class="original-price">{{ item.basePrice }}</span>
      <span class="current-price" :class="{ 'sale-price': item.isSale }">
        {{ item.price }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { SkillCard } from '../../战斗/类型';
import type { PDrink } from '../../战斗/类型/P饮料类型';
import { getShopItemImageUrl } from '../服务/ConsultationService';
import type { ShopItem } from '../类型/ConsultationTypes';

const props = defineProps<{
  item: ShopItem;
  canAfford: boolean;
  isSelected?: boolean;
  isNew?: boolean;
}>();

defineEmits<{
  (e: 'click'): void;
}>();

// Computed
const imageUrl = computed(() => getShopItemImageUrl(props.item));

const itemName = computed(() => {
  if (props.item.type === 'card') {
    return (props.item.data as SkillCard).name;
  } else {
    return (props.item.data as PDrink).nameCN;
  }
});

const cardNumber = computed(() => {
  if (props.item.type === 'card') {
    const card = props.item.data as SkillCard;
    // 显示卡牌的某个数值 (这里用 cost 的绝对值作为示例)
    return Math.abs(card.cost || 0);
  }
  return 0;
});

// Fallback image
const fallbackSrc = ref('/assets/placeholder.webp');

function handleImageError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.src = fallbackSrc.value;
}
</script>

<style scoped>
.product-card {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.product-card:hover:not(.is-sold-out):not(.cant-afford) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.product-card.is-selected {
  outline: 3px solid #4dd0e1;
}

.product-card.is-sold-out {
  opacity: 0.5;
  cursor: not-allowed;
}

.product-card.cant-afford {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 卡牌数字 */
.card-number {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  font-weight: bold;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

/* 商品图片 */
.product-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* SALE 标签 */
.sale-tag {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

/* NEW 标签 */
.new-tag {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 售罄遮罩 */
.sold-out-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

/* 价格区域 */
.price-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 4px;
  background: #f5f5f5;
  font-size: 12px;
}

.p-icon {
  color: #ff9800;
  font-weight: bold;
}

.original-price {
  text-decoration: line-through;
  color: #999;
  font-size: 10px;
}

.current-price {
  font-weight: bold;
  color: #333;
}

.current-price.sale-price {
  color: #e53935;
}

/* 饮料样式调整 */
.is-drink .product-image {
  padding: 8px;
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
}

.is-drink .product-image img {
  object-fit: contain;
}
</style>
