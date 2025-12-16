<template>
  <div ref="spineContainer" class="spine-player-wrapper">
    <canvas ref="canvasElement" class="spine-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import * as PIXI from 'pixi.js';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { SPINE_CDN_BASE } from '../工具/constants';
import { useSpineAnimationManager } from '../工具/spine-animation-manager';

// Props
const props = defineProps<{
  idolId: string; // 改为 idolId 以匹配主页传递的 prop 名
  costume?: 'normal' | 'idol'; // 服装类型，默认为 normal
  selectedAnimation?: string; // 当前选择的动画
  debugOffsetX?: number; // 开发者调试：X偏移
  debugOffsetY?: number; // 开发者调试：Y偏移
  debugScale?: number; // 开发者调试：缩放系数
}>();

// Emits
const emit = defineEmits<{
  (e: 'animations-loaded', animations: string[]): void;
}>();

// Refs
const spineContainer = ref<HTMLDivElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);

// 状态
let app: PIXI.Application | null = null;

// 动画管理器
const animationManager = useSpineAnimationManager();

// 监听 idolId 变化
watch(
  () => props.idolId,
  async newId => {
    if (newId) {
      await loadSpineAsset(newId, props.costume || 'normal');
    }
  },
);

// 监听 costume 变化
watch(
  () => props.costume,
  async newCostume => {
    if (props.idolId && newCostume) {
      await loadSpineAsset(props.idolId, newCostume);
    }
  },
);

// 监听 selectedAnimation 变化，切换动画
watch(
  () => props.selectedAnimation,
  newAnimation => {
    if (currentSpine && newAnimation) {
      const animations = currentSpine.skeleton.data.animations.map((anim: any) => anim.name);
      if (animations.includes(newAnimation)) {
        currentSpine.state.setAnimation(0, newAnimation, true);
        console.log(`🎭 切换到动画: ${newAnimation}`);
      }
    }
  },
);

// 监听调试参数变化，实时更新 Spine 变换
watch(
  () => [props.debugOffsetX, props.debugOffsetY, props.debugScale],
  () => {
    updateSpineTransform();
  },
);

// 响应式缩放：监听窗口变化
let resizeObserver: ResizeObserver | null = null;

// 组件挂载
onMounted(async () => {
  console.log('🎬 Spine 播放器组件挂载');

  // 等待 v8-spine37.js 加载
  await waitForSpine37();

  // 初始化 PixiJS 应用
  await initPixiApp();

  // 加载初始 Spine 资源
  if (props.idolId) {
    await loadSpineAsset(props.idolId, props.costume || 'normal');
  }

  // 启用响应式监听
  setupResizeObserver();

  // 启用全屏监听
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('mozfullscreenchange', handleFullscreenChange);
  document.addEventListener('MSFullscreenChange', handleFullscreenChange);
});

// 组件卸载
onUnmounted(() => {
  console.log('👋 Spine 播放器组件卸载');
  if (app) {
    app.destroy(true, { children: true, texture: true });
  }

  // 清理 resize observer
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // 移除全屏监听
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
});

/**
 * 等待 v8-spine37.js 加载完成
 */
async function waitForSpine37(): Promise<void> {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if ((window as any).PIXI?.Spine37) {
        clearInterval(checkInterval);
        console.log('✅ PIXI.Spine37 已加载');
        resolve();
      }
    }, 100);

    // 超时处理（5秒，因为脚本已直接打包）
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!(window as any).PIXI?.Spine37) {
        console.error('❌ PIXI.Spine37 加载超时（5秒）');
        console.error('window.PIXI:', (window as any).PIXI);
        console.error('请检查 PixiJS 是否正确加载');
        reject(new Error('PIXI.Spine37 加载超时'));
      }
    }, 5000);
  });
}

/**
 * 初始化 PixiJS 应用
 */
