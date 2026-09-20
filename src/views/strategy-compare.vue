<template>
  <main class="comparison-page">
    <header class="comparison-heading"><div><h2>多策略对比</h2><p>先看全貌，再留下你想深入了解的策略。</p></div><button @click="selected = comparisonStrategies.map(item => item.id)">恢复全部</button></header>
    <div class="selection" aria-label="选择对比策略">
      <label v-for="item in comparisonStrategies" :key="item.id" :style="{ '--color': item.color }" :class="{ checked: selected.includes(item.id) }"><input v-model="selected" type="checkbox" :value="item.id" /><span class="dot"></span>{{ item.name }}</label>
    </div>
    <nav class="comparison-tabs" aria-label="对比维度"><button v-for="item in tabs" :key="item.id" :aria-pressed="tab === item.id" :class="{ active: tab === item.id }" @click="tab = item.id">{{ item.label }}</button></nav>
    <div v-if="!visibleStrategies.length" class="empty">尚未选择策略。勾选上方策略，或点击“恢复全部”。</div>
    <template v-else-if="tab === 'features'">
      <p class="note">规则摘要以各策略详情为准。表格可横向滑动，点击列标题查看完整策略。</p>
      <div class="table-scroll"><table><thead><tr><th>对比维度</th><th v-for="item in visibleStrategies" :key="item.id"><router-link :to="`/strategies/${item.slug}`" :style="{ color: item.color }">{{ item.name }} ↗</router-link></th></tr></thead><tbody><tr v-for="row in featureRows" :key="row.key"><th>{{ row.label }}</th><td v-for="item in visibleStrategies" :key="item.id">{{ item[row.key] }}</td></tr></tbody></table></div>
    </template>
    <template v-else>
      <div v-if="loading" class="empty" role="status">正在读取六个策略的历史数据…</div>
      <div v-else-if="error" class="empty" role="alert">{{ error }} <button @click="loadData">重试</button></div>
      <template v-else>
        <p v-if="missingNames.length" class="warning">{{ missingNames.join('、') }}缺少有效历史数据。请重试或取消这些策略后对比。<button @click="loadData">重试</button></p>
        <div class="period"><span>共同统计区间：{{ aligned.dates[0] || '—' }} 至 {{ aligned.dates[aligned.dates.length - 1] || '—' }}</span><span>{{ aligned.dates.length }} 个共同估值日</span></div>
        <p class="note">默认锁定全部已加载策略的共同日期；取消勾选仅隐藏策略，不改变其他策略的指标。<button @click="periodIds = visibleStrategies.map(item => item.id)">按当前选择重设区间</button><button @click="periodIds = comparisonStrategies.map(item => item.id)">恢复六策略区间</button></p>
        <div v-if="aligned.dates.length < 2 || missingNames.length" class="empty">当前没有足够的共同数据，无法计算对比指标。</div>
        <template v-else>
          <div class="chart-panel"><h3>{{ tab === 'returns' ? '累计收益' : '历史回撤' }}</h3><v-chart :option="chartOption" class="comparison-chart" autoresize /></div>
          <div class="table-scroll"><table><thead><tr><th>指标</th><th v-for="item in visibleStrategies" :key="item.id" :style="{ color: item.color }">{{ item.name }}</th></tr></thead><tbody><tr v-for="row in metricRows" :key="row.key"><th>{{ row.label }}</th><td v-for="item in visibleStrategies" :key="item.id">{{ metricValue(item.id, row.key, row.unit) }}</td></tr></tbody></table></div>
          <template v-if="tab === 'returns'"><h3>年度收益 <small>首尾年份可能只覆盖部分时间</small></h3><div class="table-scroll"><table><thead><tr><th>年份</th><th v-for="item in visibleStrategies" :key="item.id">{{ item.name }}</th></tr></thead><tbody><tr v-for="year in years" :key="year"><th>{{ year }}</th><td v-for="item in visibleStrategies" :key="item.id">{{ annualValue(item.id, year) }}</td></tr></tbody></table></div></template>
          <p class="note methodology">数据来自网站现有历史策略序列，可能包含回测与后续跟踪，并非统一的实盘账户收益；费用沿用各源数据，不额外调整。累计收益从共同起点归一化，年化按自然日计算；波动率、夏普按250个交易日、2%无风险利率计算。仅取共同有效日期，不补齐缺失净值；若源数据缺失交易日，风险指标可能受采样影响。历史表现不代表未来收益。</p>
        </template>
      </template>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { comparisonStrategies } from '@/utils/strategyCatalog'
import { alignComparison, type ComparisonSource } from '@/utils/strategyComparison'
import type { StrategyStats } from '@/utils/strategyMetrics'
import { callCloudFunction, throwIfAuthExpired } from '@/services/cloudFunction'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent])

