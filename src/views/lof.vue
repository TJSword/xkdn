<template>
  <div class="page-wrapper">
    <div class="main-container">
      <div class="page-header">
        <router-link to="/home" class="back-button">← 返回主页</router-link>
        <h1 class="main-title">
          <span class="title-icon">📈</span>
          LOF 溢价监控
        </h1>
        <p class="subtitle">聚合公开数据源，观察场内价格、净值估算与溢价状态。</p>
      </div>

      <div v-if="isLoading" class="loading-state">
        <span class="loader"></span>
        <p>正在读取最新 LOF 快照...</p>
      </div>

      <div v-else class="content-grid">
        <div class="content-card filter-card">
          <div class="filter-toolbar">
            <div class="category-tabs">
              <button v-for="tab in categoryTabs" :key="tab.value" :class="['category-tab', { active: activeCategory === tab.value }]"
                @click="activeCategory = tab.value">
                {{ tab.label }}
              </button>
            </div>
            <span class="info-wrap" tabindex="0" aria-label="查看口径说明">
              <span class="info-icon">𝒾</span>
              <span class="info-popover">
                <span class="info-section">
                  <strong>到账与卖出节奏</strong>
                  <span>境内普通 LOF：场内申购后，通常 T+2 可在场内卖出。</span>
                  <span>QDII / 跨境 LOF：以基金公告为准，常见为 T+3 或更久可卖出。</span>
                </span>
                <span class="info-section">
                  <strong>估值口径</strong>
                  <span>欧美与商品按 T-1 估值观察，亚洲与境内按 T-1 净值观察；溢价均基于场内现价计算。</span>
                  <span>指数参考：欧美与商品多参考 T-1 指数或期货涨幅，亚洲与境内多参考 T 日指数表现。</span>
                  <span>实时估值为盘中观察值，基于 T-1 估值结合期货、指数或汇率近似换算。</span>
                </span>
              </span>
            </span>
          </div>

          <div class="filter-grid">
            <label class="field-group wide">
              <span>搜索</span>
              <input v-model.trim="query" class="input-field" type="search" placeholder="代码 / 名称 / 类型" />
            </label>
            <label class="field-group">
              <span>最低溢价</span>
              <input v-model.number="premiumMin" class="input-field" type="number" step="0.1" placeholder="不限" />
            </label>
            <label class="field-group">
              <span>最低成交额</span>
              <input v-model.number="turnoverMin" class="input-field" type="number" step="100" placeholder="万元" />
            </label>
            <label class="field-group">
              <span>申购限额上限</span>
              <input v-model.number="purchaseLimitMax" class="input-field" type="number" step="1000" placeholder="元" />
            </label>
            <label class="toggle-control">
              <input v-model="purchasableOnly" type="checkbox" />
              <span>仅看可申购</span>
            </label>
          </div>

          <p v-if="noticeText" class="notice-text">{{ noticeText }}</p>
        </div>

        <div class="content-card table-card">
          <div class="card-header-row">
            <h2 class="card-title no-margin">实时列表</h2>
            <div class="table-meta">
              <span :class="['updated-meta', isStale ? 'text-warning' : '']">
                更新时间 {{ formattedUpdatedAt }} · {{ isStale ? '数据可能延迟' : '快照可用' }}
              </span>
              <button v-if="canForceRefresh" class="mini-refresh-button" :disabled="isRefreshing" @click="loadData(true)">
                {{ isRefreshing ? '刷新中' : '刷新' }}
              </button>
              <span class="row-count">{{ pageRangeText }} / {{ filteredRows.length }}</span>
            </div>
          </div>

          <div class="table-container">
            <table class="lof-table">
              <thead>
                <tr>
                  <th class="col-watch">
                    <button class="sort-button center" @click="toggleSort('watchlist')">自选<span>{{ sortIndicator('watchlist') }}</span></button>
                  </th>
                  <th class="col-code">
                    <button class="sort-button left" @click="toggleSort('code')">代码<span>{{ sortIndicator('code') }}</span></button>
                  </th>
                  <th class="col-name">
                    <button class="sort-button left" @click="toggleSort('name')">名称<span>{{ sortIndicator('name') }}</span></button>
                  </th>
                  <th class="col-type">
                    <button class="sort-button left" @click="toggleSort('type')">类型<span>{{ sortIndicator('type') }}</span></button>
                  </th>
                  <th class="col-price">
                    <button class="sort-button left" @click="toggleSort('price')">现价<span>{{ sortIndicator('price') }}</span></button>
                  </th>
                  <th class="col-change">
                    <button class="sort-button left" @click="toggleSort('change')">涨跌<span>{{ sortIndicator('change') }}</span></button>
                  </th>
                  <th v-if="showT2Columns" class="col-estimate">
                    <button class="sort-button" @click="toggleSort('t2Estimate')">T-2净值<span>{{ sortIndicator('t2Estimate') }}</span></button>
                  </th>
                  <th v-if="showT2Columns" class="col-premium">
                    <button class="sort-button" @click="toggleSort('t2Premium')">T-2溢价<span>{{ sortIndicator('t2Premium') }}</span></button>
                  </th>
                  <th class="col-estimate">
                    <button class="sort-button" @click="toggleSort('t1Estimate')">T-1估值<span>{{ sortIndicator('t1Estimate') }}</span></button>
                  </th>
                  <th class="col-premium">
                    <button class="sort-button" @click="toggleSort('t1Premium')">T-1溢价<span>{{ sortIndicator('t1Premium') }}</span></button>
                  </th>
                  <th class="col-estimate">
                    <button class="sort-button" @click="toggleSort('realEstimate')">实时估值<span>{{ sortIndicator('realEstimate') }}</span></button>
                  </th>
                  <th class="col-premium">
                    <button class="sort-button" @click="toggleSort('realPremium')">实时溢价<span>{{ sortIndicator('realPremium') }}</span></button>
                  </th>
                  <th class="col-amount">
                    <button class="sort-button" @click="toggleSort('turnover')">成交额<span>{{ sortIndicator('turnover') }}</span></button>
                  </th>
                  <th class="col-status">
                    <button class="sort-button" @click="toggleSort('purchaseLimit')">申购状态<span>{{ sortIndicator('purchaseLimit') }}</span></button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in pagedRows" :key="row.code">
                  <td class="col-watch">
                    <button :class="['watch-button', { active: isWatchlisted(row.code) }]" @click="toggleWatchlist(row.code)"
                      :title="isWatchlisted(row.code) ? '移出自选' : '加入自选'">
                      {{ isWatchlisted(row.code) ? '★' : '☆' }}
                    </button>
                  </td>
                  <td class="col-code code-cell">{{ row.code }}</td>
                  <td class="col-name name-cell" :title="row.name">{{ row.name }}</td>
                  <td class="col-type">{{ categoryLabel(row) }}</td>
                  <td class="col-price">{{ formatNumber(row.price, 3) }}</td>
                  <td class="col-change" :class="valueClass(row.change)">{{ formatPercent(row.change) }}</td>
                  <td v-if="showT2Columns" class="col-estimate">{{ formatNumber(row.t2Estimate, 4) }}</td>
                  <td v-if="showT2Columns" class="col-premium" :class="valueClass(row.t2Premium)">{{ formatPercent(row.t2Premium) }}</td>
                  <td class="col-estimate">{{ formatNumber(row.t1Estimate, 4) }}</td>
                  <td class="col-premium" :class="valueClass(row.t1Premium)">{{ formatPercent(row.t1Premium) }}</td>
                  <td class="col-estimate">{{ formatNumber(row.realEstimate, 4) }}</td>
                  <td class="col-premium" :class="valueClass(row.realPremium)">{{ formatPercent(row.realPremium) }}</td>
                  <td class="col-amount">{{ formatAmount(row.turnover) }}</td>
                  <td class="col-status">
                    <span :class="['status-pill', isPurchasePaused(row) ? 'closed' : 'open']">
                      {{ formatPurchaseStatus(row) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mobile-list">
            <div v-for="row in pagedRows" :key="`mobile-${row.code}`" class="lof-item">
              <div class="item-head">
                <div>
                  <strong>{{ row.code }}</strong>
                  <span :title="row.name">{{ row.name }}</span>
                </div>
                <button :class="['watch-button', { active: isWatchlisted(row.code) }]" @click="toggleWatchlist(row.code)"
                  :title="isWatchlisted(row.code) ? '移出自选' : '加入自选'">
                  {{ isWatchlisted(row.code) ? '★' : '☆' }}
                </button>
                <span :class="['premium-badge', valueClass(row.realPremium ?? row.latestPremium)]">
                  {{ formatPercent(row.realPremium ?? row.latestPremium) }}
                </span>
              </div>
              <div class="item-grid">
                <div>
                  <small>现价</small>
                  <span>{{ formatNumber(row.price, 3) }}</span>
                </div>
                <div>
                  <small>涨跌</small>
                  <span :class="valueClass(row.change)">{{ formatPercent(row.change) }}</span>
                </div>
                <div v-if="showT2Columns">
                  <small>T-2净值</small>
                  <span>{{ formatNumber(row.t2Estimate, 4) }}</span>
                </div>
                <div v-if="showT2Columns">
                  <small>T-2溢价</small>
                  <span :class="valueClass(row.t2Premium)">{{ formatPercent(row.t2Premium) }}</span>
                </div>
                <div>
                  <small>T-1估值</small>
                  <span>{{ formatNumber(row.t1Estimate, 4) }}</span>
                </div>
                <div>
                  <small>T-1溢价</small>
                  <span :class="valueClass(row.t1Premium)">{{ formatPercent(row.t1Premium) }}</span>
                </div>
                <div>
                  <small>实时估值</small>
                  <span>{{ formatNumber(row.realEstimate, 4) }}</span>
                </div>
                <div>
                  <small>实时溢价</small>
                  <span :class="valueClass(row.realPremium)">{{ formatPercent(row.realPremium) }}</span>
                </div>
                <div>
                  <small>成交额</small>
                  <span>{{ formatAmount(row.turnover) }}</span>
                </div>
                <div>
                  <small>申购状态</small>
                  <span>{{ formatPurchaseStatus(row) }}</span>
                </div>
              </div>
              <div class="item-foot">
                <span>{{ categoryLabel(row) }}</span>
              </div>
            </div>
          </div>

          <div v-if="filteredRows.length === 0" class="empty-state">暂无匹配数据</div>

          <div v-else class="pagination-bar">
            <button class="page-button" :disabled="currentPage === 1" @click="currentPage -= 1">上一页</button>
            <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
            <button class="page-button" :disabled="currentPage === totalPages" @click="currentPage += 1">下一页</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import app from '@/lib/cloudbase'
  import { useUserStore } from '@/store/user'

  interface LofRow {
      code: string
      name: string
      category?: string
      categoryKey?: string
      realEstimate?: number | null
      realPremium?: number | null
      t2Estimate?: number | null
      t2Premium?: number | null
      t1Estimate?: number | null
      t1Premium?: number | null
      latestEstimate?: number | null
      latestPremium?: number | null
      price?: number | null
      change?: number | null
      turnover?: number | null
      nav?: number | null
      purchaseLimit?: string
      isOpen?: boolean | null
      isTradable?: boolean | null
      estimateSource?: string
      source?: string
      premium?: number | null
  }

  type SortKey = 'watchlist' | 'code' | 'name' | 'type' | 'price' | 'change' | 't2Estimate' | 't2Premium' | 't1Estimate' | 't1Premium' | 'realEstimate' | 'realPremium' | 'turnover' | 'purchaseLimit' | 'premium'
  type SortDirection = 'asc' | 'desc'

  const userStore: any = useUserStore()
  const isLoading = ref(true)
  const isRefreshing = ref(false)
  const rows = ref<LofRow[]>([])
  const sources = ref<string[]>([])
  const warnings = ref<string[]>([])
  const refreshedAt = ref('')
  const errorMessage = ref('')
  const query = ref('')
  const activeCategory = ref('all')
  const premiumMin = ref<number | null>(null)
  const turnoverMin = ref<number | null>(null)
  const purchaseLimitMax = ref<number | null>(null)
  const purchasableOnly = ref(true)
  const watchlist = ref<string[]>([])
  const sortKey = ref<SortKey>('premium')
  const sortDirection = ref<SortDirection>('desc')
  const pageSize = 20
  const currentPage = ref(1)

  const canForceRefresh = computed(() => userStore.userInfo?.admin === true)
  const categoryTabs = [
      { label: '全部', value: 'all' },
      { label: '欧美市场', value: 'europe-us' },
      { label: '亚洲市场', value: 'asia' },
      { label: '境内市场', value: 'domestic' },
      { label: '商品', value: 'commodity' },
      { label: '自选', value: 'watchlist' }
  ]

  const categoryLabelMap: Record<string, string> = {
      'europe-us': '欧美市场',
      asia: '亚洲市场',
      domestic: '境内市场',
      commodity: '商品'
  }

  const showT2Columns = computed(() => activeCategory.value !== 'asia' && activeCategory.value !== 'domestic')

  const LOF_DISPLAY_ALLOWLIST = new Set(['161130'])

  const normalizedRows = computed(() =>
      rows.value.filter(shouldDisplayLofRow).map(row => ({
          ...row,
          premium: row.realPremium ?? row.t1Premium ?? row.t2Premium ?? row.latestPremium ?? null
      }))
  )

  const filteredRows = computed(() => {
      const keyword = query.value.toLowerCase()
      const min = typeof premiumMin.value === 'number' && Number.isFinite(premiumMin.value) ? premiumMin.value : null
      const turnover = typeof turnoverMin.value === 'number' && Number.isFinite(turnoverMin.value) ? turnoverMin.value : null
      const purchaseLimit = typeof purchaseLimitMax.value === 'number' && Number.isFinite(purchaseLimitMax.value) ? purchaseLimitMax.value : null

      return normalizedRows.value
          .filter(row => {
              if (activeCategory.value === 'watchlist') {
                  if (!watchlist.value.includes(row.code)) return false
              } else if (activeCategory.value !== 'all' && row.categoryKey !== activeCategory.value) {
                  return false
              }
              if (keyword) {
                  const text = `${row.code} ${row.name} ${row.category || ''} ${row.categoryKey || ''} ${categoryLabel(row)}`.toLowerCase()
                  if (!text.includes(keyword)) return false
              }
              if (purchasableOnly.value && row.isOpen === false) return false
              if (min !== null && (row.premium === null || row.premium < min)) return false
              if (turnover !== null && (toNumber(row.turnover) === null || Number(row.turnover) < turnover)) return false
              if (purchaseLimit !== null && !isPurchaseLimitWithinCap(row.purchaseLimit, purchaseLimit)) return false
              return true
          })
          .sort(compareRows)
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))
  const pagedRows = computed(() => {
      const start = (currentPage.value - 1) * pageSize
      return filteredRows.value.slice(start, start + pageSize)
  })

  const pageRangeText = computed(() => {
      if (!filteredRows.value.length) return '0'
      const start = (currentPage.value - 1) * pageSize + 1
      const end = Math.min(currentPage.value * pageSize, filteredRows.value.length)
      return `${start}-${end}`
  })

  const formattedUpdatedAt = computed(() => {
      if (!refreshedAt.value) return '--'
      return new Date(refreshedAt.value).toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
      })
  })

  const isStale = computed(() => {
      if (!refreshedAt.value) return true
      return Date.now() - new Date(refreshedAt.value).getTime() > 5 * 60 * 1000
  })

  const noticeText = computed(() => {
      if (errorMessage.value) return errorMessage.value
      return ''
  })

  watch([query, activeCategory, premiumMin, turnoverMin, purchaseLimitMax, purchasableOnly], () => {
      currentPage.value = 1
  })

  watch(watchlist, value => {
      saveWatchlist(value)
  }, { deep: true })

  watch(totalPages, value => {
      if (currentPage.value > value) currentPage.value = value
  })

  function toggleSort(key: SortKey) {
      if (sortKey.value === key) {
          sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
          sortKey.value = key
          sortDirection.value = 'desc'
      }
      currentPage.value = 1
  }

  function sortIndicator(key: SortKey) {
      if (sortKey.value !== key) return ''
      return sortDirection.value === 'asc' ? '↑' : '↓'
  }

  function getSortValue(row: LofRow, key: SortKey) {
      if (key === 'watchlist') return isWatchlisted(row.code) ? 1 : 0
      if (key === 'type') return categoryLabel(row)
      if (key === 'purchaseLimit') return parsePurchaseLimitValue(row.purchaseLimit)
      return row[key as keyof LofRow] ?? null
  }

  function compareRows(a: LofRow, b: LofRow) {
      const aValue = getSortValue(a, sortKey.value)
      const bValue = getSortValue(b, sortKey.value)
      const aEmpty = aValue === null || aValue === undefined || aValue === ''
      const bEmpty = bValue === null || bValue === undefined || bValue === ''
      if (aEmpty && bEmpty) return String(a.code).localeCompare(String(b.code))
      if (aEmpty) return 1
      if (bEmpty) return -1

      const direction = sortDirection.value === 'asc' ? 1 : -1
      if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue === bValue) return String(a.code).localeCompare(String(b.code))
          return (aValue - bValue) * direction
      }

      const result = String(aValue).localeCompare(String(bValue), 'zh-CN', { numeric: true })
      return result === 0 ? String(a.code).localeCompare(String(b.code)) : result * direction
  }

  function toNumber(value: unknown) {
      if (value === null || value === undefined || value === '') return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
  }

  function formatNumber(value: unknown, digits = 2) {
      const number = toNumber(value)
      return number === null ? '--' : number.toFixed(digits)
  }

  function formatPercent(value: unknown) {
      const number = toNumber(value)
      if (number === null) return '--'
      return `${number > 0 ? '+' : ''}${number.toFixed(2)}%`
  }

  function formatAmount(value: unknown) {
      const number = toNumber(value)
      if (number === null) return '--'
      if (number >= 10000) return `${(number / 10000).toFixed(2)}亿`
      return `${number.toFixed(0)}万`
  }

  function valueClass(value: unknown) {
      const number = toNumber(value)
      if (number === null || number === 0) return ''
      return number > 0 ? 'text-red' : 'text-green'
  }

  function categoryLabel(row: LofRow) {
      return categoryLabelMap[row.categoryKey || ''] || row.category || '--'
  }

  function shouldDisplayLofRow(row: LofRow) {
      const code = String(row.code || '')
      const name = String(row.name || '')
      const source = String(row.source || '')
      if (!/^(16|50)\d{4}$/.test(code)) return false
      if (/ETF/i.test(name) && !/LOF/i.test(name) && !LOF_DISPLAY_ALLOWLIST.has(code)) return false
      return LOF_DISPLAY_ALLOWLIST.has(code) || /LOF/i.test(name) || source.split('+').includes('fallback')
  }

  function parsePurchaseLimitValue(value: unknown) {
      const text = String(value || '')
      if (!text || /暂停|不可|停牌/.test(text)) return null
      if (/无限额|不限额|开放\/无限额|开放申购/.test(text)) return Number.POSITIVE_INFINITY

      const match = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/)
      const number = match ? Number(match[1]) : null
      if (number === null) return 0
      if (/万/.test(text)) return number * 10000
      if (/千/.test(text)) return number * 1000
      return number
  }

  function isPurchaseLimitWithinCap(value: unknown, max: number) {
      const limit = parsePurchaseLimitValue(value)
      return typeof limit === 'number' && Number.isFinite(limit) && limit > 0 && limit <= max
  }

  function isPurchasePaused(row: LofRow) {
      const text = String(row.purchaseLimit || '')
      return row.isOpen === false || /暂停|不可|停牌/.test(text)
  }

  function formatPurchaseStatus(row: LofRow) {
      const text = String(row.purchaseLimit || '').trim()
      if (isPurchasePaused(row)) return '暂停申购'
      if (!text || /无限额|不限额|开放\/无限额|开放申购|开放/.test(text)) return '无限额'

      const match = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/)
      if (!match) return '无限额'

      const number = Number(match[1])
      if (!Number.isFinite(number)) return '无限额'
      const normalized = /万/.test(text) ? number * 10000 : /千/.test(text) ? number * 1000 : number
      return normalized.toLocaleString('zh-CN')
  }

  function isWatchlisted(code: string) {
      return watchlist.value.includes(code)
  }

  function toggleWatchlist(code: string) {
      if (isWatchlisted(code)) {
          watchlist.value = watchlist.value.filter(item => item !== code)
      } else {
          watchlist.value = [...watchlist.value, code]
      }
  }

  function loadWatchlist() {
      try {
          const saved = JSON.parse(window.localStorage.getItem('lofWatchlist') || '[]')
          return Array.isArray(saved) ? saved.filter(Boolean) : []
      } catch {
          return []
      }
  }

  function saveWatchlist(value: string[]) {
      try {
          window.localStorage.setItem('lofWatchlist', JSON.stringify(value))
      } catch {
          // localStorage may be unavailable in some embedded/private browser modes.
      }
  }

  async function loadData(forceRefresh = false) {
      if (forceRefresh) {
          isRefreshing.value = true
      } else {
          isLoading.value = true
      }

      try {
          const res: any = await app.callFunction({
              name: 'getLofData',
              data: forceRefresh ? { forceRefresh: true } : {},
              parse: true
          })
          const result = res.result || {}
          const data = result.data || {}

          if (!result.success && result.message) {
              errorMessage.value = result.message
          } else {
              errorMessage.value = data.error || ''
          }

          rows.value = Array.isArray(data.rows) ? data.rows : []
          sources.value = Array.isArray(data.sources) ? data.sources : []
          warnings.value = Array.isArray(data.warnings) ? data.warnings : []
          refreshedAt.value = data.refreshedAt || ''
      } catch (error: any) {
          errorMessage.value = error.message || 'LOF 数据加载失败'
      } finally {
          isLoading.value = false
          isRefreshing.value = false
      }
  }

  onMounted(() => {
      watchlist.value = loadWatchlist()
      loadData()
  })
