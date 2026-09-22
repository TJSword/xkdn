<template>
  <div class="page-wrapper">
    <div class="main-container">
      <div class="page-header">
        <router-link to="/home" class="back-button">← 返回主页</router-link>
        <h1 class="main-title"><FeaturePageIcon type="nasdaq-premium" />纳指溢价监控</h1>
        <p class="subtitle">观察纳斯达克100 ETF 场内价格、净值与折溢价。</p>
      </div>
      <div class="content-card">
        <div class="toolbar">
          <label class="field-group">搜索 ETF<input v-model.trim="query" type="search" placeholder="代码 / 名称" /></label>
          <div class="table-meta">
            <span>{{ refreshStatus }}</span>
            <span title="最近一次全部行情读取成功的时间（北京时间），不代表 IOPV 的更新时间">更新时间 {{ updatedAt || '—' }}</span>
            <button v-if="canForceRefresh" class="refresh-button" :disabled="loading" @click="loadData()">{{ loading ? '更新中' : '刷新' }}</button>
          </div>
        </div>
        <p v-if="rotation.enabled && rotation.previousHolding" class="notice-text">最近策略参考更新：{{ rotation.previousHolding }} → {{ rotation.holding }}。这是策略记录，非实际成交。</p>
        <p v-if="error || rotationError" class="notice-text" role="status">{{ error || rotationError }}</p>
        <div class="card-header-row"><h2>纳斯达克100 ETF</h2><span class="table-meta">腾讯行情 · {{ filteredRows.length }} 只</span></div>
        <div class="table-container">
          <table>
            <thead><tr>
              <th>代码 / 名称</th><th>现价</th><th>单位净值</th><th>IOPV</th>
              <th :aria-sort="descending ? 'descending' : 'ascending'"><button class="sort-button" @click="descending = !descending">溢价率 {{ descending ? '↓' : '↑' }}</button></th>
              <th>成交额</th>
            </tr></thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.code" :class="{ 'holding-row': rotation.holding === row.code }">
                <td class="name-cell"><strong>{{ row.name }}</strong><small>{{ row.code }}</small></td>
                <td>{{ number(row.quote?.price, 3) }}</td>
                <td>{{ number(row.quote?.nav, 4) }}</td>
                <td>{{ number(row.quote?.iopv, 4) }}</td>
                <td :class="tone(row.quote?.premium)">{{ percent(row.quote?.premium) }}</td>
                <td>{{ number(row.quote?.turnover, 2) }}<small>万元</small></td>
              </tr>
              <tr v-if="!filteredRows.length"><td colspan="6" class="empty">没有匹配的 ETF</td></tr>
            </tbody>
          </table>
        </div>
        <p class="footnote">高亮行表示当前参考持仓。当其溢价率比最低溢价 ETF 高出超过 0.5 个百分点时，系统自动将参考持仓更新为最低溢价 ETF；开启页面提示后，会显示本次更新通知。</p>
        <p class="footnote">策略提出者提供的回测估算：通过纳指 ETF 溢价轮动，年化收益可能额外增加约 1～3 个百分点。本站尚未取得回测报告核验，回测区间、交易成本及执行假设待确认；该估算不代表实际或未来收益。</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import FeaturePageIcon from '@/components/FeaturePageIcon.vue'
import { useUserStore } from '@/store/user'
import { beijingSession, fetchEtfQuote, isEtfTradingDay, nasdaqEtfs } from '@/services/etfPremium'
import type { EtfPremiumQuote } from '@/services/etfPremium'
import { useEtfRotation } from '@/composables/useEtfRotation'

const query = ref('')
const descending = ref(true)
const loading = ref(false)
const error = ref('')
const refreshStatus = ref('交易时段每分钟更新 · 北京时间')
const updatedAt = ref('')
const userStore = useUserStore()
const canForceRefresh = computed(() => userStore.userInfo?.admin === true)
const rows = ref(nasdaqEtfs.map(item => ({ ...item, quote: null as EtfPremiumQuote | null, failed: false })))
const { settings: rotation, storageError: rotationError, reload: reloadRotation } = useEtfRotation()
let timer: ReturnType<typeof setInterval> | undefined
let controller: AbortController | undefined
let disposed = false
let lastRequestAt = 0

const filteredRows = computed(() => rows.value
    .filter(row => `${row.code}${row.name}`.includes(query.value))
    .slice().sort((a, b) => {
        const left = a.quote?.premium ?? null
        const right = b.quote?.premium ?? null
        if (left === null) return right === null ? 0 : 1
        if (right === null) return -1
        return (descending.value ? -1 : 1) * (left - right)
    }))

