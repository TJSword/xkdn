<template>
    <div class="intraday-comparison">
        <p v-if="!initialPairs.length" class="comparison-help">当前没有可自动配对的换仓组合，可手动选择股票进行对比。</p>
        <section v-for="(pair, index) in pairs" :key="pair.id" class="comparison-card" :aria-label="'第' + (index + 1) + '组对比'">
            <div class="pair-controls">
                <strong>第 {{ index + 1 }} 组</strong>
                <label>拟卖出
                    <select v-model="pair.sell" :aria-label="'第' + (index + 1) + '组拟卖出'" @change="resetPair(pair)">
                        <option value="" disabled>选择股票</option>
                        <option v-for="stock in stocks" :key="stock.stockCode" :value="stock.stockCode" :disabled="stock.stockCode === pair.buy">{{ stock.stockName }} {{ stock.stockCode }}</option>
                    </select>
                </label>
                <span aria-hidden="true">→</span>
                <label>拟买入
                    <select v-model="pair.buy" :aria-label="'第' + (index + 1) + '组拟买入'" @change="resetPair(pair)">
                        <option value="" disabled>选择股票</option>
                        <option v-for="stock in stocks" :key="stock.stockCode" :value="stock.stockCode" :disabled="stock.stockCode === pair.sell">{{ stock.stockName }} {{ stock.stockCode }}</option>
                    </select>
                </label>
                <button :disabled="!pair.sell || !pair.buy || pair.loading" @click="loadPair(pair)">{{ pair.loading ? '加载中…' : pair.points.length ? '刷新分时' : '开始对比' }}</button>
                <button v-if="pairs.length > 1" :aria-label="'移除第' + (index + 1) + '组'" @click="removePair(pair)">移除</button>
            </div>
            <p v-if="pair.error" role="alert" class="comparison-error">{{ pair.error }}{{ pair.points.length ? '，当前保留上次查询结果。' : '' }}</p>
            <p v-if="pair.loading && !pair.points.length" role="status">正在获取两只股票的分时行情…</p>
            <template v-if="pair.points.length">
                <p class="comparison-help">{{ pair.date }} · 基准 {{ pair.points[0].time }}（首个共同有效分钟） · 行情截至 {{ lastTime(pair) }} · 查询于 {{ pair.updatedAt }}</p>
                <v-chart class="comparison-chart" :option="chartOption(pair)" autoresize />
            </template>
            <p v-else-if="!pair.error && !pair.loading" class="comparison-help">选择拟卖出和拟买入股票后，点击“开始对比”。</p>
        </section>
        <button class="add-comparison" @click="addPair">＋ 添加一组对比</button>
        <p class="comparison-help">相对换仓成本 =（拟买入股票归一化价格 ÷ 拟卖出股票归一化价格 − 1）× 100%。越低越划算，负值表示成本低于基准，未计费用。</p>
        <p class="comparison-help">腾讯一分钟行情，仅比较同一分钟的有效价格；午休前后曲线相连，其他缺失和未到时段留空，午休不占横轴。页面在前台时每分钟自动刷新，切到后台暂停；也可手动刷新。</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components'
