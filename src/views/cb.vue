<template>
  <div class="page-wrapper">
    <div class="main-container">

      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <span class="title-icon">🌱</span>
          惊蛰策略调仓
        </h1>
        <p class="subtitle">
          监控持仓明细、市值分布及每日资金再平衡。
        </p>
      </div>

      <div class="content-grid">

        <div class="content-card calculator-card">
          <h2 class="card-title">份数计算器</h2>
          <div class="calc-wrapper">
            <div class="input-group">
              <label>计划投入金额 (元)</label>
              <input type="number" v-model.number="investmentAmount" placeholder="输入金额..." class="calc-input">
            </div>
            <div class="result-group">
              <div class="result-label">当前 1 份成本 (50张)</div>
              <div class="result-value">¥ {{ oneUnitCost.toFixed(2) }}</div>
            </div>
            <div class="result-group highlight">
              <div class="result-label">可买份数</div>
              <div class="result-value big">{{ canBuyUnits }} 份</div>
            </div>
          </div>
        </div>

        <div class="content-card advice-card">
          <div class="card-header-flex">
            <h2 class="card-title no-margin">今日操作建议</h2>

            <div class="update-badge">
              <span class="pulse-dot"></span>
              <span class="time-text">数据更新: {{ updateTime }}</span>
            </div>
          </div>
          <div v-if="advice.buy.length === 0 && advice.sell.length === 0" class="no-action">
            🍵 今日无操作，继续持有
          </div>

          <div class="advice-container" v-else>
            <div class="advice-box sell-box" v-if="advice.sell.length > 0">
              <div class="box-header">
                <span class="header-title">🔴 建议卖出</span>
                <button class="copy-btn" @click="copyCodes('sell')">
                  复制代码
                </button>
              </div>
              <ul class="action-list">
                <li v-for="item in advice.sell" :key="item.code">
                  <div class="info-left">
                    <span class="name">{{ item.name }}</span>
                    <span class="code">{{ item.code }}</span>
                  </div>
                  <div class="info-right">
                    <span class="price-label">挂单价</span>
                    <span class="price">¥{{ item.targetPrice?.toFixed(2) }}</span>
                  </div>
                </li>
              </ul>
            </div>
            <div class="advice-box buy-box" v-if="advice.buy.length > 0">
              <div class="box-header">
                <span class="header-title">🟢 建议买入</span>
                <button class="copy-btn" @click="copyCodes('buy')">
                  复制代码
                </button>
              </div>
              <ul class="action-list">
                <li v-for="item in advice.buy" :key="item.code">
                  <div class="info-left">
                    <span class="name">{{ item.name }}</span>
                    <span class="code">{{ item.code }}</span>
                  </div>
                  <div class="info-right">
                    <span class="price-label">挂单价</span>
                    <span class="price">¥{{ item.targetPrice?.toFixed(2) }}</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">核心持仓 (Top 5)</h2>
          <div class="table-container">
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>代码</th>
                  <th>转债名称</th>
                  <th>当前价格</th>

                </tr>
              </thead>
              <tbody>
                <tr v-for="bond in bonds" :key="bond.code">
                  <td class="mono-font">{{ bond.code }}</td>
                  <td>{{ bond.name }}</td>
                  <td class="price-col">{{ bond.price.toFixed(3) }}</td>

                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '@/store/user'
  import app from '@/lib/cloudbase'

  const router = useRouter()
  const userStore: any = useUserStore()
  // 尝试注入 showMessage，如果没有则使用 alert
  const showMessage: any = inject('showMessage', (msg: string) => alert(msg))

  // 新增：数据更新时间 (模拟数据，实际可从后端获取)
  const updateTime = ref('2026-02-03 09:30')

  // --- 数据定义 ---
  interface BondItem {
      code: string
      name: string
      price: number
  }

  interface AdviceItem {
      code: string
      name: string
      targetPrice?: number
  }

  // 模拟持仓数据 (Top 5)
  const bonds = ref<BondItem[]>([])

  // 模拟建议数据
  const advice = ref<{ buy: AdviceItem[]; sell: AdviceItem[] }>({
      buy: [],
      sell: []
  })

  // --- 计算属性 ---

  // 1. 计算组合均值 (5只转债价格的平均数)
  const portfolioAverage = computed(() => {
      if (bonds.value.length === 0) return 0
      const sum = bonds.value.reduce((acc, cur) => acc + cur.price, 0)
      return sum / bonds.value.length
  })

  // 2. 计算器逻辑
  const investmentAmount = ref<number | null>(null)

  // 1份的成本 = 5只转债 * 每只10张 * 价格
  const oneUnitCost = computed(() => {
      const sumPrice = bonds.value.reduce((acc, cur) => acc + cur.price, 0)
      return sumPrice * 10
  })

  const canBuyUnits = computed(() => {
      if (!investmentAmount.value || oneUnitCost.value === 0) return 0
      return (investmentAmount.value / oneUnitCost.value).toFixed(2)
  })

  // --- 方法 ---

  // 核心功能：复制买入/卖出代码
  const copyCodes = async (type: 'buy' | 'sell') => {
      const list = type === 'buy' ? advice.value.buy : advice.value.sell

      if (!list || list.length === 0) {
          showMessage('列表为空，无法复制', 'warning')
          return
      }

      // 修改：使用 \r\n 确保在Windows环境和大多数交易软件中能正确换行
      const textToCopy = list.map(item => item.code).join('\n')

      try {
          await navigator.clipboard.writeText(textToCopy)
          showMessage(`${type === 'buy' ? '买入' : '卖出'}代码已复制到剪贴板`, 'success')
      } catch (err) {
          console.error('复制失败:', err)
          showMessage('复制失败，请手动复制', 'error')
      }
  }

  // 获取数据的函数 (预留)
  const fetchData = async () => {
      try {
          // 调用刚才写的云函数
          const res = await app.callFunction({
              name: 'getJingzheData' // 确保云函数名字一致
          })

          const result = res.result

          if (result.success) {
              // 1. 更新持仓列表 (直接映射)
              // 数据库里可能有 extra 字段，但我们前端只需要 code, name, price
              bonds.value = result.data.bonds.map((item: any) => ({
                  code: item.code,
                  name: item.name,
                  price: Number(item.price) // 确保转为数字
              }))

              // 2. 更新调仓建议
              advice.value = result.data.advice

              // 3. 更新时间
              updateTime.value = result.data.updateTime

              showMessage('策略数据已更新', 'success')
          } else {
              console.error('获取失败:', result.message)
              showMessage(result.message || '获取数据失败', 'error')
          }
      } catch (err: any) {
          console.error('调用云函数失败:', err)
          showMessage('网络错误，请稍后重试', 'error')
      }
  }

  onMounted(() => {
      if (!userStore.userInfo?.admin) {
          // router.push('/') // 开发测试时可暂时注释
      }
      fetchData()
  })
