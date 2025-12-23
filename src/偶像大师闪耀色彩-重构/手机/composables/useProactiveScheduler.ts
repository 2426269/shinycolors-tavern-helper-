/**
 * 偶像主动消息调度器 Composable
 * 全局运行，独立于 ChainApp 组件
 */
import { ref } from 'vue';
import { ChainPromptManager, type ChainGroupPromptVariables } from '../../世界书管理/Chain提示词';
import { ChainOfThoughtManager, ChainOfThoughtMode } from '../../世界书管理/思维链区';
import { getAllChainIdolData } from '../数据/ChainAssets';
import { getGenerateApiConfig, type CustomApiConfig } from '../数据/PhoneApiSettings';

// ==================== 类型定义 (与 ChainApp.vue 保持一致) ====================

interface ChainMessage {
  text: string;
  textJP?: string;
  isMe: boolean;
  time: string;
  sticker?: string;
  image?: string;
  // RAG 兼容元数据
  timestamp?: number;
  stageType?: 'FRONT' | 'BACK' | 'MIDDLE';
  affectionLevel?: number;
}

interface ChatItem {
  id: number;
  englishName: string;
  name: string;
  avatar: string;
  profileBg: string;
  lastMsg: string;
  lastTime: string;
  unread: number;
  online: boolean;
  isFavorite: boolean;
  messages: ChainMessage[];
}

interface GroupMessage {
  senderId: number;
  senderName: string;
  text: string;
  textJP?: string;
  time: string;
  sticker?: string;
  // RAG 兼容元数据
  timestamp?: number;
  stageType?: 'FRONT' | 'BACK' | 'MIDDLE';
  affectionLevel?: number;
}

interface GroupChat {
  id: number;
  name: string;
  customAvatar?: string;
  customBg?: string;
  memberIds: number[];
  messages: GroupMessage[];
  lastMsg: string;
  lastSender: string;
  lastTime: string;
  createdAt: string;
}

// ==================== 常量与状态 ====================

const STORAGE_KEY = 'chain_chat_history';
const GROUP_STORAGE_KEY = 'chain_group_list';
const PROACTIVE_SETTINGS_KEY = 'shinycolors_phone_api_settings';
const PROACTIVE_LAST_SENT_KEY = 'chain_proactive_last_sent';

let proactiveTimerId: ReturnType<typeof setInterval> | null = null;
const isSchedulerRunning = ref(false);
let onUnreadUpdateCallback: ((count: number) => void) | null = null;

// ==================== 数据存取 ====================

function loadChatHistory(): Array<any> | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('[ProactiveScheduler] 加载聊天记录失败:', e);
    return null;
  }
}

