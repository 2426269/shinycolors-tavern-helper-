# RAG 与好感度系统集成备忘录

## 📅 创建日期: 2025-12-21

## 🎯 目标
当 RAG 系统和好感度系统上线后，需要将手机系统（Chain/Twesta/OurStream）的消息数据与它们集成。

---

## ✅ 已完成的准备工作

### 消息元数据字段 (RAG 兼容)
所有消息类型现在都包含以下可选字段：

```typescript
timestamp?: number;     // Unix 时间戳
stageType?: 'FRONT' | 'BACK' | 'MIDDLE';  // 拟剧论维度
affectionLevel?: number;  // 当时的好感度
```

- **Chain 私聊**: `stageType: 'BACK'` (后台/真实模式)
- **群组聊天**: `stageType: 'BACK'`
- **Twesta/OurStream**: `stageType: 'FRONT'` (前台/营业模式) - *待开发*

---

## 🔧 待办事项

### 1. 好感度系统上线后
- [ ] 在 `useProactiveScheduler.ts` 中获取真实好感度值
- [ ] 替换 `affectionLevel: 0` 为 `IdolSystem.getAffection(idolId)` 或类似调用
- [ ] 同样更新 `ChainApp.vue` 中用户发送消息的逻辑

### 2. RAG 系统上线后
- [ ] 实现分层检索策略
  - Chain/群组: `filter: { stageType: 'BACK' }`
  - Twesta 评论: `filter: { stageType: 'FRONT' }`
  - 跨模态: 根据上下文动态选择
- [ ] 考虑记忆压缩（长对话生成摘要）
- [ ] 确保新生成的内容正确写入 RAG 数据库

---

## 📁 相关文件
- `手机/composables/useProactiveScheduler.ts` - 主动消息调度器
- `手机/组件/ChainApp.vue` - Chain 应用组件
- `手机/数据/PhoneApiSettings.ts` - 手机 API 设置

---

## 💡 设计参考 (来自 Gemini 建议)

### MemoryFragment 统一结构
```typescript
interface MemoryFragment {
  id: string;
  timestamp: number;
  content: string;
  summary?: string;  // AI 生成的摘要
  source_type: 'CHAIN' | 'TWESTER' | 'STORY' | 'RUN_LOG';
  stage_type: 'FRONT' | 'BACK' | 'MIDDLE';
  related_idol_id: string;
  affection_level_at_time: number;
  tags: string[];
}
```

### 为什么要存当时的好感度？
> 想象一下，你和圆香刚认识时（好感度 1），她在 Chain 里对你很冷淡。
> 一年后（好感度 100），AI 检索记忆时，如果检索到了那条冷淡的消息，
> 它需要知道 **"那是以前不懂事的我"**，而不是 "我现在对你冷淡"。
