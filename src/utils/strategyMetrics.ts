export interface StrategyStats {
    totalReturn: string
    annualizedReturn: string
    volatility: string
    sharpe: string
    maxDrawdown: string
    calmar: string
}

export interface MonthlyReturnRow {
    year: number
    months: Array<string | null>
    total: string
}

export interface DrawdownEvent {
    startDate: string
    troughDate: string
    endDate: string
    drawdown: string
    rawDd: number
    ddDays: number
    fixDays: number | string
}

export interface DrawdownDistributionItem {
    range: string
    count: number
    percent: number
}

export interface StrategySeries {
    dates: string[]
    values: number[]
}

export interface MonthlySummary {
    profitableMonths: number
    totalMonths: number
    winRate: string
}

const DEFAULT_TRADING_DAYS = 250
const DEFAULT_RISK_FREE_RATE = 0.02

const emptyStats = (): StrategyStats => ({
    totalReturn: '0.00',
    annualizedReturn: '0.00',
    volatility: '0.00',
    sharpe: '0.000',
    maxDrawdown: '0.00',
    calmar: '0.000'
})

export const prepareStrategySeries = (dateList: string[] = [], strategyData: number[] = []): StrategySeries => {
    const dates: string[] = []
    const values: number[] = []
    const length = Math.min(dateList.length, strategyData.length)

    for (let i = 0; i < length; i++) {
        const value = Number(strategyData[i])
        if (dateList[i] && Number.isFinite(value) && value > 0) {
            dates.push(dateList[i])
            values.push(value)
        }
    }

    return { dates, values }
}

export const formatBacktestPeriod = (dates: string[] = []) => {
    const startDate = dates.find(Boolean)
    const endDate = [...dates].reverse().find(Boolean)

    if (!startDate && !endDate) return '回测周期: --'
    if (startDate === endDate) return `回测周期: ${startDate}`
    return `回测周期: ${startDate} 至 ${endDate}`
}

export const normalizeSeries = (data: number[]) => {
    if (data.length === 0 || data[0] <= 0 || !Number.isFinite(data[0])) return []
    return data.map(value => value / data[0])
}

export const getDailyReturns = (data: number[]) => {
    const res: number[] = []
    for (let i = 1; i < data.length; i++) {
        if (data[i - 1] > 0 && Number.isFinite(data[i])) {
            res.push(data[i] / data[i - 1] - 1)
        }
    }
    return res
}

export const calculateStats = (
    data: number[],
    tradingDays = DEFAULT_TRADING_DAYS,
    riskFreeRate = DEFAULT_RISK_FREE_RATE
): StrategyStats => {
    if (data.length < 2 || data[0] <= 0) return emptyStats()

    const totalReturn = data[data.length - 1] / data[0] - 1
    const dailyReturns = getDailyReturns(data)
    const periods = data.length - 1
    if (dailyReturns.length === 0 || !Number.isFinite(totalReturn)) return emptyStats()

    const annualizedReturn = Math.pow(1 + totalReturn, tradingDays / periods) - 1
    const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
    const variance =
        dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyReturns.length
    const stdDev = Math.sqrt(variance)
    const volatility = stdDev * Math.sqrt(tradingDays)
    const sharpe = volatility === 0 ? 0 : (annualizedReturn - riskFreeRate) / volatility

    let maxDd = 0
    let peak = data[0]
    for (const val of data) {
        if (val > peak) peak = val
        const dd = (val - peak) / peak
        if (dd < maxDd) maxDd = dd
    }

    const calmar = Math.abs(maxDd) > 0.0001 ? annualizedReturn / Math.abs(maxDd) : 0

    return {
        totalReturn: (totalReturn * 100).toFixed(2),
        annualizedReturn: (annualizedReturn * 100).toFixed(2),
        volatility: (volatility * 100).toFixed(2),
        sharpe: sharpe.toFixed(3),
        maxDrawdown: (maxDd * 100).toFixed(2),
        calmar: calmar.toFixed(3)
    }
}

