<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
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

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 风险告知 -->
        <div class="content-card risk-warning-card">
          <h2 class="card-title">极端风险警告</h2>
          <p class="card-description">
            微盘股策略是所有策略中风险等级最高的。该策略所追踪的指数成分股普遍规模小、基本面不确定性强，导致整体波动极为剧烈，可能在短期内出现超过50%甚至更多的净值回撤。同时，成分股的流动性风险可能传导至策略本身。<strong>本策略只适合风险承受能力极强的投资者，且投入资金必须是完全可以承受损失的闲钱。</strong>
          </p>
        </div>

        <!-- 组合思想 -->
        <div class="content-card">
          <h2 class="card-title">组合思想：量化追踪，纪律执行</h2>
          <p class="card-description">
            本策略并非主动挖掘个股，而是通过量化模型紧密追踪<b>万得微盘股指数</b>，旨在系统性地捕获A股市场的“规模因子”溢价。
          </p>
          <ul class="idea-list">
            <li><b>规模因子溢价：</b> 学术与历史数据均表明，长期来看，小市值公司的整体回报率倾向于超越大市值公司。本策略的目标正是捕获这种由“规模”这一因子本身带来的系统性超额收益。</li>
            <li><b>指数化追踪：</b> 策略严格对标<b>万得微盘指数</b>。放弃对“明星股”的寻找，转而持有代表整个微盘股板块的一揽子组合，以规避个股的非系统性风险（如“踩雷”），确保收益来源的稳定性。</li>
            <li><b>每日动态再平衡：</b> 模型于<b>每个交易日</b>进行调仓。这种高频的再平衡机制，确保了策略能紧密跟随指数的成分变化，并及时捕捉市场动量，是策略获取阿尔法收益的关键环节。</li>
            <li><b>作为“卫星”配置：</b> 鉴于微盘股的高波动特性，它适合作为投资组合中的“卫星”部分，用以增强整体收益弹性。建议配置比例不超过总投资资产的10%，并做好长期持有的准备。</li>
          </ul>
        </div>

        <!-- 推荐投资组合 -->
        <!-- <div class="content-card">
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
        </div> -->

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
            下图展示了微盘股策略的模拟累计收益曲线。其高波动、高弹性特征非常明显。数据为模拟，不代表真实收益。
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
  import { ref, onMounted, watch } from 'vue'
  import * as echarts from 'echarts'

  // --- 控制FAQ展开 ---
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }

  const faqList = ref([
      {
          question: '我如何参与到微盘股策略？',
          answer: '由于本策略涉及每日对几十只成分股进行高频调仓，个人投资者手动操作几乎无法实现。强行手动跟踪会因执行延迟导致严重的跟踪误差，无法真正复制策略的效果。因此，我们不建议个人尝试手动执行此策略。\n\n对于希望配置微盘股因子的投资者，更可行的方式是借助专业的金融产品。目前，市场上如“诺安多策略”等少数公募基金产品，其投资方向与微盘股指数较为贴近。请注意：这不构成投资建议，基金产品策略可能变更，投资前请务必自行充分研究并了解相关风险。'
      },
      {
          question: '微盘股和小盘股有什么区别？',
          answer: '在量化投资中，它们主要通过市值排名来区分。通常，市值排名在后5%或后10%的公司股票被定义为“微盘股”，而“小盘股”的范围则更广一些（例如市值排名在后30%）。本策略追踪的万得微盘指数，正是由A股市场中市值最小的400支股票构成，代表性强。'
      },
      {
          question: '为什么不推荐自己挑选微盘股？',
          answer: '因为本策略的核心理念是赚取整个板块的钱（贝塔收益），而不是单一个股的钱。个人挑选微盘股面临两大难题：\n\n1）“踩雷”风险极高：微盘股基本面脆弱，个股退市或暴跌风险巨大。\n\n2）难以把握因子：很难通过个人判断来系统性地捕获“规模因子”带来的长期溢价。而通过追踪指数进行纪律化投资，是分享微盘股整体红利的最优解。'
      },
      {
          question: '我应该在投资组合中配置多少比例的微盘股策略？',
          answer: '强烈建议将其作为“卫星配置”。对于稳健型投资者，建议配置比例不超过总资产的10%；对于积极型投资者，可考虑10%-20%。这笔投资必须是您长期不用的闲钱，并且您需要有承受其巨大波动的心理准备。'
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