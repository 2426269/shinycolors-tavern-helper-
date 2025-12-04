<template>
  <div class="character-select-page">
    <!-- 左侧：角色列表 -->
    <div class="left-panel">
      <div class="panel-header">
        <h2><i class="fas fa-users"></i> 选择角色</h2>
      </div>

      <div class="character-list">
        <div
          v-for="character in spineCharacters"
          :key="character.id"
          class="character-item"
          :class="{ active: selectedCharacterId === character.id }"
          @click="selectCharacter(character)"
        >
          <div class="char-avatar" :style="{ borderColor: getCharacterColor(character.id) }">
            <i class="fas fa-user"></i>
          </div>
          <div class="char-info">
            <span class="char-name">{{ character.chineseName }}</span>
            <span class="char-unit">{{ getCharacterUnit(character.id) }}</span>
          </div>
          <i v-if="selectedCharacterId === character.id" class="fas fa-check-circle active-icon"></i>
        </div>
      </div>

      <!-- 卡面选择（当角色有多张卡） -->
      <div v-if="selectedCharacter && selectedCharacter.cards.length > 1" class="card-select">
        <div class="section-title"><i class="fas fa-id-card"></i> 选择卡面</div>
        <div class="card-list">
          <div
            v-for="(card, index) in selectedCharacter.cards"
            :key="index"
            class="card-item"
            :class="{ active: selectedCardIndex === index }"
            @click="selectCard(index)"
          >
            <span class="card-name">{{ card.displayName }}</span>
            <i v-if="selectedCardIndex === index" class="fas fa-check"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧：Spine 预览 -->
    <div class="right-panel">
      <!-- 顶部：卡面名称 -->
      <div class="spine-header">
        <h3 class="spine-name">{{ currentCardDisplayName }}</h3>
        <div class="costume-toggle">
          <button
            class="costume-btn"
            :class="{ active: previewCostume === 'normal' }"
            @click="previewCostume = 'normal'"
          >
            <i class="fas fa-tshirt"></i> 常服
          </button>
          <button
            class="costume-btn"
            :class="{ active: previewCostume === 'idol' }"
            :disabled="!currentCardHasIdolCostume"
            @click="previewCostume = 'idol'"
          >
            <i class="fas fa-star"></i> 偶像服
          </button>
        </div>
      </div>

      <!-- Spine 预览区域 -->
      <div class="spine-preview-container">
        <SpinePlayer
          v-if="previewSpineId"
          :key="previewSpineId + previewCostume"
          :idol-id="previewSpineId"
          :costume="previewCostume"
          class="spine-preview"
        />
        <div v-else class="no-preview">
          <i class="fas fa-user-circle"></i>
          <p>请选择角色</p>
        </div>
      </div>

      <!-- 右下角：应用按钮 -->
      <div class="action-buttons">
        <button class="cancel-btn" @click="handleCancel"><i class="fas fa-times"></i> 取消</button>
        <button class="apply-btn" :disabled="!selectedCharacterId" @click="handleApply">
          <i class="fas fa-check"></i> 应用
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import SpinePlayer from '../组件/Spine播放器.vue';
import { getSpineId, SPINE_CHARACTERS, type CharacterSpineData } from '../角色管理/spine资源映射';
import { IDOLS } from '../角色管理/角色数据';

// Props
const props = defineProps<{
  currentSpineId?: string;
  currentCostume?: 'normal' | 'idol';
}>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'apply', spineId: string, costume: 'normal' | 'idol'): void;
}>();

// 角色数据
const spineCharacters = SPINE_CHARACTERS;

// 选中状态
const selectedCharacterId = ref<string>('');
const selectedCardIndex = ref(0);
const previewCostume = ref<'normal' | 'idol'>('normal');

// 计算属性
const selectedCharacter = computed<CharacterSpineData | undefined>(() => {
  return spineCharacters.find(c => c.id === selectedCharacterId.value);
});

const currentCard = computed(() => {
  if (!selectedCharacter.value) return null;
  return selectedCharacter.value.cards[selectedCardIndex.value] || null;
});

const currentCardDisplayName = computed(() => {
  if (!selectedCharacter.value || !currentCard.value) return '请选择角色';
  return `${selectedCharacter.value.chineseName} - ${currentCard.value.displayName}`;
});

