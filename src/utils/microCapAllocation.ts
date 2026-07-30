export interface MicroCapAllocationStock {
    code: string
    price: number
}

export interface MicroCapUserHolding {
    code: string
    shares: number
}

export interface MicroCapAllocationRow {
    code: string
    shares: number
    cost: number
    weight: number
}

const TARGET_WEIGHT = 0.1
const MAXIMUM_WEIGHT = 0.12
const LOT_SIZE = 100
const EPSILON = 1e-8

function targetLotShares(totalFunds: number, price: number) {
    return Math.floor((totalFunds * TARGET_WEIGHT) / price / LOT_SIZE) * LOT_SIZE
}

export function calculateMicroCapAllocation(
    stocks: MicroCapAllocationStock[],
    userHoldings: MicroCapUserHolding[],
    totalFunds: number
): MicroCapAllocationRow[] {
    const currentShares = new Map(
        userHoldings.map(item => [item.code, Math.max(0, Number(item.shares) || 0)])
    )
    const trimmedCodes = new Set<string>()

    const rows = stocks.map(stock => {
        const price = Number(stock.price)
        const shares = currentShares.get(stock.code) || 0
        const currentCost = shares * price
        const currentWeight = currentCost / totalFunds
        let targetShares = shares

        if (shares === 0) {
            targetShares = targetLotShares(totalFunds, price)
        } else if (currentWeight > MAXIMUM_WEIGHT + EPSILON) {
            targetShares = Math.min(shares, targetLotShares(totalFunds, price))
            trimmedCodes.add(stock.code)
        }

        return {
            code: stock.code,
            price,
            shares: targetShares
        }
    })

    let remainingFunds = Math.max(
        0,
        totalFunds - rows.reduce((sum, item) => sum + item.shares * item.price, 0)
    )
    while (remainingFunds > EPSILON) {
        const candidates = rows
            .filter(item => !trimmedCodes.has(item.code))
            .filter(item => {
                const nextCost = (item.shares + LOT_SIZE) * item.price
                return item.price * LOT_SIZE <= remainingFunds + EPSILON &&
                    nextCost / totalFunds <= MAXIMUM_WEIGHT + EPSILON
            })
        if (!candidates.length) break

        const lowest = candidates.reduce((result, item) =>
            item.shares * item.price < result.shares * result.price ? item : result
        )
        lowest.shares += LOT_SIZE
        remainingFunds -= lowest.price * LOT_SIZE
    }

    return rows.map(item => {
        const cost = item.shares * item.price
        return {
            code: item.code,
            shares: item.shares,
            cost,
            weight: cost / totalFunds
        }
    })
}
