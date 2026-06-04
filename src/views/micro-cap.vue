<template>
  <div class="page-wrapper">
    <div class="main-container">

      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>
        <h1 class="main-title">
          <span class="title-icon">💎</span>
          微盘股策略
        </h1>
        <p class="subtitle">
          用量化纪律追踪指数，捕捉市场深处的规模因子。
        </p>
      </div>

      <div class="content-grid">

        <div class="content-card risk-warning-card">
          <h2 class="card-title">极端风险警告</h2>
          <p class="card-description">
            微盘股策略是所有策略中风险等级最高的。该策略所追踪的指数成分股普遍规模小、基本面不确定性强，导致整体波动极为剧烈，可能在短期内出现超过50%甚至更多的净值回撤。
            同时，成分股的流动性风险可能传导至策略本身。<strong>本策略只适合风险承受能力极强的投资者，且投入资金必须是完全可以承受损失的闲钱。</strong>
          </p>
        </div>

        <div class="content-card">
          <h2 class="card-title">组合思想：量化追踪，纪律执行</h2>
          <p class="card-description">
            本策略并非主动挖掘个股，而是通过量化模型紧密追踪<b>万得微盘股指数</b>，旨在系统性地捕获A股市场的“规模因子”溢价。
          </p>
          <ul class="idea-list">
            <li><b>规模因子溢价：</b> 学术与历史数据均表明，长期来看，小市值公司的整体回报率倾向于超越大市值公司。本策略的目标正是捕获这种由“规模”这一因子本身带来的系统性超额收益。</li>
            <li><b>每周动态再平衡：</b> 模型于<b>每周一</b>进行调仓。这种再平衡机制，确保了策略能紧密跟随指数的成分变化，并及时捕捉市场动量，是策略获取阿尔法收益的关键环节。</li>
            <li><b>作为“卫星”配置：</b> 鉴于微盘股的高波动特性，它适合作为投资组合中的“卫星”部分，用以增强整体收益弹性。建议配置比例不超过总投资资产的20%，并做好长期持有的准备。</li>
          </ul>
        </div>
        <div v-if="canViewPremiumContent" class="content-card">
          <h2 class="card-title">最新持仓与调仓建议</h2>
          <p class="card-description">
            根据模型于 {{ formattedDate }} 生成的最新组合。
          </p>
          <div class="calculator-toolbar">
            <div class="calc-left">
              <div class="input-wrapper">
                <span class="currency-symbol">¥</span>
                <input type="number" v-model="inputAmount" class="compact-input" placeholder="计划投入" @keyup.enter="handleCalculate" />
              </div>
              <button class="calc-btn-compact" @click="handleCalculate">
                计算
              </button>
              <button class="calc-btn-compact outline" @click="openHoldingsModal">
                我的持仓
              </button>
            </div>

            <div v-if="hasCalculated" class="calc-right-group">

              <div class="stats-row">
                <div class="summary-tag">
                  <span class="label">计划买入</span>
                  <span class="value highlight">{{ calcSummary.totalPlanned.toFixed(0) }}</span>
                </div>
                <div class="summary-tag">
                  <span class="label">利用率</span>
                  <span class="value" :class="{'warn': parseFloat(calcSummary.utilization) < 95}">
                    {{ calcSummary.utilization }}
                  </span>
                </div>
                <div class="summary-tag">
                  <span class="label">结余</span>
                  <span class="value">{{ (Number(inputAmount) - calcSummary.totalPlanned).toFixed(0) }}</span>
                </div>
              </div>

              <button class="apply-result-btn" @click="requestApplyPlan">
                录入此结果
              </button>
            </div>
          </div>

          <h3 class="card-subtitle">核心持仓展示 (10只)</h3>
          <div class="table-wrapper">
            <table class="data-table portfolio-table">
              <thead>
                <tr>
                  <th>代码</th>
                  <th>名称</th>
                  <th>现价</th>
                  <th v-if="hasCalculated" class="calc-col-head">建议手数</th>
                  <th v-if="hasCalculated" class="calc-col-head">计划金额</th>
                  <th v-if="hasCalculated" class="calc-col-head">占比</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in latestPortfolio" :key="item.code">
                  <td class="code-font">{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.price.toFixed(2) }}</td>

                  <template v-if="hasCalculated">
                    <td class="calc-col-cell">
                      <span class="calc-val">{{ allocationData.get(item.code)?.shares || 0 }}</span>
                    </td>
                    <td class="calc-col-cell">
                      <span class="calc-val">{{ allocationData.get(item.code)?.cost.toFixed(0) || 0 }}</span>
                    </td>
                    <td class="calc-col-cell">
                      <span class="calc-val">{{ allocationData.get(item.code)?.weight || '0%' }}</span>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>

          <template v-if="hasCalculated">
            <h3 class="card-subtitle" style="margin-top: 2rem;">组合调仓指引</h3>
            <div class="adjustments-grid">
              <div class="adjustment-block">
                <h4 class="adjustment-title sell">⬇️ 建议调出</h4>
                <ul class="adjustment-list">
                  <li v-for="item in sellList" :key="item.code" class="adjustment-item">
                    <div class="item-left">
                      <span class="stock-name">{{ item.name }}</span>
                      <span class="code-tiny">{{ item.code }}</span>
                    </div>
                    <div class="adj-right">
                      <span v-if="item.shares" class="shares-badge">{{ item.shares }}股</span>
                      <span class="action-badge" :class="item.subType">{{ item.action }}</span>
                    </div>
                  </li>
                  <li v-if="sellList.length == 0" class="adjustment-item-empty">今日无调出建议</li>
                </ul>
              </div>

              <div class="adjustment-block">
                <h4 class="adjustment-title buy">⬆️ 建议调入</h4>
                <ul class="adjustment-list">
                  <li v-for="item in buyList" :key="item.code" class="adjustment-item">
                    <div class="item-left">
                      <span class="stock-name">{{ item.name }}</span>
                      <span class="code-tiny">{{ item.code }}</span>
                    </div>
                    <div class="adj-right">
                      <span v-if="item.shares" class="shares-badge">{{ item.shares }}股</span>
                      <span class="action-badge" :class="item.subType">{{ item.action }}</span>
                    </div>
                  </li>
                  <li v-if="buyList.length === 0" class="adjustment-item-empty">今日无调入建议</li>
                </ul>
              </div>
            </div>
          </template>

        </div>
        <div v-else class="content-card premium-lock-card">
          <div class="premium-lock-icon">🔒</div>
          <h2 class="card-title">最新持仓与调仓建议</h2>
          <p class="card-description">
            核心持仓、资金测算和组合调仓指引属于会员内容，开通后可查看完整执行方案。
          </p>
          <button class="premium-lock-button" @click="router.push('/home')">返回首页开通会员</button>
        </div>

        <div class="content-card">
          <div class="card-header-row">
            <h2 class="card-title no-margin">微盘股策略 vs 沪深300全收益</h2>
            <span class="period-badge">{{ backtestPeriodText }}</span>
          </div>

          <div ref="chartContainer" class="echart-container"></div>

          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-label">总收益</div>
              <div class="stat-value highlight">{{ strategyStats.totalReturn }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">年化收益</div>
              <div class="stat-value">{{ strategyStats.annualizedReturn }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">波动率</div>
              <div class="stat-value">{{ strategyStats.volatility }}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">夏普比率</div>
              <div class="stat-value">{{ strategyStats.sharpe }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最大回撤</div>
              <div class="stat-value negative">{{ strategyStats.maxDrawdown }}%</div>
            </div>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">策略月度/年度收益表</h2>
          <div class="table-container heatmap-container">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th>年份</th>
                  <th v-for="m in 12" :key="m">{{ m }}月</th>
                  <th>年度</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="yearData in monthlyReturns" :key="yearData.year">
                  <td class="year-col">{{ yearData.year }}</td>
                  <td v-for="(val, idx) in yearData.months" :key="idx" :style="getHeatmapStyle(val)" class="cell-val">
                    {{ val !== null ? val + '%' : '' }}
                  </td>
                  <td class="year-total" :style="getHeatmapStyle(yearData.total)">
                    {{ yearData.total }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">深度风险分析</h2>

          <div class="risk-summary-grid">
            <div class="risk-box">
              <div class="risk-label">卡玛比率 (Calmar)</div>
              <div class="risk-main-val">{{ strategyStats.calmar }}</div>
              <div class="risk-sub-val">年化收益 / 最大回撤</div>
            </div>
            <div class="risk-box">
              <div class="risk-label"> 月度胜率: {{ monthlySummary.winRate }}%</div>
              <div class="risk-main-val">{{ monthlySummary.profitableMonths }} / {{ monthlySummary.totalMonths }}</div>
              <div class="risk-sub-val">盈利月数 / 总月数</div>
            </div>
            <div class="risk-box">
              <div class="risk-label">盈亏比</div>
              <div class="risk-main-val">{{ profitLossRatio }}</div>
              <div class="risk-sub-val">日均盈利 / 日均亏损</div>
            </div>
          </div>

          <h3 class="card-subtitle no-border">回撤深度分布 (频率统计)</h3>
          <div class="table-container dist-table-container">
            <div class="dist-table-inner">
              <div class="dist-header-row">
                <div class="dist-col" v-for="item in drawdownDist" :key="item.range">{{ item.range }}</div>
              </div>
              <div class="dist-bar-row">
                <div class="dist-col" v-for="item in drawdownDist" :key="item.range">
                  <div class="dist-block yellow-theme" :style="{ opacity: item.count > 0 ? 1 : 0.6 }">
                    {{ item.count }}
                  </div>
                </div>
              </div>
              <div class="dist-label-row">
                <div class="dist-col">次数</div>
              </div>
            </div>
          </div>

          <h3 class="card-subtitle no-border" style="margin-top: 2rem;">历史重大回撤明细 (Top 10)</h3>
          <div class="table-wrapper">
            <table class="data-table risk-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>开始日期</th>
                  <th>谷底日期</th>
                  <th>恢复日期</th>
                  <th>最大回撤</th>
                  <th>回撤期(天)</th>
                  <th>修复期(天)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in topDrawdowns" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.startDate }}</td>
                  <td>{{ item.troughDate }}</td>
                  <td>{{ item.endDate }}</td>
                  <td>{{ item.drawdown }}%</td>
                  <td>{{ item.ddDays }}</td>
                  <td>{{ item.fixDays }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">常见问题 (FAQ)</h2>
          <div class="faq-container">
            <div v-for="(item, index) in faqList" :key="index" class="faq-item">
              <button class="faq-question" @click="toggleFaq(index)">
                <span>{{ item.question }}</span>
                <span :class="['faq-icon', { 'is-open': openFaqIndex === index }]">+</span>
              </button>
              <div v-if="openFaqIndex === index" class="faq-answer">
                <p style="white-space: pre-line;">{{ item.answer }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
  <div v-if="showHoldingsModal" class="modal-overlay" @click.self="closeHoldingsModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>我的当前持仓</h3>
        <span class="close-icon" @click="closeHoldingsModal">×</span>
      </div>

      <div class="modal-body">
        <div v-for="(row, index) in editingHoldings" :key="index" class="holding-row">
          <div class="input-group">
            <input type="text" v-model="row.code" maxlength="6" placeholder="代码 (6位)" @input="handleCodeInput(row)"
              class="modal-input code" />
          </div>
          <div class="stock-name-display">{{ row.name || '---' }}</div>
          <div class="input-group">
            <input type="number" v-model.number="row.shares" placeholder="股数" class="modal-input shares" />
          </div>
          <button class="delete-btn" @click="removeHoldingRow(index)">🗑️</button>
        </div>

        <button class="add-row-btn" @click="addHoldingRow">
          + 添加股票
        </button>
      </div>

      <div class="modal-footer">
        <button class="modal-btn cancel" @click="closeHoldingsModal">取消</button>
        <button class="modal-btn save" @click="saveHoldings">保存持仓</button>
      </div>
    </div>
  </div>

  <div v-if="showConfirmModal" class="modal-overlay" @click.self="showConfirmModal = false">
    <div class="modal-content confirm-dialog">
      <div class="modal-header no-border">
        <h3 class="confirm-title">确认更新</h3>
      </div>

      <div class="modal-body text-center">
        <p class="confirm-text">
          是否将当前的 <strong>计算结果</strong> 更新为您的最新持仓？
        </p>
        <p class="confirm-subtext">
          更新后，下次计算将基于这个新持仓进行建议。
        </p>
      </div>

      <div class="modal-footer center-footer">
        <button class="modal-btn cancel" @click="showConfirmModal = false">取消</button>
        <button class="modal-btn confirm-primary" @click="executeApplyPlan">确定更新</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, nextTick, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import * as echarts from 'echarts'
  import { useUserStore } from '@/store/user'
  const router = useRouter()
  const userStore = useUserStore()
  const canViewPremiumContent = computed(() => userStore.isVip || userStore.userInfo?.admin === true)
  // 引入云开发 SDK (请确保路径与您项目一致，通常是 @/lib/cloudbase 或类似的)
  import app from '@/lib/cloudbase'
  import axios from 'axios'
  import {
      calculateDrawdownAnalysis,
      calculateMonthlyReturns,
      calculateMonthlySummary,
      calculateProfitLossRatio,
      calculateStats,
      formatBacktestPeriod,
      prepareStrategySeries
  } from '@/utils/strategyMetrics'
  import type { MonthlySummary, StrategyStats } from '@/utils/strategyMetrics'
  const showMessage: any = inject('showMessage')
  const hasCalculated = ref(false) // 新增开关
  const strategyStats = ref<StrategyStats>({
      totalReturn: '0.00',
      annualizedReturn: '0.00',
      volatility: '0.00',
      sharpe: '0.000',
      maxDrawdown: '0.00',
      calmar: '0.000'
  })
  const monthlySummary = ref<MonthlySummary>({
      profitableMonths: 0,
      totalMonths: 0,
      winRate: '0.0'
  })
  const profitLossRatio = ref('0.000')
  const backtestPeriodText = ref('回测周期: --')

  // --- 新增：资金分配计算器逻辑 ---
  const inputAmount = ref<number | null>(null) // 用户输入的金额
  const allocationData = ref<Map<string, any>>(new Map()) // 存储计算结果 Key: stockCode
  const calcSummary = ref({
      totalPlanned: 0,
      utilization: '0.00%',
      msg: ''
  })

  // 1. [新增] 定义全市场股票映射
  const allStockMap = ref<Record<string, string>>({})

  // 2. [新增] 获取映射关系的函数
  const fetchStockMap = async () => {
      if (!canViewPremiumContent.value) return

      try {
          // 假设文件放在 public/static/stock_map.json
          // 注意：根据你的部署环境，路径可能是 './static/...' 或 '/static/...'
          const res = await axios.get('./static/stock_map.json')
          if (res.data) {
              allStockMap.value = res.data
          }
      } catch (err) {
          console.error('无法加载股票代码映射表', err)
      }
  }

  const showHoldingsModal = ref(false)
  // 用户真实的持仓数据 (模拟从云端获取)
  const userHoldings = ref<any[]>([])

  watch(
      () => userStore.userInfo,
      newVal => {
          if (newVal && newVal.holdings) {
              // 深拷贝一份，防止直接修改 store 数据
              userHoldings.value = JSON.parse(JSON.stringify(newVal.holdings))
          }
      },
      { immediate: true, deep: true }
  )
  const editingHoldings = ref<any[]>([])
  // 2. [新增] 弹窗相关逻辑
  const openHoldingsModal = () => {
      // 1. 深拷贝当前持仓数据
      editingHoldings.value = JSON.parse(JSON.stringify(userHoldings.value))

      // 2. 【核心修改】只在这里进行排序
      // 这样只会影响“我的持仓”弹窗里的显示顺序
      // 不会影响主页面的策略排名，也不会影响计算逻辑
      editingHoldings.value.sort((a: any, b: any) => {
          const codeA = a.code ? String(a.code) : ''
          const codeB = b.code ? String(b.code) : ''
          // localeCompare 可以保证 "00" 开头的排在 "60" 开头的前面
          return codeA.localeCompare(codeB)
      })

      // 3. 如果是空的，默认加一行
      if (editingHoldings.value.length === 0) {
          addHoldingRow()
      }

      // 4. 显示弹窗
      showHoldingsModal.value = true
  }

  const closeHoldingsModal = () => {
      showHoldingsModal.value = false
  }

  const addHoldingRow = () => {
      editingHoldings.value.push({ code: '', name: '', shares: '' })
  }

  const removeHoldingRow = (index: number) => {
      editingHoldings.value.splice(index, 1)
  }

  // 简单的本地查找名称逻辑
  const handleCodeInput = (row: any) => {
      // 仅当输入达到 6 位时才查询
      if (row.code && row.code.length === 6) {
          const code = row.code

          // 优先 1: 查全市场映射表
          if (allStockMap.value[code]) {
              row.name = allStockMap.value[code]
          }
          // 优先 2: 查当前策略列表 (兜底，万一JSON没更新)
          else {
              const foundInStrategy = latestPortfolio.value.find((s: any) => s.code === code)
              if (foundInStrategy) {
                  row.name = foundInStrategy.name
              } else {
                  row.name = '未知/新股'
              }
          }
      } else {
          // 输入不足6位，清空名字
          row.name = ''
      }
  }

  const saveHoldings = async () => {
      // 1. 过滤无效数据
      const validHoldings = editingHoldings.value.filter(
          (h: any) => h.code.length === 6 && h.shares > 0
      )

      try {
          // 2. 【改这里】不再直接调云函数，而是调用 Store 的 action
          await userStore.updateHoldings(validHoldings)

          showMessage('持仓保存成功', 'success')
          closeHoldingsModal()

          // 3. 重新触发策略计算（因为 store 更新了，watch 会自动更新 userHoldings，这里只需要重新计算建议）
          if (hasCalculated.value) {
              handleCalculate()
          }
      } catch (err: any) {
          console.error(err)
          showMessage(err.message || '保存失败', 'error')
      }
  }
  // 修改为 async 函数，因为涉及到云端保存
  const applyPlanToHoldings = async () => {
      if (!hasCalculated.value) return

      const newHoldings: any[] = []

      // 1. 遍历计算结果，构建新的持仓数组
      allocationData.value.forEach((val: any, code: string) => {
          if (val.shares > 0) {
              const stockInfo = latestPortfolio.value.find((s: any) => s.code === code)
              newHoldings.push({
                  code: code,
                  name: stockInfo ? stockInfo.name : '未知',
                  shares: val.shares
              })
          }
      })

      // 2. 【核心修改】调用 Store 的方法保存到云端
      try {
          await userStore.updateHoldings(newHoldings)

          showMessage('已将目标组合录入为当前持仓！', 'success')

          // 3. 保存成功后，重新触发一下计算
          // 此时“当前持仓”和“目标持仓”应该是一致的，
          // 所以下方的“调仓建议”应该会变为空（或显示无操作），这是符合逻辑的。
          handleCalculate()
      } catch (err: any) {
          console.error(err)
          showMessage(err.message || '录入失败', 'error')
      }
  }
  // 计算最小起投门槛 (最高价股票的1手 * 10)
  const minThreshold = computed(() => {
      if (!latestPortfolio.value || latestPortfolio.value.length === 0) return 0
      const maxPrice = Math.max(...latestPortfolio.value.map((s: any) => s.price))
      return Math.ceil(maxPrice * 100 * 10)
  })

  // 执行计算 (修复保底1手分配的瀑布流算法)
  const handleCalculate = () => {
      if (!canViewPremiumContent.value) {
          showMessage('开通会员后可查看调仓测算。', 'warning')
          return
      }

      const stocks = latestPortfolio.value
      const totalFunds = Number(inputAmount.value)

      // 1. 基础校验
      if (!totalFunds || totalFunds <= 0) {
          showMessage('请输入有效的投资金额！', 'error')
          return
      }
      if (totalFunds < minThreshold.value) {
          showMessage(
              `资金量过小，无法有效进行等权配置。\n当前策略建议最低起投金额为：${minThreshold.value}元\n(基于最高价股1手价格的10倍计算)`,
              'error'
          )
          return
      }

      // 2. 算法初始化
      const fundsForAllocation = totalFunds
      let remainingFunds = fundsForAllocation
      const tempMap = new Map()
      let totalAllocated = 0

      // [核心修复] 预计算后续股票保底1手所需的总资金 (后缀和机制)
      // 作用：保证前面的股票就算四舍五入多买了，也不会把后面股票买1手的钱挤占掉
      const minCostSuffix = new Array(stocks.length).fill(0)
      let suffixSum = 0
      for (let i = stocks.length - 1; i >= 0; i--) {
          minCostSuffix[i] = suffixSum
          suffixSum += stocks[i].price * 100
      }

      // 3. 循环计算 (瀑布流分配)
      for (let i = 0; i < stocks.length; i++) {
          const stock = stocks[i]
          const currentPrice = stock.price

          if (!currentPrice || currentPrice <= 0) continue

          const remainingStocksCount = stocks.length - i
          // 核心逻辑：剩余资金 / 剩余股票数
          const idealInvestmentPerStock = remainingFunds / remainingStocksCount
          const idealShares = idealInvestmentPerStock / currentPrice

          // 四舍五入到整百
          let sharesToBuy = Math.round(idealShares / 100) * 100

          // 兜底逻辑：如果计算出0手，强制给1手
          if (sharesToBuy === 0) sharesToBuy = 100

          let actualCost = sharesToBuy * currentPrice

          // [核心修复] 资金校验：当前买入后，剩下的钱必须足够后面所有股票各买至少1手
          const requiredForRest = minCostSuffix[i]

          // 当出现买不起，或者挤占了后续股票保底资金的情况，就减去100股，直到满足条件或降至1手
          while (
              sharesToBuy > 100 &&
              (actualCost > remainingFunds || remainingFunds - actualCost < requiredForRest)
          ) {
              sharesToBuy -= 100
              actualCost = sharesToBuy * currentPrice
          }

          // 极端情况兜底：万一连1手都买不起则归零 (有前面的 minThreshold 拦截，正常情况绝对不会走到这)
          if (actualCost > remainingFunds) {
              sharesToBuy = 0
              actualCost = 0
          }

          // 记录结果
          if (sharesToBuy > 0) {
              remainingFunds -= actualCost
              totalAllocated += actualCost

              const actualWeight = actualCost / fundsForAllocation

              tempMap.set(stock.code, {
                  shares: sharesToBuy,
                  cost: actualCost,
                  weight: (actualWeight * 100).toFixed(2) + '%'
              })
          } else {
              tempMap.set(stock.code, { shares: 0, cost: 0, weight: '0%' })
          }
      }

      // 4. 更新状态
      allocationData.value = tempMap
      calcSummary.value = {
          totalPlanned: totalAllocated,
          utilization: ((totalAllocated / fundsForAllocation) * 100).toFixed(2) + '%',
          msg: '计算完成'
      }

      // --- 下方为你原有的 调仓建议 (Diff 算法) 代码，无需变动 ---
      const newBuyList: any[] = []
      const newSellList: any[] = []

      const allCodes = new Set([
          ...latestPortfolio.value.map((s: any) => s.code),
          ...userHoldings.value.map((h: any) => h.code)
      ])

      allCodes.forEach(code => {
          const targetData = allocationData.value.get(code)
          const targetShares = targetData ? targetData.shares : 0

          const currentData = userHoldings.value.find((h: any) => h.code === code)
          const currentShares = currentData ? currentData.shares : 0

          let stockName = currentData?.name
          if (!stockName) {
              const s = latestPortfolio.value.find((item: any) => item.code === code)
              stockName = s ? s.name : code
          }

          const diff = targetShares - currentShares

          if (diff > 0) {
              const isNewEntry = currentShares === 0
              newBuyList.push({
                  code,
                  name: stockName,
                  action: isNewEntry ? '全新买入' : '增持',
                  subType: isNewEntry ? 'new-buy' : 'add-buy',
                  shares: diff
              })
          } else if (diff < 0) {
              const isClearance = targetShares === 0
              newSellList.push({
                  code,
                  name: stockName,
                  action: isClearance ? '全部卖出' : '减持',
                  subType: isClearance ? 'clear-sell' : 'cut-sell',
                  shares: Math.abs(diff)
              })
          }
      })

      newSellList.sort((a, b) => (a.subType === 'clear-sell' ? -1 : 1))
      newBuyList.sort((a, b) => (a.subType === 'new-buy' ? -1 : 1))

      buyList.value = newBuyList
      sellList.value = newSellList

      hasCalculated.value = true
  }
  // ... (保留原有的 fetchStrategyData, chart 等逻辑)
  // --- 1. 基础数据 ---
  const formattedDate = ref('加载中...')
  const isLoading = ref(true)

  // --- 2. 持仓与调仓数据 ---
  const latestPortfolio: any = ref([]) // 核心持仓
  const sellList: any = ref([]) // 建议卖出
  const buyList: any = ref([]) // 建议买入

  // --- 3. 获取云端数据函数 ---
  const fetchStrategyData = async () => {
      if (!canViewPremiumContent.value) return

      try {
          const res = await app.callFunction({
              name: 'getMicroCapData10' // 刚才创建的云函数名称
          })

          if (res.result.success && res.result.data) {
              const data = res.result.data

              // 1. 更新日期
              formattedDate.value = data.updated_at

              // 2. 更新持仓列表 (数据库字段 ranking -> 前端 latestPortfolio)
              latestPortfolio.value = data.ranking || []

              // 3. 更新调仓建议 (数据库字段 adjustments -> 拆分为 buy/sell)
              const adj = data.adjustments || []

              // 过滤出买入 (action: 'buy')
              // buyList.value = adj
              //     .filter((item: any) => item.action === 'buy')
              //     .map((item: any) => ({
              //         code: item.code,
              //         name: item.name,
              //         action: '买入' // 用于前端显示文字
              //     }))

              // // 过滤出卖出 (action: 'sell')
              // sellList.value = adj
              //     .filter((item: any) => item.action === 'sell')
              //     .map((item: any) => ({
              //         code: item.code,
              //         name: item.name,
              //         action: '卖出' // 用于前端显示文字
              //     }))
          } else {
              console.warn('未获取到有效数据:', res.result.msg)
              formattedDate.value = '暂无数据'
          }
      } catch (err) {
          console.error('云函数调用失败', err)
          formattedDate.value = '数据加载失败'
      } finally {
          isLoading.value = false
      }
  }

  // --- 4. 图表逻辑 (保持原样，也可以后续换成真实数据) ---
  const chartContainer = ref<HTMLElement | null>(null)
  let myChart: echarts.ECharts | null = null

  const initChart = (dates: any, strategyData: any, benchmarkData: any) => {
      if (!chartContainer.value) return
      myChart = echarts.init(chartContainer.value)

      const option = {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis' },
          grid: { top: '15%', left: '3%', right: '4%', bottom: '10%', containLabel: true },
          legend: { data: ['微盘股策略', '沪深300'], textStyle: { color: '#b0c4de' }, top: 0 },
          xAxis: {
              type: 'category',
              data: dates,
              axisLine: { lineStyle: { color: '#8392A5' } },
              axisLabel: { show: false }
          },
          yAxis: {
              type: 'value',
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
              axisLabel: { color: '#8392A5' },
              scale: true
          },
          series: [
              {
                  name: '微盘股策略',
                  type: 'line',
                  data: strategyData,
                  itemStyle: { color: '#f0e68c' },
                  showSymbol: false,
                  lineStyle: { width: 2 }
              },
              {
                  name: '沪深300',
                  type: 'line',
                  data: benchmarkData,
                  itemStyle: { color: '#5470c6' },
                  showSymbol: false,
                  lineStyle: { width: 1, type: 'dashed' },
                  areaStyle: { opacity: 0.1, color: '#5470c6' }
              }
          ]
      }
      myChart.setOption(option)
  }

  // --- 5. 热力图与辅助数据 (保持原样) ---
  const monthlyReturns = ref([
      {
          year: 2025,
          months: [
              '-0.05',
              '12.88',
              '-1.80',
              '0.40',
              '10.27',
              '10.27',
              '7.67',
              '1.23',
              '5.46',
              '7.72',
              '5.10',
              '-2.26'
          ],
          total: '72.04'
      },
      {
          year: 2024,
          months: [
              '0.18',
              '-4.90',
              '17.12',
              '0.29',
              '1.52',
              '-10.97',
              '10.58',
              '4.66',
              '26.03',
              '15.62',
              '12.36',
              '-9.70'
          ],
          total: '73.06'
      },
      {
          year: 2023,
          months: [
              '-0.00',
              '5.02',
              '-4.07',
              '0.07',
              '4.24',
              '5.93',
              '10.51',
              '1.59',
              '3.36',
              '2.53',
              '6.92',
              '1.77'
          ],
          total: '44.12'
      },
      {
          year: 2022,
          months: [
              '0.04',
              '9.15',
              '5.58',
              '-0.72',
              '13.34',
              '6.19',
              '10.11',
              '2.86',
              '-6.13',
              '5.19',
              '12.20',
              '-5.17'
          ],
          total: '63.92'
      },
      {
          year: 2021,
          months: [
              '0.24',
              '9.49',
              '8.78',
              '-0.18',
              '10.52',
              '5.29',
              '-1.31',
              '8.85',
              '0.01',
              '-2.89',
              '12.70',
              '8.68'
          ],
          total: '77.21'
      },
      {
          year: 2020,
          months: [
              '0.20',
              '15.34',
              '3.81',
              '-0.48',
              '3.26',
              '2.71',
              '11.22',
              '8.62',
              '-3.57',
              '0.17',
              '5.92',
              '-7.90'
          ],
          total: '44.15'
      },
      {
          year: 2019,
          months: [
              '-0.02',
              '23.15',
              '13.47',
              '0.61',
              '6.42',
              '5.01',
              '1.79',
              '-2.49',
              '3.29',
              '3.00',
              '-2.93',
              '9.04'
          ],
          total: '75.57'
      },
      {
          year: 2018,
          months: [
              '0.04',
              '-7.32',
              '13.57',
              '-0.10',
              '2.03',
              '-12.79',
              '5.97',
              '-6.67',
              '2.16',
              '-1.56',
              '13.35',
              '-3.50'
          ],
          total: '1.83'
      },
      {
          year: 2017,
          months: [
              '0.20',
              '4.61',
              '-6.32',
              '-0.30',
              '-7.62',
              '2.52',
              '-7.48',
              '12.64',
              '0.52',
              '0.12',
              '-6.91',
              '-2.84'
          ],
          total: '-12.04'
      },
      {
          year: 2016,
          months: [
              '-1.48',
              '1.78',
              '29.00',
              '-0.16',
              '-1.20',
              '7.19',
              '-1.93',
              '8.70',
              '6.42',
              '4.32',
              '6.43',
              '4.18'
          ],
          total: '79.47'
      },
      {
          year: 2015,
          months: [
              '0.20',
              '8.26',
              '27.69',
              '-0.04',
              '44.18',
              '-2.01',
              '-15.22',
              '-5.77',
              '1.82',
              '29.94',
              '23.85',
              '20.89'
          ],
          total: '209.56'
      },
      {
          year: 2014,
          months: [
              '-0.47',
              '6.66',
              '1.83',
              '-0.38',
              '5.43',
              '9.57',
              '12.58',
              '11.62',
              '20.81',
              '2.01',
              '5.76',
              '-13.22'
          ],
          total: '76.82'
      },
      {
          year: 2013,
          months: [
              '0.00',
              '7.09',
              '-3.85',
              '-0.28',
              '19.13',
              '-12.81',
              '14.25',
              '11.10',
              '6.80',
              '0.21',
              '14.21',
              '-1.12'
          ],
          total: '63.62'
      }
  ])

  const getHeatmapStyle = (value: any) => {
      if (value === null || value === undefined) return {}
      if (value === 0) return { backgroundColor: 'transparent' }
      if (value > 0) {
          const opacity = Math.min(Math.abs(value) / 15, 1)
          return {
              backgroundColor: `rgba(255, 87, 34, ${0.2 + opacity * 0.8})`,
              color: '#fff',
              fontWeight: value > 10 ? 'bold' : 'normal'
          }
      } else {
          const opacity = Math.min(Math.abs(value) / 15, 1)
          return {
              backgroundColor: `rgba(0, 196, 151, ${0.2 + opacity * 0.8})`,
              color: '#fff',
              fontWeight: value < -10 ? 'bold' : 'normal'
          }
      }
  }

  const getValueColorClass = (val: number) => {
      if (val > 0) return 'text-red'
      if (val < 0) return 'text-green'
      return ''
  }

  // --- FAQ & 风险数据 (保持不变) ---
  const drawdownDist = ref([
      { range: '0%~10%', count: 193 },
      { range: '10%~20%', count: 11 },
      { range: '20%~30%', count: 1 },
      { range: '30%~40%', count: 2 },
      { range: '40%~50%', count: 0 },
      { range: '>50%', count: 1 }
  ])
  const topDrawdowns = ref([
      {
          startDate: '2015-06-12',
          troughDate: '2015-07-08',
          endDate: '2015-11-24',
          drawdown: '-50.92',
          rawDd: -0.5092435194746736,
          ddDays: 26,
          fixDays: 139
      },
      {
          startDate: '2017-03-20',
          troughDate: '2018-10-18',
          endDate: '2019-02-25',
          drawdown: '-33.91',
          rawDd: -0.3390770332197848,
          ddDays: 577,
          fixDays: 130
      },
      {
          startDate: '2024-01-31',
          troughDate: '2024-02-07',
          endDate: '2024-02-27',
          drawdown: '-33.73',
          rawDd: -0.33725746954900077,
          ddDays: 7,
          fixDays: 20
      },
      {
          startDate: '2024-05-17',
          troughDate: '2024-06-06',
          endDate: '2024-09-24',
          drawdown: '-21.18',
          rawDd: -0.21177939390773315,
          ddDays: 20,
          fixDays: 110
      },
      {
          startDate: '2024-12-12',
          troughDate: '2025-01-02',
          endDate: '2025-03-18',
          drawdown: '-18.07',
          rawDd: -0.18069585108981195,
          ddDays: 21,
          fixDays: 75
      },
      {
          startDate: '2020-09-08',
          troughDate: '2021-02-08',
          endDate: '2021-03-01',
          drawdown: '-17.12',
          rawDd: -0.17118920909998162,
          ddDays: 153,
          fixDays: 21
      },
      {
          startDate: '2016-02-24',
          troughDate: '2016-02-29',
          endDate: '2016-03-18',
          drawdown: '-15.48',
          rawDd: -0.15476190476190474,
          ddDays: 5,
          fixDays: 18
      },
      {
          startDate: '2014-11-28',
          troughDate: '2014-12-23',
          endDate: '2015-03-09',
          drawdown: '-14.94',
          rawDd: -0.14941677189467428,
          ddDays: 25,
          fixDays: 76
      },
      {
          startDate: '2016-05-05',
          troughDate: '2016-05-18',
          endDate: '2016-06-28',
          drawdown: '-14.42',
          rawDd: -0.14424527862902423,
          ddDays: 13,
          fixDays: 41
      },
      {
          startDate: '2013-05-30',
          troughDate: '2013-06-25',
          endDate: '2013-08-01',
          drawdown: '-13.22',
          rawDd: -0.13217296487973187,
          ddDays: 26,
          fixDays: 37
      }
  ])
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
  const faqList = ref([
      {
          question: '我如何参与该策略？',
          answer: '本策略精选沪深主板10只小市值个股，无科创/创业板门槛，但请务必认知其高波动风险。首次建仓建议在周一上午9:30进行；后续请严格跟随信号，务必在周一9:30第一时间完成调仓，以减少因股价快速波动带来的滑点损耗。'
      },
      {
          question: '10支股票我应该如何分配资金？',
          answer: '建议严格采取“等权配置”原则。无论上周个股涨跌如何，在每次调仓完成后，请务必通过买卖操作，将这10只股票的持仓市值调整至大致相等，即每只股票各占策略总仓位的10%。这种定期的“再平衡”有助于被动实现高抛低吸，维持组合风险均衡。'
      },
      {
          question: '为何回测中1月和4月的收益表现特殊？',
          answer: '这是策略主动规避微盘股“日历效应”的结果。1月面临年关流动性收紧，4月存在财报季暴雷风险，因此模型设定了空仓避险机制。表格中的微小数值是月初清仓瞬间产生的波动，实盘操作中建议投资者根据情况灵活提前空仓观望。'
      },
      {
          question: '我应该配置多少比例？',
          answer: '微盘股属于高风险、高弹性的进攻型策略，旨在博取Alpha超额收益。但该策略对流动性极其敏感，若遇市场黑天鹅或资金面收紧，净值波动将显著放大。因此，建议将其作为投资组合中的“卫星资产”，配置比例严格控制在20%以内，以平衡整体风险。'
      }
  ])

  const getlocalData = () => {
      axios.get('./static/microCapData.json').then(res => {
          const data = res.data
          const series = prepareStrategySeries(data.dateList, data.strategyData)
          const benchmarkData = Array.isArray(data.hs300) ? data.hs300.slice(0, series.dates.length) : []
          const drawdownAnalysis = calculateDrawdownAnalysis(series.values, series.dates)

          backtestPeriodText.value = formatBacktestPeriod(series.dates)
          strategyStats.value = calculateStats(series.values)
          profitLossRatio.value = calculateProfitLossRatio(series.values)
          monthlyReturns.value = calculateMonthlyReturns(series.values, series.dates)
          monthlySummary.value = calculateMonthlySummary(monthlyReturns.value)
          drawdownDist.value = drawdownAnalysis.distribution
          topDrawdowns.value = drawdownAnalysis.drawdowns
          initChart(series.dates, series.values, benchmarkData)
      })
  }

  // --- 生命周期 ---
  onMounted(() => {
      getlocalData()
      if (canViewPremiumContent.value) {
          fetchStrategyData()
          fetchStockMap()
      }
      nextTick(() => {
          // 2. 初始化图表
          window.addEventListener('resize', () => myChart?.resize())
      })
  })

  // [新增] 控制确认弹窗显示
  const showConfirmModal = ref(false)

  // 1. [修改] 点击“录入此结果”按钮时触发的函数
  const requestApplyPlan = () => {
      // 先检查登录，没登录直接拦截，不弹确认框
      if (!userStore.isLoggedIn) {
          showMessage('请先登录后保存数据', 'warning')
          return
      }

      if (!hasCalculated.value) return

      // 打开确认弹窗
      showConfirmModal.value = true
  }

  // 2. [修改] 真正的执行函数 (原 applyPlanToHoldings 改名或修改内容)
  const executeApplyPlan = async () => {
      // 关闭弹窗
      showConfirmModal.value = false

      const newHoldings: any[] = []

      // ... 原有的构建 newHoldings 逻辑 ...
      allocationData.value.forEach((val: any, code: string) => {
          if (val.shares > 0) {
              const stockInfo = latestPortfolio.value.find((s: any) => s.code === code)
              newHoldings.push({
                  code: code,
                  name: stockInfo ? stockInfo.name : '未知',
                  shares: val.shares
              })
          }
      })

      try {
          await userStore.updateHoldings(newHoldings)
          showMessage('已将目标组合录入为当前持仓！', 'success')
          handleCalculate() // 重新计算以刷新界面
      } catch (err: any) {
          console.error(err)
          showMessage(err.message || '录入失败', 'error')
      }
  }
</script>

<style scoped>
  /* =========================================
                                                                                                                                                                                                                                            全局与基础样式 (Theme: #f0e68c / Khaki)
                                                                                                                                                                                                                                            ========================================= */
  :global(body),
  :global(html) {
      overflow-x: hidden;
      margin: 0;
      padding: 0;
  }

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
      /* 微盘股主题色背景渐变 */
      background: radial-gradient(circle at 15% 50%, #4a4a2a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a4a2a, transparent 40%), #121212;
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
  }

  .back-button {
      color: #b0c4de;
      text-decoration: none;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      display: inline-block;
  }

  .back-button:hover {
      color: #f0e68c;
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
      color: #f0e68c;
      text-shadow: 0 0 15px #f0e68c;
  }

  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  /* 内容卡片 */
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
      animation: fadeInUp 0.5s ease-out forwards;
      min-width: 0;
  }

  .content-card:hover {
      border-color: rgba(240, 230, 140, 0.5); /* Theme color hover */
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #f0e68c; /* Theme border */
      padding-left: 1rem;
      color: #fff;
  }

  .card-title.no-margin {
      margin-bottom: 0;
  }

  .card-title.no-border {
      border-left: none;
      padding-left: 0;
  }

  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.8;
      margin-bottom: 1rem;
  }

  .idea-list {
      list-style-type: none;
      padding-left: 1.5rem;
      color: #b0c4de;
      line-height: 1.8;
  }

  .idea-list li {
      position: relative;
      margin-bottom: 0.5rem;
  }

  .idea-list li::before {
      content: '✔';
      position: absolute;
      left: -1.5rem;
      color: #f0e68c;
  }

  /* 风险卡片特殊样式 */
  .risk-warning-card {
      border-left-color: #dc3545;
  }
  .risk-warning-card .card-title {
      border-left-color: #dc3545;
      color: #e24141;
  }

  /* =========================================
                                                                                                                                                                                                                                                                                                                                       新增模块样式：最新持仓与调仓
                                                                                                                                                                                                                                                                                                                                       ========================================= */
  .card-subtitle {
      font-size: 1.1rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 2rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
  }

  /* .data-table {
                                                                                                                                                                                                                                                                            width: 100%;
                                                                                                                                                                                                                                                                            border-collapse: collapse;
                                                                                                                                                                                                                                                                            min-width: 600px;
                                                                                                                                                                                                                                                                            table-layout: fixed;
                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                        .data-table th,
                                                                                                                                                                                                                                                                        .data-table td {
                                                                                                                                                                                                                                                                            padding: 0.8rem 1rem;
                                                                                                                                                                                                                                                                            text-align: left;
                                                                                                                                                                                                                                                                            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                        .data-table th {
                                                                                                                                                                                                                                                                            color: #ffffff;
                                                                                                                                                                                                                                                                            font-weight: bold;
                                                                                                                                                                                                                                                                            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                                                                                                                                                                                                                                                                            white-space: nowrap;
                                                                                                                                                                                                                                                                        } */

  .data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 0;
  }

  .data-table th {
      background: rgba(0, 0, 0, 0.2);
      color: #fff;
      font-weight: bold;
      padding: 0.8rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap;
  }

  .data-table td {
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.8rem;
      text-align: center;
      color: #b0c4de;
      font-size: 0.9rem;
      white-space: nowrap;
  }

  .data-table td {
      color: #b0c4de;
  }

  .code-font {
      /* font-family: 'Roboto Mono', monospace; */
      opacity: 1;
  }

  .text-red {
      color: #ff5722 !important;
  }
  .text-green {
      color: #00c497 !important;
  }

  .premium-lock-card {
      min-height: 280px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
  }

  .premium-lock-card .card-title {
      padding-left: 0;
      border-left: 0;
  }

  .premium-lock-icon {
      width: 54px;
      height: 54px;
      display: grid;
      place-items: center;
      margin-bottom: 1rem;
      border-radius: 50%;
      background: rgba(240, 230, 140, 0.1);
      border: 1px solid rgba(240, 230, 140, 0.25);
      font-size: 1.6rem;
  }

  .premium-lock-button {
      margin-top: 1rem;
      padding: 0.7rem 1.2rem;
      border: 0;
      border-radius: 6px;
      color: #171609;
      background: #f0e68c;
      font-weight: 700;
      cursor: pointer;
  }

  .premium-lock-button:hover {
      background: #fff2a8;
  }

  /* 调仓指引 Grid */
  .adjustments-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 1rem;
  }

  .adjustment-title {
      font-size: 1rem;
      margin: 0 0 0.8rem 0;
      font-weight: 600;
  }
  .adjustment-title.buy {
      color: #00c497;
  }
  .adjustment-title.sell {
      color: #ff5722;
  }

  .adjustment-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
  }

  .adjustment-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.5rem 0.8rem;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #b0c4de;
  }

  .adjustment-item-empty {
      color: #8392a5;
      font-size: 0.9rem;
      padding: 0.5rem 0;
  }

  .action-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: bold;
      color: #fff;
  }
  .action-badge.buy {
      background-color: rgba(0, 196, 151, 0.7);
  }
  .action-badge.sell {
      background-color: rgba(255, 87, 34, 0.7);
  }

  /* =========================================
                                                                                                                                                                                                                                                                                                                                       新增模块样式：图表与统计 (Charts & Stats)
                                                                                                                                                                                                                                                                                                                                       ========================================= */
  .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
  }

  .period-badge {
      font-size: 0.8rem;
      color: #8392a5;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .echart-container {
      width: 100%;
      height: 350px;
      margin-top: 1rem;
  }

  .stats-bar {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      background: rgba(0, 0, 0, 0.2);
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      gap: 1rem;
  }

  .stat-label {
      color: #8392a5;
      font-size: 0.8rem;
      margin-bottom: 0.3rem;
  }

  .stat-value {
      font-size: 1.1rem;
      font-weight: bold;
      color: #fff;
  }

  .stat-value.highlight {
      color: #f0e68c;
  } /* Yellow for Micro-cap */
  .stat-value.negative {
      color: #00c497;
  }

  /* =========================================
                                                                                                                                                                                                                                                                                                                                       新增模块样式：热力图 (Heatmap)
                                                                                                                                                                                                                                                                                                                                       ========================================= */
  .heatmap-container {
      overflow-x: auto;
  }

  .heatmap-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      min-width: 800px;
  }

  .heatmap-table th {
      padding: 0.8rem 0.2rem;
      font-size: 0.85rem;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap;
  }

  .heatmap-table td {
      padding: 0.6rem 0.2rem;
      text-align: center;
      font-size: 0.8rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .year-col {
      font-weight: bold;
      background: rgba(255, 255, 255, 0.02);
      color: #b0c4de;
  }

  .year-total {
      font-weight: bold;
      color: #fff;
  }

  /* =========================================
                                                                                                                                                                                                                                                                                                                                       新增模块样式：风险分析
                                                                                                                                                                                                                                                                                                                                       ========================================= */
  .risk-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
  }

  .risk-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 1.5rem 1rem;
      border-radius: 8px;
      text-align: center;
  }

  .risk-label {
      font-size: 0.85rem;
      color: #8392a5;
      margin-bottom: 0.5rem;
  }

  .risk-main-val {
      font-size: 1.4rem;
      font-weight: bold;
      color: #f0e68c; /* Theme Yellow */
      margin-bottom: 0.3rem;
  }

  .risk-sub-val {
      font-size: 0.8rem;
      color: #b0c4de;
  }

  /* 分布图表 */
  .dist-table-inner {
      min-width: 600px;
  }

  .dist-header-row,
  .dist-bar-row,
  .dist-label-row {
      display: flex;
      width: 100%;
  }

  .dist-col {
      flex: 1;
      text-align: center;
      padding: 0.5rem;
      font-size: 0.8rem;
      color: #8392a5;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
  }
  .dist-col:last-child {
      border-right: none;
  }

  .dist-bar-row {
      height: 40px;
      align-items: center;
      background: rgba(0, 0, 0, 0.2);
  }

  .dist-block.yellow-theme {
      background: linear-gradient(145deg, #f0e68c, #d4c550); /* Yellow Gradient */
      color: #121212;
      font-weight: bold;
      padding: 0.3rem 0;
      border-radius: 4px;
  }

  .risk-table {
      min-width: 700px;
  }

  /* =========================================
                                                                                                                                                                                                                                                                                                                                       FAQ 样式
                                                                                                                                                                                                                                                                                                                                       ========================================= */
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
      color: #f0e68c;
  }

  .faq-icon.is-open {
      transform: rotate(45deg);
  }

  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
  }

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
  /* =========================================
                                                                                                                                                                                                                                                     移动端适配 (最终修正版)
                                                                                                                                                                                                                                                     ========================================= */
  @media (max-width: 768px) {
      /* 1. 核心修复：给所有滚动容器添加渐变遮罩，增加高级感 */
      .table-container,
      .table-wrapper,
      .heatmap-container {
          mask-image: linear-gradient(to right, transparent, black 15px, black 95%, transparent);
          -webkit-mask-image: linear-gradient(
              to right,
              transparent,
              black 15px,
              black 95%,
              transparent
          );
      }

      /* 2. 页面容器调整：确保不超出屏幕 */
      .page-wrapper {
          padding: 2rem 1rem;
          width: 100vw; /* 强制视口宽度 */
          box-sizing: border-box;
          overflow-x: hidden;
      }

      .main-container {
          width: 100%;
      }

      /* 3. 头部标题适配 */
      .page-header {
          margin-bottom: 2rem;
      }

      .main-title {
          font-size: 2rem;
          gap: 0.8rem;
      }

      .subtitle {
          font-size: 0.95rem;
          padding: 0 1rem; /* 增加文字内边距防止贴边 */
      }

      /* 4. 卡片间距与排版 */
      .content-card {
          padding: 1.5rem 1rem;
      }

      /* 5. 修复：图表头部标题和日期竖向排列 */
      .card-header-row {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.8rem;
      }

      .period-badge {
          font-size: 0.75rem;
          align-self: flex-start; /* 靠左对齐 */
      }

      /* 6. 调仓指引：单列显示 */
      .adjustments-grid {
          grid-template-columns: 1fr;
          gap: 1.5rem;
      }

      /* 7. 统计条：改为2列网格 */
      .stats-bar {
          grid-template-columns: repeat(2, 1fr);
          padding: 1rem;
          gap: 1rem;
      }

      /* 8. 风险数据：单列显示 */
      .risk-summary-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
      }

      .risk-box {
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
      }

      /* 9. 字体与细节微调 */
      .faq-question {
          font-size: 0.95rem;
      }

      .data-table,
      .heatmap-table,
      .risk-table,
      .dist-table-inner {
          font-size: 0.85rem;
      }

      /* 10. 修复回撤分布表的容器边距 */
      .dist-table-container {
          margin-bottom: 0;
          overflow-x: auto;
      }
  }

  /* --- 新增：紧凑型计算器工具条样式 --- */
  .calculator-toolbar {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(240, 230, 140, 0.2);
      border-radius: 8px;
      padding: 0.8rem 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between; /* 两端对齐 */
      flex-wrap: wrap;
      gap: 1rem;
  }

  .calc-left {
      display: flex;
      align-items: center;
      gap: 0.8rem;
  }

  /* 输入框容器 */
  .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
  }

  .currency-symbol {
      position: absolute;
      left: 10px;
      color: #f0e68c;
      font-weight: bold;
      font-size: 1rem;
      z-index: 2;
  }

  /* 输入框样式：变短、变精致 */
  .compact-input {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      padding: 0.5rem 0.5rem 0.5rem 1.8rem; /* 左边留出 ¥ 符号的位置 */
      border-radius: 6px;
      font-size: 1rem;
      width: 140px; /* 限制宽度 */
      outline: none;
      transition: all 0.3s;
  }

  .compact-input:focus {
      border-color: #f0e68c;
      background: rgba(0, 0, 0, 0.3);
  }

  .calc-btn-compact {
      background: #f0e68c;
      color: #121212;
      border: none;
      padding: 0.55rem 1rem;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 0.9rem;
  }
  .calc-btn-compact:hover {
      opacity: 0.9;
  }

  /* 行内摘要样式 */
  .calc-summary-inline {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      /* background: rgba(255, 255, 255, 0.03); */
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
  }

  .summary-tag {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.2;
  }

  .summary-tag .label {
      font-size: 0.7rem;
      color: #8392a5;
      margin-bottom: 2px;
  }

  .summary-tag .value {
      font-size: 1rem;
      font-weight: bold;
      color: #fff;
  }

  .summary-tag .value.highlight {
      color: #f0e68c;
  }
  .summary-tag .value.warn {
      color: #ff5722;
  }

  /* 表格计算列高亮 */
  .calc-col-head {
      background: rgba(240, 230, 140, 0.15) !important;
      color: #f0e68c !important;
  }
  .calc-col-cell {
      background: rgba(240, 230, 140, 0.03);
  }

  /* 移动端适配 */
  @media (max-width: 600px) {
      .calculator-toolbar {
          flex-direction: column;
          align-items: stretch;
      }
      .compact-input {
          width: 100%;
      }
      .calc-summary-inline {
          justify-content: space-between;
      }
  }

  /* --- 新增按钮样式 --- */
  .calc-btn-compact.outline {
      background: transparent;
      border: 1px solid #f0e68c;
      color: #f0e68c;
      margin-left: 0.5rem;
  }
  .calc-btn-compact.outline:hover {
      background: rgba(240, 230, 140, 0.1);
  }

  .action-text-btn {
      background: none;
      border: none;
      color: #00c497; /* Green */
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
  }

  /* --- 调仓列表右侧样式 --- */
  .adj-right {
      display: flex;
      align-items: center;
      gap: 0.6rem;
  }
  .shares-badge {
      font-size: 0.8rem;
      color: #fff;
      font-weight: bold;
  }

  /* --- Modal 弹窗样式 --- */
  .modal-overlay {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100vh;
      height: 100svh;
      height: 100dvh;
      padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right))
          max(1rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      z-index: 999;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow-y: auto;
      box-sizing: border-box;
  }

  .modal-content {
      background: #1e1e1e;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      display: flex;
      flex-direction: column;
      max-height: 80vh; /* 防止太高 */
      max-height: min(80vh, calc(100svh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom)));
      max-height: min(80vh, calc(100dvh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom)));
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      animation: fadeInUp 0.3s ease-out;
  }

  .modal-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
  }
  .modal-header h3 {
      margin: 0;
      color: #f0e68c;
      font-size: 1.2rem;
  }
  .close-icon {
      font-size: 1.5rem;
      cursor: pointer;
      color: #8392a5;
  }

  .modal-body {
      padding: 1rem;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      -webkit-overflow-scrolling: touch;
  }

  .holding-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.8rem;
  }

  /* 输入框组 */
  .input-group {
      position: relative;
  }

  .modal-input {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      padding: 0.6rem;
      border-radius: 6px;
      font-size: 0.95rem;
      outline: none;
  }
  .modal-input:focus {
      border-color: #f0e68c;
  }
  .modal-input.code {
      width: 90px;
      text-align: center;
  }
  .modal-input.shares {
      width: 80px;
      text-align: center;
  }

  .stock-name-display {
      flex: 1;
      color: #b0c4de;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
  }

  .delete-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0 0.5rem;
  }

  .add-row-btn {
      width: 100%;
      padding: 0.8rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px dashed rgba(255, 255, 255, 0.2);
      color: #8392a5;
      border-radius: 6px;
      cursor: pointer;
      margin-top: 0.5rem;
  }
  .add-row-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
  }

  .modal-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      flex-shrink: 0;
  }

  .modal-btn {
      padding: 0.6rem 1.2rem;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: bold;
  }
  .modal-btn.cancel {
      background: transparent;
      color: #8392a5;
  }
  .modal-btn.save {
      background: #f0e68c;
      color: #121212;
  }

  /* 移动端适配 */
  @media (max-width: 480px) {
      .modal-content {
          width: 100%;
          max-height: calc(100vh - 2rem);
          max-height: calc(100svh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
          max-height: calc(100dvh - 2rem - env(safe-area-inset-top) - env(safe-area-inset-bottom));
      }

      .modal-footer {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
      }

      .holding-row {
          gap: 0.3rem;
      }
      .modal-input.code {
          width: 70px;
          padding: 0.5rem 0.2rem;
          font-size: 0.85rem;
      }
      .modal-input.shares {
          width: 60px;
          padding: 0.5rem 0.2rem;
          font-size: 0.85rem;
      }
      .stock-name-display {
          font-size: 0.8rem;
      }

      /* 调整工具栏按钮，防止挤压 */
      .calc-left {
          width: 100%;
          justify-content: space-between;
      }
      .compact-input {
          width: 100px; /* 进一步缩小输入框 */
      }
  }

  /* --- 工具栏整体容器 --- */
  .calculator-toolbar {
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(240, 230, 140, 0.2);
      border-radius: 8px;
      padding: 0.8rem 1rem;
      margin-bottom: 1.5rem;

      /* 核心布局：两端对齐，允许换行 */
      display: flex;
      justify-content: space-between;
      align-items: center; /* 垂直居中 */
      flex-wrap: wrap;
      gap: 1rem;
  }

  /* --- 左侧操作区 --- */
  .calc-left {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      /* 移动端如果太窄，左侧也不要压缩太厉害 */
      flex-shrink: 0;
  }

  /* --- 右侧组合区 (统计 + 按钮) --- */
  .calc-right-group {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      /* 让右侧在空间不足时自动换行或是占满一行 */
      flex-wrap: wrap;
      justify-content: flex-end;
  }

  /* 统计数据行 */
  .stats-row {
      display: flex;
      gap: 1.5rem;
  }

  .summary-tag {
      display: flex;
      flex-direction: column;
      align-items: flex-start; /* 保持左对齐 */
      line-height: 1.2;
  }

  /* --- [新增] 录入结果按钮样式 --- */
  .apply-result-btn {
      background: rgba(0, 196, 151, 0.15); /* 淡绿色背景 */
      color: #00c497;
      border: 1px solid rgba(0, 196, 151, 0.3);
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s;
      white-space: nowrap; /* 防止文字换行 */
      display: flex;
      align-items: center;
      gap: 4px;
  }
  .apply-result-btn:hover {
      background: rgba(0, 196, 151, 0.25);
      transform: translateY(-1px);
  }

  /* --- 移动端适配 (重点) --- */
  @media (max-width: 700px) {
      .calculator-toolbar {
          /* 移动端改为纵向排列，左侧在上，右侧在下 */
          flex-direction: column;
          align-items: stretch; /* 拉伸填满宽度 */
          gap: 1.2rem;
      }

      .calc-left {
          width: 100%;
          justify-content: space-between; /* 按钮和输入框分散对齐 */
      }

      /* 输入框稍微缩短一点，给按钮留位置 */
      .compact-input {
          width: 90px;
      }

      .calc-right-group {
          width: 100%;
          justify-content: space-between; /* 统计和按钮分散对齐 */
          border-top: 1px solid rgba(255, 255, 255, 0.1); /* 加个顶部分割线 */
          padding-top: 1rem;
      }

      .stats-row {
          gap: 1rem; /* 缩小间距 */
      }
      .modal-content {
          width: 85%;
      }
  }

  /* 针对超小屏幕 (iPhone SE 等) 的微调 */
  @media (max-width: 380px) {
      .calc-right-group {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
      }
      .apply-result-btn {
          width: 100%;
          justify-content: center;
      }
  }

  /* --- 调仓列表项内部布局 --- */
  .adjustment-item {
      /* 确保 Flex 布局两端对齐 */
      display: flex;
      justify-content: space-between;
      align-items: center;
      /* ...原有的背景色等样式保持... */
  }

  /* 左侧：名字+代码 */
  .item-left {
      display: flex;
      align-items: baseline; /* 基线对齐，让文字底部对齐 */
      gap: 6px; /* 名字和代码的间距 */
      overflow: hidden; /* 防止过长溢出 */
  }

  .stock-name {
      font-weight: 500;
      white-space: nowrap;
  }

  /* [新增] 股票代码的小字样式 */
  .code-tiny {
      font-size: 0.8rem;
      color: #bec9d8; /* 灰色 */
      font-family: 'Roboto Mono', monospace; /* 等宽字体更像代码 */
      opacity: 0.8;
  }

  /* 移动端适配：如果屏幕特别小，允许名字和代码换行，或者缩小间距 */
  @media (max-width: 360px) {
      .item-left {
          flex-direction: column; /* 名字和代码上下排列 */
          align-items: flex-start;
          gap: 0;
      }
      .code-tiny {
          font-size: 0.75rem;
      }
  }
  /* --- 确认弹窗专用样式 --- */
  .confirm-dialog {
      max-width: 360px; /* 小巧一点 */

      border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-header.no-border {
      border-bottom: none;
      padding-bottom: 0;
      justify-content: center;
      padding-top: 1.5rem;
  }

  .confirm-title {
      color: #fff; /* 普通白色标题 */
      font-size: 1.2rem;
      margin: 0;
  }

  .modal-body.text-center {
      text-align: center;
      padding: 1rem 1.5rem;
  }

  .confirm-text {
      font-size: 1rem;
      color: #b0c4de;
      margin-bottom: 0.5rem;
      line-height: 1.6;
  }

  .confirm-text strong {
      color: #f0e68c; /* 重点文字用主题黄高亮 */
  }

  .confirm-subtext {
      font-size: 0.85rem;
      color: #909399; /* 弱化辅助文字 */
  }

  .modal-footer.center-footer {
      justify-content: center;
      border-top: none;
      padding-top: 0;
      padding-bottom: 1.5rem;
      gap: 1rem;
  }

  /* [修改] 确认按钮样式：用主题色，不用红色 */
  .modal-btn.confirm-primary {
      background: #f0e68c;
      color: #121212;
      padding: 0.6rem 1.5rem;
  }
  .modal-btn.confirm-primary:hover {
      background: #d4c550;
  }

  /* ... 原有的 .action-badge 基础样式保持不变 ... */
  .action-badge {
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: bold;
      color: #fff;
      min-width: 3em; /* 保证徽标宽度一致 */
      text-align: center;
  }

  /* 基础徽标样式 */
  .action-badge {
      padding: 0.25rem 0.5rem; /* 稍微调整内边距 */
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: bold;
      color: #fff;
      text-align: center;
      display: inline-block;
      min-width: 4em; /* 稍微宽一点以容纳4个字 */
  }

  /* --- 1. 全新买入 (New Buy) - 4字，视觉最强 --- */
  .action-badge.new-buy {
      background-color: rgba(0, 196, 151, 0.6); /* 亮绿实心 */
      box-shadow: 0 2px 6px rgba(0, 196, 151, 0.4); /* 发光投影 */
      font-weight: 800; /* 特别加粗 */
      border: 1px solid rgba(0, 196, 151, 0.4);
  }

  /* --- 2. 增持 (Add Buy) - 2字，视觉稍弱 --- */
  .action-badge.add-buy {
      background-color: transparent;
      color: #00c497;
      border: 1px solid rgba(0, 196, 151, 0.6);
  }

  /* --- 3. 全部卖出 (Clear Sell) - 4字，视觉最强 --- */
  .action-badge.clear-sell {
      background-color: rgba(255, 87, 34, 0.6); /* 亮红实心 */
      box-shadow: 0 2px 6px rgba(255, 87, 34, 0.4); /* 发光投影 */
      font-weight: 800; /* 特别加粗 */
      border: 1px solid rgba(255, 87, 34, 0.4);
  }

  /* --- 4. 减持 (Cut Sell) - 2字，视觉稍弱 --- */
  .action-badge.cut-sell {
      background-color: transparent;
      color: #ff5722;
      border: 1px solid rgba(255, 87, 34, 0.6);
  }

  /* 移动端微调：防止4个字把布局挤坏 */
  @media (max-width: 360px) {
      .action-badge {
          font-size: 0.75rem; /* 字体稍微改小 */
          padding: 0.2rem 0.3rem;
      }
  }
</style>
