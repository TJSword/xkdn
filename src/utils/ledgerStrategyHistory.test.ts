import assert from 'node:assert/strict'
import { getStrategyNameOnDate } from './ledgerStrategyHistory'

const strategy = {
    name: 'C',
    nameHistory: [
        { oldName: 'A', newName: 'B', effectiveDate: '2026-02-01', changedAtMs: 1, reason: '' },
        { oldName: 'B', newName: 'C', effectiveDate: '2026-03-01', changedAtMs: 2, reason: '' }
    ]
}
assert.equal(getStrategyNameOnDate({ name: '旧策略' }, '2020-01-01'), '旧策略')
assert.equal(getStrategyNameOnDate(strategy, '2026-01-31'), 'A')
assert.equal(getStrategyNameOnDate(strategy, '2026-02-01'), 'B')
assert.equal(getStrategyNameOnDate(strategy, '2026-02-28'), 'B')
assert.equal(getStrategyNameOnDate(strategy, '2026-03-01'), 'C')
assert.equal(getStrategyNameOnDate(strategy, '2026-12-31'), 'C')
const sameDay = { ...strategy, nameHistory: strategy.nameHistory.map(change => ({ ...change, effectiveDate: '2026-02-01' })) }
assert.equal(getStrategyNameOnDate(sameDay, '2026-01-31'), 'A')
assert.equal(getStrategyNameOnDate(sameDay, '2026-02-01'), 'C')
assert.equal(strategy.nameHistory.length, 2)
console.log('Strategy name history date boundaries passed')
