const axios = require('axios')
const checkUserPermission = require('./auth');
const tcb = require('@cloudbase/node-sdk')
const app = tcb.init();
// ETF 配置列表
const ETF_TARGETS = [
    { secid: '0.159259', code: '159259', name: '成长ETF易方达', indexName: '国证成长100' },
    { secid: '1.518850', code: '518850', name: '黄金ETF华夏', indexName: '黄金9999' },
    { secid: '0.159682', code: '159682', name: '创业50ETF', indexName: '创业板50' },
    { secid: '0.159659', code: '159659', name: '纳斯达克100ETF', indexName: '纳斯达克100' },
    { secid: '1.563020', code: '563020', name: '红利低波ETF易方达', indexName: '中证红利低波' }
]

/**
 * 获取当前北京时间
 * 格式：YYYY-MM-DD HH:mm
 */
function getBeijingTime() {
    const now = new Date()
    // 云函数容器通常是UTC时间，需要+8小时转为北京时间
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)

    const year = beijingTime.getUTCFullYear()
    const month = (beijingTime.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = beijingTime.getUTCDate().toString().padStart(2, '0')
    const hour = beijingTime.getUTCHours().toString().padStart(2, '0')
    const minute = beijingTime.getUTCMinutes().toString().padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 获取单个ETF数据
 */
/**
 * 获取单个ETF数据（带自动重试机制）
 * @param {Object} etf ETF配置对象
 * @param {Number} maxRetries 最大重试次数，默认3次
 */

async function fetchEtfData(etf, maxRetries = 3) {
    // 转换代码格式：sh518850 或 sz159259
    const fullCode = (etf.secid.startsWith('1') ? 'sh' : 'sz') + etf.code;
    // 获取最近 25 条日线数据
    const url = `https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get?param=${fullCode},day,,,25,qfq`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.get(url, { 
                timeout: 6000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            // 腾讯接口的数据结构较深
            const data = response.data.data[fullCode];
            const klines = data.day || data.qfqday; 

            if (klines && klines.length >= 21) {
                // 腾讯 kline 格式: ["2024-01-01", "开盘", "收盘", "最高", "最低", "成交量"]
                // 我们取收盘价 (index 2)
                const todayPrice = parseFloat(klines[klines.length - 1][2]);
                const twentyDaysAgoPrice = parseFloat(klines[klines.length - 21][2]);

                const ratio = ((todayPrice / twentyDaysAgoPrice) - 1) * 100;

                return {
                    code: etf.code,
                    name: etf.name,
                    indexName: etf.indexName,
                    ratio: parseFloat(ratio.toFixed(2)),
                    currentPrice: todayPrice
                };
            }
        } catch (e) {
            console.error(`[${etf.name}] 尝试 ${attempt} 失败: ${e.message}`);
        }
        // 增加等待时间
        await new Promise(resolve => setTimeout(resolve, 800 * attempt));
    }
    return null;
}


exports.main = async (event, context) => {


    // 一行代码搞定鉴权！
    // ============================================
    const authCheck = await checkUserPermission(app);
    // 如果要查管理员权限：await checkUserPermission(app, true);

    // 如果没通过，直接返回鉴权模块生成的错误信息
    // if (!authCheck.pass) {
    //     return authCheck.result;
    // }
    context.callbackWaitsForEmptyEventLoop = false

    // 1. 获取当前时间 (YYYY-MM-DD HH:mm)
    const updateTime = getBeijingTime()
    console.log(`执行开始，当前时间: ${updateTime}`)

    // 2. 并行请求接口
    const promises = ETF_TARGETS.map(etf => fetchEtfData(etf))
    const results = await Promise.all(promises)

    // 3. 过滤无效数据并排序 (从高到低)
    const validResults = results
        .filter(item => item !== null)
        .sort((a, b) => b.ratio - a.ratio)

    // 4. 组装最终列表 (添加 rank 排名)
    const list = validResults.map((item, index) => ({
        rank: index + 1,
        name: item.name,
        code: item.code,
        indexName: item.indexName,
        ratio: item.ratio
    }))

    // 5. 返回结果
    return {
        success: true,
        updateTime: updateTime, // 这里是你要求的时间字段
        list: list
    }
}