function saveChatHistory(chatList: ChatItem[]) {
  try {
    const toSave = chatList.map(chat => ({
      id: chat.id,
      englishName: chat.englishName,
      lastMsg: chat.lastMsg,
      lastTime: chat.lastTime,
      unread: chat.unread,
      isFavorite: chat.isFavorite,
      messages: chat.messages,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    window.dispatchEvent(new CustomEvent('chain-data-updated'));
  } catch (e) {
    console.error('[ProactiveScheduler] 保存聊天记录失败:', e);
  }
}

function loadGroupList(): GroupChat[] {
  try {
    const saved = localStorage.getItem(GROUP_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('[ProactiveScheduler] 加载群组列表失败:', e);
    return [];
  }
}

function saveGroupList(groupList: GroupChat[]) {
  try {
    localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groupList));
    window.dispatchEvent(new CustomEvent('chain-data-updated'));
  } catch (e) {
    console.error('[ProactiveScheduler] 保存群组列表失败:', e);
  }
}

function getCurrentChatList(): ChatItem[] {
  const idolData = getAllChainIdolData();
  const savedHistory = loadChatHistory();

  return idolData.map((idol, index) => {
    const saved = savedHistory?.find((s: any) => s.englishName === idol.englishName);
    return {
      id: index + 1,
      englishName: idol.englishName,
      name: idol.chineseName,
      avatar: idol.iconUrl,
      profileBg: idol.profileBgUrl,
      lastMsg: saved?.lastMsg || '',
      lastTime: saved?.lastTime || '',
      unread: saved?.unread || 0,
      online: true,
      isFavorite: saved?.isFavorite ?? index < 3, // 默认前3个关注
      messages: saved?.messages || [],
    };
  });
}

function getTotalUnreadCount(): number {
  const chatList = getCurrentChatList();
  return chatList.reduce((sum, chat) => sum + chat.unread, 0);
}

// ==================== API 调用 ====================

async function callMainApi(systemPrompt: string, userInput: string): Promise<string> {
  // @ts-ignore
  const SillyTavern = window.SillyTavern;
  if (!SillyTavern?.getContext) {
    throw new Error('SillyTavern API 不可用 (Main API)');
  }
  const context = SillyTavern.getContext();
  const response = await context.generateRaw(userInput, null, false, false, systemPrompt);
  return response || '';
}

async function callCustomApi(systemPrompt: string, userInput: string, config: CustomApiConfig): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userInput },
  ];

  const body = {
    model: config.model,
    messages: messages,
    max_tokens: config.max_tokens || 1000,
    temperature: config.temperature || 0.7,
    frequency_penalty: config.frequency_penalty || 0,
    presence_penalty: config.presence_penalty || 0,
    top_p: config.top_p || 1,
  };

  const apiUrl = config.apiurl.replace(/\/$/, '');
  const response = await fetch(apiUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.key || ''}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Custom API call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ==================== 消息生成逻辑 ====================

