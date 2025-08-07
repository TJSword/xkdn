<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

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

        <!-- 策略简介 (无变化) -->
        <div class="content-card">
          <h2 class="card-title">策略简介</h2>
          <p class="card-description">
            本全天候策略的构建灵感，源自桥水基金创始人瑞·达利欧（Ray Dalio）的同名策略及哈里·布朗（Harry
            Browne）的永久投资组合。策略的核心在于，通过精心配置一系列低相关性的资产，旨在构建一个无论在经济增长、衰退、高通胀还是低通胀等任何宏观环境下，都具备稳健表现的投资组合。我们追求的并非短期最高收益，而是长期、平滑的资本增值。
          </p>
        </div>

        <!-- 组合思路 (无变化) -->
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

        <!-- 投资组合配置 (无变化) -->
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

          <!-- Tabs 内容... (无变化) -->
          <div v-if="activeTab === 'on-exchange'" class="tab-content">
            <p class="card-description">适合有证券账户、偏好低费率和灵活交易的投资者。</p>
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>资产类别</th>
                  <th>建议配置比例</th>
                  <th>对应ETF</th>
                  <th>ETF代码</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>A股资产</td>
                  <td>20%</td>
                  <td>中证红利质量ETF</td>
                  <td>159209</td>

                </tr>
                <tr>
                  <td>美股资产</td>
                  <td>20%</td>
                  <td>纳指ETF富国</td>
                  <td>513870</td>
                </tr>
                <tr>
                  <td>超长期国债</td>
                  <td>30%</td>
                  <td>30年国债ETF</td>
                  <td>511090</td>

                </tr>
                <tr>
                  <td>大宗商品 (黄金)</td>
                  <td>30%</td>
                  <td>黄金ETF华夏</td>
                  <td>518850</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="activeTab === 'off-exchange'" class="tab-content">
            <p class="card-description">适合希望定投、没有证券账户的投资者，申赎便利。</p>
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>资产类别</th>
                  <th>建议配置比例</th>
                  <th>对应基金名称</th>
                  <th>基金代码</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>A股资产</td>
                  <td>20%</td>
                  <td>华夏中证红利质量ETF联接A</td>
                  <td>016440</td>

                </tr>
                <tr>
                  <td>美股资产</td>
                  <td>20%</td>
                  <td>宝盈纳斯达克100指数A</td>
                  <td>019736</td>
                </tr>
                <tr>
                  <td>超长期国债</td>
                  <td>30%</td>
                  <td>华泰保兴安悦债券A</td>
                  <td>007540</td>
                </tr>
                <tr>
                  <td>大宗商品 (黄金)</td>
                  <td>30%</td>
                  <td>建信上海金ETF联接A</td>
                  <td>009033</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ==================== 新增卡片：年度业绩回测 ==================== -->
        <div class="content-card">
          <h2 class="card-title">年度业绩回测 (2014-2024)</h2>
          <p class="card-description">
            下表展示了在过去十年间，全天候策略各组成部分及整体的年度收益率(%)表现。这有助于我们理解在不同市场年份中，各类资产如何相互作用，共同平滑了组合的整体波动。
          </p>

          <div class="table-container">
            <table class="performance-data-table">
              <thead>
                <tr>
                  <th>年份</th>
                  <th>红利质量</th>
                  <th>纳斯达克</th>
                  <th>黄金</th>
                  <th>招商产业债</th>
                  <th class="highlight-col">全天候收益</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2014</td>
                  <td>45.50</td>
                  <td>16.13</td>
                  <td>1.93</td>
                  <td>21.42</td>
                  <td class="highlight-col">19.33</td>
                </tr>
                <tr>
                  <td>2015</td>
                  <td>17.10</td>
                  <td>17.19</td>
                  <td class="negative">-6.79</td>
                  <td>11.85</td>
                  <td class="highlight-col">8.38</td>
                </tr>
                <tr>
                  <td>2016</td>
                  <td>13.57</td>
                  <td>10.89</td>
                  <td>17.47</td>
                  <td>4.17</td>
                  <td class="highlight-col">11.38</td>
                </tr>
                <tr>
                  <td>2017</td>
                  <td>51.37</td>
                  <td>21.67</td>
                  <td>2.84</td>
                  <td>3.02</td>
                  <td class="highlight-col">16.37</td>
                </tr>
                <tr>
                  <td>2018</td>
                  <td class="negative">-21.10</td>
                  <td>3.84</td>
                  <td>3.49</td>
                  <td>8.64</td>
                  <td class="highlight-col">0.19</td>
                </tr>
                <tr>
                  <td>2019</td>
                  <td>40.68</td>
                  <td>39.87</td>
                  <td>19.13</td>
                  <td>6.71</td>
                  <td class="highlight-col">23.86</td>
                </tr>
                <tr>
                  <td>2020</td>
                  <td>37.95</td>
                  <td>34.37</td>
                  <td>13.90</td>
                  <td>4.17</td>
                  <td class="highlight-col">19.89</td>
                </tr>
                <tr>
                  <td>2021</td>
                  <td>8.91</td>
                  <td>24.56</td>
                  <td class="negative">-4.78</td>
                  <td>6.50</td>
                  <td class="highlight-col">7.21</td>
                </tr>
                <tr>
                  <td>2022</td>
                  <td class="negative">-6.19</td>
                  <td class="negative">-28.23</td>
                  <td>9.07</td>
                  <td>2.59</td>
                  <td class="highlight-col negative">-3.39</td>
                </tr>
                <tr>
                  <td>2023</td>
                  <td class="negative">-1.85</td>
                  <td>54.14</td>
                  <td>15.95</td>
                  <td>5.00</td>
                  <td class="highlight-col">16.74</td>
                </tr>
                <tr>
                  <td>2024</td>
                  <td>18.38</td>
                  <td>24.57</td>
                  <td>25.96</td>
                  <td>4.15</td>
                  <td class="highlight-col">17.62</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>平均年化</td>
                  <td>18.57</td>
                  <td>19.91</td>
                  <td>8.92</td>
                  <td>7.11</td>
                  <td class="highlight-col">12.51</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="backtest-notes">
            <h3 class="notes-title">回测说明</h3>
            <ul>
              <li><strong>债券替代：</strong>由于历史数据限制，回测中使用了“招商产业债”来近似模拟超长期国债的表现。虽然久期略有差异，但其走势和相关性在一定程度上可以反映长债的特点，因此回测结果仍具有较高的参考价值。</li>
              <li><strong>再平衡方式：</strong>本回测采用的是【年度再平衡】策略。实践中，若采用基于阈值的动态再平衡策略（如当任一资产偏离目标权重超过特定比例时触发），理论上可能捕获更多市场机会，或可获得微弱的超额收益。</li>
            </ul>
          </div>
        </div>
        <!-- ===================================================================== -->

        <!-- 历史业绩与收益曲线 (原卡片) -->
        <!-- <div class="content-card">
          <div class="card-header-with-toggle">
            <h2 class="card-title no-border">历史业绩</h2>
            <div class="view-toggle-container">
              <button :class="['toggle-button', { active: performanceViewMode === 'rate' }]" @click="performanceViewMode = 'rate'">
                累计收益率
              </button>
              <button :class="['toggle-button', { active: performanceViewMode === 'amount' }]" @click="performanceViewMode = 'amount'">
                累计收益金额
              </button>
            </div>
          </div>
          <p class="card-description">
            下图展示了全天候策略的模拟累计收益曲线。请注意，数据为模拟回测，仅用于说明策略特性，不代表真实收益。
          </p>
          <div ref="performanceChartContainer" class="echart-container"></div>
        </div> -->

        <!-- 动态再平衡 (无变化) -->
        <div class="content-card">
          <h2 class="card-title">动态再平衡 (Rebalancing)</h2>
          <p class="card-description">
            由于市场波动，各类资产的比例会偏离初始目标。再平衡是指定期（如每半年或一年）或按比例（如偏离15%）将投资组合恢复到目标配置的操作。这是确保策略长期有效的核心纪律。
          </p>
          <div class="rebalance-cta-box">
            <router-link to="/tools" class="rebalance-cta">
              前往再平衡工具 🛠️
            </router-link>

          </div>

        </div>

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
  import { ref, onMounted, watch } from 'vue'
  import * as echarts from 'echarts'
  import app from '@/lib/cloudbase'
  // 1. 新增：加载状态，提升用户体验
  const isLoading = ref(true)
  // --- 控制Tabs和FAQ (无变化) ---
  const activeTab = ref<'on-exchange' | 'off-exchange'>('on-exchange')
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
  const faqList = ref([
      {
          question: '投资全天候策略需要择时吗？',
          answer: '基本不需要。 全天候策略采用的是风险平价思想，其目标是构建一个在不同经济环境中都能平滑波动的资产组合。由于策略本身已经通过资产配置极大地降低了整体波动性，因此“择时”操作（即选择买入时机）对最终收益的贡献非常有限。它的核心是“持有”而非“交易”，因此您可以随时开始您的投资。'
      },
      {
          question: '在全天候策略中，我能用“红利低波指数”来替代原计划中的A股资产吗？',
          answer: '不建议这样做。全天候策略中，股票的核心作用是在“经济增长”的牛市环境下提供收益。红利低波指数本质上是防御型资产，其稳健表现主要在熊市和震荡市，这与组合中长债的对冲功能发生重叠。这种替换会削弱组合在牛市的上行潜力，损害其在关键经济环境下的表现。'
      },
      {
          question: '我应该多久进行一次再平衡？',
          answer: '没有绝对的答案。常见的做法是基于时间的（如每季度、每半年或每年）或基于阈值的（当任一资产类别偏离其目标权重超过某个百分比，如15%时）。对于普通投资者，每年检查一次是合理的起点。'
      },
      {
          question: '全天候策略适合我吗？',
          answer: '该策略特别适合风险偏好较低、追求长期稳定回报、不希望花费大量时间预测市场的投资者。如果您的目标是短期内获得高收益，或能够承受较高的波动性，那么其他策略可能更适合您。'
      },
      {
          question: '这个策略有什么风险？',
          answer: '虽然全天候策略旨在降低风险，但它并非没有风险。在所有资产类别都表现不佳的极端市场环境下（如滞胀初期），组合仍可能出现亏损。此外，它在长期牛市中的表现可能会落后于100%的股票投资组合。'
      }
  ])

  // ==================== 修改后：ECharts 图表逻辑 ====================

  // 1. 新增：控制图表视图的响应式变量，默认为 'rate' (收益率)
  const performanceViewMode = ref<'rate' | 'amount'>('rate')

  // 2. 新增：假设的初始本金，用于计算收益金额
  const initialPrincipal = 10000

  // 3. 图表容器引用和实例
  const performanceChartContainer = ref<HTMLElement | null>(null)
  let performanceChart: echarts.ECharts | null = null

  // 4. 模拟的历史业绩数据 (日期, 策略累计净值)
  const performanceData = ref([
      { date: '2022-01-01', strategy: 1.0 },
      { date: '2022-02-01', strategy: 1.01 },
      { date: '2022-03-01', strategy: 0.99 },
      { date: '2022-04-01', strategy: 1.02 },
      { date: '2022-05-01', strategy: 1.03 },
      { date: '2022-06-01', strategy: 1.05 },
      { date: '2022-07-01', strategy: 1.04 },
      { date: '2022-08-01', strategy: 1.06 },
      { date: '2022-09-01', strategy: 1.05 },
      { date: '2022-10-01', strategy: 1.07 },
      { date: '2022-11-01', strategy: 1.09 },
      { date: '2022-12-01', strategy: 1.1 },
      { date: '2023-01-01', strategy: 1.12 },
      { date: '2023-02-01', strategy: 1.11 },
      { date: '2023-03-01', strategy: 1.13 },
      { date: '2023-04-01', strategy: 1.15 },
      { date: '2023-05-01', strategy: 1.14 },
      { date: '2023-06-01', strategy: 1.16 }
  ])
  const fetchPerformanceData = async (strategyId: string) => {
      isLoading.value = true
      try {
          const res = await app.callFunction({
              name: 'getSingleStrategyPerformance',
              data: {
                  strategy_id: strategyId
              },
              parse: true
          })

          if (res.result && res.result.success) {
              // 将获取到的数据赋值给 performanceData
              performanceData.value = res.result.data
              console.log(`成功获取策略 [${strategyId}] 的数据:`, performanceData.value)

              // 数据回来后，立即更新图表
              updatePerformanceChart()
          } else {
              throw new Error(res.result.message || '从云端获取数据失败')
          }
      } catch (error) {
          console.error('fetchPerformanceData 失败:', error)
          // 在这里可以显示错误提示
      } finally {
          isLoading.value = false
      }
  }
  /**
   * 更新或初始化业绩图表的核心函数
   */
  const updatePerformanceChart = () => {
      if (!performanceChartContainer.value) return

      // 如果图表实例不存在，则初始化
      if (!performanceChart) {
          performanceChart = echarts.init(performanceChartContainer.value, 'dark')
      }

      let seriesData: number[]
      let yAxisFormatter: string
      let tooltipFormatter: (params: any) => string
      let seriesName: string

      // 根据当前视图模式，准备不同的数据和格式化配置
      if (performanceViewMode.value === 'rate') {
          seriesName = '累计收益率'
          seriesData = performanceData.value.map(item => (item.strategy - 1) * 100)
          yAxisFormatter = '{value}%'
          tooltipFormatter = (params: any) =>
              `<strong>${params[0].name}</strong><br/>${params[0].marker} ${
                  params[0].seriesName
              }: <strong>${params[0].value.toFixed(2)}%</strong>`
      } else {
          // 'amount'
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
                  itemStyle: { color: '#00aaff' },
                  lineStyle: { width: 3 },
                  areaStyle: {
                      // 添加渐变区域填充
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                          {
                              offset: 0,
                              color: 'rgba(0, 170, 255, 0.3)'
                          },
                          {
                              offset: 1,
                              color: 'rgba(0, 170, 255, 0)'
                          }
                      ])
                  }
              }
          ]
      }

      // 使用 setOption 更新图表
      performanceChart.setOption(option, true) // true 表示不与之前的 option 合并
  }

  // 侦听视图模式的变化，并更新图表
  watch(performanceViewMode, () => {
      updatePerformanceChart()
  })

  // 在组件挂载后，首次初始化图表
  onMounted(() => {
      // 在这里决定要请求哪个策略的数据
      // 在一个真实的Vue Router应用中，您会从路由参数中获取这个ID
      // 例如: const route = useRoute(); const strategyId = route.params.id;

      // 此处我们硬编码一个ID作为示例
      // const currentStrategyId = 'allWeather' // <-- 对于不同页面，修改这里即可

      // 页面挂载后，调用方法从云端获取数据
      // fetchPerformanceData(currentStrategyId)

      // 监听窗口大小变化的事件可以保留
      window.addEventListener('resize', () => {
          performanceChart?.resize()
      })
  })
