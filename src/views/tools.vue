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
                  <td data-label="资产名称"><input type="text" v-model="asset.name" placeholder="如: 沪深300ETF"></td>
                  <td data-label="当前持仓 (元)"><input type="number" v-model.number="asset.amount" min="0"></td>
                  <td data-label="计划比例 (%)"><input type="number" v-model.number="asset.target" min="0" max="100"></td>
                  <td data-label="操作"><button class="delete-btn" @click="removeAsset(asset.id)">×</button></td>
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

            <div class="checkbox-group">
              <input type="checkbox" id="buy-only-mode" v-model="buyOnlyMode">
              <label for="buy-only-mode">仅买入模式 (不卖出资产)</label>
            </div>

            <div class="button-group">
              <button class="calculate-btn" @click="calculateRebalance">开始计算</button>
              <button class="calculate-btn secondary" @click="calculateMinimumInvestment">计算最小追加额</button>
            </div>
          </div>
          <div v-if="minimumInvestmentResult" class="min-invest-result">
            <span>💡 {{ minimumInvestmentResult.message }}</span>
            <button v-if="minimumInvestmentResult.amount > 0" class="apply-btn" @click="applyMinimumInvestment">
              应用此金额
            </button>
          </div>

          <!-- 结果展示 -->
          <div v-if="calculationResult" class="result-container">
            <h3 class="result-title">
              平衡方案建议
              <span class="mode-indicator">({{ calculationResult.mode }})</span>
            </h3>
            <p class="result-summary">
              调整前总资产: <strong>{{ calculationResult.currentTotal.toFixed(2) }} 元</strong>
              | 调整后总资产: <strong>{{ calculationResult.newTotal.toFixed(2) }} 元</strong>
            </p>

            <div class="table-container result-table-container">
              <table class="result-table">
                <thead>
                  <tr>
                    <th>资产名称</th>
                    <th>当前比例</th>
                    <th>相对偏离(调前)</th>
                    <th>操作建议</th>
                    <th>调整后比例</th>
                    <th>相对偏离(调后)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in calculationResult.adjustments" :key="item.name">
                    <td data-label="资产名称">{{ item.name }}</td>
                    <td data-label="当前比例">{{ item.currentProportion.toFixed(2) }}%</td>
                    <!-- MODIFICATION: Changed to display relative deviation -->
                    <td data-label="相对偏离(调前)"
                      :class="{ 'positive-deviation': item.currentRelativeDeviation > 1, 'negative-deviation': item.currentRelativeDeviation < -1 }">
                      {{ item.currentRelativeDeviation.toFixed(2) }}%
                    </td>
                    <td data-label="操作建议">
                      <span v-if="item.action !== '持有'" :class="item.action === '买入' ? 'buy-action' : 'sell-action'">
                        {{ item.action }} {{ item.adjustment.toFixed(2) }} 元
                      </span>
                      <span v-else class="hold-action">无需操作</span>
                    </td>
                    <td data-label="调整后比例">{{ item.newProportion.toFixed(2) }}%</td>
                    <td data-label="相对偏离(调后)"
                      :class="{ 'positive-deviation': item.newRelativeDeviation > 1, 'negative-deviation': item.newRelativeDeviation < -1 }">
                      {{ item.newRelativeDeviation.toFixed(2) }}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 复利计算器 -->
        <div class="content-card compound-calculator">
          <h2 class="card-title">复利计算器</h2>
          <p class="card-description">直观感受世界第八大奇迹的力量，预测您在不同的预期年化收益率和定投计划下的未来财富。</p>

          <!-- 输入区域 -->
          <div class="calculator-inputs">
            <div class="input-group">
              <label for="principal">初始本金 (元):</label>
              <input type="number" id="principal" v-model.number="compoundInputs.principal" min="0" placeholder="例如: 10000">
            </div>
            <div class="input-group">
              <label for="rate">预期年化收益率 (%):</label>
              <input type="number" id="rate" v-model.number="compoundInputs.rate" min="0" placeholder="例如: 8">
            </div>
            <div class="input-group">
              <label for="years">投资年限 (年):</label>
              <input type="number" id="years" v-model.number="compoundInputs.years" min="0" placeholder="例如: 20">
            </div>
            <div class="input-group">
              <label for="monthly-contribution">每月定投 (元):</label>
              <input type="number" id="monthly-contribution" v-model.number="compoundInputs.monthlyContribution" min="0"
                placeholder="例如: 500">
            </div>
          </div>

          <!-- 计算按钮 -->
          <div class="calculation-zone">
            <button class="calculate-btn" @click="calculateCompoundInterest">开始计算</button>
          </div>

          <!-- 结果展示 (图表) -->
          <div v-if="chartOption" class="chart-container">
            <v-chart class="chart" :option="chartOption" autoresize />
          </div>
        </div>

        <div class="content-card fire-calculator">
          <h2 class="card-title">资产耗尽模拟 (FIRE计算器)</h2>
          <p class="card-description">计算在考虑通货膨胀和每年支出的情况下，您的现有资产能支撑多久。</p>

          <div class="calculator-inputs">
            <div class="input-group">
              <label>当前总资产 (元):</label>
              <input type="number" v-model.number="fireInputs.totalAssets" min="0">
            </div>
            <div class="input-group">
              <label>预期年化收益率 (%):</label>
              <input type="number" v-model.number="fireInputs.returnRate" placeholder="如: 4">
            </div>
            <div class="input-group">
              <label>首年年度支出 (元):</label>
              <input type="number" v-model.number="fireInputs.annualExpense" min="0">
            </div>
            <div class="input-group">
              <label>预估通货膨胀率 (%):</label>
              <input type="number" v-model.number="fireInputs.inflationRate" placeholder="近10年的平均通胀率为:1.44">
            </div>
          </div>

          <div class="calculation-zone">
            <button class="calculate-btn" @click="calculateFire">开始模拟</button>
          </div>

          <div v-if="fireResultText" class="min-invest-result" style="margin-top: 1rem;">
            <span>💡 {{ fireResultText }}</span>
          </div>

          <div v-if="fireChartOption" class="chart-container">
            <v-chart class="chart" :option="fireChartOption" autoresize />
          </div>
        </div>

        <!-- 其他工具卡片 (示例) -->
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
  import { use } from 'echarts/core'
  import { CanvasRenderer } from 'echarts/renderers'
  import { BarChart } from 'echarts/charts'
  import {
      TitleComponent,
      TooltipComponent,
      GridComponent,
      LegendComponent
  } from 'echarts/components'
  import VChart from 'vue-echarts'
  const showMessage: any = inject('showMessage')

  // 注册 ECharts 组件
  use([CanvasRenderer, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent])

  // --- 1. 类型定义 ---

  // 再平衡计算器相关类型
  interface Asset {
      id: number
      name: string
      amount: number
      target: number
  }
  // MODIFICATION: Changed `currentDeviation` to `currentRelativeDeviation`
  interface Adjustment {
      name: string
      action: '买入' | '卖出' | '持有'
      adjustment: number
      currentProportion: number
      currentRelativeDeviation: number // Relative deviation: (current % - target %) / target %
      newProportion: number
      newRelativeDeviation: number // Relative deviation: (new % - target %) / target %
  }
  interface Result {
      currentTotal: number
      newTotal: number
      adjustments: Adjustment[]
      mode: '完全平衡' | '仅买入'
  }
  interface MinInvestResult {
      message: string
      amount: number
  }

  // 复利计算器输入类型
  interface CompoundInputs {
      principal: number
      rate: number
      years: number
      monthlyContribution: number
  }

  // --- 2. 响应式状态 ---

  // 再平衡计算器状态
  const portfolio = ref<Asset[]>([
      { id: 1, name: '红利质量', amount: 6000, target: 20 },
      { id: 2, name: '纳指100', amount: 3000, target: 20 },
      { id: 3, name: '超长债', amount: 1000, target: 30 },
      { id: 4, name: '黄金', amount: 1000, target: 30 }
  ])
  const additionalInvestment = ref<number>(1000)
  const calculationResult = ref<Result | null>(null)
  const buyOnlyMode = ref<boolean>(false)
  const minimumInvestmentResult = ref<MinInvestResult | null>(null)

  // 复利计算器状态
  const compoundInputs = ref<CompoundInputs>({
      principal: 10000,
      rate: 8,
      years: 20,
      monthlyContribution: 500
  })
  // ECharts 配置项
  const chartOption = ref<any | null>(null)

  // --- 3. 方法 ---

  // --- 再平衡计算器方法 ---
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

  const calculateMinimumInvestment = () => {
      calculationResult.value = null
      const totalTarget = portfolio.value.reduce((sum, asset) => sum + (asset.target || 0), 0)
      if (Math.abs(totalTarget - 100) > 0.01) {
          showMessage(`计划比例总和必须为100%，当前为 ${totalTarget}%。`, 'error')
          minimumInvestmentResult.value = null
          return
      }

      const currentTotal = portfolio.value.reduce((sum, asset) => sum + asset.amount, 0)
      if (currentTotal === 0) {
          minimumInvestmentResult.value = {
              message: '当前总资产为0，无法计算最小追加额。',
              amount: 0
          }
          return
      }

      let maxRequiredTotal = 0
      for (const asset of portfolio.value) {
          if (asset.target > 0) {
              const requiredTotalForAsset = asset.amount / (asset.target / 100)
              if (requiredTotalForAsset > maxRequiredTotal) {
                  maxRequiredTotal = requiredTotalForAsset
              }
          }
      }

      const minInvestment = maxRequiredTotal - currentTotal

      if (minInvestment <= 0.01) {
          minimumInvestmentResult.value = {
              message: '恭喜！您的投资组合已无需追加资金即可平衡。',
              amount: 0
          }
      } else {
          minimumInvestmentResult.value = {
              message: `最少需追加 ${minInvestment.toFixed(2)} 元可完美平衡。`,
              amount: minInvestment
          }
      }
  }

  const applyMinimumInvestment = () => {
      if (minimumInvestmentResult.value && minimumInvestmentResult.value.amount > 0) {
          additionalInvestment.value = parseFloat(minimumInvestmentResult.value.amount.toFixed(2))
          minimumInvestmentResult.value = null
      }
  }

  const calculateRebalance = () => {
      minimumInvestmentResult.value = null
      const totalTarget = portfolio.value.reduce((sum, asset) => sum + (asset.target || 0), 0)
      if (Math.abs(totalTarget - 100) > 0.01) {
          showMessage(`计划比例总和必须为100%，当前为 ${totalTarget}%。`, 'error')
          calculationResult.value = null
          return
      }

      const currentTotal = portfolio.value.reduce((sum, asset) => sum + asset.amount, 0)
      const newTotal = currentTotal + (additionalInvestment.value || 0)

      if (newTotal < 0) {
          showMessage('减仓金额不能超过总资产。', 'error')
          calculationResult.value = null
          return
      }

      // MODIFICATION: Changed calculation from absolute to relative deviation
      const portfolioWithDetails = portfolio.value.map(asset => {
          const currentProportion = currentTotal > 0 ? (asset.amount / currentTotal) * 100 : 0
          const currentRelativeDeviation =
              asset.target > 0 ? ((currentProportion - asset.target) / asset.target) * 100 : 0
          return {
              ...asset,
              currentProportion,
              currentRelativeDeviation
          }
      })

      if (buyOnlyMode.value) {
          if (additionalInvestment.value <= 0) {
              showMessage('仅买入模式”下，追加投资金额必须为正数。', 'error')
              calculationResult.value = null
              return
          }

          const potentialBuys = portfolioWithDetails
              .map(asset => {
                  const targetAmount = newTotal * (asset.target / 100)
                  const gap = targetAmount - asset.amount
                  return { ...asset, gap: gap > 0 ? gap : 0 }
              })
              .filter(asset => asset.gap > 0)

          if (potentialBuys.length === 0) {
              showMessage(
                  '所有资产均已达到或超过目标比例。追加的投资将按目标比例分配给所有资产，以维持平衡。',
                  'info'
              )
              const adjustments: Adjustment[] = portfolioWithDetails.map(asset => {
                  const adjustment = additionalInvestment.value * (asset.target / 100)
                  const newAmount = asset.amount + adjustment
                  const newProportion = newTotal > 0 ? (newAmount / newTotal) * 100 : 0
                  const newRelativeDeviation =
                      asset.target > 0 ? ((newProportion - asset.target) / asset.target) * 100 : 0
                  return {
                      name: asset.name || '未命名资产',
                      action: '买入',
                      adjustment,
                      currentProportion: asset.currentProportion,
                      currentRelativeDeviation: asset.currentRelativeDeviation,
                      newProportion,
                      newRelativeDeviation
                  }
              })
              calculationResult.value = { currentTotal, newTotal, adjustments, mode: '仅买入' }
              return
          }

          const totalGap = potentialBuys.reduce((sum, asset) => sum + asset.gap, 0)

          const adjustments: Adjustment[] = portfolioWithDetails.map(asset => {
              const buyCandidate = potentialBuys.find(b => b.id === asset.id)
              let adjustment = 0
              if (buyCandidate && totalGap > 0) {
                  adjustment = additionalInvestment.value * (buyCandidate.gap / totalGap)
              }
              const newAmount = asset.amount + adjustment
              const newProportion = newTotal > 0 ? (newAmount / newTotal) * 100 : 0
              const newRelativeDeviation =
                  asset.target > 0 ? ((newProportion - asset.target) / asset.target) * 100 : 0
              return {
                  name: asset.name || '未命名资产',
                  action: adjustment > 0.01 ? '买入' : '持有',
                  adjustment,
                  currentProportion: asset.currentProportion,
                  currentRelativeDeviation: asset.currentRelativeDeviation,
                  newProportion,
                  newRelativeDeviation
              }
          })

          calculationResult.value = { currentTotal, newTotal, adjustments, mode: '仅买入' }
      } else {
          const adjustments: Adjustment[] = portfolioWithDetails.map(asset => {
              const targetAmount = newTotal * (asset.target / 100)
              const adjustmentValue = targetAmount - asset.amount
              let action: '买入' | '卖出' | '持有' = '持有'

              if (adjustmentValue > 0.01) {
                  action = '买入'
              } else if (adjustmentValue < -0.01) {
                  action = '卖出'
              }

              const newAmount = asset.amount + adjustmentValue
              const newProportion = newTotal > 0 ? (newAmount / newTotal) * 100 : 0
              const newRelativeDeviation =
                  asset.target > 0 ? ((newProportion - asset.target) / asset.target) * 100 : 0

              return {
                  name: asset.name || '未命名资产',
                  action,
                  adjustment: Math.abs(adjustmentValue),
                  currentProportion: asset.currentProportion,
                  currentRelativeDeviation: asset.currentRelativeDeviation,
                  newProportion: isNaN(newProportion) ? asset.target : newProportion,
                  newRelativeDeviation
              }
          })
          calculationResult.value = { currentTotal, newTotal, adjustments, mode: '完全平衡' }
      }
  }

  const calculateCompoundInterest = () => {
      const { principal, rate, years, monthlyContribution } = compoundInputs.value

      if (principal < 0 || rate < 0 || years <= 0 || monthlyContribution < 0) {
          showMessage('请输入有效的正数，且投资年限必须大于0。', 'error')
          chartOption.value = null
          return
      }

      const monthlyRate = rate / 100 / 12
      const xAxisData: string[] = []
      const principalData: number[] = []
      const interestData: number[] = []

      for (let year = 1; year <= years; year++) {
          const totalMonths = year * 12
          const fvOfPrincipal = principal * Math.pow(1 + monthlyRate, totalMonths)
          let fvOfAnnuity = 0
          if (monthlyRate > 0) {
              fvOfAnnuity =
                  monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate)
          } else {
              fvOfAnnuity = monthlyContribution * totalMonths
          }
          const finalValue = fvOfPrincipal + fvOfAnnuity
          const totalPrincipal = principal + monthlyContribution * totalMonths
          const totalInterest = finalValue - totalPrincipal
          xAxisData.push(`第 ${year} 年`)
          principalData.push(parseFloat(totalPrincipal.toFixed(2)))
          interestData.push(parseFloat(totalInterest.toFixed(2)))
      }

      chartOption.value = {
          backgroundColor: 'transparent',
          tooltip: {
              trigger: 'axis',
              axisPointer: { type: 'shadow' },
              backgroundColor: 'rgba(18, 18, 18, 0.9)',
              borderColor: '#8a2be2',
              borderWidth: 1,
              textStyle: { color: '#fff' },
              formatter: (params: any) => {
                  const year = params[0].name
                  const principalVal = params[0].value
                  const interestVal = params[1].value
                  const totalVal = principalVal + interestVal
                  return `<strong>${year}</strong><br/>
                                                          累计本金: ${principalVal.toLocaleString()} 元<br/>
                                                          累计收益: ${interestVal.toLocaleString()} 元<br/>
                                                          <strong style="color: #8a2be2;">资产总计: ${totalVal.toLocaleString()} 元</strong>`
              }
          },
          legend: { data: ['累计本金', '累计收益'], textStyle: { color: '#b0c4de' }, top: '0%' },
          grid: { left: '3%', right: '4%', bottom: '3%', top: '16%', containLabel: true },
          xAxis: {
              type: 'category',
              data: xAxisData,
              axisLine: { lineStyle: { color: '#b0c4de' } },
              axisLabel: { color: '#b0c4de' }
          },
          yAxis: {
              type: 'value',
              name: '金额 (元)',
              nameTextStyle: { color: '#b0c4de' },
              axisLine: { show: true, lineStyle: { color: '#b0c4de' } },
              axisLabel: { color: '#b0c4de' },
              splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
          },
          series: [
              {
                  name: '累计本金',
                  type: 'bar',
                  stack: 'total',
                  emphasis: { focus: 'series' },
                  data: principalData,
                  itemStyle: { color: '#465A7A' }
              },
              {
                  name: '累计收益',
                  type: 'bar',
                  stack: 'total',
                  emphasis: { focus: 'series' },
                  data: interestData,
                  itemStyle: { color: '#FFBF00' }
              }
          ]
      }
  }

  interface FireInputs {
      totalAssets: number
      returnRate: number
      annualExpense: number
      inflationRate: number
  }
  // FIRE计算器状态
  const fireInputs = ref<FireInputs>({
      totalAssets: 1000000, // 默认100万
      returnRate: 4.0, // 默认4%理财收益
      annualExpense: 100000, // 默认一年花10万
      inflationRate: 1.44 // 默认3%通胀
  })
  const fireChartOption = ref<any | null>(null)
  const fireResultText = ref<string>('')
  const calculateFire = () => {
      const { totalAssets, returnRate, annualExpense, inflationRate } = fireInputs.value

      if (totalAssets <= 0 || annualExpense <= 0) {
          showMessage('请输入有效的资产和支出金额', 'error')
          return
      }

      const xAxisData: string[] = []
      const assetsData: number[] = []
      const expenseData: number[] = []

      let currentAssets = totalAssets
      let currentExpense = annualExpense
      let year = 0
      const maxYears = 80 // 限制最大计算80年，防止死循环或图表过长

      // 初始状态 (第0年)
      xAxisData.push(`第 ${year} 年`)
      assetsData.push(parseFloat(currentAssets.toFixed(2)))
      expenseData.push(parseFloat(currentExpense.toFixed(2)))

      // 循环模拟每年的变化
      while (currentAssets > 0 && year < maxYears) {
          year++

          // 1. 资产增值
          const investmentIncome = currentAssets * (returnRate / 100)
          // 2. 资产减去支出 (假设支出是在年末扣除，或者你可以理解为年初扣除，这里采用简化模型：资产先增值再扣款)
          // 如果想要更严谨（例如每月扣款），公式会复杂点，这里按年粗算
          currentAssets = currentAssets + investmentIncome - currentExpense

          // 3. 支出随通胀增加（为下一年做准备）
          currentExpense = currentExpense * (1 + inflationRate / 100)

          // 记录数据
          xAxisData.push(`第 ${year} 年`)
          // 如果资产小于0，记为0
          assetsData.push(parseFloat(Math.max(0, currentAssets).toFixed(2)))
          expenseData.push(parseFloat(currentExpense.toFixed(2)))
      }

      // 生成结论文本
      if (currentAssets > 0 && year === maxYears) {
          fireResultText.value = `恭喜！在模拟的 ${maxYears} 年中，您的资产持续增长或未耗尽，实现了财务永动。`
      } else {
          fireResultText.value = `按照当前模型，您的资产将在第 ${year} 年耗尽。`
      }

      // 配置 ECharts
      fireChartOption.value = {
          backgroundColor: 'transparent',
          tooltip: {
              trigger: 'axis',
              axisPointer: { type: 'cross' },
              backgroundColor: 'rgba(18, 18, 18, 0.9)',
              borderColor: '#ff4081',
              textStyle: { color: '#fff' }
          },
          legend: {
              data: ['剩余资产', '当年支出'],
              textStyle: { color: '#b0c4de' },
              top: '0%'
          },
          grid: { left: '3%', right: '4%', bottom: '3%', top: '16%', containLabel: true },
          xAxis: {
              type: 'category',
              data: xAxisData,
              axisLine: { lineStyle: { color: '#b0c4de' } },
              axisLabel: { color: '#b0c4de' }
          },
          yAxis: [
              {
                  type: 'value',
                  name: '剩余资产',
                  position: 'left',
                  nameTextStyle: { color: '#465A7A' },
                  axisLine: { show: true, lineStyle: { color: '#465A7A' } },
                  splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
                  axisLabel: { color: '#b0c4de' }
              },
              {
                  type: 'value',
                  name: '当年支出',
                  position: 'right',
                  nameTextStyle: { color: '#ff4081' },
                  axisLine: { show: true, lineStyle: { color: '#ff4081' } },
                  splitLine: { show: false },
                  axisLabel: { color: '#ff4081' }
              }
          ],
          series: [
              {
                  name: '剩余资产',
                  type: 'line',
                  smooth: true,
                  showSymbol: false,
                  areaStyle: {
                      color: {
                          type: 'linear',
                          x: 0,
                          y: 0,
                          x2: 0,
                          y2: 1,
                          colorStops: [
                              { offset: 0, color: 'rgba(70, 90, 122, 0.8)' },
                              { offset: 1, color: 'rgba(70, 90, 122, 0.1)' }
                          ]
                      }
                  },
                  itemStyle: { color: '#465A7A' },
                  data: assetsData,
                  yAxisIndex: 0
              },
              {
                  name: '当年支出',
                  type: 'line',
                  smooth: true,
                  showSymbol: false,
                  lineStyle: { type: 'dashed' },
                  itemStyle: { color: '#ff4081' },
                  data: expenseData,
                  yAxisIndex: 1
              }
          ]
      }
  }
