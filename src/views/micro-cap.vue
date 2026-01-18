<template>
  <div class="page-wrapper">
    <div class="main-container">

      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>
        <h1 class="main-title">
          <span class="title-icon">💎</span>
          微盘股策略
        </h1>
        <p class="subtitle">
          用量化纪律追踪指数，捕捉市场深处的规模因子。
        </p>
      </div>

      <div class="content-grid">

        <div class="content-card risk-warning-card">
          <h2 class="card-title">极端风险警告</h2>
          <p class="card-description">
            微盘股策略是所有策略中风险等级最高的。该策略所追踪的指数成分股普遍规模小、基本面不确定性强，导致整体波动极为剧烈，可能在短期内出现超过50%甚至更多的净值回撤。
            同时，成分股的流动性风险可能传导至策略本身。<strong>本策略只适合风险承受能力极强的投资者，且投入资金必须是完全可以承受损失的闲钱。</strong>
          </p>
        </div>

        <div class="content-card">
          <h2 class="card-title">组合思想：量化追踪，纪律执行</h2>
          <p class="card-description">
            本策略并非主动挖掘个股，而是通过量化模型紧密追踪<b>万得微盘股指数</b>，旨在系统性地捕获A股市场的“规模因子”溢价。
          </p>
          <ul class="idea-list">
            <li><b>规模因子溢价：</b> 学术与历史数据均表明，长期来看，小市值公司的整体回报率倾向于超越大市值公司。本策略的目标正是捕获这种由“规模”这一因子本身带来的系统性超额收益。</li>
            <li><b>每周动态再平衡：</b> 模型于<b>每周一</b>进行调仓。这种再平衡机制，确保了策略能紧密跟随指数的成分变化，并及时捕捉市场动量，是策略获取阿尔法收益的关键环节。</li>
            <li><b>作为“卫星”配置：</b> 鉴于微盘股的高波动特性，它适合作为投资组合中的“卫星”部分，用以增强整体收益弹性。建议配置比例不超过总投资资产的20%，并做好长期持有的准备。</li>
          </ul>
        </div>
        <div class="content-card">
          <h2 class="card-title">最新持仓与调仓建议</h2>
          <p class="card-description">
            根据模型于 {{ formattedDate }} 生成的最新组合。
          </p>
          <div class="calculator-toolbar">
            <div class="calc-left">
              <div class="input-wrapper">
                <span class="currency-symbol">¥</span>
                <input type="number" v-model="inputAmount" class="compact-input" placeholder="计划投入金额" @keyup.enter="handleCalculate" />
              </div>
              <button class="calc-btn-compact" @click="handleCalculate">
                计算
              </button>
            </div>

            <div v-if="hasCalculated" class="calc-summary-inline">
              <div class="summary-tag">
                <span class="label">计划买入</span>
                <span class="value highlight">{{ calcSummary.totalPlanned.toFixed(0) }}</span>
              </div>
              <div class="summary-tag">
                <span class="label">利用率</span>
                <span class="value" :class="{'warn': parseFloat(calcSummary.utilization) < 95}">
                  {{ calcSummary.utilization }}
                </span>
              </div>
              <div class="summary-tag">
                <span class="label">结余</span>
                <span class="value">{{ (Number(inputAmount) - calcSummary.totalPlanned).toFixed(0) }}</span>
              </div>
            </div>
          </div>

          <h3 class="card-subtitle">核心持仓展示 (10只)</h3>
          <div class="table-wrapper">
            <table class="data-table portfolio-table">
              <thead>
                <tr>
                  <th>代码</th>
                  <th>名称</th>
                  <th>现价</th>
                  <th v-if="hasCalculated" class="calc-col-head">建议手数</th>
                  <th v-if="hasCalculated" class="calc-col-head">计划金额</th>
                  <th v-if="hasCalculated" class="calc-col-head">占比</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in latestPortfolio" :key="item.code">
                  <td class="code-font">{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.price.toFixed(2) }}</td>

                  <template v-if="hasCalculated">
                    <td class="calc-col-cell">
                      <span class="calc-val">{{ allocationData.get(item.code)?.shares || 0 }}</span>
                    </td>
                    <td class="calc-col-cell">
                      <span class="calc-val">{{ allocationData.get(item.code)?.cost.toFixed(0) || 0 }}</span>
                    </td>
                    <td class="calc-col-cell">
                      <span class="calc-val">{{ allocationData.get(item.code)?.weight || '0%' }}</span>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 class="card-subtitle" style="margin-top: 2rem;">组合调仓指引</h3>
          <div class="adjustments-grid">
            <div class="adjustment-block">
              <h4 class="adjustment-title sell">⬇️ 建议调出</h4>
              <ul class="adjustment-list">
                <li v-for="item in sellList" :key="item.code" class="adjustment-item">
                  <span>{{ item.name }} ({{ item.code }})</span>
                  <span class="action-badge sell">卖出</span>
                </li>
                <li v-if="sellList.length == 0" class="adjustment-item-empty">今日无调出建议</li>
              </ul>
            </div>
            <div class="adjustment-block">
              <h4 class="adjustment-title buy">⬆️ 建议调入</h4>
              <ul class="adjustment-list">
                <li v-for="item in buyList" :key="item.code" class="adjustment-item">
                  <span>{{ item.name }} ({{ item.code }})</span>
                  <span class="action-badge buy">买入</span>
                </li>
                <li v-if="buyList.length === 0" class="adjustment-item-empty">今日无调入建议</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="content-card">
          <div class="card-header-row">
            <h2 class="card-title no-margin">微盘股策略 vs 沪深300全收益</h2>
            <span class="period-badge">回测周期: 2013-01-04 至 2025-12-31</span>
          </div>

          <div ref="chartContainer" class="echart-container"></div>

          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-label">总收益</div>
              <div class="stat-value highlight">45555.11%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">年化收益</div>
              <div class="stat-value">60.10%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">波动率</div>
              <div class="stat-value">29.02%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">夏普比率</div>
              <div class="stat-value">2.002</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最大回撤</div>
              <div class="stat-value negative">-50.92%</div>
            </div>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">策略月度/年度收益表</h2>
          <div class="table-container heatmap-container">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th>年份</th>
                  <th v-for="m in 12" :key="m">{{ m }}月</th>
                  <th>年度</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="yearData in monthlyReturns" :key="yearData.year">
                  <td class="year-col">{{ yearData.year }}</td>
                  <td v-for="(val, idx) in yearData.months" :key="idx" :style="getHeatmapStyle(val)" class="cell-val">
                    {{ val !== null ? val + '%' : '' }}
                  </td>
                  <td class="year-total" :style="getHeatmapStyle(yearData.total)">
                    {{ yearData.total }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">深度风险分析</h2>

          <div class="risk-summary-grid">
            <div class="risk-box">
              <div class="risk-label">卡玛比率 (Calmar)</div>
              <div class="risk-main-val">1.180</div>
              <div class="risk-sub-val">年化收益 / 最大回撤</div>
            </div>
            <div class="risk-box">
              <div class="risk-label"> 月度胜率: 63.5%</div>
              <div class="risk-main-val">99 / 156</div>
              <div class="risk-sub-val">盈利月数 / 总月数</div>
            </div>
            <div class="risk-box">
              <div class="risk-label">盈亏比</div>
              <div class="risk-main-val">0.927</div>
              <div class="risk-sub-val">日均盈利 / 日均亏损</div>
            </div>
          </div>

          <h3 class="card-subtitle no-border">回撤深度分布 (频率统计)</h3>
          <div class="table-container dist-table-container">
            <div class="dist-table-inner">
              <div class="dist-header-row">
                <div class="dist-col" v-for="item in drawdownDist" :key="item.range">{{ item.range }}</div>
              </div>
              <div class="dist-bar-row">
                <div class="dist-col" v-for="item in drawdownDist" :key="item.range">
                  <div class="dist-block yellow-theme" :style="{ opacity: item.count > 0 ? 1 : 0.6 }">
                    {{ item.count }}
                  </div>
                </div>
              </div>
              <div class="dist-label-row">
                <div class="dist-col">次数</div>
              </div>
            </div>
          </div>

          <h3 class="card-subtitle no-border" style="margin-top: 2rem;">历史重大回撤明细 (Top 10)</h3>
          <div class="table-wrapper">
            <table class="data-table risk-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>开始日期</th>
                  <th>谷底日期</th>
                  <th>恢复日期</th>
                  <th>最大回撤</th>
                  <th>回撤期(天)</th>
                  <th>修复期(天)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in topDrawdowns" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.start }}</td>
                  <td>{{ item.trough }}</td>
                  <td>{{ item.end }}</td>
                  <td class="negative">{{ item.maxDd }}%</td>
                  <td>{{ item.ddDays }}</td>
                  <td>{{ item.recDays }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">常见问题 (FAQ)</h2>
          <div class="faq-container">
            <div v-for="(item, index) in faqList" :key="index" class="faq-item">
              <button class="faq-question" @click="toggleFaq(index)">
                <span>{{ item.question }}</span>
                <span :class="['faq-icon', { 'is-open': openFaqIndex === index }]">+</span>
              </button>
              <div v-if="openFaqIndex === index" class="faq-answer">
                <p style="white-space: pre-line;">{{ item.answer }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, nextTick } from 'vue'
  import * as echarts from 'echarts'
  // 引入云开发 SDK (请确保路径与您项目一致，通常是 @/lib/cloudbase 或类似的)
  import app from '@/lib/cloudbase'
  import axios from 'axios'
  const showMessage: any = inject('showMessage')
  const hasCalculated = ref(false) // 新增开关

  // --- 新增：资金分配计算器逻辑 ---
  const inputAmount = ref<number | null>(null) // 用户输入的金额
  const allocationData = ref<Map<string, any>>(new Map()) // 存储计算结果 Key: stockCode
  const calcSummary = ref({
      totalPlanned: 0,
      utilization: '0.00%',
      msg: ''
  })

  // 计算最小起投门槛 (最高价股票的1手 * 10)
  const minThreshold = computed(() => {
      if (!latestPortfolio.value || latestPortfolio.value.length === 0) return 0
      const maxPrice = Math.max(...latestPortfolio.value.map((s: any) => s.price))
      return Math.ceil(maxPrice * 100 * 10)
  })

  // 执行计算 (完全复刻您的算法)
  const handleCalculate = () => {
      const stocks = latestPortfolio.value
      const totalFunds = Number(inputAmount.value)

      // 1. 基础校验
      if (!totalFunds || totalFunds <= 0) {
          showMessage('请输入有效的投资金额！', 'error')
          return
      }
      if (totalFunds < minThreshold.value) {
          showMessage(
              `资金量过小，无法有效进行等权配置。\n当前策略建议最低起投金额为：${minThreshold.value}元\n(基于最高价股1手价格的10倍计算)`,
              'error'
          )
          return
      }

      // 2. 算法初始化
      // 假设资金利用率为 100% (或者您可以像原代码那样设置一个比例，这里默认全额利用)
      const fundsForAllocation = totalFunds
      let remainingFunds = fundsForAllocation
      const tempMap = new Map()
      let totalAllocated = 0

      // 3. 循环计算 (瀑布流分配)
      for (let i = 0; i < stocks.length; i++) {
          const stock = stocks[i]
          const currentPrice = stock.price // 注意：您原代码是 sp，这里适配为 price

          if (!currentPrice || currentPrice <= 0) continue

          const remainingStocksCount = stocks.length - i
          // 核心逻辑：剩余资金 / 剩余股票数
          const idealInvestmentPerStock = remainingFunds / remainingStocksCount
          const idealShares = idealInvestmentPerStock / currentPrice

          // 四舍五入到整百
          let sharesToBuy = Math.round(idealShares / 100) * 100

          // 兜底逻辑：如果计算出0手，强制给1手 (前提是资金足够，下面会校验)
          if (sharesToBuy === 0) sharesToBuy = 100

          let actualCost = sharesToBuy * currentPrice

          // 资金不足时的回退逻辑 (减少手数直到买得起)
          while (actualCost > remainingFunds && sharesToBuy > 0) {
              sharesToBuy -= 100
              actualCost = sharesToBuy * currentPrice
          }

          // 记录结果
          if (sharesToBuy > 0) {
              remainingFunds -= actualCost
              totalAllocated += actualCost

              const actualWeight = actualCost / fundsForAllocation

              tempMap.set(stock.code, {
                  shares: sharesToBuy,
                  cost: actualCost,
                  weight: (actualWeight * 100).toFixed(2) + '%'
              })
          } else {
              // 极端情况买不起
              tempMap.set(stock.code, { shares: 0, cost: 0, weight: '0%' })
          }
      }

      // 4. 更新状态
      allocationData.value = tempMap
      calcSummary.value = {
          totalPlanned: totalAllocated,
          utilization: ((totalAllocated / fundsForAllocation) * 100).toFixed(2) + '%',
          msg: '计算完成'
      }
      hasCalculated.value = true
  }

  // ... (保留原有的 fetchStrategyData, chart 等逻辑)
  // --- 1. 基础数据 ---
  const formattedDate = ref('加载中...')
  const isLoading = ref(true)

  // --- 2. 持仓与调仓数据 ---
  const latestPortfolio: any = ref([]) // 核心持仓
  const sellList: any = ref([]) // 建议卖出
  const buyList: any = ref([]) // 建议买入

  // --- 3. 获取云端数据函数 ---
  const fetchStrategyData = async () => {
      try {
          const res = await app.callFunction({
              name: 'getMicroCapData10' // 刚才创建的云函数名称
          })

          if (res.result.success && res.result.data) {
              const data = res.result.data

              // 1. 更新日期
              formattedDate.value = data.updated_at

              // 2. 更新持仓列表 (数据库字段 ranking -> 前端 latestPortfolio)
              latestPortfolio.value = data.ranking || []

              // 3. 更新调仓建议 (数据库字段 adjustments -> 拆分为 buy/sell)
              const adj = data.adjustments || []

              // 过滤出买入 (action: 'buy')
              buyList.value = adj
                  .filter((item: any) => item.action === 'buy')
                  .map((item: any) => ({
                      code: item.code,
                      name: item.name,
                      action: '买入' // 用于前端显示文字
                  }))

              // 过滤出卖出 (action: 'sell')
              sellList.value = adj
                  .filter((item: any) => item.action === 'sell')
                  .map((item: any) => ({
                      code: item.code,
                      name: item.name,
                      action: '卖出' // 用于前端显示文字
                  }))
          } else {
              console.warn('未获取到有效数据:', res.result.msg)
              formattedDate.value = '暂无数据'
          }
      } catch (err) {
          console.error('云函数调用失败', err)
          formattedDate.value = '数据加载失败'
      } finally {
          isLoading.value = false
      }
  }

  // --- 4. 图表逻辑 (保持原样，也可以后续换成真实数据) ---
  const chartContainer = ref<HTMLElement | null>(null)
  let myChart: echarts.ECharts | null = null

  const initChart = (dates: any, strategyData: any, benchmarkData: any) => {
      if (!chartContainer.value) return
      myChart = echarts.init(chartContainer.value)

      const option = {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis' },
          grid: { top: '15%', left: '3%', right: '4%', bottom: '10%', containLabel: true },
          legend: { data: ['微盘股策略', '沪深300'], textStyle: { color: '#b0c4de' }, top: 0 },
          xAxis: {
              type: 'category',
              data: dates,
              axisLine: { lineStyle: { color: '#8392A5' } },
              axisLabel: { show: false }
          },
          yAxis: {
              type: 'value',
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
              axisLabel: { color: '#8392A5' },
              scale: true
          },
          series: [
              {
                  name: '微盘股策略',
                  type: 'line',
                  data: strategyData,
                  itemStyle: { color: '#f0e68c' },
                  showSymbol: false,
                  lineStyle: { width: 2 }
              },
              {
                  name: '沪深300',
                  type: 'line',
                  data: benchmarkData,
                  itemStyle: { color: '#5470c6' },
                  showSymbol: false,
                  lineStyle: { width: 1, type: 'dashed' },
                  areaStyle: { opacity: 0.1, color: '#5470c6' }
              }
          ]
      }
      myChart.setOption(option)
  }

  // --- 5. 热力图与辅助数据 (保持原样) ---
  const monthlyReturns = ref([
      {
          year: 2025,
          months: [-0.1, 12.9, -1.8, 0.4, 10.3, 10.3, 7.7, 1.2, 5.5, 7.7, 5.1, -2.3],
          total: 72.1
      },
      {
          year: 2024,
          months: [0.2, -4.9, 17.1, 0.3, 1.5, -11, 10.6, 4.7, 26, 15.6, 12.4, -9.7],
          total: 73.1
      },
      {
          year: 2023,
          months: [0, 5, -4.1, 0.1, 4.2, 5.9, 10.5, 1.6, 3.4, 2.5, 6.9, 1.8],
          total: 44.1
      },
      {
          year: 2022,
          months: [0, 9.2, 5.6, -0.7, 13.3, 6.2, 10.1, 2.9, -6.1, 5.2, 12.2, -5.2],
          total: 63.9
      },
      {
          year: 2021,
          months: [0.2, 9.5, 8.8, -0.2, 10.5, 5.3, -1.3, 8.9, 0, -2.9, 12.7, 8.7],
          total: 77.2
      },
      {
          year: 2020,
          months: [0.2, 15.3, 3.8, -0.5, 3.3, 2.7, 11.2, 8.6, -3.6, 0.2, 5.9, -7.9],
          total: 44.2
      },
      {
          year: 2019,
          months: [0, 23.1, 13.5, 0.6, 6.4, 5, 1.8, -2.5, 3.3, 3, -2.9, 9],
          total: 75.6
      },
      {
          year: 2018,
          months: [0, -7.3, 13.6, -0.1, 2, -12.8, 6, -6.7, 2.2, -1.6, 13.3, -3.5],
          total: 1.8
      },
      {
          year: 2017,
          months: [0.2, 4.6, -6.3, -0.3, -7.6, 2.5, -7.5, 12.6, 0.5, 0.1, -6.9, -2.8],
          total: -12.1
      },
      {
          year: 2016,
          months: [-1.5, 1.8, 29, -0.2, -1.2, 7.2, -1.9, 8.7, 6.4, 4.3, 6.4, 4.2],
          total: 79.5
      },
      {
          year: 2015,
          months: [0.2, 8.3, 27.7, 0, 44.2, -2, -15.2, -5.8, 1.8, 29.9, 23.9, 20.9],
          total: 209.6
      },
      {
          year: 2014,
          months: [-0.5, 6.7, 1.8, -0.4, 5.4, 9.6, 12.6, 11.6, 20.8, 2, 5.8, -13.2],
          total: 76.8
      },
      {
          year: 2013,
          months: [0.3, 7.1, -3.8, -0.3, 19.1, -12.8, 14.3, 11.1, 6.8, 0.2, 14.2, -1.1],
          total: 64.1
      }
  ])

  const getHeatmapStyle = (value: number | null) => {
      if (value === null || value === undefined) return {}
      if (value === 0) return { backgroundColor: 'transparent' }
      if (value > 0) {
          const opacity = Math.min(Math.abs(value) / 15, 1)
          return {
              backgroundColor: `rgba(255, 87, 34, ${0.2 + opacity * 0.8})`,
              color: '#fff',
              fontWeight: value > 10 ? 'bold' : 'normal'
          }
      } else {
          const opacity = Math.min(Math.abs(value) / 15, 1)
          return {
              backgroundColor: `rgba(0, 196, 151, ${0.2 + opacity * 0.8})`,
              color: '#fff',
              fontWeight: value < -10 ? 'bold' : 'normal'
          }
      }
  }

  const getValueColorClass = (val: number) => {
      if (val > 0) return 'text-red'
      if (val < 0) return 'text-green'
      return ''
  }

  // --- FAQ & 风险数据 (保持不变) ---
  const drawdownDist = ref([
      { range: '0%~10%', count: 193 },
      { range: '10%~20%', count: 11 },
      { range: '20%~30%', count: 1 },
      { range: '30%~40%', count: 2 },
      { range: '40%~50%', count: 0 },
      { range: '>50%', count: 1 }
  ])
  const topDrawdowns = ref([
      {
          start: '2015-06-12',
          trough: '2015-07-08',
          end: '2015-11-24',
          maxDd: -50.9,
          ddDays: 26,
          recDays: 139
      },
      {
          start: '2017-03-20',
          trough: '2018-10-18',
          end: '2019-02-25',
          maxDd: -33.9,
          ddDays: 577,
          recDays: 130
      },
      {
          start: '2024-01-31',
          trough: '2024-02-07',
          end: '2024-02-27',
          maxDd: -33.7,
          ddDays: 7,
          recDays: 20
      },
      {
          start: '2024-05-17',
          trough: '2024-06-06',
          end: '2024-09-24',
          maxDd: -21.2,
          ddDays: 20,
          recDays: 110
      },
      {
          start: '2024-12-12',
          trough: '2025-01-02',
          end: '2025-03-18',
          maxDd: -18.1,
          ddDays: 21,
          recDays: 75
      },
      {
          start: '2020-09-08',
          trough: '2021-02-08',
          end: '2021-03-01',
          maxDd: -17.1,
          ddDays: 153,
          recDays: 21
      },
      {
          start: '2016-02-24',
          trough: '2016-02-29',
          end: '2016-03-18',
          maxDd: -15.5,
          ddDays: 5,
          recDays: 18
      },
      {
          start: '2014-11-28',
          trough: '2014-12-23',
          end: '2015-03-09',
          maxDd: -14.9,
          ddDays: 25,
          recDays: 76
      },
      {
          start: '2016-05-05',
          trough: '2016-05-18',
          end: '2016-06-28',
          maxDd: -14.4,
          ddDays: 13,
          recDays: 41
      },
      {
          start: '2013-05-30',
          trough: '2013-06-25',
          end: '2013-08-01',
          maxDd: -13.2,
          ddDays: 26,
          recDays: 37
      }
  ])
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
  const faqList = ref([
      {
          question: '我如何参与该策略？',
          answer: '本策略精选沪深主板10只小市值个股，无科创/创业板门槛，但请务必认知其高波动风险。首次建仓建议在周一上午9:30进行；后续请严格跟随信号，务必在周一9:30第一时间完成调仓，以减少因股价快速波动带来的滑点损耗。'
      },
      {
          question: '10支股票我应该如何分配资金？',
          answer: '建议严格采取“等权配置”原则。无论上周个股涨跌如何，在每次调仓完成后，请务必通过买卖操作，将这10只股票的持仓市值调整至大致相等，即每只股票各占策略总仓位的10%。这种定期的“再平衡”有助于被动实现高抛低吸，维持组合风险均衡。'
      },
      {
          question: '为何回测中1月和4月的收益表现特殊？',
          answer: '这是策略主动规避微盘股“日历效应”的结果。1月面临年关流动性收紧，4月存在财报季暴雷风险，因此模型设定了空仓避险机制。表格中的微小数值是月初清仓瞬间产生的波动，实盘操作中建议投资者根据情况灵活提前空仓观望。'
      },
      {
          question: '我应该配置多少比例？',
          answer: '微盘股属于高风险、高弹性的进攻型策略，旨在博取Alpha超额收益。但该策略对流动性极其敏感，若遇市场黑天鹅或资金面收紧，净值波动将显著放大。因此，建议将其作为投资组合中的“卫星资产”，配置比例严格控制在20%以内，以平衡整体风险。'
      }
  ])

  const getlocalData = () => {
      axios.get('./static/microCapData.json').then(res => {
          const data = res.data
          initChart(data.dateList, data.strategyData, data.hs300)
      })
  }
  getlocalData()

  // --- 生命周期 ---
  onMounted(() => {
      fetchStrategyData() // 1. 获取真实数据
      nextTick(() => {
          // 2. 初始化图表
          window.addEventListener('resize', () => myChart?.resize())
      })
  })
</script>

<style scoped>
  /* =========================================
                                                                  全局与基础样式 (Theme: #f0e68c / Khaki)
                                                                  ========================================= */
  :global(body),
  :global(html) {
      overflow-x: hidden;
      margin: 0;
      padding: 0;
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
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      /* 微盘股主题色背景渐变 */
      background: radial-gradient(circle at 15% 50%, #4a4a2a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a4a2a, transparent 40%), #121212;
  }

  .main-container {
      max-width: 900px;
      margin: 0 auto;
  }

  /* 页面头部 */
  .page-header {
      text-align: center;
      margin-bottom: 3rem;
      animation: fadeInUp 0.5s ease-out forwards;
  }

  .back-button {
      color: #b0c4de;
      text-decoration: none;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      display: inline-block;
  }

  .back-button:hover {
      color: #f0e68c;
  }

  .main-title {
      font-size: 2.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
  }

  .title-icon {
      font-size: 2.8rem;
      color: #f0e68c;
      text-shadow: 0 0 15px #f0e68c;
  }

  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  /* 内容卡片 */
  .content-grid {
      display: grid;
      gap: 1.5rem;
  }

  .content-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem 2rem;
      backdrop-filter: blur(10px);
      animation: fadeInUp 0.5s ease-out forwards;
      min-width: 0;
  }

  .content-card:hover {
      border-color: rgba(240, 230, 140, 0.5); /* Theme color hover */
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #f0e68c; /* Theme border */
      padding-left: 1rem;
      color: #fff;
  }

  .card-title.no-margin {
      margin-bottom: 0;
  }

  .card-title.no-border {
      border-left: none;
      padding-left: 0;
  }

  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.8;
      margin-bottom: 1rem;
  }

  .idea-list {
      list-style-type: none;
      padding-left: 1.5rem;
      color: #b0c4de;
      line-height: 1.8;
  }

  .idea-list li {
      position: relative;
      margin-bottom: 0.5rem;
  }

  .idea-list li::before {
      content: '✔';
      position: absolute;
      left: -1.5rem;
      color: #f0e68c;
  }

  /* 风险卡片特殊样式 */
  .risk-warning-card {
      border-left-color: #dc3545;
  }
  .risk-warning-card .card-title {
      border-left-color: #dc3545;
      color: #e24141;
  }

  /* =========================================
                                                                                                                                                             新增模块样式：最新持仓与调仓
                                                                                                                                                             ========================================= */
  .card-subtitle {
      font-size: 1.1rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 2rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
  }

  /* .data-table {
                                                                                                  width: 100%;
                                                                                                  border-collapse: collapse;
                                                                                                  min-width: 600px;
                                                                                                  table-layout: fixed;
                                                                                              }

                                                                                              .data-table th,
                                                                                              .data-table td {
                                                                                                  padding: 0.8rem 1rem;
                                                                                                  text-align: left;
                                                                                                  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                                                                                              }

                                                                                              .data-table th {
                                                                                                  color: #ffffff;
                                                                                                  font-weight: bold;
                                                                                                  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                                                                                                  white-space: nowrap;
                                                                                              } */

  .data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 0;
  }

  .data-table th {
      background: rgba(0, 0, 0, 0.2);
      color: #fff;
      font-weight: bold;
      padding: 0.8rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap;
  }

  .data-table td {
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.8rem;
      text-align: center;
      color: #b0c4de;
      font-size: 0.9rem;
      white-space: nowrap;
  }

  .data-table td {
      color: #b0c4de;
  }

  .code-font {
      /* font-family: 'Roboto Mono', monospace; */
      opacity: 1;
  }

  .text-red {
      color: #ff5722 !important;
  }
  .text-green {
      color: #00c497 !important;
  }

  /* 调仓指引 Grid */
  .adjustments-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 1rem;
  }

  .adjustment-title {
      font-size: 1rem;
      margin: 0 0 0.8rem 0;
      font-weight: 600;
  }
  .adjustment-title.buy {
      color: #00c497;
  }
  .adjustment-title.sell {
      color: #ff5722;
  }

  .adjustment-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
  }

  .adjustment-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.5rem 0.8rem;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #b0c4de;
  }

  .adjustment-item-empty {
      color: #8392a5;
      font-size: 0.9rem;
      padding: 0.5rem 0;
  }

  .action-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: bold;
      color: #fff;
  }
  .action-badge.buy {
      background-color: rgba(0, 196, 151, 0.7);
  }
  .action-badge.sell {
      background-color: rgba(255, 87, 34, 0.7);
  }

  /* =========================================
                                                                                                                                                             新增模块样式：图表与统计 (Charts & Stats)
                                                                                                                                                             ========================================= */
  .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
  }

  .period-badge {
      font-size: 0.8rem;
      color: #8392a5;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .echart-container {
      width: 100%;
      height: 350px;
      margin-top: 1rem;
  }

  .stats-bar {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      background: rgba(0, 0, 0, 0.2);
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      gap: 1rem;
  }

  .stat-label {
      color: #8392a5;
      font-size: 0.8rem;
      margin-bottom: 0.3rem;
  }

  .stat-value {
      font-size: 1.1rem;
      font-weight: bold;
      color: #fff;
  }

  .stat-value.highlight {
      color: #f0e68c;
  } /* Yellow for Micro-cap */
  .stat-value.negative {
      color: #00c497;
  }

  /* =========================================
                                                                                                                                                             新增模块样式：热力图 (Heatmap)
                                                                                                                                                             ========================================= */
  .heatmap-container {
      overflow-x: auto;
  }

  .heatmap-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      min-width: 800px;
  }

  .heatmap-table th {
      padding: 0.8rem 0.2rem;
      font-size: 0.85rem;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap;
  }

  .heatmap-table td {
      padding: 0.6rem 0.2rem;
      text-align: center;
      font-size: 0.85rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .year-col {
      font-weight: bold;
      background: rgba(255, 255, 255, 0.02);
      color: #b0c4de;
  }

  .year-total {
      font-weight: bold;
      color: #fff;
  }

  /* =========================================
                                                                                                                                                             新增模块样式：风险分析
                                                                                                                                                             ========================================= */
  .risk-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
  }

  .risk-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 1.5rem 1rem;
      border-radius: 8px;
      text-align: center;
  }

  .risk-label {
      font-size: 0.85rem;
      color: #8392a5;
      margin-bottom: 0.5rem;
  }

  .risk-main-val {
      font-size: 1.4rem;
      font-weight: bold;
      color: #f0e68c; /* Theme Yellow */
      margin-bottom: 0.3rem;
  }

  .risk-sub-val {
      font-size: 0.8rem;
      color: #b0c4de;
  }

  /* 分布图表 */
  .dist-table-inner {
      min-width: 600px;
  }

  .dist-header-row,
  .dist-bar-row,
  .dist-label-row {
      display: flex;
      width: 100%;
  }

  .dist-col {
      flex: 1;
      text-align: center;
      padding: 0.5rem;
      font-size: 0.8rem;
      color: #8392a5;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
  }
  .dist-col:last-child {
      border-right: none;
  }

  .dist-bar-row {
      height: 40px;
      align-items: center;
      background: rgba(0, 0, 0, 0.2);
  }

  .dist-block.yellow-theme {
      background: linear-gradient(145deg, #f0e68c, #d4c550); /* Yellow Gradient */
      color: #121212;
      font-weight: bold;
      padding: 0.3rem 0;
      border-radius: 4px;
  }

  .risk-table {
      min-width: 700px;
  }

  /* =========================================
                                                                                                                                                             FAQ 样式
                                                                                                                                                             ========================================= */
  .faq-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }

  .faq-item {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .faq-item:last-child {
      border-bottom: none;
  }

  .faq-question {
      width: 100%;
      text-align: left;
      padding: 1rem 0;
      background: none;
      border: none;
      color: #fff;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
  }

  .faq-icon {
      font-size: 1.5rem;
      font-weight: bold;
      transition: transform 0.3s ease;
      color: #f0e68c;
  }

  .faq-icon.is-open {
      transform: rotate(45deg);
  }

  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
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
  /* =========================================
                                                                           移动端适配 (最终修正版)
                                                                           ========================================= */
  @media (max-width: 768px) {
      /* 1. 核心修复：给所有滚动容器添加渐变遮罩，增加高级感 */
      .table-container,
      .table-wrapper,
      .heatmap-container {
          mask-image: linear-gradient(to right, transparent, black 15px, black 95%, transparent);
          -webkit-mask-image: linear-gradient(
              to right,
              transparent,
              black 15px,
              black 95%,
              transparent
          );
      }

      /* 2. 页面容器调整：确保不超出屏幕 */
      .page-wrapper {
          padding: 2rem 1rem;
          width: 100vw; /* 强制视口宽度 */
          box-sizing: border-box;
          overflow-x: hidden;
      }

      .main-container {
          width: 100%;
      }

      /* 3. 头部标题适配 */
      .page-header {
          margin-bottom: 2rem;
      }

      .main-title {
          font-size: 2rem;
          gap: 0.8rem;
      }

      .subtitle {
          font-size: 0.95rem;
          padding: 0 1rem; /* 增加文字内边距防止贴边 */
      }

      /* 4. 卡片间距与排版 */
      .content-card {
          padding: 1.5rem 1rem;
      }

      /* 5. 修复：图表头部标题和日期竖向排列 */
      .card-header-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.8rem;
      }

      .period-badge {
          font-size: 0.75rem;
          align-self: flex-start; /* 靠左对齐 */
      }

      /* 6. 调仓指引：单列显示 */
      .adjustments-grid {
          grid-template-columns: 1fr;
          gap: 1.5rem;
      }

      /* 7. 统计条：改为2列网格 */
      .stats-bar {
          grid-template-columns: repeat(2, 1fr);
          padding: 1rem;
          gap: 1rem;
      }

      /* 8. 风险数据：单列显示 */
      .risk-summary-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
      }

      .risk-box {
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
      }

      /* 9. 字体与细节微调 */
      .faq-question {
          font-size: 0.95rem;
      }

      .data-table,
      .heatmap-table,
      .risk-table,
      .dist-table-inner {
          font-size: 0.85rem;
      }

      /* 10. 修复回撤分布表的容器边距 */
      .dist-table-container {
          margin-bottom: 0;
          overflow-x: auto;
      }
  }

  /* --- 新增：紧凑型计算器工具条样式 --- */
  .calculator-toolbar {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(240, 230, 140, 0.2);
      border-radius: 8px;
      padding: 0.8rem 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between; /* 两端对齐 */
      flex-wrap: wrap;
      gap: 1rem;
  }

  .calc-left {
      display: flex;
      align-items: center;
      gap: 0.8rem;
  }

  /* 输入框容器 */
  .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
  }

  .currency-symbol {
      position: absolute;
      left: 10px;
      color: #f0e68c;
      font-weight: bold;
      font-size: 1rem;
      z-index: 2;
  }

  /* 输入框样式：变短、变精致 */
  .compact-input {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 0.5rem 0.5rem 0.5rem 1.8rem; /* 左边留出 ¥ 符号的位置 */
      border-radius: 6px;
      font-size: 1rem;
      width: 140px; /* 限制宽度 */
      outline: none;
      transition: all 0.3s;
  }

  .compact-input:focus {
      border-color: #f0e68c;
      background: rgba(0, 0, 0, 0.3);
  }

  .calc-btn-compact {
      background: #f0e68c;
      color: #121212;
      border: none;
      padding: 0.55rem 1rem;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 0.9rem;
  }
  .calc-btn-compact:hover {
      opacity: 0.9;
  }

  /* 行内摘要样式 */
  .calc-summary-inline {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      /* background: rgba(255, 255, 255, 0.03); */
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
  }

  .summary-tag {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.2;
  }

  .summary-tag .label {
      font-size: 0.7rem;
      color: #8392a5;
      margin-bottom: 2px;
  }

  .summary-tag .value {
      font-size: 1rem;
      font-weight: bold;
      color: #fff;
  }

  .summary-tag .value.highlight {
      color: #f0e68c;
  }
  .summary-tag .value.warn {
      color: #ff5722;
  }

  /* 表格计算列高亮 */
  .calc-col-head {
      background: rgba(240, 230, 140, 0.15) !important;
      color: #f0e68c !important;
  }
  .calc-col-cell {
      background: rgba(240, 230, 140, 0.03);
  }

  /* 移动端适配 */
  @media (max-width: 600px) {
      .calculator-toolbar {
          flex-direction: column;
          align-items: stretch;
      }
      .compact-input {
          width: 100%;
      }
      .calc-summary-inline {
          justify-content: space-between;
      }
  }
</style>