</script>

<style scoped>
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
      /* 1. 改变布局模式为 flex，这是让内部元素正确表现的关键 */
      display: flex;
      flex-direction: column; /* 让卡片内部的 h2, p, table 等元素垂直排列 */

      /* 2. 这是最重要的“必杀技”，它确保卡片自身不会被内容撑开 */
      min-width: 0;
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }
  .content-card:hover {
      border-color: rgba(0, 170, 255, 0.5);
  }
  /* --- 新增：为卡片设置交错加载动画 --- */
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
  /* 如果有更多卡片，可以继续添加 */

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #00aaff;
      padding-left: 1rem;
  }

  /* 用于包含切换按钮的卡片头部 */
  .card-header-with-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
  }
  .card-title.no-border {
      border-left: none;
      padding-left: 0;
      margin-bottom: 0;
  }

  /* 视图切换按钮容器和按钮样式 */
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
      background-color: #00aaff;
      color: #ffffff;
      font-weight: bold;
      box-shadow: 0 0 10px rgba(0, 170, 255, 0.5);
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

  /* ==================== 新增样式 ==================== */
  .table-container {
      overflow-x: auto;
      margin-bottom: 1.5rem;
      border-radius: 8px;
  }
  .performance-data-table {
      width: 100%;
      min-width: 650px;
      border-collapse: collapse;
      font-size: 0.9rem;
  }
  .performance-data-table th,
  .performance-data-table td {
      padding: 0.8rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap;
  }
  .performance-data-table th {
      background-color: rgba(0, 170, 255, 0.1);
      font-weight: bold;
      color: #fff;
  }
  .performance-data-table tbody tr:nth-child(even) {
      background-color: rgba(255, 255, 255, 0.03);
  }
  .performance-data-table tbody td {
      color: #b0c4de;
  }
  .performance-data-table td:first-child {
      font-weight: bold;
      color: #fff;
  }
  .performance-data-table .negative {
      color: #ff6b6b !important;
      font-weight: bold;
  }
  .performance-data-table .highlight-col {
      font-weight: bold;
      color: #fff;
      background-color: rgba(0, 170, 255, 0.08);
  }
  .performance-data-table tfoot tr {
      background-color: rgba(0, 0, 0, 0.25);
      font-weight: bold;
  }
  .performance-data-table tfoot td {
      color: #fff;
  }
  .backtest-notes {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      border-left: 3px solid #b0c4de;
  }
  .notes-title {
      margin-top: 0;
      margin-bottom: 0.75rem;
      font-size: 1.1rem;
      font-weight: bold;
      color: #fff;
  }
  .backtest-notes ul {
      padding-left: 1.25rem;
      margin: 0;
      color: #b0c4de;
      font-size: 0.9rem;
      line-height: 1.8;
  }
  .backtest-notes li {
      margin-bottom: 0.5rem;
  }
  .backtest-notes li:last-child {
      margin-bottom: 0;
  }
  /* ================================================== */

  /* 再平衡CTA */
  .rebalance-cta-box {
      width: 100%;
      display: flex;
      justify-content: center;
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
      text-decoration: none;
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

  /* EChart容器样式 */
  .echart-container {
      width: 100%;
      height: 350px;
      margin-top: 1rem;
  }

  /* 响应式 */
  /* ... 您现有的所有 CSS 样式代码 ... */

  /* ======================================================= */
  /* ========   最终版响应式样式 (修复滚动与布局问题)   ======== */
  /* ======================================================= */

  /* --- 强制禁止页面级的横向滚动，这是修复背景和布局错乱的关键 --- */
  html,
  body {
      overflow-x: hidden;
  }

  /* --- 中等屏幕 / 平板 (<= 992px) --- */
  @media (max-width: 992px) {
      .page-wrapper {
          /* 在平板上给页面一些呼吸空间 */
          padding: 2.5rem 1.5rem;
      }
  }

  /* --- 小型屏幕 / 手机 (<= 768px) --- */
  @media (max-width: 768px) {
      .page-wrapper {
          padding: 2rem 1rem;
          /* 确保wrapper不会被内容撑开 */
          width: 100%;
          box-sizing: border-box;
      }

      .main-container {
          /* 确保主容器也不会超过屏幕宽度 */
          width: 100%;
          max-width: 100%;
      }

      /* --- 移动端头部样式 --- */
      .page-header {
          /* text-align: left; */
          margin-bottom: 2.5rem;
      }

      .back-button {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          display: block; /* 使其成为块级元素，更易点击 */
      }

      .main-title {
          font-size: 2rem;
          /* justify-content: flex-start; */
          gap: 0.8rem;
      }

      .subtitle {
          /* text-align: left; */
          font-size: 1rem;
      }

      /* --- 通用卡片样式 --- */
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

      /* --- 关键修复：处理两个宽表格 --- */
      /* 我们为两个表格的直接父容器应用滚动，如果不存在，则对表格自身应用 */
      .tab-content,
      .table-container {
          overflow-x: auto; /* 让这个容器可以横向滚动 */
          -webkit-overflow-scrolling: touch; /* 在iOS上提供更流畅的滚动体验 */

          /* 添加一个视觉提示，告诉用户这里可以滚动 */
          -webkit-mask-image: linear-gradient(
              to right,
              transparent,
              black 20px,
              black 95%,
              transparent
          );
          mask-image: linear-gradient(to right, transparent, black 20px, black 95%, transparent);
      }

      /* 设置表格的最小宽度，确保它不会被不自然地压缩 */
      .portfolio-table,
      .performance-data-table {
          min-width: 600px; /* 根据内容设定一个合理的最小宽度 */
          width: 100%;
      }

      /* 优化滚动条样式 */
      .tab-content::-webkit-scrollbar,
      .table-container::-webkit-scrollbar {
          height: 6px;
      }

      .tab-content::-webkit-scrollbar-thumb,
      .table-container::-webkit-scrollbar-thumb {
          background: #00aaff;
          border-radius: 3px;
      }

      /* --- 其他元素适配 --- */
      .tabs-container {
          width: 100%;
      }
      .tab-button {
          flex: 1;
          text-align: center;
          font-size: 0.9rem;
          padding: 0.75rem 0.5rem;
      }

      .rebalance-cta-box {
          margin-top: 1rem;
      }
      .rebalance-cta {
          display: block;
          width: 100%;
          text-align: center;
      }
  }
</style>