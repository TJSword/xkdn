const axios = require('axios')
const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()

/**
 * 格式化日期为 YYYYMMDD 的字符串 (根据新的API格式)
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDateForApi() {
    // 1. 获取当前系统时间
    const d = new Date()

    // 2. 计算当前 UTC 时间的毫秒数 
    // (getTime() 是当前时间戳，getTimezoneOffset() 是本地与UTC的分差，乘以60000转为毫秒)
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000)

    // 3. 加上北京时间的偏移量 (UTC + 8小时)
    // 3600000 毫秒 = 1 小时
    const beijingDate = new Date(utc + (3600000 * 8))

    // 4. 使用调整后的 beijingDate 对象获取年月日
    const year = beijingDate.getFullYear()
    const month = (beijingDate.getMonth() + 1).toString().padStart(2, '0')
    const day = beijingDate.getDate().toString().padStart(2, '0')

    return `${year}${month}${day}`
}

/**
 * 检查指定日期是否为A股交易日 (使用新的逻辑和API)
 * @returns {Promise<boolean>} - 如果是交易日则返回 true，否则返回 false
 */
async function isTradingDay() {
    const formattedDate = formatDateForApi()
    console.log(formattedDate)
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
                console.log(
                    `结果：今天是“${dayInfo.workday_cn}”且是“${dayInfo.weekend_cn}”，判定为A股交易日。`
                )
                return true
            } else {
                console.log(
                    `结果：今天是“${dayInfo.workday_cn}”，“${dayInfo.weekend_cn}”，判定为非A股交易日。`
                )
                return false
            }
        } else {
            console.error('日历API返回数据格式异常，为安全起见，程序将不执行。')
            return false
        }
    } catch (error) {
        console.error(
            '检查交易日失败，无法连接到日历API。为安全起见，程序将不执行。',
            error.message
        )
        return false
    }
}


/**
 * 异步函数，用于从集思录获取可转债指数行情数据，并提取中位数价格 (mid_price)
 * @returns {Promise<number|null>} - 成功则返回 mid_price 数字，失败则返回 null
 */
async function getJSLMidPrice() {
    const url = 'https://www.jisilu.cn/webapi/cb/index_quote/';
    console.log('\n正在从集思录获取动态价格...');

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (response.data && response.data.code === 200 && response.data.data && typeof response.data.data.mid_price !== 'undefined') {
            const midPrice = response.data.data.mid_price;
            console.log(`成功获取到集思录中位数价格 (mid_price): ${midPrice}`);
            return midPrice;
        } else {
            console.error('获取集思录价格失败：API返回的数据格式不正确。');
            return null;
        }
    } catch (error) {
        console.error('请求集思录API时发生错误:', error.message);
        return null;
    }
}


// --- 主程序 (这部分与之前相同) ---

const authUrl = 'https://api.lude.site/v1/authorize/access-token/by-password'
const authPayload = {
    account: process.env.LUDE_ACCOUNT,
    password: process.env.LUDE_PASSWORD,
    type: 1,
    client: process.env.LUDE_CLIENT || 'web'
}

const dataUrl = 'https://api.lude.site/v2/quant/convertible-bond/screen/realtime'
// 注意：我们将 dataPayload 移到 main 函数内部，因为它现在依赖动态值
// const dataPayload = { ... } // 这部分移到下面


