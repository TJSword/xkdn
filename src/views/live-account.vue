<template>
  <div class="page-wrapper">
    <main class="main-container">
      <header class="page-header">
        <router-link to="/home" class="back-button">← 返回主页</router-link>
        <h1><FeaturePageIcon type="live-account" />老何实盘</h1>
        <p class="subtitle">{{ latest.date ? '数据截至 ' + latest.date : loading ? '正在读取实盘数据' : '暂无记录' }}</p>
      </header>

      <StrategyLoading v-if="loading && !overview" mode="page" icon-type="live-account" title="正在加载实盘数据" description="同步账户净值、收益表现与持仓比例" />
      <div v-if="error" class="data-status" role="alert">{{ error }} <button @click="loadData" :disabled="loading">重试</button></div>
      <button v-if="errorCode === 'SOURCE_NOT_CONFIGURED' && userStore.userInfo?.admin" class="bind-button" :disabled="loading" @click="bindSource">将当前账户的账本绑定为老何实盘</button>
      <p v-if="overview && !points.length" class="empty-state">投资账本暂无记录。</p>
      <template v-if="points.length">
      <section class="profit-overview" aria-label="账户收益率">
        <div class="metrics-grid profit-grid">
          <article v-for="period in profitPeriods" :key="period.key" class="content-card metric-card">
            <span>{{ period.label }}收益率</span>
            <strong :class="tone(accountReturns[period.key])">{{ percent(accountReturns[period.key]) }}</strong>
            <small>{{ period.start === latest.date ? latest.date : period.start + ' 至 ' + latest.date }}</small>
          </article>
        </div>
      </section>

      <section class="content-card chart-card">
        <div class="section-header"><h2>净值走势</h2><ChartDateRangePicker v-model:start="chartStart" v-model:end="chartEnd" :min-date="points[0].date" :max-date="latest.date" accent="#5397b5" include-year-to-date /></div>
        <div class="nav-summary"><div><span>最新净值</span><strong>{{ latest.nav.toFixed(4) }}</strong><small>截至 {{ latest.date }} · 初始净值 1.0000</small></div><div class="drawdown-summary"><span>当前回撤</span><strong :class="tone(currentDrawdown)">{{ percent(currentDrawdown) }}</strong><small>截至 {{ latest.date }} · 较历史最高净值</small></div></div>
        <section class="range-returns" aria-label="所选区间收益率">
          <div class="range-returns-heading"><span>区间收益率</span><small>{{ chartStart }} 至 {{ chartEnd }}</small></div>
          <div class="range-returns-grid">
            <div v-for="(item, index) in rangeReturns" :key="item.strategyId" class="range-return-item">
              <span v-if="index === 0" class="account-name">{{ item.name }}</span>
              <span v-else class="strategy-info"><i :style="{ background: item.color }"></i>{{ item.name }}<span class="strategy-help"><button type="button" :aria-label="item.name + '的策略说明'" :aria-describedby="'range-intro-' + index" @keydown.esc="($event.target as HTMLButtonElement).blur()">ⓘ</button><span :id="'range-intro-' + index" role="tooltip" class="strategy-intro">{{ strategyDescriptions[item.strategyId] }}</span></span></span>
              <strong :class="item.value === null ? '' : tone(item.value)">{{ item.value === null ? '—' : percent(item.value) }}</strong>
            </div>
          </div>
        </section>
        <p class="chart-description">账户与各策略以各自首条记录净值 1.0000 为起点；点击图例可显示或隐藏曲线，切换区间保留原始净值。</p>
        <v-chart v-if="visiblePoints.length" class="nav-chart" :option="chartOption" autoresize />
        <p v-else class="empty-state">所选区间暂无净值记录，请选择其他日期。</p>
      </section>

      <section class="content-card allocation-card">
        <div class="section-header"><h2>持仓比例</h2><label class="holding-date"><input v-model="holdingDate" type="date" :min="points[0].date" :max="latest.date" aria-label="持仓记录日期" @input="stopPlayback" /></label></div>
        <div class="holding-replay">
          <button type="button" class="play-button" :disabled="replayDates.length < 2" :aria-pressed="isPlaying" @click="togglePlayback">{{ isPlaying ? '暂停' : '播放' }}</button>
          <div class="replay-track"><input type="range" min="0" :max="Math.max(0, replayDates.length - 1)" :value="Math.max(0, replayIndex)" :disabled="!replayDates.length" aria-label="持仓回放时间轴" :aria-valuetext="holdingDate" @input="seekHolding" /><div class="replay-dates"><span>{{ replayDates[0] }}</span><strong>{{ holdingDate }}</strong><span>{{ replayDates.at(-1) }}</span></div></div>
        </div>
        <div class="holding-return">截至所选日期 · 账户今年收益率 <strong :class="tone(holdingReturn)">{{ percent(holdingReturn) }}</strong></div>
        <div v-if="holdings.length" class="allocation-content">
          <v-chart class="allocation-chart" :option="allocationOption" autoresize />
          <div class="allocation-legend"><div class="legend-head"><span>策略 / 图例</span><span>持仓占比 · 今年收益率</span></div><div v-for="item in holdings" :key="item.strategyId" class="holding-legend-row"><div><span class="strategy-info"><i :style="{ background: item.color }"></i>{{ item.name }}</span></div><div class="holding-values"><strong>{{ item.weight.toFixed(1) }}%</strong><span :class="tone(holdingStrategyReturns[item.strategyId])">{{ percent(holdingStrategyReturns[item.strategyId]) }}</span><small v-if="item.recordedDate !== holdingDate" class="holding-asof">记录于 {{ item.recordedDate }}</small></div></div><p class="legend-note">颜色对应环形图；占比为该日策略资产占账户总资产的比例。</p></div>
        </div>
        <p v-else class="empty-state">该日期暂无持仓记录，请选择有记录的日期。</p>
        <p v-if="holdings.length" class="account-note">{{ holdingDate || '未选择日期' }} · 账本持仓快照。未更新的策略沿用此前最近记录；现金仅在账本单独记录时展示。</p>
      </section>
      <p class="page-note">收益率按扣除出入金的净值计算。数据通常于交易日收盘后半小时内更新，具体以页面显示的数据日期为准。</p>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { getLiveOverview, bindLiveAccount } from '@/services/liveAccount'
