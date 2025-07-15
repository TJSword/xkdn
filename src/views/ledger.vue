<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <a href="/" class="back-button">← 返回主页</a>
        <h1 class="main-title">
          <span class="title-icon">📒</span>
          何的记账本
        </h1>
        <p class="subtitle">
          记录真实投资，见证财富成长。本页面数据非实时，仅为定期更新的实盘分享。
        </p>
        <p class="update-date">数据更新于：{{ lastUpdatedDate }} (展示昨日收盘数据)</p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 账户总览 -->
        <div class="content-card">
          <div class="card-header-actions">
            <h2 class="card-title">账户总览</h2>
            <button class="action-button" @click="isModalVisible = true">录入数据 ✍️</button>
          </div>
          <!-- 优化后的指标布局 -->
          <div class="overview-metrics">
            <div class="metric-item">
              <span class="metric-label">总金额</span>
              <span class="metric-value">¥
                {{ portfolioSummary.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">当日收益</span>
              <span class="metric-value" :class="getPlClass(portfolioSummary.dailyProfit)">
                {{ portfolioSummary.dailyProfit >= 0 ? '+' : '' }}{{ portfolioSummary.dailyProfit.toLocaleString('en-US') }}
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">当日收益率</span>
              <span class="metric-value" :class="getPlClass(portfolioSummary.dailyProfitRate)">
                {{ portfolioSummary.dailyProfitRate >= 0 ? '+' : '' }}{{ portfolioSummary.dailyProfitRate.toFixed(2) }}%
              </span>
            </div>
          </div>
          <!-- 优化后的图表和图例容器 -->
          <div class="pie-chart-wrapper">
            <div ref="pieChartContainer" class="echart-container"></div>
          </div>
        </div>

        <!-- 历史表现趋势 -->
        <div class="content-card">
          <div class="card-header-actions">
            <h2 class="card-title">历史表现趋势</h2>
            <div class="chart-toggle-buttons">
              <button :class="{ active: activeChartType === 'rate' }" @click="activeChartType = 'rate'">收益率曲线</button>
              <button :class="{ active: activeChartType === 'amount' }" @click="activeChartType = 'amount'">收益金额曲线</button>
            </div>
          </div>
          <div ref="lineChartContainer" class="echart-container" style="height: 300px;"></div>
        </div>

        <!-- ==================== 新增：各策略收益对比图 ==================== -->
        <div class="content-card">
          <h2 class="card-title">各策略收益对比</h2>
          <p class="card-description">
            下图展示了不同策略的模拟累计收益率曲线，用于直观对比其风险与回报特性。
          </p>
          <div ref="strategyComparisonChartContainer" class="echart-container" style="height: 350px;"></div>
        </div>
        <!-- ============================================================= -->

        <!-- 各策略表现指标 (原卡片保留) -->
        <div class="content-card">
          <h2 class="card-title">各策略表现详情</h2>
          <div class="tabs-container">
            <button v-for="tab in strategyTabs" :key="tab.id" :class="['tab-button', { active: activeStrategyTab === tab.id }]"
              @click="activeStrategyTab = tab.id">
              {{ tab.name }}
            </button>
          </div>
          <div class="tab-content">
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>表现指标</th>
                  <th>数值</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>策略总收益率</td>
                  <td :class="getPlClass(activeStrategyInfo.totalPl)">
                    {{ activeStrategyInfo.totalPl.toFixed(2) }}%
                  </td>
                </tr>
                <tr>
                  <td>在总资产中占比</td>
                  <td>{{ (activeStrategyInfo.percentage * 100).toFixed(2) }}%</td>
                </tr>
              </tbody>
            </table>
            <p class="strategy-summary">
              <b>“{{ activeStrategyInfo.name }}”策略总结：</b>{{ activeStrategyInfo.summary }}
            </p>
          </div>
        </div>

        <!-- 近期操作记录 (无变化) -->
        <div class="content-card">
          <h2 class="card-title">近期操作记录</h2>
          <table class="portfolio-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>操作类型</th>
                <th>标的</th>
                <th>所属策略</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="transactionLogs.length === 0">
                <td colspan="4" style="text-align: center; color: #8392A5;">暂无操作记录</td>
              </tr>
              <tr v-for="(log, index) in transactionLogs" :key="index">
                <td>{{ log.date }}</td>
                <td :class="log.type.includes('买入') ? 'text-profit' : 'text-loss'">{{ log.type }}</td>
                <td>{{ log.target }}</td>
                <td>{{ log.strategy }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 数据录入弹窗 (无变化) -->
    <Transition name="modal-fade">
      <div v-if="isModalVisible" class="modal-backdrop" @click="isModalVisible = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>录入数据</h3>
            <button class="modal-close-button" @click="isModalVisible = false">×</button>
          </div>
          <div class="modal-body">
            <div class="modal-tabs">
              <button :class="{ active: modalTab === 'operation' }" @click="modalTab = 'operation'">记录操作</button>
              <button :class="{ active: modalTab === 'performance' }" @click="modalTab = 'performance'">更新表现</button>
            </div>
            <div v-if="modalTab === 'operation'" class="form-container">
              <div class="form-group"><label for="op-date">日期</label><input type="date" id="op-date" v-model="newOperation.date"></div>
              <div class="form-group"><label for="op-type">操作类型</label><select id="op-type" v-model="newOperation.type">
                  <option>买入</option>
                  <option>卖出</option>
                  <option>再平衡买入</option>
                  <option>再平衡卖出</option>
                </select></div>
              <div class="form-group"><label for="op-target">标的名称</label><input type="text" id="op-target" v-model="newOperation.target"
                  placeholder="例如：沪深300ETF"></div>
              <div class="form-group"><label for="op-strategy">所属策略</label><select id="op-strategy" v-model="newOperation.strategy">
                  <option v-for="tab in strategyTabs" :key="tab.id" :value="tab.name">{{ tab.name }}</option>
                </select></div>
              <button class="form-submit-button" @click="handleRecordOperation">确认记录</button>
            </div>
            <div v-if="modalTab === 'performance'" class="form-container">
              <div class="form-group"><label for="perf-date">选择日期</label><input type="date" id="perf-date" v-model="historyUpdate.date">
              </div>
              <div class="form-group"><label for="perf-rate">当日累计收益率 (%)</label><input type="number" id="perf-rate"
                  v-model.number="historyUpdate.rate" placeholder="例如: 3.15"></div>
              <div class="form-group"><label for="perf-amount">当日累计收益金额 (元)</label><input type="number" id="perf-amount"
                  v-model.number="historyUpdate.amount" placeholder="例如: 35000.50"></div>
              <button class="form-submit-button" @click="handleUpdateHistory">确认更新历史</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
  import * as echarts from 'echarts'

  // --- 响应式状态定义 ---
  const activeStrategyTab = ref('allWeather')
  const pieChartContainer = ref<HTMLElement | null>(null)
  const lineChartContainer = ref<HTMLElement | null>(null)
  // 新增：策略对比图的容器引用
  const strategyComparisonChartContainer = ref<HTMLElement | null>(null)
  let myPieChart: echarts.ECharts | null = null
  let myLineChart: echarts.ECharts | null = null
  // 新增：策略对比图的实例
  let myComparisonChart: echarts.ECharts | null = null

  const activeChartType = ref<'rate' | 'amount'>('rate')
  const lastUpdatedDate = ref('2025-07-14')
  const isModalVisible = ref(false)
  const modalTab = ref<'operation' | 'performance'>('operation')
  const newOperation = ref({
      date: new Date().toISOString().slice(0, 10),
      type: '买入',
      target: '',
      strategy: '全天候策略'
  })
  const historyUpdate = ref({ date: new Date().toISOString().slice(0, 10), rate: 0, amount: 0 })

  // --- 数据 ---
  const portfolioSummary = ref({
      totalAmount: 1234567.89,
      dailyProfit: 1234.56,
      dailyProfitRate: 0.1
  })
  const historicalData = ref({
      dates: [
          '2025-06-01',
          '2025-06-05',
          '2025-06-10',
          '2025-06-15',
          '2025-06-20',
          '2025-06-25',
          '2025-07-01',
          '2025-07-05',
          '2025-07-10',
          '2025-07-14'
      ],
      amounts: [0, 5200, 8300, 7100, 12500, 15000, 22000, 20500, 28000, 31234],
      rates: [0, 0.5, 0.81, 0.69, 1.22, 1.45, 2.13, 1.98, 2.71, 3.01]
  })
  const strategiesData: any = ref({
      allWeather: {
          name: '全天候策略',
          summary: '追求在任何经济环境下都表现稳健，回撤小。',
          totalPl: 5.68,
          percentage: 0.4
      },
      longTerm: {
          name: '长钱策略',
          summary: '高风险高回报，通过长期持有低估指数获取超额收益。',
          totalPl: 12.33,
          percentage: 0.3
      },
      microCap: {
          name: '微盘股策略',
          summary: '风险极高，投资于最小市值的公司，博取最高弹性。',
          totalPl: -7.37,
          percentage: 0.15
      },
      convertibleBond: {
          name: '可转债策略',
          summary: '攻守兼备，熊市抗跌，牛市跟涨。',
          totalPl: 11.61,
          percentage: 0.15
      }
  })
  const transactionLogs = ref([
      { date: '2025-07-10', type: '买入', target: '中证2000指数ETF', strategy: '微盘股策略' }
  ])

  // 新增：为策略对比图准备的模拟数据
  const comparisonData = {
      dates: ['2023-01', '2023-04', '2023-07', '2023-10', '2024-01', '2024-04', '2024-07'],
      allWeather: [0, 2, 3, 2.5, 4, 5, 5.5],
      longTerm: [0, 5, 2, 8, 15, 12, 18],
      microCap: [0, 10, -5, 15, 25, 10, 30],
      convertibleBond: [0, 3, 1, 6, 10, 8, 14]
  }

  // --- 计算属性 ---
  const strategyTabs = computed(() =>
      Object.entries(strategiesData.value).map(([id, data]: any) => ({ id, name: data.name }))
  )
  const activeStrategyInfo = computed(() => strategiesData.value[activeStrategyTab.value])
  const pieChartData = computed(() =>
      Object.values(strategiesData.value).map((strategy: any) => ({
          value: strategy.percentage,
          name: strategy.name
      }))
  )

  const lineChartOption = computed((): echarts.EChartsOption => {
      const isRate = activeChartType.value === 'rate'
      const data = isRate ? historicalData.value.rates : historicalData.value.amounts
      const seriesName = isRate ? '累计收益率' : '累计收益金额'
      const yAxisFormatter = isRate ? '{value} %' : '¥ {value}'
      return {
          backgroundColor: 'transparent',
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          tooltip: {
              trigger: 'axis',
              formatter: (params: any) =>
                  `<strong>${params[0].name}</strong><br/>${
                      params[0].marker
                  } ${seriesName}: <strong>${params[0].value}${isRate ? '%' : ' 元'}</strong>`
          },
          xAxis: {
              type: 'category',
              boundaryGap: false,
              data: historicalData.value.dates,
              axisLine: { lineStyle: { color: '#8392A5' } }
          },
          yAxis: {
              type: 'value',
              axisLabel: { formatter: yAxisFormatter },
              axisLine: { lineStyle: { color: '#8392A5' } },
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
          },
          series: [
              {
                  name: seriesName,
                  type: 'line',
                  smooth: true,
                  data: data,
                  itemStyle: { color: '#00c497' },
                  areaStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                          { offset: 0, color: 'rgba(0, 196, 151, 0.5)' },
                          { offset: 1, color: 'rgba(0, 196, 151, 0)' }
                      ])
                  }
              }
          ]
      }
  })

  // --- Watchers ---
  watch(activeChartType, () => {
      if (myLineChart) {
          myLineChart.setOption(lineChartOption.value, true)
      }
  })

  // --- 方法 ---
  const getPlClass = (pl: number) => {
      if (pl > 0) return 'text-profit'
      if (pl < 0) return 'text-loss'
      return ''
  }

  const initPieChart = () => {
      if (pieChartContainer.value) {
          myPieChart = echarts.init(pieChartContainer.value, 'dark')
          myPieChart.setOption({
              backgroundColor: 'transparent',
              tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {d}%' },
              legend: {
                  orient: 'vertical',
                  left: '5%',
                  top: 'center',
                  textStyle: { color: '#ccc' },
                  formatter: (name: string) => {
                      const item: any = pieChartData.value.find(p => p.name === name)
                      return `${name}  ${(item.value * 100).toFixed(0)}%`
                  }
              },
              series: [
                  {
                      name: '策略分布',
                      type: 'pie',
                      radius: ['50%', '75%'],
                      center: ['65%', '50%'], // 将饼图向右移动
                      avoidLabelOverlap: false,
                      label: { show: false },
                      emphasis: { label: { show: false } },
                      data: pieChartData.value
                  }
              ]
          })
      }
  }

  const initLineChart = () => {
      if (lineChartContainer.value) {
          myLineChart = echarts.init(lineChartContainer.value, 'dark')
          myLineChart.setOption(lineChartOption.value)
      }
  }

  // 新增：初始化策略对比图
  const initComparisonChart = () => {
      if (strategyComparisonChartContainer.value) {
          myComparisonChart = echarts.init(strategyComparisonChartContainer.value, 'dark')
          myComparisonChart.setOption({
              backgroundColor: 'transparent',
              tooltip: {
                  trigger: 'axis',
                  formatter: (params: any) => {
                      let res = `<strong>${params[0].name}</strong>`
                      params.forEach((item: any) => {
                          res += `<br/>${item.marker} ${item.seriesName}: <strong>${item.value}%</strong>`
                      })
                      return res
                  }
              },
              legend: {
                  data: ['全天候策略', '长钱策略', '微盘股策略', '可转债策略'],
                  textStyle: { color: '#ccc' },
                  top: 0
              },
              grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
              xAxis: {
                  type: 'category',
                  boundaryGap: false,
                  data: comparisonData.dates,
                  axisLine: { lineStyle: { color: '#8392A5' } }
              },
              yAxis: {
                  type: 'value',
                  axisLabel: { formatter: '{value} %' },
                  splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
              },
              series: [
                  {
                      name: '全天候策略',
                      type: 'line',
                      smooth: true,
                      data: comparisonData.allWeather,
                      itemStyle: { color: '#00aaff' }
                  },
                  {
                      name: '长钱策略',
                      type: 'line',
                      smooth: true,
                      data: comparisonData.longTerm,
                      itemStyle: { color: '#ff4081' }
                  },
                  {
                      name: '微盘股策略',
                      type: 'line',
                      smooth: true,
                      data: comparisonData.microCap,
                      itemStyle: { color: '#f0e68c' }
                  },
                  {
                      name: '可转债策略',
                      type: 'line',
                      smooth: true,
                      data: comparisonData.convertibleBond,
                      itemStyle: { color: '#add8e6' }
                  }
              ]
          })
      }
  }

  const handleRecordOperation = () => {
      transactionLogs.value.unshift({ ...newOperation.value })
      isModalVisible.value = false
  }

  const handleUpdateHistory = () => {
      const { date, rate, amount } = historyUpdate.value
      if (!date) {
          alert('请选择一个日期！')
          return
      }
      const { dates, rates, amounts } = historicalData.value
      const existingIndex = dates.indexOf(date)
      if (existingIndex !== -1) {
          rates[existingIndex] = rate
          amounts[existingIndex] = amount
      } else {
          const newDate = new Date(date)
          const insertIndex = dates.findIndex(d => new Date(d) > newDate)
          if (insertIndex === -1) {
              dates.push(date)
              rates.push(rate)
              amounts.push(amount)
          } else {
              dates.splice(insertIndex, 0, date)
              rates.splice(insertIndex, 0, rate)
              amounts.splice(insertIndex, 0, amount)
          }
      }
      myLineChart?.setOption(lineChartOption.value, true)
      isModalVisible.value = false
  }

  const resizeCharts = () => {
      myPieChart?.resize()
      myLineChart?.resize()
      myComparisonChart?.resize() // 新增
  }

  onMounted(() => {
      nextTick(() => {
          initPieChart()
          initLineChart()
          initComparisonChart() // 新增
      })
      window.addEventListener('resize', resizeCharts)
  })

  onUnmounted(() => {
      window.removeEventListener('resize', resizeCharts)
      myPieChart?.dispose()
      myLineChart?.dispose()
      myComparisonChart?.dispose() // 新增
  })
