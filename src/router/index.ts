import { createWebHashHistory, createRouter } from 'vue-router'
import { useUserStore } from '@/store/user' // 引入我们刚创建的 user store
import app from '@/lib/cloudbase'
// 路由表
export const constantRoutes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: "login",
    component: () => import('@/views/login.vue')
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/home.vue'),
    meta: { requiresAuth: true } // meta 标记所有需要登录才能访问的页面
  },
  {
    path: '/all-weather',
    component: () => import('@/views/all-weather.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/long-term',
    component: () => import('@/views/long-term.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tools',
    component: () => import('@/views/tools.vue'),
    meta: { requiresAuth: true }
  },
  // {
  //   path: '/ledger',
  //   component: () => import('@/views/ledger.vue'),
  //   meta: { requiresAuth: true }
  // },
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
    path: '/momentum',
    component: () => import('@/views/momentum.vue'),
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
    path: '/market-compass',
    component: () => import('@/views/market-compass.vue'),
    meta: { requiresAuth: true }
  },
  // {
  //   path: '/index-compass',
  //   component: () => import('@/views/index-compass.vue'),
  //   meta: { requiresAuth: true }
  // },
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

// 新增：为非 VIP 用户定义登录后可以访问的页面列表
const nonVipAccessibleRoutes = ['/home', '/all-weather', '/tools', '/wealth-map', '/about']; // 示例列表

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // 1. 使用导入的 app 实例，通过 SDK 获取当前登录状态
  const loginState = await app.auth().getLoginState();
  const isLoggedIn = !!loginState; // 如果 loginState 不为 null，则认为已登录

  if (isLoggedIn) {
    // --- 情况 A：SDK 认为用户已登录 ---

    if (to.path === '/login') {
      // A-1: 如果已登录用户试图访问登录页，直接重定向到首页
      return next({ path: '/' });
    }

    // A-2: 检查 Pinia 中是否已有用户信息，以避免不必要的网络请求
    const hasUserInfo = userStore.userInfo && Object.keys(userStore.userInfo).length > 0;

    if (hasUserInfo) {
      // A-2-a: Pinia 中有用户信息，直接进行权限检查
      checkPermissions(to, userStore, next);
    } else {
      // A-2-b: Pinia 中没有用户信息（通常是刷新页面后），需要通过 API 获取
      try {
        await userStore.fetchUserInfo(); // 这个 action 内部会调用云函数
        // 获取用户信息成功后，进行权限检查
        checkPermissions(to, userStore, next);
      } catch (error) {
        // 获取用户信息失败，这几乎总是意味着 SDK 的本地凭证在服务器端已失效
        console.error('登录凭证已失效，获取用户信息失败:', error);

        // 【关键步骤】清理所有失效的状态
        // 假设你的 userStore.logout() 内部会调用 app.auth().signOut()
        await userStore.logout();

        // 重定向到登录页，并携带原始目标路径
        next({ path: '/login', query: { redirect: to.fullPath } });
      }
    }
  } else {
    // --- 情况 B：SDK 认为用户未登录 ---

    if (whiteList.includes(to.path)) {
      // B-1: 如果要去的是白名单页面（例如登录页），直接放行
      next();
    } else {
      // B-2: 如果要去的是需要权限的页面，则重定向到登录页
      next({ path: '/login', query: { redirect: to.fullPath } });
    }
  }
});

// 权限检查辅助函数 (这个函数不需要改变)
function checkPermissions(to: any, userStore: any, next: any) {
  const isAdminRoute = to.path === '/admin';
  const isVip = userStore.isVip;
  const userInfo = userStore.userInfo;

  // 1. 管理员权限检查 (最高优先级)
  if (isAdminRoute) {
    if (userInfo?.admin === true) {
      next(); // 是管理员，放行
    } else {
      next({ name: 'NotFound' }); // 不是管理员，跳转到 404
    }
    return; // 结束检查
  }

  // 2. VIP 权限检查
  if (isVip) {
    // VIP 用户可以访问所有非管理员页面，直接放行
    next();
  } else {
    // --- 非 VIP 用户的权限检查 ---


    if (nonVipAccessibleRoutes.includes(to.path)) {
      next(); // 目标页面在非VIP可访问列表里，放行
    } else {
      // 试图访问VIP专属页面，跳转到 404
      next({ name: 'NotFound' });
    }
  }
}


export default router