import type { LiveOverview, LivePoint } from '@/services/liveAccount'
import { useUserStore } from '@/store/user'
import VChart from 'vue-echarts'
import StrategyLoading from '@/components/StrategyLoading.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, GraphicComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, LegendComponent, GraphicComponent])

const userStore = useUserStore()
const overview = ref<LiveOverview | null>(null)
const loading = ref(false)
const error = ref('')
const errorCode = ref('')
const chartStart = ref('')
const chartEnd = ref('')
const holdingDate = ref('')
const points = computed(() => overview.value?.points || [])
const latest = computed(() => points.value[points.value.length - 1] || { date: '', nav: 1, dailyReturn: 0, drawdown: 0 })
const strategies = computed(() => overview.value?.strategies || [])
const strategyDescriptions = computed<Record<string, string>>(() => Object.fromEntries(strategies.value.map(strategy => [
  strategy.strategyId,
  strategy.description || '暂无策略说明。'
])))
const holdings = computed(() => overview.value?.snapshots.find(snapshot => snapshot.date === holdingDate.value)?.holdings || [])
const replayDates = computed(() => (overview.value?.snapshots || []).map(snapshot => snapshot.date).filter(date => date >= latest.value.date.slice(0, 4) + '-01-01').sort())
const replayIndex = computed(() => replayDates.value.indexOf(holdingDate.value))
const isPlaying = ref(false)
let playbackTimer: ReturnType<typeof setInterval> | undefined
function stopPlayback() {
  clearInterval(playbackTimer)
  playbackTimer = undefined
  isPlaying.value = false
}
function seekHolding(event: Event) {
  stopPlayback()
  holdingDate.value = replayDates.value[Number((event.target as HTMLInputElement).value)]
}
function togglePlayback() {
  if (isPlaying.value) return stopPlayback()
  if (replayDates.value.length < 2) return
  if (replayIndex.value < 0 || replayIndex.value === replayDates.value.length - 1) holdingDate.value = replayDates.value[0]
  const dates = [...replayDates.value]
  const startIndex = replayIndex.value
  const startedAt = performance.now()
  const millisecondsPerStep = 6000 / (dates.length - 1)
  isPlaying.value = true
  playbackTimer = setInterval(() => {
    const index = Math.min(dates.length - 1, startIndex + Math.floor((performance.now() - startedAt) / millisecondsPerStep))
    holdingDate.value = dates[index]
    if (index === dates.length - 1) stopPlayback()
  }, 16)
}
const holdingReturn = computed(() => intervalReturn(points.value, holdingDate.value.slice(0, 4) + '-01-01', holdingDate.value))
const holdingStrategyReturns = computed(() => Object.fromEntries(strategies.value.map(strategy => [strategy.strategyId, intervalReturn(strategy.points, holdingDate.value.slice(0, 4) + '-01-01', holdingDate.value)])))
async function loadData() {
  if (loading.value) return
  loading.value = true
  try {
    const data = await getLiveOverview()
    const previousLatest = latest.value.date
    const nextLatest = data.points[data.points.length - 1]?.date || ''
    if (!overview.value || !chartStart.value) chartStart.value = nextLatest ? (nextLatest.slice(0, 4) + '-01-01' > data.points[0].date ? nextLatest.slice(0, 4) + '-01-01' : data.points[0].date) : ''
    if (!chartEnd.value || chartEnd.value === previousLatest) chartEnd.value = nextLatest
    if (!isPlaying.value && (!holdingDate.value || holdingDate.value === previousLatest)) holdingDate.value = nextLatest
    overview.value = data
    error.value = ''
    errorCode.value = ''
  } catch (cause: any) {
    error.value = (overview.value ? '同步失败，当前显示上次成功读取的数据。' : '') + (cause?.message || '读取失败')
    errorCode.value = cause?.code || ''
  } finally {
    loading.value = false
  }
}
async function bindSource() {
  if (loading.value) return
  loading.value = true
  try {
    await bindLiveAccount()
  } catch (cause: any) {
    error.value = cause?.message || '绑定失败'
    return
  } finally {
    loading.value = false
  }
  await loadData()
}
let refreshTimer: ReturnType<typeof setInterval>
const refreshWhenVisible = () => { if (document.visibilityState === 'visible') void loadData() }
const handleVisibility = () => { if (document.visibilityState !== 'visible') stopPlayback(); else refreshWhenVisible() }
onMounted(() => {
  void loadData()
  refreshTimer = setInterval(refreshWhenVisible, 60000)
  window.addEventListener('focus', refreshWhenVisible)
  document.addEventListener('visibilitychange', handleVisibility)
})
onBeforeUnmount(() => {
  clearInterval(refreshTimer)
  stopPlayback()
  window.removeEventListener('focus', refreshWhenVisible)
  document.removeEventListener('visibilitychange', handleVisibility)
})
const allocationOption = computed(() => ({
  animation: false,
  tooltip: { trigger: 'item', renderMode: 'richText', confine: true, formatter: (params: { name: string; value: number; data: { strategyId: string } }) => params.name + '：' + Number(params.value).toFixed(1) + '%' },
  graphic: [{ type: 'text', left: 'center', top: 'middle', silent: true, style: { text: '持仓配置', fill: '#a5c2d0', fontSize: 14, align: 'center', verticalAlign: 'middle' } }],
  series: [{ type: 'pie', radius: ['48%', '64%'], center: ['50%', '50%'], label: { show: true, position: 'outside', formatter: '{b}', color: '#b4cbd6', fontSize: 12, alignTo: 'edge', edgeDistance: 6, overflow: 'truncate', width: 78 }, labelLine: { show: true, length: 12, length2: 10 }, labelLayout: { hideOverlap: true }, emphasis: { scale: false }, itemStyle: { borderRadius: 4, borderWidth: 3, borderColor: '#192b35' }, data: holdings.value.map(item => ({ strategyId: item.strategyId, name: item.name, value: item.weight, itemStyle: { color: item.color } })) }]
}))
const percent = (value: number | null) => value === null ? '—' : (value > 0 ? '+' : '') + (value * 100).toFixed(2) + '%'
const tone = (value: number | null) => value === null ? '' : value > 0 ? 'positive' : value < 0 ? 'negative' : ''
const profitPeriods = computed(() => {
  if (!latest.value.date) return []
  const date = latest.value.date
  const weekStart = new Date(date + 'T00:00:00Z')
  weekStart.setUTCDate(weekStart.getUTCDate() - (weekStart.getUTCDay() + 6) % 7)
  return [
    { key: 'day', label: '当日', start: date },
    { key: 'week', label: '本周', start: weekStart.toISOString().slice(0, 10) },
    { key: 'month', label: '本月', start: date.slice(0, 7) + '-01' },
    { key: 'year', label: '今年', start: date.slice(0, 4) + '-01-01' }
  ]
})
function intervalReturn(series: LivePoint[], start: string, end: string): number | null {
  const rows = series.filter(point => point.date <= end)
  const first = rows.findIndex(point => point.date >= start)
  if (first < 0) return null
  const baseline = first > 0 ? rows[first - 1].nav : rows[first].nav
  return baseline > 0 ? rows[rows.length - 1].nav / baseline - 1 : null
}
const accountReturns = computed(() => Object.fromEntries(profitPeriods.value.map(period => [period.key, intervalReturn(points.value, period.start, latest.value.date)])))
const currentDrawdown = computed(() => latest.value.drawdown || 0)
const visiblePoints = computed(() => points.value.filter(point => point.date >= chartStart.value && point.date <= chartEnd.value))
const rangeReturns = computed(() => [{ strategyId: 'account', name: '账户整体', color: '#f1f5f9', points: points.value }, ...strategies.value].map(series => ({
  ...series,
  value: intervalReturn(series.points, chartStart.value, chartEnd.value)
})))
const chartOption = computed(() => ({
  animation: false,
  legend: { type: 'scroll', top: 0, textStyle: { color: '#b4cbd6' } },
  grid: { left: 52, right: 18, top: 45, bottom: 35 },
  tooltip: { trigger: 'axis', backgroundColor: '#162b36', borderColor: '#365c70', textStyle: { color: '#eef0f2' }, valueFormatter: (value: number) => Number(value).toFixed(4) },
  xAxis: { type: 'category', boundaryGap: false, data: visiblePoints.value.map(point => point.date), axisLabel: { color: '#8da9b8', hideOverlap: true }, axisLine: { lineStyle: { color: '#36505f' } } },
  yAxis: { type: 'value', scale: true, axisLabel: { color: '#8da9b8', formatter: (value: number) => value.toFixed(3) }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.07)', type: 'dashed' } } },
  series: [
    { name: '账户整体', color: '#f1f5f9', points: points.value },
    ...strategies.value
  ].map(series => ({
    name: series.name,
    type: 'line',
    showSymbol: false,
    data: visiblePoints.value.map(point => {
      const recorded = series.points.filter(row => row.date <= point.date).at(-1)
      return recorded?.nav ?? null
    }),
    lineStyle: { color: series.color, width: series.name === '账户整体' ? 3 : 1.8 },
    itemStyle: { color: series.color }
  }))
}))
</script>

