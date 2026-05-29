const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()
const _ = db.command // _.inc() 等高级操作符会用到，这里先引入

/**
 * 保存每日投资表现记录
 */
exports.main = async (event, context) => {
    const { record_date, strategy_id, strategy_amount, daily_profit } = event

    // 3. 校验业务参数
    if (
        !record_date ||
        !strategy_id ||
        strategy_amount === undefined ||
        daily_profit === undefined
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
        const docId = `${strategy_id}_${record_date}`

        // 将输入的参数转为数字类型，以便进行计算
        const numStrategyAmount = Number(strategy_amount); // 期末总额
        const numDailyProfit = Number(daily_profit);       // 当日收益

        // ==========================================================
        // 新增逻辑：根据修正后的公式计算当日收益率
        // ==========================================================

        // 1. 计算期初本金 (Start-of-Day Principal)
        const startOfDayAmount = numStrategyAmount - numDailyProfit;

        // 2. 计算当日收益率，并处理期初本金为0的情况
        // 公式: 当日收益率 = 当日收益 / 期初本金
        const daily_rate = startOfDayAmount !== 0 ? numDailyProfit / startOfDayAmount : 0;
        // ==========================================================


        // 6. 准备要存入数据库的数据
        const dataToSave = {
            record_date: record_date,
            strategy_id: strategy_id,
            strategy_amount: numStrategyAmount, // 期末总额
            daily_profit: numDailyProfit,
            // cumulative_rate: Number(cumulative_rate),

            // 新增字段：将计算出的当日收益率也存入数据库
            daily_rate: daily_rate.toFixed(4),

            // （可选）也可以把期初本金存下来，方便核对
            // start_of_day_amount: startOfDayAmount,

            // 使用服务端时间，可以防止客户端时间不准导致的问题
            last_updated: db.serverDate()
        }

        // 7. 执行写入/更新操作
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