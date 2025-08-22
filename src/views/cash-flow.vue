<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>
        <h1 class="main-title">
          <span class="title-icon cash-flow">💰</span>
          现金流策略
        </h1>
        <p class="subtitle">
          专注于构建能够持续产生被动收入的资产组合。
        </p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 卡片1: 策略简介 -->
        <div class="content-card">
          <h2 class="card-title">策略简介</h2>
          <p class="card-description">
            如果说投资的第一性原理是<strong>管理风险</strong>，那么理财的第一性原理就是<strong>创造现金流</strong>。<br><br>
            现金流的意义远不止于账面数字，它更是一种强大的心理“压舱石”。在市场动荡、人心惶惶的熊市中，一份稳定到账的股息收入，是能让你穿越周期、安心持有的底气与信心。当波动成为常态，可预测的现金流就是对抗不确定性的最佳武器。<br><br>
            本策略的核心目标，正是围绕这一原理构建。我们通过投资一系列能够稳定派发股息、利息的优质资产，为您打造一台持续运转的“资产印钞机”。我们追求的并非短期价格的暴涨，而是收入的长期可持续性与复利增长。最终，这份被动收入将成为您财务规划中的坚固基石，无论风云如何变幻，都能为您提供一份从容与笃定。
          </p>
        </div>

        <!-- 卡片2: 核心投资原则 -->
        <div class="content-card">
          <h2 class="card-title">核心投资原则</h2>
          <p class="card-description">
            构建稳定现金流组合，如同筛选能持续产奶的“现金奶牛”。我们的选股逻辑并非追逐市场热点，而是严格遵循以下几条经过时间检验的核心原则：
          </p>
          <ul class="idea-list">
            <li>
              <b>盈利能力：高且稳定的ROE</b>
              我们寻找的不是昙花一现的明星，而是拥有宽阔“护城河”、能长期维持高盈利水平的优质企业。一个持续稳定在15%以上的ROE，是公司商业模式优秀、管理层卓越的直接体现，也是未来能够持续派发股息的根本保障。
            </li>
            <li>
              <b>安全边际：可观的股息与合理的估值</b>
              我们坚持“好公司也要有好价格”。一方面，较高的股息率直接构成了我们的现金流来源；另一方面，合理的甚至是低估的买入价格，为我们的本金提供了强大的安全垫，并预留了未来价值回归的上涨空间。二者结合，构成了攻守兼备的核心。
            </li>
            <li>
              <b>能力圈原则：只投资看得懂的生意</b>
              我们坚信，最大的风险来自于未知。因此，我们只投资那些商业模式清晰、业务逻辑简单、我们能够理解并能大致判断其未来几年发展前景的公司。这能帮助我们有效避开财务复杂、前景不明的“价值陷阱”。
            </li>
          </ul>
        </div>

        <!-- ==================== 卡片3: 我的持仓参考 (全新可展开设计) ==================== -->
        <div class="content-card">
          <div class="card-header-with-admin">
            <h2 class="card-title no-border">我的持仓参考</h2>
            <div v-if="isAdmin" class="admin-controls">
              <button v-if="!isHoldingsEditing" @click="editHoldings" class="edit-button">编辑</button>
            </div>
          </div>
          <div class="disclaimer-box">
            <p><strong>重要提示：</strong>以下持仓列表仅为我个人基于本策略的实践记录，用于学习和参考，<strong>绝不构成任何投资建议</strong>。市场在变，我的持仓也会动态调整。请务必基于您自己的研究和风险承受能力做出独立决策。</p>
          </div>
          <p class="update-time" v-if="holdingsUpdatedAt">
            最后更新于: {{ holdingsUpdatedAt }}
          </p>

          <div class="table-container">
            <!-- 显示模式 -->
            <table v-if="!isHoldingsEditing" class="portfolio-table">
              <colgroup>
                <col style="width: 25%;"> <!-- 资产名称，占最大空间 -->
                <col style="width: 25%;"> <!-- 代码 -->
                <col style="width: 25%;"> <!-- 成本价 -->
                <col style="width: 25%;"> <!-- 备注/详情按钮，保持稍窄 -->
              </colgroup>
              <thead>
                <tr>
                  <th>资产名称</th>
                  <th>代码</th>
                  <th>我的成本价</th>
                  <th class="details-column">备注</th>
                </tr>
              </thead>
              <template v-for="(item, index) in holdingsData" :key="`display-${index}`">
                <tr class="main-row">
                  <td>{{ item.name }}</td>
                  <td>{{ item.code }}</td>
                  <td>{{ item.cost }}</td>
                  <td class="details-column">
                    <button @click="toggleDetails(index)" class="details-toggle">
                      <span :class="['arrow', { active: expandedRowIndex === index }]">▼</span>
                    </button>
                  </td>
                </tr>
                <Transition name="details-fade">
                  <tr v-if="expandedRowIndex === index" class="details-row">
                    <td :colspan="4">
                      <div class="details-content">
                        <h3 class="details-title">买入逻辑与后续应对</h3>
                        <p class="details-text">{{ item.notes }}</p>
                      </div>
                    </td>
                  </tr>
                </Transition>
              </template>
              <tbody v-if="holdingsData.length === 0">
                <tr>
                  <td :colspan="4">
                    <div class="empty-state">
                      <p>当前暂无持仓参考。</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 编辑模式 -->
            <table v-else class="portfolio-table">
              <colgroup>
                <col style="width: 25%;"> <!-- 资产名称，占最大空间 -->
                <col style="width: 25%;"> <!-- 代码 -->
                <col style="width: 25%;"> <!-- 成本价 -->
                <col style="width: 15%;"> <!-- 备注/详情按钮，保持稍窄 -->
                <col style="width: 10%;">
              </colgroup>
              <thead>
                <tr>
                  <th>资产名称</th>
                  <th>代码</th>
                  <th>成本价</th>
                  <th class="details-column">备注</th>
                  <th class="action-column">操作</th>
                </tr>
              </thead>
              <template v-for="(item, index) in tempHoldingsData" :key="`edit-${index}`">
                <tr class="main-row">
                  <td><input type="text" v-model="item.name" class="input-edit"></td>
                  <td><input type="text" v-model="item.code" class="input-edit"></td>
                  <td><input type="text" v-model="item.cost" class="input-edit"></td>
                  <td class="details-column">
                    <button @click="toggleDetails(index)" class="details-toggle">
                      <span :class="['arrow', { active: expandedRowIndex === index }]">▼</span>
                    </button>
                  </td>
                  <td class="action-column">
                    <button @click="deleteHoldingsRow(index)" class="delete-row-button">删除</button>
                  </td>
                </tr>
                <Transition name="details-fade">
                  <tr v-if="expandedRowIndex === index" class="details-row">
                    <td :colspan="5">
                      <div class="details-content">
                        <h3 class="details-title">编辑买入逻辑与后续应对</h3>
                        <textarea v-model="item.notes" class="input-edit notes-edit" placeholder="请在此处输入详细的买入理由、后续应对策略等..."></textarea>
                      </div>
                    </td>
                  </tr>
                </Transition>
              </template>
              <tbody v-if="tempHoldingsData.length === 0">
                <tr>
                  <td :colspan="5">
                    <div class="empty-state">
                      <p>请点击下方“添加一行”开始配置持仓。</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="isHoldingsEditing">
              <button @click="addHoldingsRow" class="add-row-button">+ 添加一行</button>
              <div class="edit-actions">
                <button @click="saveHoldings" class="action-button save">保存</button>
                <button @click="cancelHoldings" class="action-button cancel">取消</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片4: FAQ -->
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
  import { ref, onMounted, computed, inject } from 'vue'
  import { useUserStore } from '@/store/user'
  import { storeToRefs } from 'pinia'
  import app from '@/lib/cloudbase'

  // --- 依赖注入和全局状态 (无变化) ---
  const showMessage: any = inject('showMessage')
  const userStore = useUserStore()
  const { userInfo }: any = storeToRefs(userStore)

  // --- 管理员权限 (无变化) ---
  const isAdmin = computed(() => userInfo.value?.admin === true)

  // --- 辅助函数：格式化时间戳 (无变化) ---
  const formatTimestamp = (timestamp: any) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) return ''
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
          .getDate()
          .toString()
          .padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
  }

  // ==================== 持仓参考的编辑逻辑 (已修改为真实API调用) ====================
  const isHoldingsEditing = ref(false)
  const holdingsData = ref<any[]>([])
  const holdingsUpdatedAt = ref('')
  let tempHoldingsData = ref<any[]>([])
  const expandedRowIndex = ref<number | null>(null)

  const toggleDetails = (index: number) => {
      if (expandedRowIndex.value === index) {
          expandedRowIndex.value = null
      } else {
          expandedRowIndex.value = index
      }
  }

  // 【已修改】获取持仓数据的函数
  const fetchHoldingsData = async () => {
      try {
          // 调用新的云函数来获取数据
          const res = await app.callFunction({ name: 'getCashFlowHoldings', parse: true })

          if (res.result?.success) {
              // 从返回的数据结构中正确地解析数据
              holdingsData.value = res.result.data.holdings?.data || []
              holdingsUpdatedAt.value = formatTimestamp(res.result.data.holdings?.updatedAt)
          } else {
              showMessage('获取持仓数据失败', 'error')
          }
      } catch (error) {
          showMessage('网络错误，无法加载持仓数据', 'error')
      }
  }

  const editHoldings = () => {
      tempHoldingsData.value = JSON.parse(JSON.stringify(holdingsData.value))
      expandedRowIndex.value = null
      isHoldingsEditing.value = true
  }

  // 【已修改】保存更改的函数
  const saveHoldings = async () => {
      showMessage('正在保存...', 'info')
      try {
          // 调用新的云函数来更新数据，并传递正确的 payload
          const res = await app.callFunction({
              name: 'updateCashFlowHoldings',
              parse: true,
              data: { holdings: tempHoldingsData.value } // 后端需要一个包含 holdings 数组的对象
          })

          if (res.result?.success) {
              showMessage('持仓保存成功', 'success')
              isHoldingsEditing.value = false
              fetchHoldingsData() // 保存成功后，重新获取最新数据以刷新页面
          } else {
              showMessage('保存失败: ' + res.result?.message, 'error')
          }
      } catch (error) {
          showMessage('网络错误，保存失败', 'error')
      }
  }

  const cancelHoldings = () => {
      expandedRowIndex.value = null
      isHoldingsEditing.value = false
  }

  const addHoldingsRow = () => {
      tempHoldingsData.value.push({ name: '', code: '', cost: '', notes: '请在此处填写买入逻辑...' })
  }

  const deleteHoldingsRow = (index: number) => {
      tempHoldingsData.value.splice(index, 1)
  }
  // ================================================================

  // --- FAQ 逻辑 (无变化) ---
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
  const faqList = ref([
      {
          question: '我应该完全复制你的持仓和成本价吗？',
          answer: '绝对不要。这个列表是“过去时”和“进行时”的结合，我的成本价是历史操作的结果，并不代表现在是买入的好时机。它最大的作用是让你了解现金流策略可能包含哪些类型的资产，启发你去做自己的研究。'
      },
      {
          question: '这个策略的风险是什么？',
          answer: '主要风险有两个：一是单个公司经营不善，导致削减甚至取消分红，这会直接影响现金收入；二是市场系统性风险，即使是优质公司，在熊市中股价也可能大幅下跌，造成账面浮亏。此外，利率上升也可能对高股息资产的估值产生压力。'
      },
      {
          question: '你的持仓会更新吗？多久更新一次？',
          answer: '会的。我会不定期地根据市场情况、公司基本面变化以及更好的投资机会出现时，对持仓进行微调。但总体来说，这是一个“低换手率”的策略，不会频繁买卖。具体的更新频率没有固定时间表。'
      },
      {
          question: '这个策略能跑赢大盘指数吗？',
          answer: '不一定。在市场快速上涨的大牛市中，现金流策略的表现通常会落后于高成长的指数（如创业板指）。它的优势在于市场震荡或下跌时，能提供更强的防御性和稳定的现金回报，使得持有体验更平滑。我们的目标是长期总回报，而非短期比较。'
      }
  ])

  // --- 组件挂载 (无变化) ---
  onMounted(() => {
      fetchHoldingsData()
  })
