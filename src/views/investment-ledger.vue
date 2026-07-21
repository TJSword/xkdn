<template>
    <div
        ref="ledgerCaptureTarget"
        class="page-wrapper"
        :class="{ 'ledger-capturing': capturingLedgerImage }">
        <main class="main-container">
            <div class="page-header">
                <router-link to="/home" class="back-button">← 返回主页</router-link>
                <h1 class="main-title">
                    <FeaturePageIcon class="title-icon" type="ledger" :size="52" />
                    投资账本
                </h1>
                <p class="subtitle">记录每一次资产变化，也看清组合正在经历什么。</p>
            </div>

            <section class="content-card overview-card" aria-label="账本概览">
                <div class="overview-toolbar">
                    <div>
                        <h2 class="card-title">账户概览</h2>
                        <p class="card-description">
                            {{ ledgerStatusText }}
                        </p>
                    </div>
                    <div class="header-actions">
                        <button
                            class="button secondary featured-action"
                            type="button"
                            @click="openTodayEntry">
                            录入今日
                        </button>
                        <div
                            ref="ledgerMoreMenuRef"
                            class="ledger-more-menu"
                            data-capture-hidden="true"
                            @click.stop>
                            <button
                                class="ledger-more-button"
                                type="button"
                                aria-label="更多账本操作"
                                :aria-expanded="showLedgerMoreMenu"
                                @click="toggleLedgerMoreMenu">
                                <span></span>
                                <span></span>
                                <span></span>
                            </button>
                            <div v-if="showLedgerMoreMenu" class="ledger-more-dropdown">
                                <button type="button" @click="runLedgerMoreAction(captureLedgerPage)">
                                    <span class="more-action-icon capture"></span>
                                    下载长图
                                </button>
                                <button
                                    v-if="hasLedgerData"
                                    type="button"
                                    @click="runLedgerMoreAction(downloadCurrentLedgerExcel)">
                                    <span class="more-action-icon export"></span>
                                    导出 Excel
                                </button>
                                <button type="button" @click="runLedgerMoreAction(openImport)">
                                    <span class="more-action-icon import"></span>
                                    导入 Excel
                                </button>
                                <button type="button" @click="runLedgerMoreAction(openAnnualTargetModal)">
                                    <span class="more-action-icon target"></span>
                                    年度目标
                                </button>
                                <button type="button" @click="runLedgerMoreAction(openNewRecord)">
                                    <span class="more-action-icon add"></span>
                                    补录历史
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="asset-summary-grid">
                    <article class="asset-summary-primary">
                        <span>组合总资产</span>
                        <strong>{{ displayMoney(totalAssets) }}</strong>
                        <div v-if="hasLedgerData" class="change-line">
                            <em :class="returnClass(todayAssetChange)">
                                当日 {{ displayMoneyChange(todayAssetChange) }}
                            </em>
                            <span :class="returnClass(todayAccountReturn)">
                                {{ formatPercent(todayAccountReturn) }}
                            </span>
                        </div>
                    </article>
                    <article>
                        <span>累计投入本金</span>
                        <strong>{{ displayMoney(accountSummary.investedPrincipal) }}</strong>
                        <small>期初本金与净转入合计</small>
                    </article>
                    <article>
                        <span>累计转入 / 转出</span>
                        <strong class="positive">{{ displayMoney(accountSummary.totalInflow) }}</strong>
                        <small>转出 {{ displayMoney(accountSummary.totalOutflow) }}</small>
                    </article>
                    <article>
                        <span>当前累计盈利</span>
                        <strong :class="returnClass(accountSummary.profit)">
                            {{ displayMoneyChange(accountSummary.profit) }}
                        </strong>
                        <small>总资产减累计投入本金</small>
                    </article>
                    <article>
                        <span>累计收益率</span>
                        <strong :class="returnClass(accountSummary.cumulativeReturn)">
                            {{ formatPercent(accountSummary.cumulativeReturn) }}
                        </strong>
                        <small>按净投入本金计算</small>
                    </article>
                    <article>
                        <span class="metric-label-with-help">
                            资金加权收益率
                            <span
                                class="metric-help"
                                tabindex="0"
                                aria-label="查看资金加权收益率说明">
                                ?
                                <span class="metric-help-tooltip" role="tooltip">
                                    资金加权收益率（XIRR）根据每笔转入、转出的金额和发生时间计算年化收益，更贴近实际投入资金获得的回报。
                                </span>
                            </span>
                        </span>
                        <strong
                            :class="
                                accountSummary.moneyWeightedReturn === null
                                    ? 'muted-return'
                                    : returnClass(accountSummary.moneyWeightedReturn)
                            ">
                            {{
                                accountSummary.moneyWeightedReturn === null
                                    ? '--'
                                    : formatPercent(accountSummary.moneyWeightedReturn)
                            }}
                        </strong>
                        <small>{{ accountSummary.moneyWeightedReturnHint }}</small>
                    </article>
                </div>
                <div
                    v-if="hasAnnualTargetPreview && hasLedgerData"
                    class="annual-target-panel"
                    :class="{ achieved: annualTargetDisplayProgress >= 100 }">
                    <div class="annual-target-heading">
                        <div>
                            <span>{{ annualTargetYearLabel }} 年收益目标</span>
                            <strong :class="returnClass(annualTargetDisplayProfit)">
                                {{ annualTargetDisplayProgressLabel }}
                            </strong>
                        </div>
                    </div>
                    <div class="annual-target-track" aria-hidden="true">
                        <i :style="{ width: `${annualTargetDisplayProgressWidth}%` }"></i>
                    </div>
                    <div class="annual-target-meta">
                        <span>
                            今年收益
                            <strong :class="returnClass(annualTargetDisplayProfit)">
                                {{ displayMoneyChange(annualTargetDisplayProfit) }}
                            </strong>
                        </span>
                        <span>
                            目标
                            <strong>{{ displayMoney(annualTargetDisplayTarget) }}</strong>
                        </span>
                        <span>
                            {{ annualTargetDisplayGap >= 0 ? '还差' : '已超出' }}
                            <strong :class="annualTargetDisplayGap >= 0 ? 'warning' : 'positive'">
                                {{ displayMoney(Math.abs(annualTargetDisplayGap)) }}
                            </strong>
                        </span>
                    </div>
                </div>
                <div v-if="hasLedgerData" class="account-status-line">
                    <strong>{{ accountDrawdownStatus }}</strong>
                    <span>当前回撤 {{ formatPercent(currentDrawdown) }}</span>
                    <span>回到前高需涨 {{ formatPercent(distanceToHigh) }}</span>
                    <span>已连续 {{ daysSinceHigh }} 个记录日未创新高</span>
                </div>
            </section>

            <StrategyLoading
                v-if="ledgerLoading"
                title="正在同步账本数据"
                description="连接云端账本，整理策略与账本记录"
                monogram="LEDGER"
                icon-type="ledger"
                :steps="['读取账本', '校验记录', '生成视图']" />

            <section v-else-if="showEmptyState" class="content-card empty-ledger-card">
                <span class="empty-kicker">暂无账本数据</span>
                <h2>先导入或录入第一批投资记录</h2>
                <p>
                    导入或录入后，投资账本将持续呈现总资产与累计收益、策略占比与收益归因、净值和回撤轨迹、沪深 300 对比，以及资金流记录。
                </p>
                <div v-if="ledgerError" class="empty-error">{{ ledgerError }}</div>
                <div class="empty-actions">
                    <button class="button secondary featured-action" type="button" @click="openImport">
                        导入 Excel
                    </button>
                    <button class="button secondary" type="button" @click="openNewRecord">
                        手动录入第一条
                    </button>
                    <button class="button secondary" type="button" @click="downloadImportTemplate">
                        下载标准模板
                    </button>
                </div>
                <div class="empty-demo-preview">
                    <div class="empty-demo-heading">
                        <div>
                            <span>示例预览</span>
                            <strong>一组账本数据大致会呈现这些信息</strong>
                        </div>
                        <small>仅用于体验页面，不会保存到你的账户</small>
                    </div>
                    <div class="empty-demo-metrics">
                        <div><span>组合总资产</span><strong>¥1,286,420.00</strong></div>
                        <div><span>累计收益率</span><strong class="positive">+8.62%</strong></div>
                        <div><span>当前回撤</span><strong class="negative">-4.18%</strong></div>
                        <div><span>资金加权收益率</span><strong class="positive">+7.94%</strong></div>
                    </div>
                    <div class="empty-demo-body">
                        <v-chart class="empty-demo-chart" :option="emptyDemoOption" autoresize />
                        <div class="empty-demo-strategies">
                            <div v-for="item in emptyDemoStrategies" :key="item.name">
                                <i :style="{ backgroundColor: item.color }"></i>
                                <span>{{ item.name }}</span>
                                <strong :class="returnClass(item.return)">
                                    {{ formatPercent(item.return) }}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="empty-checklist">
                    <article>
                        <strong>1. 先确定策略名称</strong>
                        <span>Excel 里需要包含策略名称；后续可以在页面里修改显示名称。</span>
                    </article>
                    <article>
                        <strong>2. 每条记录保留原始事实</strong>
                        <span>只需要日期、策略、期末金额、当日现金流和备注，系统会自动生成收益与净值。</span>
                    </article>
                    <article>
                        <strong>3. 有数据后再显示分析</strong>
                        <span>导入后自动展示真实的资产变化、收益表现和风险状态。</span>
                    </article>
                </div>
            </section>

            <template v-else>
            <section class="content-card return-panel">
                <div class="panel-heading">
                    <div>
                        <h2 class="card-title">收益率速览</h2>
                        <p class="card-description">
                            展示扣除资金流影响后的时间加权收益率，方便快速定位拖累项。
                        </p>
                    </div>
                    <div class="return-panel-actions">
                        <button
                            class="share-download-button"
                            data-capture-hidden="true"
                            type="button"
                            :disabled="exportingReturnImage"
                            @click="downloadReturnOverviewImage">
                            <span class="share-download-icon" aria-hidden="true"></span>
                            {{ exportingReturnImage ? '生成中...' : '下载图片' }}
                        </button>
                        <button
                            class="range-select-button"
                            type="button"
                            @click="openRangeModal('comparison')">
                            <span>查询区间</span>
                            <strong>{{
                                showComparisonRange
                                    ? rangeLabel(comparisonPeriod, normalizedComparisonRange)
                                    : '自定义'
                            }}</strong>
                        </button>
                    </div>
                </div>
                <div class="return-table">
                    <div class="return-row return-head" :class="{ 'has-range': showComparisonRange }">
                        <span>账户 / 策略</span>
                        <span>当日</span>
                        <span>本周</span>
                        <span>本月</span>
                        <span>本年</span>
                        <span v-if="showComparisonRange">区间</span>
                    </div>
                    <div
                        v-for="row in periodReturnRows"
                        :key="row.name"
                        class="return-row"
                        :class="{ account: row.type === 'account', 'has-range': showComparisonRange }">
                        <div class="return-name">
                            <i :style="{ backgroundColor: row.color }"></i>
                            <strong>{{ row.name }}</strong>
                        </div>
                        <strong :class="returnClass(row.day)">{{ formatPercent(row.day) }}</strong>
                        <strong :class="returnClass(row.week)">{{ formatPercent(row.week) }}</strong>
                        <strong :class="returnClass(row.month)">{{ formatPercent(row.month) }}</strong>
                        <strong :class="returnClass(row.year)">{{ formatPercent(row.year) }}</strong>
                        <strong v-if="showComparisonRange" :class="returnClass(row.range)">
                            {{ formatPercent(row.range) }}
                        </strong>
                    </div>
                </div>
            </section>

            <div
                ref="returnShareTarget"
                class="return-share-card"
                data-capture-hidden="true"
                aria-hidden="true">
                <header class="return-share-header">
                    <div>
                        <span class="return-share-kicker">INVESTMENT LEDGER</span>
                        <h2>收益率速览</h2>
                        <p>时间加权收益率 · 已扣除资金流影响</p>
                    </div>
                    <div v-if="showComparisonRange" class="return-share-meta">
                        <div class="return-share-date">
                            <span>查询区间</span>
                            <strong>{{ returnShareRangeLabel }}</strong>
                        </div>
                    </div>
                </header>
                <div class="return-share-rule"></div>
                <div
                    class="return-share-table"
                    :class="{ 'has-range': showComparisonRange }">
                    <div class="return-share-row return-share-table-head">
                        <span>账户 / 策略</span>
                        <span>当日</span>
                        <span>本周</span>
                        <span>本月</span>
                        <span>本年</span>
                        <span v-if="showComparisonRange">区间</span>
                    </div>
                    <div
                        v-for="row in periodReturnRows"
                        :key="`share-${row.name}`"
                        class="return-share-row"
                        :class="{ account: row.type === 'account' }">
                        <div class="return-share-name">
                            <i :style="{ backgroundColor: row.color }"></i>
                            <strong>{{ row.name }}</strong>
                        </div>
                        <strong :class="returnClass(row.day)">{{ formatPercent(row.day) }}</strong>
                        <strong :class="returnClass(row.week)">{{ formatPercent(row.week) }}</strong>
                        <strong :class="returnClass(row.month)">{{ formatPercent(row.month) }}</strong>
                        <strong :class="returnClass(row.year)">{{ formatPercent(row.year) }}</strong>
                        <strong v-if="showComparisonRange" :class="returnClass(row.range)">
                            {{ formatPercent(row.range) }}
                        </strong>
                    </div>
                </div>
                <footer class="return-share-footer">
                    <span>数据截至 {{ latestLedgerDateLabel }}</span>
                    <span>收益率仅作账户记录与复盘参考</span>
                </footer>
            </div>

            <section class="content-card signal-panel">
                <div class="panel-heading">
                    <div>
                        <h2 class="card-title">账户观察面板</h2>
                        <p class="card-description">
                            汇总回撤、数据完整度和各策略状态，帮助快速发现需要核对的地方。
                        </p>
                    </div>
                    <div class="panel-actions">
                        <button class="text-button" type="button" @click="openStrategyManager">
                            策略管理
                        </button>
                    </div>
                </div>
                <div class="signal-grid">
                    <article v-for="item in accountSignals" :key="item.label" class="signal-card">
                        <span class="signal-label">
                            {{ item.label }}
                            <span
                                v-if="item.help"
                                class="signal-help"
                                tabindex="0"
                                :aria-label="`${item.label}算法说明`">
                                ?
                                <span class="signal-help-tooltip">{{ item.help }}</span>
                            </span>
                        </span>
                        <strong :class="item.tone">{{ displayText(item.value) }}</strong>
                        <div class="signal-track">
                            <i :style="{ width: `${item.progress}%` }"></i>
                        </div>
                        <small>{{ displayText(item.hint) }}</small>
                    </article>
                </div>
                <div class="audit-alert-grid">
                    <article
                        v-for="item in dataQualityAlerts"
                        :key="item.label"
                        :class="['audit-alert', item.tone, { clickable: item.clickable }]"
                        @click="openAuditAlertDetail(item.label)">
                        <div>
                            <span>{{ item.label }}</span>
                            <strong>{{ item.value }}</strong>
                        </div>
                        <p>{{ item.detail }}</p>
                    </article>
                </div>
                <div class="signal-history">
                    <div class="strategy-detail-list observation-detail-list">
                        <div
                            v-for="item in strategyDetails"
                            :key="item.name"
                            class="strategy-detail-row">
                            <div>
                                <i :style="{ backgroundColor: item.color }"></i>
                                <div>
                                    <strong>{{ item.name }}</strong>
                                </div>
                            </div>
                            <div class="detail-metrics">
                                <span>净值 <strong>{{ displayNumber(item.nav) }}</strong></span>
                                <span>当前回撤 <strong class="negative">{{ item.currentDrawdown }}</strong></span>
                                <span>最大回撤 <strong class="warning">{{ item.maxDrawdown }}</strong></span>
                            </div>
                            <div class="detail-high">
                                <div class="high-progress">
                                    <span
                                        :style="{
                                            width: `${item.highProgress}%`,
                                            backgroundColor: item.color
                                        }"></span>
                                </div>
                                <span>{{
                                    item.highDistance === 0
                                        ? '今日创新高'
                                        : `距前高 ${item.highDistance.toFixed(2)}% · ${displayText(`${item.highDays} 天未新高`)}`
                                }}</span>
                            </div>
                            <div class="detail-status">
                                <strong>{{ item.highStatus }}</strong>
                                <span>回撤分位 {{ item.drawdownPercentile.toFixed(2) }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="analysis-grid allocation-only">
                <article class="content-card allocation-panel">
                    <div class="panel-heading">
                        <div>
                            <h2 class="card-title">策略占比与调仓测算</h2>
                            <p class="card-description">
                                设置各策略目标比例后，查看当前偏离和建议调入、调出金额。
                            </p>
                        </div>
                        <button class="text-button" type="button" @click="targetMode = !targetMode">
                            {{ targetMode ? '收起调仓方案' : '设置调仓目标' }}
                        </button>
                    </div>
                    <div class="allocation-layout">
                        <v-chart class="allocation-chart" :option="allocationOption" autoresize />
                        <div class="allocation-list">
                            <div
                                v-for="item in allocationRows"
                                :key="item.name"
                                class="allocation-row">
                                <div class="allocation-label">
                                    <i :style="{ backgroundColor: item.color }"></i>
                                    <strong :title="item.name">{{ formatCompactName(item.name, 5) }}</strong>
                                </div>
                                <div class="weight-track">
                                    <span
                                        v-if="targetMode"
                                        class="target-marker"
                                        :style="{ left: `${item.target}%` }"></span>
                                    <span
                                        class="weight-fill"
                                        :style="{
                                            width: `${item.current}%`,
                                            backgroundColor: item.color
                                        }"></span>
                                </div>
                                <div class="allocation-numbers">
                                    <strong>{{ item.current.toFixed(2) }}%</strong>
                                    <small>{{ formatMoney(item.amount) }}</small>
                                    <span
                                        v-if="targetMode"
                                        :class="
                                            item.deviation > 0 ? 'negative' : 'positive'
                                        ">
                                        偏移 {{ item.deviation > 0 ? '+' : ''
                                        }}{{ item.deviation.toFixed(2) }}%
                                    </span>
                                </div>
                            </div>
                            <div v-if="targetMode" class="rebalance-summary">
                                <div>
                                    <span>最大偏离</span>
                                    <strong>{{ maxDeviation.toFixed(1) }}%</strong>
                                </div>
                                <div>
                                    <span>建议调整金额</span>
                                    <strong>{{ formatMoney(rebalanceAmount) }}</strong>
                                </div>
                                <p>
                                    金额为测算值：正数代表补足，负数代表降低。后续可接入交易成本和最小调整阈值。
                                </p>
                            </div>
                            <div v-if="targetMode && rebalanceActions.length" class="rebalance-action-list">
                                <div
                                    v-for="item in rebalanceActions"
                                    :key="`rebalance-${item.name}`"
                                    class="rebalance-action-row">
                                    <span :class="item.adjustAmount >= 0 ? 'positive' : 'negative'">
                                        {{ item.adjustAmount >= 0 ? '买入' : '卖出' }}
                                    </span>
                                    <strong>{{ item.name }}</strong>
                                    <em>{{ formatMoney(Math.abs(item.adjustAmount)) }}</em>
                                </div>
                            </div>
                            <div v-if="targetMode" class="target-editor">
                                <label v-for="item in allocationData" :key="`${item.name}-target`">
                                    <span>{{ item.name }}目标</span>
                                    <div>
                                        <input
                                            v-model.number="item.target"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            @blur="item.target = roundPercentInput(item.target)" />
                                        <b>%</b>
                                    </div>
                                </label>
                                <div class="target-total" :class="{ invalid: targetTotal !== 100 }">
                                    <span>目标合计</span>
                                    <strong>{{ targetTotal.toFixed(0) }}%</strong>
                                </div>
                            </div>
                            <div v-if="targetMode" class="legend-note">
                                <span></span>白线为用户设定的目标仓位
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            <section class="content-card performance-panel">
                <div class="panel-heading">
                    <div>
                        <h2 class="card-title">净值曲线与资产走势</h2>
                        <p class="card-description">
                            在时间加权净值、账户总金额和累计盈亏之间切换，区分表现走势和真实收益。
                        </p>
                    </div>
                    <button
                        class="range-select-button"
                        type="button"
                        @click="openRangeModal('performance')">
                        <span>时间范围</span>
                        <strong>{{ rangeLabel(selectedPeriod, normalizedDateRange) }}</strong>
                    </button>
                </div>
                <div class="chart-mode-switch" role="group" aria-label="图表维度">
                    <button
                        v-for="mode in performanceChartModes"
                        :key="mode.value"
                        type="button"
                        :class="{ active: performanceChartMode === mode.value }"
                        @click="setPerformanceChartMode(mode.value)">
                        <span>{{ mode.label }}</span>
                        <small>{{ mode.hint }}</small>
                    </button>
                </div>
                <div class="benchmark-strip">
                    <article>
                        <span>整体账户区间收益</span>
                        <strong :class="returnClass(benchmarkComparison.accountReturn)">
                            {{ formatPercent(benchmarkComparison.accountReturn) }}
                        </strong>
                    </article>
                    <article>
                        <span>沪深300同期</span>
                        <strong :class="returnClass(benchmarkComparison.benchmarkReturn)">
                            {{ formatPercent(benchmarkComparison.benchmarkReturn) }}
                        </strong>
                    </article>
                    <article>
                        <span>区间超额收益</span>
                        <strong :class="returnClass(benchmarkComparison.excessReturn)">
                            {{ formatPercent(benchmarkComparison.excessReturn) }}
                        </strong>
                    </article>
                    <article
                        v-for="item in performanceStrategySummaries"
                        :key="`performance-summary-${item.name}`">
                        <span><i class="benchmark-dot" :style="{ backgroundColor: item.color }"></i>{{ item.name }}</span>
                        <strong :class="returnClass(item.return)">
                            {{ formatPercent(item.return) }}
                        </strong>
                    </article>
                </div>
                <v-chart class="performance-chart" :option="performanceOption" autoresize />
            </section>

            <section
                class="content-card return-heatmap-panel"
                :class="{ 'single-metric-view': !showHeatmapCellSub }">
                <div class="panel-heading">
                    <div>
                        <h2 class="card-title">收益热力报表</h2>
                        <p class="card-description">
                            用颜色深浅表达阶段实际盈亏，同时保留收益率和收益金额，方便看出哪月、哪天贡献更大。
                        </p>
                    </div>
                    <div class="heatmap-controls">
                        <label
                            class="heatmap-select-control strategy-scope"
                            :class="{ 'has-strategy-dot': selectedHeatmapStrategyColor }"
                            :style="{ '--strategy-select-width': `${heatmapStrategySelectWidth}px` }">
                            <i
                                v-if="selectedHeatmapStrategyColor"
                                class="heatmap-strategy-dot"
                                :style="{
                                    color: selectedHeatmapStrategyColor,
                                    backgroundColor: selectedHeatmapStrategyColor
                                }"></i>
                            <select v-model="heatmapStrategyId" aria-label="热力策略范围">
                                <option
                                    v-for="option in heatmapStrategyOptions"
                                    :key="option.value"
                                    :value="option.value">
                                    {{ option.label }}
                                </option>
                            </select>
                        </label>
                        <label class="heatmap-select-control">
                            <select v-model="heatmapView" aria-label="热力周期">
                                <option
                                    v-for="view in heatmapViews"
                                    :key="view.value"
                                    :value="view.value">
                                    {{ view.label }}
                                </option>
                            </select>
                        </label>
                        <label class="heatmap-select-control wide">
                            <select v-model="heatmapDisplayMode" aria-label="热力指标视图">
                                <option
                                    v-for="mode in heatmapDisplayModes"
                                    :key="mode.value"
                                    :value="mode.value">
                                    {{ mode.label }}
                                </option>
                            </select>
                        </label>
                    </div>
                </div>

                <div class="heatmap-summary-strip">
                    <article>
                        <span>{{ heatmapView === 'year' ? '年度样本' : '当前月份' }}</span>
                        <strong>{{ heatmapSummary.period }}</strong>
                    </article>
                    <article>
                        <span>收益金额</span>
                        <strong :class="returnClass(heatmapSummary.profit)">
                            {{ displayMoneyChange(heatmapSummary.profit) }}
                        </strong>
                    </article>
                    <article>
                        <span>收益率</span>
                        <strong :class="returnClass(heatmapSummary.return)">
                            {{ formatPercent(heatmapSummary.return) }}
                        </strong>
                    </article>
                    <article>
                        <span>净转入</span>
                        <strong>{{ displayMoneyChange(heatmapSummary.cashFlow) }}</strong>
                    </article>
                </div>

                <div v-if="heatmapView === 'year'" class="heatmap-table-wrap">
                    <table class="return-heatmap-table">
                        <thead>
                            <tr>
                                <th>年度</th>
                                <th v-for="month in heatmapMonthLabels" :key="month">{{ month }}</th>
                                <th>全年</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in annualHeatmapRows" :key="row.year">
                                <th>{{ row.year }}</th>
                                <td
                                    v-for="cell in row.months"
                                    :key="`${row.year}-${cell.month}`"
                                    :class="{ empty: !cell.hasData }"
                                    :style="getReturnHeatmapStyle(cell)"
                                    @click="cell.hasData && selectHeatmapMonth(cell.period)">
                                    <span>{{ formatHeatmapCellMain(cell) }}</span>
                                    <small v-if="showHeatmapCellSub">{{ formatHeatmapCellSub(cell) }}</small>
                                </td>
                                <td
                                    class="year-total-cell"
                                    :class="{ empty: !row.total.hasData }"
                                    :style="getReturnHeatmapStyle(row.total)">
                                    <span>{{ formatHeatmapCellMain(row.total) }}</span>
                                    <small v-if="showHeatmapCellSub">{{ formatHeatmapCellSub(row.total) }}</small>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-else class="monthly-heatmap-layout">
                    <div class="month-picker-strip">
                        <button
                            v-for="month in availableHeatmapMonths"
                            :key="month"
                            type="button"
                            :class="{ active: selectedHeatmapMonthValue === month }"
                            @click="selectedHeatmapMonth = month">
                            {{ month.slice(2) }}
                        </button>
                    </div>
                    <div class="monthly-calendar-scroll">
                        <div class="monthly-calendar">
                            <div
                                v-for="weekday in heatmapWeekdays"
                                :key="weekday"
                                class="calendar-weekday">
                                {{ weekday }}
                            </div>
                            <div
                                v-for="cell in monthlyCalendarCells"
                                :key="cell.key"
                                class="calendar-day"
                                :class="{ empty: cell.empty, active: cell.hasData }"
                                :style="getReturnHeatmapStyle(cell)">
                                <span>{{ cell.dayLabel }}</span>
                                <strong v-if="cell.hasData">{{ formatCalendarHeatmapCellMain(cell) }}</strong>
                                <small v-if="cell.hasData && showHeatmapCellSub">
                                    {{ formatHeatmapCellSub(cell) }}
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="monthly-extreme-list">
                        <article>
                            <span>最大盈利日</span>
                            <strong class="positive">{{ monthlyHeatmapExtremes.best.label }}</strong>
                            <small>{{ monthlyHeatmapExtremes.best.date }}</small>
                        </article>
                        <article>
                            <span>最大亏损日</span>
                            <strong class="negative">{{ monthlyHeatmapExtremes.worst.label }}</strong>
                            <small>{{ monthlyHeatmapExtremes.worst.date }}</small>
                        </article>
                        <article>
                            <span>盈利 / 亏损天数</span>
                            <strong>{{ monthlyHeatmapExtremes.winDays }} / {{ monthlyHeatmapExtremes.lossDays }}</strong>
                            <small>按有记录的日期统计</small>
                        </article>
                        <article>
                            <span>平均盈利日</span>
                            <strong class="positive">{{ monthlyHeatmapExtremes.averageWin }}</strong>
                            <small>仅统计盈利日期</small>
                        </article>
                        <article>
                            <span>平均亏损日</span>
                            <strong class="negative">{{ monthlyHeatmapExtremes.averageLoss }}</strong>
                            <small>仅统计亏损日期</small>
                        </article>
                    </div>
                </div>
            </section>

            <section class="content-card daily-extremes-panel">
                <div class="panel-heading">
                    <div>
                        <h2 class="card-title">日度极值 Top 10</h2>
                        <p class="card-description">按真实账户每日扣除资金流后的表现排序。</p>
                    </div>
                    <div class="metric-switch" role="group" aria-label="日度极值指标">
                        <button
                            type="button"
                            :class="{ active: dailyExtremeMode === 'rate' }"
                            @click="dailyExtremeMode = 'rate'">
                            收益率
                        </button>
                        <button
                            type="button"
                            :class="{ active: dailyExtremeMode === 'amount' }"
                            @click="dailyExtremeMode = 'amount'">
                            收益金额
                        </button>
                    </div>
                </div>
                <div class="daily-extreme-columns">
                    <div class="daily-extreme-list positive-list">
                        <div class="daily-extreme-list-head">
                            <span>{{ dailyExtremeMode === 'rate' ? '收益率最高 10 天' : '赚钱最多 10 天' }}</span>
                            <strong class="positive">TOP 10</strong>
                        </div>
                        <div v-for="(item, index) in dailyExtremeRanks.best" :key="`best-${item.date}`" class="daily-extreme-row">
                            <em>{{ index + 1 }}</em>
                            <span>{{ item.date }}</span>
                            <strong class="positive">{{ formatDailyExtremeValue(item) }}</strong>
                        </div>
                    </div>
                    <div class="daily-extreme-list negative-list">
                        <div class="daily-extreme-list-head">
                            <span>{{ dailyExtremeMode === 'rate' ? '收益率最低 10 天' : '亏钱最多 10 天' }}</span>
                            <strong class="negative">TOP 10</strong>
                        </div>
                        <div v-for="(item, index) in dailyExtremeRanks.worst" :key="`worst-${item.date}`" class="daily-extreme-row">
                            <em>{{ index + 1 }}</em>
                            <span>{{ item.date }}</span>
                            <strong class="negative">{{ formatDailyExtremeValue(item) }}</strong>
                        </div>
                    </div>
                </div>
                <p v-if="!dailyExtremeRanks.best.length" class="empty-analysis-hint">至少需要两日账户记录后生成排行。</p>
            </section>

            <section class="detail-grid ledger-insight-grid">
                <article class="content-card attribution-panel">
                    <div class="panel-heading">
                        <div>
                            <h2 class="card-title">收益归因</h2>
                            <p class="card-description">
                                拆开选定区间收益，区分策略贡献和真实表现来源。
                            </p>
                        </div>
                        <button
                            class="range-select-button"
                            type="button"
                            @click="openRangeModal('attribution')">
                            <span>时间范围</span>
                            <strong>{{ rangeLabel(attributionPeriod, normalizedAttributionRange) }}</strong>
                        </button>
                    </div>
                    <div class="attribution-summary">
                        <article class="attribution-metric-card">
                            <div class="attribution-metric-label">
                                <span>区间组合收益</span>
                                <button
                                    class="attribution-help"
                                    type="button"
                                    aria-label="查看区间组合收益说明"
                                    :aria-expanded="showAttributionReturnHelp"
                                    @click="showAttributionReturnHelp = !showAttributionReturnHelp">
                                    <svg viewBox="0 0 16 16" aria-hidden="true">
                                        <circle cx="8" cy="8" r="6.1" fill="none" stroke="currentColor" stroke-width="1.5" />
                                        <path d="M8 7.1v4.1M8 4.7h.01" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" />
                                    </svg>
                                    <span
                                        role="tooltip"
                                        :class="{ visible: showAttributionReturnHelp }">
                                        按区间末权重和各策略区间收益估算的组合收益率贡献，不计资金流带来的表面变化。
                                    </span>
                                </button>
                            </div>
                            <strong :class="returnClass(attributionAccountReturn)">
                                {{ formatPercent(attributionAccountReturn) }}
                            </strong>
                        </article>
                        <article class="attribution-metric-card">
                            <div class="attribution-metric-label">
                                <span>区间组合盈亏</span>
                                <button
                                    class="attribution-help"
                                    type="button"
                                    aria-label="查看区间组合盈亏说明"
                                    :aria-expanded="showAttributionProfitHelp"
                                    @click="showAttributionProfitHelp = !showAttributionProfitHelp">
                                    <svg viewBox="0 0 16 16" aria-hidden="true">
                                        <circle cx="8" cy="8" r="6.1" fill="none" stroke="currentColor" stroke-width="1.5" />
                                        <path d="M8 7.1v4.1M8 4.7h.01" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" />
                                    </svg>
                                    <span
                                        role="tooltip"
                                        :class="{ visible: showAttributionProfitHelp }">
                                        各策略期末资产减期初资产再扣除区间资金流后汇总得到的真实盈亏金额。
                                    </span>
                                </button>
                            </div>
                            <strong :class="returnClass(attributionAccountProfit)">
                                {{ displayMoneyChange(attributionAccountProfit) }}
                            </strong>
                        </article>
                    </div>
                    <v-chart class="attribution-waterfall" :option="attributionWaterfallOption" autoresize />
                    <div class="attribution-table">
                        <div class="attribution-table-head">
                            <span>策略</span>
                            <span>收益率贡献</span>
                            <span>盈亏贡献</span>
                            <span>期末权重</span>
                        </div>
                        <div
                            v-for="item in attributionRows"
                            :key="item.name"
                            class="attribution-row">
                            <div class="attribution-name">
                                <i :style="{ backgroundColor: item.color }"></i>
                                <div>
                                    <strong>{{ item.name }}</strong>
                                </div>
                            </div>
                            <div class="attribution-copy">
                                <strong :class="returnClass(item.contribution)">
                                    {{ formatContribution(item.contribution) }}
                                </strong>
                            </div>
                            <div class="attribution-copy">
                                <strong :class="returnClass(item.amount)">
                                    {{ displayMoneyChange(item.amount) }}
                                </strong>
                            </div>
                            <div class="attribution-copy attribution-weight">
                                <span>{{ item.weight }}%</span>
                            </div>
                        </div>
                    </div>
                </article>

                <article
                    class="content-card drawdown-history-panel"
                    :class="{ 'fixed-history-height': topDrawdownEpisodes.length <= 8 }">
                    <div class="panel-heading">
                        <div>
                            <h2 class="card-title">历史区间最大回撤 Top 10</h2>
                            <p class="card-description">同一时间加权净值口径 · 各区间最深回撤与恢复状态。</p>
                        </div>
                    </div>
                    <div class="drawdown-history-list">
                        <div
                            v-for="(item, index) in topDrawdownEpisodes"
                            :key="item.id"
                            class="drawdown-history-row">
                            <em>{{ index + 1 }}</em>
                            <span>{{ item.peakDate }} → {{ item.troughDate }}</span>
                            <small>{{ formatDrawdownRecoveryStatus(item) }}</small>
                            <strong class="negative">{{ formatPercent(item.drawdown) }}</strong>
                        </div>
                    </div>
                    <p v-if="!topDrawdownEpisodes.length" class="empty-analysis-hint">至少需要两日账户记录后生成回撤历史。</p>
                </article>
            </section>

            <section class="detail-grid ledger-drawdown-grid">
                <article class="content-card recovery-panel">
                    <div class="panel-heading">
                        <div>
                            <h2 class="card-title">回撤修复路径</h2>
                            <p class="card-description">
                                把“还差多少”拆成可观察的修复节点，方便判断恢复节奏。
                            </p>
                        </div>
                        <div class="recovery-estimate">
                            <span class="status-pill warning-pill">{{ recoveryEstimateLabel }}</span>
                            <span
                                class="recovery-help"
                                tabindex="0"
                                aria-label="查看修复天数算法">
                                ?
                                <span class="recovery-help-tooltip" role="tooltip">
                                    {{ recoveryEstimateHint }}
                                </span>
                            </span>
                        </div>
                    </div>
                    <div class="recovery-trend-strip">
                        <span>
                            近 20 日趋势
                            <strong>{{ recoveryTrendLabel }}</strong>
                        </span>
                        <span>
                            日均趋势速度
                            <strong :class="returnClass(recoveryTrendPace)">
                                {{ recoveryTrendPaceLabel }}
                            </strong>
                        </span>
                        <span>
                            趋势稳定性
                            <strong>{{ recoveryTrendStability }}</strong>
                        </span>
                    </div>
                    <div class="recovery-path">
                        <div
                            v-for="item in recoveryMilestones"
                            :key="item.label"
                            class="recovery-step"
                            :class="{ done: item.done }">
                            <div class="recovery-node"></div>
                            <div>
                                <strong>{{ item.label }}</strong>
                                <span>{{ displayText(item.note) }}</span>
                            </div>
                            <em :title="item.requiredReturn">{{ item.estimatedDays }}</em>
                        </div>
                    </div>
                </article>

                <article class="content-card drawdown-attribution-panel">
                    <div class="panel-heading">
                        <div>
                            <h2 class="card-title">回撤归因</h2>
                            <p class="card-description">按当前回撤口径，分解本轮前高至当前的策略真实盈亏来源。</p>
                        </div>
                        <span
                            class="status-pill"
                            :class="{ 'warning-pill': activeDrawdownEpisode }">
                            {{ activeDrawdownEpisode ? formatPercent(activeDrawdownEpisode.drawdown) : '当前处于新高' }}
                        </span>
                    </div>
                    <template v-if="activeDrawdownEpisode">
                        <div class="drawdown-attribution-summary">
                            <span>前高 {{ activeDrawdownEpisode.peakDate }}</span>
                            <strong>当前 {{ activeDrawdownEpisode.troughDate }}</strong>
                            <em :class="returnClass(activeDrawdownProfit)">{{ displayMoneyChange(activeDrawdownProfit) }}</em>
                        </div>
                        <div
                            class="drawdown-attribution-list"
                            :class="{ 'single-column': drawdownAttributionRows.length <= 3 }">
                            <div v-for="item in drawdownAttributionRows" :key="item.name" class="drawdown-attribution-row">
                                <div class="attribution-name">
                                    <i :style="{ backgroundColor: item.color }"></i>
                                    <strong>{{ item.name }}</strong>
                                </div>
                                <div class="drawdown-loss-track" :class="{ offset: item.amount >= 0 }">
                                    <span :style="{ width: `${item.share}%` }"></span>
                                </div>
                                <strong :class="returnClass(item.amount)">{{ displayMoneyChange(item.amount) }}</strong>
                                <span>{{ item.share.toFixed(1) }}%</span>
                            </div>
                        </div>
                    </template>
                    <div v-else class="drawdown-attribution-empty">
                        <strong>当前组合处于历史新高</strong>
                        <span>暂无进行中的回撤，无需拆分策略损失。</span>
                    </div>
                </article>
            </section>

            <section class="content-card cash-flow-panel">
                <div class="panel-heading">
                    <div>
                        <h2 class="card-title">资金流记录视图</h2>
                        <p class="card-description">
                            单独查看转入、转出和调拨，避免把资金变化误读成投资收益。
                        </p>
                    </div>
                    <button
                        class="range-select-button"
                        type="button"
                        @click="openRangeModal('cashFlow')">
                        <span>时间范围</span>
                        <strong>{{ rangeLabel(cashFlowPeriod, normalizedCashFlowRange) }}</strong>
                    </button>
                </div>
                <div class="cash-flow-summary">
                    <article>
                        <span>净流入</span>
                        <strong>{{ displayMoney(cashFlowSummary.net) }}</strong>
                    </article>
                    <article>
                        <span>转入</span>
                        <strong class="positive">{{ displayMoney(cashFlowSummary.inflow) }}</strong>
                    </article>
                    <article>
                        <span>转出</span>
                        <strong>{{ displayMoney(cashFlowSummary.outflow) }}</strong>
                    </article>
                    <article>
                        <span>资产影响</span>
                        <strong>{{ cashFlowSummary.assetImpact }}%</strong>
                    </article>
                </div>
                <div class="cash-flow-list">
                    <div class="cash-flow-row cash-flow-head">
                        <span>日期</span><span>类型</span><span>策略名称</span><span>收盘净值</span><span>金额</span><span>备注</span>
                    </div>
                    <div
                        v-for="item in paginatedCashFlowEvents"
                        :key="item.id"
                        class="cash-flow-row">
                        <strong>{{ displayText(item.date) }}</strong>
                        <span :class="item.amount >= 0 ? 'positive' : 'negative'">{{ item.type }}</span>
                        <strong>{{ item.strategy }}</strong>
                        <strong>{{ displayNumber(item.nav.toFixed(4)) }}</strong>
                        <strong :class="item.amount >= 0 ? 'positive' : 'negative'">
                            {{ displayMoneyChange(item.amount) }}
                        </strong>
                        <span>{{ item.note }}</span>
                    </div>
                    <div v-if="filteredCashFlowEvents.length === 0" class="cash-flow-empty">
                        当前区间没有资金流记录
                    </div>
                </div>
                <div v-if="cashFlowPageCount > 1" class="record-pagination">
                    <span>共 {{ filteredCashFlowEvents.length }} 条</span>
                    <div>
                        <button
                            type="button"
                            :disabled="cashFlowPage === 1"
                            @click="cashFlowPage -= 1">
                            上一页
                        </button>
                        <strong>{{ cashFlowPage }} / {{ cashFlowPageCount }}</strong>
                        <button
                            type="button"
                            :disabled="cashFlowPage === cashFlowPageCount"
                            @click="cashFlowPage += 1">
                            下一页
                        </button>
                    </div>
                </div>
            </section>

            <section class="content-card record-panel">
                <div class="panel-heading">
                    <div>
                        <h2 class="card-title">最近记录</h2>
                        <p class="card-description">所有计算均从原始记录重新生成。</p>
                    </div>
                </div>
                <div class="record-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>策略</th>
                                <th>期末金额</th>
                                <th>现金流</th>
                                <th>日收益率</th>
                                <th>单位净值</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in paginatedRecords" :key="row.id">
                                <td>{{ displayText(row.date) }}</td>
                                <td>
                                    <span class="strategy-cell"
                                        ><i :style="{ backgroundColor: row.color }"></i
                                        >{{ row.strategy }}</span
                                    >
                                </td>
                                <td>{{ displayMoney(row.amount) }}</td>
                                <td>{{ row.cashFlow === 0 ? '—' : displayMoney(row.cashFlow) }}</td>
                                <td :class="row.return >= 0 ? 'positive' : 'negative'">
                                    {{ formatPercent(row.return) }}
                                </td>
                                <td>{{ displayNumber(row.nav.toFixed(4)) }}</td>
                                <td>{{ row.note || '—' }}</td>
                                <td>
                                    <div class="row-actions">
                                        <button type="button" @click="openEditRecord(row)">编辑</button>
                                        <button class="danger" type="button" @click="requestDeleteRecord(row)">删除</button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="recordPageCount > 1" class="record-pagination">
                    <span>共 {{ recentRecords.length }} 条</span>
                    <div>
                        <button
                            type="button"
                            :disabled="recordPage === 1"
                            @click="recordPage -= 1">
                            上一页
                        </button>
                        <strong>{{ recordPage }} / {{ recordPageCount }}</strong>
                        <button
                            type="button"
                            :disabled="recordPage === recordPageCount"
                            @click="recordPage += 1">
                            下一页
                        </button>
                    </div>
                </div>
            </section>
            </template>
        </main>

        <Transition name="modal-fade">
            <div
                v-if="showDailyEntryModal"
                class="modal-backdrop">
                <form class="modal-panel daily-modal" @submit.prevent="saveToday">
                    <div class="modal-header">
                        <div>
                            <span>盘后录入</span>
                            <h3>录入今日策略金额</h3>
                        </div>
                        <button
                            type="button"
                            class="icon-button"
                            aria-label="关闭"
                            title="关闭"
                            @click="showDailyEntryModal = false">
                            ×
                        </button>
                    </div>
                    <div class="daily-modal-toolbar">
                        <div class="entry-date">
                            <span>记录日期</span>
                            <strong>{{ displayText(dailyEntryDate) }}</strong>
                        </div>
                        <div class="daily-toolbar-actions">
                            <button
                                class="button secondary featured-action compact-action"
                                type="button"
                                @click="showDailyAdvancedFields = !showDailyAdvancedFields">
                                {{ showDailyAdvancedFields ? '收起' : '现金流/备注' }}
                            </button>
                            <button
                                class="button secondary compact-action"
                                type="button"
                                @click="showDailyNewStrategy = !showDailyNewStrategy">
                                {{ showDailyNewStrategy ? '收起新策略' : '新增策略' }}
                            </button>
                        </div>
                    </div>
                    <div class="entry-grid modal-entry-grid">
                        <div
                            v-for="strategy in strategies"
                            :key="strategy.id"
                            class="entry-item"
                            :class="{ 'has-advanced-fields': showDailyAdvancedFields }">
                            <div class="entry-name">
                                <i :style="{ backgroundColor: strategy.color }"></i>
                                <div>
                                    <strong>{{ strategy.name }}</strong>
                                    <span class="previous-record">
                                        {{ displayMoney(strategy.previous) }}
                                    </span>
                                </div>
                            </div>
                            <label>
                                <span>期末金额</span>
                                <input
                                    v-model.number="dailyEntryAmounts[strategy.id]"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputmode="decimal"
                                    required />
                            </label>
                            <label v-if="showDailyAdvancedFields">
                                <span>当日现金流</span>
                                <input
                                    v-model.number="strategy.cashFlow"
                                    type="number"
                                    step="0.01"
                                    inputmode="decimal"
                                    placeholder="转入为正，转出为负" />
                            </label>
                            <div class="entry-result">
                                <span>预估日收益</span>
                                <strong :class="dailyEstimatedReturnClass(strategy)">
                                    {{ formatDailyEstimatedReturn(strategy) }}
                                </strong>
                            </div>
                            <label v-if="showDailyAdvancedFields" class="entry-note">
                                <span>备注</span>
                                <input
                                    v-model="strategy.note"
                                    type="text"
                                    placeholder="选填，例如定投、调仓或异常说明" />
                            </label>
                        </div>
                        <div
                            v-if="showDailyNewStrategy"
                            class="entry-item new-strategy-entry"
                            :class="{ 'has-advanced-fields': showDailyAdvancedFields }">
                            <div class="entry-name">
                                <i :style="{ backgroundColor: dailyNewStrategy.color }"></i>
                                <div>
                                    <strong>新建策略</strong>
                                    <span>保存后加入当前账本</span>
                                </div>
                            </div>
                            <label>
                                <span>策略名称</span>
                                <input
                                    v-model="dailyNewStrategy.name"
                                    type="text"
                                    maxlength="24"
                                    placeholder="输入新策略名称"
                                    required />
                            </label>
                            <label>
                                <span>期末金额</span>
                                <input
                                    v-model.number="dailyNewStrategy.amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputmode="decimal"
                                    required />
                            </label>
                            <label v-if="showDailyAdvancedFields">
                                <span>当日现金流</span>
                                <input
                                    v-model.number="dailyNewStrategy.cashFlow"
                                    type="number"
                                    step="0.01"
                                    inputmode="decimal"
                                    placeholder="转入为正，转出为负" />
                            </label>
                            <label v-if="showDailyAdvancedFields" class="entry-note">
                                <span>备注</span>
                                <input
                                    v-model="dailyNewStrategy.note"
                                    type="text"
                                    placeholder="选填，例如建仓或资金调拨" />
                            </label>
                        </div>
                    </div>
                    <div class="formula-help">
                        <button class="formula-help-trigger" type="button">计算说明</button>
                        <div class="formula-tooltip" role="tooltip">
                            <div>
                                <span>当日盈亏</span><code>期末金额 - 期初金额 - 当日现金流</code>
                            </div>
                            <div><span>当日收益率</span><code>当日盈亏 ÷ 期初金额</code></div>
                            <div><span>单位净值</span><code>昨日净值 × (1 + 当日收益率)</code></div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button
                            type="button"
                            class="button secondary"
                            @click="showDailyEntryModal = false">
                            取消</button
                        ><button
                            class="button secondary featured-action"
                            type="submit"
                            :disabled="dailySaving">
                            {{ dailySaving ? '保存中...' : '保存今日记录' }}
                        </button>
                    </div>
                </form>
            </div>
        </Transition>

        <Transition name="modal-fade">
            <div v-if="showEntryModal" class="modal-backdrop">
                <form class="modal-panel" @submit.prevent="saveRecord">
                    <div class="modal-header">
                        <div>
                            <span>{{ editingRecordId ? '记录维护' : '历史补录' }}</span>
                            <h3>{{ editingRecordId ? '编辑账本记录' : '新增一条账本记录' }}</h3>
                        </div>
                        <button
                            type="button"
                            class="icon-button"
                            aria-label="关闭"
                            title="关闭"
                            @click="showEntryModal = false">
                            ×
                        </button>
                    </div>
                    <div class="form-grid">
                        <label
                            ><span>记录日期</span
                            ><input v-model="recordForm.date" type="date" required
                        /></label>
                        <label class="strategy-picker-label">
                            <span>策略（可选择已有或新建）</span>
                            <div
                                class="strategy-picker"
                                :class="{ creating: recordStrategySelection === newStrategyOption }">
                                <select
                                    v-model="recordStrategySelection"
                                    @change="handleRecordStrategySelection">
                                    <option
                                        v-for="item in strategies"
                                        :key="item.id"
                                        :value="item.name">
                                        {{ item.name }}
                                    </option>
                                    <option :value="newStrategyOption">新建策略</option>
                                </select>
                                <input
                                    v-if="recordStrategySelection === newStrategyOption"
                                    v-model="recordForm.strategy"
                                    type="text"
                                    placeholder="输入新策略名称"
                                    required />
                            </div>
                        </label>
                        <label
                            ><span>期末金额</span
                            ><input
                                v-model.number="recordForm.amount"
                                type="number"
                                min="0"
                                step="0.01"
                                inputmode="decimal"
                                required
                        /></label>
                        <label
                            ><span>当日现金流（转入为正，转出为负）</span
                            ><input
                                v-model.number="recordForm.cashFlow"
                                type="number"
                                step="0.01"
                                inputmode="decimal"
                        /></label
                        >
                        <label class="wide"
                            ><span>备注</span
                            ><input
                                v-model="recordForm.note"
                                type="text"
                                placeholder="选填，例如：定投、资金调拨"
                        /></label>
                    </div>
                    <div v-if="recordFormWarnings.length" class="form-warning-list">
                        <div v-for="warning in recordFormWarnings" :key="warning">{{ warning }}</div>
                    </div>
                    <div v-if="initialCashFlowPrompt" class="initial-cashflow-prompt">
                        <div>
                            <strong>{{ initialCashFlowPrompt.title }}</strong>
                            <span>{{ initialCashFlowPrompt.detail }}</span>
                        </div>
                        <button type="button" @click="fillInitialCashFlowFromAmount">
                            按期末金额填入现金流
                        </button>
                    </div>
                    <div class="recalc-note">
                        <strong>自动重算</strong
                        ><span>保存后将从该日开始重新计算后续净值。</span>
                    </div>
                    <div class="modal-actions">
                        <button
                            type="button"
                            class="button secondary"
                            @click="showEntryModal = false">
                            取消</button
                        ><button class="button secondary featured-action" type="submit">
                            {{ editingRecordId ? '保存修改' : '保存记录' }}
                        </button>
                    </div>
                </form>
            </div>
        </Transition>

        <Transition name="modal-fade">
            <div v-if="showDeleteModal" class="modal-backdrop">
                <div class="modal-panel compact-modal">
                    <div class="modal-header">
                        <div>
                            <span>删除记录</span>
                            <h3>确认删除这条账本记录？</h3>
                        </div>
                        <button class="icon-button" type="button" aria-label="关闭" @click="showDeleteModal = false">×</button>
                    </div>
                    <p class="confirm-copy">
                        {{ pendingDeleteRecord?.date }} · {{ pendingDeleteRecord?.strategy }}。相关资金流也会同步移除。
                    </p>
                    <div class="modal-actions">
                        <button class="button secondary" type="button" @click="showDeleteModal = false">取消</button>
                        <button class="button danger-button" type="button" @click="confirmDeleteRecord">确认删除</button>
                    </div>
                </div>
            </div>
        </Transition>

        <Transition name="modal-fade">
            <div
                v-if="showStrategyModal"
                class="modal-backdrop">
                <form class="modal-panel compact-modal" @submit.prevent="saveStrategyNames">
                    <div class="modal-header">
                        <div>
                            <span>策略管理</span>
                            <h3>修改策略名称</h3>
                        </div>
                        <button
                            class="icon-button"
                            type="button"
                            aria-label="关闭"
                            @click="showStrategyModal = false">
                            ×
                        </button>
                    </div>
                    <div class="strategy-name-list">
                        <div class="strategy-manager-tips">
                            <span>
                                归档
                                <i class="strategy-help" tabindex="0"
                                    >?<b>适合已经清仓、期末金额为 0 的策略。归档后保留历史记录，但默认不参与当前观察和占比展示。</b></i
                                >
                            </span>
                            <span>
                                删除
                                <i class="strategy-help" tabindex="0"
                                    >?<b>会删除该策略及其全部记录，历史计算也会随之变化。仅在数据录错或确认不再保留时使用。</b></i
                                >
                            </span>
                        </div>
                        <section class="strategy-manager-section">
                            <div class="strategy-manager-section-heading">
                                <strong>当前策略</strong>
                                <span>{{ strategies.length }} 个</span>
                            </div>
                            <div
                                v-for="strategy in strategies"
                                :key="strategy.id"
                                class="strategy-manager-row">
                                <label>
                                    <input
                                        v-model="strategyNameDrafts[strategy.id]"
                                        type="text"
                                        aria-label="策略名称"
                                        placeholder="策略名称"
                                        maxlength="24"
                                        required />
                                </label>
                                <button
                                    class="strategy-archive-button"
                                    type="button"
                                    @click="requestArchiveStrategy(strategy)">
                                    归档策略
                                </button>
                                <button
                                    class="strategy-delete-button"
                                    type="button"
                                    @click="requestDeleteStrategy(strategy)">
                                    删除策略
                                </button>
                            </div>
                        </section>
                        <section class="strategy-manager-section">
                            <div class="strategy-manager-section-heading">
                                <strong>已归档策略</strong>
                                <span>{{ archivedStrategies.length }} 个</span>
                            </div>
                            <p v-if="!archivedStrategies.length" class="strategy-empty-copy">
                                暂无已归档策略。
                            </p>
                            <div
                                v-for="strategy in archivedStrategies"
                                :key="strategy.id"
                                class="strategy-manager-row archived">
                                <label>
                                    <input
                                        v-model="strategyNameDrafts[strategy.id]"
                                        type="text"
                                        aria-label="策略名称"
                                        placeholder="策略名称"
                                        maxlength="24"
                                        required />
                                </label>
                                <button
                                    class="strategy-archive-button"
                                    type="button"
                                    @click="requestRestoreStrategy(strategy)">
                                    启用归档
                                </button>
                                <button
                                    class="strategy-delete-button"
                                    type="button"
                                    @click="requestDeleteStrategy(strategy)">
                                    删除
                                </button>
                            </div>
                        </section>
                    </div>
                    <p v-if="strategyNameError" class="form-error">{{ strategyNameError }}</p>
                    <div class="modal-actions">
                        <button class="button secondary" type="button" @click="showStrategyModal = false">
                            取消
                        </button>
                        <button class="button secondary featured-action" type="submit">保存名称</button>
                    </div>
                </form>
            </div>
        </Transition>

        <Transition name="modal-fade">
            <div v-if="showArchiveStrategyModal" class="modal-backdrop">
                <div class="modal-panel compact-modal">
                    <div class="modal-header">
                        <div>
                            <span>{{ pendingArchiveMode === 'archive' ? '归档策略' : '启用归档' }}</span>
                            <h3>
                                {{
                                    pendingArchiveMode === 'archive'
                                        ? `确认归档“${pendingArchiveStrategy?.name}”？`
                                        : `确认启用“${pendingArchiveStrategy?.name}”？`
                                }}
                            </h3>
                        </div>
                        <button
                            class="icon-button"
                            type="button"
                            aria-label="关闭"
                            @click="showArchiveStrategyModal = false">
                            ×
                        </button>
                    </div>
                    <p class="confirm-copy">
                        {{
                            pendingArchiveMode === 'archive'
                                ? '归档后，该策略不会出现在当前持仓、调仓测算和今日录入默认列表中；历史记录仍会保留并参与历史总账户计算。'
                                : '启用后，该策略会重新回到当前策略列表，并参与当前持仓、调仓测算和今日录入。'
                        }}
                    </p>
                    <div class="modal-actions">
                        <button class="button secondary" type="button" @click="showArchiveStrategyModal = false">
                            取消
                        </button>
                        <button
                            class="button secondary featured-action"
                            type="button"
                            :disabled="strategyArchiving"
                            @click="confirmArchiveStrategy">
                            {{
                                strategyArchiving
                                    ? '处理中...'
                                    : pendingArchiveMode === 'archive'
                                      ? '确认归档'
                                      : '确认启用'
                            }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <Transition name="modal-fade">
            <div v-if="showDeleteStrategyModal" class="modal-backdrop">
                <div class="modal-panel compact-modal">
                    <div class="modal-header">
                        <div>
                            <span>删除策略</span>
                            <h3>确认删除“{{ pendingDeleteStrategy?.name }}”？</h3>
                        </div>
                        <button
                            class="icon-button"
                            type="button"
                            aria-label="关闭"
                            @click="showDeleteStrategyModal = false">
                            ×
                        </button>
                    </div>
                    <p class="confirm-copy">
                        该策略及其 {{ pendingStrategyRecordCount }} 条账本记录都会被永久删除。此操作不可撤销。
                    </p>
                    <div class="modal-actions">
                        <button class="button secondary" type="button" @click="showDeleteStrategyModal = false">
                            取消
                        </button>
                        <button
                            class="button danger-button"
                            type="button"
                            :disabled="strategyDeleting"
                            @click="confirmDeleteStrategy">
                            {{ strategyDeleting ? '删除中...' : '确认删除策略' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <Transition name="modal-fade">
            <div v-if="showMissingDetailModal" class="modal-backdrop">
                <div class="modal-panel missing-detail-modal">
                    <div class="modal-header">
                        <div>
                            <span>数据审计</span>
                            <h3>缺失交易日详情</h3>
                        </div>
                        <button
                            class="icon-button"
                            type="button"
                            aria-label="关闭"
                            @click="showMissingDetailModal = false">
                            ×
                        </button>
                    </div>
                    <p class="modal-muted-copy">
                        以下日期没有覆盖全部策略。忽略后只会隐藏提醒，不会修改账本记录。
                    </p>
                    <div class="missing-detail-list">
                        <div
                            v-for="item in missingRecordDetails"
                            :key="item.key"
                            class="missing-detail-row">
                            <span>{{ item.date }}</span>
                            <strong>{{ item.strategy }}</strong>
                            <button
                                class="text-button"
                                type="button"
                                @click="ignoreMissingRecord(item.key)">
                                忽略
                            </button>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button
                            class="button secondary"
                            type="button"
                            @click="showMissingDetailModal = false">
                            关闭
                        </button>
                        <button
                            class="button secondary featured-action"
                            type="button"
                            :disabled="!missingRecordDetails.length"
                            @click="ignoreAllMissingRecords">
                            忽略当前全部
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <Transition name="modal-fade">
            <div
                v-if="showImportModal"
                class="modal-backdrop">
                <div class="modal-panel import-panel">
                    <div class="modal-header">
                        <div>
                            <span>历史数据迁移</span>
                            <h3>导入 Excel 账本</h3>
                        </div>
                        <button
                            type="button"
                            class="icon-button"
                            aria-label="关闭"
                            title="关闭"
                            @click="showImportModal = false">
                            ×
                        </button>
                    </div>
                    <label
                        class="upload-zone"
                        :class="{ dragging: importDragActive }"
                        @dragenter.prevent="handleImportDragEnter"
                        @dragover.prevent
                        @dragleave.prevent="handleImportDragLeave"
                        @drop.prevent="handleImportDrop">
                        <input type="file" accept=".xlsx,.xls,.csv,.tsv" @change="handleFileSelect" />
                        <span class="upload-mark">XLSX</span>
                        <strong>{{ selectedFileName || '选择或拖入 Excel 文件' }}</strong>
                        <p>
                            系统会识别日期、期末总市值、操作金额和备注。下一步需将每组数据映射到已有策略，或为新策略指定名称；名称之后仍可修改。
                        </p>
                        <small class="upload-limit">单个文件最多支持 2,000 条记录</small>
                    </label>
                    <div class="import-steps" aria-label="导入进度">
                        <div
                            v-for="(step, index) in importSteps"
                            :key="step"
                            :class="{
                                active: importStep === index + 1,
                                complete: importStep > index + 1
                            }">
                            <span>{{ index + 1 }}</span>
                            <strong>{{ step }}</strong>
                        </div>
                    </div>
                    <div v-if="importIssues.length" class="import-issues">
                        <div v-for="issue in importIssues" :key="issue">{{ issue }}</div>
                    </div>
                    <div v-if="importPreviewRows.length" class="import-preview">
                        <div class="import-preview-head">
                            <strong>导入预览</strong>
                            <span>
                                {{ validImportRows.length }} 条可导入 /
                                {{ importPreviewRows.length }} 条已解析
                            </span>
                        </div>
                        <div class="import-preview-table">
                            <div class="import-preview-row header">
                                <span>行号</span>
                                <span>日期</span>
                                <span>策略</span>
                                <span>期末金额</span>
                                <span>现金流</span>
                                <span>状态</span>
                            </div>
                            <div
                                v-for="row in importPreviewRows.slice(0, 8)"
                                :key="`${row.rowNumber}-${row.strategy}-${row.date}`"
                                class="import-preview-row"
                                :class="{ invalid: row.errors.length }">
                                <span>{{ row.rowNumber }}</span>
                                <span>{{ row.date || '-' }}</span>
                                <span>{{ row.strategy || '-' }}</span>
                                <span>{{ row.amount ? formatMoney(row.amount) : '-' }}</span>
                                <span>{{ displayMoneyChange(row.cashFlow) }}</span>
                                <span>{{ row.errors[0] || row.strategyStatus }}</span>
                            </div>
                        </div>
                        <p v-if="importPreviewRows.length > 8" class="import-preview-more">
                            仅展示前 8 条，确认后会导入全部可导入记录。
                        </p>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="button secondary" @click="downloadImportTemplate">
                            下载标准模板</button
                        ><button
                            type="button"
                            class="button secondary featured-action"
                            :disabled="!selectedFileName || importParsing"
                            @click="previewImport">
                            {{ importParsing ? '解析中...' : '解析预览' }}
                        </button>
                        <button
                            type="button"
                            class="button secondary featured-action"
                            :disabled="!validImportRows.length || hasImportErrors || importSaving"
                            @click="confirmImportRecords">
                            {{ importSaving ? '导入中...' : '确认导入' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <Transition name="modal-fade">
            <div v-if="showRangeModal" class="modal-backdrop">
                <form class="modal-panel range-modal" @submit.prevent="confirmRangeModal">
                    <div class="modal-header">
                        <div>
                            <span>日期区间</span>
                            <h3>{{ rangeModalTitle }}</h3>
                        </div>
                        <button
                            type="button"
                            class="icon-button"
                            aria-label="关闭"
                            title="关闭"
                            @click="showRangeModal = false">
                            ×
                        </button>
                    </div>
                    <div class="range-option-grid">
                        <button
                            v-for="period in periods"
                            :key="period"
                            type="button"
                            :class="{ active: modalPeriod === period }"
                            @click="applyModalPeriod(period)">
                            {{ period }}
                        </button>
                    </div>
                    <div class="range-date-fields">
                        <label>
                            <span>开始日期</span>
                            <input
                                v-model="modalRange.start"
                                type="date"
                                :min="performanceMinDate"
                                :max="modalRange.end"
                                @change="modalPeriod = '自定义'" />
                        </label>
                        <label>
                            <span>结束日期</span>
                            <input
                                v-model="modalRange.end"
                                type="date"
                                :min="modalRange.start"
                                :max="performanceMaxDate"
                                @change="modalPeriod = '自定义'" />
                        </label>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="button secondary" @click="showRangeModal = false">
                            取消</button
                        ><button class="button secondary featured-action" type="submit">应用区间</button>
                    </div>
                </form>
            </div>
        </Transition>

        <Transition name="modal-fade">
            <div v-if="showAnnualTargetModal" class="modal-backdrop">
                <form class="modal-panel compact-modal annual-target-modal" @submit.prevent="saveAnnualTarget">
                    <div class="modal-header">
                        <div>
                            <span>年度目标</span>
                            <h3>设置 {{ annualTargetYearLabel }} 年收益目标</h3>
                        </div>
                        <button
                            type="button"
                            class="icon-button"
                            aria-label="关闭"
                            title="关闭"
                            @click="closeAnnualTargetModal">
                            ×
                        </button>
                    </div>
                    <label class="annual-target-field">
                        <span>目标收益金额</span>
                        <div>
                            <b>¥</b>
                            <input
                                v-model.number="annualProfitTargetDraft"
                                type="number"
                                min="0"
                                step="1000"
                                placeholder="例如 100000" />
                        </div>
                        <small>保存到云端账户配置中，同一账号下会自动同步。</small>
                    </label>
                    <div class="annual-target-preview">
                        <span>当前今年收益</span>
                        <strong :class="returnClass(annualTargetProfit)">
                            {{ displayMoneyChange(annualTargetProfit) }}
                        </strong>
                    </div>
                    <div class="modal-actions">
                        <button
                            v-if="hasAnnualProfitTarget"
                            type="button"
                            class="button secondary"
                            :disabled="annualTargetSaving"
                            @click="clearAnnualTarget">
                            清除目标
                        </button>
                        <button
                            type="button"
                            class="button secondary"
                            :disabled="annualTargetSaving"
                            @click="closeAnnualTargetModal">
                            取消
                        </button>
                        <button
                            class="button secondary featured-action"
                            type="submit"
                            :disabled="annualTargetSaving">
                            {{ annualTargetSaving ? '保存中...' : '保存目标' }}
                        </button>
                    </div>
                </form>
            </div>
        </Transition>

    </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import html2canvas from 'html2canvas'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GraphicComponent, GridComponent, LegendComponent, MarkPointComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import FeaturePageIcon from '@/components/FeaturePageIcon.vue'
import StrategyLoading from '@/components/StrategyLoading.vue'
import { callCloudFunction } from '@/services/cloudFunction'
import {
    createLedgerStrategy,
    deleteLedgerRecord,
    deleteLedgerStrategy,
    getLedgerBundle,
    getLedgerRecords,
    renameLedgerStrategy,
    saveLedgerAccount,
    saveLedgerRecord,
    saveLedgerRecords,
    saveDailyLedgerRecords,
    setLedgerStrategyArchived
} from '@/services/investmentLedger'
import type {
    LedgerRecord as RemoteLedgerRecord,
    LedgerStrategy as RemoteLedgerStrategy
} from '@/services/investmentLedger'

use([CanvasRenderer, BarChart, LineChart, PieChart, GraphicComponent, GridComponent, LegendComponent, MarkPointComponent, TooltipComponent])

interface LedgerRecord {
    id: string
    strategyId: string
    date: string
    strategy: string
    nav: number
    amount: number
    cashFlow: number
    return: number
    nav: number
    note: string
    color: string
}

interface CashFlowEvent {
    id: string
    recordId?: string
    date: string
    strategy: string
    amount: number
    type: string
    note: string
}

interface StrategyDraft {
    id: string
    name: string
    amount: number
    previous: number
    cashFlow: number
    note: string
    color: string
    archived: boolean
}

interface ImportPreviewRow {
    rowNumber: number
    date: string
    strategy: string
    amount: number
    cashFlow: number
    note: string
    strategyStatus: string
    errors: string[]
}

type WorksheetCell = string | number | boolean | null
type LedgerMoreAction = () => void | Promise<void>
type PerformanceChartMode = 'nav' | 'assets' | 'profit'
type HeatmapView = 'year' | 'month'
type HeatmapMetric = 'amount' | 'rate'
type HeatmapDisplayMode = 'amount' | 'rate' | 'both'
type ReturnHeatmapCell = {
    key?: string
    period: string
    month?: string
    date?: string
    dayLabel?: string
    profit: number
    return: number
    cashFlow: number
    startAmount: number
    endAmount: number
    hasData: boolean
    empty?: boolean
}

type DrawdownEpisode = {
    id: string
    peakDate: string
    troughDate: string
    recoveryDate: string | null
    drawdown: number
    peakNav: number
    troughNav: number
    recoveryDays: number | null
}
function loadIgnoredMissingKeys() {
    try {
        const value = JSON.parse(localStorage.getItem('investment-ledger-ignored-missing') || '[]')
        return Array.isArray(value) ? value.map(String) : []
    } catch {
        return []
    }
}

const periods = ['近30日', '近90日', '本月', '今年', '全部']
const selectedPeriod = ref('近30日')
const performanceChartMode = ref<PerformanceChartMode>('nav')
const performanceChartModes: Array<{ value: PerformanceChartMode; label: string; hint: string }> = [
    { value: 'nav', label: '时间加权净值', hint: '扣除资金流' },
    { value: 'assets', label: '总金额', hint: '账户规模' },
    { value: 'profit', label: '累计盈亏', hint: '实际赚亏' }
]
const heatmapView = ref<HeatmapView>('month')
const heatmapDisplayMode = ref<HeatmapDisplayMode>('both')
const ACCOUNT_HEATMAP_SCOPE = '__account__'
const heatmapStrategyId = ref(ACCOUNT_HEATMAP_SCOPE)
const selectedHeatmapMonth = ref('')
const heatmapViews: Array<{ value: HeatmapView; label: string }> = [
    { value: 'year', label: '年度视图' },
    { value: 'month', label: '月度视图' }
]
const heatmapDisplayModes: Array<{ value: HeatmapDisplayMode; label: string }> = [
    { value: 'both', label: '双指标' },
    { value: 'rate', label: '收益率' },
    { value: 'amount', label: '收益金额' }
]
const heatmapMonthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const heatmapWeekdays = ['日', '一', '二', '三', '四', '五', '六']
const setPerformanceChartMode = (mode: PerformanceChartMode) => {
    performanceChartMode.value = mode
}
const showDailyEntryModal = ref(false)
const showDailyNewStrategy = ref(false)
const showDailyAdvancedFields = ref(false)
const dailySaving = ref(false)
const showEntryModal = ref(false)
const showImportModal = ref(false)
const showRangeModal = ref(false)
const showDeleteModal = ref(false)
const showStrategyModal = ref(false)
const showDeleteStrategyModal = ref(false)
const showArchiveStrategyModal = ref(false)
const showMissingDetailModal = ref(false)
const showAnnualTargetModal = ref(false)
const annualTargetSaving = ref(false)
const editingRecordId = ref('')
const pendingDeleteRecord = ref<LedgerRecord | null>(null)
const pendingDeleteStrategy = ref<StrategyDraft | null>(null)
const pendingArchiveStrategy = ref<StrategyDraft | null>(null)
const pendingArchiveMode = ref<'archive' | 'restore'>('archive')
const strategyDeleting = ref(false)
const strategyArchiving = ref(false)
const strategyNameDrafts = reactive<Record<string, string>>({})
const strategyNameError = ref('')
const rangeModalTarget = ref('performance')
const modalPeriod = ref('近30日')
const modalRange = reactive({
    start: '',
    end: ''
})
const targetMode = ref(false)
const annualProfitTarget = ref(0)
const annualProfitTargetDraft = ref<number | ''>('')
const selectedFileName = ref('')
const selectedImportFile = ref<File | null>(null)
const importDragActive = ref(false)
const importPreviewRows = ref<ImportPreviewRow[]>([])
const importIssues = ref<string[]>([])
const importParsing = ref(false)
const importSaving = ref(false)
const importSteps = ['选择文件', '解析校验', '确认导入']
const importStep = computed(() => {
    if (importPreviewRows.value.length || importSaving.value) return 3
    return selectedFileName.value ? 2 : 1
})
const ledgerLoading = ref(true)
const ledgerError = ref('')
const ledgerLoaded = ref(false)
const ledgerCaptureTarget = ref<HTMLElement | null>(null)
const returnShareTarget = ref<HTMLElement | null>(null)
const ledgerMoreMenuRef = ref<HTMLElement | null>(null)
const capturingLedgerImage = ref(false)
const exportingReturnImage = ref(false)
const showLedgerMoreMenu = ref(false)
const dailyNewStrategy = reactive({
    name: '',
    amount: 0,
    cashFlow: 0,
    note: '',
    color: '#7aa2f7'
})
const emptyDemoStrategies = [
    { name: '稳健策略', return: 5.84, color: '#4ecdc4' },
    { name: '增强策略', return: 12.36, color: '#f4c95d' },
    { name: '弹性策略', return: -3.18, color: '#ef6f6c' }
]
const emptyDemoOption = {
    animation: false,
    grid: { top: 14, right: 12, bottom: 24, left: 38 },
    tooltip: {
        trigger: 'axis',
        backgroundColor: '#101820',
        borderColor: '#30404f',
        textStyle: { color: '#e8eef5' }
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['1月', '2月', '3月', '4月', '5月', '6月'],
        axisLine: { lineStyle: { color: '#30404f' } },
        axisLabel: { color: '#718294' }
    },
    yAxis: {
        type: 'value',
        min: 0.98,
        axisLabel: { color: '#718294' },
        splitLine: { lineStyle: { color: '#23303c', type: 'dashed' } }
    },
    series: [
        {
            name: '示例组合净值',
            type: 'line',
            smooth: 0.32,
            symbol: 'none',
            data: [1, 1.025, 1.018, 1.064, 1.052, 1.086],
            lineStyle: { width: 3, color: '#4ecdc4' },
            areaStyle: { color: 'rgba(78,205,196,.10)' }
        }
    ]
}
const accountConfig = reactive({
    openingPrincipal: 0,
    openingDate: '',
    annualProfitTargets: {} as Record<string, number>
})
const strategies = reactive<StrategyDraft[]>([])
const archivedStrategies = reactive<StrategyDraft[]>([])
const dailyEntryAmounts = reactive<Record<string, number | ''>>({})
const dailyPreviousDates = reactive<Record<string, string>>({})
const hasStrategies = computed(() => strategies.length > 0)
const managedStrategies = computed(() => [...strategies, ...archivedStrategies])
const showMessage = inject<
    (text: string, type?: 'info' | 'success' | 'error', duration?: number) => void
>('showMessage')
const validImportRows = computed(() => importPreviewRows.value.filter(row => !row.errors.length))
const hasImportErrors = computed(
    () => importIssues.value.length > 0 || importPreviewRows.value.some(row => row.errors.length > 0)
)
let importDragDepth = 0

const allocationData = reactive<Array<{ name: string; current: number; target: number; amount: number; color: string }>>([])

const allocationRows = computed(() =>
    allocationData.map(item => {
        const deviation = item.current - item.target

        return {
            ...item,
            deviation,
            adjustAmount: ((item.target - item.current) / 100) * totalAssets.value
        }
    })
)
const targetTotal = computed(() =>
    allocationData.reduce((total, item) => total + Number(item.target || 0), 0)
)
const roundPercentInput = (value: number) => Number(Number(value || 0).toFixed(2))
const maxDeviation = computed(() =>
    allocationRows.value.length
        ? Math.max(...allocationRows.value.map(item => Math.abs(item.deviation)))
        : 0
)
const rebalanceAmount = computed(
    () =>
        allocationRows.value.reduce((total, item) => total + Math.abs(item.adjustAmount), 0) / 2
)
const rebalanceActions = computed(() =>
    allocationRows.value
        .filter(item => Math.abs(item.adjustAmount) >= 1)
        .sort((a, b) => Math.abs(b.adjustAmount) - Math.abs(a.adjustAmount))
)

const periodReturnRows = reactive<
    Array<{
        type: string
        name: string
        day: number
        week: number
        month: number
        year: number
        range: number
        note: string
        color: string
    }>
>([])

const accountSignals = computed(() =>
    hasLedgerData.value
        ? [
              {
                  label: '回撤历史分位',
                  value: formatPlainPercent(drawdownPercentile.value),
                  hint: '越高代表越接近历史深度回撤',
                  help: '算法：统计组合历史每个记录日的回撤深度，计算其中小于或等于当前回撤深度的占比。数值越高，说明当前回撤越接近历史深度区间。',
                  progress: drawdownPercentile.value,
                  tone: 'accent'
              },
              {
                  label: '数据完整度',
                  value: `${Math.round(dataCompleteness.value)}%`,
                  hint: '按已有日期和策略数量估算',
                  help: '',
                  progress: dataCompleteness.value,
                  tone: 'accent'
              }
          ]
        : []
)

const strategyDetails = reactive<
    Array<{
        name: string
        nav: string
        currentDrawdown: string
        maxDrawdown: string
        highStatus: string
        highDistance: number
        highProgress: number
        highDays: number
        drawdownPercentile: number
        color: string
    }>
>([])

const attributionRows = reactive<
    Array<{
        name: string
        weight: number
        return: number
        contribution: number
        amount: number
        note: string
        color: string
    }>
>([])

const recoveryMilestones = computed(() => {
    if (!hasLedgerData.value) return []

    const depth = Math.abs(Math.min(currentDrawdown.value, 0))
    const dynamicTargets = [
        {
            targetDrawdown: -(depth * 2) / 3,
            note: '完成约三分之一修复，观察下跌压力是否持续缓和'
        },
        {
            targetDrawdown: -depth / 3,
            note: '完成约三分之二修复，确认净值恢复是否具有连续性'
        },
        {
            targetDrawdown: -depth / 10,
            note: '接近前高，重点观察是否能延续修复并突破'
        },
        {
            targetDrawdown: 0,
            note: '本轮回撤结束，后续重新记录新高周期'
        }
    ]

    return dynamicTargets
        .map((item, index) => ({
            ...item,
            label:
                index === dynamicTargets.length - 1
                    ? '重新创历史新高'
                    : `回撤收窄到 ${item.targetDrawdown.toFixed(2)}%`,
            done: currentDrawdown.value >= item.targetDrawdown
        }))
        .map(item => {
              const requiredReturn = requiredReturnToDrawdown(item.targetDrawdown)
              const estimatedRecoveryDays = estimateRecoveryDays(item.targetDrawdown)
              const estimatedDays = item.done
                  ? '已达到'
                  : estimatedRecoveryDays === null
                    ? recoveryMilestoneFallbackLabel.value
                    : estimatedRecoveryDays > 250
                      ? '超过 250 天'
                      : `约 ${estimatedRecoveryDays} 天`

              return {
                  ...item,
                  requiredReturn: `还需上涨 ${requiredReturn.toFixed(2)}%`,
                  estimatedDays
              }
          })
})

const cashFlowEvents = ref<CashFlowEvent[]>([])

const cashFlowPeriod = ref('近30日')
const cashFlowRange = reactive({
    start: '',
    end: ''
})
const attributionPeriod = ref('本月')
const showAttributionReturnHelp = ref(false)
const showAttributionProfitHelp = ref(false)
const attributionRange = reactive({
    start: '',
    end: ''
})
const comparisonPeriod = ref('近30日')
const showComparisonRange = ref(false)
const comparisonRange = reactive({
    start: '',
    end: ''
})
const ignoredMissingKeys = ref<string[]>(
    loadIgnoredMissingKeys()
)
const normalizedCashFlowRange = computed(() => {
    const start = clampDate(cashFlowRange.start || performanceMinDate.value)
    const end = clampDate(cashFlowRange.end || performanceMaxDate.value)

    return start <= end ? { start, end } : { start: end, end: start }
})
const filteredCashFlowEvents = computed(() => {
    const { start, end } = normalizedCashFlowRange.value

    return cashFlowEvents.value.filter(item => item.date >= start && item.date <= end)
})
const cashFlowPage = ref(1)
const cashFlowPageSize = 10
const cashFlowPageCount = computed(() =>
    Math.max(Math.ceil(filteredCashFlowEvents.value.length / cashFlowPageSize), 1)
)
const paginatedCashFlowEvents = computed(() => {
    const safePage = Math.min(cashFlowPage.value, cashFlowPageCount.value)
    const start = (safePage - 1) * cashFlowPageSize
    return filteredCashFlowEvents.value.slice(start, start + cashFlowPageSize)
})
const cashFlowSummary = computed(() => {
    const inflow = filteredCashFlowEvents.value
        .filter(item => item.amount > 0)
        .reduce((total, item) => total + item.amount, 0)
    const outflow = Math.abs(
        filteredCashFlowEvents.value
            .filter(item => item.amount < 0)
            .reduce((total, item) => total + item.amount, 0)
    )
    const net = inflow - outflow

    return {
        inflow,
        outflow,
        net,
        assetImpact: totalAssets.value ? ((net / totalAssets.value) * 100).toFixed(2) : '0.00'
    }
})

const recentRecords = ref<LedgerRecord[]>([])
const heatmapStrategyOptions = computed(() => {
    const strategiesById = new Map(managedStrategies.value.map(strategy => [strategy.id, strategy]))
    const recordedStrategies = new Map<string, { name: string; color: string }>()

    recentRecords.value.forEach(record => {
        if (!record.strategyId || recordedStrategies.has(record.strategyId)) return
        recordedStrategies.set(record.strategyId, {
            name: record.strategy,
            color: record.color
        })
    })

    const strategyOptions = [...recordedStrategies.entries()]
        .map(([value, record]) => {
            const strategy = strategiesById.get(value)
            return {
                value,
                label: `${strategy?.name || record.name}${strategy?.archived ? '（已归档）' : ''}`,
                color: strategy?.color || record.color,
                archived: Boolean(strategy?.archived)
            }
        })
        .sort((a, b) => Number(a.archived) - Number(b.archived) || a.label.localeCompare(b.label, 'zh-CN'))

    return [
        { value: ACCOUNT_HEATMAP_SCOPE, label: '整体账户', color: '#f8fafc', archived: false },
        ...strategyOptions
    ]
})
const selectedHeatmapStrategyOption = computed(() =>
    heatmapStrategyOptions.value.find(option => option.value === heatmapStrategyId.value)
)
const selectedHeatmapStrategyColor = computed(
    () => selectedHeatmapStrategyOption.value?.color || '#f8fafc'
)
const heatmapStrategySelectWidth = computed(() => {
    const labelLength = Array.from(selectedHeatmapStrategyOption.value?.label || '整体账户').length
    return Math.min(Math.max(labelLength * 16 + 66, 132), 260)
})
const recordPage = ref(1)
const recordPageSize = 10
const recordPageCount = computed(() =>
    Math.max(Math.ceil(recentRecords.value.length / recordPageSize), 1)
)
const paginatedRecords = computed(() => {
    const safePage = Math.min(recordPage.value, recordPageCount.value)
    const start = (safePage - 1) * recordPageSize
    return recentRecords.value.slice(start, start + recordPageSize)
})
const pendingStrategyRecordCount = computed(() =>
    pendingDeleteStrategy.value
        ? recentRecords.value.filter(
              record => record.strategyId === pendingDeleteStrategy.value?.id
          ).length
        : 0
)

const recordForm = reactive({
    date: '',
    strategyId: '',
    strategy: '',
    amount: 0,
    cashFlow: 0,
    note: ''
})
const initialCashFlowPrompt = computed(() => {
    const amount = Number(recordForm.amount || 0)
    const cashFlow = Number(recordForm.cashFlow || 0)
    if (amount <= 0 || Math.abs(amount - cashFlow) <= 0.01) return null

    const selectedStrategyId =
        recordForm.strategyId ||
        strategies.find(strategy => strategy.name === recordForm.strategy.trim())?.id ||
        ''
    const otherRecords = recentRecords.value.filter(record => record.id !== editingRecordId.value)
    const hasEarlierAccountRecord = otherRecords.some(record => record.date < recordForm.date)
    const hasEarlierStrategyRecord = otherRecords.some(
        record =>
            record.strategyId === selectedStrategyId && record.date < recordForm.date
    )
    if (hasEarlierStrategyRecord) return null

    if (!hasEarlierAccountRecord && accountConfig.openingPrincipal <= 0) {
        return {
            title: '请确认首笔资金来源',
            detail: '这是账户的首批记录。若期末金额属于初始投入，现金流通常应填写为等额转入，否则系统会把未说明来源的资产计入盈利。'
        }
    }

    if (hasEarlierAccountRecord) {
        return {
            title: '这是该策略的首笔记录',
            detail: '若资金来自新增投入，可填写等额正现金流；若来自其他策略调拨，请同时在转出策略填写等额负现金流，使账户净现金流保持为零。'
        }
    }

    return null
})
const fillInitialCashFlowFromAmount = () => {
    recordForm.cashFlow = Number(recordForm.amount || 0)
}
const newStrategyOption = '__new_strategy__'
const recordStrategySelection = ref('')
const handleRecordStrategySelection = () => {
    const selectedStrategy = strategies.find(item => item.name === recordStrategySelection.value)
    recordForm.strategyId = selectedStrategy?.id || ''
    recordForm.strategy =
        recordStrategySelection.value === newStrategyOption
            ? ''
            : recordStrategySelection.value
}
watch(
    () => strategies.map(item => item.name).join('|'),
    () => {
        if (
            showEntryModal.value &&
            !recordForm.strategy &&
            recordStrategySelection.value === newStrategyOption &&
            strategies[0]
        ) {
            recordForm.strategyId = strategies[0].id
            recordForm.strategy = strategies[0].name
            recordStrategySelection.value = strategies[0].name
        }
    }
)

const getShanghaiDateString = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date)
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
    return `${values.year}-${values.month}-${values.day}`
}
const todayDate = getShanghaiDateString()
const defaultLedgerEntryDate = ref(todayDate)
const dailyEntryDate = computed(() => defaultLedgerEntryDate.value || todayDate)
const sortedRecordsAsc = computed(() =>
    [...recentRecords.value].sort((a, b) => a.date.localeCompare(b.date) || a.strategy.localeCompare(b.strategy))
)
const latestLedgerDate = computed(() => sortedRecordsAsc.value.at(-1)?.date || accountConfig.openingDate || todayDate)
const firstLedgerDate = computed(() => sortedRecordsAsc.value[0]?.date || accountConfig.openingDate || todayDate)
const latestLedgerDateLabel = computed(() => {
    const [year, month, day] = latestLedgerDate.value.split('-')
    return year && month && day ? `${year}年${month}月${day}日` : latestLedgerDate.value
})
const recordsOnLatestDate = computed(() =>
    strategies
        .map(strategy =>
            sortedRecordsAsc.value
                .filter(record => record.strategyId === strategy.id)
                .at(-1)
        )
        .filter((record): record is LedgerRecord => Boolean(record))
)
const totalAssets = computed(() =>
    recordsOnLatestDate.value.reduce((total, item) => total + Number(item.amount || 0), 0)
)
const hasLedgerData = computed(() => recentRecords.value.length > 0)
const showEmptyState = computed(() => ledgerLoaded.value && !hasLedgerData.value)
const ledgerStatusText = computed(() => {
    if (ledgerLoading.value) return '正在读取云端账本'
    if (ledgerError.value) return `读取失败 · ${ledgerError.value}`
    return hasLedgerData.value ? `更新至 ${latestLedgerDate.value}` : '暂无数据'
})

const calculateXirr = (cashFlows: Array<{ date: string; amount: number }>) => {
    const amountsByDate = new Map<string, number>()
    cashFlows.forEach(item => {
        amountsByDate.set(item.date, (amountsByDate.get(item.date) || 0) + item.amount)
    })
    const mergedFlows = [...amountsByDate.entries()]
        .map(([date, amount]) => ({ date, amount }))
        .filter(item => Math.abs(item.amount) > 0.000001)
        .sort((a, b) => a.date.localeCompare(b.date))
    const hasPositive = mergedFlows.some(item => item.amount > 0)
    const hasNegative = mergedFlows.some(item => item.amount < 0)

    if (mergedFlows.length < 2 || !hasPositive || !hasNegative) {
        return { value: null, status: 'insufficient' as const }
    }

    const start = Date.parse(`${mergedFlows[0].date}T00:00:00Z`)
    const npvFromLogGrowth = (logGrowth: number) =>
        mergedFlows.reduce((total, item) => {
            const days = (Date.parse(`${item.date}T00:00:00Z`) - start) / 86400000
            return total + item.amount * Math.exp((-logGrowth * days) / 365)
        }, 0)
    const minLogGrowth = Math.log(0.0001)
    const maxLogGrowth = Math.log(1000001)
    const scanSteps = 800
    const roots: number[] = []
    let previousLogGrowth = minLogGrowth
    let previousValue = npvFromLogGrowth(previousLogGrowth)

    for (let index = 1; index <= scanSteps; index += 1) {
        const currentLogGrowth =
            minLogGrowth + ((maxLogGrowth - minLogGrowth) * index) / scanSteps
        const currentValue = npvFromLogGrowth(currentLogGrowth)

        if (Number.isFinite(previousValue) && Number.isFinite(currentValue)) {
            if (Math.abs(currentValue) < 0.000001) roots.push(currentLogGrowth)
            else if (previousValue * currentValue < 0) {
                let low = previousLogGrowth
                let high = currentLogGrowth
                let lowValue = previousValue
                for (let iteration = 0; iteration < 100; iteration += 1) {
                    const middle = (low + high) / 2
                    const middleValue = npvFromLogGrowth(middle)
                    if (lowValue * middleValue <= 0) high = middle
                    else {
                        low = middle
                        lowValue = middleValue
                    }
                }
                roots.push((low + high) / 2)
            }
        }

        previousLogGrowth = currentLogGrowth
        previousValue = currentValue
    }

    const uniqueRoots = roots.filter(
        (root, index) => index === 0 || Math.abs(root - roots[index - 1]) > 0.000001
    )
    if (uniqueRoots.length > 1) return { value: null, status: 'ambiguous' as const }
    if (!uniqueRoots.length) return { value: null, status: 'no-solution' as const }

    return {
        value: (Math.exp(uniqueRoots[0]) - 1) * 100,
        status: 'ok' as const
    }
}

const accountSummary = computed(() => {
    const additionalInflow = cashFlowEvents.value
        .filter(item => item.amount > 0)
        .reduce((total, item) => total + item.amount, 0)
    const totalOutflow = Math.abs(
        cashFlowEvents.value
            .filter(item => item.amount < 0)
            .reduce((total, item) => total + item.amount, 0)
    )
    const totalInflow = accountConfig.openingPrincipal + additionalInflow
    const investedPrincipal = totalInflow - totalOutflow
    const profit = totalAssets.value - investedPrincipal
    const investorCashFlows = [
        ...(accountConfig.openingDate && accountConfig.openingPrincipal
            ? [{ date: accountConfig.openingDate, amount: -accountConfig.openingPrincipal }]
            : []),
        ...cashFlowEvents.value.map(item => ({ date: item.date, amount: -item.amount })),
        ...(hasLedgerData.value ? [{ date: latestLedgerDate.value, amount: totalAssets.value }] : [])
    ].sort((a, b) => a.date.localeCompare(b.date))
    const xirr = calculateXirr(investorCashFlows)
    const moneyWeightedReturnHint =
        xirr.status === 'ambiguous'
            ? '现金流存在多个可能收益率'
            : xirr.status === 'no-solution'
              ? '当前现金流无法得到有效年化收益率'
              : xirr.status === 'insufficient'
                ? '现金流样本不足'
                : '计入资金流时间'

    return {
        totalInflow,
        totalOutflow,
        investedPrincipal,
        profit,
        cumulativeReturn: investedPrincipal ? (profit / investedPrincipal) * 100 : 0,
        moneyWeightedReturn: xirr.value,
        moneyWeightedReturnHint
    }
})
const annualTargetYearLabel = computed(() => todayDate.slice(0, 4))
const annualTargetYearStart = computed(() => `${annualTargetYearLabel.value}-01-01`)
const hasAnnualProfitTarget = computed(() => annualProfitTarget.value > 0)
const recordsGroupedByDate = computed(() => {
    const groups = new Map<string, LedgerRecord[]>()

    sortedRecordsAsc.value.forEach(record => {
        if (!groups.has(record.date)) groups.set(record.date, [])
        groups.get(record.date)?.push(record)
    })

    return [...groups.entries()]
        .map(([date, records]) => ({
            date,
            records,
            total: records.reduce((sum, record) => sum + Number(record.amount || 0), 0),
            cashFlow: records.reduce((sum, record) => sum + Number(record.cashFlow || 0), 0)
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
})
const annualTargetProfit = computed(() => {
    const yearStart = annualTargetYearStart.value
    const yearEnd = `${annualTargetYearLabel.value}-12-31`
    const yearGroups = recordsGroupedByDate.value.filter(
        group => group.date >= yearStart && group.date <= yearEnd
    )

    if (!yearGroups.length) return 0

    const latestGroup = yearGroups.at(-1)
    if (!latestGroup) return 0

    const previousGroup = recordsGroupedByDate.value
        .filter(group => group.date < yearStart)
        .at(-1)
    const firstYearGroup = yearGroups[0]
    const baselineAssets = previousGroup
        ? previousGroup.total
        : Math.max(firstYearGroup.total - firstYearGroup.cashFlow, 0)
    const netCashFlow = cashFlowEvents.value
        .filter(item => item.date >= yearStart && item.date <= latestGroup.date)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)

    return latestGroup.total - baselineAssets - netCashFlow
})
const annualTargetProgress = computed(() =>
    annualProfitTarget.value ? (annualTargetProfit.value / annualProfitTarget.value) * 100 : 0
)
const annualTargetProgressWidth = computed(() =>
    Math.max(0, Math.min(100, annualTargetProgress.value))
)
const annualTargetProgressLabel = computed(() =>
    `${annualTargetProgress.value > 0 ? '+' : ''}${annualTargetProgress.value.toFixed(2)}%`
)
const annualTargetGap = computed(() => annualProfitTarget.value - annualTargetProfit.value)
const hasAnnualTargetPreview = computed(
    () => hasAnnualProfitTarget.value
)
const annualTargetDisplayTarget = computed(() =>
    annualProfitTarget.value
)
const annualTargetDisplayProfit = computed(() =>
    annualTargetProfit.value
)
const annualTargetDisplayProgress = computed(() =>
    annualTargetDisplayTarget.value
        ? (annualTargetDisplayProfit.value / annualTargetDisplayTarget.value) * 100
        : 0
)
const annualTargetDisplayProgressWidth = computed(() =>
    Math.max(0, Math.min(100, annualTargetDisplayProgress.value))
)
const annualTargetDisplayProgressLabel = computed(
    () =>
        `${annualTargetDisplayProgress.value > 0 ? '+' : ''}${annualTargetDisplayProgress.value.toFixed(2)}%`
)
const annualTargetDisplayGap = computed(
    () => annualTargetDisplayTarget.value - annualTargetDisplayProfit.value
)

const duplicateRecordGroups = computed(() => {
    const counts = new Map<string, number>()
    recentRecords.value.forEach(item => {
        const key = `${item.date}-${item.strategy}`
        counts.set(key, (counts.get(key) || 0) + 1)
    })
    return [...counts.entries()].filter(([, count]) => count > 1)
})

const anomalyRecords = computed(() => {
    const anomalies: LedgerRecord[] = []
    strategies.forEach(strategy => {
        const rows = recentRecords.value
            .filter(item => item.strategyId === strategy.id)
            .sort((a, b) => a.date.localeCompare(b.date))
        rows.forEach((row, index) => {
            const previous = rows[index - 1]
            if (!previous?.amount) return
            const adjustedChange = Math.abs((row.amount - previous.amount - row.cashFlow) / previous.amount)
            if (adjustedChange >= 0.12) anomalies.push(row)
        })
    })
    return anomalies
})

const allMissingRecordDetails = computed(() => {
    const tradingDates = [...new Set(recentRecords.value.map(item => item.date))].sort()
    const recordsByStrategy = new Map<string, Set<string>>()
    recentRecords.value.forEach(item => {
        if (!recordsByStrategy.has(item.strategyId)) recordsByStrategy.set(item.strategyId, new Set())
        recordsByStrategy.get(item.strategyId)?.add(item.date)
    })

    return strategies
        .flatMap(strategy => {
            const strategyDates = recordsByStrategy.get(strategy.id)
            if (!strategyDates?.size) return []

            const firstStrategyDate = [...strategyDates].sort()[0]
            return tradingDates
                .filter(
                    date =>
                        date >= firstStrategyDate &&
                        date <= latestLedgerDate.value &&
                        !strategyDates.has(date)
                )
                .map(date => ({
                    key: `${date}__${strategy.name}`,
                    date,
                    strategy: strategy.name
                }))
        })
        .sort((a, b) => b.date.localeCompare(a.date) || a.strategy.localeCompare(b.strategy))
})

const missingRecordDetails = computed(() =>
    allMissingRecordDetails.value.filter(item => !ignoredMissingKeys.value.includes(item.key))
)

const incompleteDates = computed(() => {
    const dates = new Set(missingRecordDetails.value.map(item => item.date))

    return [...dates].sort((a, b) => b.localeCompare(a))
})

const dataQualityAlerts = computed(() => [
    {
        label: '重复日期提醒',
        value: duplicateRecordGroups.value.length ? `${duplicateRecordGroups.value.length} 组` : '无重复',
        detail: duplicateRecordGroups.value.length ? '同一策略同一天存在多条记录，请核对。' : '日期与策略组合均唯一。',
        tone: duplicateRecordGroups.value.length ? 'danger' : 'ok',
        clickable: false
    },
    {
        label: '金额异常提醒',
        value: anomalyRecords.value.length ? `${anomalyRecords.value.length} 条` : '无异常',
        detail: anomalyRecords.value.length ? '扣除现金流后，金额单次变化超过 12%。' : '近期金额变化处于正常范围。',
        tone: anomalyRecords.value.length ? 'danger' : 'ok',
        clickable: false
    },
    {
        label: '缺失交易日提醒',
        value: incompleteDates.value.length ? `${incompleteDates.value.length} 日` : '记录完整',
        detail: incompleteDates.value.length
            ? `待补齐：${incompleteDates.value.slice(0, 2).join('、')}${incompleteDates.value.length > 2 ? '…' : ''}`
            : '已有日期均包含全部策略。',
        tone: incompleteDates.value.length ? 'warning' : 'ok',
        clickable: incompleteDates.value.length > 0
    }
])

const persistIgnoredMissingKeys = () => {
    localStorage.setItem('investment-ledger-ignored-missing', JSON.stringify(ignoredMissingKeys.value))
}
const ignoreMissingRecord = (key: string) => {
    ignoredMissingKeys.value = [...new Set([...ignoredMissingKeys.value, key])]
    persistIgnoredMissingKeys()
    if (!missingRecordDetails.value.length) showMissingDetailModal.value = false
}
const ignoreAllMissingRecords = () => {
    ignoredMissingKeys.value = [
        ...new Set([...ignoredMissingKeys.value, ...missingRecordDetails.value.map(item => item.key)])
    ]
    persistIgnoredMissingKeys()
    showMissingDetailModal.value = false
}
const openAuditAlertDetail = (label: string) => {
    if (label === '缺失交易日提醒' && missingRecordDetails.value.length) {
        showMissingDetailModal.value = true
    }
}

const recordFormWarnings = computed(() => {
    const warnings: string[] = []
    const duplicate = recentRecords.value.find(
        item =>
            item.id !== editingRecordId.value &&
            item.date === recordForm.date &&
            item.strategy === recordForm.strategy
    )
    if (duplicate) warnings.push('该策略在这个日期已经有一条记录，保存后会形成重复日期。')

    const comparison = recentRecords.value
        .filter(item => item.id !== editingRecordId.value && item.strategy === recordForm.strategy)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
    if (comparison?.amount && recordForm.amount > 0) {
        const adjustedChange = Math.abs(
            (recordForm.amount - comparison.amount - Number(recordForm.cashFlow || 0)) / comparison.amount
        )
        if (adjustedChange >= 0.12) warnings.push('扣除现金流后，金额变化超过 12%，请确认是否录入正确。')
    }
    return warnings
})

const aggregateRecordsByDate = computed(() => {
    const recordsByDate = new Map<string, LedgerRecord[]>()

    sortedRecordsAsc.value.forEach(record => {
        const rows = recordsByDate.get(record.date) || []
        rows.push(record)
        recordsByDate.set(record.date, rows)
    })

    const latestAmountByStrategy = new Map<string, number>()
    return [...recordsByDate.keys()]
        .sort((a, b) => a.localeCompare(b))
        .map(date => {
            const rows = recordsByDate.get(date) || []
            rows.forEach(record => {
                latestAmountByStrategy.set(record.strategyId, Number(record.amount || 0))
            })

            return {
                date,
                amount: [...latestAmountByStrategy.values()].reduce(
                    (total, amount) => total + amount,
                    0
                ),
                cashFlow: rows.reduce(
                    (total, record) => total + Number(record.cashFlow || 0),
                    0
                )
            }
        })
})
const heatmapRecordsByDate = computed(() => {
    if (heatmapStrategyId.value === ACCOUNT_HEATMAP_SCOPE) return aggregateRecordsByDate.value

    const recordsByDate = new Map<string, LedgerRecord[]>()
    sortedRecordsAsc.value
        .filter(record => record.strategyId === heatmapStrategyId.value)
        .forEach(record => {
            const rows = recordsByDate.get(record.date) || []
            rows.push(record)
            recordsByDate.set(record.date, rows)
        })

    return [...recordsByDate.entries()]
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, rows]) => ({
            date,
            amount: Number(rows.at(-1)?.amount || 0),
            cashFlow: rows.reduce((total, record) => total + Number(record.cashFlow || 0), 0)
        }))
})
const calculateActualReturnPeriod = (startDate: string, endDate: string): ReturnHeatmapCell => {
    const records = heatmapRecordsByDate.value
    const rows = records.filter(item => item.date >= startDate && item.date <= endDate)

    if (!rows.length) {
        return {
            period: startDate,
            profit: 0,
            return: 0,
            cashFlow: 0,
            startAmount: 0,
            endAmount: 0,
            hasData: false
        }
    }

    const first = rows[0]
    const last = rows.at(-1) || first
    const previous = records.filter(item => item.date < startDate).at(-1)
    const firstRecordIndex = records.findIndex(item => item.date === first.date)
    const startAmount = previous ? previous.amount : Math.max(first.amount - first.cashFlow, 0)
    const cashFlow = rows.reduce((total, item) => total + Number(item.cashFlow || 0), 0)
    const profit = last.amount - startAmount - cashFlow
    const timeWeightedGrowth = rows.reduce((growth, item, index) => {
        const previousItem = records[firstRecordIndex + index - 1]
        if (!previousItem?.amount || previousItem.amount <= 0) return growth

        const dailyReturn =
            (item.amount - previousItem.amount - Number(item.cashFlow || 0)) /
            previousItem.amount
        return growth * (1 + dailyReturn)
    }, 1)

    return {
        period: startDate,
        profit,
        return: (timeWeightedGrowth - 1) * 100,
        cashFlow,
        startAmount,
        endAmount: last.amount,
        hasData: true
    }
}
const dailyActualReturnRows = computed<ReturnHeatmapCell[]>(() =>
    heatmapRecordsByDate.value.map((item, index) => {
        const previous = heatmapRecordsByDate.value[index - 1]
        const startAmount = previous ? previous.amount : Math.max(item.amount - item.cashFlow, 0)
        const profit = previous ? item.amount - previous.amount - item.cashFlow : 0

        return {
            key: item.date,
            period: item.date,
            date: item.date,
            profit,
            return: startAmount ? (profit / startAmount) * 100 : 0,
            cashFlow: item.cashFlow,
            startAmount,
            endAmount: item.amount,
            hasData: true
        }
    })
)
const dailyExtremeMode = ref<'rate' | 'amount'>('rate')
const accountDailyReturnRows = computed<ReturnHeatmapCell[]>(() =>
    aggregateRecordsByDate.value.slice(1).map((item, index) => {
        const previous = aggregateRecordsByDate.value[index]
        const profit = item.amount - previous.amount - item.cashFlow

        return {
            key: item.date,
            period: item.date,
            date: item.date,
            profit,
            return: previous.amount ? (profit / previous.amount) * 100 : 0,
            cashFlow: item.cashFlow,
            startAmount: previous.amount,
            endAmount: item.amount,
            hasData: true
        }
    })
)
const dailyExtremeRanks = computed(() => {
    const metric = dailyExtremeMode.value === 'rate' ? 'return' : 'profit'
    const rows = accountDailyReturnRows.value.filter(item => Number.isFinite(item[metric]))

    return {
        best: [...rows].sort((a, b) => b[metric] - a[metric]).slice(0, 10),
        worst: [...rows].sort((a, b) => a[metric] - b[metric]).slice(0, 10)
    }
})
const formatDailyExtremeValue = (item: ReturnHeatmapCell) =>
    dailyExtremeMode.value === 'rate'
        ? formatPercent(item.return)
        : displayMoneyChange(item.profit)
const annualHeatmapRows = computed(() => {
    const years = [
        ...new Set(heatmapRecordsByDate.value.map(item => item.date.slice(0, 4)))
    ].sort((a, b) => b.localeCompare(a))

    return years.map(year => {
        const months = Array.from({ length: 12 }, (_, index) => {
            const month = String(index + 1).padStart(2, '0')
            const period = `${year}-${month}`
            const cell = calculateActualReturnPeriod(`${period}-01`, `${period}-31`)

            return {
                ...cell,
                key: period,
                period,
                month
            }
        })
        const total = calculateActualReturnPeriod(`${year}-01-01`, `${year}-12-31`)

        return {
            year,
            months,
            total: {
                ...total,
                key: `${year}-total`,
                period: year
            }
        }
    })
})
const availableHeatmapMonths = computed(() =>
    [
        ...new Set(
            heatmapRecordsByDate.value
                .filter(item => item.date)
                .map(item => item.date.slice(0, 7))
        )
    ].sort((a, b) => b.localeCompare(a))
)
const selectedHeatmapMonthValue = computed(() => {
    const months = availableHeatmapMonths.value
    if (selectedHeatmapMonth.value && months.includes(selectedHeatmapMonth.value)) {
        return selectedHeatmapMonth.value
    }
    return months[0] || todayDate.slice(0, 7)
})
watch(heatmapStrategyId, () => {
    if (
        selectedHeatmapMonth.value &&
        !availableHeatmapMonths.value.includes(selectedHeatmapMonth.value)
    ) {
        selectedHeatmapMonth.value = availableHeatmapMonths.value[0] || ''
    }
})
watch(
    () => heatmapStrategyOptions.value.map(option => option.value),
    availableStrategies => {
        if (!availableStrategies.includes(heatmapStrategyId.value)) {
            heatmapStrategyId.value = ACCOUNT_HEATMAP_SCOPE
        }
    }
)
const selectedMonthReturn = computed(() =>
    calculateActualReturnPeriod(
        `${selectedHeatmapMonthValue.value}-01`,
        `${selectedHeatmapMonthValue.value}-31`
    )
)
const monthlyCalendarCells = computed<ReturnHeatmapCell[]>(() => {
    const month = selectedHeatmapMonthValue.value
    const [yearValue, monthValue] = month.split('-').map(Number)
    const daysInMonth = new Date(Date.UTC(yearValue, monthValue, 0)).getUTCDate()
    const firstWeekday = new Date(Date.UTC(yearValue, monthValue - 1, 1)).getUTCDay()
    const leadingBlanks = firstWeekday
    const rowByDate = new Map(dailyActualReturnRows.value.map(item => [item.date || '', item]))
    const cells: ReturnHeatmapCell[] = Array.from({ length: leadingBlanks }, (_, index) => ({
        key: `blank-${month}-${index}`,
        period: '',
        dayLabel: '',
        profit: 0,
        return: 0,
        cashFlow: 0,
        startAmount: 0,
        endAmount: 0,
        hasData: false,
        empty: true
    }))

    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = `${month}-${String(day).padStart(2, '0')}`
        const row = rowByDate.get(date)
        cells.push({
            ...(row || {
                period: date,
                date,
                profit: 0,
                return: 0,
                cashFlow: 0,
                startAmount: 0,
                endAmount: 0,
                hasData: false
            }),
            key: date,
            period: date,
            date,
            dayLabel: String(day),
            empty: false
        })
    }

    return cells
})
const activeHeatmapCells = computed(() =>
    heatmapView.value === 'year'
        ? annualHeatmapRows.value.flatMap(row => [...row.months, row.total]).filter(item => item.hasData)
        : monthlyCalendarCells.value.filter(item => item.hasData)
)
const heatmapAmountScale = computed(() =>
    Math.max(...activeHeatmapCells.value.map(item => Math.abs(item.profit)), 1)
)
const heatmapRateScale = computed(() =>
    Math.max(...activeHeatmapCells.value.map(item => Math.abs(item.return)), 1)
)
const heatmapSummary = computed(() => {
    if (heatmapView.value === 'month') {
        return {
            period: selectedHeatmapMonthValue.value,
            profit: selectedMonthReturn.value.profit,
            return: selectedMonthReturn.value.return,
            cashFlow: selectedMonthReturn.value.cashFlow
        }
    }

    const latestYear = annualHeatmapRows.value[0]
    const earliestYear = annualHeatmapRows.value.at(-1)
    const profit = annualHeatmapRows.value.reduce((total, row) => total + row.total.profit, 0)
    const cashFlow = annualHeatmapRows.value.reduce((total, row) => total + row.total.cashFlow, 0)
    const overallReturn =
        earliestYear && latestYear
            ? calculateActualReturnPeriod(
                  `${earliestYear.year}-01-01`,
                  `${latestYear.year}-12-31`
              ).return
            : 0

    return {
        period: annualHeatmapRows.value.length ? `${earliestYear?.year} - ${latestYear?.year}` : '暂无数据',
        profit,
        return: overallReturn,
        cashFlow
    }
})
const monthlyHeatmapExtremes = computed(() => {
    const rows = monthlyCalendarCells.value.filter(item => item.hasData)
    const winRows = rows.filter(item => item.profit > 0)
    const lossRows = rows.filter(item => item.profit < 0)
    const best = rows.reduce<ReturnHeatmapCell | null>(
        (current, item) => (!current || item.profit > current.profit ? item : current),
        null
    )
    const worst = rows.reduce<ReturnHeatmapCell | null>(
        (current, item) => (!current || item.profit < current.profit ? item : current),
        null
    )

    return {
        best: {
            date: best?.date?.slice(5) || '--',
            label: best ? displayMoneyChange(best.profit) : '--'
        },
        worst: {
            date: worst?.date?.slice(5) || '--',
            label: worst ? displayMoneyChange(worst.profit) : '--'
        },
        winDays: winRows.length,
        lossDays: lossRows.length,
        averageWin: winRows.length
            ? displayMoneyChange(
                  winRows.reduce((total, item) => total + item.profit, 0) / winRows.length
              )
            : '--',
        averageLoss: lossRows.length
            ? displayMoneyChange(
                  lossRows.reduce((total, item) => total + item.profit, 0) / lossRows.length
              )
            : '--'
    }
})
const selectHeatmapMonth = (month: string) => {
    selectedHeatmapMonth.value = month
    heatmapView.value = 'month'
}
const performanceDates = computed(() => aggregateRecordsByDate.value.map(item => item.date))
const benchmarkSeries = ref<number[]>([])
const benchmarkSourceDate = ref('—')
const performanceMinDate = computed(() => performanceDates.value[0] || firstLedgerDate.value)
const performanceMaxDate = computed(() => performanceDates.value.at(-1) || latestLedgerDate.value)
const dateRange = reactive({
    start: '',
    end: ''
})

