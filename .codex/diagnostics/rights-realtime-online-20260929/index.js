'use strict'

const axios = require('axios')
const tcb = require('@cloudbase/node-sdk')

const app = tcb.init()
const db = app.database()

function isTimerEvent(event = {}) {
    return event.Type === 'Timer' || event.type === 'timer' || event.TriggerName || event.triggerName
}

const BASE_COLLECTION = 'rights_strategy_base'
const REALTIME_COLLECTION = 'rights_strategy_realtime'
const HOLDING_COLLECTION = 'rightsStrategySnapshots'
const LATEST_BASE_DOC_ID = 'latest'
const LATEST_REALTIME_DOC_ID = 'latest_intraday_snapshot'
const RECENT_INTRADAY_DOC_LIMIT = 5

const SOURCE = 'tencent-mkline-stock'
const REBALANCE_TIME = '14:40'
const SLIPPAGE_RATE = 0.001

async function cleanupOldIntradaySnapshots(collectionName = REALTIME_COLLECTION, keep = RECENT_INTRADAY_DOC_LIMIT) {
    try {
        const res = await db
            .collection(collectionName)
            .where({
                _id: db.RegExp({ regexp: '^intraday_', options: '' })
            })
            .field({
                _id: true,
                tradeDate: true
            })
            .get()

        const docs = (res.data || [])
            .map(item => ({
                id: item._id,
                date: item.tradeDate || String(item._id || '').replace('intraday_', '')
            }))
            .filter(item => item.id && item.id !== LATEST_REALTIME_DOC_ID)
            .sort((a, b) => String(b.date).localeCompare(String(a.date)))

        await Promise.all(
            docs.slice(keep).map(item =>
                db
                    .collection(collectionName)
                    .doc(item.id)
                    .remove()
                    .catch(error => console.error(`删除旧日内快照失败 ${item.id}:`, error.message))
            )
        )
    } catch (error) {
        console.error('清理旧日内快照失败:', error.message)
    }
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
        second: '2-digit',
        hour12: false,
        hourCycle: 'h23'
    }).formatToParts(date)

    return Object.fromEntries(parts.map(part => [part.type, part.value]))
}

function getTimerDate(event = {}) {
    const rawTime = event.Time || event.time || event.triggerTime
    const date = rawTime ? new Date(rawTime) : new Date()
    return Number.isNaN(date.getTime()) ? new Date() : date
}

function getShanghaiDateString(date = new Date()) {
    const parts = getShanghaiParts(date)
    return `${parts.year}-${parts.month}-${parts.day}`
}

function getShanghaiTimestamp(date = new Date()) {
    const parts = getShanghaiParts(date)
    const hour = parts.hour === '24' ? '00' : parts.hour
    return `${parts.year}-${parts.month}-${parts.day} ${hour}:${parts.minute}:${parts.second}`
}

function getShanghaiMinute(date = new Date()) {
    const parts = getShanghaiParts(date)
    const hour = parts.hour === '24' ? '00' : parts.hour
    return `${hour}:${parts.minute}`
}

function toCompactDate(date) {
    return String(date || '').replace(/-/g, '')
}

function toNumber(value, fallback = 0) {
    const number = Number(value)
    return Number.isFinite(number) ? number : fallback
}

function getPeriodReturns(baseDoc, currentValue, tradeDate) {
    const dateList = Array.isArray(baseDoc?.dateList) ? baseDoc.dateList : []
    const strategyData = Array.isArray(baseDoc?.strategyData) ? baseDoc.strategyData : []
    if (!tradeDate || !Number.isFinite(currentValue) || !dateList.length || !strategyData.length) {
        return { monthReturn: null, yearReturn: null }
    }

    const calculateReturn = prefix => {
        const firstIndex = dateList.findIndex(date => typeof date === 'string' && date.startsWith(prefix))
        let baseIndex = firstIndex > 0 ? firstIndex - 1 : firstIndex
        if (firstIndex < 0) {
            for (let index = Math.min(dateList.length, strategyData.length) - 1; index >= 0; index -= 1) {
                if (typeof dateList[index] === 'string' && dateList[index] < tradeDate) {
                    baseIndex = index
                    break
                }
            }
        }
        if (baseIndex < 0) return null
        const baseValue = Number(strategyData[baseIndex])
        if (!Number.isFinite(baseValue) || baseValue === 0) return null
        return currentValue / baseValue - 1
    }

    return {
        monthReturn: calculateReturn(tradeDate.slice(0, 7)),
        yearReturn: calculateReturn(tradeDate.slice(0, 4))
    }
}

