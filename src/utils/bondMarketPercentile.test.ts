import assert from 'node:assert/strict'
import { calculateBondMarketPercentile } from './bondMarketPercentile'
import type { BondMarketMetric } from './bondMarketPercentile'

const metrics: BondMarketMetric[] = ['midPrice', 'avgPrice', 'midPremium', 'avgPremium']

for (const metric of metrics) {
    const history = [
        { date: '2026-08-24', [metric]: 110 },
        { date: '2017-12-29', [metric]: 90 },
        { date: '2026-08-25', [metric]: 100 },
        { date: '2026-08-26', [metric]: 1 },
        { date: '2026-08-27', [metric]: 1 }
    ]
    const current = { date: '2026-08-26', [metric]: 100 }
    const result = calculateBondMarketPercentile(history, current, metric)
    assert.ok(result)
    assert.equal(result.percentile, 2 / 3 * 100, `${metric}: includes ties, excludes today and future`)
    assert.equal(result.count, 3)
    assert.equal(result.startDate, '2017-12-29')
    assert.equal(result.endDate, '2026-08-25')
    assert.equal(history[0].date, '2026-08-24', 'does not mutate input history')
    assert.equal(calculateBondMarketPercentile(history, { ...current, [metric]: 80 }, metric)?.percentile, 0)
    assert.equal(calculateBondMarketPercentile(history, { ...current, [metric]: 120 }, metric)?.percentile, 100)
    assert.equal(calculateBondMarketPercentile([], current, metric), null)
    assert.equal(calculateBondMarketPercentile(history, null, metric), null)

    for (const invalidValue of [null, undefined, NaN, Infinity, '', '100']) {
        const invalid = { date: '2018-01-02', [metric]: invalidValue }
        assert.deepEqual(calculateBondMarketPercentile([...history, invalid], current, metric), result)
        assert.equal(calculateBondMarketPercentile(history, { ...current, [metric]: invalidValue }, metric), null)
    }
}

assert.equal(calculateBondMarketPercentile([
    { date: '2026-08-24', midPrice: 0 },
    { date: '2026-08-25', midPrice: -1 }
], { date: '2026-08-26', midPrice: 100 }, 'midPrice'), null)
assert.equal(calculateBondMarketPercentile([
    { date: '2026-08-25', avgPrice: 100 }
], { date: '2026-08-26', avgPrice: 0 }, 'avgPrice'), null)
assert.equal(calculateBondMarketPercentile([
    { date: '2026-08-24', midPremium: -1 },
    { date: '2026-08-25', midPremium: 0 }
], { date: '2026-08-26', midPremium: 0 }, 'midPremium')?.percentile, 100)
assert.equal(calculateBondMarketPercentile([
    { date: '2026-08-26', midPrice: 100 }
], { date: '2026-08-26', midPrice: 100 }, 'midPrice'), null)

console.log('bond market percentile tests passed')
