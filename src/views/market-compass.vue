<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <span class="title-icon">🧭</span>
          市场罗盘
        </h1>
        <p class="subtitle">
          以宏观数据为锚，穿越市场迷雾。
        </p>
      </div>

      <!-- 2. 指标图表网格 -->
      <div class="content-grid">

        <!-- 卡片1: 巴菲特指标 -->
        <div class="content-card">
          <h2 class="card-title">巴菲特指标 (A股总市值 / GDP)</h2>
          <p class="card-description">
            这是衡量股市整体估值水平的核心指标之一。当指标值远高于历史均值时，市场可能处于高估区域，风险较大；反之则可能处于低估区域，具备长期投资价值。
          </p>
          <div ref="buffettChartContainer" class="echart-container"></div>
        </div>

        <!-- 卡片2: 股债利差 (ERP) -->
        <div class="content-card">
          <h2 class="card-title">股债利差 (万得全A滚动市盈率倒数 - 十年期国债收益率)</h2>
          <p class="card-description">
            该指标反映了投资于股市相对于无风险国债的超额回报预期。利差越高，意味着股票相对于债券越便宜，吸引力越大；利差越低，则股票越贵。
          </p>
          <div ref="erpChartContainer" class="echart-container"></div>
        </div>

        <!-- 卡片3: 行业拥挤度 -->
        <div class="content-card">
          <h2 class="card-title">行业拥挤度</h2>
          <p class="card-description">
            通过分析特定行业成交额占全市场总成交额的比例，我们可以观察资金的流向。当某个行业的拥挤度持续处于高位时，可能意味着情绪过热，存在短期回调风险。
          </p>
          <div ref="crowdingChartContainer" class="echart-container"></div>
        </div>

        <!-- 卡片4: 行业景气度/估值 -->
        <div class="content-card">
          <h2 class="card-title">行业估值温度</h2>
          <p class="card-description">
            此图表展示了当前各主流行业的市盈率（PE-TTM）在其过去十年历史估值中所处的位置。温度越“冷”，代表估值越低，越接近历史底部；温度越“热”，则代表估值越高。
          </p>
          <div ref="valuationChartContainer" class="echart-container"></div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import * as echarts from 'echarts'

  // --- Refs for ECharts containers ---
  const buffettChartContainer = ref<HTMLElement | null>(null)
  const erpChartContainer = ref<HTMLElement | null>(null)
  const crowdingChartContainer = ref<HTMLElement | null>(null)
  const valuationChartContainer = ref<HTMLElement | null>(null)

  // --- ECharts instances ---
  let buffettChart: echarts.ECharts | null = null
  let erpChart: echarts.ECharts | null = null
  let crowdingChart: echarts.ECharts | null = null
  let valuationChart: echarts.ECharts | null = null

  const allCharts: (echarts.ECharts | null)[] = []

  // --- Chart Initialization Functions ---

  /**
   * 初始化巴菲特指标图表
   */
  const initBuffettChart = () => {
      if (buffettChartContainer.value) {
          buffettChart = echarts.init(buffettChartContainer.value, 'dark')
          allCharts.push(buffettChart)

          // TODO: 未来用API获取真实数据替换这里的模拟数据
          const mockData = {
              dates: [
                  '2022-01',
                  '2022-04',
                  '2022-07',
                  '2022-10',
                  '2023-01',
                  '2023-04',
                  '2023-07',
                  '2023-10',
                  '2024-01',
                  '2024-04'
              ],
              values: [95, 82, 88, 79, 90, 85, 92, 80, 75, 83]
          }

          const option: echarts.EChartsOption = {
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', formatter: '{b}<br/>指标值: {c}%' },
              grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
              xAxis: { type: 'category', boundaryGap: false, data: mockData.dates },
              yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
              series: [
                  {
                      name: '巴菲特指标',
                      type: 'line',
                      smooth: true,
                      data: mockData.values,
                      itemStyle: { color: '#00aaff' },
                      areaStyle: {
                          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                              { offset: 0, color: 'rgba(0, 170, 255, 0.3)' },
                              { offset: 1, color: 'rgba(0, 170, 255, 0)' }
                          ])
                      },
                      markLine: {
                          silent: true,
                          data: [
                              {
                                  yAxis: 100,
                                  name: '高估警示线',
                                  label: { formatter: '高估警示线: {c}%', position: 'end' },
                                  lineStyle: { color: '#ff6b6b' }
                              },
                              {
                                  yAxis: 70,
                                  name: '低估机会线',
                                  label: { formatter: '低估机会线: {c}%' },
                                  lineStyle: { color: '#28a745' }
                              }
                          ]
                      }
                  }
              ]
          }
          buffettChart.setOption(option)
      }
  }

  /**
   * 初始化股债利差图表
   */
  const initErpChart = () => {
      if (erpChartContainer.value) {
          erpChart = echarts.init(erpChartContainer.value, 'dark')
          allCharts.push(erpChart)

          const mockData = {
              dates: [
                  '2022-01',
                  '2022-04',
                  '2022-07',
                  '2022-10',
                  '2023-01',
                  '2023-04',
                  '2023-07',
                  '2023-10',
                  '2024-01',
                  '2024-04'
              ],
              values: [1.8, 2.5, 2.2, 2.8, 2.1, 2.4, 1.9, 2.9, 3.2, 2.6]
          }

          const option: echarts.EChartsOption = {
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', formatter: '{b}<br/>股债利差: {c}%' },
              grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
              xAxis: { type: 'category', boundaryGap: false, data: mockData.dates },
              yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
              series: [
                  {
                      name: '股债利差',
                      type: 'line',
                      smooth: true,
                      data: mockData.values,
                      itemStyle: { color: '#39cccc' },
                      areaStyle: {
                          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                              { offset: 0, color: 'rgba(57, 204, 204, 0.3)' },
                              { offset: 1, color: 'rgba(57, 204, 204, 0)' }
                          ])
                      },
                      markLine: {
                          silent: true,
                          data: [{ type: 'average', name: '历史均值' }]
                      }
                  }
              ]
          }
          erpChart.setOption(option)
      }
  }

  /**
   * 初始化行业拥挤度图表
   */
  const initCrowdingChart = () => {
      if (crowdingChartContainer.value) {
          crowdingChart = echarts.init(crowdingChartContainer.value, 'dark')
          allCharts.push(crowdingChart)

          const mockData = {
              sectors: ['半导体', '新能源', '白酒', '医药', '银行', 'AI', '煤炭'],
              values: [18, 15, 8, 11, 5, 22, 4]
          }

          const option: echarts.EChartsOption = {
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
              grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
              xAxis: {
                  type: 'category',
                  data: mockData.sectors,
                  axisLabel: { interval: 0, rotate: 30 }
              },
              yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
              series: [
                  {
                      name: '成交额占比',
                      type: 'bar',
                      barWidth: '60%',
                      data: mockData.values,
                      itemStyle: {
                          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                              { offset: 0, color: '#83bff6' },
                              { offset: 0.5, color: '#188df0' },
                              { offset: 1, color: '#188df0' }
                          ])
                      }
                  }
              ]
          }
          crowdingChart.setOption(option)
      }
  }

  /**
   * 初始化行业估值图表
   */
  const initValuationChart = () => {
      if (valuationChartContainer.value) {
          valuationChart = echarts.init(valuationChartContainer.value, 'dark')
          allCharts.push(valuationChart)

          // 模拟数据：行业名称 和 其在历史估值中的百分位 (0-100)
          const mockData = [
              { name: '银行', value: 8 },
              { name: '煤炭', value: 25 },
              { name: '医药生物', value: 35 },
              { name: '食品饮料', value: 55 },
              { name: '电力设备', value: 72 },
              { name: '电子', value: 88 },
              { name: '通信', value: 95 }
          ].sort((a, b) => a.value - b.value) // 按估值从低到高排序

          const option: echarts.EChartsOption = {
              backgroundColor: 'transparent',
              tooltip: {
                  trigger: 'axis',
                  axisPointer: { type: 'shadow' },
                  formatter: (params: any) =>
                      `${params[0].name}<br/>历史分位点: <strong>${params[0].value}%</strong>`
              },
              grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
              xAxis: { type: 'value', boundaryGap: [0, 0.01], show: false },
              yAxis: {
                  type: 'category',
                  data: mockData.map(item => item.name),
                  axisTick: { show: false },
                  axisLine: { show: false }
              },
              series: [
                  {
                      name: '估值温度',
                      type: 'bar',
                      data: mockData.map(item => ({
                          value: item.value,
                          itemStyle: {
                              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                  { offset: 0, color: '#28a745' }, // 冷色 (低估)
                                  { offset: 0.5, color: '#ffc107' }, // 中性
                                  { offset: 1, color: '#ff6b6b' } // 热色 (高估)
                              ])
                          }
                      })),
                      label: {
                          show: true,
                          position: 'right',
                          formatter: '{c}%',
                          color: '#fff',
                          fontWeight: 'bold'
                      }
                  }
              ]
          }
          valuationChart.setOption(option)
      }
  }

  // --- Lifecycle Hooks ---

  onMounted(() => {
      // 初始化所有图表
      initBuffettChart()
      initErpChart()
      initCrowdingChart()
      initValuationChart()

      // 添加窗口大小调整的监听器
      window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
      // 移除监听器并销毁图表实例
      window.removeEventListener('resize', handleResize)
      allCharts.forEach(chart => chart?.dispose())
  })

  // --- Utility Functions ---

  const handleResize = () => {
      allCharts.forEach(chart => chart?.resize())
  }
