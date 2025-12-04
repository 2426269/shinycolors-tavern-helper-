import './index.scss';
import { createApp } from 'vue';
import App from './app.vue';

$(() => {
  const app = createApp(App);
  app.mount('#app');

  console.log('新手欢迎页面加载完成');
});

$(window).on('pagehide', () => {
  console.log('新手欢迎页面卸载');
});








