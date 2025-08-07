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

        <!-- 推荐投资组合 (无变化) -->
        <div class="content-card">
          <div class="card-header-with-admin">
            <h2 class="card-title no-border">推荐投资组合 (基于当前估值)</h2>
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
            <table v-if="tempPortfolioData.length > 0" class="data-table editing-portfolio-table">
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

        <!-- ==================== 修改：将“高估卖出提醒”替换为“最新策略调整” ==================== -->
        <div class="content-card">
          <div class="card-header-with-admin">
            <h2 class="card-title no-border">最新策略调整</h2>
            <div v-if="isAdmin" class="admin-controls">
              <button v-if="!isAdjustmentEditing" @click="editAdjustment" class="edit-button">编辑</button>
            </div>
          </div>
          <p class="card-description">策略已更新。请按下方表格执行操作。具体调整逻辑，请参见表格下方的“调整说明”。</p>
          <p class="update-time" v-if="adjustmentUpdatedAt">
            最后更新于: {{ adjustmentUpdatedAt }}
          </p>

          <!-- 显示模式 -->
          <div v-if="!isAdjustmentEditing">
            <!-- 修改: 使用了包含全部7种操作类型的示例数据 -->
            <table v-if="adjustmentData.length > 0" class="data-table">
              <thead>
                <tr>
                  <th>基金名称</th>
                  <th>基金代码</th>
                  <th>操作类型</th>
                  <th>调整前</th>
                  <th>调整后</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in adjustmentData" :key="`display-a-${index}`">
                  <td>{{ item.fundName }}</td>
                  <td>{{ item.code }}</td>
                  <td>
                    <!-- 修改: class绑定新的getOperationClass函数，应用渐变样式 -->
                    <span :class="['operation-badge', getOperationClass(item.operationType)]">
                      {{ item.operationType }}
                    </span>
                  </td>
                  <td>{{ item.before }}</td>
                  <td>{{ item.after }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>当前暂无策略调整。</p>
            </div>
            <div v-if="adjustmentExplanation" class="adjustment-explanation-box">
              <h3 class="explanation-title">本次调整说明</h3>
              <p class="explanation-content">{{ adjustmentExplanation }}</p>
            </div>
          </div>
          <!-- 编辑模式 -->
          <div v-else>
            <table v-if="tempAdjustmentData.length > 0" class="data-table editing-table">
              <thead>
                <tr>
                  <th>基金名称</th>
                  <th>基金代码</th>
                  <th>操作类型</th>
                  <th>调整前</th>
                  <th>调整后</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in tempAdjustmentData" :key="`edit-a-${index}`">
                  <td><input type="text" v-model="item.fundName" class="input-edit"></td>
                  <td><input type="text" v-model="item.code" class="input-edit"></td>
                  <td>
                    <!-- 修改: 将 input 替换为 select 下拉框 -->
                    <select v-model="item.operationType" class="input-edit select-edit">

                      <option v-for="op in operationTypes" :key="op" :value="op">
                        {{ op }}
                      </option>
                    </select>
                  </td>
                  <td><input type="text" v-model="item.before" class="input-edit"></td>
                  <td><input type="text" v-model="item.after" class="input-edit"></td>
                  <td><button @click="deleteAdjustmentRow(index)" class="delete-row-button">删除</button></td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>请点击下方“添加一行”增加策略调整记录。</p>
            </div>

            <button @click="addAdjustmentRow" class="add-row-button">+ 添加一行</button>

            <!-- 新增：调整说明编辑区域 -->
            <div class="adjustment-explanation-box">
              <h3 class="explanation-title">本次调整说明 (编辑)</h3>
              <textarea v-model="tempAdjustmentExplanation" class="explanation-edit" placeholder="请在此处输入调整的详细说明..."></textarea>
            </div>

            <div class="edit-actions">
              <button @click="saveAdjustment" class="action-button save">保存</button>
              <button @click="cancelAdjustment" class="action-button cancel">取消</button>
            </div>
          </div>
        </div>
        <!-- ======================================================================= -->

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
                <p style="white-space: pre-line;">{{ item.answer }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch, computed, inject } from 'vue' // 引入 inject
  import * as echarts from 'echarts'
  import { useUserStore } from '@/store/user'
  import { storeToRefs } from 'pinia'
  import app from '@/lib/cloudbase' // 假设 app 实例从这里导入
  const showMessage: any = inject('showMessage')
  const userStore = useUserStore()
  const { userInfo }: any = storeToRefs(userStore)

  // --- 辅助函数：格式化时间戳 ---
  const formatTimestamp = (timestamp: any) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
          return ''
      }
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
  }
  // --- 管理员权限 ---
  const isAdmin = computed(() => userInfo.value?.admin === true)

  // --- 投资组合数据状态 (无变化) ---
  const isPortfolioEditing = ref(false)
  const portfolioData = ref<any[]>([])
  const portfolioUpdatedAt = ref('')
  let tempPortfolioData = ref<any[]>([])
  const operationTypes = ref([
      '新增定投',
      '增加定投',
      '减少定投',
      '暂停定投',
      '恢复定投',
      '部分卖出',
      '全部卖出' // 修改: 将 "清仓" 改为 "全部卖出"
  ])

  // --- 修改: “高估卖出提醒” 相关状态替换为 “策略调整” ---
  const isAdjustmentEditing = ref(false)
  const adjustmentData: any = ref([])
  const adjustmentExplanation = ref(``)
  const adjustmentUpdatedAt = ref('2025')
  let tempAdjustmentData = ref<any[]>([])
  let tempAdjustmentExplanation = ref('')

  // --- 云函数调用逻辑 ---
  const fetchStrategyData = () => {
      app.callFunction({ name: 'getStrategyConfig', parse: true })
          .then((res: any) => {
              if (res.result?.success) {
                  const { portfolio, adjustment } = res.result.data
                  // 投资组合部分 (无变化)
                  portfolioData.value = portfolio.data || []
                  portfolioUpdatedAt.value = formatTimestamp(portfolio.updatedAt)

                  // 策略调整部分 (已修改)
                  adjustmentData.value = adjustment.data || []
                  adjustmentExplanation.value = adjustment.explanation || ''
                  adjustmentUpdatedAt.value = formatTimestamp(adjustment.updatedAt)
              } else {
                  showMessage('获取策略数据失败', 'error')
              }
          })
          .catch(() => {
              showMessage('网络错误，无法加载策略数据', 'error')
          })
  }

  // 组件挂载时获取初始数据
  onMounted(() => {
      fetchStrategyData()
  })

  // --- 投资组合编辑逻辑 (无变化) ---
  const editPortfolio = () => {
      tempPortfolioData.value = JSON.parse(JSON.stringify(portfolioData.value))
      isPortfolioEditing.value = true
  }
  const savePortfolio = () => {
      app.callFunction({
          name: 'updateStrategyConfig',
          parse: true,
          data: { type: 'portfolio', data: tempPortfolioData.value }
      })
          .then((res: any) => {
              if (res.result?.success) {
                  showMessage('投资组合保存成功', 'success')
                  isPortfolioEditing.value = false
                  fetchStrategyData()
              } else {
                  showMessage('保存失败', 'error')
              }
          })
          .catch(() => {
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

  // --- 修改: “高估卖出提醒” 编辑逻辑替换为 “策略调整” 编辑逻辑 ---
  const editAdjustment = () => {
      tempAdjustmentData.value = JSON.parse(JSON.stringify(adjustmentData.value))
      tempAdjustmentExplanation.value = adjustmentExplanation.value
      isAdjustmentEditing.value = true
  }
  const saveAdjustment = () => {
      app.callFunction({
          name: 'updateStrategyConfig',
          parse: true,
          data: {
              type: 'adjustment',
              data: tempAdjustmentData.value,
              explanation: tempAdjustmentExplanation.value
          }
      })
          .then((res: any) => {
              if (res.result?.success) {
                  showMessage('策略调整保存成功', 'success')
                  isAdjustmentEditing.value = false
                  fetchStrategyData()
              } else {
                  showMessage('保存失败', 'error')
              }
          })
          .catch(() => {
              showMessage('网络错误，保存失败', 'error')
          })
  }
  const cancelAdjustment = () => {
      isAdjustmentEditing.value = false
  }
  const addAdjustmentRow = () => {
      // 点击“添加一行”时，默认选中第一个操作类型
      tempAdjustmentData.value.push({
          indexName: '',
          code: '',
          operationType: operationTypes.value[0],
          before: '',
          after: ''
      })
  }
  const deleteAdjustmentRow = (index: number) => {
      tempAdjustmentData.value.splice(index, 1)
  }

  // 新增：用于根据操作类型返回对应CSS class的辅助函数
  const getOperationClass = (type: string) => {
      switch (type) {
          case '新增定投':
              return 'op-new-aip'
          case '增加定投':
              return 'op-increase-aip'
          case '恢复定投':
              return 'op-resume-aip'
          case '减少定投':
              return 'op-decrease-aip'
          case '暂停定投':
              return 'op-pause-aip'
          case '部分卖出':
              return 'op-partial-sell'
          case '全部卖出':
              return 'op-liquidate'
          default:
              return ''
      }
  }
  // --- FAQ 逻辑 (无变化) ---
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
  const faqList = ref([
      {
          question: '我应该如何参与“长钱策略”？',
          answer: `参与“长钱策略”并没有唯一的标准答案，关键在于结合您自身的资金状况和风险承受能力。我们推荐以下两种主流方式供您参考：\n
                              对于大多数投资者（尤其是新手）：\n
                              建议将您的增量资金（如每月工资结余）以定期定投的方式投入长钱策略。这种方式可以有效平滑市场波动的成本，无需精准择时，有助于您养成长期投资的纪律和心态。对于您的存量资金，若追求更稳健的开端，可以考虑先配置于波动性较低的全天候策略。
                              \n对于经验丰富的投资者：\n
                              如果您是心态成熟、经验丰富的投资者，可以考虑将一笔较大的资金投入长钱策略。但即便如此，我们仍强烈建议您分批买入，例如分成3-5笔在不同时间点投入。这能避免您在单一高点建仓的风险，让您的初始投资更加稳健。
                              \n\n 长钱策略的核心是用可预见的短期波动，换取更高的长期潜在回报。请务必做好心理准备，坚定地相信长期主义的力量。我们的策略会遵循“低估值买入，高估值卖出”的原则，力求在市场周期的关键节点进行操作，与您共同见证长钱策略开花结果。`
      },
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

  // --- ECharts 图表逻辑 (无变化, 可按需保留或删除) ---
  // ... (原图表逻辑代码保持不变)
</script>

<style lang="scss" scoped>
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
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }
  .content-card:hover {
      border-color: rgba(255, 64, 129, 0.5);
  }
  .content-card:nth-child(1) {
      animation-delay: 0.2s;
  }
  .content-card:nth-child(2) {
      animation-delay: 0.3s;
  }
  .content-card:nth-child(3) {
      animation-delay: 0.4s;
  }
  .content-card:nth-child(4) {
      animation-delay: 0.5s;
  }
  .content-card:nth-child(5) {
      animation-delay: 0.6s;
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
  .card-header-with-admin {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-left: 4px solid #ff4081;
      padding-left: 1rem;
  }
  .card-title.no-border {
      border-left: none;
      padding-left: 0;
      margin-bottom: 0;
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
      margin-top: 1.5rem;
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
  .update-time {
      font-size: 0.8rem;
      color: #8392a5;
      margin-top: -0.5rem;
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
  .strategy-tips {
      margin-top: 2rem;
      padding: 1rem 1.5rem;
      background-color: rgba(255, 64, 129, 0.05);
      border-left: 4px solid #ff4081;
      border-radius: 0 8px 8px 0;
  }
  .tips-title {
      margin-top: 0;
      margin-bottom: 0.75rem;
      font-size: 1.1rem;
      color: #ffffff;
      font-weight: bold;
  }
  .tips-list {
      padding-left: 0;
      list-style-type: none;
      margin: 0;
  }
  .tips-list li {
      color: #b0c4de;
      font-size: 0.9rem;
      line-height: 1.7;
  }
  .tips-list li:not(:last-child) {
      margin-bottom: 0.5rem;
  }
  .tips-list strong {
      color: #ffc107;
      font-weight: bold;
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

  /* ==================== 新增样式：策略调整卡片相关 ==================== */
  /* 操作类型药丸/徽章样式 */
  .operation-badge {
      display: inline-block;
      padding: 0.4rem 1rem;
      border-radius: 15px;
      font-size: 0.85rem;
      font-weight: bold;
      color: #fff;
      text-align: center;
      border: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s ease;
      cursor: pointer;
  }
  .operation-badge:hover {
      transform: scale(1.05);
  }

  /* 1. 新增定投 (鲜活的绿色渐变) */
  .op-new-aip {
      background-image: linear-gradient(45deg, #28a745 0%, #a8e063 100%);
  }

  /* 2. 增加定投 (充满活力的蓝绿渐变) */
  .op-increase-aip {
      background-image: linear-gradient(45deg, #2193b0 0%, #6dd5ed 100%);
  }

  /* 3. 恢复定投 (从蓝到紫的恢复感渐变) */
  .op-resume-aip {
      background-image: linear-gradient(45deg, #4e54c8 0%, #8f94fb 100%);
  }

  /* 4. 减少定投 (冷静的紫色渐变) */
  .op-decrease-aip {
      background-image: linear-gradient(45deg, #8e44ad 0%, #c0392b 100%);
  }

  /* 5. 暂停定投 (警示的黄色渐变) */
  .op-pause-aip {
      background-image: linear-gradient(45deg, #f7971e 0%, #ffd200 100%);
      color: #333; /* 黄色背景配深色文字更清晰 */
  }

  /* 6. 部分卖出 (谨慎的橙色渐变) */
  .op-partial-sell {
      background-image: linear-gradient(45deg, #ff8177 0%, #ff867a 100%);
  }

  /* 7. 清仓 (果断的红色渐变) */
  .op-liquidate {
      background-image: linear-gradient(45deg, #d32f2f 0%, #ff6b6b 100%);
  }

  /* 调整说明区域样式 */
  .adjustment-explanation-box {
      margin-top: 2rem;
      background-color: #1e2230; /* 偏蓝的深色背景 */
      border-left: 4px solid #4a90e2; /* 蓝色左边框 */
      padding: 1rem 1.5rem;
      border-radius: 0 8px 8px 0;
  }
  .explanation-title {
      font-size: 1.1rem;
      font-weight: bold;
      color: #fff;
      margin-top: 0;
      margin-bottom: 1rem;
  }
  .explanation-content {
      color: #b0c4de;
      line-height: 1.8;
      font-size: 0.95rem;
      white-space: pre-wrap; /* 尊重内容中的换行 */
  }
  .explanation-edit {
      width: 100%;
      min-height: 150px;
      background-color: rgba(0, 0, 0, 0.2);
      border: 1px solid #8392a5;
      border-radius: 4px;
      color: #fff;
      padding: 0.75rem;
      line-height: 1.7;
      font-family: inherit; /* 与页面其他部分字体保持一致 */
      resize: vertical; /* 允许用户垂直调整大小 */
  }
  .explanation-edit:focus {
      outline: none;
      border-color: #ff4081;
  }
  /* ==================== 新增: 调整“投资组合”编辑模式下表格列宽的样式 ==================== */

  /* 同样使用一个特定的 class 来仅对投资组合的编辑表格生效 */
  .editing-portfolio-table th,
  .editing-portfolio-table td {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
  }

  /* 设定每一列的宽度 */
  /* 第1列: 指数风格 */
  .editing-portfolio-table th:nth-child(1),
  .editing-portfolio-table td:nth-child(1) {
      width: 14%;
  }

  /* 第2列: 指数名称 */
  .editing-portfolio-table th:nth-child(2),
  .editing-portfolio-table td:nth-child(2) {
      width: 16%;
  }

  /* 第3列: 基金代码 (变窄) */
  .editing-portfolio-table th:nth-child(3),
  .editing-portfolio-table td:nth-child(3) {
      width: 15%;
  }

  /* 第4列: 基金名称 (自动填充剩余空间) */
  .editing-portfolio-table th:nth-child(4),
  .editing-portfolio-table td:nth-child(4) {
      /* 不设置宽度，让它自适应 */
  }

  /* 第5列: 建议份数 (变窄) */
  .editing-portfolio-table th:nth-child(5),
  .editing-portfolio-table td:nth-child(5) {
      width: 10%;
  }

  /* 第6列: 操作 (删除按钮) (保持较窄) */
  .editing-portfolio-table th:nth-child(6),
  .editing-portfolio-table td:nth-child(6) {
      width: 8%;
      text-align: center;
  }

  /* 复用之前定义的输入框和按钮样式，确保外观统一 */
  /* 如果您已经有了这些样式，则无需重复添加 */
  .input-edit {
      background-color: transparent;
      border: 1px solid #4a4e6a;
      border-radius: 8px;
      color: #fff;
      padding: 0.75rem;
      font-size: 0.9rem;
      width: 100%;
      box-sizing: border-box;
  }
  .input-edit:focus {
      outline: none;
      border-color: #ff4081;
  }

  .add-row-button {
      border-style: dashed;
      border-width: 1px;
      border-color: #4a4e6a;
      background-color: transparent;
      color: #b0c4de;
      padding: 0.75rem;
      width: 100%;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 1rem;
  }
  .add-row-button:hover {
      border-color: #ff4081;
      color: #ff4081;
  }

  /* ==================== 新增: 调整编辑模式下表格列宽的样式 ==================== */

  /* 仅在编辑模式下生效，通过给table的父元素加class来控制 */
  .editing-table th,
  .editing-table td {
      padding-left: 0.5rem; /* 稍微减少左右内边距，以获得更多空间 */
      padding-right: 0.5rem;
  }

  /* 设定每一列的宽度 */
  /* 第1列: 基金名称 (自动填充剩余空间) */
  .editing-table th:nth-child(1),
  .editing-table td:nth-child(1) {
      /* 不设置宽度，让它自适应 */
  }

  /* 第2列: 基金代码 (变窄) */
  .editing-table th:nth-child(2),
  .editing-table td:nth-child(2) {
      width: 15%; /* 或者使用固定值如 120px */
  }

  /* 第3列: 操作类型 (变宽) */
  .editing-table th:nth-child(3),
  .editing-table td:nth-child(3) {
      width: 16%; /* 或者使用固定值如 150px */
  }

  /* 第4列: 调整前 (正常) */
  .editing-table th:nth-child(4),
  .editing-table td:nth-child(4) {
      width: 22%;
  }

  /* 第5列: 调整后 (正常) */
  .editing-table th:nth-child(5),
  .editing-table td:nth-child(5) {
      width: 22%;
  }

  /* 第6列: 操作 (删除按钮) (保持较窄) */
  .editing-table th:nth-child(6),
  .editing-table td:nth-child(6) {
      width: 8%;
      text-align: center; /* 让删除按钮居中 */
  }

  /* --- 调整输入框样式以匹配新布局 --- */

  .input-edit {
      /* 基础样式保持不变，但可以微调 */
      background-color: transparent;
      border: 1px solid #4a4e6a;
      border-radius: 8px;
      color: #fff;
      padding: 0.75rem;
      font-size: 0.9rem;
      transition: border-color 0.3s;
      width: 100%; /* 关键：确保输入框填满其所在的单元格 */
      box-sizing: border-box; /* 确保 padding 不会撑破单元格宽度 */
  }
  .input-edit:focus {
      outline: none;
      border-color: #ff4081;
  }

  .select-edit {
      -webkit-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 0.7rem center;
      background-size: 1em;
      padding-right: 2.5rem;
      cursor: pointer;
      color-scheme: dark;
      > option {
          background: #2c3e50;
      }
  }

  /* 调整添加行按钮的样式 */
  .add-row-button {
      border-style: dashed;
      border-width: 1px;
      border-color: #4a4e6a;
      background-color: transparent;
      color: #b0c4de;
      padding: 0.75rem;
      width: 100%;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 1rem;
  }
  .add-row-button:hover {
      border-color: #ff4081;
      color: #ff4081;
  }

  @media (max-width: 768px) {
      .content-card {
          padding: 1.5rem;
          min-width: 0;
      }
      .data-table {
          display: block;
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
      }
      .data-table th,
      .data-table td {
          white-space: nowrap;
      }
      .data-table .input-edit {
          min-width: 120px;
      }
  }
</style>