function round(value, digits = 6) {
    const factor = 10 ** digits
    return Math.round((Number(value) || 0) * factor) / factor
}

function normalizeStockCode(code) {
    return String(code || '').replace(/\D/g, '').padStart(6, '0').slice(-6)
}

function getStockFullCode(code) {
    const raw = normalizeStockCode(code)
    return `${raw.startsWith('6') ? 'sh' : 'sz'}${raw}`
}

function normalizeHolding(item, index, total) {
    const code = normalizeStockCode(item.stockCode || item.code || item.symbol)
    const fallbackWeight = total ? 1 / total : 0
    return {
        code,
        name: item.stockName || item.name || code,
        bondCode: item.bondCode || '',
        bondName: item.bondName || '',
        weight: toNumber(item.weight, fallbackWeight),
        dynamicRights: toNumber(item.dynamicRights, null),
        ration: toNumber(item.ration, null)
    }
}

function normalizePortfolio(rows) {
    const list = Array.isArray(rows) ? rows.filter(Boolean) : []
    return list.map((item, index) => normalizeHolding(item, index, list.length)).filter(item => item.code)
}

function normalizeHoldingWeights(holdings) {
    if (!holdings.length) return []
    const totalWeight = holdings.reduce((sum, item) => sum + (Number.isFinite(item.weight) && item.weight > 0 ? item.weight : 0), 0)
    return holdings.map(item => ({
        ...item,
        weight: totalWeight > 0 ? round((Number(item.weight) || 0) / totalWeight) : round(1 / holdings.length)
    }))
}

function applyStoredWeights(holdings, storedWeights) {
    if (!holdings.length || !Array.isArray(storedWeights)) return holdings
    const weightMap = new Map(storedWeights.map(item => [normalizeStockCode(item.code), toNumber(item.weight, NaN)]))
    return normalizeHoldingWeights(holdings.map(item => {
        const weight = weightMap.get(item.code)
        return Number.isFinite(weight) && weight > 0 ? { ...item, weight } : item
    }))
}

function getRecentHoldingWeights(baseDoc, date) {
    const list = Array.isArray(baseDoc?.recentHoldingWeights) ? baseDoc.recentHoldingWeights : []
    const record = list.find(item => item.date === date)
    return Array.isArray(record?.holdings) ? record.holdings : null
}

function getIntradayHoldingCache(baseDoc, tradeDate) {
    if (baseDoc?.intradayHoldingDate !== tradeDate || !Array.isArray(baseDoc?.intradayHoldings)) return null
    const holdings = normalizePortfolio(baseDoc.intradayHoldings)
    return holdings.length ? { tradeDate, holdings } : null
}

async function updateIntradayHoldingCache(tradeDate, holdings, updatedAt) {
    if (!tradeDate || !holdings.length) return
    await db.collection(BASE_COLLECTION).doc(LATEST_BASE_DOC_ID).update({
        intradayHoldingDate: tradeDate,
        intradayHoldings: holdings,
        intradayHoldingUpdatedAt: updatedAt
    })
}

function mergeRecentHoldingWeights(baseDoc, tradeDate, holdings) {
    const previous = Array.isArray(baseDoc?.recentHoldingWeights) ? baseDoc.recentHoldingWeights : []
    const nextRecord = {
        date: tradeDate,
        holdings: normalizeHoldingWeights(holdings).map(item => ({
            code: item.code,
            name: item.name,
            weight: round(item.weight),
            price: Number.isFinite(item.closePrice) ? item.closePrice : item.price
        }))
    }
    return [...previous.filter(item => item.date !== tradeDate), nextRecord]
        .filter(item => item.date)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .slice(-5)
}

