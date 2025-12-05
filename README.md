# 🌟 ShinyColors Tavern Helper

**学园偶像大师：闪耀色彩** 的 SillyTavern 酒馆助手前端界面

## 📖 项目介绍

这是一个为 SillyTavern 酒馆助手开发的《学园偶像大师：闪耀色彩》(学マス/Gakuen Idolmaster) 主题前端界面，提供：

- 🎴 **偶像图鉴** - 浏览所有偶像角色和卡面
- 🃏 **AI技能卡生成** - 基于卡面图片和推荐流派生成游戏风格的技能卡
- 🎭 **Spine动画播放** - 查看角色的 Spine 动画
- 📚 **世界书管理** - 管理角色设定和游戏知识

## ✨ 主要功能

### 多模态AI生成
- 支持发送卡面图片（未觉醒+觉醒）给AI，让AI根据视觉风格设计技能卡
- 自动提取推荐流派信息，引导AI生成符合游戏机制的技能

### 数据集成
- 完整的角色卡面库
- 游戏机制和培育计划数据
- 技能卡示例数据库

## 🚀 使用方法

### 在 SillyTavern 中使用

通过 jsdelivr CDN 加载界面：

```html
<body>
  <script>
    $('body').load('https://testingcf.jsdelivr.net/gh/2426269/shinycolors-tavern-helper-/dist/偶像大师闪耀色彩-重构/界面/主页.vue/index.html')
  </script>
</body>
```

### 本地开发

```bash
# 安装依赖
pnpm install

# 开发模式构建
pnpm run build:dev

# 生产模式构建
pnpm run build:prod
```

## 📁 项目结构

```
src/
└── 偶像大师闪耀色彩-重构/
    ├── 界面/           # Vue 页面组件
    ├── 组件/           # 通用组件
    ├── 图鉴/           # 偶像图鉴功能
    ├── 世界书管理/     # AI生成助手、思维链等
    └── 数据/           # 角色和卡面数据
```

## 🔧 基于模板

本项目基于 [tavern_helper_template](https://github.com/StageDog/tavern_helper_template) 模板创建。

## 📄 许可证

[Aladdin](LICENSE)