</script>

<style scoped>
  /* --- 新增：页面加载动画定义 --- */
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

  /* 定义页面主题色 */
  :root {
      --theme-color: #8a2be2;
      /* 蓝紫色 */
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
      display: flex;
      flex-direction: column;
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }

  .content-card:hover {
      border-color: rgba(138, 43, 226, 0.5);
  }

  .tools-grid .content-card:nth-child(1) {
      animation-delay: 0.2s;
  }

  .tools-grid .content-card:nth-child(2) {
      animation-delay: 0.3s;
  }

  .tools-grid .content-card:nth-child(3) {
      animation-delay: 0.4s;
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
  }

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
      box-sizing: border-box;
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
      margin-bottom: 1rem;
      background: rgba(138, 43, 226, 0.2);
      border: 1px dashed #8a2be2;
      color: #8a2be2;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      align-self: flex-start;
  }

  .add-asset-btn:hover {
      background: rgba(138, 43, 226, 0.4);
      color: #fff;
  }

  /* 复利计算器输入区域 */
  .calculator-inputs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
  }

  .calculator-inputs .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }

  .calculator-inputs .input-group label {
      text-align: left;
  }

  .calculator-inputs .input-group input {
      max-width: none;
      width: 100%;
  }

  /* 通用计算区域 */
  .calculation-zone {
      margin-top: auto;
      /* Push to the bottom */
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
  }

  /* 复利计算器按钮特殊布局 */
  .compound-calculator .calculation-zone {
      justify-content: center;
      border-top: none;
      padding-top: 0;
      margin-top: 0;
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
      box-sizing: border-box;
  }

  .input-group input:focus {
      border-color: #8a2be2;
      outline: none;
  }

  .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      user-select: none;
  }

  .checkbox-group input[type='checkbox'] {
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      width: 1.2em;
      height: 1.2em;
      border: 2px solid #8a2be2;
      border-radius: 4px;
      position: relative;
      transition: background-color 0.2s;
      vertical-align: middle;
  }

  .checkbox-group input[type='checkbox']:checked {
      background-color: #8a2be2;
  }

  .checkbox-group input[type='checkbox']:checked::after {
      content: '✔';
      color: #fff;
      font-size: 0.8em;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
  }

  .checkbox-group label {
      color: #b0c4de;
      font-size: 0.9rem;
  }

  .button-group {
      display: flex;
      gap: 1rem;
      flex-grow: 1;
      justify-content: flex-end;
  }

  .calculate-btn {
      background-color: #8a2be2;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.8rem 1.5rem;
      font-size: 0.9rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 0 15px rgba(138, 43, 226, 0.3);
  }

  .calculate-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(138, 43, 226, 0.5);
  }

  .calculate-btn.secondary {
      background-color: transparent;
      border: 1px solid #8a2be2;
      color: #8a2be2;
      box-shadow: none;
  }

  .calculate-btn.secondary:hover {
      background-color: rgba(138, 43, 226, 0.2);
      color: #fff;
      transform: translateY(-2px);
  }

  .min-invest-result {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(138, 43, 226, 0.1);
      border-left: 3px solid #8a2be2;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
      color: #b0c4de;
  }

  .apply-btn {
      background: none;
      border: 1px solid #b0c4de;
      color: #b0c4de;
      border-radius: 4px;
      padding: 0.25rem 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
  }

  .apply-btn:hover {
      background: #8a2be2;
      border-color: #8a2be2;
      color: #fff;
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
      font-size: 0.9rem;
  }

  .buy-action {
      color: #dc3545;
      font-weight: bold;
  }

  .sell-action {
      color: #28a745;
      font-weight: bold;
  }

  .hold-action {
      color: #b0c4de;
      font-style: italic;
  }

  .mode-indicator {
      display: inline-block;
      font-size: 0.8rem;
      font-weight: normal;
      color: #b0c4de;
      background-color: rgba(255, 255, 255, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 0.5rem;
      vertical-align: middle;
  }

  .result-table-container {
      overflow-x: auto;
  }

  .result-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      font-size: 0.9rem;
  }

  .result-table th,
  .result-table td {
      padding: 0.75rem 0.5rem;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .result-table th {
      color: #b0c4de;
      font-weight: normal;
  }

  .result-table tbody tr:last-child td {
      border-bottom: none;
  }

  .positive-deviation {
      color: #dc3545;
  }

  .negative-deviation {
      color: #28a745;
  }

  /* 图表容器样式 */
  .chart-container {
      margin-top: 2rem;
      height: 400px;
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

  /* ======================================================= */
  /* ========           移动端适配 (<= 768px)         ======== */
  /* ======================================================= */
  @media (max-width: 768px) {
      .page-wrapper {
          padding: 2rem 1rem;
      }

      .content-card {
          padding: 1.5rem 1rem;
      }

      .main-title {
          font-size: 2rem;
      }

      .card-title {
          font-size: 1.25rem;
      }

      .card-description {
          font-size: 0.9rem;
      }

      /* 响应式表格 */
      .table-container {
          overflow-x: hidden;
      }

      .data-table,
      .result-table {
          min-width: 100%;
          border-collapse: separate;
          border-spacing: 0;
      }

      .data-table thead,
      .result-table thead {
          border: none;
          clip: rect(0 0 0 0);
          height: 1px;
          margin: -1px;
          overflow: hidden;
          padding: 0;
          position: absolute;
          width: 1px;
      }

      .data-table tr,
      .result-table tr {
          display: block;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          margin-bottom: 1rem;
          padding: 0.5rem 1rem;
      }

      .data-table td,
      .result-table td {
          display: block;
          text-align: right;
          position: relative;
          padding: 0.75rem 0;
          padding-left: 50%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .data-table td:last-child,
      .result-table td:last-child {
          border-bottom: none;
      }

      .data-table td:last-child {
          padding-top: 1rem;
      }

      .data-table td::before,
      .result-table td::before {
          content: attr(data-label);
          position: absolute;
          left: 0;
          width: 45%;
          padding-right: 10px;
          white-space: nowrap;
          text-align: left;
          font-weight: normal;
          color: #b0c4de;
          font-size: 0.9em;
      }

      .data-table input[type='text'],
      .data-table input[type='number'] {
          width: 100%;
          text-align: right;
          padding: 0.5rem;
      }

      .data-table td[data-label='操作'] {
          padding-left: 0;
          text-align: center;
      }

      .data-table td[data-label='操作']::before {
          content: none;
      }

      .calculator-inputs {
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
      }

      .calculation-zone {
          flex-direction: column;
          align-items: stretch;
          gap: 1rem;
      }

      .rebalance-calculator .input-group,
      .rebalance-calculator .checkbox-group,
      .rebalance-calculator .button-group {
          width: 100%;
      }

      .checkbox-group {
          margin-bottom: 0.5rem;
          justify-content: flex-start;
      }

      .button-group {
          flex-direction: column;
      }

      .input-group {
          width: 100%;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
      }

      .input-group input {
          width: 100%;
          max-width: none;
      }

      .result-container {
          padding: 1rem;
      }

      .chart-container {
          height: 350px;
          margin-top: 1.5rem;
      }
  }

  /* 隐藏数字输入框的上下箭头 */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
  }

  input[type='number'] {
      -moz-appearance: textfield;
  }
</style>