<template>
  <div class="home-page-wrapper">
    <div class="main-container">
      <h1 class="main-title">探索您的投资哲学</h1>
      <p class="subtitle">选择一条策略路径，开启您的财富增长之旅。我们提供经过市场考验的稳健策略，助您穿越牛熊，实现长期价值。</p>

      <div class="strategy-grid">
        <!-- 
          使用 v-for 指令循环渲染 strategyCards 数组。
          - :key 是必须的，用于 Vue 的性能优化，我们使用唯一的 card.id。
          - :href 动态绑定链接。
          - :class 动态绑定类名，将 'strategy-card' 和卡片自身的CSS类合并。
        -->
        <a v-for="card in strategyCards" :key="card.id" :href="card.link" :class="['strategy-card', card.cssClass]">
          <div class="card-icon">{{ card.icon }}</div>
          <h2 class="card-title">{{ card.title }}</h2>
          <p class="card-description">{{ card.description }}</p>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // 导入 Vue 的 ref 用于创建响应式引用
  import { ref } from 'vue'

  // 1. 使用 TypeScript 定义卡片的数据结构，确保类型安全
  interface StrategyCard {
      id: number
      title: string
      description: string
      icon: string
      cssClass: string // 用于关联特定样式的类名
      link: string // 卡片的跳转链接
  }

  // 2. 创建一个响应式数组来存储所有的策略卡片数据
  //    未来若要增删或修改卡片，只需维护这个数组即可！
  const strategyCards = ref<StrategyCard[]>([
      {
          id: 1,
          title: '全天候策略',
          description:
              '旨在通过多元化资产配置，无论经济环境如何变化，都能实现稳定回报的投资组合策略。',
          icon: '❂',
          cssClass: 'all-weather',
          link: '#all-weather'
      },
      {
          id: 2,
          title: '长钱策略',
          description:
              '关注长期价值投资，忽略市场短期波动。通过深入的基本面分析，选择并长期持有优质资产。',
          icon: '⌛',
          cssClass: 'long-term',
          link: '#long-term'
      },
      {
          id: 3,
          title: '核心增长策略',
          description:
              '聚焦于高成长性行业和公司，旨在捕获超越市场平均水平的资本增值，适合风险偏好较高的投资者。',
          icon: '🚀',
          cssClass: 'core-growth',
          link: '#core-growth'
      },
      {
          id: 4,
          title: '固收增强策略',
          description:
              '以稳健的固定收益资产为基础，灵活运用多种工具增厚收益，追求在控制风险前提下的绝对回报。',
          icon: '🛡️',
          cssClass: 'income-plus',
          link: '#income-plus'
      }
  ])
</script>

<style scoped>
  /*
      使用 `scoped` 属性确保样式仅应用于当前组件。
      所有样式从原 HTML 文件中复制过来，无需更改，因为我们的类名结构保持了一致。
    */
  /* @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;700&display=swap'); */

  .home-page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem 0;
      overflow-x: hidden;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
  }

  .main-container {
      text-align: center;
      padding: 2rem;
      max-width: 1200px;
      width: 90%;
  }

  .main-title {
      font-size: 2.8rem;
      font-weight: 700;
      margin-bottom: 1rem;
      text-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
  }

  .subtitle {
      font-size: 1.2rem;
      font-weight: 300;
      color: #b0c4de;
      margin-bottom: 4rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
  }

  .strategy-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 3rem;
  }

  .strategy-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 2.5rem;
      position: relative;
      overflow: hidden;
      transition: transform 0.4s ease, box-shadow 0.4s ease;
      cursor: pointer;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      text-decoration: none;
      color: inherit;
  }

  .strategy-card:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.4s ease;
  }

  .strategy-card:hover {
      transform: translateY(-15px) scale(1.03);
  }

  .strategy-card:hover:before {
      opacity: 1;
  }

  /* --- 定义每个卡片的辉光和图标颜色 --- */
  /* 这些类名现在由Vue动态绑定到<a>标签上 */
  .strategy-card.all-weather:hover {
      box-shadow: 0 0 25px #00aaff, 0 0 50px #00aaff, 0 0 100px rgba(0, 170, 255, 0.3);
      border-color: #00aaff;
  }
  .all-weather .card-icon {
      color: #00aaff;
  }

  .strategy-card.long-term:hover {
      box-shadow: 0 0 25px #ff4081, 0 0 50px #ff4081, 0 0 100px rgba(255, 64, 129, 0.3);
      border-color: #ff4081;
  }
  .long-term .card-icon {
      color: #ff4081;
  }

  .strategy-card.core-growth:hover {
      box-shadow: 0 0 25px #28a745, 0 0 50px #28a745, 0 0 100px rgba(40, 167, 69, 0.3);
      border-color: #28a745;
  }
  .core-growth .card-icon {
      color: #28a745;
  }

  .strategy-card.income-plus:hover {
      box-shadow: 0 0 25px #ffc107, 0 0 50px #ffc107, 0 0 100px rgba(255, 193, 7, 0.3);
      border-color: #ffc107;
  }
  .income-plus .card-icon {
      color: #ffc107;
  }

  .card-icon {
      font-size: 3.5rem;
      margin-bottom: 1.5rem;
  }

  .card-title {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 1rem;
  }

  .card-description {
      font-size: 1rem;
      color: #b0c4de;
      line-height: 1.6;
  }

  @media (max-width: 992px) {
      .strategy-grid {
          grid-template-columns: 1fr;
      }
  }
  @media (max-width: 576px) {
      .main-title {
          font-size: 2.2rem;
      }
      .subtitle {
          font-size: 1rem;
      }
  }
</style>