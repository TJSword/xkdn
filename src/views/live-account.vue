<template>
  <div class="page-wrapper">
    <main class="main-container">
      <header class="page-header">
        <router-link to="/home" class="back-button">← 返回主页</router-link>
        <h1><FeaturePageIcon type="live-account" />老何实盘</h1>
        <p class="subtitle">每日记录净值，分享持仓比例与实盘进展。</p>
      </header>

      <section class="content-card account-intro">
        <div><span class="eyebrow">每日净值 · 收盘后更新</span><h2>实盘概览</h2><p>数据截至 {{ latest.date }} · 持仓与净值按日展示</p></div>
        <span class="preview-badge">Mock 演示 · 非真实实盘数据</span>
      </section>

      <section class="metrics-grid" aria-label="实盘收益概览">
        <article v-for="item in metrics" :key="item.label" class="content-card metric-card">
          <span>{{ item.label }}</span><strong :class="item.tone">{{ item.value }}</strong><small>{{ item.note }}</small>
        </article>
      </section>

      <section class="content-card chart-card">
        <div class="section-header"><h2>净值走势</h2><div class="periods" aria-label="净值时间范围"><button v-for="period in periods" :key="period" :class="{ active: selectedPeriod === period }" :aria-pressed="selectedPeriod === period" @click="selectedPeriod = period">{{ period }}</button></div></div>
        <p class="chart-description">初始净值为 1.0000，每个点代表一个记录日。切换区间保留原始净值。</p>
        <v-chart class="nav-chart" :option="chartOption" autoresize />
        <div class="chart-footer"><span>{{ visiblePoints[0].date }} 至 {{ latest.date }}</span><span>按日更新 · Mock 数据</span></div>
      </section>

      <div class="allocation-grid">
        <section class="content-card">
          <div class="section-header"><h2>持仓比例</h2><span class="section-hint">截至 {{ latest.date }}</span></div>
          <v-chart class="allocation-chart" :option="allocationOption" autoresize />
          <div class="allocation-legend"><div v-for="item in holdings" :key="item.name"><span><i :style="{ background: item.color }"></i>{{ item.name }}</span><strong>{{ item.weight.toFixed(1) }}%</strong></div></div>
        </section>
        <section class="content-card"><div class="section-header"><h2>净值记录</h2><span class="section-hint">最近 5 个记录日</span></div><div class="table-container"><table><thead><tr><th>日期</th><th>净值</th><th>日涨跌幅</th></tr></thead><tbody><tr v-for="point in recentPoints" :key="point.date"><td>{{ point.date }}</td><td>{{ point.nav.toFixed(4) }}</td><td :class="tone(point.dailyReturn)">{{ percent(point.dailyReturn) }}</td></tr></tbody></table></div><p class="account-note">展示收盘后的日度记录，不提供分钟行情。</p></section>
      </div>

      <section class="content-card holdings-card">
        <div class="section-header"><h2>持仓明细</h2><span class="section-hint">含现金 · 合计 {{ totalWeight.toFixed(1) }}%</span></div>
        <div class="table-container"><table class="holdings-table"><thead><tr><th>持仓方向</th><th>资产类别</th><th>占比</th></tr></thead><tbody><tr v-for="item in holdings" :key="item.name"><td><span class="holding-name"><i :style="{ background: item.color }"></i>{{ item.name }}</span></td><td>{{ item.category }}</td><td><span class="weight-cell"><span class="weight-track"><span :style="{ width: item.weight + '%', background: item.color }"></span></span><strong>{{ item.weight.toFixed(1) }}%</strong></span></td></tr></tbody></table></div>
        <p class="account-note">占比以含现金的组合总资产为分母，仅展示比例，不公开金额、持仓数量或成本。</p>
      </section>
      <p class="page-note">本页净值、日期与持仓均为前端 Mock 数据，仅用于预览样式，不对应任何真实账户。示例日期为工作日，不代表完整交易日历。</p>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, GraphicComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, PieChart, GridComponent, TooltipComponent, GraphicComponent])

