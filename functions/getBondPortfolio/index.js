const tcb = require('@cloudbase/node-sdk')
const axios = require('axios') // 引入 axios
const checkUserPermission = require('./auth');

/**
 * 比较新旧两个组合，生成调仓建议
 * @param {Array} newPortfolio - 最新的可转债组合
 * @param {Array} oldPortfolio - 上一个交易日的可转债组合
 * @returns {Array} 调仓建议列表
 */
function generateAdjustments(newPortfolio, oldPortfolio) {
    // ... (此函数无需修改，保持原样)
    const newBondsCodeSet = new Set(newPortfolio.map(bond => bond.code))
    const oldBondsCodeSet = new Set(oldPortfolio.map(bond => bond.code))

    const adjustments = []

    // 1. 找出需要调入的转债
    for (const bond of newPortfolio) {
        if (!oldBondsCodeSet.has(bond.code)) {
            adjustments.push({
                name: bond.name,
                code: bond.code,
                action: '调入'
            })
        }
    }

    // 2. 找出需要调出的转债
    for (const bond of oldPortfolio) {
        if (!newBondsCodeSet.has(bond.code)) {
            adjustments.push({
                name: bond.name,
                code: bond.code,
                action: '调出'
            })
        }
    }

    return adjustments
}


/**
 * 【修改点 1】: 修改 fetchMarketOverview，让它返回更多原始数据
 * 从集思录获取可转债市场概览数据
 * @returns {Promise<Object>} 市场概览数据 和 原始API数据
 */
async function fetchMarketOverview() {
    const url = 'https://www.jisilu.cn/webapi/cb/index_quote/'
    const defaultData = {
        overview: {
            equal_weight_index: 0,
            equal_weight_change_pct: 0,
            median_price: 0,
            median_premium_rate: 0,
            price_distribution: {
                lt_90: 0, btw_90_100: 0, btw_100_110: 0,
                btw_110_120: 0, btw_120_130: 0, gt_130: 0
            }
        },
        last_time: null // 新增一个字段用于返回原始更新时间
    };

    try {
        console.log('开始请求集思录市场数据...')
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
            }
        });

        if (response.data && response.data.code === 200) {
            console.log('成功获取集思录市场数据。')
            const data = response.data.data;

            return {
                overview: {
                    equal_weight_index: data.cur_index || 0,
                    equal_weight_change_pct: (data.cur_increase_rt || 0) / 100,
                    median_price: data.mid_price || 0,
                    median_premium_rate: (data.mid_premium_rt || 0) / 100,
                    price_distribution: {
                        lt_90: data.price_90 || 0,
                        btw_90_100: data.price_90_100 || 0,
                        btw_100_110: data.price_100_110 || 0,
                        btw_110_120: data.price_110_120 || 0,
                        btw_120_130: data.price_120_130 || 0,
                        gt_130: data.price_130 || 0
                    }
                },
                last_time: data.last_time // 返回 last_time
            };
        } else {
            console.warn('集思录API返回非200状态码或数据格式不正确:', response.data);
            return defaultData;
        }
    } catch (error) {
        console.error('请求集思录市场数据时发生错误:', error.message);
        return defaultData;
    }
}

/**
 * 【新增辅助函数】: 根据当前时间和API返回时间，生成最终显示的时间戳
 * @param {string | null} apiTimestamp - 从API获取的 "YYYY-MM-DD HH:mm:ss" 格式的时间字符串
 * @returns {string} - 格式化后的时间字符串
 */
function getDisplayTimestamp(apiTimestamp) {
    if (!apiTimestamp) {
        return '获取中...'
    }

    // 获取当前北京时间 (UTC+8)
    const now = new Date();
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const currentHour = chinaTime.getUTCHours(); // 因为我们已经加了8小时，所以用getUTCHours获取的就是北京时间的小时
    const currentMinute = chinaTime.getUTCMinutes();

    const apiDatePart = apiTimestamp.split(' ')[0]; // 获取API日期部分 "YYYY-MM-DD"

    // 逻辑判断
    // 1. 交易开始前 (9:30之前)，显示昨日收盘数据
    if (currentHour < 9 || (currentHour === 9 && currentMinute < 30)) {
        return `${apiDatePart} 15:00 (昨日收盘)`;
    }
    // 2. 午间休市 (11:30 到 13:00)，显示上午收盘数据
    else if ((currentHour === 11 && currentMinute >= 30) || currentHour === 12) {
        return `${apiDatePart} 11:30 (上午收盘)`;
    }
    // 3. 全天收盘后 (15:00之后)，显示当日收盘数据
    else if (currentHour >= 15) {
        return `${apiDatePart} 15:00 (今日收盘)`;
    }
    // 4. 其它交易时间段，直接显示API返回的实时时间
    else {
        return apiTimestamp + ' (实时)';
    }
}


exports.main = async (event, context) => {
    // 初始化 SDK
    const app = tcb.init();

    const authCheck = await checkUserPermission(app);
    // 如果要查管理员权限：await checkUserPermission(app, true);

    // 如果没通过，直接返回鉴权模块生成的错误信息
    if (!authCheck.pass) {
        return authCheck.result;
    }


    const db = app.database()

    try {
        // 使用 Promise.all 并发执行数据库查询和API请求
        const dbQueryPromise = db.collection('bond_data')
            .orderBy('record_date', 'desc')
            .limit(2)
            .get();

        const marketDataPromise = fetchMarketOverview(); // 修改变量名

        // 等待两个异步操作都完成
        const [queryResult, marketData] = await Promise.all([
            dbQueryPromise,
            marketDataPromise
        ]);

        // 【修改点 2】: 从 marketData 中解构出所需数据，并调用新函数
        const { overview: marketOverview, last_time: apiLastTime } = marketData;
        const displayTimestamp = getDisplayTimestamp(apiLastTime);

        if (!queryResult.data || queryResult.data.length === 0) {
            console.log('数据库中没有找到任何数据。')
            return {
                success: false,
                message: '数据库中没有数据。'
            }
        }

        const latestRecord = queryResult.data[0]
        const latestPortfolio = latestRecord.bonds || []

        let adjustments = []
        let message = '成功获取最新数据。'

        if (queryResult.data.length > 1) {
            console.log('找到两条记录，开始生成调仓建议...')
            const previousRecord = queryResult.data[1]
            const previousPortfolio = previousRecord.bonds || []
            adjustments = generateAdjustments(latestPortfolio, previousPortfolio)
            message = '成功获取最新数据并生成调仓建议。'
            console.log('调仓建议生成完毕:', adjustments)
        } else {
            console.log('数据库中只有一条记录，无法生成调仓建议。')
            message = '成功获取最新数据，但数据不足以生成调仓建议。'
        }

        // 【修改点 3】: 在返回结果中加入新生成的时间戳
        return {
            success: true,
            message: message,
            latest_date: latestRecord.record_date,
            latest_portfolio: latestPortfolio,
            adjustments: adjustments,
            market_overview: marketOverview, // 这是处理好的市场数据
            market_data_timestamp: displayTimestamp // 这是新增的、用于显示的精确时间
        }
    } catch (error) {
        console.error('获取或处理数据时发生错误:', error)
        return {
            success: false,
            message: '服务器内部错误，无法获取数据。',
            error: error.message
        }
    }
}