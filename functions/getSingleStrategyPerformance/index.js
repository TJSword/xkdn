// 获取单个策略的表现

const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()

/**
 * 根据传入的策略ID，获取该策略的历史表现数据
 * 用于驱动各个策略的详情页图表
 */
exports.main = async (event, context) => {
    // 1. 从前端 callFunction 的 data 参数中获取 strategy_id
    const { strategy_id } = event

    // 2. 校验核心参数
    if (!strategy_id) {
        return {
            success: false,
            message: '必须提供 strategy_id 参数。'
        }
    }

    try {
        // 3. 查询 'dailyPerformance' 集合中所有匹配该策略ID的记录
        const res = await db
            .collection('dailyPerformance')
            .where({
                strategy_id: strategy_id // 核心：只筛选指定策略的数据
            })
            .orderBy('record_date', 'asc') // 按日期升序排序，确保图表时间轴正确
            .field({
                // 只获取需要的字段，提高效率
                record_date: true,
                cumulative_rate: true
            })
            .limit(1000) // 设置一个合理的上限，防止返回过多数据
            .get()

        // 4. 将数据库中的数据，转换为前端图表所需的格式
        // 前端需要的数据格式是: [{ date: '...', strategy: 1.10 }]
        // 这里的 'strategy' 字段代表累计净值
        const performanceData = res.data.map(item => {
            return {
                date: item.record_date,
                // 将累计收益率（如 10%）转换为累计净值（1.10）
                strategy: 1 + item.cumulative_rate / 100
            }
        })

        console.log(`成功查询到策略 [${strategy_id}] 的 ${performanceData.length} 条记录。`)

        // 5. 返回成功的响应
        return {
            success: true,
            data: performanceData
        }
    } catch (error) {
        // 6. 捕获并处理错误
        console.error(`查询策略 [${strategy_id}] 数据失败:`, error)
        return {
            success: false,
            message: `服务器内部错误，无法获取策略 [${strategy_id}] 的数据。`,
            error: error.message
        }
    }
}
