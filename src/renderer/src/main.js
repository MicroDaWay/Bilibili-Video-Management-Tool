import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './routes'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'dayjs/locale/zh-cn'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/message/style/css'

const app = createApp(App)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})
app.mount('#app')
