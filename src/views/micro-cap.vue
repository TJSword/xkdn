<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <a href="#" class="back-button">← 返回主页</a>
        <h1 class="main-title">
          <span class="title-icon">💎</span>
          微盘股策略
        </h1>
        <p class="subtitle">
          在市场的角落，挖掘未来的巨人。
        </p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 风险告知 -->
        <div class="content-card risk-warning-card">
          <h2 class="card-title">极端风险警告</h2>
          <p class="card-description">
            微盘股策略是所有策略中风险等级最高的。这类公司规模小，业务不确定性强，股价波动极为剧烈，可能在短期内出现超过50%甚至更多的跌幅。同时，部分微盘股流动性较差，可能面临买卖困难的风险。<strong>此策略只适合风险承受能力极强的投资者，且投入资金必须是完全可以承受损失的闲钱。</strong>
          </p>
        </div>

        <!-- 组合思想 -->
        <div class="content-card">
          <h2 class="card-title">组合思想：寻找“小而美”</h2>
          <p class="card-description">
            该策略基于“规模溢价”理论，即从历史数据看，小市值公司的长期回报率倾向于超越大市值公司。核心在于投资那些尚未被市场充分关注、但具备高成长潜力的小型企业。
          </p>
          <ul class="idea-list">
            <li><b>高风险，高回报：</b> 接受巨大的波动性，以换取捕捉到下一支“明星股”的机会，从而获得超额收益。</li>
            <li><b>分散化是关键：</b> 由于单个微盘股失败风险极高，因此绝不应重仓单一个股。通过投资一篮子微盘股的指数基金来分散个股风险，是普通投资者参与的唯一理性方式。</li>
            <li><b>作为“卫星”配置：</b> 微盘股策略通常不作为投资组合的核心，而是作为提升整体潜在回报的“卫星”部分，仓位不宜过高（例如，不超过总资产的10%）。</li>
          </ul>
        </div>

        <!-- 推荐投资组合 -->
        <div class="content-card">
          <h2 class="card-title">示例投资组合</h2>
          <p class="card-description">直接通过指数基金来捕获整个微盘股市场的平均回报是首选。以下是一些代表性的微盘股指数。</p>
          <table class="data-table">
            <thead>
              <tr>
                <th>指数名称</th>
                <th>基金代码</th>
                <th>基金名称</th>
                <th>特点</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>中证2000</td>
                <td>--</td>
                <td>中证2000ETF</td>
                <td>代表A股市场中市值最小的一批公司</td>
              </tr>
              <tr>
                <td>国证2000</td>
                <td>--</td>
                <td>国证2000ETF</td>
                <td>同样覆盖A股小微盘，范围更广</td>
              </tr>
              <tr>
                <td>罗素2000 (美股)</td>
                <td>--</td>
                <td>罗素2000相关QDII基金</td>
                <td>代表美国市场的小型公司</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 历史业绩与收益曲线卡片 -->
        <div class="content-card">
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
            下图展示了微盘股策略的模拟累计收益曲线。其高波动、高弹性特征非常明显。数据为模拟，不代表真实收益。
          </p>
          <div ref="performanceChartContainer" class="echart-container"></div>
        </div>

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
  import { ref, onMounted, watch } from 'vue'
  import * as echarts from 'echarts'

  // --- 控制FAQ展开 ---
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }

  const faqList = ref([
      {
          question: '微盘股和小盘股有什么区别？',
          answer: '通常，微盘股的市值比小盘股还要小一个量级。例如，如果说小盘股是指市场上市值排名后20%的公司，那么微盘股可能指排名后5%的公司。它们的规模更小，不确定性更高，因此风险和潜在回报也更大。'
      },
      {
          question: '为什么不推荐自己挑选微盘股？',
          answer: '个人投资者很难对数量庞大的微盘股进行深入研究，信息获取也处于劣势。许多微盘股公司最终会经营失败，押注单一个股的风险极高。通过指数基金，您可以以低成本持有数百甚至上千家微盘股，有效分散了个股的“爆雷”风险。'
      },
      {
          question: '我应该在投资组合中配置多少比例的微盘股策略？',
          answer: '这完全取决于您的个人风险承受能力。作为一个高风险的“卫星”策略，大多数财务顾问会建议将其比例控制在总投资组合的5%到10%以内。对于保守的投资者，这个比例应该更低，甚至为零。'
      },
      {
          question: '这个策略需要择时吗？',
          answer: '虽然微盘股在市场牛市后期可能表现疯狂，但精确择时非常困难。一种更稳妥的方法是，在整体市场处于相对低位时开始定投，长期坚持。避免在市场极度狂热时追高买入是重要的风控手段。'
      }
  ])

  // --- ECharts 图表逻辑 ---
  const performanceViewMode = ref<'rate' | 'amount'>('rate')
  const initialPrincipal = 10000
  const performanceChartContainer = ref<HTMLElement | null>(null)
  let performanceChart: echarts.ECharts | null = null

  // 模拟的历史业绩数据 (为微盘股策略调整了更高的波动性)
  const performanceData = ref([
      { date: '2022-01-01', strategy: 1.0 },
      { date: '2022-02-01', strategy: 1.1 },
      { date: '2022-03-01', strategy: 0.85 },
      { date: '2022-04-01', strategy: 1.15 },
      { date: '2022-05-01', strategy: 1.0 },
      { date: '2022-06-01', strategy: 1.25 },
      { date: '2022-07-01', strategy: 1.18 },
      { date: '2022-08-01', strategy: 1.35 },
      { date: '2022-09-01', strategy: 1.15 },
      { date: '2022-10-01', strategy: 1.4 },
      { date: '2022-11-01', strategy: 1.6 },
      { date: '2022-12-01', strategy: 1.5 },
      { date: '2023-01-01', strategy: 1.8 },
      { date: '2023-02-01', strategy: 1.7 },
      { date: '2023-03-01', strategy: 1.9 },
      { date: '2023-04-01', strategy: 1.75 },
      { date: '2023-05-01', strategy: 2.0 },
      { date: '2023-06-01', strategy: 1.85 }
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
                  itemStyle: { color: '#f0e68c' }, // 主题色
                  lineStyle: { width: 3 },
                  areaStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                          {
                              offset: 0,
                              color: 'rgba(240, 230, 140, 0.3)' // 主题色渐变
                          },
                          {
                              offset: 1,
                              color: 'rgba(240, 230, 140, 0)'
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
      color: #f0e68c; /* 主题色 */
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
      color: #f0e68c; /* 主题色 */
      text-shadow: 0 0 15px #f0e68c; /* 主题色 */
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
      border-color: rgba(240, 230, 140, 0.5); /* 主题色 */
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #f0e68c; /* 主题色 */
      padding-left: 1rem;
  }

  /* 风险卡片特殊样式 */
  .risk-warning-card {
      border-left-color: #dc3545; /* 使用更强的红色作为警告 */
  }
  .risk-warning-card .card-title {
      border-left-color: #dc3545; /* 标题也用红色 */
  }
  .risk-warning-card .card-title::before {
      content: '⚠️';
      margin-right: 0.75rem;
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
      background-color: #f0e68c; /* 主题色 */
      color: #121212; /* 使用深色文字以保证对比度 */
      font-weight: bold;
      box-shadow: 0 0 10px rgba(240, 230, 140, 0.5); /* 主题色 */
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
      color: #f0e68c; /* 主题色 */
  }

  .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5rem;
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
      font-size: 0.9rem;
  }
  .data-table td {
      color: #b0c4de;
  }
  .data-table tr:last-child td {
      border-bottom: none;
  }
  .data-table td:nth-child(2),
  .data-table td:last-child {
      font-weight: bold;
      color: #fff;
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
      color: #f0e68c; /* 主题色 */
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
  }
</style>