</script>

<style scoped lang="scss">
  .page-wrapper {
      padding: 3rem 1rem;
      min-height: 100vh;
      font-family: 'Noto Sans SC', sans-serif;
      color: #fff;
      background: radial-gradient(circle at 15% 20%, rgb(0 170 255 / 12%), transparent 32%),
          radial-gradient(circle at 82% 18%, rgb(255 87 34 / 10%), transparent 30%), #121212;
      box-sizing: border-box;
  }

  .main-container {
      margin: 0 auto;
      max-width: 1120px;
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
      font-size: 0.9rem;
      text-decoration: none;
      color: #b0c4de;
      transition: color 0.3s ease;
  }

  .back-button:hover {
      color: #0af;
  }

  .main-title {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 0 0.6rem;
      font-size: 2.5rem;
      font-weight: 700;
      gap: 1rem;
  }

  .title-icon {
      font-size: 2.5rem;
      color: #0af;
      text-shadow: 0 0 15px rgb(0 170 255 / 70%);
  }

  .info-wrap {
      position: relative;
      z-index: 10000;
      display: inline-flex;
      justify-content: center;
      align-items: center;
  }

  .info-icon {
      display: inline-grid;
      width: 26px;
      height: 26px;
      font-size: 1.12rem;
      color: #d7f5ff;
      background: rgb(0 170 255 / 14%);
      border: 1px solid rgb(0 170 255 / 78%);
      border-radius: 50%;
      filter: drop-shadow(0 0 8px rgb(0 170 255 / 35%));
      place-items: center;
      font-weight: 700;
      line-height: 25px;
      cursor: help;
  }

  .info-popover {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      z-index: 10001;
      display: grid;
      padding: 1rem;
      width: min(760px, calc(100vw - 2rem));
      text-align: left;
      background: rgb(18 18 18 / 96%);
      border: 1px solid rgb(255 255 255 / 14%);
      border-radius: 8px;
      opacity: 0;
      box-shadow: 0 18px 45px rgb(0 0 0 / 35%);
      transition: opacity 0.2s ease, transform 0.2s ease;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      transform: translate(0, 8px);
      pointer-events: none;
  }

  .info-wrap:hover .info-popover,
  .info-wrap:focus-within .info-popover {
      transform: translate(0, 0);
      opacity: 1;
      pointer-events: auto;
  }

  .info-section {
      display: flex;
      font-size: 0.82rem;
      color: #b0c4de;
      flex-direction: column;
      gap: 0.5rem;
      font-weight: 400;
      line-height: 1.6;
  }

  .info-section strong {
      font-size: 0.95rem;
      color: #fff;
  }

  .subtitle {
      margin: 0;
      font-size: 1rem;
      color: #b0c4de;
  }

  .content-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
  }

  .content-card {
      position: relative;
      padding: 1.25rem;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 12px;
      opacity: 0;
      backdrop-filter: blur(10px);
      animation: fadeInUp 0.5s ease-out forwards;
  }

  .content-card:hover {
      border-color: rgb(0 170 255 / 40%);
  }

  .notice-text {
      margin: 1rem 0 0;
      font-size: 0.88rem;
      color: #ffb74d;
      line-height: 1.6;
  }

  .filter-card {
      animation-delay: 0.1s;
      z-index: 50;
      overflow: visible;
  }

  .filter-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 1rem;
  }

  .category-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
  }

  .category-tab {
      padding: 0.45rem 0.75rem;
      color: #b0c4de;
      background: rgb(0 0 0 / 22%);
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 6px;
      transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
      cursor: pointer;
  }

  .category-tab:hover,
  .category-tab.active {
      color: #0af;
      background: rgb(0 170 255 / 10%);
      border-color: rgb(0 170 255 / 55%);
  }

  .filter-grid {
      display: grid;
      grid-template-columns: minmax(220px, 1.6fr) repeat(3, minmax(130px, 1fr)) auto;
      gap: 1rem;
      align-items: end;
  }

  .field-group,
  .toggle-control {
      display: flex;
      font-size: 0.85rem;
      color: #b0c4de;
      flex-direction: column;
      gap: 0.45rem;
  }

  .input-field {
      padding: 0.72rem 0.85rem;
      width: 100%;
      color: #fff;
      background: rgb(0 0 0 / 28%);
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 6px;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
  }

  .input-field:focus {
      border-color: rgb(0 170 255 / 65%);
      box-shadow: 0 0 0 3px rgb(0 170 255 / 12%);
  }

  .toggle-control {
      flex-direction: row;
      align-items: center;
      min-height: 42px;
      white-space: nowrap;
  }

  .toggle-control input {
      width: 16px;
      height: 16px;
      accent-color: #0af;
  }

  .table-card {
      animation-delay: 0.2s;
      z-index: 1;
  }

  .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
  }

  .table-meta {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      font-size: 0.85rem;
      color: #8392a5;
      flex-wrap: wrap;
      gap: 0.65rem;
  }

  .updated-meta {
      white-space: nowrap;
  }

  .mini-refresh-button {
      padding: 0.38rem 0.65rem;
      white-space: nowrap;
      color: #0af;
      background: rgb(0 170 255 / 8%);
      border: 1px solid rgb(0 170 255 / 45%);
      border-radius: 6px;
      transition: background 0.2s ease, opacity 0.2s ease;
      cursor: pointer;
  }

  .mini-refresh-button:hover:not(:disabled) {
      background: rgb(0 170 255 / 16%);
  }

  .mini-refresh-button:disabled {
      cursor: wait;
      opacity: 0.55;
  }

  .card-title {
      margin: 0 0 1rem;
      font-size: 1.2rem;
      color: #fff;
      font-weight: bold;
  }

  .card-title.no-margin {
      margin: 0;
  }

  .row-count {
      white-space: nowrap;
  }

  .table-container {
      overflow-x: visible;
      -webkit-overflow-scrolling: touch;
  }

  .lof-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
  }

  .lof-table th,
  .lof-table td {
      box-sizing: border-box;
      overflow: hidden;
      text-overflow: ellipsis;
  }

  .lof-table th {
      padding: 0;
      font-size: 0.78rem;
      text-align: right;
      white-space: nowrap;
      color: #b0c4de;
      background: rgb(0 170 255 / 6%);
      font-weight: 600;
      border-bottom: 1px solid rgb(0 170 255 / 22%);
  }

  .sort-button {
      display: inline-flex;
      justify-content: flex-start;
      align-items: center;
      padding: 0.72rem 0.25rem;
      width: 100%;
      min-height: 42px;
      white-space: nowrap;
      color: inherit;
      background: transparent;
      border: 0;
      gap: 0.12rem;
      font: inherit;
      line-height: 1.2;
      cursor: pointer;
  }

  .sort-button.left {
      justify-content: flex-start;
  }

  .sort-button.center {
      position: relative;
      justify-content: center;
  }

  .sort-button.center span {
      position: absolute;
      right: 0.1rem;
  }

  .sort-button span {
      width: 0.65rem;
      font-size: 0.72rem;
      color: #0af;
      flex: 0 0 0.65rem;
      line-height: 1;
  }

  .sort-button:hover {
      color: #0af;
  }

  .col-watch,
  .col-code,
  .col-name,
  .col-type {
      text-align: left;
  }

  .col-watch {
      width: 4%;
      text-align: center;
  }

  .col-code {
      width: 6%;
  }

  .col-name {
      width: 13%;
  }

  .col-type {
      width: 6.5%;
  }

  .col-price,
  .col-change {
      width: 5.5%;
  }

  .col-estimate,
  .col-premium {
      width: 7%;
  }

  .col-amount {
      width: 6%;
  }

  .col-status {
      overflow: visible;
      width: 8%;
      text-overflow: clip;
  }

  .lof-table td {
      padding: 0.82rem 0.25rem;
      font-size: 0.8rem;
      font-family: 'Noto Sans SC', 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
      font-variant-numeric: tabular-nums lining-nums;
      font-feature-settings: 'tnum' 1, 'lnum' 1;
      text-align: left;
      white-space: nowrap;
      color: #e8edf5;
      vertical-align: middle;
      border-bottom: 1px solid rgb(255 255 255 / 6%);
  }

  .lof-table td.col-watch {
      text-align: center;
  }

  .lof-table th.col-watch {
      text-align: center;
  }

  .lof-table tbody tr:hover {
      background: rgb(255 255 255 / 3.5%);
  }

  .code-cell {
      color: #0af !important;
      font-weight: 700;
  }

  .watch-button {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      width: 24px;
      height: 24px;
      font-size: 1.05rem;
      color: #8392a5;
      background: transparent;
      border: 0;
      transition: color 0.2s ease, transform 0.2s ease;
      line-height: 1;
      cursor: pointer;
      vertical-align: middle;
      transform: translateY(2px);
  }

  .watch-button:hover,
  .watch-button.active {
      color: #ffd166;
      transform: translateY(1px) scale(1.08);
  }

  .name-cell {
      font-family: 'Noto Sans SC', sans-serif !important;
  }

  .status-pill {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      overflow: visible;
      padding: 0.2rem 0.35rem;
      max-width: 100%;
      font-size: 0.76rem;
      font-family: 'Noto Sans SC', sans-serif;
      text-overflow: clip;
      color: #00c497;
      background: rgb(0 196 151 / 10%);
      border-radius: 999px;
      box-sizing: border-box;
  }

  .status-pill.closed {
      color: #ffb74d;
      background: rgb(255 183 77 / 12%);
  }

  .mobile-list {
      display: none;
  }

  .lof-item {
      padding: 1rem;
      background: rgb(0 0 0 / 22%);
      border: 1px solid rgb(255 255 255 / 8%);
      border-radius: 10px;
  }

  .item-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 0.75rem;
  }

  .item-head div {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
      flex: 1;
  }

  .item-head strong {
      font-size: 1rem;
      color: #0af;
  }

  .item-head span {
      font-size: 0.92rem;
      color: #fff;
      line-height: 1.4;
  }

  .premium-badge {
      padding: 0.35rem 0.55rem;
      font-family: 'Noto Sans SC', 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
      font-variant-numeric: tabular-nums lining-nums;
      font-feature-settings: 'tnum' 1, 'lnum' 1;
      background: rgb(255 255 255 / 6%);
      border-radius: 6px;
      flex: 0 0 auto;
      font-weight: 700;
  }

  .item-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
  }

  .item-grid div {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
  }

  .item-grid small,
  .item-foot {
      font-size: 0.76rem;
      color: #8392a5;
  }

  .item-grid span {
      font-family: 'Noto Sans SC', 'Microsoft YaHei', 'Segoe UI', Arial, sans-serif;
      font-variant-numeric: tabular-nums lining-nums;
      font-feature-settings: 'tnum' 1, 'lnum' 1;
      color: #e8edf5;
  }

  .item-foot {
      display: flex;
      justify-content: space-between;
      gap: 0.8rem;
      margin-top: 0.9rem;
      line-height: 1.4;
  }

  .empty-state {
      padding: 2rem 0 0;
      text-align: center;
      color: #8392a5;
  }

  .pagination-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 1.2rem;
      font-size: 0.9rem;
      color: #b0c4de;
      gap: 1rem;
  }

  .page-button {
      padding: 0.5rem 0.75rem;
      min-width: 76px;
      color: #0af;
      background: rgb(0 170 255 / 8%);
      border: 1px solid rgb(0 170 255 / 45%);
      border-radius: 6px;
      transition: background 0.2s ease, opacity 0.2s ease;
      cursor: pointer;
  }

  .page-button:hover:not(:disabled) {
      background: rgb(0 170 255 / 16%);
  }

  .page-button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
  }

  .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
      color: #b0c4de;
      flex-direction: column;
      gap: 1rem;
  }

  .loader {
      width: 32px;
      height: 32px;
      border: 3px solid rgb(255 255 255 / 12%);
      border-top-color: #0af;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
  }

  .highlight-blue {
      color: #0af;
      text-shadow: 0 0 8px rgb(0 170 255 / 40%);
  }

  .text-red {
      color: #ff4d4f !important;
  }

  .text-green {
      color: #00c497 !important;
  }

  .text-warning {
      color: #ffb74d !important;
  }

  @keyframes spin {
      to {
          transform: rotate(360deg);
      }
  }

  @keyframes fadeInUp {
      from {
          transform: translateY(12px);
          opacity: 0;
      }

      to {
          transform: translateY(0);
          opacity: 1;
      }
  }

  @media (max-width: 1024px) {
      .filter-grid {
          grid-template-columns: 1fr 1fr;
      }
  }

  @media (max-width: 768px) {
      .page-wrapper {
          padding: 1rem;
      }

      .page-header {
          padding-top: 1rem;
          margin-bottom: 2rem;
      }

      .main-title {
          font-size: 1.7rem;
          gap: 0.6rem;
          flex-wrap: wrap;
      }

      .title-icon {
          font-size: 2rem;
      }

      .subtitle {
          font-size: 0.9rem;
          line-height: 1.6;
      }

      .content-card {
          padding: 1rem;
          border-radius: 10px;
      }

      .filter-grid {
          grid-template-columns: 1fr;
      }

      .filter-toolbar {
          flex-direction: row;
          align-items: flex-start;
          gap: 0.8rem;
      }

      .category-tabs {
          flex: 1 1 auto;
          min-width: 0;
      }

      .info-wrap {
          position: relative;
          flex: 0 0 auto;
          margin-left: auto;
      }

      .info-popover {
          position: fixed;
          top: 4.75rem;
          right: 1rem;
          left: 1rem;
          overflow-y: auto;
          width: auto;
          max-height: calc(100vh - 5.75rem);
          grid-template-columns: 1fr;
          transform: translate(0, 8px);
      }

      .info-wrap:hover .info-popover,
      .info-wrap:focus-within .info-popover {
          transform: translate(0, 0);
      }

      .toggle-control {
          min-height: auto;
      }

      .table-container {
          display: none;
      }

      .mobile-list {
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
      }

      .card-header-row {
          align-items: flex-start;
          flex-direction: column;
          gap: 0.3rem;
      }

      .table-meta {
          justify-content: flex-start;
      }

      .pagination-bar {
          gap: 0.6rem;
      }

      .page-button {
          flex: 1;
      }
  }
</style>