const clampDate = (date: string) => {
    const minDate = performanceMinDate.value
    const maxDate = performanceMaxDate.value
    const nextDate = date || maxDate

    return nextDate < minDate ? minDate : nextDate > maxDate ? maxDate : nextDate
}
const shiftDate = (date: string, dayOffset: number) => {
    const [year, month, day] = date.split('-').map(Number)
    const current = new Date(Date.UTC(year, month - 1, day))
    current.setUTCDate(current.getUTCDate() + dayOffset)
    return current.toISOString().slice(0, 10)
}
const getWeekStartDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number)
    const current = new Date(Date.UTC(year, month - 1, day))
    const weekday = current.getUTCDay()
    const mondayOffset = weekday === 0 ? -6 : 1 - weekday
    current.setUTCDate(current.getUTCDate() + mondayOffset)
    return current.toISOString().slice(0, 10)
}
const applyDateRangePeriod = (
    range: { start: string; end: string },
    period: string,
    minDate = performanceMinDate.value,
    maxDate = performanceMaxDate.value
) => {
    const end = maxDate
    const periodStartMap: Record<string, string> = {
        近30日: shiftDate(end, -29),
        近90日: shiftDate(end, -89),
        本月: `${end.slice(0, 8)}01`,
        今年: `${end.slice(0, 5)}01-01`,
        全部: minDate
    }

    range.start = clampDate(periodStartMap[period] || minDate)
    range.end = end
}
const applyPeriod = (period: string) => {
    selectedPeriod.value = period
    applyDateRangePeriod(dateRange, period)
}
const applyCashFlowPeriod = (period: string) => {
    cashFlowPeriod.value = period
    applyDateRangePeriod(cashFlowRange, period)
    cashFlowPage.value = 1
}
const rangeLabel = (period: string, range: { start: string; end: string }) =>
    period === '自定义' ? `${range.start.slice(5)} 至 ${range.end.slice(5)}` : period
