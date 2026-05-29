const tcb = require('@cloudbase/node-sdk')
const checkUserPermission = require('./auth');
// 初始化 SDK
const app = tcb.init()
const db = app.database()

const COLLECTION_NAME = 'momentum' // 请确保这里是你实际创建的集合名称

exports.main = async (event, context) => {

    const authCheck = await checkUserPermission(app);
    // 如果要查管理员权限：await checkUserPermission(app, true);

    // 如果没通过，直接返回鉴权模块生成的错误信息
    if (!authCheck.pass) {
        return authCheck.result;
    }


    // 设置为 false，以便函数在回调返回后立即冻结，避免等待事件循环清空
    context.callbackWaitsForEmptyEventLoop = false;

    console.log(`正在从集合 [${COLLECTION_NAME}] 获取最新数据...`)

    try {
        // --- 核心查询逻辑 ---
        // 1. 指定集合
        // 2. orderBy('record_date', 'desc'): 按照记录日期从大到小（最新到最旧）排序
        // 3. limit(1): 只取第1条，也就是最新的一条
        const res = await db.collection(COLLECTION_NAME)
            .orderBy('record_date', 'desc')
            .limit(1)
            .get();

        // --- 处理返回结果 ---
        if (res.data && res.data.length > 0) {
            const latestData = res.data[0];
            delete latestData.ranking
            console.log(`成功获取数据，日期: ${latestData.record_date}`);

            return {
                success: true,
                message: '成功获取最新ETF轮动数据',
                data: latestData
            };
        } else {
            console.warn('集合为空，未找到数据');
            return {
                success: false,
                message: '数据库中暂无数据',
                data: null
            };
        }

    } catch (error) {
        console.error('查询数据库失败:', error);
        return {
            success: false,
            message: '服务器内部错误，无法读取数据',
            error: error.message
        };
    }
}