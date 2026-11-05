const assert = require('node:assert/strict')
const test = require('node:test')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')

function loadTs(path) {
    const module = { exports: {} }
    vm.runInNewContext(ts.transpile(fs.readFileSync(path, 'utf8'), {
        target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS
    }), { module, exports: module.exports, require })
    return module.exports
}
const { calculateMonthlyReturns } = loadTs(`${__dirname}/../utils/strategyMetrics.ts`)
const { useMonthlyReturnCalendar } = loadTs(`${__dirname}/../composables/useMonthlyReturnCalendar.ts`)

function createCalendar() {
    const account = { name: '账户整体', points: [
        { date: '2025-12-31', nav: 1 },
        { date: '2026-01-05', nav: 1.1 },
        { date: '2026-01-30', nav: 1.21 },
        { date: '2026-02-02', nav: 1.089 },
        { date: '2026-02-03', nav: 1.21 }
    ] }
    const strategy = { name: '测试策略', points: [
        { date: '2026-02-02', nav: 1 },
        { date: '2026-02-03', nav: 1.02 }
    ] }
    const selectedId = vue.ref('account')
    const selectedSeries = vue.computed(() => selectedId.value === 'account' ? account : strategy)
    const source = fs.readFileSync(`${__dirname}/live-account.vue`, 'utf8')
    const calendarSource = source.slice(source.indexOf('const calendarDates ='), source.indexOf('const visiblePoints ='))
    const context = { ...vue, selectedId, selectedSeries, calculateMonthlyReturns, useMonthlyReturnCalendar }
    vm.createContext(context)
    vm.runInContext(ts.transpile(`${calendarSource}\nglobalThis.calendar = { monthlyRows, openMonthlyCalendar, selectedMonthlyCalendar, liveMonthlyCalendar, previousCalendarMonth, nextCalendarMonth, goToAdjacentCalendarMonth };`, { target: ts.ScriptTarget.ES2020 }), context)
    return { ...context.calendar, selectedId }
}

test('monthly and annual returns compound across month/year boundaries', () => {
    const calendar = createCalendar()
    const row = calendar.monthlyRows.value.find(row => row.year === 2026)
    assert.equal(row.months[0], '21.00')
    assert.equal(row.months[1], '0.00')
    assert.equal(row.months[2], null)
    assert.equal(row.total, '21.00')
    calendar.openMonthlyCalendar(2026, 2, row.months[1])
    const detail = calendar.selectedMonthlyCalendar.value
    assert.ok(Math.abs(detail.cells.find(cell => cell.date === '2026-02-02').returnValue + 10) < 1e-10)
    assert.equal(detail.upDays, 1)
    assert.equal(detail.downDays, 1)
    assert.equal(detail.cells.find(cell => cell.date === '2026-02-01').returnValue, null)
    assert.equal(detail.cells.find(cell => cell.date === '2026-02-01').isTradingDay, false)
    assert.equal(detail.cells.length % 7, 0)
    assert.equal(calendar.previousCalendarMonth.value.month, 1)
    assert.equal(calendar.nextCalendarMonth.value, null)
    calendar.goToAdjacentCalendarMonth(-1)
    assert.equal(calendar.selectedMonthlyCalendar.value.month, 1)
})

test('strategy switching changes the table and closes stale daily detail', async () => {
    const calendar = createCalendar()
    calendar.openMonthlyCalendar(2026, 1, '21.00')
    assert.ok(calendar.liveMonthlyCalendar.value.title.startsWith('账户整体'))
    calendar.selectedId.value = 'strategy'
    await vue.nextTick()
    assert.equal(calendar.selectedMonthlyCalendar.value, null)
    const row = calendar.monthlyRows.value[0]
    assert.equal(row.months[0], null)
    assert.equal(row.months[1], '2.00')
    calendar.openMonthlyCalendar(2026, 2, row.months[1])
    const detail = calendar.selectedMonthlyCalendar.value
    assert.equal(detail.cells.find(cell => cell.date === '2026-02-02').returnValue, null)
    assert.equal(detail.cells.find(cell => cell.date === '2026-02-03').returnLabel, '+2.00%')
    assert.ok(calendar.liveMonthlyCalendar.value.title.startsWith('测试策略'))
})

test('insufficient records do not fabricate a monthly return', () => {
    assert.equal(calculateMonthlyReturns([], []).length, 0)
    assert.equal(calculateMonthlyReturns([1], ['2026-02-02']).length, 0)
})
