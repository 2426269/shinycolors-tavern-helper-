<template>
  <div class="resource-bar">
    <div class="resource-item gems">
      <img :src="FEATHER_STONE_IMAGE" alt="羽石" class="icon-img" />
      <span class="label">羽石</span>
      <span class="value">{{ gems.toLocaleString() }}</span>
    </div>

    <div class="resource-item stardust">
      <img :src="RESOURCE_ICONS.RAINBOW_PIECE" alt="星尘" class="icon-img" />
      <span class="label">星尘</span>
      <span class="value">{{ stardust.toLocaleString() }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FEATHER_STONE_IMAGE, RESOURCE_ICONS } from '../../工具/constants';

defineProps<{
  gems: number;
  stardust: number;
}>();
</script>

<style scoped lang="scss">
.resource-bar {
  display: flex;
  gap: 20px;
  padding: 15px 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: bold;

  .icon {
    font-size: 20px;
  }

  .icon-img {
    width: 36px;
    height: 36px;
    object-fit: contain;
    background: transparent;
    border: none;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
  }

  .label {
    font-size: 14px;
    opacity: 0.9;
  }

  .value {
    font-size: 20px;
    min-width: 60px;
    text-align: right;
  }

  &.gems .value {
    color: #ffd700;
  }

  &.stardust .value {
    color: #87ceeb;
  }
}
</style>
