const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()

/**
 * 保存单条交易操作记录
 */
exports.main = async (event, context) => {
    // 1. 从前端 callFunction 的 data 参数中直接获取数据
    const { transaction_date, type, target, strategy_id, notes, amount } = event

    // 2. 校验核心参数
    if (!transaction_date || !type || !target || !strategy_id || !amount) {
        return {
            success: false,
            message: '缺少必要的操作记录参数 (日期, 类型, 标的, 策略)。'
        }
    }

    try {
        // 3. 获取要操作的集合
        // 根据您的库表设计，我们操作 "Transactions" 集合
        const transactionsCollection = db.collection('transactions')

        // 4. 准备要存入数据库的数据
        const dataToSave = {
            transaction_date: transaction_date,
            type: type,
            target: target,
            strategy_id: strategy_id,
            amount: Number(amount),
            notes: notes || '', // 如果 notes 为空，存入一个空字符串
            // 为记录创建一个服务端时间戳，方便按创建顺序排序
            created_at: db.serverDate()
        }

        // 5. 执行写入操作
        // 对于创建一条全新的、唯一的记录，使用 .add() 是最佳实践。
        // 它会自动生成一个唯一的 "_id"，并返回这个ID。
        const result = await transactionsCollection.add(dataToSave)

        console.log(`成功创建操作记录，文档ID: ${result.id}`)

        // 6. 返回成功的响应
        return {
            success: true,
            message: '操作记录保存成功！',
            docId: result.id // 将新创建的文档ID返回给前端
        }
    } catch (error) {
        // 7. 捕获并处理错误
        console.error('数据库操作失败:', error)
        return {
            success: false,
            message: '服务器内部错误，无法保存操作记录。',
            error: error.message
        }
    }
}
