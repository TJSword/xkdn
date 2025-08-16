<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <!-- 修改了图标和颜色 -->
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
            现金流策略的核心目标，是通过投资一系列能够稳定派发股息、利息或租金的资产，来创造一份持续、可预测的被动收入。这就像为自己打造一台“印钞机”，让资产为你工作。本策略不追求短期内的价格暴涨，而是更看重收入的稳定性和长期复利增长的潜力，非常适合希望获得“第二份工资”或为未来退休生活做准备的投资者。
          </p>
        </div>

        <!-- 卡片2: 核心投资原则 -->
        <div class="content-card">
          <h2 class="card-title">核心投资原则</h2>
          <p class="card-description">
            为了确保现金流的质量和可持续性，本策略遵循以下几个核心原则：
          </p>
          <ul class="idea-list">
            <li><b>质量优于收益率：</b>优先选择基本面稳健、有持续分红能力的公司，而非盲目追求最高的股息率。</li>
            <li><b>适度分散：</b>持仓会分散到不同的行业和资产类别中，以避免单一风险点对总收入造成巨大冲击。</li>
            <li><b>关注股息增长：</b>除了当下的股息，我们更看重资产未来的分红增长潜力，这是抵御通胀的关键。</li>
            <li><b>股息再投资：</b>将收到的现金流进行再投资，充分利用复利效应，加速资产的长期增长。</li>
          </ul>
        </div>

        <!-- ==================== 核心卡片：我的持仓参考 ==================== -->
        <div class="content-card">
          <h2 class="card-title">我的持仓参考</h2>

          <!-- 重要提示/免责声明 -->
          <div class="disclaimer-box">
            <p><strong>重要提示：</strong>以下持仓列表仅为我个人基于本策略的实践记录，用于学习和参考，<strong>绝不构成任何投资建议</strong>。市场在变，我的持仓也会动态调整。请务必基于您自己的研究和风险承受能力做出独立决策。</p>
          </div>

          <table class="portfolio-table">
            <thead>
              <tr>
                <th>资产名称</th>
                <th>代码</th>
                <th>我的成本价 (参考)</th>
                <th>类型/备注</th>
              </tr>
            </thead>
            <tbody>
              <!-- 这里是您的持仓数据，可以动态加载或静态写入 -->
              <tr>
                <td>中国神华</td>
                <td>601088</td>
                <td>28.50</td>
                <td>高股息能源股</td>
              </tr>
              <tr>
                <td>长江电力</td>
                <td>600900</td>
                <td>22.10</td>
                <td>高股息公用事业</td>
              </tr>
              <tr>
                <td>中信银行</td>
                <td>601998</td>
                <td>5.80</td>
                <td>高股息银行股</td>
              </tr>
              <tr>
                <td>平安银行REIT</td>
                <td>508001</td>
                <td>2.45</td>
                <td>仓储物流REITs</td>
              </tr>
              <tr>
                <td>普洛斯REIT</td>
                <td>508056</td>
                <td>3.10</td>
                <td>产业园REITs</td>
              </tr>
              <tr>
                <td>同仁堂科技</td>
                <td>01666 (港股)</td>
                <td>7.20 HKD</td>
                <td>港股通高股息</td>
              </tr>
              <tr>
                <td>全球X恒生高股息率ETF</td>
                <td>3110 (港股)</td>
                <td>19.80 HKD</td>
                <td>港股高股息组合</td>
              </tr>
            </tbody>
          </table>
        </div>
        <!-- ===================================================================== -->

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
  import { ref } from 'vue'

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
</script>

<style scoped>
  /* ======================================================================= */
  /* ======   样式完全复制代码自您的 AllWeather.vue，仅修改/新增少量内容   ====== */
  /* ======================================================================= */

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
      /* 修改了右侧光晕的基色为温暖的棕色，以衬托赤陶主题 */
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

  /* --- 为本页图标定义颜色 --- */
  .title-icon.cash-flow {
      color: #e59866; /* 新的赤陶色 */
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
      border-color: rgba(229, 152, 102, 0.5); /* 新的赤陶色，带透明度 */
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
      border-left: 4px solid #e59866; /* 新的赤陶色 */
      padding-left: 1rem;
  }

  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
      margin-bottom: 1rem;
  }

  .idea-list {
      list-style-type: '✔ ';
      padding-left: 1.5rem;
      color: #b0c4de;
      line-height: 1.8;
  }

  /* --- 持仓参考中的免责声明样式 --- */
  .disclaimer-box {
      background: rgba(229, 152, 102, 0.08);
      border: 1px solid rgba(229, 152, 102, 0.3);
      border-radius: 8px;
      padding: 1rem 1.2rem;
      margin-bottom: 1.5rem;
  }
  .disclaimer-box p {
      margin: 0;
      font-size: 0.9rem;
      color: #f5cba7; /* 协调的淡赤陶色 */
      line-height: 1.6;
  }
  .disclaimer-box strong {
      color: #e59866; /* 主题赤陶色 */
  }

  /* 表格样式 */
  .portfolio-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
  }
  .portfolio-table th,
  .portfolio-table td {
      padding: 0.8rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .portfolio-table th {
      color: #ffffff;
      font-weight: bold;
      font-size: 0.9rem;
  }
  .portfolio-table td {
      color: #b0c4de;
  }
  .portfolio-table tr:last-child td {
      border-bottom: none;
  }
  .portfolio-table td:nth-child(3) {
      font-weight: bold;
      color: #fff;
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
      color: #e59866; /* 新的赤陶色 */
  }
  .faq-icon.is-open {
      transform: rotate(45deg);
  }
  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  /* 响应式样式 */
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

      .content-card {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
      }
      .portfolio-table {
          min-width: 500px;
          width: 100%;
      }
  }
</style>