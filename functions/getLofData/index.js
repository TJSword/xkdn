'use strict'

const tcb = require('@cloudbase/node-sdk')

const app = tcb.init()
const auth = app.auth()
const db = app.database()

const COLLECTION = process.env.LOF_COLLECTION || 'lofSnapshots'
const LATEST_DOC_ID = 'latest'
const marketDayCache = {
    date: '',
    isTradingDay: null
}

function isTimerEvent(event = {}) {
    return event.Type === 'Timer' || event.type === 'timer' || event.TriggerName || event.triggerName
}

function shouldRefresh(event = {}) {
    return event.forceRefresh === true || event.action === 'refresh' || isTimerEvent(event)
}

function getShanghaiParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Shanghai',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(date)

    return Object.fromEntries(parts.map(part => [part.type, part.value]))
}

function getShanghaiDateString(date = new Date()) {
    const parts = getShanghaiParts(date)
    return `${parts.year}-${parts.month}-${parts.day}`
}

function isLofTradingRefreshWindow(date = new Date()) {
    const parts = getShanghaiParts(date)
    const weekday = parts.weekday
    if (weekday === 'Sat' || weekday === 'Sun') return false

    const hour = Number(parts.hour)
    const minute = Number(parts.minute)

    const inMorning = (hour === 9 && minute >= 30) || hour === 10 || (hour === 11 && minute < 30)
    const inAfternoon = hour === 13 || hour === 14

    return inMorning || inAfternoon
}

function isClosedByEnv(dateString) {
    const closedDates = (process.env.LOF_CLOSED_DATES || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)

    return closedDates.includes(dateString)
}

async function isChinaTradingDay(date = new Date()) {
    const dateString = getShanghaiDateString(date)
    if (marketDayCache.date === dateString && marketDayCache.isTradingDay !== null) {
        return marketDayCache.isTradingDay
    }

    if (isClosedByEnv(dateString)) {
        marketDayCache.date = dateString
        marketDayCache.isTradingDay = false
        return false
    }

    const compactDate = dateString.replace(/-/g, '')
    const url = `https://api.apihubs.cn/holiday/get?date=${compactDate}&cn=1`

    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
        if (!res.ok) throw new Error(`holiday api HTTP ${res.status}`)

        const json = await res.json()
        const info = json && json.data && Array.isArray(json.data.list) ? json.data.list[0] : null
        if (!info) throw new Error('holiday api empty data')

        const isTradingDay = info.workday_cn === '工作日' && info.weekend_cn === '非周末'
        marketDayCache.date = dateString
        marketDayCache.isTradingDay = isTradingDay
        return isTradingDay
    } catch (error) {
        console.warn('交易日判断接口失败，将退回到工作日判断:', error.message)
        const parts = getShanghaiParts(date)
        const fallback = parts.weekday !== 'Sat' && parts.weekday !== 'Sun'
        marketDayCache.date = dateString
        marketDayCache.isTradingDay = fallback
        return fallback
    }
}

async function isAdminRequest(event = {}) {
    if (isTimerEvent(event)) return true

    const userInfo = auth.getUserInfo()
    const uid = userInfo && userInfo.uid
    if (!uid) return false

    const result = await db.collection('users').doc(uid).get()
    const user = result.data && result.data[0]
    return user && user.admin === true
}

async function getLatestSnapshot() {
    try {
        const result = await db.collection(COLLECTION).doc(LATEST_DOC_ID).get()
        return result.data && result.data[0] ? result.data[0] : null
    } catch (error) {
        if (/not exist|not found|doesn't exist/i.test(error.message || '')) return null
        throw error
    }
}

async function saveLatestSnapshot(snapshot) {
    const data = {
        ok: snapshot.ok === true,
        rows: Array.isArray(snapshot.rows) ? snapshot.rows : [],
        columns: Array.isArray(snapshot.columns) ? snapshot.columns : [],
        sources: Array.isArray(snapshot.sources) ? snapshot.sources : [],
        warnings: Array.isArray(snapshot.warnings) ? snapshot.warnings : [],
        refreshedAt: snapshot.refreshedAt || new Date().toISOString(),
        error: snapshot.error || null,
        updatedAt: db.serverDate()
    }

    await db.collection(COLLECTION).doc(LATEST_DOC_ID).set(data)
    return data
}

exports.main = async (event = {}, context) => {
    const wantsRefresh = shouldRefresh(event)

    try {
        if (isTimerEvent(event) && !isLofTradingRefreshWindow()) {
            return {
                success: true,
                skipped: true,
                message: '当前不在 LOF 定时刷新时段，已跳过抓取。'
            }
        }

        if (isTimerEvent(event) && !(await isChinaTradingDay())) {
            return {
                success: true,
                skipped: true,
                message: '当前不是 A 股交易日，已跳过 LOF 定时抓取。'
            }
        }

        if (!wantsRefresh) {
            const latest = await getLatestSnapshot()
            if (!latest) {
                return {
                    success: false,
                    message: 'LOF 数据快照尚未初始化，请先由管理员手动刷新一次或配置定时任务。',
                    data: null
                }
            }

            return {
                success: true,
                fromDatabase: true,
                data: latest
            }
        }

        const allowed = await isAdminRequest(event)
        if (!allowed) {
            return {
                success: false,
                message: '当前账号无权刷新 LOF 数据。'
            }
        }

        const [{ refreshData }, previous] = await Promise.all([
            Promise.resolve(require('./lof-core')),
            getLatestSnapshot()
        ])
        const snapshot = await refreshData()

        if (snapshot.ok && Array.isArray(snapshot.rows) && snapshot.rows.length > 0) {
            const saved = await saveLatestSnapshot(snapshot)
            return {
                success: true,
                refreshed: true,
                data: saved
            }
        }

        return {
            success: !!previous,
            refreshed: false,
            message: snapshot.error || 'LOF 数据刷新失败，已保留上一份可用快照。',
            data: previous || snapshot
        }
    } catch (error) {
        console.error('getLofData failed:', error)
        const previous = await getLatestSnapshot().catch(() => null)
        return {
            success: !!previous,
            message: error.message || 'LOF 数据服务异常',
            data: previous
        }
    }
}
