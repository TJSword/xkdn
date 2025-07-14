/*
 * @Author: BoLin
 * @Date: 2023-04-02 14:58:39
 * @LastEditors: BoLin
 * @LastEditTime: 2023-04-03 16:56:37
 * @Description: file content
 * @FilePath: \digital-twin-system-framework\src\router\index.ts
 */
import { createWebHashHistory, createRouter } from 'vue-router'

// 路由表
export const constantRoutes = [
  {
    path: '/',
    redirect: '/home'
  },

  {
    path: '/login',
    component: () => import('@/views/login.vue')
  },
  {
    path: '/home',
    component: () => import('@/views/home.vue')
  },
  {
    path: '/all-weather',
    component: () => import('@/views/all-weather.vue')
  }, {
    path: '/long-term',
    component: () => import('@/views/long-term.vue')
  },
  {
    path: '/tools',
    component: () => import('@/views/tools.vue')
  },
  {
    path: '/ledger',
    component: () => import('@/views/ledger.vue')
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/error/404.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes
})

router.beforeEach((to, from, next) => {
  if (to.query.xxl_sso_sessionid) {
    localStorage.setItem('xxl_sso_sessionid', to.query.xxl_sso_sessionid as any)
  }
  next()
})
export default router
