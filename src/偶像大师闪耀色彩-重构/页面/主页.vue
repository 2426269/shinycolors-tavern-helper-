<template>
  <div class="idol-master-container">
    <!-- 背景图层 - 283事务所 -->
    <div class="background-layer">
      <div class="office-background">
        <!-- 如果有背景图URL，会显示在这里 -->
        <div
          v-if="backgroundImageUrl"
          class="background-image"
          :style="{ backgroundImage: `url(${backgroundImageUrl})` }"
        ></div>

        <!-- CSS 艺术背景（没有图片时显示） -->
        <div v-else class="css-office-scene">
          <!-- 天空/墙面 -->
          <div class="sky-wall"></div>

          <!-- 左侧窗户 -->
          <div class="window window-left">
            <div class="window-pane pane-1"></div>
            <div class="window-pane pane-2"></div>
            <div class="window-pane pane-3"></div>
            <div class="window-pane pane-4"></div>
            <div class="window-cross horizontal"></div>
            <div class="window-cross vertical"></div>
            <div class="window-shine"></div>
          </div>

          <!-- 右侧窗户 -->
          <div class="window window-right">
            <div class="window-pane pane-1"></div>
            <div class="window-pane pane-2"></div>
            <div class="window-pane pane-3"></div>
            <div class="window-pane pane-4"></div>
            <div class="window-cross horizontal"></div>
            <div class="window-cross vertical"></div>
            <div class="window-shine"></div>
          </div>

          <!-- 地板 -->
          <div class="floor">
            <div v-for="i in 15" :key="'floor-' + i" class="floor-line"></div>
          </div>

          <!-- 装饰物 -->
          <div class="decorations">
            <!-- 左侧盆栽 -->
            <div class="plant plant-left">
              <div class="pot"></div>
              <div class="leaves leaf-1"></div>
              <div class="leaves leaf-2"></div>
              <div class="leaves leaf-3"></div>
            </div>

            <!-- 右侧盆栽 -->
            <div class="plant plant-right">
              <div class="pot"></div>
              <div class="leaves leaf-1"></div>
              <div class="leaves leaf-2"></div>
              <div class="leaves leaf-3"></div>
            </div>

            <!-- 墙上的283 Logo -->
            <div class="office-logo">
              <div class="logo-text">283</div>
              <div class="logo-subtitle">Production</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 制作人信息（左上角） -->
    <div class="producer-info">
      <div class="producer-card">
        <div class="producer-avatar">
          <i class="fas fa-user-tie"></i>
        </div>
        <div class="producer-details">
          <div class="producer-name-row">
            <span class="producer-label">制作人</span>
            <span class="producer-name">{{ producerName }}</span>
          </div>
          <div class="producer-level-row">
            <span class="producer-level-label">Lv.</span>
            <span class="producer-level-value">{{ resources.producerLevel }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Spine动画层（居中显示，往下延展） -->
    <div class="character-layer">
      <div class="character-container-center">
        <!-- Spine播放器 -->
        <SpinePlayer
          v-if="currentSpineId"
          :idol-id="currentSpineId"
          :costume="currentCostume"
          :debug-offset-x="spineDebug.offsetX"
          :debug-offset-y="spineDebug.offsetY"
          :debug-scale="spineDebug.scale"
          class="spine-character"
        />
      </div>
    </div>

    <!-- 服装切换按钮（右上角） -->
    <div class="costume-toggle-container">
      <button class="costume-toggle-btn" :title="costumeTooltip" @click="toggleCostume">
        <i class="fas" :class="costumeIcon"></i>
        <span class="costume-label">{{ costumeLabel }}</span>
      </button>
    </div>

    <!-- 主页按钮（左下角） -->
    <div class="home-button-container">
      <button class="home-button" @click="toggleHomeMenu">
        <i class="fas fa-home"></i>
        <span>主页</span>
      </button>
    </div>

    <!-- 角色选择全屏页面 -->
    <CharacterSelectPage
      v-if="showCharacterSelectPage"
      :current-spine-id="currentSpineId"
      :current-costume="currentCostume"
      @close="closeCharacterSelectPage"
      @apply="applyCharacterSelect"
    />

    <!-- 功能按钮层 -->
    <div class="function-layer">
      <div class="main-buttons">
        <button class="function-btn idol-btn" @click="openIdolCollection">
          <div class="btn-icon">
            <i class="fas fa-book"></i>
          </div>
          <span class="btn-text">偶像图鉴</span>
          <div class="btn-shine"></div>
        </button>

        <button class="function-btn gacha-btn" @click="openGacha">
          <div class="btn-icon">
            <i class="fas fa-gift"></i>
          </div>
          <span class="btn-text">抽卡</span>
          <div class="btn-shine"></div>
        </button>

        <button class="function-btn activity-btn" @click="openActivity">
          <div class="btn-icon">
            <i class="fas fa-heart"></i>
          </div>
          <span class="btn-text">自由活动</span>
          <div class="btn-shine"></div>
        </button>

        <button class="function-btn music-btn" @click="openMusic">
          <div class="btn-icon">
            <i class="fas fa-music"></i>
          </div>
          <span class="btn-text">音乐</span>
          <div class="btn-shine"></div>
        </button>

        <button class="function-btn produce-btn" @click="openTraining">
          <div class="btn-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <span class="btn-text">培育</span>
          <div class="btn-shine"></div>
        </button>
      </div>
    </div>

    <!-- 偶像详情弹窗 -->
    <div v-if="showIdolDetails" class="idol-details-modal" @click="closeIdolDetails">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeIdolDetails">
          <i class="fas fa-times"></i>
        </button>

        <div class="idol-details-container">
          <!-- 左侧：立绘画廊 -->
          <div class="idol-gallery">
            <h3>立绘画廊</h3>
            <div class="gallery-main">
              <img
                v-if="currentCharacter.images && currentCharacter.images[selectedImageIndex]"
                :src="currentCharacter.images[selectedImageIndex]"
                :alt="currentCharacter.name"
                loading="lazy"
                class="gallery-main-image"
              />
              <div v-else class="gallery-placeholder">
                <i class="fas fa-image"></i>
                <p>暂无立绘</p>
              </div>
            </div>
            <div v-if="currentCharacter.images && currentCharacter.images.length > 0" class="gallery-thumbnails">
              <div
                v-for="(img, index) in currentCharacter.images"
                :key="index"
                class="thumbnail"
                :class="{ active: index === selectedImageIndex }"
                @click="selectedImageIndex = index"
              >
                <img :src="img" :alt="`立绘 ${index + 1}`" loading="lazy" />
              </div>
            </div>
          </div>

          <!-- 右侧：详细信息 -->
          <div class="idol-info">
            <h2 class="idol-name">{{ currentCharacter.name }}</h2>

            <div class="idol-details-section">
              <h3>基本信息</h3>
              <div class="detail-grid">
                <div v-if="currentCharacter.age" class="detail-item">
                  <span class="detail-label">年龄</span>
                  <span class="detail-value">{{ currentCharacter.age }}</span>
                </div>
                <div v-if="currentCharacter.height" class="detail-item">
                  <span class="detail-label">身高</span>
                  <span class="detail-value">{{ currentCharacter.height }}</span>
                </div>
                <div v-if="currentCharacter.birthday" class="detail-item">
                  <span class="detail-label">生日</span>
                  <span class="detail-value">{{ currentCharacter.birthday }}</span>
                </div>
                <div v-if="currentCharacter.unit" class="detail-item">
                  <span class="detail-label">组合</span>
                  <span class="detail-value">{{ currentCharacter.unit }}</span>
                </div>
                <div v-if="currentCharacter.voiceActor" class="detail-item">
                  <span class="detail-label">声优</span>
                  <span class="detail-value">{{ currentCharacter.voiceActor }}</span>
                </div>
                <div v-if="currentCharacter.color" class="detail-item">
                  <span class="detail-label">印象色</span>
                  <span class="detail-value">
                    <span class="color-preview" :style="{ backgroundColor: currentCharacter.color }"></span>
                    {{ currentCharacter.color }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="currentCharacter.description" class="idol-details-section">
              <h3>角色介绍</h3>
              <p class="idol-description">{{ currentCharacter.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新手介绍：角色介绍（原偶像详情界面） -->
    <div v-if="showCharacterGallery" class="character-gallery-modal">
      <div class="gallery-overlay" @click="closeIdolDetails"></div>
      <div class="gallery-content">
        <div class="gallery-header">
          <h2 class="gallery-title">
            <i class="fas fa-graduation-cap"></i>
            {{ currentUnit }} - 角色介绍
          </h2>
          <button class="gallery-close" @click="closeIdolDetails">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="gallery-body">
          <!-- 左侧导航按钮 -->
          <button class="unit-nav-btn prev" @click="prevCharacter">
            <i class="fas fa-chevron-left"></i>
          </button>

          <!-- 角色栏网格（固定显示3个角色） -->
          <div class="character-grid">
            <div
              v-for="char in displayedCharacters"
              :key="char.id"
              class="character-card-item"
              @click="selectCharacterForCards(char)"
            >
              <div class="card-frame">
                <img
                  v-if="char.thumbnailUrl"
                  :src="char.thumbnailUrl"
                  :alt="char.name"
                  class="char-thumbnail"
                  loading="lazy"
                />
                <div v-else class="char-thumbnail-placeholder">
                  <i class="fas fa-user"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧导航按钮 -->
          <button class="unit-nav-btn next" @click="nextCharacter">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <div class="gallery-footer">
          <div class="unit-indicators">
            <span
              v-for="(unit, index) in units"
              :key="index"
              class="unit-indicator"
              :class="{ active: unit === currentUnit }"
              @click="jumpToUnit(unit)"
            >
              {{ unit }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新界面：卡牌详情（第三层） -->
    <div v-if="showCardDetails && selectedCharacterForCards" class="card-details-modal">
      <div class="card-overlay" @click="backToGallery"></div>
      <div class="card-content">
        <div class="card-header">
          <button class="back-btn" @click="backToGallery">
            <i class="fas fa-arrow-left"></i>
            返回
          </button>
          <h2 class="card-character-name">{{ selectedCharacterForCards.name }}</h2>
          <button class="card-close" @click="closeIdolDetails">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="card-body">
          <!-- 左侧：卡面展示 -->
          <div class="card-display-section">
            <div class="card-name-tag">
              {{
                selectedCharacterForCards.cards && selectedCharacterForCards.cards[selectedCardIndex]
                  ? selectedCharacterForCards.cards[selectedCardIndex].name
                  : '卡牌名称'
              }}
            </div>
            <div class="card-image-container">
              <button class="awaken-toggle" :title="isCardAwakened ? '觉醒后' : '觉醒前'" @click="toggleCardAwakened">
                <i class="fas fa-sync-alt"></i>
              </button>
              <img
                v-if="selectedCharacterForCards.cards && selectedCharacterForCards.cards[selectedCardIndex]"
                :src="
                  isCardAwakened
                    ? selectedCharacterForCards.cards[selectedCardIndex].imageAwakened
                    : selectedCharacterForCards.cards[selectedCardIndex].image
                "
                :alt="selectedCharacterForCards.cards[selectedCardIndex].name"
                class="card-image"
              />
              <div v-else class="card-image-placeholder">
                <i class="fas fa-image"></i>
                <p>暂无卡面</p>
              </div>
            </div>

            <!-- 卡牌列表缩略图 -->
            <div
              v-if="selectedCharacterForCards.cards && selectedCharacterForCards.cards.length > 1"
              class="card-thumbnails"
            >
              <div
                v-for="(card, index) in selectedCharacterForCards.cards"
                :key="card.id"
                class="card-thumb"
                :class="{ active: index === selectedCardIndex }"
                @click="
                  selectedCardIndex = index;
                  isCardAwakened = false;
                "
              >
                <img :src="card.image" :alt="card.name" loading="lazy" />
                <span class="card-rarity">{{ card.rarity }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧：技能信息 -->
          <div class="card-skills-section">
            <h3 class="skills-title">
              <i class="fas fa-star"></i>
              卡牌技能
            </h3>
            <div
              v-if="
                selectedCharacterForCards.cards &&
                selectedCharacterForCards.cards[selectedCardIndex] &&
                selectedCharacterForCards.cards[selectedCardIndex].skills
              "
              class="skills-list"
            >
              <div
                v-for="(skill, index) in selectedCharacterForCards.cards[selectedCardIndex].skills"
                :key="index"
                class="skill-item"
              >
                <div class="skill-icon">
                  <i class="fas fa-bolt"></i>
                </div>
                <div class="skill-content">
                  <h4 class="skill-name">技能 {{ index + 1 }}</h4>
                  <p class="skill-description">{{ skill }}</p>
                </div>
              </div>
            </div>
            <div v-else class="no-skills">
              <i class="fas fa-info-circle"></i>
              <p>暂无技能信息</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 音乐播放器页面（全屏） -->
    <div v-if="showMusicPage" class="music-page">
      <!-- 返回按钮 -->
      <button class="music-back-btn" @click="closeMusicPage">
        <i class="fas fa-arrow-left"></i>
        <span>返回</span>
      </button>

      <!-- 顶部标题 -->
      <div class="music-header">
        <div class="music-icon">
          <i class="fas fa-music"></i>
        </div>
        <h2>歌曲试听</h2>
      </div>

      <!-- 主内容区：左右布局 -->
      <div class="music-content">
        <!-- 左侧：专辑封面 -->
        <div class="album-cover-section">
          <div class="album-cover-frame">
            <img
              v-if="currentCoverUrl"
              :key="currentCoverUrl"
              :src="currentCoverUrl"
              :alt="songs[currentSongIndex]?.title"
              class="album-cover-img"
              @load="() => console.log('📸 [img] 图片加载完成:', currentCoverUrl)"
              @error="handleCoverError"
            />
            <div v-else class="album-cover-placeholder">
              <i class="fas fa-compact-disc"></i>
            </div>
          </div>

          <!-- 歌词显示 -->
          <div class="lyrics-display">
            <div class="lyrics-main">{{ currentLyric.main }}</div>
            <div v-if="showTranslation && currentLyric.translation" class="lyrics-trans">
              {{ currentLyric.translation }}
            </div>
          </div>

          <!-- 进度条 -->
          <div class="progress-container" @click="handleProgressClick">
            <div class="progress-bar" :style="{ width: `${currentProgress * 100}%` }"></div>
          </div>

          <!-- 播放控制 -->
          <div class="playback-controls">
            <button
              class="control-btn prev"
              :disabled="playbackMode === 'random' ? songs.length <= 1 : currentSongIndex === 0"
              @click="prevSong"
            >
              <i class="fas fa-step-backward"></i>
            </button>
            <button class="control-btn play" @click="togglePlay">
              <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
            </button>
            <button
              class="control-btn next"
              :disabled="playbackMode === 'random' ? songs.length <= 1 : currentSongIndex === songs.length - 1"
              @click="nextSong"
            >
              <i class="fas fa-step-forward"></i>
            </button>
          </div>

          <!-- 额外控制 -->
          <div class="extra-controls">
            <button
              class="extra-btn"
              :class="{ active: showTranslation }"
              title="切换翻译"
              @click="toggleLyricsTranslation"
            >
              <i class="fas fa-language"></i>
            </button>
            <button
              class="extra-btn"
              :title="playbackMode === 'single' ? '单曲循环' : playbackMode === 'sequence' ? '顺序播放' : '随机播放'"
              @click="togglePlaybackMode"
            >
              <i
                :class="
                  playbackMode === 'single'
                    ? 'fas fa-redo'
                    : playbackMode === 'sequence'
                      ? 'fas fa-list'
                      : 'fas fa-random'
                "
              ></i>
            </button>
            <div class="volume-control">
              <i class="fas fa-volume-up"></i>
              <input
                type="range"
                class="volume-slider"
                :value="volume * 100"
                min="0"
                max="100"
                @input="handleVolumeChange(($event.target as HTMLInputElement).valueAsNumber / 100)"
              />
            </div>
          </div>
        </div>

        <!-- 右侧：歌曲列表（支持滚轮和拖拽） -->
        <div class="song-list-container">
          <!-- 歌曲类型过滤按钮 -->
          <div class="song-filter-buttons">
            <button class="filter-btn" :class="{ active: songFilter === 'all' }" @click="songFilter = 'all'">
              全部 ({{ songs.length }})
            </button>
            <button class="filter-btn" :class="{ active: songFilter === '个人曲' }" @click="songFilter = '个人曲'">
              个人曲 ({{ songsByType['个人曲'].length }})
            </button>
            <button class="filter-btn" :class="{ active: songFilter === '组合曲' }" @click="songFilter = '组合曲'">
              组合曲 ({{ songsByType['组合曲'].length }})
            </button>
            <button class="filter-btn" :class="{ active: songFilter === '全体曲' }" @click="songFilter = '全体曲'">
              全体曲 ({{ songsByType['全体曲'].length }})
            </button>
          </div>

          <!-- 歌曲列表 -->
          <div
            ref="songListRef"
            class="song-list-section"
            :class="{ dragging: isDragging }"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
          >
            <div
              v-for="song in filteredSongs"
              :key="song.id"
              class="song-item"
              :class="{
                active: song.id === songs[currentSongIndex]?.id,
                disabled: !song.audioUrl,
              }"
              @click="song.audioUrl ? selectSongById(song.id) : null"
            >
              <!-- 歌曲图标 -->
              <div class="song-item-icon">
                <i v-if="!song.audioUrl" class="fas fa-lock" title="音频文件未上传"></i>
                <i v-else-if="song.id === songs[currentSongIndex]?.id && isPlaying" class="fas fa-volume-up"></i>
                <i v-else-if="song.id === songs[currentSongIndex]?.id" class="fas fa-music"></i>
                <i v-else class="fas fa-circle"></i>
              </div>

              <!-- 歌曲标题（始终显示） -->
              <div class="song-item-title">
                {{ song.title }}
                <span v-if="!song.audioUrl" class="no-audio-tag">(未上传)</span>
              </div>

              <!-- 展开的详细信息（仅当前歌曲） -->
              <div v-if="song.id === songs[currentSongIndex]?.id" class="song-item-details">
                <!-- 个人曲显示：角色 + 演唱（声优） -->
                <template v-if="song.type === '个人曲'">
                  <div class="detail-row-compact">
                    <span class="detail-label-compact">角色:</span>
                    <span class="detail-value-compact">{{ song.artist }}</span>
                  </div>
                  <div v-if="song.voiceActor" class="detail-row-compact">
                    <span class="detail-label-compact">演唱:</span>
                    <span class="detail-value-compact">{{ song.voiceActor }}</span>
                  </div>
                </template>
                <!-- 组合曲/全体曲显示：演唱 -->
                <template v-else>
                  <div class="detail-row-compact">
                    <span class="detail-label-compact">演唱:</span>
                    <span class="detail-value-compact">{{ song.artist }}</span>
                  </div>
                </template>
                <div class="detail-row-compact">
                  <span class="detail-label-compact">作词:</span>
                  <span class="detail-value-compact">{{ song.lyrics || '待添加' }}</span>
                </div>
                <div class="detail-row-compact">
                  <span class="detail-label-compact">作曲:</span>
                  <span class="detail-value-compact">{{ song.music || '待添加' }}</span>
                </div>
                <div class="detail-row-compact">
                  <span class="detail-label-compact">收录:</span>
                  <span class="detail-value-compact">{{ song.album || '待添加' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 抽卡页面 -->
    <div v-if="showGachaPage" class="gacha-page">
      <!-- 返回按钮 -->
      <button class="gacha-back-btn" @click="closeGachaPage">
        <i class="fas fa-arrow-left"></i>
        <span>返回</span>
      </button>

      <!-- 抽卡系统组件 -->
      <div class="gacha-container">
        <GachaApp :resources="resources" @update:feather-stones="resources.featherStones = $event" />
      </div>
    </div>

    <!-- 偶像图鉴页面（直接集成组件） -->
    <div v-if="showIdolCollection" class="idol-collection-page">
      <button class="collection-back-btn" @click="closeIdolCollection">
        <i class="fas fa-arrow-left"></i>
        <span>返回</span>
      </button>
      <div class="collection-container">
        <IdolCollectionApp />
      </div>
    </div>

    <!-- 角色选择页面（培育） -->
    <CharacterSelection v-if="showCharacterSelection" @close="closeCharacterSelection" @select="onCharacterSelected" />

    <!-- 资源显示层 - 顶部横向布局 -->
    <div class="resource-display-top">
      <div class="resource-item feather-stone">
        <img :src="RESOURCE_ICONS.FEATHER_JEWEL" alt="羽石" class="resource-icon" />
        <span class="resource-value">{{ resources.featherStones.toLocaleString() }}</span>
      </div>

      <div class="resource-item fans">
        <i class="fas fa-users"></i>
        <span class="resource-value">{{ resources.fans.toLocaleString() }}</span>
      </div>
    </div>

    <!-- 设置按钮 - 右上角位置 -->
    <div class="settings-button-top" title="设置" @click="showSettings = true">
      <i class="fas fa-cog"></i>
    </div>

    <!-- 全屏按钮 - 右侧中间位置 (仅在按钮模式显示) -->
    <div
      v-if="settings.fullscreenMode === 'button'"
      class="fullscreen-button"
      :title="isFullscreen ? '退出全屏' : '全屏'"
      @click="toggleFullscreen"
    >
      <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="settings-modal" @click="showSettings = false">
      <div class="settings-panel" @click.stop>
        <div class="settings-panel-header">
          <h2>主题切换</h2>
          <button class="panel-close-btn" @click="showSettings = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="settings-panel-body">
          <!-- 界面设置分类 -->
          <div class="settings-category">
            <h3 class="category-title">
              <i class="fas fa-desktop"></i>
              界面设置
            </h3>

            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-expand-arrows-alt"></i>
                双击全屏
              </div>
              <div class="setting-desc">双击空白区域进入全屏模式</div>
              <div class="setting-control-col">
                <label class="toggle-switch">
                  <input
                    type="checkbox"
                    :checked="settings.fullscreenMode === 'doubleclick'"
                    @change="toggleFullscreenMode"
                  />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <!-- 开发工具分类 -->
          <div class="settings-category">
            <h3 class="category-title">
              <i class="fas fa-code"></i>
              开发工具
            </h3>

            <!-- 无限羽石 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-gem"></i>
                无限羽石
              </div>
              <div class="setting-desc">开启后羽石数量保持在999999999</div>
              <div class="setting-control-col">
                <label class="toggle-switch">
                  <input type="checkbox" :checked="settings.devMode.infiniteGems" @change="toggleInfiniteGems" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- 解锁全部角色 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-users"></i>
                解锁全部角色
              </div>
              <div class="setting-desc">获得所有角色的R/SR/SSR/UR各1张卡</div>
              <div class="setting-control-col">
                <button class="dev-action-btn" @click="devUnlockAllCharacters">
                  <i class="fas fa-unlock"></i>
                  解锁
                </button>
              </div>
            </div>

            <!-- 清除AI生成技能卡 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-robot"></i>
                清除AI生成技能卡
              </div>
              <div class="setting-desc">清除所有AI生成的技能卡数据，方便重新测试生成功能</div>
              <div class="setting-control-col">
                <button
                  class="dev-action-btn"
                  style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                  @click="devClearAISkillCards"
                >
                  <i class="fas fa-broom"></i>
                  清除
                </button>
              </div>
            </div>

            <!-- 清除游戏数据 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-trash-alt"></i>
                清除游戏数据
              </div>
              <div class="setting-desc">清除资源、抽卡、AI技能卡等游戏数据（不含图片缓存）</div>
              <div class="setting-control-col">
                <button
                  class="dev-action-btn"
                  style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  @click="devClearGameData"
                >
                  <i class="fas fa-eraser"></i>
                  清除
                </button>
              </div>
            </div>

            <!-- 清除所有缓存 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-broom"></i>
                清除所有缓存
              </div>
              <div class="setting-desc">清除游戏数据、AI技能卡和图片缓存（完全重置）</div>
              <div class="setting-control-col">
                <button
                  class="dev-action-btn"
                  style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                  @click="devClearAllCache"
                >
                  <i class="fas fa-bomb"></i>
                  清除
                </button>
              </div>
            </div>

            <!-- 等级满级 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-level-up-alt"></i>
                等级满级
              </div>
              <div class="setting-desc">将制作人等级提升至60级</div>
              <div class="setting-control-col">
                <button class="dev-action-btn" @click="devMaxLevel">
                  <i class="fas fa-arrow-up"></i>
                  提升
                </button>
              </div>
            </div>

            <!-- Spine 调试工具 -->
            <div class="setting-row spine-debug-section">
              <div class="setting-label-col">
                <i class="fas fa-crosshairs"></i>
                Spine 立绘调试
              </div>
              <div class="setting-desc">调整立绘位置和大小（开发用）</div>
            </div>

            <!-- X轴偏移滑块 -->
            <div class="setting-row slider-row">
              <div class="setting-label-col slider-label">X 偏移</div>
              <div class="slider-control">
                <input
                  v-model.number="spineDebug.offsetX"
                  type="range"
                  class="debug-slider"
                  min="-800"
                  max="800"
                  step="10"
                />
                <span class="slider-value">{{ spineDebug.offsetX }}</span>
              </div>
            </div>

            <!-- Y轴偏移滑块 -->
            <div class="setting-row slider-row">
              <div class="setting-label-col slider-label">Y 偏移</div>
              <div class="slider-control">
                <input
                  v-model.number="spineDebug.offsetY"
                  type="range"
                  class="debug-slider"
                  min="-800"
                  max="800"
                  step="10"
                />
                <span class="slider-value">{{ spineDebug.offsetY }}</span>
              </div>
            </div>

            <!-- 缩放滑块 -->
            <div class="setting-row slider-row">
              <div class="setting-label-col slider-label">缩放</div>
              <div class="slider-control">
                <input
                  v-model.number="spineDebug.scale"
                  type="range"
                  class="debug-slider"
                  min="0.3"
                  max="2.0"
                  step="0.05"
                />
                <span class="slider-value">{{ spineDebug.scale.toFixed(2) }}</span>
              </div>
            </div>

            <!-- 复制参数按钮 -->
            <div class="setting-row">
              <div class="setting-label-col"></div>
              <div class="setting-control-col" style="flex: 1">
                <button
                  class="dev-action-btn"
                  style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100%"
                  @click="copySpineDebugParams"
                >
                  <i class="fas fa-copy"></i>
                  复制当前参数
                </button>
              </div>
            </div>
          </div>

          <!-- 缓存管理分类 -->
          <div class="settings-category">
            <h3 class="category-title">
              <i class="fas fa-database"></i>
              缓存管理
            </h3>

            <!-- 图片缓存统计 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-images"></i>
                图片缓存
              </div>
              <div class="setting-desc">{{ cacheStats.count }} 张图片 / {{ formatCacheSize(cacheStats.size) }}</div>
              <div class="setting-control-col">
                <button class="dev-action-btn" @click="updateCacheStats">
                  <i class="fas fa-sync-alt"></i>
                  刷新
                </button>
              </div>
            </div>

            <!-- 清除缓存按钮 -->
            <div class="setting-row">
              <div class="setting-label-col">
                <i class="fas fa-trash-alt"></i>
                清除图片缓存
              </div>
              <div class="setting-desc">清除所有已缓存的图片，不影响游戏数据</div>
              <div class="setting-control-col">
                <button class="dev-action-btn danger" @click="handleClearCache">
                  <i class="fas fa-trash"></i>
                  清除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import {
  clearAllGameData,
  exportAllData,
  getGachaData,
  getResources,
  getSettings,
  importAllData,
  initGameData,
  saveGachaData,
  saveResources,
  saveSettings,
  type GameResources,
} from '../../偶像大师闪耀色彩/utils/game-data';
import IdolCollectionApp from '../图鉴/界面/偶像图鉴.vue';
import { CDN_BASE, RESOURCE_ICONS, TOAST_SUCCESS_DURATION_MS } from '../工具/constants';
import GachaApp from '../抽卡/界面/抽卡主界面.vue';
import SpinePlayer from '../组件/Spine播放器.vue';
import CharacterSelection from '../组件/角色选择.vue';
import { songs } from '../音乐/歌曲数据';
import { MusicPlayer } from '../音乐/音乐播放器';
import CharacterSelectPage from './角色选择页面.vue';

// 背景图片URL - 使用 jsDelivr CDN
const backgroundImageUrl = ref(`${CDN_BASE}/背景图/Sc_bk_283pro.webp`);

// 角色数据列表（使用 GitHub 图片资源）
const characters = ref([
  {
    id: 1,
    name: '樱木真乃',
    imageUrl: `${CDN_BASE}/人物立绘/illumination STARS/樱木真乃/Mano_intial.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/illumination STARS/樱木真乃/SC-Mano_Thumb.png`,
    age: '16岁',
    height: '154cm',
    birthday: '5月2日',
    unit: 'Illumination STARS',
    voiceActor: '成海瑠奈（初代）→ 希水汐',
    color: '#FFB6D9',
    description: '和蔼可亲的治愈系女孩，心地善良，易于激发保护欲的类型。仅仅待在一起就令人产生幸福感。',
    images: [
      `${CDN_BASE}/人物立绘/illumination STARS/樱木真乃/Mano_intial.png`,
      `${CDN_BASE}/人物立绘/illumination STARS/樱木真乃/SCMano.png`,
    ],
    cards: [
      {
        id: 1,
        name: '初始卡',
        rarity: 'SR',
        image: `${CDN_BASE}/人物立绘/illumination STARS/樱木真乃/Mano_intial.png`,
        imageAwakened: `${CDN_BASE}/人物立绘/illumination STARS/樱木真乃/Mano_intial.png`,
        skills: ['待添加技能描述'],
      },
    ],
  },
  {
    id: 2,
    name: '风野灯织',
    imageUrl: `${CDN_BASE}/人物立绘/illumination STARS/风野灯织/Hiori_intial.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/illumination STARS/风野灯织/thumb.png`,
    age: '16岁',
    height: '163cm',
    birthday: '8月13日',
    unit: 'Illumination STARS',
    voiceActor: '近藤玲奈',
    color: '#92CFBB',
    description: '扎在头后的黑发给人深刻印象的高冷系美少女。在得到自己认可之前不吝惜努力的克己的性格。',
    images: [
      `${CDN_BASE}/人物立绘/illumination STARS/风野灯织/Hiori_intial.png`,
      `${CDN_BASE}/人物立绘/illumination STARS/风野灯织/Kazano_Hiori_profile.png`,
    ],
    cards: [
      {
        id: 1,
        name: '初始卡',
        rarity: 'SR',
        image: `${CDN_BASE}/人物立绘/illumination STARS/风野灯织/Hiori_intial.png`,
        imageAwakened: `${CDN_BASE}/人物立绘/illumination STARS/风野灯织/Hiori_intial.png`,
        skills: ['待添加'],
      },
    ],
  },
  {
    id: 3,
    name: '八宫巡',
    imageUrl: `${CDN_BASE}/人物立绘/illumination STARS/八宫巡/Meguru_intial.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/illumination STARS/八宫巡/thumb.png`,
    age: '16岁',
    height: '161cm',
    birthday: '7月28日',
    unit: 'Illumination STARS',
    voiceActor: '峯田茉优',
    color: '#FFEC47',
    description:
      '性格天真烂漫，无论对方是谁都会积极地搭话。富有活力、爱为朋友着想的女孩。父亲为日本人，母亲为美国人的混血儿。',
    images: [
      `${CDN_BASE}/人物立绘/illumination STARS/八宫巡/Meguru_intial.png`,
      `${CDN_BASE}/人物立绘/illumination STARS/八宫巡/Hachimiya_Meguru_profile.png`,
    ],
    cards: [
      {
        id: 1,
        name: '初始卡',
        rarity: 'SR',
        image: `${CDN_BASE}/人物立绘/illumination STARS/八宫巡/Meguru_intial.png`,
        imageAwakened: `${CDN_BASE}/人物立绘/illumination STARS/八宫巡/Meguru_intial.png`,
        skills: ['待添加'],
      },
    ],
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
    images: [
      `${CDN_BASE}/人物立绘/L'Antica/月冈恋钟/242px-Kogane_intial.png`,
      `${CDN_BASE}/人物立绘/L'Antica/月冈恋钟/300px-Tsukioka_Kogane_profile.png`,
    ],
    cards: [
      {
        id: 1,
        name: '初始卡',
        rarity: 'SR',
        image: `${CDN_BASE}/人物立绘/L'Antica/月冈恋钟/242px-Kogane_intial.png`,
        imageAwakened: `${CDN_BASE}/人物立绘/L'Antica/月冈恋钟/242px-Kogane_intial.png`,
        skills: ['待添加'],
      },
    ],
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
    images: [
      `${CDN_BASE}/人物立绘/L'Antica/田中摩美美/272px-Mamimi_intial.png`,
      `${CDN_BASE}/人物立绘/L'Antica/田中摩美美/212px-Tanaka_Mamimi_profile.png`,
    ],
    cards: [
      {
        id: 1,
        name: '初始卡',
        rarity: 'SR',
        image: `${CDN_BASE}/人物立绘/L'Antica/田中摩美美/272px-Mamimi_intial.png`,
        imageAwakened: `${CDN_BASE}/人物立绘/L'Antica/田中摩美美/272px-Mamimi_intial.png`,
        skills: ['待添加'],
      },
    ],
  },
  // L'Antica 剩余成员
  {
    id: 6,
    name: '白濑咲耶',
    imageUrl: `${CDN_BASE}/人物立绘/L'Antica/白濑咲耶/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/L'Antica/白濑咲耶/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: "L'Antica",
    voiceActor: '待添加',
    color: '#87CEEB',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 7,
    name: '三峰结华',
    imageUrl: `${CDN_BASE}/人物立绘/L'Antica/三峰结华/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/L'Antica/三峰结华/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: "L'Antica",
    voiceActor: '待添加',
    color: '#FF6B9D',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 8,
    name: '幽谷雾子',
    imageUrl: `${CDN_BASE}/人物立绘/L'Antica/幽谷雾子/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/L'Antica/幽谷雾子/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: "L'Antica",
    voiceActor: '待添加',
    color: '#9370DB',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  // ALSTROEMERIA
  {
    id: 9,
    name: '大崎甘奈',
    imageUrl: `${CDN_BASE}/人物立绘/ALSTROEMERIA/大崎甘奈/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/ALSTROEMERIA/大崎甘奈/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'ALSTROEMERIA',
    voiceActor: '待添加',
    color: '#FF69B4',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 10,
    name: '大崎甜花',
    imageUrl: `${CDN_BASE}/人物立绘/ALSTROEMERIA/大崎甜花/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/ALSTROEMERIA/大崎甜花/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'ALSTROEMERIA',
    voiceActor: '待添加',
    color: '#FFB6D9',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 11,
    name: '桑山千雪',
    imageUrl: `${CDN_BASE}/人物立绘/ALSTROEMERIA/桑山千雪/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/ALSTROEMERIA/桑山千雪/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'ALSTROEMERIA',
    voiceActor: '待添加',
    color: '#4169E1',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  // Straylight
  {
    id: 12,
    name: '黛冬优子',
    imageUrl: `${CDN_BASE}/人物立绘/Straylight/黛冬优子/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/Straylight/黛冬优子/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'Straylight',
    voiceActor: '待添加',
    color: '#4B0082',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 13,
    name: '和泉爱依',
    imageUrl: `${CDN_BASE}/人物立绘/Straylight/和泉爱依/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/Straylight/和泉爱依/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'Straylight',
    voiceActor: '待添加',
    color: '#FF1493',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 14,
    name: '芹泽朝日',
    imageUrl: `${CDN_BASE}/人物立绘/Straylight/芹泽朝日/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/Straylight/芹泽朝日/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'Straylight',
    voiceActor: '待添加',
    color: '#FFA500',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  // noctchill
  {
    id: 15,
    name: '市川雏菜',
    imageUrl: `${CDN_BASE}/人物立绘/noctchill/市川雏菜/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/noctchill/市川雏菜/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'noctchill',
    voiceActor: '待添加',
    color: '#FF69B4',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 16,
    name: '福丸小糸',
    imageUrl: `${CDN_BASE}/人物立绘/noctchill/福丸小糸/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/noctchill/福丸小糸/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'noctchill',
    voiceActor: '待添加',
    color: '#98FB98',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 17,
    name: '浅仓透',
    imageUrl: `${CDN_BASE}/人物立绘/noctchill/浅仓透/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/noctchill/浅仓透/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'noctchill',
    voiceActor: '待添加',
    color: '#00CED1',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 18,
    name: '樋口圆香',
    imageUrl: `${CDN_BASE}/人物立绘/noctchill/樋口圆香/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/noctchill/樋口圆香/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'noctchill',
    voiceActor: '待添加',
    color: '#9370DB',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  // 放学后CLIMAX GIRLS
  {
    id: 19,
    name: '小宫果穗',
    imageUrl: `${CDN_BASE}/人物立绘/放学后CLIMAX GIRLS/小宫果穗/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/放学后CLIMAX GIRLS/小宫果穗/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: '放学后CLIMAX GIRLS',
    voiceActor: '待添加',
    color: '#FF1493',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 20,
    name: '园田智代子',
    imageUrl: `${CDN_BASE}/人物立绘/放学后CLIMAX GIRLS/园田智代子/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/放学后CLIMAX GIRLS/园田智代子/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: '放学后CLIMAX GIRLS',
    voiceActor: '待添加',
    color: '#FF6347',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 21,
    name: '西城树里',
    imageUrl: `${CDN_BASE}/人物立绘/放学后CLIMAX GIRLS/西城树里/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/放学后CLIMAX GIRLS/西城树里/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: '放学后CLIMAX GIRLS',
    voiceActor: '待添加',
    color: '#32CD32',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 22,
    name: '杜野凛世',
    imageUrl: `${CDN_BASE}/人物立绘/放学后CLIMAX GIRLS/杜野凛世/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/放学后CLIMAX GIRLS/杜野凛世/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: '放学后CLIMAX GIRLS',
    voiceActor: '待添加',
    color: '#8A2BE2',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 23,
    name: '有栖川夏叶',
    imageUrl: `${CDN_BASE}/人物立绘/放学后CLIMAX GIRLS/有栖川夏叶/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/放学后CLIMAX GIRLS/有栖川夏叶/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: '放学后CLIMAX GIRLS',
    voiceActor: '待添加',
    color: '#FFD700',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  // SHHis
  {
    id: 24,
    name: '七草日花',
    imageUrl: `${CDN_BASE}/人物立绘/SHHis/七草日花/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/SHHis/七草日花/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'SHHis',
    voiceActor: '待添加',
    color: '#FFA07A',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 25,
    name: '绯田美琴',
    imageUrl: `${CDN_BASE}/人物立绘/SHHis/绯田美琴/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/SHHis/绯田美琴/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'SHHis',
    voiceActor: '待添加',
    color: '#DC143C',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  // CoMETIK
  {
    id: 26,
    name: '斑鸠路加',
    imageUrl: `${CDN_BASE}/人物立绘/CoMETIK/斑鸠路加/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/CoMETIK/斑鸠路加/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'CoMETIK',
    voiceActor: '待添加',
    color: '#FF6347',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 27,
    name: '郁田阳希',
    imageUrl: `${CDN_BASE}/人物立绘/CoMETIK/郁田阳希/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/CoMETIK/郁田阳希/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'CoMETIK',
    voiceActor: '待添加',
    color: '#FFD700',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
  {
    id: 28,
    name: '铃木羽那',
    imageUrl: `${CDN_BASE}/人物立绘/CoMETIK/铃木羽那/placeholder.png`,
    thumbnailUrl: `${CDN_BASE}/角色栏/CoMETIK/铃木羽那/thumb.png`,
    age: '待添加',
    height: '待添加',
    birthday: '待添加',
    unit: 'CoMETIK',
    voiceActor: '待添加',
    color: '#00CED1',
    description: '待添加角色描述',
    images: [],
    cards: [{ id: 1, name: '初始卡', rarity: 'SR', image: '', imageAwakened: '', skills: ['待添加'] }],
  },
]);

// 当前角色索引
const currentCharacterIndex = ref(0);

// 当前角色（响应式计算）
const currentCharacter = computed(() => characters.value[currentCharacterIndex.value]);

// Spine动画相关状态
// idolId格式: "偶像名_【卡片名】偶像名"
// 尝试使用另一个角色的资源进行测试
const currentSpineId = ref('櫻木真乃_【花風Smiley】櫻木真乃'); // 默认使用樱木真乃的初始卡

// 服装状态
const currentCostume = ref<'normal' | 'idol'>('normal');

// 资源数据 - 从IndexedDB读取
const resources = reactive<GameResources>({
  featherStones: 999999999, // 测试用无限羽石（发布时改回3000）
  fans: 0,
  producerLevel: 1, // 制作人等级
  producerExp: 0, // 制作人经验
});

// 异步加载资源数据
const loadResourcesFromDB = async () => {
  try {
    const data = await getResources();
    Object.assign(resources, data);
    console.log('📦 资源数据已加载:', resources);
  } catch (error) {
    console.error('❌ 加载资源数据失败:', error);
  }
};

// 监听资源变化，自动保存到IndexedDB
watch(
  resources,
  async newValue => {
    try {
      await saveResources(newValue);
    } catch (error) {
      console.error('❌ 保存资源数据失败:', error);
    }
  },
  { deep: true },
);

// 制作人信息（从酒馆角色名读取）
const producerName = ref('');

// 获取制作人名称
const loadProducerName = () => {
  try {
    // 尝试从 SillyTavern 获取用户角色名
    if (typeof SillyTavern !== 'undefined' && SillyTavern.name1) {
      // name1 是用户/角色的名称
      producerName.value = SillyTavern.name1;
    } else {
      // 默认名称
      producerName.value = '制作人';
    }
  } catch (error) {
    console.warn('无法读取制作人名称:', error);
    producerName.value = '制作人';
  }
};

// 设置
const showSettings = ref(false);
const settings = reactive({
  fullscreenMode: 'button' as 'button' | 'doubleclick' | 'both',
  // 开发工具
  devMode: {
    infiniteGems: false, // 无限羽石
    unlockAllCharacters: false, // 解锁全角色
    maxLevel: false, // 等级满级
  },
});

// Spine 开发者调试参数
const spineDebug = reactive({
  offsetX: 0, // X轴偏移 (-300 ~ 300)
  offsetY: 0, // Y轴偏移 (-300 ~ 300)
  scale: 1.0, // 缩放比例 (0.3 ~ 2.0)
});

// 复制 Spine 调试参数到剪贴板
const copySpineDebugParams = () => {
  const params = `offsetX: ${spineDebug.offsetX}, offsetY: ${spineDebug.offsetY}, scale: ${spineDebug.scale.toFixed(2)}`;
  navigator.clipboard
    .writeText(params)
    .then(() => {
      toastr.success(`已复制: ${params}`, '', { timeOut: 2000 });
    })
    .catch(() => {
      toastr.error('复制失败');
    });
};

// 加载设置
const loadSettingsFromDB = async () => {
  try {
    const data = await getSettings();
    if (data.fullscreenMode) {
      settings.fullscreenMode = data.fullscreenMode;
    }
    if (data.devMode) {
      settings.devMode.infiniteGems = data.devMode.infiniteGems || false;
      settings.devMode.unlockAllCharacters = data.devMode.unlockAllCharacters || false;
      settings.devMode.maxLevel = data.devMode.maxLevel || false;
    }
    console.log('⚙️ 设置已加载:', settings);
  } catch (error) {
    console.error('❌ 加载设置失败:', error);
  }
};

// 切换全屏模式
const toggleFullscreenMode = async () => {
  settings.fullscreenMode = settings.fullscreenMode === 'button' ? 'doubleclick' : 'button';
  await saveSettingsToDB();
};

// 保存设置到IndexedDB
const saveSettingsToDB = async () => {
  try {
    await saveSettings(settings as any);
    toastr.success('设置已保存！', '', { timeOut: 1500 });
  } catch (error) {
    console.error('❌ 保存设置失败:', error);
    toastr.error('设置保存失败！');
  }
};

// ============================================================================
// 开发工具功能
// ============================================================================

/** 清除游戏数据（不含图片缓存） */
const devClearGameData = async () => {
  if (
    !confirm(
      '⚠️ 确定要清除所有游戏数据吗？\n\n这将清除：\n- 资源数据（羽石、等级等）\n- 抽卡记录\n- AI生成的技能卡\n- 游戏设置\n\n图片缓存将保留。',
    )
  ) {
    return;
  }

  try {
    await clearAllGameData();

    // 清除AI生成的技能卡
    const skillKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('skill_')) {
        skillKeysToRemove.push(key);
      }
    }
    skillKeysToRemove.forEach(key => localStorage.removeItem(key));

    toastr.success('游戏数据已清除！', '', { timeOut: 2000 });

    // 重新加载数据（恢复默认值）
    await loadResourcesFromDB();
    await loadSettingsFromDB();

    console.log('🗑️ 游戏数据已清除（包含', skillKeysToRemove.length, '个AI生成技能卡）');
  } catch (error) {
    console.error('❌ 清除游戏数据失败:', error);
    toastr.error('清除失败！');
  }
};

/** 清除所有缓存（包括图片） */
const devClearAllCache = async () => {
  if (
    !confirm(
      '⚠️ 确定要清除所有缓存吗？\n\n这将清除：\n- 所有游戏数据\n- AI生成的技能卡\n- 所有图片缓存\n\n此操作不可恢复！',
    )
  ) {
    return;
  }

  try {
    // 清除游戏数据
    const { clearAllData } = await import('../../偶像大师闪耀色彩/utils/game-data');
    await clearAllData();

    // 清除AI生成的技能卡
    const skillKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('skill_')) {
        skillKeysToRemove.push(key);
      }
    }
    skillKeysToRemove.forEach(key => localStorage.removeItem(key));

    // 清除图片缓存
    const imageCacheModule = await import('../工具/图片缓存');
    await imageCacheModule.clearAllCache();

    toastr.success('所有缓存已清除！页面将在3秒后刷新...', '', { timeOut: 3000 });

    // 刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 3000);

    console.log('🗑️ 所有缓存已清除（包含', skillKeysToRemove.length, '个AI生成技能卡）');
  } catch (error) {
    console.error('❌ 清除缓存失败:', error);
    toastr.error('清除失败！');
  }
};

/** 导出游戏数据 */
const devExportData = async () => {
  try {
    const data = await exportAllData();

    // 创建下载链接
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shinycolors_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toastr.success('数据已导出！', '', { timeOut: 2000 });
    console.log('📤 数据已导出');
  } catch (error) {
    console.error('❌ 导出数据失败:', error);
    toastr.error('导出失败！');
  }
};

/** 导入游戏数据 */
const devImportData = async () => {
  try {
    // 创建文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event: any) => {
        try {
          const jsonStr = event.target.result;
          await importAllData(jsonStr);

          toastr.success('数据已导入！页面将在3秒后刷新...', '', { timeOut: 3000 });

          // 刷新页面
          setTimeout(() => {
            window.location.reload();
          }, 3000);

          console.log('📥 数据已导入');
        } catch (error) {
          console.error('❌ 导入数据失败:', error);
          toastr.error('导入失败！请检查文件格式');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  } catch (error) {
    console.error('❌ 导入数据失败:', error);
    toastr.error('导入失败！');
  }
};

/** 获得全部角色（所有稀有度的第1张卡） */
const devUnlockAllCharacters = async () => {
  if (!confirm('确定要解锁全部角色吗？（每个角色的R/SR/SSR/UR各1张）')) {
    return;
  }

  try {
    // 动态导入卡池数据
    const { ALL_CARDS } = await import('../卡牌管理/全部卡牌数据');

    // 读取抽卡数据
    const gachaData = await getGachaData();

    let addedCount = 0;

    // 添加所有卡片（使用 fullName 作为 ID）
    ALL_CARDS.forEach(card => {
      const cardId = card.fullName;

      // 如果还没拥有，添加
      if (!gachaData.ownedCards[cardId]) {
        gachaData.ownedCards[cardId] = {
          fullName: card.fullName,
          obtainedAt: new Date().toISOString(),
          hasSkill: false,
        };
        addedCount++;
      }
    });

    // 保存数据到IndexedDB
    await saveGachaData(gachaData);

    toastr.success(`已解锁 ${addedCount} 张角色卡！`, '', { timeOut: 2000 });
    console.log('🎴 已解锁全部角色:', gachaData.ownedCards);
  } catch (error) {
    console.error('解锁角色失败:', error);
    toastr.error('解锁角色失败！');
  }
};

/** 等级瞬间满级（60级） */
const devMaxLevel = () => {
  if (!confirm('确定要将制作人等级提升到60级吗？')) {
    return;
  }

  resources.producerLevel = 60;
  resources.producerExp = 0; // 满级后经验归零
  toastr.success('制作人等级已提升至60级！', '', { timeOut: 2000 });
};

/** 清除AI生成的技能卡数据 */
const devClearAISkillCards = () => {
  if (!confirm('⚠️ 确定要清除所有AI生成的技能卡数据吗？\n\n这将清除所有角色的AI生成技能卡，需要重新生成。')) {
    return;
  }

  try {
    let count = 0;
    // 遍历localStorage，查找所有skill_开头的key
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('skill_')) {
        keysToRemove.push(key);
        count++;
      }
    }

    // 删除所有skill_开头的key
    keysToRemove.forEach(key => localStorage.removeItem(key));

    toastr.success(`已清除 ${count} 个AI生成的技能卡！`, '', { timeOut: 2000 });
    console.log('🗑️ 已清除AI生成技能卡:', keysToRemove);
  } catch (error) {
    console.error('❌ 清除AI生成技能卡失败:', error);
    toastr.error('清除失败！');
  }
};

/** 切换无限羽石 */
const toggleInfiniteGems = async () => {
  settings.devMode.infiniteGems = !settings.devMode.infiniteGems;

  if (settings.devMode.infiniteGems) {
    resources.featherStones = 999999999;
    toastr.success('无限羽石已开启！', '', { timeOut: 1500 });
  } else {
    toastr.info('无限羽石已关闭', '', { timeOut: 1500 });
  }

  await saveSettingsToDB();
};

// ============================================================================
// 缓存管理
// ============================================================================

/** 缓存统计数据 */
const cacheStats = ref({ count: 0, size: 0 });

/** 格式化缓存大小 */
const formatCacheSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/** 更新缓存统计 */
const updateCacheStats = async () => {
  try {
    // 动态导入 image-cache 模块
    const imageCacheModule = await import('../工具/图片缓存');
    const stats = await imageCacheModule.getCacheStats();
    cacheStats.value = stats;
    toastr.success(`缓存统计已更新: ${stats.count} 张图片`, '', { timeOut: 1500 });
  } catch (error) {
    console.error('更新缓存统计失败:', error);
    toastr.error('更新缓存统计失败');
  }
};

/** 清除图片缓存 */
const handleClearCache = async () => {
  if (
    !confirm(
      `确定要清除所有图片缓存吗？\n\n当前缓存: ${cacheStats.value.count} 张图片 / ${formatCacheSize(cacheStats.value.size)}\n\n清除后首次加载会较慢，但不影响游戏数据。`,
    )
  ) {
    return;
  }

  try {
    // 动态导入 image-cache 模块
    const imageCacheModule = await import('../工具/图片缓存');
    await imageCacheModule.clearImageCache();
    cacheStats.value = { count: 0, size: 0 };
    toastr.success('图片缓存已清除！', '', { timeOut: 2000 });
  } catch (error) {
    console.error('清除缓存失败:', error);
    toastr.error('清除缓存失败');
  }
};

// 监听羽石变化，如果开启无限羽石且羽石<999999999，自动补充
watch(
  () => resources.featherStones,
  newValue => {
    if (settings.devMode.infiniteGems && newValue < 999999999) {
      // 延迟50ms补充，避免watch循环
      setTimeout(() => {
        resources.featherStones = 999999999;
      }, 50);
    }
  },
);

// 监听设置面板打开，重新加载设置和缓存统计
watch(
  () => showSettings.value,
  async isOpen => {
    if (isOpen) {
      await loadSettingsFromDB();
      await updateCacheStats(); // 更新缓存统计
    }
  },
);

// 双击全屏处理
const handleDoubleClick = () => {
  if (settings.fullscreenMode === 'doubleclick') {
    toggleFullscreen();
  }
};

// 主页菜单控制
const showHomeMenu = ref(false);

// 角色选择页面控制
const showCharacterSelectPage = ref(false);

// 切换主页菜单（改为打开角色选择页面）
const toggleHomeMenu = () => {
  showCharacterSelectPage.value = true;
};

// 关闭角色选择页面
const closeCharacterSelectPage = () => {
  showCharacterSelectPage.value = false;
};

// 应用角色选择
const applyCharacterSelect = (spineId: string, costume: 'normal' | 'idol') => {
  currentSpineId.value = spineId;
  currentCostume.value = costume;
  showCharacterSelectPage.value = false;
  console.log('应用角色选择:', spineId, costume);
};

// 服装切换相关计算属性
const costumeLabel = computed(() => (currentCostume.value === 'normal' ? '常服' : '偶像服'));
const costumeIcon = computed(() => (currentCostume.value === 'normal' ? 'fa-tshirt' : 'fa-star'));
const costumeTooltip = computed(() => (currentCostume.value === 'normal' ? '切换到偶像服' : '切换到常服'));

// 切换服装
const toggleCostume = () => {
  currentCostume.value = currentCostume.value === 'normal' ? 'idol' : 'normal';
  console.log('切换到服装:', currentCostume.value);
};

// 选择角色
const selectCharacter = (index: number) => {
  currentCharacterIndex.value = index;
  showHomeMenu.value = false;
  console.log('切换到角色:', characters.value[index].name);
};

// 组合列表（8个组合）
const units = [
  'Illumination STARS',
  "L'Antica",
  'ALSTROEMERIA',
  'Straylight',
  'noctchill',
  '放学后CLIMAX GIRLS',
  'SHHis',
  'CoMETIK',
];

// 偶像三层界面控制
const showIdolDetails = ref(false); // 旧的详情界面（保留但不再使用）
const selectedImageIndex = ref(0); // 旧详情界面的图片索引（保留兼容性）
const showCharacterGallery = ref(false); // 第二层：角色栏选择界面
const showCardDetails = ref(false); // 第三层：卡牌详情界面
const currentStartIndex = ref(0); // 当前显示的第一个角色的索引（滑动窗口）
const selectedCharacterForCards = ref<any>(null); // 选中查看卡牌的角色
const selectedCardIndex = ref(0); // 当前查看的卡牌索引
const isCardAwakened = ref(false); // 卡牌是否觉醒状态

// 音乐页面控制
const showMusicPage = ref(false); // 是否显示音乐页面
const currentSongIndex = ref(0); // 当前选中的歌曲索引
const isPlaying = ref(false); // 是否正在播放
const currentProgress = ref(0); // 当前播放进度 (0-1)

// 抽卡页面控制
const showGachaPage = ref(false); // 是否显示抽卡页面

const currentLyric = ref({ main: '♪', translation: '' }); // 当前歌词
const showTranslation = ref(false); // 是否显示翻译
const playbackMode = ref<'single' | 'sequence' | 'random'>('single'); // 播放模式
const volume = ref(0.3); // 音量 (0-1)
const currentCoverUrl = ref<string | null>(null); // 当前封面URL
const songFilter = ref<'all' | '个人曲' | '组合曲' | '全体曲'>('all'); // 歌曲过滤类型
const lastScrollPosition = ref(0); // 记住上次滚动位置

// 歌曲列表拖动控制
const songListRef = ref<HTMLElement | null>(null); // 歌曲列表容器引用
const isDragging = ref(false); // 是否正在拖拽
const dragStartY = ref(0); // 拖拽开始的Y坐标
const dragStartScrollTop = ref(0); // 拖拽开始时的滚动位置

// 按类型分组歌曲
const songsByType = computed(() => {
  return {
    个人曲: songs.filter(s => s.type === '个人曲'),
    组合曲: songs.filter(s => s.type === '组合曲'),
    全体曲: songs.filter(s => s.type === '全体曲'),
  };
});

// 过滤后的歌曲列表
const filteredSongs = computed(() => {
  if (songFilter.value === 'all') {
    return songs;
  }
  return songsByType.value[songFilter.value] || [];
});

// 全屏控制
const isFullscreen = ref(false);

// 切换全屏
const toggleFullscreen = () => {
  const elem = document.documentElement;

  if (!document.fullscreenElement) {
    // 进入全屏
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
    isFullscreen.value = true;
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
    isFullscreen.value = false;
  }
};

// 获取当前显示的3个角色（滑动窗口）
const displayedCharacters = computed(() => {
  const result = [];
  for (let i = 0; i < 3; i++) {
    const index = (currentStartIndex.value + i) % characters.value.length;
    result.push(characters.value[index]);
  }
  return result;
});

// 获取当前显示的主要组合（根据第三个角色判断）
const currentUnit = computed(() => {
  const thirdIndex = (currentStartIndex.value + 2) % characters.value.length;
  const thirdChar = characters.value[thirdIndex];
  return thirdChar ? thirdChar.unit : units[0];
});

// 打开偶像界面（第二层：角色栏）
const openIdolDetails = () => {
  showCharacterGallery.value = true;
  showCardDetails.value = false;
  currentStartIndex.value = 0;
  console.log('打开角色栏选择界面');
};

// 关闭所有偶像相关界面
const closeIdolDetails = () => {
  showCharacterGallery.value = false;
  showCardDetails.value = false;
  selectedCharacterForCards.value = null;
};

// 向左滑动（显示前一个角色）
const prevCharacter = () => {
  currentStartIndex.value = (currentStartIndex.value - 1 + characters.value.length) % characters.value.length;
};

// 向右滑动（显示下一个角色）
const nextCharacter = () => {
  currentStartIndex.value = (currentStartIndex.value + 1) % characters.value.length;
};

// 跳转到指定组合的第一个角色
const jumpToUnit = (unitName: string) => {
  const index = characters.value.findIndex(char => char.unit === unitName);
  if (index !== -1) {
    currentStartIndex.value = index;
  }
};

// 选择角色查看卡牌（第三层）
const selectCharacterForCards = (character: any) => {
  selectedCharacterForCards.value = character;
  selectedCardIndex.value = 0;
  isCardAwakened.value = false;
  showCharacterGallery.value = false;
  showCardDetails.value = true;
  console.log('查看角色卡牌:', character.name);
};

// 从卡牌详情返回角色栏
const backToGallery = () => {
  showCardDetails.value = false;
  showCharacterGallery.value = true;
  selectedCharacterForCards.value = null;
};

// 切换卡牌觉醒状态
const toggleCardAwakened = () => {
  isCardAwakened.value = !isCardAwakened.value;
};

// 功能按钮事件
const openTraining = () => {
  console.log('打开培育角色选择界面');
  showCharacterSelection.value = true;
};

const openActivity = () => {
  console.log('打开自由活动界面 - 当前角色:', currentCharacter.value.name);
};

// 音乐页面功能
const openMusic = () => {
  showMusicPage.value = true;

  // 恢复上次浏览位置
  nextTick(() => {
    if (songListRef.value) {
      // 如果有正在播放的歌曲，滚动到该歌曲
      if (songs[currentSongIndex.value]) {
        scrollToSong(currentSongIndex.value);
      } else {
        // 否则恢复上次滚动位置
        songListRef.value.scrollTop = lastScrollPosition.value;
      }
    }
  });

  // 如果还没有播放任何歌曲，加载第一首
  if (!MusicPlayer.getNowPlaying().name && songs.length > 0) {
    loadSong(0);
  }

  console.log('打开音乐播放器');
};

const closeMusicPage = () => {
  // 保存当前滚动位置
  if (songListRef.value) {
    lastScrollPosition.value = songListRef.value.scrollTop;
  }

  showMusicPage.value = false;
  // 不停止播放，让音乐在后台继续
};

// 抽卡页面功能
const openGacha = () => {
  showGachaPage.value = true;
  console.log('打开抽卡系统');
};

const closeGachaPage = () => {
  showGachaPage.value = false;
  console.log('关闭抽卡系统');
};

// 偶像图鉴页面控制
const showIdolCollection = ref(false);

const openIdolCollection = () => {
  showIdolCollection.value = true;
  console.log('打开偶像图鉴');
};

const closeIdolCollection = () => {
  showIdolCollection.value = false;
  console.log('关闭偶像图鉴');
};

// 角色选择页面控制（培育）
const showCharacterSelection = ref(false);

const closeCharacterSelection = () => {
  showCharacterSelection.value = false;
  console.log('关闭角色选择');
};

const onCharacterSelected = (card: any) => {
  console.log('选择了角色进行培育:', card);
  showCharacterSelection.value = false;
  toastr.success(`准备培育：${card.characterName}`, '', { timeOut: 2000 });
  // TODO: 跳转到培育界面
};

// 加载并播放歌曲
const loadSong = async (index: number) => {
  if (index < 0 || index >= songs.length) return;

  currentSongIndex.value = index;
  const song = songs[index];

  console.log('🎵 [loadSong] 开始切歌:', {
    songTitle: song.title,
    newCover: song.albumCover,
    currentCover: currentCoverUrl.value,
  });

  try {
    // 先设置封面（即使播放失败也显示封面）
    currentCoverUrl.value = song.albumCover || null;
    console.log('🖼️ [loadSong] 封面已设置:', currentCoverUrl.value);
    await nextTick();

    // 如果有音频URL，尝试播放歌曲
    if (song.audioUrl) {
      const success = await MusicPlayer.loadAndPlaySong(song);

      if (success) {
        console.log('✅ [loadSong] 播放成功');
        toastr.success(`♪ ${song.title}`, '播放成功', {
          timeOut: TOAST_SUCCESS_DURATION_MS,
        });
      } else {
        console.log('❌ [loadSong] 播放失败（但保留封面）');
        toastr.warning(`无法播放《${song.title}》`, '音频文件未正确上传');
      }
    } else {
      console.log('⚠️ [loadSong] 无音频文件');
      toastr.info(`《${song.title}》`, '音频文件未上传');
    }
  } catch (e) {
    console.error('加载歌曲失败:', e);
    // 即使播放失败，也保留封面显示
  }
};

// 滚动到指定歌曲（带动画）
const scrollToSong = (index: number) => {
  if (!songListRef.value) return;

  // 获取目标歌曲元素
  const songItems = songListRef.value.querySelectorAll('.song-item');
  const targetItem = songItems[index] as HTMLElement;

  if (targetItem) {
    // 平滑滚动到目标位置
    targetItem.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
  }
};

// 选择歌曲（通过ID）
const selectSongById = (songId: number) => {
  const index = songs.findIndex(s => s.id === songId);
  if (index === -1) return;
  if (index === currentSongIndex.value) return; // 已经是当前歌曲，不处理

  // 加载新歌曲
  loadSong(index);

  // 自动滚动到选中的歌曲
  setTimeout(() => {
    scrollToSong(index);
  }, 50);
};

// 选择歌曲（通过索引，保留兼容性）
const selectSong = (index: number) => {
  if (index === currentSongIndex.value) return;
  loadSong(index);
  setTimeout(() => {
    scrollToSong(index);
  }, 50);
};

// 处理封面图片加载错误
const handleCoverError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.error('❌ [img] 图片加载失败:', {
    failedSrc: img.src,
    currentCoverUrl: currentCoverUrl.value,
    songTitle: songs[currentSongIndex.value]?.title,
  });
  // 不要清空封面，保持显示（避免图片闪烁消失）
  // 如果真的需要占位图，应该设置为默认图片URL而不是null
  console.log('⚠️ 保留当前封面显示，不清空');
};

// 删除了handleWheel函数，让列表可以正常滚动

// 鼠标拖动事件
const handleMouseDown = (event: MouseEvent) => {
  if (!songListRef.value) return;

  isDragging.value = true;
  dragStartY.value = event.clientY;
  dragStartScrollTop.value = songListRef.value.scrollTop;

  // 阻止文本选择
  event.preventDefault();
};

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !songListRef.value) return;

  const deltaY = dragStartY.value - event.clientY;
  songListRef.value.scrollTop = dragStartScrollTop.value + deltaY;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// 播放控制
const togglePlay = () => {
  MusicPlayer.togglePlay();
};

// 上一首（根据播放模式）
const prevSong = () => {
  if (playbackMode.value === 'random') {
    // 随机模式：随机选择一首（不是当前歌曲）
    if (songs.length > 1) {
      let randomIndex = currentSongIndex.value;
      while (randomIndex === currentSongIndex.value) {
        randomIndex = Math.floor(Math.random() * songs.length);
      }
      console.log('🎲 随机播放上一首，索引:', randomIndex);
      selectSong(randomIndex);
    }
  } else if (currentSongIndex.value > 0) {
    // 单曲循环或顺序播放：跳到上一首
    selectSong(currentSongIndex.value - 1);
  }
};

// 下一首（根据播放模式）
const nextSong = () => {
  if (playbackMode.value === 'random') {
    // 随机模式：随机选择一首（不是当前歌曲）
    if (songs.length > 1) {
      let randomIndex = currentSongIndex.value;
      while (randomIndex === currentSongIndex.value) {
        randomIndex = Math.floor(Math.random() * songs.length);
      }
      console.log('🎲 随机播放下一首，索引:', randomIndex);
      selectSong(randomIndex);
    }
  } else if (currentSongIndex.value < songs.length - 1) {
    // 单曲循环或顺序播放：跳到下一首
    selectSong(currentSongIndex.value + 1);
  }
};

// 音量控制
const handleVolumeChange = (value: number) => {
  volume.value = value;
  MusicPlayer.setVolume(value);
};

// 进度条控制
const handleProgressClick = (event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  MusicPlayer.seek(percent);
};

// 切换翻译
const toggleLyricsTranslation = () => {
  MusicPlayer.toggleTranslation();
  // showTranslation 会在 updatePlayerState 中自动更新
};

// 切换播放模式（单曲循环 → 顺序播放 → 随机播放 → 单曲循环）
const togglePlaybackMode = () => {
  const modes: ('single' | 'sequence' | 'random')[] = ['single', 'sequence', 'random'];
  const currentIndex = modes.indexOf(playbackMode.value);
  const newMode = modes[(currentIndex + 1) % modes.length];
  playbackMode.value = newMode;
  MusicPlayer.setPlaybackMode(newMode);

  // 显示提示
  const modeNames = { single: '单曲循环', sequence: '顺序播放', random: '随机播放' };
  toastr.info(`播放模式：${modeNames[newMode]}`, '', { timeOut: 1000 });
};

// 处理播放结束（用于顺序播放和随机播放）
const handleSongEnded = () => {
  console.log('🎵 歌曲播放结束，当前模式:', playbackMode.value);

  if (playbackMode.value === 'sequence') {
    // 顺序播放：播放下一首
    if (currentSongIndex.value < songs.length - 1) {
      console.log('📀 顺序播放下一首');
      selectSong(currentSongIndex.value + 1);
    } else {
      console.log('📀 已是最后一首，停止播放');
      isPlaying.value = false;
    }
  } else if (playbackMode.value === 'random') {
    // 随机播放：随机选择下一首（不重复当前歌曲）
    let randomIndex = currentSongIndex.value;
    if (songs.length > 1) {
      // 确保随机到的不是当前歌曲
      while (randomIndex === currentSongIndex.value) {
        randomIndex = Math.floor(Math.random() * songs.length);
      }
      console.log('🎲 随机播放下一首，索引:', randomIndex);
      selectSong(randomIndex);
    }
  }
};

// 更新UI状态（定时调用）
const updatePlayerState = () => {
  const state = MusicPlayer.getState();
  const audio = state.audio;

  // 更新播放进度
  if (audio.duration && !isNaN(audio.duration)) {
    currentProgress.value = audio.currentTime / audio.duration;
  }

  // 更新当前歌词
  currentLyric.value = MusicPlayer.getCurrentLyric();

  // 更新翻译显示状态
  showTranslation.value = state.lyrics.showTranslation;

  // 注意：封面完全由 loadSong 手动控制，定时器不再更新封面
  // 这样可以彻底避免定时器覆盖封面的问题
};

// 定义更新定时器变量（需要在外部定义才能在 onUnmounted 中访问）
let updateInterval: number;

// 组件挂载时加载制作人信息
onMounted(async () => {
  // 初始化IndexedDB游戏数据系统
  await initGameData();

  // 加载数据
  await loadResourcesFromDB();
  await loadSettingsFromDB();
  loadProducerName();

  // 初始化音乐播放器
  MusicPlayer.init();

  // 设置播放结束回调（用于顺序播放和随机播放）
  MusicPlayer.setOnEndedCallback(handleSongEnded);

  // 双击全屏功能
  document.addEventListener('dblclick', handleDoubleClick);

  // 设置定时器更新播放器状态
  updateInterval = setInterval(updatePlayerState, 100);

  // 监听音频元素的播放/暂停事件
  const audio = MusicPlayer.getState().audio;
  audio.addEventListener('play', () => {
    isPlaying.value = true;
  });
  audio.addEventListener('pause', () => {
    isPlaying.value = false;
  });

  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
  document.addEventListener('webkitfullscreenchange', () => {
    isFullscreen.value = !!(document as any).webkitFullscreenElement;
  });
  document.addEventListener('msfullscreenchange', () => {
    isFullscreen.value = !!(document as any).msFullscreenElement;
  });

  // 添加全局鼠标事件监听（用于歌曲列表拖动）
  document.addEventListener('mousemove', e => {
    if (isDragging.value && songListRef.value) {
      const deltaY = dragStartY.value - e.clientY;
      songListRef.value.scrollTop = dragStartScrollTop.value + deltaY;
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging.value) {
      isDragging.value = false;
    }
  });
});

// 清理定时器和事件监听器（必须在 onMounted 外部调用）
onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  document.removeEventListener('dblclick', handleDoubleClick);
  document.removeEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
  document.removeEventListener('webkitfullscreenchange', () => {
    isFullscreen.value = !!(document as any).webkitFullscreenElement;
  });
  document.removeEventListener('msfullscreenchange', () => {
    isFullscreen.value = !!(document as any).msFullscreenElement;
  });
});
</script>

<style lang="scss" scoped>
/* 重置样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 主容器 - 16:10比例设计 */
.idol-master-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10; /* 16:10 宽高比 */
  min-height: 600px; /* 确保最小高度 */
  max-height: 100vh; /* 不超过视口高度 */
  overflow: hidden;
  font-family: 'Arial', 'Hiragino Sans', 'Microsoft YaHei', sans-serif;
}

/* ===== 背景图层（Z-index: 1） ===== */
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.office-background {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* 背景图片（如果提供了URL） */
.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* CSS 艺术283事务所场景 */
.css-office-scene {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* 天空/墙面背景 */
.sky-wall {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #e8f4f8 0%, #d4e9f2 20%, #c8dde8 40%, #b8cdd8 60%, #a8b5c0 80%, #95a5b0 100%);

  /* 墙面纹理 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 70%;
    background-image:
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 3px,
        rgba(255, 255, 255, 0.02) 3px,
        rgba(255, 255, 255, 0.02) 6px
      ),
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        rgba(255, 255, 255, 0.02) 3px,
        rgba(255, 255, 255, 0.02) 6px
      );
  }
}

/* 窗户样式 */
.window {
  position: absolute;
  top: 12%;
  width: 16%;
  aspect-ratio: 2 / 3;
  background: linear-gradient(135deg, #e8f7ff 0%, #cfe9f8 50%, #b8dff0 100%);
  border: 4px solid #7a8fa0;
  border-radius: 8px;
  box-shadow:
    0 8px 20px rgba(0, 0, 0, 0.3),
    inset 0 0 30px rgba(255, 255, 255, 0.6);
  overflow: hidden;

  &.window-left {
    left: 8%;
  }

  &.window-right {
    right: 8%;
  }
}

.window-pane {
  position: absolute;
  width: 50%;
  height: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(200, 230, 255, 0.4) 40%,
    transparent 70%
  );

  &.pane-1 {
    top: 0;
    left: 0;
  }
  &.pane-2 {
    top: 0;
    right: 0;
  }
  &.pane-3 {
    bottom: 0;
    left: 0;
  }
  &.pane-4 {
    bottom: 0;
    right: 0;
  }
}

.window-cross {
  position: absolute;
  background: #7a8fa0;

  &.horizontal {
    top: 50%;
    left: 0;
    width: 100%;
    height: 4px;
    transform: translateY(-50%);
  }

  &.vertical {
    top: 0;
    left: 50%;
    width: 4px;
    height: 100%;
    transform: translateX(-50%);
  }
}

.window-shine {
  position: absolute;
  top: 15%;
  left: 15%;
  width: 30%;
  height: 40%;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 255, 255, 0.3) 30%,
    transparent 60%
  );
  border-radius: 50%;
  filter: blur(10px);
}

/* 地板 */
.floor {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 35%;
  background: linear-gradient(
    to bottom,
    rgba(139, 126, 102, 0.1) 0%,
    rgba(139, 126, 102, 0.2) 20%,
    rgba(139, 126, 102, 0.35) 100%
  );
  transform-origin: center top;
  transform: perspective(800px) rotateX(45deg);
}

.floor-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background: rgba(139, 126, 102, 0.15);

  @for $i from 1 through 15 {
    &:nth-child(#{$i}) {
      bottom: #{($i - 1) * 6.67%};
    }
  }
}

/* 装饰物容器 */
.decorations {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 盆栽 */
.plant {
  position: absolute;
  bottom: 8%;
  width: 8%;
  aspect-ratio: 1;

  &.plant-left {
    left: 3%;
  }

  &.plant-right {
    right: 3%;
  }
}

.pot {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 40%;
  background: linear-gradient(135deg, #8b6f47 0%, #6b5535 100%);
  border-radius: 5px 5px 15px 15px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 -3px 5px rgba(0, 0, 0, 0.2);
}

.leaves {
  position: absolute;
  width: 35%;
  aspect-ratio: 1;
  background: radial-gradient(ellipse at center, #4a7c59 0%, #3d6b4b 50%, #2f5839 100%);
  border-radius: 50% 0 50% 0;

  &.leaf-1 {
    top: 10%;
    left: 50%;
    transform: translateX(-50%) rotate(-10deg);
  }

  &.leaf-2 {
    top: 20%;
    left: 20%;
    transform: rotate(-45deg);
  }

  &.leaf-3 {
    top: 20%;
    right: 20%;
    transform: rotate(45deg);
  }
}

/* 283 Logo */
.office-logo {
  position: absolute;
  top: 8%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  padding: 15px 30px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.logo-text {
  font-size: clamp(32px, 4vw, 48px);
  font-weight: bold;
  color: #ff6b9d;
  text-shadow:
    0 2px 10px rgba(255, 107, 157, 0.5),
    0 0 20px rgba(255, 107, 157, 0.3);
  letter-spacing: 3px;
}

.logo-subtitle {
  font-size: clamp(10px, 1.2vw, 14px);
  font-weight: bold;
  color: rgba(0, 0, 0, 0.6);
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 5px;
}

/* ===== 角色立绘层（Z-index: 2） ===== */
.character-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* ===== 制作人信息（左上角） ===== */
.producer-info {
  position: absolute;
  top: clamp(15px, 2.5vw, 30px);
  left: clamp(15px, 2.5vw, 30px);
  z-index: 4;
}

/* ===== 服装切换按钮（右上角） ===== */
.costume-toggle-container {
  position: absolute;
  top: clamp(80px, 9vw, 110px); /* 下移避开右上角设置按钮 */
  right: clamp(15px, 2.5vw, 30px);
  z-index: 4;
}

.costume-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, rgba(147, 39, 143, 0.8) 0%, rgba(70, 39, 133, 0.8) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow:
    0 4px 15px rgba(147, 39, 143, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.1);

  i {
    font-size: 16px;
    transition: transform 0.3s ease;
  }

  .costume-label {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  &:hover {
    transform: translateY(-2px) scale(1.05);
    background: linear-gradient(135deg, rgba(147, 39, 143, 0.95) 0%, rgba(70, 39, 133, 0.95) 100%);
    box-shadow:
      0 6px 20px rgba(147, 39, 143, 0.4),
      inset 0 0 15px rgba(255, 255, 255, 0.2);

    i {
      transform: rotate(15deg);
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
}

.producer-card {
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.5vw, 15px);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.75) 0%, rgba(20, 20, 40, 0.8) 100%);
  padding: clamp(10px, 1.5vw, 15px) clamp(15px, 2vw, 20px);
  border-radius: 50px;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 20px rgba(0, 0, 0, 0.4),
      inset 0 0 15px rgba(255, 255, 255, 0.1);
  }
}

.producer-avatar {
  width: clamp(35px, 4.5vw, 45px);
  height: clamp(35px, 4.5vw, 45px);
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8eb3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: clamp(16px, 2vw, 20px);
  box-shadow: 0 0 15px rgba(255, 107, 157, 0.5);
}

.producer-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif;
}

.producer-name-row {
  display: flex;
  align-items: baseline;
  gap: 8px;

  .producer-label {
    font-size: clamp(10px, 1.1vw, 12px);
    color: rgba(255, 255, 255, 0.65);
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .producer-name {
    font-size: clamp(15px, 1.8vw, 20px);
    color: #fff;
    font-weight: 700;
    letter-spacing: 0.3px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
}

.producer-level-row {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .producer-level-label {
    font-size: clamp(11px, 1.2vw, 13px);
    color: rgba(255, 193, 7, 0.9);
    font-weight: 600;
    font-family: 'Courier New', Consolas, monospace;
  }

  .producer-level-value {
    font-size: clamp(16px, 1.9vw, 22px);
    color: #ffd700;
    font-weight: 700;
    font-family: 'Courier New', Consolas, monospace;
    text-shadow:
      0 0 8px rgba(255, 215, 0, 0.6),
      0 1px 2px rgba(0, 0, 0, 0.4);
  }
}

/* ===== 居中的角色立绘（往下延展） ===== */
.character-container-center {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding-bottom: 0;
}

.spine-character {
  width: 100%;
  height: 100%;
  display: block;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.4));
  pointer-events: auto; // 允许交互

  // 确保 Spine 容器可见
  :deep(.spine-player-wrapper) {
    pointer-events: auto;
    width: 100%;
    height: 100%;
  }

  :deep(.spine-canvas) {
    pointer-events: auto;
    width: 100% !important;
    height: 100% !important;
  }
}

/* ===== 主页按钮（左下角） ===== */
.home-button-container {
  position: absolute;
  bottom: clamp(15px, 2.5vw, 30px);
  left: clamp(15px, 2.5vw, 30px);
  z-index: 4;
}

.home-button {
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.2vw, 12px);
  padding: clamp(12px, 1.8vw, 18px) clamp(18px, 2.5vw, 25px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50px;
  color: white;
  font-size: clamp(14px, 1.6vw, 18px);
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 5px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);

  i {
    font-size: clamp(18px, 2.2vw, 24px);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  span {
    letter-spacing: 0.5px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }
}

/* 主页菜单 */
.home-menu {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;
  min-width: 300px;
  max-width: 400px;
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.95) 0%, rgba(40, 40, 60, 0.95) 100%);
  border-radius: 15px;
  padding: 15px;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  animation: slideUpMenu 0.3s ease;
}

