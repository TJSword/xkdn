import { createWebHashHistory, createRouter } from 'vue-router'
import { useUserStore } from '@/store/user' // 引入我们刚创建的 user store



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
    name: 'home',
    component: () => import('@/views/home.vue'),
    meta: { requiresAuth: true } // 使用 meta 标记需要 VIP 权限的页面
  },
  {
    path: '/all-weather',
    component: () => import('@/views/all-weather.vue'),
    meta: { requiresAuth: true }
  }, {
    path: '/long-term',
    component: () => import('@/views/long-term.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tools',
    component: () => import('@/views/tools.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ledger',
    component: () => import('@/views/ledger.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/bonds',
    component: () => import('@/views/bonds.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/micro-cap',
    component: () => import('@/views/micro-cap.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wealth-map',
    component: () => import('@/views/wealth-map.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cash-flow',
    component: () => import('@/views/cash-flow.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/about',
    component: () => import('@/views/about.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin.vue'),
    meta: { requiresAuth: true }
  },
  // 404页面必须放在最后
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes
})

// 定义一个不需要登录就能访问的“白名单”
const whiteList = ['/login']

router.beforeEach(async (to, from, next) => {
  // 从 Pinia store 获取 user store 实例
  const userStore: any = useUserStore()

  // 1. 首次进入或刷新页面时，尝试获取用户信息
  // userStore.fetchUserInfo() 这个 action 内部有逻辑防止重复请求
  await userStore.fetchUserInfo()
  // 优先处理 /admin 页面
  if (to.path === '/admin') {
    if (userStore.userInfo?.admin === true) {
      // 是管理员，放行
      next()
    } else {
      next({ name: 'NotFound' })
    }
    return
  }


  // 2. 从 store 的 getter 中获取 VIP 状态
  const isVip = userStore.isVip

  if (isVip) {
    // 如果用户是 VIP
    if (to.path === '/login') {
      // 如果 VIP 用户试图访问登录页，则重定向到首页
      next({ path: '/home' })
    } else {
      // 否则，正常放行
      next()
    }
  } else {

    // 检查目标页面是否在白名单中
    if (whiteList.includes(to.path)) {
      // 在白名单中，直接放行
      next()
    } else {
      // 不在白名单中，说明是受保护页面，重定向到登录页
      next({ path: '/login', query: { redirect: to.fullPath } }) // 可选：带上原路径，方便登录后跳回
    }
  }
})

export default router