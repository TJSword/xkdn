<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <a href="#" class="back-button">← 返回主页</a>
        <h1 class="main-title">
          <span class="title-icon">❂</span>
          全天候策略
        </h1>
        <p class="subtitle">
          无论经济风云如何变幻，都力求稳健前行。
        </p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 策略简介 -->
        <div class="content-card">
          <h2 class="card-title">策略简介</h2>
          <p class="card-description">
            全天候策略（All-Weather
            Strategy）是由桥水基金创始人瑞·达利欧所创。其核心思想是，通过持有一系列经过精心配置且不相关的资产，构建一个能够在任何经济环境（经济增长、经济衰退、高通胀、低通胀）下都能有相对稳健表现的投资组合，目标不是追求最高收益，而是实现长期的、平滑的财富增长。
          </p>
        </div>

        <!-- 组合思路 -->
        <div class="content-card">
          <h2 class="card-title">组合思路</h2>
          <p class="card-description">
            全天候策略的精髓在于平衡风险，而非平衡资本。它将资产根据在不同“经济季节”中的表现进行分类配置，以对冲不同宏观环境带来的风险。
          </p>
          <ul class="idea-list">
            <li><b>增长超预期 ⇒</b> 配置股票等风险资产</li>
            <li><b>增长低预期 ⇒</b> 配置国债等避险资产</li>
            <li><b>通胀超预期 ⇒</b> 配置通胀挂钩债券、大宗商品</li>
            <li><b>通胀低预期 ⇒</b> 配置股票、普通国债</li>
          </ul>
          <p class="card-description">通过将资产分散到这四种情景中，无论未来发生什么，投资组合的波动性都将被有效降低。</p>
        </div>

        <!-- 投资组合配置 -->
        <div class="content-card">
          <h2 class="card-title">投资组合配置</h2>
          <div class="tabs-container">
            <button :class="['tab-button', { active: activeTab === 'on-exchange' }]" @click="activeTab = 'on-exchange'">
              场内配置 (ETFs)
            </button>
            <button :class="['tab-button', { active: activeTab === 'off-exchange' }]" @click="activeTab = 'off-exchange'">
              场外配置 (公募基金)
            </button>
          </div>

          <!-- 场内配置内容 -->
          <div v-if="activeTab === 'on-exchange'" class="tab-content">
            <p class="card-description">适合有证券账户、偏好低费率和灵活交易的投资者。</p>
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>资产类别</th>
                  <th>建议配置比例</th>
                  <th>示例ETF</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>股票资产</td>
                  <td>30%</td>
                  <td>沪深300ETF / 标普500ETF</td>
                </tr>
                <tr>
                  <td>长期国债</td>
                  <td>40%</td>
                  <td>20年+超长期国债ETF</td>
                </tr>
                <tr>
                  <td>中期国债</td>
                  <td>15%</td>
                  <td>7-10年中期国债ETF</td>
                </tr>
                <tr>
                  <td>大宗商品 (黄金)</td>
                  <td>15%</td>
                  <td>黄金ETF</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 场外配置内容 -->
          <div v-if="activeTab === 'off-exchange'" class="tab-content">
            <p class="card-description">适合希望定投、没有证券账户的投资者，申赎便利。</p>
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>资产类别</th>
                  <th>建议配置比例</th>
                  <th>示例基金类型</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>股票型基金</td>
                  <td>30%</td>
                  <td>沪深300指数基金 / 全球股票指数基金</td>
                </tr>
                <tr>
                  <td>长期纯债基金</td>
                  <td>40%</td>
                  <td>投资于长久期利率债的债券基金</td>
                </tr>
                <tr>
                  <td>中短期纯债基金</td>
                  <td>15%</td>
                  <td>投资于中短久期利率债的债券基金</td>
                </tr>
                <tr>
                  <td>黄金基金 (QDII)</td>
                  <td>15%</td>
                  <td>投资于海外黄金ETF的联接基金</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 动态再平衡 -->
        <div class="content-card rebalance-card">
          <h2 class="card-title">动态再平衡 (Rebalancing)</h2>
          <p class="card-description">
            由于市场波动，各类资产的比例会偏离初始目标。再平衡是指定期（如每半年或一年）或按比例（如偏离5%）将投资组合恢复到目标配置的操作。这是确保策略长期有效的核心纪律。
          </p>
          <button class="rebalance-cta">
            前往再平衡工具 🛠️
          </button>
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

  // --- 控制Tabs切换 ---
  const activeTab = ref<'on-exchange' | 'off-exchange'>('on-exchange')

  // --- 控制FAQ展开 ---
  const openFaqIndex = ref<number | null>(0) // 默认展开第一个

  const toggleFaq = (index: number) => {
      if (openFaqIndex.value === index) {
          openFaqIndex.value = null // 如果点击的已打开，则关闭
      } else {
          openFaqIndex.value = index // 否则打开点击的
      }
  }

  const faqList = ref([
      {
          question: '我应该多久进行一次再平衡？',
          answer: '没有绝对的答案。常见的做法是基于时间的（如每季度、每半年或每年）或基于阈值的（当任一资产类别偏离其目标权重超过某个百分比，如5%时）。对于普通投资者，每年检查一次是合理的起点。'
      },
      {
          question: '全天候策略适合我吗？',
          answer: '该策略特别适合风险偏好较低、追求长期稳定回报、不希望花费大量时间预测市场的投资者。如果您的目标是短期内获得高收益，或能够承受较高的波动性，那么其他策略可能更适合您。'
      },
      {
          question: '这个策略有什么风险？',
          answer: '虽然全天候策略旨在降低风险，但它并非没有风险。在所有资产类别都表现不佳的极端市场环境下（如滞胀初期），组合仍可能出现亏损。此外，它在长期牛市中的表现可能会落后于100%的股票投资组合。'
      },
      {
          question: '我可以直接复制这个配置吗？',
          answer: '这里的配置仅为示例，用于阐述策略原理。实际投资前，您应根据自身的风险承受能力、投资目标以及可投资的品种进行调整。务必进行独立研究，或咨询专业的财务顾问。'
      }
  ])
</script>

<style scoped>
  /* 继承主页风格 */
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
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
      color: #00aaff;
      text-shadow: 0 0 15px #00aaff;
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
      border-color: rgba(0, 170, 255, 0.5);
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #00aaff;
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

  /* Tabs 样式 */
  .tabs-container {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1.5rem;
  }
  .tab-button {
      padding: 0.75rem 1.5rem;
      cursor: pointer;
      background: transparent;
      border: none;
      color: #b0c4de;
      font-size: 1rem;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
  }
  .tab-button.active {
      color: #ffffff;
      border-bottom-color: #00aaff;
      font-weight: bold;
  }
  .tab-button:hover:not(.active) {
      background-color: rgba(255, 255, 255, 0.1);
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
  .portfolio-table td:nth-child(2) {
      font-weight: bold;
      color: #fff;
  }

  /* 再平衡CTA */
  .rebalance-card {
      text-align: center;
  }
  .rebalance-cta {
      background-color: #00aaff;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.8rem 2rem;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 0 15px rgba(0, 170, 255, 0.3);
      margin-top: 1rem;
  }
  .rebalance-cta:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 20px rgba(0, 170, 255, 0.5);
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
      color: #00aaff;
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
      .main-title {
          font-size: 2rem;
      }
      .content-card {
          padding: 1.5rem;
      }
      .tab-button {
          padding: 0.75rem;
          font-size: 0.9rem;
      }
  }
</style>