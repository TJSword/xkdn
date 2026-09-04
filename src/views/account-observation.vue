<template>
  <div class="page-wrapper">
    <main class="main-container">
      <header class="page-header">
        <router-link to="/home" class="back-button">← 返回主页</router-link>
        <h1 class="main-title">策略净值</h1>
        <p class="subtitle">惊鸿策略与小狮子策略的当日走势和当前持仓。</p>
      </header>

      <StrategyLoading
        v-if="isLoading && !observation"
        class="account-loading"
        title="正在同步策略数据"
        description="读取当日收益走势与当前持仓"
        monogram=""
      />

      <section v-else-if="errorMessage && !observation" class="strategy-error" role="alert">
        <div class="strategy-error-icon" aria-hidden="true">!</div>
        <h2>账户数据暂时未能加载</h2>
        <p>{{ errorMessage }}</p>
        <button type="button" @click="loadObservation">重新加载</button>
      </section>

      <div v-else-if="observation && activeAccount" class="content-grid">
        <section class="strategy-tabs" role="tablist" aria-label="选择策略">
          <button
            v-for="(account, index) in observation.accounts"
            :id="`strategy-tab-${account.id}`"
            :key="account.id"
            :class="['strategy-tab', `strategy-tab-${index + 1}`, { 'is-active': account.id === activeAccount.id }]"
            type="button"
            role="tab"
            :aria-selected="account.id === activeAccount.id"
            :aria-controls="`strategy-panel-${account.id}`"
            :tabindex="account.id === activeAccount.id ? 0 : -1"
            @click="activeAccountId = account.id"
          >
            <span class="strategy-dot"></span>
            {{ account.label }}
          </button>
        </section>

        <section
          :id="`strategy-panel-${activeAccount.id}`"
          :class="['content-card', 'chart-card', `strategy-card-${activeAccountIndex + 1}`]"
          role="tabpanel"
          :aria-labelledby="`strategy-tab-${activeAccount.id}`"
          :aria-busy="isLoading"
        >
          <div class="card-header-row chart-header">
            <div class="chart-title-block">
              <span class="chart-strategy-name">{{ activeAccount.label }}</span>
              <h2 class="card-title">当日收益走势</h2>
            </div>
            <div class="chart-actions">
              <div class="today-return">
                <span>当日收益</span>
                <strong :class="returnClass(activeAccount.todayReturn)">{{ formatReturn(activeAccount.todayReturn) }}</strong>
              </div>
              <span class="system-status"><i></i>更新于 {{ formattedUpdatedAt }}</span>
              <button class="refresh-button" type="button" :disabled="isLoading" @click="loadObservation">
                <span :class="{ 'is-loading': isLoading }" aria-hidden="true">↻</span>
                {{ isLoading ? '更新中' : '刷新' }}
              </button>
            </div>
          </div>
          <v-chart class="return-chart" :option="chartOption" autoresize />
          <p v-if="errorMessage" class="refresh-warning">{{ errorMessage }}，当前保留上一次数据。</p>
        </section>

        <section :class="['content-card', `strategy-card-${activeAccountIndex + 1}`]">
          <div class="card-header-row holdings-header">
            <h2 class="card-title">{{ activeAccount.label }}持仓</h2>
            <span class="holding-count">{{ activeAccount.holdings.length }} 只</span>
          </div>
          <div v-if="activeAccount.holdings.length" class="table-container">
            <table>
              <thead>
                <tr>
                  <th>股票代码</th>
                  <th>股票名称</th>
                  <th>持仓数量</th>
                  <th>成本价</th>
                  <th>现价</th>
                  <th>持仓市值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="holding in activeAccount.holdings" :key="holding.stockCode">
                  <td class="code-cell">{{ holding.stockCode }}</td>
                  <td class="name-cell">{{ holding.stockName }}</td>
                  <td>{{ formatQuantity(holding.quantity) }}</td>
                  <td>{{ formatPrice(holding.costPrice) }}</td>
                  <td>{{ formatPrice(holding.currentPrice) }}</td>
                  <td>{{ formatMoney(holding.marketValue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="no-data">当前没有可展示的持仓。</p>
        </section>

        <p class="data-note">收益和持仓来自账户实时数据；持仓数据可能因调仓出现短暂更新滞后。</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { LineChart } from 'echarts/charts'
  import { GridComponent, TooltipComponent } from 'echarts/components'
  import { use } from 'echarts/core'
  import { CanvasRenderer } from 'echarts/renderers'
  import VChart from 'vue-echarts'
  import { callCloudFunction, throwIfAuthExpired } from '@/services/cloudFunction'

  use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

  interface ReturnPoint {
      time: number
      value: number
  }

  interface Holding {
      stockCode: string
      stockName: string
      quantity: number | null
      costPrice: number | null
      currentPrice: number | null
      marketValue: number | null
  }

  interface AccountSeries {
      id: string
      label: string
      todayReturn: number
      series: ReturnPoint[]
      holdings: Holding[]
  }

  interface ObservationData {
      updatedAt: number
      accounts: AccountSeries[]
  }

  const observation = ref<ObservationData | null>(null)
  const activeAccountId = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const seriesColors = ['#22c55e', '#d4af37']
  const tradingTimeline = buildTradingTimeline()

  const activeAccount = computed(() => {
      if (!observation.value?.accounts.length) return null
      return observation.value.accounts.find(account => account.id === activeAccountId.value)
          || observation.value.accounts[0]
  })

  const activeAccountIndex = computed(() => {
      if (!observation.value || !activeAccount.value) return 0
      return Math.max(0, observation.value.accounts.findIndex(account => account.id === activeAccount.value?.id))
  })

  const chartOption = computed(() => {
      if (!activeAccount.value) return {}

      const valuesByTime = new Map(
          activeAccount.value.series.map(point => [formatChartTime(point.time), point.value])
      )
      const seriesColor = seriesColors[activeAccountIndex.value]

      return {
          animationDuration: 500,
          color: [seriesColor],
          grid: { left: 18, right: 18, top: 24, bottom: 18, containLabel: true },
          tooltip: {
              trigger: 'axis',
              backgroundColor: 'rgba(8, 15, 24, 0.94)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              textStyle: { color: '#f8fafc' },
              formatter: (params: any) => {
                  const items = Array.isArray(params) ? params : [params]
                  const validItems = items.filter((item: any) => (
                      item.value !== null
                      && item.value !== undefined
                      && Number.isFinite(Number(item.value))
                  ))
                  if (!validItems.length) return ''
                  const timeLabel = String(items[0].axisValue)
                  return [
                      `<strong>${timeLabel}</strong>`,
                      ...validItems.map((item: any) => `${item.marker}${item.seriesName}&nbsp;&nbsp;${formatReturn(Number(item.value))}`)
                  ].join('<br>')
              }
          },
          xAxis: {
              type: 'category',
              data: tradingTimeline,
              boundaryGap: false,
              axisLine: { lineStyle: { color: '#53657a' } },
              axisTick: { show: false },
              axisLabel: {
                  color: '#8392a5',
                  showMinLabel: true,
                  showMaxLabel: true,
                  interval: (_index: number, value: string) => (
                      value !== '11:30' && (value.endsWith(':00') || value.endsWith(':30'))
                  )
              }
          },
          yAxis: {
              type: 'value',
              scale: true,
              axisLabel: { color: '#8392a5', formatter: (value: number) => `${value.toFixed(1)}%` },
              splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.08)', type: 'dashed' } }
          },
          series: [{
              name: activeAccount.value.label,
              type: 'line',
              showSymbol: false,
              smooth: 0.16,
              connectNulls: true,
              data: tradingTimeline.map(time => valuesByTime.get(time) ?? null),
              lineStyle: { width: 2.5, color: seriesColor },
              itemStyle: { color: seriesColor },
              areaStyle: { color: seriesColor, opacity: 0.05 },
              emphasis: { focus: 'series' }
          }]
      }
  })

  const formattedUpdatedAt = computed(() => {
      if (!observation.value?.updatedAt) return '--'
      return new Date(observation.value.updatedAt).toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
      })
  })

  function formatReturn(value: number | null | undefined) {
      if (value === null || value === undefined || !Number.isFinite(Number(value))) return '--'
      const number = Number(value)
      return `${number > 0 ? '+' : ''}${number.toFixed(2)}%`
  }

  function formatChartTime(value: number | string) {
      return new Date(Number(value)).toLocaleTimeString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
      })
  }

  function buildTradingTimeline() {
      const timeline: string[] = []
      const appendSession = (startMinutes: number, endMinutes: number) => {
          for (let minutes = startMinutes; minutes <= endMinutes; minutes += 1) {
              const hour = Math.floor(minutes / 60).toString().padStart(2, '0')
              const minute = (minutes % 60).toString().padStart(2, '0')
              timeline.push(`${hour}:${minute}`)
          }
      }

      appendSession(9 * 60 + 30, 11 * 60 + 30)
      appendSession(13 * 60, 15 * 60)
      return timeline
  }

  function returnClass(value: number | null | undefined) {
      const number = Number(value)
      if (!Number.isFinite(number) || number === 0) return 'return-flat'
      return number > 0 ? 'return-positive' : 'return-negative'
  }

  function formatQuantity(value: number | null) {
      return Number.isFinite(Number(value)) ? Number(value).toLocaleString('zh-CN') : '--'
  }

  function formatPrice(value: number | null) {
      return Number.isFinite(Number(value)) ? Number(value).toFixed(3) : '--'
  }

  function formatMoney(value: number | null) {
      return Number.isFinite(Number(value))
          ? `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '--'
  }

  async function loadObservation() {
      if (isLoading.value) return
      isLoading.value = true
      errorMessage.value = ''
      try {
          const response: any = await callCloudFunction({ name: 'getAccountObservation' })
          if (!response.result?.success) throw new Error(response.result?.message || '账户走势加载失败')
          observation.value = response.result.data
          if (!response.result.data.accounts.some((account: AccountSeries) => account.id === activeAccountId.value)) {
              activeAccountId.value = response.result.data.accounts[0]?.id || ''
          }
      } catch (error: any) {
          try {
              throwIfAuthExpired(error)
          } catch {
              return
          }
          errorMessage.value = error?.message || '账户走势加载失败'
      } finally {
          isLoading.value = false
      }
  }

  onMounted(loadObservation)
</script>

<style scoped lang="scss">
  .page-wrapper {
      --theme-one: #22c55e;
      --theme-two: #d4af37;
      --theme-border: rgb(74 222 128 / 28%);

      padding: 3rem 1rem 4rem;
      min-height: 100vh;
      font-family: 'Noto Sans SC', sans-serif;
      color: #fff;
      background:
          radial-gradient(circle at 14% 18%, rgb(22 101 52 / 24%), transparent 34%),
          radial-gradient(circle at 84% 14%, rgb(212 175 55 / 12%), transparent 30%),
          #121212;
      box-sizing: border-box;
  }

  .main-container {
      margin: 0 auto;
      width: 100%;
      max-width: 960px;
  }

  .page-header {
      margin-bottom: 3rem;
      text-align: center;
      animation: fade-in-up 0.5s ease-out both;
  }

  .back-button {
      display: inline-block;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      text-decoration: none;
      color: #b0c4de;
  }

  .back-button:hover {
      color: var(--theme-two);
  }

  .main-title {
      margin: 0 0 0.5rem;
      font-size: 2.5rem;
  }

  .subtitle {
      margin: 0;
      font-size: 1.1rem;
      color: #b0c4de;
  }

  .account-loading :deep(.strategy-loader-core) {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 0;
      gap: 12px;
  }

  .account-loading :deep(.strategy-loader-core)::before,
  .account-loading :deep(.strategy-loader-core)::after {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      content: '';
      animation: account-loading-dot 1.4s ease-in-out infinite;
  }

  .account-loading :deep(.strategy-loader-core)::before {
      background: var(--theme-one);
      box-shadow: 0 0 12px var(--theme-one);
  }

  .account-loading :deep(.strategy-loader-core)::after {
      background: var(--theme-two);
      box-shadow: 0 0 12px var(--theme-two);
      animation-delay: 0.7s;
  }

  .content-grid {
      display: grid;
      gap: 1.5rem;
  }

  .strategy-tabs {
      display: inline-flex;
      padding: 4px;
      width: fit-content;
      background: rgb(255 255 255 / 4%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 10px;
      justify-self: center;
      animation: fade-in-up 0.45s ease-out both;
  }

  .strategy-tab {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.62rem 1.2rem;
      min-width: 150px;
      font-size: 0.9rem;
      color: #8fa1b8;
      background: transparent;
      border: 0;
      border-radius: 7px;
      cursor: pointer;
      transition: color 0.2s ease, background-color 0.2s ease;
      gap: 0.55rem;
  }

  .strategy-tab:hover {
      color: #e2e8f0;
  }

  .strategy-tab.is-active {
      color: #fff;
      background: rgb(34 197 94 / 14%);
  }

  .strategy-tab-2.is-active {
      background: rgb(212 175 55 / 14%);
  }

  .content-card,
  .strategy-error {
      min-width: 0;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      animation: fade-in-up 0.5s ease-out both;
  }

  .strategy-dot {
      flex: 0 0 auto;
      width: 8px;
      height: 8px;
      background: var(--theme-one);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--theme-one);
  }

  .strategy-tab-2 .strategy-dot {
      background: var(--theme-two);
      box-shadow: 0 0 8px var(--theme-two);
  }

  .strategy-card-1 {
      --active-color: var(--theme-one);
      --active-border: rgb(34 197 94 / 28%);
  }

  .strategy-card-2 {
      --active-color: var(--theme-two);
      --active-border: rgb(212 175 55 / 30%);
  }

  .content-card {
      display: flex;
      padding: 1.5rem 2rem;
      flex-direction: column;
      transition: border-color 0.3s ease;
  }

  .content-card:hover {
      border-color: var(--active-border, var(--theme-border));
  }

  .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
  }

  .card-title {
      padding-left: 1rem;
      margin: 0 0 1rem;
      font-size: 1.4rem;
      color: #fff;
      border-left: 4px solid var(--active-color, var(--theme-two));
  }

  .chart-header,
  .holdings-header {
      margin-bottom: 1rem;
  }

  .chart-header .card-title,
  .holdings-header .card-title {
      margin-bottom: 0;
  }

  .chart-title-block {
      min-width: 180px;
  }

  .chart-strategy-name {
      display: block;
      padding-left: 1rem;
      margin-bottom: 0.38rem;
      font-size: 0.78rem;
      color: var(--active-color);
      letter-spacing: 0.08em;
  }

  .chart-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
  }

  .today-return {
      display: flex;
      align-items: baseline;
      padding-right: 0.9rem;
      border-right: 1px solid rgb(255 255 255 / 10%);
      gap: 0.5rem;
  }

  .today-return span {
      font-size: 0.78rem;
      white-space: nowrap;
      color: #8392a5;
  }

  .today-return strong {
      font-size: 1.35rem;
      white-space: nowrap;
  }

  .system-status,
  .holding-count {
      display: inline-flex;
      align-items: center;
      padding: 0.28rem 0.65rem;
      height: 30px;
      font-size: 0.78rem;
      white-space: nowrap;
      color: #f4dda0;
      background: rgb(212 175 55 / 10%);
      border: 1px solid rgb(212 175 55 / 28%);
      border-radius: 999px;
      box-sizing: border-box;
  }

  .system-status i {
      display: block;
      flex: 0 0 auto;
      margin-right: 0.4rem;
      width: 6px;
      height: 6px;
      background: var(--active-color, var(--theme-one));
      border-radius: 50%;
      box-shadow: 0 0 6px var(--active-color, var(--theme-one));
  }

  .refresh-button,
  .strategy-error button {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      padding: 0.5rem 0.85rem;
      color: #f4dda0;
      background: rgb(212 175 55 / 10%);
      border: 1px solid rgb(212 175 55 / 28%);
      border-radius: 8px;
      cursor: pointer;
      gap: 0.35rem;
  }

  .refresh-button {
      min-width: 72px;
      height: 30px;
      font-size: 0.82rem;
      box-sizing: border-box;
  }

  .refresh-button:hover:not(:disabled) {
      background: rgb(212 175 55 / 16%);
      border-color: rgb(212 175 55 / 52%);
  }

  .refresh-button:disabled {
      cursor: wait;
      opacity: 0.55;
  }

  .refresh-button .is-loading {
      animation: spin 0.8s linear infinite;
  }

  .return-chart {
      width: 100%;
      height: 430px;
  }

  .table-container {
      overflow-x: auto;
      border: 1px solid rgb(255 255 255 / 8%);
      border-radius: 8px;
  }

  table {
      width: 100%;
      border-collapse: collapse;
  }

  th,
  td {
      padding: 0.78rem 0.7rem;
      font-size: 0.82rem;
      text-align: center;
      white-space: nowrap;
      border-bottom: 1px solid rgb(255 255 255 / 7%);
  }

  th {
      color: #d8e4f2;
      background: rgb(0 0 0 / 25%);
  }

  tbody tr:last-child td {
      border-bottom: 0;
  }

  tbody tr:hover {
      background: rgb(22 101 52 / 10%);
  }

  .code-cell {
      font-family: monospace;
      color: #94a3b8;
  }

  .name-cell {
      color: #fff;
      font-weight: 700;
  }

  .return-positive {
      color: #f87171;
  }

  .return-negative {
      color: #4ade80;
  }

  .return-flat {
      color: #cbd5e1;
  }

  .refresh-warning,
  .no-data,
  .data-note {
      font-size: 0.82rem;
      color: #9fb2cc;
      line-height: 1.7;
  }

  .refresh-warning,
  .no-data {
      margin: 0.75rem 0 0;
      text-align: center;
  }

  .data-note {
      margin: -0.5rem 0 0;
      text-align: center;
  }

  .strategy-error {
      display: grid;
      padding: 3rem 2rem;
      text-align: center;
      color: #b0c4de;
      place-items: center;
  }

  .strategy-error h2 {
      margin: 0.8rem 0 0;
      color: #fff;
  }

  .strategy-error p {
      margin: 0.75rem 0 1.25rem;
  }

  .strategy-error-icon {
      display: grid;
      width: 42px;
      height: 42px;
      color: #f4dda0;
      background: rgb(212 175 55 / 10%);
      border: 1px solid rgb(212 175 55 / 28%);
      border-radius: 50%;
      place-items: center;
      font-weight: 800;
  }

  @keyframes fade-in-up {
      from {
          opacity: 0;
          transform: translateY(12px);
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

  @keyframes account-loading-dot {
      0%,
      100% {
          opacity: 0.35;
          transform: scale(0.72);
      }

      50% {
          opacity: 1;
          transform: scale(1);
      }
  }

  @media (max-width: 760px) {
      .page-wrapper {
          padding: 2rem 0.75rem 3rem;
      }

      .page-header {
          margin-bottom: 2rem;
      }

      .main-title {
          font-size: 2rem;
      }

      .content-card {
          padding: 1.25rem 1rem;
      }

      .strategy-tabs {
          width: 100%;
          box-sizing: border-box;
      }

      .strategy-tab {
          padding-right: 0.75rem;
          padding-left: 0.75rem;
          min-width: 0;
          flex: 1;
      }

      .card-header-row {
          align-items: flex-start;
          flex-direction: column;
      }

      .chart-header {
          position: relative;
          width: 100%;
      }

      .chart-title-block {
          width: calc(100% - 84px);
      }

      .chart-actions {
          width: 100%;
          flex-wrap: wrap;
      }

      .chart-actions .refresh-button {
          position: absolute;
          top: 0;
          right: 0;
      }

      .today-return {
          margin-right: auto;
      }

      .return-chart {
          height: 380px;
      }
  }
</style>