@keyframes slideUpMenu {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    color: #fff;
    font-size: clamp(16px, 1.8vw, 20px);
    margin: 0;
  }
}

.menu-close {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
}

.character-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
}

.character-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 107, 157, 0.5);
  }

  &.active {
    background: rgba(255, 107, 157, 0.2);
    border-color: #ff6b9d;
  }
}

.char-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a78bfa 0%, #c084fc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.char-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;

  .char-name {
    color: #fff;
    font-size: clamp(13px, 1.4vw, 16px);
    font-weight: bold;
  }

  .char-unit {
    color: rgba(255, 255, 255, 0.6);
    font-size: clamp(11px, 1.2vw, 13px);
  }
}

.active-icon {
  color: #ff6b9d;
  font-size: 20px;
  flex-shrink: 0;
}

/* ===== 功能按钮层（Z-index: 3） ===== */
.function-layer {
  position: absolute;
  bottom: 3%;
  left: 55%;
  transform: translateX(-50%);
  z-index: 3;
}

.main-buttons {
  display: flex;
  gap: clamp(15px, 2.5vw, 30px);
  padding: 0 20px;
  align-items: center;
}

.function-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 5px 15px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  overflow: hidden;

  .btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    i {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
  }

  .btn-text {
    letter-spacing: 0.5px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .btn-shine {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s;
  }

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);

    .btn-shine {
      transform: translateX(100%);
    }
  }

  &:active {
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 4px 15px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  // 所有按钮统一为横向长方形
  flex-direction: row;
  border-radius: 14px;
  min-width: clamp(110px, 13vw, 150px);
  height: clamp(52px, 6.5vw, 74px);
  padding: clamp(10px, 1.5vw, 16px) clamp(16px, 2.2vw, 24px);
  gap: clamp(8px, 1.2vw, 12px);

  .btn-icon i {
    font-size: clamp(22px, 3vw, 36px);
  }

  .btn-text {
    font-size: clamp(12px, 1.5vw, 16px);
    white-space: nowrap;
    margin-top: 0;
  }

  // 偶像图鉴按钮 - 紫粉渐变
  &.idol-btn {
    background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
  }

  // 新手介绍按钮 - 橙黄渐变
  &.guide-btn {
    background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%);
  }

  // 抽卡按钮 - 金色渐变
  &.gacha-btn {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  }

  // 自由活动按钮 - 粉红渐变
  &.activity-btn {
    background: linear-gradient(135deg, #fecaca 0%, #fb7185 100%);
  }

  // 音乐按钮 - 蓝紫渐变
  &.music-btn {
    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
  }

  // 培育按钮 - 绿色渐变
  &.produce-btn {
    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  }
}