const rangeModalTitle = computed(() =>
    rangeModalTarget.value === 'cashFlow'
        ? '资金流日期区间'
        : rangeModalTarget.value === 'attribution'
          ? '收益归因日期区间'
          : rangeModalTarget.value === 'comparison'
            ? '收益率查询区间'
          : '净值图日期区间'
)
const openRangeModal = (target: string) => {
    rangeModalTarget.value = target

    const sourceRange =
        target === 'cashFlow'
            ? cashFlowRange
            : target === 'attribution'
              ? attributionRange
              : target === 'comparison'
                ? comparisonRange
              : dateRange
    modalPeriod.value =
        target === 'cashFlow'
            ? cashFlowPeriod.value
            : target === 'attribution'
              ? attributionPeriod.value
              : target === 'comparison'
                ? comparisonPeriod.value
              : selectedPeriod.value
    modalRange.start = sourceRange.start
    modalRange.end = sourceRange.end
    showRangeModal.value = true
}
const applyModalPeriod = (period: string) => {
    modalPeriod.value = period
    applyDateRangePeriod(modalRange, period)
}
const confirmRangeModal = () => {
    const targetRange =
        rangeModalTarget.value === 'cashFlow'
            ? cashFlowRange
            : rangeModalTarget.value === 'attribution'
              ? attributionRange
              : rangeModalTarget.value === 'comparison'
                ? comparisonRange
              : dateRange
    targetRange.start = modalRange.start
    targetRange.end = modalRange.end

    if (rangeModalTarget.value === 'cashFlow') {
        cashFlowPeriod.value = modalPeriod.value
        cashFlowPage.value = 1
    } else if (rangeModalTarget.value === 'attribution') {
        attributionPeriod.value = modalPeriod.value
        syncDerivedState()
    } else if (rangeModalTarget.value === 'comparison') {
        comparisonPeriod.value = modalPeriod.value
        showComparisonRange.value = true
        syncDerivedState()
    } else {
        selectedPeriod.value = modalPeriod.value
    }

    showRangeModal.value = false
}
const normalizedDateRange = computed(() => {
    const start = clampDate(dateRange.start || performanceMinDate.value)
    const end = clampDate(dateRange.end || performanceMaxDate.value)

    return start <= end ? { start, end } : { start: end, end: start }
})
const normalizedAttributionRange = computed(() => {
    const start = clampDate(attributionRange.start || performanceMinDate.value)
    const end = clampDate(attributionRange.end || performanceMaxDate.value)

    return start <= end ? { start, end } : { start: end, end: start }
})
const normalizedComparisonRange = computed(() => {
    const start = clampDate(comparisonRange.start || performanceMinDate.value)
    const end = clampDate(comparisonRange.end || performanceMaxDate.value)

    return start <= end ? { start, end } : { start: end, end: start }
})
const returnShareRangeLabel = computed(() => {
    const formatDate = (value: string) => value.replace(/-/g, '.')
    return `${formatDate(normalizedComparisonRange.value.start)} — ${formatDate(normalizedComparisonRange.value.end)}`
})
const performancePoints = computed(() =>
    aggregateRecordsByDate.value.reduce<
        Array<{
            date: string
            label: string
            nav: number
            benchmark: number
            benchmarkRaw: number
            drawdown: number
        }>
    >((points, item, index) => {
        const previous = aggregateRecordsByDate.value[index - 1]
        const previousNav = points[index - 1]?.nav || 1
        const dailyReturn =
            previous?.amount && previous.amount > 0
                ? (item.amount - previous.amount - item.cashFlow) / previous.amount
                : 0
        const nav = index === 0 ? 1 : previousNav * (1 + dailyReturn)
        const high = Math.max(nav, ...points.map(point => point.nav))
        const benchmarkRaw = benchmarkSeries.value[index] || 0
        const benchmarkBase = benchmarkSeries.value[0] || benchmarkRaw || 1

        points.push({
            date: item.date,
            label: item.date.slice(5),
            nav,
            benchmark: benchmarkRaw ? (benchmarkRaw / benchmarkBase) * 1 : 0,
            benchmarkRaw,
            drawdown: high ? ((nav / high) - 1) * 100 : 0
        })

        return points
    }, [])
)
const filteredPerformanceData = computed(() => {
    const { start, end } = normalizedDateRange.value
    const points = performancePoints.value.filter(item => item.date >= start && item.date <= end)

    return points
})
const filteredActualPerformanceData = computed(() => {
    const { start, end } = normalizedDateRange.value
    const rows = aggregateRecordsByDate.value.filter(item => item.date >= start && item.date <= end)
    const first = rows[0]
    const previous = aggregateRecordsByDate.value.filter(item => item.date < start).at(-1)
    const baselineAmount = first ? (previous ? previous.amount : Math.max(first.amount - first.cashFlow, 0)) : 0
    let cumulativeCashFlow = 0

    return rows.map(item => {
        cumulativeCashFlow += Number(item.cashFlow || 0)

        return {
            date: item.date,
            label: item.date.slice(5),
            amount: item.amount,
            cumulativeProfit: item.amount - baselineAmount - cumulativeCashFlow,
            cashFlow: item.cashFlow
        }
    })
})

