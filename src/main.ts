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
import { useUserStore } from '@/store/user'
import {
  initializeAuthSession,
  subscribeAuthSession
} from '@/services/authSession'
import 'mapbox-gl/dist/mapbox-gl.css';
const bootstrap = async (app: App) => {
  install(app)
  initEcharts(app)
  const pinia = createPinia()
  app.use(pinia)
  const userStore = useUserStore(pinia)

  subscribeAuthSession(async event => {
    if (event.type === 'sign_in') {
      userStore.markAuthSessionAvailable()
      return
    }

    if (event.type === 'initial') {
      if (!event.loginState) userStore.clearLocalUser()
      return
    }

    if (event.type === 'sign_out') {
      userStore.clearLocalUser()
      if (router.currentRoute.value.path !== '/login') {
        await router.replace({
          path: '/login',
          query: { redirect: router.currentRoute.value.fullPath }
        })
      }
      return
    }

  })

  try {
    await initializeAuthSession()
  } catch (error) {
    console.error('初始化 CloudBase 登录态失败:', error)
  }

  app.use(router)
  app.mount('#app')
}

void bootstrap(createApp(APP))
