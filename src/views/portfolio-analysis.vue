<template>
  <div class="page-wrapper" :style="cssVars">
    <div class="main-container">

      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <span class="title-icon">⚗️</span>
          组合实验室
        </h1>
        <p class="subtitle">
          基于真实数据。自由配置，探索组合的化学反应。
        </p>
      </div>

      <div class="content-card config-card">
        <div class="card-header-row">
          <h2 class="card-title no-margin">🧪 参数配置</h2>
          <div :class="['weight-indicator', { 'warning': totalWeight !== 100 }]">
            总权重: {{ totalWeight }}%
            <span v-if="totalWeight !== 100" class="warning-text">(目标 100%)</span>
          </div>
        </div>

        <div class="config-grid">
          <div class="strategy-inputs">
            <div v-for="strat in strategies" :key="strat.id" class="input-row">
              <label class="checkbox-label">
                <input type="checkbox" v-model="strat.selected" @change="handleSelectionChange" />
                <span class="name">{{ strat.name }}</span>
              </label>
              <div class="slider-container" :class="{ disabled: !strat.selected }">
                <input type="range" v-model.number="strat.weight" min="0" max="100" step="5" :disabled="!strat.selected">
                <div class="number-input-wrapper">
                  <input type="number" v-model.number="strat.weight" :disabled="!strat.selected">
                  <span class="unit">%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="action-area">
            <div class="date-picker-group">
              <label>回测时间范围 (已自动对齐交集)</label>
              <div class="date-inputs">
                <input type="date" v-model="startDate" :min="minDate" :max="maxDate" class="cyber-input" />
                <span class="separator">至</span>
                <input type="date" v-model="endDate" :min="minDate" :max="maxDate" class="cyber-input" />
              </div>
            </div>

            <button class="run-btn" @click="runAnalysis" :disabled="isLoading || totalWeight !== 100 || !dataReady">
              {{ dataStatusText }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="analysisDone" class="analysis-results">

        <div class="content-card">
          <h2 class="card-title">净值走势对比</h2>
          <p class="card-description">
            粗线为合成的组合策略 (阈值再平衡: 30%)，细线为各成分策略。区间：{{ startDate }} 至 {{ endDate }}
          </p>
          <div ref="chartContainer" class="echart-container"></div>
        </div>

        <div class="content-card">
          <h2 class="card-title">策略表现对比统计</h2>
          <div class="table-container" style="margin-top: 1rem;">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th class="sticky-col-header">策略名称</th>
                  <th>总收益率</th>
                  <th>年化收益</th>
                  <th>年化波动率</th>
                  <th>夏普比率</th>
                  <th>最大回撤</th>
                  <th>卡玛比率</th>
                </tr>
              </thead>
              <tbody>
                <tr class="highlight-row">
                  <td class="sticky-col">🧪 组合策略</td>
                  <td :class="getValueColor(portfolioStats.totalReturn)">{{ portfolioStats.totalReturn }}%</td>
                  <td :class="getValueColor(portfolioStats.annualizedReturn)">{{ portfolioStats.annualizedReturn }}%</td>
                  <td>{{ portfolioStats.volatility }}%</td>
                  <td>{{ portfolioStats.sharpe }}</td>
                  <td class="negative">{{ portfolioStats.maxDrawdown }}%</td>
                  <td>{{ portfolioStats.calmar }}</td>
                </tr>
                <tr v-for="stat in individualStats" :key="stat.name">
                  <td class="sticky-col">{{ stat.name }}</td>
                  <td :class="getValueColor(stat.totalReturn)">{{ stat.totalReturn }}%</td>
                  <td :class="getValueColor(stat.annualizedReturn)">{{ stat.annualizedReturn }}%</td>
                  <td>{{ stat.volatility }}%</td>
                  <td>{{ stat.sharpe }}</td>
                  <td class="negative">{{ stat.maxDrawdown }}%</td>
                  <td>{{ stat.calmar }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">组合月度/年度收益表</h2>
          <p class="card-description">颜色深浅代表涨跌幅强度。</p>
          <div class="table-container heatmap-container">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th class="sticky-col-header">年份</th>
                  <th v-for="m in 12" :key="m">{{ m }}月</th>
                  <th>年度</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="yearData in monthlyReturns" :key="yearData.year">
                  <td class="sticky-col year-cell">{{ yearData.year }}</td>
                  <td v-for="(val, idx) in yearData.months" :key="idx" :style="getHeatmapStyle(val)" class="month-cell">
                    {{ val !== null ? val + '%' : '-' }}
                  </td>
                  <td class="year-total-cell" :style="getHeatmapStyle(yearData.total)">
                    {{ yearData.total }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <div class="card-header-row">
            <div class="title-with-tooltip">
              <h2 class="card-title no-margin">蒙特卡洛未来模拟</h2>
              <div class="info-icon-wrapper" @mouseenter="showTooltip = true" @mouseleave="showTooltip = false"
                @click="showTooltip = !showTooltip">
                <span class="info-icon">i</span>
                <transition name="fade">
                  <div v-if="showTooltip" class="tooltip-box">
                    <p class="tooltip-title">什么是蒙特卡洛模拟？</p>
                    <p>这是一种利用随机采样来预测可能结果的数学算法。我们基于当前组合的历史波动率和收益率，进行了 <strong>1000次</strong> 平行宇宙式的模拟。</p>
                    <ul class="tooltip-list">
                      <li><strong>上轨 (95%)：</strong> 运气极佳时的表现</li>
                      <li><strong>中轨 (50%)：</strong> 最可能的预期表现</li>
                      <li><strong>下轨 (5%)：</strong> 运气较差时的底线风险</li>
                    </ul>
                  </div>
                </transition>
              </div>
            </div>

            <div class="year-selector">
              <label>预测时长：</label>
              <select v-model="mcYears" @change="runMonteCarlo" class="cyber-input select-arrow">
                <option :value="1">未来 1 年</option>
                <option :value="2">未来 2 年</option>
                <option :value="3">未来 3 年</option>
                <option :value="4">未来 4 年</option>
                <option :value="5">未来 5 年</option>
              </select>
            </div>
          </div>

          <p class="card-description">
            基于当前策略特征生成的 1000 条潜在未来路径。阴影区域代表 90% 的概率区间。
          </p>

          <div class="grid-two-col mc-layout">
            <div ref="mcChartContainer" class="echart-container mc-chart"></div>

            <div class="mc-stats">
              <div class="stat-box optimistic">
                <span class="label">乐观预期 (95分位)</span>
                <span class="value">+{{ mcStats.p95 }}%</span>
                <span class="sub">资产翻 {{ mcStats.p95X }} 倍</span>
              </div>
              <div class="stat-box median">
                <span class="label">中性预期 (中位数)</span>
                <span class="value">+{{ mcStats.p50 }}%</span>
                <span class="sub">资产翻 {{ mcStats.p50X }} 倍</span>
              </div>
              <div class="stat-box pessimistic">
                <span class="label">悲观预期 (5分位)</span>
                <span class="value" :class="{'negative': parseFloat(mcStats.p05) < 0}">{{ mcStats.p05 }}%</span>
                <span class="sub">资产变为 {{ mcStats.p05X }} 倍</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid-two-col">

          <div class="content-card full-height">
            <h2 class="card-title">策略相关性矩阵</h2>
            <p class="card-description">基于选中时间段内的日收益率计算。</p>
            <div class="table-container">
              <table class="correlation-table">
                <thead>
                  <tr>
                    <th class="sticky-col-header">相关度</th>
                    <th v-for="stat in individualStats" :key="stat.name">{{ stat.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rIndex) in correlationMatrix" :key="rIndex">
                    <td class="row-header sticky-col">{{ individualStats[rIndex]?.name }}</td>
                    <td v-for="(val, cIndex) in row" :key="cIndex" :style="getCorrelationStyle(val)" style="text-align: center;">
                      {{ val.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="content-card full-height">
            <h2 class="card-title">组合回撤深度分布</h2>
            <p class="card-description">统计不同回撤深度的出现频次。</p>
            <div class="drawdown-dist-chart">
              <div v-for="(item, index) in drawdownDistribution" :key="index" class="dist-row">
                <div class="dist-info">
                  <span class="dist-label">{{ item.range }}</span>
                  <span class="dist-count">{{ item.count }}次</span>
                </div>
                <div class="dist-bar-bg">
                  <div class="dist-bar" :style="{ width: item.percent + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="content-card">
          <h2 class="card-title">历史重大回撤明细 (Top 10)</h2>
          <div class="table-container" style="margin-top: 1rem;">
            <table class=" risk-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>开始日期</th>
                  <th>谷底日期</th>
                  <th>恢复日期</th>
                  <th>最大回撤</th>
                  <th>回撤期</th>
                  <th>修复期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(dd, index) in top10Drawdowns" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ dd.startDate }}</td>
                  <td>{{ dd.troughDate }}</td>
                  <td>{{ dd.endDate }}</td>
                  <td class="negative">{{ dd.drawdown }}%</td>
                  <td>{{ dd.ddDays }}天</td>
                  <td>{{ dd.fixDays }}天</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick, watch } from 'vue'
  import * as echarts from 'echarts'
  import axios from 'axios'
  const mcYears = ref(1) // 默认预测1年
  const showTooltip = ref(false) // 控制提示框显示
  const mcChartContainer = ref<HTMLElement | null>(null)
  let mcChart: echarts.ECharts | null = null
  const mcStats = ref({ p95: '0', p50: '0', p05: '0', p95X: '1.0', p50X: '1.0', p05X: '1.0' })

  // ============================================
  // 🎨 主题色：电光靛
  // ============================================
  const THEME_COLOR = '#6366f1'

  const cssVars = computed(() => {
      return {
          '--theme-color': THEME_COLOR,
          '--theme-shadow': `${THEME_COLOR}66`
      }
  })

  // --- 核心状态 ---
  const isLoading = ref(false)
  const dataReady = ref(false) // 数据是否加载完毕
  const analysisDone = ref(false)
  const chartContainer = ref<HTMLElement | null>(null)
  let myChart: echarts.ECharts | null = null

  // --- 原始数据存储 ---
  const rawDataMap = ref<Record<string, any>>({})

  // --- 日期控制 ---
  const minDate = ref('')
  const maxDate = ref('')
  const startDate = ref('')
  const endDate = ref('')

  // --- 策略定义 ---
  const strategies = ref([
      {
          id: 'all_weather',
          name: '全天候策略',
          weight: 40,
          selected: true,
          color: '#00aaff',
          url: './static/allWeatherData.json'
      },
      {
          id: 'bonds',
          name: '可转债策略',
          weight: 30,
          selected: true,
          color: '#add8e6',
          url: './static/bondData.json'
      },
      {
          id: 'momentum',
          name: '动量策略',
          weight: 20,
          selected: true,
          color: '#ff5722',
          url: './static/momentumData.json'
      },
      {
          id: 'micro_cap',
          name: '微盘股策略',
          weight: 10,
          selected: true,
          color: '#f0e68c',
          url: './static/microCapData.json'
      },
      {
          id: 'jinghong',
          name: '惊鸿策略',
          weight: 0, // 建议初始设为 0，防止总权重直接超过 100% 导致报错
          selected: false, // 建议初始不选中，由用户手动勾选
          color: '#ff4081', // 🎨 推荐色：荧光玫红。在深色背景极具穿透力，且与蓝/橙/黄形成完美互补。
          url: './static/jinghongData.json'
      }
  ])

  // 计算属性
  const totalWeight = computed(() => {
      return strategies.value
          .filter(s => s.selected)
          .reduce((sum, current) => sum + current.weight, 0)
  })

  const selectedStrategyNames = computed(() => {
      return strategies.value.filter(s => s.selected).map(s => s.name)
  })

  const dataStatusText = computed(() => {
      if (isLoading.value) return '正在计算...'
      if (!dataReady.value) return '正在加载数据...'
      if (totalWeight.value !== 100) return '请调整权重至 100%'
      return '开始回测分析 🚀'
  })

  // --- 结果数据 ---
  const portfolioStats = ref<any>({})
  const individualStats = ref<any[]>([])
  const correlationMatrix = ref<number[][]>([])
  const top10Drawdowns = ref<any[]>([])
  const drawdownDistribution = ref<any[]>([])
  const monthlyReturns = ref<any[]>([])

  // 临时存储图表数据
  const chartData = ref<any>(null)

  // =======================================================
  // 1. 初始化：加载所有数据
  // =======================================================
  onMounted(async () => {
      try {
          isLoading.value = true
          const requests = strategies.value.map(s => axios.get(s.url))
          const responses = await Promise.all(requests)

          responses.forEach((res, index) => {
              const stratId = strategies.value[index].id
              // 保存原始数据
              rawDataMap.value[stratId] = res.data
          })

          dataReady.value = true
          updateDateRangeLimits() // 计算初始日期范围
          isLoading.value = false
      } catch (error) {
          console.error('数据加载失败:', error)
          alert('策略数据加载失败，请检查 static 文件是否存在。')
          isLoading.value = false
      }

      window.addEventListener('resize', () => {
          myChart?.resize()
          mcChart?.resize()
      })
  })

  const handleSelectionChange = () => {
      updateDateRangeLimits()
  }

  // =======================================================
  // 2. 核心逻辑：计算日期交集并设置限制
  // =======================================================
  const updateDateRangeLimits = () => {
      const selectedStrats = strategies.value.filter(s => s.selected)
      if (selectedStrats.length === 0) return

      let commonDates = rawDataMap.value[selectedStrats[0].id]?.dateList || []

      for (let i = 1; i < selectedStrats.length; i++) {
          const nextDates = new Set(rawDataMap.value[selectedStrats[i].id]?.dateList || [])
          commonDates = commonDates.filter((d: string) => nextDates.has(d))
      }

      commonDates.sort()

      if (commonDates.length > 0) {
          minDate.value = commonDates[0]
          maxDate.value = commonDates[commonDates.length - 1]
          startDate.value = minDate.value
          endDate.value = maxDate.value
      } else {
          minDate.value = ''
          maxDate.value = ''
          startDate.value = ''
          endDate.value = ''
          alert('所选策略之间没有共同的时间交集！')
      }
  }

  // =======================================================
  // 3. 运行分析：数据处理与计算 (包含 NaN 修复 + 再平衡逻辑)
  // =======================================================
  const runAnalysis = async () => {
      if (!startDate.value || !endDate.value) return
      if (totalWeight.value !== 100) return

      isLoading.value = true

      setTimeout(() => {
          calculateAllMetrics()
          analysisDone.value = true

          isLoading.value = false
          nextTick(() => {
              initChart()
              runMonteCarlo()
          })
      }, 100)
  }

  const calculateAllMetrics = () => {
      const selectedStrats = strategies.value.filter(s => s.selected)

      if (selectedStrats.length === 0) return

      // 1. 确定计算用的日期列表 (基于 Map 匹配，解决 NaN 问题)
      const baseStratId = selectedStrats[0].id
      const baseRawData = rawDataMap.value[baseStratId]
      const calcDateList = baseRawData.dateList.filter(
          (d: string) => d >= startDate.value && d <= endDate.value
      )

      // 2. 数据清洗与归一化：构建 Map 映射
      const normalizedDataMap: Record<string, number[]> = {}

      selectedStrats.forEach(strat => {
          const rawObj = rawDataMap.value[strat.id]

          // 构建查找表: Date -> Value
          const datePriceMap: Record<string, number> = {}
          for (let i = 0; i < rawObj.dateList.length; i++) {
              datePriceMap[rawObj.dateList[i]] = rawObj.strategyData[i]
          }

          const alignedData: number[] = []
          calcDateList.forEach((date: string) => {
              const val = datePriceMap[date]
              if (val === undefined || isNaN(val)) {
                  // 容错：沿用前值
                  alignedData.push(alignedData.length > 0 ? alignedData[alignedData.length - 1] : 1)
              } else {
                  alignedData.push(val)
              }
          })

          // 归一化 (Start = 1.0)
          if (alignedData.length > 0) {
              const baseVal = alignedData[0]
              normalizedDataMap[strat.id] = alignedData.map(v => v / baseVal)
          } else {
              normalizedDataMap[strat.id] = []
          }
      })

      // 3. 计算组合净值曲线 (核心：阈值再平衡逻辑)
      const portfolioCurve: number[] = []

      // 硬编码的再平衡阈值
      const REBALANCE_THRESHOLD = 0.3 // 30% 偏离度

      // 初始状态：总资金为 1.0，按目标权重分配
      let currentTotalEquity = 1.0
      const currentHoldings: Record<string, number> = {}
      selectedStrats.forEach(s => {
          currentHoldings[s.id] = currentTotalEquity * (s.weight / 100)
      })

      // 第0天也就是初始状态
      portfolioCurve.push(currentTotalEquity)

      // 从第1天开始迭代
      for (let t = 1; t < calcDateList.length; t++) {
          let newTotalEquity = 0

          // A. 根据当日涨跌幅更新各持仓市值
          selectedStrats.forEach(s => {
              const prevPrice = normalizedDataMap[s.id][t - 1]
              const currPrice = normalizedDataMap[s.id][t]
              const dailyReturn = currPrice / prevPrice // 当日涨幅因子

              currentHoldings[s.id] *= dailyReturn
              newTotalEquity += currentHoldings[s.id]
          })

          currentTotalEquity = newTotalEquity

          // B. 检查是否需要再平衡
          let needsRebalance = false
          for (const s of selectedStrats) {
              const targetW = s.weight / 100
              const currentW = currentHoldings[s.id] / currentTotalEquity

              // 计算偏离度： |当前权重 - 目标权重| / 目标权重
              const deviation = Math.abs(currentW - targetW) / targetW

              if (deviation > REBALANCE_THRESHOLD) {
                  needsRebalance = true
                  break // 只要有一个触发，就整体再平衡
              }
          }

          // C. 执行再平衡 (卖出/买入，重置为目标权重)
          if (needsRebalance) {
              selectedStrats.forEach(s => {
                  currentHoldings[s.id] = currentTotalEquity * (s.weight / 100)
              })
              // 这里可以记录再平衡事件，如果需要的话
          }

          // D. 记录当日组合净值
          portfolioCurve.push(currentTotalEquity)
      }

      // 4. 计算各项统计指标
      portfolioStats.value = calculateStats(portfolioCurve)

      individualStats.value = selectedStrats.map(strat => {
          const stats = calculateStats(normalizedDataMap[strat.id])
          return {
              name: strat.name,
              ...stats
          }
      })

      // 5. 相关性矩阵
      const returnsMap: Record<string, number[]> = {}
      selectedStrats.forEach(strat => {
          returnsMap[strat.id] = getDailyReturns(normalizedDataMap[strat.id])
      })

      const matrix: number[][] = []
      for (let i = 0; i < selectedStrats.length; i++) {
          const row: number[] = []
          for (let j = 0; j < selectedStrats.length; j++) {
              if (i === j) {
                  row.push(1.0)
              } else {
                  const corr = calculateCorrelation(
                      returnsMap[selectedStrats[i].id],
                      returnsMap[selectedStrats[j].id]
                  )
                  row.push(corr)
              }
          }
          matrix.push(row)
      }
      correlationMatrix.value = matrix

      // 6. Top 10 回撤 & 回撤分布
      const { drawdowns, distribution } = calculateDrawdownAnalysis(portfolioCurve, calcDateList)
      top10Drawdowns.value = drawdowns
      console.log(drawdowns)
      drawdownDistribution.value = distribution

      // 7. 月度/年度收益
      monthlyReturns.value = calculateMonthlyReturns(portfolioCurve, calcDateList)
      console.log(monthlyReturns.value)

      // 保存数据给图表
      chartData.value = {
          dateList: calcDateList,
          portfolio: portfolioCurve,
          singles: normalizedDataMap
      }
  }

  // --- 蒙特卡洛模拟核心逻辑 ---

  // Box-Muller 变换：生成标准正态分布随机数
  const randn_bm = () => {
      let u = 0,
          v = 0
      while (u === 0) u = Math.random()
      while (v === 0) v = Math.random()
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }

  // --- 蒙特卡洛模拟核心逻辑 (优化版) ---
  const runMonteCarlo = () => {
      if (!chartData.value || !chartData.value.portfolio) return

      // 1. 获取当前组合的历史特征 (日均收益率 和 日波动率)
      const prices = chartData.value.portfolio
      const dailyReturns = []
      // 使用对数收益率更准确，符合正态分布假设
      for (let i = 1; i < prices.length; i++) {
          dailyReturns.push(Math.log(prices[i] / prices[i - 1]))
      }

      const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
      // 计算方差和标准差
      const variance =
          dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyReturns.length
      const stdDev = Math.sqrt(variance)

      // 2. 模拟参数设定
      // 注意：使用数学公式法，不需要循环 10000 次，
      // 公式直接计算出的结果等同于模拟了无穷多次，且不消耗浏览器性能。
      const days = mcYears.value * 252 // 交易日数量

      // 3. 几何布朗运动 (GBM) 概率锥计算
      // 公式: Price_t = Price_0 * exp( (mu - 0.5*sigma^2)*t + sigma*W_t )
      // 其中 W_t 对应标准正态分布的分位值 (Z-score)

      const percentilesData = {
          p95: [1.0], // 乐观线
          p50: [1.0], // 中位线
          p05: [1.0] // 悲观线
      }

      // 漂移项 (Drift)
      const drift = mean - 0.5 * variance

      // Z-score 常数：
      // 1.645 代表正态分布的 95% 分位点
      // -1.645 代表正态分布的 5% 分位点
      const z95 = 1.645
      const z05 = -1.645

      // 逐日计算概率锥的边界
      for (let t = 1; t <= days; t++) {
          const timeFactor = drift * t
          const volFactor = stdDev * Math.sqrt(t) // 波动率随时间的平方根扩散

          percentilesData.p95.push(Math.exp(timeFactor + z95 * volFactor))
          percentilesData.p50.push(Math.exp(timeFactor))
          percentilesData.p05.push(Math.exp(timeFactor + z05 * volFactor))
      }

      // 4. 更新统计数据 (基于最后一天的预测值)
      const final95 = percentilesData.p95[days]
      const final50 = percentilesData.p50[days]
      const final05 = percentilesData.p05[days]

      mcStats.value = {
          p95: ((final95 - 1) * 100).toFixed(0),
          p95X: final95.toFixed(2),
          p50: ((final50 - 1) * 100).toFixed(0),
          p50X: final50.toFixed(2),
          p05: ((final05 - 1) * 100).toFixed(0),
          p05X: final05.toFixed(2)
      }

      // 5. 绘图
      initMonteCarloChart(days, percentilesData)
  }

  const initMonteCarloChart = (days: number, data: any) => {
      if (!mcChartContainer.value) return
      if (mcChart) mcChart.dispose()
      mcChart = echarts.init(mcChartContainer.value)

      // 生成 X 轴标签 (未来第N天)
      const xData = Array.from({ length: days + 1 }, (_, i) => i)

      const option: any = {
          backgroundColor: 'transparent',
          tooltip: {
              trigger: 'axis',
              formatter: (params: any) => {
                  const day = params[0].axisValue
                  let html = `<strong>未来第 ${day} 交易日</strong><br/>`
                  params.forEach((p: any) => {
                      const val = ((p.value - 1) * 100).toFixed(1) + '%'
                      html += `${p.marker} ${p.seriesName}: ${val}<br/>`
                  })
                  return html
              }
          },
          grid: { top: '10%', left: '2%', right: '4%', bottom: '10%', containLabel: true },
          xAxis: {
              type: 'category',
              data: xData,
              axisLine: { lineStyle: { color: '#8392A5' } },
              axisLabel: {
                  formatter: (val: string) => {
                      const day = parseInt(val)
                      if (day % 126 === 0) return (day / 252).toFixed(1) + '年' // 每半年显示一次
                      return ''
                  }
              }
          },
          yAxis: {
              type: 'value',
              scale: true,
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
              axisLabel: {
                  color: '#8392A5',
                  formatter: (val: number) => ((val - 1) * 100).toFixed(0) + '%'
              }
          },
          series: [
              {
                  name: '乐观预期 (95%)',
                  type: 'line',
                  data: data.p95,
                  showSymbol: false,
                  lineStyle: { width: 0 }, // 不显示线，只显示区域
                  itemStyle: { color: '#00c497' },
                  areaStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                          { offset: 0, color: 'rgba(0, 196, 151, 0.4)' },
                          { offset: 1, color: 'rgba(0, 196, 151, 0.1)' }
                      ]),
                      origin: 'start' // 关键：填充基准
                  }
              },
              {
                  name: '悲观预期 (5%)',
                  type: 'line',
                  data: data.p05,
                  showSymbol: false,
                  lineStyle: { width: 0 },
                  itemStyle: { color: '#ff5722' }
                  // 使用 stack 或者 z-index 技巧，或者简单的白色遮罩？
                  // ECharts 处理区间带最好是用 'confidence band' 技巧
                  // 简单做法：先画95的区域，再画05的区域（用背景色填充）覆盖下方？
                  // 更好做法：使用 areaStyle 的 origin，或者堆叠。
                  // 这里为了简单，我们让95填充全部，5填充下方并设为透明度高或背景色
                  // 修正：正确的区间画法通常需要两条线配合 areaStyle，或者自定义图形。
                  // 简化版：画三条线。
              },
              // 重新设计 Series 以实现漂亮的区间效果
              // 底层：95%线，填充到下层
              // 中层：5%线，填充白色(背景色)遮挡下方
              // 这在透明背景下无效。
              // === 最终方案：使用 ECharts 的 areaStyle 填充两条线之间的部分 (需要 visualMap 或者 stack 技巧，比较复杂) ===
              // === 替代方案：绘制三条线，中间填充半透明 ===
              {
                  name: '上界',
                  type: 'line',
                  data: data.p95,
                  showSymbol: false,
                  lineStyle: { width: 1, color: 'rgba(0, 196, 151, 0.5)' },
                  areaStyle: {
                      color: 'rgba(99, 102, 241, 0.15)', // 中间区域色
                      origin: 'start'
                  }
              },
              {
                  name: '下界',
                  type: 'line',
                  data: data.p05,
                  showSymbol: false,
                  lineStyle: { width: 1, color: 'rgba(255, 87, 34, 0.5)' },
                  areaStyle: {
                      color: '#1e1f29', // 用深色遮挡下方，模拟区间效果 (背景色需匹配card背景)
                      // 注意：这取决于你的Card背景。如果是半透明毛玻璃，这个遮挡会穿帮。
                      // 如果穿帮，建议只画线，或者不填充。
                      // 既然是 Cyberpunk，我们只画线和中位数。
                      opacity: 1
                  },
                  z: 5
              },
              {
                  name: '中性预期',
                  type: 'line',
                  data: data.p50,
                  showSymbol: false,
                  lineStyle: { width: 3, color: '#fff', type: 'dashed' },
                  z: 10
              }
          ]
      }

      // 修正：为了完美的区间效果，可以使用 'L' 型数据结构配合 custom series，但太复杂。
      // 修正2：简单粗暴效果好 -> 画一条线（中位数），画一个区域（上界），再画一个区域（下界，颜色为透明或背景色）。
      // 由于背景是复杂的渐变，遮挡法不可行。
      // 最终修正：只画三条线，加上微弱的填充。
      option.series = [
          {
              name: '乐观 (95%)',
              type: 'line',
              data: data.p95,
              showSymbol: false,
              lineStyle: { width: 1, color: '#00c497', opacity: 0.5 },
              areaStyle: { color: 'rgba(0, 196, 151, 0.1)' } // 淡淡的绿
          },
          {
              name: '中性',
              type: 'line',
              data: data.p50,
              showSymbol: false,
              lineStyle: { width: 2, color: '#ffffff' }
          },
          {
              name: '悲观 (5%)',
              type: 'line',
              data: data.p05,
              showSymbol: false,
              lineStyle: { width: 1, color: '#ff5722', opacity: 0.5 },
              areaStyle: { color: 'rgba(255, 87, 34, 0.1)' } // 淡淡的红
          }
      ]

      mcChart.setOption(option)
  }

  // --- 数学工具函数 ---

  const calculateStats = (data: number[]) => {
      const totalReturn = data[data.length - 1] / data[0] - 1
      const dailyReturns = getDailyReturns(data)
      const days = data.length

      // 年化收益 (复利)
      const annualizedReturn = Math.pow(1 + totalReturn, 250 / days) - 1

      // 波动率
      const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
      const variance =
          dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyReturns.length
      const stdDev = Math.sqrt(variance)
      const volatility = stdDev * Math.sqrt(250)

      // 夏普
      const rf = 0.02
      const sharpe = volatility === 0 ? 0 : (annualizedReturn - rf) / volatility

      // 最大回撤
      let maxDd = 0
      let peak = -99999
      for (const val of data) {
          if (val > peak) peak = val
          const dd = (val - peak) / peak
          if (dd < maxDd) maxDd = dd
      }

      const calmar = Math.abs(maxDd) > 0.0001 ? annualizedReturn / Math.abs(maxDd) : 0

      return {
          totalReturn: (totalReturn * 100).toFixed(2),
          annualizedReturn: (annualizedReturn * 100).toFixed(2),
          volatility: (volatility * 100).toFixed(2),
          sharpe: sharpe.toFixed(3),
          maxDrawdown: (maxDd * 100).toFixed(2),
          calmar: calmar.toFixed(3)
      }
  }

  const getDailyReturns = (data: number[]) => {
      const res = []
      for (let i = 1; i < data.length; i++) {
          res.push(data[i] / data[i - 1] - 1)
      }
      return res
  }

  const calculateCorrelation = (x: number[], y: number[]) => {
      const n = x.length
      if (n !== y.length) return 0
      const meanX = x.reduce((a, b) => a + b, 0) / n
      const meanY = y.reduce((a, b) => a + b, 0) / n

      let num = 0
      let denX = 0
      let denY = 0
      for (let i = 0; i < n; i++) {
          const dx = x[i] - meanX
          const dy = y[i] - meanY
          num += dx * dy
          denX += dx * dx
          denY += dy * dy
      }
      return num / Math.sqrt(denX * denY)
  }

  const calculateDrawdownAnalysis = (prices: number[], dates: string[]) => {
      const ddEvents = []
      let peak = prices[0]
      let peakDate = dates[0]

      let currentDdStart = peakDate
      let maxDdInCycle = 0
      let troughDate = peakDate
      let cycleActive = false

      // 设定一个极小的阈值，防止浮点数计算误差导致的 0 被误判
      // 0.0001 代表 0.01%，实际上等于统计所有“非平盘”的回撤
      const THRESHOLD = 0.00001

      for (let i = 1; i < prices.length; i++) {
          const price = prices[i]

          // 创新高（或持平）
          if (price >= peak) {
              // 结算前一次回撤
              // 修改点1：阈值改为 THRESHOLD (接近0)，不再过滤 1% 以下的小回撤
              if (cycleActive && Math.abs(maxDdInCycle) > THRESHOLD) {
                  const startD = new Date(currentDdStart)
                  const troughD = new Date(troughDate)
                  const endD = new Date(dates[i])

                  // 计算天数
                  const ddDays = Math.floor(
                      (troughD.getTime() - startD.getTime()) / (1000 * 3600 * 24)
                  )
                  const fixDays = Math.floor(
                      (endD.getTime() - troughD.getTime()) / (1000 * 3600 * 24)
                  )

                  ddEvents.push({
                      startDate: currentDdStart,
                      troughDate: troughDate,
                      endDate: dates[i],
                      drawdown: (maxDdInCycle * 100).toFixed(2),
                      rawDd: maxDdInCycle,
                      ddDays: ddDays,
                      fixDays: fixDays
                  })
              }
              // 重置状态
              cycleActive = false
              peak = price
              peakDate = dates[i]
              maxDdInCycle = 0
          } else {
              // 处于回撤中
              cycleActive = true
              // 逻辑微调：确保回撤开始日期准确指向峰值日
              if (currentDdStart !== peakDate) {
                  currentDdStart = peakDate
              }

              const dd = (price - peak) / peak
              if (dd < maxDdInCycle) {
                  maxDdInCycle = dd
                  troughDate = dates[i]
              }
          }
      }

      // 处理当前尚未修复的回撤 (Active Drawdown)
      if (cycleActive && Math.abs(maxDdInCycle) > THRESHOLD) {
          const startD = new Date(currentDdStart)
          const troughD = new Date(troughDate)
          const ddDays = Math.floor((troughD.getTime() - startD.getTime()) / (1000 * 3600 * 24))

          ddEvents.push({
              startDate: currentDdStart,
              troughDate: troughDate,
              endDate: '未修复',
              drawdown: (maxDdInCycle * 100).toFixed(2),
              rawDd: maxDdInCycle,
              ddDays: ddDays,
              fixDays: '-'
          })
      }

      // Top 10 列表 (按深度排序)
      const top10 = [...ddEvents].sort((a, b) => a.rawDd - b.rawDd).slice(0, 10)

      // ==========================================================
      // 📊 分布统计 (Distribution)
      // ==========================================================

      // 提取所有回撤事件的绝对深度 (%)
      const eventDepths = ddEvents.map(e => Math.abs(e.rawDd) * 100)

      // 获取历史最大回撤值，用于动态定标尺
      const maxAbsDd = eventDepths.length > 0 ? Math.max(...eventDepths) : 0

      // 动态步长 (Step)
      let step = 2
      if (maxAbsDd > 10 && maxAbsDd <= 30) step = 5
      else if (maxAbsDd > 30) step = 10

      // 定义区间边界 [step, 2*step, 3*step, 4*step]
      const limits = [step, step * 2, step * 3, step * 4]

      // 统计各区间的频次
      const buckets = [0, 0, 0, 0, 0]
      const totalEvents = eventDepths.length || 1

      eventDepths.forEach(val => {
          if (val < limits[0]) buckets[0]++ // 0 ~ Step (例如 0~2%)
          else if (val < limits[1]) buckets[1]++ // Step ~ 2*Step
          else if (val < limits[2]) buckets[2]++
          else if (val < limits[3]) buckets[3]++
          else buckets[4]++
      })

      // 修改点2：第一个区间的 Label 改为 "0% ~ ..."
      const distribution = [
          {
              range: `0% ~ ${limits[0]}%`,
              count: buckets[0],
              percent: (buckets[0] / totalEvents) * 100
          },
          {
              range: `${limits[0]}% ~ ${limits[1]}%`,
              count: buckets[1],
              percent: (buckets[1] / totalEvents) * 100
          },
          {
              range: `${limits[1]}% ~ ${limits[2]}%`,
              count: buckets[2],
              percent: (buckets[2] / totalEvents) * 100
          },
          {
              range: `${limits[2]}% ~ ${limits[3]}%`,
              count: buckets[3],
              percent: (buckets[3] / totalEvents) * 100
          },
          { range: `> ${limits[3]}%`, count: buckets[4], percent: (buckets[4] / totalEvents) * 100 }
      ]

      return { drawdowns: top10, distribution }
  }

  const calculateMonthlyReturns = (prices: number[], dates: string[]) => {
      const monthReturnsMap: Record<string, number> = {}

      let currentMonth = dates[0].slice(0, 7)
      let currentMonthRet = 1.0

      for (let i = 1; i < dates.length; i++) {
          const ret = prices[i] / prices[i - 1]
          const m = dates[i].slice(0, 7)
          if (m !== currentMonth) {
              monthReturnsMap[currentMonth] = (currentMonthRet - 1) * 100
              currentMonth = m
              currentMonthRet = 1.0
          }
          currentMonthRet *= ret
      }
      monthReturnsMap[currentMonth] = (currentMonthRet - 1) * 100

      const yearsObj: Record<number, any> = {}
      Object.keys(monthReturnsMap).forEach(key => {
          const year = parseInt(key.split('-')[0])
          const month = parseInt(key.split('-')[1])
          if (!yearsObj[year]) {
              yearsObj[year] = { year: year, months: new Array(12).fill(null), total: 0 }
          }
          yearsObj[year].months[month - 1] = monthReturnsMap[key].toFixed(2)
      })

      const result = Object.values(yearsObj).sort((a: any, b: any) => b.year - a.year)
      result.forEach((yData: any) => {
          let yRet = 1.0
          yData.months.forEach((m: string | null) => {
              if (m) yRet *= 1 + Number(m) / 100
          })
          yData.total = ((yRet - 1) * 100).toFixed(2)
      })
      return result
  }

  // --- ECharts 图表渲染 ---
  const initChart = () => {
      if (!chartContainer.value || !chartData.value) return
      if (myChart) myChart.dispose()
      myChart = echarts.init(chartContainer.value)

      const { dateList, portfolio, singles } = chartData.value
      const series = []

      // 单策略 (细线)
      const selectedStrats = strategies.value.filter(s => s.selected)
      selectedStrats.forEach(strat => {
          series.push({
              name: strat.name,
              type: 'line',
              data: singles[strat.id],
              symbol: 'none',
              lineStyle: { width: 1, opacity: 0.3 },
              itemStyle: { color: strat.color }
          })
      })

      // 组合 (粗线高亮)
      series.push({
          name: '🧪 组合策略',
          type: 'line',
          data: portfolio,
          symbol: 'none',
          z: 10,
          lineStyle: { width: 3, shadowBlur: 10, shadowColor: THEME_COLOR },
          itemStyle: { color: THEME_COLOR },
          areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: THEME_COLOR + '4D' },
                  { offset: 1, color: THEME_COLOR + '00' }
              ])
          }
      })

      const option = {
          backgroundColor: 'transparent',
          tooltip: {
              trigger: 'axis',
              // 👇 关键：格式化 Tooltip 显示 4 位小数
              formatter: (params: any) => {
                  let res = `<strong>${params[0].name}</strong><br/>`
                  params.forEach((item: any) => {
                      const val = item.value ? Number(item.value).toFixed(4) : '--'
                      res += `${item.marker} ${item.seriesName}: <strong>${val}</strong><br/>`
                  })
                  return res
              }
          },
          legend: {
              data: ['🧪 组合策略', ...selectedStrats.map(s => s.name)],
              textStyle: { color: '#b0c4de' },
              bottom: 0,
              type: 'scroll'
          },
          grid: { top: '10%', left: '2%', right: '3%', bottom: '15%', containLabel: true },
          xAxis: {
              type: 'category',
              data: dateList,
              axisLine: { lineStyle: { color: '#8392A5' } }
          },
          yAxis: {
              type: 'value',
              scale: true,
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
              axisLabel: { color: '#8392A5' }
          },
          series: series
      }

      myChart.setOption(option)
  }

  // 辅助样式函数
  const getValueColor = (val: string | number) =>
      Number(val) >= 0 ? 'highlight-red' : 'highlight-green'
  const getCorrelationStyle = (val: number) => {
      if (val >= 0.99) return { background: 'rgba(255,255,255,0.05)', color: '#fff' }
      if (val > 0) return { background: `rgba(255, 87, 34, ${val * 0.6})`, color: '#fff' }
      return { background: `rgba(0, 196, 151, ${Math.abs(val) * 0.6})`, color: '#fff' }
  }
  const getHeatmapStyle = (value: number | string | null) => {
      if (value === null || value === undefined) return {}
      const num = Number(value)
      if (num === 0) return { backgroundColor: 'transparent' }
      if (num > 0) {
          const opacity = Math.min(Math.abs(num) / 10, 1)
          return {
              backgroundColor: `rgba(255, 87, 34, ${0.15 + opacity * 0.7})`,
              color: '#fff',
              fontWeight: num > 5 ? 'bold' : 'normal'
          }
      } else {
          const opacity = Math.min(Math.abs(num) / 10, 1)
          return {
              backgroundColor: `rgba(0, 196, 151, ${0.15 + opacity * 0.7})`,
              color: '#fff',
              fontWeight: num < -5 ? 'bold' : 'normal'
          }
      }
  }