const benchmarkComparison = computed(() => {
    const { start, end } = normalizedDateRange.value
    const orderedPoints = performancePoints.value.filter(item => item.date <= end)
    const firstIndex = orderedPoints.findIndex(item => item.date >= start)
    const last = orderedPoints.at(-1)
    const first = firstIndex >= 0 ? orderedPoints[firstIndex] : undefined
    const baseline = firstIndex > 0 ? orderedPoints[firstIndex - 1] : first
    const accountReturn = baseline?.nav && last?.nav ? ((last.nav / baseline.nav) - 1) * 100 : 0
    const benchmarkReturn = baseline?.benchmarkRaw && last?.benchmarkRaw
        ? ((last.benchmarkRaw / baseline.benchmarkRaw) - 1) * 100
        : 0

    return {
        accountReturn,
        benchmarkReturn,
        excessReturn: accountReturn - benchmarkReturn
    }
})
const latestPerformancePoint = computed(() => performancePoints.value.at(-1))
const previousPerformancePoint = computed(() => performancePoints.value.at(-2))
const todayAccountReturn = computed(() =>
    previousPerformancePoint.value?.nav && latestPerformancePoint.value?.nav
        ? ((latestPerformancePoint.value.nav / previousPerformancePoint.value.nav) - 1) * 100
        : 0
)
const todayAssetChange = computed(() => {
    const latest = aggregateRecordsByDate.value.at(-1)
    const previous = aggregateRecordsByDate.value.at(-2)

    return latest && previous ? latest.amount - previous.amount - latest.cashFlow : 0
})
const classifyDrawdownStatus = (current: number, deepest?: number) => {
    if (current >= -0.005) return '创新高'
    if (deepest !== undefined && current > deepest + 0.5) return '修复中'
    if (deepest !== undefined && Math.abs(current - deepest) <= 0.5) return '回撤中'
    return '修复中'
}
const currentDrawdown = computed(() => latestPerformancePoint.value?.drawdown || 0)
const maxAccountDrawdown = computed(() =>
    performancePoints.value.reduce((min, point) => Math.min(min, point.drawdown), 0)
)
const accountDrawdownStatus = computed(() =>
    classifyDrawdownStatus(currentDrawdown.value, maxAccountDrawdown.value)
)
const distanceToHigh = computed(() => requiredReturnToDrawdown(0))
const daysSinceHigh = computed(() => {
    const lastHighIndex = performancePoints.value.reduce(
        (lastIndex, point, index) => (point.drawdown === 0 ? index : lastIndex),
        0
    )

    return Math.max(performancePoints.value.length - 1 - lastHighIndex, 0)
})
const drawdownEpisodes = computed<DrawdownEpisode[]>(() => {
    const points = performancePoints.value
    if (points.length < 2) return []

    const episodes: DrawdownEpisode[] = []
    let peakIndex = 0
    let activeTroughIndex: number | null = null
    const finishEpisode = (recoveryIndex: number | null) => {
        if (activeTroughIndex === null) return
        const peak = points[peakIndex]
        const trough = points[activeTroughIndex]
        const recovery = recoveryIndex === null ? null : points[recoveryIndex]
        const recoveryDays = recovery
            ? Math.max(
                  Math.round(
                      (Date.parse(`${recovery.date}T00:00:00Z`) -
                          Date.parse(`${peak.date}T00:00:00Z`)) /
                          86400000
                  ),
                  0
              )
            : null

        episodes.push({
            id: `${peak.date}-${trough.date}`,
            peakDate: peak.date,
            troughDate: trough.date,
            recoveryDate: recovery?.date || null,
            drawdown: trough.drawdown,
            peakNav: peak.nav,
            troughNav: trough.nav,
            recoveryDays
        })
        activeTroughIndex = null
    }

    for (let index = 1; index < points.length; index += 1) {
        const point = points[index]
        if (point.drawdown >= 0) {
            finishEpisode(index)
            peakIndex = index
            continue
        }
        if (activeTroughIndex === null || point.drawdown < points[activeTroughIndex].drawdown) {
            activeTroughIndex = index
        }
    }
    finishEpisode(null)
    return episodes
})
const topDrawdownEpisodes = computed(() =>
    [...drawdownEpisodes.value]
        .sort((a, b) => a.drawdown - b.drawdown)
        .slice(0, 10)
)
const activeDrawdownEpisode = computed(() => {
    const activeEpisode = drawdownEpisodes.value.find(item => item.recoveryDate === null)
    const latest = latestPerformancePoint.value
    if (!activeEpisode || !latest || currentDrawdown.value >= -0.005) return undefined

    return {
        ...activeEpisode,
        troughDate: latest.date,
        drawdown: currentDrawdown.value,
        troughNav: latest.nav
    }
})
const activeDrawdownProfit = computed(() => {
    const episode = activeDrawdownEpisode.value
    return episode
        ? calculateRecordsProfitBetween(
              accountActualRecords.value,
              episode.peakDate,
              episode.troughDate
          )
        : 0
})
const drawdownAttributionRows = computed(() => {
    const episode = activeDrawdownEpisode.value
    if (!episode) return []

    const rows = strategies
        .map(strategy => {
            const records = recentRecords.value.filter(record => record.strategyId === strategy.id)
            return {
                name: strategy.name,
                color: strategy.color,
                amount: calculateRecordsProfitBetween(records, episode.peakDate, episode.troughDate)
            }
        })
        .sort((a, b) => a.amount - b.amount)
    const lossTotal = rows.reduce((total, item) => total + Math.max(-item.amount, 0), 0)

    return rows.map(item => ({
        ...item,
        share: lossTotal ? Math.min((Math.abs(item.amount) / lossTotal) * 100, 100) : 0
    }))
})
const formatDrawdownRecoveryStatus = (item: DrawdownEpisode) => {
    if (item.recoveryDate) return `已恢复 · ${item.recoveryDays || 0} 天`
    const currentNav = latestPerformancePoint.value?.nav || item.troughNav
    return currentNav > item.troughNav ? '修复中 · 尚未回到前高' : '回撤中 · 尚未恢复'
}
const recoveryEstimateStats = computed(() => {
    const points = performancePoints.value.filter(item => item.nav > 0).slice(-20)
    if (points.length < 15) {
        return {
            sampleSize: points.length,
            trend: 'insufficient' as const,
            dailyLogSlope: 0,
            dailyPace: 0,
            rSquared: 0,
            stability: '样本不足',
            requiredReturn: requiredReturnToDrawdown(0)
        }
    }

    const values = points.map(item => Math.log(item.nav))
    const xMean = (points.length - 1) / 2
    const yMean = values.reduce((total, value) => total + value, 0) / values.length
    const xVariance = points.reduce((total, _, index) => total + (index - xMean) ** 2, 0)
    const covariance = values.reduce(
        (total, value, index) => total + (index - xMean) * (value - yMean),
        0
    )
    const dailyLogSlope = xVariance ? covariance / xVariance : 0
    const intercept = yMean - dailyLogSlope * xMean
    const totalVariation = values.reduce((total, value) => total + (value - yMean) ** 2, 0)
    const residualVariation = values.reduce((total, value, index) => {
        const fitted = intercept + dailyLogSlope * index
        return total + (value - fitted) ** 2
    }, 0)
    const rSquared = totalVariation
        ? Math.max(0, Math.min(1, 1 - residualVariation / totalVariation))
        : 0
    const dailyPace = (Math.exp(dailyLogSlope) - 1) * 100
    const trend = dailyPace > 0.01 ? 'up' : dailyPace < -0.01 ? 'down' : 'flat'
    const stability = rSquared >= 0.6 ? '较强' : rSquared >= 0.3 ? '一般' : '较弱'
    const requiredReturn = requiredReturnToDrawdown(0)

    return {
        sampleSize: points.length,
        trend,
        dailyLogSlope,
        dailyPace,
        rSquared,
        stability,
        requiredReturn
    }
})
const estimateRecoveryDays = (targetDrawdown: number) => {
    const stats = recoveryEstimateStats.value
    if (!stats || stats.trend !== 'up' || stats.dailyLogSlope <= 0) return null

    const requiredReturn = requiredReturnToDrawdown(targetDrawdown)
    if (requiredReturn <= 0) return 0

    return Math.max(Math.ceil(Math.log1p(requiredReturn / 100) / stats.dailyLogSlope), 1)
}
const recoveryEstimateDays = computed<number | null>(() => {
    if (currentDrawdown.value >= 0) return 0
    return estimateRecoveryDays(0)
})
const recoveryTrendPace = computed(() => recoveryEstimateStats.value?.dailyPace || 0)
const recoveryTrendPaceLabel = computed(() => {
    const stats = recoveryEstimateStats.value
    if (!stats || stats.trend === 'insufficient') return '样本不足'
    return `${stats.dailyPace >= 0 ? '+' : ''}${stats.dailyPace.toFixed(2)}%/日`
})
const recoveryTrendLabel = computed(() => {
    const trend = recoveryEstimateStats.value?.trend
    if (trend === 'up') return '正在修复'
    if (trend === 'down') return '回撤扩大'
    if (trend === 'flat') return '修复停滞'
    return '样本不足'
})
const recoveryTrendStability = computed(() => recoveryEstimateStats.value?.stability || '样本不足')
const recoveryMilestoneFallbackLabel = computed(() => {
    const trend = recoveryEstimateStats.value?.trend
    if (trend === 'down') return '趋势向下'
    if (trend === 'flat') return '暂不估算'
    return '样本不足'
})
const recoveryEstimateLabel = computed(() => {
    if (recoveryEstimateDays.value === 0) return '已修复'
    if (recoveryEstimateDays.value !== null) {
        return recoveryEstimateDays.value > 250
            ? '当前趋势超过 250 天'
            : `趋势延续约 ${recoveryEstimateDays.value} 天`
    }
    const trend = recoveryEstimateStats.value?.trend
    if (trend === 'down') return '回撤扩大中'
    if (trend === 'flat') return '修复停滞'
    return '趋势样本不足'
})
const recoveryEstimateHint = computed(() =>
    recoveryEstimateStats.value
        ? `使用最近 ${recoveryEstimateStats.value.sampleSize} 个交易记录，对对数净值做线性回归。当前日均趋势速度 ${recoveryTrendPaceLabel.value}，拟合度 R² 为 ${recoveryEstimateStats.value.rSquared.toFixed(2)}。仅当趋势向上时，按当前斜率测算回到前高所需时间；结果假设近期趋势延续，并非收益预测。`
        : '近 20 日有效净值样本不足，暂不估算修复时间'
)
const drawdownPercentile = computed(() => {
    const drawdowns = performancePoints.value.map(item => Math.abs(Math.min(item.drawdown, 0)))
    const current = Math.abs(Math.min(currentDrawdown.value, 0))

    return drawdowns.length
        ? (drawdowns.filter(value => value <= current).length / drawdowns.length) * 100
        : 0
})
const dataCompleteness = computed(() => {
    const actualCount = new Set(
        recentRecords.value.map(record => `${record.strategyId}|${record.date}`)
    ).size
    const expectedCount = actualCount + allMissingRecordDetails.value.length

    return expectedCount ? Math.min((actualCount / expectedCount) * 100, 100) : 0
})
const requiredReturnToDrawdown = (targetDrawdown: number) => {
    const currentNav = latestPerformancePoint.value?.nav || 0
    const highNav = performancePoints.value.reduce((high, item) => Math.max(high, item.nav), 0)
    const targetNav = highNav * (1 + targetDrawdown / 100)

    return currentNav && targetNav > currentNav ? ((targetNav / currentNav) - 1) * 100 : 0
}

const loadBenchmarkData = async () => {
    try {
        if (!performanceDates.value.length) return
        const response: any = await callCloudFunction({
            name: 'getAllWeatherData',
            data: { action: 'get' }
        })
        const data = response?.result?.data
        if (!response?.result?.success) {
            throw new Error(response?.result?.message || '沪深300云端数据读取失败')
        }
        if (!Array.isArray(data.dateList) || !Array.isArray(data.hs300)) return

        const alignedValues: number[] = []
        let sourceIndex = 0
        performanceDates.value.forEach(date => {
            while (
                sourceIndex + 1 < data.dateList.length &&
                data.dateList[sourceIndex + 1] <= date
            ) {
                sourceIndex += 1
            }
            alignedValues.push(Number(data.hs300[sourceIndex]))
        })
        if (alignedValues.every(Number.isFinite)) {
            benchmarkSeries.value = alignedValues
            benchmarkSourceDate.value = data.dateList[sourceIndex]
        }
    } catch (error) {
        benchmarkSeries.value = []
        benchmarkSourceDate.value = '—'
        console.warn('沪深300云端基准数据读取失败。', error)
    }
}

const colorPalette = [
    '#4ecdc4',
    '#f4c95d',
    '#ef6f6c',
    '#7aa2f7',
    '#9d7ff9',
    '#78d6a3',
    '#ff9f43',
    '#c678dd',
    '#64d2ff',
    '#ff7ab6',
    '#a3e635',
    '#d19a66'
]
const performanceFixedSeriesColors = {
    portfolio: '#f4f7fb',
    benchmark: '#b0c4de',
    drawdown: '#35c2e8'
}
const createStrategyId = (name: string, fallback = String(Date.now())) =>
    `strategy-${name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || fallback}`
const syncCashFlowEventsFromRecords = () => {
    cashFlowEvents.value = recentRecords.value
        .filter(record => Number(record.cashFlow || 0) !== 0)
        .map(record => ({
            id: `flow-${record.id}`,
            recordId: record.id,
            date: record.date,
            strategy: record.strategy,
            nav: record.nav,
            amount: Number(record.cashFlow),
            type: record.cashFlow > 0 ? '转入' : '转出',
            note: record.note || '账本记录'
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
}
const calculateRecordsReturn = (
    records: LedgerRecord[],
    startDate: string,
    endDate = '9999-12-31'
) => {
    const orderedRows = records
        .filter(item => item.date <= endDate)
        .sort((a, b) => a.date.localeCompare(b.date))
    const firstIndex = orderedRows.findIndex(item => item.date >= startDate)
    if (firstIndex < 0) return 0

    const rows = orderedRows.slice(firstIndex)
    const first = rows[0]
    const last = rows.at(-1)
    const baseline = orderedRows[firstIndex - 1]

    if (!first || !last) return 0
    if (baseline?.nav) return ((last.nav / baseline.nav) - 1) * 100
    if (first.id === last.id) return last.return
    return first.nav ? ((last.nav / first.nav) - 1) * 100 : 0
}
const calculateRecordsProfit = (records: LedgerRecord[], startDate: string, endDate: string) => {
    const orderedRows = records
        .filter(item => item.date <= endDate)
        .sort((a, b) => a.date.localeCompare(b.date))
    const rows = orderedRows.filter(item => item.date >= startDate)
    const first = rows[0]
    const last = rows.at(-1)
    if (!first || !last) return 0

    const previous = orderedRows.filter(item => item.date < startDate).at(-1)
    const startAmount = previous ? previous.amount : Math.max(first.amount - first.cashFlow, 0)
    const cashFlow = rows.reduce((total, item) => total + Number(item.cashFlow || 0), 0)
    return last.amount - startAmount - cashFlow
}
const calculateRecordsProfitBetween = (
    records: LedgerRecord[],
    startDate: string,
    endDate: string
) => {
    const orderedRows = records
        .filter(item => item.date <= endDate)
        .sort((a, b) => a.date.localeCompare(b.date))
    const baseline = orderedRows.filter(item => item.date <= startDate).at(-1)
    const last = orderedRows.at(-1)
    if (!baseline || !last) return 0

    const cashFlow = orderedRows
        .filter(item => item.date > startDate)
        .reduce((total, item) => total + Number(item.cashFlow || 0), 0)
    return last.amount - baseline.amount - cashFlow
}
const performanceStrategySummaries = computed(() =>
    strategies.map(strategy => {
        const rows = recentRecords.value
            .filter(record => record.strategyId === strategy.id)
            .sort((a, b) => a.date.localeCompare(b.date))

        return {
            name: strategy.name,
            color: strategy.color,
            return: calculateRecordsReturn(
                rows,
                normalizedDateRange.value.start,
                normalizedDateRange.value.end
            )
        }
    })
)
const accountPerformanceRecords = computed<LedgerRecord[]>(() =>
    performancePoints.value.map(point => ({
        id: point.date,
        strategyId: 'account',
        date: point.date,
        strategy: '整体账户',
        amount: point.nav,
        cashFlow: 0,
        return: 0,
        nav: point.nav,
        note: '',
        color: '#7aa2f7'
    }))
)
const accountActualRecords = computed<LedgerRecord[]>(() =>
    aggregateRecordsByDate.value.map(item => ({
        id: item.date,
        strategyId: 'account',
        date: item.date,
        strategy: '整体账户',
        amount: item.amount,
        cashFlow: item.cashFlow,
        return: 0,
        nav: 0,
        note: '',
        color: performanceFixedSeriesColors.portfolio
    }))
)
const attributionAccountReturn = computed(() =>
    calculateRecordsReturn(
        accountPerformanceRecords.value,
        normalizedAttributionRange.value.start,
        normalizedAttributionRange.value.end
    )
)
const attributionAccountProfit = computed(() =>
    calculateRecordsProfit(
        accountActualRecords.value,
        normalizedAttributionRange.value.start,
        normalizedAttributionRange.value.end
    )
)
const attributionWaterfallOption = computed(() => {
    const rows = attributionRows
    const runningTotals = rows.reduce<number[]>((totals, item) => {
        totals.push((totals.at(-1) || 0) + item.amount)
        return totals
    }, [])
    const offset = Math.min(0, ...runningTotals)
    const helper = rows.map((item, index) => {
        const previousTotal = index ? runningTotals[index - 1] : 0
        return Number((Math.min(previousTotal, runningTotals[index]) - offset).toFixed(2))
    })
    const values = rows.map(item => Math.abs(Number(item.amount.toFixed(2))))
    const totalHelper = Number((Math.min(0, attributionAccountProfit.value) - offset).toFixed(2))
    const totalValue = Math.abs(Number(attributionAccountProfit.value.toFixed(2)))

    return {
        animationDuration: 300,
        grid: { left: 8, right: 8, top: 22, bottom: 8, containLabel: true },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: (params: Array<{ dataIndex: number }>) => {
                const index = params[0]?.dataIndex
                if (index === undefined) return ''
                if (index === rows.length) return `组合盈亏<br/>${displayMoneyChange(attributionAccountProfit.value)}`
                const item = rows[index]
                return `${item.name}<br/>${displayMoneyChange(item.amount)}`
            }
        },
        xAxis: {
            type: 'category',
            data: [...rows.map(item => item.name), '组合盈亏'],
            axisLabel: { color: '#8a9aaa', fontSize: 11, interval: 0 },
            axisLine: { lineStyle: { color: '#31404d' } },
            axisTick: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#718294',
                fontSize: 10,
                formatter: (value: number) => displayMoney(value + offset)
            },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.07)' } }
        },
        series: [
            {
                type: 'bar',
                stack: 'total',
                silent: true,
                itemStyle: { color: 'transparent' },
                data: [...helper, totalHelper]
            },
            {
                type: 'bar',
                stack: 'total',
                barMaxWidth: 34,
                data: [
                    ...values.map((value, index) => ({
                        value,
                        itemStyle: { color: rows[index].amount >= 0 ? '#ef6f6c' : '#4ecdc4' }
                    })),
                    {
                        value: totalValue,
                        itemStyle: { color: attributionAccountProfit.value >= 0 ? '#ef6f6c' : '#4ecdc4' }
                    }
                ]
            }
        ]
    }
})
const syncDerivedState = () => {
    const latestTotal = totalAssets.value
    const latestDate = latestLedgerDate.value
    const monthStart = `${latestDate.slice(0, 8)}01`
    const yearStart = `${latestDate.slice(0, 5)}01-01`
    const weekStart = getWeekStartDate(latestDate)
    const attributionEndRecords = strategies
        .map(strategy =>
            recentRecords.value
                .filter(
                    record =>
                        record.strategyId === strategy.id &&
                        record.date <= normalizedAttributionRange.value.end
                )
                .sort((a, b) => a.date.localeCompare(b.date))
                .at(-1)
        )
        .filter((record): record is LedgerRecord => Boolean(record))
    const attributionEndTotal = attributionEndRecords.reduce(
        (total, record) => total + record.amount,
        0
    )

    allocationData.splice(
        0,
        allocationData.length,
        ...strategies.map(strategy => {
            const latest = recordsOnLatestDate.value.find(record => record.strategyId === strategy.id)
            const current = latestTotal ? ((latest?.amount || 0) / latestTotal) * 100 : 0
            const roundedCurrent = roundPercentInput(current)

            return {
                name: strategy.name,
                current: roundedCurrent,
                target: roundedCurrent,
                amount: latest?.amount || 0,
                color: strategy.color
            }
        })
    )

    periodReturnRows.splice(0, periodReturnRows.length)
    if (hasLedgerData.value) {
        periodReturnRows.push({
            type: 'account',
            name: '整体账户',
            day: todayAccountReturn.value,
            week: calculateRecordsReturn(performancePoints.value.map(point => ({
                id: point.date,
                strategyId: 'account',
                date: point.date,
                strategy: '整体账户',
                amount: point.nav,
                cashFlow: 0,
                return: 0,
                nav: point.nav,
                note: '',
                color: performanceFixedSeriesColors.portfolio
            })), weekStart),
            month: calculateRecordsReturn(performancePoints.value.map(point => ({
                id: point.date,
                strategyId: 'account',
                date: point.date,
                strategy: '整体账户',
                amount: point.nav,
                cashFlow: 0,
                return: 0,
                nav: point.nav,
                note: '',
                color: performanceFixedSeriesColors.portfolio
            })), monthStart),
            year: calculateRecordsReturn(performancePoints.value.map(point => ({
                id: point.date,
                strategyId: 'account',
                date: point.date,
                strategy: '整体账户',
                amount: point.nav,
                cashFlow: 0,
                return: 0,
                nav: point.nav,
                note: '',
                color: performanceFixedSeriesColors.portfolio
            })), yearStart),
            range: calculateRecordsReturn(
                performancePoints.value.map(point => ({
                    id: point.date,
                    strategyId: 'account',
                    date: point.date,
                    strategy: '整体账户',
                    amount: point.nav,
                    cashFlow: 0,
                    return: 0,
                    nav: point.nav,
                    note: '',
                    color: performanceFixedSeriesColors.portfolio
                })),
                normalizedComparisonRange.value.start,
                normalizedComparisonRange.value.end
            ),
            note: '扣除现金流',
            color: performanceFixedSeriesColors.portfolio
        })
    }

    strategies.forEach(strategy => {
        const rows = recentRecords.value
            .filter(record => record.strategyId === strategy.id)
            .sort((a, b) => a.date.localeCompare(b.date))
        const latest = rows.at(-1)
        let rollingHighNav = 0
        const drawdownPoints = rows.map((record, index) => {
            rollingHighNav = Math.max(rollingHighNav, record.nav)
            return {
                index,
                drawdown: rollingHighNav ? ((record.nav / rollingHighNav) - 1) * 100 : 0
            }
        })
        const latestDrawdownPoint = drawdownPoints.at(-1)
        const drawdown = latestDrawdownPoint?.drawdown || 0
        const maxDrawdown = drawdownPoints.reduce(
            (min, point) => Math.min(min, point.drawdown),
            0
        )
        const currentDrawdownDepth = Math.abs(Math.min(drawdown, 0))
        const strategyDrawdownPercentile = drawdownPoints.length
            ? (drawdownPoints.filter(
                  point => Math.abs(Math.min(point.drawdown, 0)) <= currentDrawdownDepth
              ).length /
                  drawdownPoints.length) *
              100
            : 0
        const highIndex = drawdownPoints.reduce(
            (lastIndex, point) => (point.drawdown === 0 ? point.index : lastIndex),
            0
        )
        const monthReturn = calculateRecordsReturn(rows, monthStart)
        const latestWeight = latestTotal ? ((latest?.amount || 0) / latestTotal) * 100 : 0

        periodReturnRows.push({
            type: 'strategy',
            name: strategy.name,
            day: latest?.return || 0,
            week: calculateRecordsReturn(rows, weekStart),
            month: monthReturn,
            year: calculateRecordsReturn(rows, yearStart),
            range: calculateRecordsReturn(
                rows,
                normalizedComparisonRange.value.start,
                normalizedComparisonRange.value.end
            ),
            note: latest?.note || '用户自定义',
            color: strategy.color
        })

        const detail = {
            name: strategy.name,
            nav: (latest?.nav || 1).toFixed(4),
            currentDrawdown: formatPercent(drawdown),
            maxDrawdown: formatPercent(maxDrawdown),
            highStatus: classifyDrawdownStatus(drawdown, maxDrawdown),
            highDistance: Number(Math.abs(drawdown).toFixed(2)),
            highProgress: Math.max(100 + drawdown, 0),
            highDays: Math.max(rows.length - 1 - highIndex, 0),
            drawdownPercentile: Number(strategyDrawdownPercentile.toFixed(2)),
            color: strategy.color
        }
        const existingDetail = strategyDetails.find(item => item.name === strategy.name)
        if (existingDetail) Object.assign(existingDetail, detail)
        else strategyDetails.push(detail)

        const attributionEndRecord = attributionEndRecords.find(
            record => record.strategyId === strategy.id
        )
        const attributionWeight = attributionEndTotal
            ? ((attributionEndRecord?.amount || 0) / attributionEndTotal) * 100
            : 0
        const attributionReturn = calculateRecordsReturn(
            rows,
            normalizedAttributionRange.value.start,
            normalizedAttributionRange.value.end
        )
        const contribution = (attributionWeight * attributionReturn) / 100
        const attribution = {
            name: strategy.name,
            weight: Number(attributionWeight.toFixed(2)),
            return: attributionReturn,
            contribution,
            amount: calculateRecordsProfit(
                rows,
                normalizedAttributionRange.value.start,
                normalizedAttributionRange.value.end
            ),
            note: attributionEndRecord?.note || '按区间末权重估算',
            color: strategy.color
        }
        const existingAttribution = attributionRows.find(item => item.name === strategy.name)
        if (existingAttribution) Object.assign(existingAttribution, attribution)
        else attributionRows.push(attribution)
    })

    strategyDetails.splice(
        0,
        strategyDetails.length,
        ...strategyDetails.filter(item => strategies.some(strategy => strategy.name === item.name))
    )
    attributionRows.splice(
        0,
        attributionRows.length,
        ...attributionRows.filter(item => strategies.some(strategy => strategy.name === item.name))
    )
}
const applyLedgerBundle = (
    remoteStrategies: RemoteLedgerStrategy[],
    remoteRecords: RemoteLedgerRecord[],
    account: {
        openingPrincipal?: number
        openingDate?: string
        annualProfitTargets?: Record<string, number>
    }
) => {
    accountConfig.openingPrincipal = Number(account.openingPrincipal || 0)
    accountConfig.openingDate = account.openingDate || ''
    accountConfig.annualProfitTargets = { ...(account.annualProfitTargets || {}) }
    annualProfitTarget.value = Number(
        accountConfig.annualProfitTargets[annualTargetYearLabel.value] || 0
    )

    const mapStrategyDraft = (strategy: RemoteLedgerStrategy, index: number): StrategyDraft => ({
        id: strategy.strategyId,
        name: strategy.name,
        amount: 0,
        previous: 0,
        cashFlow: 0,
        note: '',
        color: strategy.color || colorPalette[index % colorPalette.length],
        archived: Boolean(strategy.archived)
    })
    const orderedStrategies = [...remoteStrategies].sort(
        (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)
    )
    strategies.splice(
        0,
        strategies.length,
        ...orderedStrategies
            .filter(strategy => !strategy.archived)
            .map((strategy, index) => mapStrategyDraft(strategy, index))
    )
    archivedStrategies.splice(
        0,
        archivedStrategies.length,
        ...orderedStrategies
            .filter(strategy => strategy.archived)
            .map((strategy, index) => mapStrategyDraft(strategy, strategies.length + index))
    )

    const allStrategyDrafts = [...strategies, ...archivedStrategies]
    const strategyMap = new Map(allStrategyDrafts.map(strategy => [strategy.id, strategy]))
    const navByStrategy = new Map<string, number>()
    const previousByStrategy = new Map<string, RemoteLedgerRecord>()
    const mappedRecords = [...remoteRecords]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(record => {
            const strategy = strategyMap.get(record.strategyId)
            const previous = previousByStrategy.get(record.strategyId)
            const previousNav = navByStrategy.get(record.strategyId) || 1
            const dailyReturn =
                previous?.amount && previous.amount > 0
                    ? ((record.amount - previous.amount - record.cashFlow) / previous.amount) * 100
                    : 0
            const nav = previous ? previousNav * (1 + dailyReturn / 100) : 1

            previousByStrategy.set(record.strategyId, record)
            navByStrategy.set(record.strategyId, nav)

            return {
                id: record.id,
                strategyId: record.strategyId,
                date: record.date,
                strategy: strategy?.name || record.strategyId,
                amount: record.amount,
                cashFlow: record.cashFlow,
                return: dailyReturn,
                nav,
                note: record.note,
                color: strategy?.color || '#7aa2f7'
            }
        })

    recentRecords.value = mappedRecords.sort(
        (a, b) => b.date.localeCompare(a.date) || a.strategy.localeCompare(b.strategy)
    )
    recordPage.value = 1
    allStrategyDrafts.forEach(strategy => {
        const rows = mappedRecords
            .filter(record => record.strategyId === strategy.id)
            .sort((a, b) => b.date.localeCompare(a.date))
        strategy.amount = rows[0]?.amount || 0
        strategy.previous = rows[1]?.amount || rows[0]?.amount || 0
        strategy.cashFlow = 0
        strategy.note = ''
    })
    syncCashFlowEventsFromRecords()
    applyDateRangePeriod(dateRange, selectedPeriod.value)
    applyDateRangePeriod(cashFlowRange, cashFlowPeriod.value)
    applyDateRangePeriod(attributionRange, attributionPeriod.value)
    applyDateRangePeriod(comparisonRange, comparisonPeriod.value)
    syncDerivedState()
}
const loadCompleteLedgerRecords = async (
    initialRecords: RemoteLedgerRecord[],
    initialTruncated: boolean
) => {
    const recordsById = new Map(initialRecords.map(record => [record.id, record]))
    let truncated = initialTruncated
    let earliestDate = [...initialRecords].sort((a, b) => a.date.localeCompare(b.date))[0]?.date
    let batchCount = 0

    while (truncated && earliestDate && batchCount < 100) {
        const result = await getLedgerRecords({
            endDate: shiftDate(earliestDate, -1),
            limit: 5000
        })
        result.records.forEach(record => recordsById.set(record.id, record))
        truncated = result.truncated
        batchCount += 1

        const nextEarliestDate = [...result.records]
            .sort((a, b) => a.date.localeCompare(b.date))[0]?.date
        if (!nextEarliestDate || nextEarliestDate >= earliestDate) {
            truncated = false
            break
        }
        earliestDate = nextEarliestDate
    }

    if (truncated) throw new Error('账本历史记录过多，完整读取未完成，请缩小数据范围后重试')
    return [...recordsById.values()]
}
const loadLedgerBundle = async () => {
    ledgerLoading.value = true
    ledgerError.value = ''

    try {
        const bundle = await getLedgerBundle()
        const completeRecords = await loadCompleteLedgerRecords(
            bundle.records,
            bundle.truncated
        )
        defaultLedgerEntryDate.value = bundle.defaultEntryDate || todayDate
        applyLedgerBundle(bundle.strategies, completeRecords, bundle.account)
        ledgerLoaded.value = true
        await loadBenchmarkData()
    } catch (error) {
        ledgerLoaded.value = true
        ledgerError.value =
            error instanceof Error ? error.message : '投资账本云函数读取失败'
    } finally {
        ledgerLoading.value = false
    }
}

