'use strict'

const assert = require('node:assert/strict')
const test = require('node:test')
const Module = require('node:module')

const originalLoad = Module._load
Module._load = function (request, parent, isMain) {
    if (request === '@cloudbase/node-sdk') {
        return {
            init: () => ({ database: () => ({}) })
        }
    }
    if (request === 'axios') {
        return {}
    }

    return originalLoad.call(this, request, parent, isMain)
}

process.env.NODE_ENV = 'test'
const { calculatePortfolioAtMinute, calculatePortfolioSnapshot } = require('./index').__test

test.after(() => {
    Module._load = originalLoad
})

function createQuote(code, rebalancePrice, latestMinutePrice) {
    return {
        code,
        prevClose: 100,
        rebalancePrice,
        latestMinutePrice,
        price: latestMinutePrice,
        minutes: [
            { time: '14:35', price: 108 },
            { time: '14:40', price: rebalancePrice },
            { time: '15:00', price: latestMinutePrice }
        ]
    }
}

test('intraday return uses old holdings before 14:40 and the vacancy-filled portfolio after 14:40', () => {
    const previousHoldings = [
        { code: '600368', weight: 0.2 },
        { code: '603339', weight: 0.2 },
        { code: '300815', weight: 0.2 },
        { code: '301459', weight: 0.2 },
        { code: '301132', weight: 0.2 }
    ]
    const currentHoldings = [
        { code: '600368', weight: 0.2 },
        { code: '603339', weight: 0.2 },
        { code: '301459', weight: 0.2 },
        { code: '301132', weight: 0.2 },
        { code: '301149', weight: 0.2 }
    ]
    const quoteMap = new Map(
        [...new Set([...previousHoldings, ...currentHoldings].map(row => row.code))]
            .map(code => [code, createQuote(code, 110, 121)])
    )

    const before = calculatePortfolioAtMinute({
        baseValue: 1000,
        previousHoldings,
        currentHoldings,
        quoteMap,
        time: '14:35'
    })
    const after = calculatePortfolioAtMinute({
        baseValue: 1000,
        previousHoldings,
        currentHoldings,
        quoteMap,
        time: '15:00'
    })
    const close = calculatePortfolioSnapshot({
        baseValue: 1000,
        previousHoldings,
        currentHoldings,
        quoteMap,
        updatedMinute: '15:00'
    })

    assert.equal(before.phase, 'holding')
    assert.equal(before.dailyReturn, 0.08)
    assert.equal(after.phase, 'after-rebalance')
    assert.equal(after.dailyReturn, 0.209516)
    assert.equal(close.phase, 'after-rebalance')
    assert.equal(close.dailyReturn, after.dailyReturn)
    assert.equal(close.turnover.sellCount, 1)
    assert.equal(close.turnover.buyCount, 1)
    assert.deepEqual(close.activeHoldings.map(row => row.code), currentHoldings.map(row => row.code))
})