const payload_S1 = {
    "parameters": {
        "security_pools": [],
        "hold_method": {
            "hold_range_type": 1,
            "hold_range_start": 1,
            "hold_range_end": 10,
            "hold_max_weight": 1,
            "hold_weight_type": 2,
            "hold_threshold": 0
        },
        "rebalance_method": {
            "rebalance_type": 0,
            "rebalance_value": 1
        },
        "stop_method": {
            "stop_type": 1,
            "stop_value": 0.06
        },
        "hold_days": 0,
        "rotation_type": 0,
        "exclude_calls": [
            "已满足强赎条件",
            "公告提示强赎",
            "公告实施强赎",
            "已公告强赎",
            "公告到期赎回"
        ],
        "exclude_st": true,
        "exclude_list_days": 30,
        "exclude_redeem_remain_days": null,
        "exclude_markets": [],
        "exclude_org_types": [],
        "exclude_areas": [],
        "exclude_ratings": [
            "CCC",
            "C",
            "CC",
            "BB",
            "BB-",
            "B+",
            "B",
            "B-",
            "BBB+",
            "BBB",
            "BBB-",
            "BB+"
        ],
        "exclude_yy_ratings": [
            "10",
            "9",
            "8-"
        ],
        "exclude_bonds": [],
        "rank_factors": [
            {
                "index": 0,
                "selectedID": "bond_prem",
                "enable": true,
                "factor_name": "纯债溢价率",
                "factor_key": "bond_prem",
                "factor_type": 0,
                "ascending": false,
                "weight": 8,
                "neutralization": [],
                "missing_process": "forward_fill"
            },
            {
                "index": 1,
                "selectedID": "conv_prem",
                "enable": true,
                "factor_name": "转股溢价率",
                "factor_key": "conv_prem",
                "factor_type": 0,
                "ascending": false,
                "weight": 1,
                "neutralization": null,
                "missing_process": "forward_fill"
            },
            {
                "index": 2,
                "selectedID": "remain_size",
                "enable": true,
                "factor_name": "剩余规模(亿)",
                "factor_key": "remain_size",
                "factor_type": 0,
                "ascending": false,
                "weight": 4,
                "neutralization": null,
                "missing_process": "forward_fill"
            },
            {
                "index": 3,
                "selectedID": "alpha_pct_chg_5",
                "enable": true,
                "factor_name": "5日超额涨跌幅",
                "factor_key": "alpha_pct_chg_5",
                "factor_type": 2,
                "ascending": false,
                "weight": "2",
                "neutralization": null,
                "missing_process": "forward_fill"
            },
            {
                "index": 4,
                "selectedID": "volatility_stk",
                "enable": true,
                "factor_name": "正股年化波动率",
                "factor_key": "volatility_stk",
                "factor_type": 0,
                "ascending": true,
                "weight": 6,
                "neutralization": null,
                "missing_process": "forward_fill"
            },
            {
                "index": 5,
                "selectedID": "bias_5",
                "enable": true,
                "factor_name": "5日乖离率",
                "factor_key": "bias_5",
                "factor_type": 2,
                "ascending": false,
                "weight": "2",
                "neutralization": null,
                "missing_process": "forward_fill"
            },
            {
                "index": 6,
                "selectedID": "volatility",
                "enable": true,
                "factor_name": "年化波动率",
                "factor_key": "volatility",
                "factor_type": 0,
                "ascending": true,
                "weight": "2",
                "neutralization": null,
                "missing_process": "forward_fill"
            },
            {
                "index": 7,
                "selectedID": "custom_eSRIU",
                "factor_name": "宁稳双低",
                "factor_key": "custom_eSRIU",
                "factor_type": 1,
                "ascending": false,
                "weight": 10,
                "enable": true
            }
        ],
        "filter_factors": [
            {
                "selectedID": "gmkj173ktjf",
                "enable": true,
                "factor_name": "收盘价",
                "factor_key": "close",
                "factor_type": 0,
                "operation": "gt_rank",
                "value": 0.95,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "jfz1x674zk",
                "enable": true,
                "factor_name": "剩余年限",
                "factor_key": "left_years",
                "factor_type": 0,
                "operation": "lt_rank",
                "value": 0.04,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "23dmdmjiork",
                "enable": true,
                "factor_name": "收盘价",
                "factor_key": "close",
                "factor_type": 0,
                "operation": "lt",
                "value": 82,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "tav8vcnnioc",
                "enable": true,
                "factor_name": "强赎剩余计数",
                "factor_key": "redeem_remain_days",
                "factor_type": 3,
                "operation": "lt",
                "value": 13,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "hxhuhocnmkv",
                "enable": true,
                "factor_name": "成交额(万)",
                "factor_key": "amount",
                "factor_type": 0,
                "operation": "lt_rank",
                "value": 0.03,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "artr6ckvipt",
                "enable": true,
                "factor_name": "涨跌幅",
                "factor_key": "pct_chg",
                "factor_type": 0,
                "operation": "gt",
                "value": 0.1,
                "viewStyle": 1,
                "convertRatio": 1
            },
            {
                "selectedID": "p43jf9evfi",
                "enable": true,
                "factor_name": "资产负债率",
                "factor_key": "debt_to_assets",
                "factor_type": 0,
                "operation": "gt_rank",
                "value": 0.9,
                "viewStyle": 1,
                "convertRatio": 1
            },
            {
                "selectedID": "3pjp63l2auh",
                "enable": true,
                "factor_name": "转股溢价率",
                "factor_key": "conv_prem",
                "factor_type": 0,
                "operation": "gt_rank",
                "value": 0.77,
                "viewStyle": 1,
                "convertRatio": 1
            },
            {
                "selectedID": "af7sn3ief6e",
                "enable": true,
                "factor_name": "剩余规模(亿)",
                "factor_key": "remain_size",
                "factor_type": 0,
                "operation": "gt",
                "value": 17,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "qyb4shay8x",
                "enable": true,
                "factor_name": "剩余规模(亿)",
                "factor_key": "remain_size",
                "factor_type": 0,
                "operation": "lt",
                "value": 1.8,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "6n33733knio",
                "enable": true,
                "factor_name": "收盘价",
                "factor_key": "close",
                "factor_type": 0,
                "operation": "lt_rank",
                "value": 0.04,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "b3swvgb9ooc",
                "enable": true,
                "factor_name": "5日成交额",
                "factor_key": "amount_5",
                "factor_type": 2,
                "operation": "lt_rank",
                "value": 0.03,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "0abm7oz598n7",
                "enable": true,
                "factor_name": "正股收盘价",
                "factor_key": "close_stk",
                "factor_type": 0,
                "operation": "lt",
                "value": 0.8,
                "viewStyle": 3,
                "convertRatio": 1
            },
            {
                "selectedID": "u9dgqg5dnd",
                "enable": true,
                "factor_name": "成交额(万)",
                "factor_key": "amount",
                "factor_type": 0,
                "operation": "lt",
                "value": 700,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "nezhru34bqc",
                "enable": true,
                "factor_name": "剩余年限",
                "factor_key": "left_years",
                "factor_type": 0,
                "operation": "lt",
                "value": 1,
                "viewStyle": 0,
                "convertRatio": 1
            }
        ],
        "link_factors": []
    },
    "trade_date": formatDateForApi(),
    "answer_mode": 0
}
// 专属策略
const payload_S2 = {
    "parameters": {
        "security_pools": [],
        "hold_method": {
            "hold_range_type": 1,
            "hold_range_start": 1,
            "hold_range_end": 5,
            "hold_max_weight": 1,
            "hold_weight_type": 1,
            "hold_threshold": "0"
        },
        "rebalance_method": {
            "rebalance_type": 0,
            "rebalance_value": 1
        },
        "stop_method": {
            "stop_type": 1,
            "stop_value": 0.06
        },
        "hold_days": 0,
        "rotation_type": 0,
        "exclude_calls": [
            "已满足强赎条件",
            "公告提示强赎",
            "公告实施强赎",
            "已公告强赎",
            "公告到期赎回"
        ],
        "exclude_st": true,
        "exclude_list_days": 3,
        "exclude_redeem_remain_days": null,
        "exclude_markets": [],
        "exclude_org_types": [],
        "exclude_areas": [],
        "exclude_ratings": [],
        "exclude_yy_ratings": [],
        "exclude_bonds": [],
        "rank_factors": [
            {
                "index": 0,
                "selectedID": "custom_vugQL",
                "enable": true,
                "factor_name": "双低20日分位",
                "factor_key": "custom_vugQL",
                "factor_type": 1,
                "ascending": false,
                "weight": "4",
                "neutralization": null,
                "missing_process": "market_mean"
            },
            {
                "index": 1,
                "selectedID": "option_value",
                "enable": true,
                "factor_name": "期权价值",
                "factor_key": "option_value",
                "factor_type": 0,
                "ascending": true,
                "weight": "1",
                "neutralization": null,
                "missing_process": "market_mean"
            },
            {
                "index": 2,
                "selectedID": "bias_5",
                "enable": true,
                "factor_name": "5日乖离率",
                "factor_key": "bias_5",
                "factor_type": 2,
                "ascending": false,
                "weight": "5",
                "neutralization": null,
                "missing_process": "market_mean"
            }
        ],
        "filter_factors": [
            {
                "selectedID": "igj0apf09m9",
                "enable": true,
                "factor_name": "收盘价",
                "factor_key": "close",
                "factor_type": 0,
                "operation": "gt",
                "value": 130,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "rahtrki09s",
                "enable": true,
                "factor_name": "剩余年限",
                "factor_key": "left_years",
                "factor_type": 0,
                "operation": "lt",
                "value": 0.5,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "pw1qw7cvb6n",
                "enable": true,
                "factor_name": "收盘价",
                "factor_key": "close",
                "factor_type": 0,
                "operation": "lt",
                "value": "90",
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "meezbed1qed",
                "enable": true,
                "factor_name": "强赎剩余计数",
                "factor_key": "redeem_remain_days",
                "factor_type": 3,
                "operation": "lt",
                "value": 5,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "71i2fn7iamr",
                "enable": true,
                "factor_name": "成交额(万)",
                "factor_key": "amount",
                "factor_type": 0,
                "operation": "lt",
                "value": 1000,
                "viewStyle": 0,
                "convertRatio": 1
            },
            {
                "selectedID": "sjhbjyukelg",
                "enable": true,
                "factor_name": "涨跌幅",
                "factor_key": "pct_chg",
                "factor_type": 0,
                "operation": "gt",
                "value": 0.06,
                "viewStyle": 1,
                "convertRatio": 1
            }
        ],
        "link_factors": []
    },
    "trade_date": formatDateForApi(),
    "answer_mode": 0
}


