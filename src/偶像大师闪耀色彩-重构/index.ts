/**
 * 偶像大师闪耀色彩 - 主入口
 *
 * 这是前端界面的入口文件
 */

import $ from 'jquery';
import { createPinia } from 'pinia';
import * as PIXI from 'pixi.js';
import { createApp } from 'vue';
import './样式/全局样式.scss';
import MainPage from './页面/主页.vue';

// 导入 v8-spine37.js 脚本内容
import v8Spine37Script from './v8-spine37.js?raw';

// 🔑 关键修复：在执行 v8-spine37.js 之前，先将 PIXI 设置到 window 上
// v8-spine37.js 依赖 window.PIXI 才能正常工作
(window as any).PIXI = PIXI;
console.log('✅ PIXI 已设置到 window:', (window as any).PIXI);

// 立即执行 v8-spine37.js 脚本
const scriptElement = document.createElement('script');
scriptElement.textContent = v8Spine37Script;
document.head.appendChild(scriptElement);
console.log('✅ v8-spine37.js 脚本已注入');
console.log('✅ PIXI.Spine37:', (window as any).PIXI?.Spine37);

// 等待DOM加载完成
$(() => {
  // 创建Vue应用
  const app = createApp(MainPage);

  // 使用Pinia状态管理
  const pinia = createPinia();
  app.use(pinia);

  // 挂载应用
  app.mount('#app');

  console.log('✨ 偶像大师闪耀色彩加载成功！');
});

// 监听页面卸载
$(window).on('pagehide', () => {
  console.log('👋 偶像大师闪耀色彩卸载');
});
