<template>
  <div class="home-page-wrapper">
    <div class="main-container">
      <!-- 标题和副标题 -->
      <h1 class="main-title">探索您的投资哲学</h1>
      <p class="subtitle">
        概览市场全局，选择策略路径，开启您的财富增长之旅。
      </p>

      <!-- 市场温度计 -->
      <div class="market-thermometer-container clickable" @click="openModal" title="点击查看详细图表">
        <div class="thermometer-header">
          <!-- 动态显示最新的温度和星级 -->
          <h2 class="section-title">
            当前市场温度: {{ latestTemperature.toFixed(2) }}°C
          </h2>
        </div>

        <p class="thermometer-desc">更新时间: {{ latestDate }}</p>

        <div class="thermometer-gauge">
          <span class="label cheap">冷</span>
          <div class="gauge-bar">
            <div class="indicator" :style="{ left: marketTemperaturePercent }">
              <div class="indicator-head"></div>
              <div class="indicator-line"></div>
            </div>
          </div>
          <span class="label expensive">热</span>
        </div>
      </div>

      <!-- 功能网格 (无变化) -->
      <div class="features-grid">
        <a v-for="card in allFeatureCards" :key="card.id" :href="card.link" :class="['strategy-card', card.cssClass]">
          <div class="card-icon">{{ card.icon }}</div>
          <h2 class="card-title">{{ card.title }}</h2>
          <p class="card-description">{{ card.description }}</p>
        </a>
      </div>
    </div>

    <!-- 模态框 (ECharts部分已更新) -->
    <Transition name="modal-fade">
      <div v-if="isModalVisible" class="modal-backdrop" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>市场温度与指数走势</h3>
            <button class="modal-close-button" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div ref="echartContainer" class="echart-container"></div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick, onMounted, onUnmounted, inject } from 'vue'
  import * as echarts from 'echarts'
  // 移除静态 import starData from './star.json'

  const app: any = inject('tcb')
  // --- 接口定义 ---
  interface FeatureCard {
      id: number
      title: string
      description: string
      icon: string
      cssClass: string
      link: string
  }
  interface StarDataItem {
      day: string
      star: number
      china_index: number
  }
  interface ProcessedDataItem extends StarDataItem {
      temperature: number
  }

  // --- 卡片数据定义 (无变化) ---
  const allFeatureCards = ref<FeatureCard[]>([
      {
          id: 1,
          title: '全天候策略',
          description: '多元化资产配置，追求全环境稳定回报。',
          icon: '❂',
          cssClass: 'all-weather',
          link: '#all-weather'
      },
      {
          id: 2,
          title: '长钱策略',
          description: '关注长期价值投资，忽略短期市场波动。',
          icon: '⌛',
          cssClass: 'long-term',
          link: '#long-term'
      },
      {
          id: 7,
          title: '微盘股策略',
          description: '挖掘小市值公司潜力，追求超额收益。',
          icon: '💎',
          cssClass: 'micro-cap',
          link: '#micro-cap'
      },
      {
          id: 5,
          title: '何的记账本',
          description: '轻松记录投资与开销，清晰掌握财务状况。',
          icon: '📒',
          cssClass: 'personal-ledger',
          link: '#ledger'
      },
      {
          id: 6,
          title: '投资小工具',
          description: '提供再平衡计算器等，辅助科学决策。',
          icon: '🛠️',
          cssClass: 'handy-tools',
          link: '#tools'
      },
      {
          id: 8,
          title: '可转债策略',
          description: '兼具股债特性，提供攻守兼备的投资选择。',
          icon: '🔄',
          cssClass: 'convertible-bond',
          link: '#bonds'
      }
  ])

  // --- 市场温度计与数据处理 (核心修改部分) ---
  const rawHistoryData = ref<StarDataItem[]>([]) // 用于存储从API获取的原始历史数据
  const processedMarketData = ref<ProcessedDataItem[]>([])
  let minStar = ref(1.8) // 数据集中的最低星级
  let maxStar = ref(5.98) // 数据集中的最高星级

  const latestStar = ref(5.98) // 初始值设为0
  const latestTemperature = ref(0)
  const latestDate = ref('加载中...') // 初始提示
  let pollingInterval: number | null = null // 定时器ID

  /**
   * 核心处理函数：基于线性映射计算温度，并填充 processedMarketData
   * 此函数现在依赖于 rawHistoryData
   */
  function processDataWithLinearMapping() {
      const data = rawHistoryData.value
      if (!data || data.length === 0) return

      // 1. 找出数据集中的最高和最低星级
      const allStars = data.map(item => item.star)
      minStar.value = Math.min(...allStars)
      maxStar.value = Math.max(...allStars)
      const starRange = maxStar.value - minStar.value

      // 处理分母为0的边缘情况
      if (starRange === 0) {
          processedMarketData.value = data.map(item => ({ ...item, temperature: 50 }))
      } else {
          // 2. 遍历所有数据，计算每个数据点的温度
          processedMarketData.value = data.map(item => {
              const temp = 100 - ((item.star - minStar.value) / starRange) * 100
              return { ...item, temperature: temp }
          })
      }
      // 数据处理完成后，可以触发一次最新的温度计算
      updateLatestTemperature(latestStar.value)
  }

  /**
   * 更新最新的温度值
   * @param starRating - 最新的星级
   */
  function updateLatestTemperature(starRating: number) {
      if (processedMarketData.value.length === 0) return // 确保历史数据已加载

      const range = maxStar.value - minStar.value
      if (range === 0) {
          latestTemperature.value = 50
          return
      }
      latestTemperature.value = 100 - ((starRating - minStar.value) / range) * 100
  }

  /**
   * [异步] 获取最新的星级和日期
   */
  const getTodayStar = () => {
      app.callFunction({
          name: 'getStar',
          data: {}
      })
          .then((res: any) => {
              if (res.result?.data?.result) {
                  latestStar.value = res.result.data.result.star
                  latestDate.value = res.result.data.result.update_time
              }
          })
          .catch((err: any) => {
              console.error('获取最新星级失败:', err)
              latestDate.value = '数据加载失败'
          })
  }

  /**
   * [异步] 获取历史星级数据 (star.json)
   * 成功后会调用数据处理函数
   */
  const getHistoryStar = () => {
      // 检查数据是否已存在，如果存在则不重复获取
      if (rawHistoryData.value.length > 0) {
          return Promise.resolve()
      }
      return app
          .callFunction({
              name: 'getHistoryStar',
              data: {}
          })
          .then((res: any) => {
              if (res.result?.data?.result) {
                  rawHistoryData.value = res.result.data.result
                  processDataWithLinearMapping() // 获取到数据后立即进行处理
              }
          })
          .catch((err: any) => {
              console.error('获取历史星级失败:', err)
          })
  }

  /**
   * 启动定时轮询以获取最新数据
   */
  const startPollingTodayStar = () => {
      getTodayStar() // 立即执行一次
      // pollingInterval = window.setInterval(getTodayStar, 60000) // 设置每分钟刷新
  }

  onMounted(async () => {
      // 1. 首先加载历史数据以确定温度计算的范围
      await getHistoryStar()
      // 2. 然后开始轮询获取最新数据
      startPollingTodayStar()
  })

  onUnmounted(() => {
      // 组件卸载时清除定时器，防止内存泄漏
      if (pollingInterval) {
          clearInterval(pollingInterval)
      }
  })

  // 监听最新星级的变化，以便实时更新温度计
  watch(latestStar, newStar => {
      updateLatestTemperature(newStar)
  })

  // 计算属性，用于控制温度计指针位置
  const marketTemperaturePercent = computed(() => {
      return `${Math.max(0, Math.min(100, latestTemperature.value))}%`
  })

  // --- 模态框与 ECharts 逻辑 (已更新) ---
  const isModalVisible = ref(false)
  const echartContainer = ref<HTMLElement | null>(null)
  let myChart: echarts.ECharts | null = null

  const openModal = () => {
      // 直接打开模态框，数据获取逻辑已移至 onMounted
      isModalVisible.value = true
  }
  const closeModal = () => {
      isModalVisible.value = false
  }

  watch(isModalVisible, newValue => {
      if (newValue && processedMarketData.value.length > 0) {
          nextTick(() => {
              if (echartContainer.value) {
                  myChart = echarts.init(echartContainer.value)
                  const dates = processedMarketData.value.map(item => item.day)
                  const temperatureValues = processedMarketData.value.map(item =>
                      item.temperature.toFixed(2)
                  )
                  const indexValues = processedMarketData.value.map(item => item.china_index)

                  const option: echarts.EChartsOption = {
                      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
                      legend: { data: ['市场温度', '中证全指'], textStyle: { color: '#ccc' } },
                      grid: { left: '8%', right: '8%', bottom: '20%' },
                      xAxis: {
                          type: 'category',
                          data: dates,
                          axisLine: { lineStyle: { color: '#8392A5' } }
                      },
                      yAxis: [
                          {
                              type: 'value',
                              name: '市场温度',
                              position: 'left',
                              min: 0,
                              max: 100,
                              axisLine: { show: true, lineStyle: { color: '#5470C6' } },
                              axisLabel: { formatter: '{value} °C' }
                          },
                          {
                              type: 'value',
                              name: '中证全指',
                              position: 'right',
                              scale: true,
                              axisLine: { show: true, lineStyle: { color: '#91CC75' } },
                              axisLabel: { formatter: '{value}' }
                          }
                      ],
                      dataZoom: [
                          { type: 'inside', start: 80, end: 100 },
                          { show: true, type: 'slider', start: 80, end: 100, bottom: 10 }
                      ],
                      series: [
                          {
                              name: '市场温度',
                              type: 'line',
                              yAxisIndex: 0,
                              smooth: true,
                              data: temperatureValues,
                              itemStyle: { color: '#5470C6' }
                          },
                          {
                              name: '中证全指',
                              type: 'line',
                              yAxisIndex: 1,
                              smooth: true,
                              data: indexValues,
                              itemStyle: { color: '#91CC75' }
                          }
                      ]
                  }
                  myChart.setOption(option)
              }
          })
      } else {
          if (myChart) {
              myChart.dispose()
              myChart = null
          }
      }
  })
