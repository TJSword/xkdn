export type BondMarketMetric = 'midPrice' | 'avgPrice' | 'midPremium' | 'avgPremium'

type MetricPoint = { date: string } & Partial<Record<BondMarketMetric, number | null>>

export function calculateBondMarketPercentile(
    history: MetricPoint[],
    current: MetricPoint | null,
    metric: BondMarketMetric
) {
    const isPrice = metric === 'midPrice' || metric === 'avgPrice'
    const isValid = (value: unknown): value is number =>
        typeof value === 'number' && Number.isFinite(value) && (!isPrice || value > 0)
    const currentValue = current?.[metric]
    if (!current?.date || !isValid(currentValue)) return null

    // 只比较当前交易日之前的有效收盘样本；零或负溢价率仍是有效值。
    const samples = history
        .filter(row => row.date && row.date < current.date && isValid(row[metric]))
        .sort((left, right) => left.date.localeCompare(right.date))
    if (samples.length === 0) return null

    const notHigherCount = samples.filter(row => {
        const value = row[metric]
        return isValid(value) && value <= currentValue
    }).length
    return {
        percentile: notHigherCount / samples.length * 100,
        count: samples.length,
        startDate: samples[0].date,
        endDate: samples[samples.length - 1].date
    }
}
