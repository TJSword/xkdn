<template>
  <div class="page-wrapper">
    <main class="main-container">
      <header class="page-header">
        <router-link to="/home" class="back-button">← 返回主页</router-link>
        <h1 class="main-title">
          <FeaturePageIcon class="title-icon" type="high-dividend" />
          高股息策略
        </h1>
        <p class="subtitle">不只看股息率，更看公司能否持续增长分红。</p>
      </header>

      <StrategyLoading
        v-if="isLoading"
        title="正在同步高股息策略"
        description="读取历史净值、沪深300基准与回测数据"
        monogram="DIV"
        icon-type="high-dividend"
      />

      <div v-else class="content-grid">
        <section class="content-card">
          <h2 class="card-title">策略简介</h2>
          <p class="card-description">
            高股息策略参考贝莱德旗下 iShares 股息增长类指数产品的选股思路，重点寻找具备持续提高分红能力的公司。策略首先要求公司股息连续五年增长，并对股利支付率设置上限，避免企业将过多利润用于分红，为后续经营和增长保留足够资金。
          </p>
          <p class="card-description">
            在此基础上，策略通过 ROE 与 ROA 的历史标准差衡量盈利稳定性，过滤盈利波动较大的公司，降低周期性行业对组合的影响。通过全部质量筛选后，再按照股息率从高到低排序：新股票从前五名中选择，现有持仓保持在前二十名便继续持有。
          </p>
        </section>

        <section class="content-card">
          <h2 class="card-title">组合思想</h2>
          <p class="card-description">
            策略关注的不是某一年的高股息，而是公司能否在保持正常经营和盈利增长的同时，持续提高对股东的现金回报。
          </p>
          <p class="card-description">
            连续五年的股息增长用于检验分红记录，股利支付率约束用于判断分红是否留有余地，ROE 与 ROA 的波动用于排除盈利稳定性不足的公司。完成这些筛选后，股息率作为最终排序因子，并通过前五买入、前二十持有的缓冲规则降低不必要的换手。
          </p>
          <div class="principle-grid">
            <article v-for="item in principles" :key="item.title">
              <span>{{ item.step }}</span>
              <strong>{{ item.title }}</strong>
              <p>{{ item.description }}</p>
            </article>
          </div>
          <div class="formula-card">
            <span>核心筛选框架</span>
            <strong>连续五年股息增长 × 合理股利支付率 × ROE/ROA 稳定性 → 前五买入、前二十持有</strong>
          </div>
        </section>
        <section v-if="canViewPremiumContent" class="content-card">
          <div class="card-header-row holdings-header">
            <h2 class="card-title">当前持仓与调仓安排</h2>
            <div class="system-status"><span class="status-dot"></span>更新时间：{{ holdingsUpdatedAt || '--' }}</div>
          </div>
          <div class="holdings-note">
            <strong>前 5 买入，前 20 持有</strong>
            <span>本期排名依据 {{ holdingsTradeDate || '最近交易日' }} 收盘数据生成；现有持仓排名第 21 名及以后才调出。</span>
          </div>
          <div class="rank-rule-strip" aria-label="排名缓冲规则">
            <span class="entry">第 1—5 名 · 买入候选区</span>
            <span class="buffer">第 6—20 名 · 持有缓冲区</span>
            <span class="exit">第 21 名以后 · 退出区</span>
          </div>
          <div class="position-management-note">
            <strong>仓位管理</strong>
            <span>仅在调仓日检查仓位；单只持仓超过 24% 时触发止盈，并回到 20%。</span>
          </div>
          <div class="portfolio-view-header">
            <h3 class="section-heading">持仓与排名</h3>
            <div class="portfolio-view-toggle" aria-label="持仓与排名视图">
              <button type="button" :class="{ active: portfolioView === 'holdings' }" :aria-pressed="portfolioView === 'holdings'" @click="portfolioView = 'holdings'">
                <span>当前持仓</span><em>{{ sortedPortfolio.length }}</em>
              </button>
              <button type="button" :class="{ active: portfolioView === 'ranking' }" :aria-pressed="portfolioView === 'ranking'" @click="portfolioView = 'ranking'">
                <span>完整排名</span><em>{{ rankings.length }}</em>
              </button>
            </div>
          </div>
          <p class="adjustment-note">
            {{ portfolioView === 'holdings'
              ? '当前持仓按本期排名由前到后展示。'
              : '排名前 5 只作为新股买入候选，第 6—20 名只对已有持仓提供缓冲，不代表组合同时持有 20 只股票。' }}
          </p>
          <div class="table-container combined-table-container">
            <table class="combined-portfolio-table" :class="{ 'is-ranking-view': portfolioView === 'ranking' }">
              <thead>
                <tr>
                  <th>本期排名</th><th>股票代码</th><th>股票名称</th><th>收盘价</th><th>股息率 TTM</th><th>5年平均分红率</th><th>排名区域</th><th>最新权重</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in displayedPortfolioRows"
                  :key="`${portfolioView}-${row.stockCode}`"
                  :class="{
                    'ranking-buffer-start': portfolioView === 'ranking' && row.rank === 6,
                    'portfolio-ranking-row': portfolioCodes.has(row.stockCode)
                  }"
                >
                  <td class="rank-cell">{{ row.rank || '20名以外' }}</td>
                  <td class="code-cell">{{ row.stockCode }}</td>
                  <td class="name-cell">{{ row.stockName }}</td>
                  <td>{{ formatNumber(row.closePrice, 2) }}</td>
                  <td class="yield-cell">{{ formatPercentText(row.dividendYieldTtm) }}</td>
                  <td>{{ formatPercentText(row.fiveYearAveragePayoutRatio) }}</td>
                  <td><span :class="['rank-zone-badge', getRankZoneClass(row.rank)]">{{ getRankZoneLabel(row.rank) }}</span></td>
                  <td :class="{ 'target-weight': portfolioCodes.has(row.stockCode) }">{{ formatWeight(getRowWeight(row)) }}</td>
                </tr>
                <tr v-if="!displayedPortfolioRows.length"><td colspan="8">暂无持仓与排名数据</td></tr>
              </tbody>
            </table>
          </div>

          <h3 class="card-subtitle">调仓安排</h3>
          <p class="adjustment-note">
            根据本期排名与上一期实际持仓生成，计划于
            <span class="rebalance-execution-time">{{ effectiveTradeDate || '下一交易周首个交易日' }} 9:30</span>
            执行。
          </p>
          <div class="adjustments-grid">
            <div class="adjustment-block">
              <h4 class="adjustment-title sell">↓ 计划调出</h4>
              <ul class="adjustment-list">
                <li v-for="row in rebalanceOut" :key="`sell-${row.stockCode}`" class="adjustment-item">
                  <span>{{ row.stockName }} ({{ row.stockCode }})</span>
                  <span class="action-badge sell">计划调出</span>
                </li>
                <li v-if="rebalanceOut.length === 0" class="adjustment-item-empty">本期无需调出</li>
              </ul>
            </div>
            <div class="adjustment-block">
              <h4 class="adjustment-title buy">↑ 计划调入</h4>
              <ul class="adjustment-list">
                <li v-for="row in rebalanceIn" :key="`buy-${row.stockCode}`" class="adjustment-item">
                  <span>{{ row.stockName }} ({{ row.stockCode }})</span>
                  <span class="action-badge buy">计划调入</span>
                </li>
                <li v-if="rebalanceIn.length === 0" class="adjustment-item-empty">本期无需调入</li>
              </ul>
            </div>
          </div>
        </section>
        <div v-else class="content-card premium-lock-card">
          <div class="premium-lock-icon">🔒</div>
          <h2 class="card-title">当前持仓与调仓安排</h2>
          <p class="card-description">
            最新选股结果、调仓名单、观察名单、股息率及目标权重属于会员内容，开通后可查看完整信息。
          </p>
          <button class="premium-lock-button" @click="router.push('/home')">返回首页开通会员</button>
        </div>

        <section class="content-card">
          <div class="card-header-row nav-chart-header">
            <div class="chart-title-row">
              <h2 class="card-title">高股息策略 vs 沪深300</h2>
              <div class="chart-scale-toggle" aria-label="净值坐标类型">
                <button type="button" :class="{ active: chartScaleMode === 'value' }" @click="chartScaleMode = 'value'">线性</button>
                <button type="button" :class="{ active: chartScaleMode === 'log' }" @click="chartScaleMode = 'log'">对数</button>
              </div>
            </div>
            <ChartDateRangePicker
              v-model:start="dateRangeStart"
              v-model:end="dateRangeEnd"
              :min-date="chartMinDate"
              :max-date="chartMaxDate"
              accent="#d4af37"
              @apply="applyDateRangeSelection"
            />
          </div>
          <v-chart class="echart-container" :option="navChartOption" autoresize />
          <div class="stats-bar">
            <div><span>累计收益</span><strong class="highlight">{{ strategyStats.totalReturn }}%</strong></div>
            <div><span>年化收益</span><strong>{{ strategyStats.annualizedReturn }}%</strong></div>
            <div><span>波动率</span><strong>{{ strategyStats.volatility }}%</strong></div>
            <div><span>夏普比率</span><strong>{{ strategyStats.sharpe }}</strong></div>
            <div><span>最大回撤</span><strong class="negative">{{ strategyStats.maxDrawdown }}%</strong></div>
          </div>
        </section>

        <section class="content-card">
          <h2 class="card-title">策略月度 / 年度收益表</h2>
          <p class="card-description">点击任意月份可查看当月每日涨跌、最好一天和最差一天。</p>
          <div class="table-container heatmap-container">
            <table class="heatmap-table">
              <thead><tr><th>年份</th><th v-for="month in monthLabels" :key="month">{{ month }}</th><th>年度</th></tr></thead>
              <tbody>
                <tr v-for="row in monthlyRows" :key="row.year">
                  <td class="year-col">{{ row.year }}</td>
                  <td v-for="(month, index) in row.months" :key="index" :style="getHeatmapStyle(month)" class="cell-val">
                    <button v-if="month !== null" type="button" @click="openMonthlyCalendar(row.year, index + 1, month)">{{ month }}%</button>
                  </td>
                  <td :style="getHeatmapStyle(row.total)" class="year-total">{{ row.total }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="content-card">
          <h2 class="card-title">深度风险分析</h2>
          <div class="risk-summary-grid">
            <div><span>卡玛比率 (Calmar)</span><strong>{{ strategyStats.calmar }}</strong><small>年化收益 / 最大回撤</small></div>
            <div><span>盈利 / 总月份</span><strong>{{ monthlySummary.profitableMonths }} / {{ monthlySummary.totalMonths }}</strong><small>月度胜率：{{ monthlySummary.winRate }}%</small></div>
            <div><span>索提诺比率</span><strong>{{ sortinoRatio }}</strong><small>衡量下行风险调整收益</small></div>
          </div>
          <h3 class="risk-sub-title">回撤深度分布（频率统计）</h3>
          <div class="distribution-grid">
            <div v-for="item in drawdownDistribution" :key="item.range">
              <span>{{ item.range }}</span><strong :style="{ opacity: item.count ? 1 : 0.5 }">{{ item.count }}</strong><small>次数</small>
            </div>
          </div>
          <h3 class="risk-sub-title detail-title">历史重大回撤明细 (Top 10)</h3>
          <div class="table-container">
            <table class="risk-table">
              <thead><tr><th>#</th><th>开始日期</th><th>谷底日期</th><th>修复日期</th><th>最大回撤</th><th>回撤期(天)</th><th>修复期(天)</th></tr></thead>
              <tbody>
                <tr v-for="(row, index) in drawdownRows" :key="`${row.startDate}-${row.troughDate}`">
                  <td>{{ index + 1 }}</td><td>{{ row.startDate }}</td><td>{{ row.troughDate }}</td><td>{{ row.endDate }}</td><td class="negative">{{ row.drawdown }}%</td><td>{{ row.ddDays }}</td><td>{{ row.fixDays }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="content-card">
          <h2 class="card-title">常见问题 (FAQ)</h2>
          <div class="faq-container">
            <div v-for="(item, index) in faqList" :key="item.question" class="faq-item">
              <button type="button" class="faq-question" @click="toggleFaq(index)">
                <span>{{ item.question }}</span><em :class="{ open: openFaqIndex === index }">+</em>
              </button>
              <div v-if="openFaqIndex === index" class="faq-answer"><p>{{ item.answer }}</p></div>
            </div>
          </div>
        </section>

      </div>

      <MonthlyReturnCalendarModal
        :calendar="selectedMonthlyCalendar"
        :has-previous="!!previousCalendarMonth"
        :has-next="!!nextCalendarMonth"
        accent="#d4af37"
        @close="closeMonthlyCalendar"
        @navigate="goToAdjacentCalendarMonth"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
  import { computed, inject, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { LineChart } from 'echarts/charts'
  import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
  import { use } from 'echarts/core'
  import { CanvasRenderer } from 'echarts/renderers'
  import VChart from 'vue-echarts'
  import ChartDateRangePicker from '@/components/ChartDateRangePicker.vue'
  import MonthlyReturnCalendarModal from '@/components/MonthlyReturnCalendarModal.vue'
  import { useMonthlyReturnCalendar } from '@/composables/useMonthlyReturnCalendar'
  import { callCloudFunction, throwIfAuthExpired } from '@/services/cloudFunction'
  import { useUserStore } from '@/store/user'
  import {
      calculateDrawdownAnalysis,
      calculateMonthlyReturns,
      calculateMonthlySummary,
      calculateSortinoRatio,
      calculateStats,
      prepareStrategySeries
  } from '@/utils/strategyMetrics'

  use([CanvasRenderer, LineChart, GridComponent, LegendComponent, TooltipComponent])

  interface HighDividendStrategyData {
      dateList: string[]
      strategyData: number[]
      hs300?: Array<number | null>
      holdings?: HighDividendHolding[]
      rankings?: HighDividendHolding[]
      portfolio?: HighDividendHolding[]
      holdingsTradeDate?: string
      holdingsUpdatedAt?: string
      effectiveTradeDate?: string
      rebalanceOut?: HighDividendHolding[]
      rebalanceIn?: HighDividendHolding[]
  }

  interface HighDividendHolding {
      stockName: string
      stockCode: string
      closePrice?: number
      dividendYieldTtm?: number
      fiveYearAveragePayoutRatio?: number
      rank?: number | null
      weight?: number
      targetWeight?: number
  }

  interface HighDividendSeries {
      dates: string[]
      strategy: number[]
      benchmark: Array<number | null>
  }

  const router = useRouter()
  const userStore: any = useUserStore()
  const showMessage: any = inject('showMessage')
  const isLoading = ref(true)
  const canViewPremiumContent = computed(() => userStore.isVip || userStore.userInfo?.admin === true)

  const principles = [
      { step: '01', title: '连续增长', description: '要求公司股息连续五年保持增长。' },
      { step: '02', title: '支付率约束', description: '剔除股利支付率过高、分红可持续性不足的公司。' },
      { step: '03', title: '盈利稳定性', description: '通过 ROE、ROA 的历史标准差，过滤盈利波动较大的公司。' },
      { step: '04', title: '排名缓冲', description: '新股票从前五名中选择，现有持仓保持在前二十名便继续持有。' }
  ]

  const rankings = ref<HighDividendHolding[]>([])
  const portfolio = ref<HighDividendHolding[]>([])
  const holdingsTradeDate = ref('')
  const holdingsUpdatedAt = ref('')
  const effectiveTradeDate = ref('')
  const rebalanceOut = ref<HighDividendHolding[]>([])
  const rebalanceIn = ref<HighDividendHolding[]>([])
  const portfolioView = ref<'holdings' | 'ranking'>('holdings')
  const portfolioCodes = computed(() => new Set(portfolio.value.map(row => row.stockCode)))
  const portfolioByCode = computed(() => new Map(portfolio.value.map(row => [row.stockCode, row])))
  const sortedPortfolio = computed(() => [...portfolio.value].sort((left, right) => {
      const leftRank = Number.isInteger(left.rank) ? Number(left.rank) : Number.POSITIVE_INFINITY
      const rightRank = Number.isInteger(right.rank) ? Number(right.rank) : Number.POSITIVE_INFINITY
      return leftRank - rightRank
  }))
  const displayedPortfolioRows = computed(() => portfolioView.value === 'holdings' ? sortedPortfolio.value : rankings.value)

  const series = ref<HighDividendSeries>({ dates: [], strategy: [], benchmark: [] })
  const chartMinDate = ref('')
  const chartMaxDate = ref('')
  const dateRangeStart = ref('')
  const dateRangeEnd = ref('')
  const chartScaleMode = ref<'value' | 'log'>('value')
  const openFaqIndex = ref<number | null>(0)
  const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  const getDateIndex = (date: string, mode: 'start' | 'end') => {
      const exact = series.value.dates.indexOf(date)
      if (exact >= 0) return exact
      if (mode === 'start') {
          const next = series.value.dates.findIndex(item => item >= date)
          return next >= 0 ? next : series.value.dates.length - 1
      }
      for (let index = series.value.dates.length - 1; index >= 0; index--) if (series.value.dates[index] <= date) return index
      return 0
  }

  const selectedRange = computed(() => {
      const start = getDateIndex(dateRangeStart.value, 'start')
      const end = Math.max(start, getDateIndex(dateRangeEnd.value, 'end'))
      return {
          dates: series.value.dates.slice(start, end + 1),
          strategy: series.value.strategy.slice(start, end + 1),
          benchmark: series.value.benchmark.slice(start, end + 1)
      }
  })

  const strategyStats = computed(() => calculateStats(selectedRange.value.strategy))
  const monthlyRows = computed(() => calculateMonthlyReturns(selectedRange.value.strategy, selectedRange.value.dates))
  const monthlySummary = computed(() => calculateMonthlySummary(monthlyRows.value))
  const sortinoRatio = computed(() => calculateSortinoRatio(selectedRange.value.strategy))
  const drawdownAnalysis = computed(() => calculateDrawdownAnalysis(selectedRange.value.strategy, selectedRange.value.dates))
  const drawdownRows = computed(() => drawdownAnalysis.value.drawdowns)
  const drawdownDistribution = computed(() => drawdownAnalysis.value.distribution)
  const rebase = (values: Array<number | null>) => {
      const base = values.find(value => Number.isFinite(value)) || 1
      return values.map(value => (Number.isFinite(value) ? Number((((value as number) / base) * 1000).toFixed(5)) : null))
  }

  const navChartOption = computed(() => ({
      animationDuration: 650,
      color: ['#d4af37', '#64748b'],
      tooltip: { trigger: 'axis', valueFormatter: (value: number) => Number(value).toFixed(3) },
      legend: { top: 0, data: ['高股息策略', '沪深300全收益'], textStyle: { color: '#d8e4f2' } },
      grid: { top: 52, left: 24, right: 30, bottom: 42, containLabel: true },
      xAxis: { type: 'category', data: selectedRange.value.dates, boundaryGap: false, axisLine: { lineStyle: { color: '#52677d' } }, axisLabel: { color: '#b0c4de', hideOverlap: true } },
      yAxis: { type: chartScaleMode.value, axisLabel: { color: '#b0c4de' }, splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } } },
      series: [
          { name: '高股息策略', type: 'line', data: rebase(selectedRange.value.strategy), symbol: 'none', lineStyle: { width: 3 }, areaStyle: { color: 'rgba(22, 101, 52, 0.18)' } },
          { name: '沪深300全收益', type: 'line', data: rebase(selectedRange.value.benchmark), symbol: 'none', lineStyle: { width: 1.8, type: 'dashed' } }
      ]
  }))

  const applyDateRangeSelection = () => {
      if (!series.value.dates.includes(dateRangeStart.value)) dateRangeStart.value = series.value.dates[getDateIndex(dateRangeStart.value, 'start')]
      if (!series.value.dates.includes(dateRangeEnd.value)) dateRangeEnd.value = series.value.dates[getDateIndex(dateRangeEnd.value, 'end')]
      if (dateRangeStart.value > dateRangeEnd.value) [dateRangeStart.value, dateRangeEnd.value] = [dateRangeEnd.value, dateRangeStart.value]
  }

  const calendarDates = computed(() => series.value.dates)
  const calendarValues = computed(() => series.value.strategy)
  const { selectedMonthlyCalendar, previousCalendarMonth, nextCalendarMonth, openMonthlyCalendar, closeMonthlyCalendar, goToAdjacentCalendarMonth } = useMonthlyReturnCalendar({
      monthlyRows,
      chartDates: calendarDates,
      chartStrategyValues: calendarValues,
      dateRangeStart,
      dateRangeEnd,
      getDateIndex
  })

  const loadStrategyData = async () => {
      try {
          const response: any = await callCloudFunction({
              name: 'getHighDividendStrategyData',
              data: { action: 'get' }
          })
          const data = response.result?.data as HighDividendStrategyData | undefined
          if (!response.result?.success || !data?.dateList?.length || !data?.strategyData?.length) {
              throw new Error(response.result?.message || '高股息策略数据为空')
          }

          const prepared = prepareStrategySeries(data.dateList, data.strategyData)
          const benchmarkByDate = new Map(data.dateList.map((date, index) => [date, data.hs300?.[index] ?? null]))
          series.value = {
              dates: prepared.dates,
              strategy: prepared.values,
              benchmark: prepared.dates.map(date => benchmarkByDate.get(date) ?? null)
          }
          rankings.value = Array.isArray(data.rankings) ? data.rankings : Array.isArray(data.holdings) ? data.holdings : []
          portfolio.value = Array.isArray(data.portfolio) ? data.portfolio : rankings.value.slice(0, 5)
          holdingsTradeDate.value = data.holdingsTradeDate || ''
          holdingsUpdatedAt.value = data.holdingsUpdatedAt || data.holdingsTradeDate || ''
          effectiveTradeDate.value = data.effectiveTradeDate || ''
          rebalanceOut.value = Array.isArray(data.rebalanceOut) ? data.rebalanceOut : []
          rebalanceIn.value = Array.isArray(data.rebalanceIn) ? data.rebalanceIn : []
          chartMinDate.value = prepared.dates[0] || ''
          chartMaxDate.value = prepared.dates[prepared.dates.length - 1] || ''
          dateRangeStart.value = chartMinDate.value
          dateRangeEnd.value = chartMaxDate.value
      } catch (error) {
          throwIfAuthExpired(error)
          console.error('高股息策略数据加载失败:', error)
          showMessage?.(error instanceof Error ? error.message : '高股息策略数据加载失败', 'error')
      } finally {
          isLoading.value = false
      }
  }

  onMounted(loadStrategyData)

  const faqList = [
      { question: '高股息策略是不是只买股息率最高的股票？', answer: '不是。异常高的股息率可能来自股价大幅下跌、一次性分红或盈利不可持续。策略会先检查分红记录、经营现金流、盈利质量和负债水平，再在通过质量过滤的股票中比较股息率与估值。' },
      { question: '高股息策略持有 5 只还是 10 只更合适？', answer: '5 只并不一定优于 10 只。从现有回测看，持有 5 只时组合更集中，收益率相对更高；持有 10 只时分散度更好，整体表现也更稳定。在我的账户中，高股息策略主要承担保险和防守作用。当其他策略阶段性失效时，希望它能起到一定的平衡作用，因此我选择持有 5 只。如果把高股息策略作为账户的主策略，更建议持有 10 只，以获得更好的分散性和稳定性。' },
      { question: '策略的主要收益来源是什么？', answer: '收益主要来自三部分：持有期间收到的现金分红、低估值回归带来的价格修复，以及企业盈利增长推动的长期价值提升。分红提供回报基础，但并不能消除股价波动。' },
      { question: '策略多久调仓一次？', answer: '策略在当周最后一个交易日夜间，根据该交易日的收盘数据生成最新名单；下一周第一个交易日 9:30 执行必要调整。现有持仓仍在前二十名时继续持有，因此每周检查不等于每周都会交易。' },
      { question: '分红后股价除权，收益是不是没有意义？', answer: '除权会使股价在除息日按股息金额调整，但投资者同时获得现金分红。评估策略时应使用包含分红再投资的全收益口径，不能只看未复权价格变化。' },
      { question: '高股息策略有哪些主要风险？', answer: '主要风险包括盈利下滑导致削减分红、周期行业景气反转、价值风格长期落后、利率上升压制估值，以及集中持有传统行业带来的结构性风险。高股息不等于低风险或保本。' }
  ]

  const toggleFaq = (index: number) => { openFaqIndex.value = openFaqIndex.value === index ? null : index }
  const formatNumber = (value: number | null | undefined, digits: number) => Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '—'
  const formatPercent = (value: number | null | undefined) => Number.isFinite(Number(value))
      ? formatNumber(Math.abs(Number(value)) <= 1 ? Number(value) * 100 : Number(value), 2)
      : '—'
  const formatPercentText = (value: number | null | undefined) => Number.isFinite(Number(value)) ? `${formatPercent(value)}%` : '—'
  const formatWeight = (value: number | null | undefined) => Number.isFinite(Number(value)) ? `${formatPercent(value)}%` : '—'
  const getRankZoneClass = (rank?: number | null) => !rank || rank > 20 ? 'exit' : rank <= 5 ? 'entry' : 'buffer'
  const getRankZoneLabel = (rank?: number | null) => !rank || rank > 20 ? '退出区' : rank <= 5 ? '买入候选区' : '持有缓冲区'
  const getRowWeight = (row: HighDividendHolding) => {
      const holding = portfolioByCode.value.get(row.stockCode)
      return holding?.weight ?? holding?.targetWeight
  }
  const getHeatmapStyle = (value: string | null) => {
      if (value === null) return {}
      const numeric = Number(value)
      const opacity = Math.min(0.15 + Math.abs(numeric) / 8, 0.72)
      return { color: '#fff', backgroundColor: numeric >= 0 ? `rgba(239, 68, 68, ${opacity})` : `rgba(34, 197, 94, ${opacity})` }
  }
</script>

<style scoped lang="scss">
  .page-wrapper {
      --theme: #166534;
      --theme-bright: #4ade80;
      --theme-soft: rgb(22 101 52 / 18%);
      --theme-border: rgb(74 222 128 / 32%);
      --accent: #d4af37;

      padding: 3rem 1rem 4rem;
      min-height: 100vh;
      font-family: 'Noto Sans SC', sans-serif;
      color: #fff;
      background: radial-gradient(circle at 14% 18%, rgb(22 101 52 / 22%), transparent 34%), radial-gradient(circle at 84% 14%, rgb(212 175 55 / 10%), transparent 30%), #121212;
      box-sizing: border-box;
  }

  .main-container { margin: 0 auto; width: 100%; max-width: 960px; }
  .page-header { margin-bottom: 3rem; text-align: center; animation: fade-in-up 0.5s ease-out both; }
  .back-button { display: inline-block; margin-bottom: 1rem; font-size: 0.9rem; text-decoration: none; color: #b0c4de; }
  .back-button:hover { color: var(--accent); }
  .main-title { display: flex; justify-content: center; align-items: center; margin: 0 0 0.5rem; font-size: 2.5rem; gap: 1rem; }
  .subtitle { margin: 0; font-size: 1.1rem; color: #b0c4de; }
  .content-grid { display: grid; gap: 1.5rem; }
  .content-card { display: flex; padding: 1.5rem 2rem; min-width: 0; background: rgb(255 255 255 / 5%); border: 1px solid rgb(255 255 255 / 10%); border-radius: 12px; backdrop-filter: blur(10px); flex-direction: column; animation: fade-in-up 0.5s ease-out both; transition: border-color 0.3s ease; }
  .content-card:hover { border-color: var(--theme-border); }
  .card-title { padding-left: 1rem; margin: 0 0 1rem; font-size: 1.4rem; color: #fff; border-left: 4px solid var(--accent); }
  .card-description { margin: 0 0 1rem; font-size: 0.95rem; color: #b0c4de; line-height: 1.75; }
  .card-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
  .holdings-header .card-title, .chart-title-row .card-title { margin-bottom: 0; }
  .holdings-header { margin-bottom: 1rem; }

  .principle-grid { display: grid; margin-top: 0.4rem; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; }
  .principle-grid article { padding: 1rem; background: rgb(0 0 0 / 20%); border: 1px solid rgb(255 255 255 / 8%); border-radius: 9px; }
  .principle-grid article > span { display: block; margin-bottom: 0.45rem; font-size: 0.72rem; color: var(--accent); }
  .principle-grid strong { color: var(--theme-bright); }
  .principle-grid p { margin: 0.5rem 0 0; font-size: 0.8rem; color: #9fb2cc; line-height: 1.6; }
  .formula-card { display: grid; padding: 1rem; margin-top: 1rem; text-align: center; background: linear-gradient(135deg, var(--theme-soft), rgb(212 175 55 / 8%)); border: 1px solid var(--theme-border); border-radius: 9px; gap: 0.35rem; }
  .formula-card span { font-size: 0.75rem; color: #9fb2cc; }
  .formula-card strong { color: #f4dda0; }

  .system-status, .watch-badge { padding: 0.28rem 0.65rem; font-size: 0.78rem; white-space: nowrap; color: #f4dda0; background: rgb(212 175 55 / 10%); border: 1px solid rgb(212 175 55 / 28%); border-radius: 999px; }
  .status-dot { display: inline-block; margin-right: 0.4rem; width: 6px; height: 6px; background: var(--theme-bright); border-radius: 50%; box-shadow: 0 0 6px var(--theme-bright); }
  .stats-bar, .risk-summary-grid { display: grid; gap: 1rem; }
  .stats-bar div, .risk-summary-grid div { text-align: center; }
  .stats-bar span, .risk-summary-grid span { display: block; margin-bottom: 0.35rem; font-size: 0.78rem; color: #8392a5; }

  .table-container { overflow-x: auto; border: 1px solid rgb(255 255 255 / 8%); border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.78rem 0.7rem; font-size: 0.82rem; text-align: center; white-space: nowrap; border-bottom: 1px solid rgb(255 255 255 / 7%); }
  th { color: #d8e4f2; background: rgb(0 0 0 / 25%); }
  tbody tr:last-child td { border-bottom: 0; }
  tbody tr:hover { background: rgb(22 101 52 / 10%); }
  .code-cell { font-family: monospace; color: #94a3b8; }
  .name-cell { color: #fff; font-weight: 700; }
  .holdings-note { display: flex; align-items: center; padding: 0.75rem 0.9rem; margin-bottom: 0.85rem; background: rgb(22 101 52 / 14%); border: 1px solid var(--theme-border); border-radius: 8px; gap: 0.7rem; }
  .holdings-note strong { flex: 0 0 auto; font-size: 0.85rem; color: var(--theme-bright); line-height: 1.6; }
  .holdings-note span { font-size: 0.82rem; color: #aebfd3; line-height: 1.6; }
  .rank-rule-strip { display: grid; margin-bottom: 1.25rem; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.65rem; }
  .rank-rule-strip span { padding: 0.55rem 0.7rem; font-size: 0.8rem; text-align: center; border-radius: 7px; font-weight: 600; }
  .rank-rule-strip .entry { color: #86efac; background: rgb(34 197 94 / 10%); border: 1px solid rgb(34 197 94 / 28%); }
  .rank-rule-strip .buffer { color: #f4dda0; background: rgb(212 175 55 / 10%); border: 1px solid rgb(212 175 55 / 28%); }
  .rank-rule-strip .exit { color: #fca5a5; background: rgb(217 83 79 / 10%); border: 1px solid rgb(217 83 79 / 28%); }
  .position-management-note { display: flex; align-items: flex-start; padding: 0.75rem 0.9rem; margin: -0.35rem 0 1.25rem; background: rgb(212 175 55 / 8%); border: 1px solid rgb(212 175 55 / 24%); border-radius: 8px; gap: 0.7rem; }
  .position-management-note strong { font-size: 0.85rem; color: #f4dda0; flex: 0 0 auto; line-height: 1.6; }
  .position-management-note span { font-size: 0.82rem; color: #aebfd3; line-height: 1.6; }
  .portfolio-view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; gap: 0.75rem; }
  .portfolio-view-header .section-heading { margin-bottom: 0; }
  .portfolio-view-toggle { display: inline-flex; gap: 0.45rem; }
  .portfolio-view-toggle button { display: inline-flex; align-items: center; padding: 0.38rem 0.5rem 0.38rem 0.7rem; font-size: 0.8rem; color: #94a3b8; background: rgb(255 255 255 / 3%); border: 1px solid rgb(255 255 255 / 10%); border-radius: 999px; cursor: pointer; gap: 0.45rem; transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease; }
  .portfolio-view-toggle button:hover { color: #d8e4f2; border-color: rgb(74 222 128 / 28%); }
  .portfolio-view-toggle button.active { color: var(--theme-bright); background: rgb(34 197 94 / 10%); border-color: rgb(74 222 128 / 38%); box-shadow: inset 0 0 0 1px rgb(74 222 128 / 6%); }
  .portfolio-view-toggle em { display: grid; min-width: 1.45rem; height: 1.45rem; font-size: 0.72rem; color: #9fb2cc; background: rgb(0 0 0 / 24%); border-radius: 999px; place-items: center; font-style: normal; font-weight: 700; }
  .portfolio-view-toggle button.active em { color: #052e16; background: var(--theme-bright); }
  .section-heading { margin: 0 0 0.75rem; font-size: 1.05rem; color: #fff; }
  .adjustment-note { margin: 0 0 1rem; font-size: 0.82rem; color: #9fb2cc; line-height: 1.6; }
  .rebalance-execution-time { display: inline-flex; align-items: center; margin: 0 0.16rem; white-space: nowrap; color: #f4dda0; font-weight: 700; }
  .adjustments-grid { display: grid; margin-bottom: 0.25rem; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2rem; }
  .adjustment-title { margin: 0 0 0.8rem; font-size: 1rem; font-weight: 600; }
  .adjustment-title.sell { color: #d9534f; }
  .adjustment-title.buy { color: #5cb85c; }
  .adjustment-list { display: flex; padding: 0; margin: 0; list-style: none; flex-direction: column; gap: 0.6rem; }
  .adjustment-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.8rem; font-size: 0.9rem; color: #b0c4de; background: rgb(255 255 255 / 5%); border-radius: 6px; gap: 0.75rem; }
  .adjustment-item-empty { padding: 0.5rem 0; font-size: 0.9rem; color: #8392a5; }
  .action-badge { padding: 0.2rem 0.6rem; font-size: 0.8rem; color: #fff; border-radius: 10px; }
  .action-badge.sell { background: #d9534f; }
  .action-badge.buy { background: #5cb85c; }
  .combined-table-container { overflow-x: visible; }
  .combined-portfolio-table { table-layout: fixed; }
  .combined-portfolio-table th, .combined-portfolio-table td { padding: 0.72rem 0.3rem; font-size: 0.8rem; }
  .combined-portfolio-table .code-cell { font-size: 0.82rem; letter-spacing: 0.02em; font-weight: 600; }
  .combined-portfolio-table th { white-space: normal; line-height: 1.35; }
  .rank-cell { color: #d8e4f2; font-weight: 700; }
  .rank-zone-badge { display: inline-block; padding: 0.18rem 0.48rem; font-size: 0.75rem; border-radius: 999px; font-weight: 600; }
  .rank-zone-badge.entry { color: #86efac; background: rgb(34 197 94 / 12%); border: 1px solid rgb(34 197 94 / 30%); }
  .rank-zone-badge.buffer { color: #f4dda0; background: rgb(212 175 55 / 12%); border: 1px solid rgb(212 175 55 / 30%); }
  .rank-zone-badge.exit { color: #fca5a5; background: rgb(217 83 79 / 12%); border: 1px solid rgb(217 83 79 / 30%); }
  .ranking-buffer-start td { border-top: 2px solid rgb(212 175 55 / 38%); }
  .portfolio-ranking-row { background: rgb(22 101 52 / 9%); }
  .portfolio-ranking-row:hover { background: rgb(22 101 52 / 14%); }
  .is-ranking-view .portfolio-ranking-row { background: #1f814452; }
  .is-ranking-view .portfolio-ranking-row:hover { background: #1f814466; }
  .target-weight { color: var(--theme-bright); font-weight: 700; }
  .yield-cell, .highlight { color: var(--accent) !important; }
  .negative { color: #22c55e !important; }

  .premium-lock-card { display: flex; justify-content: center; align-items: center; min-height: 280px; text-align: center; }
  .premium-lock-card .card-title { padding-left: 0; border-left: 0; }
  .premium-lock-icon { display: grid; margin-bottom: 1rem; width: 54px; height: 54px; font-size: 1.5rem; background: var(--theme-soft); border: 1px solid var(--theme-border); border-radius: 50%; place-items: center; }
  .premium-lock-button { padding: 0.7rem 1.2rem; margin-top: 1rem; color: #052e16; background: var(--theme-bright); border: 0; border-radius: 6px; cursor: pointer; font-weight: 700; }
  .premium-lock-button:hover { background: #22c55e; }

  .card-subtitle, .risk-sub-title { padding-bottom: 0.55rem; margin: 1.8rem 0 1rem; font-size: 1.05rem; color: #fff; border-bottom: 1px solid rgb(255 255 255 / 10%); }
  .card-subtitle { border-bottom: 0; }

  .nav-chart-header { align-items: flex-end; }
  .chart-title-row { display: flex; align-items: center; gap: 0.8rem; flex-wrap: wrap; }
  .chart-scale-toggle { display: inline-flex; padding: 0.2rem; background: rgb(0 0 0 / 24%); border: 1px solid rgb(255 255 255 / 8%); border-radius: 7px; }
  .chart-scale-toggle button { padding: 0.3rem 0.62rem; font-size: 0.75rem; color: #8392a5; background: transparent; border: 0; border-radius: 5px; cursor: pointer; }
  .chart-scale-toggle button.active { color: #1c1917; background: var(--accent); }
  @media (min-width: 769px) { .nav-chart-header { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; column-gap: 0.75rem; } .nav-chart-header .chart-title-row { display: contents; } }
  .echart-container { margin-top: 0.5rem; width: 100%; height: 350px; }
  .stats-bar { padding: 1rem; margin-top: 1rem; background: rgb(0 0 0 / 20%); border-radius: 8px; grid-template-columns: repeat(5, 1fr); }
  .stats-bar strong { font-size: 1.05rem; }

  .heatmap-table { min-width: 840px; table-layout: fixed; }
  .heatmap-table th, .heatmap-table td { padding: 0.68rem 0.2rem; font-size: 0.76rem; border: 1px solid rgb(255 255 255 / 9%); }
  .heatmap-table td.cell-val { padding: 0; }
  .heatmap-table button { width: 100%; height: 38px; color: inherit; background: transparent; border: 0; cursor: pointer; }
  .year-col, .year-total { font-weight: 700; }

  .risk-summary-grid { margin-bottom: 1.6rem; grid-template-columns: repeat(3, 1fr); }
  .risk-summary-grid div { padding: 1.1rem; background: rgb(0 0 0 / 20%); border: 1px solid rgb(255 255 255 / 7%); border-radius: 8px; }
  .risk-summary-grid strong, .risk-summary-grid small { display: block; }
  .risk-summary-grid strong { margin-bottom: 0.35rem; font-size: 1.35rem; color: var(--accent); }
  .risk-summary-grid small { font-size: 0.73rem; color: #8392a5; }
  .risk-sub-title { margin-top: 0; }
  .detail-title { margin-top: 1.8rem; }
  .distribution-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.6rem; }
  .distribution-grid div { display: grid; padding: 0.8rem 0.4rem; text-align: center; background: var(--theme-soft); border: 1px solid var(--theme-border); border-radius: 7px; gap: 0.25rem; }
  .distribution-grid span, .distribution-grid small { font-size: 0.68rem; color: #9fb2cc; }
  .distribution-grid strong { font-size: 1.1rem; color: var(--theme-bright); }
  .risk-table { min-width: 760px; }

  .faq-item { border-bottom: 1px solid rgb(255 255 255 / 9%); }
  .faq-item:last-child { border-bottom: 0; }
  .faq-question { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; width: 100%; text-align: left; color: #fff; background: none; border: 0; cursor: pointer; }
  .faq-question em { font-size: 1.4rem; color: var(--accent); font-style: normal; transition: transform 0.2s ease; }
  .faq-question em.open { transform: rotate(45deg); }
  .faq-answer p { padding: 0 0 1rem; margin: 0; font-size: 0.88rem; color: #9fb2cc; line-height: 1.75; }
  @keyframes fade-in-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 768px) {
      .page-wrapper { padding: 2rem 0.75rem 3rem; }
      .main-title { font-size: 2rem; }
      .content-card { padding: 1.25rem 1rem; }
      .card-header-row, .nav-chart-header { align-items: flex-start; flex-direction: column; }
      .principle-grid { grid-template-columns: repeat(2, 1fr); }
      .holdings-note { align-items: flex-start; flex-direction: column; gap: 0.3rem; }
      .rank-rule-strip { grid-template-columns: 1fr; }
      .position-management-note { flex-direction: column; gap: 0.3rem; }
      .portfolio-view-header { align-items: flex-start; flex-direction: column; }
      .combined-table-container { overflow-x: auto; }
      .combined-portfolio-table { min-width: 820px; table-layout: auto; }
      .combined-portfolio-table th { white-space: nowrap; }
      .adjustments-grid { grid-template-columns: 1fr; gap: 1.5rem; }
      .risk-summary-grid { grid-template-columns: 1fr; }
      .stats-bar { grid-template-columns: repeat(2, 1fr); }
      .distribution-grid { grid-template-columns: repeat(2, 1fr); }
      .echart-container { height: 300px; }
  }

  @media (max-width: 420px) {
      .main-title { font-size: 1.7rem; gap: 0.55rem; }
      .subtitle { font-size: 0.95rem; }
      .principle-grid { grid-template-columns: 1fr; }
  }
</style>
