import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import permissionPlugin from './plugins/permission'

// 样式导入
import './styles/main.css'

// 创建应用实例
const app = createApp(App)

// 安装插件
app.use(createPinia())
app.use(router)
app.use(permissionPlugin)

// 挂载应用
app.mount('#app')
