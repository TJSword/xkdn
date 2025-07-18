<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>
        <h1 class="main-title">
          <span class="title-icon">🔄</span>
          可转债策略
        </h1>
        <p class="subtitle">
          量化驱动，每日择优，追求复利增长的艺术。
        </p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 策略简介 -->
        <div class="content-card">
          <h2 class="card-title">策略简介</h2>
          <p class="card-description">
            本策略以“三低”（低价格、低溢价率、低剩余规模）因子为量化核心，每日筛选并轮动交易具备高性价比的可转债组合。我们摒弃主观预测，严格执行纪律，旨在动态捕捉市场短期价值机会，力求实现稳健的复利增长。

          </p>
        </div>

        <!-- 组合思想 -->
        <div class="content-card">
          <h2 class="card-title">组合思想：低价买入，静待花开</h2>
          <p class="card-description">
            本策略的核心是在保证安全边际的前提下，通过高频轮动实现组合的动态优化。
          </p>
          <ul class="idea-list">
            <li><b>三低核心：</b> 以低价格、低溢价率、低剩余规模为核心筛选标准，构建具备高安全边际和强向上弹性的初始投资池。</li>
            <li><b>每日轮动：</b> 模型于每个交易日下午2:30重新评估全市场可转债，卖出价值减弱的品种，换入新的价值洼地。</li>
            <li><b>纪律执行：</b> 严格遵循模型信号进行交易，完全摒除人性中的贪婪与恐惧。追求长期稳健的复利增长。</li>
            <li><b>风险分散：</b> 始终保持持有10只不同可转债的组合，有效分散单一公司的基本面风险和流动性风险。</li>
          </ul>
        </div>

        <!-- 核心指标解读 -->
        <div class="content-card">
          <h2 class="card-title">核心指标解读</h2>
          <p class="card-description">投资可转债需要关注几个核心指标，它们共同决定了一只转债的投资价值。</p>
          <table class="data-table">
            <thead>
              <tr>
                <th>指标名称</th>
                <th>解读</th>
                <th>我们的偏好</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>转债价格</td>
                <td>当前市场交易价格。价格越低，安全垫越厚。</td>
                <td><span class="valuation-badge low">越低越好 </span>
                </td>
              </tr>
              <tr>
                <td>转股溢价率</td>
                <td>转债价格相比其转换后股票价值高出的百分比。</td>
                <td><span class="valuation-badge low">越低越好 </span>
                </td>
              </tr>
              <tr>
                <td>债券余额</td>
                <td>尚未转股的债券规模。规模太小可能流动性差。</td>
                <td><span class="valuation-badge reasonable">> 1亿</span></td>
              </tr>
              <!-- <tr>
                <td>到期收益率 (YTM)</td>
                <td>持有至到期能获得的年化收益率，是最终的兜底保障。</td>
                <td><span class="valuation-badge reasonable">越高越好 (正数)</span></td>
              </tr> -->

            </tbody>
          </table>
        </div>

        <div class="content-card">
          <h2 class="card-title">最新持仓与调仓建议</h2>
          <p class="card-description">
            根据模型于 {{ formattedDate }} 生成的最新组合与操作建议。请结合自身情况参考。
          </p>

          <!-- 最新持仓组合 -->
          <h3 class="card-subtitle">最新持仓组合 ({{ strategyData?.latest_portfolio.length }}只)</h3>
          <div class="table-wrapper">
            <table class="data-table portfolio-table">
              <thead>
                <tr>
                  <th>代码</th>
                  <th>名称</th>
                  <th>价格</th>
                  <th>溢价率</th>
                  <th>剩余规模(亿)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in strategyData.latest_portfolio" :key="item.code">
                  <td>{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ parseFloat(item.close).toFixed(2) }}</td>
                  <td>{{ (parseFloat(item.conv_prem) * 100).toFixed(2) }}%</td>
                  <td>{{ parseFloat(item.remain_size).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 当日调仓 (移到下方) -->
          <h3 class="card-subtitle">组合调仓指引</h3>
          <div class="adjustments-grid">
            <div class="adjustment-block">
              <h4 class="adjustment-title buy">⬆️ 建议调入</h4>
              <ul class="adjustment-list">
                <li v-for="item in buyList" :key="item.code" class="adjustment-item">
                  <span>{{ item.name }} ({{ item.code }})</span>
                  <span class="action-badge buy">{{ item.action }}</span>
                </li>
                <li v-if="buyList.length === 0" class="adjustment-item-empty">今日无调入建议</li>
              </ul>
            </div>
            <div class="adjustment-block">
              <h4 class="adjustment-title sell">⬇️ 建议调出</h4>
              <ul class="adjustment-list">
                <li v-for="item in sellList" :key="item.code" class="adjustment-item">
                  <span>{{ item.name }} ({{ item.code }})</span>
                  <span class="action-badge sell">{{ item.action }}</span>
                </li>
                <li v-if="sellList.length == 0" class="adjustment-item-empty">今日无调出建议</li>
              </ul>
            </div>
          </div>
        </div>
        <!-- 历史业绩与收益曲线卡片 -->
        <!-- <div class="content-card">
          <div class="card-header-with-toggle">
            <h2 class="card-title no-border">历史业绩</h2>
            <div class="view-toggle-container">
              <button :class="['toggle-button', { active: performanceViewMode === 'rate' }]" @click="performanceViewMode = 'rate'">
                累计收益率
              </button>
              <button :class="['toggle-button', { active: performanceViewMode === 'amount' }]" @click="performanceViewMode = 'amount'">
                累计收益金额
              </button>
            </div>
          </div>
          <p class="card-description">
            下图展示了可转债策略的模拟累计收益曲线。可见其波动小于纯股策略，但长期回报优于纯债策略。数据为模拟，不代表真实收益。
          </p>
          <div ref="performanceChartContainer" class="echart-container"></div>
        </div> -->

        <!-- FAQ -->
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
  import { ref, onMounted, watch, computed } from 'vue'
  import * as echarts from 'echarts'
  import app, { auth } from '@/lib/cloudbase'
  const getStrategyData = () => {
      app.callFunction({
          name: 'getBondPortfolio',
          parse: true
      }).then((res: any) => {
          strategyData.value = res.result
      })
  }
  // --- 策略持仓与调仓数据 ---
  const strategyData: any = ref({
      adjustments: [],
      latest_portfolio: []
  })
  getStrategyData()
  const formattedDate = computed(() => {
      const dateStr = strategyData.value.latest_date
      if (!dateStr || dateStr.length !== 8) return dateStr
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
  })

  const buyList = computed(() =>
      strategyData.value.adjustments.filter((item: any) => item.action === '调入')
  )
  const sellList = computed(() =>
      strategyData.value.adjustments.filter((item: any) => item.action === '调出')
  )

  // --- 控制FAQ展开 ---
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }

  const faqList = ref([
      {
          question: '我如何才能参与本策略？',
          answer: '参与本策略，您首先需要在您的A股证券账户中开通“可转换债券”的交易权限。根据交易所规定，开通此权限通常需要满足以下两个条件：\n\n1.  投资经验： 具备2年及以上的证券交易经验（从首次股票交易日算起）。\n2.  资产要求： 在申请开通权限前的连续20个交易日里，您证券账户内的日均资产不低于人民币10万元。\n\n满足条件后，您可以通过券商的APP或交易软件在线申请开通。具体流程可能因券商而异，建议咨询您的开户券商获取详细指引。'
      },
      {
          question: '可转债是什么？它为什么适合普通人投资？',
          answer: '可转债是上市公司发行的一种特殊债券。您可以将其理解为一张“附带股票期权的借条”。\n\n   债性（保底）： 作为债券，它承诺到期归还本金并支付利息，提供了基础的安全性。\n   股性（增值）： 它允许持有者在特定条件下，按约定价格（转股价）将其转换为公司股票，从而在公司股价上涨时享受收益。\n\n正是这种“下有保底，上不封顶”的特性，使其成为一种攻守兼备、非常适合普通投资者入门的品种。'
      },
      {
          question: '投资可转债需要了解哪些核心规则？',
          answer: '理解可转债的四个核心条款至关重要，它们决定了可转债的价值变化：\n \n1.  转股价： 决定一张可转债能换多少股股票（换股数量 = 100 / 转股价）。\n \n2.  下修条款： 当股价长期低于转股价时，公司有权下调转股价，以提高转股吸引力。这对投资者是利好。\n \n3.  强赎条款： 当股价长期高于转股价一定幅度（通常是130%）时，公司有权以较低价格（如103元）强制赎回。这是为了“逼迫”投资者转股或卖出，是重要的获利了结信号。\n \n4.  回售条款： 当股价长期低于转股价一定幅度（通常是70%）时，投资者有权以约定价格（如101-103元）将可转债卖还给公司。这是保护投资者的最后一道防线。'
      },
      {
          question: '什么是“转股溢价率”？为什么它很重要？',
          answer: '转股溢价率是衡量可转债价格相对于其内在股票价值高出多少的指标。\n\n公式： 转股溢价率 = (转债价格 - 转股价值) / 转股价值 * 100%\n\n   溢价率越低： 说明转债价格与其股票价值越接近，股性越强，正股上涨时跟涨能力也越强。\n   溢价率越高： 说明转债价格中“债性”和“期权”的成分更多，股性越弱，受正股影响较小，相对更抗跌。\n\n本策略的核心之一就是寻找低溢价率的品种，以期获得更高的上涨弹性。'
      },
      {
          question: '投资可转债可能面临哪些主要风险？',
          answer: '主要有以下两类风险：\n\n1.  违约风险： 发行公司基本面恶化，无力偿还本金和利息。通常选择高评级（如AA级及以上）的可转债并进行分散投资，可以有效降低此风险。\n\n2.  机会成本风险： 如果持有至到期，可转债的票面利率通常很低，收益可能跑不赢通胀。本策略通过积极的轮动交易，旨在避免这种情况，追求更高的超额收益。'
      }
  ])

  // --- ECharts 图表逻辑 ---
  const performanceViewMode = ref<'rate' | 'amount'>('rate')
  const initialPrincipal = 10000
  const performanceChartContainer = ref<HTMLElement | null>(null)
  let performanceChart: echarts.ECharts | null = null

  // 模拟的历史业绩数据 (为可转债策略调整了适中的波动性)
  const performanceData = ref([
      { date: '2022-01-01', strategy: 1.0 },
      { date: '2022-02-01', strategy: 1.02 },
      { date: '2022-03-01', strategy: 0.98 },
      { date: '2022-04-01', strategy: 1.04 },
      { date: '2022-05-01', strategy: 1.03 },
      { date: '2022-06-01', strategy: 1.08 },
      { date: '2022-07-01', strategy: 1.07 },
      { date: '2022-08-01', strategy: 1.1 },
      { date: '2022-09-01', strategy: 1.08 },
      { date: '2022-10-01', strategy: 1.12 },
      { date: '2022-11-01', strategy: 1.15 },
      { date: '2022-12-01', strategy: 1.14 },
      { date: '2023-01-01', strategy: 1.18 },
      { date: '2023-02-01', strategy: 1.17 },
      { date: '2023-03-01', strategy: 1.22 },
      { date: '2023-04-01', strategy: 1.25 },
      { date: '2023-05-01', strategy: 1.23 },
      { date: '2023-06-01', strategy: 1.28 }
  ])

  const updatePerformanceChart = () => {
      if (!performanceChartContainer.value) return
      if (!performanceChart) {
          performanceChart = echarts.init(performanceChartContainer.value, 'dark')
      }

      let seriesData: number[]
      let yAxisFormatter: string
      let tooltipFormatter: (params: any) => string
      let seriesName: string

      if (performanceViewMode.value === 'rate') {
          seriesName = '累计收益率'
          seriesData = performanceData.value.map(item => (item.strategy - 1) * 100)
          yAxisFormatter = '{value}%'
          tooltipFormatter = (params: any) =>
              `<strong>${params[0].name}</strong><br/>${params[0].marker} ${
                  params[0].seriesName
              }: <strong>${params[0].value.toFixed(2)}%</strong>`
      } else {
          seriesName = '累计收益金额'
          seriesData = performanceData.value.map(item => item.strategy * initialPrincipal)
          yAxisFormatter = '{value} 元'
          tooltipFormatter = (params: any) =>
              `<strong>${params[0].name}</strong><br/>${params[0].marker} ${
                  params[0].seriesName
              }: <strong>${params[0].value.toFixed(2)} 元</strong>`
      }

      const option: echarts.EChartsOption = {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis', formatter: tooltipFormatter },
          legend: { data: [seriesName], textStyle: { color: '#ccc' }, bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
          xAxis: {
              type: 'category',
              boundaryGap: false,
              data: performanceData.value.map(item => item.date),
              axisLine: { lineStyle: { color: '#8392A5' } }
          },
          yAxis: {
              type: 'value',
              axisLabel: { formatter: yAxisFormatter, color: '#ccc' },
              splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
          },
          series: [
              {
                  name: seriesName,
                  type: 'line',
                  smooth: true,
                  showSymbol: false,
                  data: seriesData,
                  itemStyle: { color: '#add8e6' }, // 主题色
                  lineStyle: { width: 3 },
                  areaStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                          {
                              offset: 0,
                              color: 'rgba(173, 216, 230, 0.3)' // 主题色渐变
                          },
                          {
                              offset: 1,
                              color: 'rgba(173, 216, 230, 0)'
                          }
                      ])
                  }
              }
          ]
      }

      performanceChart.setOption(option, true)
  }

  watch(performanceViewMode, () => {
      updatePerformanceChart()
  })

  onMounted(() => {
      updatePerformanceChart()
  })
