<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 (无变化) -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>
        <h1 class="main-title">
          <span class="title-icon">⌛</span>
          长钱策略
        </h1>
        <p class="subtitle">
          以十年为单位，拥抱波动，静待花开。
        </p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 风险告知 (无变化) -->
        <div class="content-card risk-warning-card">
          <h2 class="card-title">重要风险告知</h2>
          <p class="card-description">
            长钱策略本质上是一种高风险、高潜在回报的投资方法，它要求投资者具有极强的耐心和长远的眼光。您投入的应是未来5-10年内确定不会使用的资金。此策略在熊市中可能会面临大幅回撤，请在投资前务必确认自己能够承受相应的本金波动风险。
          </p>
        </div>

        <!-- 组合思想 (无变化) -->
        <div class="content-card">
          <h2 class="card-title">组合思想：低估播种，静待花开</h2>
          <p class="card-description">
            该策略的核心是逆向投资和价值投资。我们不在乎市场的短期情绪，只关心资产的内在价值。
          </p>
          <ul class="idea-list">
            <li><b>低估买入：</b> 在市场恐慌、指数估值处于历史低位时分批买入，如同在冬天播下种子。</li>
            <li><b>合理持有：</b> 在估值回归合理区间的过程中，耐心持有，忽略中途的波动，让利润奔跑。</li>
            <li><b>高估卖出：</b> 当市场狂热、指数估值达到历史高位时分批卖出，收获果实。</li>
            <li><b>分散市场：</b> 为降低单一市场的系统性风险，组合会配置于A股、美股等不同区域的指数，实现风险的有效对冲。</li>
          </ul>
        </div>

        <!-- ==================== 修改：推荐投资组合，增加编辑功能与空状态 ==================== -->
        <div class="content-card">
          <div class="card-header-with-admin">
            <h2 class="card-title no-border">示例投资组合 (基于当前估值)</h2>
            <div v-if="isAdmin" class="admin-controls">
              <button v-if="!isPortfolioEditing  && userInfo.admin" @click="editPortfolio" class="edit-button">编辑</button>
            </div>
          </div>
          <p class="card-description">此组合优先选择当前处于“低估区域”的指数进行配置，当其进入合理或高估区域后，则会考虑其他低估品种。</p>
          <p class="update-time" v-if="portfolioUpdatedAt">
            最后更新于: {{ portfolioUpdatedAt }}
          </p>
          <!-- 显示模式 -->
          <div v-if="!isPortfolioEditing">
            <table v-if="portfolioData.length > 0" class="data-table">
              <thead>
                <tr>
                  <th>指数风格</th>
                  <th>指数名称</th>
                  <th>基金代码</th>
                  <th>基金名称</th>
                  <th>建议份数</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in portfolioData" :key="`display-p-${index}`">
                  <td>{{ item.style }}</td>
                  <td>{{ item.indexName }}</td>
                  <td>{{ item.code }}</td>
                  <td>{{ item.fundName }}</td>
                  <td>{{ item.shares }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>当前暂无推荐的投资组合。</p>
            </div>
            <div class="strategy-tips">
              <h3 class="tips-title">投资执行小贴士</h3>
              <ul class="tips-list">
                <li>
                  <strong>平滑成本：</strong>将资金分为20份以上，优先“日定投”，其次“周定投”，以平滑成本。
                </li>
                <li>
                  <strong>复利增长：</strong>买入后，请务必将分红方式修改为“红利再投资”，让收益滚动增长。
                </li>
              </ul>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-else>
            <table v-if="tempPortfolioData.length > 0" class="data-table">
              <thead>
                <tr>
                  <th>指数风格</th>
                  <th>指数名称</th>
                  <th>基金代码</th>
                  <th>基金名称</th>
                  <th>建议份数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in tempPortfolioData" :key="`edit-p-${index}`">
                  <td><input type="text" v-model="item.style" class="input-edit"></td>
                  <td><input type="text" v-model="item.indexName" class="input-edit"></td>
                  <td><input type="text" v-model="item.code" class="input-edit"></td>
                  <td><input type="text" v-model="item.fundName" class="input-edit"></td>
                  <td><input type="text" v-model="item.shares" class="input-edit"></td>
                  <td><button @click="deletePortfolioRow(index)" class="delete-row-button">删除</button></td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>请点击下方“添加一行”开始配置投资组合。</p>
            </div>

            <button @click="addPortfolioRow" class="add-row-button">+ 添加一行</button>
            <div class="edit-actions">
              <button @click="savePortfolio" class="action-button save">保存</button>
              <button @click="cancelPortfolio" class="action-button cancel">取消</button>
            </div>
          </div>
        </div>
        <!-- ===================================================================== -->

        <!-- ==================== 新增：高估卖出提醒卡片，带编辑功能与空状态 ==================== -->
        <div class="content-card">
          <div class="card-header-with-admin">
            <h2 class="card-title no-border">高估卖出提醒</h2>
            <div v-if="isAdmin" class="admin-controls">
              <button v-if="!isSellAlertEditing && userInfo.admin" @click="editSellAlert" class="edit-button">编辑</button>
            </div>
          </div>
          <p class="card-description">以下指数已进入高估区域，根据策略纪律，建议分批卖出或停止买入，等待更好的时机。</p>
          <p class="update-time" v-if="sellAlertUpdatedAt">
            最后更新于: {{ sellAlertUpdatedAt }}
          </p>
          <!-- 显示模式 -->
          <div v-if="!isSellAlertEditing">
            <table v-if="sellAlertData.length > 0" class="data-table">
              <thead>
                <tr>
                  <th>指数名称</th>
                  <th>基金代码</th>
                  <th>当前状态</th>
                  <th>操作建议</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in sellAlertData" :key="`display-s-${index}`">
                  <td>{{ item.indexName }}</td>
                  <td>{{ item.code }}</td>
                  <td><span class="valuation-badge high">{{ item.status }}</span></td>
                  <td>{{ item.suggestion }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>当前暂无高估卖出提醒。</p>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-else>
            <table v-if="tempSellAlertData.length > 0" class="data-table">
              <thead>
                <tr>
                  <th>指数名称</th>
                  <th>基金代码</th>
                  <th>当前状态</th>
                  <th>操作建议</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in tempSellAlertData" :key="`edit-s-${index}`">
                  <td><input type="text" v-model="item.indexName" class="input-edit"></td>
                  <td><input type="text" v-model="item.code" class="input-edit"></td>
                  <td><input type="text" v-model="item.status" class="input-edit"></td>
                  <td><input type="text" v-model="item.suggestion" class="input-edit"></td>
                  <td><button @click="deleteSellAlertRow(index)" class="delete-row-button">删除</button></td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>请点击下方“添加一行”增加卖出提醒。</p>
            </div>

            <button @click="addSellAlertRow" class="add-row-button">+ 添加一行</button>
            <div class="edit-actions">
              <button @click="saveSellAlert" class="action-button save">保存</button>
              <button @click="cancelSellAlert" class="action-button cancel">取消</button>
            </div>
          </div>
        </div>
        <!-- ======================================================================= -->

        <!-- 历史业绩与收益曲线卡片 (无变化) -->
        <!-- <div class="content-card">
          <div class="card-header-with-toggle">
            <h2 class="card-title no-border">历史业绩</h2>
            <div class="view-toggle-container">
              <button :class="['toggle-button', { active: performanceViewMode === 'rate' }]"
                @click="performanceViewMode = 'rate'">累计收益率</button>
              <button :class="['toggle-button', { active: performanceViewMode === 'amount' }]"
                @click="performanceViewMode = 'amount'">累计收益金额</button>
            </div>
          </div>
          <p class="card-description">下图展示了长钱策略的模拟累计收益曲线。请注意，数据为模拟回测，不代表真实收益，旨在说明策略的高波动、高潜在回报特性。</p>
          <div ref="performanceChartContainer" class="echart-container"></div>
        </div> -->

        <!-- FAQ (无变化) -->
        <div class="content-card">
          <h2 class="card-title">常见问题 (FAQ)</h2>
          <div class="faq-container">
            <div v-for="(item, index) in faqList" :key="index" class="faq-item">
              <button class="faq-question" @click="toggleFaq(index)">
                <span>{{ item.question }}</span>
                <span :class="['faq-icon', { 'is-open': openFaqIndex === index }]">+</span>
              </button>
              <div v-if="openFaqIndex === index" class="faq-answer">
                <p>{{ item.answer }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch, computed } from 'vue'
  import * as echarts from 'echarts'
  import { useUserStore } from '@/store/user'
  import { storeToRefs } from 'pinia'
  import app from '@/lib/cloudbase' // 假设 app 实例从这里导入
  const showMessage: any = inject('showMessage')
  const userStore = useUserStore()
  const { userInfo }: any = storeToRefs(userStore)

  // --- 辅助函数：格式化时间戳 ---
  const formatTimestamp = (timestamp: any) => {
      // 1. 检查 timestamp 是否有效。如果为 null、undefined 或空字符串，直接返回。
      if (!timestamp) return ''

      // 2. 创建 Date 对象。new Date() 可以智能地解析多种格式，
      //    包括 Date 对象本身、ISO 字符串、以及您提供的 "Sat Jul 19..." 格式。
      const date = new Date(timestamp)

      // 3. 检查转换后的 date 是否是有效的日期，防止传入无效字符串导致 "Invalid Date"。
      if (isNaN(date.getTime())) {
          return '' // 如果是无效日期，返回空字符串
      }

      // 4. 格式化输出
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}`
  }
  // --- 管理员权限 ---
  const isAdmin = computed(() => userInfo.value?.admin === true)

  // --- 投资组合与卖出提醒的数据状态 ---
  const isPortfolioEditing = ref(false)
  const portfolioData = ref<any[]>([])
  const portfolioUpdatedAt = ref('') // 新增：投资组合更新时间
  let tempPortfolioData = ref<any[]>([])

  const isSellAlertEditing = ref(false)
  const sellAlertData = ref<any[]>([])
  const sellAlertUpdatedAt = ref('') // 新增：卖出提醒更新时间
  let tempSellAlertData = ref<any[]>([])

  // --- 云函数调用逻辑 ---
  const fetchStrategyData = () => {
      app.callFunction({
          name: 'getStrategyConfig',
          parse: true
      })
          .then((res: any) => {
              if (res.result?.success) {
                  const { portfolio, sellAlert } = res.result.data
                  portfolioData.value = portfolio.data || []
                  portfolioUpdatedAt.value = formatTimestamp(portfolio.updatedAt)

                  sellAlertData.value = sellAlert.data || []
                  sellAlertUpdatedAt.value = formatTimestamp(sellAlert.updatedAt)
              } else {
                  showMessage('获取策略数据失败', 'error')
              }
          })
          .catch((err: any) => {
              showMessage('网络错误，无法加载策略数据', 'error')
          })
  }

  // 组件挂载时获取初始数据
  onMounted(() => {
      fetchStrategyData()
      updatePerformanceChart() // 原有的图表逻辑保留
  })

  // --- 投资组合编辑逻辑 (已修改为调用云函数) ---
  const editPortfolio = () => {
      tempPortfolioData.value = JSON.parse(JSON.stringify(portfolioData.value))
      isPortfolioEditing.value = true
  }
  const savePortfolio = () => {
      app.callFunction({
          name: 'updateStrategyConfig',
          parse: true,
          data: {
              type: 'portfolio',
              data: tempPortfolioData.value
          }
      })
          .then((res: any) => {
              if (res.result?.success) {
                  showMessage('投资组合保存成功', 'success')
                  isPortfolioEditing.value = false
                  fetchStrategyData() // 重新获取数据以刷新页面
              } else {
                  showMessage('保存失败', 'error')
              }
          })
          .catch((err: any) => {
              showMessage('网络错误，保存失败', 'error')
          })
  }
  const cancelPortfolio = () => {
      isPortfolioEditing.value = false
  }
  const addPortfolioRow = () => {
      tempPortfolioData.value.push({ style: '', indexName: '', code: '', fundName: '', shares: '' })
  }
  const deletePortfolioRow = (index: number) => {
      tempPortfolioData.value.splice(index, 1)
  }

  // --- 高估卖出提醒编辑逻辑 (已修改为调用云函数) ---
  const editSellAlert = () => {
      tempSellAlertData.value = JSON.parse(JSON.stringify(sellAlertData.value))
      isSellAlertEditing.value = true
  }
  const saveSellAlert = () => {
      app.callFunction({
          name: 'updateStrategyConfig',
          parse: true,
          data: {
              type: 'sellAlert',
              data: tempSellAlertData.value
          }
      })
          .then((res: any) => {
              if (res.result?.success) {
                  showMessage('卖出建议保存成功', 'success')
                  isSellAlertEditing.value = false
                  fetchStrategyData() // 重新获取数据以刷新页面
              } else {
                  showMessage('保存失败', 'error')
              }
          })
          .catch((err: any) => {
              showMessage('网络错误，保存失败', 'error')
          })
  }
  const cancelSellAlert = () => {
      isSellAlertEditing.value = false
  }
  const addSellAlertRow = () => {
      tempSellAlertData.value.push({ indexName: '', code: '', status: '高估区域', suggestion: '' })
  }
  const deleteSellAlertRow = (index: number) => {
      tempSellAlertData.value.splice(index, 1)
  }

  // =================================================================
  // 以下是您页面中原有的、无需修改的逻辑（FAQ 和 ECharts 图表）
  // =================================================================

  // --- 控制FAQ展开 (无变化) ---
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
  const faqList = ref([
      {
          question: '“长钱”具体指什么钱？',
          answer: '长钱指的是您在相当长的一段时间内（通常建议至少5年以上）确定不会动用或依赖的闲置资金。它不应是您的应急备用金、生活费或短期内有明确用途（如买房、买车）的钱。'
      },
      {
          question: '如果我买入的指数一直跌怎么办？',
          answer: '这正是考验投资者耐心和纪律性的时刻。策略的核心是“低估买入”，下跌意味着可以用更便宜的价格买到更多份额。只要标的指数的基本面没有被破坏，持续下跌反而是积累廉价筹码的好机会。建议采用分批买入或定投的方式来平滑成本。'
      },
      {
          question: '我应该在什么时候卖出？',
          answer: '卖出的决策同样基于估值。当您持有的指数从低估或合理区域进入明显的“高估区域”时，就可以考虑分批卖出，锁定利润。切忌因为市场情绪狂热而追高，应严格遵守“高估卖出”的纪律。'
      },
      {
          question: '这个策略和全天候策略有什么不同？',
          answer: '主要区别在于风险和资产构成。全天候策略通过配置多种不相关的资产（股票、债券、商品）来追求全天候的稳健，波动性较低。而长钱策略主要集中于权益类资产（股票指数），目标是在承担更高波动性的前提下，获取更高的长期回报。'
      }
  ])

  // --- ECharts 图表逻辑 (无变化) ---
  const performanceViewMode = ref<'rate' | 'amount'>('rate')
  const initialPrincipal = 10000
  const performanceChartContainer = ref<HTMLElement | null>(null)
  let performanceChart: echarts.ECharts | null = null
  const performanceData = ref([
      { date: '2022-01-01', strategy: 1.0 },
      { date: '2022-02-01', strategy: 1.05 },
      { date: '2022-03-01', strategy: 0.92 },
      { date: '2022-04-01', strategy: 1.08 },
      { date: '2022-05-01', strategy: 1.05 },
      { date: '2022-06-01', strategy: 1.15 },
      { date: '2022-07-01', strategy: 1.12 },
      { date: '2022-08-01', strategy: 1.18 },
      { date: '2022-09-01', strategy: 1.09 },
      { date: '2022-10-01', strategy: 1.22 },
      { date: '2022-11-01', strategy: 1.3 },
      { date: '2022-12-01', strategy: 1.25 },
      { date: '2023-01-01', strategy: 1.4 },
      { date: '2023-02-01', strategy: 1.35 },
      { date: '2023-03-01', strategy: 1.45 },
      { date: '2023-04-01', strategy: 1.55 },
      { date: '2023-05-01', strategy: 1.48 },
      { date: '2023-06-01', strategy: 1.6 }
  ])
  const updatePerformanceChart = () => {
      if (!performanceChartContainer.value) return
      if (!performanceChart) {
          performanceChart = echarts.init(performanceChartContainer.value, 'dark')
      }
      let seriesData: number[],
          yAxisFormatter: string,
          tooltipFormatter: (params: any) => string,
          seriesName: string
      if (performanceViewMode.value === 'rate') {
          seriesName = '累计收益率'
          seriesData = performanceData.value.map(item => (item.strategy - 1) * 100)
          yAxisFormatter = '{value}%'
          tooltipFormatter = (params: any) =>
              `<strong>${params[0].name}</strong><br/>${params[0].marker} ${
                  params[0].seriesName
              }: <strong>${params[0].value.toFixed(2)}%</strong>`
      } else {
          seriesName = '累计收益金额'
          seriesData = performanceData.value.map(item => item.strategy * initialPrincipal)
          yAxisFormatter = '{value} 元'
          tooltipFormatter = (params: any) =>
              `<strong>${params[0].name}</strong><br/>${params[0].marker} ${
                  params[0].seriesName
              }: <strong>${params[0].value.toFixed(2)} 元</strong>`
      }
      const option: echarts.EChartsOption = {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis', formatter: tooltipFormatter },
          legend: { data: [seriesName], textStyle: { color: '#ccc' }, bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
          xAxis: {
              type: 'category',
              boundaryGap: false,
              data: performanceData.value.map(item => item.date),
              axisLine: { lineStyle: { color: '#8392A5' } }
          },
          yAxis: {
              type: 'value',
              axisLabel: { formatter: yAxisFormatter, color: '#ccc' },
              splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
          },
          series: [
              {
                  name: seriesName,
                  type: 'line',
                  smooth: true,
                  showSymbol: false,
                  data: seriesData,
                  itemStyle: { color: '#ff4081' },
                  lineStyle: { width: 3 },
                  areaStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                          { offset: 0, color: 'rgba(255, 64, 129, 0.3)' },
                          { offset: 1, color: 'rgba(255, 64, 129, 0)' }
                      ])
                  }
              }
          ]
      }
      performanceChart.setOption(option, true)
  }
  watch(performanceViewMode, () => {
      updatePerformanceChart()
  })
</script>

<style scoped>
  /* 主题色变量 */
  :root {
      --theme-color: #ff4081;
  }

  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      background: radial-gradient(circle at 15% 50%, #2a1a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
  }
  .main-container {
      max-width: 900px;
      margin: 0 auto;
  }
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
      color: #ff4081;
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
      color: #ff4081;
      text-shadow: 0 0 15px #ff4081;
  }
  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }
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
      transition: border-color 0.3s ease;
  }
  .content-card:hover {
      border-color: rgba(255, 64, 129, 0.5);
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #ff4081;
      padding-left: 1rem;
  }
  .risk-warning-card {
      border-left-color: #ff4081;
  }
  .risk-warning-card .card-title::before {
      /* content: '⚠️'; */
      margin-right: 0.75rem;
  }

  /* ==================== 与图表切换、管理员编辑相关的样式 (有修改) ==================== */
  .card-header-with-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
  }
  /* 修改：为带编辑按钮的卡片标题容器增加竖条样式 */
  .card-header-with-admin {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-left: 4px solid #ff4081;
      padding-left: 1rem;
  }
  /* 修改：让标题本身不再有边框和内边距，由父容器控制 */
  .card-title.no-border {
      border-left: none;
      padding-left: 0;
      margin-bottom: 0;
  }

  .view-toggle-container {
      display: flex;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 4px;
  }
  .toggle-button {
      padding: 0.4rem 0.8rem;
      cursor: pointer;
      background: transparent;
      border: none;
      color: #b0c4de;
      font-size: 0.85rem;
      border-radius: 6px;
      transition: all 0.3s ease;
  }
  .toggle-button.active {
      background-color: #ff4081;
      color: #ffffff;
      font-weight: bold;
      box-shadow: 0 0 10px rgba(255, 64, 129, 0.5);
  }
  .echart-container {
      width: 100%;
      height: 350px;
      margin-top: 1rem;
  }
  .edit-button {
      padding: 0.4rem 1rem;
      font-size: 0.85rem;
      color: #fff;
      background-color: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s;
  }
  .edit-button:hover {
      background-color: #ff4081;
      border-color: #ff4081;
  }

  .input-edit {
      width: 100%;
      background-color: rgba(0, 0, 0, 0.2);
      border: 1px solid #8392a5;
      border-radius: 4px;
      color: #fff;
      padding: 0.5rem;
  }
  .input-edit:focus {
      outline: none;
      border-color: #ff4081;
  }

  /* 新增：添加/删除行按钮和空状态样式 */
  .delete-row-button {
      background: none;
      border: none;
      color: #ff8a80;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
      font-size: 0.85rem;
  }
  .add-row-button {
      width: 100%;
      border: 2px dashed rgba(255, 255, 255, 0.2);
      background: transparent;
      color: #b0c4de;
      padding: 0.6rem;
      margin-top: 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
  }
  .add-row-button:hover {
      background-color: rgba(255, 64, 129, 0.1);
      border-color: rgba(255, 64, 129, 0.5);
  }
  .empty-state {
      text-align: center;
      padding: 2rem 1rem;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      margin-top: 1.5rem;
  }
  .empty-state p {
      margin: 0;
      color: #b0c4de;
  }

  .edit-actions {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
  }
  .action-button {
      padding: 0.5rem 1.2rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      color: #fff;
      font-weight: bold;
      transition: all 0.3s;
  }
  .action-button.save {
      background-color: #ff4081;
  }
  .action-button.save:hover {
      opacity: 0.9;
  }
  .action-button.cancel {
      background-color: rgba(255, 255, 255, 0.2);
  }
  .action-button.cancel:hover {
      background-color: rgba(255, 255, 255, 0.3);
  }
  /* =================================================================== */
  /* 新增：更新时间样式 */
  .update-time {
      font-size: 0.8rem;
      color: #8392a5; /* 一个不那么显眼的颜色 */
      margin-top: -0.5rem; /* 向上移动一点，靠近描述文字 */
      margin-bottom: 1.5rem;
  }
  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
  }
  .idea-list {
      list-style-type: none;
      padding-left: 0;
  }
  .idea-list li {
      color: #b0c4de;
      line-height: 1.8;
      padding-left: 1.5rem;
      position: relative;
      margin-bottom: 0.5rem;
  }
  .idea-list li::before {
      content: '✔';
      position: absolute;
      left: 0;
      color: #ff4081;
  }

  .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1.5rem;
  }
  .data-table th,
  .data-table td {
      padding: 0.8rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      vertical-align: middle;
  }
  .data-table th {
      color: #ffffff;
      font-weight: bold;
      font-size: 0.9rem;
  }
  .data-table td {
      color: #b0c4de;
  }
  .data-table tr:last-child td {
      border-bottom: none;
  }
  .data-table td:nth-child(2),
  .data-table td:last-child {
      font-weight: bold;
      color: #fff;
  }

  .strategy-tips {
      margin-top: 2rem; /* 与上方表格/空状态保持距离 */
      padding: 1rem 1.5rem;
      background-color: rgba(255, 64, 129, 0.05); /* 使用主题色的淡淡背景 */
      border-left: 4px solid #ff4081; /* 左侧有主题色强调线 */
      border-radius: 0 8px 8px 0; /* 配合左边框，设置圆角 */
  }

  .tips-title {
      margin-top: 0;
      margin-bottom: 0.75rem;
      font-size: 1.1rem;
      color: #ffffff; /* 标题用亮色 */
      font-weight: bold;
  }

  .tips-list {
      padding-left: 0;
      list-style-type: none; /* 去掉默认的项目符号 */
      margin: 0;
  }

  .tips-list li {
      color: #b0c4de; /* 描述文字用次要颜色 */
      font-size: 0.9rem;
      line-height: 1.7;
  }

  .tips-list li:not(:last-child) {
      margin-bottom: 0.5rem; /* 列表项之间的间距 */
  }

  .tips-list strong {
      color: #ffc107; /* 强调部分的关键词用醒目的黄色 */
      font-weight: bold;
  }

  .valuation-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: bold;
      color: #fff;
  }
  .valuation-badge.low {
      background-color: rgba(40, 167, 69, 0.5);
  }
  .valuation-badge.reasonable {
      background-color: rgba(0, 123, 255, 0.5);
  }
  .valuation-badge.high {
      background-color: rgba(220, 53, 69, 0.5);
  }

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
      color: #ff4081;
  }
  .faq-icon.is-open {
      transform: rotate(45deg);
  }
  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  @media (max-width: 768px) {
      .content-card {
          padding: 1.5rem;
      }
  }
  /* ======================================================= */
  /* ========      代码修改最小的移动端表格适配      ======== */
  /* ======================================================= */

  /* 仅在移动端屏幕宽度下生效 */
  @media (max-width: 768px) {
      /* 步骤一：修正卡片的收缩行为，防止被内部表格撑开 */
      /* 这是解决问题的根源，必须要有 */
      .content-card {
          min-width: 0;
      }

      /* 步骤二：让表格自身变得可以滚动 */
      .data-table {
          display: block; /* 关键：将 table 的显示模式从 table 改为 block */
          width: 100%; /* 让这个 block 占满父容器宽度 */
          overflow-x: auto; /* 核心：在 block 上启用水平滚动 */

          -webkit-overflow-scrolling: touch; /* iOS上提供流畅滚动 */
      }

      /* 步骤三：确保表格的单元格内容不会被错误地换行 */
      .data-table th,
      .data-table td {
          white-space: nowrap; /* 防止单元格内容断行，保持表格结构 */
      }

      /* 步骤四 (可选，但推荐): 为编辑模式的输入框设置最小宽度 */
      .data-table .input-edit {
          min-width: 120px;
      }
  }
</style>