<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>
        <h1 class="main-title">
          <span class="title-icon">🛠️</span>
          投资小工具
        </h1>
        <p class="subtitle">
          辅助科学决策，优化您的投资组合。
        </p>
      </div>

      <!-- 2. 工具卡片网格 -->
      <div class="tools-grid">

        <!-- 再平衡计算器 -->
        <div class="content-card rebalance-calculator">
          <h2 class="card-title">投资组合再平衡计算器</h2>
          <p class="card-description">当资产比例偏离目标时，通过此工具计算出最优的买卖操作，让组合重回正轨。</p>

          <!-- 资产列表 -->
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>资产名称</th>
                  <th>当前持仓 (元)</th>
                  <th>计划比例 (%)</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(asset) in portfolio" :key="asset.id">
                  <td><input type="text" v-model="asset.name" placeholder="如: 沪深300ETF"></td>
                  <td><input type="number" v-model.number="asset.amount" min="0"></td>
                  <td><input type="number" v-model.number="asset.target" min="0" max="100"></td>
                  <td><button class="delete-btn" @click="removeAsset(asset.id)">×</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <button class="add-asset-btn" @click="addAsset">➕ 添加资产</button>

          <!-- 计算区域 -->
          <div class="calculation-zone">
            <div class="input-group">
              <label for="additional-investment">追加投资金额 (元):</label>
              <input type="number" id="additional-investment" v-model.number="additionalInvestment" placeholder="输入正数为加仓,负数为减仓">
            </div>
            <button class="calculate-btn" @click="calculateRebalance">开始计算</button>
          </div>

          <!-- 结果展示 -->
          <div v-if="calculationResult" class="result-container">
            <h3 class="result-title">平衡方案建议</h3>
            <p class="result-summary">调整后总资产: <strong>{{ calculationResult.newTotal.toFixed(2) }} 元</strong></p>
            <ul class="result-list">
              <li v-for="item in calculationResult.adjustments" :key="item.name">
                <strong>【{{ item.name }}】</strong>:
                <span :class="item.action === '买入' ? 'buy-action' : 'sell-action'">
                  需{{ item.action }} <strong>{{ item.adjustment.toFixed(2) }}</strong> 元
                </span>
              </li>
            </ul>
          </div>

        </div>

        <!-- 其他工具卡片 (示例) -->
        <div class="content-card coming-soon">
          <h2 class="card-title">复利计算器</h2>
          <p class="card-description">直观感受世界第八大奇迹的力量，预测您在不同利率下的未来财富。</p>
          <span class="status-tag">敬请期待</span>
        </div>

        <div class="content-card coming-soon">
          <h2 class="card-title">定投计算器</h2>
          <p class="card-description">模拟在不同市场行情下进行定期投资的最终效果，辅助您制定定投计划。</p>
          <span class="status-tag">敬请期待</span>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  // --- 类型定义 ---
  interface Asset {
      id: number
      name: string
      amount: number
      target: number
  }
  interface Adjustment {
      name: string
      action: '买入' | '卖出' | '持有'
      adjustment: number
  }
  interface Result {
      newTotal: number
      adjustments: Adjustment[]
  }

  // --- 响应式状态 ---
  const portfolio = ref<Asset[]>([
      { id: 1, name: '红利质量', amount: 6000, target: 20 },
      { id: 2, name: '纳指100', amount: 3000, target: 20 },
      { id: 3, name: '超长债', amount: 1000, target: 30 },
      { id: 3, name: '黄金', amount: 1000, target: 30 }
  ])
  const additionalInvestment = ref<number>(1000)
  const calculationResult = ref<Result | null>(null)

  // --- 方法 ---
  const addAsset = () => {
      portfolio.value.push({
          id: Date.now(),
          name: '',
          amount: 0,
          target: 0
      })
  }

  const removeAsset = (id: number) => {
      portfolio.value = portfolio.value.filter(asset => asset.id !== id)
  }

  const calculateRebalance = () => {
      // 校验比例之和
      const totalTarget = portfolio.value.reduce((sum, asset) => sum + asset.target, 0)
      if (totalTarget !== 100) {
          alert(`错误：计划比例总和必须为100%，当前为 ${totalTarget}%。`)
          calculationResult.value = null
          return
      }

      const currentTotal = portfolio.value.reduce((sum, asset) => sum + asset.amount, 0)
      const newTotal = currentTotal + (additionalInvestment.value || 0)

      if (newTotal < 0) {
          alert('错误：减仓金额不能超过总资产。')
          calculationResult.value = null
          return
      }

      const adjustments: Adjustment[] = portfolio.value.map(asset => {
          const targetAmount = newTotal * (asset.target / 100)
          const adjustmentValue = targetAmount - asset.amount

          let action: '买入' | '卖出' | '持有' = '持有'
          if (adjustmentValue > 0.01) {
              // 增加一个小的阈值避免浮点数误差
              action = '买入'
          } else if (adjustmentValue < -0.01) {
              action = '卖出'
          }

          return {
              name: asset.name || '未命名资产',
              action,
              adjustment: Math.abs(adjustmentValue)
          }
      })

      calculationResult.value = { newTotal, adjustments }
  }
