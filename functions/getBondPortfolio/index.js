// 文件: getBondPortfolio/index.js

const tcb = require('@cloudbase/node-sdk')

/**
 * 比较新旧两个组合，生成调仓建议
 * @param {Array} newPortfolio - 最新的可转债组合
 * @param {Array} oldPortfolio - 上一个交易日的可转债组合
 * @returns {Array} 调仓建议列表
 */
function generateAdjustments(newPortfolio, oldPortfolio) {
    // 使用 Set 数据结构可以极大地提高查找效率
    const newBondsCodeSet = new Set(newPortfolio.map(bond => bond.code))
    const oldBondsCodeSet = new Set(oldPortfolio.map(bond => bond.code))

    const adjustments = []

    // 1. 找出需要调入的转债
    // 逻辑：在新组合中，但不在旧组合中
    for (const bond of newPortfolio) {
        if (!oldBondsCodeSet.has(bond.code)) {
            adjustments.push({
                name: bond.name,
                code: bond.code,
                action: '调入' // 'IN'
            })
        }
    }

    // 2. 找出需要调出的转债
    // 逻辑：在旧组合中，但不在新组合中
    for (const bond of oldPortfolio) {
        if (!newBondsCodeSet.has(bond.name)) {
            adjustments.push({
                name: bond.name,
                code: bond.code,
                action: '调出' // 'OUT'
            })
        }
    }

    return adjustments
}

exports.main = async (event, context) => {
    // 初始化 SDK
    const app = tcb.init()
    const db = app.database()

    try {
        console.log('开始从数据库获取可转债数据...')

        // 1. 获取要操作的集合
        const collection = db.collection('bond_data')

        // 2. 查询数据，按 record_date 降序排序，并只取最近的两条记录
        const queryResult = await collection
            .orderBy('record_date', 'desc') // 'desc' 表示降序，最新的在前面
            .limit(2) // 限制最多返回 2 条记录
            .get()

        if (!queryResult.data || queryResult.data.length === 0) {
            console.log('数据库中没有找到任何数据。')
            return {
                success: false,
                message: '数据库中没有数据。'
            }
        }

        // 3. 提取最新数据
        const latestRecord = queryResult.data[0]
        const latestPortfolio = latestRecord.bonds || []

        let adjustments = []
        let message = '成功获取最新数据。'

        // 4. 如果有两条或更多数据，则进行对比生成调仓建议
        if (queryResult.data.length > 1) {
            console.log('找到两条记录，开始生成调仓建议...')
            const previousRecord = queryResult.data[1]
            const previousPortfolio = previousRecord.bonds || []

            adjustments = generateAdjustments(latestPortfolio, previousPortfolio)
            message = '成功获取最新数据并生成调仓建议。'
            console.log('调仓建议生成完毕:', adjustments)
        } else {
            console.log('数据库中只有一条记录，无法生成调仓建议。')
            message = '成功获取最新数据，但数据不足以生成调仓建议。'
        }

        // 5. 构造并返回最终结果
        return {
            success: true,
            message: message,
            latest_date: latestRecord.record_date, // 最新数据的日期
            latest_portfolio: latestPortfolio, // 最新的组合
            adjustments: adjustments // 调仓建议
        }
    } catch (error) {
        console.error('获取或处理数据时发生错误:', error)
        return {
            success: false,
            message: '服务器内部错误，无法获取数据。',
            error: error.message
        }
    }
}
