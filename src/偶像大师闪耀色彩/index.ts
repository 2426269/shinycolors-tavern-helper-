import { createApp } from 'vue';
import app from './app.vue';

// 导入 FontAwesome
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
document.head.appendChild(link);

$(() => {
  createApp(app).mount('#app');
});