const closeLedgerMoreMenu = () => {
    showLedgerMoreMenu.value = false
}
const toggleLedgerMoreMenu = () => {
    showLedgerMoreMenu.value = !showLedgerMoreMenu.value
}
const runLedgerMoreAction = async (action: LedgerMoreAction) => {
    closeLedgerMoreMenu()
    await action()
}
const openAnnualTargetModal = () => {
    annualProfitTargetDraft.value = annualProfitTarget.value || ''
    showAnnualTargetModal.value = true
}
const closeAnnualTargetModal = () => {
    if (annualTargetSaving.value) return
    showAnnualTargetModal.value = false
}
const applyAnnualProfitTargets = (targets: Record<string, number> = {}) => {
    accountConfig.annualProfitTargets = { ...targets }
    annualProfitTarget.value = Number(
        accountConfig.annualProfitTargets[annualTargetYearLabel.value] || 0
    )
}
const saveAnnualProfitTargetsToAccount = async (targets: Record<string, number>) =>
    saveLedgerAccount({
        currency: 'CNY',
        openingPrincipal: accountConfig.openingPrincipal,
        openingDate: accountConfig.openingDate,
        annualProfitTargets: targets
    })
const getSavedAnnualProfitTargets = (
    savedTargets: Record<string, number> | undefined,
    expectedTargets: Record<string, number>
) => {
    const expected = Number(expectedTargets[annualTargetYearLabel.value] || 0)
    const saved = Number(savedTargets?.[annualTargetYearLabel.value] || 0)

    if (expected > 0 && saved !== expected) {
        throw new Error('云端账户配置暂未写入年度目标字段，请同步投资账本云函数后重试')
    }

    return savedTargets || {}
}
const saveAnnualTarget = async () => {
    if (annualTargetSaving.value) return

    const value = Number(annualProfitTargetDraft.value || 0)

    if (!Number.isFinite(value) || value <= 0) {
        notify('请输入大于 0 的年度收益目标', 'error')
        return
    }

    annualTargetSaving.value = true
    try {
        const targets = {
            ...accountConfig.annualProfitTargets,
            [annualTargetYearLabel.value]: Number(value.toFixed(2))
        }
        const result = await saveAnnualProfitTargetsToAccount(targets)
        applyAnnualProfitTargets(
            getSavedAnnualProfitTargets(result.account.annualProfitTargets, targets)
        )
        showAnnualTargetModal.value = false
        notify('年度收益目标已保存', 'success')
    } catch (error) {
        notify(error instanceof Error ? error.message : '年度收益目标保存失败', 'error')
    } finally {
        annualTargetSaving.value = false
    }
}
const clearAnnualTarget = async () => {
    if (annualTargetSaving.value) return

    annualTargetSaving.value = true
    try {
        const targets = { ...accountConfig.annualProfitTargets }
        delete targets[annualTargetYearLabel.value]
        const result = await saveAnnualProfitTargetsToAccount(targets)
        applyAnnualProfitTargets(
            getSavedAnnualProfitTargets(result.account.annualProfitTargets, targets)
        )
        annualProfitTargetDraft.value = ''
        showAnnualTargetModal.value = false
        notify('年度收益目标已清除')
    } catch (error) {
        notify(error instanceof Error ? error.message : '年度收益目标清除失败', 'error')
    } finally {
        annualTargetSaving.value = false
    }
}
const handleLedgerMoreOutsideClick = (event: MouseEvent) => {
    if (!showLedgerMoreMenu.value) return
    const target = event.target as Node | null
    if (target && ledgerMoreMenuRef.value?.contains(target)) return
    closeLedgerMoreMenu()
}
const handleLedgerMoreKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
        closeLedgerMoreMenu()
        closeAnnualTargetModal()
    }
}

onMounted(() => {
    loadLedgerBundle()
    document.addEventListener('click', handleLedgerMoreOutsideClick)
    document.addEventListener('keydown', handleLedgerMoreKeydown)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleLedgerMoreOutsideClick)
    document.removeEventListener('keydown', handleLedgerMoreKeydown)
})

const baseTooltip = {
    backgroundColor: '#101820',
    borderColor: '#30404f',
    textStyle: { color: '#e8eef5' },
    extraCssText: 'box-shadow:none;border-radius:6px;'
}

const allocationOption = computed(() => ({
    tooltip: { ...baseTooltip, trigger: 'item', formatter: '{b}<br/>{d}%' },
    series: [
        {
            type: 'pie',
            radius: ['46%', '64%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: { borderColor: '#111820', borderWidth: 4 },
            label: {
                show: true,
                position: 'outside',
                alignTo: 'edge',
                edgeDistance: 4,
                formatter: (params: any) => {
                    return `{name|${String(params.name || '')}}\n{percent|${params.percent}%}`
                },
                minMargin: 6,
                bleedMargin: 4,
                rich: {
                    name: { color: '#dfe8f1', fontSize: 11, fontWeight: 600, lineHeight: 16 },
                    percent: { color: '#8fa2b5', fontSize: 11, lineHeight: 15 }
                }
            },
            labelLine: {
                show: true,
                length: 8,
                length2: 6,
                smooth: 0.2,
                lineStyle: { color: '#607184', width: 1 }
            },
            data: allocationData.map(item => ({
                name: item.name,
                value: item.current,
                itemStyle: { color: item.color }
            }))
        }
    ],
    graphic: [
        {
            type: 'text',
            left: 'center',
            top: '41%',
            style: {
                text: `${strategies.length} 个策略`,
                fill: '#f4f7fb',
                fontSize: 18,
                fontWeight: 700
            }
        },
        {
            type: 'text',
            left: 'center',
            top: '53%',
            style: { text: '资产配置', fill: '#8091a3', fontSize: 12 }
        }
    ]
}))

const strategyPerformanceSeries = computed(() =>
    strategies.map(strategy => {
        const rows = recentRecords.value
            .filter(record => record.strategyId === strategy.id)
            .sort((a, b) => a.date.localeCompare(b.date))
        let cursor = 0
        let latestNav: number | null = null

        const data = filteredPerformanceData.value.map(point => {
            while (cursor < rows.length && rows[cursor].date <= point.date) {
                latestNav = rows[cursor].nav
                cursor += 1
            }

            return latestNav
        })

        return {
            name: strategy.name,
            type: 'line',
            smooth: 0.25,
            symbol: 'none',
            data,
            itemStyle: { color: strategy.color },
            lineStyle: { width: 1.8, color: strategy.color, opacity: 0.82 }
        }
    })
)

const performanceSeriesColorMap = computed(() => {
    const colorMap: Record<string, string> = {
        整体账户净值: performanceFixedSeriesColors.portfolio,
        总金额: performanceFixedSeriesColors.portfolio,
        累计盈亏: '#f4c95d',
        沪深300全收益: performanceFixedSeriesColors.benchmark,
        回撤: performanceFixedSeriesColors.drawdown
    }

    strategies.forEach(strategy => {
        colorMap[strategy.name] = strategy.color
    })

    return colorMap
})

const renderTooltipMarker = (color: string) =>
    `<span style="display:inline-block;margin-right:6px;width:8px;height:8px;border-radius:50%;background-color:${color};vertical-align:1px;"></span>`

const performanceOption = computed(() => {
    const isNavMode = performanceChartMode.value === 'nav'
    const moneySeriesName = performanceChartMode.value === 'assets' ? '总金额' : '累计盈亏'
    const moneySeriesColor =
        performanceChartMode.value === 'assets'
            ? performanceFixedSeriesColors.portfolio
            : '#f4c95d'

    if (!isNavMode) {
        return {
            animationDuration: 500,
            tooltip: {
                ...baseTooltip,
                trigger: 'axis',
                formatter: (
                    params: Array<{
                        axisValueLabel?: string
                        color?: string
                        seriesName: string
                        value: number
                    }>
                ) => {
                    const title = params[0]?.axisValueLabel || ''
                    const rows = params
                        .filter(item => typeof item.value === 'number' && Number.isFinite(item.value))
                        .map(item => {
                            const color =
                                performanceSeriesColorMap.value[item.seriesName] ||
                                (typeof item.color === 'string' ? item.color : '#9aabba')
                            return `${renderTooltipMarker(color)}${item.seriesName}&nbsp;&nbsp;<strong>${displayMoney(Number(item.value))}</strong>`
                        })
                    return [title, ...rows].join('<br/>')
                }
            },
            legend: {
                top: 0,
                left: 'center',
                textStyle: { color: '#9aabba' },
                itemWidth: 16,
                itemHeight: 3
            },
            grid: { left: 58, right: 20, top: 42, bottom: 34 },
            xAxis: {
                type: 'category',
                data: filteredActualPerformanceData.value.map(item => displayText(item.label)),
                boundaryGap: false,
                axisLine: { lineStyle: { color: '#30404f' } },
                axisLabel: { color: '#718294' },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    color: '#718294',
                    formatter: (value: number) => formatCompactMoney(value)
                },
                splitLine: { lineStyle: { color: '#23303c', type: 'dashed' } }
            },
            series: [
                {
                    name: moneySeriesName,
                    type: 'line',
                    smooth: 0.28,
                    symbol: 'none',
                    data: filteredActualPerformanceData.value.map(item =>
                        performanceChartMode.value === 'assets'
                            ? item.amount
                            : item.cumulativeProfit
                    ),
                    itemStyle: { color: moneySeriesColor },
                    lineStyle: { width: 3, color: moneySeriesColor },
                    areaStyle: { color: 'rgba(244,201,93,.10)' }
                }
            ]
        }
    }

    return {
        animationDuration: 500,
        tooltip: {
            ...baseTooltip,
            trigger: 'axis',
            formatter: (
                params: Array<{
                    axisValueLabel?: string
                    marker?: string
                    color?: string
                    seriesName: string
                    value: number
                }>
            ) => {
                const title = params[0]?.axisValueLabel || ''
                const rows = params
                    .filter(item => typeof item.value === 'number' && Number.isFinite(item.value))
                    .map(item => {
                        const value = Number(item.value)
                        const formatted =
                            item.seriesName === '回撤' ? `${value.toFixed(2)}%` : value.toFixed(4)
                        const color =
                            performanceSeriesColorMap.value[item.seriesName] ||
                            (typeof item.color === 'string' ? item.color : '#9aabba')
                        return `${renderTooltipMarker(color)}${item.seriesName}&nbsp;&nbsp;<strong>${formatted}</strong>`
                    })
                return [title, ...rows].join('<br/>')
            }
        },
        legend: {
            top: 0,
            left: 'center',
            textStyle: { color: '#9aabba' },
            itemWidth: 16,
            itemHeight: 3
        },
        grid: [
            { left: 42, right: 16, top: 38, height: '53%' },
            { left: 42, right: 16, top: '72%', height: '18%' }
        ],
        xAxis: [
            {
                type: 'category',
                data: filteredPerformanceData.value.map(item => displayText(item.label)),
                boundaryGap: false,
                axisLine: { lineStyle: { color: '#30404f' } },
                axisLabel: { color: '#718294' },
                splitLine: { show: false }
            },
            {
                type: 'category',
                gridIndex: 1,
                data: filteredPerformanceData.value.map(item => displayText(item.label)),
                boundaryGap: false,
                axisLine: { lineStyle: { color: '#30404f' } },
                axisLabel: { color: '#718294' }
            }
        ],
        yAxis: [
            {
                type: 'value',
                min: (value: { min: number }) => Math.min(0.98, value.min),
                axisLabel: {
                    color: '#718294',
                    formatter: (value: number) => value.toFixed(2)
                },
                splitLine: { lineStyle: { color: '#23303c', type: 'dashed' } }
            },
            {
                type: 'value',
                gridIndex: 1,
                max: 0,
                min: (value: { min: number }) => Math.min(-1, value.min),
                axisLabel: { color: '#718294', formatter: '{value}%' },
                splitLine: { lineStyle: { color: '#23303c', type: 'dashed' } }
            }
        ],
        series: [
            {
                name: '整体账户净值',
                type: 'line',
                smooth: 0.3,
                symbol: 'none',
                data: filteredPerformanceData.value.map(item => item.nav),
                itemStyle: { color: performanceFixedSeriesColors.portfolio },
                lineStyle: { width: 3, color: performanceFixedSeriesColors.portfolio },
                areaStyle: { color: 'rgba(244,247,251,.08)' },
                markPoint: {
                    symbolSize: 42,
                    label: { color: '#101820', fontWeight: 700, formatter: '高' },
                    itemStyle: { color: '#f4c95d' },
                    data: [{ type: 'max' }]
                }
            },
            ...strategyPerformanceSeries.value,
            {
                name: '沪深300全收益',
                type: 'line',
                smooth: 0.2,
                symbol: 'none',
                data: filteredPerformanceData.value.map(item => item.benchmark || null),
                itemStyle: { color: performanceFixedSeriesColors.benchmark },
                lineStyle: { width: 2, color: performanceFixedSeriesColors.benchmark, type: 'dashed' }
            },
            {
                name: '回撤',
                type: 'line',
                xAxisIndex: 1,
                yAxisIndex: 1,
                symbol: 'none',
                data: filteredPerformanceData.value.map(item => item.drawdown),
                itemStyle: { color: performanceFixedSeriesColors.drawdown },
                lineStyle: { width: 2, color: performanceFixedSeriesColors.drawdown },
                areaStyle: { color: 'rgba(53,194,232,.18)' }
            }
        ]
    }
})

const formatMoney = (value: number) =>
    `¥${Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`
const formatCompactMoney = (value: number) => {
    const sign = value < 0 ? '-' : ''
    const absolute = Math.abs(Number(value) || 0)

    if (absolute >= 100000000) return `${sign}${(absolute / 100000000).toFixed(2)}亿`
    if (absolute >= 10000) return `${sign}${(absolute / 10000).toFixed(2)}万`
    return `${sign}${absolute.toFixed(2)}`
}
const displayCompactMoneyChange = (value: number) =>
    `${value > 0 ? '+' : ''}${formatCompactMoney(value)}`
const displayPlainMoneyChange = (value: number) =>
    `${value > 0 ? '+' : value < 0 ? '-' : ''}${Number(Math.abs(value)).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`
const displayMoney = (value: number) => formatMoney(value)
const displayMoneyChange = (value: number) =>
    `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatMoney(Math.abs(value))}`
const displayNumber = (value: string | number) => String(value)
const displayText = (value: string | number) => String(value)
const formatCompactName = (value: string, maxLength = 6) =>
    value.length > maxLength ? `${value.slice(0, maxLength)}…` : value
const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
const formatPlainPercent = (value: number) => `${Math.max(0, Math.min(100, Number(value) || 0)).toFixed(2)}%`
const formatContribution = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
const returnClass = (value: number) =>
    value > 0 ? 'positive' : value < 0 ? 'negative' : 'muted-return'
const primaryHeatmapMetric = computed<HeatmapMetric>(() =>
    heatmapDisplayMode.value === 'rate' ? 'rate' : 'amount'
)
const showHeatmapCellSub = computed(() => heatmapDisplayMode.value === 'both')
const formatHeatmapCellMain = (cell: ReturnHeatmapCell) => {
    if (!cell.hasData) return '—'
    if (primaryHeatmapMetric.value === 'rate') return formatPercent(cell.return)
    return displayCompactMoneyChange(cell.profit)
}
const formatCalendarHeatmapCellMain = (cell: ReturnHeatmapCell) => {
    if (!cell.hasData) return '—'
    if (primaryHeatmapMetric.value === 'rate') return formatPercent(cell.return)
    return displayPlainMoneyChange(cell.profit)
}
const formatHeatmapCellSub = (cell: ReturnHeatmapCell) => {
    if (!cell.hasData) return ''
    return formatPercent(cell.return)
}
const getReturnHeatmapStyle = (cell: ReturnHeatmapCell) => {
    if (!cell.hasData) return {}

    const value = primaryHeatmapMetric.value === 'rate' ? cell.return : cell.profit
    const scale = primaryHeatmapMetric.value === 'rate' ? heatmapRateScale.value : heatmapAmountScale.value
    const intensity = Math.min(Math.abs(value) / Math.max(scale, 1), 1)
    const alpha = 0.08 + intensity * 0.48
    const borderAlpha = 0.18 + intensity * 0.35
    const color = value >= 0 ? '239 111 108' : '78 205 196'

    return {
        background: `rgb(${color} / ${alpha})`,
        borderColor: `rgb(${color} / ${borderAlpha})`
    }
}
const estimateDailyReturn = (strategy: { amount: number; previous: number; cashFlow: number }) =>
    strategy.previous === 0
        ? 0
        : ((Number(strategy.amount || 0) - strategy.previous - Number(strategy.cashFlow || 0)) /
              strategy.previous) *
          100

const getDailyEstimatedReturn = (strategy: StrategyDraft) => {
    const amount = dailyEntryAmounts[strategy.id]
    if (amount === '' || amount === undefined) return null
    return estimateDailyReturn({
        amount: Number(amount),
        previous: strategy.previous,
        cashFlow: strategy.cashFlow
    })
}
const dailyEstimatedReturnClass = (strategy: StrategyDraft) => {
    const value = getDailyEstimatedReturn(strategy)
    return value === null ? '' : value >= 0 ? 'positive' : 'negative'
}
const formatDailyEstimatedReturn = (strategy: StrategyDraft) => {
    const value = getDailyEstimatedReturn(strategy)
    return value === null ? '--' : formatPercent(value)
}

const notify = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    showMessage?.(message, type)
}

const waitForCaptureFrame = () =>
    new Promise<void>(resolve => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => window.setTimeout(resolve, 80))
        })
    })

const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const captureLedgerPage = async () => {
    if (capturingLedgerImage.value) return

    const target = ledgerCaptureTarget.value
    if (!target) {
        notify('当前页面暂时无法生成长图', 'error')
        return
    }

    capturingLedgerImage.value = true
    try {
        await nextTick()
        await waitForCaptureFrame()

        const width = Math.ceil(target.scrollWidth)
        const height = Math.ceil(target.scrollHeight)
        const canvas = await html2canvas(target, {
            backgroundColor: '#121212',
            logging: false,
            scale: Math.min(window.devicePixelRatio || 1, 2),
            useCORS: true,
            width,
            height,
            windowWidth: Math.max(document.documentElement.scrollWidth, width),
            windowHeight: Math.max(document.documentElement.scrollHeight, height),
            onclone: clonedDocument => {
                clonedDocument
                    .querySelectorAll<HTMLElement>('[data-capture-hidden="true"]')
                    .forEach(element => {
                        element.style.display = 'none'
                    })

                const style = clonedDocument.createElement('style')
                style.textContent = `
                    .page-header,
                    .content-card {
                        opacity: 1 !important;
                        animation: none !important;
                    }

                    .header-actions {
                        display: none !important;
                    }

                    .content-card:hover {
                        border-color: rgb(255 255 255 / 10%) !important;
                    }
                `
                clonedDocument.head.appendChild(style)
            }
        })

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
        if (!blob) throw new Error('图片生成失败')

        const fileName = `投资账本长图-${latestLedgerDate.value || todayDate}.png`
        downloadBlob(blob, fileName)
        notify('长图已生成并下载', 'success')
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        notify(error instanceof Error ? error.message : '长图生成失败', 'error')
    } finally {
        capturingLedgerImage.value = false
    }
}

const downloadReturnOverviewImage = async () => {
    if (exportingReturnImage.value) return

    const target = returnShareTarget.value
    if (!target) {
        notify('收益率图片暂时无法生成', 'error')
        return
    }

    exportingReturnImage.value = true
    try {
        await nextTick()
        await waitForCaptureFrame()

        const canvas = await html2canvas(target, {
            backgroundColor: '#f6f7f4',
            logging: false,
            scale: 1,
            useCORS: true,
            width: target.offsetWidth,
            height: target.offsetHeight
        })
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
        if (!blob) throw new Error('图片生成失败')

        downloadBlob(blob, `收益率速览-${latestLedgerDate.value || todayDate}.png`)
        notify('收益率图片已生成并下载', 'success')
    } catch (error) {
        notify(error instanceof Error ? error.message : '收益率图片生成失败', 'error')
    } finally {
        exportingReturnImage.value = false
    }
}

const resetDailyNewStrategy = () => {
    dailyNewStrategy.name = ''
    dailyNewStrategy.amount = 0
    dailyNewStrategy.cashFlow = 0
    dailyNewStrategy.note = ''
    dailyNewStrategy.color = colorPalette[strategies.length % colorPalette.length]
}

const saveToday = async () => {
    if (dailySaving.value) return

    const newStrategyName = dailyNewStrategy.name.trim()
    if (
        showDailyNewStrategy.value &&
        strategies.some(strategy => strategy.name === newStrategyName)
    ) {
        notify('策略名称已经存在', 'error')
        return
    }

    dailySaving.value = true
    try {
        const rows = strategies.map(strategy => ({
            id: strategy.id,
            amount: dailyEntryAmounts[strategy.id],
            cashFlow: Number(strategy.cashFlow || 0),
            note: strategy.note?.trim() || ''
        }))

        if (rows.some(row => row.amount === '' || row.amount === undefined)) {
            throw new Error('请填写全部策略的期末金额')
        }

        if (showDailyNewStrategy.value) {
            if (!newStrategyName) throw new Error('请填写新策略名称')
            const created = await createLedgerStrategy({
                strategyId: createStrategyId(newStrategyName),
                name: newStrategyName,
                color: dailyNewStrategy.color,
                category: '用户自定义',
                sortOrder: strategies.length
            })
            rows.push({
                id: created.strategy.strategyId,
                amount: Number(dailyNewStrategy.amount || 0),
                cashFlow: Number(dailyNewStrategy.cashFlow || 0),
                note: dailyNewStrategy.note.trim()
            })
        }

        const result = await saveDailyLedgerRecords(
            rows.map(row => ({
                strategyId: row.id,
                amount: Number(row.amount),
                cashFlow: row.cashFlow,
                note: row.note
            }))
        )
        defaultLedgerEntryDate.value = result.date

        showDailyEntryModal.value = false
        showDailyNewStrategy.value = false
        showDailyAdvancedFields.value = false
        resetDailyNewStrategy()
        await loadLedgerBundle()
        notify('今日策略记录已保存', 'success')
    } catch (error) {
        notify(error instanceof Error ? error.message : '今日记录保存失败', 'error')
    } finally {
        dailySaving.value = false
    }
}

const syncRecordCashFlow = (record: LedgerRecord) => {
    cashFlowEvents.value = cashFlowEvents.value.filter(item => item.recordId !== record.id)
    if (Number(record.cashFlow || 0) === 0) return

    cashFlowEvents.value.unshift({
        id: `flow-${record.id}`,
        recordId: record.id,
        date: record.date,
        strategy: record.strategy,
        nav: record.nav,
        amount: Number(record.cashFlow),
        type: record.cashFlow > 0 ? '转入' : '转出',
        note: record.note || '账本记录'
    })
}

const resetRecordForm = () => {
    recordForm.date = hasLedgerData.value ? latestLedgerDate.value : todayDate
    recordForm.strategyId = strategies[0]?.id || ''
    recordForm.strategy = strategies[0]?.name || ''
    recordStrategySelection.value = recordForm.strategy || newStrategyOption
    recordForm.amount = 0
    recordForm.cashFlow = 0
    recordForm.note = ''
}

const openNewRecord = () => {
    editingRecordId.value = ''
    resetRecordForm()
    showEntryModal.value = true
}

const openTodayEntry = () => {
    if (hasStrategies.value) {
        strategies.forEach(strategy => {
            const targetRecord = recentRecords.value.find(
                record =>
                    record.strategyId === strategy.id && record.date === dailyEntryDate.value
            )
            const previousRecord = recentRecords.value
                .filter(
                    record =>
                        record.strategyId === strategy.id && record.date < dailyEntryDate.value
                )
                .sort((a, b) => b.date.localeCompare(a.date))[0]

            strategy.previous = previousRecord?.amount || 0
            strategy.cashFlow = targetRecord?.cashFlow || 0
            strategy.note = targetRecord?.note || ''
            dailyPreviousDates[strategy.id] = previousRecord?.date || ''
            dailyEntryAmounts[strategy.id] = targetRecord?.amount ?? ''
        })
        showDailyNewStrategy.value = false
        showDailyAdvancedFields.value = false
        resetDailyNewStrategy()
        showDailyEntryModal.value = true
        return
    }

    editingRecordId.value = ''
    resetRecordForm()
    recordForm.date = dailyEntryDate.value
    recordForm.strategyId = ''
    recordForm.strategy = ''
    recordStrategySelection.value = newStrategyOption
    showEntryModal.value = true
}

const openEditRecord = (record: LedgerRecord) => {
    editingRecordId.value = record.id
    recordForm.date = record.date
    recordForm.strategyId = record.strategyId
    recordForm.strategy = record.strategy
    recordStrategySelection.value = record.strategy
    recordForm.amount = record.amount
    recordForm.cashFlow = record.cashFlow
    recordForm.note = record.note
    showEntryModal.value = true
}

const ensureRecordStrategy = async () => {
    const strategyName = recordForm.strategy.trim()
    const existingById = managedStrategies.value.find(item => item.id === recordForm.strategyId)
    if (existingById && existingById.name === strategyName) return existingById

    const existing = strategies.find(item => item.name === strategyName)
    if (existing) return existing

    const created = await createLedgerStrategy({
        strategyId: createStrategyId(strategyName),
        name: strategyName,
        color: colorPalette[strategies.length % colorPalette.length],
        category: '用户自定义',
        sortOrder: strategies.length
    })

    return {
        id: created.strategy.strategyId,
        name: created.strategy.name,
        amount: 0,
        previous: 0,
        cashFlow: 0,
        note: '',
        color: created.strategy.color || colorPalette[strategies.length % colorPalette.length],
        archived: false
    }
}

const saveRecord = async () => {
    const strategyName = recordForm.strategy.trim()
    if (!strategyName) {
        notify('请先填写策略名称')
        return
    }

    try {
        const strategy = await ensureRecordStrategy()
        const existing = recentRecords.value.find(item => item.id === editingRecordId.value)
        const saved = await saveLedgerRecord(
            {
                strategyId: strategy.id,
                date: recordForm.date,
                amount: Number(recordForm.amount),
                cashFlow: Number(recordForm.cashFlow || 0),
                note: recordForm.note.trim()
            },
            editingRecordId.value
        )
        const record: LedgerRecord = {
            id: saved.record.id,
            strategyId: strategy.id,
            date: recordForm.date,
            strategy: strategy.name,
            amount: Number(recordForm.amount),
            cashFlow: Number(recordForm.cashFlow || 0),
            return: existing?.return || 0,
            nav: existing?.nav || 1,
            note: recordForm.note.trim(),
            color: strategy.color
        }

        if (existing) {
            Object.assign(existing, record)
        } else {
            recentRecords.value.unshift(record)
        }

        syncRecordCashFlow(record)
        recentRecords.value.sort((a, b) => b.date.localeCompare(a.date) || a.strategy.localeCompare(b.strategy))
        editingRecordId.value = ''
        showEntryModal.value = false
        await loadLedgerBundle()
        notify(existing ? '记录已更新，后续净值已重新计算' : '补录成功，后续净值将自动重算')
    } catch (error) {
        notify(error instanceof Error ? error.message : '记录保存失败')
    }
}

const requestDeleteRecord = (record: LedgerRecord) => {
    pendingDeleteRecord.value = record
    showDeleteModal.value = true
}

const confirmDeleteRecord = async () => {
    const record = pendingDeleteRecord.value
    if (!record) return

    try {
        await deleteLedgerRecord(record.id)
        recentRecords.value = recentRecords.value.filter(item => item.id !== record.id)
        cashFlowEvents.value = cashFlowEvents.value.filter(item => item.recordId !== record.id)
        pendingDeleteRecord.value = null
        showDeleteModal.value = false
        await loadLedgerBundle()
        notify('记录已删除', 'success')
    } catch (error) {
        notify(error instanceof Error ? error.message : '记录删除失败', 'error')
    }
}

const openStrategyManager = () => {
    strategyNameError.value = ''
    managedStrategies.value.forEach(strategy => {
        strategyNameDrafts[strategy.id] = strategy.name
    })
    showStrategyModal.value = true
}

const saveStrategyNames = async () => {
    const managedRows = managedStrategies.value
    const nextNamesById = new Map(
        managedRows.map(strategy => [strategy.id, strategyNameDrafts[strategy.id]?.trim() || ''])
    )
    const activeNames = strategies.map(strategy => nextNamesById.get(strategy.id) || '')
    if ([...nextNamesById.values()].some(name => !name)) {
        strategyNameError.value = '策略名称不能为空。'
        return
    }
    if (new Set(activeNames).size !== activeNames.length) {
        strategyNameError.value = '当前策略名称不能重复。'
        return
    }

    try {
        for (const strategy of managedRows) {
            const newName = nextNamesById.get(strategy.id) || strategy.name
            if (strategy.name !== newName) await renameLedgerStrategy(strategy.id, newName)
        }
        strategyNameError.value = ''
        showStrategyModal.value = false
        await loadLedgerBundle()
        notify('策略名称已同步更新', 'success')
    } catch (error) {
        strategyNameError.value = error instanceof Error ? error.message : '策略名称保存失败'
    }
}

const requestDeleteStrategy = (strategy: StrategyDraft) => {
    pendingDeleteStrategy.value = strategy
    showStrategyModal.value = false
    showDeleteStrategyModal.value = true
}

const requestArchiveStrategy = (strategy: StrategyDraft) => {
    if (Math.abs(Number(strategy.amount || 0)) > 0.005) {
        notify(`该策略当前期末金额为 ${displayMoney(strategy.amount)}，请先补录清仓记录后再归档`, 'error')
        return
    }

    pendingArchiveStrategy.value = strategy
    pendingArchiveMode.value = 'archive'
    showStrategyModal.value = false
    showArchiveStrategyModal.value = true
}

const requestRestoreStrategy = (strategy: StrategyDraft) => {
    pendingArchiveStrategy.value = strategy
    pendingArchiveMode.value = 'restore'
    showStrategyModal.value = false
    showArchiveStrategyModal.value = true
}

const confirmArchiveStrategy = async () => {
    const strategy = pendingArchiveStrategy.value
    if (!strategy || strategyArchiving.value) return

    strategyArchiving.value = true
    try {
        await setLedgerStrategyArchived(strategy.id, pendingArchiveMode.value === 'archive')
        showArchiveStrategyModal.value = false
        pendingArchiveStrategy.value = null
        await loadLedgerBundle()
        notify(pendingArchiveMode.value === 'archive' ? '策略已归档' : '策略已重新启用', 'success')
    } catch (error) {
        notify(error instanceof Error ? error.message : '策略状态更新失败', 'error')
    } finally {
        strategyArchiving.value = false
    }
}

const confirmDeleteStrategy = async () => {
    const strategy = pendingDeleteStrategy.value
    if (!strategy || strategyDeleting.value) return

    strategyDeleting.value = true
    try {
        const result = await deleteLedgerStrategy(strategy.id)
        showDeleteStrategyModal.value = false
        showStrategyModal.value = false
        pendingDeleteStrategy.value = null
        await loadLedgerBundle()
        notify(`策略已删除，同时移除 ${result.deletedRecords} 条记录`, 'success')
    } catch (error) {
        notify(error instanceof Error ? error.message : '策略删除失败', 'error')
    } finally {
        strategyDeleting.value = false
    }
}

const resetImportState = () => {
    importDragDepth = 0
    importDragActive.value = false
    selectedFileName.value = ''
    selectedImportFile.value = null
    importPreviewRows.value = []
    importIssues.value = []
    importParsing.value = false
    importSaving.value = false
}
const openImport = () => {
    resetImportState()
    showImportModal.value = true
}
const setImportFile = (file: File | null) => {
    if (!file) return

    const lowerName = file.name.toLowerCase()
    const supported = ['.xlsx', '.xls', '.csv', '.tsv'].some(extension =>
        lowerName.endsWith(extension)
    )
    if (!supported) {
        notify('请选择 XLSX、XLS、CSV 或 TSV 文件', 'error')
        return
    }

    selectedImportFile.value = file
    selectedFileName.value = file.name
    importPreviewRows.value = []
    importIssues.value = []
}
const handleFileSelect = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0] || null
    setImportFile(file)
}
const handleImportDragEnter = () => {
    importDragDepth += 1
    importDragActive.value = true
}
const handleImportDragLeave = () => {
    importDragDepth = Math.max(0, importDragDepth - 1)
    if (importDragDepth === 0) importDragActive.value = false
}
const handleImportDrop = (event: DragEvent) => {
    importDragDepth = 0
    importDragActive.value = false
    setImportFile(event.dataTransfer?.files?.[0] || null)
}
const normalizeImportHeader = (value: WorksheetCell) =>
    String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[\s_()（）:：/\\-]/g, '')
