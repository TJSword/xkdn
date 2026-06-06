<template>
  <div class="page-wrapper">
    <div class="main-container">

      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>
        <h1 class="main-title">
          <span class="title-icon">⚖️</span>
          微盘股调仓
        </h1>
        <p class="subtitle">
          监控持仓明细、市值分布及每日资金再平衡。
        </p>
      </div>

      <div class="content-grid">

        <div class="content-card control-panel">
          <div class="panel-section config-section">
            <div class="section-label" style="display: flex; justify-content: space-between; align-items: center;">
              <span><span class="icon">⚙️</span> 明日计划资金</span>
              <div class="cookie-actions">
                <button class="text-icon-btn" @click="openCookieModal" title="设置雪球 Cookie">
                  🍪 设置 Cookie
                </button>
                <button
                  class="text-icon-btn"
                  :disabled="isCheckingCookie"
                  @click="checkCookie"
                  title="检查雪球 Cookie 状态"
                >
                  {{ isCheckingCookie ? '检查中...' : '✓ 检查 Cookie' }}
                </button>
              </div>
            </div>
            <div class="input-group">
              <span class="currency">¥</span>
              <input type="number" v-model.number="planAmount" class="amount-input" step="10000" placeholder="输入金额">
              <button class="save-btn" :disabled="isSavingAmount || planAmount === savedAmount" @click="savePlanAmount"
                :title="planAmount === savedAmount ? '已保存' : '点击保存到服务器'">
                {{ isSavingAmount ? '...' : (planAmount === savedAmount ? '已保存' : '保存') }}
              </button>
            </div>
            <div class="tip-text" v-if="planAmount !== savedAmount">
              * 修改后请保存，下次调仓时生效
            </div>
          </div>

          <div class="panel-divider"></div>

          <div class="panel-section metrics-section">
            <div class="metric-item">
              <div class="metric-label" style="color: #ffd700;">当前持仓总价值</div>
              <div class="metric-value" style="color: #ffd700;">
                ¥ {{ formatMoney(totalHoldingsValue) }}
              </div>
            </div>
            <div class="metric-item">
              <div class="metric-label">持仓市值中位数</div>
              <div class="metric-value">{{ formatMktCap(portfolioMetrics.median_cap) }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">持仓市值平均数</div>
              <div class="metric-value">{{ formatMktCap(portfolioMetrics.avg_cap) }}</div>
            </div>
          </div>
        </div>

        <div class="content-card">
          <div class="card-header-flex">
            <h2 class="card-title">调仓操作建议</h2>
            <div class="update-time-badge">
              <span class="dot">●</span>
              数据更新: <span class="time-text">{{ strategyData.update_time }}</span>
            </div>
          </div>

          <div class="adjustments-grid">

            <div class="adjustment-block">
              <div class="block-header">
                <h4 class="adjustment-title sell-title">⬇️ 需要卖出 (调出)</h4>
                <button class="copy-btn" @click="copyToClipboard(sellList, 'sell')">
                  复制卖出单
                </button>
              </div>

              <div class="table-container">
                <table class="op-table">
                  <thead>
                    <tr>
                      <th class="col-idx">序号</th>
                      <th>代码</th>
                      <th>名称</th>
                      <th>现价</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in sellList" :key="item.code">
                      <td class="col-idx">{{ index + 1 }}</td>
                      <td class="code-font">{{ item.code }}</td>
                      <td>
                        {{ item.name }}
                        <span v-if="item.is_suspended" class="suspend-tag">停</span>
                      </td>
                      <td class="code-font">{{ item.price.toFixed(2) }}</td>
                      <td>
                        <div class="op-cell">
                          <span class="op-tag tag-sell">
                            {{ item.type === 'clear' ? '全部卖出' : '减持' }}
                          </span>
                          <span class="share-num">{{ item.count }}股</span>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="sellList.length === 0">
                      <td colspan="5" class="empty-cell">今日无卖出建议</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="adjustment-block">
              <div class="block-header">
                <h4 class="adjustment-title buy-title">⬆️ 需要买入 (调入)</h4>
                <button class="copy-btn" @click="copyToClipboard(buyList, 'buy')">
                  复制买入单
                </button>
              </div>

              <div class="table-container">
                <table class="op-table">
                  <thead>
                    <tr>
                      <th class="col-idx">序号</th>
                      <th>代码</th>
                      <th>名称</th>
                      <th>现价</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in buyList" :key="item.code">
                      <td class="col-idx">{{ index + 1 }}</td>
                      <td class="code-font">{{ item.code }}</td>
                      <td>
                        {{ item.name }}
                        <span v-if="item.is_suspended" class="suspend-tag">停</span>
                      </td>
                      <td class="code-font">{{ item.price.toFixed(2) }}</td>
                      <td>
                        <div class="op-cell">
                          <span class="op-tag tag-buy">
                            {{ item.type === 'new' ? '全新买入' : '增持' }}
                          </span>
                          <span class="share-num">{{ item.count }}股</span>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="buyList.length === 0">
                      <td colspan="5" class="empty-cell">今日无买入建议</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        <div class="content-card">
          <div class="card-header-flex">
            <h2 class="card-title">当前目标持仓明细 ({{ strategyData.holdings.length }}只)</h2>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 50px">序号</th>
                  <th @click="handleSort('code')" class="sortable-th">
                    代码 <span class="sort-icon" :class="getSortClass('code')"></span>
                  </th>
                  <th>名称</th>
                  <th @click="handleSort('price')" class="sortable-th">
                    现价 <span class="sort-icon" :class="getSortClass('price')"></span>
                  </th>
                  <th @click="handleSort('mkt_cap')" class="sortable-th">
                    总市值 <span class="sort-icon" :class="getSortClass('mkt_cap')"></span>
                  </th>
                  <th @click="handleSort('plan_amount')" class="sortable-th">
                    计划金额 <span class="sort-icon" :class="getSortClass('plan_amount')"></span>
                  </th>
                  <th @click="handleSort('weight')" class="sortable-th">
                    仓位占比 <span class="sort-icon" :class="getSortClass('weight')"></span>
                  </th>
                  <th @click="handleSort('plan_shares')" class="sortable-th">
                    计划股数 <span class="sort-icon" :class="getSortClass('plan_shares')"></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in sortedHoldings" :key="item.code" :class="{ 'suspended-row': item.is_suspended }">
                  <td>{{ index + 1 }}</td>
                  <td>
                    {{ item.code }}
                    <span v-if="item.is_suspended" class="suspend-tag">停</span>
                  </td>
                  <td class="stock-name" :class="{ 'text-gray': item.is_suspended }">
                    {{ item.name }}
                  </td>
                  <td>{{ item.price.toFixed(2) }}</td>
                  <td>{{ formatMktCap(item.mkt_cap) }}</td>

                  <td style="font-weight: bold; color: #b0c4de;">
                    ¥ {{ formatMoney(item.price * item.plan_shares) }}
                  </td>

                  <td>
                    {{ calculateWeight(item.price, item.plan_shares) }}%
                  </td>

                  <td class="highlight-text" :class="{ 'text-gray': item.is_suspended }">
                    {{ item.plan_shares }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
    <div class="modal-overlay" v-if="showCookieModal" @click.self="closeCookieModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">🍪 更新雪球 Cookie</h3>
          <button class="close-btn" @click="closeCookieModal">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">当获取数据提示 400 鉴权失败时，请在此更新抓取到的最新 Cookie。</p>
          <textarea v-model="xueqiuCookie" class="cookie-textarea" placeholder="请在此粘贴雪球网页版请求头中的完整 Cookie..."></textarea>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeCookieModal">取消</button>
          <button class="confirm-btn" :disabled="isSavingCookie || xueqiuCookie === savedCookie" @click="saveCookieData">
            {{ isSavingCookie ? '保存中...' : '保存更新' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/store/user'
  import app from '@/lib/cloudbase'

  const router = useRouter()
  const userStore = useUserStore()
  const showMessage: any = inject('showMessage')

  // --- 状态定义 ---
  const planAmount = ref(0)
  const savedAmount = ref(0)
  const isSavingAmount = ref(false)

  // Cookie 弹窗相关状态
  const showCookieModal = ref(false)
  const xueqiuCookie = ref('')
  const savedCookie = ref('')
  const isSavingCookie = ref(false) // Cookie保存状态
  const isCheckingCookie = ref(false)

  const strategyData = ref({
      date: '20260115',
      update_time: '加载中...', // Mock 更新时间
      holdings: [] as any[],
      adjustments: [] as any[]
  })
  // 排序状态：sortKey 对应字段名, sortOrder 为 1(升序) 或 -1(降序)
  const sortKey = ref('')
  const sortOrder = ref(1)

  const handleSort = (key: string) => {
      if (sortKey.value === key) {
          sortOrder.value *= -1 // 点击同一列切换正反序
      } else {
          sortKey.value = key
          sortOrder.value = 1
      }
  }

  // --- 权限拦截 ---
  onMounted(() => {
      getMicroCapData()
  })

  // --- 真实数据获取逻辑 ---
  const getMicroCapData = async () => {
      try {
          // 调用刚才写的云函数
          const res = await app.callFunction({
              name: 'getMicroCapData50',
              data: {}
          })

          const result = res.result
          if (result.success) {
              const { plan_amount, xueqiu_cookie, latest_record } = result.data

              // 设置资金回显
              savedAmount.value = plan_amount || 0
              planAmount.value = plan_amount || 0

              // 设置 Cookie 回显
              savedCookie.value = xueqiu_cookie || ''
              xueqiuCookie.value = xueqiu_cookie || ''

              // 2. 设置策略数据
              if (latest_record) {
                  strategyData.value = {
                      // 如果你的数据库 _id 就是日期 (如 2026-01-15)，直接用 _id
                      // 也可以用 latest_record.updated_at 处理一下格式
                      date: latest_record._id,
                      update_time: formatUpdateTime(latest_record.updated_at), // 下面会提供这个辅助函数
                      holdings: latest_record.ranking || [],
                      adjustments: latest_record.adjustments || []
                  }
              } else {
                  // 如果没有历史数据（比如第一次运行前），给空状态
                  strategyData.value = {
                      date: '暂无数据',
                      update_time: '--',
                      holdings: [],
                      adjustments: []
                  }
              }
          } else {
              showMessage('数据加载异常', 'error')
          }
      } catch (err: any) {
          console.error('云函数调用失败', err)
          showMessage('网络错误，无法获取数据', 'error')
      }
  }

  // 辅助函数：简单格式化时间 (如果你没有 date-fns 等库)
  const formatUpdateTime = (isoString: string) => {
      if (!isoString) return ''
      // 将 "2026-01-15T14:30:00.000Z" 格式化为 "2026-01-15 14:30"
      // 如果后端存的是北京时间字符串，直接返回即可，这里做个简单截取
      return isoString.replace('T', ' ').substring(0, 16)
  }

  // --- 弹窗控制 ---
  const openCookieModal = () => {
      xueqiuCookie.value = savedCookie.value // 每次打开重置为已保存的值
      showCookieModal.value = true
  }

  const closeCookieModal = () => {
      showCookieModal.value = false
  }

  const checkCookie = async () => {
      if (isCheckingCookie.value) return

      isCheckingCookie.value = true
      try {
          const res: any = await app.callFunction({
              name: 'checkCookieStatus',
              data: {}
          })
          const result = res.result || {}
          const message = result.message || result.msg || result.data?.message

          if (result.success === false || result.valid === false || result.data?.valid === false) {
              showMessage(message || 'Cookie 已失效，请重新设置', 'error')
              return
          }

          showMessage(message || 'Cookie 状态正常', 'success')
      } catch (err: any) {
          console.error('Cookie 状态检查失败', err)
          showMessage(err.message || 'Cookie 状态检查失败', 'error')
      } finally {
          isCheckingCookie.value = false
      }
  }

  // --- 1. 保存计划资金 ---
  const savePlanAmount = async () => {
      if (planAmount.value <= 0) {
          showMessage('金额必须大于 0', 'warning')
          return
      }
      isSavingAmount.value = true
      try {
          const res = await app.callFunction({
              name: 'updatePlanAmount', // 原来的云函数
              data: { amount: planAmount.value }
          })
          if (res.result.success) {
              savedAmount.value = planAmount.value
              showMessage('✅ 资金配置已保存', 'success')
          } else {
              showMessage(res.result.msg || '保存失败', 'error')
          }
      } catch (err: any) {
          showMessage('网络错误，保存失败', 'error')
      } finally {
          isSavingAmount.value = false
      }
  }

  // --- 2. 保存雪球 Cookie ---
  const saveCookieData = async () => {
      if (!xueqiuCookie.value.trim()) {
          showMessage('Cookie 不能为空', 'warning')
          return
      }
      isSavingCookie.value = true
      try {
          // 这里调用一个新的云函数接口，后续你需要创建或修改它
          const res = await app.callFunction({
              name: 'updatePlanAmount', // 建议单独弄个云函数保存 Cookie
              data: { cookie: xueqiuCookie.value }
          })
          if (res.result.success) {
              savedCookie.value = xueqiuCookie.value
              showMessage('✅ Cookie 更新成功', 'success')
              closeCookieModal() // 保存成功后自动关弹窗
          } else {
              showMessage(res.result.msg || '保存失败', 'error')
          }
      } catch (err: any) {
          showMessage('网络错误，保存失败', 'error')
      } finally {
          isSavingCookie.value = false
      }
  }
  // --- 计算属性 ---
  const formattedDate = computed(() => {
      const d = strategyData.value.date
      return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
  })

  // 左侧卖出列表：优先显示 'clear' (全部卖出/调出)
  const sellList = computed(() => {
      const list = strategyData.value.adjustments.filter(i => i.action === 'sell')
      return list.sort((a, b) => {
          // 如果 a 是全部卖出，排在前面 (-1)
          if (a.type === 'clear' && b.type !== 'clear') return -1
          // 如果 b 是全部卖出，a 排在后面 (1)
          if (a.type !== 'clear' && b.type === 'clear') return 1
          return 0
      })
  })

  // 右侧买入列表：优先显示 'new' (全新买入/调入)
  const buyList = computed(() => {
      const list = strategyData.value.adjustments.filter(i => i.action === 'buy')
      return list.sort((a, b) => {
          // 如果 a 是全新买入，排在前面 (-1)
          if (a.type === 'new' && b.type !== 'new') return -1
          // 如果 b 是全新买入，a 排在后面 (1)
          if (a.type !== 'new' && b.type === 'new') return 1
          return 0
      })
  })
  const portfolioMetrics = computed(() => {
      const caps = strategyData.value.holdings.map(i => i.mkt_cap).sort((a, b) => a - b)
      if (!caps.length) return { median_cap: 0, avg_cap: 0 }

      const total = caps.reduce((sum, c) => sum + c, 0)
      const avg = total / caps.length

      const mid = Math.floor(caps.length / 2)
      const median = caps.length % 2 !== 0 ? caps[mid] : (caps[mid - 1] + caps[mid]) / 2

      return { median_cap: median, avg_cap: avg }
  })

  const totalHoldingsValue = computed(() => {
      if (!strategyData.value.holdings.length) return 0

      return strategyData.value.holdings.reduce((sum, item) => {
          // 防止数据异常导致 NaN
          const price = Number(item.price) || 0
          const shares = Number(item.plan_shares) || 0
          return sum + price * shares
      }, 0)
  })
  const getSortClass = (key: string) => {
      return {
          active: sortKey.value === key,
          desc: sortKey.value === key && sortOrder.value === -1,
          asc: sortKey.value === key && sortOrder.value === 1
      }
  }

  const sortedHoldings = computed(() => {
      const list = [...strategyData.value.holdings]
      if (!sortKey.value) return list

      return list.sort((a, b) => {
          let valA, valB

          // 针对你要求的三个字段进行逻辑映射
          if (sortKey.value === 'plan_amount') {
              // 1. 计划金额排序：price * plan_shares
              valA = (a.price || 0) * (a.plan_shares || 0)
              valB = (b.price || 0) * (b.plan_shares || 0)
          } else if (sortKey.value === 'plan_shares') {
              // 2. 计划股数排序：直接取字段
              valA = a.plan_shares || 0
              valB = b.plan_shares || 0
          } else if (sortKey.value === 'weight') {
              // 3. 仓位占比排序：逻辑同计划金额（因为总价值一致，金额大占比必大）
              valA = (a.price || 0) * (a.plan_shares || 0)
              valB = (b.price || 0) * (b.plan_shares || 0)
          } else {
              // 其他字段排序 (代码、市值等)
              valA = a[sortKey.value]
              valB = b[sortKey.value]
          }

          if (valA === valB) return 0
          return valA > valB ? sortOrder.value : -sortOrder.value
      })
  })

  // --- 工具函数 ---
  const formatMktCap = (val: number) => {
      return val.toFixed(2) + ' 亿'
  }

  // 新增一个格式化金额的简单函数 (如果还没有的话)
  const formatMoney = (val: number) => {
      return val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  // 🟢 新增：计算单只股票的仓位占比
  const calculateWeight = (price: number, shares: number) => {
      // 防止除以 0 导致 Infinity
      if (!totalHoldingsValue.value || totalHoldingsValue.value === 0) return '0.00'

      const itemValue = price * shares
      const weight = (itemValue / totalHoldingsValue.value) * 100

      return weight.toFixed(2)
  }

  const copyToClipboard = async (list: any[], type: string) => {
      if (!list || list.length === 0) {
          if (showMessage) showMessage('列表为空', 'warning')
          return
      }
      const text = list.map(item => `${item.code}\t${item.count}`).join('\n')
      try {
          await navigator.clipboard.writeText(text)
          const msg = type === 'buy' ? '买入指令已复制' : '卖出指令已复制'
          if (showMessage) showMessage(msg, 'success')
      } catch (err) {
          console.error('复制失败', err)
      }
  }
</script>

<style scoped>
  /* ========================================= */
  /* 1. 页面整体风格：黑金 (Dark Gold) 主题 */
  /* ========================================= */
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      background: radial-gradient(circle at 15% 50%, #3a3010, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a3a10, transparent 40%), #121212;
  }

  .main-container {
      max-width: 1000px;
      margin: 0 auto;
  }

  /* 头部样式 */
  .page-header {
      text-align: center;
      margin-bottom: 2.5rem;
      animation: fadeInUp 0.5s ease-out forwards;
  }
  .back-button {
      color: #b0c4de;
      text-decoration: none;
      font-size: 0.9rem;
      display: inline-block;
      margin-bottom: 1rem;
      transition: color 0.3s;
  }
  .back-button:hover {
      color: #ffd700;
  }

  .main-title {
      font-size: 2.2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
      text-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
  }
  .title-icon {
      font-size: 2.5rem;
      text-shadow: 0 0 15px #ffd700;
  }
  .subtitle {
      font-size: 1rem;
      color: #b0c4de;
  }

  /* 通用卡片容器 */
  .content-grid {
      display: grid;
      gap: 1.5rem;
  }
  .content-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      animation: fadeInUp 0.5s ease-out forwards;
      transition: border-color 0.3s ease;
  }
  .content-card:hover {
      border-color: rgba(255, 215, 0, 0.5);
  }

  /* 标题样式：Flex布局，支持右侧放更新时间 */
  .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.8rem;
  }

  .card-title {
      font-size: 1.2rem;
      font-weight: bold;
      margin: 0;
      border-left: 4px solid #ffd700;
      padding-left: 1rem;
      color: #fff;
  }

  /* 新增：更新时间徽章 */
  .update-time-badge {
      font-size: 0.85rem;
      color: #8392a5;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(0, 0, 0, 0.3);
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .dot {
      color: #2ecc71; /* 绿色呼吸点 */
      font-size: 1rem;
      line-height: 1;
  }
  .time-text {
      font-family: monospace;
      color: #b0c4de;
  }

  /* === 控制台 (Dashboard) 样式 === */
  .control-panel {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.2rem 2rem;
      background: linear-gradient(145deg, rgba(255, 215, 0, 0.08), rgba(0, 0, 0, 0.3));
      border: 1px solid rgba(255, 215, 0, 0.2);
  }

  .config-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }
  .section-label {
      font-size: 0.9rem;
      color: #ffd700;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 5px;
  }
  .input-group {
      display: flex;
      align-items: center;
      gap: 10px;
  }
  .currency {
      font-size: 1.2rem;
      color: #ffd700;
      font-weight: bold;
  }
  .amount-input {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      color: #fff;
      font-size: 1.2rem;
      font-weight: bold;
      padding: 5px 10px;
      width: 140px;
      outline: none;
      transition: border-color 0.3s;
  }
  .amount-input:focus {
      border-color: #ffd700;
  }
  .save-btn {
      background: #ffd700;
      border: none;
      color: #121212;
      padding: 6px 15px;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
  }
  .save-btn:hover:not(:disabled) {
      background: #ffecb3;
      transform: translateY(-1px);
  }
  .save-btn:disabled {
      background: #555;
      color: #888;
      cursor: not-allowed;
  }
  .tip-text {
      font-size: 0.75rem;
      color: #b0c4de;
      margin-top: 2px;
  }

  .panel-divider {
      width: 1px;
      height: 50px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 2rem;
  }
  .metrics-section {
      display: flex;
      gap: 3rem;
      flex: 1;
      justify-content: flex-end;
  }
  .metric-item {
      text-align: right;
  }
  .metric-label {
      font-size: 0.85rem;
      color: #b0c4de;
      margin-bottom: 4px;
  }
  .metric-value {
      font-size: 1.4rem;
      font-weight: bold;
      color: #fff;
      text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  }

  /* === 调仓表格 (复刻布局，优化配色) === */
  .adjustments-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
  }

  .block-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
  }
  .adjustment-title {
      margin: 0;
      font-size: 1rem;
      font-weight: bold;
  }
  .sell-title {
      color: #fff;
      border-left: 3px solid #c0392b;
      padding-left: 8px;
  }
  .buy-title {
      color: #fff;
      border-left: 3px solid #27ae60;
      padding-left: 8px;
  }

  .copy-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #b0c4de;
      padding: 3px 10px;
      font-size: 0.75rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
  }
  .copy-btn:hover {
      border-color: #ffd700;
      color: #ffd700;
  }

  .table-container {
      overflow-x: auto;
  }

  /* 调仓专用表格 */
  .op-table {
      width: 100%;
      border-collapse: collapse;
  }

  /* 表头：全左对齐，金色文字，无突兀背景 */
  .op-table th {
      text-align: left; /* 关键：强制左对齐 */
      padding: 0.6rem 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 0.9rem;
      color: #ffd700;
      font-weight: normal;
  }

  /* 表格内容：全左对齐 */
  .op-table td {
      text-align: left; /* 关键：强制左对齐 */
      padding: 0.7rem 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.95rem;
      color: #e0e0e0;
  }

  .col-idx {
      width: 40px;
      color: #8392a5;
  }
  .code-font {
      font-family: monospace;
      color: #b0c4de;
  }
  .empty-cell {
      text-align: center !important;
      padding: 2rem;
      color: #666;
  }

  /* 胶囊标签样式优化 */
  .op-cell {
      display: flex;
      align-items: center;
      justify-content: flex-start; /* 关键：左对齐 */
      gap: 8px;
  }

  .op-tag {
      display: inline-flex; /* 使用 flex 保证文字居中 */
      justify-content: center;
      align-items: center;
      min-width: 64px; /* 关键：固定最小宽度，保证2字和4字一样宽 */
      padding: 3px 0; /* 上下padding，左右由width控制 */
      border-radius: 4px; /* 稍微方一点的圆角，更硬朗 */
      font-size: 0.75rem;
      font-weight: bold;

      /* 优化后的配色：半透明背景 + 描边 + 高亮字 */
      backdrop-filter: blur(4px);
  }

  /* 卖出系 (红) */
  .tag-sell {
      background-color: rgba(192, 57, 43, 0.15); /* 低透明度红背景 */
      border: 1px solid rgba(192, 57, 43, 0.6); /* 红描边 */
      color: #e74c3c; /* 亮红文字 */
  }

  /* 买入系 (绿) */
  .tag-buy {
      background-color: rgba(39, 174, 96, 0.15); /* 低透明度绿背景 */
      border: 1px solid rgba(39, 174, 96, 0.6); /* 绿描边 */
      color: #2ecc71; /* 亮绿文字 */
  }

  .share-num {
      font-family: monospace;
      color: #e0e0e0; /* 股数无色 */
      font-size: 0.95rem;
      font-weight: bold;
  }

  /* === 底部大表格样式 (修正对齐) === */
  .table-wrapper {
      overflow-x: auto;
  }
  .data-table {
      width: 100%;
      border-collapse: collapse;
  }
  .data-table th {
      text-align: left; /* 关键：强制左对齐 */
      padding: 0.8rem;
      color: #ffd700;
      font-size: 0.9rem;
      font-weight: normal;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .data-table td {
      text-align: left; /* 关键：强制左对齐 */
      padding: 0.8rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.95rem;
      color: #e0e0e0;
  }
  .stock-name {
      color: #fff;
      font-weight: 500;
  }
  .highlight-text {
      color: #ffd700;
      font-weight: bold;
      font-family: monospace;
  }

  /* --- 停牌样式 --- */
  .suspended-row {
      background-color: rgba(255, 255, 255, 0.02); /* 整行稍微变暗 */
  }
  /* 优化后的停牌标签 */
  .suspend-tag {
      display: inline-block;
      background-color: #e67e22; /* 醒目的橙色 */
      color: #fff;
      font-size: 0.7rem;
      padding: 1px 4px;
      border-radius: 3px;
      margin-left: 4px;
      /* vertical-align: middle; */
      font-weight: bold;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); /* 加点阴影更立体 */
  }

  /* 停牌行样式保持暗淡，形成反差 */
  .suspended-row {
      background-color: rgba(230, 126, 34, 0.05); /* 微微泛橙 */
  }

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

  /* ============================================
                                                                       📱 移动端适配 (Media Queries) - 终极修复版
                                                                       请直接替换原有的 media query 代码
                                                                       ============================================ */
  @media (max-width: 768px) {
      /* --- 1. 全局容器修复 (消灭右侧白条) --- */
      .page-wrapper {
          padding: 1rem 0.5rem; /* 减小内边距 */
          width: 100%;
          overflow-x: hidden; /* 核心：禁止整个页面横向滚动，防止背景穿帮 */
          box-sizing: border-box;
      }

      .main-container {
          width: 100%;
          overflow: hidden; /* 防止内部元素撑开容器 */
      }

      /* --- 2. 头部缩小 --- */
      .main-title {
          font-size: 1.5rem;
      }
      .subtitle {
          font-size: 0.8rem;
          padding: 0 1rem;
      }

      /* --- 3. 控制面板 (Dashboard) --- */
      .control-panel {
          flex-direction: column; /* 上下排列 */
          align-items: stretch;
          padding: 1rem;
          gap: 1.5rem;
      }

      .config-section {
          width: 100%;
          justify-content: center;
      }

      .panel-divider {
          display: none; /* 手机端隐藏分割线 */
      }

      /* 资金数据显示优化 */
      .metrics-section {
          display: grid;
          grid-template-columns: 1fr 1fr; /* 两列布局 */
          gap: 10px;
      }

      /* "当前持仓总价值" 独占一行，且背景加深 */
      .metric-item:first-child {
          grid-column: span 2;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 5px;
      }

      .metric-item {
          text-align: center;
      }

      .metric-value {
          font-size: 1.2rem;
      }

      /* --- 4. 买卖操作区域 (核心修复) --- */
      .adjustments-grid {
          display: flex; /* 改用 Flex 布局更容易控制 */
          flex-direction: column; /* 强制上下排列 */
          gap: 2rem;
          width: 100%;
      }

      /* 容器宽度强制限制 */
      .adjustment-block,
      .content-card {
          width: 100%;
          min-width: 0; /* 关键：允许Flex子项收缩 */
          box-sizing: border-box;
      }

      .block-header {
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 10px;
      }

      /* --- 5. 表格终极修复 (滑动模式) --- */
      .table-container,
      .table-wrapper {
          width: 100%;
          overflow-x: auto; /* 开启横向滚动 */
          -webkit-overflow-scrolling: touch; /* iOS丝滑滚动 */
          margin-top: 5px;
          padding-bottom: 10px; /* 给滚动条留空间 */
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.2); /* 给滚动区域加个深底色提示 */
      }

      /* 强制表格保持最小宽度，不许挤压！ */
      .op-table,
      .data-table {
          width: auto; /* 宽度自动，由内容撑开 */
          min-width: 100%; /* 至少占满屏幕 */
          /* min-width: 600px;  如果你觉得还是挤，可以把这个注释解开，强制表格宽600px */
          border-collapse: collapse;
      }

      /* 单元格样式 */
      .op-table th,
      .op-table td,
      .data-table th,
      .data-table td {
          white-space: nowrap; /* 核心：禁止文字换行！强制触发横向滚动 */
          padding: 10px 8px; /* 增加一点点击区域 */
          font-size: 13px; /* 字号适中 */
      }

      /* 隐藏不重要的列 */
      .col-idx {
          display: none;
      }

      /* 胶囊标签微调 */
      .op-cell {
          gap: 5px;
      }
      .op-tag {
          min-width: 44px;
          font-size: 12px;
          padding: 2px 4px;
      }

      /* 标题栏调整 */
      .card-header-flex {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
      }

      .update-time-badge {
          font-size: 12px;
      }
  }
  /* 表头基础样式 */
  .sortable-th {
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      white-space: nowrap; /* 确保文字图标不换行 */
  }

  /* 悬浮时文字变色 */
  .sortable-th:hover {
      color: #ffd700 !important;
  }

  /* 排序图标 - 基础状态（隐藏） */
  .sort-icon {
      display: inline-block;
      width: 0;
      height: 0;
      margin-left: 4px;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-bottom: 6px solid #ffd700; /* 使用金色 */

      opacity: 0; /* 默认不显示 */
      transform: translateY(-2px);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
  }

  /* 激活状态 */
  .sort-icon.active {
      opacity: 0.8;
  }

  /* 升序：三角向上（默认） */
  .sort-icon.asc {
      transform: translateY(-2px) rotate(0deg);
  }

  /* 降序：三角向下旋转 */
  .sort-icon.desc {
      transform: translateY(-1px) rotate(180deg);
  }

  /* 适配移动端，稍微加宽一点点击感 */
  @media (max-width: 768px) {
      .sortable-th {
          padding-right: 15px !important;
      }
  }

  /* === 新增：触发弹窗的小按钮 === */
  .cookie-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
  }

  .text-icon-btn {
      background: transparent;
      border: 1px solid rgba(255, 215, 0, 0.3);
      color: #ffd700;
      padding: 2px 8px;
      font-size: 0.8rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
  }
  .text-icon-btn:hover {
      background: rgba(255, 215, 0, 0.1);
      border-color: #ffd700;
  }

  .text-icon-btn:disabled {
      cursor: wait;
      opacity: 0.55;
  }

  @media (max-width: 768px) {
      .cookie-actions {
          flex-wrap: wrap;
      }
  }

  /* === 新增：Cookie 弹窗样式 === */
  .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease-out;
  }

  .modal-card {
      background: #1a1a1a;
      border: 1px solid rgba(255, 215, 0, 0.2);
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
      overflow: hidden;
      transform: translateY(0);
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .modal-title {
      margin: 0;
      font-size: 1.1rem;
      color: #ffd700;
  }
  .close-btn {
      background: transparent;
      border: none;
      color: #888;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      transition: color 0.2s;
  }
  .close-btn:hover {
      color: #fff;
  }

  .modal-body {
      padding: 1.5rem;
  }
  .modal-desc {
      font-size: 0.85rem;
      color: #b0c4de;
      margin-top: 0;
      margin-bottom: 1rem;
  }
  .cookie-textarea {
      width: 100%;
      height: 120px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #2ecc71; /* 换个护眼的代码绿 */
      font-family: monospace;
      font-size: 0.85rem;
      padding: 10px;
      resize: none;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.3s;
      word-break: break-all;
  }
  .cookie-textarea:focus {
      border-color: #ffd700;
  }

  .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 1rem 1.5rem;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  .cancel-btn,
  .confirm-btn {
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
  }
  .cancel-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #b0c4de;
  }
  .cancel-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
  }
  .confirm-btn {
      background: #ffd700;
      border: none;
      color: #121212;
  }
  .confirm-btn:hover:not(:disabled) {
      background: #ffecb3;
  }
  .confirm-btn:disabled {
      background: #555;
      color: #888;
      cursor: not-allowed;
  }

  @keyframes fadeIn {
      from {
          opacity: 0;
      }
      to {
          opacity: 1;
      }
  }
  @keyframes slideIn {
      from {
          transform: translateY(20px);
          opacity: 0;
      }
      to {
          transform: translateY(0);
          opacity: 1;
      }
  }
</style>
