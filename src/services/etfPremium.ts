// 2026-09-22 核对沪深场内纳斯达克100 ETF；不包含联接基金和纳指行业指数 ETF。
export const nasdaqEtfs = [
    { symbol: 'sh513100', code: '513100', name: '纳指ETF国泰' },
    { symbol: 'sz159941', code: '159941', name: '纳指ETF广发' },
    { symbol: 'sz159659', code: '159659', name: '纳斯达克100ETF招商' },
    { symbol: 'sz159501', code: '159501', name: '纳指ETF嘉实' },
    { symbol: 'sz159513', code: '159513', name: '纳斯达克100ETF大成' },
    { symbol: 'sz159632', code: '159632', name: '纳斯达克ETF华安' },
    { symbol: 'sz159660', code: '159660', name: '纳指ETF汇添富' },
    { symbol: 'sz159696', code: '159696', name: '纳指ETF易方达' },
    { symbol: 'sh513110', code: '513110', name: '纳指ETF华泰柏瑞' },
    { symbol: 'sh513300', code: '513300', name: '纳斯达克ETF华夏' },
    { symbol: 'sh513390', code: '513390', name: '纳指100ETF博时' },
    { symbol: 'sh513870', code: '513870', name: '纳指ETF富国' }
]

export interface EtfPremiumQuote {
    code: string
    name: string
    price: number | null
    nav: number | null
    iopv: number | null
    premium: number | null
    gap: number | null
    turnover: number | null
    quoteTime: string
}

function numeric(value: unknown): number | null {
    if (typeof value !== 'string' && typeof value !== 'number') return null
    if (String(value).trim() === '') return null
    const result = Number(value)
    return Number.isFinite(result) ? result : null
}

function positive(value: unknown) {
    const result = numeric(value)
    return result !== null && result > 0 ? result : null
}

// 腾讯基金页 bundle.13362df9.js 的 adaptCN 映射：3=dqj、57=cje、78=iopv、81=jz。
export function parseEtfQuote(raw: unknown, code: string): EtfPremiumQuote {
    if (!Array.isArray(raw) || raw[2] !== code || !/^\d{14}$/.test(String(raw[30]))) {
        throw new Error(`${code} 行情格式异常`)
    }
    const price = positive(raw[3])
    const iopv = positive(raw[78])
    const time = String(raw[30])
    return {
        code, name: String(raw[1]), price, nav: positive(raw[81]), iopv,
        premium: price !== null && iopv !== null ? (price / iopv - 1) * 100 : null,
        gap: price !== null && iopv !== null ? price - iopv : null,
        turnover: numeric(raw[57]),
        quoteTime: `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)} ${time.slice(8, 10)}:${time.slice(10, 12)}:${time.slice(12, 14)}`
    }
}

export async function fetchEtfQuote(symbol: string, signal: AbortSignal) {
    const response = await fetch(`https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get?param=${symbol},day,,,1,qfq`, { signal, cache: 'no-store' })
    if (!response.ok) throw new Error(`行情请求失败 (${response.status})`)
    const data = await response.json()
    return parseEtfQuote(data.data?.[symbol]?.qt?.[symbol], symbol.slice(2))
}

export function beijingSession(now = new Date()) {
    const date = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const day = date.toISOString().slice(0, 10)
    const minute = date.getUTCHours() * 60 + date.getUTCMinutes()
    const weekday = date.getUTCDay() > 0 && date.getUTCDay() < 6
    return { day, inSession: weekday && ((minute >= 570 && minute <= 690) || (minute >= 780 && minute <= 900)) }
}

// 沿用 fetchEtfData 的节假日源，周末调休也不轮询；查询失败时不自动请求行情。
let calendarCache: { day: string; trading: boolean } | null = null
export async function isEtfTradingDay(day: string, signal: AbortSignal) {
    if (calendarCache?.day === day) return calendarCache.trading
    const response = await fetch(`https://api.apihubs.cn/holiday/get?date=${day.replace(/-/g, '')}&cn=1`, { signal })
    if (!response.ok) throw new Error('交易日状态暂时无法确认')
    const result = await response.json()
    const info = result.data?.list?.[0]
    if (String(info?.date) !== day.replace(/-/g, '') || !info?.workday_cn || !info?.weekend_cn) throw new Error('交易日状态暂时无法确认')
    const trading = info.workday_cn === '工作日' && info.weekend_cn === '非周末'
    calendarCache = { day, trading }
    return trading
}