</script>

<style scoped>
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      /* 主题绿色背景 */
      background: radial-gradient(circle at 15% 50%, #1a4a2a, transparent 40%),
          radial-gradient(circle at 85% 50%, #2a4a1a, transparent 40%), #121212;
  }
  .main-container {
      max-width: 900px;
      margin: 0 auto;
  }
  .page-header {
      text-align: center;
      margin-bottom: 3rem;
  }
  .back-button:hover {
      color: #00c497;
  }
  .title-icon {
      color: #00c497;
      text-shadow: 0 0 15px #00c497;
  }

  .content-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
  }
  .content-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem 2rem;
      backdrop-filter: blur(10px);
      transition: border-color 0.3s;
  }
  .content-card:hover {
      border-color: rgba(0, 196, 151, 0.5);
  }
  .card-title {
      font-size: 1.4rem;
      border-left: 4px solid #00c497;
      padding-left: 1rem;
      margin: 0 0 1.5rem 0;
  }

  /* 账户总览指标 */
  .overview-metrics {
      display: flex;
      justify-content: space-around;
      text-align: center;
      margin-bottom: 1.5rem;
  }
  .metric-item {
      display: flex;
      flex-direction: column;
  }
  .metric-label {
      font-size: 0.9rem;
      color: #b0c4de;
      margin-bottom: 0.5rem;
  }
  .metric-value {
      font-size: 1.8rem;
      font-weight: bold;
      line-height: 1;
  }

  /* 饼图容器 */
  .pie-chart-wrapper {
      width: 100%;
      height: 250px;
  }
  .echart-container {
      width: 100%;
      height: 100%;
  }

  .card-header-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
  }
  .card-header-actions .card-title {
      margin-bottom: 0;
  }
  .action-button,
  .form-submit-button,
  .chart-toggle-buttons button.active {
      background-color: #00c497;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.3s;
  }
  .action-button:hover,
  .form-submit-button:hover {
      background-color: #00a080;
  }
  .action-button {
      padding: 0.5rem 1rem;
  }
  .form-submit-button {
      padding: 0.9rem;
  }

  /* 图表切换按钮 */
  .chart-toggle-buttons {
      display: flex;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 4px;
  }
  .chart-toggle-buttons button {
      padding: 0.5rem 1rem;
      border: none;
      background-color: transparent;
      color: #b0c4de;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
  }

  /* 策略表现详情 */
  .tabs-container {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
  }
  .tab-button {
      padding: 0.75rem 1.5rem;
      cursor: pointer;
      background: transparent;
      border: none;
      color: #b0c4de;
      font-size: 1rem;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
  }
  .tab-button.active {
      color: #ffffff;
      border-bottom-color: #00c497;
  }
  .portfolio-table {
      width: 100%;
      border-collapse: collapse;
  }
  .portfolio-table th,
  .portfolio-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .portfolio-table tr:last-child td {
      border-bottom: none;
  }
  .strategy-summary {
      margin-top: 1.5rem;
      padding: 1rem;
      background-color: rgba(0, 196, 151, 0.1);
      border-left: 3px solid #00c497;
      color: #b0c4de;
      font-size: 0.9rem;
      line-height: 1.6;
  }

  .text-profit {
      color: #28a745 !important;
  }
  .text-loss {
      color: #ff4081 !important;
  }

  /* 弹窗样式 */
  .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
  }
  .modal-content {
      background: #1e1e1e;
      border-radius: 15px;
      padding: 1.5rem 2rem;
      width: 90%;
      max-width: 500px;
  }
  .modal-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.5rem;
  }
  .modal-tabs {
      display: flex;
      margin-bottom: 1.5rem;
  }
  .modal-tabs button {
      flex-grow: 1;
      padding: 0.8rem;
      background-color: transparent;
      color: #b0c4de;
      border: 1px solid #444;
      cursor: pointer;
  }
  .modal-tabs button.active {
      background-color: #00c497;
      color: #fff;
      border-color: #00c497;
  }
  .form-container {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
  }
  .form-group {
      display: flex;
      flex-direction: column;
  }
  .form-group label {
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
  }
  .form-group input,
  .form-group select {
      background-color: #2c2c2c;
      border: 1px solid #444;
      color: #fff;
      padding: 0.8rem;
      border-radius: 6px;
  }
</style>