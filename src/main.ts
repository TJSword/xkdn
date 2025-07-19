/*
 * @LastEditors: BoLin
 * @Date: 2023-03-16 11:25:46
 * @LastEditTime: 2023-05-16 14:18:43
 * @FilePath: \digital-twin-system-framework\src\main.ts
 * @Description:
 */

import { createApp } from 'vue'
import type { App } from 'vue'
import APP from './App.vue'

import './style/common.scss'
import router from './router'
import { install } from '@/components/loading'
import { initEcharts } from '@/plugins/echarts'
import 'element-plus/theme-chalk/el-message.css'
import { createPinia } from 'pinia'
const bootstrap = (app: App) => {
  install(app)
  initEcharts(app)
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}

bootstrap(createApp(APP))