async function generateIdolProactiveMessage(idol: ChatItem, chatList: ChatItem[]) {
  console.log(`[ProactiveScheduler] 偶像主动发消息: ${idol.name}`);
  try {
    const chainOfThought = ChainOfThoughtManager.getChain(ChainOfThoughtMode.CHAIN_PROACTIVE);
    const variables = {
      idolName: idol.name,
      currentTime: ChainPromptManager.getCurrentTimeString(),
      chatHistory: ChainPromptManager.formatChatHistory(
        idol.messages.slice(-10).map(m => ({
          time: m.time,
          sender: m.isMe ? 'user' : 'idol',
          content: m.text,
        })),
        idol.name,
      ),
    };

    const prompt = ChainPromptManager.getProactivePrompt(variables);
    const systemPrompt = chainOfThought + '\n\n' + prompt;
    const userInput = '（请主动发一条消息给制作人）';

    const customApi = getGenerateApiConfig();
    let responseText = '';

    if (customApi) {
      responseText = await callCustomApi(systemPrompt, userInput, customApi);
    } else {
      responseText = await callMainApi(systemPrompt, userInput);
    }

    const parsed = ChainPromptManager.parseResponse(responseText);
    if (!parsed || !parsed.messages || parsed.messages.length === 0) {
      console.error('[ProactiveScheduler] 偶像主动消息解析失败');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const timestamp = now.getTime();

    for (const msg of parsed.messages) {
      idol.messages.push({
        text: msg.contentCN,
        textJP: msg.contentJP,
        isMe: false,
        time: timeStr,
        sticker: msg.sticker || undefined,
        // RAG 兼容元数据
        timestamp,
        stageType: 'BACK', // Chain 私聊是后台模式
        affectionLevel: 0, // TODO: 等好感度系统上线后替换
      });
    }

    idol.lastMsg = parsed.messages[0].contentCN;
    idol.lastTime = timeStr;
    idol.unread += parsed.messages.length;

    saveChatHistory(chatList);
    if (onUnreadUpdateCallback) onUnreadUpdateCallback(getTotalUnreadCount());

    console.log(`[ProactiveScheduler] 偶像 ${idol.name} 主动发送了 ${parsed.messages.length} 条消息`);
  } catch (error) {
    console.error('[ProactiveScheduler] 偶像主动消息生成失败:', error);
  }
}

async function generateGroupProactiveMessage(group: GroupChat, chatList: ChatItem[], groupList: GroupChat[]) {
  console.log(`[ProactiveScheduler] 群组主动发消息: ${group.name}`);
  try {
    const memberNames = group.memberIds.map(id => {
      const idol = chatList.find(c => c.id === id);
      return idol?.name || '未知偶像';
    });

    const chainOfThought = ChainOfThoughtManager.getChain(ChainOfThoughtMode.CHAIN_GROUP_INITIATIVE);
    const variables: ChainGroupPromptVariables = {
      groupName: group.name,
      memberNames: memberNames,
      currentTime: ChainPromptManager.getCurrentTimeString(),
      chatHistory:
        group.messages
          .slice(-15)
          .map(m => `[${m.time}] ${m.senderName}: ${m.text}`)
          .join('\n') || '（暂无历史记录）',
    };

    const prompt = ChainPromptManager.getGroupInitiativePrompt(variables);
    const systemPrompt = chainOfThought + '\n\n' + prompt;
    const userInput = '（请群内偶像主动发起一个话题）';

    const customApi = getGenerateApiConfig();
    let responseText = '';

    if (customApi) {
      responseText = await callCustomApi(systemPrompt, userInput, customApi);
    } else {
      responseText = await callMainApi(systemPrompt, userInput);
    }

    const parsed = ChainPromptManager.parseResponse(responseText) as {
      messages: Array<{ sender?: string; contentJP: string; contentCN: string; sticker: string | null }>;
    } | null;

    if (!parsed || !parsed.messages || parsed.messages.length === 0) {
      console.error('[ProactiveScheduler] 群组主动消息解析失败');
      return;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const timestamp = now.getTime();

    for (const msg of parsed.messages) {
      const senderName = msg.sender || memberNames[0];
      const senderIdol = chatList.find(c => c.name === senderName);
      const senderId = senderIdol?.id || group.memberIds[0];

      group.messages.push({
        senderId: senderId,
        senderName: senderName,
        text: msg.contentCN,
        textJP: msg.contentJP,
        time: timeStr,
        sticker: msg.sticker || undefined,
        // RAG 兼容元数据
        timestamp,
        stageType: 'BACK', // Chain 群组也是后台模式
        affectionLevel: 0, // TODO: 等好感度系统上线后替换
      });
    }

    const lastMsg = parsed.messages[parsed.messages.length - 1];
    group.lastMsg = lastMsg.contentCN;
    group.lastSender = lastMsg.sender || memberNames[0];
    group.lastTime = timeStr;

    saveGroupList(groupList);
    // 群组消息不增加未读数（或者需要增加？这里暂时不增加，因为没有 unread 字段在 group 中）
    // 如果需要增加未读数，需要在 GroupChat 接口中添加 unread 字段

    console.log(`[ProactiveScheduler] 群组 ${group.name} 主动发送了 ${parsed.messages.length} 条消息`);
  } catch (error) {
    console.error('[ProactiveScheduler] 群组主动消息生成失败:', error);
  }
}

// ==================== 调度逻辑 ====================

function loadProactiveSettings() {
  try {
    const saved = localStorage.getItem(PROACTIVE_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        enabled: parsed.proactive?.enabled ?? false,
        intervalMinutes: parsed.proactive?.intervalMinutes ?? 5,
        probability: parsed.proactive?.probability ?? 30,
        nightModeEnabled: parsed.proactive?.nightModeEnabled ?? true,
        favoriteBonus: parsed.proactive?.favoriteBonus ?? 50,
      };
    }
  } catch (e) {
    console.error('[ProactiveScheduler] 加载设置失败:', e);
  }
  return { enabled: false, intervalMinutes: 5, probability: 30, nightModeEnabled: true, favoriteBonus: 50 };
}

function selectProactiveTarget(chatList: ChatItem[], groupList: GroupChat[]) {
  const settings = loadProactiveSettings();
  const favoriteBonus = settings.favoriteBonus / 100;
  const targets: Array<{ weight: number; type: 'idol' | 'group'; target: ChatItem | GroupChat }> = [];

  chatList.forEach(idol => {
    const weight = idol.isFavorite ? 1 + favoriteBonus : 1;
    targets.push({ weight, type: 'idol', target: idol });
  });

  groupList.forEach(group => {
    targets.push({ weight: 1, type: 'group', target: group });
  });

  if (targets.length === 0) return null;

  const totalWeight = targets.reduce((sum, t) => sum + t.weight, 0);
  let random = Math.random() * totalWeight;

  for (const t of targets) {
    random -= t.weight;
    if (random <= 0) {
      if (t.type === 'idol') return { type: 'idol', idol: t.target as ChatItem };
      return { type: 'group', group: t.target as GroupChat };
    }
  }
  return { type: 'idol', idol: chatList[0] };
}

async function checkAndSendProactiveMessage() {
  const settings = loadProactiveSettings();
  if (!settings.enabled) return;

  let probability = settings.probability / 100;
  const hour = new Date().getHours();
  if (settings.nightModeEnabled && hour >= 0 && hour < 7) {
    probability *= 0.5;
    console.log('[ProactiveScheduler] 深夜模式，概率降低50%');
  }

  const roll = Math.random();
  if (roll >= probability) {
    console.log(
      `[ProactiveScheduler] 概率判定失败: ${(probability * 100).toFixed(1)}%, 骰子: ${(roll * 100).toFixed(1)}%`,
    );
    return;
  }

  console.log('[ProactiveScheduler] 触发主动消息生成');

  const chatList = getCurrentChatList();
  const groupList = loadGroupList();
  const target = selectProactiveTarget(chatList, groupList);

  if (target) {
    localStorage.setItem(PROACTIVE_LAST_SENT_KEY, Date.now().toString());
    if (target.type === 'idol') {
      await generateIdolProactiveMessage(target.idol, chatList);
    } else {
      await generateGroupProactiveMessage(target.group, chatList, groupList);
    }
  }
}

function checkUnreadCount() {
  if (onUnreadUpdateCallback) onUnreadUpdateCallback(getTotalUnreadCount());
}

function handleSettingsChanged() {
  console.log('[ProactiveScheduler] 检测到设置变更，重启调度器...');
  const callback = onUnreadUpdateCallback;
  stopProactiveScheduler();
  window.removeEventListener('proactive-settings-changed', handleSettingsChanged);
  startProactiveScheduler(callback || undefined);
}

export function startProactiveScheduler(onUnreadUpdate?: (count: number) => void) {
  if (proactiveTimerId !== null) return;

  const settings = loadProactiveSettings();
  if (onUnreadUpdate) onUnreadUpdateCallback = onUnreadUpdate;

  checkUnreadCount();
  const unreadCheckInterval = setInterval(checkUnreadCount, 30000);

  if (!settings.enabled) {
    console.log('[ProactiveScheduler] 主动消息功能未启用，仅监听未读数');
    proactiveTimerId = unreadCheckInterval;
    isSchedulerRunning.value = true;
    window.addEventListener('proactive-settings-changed', handleSettingsChanged);
    return;
  }

  clearInterval(unreadCheckInterval);
  const intervalMs = settings.intervalMinutes * 60 * 1000;

  proactiveTimerId = setInterval(() => {
    checkAndSendProactiveMessage().catch(console.error);
    checkUnreadCount();
  }, intervalMs);

  isSchedulerRunning.value = true;
  console.log(`[ProactiveScheduler] 全局调度器已启动，间隔: ${settings.intervalMinutes} 分钟`);
  window.addEventListener('proactive-settings-changed', handleSettingsChanged);
}

export function stopProactiveScheduler() {
  if (proactiveTimerId !== null) {
    clearInterval(proactiveTimerId);
    proactiveTimerId = null;
    isSchedulerRunning.value = false;
    console.log('[ProactiveScheduler] 全局调度器已停止');
  }
}

export function useProactiveScheduler() {
  return {
    startProactiveScheduler,
    stopProactiveScheduler,
    isSchedulerRunning,
  };
}