async function getDocument(collectionName, docId) {
    try {
        const res = await db.collection(collectionName).doc(docId).get()
        return res.data && res.data[0] ? res.data[0] : null
    } catch (error) {
        if (/not exist|not found|doesn't exist|collection/i.test(error.message || '')) return null
        throw error
    }
}

async function getHoldingRecord(tradeDate, includeToday = true) {
    const _ = db.command
    const query = includeToday ? _.lte(tradeDate) : _.lt(tradeDate)
    const res = await db.collection(HOLDING_COLLECTION)
        .where({ tradeDate: query })
        .orderBy('tradeDate', 'desc')
        .limit(1)
        .get()

    const record = res.data && res.data[0] ? res.data[0] : null
    if (!record) return null

    const rows = record.portfolio || record.rows || []
    return {
        ...record,
        tradeDate: record.tradeDate,
        holdings: normalizePortfolio(rows)
    }
}

function parseTencentTime(raw) {
    if (!raw) return ''
    const text = String(raw)
    if (text.length >= 12) {
        return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)} ${text.slice(8, 10)}:${text.slice(10, 12)}`
    }
    return text
}

function parseTencentMinute(raw) {
    const text = String(raw || '')
    return text.length >= 12 ? `${text.slice(8, 10)}:${text.slice(10, 12)}` : text
}

function getPriceAtOrBefore(minutes, targetMinute) {
    const eligible = minutes.filter(item => item.time <= targetMinute)
    return eligible.length ? eligible[eligible.length - 1].price : null
}

function getQuotePriceAtOrBefore(quote, targetMinute) {
    if (!quote) return null
    return getPriceAtOrBefore(quote.minutes || [], targetMinute) || quote.latestMinutePrice || quote.price
}

async function fetchStockMinuteData(holding, tradeDate, maxRetries = 3) {
    const fullCode = getStockFullCode(holding.code)
    const url = `https://proxy.finance.qq.com/ifzqgtimg/appstock/app/kline/mkline?param=${fullCode},m1,,240`

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
        try {
            const response = await axios.get(url, {
                timeout: 7000,
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            })
            const stockData = response.data?.data?.[fullCode]
            const quote = stockData?.qt?.[fullCode] || []
            const minuteRows = stockData?.m1 || []
            const latestPrice = toNumber(quote[3], 0)
            const prevClose = toNumber(quote[4], latestPrice)
            const updatedAt = parseTencentTime(quote[30])
            const compactDate = toCompactDate(tradeDate)
            const minutes = minuteRows
                .map(row => {
                    const price = toNumber(row[2], NaN)
                    const rawTime = String(row[0] || '')
                    if (!Number.isFinite(price) || !rawTime.startsWith(compactDate)) return null
                    return {
                        time: parseTencentMinute(rawTime),
                        rawTime,
                        price
                    }
                })
                .filter(Boolean)

            return {
                ...holding,
                fullCode,
                price: latestPrice || getPriceAtOrBefore(minutes, '15:00') || 0,
                prevClose,
                updatedAt,
                minutes,
                rebalancePrice: getPriceAtOrBefore(minutes, REBALANCE_TIME),
                latestMinutePrice: minutes.length ? minutes[minutes.length - 1].price : latestPrice
            }
        } catch (error) {
            console.error(`[${holding.code}] fetch failed at attempt ${attempt}:`, error.message)
        }

        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 600 * attempt))
        }
    }

    return null
}

function getReturnFromPrevClose(item, price) {
    if (!item || !Number.isFinite(price) || !item.prevClose) return null
    return price / item.prevClose - 1
}

function getReturnBetween(startPrice, endPrice) {
    if (!Number.isFinite(startPrice) || !Number.isFinite(endPrice) || startPrice === 0) return null
    return endPrice / startPrice - 1
}

function weightedAverage(holdings, quoteMap, getReturn) {
    let weightedSum = 0
    let weightSum = 0
    holdings.forEach(holding => {
        const quote = quoteMap.get(holding.code)
        const value = getReturn(quote, holding)
        if (!Number.isFinite(value)) return

        const weight = Number.isFinite(holding.weight) && holding.weight > 0 ? holding.weight : 1 / holdings.length
        weightedSum += value * weight
        weightSum += weight
    })

    return weightSum ? weightedSum / weightSum : 0
}

