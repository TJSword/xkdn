<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <FeaturePageIcon class="title-icon" type="all-weather" />
          全天候策略
        </h1>
        <p class="subtitle">
          无论经济风云如何变幻，都力求稳健前行。
        </p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <StrategyLoading
        v-if="isLoading"
        title="正在同步策略数据"
        description="连接云端数据，计算收益与风险指标"
        monogram="AW"
        icon-type="all-weather"
        :steps="['资产表现', '收益曲线', '风险分析']"
      />

      <div v-else-if="loadError" class="strategy-error" role="alert">
        <div class="strategy-error-icon" aria-hidden="true">!</div>
        <h2 class="strategy-error-title">策略数据暂时未能加载</h2>
        <p class="strategy-error-description">{{ loadError }}</p>
        <button class="strategy-retry-button" type="button" @click="getlocalData">重新加载</button>
      </div>

      <div v-else class="content-grid">

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
                  <th>配置比例</th>
                  <th>对应ETF</th>
                  <th>ETF代码</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>A股资产</td>
                  <td>20%</td>
                  <td>自由现金流ETF</td>
                  <td>159201</td>

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
                  <th>配置比例</th>
                  <th>对应基金名称</th>
                  <th>基金代码</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>A股资产</td>
                  <td>20%</td>
                  <td>华夏国证自由现金流ETF发起式联接A</td>
                  <td>023917</td>

                </tr>
                <tr>
                  <td>美股资产</td>
                  <td>20%</td>
                  <td>摩根纳斯达克100指数A</td>
                  <td>019172</td>
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
        <!-- <div class="content-card">
          <h2 class="card-title">年度业绩回测 (2014-2025)</h2>
          <p class="card-description">
            下表展示了在过去12年间，全天候策略各组成部分及整体的年度收益率(%)表现。这有助于我们理解在不同市场年份中，各类资产如何相互作用，共同平滑了组合的整体波动。
          </p>

          <div class="table-container">
            <table class="performance-data-table">
              <thead>
                <tr>
                  <th>年份</th>
                  <th>自由现金流</th>
                  <th>纳斯达克100</th>
                  <th>&nbsp;&nbsp;&nbsp;&nbsp;黄&nbsp;&nbsp;金&nbsp;&nbsp;&nbsp;&nbsp;</th>
                  <th>30年国债</th>
                  <th class="highlight-col">全天候策略</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2014</td>
                  <td>56.78</td>
                  <td>16.13</td>
                  <td>1.93</td>
                  <td>20.5</td>
                  <td class="highlight-col">21.31</td>
                </tr>
                <tr>
                  <td>2015</td>
                  <td>16.71</td>
                  <td>17.19</td>
                  <td class="negative">-6.79</td>
                  <td>12.40</td>
                  <td class="highlight-col">8.46</td>
                </tr>
                <tr>
                  <td>2016</td>
                  <td class="negative">-1.74</td>
                  <td>10.89</td>
                  <td>17.47</td>
                  <td>4.30</td>
                  <td class="highlight-col">8.36</td>
                </tr>
                <tr>
                  <td>2017</td>
                  <td>32.06</td>
                  <td>21.67</td>
                  <td>2.84</td>
                  <td class="negative">-9.40</td>
                  <td class="highlight-col">8.78</td>
                </tr>
                <tr>
                  <td>2018</td>
                  <td class="negative">-14.73</td>
                  <td>3.84</td>
                  <td>3.49</td>
                  <td>15.4</td>
                  <td class="highlight-col">3.49</td>
                </tr>
                <tr>
                  <td>2019</td>
                  <td>17.69</td>
                  <td>39.87</td>
                  <td>19.13</td>
                  <td>4.00</td>
                  <td class="highlight-col">18.45</td>
                </tr>
                <tr>
                  <td>2020</td>
                  <td>13.05</td>
                  <td>34.37</td>
                  <td>13.90</td>
                  <td>3.30</td>
                  <td class="highlight-col">14.64</td>
                </tr>
                <tr>
                  <td>2021</td>
                  <td>49.15</td>
                  <td>24.56</td>
                  <td class="negative">-4.78</td>
                  <td>9.70</td>
                  <td class="highlight-col">16.22</td>
                </tr>
                <tr>
                  <td>2022</td>
                  <td>5.95</td>
                  <td class="negative">-28.23</td>
                  <td>9.07</td>
                  <td>5.60</td>
                  <td class="highlight-col negative">-0.06</td>
                </tr>
                <tr>
                  <td>2023</td>
                  <td>28.92</td>
                  <td>54.14</td>
                  <td>15.95</td>
                  <td>9.50</td>
                  <td class="highlight-col">24.25</td>
                </tr>
                <tr>
                  <td>2024</td>
                  <td>32.44</td>
                  <td>24.57</td>
                  <td>25.96</td>
                  <td>12.90</td>
                  <td class="highlight-col">23.06</td>
                </tr>
                <tr>
                  <td>2025</td>
                  <td>17.85</td>
                  <td>16.38</td>
                  <td>56.86</td>
                  <td class="negative">-5.98</td>
                  <td class="highlight-col">22.11</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>平均年化</td>
                  <td>21.18</td>
                  <td>19.62</td>
                  <td>12.92</td>
                  <td>6.85</td>
                  <td class="highlight-col">14.09</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="backtest-notes">
            <h3 class="notes-title">回测说明</h3>
            <ul>
              <li><strong>再平衡方式：</strong>本回测采用的是【年度再平衡】策略。实践中，若采用基于阈值的动态再平衡策略（如当任一资产偏离目标权重超过特定比例时触发），理论上可能捕获更多市场机会，或可获得微弱的超额收益。</li>
            </ul>
          </div>
        </div> -->
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
        <div class="content-card">
          <div class="card-header-row">
            <h2 class="card-title no-margin">全天候策略 vs 沪深300全收益</h2>
            <div class="chart-range-picker">
              <div class="range-date-field">
                <input
                  v-model="dateRangeStart"
                  class="range-date-input"
                  type="text"
                  inputmode="numeric"
                  maxlength="10"
                  placeholder="YYYY-MM-DD"
                  aria-label="选择开始日期"
                  @input="handleDateRangeInput('start')"
                  @keydown.enter="applyDateRangeSelection"
                  @blur="applyDateRangeSelection"
                />
                <button
                  class="range-date-button"
                  type="button"
                  aria-label="打开开始日期选择器"
                  @click="openDatePicker('start')"
                >
                  <span class="range-calendar-icon" aria-hidden="true"></span>
                </button>
                <input
                  ref="dateRangeStartPicker"
                  v-model="dateRangeStart"
                  class="native-date-input"
                  type="date"
                  :min="chartMinDate"
                  :max="chartMaxDate"
                  tabindex="-1"
                  aria-hidden="true"
                  @change="applyDateRangeSelection"
                />
              </div>
              <span class="range-separator">~</span>
              <div class="range-date-field">
                <input
                  v-model="dateRangeEnd"
                  class="range-date-input"
                  type="text"
                  inputmode="numeric"
                  maxlength="10"
                  placeholder="YYYY-MM-DD"
                  aria-label="选择结束日期"
                  @input="handleDateRangeInput('end')"
                  @keydown.enter="applyDateRangeSelection"
                  @blur="applyDateRangeSelection"
                />
                <button
                  class="range-date-button"
                  type="button"
                  aria-label="打开结束日期选择器"
                  @click="openDatePicker('end')"
                >
                  <span class="range-calendar-icon" aria-hidden="true"></span>
                </button>
                <input
                  ref="dateRangeEndPicker"
                  v-model="dateRangeEnd"
                  class="native-date-input"
                  type="date"
                  :min="chartMinDate"
                  :max="chartMaxDate"
                  tabindex="-1"
                  aria-hidden="true"
                  @change="applyDateRangeSelection"
                />
              </div>
            </div>
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
              <div class="risk-label">盈利 / 总月数</div>
              <div class="risk-main-val">{{ monthlySummary.profitableMonths }} / {{ monthlySummary.totalMonths }}</div>
              <div class="risk-sub-val">月度胜率: {{ monthlySummary.winRate }}%</div>
            </div>
            <div class="risk-box">
              <div class="risk-label">索提诺比率</div>
              <div class="risk-main-val">{{ sortinoRatio }}</div>
              <div class="risk-sub-val">反映策略的抗跌能力</div>
            </div>
          </div>

          <h3 class="sub-title">回撤深度分布 (频率统计)</h3>
          <div class="table-container dist-table-container">
            <div class="dist-table-inner">
              <div class="dist-header-row">
                <div class="dist-col" v-for="item in drawdownDist" :key="item.range">{{ item.range }}</div>
              </div>
              <div class="dist-bar-row">
                <div class="dist-col" v-for="item in drawdownDist" :key="item.range">
                  <div class="dist-block teal-theme" :style="{ opacity: item.count > 0 ? 1 : 0.6 }">
                    {{ item.count }}
                  </div>
                </div>
              </div>
              <div class="dist-label-row">
                <div class="dist-col">次数</div>
              </div>
            </div>
          </div>

          <h3 class="sub-title" style="margin-top: 2rem;">历史重大回撤明细 (Top 10)</h3>
          <div class="table-container">
            <table class="risk-table">
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

        <!-- 动态再平衡 (无变化) -->
        <div class="content-card">
          <h2 class="card-title">动态再平衡 (Rebalancing)</h2>
          <p class="card-description">
            由于市场波动，各类资产的比例会偏离初始目标。再平衡是指定期（如每半年或一年）或按比例（如偏离30%）将投资组合恢复到目标配置的操作。这是确保策略长期有效的核心纪律。
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
  import { nextTick, onMounted, ref, watch } from 'vue'
  import * as echarts from 'echarts'
  import app from '@/lib/cloudbase'
  import axios from 'axios'
  import {
      calculateDrawdownAnalysis,
      calculateMonthlyReturns,
      calculateMonthlySummary,
      calculateSortinoRatio,
      calculateStats,
      formatBacktestPeriod,
      prepareStrategySeries
  } from '@/utils/strategyMetrics'
  import type { MonthlySummary, StrategyStats } from '@/utils/strategyMetrics'
  // 1. 新增：加载状态，提升用户体验
  const isLoading = ref(true)
  const loadError = ref('')
  // --- 控制Tabs和FAQ (无变化) ---
  const activeTab = ref<'on-exchange' | 'off-exchange'>('on-exchange')
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }
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
  const sortinoRatio = ref('0.000')
  const dateRangeStart = ref('')
  const dateRangeEnd = ref('')
  const dateRangeStartPicker = ref<HTMLInputElement | null>(null)
  const dateRangeEndPicker = ref<HTMLInputElement | null>(null)
  const chartMinDate = ref('')
  const chartMaxDate = ref('')
  const backtestPeriodText = ref('回测周期: --')
  // --- 2. 收益热力图数据 (这里用模拟数据，你可以替换为真实全天候数据) ---
  const monthlyReturns: any = ref([])
  const generateMockData = () => {
      // 示例数据：全天候策略通常波动较小，胜率高
      const years = [
          {
              year: 2025,
              months: [
                  '1.45',
                  '0.47',
                  '1.25',
                  '2.92',
                  '1.12',
                  '1.50',
                  '0.97',
                  '1.48',
                  '4.56',
                  '4.99',
                  '-0.07',
                  '0.81'
              ],
              total: '23.53'
          },
          {
              year: 2024,
              months: [
                  '3.15',
                  '3.62',
                  '3.52',
                  '0.25',
                  '2.32',
                  '1.76',
                  '0.54',
                  '0.41',
                  '4.94',
                  '1.04',
                  '0.57',
                  '2.27'
              ],
              total: '27.15'
          },
          {
              year: 2023,
              months: [
                  '4.07',
                  '0.37',
                  '5.36',
                  '2.16',
                  '0.89',
                  '2.62',
                  '2.58',
                  '-0.11',
                  '-1.59',
                  '0.39',
                  '3.41',
                  '2.26'
              ],
              total: '24.61'
          },
          {
              year: 2022,
              months: [
                  '-3.33',
                  '2.75',
                  '1.88',
                  '-2.14',
                  '0.86',
                  '-1.23',
                  '1.02',
                  '0.35',
                  '-2.51',
                  '0.43',
                  '3.34',
                  '-2.17'
              ],
              total: '-1.01'
          },
          {
              year: 2021,
              months: [
                  '-0.07',
                  '-0.17',
                  '1.40',
                  '3.36',
                  '2.38',
                  '-0.00',
                  '3.20',
                  '5.71',
                  '-2.73',
                  '0.25',
                  '0.88',
                  '2.00'
              ],
              total: '17.17'
          },
          {
              year: 2020,
              months: [
                  '1.44',
                  '0.37',
                  '-1.72',
                  '4.50',
                  '1.53',
                  '2.05',
                  '5.82',
                  '1.95',
                  '-3.42',
                  '-0.91',
                  '2.33',
                  '2.81'
              ],
              total: '17.68'
          },
          {
              year: 2019,
              months: [
                  '2.98',
                  '2.42',
                  '1.43',
                  '-0.37',
                  '-1.72',
                  '4.97',
                  '1.14',
                  '2.93',
                  '-1.00',
                  '-0.41',
                  '0.75',
                  '3.41'
              ],
              total: '17.58'
          },
          {
              year: 2018,
              months: [
                  '3.88',
                  '-1.42',
                  '-1.52',
                  '0.82',
                  '1.54',
                  '-0.20',
                  '1.59',
                  '-0.72',
                  '0.35',
                  '-1.73',
                  '0.67',
                  '-0.19'
              ],
              total: '2.97'
          },
          {
              year: 2017,
              months: [
                  '1.50',
                  '2.68',
                  '0.47',
                  '0.94',
                  '0.44',
                  '0.02',
                  '1.75',
                  '0.45',
                  '-0.17',
                  '1.01',
                  '0.87',
                  '0.15'
              ],
              total: '10.55'
          },
          {
              year: 2016,
              months: [
                  '-2.19',
                  '2.91',
                  '3.64',
                  '-0.40',
                  '-0.73',
                  '3.21',
                  '4.02',
                  '0.53',
                  '0.86',
                  '0.20',
                  '-0.97',
                  '-1.96'
              ],
              total: '9.23'
          }
      ]
      monthlyReturns.value = years
  }

  const getHeatmapStyle = (value: number | null) => {
      if (value === null || value === undefined) return {}
      if (value === 0) return { backgroundColor: 'transparent' }
      if (value > 0) {
          const opacity = Math.min(Math.abs(value) / 5, 1) // 全天候波动小，分母设小一点让颜色更明显
          return {
              backgroundColor: `rgba(255, 87, 34, ${0.15 + opacity * 0.7})`,
              color: '#fff',
              fontWeight: value > 5 ? 'bold' : 'normal'
          }
      } else {
          const opacity = Math.min(Math.abs(value) / 5, 1)
          return {
              backgroundColor: `rgba(0, 196, 151, ${0.15 + opacity * 0.7})`,
              color: '#fff',
              fontWeight: value < -5 ? 'bold' : 'normal'
          }
      }
  }

  // --- 3. 风险数据 (示例数据) ---
  const drawdownDist = ref([
      { range: '0% ~ 2%', count: 143 },
      { range: '2% ~ 4%', count: 13 },
      { range: '4% ~ 6%', count: 8 },
      { range: '6% ~ 8%', count: 0 },
      { range: '8% ~ 10%', count: 1 },
      { range: '> 10%', count: 0 }
  ])

  const topDrawdowns:any = ref([
      {
          startDate: '2020-02-21',
          troughDate: '2020-03-23',
          endDate: '2020-05-08',
          drawdown: '-9.47',
          rawDd: -0.09473478175768257,
          ddDays: 31,
          fixDays: 46
      },
      {
          startDate: '2020-09-01',
          troughDate: '2020-09-24',
          endDate: '2020-12-21',
          drawdown: '-5.68',
          rawDd: -0.05680696088567768,
          ddDays: 23,
          fixDays: 88
      },
      {
          startDate: '2016-11-09',
          troughDate: '2016-12-20',
          endDate: '2017-02-24',
          drawdown: '-5.24',
          rawDd: -0.052419603049676064,
          ddDays: 41,
          fixDays: 66
      },
      {
          startDate: '2021-09-09',
          troughDate: '2021-10-13',
          endDate: '2022-03-29',
          drawdown: '-5.21',
          rawDd: -0.052068787047254365,
          ddDays: 34,
          fixDays: 167
      },
      {
          startDate: '2018-01-26',
          troughDate: '2018-02-09',
          endDate: '2018-07-24',
          drawdown: '-5.15',
          rawDd: -0.051452177278579495,
          ddDays: 14,
          fixDays: 165
      },
      {
          startDate: '2022-04-19',
          troughDate: '2022-07-15',
          endDate: '2023-01-20',
          drawdown: '-5.06',
          rawDd: -0.05059082579509889,
          ddDays: 87,
          fixDays: 189
      },
      {
          startDate: '2025-02-14',
          troughDate: '2025-04-08',
          endDate: '2025-04-18',
          drawdown: '-4.65',
          rawDd: -0.046461579325458045,
          ddDays: 53,
          fixDays: 10
      },
      {
          startDate: '2019-04-08',
          troughDate: '2019-05-23',
          endDate: '2019-06-20',
          drawdown: '-4.36',
          rawDd: -0.04363572122604,
          ddDays: 45,
          fixDays: 28
      },
      {
          startDate: '2016-01-06',
          troughDate: '2016-01-28',
          endDate: '2016-02-19',
          drawdown: '-4.07',
          rawDd: -0.04071259425129061,
          ddDays: 22,
          fixDays: 22
      },
      {
          startDate: '2019-09-05',
          troughDate: '2019-11-12',
          endDate: '2019-12-26',
          drawdown: '-3.90',
          rawDd: -0.03903651045620864,
          ddDays: 68,
          fixDays: 44
      }
  ])

  // --- 4. ECharts 图表逻辑 ---
  const chartContainer = ref<HTMLElement | null>(null)
  let myChart: echarts.ECharts | null = null

  const CHART_REBASE_VALUE = 1000
  const chartDates = ref<string[]>([])
  const chartStrategyValues = ref<number[]>([])
  const chartBenchmarkValues = ref<number[]>([])

  const toFiniteSeries = (data: any[] = [], length: number) =>
      Array.from({ length }, (_, index) => {
          const value = Number(data[index])
          return Number.isFinite(value) ? value : NaN
      })

  const rebaseSeries = (data: number[], startIndex: number) => {
      const startValue = data[startIndex]
      if (!Number.isFinite(startValue) || startValue <= 0) {
          return data.map(value => (Number.isFinite(value) ? value : null))
      }

      return data.map(value =>
          Number.isFinite(value) ? Number(((value / startValue) * CHART_REBASE_VALUE).toFixed(2)) : null
      )
  }

  const getVisibleValues = (
      strategyDisplayData: Array<number | null>,
      benchmarkDisplayData: Array<number | null>
  ) =>
      [...strategyDisplayData, ...benchmarkDisplayData]
          .filter((value): value is number => Number.isFinite(value))

  const getAdaptiveYAxisRange = (
      strategyDisplayData: Array<number | null>,
      benchmarkDisplayData: Array<number | null>
  ) => {
      const visibleValues = getVisibleValues(strategyDisplayData, benchmarkDisplayData)
      if (!visibleValues.length) return {}

      const visibleMin = Math.min(...visibleValues)
      const visibleMax = Math.max(...visibleValues)
      const visibleRange = Math.max(visibleMax - visibleMin, CHART_REBASE_VALUE * 0.025)
      const min = Math.min(visibleMin - visibleRange * 0.08, CHART_REBASE_VALUE - visibleRange * 0.22)
      const max = Math.max(visibleMax + visibleRange * 0.14, CHART_REBASE_VALUE + visibleRange * 0.72)

      return {
          min: Math.floor(min / 10) * 10,
          max: Math.ceil(max / 10) * 10
      }
  }

  const clampIndex = (index: number, maxIndex: number) =>
      Math.min(Math.max(Math.round(index), 0), Math.max(maxIndex, 0))

  const formatDateInputText = (value: string) => {
      const digits = value.replace(/\D/g, '').slice(0, 8)
      const parts = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean)
      return parts.join('-')
  }

  const isCompleteDateInput = (value: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

      const [year, month, day] = value.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  }

  const getCommittedDateInput = (value: string, fallback: string) =>
      isCompleteDateInput(value) ? value : fallback

  const handleDateRangeInput = (side: 'start' | 'end') => {
      const target = side === 'start' ? dateRangeStart : dateRangeEnd
      target.value = formatDateInputText(target.value)
  }

  const openDatePicker = (side: 'start' | 'end') => {
      const picker = side === 'start' ? dateRangeStartPicker.value : dateRangeEndPicker.value
      if (!picker) return

      const pickerWithShowPicker = picker as HTMLInputElement & { showPicker?: () => void }
      if (pickerWithShowPicker.showPicker) {
          pickerWithShowPicker.showPicker()
          return
      }

      picker.focus()
      picker.click()
  }

  const getDateIndex = (date: string, mode: 'start' | 'end') => {
      const maxIndex = chartDates.value.length - 1
      if (maxIndex < 0 || !date) return mode === 'start' ? 0 : maxIndex

      const exactIndex = chartDates.value.indexOf(date)
      if (exactIndex >= 0) return exactIndex

      if (mode === 'start') {
          const nextIndex = chartDates.value.findIndex(item => item >= date)
          return nextIndex >= 0 ? nextIndex : maxIndex
      }

      for (let index = maxIndex; index >= 0; index--) {
          if (chartDates.value[index] <= date) return index
      }

      return 0
  }

  const applyDateRangeSelection = () => {
      const maxIndex = chartDates.value.length - 1
      if (maxIndex < 0) return

      const committedStartDate = getCommittedDateInput(dateRangeStart.value, chartMinDate.value)
      const committedEndDate = getCommittedDateInput(dateRangeEnd.value, chartMaxDate.value)

      dateRangeStart.value = committedStartDate
      dateRangeEnd.value = committedEndDate

      let startIndex = getDateIndex(committedStartDate, 'start')
      let endIndex = getDateIndex(committedEndDate, 'end')
      if (startIndex > endIndex) {
          if (committedStartDate > committedEndDate) {
              endIndex = startIndex
          } else {
              startIndex = endIndex
          }
      }

      startIndex = clampIndex(startIndex, maxIndex)
      endIndex = clampIndex(endIndex, maxIndex)
      applyChartRange(startIndex, endIndex)
  }

  const updateRangeMetrics = (startIndex: number, endIndex: number) => {
      const selectedPairs = chartDates.value
          .slice(startIndex, endIndex + 1)
          .map((date, index) => ({
              date,
              value: chartStrategyValues.value[startIndex + index]
          }))
          .filter(item => Number.isFinite(item.value))

      const selectedDates = selectedPairs.map(item => item.date)
      const selectedValues = selectedPairs.map(item => item.value)
      const drawdownAnalysis = calculateDrawdownAnalysis(selectedValues, selectedDates)

      backtestPeriodText.value = formatBacktestPeriod(selectedDates)
      strategyStats.value = calculateStats(selectedValues)
      sortinoRatio.value = calculateSortinoRatio(selectedValues)
      monthlyReturns.value = calculateMonthlyReturns(selectedValues, selectedDates)
      monthlySummary.value = calculateMonthlySummary(monthlyReturns.value)
      drawdownDist.value = drawdownAnalysis.distribution
      topDrawdowns.value = drawdownAnalysis.drawdowns
  }

  const applyChartRange = (startIndex: number, endIndex: number, shouldUpdateChart = true) => {
      const maxIndex = chartDates.value.length - 1
      if (maxIndex < 0) return

      const boundedStartIndex = clampIndex(startIndex, maxIndex)
      const boundedEndIndex = clampIndex(Math.max(endIndex, boundedStartIndex), maxIndex)

      dateRangeStart.value = chartDates.value[boundedStartIndex] || ''
      dateRangeEnd.value = chartDates.value[boundedEndIndex] || ''
      updateRangeMetrics(boundedStartIndex, boundedEndIndex)

      if (!myChart || !shouldUpdateChart) return

      const selectedDates = chartDates.value.slice(boundedStartIndex, boundedEndIndex + 1)
      const strategyDisplayData = rebaseSeries(chartStrategyValues.value, boundedStartIndex).slice(
          boundedStartIndex,
          boundedEndIndex + 1
      )
      const benchmarkDisplayData = rebaseSeries(chartBenchmarkValues.value, boundedStartIndex).slice(
          boundedStartIndex,
          boundedEndIndex + 1
      )

      myChart.setOption({
          xAxis: { data: selectedDates },
          yAxis: getAdaptiveYAxisRange(strategyDisplayData, benchmarkDisplayData),
          series: [
              { data: strategyDisplayData },
              { data: benchmarkDisplayData }
          ]
      })
  }

  const initChart = (xAxisData: any, strategyData: any, benchmarkData: any) => {
      if (!chartContainer.value) return
      if (myChart) myChart.dispose()

      chartDates.value = Array.isArray(xAxisData) ? xAxisData : []
      chartStrategyValues.value = toFiniteSeries(strategyData, chartDates.value.length)
      chartBenchmarkValues.value = toFiniteSeries(benchmarkData, chartDates.value.length)
      chartMinDate.value = chartDates.value[0] || ''
      chartMaxDate.value = chartDates.value[chartDates.value.length - 1] || ''

      myChart = echarts.init(chartContainer.value)

      // 模拟 100 个数据点
      const initialStrategyDisplayData = rebaseSeries(chartStrategyValues.value, 0)
      const initialBenchmarkDisplayData = rebaseSeries(chartBenchmarkValues.value, 0)
      const initialYAxisRange = getAdaptiveYAxisRange(initialStrategyDisplayData, initialBenchmarkDisplayData)

      const option = {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis' },
          grid: { top: 52, left: 58, right: 58, bottom: 42, containLabel: true },
          legend: {
              data: ['全天候策略', '沪深300全收益'],
              textStyle: { color: '#b0c4de' },
              top: 0
          },
          xAxis: {
              type: 'category',
              data: xAxisData,
              axisLabel: {
                  color: '#8392A5',
                  hideOverlap: true,
                  showMinLabel: true,
                  showMaxLabel: true
              },
              axisLine: { lineStyle: { color: '#8392A5' } }
          },
          yAxis: {
              type: 'value',
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
              axisLabel: { color: '#8392A5' },
              ...initialYAxisRange,
              scale: true // 不从0开始
          },
          series: [
              {
                  name: '全天候策略',
                  type: 'line',
                  data: initialStrategyDisplayData,
                  itemStyle: { color: '#00aaff' }, // 保持橙色主题
                  showSymbol: false,
                  lineStyle: { width: 3 },
                  smooth: true
              },
              {
                  name: '沪深300全收益',
                  type: 'line',
                  data: initialBenchmarkDisplayData,
                  itemStyle: { color: '#00bcd4' },
                  showSymbol: false,
                  lineStyle: { width: 1, type: 'dashed' },
                  smooth: true
              }
          ]
      }
      myChart.setOption(option)
      applyChartRange(0, chartDates.value.length - 1, false)
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
          answer: '没有绝对的答案。常见的做法是基于时间的（如每季度、每半年或每年）或基于阈值的（当任一资产类别偏离其目标权重超过某个百分比，如30%时）。对于普通投资者，每年检查一次是合理的起点。'
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

  const applyAllWeatherData = (data: any) => {
      const series = prepareStrategySeries(data.dateList, data.strategyData)
      const benchmarkData = Array.isArray(data.hs300) ? data.hs300.slice(0, series.dates.length) : []
      const drawdownAnalysis = calculateDrawdownAnalysis(series.values, series.dates)

      backtestPeriodText.value = formatBacktestPeriod(series.dates)
      strategyStats.value = calculateStats(series.values)
      sortinoRatio.value = calculateSortinoRatio(series.values)
      monthlyReturns.value = calculateMonthlyReturns(series.values, series.dates)
      monthlySummary.value = calculateMonthlySummary(monthlyReturns.value)
      drawdownDist.value = drawdownAnalysis.distribution
      topDrawdowns.value = drawdownAnalysis.drawdowns
      initChart(series.dates, series.values, benchmarkData)
  }

  const getlocalData = async () => {
      isLoading.value = true
      loadError.value = ''
      let resolvedData: any = null

      try {
          try {
              const response: any = await app.callFunction({
                  name: 'getAllWeatherData',
                  data: { action: 'get' }
              })
              const remoteData = response.result?.data
              if (response.result?.success && remoteData?.dateList?.length && remoteData?.strategyData?.length) {
                  resolvedData = remoteData
              }
          } catch (error) {
              console.warn('全天候后端数据读取失败，回退到本地 JSON:', error)
          }

          if (!resolvedData) {
              const res = await axios.get('./static/allWeatherData.json')
              resolvedData = res.data
          }
      } catch (error) {
          console.error('全天候策略数据加载失败:', error)
          loadError.value = '云端与本地备用数据均无法访问，请检查网络后重试。'
      } finally {
          isLoading.value = false
      }

      if (resolvedData) {
          await nextTick()
          applyAllWeatherData(resolvedData)
      }
  }

  // 在组件挂载后，首次初始化图表
  onMounted(() => {
      getlocalData()

      window.addEventListener('resize', () => myChart?.resize())
  })
</script>

<style scoped>
  @keyframes fade-in-up {
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
      padding: 3rem 1rem;
      min-height: 100vh;
      font-family: 'Noto Sans SC', sans-serif;
      color: #fff;

      /* --- REPLACE THE LINE BELOW --- */
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #1a205a, transparent 40%), #121212;
      background-color: #121212;
  }

  .main-container {
      margin: 0 auto;
      max-width: 900px;
  }

  .strategy-loading,
  .strategy-error {
      position: relative;
      display: flex;
      align-items: center;
      overflow: hidden;
      padding: 3.5rem 2rem 3rem;
      min-height: 360px;
      background:
          radial-gradient(circle at 50% 24%, rgb(0 170 255 / 14%), transparent 34%),
          linear-gradient(145deg, rgb(255 255 255 / 6%), rgb(255 255 255 / 2%));
      border: 1px solid rgb(124 201 255 / 16%);
      border-radius: 18px;
      box-shadow: 0 24px 70px rgb(0 0 0 / 20%);
      backdrop-filter: blur(16px);
      flex-direction: column;
      animation: fade-in-up 0.45s ease-out both;
  }

  .strategy-loading::before {
      position: absolute;
      inset: 0;
      background-image:
          linear-gradient(rgb(255 255 255 / 2%) 1px, transparent 1px),
          linear-gradient(90deg, rgb(255 255 255 / 2%) 1px, transparent 1px);
      background-size: 34px 34px;
      content: '';
      mask-image: linear-gradient(to bottom, #000, transparent 78%);
      pointer-events: none;
  }

  .strategy-loading-visual {
      position: relative;
      margin-bottom: 1.6rem;
      width: 132px;
      height: 132px;
  }

  .loading-orbit,
  .loading-core,
  .loading-asset {
      position: absolute;
      display: block;
      border-radius: 50%;
  }

  .loading-orbit {
      inset: 0;
      border: 1px solid rgb(103 198 255 / 20%);
  }

  .loading-orbit::after {
      position: absolute;
      top: -2px;
      left: 50%;
      width: 4px;
      height: 4px;
      background: #7ddcff;
      border-radius: 50%;
      box-shadow: 0 0 12px #0af;
      content: '';
      transform: translateX(-50%);
  }

  .loading-orbit-outer {
      animation: orbit-spin 3.8s linear infinite;
  }

  .loading-orbit-inner {
      inset: 21px;
      border-style: dashed;
      border-color: rgb(77 224 190 / 24%);
      animation: orbit-spin 2.8s linear infinite reverse;
  }

  .loading-core {
      inset: 43px;
      display: grid;
      font-size: 0.78rem;
      color: #e9f8ff;
      background: linear-gradient(145deg, rgb(0 170 255 / 28%), rgb(56 222 189 / 12%));
      border: 1px solid rgb(123 221 255 / 42%);
      font-weight: 700;
      letter-spacing: 0.12em;
      box-shadow: 0 0 32px rgb(0 170 255 / 18%), inset 0 0 16px rgb(255 255 255 / 6%);
      place-items: center;
  }

  .loading-asset {
      width: 9px;
      height: 9px;
      box-shadow: 0 0 14px currentcolor;
  }

  .loading-asset-stock {
      top: 18px;
      right: 18px;
      color: #53d4ff;
      background: currentcolor;
      animation: asset-pulse 1.6s ease-in-out infinite;
  }

  .loading-asset-bond {
      right: 12px;
      bottom: 26px;
      color: #52e3bd;
      background: currentcolor;
      animation: asset-pulse 1.6s 0.35s ease-in-out infinite;
  }

  .loading-asset-gold {
      bottom: 12px;
      left: 30px;
      color: #ffd166;
      background: currentcolor;
      animation: asset-pulse 1.6s 0.7s ease-in-out infinite;
  }

  .loading-asset-cash {
      top: 38px;
      left: 8px;
      color: #9ca9ff;
      background: currentcolor;
      animation: asset-pulse 1.6s 1.05s ease-in-out infinite;
  }

  .strategy-loading-title,
  .strategy-error-title {
      z-index: 1;
      margin: 0 0 0.55rem;
      font-size: 1.25rem;
      color: #f4f9ff;
      font-weight: 600;
      letter-spacing: 0.03em;
  }

  .strategy-loading-description,
  .strategy-error-description {
      z-index: 1;
      margin: 0;
      font-size: 0.9rem;
      color: #8fa8c3;
  }

  .loading-progress {
      z-index: 1;
      overflow: hidden;
      margin-top: 1.8rem;
      width: min(280px, 72vw);
      height: 3px;
      background: rgb(255 255 255 / 7%);
      border-radius: 999px;
  }

  .loading-progress span {
      display: block;
      width: 42%;
      height: 100%;
      background: linear-gradient(90deg, transparent, #0af 42%, #52e3bd 70%, transparent);
      border-radius: inherit;
      animation: loading-sweep 1.8s ease-in-out infinite;
  }

  .loading-steps {
      z-index: 1;
      display: flex;
      justify-content: space-between;
      margin-top: 0.75rem;
      width: min(280px, 72vw);
      font-size: 0.7rem;
      color: #62778e;
      letter-spacing: 0.04em;
  }

  .strategy-error {
      justify-content: center;
  }

  .strategy-error-icon {
      display: grid;
      margin-bottom: 1.25rem;
      width: 54px;
      height: 54px;
      font-size: 1.4rem;
      color: #ffd166;
      background: rgb(255 209 102 / 9%);
      border: 1px solid rgb(255 209 102 / 32%);
      border-radius: 50%;
      place-items: center;
  }

  .strategy-retry-button {
      padding: 0.65rem 1.3rem;
      margin-top: 1.5rem;
      font: inherit;
      color: #e9f8ff;
      background: rgb(0 170 255 / 16%);
      border: 1px solid rgb(0 170 255 / 45%);
      border-radius: 8px;
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
      cursor: pointer;
  }

  .strategy-retry-button:hover {
      background: rgb(0 170 255 / 26%);
      border-color: #0af;
      transform: translateY(-1px);
  }

  @keyframes orbit-spin {
      to {
          transform: rotate(360deg);
      }
  }

  @keyframes asset-pulse {
      0%,
      100% {
          opacity: 0.45;
          transform: scale(0.75);
      }

      50% {
          opacity: 1;
          transform: scale(1);
      }
  }

  @keyframes loading-sweep {
      from {
          transform: translateX(-110%);
      }

      to {
          transform: translateX(340%);
      }
  }

  @media (prefers-reduced-motion: reduce) {
      .loading-orbit,
      .loading-asset,
      .loading-progress span {
          animation-duration: 4s;
      }
  }

  /* 页面头部 */
  .page-header {
      margin-bottom: 3rem;
      text-align: center;
      opacity: 0;
      animation: fade-in-up 0.5s ease-out forwards;
  }

  .back-button {
      display: inline-block;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      text-decoration: none;
      color: #b0c4de;
      transition: color 0.3s ease;
  }

  .back-button:hover {
      color: #0af;
  }

  .main-title {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 2.5rem;
      color: #fff;
      font-weight: 700;
      gap: 1rem;
  }

  .title-icon {
      font-size: 2.8rem;
      color: #0af;
      text-shadow: 0 0 15px #0af;
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
      /* 1. 改变布局模式为 flex，这是让内部元素正确表现的关键 */
      display: flex;
      padding: 1.5rem 2rem;

      /* 2. 这是最重要的“必杀技”，它确保卡片自身不会被内容撑开 */
      min-width: 0;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 12px;
      opacity: 0;
      transition: border-color 0.3s ease;
      backdrop-filter: blur(10px);
      flex-direction: column; /* 让卡片内部的 h2, p, table 等元素垂直排列 */
      animation: fade-in-up 0.5s ease-out forwards;
  }

  .content-card:hover {
      border-color: rgb(0 170 255 / 50%);
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
      padding-left: 1rem;
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.4rem;
      color: #fff;
      font-weight: bold;
      border-left: 4px solid #0af;
  }

  /* 用于包含切换按钮的卡片头部 */
  .card-header-with-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
  }

  .card-title.no-border {
      border-left: none;
      padding-left: 0;
      margin-bottom: 0;
  }

  /* 视图切换按钮容器和按钮样式 */
  .view-toggle-container {
      display: flex;
      padding: 4px;
      background-color: rgb(0 0 0 / 20%);
      border-radius: 8px;
  }

  .toggle-button {
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      color: #b0c4de;
      background: transparent;
      border: none;
      border-radius: 6px;
      transition: all 0.3s ease;
      cursor: pointer;
  }

  .toggle-button.active {
      color: #fff;
      background-color: #0af;
      box-shadow: 0 0 10px rgb(0 170 255 / 50%);
      font-weight: bold;
  }

  .card-description {
      margin-bottom: 1rem;
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  .chart-range-picker {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 0.45rem;
      flex-wrap: wrap;
  }

  .range-separator {
      font-size: 0.9rem;
      color: #8392a5;
  }

  .range-date-field {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 110px;
      height: 32px;
      flex: 0 0 auto;
  }

  .range-date-input {
      box-sizing: border-box;
      width: 100%;
      height: 32px;
      padding: 0 0rem 0 0.7rem;
      font-size: 0.82rem;
      font-family: inherit;
      line-height: 32px;
      color: #d8e8ff;
      background: rgb(0 0 0 / 28%);
      border: 1px solid rgb(176 196 222 / 24%);
      border-radius: 6px;
      outline: none;
      font-variant-numeric: tabular-nums;
  }

  .range-date-input:focus {
      border-color: #0af;
      box-shadow: 0 0 0 2px rgb(0 170 255 / 16%);
  }

  .range-date-button {
      position: absolute;
      top: 50%;
      right: 6px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      padding: 0;
      width: 20px;
      height: 20px;
      color: #b7c9e0;
      background: transparent;
      border: 0;
      border-radius: 4px;
      transform: translateY(-50%);
      cursor: pointer;
  }

  .range-date-button:hover {
      color: #fff;
      background: rgb(255 255 255 / 8%);
  }

  .range-calendar-icon {
      position: relative;
      display: block;
      width: 14px;
      height: 14px;
      border: 1.5px solid currentColor;
      border-radius: 3px;
      box-sizing: border-box;
  }

  .range-calendar-icon::before {
      content: '';
      position: absolute;
      top: 3px;
      left: 0;
      width: 100%;
      border-top: 1.5px solid currentColor;
  }

  .range-calendar-icon::after {
      content: '';
      position: absolute;
      top: -3px;
      left: 3px;
      width: 6px;
      height: 4px;
      border-right: 1.5px solid currentColor;
      border-left: 1.5px solid currentColor;
  }

  .native-date-input {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
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
      border-bottom: 1px solid rgb(255 255 255 / 10%);
      margin-bottom: 1.5rem;
  }

  .tab-button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      color: #b0c4de;
      background: transparent;
      border: none;
      transition: all 0.3s ease;
      cursor: pointer;
      border-bottom: 3px solid transparent;
  }

  .tab-button.active {
      color: #fff;
      border-bottom-color: #0af;
      font-weight: bold;
  }

  .tab-button:hover:not(.active) {
      background-color: rgb(255 255 255 / 10%);
  }

  /* 表格样式 */
  .portfolio-table {
      margin-top: 1rem;
      width: 100%;
      border-collapse: collapse;
  }

  .portfolio-table th,
  .portfolio-table td {
      padding: 0.8rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgb(255 255 255 / 10%);
  }

  .portfolio-table th {
      font-size: 0.9rem;
      color: #fff;
      font-weight: bold;
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
      white-space: nowrap;
      border: 1px solid rgb(255 255 255 / 10%);
  }

  .performance-data-table th {
      color: #fff;
      background-color: rgb(0 170 255 / 10%);
      font-weight: bold;
  }

  .performance-data-table tbody tr:nth-child(even) {
      background-color: rgb(255 255 255 / 3%);
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
      background-color: rgb(0 170 255 / 8%);
  }

  .performance-data-table tfoot tr {
      background-color: rgb(0 0 0 / 25%);
      font-weight: bold;
  }

  .performance-data-table tfoot td {
      color: #fff;
  }

  .backtest-notes {
      padding: 1.25rem;
      margin-top: 1.5rem;
      background: rgb(0 0 0 / 20%);
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
      font-size: 0.9rem;
      color: #b0c4de;
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
      display: flex;
      justify-content: center;
      width: 100%;
  }

  .rebalance-cta {
      padding: 0.8rem 2rem;
      margin-top: 1rem;
      font-size: 1.1rem;
      color: #fff;
      background-color: #0af;
      border: none;
      border-radius: 8px;
      box-shadow: 0 0 15px rgb(0 170 255 / 30%);
      transition: all 0.3s ease;
      font-weight: bold;
      cursor: pointer;
  }

  .rebalance-cta:hover {
      text-decoration: none;
      box-shadow: 0 4px 20px rgb(0 170 255 / 50%);
      transform: translateY(-3px);
  }

  /* FAQ 样式 */
  .faq-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }

  .faq-item {
      border-bottom: 1px solid rgb(255 255 255 / 10%);
  }

  .faq-item:last-child {
      border-bottom: none;
  }

  .faq-question {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      width: 100%;
      font-size: 1rem;
      text-align: left;
      color: #fff;
      background: none;
      border: none;
      cursor: pointer;
  }

  .faq-icon {
      font-size: 1.5rem;
      color: #0af;
      transition: transform 0.3s ease;
      font-weight: bold;
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
      margin-top: 1rem;
      width: 100%;
      height: 350px;
  }

  .stats-bar {
      display: grid;
      padding: 1rem;
      margin-top: 1rem;
      text-align: center;
      background: rgb(0 0 0 / 20%);
      border-radius: 8px;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
  }

  .stat-label {
      margin-bottom: 0.3rem;
      font-size: 0.8rem;
      color: #8392a5;
  }

  .stat-value {
      font-size: 1.1rem;
      font-weight: bold;
      color: #fff;
  }

  .stat-value.highlight {
      color: #0af; /* 重点高亮色 */
  }

  .stat-value.negative {
      color: #00c497; /* 绿色代表回撤/跌 */
  }

  /* 2. 热力图 (Heatmap) */
  .heatmap-container {
      overflow-x: auto;
  }

  .heatmap-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      min-width: 800px; /* 确保在手机上可以横向滚动 */
  }

  .heatmap-table th {
      padding: 0.8rem 0.2rem;
      font-size: 0.85rem;
      white-space: nowrap;
      color: #fff;
      border: 1px solid rgb(255 255 255 / 10%);
  }

  .heatmap-table td {
      padding: 0.6rem 0.2rem;
      font-size: 0.85rem;
      text-align: center;
      border: 1px solid rgb(255 255 255 / 10%);
  }

  .year-col {
      font-weight: bold;
      background: rgb(255 255 255 / 2%);
  }

  .year-total {
      font-weight: bold;
      color: #fff;
  }

  /* 3. 风险分析网格 (Risk Grid) */
  .risk-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
  }

  .risk-box {
      padding: 1.5rem 1rem;
      text-align: center;
      background: rgb(255 255 255 / 3%);
      border: 1px solid rgb(255 255 255 / 5%);
      border-radius: 8px;
  }

  .risk-label {
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      color: #8392a5;
  }

  .risk-main-val {
      margin-bottom: 0.3rem;
      font-size: 1.4rem;
      color: #0af;
      font-weight: bold;
  }

  .risk-sub-val {
      font-size: 0.8rem;
      color: #b0c4de;
  }

  /* 4. 分布图与风险表 */
  .sub-title {
      margin-bottom: 1.2rem;
      font-size: 1.1rem;
      color: #fff;
      font-weight: bold;
  }

  .dist-table-container {
      overflow-x: auto;
      margin-bottom: 1.5rem;
  }

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
      padding: 0.5rem;
      font-size: 0.8rem;
      text-align: center;
      color: #8392a5;
      flex: 1;
      border-right: 1px solid rgb(255 255 255 / 5%);
  }

  .dist-bar-row {
      align-items: center;
      height: 40px;
      background: rgb(0 0 0 / 20%);
  }

  .dist-block.teal-theme {
      padding: 0.3rem 0;
      margin: 0 4px;
      color: #fff;
      background: linear-gradient(145deg, #3a7593, #0af);
      border-radius: 4px;
      font-weight: bold;
  }

  .risk-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 700px;
  }

  .risk-table th {
      padding: 0.8rem;
      text-align: center;
      white-space: nowrap;
      color: #fff;
      background: rgb(0 0 0 / 20%);
      border: 1px solid rgb(255 255 255 / 10%);
      font-weight: bold;
  }

  .risk-table td {
      padding: 0.8rem;
      font-size: 0.9rem;
      text-align: center;
      white-space: nowrap;
      color: #b0c4de;
      border: 1px solid rgb(255 255 255 / 10%);
  }

  .risk-table .negative {
      color: #00c497;
  }

  .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
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
          display: block; /* 使其成为块级元素，更易点击 */
          margin-bottom: 1.5rem;
          font-size: 1rem;
          font-weight: 500;
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
          padding-left: 0.8rem;
          font-size: 1.25rem;
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
          width: 100%;
          min-width: 600px; /* 根据内容设定一个合理的最小宽度 */
      }

      /* 优化滚动条样式 */
      .tab-content::-webkit-scrollbar,
      .table-container::-webkit-scrollbar {
          height: 6px;
      }

      .tab-content::-webkit-scrollbar-thumb,
      .table-container::-webkit-scrollbar-thumb {
          background: #0af;
          border-radius: 3px;
      }

      /* --- 其他元素适配 --- */
      .tabs-container {
          width: 100%;
      }

      .tab-button {
          padding: 0.75rem 0.5rem;
          font-size: 0.9rem;
          text-align: center;
          flex: 1;
      }

      .rebalance-cta-box {
          margin-top: 1rem;
      }

      .rebalance-cta {
          display: block;
          width: 100%;
          text-align: center;
      }

      .stats-bar {
          grid-template-columns: repeat(2, 1fr); /* 手机上两列显示 */
      }

      .risk-summary-grid {
          grid-template-columns: 1fr; /* 手机上单列显示 */
          gap: 1rem;
      }

      .card-header-row {
          flex-direction: column;
          align-items: flex-start;
      }

      .card-title.no-margin {
          margin-bottom: 0.5rem;
      }

      .chart-range-picker {
          justify-content: flex-start;
          width: 100%;
      }

      .range-date-field {
          width: 110px;
      }
  }
</style>
