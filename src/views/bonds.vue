<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <a href="#" class="back-button">← 返回主页</a>
        <h1 class="main-title">
          <span class="title-icon">🔄</span>
          可转债策略
        </h1>
        <p class="subtitle">
          攻守兼备，穿越牛熊的投资艺术。
        </p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 策略简介 -->
        <div class="content-card">
          <h2 class="card-title">策略简介</h2>
          <p class="card-description">
            可转换公司债券（Convertible
            Bond）是一种特殊的债券，它允许持有者在特定时间内，按特定价格将其转换为发行公司的普通股。这赋予了它独特的“债股双性”：当公司股价上涨时，它可以像股票一样享受高增长；当股价下跌时，它仍能像债券一样提供固定的票息和到期本金，形成“下有保底，上不封顶”的独特优势。
          </p>
        </div>

        <!-- 组合思想 -->
        <div class="content-card">
          <h2 class="card-title">组合思想：低价买入，静待花开</h2>
          <p class="card-description">
            本策略的核心是在保证足够安全边际的前提下，捕捉正股上涨带来的超额收益。
          </p>
          <ul class="idea-list">
            <li><b>价格保底：</b> 优先选择价格较低（如110元以下）的可转债，使其更接近纯债价值，提供强大的下跌保护。</li>
            <li><b>低溢价：</b> 寻找转股溢价率较低的品种，这意味着转债价格与正股价格的偏离度小，正股上涨时转债的跟涨能力更强。</li>
            <li><b>分散投资：</b> 由于单只转债可能面临正股退市或公司信用风险，因此必须通过构建一个包含10-20只不同转债的组合来分散风险。</li>
            <li><b>博弈下修和强赎：</b> 在熊市中博弈发行人“下修转股价”带来的脉冲机会；在牛市中享受正股上涨和“强赎”预期带来的双重驱动。</li>
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
                <td>到期收益率 (YTM)</td>
                <td>持有至到期能获得的年化收益率，是最终的兜底保障。</td>
                <td><span class="valuation-badge reasonable">越高越好 (正数)</span></td>
              </tr>
              <tr>
                <td>债券余额</td>
                <td>尚未转股的债券规模。规模太小可能流动性差。</td>
                <td><span class="valuation-badge reasonable">> 1亿</span></td>
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
            下图展示了可转债策略的模拟累计收益曲线。可见其波动小于纯股策略，但长期回报优于纯债策略。数据为模拟，不代表真实收益。
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
          question: '什么是“强制赎回”（强赎）？',
          answer: '当发行公司的股价在一段时间内持续高于转股价的一定比例（通常是130%）时，公司有权以一个较低的价格（如103元）提前赎回全部未转股的债券。这会“逼迫”投资者要么卖出转债，要么转换为股票来避免损失，是牛市中转债价格上涨的重要催化剂。'
      },
      {
          question: '什么是“回售”？',
          answer: '与强赎相反，回售是保护投资者的条款。当公司股价在一段时间内持续低于转股价的一定比例（如70%）时，投资者有权以一个约定的价格（如100元+当期利息）将转债卖回给公司。这是熊市中重要的兜底条款之一。'
      },
      {
          question: '投资可转债最大的风险是什么？',
          answer: '最大的风险主要有两个：一是正股价格长期低迷，导致转债的“股性”无法体现，最终只能获得微薄的债券利息；二是公司信用风险，即发行方违约无法偿还本息，虽然罕见但存在可能。因此，分散投资和选择基本面稳健的公司至关重要。'
      },
      {
          question: '我应该如何交易可转债？',
          answer: '可转债在中国市场上市，可以通过任何一个标准的股票账户进行交易，操作与买卖股票完全相同。'
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
  }
</style>