exports.main = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    // 1. 检查交易日
    const todayIsTradingDay = await isTradingDay()
    if (!todayIsTradingDay) {
        console.log('\n程序已跳过执行。')
        return
    }

    // 2. 获取 Token (两个策略共用一个 Token)
    console.log('正在获取 access token...')
    if (!authPayload.account || !authPayload.password) {
        console.error('量化接口账号配置缺失')
        return
    }

    let accessToken = ''
    try {
        const authResponse = await axios.post(authUrl, authPayload)
        if (authResponse.data.code !== 0) {
            console.error('获取 token 失败:', authResponse.data.msg)
            return
        }
        accessToken = authResponse.data.data.access_token
        console.log('成功获取 access token!')
    } catch (e) {
        console.error('获取 Token 异常:', e.message)
        return
    }

    // 3. 执行策略逻辑
    // 为了防止代码重复，我们调用一个封装函数来分别处理两个策略

    console.log('\n>>> 开始处理 策略1 ...')
    await processStrategy({
        strategyName: '三低',
        collectionName: 'bond_data',      // 策略1 存原来的集合
        payload: payload_S1,              // 策略1 的参数
        accessToken: accessToken,
        notifyType: 'convertible',        // 策略1 的通知类型 (对应通知云函数的 case)
        app: app // 传入tcb app实例
    });

    // console.log('\n>>> 开始处理 策略2 ...')
    // await processStrategy({
    //     strategyName: '惊蛰',
    //     collectionName: 'bond_data_s2',   // 【新建】策略2 建议存新集合
    //     payload: payload_S2,              // 策略2 的参数
    //     accessToken: accessToken,
    //     notifyType: 'convertible_s2',     // 【新建】策略2 的通知类型
    //     app: app
    // });

    return { success: true, msg: '所有策略执行完毕' }
}