export const calculateCorrelation = (x: number[], y: number[]) => {
    const n = x.length
    if (n === 0 || n !== y.length) return 0

    const meanX = x.reduce((a, b) => a + b, 0) / n
    const meanY = y.reduce((a, b) => a + b, 0) / n

    let num = 0
    let denX = 0
    let denY = 0
    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX
        const dy = y[i] - meanY
        num += dx * dy
        denX += dx * dx
        denY += dy * dy
    }

    if (denX === 0 || denY === 0) return 0
    return num / Math.sqrt(denX * denY)
}

export const calculateSortinoRatio = (
    data: number[],
    tradingDays = DEFAULT_TRADING_DAYS,
    riskFreeRate = DEFAULT_RISK_FREE_RATE
) => {
    if (data.length < 2 || data[0] <= 0) return '0.000'

    const totalReturn = data[data.length - 1] / data[0] - 1
    const periods = data.length - 1
    const annualizedReturn = Math.pow(1 + totalReturn, tradingDays / periods) - 1
    const dailyTarget = riskFreeRate / tradingDays
    const downsideReturns = getDailyReturns(data).filter(ret => ret < dailyTarget)

    if (downsideReturns.length === 0) return '0.000'

    const downsideVariance =
        downsideReturns.reduce((sum, ret) => sum + Math.pow(ret - dailyTarget, 2), 0) /
        downsideReturns.length
    const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(tradingDays)
    const sortino = downsideDeviation === 0 ? 0 : (annualizedReturn - riskFreeRate) / downsideDeviation

    return sortino.toFixed(3)
}

export const calculateProfitLossRatio = (data: number[]) => {
    const returns = getDailyReturns(data)
    const gains = returns.filter(ret => ret > 0)
    const losses = returns.filter(ret => ret < 0)

    if (gains.length === 0 || losses.length === 0) return '0.000'

    const avgGain = gains.reduce((sum, ret) => sum + ret, 0) / gains.length
    const avgLoss = Math.abs(losses.reduce((sum, ret) => sum + ret, 0) / losses.length)

    return avgLoss === 0 ? '0.000' : (avgGain / avgLoss).toFixed(3)
}

export const calculateDrawdownAnalysis = (prices: number[], dates: string[]) => {
    const ddEvents: DrawdownEvent[] = []
    if (prices.length < 2 || dates.length < 2) {
        return { drawdowns: ddEvents, distribution: buildDrawdownDistribution(ddEvents) }
    }

    let peak = prices[0]
    let peakDate = dates[0]
    let currentDdStart = peakDate
    let maxDdInCycle = 0
    let troughDate = peakDate
    let cycleActive = false
    const threshold = 0.00001

    for (let i = 1; i < prices.length; i++) {
        const price = prices[i]

        if (price >= peak) {
            if (cycleActive && Math.abs(maxDdInCycle) > threshold) {
                const startD = new Date(currentDdStart)
                const troughD = new Date(troughDate)
                const endD = new Date(dates[i])

                ddEvents.push({
                    startDate: currentDdStart,
                    troughDate,
                    endDate: dates[i],
                    drawdown: (maxDdInCycle * 100).toFixed(2),
                    rawDd: maxDdInCycle,
                    ddDays: Math.floor((troughD.getTime() - startD.getTime()) / (1000 * 3600 * 24)),
                    fixDays: Math.floor((endD.getTime() - troughD.getTime()) / (1000 * 3600 * 24))
                })
            }

            cycleActive = false
            peak = price
            peakDate = dates[i]
            maxDdInCycle = 0
        } else {
            cycleActive = true
            if (currentDdStart !== peakDate) {
                currentDdStart = peakDate
            }

            const dd = (price - peak) / peak
            if (dd < maxDdInCycle) {
                maxDdInCycle = dd
                troughDate = dates[i]
            }
        }
    }

    if (cycleActive && Math.abs(maxDdInCycle) > threshold) {
        const startD = new Date(currentDdStart)
        const troughD = new Date(troughDate)

        ddEvents.push({
            startDate: currentDdStart,
            troughDate,
            endDate: '未修复',
            drawdown: (maxDdInCycle * 100).toFixed(2),
            rawDd: maxDdInCycle,
            ddDays: Math.floor((troughD.getTime() - startD.getTime()) / (1000 * 3600 * 24)),
            fixDays: '-'
        })
    }

    const drawdowns = [...ddEvents].sort((a, b) => a.rawDd - b.rawDd).slice(0, 10)
    const distribution = buildDrawdownDistribution(ddEvents)

    return { drawdowns, distribution }
}

