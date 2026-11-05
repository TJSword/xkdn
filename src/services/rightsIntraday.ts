export interface MinutePrice { time: string; price: number }
export interface ComparisonPoint { time: string; ratio: number | null }

export function formatComparisonValue(value: unknown) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '暂无数据'
    return `${value > 0 ? '+' : ''}${value.toFixed(3)}%`
}

export const tradingMinutes = Array.from({ length: 242 }, (_, index) => {
    const minute = index <= 120 ? 570 + index : 780 + index - 121
    return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
})

export function startForegroundRefresh(refresh: () => void) {
    let timer: ReturnType<typeof setInterval> | undefined
    let lastRefresh = Date.now()
    const tick = () => {
        if (document.visibilityState !== 'visible' || !document.hasFocus()) return
        if (Date.now() - lastRefresh < 60000) return
        lastRefresh = Date.now()
        refresh()
    }
    const sync = () => {
        clearInterval(timer)
        timer = undefined
        if (document.visibilityState === 'visible' && document.hasFocus()) {
            tick()
            timer = setInterval(tick, 60000)
        }
    }
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    window.addEventListener('blur', sync)
    sync()
    return () => {
        clearInterval(timer)
        document.removeEventListener('visibilitychange', sync)
        window.removeEventListener('focus', sync)
        window.removeEventListener('blur', sync)
    }
}

export interface ComparisonContext {
    tradeDate: string
    isTradingDay: boolean
    holdings: Array<{ stockCode: string; recordDate: string; currentRank: number | null }>
}

export function suggestComparisonPairs(
    rows: Array<{ stockCode: string; currentRank?: number | null; isHolding: boolean; recordDate?: string }>,
    context: ComparisonContext | null
) {
    if (!context?.isTradingDay) return []
    const { tradeDate, holdings } = context
    const thursday = new Date(tradeDate + 'T12:00:00+08:00').getUTCDay() === 4
    const expired = (row: { recordDate?: string }) => Boolean(row.recordDate && row.recordDate <= tradeDate)
    const heldCodes = new Set(holdings.map(row => row.stockCode))
    const buys = rows.filter(row => typeof row.currentRank === 'number' && row.currentRank > 0 &&
        !heldCodes.has(row.stockCode) && !expired(row) && (!thursday || row.currentRank <= 5))
        .sort((a, b) => Number(a.currentRank) - Number(b.currentRank))
    const sells = holdings.filter(row => expired(row) || (thursday && (row.currentRank === null || row.currentRank > 5)))
        .sort((a, b) => Number(expired(b)) - Number(expired(a)) || (b.currentRank ?? Infinity) - (a.currentRank ?? Infinity) || a.stockCode.localeCompare(b.stockCode))
    return buys.slice(0, sells.length).map((buy, index) => ({ sell: sells[index].stockCode, buy: buy.stockCode }))
}

export function parseMinutes(rows: unknown, date: string): MinutePrice[] {
    const prices = new Map<string, number>()
    if (!Array.isArray(rows)) return []
    for (const row of rows) {
        if (!Array.isArray(row)) continue
        const stamp = String(row[0] || '')
        const price = Number(row[2])
        const time = `${stamp.slice(8, 10)}:${stamp.slice(10, 12)}`
        if (!/^\d{12}$/.test(stamp) || stamp.slice(0, 8) !== date.replace(/-/g, '')) continue
        if (!((time >= '09:30' && time <= '11:30') || (time >= '13:00' && time <= '15:00'))) continue
        if (Number.isFinite(price) && price > 0) prices.set(time, price)
    }
    return [...prices].sort(([a], [b]) => a.localeCompare(b)).map(([time, price]) => ({ time, price }))
}

export async function fetchMinutes(code: string, date: string, signal: AbortSignal) {
    if (!/^[036]\d{5}$/.test(code)) throw new Error('暂不支持该股票代码')
    const symbol = `${code.startsWith('6') ? 'sh' : 'sz'}${code}`
    const response = await fetch(`https://proxy.finance.qq.com/ifzqgtimg/appstock/app/kline/mkline?param=${symbol},m1,,320`, { signal, cache: 'no-store' })
    if (!response.ok) throw new Error(`分时行情请求失败 (${response.status})`)
    const body = await response.json()
    const minutes = parseMinutes(body.data?.[symbol]?.m1, date)
    if (!minutes.length) throw new Error(`${code} 暂无 ${date} 的有效分时行情`)
    return minutes
}

export function compareMinutes(sell: MinutePrice[], buy: MinutePrice[]): ComparisonPoint[] {
    const sells = new Map(sell.map(p => [p.time, p.price]))
    const buys = new Map(buy.map(p => [p.time, p.price]))
    const times = [...new Set([...sells.keys(), ...buys.keys()])].sort()
    const baseline = times.find(time => sells.has(time) && buys.has(time))
    if (!baseline) return []
    const sellBase = sells.get(baseline)
    const buyBase = buys.get(baseline)
    if (sellBase === undefined || buyBase === undefined) return []
    return times.filter(time => time >= baseline).map(time => {
        const s = sells.get(time)
        const b = buys.get(time)
        if (s === undefined || b === undefined) return { time, ratio: null }
        const sellIndex = s / sellBase
        const buyIndex = b / buyBase
        return { time, ratio: (buyIndex / sellIndex - 1) * 100 }
    })
}