</script>

<style scoped>
  /* 这里的样式很大程度上复用了您提供的 AllWeatherStrategy.vue 的样式，以确保风格统一 */
  /* 唯一的微小改动是 .title-icon 的样式，使其更突出 */

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
      /* --- REPLACE THE LINE BELOW --- */
      background: radial-gradient(circle at 15% 50%, #1a4a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #1f6666, transparent 40%), #121212;
  }

  .main-container {
      max-width: 1200px; /* 允许更宽的布局以容纳并排图表 */
      margin: 0 auto;
  }

  .page-header {
      text-align: center;
      margin-bottom: 3rem;
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
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
      text-shadow: 0 0 15px rgba(57, 204, 204, 0.7); /* 使用青色光晕匹配新卡片颜色 */
  }
  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  .content-grid {
      display: grid;
      /* 每行显示两个图表卡片 */
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
  }

  .content-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem 2rem;
      backdrop-filter: blur(10px);
      transition: border-color 0.3s ease;
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
      display: flex;
      flex-direction: column;
  }
  .content-card:hover {
      border-color: rgba(57, 204, 204, 0.5); /* 悬停时使用青色边框 */
  }

  /* 交错加载动画 */
  .content-card:nth-child(1) {
      animation-delay: 0.2s;
  }
  .content-card:nth-child(2) {
      animation-delay: 0.3s;
  }
  .content-card:nth-child(3) {
      animation-delay: 0.4s;
  }
  .content-card:nth-child(4) {
      animation-delay: 0.5s;
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #39cccc; /* 使用青色作为强调色 */
      padding-left: 1rem;
  }

  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
      margin-bottom: 1.5rem; /* 增加与图表的间距 */
  }

  .echart-container {
      width: 100%;
      height: 300px; /* 统一图表高度 */
      flex-grow: 1; /* 让图表容器填满卡片剩余空间 */
  }

  /* 响应式设计 */
  @media (max-width: 992px) {
      .content-grid {
          /* 在平板和手机上，每行只显示一个图表 */
          grid-template-columns: 1fr;
      }
      .main-container {
          max-width: 700px;
      }
  }

  @media (max-width: 768px) {
      .page-wrapper {
          padding: 2rem 1rem;
      }
      .main-title {
          font-size: 2rem;
      }
      .subtitle {
          font-size: 1rem;
      }
      .content-card {
          padding: 1.2rem;
      }
      .card-title {
          font-size: 1.25rem;
      }
  }
</style>