function samePortfolio(previousHoldings, currentHoldings) {
    if (!previousHoldings.length || !currentHoldings.length) return false
    if (previousHoldings.length !== currentHoldings.length) return false
    const previousCodes = previousHoldings.map(item => item.code).sort().join(',')
    const currentCodes = currentHoldings.map(item => item.code).sort().join(',')
    return previousCodes === currentCodes
}

function calculateTurnover(previousHoldings, currentHoldings) {
    const previousCodes = new Set(previousHoldings.map(item => item.code))
    const currentCodes = new Set(currentHoldings.map(item => item.code))
    const sellWeight = previousHoldings
        .filter(item => !currentCodes.has(item.code))
        .reduce((sum, item) => sum + (Number.isFinite(item.weight) ? item.weight : 1 / previousHoldings.length), 0)
    const buyWeight = currentHoldings
        .filter(item => !previousCodes.has(item.code))
        .reduce((sum, item) => sum + (Number.isFinite(item.weight) ? item.weight : 1 / currentHoldings.length), 0)

    return {
        sellCount: previousHoldings.filter(item => !currentCodes.has(item.code)).length,
        buyCount: currentHoldings.filter(item => !previousCodes.has(item.code)).length,
        sellTurnover: round(sellWeight),
        buyTurnover: round(buyWeight),
        totalTurnover: round(sellWeight + buyWeight),
        slippageCost: round((sellWeight + buyWeight) * SLIPPAGE_RATE)
    }
}

function getEmptyTurnover() {
    return {
        sellCount: 0,
        buyCount: 0,
        sellTurnover: 0,
        buyTurnover: 0,
        totalTurnover: 0,
        slippageCost: 0
    }
}

function shouldUseRebalancedPortfolio(updatedMinute, previousHoldings, currentHoldings) {
    return updatedMinute >= REBALANCE_TIME && currentHoldings.length > 0 && !samePortfolio(previousHoldings, currentHoldings)
}

function calculatePortfolioSnapshot({ baseValue, previousHoldings, currentHoldings, quoteMap, updatedMinute }) {
    const hasRebalanced = shouldUseRebalancedPortfolio(updatedMinute, previousHoldings, currentHoldings)

    if (!hasRebalanced) {
        const dailyReturn = weightedAverage(previousHoldings, quoteMap, quote => {
            return getReturnFromPrevClose(quote, quote?.latestMinutePrice || quote?.price)
        })
        return {
            phase: 'holding',
            strategyIndexValue: round(baseValue * (1 + dailyReturn), 4),
            dailyReturn: round(dailyReturn),
            beforeRebalanceReturn: round(dailyReturn),
            afterRebalanceReturn: 0,
            turnover: getEmptyTurnover(),
            activeHoldings: previousHoldings
        }
    }

    const beforeReturn = weightedAverage(previousHoldings, quoteMap, quote => {
        return getReturnFromPrevClose(quote, quote?.rebalancePrice)
    })
    const afterReturn = weightedAverage(currentHoldings, quoteMap, quote => {
        return getReturnBetween(quote?.rebalancePrice, quote?.latestMinutePrice || quote?.price)
    })
    const turnover = calculateTurnover(previousHoldings, currentHoldings)
    const grossFactor = (1 + beforeReturn) * (1 - turnover.slippageCost) * (1 + afterReturn)

    return {
        phase: 'after-rebalance',
        strategyIndexValue: round(baseValue * grossFactor, 4),
        dailyReturn: round(grossFactor - 1),
        beforeRebalanceReturn: round(beforeReturn),
        afterRebalanceReturn: round(afterReturn),
        turnover,
        activeHoldings: currentHoldings
    }
}