const selected = ref(comparisonStrategies.map(item => item.id))
const periodIds = ref([...selected.value])
const tab = ref('features')
const tabs = [{ id: 'features', label: '策略特点' }, { id: 'returns', label: '收益表现' }, { id: 'risk', label: '风险表现' }]
const featureRows: { key: 'asset' | 'method' | 'allocation' | 'schedule' | 'operation' | 'risk'; label: string }[] = [
  { key: 'asset', label: '投资对象' }, { key: 'method', label: '核心方法' }, { key: 'allocation', label: '配置方式' }, { key: 'schedule', label: '调仓安排' }, { key: 'operation', label: '操作与参与要求' }, { key: 'risk', label: '主要风险' }
]
const sources = ref<Record<string, ComparisonSource>>({})
const loading = ref(true)
const error = ref('')
const visibleStrategies = computed(() => comparisonStrategies.filter(item => selected.value.includes(item.id)))
const missingNames = computed(() => visibleStrategies.value.filter(item => alignComparison(sources.value, [item.id]).dates.length < 2).map(item => item.name))
// Include newly reselected strategies so every displayed series shares identical dates.
const aligned = computed(() => alignComparison(sources.value, [...new Set([...periodIds.value, ...selected.value])]))
const visibleSeries = computed(() => aligned.value.series.filter(item => selected.value.includes(item.id)))
const years = computed(() => visibleSeries.value[0]?.years.map(item => item.year) || [])
const metricRows = computed<{ key: keyof StrategyStats; label: string; unit: string }[]>(() => tab.value === 'returns'
  ? [{ key: 'totalReturn', label: '累计收益', unit: '%' }, { key: 'annualizedReturn', label: '年化收益', unit: '%' }]
  : [{ key: 'maxDrawdown', label: '最大回撤', unit: '%' }, { key: 'volatility', label: '年化波动率', unit: '%' }, { key: 'sharpe', label: '夏普比率', unit: '' }, { key: 'calmar', label: '卡玛比率', unit: '' }])
function metricValue(id: string, key: keyof StrategyStats, unit: string) {
  const value = aligned.value.series.find(item => item.id === id)?.stats?.[key]
  return value && value !== '--' ? `${value}${unit}` : '—'
}
function annualValue(id: string, year: number) {
  const value = aligned.value.series.find(item => item.id === id)?.years.find(item => item.year === year)?.total
  return value === undefined ? '—' : `${value}%`
}
const chartOption = computed(() => ({
  animation: false,
  backgroundColor: 'transparent', tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${Number(value).toFixed(2)}%` },
  legend: { textStyle: { color: '#b4c2d3' }, top: 0 },
  grid: { left: 65, right: 24, top: 50, bottom: 65 },
  xAxis: { type: 'category', data: aligned.value.dates, axisLabel: { color: '#94a3b8' }, boundaryGap: false },
  yAxis: { type: 'value', axisLabel: { color: '#94a3b8', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#283342' } } },
  dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: 5, height: 20 }],
  series: visibleSeries.value.map(series => {
    const strategy = comparisonStrategies.find(item => item.id === series.id) as typeof comparisonStrategies[number]
    let peak = 1
    return { name: strategy.name, type: 'line', showSymbol: false, itemStyle: { color: strategy.color }, lineStyle: { width: 2 }, data: series.values.map(value => { peak = Math.max(peak, value); return (tab.value === 'returns' ? value - 1 : value / peak - 1) * 100 }) }
  })
}))
async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const response: any = await callCloudFunction({ name: 'getPortfolioAnalysisData', data: { strategyIds: comparisonStrategies.map(item => item.id) } })
    const data = response.result?.data?.strategies
    if (!data || !Object.keys(data).length) throw new Error('missing data')
    sources.value = data
  } catch (err) {
    throwIfAuthExpired(err)
    error.value = '历史数据暂时无法加载，请稍后重试。'
  } finally { loading.value = false }
}
onMounted(loadData)
</script>

<style scoped>
.comparison-page { max-width: 1200px; margin: auto; padding: 32px 24px 64px; }
.comparison-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
h2 { margin: 0 0 10px; font-size: 25px; } h3 { margin-top: 28px; font-size: 17px; } p, small { color: #99a9be; } small { font-size: 12px; font-weight: normal; }
button { padding: 8px 13px; border: 1px solid #354156; border-radius: 8px; color: #b9d4ff; background: #1c2634; cursor: pointer; } button:hover { background: #2b3b50; }
.selection { display: flex; flex-wrap: wrap; gap: 12px; margin: 24px 0; }.selection label { display: flex; align-items: center; gap: 9px; padding: 12px 17px; border: 1px solid #303b4d; border-radius: 10px; color: #95a0b1; cursor: pointer; }.selection .checked { border-color: var(--color); color: #e8eef7; background: #1a2230; }.selection input { accent-color: var(--color); }.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--color); }
.comparison-tabs { display: flex; gap: 10px; border-bottom: 1px solid #303a49; padding-bottom: 16px; margin-bottom: 24px; }.comparison-tabs button { color: #a6b2c4; background: transparent; border-color: transparent; }.comparison-tabs .active { color: #e7f0ff; background: #25354a; }
.table-scroll { overflow-x: auto; border: 1px solid #303a49; border-radius: 12px; margin: 18px 0; }table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; line-height: 1.8; }th, td { min-width: 150px; padding: 18px 16px; text-align: left; border-bottom: 1px solid #293342; vertical-align: top; }th { background: #1d2735; color: #d7e1f0; }td { background: #161e29; color: #bdc9da; }tr:last-child td, tr:last-child th { border-bottom: 0; }tr > th:first-child { position: sticky; left: 0; z-index: 1; min-width: 100px; width: 100px; }a { text-decoration: none; }
.note { font-size: 12px; line-height: 1.9; }.note button { margin: 6px; font-size: 12px; }.period { display: flex; flex-wrap: wrap; gap: 20px; font-size: 14px; }.warning { color: #f5c986; }.empty { padding: 48px 20px; text-align: center; color: #9dacc1; line-height: 2; }.chart-panel { background: #161e29; border: 1px solid #303a49; border-radius: 12px; padding: 0 16px 16px; }.comparison-chart { height: 360px; }.methodology { margin-top: 26px; }
@media (max-width: 640px) { .comparison-page { padding: 24px 16px 40px; }.selection { gap: 8px; }.selection label { padding: 9px 11px; }.comparison-heading { align-items: start; }.comparison-heading button { flex-shrink: 0; }.comparison-heading p { font-size: 13px; line-height: 1.8; }.comparison-chart { height: 300px; }th, td { min-width: 155px; padding: 14px 12px; }tr > th:first-child { min-width: 84px; width: 84px; } }
</style>