/* 组合名称 */
.character-unit {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: clamp(12px, 1.4vw, 16px);
  padding: clamp(6px, 1vw, 10px) clamp(12px, 1.5vw, 16px);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  margin-bottom: clamp(15px, 2vw, 20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* ===== 偶像详情弹窗 ===== */
.idol-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  position: relative;
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.95) 0%, rgba(40, 40, 60, 0.95) 100%);
  border-radius: 20px;
  padding: clamp(20px, 3vw, 40px);
  max-width: 90%;
  max-height: 90%;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
  animation: slideUp 0.4s ease;
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

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
}

.idol-details-container {
  display: flex;
  gap: clamp(20px, 3vw, 40px);
  margin-top: 20px;
}

/* 立绘画廊 */
.idol-gallery {
  flex: 1;
  min-width: 300px;

  h3 {
    color: #fff;
    margin-bottom: 15px;
    font-size: clamp(16px, 2vw, 20px);
  }
}

.gallery-main {
  width: 100%;
  aspect-ratio: 9 / 16;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.gallery-main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.gallery-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.5);

  i {
    font-size: 48px;
  }

  p {
    font-size: 14px;
  }
}

.gallery-thumbnails {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.thumbnail {
  width: 80px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    border-color: #ff6b9d;
    transform: scale(1.05);
  }

  &.active {
    border-color: #ff6b9d;
    box-shadow: 0 0 15px rgba(255, 107, 157, 0.5);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

/* 偶像信息 */
.idol-info {
  flex: 1;
  min-width: 300px;
}

.idol-name {
  color: #fff;
  font-size: clamp(24px, 3vw, 32px);
  margin-bottom: 20px;
  text-align: center;
  text-shadow:
    0 2px 10px rgba(255, 182, 193, 0.5),
    0 0 20px rgba(255, 182, 193, 0.3);
}

.idol-details-section {
  margin-bottom: clamp(20px, 2.5vw, 30px);

  h3 {
    color: #ff6b9d;
    font-size: clamp(16px, 2vw, 20px);
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 2px solid rgba(255, 107, 157, 0.3);
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border-left: 3px solid #ff6b9d;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .detail-label {
    font-size: clamp(11px, 1.2vw, 13px);
    color: rgba(255, 255, 255, 0.7);
  }

  .detail-value {
    font-size: clamp(13px, 1.4vw, 16px);
    color: #fff;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.idol-description {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.8;
  font-size: clamp(13px, 1.4vw, 16px);
}

/* ===== 资源显示层（Z-index: 3） ===== */
/* 资源显示层 - 顶部横向布局 */
.resource-display-top {
  position: absolute;
  top: clamp(8px, 1vw, 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  gap: clamp(15px, 3vw, 30px);
  align-items: center;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: clamp(6px, 1vw, 10px);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 20, 40, 0.75) 100%);
  padding: clamp(6px, 1vw, 10px) clamp(12px, 2vw, 20px);
  border-radius: 25px;
  color: white;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    0 3px 10px rgba(0, 0, 0, 0.3),
    inset 0 0 8px rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 5px 15px rgba(0, 0, 0, 0.4),
      inset 0 0 12px rgba(255, 255, 255, 0.1);
  }

  i {
    font-size: clamp(20px, 2.5vw, 28px);
    filter: drop-shadow(0 2px 5px currentColor);
  }

  .resource-icon {
    width: clamp(32px, 4vw, 48px);
    height: clamp(32px, 4vw, 48px);
    object-fit: contain;
    filter: drop-shadow(0 3px 10px rgba(255, 107, 157, 0.8));
    background: transparent;
    border: none;
  }

  .resource-value {
    font-weight: bold;
    font-size: clamp(16px, 2vw, 24px);
    text-shadow: 0 0 10px currentColor;
  }

  &.feather-stone {
    i {
      color: #ff6b9d;
    }
    .resource-value {
      color: #ff6b9d;
    }
  }

  &.fans {
    i {
      color: #6dd5ed;
    }
    .resource-value {
      color: #6dd5ed;
    }
  }
}

/* 设置按钮 - 右上角位置 */
.settings-button-top {
  position: absolute;
  right: clamp(15px, 2vw, 25px);
  top: clamp(15px, 2vw, 25px);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(45px, 5vw, 55px);
  height: clamp(45px, 5vw, 55px);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 20, 40, 0.75) 100%);
  border-radius: 50%;
  color: white;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.15);
    background: linear-gradient(135deg, rgba(255, 165, 0, 0.7), rgba(255, 105, 180, 0.7));
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow:
      0 6px 25px rgba(255, 165, 0, 0.4),
      inset 0 0 15px rgba(255, 255, 255, 0.1);

    i {
      animation: spin 2s linear infinite;
    }
  }

  i {
    font-size: clamp(20px, 2.5vw, 24px);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 全屏按钮 - 右侧中间位置 */
.fullscreen-button {
  position: absolute;
  right: clamp(15px, 2vw, 25px);
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(45px, 5vw, 55px);
  height: clamp(45px, 5vw, 55px);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(20, 20, 40, 0.75) 100%);
  border-radius: 50%;
  color: white;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-50%) scale(1.15);
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.7), rgba(147, 112, 219, 0.7));
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow:
      0 8px 25px rgba(255, 105, 180, 0.6),
      inset 0 0 15px rgba(255, 255, 255, 0.1);
  }

  i {
    font-size: clamp(18px, 2.2vw, 24px);
    filter: drop-shadow(0 2px 5px currentColor);
  }
}

