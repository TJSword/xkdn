<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>
        <h1 class="main-title">
          <span class="title-icon">🔄</span>
          可转债策略
        </h1>
        <p class="subtitle">
          量化驱动，每日择优，追求复利增长的艺术。
        </p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 策略简介 -->
        <div class="content-card">
          <h2 class="card-title">策略简介</h2>
          <p class="card-description">
            本策略基于多因子量化模型（如估值、动量、基本面等多维因子）为核心，每日筛选并轮动交易具备高性价比的可转债组合。我们摒弃主观预测，严格执行纪律，旨在动态捕捉市场短期价值机会，力求实现稳健的复利增长。
          </p>
        </div>

        <!-- 新增：转债市场概览 -->
        <div class="content-card">
          <h2 class="card-title">转债市场概览</h2>
          <p class="card-description">
            以下为截至 <strong>{{ marketTimestamp }}</strong> 的全市场可转债核心数据，反映当前市场温度。
          </p>

          <!-- 核心指标 -->
          <div class="market-stats-grid">
            <div class="stat-item">
              <div class="stat-value">
                {{ marketData.equal_weight_index.toFixed(2) }}
                <span :class="['stat-change', marketData.equal_weight_change_pct < 0 ? 'positive' : 'negative']">
                  {{ formattedChangePct }}
                </span>
              </div>
              <div class="stat-label">可转债等权指数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ marketData.median_price.toFixed(2) }}</div>
              <div class="stat-label">价格中位数</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ (marketData.median_premium_rate * 100).toFixed(2) }}%</div>
              <div class="stat-label">溢价率中位数</div>
            </div>
          </div>

          <!-- 价格分布 -->
          <h3 class="card-subtitle">价格分布情况 (只)</h3>
          <div class="price-dist-grid">
            <div class="dist-item">
              <div class="dist-count">{{ marketData.price_distribution.lt_90 }}</div>
              <div class="dist-range">&lt; 90元</div>
            </div>
            <div class="dist-item">
              <div class="dist-count">{{ marketData.price_distribution.btw_90_100 }}</div>
              <div class="dist-range">90 ~ 100元</div>
            </div>
            <div class="dist-item">
              <div class="dist-count">{{ marketData.price_distribution.btw_100_110 }}</div>
              <div class="dist-range">100 ~ 110元</div>
            </div>
            <div class="dist-item">
              <div class="dist-count">{{ marketData.price_distribution.btw_110_120 }}</div>
              <div class="dist-range">110 ~ 120元</div>
            </div>
            <div class="dist-item">
              <div class="dist-count">{{ marketData.price_distribution.btw_120_130 }}</div>
              <div class="dist-range">120 ~ 130元</div>
            </div>
            <div class="dist-item">
              <div class="dist-count">{{ marketData.price_distribution.gt_130 }}</div>
              <div class="dist-range">&gt; 130元</div>
            </div>
          </div>
        </div>

        <!-- 组合思想 -->
        <div class="content-card">
          <h2 class="card-title">组合思想：流水不腐，动态寻优</h2>
          <p class="card-description">
            我们不信奉“一劳永逸”的买入持有。本策略的精髓在于“流水不腐”：我们认为市场的价值是流动的，真正的复利来自于不断地将资金配置到当下最具性价比的资产上。因此，高频轮动并非盲目交易，而是保证组合始终处于动态最优状态的纪律化手段。
          </p>
          <ul class="idea-list">
            <li><b>多因子量化：</b> 综合考量低估值、高弹性、强基本面等多维因子进行筛选，构建具备高性价比和强向上弹性的初始投资池。</li>
            <li><b>每日轮动：</b> 模型于每个交易日下午2:40重新评估全市场可转债，卖出价值减弱的品种，换入新的价值洼地。</li>
            <li><b>纪律执行：</b> 严格遵循模型信号进行交易，完全摒除人性中的贪婪与恐惧。追求长期稳健的复利增长。</li>
            <li><b>风险分散：</b> 始终保持持有5只不同可转债的组合，有效分散单一公司的基本面风险和流动性风险。</li>
          </ul>
        </div>

        <!-- 核心指标解读 -->
        <div class="content-card">
          <h2 class="card-title">核心指标解读</h2>
          <p class="card-description">投资可转债需要关注几个核心指标，它们共同决定了一只转债的投资价值。</p>
          <table class="data-table">
            <thead>
              <tr>
                <th>指标名称</th>
                <th>解读</th>
                <th>我们的偏好</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>转债价格</td>
                <td>当前市场交易价格。价格越低，安全垫越厚。</td>
                <td><span class="valuation-badge low">越低越好 </span>
                </td>
              </tr>
              <tr>
                <td>转股溢价率</td>
                <td>转债价格相比其转换后股票价值高出的百分比。</td>
                <td><span class="valuation-badge low">越低越好 </span>
                </td>
              </tr>
              <tr>
                <td>债券余额</td>
                <td>尚未转股的债券规模。规模太小可能流动性差。</td>
                <td><span class="valuation-badge reasonable">> 1亿</span></td>
              </tr>
              <!-- <tr>
                <td>到期收益率 (YTM)</td>
                <td>持有至到期能获得的年化收益率，是最终的兜底保障。</td>
                <td><span class="valuation-badge reasonable">越高越好 (正数)</span></td>
              </tr> -->

            </tbody>
          </table>
        </div>

        <div class="content-card">
          <h2 class="card-title">最新持仓与调仓建议</h2>
          <p class="card-description">
            根据模型于 {{ formattedDate }} 14:40 生成的最新组合与操作建议。请结合自身情况参考。
          </p>

          <!-- 最新持仓组合 -->
          <h3 class="card-subtitle">最新持仓组合 ({{ strategyData?.latest_portfolio.length }}只)</h3>
          <div class="table-wrapper">
            <table class="data-table portfolio-table">
              <thead>
                <tr>
                  <th>代码</th>
                  <th>名称</th>
                  <th>价格</th>
                  <th>溢价率</th>
                  <th>剩余规模(亿)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in strategyData.latest_portfolio" :key="item.code">
                  <td>{{ item.code }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ parseFloat(item.price).toFixed(2) }}</td>
                  <td>{{ (parseFloat(item.premium) * 100).toFixed(2) }}%</td>
                  <td>{{ parseFloat(item.scale).toFixed(2) }}</td>
                </tr>
                <tr v-if="portfolioAverages" class="summary-row">
                  <td style="color: #add8e6; font-weight: bold;">
                    &ensp; &ensp;--
                  </td>
                  <td style="color: #add8e6; font-weight: bold;">
                    组合均值
                  </td>
                  <td style="color: #fff; font-weight: bold;">
                    {{ portfolioAverages.price }}
                  </td>
                  <td style="color: #fff; font-weight: bold;">
                    {{ portfolioAverages.prem }}
                  </td>
                  <td style="color: #fff; font-weight: bold;">
                    {{ portfolioAverages.size }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 当日调仓 (移到下方) -->
          <h3 class="card-subtitle">组合调仓指引</h3>
          <div class="adjustments-grid">
            <div class="adjustment-block">
              <h4 class="adjustment-title sell">⬇️ 建议调出</h4>
              <ul class="adjustment-list">
                <li v-for="item in sellList" :key="item.code" class="adjustment-item">
                  <span>{{ item.name }} ({{ item.code }})</span>
                  <span class="action-badge sell">{{ item.action }}</span>
                </li>
                <li v-if="sellList.length == 0" class="adjustment-item-empty">今日无调出建议</li>
              </ul>
            </div>
            <div class="adjustment-block">
              <h4 class="adjustment-title buy">⬆️ 建议调入</h4>
              <ul class="adjustment-list">
                <li v-for="item in buyList" :key="item.code" class="adjustment-item">
                  <span>{{ item.name }} ({{ item.code }})</span>
                  <span class="action-badge buy">{{ item.action }}</span>
                </li>
                <li v-if="buyList.length === 0" class="adjustment-item-empty">今日无调入建议</li>
              </ul>
            </div>

          </div>
        </div>

        <div class="content-card">
          <div class="card-header-row">
            <h2 class="card-title no-margin">可转债策略 vs 可转债等权指数</h2>
            <span class="period-badge">回测周期: 2018-01-02 至 2025-12-31</span>
          </div>

          <div ref="chartContainer" class="echart-container"></div>

          <div class="stats-bar">
            <div class="stat-item">
              <div class="stat-label">总收益</div>
              <div class="stat-value-small highlight">1421.14%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">年化收益</div>
              <div class="stat-value-small">41.97%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">波动率</div>
              <div class="stat-value-small">15.91%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">夏普比率</div>
              <div class="stat-value-small">2.512</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">最大回撤</div>
              <div class="stat-value-small negative">-25.25%</div>
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
              <div class="risk-main-val">1.662</div>
              <div class="risk-sub-val">年化收益 / 最大回撤</div>
            </div>
            <div class="risk-box">
              <div class="risk-label">盈利 / 总月数</div>
              <div class="risk-main-val"> 73 / 96</div>
              <div class="risk-sub-val">月度胜率: 76.0%</div>
            </div>
            <div class="risk-box">
              <div class="risk-label">索提诺比率</div>
              <div class="risk-main-val">3.329</div>
              <div class="risk-sub-val">反映策略的抗跌能力</div>
            </div>
          </div>

          <h3 class="card-subtitle" style="margin-top: 0;">回撤深度分布 (频率统计)</h3>
          <div class="table-container dist-table-container">
            <div class="dist-table-inner">
              <div class="dist-header-row">
                <div class="dist-col" v-for="item in drawdownDist" :key="item.range">{{ item.range }}</div>
              </div>
              <div class="dist-bar-row">
                <div class="dist-col" v-for="item in drawdownDist" :key="item.range">
                  <div class="dist-block blue-theme" :style="{ opacity: item.count > 0 ? 1 : 0.6 }">
                    {{ item.count }}
                  </div>
                </div>
              </div>
              <div class="dist-label-row">
                <div class="dist-col">次数</div>
              </div>
            </div>
          </div>

          <h3 class="card-subtitle">历史重大回撤明细 (Top 10)</h3>
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
  import { ref, onMounted, watch, computed } from 'vue'
  import * as echarts from 'echarts'
  import app, { auth } from '@/lib/cloudbase'
  import axios from 'axios'
  const getStrategyData = () => {
      app.callFunction({
          name: 'getBondPortfolio',
          parse: true
      }).then((res: any) => {
          // 直接使用从云函数返回的结果
          strategyData.value = res.result
      })
  }

  // --- 策略持仓与调仓数据 ---
  const strategyData: any = ref({
      adjustments: [],
      latest_portfolio: [],
      market_overview: {
          // 初始化市场概览数据结构
          equal_weight_index: 0,
          equal_weight_change_pct: 0,
          median_price: 0,
          median_premium_rate: 0,
          price_distribution: {
              lt_90: 0,
              btw_90_100: 0,
              btw_100_110: 0,
              btw_110_120: 0,
              btw_120_130: 0,
              gt_130: 0
          }
      }
  })
  getStrategyData()
  const formattedDate = computed(() => {
      const dateStr = strategyData.value.latest_date
      if (!dateStr || dateStr.length !== 8) return dateStr
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
  })
  const marketTimestamp = computed(() => {
      return strategyData.value.market_data_timestamp || '获取中...'
  })
  // --- 新增：处理市场概览数据的计算属性 ---
  const marketData = computed(() => {
      // 提供默认值，防止数据加载完成前模板渲染出错
      return (
          strategyData.value.market_overview || {
              equal_weight_index: 0,
              equal_weight_change_pct: 0,
              median_price: 0,
              median_premium_rate: 0,
              price_distribution: {
                  lt_90: 0,
                  btw_90_100: 0,
                  btw_100_110: 0,
                  btw_110_120: 0,
                  btw_120_130: 0,
                  gt_130: 0
              }
          }
      )
  })

  const formattedChangePct = computed(() => {
      const pct = marketData.value.equal_weight_change_pct * 100
      const sign = pct > 0 ? '+' : ''
      return `${sign}${pct.toFixed(2)}%`
  })

  const buyList = computed(() =>
      strategyData.value.adjustments.filter((item: any) => item.action === '调入')
  )
  const sellList = computed(() =>
      strategyData.value.adjustments.filter((item: any) => item.action === '调出')
  )

  // --- 新增：计算持仓组合的平均值 ---
  const portfolioAverages = computed(() => {
      const list = strategyData.value?.latest_portfolio || []
      if (list.length === 0) return null

      let totalClose = 0
      let totalPrem = 0
      let totalSize = 0

      list.forEach((item: any) => {
          totalClose += parseFloat(item.price)
          totalPrem += parseFloat(item.premium)
          totalSize += parseFloat(item.scale)
      })

      const count = list.length

      return {
          price: (totalClose / count).toFixed(2),
          // 溢价率原始数据是小数 (如 0.25)，显示时需要 * 100
          prem: ((totalPrem / count) * 100).toFixed(2) + '%',
          // 规模也可以算平均值
          size: (totalSize / count).toFixed(2)
      }
  })

  // --- 控制FAQ展开 ---
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }

  const faqList = ref([
      {
          question: '我如何才能参与“可转债策略”？',
          answer: `我们所有的策略操作，都在交易日的下午2:40之后执行，以贴近收盘价，确保操作的有效性。\n
                                                                                                                                                                                                                首次参与\n
                                                                                                                                                                                                                如果您是第一次参与本策略，请根据最新持仓列表，然后将您计划投入的资金，对列表中的所有品种进行等权重买入，即可完成初始建仓。\n
                                                                                                                                                                                                                后续调仓\n
                                                                                                                                                                                                                完成建仓后，您无需进行任何复杂的分析。每个交易日，您只需严格遵循我们发布的组合调仓指引进行操作即可。该指引会直接、明确地列出当天需要卖出和买入的具体品种。
                                                                                                                                                                                                                \n参与前提：\n
                                                                                                                                                                                              在进行任何交易前，请务必确保您的A股证券账户已成功开通“可转换债券”的交易权限（通常要求2年交易经验及连续20日日均10万资产）。详情请咨询您的开户券商。`
      },
      {
          question: '可转债是什么？它为什么适合普通人投资？',
          answer: '可转债是上市公司发行的一种特殊债券。您可以将其理解为一张“附带股票期权的借条”。\n\n   债性（保底）： 作为债券，它承诺到期归还本金并支付利息，提供了基础的安全性。\n   股性（增值）： 它允许持有者在特定条件下，按约定价格（转股价）将其转换为公司股票，从而在公司股价上涨时享受收益。\n\n正是这种“下有保底，上不封顶”的特性，使其成为一种攻守兼备、非常适合普通投资者入门的品种。'
      },
      {
          question: '投资可转债需要了解哪些核心规则？',
          answer: '理解可转债的四个核心条款至关重要，它们决定了可转债的价值变化：\n \n1.  转股价： 决定一张可转债能换多少股股票（换股数量 = 100 / 转股价）。\n \n2.  下修条款： 当股价长期低于转股价时，公司有权下调转股价，以提高转股吸引力。这对投资者是利好。\n \n3.  强赎条款： 当股价长期高于转股价一定幅度（通常是130%）时，公司有权以较低价格（如103元）强制赎回。这是为了“逼迫”投资者转股或卖出，是重要的获利了结信号。\n \n4.  回售条款： 当股价长期低于转股价一定幅度（通常是70%）时，投资者有权以约定价格（如101-103元）将可转债卖还给公司。这是保护投资者的最后一道防线。'
      },
      {
          question: '什么是“转股溢价率”？为什么它很重要？',
          answer: '转股溢价率是衡量可转债价格相对于其内在股票价值高出多少的指标。\n\n公式： 转股溢价率 = (转债价格 - 转股价值) / 转股价值 * 100%\n\n   溢价率越低： 说明转债价格与其股票价值越接近，股性越强，正股上涨时跟涨能力也越强。\n   溢价率越高： 说明转债价格中“债性”和“期权”的成分更多，股性越弱，受正股影响较小，相对更抗跌。\n\n本策略的重要因子之一就是寻找低溢价率的品种，以期获得更高的上涨弹性。'
      },
      {
          question: '投资可转债可能面临哪些主要风险？',
          answer: '主要有以下两类风险：\n\n1.  违约风险： 发行公司基本面恶化，无力偿还本金和利息。通常选择高评级（如AA级及以上）的可转债并进行分散投资，可以有效降低此风险。\n\n2.  机会成本风险： 如果持有至到期，可转债的票面利率通常很低，收益可能跑不赢通胀。本策略通过积极的轮动交易，旨在避免这种情况，追求更高的超额收益。'
      },
      {
          question: '可转债数据的参考日期有什么讲究吗？',
          answer: '2022年8月之后，可转债市场实施了新规（增设了涨跌幅限制和异常波动停牌机制等），市场生态和交易逻辑发生了一定变化。因此，在评估策略和参考历史回测数据时，建议重点参考2022年8月新规实施之后的数据表现，这会更贴近当前真实的市场环境。'
      }
  ])

  // 1. 热力图数据 (模拟)
  const monthlyReturns: any = ref([])
  const generateMockHeatmap = () => {
      // 模拟转债策略数据：收益比纯债高，比股票稳
      monthlyReturns.value = [
    {
        "year": 2025,
        "months": [
            "2.37",
            "8.19",
            "1.97",
            "1.81",
            "3.13",
            "5.12",
            "5.37",
            "3.03",
            "3.82",
            "-0.53",
            "-0.70",
            "2.53"
        ],
        "total": "42.28"
    },
    {
        "year": 2024,
        "months": [
            "-4.81",
            "3.86",
            "2.12",
            "5.56",
            "1.55",
            "-2.32",
            "-3.28",
            "2.80",
            "12.62",
            "12.61",
            "8.62",
            "6.18"
        ],
        "total": "53.74"
    },
    {
        "year": 2023,
        "months": [
            "7.98",
            "2.58",
            "5.26",
            "1.01",
            "0.15",
            "5.17",
            "5.82",
            "4.17",
            "2.11",
            "3.69",
            "2.57",
            "-0.80"
        ],
        "total": "47.31"
    },
    {
        "year": 2022,
        "months": [
            "5.40",
            "5.32",
            "1.20",
            "-1.31",
            "9.97",
            "4.57",
            "6.13",
            "1.98",
            "-5.19",
            "4.47",
            "8.59",
            "0.11"
        ],
        "total": "48.58"
    },
    {
        "year": 2021,
        "months": [
            "1.30",
            "-1.12",
            "5.02",
            "5.00",
            "9.31",
            "5.34",
            "6.06",
            "9.19",
            "1.86",
            "0.53",
            "11.04",
            "0.47"
        ],
        "total": "68.26"
    },
    {
        "year": 2020,
        "months": [
            "7.95",
            "11.34",
            "13.65",
            "3.65",
            "-4.34",
            "2.00",
            "11.40",
            "5.87",
            "-4.72",
            "12.20",
            "2.52",
            "-2.83"
        ],
        "total": "73.51"
    },
    {
        "year": 2019,
        "months": [
            "4.85",
            "11.85",
            "8.04",
            "-2.83",
            "-2.41",
            "0.50",
            "3.60",
            "1.73",
            "0.29",
            "0.05",
            "1.27",
            "5.36"
        ],
        "total": "36.25"
    },
    {
        "year": 2018,
        "months": [
            "3.11",
            "-1.01",
            "-0.57",
            "-1.19",
            "-4.04",
            "-6.60",
            "2.23",
            "-5.08",
            "-3.33",
            "-5.04",
            "2.00",
            "-2.24"
        ],
        "total": "-20.17"
    }
]
  }

  // 热力图样式：使用红绿配色，但透明度逻辑保持一致
  const getHeatmapStyle = (value: number | null) => {
      if (value === null || value === undefined) return {}
      if (value === 0) return { backgroundColor: 'transparent' }
      if (value > 0) {
          const opacity = Math.min(Math.abs(value) / 8, 1)
          return {
              backgroundColor: `rgba(217, 83, 79, ${0.15 + opacity * 0.7})`, // 红色
              color: '#fff',
              fontWeight: value > 5 ? 'bold' : 'normal'
          }
      } else {
          const opacity = Math.min(Math.abs(value) / 8, 1)
          return {
              backgroundColor: `rgba(92, 184, 92, ${0.15 + opacity * 0.7})`, // 绿色
              color: '#fff',
              fontWeight: value < -5 ? 'bold' : 'normal'
          }
      }
  }

  // 2. 风险分布数据 (模拟)
  const drawdownDist = ref([
      { range: '0% ~ 5%', count: 148 },
      { range: '5% ~ 10%', count: 12 },
      { range: '10% ~ 15%', count: 3 },
      { range: '15% ~ 20%', count: 1 },
      { range: '> 20%', count: 1 }
  ])

  const topDrawdowns = ref([
    {
        "startDate": "2018-01-26",
        "troughDate": "2018-10-19",
        "endDate": "2019-03-22",
        "drawdown": "-25.25",
        "rawDd": -0.25251556804374237,
        "ddDays": 266,
        "fixDays": 154
    },
    {
        "startDate": "2019-04-08",
        "troughDate": "2019-06-10",
        "endDate": "2019-12-27",
        "drawdown": "-15.96",
        "rawDd": -0.15957221613761255,
        "ddDays": 63,
        "fixDays": 200
    },
    {
        "startDate": "2023-11-21",
        "troughDate": "2024-02-06",
        "endDate": "2024-03-13",
        "drawdown": "-12.50",
        "rawDd": -0.12496884774457628,
        "ddDays": 77,
        "fixDays": 36
    },
    {
        "startDate": "2020-12-09",
        "troughDate": "2021-02-09",
        "endDate": "2021-03-17",
        "drawdown": "-11.65",
        "rawDd": -0.11652803294906229,
        "ddDays": 62,
        "fixDays": 36
    },
    {
        "startDate": "2024-06-13",
        "troughDate": "2024-08-19",
        "endDate": "2024-09-25",
        "drawdown": "-10.25",
        "rawDd": -0.1025148338903492,
        "ddDays": 67,
        "fixDays": 37
    },
    {
        "startDate": "2022-08-24",
        "troughDate": "2022-10-11",
        "endDate": "2022-11-03",
        "drawdown": "-9.08",
        "rawDd": -0.0908165125783221,
        "ddDays": 48,
        "fixDays": 23
    },
    {
        "startDate": "2024-10-09",
        "troughDate": "2024-10-14",
        "endDate": "2024-10-23",
        "drawdown": "-7.42",
        "rawDd": -0.07419853208468223,
        "ddDays": 5,
        "fixDays": 9
    },
    {
        "startDate": "2020-05-11",
        "troughDate": "2020-05-26",
        "endDate": "2020-07-07",
        "drawdown": "-7.29",
        "rawDd": -0.07286739236434338,
        "ddDays": 15,
        "fixDays": 42
    },
    {
        "startDate": "2025-03-19",
        "troughDate": "2025-04-08",
        "endDate": "2025-05-07",
        "drawdown": "-7.03",
        "rawDd": -0.07033586227234062,
        "ddDays": 20,
        "fixDays": 29
    },
    {
        "startDate": "2022-04-07",
        "troughDate": "2022-04-26",
        "endDate": "2022-05-06",
        "drawdown": "-6.84",
        "rawDd": -0.06841103658569997,
        "ddDays": 19,
        "fixDays": 10
    }
])

  // 3. ECharts 图表初始化
  const chartContainer = ref<HTMLElement | null>(null)
  let myChart: echarts.ECharts | null = null

  const initChart = (xAxisData: any, strategyData: any, benchmarkData: any) => {
      if (!chartContainer.value) return
      myChart = echarts.init(chartContainer.value)

      const option = {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis' },
          grid: { top: '10%', left: '3%', right: '4%', bottom: '15%', containLabel: true },
          legend: {
              data: ['可转债策略', '可转债等权指数'],
              textStyle: { color: '#b0c4de' },
              bottom: 0
          },
          xAxis: {
              type: 'category',
              data: xAxisData,
              axisLine: { lineStyle: { color: '#8392A5' } }
          },
          yAxis: {
              type: 'value',
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
              axisLabel: { color: '#8392A5' },
              scale: true
          },
          series: [
              {
                  name: '可转债策略',
                  type: 'line',
                  data: strategyData,
                  // 使用页面主题色 淡蓝色
                  itemStyle: { color: '#add8e6' },
                  showSymbol: false,
                  lineStyle: { width: 2 },
                  areaStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                          { offset: 0, color: 'rgba(173, 216, 230, 0.3)' },
                          { offset: 1, color: 'rgba(173, 216, 230, 0)' }
                      ])
                  }
              },
              {
                  name: '可转债等权指数',
                  type: 'line',
                  data: benchmarkData,
                  itemStyle: { color: '#6c757d' }, // 灰色作为基准
                  showSymbol: false,
                  lineStyle: { width: 1, type: 'dashed' }
              }
          ]
      }
      myChart.setOption(option)
  }

  const getlocalData = () => {
      axios.get('./static/bondData.json').then(res => {
          const data = res.data
          initChart(data.dateList, data.strategyData, data.equalWeight)
      })
  }
  getlocalData()
  onMounted(() => {
      generateMockHeatmap()

      window.addEventListener('resize', () => myChart?.resize())
  })
