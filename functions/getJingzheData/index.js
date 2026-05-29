const tcb = require('@cloudbase/node-sdk')
const checkUserPermission = require('./auth'); // 假设你在这个目录下有 auth.js

/**
 * 辅助函数：生成买卖建议对象
 * @param {Array} newPortfolio - 今日持仓
 * @param {Array} oldPortfolio - 昨日持仓
 */
function generateAdvice(newPortfolio, oldPortfolio) {
    const newBondsMap = new Map(newPortfolio.map(b => [b.code, b]));
    const oldBondsSet = new Set(oldPortfolio.map(b => b.code));

    const buy = [];
    const sell = [];

    // 1. 找出买入 (在今天列表中，但不在昨天列表中)
    for (const bond of newPortfolio) {
        if (!oldBondsSet.has(bond.code)) {
            buy.push({
                code: bond.code,
                name: bond.name,
                targetPrice: bond.price // 建议挂单价设为当前价
            });
        }
    }

    // 2. 找出卖出 (在昨天列表中，但不在今天列表中)
    for (const bond of oldPortfolio) {
        if (!newBondsMap.has(bond.code)) {
            // 注意：卖出的价格我们通常拿不到实时价格(因为它不在新列表里)
            // 这里暂且用昨天的价格作为参考，或者如果不展示价格也可以
            sell.push({
                code: bond.code,
                name: bond.name,
                targetPrice: bond.price
            });
        }
    }

    return { buy, sell };
}

/**
 * 辅助函数：格式化时间显示
 */
function getDisplayTimestamp(isoString) {
    if (!isoString) return '获取中...';

    // 1. 将字符串转为 Date 对象
    const date = new Date(isoString);

    // 2. 计算 UTC 时间的时间戳，并加上 8 小时的毫秒数 (8 * 60 * 60 * 1000)
    // 这样我们就得到了一个"人为偏移"后的时间对象
    const beijingTimestamp = date.getTime() + (8 * 60 * 60 * 1000);
    const beijingDate = new Date(beijingTimestamp);

    // 3. 使用 getUTC* 方法获取年月日时分
    // 注意：因为我们已经手动加了8小时偏移量，所以必须用 UTC 方法来获取"字面量"，
    // 否则会再次叠加上运行环境的本地时区，导致时间错误。
    const year = beijingDate.getUTCFullYear();
    const month = (beijingDate.getUTCMonth() + 1).toString().padStart(2, '0'); // 月份从0开始
    const day = beijingDate.getUTCDate().toString().padStart(2, '0');
    const hour = beijingDate.getUTCHours().toString().padStart(2, '0');
    const minute = beijingDate.getUTCMinutes().toString().padStart(2, '0');

    // 4. 拼接字符串
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

exports.main = async (event, context) => {
    const app = tcb.init();

    // 1. 鉴权 (如果是管理员专用)
    const authCheck = await checkUserPermission(app);
    if (!authCheck.pass) {
        return { success: false, message: '无权访问' };
    }

    const db = app.database();

    try {
        // 2. 查询最近两天的记录
        // 假设你的惊蛰策略数据存放在 'jingzhe_data' 集合中
        // 如果还是在 'bond_data'，请自行修改 collection 名称
        const queryResult = await db.collection('bond_data_s2')
            .orderBy('record_date', 'desc')
            .limit(2)
            .get();

        if (!queryResult.data || queryResult.data.length === 0) {
            return { success: false, message: '暂无策略数据' };
        }

        const latestRecord = queryResult.data[0];
        const latestPortfolio = latestRecord.bonds || []; // 这是今天的 Top 5

        let advice = { buy: [], sell: [] };
        let updateTime = '';

        // 3. 生成调仓建议
        if (queryResult.data.length > 1) {
            const previousRecord = queryResult.data[1];
            const previousPortfolio = previousRecord.bonds || [];
            advice = generateAdvice(latestPortfolio, previousPortfolio);
        } else {
            // 如果只有一条数据，说明刚开始运行，全部视为买入（或者不操作）
            // 这里视情况而定，暂且留空
        }

        // 4. 处理时间
        // 优先使用 last_updated 字段，如果没有则使用 record_date
        const rawTime = latestRecord.last_updated;
        console.log('rawTime', rawTime)
        // 传入格式化函数处理成 "YYYY-MM-DD HH:mm"
        updateTime = getDisplayTimestamp(rawTime);
        console.log(updateTime)
        return {
            success: true,
            data: {
                bonds: latestPortfolio, // 返回给前端表格显示
                advice: advice,         // 返回给前端建议卡片显示
                updateTime: updateTime  // 返回给右上角胶囊显示
            }
        };

    } catch (error) {
        console.error('云函数执行错误:', error);
        return {
            success: false,
            message: '服务器内部错误',
            error: error.message
        };
    }
}