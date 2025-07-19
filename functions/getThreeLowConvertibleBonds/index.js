const axios = require('axios')
const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()
console.log(db)
/**
 * 格式化日期为 YYYYMMDD 的字符串 (根据新的API格式)
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDateForApi() {
    const today = new Date()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    return `${year}${month}${day}`
}

/**
 * 检查指定日期是否为A股交易日 (使用新的逻辑和API)
 * @returns {Promise<boolean>} - 如果是交易日则返回 true，否则返回 false
 */
async function isTradingDay() {
    const formattedDate = formatDateForApi()

    // 更换为一个能提供更详细信息的节假日API
    // 注意：这个API是第三方提供的，如果未来失效，可能需要更换
    const holidayApiUrl = `https://api.apihubs.cn/holiday/get?date=${formattedDate}&cn=1`

    console.log(`正在检查日期 ${formattedDate} 是否为A股交易日...`)

    try {
        const response = await axios.get(holidayApiUrl)

        // 根据您提供的JSON结构进行解析
        if (
            response.data &&
            response.data.code === 0 &&
            response.data.data.list &&
            response.data.data.list.length > 0
        ) {
            const dayInfo = response.data.data.list[0]

            // 新的、更精确的判断逻辑：必须同时是“工作日”和“非周末”
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
            // API返回数据格式不正确
            console.error('日历API返回数据格式异常，为安全起见，程序将不执行。')
            return false
        }
    } catch (error) {
        console.error(
            '检查交易日失败，无法连接到日历API。为安全起见，程序将不执行。',
            error.message
        )
        return false // 如果API查询失败，默认不执行
    }
}

// --- 主程序 (这部分与之前相同) ---

const authUrl = 'https://api.lude.site/v1/authorize/access-token/by-password'
const authPayload = {
    account: '15909839564',
    password: 'Empress929'
}

const dataUrl = 'https://api.lude.site/v1/quant/convertible-bond/realtime-screen'
const dataPayload = {
    parameters: {
        hold_method: {
            hold_range_type: 1,
            hold_range_start: 1,
            hold_range_end: 10,
            hold_max_weight: 1,
            hold_weight_type: 1,
            hold_threshold: '0'
        },
        rebalance_method: {
            rebalance_type: 0,
            rebalance_value: 1
        },
        stop_method: {
            stop_type: 0,
            stop_value: 0
        },
        hold_days: 0,
        rotation_type: 0,
        exclude_calls: [
            '已满足强赎条件',
            '公告提示强赎',
            '公告实施强赎',
            '已公告强赎',
            '公告到期赎回'
        ],
        exclude_st: true,
        exclude_list_days: 3,
        exclude_markets: [],
        exclude_org_types: [],
        exclude_areas: [],
        exclude_ratings: [],
        exclude_yy_ratings: [],
        exclude_bonds: [],
        rank_factors: [
            {
                selectedID: 'remain_size',
                enable: true,
                factor_name: '剩余规模(亿)',
                factor_key: 'remain_size',
                factor_type: 0,
                ascending: false,
                weight: '3'
            },
            {
                selectedID: 'close',
                enable: true,
                factor_name: '收盘价',
                factor_key: 'close',
                factor_type: 0,
                ascending: false,
                weight: '2'
            },
            {
                selectedID: 'conv_prem',
                enable: true,
                factor_name: '转股溢价率',
                factor_key: 'conv_prem',
                factor_type: 0,
                ascending: false,
                weight: '3'
            }
        ],
        filter_factors: [
            {
                selectedID: 'efu031lqdhf',
                enable: true,
                factor_name: '收盘价',
                factor_key: 'close',
                factor_type: 0,
                operation: 'gt',
                value: '130',
                convertRatio: 1
            },
            {
                selectedID: 'e7hdgq63n0d',
                enable: true,
                factor_name: '剩余规模(亿)',
                factor_key: 'remain_size',
                factor_type: 0,
                operation: 'gt',
                value: '5',
                convertRatio: 1
            },
            {
                selectedID: '9m39y3osgok',
                enable: true,
                factor_name: '剩余年限',
                factor_key: 'left_years',
                factor_type: 0,
                operation: 'lt',
                value: '1',
                convertRatio: 1
            },
            {
                selectedID: 'crwgy4zefrj',
                enable: true,
                factor_name: '收盘价',
                factor_key: 'close',
                factor_type: 0,
                operation: 'lt',
                value: '90',
                convertRatio: 1
            }
        ]
    },
    trade_date: formatDateForApi()
}