</script>
<style scoped>
  /* Base styles remain the same */
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
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a3a2a, transparent 40%), #121212;
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
      text-shadow: 0 0 15px;
  }
  .title-icon.cash-flow {
      color: #e59866;
      text-shadow: 0 0 15px #e59866;
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
      min-width: 0;
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }
  .content-card:hover {
      border-color: rgba(229, 152, 102, 0.5);
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
  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #e59866;
      padding-left: 1rem;
  }
  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
  }
  .idea-list {
      list-style: none;
      padding-left: 0;
      margin-top: 1.5rem;
  }
  .idea-list li {
      position: relative;
      padding-left: 1.8rem;
      margin-bottom: 1.5rem;
      line-height: 1.7;
      color: #b0c4de;
  }
  .idea-list li:last-child {
      margin-bottom: 0;
  }
  .idea-list li::before {
      content: '✔';
      position: absolute;
      left: 0;
      top: 2px;
      color: #e59866;
      font-weight: bold;
      font-size: 1rem;
  }
  .idea-list li b {
      display: block;
      color: #ffffff;
      font-weight: 700;
      margin-bottom: 0.4rem;
  }
  .disclaimer-box {
      background: rgba(229, 152, 102, 0.08);
      border: 1px solid rgba(229, 152, 102, 0.3);
      border-radius: 8px;
      padding: 1rem 1.2rem;
      margin-bottom: 1rem;
  }
  .disclaimer-box p {
      margin: 0;
      font-size: 0.9rem;
      color: #f5cba7;
      line-height: 1.6;
  }
  .disclaimer-box strong {
      color: #e59866;
  }

  /* ==================== 最终版表格和可展开行样式 ==================== */
  .table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
  }
  .portfolio-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
  } /* Use separate for better control */
  .portfolio-table th,
  .portfolio-table td {
      padding: 0.8rem 1rem;
      text-align: left;
      vertical-align: middle;
  }
  .portfolio-table th {
      color: #ffffff;
      font-weight: bold;
      font-size: 0.9rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  .portfolio-table .main-row td {
      color: #b0c4de;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* 列对齐与宽度控制 */
  .portfolio-table th.details-column,
  .portfolio-table td.details-column {
      text-align: center;
  }
  .portfolio-table th.action-column,
  .portfolio-table td.action-column {
      text-align: center;
  }

  /* 全新图标按钮样式 */
  .details-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #b0c4de;
      border-radius: 50%;
      cursor: pointer;
      padding: 0;
      transition: all 0.3s ease;
  }
  .details-toggle:hover {
      background-color: #e59866;
      border-color: #e59866;
      color: #fff;
  }
  .details-toggle .arrow {
      font-size: 1rem;
      line-height: 1;
      transition: transform 0.3s ease;
  }
  .details-toggle .arrow.active {
      transform: rotate(180deg);
  }

  .details-row td {
      padding: 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .details-content {
      background: rgba(0, 0, 0, 0.2);
      padding: 1.5rem;
      border-left: 4px solid #e59866;
      box-shadow: inset 0 5px 15px -5px rgba(0, 0, 0, 0.4);
  }
  .details-title {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      color: #fff;
  }
  .details-text {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.8;
      color: #b0c4de;
      white-space: pre-wrap;
  }

  /* 展开/收起动画 */
  .details-fade-enter-active,
  .details-fade-leave-active {
      transition: opacity 0.4s ease, transform 0.4s ease;
  }
  .details-fade-enter-from,
  .details-fade-leave-to {
      opacity: 0;
      transform: translateY(-10px);
  }
  /* ==================================================================== */

  /* --- 编辑功能相关样式 --- */
  .card-header-with-admin {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-left: 4px solid #e59866;
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
      background-color: #e59866;
      border-color: #e59866;
  }
  .update-time {
      font-size: 0.8rem;
      color: #8392a5;
      margin-top: -0.5rem;
      margin-bottom: 1rem;
  }
  .input-edit {
      width: 100%;
      background-color: rgba(0, 0, 0, 0.2);
      border: 1px solid #8392a5;
      border-radius: 4px;
      color: #fff;
      padding: 0.5rem;
      box-sizing: border-box;
  }
  .input-edit:focus {
      outline: none;
      border-color: #e59866;
  }
  .notes-edit {
      min-height: 200px;
      resize: vertical;
      font-family: inherit;
      line-height: 1.7;
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
      background-color: rgba(229, 152, 102, 0.1);
      border-color: rgba(229, 152, 102, 0.5);
  }
  .empty-state {
      text-align: center;
      padding: 2rem 0;
      background: transparent;
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
      background-color: #e59866;
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

  /* --- FAQ 样式 --- */
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
      color: #e59866;
  }
  .faq-icon.is-open {
      transform: rotate(45deg);
  }
  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  /* --- 响应式 --- */
  html,
  body {
      overflow-x: hidden;
  }
  @media (max-width: 768px) {
      .page-wrapper {
          padding: 2rem 1rem;
          width: 100%;
          box-sizing: border-box;
      }
      .main-container {
          width: 100%;
          max-width: 100%;
      }
      .page-header {
          margin-bottom: 2.5rem;
      }
      .back-button {
          font-size: 1rem;
          margin-bottom: 1.5rem;
          display: block;
      }
      .main-title {
          font-size: 2rem;
          gap: 0.8rem;
      }
      .subtitle {
          font-size: 1rem;
      }
      .content-card {
          padding: 1.2rem;
      }
      .card-title {
          font-size: 1.25rem;
          padding-left: 0.8rem;
      }
      .card-description {
          font-size: 0.9rem;
      }
      .table-container {
          min-width: 100%;
      }
      .portfolio-table {
          min-width: 500px;
      }
  }
</style>