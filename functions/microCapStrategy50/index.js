const axios = require('axios');
const tcb = require('@cloudbase/node-sdk');

// --- 配置区域 ---
const app = tcb.init();
const db = app.database();
const cmd = db.command;
// --- 头部引入增加 http/https agent ---
const http = require('http');
const https = require('https');

// Bark 推送地址 (替换为你自己的)
const BARK_URL = process.env.MICRO_CAP_BARK_URL || '';

// 创建保持连接的 Agent，减少 TCP 握手开销
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const COLLECTION_NAME = 'micro_cap_history';
const CONFIG_DOC_ID = '__STRATEGY_CONFIG__';
const TARGET_NUM = 30;
const FUND_UTILIZATION = 0.999; // 99.9% 资金利用率

function getBeijingTime() {
    const now = new Date();
    const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return {
        dateId: bjTime.toISOString().split('T')[0],
        fullTime: bjTime.toISOString().replace('T', ' ').split('.')[0],
        dayOfWeek: bjTime.getUTCDay()
    };
}

async function isTradingDay() {
    const { dateId } = getBeijingTime();
    const dateStr = dateId.replace(/-/g, '');
    const url = `https://api.apihubs.cn/holiday/get?date=${dateStr}&cn=1`;
    try {
        const res = await axios.get(url, { timeout: 3000 });
        if (res.data.code === 0 && res.data.data.list.length > 0) {
            const dayInfo = res.data.data.list[0];
            return dayInfo.workday_cn === '工作日' && dayInfo.weekend_cn === '非周末';
        }
    } catch (e) {
        console.error('交易日接口超时', e.message);
        return true;
    }
    return false;
}

// 动态获取策略配置（金额 + Cookie）
async function getStrategyConfig() {
    try {
        const res = await db.collection(COLLECTION_NAME).doc(CONFIG_DOC_ID).get();
        if (res.data && res.data.length > 0) {
            return {
                planAmount: Number(res.data[0].next_day_plan_amount) || 0,
                cookie: res.data[0].xueqiu_cookie || '' // 🟢 获取数据库里的 Cookie
            };
        }
    } catch (e) {
        console.log('读取配置失败，使用默认值');
    }
    return { planAmount: 0, cookie: '' };
}

// 封装一个带重试功能的通用请求函数
async function axiosRetry(url, options, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            // 增加随机 User-Agent 防止被简单的反爬虫策略拒绝
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Connection': 'keep-alive',
                ...options.headers
            };

            // 使用配置好的 Agent
            return await axios.get(url, {
                ...options,
                headers,
                httpAgent,
                httpsAgent,
                timeout: 6000 // 稍微延长超时时间到 6秒
            });
        } catch (err) {
            const isLastAttempt = i === retries - 1;
            console.warn(`[Network] 请求失败 (${i + 1}/${retries}): ${err.message}`);

            if (isLastAttempt) throw err;
            // 等待一段时间重试 (指数退避: 1s, 2s, 4s...)
            await new Promise(res => setTimeout(res, delay * (i + 1)));
        }
    }
}

/**
 * 【算法完全复刻 + 精度修复 + 停牌锁定】
 * @param {Array} stocks 当前股票列表
 * @param {Number} totalFunds 总计划资金
 * @param {Map} prevHoldingsMap 昨日持仓详情 (用于锁定停牌股)
 */
