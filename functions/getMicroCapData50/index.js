const tcb = require('@cloudbase/node-sdk');

const app = tcb.init();
const db = app.database();
const cmd = db.command;
const checkUserPermission = require('./auth');
// const COLLECTION_NAME = 'micro_cap_history';
// const CONFIG_DOC_ID = '__STRATEGY_CONFIG__';

exports.main = async (event, context) => {
    // ============================================
    // 一行代码搞定鉴权！
    // ============================================
    const authCheck = await checkUserPermission(app,true);
    // 如果要查管理员权限：await checkUserPermission(app, true);

    // 如果没通过，直接返回鉴权模块生成的错误信息
    if (!authCheck.pass) {
        return authCheck.result;
    }
    const collection = db.collection('micro_cap_history'); // 替换为你的集合名
    const CONFIG_DOC_ID = '__STRATEGY_CONFIG__';

    try {
        // 1. 获取配置项 (Cookie 和 计划金额)
        const configRes = await collection.doc(CONFIG_DOC_ID).get();
        const configData = configRes.data && configRes.data.length > 0 ? configRes.data[0] : {};

        // 2. 获取最新的一条调仓记录 (注意要排除掉配置文件本身)
        const historyRes = await collection
            .where({
                _id: cmd.neq(CONFIG_DOC_ID) 
            })
            .orderBy('_id', 'desc')
            .limit(1)
            .get();

        const latestRecord = historyRes.data.length > 0 ? historyRes.data[0] : null;

        // 3. 严格按照前端页面期望的结构返回
        return {
            success: true,
            data: {
                plan_amount: configData.next_day_plan_amount || 0,
                xueqiu_cookie: configData.xueqiu_cookie || '', // 🟢 新增：把 Cookie 吐给前端回显
                latest_record: latestRecord
            }
        };
    } catch (err) {
        console.error('获取数据失败:', err);
        return { success: false, msg: '获取数据失败' };
    }
};