<style scoped>
.data-status { padding: 1rem; margin-bottom: 1rem; color: #f0c77a; border: 1px solid #665539; border-radius: 8px; }
.data-status button, .bind-button { padding: 0.5rem 0.8rem; color: #d5d9dd; background: #162b36; border: 1px solid #365c70; border-radius: 7px; cursor: pointer; }
.holding-asof { display: block; margin-top: 4px; color: #8da9b8; font-size: 0.7rem; font-weight: 400; }
.page-wrapper { min-height: 100vh; padding: 3rem 1rem 4rem; box-sizing: border-box; font-family: 'Noto Sans SC', sans-serif; color: #fff; background: radial-gradient(circle at 14% 18%, rgb(83 151 181 / 22%), transparent 34%), radial-gradient(circle at 84% 14%, rgb(62 112 145 / 16%), transparent 30%), #0f1820; }
.main-container { max-width: 960px; margin: auto; }
.page-header { text-align: center; margin-bottom: 3rem; }
.back-button { display: inline-block; color: #b4cbd6; font-size: 0.9rem; text-decoration: none; margin-bottom: 1rem; }
h1 { display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-size: 2.5rem; margin: 0 0 0.5rem; }
.subtitle { color: #b4cbd6; font-size: 1.1rem; line-height: 1.7; margin: 0; }
.content-card { min-width: 0; padding: 1.5rem; border: 1px solid rgb(255 255 255 / 10%); border-radius: 12px; background: rgb(83 151 181 / 7%); backdrop-filter: blur(10px); }
.section-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
h2 { font-size: 1.15rem; margin: 0; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin: 1.5rem 0; }
.allocation-card { margin-top: 1.5rem; }
.allocation-content { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 2rem; }
.allocation-chart { height: 250px; }
.holding-replay { display: flex; align-items: center; gap: 1rem; margin-top: 1.5rem; }
.play-button { min-width: 88px; padding: 0.6rem; color: #5397b5; border: 1px solid #365c70; border-radius: 7px; background: rgb(83 151 181 / 8%); cursor: pointer; }
.play-button:disabled { opacity: 0.4; cursor: default; }
.replay-track { flex: 1; min-width: 0; }
.replay-track input { display: block; width: 100%; margin: 0; accent-color: #5397b5; cursor: pointer; }
.replay-dates { display: flex; justify-content: space-between; gap: 6px; margin-top: 8px; font-size: 0.7rem; color: #8da9b8; }
.replay-dates strong { color: #dce0e4; }
.holding-return { margin-top: 1.25rem; color: #8da9b8; font-size: 0.8rem; }
.holding-return strong { margin-left: 8px; font-size: 1.1rem; }
.legend-head, .legend-note { color: #8da9b8; font-size: 0.75rem; line-height: 1.7; }
.holding-legend-row { padding: 8px 0; border-bottom: 1px solid rgb(255 255 255 / 7%); }
.holding-values { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.holding-values > span { display: inline-block; min-width: 75px; margin-left: 12px; }
@media (max-width: 640px) { .replay-dates { flex-wrap: wrap; }.holding-replay { gap: 0.6rem; } }
.range-returns { margin-top: 1.5rem; padding: 1rem 0; border-top: 1px solid rgb(255 255 255 / 7%); border-bottom: 1px solid rgb(255 255 255 / 7%); }
.range-returns-heading { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem; color: #b4cbd6; font-size: 0.85rem; }
.range-returns-heading small { color: #8da9b8; }
.range-returns-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 1rem; margin-top: 1rem; }
.range-return-item { text-align: center; }
.range-return-item strong { display: block; margin-top: 0.7rem; font-size: 1.3rem; font-weight: 500; font-variant-numeric: tabular-nums; }
.account-name, .strategy-info { color: #c1d5df; font-size: 0.8rem; }
.strategy-info { display: inline-flex; align-items: center; gap: 6px; }
.strategy-help { position: relative; display: inline-flex; }
.strategy-help button { color: inherit; font-size: inherit; }
.strategy-info button { display: inline-flex; align-items: center; gap: 6px; padding: 0; background: none; border: 0; font-family: inherit; cursor: help; text-align: left; }
.strategy-info button:focus-visible { outline: 1px solid #5397b5; outline-offset: 4px; }
.strategy-intro { display: none; position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 5; width: 230px; max-width: 65vw; padding: 12px; background: #162b36; border: 1px solid #365c70; border-radius: 8px; box-shadow: 0 8px 24px rgb(0 0 0 / 30%); color: #dce0e4; font-size: 0.8rem; line-height: 1.7; font-weight: 400; }
.strategy-intro::after { content: ''; position: absolute; left: 0; right: 0; top: 100%; height: 8px; }
.strategy-help:hover .strategy-intro, .strategy-help:focus-within .strategy-intro { display: block; white-space: pre-wrap; overflow-wrap: anywhere; }
.range-return-item:last-child .strategy-intro { left: auto; right: 0; }
@media (max-width: 640px) { .range-returns-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.range-return-item:nth-child(even) .strategy-intro { left: auto; right: 0; }.range-return-item:last-child .strategy-intro { left: 0; right: auto; } }
.nav-summary { display: flex; justify-content: space-between; gap: 1.5rem; margin-top: 1.5rem; }
.nav-summary span, .nav-summary small { display: block; color: #8da9b8; font-size: 0.8rem; }
.nav-summary strong { display: block; font-size: 2rem; margin: 0.5rem 0; font-weight: 500; }
.drawdown-summary { text-align: right; }
.drawdown-summary strong { font-size: 1.3rem; }
.holding-date { display: flex; align-items: center; }
.holding-date input { color: #5397b5; background: rgb(0 0 0 / 24%); border: 1px solid rgb(83 151 181 / 22%); border-radius: 7px; padding: 0.4rem 0.65rem; font-family: inherit; font-size: 0.82rem; font-weight: 700; color-scheme: dark; cursor: pointer; transition: border-color 0.2s ease, background 0.2s ease; }
.holding-date input:hover { background: rgb(83 151 181 / 10%); border-color: rgb(83 151 181 / 48%); }
.empty-state { padding: 3rem 1rem; text-align: center; color: #8da9b8; }
@media (max-width: 640px) { .allocation-content { grid-template-columns: 1fr; gap: 1rem; }.allocation-card .section-header { align-items: flex-start; flex-direction: column; }.nav-summary { flex-wrap: wrap; } }
.allocation-legend { display: grid; gap: 10px; font-size: 0.85rem; }
.allocation-legend > div { display: flex; justify-content: space-between; gap: 1rem; }
.allocation-legend .strategy-info { display: flex; align-items: center; gap: 9px; color: #c1d5df; }
.profit-overview { margin-top: 1.5rem; }
.profit-grid { margin-bottom: 1.25rem; }
.profit-grid .metric-card { padding: 0.85rem 1.25rem; }
.profit-grid .metric-card strong { margin: 0.4rem 0; font-size: clamp(1.15rem, 2.2vw, 1.6rem); white-space: nowrap; font-variant-numeric: tabular-nums; }
.metric-card span { display: block; color: #b4cbd6; font-size: 0.85rem; }.metric-card strong { display: block; font-size: 2rem; font-weight: 500; margin: 0.75rem 0; color: #e2e8f0; }.metric-card small { color: #8da9b8; font-size: 0.75rem; }
.section-header h2 { padding-left: 12px; border-left: 3px solid #5397b5; }.section-hint { color: #8da9b8; font-size: 0.8rem; }
.page-note { margin-top: 1.5rem; text-align: center; font-size: 0.8rem; color: #8da9b8; line-height: 1.8; }
@media (max-width: 640px) { .page-wrapper { padding: 2rem 0.75rem; }h1 { font-size: 2rem; }.subtitle { font-size: 0.95rem; }.page-header { margin-bottom: 2rem; }.content-card { padding: 1.25rem; }.metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }.chart-card .section-header { align-items: flex-start; flex-direction: column; } }
.nav-chart { height: 330px; margin-top: 1rem; }
.chart-description, .account-note { color: #8da9b8; font-size: 0.8rem; line-height: 1.8; }
i { display: inline-block; width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; }
td { padding: 16px 10px; border-bottom: 1px solid rgb(255 255 255 / 7%); text-align: center; color: #c9d5e2; white-space: nowrap; font-variant-numeric: tabular-nums; }
.positive, .metric-card strong.positive { color: #f87171; }
.negative, .metric-card strong.negative { color: #4ade80; }
@media (max-width: 640px) { .nav-chart { height: 260px; }.metric-card strong { font-size: 1.65rem; } }
</style>
