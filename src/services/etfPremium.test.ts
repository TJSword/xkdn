import assert from 'node:assert/strict'
import { beijingSession, isEtfTradingDay, parseEtfQuote } from './etfPremium'

const raw = Array(82).fill('')
Object.assign(raw, { 1: '纳指ETF', 2: '159659', 3: '2.432', 30: '20260922161424', 57: '24957.1642', 78: '2.2149', 81: '2.2155' })
const quote = parseEtfQuote(raw, '159659')
assert.equal(quote.premium?.toFixed(2), '9.80')
assert.equal(quote.gap?.toFixed(4), '0.2171')
assert.equal(quote.nav, 2.2155)
assert.equal(quote.quoteTime, '2026-09-22 16:14:24')
for (const missing of ['', '-', null, '0', '-1', 'NaN']) {
    const result = parseEtfQuote(Object.assign([...raw], { 78: missing }), '159659')
    assert.equal(result.premium, null)
    assert.equal(result.gap, null)
    assert.equal(result.nav, 2.2155)
}
assert.equal(parseEtfQuote(Object.assign([...raw], { 3: '2', 78: '2' }), '159659').premium, 0)
assert.equal(parseEtfQuote(Object.assign([...raw], { 3: '1', 78: '2' }), '159659').premium, -50)
assert.throws(() => parseEtfQuote(raw, '513100'))
assert.throws(() => parseEtfQuote([], '159659'))
for (const [time, expected] of [
    ['2026-09-22T09:29:00+08:00', false], ['2026-09-22T09:30:00+08:00', true],
    ['2026-09-22T11:30:00+08:00', true], ['2026-09-22T11:31:00+08:00', false],
    ['2026-09-22T12:59:00+08:00', false], ['2026-09-22T13:00:00+08:00', true],
    ['2026-09-22T15:00:00+08:00', true], ['2026-09-22T15:01:00+08:00', false],
    ['2026-09-26T10:00:00+08:00', false]
] as const) assert.equal(beijingSession(new Date(time)).inSession, expected, time)
assert.equal(beijingSession(new Date('2026-09-21T17:00:00Z')).day, '2026-09-22')

async function checkCalendar() {
    const originalFetch = globalThis.fetch
    const signal = new AbortController().signal
    let calls = 0
    try {
        globalThis.fetch = async () => {
            calls++
            return { ok: true, json: async () => ({ data: { list: [{ date: 20261001, workday_cn: '非工作日', weekend_cn: '非周末' }] } }) } as Response
        }
        assert.equal(await isEtfTradingDay('2026-10-01', signal), false)
        assert.equal(await isEtfTradingDay('2026-10-01', signal), false)
        assert.equal(calls, 1)
        await assert.rejects(() => isEtfTradingDay('2026-10-02', signal))
        globalThis.fetch = async () => { throw new Error('offline') }
        await assert.rejects(() => isEtfTradingDay('2026-10-03', signal))
    } finally { globalThis.fetch = originalFetch }
}
checkCalendar().then(() => console.log('ETF premium: quote parsing, missing values, session boundaries and calendar checks passed'))