</script>

<style scoped>
  /* 继承并主题化页面样式 */
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      /* 背景渐变使用主题色相关色调 */
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #2a3a4a, transparent 40%), #121212;
  }

  .main-container {
      max-width: 900px;
      margin: 0 auto;
  }

  /* 页面头部 */
  .page-header {
      text-align: center;
      margin-bottom: 3rem;
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
      color: #add8e6; /* 主题色 */
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
      color: #add8e6; /* 主题色 */
      text-shadow: 0 0 15px #add8e6; /* 主题色 */
  }
  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  /* 内容网格和卡片 */
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
      transition: border-color 0.3s ease;
  }
  .content-card:hover {
      border-color: rgba(173, 216, 230, 0.5); /* 主题色 */
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #add8e6; /* 主题色 */
      padding-left: 1rem;
  }

  /* 图表卡片样式 */
  .card-header-with-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
  }
  .card-title.no-border {
      border-left: none;
      padding-left: 0;
      margin-bottom: 0;
  }
  .view-toggle-container {
      display: flex;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 4px;
  }
  .toggle-button {
      padding: 0.4rem 0.8rem;
      cursor: pointer;
      background: transparent;
      border: none;
      color: #b0c4de;
      font-size: 0.85rem;
      border-radius: 6px;
      transition: all 0.3s ease;
  }
  .toggle-button.active {
      background-color: #add8e6; /* 主题色 */
      color: #121212; /* 使用深色文字以保证对比度 */
      font-weight: bold;
      box-shadow: 0 0 10px rgba(173, 216, 230, 0.5); /* 主题色 */
  }
  .echart-container {
      width: 100%;
      height: 350px;
      margin-top: 1rem;
  }

  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
  }
  .idea-list {
      list-style-type: none;
      padding-left: 0;
  }
  .idea-list li {
      color: #b0c4de;
      line-height: 1.8;
      padding-left: 1.5rem;
      position: relative;
      margin-bottom: 0.5rem;
  }
  .idea-list li::before {
      content: '✔';
      position: absolute;
      left: 0;
      color: #add8e6; /* 主题色 */
  }

  /* --- 新增样式 --- */
  .card-subtitle {
      font-size: 1.1rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 2rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
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
      color: #5cb85c;
  }
  .adjustment-title.sell {
      color: #d9534f;
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
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: bold;
      color: #fff;
  }
  .action-badge.buy {
      background-color: rgba(92, 184, 92, 0.7);
  }
  .action-badge.sell {
      background-color: rgba(217, 83, 79, 0.7);
  }

  .table-wrapper {
      overflow-x: auto; /* 保证表格在小屏幕上可以滚动 */
  }
  .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0; /* 被 card-subtitle 的 margin-bottom 替代 */
  }
  .data-table.portfolio-table {
      table-layout: fixed;
  }
  .data-table th,
  .data-table td {
      padding: 0.8rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap; /* 防止表格内容换行 */
  }
  .data-table th {
      color: #ffffff;
      font-weight: bold;
      font-size: 0.9rem;
  }
  .data-table td {
      color: #b0c4de;
  }
  .data-table tr:last-child td {
      border-bottom: none;
  }

  /* 估值标签样式 (复用) */
  .valuation-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: bold;
      color: #fff;
  }
  .valuation-badge.low {
      background-color: rgba(40, 167, 69, 0.5);
  }
  .valuation-badge.reasonable {
      background-color: rgba(0, 123, 255, 0.5);
  }
  .valuation-badge.high {
      background-color: rgba(220, 53, 69, 0.5);
  }

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
      color: #add8e6; /* 主题色 */
  }
  .faq-icon.is-open {
      transform: rotate(45deg);
  }
  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  @media (max-width: 768px) {
      .content-card {
          padding: 1.5rem;
      }
      .card-header-with-toggle {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
      }
      .adjustments-grid {
          grid-template-columns: 1fr; /* 在小屏幕上，调入调出列表垂直排列 */
          gap: 1.5rem;
      }
  }
</style>