/* 设置弹窗 */
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: clamp(15px, 2vw, 25px);
  z-index: 1001;
  animation: fadeIn 0.2s ease;
}

.settings-panel {
  background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2e 100%);
  border-radius: 12px;
  width: clamp(320px, 35vw, 450px);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideInRight 0.3s ease;
  color: #fff;
}

.settings-panel-header {
  padding: 20px 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #fff;
  }

  .panel-close-btn {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: #fff;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.settings-panel-body {
  padding: 15px 0;
}

.settings-category {
  padding: 0 25px 20px;

  & + .settings-category {
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

.category-title {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 8px;

  i {
    font-size: 16px;
  }
}

.setting-row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 8px 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  align-items: center;
  margin-bottom: 10px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.setting-label-col {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;

  i {
    color: rgba(255, 255, 255, 0.6);
    font-size: 18px;
  }
}

.setting-desc {
  grid-column: 1;
  grid-row: 2;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.setting-control-col {
  grid-column: 2;
  grid-row: 1 / 3;
  display: flex;
  align-items: center;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .toggle-slider {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

      &::before {
        transform: translateX(22px);
      }
    }

    &:focus + .toggle-slider {
      box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.4);
    }
  }
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 34px;
  transition: 0.3s;

  &::before {
    position: absolute;
    content: '';
    height: 22px;
    width: 22px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
    transition: 0.3s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

/* 开发工具按钮 */
.dev-action-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
  }

  &:active {
    transform: translateY(0);
  }

  i {
    font-size: 14px;
  }

  &.danger {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);

    &:hover {
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.5);
    }
  }
}

