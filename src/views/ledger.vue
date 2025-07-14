<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 & 管理员切换 -->
      <div class="page-header">
        <div class="header-top">
          <a href="#" class="back-button">← 返回主页</a>
          <div class="admin-switch">
            <label for="admin-mode">管理员模式</label>
            <input type="checkbox" id="admin-mode" v-model="isAdmin">
          </div>
        </div>
        <h1 class="main-title">
          <span class="title-icon">📒</span>
          个人实盘记账本
        </h1>
        <p class="subtitle">
          透明、客观、可追溯——记录投资路上的每一步。
        </p>
      </div>

      <!-- 2. 仪表盘网格布局 -->
      <div class="dashboard-grid">

        <!-- A. 关键指标 & 日期选择 -->
        <div class="content-card summary-card">
          <div class="metrics-container">
            <div class="metric-item">
              <span class="metric-label">当前总资产 (元)</span>
              <span class="metric-value">{{ summaryData.totalAssets }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">当日总盈亏 (元)</span>
              <span :class="['metric-value', summaryData.totalPnl.amount >= 0 ? 'positive' : 'negative']">
                {{ summaryData.totalPnl.amount >= 0 ? '+' : '' }}{{ summaryData.totalPnl.amount }}
                ({{ summaryData.totalPnl.rate }}%)
              </span>
            </div>
          </div>
          <div class="controls-container">
            <div class="date-selector">
              <label for="view-date">查看日期:</label>
              <input type="date" id="view-date" v-model="selectedDate">
            </div>
            <button v-if="isAdmin" class="record-btn" @click="openModal">录入数据</button>
          </div>
        </div>

        <!-- B. 总资产走势图 (全宽) -->
        <div class="content-card full-width-card">
          <h2 class="card-title">总资产走势</h2>
          <div ref="assetTrendChart" class="echart-container"></div>
        </div>

        <!-- C. 各策略当日盈亏 -->
        <div class="content-card">
          <h2 class="card-title">各策略当日盈亏</h2>
          <div ref="dailyPnlChart" class="echart-container-small"></div>
        </div>

        <!-- D. 当日操作记录 -->
        <div class="content-card">
          <h2 class="card-title">当日操作记录</h2>
          <div v-if="operationsLog && operationsLog.length > 0" class="operations-list-container">
            <ul class="operations-list">
              <li v-for="(op, index) in operationsLog" :key="index" :class="op.type">
                <span class="op-icon"></span>
                <span class="op-desc">{{ op.description }}</span>
                <span class="op-time">{{ op.time }}</span>
              </li>
            </ul>
          </div>
          <p v-else class="no-data-placeholder">当日无操作记录</p>
        </div>

      </div>
    </div>

    <!-- 数据录入模态框 -->
    <Transition name="modal-fade">
      <div v-if="isModalVisible" class="modal-backdrop" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>录入 {{ selectedDate }} 的数据</h3>
            <button class="modal-close-button" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>当日总资产 (元)</label>
              <input type="number" v-model.number="newEntryData.totalAssets" placeholder="输入收盘后的总资产">
            </div>
            <div class="form-group">
              <label>各策略当日盈亏 (元)</label>
              <div v-for="strategy in newEntryData.strategyPnl" :key="strategy.name" class="strategy-input-group">
                <span>{{ strategy.name }}</span>
                <input type="number" v-model.number="strategy.pnlAmount" :placeholder="`输入${strategy.name}盈亏`">
              </div>
            </div>
            <div class="form-group">
              <label>当日操作记录</label>
              <div v-for="(op, index) in newEntryData.operations" :key="index" class="operation-input-group">
                <select v-model="op.type">
                  <option value="buy">买入</option>
                  <option value="sell">卖出</option>
                </select>
                <input type="text" v-model="op.description" placeholder="操作描述，如: 买入XXETF 1000元">
                <input type="time" v-model="op.time">
                <button class="delete-op-btn" @click="removeOperationFromForm(index)">-</button>
              </div>
              <button class="add-op-btn" @click="addOperationToForm">➕ 添加操作</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="closeModal">取消</button>
            <button class="save-btn" @click="handleSave">确认保存</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue' // 引入 onUnmounted
  import * as echarts from 'echarts'

  // --- 类型定义 (无变化) ---
  interface Pnl {
      amount: number
      rate: number
  }
  interface StrategyPnl {
      name: string
      pnlAmount: number
      pnlRate?: number
  }
  interface Operation {
      type: 'buy' | 'sell'
      description: string
      time: string
  }
  interface DailyData {
      totalAssets: number
      totalPnl: Pnl
      strategyPnl: StrategyPnl[]
      operations: Operation[]
  }

  // --- 丰富且连贯的模拟数据库 (无变化) ---
  const mockDatabase = reactive<Record<string, DailyData>>({
      '2025-07-15': {
          /* ... data ... */
      },
      '2025-07-14': {
          /* ... data ... */
      },
      '2025-07-11': {
          /* ... data ... */
      },
      '2025-07-10': {
          /* ... data ... */
      },
      '2025-07-09': {
          /* ... data ... */
      }
  })

  // --- 响应式状态 (无变化) ---
  const isAdmin = ref(true)
  const isModalVisible = ref(false)
  const selectedDate = ref('2025-07-15')
  let newEntryData = reactive(getInitialFormData())

  const summaryData = ref<DailyData>(mockDatabase[selectedDate.value] || getEmptyDailyData())
  const operationsLog = ref<Operation[] | undefined>(summaryData.value.operations)

  const assetTrendChart = ref<HTMLElement | null>(null)
  const dailyPnlChart = ref<HTMLElement | null>(null)
  let assetChartInstance: echarts.ECharts | null = null
  let pnlChartInstance: echarts.ECharts | null = null

  // --- 工具函数 (无变化) ---
  function getEmptyDailyData(): DailyData {
      /* ... */
  }
  function getInitialFormData() {
      /* ... */
  }
  function formatDate(date: Date) {
      /* ... */
  }

  // --- 核心业务逻辑 (无变化) ---
  const openModal = () => {
      /* ... */
  }
  const closeModal = () => {
      /* ... */
  }
  const addOperationToForm = () => {
      /* ... */
  }
  const removeOperationFromForm = (index: number) => {
      /* ... */
  }
  const handleSave = () => {
      /* ... */
  }

  // --- ECharts 图表更新 (已修复) ---
  const updateAssetTrendChart = () => {
      /* ... (无变化) ... */
  }

  const updateDailyPnlChart = () => {
      if (!pnlChartInstance) return
      const data = summaryData.value.strategyPnl || []

      // 【关键修复】更新 setOption 时，必须提供完整的 series 结构，至少包含 type。
      pnlChartInstance.setOption(
          {
              yAxis: { data: data.map(d => d.name) },
              series: [
                  {
                      name: '盈亏金额', // 补全
                      type: 'bar', // 补全
                      data: data.map(d => d.pnlAmount)
                  }
              ],
              visualMap: {
                  min: Math.min(...data.map(d => d.pnlAmount), -1),
                  max: Math.max(...data.map(d => d.pnlAmount), 1)
              }
          },
          { notMerge: true }
      )
  }

  // --- 数据同步与监听 (无变化) ---
  const updatePageData = (date: string) => {
      /* ... */
  }
  watch(selectedDate, updatePageData)

  // --- 生命周期钩子 (已修改) ---
  onMounted(() => {
      // 总资产走势图
      if (assetTrendChart.value) {
          assetChartInstance = echarts.init(assetTrendChart.value)
          assetChartInstance.setOption({
              /* ... 初始配置 ... */
          })
          updateAssetTrendChart()
      }

      // 当日策略盈亏图
      if (dailyPnlChart.value) {
          pnlChartInstance = echarts.init(dailyPnlChart.value)
          pnlChartInstance.setOption({
              /* ... 初始配置 ... */
          })
          updateDailyPnlChart()
      }
  })

  // 【关键修复】增加 onUnmounted 钩子，在组件销毁时清理 ECharts 实例
  onUnmounted(() => {
      if (assetChartInstance) {
          assetChartInstance.dispose()
      }
      if (pnlChartInstance) {
          pnlChartInstance.dispose()
      }
  })
</script>

<style scoped>
  /* 样式与上一个版本几乎一致，仅微调了占位符样式 */
  :root {
      --theme-color: #00c497;
      --positive-color: #28a745;
      --negative-color: #dc3545;
  }
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
  }
  .main-container {
      max-width: 1200px;
      margin: 0 auto;
  }
  .page-header {
      text-align: center;
      margin-bottom: 3rem;
  }
  .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 1rem;
  }
  .back-button {
      color: #b0c4de;
      text-decoration: none;
      font-size: 0.9rem;
  }
  .admin-switch {
      display: flex;
      align-items: center;
      gap: 0.5rem;
  }
  .admin-switch input {
      accent-color: var(--theme-color);
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
      color: var(--theme-color);
      text-shadow: 0 0 15px var(--theme-color);
  }
  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }
  .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
  }
  .content-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem 2rem;
      backdrop-filter: blur(10px);
  }
  .full-width-card {
      grid-column: 1 / -1;
  }
  .summary-card {
      grid-column: 1 / -1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
  }
  .metrics-container {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
  }
  .metric-item {
      display: flex;
      flex-direction: column;
  }
  .metric-label {
      font-size: 0.9rem;
      color: #b0c4de;
      margin-bottom: 0.25rem;
  }
  .metric-value {
      font-size: 1.8rem;
      font-weight: bold;
  }
  .metric-value.positive {
      color: var(--positive-color);
  }
  .metric-value.negative {
      color: var(--negative-color);
  }
  .controls-container {
      display: flex;
      align-items: center;
      gap: 1rem;
  }
  .date-selector input[type='date'] {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #fff;
      padding: 0.5rem;
  }
  .record-btn {
      background-color: var(--theme-color);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0.6rem 1.2rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s;
  }
  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 1.5rem;
      border-left: 4px solid var(--theme-color);
      padding-left: 1rem;
  }
  .echart-container {
      width: 100%;
      height: 350px;
  }
  .echart-container-small {
      width: 100%;
      height: 250px;
  }
  .operations-list-container {
      max-height: 250px;
      overflow-y: auto;
  }
  .operations-list {
      list-style: none;
      padding: 0;
      margin: 0;
  }
  .operations-list li {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .op-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #121212;
      flex-shrink: 0;
  }
  li.buy .op-icon::before {
      content: '买';
      background-color: var(--positive-color);
  }
  li.sell .op-icon::before {
      content: '卖';
      background-color: var(--negative-color);
  }
  .op-icon::before {
      display: block;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      text-align: center;
      line-height: 20px;
  }
  .op-desc {
      flex-grow: 1;
  }
  .op-time {
      font-size: 0.8rem;
      color: #b0c4de;
  }
  .no-data-placeholder {
      color: #888;
      text-align: center;
      padding: 4rem 0;
      font-style: italic;
  }

  /* 模态框样式 */
  .modal-fade-enter-active,
  .modal-fade-leave-active {
      transition: opacity 0.3s ease;
  }
  .modal-fade-enter-from,
  .modal-fade-leave-to {
      opacity: 0;
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
      width: 90%;
      max-width: 600px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
  }
  .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .modal-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-height: 60vh;
      overflow-y: auto;
  }
  .form-group > label {
      display: block;
      font-weight: bold;
      margin-bottom: 0.75rem;
  }
  .form-group input,
  .form-group select {
      width: 100%;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #fff;
      padding: 0.75rem;
  }
  .strategy-input-group,
  .operation-input-group {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 0.5rem;
  }
  .strategy-input-group span {
      flex-basis: 120px;
  }
  .operation-input-group select {
      flex-basis: 80px;
  }
  .delete-op-btn,
  .add-op-btn {
      background: #dc3545;
      border: none;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      font-size: 1rem;
      cursor: pointer;
      line-height: 24px;
  }
  .add-op-btn {
      background: var(--theme-color);
      margin-top: 0.5rem;
      width: auto;
      border-radius: 6px;
      padding: 0.25rem 1rem;
  }
  .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
  }
  .cancel-btn {
      background: rgba(255, 255, 255, 0.1);
  }
  .save-btn {
      background: var(--theme-color);
  }
  .cancel-btn,
  .save-btn {
      color: white;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
  }
</style>