const periods = ['近一月', '近三月', '今年', '全部']
const selectedPeriod = ref('全部')
// Deterministic visual fixture only; no account source, polling or backend request.
const points: { date: string; nav: number; dailyReturn: number }[] = []
let nav = 1
for (let time = Date.UTC(2025, 11, 1); time <= Date.UTC(2026, 8, 18); time += 86400000) {
  const date = new Date(time)
  if (date.getUTCDay() === 0 || date.getUTCDay() === 6) continue
  const index = points.length
  const dailyReturn = index === 0 ? 0 : 0.00065 + Math.sin(index * 0.49) * 0.0035 + Math.cos(index * 0.17) * 0.0045 - (index > 105 && index < 120 ? 0.0038 : 0)
  nav *= 1 + dailyReturn
  points.push({ date: date.toISOString().slice(0, 10), nav, dailyReturn })
}
const latest = points[points.length - 1]
const holdings = [
  { name: '股票组合 A', category: '股票', weight: 30, color: '#34d399' },
  { name: '转债组合 B', category: '可转债', weight: 25, color: '#60a5fa' },
  { name: '指数配置 C', category: 'ETF', weight: 20, color: '#a78bfa' },
  { name: '黄金配置 D', category: '黄金 ETF', weight: 15, color: '#d4af37' },
  { name: '现金', category: '现金', weight: 10, color: '#94a3b8' }
]
const totalWeight = holdings.reduce((sum, item) => sum + item.weight, 0)
const percent = (value: number) => (value > 0 ? '+' : '') + (value * 100).toFixed(2) + '%'
const tone = (value: number) => value > 0 ? 'positive' : value < 0 ? 'negative' : ''
let peak = 1
const maxDrawdown = points.reduce((worst, point) => {
  peak = Math.max(peak, point.nav)
  return Math.min(worst, point.nav / peak - 1)
}, 0)
const metrics = [
  { label: '最新净值', value: latest.nav.toFixed(4), note: '初始净值 1.0000', tone: '' },
  { label: '日涨跌幅', value: percent(latest.dailyReturn), note: latest.date, tone: tone(latest.dailyReturn) },
  { label: '累计收益', value: percent(latest.nav - 1), note: '自 ' + points[0].date + ' 起', tone: tone(latest.nav - 1) },
  { label: '最大回撤', value: percent(maxDrawdown), note: '完整记录区间', tone: tone(maxDrawdown) }
]
const visiblePoints = computed(() => {
  const cutoff = new Date(latest.date + 'T00:00:00Z')
  if (selectedPeriod.value === '全部') return points
  if (selectedPeriod.value === '今年') return points.filter(point => point.date >= latest.date.slice(0, 4) + '-01-01')
  cutoff.setUTCMonth(cutoff.getUTCMonth() - (selectedPeriod.value === '近一月' ? 1 : 3))
  return points.filter(point => point.date >= cutoff.toISOString().slice(0, 10))
})
const recentPoints = points.slice(-5).reverse()
const chartOption = computed(() => ({
  animation: false,
  grid: { left: 52, right: 18, top: 22, bottom: 35 },
  tooltip: { trigger: 'axis', backgroundColor: '#17242b', borderColor: '#345449', textStyle: { color: '#edf7f1' }, valueFormatter: (value: number) => Number(value).toFixed(4) },
  xAxis: { type: 'category', boundaryGap: false, data: visiblePoints.value.map(point => point.date), axisLabel: { color: '#8fa1b8', hideOverlap: true }, axisLine: { lineStyle: { color: '#394b47' } } },
  yAxis: { type: 'value', scale: true, axisLabel: { color: '#8fa1b8', formatter: (value: number) => value.toFixed(3) }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.07)', type: 'dashed' } } },
  series: [{ name: '单位净值（Mock）', type: 'line', showSymbol: false, data: visiblePoints.value.map(point => point.nav), lineStyle: { color: '#34d399', width: 2.5 }, itemStyle: { color: '#34d399' }, areaStyle: { color: '#34d399', opacity: 0.07 } }]
}))
const allocationOption = {
  animation: false,
  tooltip: { trigger: 'item', formatter: '{b}：{c}%' },
  graphic: [{ type: 'text', left: 'center', top: '42%', style: { text: '持仓配置', fill: '#a8bacb', fontSize: 13 } }, { type: 'text', left: 'center', top: '53%', style: { text: totalWeight.toFixed(0) + '%', fill: '#eef5f3', fontSize: 23, fontWeight: 600 } }],
  series: [{ type: 'pie', radius: ['64%', '83%'], center: ['50%', '50%'], label: { show: false }, emphasis: { scale: false }, itemStyle: { borderRadius: 4, borderWidth: 3, borderColor: '#1b2522' }, data: holdings.map(item => ({ name: item.name, value: item.weight, itemStyle: { color: item.color } })) }]
}
</script>

