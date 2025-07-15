<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <a href="#" class="back-button">← 返回主页</a>
        <h1 class="main-title">
          <span class="title-icon">❂</span>
          全天候策略
        </h1>
        <p class="subtitle">
          无论经济风云如何变幻，都力求稳健前行。
        </p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 策略简介 (无变化) -->
        <div class="content-card">
          <h2 class="card-title">策略简介</h2>
          <p class="card-description">
            全天候策略（All-Weather
            Strategy）是由桥水基金创始人瑞·达利欧所创。其核心思想是，通过持有一系列经过精心配置且不相关的资产，构建一个能够在任何经济环境（经济增长、经济衰退、高通胀、低通胀）下都能有相对稳健表现的投资组合，目标不是追求最高收益，而是实现长期的、平滑的财富增长。
          </p>
        </div>

        <!-- 组合思路 (无变化) -->
        <div class="content-card">
          <h2 class="card-title">组合思路</h2>
          <p class="card-description">
            全天候策略的精髓在于平衡风险，而非平衡资本。它将资产根据在不同“经济季节”中的表现进行分类配置，以对冲不同宏观环境带来的风险。
          </p>
          <ul class="idea-list">
            <li><b>增长超预期 ⇒</b> 配置股票等风险资产</li>
            <li><b>增长低预期 ⇒</b> 配置国债等避险资产</li>
            <li><b>通胀超预期 ⇒</b> 配置通胀挂钩债券、大宗商品</li>
            <li><b>通胀低预期 ⇒</b> 配置股票、普通国债</li>
          </ul>
          <p class="card-description">通过将资产分散到这四种情景中，无论未来发生什么，投资组合的波动性都将被有效降低。</p>
        </div>

        <!-- 投资组合配置 (无变化) -->
        <div class="content-card">
          <h2 class="card-title">投资组合配置</h2>
          <div class="tabs-container">
            <button :class="['tab-button', { active: activeTab === 'on-exchange' }]" @click="activeTab = 'on-exchange'">
              场内配置 (ETFs)
            </button>
            <button :class="['tab-button', { active: activeTab === 'off-exchange' }]" @click="activeTab = 'off-exchange'">
              场外配置 (公募基金)
            </button>
          </div>

          <!-- Tabs 内容... (无变化) -->
          <div v-if="activeTab === 'on-exchange'" class="tab-content">
            <p class="card-description">适合有证券账户、偏好低费率和灵活交易的投资者。</p>
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>资产类别</th>
                  <th>建议配置比例</th>
                  <th>示例ETF</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>股票资产</td>
                  <td>30%</td>
                  <td>沪深300ETF / 标普500ETF</td>
                </tr>
                <tr>
                  <td>长期国债</td>
                  <td>40%</td>
                  <td>20年+超长期国债ETF</td>
                </tr>
                <tr>
                  <td>中期国债</td>
                  <td>15%</td>
                  <td>7-10年中期国债ETF</td>
                </tr>
                <tr>
                  <td>大宗商品 (黄金)</td>
                  <td>15%</td>
                  <td>黄金ETF</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="activeTab === 'off-exchange'" class="tab-content">
            <p class="card-description">适合希望定投、没有证券账户的投资者，申赎便利。</p>
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>资产类别</th>
                  <th>建议配置比例</th>
                  <th>示例基金类型</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>股票型基金</td>
                  <td>30%</td>
                  <td>沪深300指数基金 / 全球股票指数基金</td>
                </tr>
                <tr>
                  <td>长期纯债基金</td>
                  <td>40%</td>
                  <td>投资于长久期利率债的债券基金</td>
                </tr>
                <tr>
                  <td>中短期纯债基金</td>
                  <td>15%</td>
                  <td>投资于中短久期利率债的债券基金</td>
                </tr>
                <tr>
                  <td>黄金基金 (QDII)</td>
                  <td>15%</td>
                  <td>投资于海外黄金ETF的联接基金</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== 已修改的卡片：历史业绩与收益曲线 ==================== -->
        <div class="content-card">
          <div class="card-header-with-toggle">
            <h2 class="card-title no-border">历史业绩</h2>
            <!-- 新增的视图切换按钮 -->
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
            下图展示了全天候策略的模拟累计收益曲线。请注意，数据为模拟回测，仅用于说明策略特性，不代表真实收益。
          </p>
          <!-- ECharts 图表容器 -->
          <div ref="performanceChartContainer" class="echart-container"></div>
        </div>
        <!-- ===================================================================== -->

        <!-- 动态再平衡 (无变化) -->
        <div class="content-card">
          <h2 class="card-title">动态再平衡 (Rebalancing)</h2>
          <p class="card-description">
            由于市场波动，各类资产的比例会偏离初始目标。再平衡是指定期（如每半年或一年）或按比例（如偏离5%）将投资组合恢复到目标配置的操作。这是确保策略长期有效的核心纪律。
          </p>
          <button class="rebalance-cta">
            前往再平衡工具 🛠️
          </button>
        </div>

        <!-- FAQ (无变化) -->
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

  // --- 控制Tabs和FAQ (无变化) ---
  const activeTab = ref<'on-exchange' | 'off-exchange'>('on-exchange')
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
  const faqList = ref([
      {
          question: '我应该多久进行一次再平衡？',
          answer: '没有绝对的答案。常见的做法是基于时间的（如每季度、每半年或每年）或基于阈值的（当任一资产类别偏离其目标权重超过某个百分比，如5%时）。对于普通投资者，每年检查一次是合理的起点。'
      },
      {
          question: '全天候策略适合我吗？',
          answer: '该策略特别适合风险偏好较低、追求长期稳定回报、不希望花费大量时间预测市场的投资者。如果您的目标是短期内获得高收益，或能够承受较高的波动性，那么其他策略可能更适合您。'
      },
      {
          question: '这个策略有什么风险？',
          answer: '虽然全天候策略旨在降低风险，但它并非没有风险。在所有资产类别都表现不佳的极端市场环境下（如滞胀初期），组合仍可能出现亏损。此外，它在长期牛市中的表现可能会落后于100%的股票投资组合。'
      },
      {
          question: '我可以直接复制这个配置吗？',
          answer: '这里的配置仅为示例，用于阐述策略原理。实际投资前，您应根据自身的风险承受能力、投资目标以及可投资的品种进行调整。务必进行独立研究，或咨询专业的财务顾问。'
      }
  ])

  // ==================== 修改后：ECharts 图表逻辑 ====================

  // 1. 新增：控制图表视图的响应式变量，默认为 'rate' (收益率)
  const performanceViewMode = ref<'rate' | 'amount'>('rate')

  // 2. 新增：假设的初始本金，用于计算收益金额
  const initialPrincipal = 10000

  // 3. 图表容器引用和实例
  const performanceChartContainer = ref<HTMLElement | null>(null)
  let performanceChart: echarts.ECharts | null = null

  // 4. 模拟的历史业绩数据 (日期, 策略累计净值)
  const performanceData = ref([
      { date: '2022-01-01', strategy: 1.0 },
      { date: '2022-02-01', strategy: 1.01 },
      { date: '2022-03-01', strategy: 0.99 },
      { date: '2022-04-01', strategy: 1.02 },
      { date: '2022-05-01', strategy: 1.03 },
      { date: '2022-06-01', strategy: 1.05 },
      { date: '2022-07-01', strategy: 1.04 },
      { date: '2022-08-01', strategy: 1.06 },
      { date: '2022-09-01', strategy: 1.05 },
      { date: '2022-10-01', strategy: 1.07 },
      { date: '2022-11-01', strategy: 1.09 },
      { date: '2022-12-01', strategy: 1.1 },
      { date: '2023-01-01', strategy: 1.12 },
      { date: '2023-02-01', strategy: 1.11 },
      { date: '2023-03-01', strategy: 1.13 },
      { date: '2023-04-01', strategy: 1.15 },
      { date: '2023-05-01', strategy: 1.14 },
      { date: '2023-06-01', strategy: 1.16 }
  ])

  /**
   * 更新或初始化业绩图表的核心函数
   */
  const updatePerformanceChart = () => {
      if (!performanceChartContainer.value) return

      // 如果图表实例不存在，则初始化
      if (!performanceChart) {
          performanceChart = echarts.init(performanceChartContainer.value, 'dark')
      }

      let seriesData: number[]
      let yAxisFormatter: string
      let tooltipFormatter: (params: any) => string
      let seriesName: string

      // 根据当前视图模式，准备不同的数据和格式化配置
      if (performanceViewMode.value === 'rate') {
          seriesName = '累计收益率'
          seriesData = performanceData.value.map(item => (item.strategy - 1) * 100)
          yAxisFormatter = '{value}%'
          tooltipFormatter = (params: any) =>
              `<strong>${params[0].name}</strong><br/>${params[0].marker} ${
                  params[0].seriesName
              }: <strong>${params[0].value.toFixed(2)}%</strong>`
      } else {
          // 'amount'
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
                  itemStyle: { color: '#00aaff' },
                  lineStyle: { width: 3 },
                  areaStyle: {
                      // 添加渐变区域填充
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                          {
                              offset: 0,
                              color: 'rgba(0, 170, 255, 0.3)'
                          },
                          {
                              offset: 1,
                              color: 'rgba(0, 170, 255, 0)'
                          }
                      ])
                  }
              }
          ]
      }

      // 使用 setOption 更新图表
      performanceChart.setOption(option, true) // true 表示不与之前的 option 合并
  }

  // 侦听视图模式的变化，并更新图表
  watch(performanceViewMode, () => {
      updatePerformanceChart()
  })

  // 在组件挂载后，首次初始化图表
  onMounted(() => {
      updatePerformanceChart()
  })
