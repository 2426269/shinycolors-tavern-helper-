/**
 * IndexedDB 游戏数据管理系统
 * 
 * 功能：
 * - 统一管理所有游戏数据（资源、抽卡、设置等）
 * - 支持从localStorage自动迁移
 * - 提供类型安全的API
 * - 高性能异步操作
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface GameResources {
  featherStones: number;  // 羽石
  fans: number;           // 粉丝
  producerLevel: number;  // 制作人等级
  producerExp: number;    // 经验值
  producerName?: string;  // 制作人名称
}

export interface GachaData {
  stardust: number;       // 星尘
  ownedCards: Record<string, any>;  // 拥有的卡牌 {cardId: cardData}
  pity: {
    totalPulls: number;
    ssrPity: number;
    urPity: number;
  };
  history: Array<{
    timestamp: number;
    cards: string[];
    type: 'single' | 'ten';
  }>;
}

export interface GameSettings {
  fullscreenMode: 'button' | 'doubleclick' | 'both';
  devMode: {
    infiniteGems: boolean;
    unlockAllCharacters: boolean;
    maxLevel: boolean;
  };
  musicVolume: number;
  autoPlay: boolean;
  playMode: 'sequential' | 'random' | 'single';
}

export interface AffectionData {
  [idolId: string]: number;  // 偶像ID -> 好感度值
}

// ============================================================================
// IndexedDB 配置
// ============================================================================

const DB_NAME = 'shinycolors_game_data';
const DB_VERSION = 1;

const STORES = {
  RESOURCES: 'resources',
  GACHA: 'gacha',
  SETTINGS: 'settings',
  AFFECTION: 'affection',
  METADATA: 'metadata',  // 存储迁移状态等元数据
} as const;

// ============================================================================
// IndexedDB 初始化
// ============================================================================

let dbInstance: IDBDatabase | null = null;

/**
 * 打开数据库
 */
async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ IndexedDB打开失败:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('✅ IndexedDB打开成功');
      resolve(request.result);
    };

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建所有对象存储
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
          console.log(`📦 创建对象存储: ${storeName}`);
        }
      });
    };
  });
}

// ============================================================================
// 通用读写操作
// ============================================================================

/**
 * 从IndexedDB读取数据
 */
async function getData<T>(storeName: string, key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`❌ 读取数据失败 [${storeName}/${key}]:`, error);
    return null;
  }
}

/**
 * 向IndexedDB写入数据
 */
async function setData<T>(storeName: string, key: string, value: T): Promise<void> {
  try {
    const db = await openDatabase();
    
    // 深拷贝去除Proxy（使用JSON序列化/反序列化）
    const cleanValue = JSON.parse(JSON.stringify(value));
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(cleanValue, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`❌ 写入数据失败 [${storeName}/${key}]:`, error);
    throw error;
  }
}

/**
 * 删除数据
 */
async function deleteData(storeName: string, key: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`❌ 删除数据失败 [${storeName}/${key}]:`, error);
    throw error;
  }
}

/**
 * 清空整个存储
 */
