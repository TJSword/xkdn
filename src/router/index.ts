import { createWebHashHistory, createRouter } from 'vue-router'
import { useUserStore } from '@/store/user' // 引入我们刚创建的 user store
import app from '@/lib/cloudbase'
import { applyRouteSeo } from '@/utils/seo'
// 路由表
export const constantRoutes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: "login",
    component: () => import('@/views/login.vue'),
    meta: {
      title: '登录',
      description: '登录想亏都难，访问投资策略看板、组合分析、通知设置和会员专属工具。'
    }
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/home.vue'),
    meta: {
      requiresAuth: true,
      title: '首页',
      description: '想亏都难首页汇总市场温度、策略实时走势、全天候策略、可转债策略、含权策略、动量策略和微盘股策略入口。'
    } // meta 标记所有需要登录才能访问的页面
  },
  {
    path: '/all-weather',
    component: () => import('@/views/all-weather.vue'),
    meta: {
      requiresAuth: true,
      title: '全天候策略',
      description: '查看全天候资产配置策略收益走势、月度年度收益、回撤指标和 ETF 配置比例，观察多资产组合的长期表现。'
    }
  },
  // {
  //   path: '/long-term',
  //   component: () => import('@/views/long-term.vue'),
  //   meta: { requiresAuth: true }
  // },
  {
    path: '/tools',
    component: () => import('@/views/tools.vue'),
    meta: {
      requiresAuth: true,
      title: '投资小工具',
      description: '提供组合再平衡、复利计算、资产消耗和定投模拟等投资工具，辅助资产配置和长期规划。'
    }
  },
  {
    path: '/bonds',
    component: () => import('@/views/bonds.vue'),
    meta: {
      requiresAuth: true,
      title: '可转债策略',
      description: '查看可转债策略净值走势、持仓轮动、收益统计和风险指标，跟踪可转债多因子策略表现。'
    }
  },
  {
    path: '/micro-cap',
    component: () => import('@/views/micro-cap.vue'),
    meta: {
      requiresAuth: true,
      title: '微盘股策略',
      description: '查看微盘股策略收益曲线、月度年度收益、回撤表现和调仓信息，跟踪小市值组合运行状态。'
    }
  },
  {
    path: '/momentum',
    component: () => import('@/views/momentum.vue'),
    meta: {
      requiresAuth: true,
      title: '动量策略',
      description: '查看动量策略收益走势、轮动资产表现、月度年度收益和风险指标，观察强势资产轮动效果。'
    }
  },
  {
    path: '/lof',
    component: () => import('@/views/lof.vue'),
    meta: {
      requiresAuth: true,
      title: 'LOF 溢价监控',
      description: '实时监控 LOF 基金场内价格、估算净值、折溢价率、成交额和申购状态，发现潜在套利与风险信号。'
    }
  },
  {
    path: '/rights-strategy',
    component: () => import('@/views/rights-strategy.vue'),
    meta: {
      requiresAuth: true,
      title: '含权策略',
      description: '查看含权策略收益走势、轮动逻辑、月度年度收益和风险指标，跟踪正股配债价值相关机会。'
    }
  },
  {
    path: '/wealth-map',
    component: () => import('@/views/wealth-map.vue'),
    meta: {
      requiresAuth: true,
      title: '财富版图',
      description: '用地图方式记录资产目标和进度，将财富积累过程可视化，帮助用户更直观地管理长期资产计划。'
    }
  },
  {
    path: '/about',
    component: () => import('@/views/about.vue'),
    meta: {
      requiresAuth: true,
      title: '关于本站',
      description: '了解想亏都难的建站初衷、投资工具、策略服务、会员权益、开发者信息和联系方式。'
    }
  },
  {
    path: '/portfolio-analysis',
    component: () => import('@/views/portfolio-analysis.vue'),
    meta: {
      requiresAuth: true,
      title: '组合实验室',
      description: '自定义策略组合比例，回测组合收益、波动、回撤、相关性和年度表现，辅助构建多策略资产配置。'
    }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin.vue'),
    meta: {
      requiresAuth: true,
      title: '用户管理',
      description: '管理员页面，用于管理会员状态、用户备注、通知渠道和策略通知设置。'
    }
  },
  {
    path: '/mc',
    component: () => import('@/views/mc.vue'),
    meta: {
      requiresAuth: true,
      title: '微盘股调仓',
      description: '查看微盘股调仓计划、持仓明细、市值分布和每日资金再平衡建议。'
    }
  },
  {
    path: '/cb',
    component: () => import('@/views/cb.vue'),
    meta: {
      requiresAuth: true,
      title: '惊蛰策略调仓',
      description: '查看惊蛰策略调仓建议、核心持仓、份数计算和每日资金再平衡信息。'
    }
  }, {
    path: '/zb',
    component: () => import('@/views/zb.vue'),
    meta: {
      requiresAuth: true,
      title: '策略中枢',
      description: '聚合展示多策略实时状态、仓位分布、市场环境雷达和系统运行日志。'
    }
  },
  // 404页面必须放在最后
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: {
      title: '页面未找到',
      description: '所访问的页面不存在、已移动或已删除，请返回想亏都难首页继续浏览。'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: constantRoutes
})

// 定义一个不需要登录就能访问的“白名单”
const whiteList = ['/login']

// 新增：为非 VIP 用户定义登录后可以访问的页面列表
const nonVipAccessibleRoutes = [
  '/home',
  '/all-weather',
  '/tools',
  '/wealth-map',
  '/about',
  '/bonds',
  '/rights-strategy',
  '/micro-cap',
  '/momentum',
  '/lof',
  '/portfolio-analysis'
]; // 示例列表

const adminRoutes = ['/admin', '/mc', '/cb'];

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
// 权限检查辅助函数
function checkPermissions(to: any, userStore: any, next: any) {
  // const isAdminRoute = ... (保持不变)
  const isAdminRoute = adminRoutes.includes(to.path);
  const isVip = userStore.isVip;
  const userInfo = userStore.userInfo;

  // 1. 管理员权限检查 (保持不变)
  if (isAdminRoute) {
    if (userInfo?.admin === true) {
      next();
    } else {
      // 这里触发跳转到 NotFound，会再次进入这个函数，所以下面必须放行 NotFound
      next({ name: 'NotFound' });
    }
    return;
  }

  // 2. VIP 权限检查 (保持不变)
  if (isVip) {
    next();
  } else {
    // --- 非 VIP 用户的权限检查 ---

    // 【修改点在这里】
    // 逻辑：如果是白名单页面，或者 目标页面本身就是 404 页面，则放行
    if (nonVipAccessibleRoutes.includes(to.path) || to.name === 'NotFound') {
      next();
    } else {
      // 否则跳转到 404
      next({ name: 'NotFound' });
    }
  }
}

router.afterEach(to => {
  applyRouteSeo(to.meta)
})

export default router
