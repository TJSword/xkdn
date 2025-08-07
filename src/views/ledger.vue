<template>
  <div class="page-wrapper">
    <div class="main-container">
      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>
        <!-- <a href="/" class="back-button">← 返回主页</a> -->
        <h1 class="main-title">
          <span class="title-icon">🚀</span>
          老何的实盘
        </h1>
        <p class="subtitle">
          记录真实投资，见证财富成长。
        </p>
        <p class="update-info">
          本页面数据非实时，仅为定期更新的实盘分享。
        </p>
        <p class="update-info">数据更新于：{{ lastUpdatedDate }}</p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">
        <!-- 账户总览 -->
        <div class="content-card">
          <div class="card-header-actions">
            <h2 class="card-title">账户总览</h2>
            <div v-if="userInfo.admin" class="admin-controls">
              <!-- 新增的数据录入按钮 -->
              <button @click="isModalVisible = true" class="edit-button">数据录入</button>
            </div>
          </div>
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
          <div class="charts-container-split">
            <div class="chart-column">
              <h3 class="chart-subtitle">仓位占比</h3>
              <div ref="pieChartContainer" class="echart-container"></div>
            </div>
            <div class="chart-column">
              <h3 class="chart-subtitle">当日收益贡献 (元)</h3>
              <div ref="profitCompositionChartContainer" class="echart-container"></div>
            </div>
          </div>
        </div>

        <!-- 历史表现趋势 -->
        <!-- <div class="content-card">
          <div class="card-header-actions">
            <h2 class="card-title">历史表现趋势</h2>
            <div class="chart-toggle-buttons">
              <button :class="{ active: activeChartType === 'rate' }" @click="activeChartType = 'rate'">收益率曲线</button>
              <button :class="{ active: activeChartType === 'amount' }" @click="activeChartType = 'amount'">收益金额曲线</button>
            </div>
          </div>
          <div ref="lineChartContainer" class="echart-container" style="height: 300px;"></div>
        </div> -->

        <!-- 各策略收益对比图 -->
        <!-- <div class="content-card">
          <h2 class="card-title">各策略收益对比</h2>
          <p class="card-description">
            下图展示了不同策略的模拟累计收益率曲线，用于直观对比其风险与回报特性。
          </p>
          <div ref="strategyComparisonChartContainer" class="echart-container" style="height: 350px;"></div>
        </div> -->

        <!-- 近期操作记录 -->
        <div class="content-card">
          <h2 class="card-title">近期操作记录</h2>
          <table class="portfolio-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>操作类型</th>
                <th>操作金额</th>
                <th>所属策略</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="transactionLogs.length === 0">
                <td colspan="5" style="text-align: center; color: #8392A5;">暂无操作记录</td>
              </tr>
              <tr v-for="(log, index) in transactionLogs" :key="index">
                <td>{{ log.transaction_date }}</td>
                <td :class="log.type.includes('买入') ? 'text-profit' : 'text-loss'">{{ log.type }}</td>
                <td>{{ log.amount }}</td>
                <td>{{ log.strategy }}</td>
                <th>{{ log.notes }}</th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="isModalVisible" class="modal-backdrop" @click.self="isModalVisible = false">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">数据录入</h2>
            <button class="modal-close-button" @click="isModalVisible = false">×</button>
          </div>

          <!-- 弹窗页签 -->
          <div class="modal-tabs">
            <button :class="{ active: activeModalTab === 'performance' }" @click="activeModalTab = 'performance'">
              每日表现
            </button>
            <button :class="{ active: activeModalTab === 'transaction' }" @click="activeModalTab = 'transaction'">
              操作记录
            </button>
          </div>

          <!-- 表单内容 -->
          <div class="form-container">
            <!-- 每日表现录入表单 -->
            <div v-if="activeModalTab === 'performance'" class="form-section">
              <div class="form-group">
                <label for="perf-date">日期</label>
                <input type="date" id="perf-date" v-model="newDailyPerformance.record_date">
              </div>
              <div class="form-group">
                <label for="perf-strategy">所属策略</label>
                <select id="perf-strategy" v-model="newDailyPerformance.strategy_id">
                  <option v-for="strategy in strategyTabs" :key="strategy.id" :value="strategy.id">{{ strategy.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="perf-amount">策略总金额 (元)</label>
                <input id="perf-amount" placeholder="截至收盘该策略的总资产" v-model.number="newDailyPerformance.strategy_amount">
              </div>
              <div class="form-group">
                <label for="perf-profit">当日收益 (元)</label>
                <input id="perf-profit" placeholder="今天该策略的盈利或亏损" v-model.number="newDailyPerformance.daily_profit">
              </div>

              <button class="form-submit-button" @click="submitDailyPerformance">提交表现记录</button>
            </div>

            <!-- 操作记录录入表单 -->
            <div v-if="activeModalTab === 'transaction'" class="form-section">
              <div class="form-group">
                <label for="trans-date">操作日期</label>
                <input type="date" id="trans-date" v-model="newTransaction.transaction_date">
              </div>
              <div class="form-group">
                <label for="trans-type">操作类型</label>
                <select id="trans-type" v-model="newTransaction.type">
                  <option>买入</option>
                  <option>卖出</option>
                  <option>再平衡买入</option>
                  <option>再平衡卖出</option>
                </select>
              </div>
              <!-- <div class="form-group">
                <label for="trans-target">操作标的</label>
                <input type="text" id="trans-target" placeholder="例如：沪深300ETF" v-model="newTransaction.target">
              </div> -->
              <div class="form-group">
                <label for="trans-amount">操作金额 (元)</label>
                <input id="trans-amount" placeholder="例如: 5000" v-model.number="newTransaction.amount">
              </div>
              <div class="form-group">
                <label for="trans-strategy">所属策略</label>
                <select id="trans-strategy" v-model="newTransaction.strategy_id">
                  <option v-for="strategy in strategyTabs" :key="strategy.id" :value="strategy.id">{{ strategy.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label for="trans-notes">备注 (可选)</label>
                <input type="text" id="trans-notes" placeholder="记录操作原因等" v-model="newTransaction.notes">
              </div>
              <button class="form-submit-button" @click="submitTransaction">提交操作记录</button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
  import * as echarts from 'echarts'
  import app from '@/lib/cloudbase'
  import { useUserStore } from '@/store/user'
  import { storeToRefs } from 'pinia'
  const userStore = useUserStore()
  const { userInfo }: any = storeToRefs(userStore)
  const showMessage: any = inject('showMessage')
  // --- 响应式状态定义 ---
  const pieChartContainer = ref<HTMLElement | null>(null)
  const lineChartContainer = ref<HTMLElement | null>(null)
  const strategyComparisonChartContainer = ref<HTMLElement | null>(null)
  const profitCompositionChartContainer = ref<HTMLElement | null>(null)

  let myPieChart: echarts.ECharts | null = null
  let myLineChart: echarts.ECharts | null = null
  let myComparisonChart: echarts.ECharts | null = null
  let myProfitCompositionChart: echarts.ECharts | null = null

  const activeChartType = ref<'rate' | 'amount'>('rate')
  const lastUpdatedDate = ref('加载中...')

  // --- 新增：弹窗控制 ---
  const isModalVisible = ref(false)
  const activeModalTab = ref('performance') // 'performance' 或 'transaction'
  const today = new Date().toISOString().slice(0, 10)

  // 新增：每日表现表单数据
  const newDailyPerformance = ref({
      record_date: today,
      strategy_id: 'allWeather',
      strategy_amount: null,
      daily_profit: null
  })

  // 新增：操作记录表单数据
  const newTransaction = ref({
      transaction_date: today,
      type: '买入',
      strategy_id: 'allWeather',
      notes: '',
      amount: null
  })

  // --- 数据 ---
  const portfolioSummary = ref({
      totalAmount: 0,
      dailyProfit: 0,
      dailyProfitRate: 0
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
  // 策略数据现在包含ID，更符合数据库设计
  const strategiesData: any = ref({
      allWeather: { name: '全天候策略' },
      longTerm: { name: '长钱策略' },
      microCap: { name: '微盘股策略' },
      convertibleBond: { name: '可转债策略' }
  })
  const dailyProfitComposition = ref([
      { name: '全天候策略', value: 650.18 },
      { name: '长钱策略', value: 834.4 },
      { name: '微盘股策略', value: -350.52 },
      { name: '可转债策略', value: 100.5 }
  ])

  const transactionLogs: any = ref([])

  const comparisonData: any = {
      dates: ['2023-01', '2023-04', '2023-07', '2023-10', '2024-01', '2024-04', '2024-07'],
      allWeather: [0, 2, 3, 2.5, 4, 5, 5.5],
      longTerm: [0, 5, 2, 8, 15, 12, 18],
      microCap: [0, 10, -5, 15, 25, 10, 30],
      convertibleBond: [0, 3, 1, 6, 10, 8, 14]
  }

  const pieChartData: any = ref([])
  // 用于弹窗下拉选择
  const strategyTabs = computed(() =>
      Object.entries(strategiesData.value).map(([id, data]: any) => ({ id, name: data.name }))
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

  // --- 新增：表单提交方法 ---
  const submitDailyPerformance = async () => {
      // 1. 数据校验 (一个好的实践)
      if (
          newDailyPerformance.value.strategy_amount === null ||
          newDailyPerformance.value.daily_profit === null
      ) {
          showMessage('错误：策略总金额、当日收益和累计收益率均为必填项！', 'error')
          return // 阻止提交
      }

      // 2. 准备要发送到云函数的数据
      // 这就是云函数 event.body 将会收到的内容
      const postData = {
          record_date: newDailyPerformance.value.record_date,
          strategy_id: newDailyPerformance.value.strategy_id,
          strategy_amount: Number(newDailyPerformance.value.strategy_amount),
          daily_profit: Number(newDailyPerformance.value.daily_profit)
      }
      // 3. 使用 try...catch 结构来调用云函数并处理可能出现的错误

      // !!! 核心：将这里的 URL 替换成您自己的云函数 API 网关访问路径 !!!
      const res = await app.callFunction({
          name: 'saveDailyPerformance',
          data: postData,
          parse: true
      })

      // 4. 发送 POST 请求到您的云函数
      // 我们在函数前面加上了 async，所以这里可以用 await 来等待结果

      // 5. 处理云函数返回的成功响应
      if (res.result && res.result.success) {
          showMessage('数据保存成功！', 'success')
          // 关闭弹窗
          isModalVisible.value = false

          // [可选] 如果您希望提交后页面数据能立即刷新，可以在这里调用一个重新获取数据的函数
          // 例如: fetchAllData();
      }
  }

  const submitTransaction = async () => {
      // 1. 数据校验
      if (!newTransaction.value.transaction_date) {
          // 假设标的是必填的
          showMessage('错误：操作日期为必填项！', 'error')
          return
      }

      // 2. 准备要发送到云函数的数据
      // 注意：这里我们直接传递 newTransaction.value，因为它的字段已经和云函数需要的一致
      const postData = {
          transaction_date: newTransaction.value.transaction_date,
          type: newTransaction.value.type,
          amount: Number(newTransaction.value.amount),
          strategy_id: newTransaction.value.strategy_id,
          notes: newTransaction.value.notes
      }

      // 3. 调用名为 'saveTransaction' 的云函数
      const res = await app.callFunction({
          name: 'saveTransaction', // <-- 对应新的云函数名
          data: postData,
          parse: true
      })

      // 4. 处理云函数返回的成功响应
      if (res.result && res.result.success) {
          showMessage('操作记录保存成功！', 'success')

          // 5. (重要) 前端模拟：将新纪录添加到操作列表的顶部，实现即时刷新效果
          transactionLogs.value.unshift({
              date: newTransaction.value.transaction_date,
              type: newTransaction.value.type,
              amount: newTransaction.value.amount,
              // 根据 strategy_id 从 strategiesData 中查找策略名称
              strategy: strategiesData.value[newTransaction.value.strategy_id].name
          })

          // 6. 关闭弹窗
          isModalVisible.value = false
      } else {
          // 处理云函数内部返回的失败信息
          throw new Error(res.result.message || '云函数返回了一个未知错误。')
      }
  }

  const initPieChart = () => {
      if (pieChartContainer.value) {
          myPieChart = echarts.init(pieChartContainer.value, 'dark')
          const isMobile = window.innerWidth <= 768
          const pieRadius = isMobile ? ['43%', '63%'] : ['60%', '80%']
          myPieChart.setOption({
              backgroundColor: 'transparent',
              // 1. 定义一个与您页面风格匹配的颜色列表
              color: ['#00aaff', '#f0e68c', '#add8e6', '#b39ddb'],
              tooltip: {
                  trigger: 'item',
                  formatter: '{a} <br/>{b}: {c} ({d}%)', // 提示框显示金额和百分比
                  backgroundColor: 'rgba(20, 20, 20, 0.85)', // 提示框背景色
                  borderColor: '#00c497',
                  borderWidth: 2,
                  textStyle: {
                      color: '#e0e0e0'
                  }
              },
              // grid: { left: '10%', right: '30%', bottom: '10%', containLabel: true },
              // 2. 使用 graphic 组件在环图中心添加标题，比 series.title 更灵活
              graphic: {
                  type: 'text',
                  left: 'center',
                  top: 'center',
                  style: {
                      text: '持仓分布', // 您可以改成任何您想显示的文字
                      textAlign: 'center',
                      fill: '#e0e0e0', // 文字颜色
                      fontSize: 18, // 字体大小
                      fontWeight: 'bold'
                  }
              },
              series: [
                  {
                      name: '策略分布',
                      type: 'pie',
                      // 3. 调整内外半径，让环更宽，视觉效果更突出
                      radius: pieRadius,
                      center: ['50%', '50%'],
                      avoidLabelOverlap: false, // 关闭以自定义标签位置
                      // 4. 优化每一块饼图的默认样式
                      itemStyle: {
                          borderRadius: 8, // 给每个扇区添加圆角，更现代化
                          borderColor: '#121212', // 边框颜色与背景一致，制造分割感
                          borderWidth: 1,
                          // 添加阴影以增加立体感
                          shadowBlur: 10,
                          shadowColor: 'rgba(0, 0, 0, 0.5)'
                      },
                      // 5. 优化标签和引导线样式
                      label: {
                          show: true,
                          position: 'outer',
                          formatter: '{b}\n({d}%)',
                          // 标签文字颜色使用您页面中的辅助文字颜色
                          color: '#b0c4de',
                          fontSize: 13
                      },
                      labelLine: {
                          show: true,
                          length: 20,
                          length2: 15,
                          smooth: true, // 让引导线更平滑
                          lineStyle: {
                              color: '#8392A5',
                              width: 1.5
                          }
                      },
                      // 6. 优化鼠标悬停时的高亮效果
                      emphasis: {
                          label: {
                              show: true,
                              fontSize: 15,
                              fontWeight: 'bold'
                          },
                          itemStyle: {
                              // 高亮时放大，并添加发光效果
                              shadowBlur: 20,
                              shadowColor: 'rgba(0, 196, 151, 0.6)'
                          }
                      },
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

  const initProfitCompositionChart = () => {
      if (profitCompositionChartContainer.value) {
          myProfitCompositionChart = echarts.init(profitCompositionChartContainer.value, 'dark')
          myProfitCompositionChart.setOption({
              backgroundColor: 'transparent',
              grid: { left: '10%', right: '18%', top: '5%', bottom: '10%', containLabel: true },
              tooltip: {
                  trigger: 'axis',
                  axisPointer: { type: 'none' },
                  formatter: (params: any) =>
                      `${params[0].name}<br/>收益: <strong>${params[0].value} 元</strong>`,
                  backgroundColor: 'rgba(20, 20, 20, 0.85)',
                  borderColor: '#00c497',
                  borderWidth: 2,
                  textStyle: { color: '#e0e0e0' }
              },
              xAxis: {
                  type: 'value',
                  axisLabel: { show: false },
                  splitLine: { show: false }
              },
              yAxis: {
                  type: 'category',
                  data: dailyProfitComposition.value.map(item => item.name).reverse(),
                  axisLine: { show: false },
                  axisTick: { show: false },
                  axisLabel: { color: '#ccc' }
              },
              series: [
                  {
                      name: '当日收益',
                      type: 'bar',
                      // ==================== 修改点 1：减小条形宽度 ====================
                      barWidth: '40%', // 从 '60%' 减小到 '40%' 或你喜欢的其他值

                      data: dailyProfitComposition.value
                          .map(item => ({
                              value: item.value,
                              itemStyle: {
                                  // ==================== 修改点 2：为每个条形添加圆角 ====================
                                  borderRadius: [0, 5, 5, 0], // 右上角和右下角为圆角
                                  // 保持原来的颜色逻辑
                                  color: item.value > 0 ? '#ff4081' : '#28a745'
                              }
                          }))
                          .reverse(),

                      label: {
                          show: true,
                          position: 'right',
                          formatter: '{c}',
                          color: 'auto',
                          distance: 5 // 让标签离条形图远一点
                      },

                      // ==================== 修改点 3：增加高亮时的浮动光晕效果 ====================
                      emphasis: {
                          focus: 'series', // 聚焦当前系列
                          itemStyle: {
                              // 使用 shadowBlur 和 shadowColor 制造光晕效果
                              shadowBlur: 20,
                              shadowColor: 'rgba(255, 255, 255, 0.5)'
                          },
                          label: {
                              show: true, // 确保标签在悬停时显示
                              fontWeight: 'bold', // 字体加粗
                              fontSize: 16, // 字体放大 (可以按需调整)
                              color: '#fff' // [可选] 强制为白色，使其更突出
                          }
                      }
                  }
              ]
          })
      }
  }

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

  const resizeCharts = () => {
      myPieChart?.resize()
      // initPieChart()

      // myLineChart?.resize()
      // myComparisonChart?.resize()
      myProfitCompositionChart?.resize()
  }

  onMounted(() => {
      fetchPageData()

      window.addEventListener('resize', resizeCharts)
  })

  onUnmounted(() => {
      window.removeEventListener('resize', resizeCharts)
      myPieChart?.dispose()
      myLineChart?.dispose()
      myComparisonChart?.dispose()
      myProfitCompositionChart?.dispose()
  })
  const isLoading = ref(true) // 新增一个加载状态，用于显示loading或骨架屏

  // 主数据获取方法
  const fetchPageData = async () => {
      isLoading.value = true
      try {
          const res = await app.callFunction({
              name: 'getPageData',
              parse: true
          })

          if (res.result && res.result.success) {
              const pageData = res.result.data

              // 1. 更新总览数据
              portfolioSummary.value.totalAmount = pageData.overview.totalAmount
              portfolioSummary.value.dailyProfit = pageData.overview.dailyProfit
              // 额外计算当日收益率
              if (pageData.overview.totalAmount > 0) {
                  portfolioSummary.value.dailyProfitRate =
                      (pageData.overview.dailyProfit /
                          (pageData.overview.totalAmount - pageData.overview.dailyProfit)) *
                      100
              }

              // 2. 更新饼图和条形图的数据
              // eCharts 会自动处理数据更新，我们只需要替换数据源即可
              pieChartData.value = pageData.overview.position.map((p: any) => ({
                  name: p.name,
                  value: p.value
              }))
              initPieChart()
              dailyProfitComposition.value = pageData.overview.profitContribution

              // 3. 更新历史趋势图数据
              historicalData.value.dates = pageData.historicalTrend.dates
              historicalData.value.amounts = pageData.historicalTrend.amounts
              // (您可能还需要根据 amount 重新计算收益率曲线)

              // 4. 更新策略对比图数据
              // 需要将云函数返回的 strategyId 替换成中文名
              const strategyMap = new Map(pageData.strategyList.map((s: any) => [s.id, s.name]))
              comparisonData.dates = pageData.strategyComparison.dates
              comparisonData.series = pageData.strategyComparison.series.map((s: any) => ({
                  ...s,
                  name: strategyMap.get(s.name) || s.name // s.name 此处还是 strategyId
              }))

              // 5. 更新近期操作记录
              transactionLogs.value = pageData.recentTransactions

              // 6. 更新策略列表 (用于弹窗)
              strategiesData.value = {} // 清空旧数据
              pageData.strategyList.forEach((s: any) => {
                  strategiesData.value[s.id] = { name: s.name, percentage: 0 } // percentage 需要在前端重新计算
              })

              // 7. 更新最后更新日期
              lastUpdatedDate.value = pageData.lastUpdatedDate

              // 8. (重要) 在数据更新后，需要手动重新渲染/刷新图表
              nextTick(() => {
                  initOrUpdateCharts()
              })
          } else {
              throw new Error(res.result.message || '获取数据失败')
          }
      } catch (error) {
          // 在这里可以显示一个全局的错误提示
          showMessage('页面数据加载失败，请刷新重试。', 'error')
      } finally {
          isLoading.value = false
      }
  }

  // 建议将图表初始化逻辑封装成一个函数，方便重复调用
  const initOrUpdateCharts = () => {
      // 使用 nextTick 来确保 DOM 已经准备好
      nextTick(() => {
          // 销毁旧实例，防止内存泄漏
          myPieChart?.dispose()
          myProfitCompositionChart?.dispose()
          // myLineChart?.dispose(); // 如果您暂时不用，可以注释掉
          // myComparisonChart?.dispose(); // 如果您暂时不用，可以注释掉

          // 重新初始化
          // 在初始化前，增加一个判断，确保容器存在且可见
          if (pieChartContainer.value && pieChartContainer.value.clientWidth > 0) {
              initPieChart()
          }
          if (
              profitCompositionChartContainer.value &&
              profitCompositionChartContainer.value.clientWidth > 0
          ) {
              initProfitCompositionChart()
          }
          // if (lineChartContainer.value) { // 如果您暂时不用，可以注释掉
          //     initLineChart();
          // }
          // if (strategyComparisonChartContainer.value) { // 如果您暂时不用，可以注释掉
          //     initComparisonChart();
          // }
      })
  }
</script>

<style scoped>
  /* --- 新增：页面加载动画定义 --- */
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
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }
  /* --- 新增/修改样式 开始 --- */
  .page-header .subtitle {
      color: #e0e0e0;
      margin-bottom: 0.6rem; /* 减少与下方信息行的间距 */
      font-size: 1.1rem;
  }
  .update-info {
      font-size: 0.85rem; /* 设置小字 */
      color: #8392a5; /* 使用一个更柔和的颜色 */
      margin-top: 0;
  }
  /* --- 新增/修改样式 结束 --- */
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
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }
  .content-card:hover {
      border-color: rgba(0, 196, 151, 0.5);
  }
  .content-card:nth-child(1) {
      animation-delay: 0.2s;
  }
  .content-card:nth-child(2) {
      animation-delay: 0.3s;
  }
  .content-card:nth-child(3) {
      animation-delay: 0.4s;
  }
  .card-title {
      font-size: 1.4rem;
      border-left: 4px solid #00c497;
      padding-left: 1rem;
      margin: 0 0 1.5rem 0;
  }
  .card-description {
      color: #b0c4de;
      margin-top: -1rem;
      margin-bottom: 1rem;
  }

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

  .charts-container-split {
      display: flex;
      gap: 2rem;
      height: 250px;
  }
  .chart-column {
      flex: 1;
      width: 50%;
      display: flex;
      flex-direction: column;
  }
  .chart-subtitle {
      text-align: center;
      color: #b0c4de;
      font-size: 1rem;
      font-weight: normal;
      margin: 0 0 1rem 0;
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
  .form-submit-button:hover {
      background-color: #00a080;
  }
  .form-submit-button {
      padding: 0.9rem;
      width: 100%;
      font-size: 1rem;
  }

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

  .text-profit {
      color: #ff4081 !important;
  }
  .text-loss {
      color: #28a745 !important;
  }

  /* ==================== 新增样式 ==================== */
  /* 悬浮操作按钮 (FAB) */
  .fab {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 48px;
      height: 48px;
      background-color: #00c497;
      color: white;
      border: none;
      border-radius: 50%;
      font-size: 1.5rem;
      box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
  }
  .fab:hover {
      background-color: #00a080;
      /* transform: scale(1.05); */
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
      padding: 1.5rem 2rem 2rem 2rem;
      width: 90%;
      max-width: 500px;
      border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
  }
  .modal-title {
      font-size: 1.5rem;
      margin: 0;
      color: #00c497;
  }
  .modal-close-button {
      background: none;
      border: none;
      color: #fff;
      font-size: 2rem;
      font-weight: bold;
      cursor: pointer;
      padding: 0;
      line-height: 1;
  }
  .modal-tabs {
      display: flex;
      margin-bottom: 1.5rem;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #444;
  }
  .modal-tabs button {
      flex-grow: 1;
      padding: 0.8rem;
      background-color: transparent;
      color: #b0c4de;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.3s;
  }
  .modal-tabs button.active {
      background-color: #00c497;
      color: #fff;
  }
  .modal-tabs button:first-of-type {
      border-right: 1px solid #444;
  }

  .form-container .form-section {
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
      color: #b0c4de;
  }
  .form-group input {
      background-color: #2c2c2c;
      border: 1px solid #555;
      color: #fff;
      padding: 0.8rem;
      border-radius: 6px;
      font-size: 1rem;
      width: 100%;
      box-sizing: border-box; /* 确保 padding 不会影响宽度 */
  }
  .form-group select:focus {
      outline: none;
      border-color: #00c497;
  }
  .form-group select {
      /* --- 步骤 1: 移除浏览器默认外观，特别是箭头 --- */
      -webkit-appearance: none; /* 针对 Chrome, Safari, Opera */
      -moz-appearance: none; /* 针对 Firefox */
      appearance: none; /* W3C 标准 */

      /* --- 步骤 2: 添加自定义的箭头作为背景图 --- */
      /* 这是一个白色的向下小箭头的 SVG */
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;

      /* --- 步骤 3: 控制箭头的位置 (这是您问题的核心) --- */
      /* 将箭头定位在右侧，距离边缘 1rem (或16px) 的位置 */
      background-position: right 1rem center;
      background-size: 1em; /* 控制箭头的大小 */

      /* --- 步骤 4: 为新箭头腾出空间，防止文字覆盖它 --- */
      /* 增加右侧的内边距，确保文字不会跑到箭头下面 */
      padding-right: 2.5rem; /* 这个值通常比 background-position 的右边距大一些 */

      /* --- 保留您原有的样式 --- */
      background-color: #2c2c2c;
      border: 1px solid #555;
      color: #fff;
      padding-top: 0.8rem; /* 分开写 padding，因为 padding-right 被重写了 */
      padding-bottom: 0.8rem;
      padding-left: 0.8rem;
      border-radius: 6px;
      font-size: 1rem;
      width: 100%;
      box-sizing: border-box;
  }

  /* 额外添加：当下拉框为焦点状态时，样式保持不变 */
  .form-group select:focus {
      outline: none;
      border-color: #00c497;
  }

  /* 额外添加：修改下拉选项的背景色和文字颜色，以适应深色主题 */
  .form-group select option {
      background: #2c2c2c; /* 选项背景色 */
      color: #fff; /* 选项文字颜色 */
  }

  /* 额外添加：确保 date input 的日历图标样式不受影响 */
  input[type='date']::-webkit-calendar-picker-indicator {
      filter: invert(1);
      cursor: pointer;
  }
  /* --- 从长钱策略页复制过来的样式，用于统一编辑按钮 --- */
  .card-header-with-admin {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem; /* 调整与下方内容的间距 */
      border-left: 4px solid #00c497; /* 保持本页面的绿色主题边框 */
      padding-left: 1rem;
  }

  .card-title.no-border {
      border-left: none;
      padding-left: 0;
      margin-bottom: 0;
      margin-top: 0; /* 确保标题垂直居中 */
  }

  .admin-controls {
      /* 这个容器用于放置按钮 */
  }

  .edit-button {
      padding: 0.4rem 1rem;
      font-size: 0.85rem;
      color: #fff;
      /* 初始为灰色透明背景 */
      background-color: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
  }

  .edit-button:hover {
      /* 悬停时变为长钱策略的粉色，统一操作感 */
      background-color: #00a080;
      border-color: #00a080;
  }

  /* 确保原有的卡片标题样式不会冲突 */
  .card-header-actions {
      /* 您可以保留或删除这个类，因为它现在被 .card-header-with-admin 替代了 */
  }

  /* 覆盖原有的 .card-title 边距，当它不在新头部里时 */
  .content-card > .card-title {
      font-size: 1.4rem;
      border-left: 4px solid #00c497;
      padding-left: 1rem;
      margin: 0 0 1.5rem 0;
  }

  /* 过渡动画 */
  .modal-fade-enter-active,
  .modal-fade-leave-active {
      transition: opacity 0.3s ease;
  }
  .modal-fade-enter-from,
  .modal-fade-leave-to {
      opacity: 0;
  }

  /* ======================================================= */
  /* ========      记账本页面移动端适配      ======== */
  /* ======================================================= */

  @media (max-width: 768px) {
      /* 步骤一：修正卡片的收缩行为，防止被内部表格撑开 */
      .content-card {
          min-width: 0;
          padding: 1.5rem 1rem; /* 统一减小内边距 */
      }

      /* 步骤二：让操作记录表格自身可以滚动 */
      .portfolio-table {
          display: block;
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
      }
      .portfolio-table th,
      .portfolio-table td {
          white-space: nowrap; /* 确保单元格内容不换行 */
      }

      /* --- 核心优化：调整布局为垂直堆叠 --- */

      /* 1. 调整总览区域的指标显示为垂直排列 */
      .overview-metrics {
          flex-direction: column; /* 垂直堆叠 */
          align-items: stretch; /* 子项撑满宽度 */
          gap: 1.5rem; /* 增大间距 */
      }
      .metric-item {
          flex-direction: row; /* 指标的标签和数值改为水平排列 */
          justify-content: space-between; /* 两端对齐 */
          align-items: baseline;
          background: rgba(255, 255, 255, 0.05); /* 给每个指标项一个背景，更清晰 */
          padding: 1rem;
          border-radius: 8px;
      }
      .metric-value {
          font-size: 1.5rem; /* 适当减小数值字号 */
      }

      /* 2. 调整总览区域的两个图表为垂直排列 */
      .charts-container-split {
          flex-direction: column; /* 垂直堆叠 */
          height: auto; /* 高度由内容决定 */
          gap: 2.5rem; /* 增大图表间距 */
      }
      .chart-column {
          width: 100%; /* 每个图表占满宽度 */
          height: 220px; /* 给每个图表一个固定的高度 */
      }
      .echart-container {
          /* 例如，在移动端统一所有图表高度为250px */
          height: 250px !important;
      }

      /* 3. 调整历史表现趋势图的切换按钮为垂直排列 */
      .card-header-actions {
          flex-direction: column;
          align-items: flex-start; /* 左对齐 */
          gap: 1rem;
      }

      /* --- 其他微调 --- */

      .main-title {
          font-size: 2rem;
      }
      .card-title {
          font-size: 1.25rem;
      }

      /* 调整悬浮按钮位置，避免与底部导航栏（如果有）重叠 */
      .fab {
          bottom: 1.5rem;
          right: 1.5rem;
      }

      /* 调整弹窗内边距和字体，使其在小屏幕上更紧凑 */
      .modal-content {
          padding: 1.5rem;
      }
      .modal-title {
          font-size: 1.3rem;
      }
  }
</style>