const currentCardHasIdolCostume = computed(() => {
  return currentCard.value?.hasIdolCostume ?? false;
});

const previewSpineId = computed(() => {
  if (!selectedCharacter.value || !currentCard.value) return '';
  return getSpineId(selectedCharacter.value.japaneseName, currentCard.value.name);
});

// 获取角色颜色
function getCharacterColor(id: string): string {
  const idol = IDOLS.find(i => i.id === id);
  return idol?.color || '#888';
}

// 获取角色组合
function getCharacterUnit(id: string): string {
  const idol = IDOLS.find(i => i.id === id);
  return idol?.unit || '';
}

// 选择角色
function selectCharacter(character: CharacterSpineData) {
  selectedCharacterId.value = character.id;
  selectedCardIndex.value = 0;
  // 重置为常服
  previewCostume.value = 'normal';
}

// 选择卡面
function selectCard(index: number) {
  selectedCardIndex.value = index;
  previewCostume.value = 'normal';
}

// 取消
function handleCancel() {
  emit('close');
}

// 应用
function handleApply() {
  if (previewSpineId.value) {
    emit('apply', previewSpineId.value, previewCostume.value);
  }
}

// 初始化：如果有当前选中的角色，设置初始状态
watch(
  () => props.currentSpineId,
  id => {
    if (id) {
      // 尝试解析当前 spineId
      const [japaneseName, cardName] = id.split('_');
      const char = spineCharacters.find(c => c.japaneseName === japaneseName);
      if (char) {
        selectedCharacterId.value = char.id;
        const cardIndex = char.cards.findIndex(c => c.name === cardName);
        if (cardIndex >= 0) {
          selectedCardIndex.value = cardIndex;
        }
      }
    }
  },
  { immediate: true },
);

watch(
  () => props.currentCostume,
  costume => {
    if (costume) {
      previewCostume.value = costume;
    }
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.character-select-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  z-index: 1000;
}

/* 左侧面板 */
.left-panel {
  width: 35%;
  min-width: 300px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.4);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header {
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.2) 0%, rgba(147, 39, 143, 0.2) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h2 {
    margin: 0;
    color: white;
    font-size: 1.2rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;

    i {
      color: #ff6b9d;
    }
  }
}

.character-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 107, 157, 0.3);
    border-radius: 3px;
  }
}

.character-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(5px);
  }

  &.active {
    background: linear-gradient(135deg, rgba(255, 107, 157, 0.3) 0%, rgba(147, 39, 143, 0.3) 100%);
    border-color: #ff6b9d;
  }
}

.char-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  flex-shrink: 0;

  i {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.7);
  }
}

.char-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.char-name {
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

.char-unit {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}

.active-icon {
  color: #ff6b9d;
  font-size: 1.2rem;
}

/* 卡面选择 */
.card-select {
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    color: #667eea;
  }
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    border: 1px solid rgba(102, 126, 234, 0.5);
  }

  .card-name {
    color: white;
    font-size: 0.9rem;
  }

  i {
    color: #667eea;
  }
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  position: relative;
}

.spine-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 15px;
}

.spine-name {
  color: white;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.costume-toggle {
  display: flex;
  gap: 10px;
}

.costume-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 25px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }

  &.active {
    background: linear-gradient(135deg, rgba(147, 39, 143, 0.8) 0%, rgba(70, 39, 133, 0.8) 100%);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  i {
    font-size: 1rem;
  }
}

.spine-preview-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 15px;
  overflow: hidden;
  position: relative;
}

.spine-preview {
  width: 100%;
  height: 100%;
}

.no-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: rgba(255, 255, 255, 0.3);

  i {
    font-size: 5rem;
  }

  p {
    font-size: 1.2rem;
    margin: 0;
  }
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.cancel-btn,
.apply-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 30px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  i {
    font-size: 1rem;
  }
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border-color: rgba(255, 255, 255, 0.3);
  }
}

.apply-btn {
  background: linear-gradient(135deg, #ff6b9d 0%, #c44aca 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 157, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .character-select-page {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    max-width: none;
    height: 40%;
  }

  .right-panel {
    height: 60%;
  }
}
</style>