</script>

<style scoped>
  /* 定义页面主题色 */
  :root {
      --theme-color: #8a2be2; /* 蓝紫色 */
  }

  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      background: radial-gradient(circle at 50% 15%, #2a1a4a, transparent 40%),
          radial-gradient(circle at 15% 85%, #4a2a1a, transparent 40%), #121212;
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
      color: #8a2be2;
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
      color: #8a2be2;
      text-shadow: 0 0 15px #8a2be2;
  }
  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  /* 工具网格和卡片 */
  .tools-grid {
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
      border-color: rgba(138, 43, 226, 0.5);
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 0.5rem;
      border-left: 4px solid #8a2be2;
      padding-left: 1rem;
  }
  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
      margin-bottom: 1.5rem;
  }

  /* 表格和输入框样式 */
  .table-container {
      overflow-x: auto;
  } /* 保证在小屏幕上可滑动 */
  .data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 600px;
  }
  .data-table th,
  .data-table td {
      padding: 0.5rem;
      text-align: center;
      vertical-align: middle;
  }
  .data-table th {
      color: #b0c4de;
      font-weight: normal;
      font-size: 0.8rem;
      padding-bottom: 1rem;
  }
  .data-table input[type='text'],
  .data-table input[type='number'] {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #fff;
      padding: 0.6rem;
      font-size: 0.9rem;
      text-align: center;
  }
  .data-table input:focus {
      border-color: #8a2be2;
      outline: none;
  }
  .delete-btn {
      background: none;
      border: none;
      color: #ff4081;
      font-size: 1.5rem;
      cursor: pointer;
      transition: color 0.2s;
      line-height: 1;
  }
  .delete-btn:hover {
      color: #fff;
  }
  .add-asset-btn {
      margin-top: 1rem;
      background: rgba(138, 43, 226, 0.2);
      border: 1px dashed #8a2be2;
      color: #8a2be2;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
  }
  .add-asset-btn:hover {
      background: rgba(138, 43, 226, 0.4);
      color: #fff;
  }

  /* 计算区域 */
  .calculation-zone {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
  }
  .input-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
  }
  .input-group label {
      color: #b0c4de;
      font-size: 0.9rem;
  }
  .input-group input {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #fff;
      padding: 0.6rem;
      max-width: 180px;
  }
  .calculate-btn {
      background-color: #8a2be2;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.8rem 2rem;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 0 15px rgba(138, 43, 226, 0.3);
  }
  .calculate-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(138, 43, 226, 0.5);
  }

  /* 结果区域 */
  .result-container {
      margin-top: 2rem;
      padding: 1.5rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      border-left: 3px solid #8a2be2;
  }
  .result-title {
      margin-top: 0;
      font-size: 1.2rem;
  }
  .result-summary {
      color: #b0c4de;
      margin-bottom: 1rem;
  }
  .result-list {
      list-style: none;
      padding: 0;
      margin: 0;
  }
  .result-list li {
      margin-bottom: 0.5rem;
  }
  .buy-action {
      color: #28a745;
  }
  .sell-action {
      color: #dc3545;
  }

  /* 待开发卡片样式 */
  .coming-soon {
      opacity: 0.6;
      position: relative;
      overflow: hidden;
      cursor: not-allowed;
  }
  .status-tag {
      position: absolute;
      top: 1.5rem;
      right: -50px;
      background: #8a2be2;
      color: white;
      padding: 0.25rem 4rem;
      transform: rotate(45deg);
      font-size: 0.8rem;
      font-weight: bold;
  }
</style>