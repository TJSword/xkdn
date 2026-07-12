import { createWebHashHistory, createRouter } from 'vue-router'
import { useUserStore } from '@/store/user' // 引入我们刚创建的 user store
import {
  getAuthSession,
  getAuthSessionUid,
  initializeAuthSession
} from '@/services/authSession'
import { AuthExpiredError } from '@/services/authExpired'
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
      description: '登录何以有数，访问投资策略看板、组合分析、通知设置和会员专属工具。'
    }
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/home.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '首页',
      description: '何以有数首页汇总市场温度、策略实时走势、全天候策略、可转债策略、含权策略、动量策略和微盘股策略入口。'
    } // meta 标记所有需要登录才能访问的页面
  },
  {
    path: '/all-weather',
    component: () => import('@/views/all-weather.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '全天候策略',
      description: '查看全天候资产配置策略收益走势、月度年度收益、回撤指标和 ETF 配置比例，观察多资产组合的长期表现。'
    }
  },
  {
    path: '/tools',
    component: () => import('@/views/tools.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '投资小工具',
      description: '提供组合再平衡、复利计算、资产消耗和定投模拟等投资工具，辅助资产配置和长期规划。'
    }
  },
  {
    path: '/bonds',
    component: () => import('@/views/bonds.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '可转债策略',
      description: '查看可转债策略净值走势、持仓轮动、收益统计和风险指标，跟踪可转债多因子策略表现。'
    }
  },
  {
    path: '/bond-market',
    component: () => import('@/views/bond-market.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '转债全景',
      description: '用价格分层、市场广度、估值位置和成交热度观察可转债市场状态。'
    }
  },
  {
    path: '/micro-cap',
    component: () => import('@/views/micro-cap.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '微盘股策略',
      description: '查看微盘股策略收益曲线、月度年度收益、回撤表现和调仓信息，跟踪小市值组合运行状态。'
    }
  },
  {
    path: '/momentum',
    component: () => import('@/views/momentum.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '动量策略',
      description: '查看动量策略收益走势、轮动资产表现、月度年度收益和风险指标，观察强势资产轮动效果。'
    }
  },
  {
    path: '/lof',
    component: () => import('@/views/lof.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: 'LOF 溢价监控',
      description: '实时监控 LOF 基金场内价格、估算净值、折溢价率、成交额和申购状态，发现潜在套利与风险信号。'
    }
  },
  {
    path: '/rights-strategy',
    component: () => import('@/views/rights-strategy.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '含权策略',
      description: '查看含权策略收益走势、轮动逻辑、月度年度收益和风险指标，跟踪正股配债价值相关机会。'
    }
  },
  {
    path: '/wealth-map',
    component: () => import('@/views/wealth-map.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '财富版图',
      description: '用地图方式记录资产目标和进度，将财富积累过程可视化，帮助用户更直观地管理长期资产计划。'
    }
  },
  {
    path: '/investment-ledger',
    component: () => import('@/views/investment-ledger.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '投资账本',
      description: '记录策略期末金额，分析资产占比、目标偏移、组合回撤、创新高状态与风险收益特征。'
    }
  },
  {
    path: '/about',
    component: () => import('@/views/about.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '关于本站',
      description: '了解何以有数的建站初衷、投资工具、策略服务、会员权益、开发者信息和联系方式。'
    }
  },
  {
    path: '/portfolio-analysis',
    component: () => import('@/views/portfolio-analysis.vue'),
    meta: {
      requiresAuth: true,
      capability: 'app:read',
      title: '组合实验室',
      description: '自定义策略组合比例，回测组合收益、波动、回撤、相关性和年度表现，辅助构建多策略资产配置。'
    }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin.vue'),
    meta: {
      requiresAuth: true,
      capability: 'admin:manage',
      title: '管理中心',
      description: '管理员页面，用于管理会员、通知配置、数据源授权和策略刷新。'
    }
  },
  {
    path: '/permission-unavailable',
    name: 'PermissionUnavailable',
    component: () => import('@/views/permission-unavailable.vue'),
    meta: {
      title: '权限暂时无法确认',
      description: '权限资料暂时无法同步，请在网络恢复后重试。'
    }
  },
  // 404页面必须放在最后
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: {
      title: '页面未找到',
      description: '所访问的页面不存在、已移动或已删除，请返回何以有数首页继续浏览。'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: constantRoutes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  try {
    await initializeAuthSession();
  } catch (error) {
    console.error('读取 CloudBase 登录态失败:', error);
  }
  const loginState = getAuthSession();
  const isLoggedIn = !!loginState;
  const requiresAuth = to.meta.requiresAuth === true;

  if (!requiresAuth) {
    if (to.path === '/login' && isLoggedIn) return next({ path: '/' });
    return next();
  }

  if (!isLoggedIn) {
    userStore.clearLocalUser();
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  const sessionUid = getAuthSessionUid();
  const hasCurrentCapabilities = Array.isArray(userStore.userInfo?.capabilities);
  const hasCurrentUserInfo =
    userStore.userInfo &&
    sessionUid &&
    String(userStore.userInfo.uid || '') === sessionUid &&
    userStore.isUserInfoFresh &&
    hasCurrentCapabilities;

  if (!userStore.hasSyncedInCurrentApp || !hasCurrentUserInfo) {
    try {
      if (!userStore.hasSyncedInCurrentApp || !hasCurrentCapabilities) {
        await userStore.refreshUserInfo();
      } else {
        await userStore.fetchUserInfo();
      }
    } catch (error) {
      if (error instanceof AuthExpiredError) {
        // handleAuthExpired 已统一清理登录态并跳转；中止当前导航以避免重复跳转。
        return next(false);
      }

      console.error('用户资料暂时无法同步，保留当前登录态:', error);
      return next({ name: 'PermissionUnavailable', query: { redirect: to.fullPath } });
    }
  }

  return checkCapability(to, userStore, next);
});

function checkCapability(to: any, userStore: any, next: any) {
  if (to.name === 'NotFound') {
    next();
    return;
  }

  const capability = to.meta.capability;
  if (!capability || hasCapability(userStore.userInfo?.capabilities, capability)) {
    next();
  } else {
    next({ name: 'NotFound' });
  }
}

function hasCapability(capabilities: any, capability: string) {
  const grantedCapabilities = Array.isArray(capabilities)
    ? capabilities
    : [];

  return grantedCapabilities.includes(capability);
}

router.afterEach(to => {
  applyRouteSeo(to.meta)
})

export default router