const importHeaderAliases: Record<string, string[]> = {
    date: ['记录日期', '日期', 'date', 'recorddate'],
    strategy: ['策略名称', '策略', 'strategyname', 'strategy'],
    amount: ['期末金额', '期末总市值', '期末市值', '总市值', '金额', '总资产', '资产', 'amount', 'endamount'],
    cashFlow: ['当日现金流', '现金流', '资金流', '操作金额', '出入金', 'cashflow', 'flow'],
    note: ['备注', '说明', 'note', 'memo']
}
const findImportHeaderKey = (value: WorksheetCell) => {
    const normalized = normalizeImportHeader(value)
    return Object.entries(importHeaderAliases).find(([, aliases]) =>
        aliases.some(alias => normalizeImportHeader(alias) === normalized)
    )?.[0]
}
const parseDelimitedRows = (text: string, delimiter: string) => {
    const rows: WorksheetCell[][] = []
    let row: WorksheetCell[] = []
    let cell = ''
    let quoted = false

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index]
        const next = text[index + 1]

        if (char === '"') {
            if (quoted && next === '"') {
                cell += '"'
                index += 1
            } else quoted = !quoted
            continue
        }

        if (!quoted && char === delimiter) {
            row.push(cell.trim())
            cell = ''
            continue
        }

        if (!quoted && (char === '\n' || char === '\r')) {
            if (char === '\r' && next === '\n') index += 1
            row.push(cell.trim())
            rows.push(row)
            row = []
            cell = ''
            continue
        }

        cell += char
    }

    row.push(cell.trim())
    if (row.some(item => String(item || '').trim())) rows.push(row)
    return rows
}
const parseHtmlTableRows = (text: string) => {
    const document = new DOMParser().parseFromString(text, 'text/html')
    const table = document.querySelector('table')
    if (!table) throw new Error('未在文件中找到表格')

    return Array.from(table.querySelectorAll('tr')).map(row =>
        Array.from(row.querySelectorAll('th,td')).map(cell => cell.textContent?.trim() || '')
    )
}
const readUInt16 = (bytes: Uint8Array, offset: number) =>
    bytes[offset] | (bytes[offset + 1] << 8)
const readUInt32 = (bytes: Uint8Array, offset: number) =>
    (bytes[offset] |
        (bytes[offset + 1] << 8) |
        (bytes[offset + 2] << 16) |
        (bytes[offset + 3] << 24)) >>>
    0
const inflateRaw = async (bytes: Uint8Array) => {
    const DecompressionStreamCtor = (globalThis as any).DecompressionStream
    if (!DecompressionStreamCtor) {
        throw new Error('当前浏览器暂不支持直接解析 XLSX，请先使用下载模板或 CSV 导入')
    }

    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStreamCtor('deflate-raw'))
    return new Uint8Array(await new Response(stream).arrayBuffer())
}
const listZipEntries = async (bytes: Uint8Array) => {
    const decoder = new TextDecoder()
    const entries = new Map<string, Uint8Array>()
    let endOffset = -1
    const minOffset = Math.max(0, bytes.length - 66000)

    for (let offset = bytes.length - 22; offset >= minOffset; offset -= 1) {
        if (readUInt32(bytes, offset) === 0x06054b50) {
            endOffset = offset
            break
        }
    }

    if (endOffset < 0) throw new Error('XLSX 文件结构不完整')

    const totalEntries = readUInt16(bytes, endOffset + 10)
    let centralOffset = readUInt32(bytes, endOffset + 16)

    for (let index = 0; index < totalEntries; index += 1) {
        if (readUInt32(bytes, centralOffset) !== 0x02014b50) break

        const method = readUInt16(bytes, centralOffset + 10)
        const compressedSize = readUInt32(bytes, centralOffset + 20)
        const nameLength = readUInt16(bytes, centralOffset + 28)
        const extraLength = readUInt16(bytes, centralOffset + 30)
        const commentLength = readUInt16(bytes, centralOffset + 32)
        const localOffset = readUInt32(bytes, centralOffset + 42)
        const name = decoder.decode(bytes.slice(centralOffset + 46, centralOffset + 46 + nameLength))
        const localNameLength = readUInt16(bytes, localOffset + 26)
        const localExtraLength = readUInt16(bytes, localOffset + 28)
        const dataStart = localOffset + 30 + localNameLength + localExtraLength
        const compressedData = bytes.slice(dataStart, dataStart + compressedSize)
        const data =
            method === 0 ? compressedData : method === 8 ? await inflateRaw(compressedData) : null

        if (data) entries.set(name, data)
        centralOffset += 46 + nameLength + extraLength + commentLength
    }

    return entries
}
const xmlElements = (root: Document | Element, localName: string) =>
    Array.from(root.getElementsByTagName('*')).filter(element => element.localName === localName)
const parseXmlDocument = (xml: string) => {
    const document = new DOMParser().parseFromString(xml, 'application/xml')
    if (document.getElementsByTagName('parsererror').length) throw new Error('XLSX XML 解析失败')
    return document
}
const normalizeXlsxPath = (target: string) => {
    const parts = (target.startsWith('/') ? target.slice(1) : `xl/${target}`).split('/')
    const stack: string[] = []

    parts.forEach(part => {
        if (!part || part === '.') return
        if (part === '..') stack.pop()
        else stack.push(part)
    })

    return stack.join('/')
}
const excelSerialToDate = (serial: number) => {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
const getXlsxDateStyleIndexes = (stylesXml = '') => {
    if (!stylesXml) return new Set<number>()
    const builtInDateNumFmts = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47])
    const customDateNumFmts = new Set<number>()
    const document = parseXmlDocument(stylesXml)

    xmlElements(document, 'numFmt').forEach(element => {
        const formatCode = element.getAttribute('formatCode') || ''
        const id = Number(element.getAttribute('numFmtId'))
        if (/[ymdhs]/i.test(formatCode) && Number.isFinite(id)) customDateNumFmts.add(id)
    })

    const cellXfs = xmlElements(document, 'cellXfs')[0]
    const dateStyleIndexes = new Set<number>()
    if (!cellXfs) return dateStyleIndexes

    Array.from(cellXfs.children).forEach((element, index) => {
        if (element.localName !== 'xf') return
        const id = Number(element.getAttribute('numFmtId'))
        if (builtInDateNumFmts.has(id) || customDateNumFmts.has(id)) dateStyleIndexes.add(index)
    })

    return dateStyleIndexes
}
const columnRefToIndex = (cellRef: string) =>
    cellRef
        .replace(/\d/g, '')
        .split('')
        .reduce((total, char) => total * 26 + char.toUpperCase().charCodeAt(0) - 64, 0) - 1
