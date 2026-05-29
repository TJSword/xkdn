<template>
  <div class="page-wrapper">
    <div class="main-container">

      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <span class="title-icon">⚡</span>
          动量策略
        </h1>
        <p class="subtitle">
          追随趋势，强者恒强。基于动量模型的轮动系统。
        </p>
      </div>

      <div class="content-grid">
        <div class="content-card">
          <h2 class="card-title">策略简介</h2>
          <p class="card-description">
            动量策略（Momentum Strategy）的核心理念源于金融市场中广泛存在的“动量效应”——即过去一段时间表现最好的资产，在未来一段时间内往往能延续其强势表现。
          </p>
          <p class="card-description">
            本策略不主观预测市场涨跌，而是通过量化模型实时监控 <strong>A股主流风格指数</strong>、<strong>境外宽基指数</strong> 以及 <strong>黄金ETF</strong> 的趋势强度。系统每日计算各标的的
            <strong>近20日涨幅</strong>，在不同市场环境和风险偏好下，动态轮动持有当前市场中“最强”的标的。
          </p>
        </div>

        <div class="content-card">
          <h2 class="card-title">组合思想</h2>
          <ul class="idea-list">
            <li><b>风格互补 (Style Diversification) ⇒</b> A股市场内不存在单一的常胜风格。我们在成长与价值指数间动态轮动，确保捕获结构性上涨机会。</li>
            <li><b>全球视野 (Global Allocation) ⇒</b> 当A股面临系统性调整或风格失效时，策略自动切换至走势更强的境外主流指数，利用跨市场低相关性提供保护。</li>
            <li><b>避险兜底 (Safe Haven Anchor) ⇒</b> 黄金是最后的防线。当全球权益市场陷入恐慌时，策略将“终极底牌”切换至黄金，确保极端行情下的资产安全。</li>
          </ul>
        </div>

        <div v-if="canViewPremiumContent" class="content-card monitor-card">
          <div class="card-header-row monitor-header">
            <h2 class="card-title no-margin">动量监控</h2>

            <div class="monitor-meta">
              <div class="system-status">
                <span class="status-dot"></span>
                <span class="status-text">信号更新: {{ signalUpdateTime }}</span>
              </div>

              <!-- <div class="signal-tag">
                <span class="icon">🔔</span> 策略信号
              </div> -->
            </div>
          </div>

          <div class="dashboard-grid">
            <div class="dash-item date-box">
              <div class="dash-label">📅 本期调仓日</div>
              <div class="dash-value">{{ currentRebalanceDate }} <span v-if='isToday'>(今天)</span> </div>
              <div class="dash-sub">交易日下午2:50确认信号</div>
            </div>
            <div class="dash-item holding-box">
              <div class="dash-label">🎯 当前强动量持仓</div>
              <div class="dash-value highlight">{{ currentHolding }}</div>
              <div class="dash-sub">轮动代码: {{currentHoldingCode}}</div>
            </div>
          </div>

          <div class="section-divider"></div>

          <div class="data-section-header">
            <div class="section-title">
              实时涨幅排名
              <span class="desc-text">(近20日涨幅)</span>
            </div>
            <div class="system-status">
              <span class="status-dot"></span>
              <span class="status-text">数据更新: {{ dataUpdateTime }}</span>
            </div>
          </div>

          <div class="table-container">
            <table class="momentum-table">
              <thead>
                <tr>
                  <th width="10%">排名</th>
                  <th>ETF名称</th>
                  <th>代码</th>
                  <th>追踪指数</th>
                  <th width="20%">近20日涨幅</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in momentumList" :key="item.code" :class="{'active-row': index === 0}">
                  <td>
                    <span :class="['rank-badge', 'rank-' + (Number(index) + 1)]">{{ Number(index) + 1 }}</span>
                  </td>
                  <td class="name-col">{{ item.name }}</td>
                  <td class="code-col">{{ item.code }}</td>
                  <td class="index-col">{{ item.indexName }}</td>
                  <td :class="['growth-col', getValueColorClass(item.ratio)]">
                    {{ item.ratio > 0 ? '+' : '' }}{{ item.ratio.toFixed(2) }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="content-card premium-lock-card">
          <div class="premium-lock-icon">🔒</div>
          <h2 class="card-title">动量监控</h2>
          <p class="card-description">
            实时持仓、轮动代码与涨幅排名属于会员内容，开通后可查看完整调仓依据。
          </p>
          <button class="premium-lock-button" @click="router.push('/home')">返回首页开通会员</button>
        </div>
        <div class="content-card">
          <div class="card-header-row">
            <h2 class="card-title no-margin">动量策略 vs 沪深300全收益</h2>
            <span class="period-badge">回测周期: 2013-01-04 至 2025-12-31</span>
          </div>

          <div ref="chartContainer" class="echart-container"></div>

          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-label">总收益</div>
              <div class="stat-value highlight">5200.43%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">年化收益</div>
              <div class="stat-value">36.95%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">波动率</div>
              <div class="stat-value">24.51%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">夏普比率</div>
              <div class="stat-value">1.426</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最大回撤</div>
              <div class="stat-value negative">-29.72%</div>
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
          <h2 class="card-title"> 深度风险分析</h2>

          <div class="risk-summary-grid">
            <div class="risk-box">
              <div class="risk-label">卡玛比率 (Calmar)</div>
              <div class="risk-main-val">1.243</div>
              <div class="risk-sub-val">年化收益 / 最大回撤</div>
            </div>
            <div class="risk-box">
              <div class="risk-label">盈利 / 总月数</div>
              <div class="risk-main-val"> 95 / 156</div>
              <div class="risk-sub-val">月度胜率: 60.9%</div>
            </div>
            <div class="risk-box">
              <div class="risk-label">平均持仓天数</div>
              <div class="risk-main-val">5.4 天</div>
              <div class="risk-sub-val">反映策略换手频率</div>
            </div>
          </div>

          <h3 class="sub-title"> 回撤深度分布 (频率统计)</h3>
          <div class="table-container dist-table-container">
            <div class="dist-table-inner">
              <div class="dist-header-row">
                <div class="dist-col" v-for="item in drawdownDist" :key="item.range">{{ item.range }}</div>
              </div>
              <div class="dist-bar-row">
                <div class="dist-col" v-for="item in drawdownDist" :key="item.range">
                  <div class="dist-block teal-theme" :style="{ opacity: item.count > 0 ? 1 : 0.6 }">
                    {{ item.count }}
                  </div>
                </div>
              </div>
              <div class="dist-label-row">
                <div class="dist-col">次数</div>
              </div>
            </div>
          </div>

          <h3 class="sub-title" style="margin-top: 2rem;"> 历史重大回撤明细 (Top 10)</h3>
          <div class="table-container">
            <table class="risk-table">
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
                  <td>{{ item.startDate }}</td>
                  <td>{{ item.troughDate }}</td>
                  <td>{{ item.endDate }}</td>
                  <td>{{ item.drawdown }}%</td>
                  <td>{{ item.ddDays }}</td>
                  <td>{{ item.fixDays }}</td>
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
                <p>{{ item.answer }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, nextTick } from 'vue'
  import { useRouter } from 'vue-router'
  import * as echarts from 'echarts'
  import app, { auth } from '@/lib/cloudbase'
  import axios from 'axios'
  import { useUserStore } from '@/store/user'

  const router = useRouter()
  const userStore: any = useUserStore()
  const canViewPremiumContent = computed(() => userStore.isVip || userStore.userInfo?.admin === true)
  // --- 1. 动量监控台数据 ---
  const currentRebalanceDate = ref('')
  const dataUpdateTime = ref('')
  const signalUpdateTime = ref('')
  const currentHolding = ref('')
  const currentHoldingCode = ref('')
  const isToday = ref(false)

  const momentumList: any = ref([])

  const getMomentum = () => {
      if (!canViewPremiumContent.value) return

      app.callFunction({
          name: 'getMomentumInfo',
          parse: true
      }).then((res: any) => {
          // 直接使用从云函数返回的结果
          const data: any = res.result.data
          signalUpdateTime.value = data.updated_at
          currentRebalanceDate.value = data.switch_date
          currentHolding.value = data.top_1_name
          currentHoldingCode.value = data.top_1_code
          isToday.value = data.is_switch_triggered
      })
  }

  const getEtfData = () => {
      if (!canViewPremiumContent.value) return

      app.callFunction({
          name: 'fetchEtfData',
          parse: true
      }).then((res: any) => {
          console.log(res)
          momentumList.value = res.result.list
          dataUpdateTime.value = res.result.updateTime
      })
  }

  if (canViewPremiumContent.value) {
      getMomentum()
      getEtfData()
  }

  const getlocalData = () => {
      axios.get('./static/momentumData.json').then(res => {
          const data = res.data
          initChart(data.dateList, data.strategyData, data.hs300)
      })
  }
  getlocalData()
  // --- 2. 收益热力图数据 ---
  const monthlyReturns: any = ref([])
  const generateMockData = () => {
      const years = [
          {
              year: 2025,
              months: [
                  '0.21',
                  '-2.01',
                  '4.64',
                  '6.76',
                  '1.26',
                  '7.29',
                  '2.85',
                  '25.99',
                  '6.20',
                  '-2.50',
                  '-4.69',
                  '2.68'
              ],
              total: '56.49'
          },
          {
              year: 2024,
              months: [
                  '-1.99',
                  '4.09',
                  '6.85',
                  '5.40',
                  '-1.50',
                  '-0.49',
                  '2.13',
                  '-3.13',
                  '34.78',
                  '-0.49',
                  '-11.89',
                  '-2.58'
              ],
              total: '28.26'
          },
          {
              year: 2023,
              months: [
                  '4.91',
                  '-1.93',
                  '-0.91',
                  '0.80',
                  '5.06',
                  '6.49',
                  '2.87',
                  '-3.07',
                  '-1.00',
                  '0.04',
                  '0.22',
                  '5.51'
              ],
              total: '20.06'
          },
          {
              year: 2022,
              months: [
                  '-3.32',
                  '3.39',
                  '-0.81',
                  '-15.36',
                  '-0.53',
                  '16.91',
                  '7.26',
                  '-3.77',
                  '0.77',
                  '-4.13',
                  '-0.56',
                  '-6.94'
              ],
              total: '-9.95'
          },
          {
              year: 2021,
              months: [
                  '8.91',
                  '-3.09',
                  '4.63',
                  '10.18',
                  '8.79',
                  '5.31',
                  '14.73',
                  '3.53',
                  '1.39',
                  '0.31',
                  '0.83',
                  '1.14'
              ],
              total: '71.73'
          },
          {
              year: 2020,
              months: [
                  '4.51',
                  '0.76',
                  '-9.33',
                  '10.51',
                  '-3.83',
                  '11.62',
                  '16.25',
                  '2.29',
                  '-14.77',
                  '-9.27',
                  '7.81',
                  '-2.80'
              ],
              total: '9.14'
          },
          {
              year: 2019,
              months: [
                  '2.96',
                  '14.92',
                  '11.80',
                  '2.52',
                  '-4.13',
                  '8.13',
                  '-3.43',
                  '8.76',
                  '-4.45',
                  '3.50',
                  '4.66',
                  '3.51'
              ],
              total: '58.19'
          },
          {
              year: 2018,
              months: [
                  '6.31',
                  '-8.10',
                  '2.93',
                  '-5.04',
                  '3.03',
                  '1.05',
                  '2.13',
                  '4.50',
                  '-2.92',
                  '-1.56',
                  '-0.02',
                  '-5.60'
              ],
              total: '-4.30'
          },
          {
              year: 2017,
              months: [
                  '4.87',
                  '3.55',
                  '1.00',
                  '3.22',
                  '3.68',
                  '5.83',
                  '5.53',
                  '-1.97',
                  '1.21',
                  '3.73',
                  '0.64',
                  '-0.48'
              ],
              total: '35.12'
          },
          {
              year: 2016,
              months: [
                  '6.13',
                  '9.38',
                  '3.06',
                  '-2.13',
                  '-1.95',
                  '-2.25',
                  '5.12',
                  '2.27',
                  '-2.07',
                  '-1.90',
                  '0.99',
                  '-2.56'
              ],
              total: '14.05'
          },
          {
              year: 2015,
              months: [
                  '-6.88',
                  '14.73',
                  '19.60',
                  '32.64',
                  '20.24',
                  '2.02',
                  '-1.03',
                  '8.34',
                  '1.20',
                  '19.00',
                  '8.28',
                  '-2.70'
              ],
              total: '182.84'
          },
          {
              year: 2014,
              months: [
                  '14.68',
                  '-2.09',
                  '-1.91',
                  '-0.24',
                  '0.61',
                  '5.52',
                  '3.70',
                  '2.43',
                  '9.30',
                  '-0.58',
                  '9.73',
                  '20.70'
              ],
              total: '78.32'
          },
          {
              year: 2013,
              months: [
                  '-0.01',
                  '10.96',
                  '-1.63',
                  '-6.13',
                  '20.34',
                  '-5.94',
                  '-1.40',
                  '-2.99',
                  '5.59',
                  '-3.32',
                  '7.61',
                  '-9.09'
              ],
              total: '10.78'
          }
      ]
      // console.log(years)
      monthlyReturns.value = years
  }
  generateMockData()

  const getHeatmapStyle = (value: number | null) => {
      if (value === null || value === undefined) return {}
      if (value === 0) return { backgroundColor: 'transparent' }
      if (value > 0) {
          const opacity = Math.min(Math.abs(value) / 10, 1)
          return {
              backgroundColor: `rgba(255, 87, 34, ${0.15 + opacity * 0.7})`,
              color: '#fff',
              fontWeight: value > 10 ? 'bold' : 'normal'
          }
      } else {
          const opacity = Math.min(Math.abs(value) / 10, 1)
          return {
              backgroundColor: `rgba(0, 196, 151, ${0.15 + opacity * 0.7})`,
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

  // --- 3. 风险数据 ---
  const drawdownDist = ref([
      { range: '0% ~ 5%', count: 108 },
      { range: '5% ~ 10%', count: 15 },
      { range: '10% ~ 15%', count: 8 },
      { range: '15% ~ 20%', count: 4 },
      { range: '20% ~ 25%', count: 2 },
      { range: '25% ~ 30%', count: 2 },
      { range: '> 30%', count: 0 }
  ])

  const topDrawdowns = ref([
      {
          startDate: '2024-10-08',
          troughDate: '2025-01-02',
          endDate: '2025-08-22',
          drawdown: '-29.72',
          rawDd: -0.2971723580446558,
          ddDays: 86,
          fixDays: 232
      },
      {
          startDate: '2020-07-14',
          troughDate: '2020-10-30',
          endDate: '2021-05-25',
          drawdown: '-25.39',
          rawDd: -0.2539221437222343,
          ddDays: 108,
          fixDays: 207
      },
      {
          startDate: '2021-09-13',
          troughDate: '2022-05-24',
          endDate: '2022-08-10',
          drawdown: '-24.86',
          rawDd: -0.24861538952947396,
          ddDays: 253,
          fixDays: 78
      },
      {
          startDate: '2020-02-25',
          troughDate: '2020-03-19',
          endDate: '2020-07-02',
          drawdown: '-23.36',
          rawDd: -0.23362209764501,
          ddDays: 23,
          fixDays: 105
      },
      {
          startDate: '2022-08-15',
          troughDate: '2023-03-22',
          endDate: '2024-02-20',
          drawdown: '-19.38',
          rawDd: -0.19375566707414613,
          ddDays: 219,
          fixDays: 335
      },
      {
          startDate: '2018-01-26',
          troughDate: '2018-03-23',
          endDate: '2019-02-25',
          drawdown: '-15.57',
          rawDd: -0.1556635277190195,
          ddDays: 56,
          fixDays: 339
      },
      {
          startDate: '2013-05-27',
          troughDate: '2013-09-12',
          endDate: '2014-01-24',
          drawdown: '-15.29',
          rawDd: -0.15292952526995054,
          ddDays: 108,
          fixDays: 134
      },
      {
          startDate: '2025-10-17',
          troughDate: '2025-12-19',
          endDate: '未修复',
          drawdown: '-15.01',
          rawDd: -0.15013666516522634,
          ddDays: 63,
          fixDays: '-'
      },
      {
          startDate: '2015-06-12',
          troughDate: '2015-08-06',
          endDate: '2015-10-08',
          drawdown: '-13.56',
          rawDd: -0.13563984667669016,
          ddDays: 55,
          fixDays: 63
      },
      {
          startDate: '2020-01-22',
          troughDate: '2020-02-04',
          endDate: '2020-02-18',
          drawdown: '-13.06',
          rawDd: -0.13058103609068245,
          ddDays: 13,
          fixDays: 14
      }
  ])

  // --- 4. FAQ ---
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
  const faqList = ref([
      {
          question: '如何参与该策略？最低资金门槛是多少？',
          answer: '本策略始终只持有一只最强的ETF。由于标的均为ETF，理论上只需“一手”（100股）的金额即可参与，但建议1000元起步以保证资金利用率。请在交易日14:50（收盘前10分钟）查看信号：若排名变化则进行轮动（卖旧买新）。注意：系统每日更新数据，但并非每天都需要调仓。'
      },
      {
          question: '该策略依托于什么核心思想？',
          answer: '我喜欢用“惯性”来解释。万事万物皆有惯性，且反馈往往滞后。好比“夏至”是一年中白昼最长的，但最热的时候往往出现在之后的“小暑”和“处暑”。金融市场亦然，价格的强势表现往往能延续，我们赚取的就是这段惯性带来的收益。'
      },
      {
          question: '如果错过了14:50的操作时间怎么办？',
          answer: '没关系。动量策略捕捉的是中期趋势，并非日内高频交易。如果您错过了收盘前的操作窗口，可以在第二个交易日的开盘时完成调仓，通常对整体收益影响不大。'
      },
      {
          question: '这个策略有风险吗？',
          answer: '有。动量策略最怕的是“震荡市”或“假突破”。即买入后趋势立刻反转，导致我们要止损卖出。这是为了捕捉大趋势所必须支付的“保险费”。但长期来看，只要抓住几次主升浪，足以覆盖这些磨损成本。'
      },
      {
          question: '是否有空仓（持币）的时间？',
          answer: '原则上没有空仓期。策略采用“五选一”机制，标的池已包含黄金作为终极避险资产。回测数据显示，强制引入现金（如模拟3%收益的虚拟债券）反而会拉低整体收益。因此，当股市低迷时，我们会自动轮动至黄金，时刻保持在场以捕捉所有趋势。'
      }
  ])

  // --- 5. ECharts ---
  const chartContainer = ref<HTMLElement | null>(null)
  let myChart: echarts.ECharts | null = null

  onMounted(() => {
      nextTick(() => {
          getlocalData()
      })
      window.addEventListener('resize', handleResize)
  })

  const handleResize = () => {
      if (myChart) {
          myChart.resize()
      }
  }

  const initChart = (xAxis: any, strategyData: any, hs300: any) => {
      if (!chartContainer.value) return
      myChart = echarts.init(chartContainer.value)
      // const dateList = Array.from(
      //     { length: 100 },
      //     (_, i) => `2024-${Math.floor(i / 30) + 1}-${(i % 30) + 1}`
      // )
      // console.log(dateList)
      // const strategyData = dateList.map((_, i) => 1000 + i * 10 + Math.random() * 50)
      // console.log(strategyData)
      // const indexData = dateList.map((_, i) => 1000 + i * 5 + Math.random() * 100)
      const option = {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis' },
          grid: { top: '10%', left: '3%', right: '4%', bottom: '15%', containLabel: true },
          xAxis: { type: 'category', data: xAxis, axisLine: { lineStyle: { color: '#8392A5' } } },
          yAxis: {
              type: 'value',
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
              axisLabel: { color: '#8392A5' }
          },
          series: [
              {
                  name: '动能策略',
                  type: 'line',
                  data: strategyData,
                  itemStyle: { color: '#FF5722' },
                  showSymbol: false,
                  lineStyle: { width: 2 }
              },
              {
                  name: '沪深300',
                  type: 'line',
                  data: hs300,
                  itemStyle: { color: '#00bcd4' },
                  showSymbol: false,
                  lineStyle: { width: 1, type: 'dashed' }
              }
          ]
      }
      myChart.setOption(option)
  }
</script>

<style scoped>
  /* =========================================
                                                 1. 全局与基础动画
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
      background: radial-gradient(circle at 15% 50%, #2b120a, transparent 40%),
          radial-gradient(circle at 85% 50%, #2b1a0a, transparent 40%), #121212;
      box-sizing: border-box;
  }

  .main-container {
      max-width: 960px;
      margin: 0 auto;
  }

  /* =========================================
                                                 2. 页面头部 (Header)
                                                 ========================================= */
  .page-header {
      text-align: center;
      margin-bottom: 3rem;
      animation: fadeInUp 0.5s ease-out forwards;
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
      color: #ff5722;
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
  }

  .title-icon {
      font-size: 2.8rem;
      text-shadow: 0 0 15px #ff5722;
  }

  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  /* =========================================
                            3. 通用内容卡片 (Content Card)
                            ========================================= */
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
      border-color: rgba(255, 87, 34, 0.5);
  }

  .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #ff5722;
      padding-left: 1rem;
  }

  .card-title.no-margin {
      margin-bottom: 0;
  }

  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
      margin-bottom: 1rem;
  }

  .period-badge {
      font-size: 0.8rem;
      color: #8392a5;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.05);
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
      content: '⚡ ';
      color: #ff5722;
      font-weight: bold;
      position: absolute;
      left: -1.5rem;
  }

  /* =========================================
                                                 4. 动量监控卡片 (Monitor Card) - 核心修改区域
                                                 ========================================= */
  .monitor-card {
      background: linear-gradient(145deg, rgba(255, 87, 34, 0.03), rgba(255, 255, 255, 0.05));
  }

  /* --- 4.1 监控顶部标题栏 --- */
  .monitor-header {
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap; /* 允许小屏幕换行 */
      gap: 0.8rem;
  }

  .premium-lock-card {
      min-height: 280px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
  }

  .premium-lock-card .card-title {
      padding-left: 0;
      border-left: 0;
  }

  .premium-lock-icon {
      width: 54px;
      height: 54px;
      display: grid;
      place-items: center;
      margin-bottom: 1rem;
      border-radius: 50%;
      background: rgba(255, 87, 34, 0.1);
      border: 1px solid rgba(255, 87, 34, 0.25);
      font-size: 1.6rem;
  }

  .premium-lock-button {
      margin-top: 1rem;
      padding: 0.7rem 1.2rem;
      border: 0;
      border-radius: 6px;
      color: #fff;
      background: #ff5722;
      font-weight: 700;
      cursor: pointer;
  }

  .premium-lock-button:hover {
      background: #ff7043;
  }

  /* 右侧元数据容器 (时间 + 标签) */
  .monitor-meta {
      display: flex;
      align-items: center;
      gap: 12px;
  }

  /* 信号更新时间 (灰色死时间) */
  .signal-time {
      font-size: 0.8rem;
      color: #8392a5;
      font-family: 'Roboto Mono', monospace;
      letter-spacing: 0.5px;
  }

  /* 策略信号标签 */
  .signal-tag {
      font-size: 0.85rem;
      color: #ff5722;
      background: rgba(255, 87, 34, 0.1);
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      border: 1px solid rgba(255, 87, 34, 0.2);
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
  }

  /* --- 4.2 仪表盘 Grid --- */
  .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
  }

  .dash-item {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 1.2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
  }

  .holding-box {
      background: rgba(255, 87, 34, 0.08);
      border-color: rgba(255, 87, 34, 0.2);
  }

  .dash-label {
      font-size: 0.8rem;
      color: #8392a5;
      margin-bottom: 0.5rem;
  }

  .dash-value {
      font-size: 1.3rem;
      font-weight: bold;
      color: #fff;
      font-family: 'Roboto Mono', monospace;
  }

  .dash-value.highlight {
      color: #ff5722;
      font-size: 1.5rem;
  }

  .dash-sub {
      font-size: 0.8rem;
      color: #bae4f9;
      margin-top: 0.5rem;
  }

  /* --- 4.3 中间分割线 --- */
  .section-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      margin: 1.5rem 0;
      width: 100%;
  }

  /* --- 4.4 数据区域头部 --- */
  .data-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
  }

  .section-title {
      font-size: 1rem;
      font-weight: bold;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
  }

  .desc-text {
      font-size: 0.8rem;
      color: #8392a5;
      font-weight: normal;
  }

  /* 下方的数据更新时间胶囊 */
  .system-status {
      display: flex;
      align-items: center;
      font-size: 0.75rem;
      color: #8392a5;
      background: rgba(0, 0, 0, 0.2);
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .status-dot {
      width: 6px;
      height: 6px;
      background: #00c497;
      border-radius: 50%;
      margin-right: 6px;
      box-shadow: 0 0 5px #00c497;
  }

  /* =========================================
                                                 5. 表格与排名 (Tables)
                                                 ========================================= */
  .table-container {
      width: 100%;
      overflow-x: auto;
      border-radius: 8px;
      margin-bottom: 1rem;
      -webkit-overflow-scrolling: touch;
  }

  .table-container::-webkit-scrollbar {
      height: 6px;
  }

  .table-container::-webkit-scrollbar-thumb {
      background: #ff5722;
      border-radius: 3px;
  }

  .table-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
  }

  .momentum-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 600px;
  }

  .momentum-table th,
  .momentum-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 0.95rem;
  }

  .momentum-table th {
      color: #ffffff;
      font-weight: bold;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap;
  }

  .momentum-table td {
      color: #b0c4de;
  }

  .active-row {
      background: rgba(255, 87, 34, 0.05);
  }

  .active-row td {
      color: #fff;
      font-weight: 700;
  }

  .rank-badge {
      display: inline-block;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      color: #aaa;
      font-size: 0.8rem;
      font-weight: bold;
  }

  .rank-1 {
      background: #ff5722;
      color: #fff;
  }

  .rank-2 {
      background: rgba(255, 160, 0, 0.8);
      color: #fff;
  }

  .rank-3 {
      background: rgba(255, 202, 40, 0.6);
      color: #fff;
  }

  .growth-col {
      font-family: 'Roboto Mono', monospace;
      font-weight: bold;
  }

  .code-col {
      font-family: 'Roboto Mono', monospace;
      opacity: 0.7;
  }

  .index-col {
      font-size: 0.9rem;
      color: #8392a5;
  }

  /* =========================================
                                                 6. 图表与统计 (Charts & Stats)
                                                 ========================================= */
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
      color: #ff5722;
  }

  .stat-value.negative {
      color: #00c497;
  }

  /* =========================================
                                                 7. 热力图 (Heatmap)
                                                 ========================================= */
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
  }

  .year-total {
      font-weight: bold;
      color: #fff;
  }

  /* =========================================
                                                 8. 风险分析 (Risk Analysis)
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
      color: #ff5722;
      margin-bottom: 0.3rem;
  }

  .risk-sub-val {
      font-size: 0.8rem;
      color: #b0c4de;
  }

  .dist-table-container {
      margin-bottom: 1.5rem;
  }

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

  .dist-block.teal-theme {
      background: linear-gradient(145deg, #438a83, #24e3cd);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      color: #fff;
      font-weight: bold;
      padding: 0.3rem 0;
      border-radius: 4px;
      text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
  }

  .dist-header-row .dist-col {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      background: rgba(255, 255, 255, 0.02);
  }

  .sub-title {
      font-size: 1.1rem;
      color: #fff;
      margin-bottom: 1.2rem;
      font-weight: bold;
  }

  .risk-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 700px;
  }

  .risk-table th {
      background: rgba(0, 0, 0, 0.2);
      color: #fff;
      font-weight: bold;
      padding: 0.8rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap;
  }

  .risk-table td {
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.8rem;
      text-align: center;
      color: #b0c4de;
      font-size: 0.9rem;
      white-space: nowrap;
  }

  /* =========================================
                                                 9. FAQ 与 辅助样式
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
      color: #ff5722;
  }

  .faq-icon.is-open {
      transform: rotate(45deg);
  }

  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  .text-red {
      color: #ff5722 !important;
  }

  .text-green {
      color: #00c497 !important;
  }

  /* =========================================
                                                 10. 移动端/响应式适配 (Responsive)
                                                 ========================================= */

  /* 平板 (<= 992px) */
  @media (max-width: 992px) {
      .page-wrapper {
          padding: 2.5rem 1.5rem;
      }
  }

  /* 手机 (<= 768px) */
  @media (max-width: 768px) {
      .table-container {
          mask-image: linear-gradient(to right, transparent, black 15px, black 95%, transparent);
          -webkit-mask-image: linear-gradient(
              to right,
              transparent,
              black 15px,
              black 95%,
              transparent
          );
      }

      .page-wrapper {
          padding: 2rem 1rem;
          width: 100%;
          box-sizing: border-box;
      }

      .main-container {
          width: 100%;
      }

      /* 头部适配 */
      .page-header {
          margin-bottom: 2rem;
      }

      .main-title {
          font-size: 2rem;
          gap: 0.8rem;
      }

      .subtitle {
          font-size: 0.95rem;
      }

      /* 卡片间距 */
      .content-card {
          padding: 1.25rem 1rem;
      }

      /* --- 核心修复：监控头部移动端适配 --- */
      .monitor-header {
          align-items: flex-start;
      }

      .monitor-meta {
          width: 100%; /* 占满整行 */
          justify-content: space-between; /* 时间在左，标签在右 */
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05); /* 淡淡的分隔线，美观 */
      }

      .signal-time {
          font-size: 0.75rem;
      }

      /* 动量监控单列布局 */
      .dashboard-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
      }

      /* 实时数据头部两行显示 */
      .data-section-header {
          flex-direction: column;
          align-items: flex-start;
      }

      .system-status {
          width: 100%;
          justify-content: center;
          margin-top: 0.2rem;
      }

      /* 统计条改为 2x2 */
      .stats-bar {
          grid-template-columns: repeat(2, 1fr);
          padding: 0.8rem;
      }

      /* 风险数据单列 */
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

      .faq-question {
          font-size: 0.95rem;
      }

      .momentum-table,
      .heatmap-table,
      .risk-table,
      .dist-table-inner {
          font-size: 0.85rem;
      }
  }
</style>
