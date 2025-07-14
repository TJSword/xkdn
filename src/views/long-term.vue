<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <a href="#" class="back-button">← 返回主页</a>
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

        <!-- 风险告知 -->
        <div class="content-card risk-warning-card">
          <h2 class="card-title">重要风险告知</h2>
          <p class="card-description">
            长钱策略本质上是一种高风险、高潜在回报的投资方法，它要求投资者具有极强的耐心和长远的眼光。您投入的应是未来5-10年内确定不会使用的资金。此策略在熊市中可能会面临大幅回撤，请在投资前务必确认自己能够承受相应的本金波动风险。
          </p>
        </div>

        <!-- 组合思想 -->
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

        <!-- 指数估值列表 -->
        <div class="content-card">
          <h2 class="card-title">核心指数估值列表</h2>
          <p class="card-description">以下列表展示了部分核心指数的当前估值状态，是执行“低买高卖”策略的重要参考。</p>
          <table class="data-table">
            <thead>
              <tr>
                <th>指数名称</th>
                <th>基金代码</th>
                <th>基金名称</th>
                <th>当前估值</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>沪深300</td>
                <td>000300</td>
                <td>沪深300ETF</td>
                <td><span class="valuation-badge low">低估区域</span></td>
              </tr>
              <tr>
                <td>中证500</td>
                <td>000905</td>
                <td>中证500ETF</td>
                <td><span class="valuation-badge low">低估区域</span></td>
              </tr>
              <tr>
                <td>恒生指数</td>
                <td>HSI</td>
                <td>恒生指数ETF</td>
                <td><span class="valuation-badge low">低估区域</span></td>
              </tr>
              <tr>
                <td>标普500</td>
                <td>SPX</td>
                <td>标普500ETF</td>
                <td><span class="valuation-badge reasonable">合理区域</span></td>
              </tr>
              <tr>
                <td>纳斯达克100</td>
                <td>NDX</td>
                <td>纳斯达克100ETF</td>
                <td><span class="valuation-badge high">高估区域</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 推荐投资组合 -->
        <div class="content-card">
          <h2 class="card-title">示例投资组合 (基于当前估值)</h2>
          <p class="card-description">此组合优先选择当前处于“低估区域”的指数进行配置，当其进入合理或高估区域后，则会考虑其他低估品种。</p>
          <table class="data-table">
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
              <tr>
                <td>A股大盘价值</td>
                <td>沪深300</td>
                <td>000300</td>
                <td>沪深300ETF</td>
                <td>3份</td>
              </tr>
              <tr>
                <td>A股中小盘成长</td>
                <td>中证500</td>
                <td>000905</td>
                <td>中证500ETF</td>
                <td>2份</td>
              </tr>
              <tr>
                <td>港股市场核心</td>
                <td>恒生指数</td>
                <td>HSI</td>
                <td>恒生指数ETF</td>
                <td>2份</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- FAQ -->
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
  import { ref } from 'vue'

  // --- 控制FAQ展开 ---
  const openFaqIndex = ref<number | null>(0) // 默认展开第一个

  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }

  const faqList = ref([
      {
          question: '“长钱”具体指什么钱？',
          answer: '长钱指的是您在相当长的一段时间内（通常建议至少5-10年）确定不会动用或依赖的闲置资金。它不应是您的应急备用金、生活费或短期内有明确用途（如买房、买车）的钱。'
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
</script>

<style scoped>
  /* 继承并主题化页面样式 */
  :root {
      --theme-color: #ff4081; /* 定义主题色 */
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

  /* 内容网格和卡片 */
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

  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  /* 风险卡片特殊样式 */
  .risk-warning-card {
      border-left: 5px solid #ff4081;
  }
  .risk-warning-card .card-title::before {
      content: '⚠️';
      margin-right: 0.75rem;
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

  /* 表格样式 */
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

  /* 估值标签样式 */
  .valuation-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: bold;
      color: #fff;
  }
  .valuation-badge.low {
      background-color: rgba(40, 167, 69, 0.5); /* 绿色 */
  }
  .valuation-badge.reasonable {
      background-color: rgba(0, 123, 255, 0.5); /* 蓝色 */
  }
  .valuation-badge.high {
      background-color: rgba(220, 53, 69, 0.5); /* 红色 */
  }

  /* FAQ 样式 */
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

  /* 响应式 */
  @media (max-width: 768px) {
      .content-card {
          padding: 1.5rem;
      }
  }
</style>