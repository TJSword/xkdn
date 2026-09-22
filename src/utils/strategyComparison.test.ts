import assert from 'node:assert/strict'
import { alignComparison } from './strategyComparison'

const sources = {
    a: { dateList: ['2024-01-03', '2024-01-01', '2024-01-02', '2024-01-04'], strategyData: [120, 100, 110, 0] },
    b: { dateList: ['2024-01-02', '2024-01-03', '2024-01-04'], strategyData: [200, 180, 190] }
}
const result = alignComparison(sources, ['a', 'b'])
assert.deepEqual(result.dates, ['2024-01-02', '2024-01-03'])
assert.deepEqual(result.series[0].values, [1, 120 / 110])
assert.equal(result.series[1].stats?.totalReturn, '-10.00')
assert.equal(result.series[1].stats?.maxDrawdown, '-10.00')
assert.equal(result.series[0].stats?.calmar, '--')
assert.deepEqual(alignComparison(sources, ['a', 'missing']).dates, [])
assert.deepEqual(alignComparison(sources, []).series, [])
assert.equal(alignComparison({ a: { dateList: ['2024-01-01'], strategyData: [100] } }, ['a']).series[0].stats, null)
const rangedSources = {
    a: { dateList: ['2023-12-29', '2024-01-02', '2024-01-03', '2024-01-05'], strategyData: [200, 100, 110, 121] },
    b: { dateList: ['2023-12-29', '2024-01-02', '2024-01-05'], strategyData: [300, 200, 180] }
}
const ranged = alignComparison(rangedSources, ['a', 'b'], { start: '2024-01-01', end: '2024-01-06' })
assert.deepEqual(ranged.dates, ['2024-01-02', '2024-01-05'])
assert.deepEqual(ranged.series[0].values, [1, 1.21])
assert.equal(ranged.series[0].stats?.totalReturn, '21.00')
assert.equal(ranged.series[0].stats?.maxDrawdown, '0.00')
assert.equal(ranged.series[1].stats?.maxDrawdown, '-10.00')
assert.deepEqual(ranged.series[0].years.map(row => row.year), [2024])
assert.equal(Number(ranged.series[0].years[0].total), 21)
assert.equal(alignComparison(rangedSources, ['a', 'b'], { start: '2024-01-02', end: '2024-01-02' }).series[0].stats, null)
assert.deepEqual(alignComparison(rangedSources, ['a', 'b'], { start: '2024-01-06', end: '2024-01-07' }).dates, [])
console.log('strategyComparison tests passed')
