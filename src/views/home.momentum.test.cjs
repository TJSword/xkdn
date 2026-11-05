const assert = require('node:assert/strict')
const test = require('node:test')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

test('momentum displays a zero baseline before the first real point without changing raw data', async () => {
    const source = fs.readFileSync(`${__dirname}/home.vue`, 'utf8')
    const fetchSource = source.slice(source.indexOf('  const fetchMomentumRealtime ='), source.indexOf('  const fetchMicroCapRealtime ='))
    const chartSource = source.slice(source.indexOf('  const clampNumber ='), source.indexOf('  const handleRealtimeChartHover ='))
    const item = { id: 'momentum', isLoaded: true, baseAmount: 100, updatedMinute: '10:24', intraday: [100, 101], intradayTimes: ['09:30', '09:31'], trend: [100, 101] }
    const context = {
        strategyRealtimeNavs: { value: [item] },
        buildAssetReturnMap: () => ({}),
        normalizeRealtimeDisplayMinute: value => value,
        getRealtimePayloadDate: payload => payload.tradeDate,
        toRealtimePercent: value => value * 100,
        throwIfAuthExpired: error => { throw error }, console,
        MORNING_START_MINUTE: 570, MORNING_END_MINUTE: 690,
        AFTERNOON_START_MINUTE: 780, AFTERNOON_END_MINUTE: 900, TRADING_MINUTES_PER_DAY: 240
    }
    vm.createContext(context)
    vm.runInContext(ts.transpile(`${fetchSource}\n${chartSource}\nglobalThis.fetch = fetchMomentumRealtime; globalThis.series = getMomentumChartSeries; globalThis.scale = getLargeChartScaleValues; globalThis.nearest = findNearestRealtimePoint;`, {
        target: ts.ScriptTarget.ES2020
    }), context)
    const payload = { tradeDate: '2026-09-30', intraday: [], dailyReturn: 0 }
    await context.fetch(payload)
    assert.equal(item.intraday.length, 0)
    assert.equal(item.intradayTimes.length, 0)
    assert.equal(JSON.stringify(context.series(item)), JSON.stringify({ values: [100, 100], times: ['09:30', '10:24'] }))
    assert.ok(context.scale(item)[0] < 100 && context.scale(item)[1] > 100)
    assert.equal(context.nearest(item, 0), null)
    payload.intraday.push({ time: '10:31', strategyAmount: 101 })
    await context.fetch(payload)
    assert.equal(JSON.stringify(context.series(item)), JSON.stringify({ values: [100, 100, 101], times: ['09:30', '10:30', '10:31'] }))
    assert.equal(item.intraday.length, 1)
    assert.equal(context.nearest(item, 61 / 240).value, 101)
    payload.intraday.push({ time: '10:32', strategyAmount: 102 })
    await context.fetch(payload)
    assert.equal(context.series(item).values.at(-1), 102)
    assert.equal(item.intraday.length, 2)
    assert.equal(context.series({ ...item, id: 'convertible', intraday: [] }), null)
})