async function initPixiApp() {
  if (!canvasElement.value) {
    console.error('❌ Canvas 元素未找到');
    return;
  }

  console.log('📦 初始化 PixiJS 应用...');

  app = new PIXI.Application();

  // 🔑 修复：等待 DOM 渲染完成,确保容器有正确尺寸
  await new Promise(resolve => setTimeout(resolve, 100));

  // 确保获取正确的父容器尺寸
  const container = canvasElement.value.parentElement;
  let width = container?.clientWidth || 0;
  let height = container?.clientHeight || 0;

  // 如果容器尺寸仍然为0，使用窗口尺寸
  if (width === 0 || height === 0) {
    width = window.innerWidth;
    height = window.innerHeight;
    console.warn('⚠️ 容器尺寸为0，使用窗口尺寸:', width, 'x', height);
  }

  console.log(`📐 Canvas 尺寸: ${width} x ${height}`);

  await app.init({
    canvas: canvasElement.value,
    width: width,
    height: height,
    backgroundAlpha: 0, // 透明背景
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  console.log('✅ PixiJS 应用初始化完成');
  console.log('📦 Renderer:', app.renderer.name);

  // 检查 SpinePipe 是否已注册
  const renderer = app.renderer as any;
  if (renderer.renderPipes?.spine) {
    console.log('✅ SpinePipe 已自动注册');
  } else {
    console.warn('⚠️ SpinePipe 未注册，可能导致渲染问题');
  }

  // 渲染循环（仅用于监控）
  let frameCount = 0;
  app.ticker.add(() => {
    // 每 300 帧打印一次调试信息
    if (++frameCount % 300 === 0 && app) {
      console.log('🎬 渲染帧:', frameCount, 'Stage children:', app.stage.children.length);
    }
  });
}

/**
 * 加载 Spine 资源（手动加载并缓存，参考 ShinyColorsDB-SpineViewer）
 */
async function loadSpineAsset(idolId: string, costumeType: 'normal' | 'idol' = 'normal') {
  if (!app) {
    console.error('❌ PixiJS 应用未初始化');
    return;
  }

  try {
    console.log(`🎬 开始加载 Spine 资源: ${idolId} (${costumeType})`);

    // 解析 idolId (格式: 角色名_卡片名)
    const [characterName, baseCostumeName] = idolId.split('_');

    // 根据服装类型修改文件夹名（如果是偶像服，添加 " 偶像服" 后缀，注意有空格）
    const costumeName = costumeType === 'idol' ? `${baseCostumeName} 偶像服` : baseCostumeName;

    // 使用 Cloudflare R2 CDN
    const baseUrl = `${SPINE_CDN_BASE}/${characterName}/${costumeName}`;

    // 创建唯一标签以支持服装切换
    const label = `${idolId}_${costumeType}`;

    console.log('📦 Skeleton URL:', `${baseUrl}/${costumeName}.json`);
    console.log('📦 Atlas URL:', `${baseUrl}/${costumeName}.atlas`);

    // 🔑 手动加载并缓存（参考 ShinyColorsDB-SpineViewer）
    const Spine37 = (window as any).PIXI.Spine37;

    // 1. 加载 JSON (skeleton)
    // CDN 上的文件名与文件夹名相同
    const jsonUrl = `${baseUrl}/${costumeName}.json`;
    console.log('📦 加载 Skeleton:', jsonUrl);

    let rawJSON = null;
    try {
      const response = await fetch(jsonUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      rawJSON = await response.json();
      console.log('✅ Skeleton 数据加载成功');
    } catch (error) {
      console.error('❌ Skeleton 加载失败:', jsonUrl, error);
      throw new Error(`无法加载 Skeleton 数据: ${error}`);
    }

    // 验证 JSON 数据结构
    if (!rawJSON.skeleton) {
      console.error('❌ JSON 数据缺少 skeleton 属性:', rawJSON);
      throw new Error('JSON 数据格式不正确：缺少 skeleton 属性');
    }

    PIXI.Assets.cache.set(`skel_${label}`, rawJSON);
    console.log('✅ Skeleton 数据已缓存，包含属性:', Object.keys(rawJSON));

    // 2. 加载 Atlas 文本
    const atlasUrl = `${baseUrl}/${costumeName}.atlas`;
    console.log('📦 加载 Atlas:', atlasUrl);

    let rawAtlas = null;
    try {
      const response = await fetch(atlasUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      rawAtlas = await response.text();
      console.log('✅ Atlas 数据加载成功');
    } catch (error) {
      console.error('❌ Atlas 加载失败:', atlasUrl, error);
      throw new Error(`无法加载 Atlas 数据: ${error}`);
    }

    const textureAtlas = new Spine37.TextureAtlas(rawAtlas);
    PIXI.Assets.cache.set(`atlas_${label}`, textureAtlas);
    console.log('✅ Atlas 文本已解析，页面数量:', textureAtlas.pages.length);

    // 3. 为每个 page 加载纹理
    const textureLoadingPromises = textureAtlas.pages.map(async (page: any, index: number) => {
      // 🔑 修复：忽略 page.name（可能是data.png），使用我们知道的正确文件名
      // 我们上传的PNG文件名与文件夹名相同：${costumeName}.png
      const imgUrl = `${baseUrl}/${costumeName}.png`;
      // 🔑 使用唯一的alias避免不同卡牌间的缓存冲突
      const uniqueAlias = `${label}_texture_${index}`;

      console.log('📦 加载纹理:', imgUrl, '(别名:', uniqueAlias, ')');

      // 使用 PIXI.Assets.load 加载图片
      const rawtexture = await PIXI.Assets.load({
        alias: uniqueAlias,
        src: imgUrl,
        data: {
          alphaMode: page.pma ? 'premultiplied-alpha' : 'premultiply-alpha-on-upload',
        },
      });

      // 调试：查看纹理对象的结构
      console.log('📊 加载的纹理对象:', {
        type: typeof rawtexture,
        constructor: rawtexture?.constructor?.name,
        hasBaseTexture: !!rawtexture?.baseTexture,
        hasSource: !!rawtexture?.source,
        hasResource: !!rawtexture?.resource,
        keys: rawtexture ? Object.keys(rawtexture) : [],
      });

      // 🔑 关键：使用正确的纹理引用
      // 在 PixiJS v8 中，根据实际的纹理结构选择正确的属性
      let textureToUse = null;

      if (rawtexture?.source) {
        // PixiJS v8 的新结构：使用 source
        textureToUse = rawtexture.source;
      } else if (rawtexture?.baseTexture?.resource?.source) {
        // 旧的结构：通过 baseTexture.resource.source
        textureToUse = rawtexture.baseTexture.resource.source;
      } else if (rawtexture?.baseTexture) {
        // 使用 baseTexture
        textureToUse = rawtexture.baseTexture;
      } else if (rawtexture) {
        // 直接使用纹理对象
        textureToUse = rawtexture;
      }

      if (textureToUse) {
        page.setTexture(Spine37.SpineTexture.from(textureToUse));
        console.log('✅ 纹理设置完成:', page.name);
      } else {
        console.error('❌ 纹理加载失败，无法找到有效的纹理对象:', page.name);
      }
    });

    await Promise.all(textureLoadingPromises);
    console.log('✅ 所有纹理加载完成');

    // 4. 创建 Spine 实例
    console.log('📊 缓存检查:', {
      hasSkeleton: PIXI.Assets.cache.has(`skel_${label}`),
      hasAtlas: PIXI.Assets.cache.has(`atlas_${label}`),
      skeletonType: typeof PIXI.Assets.cache.get(`skel_${label}`),
      atlasType: typeof PIXI.Assets.cache.get(`atlas_${label}`),
    });

    // 尝试创建 Spine 实例
    let spine;
    try {
      spine = Spine37.Spine.from({
        skeleton: `skel_${label}`,
        atlas: `atlas_${label}`,
      });
      console.log('✅ Spine 实例创建成功');
    } catch (error) {
      console.error('❌ Spine.from() 失败，尝试备用方法:', error);

      // 备用方法：直接使用数据创建
      const skeletonData = PIXI.Assets.cache.get(`skel_${label}`);
      const atlas = PIXI.Assets.cache.get(`atlas_${label}`);

      if (skeletonData && atlas) {
        const skeletonJson = new Spine37.SkeletonJson(new Spine37.AtlasAttachmentLoader(atlas));
        const spineData = skeletonJson.readSkeletonData(skeletonData);
        spine = new Spine37.Spine(spineData);
        console.log('✅ 使用备用方法创建 Spine 实例成功');
      } else {
        throw new Error('无法创建 Spine 实例：缺少必要的数据');
      }
    }

    // 🔑 关键修复：为 Spine 实例添加 collectRenderables 方法（PixiJS v8 需要）
    if (!spine.collectRenderables) {
      spine.collectRenderables = function (renderGroup) {
        // 简单实现：将自己添加到渲染组
        if (this.visible && this.renderable && this.alpha > 0) {
          renderGroup.addChild(this);
        }
      };
    }

    // 设置皮肤
    try {
      spine.skeleton.setSkinByName('normal');
    } catch (e) {
      spine.skeleton.setSkinByName('default');
    }

    // 初始化 Spine
    spine.skeleton.setToSetupPose();

    // 获取动画列表
    const animations = spine.skeleton.data.animations.map((anim: any) => anim.name);
    console.log('🎬 可用动画列表:', animations);

    // 发射动画列表给父组件
    emit('animations-loaded', animations);

    // 播放动画（优先使用selectedAnimation prop）
    const defaultAnimation = props.selectedAnimation || 'wait';
    if (animations.includes(defaultAnimation)) {
      spine.state.setAnimation(0, defaultAnimation, true);
      console.log(`▶️ 播放动画: ${defaultAnimation}`);
    } else if (animations.includes('wait')) {
      spine.state.setAnimation(0, 'wait', true);
      console.log(`▶️ 播放动画: wait`);
    } else if (animations.length > 0) {
      spine.state.setAnimation(0, animations[0], true);
      console.log(`▶️ 播放动画: ${animations[0]}`);
    }

    // 渲染到舞台
    renderToStage(spine);

    // 绑定到动画管理器
    animationManager.setSpine(spine);

    console.log('✅ Spine 资源加载完成');
  } catch (error) {
    console.error('❌ Spine 加载失败:', error);
  }
}

// 状态变量
let currentContainer: PIXI.Container | null = null;
let currentSpine: any = null;
let idleTimer: number | null = null;

/**
 * 创建用于计算边界的 Graphics（不可见）
 * 参考 ShinyColorsDB-SpineViewer main.js 的 createGraphics 函数
 */
function createGraphics(spine: any) {
  const graphics = new PIXI.Graphics();
  graphics.alpha = 0; // 透明，不显示

  const Spine37 = (window as any).PIXI.Spine37;
  const skeleton = spine.skeleton;
  const slots = skeleton.slots;

  for (let i = 0, len = slots.length; i < len; i++) {
    const slot = slots[i];

    if (!slot.bone.isActive) {
      continue;
    }
    const attachment = slot.getAttachment();

    if (attachment === null || !(attachment instanceof Spine37.MeshAttachment)) {
      continue;
    }

    const meshAttachment = attachment;
    const vertices = new Float32Array(meshAttachment.worldVerticesLength);
    let hullLength = meshAttachment.hullLength;
    const triangles = meshAttachment.triangles;

    meshAttachment.computeWorldVertices(slot, 0, meshAttachment.worldVerticesLength, vertices, 0, 2);

    // 绘制三角形边界
    for (let i = 0, len = triangles.length; i < len; i += 3) {
      const v1 = triangles[i] * 2;
      const v2 = triangles[i + 1] * 2;
      const v3 = triangles[i + 2] * 2;

      graphics.context
        .moveTo(vertices[v1], vertices[v1 + 1])
        .lineTo(vertices[v2], vertices[v2 + 1])
        .lineTo(vertices[v3], vertices[v3 + 1]);
    }

    // 绘制皮肤边界
    if (hullLength > 0) {
      hullLength = (hullLength >> 1) * 2;
      let lastX = vertices[hullLength - 2];
      let lastY = vertices[hullLength - 1];

      for (let i = 0, len = hullLength; i < len; i += 2) {
        const x = vertices[i];
        const y = vertices[i + 1];

        graphics.context.moveTo(x, y).lineTo(lastX, lastY);
        lastX = x;
        lastY = y;
      }
    }
  }

  // 🔑 必须调用 stroke() 才能让边界数据生效
  graphics.stroke({ width: 1, color: 0x000000 });

  return graphics;
}

/**
 * 渲染 Spine 到舞台（参考 ShinyColorsDB-SpineViewer main.js）
 */
function renderToStage(spine: any) {
  if (!app) return;

  const Spine37 = (window as any).PIXI.Spine37;

  // 清空并重新添加
  app.stage.removeChildren();

  // 创建容器并添加 Spine
  const container = new PIXI.Container();
  container.addChild(spine);

  // 保存当前容器和spine引用
  currentContainer = container;
  currentSpine = spine;

  // 在添加到 container 之后调用 update(0)
  spine.update(0);

  // 使用 graphics 计算真实边界
  const gp = createGraphics(spine);
  const gpBound = gp.getLocalBounds();

  console.log('📏 Graphics bounds:', {
    x: gpBound.x,
    y: gpBound.y,
    width: gpBound.width,
    height: gpBound.height,
  });

  // 🔑 边界检查：如果边界尺寸为0或无效，使用 Spine 自身边界
  let boundsWidth = gpBound.width;
  let boundsHeight = gpBound.height;

  if (boundsWidth <= 0 || boundsHeight <= 0 || !isFinite(boundsWidth) || !isFinite(boundsHeight)) {
    console.warn('⚠️ Graphics bounds 无效，使用 Spine 自身边界');
    const spineBounds = spine.getBounds();
    boundsWidth = spineBounds.width;
    boundsHeight = spineBounds.height;
    console.log('📏 Spine bounds:', {
      x: spineBounds.x,
      y: spineBounds.y,
      width: boundsWidth,
      height: boundsHeight,
    });
  }

  // 设置 Spine 位置
  spine.position.set(-gpBound.x, -gpBound.y);

  // 计算缩放（自适应版本）
  const canvasWidth = app.renderer.width;
  const canvasHeight = app.renderer.height;

  // 判断是否全屏
  const isFullscreenMode = isFullscreen();

  // 根据不同模式设置不同的缩放系数
  // 全屏模式下使用更大的缩放系数让人物更显眼
  const scaleFactor = isFullscreenMode ? 0.65 : 0.6;

  // 对于宽屏设备（宽高比 > 1.5），适当调整缩放（全屏时保持更大）
  const aspectRatio = canvasWidth / canvasHeight;
  const adjustedScaleFactor = aspectRatio > 1.5 ? scaleFactor * (isFullscreenMode ? 0.95 : 0.8) : scaleFactor;

  let scale = 1;
  if (boundsWidth > 0 && boundsHeight > 0) {
    // 计算适合画布的缩放比例
    scale = Math.min(canvasWidth / boundsWidth, canvasHeight / boundsHeight) * adjustedScaleFactor;

    // 限制最大和最小缩放
    scale = Math.min(Math.max(scale, 0.2), 2.0);
  }

  console.log('📐 缩放计算:', {
    canvasSize: `${canvasWidth}x${canvasHeight}`,
    boundsSize: `${boundsWidth}x${boundsHeight}`,
    isFullscreen: isFullscreenMode,
    aspectRatio: aspectRatio.toFixed(2),
    scaleFactor: adjustedScaleFactor,
    finalScale: scale.toFixed(3),
  });

  // 应用缩放
  // 默认缩放系数：1.5（用户调试确定的最佳值）
  const defaultScale = 1.5;
  const debugScale = props.debugScale || 1.0;
  const finalScale = scale * defaultScale * debugScale;
  container.scale.set(finalScale, finalScale);

  // 设置容器位置（居中 + 默认偏移 + 调试偏移）
  // 默认偏移值（用户调试确定）：
  // - 非全屏：offsetX: -240, offsetY: -250
  // - 全屏：offsetX: -520, offsetY: -320
  const defaultOffsetX = isFullscreenMode ? -520 : -240;
  const defaultOffsetY = isFullscreenMode ? -320 : -250;
  const debugOffsetX = props.debugOffsetX || 0;
  const debugOffsetY = props.debugOffsetY || 0;
  container.position.set(
    canvasWidth / 2 + defaultOffsetX + debugOffsetX,
    canvasHeight / 2 + defaultOffsetY + debugOffsetY,
  );

  // 设置交互
  container.eventMode = 'static';
  container.cursor = 'pointer';

  // 点击事件：随机切换动画
  container.on('pointerdown', onSpineClick);

  // 拖动功能
  container.on('pointerdown', onDragStart);
  container.on('pointermove', onDragMove);
  container.on('pointerup', onDragEnd);
  container.on('pointerupoutside', onDragEnd);

  // 添加容器到舞台
  app.stage.addChild(container);

  console.log('✅ Spine 已渲染到舞台');
  console.log('📊 舞台子元素数量:', app.stage.children.length);
  console.log('📊 容器子元素数量:', container.children.length);
  console.log('📊 Spine 实例:', spine);
  console.log('📊 容器位置:', container.position);
  console.log('📊 容器缩放:', container.scale);
  console.log('📊 Spine 位置:', spine.position);

  // 启动静置计时器
  resetIdleTimer();
}

// 拖动状态
let isDragging = false;
let dragData: { x: number; y: number } | null = null;

function onDragStart(event: any) {
  if (!currentContainer) return;
  isDragging = true;
  dragData = {
    x: event.global.x - currentContainer.x,
    y: event.global.y - currentContainer.y,
  };
  resetIdleTimer();
}

function onDragMove(event: any) {
  if (!isDragging || !dragData || !currentContainer) return;
  currentContainer.x = event.global.x - dragData.x;
  currentContainer.y = event.global.y - dragData.y;
}

function onDragEnd() {
  isDragging = false;
  dragData = null;
}

// 点击切换动画
function onSpineClick() {
  if (isDragging || !currentSpine) return; // 如果正在拖动，不触发点击

  const animations = currentSpine.skeleton.data.animations.map((anim: any) => anim.name);
  if (animations.length === 0) return;

  // 随机选择一个动画（排除当前动画）
  const currentAnim = currentSpine.state.tracks[0]?.animation?.name;
  const availableAnims = animations.filter((name: string) => name !== currentAnim);

  if (availableAnims.length === 0) return;

  const randomAnim = availableAnims[Math.floor(Math.random() * availableAnims.length)];
  currentSpine.state.setAnimation(0, randomAnim, true);
  console.log(`🎭 切换到动画: ${randomAnim}`);

  resetIdleTimer();
}

// 静置计时器：5秒后切回wait动画
function resetIdleTimer() {
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
  }

  idleTimer = window.setTimeout(() => {
    if (!currentSpine) return;

    const animations = currentSpine.skeleton.data.animations.map((anim: any) => anim.name);
    const currentAnim = currentSpine.state.tracks[0]?.animation?.name;

    // 如果有wait动画且当前不是wait，切换到wait
    if (animations.includes('wait') && currentAnim !== 'wait') {
      currentSpine.state.setAnimation(0, 'wait', true);
      console.log('⏰ 静置5秒，切换到 wait 动画');
    }
  }, 5000);
}

/**
 * 设置响应式监听
 */
function setupResizeObserver() {
  if (!spineContainer.value) return;

  resizeObserver = new ResizeObserver(() => {
    handleResize();
  });

  resizeObserver.observe(spineContainer.value);
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  if (!app || !currentContainer || !currentSpine) return;

  // 获取新的容器尺寸
  const container = canvasElement.value?.parentElement;
  const width = container?.clientWidth || window.innerWidth;
  const height = container?.clientHeight || window.innerHeight;

  // 调整 Canvas 大小
  app.renderer.resize(width, height);

  // 重新计算 Spine 缩放和位置
  updateSpineTransform();
}

/**
 * 处理全屏变化
 */
function handleFullscreenChange() {
  // 延迟一帧以确保浏览器完成全屏切换
  requestAnimationFrame(() => {
    handleResize();
  });
}

/**
 * 判断是否全屏
 */
function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

/**
 * 更新 Spine 变换（完整版本 - 更新位置和缩放）
 */
function updateSpineTransform() {
  if (!app || !currentContainer || !currentSpine) return;

  const canvasWidth = app.renderer.width;
  const canvasHeight = app.renderer.height;

  // 获取当前的边界（使用保存的边界信息或重新计算）
  const gp = createGraphics(currentSpine);
  const gpBound = gp.getLocalBounds();

  let boundsWidth = gpBound.width;
  let boundsHeight = gpBound.height;

  if (boundsWidth <= 0 || boundsHeight <= 0 || !isFinite(boundsWidth) || !isFinite(boundsHeight)) {
    const spineBounds = currentSpine.getBounds();
    boundsWidth = spineBounds.width;
    boundsHeight = spineBounds.height;
  }

  // 判断是否全屏
  const isFullscreenMode = isFullscreen();

  // 根据不同模式设置不同的缩放系数（与 renderToStage 保持一致）
  // 全屏模式下使用更大的缩放系数让人物更显眼
  const scaleFactor = isFullscreenMode ? 0.65 : 0.6;

  // 对于宽屏设备（宽高比 > 1.5），适当调整缩放（全屏时保持更大）
  const aspectRatio = canvasWidth / canvasHeight;
  const adjustedScaleFactor = aspectRatio > 1.5 ? scaleFactor * (isFullscreenMode ? 0.95 : 0.8) : scaleFactor;

  let scale = 1;
  if (boundsWidth > 0 && boundsHeight > 0) {
    scale = Math.min(canvasWidth / boundsWidth, canvasHeight / boundsHeight) * adjustedScaleFactor;
    scale = Math.min(Math.max(scale, 0.2), 2.0);
  }

  console.log('📐 窗口调整 - 重新计算缩放:', {
    canvasSize: `${canvasWidth}x${canvasHeight}`,
    isFullscreen: isFullscreenMode,
    newScale: scale.toFixed(3),
  });

  // 应用新的缩放和位置（默认值 + 调试参数）
  const defaultScale = 1.5;
  const debugScale = props.debugScale || 1.0;
  const finalScale = scale * defaultScale * debugScale;
  currentContainer.scale.set(finalScale, finalScale);

  // 默认偏移值（与 renderToStage 一致）
  const defaultOffsetX = isFullscreenMode ? -520 : -240;
  const defaultOffsetY = isFullscreenMode ? -320 : -250;
  const debugOffsetX = props.debugOffsetX || 0;
  const debugOffsetY = props.debugOffsetY || 0;
  currentContainer.position.set(
    canvasWidth / 2 + defaultOffsetX + debugOffsetX,
    canvasHeight / 2 + defaultOffsetY + debugOffsetY,
  );
}
</script>

<style scoped lang="scss">
.spine-player-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.spine-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
