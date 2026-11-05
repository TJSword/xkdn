import assert from 'node:assert/strict'
import { compareMinutes, parseMinutes, suggestComparisonPairs, tradingMinutes, startForegroundRefresh, formatComparisonValue } from './rightsIntraday'

const rows = [
    ['202609230931', '', '9'], ['202609240931', '', '10'],
    ['202609241200', '', '11'], ['202609240932', '', '0'],
    ['202609240933', '', 'NaN'], ['202609240934', '', '12']
]
assert.deepEqual(parseMinutes(rows, '2026-09-24'), [{ time: '09:31', price: 10 }, { time: '09:34', price: 12 }])
const result = compareMinutes(
    [{ time: '09:30', price: 99 }, { time: '09:31', price: 100 }, { time: '09:32', price: 102 }, { time: '09:33', price: 104 }],
    [{ time: '09:31', price: 200 }, { time: '09:32', price: 198 }, { time: '09:34', price: 202 }]
)
assert.equal(result[0].time, '09:31')
assert.equal(result[0].ratio, 0)
assert.ok(Math.abs(Number(result[1].ratio) - (-2.941176470588235)) < 1e-10)
assert.equal(result[2].ratio, null)
assert.deepEqual(compareMinutes([{ time: '09:31', price: 1 }], [{ time: '09:32', price: 2 }]), [])
assert.deepEqual(compareMinutes([], []), [])
console.log('PASS: date filtering, invalid prices, common baseline, ratio, missing minutes and empty series')

const rankings = [
    { stockCode: 'a', currentRank: 1, isHolding: true },
    { stockCode: 'b', currentRank: 2, isHolding: false },
    { stockCode: 'c', currentRank: 4, isHolding: false },
    { stockCode: 'd', currentRank: 6, isHolding: true },
    { stockCode: 'e', currentRank: 9, isHolding: true },
    { stockCode: 'f', currentRank: 10, isHolding: false }
]
const holdings = [
    { stockCode: 'a', recordDate: '', currentRank: 1 },
    { stockCode: 'd', recordDate: '', currentRank: 6 },
    { stockCode: 'e', recordDate: '', currentRank: 9 }
]
const thursday = { tradeDate: '2026-09-24', isTradingDay: true, holdings }
assert.deepEqual(suggestComparisonPairs(rankings, thursday), [{ sell: 'e', buy: 'b' }, { sell: 'd', buy: 'c' }])
const friday = { ...thursday, tradeDate: '2026-09-25' }
assert.deepEqual(suggestComparisonPairs(rankings, friday), [])
const expiryHoldings = holdings.map(row => ({ ...row, recordDate: row.stockCode === 'a' ? '2026-09-25' : '' }))
assert.deepEqual(suggestComparisonPairs(rankings, { ...friday, holdings: expiryHoldings }), [{ sell: 'a', buy: 'b' }])
assert.deepEqual(suggestComparisonPairs(rankings, { ...friday, holdings: holdings.map(row => ({ ...row, recordDate: '2026-09-25' })) }), [{ sell: 'e', buy: 'b' }, { sell: 'd', buy: 'c' }, { sell: 'a', buy: 'f' }])
assert.deepEqual(suggestComparisonPairs(rankings, { ...thursday, holdings: [{ stockCode: 'outside', currentRank: null, recordDate: '2026-09-24' }, ...holdings] }), [{ sell: 'outside', buy: 'b' }, { sell: 'e', buy: 'c' }])
assert.deepEqual(suggestComparisonPairs(rankings.map(row => ({ ...row, recordDate: '2026-09-24' })), thursday), [])
assert.deepEqual(suggestComparisonPairs(rankings, { ...thursday, isTradingDay: false }), [])
assert.deepEqual(suggestComparisonPairs(rankings, null), [])
assert.deepEqual(suggestComparisonPairs([], thursday), [])
console.log('PASS: Thursday ranking, ordinary-day no rotation, record-date exits including top-ranked holdings, multiple exits, outside holdings and non-trading days')

assert.equal(tradingMinutes.length, 242)
assert.equal(tradingMinutes[0], '09:30')
assert.equal(tradingMinutes[120], '11:30')
assert.equal(tradingMinutes[121], '13:00')
assert.equal(tradingMinutes[241], '15:00')
assert.equal(tradingMinutes.includes('12:00'), false)

const originals = { document: globalThis.document, window: globalThis.window, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval, now: Date.now }
let now = 0
let focused = true
let ticks = 0
let callback: (() => void) | undefined
const listeners = new Map<string, () => void>()
const events = { addEventListener: (name: string, fn: () => void) => listeners.set(name, fn), removeEventListener: (name: string) => listeners.delete(name) }
try {
    Object.assign(globalThis, {
        document: { ...events, visibilityState: 'visible', hasFocus: () => focused },
        window: events,
        setInterval: (fn: () => void) => { callback = fn; return 1 },
        clearInterval: () => { callback = undefined }
    })
    Date.now = () => now
    const stop = startForegroundRefresh(() => ticks++)
    assert.equal(ticks, 0)
    now = 60000; callback?.(); assert.equal(ticks, 1)
    focused = false; listeners.get('blur')?.(); assert.equal(callback, undefined)
    now = 180000; assert.equal(ticks, 1)
    focused = true; listeners.get('focus')?.(); assert.equal(ticks, 2)
    Object.assign(document, { visibilityState: 'hidden' }); listeners.get('visibilitychange')?.()
    assert.equal(callback, undefined)
    now = 240000
    Object.assign(document, { visibilityState: 'visible' }); listeners.get('visibilitychange')?.()
    assert.equal(ticks, 3)
    stop(); assert.equal(callback, undefined); assert.equal(listeners.size, 0)
} finally {
    Object.assign(globalThis, { document: originals.document, window: originals.window, setInterval: originals.setInterval, clearInterval: originals.clearInterval })
    Date.now = originals.now
}
console.log('PASS: full trading-day axis, foreground minute refresh, background pause, resume and cleanup')

for (const value of [undefined, null, NaN, Infinity, '-', '', []]) assert.equal(formatComparisonValue(value), '暂无数据')
assert.equal(formatComparisonValue(0), '0.000%')
assert.equal(formatComparisonValue(1.23456), '+1.235%')
assert.equal(formatComparisonValue(-1.23456), '-1.235%')
console.log('PASS: tooltip handles empty future slots, missing bridge values and numeric values without throwing')
