const axios = require('axios')
const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()

// --- 配置区域 ---
const COLLECTION_NAME = 'momentum'
// 定义数据库中唯一文档的 ID，保证永远只存一条数据
const UNIQUE_DOC_ID = 'latest_strategy_analysis'
const SWITCH_THRESHOLD_PERCENT = 2


// ETF 配置列表
const ETF_TARGETS = [
    { secid: '0.159682', code: '159682', name: '创业50ETF', indexName: '创业板50' },
    { secid: '1.518850', code: '518850', name: '黄金ETF华夏', indexName: '黄金9999' },
    { secid: '0.159659', code: '159659', name: '纳斯达克100ETF', indexName: '纳斯达克100' },
    { secid: '0.159259', code: '159259', name: '成长ETF易方达', indexName: '国证成长100' },
    { secid: '1.563020', code: '563020', name: '红利低波ETF易方达', indexName: '中证红利低波' }
]

/**
 * 格式化日期为 YYYYMMDD (用于API请求)
 */
function formatDateForApi() {
    const today = new Date()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    return `${year}${month}${day}`
}

/**
 * 格式化完整时间 (用于记录更新时间)
 */
function formatTime() {
    const now = new Date()
    // UTC+8
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const year = beijingTime.getUTCFullYear()
    const month = (beijingTime.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = beijingTime.getUTCDate().toString().padStart(2, '0')
    const hour = beijingTime.getUTCHours().toString().padStart(2, '0')
    const minute = beijingTime.getUTCMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 格式化简单日期 (用于记录调仓日期 YYYY-MM-DD)
 */
function formatDateSimple() {
    const now = new Date()
    const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    const year = beijingTime.getUTCFullYear()
    const month = (beijingTime.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = beijingTime.getUTCDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * 检查A股交易日
 */
async function isTradingDay() {
    const formattedDate = formatDateForApi()
    const holidayApiUrl = `https://api.apihubs.cn/holiday/get?date=${formattedDate}&cn=1`
    console.log(`正在检查日期 ${formattedDate} 是否为A股交易日...`)
    try {
        const response = await axios.get(holidayApiUrl)
        if (
            response.data &&
            response.data.code === 0 &&
            response.data.data.list &&
            response.data.data.list.length > 0
        ) {
            const dayInfo = response.data.data.list[0]
            const isWorkday = dayInfo.workday_cn === '工作日'
            const isNotWeekend = dayInfo.weekend_cn === '非周末'
            if (isWorkday && isNotWeekend) {
                console.log(`结果：判定为A股交易日。`)
                return true
            } else {
                console.log(`结果：判定为非A股交易日。`)
                return false
            }
        }
        return false
    } catch (error) {
        console.error('检查交易日失败:', error.message)
        return false
    }
}

/**
 * 获取单个ETF数据（基于腾讯财经接口，计算20日动量）
 */
async function fetchEtfData(etf, maxRetries = 3) {
    // 1. 转换代码格式：1.518850 -> sh518850, 0.159259 -> sz159259
    const prefix = etf.secid.startsWith('1') ? 'sh' : 'sz';
    const fullCode = `${prefix}${etf.code}`;

    // 请求最近 21 条日线数据（为了计算 20 日动量，需要 21 个端点）
    const url = `https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get?param=${fullCode},day,,,25,qfq`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[${etf.name}] 正在第 ${attempt} 次请求数据...`);

            const response = await axios.get(url, {
                timeout: 6000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            // 2. 解析腾讯特定的嵌套数据结构
            const stockData = response.data?.data?.[fullCode];
            // 腾讯有时返回 day，有时返回 qfqday（前复权日线）
            const klines = stockData?.day || stockData?.qfqday;

            if (klines && klines.length >= 2) {
                // kline 格式: ["2024-02-27", "1.230", "1.245", "1.250", "1.220", "123456"]
                // 索引: 0:日期, 1:开盘, 2:收盘, 3:最高, 4:最低

                const firstDayData = klines[klines.length - 21];
                const lastDayData = klines[klines.length - 1];

                const firstPrice = parseFloat(firstDayData[2]); // 20日前的收盘价
                const lastPrice = parseFloat(lastDayData[2]);  // 最新收盘价

                // 3. 计算涨幅 (20日动量)
                const ratio = ((lastPrice / firstPrice) - 1) * 100;

                // 保持与你要求的返回结构一致
                return {
                    code: etf.code,
                    name: etf.name,
                    indexName: etf.indexName,
                    current_price: lastPrice,
                    start_price: firstPrice,
                    ratio: parseFloat(ratio.toFixed(4)),
                    data_date: lastDayData[0] // 腾讯的数据日期格式通常是 YYYY-MM-DD
                };
            } else {
                console.warn(`[${etf.name}] 接口返回数据结构异常或长度不足`);
            }
        } catch (e) {
            console.error(`[${etf.name}] 请求失败: ${e.message}`);
        }

        // 失败重试前增加小额延迟，避免频率限制
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 600));
        }
    }

    return null;
}


// --- 主程序 ---
exports.main = async (event, context) => {

    context.callbackWaitsForEmptyEventLoop = false;

    // 1. 检查交易日
    const todayIsTradingDay = await isTradingDay()
    if (!todayIsTradingDay) {
        console.log('非交易日，程序退出。')
        return 'Not a trading day'
    }

    console.log('\n开始获取ETF轮动数据...')

    // 2. 并行获取所有ETF数据
    const promises = ETF_TARGETS.map(etf => fetchEtfData(etf))
    const results = await Promise.all(promises)

    // 3. 过滤掉失败的请求
    const validResults = results.filter(item => item !== null)

    if (validResults.length === 0) {
        console.error('所有ETF数据获取均失败，程序退出')
        return 'All fetch failed'
    }

    // 4. 排序：按照 ratio 从高到低排序
    validResults.sort((a, b) => b.ratio - a.ratio)

    // 当前的第一名
    const currentTop1 = validResults[0];

    // 5. 数据库处理
    try {
        const collection = db.collection(COLLECTION_NAME)

        // --- 步骤A: 先读取旧数据 ---
        let prevTop1Code = null;
        let prevSwitchDate = formatDateSimple(); // 默认为今天 (如果是第一次运行)
        let prevTop1Name = '无记录';

        try {
            // 读取指定的唯一文档
            const recordRes = await collection.doc(UNIQUE_DOC_ID).get();
            if (recordRes.data && recordRes.data.length > 0) {
                // 如果数据库里有数据，提取出来
                const oldData = recordRes.data[0];
                prevTop1Code = oldData.top_1_code;
                prevTop1Name = oldData.top_1_name;
                // 获取上次保存的调仓日期
                if (oldData.switch_date) {
                    prevSwitchDate = oldData.switch_date;
                }
            } else {
                console.log('数据库为空，本次为初始化运行');
            }
        } catch (e) {
            // 如果文档不存在(首次运行)，可能会报错，忽略错误继续执行
            console.log('读取历史数据异常(可能是首次运行):', e.message);
        }

        // --- 步骤B: 比较逻辑 ---
        let finalSwitchDate = formatDateSimple(); // 最终要保存的日期
        let isSwitchTriggered = false; // 标记今天是否触发了切换
        let selectedTop1 = currentTop1; // 最终保存的当前持仓标的

        if (prevTop1Code) {
            if (String(prevTop1Code) !== String(currentTop1.code)) {
                const prevHolding = validResults.find(item => String(item.code) === String(prevTop1Code));
                if (prevHolding && currentTop1.ratio > prevHolding.ratio + SWITCH_THRESHOLD_PERCENT) {
                    // 情况1: 冠军变了且动量超过当前持仓 2% -> 调仓日期 = 今天
                    console.log(`>>> 发生轮动切换: ${prevTop1Name} -> ${currentTop1.name}`);
                    finalSwitchDate = formatDateSimple(); // 更新为今天
                    isSwitchTriggered = true;
                } else {
                    const prevRatioText = prevHolding ? `${prevHolding.ratio}%` : '获取失败';
                    const requiredRatioText = prevHolding ? `${(prevHolding.ratio + SWITCH_THRESHOLD_PERCENT).toFixed(4)}%` : '未知';
                    console.log(`>>> 维持原持仓: ${prevTop1Name}，候选 ${currentTop1.name} 动量 ${currentTop1.ratio}%，当前持仓动量 ${prevRatioText}，需超过 ${requiredRatioText}`);
                    selectedTop1 = prevHolding || { code: prevTop1Code, name: prevTop1Name };
                    finalSwitchDate = prevSwitchDate;
                    isSwitchTriggered = false;
                }
            } else {
                // 情况2: 冠军没变 -> 调仓日期 = 沿用旧日期
                console.log(`>>> 维持原状: 冠军依然是 ${currentTop1.name}`);
                finalSwitchDate = prevSwitchDate; // 保持不变
                isSwitchTriggered = false;
            }
        } else {
            // 第一次运行，默认就是今天
            isSwitchTriggered = true;
        }

        // --- 步骤C: 覆盖保存数据 ---
        const dataToSave = {
            // 必须：记录更新时间
            updated_at: formatTime(),       // 也就是 "check_date"

            // 核心业务数据
            ranking: validResults,          // 完整排名
            top_1_name: selectedTop1.name,
            top_1_code: selectedTop1.code,

            // 历史对比数据
            prev_top_1_name: prevTop1Name, // 上次是谁
            prev_top_1_code: prevTop1Code,

            // 调仓逻辑字段
            switch_date: finalSwitchDate,  // 调仓日期 (关键字段)
            is_switch_triggered: isSwitchTriggered // 今天是否刚刚发生了切换
        }

        // 使用 set() 方法，针对同一个 ID 进行覆盖
        await collection.doc(UNIQUE_DOC_ID).set(dataToSave)

        console.log(`数据更新成功，文档ID: ${UNIQUE_DOC_ID}`)
        console.log(`当前调仓日期: ${finalSwitchDate}`)

        // --- 步骤D: 推送通知 (新增逻辑) ---
        // 条件：发生了调仓 (isSwitchTriggered 为 true)
        if (isSwitchTriggered) {
            console.log('>>> 触发调仓，正在调用通知服务...');

            try {
                // 使用 cloud.callFunction 调用刚才写的 notify-service
                await app.callFunction({
                    name: 'notification', // 确保你的新云函数叫这个名字
                    data: {
                        type: 'momentum', // 指定模板类型
                        data: {
                            prevName: prevTop1Name,
                            currentName: currentTop1.name,
                            code: currentTop1.code,
                            ratio: currentTop1.ratio,
                            date: finalSwitchDate
                        }
                    }
                });
                console.log('通知服务调用成功');
            } catch (notifyError) {
                console.error('调用通知服务失败:', notifyError);
            }
        }

        return {
            success: true,
            msg: `处理完成。榜首: ${currentTop1.name}, 调仓日期: ${finalSwitchDate}`,
            data: dataToSave
        }

    } catch (dbError) {
        console.error('写入数据库失败:', dbError)
        return { success: false, error: dbError.message }
    }
}