</script>

<style scoped>
  /* 继承并主题化页面样式 */
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
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      /* 背景渐变使用主题色相关色调 */
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #2a3a4a, transparent 40%), #121212;
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
      color: #add8e6; /* 主题色 */
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
      color: #add8e6; /* 主题色 */
      text-shadow: 0 0 15px #add8e6; /* 主题色 */
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
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }
  .content-card:hover {
      border-color: rgba(173, 216, 230, 0.5); /* 主题色 */
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
  /* 为新增的卡片添加动画延迟 */
  .content-card:nth-child(6) {
      animation-delay: 0.7s;
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #add8e6; /* 主题色 */
      padding-left: 1rem;
  }

  /* 图表卡片样式 */
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
      background-color: #add8e6; /* 主题色 */
      color: #121212; /* 使用深色文字以保证对比度 */
      font-weight: bold;
      box-shadow: 0 0 10px rgba(173, 216, 230, 0.5); /* 主题色 */
  }
  .echart-container {
      width: 100%;
      height: 350px;
      margin-top: 1rem;
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
      color: #add8e6; /* 主题色 */
  }

  /* --- 新增：市场概览卡片样式 --- */
  .market-stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 1.5rem;
  }
  .stat-item {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      padding: 1.2rem 1rem;
      text-align: center;
  }
  .stat-value {
      font-size: 1.7rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap; /* 允许换行 */
  }
  .stat-change {
      font-size: 0.9rem;
      font-weight: bold;
      margin-left: 0.5rem;
  }
  .stat-change.positive {
      color: #5cb85c;
  }
  .stat-change.negative {
      color: #d9534f;
  }
  .stat-label {
      font-size: 0.8rem;
      color: #b0c4de;
      margin-top: 0.5rem;
  }
  .price-dist-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 1rem;
  }
  .dist-item {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
  }
  .dist-count {
      font-size: 1.5rem;
      font-weight: bold;
      color: #fff;
  }
  .dist-range {
      font-size: 0.8rem;
      color: #b0c4de;
      margin-top: 0.25rem;
  }
  /* --- 结束新增样式 --- */

  .card-subtitle {
      font-size: 1.1rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 2rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
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
      color: #5cb85c;
  }
  .adjustment-title.sell {
      color: #d9534f;
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
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: bold;
      color: #fff;
  }
  .action-badge.buy {
      background-color: rgba(92, 184, 92, 0.7);
  }
  .action-badge.sell {
      background-color: rgba(217, 83, 79, 0.7);
  }

  .table-wrapper {
      overflow-x: auto; /* 保证表格在小屏幕上可以滚动 */
  }
  .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0; /* 被 card-subtitle 的 margin-bottom 替代 */
  }
  .data-table.portfolio-table {
      table-layout: fixed;
  }
  .data-table th,
  .data-table td {
      padding: 0.8rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap; /* 防止表格内容换行 */
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

  /* 估值标签样式 (复用) */
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
      color: #add8e6; /* 主题色 */
  }
  .faq-icon.is-open {
      transform: rotate(45deg);
  }
  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  /* ======================================================= */
  /* ========      可转债策略页面移动端适配      ======== */
  /* ======================================================= */

  /* 1. 通用辅助 */
  .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
  }
  .card-title.no-margin {
      margin-bottom: 0;
  }
  .period-badge {
      font-size: 0.8rem;
      color: #8392a5;
      background: rgba(0, 0, 0, 0.3);
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.05);
  }

  /* 2. 统计条 (Stats Bar) */
  .stats-bar {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      background: rgba(0, 0, 0, 0.2);
      margin-top: 1rem;
      padding: 1rem;
      padding-top: 0.6rem;
      border-radius: 8px;
      text-align: center;
      gap: 1rem;
  }
  .stats-bar .stat-item {
      background: transparent;
      padding: 0;
  }
  .stat-label {
      color: #8392a5;
      font-size: 0.8rem;
      margin-bottom: 0.3rem;
  }
  .stat-item .stat-value-small {
      font-size: 1.1rem;
      font-weight: bold;
      /* color: #fff; */
  }
  .stat-item .stat-value-small.highlight {
      color: #add8e6; /* 主题色：淡蓝 */
  }
  .stat-value-small.negative {
      color: #5cb85c; /* 绿色代表回撤 */
  }

  /* 3. 热力图 (Heatmap) */
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
      /* 使用淡蓝色半透明背景作为表头 */
      background: rgba(173, 216, 230, 0.1);
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
  }
  .year-total {
      font-weight: bold;
      color: #fff;
  }

  /* 4. 风险分析网格 (Risk Grid) */
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
      color: #add8e6; /* 主题色：淡蓝 */
      margin-bottom: 0.3rem;
  }
  .risk-sub-val {
      font-size: 0.8rem;
      color: #b0c4de;
  }

  /* 5. 分布图与风险表 */
  .dist-table-container {
      margin-bottom: 1.5rem;
      overflow-x: auto;
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
  /* 蓝色主题的柱状条 */
  .dist-block.blue-theme {
      background: linear-gradient(145deg, #5bc0de, #add8e6);
      color: #121212; /* 浅色背景用深色字 */
      font-weight: bold;
      padding: 0.3rem 0;
      border-radius: 4px;
      margin: 0 4px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  .risk-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 700px;
  }
  .risk-table th {
      background: rgba(0, 0, 0, 0.2);
      color: #fff;
      font-weight: bold;
      padding: 0.8rem;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
      white-space: nowrap;
  }
  .risk-table td {
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.8rem;
      text-align: center;
      color: #b0c4de;
      font-size: 0.9rem;
      white-space: nowrap;
  }
  .risk-table .negative {
      color: #5cb85c;
  }

  @media (max-width: 768px) {
      /* 步骤一：修正卡片的收缩行为，防止被内部表格撑开 */
      .content-card {
          min-width: 0;
          padding: 1.5rem 1rem; /* 统一调整内边距 */
      }

      /* 步骤二：让所有 data-table 表格自身变得可以滚动 */
      .data-table {
          display: block; /* 关键：将 table 的显示模式改为 block */
          width: 100%;
          overflow-x: auto; /* 核心：启用水平滚动 */
          -webkit-overflow-scrolling: touch; /* iOS上提供流畅滚动 */
      }

      .data-table th,
      .data-table td {
          white-space: nowrap;
      }

      /* 步骤四：处理图表卡片的切换按钮，使其堆叠 */
      .card-header-with-toggle {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
      }

      /* 步骤五：处理调仓指引，使其垂直排列 */
      .adjustments-grid {
          grid-template-columns: 1fr; /* 在小屏幕上，调入调出列表垂直排列 */
          gap: 1.5rem;
      }

      /* 新增：适配市场概览卡片 */
      .market-stats-grid {
          grid-template-columns: 1fr; /* 指标垂直排列 */
      }
      .price-dist-grid {
          grid-template-columns: repeat(3, 1fr); /* 每行3个 */
      }
      .stat-value {
          font-size: 1.5rem;
      }

      /* 步骤六 (可选但推荐): 优化标题和正文的字体大小 */
      .main-title {
          font-size: 2rem;
      }
      .card-title {
          font-size: 1.25rem;
      }
      .card-description {
          font-size: 0.9rem;
      }
      .stats-bar {
          grid-template-columns: repeat(2, 1fr);
      }
      .risk-summary-grid {
          grid-template-columns: 1fr;
          gap: 1rem;
      }
      .card-header-row {
          flex-direction: column;
          align-items: flex-start;
      }
  }

  @media (max-width: 480px) {
      /* 在更小的屏幕上进一步优化价格分布网格 */
      .price-dist-grid {
          grid-template-columns: repeat(2, 1fr); /* 每行2个 */
      }
  }
</style>