exports.main = async (event, context) => {
    // --- 第一步：检查今天是否是交易日 ---
    const todayIsTradingDay = await isTradingDay()

    if (!todayIsTradingDay) {
        console.log('\n程序已跳过执行。')
        return // 退出函数
    }

    // --- 如果是交易日，则继续执行以下逻辑 ---
    console.log('\n开始执行数据获取程序...')
    try {
        // --- 第二步：获取 token ---
        console.log('正在获取 access token...')
        const authResponse = await axios.post(authUrl, authPayload)

        if (authResponse.data.code !== 0) {
            console.error('获取 token 失败:', authResponse.data.msg)
            return
        }

        const accessToken = authResponse.data.data.access_token
        console.log('成功获取 access token!')

        // --- 第三步：使用 token 请求数据 ---
        console.log('正在使用 token 获取可转债数据...')
        const dataResponse = await axios.post(dataUrl, dataPayload, {
            headers: {
                'access-token': accessToken,
                'Content-Type': 'application/json'
            }
        })

        if (dataResponse.data.code !== 0) {
            console.error('获取数据失败:', dataResponse.data.msg)
            return
        }

        // --- 第四步：处理并打印数据 ---
        const responseData = dataResponse.data.data.list_items

        if (Array.isArray(responseData) && responseData.length > 0) {
            const data = responseData.slice(0, 10)
            const top10Data = data.map(item => ({
                code: item.code.split('.')[0],
                name: item.name,
                close: item.close.toFixed(2),
                remain_size: item.remain_size.toFixed(2),
                conv_prem: item.conv_prem.toFixed(4)
            }))
            console.log('\n成功获取数据，以下是返回数据中的前10个元素：')
            console.log(JSON.stringify(top10Data, null, 2))

            // ==========================================================
            // 新增/修改：将获取到的数据写入云数据库 (根据您提供的模板)
            // ==========================================================
            try {
                console.log('\n正在将数据写入云数据库...')
                const collection = db.collection('bond_data') // <-- 请确保这里的集合名正确

                // 使用 YYYYMMDD 格式的当天日期作为唯一ID，实现“存在即更新”
                const recordDateStr = formatDateForApi(new Date())
                const docId = recordDateStr

                // 准备要存入数据库的数据
                const dataToSave = {
                    record_date: recordDateStr, // 在文档中也存一份日期，方便查询
                    bonds: top10Data, // 保存获取到的前10条债券数据
                    last_updated: db.serverDate() // 使用服务端时间，更准确
                }

                // 使用 set 方法。如果文档存在则会覆盖更新，如果不存在则会创建。
                await collection.doc(docId).set(dataToSave)
                console.log(`成功保存或更新文档: ${docId}`)
            } catch (dbError) {
                console.error('写入数据库失败:', dbError)
                // 即使数据库写入失败，也让函数继续返回数据，但可以在日志中看到错误
            }
            // ==========================================================

            return { success: true, data: top10Data } // 函数最后返回成功和数据
        } else {
            console.log('返回的数据格式不正确，期望得到一个数组。')
            console.log('完整返回数据:', dataResponse.data)
        }
    } catch (error) {
        console.error('\n请求过程中发生错误:')
        if (error.response) {
            console.error('错误状态码:', error.response.status)
            console.error('错误响应:', error.response.data)
        } else if (error.request) {
            console.error('请求已发出但没有收到响应:', error.request)
        } else {
            console.error('请求设置错误:', error.message)
        }
    }
}