const parseXlsxRows = async (bytes: Uint8Array) => {
    const decoder = new TextDecoder()
    const entries = await listZipEntries(bytes)
    const textEntry = (path: string) => {
        const entry = entries.get(path)
        return entry ? decoder.decode(entry) : ''
    }
    const workbook = parseXmlDocument(textEntry('xl/workbook.xml'))
    const rels = parseXmlDocument(textEntry('xl/_rels/workbook.xml.rels'))
    const firstSheet = xmlElements(workbook, 'sheet')[0]
    const relationId = firstSheet?.getAttribute('r:id')
    const relation = xmlElements(rels, 'Relationship').find(item => item.getAttribute('Id') === relationId)
    const sheetPath = relation?.getAttribute('Target')
        ? normalizeXlsxPath(relation.getAttribute('Target') || '')
        : 'xl/worksheets/sheet1.xml'
    const sheetXml = textEntry(sheetPath)
    if (!sheetXml) throw new Error('XLSX 中未找到首个工作表')

    const sharedStringsXml = textEntry('xl/sharedStrings.xml')
    const sharedStrings = sharedStringsXml
        ? xmlElements(parseXmlDocument(sharedStringsXml), 'si').map(item =>
              xmlElements(item, 't')
                  .map(text => text.textContent || '')
                  .join('')
          )
        : []
    const dateStyleIndexes = getXlsxDateStyleIndexes(textEntry('xl/styles.xml'))
    const sheet = parseXmlDocument(sheetXml)

    return xmlElements(sheet, 'row').map(row => {
        const cells: WorksheetCell[] = []
        Array.from(row.children)
            .filter(cell => cell.localName === 'c')
            .forEach(cell => {
                const columnIndex = cell.getAttribute('r')
                    ? columnRefToIndex(cell.getAttribute('r') || '')
                    : cells.length
                const type = cell.getAttribute('t')
                const style = Number(cell.getAttribute('s') || -1)
                const valueText = xmlElements(cell, 'v')[0]?.textContent || ''
                let value: WorksheetCell = valueText

                if (type === 's') value = sharedStrings[Number(valueText)] || ''
                else if (type === 'inlineStr') {
                    value = xmlElements(cell, 't')
                        .map(text => text.textContent || '')
                        .join('')
                } else if (type === 'b') value = valueText === '1'
                else if (valueText && dateStyleIndexes.has(style)) value = excelSerialToDate(Number(valueText))
                else if (valueText && !Number.isNaN(Number(valueText))) value = Number(valueText)

                cells[columnIndex] = value
            })
        return cells
    })
}
const parseWorkbookRows = async (file: File) => {
    const lowerName = file.name.toLowerCase()
    if (lowerName.endsWith('.csv')) return parseDelimitedRows(await file.text(), ',')
    if (lowerName.endsWith('.tsv')) return parseDelimitedRows(await file.text(), '\t')

    const bytes = new Uint8Array(await file.arrayBuffer())
    const headText = new TextDecoder('utf-8').decode(bytes.slice(0, 512)).replace(/^\uFEFF/, '')

    if (headText.trimStart().startsWith('<')) return parseHtmlTableRows(await file.text())
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) return parseXlsxRows(bytes)

    throw new Error('暂不支持二进制 .xls，请使用下载的标准模板、.xlsx、CSV 或 TSV')
}
const isValidCalendarDate = (value: string) => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return false

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const parsed = new Date(Date.UTC(year, month - 1, day))
    return (
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day
    )
}
const parseImportDate = (value: WorksheetCell) => {
    if (typeof value === 'number') return excelSerialToDate(value)
    const text = String(value ?? '').trim()
    if (!text) return ''
    const match = text.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
    if (!match) return ''
    const normalized = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
    return isValidCalendarDate(normalized) ? normalized : ''
}
const parseImportNumber = (value: WorksheetCell) => {
    if (typeof value === 'number') return value
    const text = String(value ?? '')
        .trim()
        .replace(/[￥¥,\s]/g, '')
    if (!text) return 0
    const normalized = /^\(.*\)$/.test(text) ? `-${text.slice(1, -1)}` : text
    const number = Number(normalized)
    return Number.isFinite(number) ? number : Number.NaN
}
const buildImportPreviewRows = (rows: WorksheetCell[][]) => {
    const headerRowIndex = rows.findIndex(row => row.map(findImportHeaderKey).filter(Boolean).length >= 3)
    if (headerRowIndex < 0) throw new Error('未识别到表头，请使用标准模板列名')

    const headerMap: Record<string, number> = {}
    rows[headerRowIndex].forEach((cell, index) => {
        const key = findImportHeaderKey(cell)
        if (key && headerMap[key] === undefined) headerMap[key] = index
    })
    ;['date', 'strategy', 'amount'].forEach(key => {
        if (headerMap[key] === undefined) throw new Error('模板必须包含：记录日期、策略名称、期末金额')
    })

    const existingKeys = new Set(recentRecords.value.map(record => `${record.date}|${record.strategy}`))
    const fileKeyCounts = new Map<string, number>()
    const dataRows = rows
        .slice(headerRowIndex + 1)
        .filter(row => row.some(cell => String(cell ?? '').trim()))
    const previewRows = dataRows
        .map((row, index) => {
            const date = parseImportDate(row[headerMap.date])
            const strategy = String(row[headerMap.strategy] ?? '').trim()
            const amount = parseImportNumber(row[headerMap.amount])
            const cashFlow =
                headerMap.cashFlow === undefined ? 0 : parseImportNumber(row[headerMap.cashFlow])
            const note = headerMap.note === undefined ? '' : String(row[headerMap.note] ?? '').trim()
            const key = `${date}|${strategy}`
            if (date || strategy) fileKeyCounts.set(key, (fileKeyCounts.get(key) || 0) + 1)
            const existsInLedger = existingKeys.has(key)

            return {
                rowNumber: headerRowIndex + index + 2,
                date,
                strategy,
                amount,
                cashFlow,
                note,
                strategyStatus: existsInLedger
                    ? '已存在，将跳过'
                    : strategies.some(item => item.name === strategy)
                      ? '匹配已有策略'
                      : '将新建策略',
                errors: [] as string[]
            }
        })
        .filter(row => row.date || row.strategy || Number.isFinite(row.amount))

    previewRows.forEach(row => {
        const key = `${row.date}|${row.strategy}`
        if (!row.date) row.errors.push('日期格式不正确')
        if (!row.strategy) row.errors.push('策略名称不能为空')
        if (!Number.isFinite(row.amount) || row.amount < 0) row.errors.push('期末金额不正确')
        if (!Number.isFinite(row.cashFlow)) row.errors.push('现金流不正确')
        if ((fileKeyCounts.get(key) || 0) > 1) row.errors.push('文件内存在重复日期和策略')
    })

    return previewRows
}
const escapeXmlText = (value: string | number | boolean) =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
const columnName = (index: number) => {
    let name = ''
    let current = index + 1
    while (current > 0) {
        const remainder = (current - 1) % 26
        name = String.fromCharCode(65 + remainder) + name
        current = Math.floor((current - 1) / 26)
    }
    return name
}
const xlsxCrcTable = (() => {
    const table: number[] = []
    for (let index = 0; index < 256; index += 1) {
        let value = index
        for (let bit = 0; bit < 8; bit += 1) {
            value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
        }
        table[index] = value >>> 0
    }
    return table
})()
const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff
    bytes.forEach(byte => {
        crc = xlsxCrcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    })
    return (crc ^ 0xffffffff) >>> 0
}
const writeUInt16 = (bytes: Uint8Array, offset: number, value: number) => {
    bytes[offset] = value & 0xff
    bytes[offset + 1] = (value >>> 8) & 0xff
}
const writeUInt32 = (bytes: Uint8Array, offset: number, value: number) => {
    bytes[offset] = value & 0xff
    bytes[offset + 1] = (value >>> 8) & 0xff
    bytes[offset + 2] = (value >>> 16) & 0xff
    bytes[offset + 3] = (value >>> 24) & 0xff
}
const concatBytes = (parts: Uint8Array[]) => {
    const totalLength = parts.reduce((total, part) => total + part.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    parts.forEach(part => {
        result.set(part, offset)
        offset += part.length
    })
    return result
}
const encodeText = (text: string) => new TextEncoder().encode(text)
const buildXlsxCell = (cell: WorksheetCell, rowIndex: number, columnIndex: number) => {
    const ref = `${columnName(columnIndex)}${rowIndex + 1}`
    if (typeof cell === 'number') {
        return Number.isFinite(cell) ? `<c r="${ref}"><v>${cell}</v></c>` : `<c r="${ref}"/>`
    }
    if (typeof cell === 'boolean') return `<c r="${ref}" t="b"><v>${cell ? 1 : 0}</v></c>`
    const text = escapeXmlText(cell ?? '')
    return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`
}
const buildXlsxSheetXml = (rows: WorksheetCell[][]) => {
    const maxColumns = Math.max(...rows.map(row => row.length), 1)
    const columnDefinitions = Array.from({ length: maxColumns }, (_, index) => {
        const column = index + 1
        return `<col min="${column}" max="${column}" width="${index === 4 ? 24 : 16}" customWidth="1"/>`
    }).join('')
    const rowXml = rows
        .map((row, rowIndex) => {
            const cells = row.map((cell, columnIndex) => buildXlsxCell(cell, rowIndex, columnIndex)).join('')
            return `<row r="${rowIndex + 1}">${cells}</row>`
        })
        .join('')

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0"/></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>
<cols>${columnDefinitions}</cols>
<sheetData>${rowXml}</sheetData>
</worksheet>`
}
const createZipBlob = (files: { name: string; content: string | Uint8Array }[], type: string) => {
    const fileEntries = files.map(file => {
        const nameBytes = encodeText(file.name)
        const data = typeof file.content === 'string' ? encodeText(file.content) : file.content
        return {
            ...file,
            nameBytes,
            data,
            crc: crc32(data),
            offset: 0
        }
    })
    const localParts: Uint8Array[] = []
    let offset = 0

    fileEntries.forEach(entry => {
        entry.offset = offset
        const header = new Uint8Array(30)
        writeUInt32(header, 0, 0x04034b50)
        writeUInt16(header, 4, 20)
        writeUInt16(header, 6, 0)
        writeUInt16(header, 8, 0)
        writeUInt16(header, 10, 0)
        writeUInt16(header, 12, 0)
        writeUInt32(header, 14, entry.crc)
        writeUInt32(header, 18, entry.data.length)
        writeUInt32(header, 22, entry.data.length)
        writeUInt16(header, 26, entry.nameBytes.length)
        writeUInt16(header, 28, 0)
        localParts.push(header, entry.nameBytes, entry.data)
        offset += header.length + entry.nameBytes.length + entry.data.length
    })

    const centralDirectoryOffset = offset
    const centralParts: Uint8Array[] = []
    fileEntries.forEach(entry => {
        const header = new Uint8Array(46)
        writeUInt32(header, 0, 0x02014b50)
        writeUInt16(header, 4, 20)
        writeUInt16(header, 6, 20)
        writeUInt16(header, 8, 0)
        writeUInt16(header, 10, 0)
        writeUInt16(header, 12, 0)
        writeUInt16(header, 14, 0)
        writeUInt32(header, 16, entry.crc)
        writeUInt32(header, 20, entry.data.length)
        writeUInt32(header, 24, entry.data.length)
        writeUInt16(header, 28, entry.nameBytes.length)
        writeUInt16(header, 30, 0)
        writeUInt16(header, 32, 0)
        writeUInt16(header, 34, 0)
        writeUInt16(header, 36, 0)
        writeUInt32(header, 38, 0)
        writeUInt32(header, 42, entry.offset)
        centralParts.push(header, entry.nameBytes)
        offset += header.length + entry.nameBytes.length
    })

    const centralDirectorySize = offset - centralDirectoryOffset
    const end = new Uint8Array(22)
    writeUInt32(end, 0, 0x06054b50)
    writeUInt16(end, 4, 0)
    writeUInt16(end, 6, 0)
    writeUInt16(end, 8, fileEntries.length)
    writeUInt16(end, 10, fileEntries.length)
    writeUInt32(end, 12, centralDirectorySize)
    writeUInt32(end, 16, centralDirectoryOffset)
    writeUInt16(end, 20, 0)

    return new Blob([concatBytes([...localParts, ...centralParts, end])], { type })
}
const createXlsxBlob = (rows: WorksheetCell[][]) =>
    createZipBlob(
        [
            {
                name: '[Content_Types].xml',
                content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
            },
            {
                name: '_rels/.rels',
                content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
            },
            {
                name: 'xl/workbook.xml',
                content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="投资账本" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
            },
            {
                name: 'xl/_rels/workbook.xml.rels',
                content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
            },
            {
                name: 'xl/styles.xml',
                content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="1"><fill><patternFill patternType="none"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`
            },
            {
                name: 'xl/worksheets/sheet1.xml',
                content: buildXlsxSheetXml(rows)
            }
        ],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
const downloadImportTemplate = () => {
    const headers = ['记录日期', '策略名称', '期末金额', '当日现金流', '备注']
    const rows = [
        ['2026-06-18', '全天候策略', 2241802.69, 0, '示例：盘后净值'],
        ['2026-06-18', '可转债策略', 723464.11, 30000, '示例：追加资金'],
        ['2026-06-18', '微盘股策略', 650181.8, -15000, '示例：降低仓位']
    ]
    const blob = createXlsxBlob([headers, ...rows])
    downloadBlob(blob, '投资账本导入模板.xlsx')
    notify('标准模板已下载')
}
const downloadCurrentLedgerExcel = () => {
    if (!recentRecords.value.length) {
        notify('当前没有可导出的账本记录', 'error')
        return
    }

    const headers = ['记录日期', '策略名称', '期末金额', '当日现金流', '备注']
    const rows = recentRecords.value
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date) || a.strategy.localeCompare(b.strategy))
        .map(record => [
            record.date,
            record.strategy,
            Number(record.amount.toFixed(2)),
            Number(record.cashFlow.toFixed(2)),
            record.note || ''
        ])
    const blob = createXlsxBlob([headers, ...rows])
    downloadBlob(blob, `投资账本-${latestLedgerDate.value || todayDate}.xlsx`)
    notify('当前账本已导出')
}
const previewImport = async () => {
    const file = selectedImportFile.value
    if (!file) {
        notify('请先选择要导入的文件', 'error')
        return
    }

    importParsing.value = true
    importIssues.value = []
    importPreviewRows.value = []

    try {
        const rows = await parseWorkbookRows(file)
        const previewRows = buildImportPreviewRows(rows)
        importPreviewRows.value = previewRows
        if (!previewRows.length) importIssues.value = ['文件中没有可导入的数据行']
        else if (previewRows.length > 2000) {
            importIssues.value = ['单个文件最多导入 2,000 条记录，请拆分文件后重试']
        }
        else if (previewRows.some(row => row.errors.length)) {
            importIssues.value = ['存在需要修正的记录，请处理后重新选择文件解析']
        }
        notify(`已解析 ${previewRows.length} 条记录`, 'success')
    } catch (error) {
        importIssues.value = [error instanceof Error ? error.message : '文件解析失败']
        notify(importIssues.value[0], 'error')
    } finally {
        importParsing.value = false
    }
}
const confirmImportRecords = async () => {
    if (!validImportRows.value.length) {
        notify('没有可导入的记录', 'error')
        return
    }
    if (hasImportErrors.value) {
        notify('请先修正预览中的错误记录', 'error')
        return
    }

    importSaving.value = true

    try {
        const latestBundle = await getLedgerBundle()
        const latestStrategies = latestBundle.strategies.filter(strategy => !strategy.archived)
        const strategyIdByName = new Map(
            latestStrategies.map(strategy => [strategy.name, strategy.strategyId])
        )
        const uniqueStrategyNames = [...new Set(validImportRows.value.map(row => row.strategy))]
        let createdStrategyCount = 0

        for (const [index, strategyName] of uniqueStrategyNames.entries()) {
            if (strategyIdByName.has(strategyName)) continue

            const created = await createLedgerStrategy({
                strategyId: createStrategyId(
                    strategyName,
                    `import-${Date.now()}-${index + 1}`
                ),
                name: strategyName,
                color: colorPalette[(latestStrategies.length + createdStrategyCount) % colorPalette.length],
                category: '用户自定义',
                sortOrder: latestStrategies.length + createdStrategyCount
            })
            strategyIdByName.set(strategyName, created.strategy.strategyId)
            createdStrategyCount += 1
        }

        const records = validImportRows.value.map(row => {
            const strategyId = strategyIdByName.get(row.strategy)
            if (!strategyId) throw new Error(`未找到策略：${row.strategy}`)

            return {
                strategyId,
                date: row.date,
                amount: row.amount,
                cashFlow: row.cashFlow,
                note: row.note
            }
        })

        const importBatchSize = 50
        let importedCount = 0
        let skippedCount = 0
        for (let index = 0; index < records.length; index += importBatchSize) {
            const importResult = await saveLedgerRecords(
                records.slice(index, index + importBatchSize),
                { skipExisting: true }
            )
            importedCount += importResult.records.length
            skippedCount += importResult.skipped
        }
        showImportModal.value = false
        resetImportState()
        await loadLedgerBundle()
        notify(
            importedCount
                ? `已导入 ${importedCount} 条记录${skippedCount ? `，跳过 ${skippedCount} 条重复记录` : ''}${createdStrategyCount ? `，新建 ${createdStrategyCount} 个策略` : ''}`
                : `所选记录均已存在，已跳过 ${skippedCount} 条重复记录`,
            importedCount ? 'success' : 'info'
        )
    } catch (error) {
        await loadLedgerBundle()
        notify(error instanceof Error ? error.message : '导入失败', 'error')
    } finally {
        importSaving.value = false
    }
}
</script>

<style scoped>
* {
    box-sizing: border-box;
}

button,
input,
select {
    font: inherit;
}

button {
    letter-spacing: 0;
}

.page-wrapper {
    --ledger-accent: #4ecdc4;
    --ledger-accent-rgb: 78 205 196;

    padding: 3rem 1rem;
    min-height: 100vh;
    font-family: 'Noto Sans SC', sans-serif;
    color: #fff;
    background: radial-gradient(circle at 15% 50%, rgb(45 212 191 / 12%), transparent 40%),
        radial-gradient(circle at 85% 50%, rgb(0 170 255 / 9%), transparent 40%), #121212;
    background-color: #121212;
}

.main-container {
    margin: 0 auto;
    max-width: 1200px;
}

.page-header {
    position: relative;
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
    color: var(--ledger-accent);
}

.panel-heading,
.entry-footer,
.modal-header,
.modal-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
}

.main-title {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 0 0.5rem;
    font-size: 2.5rem;
    font-weight: 700;
    gap: 1rem;
}

h2,
h3,
p {
    margin: 0;
}

.title-icon {
    color: var(--ledger-accent);
    text-shadow: 0 0 15px rgb(var(--ledger-accent-rgb) / 70%);

    --menu-accent: var(--ledger-accent);
}

.subtitle {
    font-size: 1.1rem;
    color: #b0c4de;
}

.content-card {
    padding: 1.5rem 2rem;
    margin-bottom: 1.5rem;
    background: rgb(255 255 255 / 5%);
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 12px;
    opacity: 0;
    transition: border-color 0.3s ease;
    backdrop-filter: blur(10px);
    animation: fade-in-up 0.5s ease-out forwards;
    animation-delay: 0.15s;
}

.content-card:hover {
    border-color: rgb(var(--ledger-accent-rgb) / 50%);
}

.card-title {
    padding-left: 1rem;
    margin: 0;
    font-size: 1.35rem;
    border-left: 4px solid var(--ledger-accent);
    font-weight: 700;
}

.card-description {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #b0c4de;
    line-height: 1.6;
}

.overview-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    gap: 20px;
}

.header-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
}

.ledger-more-menu {
    position: relative;
    display: flex;
    align-items: center;
    height: 38px;
    flex: 0 0 auto;
}

.ledger-more-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 0;
    width: 26px;
    height: 38px;
    color: #cfe5e2;
    background: transparent;
    border: 0;
    transition: color 0.2s ease;
    cursor: pointer;
    gap: 3px;
}

.ledger-more-button:hover,
.ledger-more-button[aria-expanded='true'] {
    color: var(--ledger-accent);
}

.ledger-more-button span {
    display: block;
    width: 4px;
    height: 4px;
    background: currentcolor;
    border-radius: 50%;
}

.ledger-more-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 30;
    display: grid;
    padding: 6px;
    margin-top: 6px;
    width: 168px;
    background: rgb(13 20 28 / 98%);
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 8px;
    box-shadow: 0 18px 42px rgb(0 0 0 / 42%), 0 0 18px rgb(var(--ledger-accent-rgb) / 10%);
    backdrop-filter: blur(12px);
    gap: 2px;
}

.ledger-more-dropdown button {
    display: flex;
    align-items: center;
    padding: 9px 10px;
    min-height: 36px;
    font-size: 0.86rem;
    text-align: left;
    color: #dfe8f1;
    background: transparent;
    border: 0;
    border-radius: 6px;
    cursor: pointer;
    gap: 9px;
}

.ledger-more-dropdown button:hover {
    color: #e8fffd;
    background: rgb(var(--ledger-accent-rgb) / 10%);
}

.more-action-icon {
    position: relative;
    display: inline-block;
    width: 16px;
    height: 16px;
    color: var(--ledger-accent);
    flex: 0 0 auto;
}

.more-action-icon.capture {
    border: 1.5px solid currentcolor;
    border-radius: 4px;
}

.more-action-icon.capture::before,
.more-action-icon.export::before,
.more-action-icon.import::before,
.more-action-icon.target::before,
.more-action-icon.target::after,
.more-action-icon.add::before,
.more-action-icon.add::after {
    position: absolute;
    content: '';
}

.more-action-icon.capture::before {
    top: -4px;
    right: -4px;
    width: 7px;
    height: 7px;
    border-top: 1.5px solid currentcolor;
    border-right: 1.5px solid currentcolor;
}

.more-action-icon.export,
.more-action-icon.import {
    border: 1.5px solid currentcolor;
    border-radius: 3px;
}

.more-action-icon.export::before,
.more-action-icon.import::before {
    left: 5px;
    width: 5px;
    height: 5px;
    border-right: 1.5px solid currentcolor;
    border-bottom: 1.5px solid currentcolor;
}

.more-action-icon.export::before {
    top: 2px;
    transform: rotate(45deg);
}

.more-action-icon.import::before {
    bottom: 2px;
    transform: rotate(225deg);
}

.more-action-icon.target {
    border: 1.5px solid currentcolor;
    border-radius: 50%;
}

.more-action-icon.target::before {
    inset: 3px;
    border: 1.5px solid currentcolor;
    border-radius: 50%;
}

.more-action-icon.target::after {
    top: 6px;
    left: 6px;
    width: 4px;
    height: 4px;
    background: currentcolor;
    border-radius: 50%;
}

.more-action-icon.add {
    border: 1.5px solid currentcolor;
    border-radius: 50%;
}

.more-action-icon.add::before {
    top: 50%;
    left: 50%;
    width: 8px;
    height: 1.5px;
    background: currentcolor;
    transform: translate(-50%, -50%);
}

.more-action-icon.add::after {
    top: 50%;
    left: 50%;
    width: 1.5px;
    height: 8px;
    background: currentcolor;
    transform: translate(-50%, -50%);
}

.button {
    padding: 0 16px;
    min-height: 38px;
    color: #dfe8f1;
    background: #151d25;
    border: 1px solid #31404d;
    border-radius: 6px;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
    cursor: pointer;
}

.button:hover:not(:disabled) {
    border-color: var(--ledger-accent);
    transform: translateY(-1px);
}

.button.primary {
    color: #e8fffd;
    background: linear-gradient(90deg, rgb(var(--ledger-accent-rgb) / 9%), transparent);
    border-color: rgb(var(--ledger-accent-rgb) / 72%);
    box-shadow: 0 0 0 1px rgb(var(--ledger-accent-rgb) / 12%),
        0 0 16px rgb(var(--ledger-accent-rgb) / 10%);
    font-weight: 700;
}

.button.secondary {
    background: #151d25;
}

.button.featured-action {
    color: #e8fffd;
    background: linear-gradient(90deg, rgb(var(--ledger-accent-rgb) / 9%), transparent);
    border-color: rgb(var(--ledger-accent-rgb) / 72%);
    box-shadow: 0 0 0 1px rgb(var(--ledger-accent-rgb) / 12%),
        0 0 16px rgb(var(--ledger-accent-rgb) / 10%);
}

.button.featured-action:hover:not(:disabled) {
    background: linear-gradient(90deg, rgb(var(--ledger-accent-rgb) / 14%), transparent);
    box-shadow: 0 0 0 1px rgb(var(--ledger-accent-rgb) / 20%),
        0 0 22px rgb(var(--ledger-accent-rgb) / 18%);
}

.button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
}

.empty-ledger-card {
    padding: 2.25rem;
    text-align: center;
    border-color: rgb(var(--ledger-accent-rgb) / 24%);
}

.empty-ledger-card h2 {
    margin-top: 0.65rem;
    font-size: 1.5rem;
}

.empty-ledger-card p {
    margin: 0.75rem auto 0;
    max-width: 620px;
    color: #b0c4de;
    line-height: 1.7;
}

.empty-kicker {
    display: inline-flex;
    padding: 5px 10px;
    font-size: 12px;
    color: var(--ledger-accent);
    background: rgb(var(--ledger-accent-rgb) / 10%);
    border: 1px solid rgb(var(--ledger-accent-rgb) / 28%);
    border-radius: 999px;
}

.empty-actions {
    display: flex;
    justify-content: center;
    margin-top: 1.4rem;
    gap: 12px;
}

.empty-demo-preview {
    overflow: hidden;
    margin-top: 1.75rem;
    text-align: left;
    background: rgb(7 18 22 / 72%);
    border: 1px solid rgb(var(--ledger-accent-rgb) / 22%);
    border-radius: 8px;
}

.empty-demo-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid rgb(255 255 255 / 8%);
    gap: 16px;
}

.empty-demo-heading span,
.empty-demo-heading strong {
    display: block;
}

.empty-demo-heading span {
    margin-bottom: 3px;
    font-size: 12px;
    color: var(--ledger-accent);
}

.empty-demo-heading small {
    color: #7f91a4;
}

.empty-demo-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.empty-demo-metrics > div {
    padding: 12px 16px;
    border-right: 1px solid rgb(255 255 255 / 8%);
}

.empty-demo-metrics > div:last-child {
    border-right: 0;
}

.empty-demo-metrics span,
.empty-demo-metrics strong {
    display: block;
}

.empty-demo-metrics span {
    margin-bottom: 5px;
    font-size: 12px;
    color: #7f91a4;
}

.empty-demo-metrics strong {
    font-size: 16px;
}

.empty-demo-body {
    display: grid;
    align-items: stretch;
    grid-template-columns: minmax(0, 1fr) 220px;
}

.empty-demo-chart {
    width: 100%;
    height: 220px;
}

.empty-demo-strategies {
    display: grid;
    align-content: center;
    padding: 18px;
    border-left: 1px solid rgb(255 255 255 / 8%);
    gap: 14px;
}

.empty-demo-strategies > div {
    display: grid;
    align-items: center;
    grid-template-columns: 8px minmax(0, 1fr) auto;
    gap: 9px;
}

.empty-demo-strategies i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.empty-checklist {
    display: grid;
    margin-top: 1.5rem;
    text-align: left;
    gap: 12px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.empty-checklist article {
    padding: 14px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 8px;
}

.empty-checklist strong,
.empty-checklist span {
    display: block;
}

.empty-checklist strong {
    margin-bottom: 6px;
}

.empty-checklist span,
.empty-error {
    color: #9aaaba;
    line-height: 1.6;
}

.empty-error {
    margin-top: 1rem;
    color: #f4c95d;
}

.asset-summary-grid {
    display: grid;
    overflow: visible;
    background: rgb(0 0 0 / 20%);
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 8px;
    grid-template-columns: 1.25fr repeat(5, minmax(0, 1fr));
}

.asset-summary-grid article {
    position: relative;
    padding: 18px 16px;
    min-width: 0;
    border-right: 1px solid rgb(255 255 255 / 10%);
}

.asset-summary-grid article:last-child {
    border-right: 0;
}

.asset-summary-grid span,
.asset-summary-grid small {
    display: block;
    font-size: 12px;
    color: #8192a3;
}

.asset-summary-grid .metric-label-with-help {
    display: flex;
    align-items: center;
    gap: 6px;
}

.asset-summary-grid .metric-help {
    position: relative;
    display: inline-grid;
    width: 15px;
    height: 15px;
    font-size: 12px;
    font-family: Arial, sans-serif;
    color: var(--ledger-accent);
    border: 1px solid rgb(var(--ledger-accent-rgb) / 55%);
    border-radius: 50%;
    cursor: help;
    font-weight: 700;
    line-height: 1;
    place-items: center;
}

.asset-summary-grid .metric-help-tooltip {
    position: absolute;
    top: 22px;
    right: -8px;
    z-index: 20;
    display: block;
    padding: 10px 12px;
    width: 260px;
    font-size: 12px;
    color: #dfe8f1;
    background: #0d141b;
    border: 1px solid #344758;
    border-radius: 6px;
    opacity: 0;
    visibility: hidden;
    box-shadow: 0 12px 30px rgb(0 0 0 / 38%);
    line-height: 1.6;
    transform: translateY(-3px);
    transition: opacity 0.16s ease, transform 0.16s ease, visibility 0.16s;
    pointer-events: none;
}

.asset-summary-grid .metric-help:hover .metric-help-tooltip,
.asset-summary-grid .metric-help:focus .metric-help-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.asset-summary-grid strong {
    display: block;
    overflow: hidden;
    margin: 8px 0 5px;
    font-size: 19px;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #f4f7fb;
}

.asset-summary-primary strong {
    font-size: 22px;
}

.annual-target-panel {
    padding: 14px 16px;
    margin-top: 12px;
    background: linear-gradient(90deg, rgb(var(--ledger-accent-rgb) / 10%), rgb(255 255 255 / 3%));
    border: 1px solid rgb(var(--ledger-accent-rgb) / 22%);
    border-radius: 8px;
}

.annual-target-panel.achieved {
    background: linear-gradient(90deg, rgb(244 201 93 / 10%), rgb(var(--ledger-accent-rgb) / 5%));
    border-color: rgb(244 201 93 / 42%);
}

.annual-target-heading,
.annual-target-meta {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
}

.annual-target-heading > div span,
.annual-target-meta span {
    display: block;
    font-size: 12px;
    color: #8fa1b2;
}

.annual-target-heading > div strong {
    display: block;
    margin-top: 4px;
    font-size: 22px;
}

.annual-target-track {
    overflow: hidden;
    margin: 12px 0 10px;
    height: 9px;
    background: rgb(0 0 0 / 32%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 999px;
}

.annual-target-track i {
    display: block;
    width: 0;
    height: 100%;
    background: linear-gradient(90deg, var(--ledger-accent), #f4c95d);
    border-radius: inherit;
    box-shadow: 0 0 16px rgb(var(--ledger-accent-rgb) / 35%);
    transition: width 0.35s ease;
}

.annual-target-meta {
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 10px 22px;
}

.annual-target-meta strong {
    margin-left: 5px;
    font-size: 13px;
}

.account-status-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 11px 14px;
    margin-top: 10px;
    font-size: 13px;
    color: #8fa1b2;
    background: rgb(244 201 93 / 5%);
    border-left: 3px solid #f4c95d;
    gap: 8px 18px;
}

.account-status-line strong {
    color: #f4c95d;
}

.change-line {
    display: flex;
    align-items: center;
    gap: clamp(4px, 1.6vw, 8px);
    min-width: 0;
    white-space: nowrap;
}

.change-line em {
    overflow: hidden;
    min-width: 0;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1 1 auto;
    font-style: normal;
}

.change-line span {
    flex: 0 0 auto;
    white-space: nowrap;
}

.daily-entry-panel {
    animation-delay: 0.22s;
}

.panel-heading {
    margin-bottom: 1.25rem;
}

.panel-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.entry-date {
    padding-left: 18px;
    border-left: 1px solid #31404d;
    text-align: right;
}

.entry-date span {
    display: block;
    font-size: 12px;
    color: #7f91a4;
}

.entry-date strong {
    font-size: 14px;
}

.entry-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border: 1px solid #26333f;
}

.entry-item {
    display: grid;
    align-items: center;
    padding: 16px;
    min-width: 0;
    border-right: 1px solid #26333f;
    grid-template-columns: minmax(120px, 0.8fr) minmax(150px, 1fr) minmax(150px, 1fr) auto;
    gap: 16px;
}

.entry-item:last-child {
    border-right: 0;
}

.entry-name {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 10px;
}

.entry-name i,
.allocation-label i,
.strategy-cell i {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: 0 0 auto;
}

.entry-name strong,
.entry-name span {
    display: block;
}

.entry-name strong {
    font-size: 13px;
}

.entry-name span,
label span,
.entry-result span {
    margin-top: 4px;
    font-size: 12px;
    color: #718294;
}

.entry-name .previous-record {
    margin-top: 3px;
    white-space: nowrap;
}

label {
    display: grid;
    gap: 6px;
}

.strategy-picker {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 8px;
}

.strategy-picker:not(.creating) {
    grid-template-columns: 1fr;
}

.strategy-picker select {
    padding-right: 34px;
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 12px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%23dce8f7' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    appearance: none;
}

input,
select {
    padding: 8px 10px;
    width: 100%;
    min-height: 38px;
    color: #eff4f8;
    background: #0d141b;
    border: 1px solid #30404f;
    border-radius: 5px;
    outline: none;
}

input[type='date'] {
    /* color-scheme: dark; */
}

input[type='date']::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.92;
    filter: invert(1) brightness(1.65);
}

input:focus,
select:focus {
    border-color: #4ecdc4;
    box-shadow: 0 0 0 2px rgb(78 205 196 / 12%);
}

.entry-result {
    align-self: center;
    text-align: right;
}

.entry-result strong {
    display: block;
    margin-top: 4px;
    font-size: 14px;
}

.entry-note {
    grid-column: 2 / -1;
}

.entry-footer {
    margin-top: 14px;
}

.text-button {
    padding: 4px 0;
    color: #7aa2f7;
    background: transparent;
    border: 0;
    cursor: pointer;
}

.text-button:hover {
    color: #a8c0fa;
}

.formula-help {
    position: relative;
    display: inline-flex;
    margin-top: 12px;
}

.formula-help-trigger {
    padding: 4px 0;
    color: #7aa2f7;
    background: transparent;
    border: 0;
    cursor: help;
}

.formula-help-trigger:hover,
.formula-help-trigger:focus-visible {
    color: #a8c0fa;
    outline: none;
}

.formula-tooltip {
    position: absolute;
    bottom: calc(100% + 10px);
    left: 0;
    z-index: 2;
    display: grid;
    padding: 14px;
    width: min(680px, calc(100vw - 64px));
    background: #0d141b;
    border: 1px solid #30404f;
    border-radius: 8px;
    opacity: 0;
    visibility: hidden;
    box-shadow: 0 18px 46px rgb(0 0 0 / 38%);
    transition: opacity 0.16s ease, visibility 0.16s ease;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
}

.formula-help:hover .formula-tooltip,
.formula-help:focus-within .formula-tooltip {
    opacity: 1;
    visibility: visible;
}

.formula-tooltip span {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: #8192a3;
}

.formula-tooltip code {
    font-size: 12px;
    color: #cbd7e2;
}

.return-panel,
.signal-panel {
    animation-delay: 0.22s;
}

.return-panel-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.share-download-button {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    font-size: 12px;
    color: #e8fffd;
    background: linear-gradient(90deg, rgb(var(--ledger-accent-rgb) / 9%), transparent);
    border: 1px solid rgb(var(--ledger-accent-rgb) / 72%);
    border-radius: 6px;
    box-shadow: 0 0 0 1px rgb(var(--ledger-accent-rgb) / 12%),
        0 0 16px rgb(var(--ledger-accent-rgb) / 10%);
    cursor: pointer;
    gap: 7px;
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.share-download-button:hover:not(:disabled) {
    background: linear-gradient(90deg, rgb(var(--ledger-accent-rgb) / 14%), transparent);
    border-color: var(--ledger-accent);
    box-shadow: 0 0 0 1px rgb(var(--ledger-accent-rgb) / 20%),
        0 0 22px rgb(var(--ledger-accent-rgb) / 18%);
}

.share-download-button:disabled {
    cursor: wait;
    opacity: 0.66;
}

.share-download-icon {
    position: relative;
    width: 13px;
    height: 13px;
    border-bottom: 1.5px solid currentcolor;
}

.share-download-icon::before,
.share-download-icon::after {
    position: absolute;
    content: '';
}

.share-download-icon::before {
    top: 0;
    left: 5.5px;
    width: 1.5px;
    height: 8px;
    background: currentcolor;
}

.share-download-icon::after {
    top: 4px;
    left: 3px;
    width: 5px;
    height: 5px;
    border-right: 1.5px solid currentcolor;
    border-bottom: 1.5px solid currentcolor;
    transform: rotate(45deg);
}

.return-share-card {
    position: fixed;
    top: 0;
    left: -12000px;
    z-index: -1;
    box-sizing: border-box;
    padding: 70px 72px 50px;
    width: 1080px;
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    color: #17212b;
    background: #f6f7f4;
    pointer-events: none;
}

.return-share-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 40px;
}

.return-share-kicker {
    display: block;
    margin-bottom: 14px;
    font-size: 16px;
    color: #168d86;
    letter-spacing: 0.16em;
    font-weight: 700;
}

.return-share-header h2 {
    font-size: 48px;
    line-height: 1.1;
    letter-spacing: -0.04em;
}

.return-share-header p {
    margin-top: 14px;
    font-size: 20px;
    color: #64707b;
}

.return-share-meta {
    display: grid;
    text-align: right;
    flex: 0 0 auto;
    gap: 18px;
}

.return-share-date {
    padding-bottom: 3px;
}

.return-share-date span,
.return-share-date strong {
    display: block;
}

.return-share-date span {
    margin-bottom: 8px;
    font-size: 15px;
    color: #8a949d;
}

.return-share-date strong {
    font-size: 22px;
    color: #26313a;
}

.return-share-rule {
    margin: 42px 0 28px;
    height: 5px;
    background: linear-gradient(90deg, #20aaa1 0 23%, #dce3df 23% 100%);
}

.return-share-table {
    overflow: hidden;
    background: #fff;
    border: 1px solid #dbe2df;
    border-radius: 14px;
}

.return-share-row {
    display: grid;
    align-items: center;
    min-height: 72px;
    border-top: 1px solid #e7ebe9;
    grid-template-columns: 1.55fr repeat(4, 1fr);
}

.return-share-table.has-range .return-share-row {
    grid-template-columns: 1.55fr repeat(5, 1fr);
}

.return-share-row:first-child {
    border-top: 0;
}

.return-share-row > span,
.return-share-row > strong,
.return-share-name {
    padding: 0 22px;
}

.return-share-row > strong,
.return-share-table-head span:not(:first-child) {
    text-align: right;
}

.return-share-row > strong {
    font-size: 19px;
}

.return-share-table-head {
    min-height: 58px;
    font-size: 16px;
    color: #7a858e;
    background: #edf2ef;
}

.return-share-row.account {
    background: #eef8f6;
}

.return-share-name {
    display: flex;
    align-items: center;
    gap: 13px;
}

.return-share-name i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: 0 0 auto;
}

.return-share-name strong {
    overflow: hidden;
    font-size: 19px;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #25313b;
}

.return-share-card .positive {
    color: #d54d57;
}

.return-share-card .negative {
    color: #168d86;
}

.return-share-card .neutral {
    color: #69747d;
}

.return-share-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 28px;
    font-size: 15px;
    color: #8a949d;
}

.return-table {
    overflow: hidden;
    border: 1px solid #26333f;
    border-radius: 8px;
}

.return-row {
    display: grid;
    align-items: center;
    min-height: 50px;
    border-top: 1px solid #26333f;
    grid-template-columns: 1.35fr repeat(4, minmax(84px, 1fr));
}

.return-row.has-range {
    grid-template-columns: 1.35fr repeat(5, minmax(76px, 1fr));
}

.return-row:first-child {
    border-top: 0;
}

.return-head {
    min-height: 40px;
    color: #718294;
    background: #0f161d;
}

.return-row > span,
.return-row > strong,
.return-name {
    padding: 0 16px;
}

.return-row > strong {
    font-size: 13px;
    text-align: right;
}

.return-head span:not(:first-child) {
    text-align: right;
}

.return-head span:first-child {
    text-align: left;
}

.return-row.account {
    background: rgb(78 205 196 / 5%);
}

.return-name {
    display: flex;
    align-items: center;
    gap: 9px;
}

.return-name i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: 0 0 auto;
}

.return-name strong {
    display: block;
    font-size: 13px;
}

.signal-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.signal-card {
    padding: 14px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 9%);
    border-radius: 8px;
}

.signal-card span,
.signal-card small {
    display: block;
    font-size: 12px;
    color: #718294;
}

.signal-card .signal-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.signal-card .signal-help {
    position: relative;
    display: inline-grid;
    width: 15px;
    height: 15px;
    font-size: 10px;
    color: #4ecdc4;
    border: 1px solid rgb(78 205 196 / 65%);
    border-radius: 50%;
    place-items: center;
    line-height: 1;
    cursor: help;
}

.signal-card .signal-help-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    z-index: 20;
    display: none;
    padding: 9px 10px;
    width: min(280px, 72vw);
    text-align: left;
    white-space: normal;
    color: #d7e7f5;
    background: #0d141b;
    border: 1px solid #2b3946;
    border-radius: 8px;
    box-shadow: 0 14px 35px rgb(0 0 0 / 30%);
    transform: translateX(-50%);
}

.signal-card .signal-help:hover .signal-help-tooltip,
.signal-card .signal-help:focus .signal-help-tooltip {
    display: block;
}

.signal-card strong {
    display: block;
    margin: 8px 0;
    font-size: 20px;
}

.signal-track {
    overflow: hidden;
    margin-bottom: 8px;
    height: 6px;
    background: #202c37;
    border-radius: 999px;
}

.signal-track i {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #4ecdc4, #f4c95d);
    border-radius: inherit;
}

.audit-alert-grid {
    display: grid;
    margin-top: 12px;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
}

.audit-alert {
    padding: 12px 14px;
    background: rgb(0 0 0 / 16%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-left: 3px solid #4ecdc4;
}

.audit-alert.clickable {
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
}

.audit-alert.clickable:hover {
    background: rgb(244 201 93 / 5%);
    border-color: rgb(244 201 93 / 28%);
    transform: translateY(-1px);
}

.audit-alert.warning {
    border-left-color: #f4c95d;
}

.audit-alert.danger {
    border-left-color: #ef6f6c;
}

.audit-alert > div {
    display: flex;
    justify-content: space-between;
    gap: 10px;
}

.audit-alert span,
.audit-alert p {
    font-size: 13px;
    color: #718294;
}

.audit-alert strong {
    font-size: 13px;
    color: #dfe8f1;
}

.audit-alert p {
    margin-top: 6px;
    line-height: 1.5;
}

.signal-history {
    margin-top: 14px;
    border-top: 1px solid #26333f;
}

.muted-return {
    color: #8394a5 !important;
}

.analysis-grid,
.detail-grid {
    display: grid;
    grid-template-columns: 1.45fr 1fr;
    gap: 1.5rem;
}

.analysis-grid.allocation-only {
    grid-template-columns: 1fr;
}

.status-pill {
    padding: 5px 8px;
    font-size: 12px;
    color: #4ecdc4;
    background: rgb(78 205 196 / 8%);
    border: 1px solid rgb(78 205 196 / 35%);
    border-radius: 999px;
    font-weight: 700;
}

.warning-pill {
    color: #f4c95d;
    background: rgb(244 201 93 / 8%);
    border-color: rgb(244 201 93 / 35%);
}

.allocation-layout {
    display: grid;
    align-items: center;
    grid-template-columns: 380px minmax(0, 1fr);
    gap: 18px;
}

.allocation-chart {
    width: 100%;
    height: 260px;
}

.allocation-list {
    display: grid;
    gap: 16px;
}

.allocation-row {
    display: grid;
    grid-template-columns: 82px minmax(100px, 1fr) 86px;
    align-items: center;
    gap: 12px;
}

.allocation-label {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
}

.allocation-label strong {
    overflow: hidden;
    max-width: 5em;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.weight-track {
    position: relative;
    overflow: visible;
    height: 8px;
    background: #202c37;
    border-radius: 999px;
}

.weight-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
}

.target-marker {
    position: absolute;
    top: -4px;
    z-index: 2;
    width: 2px;
    height: 16px;
    background: #fff;
    transform: translateX(-1px);
}

.allocation-numbers {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 12px;
    gap: 3px;
}

.allocation-numbers > span {
    font-size: 12px;
    color: #8394a5;
}

.allocation-numbers > small {
    font-size: 12px;
    color: #9fb0c2;
}

.rebalance-summary {
    display: grid;
    align-items: center;
    padding: 12px;
    background: rgb(0 0 0 / 20%);
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 8px;
    grid-template-columns: auto auto 1fr;
    gap: 14px;
}

.rebalance-summary span,
.rebalance-summary p {
    font-size: 12px;
    color: #718294;
}

.rebalance-summary strong {
    display: block;
    margin-top: 4px;
    font-size: 14px;
    color: #f4f7fb;
}

.rebalance-summary p {
    justify-self: end;
    max-width: 260px;
    line-height: 1.5;
}

.rebalance-action-list {
    display: grid;
    gap: 8px;
}

.rebalance-action-row {
    display: grid;
    align-items: center;
    padding: 8px 10px;
    background: rgb(0 0 0 / 16%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 7px;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 10px;
}

.rebalance-action-row span,
.rebalance-action-row strong,
.rebalance-action-row em {
    font-size: 13px;
}

.rebalance-action-row em {
    color: #dfe8f1;
    font-style: normal;
    font-weight: 700;
}

.target-editor {
    display: grid;
    padding: 1rem;
    background: rgb(0 0 0 / 20%);
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 8px;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    gap: 10px;
}

.target-editor label > span,
.target-total > span {
    margin: 0;
    font-size: 12px;
    color: #b0c4de;
}

.target-editor label > div {
    position: relative;
}

.target-editor input {
    padding-right: 25px;
    min-height: 34px;
}

.target-editor b {
    position: absolute;
    top: 50%;
    right: 9px;
    font-size: 12px;
    color: #8394a5;
    transform: translateY(-50%);
}

.target-total {
    display: grid;
    align-content: center;
    padding-left: 12px;
    border-left: 1px solid rgb(255 255 255 / 10%);
    gap: 3px;
}

.target-total strong {
    font-size: 14px;
    color: #4ecdc4;
}

.target-total.invalid strong {
    color: #f4c95d;
}

.legend-note {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: 12px;
    color: #718294;
    gap: 6px;
}

.legend-note span {
    width: 2px;
    height: 12px;
    background: #fff;
}

.observation-detail-list {
    margin-top: 14px;
}

.insight-list {
    padding: 0;
    margin: 0;
    list-style: none;
}

.insight-list li {
    display: grid;
    align-items: start;
    padding: 12px 0;
    border-top: 1px solid #26333f;
    grid-template-columns: auto 1fr auto;
    gap: 10px;
}

.signal-dot {
    margin-top: 5px;
    width: 7px;
    height: 7px;
    background: #4ecdc4;
    border-radius: 50%;
}

.signal-dot.watch {
    background: #f4c95d;
}

.insight-list strong {
    font-size: 12px;
}

.insight-list p {
    margin-top: 3px;
    font-size: 12px;
    color: #718294;
    line-height: 1.45;
}

.insight-list em {
    padding-top: 2px;
    font-size: 12px;
    color: #8394a5;
    font-style: normal;
}

.performance-panel {
    animation-delay: 0.3s;
}

.chart-mode-switch {
    display: grid;
    padding: 6px;
    margin: 18px 0 16px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 9%);
    border-radius: 8px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
}

.chart-mode-switch button {
    display: grid;
    padding: 10px 12px;
    min-width: 0;
    text-align: left;
    color: #9fb0c2;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    gap: 3px;
}

.chart-mode-switch button.active {
    color: #f4f7fb;
    background: rgb(var(--ledger-accent-rgb) / 10%);
    border-color: rgb(var(--ledger-accent-rgb) / 42%);
    box-shadow: inset 0 0 18px rgb(var(--ledger-accent-rgb) / 6%);
}

.chart-mode-switch span {
    font-size: 13px;
    font-weight: 700;
}

.chart-mode-switch small {
    font-size: 12px;
    color: #718294;
}

.benchmark-strip {
    display: grid;
    align-items: center;
    overflow: visible;
    margin-bottom: 20px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 9%);
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.benchmark-strip article {
    padding: 11px 14px;
    border-right: 1px solid rgb(255 255 255 / 9%);
}

.benchmark-strip span {
    display: block;
    font-size: 12px;
    color: #718294;
}

.benchmark-strip strong {
    display: block;
    margin-top: 4px;
    font-size: 15px;
}

.benchmark-strip article span {
    display: flex;
    align-items: center;
    gap: 6px;
}

.benchmark-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex: 0 0 auto;
}

.performance-chart {
    padding: 0 10px 6px;
    width: 100%;
    height: 410px;
}

.return-heatmap-panel {
    animation-delay: 0.34s;
}

.daily-extremes-panel {
    margin-bottom: 1.5rem;
    min-width: 0;
}

.metric-switch {
    display: inline-flex;
    overflow: hidden;
    border: 1px solid #344453;
    border-radius: 6px;
}

.metric-switch button {
    padding: 6px 9px;
    font-size: 12px;
    color: #8a9aaa;
    background: transparent;
    border: 0;
    cursor: pointer;
}

.metric-switch button.active {
    color: #e8fffd;
    background: rgb(var(--ledger-accent-rgb) / 14%);
}

.daily-extreme-columns {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
}

.daily-extreme-list {
    display: grid;
    overflow: hidden;
    border: 1px solid rgb(255 255 255 / 9%);
    border-radius: 8px;
}

.daily-extreme-list-head,
.daily-extreme-row {
    display: grid;
    align-items: center;
    padding: 7px 10px;
    grid-template-columns: 24px 1fr auto;
    gap: 8px;
}

.daily-extreme-list-head {
    padding: 9px 10px;
    color: #9aabba;
    background: rgb(0 0 0 / 18%);
    font-size: 13px;
    grid-template-columns: 1fr auto;
}

.daily-extreme-list-head strong {
    font-size: 11px;
}

.daily-extreme-row {
    border-top: 1px solid rgb(255 255 255 / 7%);
    font-size: 13px;
}

.daily-extreme-row em,
.drawdown-history-list em {
    color: #718294;
    font-size: 12px;
    font-style: normal;
}

.daily-extreme-row span {
    color: #b7c5d1;
}

.daily-extreme-row strong {
    font-size: 14px;
}

.empty-analysis-hint {
    margin: 14px 0 0;
    color: #718294;
    font-size: 12px;
}

.heatmap-controls {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
}

.heatmap-select-control {
    position: relative;
    display: inline-flex;
    align-items: center;
    overflow: hidden;
    min-height: 36px;
    background: rgb(13 20 28 / 98%);
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 6px;
    box-shadow: 0 10px 24px rgb(0 0 0 / 24%);
    transition: background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.heatmap-select-control::after {
    position: absolute;
    top: 50%;
    right: 11px;
    width: 7px;
    height: 7px;
    border-right: 2px solid #9fb7c9;
    border-bottom: 2px solid #9fb7c9;
    content: '';
    pointer-events: none;
    transform: translateY(-65%) rotate(45deg);
}

.heatmap-select-control select {
    padding: 0 28px 0 12px;
    width: 108px;
    height: 34px;
    color: #e8fffd;
    background: transparent;
    border: 0;
    outline: 0;
    appearance: none;
    cursor: pointer;
    font-weight: 700;
}

.heatmap-select-control.wide select {
    width: 108px;
}

.heatmap-select-control.strategy-scope select {
    width: var(--strategy-select-width, 132px);
    max-width: 260px;
}

.heatmap-select-control.strategy-scope.has-strategy-dot select {
    padding-left: 30px;
}

.heatmap-strategy-dot {
    position: absolute;
    left: 12px;
    z-index: 1;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    box-shadow: 0 0 8px currentcolor;
    pointer-events: none;
}

.heatmap-select-control option {
    color: #dfe8f1;
    background: #0d141c;
}

.heatmap-select-control:hover,
.heatmap-select-control:focus-within {
    background: rgb(var(--ledger-accent-rgb) / 10%);
    border-color: rgb(var(--ledger-accent-rgb) / 72%);
    box-shadow: 0 0 0 1px rgb(var(--ledger-accent-rgb) / 10%);
}

.heatmap-summary-strip {
    display: grid;
    overflow: hidden;
    margin: 16px 0;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 9%);
    border-radius: 8px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
}

.heatmap-summary-strip article {
    padding: 12px 14px;
    border-right: 1px solid rgb(255 255 255 / 9%);
}

.heatmap-summary-strip article:last-child {
    border-right: 0;
}

.heatmap-summary-strip span {
    display: block;
    font-size: 12px;
    color: #718294;
}

.heatmap-summary-strip strong {
    display: block;
    overflow: hidden;
    margin-top: 5px;
    font-size: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.heatmap-table-wrap {
    overflow-x: auto;
    padding-bottom: 4px;
}

.return-heatmap-table {
    width: 100%;
    min-width: 980px;
    border-spacing: 7px;
    table-layout: fixed;
    border-collapse: separate;
}

.return-heatmap-table th {
    padding: 8px 6px;
    font-size: 12px;
    text-align: center;
    color: #8fa1b2;
    font-weight: 600;
}

.return-heatmap-table tbody th {
    color: #f4f7fb;
    background: rgb(255 255 255 / 5%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 7px;
}

.return-heatmap-table td,
.calendar-day {
    border: 1px solid rgb(255 255 255 / 8%);
    transition: transform 0.18s ease, border-color 0.18s ease;
}

.return-heatmap-table td {
    padding: 9px 6px;
    height: 58px;
    text-align: center;
    border-radius: 8px;
    cursor: pointer;
}

.return-heatmap-table td:not(.empty):hover,
.calendar-day.active:hover {
    border-color: rgb(255 255 255 / 28%);
    transform: translateY(-1px);
}

.return-heatmap-table td.empty,
.calendar-day.empty {
    color: #536273;
    background: rgb(255 255 255 / 3%);
}

.return-heatmap-table td span,
.return-heatmap-table td small,
.calendar-day strong,
.calendar-day small {
    display: block;
}

.return-heatmap-table td span,
.calendar-day strong {
    font-size: 13px;
    color: #f4f7fb;
    font-weight: 700;
}

.return-heatmap-table td small,
.calendar-day small {
    margin-top: 3px;
    font-size: 11.5px;
    color: #b9c6d4;
}

.single-metric-view .return-heatmap-table td span {
    font-size: 14px;
}

.return-heatmap-table .year-total-cell {
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 10%);
}

.monthly-heatmap-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 220px;
    gap: 16px;
}

.month-picker-strip {
    display: flex;
    overflow-x: auto;
    padding-bottom: 2px;
    grid-column: 1 / -1;
    gap: 8px;
}

.month-picker-strip button {
    padding: 7px 10px;
    min-width: 64px;
    white-space: nowrap;
    color: #8fa1b2;
    background: #0d141b;
    border: 1px solid #2b3946;
    border-radius: 6px;
    cursor: pointer;
}

.month-picker-strip button.active {
    color: #e8fffd;
    background: rgb(var(--ledger-accent-rgb) / 8%);
    border-color: rgb(var(--ledger-accent-rgb) / 72%);
    box-shadow: 0 0 0 1px rgb(var(--ledger-accent-rgb) / 10%);
    font-weight: 700;
}

.monthly-calendar {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
}

.monthly-calendar-scroll {
    overflow-x: auto;
    padding-bottom: 3px;
    min-width: 0;
}

.calendar-weekday {
    padding: 2px 0 5px;
    font-size: 12px;
    text-align: center;
    color: #718294;
}

.calendar-day {
    position: relative;
    display: grid;
    padding: 8px;
    min-height: 82px;
    text-align: center;
    background: rgb(255 255 255 / 4%);
    border-radius: 8px;
    align-content: center;
    gap: 4px;
}

.calendar-day > span {
    position: absolute;
    top: 8px;
    left: 8px;
    font-size: 12px;
    color: #8fa1b2;
}

.calendar-day strong {
    overflow: hidden;
    font-size: 13px;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.single-metric-view .calendar-day strong {
    font-size: 14px;
}

.calendar-day.empty {
    border-color: transparent;
}

.monthly-extreme-list {
    display: grid;
    align-content: start;
    gap: 8px;
}

.monthly-extreme-list article {
    padding: 10px 12px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 9%);
    border-radius: 8px;
}

.monthly-extreme-list span,
.monthly-extreme-list small {
    display: block;
    font-size: 12px;
    color: #718294;
}

.monthly-extreme-list strong {
    display: block;
    margin: 5px 0 2px;
    font-size: 14px;
}

.range-select-button {
    display: inline-flex;
    align-items: center;
    padding: 6px 10px;
    color: #dbe8f3;
    background: #0d141b;
    border: 1px solid #2b3946;
    border-radius: 6px;
    cursor: pointer;
    gap: 8px;
}

.range-select-button:hover {
    border-color: #4ecdc4;
}

.range-select-button span {
    font-size: 12px;
    color: #718294;
}

.range-select-button strong {
    font-size: 12px;
    color: #4ecdc4;
}

.ledger-insight-grid {
    align-items: stretch;
    grid-template-columns: 1.08fr 0.92fr;
}

.ledger-drawdown-grid {
    align-items: stretch;
    margin-bottom: 0;
    grid-template-columns: 1.08fr 0.92fr;
}

.attribution-summary {
    display: grid;
    margin-bottom: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.attribution-metric-card {
    padding: 12px 14px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 8px;
}

.attribution-metric-label {
    display: flex;
    align-items: center;
    gap: 6px;
}

.attribution-metric-label > span,
.recovery-summary span,
.cash-flow-summary span {
    display: block;
    font-size: 12px;
    color: #718294;
}

.attribution-metric-card > strong {
    display: block;
    margin-top: 4px;
    font-size: 26px;
}

.attribution-help {
    position: relative;
    display: inline-grid;
    width: 16px;
    height: 16px;
    padding: 0;
    color: #91aaa9;
    background: transparent;
    border: 0;
    border-radius: 0;
    cursor: pointer;
    place-items: center;
}

.attribution-help svg {
    display: block;
    width: 13px;
    height: 13px;
}

.attribution-help span {
    position: absolute;
    left: 0;
    bottom: calc(100% + 9px);
    z-index: 12;
    padding: 10px 12px;
    width: 270px;
    color: #cbd7e1;
    text-align: left;
    background: #0d151c;
    border: 1px solid #40505d;
    border-radius: 6px;
    box-shadow: 0 10px 28px rgb(0 0 0 / 34%);
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 1.6;
    pointer-events: none;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.16s ease, transform 0.16s ease, visibility 0.16s ease;
    visibility: hidden;
}

.attribution-help:hover span,
.attribution-help:focus-visible span,
.attribution-help span.visible {
    opacity: 1;
    transform: translateY(0);
    visibility: visible;
}

.attribution-waterfall {
    width: 100%;
    height: 218px;
    margin-bottom: 10px;
}

.attribution-table {
    display: grid;
}

.attribution-table-head {
    display: grid;
    padding: 7px 0;
    color: #718294;
    font-size: 11px;
    border-bottom: 1px solid rgb(255 255 255 / 10%);
    grid-template-columns: 1.15fr 0.9fr 1fr 0.7fr;
    gap: 10px;
}

.attribution-table-head span:not(:first-child) {
    text-align: right;
}

.attribution-row {
    display: grid;
    align-items: center;
    padding: 11px 0;
    border-top: 1px solid rgb(255 255 255 / 10%);
    grid-template-columns: 1.15fr 0.9fr 1fr 0.7fr;
    gap: 10px;
}

.attribution-name {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 9px;
}

.attribution-name i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: 0 0 auto;
}

.attribution-name strong,
.attribution-name span,
.attribution-copy strong,
.attribution-copy span {
    display: block;
}

.attribution-name strong,
.attribution-copy strong {
    font-size: 12px;
}

.attribution-name span,
.attribution-copy span {
    margin-top: 3px;
    font-size: 12px;
    color: #718294;
    line-height: 1.35;
}

.attribution-track {
    overflow: hidden;
    height: 8px;
    background: #202c37;
    border-radius: 999px;
}

.attribution-track span {
    display: block;
    height: 100%;
    background: #4ecdc4;
    border-radius: inherit;
}

.attribution-track.positive span {
    background: #ef6f6c;
}

.attribution-copy {
    text-align: right;
}

.attribution-weight span {
    margin-top: 0;
}

.drawdown-attribution-summary {
    display: grid;
    align-items: center;
    padding: 11px 13px;
    margin-bottom: 12px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 8px;
    grid-template-columns: 1fr 1fr auto;
    gap: 12px;
}

.drawdown-attribution-panel {
    display: flex;
    flex-direction: column;
}

.drawdown-attribution-summary span,
.drawdown-attribution-summary strong {
    color: #9aabba;
    font-size: 12px;
}

.drawdown-attribution-summary em {
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
}

.drawdown-attribution-list {
    display: grid;
    flex: 1;
    align-content: start;
    grid-template-columns: repeat(auto-fit, minmax(205px, 1fr));
    gap: 10px;
}

.drawdown-attribution-list.single-column {
    grid-template-columns: 1fr;
}

.drawdown-attribution-row {
    display: grid;
    align-items: center;
    padding: 10px 11px;
    background: rgb(0 0 0 / 14%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 7px;
    grid-template-areas:
        'name amount'
        'track share';
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px 10px;
}

.drawdown-attribution-row .attribution-name {
    grid-area: name;
}

.drawdown-attribution-row .drawdown-loss-track {
    width: 100%;
    grid-area: track;
}

.drawdown-attribution-row > strong {
    grid-area: amount;
}

.drawdown-attribution-row > span {
    grid-area: share;
}

.drawdown-attribution-row > strong,
.drawdown-attribution-row > span {
    text-align: right;
    font-size: 12px;
}

.drawdown-attribution-row > span {
    color: #718294;
}

.drawdown-loss-track {
    overflow: hidden;
    height: 7px;
    background: #202c37;
    border-radius: 999px;
}

.drawdown-loss-track span {
    display: block;
    height: 100%;
    background: #4ecdc4;
    border-radius: inherit;
}

.drawdown-loss-track.offset span {
    background: #ef6f6c;
}

.drawdown-attribution-empty {
    display: grid;
    min-height: 172px;
    color: #718294;
    text-align: center;
    place-content: center;
    gap: 8px;
}

.drawdown-attribution-empty strong {
    color: #dfe8f1;
    font-size: 15px;
}

.drawdown-attribution-empty span {
    font-size: 12px;
}

.drawdown-history-list {
    display: grid;
}

.drawdown-history-row {
    display: grid;
    align-items: center;
    padding: 11.5px 10px;
    color: #cbd7e1;
    text-align: left;
    border-top: 1px solid rgb(255 255 255 / 9%);
    grid-template-columns: 22px minmax(110px, 1fr) 148px 54px;
    gap: 8px;
}

.drawdown-history-panel {
    min-height: 0;
}

.drawdown-history-panel.fixed-history-height {
    min-height: 520px;
}

.attribution-panel {
    position: relative;
    z-index: 1;
    min-height: 520px;
}

.drawdown-history-row strong {
    font-size: 12px;
}

.drawdown-history-row span {
    color: #cbd7e1;
    white-space: nowrap;
}

.drawdown-history-row small {
    color: #718294;
    font-size: 11px;
    white-space: nowrap;
}


.recovery-summary {
    display: grid;
    margin-bottom: 14px;
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 8px;
    grid-template-columns: repeat(3, 1fr);
}

.recovery-summary div {
    padding: 13px 14px;
    border-right: 1px solid rgb(255 255 255 / 10%);
}

.recovery-summary div:last-child {
    border-right: 0;
}

.recovery-summary strong {
    display: block;
    margin-top: 6px;
    font-size: 16px;
}

.recovery-path {
    display: grid;
    gap: 0;
}

.recovery-trend-strip {
    display: grid;
    padding: 10px 12px;
    margin-bottom: 18px;
    background: rgb(0 0 0 / 14%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 6px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.recovery-trend-strip span {
    display: grid;
    font-size: 12px;
    color: #718294;
    gap: 4px;
}

.recovery-trend-strip strong {
    font-size: 13px;
    color: #dfe8f1;
}

.recovery-estimate {
    position: relative;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 7px;
}

.recovery-estimate .status-pill {
    white-space: nowrap;
}

.recovery-help {
    position: relative;
    display: inline-grid;
    width: 18px;
    height: 18px;
    font-size: 12px;
    color: #f4c95d;
    border: 1px solid rgb(244 201 93 / 55%);
    border-radius: 50%;
    cursor: help;
    font-weight: 700;
    place-items: center;
}

.recovery-help-tooltip {
    position: absolute;
    right: 0;
    bottom: calc(100% + 9px);
    z-index: 12;
    display: none;
    padding: 10px 12px;
    width: 310px;
    font-size: 12px;
    color: #dce7ef;
    background: #0d151c;
    border: 1px solid #40505d;
    border-radius: 6px;
    box-shadow: 0 10px 28px rgb(0 0 0 / 34%);
    font-weight: 400;
    line-height: 1.6;
}

.recovery-help:hover .recovery-help-tooltip,
.recovery-help:focus .recovery-help-tooltip {
    display: block;
}

.recovery-step {
    position: relative;
    display: grid;
    padding: 0 0 28px 22px;
    grid-template-columns: 1fr auto;
    gap: 12px;
}

.recovery-step::before {
    position: absolute;
    top: 8px;
    bottom: -14px;
    left: 6px;
    width: 1px;
    background: #2c3a47;
    content: '';
}

.recovery-step:last-child {
    padding-bottom: 0;
}

.recovery-step:last-child::before {
    display: none;
}

.recovery-node {
    position: absolute;
    top: 5px;
    left: 2px;
    z-index: 1;
    width: 9px;
    height: 9px;
    background: #101820;
    border: 2px solid #f4c95d;
    border-radius: 50%;
}

.recovery-step.done .recovery-node {
    background: #4ecdc4;
    border-color: #4ecdc4;
}

.recovery-step strong,
.recovery-step span {
    display: block;
}

.recovery-step strong {
    font-size: 12px;
}

.recovery-step span {
    margin-top: 4px;
    font-size: 12px;
    color: #718294;
    line-height: 1.4;
}

.recovery-step em {
    padding-top: 1px;
    font-size: 12px;
    color: #f4c95d;
    font-style: normal;
    font-weight: 700;
}

.detail-grid {
    grid-template-columns: 1fr 1fr;
}

.high-progress {
    overflow: hidden;
    height: 6px;
    background: #202c37;
    border-radius: 999px;
}

.high-progress span {
    display: block;
    height: 100%;
    border-radius: inherit;
}

.muted-label {
    margin-top: 3px;
    font-size: 12px;
    color: #718294;
}

.experience-summary {
    display: grid;
    align-items: center;
    padding: 0.9rem 1rem;
    margin-bottom: 0.8rem;
    background: rgb(0 0 0 / 20%);
    border-radius: 8px;
    grid-template-columns: auto 1fr;
    gap: 16px;
}

.experience-score {
    display: grid;
    grid-template-columns: auto auto;
    align-items: baseline;
}

.experience-score strong {
    font-size: 28px;
    color: #4ecdc4;
}

.experience-score > span {
    font-size: 12px;
    color: #8394a5;
}

.experience-score small {
    grid-column: 1 / -1;
    font-size: 12px;
    color: #b0c4de;
}

.experience-summary p {
    font-size: 12px;
    color: #8394a5;
    line-height: 1.55;
}

.experience-list {
    display: grid;
}

.experience-row {
    display: grid;
    align-items: center;
    padding: 9px 0;
    border-top: 1px solid rgb(255 255 255 / 10%);
    grid-template-columns: 145px minmax(70px, 1fr) 55px;
    gap: 10px;
}

.experience-row > div:first-child strong,
.experience-row > div:first-child span {
    display: block;
}

.experience-row > div:first-child strong,
.experience-row > strong {
    font-size: 12px;
}

.experience-row > div:first-child span {
    margin-top: 3px;
    font-size: 12px;
    color: #718294;
}

.experience-row > strong {
    text-align: right;
    color: #fff;
}

.experience-track {
    overflow: hidden;
    height: 6px;
    background: rgb(255 255 255 / 8%);
    border-radius: 999px;
}

.experience-track span {
    display: block;
    height: 100%;
    background: #4ecdc4;
    border-radius: inherit;
}

.strategy-detail-list {
    display: grid;
}

.strategy-detail-row {
    display: grid;
    align-items: center;
    padding: 12px 0;
    border-top: 1px solid rgb(255 255 255 / 10%);
    grid-template-columns: 150px minmax(220px, 1fr) minmax(170px, 0.8fr) 110px;
    gap: 12px;
}

.strategy-detail-row > div:first-child {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 9px;
}

.strategy-detail-row i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: 0 0 auto;
}

.strategy-detail-row strong,
.strategy-detail-row span {
    display: block;
}

.strategy-detail-row strong {
    font-size: 14px;
}

.strategy-detail-row span {
    margin-top: 3px;
    font-size: 12px;
    color: #718294;
}

.detail-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
}

.detail-metrics span {
    padding: 8px 10px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 6px;
}

.detail-metrics strong {
    margin-top: 4px;
    color: #eff4f8;
}

.detail-high {
    display: grid;
    gap: 7px;
}

.detail-high span {
    margin: 0;
    font-size: 12px;
    white-space: nowrap;
    color: #8394a5;
}

.detail-status {
    text-align: right;
}

.detail-status span {
    white-space: nowrap;
}

.cash-flow-panel {
    animation-delay: 0.36s;
}

.cash-flow-summary {
    display: grid;
    overflow: hidden;
    margin-bottom: 14px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 8px;
    grid-template-columns: repeat(4, 1fr);
}

.cash-flow-summary article {
    padding: 14px 16px;
    border-right: 1px solid rgb(255 255 255 / 10%);
}

.cash-flow-summary article:last-child {
    border-right: 0;
}

.cash-flow-summary strong {
    display: block;
    margin-top: 7px;
    font-size: 18px;
}

.cash-flow-list {
    display: grid;
    border-top: 1px solid #26333f;
}

.cash-flow-row {
    display: grid;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid #26333f;
    grid-template-columns: 120px 70px minmax(130px, 0.8fr) 100px 130px minmax(180px, 1.4fr);
    gap: 16px;
    text-align: left;
}

.cash-flow-head {
    padding: 9px 14px;
    font-size: 12px;
    color: #718294;
    background: #0f161d;
}

.cash-flow-row span {
    display: block;
    font-size: 13px;
    color: #b7c4d0;
    line-height: 1.45;
}

.cash-flow-head span {
    font-size: 12px;
    color: #718294;
}

.cash-flow-row > span:nth-child(2) {
    font-weight: 700;
}

.cash-flow-row > span:nth-child(6) {
    text-align: right;
    color: #cbd7e2;
}

.cash-flow-head span:nth-child(5),
.cash-flow-head span:nth-child(6) {
    text-align: right;
}

.cash-flow-row strong {
    display: block;
    font-size: 12px;
}

.cash-flow-row > strong {
    font-size: 14px;
}

.cash-flow-row > strong:nth-child(5) {
    text-align: right;
}

.cash-flow-empty {
    padding: 18px 0;
    font-size: 12px;
    text-align: center;
    color: #718294;
    border-bottom: 1px solid #26333f;
}

.record-panel {
    overflow: hidden;
}

.record-table-wrap {
    overflow-x: auto;
}

.record-pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px 2px;
    font-size: 13px;
    color: #8fa1b2;
}

.record-pagination > div {
    display: flex;
    align-items: center;
    gap: 10px;
}

.record-pagination button {
    padding: 6px 10px;
    color: #b9c8d5;
    background: #111a22;
    border: 1px solid #30404f;
    border-radius: 5px;
    cursor: pointer;
}

.record-pagination button:hover:not(:disabled) {
    color: var(--ledger-accent);
    border-color: var(--ledger-accent);
}

.record-pagination button:disabled {
    cursor: not-allowed;
    opacity: 0.4;
}

table {
    width: 100%;
    border-collapse: collapse;
    min-width: 860px;
}

th,
td {
    padding: 12px 20px;
    font-size: 12px;
    text-align: left;
    white-space: nowrap;
    border-top: 1px solid #26333f;
}

th {
    font-size: 12px;
    color: #718294;
    background: #0f161d;
    font-weight: 600;
}

td {
    color: #cbd7e2;
}

.strategy-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.row-actions {
    display: flex;
    gap: 6px;
}

.row-actions button {
    padding: 4px 7px;
    font-size: 12px;
    color: #9db1c3;
    background: transparent;
    border: 1px solid #30404f;
    border-radius: 4px;
    cursor: pointer;
}

.row-actions button:hover {
    color: #4ecdc4;
    border-color: #4ecdc4;
}

.row-actions button.danger:hover {
    color: #ef6f6c;
    border-color: #ef6f6c;
}

.positive {
    color: #ef6f6c !important;
}

.negative {
    color: #4ecdc4 !important;
}

.accent {
    color: #4ecdc4 !important;
}

.warning {
    color: #f4c95d !important;
}

.modal-backdrop {
    position: fixed;
    z-index: 100;
    inset: 0;
    display: grid;
    padding: 20px;
    background: rgb(3 8 13 / 76%);
    backdrop-filter: blur(6px);
    place-items: center;
}

.modal-panel {
    padding: 22px;
    width: min(640px, 100%);
    background: #111820;
    border: 1px solid #334452;
    border-radius: 8px;
    box-shadow: 0 18px 60px rgb(0 0 0 / 45%);
}

.daily-modal {
    overflow-y: auto;
    width: min(920px, 100%);
    max-height: calc(100vh - 40px);
}

.range-modal {
    width: min(520px, 100%);
}

.compact-modal {
    width: min(480px, 100%);
}

.import-panel {
    overflow-y: auto;
    width: min(960px, 100%);
    max-height: 88vh;
}

.range-option-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
}

.range-option-grid button {
    padding: 8px 12px;
    min-height: 34px;
    white-space: nowrap;
    color: #8fa1b2;
    background: rgb(13 20 27 / 72%);
    border: 1px solid #2b3946;
    border-radius: 6px;
    transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
    cursor: pointer;
}

.range-option-grid button.active {
    color: #e8fffd;
    background: rgb(var(--ledger-accent-rgb) / 8%);
    border-color: rgb(var(--ledger-accent-rgb) / 72%);
    box-shadow: 0 0 0 1px rgb(var(--ledger-accent-rgb) / 10%);
    font-weight: 700;
}

.range-date-fields {
    display: grid;
    margin-top: 16px;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.range-date-fields input {
    color-scheme: dark;
}

.range-date-fields input[type='date']::-webkit-calendar-picker-indicator {
    color: #fff;
    background-color: transparent;
    opacity: 1;
    filter: brightness(0) invert(1);
}

.daily-modal-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    margin-bottom: 14px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 8px;
    gap: 12px;
}

.compact-action {
    padding: 7px 12px;
    min-height: 34px;
    white-space: nowrap;
}

.daily-toolbar-actions {
    display: flex;
    flex: 0 1 auto;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
}

.daily-modal .entry-date {
    padding-left: 0;
    min-width: 0;
    text-align: left;
    flex: 1 1 auto;
    border-left: 0;
}

.modal-entry-grid {
    grid-template-columns: 1fr;
    border-radius: 8px;
}

.modal-entry-grid .entry-item {
    border-right: 0;
    border-bottom: 1px solid #26333f;
    grid-template-columns: minmax(140px, 0.9fr) minmax(180px, 1fr) auto;
}

.modal-entry-grid .entry-name {
    grid-column: 1;
}

.modal-entry-grid .entry-result {
    grid-column: 3;
    justify-self: end;
}

.modal-entry-grid .entry-item.has-advanced-fields {
    grid-template-columns:
        minmax(150px, 0.85fr) minmax(180px, 1fr) minmax(180px, 1fr)
        minmax(82px, auto);
}

.modal-entry-grid .entry-item.has-advanced-fields .entry-name {
    align-self: center;
    grid-row: 1 / span 2;
}

.modal-entry-grid .entry-item.has-advanced-fields .entry-result {
    grid-column: 4;
    grid-row: 1;
}

.modal-entry-grid .entry-item.has-advanced-fields .entry-note {
    grid-column: 2 / 5;
}

.modal-entry-grid .new-strategy-entry.has-advanced-fields .entry-note {
    grid-column: 2 / 5;
}

.modal-entry-grid .entry-item:last-child {
    border-bottom: 0;
}

.modal-entry-grid .new-strategy-entry {
    background: linear-gradient(90deg, rgb(var(--ledger-accent-rgb) / 8%), transparent 62%);
    border-left: 3px solid rgb(var(--ledger-accent-rgb) / 72%);
}

.new-strategy-entry .entry-note {
    grid-column: 2 / -1;
}

.modal-header {
    margin-bottom: 20px;
}

.modal-header span {
    font-size: 12px;
    color: #4ecdc4;
    font-weight: 700;
    letter-spacing: 0.1em;
}

.modal-header h3 {
    margin-top: 4px;
    font-size: 20px;
}

.icon-button {
    display: grid;
    width: 34px;
    height: 34px;
    color: #a7b5c3;
    background: #151d25;
    border: 1px solid #30404f;
    border-radius: 5px;
    cursor: pointer;
    place-items: center;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.form-grid label.wide {
    grid-column: 1 / -1;
}

label small {
    font-size: 12px;
    color: #647587;
}

.form-warning-list {
    display: grid;
    margin-top: 14px;
    gap: 6px;
}

.form-warning-list div {
    padding: 9px 11px;
    font-size: 12px;
    color: #f4c95d;
    background: rgb(244 201 93 / 7%);
    border-left: 3px solid #f4c95d;
}

.initial-cashflow-prompt {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    margin-top: 14px;
    background: rgb(var(--ledger-accent-rgb) / 7%);
    border: 1px solid rgb(var(--ledger-accent-rgb) / 28%);
    border-radius: 8px;
    gap: 16px;
}

.initial-cashflow-prompt div {
    display: grid;
    gap: 4px;
}

.initial-cashflow-prompt strong {
    font-size: 13px;
    color: #dffbf8;
}

.initial-cashflow-prompt span {
    font-size: 12px;
    color: #9eb0bf;
    line-height: 1.6;
}

.initial-cashflow-prompt button {
    padding: 7px 10px;
    font-size: 12px;
    white-space: nowrap;
    color: #e8fffd;
    background: rgb(var(--ledger-accent-rgb) / 10%);
    border: 1px solid rgb(var(--ledger-accent-rgb) / 55%);
    border-radius: 6px;
    cursor: pointer;
}

.initial-cashflow-prompt button:hover {
    border-color: var(--ledger-accent);
}

.annual-target-modal .modal-actions {
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 8px;
}

.annual-target-modal .modal-actions .button {
    padding: 0 12px;
    min-width: 0;
    white-space: nowrap;
}

.annual-target-field {
    display: grid;
    gap: 8px;
}

.annual-target-field > span {
    font-size: 13px;
    color: #a9b8c7;
}

.annual-target-field > div {
    display: flex;
    align-items: center;
    padding: 0 12px;
    background: #0d141b;
    border: 1px solid #2b3946;
    border-radius: 6px;
    transition: border-color 0.2s, box-shadow 0.2s;
    gap: 8px;
}

.annual-target-field > div:focus-within {
    border-color: #4ecdc4;
    box-shadow: 0 0 0 2px rgb(78 205 196 / 12%);
}

.annual-target-field b {
    color: var(--ledger-accent);
}

.annual-target-field input {
    padding: 0;
    width: 100%;
    height: 42px;
    min-height: 42px;
    color: #f4f7fb;
    background: transparent;
    border: 0;
    outline: 0;
}

.annual-target-field input:focus {
    box-shadow: none;
}

.annual-target-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    margin-top: 16px;
    background: rgb(0 0 0 / 18%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 8px;
    gap: 14px;
}

.annual-target-preview span {
    font-size: 13px;
    color: #8fa1b2;
}

.annual-target-preview strong {
    font-size: 18px;
}

.strategy-name-list {
    display: grid;
    gap: 16px;
}

.strategy-manager-tips {
    display: flex;
    padding: 10px 12px;
    font-size: 12px;
    color: #9fb0c2;
    background: rgb(78 205 196 / 6%);
    border: 1px solid rgb(78 205 196 / 14%);
    flex-wrap: wrap;
    gap: 10px;
}

.strategy-manager-tips > span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.strategy-help {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 15px;
    height: 15px;
    color: #4ecdc4;
    border: 1px solid rgb(78 205 196 / 54%);
    border-radius: 50%;
    font-style: normal;
    line-height: 1;
    cursor: help;
}

.strategy-help b {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    z-index: 5;
    display: none;
    padding: 9px 10px;
    width: 240px;
    text-align: left;
    color: #d6e2f0;
    background: #101820;
    border: 1px solid rgb(78 205 196 / 24%);
    border-radius: 6px;
    box-shadow: 0 12px 28px rgb(0 0 0 / 28%);
    font-weight: 500;
    line-height: 1.6;
    transform: translateX(-50%);
}

.strategy-help:hover b,
.strategy-help:focus b {
    display: block;
}

.strategy-manager-section {
    display: grid;
    gap: 10px;
}

.strategy-manager-section-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #dce8f7;
}

.strategy-manager-section-heading strong {
    font-size: 13px;
}

.strategy-manager-section-heading span,
.strategy-empty-copy {
    font-size: 12px;
    color: #8091a3;
}

.strategy-empty-copy {
    padding: 12px;
    margin: 0;
    background: rgb(0 0 0 / 12%);
    border: 1px dashed rgb(255 255 255 / 10%);
}

.strategy-name-list label {
    padding: 0;
    background: transparent;
    border: 0;
}

.strategy-name-list input {
    height: 44px;
}

.strategy-manager-row {
    display: grid;
    align-items: center;
    grid-template-columns: minmax(0, 1fr) 84px 84px;
    gap: 8px;
}

.strategy-manager-row.archived {
    opacity: 0.82;
}

.strategy-archive-button,
.strategy-delete-button {
    padding: 0 10px;
    min-height: 44px;
    font-size: 12px;
    white-space: nowrap;
    border-radius: 5px;
    cursor: pointer;
}

.strategy-archive-button {
    color: #b8c7d8;
    background: rgb(18 36 52 / 42%);
    border: 1px solid rgb(122 162 247 / 28%);
}

.strategy-archive-button:hover {
    color: #fff;
    border-color: rgb(78 205 196 / 45%);
}

.strategy-delete-button {
    color: #ef8b89;
    background: rgb(143 63 64 / 10%);
    border: 1px solid rgb(239 111 108 / 32%);
}

.strategy-delete-button:hover {
    color: #fff;
    background: #8f3f40;
    border-color: #b15354;
}

.form-error {
    padding: 9px 11px;
    margin-top: 12px;
    font-size: 12px;
    color: #ef6f6c;
    background: rgb(239 111 108 / 8%);
    border-left: 3px solid #ef6f6c;
}

.recalc-note {
    display: flex;
    padding: 12px;
    margin-top: 18px;
    background: rgb(244 201 93 / 6%);
    border: 1px solid rgb(244 201 93 / 22%);
    gap: 10px;
}

.recalc-note strong {
    font-size: 12px;
    color: #f4c95d;
}

.recalc-note span {
    font-size: 12px;
    color: #9aabba;
}

.modal-actions {
    justify-content: flex-end;
    margin-top: 20px;
}

.button.danger-button {
    color: #ffaaa8;
    background: rgb(143 63 64 / 12%);
    border-color: #b15354;
}

.confirm-copy {
    font-size: 12px;
    color: #9aabba;
    line-height: 1.7;
}

.modal-muted-copy {
    margin: 0 0 14px;
    font-size: 13px;
    color: #9aabba;
    line-height: 1.7;
}

.missing-detail-modal {
    max-width: 620px;
}

.missing-detail-list {
    display: grid;
    overflow-y: auto;
    max-height: 360px;
    border: 1px solid #26333f;
    border-radius: 8px;
}

.missing-detail-row {
    display: grid;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid #26333f;
    grid-template-columns: 130px minmax(0, 1fr) auto;
    gap: 14px;
}

.missing-detail-row:last-child {
    border-bottom: 0;
}

.missing-detail-row span {
    color: #9aabba;
}

.missing-detail-row strong {
    color: #e8eef5;
}

.upload-zone {
    display: grid;
    padding: 34px 20px;
    text-align: center;
    background: #0d141b;
    border: 1px dashed #3b5062;
    cursor: pointer;
    place-items: center;
}

.upload-zone:hover {
    border-color: #4ecdc4;
}

.upload-zone.dragging {
    background: rgb(var(--ledger-accent-rgb) / 8%);
    border-color: var(--ledger-accent);
    box-shadow: inset 0 0 24px rgb(var(--ledger-accent-rgb) / 8%),
        0 0 18px rgb(var(--ledger-accent-rgb) / 12%);
}

.upload-zone input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
}

.upload-mark {
    display: grid;
    margin-bottom: 12px;
    width: 52px;
    height: 36px;
    font-size: 12px;
    color: #071412;
    background: #4ecdc4;
    border-radius: 4px;
    font-weight: 800;
    place-items: center;
}

.upload-zone p {
    margin-top: 8px;
    max-width: 440px;
    font-size: 12px;
    color: #718294;
    line-height: 1.6;
}

.upload-limit {
    display: inline-flex;
    padding: 4px 9px;
    margin-top: 10px;
    color: var(--ledger-accent);
    background: rgb(var(--ledger-accent-rgb) / 8%);
    border: 1px solid rgb(var(--ledger-accent-rgb) / 24%);
    border-radius: 999px;
}

.import-steps {
    display: grid;
    margin-top: 18px;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
}

.import-steps > div {
    position: relative;
    display: flex;
    align-items: center;
    padding-top: 11px;
    color: #5f7182;
    border-top: 2px solid #26333f;
    gap: 8px;
}

.import-steps > div:not(:last-child) {
    padding-right: 10px;
}

.import-steps span {
    display: inline-grid;
    width: 22px;
    height: 22px;
    font-size: 12px;
    color: #8a9aaa;
    background: #111a22;
    border: 1px solid #344453;
    border-radius: 50%;
    font-weight: 700;
    place-items: center;
}

.import-steps strong {
    font-size: 12px;
    font-weight: 600;
}

.import-steps > div.active,
.import-steps > div.complete {
    color: var(--ledger-accent);
    border-color: #4ecdc4;
}

.import-steps > div.active span,
.import-steps > div.complete span {
    color: #dffffc;
    background: rgb(var(--ledger-accent-rgb) / 12%);
    border-color: var(--ledger-accent);
    box-shadow: 0 0 12px rgb(var(--ledger-accent-rgb) / 18%);
}

.import-issues {
    display: grid;
    margin-top: 14px;
    gap: 6px;
}

.import-issues div {
    padding: 9px 11px;
    font-size: 12px;
    color: #ef6f6c;
    background: rgb(239 111 108 / 8%);
    border-left: 3px solid #ef6f6c;
}

.import-preview {
    overflow: hidden;
    margin-top: 14px;
    background: rgb(0 0 0 / 14%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 6px;
}

.import-preview-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid rgb(255 255 255 / 8%);
}

.import-preview-head strong {
    font-size: 13px;
}

.import-preview-head span,
.import-preview-more {
    font-size: 12px;
    color: #9aabba;
}

.import-preview-table {
    display: grid;
    overflow-x: auto;
}

.import-preview-row {
    display: grid;
    align-items: center;
    padding: 10px 14px;
    min-width: 760px;
    font-size: 12px;
    color: #dce6ee;
    border-bottom: 1px solid rgb(255 255 255 / 6%);
    grid-template-columns: 52px 92px minmax(95px, 1fr) 120px 100px minmax(120px, 1.1fr);
    gap: 12px;
}

.import-preview-row.header {
    color: #718294;
    background: rgb(9 17 25 / 70%);
    font-weight: 700;
}

.import-preview-row.invalid {
    color: #ef6f6c;
    background: rgb(239 111 108 / 5%);
}

.import-preview-more {
    padding: 10px 14px 12px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s, transform 0.2s;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

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

@media (max-width: 1100px) {
    .asset-summary-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .asset-summary-grid article:nth-child(3n) {
        border-right: 0;
    }

    .asset-summary-grid article:nth-child(n + 4) {
        border-top: 1px solid #26333f;
    }

    .entry-grid {
        grid-template-columns: 1fr;
    }

    .entry-item {
        border-right: 0;
        border-bottom: 1px solid #26333f;
    }

    .entry-item:last-child {
        border-bottom: 0;
    }

    .empty-demo-body {
        grid-template-columns: minmax(0, 1fr) 190px;
    }

    .analysis-grid {
        grid-template-columns: 1fr;
    }

    .ledger-insight-grid {
        grid-template-columns: 1fr;
    }

    .ledger-drawdown-grid {
        grid-template-columns: 1fr;
    }

    .signal-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .monthly-heatmap-layout {
        grid-template-columns: 1fr;
    }

    .monthly-extreme-list {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

}

@media (max-width: 760px) {
    .page-wrapper {
        padding: 2rem 0.8rem;
    }

    .page-header {
        margin-bottom: 2rem;
    }

    .main-title {
        font-size: 2rem;
    }

    .subtitle {
        font-size: 0.95rem;
    }

    .content-card {
        padding: 1.2rem;
        border-radius: 10px;
    }

    .overview-toolbar {
        align-items: flex-start;
        flex-direction: row;
        gap: 12px;
    }

    .overview-toolbar > div:first-child {
        min-width: 0;
    }

    .header-actions {
        flex: 0 0 auto;
        flex-wrap: nowrap;
        align-self: flex-start;
        width: auto;
        gap: 8px;
    }

    .header-actions .button {
        padding: 0 12px;
        min-height: 32px;
        font-size: 13px;
        white-space: nowrap;
        flex: 0 0 auto;
    }

    .ledger-more-menu {
        height: 32px;
    }

    .ledger-more-button {
        width: 24px;
        height: 32px;
    }

    .asset-summary-grid {
        grid-template-columns: 1fr 1fr;
    }

    .asset-summary-grid article {
        padding: 15px;
        border-top: 1px solid #26333f;
        min-width: 0;
    }

    .asset-summary-grid article:nth-child(odd) {
        border-right: 1px solid #26333f;
    }

    .asset-summary-grid article:nth-child(even) {
        border-right: 0;
    }

    .asset-summary-grid article:first-child,
    .asset-summary-grid article:nth-child(2) {
        border-top: 0;
    }

    .asset-summary-grid strong {
        font-size: clamp(15px, 4.2vw, 18px);
    }

    .asset-summary-primary strong {
        font-size: clamp(16px, 4.8vw, 20px);
    }

    .asset-summary-grid span,
    .asset-summary-grid small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .change-line em {
        overflow: visible;
        font-size: 10px;
        text-overflow: clip;
        flex: 0 0 auto;
    }

    .change-line span {
        font-size: 10px;
    }

    .annual-target-heading {
        align-items: flex-start;
    }

    .annual-target-meta {
        display: grid;
        grid-template-columns: 1fr;
        gap: 6px;
    }

    .account-status-line {
        padding: 10px 12px;
        font-size: 12px;
        gap: 6px 12px;
    }

    .chart-mode-switch {
        grid-template-columns: 1fr;
    }

    .chart-mode-switch button {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
    }

    .panel-heading {
        align-items: flex-start;
        flex-wrap: wrap;
    }

    .heatmap-controls {
        justify-content: stretch;
        width: 100%;
    }

    .heatmap-select-control {
        flex: 1 1 108px;
    }

    .heatmap-select-control.strategy-scope {
        flex-basis: 100%;
    }

    .heatmap-select-control select,
    .heatmap-select-control.wide select,
    .heatmap-select-control.strategy-scope select {
        width: 100%;
        min-width: 108px;
        max-width: none;
        field-sizing: fixed;
    }

    .heatmap-summary-strip {
        grid-template-columns: 1fr 1fr;
    }

    .heatmap-summary-strip article:nth-child(2n) {
        border-right: 0;
    }

    .heatmap-summary-strip article:nth-child(n + 3) {
        border-top: 1px solid rgb(255 255 255 / 9%);
    }

    .monthly-calendar {
        min-width: 620px;
        gap: 6px;
    }

    .calendar-day {
        padding: 7px 6px;
        min-height: 72px;
    }

    .calendar-day strong {
        font-size: 11px;
    }

    .monthly-extreme-list {
        grid-template-columns: 1fr;
    }

    .daily-extreme-columns {
        grid-template-columns: 1fr;
    }

    .recovery-trend-strip {
        grid-template-columns: repeat(3, max-content);
        justify-content: space-between;
        gap: 0;
    }

    .range-select-button {
        justify-content: space-between;
        width: 100%;
    }

    .return-panel-actions {
        display: grid;
        width: 100%;
        grid-template-columns: auto minmax(0, 1fr);
    }

    .share-download-button {
        justify-content: center;
        white-space: nowrap;
    }

    .range-option-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .range-date-fields {
        grid-template-columns: 1fr;
    }

    .entry-item {
        grid-template-columns: 1fr;
        gap: 10px;
    }

    .modal-entry-grid .entry-item,
    .modal-entry-grid .entry-item.has-advanced-fields {
        grid-template-columns: 1fr;
    }

    .modal-entry-grid .entry-name > div,
    .modal-entry-grid .entry-item:not(.has-advanced-fields) .entry-name > div {
        display: grid;
        align-items: center;
        width: 100%;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 6px;
    }

    .modal-entry-grid .entry-name span,
    .modal-entry-grid .entry-item:not(.has-advanced-fields) .entry-name span {
        justify-self: end;
        margin-top: 0;
        text-align: right;
    }

    .modal-entry-grid .entry-name,
    .modal-entry-grid .entry-result,
    .modal-entry-grid .entry-item.has-advanced-fields .entry-name,
    .modal-entry-grid .entry-item.has-advanced-fields .entry-result,
    .modal-entry-grid .entry-item.has-advanced-fields .entry-note,
    .modal-entry-grid .new-strategy-entry.has-advanced-fields .entry-note {
        grid-column: auto;
        grid-row: auto;
    }

    .modal-entry-grid .entry-result {
        justify-self: stretch;
    }

    .modal-entry-grid .entry-item.has-advanced-fields .entry-result {
        justify-self: stretch;
        order: 5;
    }

    .entry-result {
        display: flex;
        justify-content: space-between;
        padding: 0;
        text-align: left;
    }

    .entry-result strong {
        margin: 0;
    }

    .entry-note {
        grid-column: auto;
    }

    .modal-entry-grid .entry-item.has-advanced-fields .entry-note {
        order: 4;
    }

    .new-strategy-entry .entry-note {
        grid-column: auto;
    }

    .formula-tooltip {
        width: min(300px, calc(100vw - 48px));
        grid-template-columns: 1fr;
    }

    .return-table {
        overflow-x: auto;
    }

    .return-row {
        width: max-content;
        min-width: 100%;
        grid-template-columns: minmax(88px, 25vw) repeat(4, minmax(60px, 18vw));
    }

    .return-row.has-range {
        grid-template-columns: minmax(88px, 25vw) repeat(5, minmax(56px, 16vw));
    }

    .return-row > span,
    .return-row > strong,
    .return-name {
        padding: 0 8px;
    }

    .return-row > span:first-child,
    .return-name {
        position: sticky;
        left: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        min-height: inherit;
        background: #151515;
    }

    .return-head span:first-child {
        z-index: 2;
        background: #0f161d;
    }

    .return-row.account .return-name {
        background: #17211e;
    }

    .return-row > strong {
        font-size: 12px;
    }

    .return-name {
        gap: 7px;
    }

    .return-name strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .signal-grid {
        grid-template-columns: 1fr;
    }

    .audit-alert-grid {
        grid-template-columns: 1fr;
    }

    .benchmark-strip {
        grid-template-columns: 1fr 1fr;
    }

    .benchmark-strip article:nth-child(2n) {
        border-right: 0;
    }

    .daily-modal-toolbar {
        align-items: center;
        flex-wrap: wrap;
        padding: 10px 12px;
        gap: 10px;
    }

    .daily-modal .entry-date {
        flex: 1 1 auto;
        min-width: 82px;
    }

    .daily-modal .entry-date strong {
        white-space: nowrap;
    }

    .daily-toolbar-actions {
        flex: 0 0 auto;
        justify-content: flex-end;
        flex-wrap: nowrap;
        margin-left: auto;
        gap: 6px;
    }

    .daily-toolbar-actions .compact-action {
        padding: 7px 9px;
    }

    .allocation-layout {
        grid-template-columns: 1fr;
    }

    .allocation-chart {
        height: 230px;
    }

    .allocation-row {
        grid-template-columns: 84px minmax(76px, 1fr) 72px;
        gap: 8px;
    }

    .target-editor {
        grid-template-columns: 1fr 1fr;
    }

    .rebalance-summary {
        grid-template-columns: 1fr 1fr;
    }

    .rebalance-summary p {
        justify-self: start;
        max-width: none;
        grid-column: 1 / -1;
    }

    .attribution-summary {
        grid-template-columns: 1fr;
    }

    .attribution-panel,
    .drawdown-history-panel {
        min-height: 0;
    }

    .attribution-waterfall {
        height: 190px;
    }

    .attribution-help span {
        left: 50%;
        width: min(270px, calc(100vw - 72px));
        transform: translate(-50%, 4px);
    }

    .attribution-help:hover span,
    .attribution-help:focus-visible span,
    .attribution-help span.visible {
        transform: translate(-50%, 0);
    }

    .attribution-table-head {
        display: none;
    }

    .attribution-row {
        padding: 10px 0;
        grid-template-areas:
            'name contribution'
            'profit weight';
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 7px 14px;
    }

    .attribution-row .attribution-name {
        grid-area: name;
        min-width: 0;
    }

    .attribution-row .attribution-copy:nth-child(2) {
        grid-area: contribution;
    }

    .attribution-row .attribution-copy:nth-child(3) {
        grid-area: profit;
    }

    .attribution-row .attribution-copy:nth-child(4) {
        grid-area: weight;
    }

    .attribution-row .attribution-copy {
        display: flex;
        align-items: baseline;
        justify-content: flex-end;
        gap: 5px;
        text-align: right;
        white-space: nowrap;
    }

    .attribution-row .attribution-copy::before {
        color: #718294;
        font-size: 11px;
    }

    .attribution-row .attribution-copy:nth-child(2)::before {
        content: '收益';
    }

    .attribution-row .attribution-copy:nth-child(3)::before {
        content: '盈亏';
    }

    .attribution-row .attribution-copy:nth-child(4)::before {
        content: '权重';
    }

    .drawdown-history-row {
        padding: 10px 0;
        grid-template-areas:
            'index date date'
            '. status drawdown';
        grid-template-columns: 22px minmax(0, 1fr) auto;
        gap: 6px 8px;
    }

    .drawdown-history-row em {
        grid-area: index;
    }

    .drawdown-history-row span {
        grid-area: date;
        white-space: normal;
    }

    .drawdown-history-row small {
        grid-area: status;
    }

    .drawdown-history-row strong {
        grid-area: drawdown;
        justify-self: end;
    }

    .drawdown-attribution-summary {
        grid-template-columns: 1fr 1fr;
    }

    .drawdown-attribution-summary em {
        grid-column: 1 / -1;
    }

    .drawdown-attribution-row {
        gap: 7px;
    }

    .cash-flow-head {
        display: grid;
    }

    .cash-flow-list {
        overflow-x: auto;
    }

    .cash-flow-row {
        align-items: stretch;
        padding: 0;
        width: max-content;
        min-width: 100%;
        min-height: 42px;
        grid-template-columns: minmax(76px, 22vw) minmax(44px, 12vw) minmax(86px, 23vw) minmax(76px, 18vw) minmax(96px, 27vw) minmax(76px, 18vw);
        column-gap: 0;
    }

    .cash-flow-row > span:nth-child(6),
    .cash-flow-head span:nth-child(6) {
        justify-content: flex-end;
        text-align: right;
    }

    .cash-flow-row > strong:nth-child(5),
    .cash-flow-head span:nth-child(5) {
        justify-content: flex-start;
        text-align: left;
    }

    .cash-flow-row > strong:first-child,
    .cash-flow-head span:first-child {
        position: sticky;
        left: 0;
        z-index: 1;
        align-self: stretch;
        display: flex;
        align-items: center;
        padding: 0 8px;
        background: #151515;
    }

    .cash-flow-head span:first-child {
        z-index: 2;
        background: #0f161d;
    }

    .cash-flow-row > span,
    .cash-flow-row > strong {
        display: flex;
        align-items: center;
        padding: 0 8px;
        font-size: 12px;
    }

    .cash-flow-row > strong:first-child,
    .cash-flow-head span:first-child {
        padding: 0 8px;
    }

    .recovery-summary,
    .cash-flow-summary {
        grid-template-columns: 1fr 1fr;
    }

    .recovery-summary div:nth-child(2),
    .cash-flow-summary article:nth-child(2) {
        border-right: 0;
    }

    .recovery-summary div:nth-child(n + 3),
    .cash-flow-summary article:nth-child(n + 3) {
        border-top: 1px solid rgb(255 255 255 / 10%);
    }

    .record-table-wrap table {
        min-width: 760px;
    }

    .record-table-wrap th,
    .record-table-wrap td {
        padding: 10px;
        vertical-align: middle;
    }

    .record-table-wrap th:first-child,
    .record-table-wrap td:first-child {
        position: sticky;
        left: 0;
        z-index: 1;
        background: #151515;
    }

    .record-table-wrap th:first-child {
        z-index: 2;
        background: #0f161d;
    }

    .target-total {
        padding-top: 8px;
        padding-left: 0;
        border-top: 1px solid rgb(255 255 255 / 10%);
        border-left: 0;
        grid-column: 1 / -1;
    }

    .detail-grid {
        grid-template-columns: 1fr;
    }

    .performance-chart {
        height: 350px;
    }

    .experience-row {
        grid-template-columns: 125px minmax(60px, 1fr) 48px;
    }

    .strategy-detail-row {
        grid-template-columns: 1fr;
    }

    .detail-metrics {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
    }

    .detail-metrics span {
        padding: 8px 9px;
    }

    .detail-metrics strong {
        font-size: 13px;
    }

    .detail-status {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        text-align: left;
        gap: 10px;
    }

    .detail-status span {
        margin-top: 0;
        text-align: right;
    }

    .form-grid {
        grid-template-columns: 1fr;
    }

    .form-grid label.wide {
        grid-column: auto;
    }

    .initial-cashflow-prompt {
        align-items: stretch;
        flex-direction: column;
    }

    .initial-cashflow-prompt button {
        align-self: flex-start;
    }

    .import-steps {
        grid-template-columns: 1fr 1fr;
    }

    .empty-actions {
        flex-wrap: wrap;
    }

    .empty-demo-heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 7px;
    }

    .empty-demo-metrics {
        grid-template-columns: 1fr 1fr;
    }

    .empty-demo-metrics > div:nth-child(2) {
        border-right: 0;
    }

    .empty-demo-metrics > div:nth-child(n + 3) {
        border-top: 1px solid rgb(255 255 255 / 8%);
    }

    .empty-demo-body {
        grid-template-columns: 1fr;
    }

    .empty-demo-strategies {
        border-top: 1px solid rgb(255 255 255 / 8%);
        border-left: 0;
    }

}

@media (max-width: 380px) {
    .overview-card.content-card {
        padding: 1rem;
    }

    .overview-toolbar {
        gap: 8px;
    }

    .card-title {
        font-size: 1.22rem;
    }

    .card-description {
        overflow: visible;
        max-width: none;
        text-overflow: clip;
        white-space: normal;
    }

    .asset-summary-grid article {
        padding: 13px 12px;
    }

    .asset-summary-grid strong,
    .asset-summary-primary strong {
        margin: 7px 0 4px;
        font-size: 14px;
    }

    .asset-summary-grid span,
    .asset-summary-grid small,
    .change-line em,
    .change-line span {
        font-size: 10px;
    }

    .account-status-line {
        padding: 9px 10px;
        font-size: 11px;
        gap: 5px 10px;
    }
}
</style>