function calculateAllocation(stocks, totalFunds, prevHoldingsMap) {
    console.log(`[Algo] 开始分配，总资金: ${totalFunds}`);

    if (!stocks || stocks.length === 0) return stocks;
    if (totalFunds <= 0) {
        return stocks.map(s => ({ ...s, plan_shares: 0, plan_amount: 0 }));
    }

    // --- 步骤1: 锁定停牌且持仓的股票资金 ---
    let lockedFunds = 0;
    let activeStocksCount = 0; // 真正参与新一轮分配的活跃股票数

    for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];

        // 如果是停牌股，并且我们持有它
        if (stock.is_suspended && prevHoldingsMap.has(stock.code)) {
            const oldInfo = prevHoldingsMap.get(stock.code);
            const oldShares = oldInfo.plan_shares || 0;

            // 强制设定为原持仓数量（锁仓）
            stock.plan_shares = oldShares;
            stock.plan_amount = parseFloat((oldShares * stock.price).toFixed(2));

            // 累加占用资金
            lockedFunds += stock.plan_amount;
            console.log(`[Algo] 锁定停牌股: ${stock.name} (${stock.code}), 占用资金: ${stock.plan_amount}`);
        } else {
            // 正常交易的股票才计数
            activeStocksCount++;
            // 初始化一下，防止后面有残留
            stock.plan_shares = 0;
            stock.plan_amount = 0;
        }
    }

    // --- 步骤2: 计算剩余可分配资金 ---
    const fundsForAllocation = (totalFunds * FUND_UTILIZATION) - lockedFunds;
    // 使用浮点数修正
    let remainingFunds = parseFloat(fundsForAllocation.toFixed(2));

    console.log(`[Algo] 停牌占用: ${lockedFunds.toFixed(2)}, 实际可用资金: ${remainingFunds}, 活跃股数: ${activeStocksCount}`);

    if (remainingFunds < 0) {
        console.warn('[Algo] 警告：停牌占用资金超过了目标仓位资金，无法买入新股');
        remainingFunds = 0;
    }

    // --- 步骤3: 对活跃股票进行均摊分配 ---
    let activeIndex = 0;

    for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];

        // 跳过已处理的停牌股
        if (stock.is_suspended && prevHoldingsMap.has(stock.code)) continue;
        // 如果数据异常或者是停牌但未持仓(理论上会被fetch过滤，防卫性编程)
        if (stock.is_suspended) continue;

        const currentPrice = stock.price;

        if (!currentPrice || currentPrice <= 0) {
            stock.plan_shares = 0;
            stock.plan_amount = 0;
            continue;
        }

        // 1. 动态计算单只理想金额 (剩余资金 / 剩余还没分配的活跃股)
        const remainingActiveStocks = activeStocksCount - activeIndex;
        // 防止除以0
        const idealInvestmentPerStock = remainingActiveStocks > 0 ? (remainingFunds / remainingActiveStocks) : 0;

        // 2. 四舍五入取整 (Math.round)
        const idealShares = idealInvestmentPerStock / currentPrice;
        let sharesToBuy = Math.round(idealShares / 100) * 100;

        // 3. 强制兜底买一手逻辑
        if (sharesToBuy === 0 && remainingFunds >= currentPrice * 100) {
            sharesToBuy = 100;
        } else if (sharesToBuy === 0) {
            // 确实没钱买了
            sharesToBuy = 0;
        }

        // 4. 计算成本 (修正精度)
        let actualCost = parseFloat((sharesToBuy * currentPrice).toFixed(2));

        // 5. 循环递减，直到买得起
        while (actualCost > remainingFunds && sharesToBuy > 0) {
            sharesToBuy -= 100;
            actualCost = parseFloat((sharesToBuy * currentPrice).toFixed(2));
        }

        // 6. 写入
        if (sharesToBuy > 0) {
            // 精度修正
            remainingFunds = parseFloat((remainingFunds - actualCost).toFixed(2));

            stock.plan_shares = sharesToBuy;
            stock.plan_amount = actualCost;
        } else {
            stock.plan_shares = 0;
            stock.plan_amount = 0;
        }

        activeIndex++;
    }

    const totalUsed = lockedFunds + (fundsForAllocation - remainingFunds);
    console.log(`[Algo] 分配结束。总使用(含停牌): ${totalUsed.toFixed(2)}，总利用率: ${(totalUsed / totalFunds * 100).toFixed(2)}%`);

    return stocks;
}

/**
 * 替换为雪球 API 的拉取函数
 * @param {Set} prevHoldingsSet 昨天的持仓集合（用于停牌过滤）
 */