export const calculateMonthlyReturns = (prices: number[], dates: string[]): MonthlyReturnRow[] => {
    if (prices.length < 2 || dates.length < 2) return []

    const monthReturnsMap: Record<string, number> = {}
    let currentMonth = dates[0].slice(0, 7)
    let currentMonthRet = 1.0

    for (let i = 1; i < dates.length; i++) {
        const ret = prices[i - 1] > 0 ? prices[i] / prices[i - 1] : 1
        const m = dates[i].slice(0, 7)
        if (m !== currentMonth) {
            monthReturnsMap[currentMonth] = (currentMonthRet - 1) * 100
            currentMonth = m
            currentMonthRet = 1.0
        }
        currentMonthRet *= ret
    }
    monthReturnsMap[currentMonth] = (currentMonthRet - 1) * 100

    const yearsObj: Record<number, MonthlyReturnRow> = {}
    Object.keys(monthReturnsMap).forEach(key => {
        const year = parseInt(key.split('-')[0])
        const month = parseInt(key.split('-')[1])
        if (!yearsObj[year]) {
            yearsObj[year] = { year, months: new Array(12).fill(null), total: '0.00' }
        }
        yearsObj[year].months[month - 1] = monthReturnsMap[key].toFixed(2)
    })

    const result = Object.values(yearsObj).sort((a, b) => b.year - a.year)
    result.forEach(row => {
        let yRet = 1.0
        row.months.forEach(monthReturn => {
            if (monthReturn !== null) yRet *= 1 + Number(monthReturn) / 100
        })
        row.total = ((yRet - 1) * 100).toFixed(2)
    })

    return result
}

export const calculateMonthlySummary = (monthlyReturns: MonthlyReturnRow[]): MonthlySummary => {
    const monthValues = monthlyReturns.flatMap(row => row.months).filter((value): value is string => value !== null)
    const profitableMonths = monthValues.filter(value => Number(value) > 0).length
    const totalMonths = monthValues.length
    const winRate = totalMonths > 0 ? ((profitableMonths / totalMonths) * 100).toFixed(1) : '0.0'

    return { profitableMonths, totalMonths, winRate }
}

const buildDrawdownDistribution = (ddEvents: DrawdownEvent[]): DrawdownDistributionItem[] => {
    const eventDepths = ddEvents.map(e => Math.abs(e.rawDd) * 100)
    const maxAbsDd = eventDepths.length > 0 ? Math.max(...eventDepths) : 0

    let step = 2
    if (maxAbsDd > 10 && maxAbsDd <= 30) step = 5
    else if (maxAbsDd > 30) step = 10

    const limits = [step, step * 2, step * 3, step * 4]
    const buckets = [0, 0, 0, 0, 0]
    const totalEvents = eventDepths.length || 1

    eventDepths.forEach(val => {
        if (val < limits[0]) buckets[0]++
        else if (val < limits[1]) buckets[1]++
        else if (val < limits[2]) buckets[2]++
        else if (val < limits[3]) buckets[3]++
        else buckets[4]++
    })

    return [
        { range: `0% ~ ${limits[0]}%`, count: buckets[0], percent: (buckets[0] / totalEvents) * 100 },
        { range: `${limits[0]}% ~ ${limits[1]}%`, count: buckets[1], percent: (buckets[1] / totalEvents) * 100 },
        { range: `${limits[1]}% ~ ${limits[2]}%`, count: buckets[2], percent: (buckets[2] / totalEvents) * 100 },
        { range: `${limits[2]}% ~ ${limits[3]}%`, count: buckets[3], percent: (buckets[3] / totalEvents) * 100 },
        { range: `> ${limits[3]}%`, count: buckets[4], percent: (buckets[4] / totalEvents) * 100 }
    ]
}
