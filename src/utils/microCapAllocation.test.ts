import assert from 'node:assert/strict'
import { calculateMicroCapAllocation } from './microCapAllocation'

const stocks = Array.from({ length: 10 }, (_, index) => ({
    code: `6000${String(index).padStart(2, '0')}`,
    price: 10
}))
const baseHoldings = stocks.map(stock => ({ code: stock.code, shares: 1000 }))

const elevenPercent = calculateMicroCapAllocation(
    stocks,
    [{ ...baseHoldings[0], shares: 1100 }, ...baseHoldings.slice(1)],
    100000
)
assert.equal(elevenPercent[0].shares, 1100)

const twelvePercent = calculateMicroCapAllocation(
    stocks,
    [{ ...baseHoldings[0], shares: 1200 }, ...baseHoldings.slice(1)],
    100000
)
assert.equal(twelvePercent[0].shares, 1200)

const thirteenPercent = calculateMicroCapAllocation(
    stocks,
    [
        { ...baseHoldings[0], shares: 1300 },
        { ...baseHoldings[1], shares: 500 },
        ...baseHoldings.slice(2)
    ],
    100000
)
assert.equal(thirteenPercent[0].shares, 1000)
assert.equal(thirteenPercent[1].shares, 1000)
assert.equal(thirteenPercent.reduce((sum, item) => sum + item.cost, 0), 100000)

const newPosition = calculateMicroCapAllocation(stocks, baseHoldings.slice(1), 100000)
assert.equal(newPosition[0].shares, 1000)

const twoNewPositions = calculateMicroCapAllocation(
    stocks,
    baseHoldings.slice(2).map(item => ({ ...item, shares: 700 })),
    100000
)
assert.equal(twoNewPositions[0].shares, 1000)
assert.equal(twoNewPositions[1].shares, 1000)
assert.ok(
    twoNewPositions.reduce((sum, item) => sum + item.cost, 0) / 100000 >= 0.98
)

const currentStrategyStocks = [
    { code: '600455', price: 21.57 },
    { code: '600561', price: 5.13 },
    { code: '600493', price: 5.38 },
    { code: '600778', price: 5.04 },
    { code: '002316', price: 4.04 },
    { code: '603860', price: 23.85 },
    { code: '600697', price: 10.01 },
    { code: '603908', price: 17.26 },
    { code: '600448', price: 2.6 },
    { code: '605567', price: 8.32 }
]
const currentPageAllocation = calculateMicroCapAllocation(
    currentStrategyStocks,
    [
        { code: '600455', shares: 100 },
        { code: '600561', shares: 500 }
    ],
    100000
)
assert.ok(currentPageAllocation.reduce((sum, item) => sum + item.cost, 0) / 100000 >= 0.98)
assert.ok(currentPageAllocation.every(item => item.weight <= 0.12))

const fiftyThousandAllocation = calculateMicroCapAllocation(
    currentStrategyStocks,
    [
        { code: '600455', shares: 100 },
        { code: '600561', shares: 500 }
    ],
    50000
)
assert.equal(fiftyThousandAllocation.reduce((sum, item) => sum + item.cost, 0), 49857)
assert.equal(fiftyThousandAllocation.find(item => item.code === '603908')?.shares, 300)
assert.equal(fiftyThousandAllocation.find(item => item.code === '600697')?.shares, 500)
assert.equal(fiftyThousandAllocation.find(item => item.code === '600778')?.shares, 1000)
assert.equal(fiftyThousandAllocation.find(item => item.code === '600448')?.shares, 2000)
assert.ok(fiftyThousandAllocation.every(item => item.weight <= 0.12))

console.log('micro-cap frontend allocation tests passed')
