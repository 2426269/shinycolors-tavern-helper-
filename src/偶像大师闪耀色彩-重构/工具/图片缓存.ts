/**
 * IndexedDB 图片缓存系统
 *
 * 功能：
 * - 持久化缓存图片到浏览器本地
 * - 支持离线访问
 * - 跨会话保持缓存
 * - 显著提升二次加载速度
 */

// ============================================================================
// IndexedDB 配置
// ============================================================================

const DB_NAME = 'shinycolors_image_cache';
const STORE_NAME = 'images';
const DB_VERSION = 1;

// ============================================================================
// IndexedDB 初始化
// ============================================================================

/**
 * 打开 IndexedDB 数据库
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建对象存储（如果不存在）
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// ============================================================================
// 缓存操作
// ============================================================================

/**
 * 保存图片到缓存
 */
async function saveToCache(url: string, blob: Blob): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const data = {
    url,
    blob,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * 从缓存获取图片
 */
async function getFromCache(url: string): Promise<Blob | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(url);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.blob : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('从缓存获取图片失败:', error);
    return null;
  }
}

// ============================================================================
// 主要接口
// ============================================================================

/**
 * 加载图片（优先从缓存，缓存未命中则从网络加载并缓存）
 * @param url 图片URL
 * @returns Blob URL (可直接用于 img.src)
 */
export async function loadImageWithCache(url: string): Promise<string> {
  // 1. 尝试从缓存加载
  const cachedBlob = await getFromCache(url);
  if (cachedBlob) {
    console.log(`[缓存命中] ${url.split('/').pop()}`);
    return URL.createObjectURL(cachedBlob);
  }

  // 2. 缓存未命中，从网络加载
  console.log(`[网络加载] ${url.split('/').pop()}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();

    // 3. 保存到缓存（异步，不阻塞返回）
    saveToCache(url, blob).catch(err => {
      console.warn('保存到缓存失败:', err);
    });

    // 4. 返回 Blob URL
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error(`加载图片失败: ${url}`, error);
    throw error;
  }
}

/**
 * 批量预加载并缓存图片
 * @param urls 图片URL数组
 */
export async function preloadAndCacheImages(urls: string[]): Promise<void> {
  const promises = urls.map(url =>
    loadImageWithCache(url).catch(err => {
      console.warn(`预加载失败: ${url}`, err);
    }),
  );

  await Promise.all(promises);
  console.log(`预加载完成: ${urls.length} 张图片`);
}

// ============================================================================
// 缓存管理
// ============================================================================

/**
 * 清空所有图片缓存
 */
export async function clearImageCache(): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => {
      console.log('图片缓存已清空');
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(): Promise<{ count: number; size: number }> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result;
        const count = items.length;
        const size = items.reduce((total: number, item: any) => total + (item.blob?.size || 0), 0);
        resolve({ count, size });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('获取缓存统计失败:', error);
    return { count: 0, size: 0 };
  }
}

/**
 * 清空所有缓存（别名）
 */
export const clearAllCache = clearImageCache;
