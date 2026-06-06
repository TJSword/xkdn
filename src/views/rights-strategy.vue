<template>
  <div class="page-wrapper">
    <main class="main-container">
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <span class="title-icon">🎯</span>
          含权策略
        </h1>
        <p class="subtitle">
          用可转债配售价值重新衡量正股，寻找含权更高、权利更便宜的阶段性机会。
        </p>
      </div>

      <div v-if="isLoading" class="content-card loading-panel">
        <span class="loader"></span>
        <p>正在加载策略资料...</p>
      </div>

      <div v-else class="content-grid">
        <div class="content-card">
          <h2 class="card-title">策略简介</h2>
          <p class="card-description">
            含权策略围绕可转债发行前的正股机会展开，用量化方式寻找单位股价中嵌入更多配债价值的股票。策略以事件驱动和权利价值重估为基础，按照动态含权量对候选标的进行排序，选择排名靠前的 5 只股票等权持有，并在每个交易日检查组合变化。它不押注单一题材，也不依赖主观判断，只有标的到达股权登记日或 Top5 排名发生变化时才执行调仓。
          </p>
        </div>

        <div class="content-card">
          <h2 class="card-title">组合思想</h2>
          <p class="card-description">
            本策略的组合思想，是把“未来可配债权利”视作正股价格里一项会被市场逐步重估的隐含价值：当发债确定性提高后，百元含权量越高的正股，代表单位股票价格里嵌入的转债配售价值越多，也越容易被抢权资金、套利资金和可转债投资者提前关注。因此组合不去预测单只股票的短期涨跌，而是持续在候选池中寻找含权更高、权利更便宜的标的，用 Top5 等权分散个股风险，并通过交易日检查、持仓不变不操作的方式减少无效换手。
          </p>
        </div>

        <div v-if="canViewPremiumContent" class="content-card">
          <div class="card-header-row holdings-header">
            <h2 class="card-title">最新持仓与调仓建议</h2>
            <div class="holdings-actions">
              <div class="system-status">
                <span :class="['status-dot', realtimeStale && realtimeRows.length ? 'stale' : '']"></span>
                <span class="status-text">数据更新: {{ latestPortfolioTimeText }}</span>
              </div>
              <button
                v-if="canForceRefresh"
                class="icon-refresh-button"
                :class="{ spinning: isRealtimeRefreshing }"
                :disabled="isRealtimeRefreshing"
                title="刷新含权策略数据"
                aria-label="刷新含权策略数据"
                @click="loadRealtime(true)"
              >
                ↻
              </button>
            </div>
          </div>
          <p class="card-description">
            {{ latestPortfolioDescription }}
          </p>
          <div v-if="latestPortfolioRows.length" class="table-wrapper">
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>代码</th>
                  <th>名称</th>
                  <th>价格</th>
                  <th>每股配售额</th>
                  <th>动态百元含权量</th>
                  <th>权重</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in latestPortfolioRows" :key="`${row.code}-${row.bondName}`">
                  <td>{{ row.code }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ formatNumber(row.price, 2) }}</td>
                  <td>{{ formatNumber(row.ration, 3) }}</td>
                  <td class="text-red">{{ formatNumber(row.dynamicRights, 2) }}</td>
                  <td>{{ row.weight }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">暂无最新组合数据。</div>
          <template v-if="realtimeRows.length">
            <h3 class="card-subtitle">组合调仓指引</h3>
            <div class="adjustments-grid">
              <div class="adjustment-block">
                <h4 class="adjustment-title sell">↓ 建议调出</h4>
                <ul class="adjustment-list">
                  <li v-for="row in realtimeAdjustments.sells" :key="`sell-${row.stockCode}`" class="adjustment-item">
                    <span class="adjustment-security">
                      {{ row.stockName }} ({{ row.stockCode }})
                      <small>{{ row.reason }}</small>
                    </span>
                    <span class="action-badge sell">调出</span>
                  </li>
                  <li v-if="realtimeAdjustments.sells.length === 0" class="adjustment-item-empty">今日无调出建议</li>
                </ul>
              </div>
              <div class="adjustment-block">
                <h4 class="adjustment-title buy">↑ 建议调入</h4>
                <ul class="adjustment-list">
                  <li v-for="row in realtimeAdjustments.buys" :key="`buy-${row.stockCode}`" class="adjustment-item">
                    <span class="adjustment-security">
                      {{ row.stockName }} ({{ row.stockCode }})
                      <small>{{ row.reason }}</small>
                    </span>
                    <span class="action-badge buy">调入</span>
                  </li>
                  <li v-if="realtimeAdjustments.buys.length === 0" class="adjustment-item-empty">今日无调入建议</li>
                </ul>
              </div>
            </div>
          </template>
        </div>
        <div v-else class="content-card premium-lock-card">
          <div class="premium-lock-icon">🔒</div>
          <h2 class="card-title">最新持仓与调仓建议</h2>
          <p class="card-description">
            最新持仓、动态含权量及调入调出建议属于会员内容，开通后可查看完整操作指引。
          </p>
          <button class="premium-lock-button" @click="router.push('/home')">返回首页开通会员</button>
        </div>

        <div class="content-card">
          <div class="card-header-row">
            <h2 class="card-title">含权策略 vs 沪深300全收益</h2>
            <span class="period-badge">{{ backtestPeriodText }}</span>
          </div>
          <v-chart class="echart-container" :option="navChartOption" autoresize />
          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-label">累计收益</div>
              <div class="stat-value-small highlight">{{ strategyStats.totalReturn }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">年化收益</div>
              <div class="stat-value-small">{{ strategyStats.annualizedReturn }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">波动率</div>
              <div class="stat-value-small">{{ strategyStats.volatility }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">夏普比率</div>
              <div class="stat-value-small">{{ strategyStats.sharpe }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最大回撤</div>
              <div class="stat-value-small negative">{{ strategyStats.maxDrawdown }}%</div>
            </div>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">策略月度/年度收益表</h2>
          <div class="table-container heatmap-container">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th>年份</th>
                  <th v-for="month in monthLabels" :key="month">{{ month }}</th>
                  <th>年度</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in monthlyRows" :key="row.year">
                  <td class="year-col">{{ row.year }}</td>
                  <td v-for="(month, index) in monthLabels" :key="month" :style="getHeatmapStyle(row.months[index])" class="cell-val">
                    {{ row.months[index] ? `${row.months[index]}%` : '' }}
                  </td>
                  <td :style="getHeatmapStyle(row.total)" class="year-total">{{ row.total }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">深度风险分析</h2>

          <div class="risk-summary-grid">
            <div class="risk-box">
              <div class="risk-label">卡玛比率 (Calmar)</div>
              <div class="risk-main-val">{{ strategyStats.calmar }}</div>
              <div class="risk-sub-val">年化收益 / 最大回撤</div>
            </div>
            <div class="risk-box">
              <div class="risk-label">盈利 / 总月份</div>
              <div class="risk-main-val">{{ monthlySummary.profitableMonths }} / {{ monthlySummary.totalMonths }}</div>
              <div class="risk-sub-val">月度胜率: {{ monthlySummary.winRate }}%</div>
            </div>
            <div class="risk-box">
              <div class="risk-label">索提诺比率</div>
              <div class="risk-main-val">{{ sortinoRatio }}</div>
              <div class="risk-sub-val">衡量策略的下行风险调整收益</div>
            </div>
          </div>

          <h3 class="risk-sub-title">回撤深度分布（频率统计）</h3>
          <div class="table-container dist-table-container">
            <div class="dist-table-inner">
              <div class="dist-header-row">
                <div v-for="item in drawdownDistribution" :key="item.range" class="dist-col">{{ item.range }}</div>
              </div>
              <div class="dist-bar-row">
                <div v-for="item in drawdownDistribution" :key="item.range" class="dist-col">
                  <div class="dist-block rights-theme" :style="{ opacity: item.count > 0 ? 1 : 0.6 }">
                    {{ item.count }}
                  </div>
                </div>
              </div>
              <div class="dist-label-row">
                <div class="dist-col">次数</div>
              </div>
            </div>
          </div>

          <h3 class="risk-sub-title risk-detail-title">历史重大回撤明细 (Top 10)</h3>
          <div class="table-container">
            <table class="risk-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>开始日期</th>
                  <th>谷底日期</th>
                  <th>修复日期</th>
                  <th>最大回撤</th>
                  <th>回撤期(天)</th>
                  <th>修复期(天)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in drawdownRows" :key="`${row.startDate}-${row.troughDate}`">
                  <td>{{ index + 1 }}</td>
                  <td>{{ row.startDate }}</td>
                  <td>{{ row.troughDate }}</td>
                  <td>{{ row.endDate }}</td>
                  <td class="negative">{{ row.drawdown }}%</td>
                  <td>{{ row.ddDays }}</td>
                  <td>{{ row.fixDays }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">常见问题 (FAQ)</h2>
          <div class="faq-container">
            <div v-for="(item, index) in faqList" :key="item.question" class="faq-item">
              <button class="faq-question" @click="toggleFaq(index)">
                <span>{{ item.question }}</span>
                <span :class="['faq-icon', { 'is-open': openFaqIndex === index }]">+</span>
              </button>
              <div v-if="openFaqIndex === index" class="faq-answer">
                <p>{{ item.answer }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { computed, inject, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import app from '@/lib/cloudbase'
  import { useUserStore } from '@/store/user'
  import {
      calculateDrawdownAnalysis,
      calculateMonthlyReturns,
      calculateMonthlySummary,
      calculateSortinoRatio,
      calculateStats,
      formatBacktestPeriod,
      prepareStrategySeries
  } from '@/utils/strategyMetrics'
  import type {
      DrawdownDistributionItem,
      DrawdownEvent,
      MonthlyReturnRow,
      MonthlySummary,
      StrategyStats
  } from '@/utils/strategyMetrics'

  interface RightsStrategyData {
      dateList: string[]
      strategyData: number[]
      hs300?: number[]
  }

  interface RealtimeRow {
      stockCode: string
      stockName: string
      bondCode: string
      bondName: string
      progress: string
      progressDate: string
      recordDate: string
      latestPrice: number | null
      totalShares: number | null
      ration: number | null
      dynamicRights: number | null
      weight?: number
      reason?: string
  }

  interface RealtimeAdjustments {
      buys: RealtimeRow[]
      sells: RealtimeRow[]
      unchanged: RealtimeRow[]
  }

  interface PortfolioDisplayRow {
      code: string
      name: string
      bondName: string
      price: number | string | null
      ration: number | string | null
      dynamicRights: number | string | null
      weight: string
  }

  const router = useRouter()
  const userStore: any = useUserStore()
  const showMessage: any = inject('showMessage')

  const isLoading = ref(true)
  const strategyData = ref<RightsStrategyData>({ dateList: [], strategyData: [], hs300: [] })
  const strategySeries = ref({ dates: [] as string[], values: [] as number[] })
  const strategyStats = ref<StrategyStats>({
      totalReturn: '0.00',
      annualizedReturn: '0.00',
      volatility: '0.00',
      sharpe: '0.000',
      maxDrawdown: '0.00',
      calmar: '0.000'
  })
  const monthlyRows = ref<MonthlyReturnRow[]>([])
  const drawdownRows = ref<DrawdownEvent[]>([])
  const drawdownDistribution = ref<DrawdownDistributionItem[]>([])
  const monthlySummary = ref<MonthlySummary>({
      profitableMonths: 0,
      totalMonths: 0,
      winRate: '0.0'
  })
  const sortinoRatio = ref('0.000')

  const realtimeRows = ref<RealtimeRow[]>([])
  const realtimeUpdatedAt = ref('')
  const realtimeTradeDate = ref('')
  const realtimePreviousTradeDate = ref('')
  const realtimeChanged = ref(false)
  const realtimeAdjustments = ref<RealtimeAdjustments>({ buys: [], sells: [], unchanged: [] })
  const isRealtimeRefreshing = ref(false)
  const openFaqIndex = ref<number | null>(0)

  const canViewPremiumContent = computed(() => userStore.isVip || userStore.userInfo?.admin === true)
  const canForceRefresh = computed(() => userStore.userInfo?.admin === true)
  const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const staticLatestDate = '2026-06-04'
  const staticLatestHoldings = [
      { code: '603339', name: '四方科技', bondName: '', price: 13.29, ration: '', dynamicRights: 24.88, weight: '20.00%' },
      { code: '600456', name: '宝钛股份', bondName: '', price: 31.07, ration: '', dynamicRights: 23.49, weight: '20.00%' },
      { code: '000422', name: '湖北宜化', bondName: '', price: 13.31, ration: '', dynamicRights: 22.93, weight: '20.00%' },
      { code: '603809', name: '豪能股份', bondName: '', price: 9.99, ration: '', dynamicRights: 19.14, weight: '20.00%' },
      { code: '300815', name: '玉禾田', bondName: '', price: 19.5, ration: '', dynamicRights: 19.1, weight: '20.00%' }
  ]
  const faqList = [
      {
          question: '如何参与该策略？最低资金门槛是多少？',
          answer: '策略持仓可能包含创业板和科创板个股，因此参与者需要开通相应交易权限。历史回测中部分股票单价较高，考虑 Top5 等权配置和整手交易，理论上的最低资金门槛约为 10 万元。常规情况下，只需在每周四下午 2:40 确认信号并按建议调仓；但系统也会在每个交易日检查持仓是否到达股权登记日，因此其他交易日偶尔也可能产生临时调仓信号。请务必留意这类提示。'
      },
      {
          question: '该策略的核心思想是什么？',
          answer: '策略的主要收益来源，是事件窗口与发行确定性提升后的价值重估：在市场预期充分兑现之前提前布局，捕捉未来配债权利被重新定价的过程。同时，动态含权量会在股价下跌时自然上升，使组合更倾向于选择权利价值相对便宜的标的，形成一定的低买高卖和价值再平衡效果。通常能够推进到这一发行阶段的公司也经过了较多审核，基本面质量一般不会太差。'
      },
      {
          question: '为什么用动态含权量排序？',
          answer: '动态含权量会随股价变化而变化，可以在统一尺度下比较不同正股中嵌入的转债配售价值。其核心公式为：动态百元含权量 =（可转债发行规模 ÷ 正股总市值）× 100。其他条件不变时，股价下跌会使总市值下降、含权量上升，排序因此会更偏向配债权利相对便宜的标的。'
      }
  ]

  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }

  const navChartOption = computed(() => {
      const dates = strategyData.value.dateList || []
      return {
          color: ['#ef4444', '#64748b'],
          tooltip: { trigger: 'axis', valueFormatter: (value: number) => formatNumber(value, 2) },
          legend: { top: 0, textStyle: { color: '#d8e4f2' } },
          grid: { left: 56, right: 24, top: 46, bottom: 34 },
          xAxis: {
              type: 'category',
              data: dates,
              boundaryGap: false,
              axisLine: { lineStyle: { color: '#52677d' } },
              axisLabel: { color: '#b0c4de' }
          },
          yAxis: {
              type: 'value',
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
              axisLabel: { color: '#b0c4de' },
              scale: true
          },
          series: [
              lineSeries('含权策略', strategyData.value.strategyData || []),
              lineSeries('沪深300全收益', strategyData.value.hs300 || [])
          ]
      }
  })

  const realtimeStale = computed(() => {
      if (!realtimeUpdatedAt.value) return true
      return Date.now() - new Date(realtimeUpdatedAt.value).getTime() > 8 * 24 * 60 * 60 * 1000
  })

  const realtimeStatusText = computed(() => {
      if (!realtimeUpdatedAt.value) return '未初始化'
      const text = new Date(realtimeUpdatedAt.value).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
      })
      return `${text}${realtimeStale.value ? ' · 可能过期' : ''}`
  })

  const backtestPeriodText = computed(() => {
      return formatBacktestPeriod(strategySeries.value.dates)
  })

  const latestPortfolioTimeText = computed(() => {
      if (realtimeRows.value.length) return realtimeStatusText.value
      return `回测更新 ${staticLatestDate}`
  })

  const latestPortfolioDescription = computed(() => {
      if (realtimeRows.value.length) {
          const comparison = realtimePreviousTradeDate.value
              ? `${realtimePreviousTradeDate.value} 与 ${realtimeTradeDate.value}`
              : realtimeTradeDate.value
          return realtimeChanged.value
              ? `根据 ${comparison} 的持仓变化生成调仓建议，按最新动态含权量维持 Top5 等权组合。`
              : `${realtimeTradeDate.value} 的最新持仓与上一交易日一致，本次无需调仓。`
      }
      return '实时快照未初始化时，先展示回测口径的最新 Top5 组合。'
  })

  const latestPortfolioRows = computed<PortfolioDisplayRow[]>(() => {
      if (realtimeRows.value.length) {
          return realtimeRows.value.slice(0, 5).map(row => ({
              code: row.stockCode,
              name: row.stockName,
              bondName: row.bondName,
              price: row.latestPrice,
              ration: row.ration,
              dynamicRights: row.dynamicRights,
              weight: `${((row.weight || 0.2) * 100).toFixed(2)}%`
          }))
      }

      return staticLatestHoldings
  })

  function lineSeries(name: string, data: Array<number | null>) {
      return {
          name,
          type: 'line',
          data,
          symbol: 'none',
          smooth: false,
          lineStyle: { width: name === '策略' ? 3 : 1.8 }
      }
  }

  async function loadStaticData() {
      const response = await fetch(`${import.meta.env.BASE_URL || '/'}static/rightsStrategyData.json`)
      if (!response.ok) throw new Error('rightsStrategyData.json 加载失败')
      const data = await response.json()
      const series = prepareStrategySeries(data.dateList, data.strategyData)
      const drawdownAnalysis = calculateDrawdownAnalysis(series.values, series.dates)

      strategyData.value = data
      strategySeries.value = series
      strategyStats.value = calculateStats(series.values)
      monthlyRows.value = calculateMonthlyReturns(series.values, series.dates)
      monthlySummary.value = calculateMonthlySummary(monthlyRows.value)
      sortinoRatio.value = calculateSortinoRatio(series.values)
      drawdownRows.value = drawdownAnalysis.drawdowns.slice(0, 10)
      drawdownDistribution.value = drawdownAnalysis.distribution
  }

  async function loadRealtime(forceRefresh = false) {
      if (!canViewPremiumContent.value) return
      if (forceRefresh) isRealtimeRefreshing.value = true
      try {
          const res: any = await app.callFunction({
              name: 'getRightsStrategyData',
              data: forceRefresh ? { forceRefresh: true } : {},
              parse: true
          })
          const result = res.result || {}
          const data = result.data || {}
          realtimeRows.value = Array.isArray(data.portfolio) ? data.portfolio : Array.isArray(data.rows) ? data.rows : []
          realtimeTradeDate.value = data.tradeDate || ''
          realtimePreviousTradeDate.value = data.previousTradeDate || ''
          realtimeChanged.value = data.changed === true
          realtimeAdjustments.value = {
              buys: Array.isArray(data.adjustments?.buys) ? data.adjustments.buys : [],
              sells: Array.isArray(data.adjustments?.sells) ? data.adjustments.sells : [],
              unchanged: Array.isArray(data.adjustments?.unchanged) ? data.adjustments.unchanged : []
          }
          realtimeUpdatedAt.value = data.refreshedAt || ''
          if (forceRefresh) {
              const resultText = String(result.message || '数据刷新完成').replace(/[。；;，,\s]+$/g, '')
              showMessage?.(`数据已更新，${resultText}`, result.success ? 'success' : 'error')
          }
      } catch (error: any) {
          if (forceRefresh) {
              showMessage?.(error.message || '实时含权数据刷新失败', 'error')
          }
      } finally {
          isRealtimeRefreshing.value = false
      }
  }

  function toNumber(value: unknown) {
      if (value === null || value === undefined || value === '') return null
      const number = Number(value)
      return Number.isFinite(number) ? number : null
  }

  function formatNumber(value: unknown, digits = 2) {
      const number = toNumber(value)
      return number === null ? '--' : number.toFixed(digits)
  }

  function formatPercent(value: unknown) {
      const number = toNumber(value)
      if (number === null) return '--'
      return `${number > 0 ? '+' : ''}${(number * 100).toFixed(2)}%`
  }

  function getHeatmapStyle(value: unknown) {
      const number = toNumber(value)
      if (number === null) return {}
      if (number === 0) return { backgroundColor: 'transparent' }

      const opacity = Math.min(Math.abs(number) / 8, 1)
      return {
          backgroundColor:
              number > 0
                  ? `rgba(217, 83, 79, ${0.15 + opacity * 0.7})`
                  : `rgba(92, 184, 92, ${0.15 + opacity * 0.7})`,
          color: '#fff',
          fontWeight: Math.abs(number) > 5 ? '700' : '400'
      }
  }

  onMounted(async () => {
      try {
          await loadStaticData()
      } finally {
          isLoading.value = false
      }
      if (canViewPremiumContent.value) loadRealtime()
  })
</script>

<style scoped lang="scss">
  .page-wrapper {
      --rights-theme: #ef4444;
      --rights-theme-soft: rgb(239 68 68 / 12%);
      --rights-theme-border: rgb(239 68 68 / 35%);
      --rights-theme-hover: rgb(239 68 68 / 50%);
      --rights-accent: #f59e0b;

      padding: 3rem 1rem 4rem;
      min-height: 100vh;
      font-family: 'Noto Sans SC', sans-serif;
      color: #fff;
      background: radial-gradient(circle at 15% 20%, rgb(239 68 68 / 14%), transparent 32%),
          radial-gradient(circle at 82% 18%, rgb(245 158 11 / 10%), transparent 30%), #121212;
      box-sizing: border-box;
  }

  .main-container {
      margin: 0 auto;
      width: 100%;
      max-width: 960px;
  }

  .page-header {
      position: relative;
      margin-bottom: 3rem;
      text-align: center;
      opacity: 0;
      animation: fade-in-up 0.5s ease-out forwards;
  }

  .back-button {
      display: inline-block;
      margin-bottom: 1.25rem;
      font-size: 0.92rem;
      text-decoration: none;
      color: #b0c4de;
  }

  .back-button:hover {
      color: var(--rights-theme);
  }

  .main-title {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 2.5rem;
      color: #fff;
      font-weight: 700;
      gap: 1rem;
      letter-spacing: 0;
  }

  .title-icon {
      font-size: 2.8rem;
      color: var(--rights-theme);
      text-shadow: 0 0 15px rgb(239 68 68 / 80%);
  }

  .subtitle,
  .card-description {
      margin-bottom: 1rem;
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  .content-grid {
      display: grid;
      gap: 1.5rem;
  }

  .content-card {
      display: flex;
      padding: 1.5rem 2rem;
      min-width: 0;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 12px;
      opacity: 0;
      transition: border-color 0.3s ease;
      backdrop-filter: blur(10px);
      flex-direction: column;
      animation: fade-in-up 0.5s ease-out forwards;
  }

  .content-card:hover {
      border-color: var(--rights-theme-hover);
  }

  .content-card:nth-child(1) {
      animation-delay: 0.2s;
  }

  .content-card:nth-child(2) {
      animation-delay: 0.3s;
  }

  .content-card:nth-child(3) {
      animation-delay: 0.4s;
  }

  .content-card:nth-child(4) {
      animation-delay: 0.5s;
  }

  .content-card:nth-child(5) {
      animation-delay: 0.6s;
  }

  .card-title {
      padding-left: 1rem;
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.4rem;
      color: #fff;
      font-weight: 700;
      border-left: 4px solid var(--rights-theme);
      letter-spacing: 0;
  }

  .card-header-row .card-title {
      margin-bottom: 0;
  }

  .period-badge {
      padding: 0.3rem 0.8rem;
      font-size: 0.8rem;
      white-space: nowrap;
      color: #8392a5;
      background: rgb(0 0 0 / 30%);
      border: 1px solid rgb(255 255 255 / 5%);
      border-radius: 4px;
  }

  .period-badge.warning {
      color: #ffd79a;
      background: rgb(245 158 11 / 12%);
      border-color: rgb(245 158 11 / 35%);
  }

  .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
  }

  .holdings-header {
      margin-bottom: 0;
  }

  .holdings-actions {
      display: flex;
      align-items: center;
      gap: 0.45rem;
  }

  .system-status {
      display: flex;
      align-items: center;
      padding: 0.2rem 0.6rem;
      font-size: 0.75rem;
      white-space: nowrap;
      color: #8392a5;
      background: rgb(0 0 0 / 20%);
      border: 1px solid rgb(255 255 255 / 5%);
      border-radius: 4px;
  }

  .status-dot {
      margin-right: 6px;
      width: 6px;
      height: 6px;
      background: #00c497;
      border-radius: 50%;
      box-shadow: 0 0 5px #00c497;
  }

  .status-dot.stale {
      background: var(--rights-accent);
      box-shadow: 0 0 5px var(--rights-accent);
  }

  .icon-refresh-button {
      display: grid;
      padding: 0;
      width: 26px;
      height: 26px;
      font-size: 1rem;
      line-height: 1;
      color: #8392a5;
      background: rgb(0 0 0 / 16%);
      border: 1px solid rgb(255 255 255 / 6%);
      border-radius: 4px;
      cursor: pointer;
      place-items: center;
      transition: color 0.2s ease, border-color 0.2s ease;
  }

  .icon-refresh-button:hover {
      color: var(--rights-theme);
      border-color: var(--rights-theme-border);
  }

  .icon-refresh-button:disabled {
      cursor: wait;
      opacity: 0.6;
  }

  .icon-refresh-button.spinning {
      animation: spin 0.8s linear infinite;
  }

  .echart-container {
      margin-top: 1rem;
      width: 100%;
      height: 350px;
  }

  .stats-bar {
      display: grid;
      padding: 1rem;
      margin-top: 1rem;
      text-align: center;
      background: rgb(0 0 0 / 20%);
      border-radius: 8px;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
  }

  .stats-bar .stat-item {
      text-align: center;
  }

  .stat-label {
      margin-bottom: 0.3rem;
      font-size: 0.8rem;
      color: #8392a5;
  }

  .stat-value-small {
      font-size: 1.1rem;
      color: #fff;
      font-weight: 700;
  }

  .stat-value-small.highlight {
      color: var(--rights-theme);
  }

  .stat-value-small.negative {
      color: #00c497;
  }

  .premium-lock-card {
      display: flex;
      min-height: 280px;
      text-align: center;
      align-items: center;
      justify-content: center;
  }

  .premium-lock-card .card-title {
      padding-left: 0;
      border-left: 0;
  }

  .premium-lock-icon {
      display: grid;
      margin-bottom: 1rem;
      width: 54px;
      height: 54px;
      font-size: 1.6rem;
      background: var(--rights-theme-soft);
      border: 1px solid var(--rights-theme-border);
      border-radius: 50%;
      place-items: center;
  }

  .premium-lock-button {
      padding: 0.7rem 1.2rem;
      margin-top: 1rem;
      color: #fff;
      background: var(--rights-theme);
      border: 0;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
  }

  .premium-lock-button:hover {
      background: #dc2626;
  }

  .card-subtitle {
      padding-bottom: 0.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      color: #fff;
      border-bottom: 1px solid rgb(255 255 255 / 10%);
      font-weight: 700;
  }

  .adjustments-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-bottom: 1rem;
      gap: 2rem;
  }

  .adjustment-title {
      margin: 0 0 0.8rem;
      font-size: 1rem;
      font-weight: 600;
  }

  .adjustment-title.sell {
      color: #d9534f;
  }

  .adjustment-title.buy {
      color: #5cb85c;
  }

  .adjustment-list {
      display: flex;
      padding: 0;
      margin: 0;
      list-style: none;
      flex-direction: column;
      gap: 0.6rem;
  }

  .adjustment-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.8rem;
      font-size: 0.9rem;
      color: #b0c4de;
      background: rgb(255 255 255 / 5%);
      border-radius: 6px;
  }

  .adjustment-security {
      display: flex;
      min-width: 0;
      flex-direction: column;
  }

  .adjustment-security small {
      margin-top: 0.15rem;
      font-size: 0.75rem;
      color: #8392a5;
  }

  .adjustment-item-empty {
      padding: 0.5rem 0;
      font-size: 0.9rem;
      color: #8392a5;
  }

  .action-badge {
      padding: 0.2rem 0.6rem;
      font-size: 0.8rem;
      color: #fff;
      border-radius: 10px;
      font-weight: 700;
  }

  .action-badge.buy {
      background-color: rgb(92 184 92 / 70%);
  }

  .action-badge.sell {
      background-color: rgb(217 83 79 / 70%);
  }

  .table-wrapper,
  .heatmap-wrapper {
      overflow-x: auto;
      width: 100%;
  }

  .table-container {
      overflow-x: auto;
      margin-bottom: 1.5rem;
      border-radius: 8px;
  }

  .heatmap-container {
      margin-bottom: 0;
  }

  .portfolio-table,
  .heatmap-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
  }

  .portfolio-table {
      margin-top: 1rem;
      min-width: 820px;
  }

  .portfolio-table th,
  .portfolio-table td {
      padding: 0.8rem 1rem;
      border-bottom: 1px solid rgb(255 255 255 / 10%);
      text-align: left;
      white-space: nowrap;
  }

  .portfolio-table th {
      font-size: 0.9rem;
      color: #fff;
      font-weight: 700;
  }

  .portfolio-table td {
      color: #b0c4de;
  }

  .portfolio-table tr:last-child td {
      border-bottom: none;
  }

  .heatmap-table {
      table-layout: fixed;
      min-width: 800px;
  }

  .heatmap-table th {
      padding: 0.8rem 0.2rem;
      font-size: 0.85rem;
      white-space: nowrap;
      color: #fff;
      border: 1px solid rgb(255 255 255 / 10%);
  }

  .heatmap-table td {
      padding: 0.6rem 0.2rem;
      font-size: 0.85rem;
      text-align: center;
      border: 1px solid rgb(255 255 255 / 10%);
  }

  .heatmap-table .year-col {
      text-align: center;
      color: #fff;
      font-weight: 700;
  }

  .heatmap-table .cell-val,
  .heatmap-table .year-total {
      text-align: center;
  }

  .heatmap-table .year-total {
      font-weight: 700;
  }

  .text-red {
      color: #ff6b6b;
  }

  .text-green {
      color: #5ee2a0;
  }

  .risk-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      margin-bottom: 2rem;
      gap: 1.5rem;
  }

  .risk-box {
      display: flex;
      padding: 1.5rem 1rem;
      text-align: center;
      background: rgb(255 255 255 / 3%);
      border: 1px solid rgb(255 255 255 / 5%);
      border-radius: 8px;
      flex-direction: column;
      justify-content: center;
      gap: 0.45rem;
  }

  .risk-label {
      margin: 0;
      font-size: 0.85rem;
      color: #8392a5;
      line-height: 1.4;
  }

  .risk-main-val {
      margin: 0;
      font-size: 1.4rem;
      color: var(--rights-theme);
      font-weight: 700;
      line-height: 1.2;
  }

  .risk-sub-val {
      margin: 0;
      font-size: 0.8rem;
      color: #b0c4de;
      line-height: 1.4;
  }

  .risk-sub-title {
      margin: 0 0 1.2rem;
      font-size: 1.1rem;
      color: #fff;
      font-weight: 700;
  }

  .risk-detail-title {
      margin-top: 2rem;
  }

  .dist-table-container {
      margin-bottom: 1.5rem;
  }

  .dist-table-inner {
      min-width: 600px;
  }

  .dist-header-row,
  .dist-bar-row,
  .dist-label-row {
      display: flex;
      width: 100%;
  }

  .dist-col {
      padding: 0.5rem;
      font-size: 0.8rem;
      text-align: center;
      color: #8392a5;
      border-right: 1px solid rgb(255 255 255 / 5%);
      flex: 1;
  }

  .dist-col:last-child {
      border-right: 0;
  }

  .dist-bar-row {
      align-items: center;
      height: 40px;
      background: rgb(0 0 0 / 20%);
  }

  .dist-block.rights-theme {
      padding: 0.3rem 0;
      margin: 0 4px;
      color: #fff;
      background: linear-gradient(145deg, #b91c1c, var(--rights-theme));
      border-radius: 4px;
      font-weight: 700;
  }

  .risk-table {
      width: 100%;
      min-width: 700px;
      border-collapse: collapse;
  }

  .risk-table th {
      padding: 0.8rem;
      font-weight: 700;
      text-align: center;
      white-space: nowrap;
      color: #fff;
      background: rgb(0 0 0 / 20%);
      border: 1px solid rgb(255 255 255 / 10%);
  }

  .risk-table td {
      padding: 0.8rem;
      font-size: 0.9rem;
      text-align: center;
      white-space: nowrap;
      color: #b0c4de;
      border: 1px solid rgb(255 255 255 / 10%);
  }

  .risk-table .negative {
      color: #00c497;
  }

  .faq-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }

  .faq-item {
      border-bottom: 1px solid rgb(255 255 255 / 10%);
  }

  .faq-item:last-child {
      border-bottom: none;
  }

  .faq-question {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      width: 100%;
      font-size: 1rem;
      text-align: left;
      color: #fff;
      background: none;
      border: none;
      cursor: pointer;
  }

  .faq-icon {
      font-size: 1.5rem;
      color: var(--rights-theme);
      transition: transform 0.3s ease;
      font-weight: bold;
  }

  .faq-icon.is-open {
      transform: rotate(45deg);
  }

  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  .faq-answer p {
      margin: 0;
  }

  .loading-panel,
  .empty-state {
      display: grid;
      min-height: 180px;
      text-align: center;
      color: #b0c4de;
      place-items: center;
  }

  .loader {
      width: 28px;
      height: 28px;
      border: 3px solid rgb(255 255 255 / 18%);
      border-top-color: var(--rights-theme);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
  }

  @keyframes fade-in-up {
      from {
          opacity: 0;
          transform: translateY(16px);
      }

      to {
          opacity: 1;
          transform: translateY(0);
      }
  }

  @keyframes spin {
      to {
          transform: rotate(360deg);
      }
  }

  @media (max-width: 920px) {
      .adjustments-grid {
          grid-template-columns: 1fr;
      }

      .stats-bar {
          padding: 0.8rem;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 0.75rem 0.5rem;
      }

      .stats-bar .stat-item:nth-child(-n + 3) {
          grid-column: span 2;
      }

      .stats-bar .stat-item:nth-child(n + 4) {
          grid-column: span 3;
      }

      .stats-bar .stat-item {
          padding: 0.35rem 0.2rem;
      }

      .risk-summary-grid {
          grid-template-columns: 1fr;
      }

      .card-header-row {
          align-items: flex-start;
          flex-direction: column;
      }
  }

  @media (max-width: 560px) {
      .page-wrapper {
          padding: 1.5rem 0.75rem 2.5rem;
      }

      .main-title {
          align-items: flex-start;
          font-size: 1.75rem;
          line-height: 1.25;
      }

      .title-icon {
          font-size: 1.9rem;
      }

      .content-card {
          padding: 1rem;
      }

      .stats-bar {
          margin-top: 0.75rem;
      }

      .stat-label {
          font-size: 0.75rem;
      }

      .stat-value-small {
          font-size: 1rem;
      }

      .holdings-actions {
          align-self: stretch;
          justify-content: space-between;
      }

  }
</style>
