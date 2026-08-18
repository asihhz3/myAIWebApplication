import 'viewerjs/dist/viewer.css'
import '@/assets/design.css'
import { createApp } from 'vue'

import App from './App.vue'
import router from './core/util/router'

const app = createApp(App)
app.use(router).mount('#app')

