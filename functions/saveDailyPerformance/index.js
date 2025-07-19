const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()
const _ = db.command // _.inc() 等高级操作符会用到，这里先引入

/**
 * 保存每日投资表现记录
 */
exports.main = async (event, context) => {
    const { record_date, strategy_id, strategy_amount, daily_profit, cumulative_rate } = event

    // 3. 校验业务参数
    if (
        !record_date ||
        !strategy_id ||
        strategy_amount === undefined ||
        daily_profit === undefined ||
        cumulative_rate === undefined
    ) {
        return {
            success: false,
            message: '缺少必要的参数 (record_date, strategy_id等)。'
        }
    }

    try {
        // 4. 获取要操作的集合 (相当于 SQL 的表)
        const performanceCollection = db.collection('dailyPerformance')

        // 5. 创建一个唯一的文档 ID
        // 在 NoSQL 数据库中，我们通常将复合主键合并成一个唯一的字符串ID
        // 这样可以确保每个策略每天只有一条记录
        const docId = `${strategy_id}_${record_date}`

        // 6. 准备要存入数据库的数据
        const dataToSave = {
            record_date: record_date,
            strategy_id: strategy_id,
            strategy_amount: Number(strategy_amount),
            daily_profit: Number(daily_profit),
            cumulative_rate: Number(cumulative_rate),
            // 使用服务端时间，可以防止客户端时间不准导致的问题
            last_updated: db.serverDate()
        }

        // 7. 执行写入/更新操作
        // 使用 doc(id).set() 方法。如果ID对应的文档存在，它会覆盖更新；如果不存在，则会创建。
        // 这完美地实现了我们“存在即更新，不存在则创建”(Upsert)的需求，非常简洁。
        await performanceCollection.doc(docId).set(dataToSave)

        console.log(`成功保存或更新文档: ${docId}`)

        // 8. 返回成功的响应
        return {
            success: true,
            message: '数据保存成功！',
            docId: docId
        }
    } catch (error) {
        // 9. 捕获并处理错误
        console.error('数据库操作失败:', error)
        return {
            success: false,
            message: '服务器内部错误，无法保存数据。',
            error: error.message
        }
    }
}