</script>

<style scoped>
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
      background: radial-gradient(circle at 20% 50%, #1e1b4b, transparent 40%),
          radial-gradient(circle at 80% 20%, #312e81, transparent 40%), #121212;
      overflow-x: hidden;
  }

  .main-container {
      max-width: 1100px;
      margin: 0 auto;
  }

  /* 头部 */
  .page-header {
      text-align: center;
      margin-bottom: 2rem;
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
      color: var(--theme-color);
  }
  .main-title {
      font-size: 2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.8rem;
      margin-bottom: 0.5rem;
  }
  .title-icon {
      text-shadow: 0 0 15px var(--theme-color);
  }
  .subtitle {
      color: #b0c4de;
      font-size: 0.9rem;
      max-width: 800px;
      margin: 0 auto;
  }

  /* 卡片通用 */
  .content-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      margin-bottom: 1.5rem;
      animation: fadeInUp 0.5s ease-out forwards;
      transition: border-color 0.3s;
  }
  .content-card:hover {
      border-color: var(--theme-shadow);
  }
  .full-height {
      height: 100%;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
  }

  .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.8rem;
  }
  .card-title {
      margin: 0;
      font-size: 1.2rem;
      border-left: 4px solid var(--theme-color);
      padding-left: 0.8rem;
  }
  .card-description {
      color: #b0c4de;
      font-size: 0.85rem;
      margin-bottom: 1rem;
  }

  /* 配置区 */
  .weight-indicator {
      font-weight: bold;
      color: #00c497;
      font-size: 0.95rem;
  }
  .weight-indicator.warning {
      color: #ff5722;
  }
  .config-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
  }
  .strategy-inputs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
  }
  .input-row {
      display: flex;
      align-items: center;
      gap: 1rem;
  }
  .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 100px;
      cursor: pointer;
      font-size: 0.9rem;
  }
  .checkbox-label input[type='checkbox'] {
      accent-color: var(--theme-color);
      width: 16px;
      height: 16px;
  }
  .slider-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.8rem;
  }
  .slider-container.disabled {
      opacity: 0.3;
      pointer-events: none;
  }
  input[type='range'] {
      flex: 1;
      accent-color: var(--theme-color);
  }
  .number-input-wrapper {
      position: relative;
      width: 60px;
  }
  .number-input-wrapper input {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 4px;
      border-radius: 4px;
      text-align: center;
      font-size: 0.9rem;
  }
  .number-input-wrapper .unit {
      position: absolute;
      right: 0px;
      top: 7px;
      color: #888;
      font-size: 0.7rem;
  }

  /* 操作区 */
  .action-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px dashed rgba(255, 255, 255, 0.1);
      padding-top: 1.2rem;
      gap: 1rem;
  }
  .date-picker-group label {
      display: block;
      font-size: 0.85rem;
      color: #b0c4de;
      margin-bottom: 0.5rem;
  }
  .date-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
  }
  .cyber-input {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--theme-color);
      color: #fff;
      padding: 0.5rem 0.6rem;
      border-radius: 6px;
      outline: none;
      font-family: inherit;
      color-scheme: dark;
      font-size: 0.9rem;
  }
  .run-btn {
      background: var(--theme-color);
      color: #fff;
      border: none;
      padding: 0.6rem 1.5rem;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 0 10px var(--theme-shadow);
      transition: all 0.3s;
      white-space: nowrap;
  }
  .run-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 0 20px var(--theme-shadow);
  }
  .run-btn:disabled {
      background: #444;
      box-shadow: none;
      cursor: not-allowed;
      opacity: 0.7;
  }

  /* ECharts */
  .echart-container {
      width: 100%;
      height: 320px;
  }

  /* === 表格通用样式 === */
  .table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
  }
  .table-container::-webkit-scrollbar {
      height: 6px;
  }
  .table-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
  }

  table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      /* min-width: 600px; */
  }
  th {
      background: rgba(0, 0, 0, 0.3);
      color: #b0c4de;
      padding: 0.8rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-weight: normal;
      white-space: nowrap;
  }
  td {
      padding: 0.8rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap;
  }

  /* 固定列样式 */
  .sticky-col {
      position: sticky;
      left: 0;
      z-index: 2;
      background: #1e1e1e;
      border-right: 1px solid rgba(255, 255, 255, 0.2);
  }
  .sticky-col-header {
      position: sticky;
      left: 0;
      z-index: 3;
      background: #252525;
  }
  .highlight-row .sticky-col {
      background: #2c2a4a;
  }
  .row-header {
      font-weight: bold;
      text-align: center;
  }

  .highlight-row {
      background: rgba(99, 102, 241, 0.1);
      font-weight: bold;
  }
  .highlight-red {
      color: #ff5722;
      font-weight: bold;
  }
  .highlight-green {
      color: #00c497;
      font-weight: bold;
  }
  .negative {
      color: #00c497;
      font-weight: bold;
  }

  /* === 热力图表格样式 === */
  .heatmap-table th {
      font-size: 0.85rem;
      padding: 0.6rem 0.2rem;
      min-width: 40px;
  }
  .heatmap-table td {
      padding: 0.6rem 0.2rem;
      font-size: 0.85rem;
  }
  .year-cell {
      font-weight: bold;
      color: #b0c4de;
  }
  .year-total-cell {
      font-weight: bold;
      border-left: 2px solid rgba(255, 255, 255, 0.2);
  }

  /* 双栏布局 */
  .grid-two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
  }
  /* 关键修复：防止Grid/Flex子项撑破容器 */
  .grid-two-col > * {
      min-width: 0;
  }

  /* 回撤分布图 */
  .drawdown-dist-chart {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-top: 0.5rem;
  }
  .dist-row {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
  }
  .dist-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #b0c4de;
  }
  .dist-bar-bg {
      width: 100%;
      height: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 5px;
      overflow: hidden;
  }
  .dist-bar {
      height: 100%;
      border-radius: 5px;
      background: linear-gradient(90deg, var(--theme-color), #a5b4fc);
      min-width: 4px;
  }
  select.cyber-input {
      appearance: none; /* 移除浏览器默认样式 */
      -webkit-appearance: none;
      -moz-appearance: none;
      cursor: pointer;
      padding-right: 2rem; /* 给右侧箭头留位置 */

      /* 自定义下拉箭头 (使用 SVG 编码) */
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b0c4de' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
      background-size: 1rem;
      line-height: 1.2;
  }

  select.cyber-input:hover {
      border-color: var(--theme-color);
  }

  select.cyber-input option {
      background-color: #1e1e2e; /* 下拉选项背景色 */
      color: #fff;
  }

  /* ============================================
                                                                                                                                     📱 移动端适配 (Media Queries)
                                                                                                                                     ============================================ */
  @media (max-width: 768px) {
      .page-wrapper {
          padding: 1.5rem 0.8rem;
          overflow-x: hidden;
      }
      .main-title {
          font-size: 1.6rem;
      }

      .strategy-inputs {
          grid-template-columns: 1fr;
          gap: 1.2rem;
      }
      .action-area {
          flex-direction: column;
          align-items: stretch;
      }
      .date-inputs {
          justify-content: space-between;
      }
      .cyber-input {
          flex: 1;
      }
      .run-btn {
          width: 100%;
          margin-top: 0.5rem;
      }

      .grid-two-col {
          grid-template-columns: 1fr;
          gap: 1rem;
      }
      /* 双重保险 */
      .grid-two-col > * {
          min-width: 0;
      }

      .content-card {
          padding: 1rem;
          margin-bottom: 1rem;
      }

      table {
          font-size: 0.8rem;
          min-width: auto;
      }

      .correlation-table th,
      .correlation-table td,
      .heatmap-table th,
      .heatmap-table td {
          padding: 0.4rem 0.2rem;
          font-size: 0.75rem;
          border-color: #373333;
          text-align: center;
      }
  }
  /* === 蒙特卡洛卡片样式 === */

  /* 标题栏布局 */
  .title-with-tooltip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative; /* 所有的tooltip定位参考点 */
  }

  /* 交互式Icon */
  .info-icon-wrapper {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
  }
  .info-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1px solid #b0c4de;
      color: #b0c4de;
      font-size: 10px;
      font-weight: bold;
      transition: all 0.3s;
  }
  .info-icon:hover,
  .info-icon-wrapper:hover .info-icon {
      border-color: var(--theme-color);
      color: var(--theme-color);
      box-shadow: 0 0 5px var(--theme-shadow);
  }

  /* Tooltip 弹窗 */
  .tooltip-box {
      position: absolute;
      top: 25px;
      left: 0;
      width: 280px;
      background: rgba(30, 30, 40, 0.95);
      border: 1px solid var(--theme-color);
      border-radius: 8px;
      padding: 1rem;
      z-index: 100;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      font-size: 0.85rem;
      line-height: 1.5;
      color: #e0e0e0;
  }
  .tooltip-title {
      color: var(--theme-color);
      font-weight: bold;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
  }
  .tooltip-list {
      margin: 0.5rem 0 0 1.2rem;
      padding: 0;
      font-size: 0.8rem;
      color: #b0c4de;
  }
  .tooltip-list li {
      margin-bottom: 0.3rem;
  }

  /* 过渡动画 */
  .fade-enter-active,
  .fade-leave-active {
      transition: opacity 0.3s, transform 0.3s;
  }
  .fade-enter-from,
  .fade-leave-to {
      opacity: 0;
      transform: translateY(-5px);
  }

  /* 年份选择器 */
  .year-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #b0c4de;
  }
  .cyber-select {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 0.3rem 0.5rem;
      border-radius: 4px;
      outline: none;
      font-family: inherit;
      cursor: pointer;
  }
  .cyber-select:hover {
      border-color: var(--theme-color);
  }

  /* 布局：左图右数据 */
  .mc-layout {
      margin-top: 1.5rem;
      align-items: center; /* 垂直居中 */
  }
  .mc-chart {
      height: 300px;
      width: 100%;
  }

  /* 统计数据块 */
  .mc-stats {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      justify-content: center;
      height: 100%;
  }
  .stat-box {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      padding: 1rem;
      border-left: 4px solid #555;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
  }
  .stat-box::after {
      content: '';
      position: absolute;
      right: -10px;
      top: -10px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      opacity: 0.1;
  }

  .stat-box.optimistic {
      border-color: #00c497;
  }
  .stat-box.optimistic::after {
      background: #00c497;
  }

  .stat-box.median {
      border-color: #ffffff;
  }
  .stat-box.median::after {
      background: #ffffff;
  }

  .stat-box.pessimistic {
      border-color: #ff5722;
  }
  .stat-box.pessimistic::after {
      background: #ff5722;
  }

  .stat-box .label {
      font-size: 0.8rem;
      color: #b0c4de;
      margin-bottom: 0.2rem;
  }
  .stat-box .value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #fff;
  }
  .stat-box .value.negative {
      color: #ff5722;
  }
  .stat-box .sub {
      font-size: 0.75rem;
      color: #666;
      margin-top: 0.2rem;
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
      .tooltip-box {
          width: 250px;
          left: -10px; /* 防止溢出屏幕 */
      }
      .mc-layout {
          grid-template-columns: 1fr; /* 强制单列 */
          gap: 1.5rem;
      }
      .mc-stats {
          flex-direction: row; /* 移动端改为横向排列，如果放不下会自动换行吗？最好是用grid */
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
      }
      .stat-box {
          padding: 0.5rem;
          align-items: center;
          text-align: center;
      }
      .stat-box .label {
          font-size: 0.7rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
      }
      .stat-box .value {
          font-size: 1.1rem;
      }
      .card-header-row {
          flex-wrap: wrap; /* 允许标题和选择器换行 */
          gap: 0.8rem;
      }
      .year-selector {
          width: 100%;
          justify-content: space-between;
      }
      .title-with-tooltip {
          position: static; /* 移除相对定位基准，允许子元素相对于视口定位 */
      }

      .tooltip-box {
          position: fixed; /* 强制固定在屏幕上 */
          top: 38%; /* 垂直居中 */
          left: 50%; /* 水平居中 */
          transform: translate(-50%, -50%); /* 修正偏移 */
          width: 85vw; /* 宽度占屏幕85% */
          max-width: 350px;
          background: rgba(25, 25, 35, 0.98); /* 背景加深，防止透视干扰 */
          border: 1px solid var(--theme-color);
          box-shadow: 0 0 50px rgba(0, 0, 0, 0.8); /* 增加阴影强调层级 */
          z-index: 9999; /* 确保在最上层 */
      }

      /* 可选：给弹窗加一个关闭提示，优化体验 */
      .tooltip-box::after {
          content: '(点击再次关闭)';
          display: block;
          text-align: center;
          font-size: 0.7rem;
          color: #666;
          margin-top: 1rem;
      }
  }
</style>