function calculatePortfolioAtMinute({ baseValue, previousHoldings, currentHoldings, quoteMap, time }) {
    const hasRebalanced = shouldUseRebalancedPortfolio(time, previousHoldings, currentHoldings)

    if (!hasRebalanced) {
        const dailyReturn = weightedAverage(previousHoldings, quoteMap, quote => {
            return getReturnFromPrevClose(quote, getQuotePriceAtOrBefore(quote, time))
        })
        const factor = 1 + dailyReturn
        return {
            time,
            strategyIndexValue: round(baseValue * factor, 4),
            strategyAmount: round(baseValue * factor, 2),
            dailyReturn: round(dailyReturn),
            phase: 'holding'
        }
    }

    const beforeReturn = weightedAverage(previousHoldings, quoteMap, quote => {
        return getReturnFromPrevClose(quote, quote?.rebalancePrice)
    })
    const afterReturn = weightedAverage(currentHoldings, quoteMap, quote => {
        return getReturnBetween(quote?.rebalancePrice, getQuotePriceAtOrBefore(quote, time))
    })
    const turnover = calculateTurnover(previousHoldings, currentHoldings)
    const factor = (1 + beforeReturn) * (1 - turnover.slippageCost) * (1 + afterReturn)

    return {
        time,
        strategyIndexValue: round(baseValue * factor, 4),
        strategyAmount: round(baseValue * factor, 2),
        dailyReturn: round(factor - 1),
        phase: 'after-rebalance'
    }
}

function buildIntradaySeries({ baseValue, previousHoldings, currentHoldings, quotes, quoteMap }) {
    const times = Array.from(
        new Set(
            quotes.flatMap(item => (item.minutes || []).map(minute => minute.time))
        )
    ).sort()

    return times.map(time => calculatePortfolioAtMinute({
        baseValue,
        previousHoldings,
        currentHoldings,
        quoteMap,
        time
    }))
}

function calculateClosingHoldings(activeHoldings, quoteMap, phase) {
    const rows = activeHoldings
        .map(holding => {
            const quote = quoteMap.get(holding.code)
            if (!quote) return null
            const closePrice = getQuotePriceAtOrBefore(quote, '15:00') || quote.latestMinutePrice || quote.price
            const startPrice = phase === 'after-rebalance'
                ? quote.rebalancePrice || closePrice
                : quote.prevClose || closePrice
            if (!Number.isFinite(closePrice) || !Number.isFinite(startPrice) || startPrice === 0) return null
            const baseWeight = Number.isFinite(holding.weight) && holding.weight > 0 ? holding.weight : 1 / activeHoldings.length
            return {
                ...holding,
                closePrice,
                weight: baseWeight * (closePrice / startPrice)
            }
        })
        .filter(Boolean)
    return normalizeHoldingWeights(rows)
}

function hasTradeDateData(quotes, tradeDate) {
    const compactDate = toCompactDate(tradeDate)
    return quotes.some(item => {
        const quoteDate = item.updatedAt ? item.updatedAt.slice(0, 10) : ''
        const hasTodayQuote = quoteDate === tradeDate
        const hasTodayMinute = (item.minutes || []).some(minute => String(minute.rawTime || '').startsWith(compactDate))
        return hasTodayQuote || hasTodayMinute
    })
}

async function resolveBase(tradeDate = '') {
    const baseDoc = await getDocument(BASE_COLLECTION, LATEST_BASE_DOC_ID)
    if (!baseDoc || !Array.isArray(baseDoc.dateList) || !Array.isArray(baseDoc.strategyData)) {
        return null
    }

    const currentDateIndex = tradeDate ? baseDoc.dateList.indexOf(tradeDate) : -1
    const baseIndex = currentDateIndex > 0 ? currentDateIndex - 1 : baseDoc.dateList.length - 1
    const baseValue = toNumber(baseDoc.strategyData[baseIndex], 100000)
    return {
        doc: baseDoc,
        baseDate: baseDoc.dateList[baseIndex],
        baseValue,
        baseHs300: Array.isArray(baseDoc.hs300) ? toNumber(baseDoc.hs300[baseIndex], null) : null
    }
}

function shouldWriteDaily(event, date = new Date()) {
    if (event.action === 'close' || event.close === true) return true
    const parts = getShanghaiParts(date)
    return Number(parts.hour) === 15 && Number(parts.minute) >= 2 && Number(parts.minute) <= 10
}