async function fetchRawMicroCaps(prevHoldingsSet,currentCookie) {

    // 🟢 帮你想到的防错：如果在前端把 Cookie 删空了，直接报警拦截
    if (!currentCookie || currentCookie.trim() === '') {
        const errorMsg = '【紧急】微盘策略：未配置雪球 Cookie，请前往控制台填写！';
        console.error(errorMsg);
        try {
            await axios.get(`${BARK_URL}/${encodeURIComponent('Cookie为空')}/${encodeURIComponent(errorMsg)}?level=timeSensitive`);
        } catch (e) { }
        throw new Error('缺少雪球 Cookie，策略中止');
    }

    // 动态组装 Header
    const dynamicHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://xueqiu.com/hq/screener',
        'Origin': 'https://xueqiu.com',
        'Cookie': currentCookie, // 🟢 注入动态 Cookie
        'Connection': 'keep-alive'
    };
    const url = 'https://stock.xueqiu.com/v5/stock/screener/quote/list.json';
    const validStocks = [];
    const processedCodes = new Set(); // 去重记录
    let page = 1;

    console.log('[Fetch] 开始从雪球拉取微盘数据...');

    while (validStocks.length < TARGET_NUM) {
        const params = {
            page: page,
            size: 100,
            order: 'asc',
            order_by: 'market_capital',
            market: 'CN',
            type: 'sh_sz',
        };

        try {
            // 直接使用 axios 发起请求，携带全局配置的 Agent
            const res = await axios.get(url, {
                params,
                headers: dynamicHeaders,
                httpAgent,
                httpsAgent,
                timeout: 8000
            });

            if (res.data.error_code !== 0) {
                throw new Error(`雪球 API 业务错误: ${res.data.error_description}`);
            }

            const rawList = res.data.data.list;
            if (!rawList || rawList.length === 0) {
                console.log('[Fetch] 数据已全部拉完，无法凑齐目标数量');
                break;
            }

            for (const item of rawList) {
                if (validStocks.length >= TARGET_NUM) break;

                const symbol = item.symbol;
                const code = symbol.replace(/^(SH|SZ)/, '');
                const name = item.name;

                // --- 去重逻辑 ---
                if (processedCodes.has(code)) continue;
                processedCodes.add(code);

                // --- 1. 板块与名称过滤 ---
                const isMainBoard = code.startsWith('60') || code.startsWith('00');
                const isChiNext = code.startsWith('30');
                if (!isMainBoard && !isChiNext) continue;
                if (name.includes('ST') || name.includes('退')) continue;

                // --- 2. 停牌判断逻辑 (雪球中停牌股通常 volume 交易量为 0) ---
                let isSuspended = false;
                let price = item.current;

                // 如果交易量为 0 或者当前价格异常，视作停牌
                if (item.volume === 0 || !price || price <= 0) {
                    isSuspended = true;
                    if (!price || price <= 0) continue; // 连价格都没有的脏数据直接扔掉
                }

                // 如果该股票停牌，且我们昨天并没有持有它，直接跳过不买
                if (isSuspended && !prevHoldingsSet.has(code)) continue;

                // --- 3. 组装符合原版算法结构的数据 ---
                validStocks.push({
                    code: code,
                    name: name,
                    price: price, // 雪球的 price 直接是元(例如 5.67)，不需要像东财那样除以 100
                    ratio: isSuspended ? 0 : item.percent,
                    mkt_cap: Number((item.market_capital / 100000000).toFixed(4)), // 转化为“亿”
                    is_suspended: isSuspended
                });
            }

            console.log(`[Fetch] 第 ${page} 页处理完毕，当前有效收集: ${validStocks.length}/${TARGET_NUM}`);

            // 如果还没收集满，翻页并延迟 1.5 秒防止被封 IP
            if (validStocks.length < TARGET_NUM) {
                page++;
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

        } catch (error) {
            // ================= 核心：Cookie 失效报警逻辑 =================
            if (error.response && error.response.status === 400) {
                const alertMsg = '【紧急】微盘策略：雪球 Cookie 已过期，请尽快更换！';
                console.error(`[CRITICAL] 状态码 400 - ${alertMsg}`);

                try {
                    const title = encodeURIComponent('微盘策略异常');
                    const body = encodeURIComponent(alertMsg);
                    // 添加 level=timeSensitive 可以在 iOS 上突破专注模式强制提醒
                    await axios.get(`${BARK_URL}/${title}/${body}?level=timeSensitive`);
                    console.log('Bark Cookie 失效通知已发送');
                } catch (notifyErr) {
                    console.error('Bark 通知发送失败:', notifyErr.message);
                }

                // 直接终止云函数，不继续执行
                throw new Error('雪球 Cookie 鉴权失败，云函数终止执行');
            }
            // ==========================================================

            // 处理其他意外网络错误（如超时等），如果是普通的超时可以尝试重试，或者直接抛出交由云函数平台重试
            console.error(`[Fetch Error] 第 ${page} 页请求失败:`, error.message);
            throw error;
        }
    }

    if (validStocks.length === 0) throw new Error('未找到符合条件的股票');
    return validStocks;
}
exports.main = async (event, context) => {
    // 1. 交易日检查
    const isWorking = await isTradingDay();
    console.log(`是否交易日: ${isWorking}`);
    if (!isWorking) return { msg: '非交易日' };

    // 2. 读取配置 (同时拿到资金和Cookie)
    const config = await getStrategyConfig();
    const planAmount = config.planAmount;
    const xueqiuCookie = config.cookie;

    // --- 3. 提前获取昨日持仓 (用于判断停牌股去留) ---
    const { dateId, fullTime, dayOfWeek } = getBeijingTime();
    const collection = db.collection(COLLECTION_NAME);

    // 3.1 查昨日
    const historyRes = await collection
        .where({
            _id: cmd.lte(dateId),
            _id: cmd.neq(CONFIG_DOC_ID)
        })
        .orderBy('_id', 'desc')
        .limit(3)
        .get();

    let prevHoldingsMap = new Map();
    let prevHoldingsSet = new Set();
    let prevData = null;

    if (historyRes.data.length > 0) {
        for (const item of historyRes.data) {
            if (item._id !== dateId) {
                prevData = item;
                break;
            }
        }
    }

    if (prevData) {
        console.log(`对比昨日数据: ${prevData._id}`);
        (prevData.ranking || []).forEach(item => {
            // 只有仓位>0才算有效持仓
            if (item.plan_shares > 0) {
                prevHoldingsMap.set(item.code, item);
                prevHoldingsSet.add(item.code);
            }
        });
    }

    // 4. 爬取数据 (传入持仓集合，停牌且未持仓的会被过滤)
    let currentList = await fetchRawMicroCaps(prevHoldingsSet, xueqiuCookie);

    // 5. 分配资金 (传入持仓Map，停牌且持仓的会被锁定资金)
    currentList = calculateAllocation(currentList, planAmount, prevHoldingsMap);

    // 6. 生成调仓建议
    const adjustments = [];
    const currentCodes = new Set(currentList.map(i => i.code));

    // A. 卖出
    prevHoldingsMap.forEach((oldItem, code) => {
        if (!currentCodes.has(code)) {
            // 注意：如果停牌且被过滤掉了，这里会生成卖出信号
            // 但按照 fetchRawMicroCaps 的逻辑，停牌且持仓的会被强制保留在 currentList
            // 所以停牌股不会走到这里，除非手动人工干预
            adjustments.push({
                code: code,
                name: oldItem.name,
                price: oldItem.price,
                action: 'sell',
                type: 'clear',
                count: oldItem.plan_shares || 0,
                is_suspended: oldItem.is_suspended
            });
        }
    });

    // B. 买入/调仓
    currentList.forEach(newItem => {
        const oldItem = prevHoldingsMap.get(newItem.code);

        if (!oldItem) {
            if (newItem.plan_shares > 0) {
                adjustments.push({
                    code: newItem.code,
                    name: newItem.name,
                    price: newItem.price,
                    action: 'buy',
                    type: 'new',
                    count: newItem.plan_shares,
                    is_suspended: newItem.is_suspended
                });
            }
        } else {
            const diff = newItem.plan_shares - (oldItem.plan_shares || 0);
            if (diff > 0) {
                adjustments.push({
                    code: newItem.code,
                    name: newItem.name,
                    price: newItem.price,
                    action: 'buy',
                    type: 'add',
                    count: diff,
                    is_suspended: newItem.is_suspended
                });
            } else if (diff < 0) {
                adjustments.push({
                    code: newItem.code,
                    name: newItem.name,
                    price: newItem.price,
                    action: 'sell',
                    type: 'reduce',
                    count: Math.abs(diff),
                    is_suspended: newItem.is_suspended
                });
            }
        }
    });

    // 7. 保存
    const dataToSave = {
        updated_at: fullTime,
        weekday: dayOfWeek,
        plan_amount_used: planAmount,
        ranking: currentList,
        adjustments: adjustments,
        market_data_timestamp: fullTime
    };

    await collection.doc(dateId).set(dataToSave);

    return { success: true, id: dateId, data: dataToSave };
};
