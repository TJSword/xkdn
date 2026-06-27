const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const CLOUD_DIR = path.join(ROOT, 'data', 'portfolio-lab-cloud-function-trends')
const EXTRA_DIR = path.join(ROOT, 'data', 'portfolio-lab-trends')
const OUTPUT_FILE = path.join(EXTRA_DIR, 'portfolio-lab-report.html')

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function formatIntDate(value) {
    const text = String(value)
    if (/^\d{8}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
    return text
}

function toNumber(value) {
    const number = Number(value)
    return Number.isFinite(number) ? number : null
}

function formatPercent(value, digits = 2) {
    if (!Number.isFinite(value)) return '-'
    return `${(value * 100).toFixed(digits)}%`
}

function formatNumber(value, digits = 4) {
    if (!Number.isFinite(value)) return '-'
    return value.toFixed(digits)
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function calendarDays(start, end) {
    if (!start || !end) return null
    const a = new Date(`${start}T00:00:00+08:00`)
    const b = new Date(`${end}T00:00:00+08:00`)
    const days = Math.round((b - a) / 86400000)
    return Number.isFinite(days) ? days : null
}

function dailyReturnsFromValues(values) {
    return values.map((value, index) => {
        if (index === 0) return null
        const previous = values[index - 1]
        if (!Number.isFinite(previous) || previous === 0 || !Number.isFinite(value)) return null
        return value / previous - 1
    })
}

function buildRows(dateList, values, dailyReturnByDate = new Map()) {
    const derivedReturns = dailyReturnsFromValues(values)
    return dateList.map((date, index) => ({
        date,
        value: values[index],
        dailyReturn: dailyReturnByDate.has(date) ? dailyReturnByDate.get(date) : derivedReturns[index]
    }))
}

function loadCloudStrategies() {
    const manifest = readJson(path.join(CLOUD_DIR, 'manifest.json'))
    return manifest.strategies.map(item => {
        const payload = readJson(path.join(CLOUD_DIR, item.file))
        const trend = payload.trend
        const dateList = trend.dateList
        const values = trend.strategyData.map(Number)
        const returns = payload.rows || buildRows(dateList, values)
        const dailyReturnByDate = new Map(
            returns
                .map(row => [row.date, toNumber(row.dailyReturn)])
                .filter(([, value]) => Number.isFinite(value))
        )

        return {
            id: item.id,
            name: payload.strategy.name,
            source: '云函数 getPortfolioAnalysisData',
            sourcePath: `data/portfolio-lab-cloud-function-trends/${item.file}`,
            dateList,
            values,
            rows: buildRows(dateList, values, dailyReturnByDate),
            isAdded: false,
            trendPath: 'trend.dateList + trend.strategyData'
        }
    })
}

function findExtraFiles() {
    if (!fs.existsSync(EXTRA_DIR)) return []
    return fs
        .readdirSync(EXTRA_DIR)
        .filter(file => file.endsWith('.json'))
        .filter(file => /5|10/.test(file))
        .map(file => path.join(EXTRA_DIR, file))
}

function loadExtraStrategy(filePath) {
    const fileName = path.basename(filePath)
    const payload = readJson(filePath)
    const chart = payload.data.chart.sheet_data
    const dailyChart = payload.data.daily_chart.sheet_data
    const dates = chart.row[0].data[0].map(formatIntDate)
    const cumulativeReturns = chart.meas_data[1].map(Number)
    const values = cumulativeReturns.map(value => 1 + value)
    const dailyDates = dailyChart.row[0].data[0].map(formatIntDate)
    const dailyReturns = dailyChart.meas_data[1].map(Number)
    const dailyReturnByDate = new Map()
    dailyDates.forEach((date, index) => {
        const value = toNumber(dailyReturns[index])
        if (Number.isFinite(value)) dailyReturnByDate.set(date, value)
    })

    const isFive = fileName.includes('5')
    return {
        id: isFive ? 'high_dividend_5' : 'high_dividend_10',
        name: isFive ? '高股息 5 只' : '高股息 10 只',
        source: '外部抓取 JSON',
        sourcePath: `data/portfolio-lab-trends/${fileName}`,
        dateList: dates,
        values,
        cumulativeReturns,
        rows: buildRows(dates, values, dailyReturnByDate),
        isAdded: true,
        trendPath:
            'data.chart.sheet_data.row[0].data[0] 为日期；data.chart.sheet_data.meas_data[1] 为策略累计收益率；data.daily_chart.sheet_data.meas_data[1] 为策略日收益'
    }
}

function pearson(xs, ys) {
    const n = xs.length
    if (n < 2) return null
    const meanX = xs.reduce((sum, value) => sum + value, 0) / n
    const meanY = ys.reduce((sum, value) => sum + value, 0) / n
    let numerator = 0
    let denomX = 0
    let denomY = 0
    for (let i = 0; i < n; i++) {
        const dx = xs[i] - meanX
        const dy = ys[i] - meanY
        numerator += dx * dy
        denomX += dx * dx
        denomY += dy * dy
    }
    if (denomX === 0 || denomY === 0) return null
    return numerator / Math.sqrt(denomX * denomY)
}

function calculateCorrelation(a, b) {
    const mapA = new Map(a.rows.filter(row => Number.isFinite(row.dailyReturn)).map(row => [row.date, row.dailyReturn]))
    const mapB = new Map(b.rows.filter(row => Number.isFinite(row.dailyReturn)).map(row => [row.date, row.dailyReturn]))
    const dates = [...mapA.keys()].filter(date => mapB.has(date)).sort()
    const xs = dates.map(date => mapA.get(date))
    const ys = dates.map(date => mapB.get(date))
    return {
        correlation: pearson(xs, ys),
        count: dates.length,
        firstDate: dates[0] || null,
        lastDate: dates[dates.length - 1] || null
    }
}

function percentileRank(values, currentValue) {
    const cleanValues = values.filter(Number.isFinite)
    if (cleanValues.length === 0 || !Number.isFinite(currentValue)) return null
    const less = cleanValues.filter(value => value < currentValue).length
    const equal = cleanValues.filter(value => value === currentValue).length
    return (less + equal * 0.5) / cleanValues.length
}

function percentileValue(values, percentile) {
    const cleanValues = values.filter(Number.isFinite).sort((a, b) => a - b)
    if (cleanValues.length === 0) return null
    const index = (cleanValues.length - 1) * percentile
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    if (lower === upper) return cleanValues[lower]
    const weight = index - lower
    return cleanValues[lower] * (1 - weight) + cleanValues[upper] * weight
}

function drawdownSeries(strategy) {
    let peak = -Infinity
    return strategy.values.map((value, index) => {
        if (value > peak) peak = value
        return {
            date: strategy.dateList[index],
            value,
            drawdown: peak > 0 ? value / peak - 1 : 0
        }
    })
}

function calculateDrawdownEpisodes(strategy) {
    const values = strategy.values
    const dates = strategy.dateList
    const episodes = []
    let peakIndex = 0
    let inDrawdown = false
    let troughIndex = 0

    for (let i = 1; i < values.length; i++) {
        if (!inDrawdown && values[i] >= values[peakIndex]) {
            peakIndex = i
            continue
        }

        if (!inDrawdown && values[i] < values[peakIndex]) {
            inDrawdown = true
            troughIndex = i
            continue
        }

        if (inDrawdown) {
            if (values[i] < values[troughIndex]) troughIndex = i
            if (values[i] >= values[peakIndex]) {
                const recoveryIndex = i
                episodes.push(makeEpisode(strategy, peakIndex, troughIndex, recoveryIndex))
                peakIndex = i
                inDrawdown = false
                troughIndex = i
            }
        }
    }

    if (inDrawdown) {
        episodes.push(makeEpisode(strategy, peakIndex, troughIndex, null))
    }

    return episodes.filter(episode => episode.depth > 0)
}

function makeEpisode(strategy, peakIndex, troughIndex, recoveryIndex) {
    const peakValue = strategy.values[peakIndex]
    const troughValue = strategy.values[troughIndex]
    const recoveryDate = recoveryIndex == null ? null : strategy.dateList[recoveryIndex]
    return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        peakIndex,
        troughIndex,
        recoveryIndex,
        peakDate: strategy.dateList[peakIndex],
        troughDate: strategy.dateList[troughIndex],
        recoveryDate,
        peakValue,
        troughValue,
        depth: 1 - troughValue / peakValue,
        tradingDaysToTrough: troughIndex - peakIndex,
        repairTradingDays: recoveryIndex == null ? null : recoveryIndex - troughIndex,
        totalTradingDays: (recoveryIndex == null ? strategy.values.length - 1 : recoveryIndex) - peakIndex,
        repairCalendarDays: recoveryDate == null ? null : calendarDays(strategy.dateList[troughIndex], recoveryDate),
        isRecovered: recoveryIndex != null
    }
}

function makeSparkline(strategy, width = 260, height = 72) {
    const values = strategy.values
    const min = Math.min(...values)
    const max = Math.max(...values)
    const step = values.length > 1 ? width / (values.length - 1) : width
    const points = values
        .map((value, index) => {
            const x = index * step
            const y = max === min ? height / 2 : height - ((value - min) / (max - min)) * height
            return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')
    return `<svg viewBox="0 0 ${width} ${height}" class="sparkline" role="img" aria-label="${escapeHtml(
        strategy.name
    )}走势"><polyline points="${points}" /></svg>`
}

function table(headers, rows) {
    return `<table><thead><tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows
        .map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`
}

function mixColor(start, end, amount) {
    const mixed = start.map((value, index) => Math.round(value + (end[index] - value) * amount))
    return `rgb(${mixed.join(', ')})`
}

function correlationHeatCell(correlation) {
    if (!Number.isFinite(correlation)) {
        return {
            background: '#f8fafc',
            color: '#667085',
            border: '#e8edf4'
        }
    }

    const strength = Math.min(1, Math.abs(correlation))
    const neutral = [248, 250, 252]
    const positive = [190, 18, 60]
    const negative = [37, 99, 235]
    const target = correlation >= 0 ? positive : negative
    const background = mixColor(neutral, target, Math.max(0.08, strength))

    return {
        background,
        color: strength >= 0.55 ? '#fff' : '#172033',
        border: strength >= 0.55 ? 'rgba(255,255,255,.35)' : '#e8edf4'
    }
}

function correlationHeatmapTable(strategyList, pairMap) {
    const header = `<thead><tr><th class="heatmap-corner">策略</th>${strategyList
        .map(strategy => `<th class="heatmap-axis">${escapeHtml(strategy.name)}</th>`)
        .join('')}</tr></thead>`

    const body = strategyList
        .map(rowStrategy => {
            const cells = strategyList
                .map(colStrategy => {
                    if (rowStrategy.id === colStrategy.id) {
                        return `<td class="heatmap-cell heatmap-cell--self"><strong>1.000</strong><span>自身</span></td>`
                    }

                    const result = pairMap.get(`${rowStrategy.id}|${colStrategy.id}`)
                    const style = correlationHeatCell(result?.correlation)
                    return `<td class="heatmap-cell" style="background:${style.background};color:${style.color};border-color:${style.border}" title="${escapeHtml(
                        rowStrategy.name
                    )} vs ${escapeHtml(colStrategy.name)}：${formatNumber(result?.correlation, 4)}，交集 ${
                        result?.count || 0
                    } 天，${escapeHtml(result?.firstDate || '-')} 至 ${escapeHtml(
                        result?.lastDate || '-'
                    )}"><strong>${formatNumber(result?.correlation, 3)}</strong><span>${
                        result?.count || 0
                    }天</span></td>`
                })
                .join('')
            return `<tr><th class="heatmap-axis heatmap-row-label">${escapeHtml(rowStrategy.name)}</th>${cells}</tr>`
        })
        .join('')

    return `<table class="heatmap-table">${header}<tbody>${body}</tbody></table>`
}

const strategies = [...loadCloudStrategies(), ...findExtraFiles().map(loadExtraStrategy)].sort((a, b) =>
    a.name.localeCompare(b.name, 'zh-Hans-CN')
)
const strategyById = new Map(strategies.map(strategy => [strategy.id, strategy]))
const addedStrategies = strategies.filter(strategy => strategy.isAdded)

const correlationRows = []
const correlationMap = new Map()
for (let i = 0; i < strategies.length; i++) {
    for (let j = i + 1; j < strategies.length; j++) {
        const a = strategies[i]
        const b = strategies[j]
        const result = calculateCorrelation(a, b)
        correlationRows.push({ a, b, ...result })
        correlationMap.set(`${a.id}|${b.id}`, result)
        correlationMap.set(`${b.id}|${a.id}`, result)
    }
}

const drawdownStrategies = addedStrategies

const maxDrawdowns = drawdownStrategies.map(strategy => {
    const episodes = calculateDrawdownEpisodes(strategy)
    return {
        strategy,
        episode: episodes.sort((a, b) => b.depth - a.depth)[0],
        episodes
    }
})

const top10ByStrategy = maxDrawdowns.map(({ strategy, episodes }) => ({
    strategy,
    episodes: [...episodes].sort((a, b) => b.depth - a.depth).slice(0, 10)
}))
const top10EpisodeCount = top10ByStrategy.reduce((sum, item) => sum + item.episodes.length, 0)

const addedPercentiles = addedStrategies.map(strategy => {
    const latestValue = strategy.values[strategy.values.length - 1]
    const cumulativeReturn = strategy.cumulativeReturns?.[strategy.cumulativeReturns.length - 1] ?? latestValue - 1
    const ddSeries = drawdownSeries(strategy).map(row => Math.abs(row.drawdown))
    const currentDrawdown = ddSeries[ddSeries.length - 1]
    return {
        strategy,
        latestValue,
        cumulativeReturn,
        valuePercentile: percentileRank(strategy.values, latestValue),
        drawdownPercentile: percentileRank(ddSeries, currentDrawdown),
        currentDrawdown
    }
})

const summaryRows = strategies.map(strategy => {
    const first = strategy.dateList[0]
    const last = strategy.dateList[strategy.dateList.length - 1]
    const latestValue = strategy.values[strategy.values.length - 1]
    return [
        escapeHtml(strategy.name),
        escapeHtml(strategy.source),
        escapeHtml(first),
        escapeHtml(last),
        strategy.dateList.length,
        formatNumber(latestValue, 4),
        makeSparkline(strategy)
    ]
})

const correlationHeatmap = correlationHeatmapTable(strategies, correlationMap)

const strongestRows = correlationRows
    .filter(row => Number.isFinite(row.correlation))
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
    .slice(0, 15)
    .map(row => [
        escapeHtml(row.a.name),
        escapeHtml(row.b.name),
        formatNumber(row.correlation, 4),
        row.count,
        `${escapeHtml(row.firstDate)} 至 ${escapeHtml(row.lastDate)}`
    ])

const addedPercentileRows = addedPercentiles.map(item => [
    escapeHtml(item.strategy.name),
    formatPercent(item.cumulativeReturn),
    formatNumber(item.latestValue, 4),
    formatPercent(item.valuePercentile),
    formatPercent(item.currentDrawdown),
    formatPercent(item.drawdownPercentile),
    '净值百分位=最新净值在自身历史净值序列中的百分位；回撤百分位=当前回撤深度在自身历史回撤深度中的百分位'
    ])

const distanceToHighRows = addedStrategies.map(strategy => {
    let peak = -Infinity
    let peakDate = ''
    let highCount = 0
    const distances = strategy.values.map((value, index) => {
        if (value >= peak) {
            peak = value
            peakDate = strategy.dateList[index]
            highCount += 1
        }
        return peak > 0 ? 1 - value / peak : 0
    })
    const latestDistance = distances[distances.length - 1]
    const latestValue = strategy.values[strategy.values.length - 1]

    return [
        escapeHtml(strategy.name),
        escapeHtml(strategy.dateList[strategy.dateList.length - 1]),
        formatNumber(latestValue, 4),
        formatNumber(peak, 4),
        escapeHtml(peakDate),
        formatPercent(latestDistance),
        formatPercent(percentileRank(distances, latestDistance)),
        formatPercent(percentileValue(distances, 0.5)),
        formatPercent(percentileValue(distances, 0.9)),
        formatPercent(highCount / strategy.values.length)
    ]
})

const maxDrawdownRows = maxDrawdowns
    .sort((a, b) => (b.episode?.depth || 0) - (a.episode?.depth || 0))
    .map(({ strategy, episode }) => [
        escapeHtml(strategy.name),
        episode ? formatPercent(episode.depth) : '-',
        episode ? escapeHtml(episode.peakDate) : '-',
        episode ? escapeHtml(episode.troughDate) : '-',
        episode?.recoveryDate ? escapeHtml(episode.recoveryDate) : '<span class="danger">未修复</span>',
        episode ? episode.tradingDaysToTrough : '-',
        episode?.repairTradingDays == null ? '-' : episode.repairTradingDays,
        episode?.repairCalendarDays == null ? '-' : episode.repairCalendarDays
    ])

const top10DrawdownSections = top10ByStrategy
    .map(({ strategy, episodes }) => {
        const rows = episodes.map((episode, index) => [
            index + 1,
            formatPercent(episode.depth),
            escapeHtml(episode.peakDate),
            escapeHtml(episode.troughDate),
            episode.recoveryDate ? escapeHtml(episode.recoveryDate) : '<span class="danger">未修复</span>',
            episode.tradingDaysToTrough,
            episode.repairTradingDays == null ? '-' : episode.repairTradingDays,
            episode.totalTradingDays
        ])

        return `<h3>${escapeHtml(strategy.name)} Top 10 最大回撤</h3><div class="table-wrap">${table(
            ['排名', '回撤', '峰值日', '谷底日', '修复日', '峰到谷交易日', '谷到修复交易日', '总交易日'],
            rows
        )}</div>`
    })
    .join('')

const levelRows = addedStrategies.map(strategy => [
    escapeHtml(strategy.name),
    escapeHtml(strategy.sourcePath),
    '<code>data.chart.sheet_data.row[0].data[0]</code>',
    '<code>data.chart.sheet_data.meas_data[1]</code>',
    '<code>data.daily_chart.sheet_data.meas_data[1]</code>',
    `${escapeHtml(strategy.dateList[0])} 至 ${escapeHtml(strategy.dateList[strategy.dateList.length - 1])}`
])

const rollingCorrelationPayload = JSON.stringify({
    defaultA: strategies.some(strategy => strategy.id === 'high_dividend_10') ? 'high_dividend_10' : strategies[0]?.id,
    defaultB: strategies.some(strategy => strategy.id === 'high_dividend_5') ? 'high_dividend_5' : strategies[1]?.id,
    strategies: strategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        rows: strategy.rows
            .filter(row => Number.isFinite(row.dailyReturn))
            .map(row => ({
                date: row.date,
                dailyReturn: Number(row.dailyReturn)
            }))
    }))
}).replace(/<\/script/gi, '<\\/script')

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>组合实验室策略相关性与回撤报告</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; color: #172033; background: #f6f8fb; }
    main { max-width: 1180px; margin: 0 auto; padding: 32px 20px 56px; }
    h1 { margin: 0 0 8px; font-size: 30px; }
    h2 { margin: 34px 0 14px; font-size: 21px; }
    h3 { margin: 18px 0 8px; font-size: 16px; }
    p { line-height: 1.7; }
    .hero, section { background: #fff; border: 1px solid #e5e9f0; border-radius: 8px; padding: 20px; margin-bottom: 18px; box-shadow: 0 8px 24px rgba(21, 33, 56, .05); }
    .meta { color: #667085; margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
    .metric { border: 1px solid #e8edf4; border-radius: 8px; padding: 14px; background: #fbfcfe; }
    .metric span { display: block; color: #667085; font-size: 13px; }
    .metric strong { display: block; margin-top: 6px; font-size: 21px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; background: #fff; }
    th, td { border-bottom: 1px solid #e8edf4; padding: 9px 10px; text-align: left; vertical-align: middle; }
    th { background: #f1f5f9; color: #344054; position: sticky; top: 0; }
    code { background: #eef2f7; border-radius: 4px; padding: 2px 5px; }
    .table-wrap { overflow: auto; border: 1px solid #e8edf4; border-radius: 8px; }
    .muted { color: #667085; font-size: 12px; }
    .danger { color: #b42318; font-weight: 600; }
    .sparkline { width: 180px; height: 48px; }
    .sparkline polyline { fill: none; stroke: #2563eb; stroke-width: 2; vector-effect: non-scaling-stroke; }
    .heatmap-wrap { max-height: 680px; }
    .heatmap-table { min-width: 980px; table-layout: fixed; border-collapse: separate; border-spacing: 0; }
    .heatmap-table th, .heatmap-table td { border: 1px solid #e8edf4; padding: 10px 8px; text-align: center; }
    .heatmap-corner { left: 0; z-index: 4; min-width: 132px; }
    .heatmap-axis { font-size: 12px; line-height: 1.25; white-space: normal; }
    .heatmap-row-label { position: sticky; left: 0; z-index: 3; width: 132px; background: #f1f5f9; text-align: right; }
    .heatmap-cell { min-width: 96px; height: 64px; transition: transform .12s ease, box-shadow .12s ease; }
    .heatmap-cell:hover { position: relative; z-index: 2; transform: scale(1.04); box-shadow: 0 10px 24px rgba(15, 23, 42, .18); }
    .heatmap-cell strong { display: block; font-size: 16px; line-height: 1.1; }
    .heatmap-cell span { display: block; margin-top: 6px; font-size: 11px; opacity: .82; }
    .heatmap-cell--self { background: #172033; color: #fff; border-color: #172033; }
    .heatmap-legend { display: flex; align-items: center; gap: 10px; margin: 10px 0 14px; color: #667085; font-size: 12px; }
    .heatmap-gradient { width: 220px; height: 12px; border-radius: 999px; border: 1px solid #d0d5dd; background: linear-gradient(90deg, #2563eb 0%, #f8fafc 50%, #be123c 100%); }
    .control-row { display: grid; grid-template-columns: 1fr 1fr 180px; gap: 12px; margin: 14px 0 16px; align-items: end; }
    .field label { display: block; margin-bottom: 6px; color: #475467; font-size: 12px; }
    .field select { width: 100%; border: 1px solid #d0d5dd; border-radius: 8px; background: #fff; color: #172033; padding: 9px 10px; font-size: 14px; }
    .chart-panel { border: 1px solid #e8edf4; border-radius: 8px; padding: 14px; background: #fbfcfe; }
    .rolling-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
    .rolling-stat { border: 1px solid #e8edf4; border-radius: 8px; padding: 10px; background: #fff; }
    .rolling-stat span { display: block; color: #667085; font-size: 12px; }
    .rolling-stat strong { display: block; margin-top: 4px; font-size: 18px; }
    #rollingCorrelationCanvas { width: 100%; height: 320px; display: block; background: #fff; border: 1px solid #e8edf4; border-radius: 8px; }
    @media (max-width: 800px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } main { padding: 20px 10px 40px; } }
    @media (max-width: 800px) { .control-row, .rolling-stats { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <h1>组合实验室策略相关性与回撤报告</h1>
      <p class="meta">生成时间：${escapeHtml(new Date().toLocaleString('zh-CN', { hour12: false }))}</p>
      <p>本报告使用云函数导出的 6 条组合实验室策略，加上 <code>data/portfolio-lab-trends</code> 中新增的两条高股息策略。相关性按两个策略各自的交易日交集计算，不使用全体策略共同区间。</p>
      <div class="grid">
        <div class="metric"><span>策略数量</span><strong>${strategies.length}</strong></div>
        <div class="metric"><span>新增外部策略</span><strong>${addedStrategies.length}</strong></div>
        <div class="metric"><span>相关性组合</span><strong>${correlationRows.length}</strong></div>
        <div class="metric"><span>高股息 Top 回撤事件</span><strong>${top10EpisodeCount}</strong></div>
      </div>
    </div>

    <section>
      <h2>高股息文件走势数据层级</h2>
      <div class="table-wrap">${table(
          ['策略', '来源文件', '日期层级', '累计收益层级', '日收益层级', '日期范围'],
          levelRows
      )}</div>
    </section>

    <section>
      <h2>策略数据概览</h2>
      <div class="table-wrap">${table(
          ['策略', '来源', '起始日期', '结束日期', '样本数', '最新净值/指数', '走势'],
          summaryRows
      )}</div>
    </section>

    <section>
      <h2>相关性矩阵</h2>
      <p class="muted">单元格上方为日收益 Pearson 相关系数，下方为这两个策略自己的交集交易日数量。</p>
      <div class="heatmap-legend"><span>负相关</span><span class="heatmap-gradient"></span><span>正相关</span><span>颜色越深，绝对相关性越强</span></div>
      <div class="table-wrap heatmap-wrap">${correlationHeatmap}</div>
    </section>

    <section>
      <h2>滚动相关性</h2>
      <p class="muted">选择两个策略后，按它们自己的日期交集计算滚动日收益相关性。</p>
      <div class="control-row">
        <div class="field">
          <label for="rollingStrategyA">策略 A</label>
          <select id="rollingStrategyA"></select>
        </div>
        <div class="field">
          <label for="rollingStrategyB">策略 B</label>
          <select id="rollingStrategyB"></select>
        </div>
        <div class="field">
          <label for="rollingWindow">滚动窗口</label>
          <select id="rollingWindow">
            <option value="20">20 个交易日</option>
            <option value="60">60 个交易日</option>
            <option value="120" selected>120 个交易日</option>
            <option value="252">252 个交易日</option>
          </select>
        </div>
      </div>
      <div class="chart-panel">
        <div class="rolling-stats">
          <div class="rolling-stat"><span>最新滚动相关</span><strong id="rollingLatest">-</strong></div>
          <div class="rolling-stat"><span>均值</span><strong id="rollingMean">-</strong></div>
          <div class="rolling-stat"><span>样本点</span><strong id="rollingSamples">-</strong></div>
          <div class="rolling-stat"><span>覆盖区间</span><strong id="rollingRange">-</strong></div>
        </div>
        <canvas id="rollingCorrelationCanvas" width="1100" height="360"></canvas>
      </div>
    </section>

    <section>
      <h2>绝对相关性最高的组合</h2>
      <div class="table-wrap">${table(['策略 A', '策略 B', '相关系数', '交集天数', '交集区间'], strongestRows)}</div>
    </section>

    <section>
      <h2>新增高股息策略当前回测百分位</h2>
      <div class="table-wrap">${table(
          ['策略', '当前累计收益', '当前净值', '净值百分位', '当前回撤', '回撤深度百分位', '口径'],
          addedPercentileRows
      )}</div>
    </section>

    <section>
      <h2>高股息策略距离新高百分位</h2>
      <p class="muted">每天计算一次距离截至当日历史新高的距离：<code>1 - 当日净值 / 截至当日历史最高净值</code>。百分位表示当前距离新高的程度高于自身历史多少天，数值越高代表当前越远离历史新高。</p>
      <div class="table-wrap">${table(
          ['策略', '最新日期', '当前净值', '历史新高', '新高日期', '当前距离新高', '距离新高百分位', '历史中位距离', '历史 90% 距离', '创新高天数占比'],
          distanceToHighRows
      )}</div>
    </section>

    <section>
      <h2>高股息策略历史最大回撤及修复时间</h2>
      <div class="table-wrap">${table(
          ['策略', '最大回撤', '峰值日', '谷底日', '修复日', '峰到谷交易日', '谷到修复交易日', '谷到修复自然日'],
          maxDrawdownRows
      )}</div>
    </section>

    <section>
      <h2>高股息策略 Top 10 最大回撤</h2>
      <p class="muted">高股息 5 只和高股息 10 只分别按每一次完整回撤事件的最大回撤幅度排序，各取前十。</p>
      ${top10DrawdownSections}
    </section>
  </main>
  <script>
    const rollingCorrelationData = ${rollingCorrelationPayload};

    function rollingMean(values) {
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    function rollingPearson(xs, ys) {
      if (xs.length < 2 || ys.length < 2 || xs.length !== ys.length) return null;
      const meanX = rollingMean(xs);
      const meanY = rollingMean(ys);
      let numerator = 0;
      let denomX = 0;
      let denomY = 0;
      for (let i = 0; i < xs.length; i += 1) {
        const dx = xs[i] - meanX;
        const dy = ys[i] - meanY;
        numerator += dx * dy;
        denomX += dx * dx;
        denomY += dy * dy;
      }
      if (denomX === 0 || denomY === 0) return null;
      return numerator / Math.sqrt(denomX * denomY);
    }

    function formatCorr(value) {
      return Number.isFinite(value) ? value.toFixed(3) : '-';
    }

    function makePairRows(strategyA, strategyB) {
      const mapA = new Map(strategyA.rows.map(row => [row.date, row.dailyReturn]));
      return strategyB.rows
        .filter(row => mapA.has(row.date))
        .map(row => ({
          date: row.date,
          a: mapA.get(row.date),
          b: row.dailyReturn
        }))
        .sort((left, right) => left.date.localeCompare(right.date));
    }

    function calculateRollingCorrelation(pairRows, windowSize) {
      const output = [];
      for (let i = windowSize - 1; i < pairRows.length; i += 1) {
        const slice = pairRows.slice(i - windowSize + 1, i + 1);
        const value = rollingPearson(slice.map(row => row.a), slice.map(row => row.b));
        if (Number.isFinite(value)) {
          output.push({ date: pairRows[i].date, value });
        }
      }
      return output;
    }

    function drawRollingChart(points) {
      const canvas = document.getElementById('rollingCorrelationCanvas');
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const padding = { left: 52, right: 18, top: 22, bottom: 38 };
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const yFor = value => padding.top + (1 - (value + 1) / 2) * plotHeight;
      const xFor = index => padding.left + (points.length <= 1 ? 0 : (index / (points.length - 1)) * plotWidth);

      ctx.strokeStyle = '#e8edf4';
      ctx.lineWidth = 1;
      [-1, -0.5, 0, 0.5, 1].forEach(value => {
        const y = yFor(value);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.fillStyle = '#667085';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
        ctx.fillText(value.toFixed(1), 12, y + 4);
      });

      if (points.length === 0) {
        ctx.fillStyle = '#667085';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
        ctx.fillText('交集样本不足，无法绘制当前窗口的滚动相关性。', padding.left, height / 2);
        return;
      }

      const gradient = ctx.createLinearGradient(padding.left, 0, width - padding.right, 0);
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(0.5, '#7c3aed');
      gradient.addColorStop(1, '#be123c');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      points.forEach((point, index) => {
        const x = xFor(index);
        const y = yFor(point.value);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const latest = points[points.length - 1];
      ctx.fillStyle = '#be123c';
      ctx.beginPath();
      ctx.arc(xFor(points.length - 1), yFor(latest.value), 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#667085';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      ctx.fillText(points[0].date, padding.left, height - 12);
      const lastText = points[points.length - 1].date;
      const lastWidth = ctx.measureText(lastText).width;
      ctx.fillText(lastText, width - padding.right - lastWidth, height - 12);
    }

    function updateRollingCorrelation() {
      const strategyA = rollingCorrelationData.strategies.find(
        strategy => strategy.id === document.getElementById('rollingStrategyA').value
      );
      const strategyB = rollingCorrelationData.strategies.find(
        strategy => strategy.id === document.getElementById('rollingStrategyB').value
      );
      const windowSize = Number(document.getElementById('rollingWindow').value);
      const pairRows = makePairRows(strategyA, strategyB);
      const points = calculateRollingCorrelation(pairRows, windowSize);
      const latest = points[points.length - 1]?.value;
      const mean = points.length ? rollingMean(points.map(point => point.value)) : null;

      document.getElementById('rollingLatest').textContent = formatCorr(latest);
      document.getElementById('rollingMean').textContent = formatCorr(mean);
      document.getElementById('rollingSamples').textContent = String(points.length);
      document.getElementById('rollingRange').textContent = points.length
        ? points[0].date + ' 至 ' + points[points.length - 1].date
        : '-';
      drawRollingChart(points);
    }

    function initRollingControls() {
      const selectA = document.getElementById('rollingStrategyA');
      const selectB = document.getElementById('rollingStrategyB');
      rollingCorrelationData.strategies.forEach(strategy => {
        const optionA = document.createElement('option');
        optionA.value = strategy.id;
        optionA.textContent = strategy.name;
        selectA.appendChild(optionA);

        const optionB = document.createElement('option');
        optionB.value = strategy.id;
        optionB.textContent = strategy.name;
        selectB.appendChild(optionB);
      });
      selectA.value = rollingCorrelationData.defaultA;
      selectB.value = rollingCorrelationData.defaultB;
      selectA.addEventListener('change', updateRollingCorrelation);
      selectB.addEventListener('change', updateRollingCorrelation);
      document.getElementById('rollingWindow').addEventListener('change', updateRollingCorrelation);
      updateRollingCorrelation();
    }

    initRollingControls();
  </script>
</body>
</html>
`

fs.mkdirSync(EXTRA_DIR, { recursive: true })
fs.writeFileSync(OUTPUT_FILE, html, 'utf8')

console.log(
    JSON.stringify(
        {
            outputFile: OUTPUT_FILE,
            strategies: strategies.map(strategy => ({
                id: strategy.id,
                name: strategy.name,
                firstDate: strategy.dateList[0],
                lastDate: strategy.dateList[strategy.dateList.length - 1],
                count: strategy.dateList.length,
                trendPath: strategy.trendPath
            })),
            strongest: strongestRows.slice(0, 5)
        },
        null,
        2
    )
)
