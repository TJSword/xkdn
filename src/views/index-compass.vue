<template>
  <div class="page-wrapper">
    <div class="main-container">
      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button"> ← 返回主页 </router-link>

        <h1 class="main-title">
          <span class="title-icon">📊</span>
          指数罗盘
        </h1>
        <p class="subtitle">一览众山小，轻松掌握全市场指数动态。</p>
      </div>

      <!-- 2. 指数数据表格 -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <!-- 表头，点击可排序 -->
              <th @click="handleSort('name')">
                指数
                <span v-if="sortKey === 'name'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('category')">
                指数分类
                <span v-if="sortKey === 'category'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('latestPrice')">
                最新价
                <span v-if="sortKey === 'latestPrice'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('changePercent')">
                涨跌幅
                <span v-if="sortKey === 'changePercent'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('prevChangePercent')">
                上日涨跌
                <span v-if="sortKey === 'prevChangePercent'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('weekChange')">
                近一周
                <span v-if="sortKey === 'weekChange'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('monthChange')">
                近一月
                <span v-if="sortKey === 'monthChange'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('threeMonthChange')">
                近3月
                <span v-if="sortKey === 'threeMonthChange'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('ytdChange')">
                年初至今
                <span v-if="sortKey === 'ytdChange'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('yearChange')">
                近一年
                <span v-if="sortKey === 'yearChange'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('threeYearChange')">
                近3年
                <span v-if="sortKey === 'threeYearChange'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('fiveYearChange')">
                近5年
                <span v-if="sortKey === 'fiveYearChange'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('roe')">
                ROE
                <span v-if="sortKey === 'roe'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('revenueGrowth')">
                营收增速
                <span v-if="sortKey === 'revenueGrowth'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('profitGrowth')">
                净利增速
                <span v-if="sortKey === 'profitGrowth'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('dividendYield')">
                股息率
                <span v-if="sortKey === 'dividendYield'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('pe')">
                PE-TTM
                <span v-if="sortKey === 'pe'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('pePercentile')">
                PE百分位
                <span v-if="sortKey === 'pePercentile'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('pb')">
                PB
                <span v-if="sortKey === 'pb'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('pbPercentile')">
                PB百分位
                <span v-if="sortKey === 'pbPercentile'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('ps')">
                PS-TTM
                <span v-if="sortKey === 'ps'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
              <th @click="handleSort('psPercentile')">
                PS百分位
                <span v-if="sortKey === 'psPercentile'" class="sort-indicator">{{
                  sortOrder === 'asc' ? '▲' : '▼'
                }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in sortedData" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.category }}</td>
              <td>{{ item.latestPrice.toFixed(2) }}</td>
              <td :class="getColorForChange(item.changePercent)">
                {{ formatPercentage(item.changePercent) }}
              </td>
              <td :class="getColorForChange(item.prevChangePercent)">
                {{ formatPercentage(item.prevChangePercent) }}
              </td>
              <td :class="getColorForChange(item.weekChange)">
                {{ formatPercentage(item.weekChange) }}
              </td>
              <td :class="getColorForChange(item.monthChange)">
                {{ formatPercentage(item.monthChange) }}
              </td>
              <td :class="getColorForChange(item.threeMonthChange)">
                {{ formatPercentage(item.threeMonthChange) }}
              </td>
              <td :class="getColorForChange(item.ytdChange)">
                {{ formatPercentage(item.ytdChange) }}
              </td>
              <td :class="getColorForChange(item.yearChange)">
                {{ formatPercentage(item.yearChange) }}
              </td>
              <td :class="getColorForChange(item.threeYearChange)">
                {{ formatPercentage(item.threeYearChange) }}
              </td>
              <td :class="getColorForChange(item.fiveYearChange)">
                {{ formatPercentage(item.fiveYearChange) }}
              </td>
              <td>{{ formatPercentage(item.roe) }}</td>
              <td>{{ formatPercentage(item.revenueGrowth) }}</td>
              <td>{{ formatPercentage(item.profitGrowth) }}</td>
              <td>{{ formatPercentage(item.dividendYield) }}</td>
              <td>{{ item.pe.toFixed(2) }}</td>
              <td>{{ formatPercentage(item.pePercentile) }}</td>
              <td>{{ item.pb.toFixed(2) }}</td>
              <td>{{ formatPercentage(item.pbPercentile) }}</td>
              <td>{{ item.ps.toFixed(2) }}</td>
              <td>{{ formatPercentage(item.psPercentile) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'

  // 定义指数数据的接口/类型
  interface IndexData {
      id: number
      name: string
      category: string
      latestPrice: number
      changePercent: number
      prevChangePercent: number
      weekChange: number
      monthChange: number
      threeMonthChange: number
      ytdChange: number
      yearChange: number
      threeYearChange: number
      fiveYearChange: number
      roe: number
      revenueGrowth: number
      profitGrowth: number
      dividendYield: number
      pe: number
      pePercentile: number
      pb: number
      pbPercentile: number
      ps: number
      psPercentile: number
  }

  // --- 状态管理 ---
  const sortKey = ref<keyof IndexData | null>('changePercent') // 默认按涨跌幅排序
  const sortOrder = ref<'asc' | 'desc'>('desc') // 默认降序

  // --- 模拟数据 (未来可替换为API获取) ---
  const indexData = ref<IndexData[]>([
      {
          id: 1,
          name: '沪深300',
          category: '大盘',
          latestPrice: 3540.88,
          changePercent: 0.55,
          prevChangePercent: -0.21,
          weekChange: 1.2,
          monthChange: 3.5,
          threeMonthChange: 5.1,
          ytdChange: 2.8,
          yearChange: -8.5,
          threeYearChange: -25.0,
          fiveYearChange: 15.2,
          roe: 11.5,
          revenueGrowth: 5.2,
          profitGrowth: 4.8,
          dividendYield: 2.8,
          pe: 11.8,
          pePercentile: 25.5,
          pb: 1.3,
          pbPercentile: 10.2,
          ps: 1.1,
          psPercentile: 30.1
      },
      {
          id: 2,
          name: '中证500',
          category: '中盘',
          latestPrice: 5380.15,
          changePercent: -0.12,
          prevChangePercent: 0.5,
          weekChange: -0.5,
          monthChange: 2.1,
          threeMonthChange: 8.2,
          ytdChange: 4.5,
          yearChange: -12.3,
          threeYearChange: -18.7,
          fiveYearChange: 22.8,
          roe: 9.8,
          revenueGrowth: 8.1,
          profitGrowth: 7.5,
          dividendYield: 1.9,
          pe: 22.5,
          pePercentile: 15.8,
          pb: 1.7,
          pbPercentile: 8.5,
          ps: 1.5,
          psPercentile: 22.4
      },
      {
          id: 3,
          name: '创业板指',
          category: '成长',
          latestPrice: 1805.4,
          changePercent: -1.08,
          prevChangePercent: -0.8,
          weekChange: -2.5,
          monthChange: -1.8,
          threeMonthChange: 4.6,
          ytdChange: -3.7,
          yearChange: -20.1,
          threeYearChange: -45.6,
          fiveYearChange: 35.1,
          roe: 8.5,
          revenueGrowth: 12.3,
          profitGrowth: 10.2,
          dividendYield: 0.9,
          pe: 28.9,
          pePercentile: 5.2,
          pb: 3.5,
          pbPercentile: 12.1,
          ps: 2.8,
          psPercentile: 18.9
      },
      {
          id: 4,
          name: '中证白酒',
          category: '消费',
          latestPrice: 13580.7,
          changePercent: 1.25,
          prevChangePercent: 0.3,
          weekChange: 3.1,
          monthChange: 8.9,
          threeMonthChange: 2.3,
          ytdChange: -5.6,
          yearChange: -15.8,
          threeYearChange: -33.1,
          fiveYearChange: 88.9,
          roe: 28.5,
          revenueGrowth: 15.8,
          profitGrowth: 18.2,
          dividendYield: 1.5,
          pe: 25.1,
          pePercentile: 45.3,
          pb: 5.8,
          pbPercentile: 38.6,
          ps: 6.5,
          psPercentile: 55.2
      },
      {
          id: 5,
          name: '半导体',
          category: '科技',
          latestPrice: 6500.5,
          changePercent: 2.8,
          prevChangePercent: -1.5,
          weekChange: 5.5,
          monthChange: -3.2,
          threeMonthChange: 15.8,
          ytdChange: 12.1,
          yearChange: -5.3,
          threeYearChange: -40.2,
          fiveYearChange: 150.3,
          roe: 5.2,
          revenueGrowth: 18.5,
          profitGrowth: -2.5,
          dividendYield: 0.5,
          pe: 55.8,
          pePercentile: 70.8,
          pb: 4.1,
          pbPercentile: 65.4,
          ps: 4.5,
          psPercentile: 75.1
      },
      {
          id: 6,
          name: '中证银行',
          category: '金融',
          latestPrice: 7200.3,
          changePercent: 0.15,
          prevChangePercent: 0.1,
          weekChange: 0.8,
          monthChange: 4.5,
          threeMonthChange: 10.2,
          ytdChange: 15.3,
          yearChange: 20.5,
          threeYearChange: 5.1,
          fiveYearChange: 25.8,
          roe: 10.1,
          revenueGrowth: 2.1,
          profitGrowth: 3.5,
          dividendYield: 5.5,
          pe: 5.2,
          pePercentile: 2.1,
          pb: 0.5,
          pbPercentile: 1.5,
          ps: 1.2,
          psPercentile: 3.2
      }
  ])

  // --- 计算属性 ---
  /**
   * 根据 sortKey 和 sortOrder 对数据进行排序
   */
  const sortedData = computed(() => {
      if (!sortKey.value) {
          return indexData.value
      }
      const key = sortKey.value
      return [...indexData.value].sort((a, b) => {
          const valA = a[key]
          const valB = b[key]

          if (typeof valA === 'number' && typeof valB === 'number') {
              return sortOrder.value === 'asc' ? valA - valB : valB - valA
          }

          // 字符串或其他类型排序
          if (String(valA) < String(valB)) return sortOrder.value === 'asc' ? -1 : 1
          if (String(valA) > String(valB)) return sortOrder.value === 'asc' ? 1 : -1
          return 0
      })
  })

  // --- 方法 ---
  /**
   * 处理表头点击事件，更新排序状态
   * @param key 点击的列名
   */
  const handleSort = (key: keyof IndexData) => {
      if (sortKey.value === key) {
          // 如果点击的是当前排序列，则切换排序顺序
          sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      } else {
          // 如果点击的是新列，则设置新列为排序列，并重置为降序
          sortKey.value = key
          sortOrder.value = 'desc'
      }
  }

  /**
   * 格式化百分比显示
   * @param value 数值
   */
  const formatPercentage = (value: number): string => {
      if (value == null) return '-'
      const sign = value > 0 ? '+' : ''
      return `${sign}${value.toFixed(2)}%`
  }

  /**
   * 根据数值正负返回对应的CSS类
   * @param value 数值
   */
  const getColorForChange = (value: number): string => {
      if (value > 0) return 'positive'
      if (value < 0) return 'negative'
      return ''
  }
</script>

<style scoped>
  /* 基础页面样式，大部分复用原有风格 */
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
      background: radial-gradient(circle at 15% 50%, #1a4a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #1f6666, transparent 40%), #121212;
  }

  .main-container {
      max-width: 95%; /* 允许更宽的布局以容纳表格 */
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
      text-shadow: 0 0 15px rgba(57, 204, 204, 0.7);
  }
  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  /* --- 新增：表格容器和表格样式 --- */
  .table-container {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      animation: fadeInUp 0.5s ease-out 0.2s forwards;
      opacity: 0;
      overflow-x: auto; /* 关键：当表格过宽时，允许水平滚动 */
  }

  table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1800px; /* 设置一个最小宽度以确保在宽屏下也能正常显示 */
      white-space: nowrap; /* 防止单元格内容换行 */
  }

  th,
  td {
      padding: 12px 15px;
      text-align: right; /* 数据列右对齐，更易于比较 */
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  th:first-child,
  td:first-child,
  th:nth-child(2),
  td:nth-child(2) {
      text-align: left; /* 指数名称和分类左对齐 */
  }

  thead th {
      background-color: rgba(57, 204, 204, 0.1);
      font-weight: 600;
      color: #e0e0e0;
      cursor: pointer;
      transition: background-color 0.3s ease;
      position: sticky; /* 表头吸顶 */
      top: 0;
      z-index: 1;
  }

  thead th:hover {
      background-color: rgba(57, 204, 204, 0.2);
  }

  .sort-indicator {
      margin-left: 5px;
      color: #39cccc;
  }

  tbody tr {
      transition: background-color 0.3s ease;
  }

  tbody tr:hover {
      background-color: rgba(255, 255, 255, 0.08);
  }

  td {
      color: #c0c0c0;
  }

  .positive {
      color: #ff6b6b; /* 红涨 */
  }

  .negative {
      color: #28a745; /* 绿跌 */
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
      .page-wrapper {
          padding: 2rem 0.5rem;
      }
      .main-title {
          font-size: 2rem;
      }
      .table-container {
          padding: 1rem;
      }
      th,
      td {
          padding: 10px 8px;
          font-size: 0.9rem;
      }
  }
</style>