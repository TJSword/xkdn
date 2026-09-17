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
console.log('strategyComparison tests passed')