async function loadData(automatic = false) {
    if (loading.value || disposed) return
    const session = beijingSession()
    if (automatic && (!session.inSession || document.hidden || Date.now() - lastRequestAt < 60000)) {
        refreshStatus.value = document.hidden ? '页面隐藏，自动更新暂停' : session.inSession ? '交易时段每分钟更新 · 北京时间' : '非交易时段，自动更新暂停'
        return
    }
    loading.value = true
    controller = new AbortController()
    const signal = controller.signal
    const timeout = setTimeout(() => controller?.abort(), 12000)
    try {
        if (automatic && !await isEtfTradingDay(session.day, signal)) {
            refreshStatus.value = '非交易日，自动更新暂停'
            return
        }
        lastRequestAt = Date.now()
        const results = await Promise.allSettled(nasdaqEtfs.map(item => fetchEtfQuote(item.symbol, signal)))
        if (disposed) return
        rows.value = rows.value.map((row, index) => {
            const result = results[index]
            return result.status === 'fulfilled' ? { ...row, quote: result.value, failed: false } : { ...row, failed: true }
        })
        const failed = rows.value.filter(row => row.failed)
        error.value = failed.length ? `${failed.map(row => row.code).join('、')} 行情更新失败，保留已有数据；暂无数据的字段显示 —。` : ''
        if (!failed.length) updatedAt.value = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ')
        refreshStatus.value = session.inSession ? '交易时段每分钟更新 · 北京时间' : '非交易时段，展示最近行情'
    } catch {
        if (!disposed) error.value = automatic ? '交易日状态无法确认，暂停本次自动更新，稍后自动重试。' : '行情请求失败，请稍后重试。'
    } finally {
        clearTimeout(timeout)
        loading.value = false
    }
}

onMounted(() => {
    loadData()
    timer = setInterval(() => {
        if (!document.hidden) reloadRotation()
        loadData(true)
    }, 60000)
})
onUnmounted(() => {
    disposed = true
    clearInterval(timer)
    controller?.abort()
})

const number = (value: number | null | undefined, digits: number) => value == null ? '—' : value.toFixed(digits)
const signed = (value: number | null | undefined, digits: number) => value == null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(digits)}`
const percent = (value: number | null | undefined) => value == null ? '—' : `${signed(value, 2)}%`
const tone = (value: number | null | undefined) => value == null || value === 0 ? '' : value > 0 ? 'positive' : 'negative'
</script>

<style scoped>
.holding-row { background: rgb(251 146 60 / 12%); }
.page-wrapper { padding: 3rem 1rem; min-height: 100vh; font-family: 'Noto Sans SC', sans-serif; color: #fff; background: radial-gradient(circle at 15% 20%, rgb(251 146 60 / 12%), transparent 32%), radial-gradient(circle at 82% 18%, rgb(251 146 60 / 10%), transparent 30%), #121212; box-sizing: border-box; }
.main-container { margin: 0 auto; max-width: 1120px; }
.page-header { margin-bottom: 3rem; text-align: center; }
.back-button { display: inline-block; margin-bottom: 1rem; font-size: .9rem; text-decoration: none; color: #b0c4de; }
.back-button:hover { color: #fb923c; }
.main-title { display: flex; justify-content: center; align-items: center; margin-bottom: .5rem; font-size: 2.5rem; font-weight: 700; gap: 1rem; }
.subtitle { color: #8392a5; line-height: 1.6; }
.content-card { padding: 1.25rem; background: rgb(255 255 255 / 5%); border: 1px solid rgb(255 255 255 / 10%); border-radius: 12px; backdrop-filter: blur(10px); }
.toolbar, .card-header-row, .table-meta { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.toolbar { margin-bottom: 1.5rem; flex-wrap: wrap; }
.field-group { display: flex; flex-direction: column; gap: .45rem; font-size: .85rem; color: #b0c4de; }
input { padding: .72rem .85rem; color: #fff; background: rgb(0 0 0 / 28%); border: 1px solid rgb(255 255 255 / 12%); border-radius: 6px; font: inherit; }
.table-meta { font-size: .85rem; color: #8392a5; flex-wrap: wrap; }
.refresh-button { padding: .38rem .65rem; color: #fb923c; background: rgb(251 146 60 / 8%); border: 1px solid rgb(251 146 60 / 45%); border-radius: 6px; cursor: pointer; }
.refresh-button:disabled { cursor: wait; opacity: .55; }
.card-header-row { margin-bottom: 1rem; }
h2 { margin: 0; font-size: 1.2rem; }
.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; white-space: nowrap; font-variant-numeric: tabular-nums; font-size: .85rem; }
th, td { padding: 1rem .65rem; text-align: right; border-bottom: 1px solid rgb(255 255 255 / 8%); }
th { font-size: .78rem; color: #b0c4de; background: rgb(251 146 60 / 6%); border-bottom-color: rgb(251 146 60 / 22%); }
th:first-child, .name-cell { text-align: left; }
.sort-button { padding: 0; font: inherit; color: inherit; background: transparent; border: 0; cursor: pointer; }
small { display: block; margin-top: .4rem; font-size: .72rem; color: #8392a5; }
.positive { color: #ff6b6b; }
.negative { color: #4caf50; }
.notice-text { color: #ffb74d; font-size: .85rem; line-height: 1.6; }
.footnote { margin: 1rem 0 0; color: #8392a5; font-size: .8rem; line-height: 1.7; }
.empty { padding: 3rem; text-align: center; color: #8392a5; }
button:focus-visible, input:focus-visible { outline: 2px solid #fb923c; outline-offset: 3px; }
@media (max-width: 600px) { .page-wrapper { padding: 2rem .75rem; } .main-title { font-size: 1.65rem; gap: .5rem; } .main-title :deep(.feature-page-icon) { --feature-page-icon-size: 36px !important; } .content-card { padding: 1rem .75rem; } .toolbar, .card-header-row { align-items: flex-start; flex-direction: column; } .field-group { width: 100%; } }
</style>
