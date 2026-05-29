const tcb = require('@cloudbase/node-sdk')

const app = tcb.init()
const auth = app.auth()
const db = app.database()
const _ = db.command

exports.main = async (event, context) => {
    // 1. 获取用户信息 (这是最重要的一步，确保数据只能保存到当前登录者的名下)
    const { uid } = auth.getUserInfo()

    // 2. 获取前端传来的参数
    // 我们期望 event 中包含 holdings 字段
    const { holdings } = event

    // 3. 基础校验
    if (!uid) {
        return { success: false, msg: '未获取到用户信息' }
    }

    if (!Array.isArray(holdings)) {
        return { success: false, msg: '参数错误：holdings 必须是数组' }
    }

    try {
        const usersCollection = db.collection('users')

        // 4. 数据清洗 (Best Practice)
        // 哪怕前端做过校验，后端最好也清洗一遍，防止存入脏数据
        // 确保 shares 是数字，code 是字符串
        const cleanHoldings = holdings.map(item => ({
            code: String(item.code),
            name: String(item.name || '未知'),
            shares: Number(item.shares)
        })).filter(item => item.code.length === 6 && item.shares > 0) // 过滤掉无效数据

        // 5. 执行更新操作
        // 使用 update 方法，只会更新指定的字段，不会覆盖掉用户原本的 VIP 信息或注册时间
        const result = await usersCollection.doc(uid).update({
            holdings: cleanHoldings,            // 保存持仓数组
            holdingsUpdatedAt: db.serverDate()  // 记录最后一次更新持仓的时间
        })

        // 检查是否有文档被更新
        if (result.updated === 0) {
            // 如果更新数为0，可能是因为用户文档不存在（理论上不应该发生，除非注册逻辑有问题）
            return { success: false, msg: '用户档案不存在，请尝试重新登录' }
        }

        return {
            success: true,
            msg: '持仓已保存',
            data: cleanHoldings, // 返回清洗后的数据给前端更新视图
            timestamp: new Date().getTime()
        }

    } catch (err) {
        console.error('保存持仓失败:', err)
        return {
            success: false,
            msg: '保存失败，请稍后重试',
            error: err.message
        }
    }
}