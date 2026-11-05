const assert = require('node:assert/strict')
const test = require('node:test')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync(`${__dirname}/home.vue`, 'utf8')
const refreshSource = source.slice(source.indexOf('  const HOME_REALTIME_REFRESH_DEBOUNCE_MS'), source.indexOf('  const isWelcomeModalVisible'))

function createPage(time, calendar = async () => true) {
    let now = new Date(time).getTime()
    let requests = 0
    let calendarChecks = 0
    let timerId = 0
    const timers = new Map()
    const context = {
        Date: class extends Date {
            constructor(...args) { super(...(args.length ? args : [now])) }
            static now() { return now }
        },
        Intl, AbortController, console,
        ref: value => ({ value }), computed: fn => fn,
        document: { visibilityState: 'visible' },
        window: {
            setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId },
            clearTimeout: id => timers.delete(id)
        },
        sessionStorage: { getItem: () => null, setItem: () => {} },
        // 旧日期、不完整的卡片最容易触发非交易时段的补数据逻辑。
        strategyRealtimeNavs: { value: [{ isLoaded: false, updatedDate: '2026-09-23' }] },
        getMinuteValueFromTime: () => null,
        callCloudFunction: async ({ data }) => {
            if (data?.scope === 'trading-calendar') {
                calendarChecks++
                const date = new Date(now + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
                const isOpen = await calendar(date)
                return { result: { success: true, data: { tradingDay: { date, isOpen } } } }
            }
            requests++
            return { result: { success: true, data: { realtime: {} } } }
        },
        throwIfAuthExpired: () => {}
    }
    for (const name of ['AllWeather', 'Bond', 'HighDividend', 'Rights', 'Momentum', 'MicroCap']) {
        context[`fetch${name}Realtime`] = async () => {}
    }
    vm.createContext(context)
    vm.runInContext(ts.transpile(`${refreshSource}\nglobalThis.onReturn = handleHomeVisibilityChange; globalThis.manual = refreshHomeRealtimeOnReturn;`, {
        target: ts.ScriptTarget.ES2020
    }), context)
    return {
        context,
        get requests() { return requests },
        get calendarChecks() { return calendarChecks },
        setTime: time => { now = new Date(time).getTime() },
        async returnToPage() {
            context.onReturn()
            for (const [id, timer] of timers) {
                if (timer.delay !== 300) continue
                timers.delete(id)
                timer.fn()
            }
            await new Promise(resolve => setImmediate(resolve))
        }
    }
}

test('returning outside trading hours never refreshes stale cards', async () => {
    for (const time of ['2026-09-24T09:15:00+08:00', '2026-09-24T12:00:00+08:00', '2026-09-24T15:00:00+08:00', '2026-09-24T21:00:00+08:00', '2026-09-26T10:00:00+08:00']) {
        const page = createPage(time)
        await page.returnToPage()
        assert.equal(page.requests, 0, time)
        assert.equal(page.calendarChecks, 0, time)
    }
})

test('holidays and calendar failures do not refresh or show refreshing feedback', async () => {
    for (const calendar of [async () => false, async () => { throw new Error('unavailable') }]) {
        const page = createPage('2026-10-02T10:00:00+08:00', calendar)
        await page.returnToPage()
        assert.equal(page.calendarChecks, 1)
        assert.equal(page.requests, 0)
        assert.equal(vm.runInContext('homeRealtimeRefreshState.value', page.context), 'idle')
    }
})

test('trading sessions refresh and retain the one-minute throttle', async () => {
    for (const time of ['2026-09-24T09:30:00+08:00', '2026-09-24T13:00:00+08:00']) {
        const page = createPage(time)
        await page.returnToPage()
        assert.equal(page.requests, 1)
        await page.returnToPage()
        assert.equal(page.requests, 1)
        assert.equal(page.calendarChecks, 1)
        page.setTime(new Date(new Date(time).getTime() + 60000).toISOString())
        await page.returnToPage()
        assert.equal(page.requests, 2)
    }
})

test('calendar lookup is deduplicated and visibility/time are rechecked afterwards', async () => {
    for (const change of [
        page => { page.context.document.visibilityState = 'hidden' },
        page => page.setTime('2026-09-24T15:00:00+08:00'),
        page => page.setTime('2026-09-25T10:00:00+08:00')
    ]) {
        let resolveCalendar
        const page = createPage('2026-09-24T14:59:00+08:00', () => new Promise(resolve => { resolveCalendar = resolve }))
        await page.returnToPage()
        await page.returnToPage()
        assert.equal(page.calendarChecks, 1)
        change(page)
        resolveCalendar(true)
        await new Promise(resolve => setImmediate(resolve))
        assert.equal(page.requests, 0)
    }
})

test('manual refresh keeps the existing after-close catch-up behavior', async () => {
    const page = createPage('2026-09-24T16:00:00+08:00')
    page.context.manual()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(page.requests, 1)
    assert.equal(page.calendarChecks, 0)
})

test('initial dashboard calendar is reused on October 8 without another calendar request', async () => {
    const page = createPage('2026-10-08T10:00:00+08:00')
    vm.runInContext("applyHomeTradingDay({ date: '2026-10-08', isOpen: true })", page.context)
    await page.returnToPage()
    assert.equal(page.requests, 1)
    assert.equal(page.calendarChecks, 0)
    page.setTime('2026-10-08T10:02:00+08:00')
    await page.returnToPage()
    assert.equal(page.requests, 2)
    assert.equal(page.calendarChecks, 0)
    page.setTime('2026-10-09T10:00:00+08:00')
    await page.returnToPage()
    assert.equal(page.requests, 3)
    assert.equal(page.calendarChecks, 1)
})

test('cached holiday blocks refresh and missing calendar stays unknown and retries', async () => {
    const holiday = createPage('2026-10-01T10:00:00+08:00')
    vm.runInContext("applyHomeTradingDay({ date: '2026-10-01', isOpen: false })", holiday.context)
    await holiday.returnToPage()
    assert.equal(holiday.requests, 0)
    assert.equal(holiday.calendarChecks, 0)

    let available = false
    const page = createPage('2026-10-08T10:00:00+08:00', async () => available ? true : null)
    await page.returnToPage()
    assert.equal(page.requests, 0)
    available = true
    await page.returnToPage()
    assert.equal(page.requests, 1)
    assert.equal(page.calendarChecks, 2)
})
