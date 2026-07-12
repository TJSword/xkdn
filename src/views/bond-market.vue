<template>
  <div class="bond-market-page">
    <main class="main-container">
      <header class="page-header">
        <router-link to="/home" class="back-button">← 返回首页</router-link>
        <h1 class="main-title">
          <FeaturePageIcon class="title-icon" type="bond-market" />
          转债全景
        </h1>
        <p class="subtitle">
          用价格、广度和估值观察可转债市场。
        </p>
      </header>

      <div v-if="hasMarketData && !isLoadingRealtime" class="market-update-strip">
        <span>数据更新</span>
        <strong>{{ marketUpdatedAt }}</strong>
        <button
          class="market-info-button"
          type="button"
          aria-label="交易时段每10分钟自动更新"
          @mouseenter="showRefreshInfoTooltip"
          @mouseleave="hideRefreshInfoTooltip"
          @focus="showRefreshInfoTooltip"
          @blur="hideRefreshInfoTooltip"
        >
          <span aria-hidden="true">i</span>
        </button>
        <!-- <button
          v-if="canForceRefresh"
          class="market-refresh-button"
          type="button"
          :disabled="isForceRefreshing"
          aria-label="刷新转债全景数据"
          title="刷新数据"
          @click="refreshBondMarket"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11a8 8 0 1 0 2 5.3" />
            <path d="M20 4v7h-7" />
          </svg>
        </button> -->
      </div>

      <div
        v-if="refreshInfoTooltip.visible"
        :class="['refresh-info-tooltip', `refresh-info-tooltip--${refreshInfoTooltip.placement}`]"
        :style="{ left: refreshInfoTooltip.x + 'px', top: refreshInfoTooltip.y + 'px' }"
      >
        交易时段每10分钟自动更新
      </div>

      <StrategyLoading
        v-if="isLoadingRealtime || !hasMarketData"
        title="正在同步转债全景"
        description="读取当前交易日实时列表与指数历史"
        monogram="CB"
        icon-type="bond-market"
        :steps="['实时列表', '日截面指标', '历史趋势']"
      />

      <section v-else class="full-metric-band" aria-label="完整市场指标">
        <article v-for="item in fullMetricCards" :key="item.label" class="full-metric-item">
          <span>{{ item.label }}</span>
          <strong :class="item.tone">{{ item.value }}</strong>
          <em>{{ item.note }}</em>
        </article>
      </section>

      <section v-if="hasMarketData" class="layer-section">
        <section class="dashboard-grid">
        <article class="panel panel-wide">
          <div class="panel-head compact">
            <div>
              <h2>市场广度</h2>
              <p>涨跌家数和当日涨跌分布</p>
            </div>
          </div>
          <div class="breadth-meter">
            <span class="up" :style="{ width: breadthBar.up }"></span>
            <span class="flat" :style="{ width: breadthBar.flat }"></span>
            <span class="down" :style="{ width: breadthBar.down }"></span>
          </div>
          <div class="breadth-labels">
            <span>上涨 {{ breadth.up }}</span>
            <span>平盘 {{ breadth.flat }}</span>
            <span>下跌 {{ breadth.down }}</span>
          </div>
          <v-chart class="chart chart-large" :option="changeDistributionOption" autoresize />
        </article>

        <article class="panel panel-wide">
          <div class="panel-head compact">
            <div>
              <h2>价格分层</h2>
              <p>每个价格段的数量、涨跌表现和上涨占比。</p>
            </div>
          </div>
          <div class="price-segment-matrix">
            <div class="price-segment-header">
              <span>价格段</span>
              <span>数量 / 占比</span>
              <span>平均涨跌幅</span>
              <span>上涨占比</span>
            </div>
            <div v-for="row in priceSegmentRows" :key="row.name" class="price-segment-row">
              <strong class="price-band">{{ row.name }}</strong>
              <div class="segment-cell">
                <div class="segment-value">
                  <strong>{{ row.count }}</strong>
                  <span>/ {{ row.shareText }}</span>
                </div>
                <div class="count-track">
                  <i :style="{ width: row.countWidth }"></i>
                </div>
              </div>
              <div class="segment-cell">
                <strong :class="row.changeTone">{{ formatPercent(row.changePct) }}</strong>
                <div class="change-track">
                  <i></i>
                  <span :class="row.changeTone" :style="row.changeStyle"></span>
                </div>
              </div>
              <div class="segment-cell">
                <strong>{{ row.upPct.toFixed(0) }}%</strong>
                <div class="up-track">
                  <i></i>
                  <span :style="{ width: row.upWidth }"></span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="panel panel-wide">
          <div class="panel-head compact">
            <div>
              <h2>溢价率分层</h2>
              <p>细分溢价区间的数量、涨跌表现和上涨占比。</p>
            </div>
          </div>
          <div class="price-segment-matrix">
            <div class="price-segment-header">
              <span>溢价率区间</span>
              <span>数量 / 占比</span>
              <span>平均涨跌幅</span>
              <span>上涨占比</span>
            </div>
            <div v-for="row in premiumSegmentRows" :key="row.name" class="price-segment-row">
              <strong class="price-band">{{ row.name }}</strong>
              <div class="segment-cell">
                <div class="segment-value">
                  <strong>{{ row.count }}</strong>
                  <span>/ {{ row.shareText }}</span>
                </div>
                <div class="count-track">
                  <i :style="{ width: row.countWidth }"></i>
                </div>
              </div>
              <div class="segment-cell">
                <strong :class="row.changeTone">{{ formatPercent(row.changePct) }}</strong>
                <div class="change-track">
                  <i></i>
                  <span :class="row.changeTone" :style="row.changeStyle"></span>
                </div>
              </div>
              <div class="segment-cell">
                <strong>{{ row.upPct.toFixed(0) }}%</strong>
                <div class="up-track">
                  <i></i>
                  <span :style="{ width: row.upWidth }"></span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="panel panel-wide">
          <div class="panel-head">
            <div>
              <h2>价格与溢价率分布</h2>
              <p>点大小代表成交额，颜色代表当日涨跌幅</p>
            </div>
            <div class="signal-pill neutral">实时样本 {{ realtimeBonds.length }} 只</div>
          </div>
          <v-chart class="chart chart-large" :option="scatterOption" autoresize />
        </article>

        <article class="panel panel-wide">
          <div class="panel-head">
            <div>
              <h2>价格 × 溢价率热力</h2>
              <p>横向看价格段，纵向看溢价率区间，颜色代表平均涨跌</p>
            </div>
          </div>
          <v-chart class="chart chart-large" :option="heatmapOption" autoresize />
        </article>

        <article class="panel panel-wide">
          <div class="panel-head">
            <div>
              <h2>强弱个券观察</h2>
              <p>不是列表复刻，只保留对市场结构有解释力的极端样本</p>
            </div>
          </div>
          <div class="bond-watch-grid">
            <div class="watch-block">
              <h3>涨幅靠前</h3>
              <div v-for="item in strongestBonds" :key="`strong-${item.code}`" class="watch-row">
                <span><b v-if="item.name && item.name !== item.code">{{ item.name }}</b><em>{{ item.code }}</em></span>
                <strong class="positive">{{ formatPercent(item.changePct) }}</strong>
              </div>
            </div>
            <div class="watch-block">
              <h3>跌幅靠前</h3>
              <div v-for="item in weakestBonds" :key="`weak-${item.code}`" class="watch-row">
                <span><b v-if="item.name && item.name !== item.code">{{ item.name }}</b><em>{{ item.code }}</em></span>
                <strong class="negative">{{ formatPercent(item.changePct) }}</strong>
              </div>
            </div>
            <div class="watch-block">
              <h3>成交活跃</h3>
              <div v-for="item in activeBonds" :key="`active-${item.code}`" class="watch-row">
                <span><b v-if="item.name && item.name !== item.code">{{ item.name }}</b><em>{{ item.code }}</em></span>
                <strong>{{ item.amount.toFixed(2) }} 亿</strong>
              </div>
            </div>
          </div>
        </article>
        </section>
      </section>

      <section v-if="hasMarketData" class="layer-section history-layer">
        <section class="dashboard-grid">
          <article class="panel panel-wide">
            <div class="panel-head">
              <div>
                <h2>指数与估值</h2>
                <p>{{ latest?.date }} 收盘，等权指数 {{ formatNumber(latest?.index || 0) }}</p>
              </div>
              <div class="panel-actions">
                <button class="range-select-button" type="button" @click="openHistoryRangeModal">
                  <span>时间范围</span>
                  <strong>{{ historyRangeLabel }}</strong>
                </button>
                <button class="icon-action-button" type="button" aria-label="全屏查看指数与估值" title="全屏查看" @click="openFullscreenTrend">
                  ⛶
                </button>
              </div>
            </div>
            <v-chart class="chart chart-large" :option="trendOption" autoresize @legendselectchanged="handleTrendLegendChange" />
          </article>
        </section>
      </section>
    </main>

    <Transition name="modal-fade">
      <div v-if="showTrendFullscreen" class="modal-backdrop chart-fullscreen-backdrop">
        <section class="modal-panel chart-fullscreen-panel">
          <div class="modal-header">
            <div>
              <span>{{ historyRangeLabel }}</span>
              <h3>指数与估值</h3>
            </div>
            <div class="panel-actions">
              <button class="range-select-button" type="button" @click="openHistoryRangeModal">
                <span>时间范围</span>
                <strong>{{ historyRangeLabel }}</strong>
              </button>
              <button type="button" class="icon-button" aria-label="关闭" title="关闭" @click="showTrendFullscreen = false">×</button>
            </div>
          </div>
          <v-chart class="chart-fullscreen" :option="trendOption" autoresize @legendselectchanged="handleTrendLegendChange" />
        </section>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="showHistoryRangeModal" class="modal-backdrop range-modal-backdrop">
        <form class="modal-panel range-modal" @submit.prevent="confirmHistoryRangeModal">
          <div class="modal-header">
            <div>
              <span>日期区间</span>
              <h3>指数与估值时间范围</h3>
            </div>
            <button type="button" class="icon-button" aria-label="关闭" title="关闭" @click="showHistoryRangeModal = false">×</button>
          </div>
          <div class="range-option-grid">
            <button
              v-for="period in historyPeriods"
              :key="period"
              type="button"
              :class="{ active: historyModalPeriod === period }"
              @click="applyHistoryModalPeriod(period)"
            >
              {{ period }}
            </button>
          </div>
          <div class="range-date-fields">
            <label>
              <span>开始日期</span>
              <input
                v-model="historyModalRange.start"
                type="date"
                :min="historyMinDate"
                :max="historyModalRange.end"
                @change="historyModalPeriod = '自定义'"
              />
            </label>
            <label>
              <span>结束日期</span>
              <input
                v-model="historyModalRange.end"
                type="date"
                :min="historyModalRange.start"
                :max="historyMaxDate"
                @change="historyModalPeriod = '自定义'"
              />
            </label>
          </div>
          <div class="modal-actions">
            <button class="button secondary" type="button" @click="showHistoryRangeModal = false">取消</button>
            <button class="button secondary featured-action" type="submit">应用区间</button>
          </div>
        </form>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
  import { callCloudFunction } from '@/services/cloudFunction'
  import { useUserStore } from '@/store/user'
  import { use } from 'echarts/core'
  import { CanvasRenderer } from 'echarts/renderers'
  import { BarChart, HeatmapChart, LineChart, ScatterChart } from 'echarts/charts'
  import { GridComponent, LegendComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
  import VChart from 'vue-echarts'

  use([CanvasRenderer, BarChart, HeatmapChart, LineChart, ScatterChart, GridComponent, LegendComponent, TooltipComponent, VisualMapComponent])

  type HistoryPoint = {
      date: string
      index: number
      changePct: number
      midChangePct?: number
      temperature: number
      avgPrice: number
      midPrice: number
      avgPremium: number
      midPremium: number
      avgYtm: number
      amount: number
      balance: number
      turnover: number
      count: number
  }

  type PriceSegment = {
      name: string
      count: number
      changePct: number
      upPct: number
  }

  type RealtimeBond = {
      code: string
      name: string
      price: number
      changePct: number
      stockChangePct: number
      premium: number
      doubleLow: number
      ytm: number
      balance: number
      amount: number
      turnover: number
      rating: string
  }

  const segmentNames = [
      '<90',
      '90-100',
      '100-110',
      '110-120',
      '120-130',
      '130-140',
      '140-160',
      '160-180',
      '180-200',
      '>=200'
  ]
  const premiumSegmentNames = ['<0%', '0-10%', '10-20%', '20-40%', '40-60%', '60-80%', '80-120%', '120-160%', '160-200%', '>=200%']
  const userStore: any = useUserStore()
  const backendHistoryRows = ref<HistoryPoint[]>([])
  const realtimeBonds = ref<RealtimeBond[]>([])
  const marketIndex = ref<HistoryPoint | null>(null)
  const realtimeTradeDate = ref('')
  const realtimeRefreshedAt = ref('')
  const realtimeDisplayAt = ref('')
  const isForceRefreshing = ref(false)
  const refreshInfoTooltip = ref({
      visible: false,
      x: 0,
      y: 0,
      placement: 'top'
  })
  let realtimeRefreshTimer: number | undefined
  const isLoadingRealtime = ref(false)
  const history = computed<HistoryPoint[]>(() => backendHistoryRows.value.slice().sort((left, right) => left.date.localeCompare(right.date)))
  const defaultHistoryEnd = ''
  const defaultHistoryStart = ''
  const historyDateRange = reactive({
      start: defaultHistoryStart,
      end: defaultHistoryEnd
  })
  const historyPeriods = ['近10日', '近1年', '全部', '自定义']
  const showHistoryRangeModal = ref(false)
  const showTrendFullscreen = ref(false)
  const historyModalPeriod = ref('近1年')
  const historyModalRange = reactive({
      start: defaultHistoryStart,
      end: defaultHistoryEnd
  })
  const trendLegendNames = ['等权指数', '平均价格', '价格中位数', '平均溢价率', '溢价率中位数', '成交额', '换手率']
  const trendLegendSelected = ref<Record<string, boolean>>({
      平均价格: false,
      平均溢价率: false,
      溢价率中位数: false,
      成交额: false,
      换手率: false
  })

  const latest = computed<HistoryPoint | null>(() => history.value.at(-1) || null)
  const latestMarketIndex = computed<HistoryPoint | null>(() => {
      const tradeDate = realtimeTradeDate.value
      return [marketIndex.value, latest.value].find(item => item?.date === tradeDate) || null
  })
  const hasMarketData = computed(() => history.value.length > 0 && realtimeBonds.value.length > 0)
  const marketUpdatedAt = computed(() => realtimeDisplayAt.value || formatRefreshedAt(realtimeRefreshedAt.value))
  const historyMinDate = computed(() => history.value[0]?.date || defaultHistoryStart)
  const historyMaxDate = computed(() => history.value.at(-1)?.date || defaultHistoryEnd)
  const canForceRefresh = computed(() => userStore.userInfo?.admin === true)

  function showRefreshInfoTooltip(event: MouseEvent | FocusEvent) {
      const target = event.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      const tooltipHalfWidth = 110
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth
      const placement = rect.top < 150 ? 'bottom' : 'top'
      const x = Math.min(Math.max(rect.left + rect.width / 2, tooltipHalfWidth + 12), viewportWidth - tooltipHalfWidth - 12)
      refreshInfoTooltip.value = {
          visible: true,
          x,
          y: placement === 'bottom' ? rect.bottom + 10 : rect.top - 10,
          placement
      }
  }

  function hideRefreshInfoTooltip() {
      refreshInfoTooltip.value.visible = false
  }

  const normalizedHistoryDateRange = computed(() => {
      const start = historyDateRange.start < historyMinDate.value ? historyMinDate.value : historyDateRange.start
      const end = historyDateRange.end > historyMaxDate.value ? historyMaxDate.value : historyDateRange.end
      return start <= end ? { start, end } : { start: end, end: start }
  })
  const historyRangeLabel = computed(() => {
      const period = getHistoryPeriod(historyDateRange)
      if (period !== '自定义') return period
      return `${formatShortDate(normalizedHistoryDateRange.value.start)} 至 ${formatShortDate(normalizedHistoryDateRange.value.end)}`
  })

  const rangedHistory = computed(() => {
      const { start, end } = normalizedHistoryDateRange.value
      return history.value.filter(item => item.date >= start && item.date <= end)
  })

  function formatShortDate(value: string) {
      return value ? value.replace(/-/g, '/') : '--'
  }

  function clampHistoryDate(value: string) {
      if (!value) return historyMaxDate.value
      if (value < historyMinDate.value) return historyMinDate.value
      if (value > historyMaxDate.value) return historyMaxDate.value
      return value
  }

  function applyHistoryPeriod(range: { start: string; end: string }, period: string) {
      const rows = history.value
      if (period === '近1年') {
          const [year, month, day] = (rows.at(-1)?.date || '').split('-').map(Number)
          const oneYearAgo = year && month && day
              ? `${String(year - 1).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              : historyMinDate.value
          range.start = rows.find(item => item.date >= oneYearAgo)?.date || historyMinDate.value
          range.end = historyMaxDate.value
          return
      }
      const countMap: Record<string, number> = { 近5日: 5, 近10日: 10 }
      const count = countMap[period]
      range.start = count ? rows[Math.max(0, rows.length - count)]?.date || historyMinDate.value : historyMinDate.value
      range.end = historyMaxDate.value
  }

  function getHistoryPeriod(range: { start: string; end: string }) {
      const candidates = historyPeriods.filter(period => period !== '自定义')
      return candidates.find(period => {
          const nextRange = { start: range.start, end: range.end }
          applyHistoryPeriod(nextRange, period)
          return nextRange.start === range.start && nextRange.end === range.end
      }) || '自定义'
  }

  function openHistoryRangeModal() {
      historyModalRange.start = normalizedHistoryDateRange.value.start
      historyModalRange.end = normalizedHistoryDateRange.value.end
      historyModalPeriod.value = getHistoryPeriod(historyModalRange)
      showHistoryRangeModal.value = true
  }

  function applyHistoryModalPeriod(period: string) {
      historyModalPeriod.value = period
      if (period !== '自定义') applyHistoryPeriod(historyModalRange, period)
  }

  function confirmHistoryRangeModal() {
      const start = clampHistoryDate(historyModalRange.start)
      const end = clampHistoryDate(historyModalRange.end)
      historyDateRange.start = start <= end ? start : end
      historyDateRange.end = start <= end ? end : start
      showHistoryRangeModal.value = false
  }

  function openFullscreenTrend() {
      showTrendFullscreen.value = true
  }

  function isTrendSeriesVisible(name: string) {
      return trendLegendSelected.value[name] !== false
  }

  function isTrendAxisVisible(names: string[]) {
      return names.some(name => isTrendSeriesVisible(name))
  }

  function handleTrendLegendChange(event: { selected?: Record<string, boolean> }) {
      if (event.selected) trendLegendSelected.value = { ...event.selected }
  }

  const breadth = computed(() => {
      const rows = realtimeBonds.value
      const up = rows.filter(item => item.changePct > 0).length
      const down = rows.filter(item => item.changePct < 0).length
      return { up, down, flat: rows.length - up - down, total: rows.length }
  })

  const breadthBar = computed(() => ({
      up: `${(breadth.value.up / (breadth.value.total || 1)) * 100}%`,
      down: `${(breadth.value.down / (breadth.value.total || 1)) * 100}%`,
      flat: `${(breadth.value.flat / (breadth.value.total || 1)) * 100}%`
  }))

  const marketIndexChangePct = computed(() => latestMarketIndex.value?.changePct ?? null)

  const realtimeAmount = computed(() => realtimeBonds.value.reduce((sum, item) => sum + item.amount, 0))

  const bondWatchLimit = 10
  const strongestBonds = computed(() => realtimeBonds.value.slice().sort((a, b) => b.changePct - a.changePct).slice(0, bondWatchLimit))
  const weakestBonds = computed(() => realtimeBonds.value.slice().sort((a, b) => a.changePct - b.changePct).slice(0, bondWatchLimit))
  const activeBonds = computed(() => realtimeBonds.value.slice().sort((a, b) => b.amount - a.amount).slice(0, bondWatchLimit))

  const currentPriceSegments = computed<PriceSegment[]>(() => segmentNames.map((name, segmentIndex) => {
      const rows = realtimeBonds.value.filter(item => getPriceBandIndex(item.price) === segmentIndex)
      const changePct = rows.length
          ? rows.reduce((sum, item) => sum + item.changePct, 0) / rows.length
          : 0
      const upCount = rows.filter(item => item.changePct > 0).length
      return {
          name,
          count: rows.length,
          changePct,
          upPct: rows.length ? (upCount / rows.length) * 100 : 0
      }
  }))

  const priceSegmentRows = computed(() => {
      const rows = currentPriceSegments.value
      const total = rows.reduce((sum, item) => sum + item.count, 0) || 1
      const maxCount = Math.max(...rows.map(item => item.count), 1)
      const maxChange = Math.max(...rows.map(item => Math.abs(item.changePct)), 1)

      return rows.map(item => {
          const changeWidth = `${Math.min(48, (Math.abs(item.changePct) / maxChange) * 48)}%`
          return {
              ...item,
              shareText: `${((item.count / total) * 100).toFixed(1)}%`,
              countWidth: `${(item.count / maxCount) * 100}%`,
              changeTone: item.changePct >= 0 ? 'positive' : 'negative',
              changeStyle:
                  item.changePct >= 0
                      ? { left: '50%', width: changeWidth }
                      : { right: '50%', width: changeWidth },
              upWidth: `${Math.max(0, Math.min(100, item.upPct))}%`
          }
      })
  })

  const premiumSegmentRows = computed(() => {
      const rows = premiumSegmentNames.map((name, index) => {
          const bonds = realtimeBonds.value.filter(item => getPremiumSegmentIndex(item.premium) === index)
          const changePct = bonds.length
              ? bonds.reduce((sum, item) => sum + item.changePct, 0) / bonds.length
              : 0
          const upPct = bonds.length
              ? (bonds.filter(item => item.changePct > 0).length / bonds.length) * 100
              : 0
          return { name, count: bonds.length, changePct, upPct }
      })
      const total = rows.reduce((sum, item) => sum + item.count, 0) || 1
      const maxCount = Math.max(...rows.map(item => item.count), 1)
      const maxChange = Math.max(...rows.map(item => Math.abs(item.changePct)), 1)

      return rows.map(item => {
          const changeWidth = `${Math.min(48, (Math.abs(item.changePct) / maxChange) * 48)}%`
          return {
              ...item,
              shareText: `${((item.count / total) * 100).toFixed(1)}%`,
              countWidth: `${(item.count / maxCount) * 100}%`,
              changeTone: item.changePct >= 0 ? 'positive' : 'negative',
              changeStyle: item.changePct >= 0
                  ? { left: '50%', width: changeWidth }
                  : { right: '50%', width: changeWidth },
              upWidth: `${Math.max(0, Math.min(100, item.upPct))}%`
          }
      })
  })

  const fullMetricCards = computed(() => {
      const latestIndex = latestMarketIndex.value
      return [
          {
              label: '等权指数涨跌',
              value: marketIndexChangePct.value === null ? '--' : formatPercent(marketIndexChangePct.value),
              note: latestIndex ? '日截面等权涨跌' : '等待日截面更新',
              tone: marketIndexChangePct.value === null ? 'neutral' : marketIndexChangePct.value >= 0 ? 'positive' : 'negative'
          },
          {
              label: '中位数涨跌',
              value: latestIndex?.midChangePct === undefined ? '--' : formatPercent(latestIndex.midChangePct),
              note: latestIndex?.midChangePct === undefined ? '日截面未返回前一日中位数' : '价格中位数日涨跌',
              tone: latestIndex?.midChangePct === undefined ? 'neutral' : latestIndex.midChangePct >= 0 ? 'positive' : 'negative'
          },
          {
              label: '价格中位数',
              value: latestIndex ? latestIndex.midPrice.toFixed(2) : '--',
              note: latestIndex ? `日截面平均价 ${latestIndex.avgPrice.toFixed(2)}` : '等待日截面更新',
              tone: 'neutral'
          },
          {
              label: '溢价率中位数',
              value: latestIndex ? `${latestIndex.midPremium.toFixed(2)}%` : '--',
              note: latestIndex ? `日截面平均 ${latestIndex.avgPremium.toFixed(2)}%` : '等待日截面更新',
              tone: 'neutral'
          },
          { label: '上涨占比', value: `${((breadth.value.up / (breadth.value.total || 1)) * 100).toFixed(1)}%`, note: `${breadth.value.up}/${breadth.value.total} 只上涨`, tone: 'positive' },
          { label: '成交热度', value: `${realtimeAmount.value.toFixed(2)} 亿`, note: '实时个债列表成交额合计', tone: 'neutral' },
          {
              label: '到期收益率',
              value: latestIndex ? `${latestIndex.avgYtm.toFixed(2)}%` : '--',
              note: latestIndex ? '日截面平均到期收益率' : '等待日截面更新',
              tone: latestIndex ? latestIndex.avgYtm >= 0 ? 'positive' : 'negative' : 'neutral'
          },
          { label: '实时样本', value: `${realtimeBonds.value.length} 只`, note: '当前转债列表', tone: 'neutral' }
      ]
  })

  const trendOption = computed(() => {
      const rows = rangedHistory.value
      const dates = rows.map(item => item.date)
      return baseOption({
          tooltip: { trigger: 'axis' },
          legend: {
              top: 2,
              type: 'scroll',
              data: trendLegendNames,
              textStyle: { color: '#b7c6d8', fontSize: 14 },
              selected: trendLegendSelected.value
          },
          grid: { left: 46, right: 128, top: 48, bottom: 38 },
          xAxis: axis('category', dates),
          yAxis: [
              { ...valueAxis('指数'), show: isTrendAxisVisible(['等权指数']) },
              { ...valueAxis('价格'), show: isTrendAxisVisible(['平均价格', '价格中位数']), position: 'right', axisLabel: { color: '#8aa0b8', fontSize: 14 } },
              { ...valueAxis('百分比'), show: isTrendAxisVisible(['平均溢价率', '溢价率中位数', '换手率']), position: 'right', offset: 48, axisLabel: { color: '#8aa0b8', fontSize: 14, formatter: '{value}%' } },
              { ...valueAxis('成交额'), show: isTrendAxisVisible(['成交额']), position: 'right', offset: 96, axisLabel: { color: '#8aa0b8', fontSize: 14, formatter: '{value}亿' } }
          ],
          series: [
              lineSeries('等权指数', rows.map(item => item.index), '#f59e0b'),
              lineSeries('平均价格', rows.map(item => item.avgPrice), '#d8e8ff', 1),
              lineSeries('价格中位数', rows.map(item => item.midPrice), '#8fa3bb', 1),
              lineSeries('平均溢价率', rows.map(item => item.avgPremium), '#7bc8a4', 2),
              lineSeries('溢价率中位数', rows.map(item => item.midPremium), '#9fb9d3', 2),
              lineSeries('成交额', rows.map(item => item.amount), '#c8d7e8', 3),
              lineSeries('换手率', rows.map(item => item.turnover), '#94a3b8', 2)
          ]
      })
  })

  const changeDistributionOption = computed(() => {
      const bins = [
          { name: '<-15%', min: -Infinity, max: -15 },
          { name: '-15~-10%', min: -15, max: -10 },
          { name: '-10~-5%', min: -10, max: -5 },
          { name: '-5~-2%', min: -5, max: -2 },
          { name: '-2~0%', min: -2, max: 0 },
          { name: '0~2%', min: 0, max: 2 },
          { name: '2~5%', min: 2, max: 5 },
          { name: '5~10%', min: 5, max: 10 },
          { name: '10~15%', min: 10, max: 15 },
          { name: '>15%', min: 15.000001, max: Infinity }
      ]
      return baseOption({
          tooltip: { trigger: 'axis' },
          grid: { left: 34, right: 18, top: 18, bottom: 52 },
          xAxis: {
              ...axis('category', bins.map(item => item.name)),
              axisLabel: { color: '#8aa0b8', fontSize: 14, rotate: 30 }
          },
          yAxis: valueAxis('数量'),
          series: [
              {
                  type: 'bar',
                  data: bins.map(bin => realtimeBonds.value.filter(item => item.changePct >= bin.min && item.changePct < bin.max).length),
                  itemStyle: { borderRadius: [5, 5, 0, 0], color: '#f59e0b' }
              }
          ],
          media: [
              {
                  query: { maxWidth: 520 },
                  option: {
                      grid: { left: 26, right: 8, top: 18, bottom: 40, containLabel: true },
                      xAxis: { axisLabel: { fontSize: 9, rotate: 0, interval: 1 } },
                      yAxis: { name: '', axisLabel: { fontSize: 10 } }
                  }
              }
          ]
      })
  })

  const scatterOption = computed(() => baseOption({
      tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
              const item = params.data.raw as RealtimeBond
              return `${item.name} ${item.code}<br/>价格: ${item.price.toFixed(2)}<br/>涨跌: ${formatPercent(item.changePct)}<br/>溢价率: ${item.premium.toFixed(2)}%<br/>成交额: ${item.amount.toFixed(2)} 亿`
          }
      },
      visualMap: {
          show: false,
          min: -8,
          max: 12,
          dimension: 2,
          orient: 'horizontal',
          left: 'center',
          bottom: 0,
          textStyle: { color: '#a8b6c9' },
          inRange: { color: ['#5cc99a', '#d1d5db', '#f87171'] }
      },
      grid: { left: 58, right: 14, top: 12, bottom: 42, containLabel: false },
      xAxis: { ...valueAxis('价格（元）'), nameLocation: 'middle', nameGap: 26 },
      yAxis: { ...valueAxis('溢价率'), nameLocation: 'middle', nameGap: 40 },
      series: [
          {
              name: '可转债',
              type: 'scatter',
              symbolSize: (value: number[]) => Math.max(8, Math.min(32, value[3] * 1.4)),
              data: realtimeBonds.value.map(item => ({
                  value: [item.price, item.premium, item.changePct, item.amount],
                  raw: item
              })),
              itemStyle: { opacity: 0.86, borderColor: '#0f172a', borderWidth: 1 }
          }
      ],
      media: [
          {
              query: { maxWidth: 520 },
              option: {
                  grid: { left: 50, right: 8, top: 12, bottom: 40, containLabel: false },
                  xAxis: { name: '价格（元）', nameLocation: 'middle', nameGap: 24, axisLabel: { fontSize: 10 } },
                  yAxis: { name: '溢价率', nameLocation: 'middle', nameGap: 32, axisLabel: { fontSize: 10 } }
              }
          }
      ]
  }))

  const heatmapOption = computed(() => {
      const cells = buildHeatmapCells()
      const maxAbsChange = Math.max(
          1,
          ...cells.filter(cell => cell.count > 0).map(cell => Math.abs(cell.avgChange))
      )
      const data = cells.map(cell => [cell.priceIndex, cell.premiumIndex, Number(cell.avgChange.toFixed(2)), cell.count])
      return baseOption({
          tooltip: {
              position: 'top',
              formatter: (params: any) => {
                  const priceLabel = segmentNames[params.data[0]]
                  const premiumLabel = premiumSegmentNames[params.data[1]]
                  return `${priceLabel} / ${premiumLabel}<br/>平均涨跌: ${formatPercent(params.data[2])}<br/>样本: ${params.data[3]} 只`
              }
          },
          grid: { left: 62, right: 24, top: 28, bottom: 28 },
          xAxis: axis('category', segmentNames),
          yAxis: axis('category', premiumSegmentNames),
          visualMap: {
              show: false,
              dimension: 2,
              min: -maxAbsChange,
              max: maxAbsChange,
              calculable: true,
              orient: 'horizontal',
              left: 'center',
              bottom: 0,
              textStyle: { color: '#b0c4de' },
              inRange: { color: ['#37c991', '#263342', '#f06c76'] }
          },
          series: [
              {
                  type: 'heatmap',
                  data,
                  label: {
                      show: true,
                      color: '#f8fbff',
                      formatter: (params: any) => `${params.data[3]}`
                  },
                  itemStyle: {
                      borderColor: 'rgba(255, 255, 255, 0.08)',
                      borderWidth: 1
                  }
              }
          ],
          media: [
              {
                  query: { maxWidth: 520 },
                  option: {
                      grid: { left: 40, right: 8, top: 18, bottom: 26, containLabel: true },
                      xAxis: { axisLabel: { fontSize: 9, interval: 1 } },
                      yAxis: { axisLabel: { fontSize: 9, interval: 1 } },
                      series: [{ label: { fontSize: 9 } }]
                  }
              }
          ]
      })
  })

  function buildHeatmapCells() {
      const cells: Array<{ priceIndex: number; premiumIndex: number; avgChange: number; count: number }> = []
      for (let priceIndex = 0; priceIndex < segmentNames.length; priceIndex += 1) {
          for (let premiumIndex = 0; premiumIndex < premiumSegmentNames.length; premiumIndex += 1) {
              cells.push({ priceIndex, premiumIndex, avgChange: 0, count: 0 })
          }
      }

      realtimeBonds.value.forEach(item => {
          const priceIndex = getPriceBandIndex(item.price)
          const premiumIndex = getPremiumSegmentIndex(item.premium)
          const cell = cells.find(candidate => candidate.priceIndex === priceIndex && candidate.premiumIndex === premiumIndex)
          if (!cell) return

          cell.avgChange = (cell.avgChange * cell.count + item.changePct) / (cell.count + 1)
          cell.count += 1
      })

      return cells
  }

  function getPriceBandIndex(price: number) {
      if (price < 90) return 0
      if (price < 100) return 1
      if (price < 110) return 2
      if (price < 120) return 3
      if (price < 130) return 4
      if (price < 140) return 5
      if (price < 160) return 6
      if (price < 180) return 7
      if (price < 200) return 8
      return 9
  }

  function getPremiumSegmentIndex(premium: number) {
      if (premium < 0) return 0
      if (premium < 10) return 1
      if (premium < 20) return 2
      if (premium < 40) return 3
      if (premium < 60) return 4
      if (premium < 80) return 5
      if (premium < 120) return 6
      if (premium < 160) return 7
      if (premium < 200) return 8
      return 9
  }

  function baseOption(option: Record<string, any>) {
      return {
          backgroundColor: 'transparent',
          textStyle: { color: '#dbe7f3', fontFamily: 'inherit', fontSize: 14 },
          ...option
      }
  }

  function axis(type: 'category' | 'value', data?: string[]) {
      return {
          type,
          data,
          axisLine: { lineStyle: { color: '#32465f' } },
          axisTick: { show: false },
          axisLabel: { color: '#8aa0b8', fontSize: 14 },
          splitLine: { show: type === 'value', lineStyle: { color: 'rgba(148, 163, 184, 0.16)' } }
      }
  }

  function valueAxis(name: string) {
      return {
          ...axis('value'),
          name,
          nameTextStyle: { color: '#8aa0b8', fontSize: 14, padding: [0, 0, 4, 0] }
      }
  }

  function lineSeries(name: string, data: number[], color: string, yAxisIndex = 0, xAxisIndex = 0) {
      return {
          name,
          type: 'line',
          xAxisIndex,
          yAxisIndex,
          data,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 3, color },
          itemStyle: { color },
          areaStyle: { opacity: 0.08, color }
      }
  }

  async function loadBondMarketData(forceRefresh = false) {
      if (isLoadingRealtime.value) return
      isLoadingRealtime.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'strategyTaskGateway',
              data: { action: forceRefresh ? 'refreshBondMarket' : 'readBondMarket' }
          })
          const result = response.result || {}
          const data = result.data || {}
          if (Array.isArray(data.historyRows) && data.historyRows.length > 0) {
              backendHistoryRows.value = data.historyRows
              applyHistoryPeriod(historyDateRange, '近1年')
          }
          if (Array.isArray(data.realtimeRows)) realtimeBonds.value = data.realtimeRows
          marketIndex.value = data.marketIndex || null
          realtimeTradeDate.value = data.realtimeTradeDate || ''
          realtimeRefreshedAt.value = data.realtimeRefreshedAt || ''
          realtimeDisplayAt.value = data.realtimeDisplayAt || ''
          if (result.success === false) console.warn(result.message || '转债全景实时数据暂不可用')
      } catch (error) {
          console.warn('转债全景后端数据加载失败，保留本地全量历史:', error)
      } finally {
          isLoadingRealtime.value = false
      }
  }

  async function refreshBondMarket() {
      if (isForceRefreshing.value) return
      isForceRefreshing.value = true
      try {
          await loadBondMarketData(true)
      } finally {
          isForceRefreshing.value = false
      }
  }

  function isScheduledRealtimeRefresh(date = new Date()) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Shanghai',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
      }).formatToParts(date).map(part => [part.type, part.value]))
      const hour = Number(parts.hour)
      const minute = Number(parts.minute)
      if (minute % 10 !== 0) return false
      return (hour === 9 && minute >= 30) || hour === 10 ||
          (hour === 11 && minute <= 30) || hour === 13 || hour === 14 ||
          (hour === 15 && minute === 0)
  }

  function scheduleRealtimeRefresh() {
      const now = new Date()
      const next = new Date(now)
      next.setSeconds(30, 0)
      next.setMinutes(Math.floor(now.getMinutes() / 10 + 1) * 10)
      realtimeRefreshTimer = window.setTimeout(async () => {
          if (isScheduledRealtimeRefresh()) await loadBondMarketData()
          scheduleRealtimeRefresh()
      }, Math.max(1000, next.getTime() - now.getTime()))
  }

  function formatNumber(value: number) {
      return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function formatPercent(value: number) {
      return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  function formatRefreshedAt(value: string) {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          hour12: false,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
      }).replaceAll('/', '-')
  }

  onMounted(() => {
      void loadBondMarketData()
      scheduleRealtimeRefresh()
  })
  onBeforeUnmount(() => {
      if (realtimeRefreshTimer !== undefined) window.clearTimeout(realtimeRefreshTimer)
  })
</script>

<style scoped lang="scss">
  @keyframes fadeInUp {
      from {
          opacity: 0;
          transform: translateY(20px);
      }

      to {
          opacity: 1;
          transform: translateY(0);
      }
  }

  .bond-market-page {
      min-height: 100vh;
      padding: 3rem 1rem;
      color: #fff;
      font-family: 'Noto Sans SC', sans-serif;
      background: radial-gradient(circle at 15% 50%, #3a2411, transparent 40%),
          radial-gradient(circle at 85% 50%, #1f2d4a, transparent 40%), #121212;
      background-color: #121212;
      box-sizing: border-box;
  }

  .main-container {
      margin: 0 auto;
      width: 100%;
      max-width: 900px;
  }

  .page-header {
      margin-bottom: 3rem;
      text-align: center;
      opacity: 0;
      animation: fadeInUp 0.5s ease-out forwards;
  }

  .back-button {
      display: inline-block;
      margin-bottom: 1rem;
      color: #b0c4de;
      font-size: 0.9rem;
      text-decoration: none;
      transition: color 0.3s ease;
  }

  .back-button:hover {
      color: #f59e0b;
  }

  .main-title {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
      color: #fff;
      font-size: 2.5rem;
      font-weight: 700;
      letter-spacing: 0;
  }

  .title-icon {
      width: 2.8rem;
      height: 2.8rem;
      color: #f59e0b;
      filter: drop-shadow(0 0 12px rgb(245 158 11 / 70%));
  }

  .subtitle {
      color: #b0c4de;
      font-size: 1.1rem;
      line-height: 1.7;
  }

  .market-update-strip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.55rem;
      margin: -1.5rem 0 1rem;
      color: #8fa3bb;
      font-size: 0.86rem;
      opacity: 0;
      animation: fadeInUp 0.5s ease-out 0.12s forwards;
  }

  .market-update-strip strong {
      color: #f5d59a;
      font-weight: 700;
  }

  .market-refresh-button {
      display: inline-grid;
    //   flex: 0 0 1.15rem;
      width: 0.85rem;
      height: 0.85rem;
      padding: 0;
      color: #f5d59a;
      background: transparent;
      border: 0;
      cursor: pointer;
      place-items: center;
      transition: color 0.2s ease;
      margin-bottom: 0.1rem;
  }

  .market-refresh-button svg {
      width: 0.85rem;
      height: 0.85rem;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
  }

  .market-refresh-button:hover:not(:disabled) {
      color: #fff;
      transform: none;
  }

  .market-refresh-button:disabled {
      cursor: wait;
      opacity: 0.55;
  }

  .market-info-button {
       display: inline-grid;
    //   flex: 0 0 1.15rem;
      width: 0.85rem;
      height: 0.85rem;
      padding: 0;
      color: #f5d59a;
      background: transparent;
      border: 0;
      cursor: pointer;
      place-items: center;
      transition: color 0.2s ease;
      margin-bottom: 0.1rem;
    //   flex-basis: 1.05rem;
      width: 0.85rem;
      height: 0.85rem;
      border: 1px solid currentColor;
      border-radius: 50%;
      background-color: transparent;
      box-shadow: none;
      font-family: Georgia, serif;
      font-size: 0.65rem;
      font-weight: 700;
      line-height: 1;
      margin-top: 0.2rem;
  }

  .market-info-button:hover {
      transform: none;
  }

  .refresh-info-tooltip {
      position: fixed;
      z-index: 5000;
      width: max-content;
      max-width: calc(100vw - 24px);
      padding: 0.65rem 0.75rem;
      color: #f8e2ae;
      background: rgb(42 30 15 / 98%);
      border: 1px solid rgb(245 158 11 / 55%);
      border-radius: 6px;
      box-shadow: 0 8px 24px rgb(0 0 0 / 35%), 0 0 18px rgb(245 158 11 / 12%);
      font-size: 0.78rem;
      font-weight: 400;
      line-height: 1.55;
      pointer-events: none;
      text-align: left;
      white-space: nowrap;
  }

  .refresh-info-tooltip--top {
      transform: translate(-50%, -100%);
  }

  .refresh-info-tooltip--bottom {
      transform: translate(-50%, 0);
  }

  .full-metric-band {
      display: grid;
      gap: 1rem;
      margin-bottom: 1.5rem;
  }

  .full-metric-band {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      opacity: 0;
      animation: fadeInUp 0.5s ease-out 0.2s forwards;
  }

  .full-metric-item,
  .panel {
      min-width: 0;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 12px;
      transition: border-color 0.3s ease;
      backdrop-filter: blur(10px);
  }

  .full-metric-item:hover,
  .panel:hover {
      border-color: rgb(245 158 11 / 50%);
  }

  .full-metric-item {
      padding: 0.9rem 1rem;
      background: rgb(0 0 0 / 16%);
      border-radius: 8px;
  }

  .full-metric-item span {
      display: block;
      color: #b0c4de;
      font-size: 0.82rem;
  }

  .full-metric-item strong {
      display: block;
      margin-top: 0.48rem;
      color: #fff;
      font-size: 1.42rem;
      line-height: 1.2;
  }

  .full-metric-item strong {
      font-size: 1.08rem;
  }

  .full-metric-item em {
      display: block;
      margin-top: 0.42rem;
      color: #8fa3bb;
      font-size: 0.8rem;
      font-style: normal;
  }

  .positive {
      color: #f87171 !important;
  }

  .negative {
      color: #5cc99a !important;
  }

  .neutral {
      color: #dbe7f3 !important;
  }

  .layer-section {
      position: relative;
      padding-top: 0;
      margin-top: 1.5rem;
  }

  .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.5rem;
  }

  .panel {
      min-width: 0;
      padding: 1.5rem 2rem;
      opacity: 0;
      animation: fadeInUp 0.5s ease-out forwards;
  }

  .panel:nth-child(1) {
      animation-delay: 0.2s;
  }

  .panel:nth-child(2) {
      animation-delay: 0.3s;
  }

  .panel:nth-child(3) {
      animation-delay: 0.4s;
  }

  .panel:nth-child(4) {
      animation-delay: 0.5s;
  }

  .panel:nth-child(5) {
      animation-delay: 0.6s;
  }

  .panel:nth-child(6) {
      animation-delay: 0.7s;
  }

  .panel-wide {
      grid-column: span 2;
  }

  .panel-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
  }

  .panel-head.compact {
      min-height: 54px;
  }

  .panel h2 {
      padding-left: 1rem;
      margin: 0;
      color: #fff;
      font-size: 1.4rem;
      font-weight: bold;
      letter-spacing: 0;
      border-left: 4px solid #f59e0b;
  }

  .panel p {
      margin: 0.5rem 0 0 1.25rem;
      color: #b0c4de;
      font-size: 0.95rem;
      line-height: 1.7;
  }

  .signal-pill {
      flex: 0 0 auto;
      padding: 0.38rem 0.65rem;
      color: #d8e8ff;
      background: rgb(0 0 0 / 28%);
      border: 1px solid rgb(176 196 222 / 24%);
      border-radius: 6px;
      font-size: 0.82rem;
  }

  .signal-pill.warm {
      color: #fecdd3;
      border-color: rgb(248 113 113 / 30%);
      background: rgb(127 29 29 / 18%);
  }

  .signal-pill.cool {
      color: #bbf7d0;
      border-color: rgb(92 201 154 / 30%);
      background: rgb(20 83 45 / 18%);
  }

  .panel-actions {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 0.65rem;
  }

  .range-select-button,
  .icon-action-button,
  .button,
  .icon-button {
      display: inline-flex;
      align-items: center;
      color: #dbe8f3;
      background: rgb(0 0 0 / 24%);
      border: 1px solid rgb(176 196 222 / 22%);
      border-radius: 7px;
      cursor: pointer;
      font: inherit;
      transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
  }

  .range-select-button {
      padding: 0.4rem 0.65rem;
      gap: 0.55rem;
  }

  .range-select-button:hover,
  .icon-action-button:hover,
  .button:hover,
  .icon-button:hover {
      border-color: rgb(245 158 11 / 48%);
      background: rgb(245 158 11 / 10%);
  }

  .range-select-button span {
      color: #8fa3bb;
      font-size: 0.76rem;
  }

  .range-select-button strong {
      color: #f59e0b;
      font-size: 0.82rem;
  }

  .icon-action-button,
  .icon-button {
      justify-content: center;
      width: 2.2rem;
      height: 2.2rem;
      padding: 0;
      color: #f5d59a;
      font-size: 1rem;
      line-height: 1;
  }

  .modal-fade-enter-active,
  .modal-fade-leave-active {
      transition: opacity 0.2s ease;
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
      opacity: 0;
  }

  .modal-backdrop {
      position: fixed;
      z-index: 40;
      display: grid;
      padding: 1rem;
      background: rgb(0 0 0 / 62%);
      backdrop-filter: blur(10px);
      inset: 0;
      place-items: center;
  }

  .chart-fullscreen-backdrop {
      z-index: 50;
  }

  .range-modal-backdrop {
      z-index: 60;
  }

  .modal-panel {
      width: min(94vw, 480px);
      padding: 1.4rem;
      background: rgb(18 18 18 / 94%);
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 12px;
      box-shadow: 0 24px 70px rgb(0 0 0 / 58%);
  }

  .modal-header,
  .modal-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
  }

  .modal-header span {
      color: #8fa3bb;
      font-size: 0.78rem;
  }

  .modal-header h3 {
      margin: 0.18rem 0 0;
      color: #fff;
      font-size: 1.18rem;
      letter-spacing: 0;
  }

  .range-option-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.6rem;
      margin-top: 1.25rem;
  }

  .range-option-grid button {
      padding: 0.5rem 0.45rem;
      color: #b0c4de;
      background: rgb(0 0 0 / 22%);
      border: 1px solid rgb(176 196 222 / 18%);
      border-radius: 7px;
      cursor: pointer;
      font: inherit;
      font-size: 0.84rem;
  }

  .range-option-grid button.active {
      color: #f5d59a;
      background: linear-gradient(90deg, rgb(245 158 11 / 14%), rgb(245 158 11 / 4%));
      border-color: rgb(245 158 11 / 68%);
      box-shadow: 0 0 0 1px rgb(245 158 11 / 10%), 0 0 18px rgb(245 158 11 / 12%);
      font-weight: 700;
  }

  .range-date-fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.8rem;
      margin-top: 1rem;
  }

  .range-date-fields label {
      display: grid;
      gap: 0.45rem;
      color: #8fa3bb;
      font-size: 0.78rem;
  }

  .range-date-fields input {
      min-width: 0;
      padding: 0.58rem 0.65rem;
      color: #f5d59a;
      background: rgb(0 0 0 / 24%);
      border: 1px solid rgb(176 196 222 / 22%);
      border-radius: 7px;
      font: inherit;
      font-size: 0.9rem;
  }

  .range-date-fields input[type='date']::-webkit-calendar-picker-indicator {
      cursor: pointer;
      filter: invert(0.78);
      opacity: 0.85;
  }

  .modal-actions {
      justify-content: flex-end;
      margin-top: 1.2rem;
  }

  .button {
      justify-content: center;
      min-width: 5.6rem;
      padding: 0.55rem 0.85rem;
  }

  .featured-action {
      color: #f5d59a;
      background: linear-gradient(90deg, rgb(245 158 11 / 14%), rgb(245 158 11 / 4%));
      border-color: rgb(245 158 11 / 68%);
      box-shadow: 0 0 0 1px rgb(245 158 11 / 10%), 0 0 18px rgb(245 158 11 / 12%);
      font-weight: 700;
  }

  .featured-action:hover {
      background: linear-gradient(90deg, rgb(245 158 11 / 20%), rgb(245 158 11 / 7%));
      border-color: rgb(245 158 11 / 82%);
      box-shadow: 0 0 0 1px rgb(245 158 11 / 18%), 0 0 24px rgb(245 158 11 / 18%);
  }

  .chart-fullscreen-panel {
      width: min(94vw, 1180px);
      height: min(86vh, 760px);
      display: flex;
      flex-direction: column;
  }

  .chart-fullscreen {
      flex: 1;
      width: 100%;
      min-height: 0;
      margin-top: 1rem;
  }

  .chart {
      width: 100%;
      height: 280px;
  }

  .chart-large {
      height: 360px;
  }

  .price-segment-matrix {
      overflow: hidden;
      border: 1px solid rgb(255 255 255 / 8%);
      border-radius: 8px;
      background: rgb(0 0 0 / 12%);
  }

  .price-segment-header,
  .price-segment-row {
      display: grid;
      grid-template-columns: 1.05fr 1.25fr 1.25fr 1.15fr;
      gap: 1rem;
      align-items: center;
  }

  .price-segment-header {
      padding: 0.8rem 1rem;
      color: #b0c4de;
      background: rgb(245 158 11 / 7%);
      border-bottom: 1px solid rgb(255 255 255 / 8%);
      font-size: 0.82rem;
      font-weight: 700;
  }

  .price-segment-row {
      min-height: 54px;
      padding: 0.7rem 1rem;
      border-bottom: 1px solid rgb(255 255 255 / 6%);
  }

  .price-segment-row:last-child {
      border-bottom: 0;
  }

  .price-band {
      color: #fff;
      font-size: 0.95rem;
  }

  .segment-cell {
      min-width: 0;
  }

  .segment-cell > strong,
  .segment-value strong {
      color: #f8fbff;
      font-size: 0.9rem;
  }

  .segment-value {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
  }

  .segment-value span {
      color: #8fa3bb;
      font-size: 0.78rem;
  }

  .count-track,
  .change-track,
  .up-track {
      position: relative;
      overflow: hidden;
      height: 7px;
      margin-top: 0.45rem;
      background: rgb(255 255 255 / 7%);
      border-radius: 999px;
  }

  .count-track i,
  .up-track span,
  .change-track span {
      position: absolute;
      top: 0;
      bottom: 0;
      border-radius: inherit;
  }

  .count-track i {
      left: 0;
      background: #f59e0b;
  }

  .change-track {
      overflow: visible;
  }

  .change-track i,
  .up-track i {
      position: absolute;
      top: -3px;
      bottom: -3px;
      left: 50%;
      width: 1px;
      background: rgb(255 255 255 / 42%);
      content: '';
  }

  .change-track span.positive {
      background: #f87171;
  }

  .change-track span.negative {
      background: #5cc99a;
  }

  .up-track i {
      background: rgb(255 255 255 / 50%);
  }

  .up-track span {
      left: 0;
      background: linear-gradient(90deg, rgb(245 158 11 / 35%), #f59e0b);
  }

  .breadth-meter {
      display: flex;
      overflow: hidden;
      height: 12px;
      margin: 0.8rem 0 0.5rem;
      background: rgb(0 0 0 / 20%);
      border: 1px solid rgb(255 255 255 / 8%);
      border-radius: 6px;
  }

  .breadth-meter span {
      min-width: 2px;
  }

  .breadth-meter .down {
      background: #5cc99a;
  }

  .breadth-meter .flat {
      background: #94a3b8;
  }

  .breadth-meter .up {
      background: #f87171;
  }

  .breadth-labels {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      color: #b0c4de;
      font-size: 0.78rem;
  }

  .bond-watch-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 1rem;
  }

  .watch-block {
      padding: 1rem;
      background: rgb(0 0 0 / 18%);
      border: 1px solid rgb(255 255 255 / 8%);
      border-radius: 8px;
  }

  .watch-block h3 {
      padding-bottom: 0.55rem;
      margin: 0 0 0.75rem;
      color: #fff;
      font-size: 1rem;
      border-bottom: 1px solid rgb(255 255 255 / 8%);
  }

  .watch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.48rem 0;
      color: #d8e8ff;
      border-bottom: 1px solid rgb(255 255 255 / 5%);
      font-size: 0.88rem;
  }

  .watch-row:last-child {
      border-bottom: 0;
  }

  .watch-row span {
      display: flex;
      align-items: baseline;
      gap: 0.32rem;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
  }

  .watch-row b {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
  }

  .watch-row em {
      color: #8fa3bb;
      font-size: 0.76rem;
      font-style: normal;
  }

  .watch-row strong {
      flex: 0 0 auto;
      color: #fff;
      font-size: 0.86rem;
  }

  @media (max-width: 1100px) {
      .main-container {
          max-width: 900px;
      }
  }

  @media (min-width: 861px) and (max-width: 1080px) {
      .full-metric-band {
          grid-template-columns: repeat(3, minmax(0, 1fr));
      }
  }

  @media (max-width: 860px) {
      .bond-market-page {
          padding: 2rem 1rem;
      }

      .page-header {
          margin-bottom: 2.5rem;
      }

      .back-button {
          display: block;
          margin-bottom: 1.5rem;
          font-size: 1rem;
          font-weight: 500;
      }

      .main-title {
          font-size: 2rem;
          gap: 0.8rem;
      }

      .title-icon {
          width: 2.8rem;
          height: 2.8rem;
      }

      .subtitle {
          font-size: 1rem;
      }

      .market-update-strip {
          gap: 0.35rem;
          margin: -0.75rem 0 1.25rem;
          font-size: 0.78rem;
          white-space: nowrap;
      }

      .full-metric-band {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
      }

      .dashboard-grid {
          grid-template-columns: 1fr;
      }

      .panel-wide {
          grid-column: auto;
      }

      .panel-head {
          flex-direction: column;
      }

      .panel-actions {
          width: 100%;
          flex-wrap: wrap;
          align-items: stretch;
      }

      .range-select-button {
          flex: 1 1 auto;
          justify-content: space-between;
      }

      .range-option-grid,
      .range-date-fields {
          grid-template-columns: 1fr;
      }

      .chart-fullscreen-panel {
          height: 82vh;
      }

      .panel {
          padding: 1.25rem 1rem;
      }

      .panel h2 {
          font-size: 1.2rem;
      }

      .panel p {
          margin-left: 1.15rem;
          font-size: 0.88rem;
      }

      .price-segment-header {
          display: grid;
          grid-template-columns: 0.8fr repeat(3, minmax(0, 1fr));
          gap: 0.4rem;
          padding: 0.65rem 0.75rem;
          font-size: 0.7rem;
      }

      .price-segment-row {
          grid-template-columns: 0.8fr repeat(3, minmax(0, 1fr));
          gap: 0.4rem;
          padding: 0.75rem;
      }

      .price-band {
          grid-column: auto;
          font-size: 0.88rem;
      }

      .segment-cell {
          min-width: 0;
      }

      .count-track,
      .change-track,
      .up-track {
          display: none;
      }

      .bond-watch-grid {
          grid-template-columns: 1fr;
      }

      .chart,
      .chart-large {
          height: 300px;
      }
  }

  @media (max-width: 520px) {
      .bond-market-page {
          padding: 2rem 1rem;
      }

      .full-metric-item {
          padding: 0.85rem;
      }

      .full-metric-item strong {
          font-size: 1.05rem;
      }

      .full-metric-item em {
          min-height: 0;
          font-size: 0.72rem;
      }

      .panel {
          padding: 1rem 0.75rem;
      }

      .chart-large {
          height: 280px;
      }

      .price-segment-row {
          gap: 0.35rem;
          padding: 0.65rem;
      }

      .segment-cell > strong,
      .segment-value strong {
          font-size: 0.82rem;
      }

      .segment-value span {
          font-size: 0.7rem;
      }
    .market-refresh-button{
        margin-bottom:0.05rem
    }
  }
</style>
