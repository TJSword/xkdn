<template>
  <div class="page-wrapper">
    <div class="main-container">

      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <span class="title-icon">⎈</span>
          实盘数据总览
          <span class="secret-setting-btn" @click.stop="openCookieModal" title="设置数据源">⚙</span>
        </h1>
        <p class="subtitle">
          全量策略实时聚合，全局资产动态一目了然。
        </p>
      </div>

      <div v-if="isLoading" class="loading-state">
        <span class="loader"></span>
        <p>正在同步全网策略实时数据...</p>
      </div>

      <div class="content-grid" v-else>

        <div class="content-card kpi-card-group">
          <div class="kpi-box">
            <div class="kpi-label">实时总资产 (元)</div>
            <div class="kpi-value highlight-blue">{{ formatNumber(tweenedStats.totalAsset) }}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">累计总收益 (元)</div>
            <div :class="['kpi-value', getProfitColorClass(tweenedStats.totalProfit)]">
              {{ tweenedStats.totalProfit > 0 ? '+' : '' }}{{ formatNumber(tweenedStats.totalProfit) }}
            </div>
            <div :class="['kpi-sub', getProfitColorClass(tweenedStats.totalRate)]">
              总收益率: {{ tweenedStats.totalRate.toFixed(2) }}%
            </div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">今日总收益 (元)</div>
            <div :class="['kpi-value', getProfitColorClass(tweenedStats.totalNowProfit)]">
              {{ tweenedStats.totalNowProfit > 0 ? '+' : '' }}{{ formatNumber(tweenedStats.totalNowProfit) }}
            </div>
            <div :class="['kpi-sub', getProfitColorClass(tweenedStats.totalNowRate)]">
              今日波动: {{ tweenedStats.totalNowRate.toFixed(2) }}%
            </div>
          </div>
        </div>

        <div class="dashboard-row">

          <div class="content-card chart-card">
            <h2 class="card-title no-border">策略仓位分布</h2>
            <div ref="pieChartContainer" class="echart-container pie-container"></div>
          </div>

          <div class="content-card table-card">
            <h2 class="card-title no-border">策略实时状态</h2>
            <div class="table-container">
              <table class="portfolio-table live-table">
                <thead>
                  <tr>
                    <th>策略名称</th>
                    <th>实时资产</th>
                    <th>今日收益</th>
                    <th>日收益率</th>
                    <th>累计收益</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="strategy in strategyDataList" :key="strategy.fund_key">
                    <td class="strategy-name-cell">
                      <span class="status-dot"></span>
                      {{ strategy.manualname }}
                    </td>
                    <td class="highlight-val">{{ formatNumber(strategy.asset) }}</td>
                    <td :class="getProfitColorClass(strategy.now_profit)">
                      {{ Number(strategy.now_profit) > 0 ? '+' : '' }}{{ formatNumber(strategy.now_profit) }}
                    </td>
                    <td :class="getProfitColorClass(strategy.now_rate)">
                      {{ Number(strategy.now_rate) > 0 ? '+' : '' }}{{ strategy.now_rate }}%
                    </td>
                    <td :class="getProfitColorClass(strategy.profit)">
                      {{ Number(strategy.profit) > 0 ? '+' : '' }}{{ formatNumber(strategy.profit) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <div class="bottom-extension-grid">

          <div class="content-card weather-card">
            <h2 class="card-title no-border">市场环境雷达</h2>
            <div class="weather-metrics">
              <div class="metric-row">
                <span class="metric-label">VIX 恐慌指数</span>
                <div class="progress-bar">
                  <div class="progress-fill safe" style="width: 28%;"></div>
                </div>
                <span class="metric-val">14.2 (偏低)</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">流动性溢价</span>
                <div class="progress-bar">
                  <div class="progress-fill neutral" style="width: 55%;"></div>
                </div>
                <span class="metric-val">中性</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">策略拥挤度</span>
                <div class="progress-bar">
                  <div class="progress-fill warning" style="width: 82%;"></div>
                </div>
                <span class="metric-val text-red">高拥挤</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">大盘动量指标</span>
                <div class="progress-bar">
                  <div class="progress-fill safe" style="width: 65%;"></div>
                </div>
                <span class="metric-val text-red">多头排列</span>
              </div>
            </div>
          </div>

          <div class="content-card log-card">
            <h2 class="card-title no-border">系统运行日志</h2>
            <div class="terminal-log">
              <div v-for="(log, idx) in systemLogs" :key="idx" class="log-line">
                <span class="log-time">[{{ log.time }}]</span>
                <span :class="['log-type', log.type]">{{ log.typeText }}</span>
                <span class="log-msg">{{ log.msg }}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

    <div class="modal-overlay" v-if="showCookieModal" @click.self="closeCookieModal">
      <div class="modal-content">
        <h3 class="modal-title">数据源授权配置</h3>
        <p class="modal-desc">请输入同花顺等数据源的有效 Cookie 以保持同步更新。</p>
        <textarea v-model="cookieInput" class="cookie-textarea" placeholder="在此粘贴您的 Cookie 字符串..."></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeCookieModal">取消</button>
          <button class="btn-save" @click="saveCookie">保存配置</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue'
  import * as echarts from 'echarts'

  // --- 状态定义 ---
  const isLoading = ref(true)
  const strategyDataList = ref<any[]>([])

  // Cookie 弹窗相关
  const showCookieModal = ref(false)
  const cookieInput = ref('')

  // 图表引用
  const pieChartContainer = ref<HTMLElement | null>(null)
  let pieChart: echarts.ECharts | null = null

  // 系统日志模拟数据
  const systemLogs = ref([
      {
          time: new Date().toLocaleTimeString(),
          type: 'info',
          typeText: 'SYS',
          msg: '建立数据连接，等待回传...'
      },
      {
          time: new Date().toLocaleTimeString(),
          type: 'success',
          typeText: 'SYNC',
          msg: '同步全天候策略数据成功'
      },
      {
          time: new Date().toLocaleTimeString(),
          type: 'success',
          typeText: 'SYNC',
          msg: '同步惊鸿策略数据成功'
      },
      {
          time: new Date().toLocaleTimeString(),
          type: 'success',
          typeText: 'SYNC',
          msg: '同步小狮子策略数据成功'
      },
      {
          time: new Date().toLocaleTimeString(),
          type: 'warning',
          typeText: 'ALERT',
          msg: '小狮子策略回撤接近阈值，请关注'
      }
  ])

  // --- 计算属性：全局总计 ---
  const globalStats = computed(() => {
      let totalAsset = 0
      let totalProfit = 0
      let totalNowProfit = 0

      strategyDataList.value.forEach(s => {
          totalAsset += Number(s.asset || 0)
          totalProfit += Number(s.profit || 0)
          totalNowProfit += Number(s.now_profit || 0)
      })

      const totalCost = totalAsset - totalProfit
      const totalRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
      const yesterdayAsset = totalAsset - totalNowProfit
      const totalNowRate = yesterdayAsset > 0 ? (totalNowProfit / yesterdayAsset) * 100 : 0

      return { totalAsset, totalProfit, totalNowProfit, totalRate, totalNowRate }
  })

  // ================= 数字翻滚动画逻辑 =================
  // 专门用来渲染视图的响应式对象，它的值会慢慢向 globalStats 靠拢
  const tweenedStats = reactive({
      totalAsset: 0,
      totalProfit: 0,
      totalNowProfit: 0,
      totalRate: 0,
      totalNowRate: 0
  })

  const animateValue = (key: keyof typeof tweenedStats, targetValue: number, duration = 1200) => {
      const startValue = tweenedStats[key] || 0
      const change = targetValue - startValue
      const startTime = performance.now()

      const update = (currentTime: number) => {
          const elapsed = currentTime - startTime
          const progress = Math.min(elapsed / duration, 1)
          // easeOutExpo 缓动函数，让数字跳动有越来越慢的刹车感
          const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

          tweenedStats[key] = startValue + change * easeProgress

          if (progress < 1) {
              requestAnimationFrame(update)
          } else {
              tweenedStats[key] = targetValue
          }
      }
      requestAnimationFrame(update)
  }

  // 监听真实数据的变化，触发动画
  watch(
      globalStats,
      newStats => {
          animateValue('totalAsset', newStats.totalAsset)
          animateValue('totalProfit', newStats.totalProfit)
          animateValue('totalNowProfit', newStats.totalNowProfit)
          animateValue('totalRate', newStats.totalRate)
          animateValue('totalNowRate', newStats.totalNowRate)
      },
      { deep: true, immediate: true }
  )

  // ================= 初始化与 API 调用 =================
  onMounted(() => {
      fetchAllData()
      window.addEventListener('resize', () => pieChart?.resize())

      // 【演示功能】：10秒后动态修改数据，演示实盘数据更新、数字翻滚、图表重绘
      setTimeout(() => {
          demonstrateDataUpdate()
      }, 10000)
  })

  // 修复问题1：监听 isLoading，只有等页面真正出现，且 DOM 准备好后才去画图
  watch(isLoading, newVal => {
      if (!newVal) {
          nextTick(() => {
              renderPieChart()
          })
      }
  })

  // 监听策略列表数据，如果更新了，自动重绘图表
  watch(
      strategyDataList,
      () => {
          if (!isLoading.value) {
              nextTick(() => {
                  renderPieChart()
              })
          }
      },
      { deep: true }
  )

  const fetchAllData = async () => {
      isLoading.value = true
      try {
          // 模拟接口请求耗时
          await new Promise(resolve => setTimeout(resolve, 800))
          const listData = getMockList()
          const strategies = [...(listData.ex_data.rzrq || []), ...(listData.ex_data.common || [])]

          const results = strategies.map(strategy => {
              const detailData = getMockDetail(strategy.fund_key)
              return { ...strategy, ...detailData }
          })

          // 根据总资产倒序排列
          strategyDataList.value = results.sort((a, b) => b.asset - a.asset)
      } catch (error) {
          console.error('同步数据失败', error)
      } finally {
          isLoading.value = false
      }
  }

  // 演示数据更新方法
  const demonstrateDataUpdate = () => {
      addLog('info', 'SYS', '接收到 WebSocket 最新推送数据...')

      // 随机修改部分数据
      strategyDataList.value.forEach(strategy => {
          const randomFluctuation = (Math.random() - 0.5) * 20000 // 正负1w的波动
          strategy.asset = Number(strategy.asset) + randomFluctuation
          strategy.now_profit = Number(strategy.now_profit) + randomFluctuation
          strategy.profit = Number(strategy.profit) + randomFluctuation

          // 更新收益率字符串
          strategy.now_rate = (
              (Number(strategy.now_profit) / (Number(strategy.asset) - Number(strategy.now_profit))) *
              100
          ).toFixed(2)
      })

      // 重新排序
      strategyDataList.value.sort((a, b) => b.asset - a.asset)
      addLog('success', 'UPDATE', '全局资产视图已更新')
  }

  const addLog = (type: string, typeText: string, msg: string) => {
      systemLogs.value.unshift({
          // 插到最前面
          time: new Date().toLocaleTimeString(),
          type,
          typeText,
          msg
      })
      if (systemLogs.value.length > 8) systemLogs.value.pop()
  }

  // ================= ECharts 渲染 =================
  const renderPieChart = () => {
      if (!pieChartContainer.value) return
      if (!pieChart) {
          pieChart = echarts.init(pieChartContainer.value)
      }

      const chartData = strategyDataList.value.map(s => ({
          name: s.manualname,
          value: s.asset
      }))

      const option = {
          backgroundColor: 'transparent',
          tooltip: {
              trigger: 'item',
              formatter: '{b}: {c} 元 ({d}%)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              borderColor: '#00aaff',
              textStyle: { color: '#fff' }
          },
          legend: {
              orient: 'horizontal',
              bottom: '0',
              textStyle: { color: '#b0c4de' },
              itemGap: 15
          },
          color: ['#00aaff', '#00c497', '#ffb74d', '#ff6b6b', '#9c27b0'],
          series: [
              {
                  name: '策略占比',
                  type: 'pie',
                  radius: ['40%', '75%'], // 环形玫瑰图
                  center: ['50%', '45%'],
                  roseType: 'radius',
                  itemStyle: {
                      borderRadius: 6,
                      borderColor: 'rgba(18, 18, 18, 0.8)',
                      borderWidth: 2
                  },
                  label: { show: false },
                  emphasis: {
                      label: { show: true, fontSize: '14', fontWeight: 'bold', color: '#fff' },
                      itemStyle: { shadowBlur: 15, shadowColor: 'rgba(0, 170, 255, 0.6)' }
                  },
                  data: chartData
              }
          ]
      }

      // 更新数据，不用重新 init
      pieChart.setOption(option)
  }

  // ================= Cookie 弹窗设置 =================
  const openCookieModal = () => {
      cookieInput.value = localStorage.getItem('thx_cookie') || ''
      showCookieModal.value = true
  }

  const closeCookieModal = () => {
      showCookieModal.value = false
  }

  const saveCookie = () => {
      if (cookieInput.value) {
          localStorage.setItem('thx_cookie', cookieInput.value)
          addLog('success', 'AUTH', 'Cookie配置已更新，将在下次拉取生效')
      }
      closeCookieModal()
  }

  // ================= 辅助工具函数 =================
  const formatNumber = (num: number | string) => {
      if (num === undefined || num === null) return '0.00'
      return parseFloat(num.toString()).toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
      })
  }

  const getProfitColorClass = (val: number | string) => {
      if (!val) return ''
      const num = parseFloat(val.toString())
      if (num > 0) return 'text-red'
      if (num < 0) return 'text-green'
      return ''
  }

  // 模拟数据生成
  const getMockList = () => ({
      ex_data: {
          rzrq: [{ fund_key: '142313253', manualname: '全天候策略' }],
          common: [
              { fund_key: '154745659', manualname: '惊鸿策略' },
              { fund_key: '130629776', manualname: '小狮子策略' }
          ]
      }
  })

  const getMockDetail = (fund_key: string) => {
      if (fund_key === '142313253')
          return {
              now_profit: '931.60',
              rate: 0.1018,
              now_rate: '0.04',
              asset: 2339821.9,
              profit: 216069.19
          }
      if (fund_key === '154745659')
          return {
              now_profit: '4520.10',
              rate: 0.254,
              now_rate: '0.68',
              asset: 856400.0,
              profit: 173500.5
          }
      return {
          now_profit: '-1205.50',
          rate: -0.052,
          now_rate: '-0.24',
          asset: 489000.0,
          profit: -26800.0
      }
  }