async function updateBaseWithDaily(snapshot) {
    const base = await resolveBase(snapshot.tradeDate)
    if (!base) return

    const dateList = [...base.doc.dateList]
    const strategyData = [...base.doc.strategyData]
    const hs300 = Array.isArray(base.doc.hs300) ? [...base.doc.hs300] : []
    const dailyReturn = Array.isArray(base.doc.dailyReturn) ? [...base.doc.dailyReturn] : []
    const turnover = Array.isArray(base.doc.turnover) ? [...base.doc.turnover] : []
    const fee = Array.isArray(base.doc.fee) ? [...base.doc.fee] : []
    const holdingCount = Array.isArray(base.doc.holdingCount) ? [...base.doc.holdingCount] : []
    const dateIndex = dateList.indexOf(snapshot.tradeDate)
    const nextDoc = { ...base.doc }
    delete nextDoc._id

    if (dateIndex >= 0) {
        strategyData[dateIndex] = snapshot.strategyIndexValue
        dailyReturn[dateIndex] = snapshot.dailyReturn
        turnover[dateIndex] = snapshot.turnover.totalTurnover
        fee[dateIndex] = round(base.baseValue * snapshot.turnover.slippageCost, 4)
        holdingCount[dateIndex] = snapshot.activeHoldings.length
    } else {
        dateList.push(snapshot.tradeDate)
        strategyData.push(snapshot.strategyIndexValue)
        hs300.push(base.baseHs300)
        dailyReturn.push(snapshot.dailyReturn)
        turnover.push(snapshot.turnover.totalTurnover)
        fee.push(round(base.baseValue * snapshot.turnover.slippageCost, 4))
        holdingCount.push(snapshot.activeHoldings.length)
    }

    const latestIndex = dateList.length - 1
    await db.collection(BASE_COLLECTION).doc(LATEST_BASE_DOC_ID).set({
        ...nextDoc,
        dateList,
        strategyData,
        hs300,
        dailyReturn,
        turnover,
        fee,
        holdingCount,
        latestDate: dateList[latestIndex],
        latestStrategyIndexValue: strategyData[latestIndex],
        latestHs300: hs300[latestIndex],
        latestDailyReturn: dailyReturn[latestIndex],
        latestHoldingCount: holdingCount[latestIndex],
        latestTurnover: turnover[latestIndex],
        latestFee: fee[latestIndex],
        latestHoldings: snapshot.activeHoldings,
        latestClosingHoldings: snapshot.closingHoldings,
        recentHoldingWeights: mergeRecentHoldingWeights(base.doc, snapshot.tradeDate, snapshot.closingHoldings),
        latestTurnoverDetail: snapshot.turnover,
        slippageRate: SLIPPAGE_RATE,
        rebalanceTime: REBALANCE_TIME,
        updatedAt: snapshot.updatedAt
    })
}

