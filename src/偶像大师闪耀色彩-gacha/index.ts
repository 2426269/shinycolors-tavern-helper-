/**
 * 抽卡系统入口文件
 */

import { createApp } from 'vue';
import App from './app.vue';
import './index.scss';

// 在 DOM 加载完成后初始化
$(() => {
  console.log('🎰 抽卡系统初始化...');
  
  // 创建 Vue 应用
  const app = createApp(App);
  
  // 挂载到指定元素
  app.mount('#app');
  
  console.log('✅ 抽卡系统加载完成！');
});

// 页面卸载时
$(window).on('pagehide', () => {
  console.log('👋 抽卡系统卸载');
});


