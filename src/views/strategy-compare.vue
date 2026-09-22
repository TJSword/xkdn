<template>
  <main class="comparison-page">
    <div class="selection" aria-label="选择对比策略">
      <label v-for="item in comparisonStrategies" :key="item.id" :style="{ '--color': item.color }" :class="{ checked: selected.includes(item.id) }">
        <input v-model="selected" type="checkbox" :value="item.id" />
        <span class="dot" aria-hidden="true"></span>
        <span>{{ item.name }}</span>
        <svg class="selection-check" aria-hidden="true" viewBox="0 0 16 16"><path d="m3.5 8 3 3 6-6" /></svg>
      </label>
    </div>
    <div v-if="!visibleStrategies.length" class="empty">尚未选择策略，请点击上方标签选择要对比的策略。</div>
    <template v-else>
      <h3 class="section-heading">策略特点</h3>
      <div class="table-scroll feature-table"><table><thead><tr><th>对比维度</th><th v-for="item in visibleStrategies" :key="item.id" :style="{ color: item.color }">{{ item.name }}</th></tr></thead><tbody><tr v-for="row in featureRows" :key="row.key"><th>{{ row.label }}</th><td v-for="item in visibleStrategies" :key="item.id" :data-strategy="item.name">{{ item[row.key] }}</td></tr></tbody></table></div>
      <h3 class="section-heading">历史表现</h3>
      <div v-if="loading" class="empty" role="status">正在读取六个策略的历史数据…</div>
      <div v-else-if="error" class="empty" role="alert">{{ error }} <button @click="loadData">重试</button></div>
      <template v-else>
        <p v-if="missingNames.length" class="warning">{{ missingNames.join('、') }}缺少有效历史数据。请重试或取消这些策略后对比。<button @click="loadData">重试</button></p>
        <div class="period">
          <ChartDateRangePicker v-model:start="dateRangeStart" v-model:end="dateRangeEnd" :min-date="chartMinDate" :max-date="chartMaxDate" accent="#a9caff" show-dates />
          <span>{{ aligned.dates.length }} 个共同估值日</span>
        </div>
        <div v-if="aligned.dates.length < 2 || missingNames.length" class="empty">当前没有足够的共同数据，无法计算对比指标。</div>
        <template v-else>
          <section v-for="kind in ['returns', 'risk']" :key="kind">
          <h3 class="section-heading">{{ kind === 'returns' ? '收益表现' : '风险表现' }}</h3>
          <div class="chart-panel"><h3>{{ kind === 'returns' ? '累计收益' : '历史回撤' }}</h3><v-chart :option="chartOptions[kind]" class="comparison-chart" autoresize /></div>
          <p v-if="kind === 'risk'" class="heatmap-note"><span class="heatmap-scale" aria-hidden="true"></span>同指标内底色越亮越优：回撤越接近零、波动率越低，夏普与卡玛越高；描边为已选策略中的最优值（含并列）。</p>
          <div class="table-scroll numeric-table" :class="{ 'risk-heatmap': kind === 'risk' }"><table><thead><tr><th>指标</th><th v-for="item in visibleStrategies" :key="item.id" :style="{ color: item.color }">{{ item.name }}</th></tr></thead><tbody><tr v-for="row in metricRows[kind]" :key="row.key"><th>{{ row.label }}</th><td v-for="item in visibleStrategies" :key="item.id" :style="kind === 'risk' ? riskHeatmap[row.key]?.[item.id]?.style : undefined" :class="{ 'metric-best': kind === 'risk' && riskHeatmap[row.key]?.[item.id]?.best }" :title="kind === 'risk' ? riskHeatmap[row.key]?.[item.id]?.label : undefined">{{ metricValue(item.id, row.key, row.unit) }}</td></tr></tbody></table></div>
          <template v-if="kind === 'returns'"><h3>年度收益 <small>首尾年份可能只覆盖部分时间</small></h3><p class="heatmap-note"><span class="heatmap-scale" aria-hidden="true"></span>同年内底色越亮，收益越高；描边为已选策略中的最高收益（含并列）。</p><div class="table-scroll numeric-table annual-heatmap"><table><thead><tr><th>年份</th><th v-for="item in visibleStrategies" :key="item.id" :style="{ color: item.color }">{{ item.name }}</th></tr></thead><tbody><tr v-for="year in years" :key="year"><th>{{ year }}</th><td v-for="item in visibleStrategies" :key="item.id" :style="annualHeatmap[year]?.[item.id]?.style" :class="{ 'year-best': annualHeatmap[year]?.[item.id]?.best }" :title="annualHeatmap[year]?.[item.id]?.label" :aria-label="annualHeatmap[year]?.[item.id]?.label">{{ annualValue(item.id, year) }}</td></tr></tbody></table></div></template>
          </section>
          <p class="note methodology">数据来自网站现有历史策略序列，可能包含回测与后续跟踪，并非统一的实盘账户收益；费用沿用各源数据，不额外调整。累计收益从共同起点归一化，年化按自然日计算；波动率、夏普按250个交易日、2%无风险利率计算。仅取共同有效日期，不补齐缺失净值；若源数据缺失交易日，风险指标可能受采样影响。历史表现不代表未来收益。</p>
        </template>
      </template>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import ChartDateRangePicker from '@/components/ChartDateRangePicker.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { comparisonStrategies } from '@/utils/strategyCatalog'