/* Spine 调试工具样式 */
.spine-debug-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.slider-row {
  padding: 8px 15px !important;
  min-height: auto !important;
}

.slider-label {
  min-width: 60px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.slider-control {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.debug-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.15);
    }
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
  }
}

.slider-value {
  min-width: 50px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #667eea;
  font-family: 'Consolas', monospace;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* ===== 新界面：角色栏选择（第二层） ===== */
.character-gallery-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

.gallery-content {
  position: relative;
  width: 90%;
  max-width: 1400px;
  height: 90%; /* 从 85% 增加到 90%，角色栏界面更高 */
  max-height: 95vh; /* 不超过视口高度 */
  background: linear-gradient(135deg, rgba(30, 30, 60, 0.98), rgba(50, 50, 80, 0.98));
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(15px, 2vw, 25px) clamp(20px, 3vw, 40px);
  background: linear-gradient(90deg, rgba(255, 105, 180, 0.2), rgba(147, 112, 219, 0.2));
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.gallery-title {
  color: #fff;
  font-size: clamp(20px, 3vw, 32px);
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 15px;

  i {
    color: #ffb6d9;
  }
}

.gallery-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  font-size: 20px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 105, 180, 0.5);
    transform: rotate(90deg);
  }
}

.gallery-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(30px, 4vw, 50px); /* 增加 padding 给卡片更多空间 */
  position: relative;
  overflow-y: auto; /* 如果内容太多，允许滚动 */
}