</script>

<style scoped>
  /* 继承全天候的宽屏风格 */
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      background: radial-gradient(circle at 20% 20%, #2a1a4a, transparent 40%),
          radial-gradient(circle at 80% 80%, #1a3a5a, transparent 40%), #121212;
  }

  /* 宽度调整为 900px，与全天候一致 */
  .main-container {
      max-width: 900px;
      margin: 0 auto;
  }

  /* 动画 */
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

  .page-header {
      text-align: center;
      margin-bottom: 2rem;
      animation: fadeInUp 0.5s ease-out forwards;
  }

  .back-button {
      color: #b0c4de;
      text-decoration: none;
      font-size: 0.9rem;
      display: inline-block;
      margin-bottom: 1rem;
      transition: color 0.3s;
  }
  .back-button:hover {
      color: #00aaff;
  }

  .main-title {
      font-size: 2.2rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
  }

  .title-icon {
      color: #ffd700;
      text-shadow: 0 0 10px #ffd700;
  }
  .subtitle {
      font-size: 0.9rem;
      color: #8392a5;
  }

  .content-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
  }

  .content-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      backdrop-filter: blur(10px);
      animation: fadeInUp 0.5s ease-out forwards;
      animation-delay: 0.2s;
  }

  .card-title {
      font-size: 1.2rem;
      margin-top: 0;
      margin-bottom: 1.2rem;
      border-left: 4px solid #ffd700;
      padding-left: 0.8rem;
      color: #fff;
  }

  /* 表格样式 */
  .table-container {
      /* overflow-x: auto; */
  }
  .portfolio-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 400px;
  }
  .portfolio-table th {
      text-align: left;
      color: #8392a5;
      font-size: 0.85rem;
      padding-bottom: 0.8rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .portfolio-table td {
      padding: 1rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 1rem;
  }
  .portfolio-table tr:last-child td {
      border-bottom: none;
  }
  .mono-font {
      font-family: monospace;
      color: #b0c4de;
      font-size: 1.1rem;
  }
  .price-col {
      font-weight: bold;
      color: #fff;
  }
  .avg-col {
      color: #00aaff;
      font-weight: bold;
  }

  /* 建议部分 */
  .no-action {
      text-align: center;
      color: #8392a5;
      padding: 2rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
  }
  .advice-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
  }
  .advice-box {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 1rem;
      border-top-width: 3px;
      border-top-style: solid;
  }
  .buy-box {
      border-top-color: #00c497;
  }
  .sell-box {
      border-top-color: #ff4d4f;
  }

  /* Header 样式 */
  .box-header {
      margin-bottom: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
  }

  .header-title {
      font-weight: bold;
      font-size: 1rem;
      color: #fff;
  }

  /* 复制按钮样式 */
  .copy-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #b0c4de;
      font-size: 0.8rem;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      line-height: 1;
  }
  .copy-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.4);
      color: #fff;
  }
  .copy-btn:active {
      transform: translateY(1px);
  }

  /* --- 修改：操作列表改为 Flex Row 布局，左右平衡 --- */
  .action-list {
      list-style: none;
      padding: 0;
      margin: 0;
  }
  .action-list li {
      display: flex;
      flex-direction: row; /* 水平排列 */
      justify-content: space-between; /* 撑开两端 */
      align-items: center; /* 垂直居中 */
      margin-bottom: 0.8rem;
      padding-bottom: 0.8rem;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  }
  .action-list li:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
  }

  /* 左侧信息组 */
  .info-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
  }
  .info-left .name {
      font-size: 1.1rem;
      font-weight: bold;
      color: #fff;
  }
  .info-left .code {
      font-size: 0.85rem;
      color: #8392a5;
      font-family: monospace;
  }

  /* 右侧信息组 */
  .info-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end; /* 右对齐 */
      gap: 2px;
  }
  .info-right .price-label {
      font-size: 0.75rem;
      color: #8392a5;
  }
  .info-right .price {
      font-size: 1.1rem;
      color: #ffd700;
      font-weight: bold;
  }

  /* --- 计算器样式 --- */
  .calc-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.5rem;
  }
  .input-group {
      flex: 1;
      min-width: 200px;
  }
  .input-group label {
      display: block;
      font-size: 0.85rem;
      color: #b0c4de;
      margin-bottom: 0.5rem;
  }
  .calc-input {
      width: 92%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.8rem;
      border-radius: 6px;
      color: #fff;
      font-size: 1.1rem;
      outline: none;
  }
  .calc-input:focus {
      border-color: #ffd700;
  }

  .result-group {
      text-align: center;
      padding: 0 1rem;
  }
  .result-label {
      font-size: 0.8rem;
      color: #8392a5;
      margin-bottom: 0.3rem;
  }
  .result-value {
      font-size: 1.2rem;
      font-weight: bold;
      color: #fff;
  }
  .result-value.big {
      font-size: 1.2rem;
      color: #ffd700;
  }
  .result-sub {
      font-size: 0.75rem;
      color: #b0c4de;
      margin-top: 0.2rem;
  }

  @media (max-width: 600px) {
      .advice-container {
          grid-template-columns: 1fr;
      }
      .calc-wrapper {
          flex-direction: column;
          align-items: stretch;
      }
      .result-group {
          text-align: left;
          padding: 0;
          background: rgba(0, 0, 0, 0.2);
          padding: 10px;
          border-radius: 6px;
      }
  }

  .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.2rem; /* 替代原标题的下边距 */
      flex-wrap: wrap; /* 防止手机端溢出 */
      gap: 10px;
  }

  /* 去掉标题原本的下边距，由容器控制 */
  .card-title.no-margin {
      margin-bottom: 0;
  }

  /* --- 新增：更新时间胶囊样式 --- */
  .update-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.4); /* 深色背景 */
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 20px; /* 胶囊圆角 */
      font-family: 'SF Mono', 'Roboto Mono', monospace; /* 等宽字体更有数字感 */
  }

  .time-text {
      font-size: 0.85rem;
      color: #b0c4de;
      letter-spacing: 0.5px;
  }

  /* 绿色呼吸点 */
  .pulse-dot {
      width: 8px;
      height: 8px;
      background-color: #00c497; /* 鲜艳的绿色 */
      border-radius: 50%;
      box-shadow: 0 0 0 rgba(0, 196, 151, 0.4);
      animation: pulse 2s infinite;
  }

  @keyframes pulse {
      0% {
          box-shadow: 0 0 0 0 rgba(0, 196, 151, 0.4);
      }
      70% {
          box-shadow: 0 0 0 6px rgba(0, 196, 151, 0);
      }
      100% {
          box-shadow: 0 0 0 0 rgba(0, 196, 151, 0);
      }
  }

  /* 手机端适配：如果屏幕太窄，让时间换行显示 */
  /* @media (max-width: 480px) {
                                .update-badge {
                                    margin-left: auto; 
                                }
                            } */
</style>