import { alignComparison, type ComparisonSource } from '@/utils/strategyComparison'
import type { StrategyStats } from '@/utils/strategyMetrics'
import { callCloudFunction, throwIfAuthExpired } from '@/services/cloudFunction'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const selected = ref(comparisonStrategies.map(item => item.id))
const dateRangeStart = ref('')
const dateRangeEnd = ref('')
const featureRows: { key: 'asset' | 'method' | 'allocation' | 'schedule' | 'operation' | 'risk'; label: string }[] = [
  { key: 'asset', label: '投资对象' }, { key: 'method', label: '核心方法' }, { key: 'allocation', label: '配置方式' }, { key: 'schedule', label: '调仓安排' }, { key: 'operation', label: '操作与参与要求' }, { key: 'risk', label: '主要风险' }
]
const sources = ref<Record<string, ComparisonSource>>({})
const loading = ref(true)
const error = ref('')
const visibleStrategies = computed(() => comparisonStrategies.filter(item => selected.value.includes(item.id)))
const missingNames = computed(() => visibleStrategies.value.filter(item => alignComparison(sources.value, [item.id]).dates.length < 2).map(item => item.name))
const comparisonIds = comparisonStrategies.map(item => item.id)
const fullAlignment = computed(() => alignComparison(sources.value, comparisonIds))
const chartMinDate = computed(() => fullAlignment.value.dates[0] || '')
const chartMaxDate = computed(() => fullAlignment.value.dates[fullAlignment.value.dates.length - 1] || '')
const aligned = computed(() => alignComparison(sources.value, comparisonIds, { start: dateRangeStart.value, end: dateRangeEnd.value }))
const visibleSeries = computed(() => aligned.value.series.filter(item => selected.value.includes(item.id)))
const years = computed(() => visibleSeries.value[0]?.years.map(item => item.year) || [])
const metricRows: Record<string, { key: keyof StrategyStats; label: string; unit: string }[]> = {
  returns: [{ key: 'totalReturn', label: '累计收益', unit: '%' }, { key: 'annualizedReturn', label: '年化收益', unit: '%' }],
  risk: [{ key: 'maxDrawdown', label: '最大回撤', unit: '%' }, { key: 'volatility', label: '年化波动率', unit: '%' }, { key: 'sharpe', label: '夏普比率', unit: '' }, { key: 'calmar', label: '卡玛比率', unit: '' }]
}
function metricValue(id: string, key: keyof StrategyStats, unit: string) {
  const value = aligned.value.series.find(item => item.id === id)?.stats?.[key]
  return value && value !== '--' ? `${value}${unit}` : '—'
}
function annualValue(id: string, year: number) {
  const value = aligned.value.series.find(item => item.id === id)?.years.find(item => item.year === year)?.total
  return value === undefined ? '—' : `${value}%`
}
const annualHeatmap = computed(() => Object.fromEntries(years.value.map(year => {
  const entries = visibleSeries.value.map(series => {
    const total = series.years.find(row => row.year === year)?.total
    return { id: series.id, value: total === undefined ? NaN : Number(total) }
  }).filter(item => Number.isFinite(item.value))
  const low = Math.min(...entries.map(item => item.value))
  const high = Math.max(...entries.map(item => item.value))
  const leaders = entries.filter(item => item.value === high).length
  return [year, Object.fromEntries(entries.map(item => {
    const strength = high > low ? (item.value - low) / (high - low) : 0
    const best = entries.length > 1 && item.value === high
    const name = comparisonStrategies.find(strategy => strategy.id === item.id)?.name
    return [item.id, {
      style: { backgroundColor: `rgba(56, 189, 248, ${(0.04 + strength * 0.3).toFixed(3)})` },
      best,
      label: `${year}年 · ${name} · ${item.value.toFixed(2)}%${best ? (leaders > 1 ? ' · 同年并列最高' : ' · 同年最高') : ''}`
    }]
  }))]
})))
const riskHeatmap = computed(() => Object.fromEntries(metricRows.risk.map(row => {
  const entries = visibleSeries.value.map(series => {
    const raw = series.stats?.[row.key]
    const value = raw === undefined || raw === '--' ? NaN : Number(raw)
    const score = row.key === 'volatility' || row.key === 'maxDrawdown' ? -Math.abs(value) : value
    return { id: series.id, value, score }
  }).filter(item => Number.isFinite(item.value))
  const low = Math.min(...entries.map(item => item.score))
  const high = Math.max(...entries.map(item => item.score))
  const leaders = entries.filter(item => item.score === high).length
  return [row.key, Object.fromEntries(entries.map(item => {
    const strength = high > low ? (item.score - low) / (high - low) : 0
    const best = entries.length > 1 && item.score === high
    const name = comparisonStrategies.find(strategy => strategy.id === item.id)?.name
    return [item.id, {
      style: { backgroundColor: `rgba(56, 189, 248, ${(0.04 + strength * 0.3).toFixed(3)})` },
      best,
      label: `${row.label} · ${name} · ${metricValue(item.id, row.key, row.unit)}${best ? (leaders > 1 ? ' · 并列最优' : ' · 最优') : ''}`
    }]
  }))]
})))
const chartOptions = computed(() => Object.fromEntries(['returns', 'risk'].map(kind => [kind, buildChartOption(kind)])))
function buildChartOption(kind: string) { return ({
  animation: false,
  backgroundColor: 'transparent', tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${Number(value).toFixed(2)}%` },
  legend: { textStyle: { color: '#b4c2d3' }, top: 0 },
  grid: { left: 65, right: 24, top: 50, bottom: 35 },
  xAxis: { type: 'category', data: aligned.value.dates, axisLabel: { color: '#94a3b8' }, boundaryGap: false },
  yAxis: { type: 'value', axisLabel: { color: '#94a3b8', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#283342' } } },
  series: visibleSeries.value.map(series => {
    const strategy = comparisonStrategies.find(item => item.id === series.id) as typeof comparisonStrategies[number]
    let peak = 1
    return { name: strategy.name, type: 'line', showSymbol: false, itemStyle: { color: strategy.color }, lineStyle: { width: 2 }, data: series.values.map(value => { peak = Math.max(peak, value); return (kind === 'returns' ? value - 1 : value / peak - 1) * 100 }) }
  })
}) }
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const response: any = await callCloudFunction({ name: 'getPortfolioAnalysisData', data: { strategyIds: comparisonStrategies.map(item => item.id) } })
    const data = response.result?.data?.strategies
    if (!data || !Object.keys(data).length) throw new Error('missing data')
    sources.value = data
    if (!dateRangeStart.value) dateRangeStart.value = chartMinDate.value
    if (!dateRangeEnd.value) dateRangeEnd.value = chartMaxDate.value
  } catch (err) {
    throwIfAuthExpired(err)
    error.value = '历史数据暂时无法加载，请稍后重试。'
  } finally { loading.value = false }
}
onMounted(loadData)
</script>

<style scoped>
.comparison-page { max-width: 1200px; margin: auto; padding: 32px 24px 64px; }
h3 { margin-top: 28px; font-size: 17px; } p, small { color: #99a9be; } small { font-size: 12px; font-weight: normal; }
button { padding: 8px 13px; border: 1px solid #354156; border-radius: 8px; color: #b9d4ff; background: #1c2634; cursor: pointer; } button:hover { background: #2b3b50; }
.selection { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0; }
.selection label { position: relative; display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 14px; border: 1px solid #ffffff0d; border-radius: 999px; color: #99a9be; background: #ffffff03; font-size: 14px; cursor: pointer; user-select: none; transition: background-color .18s, border-color .18s, color .18s; }
.selection label:hover { border-color: #ffffff30; background: #ffffff0d; }
.selection .checked { border-color: #ffffff1a; color: #e8eef7; background: #ffffff0d; }
.selection .checked:hover { background: #ffffff14; }
.selection label:has(input:focus-visible) { outline: 2px solid #a9caff; outline-offset: 3px; }
.selection input { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.dot { width: 6px; height: 6px; flex-shrink: 0; border-radius: 50%; background: var(--color); opacity: .4; }
.checked .dot { opacity: 1; }
.selection-check { width: 14px; height: 14px; margin-left: 2px; fill: none; stroke: #aebed2; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; visibility: hidden; }
.checked .selection-check { visibility: visible; }
@media (prefers-reduced-motion: reduce) { .selection label { transition: none; } }
.section-heading { margin: 32px 0 16px; padding-top: 24px; border-top: 1px solid #303a49; font-size: 19px; }
.comparison-page > .section-heading:first-of-type, section > .section-heading { padding-top: 0; border-top: 0; }
.table-scroll { overflow-x: auto; border: 1px solid #303a49; border-radius: 12px; margin: 18px 0; }table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; line-height: 1.8; }th, td { min-width: 150px; padding: 18px 16px; text-align: left; border-bottom: 1px solid #293342; vertical-align: top; }th { background: #1d2735; color: #d7e1f0; }td { background: #161e29; color: #bdc9da; }tr:last-child td, tr:last-child th { border-bottom: 0; }tr > th:first-child { position: sticky; left: 0; z-index: 1; min-width: 100px; width: 100px; }
.note { font-size: 12px; line-height: 1.9; }.period { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; font-size: 14px; }.warning { color: #f5c986; }.empty { padding: 48px 20px; text-align: center; color: #9dacc1; line-height: 2; }.chart-panel { background: #161e29; border: 1px solid #303a49; border-radius: 12px; padding: 0 16px 16px; }.comparison-chart { height: 360px; }.methodology { margin-top: 26px; }
@media (max-width: 640px) { .comparison-page { padding: 24px 16px 40px; }.selection { gap: 8px; }.selection label { min-height: 44px; padding: 0 12px; }.comparison-chart { height: 300px; }th, td { min-width: 155px; padding: 14px 12px; }tr > th:first-child { min-width: 84px; width: 84px; } }
.numeric-table table { table-layout: fixed; }
.numeric-table th, .numeric-table td { min-width: 0; padding: 16px 10px; text-align: center; vertical-align: middle; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
.numeric-table tr > th:first-child { position: static; min-width: 0; width: 100px; text-align: center; }
@media (max-width: 640px) {
  .numeric-table table { font-size: 12px; }
  .numeric-table th, .numeric-table td { padding: 12px 3px; }
  .numeric-table tr > th:first-child { width: 52px; }
}
.feature-table table { table-layout: fixed; }
.feature-table th, .feature-table td { min-width: 0; padding: 16px 10px; vertical-align: middle; overflow-wrap: anywhere; }
.feature-table tr > th:first-child { position: static; min-width: 0; width: 100px; text-align: center; vertical-align: middle; }
@media (max-width: 640px) {
  .feature-table table, .feature-table tbody, .feature-table tr, .feature-table td { display: block; }
  .feature-table thead tr { display: flex; flex-wrap: wrap; }
  .feature-table thead th { box-sizing: border-box; flex: 1 0 25%; }
  .feature-table thead tr > th:first-child { flex-basis: 100%; }
  .feature-table tbody tr > th:first-child { display: block; width: auto; padding: 12px; }
  .feature-table td { display: grid; grid-template-columns: 56px minmax(0, 1fr); align-items: center; gap: 12px; padding: 10px 12px; }
  .feature-table td::before { content: attr(data-strategy); color: #99a9be; }
}
.heatmap-note { display: flex; align-items: center; gap: 8px; margin: 10px 0; color: #99a9be; font-size: 12px; line-height: 1.7; }
.heatmap-scale { flex: 0 0 56px; height: 8px; border-radius: 4px; background: linear-gradient(90deg, #182432, #23556f); }
.annual-heatmap td, .risk-heatmap td { color: #dbeaf5; }
.annual-heatmap .year-best, .risk-heatmap .metric-best { color: #f0f9ff; font-weight: 700; box-shadow: inset 0 0 0 1px #7dd3fc; }
</style>