.unit-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.8), rgba(147, 112, 219, 0.8));
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;

  &.prev {
    left: 20px;
  }

  &.next {
    right: 20px;
  }

  &:hover {
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 10px 30px rgba(255, 105, 180, 0.6);
  }
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(clamp(140px, 18vw, 200px), 1fr));
  gap: clamp(20px, 2.5vw, 35px);
  max-width: 1300px;
  width: 100%;
  justify-items: center;
  padding: clamp(10px, 2vw, 20px);
}

.character-card-item {
  cursor: pointer;
  transition: transform 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 100%;

  &:hover {
    transform: scale(1.05);

    .card-frame {
      box-shadow: 0 15px 40px rgba(255, 105, 180, 0.6);
      border-color: rgba(255, 105, 180, 0.8);
    }
  }
}

.card-frame {
  width: 100%;
  aspect-ratio: 9 / 16; /* 9:16 比例，匹配人物立绘 */
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 15px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* 防止在 flex 容器中缩小 */
  min-height: 0; /* 重置最小高度，让 aspect-ratio 生效 */
}

.char-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain; /* 完整显示，不裁剪 */
  object-position: center; /* 居中 */
}

.char-thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: rgba(255, 255, 255, 0.3);
}

.gallery-footer {
  padding: clamp(15px, 2vw, 25px);
  background: rgba(0, 0, 0, 0.3);
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.unit-indicators {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.unit-indicator {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(11px, 1.2vw, 14px);
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;

  &.active {
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.6), rgba(147, 112, 219, 0.6));
    color: #fff;
    border-color: rgba(255, 255, 255, 0.5);
    font-weight: bold;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
}

/* ===== 新界面：卡牌详情（第三层） ===== */
.card-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(15px);
}

