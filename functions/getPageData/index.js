'use strict'

const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()
const _ = db.command
const $ = db.command.aggregate

/**
 * 获取投资详情页所需的所有初始数据
 */
exports.main = async (event, context) => {
    try {
        // 获取今天的 YYYY-MM-DD 格式字符串 (以UTC+8北京时间为准)
        const today = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10)
        // 使用 Promise.all 并行执行所有数据库查询，最大化效率
        const [latestDateResult, strategies, recentTransactions, historicalData, comparisonData] =
            await Promise.all([
                // 任务1: 获取最新的记录日期
                db
                    .collection('dailyPerformance')
                    .where({
                        record_date: _.lt(today) // _.lt() 表示 "less than" (小于)
                    })
                    .orderBy('record_date', 'desc')
                    .limit(1)
                    .field({ record_date: true })
                    .get(),
                // 任务2: 获取所有策略定义
                db.collection('strategies').get(),
                // 任务3: 获取近期10条操作记录
                db.collection('transactions').orderBy('transaction_date', 'desc').limit(10).get(),
                // 任务4: 获取历史表现聚合数据
                getHistoricalTrend(),
                // 任务5: 获取策略对比数据
                getStrategyComparisonSeries()
            ])

        // --- 数据处理 ---

        // 1. 处理策略列表 (用于数据转换)
        const strategyMap = new Map(strategies.data.map(s => [s.strategy_id, s.strategy_name]))
        const strategyList = strategies.data.map(s => ({
            id: s.strategy_id,
            name: s.strategy_name
        }))

        // 2. 根据最新日期，获取总览数据
        const latestDate =
            latestDateResult.data.length > 0 ? latestDateResult.data[0].record_date : null
        let overview = {
            totalAmount: 0,
            dailyProfit: 0,
            position: [],
            profitContribution: []
        }
        if (latestDate) {
            const overviewResult = await db
                .collection('dailyPerformance')
                .where({ record_date: latestDate })
                .get()
            overviewResult.data.forEach(item => {
                const strategyName = strategyMap.get(item.strategy_id) || item.strategy_id
                overview.totalAmount += item.strategy_amount
                overview.dailyProfit += item.daily_profit
                overview.position.push({ name: strategyName, value: item.strategy_amount })
                overview.profitContribution.push({ name: strategyName, value: item.daily_profit })
            })
        }

        // 3. 处理近期操作记录 (将 strategy_id 转换为 name)
        const transactions = recentTransactions.data.map(t => ({
            ...t,
            strategy: strategyMap.get(t.strategy_id) || t.strategy_id
        }))

        // 4. 组合最终返回结果
        const finalData = {
            overview,
            historicalTrend: historicalData,
            strategyComparison: comparisonData,
            recentTransactions: transactions,
            strategyList,
            lastUpdatedDate: latestDate
        }

        return {
            success: true,
            data: finalData
        }
    } catch (error) {
        console.error('获取页面数据失败:', error)
        return {
            success: false,
            message: '服务器内部错误，获取页面数据失败。',
            error: error.message
        }
    }
}

// 辅助函数1: 获取历史总金额趋势
async function getHistoricalTrend() {
    const res = await db
        .collection('dailyPerformance')
        .aggregate()
        .group({
            _id: '$record_date',
            total_amount: $.sum('$strategy_amount')
        })
        .sort({
            _id: 1 // 按日期升序
        })
        .end()

    const dates = []
    const amounts = []
    res.data.forEach(item => {
        dates.push(item._id)
        amounts.push(item.total_amount)
    })
    return { dates, amounts }
}

// 辅助函数2: 获取各策略收益率对比序列
async function getStrategyComparisonSeries() {
    // 一次性获取所有需要的字段
    const res = await db
        .collection('dailyPerformance')
        .orderBy('record_date', 'asc')
        .field({
            record_date: true,
            strategy_id: true,
            cumulative_rate: true
        })
        .get()

    if (!res.data.length) {
        return { dates: [], series: [] }
    }

    // 在云函数中处理成图表需要的格式
    const dateSet = new Set(res.data.map(item => item.record_date))
    const dates = Array.from(dateSet).sort()

    const seriesMap = new Map()
    res.data.forEach(item => {
        if (!seriesMap.has(item.strategy_id)) {
            seriesMap.set(item.strategy_id, {})
        }
        seriesMap.get(item.strategy_id)[item.record_date] = item.cumulative_rate
    })

    const series = []
    for (const [strategyId, dateValueMap] of seriesMap.entries()) {
        const dataPoints = dates.map(date => dateValueMap[date] || null) // 如果某天没数据，用null填充
        series.push({
            name: strategyId, // 前端会根据 strategyMap 替换成中文名
            data: dataPoints
        })
    }

    return { dates, series }
}
