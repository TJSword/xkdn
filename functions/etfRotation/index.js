const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()
const symbols = ['sz159501','sz159513','sz159632','sz159659','sz159660','sz159696','sz159941','sh513100','sh513110','sh513300','sh513390','sh513870']
const THRESHOLD = 0.5
const INITIAL_HOLDING = '513870'
const collection = 'investment_ledger_accounts'
const id = 'nasdaq-etf-rotation-reference'
const first = r => Array.isArray(r.data) ? r.data[0] : r.data
const publicState = state => ({ holding: state?.holding || '', threshold: THRESHOLD, version: state?.version || 0, previousHolding: state?.previousHolding || '', switchedAt: state?.switchedAt || 0 })

async function evaluate() {
    const ref = db.collection(collection).doc(id)
    const current = first(await ref.get())
    // 同步尚未调仓的旧初始记录；后续调仓记录不重置。
    if (!current?.holding || (current.version === 1 && !current.previousHolding && current.holding !== INITIAL_HOLDING)) {
        let initialized
        await db.runTransaction(async tx => {
            const target = tx.collection(collection).doc(id)
            const state = first(await target.get())
            if (state?.holding && !(state.version === 1 && !state.previousHolding && state.holding !== INITIAL_HOLDING)) { initialized = state; return }
            const now = Date.now()
            initialized = { holding: INITIAL_HOLDING, previousHolding: '', threshold: THRESHOLD, version: (state?.version || 0) + 1, switchedAt: now, checkedAt: now }
            await tx.collection(collection).doc(`nasdaq-etf-rotation-event-${initialized.version}`).set({ from: state?.holding || '', to: INITIAL_HOLDING, at: now, difference: null, initialization: true })
            await target.set(initialized)
        })
        return publicState(initialized)
    }
    if (current?.checkedAt && Date.now() - current.checkedAt < 60000) return publicState(current)
    const now = Date.now()
    const bj = new Date(now + 28800000)
    const minute = bj.getUTCHours() * 60 + bj.getUTCMinutes()
    const inSession = bj.getUTCDay() > 0 && bj.getUTCDay() < 6 && ((minute >= 570 && minute <= 690) || (minute >= 780 && minute <= 900))
    if (current?.holding && !inSession) return publicState(current)
    if (current?.holding && inSession) {
        const date = bj.toISOString().slice(0,10).replace(/-/g,'')
        const response = await fetch(`https://api.apihubs.cn/holiday/get?date=${date}&cn=1`, { signal: AbortSignal.timeout(4000) })
        const calendar = await response.json()
        const day = calendar.data?.list?.[0]
        if (String(day?.date) !== date || day.workday_cn !== '工作日' || day.weekend_cn !== '非周末') return publicState(current)
    }
    const quotes = await Promise.all(symbols.map(async symbol => {
        const response = await fetch(`https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get?param=${symbol},day,,,1,qfq`, { signal: AbortSignal.timeout(8000) })
        if (!response.ok) throw new Error('行情请求失败')
        const data = await response.json()
        const raw = data.data?.[symbol]?.qt?.[symbol]
        if (!raw || raw[2] !== symbol.slice(2) || !/^\d{14}$/.test(raw[30])) throw new Error('行情格式异常')
        const price = Number(raw[3]), iopv = Number(raw[78]), t = raw[30]
        if (!(price > 0 && iopv > 0 && Number.isFinite(price / iopv))) throw new Error('行情缺失')
        return { code: raw[2], premium: (price / iopv - 1) * 100, time: Date.parse(`${t.slice(0,4)}-${t.slice(4,6)}-${t.slice(6,8)}T${t.slice(8,10)}:${t.slice(10,12)}:${t.slice(12,14)}+08:00`) }
    }))
    const lowest = quotes.reduce((a,b) => a.premium <= b.premium ? a : b)
    const times = quotes.map(q => q.time)
    const fresh = times.every(t => Number.isFinite(t) && now - t <= 300000 && t - now <= 60000) && Math.max(...times) - Math.min(...times) <= 90000
    let saved
    await db.runTransaction(async tx => {
        const target = tx.collection(collection).doc(id)
        const state = first(await target.get()) || { holding: '', version: 0 }
        if (state.checkedAt && now - state.checkedAt < 60000) { saved = state; return }
        const held = quotes.find(q => q.code === state.holding)
        const initialize = !state.holding
        const rotate = inSession && fresh && held && held.premium - lowest.premium > THRESHOLD + 1e-10
        saved = { ...state, checkedAt: now, threshold: THRESHOLD }
        delete saved._id
        if (initialize || rotate) {
            saved = { ...saved, holding: initialize ? INITIAL_HOLDING : lowest.code, previousHolding: state.holding, switchedAt: now, version: state.version + 1 }
            await tx.collection(collection).doc(`nasdaq-etf-rotation-event-${saved.version}`).set({ from: state.holding, to: saved.holding, at: now, difference: held ? held.premium - lowest.premium : null, initialization: initialize })
        }
        await target.set(saved)
    })
    return publicState(saved)
}

exports.main = async (event = {}) => {
    try {
        const timer = event.Type === 'Timer'
        if (!timer) {
            const { uid } = app.auth().getUserInfo()
            if (!uid) return { success: false, code: 401, message: '请先登录' }
            if (!first(await db.collection('users').doc(uid).get())) return { success: false, code: 403, message: '无权访问' }
            if (event.action && event.action !== 'get') return { success: false, code: 400, message: '策略参考由固定规则自动更新，不支持手动修改' }
        }
        return { success: true, data: await evaluate() }
    } catch {
        return { success: false, code: 'ETF_ROTATION_ERROR', message: '策略状态暂不可用，未进行参考调仓' }
    }
}