</script>


<style scoped>
  /* CSS样式部分保持不变 */
  .home-page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      overflow: hidden;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
  }
  .main-container {
      text-align: center;
      max-width: 1200px;
      width: 100%;
  }
  .main-title {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      text-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
  }
  .subtitle {
      font-size: 1rem;
      color: #b0c4de;
      margin-bottom: 2rem;
      max-width: 550px;
      margin-left: auto;
      margin-right: auto;
  }
  .market-thermometer-container {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 1.2rem 1.5rem;
      backdrop-filter: blur(10px);
      transition: transform 0.3s ease, border-color 0.3s ease;
      margin: 0 auto 2rem auto;
      text-align: left;
  }
  .market-thermometer-container.clickable {
      cursor: pointer;
  }
  .market-thermometer-container.clickable:hover {
      transform: scale(1.02);
      border-color: #00aaff;
  }
  .thermometer-header {
      display: flex;
      justify-content: center;
      align-items: baseline;
      margin-bottom: 0.8rem;
  }
  .section-title {
      font-size: 1rem;
      margin: 0;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.9);
  }
  .thermometer-desc {
      margin: 0 0 1.2rem 0;
      color: #b0c4de;
      font-size: 0.75rem;
      text-align: center;
  }
  .thermometer-gauge {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      width: 100%;
  }
  .label {
      font-size: 0.8rem;
      font-weight: bold;
  }
  .label.cheap {
      color: #28a745;
  }
  .label.expensive {
      color: #ff4081;
  }
  .gauge-bar {
      flex-grow: 1;
      height: 10px;
      background: linear-gradient(to right, #28a745, #ffc107 50%, #ff4081);
      border-radius: 5px;
      position: relative;
  }
  .indicator {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: left 0.5s ease-out;
  }
  .indicator-head {
      width: 14px;
      height: 14px;
      background-color: #ffffff;
      border-radius: 50%;
      border: 2px solid #121212;
      position: absolute;
      top: -22px;
  }
  .indicator-line {
      width: 2px;
      height: 28px;
      background-color: #ffffff;
      position: absolute;
      top: -14px;
  }
  .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
  }
  .strategy-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.2rem;
      overflow: hidden;
      transition: transform 0.4s ease, box-shadow 0.4s ease;
      cursor: pointer;
      backdrop-filter: blur(10px);
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 150px;
      text-align: center;
  }
  .strategy-card:hover {
      transform: translateY(-8px) scale(1.03);
  }
  .card-icon {
      font-size: 2.2rem;
      margin-bottom: 0.6rem;
  }
  .card-title {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
      font-weight: bold;
  }
  .card-description {
      font-size: 0.8rem;
      color: #b0c4de;
      line-height: 1.5;
  }
  .all-weather:hover {
      box-shadow: 0 0 15px #00aaff;
      border-color: #00aaff;
  }
  .all-weather .card-icon {
      color: #00aaff;
  }
  .long-term:hover {
      box-shadow: 0 0 15px #ff4081;
      border-color: #ff4081;
  }
  .long-term .card-icon {
      color: #ff4081;
  }
  .personal-ledger:hover {
      box-shadow: 0 0 15px #00c497;
      border-color: #00c497;
  }
  .personal-ledger .card-icon {
      color: #00c497;
  }
  .handy-tools:hover {
      box-shadow: 0 0 15px #8a2be2;
      border-color: #8a2be2;
  }
  .handy-tools .card-icon {
      color: #8a2be2;
  }
  .micro-cap:hover {
      box-shadow: 0 0 15px #f0e68c;
      border-color: #f0e68c;
  }
  .micro-cap .card-icon {
      color: #f0e68c;
  }
  .convertible-bond:hover {
      box-shadow: 0 0 15px #add8e6;
      border-color: #add8e6;
  }
  .convertible-bond .card-icon {
      color: #add8e6;
  }
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
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 15px;
      padding: 1.5rem 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      width: 90%;
      max-width: 800px;
      transform: scale(1);
  }
  .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 1rem;
  }
  .modal-header h3 {
      margin: 0;
      font-size: 1.4rem;
  }
  .modal-close-button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
  }
  .echart-container {
      width: 100%;
      height: 450px;
  }
  .modal-fade-enter-active,
  .modal-fade-leave-active {
      transition: opacity 0.3s ease;
  }
  .modal-fade-enter-active .modal-content,
  .modal-fade-leave-active .modal-content {
      transition: transform 0.3s ease;
  }
  .modal-fade-enter-from,
  .modal-fade-leave-to {
      opacity: 0;
  }
  .modal-fade-enter-from .modal-content,
  .modal-fade-leave-to .modal-content {
      transform: scale(0.95);
  }
  @media (max-width: 1024px) {
      .features-grid {
          grid-template-columns: repeat(2, 1fr);
      }
      .home-page-wrapper {
          align-items: flex-start;
          overflow-y: auto;
      }
  }
  @media (max-width: 576px) {
      .home-page-wrapper {
          padding: 1.5rem 1rem;
      }
      .main-title {
          font-size: 1.8rem;
      }
      .subtitle {
          font-size: 0.9rem;
      }
      .thermometer-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
      }
      .thermometer-desc {
          text-align: left;
      }
      .features-grid {
          grid-template-columns: 1fr;
      }
      .strategy-card {
          min-height: auto;
          padding: 1.5rem;
      }
  }
</style>