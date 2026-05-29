const tcb = require('@cloudbase/node-sdk');
const checkUserPermission = require('./auth');
const app = tcb.init();
const db = app.database();

exports.main = async (event, context) => {
    // ============================================
    // 一行代码搞定鉴权！
    // ============================================
    const authCheck = await checkUserPermission(app);
    // 如果要查管理员权限：await checkUserPermission(app, true);

    // 如果没通过，直接返回鉴权模块生成的错误信息
    if (!authCheck.pass) {
        return authCheck.result;
    }
    try {
        // 1. 从 micro_cap_top10_history 集合中查询
        // 2. 按 _id (日期) 倒序排列
        // 3. 只取 1 条 (即最新的一条)
        const res = await db.collection('micro_cap_top10_history')
            .orderBy('_id', 'desc')
            .limit(1)
            .get();

        if (res.data && res.data.length > 0) {
            return {
                success: true,
                data: res.data[0]
            };
        } else {
            return {
                success: false,
                msg: '暂无策略数据，请等待第一次运行'
            };
        }
    } catch (e) {
        console.error(e);
        return {
            success: false,
            msg: '获取数据失败: ' + e.message
        };
    }
};