</script>

<style scoped>
  /* 继承主页风格 */
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
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
  }
  .title-icon {
      font-size: 2.8rem;
      color: #00aaff;
      text-shadow: 0 0 15px #00aaff;
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
      border-color: rgba(0, 170, 255, 0.5);
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #00aaff;
      padding-left: 1rem;
  }

  /* 新增：用于包含切换按钮的卡片头部 */
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

  /* 新增：视图切换按钮容器和按钮样式 */
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
      background-color: #00aaff;
      color: #ffffff;
      font-weight: bold;
      box-shadow: 0 0 10px rgba(0, 170, 255, 0.5);
  }

  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
      margin-bottom: 1rem;
  }
  .idea-list {
      list-style-type: '✔ ';
      padding-left: 1.5rem;
      color: #b0c4de;
      line-height: 1.8;
  }

  /* Tabs 样式 */
  .tabs-container {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1.5rem;
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
      border-bottom-color: #00aaff;
      font-weight: bold;
  }
  .tab-button:hover:not(.active) {
      background-color: rgba(255, 255, 255, 0.1);
  }

  /* 表格样式 */
  .portfolio-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
  }
  .portfolio-table th,
  .portfolio-table td {
      padding: 0.8rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .portfolio-table th {
      color: #ffffff;
      font-weight: bold;
      font-size: 0.9rem;
  }
  .portfolio-table td {
      color: #b0c4de;
  }
  .portfolio-table tr:last-child td {
      border-bottom: none;
  }
  .portfolio-table td:nth-child(2) {
      font-weight: bold;
      color: #fff;
  }

  /* 再平衡CTA */
  .rebalance-cta {
      background-color: #00aaff;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.8rem 2rem;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 0 15px rgba(0, 170, 255, 0.3);
      margin-top: 1rem;
  }
  .rebalance-cta:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 20px rgba(0, 170, 255, 0.5);
  }

  /* FAQ 样式 */
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
      color: #00aaff;
  }
  .faq-icon.is-open {
      transform: rotate(45deg);
  }
  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  /* EChart容器样式 */
  .echart-container {
      width: 100%;
      height: 350px;
      margin-top: 1rem;
  }

  /* 响应式 */
  @media (max-width: 768px) {
      .main-title {
          font-size: 2rem;
      }
      .content-card {
          padding: 1.5rem;
      }
      .tab-button {
          padding: 0.75rem;
          font-size: 0.9rem;
      }
      .card-header-with-toggle {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
      }
  }
</style>