import { compareMinutes, fetchMinutes, tradingMinutes, startForegroundRefresh, formatComparisonValue } from '@/services/rightsIntraday'
import type { ComparisonPoint } from '@/services/rightsIntraday'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, MarkLineComponent])
const props = defineProps<{ stocks: Array<{ stockCode: string; stockName: string }>; initialPairs: Array<{ sell: string; buy: string }> }>()
interface Pair { id: number; sell: string; buy: string; loading: boolean; error: string; date: string; updatedAt: string; points: ComparisonPoint[] }
const pairs = ref<Pair[]>([])
const requests = new Map<number, AbortController>()
let nextId = 0
let stopAutoRefresh: (() => void) | undefined
function addPair() {
    pairs.value.push({ id: ++nextId, sell: '', buy: '', loading: false, error: '', date: '', updatedAt: '', points: [] })
}
onMounted(() => {
    for (const selection of props.initialPairs) {
        addPair()
        const pair = pairs.value[pairs.value.length - 1]
        pair.sell = selection.sell
        pair.buy = selection.buy
        void loadPair(pair)
    }
    if (!pairs.value.length) addPair()
    stopAutoRefresh = startForegroundRefresh(() => {
        for (const pair of pairs.value) {
            if (pair.sell && pair.buy && !pair.loading) void loadPair(pair)
        }
    })
})
function resetPair(pair: Pair) {
    requests.get(pair.id)?.abort()
    requests.delete(pair.id)
    pair.points = []
    pair.error = ''
    pair.loading = false
}
function removePair(pair: Pair) {
    resetPair(pair)
    pairs.value = pairs.value.filter(p => p.id !== pair.id)
}
async function loadPair(pair: Pair) {
    if (pair.loading) return
    if (!pair.sell || !pair.buy || pair.sell === pair.buy) return
    pair.error = ''
    const date = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
    if (pair.date !== date) pair.points = []
    const controller = new AbortController()
    requests.set(pair.id, controller)
    pair.loading = true
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
        const [sell, buy] = await Promise.all([fetchMinutes(pair.sell, date, controller.signal), fetchMinutes(pair.buy, date, controller.signal)])
        if (requests.get(pair.id) !== controller) return
        const points = compareMinutes(sell, buy)
        if (points.filter(point => point.ratio !== null).length < 2) throw new Error('共同有效分钟不足，暂时无法绘制对比曲线')
        pair.points = points
        pair.date = date
        pair.updatedAt = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    } catch (error) {
        if (requests.get(pair.id) === controller) pair.error = controller.signal.aborted ? '行情请求超时，请重试' : error instanceof Error ? error.message : '分时行情加载失败'
    } finally {
        clearTimeout(timeout)
        if (requests.get(pair.id) === controller) { pair.loading = false; requests.delete(pair.id) }
    }
}
function lastTime(pair: Pair) { return [...pair.points].reverse().find(p => p.ratio !== null)?.time }
function chartOption(pair: Pair) {
    const values = new Map(pair.points.map(point => [point.time, point.ratio]))
    // 一分钟行情可能没有 13:00，只连接午休交界，其他缺失分钟仍断开。
    const bridgeLunch = values.get('11:30') != null && values.get('13:00') == null && values.get('13:01') != null
    return {
        animation: false,
        grid: { left: 72, right: 24, top: 30, bottom: 32 },
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross', crossStyle: { color: '#9aacc4', type: 'dashed' }, label: { backgroundColor: '#354157' } }, valueFormatter: formatComparisonValue },
        xAxis: { type: 'category', data: tradingMinutes, boundaryGap: false, axisLabel: { color: '#b0c4de', interval: (_index: number, time: string) => ['09:30', '10:00', '10:30', '11:00', '11:30', '13:30', '14:00', '14:30', '15:00'].includes(time), formatter: (time: string) => time === '11:30' ? '11:30/13:00' : time, showMinLabel: true, showMaxLabel: true } },
        yAxis: { type: 'value', name: '相对换仓成本（%）', axisPointer: { label: { formatter: ({ value }: { value: number }) => `${Number(value).toFixed(3)}%` } }, nameTextStyle: { color: '#b0c4de' }, axisLabel: { color: '#b0c4de', formatter: (value: number) => `${value.toFixed(2)}` }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } } },
        series: [{ name: '相对换仓成本', type: 'line', data: tradingMinutes.map(time => values.get(time) ?? null), smooth: false, connectNulls: false, showSymbol: false, lineStyle: { color: '#f5bb66', width: 2 }, itemStyle: { color: '#f5bb66' }, markLine: { silent: true, symbol: 'none', data: [{ yAxis: 0 }], label: { show: false }, lineStyle: { color: '#8592a5' } } }, { type: 'line', data: tradingMinutes.map(time => bridgeLunch && (time === '11:30' || time === '13:01') ? values.get(time) : null), connectNulls: true, showSymbol: false, silent: true, tooltip: { show: false }, lineStyle: { color: '#f5bb66', width: 2 } }]
    }
}
onBeforeUnmount(() => { stopAutoRefresh?.(); requests.forEach(controller => controller.abort()); requests.clear() })
</script>

<style scoped>
.intraday-comparison { color: #d6e0ef; }
.pair-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.add-comparison { width: 100%; margin-top: 16px; border-style: dashed; background: transparent; color: #b0c4de; }
.add-comparison:hover { border-color: #f5bb66; color: #f5bb66; background: rgb(245 187 102 / 5%); }
button, select { border: 1px solid #536077; border-radius: 6px; background: #202839; color: #d6e0ef; padding: 8px 12px; font: inherit; }
select { appearance: none; padding-right: 36px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='m3 4.5 3 3 3-3' fill='none' stroke='%23d6e0ef' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
button { cursor: pointer; }
button:disabled { opacity: 0.5; cursor: default; }
button:focus-visible, select:focus-visible { outline: 2px solid #f5bb66; outline-offset: 2px; }
.pair-controls label { display: flex; gap: 8px; align-items: center; }
.comparison-card { border: 1px solid rgb(176 196 222 / 20%); border-radius: 8px; padding: 16px; margin-top: 16px; }
.comparison-card:first-child { margin-top: 0; }
.comparison-help { color: #9aacc4; font-size: 13px; line-height: 1.7; }
.comparison-error { color: #ff8585; }
.comparison-chart { height: 280px; width: 100%; }
@media (max-width: 640px) { .comparison-card { padding: 10px; } .pair-controls label { width: 100%; } select { flex: 1; min-width: 0; } }
</style>