.card-content {
  position: relative;
  width: 90%;
  max-width: 1600px;
  height: 90%;
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.98), rgba(40, 40, 70, 0.98));
  border-radius: 25px;
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(15px, 2vw, 25px) clamp(25px, 3vw, 45px);
  background: linear-gradient(90deg, rgba(147, 112, 219, 0.3), rgba(255, 105, 180, 0.3));
  border-bottom: 3px solid rgba(255, 255, 255, 0.15);
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 25px;
  color: #fff;
  font-size: clamp(14px, 1.5vw, 16px);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: rgba(255, 105, 180, 0.4);
    border-color: rgba(255, 105, 180, 0.8);
    transform: translateX(-5px);
  }
}

.card-character-name {
  color: #fff;
  font-size: clamp(22px, 3.5vw, 36px);
  font-weight: bold;
  text-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
}

.card-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  cursor: pointer;
  color: #fff;
  font-size: 22px;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 105, 180, 0.5);
    transform: rotate(90deg);
  }
}

.card-body {
  flex: 1;
  display: flex;
  gap: clamp(20px, 3vw, 40px);
  padding: clamp(20px, 3vw, 40px);
  overflow: hidden;
}

.card-display-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 400px;
}

.card-name-tag {
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.6), rgba(147, 112, 219, 0.6));
  padding: 12px 20px;
  border-radius: 15px;
  color: #fff;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: bold;
  text-align: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 5px 15px rgba(255, 105, 180, 0.4);
}

.card-image-container {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.1);
}