async function runRealtimeRefresh(event = {}, context = {}) {
    context.callbackWaitsForEmptyEventLoop = false

    const timerDate = getTimerDate(event)
    const tradeDate = event.tradeDate || getShanghaiDateString(timerDate)
    const updatedAt = getShanghaiTimestamp(timerDate)
    const updatedMinute = event.minute || getShanghaiMinute(timerDate)
    const base = await resolveBase(tradeDate)

    if (!base) {
        return { success: false, message: 'No rights strategy base data found' }
    }

    const cachedCurrentRecord = event.forceRefresh === true ? null : getIntradayHoldingCache(base.doc, tradeDate)
    const shouldCheckCurrentRecord = updatedMinute >= REBALANCE_TIME && !cachedCurrentRecord
    const previousRecord = await getHoldingRecord(tradeDate, false)
    const todayRecord = cachedCurrentRecord || (shouldCheckCurrentRecord ? await getHoldingRecord(tradeDate, true) : null)
    const currentRecord = todayRecord && todayRecord.tradeDate === tradeDate ? todayRecord : null
    const previousHoldings = applyStoredWeights(
        previousRecord?.holdings || [],
        getRecentHoldingWeights(base.doc, previousRecord?.tradeDate)
    )
    const currentHoldings = currentRecord?.holdings || []

    if (!previousHoldings.length) {
        return { success: false, message: 'No previous rights holdings found', tradeDate }
    }

    const unionHoldings = [...previousHoldings, ...currentHoldings]
    const uniqueHoldings = Array.from(new Map(unionHoldings.map(item => [item.code, item])).values())
    const quoteResults = await Promise.all(uniqueHoldings.map(item => fetchStockMinuteData(item, tradeDate)))
    const quotes = quoteResults.filter(Boolean)
    const quoteMap = new Map(quotes.map(item => [item.code, item]))

    if (!quotes.length) {
        return { success: false, message: 'No rights strategy stock minute data fetched', tradeDate }
    }

    if (!event.forceSave && !hasTradeDateData(quotes, tradeDate)) {
        return {
            success: false,
            message: `No current trade-date stock minute data for ${tradeDate}`,
            tradeDate,
            fetchedQuoteDates: quotes.map(item => ({ code: item.code, updatedAt: item.updatedAt }))
        }
    }

    const portfolio = calculatePortfolioSnapshot({
        baseValue: base.baseValue,
        previousHoldings,
        currentHoldings,
        quoteMap,
        updatedMinute
    })
    const intraday = buildIntradaySeries({
        baseValue: base.baseValue,
        previousHoldings,
        currentHoldings,
        quotes,
        quoteMap
    })
    const closingHoldings = calculateClosingHoldings(portfolio.activeHoldings, quoteMap, portfolio.phase)
    const periodReturns = getPeriodReturns(base.doc, portfolio.strategyIndexValue, tradeDate)
    const snapshot = {
        tradeDate,
        updatedAt,
        updatedMinute,
        source: SOURCE,
        baseDate: base.baseDate,
        baseIndexValue: base.baseValue,
        rebalanceTime: REBALANCE_TIME,
        slippageRate: SLIPPAGE_RATE,
        strategyIndexValue: portfolio.strategyIndexValue,
        strategyValue: portfolio.strategyIndexValue,
        strategyAmount: portfolio.strategyIndexValue,
        dailyReturn: portfolio.dailyReturn,
        monthReturn: periodReturns.monthReturn,
        yearReturn: periodReturns.yearReturn,
        phase: portfolio.phase,
        beforeRebalanceReturn: portfolio.beforeRebalanceReturn,
        afterRebalanceReturn: portfolio.afterRebalanceReturn,
        turnover: portfolio.turnover,
        previousHoldingDate: previousRecord?.tradeDate,
        currentHoldingDate: currentRecord?.tradeDate || null,
        rebalanced: portfolio.phase === 'after-rebalance',
        previousHoldings,
        currentHoldings,
        activeHoldings: portfolio.activeHoldings,
        closingHoldings,
        assets: quotes.map(item => ({
            code: item.code,
            name: item.name,
            fullCode: item.fullCode,
            price: item.price,
            prevClose: item.prevClose,
            rebalancePrice: item.rebalancePrice,
            latestMinutePrice: item.latestMinutePrice,
            updatedAt: item.updatedAt
        })),
        intraday
    }

    await db.collection(REALTIME_COLLECTION).doc(LATEST_REALTIME_DOC_ID).set(snapshot)
    await db.collection(REALTIME_COLLECTION).doc(`intraday_${tradeDate}`).set(snapshot)
    if (!cachedCurrentRecord && currentRecord?.tradeDate === tradeDate && currentHoldings.length) {
        await updateIntradayHoldingCache(tradeDate, currentHoldings, updatedAt)
    }
    if (shouldWriteDaily(event, timerDate)) {
        await cleanupOldIntradaySnapshots()
        await updateBaseWithDaily(snapshot)
    }

    return {
        success: true,
        message: 'Rights strategy realtime snapshot refreshed',
        data: snapshot
    }
}

exports.main = async (event = {}, context = {}) => {
    try {
        return await runRealtimeRefresh(event, context)
    } catch (error) {
        return errorResponse(error)
    }
}

if (process.env.NODE_ENV === 'test') {
    exports.__test = {
        calculatePortfolioAtMinute,
        calculatePortfolioSnapshot,
        getPeriodReturns
    }
}

function errorResponse(error) {
    const message = error?.message || '服务暂时不可用'
    const code = message.includes('登录') || message.includes('仅允许管理员') ? 401 : message.includes('权限') ? 403 : 'INTERNAL_ERROR'
    return { success: false, code, message }
}