</script>

<style scoped>
  /* ================= 全局继承与基础 ================= */
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

  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #1a205a, transparent 40%), #121212;
      overflow-x: hidden;
  }

  .main-container {
      max-width: 1050px;
      margin: 0 auto;
  }

  .page-header {
      text-align: center;
      margin-bottom: 2rem;
      animation: fadeInUp 0.5s ease-out forwards;
      position: relative;
  }

  .back-button {
      color: #b0c4de;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s ease;
      display: inline-block;
      margin-bottom: 1rem;
  }
  .back-button:hover {
      color: #00aaff;
  }

  .main-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
      position: relative;
  }
  .title-icon {
      font-size: 2.5rem;
      color: #00aaff;
      text-shadow: 0 0 15px rgba(0, 170, 255, 0.6);
  }
  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  /* 隐蔽的 Cookie 按钮 - 稍微调亮一点，修复了层级和点击问题 */
  .secret-setting-btn {
      position: absolute;
      right: -40px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.3rem;
      color: #ffffff;
      opacity: 0.15; /* 调亮了一点 */
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 10;
  }
  .secret-setting-btn:hover {
      opacity: 1;
      color: #00aaff;
      text-shadow: 0 0 10px #00aaff;
      transform: translateY(-50%) rotate(90deg);
  }

  /* ================= 布局与卡片 ================= */
  .content-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
  }

  .content-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }
  .content-card:hover {
      border-color: rgba(0, 170, 255, 0.4);
  }

  .card-title {
      font-size: 1.2rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 1rem;
  }
  .card-title.no-border {
      border-left: none;
      padding-left: 0;
  }

  /* ================= 1. 核心指标看板 (KPI) ================= */
  .kpi-card-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      padding: 0;
      background: transparent;
      border: none;
  }
  .kpi-box {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      position: relative;
      overflow: hidden;
      transition: transform 0.3s;
  }
  .kpi-box:hover {
      transform: translateY(-3px);
  }
  .kpi-box::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background: #00aaff;
      box-shadow: 0 0 10px #00aaff;
  }
  .kpi-box:nth-child(2)::before {
      background: #ff4d4f;
      box-shadow: 0 0 10px #ff4d4f;
  }
  .kpi-box:nth-child(3)::before {
      background: #ffb74d;
      box-shadow: 0 0 10px #ffb74d;
  }

  .kpi-label {
      font-size: 0.9rem;
      color: #8392a5;
      margin-bottom: 0.8rem;
  }
  .kpi-value {
      font-size: 1.8rem;
      font-weight: 700;
      font-family: 'Courier New', Courier, monospace;
      margin-bottom: 0.5rem;
      transition: color 0.3s;
  }
  .kpi-sub {
      font-size: 0.85rem;
      font-weight: bold;
  }

  .highlight-blue {
      color: #00aaff;
      text-shadow: 0 0 8px rgba(0, 170, 255, 0.4);
  }
  .text-red {
      color: #ff4d4f !important;
  }
  .text-green {
      color: #00c497 !important;
  }

  /* ================= 2. 图表与列表横向布局 ================= */
  .dashboard-row {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 1.5rem;
  }
  .chart-card {
      animation-delay: 0.2s;
  }
  .pie-container {
      height: 350px;
      width: 100%;
  }
  .table-card {
      animation-delay: 0.3s;
  }
  .table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
  }

  /* 策略实时状态表 */
  .live-table {
      width: 100%;
      min-width: 500px;
      border-collapse: collapse;
  }
  .live-table th {
      background: rgba(0, 170, 255, 0.05);
      padding: 1rem 0.8rem;
      color: #b0c4de;
      font-size: 0.85rem;
      text-align: center;
      border-bottom: 1px solid rgba(0, 170, 255, 0.2);
  }
  .live-table td {
      padding: 1.2rem 0.5rem;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.95rem;
  }
  .live-table tbody tr:hover {
      background: rgba(255, 255, 255, 0.03);
  }

  .strategy-name-cell {
      font-family: 'Noto Sans SC', sans-serif !important;
      font-weight: bold;
      color: #fff;
      text-align: left !important;
      display: flex;
      align-items: center;
      gap: 8px;
      padding-left: 1rem !important;
  }
  .status-dot {
      width: 8px;
      height: 8px;
      background-color: #00c497;
      border-radius: 50%;
      box-shadow: 0 0 8px #00c497;
      animation: pulse 2s infinite;
  }
  @keyframes pulse {
      0% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(0, 196, 151, 0.7);
      }
      70% {
          transform: scale(1);
          box-shadow: 0 0 0 6px rgba(0, 196, 151, 0);
      }
      100% {
          transform: scale(0.95);
          box-shadow: 0 0 0 0 rgba(0, 196, 151, 0);
      }
  }
  .highlight-val {
      color: #e0e0e0;
      font-weight: bold;
  }

  /* ================= 3. 拓展区 (底部) ================= */
  .bottom-extension-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      animation: fadeInUp 0.5s ease-out forwards;
      animation-delay: 0.4s;
      opacity: 0;
  }

  /* 雷达指标 */
  .weather-metrics {
      display: flex;
      flex-direction: column;
      gap: 1rem;
  }
  .metric-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.9rem;
  }
  .metric-label {
      width: 90px;
      color: #b0c4de;
  }
  .progress-bar {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
  }
  .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 1s ease-in-out;
  }
  .progress-fill.safe {
      background: #00c497;
      box-shadow: 0 0 8px #00c497;
  }
  .progress-fill.neutral {
      background: #00aaff;
      box-shadow: 0 0 8px #00aaff;
  }
  .progress-fill.warning {
      background: #ff4d4f;
      box-shadow: 0 0 8px #ff4d4f;
  }
  .metric-val {
      width: 70px;
      text-align: right;
      font-weight: bold;
      color: #fff;
  }

  /* 终端日志 */
  .terminal-log {
      background: rgba(0, 0, 0, 0.4);
      border-radius: 8px;
      padding: 1rem;
      height: 150px;
      overflow-y: auto;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }
  .terminal-log::-webkit-scrollbar {
      width: 4px;
  }
  .terminal-log::-webkit-scrollbar-thumb {
      background: #00aaff;
      border-radius: 2px;
  }
  .log-line {
      display: flex;
      gap: 0.5rem;
      animation: fadeIn 0.3s;
  }
  .log-time {
      color: #8392a5;
  }
  .log-type {
      padding: 0 4px;
      border-radius: 3px;
      font-weight: bold;
  }
  .log-type.info {
      color: #00aaff;
      background: rgba(0, 170, 255, 0.1);
  }
  .log-type.success {
      color: #00c497;
      background: rgba(0, 196, 151, 0.1);
  }
  .log-type.warning {
      color: #ffb74d;
      background: rgba(255, 183, 77, 0.1);
  }
  .log-msg {
      color: #e0e0e0;
  }

  /* ================= 4. Cookie 设置弹窗 ================= */
  .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999; /* 提到了最高层级 */
      animation: fadeIn 0.3s;
  }
  @keyframes fadeIn {
      from {
          opacity: 0;
      }
      to {
          opacity: 1;
      }
  }

  .modal-content {
      background: #1e2433;
      border: 1px solid rgba(0, 170, 255, 0.4);
      border-radius: 12px;
      width: 90%;
      max-width: 450px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 170, 255, 0.2);
  }
  .modal-title {
      margin-top: 0;
      color: #fff;
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
  }
  .modal-desc {
      font-size: 0.85rem;
      color: #8392a5;
      margin-bottom: 1.5rem;
  }
  .cookie-textarea {
      width: 100%;
      height: 100px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      padding: 1rem;
      font-family: monospace;
      resize: none;
      box-sizing: border-box;
      margin-bottom: 1.5rem;
  }
  .cookie-textarea:focus {
      outline: none;
      border-color: #00aaff;
  }
  .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
  }
  .btn-cancel,
  .btn-save {
      padding: 0.6rem 1.2rem;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
  }
  .btn-cancel {
      background: transparent;
      color: #b0c4de;
      border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .btn-cancel:hover {
      background: rgba(255, 255, 255, 0.05);
  }
  .btn-save {
      background: #00aaff;
      color: #fff;
      font-weight: bold;
  }
  .btn-save:hover {
      background: #0088cc;
      box-shadow: 0 0 10px rgba(0, 170, 255, 0.4);
  }

  /* ================= 其他与响应式 ================= */
  .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 40vh;
      color: #00aaff;
  }
  .loader {
      width: 48px;
      height: 48px;
      border: 3px solid rgba(0, 170, 255, 0.3);
      border-radius: 50%;
      border-top-color: #00aaff;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 1rem;
  }
  @keyframes spin {
      to {
          transform: rotate(360deg);
      }
  }

  @media (max-width: 992px) {
      .dashboard-row {
          grid-template-columns: 1fr;
      }
      .kpi-card-group {
          grid-template-columns: repeat(3, 1fr);
      }
      .bottom-extension-grid {
          grid-template-columns: 1fr;
      }
  }

  @media (max-width: 768px) {
      .page-wrapper {
          padding: 2rem 1rem;
      }
      .kpi-card-group {
          grid-template-columns: 1fr;
      }
      .pie-container {
          height: 300px;
      }
      .main-title {
          font-size: 1.8rem;
      }
      .secret-setting-btn {
          right: -20px;
          font-size: 1.1rem;
      }
  }
</style>