/**
 * 通用策略处理函数：获取数据 -> 读取历史 -> 对比 -> 入库 -> 通知
 */
/**
 * 通用策略处理函数：获取数据 -> 读取历史 -> 对比 -> 入库 -> 通知
 */
/**
 * 通用策略处理函数 (纯净版：自动查找上一交易日对比)
 */
async function processStrategy({ strategyName, collectionName, payload, accessToken, notifyType, app }) {
    const db = app.database()
    const _ = db.command // 获取数据库操作符
    const collection = db.collection(collectionName)

    // 1. 获取今天的日期字符串 (作为本次入库ID)
    const todayStr = formatDateForApi()

    // 更新 payload 中的日期
    payload.trade_date = todayStr

    try {
        // =======================
        // A. 请求最新数据 (保持不变)
        // =======================
        console.log(`[${strategyName}] 正在请求数据...`)
        const dataResponse = await axios.post(dataUrl, payload, {
            headers: { 'access-token': accessToken, 'Content-Type': 'application/json' }
        })

        console.log(dataResponse.data.data.list_items[0])
        if (dataResponse.data.code !== 0) {
            console.error(`[${strategyName}] API返回错误:`, dataResponse.data.msg)
            return
        }
        const listItems = dataResponse.data.data.list_items
        if (!Array.isArray(listItems) || listItems.length === 0) {
            console.log(`[${strategyName}] 没有筛选出符合条件的可转债。`)
            return
        }

        // 提取前5名
        const currentHoldings = listItems.slice(0, 10).map(item => ({
            code: item.code.split('.')[0],
            name: item.name,
            price: parseFloat(item.close.toFixed(3)),
            premium: parseFloat(item.conv_prem?.toFixed(4)) || 0,
            scale: parseFloat(item.remain_size?.toFixed(2)) || 0
        }))


        // =======================
        // B. 动态查找“上一条”持仓
        // =======================
        let prevHoldings = []
        try {
            // 逻辑：查找 record_date 小于今天的记录中，日期最大（最近）的那一条
            const historyRes = await collection
                .where({
                    record_date: _.lt(todayStr) // 关键：必须小于今天 (防止重复运行读取到自己)
                })
                .orderBy('record_date', 'desc') // 倒序排列
                .limit(1) // 只取一条
                .get()

            if (historyRes.data && historyRes.data.length > 0) {
                const lastRecord = historyRes.data[0]
                // 兼容读取 bonds 字段
                prevHoldings = lastRecord.bonds || []
                console.log(`[${strategyName}] 成功读取上一交易日数据 (${lastRecord.record_date})`)
            } else {
                console.log(`[${strategyName}] 未找到历史数据，本次将视为建仓。`)
            }
        } catch (e) {
            console.log(`[${strategyName}] 读取历史数据异常:`, e.message)
        }


        // =======================
        // C. 计算买卖点 (保持不变)
        // =======================
        const currentCodes = currentHoldings.map(i => i.code)
        const prevCodes = prevHoldings.map(i => i.code)

        const sellList = prevHoldings.filter(item => !currentCodes.includes(item.code))
        const buyList = currentHoldings.filter(item => !prevCodes.includes(item.code))


        // =======================
        // D. 数据入库 (只存一份！)
        // =======================
        // 既然页面也是读 bonds，这里统一存 bonds
        try {
            await collection.doc(todayStr).set({
                record_date: todayStr, // 必须有，用于排序
                bonds: currentHoldings,
                last_updated: db.serverDate()
            })
            console.log(`[${strategyName}] 今日数据已归档: ${todayStr}`)
        } catch (e) {
            console.error(`[${strategyName}] 归档失败`, e)
        }


        // =======================
        // E. 触发通知 (保持不变)
        // =======================
        console.log(`[${strategyName}] 正在调用通知服务...`)

        await app.callFunction({
            name: 'notification',
            data: {
                type: notifyType,
                data: {
                    sell: sellList,
                    buy: buyList,
                    holdings: currentHoldings
                }
            }
        })
        console.log(`[${strategyName}] 通知指令已发送`)

    } catch (error) {
        console.error(`[${strategyName}] 执行异常:`, error.message)
    }
}
