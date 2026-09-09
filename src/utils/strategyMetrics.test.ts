import assert from 'node:assert/strict'
import {
    calculateStats,
    calculateMonthlyReturns,
    calculateSortinoRatio,
    includeInitialReturn
} from './strategyMetrics'

// A four-year investment doubling in value has the same CAGR at either sampling density.
const dates = ['2020-01-01', '2022-01-01', '2024-01-01']
const sparse = calculateStats([100, 120, 200], dates)
assert.equal(sparse.annualizedReturn, '18.92')
assert.equal(calculateStats([100, 200], [dates[0], dates[2]]).annualizedReturn, sparse.annualizedReturn)
assert.equal(calculateStats([1, 1.2, 2], dates).totalReturn, sparse.totalReturn)
assert.equal(calculateStats([100, 120, 200], dates, 244).annualizedReturn, sparse.annualizedReturn)
assert.equal(calculateStats([100, 110], ['2020-01-01', '2020-01-01']).annualizedReturn, '--')

// +10%, -10%: arithmetic mean is zero; sample variance is 0.02.
const risk = calculateStats([100, 110, 99], dates)
assert.equal(risk.volatility, '223.61')
assert.equal(risk.sharpe, '-0.009')
assert.equal(calculateStats([100, 110, 99], dates, 250, 0).sharpe, '0.000')
assert.equal(calculateSortinoRatio([100, 110, 99], 250, 0), '0.000')

// Include a real first-day loss only at inception, without inventing a previous calendar date.
const closes = { dates: ['2020-01-01', '2020-02-01', '2024-01-01'], values: [90, 99, 120] }
const full = includeInitialReturn(closes, -0.1)
assert.deepEqual(full.values, [100, 90, 99, 120])
const fullStats = calculateStats(full.values, full.dates)
assert.equal(fullStats.totalReturn, '20.00')
assert.equal(fullStats.maxDrawdown, '-10.00')
assert.equal(calculateMonthlyReturns(full.values, full.dates).find(row => row.year === 2020)?.months[0], '-10.00')
const monthlyGrowth = calculateMonthlyReturns(full.values, full.dates).reduce(
    (growth, row) => growth * (1 + Number(row.total) / 100), 1
)
assert.ok(Math.abs(monthlyGrowth - 1.2) < 0.0001)
assert.equal(calculateStats(closes.values.slice(1), closes.dates.slice(1)).totalReturn, '21.21')
assert.equal(includeInitialReturn(closes), closes)
assert.equal(includeInitialReturn(closes, 0), closes)
assert.equal(includeInitialReturn(closes, -1), closes)
assert.deepEqual(closes.values, [90, 99, 120], 'source NAV must remain unchanged')

console.log('strategyMetrics tests passed')
