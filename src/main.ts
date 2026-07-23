import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import App from './App.vue'
import { createPinia } from 'pinia'
import { directive } from './utils/directive'
import { router } from './router'
import { i18n } from './i18n'
import 'virtual:svg-icons-register'
import '@/icons/iconfont/iconfont'
import 'element-plus/dist/index.css'
import '@/styles/index.scss'

import 'xe-utils'
import VXETable from 'vxe-table'
import 'vxe-table/lib/style.css'
import VueDOMPurifyHTML from 'vue-dompurify-html' // 解决v-html 的安全隐患

import SvgIcon from '@/components/svg-icon/index.vue'
import FastTableColumn from '@/components/fast-table-column/index.vue'
import FastRadioGroup from '@/components/fast-radio-group/index.vue'
import FastSelect from '@/components/fast-select/index.vue'
import FastUser from '@/components/fast-user/index.vue'
import CodeMirror from '@/components/code-mirror/index.vue'

const app = createApp(App)

//全局组件挂载
app.component("fast-table-column", FastTableColumn)
app.component("fast-radio-group", FastRadioGroup)
app.component("fast-select", FastSelect)
app.component("fast-user", FastUser)
app.component("code-mirror", CodeMirror)
app.component("svg-icon", SvgIcon)

app.use(createPinia())
app.use(router)
app.use(i18n)

directive(app)
app.use(VueDOMPurifyHTML)
app.use(ElementPlus)
app.use(VXETable)
app.mount('#app')
