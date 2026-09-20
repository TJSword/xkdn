import { calculateStats, calculateMonthlyReturns } from './strategyMetrics'

export interface ComparisonSource { dateList: string[]; strategyData: number[] }

// Compare exact shared valuation dates; never fill missing observations with zero returns.
export function alignComparison(sources: Record<string, ComparisonSource>, ids: string[]) {
    const maps = ids.map(id => {
        const source = sources[id]
        const points = new Map<string, number>()
        source?.dateList?.forEach((date, index) => {
            const value = source.strategyData?.[index]
            if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && typeof value === 'number' && Number.isFinite(value) && value > 0) points.set(date, value)
        })
        return points
    })
    const dates = maps.length ? [...maps[0].keys()].filter(date => maps.every(map => map.has(date))).sort() : []
    const series = ids.map((id, index) => {
        const values = dates.map(date => maps[index].get(date) as number)
        const normalized = values.map(value => value / values[0])
        const stats = dates.length >= 2 ? calculateStats(values, dates) : null
        if (stats && stats.volatility === '0.00') stats.sharpe = '--'
        if (stats && stats.maxDrawdown === '0.00') stats.calmar = '--'
        return { id, values: normalized, stats, years: calculateMonthlyReturns(values, dates) }
    })
    return { dates, series }
}
