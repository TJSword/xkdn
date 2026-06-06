'use strict'

const tcb = require('@cloudbase/node-sdk')

const app = tcb.init()
const auth = app.auth()
const db = app.database()

const COLLECTION = process.env.RIGHTS_STRATEGY_COLLECTION || 'rightsStrategySnapshots'
const LATEST_DOC_ID = 'latest'
const JISILU_PRE_URL = 'https://www.jisilu.cn/webapi/cb/pre/?history=N'
const TENCENT_QUOTE_URL = 'https://qt.gtimg.cn/q='
const BATCH_SIZE = 60
const PORTFOLIO_SIZE = 5

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

function isTradingDayRefreshWindow(date = new Date()) {
    const parts = getShanghaiParts(date)
    const minute = Number(parts.minute)
    return !['Sat', 'Sun'].includes(parts.weekday) && Number(parts.hour) === 14 && minute >= 40 && minute <= 44
}

function getTimerDate(event = {}) {
    const rawTime = event.Time || event.time || event.triggerTime
    const date = rawTime ? new Date(rawTime) : new Date()
    return Number.isNaN(date.getTime()) ? new Date() : date
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

function isMissingResourceError(error) {
    return /not exist|not found|doesn't exist|collection.*不存在/i.test(error.message || '')
}

async function getSnapshot(documentId) {
    try {
        const result = await db.collection(COLLECTION).doc(documentId).get()
        return result.data && result.data[0] ? result.data[0] : null
    } catch (error) {
        if (isMissingResourceError(error)) return null
        throw error
    }
}

function getDailyDocumentId(tradeDate) {
    return `daily_${String(tradeDate).replace(/\D/g, '')}`
}

async function getLatestSnapshot() {
    return getSnapshot(LATEST_DOC_ID)
}

async function getDailySnapshot(tradeDate) {
    return getSnapshot(getDailyDocumentId(tradeDate))
}

function normalizePortfolio(rows) {
    return Array.isArray(rows) ? rows.slice(0, PORTFOLIO_SIZE) : []
}

function buildStoredSnapshot(snapshot) {
    return {
        ok: snapshot.ok === true,
        tradeDate: snapshot.tradeDate,
        quoteDate: snapshot.quoteDate || snapshot.tradeDate,
        portfolio: normalizePortfolio(snapshot.portfolio),
        rows: normalizePortfolio(snapshot.portfolio),
        candidates: Array.isArray(snapshot.candidates) ? snapshot.candidates : [],
        adjustments: snapshot.adjustments || { buys: [], sells: [], unchanged: [] },
        changed: snapshot.changed === true,
        previousTradeDate: snapshot.previousTradeDate || '',
        previousPortfolio: normalizePortfolio(snapshot.previousPortfolio),
        rawCount: snapshot.rawCount || 0,
        eligibleCount: snapshot.eligibleCount || 0,
        filteredExchangeBondCount: snapshot.filteredExchangeBondCount || 0,
        quoteMissCount: snapshot.quoteMissCount || 0,
        sources: Array.isArray(snapshot.sources) ? snapshot.sources : [],
        warnings: Array.isArray(snapshot.warnings) ? snapshot.warnings : [],
        refreshedAt: snapshot.refreshedAt || new Date().toISOString(),
        error: snapshot.error || null,
        updatedAt: db.serverDate()
    }
}

async function saveSnapshot(snapshot) {
    const data = buildStoredSnapshot(snapshot)
    await db.collection(COLLECTION).doc(getDailyDocumentId(snapshot.tradeDate)).set(data)
    await db.collection(COLLECTION).doc(LATEST_DOC_ID).set(data)
    return data
}

function toNumber(value) {
    if (value === null || value === undefined || value === '') return null
    const number = Number(value)
    return Number.isFinite(number) ? number : null
}

function normalizeStockCode(code) {
    return String(code || '').replace(/\D/g, '').padStart(6, '0').slice(-6)
}

function toTencentSymbol(code) {
    const normalized = normalizeStockCode(code)
    return `${normalized.startsWith('6') ? 'sh' : 'sz'}${normalized}`
}

function normalizeDate(value) {
    const match = String(value || '').match(/(\d{4})[-/]?(\d{2})[-/]?(\d{2})/)
    return match ? `${match[1]}-${match[2]}-${match[3]}` : ''
}

function isExchangeBond(item) {
    const text = `${item.cb_type || ''} ${item.bond_nm || ''} ${item.progress_full || ''}`
    return /可交换债|交换债/.test(text)
}

function hasReachedCommitteeApproval(item) {
    const text = `${item.progress_nm || ''} ${item.progress_full || ''}`
    return /上市委通过/.test(text)
}

function hasReachedRecordDate(item, tradeDate) {
    const recordDate = normalizeDate(item.record_dt)
    return Boolean(recordDate && recordDate <= tradeDate)
}

async function fetchJisiluPreData() {
    const response = await fetch(JISILU_PRE_URL, {
        headers: {
            accept: 'application/json,text/plain,*/*',
            referer: 'https://www.jisilu.cn/',
            connection: 'close',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) throw new Error(`集思录接口 HTTP ${response.status}`)
    const json = await response.json()
    if (json.code !== 200 || !Array.isArray(json.data)) {
        throw new Error(json.msg || '集思录待发转债接口返回格式异常')
    }
    return json.data
}

function parseTencentQuoteLine(line) {
    const match = line.match(/v_(?:sh|sz)(\d{6})="(.*)";?/)
    if (!match) return null

    const parts = match[2].split('~')
    const code = normalizeStockCode(parts[2] || match[1])
    const latestPrice = toNumber(parts[3])
    const circulatingMarketValueYi = toNumber(parts[44])
    const totalMarketValueYi = toNumber(parts[45])
    const circulatingShares = toNumber(parts[72])
    let totalShares = toNumber(parts[73])

    if ((!totalShares || totalShares <= 0) && latestPrice && totalMarketValueYi) {
        totalShares = (totalMarketValueYi * 100000000) / latestPrice
    }

    return {
        code,
        name: parts[1] || '',
        latestPrice,
        changePct: toNumber(parts[32]),
        quoteTime: parts[30] || '',
        quoteDate: normalizeDate(parts[30]),
        totalMarketValue: totalMarketValueYi ? totalMarketValueYi * 100000000 : null,
        totalShares,
        circulatingMarketValue: circulatingMarketValueYi ? circulatingMarketValueYi * 100000000 : null,
        circulatingShares
    }
}

async function fetchTencentQuotes(codes) {
    const uniqueCodes = [...new Set(codes.map(normalizeStockCode).filter(code => /^\d{6}$/.test(code)))]
    const quoteMap = new Map()

    for (let i = 0; i < uniqueCodes.length; i += BATCH_SIZE) {
        const batch = uniqueCodes.slice(i, i + BATCH_SIZE)
        const symbols = batch.map(toTencentSymbol).join(',')
        const response = await fetch(`${TENCENT_QUOTE_URL}${symbols}`, {
            headers: {
                accept: 'text/plain,*/*',
                referer: 'https://gu.qq.com/',
                connection: 'close',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(15000)
        })

        if (!response.ok) throw new Error(`腾讯行情接口 HTTP ${response.status}`)
        const buffer = await response.arrayBuffer()
        const text = new TextDecoder('gbk').decode(buffer)

        text.split(/\r?\n/).forEach(line => {
            const quote = parseTencentQuoteLine(line.trim())
            if (quote) quoteMap.set(quote.code, quote)
        })
    }

    return quoteMap
}

function buildCandidates(rawRows, quoteMap, tradeDate) {
    return rawRows
        .filter(item => !isExchangeBond(item))
        .filter(hasReachedCommitteeApproval)
        .filter(item => !hasReachedRecordDate(item, tradeDate))
        .map(item => {
            const stockCode = normalizeStockCode(item.stock_id)
            const quote = quoteMap.get(stockCode) || {}
            const latestPrice = quote.latestPrice || toNumber(item.price) || toNumber(item.record_price)
            const issueAmount = toNumber(item.amount) || toNumber(item.cb_amount)
            const jslRation = toNumber(item.ration)
            const totalShares = quote.totalShares || null
            const realtimeRation = issueAmount && totalShares ? (issueAmount * 100000000) / totalShares : null
            const ration = realtimeRation || jslRation
            const dynamicRights = ration && latestPrice ? (ration / latestPrice) * 100 : null

            return {
                stockCode,
                stockName: item.stock_nm || quote.name || '',
                bondCode: normalizeStockCode(item.bond_id),
                bondName: item.bond_nm || '',
                recordDate: normalizeDate(item.record_dt),
                issueAmount,
                latestPrice,
                changePct: quote.changePct ?? toNumber(item.increase_rt),
                totalMarketValue: quote.totalMarketValue || null,
                totalShares,
                circulatingMarketValue: quote.circulatingMarketValue || null,
                circulatingShares: quote.circulatingShares || null,
                ration,
                dynamicRights,
                quoteTime: quote.quoteTime || '',
                quoteDate: quote.quoteDate || '',
                source: quote.latestPrice && quote.totalShares ? 'jisilu+tencent' : 'jisilu'
            }
        })
        .filter(item => item.dynamicRights !== null)
        .sort((a, b) => b.dynamicRights - a.dynamicRights)
}

function withPortfolioWeights(candidates) {
    const portfolio = candidates.slice(0, PORTFOLIO_SIZE)
    const weight = portfolio.length ? 1 / portfolio.length : 0
    return portfolio.map((row, index) => ({
        ...row,
        rank: index + 1,
        weight
    }))
}

function buildRecordDateMap(rawRows) {
    return new Map(
        rawRows
            .map(row => [normalizeStockCode(row.stock_id), normalizeDate(row.record_dt)])
            .filter(([, recordDate]) => Boolean(recordDate))
    )
}

function buildAdjustments(previousPortfolio, portfolio, tradeDate, recordDateMap) {
    const previousMap = new Map(normalizePortfolio(previousPortfolio).map(row => [row.stockCode, row]))
    const currentMap = new Map(normalizePortfolio(portfolio).map(row => [row.stockCode, row]))

    const buys = portfolio
        .filter(row => !previousMap.has(row.stockCode))
        .map(row => ({ ...row, action: 'buy', reason: '进入最新含权量 Top5' }))

    const sells = normalizePortfolio(previousPortfolio)
        .filter(row => !currentMap.has(row.stockCode))
        .map(row => {
            const latestRecordDate = recordDateMap.get(row.stockCode) || row.recordDate || ''
            return {
                ...row,
                recordDate: latestRecordDate,
                action: 'sell',
                reason: latestRecordDate && latestRecordDate <= tradeDate ? '到达股权登记日' : '跌出最新含权量 Top5'
            }
        })

    const unchanged = portfolio.filter(row => previousMap.has(row.stockCode))
    return { buys, sells, unchanged }
}

function resolvePreviousSnapshot(latest, existingToday, tradeDate) {
    if (existingToday && Array.isArray(existingToday.portfolio)) {
        return {
            tradeDate: existingToday.tradeDate || tradeDate,
            portfolio: existingToday.portfolio
        }
    }

    if (existingToday && Array.isArray(existingToday.previousPortfolio)) {
        return {
            tradeDate: existingToday.previousTradeDate || '',
            portfolio: existingToday.previousPortfolio
        }
    }

    if (latest && latest.tradeDate && latest.tradeDate < tradeDate) {
        return {
            tradeDate: latest.tradeDate,
            portfolio: latest.portfolio || latest.rows || []
        }
    }

    return { tradeDate: '', portfolio: [] }
}

async function refreshData(tradeDate, latest, existingToday) {
    const raw = await fetchJisiluPreData()
    const withoutExchangeBonds = raw.filter(item => !isExchangeBond(item))
    const eligible = withoutExchangeBonds
        .filter(hasReachedCommitteeApproval)
        .filter(item => !hasReachedRecordDate(item, tradeDate))
    const quoteMap = await fetchTencentQuotes(eligible.map(item => item.stock_id))
    const quoteDates = [...quoteMap.values()].map(item => item.quoteDate).filter(Boolean)
    const isTradingDay = quoteDates.some(date => date === tradeDate)

    if (!isTradingDay) {
        return {
            ok: false,
            skipped: true,
            error: `${tradeDate} 未获取到当日腾讯行情，按非交易日处理`
        }
    }

    const candidates = buildCandidates(raw, quoteMap, tradeDate)
    const portfolio = withPortfolioWeights(candidates)
    const previous = resolvePreviousSnapshot(latest, existingToday, tradeDate)
    const adjustments = buildAdjustments(previous.portfolio, portfolio, tradeDate, buildRecordDateMap(raw))
    const changed = adjustments.buys.length > 0 || adjustments.sells.length > 0
    const quoteMissCount = candidates.filter(row => row.source === 'jisilu').length
    const warnings = []

    if (quoteMissCount > 0) {
        warnings.push(`${quoteMissCount} 只候选未取得完整腾讯行情，已使用集思录可用字段计算`)
    }
    if (portfolio.length < PORTFOLIO_SIZE) {
        warnings.push(`当前仅有 ${portfolio.length} 只标的满足策略条件并可计算含权量`)
    }

    return {
        ok: portfolio.length > 0,
        tradeDate,
        quoteDate: tradeDate,
        portfolio,
        candidates,
        adjustments,
        changed,
        previousTradeDate: previous.tradeDate,
        previousPortfolio: previous.portfolio,
        rawCount: raw.length,
        eligibleCount: eligible.length,
        filteredExchangeBondCount: raw.length - withoutExchangeBonds.length,
        quoteMissCount,
        sources: [JISILU_PRE_URL, TENCENT_QUOTE_URL],
        warnings,
        refreshedAt: new Date().toISOString()
    }
}

exports.main = async (event = {}) => {
    const wantsRefresh = shouldRefresh(event)

    try {
        if (!wantsRefresh) {
            const latest = await getLatestSnapshot()
            if (!latest) {
                return {
                    success: false,
                    message: '含权策略快照尚未初始化，请先创建数据库集合并由管理员刷新一次。',
                    data: null
                }
            }

            return { success: true, fromDatabase: true, data: latest }
        }

        const timerDate = getTimerDate(event)
        if (isTimerEvent(event) && event.forceRefresh !== true && !isTradingDayRefreshWindow(timerDate)) {
            return {
                success: true,
                skipped: true,
                message: '当前不在交易日 14:40 的含权策略刷新窗口，已跳过。'
            }
        }

        const allowed = await isAdminRequest(event)
        if (!allowed) {
            return { success: false, message: '当前账号无权刷新含权策略数据。' }
        }

        const tradeDate = getShanghaiDateString(timerDate)
        const latest = await getLatestSnapshot()
        const existingToday = await getDailySnapshot(tradeDate)
        let snapshot = await refreshData(tradeDate, latest, existingToday)

        if (
            snapshot.skipped &&
            event.forceRefresh === true &&
            latest &&
            latest.tradeDate &&
            latest.tradeDate !== tradeDate
        ) {
            const latestTradingDaySnapshot = await getDailySnapshot(latest.tradeDate)
            snapshot = await refreshData(latest.tradeDate, latest, latestTradingDaySnapshot)
            if (snapshot.ok) {
                snapshot.warnings.unshift(
                    `${tradeDate} 为非交易日或休市日，已重新获取最近交易日 ${latest.tradeDate} 的行情`
                )
            }
        }

        if (snapshot.skipped) {
            return {
                success: true,
                refreshed: false,
                skipped: true,
                message: snapshot.error,
                data: latest
            }
        }

        if (snapshot.ok) {
            const saved = await saveSnapshot(snapshot)
            return {
                success: true,
                refreshed: true,
                message: saved.changed ? '持仓发生变化，已生成调仓建议。' : '持仓未变化，无需调仓。',
                data: saved
            }
        }

        return {
            success: Boolean(latest),
            refreshed: false,
            message: snapshot.error || '含权策略数据刷新失败，已保留上一份可用快照。',
            data: latest || snapshot
        }
    } catch (error) {
        console.error('getRightsStrategyData failed:', error)
        const latest = await getLatestSnapshot().catch(() => null)
        return {
            success: Boolean(latest),
            message: error.message || '含权策略数据服务异常',
            data: latest
        }
    }
}