async function clearStore(storeName: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`🗑️ 已清空存储: ${storeName}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`❌ 清空存储失败 [${storeName}]:`, error);
    throw error;
  }
}

// ============================================================================
// localStorage 迁移
// ============================================================================

/**
 * 从localStorage迁移数据到IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<void> {
  console.log('🔄 开始从localStorage迁移数据...');

  try {
    // 检查是否已经迁移过
    const migrated = await getData<boolean>(STORES.METADATA, 'migrated_from_localstorage');
    if (migrated) {
      console.log('✅ 数据已经迁移过，跳过');
      return;
    }

    // 迁移资源数据
    const resourcesStr = localStorage.getItem('shinycolors_resources');
    if (resourcesStr) {
      try {
        const resources = JSON.parse(resourcesStr);
        await setData(STORES.RESOURCES, 'main', resources);
        console.log('📦 迁移资源数据成功');
      } catch (e) {
        console.warn('⚠️ 资源数据解析失败:', e);
      }
    }

    // 迁移抽卡数据
    const gachaStr = localStorage.getItem('shinycolors_gacha_data');
    if (gachaStr) {
      try {
        const gacha = JSON.parse(gachaStr);
        await setData(STORES.GACHA, 'main', gacha);
        console.log('🎴 迁移抽卡数据成功');
      } catch (e) {
        console.warn('⚠️ 抽卡数据解析失败:', e);
      }
    }

    // 迁移设置数据
    const settingsStr = localStorage.getItem('shinycolors_settings');
    if (settingsStr) {
      try {
        const settings = JSON.parse(settingsStr);
        await setData(STORES.SETTINGS, 'main', settings);
        console.log('⚙️ 迁移设置数据成功');
      } catch (e) {
        console.warn('⚠️ 设置数据解析失败:', e);
      }
    }

    // 迁移好感度数据
    const affectionStr = localStorage.getItem('shinycolors_affection');
    if (affectionStr) {
      try {
        const affection = JSON.parse(affectionStr);
        await setData(STORES.AFFECTION, 'main', affection);
        console.log('💖 迁移好感度数据成功');
      } catch (e) {
        console.warn('⚠️ 好感度数据解析失败:', e);
      }
    }

    // 迁移制作人名称
    const producerName = localStorage.getItem('shinycolors_producer_name');
    if (producerName) {
      await setData(STORES.RESOURCES, 'producer_name', producerName);
      console.log('👤 迁移制作人名称成功');
    }

    // 标记已迁移
    await setData(STORES.METADATA, 'migrated_from_localstorage', true);
    await setData(STORES.METADATA, 'migration_date', new Date().toISOString());

    console.log('✅ 数据迁移完成！');
    console.log('💡 提示：可以手动清理localStorage以释放空间');
  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
    throw error;
  }
}

// ============================================================================
// 资源数据 API
// ============================================================================

export async function getResources(): Promise<GameResources> {
  const data = await getData<GameResources>(STORES.RESOURCES, 'main');
  return data || {
    featherStones: 3000,
    fans: 0,
    producerLevel: 1,
    producerExp: 0,
  };
}

export async function saveResources(resources: GameResources): Promise<void> {
  await setData(STORES.RESOURCES, 'main', resources);
}

export async function getProducerName(): Promise<string> {
  const name = await getData<string>(STORES.RESOURCES, 'producer_name');
  return name || '制作人';
}

export async function saveProducerName(name: string): Promise<void> {
  await setData(STORES.RESOURCES, 'producer_name', name);
}

// ============================================================================
// 抽卡数据 API
// ============================================================================

export async function getGachaData(): Promise<GachaData> {
  const data = await getData<GachaData>(STORES.GACHA, 'main');
  return data || {
    stardust: 0,
    ownedCards: {},
    pity: {
      totalPulls: 0,
      ssrPity: 0,
      urPity: 0,
    },
    history: [],
  };
}

export async function saveGachaData(gacha: GachaData): Promise<void> {
  await setData(STORES.GACHA, 'main', gacha);
}

// ============================================================================
// 设置数据 API
// ============================================================================

export async function getSettings(): Promise<GameSettings> {
  const data = await getData<GameSettings>(STORES.SETTINGS, 'main');
  return data || {
    fullscreenMode: 'button',
    devMode: {
      infiniteGems: false,
      unlockAllCharacters: false,
      maxLevel: false,
    },
    musicVolume: 0.7,
    autoPlay: false,
    playMode: 'sequential',
  };
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  await setData(STORES.SETTINGS, 'main', settings);
}

// ============================================================================
// 好感度数据 API
// ============================================================================

export async function getAffection(): Promise<AffectionData> {
  const data = await getData<AffectionData>(STORES.AFFECTION, 'main');
  return data || {};
}

export async function saveAffection(affection: AffectionData): Promise<void> {
  await setData(STORES.AFFECTION, 'main', affection);
}

// ============================================================================
// 管理功能
// ============================================================================

/**
 * 清除所有游戏数据（保留迁移标记）
 */
export async function clearAllGameData(): Promise<void> {
  console.log('🗑️ 清除所有游戏数据...');
  
  await clearStore(STORES.RESOURCES);
  await clearStore(STORES.GACHA);
  await clearStore(STORES.SETTINGS);
  await clearStore(STORES.AFFECTION);
  
  console.log('✅ 游戏数据已清除');
}

/**
 * 清除所有数据（包括迁移标记）
 */
export async function clearAllData(): Promise<void> {
  console.log('🗑️ 清除所有数据（包括元数据）...');
  
  await clearAllGameData();
  await clearStore(STORES.METADATA);
  
  console.log('✅ 所有数据已清除');
}

/**
 * 导出所有数据（用于备份）
 */
export async function exportAllData(): Promise<string> {
  const data = {
    resources: await getResources(),
    producerName: await getProducerName(),
    gacha: await getGachaData(),
    settings: await getSettings(),
    affection: await getAffection(),
    exportDate: new Date().toISOString(),
  };
  
  return JSON.stringify(data, null, 2);
}

/**
 * 导入数据（从备份恢复）
 */
export async function importAllData(jsonStr: string): Promise<void> {
  try {
    const data = JSON.parse(jsonStr);
    
    if (data.resources) await saveResources(data.resources);
    if (data.producerName) await saveProducerName(data.producerName);
    if (data.gacha) await saveGachaData(data.gacha);
    if (data.settings) await saveSettings(data.settings);
    if (data.affection) await saveAffection(data.affection);
    
    console.log('✅ 数据导入成功');
  } catch (error) {
    console.error('❌ 数据导入失败:', error);
    throw new Error('数据格式不正确');
  }
}

// ============================================================================
// 初始化
// ============================================================================

/**
 * 初始化游戏数据系统
 */
export async function initGameData(): Promise<void> {
  console.log('🎮 初始化游戏数据系统...');
  
  // 打开数据库
  await openDatabase();
  
  // 自动迁移localStorage数据
  await migrateFromLocalStorage();
  
  console.log('✅ 游戏数据系统初始化完成');
}