<style scoped>
.page-wrapper { min-height: 100vh; padding: 3rem 1rem 4rem; box-sizing: border-box; font-family: 'Noto Sans SC', sans-serif; color: #fff; background: radial-gradient(circle at 14% 18%, rgb(22 101 52 / 24%), transparent 34%), radial-gradient(circle at 84% 14%, rgb(212 175 55 / 12%), transparent 30%), #121212; }
.main-container { max-width: 960px; margin: auto; }
.page-header { text-align: center; margin-bottom: 3rem; }
.back-button { display: inline-block; color: #b0c4de; font-size: 0.9rem; text-decoration: none; margin-bottom: 1rem; }
h1 { display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-size: 2.5rem; margin: 0 0 0.5rem; }
.subtitle { color: #b0c4de; font-size: 1.1rem; line-height: 1.7; margin: 0; }
.content-card { min-width: 0; padding: 1.5rem; border: 1px solid rgb(255 255 255 / 10%); border-radius: 12px; background: rgb(255 255 255 / 5%); backdrop-filter: blur(10px); }
.account-intro, .section-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.eyebrow { color: #6ee7b7; font-size: 0.8rem; }
h2 { font-size: 1.15rem; margin: 0; }
.account-intro h2 { margin-top: 0.5rem; }.account-intro p { color: #a8bacb; font-size: 0.9rem; margin-bottom: 0; }
.preview-badge { padding: 7px 12px; border: 1px solid rgb(212 175 55 / 25%); border-radius: 20px; background: rgb(212 175 55 / 8%); color: #d6c58b; font-size: 0.75rem; white-space: nowrap; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin: 1.5rem 0; }
.metric-card span { display: block; color: #b0c4de; font-size: 0.85rem; }.metric-card strong { display: block; font-size: 2rem; font-weight: 500; margin: 0.75rem 0; color: #e2e8f0; }.metric-card small { color: #7e91a6; font-size: 0.75rem; }
.section-header h2 { padding-left: 12px; border-left: 3px solid #34d399; }.section-hint { color: #8fa1b8; font-size: 0.8rem; }
.periods { display: flex; flex-wrap: wrap; gap: 5px; }.periods button { padding: 7px 10px; color: #9fb2c8; background: transparent; border: 1px solid transparent; border-radius: 6px; cursor: pointer; }.periods button.active { color: #a7f3d0; border-color: rgb(52 211 153 / 25%); background: rgb(52 211 153 / 12%); }
.chart-footer { display: flex; justify-content: space-between; gap: 12px; color: #7e91a6; font-size: 0.75rem; padding-top: 1rem; border-top: 1px solid rgb(255 255 255 / 7%); }
.allocation-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 1.5rem 0; }
.table-container { overflow-x: auto; margin-top: 1.5rem; }table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }th { background: rgb(255 255 255 / 4%); color: #b0c4de; padding: 15px; white-space: nowrap; font-weight: 500; }.page-note { margin-top: 1.5rem; text-align: center; font-size: 0.8rem; color: #7e91a6; line-height: 1.8; }
@media (max-width: 640px) { .page-wrapper { padding: 2rem 0.75rem; }h1 { font-size: 2rem; }.subtitle { font-size: 0.95rem; }.page-header { margin-bottom: 2rem; }.account-intro { align-items: flex-start; flex-direction: column; }.content-card { padding: 1.25rem; }.metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }.allocation-grid { grid-template-columns: 1fr; }.chart-card .section-header { align-items: flex-start; flex-direction: column; } }
.nav-chart { height: 330px; margin-top: 1rem; }
.allocation-chart { height: 210px; }
.chart-description, .account-note { color: #8fa1b8; font-size: 0.8rem; line-height: 1.8; }
.allocation-legend { display: grid; gap: 10px; font-size: 0.85rem; }
.allocation-legend > div { display: flex; justify-content: space-between; gap: 1rem; }
.allocation-legend span, .holding-name { display: flex; align-items: center; gap: 9px; color: #b9c8d8; }
i { display: inline-block; width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; }
td { padding: 16px 10px; border-bottom: 1px solid rgb(255 255 255 / 7%); text-align: center; color: #c9d5e2; white-space: nowrap; font-variant-numeric: tabular-nums; }
.positive, .metric-card strong.positive { color: #f87171; }
.negative, .metric-card strong.negative { color: #4ade80; }
.weight-cell { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.weight-track { width: 120px; height: 6px; border-radius: 6px; overflow: hidden; background: rgb(255 255 255 / 7%); }
.weight-track > span { display: block; height: 100%; border-radius: inherit; }
.weight-cell strong { min-width: 50px; font-weight: 500; }
.holdings-table th:first-child { text-align: left; }
@media (max-width: 640px) { .nav-chart { height: 260px; }.chart-footer { flex-wrap: wrap; }.weight-track { width: 65px; }.metric-card strong { font-size: 1.65rem; } }
</style>
