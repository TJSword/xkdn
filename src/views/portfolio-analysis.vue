<template>
  <div class="page-wrapper" :style="cssVars">
    <div class="main-container">

      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <span class="title-icon">⚗️</span>
          组合实验室
        </h1>
        <p class="subtitle">
          基于真实数据。自由配置，探索组合的化学反应。
        </p>
      </div>

      <div class="content-card config-card">
        <div class="card-header-row">
          <h2 class="card-title no-margin">🧪 参数配置</h2>
          <div :class="['weight-indicator', { 'warning': totalWeight !== 100 }]">
            总权重: {{ totalWeight }}%
            <span v-if="totalWeight !== 100" class="warning-text">(目标 100%)</span>
          </div>
        </div>

        <div class="config-grid">
          <div class="strategy-inputs">
            <div v-for="strat in strategies" :key="strat.id" class="input-row">
              <div class="strategy-label-cell">
                <input
                  :id="`strategy-${strat.id}`"
                  class="strategy-checkbox"
                  type="checkbox"
                  v-model="strat.selected"
                  :aria-label="strat.name"
                  @change="handleSelectionChange"
                />
                <button
                  v-if="hasStrategyAction(strat.id)"
                  type="button"
                  class="strategy-name-action"
                  :title="getStrategyActionTitle(strat.id)"
                  @click.stop.prevent="handleStrategyActionClick(strat)"
                >
                  {{ strat.name }}
                </button>
                <label v-else class="name strategy-name-label" :for="`strategy-${strat.id}`">
                  {{ strat.name }}
                </label>
                <span
                  v-if="strat.id === ALL_WEATHER_ID && leverageConfig.enabled"
                  class="inline-leverage-badge"
                >
                  {{ formatLeverageMultiplier(cleanLeverageMultiplier) }}
                </span>
              </div>
              <div class="slider-container" :class="{ disabled: !strat.selected }">
                <input type="range" v-model.number="strat.weight" min="0" max="100" step="5" :disabled="!strat.selected">
                <div class="number-input-wrapper">
                  <input type="number" v-model.number="strat.weight" :disabled="!strat.selected">
                  <span class="unit">%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="action-area">
            <div class="date-picker-group">
              <label>回测时间范围 (已自动对齐交集)</label>
              <div class="date-inputs">
                <input type="date" v-model="startDate" :min="minDate" :max="maxDate" class="cyber-input" />
                <span class="separator">至</span>
                <input type="date" v-model="endDate" :min="minDate" :max="maxDate" class="cyber-input" />
              </div>
            </div>

            <button class="run-btn" @click="runAnalysis" :disabled="isLoading || totalWeight !== 100 || !dataReady">
              {{ dataStatusText }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showLeverageModal" class="modal-backdrop" @click.self="closeLeverageModal">
        <div class="leverage-modal">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">全天候杠杆设置</h2>
              <p class="modal-subtitle">设置只作用于组合中的全天候策略成分。</p>
            </div>
            <button type="button" class="modal-close" @click="closeLeverageModal">×</button>
          </div>

          <label class="modal-toggle-row">
            <input type="checkbox" v-model="leverageConfig.enabled" />
            <span>启用杠杆增强</span>
          </label>

          <div v-if="!allWeatherSelected" class="modal-note">
            当前未勾选全天候策略，配置会在勾选后参与回测。
          </div>

          <div class="modal-fields">
            <label class="modal-field">
              <span>杠杆倍数</span>
              <input
                type="number"
                v-model.number="leverageConfig.multiplier"
                min="1"
                max="3"
                step="0.1"
                class="cyber-input"
                :disabled="!leverageConfig.enabled"
              />
            </label>
            <label class="modal-field">
              <span>融资成本 (%/年)</span>
              <input
                type="number"
                v-model.number="leverageConfig.financingRate"
                min="0"
                max="30"
                step="0.1"
                class="cyber-input"
                :disabled="!leverageConfig.enabled"
              />
            </label>
          </div>

          <div class="leverage-metrics">
            <div>
              <span>总持仓</span>
              <strong>{{ leverageExposureText }}</strong>
            </div>
            <div>
              <span>融资部分</span>
              <strong>{{ leverageBorrowedText }}</strong>
            </div>
            <div>
              <span>当前状态</span>
              <strong>{{ leverageStatusText }}</strong>
            </div>
          </div>

          <p class="modal-footnote">
            融资成本按自然日折算，只对超过 100% 的融资部分扣减。
          </p>

          <div class="modal-actions">
            <button type="button" class="modal-secondary-btn" @click="closeLeverageModal">取消</button>
            <button type="button" class="modal-primary-btn" @click="confirmLeverageSettings">完成</button>
          </div>
        </div>
      </div>

      <div v-if="activeStrategyInfo" class="modal-backdrop" @click.self="closeStrategyInfoModal">
        <div class="strategy-info-modal">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">{{ activeStrategyInfo.title }}</h2>
              <p class="modal-subtitle">{{ activeStrategyInfo.subtitle }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeStrategyInfoModal">×</button>
          </div>

          <div class="strategy-info-body">
            <p v-for="paragraph in activeStrategyInfo.paragraphs" :key="paragraph">
              {{ paragraph }}
            </p>
          </div>

          <div class="modal-actions">
            <button type="button" class="modal-primary-btn" @click="closeStrategyInfoModal">我知道了</button>
          </div>
        </div>
      </div>

      <div
        v-if="metricTooltip.visible"
        :class="['metric-floating-tooltip', `metric-floating-tooltip--${metricTooltip.placement}`]"
        :style="{ left: metricTooltip.x + 'px', top: metricTooltip.y + 'px' }"
      >
        {{ metricTooltip.text }}
      </div>

      <div v-if="analysisDone" class="analysis-results">

        <div class="content-card">
          <h2 class="card-title">净值走势对比</h2>
          <p class="card-description">
            粗线为合成的组合策略 (阈值再平衡: 30%)，细线为各成分策略。区间：{{ startDate }} 至 {{ endDate }}
          </p>
          <div v-if="leverageSummary.enabled" class="leverage-result-strip">
            <div>
              <span>全天候杠杆</span>
              <strong>{{ formatLeverageMultiplier(leverageSummary.multiplier) }}</strong>
            </div>
            <div>
              <span>融资成本</span>
              <strong>{{ formatPlainPercent(leverageSummary.financingRate) }}/年</strong>
            </div>
            <div>
              <span>累计扣减</span>
              <strong>{{ leverageSummary.totalFinancingCost }}%</strong>
            </div>
          </div>
          <div ref="chartContainer" class="echart-container"></div>
        </div>

        <div class="content-card">
          <h2 class="card-title">策略表现对比统计</h2>
          <div class="table-container" style="margin-top: 1rem;">
            <table class="comparison-table experience-table">
              <thead>
                <tr>
                  <th class="sticky-col-header">策略名称</th>
                  <th>总收益率</th>
                  <th>年化收益</th>
                  <th>年化波动率</th>
                  <th>夏普比率</th>
                  <th>最大回撤</th>
                  <th>卡玛比率</th>
                </tr>
              </thead>
              <tbody>
                <tr class="highlight-row">
                  <td class="sticky-col">🧪 组合策略</td>
                  <td :class="getPerformanceCellClass(portfolioStats, 'totalReturn', true, 'return')">
                    {{ portfolioStats.totalReturn }}%
                  </td>
                  <td :class="getPerformanceCellClass(portfolioStats, 'annualizedReturn', true, 'return')">
                    {{ portfolioStats.annualizedReturn }}%
                  </td>
                  <td :class="getPerformanceCellClass(portfolioStats, 'volatility', false)">
                    {{ portfolioStats.volatility }}%
                  </td>
                  <td :class="getPerformanceCellClass(portfolioStats, 'sharpe', true)">
                    {{ portfolioStats.sharpe }}
                  </td>
                  <td :class="getPerformanceCellClass(portfolioStats, 'maxDrawdown', true, 'drawdown')">
                    {{ portfolioStats.maxDrawdown }}%
                  </td>
                  <td :class="getPerformanceCellClass(portfolioStats, 'calmar', true)">
                    {{ portfolioStats.calmar }}
                  </td>
                </tr>
                <tr v-for="stat in individualStats" :key="stat.name">
                  <td class="sticky-col">{{ stat.name }}</td>
                  <td :class="getPerformanceCellClass(stat, 'totalReturn', true, 'return')">
                    {{ stat.totalReturn }}%
                  </td>
                  <td :class="getPerformanceCellClass(stat, 'annualizedReturn', true, 'return')">
                    {{ stat.annualizedReturn }}%
                  </td>
                  <td :class="getPerformanceCellClass(stat, 'volatility', false)">
                    {{ stat.volatility }}%
                  </td>
                  <td :class="getPerformanceCellClass(stat, 'sharpe', true)">
                    {{ stat.sharpe }}
                  </td>
                  <td :class="getPerformanceCellClass(stat, 'maxDrawdown', true, 'drawdown')">
                    {{ stat.maxDrawdown }}%
                  </td>
                  <td :class="getPerformanceCellClass(stat, 'calmar', true)">
                    {{ stat.calmar }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">持有体验指标</h2>
          <p class="card-description">
            用更贴近日常持有感受的指标，观察策略是否经常创新高、正收益周期是否稳定，以及最长需要等待多久重新创新高。
          </p>
          <div class="table-container" style="margin-top: 1rem;">
            <table class="comparison-table experience-table holding-experience-table">
              <thead>
                <tr>
                  <th class="sticky-col-header">策略名称</th>
                  <th>创新高率</th>
                  <th>日胜率</th>
                  <th>周胜率</th>
                  <th>月胜率</th>
                  <th>年胜率</th>
                  <th>最长未创新高</th>
                  <th>
                    收益偏度
                    <span
                      class="metric-help"
                      tabindex="0"
                      @mouseenter="showMetricTooltip($event, metricHelpText.returnSkewness)"
                      @focus="showMetricTooltip($event, metricHelpText.returnSkewness)"
                      @mouseleave="hideMetricTooltip"
                      @blur="hideMetricTooltip"
                    >
                      ?
                    </span>
                  </th>
                  <th>
                    溃疡指数
                    <span
                      class="metric-help"
                      tabindex="0"
                      @mouseenter="showMetricTooltip($event, metricHelpText.ulcerIndex)"
                      @focus="showMetricTooltip($event, metricHelpText.ulcerIndex)"
                      @mouseleave="hideMetricTooltip"
                      @blur="hideMetricTooltip"
                    >
                      ?
                    </span>
                  </th>
                  <th>
                    收益痛苦比
                    <span
                      class="metric-help"
                      tabindex="0"
                      @mouseenter="showMetricTooltip($event, metricHelpText.gainPainRatio)"
                      @focus="showMetricTooltip($event, metricHelpText.gainPainRatio)"
                      @mouseleave="hideMetricTooltip"
                      @blur="hideMetricTooltip"
                    >
                      ?
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="highlight-row">
                  <td class="sticky-col">🧪 组合策略</td>
                  <td :class="getExperienceCellClass(portfolioExperienceStats, 'highWatermarkRate', true, 'rate')">
                    {{ portfolioExperienceStats.highWatermarkRate }}%
                  </td>
                  <td :class="getExperienceCellClass(portfolioExperienceStats, 'dailyWinRate', true, 'rate')">
                    {{ portfolioExperienceStats.dailyWinRate }}%
                  </td>
                  <td :class="getExperienceCellClass(portfolioExperienceStats, 'weeklyWinRate', true, 'rate')">
                    {{ portfolioExperienceStats.weeklyWinRate }}%
                  </td>
                  <td :class="getExperienceCellClass(portfolioExperienceStats, 'monthlyWinRate', true, 'rate')">
                    {{ portfolioExperienceStats.monthlyWinRate }}%
                  </td>
                  <td :class="getExperienceCellClass(portfolioExperienceStats, 'yearlyWinRate', true, 'rate')">
                    {{ portfolioExperienceStats.yearlyWinRate }}%
                  </td>
                  <td :class="getExperienceCellClass(portfolioExperienceStats, 'longestNoHighDays', false, 'noHigh')">
                    {{ portfolioExperienceStats.longestNoHighDays }}天
                  </td>
                  <td :class="getExperienceCellClass(portfolioExperienceStats, 'returnSkewness', true, 'skewness')">
                    {{ portfolioExperienceStats.returnSkewness }}
                  </td>
                  <td :class="getExperienceCellClass(portfolioExperienceStats, 'ulcerIndex', false, 'ulcer')">
                    {{ portfolioExperienceStats.ulcerIndex }}%
                  </td>
                  <td :class="getExperienceCellClass(portfolioExperienceStats, 'gainPainRatio', true, 'gainPain')">
                    {{ portfolioExperienceStats.gainPainRatio }}
                  </td>
                </tr>
                <tr v-for="stat in individualExperienceStats" :key="stat.name">
                  <td class="sticky-col">{{ stat.name }}</td>
                  <td :class="getExperienceCellClass(stat, 'highWatermarkRate', true, 'rate')">
                    {{ stat.highWatermarkRate }}%
                  </td>
                  <td :class="getExperienceCellClass(stat, 'dailyWinRate', true, 'rate')">
                    {{ stat.dailyWinRate }}%
                  </td>
                  <td :class="getExperienceCellClass(stat, 'weeklyWinRate', true, 'rate')">
                    {{ stat.weeklyWinRate }}%
                  </td>
                  <td :class="getExperienceCellClass(stat, 'monthlyWinRate', true, 'rate')">
                    {{ stat.monthlyWinRate }}%
                  </td>
                  <td :class="getExperienceCellClass(stat, 'yearlyWinRate', true, 'rate')">
                    {{ stat.yearlyWinRate }}%
                  </td>
                  <td :class="getExperienceCellClass(stat, 'longestNoHighDays', false, 'noHigh')">
                    {{ stat.longestNoHighDays }}天
                  </td>
                  <td :class="getExperienceCellClass(stat, 'returnSkewness', true, 'skewness')">
                    {{ stat.returnSkewness }}
                  </td>
                  <td :class="getExperienceCellClass(stat, 'ulcerIndex', false, 'ulcer')">
                    {{ stat.ulcerIndex }}%
                  </td>
                  <td :class="getExperienceCellClass(stat, 'gainPainRatio', true, 'gainPain')">
                    {{ stat.gainPainRatio }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <h2 class="card-title">组合月度/年度收益表</h2>
          <p class="card-description">颜色深浅代表涨跌幅强度。</p>
          <div class="table-container heatmap-container">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th class="sticky-col-header">年份</th>
                  <th v-for="m in 12" :key="m">{{ m }}月</th>
                  <th>年度</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="yearData in monthlyReturns" :key="yearData.year">
                  <td class="sticky-col year-cell">{{ yearData.year }}</td>
                  <td v-for="(val, idx) in yearData.months" :key="idx" :style="getHeatmapStyle(val)" class="month-cell">
                    {{ val !== null ? val + '%' : '-' }}
                  </td>
                  <td class="year-total-cell" :style="getHeatmapStyle(yearData.total)">
                    {{ yearData.total }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="content-card">
          <div class="card-header-row">
            <div class="title-with-tooltip">
              <h2 class="card-title no-margin">蒙特卡洛未来模拟</h2>
              <div
                class="info-icon-wrapper"
                tabindex="0"
                @mouseenter="showMetricTooltip($event, metricHelpText.monteCarlo)"
                @focus="showMetricTooltip($event, metricHelpText.monteCarlo)"
                @mouseleave="hideMetricTooltip"
                @blur="hideMetricTooltip"
              >
                <span class="info-icon">i</span>
              </div>
            </div>

            <div class="year-selector">
              <label>预测时长：</label>
              <select v-model="mcYears" @change="runMonteCarlo" class="cyber-input select-arrow">
                <option :value="1">未来 1 年</option>
                <option :value="2">未来 2 年</option>
                <option :value="3">未来 3 年</option>
                <option :value="4">未来 4 年</option>
                <option :value="5">未来 5 年</option>
              </select>
            </div>
          </div>

          <p class="card-description">
            基于当前组合历史日收益重采样生成 1000 条潜在未来路径。阴影区域代表 90% 的概率区间。
          </p>

          <div class="mc-layout">
            <div ref="mcChartContainer" class="echart-container mc-chart"></div>

            <div class="mc-stats">
              <div class="stat-box optimistic">
                <span class="label">乐观预期 (95分位)</span>
                <span class="value">+{{ mcStats.p95 }}%</span>
                <span class="sub">资产翻 {{ mcStats.p95X }} 倍</span>
              </div>
              <div class="stat-box median">
                <span class="label">中性预期 (中位数)</span>
                <span class="value">+{{ mcStats.p50 }}%</span>
                <span class="sub">资产翻 {{ mcStats.p50X }} 倍</span>
              </div>
              <div class="stat-box pessimistic">
                <span class="label">悲观预期 (5分位)</span>
                <span class="value" :class="{'negative': parseFloat(mcStats.p05) < 0}">{{ mcStats.p05 }}%</span>
                <span class="sub">资产变为 {{ mcStats.p05X }} 倍</span>
              </div>
              <div class="mc-risk-grid">
                <div class="mc-risk-item">
                  <span class="label">期末亏损概率</span>
                  <span class="value">{{ mcStats.lossProbability }}%</span>
                </div>
                <div class="mc-risk-item">
                  <span class="label">回撤超 10%</span>
                  <span class="value">{{ mcStats.drawdown10Probability }}%</span>
                </div>
                <div class="mc-risk-item">
                  <span class="label">回撤超 20%</span>
                  <span class="value">{{ mcStats.drawdown20Probability }}%</span>
                </div>
                <div class="mc-risk-item">
                  <span class="label">最大回撤中位数</span>
                  <span class="value">{{ mcStats.medianMaxDrawdown }}%</span>
                </div>
                <div class="mc-risk-item wide">
                  <span class="label">最差 5% 情景最大回撤</span>
                  <span class="value">{{ mcStats.tailMaxDrawdown }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid-two-col">

          <div class="content-card full-height">
            <h2 class="card-title">策略相关性矩阵</h2>
            <p class="card-description">基于选中时间段内的日收益率计算。</p>
            <div class="table-container">
              <table class="correlation-table">
                <thead>
                  <tr>
                    <th class="sticky-col-header">相关度</th>
                    <th v-for="stat in individualStats" :key="stat.name">{{ stat.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, rIndex) in correlationMatrix" :key="rIndex">
                    <td class="row-header sticky-col">{{ individualStats[rIndex]?.name }}</td>
                    <td v-for="(val, cIndex) in row" :key="cIndex" :style="getCorrelationStyle(val)" style="text-align: center;">
                      {{ val.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="content-card full-height">
            <h2 class="card-title">组合回撤深度分布</h2>
            <p class="card-description">统计不同回撤深度的出现频次。</p>
            <div class="drawdown-dist-chart">
              <div v-for="(item, index) in drawdownDistribution" :key="index" class="dist-row">
                <div class="dist-info">
                  <span class="dist-label">{{ item.range }}</span>
                  <span class="dist-count">{{ item.count }}次</span>
                </div>
                <div class="dist-bar-bg">
                  <div class="dist-bar" :style="{ width: item.percent + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div class="content-card">
          <h2 class="card-title">历史重大回撤明细 (Top 10)</h2>
          <div class="table-container" style="margin-top: 1rem;">
            <table class=" risk-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>开始日期</th>
                  <th>谷底日期</th>
                  <th>恢复日期</th>
                  <th>最大回撤</th>
                  <th>回撤期</th>
                  <th>修复期</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(dd, index) in top10Drawdowns" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ dd.startDate }}</td>
                  <td>{{ dd.troughDate }}</td>
                  <td>{{ dd.endDate }}</td>
                  <td class="negative">{{ dd.drawdown }}%</td>
                  <td>{{ dd.ddDays }}天</td>
                  <td>{{ dd.fixDays }}天</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick, watch } from 'vue'
  import * as echarts from 'echarts'
  import axios from 'axios'
  import {
      calculateCorrelation as calculateStrategyCorrelation,
      calculateDrawdownAnalysis as calculateStrategyDrawdownAnalysis,
      calculateMonthlyReturns as calculateStrategyMonthlyReturns,
      calculateStats as calculateStrategyStats,
      getDailyReturns as getStrategyDailyReturns
  } from '@/utils/strategyMetrics'
  const mcYears = ref(1) // 默认预测1年
  const mcChartContainer = ref<HTMLElement | null>(null)
  let mcChart: echarts.ECharts | null = null
  const mcStats = ref({
      p95: '0',
      p50: '0',
      p05: '0',
      p95X: '1.0',
      p50X: '1.0',
      p05X: '1.0',
      lossProbability: '0.0',
      drawdown10Probability: '0.0',
      drawdown20Probability: '0.0',
      medianMaxDrawdown: '0.0',
      tailMaxDrawdown: '0.0'
  })

  // ============================================
  // 🎨 主题色：电光靛
  // ============================================
  const THEME_COLOR = '#6366f1'
  const ALL_WEATHER_ID = 'all_weather'
  const BONDS_ID = 'bonds'
  const JINGHONG_ID = 'jinghong'
  const RIGHTS_ID = 'rights_strategy'
  const FINANCING_DAYS = 365
  const metricHelpText = {
      returnSkewness:
          '衡量日收益分布是否偏向右侧。数值越高，说明极端正收益相对更多；数值为负时，说明极端负收益更突出。',
      ulcerIndex:
          '衡量回撤带来的持有痛感。它会把每天低于历史高点的回撤幅度纳入均方计算，所以不只看跌得多深，也会把持续低于高点的时间计入。',
      gainPainRatio:
          '累计收益率除以溃疡指数。数值越高，说明每承受一单位回撤痛感，换来的收益越多。',
      monteCarlo:
          '基于当前组合历史日收益做短周期重采样，生成 1000 条可能路径。上轨/中轨/下轨分别代表 95%、50%、5% 分位结果；右侧风险指标展示期末亏损概率和模拟路径中的回撤压力。它不是预测承诺，而是用历史波动结构观察未来可能区间。'
  }
  const strategyInfoMap: Record<string, { title: string; subtitle: string; paragraphs: string[] }> = {
      [BONDS_ID]: {
          title: '可转债回测日期说明',
          subtitle: '2022年8月交易新规前后的市场环境不可简单等同。',
          paragraphs: [
              '回测数据覆盖了 2018年1月2日至今的完整周期，但需要注意，可转债市场在 2022年8月实施了交易新规。',
              '在新规之前，沪市转债没有涨跌幅限制，市场波动结构、流动性和交易行为都与现在差异较大。',
              '因此，2022年8月之前的策略表现仅供参考。为了更准确地理解当前风险，建议重点关注 2022年8月1日之后的走势，这更接近现在的真实交易环境。'
          ]
      },
      [JINGHONG_ID]: {
          title: '惊鸿策略说明',
          subtitle: '自运行的可转债策略，暂不开放自助跟投。',
          paragraphs: [
              '惊鸿策略是我当前自行运行的可转债策略，属于内部实盘和托管观察策略。',
              '现阶段暂不对外开放公开配置或自助跟投。如果想参与，只能先通过托管方式进行。',
              '组合实验室中的惊鸿回测用于观察策略历史特征，不代表当前开放申购，也不构成具体交易指令。'
          ]
      },
      [RIGHTS_ID]: {
          title: '含权策略说明',
          subtitle: '事件驱动 + 权利价值重估策略。',
          paragraphs: [
              '含权策略用可转债配售价值重新衡量正股，重点观察单位股价中嵌入更多配售权利的阶段性机会。',
              '组合实验室中使用的是日线回测净值曲线，数据已统一截到 2026年6月4日，以便和其他策略做同区间组合分析。',
              '该策略权益属性较强，适合在组合层面观察相关性和回撤贡献，不代表单独满仓配置建议。'
          ]
      }
  }

  const cssVars = computed(() => {
      return {
          '--theme-color': THEME_COLOR,
          '--theme-shadow': `${THEME_COLOR}66`
      }
  })

  // --- 核心状态 ---
  const isLoading = ref(false)
  const dataReady = ref(false) // 数据是否加载完毕
  const analysisDone = ref(false)
  const showLeverageModal = ref(false)
  const activeStrategyInfo = ref<{ title: string; subtitle: string; paragraphs: string[] } | null>(null)
  const metricTooltip = ref({
      visible: false,
      text: '',
      x: 0,
      y: 0,
      placement: 'top'
  })
  const chartContainer = ref<HTMLElement | null>(null)
  let myChart: echarts.ECharts | null = null

  // --- 原始数据存储 ---
  const rawDataMap = ref<Record<string, any>>({})

  // --- 日期控制 ---
  const minDate = ref('')
  const maxDate = ref('')
  const startDate = ref('')
  const endDate = ref('')

  const leverageConfig = ref({
      enabled: false,
      multiplier: 2.1,
      financingRate: 0
  })

  const leverageSummary = ref({
      enabled: false,
      multiplier: 1,
      financingRate: 0,
      totalFinancingCost: '0.00'
  })

  // --- 策略定义 ---
  const strategies = ref([
      {
          id: 'all_weather',
          name: '全天候策略',
          weight: 20,
          selected: true,
          color: '#00aaff',
          url: './static/allWeatherData.json'
      },
      {
          id: 'bonds',
          name: '可转债策略',
          weight: 20,
          selected: true,
          color: '#add8e6',
          url: './static/bondData.json'
      },
    
      {
          id: RIGHTS_ID,
          name: '含权策略',
          weight: 20,
          selected: true,
          color: '#ef4444',
          url: './static/rightsStrategyData.json'
      }  ,
      {
          id: 'momentum',
          name: '动量策略',
          weight: 20,
          selected: true,
          color: '#ff5722',
          url: './static/momentumData.json'
      },
      {
          id: 'micro_cap',
          name: '微盘股策略',
          weight: 20,
          selected: true,
          color: '#f0e68c',
          url: './static/microCapData.json'
      },
      {
          id: 'jinghong',
          name: '惊鸿策略',
          weight: 0, // 建议初始设为 0，防止总权重直接超过 100% 导致报错
          selected: false, // 建议初始不选中，由用户手动勾选
          color: '#ff4081', // 🎨 推荐色：荧光玫红。在深色背景极具穿透力，且与蓝/橙/黄形成完美互补。
          url: './static/jinghongData.json'
      }
  ])

  // 计算属性
  const totalWeight = computed(() => {
      return strategies.value
          .filter(s => s.selected)
          .reduce((sum, current) => sum + current.weight, 0)
  })

  const selectedStrategyNames = computed(() => {
      return strategies.value.filter(s => s.selected).map(s => s.name)
  })

  const allWeatherSelected = computed(() => {
      return strategies.value.some(s => s.id === ALL_WEATHER_ID && s.selected)
  })

  const cleanLeverageMultiplier = computed(() => {
      const value = Number(leverageConfig.value.multiplier)
      if (!Number.isFinite(value)) return 1
      return Math.min(3, Math.max(1, value))
  })

  const cleanFinancingRate = computed(() => {
      const value = Number(leverageConfig.value.financingRate)
      if (!Number.isFinite(value)) return 0
      return Math.min(30, Math.max(0, value))
  })

  const leverageEnabled = computed(() => {
      return (
          leverageConfig.value.enabled &&
          allWeatherSelected.value &&
          cleanLeverageMultiplier.value > 1
      )
  })

  const leverageExposureText = computed(() => {
      const exposure = leverageEnabled.value ? cleanLeverageMultiplier.value * 100 : 100
      return formatPlainPercent(exposure)
  })

  const leverageBorrowedText = computed(() => {
      const borrowed = leverageEnabled.value ? (cleanLeverageMultiplier.value - 1) * 100 : 0
      return formatPlainPercent(borrowed)
  })

  const leverageStatusText = computed(() => {
      if (!leverageConfig.value.enabled) return '未启用'
      if (cleanLeverageMultiplier.value <= 1) return '1x 不产生融资'
      return `${formatLeverageMultiplier(cleanLeverageMultiplier.value)} / ${formatPlainPercent(
          cleanFinancingRate.value
      )}/年`
  })

  const dataStatusText = computed(() => {
      if (isLoading.value) return '正在计算...'
      if (!dataReady.value) return '正在加载数据...'
      if (totalWeight.value !== 100) return '请调整权重至 100%'
      return '开始回测分析 🚀'
  })

  // --- 结果数据 ---
  const portfolioStats = ref<any>({})
  const individualStats = ref<any[]>([])
  const portfolioExperienceStats = ref<any>({
      highWatermarkRate: '0.00',
      dailyWinRate: '0.00',
      weeklyWinRate: '0.00',
      monthlyWinRate: '0.00',
      yearlyWinRate: '0.00',
      longestNoHighDays: 0,
      returnSkewness: '0.000',
      ulcerIndex: '0.00',
      gainPainRatio: '0.000'
  })
  const individualExperienceStats = ref<any[]>([])
  const correlationMatrix = ref<number[][]>([])
  const top10Drawdowns = ref<any[]>([])
  const drawdownDistribution = ref<any[]>([])
  const monthlyReturns = ref<any[]>([])

  // 临时存储图表数据
  const chartData = ref<any>(null)

  const formatPlainPercent = (value: number) => {
      const rounded = Math.round(value * 100) / 100
      return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2)}%`
  }

  const formatLeverageMultiplier = (value: number) => {
      const rounded = Math.round(value * 100) / 100
      return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2)}x`
  }

  const getStrategyDisplayName = (strat: any) => {
      if (strat.id === ALL_WEATHER_ID && leverageEnabled.value) {
          return `${strat.name} (${formatLeverageMultiplier(cleanLeverageMultiplier.value)})`
      }
      return strat.name
  }

  const hasStrategyAction = (strategyId: string) => {
      return [ALL_WEATHER_ID, BONDS_ID, JINGHONG_ID].includes(strategyId)
  }

  const getStrategyActionTitle = (strategyId: string) => {
      if (strategyId === ALL_WEATHER_ID) return '设置全天候杠杆和融资成本'
      if (strategyId === BONDS_ID) return '查看可转债回测日期说明'
      if (strategyId === JINGHONG_ID) return '查看惊鸿策略开放说明'
      return ''
  }

  const handleStrategyActionClick = (strat: any) => {
      if (strat.id === ALL_WEATHER_ID) {
          openLeverageModal()
          return
      }

      activeStrategyInfo.value = strategyInfoMap[strat.id] || null
  }

  const normalizeLeverageInputs = () => {
      leverageConfig.value.multiplier = cleanLeverageMultiplier.value
      leverageConfig.value.financingRate = cleanFinancingRate.value
  }

  const openLeverageModal = () => {
      showLeverageModal.value = true
  }

  const closeLeverageModal = () => {
      showLeverageModal.value = false
  }

  const closeStrategyInfoModal = () => {
      activeStrategyInfo.value = null
  }

  const showMetricTooltip = (event: MouseEvent | FocusEvent, text: string) => {
      const target = event.currentTarget as HTMLElement
      const rect = target.getBoundingClientRect()
      const tooltipHalfWidth = 160
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth
      const placement = rect.top < 150 ? 'bottom' : 'top'
      const x = Math.min(
          Math.max(rect.left + rect.width / 2, tooltipHalfWidth + 12),
          viewportWidth - tooltipHalfWidth - 12
      )

      metricTooltip.value = {
          visible: true,
          text,
          x,
          y: placement === 'bottom' ? rect.bottom + 10 : rect.top - 10,
          placement
      }
  }

  const hideMetricTooltip = () => {
      metricTooltip.value.visible = false
  }

  const confirmLeverageSettings = () => {
      normalizeLeverageInputs()
      closeLeverageModal()
  }

  const getCalendarDayGap = (start: string, end: string) => {
      const startTime = new Date(start).getTime()
      const endTime = new Date(end).getTime()
      if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) return 1
      return Math.max(1, Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)))
  }

  const parseDateAsUtc = (date: string) => {
      const [year, month, day] = date.split('-').map(Number)
      return new Date(Date.UTC(year, month - 1, day))
  }

  const getIsoWeekKey = (date: string) => {
      const current = parseDateAsUtc(date)
      current.setUTCDate(current.getUTCDate() + 4 - (current.getUTCDay() || 7))
      const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1))
      const week = Math.ceil(((current.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
      return `${current.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
  }

  const formatRate = (value: number) => {
      return Number.isFinite(value) ? (value * 100).toFixed(2) : '0.00'
  }

  const calculateWinRate = (returns: number[]) => {
      const validReturns = returns.filter(ret => Number.isFinite(ret))
      if (validReturns.length === 0) return '0.00'
      return formatRate(validReturns.filter(ret => ret > 0).length / validReturns.length)
  }

  const calculateReturnSkewness = (returns: number[]) => {
      const validReturns = returns.filter(ret => Number.isFinite(ret))
      if (validReturns.length < 2) return '0.000'

      const mean = validReturns.reduce((sum, ret) => sum + ret, 0) / validReturns.length
      const variance =
          validReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
          validReturns.length
      const stdDev = Math.sqrt(variance)
      if (stdDev === 0) return '0.000'

      const skewness =
          validReturns.reduce((sum, ret) => sum + Math.pow((ret - mean) / stdDev, 3), 0) /
          validReturns.length
      return skewness.toFixed(3)
  }

  const calculateUlcerIndex = (prices: number[]) => {
      if (prices.length < 2 || prices[0] <= 0) return '0.00'

      let peak = prices[0]
      const squaredDrawdowns: number[] = []

      prices.forEach(price => {
          if (!Number.isFinite(price) || price <= 0) return
          if (price > peak) peak = price
          const drawdownPercent = ((price - peak) / peak) * 100
          squaredDrawdowns.push(Math.pow(drawdownPercent, 2))
      })

      if (squaredDrawdowns.length === 0) return '0.00'
      const meanSquaredDrawdown =
          squaredDrawdowns.reduce((sum, value) => sum + value, 0) / squaredDrawdowns.length
      return Math.sqrt(meanSquaredDrawdown).toFixed(2)
  }

  const calculateGainPainRatio = (prices: number[], ulcerIndex: string) => {
      const validPrices = prices.filter(price => Number.isFinite(price) && price > 0)
      if (validPrices.length < 2) return '0.000'

      const totalReturnPercent =
          ((validPrices[validPrices.length - 1] / validPrices[0]) - 1) * 100
      const ulcerValue = parseFloat(ulcerIndex)

      if (!Number.isFinite(ulcerValue) || ulcerValue <= 0) {
          return totalReturnPercent > 0 ? '∞' : '0.000'
      }

      return (totalReturnPercent / ulcerValue).toFixed(3)
  }

  const calculatePeriodReturns = (
      prices: number[],
      dates: string[],
      getPeriodKey: (date: string) => string
  ) => {
      const returns: number[] = []
      const length = Math.min(prices.length, dates.length)
      if (length < 2) return returns

      let currentKey = getPeriodKey(dates[1])
      let periodReturn = 1

      for (let i = 1; i < length; i++) {
          const key = getPeriodKey(dates[i])
          if (key !== currentKey) {
              returns.push(periodReturn - 1)
              periodReturn = 1
              currentKey = key
          }

          const prevPrice = prices[i - 1]
          const currentPrice = prices[i]
          const dailyReturn =
              Number.isFinite(prevPrice) && prevPrice > 0 && Number.isFinite(currentPrice)
                  ? currentPrice / prevPrice
                  : 1
          periodReturn *= dailyReturn
      }

      returns.push(periodReturn - 1)
      return returns
  }

  const calculateExperienceStats = (prices: number[], dates: string[]) => {
      const length = Math.min(prices.length, dates.length)
      if (length < 2 || prices[0] <= 0) {
          return {
              highWatermarkRate: '0.00',
              dailyWinRate: '0.00',
              weeklyWinRate: '0.00',
              monthlyWinRate: '0.00',
              yearlyWinRate: '0.00',
              longestNoHighDays: 0,
              returnSkewness: '0.000',
              ulcerIndex: '0.00',
              gainPainRatio: '0.000'
          }
      }

      const epsilon = 0.0000001
      let peak = prices[0]
      let highWatermarkDays = 1
      let noHighStartDate = ''
      let longestNoHighDays = 0

      for (let i = 1; i < length; i++) {
          const currentPrice = prices[i]
          if (!Number.isFinite(currentPrice)) continue

          if (currentPrice >= peak * (1 - epsilon)) {
              if (noHighStartDate) {
                  const noHighDays = getCalendarDayGap(noHighStartDate, dates[i])
                  if (noHighDays > longestNoHighDays) {
                      longestNoHighDays = noHighDays
                  }
                  noHighStartDate = ''
              }
              highWatermarkDays += 1
              peak = Math.max(peak, currentPrice)
          } else if (!noHighStartDate) {
              noHighStartDate = dates[i]
          }
      }

      if (noHighStartDate) {
          const noHighDays = getCalendarDayGap(noHighStartDate, dates[length - 1])
          if (noHighDays > longestNoHighDays) {
              longestNoHighDays = noHighDays
          }
      }

      const dailyReturns = getStrategyDailyReturns(prices)
      const weeklyReturns = calculatePeriodReturns(prices, dates, getIsoWeekKey)
      const monthlyPeriodReturns = calculatePeriodReturns(prices, dates, date => date.slice(0, 7))
      const yearlyReturns = calculatePeriodReturns(prices, dates, date => date.slice(0, 4))

      const ulcerIndex = calculateUlcerIndex(prices)

      return {
          highWatermarkRate: formatRate(highWatermarkDays / length),
          dailyWinRate: calculateWinRate(dailyReturns),
          weeklyWinRate: calculateWinRate(weeklyReturns),
          monthlyWinRate: calculateWinRate(monthlyPeriodReturns),
          yearlyWinRate: calculateWinRate(yearlyReturns),
          longestNoHighDays,
          returnSkewness: calculateReturnSkewness(dailyReturns),
          ulcerIndex,
          gainPainRatio: calculateGainPainRatio(prices, ulcerIndex)
      }
  }

  const resetLeverageSummary = () => {
      leverageSummary.value = {
          enabled: false,
          multiplier: 1,
          financingRate: 0,
          totalFinancingCost: '0.00'
      }
  }

  const applyLeverageToAllWeather = (baseCurve: number[], dates: string[]) => {
      if (!leverageEnabled.value || baseCurve.length < 2) {
          resetLeverageSummary()
          return baseCurve
      }

      const multiplier = cleanLeverageMultiplier.value
      const annualFinancingRate = cleanFinancingRate.value / 100
      const borrowedMultiplier = multiplier - 1
      const leveragedCurve = [1]
      let totalFinancingCost = 0

      for (let i = 1; i < baseCurve.length; i++) {
          const prevBaseValue = baseCurve[i - 1]
          const currentBaseValue = baseCurve[i]
          const baseReturn =
              Number.isFinite(prevBaseValue) && prevBaseValue > 0 && Number.isFinite(currentBaseValue)
                  ? currentBaseValue / prevBaseValue - 1
                  : 0
          const financingDays = getCalendarDayGap(dates[i - 1], dates[i])
          const periodFinancingRate = annualFinancingRate * (financingDays / FINANCING_DAYS)
          const previousLeveragedValue = leveragedCurve[i - 1]
          const financingCost = previousLeveragedValue * borrowedMultiplier * periodFinancingRate
          const leveragedReturn = multiplier * baseReturn - borrowedMultiplier * periodFinancingRate
          const nextValue = previousLeveragedValue * (1 + leveragedReturn)

          totalFinancingCost += financingCost
          leveragedCurve.push(Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 0.000001)
      }

      leverageSummary.value = {
          enabled: true,
          multiplier,
          financingRate: cleanFinancingRate.value,
          totalFinancingCost: (totalFinancingCost * 100).toFixed(2)
      }

      return leveragedCurve
  }

  // =======================================================
  // 1. 初始化：加载所有数据
  // =======================================================
  onMounted(async () => {
      try {
          isLoading.value = true
          const requests = strategies.value.map(s => axios.get(s.url))
          const responses = await Promise.all(requests)

          responses.forEach((res, index) => {
              const stratId = strategies.value[index].id
              // 保存原始数据
              rawDataMap.value[stratId] = res.data
          })

          dataReady.value = true
          updateDateRangeLimits() // 计算初始日期范围
          isLoading.value = false
      } catch (error) {
          console.error('数据加载失败:', error)
          alert('策略数据加载失败，请检查 static 文件是否存在。')
          isLoading.value = false
      }

      window.addEventListener('resize', () => {
          myChart?.resize()
          mcChart?.resize()
      })
  })

  const handleSelectionChange = () => {
      updateDateRangeLimits()
  }

  const getCommonDateList = (selectedStrats: any[]) => {
      if (selectedStrats.length === 0) return []

      let commonDates = [...(rawDataMap.value[selectedStrats[0].id]?.dateList || [])]

      for (let i = 1; i < selectedStrats.length; i++) {
          const nextDates = new Set(rawDataMap.value[selectedStrats[i].id]?.dateList || [])
          commonDates = commonDates.filter((d: string) => nextDates.has(d))
      }

      return commonDates.sort()
  }

  // =======================================================
  // 2. 核心逻辑：计算日期交集并设置限制
  // =======================================================
  const updateDateRangeLimits = () => {
      const selectedStrats = strategies.value.filter(s => s.selected)
      if (selectedStrats.length === 0) return

      const commonDates = getCommonDateList(selectedStrats)

      if (commonDates.length > 0) {
          minDate.value = commonDates[0]
          maxDate.value = commonDates[commonDates.length - 1]
          startDate.value = minDate.value
          endDate.value = maxDate.value
      } else {
          minDate.value = ''
          maxDate.value = ''
          startDate.value = ''
          endDate.value = ''
          alert('所选策略之间没有共同的时间交集！')
      }
  }

  // =======================================================
  // 3. 运行分析：数据处理与计算 (包含 NaN 修复 + 再平衡逻辑)
  // =======================================================
  const runAnalysis = async () => {
      if (!startDate.value || !endDate.value) return
      if (totalWeight.value !== 100) return

      isLoading.value = true

      setTimeout(() => {
          calculateAllMetrics()
          analysisDone.value = true

          isLoading.value = false
          nextTick(() => {
              initChart()
              runMonteCarlo()
          })
      }, 100)
  }

  const calculateAllMetrics = () => {
      const selectedStrats = strategies.value.filter(s => s.selected)

      if (selectedStrats.length === 0) return

      // 1. 确定计算用的日期列表 (基于 Map 匹配，解决 NaN 问题)
      const calcDateList = getCommonDateList(selectedStrats).filter(
          (d: string) => d >= startDate.value && d <= endDate.value
      )

      if (calcDateList.length < 2) {
          alert('回测区间至少需要两个共同交易日。')
          return
      }

      // 2. 数据清洗与归一化：构建 Map 映射
      const normalizedDataMap: Record<string, number[]> = {}

      selectedStrats.forEach(strat => {
          const rawObj = rawDataMap.value[strat.id]

          // 构建查找表: Date -> Value
          const datePriceMap: Record<string, number> = {}
          for (let i = 0; i < rawObj.dateList.length; i++) {
              datePriceMap[rawObj.dateList[i]] = rawObj.strategyData[i]
          }

          const alignedData: number[] = []
          calcDateList.forEach((date: string) => {
              const val = datePriceMap[date]
              if (val === undefined || isNaN(val)) {
                  // 容错：沿用前值
                  alignedData.push(alignedData.length > 0 ? alignedData[alignedData.length - 1] : 1)
              } else {
                  alignedData.push(val)
              }
          })

          // 归一化 (Start = 1.0)
          if (alignedData.length > 0) {
              const baseVal = alignedData[0]
              normalizedDataMap[strat.id] =
                  Number.isFinite(baseVal) && baseVal > 0
                      ? alignedData.map(v => v / baseVal)
                      : alignedData.map(() => 1)
          } else {
              normalizedDataMap[strat.id] = []
          }
      })

      if (selectedStrats.some(strat => strat.id === ALL_WEATHER_ID)) {
          normalizedDataMap[ALL_WEATHER_ID] = applyLeverageToAllWeather(
              normalizedDataMap[ALL_WEATHER_ID],
              calcDateList
          )
      } else {
          resetLeverageSummary()
      }

      // 3. 计算组合净值曲线 (核心：阈值再平衡逻辑)
      const portfolioCurve: number[] = []

      // 硬编码的再平衡阈值
      const REBALANCE_THRESHOLD = 0.3 // 30% 偏离度

      // 初始状态：总资金为 1.0，按目标权重分配
      let currentTotalEquity = 1.0
      const currentHoldings: Record<string, number> = {}
      selectedStrats.forEach(s => {
          currentHoldings[s.id] = currentTotalEquity * (s.weight / 100)
      })

      // 第0天也就是初始状态
      portfolioCurve.push(currentTotalEquity)

      // 从第1天开始迭代
      for (let t = 1; t < calcDateList.length; t++) {
          let newTotalEquity = 0

          // A. 根据当日涨跌幅更新各持仓市值
          selectedStrats.forEach(s => {
              const prevPrice = normalizedDataMap[s.id][t - 1]
              const currPrice = normalizedDataMap[s.id][t]
              const dailyReturn =
                  Number.isFinite(prevPrice) && prevPrice > 0 && Number.isFinite(currPrice)
                      ? currPrice / prevPrice
                      : 1 // 当日涨幅因子

              currentHoldings[s.id] *= dailyReturn
              newTotalEquity += currentHoldings[s.id]
          })

          currentTotalEquity = newTotalEquity

          // B. 检查是否需要再平衡
          let needsRebalance = false
          for (const s of selectedStrats) {
              const targetW = s.weight / 100
              const currentW = currentHoldings[s.id] / currentTotalEquity

              // 计算偏离度： |当前权重 - 目标权重| / 目标权重
              const deviation = Math.abs(currentW - targetW) / targetW

              if (deviation > REBALANCE_THRESHOLD) {
                  needsRebalance = true
                  break // 只要有一个触发，就整体再平衡
              }
          }

          // C. 执行再平衡 (卖出/买入，重置为目标权重)
          if (needsRebalance) {
              selectedStrats.forEach(s => {
                  currentHoldings[s.id] = currentTotalEquity * (s.weight / 100)
              })
              // 这里可以记录再平衡事件，如果需要的话
          }

          // D. 记录当日组合净值
          portfolioCurve.push(currentTotalEquity)
      }

      // 4. 计算各项统计指标
      portfolioStats.value = calculateStrategyStats(portfolioCurve)
      portfolioExperienceStats.value = calculateExperienceStats(portfolioCurve, calcDateList)

      individualStats.value = selectedStrats.map(strat => {
          const stats = calculateStrategyStats(normalizedDataMap[strat.id])
          return {
              name: getStrategyDisplayName(strat),
              ...stats
          }
      })

      individualExperienceStats.value = selectedStrats.map(strat => {
          const stats = calculateExperienceStats(normalizedDataMap[strat.id], calcDateList)
          return {
              name: getStrategyDisplayName(strat),
              ...stats
          }
      })

      // 5. 相关性矩阵
      const returnsMap: Record<string, number[]> = {}
      selectedStrats.forEach(strat => {
          returnsMap[strat.id] = getStrategyDailyReturns(normalizedDataMap[strat.id])
      })

      const matrix: number[][] = []
      for (let i = 0; i < selectedStrats.length; i++) {
          const row: number[] = []
          for (let j = 0; j < selectedStrats.length; j++) {
              if (i === j) {
                  row.push(1.0)
              } else {
                  const corr = calculateStrategyCorrelation(
                      returnsMap[selectedStrats[i].id],
                      returnsMap[selectedStrats[j].id]
                  )
                  row.push(corr)
              }
          }
          matrix.push(row)
      }
      correlationMatrix.value = matrix

      // 6. Top 10 回撤 & 回撤分布
      const { drawdowns, distribution } = calculateStrategyDrawdownAnalysis(portfolioCurve, calcDateList)
      top10Drawdowns.value = drawdowns
      console.log(drawdowns)
      drawdownDistribution.value = distribution

      // 7. 月度/年度收益
      monthlyReturns.value = calculateStrategyMonthlyReturns(portfolioCurve, calcDateList)
      console.log(monthlyReturns.value)

      // 保存数据给图表
      chartData.value = {
          dateList: calcDateList,
          portfolio: portfolioCurve,
          singles: normalizedDataMap
      }
  }

  const getPercentileValue = (values: number[], percentile: number) => {
      if (values.length === 0) return 1
      const sortedValues = [...values].sort((a, b) => a - b)
      const index = (sortedValues.length - 1) * percentile
      const lowerIndex = Math.floor(index)
      const upperIndex = Math.ceil(index)

      if (lowerIndex === upperIndex) return sortedValues[lowerIndex]

      const weight = index - lowerIndex
      return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight
  }

  const calculatePathMaxDrawdownDepth = (path: number[]) => {
      let peak = path[0] || 1
      let maxDrawdown = 0

      path.forEach(value => {
          if (value > peak) peak = value
          if (peak > 0) {
              const drawdown = (value - peak) / peak
              if (drawdown < maxDrawdown) maxDrawdown = drawdown
          }
      })

      return Math.abs(maxDrawdown)
  }

  const buildBootstrapReturnSequence = (returns: number[], days: number) => {
      const sequence: number[] = []
      const blockSize = Math.min(5, returns.length)

      while (sequence.length < days) {
          const maxStart = Math.max(0, returns.length - blockSize)
          const startIndex = Math.floor(Math.random() * (maxStart + 1))

          for (let i = 0; i < blockSize && sequence.length < days; i++) {
              sequence.push(returns[startIndex + i])
          }
      }

      return sequence
  }

  // --- 蒙特卡洛模拟核心逻辑：历史收益重采样 ---
  const runMonteCarlo = () => {
      if (!chartData.value || !chartData.value.portfolio) return

      const prices = chartData.value.portfolio
      const dailyReturns: number[] = []

      for (let i = 1; i < prices.length; i++) {
          if (prices[i - 1] > 0 && prices[i] > 0) {
              dailyReturns.push(prices[i] / prices[i - 1] - 1)
          }
      }

      if (dailyReturns.length === 0) return

      const days = mcYears.value * 252
      const simulationCount = 1000
      const paths: number[][] = []
      const finalValues: number[] = []
      const maxDrawdownDepths: number[] = []

      for (let simulation = 0; simulation < simulationCount; simulation++) {
          const sampledReturns = buildBootstrapReturnSequence(dailyReturns, days)
          const path = [1]

          sampledReturns.forEach(ret => {
              const previousValue = path[path.length - 1]
              const nextValue = previousValue * Math.max(0.000001, 1 + ret)
              path.push(nextValue)
          })

          paths.push(path)
          finalValues.push(path[path.length - 1])
          maxDrawdownDepths.push(calculatePathMaxDrawdownDepth(path))
      }

      const percentilesData = {
          p95: [] as number[],
          p50: [] as number[],
          p05: [] as number[]
      }

      for (let day = 0; day <= days; day++) {
          const dayValues = paths.map(path => path[day])
          percentilesData.p95.push(getPercentileValue(dayValues, 0.95))
          percentilesData.p50.push(getPercentileValue(dayValues, 0.5))
          percentilesData.p05.push(getPercentileValue(dayValues, 0.05))
      }

      const final95 = percentilesData.p95[days]
      const final50 = percentilesData.p50[days]
      const final05 = percentilesData.p05[days]
      const lossProbability =
          finalValues.filter(value => value < 1).length / simulationCount
      const drawdown10Probability =
          maxDrawdownDepths.filter(value => value >= 0.1).length / simulationCount
      const drawdown20Probability =
          maxDrawdownDepths.filter(value => value >= 0.2).length / simulationCount

      mcStats.value = {
          p95: ((final95 - 1) * 100).toFixed(0),
          p95X: final95.toFixed(2),
          p50: ((final50 - 1) * 100).toFixed(0),
          p50X: final50.toFixed(2),
          p05: ((final05 - 1) * 100).toFixed(0),
          p05X: final05.toFixed(2),
          lossProbability: (lossProbability * 100).toFixed(1),
          drawdown10Probability: (drawdown10Probability * 100).toFixed(1),
          drawdown20Probability: (drawdown20Probability * 100).toFixed(1),
          medianMaxDrawdown: (getPercentileValue(maxDrawdownDepths, 0.5) * 100).toFixed(1),
          tailMaxDrawdown: (getPercentileValue(maxDrawdownDepths, 0.95) * 100).toFixed(1)
      }

      initMonteCarloChart(days, percentilesData)
  }

  const initMonteCarloChart = (days: number, data: any) => {
      if (!mcChartContainer.value) return
      if (mcChart) mcChart.dispose()
      mcChart = echarts.init(mcChartContainer.value)

      // 生成 X 轴标签 (未来第N天)
      const xData = Array.from({ length: days + 1 }, (_, i) => i)

      const option: any = {
          backgroundColor: 'transparent',
          tooltip: {
              trigger: 'axis',
              formatter: (params: any) => {
                  const day = params[0].axisValue
                  let html = `<strong>未来第 ${day} 交易日</strong><br/>`
                  params.forEach((p: any) => {
                      const val = ((p.value - 1) * 100).toFixed(1) + '%'
                      html += `${p.marker} ${p.seriesName}: ${val}<br/>`
                  })
                  return html
              }
          },
          grid: { top: '10%', left: '2%', right: '4%', bottom: '10%', containLabel: true },
          xAxis: {
              type: 'category',
              data: xData,
              axisLine: { lineStyle: { color: '#8392A5' } },
              axisLabel: {
                  formatter: (val: string) => {
                      const day = parseInt(val)
                      if (day % 126 === 0) return (day / 252).toFixed(1) + '年' // 每半年显示一次
                      return ''
                  }
              }
          },
          yAxis: {
              type: 'value',
              scale: true,
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
              axisLabel: {
                  color: '#8392A5',
                  formatter: (val: number) => ((val - 1) * 100).toFixed(0) + '%'
              }
          },
          series: [
              {
                  name: '乐观预期 (95%)',
                  type: 'line',
                  data: data.p95,
                  showSymbol: false,
                  lineStyle: { width: 0 }, // 不显示线，只显示区域
                  itemStyle: { color: '#00c497' },
                  areaStyle: {
                      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                          { offset: 0, color: 'rgba(0, 196, 151, 0.4)' },
                          { offset: 1, color: 'rgba(0, 196, 151, 0.1)' }
                      ]),
                      origin: 'start' // 关键：填充基准
                  }
              },
              {
                  name: '悲观预期 (5%)',
                  type: 'line',
                  data: data.p05,
                  showSymbol: false,
                  lineStyle: { width: 0 },
                  itemStyle: { color: '#ff5722' }
                  // 使用 stack 或者 z-index 技巧，或者简单的白色遮罩？
                  // ECharts 处理区间带最好是用 'confidence band' 技巧
                  // 简单做法：先画95的区域，再画05的区域（用背景色填充）覆盖下方？
                  // 更好做法：使用 areaStyle 的 origin，或者堆叠。
                  // 这里为了简单，我们让95填充全部，5填充下方并设为透明度高或背景色
                  // 修正：正确的区间画法通常需要两条线配合 areaStyle，或者自定义图形。
                  // 简化版：画三条线。
              },
              // 重新设计 Series 以实现漂亮的区间效果
              // 底层：95%线，填充到下层
              // 中层：5%线，填充白色(背景色)遮挡下方
              // 这在透明背景下无效。
              // === 最终方案：使用 ECharts 的 areaStyle 填充两条线之间的部分 (需要 visualMap 或者 stack 技巧，比较复杂) ===
              // === 替代方案：绘制三条线，中间填充半透明 ===
              {
                  name: '上界',
                  type: 'line',
                  data: data.p95,
                  showSymbol: false,
                  lineStyle: { width: 1, color: 'rgba(0, 196, 151, 0.5)' },
                  areaStyle: {
                      color: 'rgba(99, 102, 241, 0.15)', // 中间区域色
                      origin: 'start'
                  }
              },
              {
                  name: '下界',
                  type: 'line',
                  data: data.p05,
                  showSymbol: false,
                  lineStyle: { width: 1, color: 'rgba(255, 87, 34, 0.5)' },
                  areaStyle: {
                      color: '#1e1f29', // 用深色遮挡下方，模拟区间效果 (背景色需匹配card背景)
                      // 注意：这取决于你的Card背景。如果是半透明毛玻璃，这个遮挡会穿帮。
                      // 如果穿帮，建议只画线，或者不填充。
                      // 既然是 Cyberpunk，我们只画线和中位数。
                      opacity: 1
                  },
                  z: 5
              },
              {
                  name: '中性预期',
                  type: 'line',
                  data: data.p50,
                  showSymbol: false,
                  lineStyle: { width: 3, color: '#fff', type: 'dashed' },
                  z: 10
              }
          ]
      }

      // 修正：为了完美的区间效果，可以使用 'L' 型数据结构配合 custom series，但太复杂。
      // 修正2：简单粗暴效果好 -> 画一条线（中位数），画一个区域（上界），再画一个区域（下界，颜色为透明或背景色）。
      // 由于背景是复杂的渐变，遮挡法不可行。
      // 最终修正：只画三条线，加上微弱的填充。
      option.series = [
          {
              name: '乐观 (95%)',
              type: 'line',
              data: data.p95,
              showSymbol: false,
              lineStyle: { width: 1, color: '#00c497', opacity: 0.5 },
              areaStyle: { color: 'rgba(0, 196, 151, 0.1)' } // 淡淡的绿
          },
          {
              name: '中性',
              type: 'line',
              data: data.p50,
              showSymbol: false,
              lineStyle: { width: 2, color: '#ffffff' }
          },
          {
              name: '悲观 (5%)',
              type: 'line',
              data: data.p05,
              showSymbol: false,
              lineStyle: { width: 1, color: '#ff5722', opacity: 0.5 },
              areaStyle: { color: 'rgba(255, 87, 34, 0.1)' } // 淡淡的红
          }
      ]

      mcChart.setOption(option)
  }

  // --- ECharts 图表渲染 ---
  const initChart = () => {
      if (!chartContainer.value || !chartData.value) return
      if (myChart) myChart.dispose()
      myChart = echarts.init(chartContainer.value)

      const { dateList, portfolio, singles } = chartData.value
      const series = []

      // 单策略 (细线)
      const selectedStrats = strategies.value.filter(s => s.selected)
      selectedStrats.forEach(strat => {
          series.push({
              name: getStrategyDisplayName(strat),
              type: 'line',
              data: singles[strat.id],
              symbol: 'none',
              lineStyle: { width: 1, opacity: 0.3 },
              itemStyle: { color: strat.color }
          })
      })

      // 组合 (粗线高亮)
      series.push({
          name: '🧪 组合策略',
          type: 'line',
          data: portfolio,
          symbol: 'none',
          z: 10,
          lineStyle: { width: 3, shadowBlur: 10, shadowColor: THEME_COLOR },
          itemStyle: { color: THEME_COLOR },
          areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: THEME_COLOR + '4D' },
                  { offset: 1, color: THEME_COLOR + '00' }
              ])
          }
      })

      const option = {
          backgroundColor: 'transparent',
          tooltip: {
              trigger: 'axis',
              // 👇 关键：格式化 Tooltip 显示 4 位小数
              formatter: (params: any) => {
                  let res = `<strong>${params[0].name}</strong><br/>`
                  params.forEach((item: any) => {
                      const val = item.value ? Number(item.value).toFixed(4) : '--'
                      res += `${item.marker} ${item.seriesName}: <strong>${val}</strong><br/>`
                  })
                  return res
              }
          },
          legend: {
              data: ['🧪 组合策略', ...selectedStrats.map(s => getStrategyDisplayName(s))],
              textStyle: { color: '#b0c4de' },
              bottom: 0,
              type: 'scroll'
          },
          grid: { top: '10%', left: '2%', right: '3%', bottom: '15%', containLabel: true },
          xAxis: {
              type: 'category',
              data: dateList,
              axisLine: { lineStyle: { color: '#8392A5' } }
          },
          yAxis: {
              type: 'value',
              scale: true,
              splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
              axisLabel: { color: '#8392A5' }
          },
          series: series
      }

      myChart.setOption(option)
  }

  // 辅助样式函数
  const getValueColor = (val: string | number) =>
      Number(val) >= 0 ? 'highlight-red' : 'highlight-green'
  const getAllPerformanceStats = () => {
      return [portfolioStats.value, ...individualStats.value]
  }
  const isBestPerformanceValue = (stat: any, key: string, higherIsBetter: boolean) => {
      const values = getAllPerformanceStats()
          .map(item => Number(item[key]))
          .filter(value => Number.isFinite(value))
      const currentValue = Number(stat[key])

      if (values.length === 0 || !Number.isFinite(currentValue)) return false

      const bestValue = higherIsBetter ? Math.max(...values) : Math.min(...values)
      return Math.abs(currentValue - bestValue) < 0.000001
  }
  const getPerformanceCellClass = (
      stat: any,
      key: string,
      higherIsBetter: boolean,
      mode?: 'return' | 'drawdown'
  ) => {
      return [
          mode === 'return' ? getValueColor(stat[key]) : mode === 'drawdown' ? 'negative' : '',
          { 'experience-best': isBestPerformanceValue(stat, key, higherIsBetter) }
      ]
  }
  const parseExperienceValue = (val: string | number) => {
      if (val === '∞') return Number.POSITIVE_INFINITY
      const value = Number(val)
      return Number.isFinite(value) ? value : 0
  }
  const getAllExperienceStats = () => {
      return [portfolioExperienceStats.value, ...individualExperienceStats.value]
  }
  const isBestExperienceValue = (stat: any, key: string, higherIsBetter: boolean) => {
      const values = getAllExperienceStats().map(item => parseExperienceValue(item[key]))
      if (values.length === 0) return false

      const bestValue = higherIsBetter ? Math.max(...values) : Math.min(...values)
      const currentValue = parseExperienceValue(stat[key])

      if (!Number.isFinite(bestValue) || !Number.isFinite(currentValue)) {
          return bestValue === currentValue
      }

      return Math.abs(currentValue - bestValue) < 0.000001
  }
  const getExperienceBaseClass = (
      stat: any,
      key: string,
      mode: 'rate' | 'noHigh' | 'skewness' | 'ulcer' | 'gainPain'
  ) => {
      const value = stat[key]
      if (mode === 'noHigh') return getNoHighClass(value)
      if (mode === 'skewness') return getSkewnessClass(value)
      if (mode === 'ulcer') return getUlcerIndexClass(value)
      if (mode === 'gainPain') return getGainPainClass(value)
      return getExperienceRateClass(value)
  }
  const getExperienceCellClass = (
      stat: any,
      key: string,
      higherIsBetter: boolean,
      mode: 'rate' | 'noHigh' | 'skewness' | 'ulcer' | 'gainPain'
  ) => {
      return [
          getExperienceBaseClass(stat, key, mode),
          { 'experience-best': isBestExperienceValue(stat, key, higherIsBetter) }
      ]
  }
  const getExperienceRateClass = (val: string | number) => {
      const rate = Number(val)
      if (rate >= 60) return 'experience-strong'
      if (rate >= 50) return 'experience-mid'
      return 'experience-soft'
  }
  const getNoHighClass = (days: number | string) => {
      const value = Number(days)
      if (value <= 90) return 'experience-strong'
      if (value <= 365) return 'experience-mid'
      return 'experience-soft'
  }
  const getSkewnessClass = (val: string | number) => {
      const value = Number(val)
      if (value > 0.3) return 'experience-strong'
      if (value >= -0.3) return 'experience-mid'
      return 'experience-soft'
  }
  const getUlcerIndexClass = (val: string | number) => {
      const value = Number(val)
      if (value <= 5) return 'experience-strong'
      if (value <= 12) return 'experience-mid'
      return 'experience-soft'
  }
  const getGainPainClass = (val: string | number) => {
      if (val === '∞') return 'experience-strong'
      const value = Number(val)
      if (value >= 1.5) return 'experience-strong'
      if (value >= 1) return 'experience-mid'
      return 'experience-soft'
  }
  const getCorrelationStyle = (val: number) => {
      if (val >= 0.99) return { background: 'rgba(255,255,255,0.05)', color: '#fff' }
      if (val > 0) return { background: `rgba(255, 87, 34, ${val * 0.6})`, color: '#fff' }
      return { background: `rgba(0, 196, 151, ${Math.abs(val) * 0.6})`, color: '#fff' }
  }
  const getHeatmapStyle = (value: number | string | null) => {
      if (value === null || value === undefined) return {}
      const num = Number(value)
      if (num === 0) return { backgroundColor: 'transparent' }
      if (num > 0) {
          const opacity = Math.min(Math.abs(num) / 10, 1)
          return {
              backgroundColor: `rgba(255, 87, 34, ${0.15 + opacity * 0.7})`,
              color: '#fff',
              fontWeight: num > 5 ? 'bold' : 'normal'
          }
      } else {
          const opacity = Math.min(Math.abs(num) / 10, 1)
          return {
              backgroundColor: `rgba(0, 196, 151, ${0.15 + opacity * 0.7})`,
              color: '#fff',
              fontWeight: num < -5 ? 'bold' : 'normal'
          }
      }
  }
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

  .page-wrapper {
      overflow-x: hidden;
      padding: 3rem 1rem;
      min-height: 100vh;
      font-family: 'Noto Sans SC', sans-serif;
      color: #fff;
      background: radial-gradient(circle at 20% 50%, #1e1b4b, transparent 40%),
          radial-gradient(circle at 80% 20%, #312e81, transparent 40%), #121212;
      background-color: #121212;
  }

  .main-container {
      margin: 0 auto;
      max-width: 1100px;
  }

  /* 头部 */
  .page-header {
      margin-bottom: 2rem;
      text-align: center;
      animation: fadeInUp 0.5s ease-out forwards;
  }

  .back-button {
      display: inline-block;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      text-decoration: none;
      color: #b0c4de;
      transition: color 0.3s;
  }

  .back-button:hover {
      color: var(--theme-color);
  }

  .main-title {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 2rem;
      font-weight: 700;
      gap: 0.8rem;
  }

  .title-icon {
      text-shadow: 0 0 15px var(--theme-color);
  }

  .subtitle {
      margin: 0 auto;
      max-width: 800px;
      font-size: 0.9rem;
      color: #b0c4de;
  }

  /* 卡片通用 */
  .content-card {
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 12px;
      transition: border-color 0.3s;
      backdrop-filter: blur(10px);
      animation: fadeInUp 0.5s ease-out forwards;
  }

  .content-card:hover {
      border-color: var(--theme-shadow);
  }

  .full-height {
      display: flex;
      height: 100%;
      flex-direction: column;
      box-sizing: border-box;
  }

  .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.8rem;
      margin-bottom: 1.2rem;
      border-bottom: 1px solid rgb(255 255 255 / 10%);
  }

  .card-title {
      padding-left: 0.8rem;
      margin: 0;
      font-size: 1.2rem;
      border-left: 4px solid var(--theme-color);
  }

  .card-description {
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: #b0c4de;
  }

  /* 配置区 */
  .weight-indicator {
      font-size: 0.95rem;
      color: #00c497;
      font-weight: bold;
  }

  .weight-indicator.warning {
      color: #ff5722;
  }

  .config-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
  }

  .strategy-inputs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
  }

  .input-row {
      display: flex;
      align-items: center;
      gap: 1rem;
  }

  .strategy-label-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 100px;
      font-size: 0.9rem;
  }

  .strategy-checkbox {
      accent-color: var(--theme-color);
      width: 16px;
      height: 16px;
      cursor: pointer;
      flex-shrink: 0;
  }

  .strategy-name-label {
      cursor: pointer;
  }

  .strategy-name-action {
      padding: 0 0.05rem 0.08rem;
      color: #dfe5ff;
      background: transparent;
      border: none;
      text-shadow: 0 0 8px rgb(125 211 252 / 18%);
      transition: all 0.2s;
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      text-decoration-line: underline;
      text-decoration-style: dotted;
      text-decoration-thickness: 2px;
      text-decoration-color: rgb(99 102 241);
      text-underline-offset: 8px;
  }

  .strategy-name-action:hover {
      color: var(--theme-color);
      text-decoration-color: var(--theme-color);
      text-shadow: 0 0 10px var(--theme-shadow);
  }

  .inline-leverage-badge {
      padding: 0.05rem 0.28rem;
      font-size: 0.7rem;
      color: #fff;
      background: rgb(99 102 241 / 28%);
      border: 1px solid rgb(99 102 241 / 50%);
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1.3;
  }

  .slider-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.8rem;
  }

  .slider-container.disabled {
      opacity: 0.3;
      pointer-events: none;
  }

  input[type='range'] {
      flex: 1;
      accent-color: var(--theme-color);
  }

  .number-input-wrapper {
      position: relative;
      width: 60px;
  }

  .number-input-wrapper input {
      padding: 4px;
      width: 100%;
      font-size: 0.9rem;
      text-align: center;
      color: #fff;
      background: rgb(0 0 0 / 30%);
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 4px;
  }

  .number-input-wrapper .unit {
      position: absolute;
      top: 7px;
      right: 0;
      font-size: 0.7rem;
      color: #888;
  }

  /* 操作区 */
  .action-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px dashed rgb(255 255 255 / 10%);
      padding-top: 1.2rem;
      gap: 1rem;
  }

  .date-picker-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      color: #b0c4de;
  }

  .date-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
  }

  .cyber-input {
      padding: 0.5rem 0.6rem;
      font-size: 0.9rem;
      font-family: inherit;
      color: #fff;
      background: rgb(0 0 0 / 30%);
      border: 1px solid var(--theme-color);
      border-radius: 6px;
      outline: none;
      color-scheme: dark;
  }

  .run-btn {
      padding: 0.6rem 1.5rem;
      white-space: nowrap;
      color: #fff;
      background: var(--theme-color);
      border: none;
      border-radius: 6px;
      box-shadow: 0 0 10px var(--theme-shadow);
      transition: all 0.3s;
      font-weight: bold;
      cursor: pointer;
  }

  .run-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 0 20px var(--theme-shadow);
  }

  .run-btn:disabled {
      background: #444;
      opacity: 0.7;
      box-shadow: none;
      cursor: not-allowed;
  }

  .modal-backdrop {
      position: fixed;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      background: rgb(0 0 0 / 65%);
      inset: 0;
      backdrop-filter: blur(8px);
  }

  .leverage-modal {
      padding: 1.4rem;
      width: min(520px, 100%);
      background: #1b1c27;
      border: 1px solid rgb(99 102 241 / 45%);
      border-radius: 8px;
      box-shadow: 0 16px 50px rgb(0 0 0 / 45%);
  }

  .strategy-info-modal {
      padding: 1.4rem;
      width: min(560px, 100%);
      background: #1b1c27;
      border: 1px solid rgb(99 102 241 / 45%);
      border-radius: 8px;
      box-shadow: 0 16px 50px rgb(0 0 0 / 45%);
  }

  .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 0.8rem;
      margin-bottom: 1.2rem;
      gap: 1rem;
      border-bottom: 1px solid rgb(255 255 255 / 10%);
  }

  .modal-title {
      margin: 0 0 0.25rem;
      font-size: 1.15rem;
  }

  .modal-subtitle,
  .modal-footnote,
  .modal-note {
      margin: 0;
      font-size: 0.82rem;
      color: #b0c4de;
      line-height: 1.5;
  }

  .modal-close {
      width: 30px;
      height: 30px;
      font-size: 1rem;
      color: #fff;
      background: rgb(255 255 255 / 6%);
      border: 1px solid rgb(255 255 255 / 16%);
      border-radius: 6px;
      cursor: pointer;
      line-height: 1;
  }

  .modal-close:hover {
      color: var(--theme-color);
      border-color: var(--theme-color);
  }

  .modal-toggle-row {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      font-size: 0.95rem;
      color: #fff;
      gap: 0.55rem;
      cursor: pointer;
  }

  .modal-toggle-row input {
      accent-color: var(--theme-color);
      width: 16px;
      height: 16px;
  }

  .modal-note {
      padding: 0.6rem 0.75rem;
      margin-bottom: 1rem;
      color: #f2d184;
      background: rgb(255 193 7 / 8%);
      border: 1px solid rgb(255 193 7 / 35%);
      border-radius: 6px;
  }

  .strategy-info-body {
      display: flex;
      margin: 1rem 0 0.25rem;
      font-size: 0.9rem;
      color: #d6deff;
      flex-direction: column;
      gap: 0.75rem;
      line-height: 1.75;
  }

  .strategy-info-body p {
      padding-left: 0.8rem;
      margin: 0;
      border-left: 3px solid rgb(99 102 241 / 35%);
  }

  .modal-fields {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
  }

  .modal-field {
      display: flex;
      font-size: 0.85rem;
      color: #b0c4de;
      flex-direction: column;
      gap: 0.45rem;
  }

  .modal-field .cyber-input {
      width: 100%;
      box-sizing: border-box;
  }

  .leverage-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin: 1rem 0;
  }

  .leverage-metrics > div {
      padding: 0.75rem;
      min-width: 0;
      background: rgb(255 255 255 / 4%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 6px;
  }

  .leverage-metrics span {
      display: block;
      margin-bottom: 0.35rem;
      font-size: 0.75rem;
      color: #8392a5;
  }

  .leverage-metrics strong {
      display: block;
      font-size: 0.95rem;
      color: #fff;
      overflow-wrap: anywhere;
  }

  .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.2rem;
  }

  .modal-secondary-btn,
  .modal-primary-btn {
      padding: 0.55rem 1rem;
      border: 1px solid transparent;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
  }

  .modal-secondary-btn {
      color: #b0c4de;
      background: transparent;
      border-color: rgb(255 255 255 / 18%);
  }

  .modal-primary-btn {
      color: #fff;
      background: var(--theme-color);
      box-shadow: 0 0 10px var(--theme-shadow);
  }

  .modal-secondary-btn:hover {
      color: #fff;
      border-color: var(--theme-color);
  }

  .modal-primary-btn:hover {
      box-shadow: 0 0 18px var(--theme-shadow);
  }

  .leverage-result-strip {
      display: grid;
      padding: 0.75rem;
      margin-bottom: 1rem;
      background: rgb(99 102 241 / 8%);
      border: 1px solid rgb(99 102 241 / 28%);
      border-radius: 8px;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
  }

  .leverage-result-strip span {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.75rem;
      color: #8392a5;
  }

  .leverage-result-strip strong {
      font-size: 0.95rem;
      color: #fff;
  }

  .experience-strong {
      color: #ffb454;
      font-weight: 700;
  }

  .experience-mid {
      color: #7dd3fc;
      font-weight: 700;
  }

  .experience-soft {
      color: #00c497;
      font-weight: 700;
  }

  .experience-best {
      position: relative;
      background: rgb(255 180 84 / 14%);
      box-shadow: inset 0 0 0 1px rgb(255 180 84 / 35%);
  }

  .experience-best::after {
      position: absolute;
      top: 2px;
      right: 4px;
      font-size: 0.62rem;
      color: #ffb454;
      content: '优';
      font-weight: 700;
      line-height: 1;
  }

  .metric-help {
      position: relative;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      margin-left: 0.2rem;
      width: 12px;
      height: 12px;
      font-size: 9px;
      color: #b0c4de;
      border: 1px solid rgb(176 196 222 / 65%);
      border-radius: 50%;
      font-weight: 700;
      line-height: 1;
      cursor: help;
      vertical-align: middle;
  }

  .metric-help:hover,
  .metric-help:focus {
      color: var(--theme-color);
      border-color: var(--theme-color);
      outline: none;
  }

  .metric-floating-tooltip {
      position: fixed;
      z-index: 5000;
      padding: 0.65rem 0.75rem;
      width: 320px;
      max-width: calc(100vw - 24px);
      font-size: 0.78rem;
      text-align: left;
      white-space: normal;
      color: #d6deff;
      background: rgb(27 28 39 / 98%);
      border: 1px solid rgb(99 102 241 / 45%);
      border-radius: 6px;
      box-shadow: 0 8px 24px rgb(0 0 0 / 35%);
      font-weight: 400;
      line-height: 1.55;
      pointer-events: none;
  }

  .metric-floating-tooltip--top {
      transform: translate(-50%, -100%);
  }

  .metric-floating-tooltip--bottom {
      transform: translate(-50%, 0);
  }

  /* ECharts */
  .echart-container {
      width: 100%;
      height: 320px;
  }

  /* === 表格通用样式 === */
  .table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
  }

  .table-container::-webkit-scrollbar {
      height: 6px;
  }

  .table-container::-webkit-scrollbar-thumb {
      background: rgb(255 255 255 / 20%);
      border-radius: 3px;
  }

  table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;

      /* min-width: 600px; */
  }

  th {
      padding: 0.8rem;
      white-space: nowrap;
      color: #b0c4de;
      background: rgb(0 0 0 / 30%);
      border: 1px solid rgb(255 255 255 / 10%);
      font-weight: normal;
  }

  td {
      padding: 0.8rem;
      text-align: center;
      white-space: nowrap;
      border: 1px solid rgb(255 255 255 / 10%);
  }

  /* 固定列样式 */
  .sticky-col {
      position: sticky;
      left: 0;
      z-index: 2;
      background: #1e1e1e;
      border-right: 1px solid rgb(255 255 255 / 20%);
  }

  .sticky-col-header {
      position: sticky;
      left: 0;
      z-index: 3;
      background: #252525;
  }

  .highlight-row .sticky-col {
      background: #2c2a4a;
  }

  .row-header {
      font-weight: bold;
      text-align: center;
  }

  .highlight-row {
      background: rgb(99 102 241 / 10%);
      font-weight: bold;
  }

  .highlight-red {
      color: #ff5722;
      font-weight: bold;
  }

  .highlight-green {
      color: #00c497;
      font-weight: bold;
  }

  .negative {
      color: #00c497;
      font-weight: bold;
  }

  .experience-table {
      font-size: 0.82rem;
  }

  .experience-table th,
  .experience-table td {
      padding: 0.65rem 0.42rem;
  }

  .experience-table .sticky-col,
  .experience-table .sticky-col-header {
      min-width: 92px;
  }

  .holding-experience-table {
      table-layout: fixed;
      width: 100%;
      min-width: 960px;
  }

  .holding-experience-table th,
  .holding-experience-table td {
      overflow: hidden;
      width: 10%;
      text-overflow: ellipsis;
      white-space: nowrap;
  }

  .holding-experience-table .sticky-col,
  .holding-experience-table .sticky-col-header {
      width: 10%;
      min-width: 0;
  }

  /* === 热力图表格样式 === */
  .heatmap-table th {
      padding: 0.6rem 0.2rem;
      min-width: 40px;
      font-size: 0.85rem;
  }

  .heatmap-table td {
      padding: 0.6rem 0.2rem;
      font-size: 0.85rem;
  }

  .year-cell {
      font-weight: bold;
      color: #b0c4de;
  }

  .year-total-cell {
      font-weight: bold;
      border-left: 2px solid rgb(255 255 255 / 20%);
  }

  /* 双栏布局 */
  .grid-two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
  }

  /* 关键修复：防止Grid/Flex子项撑破容器 */
  .grid-two-col > * {
      min-width: 0;
  }

  /* 回撤分布图 */
  .drawdown-dist-chart {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-top: 0.5rem;
  }

  .dist-row {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
  }

  .dist-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #b0c4de;
  }

  .dist-bar-bg {
      overflow: hidden;
      width: 100%;
      height: 10px;
      background: rgb(255 255 255 / 5%);
      border-radius: 5px;
  }

  .dist-bar {
      min-width: 4px;
      height: 100%;
      background: linear-gradient(90deg, var(--theme-color), #a5b4fc);
      border-radius: 5px;
  }

  select.cyber-input {
      padding-right: 2rem; /* 给右侧箭头留位置 */
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1rem;
      appearance: none; /* 移除浏览器默认样式 */
      -webkit-appearance: none;
      -moz-appearance: none;
      cursor: pointer;

      /* 自定义下拉箭头 (使用 SVG 编码) */
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23b0c4de' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      line-height: 1.2;
  }

  select.cyber-input:hover {
      border-color: var(--theme-color);
  }

  select.cyber-input option {
      color: #fff;
      background-color: #1e1e2e; /* 下拉选项背景色 */
  }

  /* ============================================
                                                                                                                                     📱 移动端适配 (Media Queries)
                                                                                                                                     ============================================ */
  @media (max-width: 768px) {
      .page-wrapper {
          overflow-x: hidden;
          padding: 1.5rem 0.8rem;
      }

      .main-title {
          font-size: 1.6rem;
      }

      .strategy-inputs {
          grid-template-columns: 1fr;
          gap: 1.2rem;
      }

      .action-area {
          flex-direction: column;
          align-items: stretch;
      }

      .date-inputs {
          justify-content: space-between;
      }

      .cyber-input {
          flex: 1;
      }

      .run-btn {
          margin-top: 0.5rem;
          width: 100%;
      }

      .leverage-modal {
          padding: 1rem;
      }

      .strategy-info-modal {
          padding: 1rem;
      }

      .modal-fields,
      .leverage-metrics,
      .leverage-result-strip {
          grid-template-columns: 1fr;
      }

      .modal-actions {
          flex-direction: column-reverse;
      }

      .modal-secondary-btn,
      .modal-primary-btn {
          width: 100%;
      }

      .grid-two-col {
          grid-template-columns: 1fr;
          gap: 1rem;
      }

      /* 双重保险 */
      .grid-two-col > * {
          min-width: 0;
      }

      .content-card {
          padding: 1rem;
          margin-bottom: 1rem;
      }

      table {
          min-width: auto;
          font-size: 0.8rem;
      }

      .correlation-table th,
      .correlation-table td,
      .heatmap-table th,
      .heatmap-table td {
          padding: 0.4rem 0.2rem;
          font-size: 0.75rem;
          text-align: center;
          border-color: #373333;
      }
  }

  /* === 蒙特卡洛卡片样式 === */

  /* 标题栏布局 */
  .title-with-tooltip {
      position: relative; /* 所有的tooltip定位参考点 */
      display: flex;
      align-items: center;
      gap: 0.5rem;
  }

  /* 交互式Icon */
  .info-icon-wrapper {
      position: relative;
      cursor: pointer;
      display: flex;
      align-items: center;
      border-radius: 50%;
  }

  .info-icon-wrapper:focus {
      outline: none;
  }

  .info-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 12px;
      height: 12px;
      font-size: 10px;
      color: #b0c4de;
      border: 1px solid #b0c4de;
      border-radius: 50%;
      transition: all 0.3s;
      font-weight: bold;
  }

  .info-icon:hover,
  .info-icon-wrapper:hover .info-icon {
      color: var(--theme-color);
      border-color: var(--theme-color);
      box-shadow: 0 0 5px var(--theme-shadow);
  }

  /* 年份选择器 */
  .year-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #b0c4de;
  }

  .cyber-select {
      padding: 0.3rem 0.5rem;
      font-family: inherit;
      color: #fff;
      background: rgb(0 0 0 / 30%);
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 4px;
      outline: none;
      cursor: pointer;
  }

  .cyber-select:hover {
      border-color: var(--theme-color);
  }

  /* 蒙特卡洛布局：上图下指标 */
  .mc-layout {
      display: grid;
      align-items: stretch;
      margin-top: 1.5rem;
      grid-template-columns: 1fr;
      gap: 1rem;
  }

  .mc-chart {
      width: 100%;
      height: 360px;
      min-height: 360px;
      align-self: stretch;
  }

  /* 统计数据块 */
  .mc-stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.75rem;
  }

  .mc-risk-grid {
      display: grid;
      grid-column: 1 / -1;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.75rem;
  }

  .mc-risk-item {
      padding: 0.7rem;
      min-width: 0;
      background: rgb(255 255 255 / 3.5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 8px;
  }

  .mc-risk-item.wide {
      grid-column: auto;
  }

  .mc-risk-item .label {
      display: block;
      margin-bottom: 0.25rem;
      font-size: 0.72rem;
      color: #b0c4de;
  }

  .mc-risk-item .value {
      font-size: 1.05rem;
      color: #ffb454;
      font-weight: 700;
  }

  .stat-box {
      position: relative;
      display: flex;
      overflow: hidden;
      padding: 1rem;
      background: rgb(255 255 255 / 3%);
      border-radius: 8px;
      border-left: 4px solid #555;
      flex-direction: column;
  }

  .stat-box::after {
      position: absolute;
      top: -10px;
      right: -10px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      opacity: 0.1;
      content: '';
  }

  .stat-box.optimistic {
      border-color: #00c497;
  }

  .stat-box.optimistic::after {
      background: #00c497;
  }

  .stat-box.median {
      border-color: #fff;
  }

  .stat-box.median::after {
      background: #fff;
  }

  .stat-box.pessimistic {
      border-color: #ff5722;
  }

  .stat-box.pessimistic::after {
      background: #ff5722;
  }

  .stat-box .label {
      margin-bottom: 0.2rem;
      font-size: 0.8rem;
      color: #b0c4de;
  }

  .stat-box .value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #fff;
  }

  .stat-box .value.negative {
      color: #ff5722;
  }

  .stat-box .sub {
      margin-top: 0.2rem;
      font-size: 0.75rem;
      color: #666;
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
      .mc-layout {
          grid-template-columns: 1fr;
          gap: 1.5rem;
      }

      .mc-chart {
          height: 320px;
          min-height: 320px;
      }

      .mc-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.5rem;
      }

      .mc-risk-grid {
          grid-column: 1 / -1;
          grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .mc-risk-item.wide {
          grid-column: 1 / -1;
      }

      .stat-box {
          align-items: center;
          padding: 0.5rem;
          text-align: center;
      }

      .stat-box .label {
          overflow: hidden;
          width: 100%;
          font-size: 0.7rem;
          text-overflow: ellipsis;
          white-space: nowrap;
      }

      .stat-box .value {
          font-size: 1.1rem;
      }

      .card-header-row {
          flex-wrap: wrap; /* 允许标题和选择器换行 */
          gap: 0.8rem;
      }

      .year-selector {
          justify-content: space-between;
          width: 100%;
      }

      .title-with-tooltip {
          position: static;
      }
  }
</style>
