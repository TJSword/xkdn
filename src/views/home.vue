<template>
  <div class="home-page-wrapper">
    <div class="main-container">
      <!-- 标题和副标题 -->
      <h1 class="main-title">探索您的投资哲学</h1>
      <p class="subtitle">
        概览市场全局，选择策略路径，开启您的财富增长之旅。
      </p>

      <!-- 修改后的市场温度计 -->
      <div class="market-thermometer-container clickable" @click="openModal" title="点击查看详细图表">
        <!-- 1. 新的头部容器，用于放置标题和评分 -->
        <div class="thermometer-header">
          <h2 class="section-title">当前市场星级:4.86</h2>
          <!-- <div class="thermometer-value">{{ marketTemperatureValue.toFixed(2) }} ★</div> -->
        </div>

        <!-- 2. 日期移动到评分下方并右对齐 -->
        <!-- <p class="thermometer-desc">数据日期: {{ latestDate }}</p> -->

        <!-- 仪表盘部分保持不变 -->
        <div class="thermometer-gauge">
          <span class="label cheap">高星(便宜)</span>
          <div class="gauge-bar">
            <div class="indicator" :style="{ left: marketTemperaturePercent }">
              <div class="indicator-head"></div>
              <div class="indicator-line"></div>
            </div>
          </div>
          <span class="label expensive">低星(昂贵)</span>
        </div>
      </div>

      <!-- 统一的 3x2 功能网格 -->
      <div class="features-grid">
        <a v-for="card in allFeatureCards" :key="card.id" :href="card.link" :class="['strategy-card', card.cssClass]">
          <div class="card-icon">{{ card.icon }}</div>
          <h2 class="card-title">{{ card.title }}</h2>
          <p class="card-description">{{ card.description }}</p>
        </a>
      </div>
    </div>

    <!-- 模态框 (无变化) -->
    <Transition name="modal-fade">
      <div v-if="isModalVisible" class="modal-backdrop" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>市场星级与指数走势</h3>
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
  import { ref, computed, watch, nextTick, onMounted } from 'vue'
  import * as echarts from 'echarts'
  import starData from './star.json'

  // --- 接口定义 (无变化) ---
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
          title: '个人记账本',
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

  // --- 市场温度计与数据处理 (无变化) ---
  const marketData = ref<StarDataItem[]>(starData as StarDataItem[])
  const marketTemperatureValue = ref(5.0) // 默认值
  const latestDate = ref('')

  onMounted(() => {
      if (marketData.value.length > 0) {
          const latestDataPoint = marketData.value[marketData.value.length - 1]
          marketTemperatureValue.value = latestDataPoint.star
          latestDate.value = latestDataPoint.day
      }
  })

  // 计算属性 (无变化)
  const marketTemperaturePercent = computed(() => {
      const score = marketTemperatureValue.value
      const percentage = ((6 - score) / (6 - 1)) * 100
      return `${Math.max(0, Math.min(100, percentage))}%`
  })

  // --- 模态框与 ECharts 逻辑 (无变化) ---
  const isModalVisible = ref(false)
  const echartContainer = ref<HTMLElement | null>(null)
  let myChart: echarts.ECharts | null = null

  const openModal = () => {
      isModalVisible.value = true
  }
  const closeModal = () => {
      isModalVisible.value = false
  }

  watch(isModalVisible, newValue => {
      if (newValue) {
          nextTick(() => {
              if (echartContainer.value) {
                  myChart = echarts.init(echartContainer.value)
                  const dates = marketData.value.map(item => item.day)
                  const starValues = marketData.value.map(item => item.star)
                  const indexValues = marketData.value.map(item => item.china_index)

                  const option: echarts.EChartsOption = {
                      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
                      legend: { data: ['星级', '中证全指'], textStyle: { color: '#ccc' } },
                      grid: { left: '8%', right: '8%', bottom: '20%' },
                      xAxis: {
                          type: 'category',
                          data: dates,
                          axisLine: { lineStyle: { color: '#8392A5' } }
                      },
                      yAxis: [
                          {
                              type: 'value',
                              name: '星级',
                              position: 'left',
                              alignTicks: true,
                              axisLine: { show: true, lineStyle: { color: '#5470C6' } },
                              axisLabel: { formatter: '{value} ★' }
                          },
                          {
                              type: 'value',
                              name: '中证全指',
                              position: 'right',
                              alignTicks: true,
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
                              name: '星级',
                              type: 'line',
                              yAxisIndex: 0,
                              smooth: true,
                              data: starValues,
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
  /* 基本样式和背景 */
  .home-page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      /* padding: 2rem 1rem; */
      overflow: hidden;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
  }

  /* 主容器 */
  .main-container {
      text-align: center;
      max-width: 1200px;
      width: 100%;
  }

  /* 标题 */
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

  /* --- 修改后的市场温度计卡片 --- */
  .market-thermometer-container {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 1.2rem 1.5rem; /* 调整了内边距 */
      backdrop-filter: blur(10px);
      transition: transform 0.3s ease, border-color 0.3s ease;
      /* 恢复最大宽度，使其居中 */
      margin: 0 auto 2rem auto;
      text-align: left; /* 让内部内容默认左对齐 */
  }
  .market-thermometer-container.clickable {
      cursor: pointer;
  }
  .market-thermometer-container.clickable:hover {
      transform: scale(1.02);
      border-color: #00aaff;
  }

  /* --- 新增: 卡片内标题和评分的容器 --- */
  .thermometer-header {
      display: flex;
      justify-content: center;
      align-items: baseline; /* 基线对齐，让文字底部对齐 */
      margin-bottom: 1.6rem;
  }

  .section-title {
      font-size: 1rem;
      margin: 0; /* 移除原来的边距 */
      font-weight: bold;
      color: rgba(255, 255, 255, 0.7);
  }

  .thermometer-value {
      font-size: 2rem;
      font-weight: bold;
      color: #fff;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }

  /* --- 修改: 日期描述的样式 --- */
  .thermometer-desc {
      margin: 0 0 1rem 0; /* 调整边距，使其位于头部下方，仪表盘上方 */
      color: #b0c4de;
      font-size: 0.75rem;
      text-align: right; /* 右对齐以匹配评分位置 */
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

  /* 3x2 特性网格 */
  .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
  }

  /* 紧凑型卡片样式 */
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
      text-align: center; /* 确保卡片内容居中 */
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

  /* 辉光效果 (无变化) */
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

  /* 模态框与响应式样式 (无变化) */
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

  /* 响应式布局 */
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