.awaken-toggle {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.8), rgba(255, 165, 0, 0.8));
  border: 3px solid rgba(255, 255, 255, 0.5);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
  box-shadow: 0 5px 15px rgba(255, 215, 0, 0.5);

  &:hover {
    transform: rotate(180deg) scale(1.1);
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.8);
  }
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5));
}

.card-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: rgba(255, 255, 255, 0.4);

  i {
    font-size: 80px;
  }

  p {
    font-size: 18px;
  }
}

.card-thumbnails {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 15px;
  overflow-x: auto;
}

.card-thumb {
  width: 100px;
  aspect-ratio: 3 / 4;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 3px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s;

  &.active {
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow: 0 5px 20px rgba(255, 215, 0, 0.6);
    transform: scale(1.05);
  }

  &:hover {
    border-color: rgba(255, 105, 180, 0.8);
    transform: scale(1.08);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.card-rarity {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 165, 0, 0.9));
  padding: 3px 8px;
  border-radius: 8px;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.card-skills-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 350px;
  max-width: 600px;
}

.skills-title {
  color: #fff;
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 15px;
  border-bottom: 3px solid rgba(255, 105, 180, 0.5);

  i {
    color: #ffd700;
  }
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-right: 10px;

  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 105, 180, 0.5);
    border-radius: 10px;

    &:hover {
      background: rgba(255, 105, 180, 0.7);
    }
  }
}

.skill-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 105, 180, 0.1);
    border-color: rgba(255, 105, 180, 0.5);
    transform: translateX(5px);
  }
}

.skill-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.7), rgba(255, 165, 0, 0.7));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);

  i {
    color: #fff;
    font-size: 24px;
  }
}

.skill-content {
  flex: 1;
}

.skill-name {
  color: #fff;
  font-size: clamp(14px, 1.8vw, 18px);
  font-weight: bold;
  margin-bottom: 8px;
}

.skill-description {
  color: rgba(255, 255, 255, 0.8);
  font-size: clamp(12px, 1.5vw, 15px);
  line-height: 1.6;
}

.no-skills {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);

  i {
    font-size: 60px;
  }

  p {
    font-size: 18px;
  }
}

/* ===== 音乐播放器页面（左右布局） ===== */
.music-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(20, 30, 48, 0.98), rgba(36, 59, 85, 0.98));
  backdrop-filter: blur(20px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.4s ease-out;
}

.music-back-btn {
  position: absolute;
  top: clamp(20px, 3vw, 40px);
  left: clamp(20px, 3vw, 40px);
  padding: clamp(10px, 1.5vw, 15px) clamp(20px, 2.5vw, 30px);
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  color: #fff;
  font-size: clamp(14px, 1.8vw, 18px);
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
  z-index: 10;

  &:hover {
    background: rgba(255, 105, 180, 0.6);
    border-color: rgba(255, 105, 180, 0.8);
    transform: translateX(-5px);
  }

  i {
    font-size: clamp(16px, 2vw, 20px);
  }
}

.music-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: clamp(30px, 4vw, 50px) 20px clamp(20px, 3vw, 30px);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);

  .music-icon {
    width: clamp(50px, 6vw, 70px);
    height: clamp(50px, 6vw, 70px);
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.8), rgba(255, 20, 147, 0.8));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 5px 20px rgba(255, 105, 180, 0.5);

    i {
      color: #fff;
      font-size: clamp(24px, 3vw, 32px);
    }
  }

  h2 {
    color: #fff;
    font-size: clamp(28px, 4vw, 42px);
    font-weight: bold;
    text-shadow: 0 2px 10px rgba(255, 105, 180, 0.5);
    margin: 0;
  }
}

/* 主内容区：左右布局 */
.music-content {
  flex: 1;
  display: flex;
  gap: clamp(30px, 4vw, 50px);
  padding: clamp(30px, 4vw, 50px);
  overflow: hidden;
}

/* 左侧：专辑封面 */
.album-cover-section {
  flex: 0 0 clamp(300px, 35vw, 500px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(20px, 3vw, 30px);
}

.album-cover-frame {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border-radius: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: rotate(45deg);
    animation: shine 3s infinite;
  }
}

@keyframes shine {
  0%,
  100% {
    transform: rotate(45deg) translateY(-100%);
  }
  50% {
    transform: rotate(45deg) translateY(100%);
  }
}

.album-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);

  i {
    font-size: clamp(80px, 10vw, 120px);
  }
}

/* 歌词显示 */
.lyrics-display {
  width: 100%;
  min-height: clamp(60px, 8vh, 80px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(6px, 1vw, 10px);
  margin-bottom: clamp(12px, 2vw, 18px);
  padding: clamp(10px, 1.5vw, 15px);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
}

.lyrics-main {
  color: #fff;
  font-size: clamp(14px, 2vw, 18px);
  font-weight: 500;
  text-align: center;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
}

.lyrics-trans {
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(12px, 1.6vw, 15px);
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

/* 进度条 */
.progress-container {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  cursor: pointer;
  margin-bottom: clamp(12px, 2vw, 18px);
  transition: all 0.2s;

  &:hover {
    height: 6px;
  }
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 105, 180, 0.8), rgba(255, 20, 147, 0.8));
  border-radius: 2px;
  transition: width 0.1s linear;
}

.playback-controls {
  display: flex;
  gap: clamp(15px, 2vw, 25px);
  justify-content: center;
  margin-bottom: clamp(12px, 2vw, 18px);
}

.control-btn {
  width: clamp(50px, 6vw, 70px);
  height: clamp(50px, 6vw, 70px);
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 105, 180, 0.6), rgba(255, 20, 147, 0.6));
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: clamp(20px, 2.5vw, 28px);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.8), rgba(255, 20, 147, 0.8));
    transform: scale(1.1);
    box-shadow: 0 5px 20px rgba(255, 105, 180, 0.6);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &.play {
    width: clamp(60px, 7vw, 80px);
    height: clamp(60px, 7vw, 80px);
    font-size: clamp(24px, 3vw, 32px);
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.7), rgba(255, 165, 0, 0.7));
    box-shadow: 0 5px 25px rgba(255, 215, 0, 0.5);

    &:hover {
      background: linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 165, 0, 0.9));
      transform: scale(1.15);
    }
  }
}

/* 额外控制 */
.extra-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(15px, 2vw, 20px);
  flex-wrap: wrap;
}

.extra-btn {
  width: clamp(35px, 4.5vw, 45px);
  height: clamp(35px, 4.5vw, 45px);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(14px, 1.8vw, 18px);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(255, 105, 180, 0.3);
    border-color: rgba(255, 105, 180, 0.6);
    color: #fff;
    transform: scale(1.1);
  }

  &.active {
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.6), rgba(255, 20, 147, 0.6));
    border-color: rgba(255, 105, 180, 0.8);
    color: #fff;
  }
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: clamp(6px, 1vw, 10px) clamp(10px, 1.5vw, 15px);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  i {
    color: rgba(255, 255, 255, 0.8);
    font-size: clamp(14px, 1.8vw, 16px);
  }
}

.volume-slider {
  width: clamp(50px, 8vw, 80px);
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1.5px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: #ffffff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;

    &:hover {
      transform: scale(1.2);
      box-shadow: 0 3px 8px rgba(255, 105, 180, 0.5);
    }
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #ffffff;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    transition: all 0.2s;

    &:hover {
      transform: scale(1.2);
      box-shadow: 0 3px 8px rgba(255, 105, 180, 0.5);
    }
  }
}

/* 右侧：歌曲列表容器 */
.song-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 歌曲过滤按钮 */
.song-filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
    color: white;
  }

  &.active {
    background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
    border-color: #ff6b9d;
    color: white;
    font-weight: bold;
    box-shadow: 0 4px 15px rgba(255, 107, 157, 0.4);
  }
}

/* 右侧：歌曲列表 */
.song-list-section {
  flex: 1;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.2));
  border-radius: 15px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  padding: clamp(15px, 2vw, 20px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(10px, 1.5vw, 15px);
  cursor: grab;
  user-select: none;
  scroll-behavior: smooth;

  &.dragging {
    cursor: grabbing;
    scroll-behavior: auto;
  }

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 105, 180, 0.5);
    border-radius: 10px;

    &:hover {
      background: rgba(255, 105, 180, 0.7);
    }
  }
}

/* 歌曲项 */
.song-item {
  display: flex;
  flex-direction: column;
  gap: clamp(8px, 1.2vw, 12px);
  padding: clamp(12px, 1.8vw, 18px) clamp(15px, 2vw, 20px);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 105, 180, 0.2);
    border-color: rgba(255, 105, 180, 0.5);
    transform: translateX(5px);
  }

  /* 当前选中的歌曲 - 展开显示 */
  &.active {
    background: linear-gradient(135deg, rgba(255, 105, 180, 0.3), rgba(255, 20, 147, 0.3));
    border-color: rgba(255, 105, 180, 0.8);
    box-shadow: 0 3px 15px rgba(255, 105, 180, 0.4);
    padding: clamp(18px, 2.5vw, 25px) clamp(20px, 2.8vw, 30px);
  }

  /* 无音频的歌曲 - 禁用状态 */
  &.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: rgba(128, 128, 128, 0.1);

    &:hover {
      background: rgba(128, 128, 128, 0.15);
      border-color: rgba(128, 128, 128, 0.3);
      transform: none;
    }

    .song-item-icon i {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  /* 非选中的歌曲 - 只显示标题，较小 */
  &:not(.active) {
    padding: clamp(8px, 1.2vw, 12px) clamp(12px, 1.6vw, 16px);
    opacity: 0.7;

    .song-item-title {
      font-size: clamp(14px, 1.8vw, 17px);
    }
  }
}

/* 歌曲标题行 */
.song-item-icon {
  width: clamp(25px, 3vw, 35px);
  height: clamp(25px, 3vw, 35px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;

  i {
    color: rgba(255, 255, 255, 0.7);
    font-size: clamp(14px, 1.8vw, 18px);
  }

  .fa-volume-up {
    color: rgba(255, 215, 0, 0.9);
    animation: pulse 1s infinite;
  }

  .fa-music {
    color: rgba(255, 105, 180, 0.9);
  }

  .fa-circle {
    font-size: clamp(8px, 1vw, 10px);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.song-item-title {
  color: #fff;
  font-size: clamp(16px, 2.2vw, 20px);
  font-weight: 500;
  flex: 1;
  display: inline;
  transition: all 0.3s;
}

/* 未上传标签 */
.no-audio-tag {
  font-size: clamp(12px, 1.5vw, 14px);
  color: rgba(255, 255, 255, 0.4);
  font-weight: normal;
  margin-left: 8px;
}

/* 歌曲详细信息（仅当前歌曲展开） */
.song-item-details {
  display: flex;
  flex-direction: column;
  gap: clamp(6px, 1vw, 10px);
  margin-top: clamp(8px, 1.2vw, 12px);
  padding-top: clamp(8px, 1.2vw, 12px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.detail-row-compact {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: clamp(4px, 0.8vw, 6px) clamp(8px, 1.2vw, 12px);
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 3px solid rgba(255, 105, 180, 0.6);
}

.detail-label-compact {
  color: rgba(255, 255, 255, 0.6);
  font-size: clamp(12px, 1.5vw, 14px);
  font-weight: bold;
  min-width: clamp(40px, 5vw, 50px);
  flex-shrink: 0;
}

.detail-value-compact {
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(12px, 1.5vw, 14px);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 抽卡页面样式 ===== */
.gacha-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(20, 30, 48, 0.98), rgba(36, 59, 85, 0.98));
  backdrop-filter: blur(20px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.4s ease-out;
}

.gacha-back-btn {
  position: absolute;
  top: clamp(20px, 3vw, 40px);
  left: clamp(20px, 3vw, 40px);
  padding: clamp(10px, 1.5vw, 15px) clamp(20px, 2.5vw, 30px);
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  color: #fff;
  font-size: clamp(14px, 1.8vw, 18px);
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
  z-index: 10;

  &:hover {
    background: rgba(255, 215, 0, 0.6);
    border-color: rgba(255, 215, 0, 0.8);
    transform: translateX(-5px);
  }

  i {
    font-size: clamp(16px, 2vw, 20px);
  }
}

.gacha-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

/* ===== 偶像图鉴页面样式 ===== */
.idol-collection-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fadeIn 0.4s ease-out;
}

.collection-back-btn {
  position: absolute;
  top: clamp(20px, 3vw, 40px);
  left: clamp(20px, 3vw, 40px);
  padding: clamp(10px, 1.5vw, 15px) clamp(20px, 2.5vw, 30px);
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(102, 126, 234, 0.5);
  border-radius: 25px;
  cursor: pointer;
  font-size: clamp(14px, 1.8vw, 18px);
  font-weight: bold;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: clamp(8px, 1.2vw, 12px);
  transition: all 0.3s;
  z-index: 10;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

  &:hover {
    background: #667eea;
    color: white;
    transform: translateX(-5px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  i {
    font-size: clamp(16px, 2vw, 20px);
  }
}

.collection-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

/* 响应式优化 */
@media (max-width: 1024px) {
  .character-container {
    flex-direction: column;
    padding: 5% 3%;
  }

  .spine-character {
    max-width: 90%;
  }

  .function-layer {
    bottom: 2%;
  }

  .main-buttons {
    gap: clamp(8px, 1.5vw, 15px);
  }

  .music-content {
    flex-direction: column;
    overflow-y: auto;
  }

  .album-cover-section {
    flex: 0 0 auto;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }

  .song-list-section {
    width: 100%;
  }
}
</style>
