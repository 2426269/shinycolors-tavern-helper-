/**
 * Spine资源加载器
 * 负责从GitHub加载Spine动画资源
 * ⚠️ 注意: 本文件当前未使用，Spine 加载逻辑在 Spine播放器.vue 中通过 v8-spine37.js 实现
 * 保留此文件以供未来可能的重构参考
 */

import { Assets } from 'pixi.js';
// ⚠️ 已移除 pixi-spine 导入，因为与 PixiJS v8 不兼容
// import 'pixi-spine'; // 自动注册 Spine 扩展到 PixiJS

/**
 * Spine资源配置接口
 */
export interface SpineAsset {
  idolId: string; // 偶像ID
  skeletonUrl: string; // .json文件URL
}

/**
 * GitHub CDN基础URL
 */
const CDN_BASE = 'https://283pro.site/shinycolors';

/**
 * 偶像Spine资源映射
 * 格式: "偶像名_【卡片名】偶像名"
 */
export const SPINE_ASSETS_MAP: Record<string, SpineAsset> = {
  '櫻木真乃_【ほわっとスマイル】櫻木真乃': {
    idolId: '櫻木真乃_【ほわっとスマイル】櫻木真乃',
    skeletonUrl: `${CDN_BASE}/spine/櫻木真乃/【ほわっとスマイル】櫻木真乃/【ほわっとスマイル】櫻木真乃.json`,
  },
  '櫻木真乃_【花風Smiley】櫻木真乃': {
    idolId: '櫻木真乃_【花風Smiley】櫻木真乃',
    skeletonUrl: `${CDN_BASE}/spine/櫻木真乃/【花風Smiley】櫻木真乃/【花風Smiley】櫻木真乃.json`,
  },
  // TODO: 逐步添加其他138张卡的Spine资源配置
};

/**
 * 动画名称映射（标准化）
 */
export const ANIMATION_MAP = {
  // 待机动画
  idle: 'Idle',

  // 情绪动画
  happy: 'Emotion_Happy',
  sad: 'Emotion_Sad',
  angry: 'Emotion_Angry',
  surprise: 'Emotion_Surprise',
  shy: 'Emotion_Shy',
  confusion: 'Emotion_Confusion',

  // 说话动画
  talk: 'Talk_01',
  talk_happy: 'Talk_Happy',
  talk_serious: 'Talk_Serious',

  // 交互动画
  touch_head: 'Touch_Head',
  touch_body: 'Touch_Body',
  touch_hand: 'Touch_Hand',

  // 特殊动画
  greeting: 'Greeting',
  victory: 'Victory',
  defeat: 'Defeat',
  think: 'Think',
} as const;

export type AnimationName = keyof typeof ANIMATION_MAP;

/**
 * 加载Spine资源
 * 使用 PixiJS v8 Assets 系统
 */
export async function loadSpineAsset(idolId: string): Promise<any> {
  const asset = SPINE_ASSETS_MAP[idolId];

  if (!asset) {
    const availableIds = Object.keys(SPINE_ASSETS_MAP);
    throw new Error(`未找到偶像 ${idolId} 的Spine资源配置\n可用ID: ${availableIds.join(', ')}`);
  }

  try {
    console.log(`🎬 开始加载 ${idolId} 的Spine资源...`);
    console.log(`📦 Skeleton URL: ${asset.skeletonUrl}`);

    // 检查缓存
    if (Assets.cache.has(`spine_${idolId}`)) {
      console.log(`📦 从缓存加载 ${idolId}`);
      return Assets.cache.get(`spine_${idolId}`);
    }

    // 添加资源到 Assets 系统
    Assets.add({
      alias: `spine_${idolId}`,
      src: asset.skeletonUrl,
    });

    // 加载资源
    const spineData = await Assets.load(`spine_${idolId}`);

    if (!spineData) {
      throw new Error('加载的Spine数据为null');
    }

    console.log(`✅ ${idolId} 的Spine资源加载完成`, spineData);
    return spineData;
  } catch (error) {
    console.error(`❌ 加载 ${idolId} 的Spine资源失败:`, error);
    console.error(`资源配置:`, asset);
    throw error;
  }
}

/**
 * 预加载多个偶像的Spine资源
 */
export async function preloadSpineAssets(idolIds: string[]): Promise<void> {
  console.log(`🎬 开始预加载 ${idolIds.length} 个偶像的Spine资源...`);

  const loadPromises = idolIds.map(id =>
    loadSpineAsset(id).catch(err => {
      console.warn(`跳过 ${id}:`, err.message);
      return null;
    }),
  );

  await Promise.all(loadPromises);
  console.log(`✅ Spine资源预加载完成`);
}

/**
 * 卸载Spine资源（释放内存）
 */
export async function unloadSpineAsset(idolId: string): Promise<void> {
  try {
    await Assets.unload(`spine_${idolId}`);
    console.log(`🗑️ 已卸载 ${idolId} 的Spine资源`);
  } catch (error) {
    console.warn(`卸载 ${idolId} 的Spine资源失败:`, error);
  }
}

/**
 * 获取标准化的动画名称
 */
export function getAnimationName(name: AnimationName | string): string {
  if (name in ANIMATION_MAP) {
    return ANIMATION_MAP[name as AnimationName];
  }
  return name; // 如果不在映射中，直接返回原名称
}

/**
 * 检查Spine资源是否已加载
 */
export function isSpineAssetLoaded(idolId: string): boolean {
  return Assets.cache.has(`spine_${idolId}`);
}
