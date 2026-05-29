const axios = require('axios');
const tcb = require('@cloudbase/node-sdk');
const http = require('http');
const https = require('https');

// Bark 推送地址 (替换为你自己的)
const BARK_URL = process.env.MICRO_CAP_BARK_URL || '';

// --- 配置区域 ---
const app = tcb.init();
const db = app.database();
const cmd = db.command;

// 10只策略的历史记录集合
const COLLECTION_NAME = 'micro_cap_top10_history';
const TARGET_NUM = 10;

// --- 网络优化配置 ---
// 1. 创建保持连接的 Agent，减少握手开销，防止 socket hang up
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });


// 2. 封装带重试机制的请求函数
async function axiosRetry(url, options, retries = 3) {
    // 增加浏览器标识，防止反爬
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Connection': 'keep-alive',
        ...options.headers
    };

    for (let i = 0; i < retries; i++) {
        try {
            return await axios.get(url, {
                ...options,
                headers,
                httpAgent,
                httpsAgent,
                timeout: 6000 // 延长超时时间到 6秒
            });
        } catch (error) {
            const isLastAttempt = i === retries - 1;
            if (isLastAttempt) {
                // 最后一次也失败，抛出异常
                throw error;
            }
            // 等待时间：第1次1秒，第2次2秒...
            const delay = 1000 * (i + 1);
            console.warn(`[Network] 请求失败，${delay}ms 后重试 (${i + 1}/${retries})... Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * 跨表读取主策略集合中的统一 Cookie 配置
 */
async function getStrategyConfig() {
    try {
        // 注意：这里强行去主集合 micro_cap_history 里面拿配置，实现双策略共享 Cookie
        const res = await db.collection('micro_cap_history').doc('__STRATEGY_CONFIG__').get();
        if (res.data && res.data.length > 0) {
            return res.data[0].xueqiu_cookie || '';
        }
    } catch (e) {
        console.log('读取雪球 Cookie 配置失败', e.message);
    }
    return '';
}


/**
 * 获取北京时间工具函数
 */
function getBeijingTime() {
    const now = new Date();
    const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return {
        dateId: bjTime.toISOString().split('T')[0],
        fullTime: bjTime.toISOString().replace('T', ' ').split('.')[0],
        dayOfWeek: bjTime.getUTCDay()
    };
}

/**
 * 交易日检查
 */
async function isTradingDay() {
    const { dateId } = getBeijingTime();
    const dateStr = dateId.replace(/-/g, '');
    const url = `https://api.apihubs.cn/holiday/get?date=${dateStr}&cn=1`;
    try {
        // 这里也使用重试机制，防止鉴权接口偶尔抖动
        const res = await axiosRetry(url, { timeout: 3000 }, 2);
        if (res.data.code === 0 && res.data.data.list.length > 0) {
            const dayInfo = res.data.data.list[0];
            return dayInfo.workday_cn === '工作日' && dayInfo.weekend_cn === '非周末';
        }
    } catch (e) {
        console.error('交易日接口超时或失败，默认视为交易日继续执行', e.message);
        return true;
    }
    return false;
}

/**
 * 爬取微盘股原始数据 (Top 10 + 停牌逻辑)
 * @param {Set} prevHoldingsSet 昨日持仓代码集合，用于判断停牌股去留
 */
/**
 * 爬取微盘股原始数据 (Top 10 + 停牌逻辑) - 雪球 API 版
 * @param {Set} prevHoldingsSet 昨日持仓代码集合，用于判断停牌股去留
 */
async function fetchRawMicroCaps(prevHoldingsSet, currentCookie) {

    // 🟢 1. 防错校验：如果没配置 Cookie 直接熔断
    if (!currentCookie || currentCookie.trim() === '') {
        const errorMsg = '【紧急】微盘Top10：未配置雪球 Cookie，请前往前端页面设置！';
        console.error(errorMsg);
        try {
            await axios.get(`${BARK_URL}/${encodeURIComponent('Cookie为空')}/${encodeURIComponent(errorMsg)}?level=timeSensitive`);
        } catch (e) { }
        throw new Error('缺少雪球 Cookie，Top10策略中止');
    }

    // 🟢 2. 动态组装 Header
    const dynamicHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://xueqiu.com/hq/screener',
        'Origin': 'https://xueqiu.com',
        'Cookie': currentCookie,
        'Connection': 'keep-alive'
    };

    const url = 'https://stock.xueqiu.com/v5/stock/screener/quote/list.json';
    const validStocks = [];
    const processedCodes = new Set(); // 防止分页数据漂移导致的重复
    let pageIndex = 1;
    let consecutiveFailures = 0;

    console.log('开始从雪球拉取前 10 只微盘数据，识别停牌状态...');

    while (validStocks.length < TARGET_NUM) {
        const params = {
            page: pageIndex,
            size: 100,
            order: 'asc',
            order_by: 'market_capital',
            market: 'CN',
            type: 'sh_sz',
        };

        try {
            // 直接使用 axios 发起请求，400 错误不需要走 axiosRetry 盲目重试
            const res = await axios.get(url, {
                params,
                headers: dynamicHeaders,
                httpAgent,
                httpsAgent,
                timeout: 8000
            });

            // 成功则重置失败计数
            consecutiveFailures = 0;

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

                const code = item.symbol.replace(/^(SH|SZ)/, '');
                const name = item.name;

                // --- 1. 去重检查 ---
                if (processedCodes.has(code)) continue;
                processedCodes.add(code);

                // --- 2. 基础过滤 (仅主板) ---
                const isMainBoard = code.startsWith('60') || code.startsWith('00');
                if (!isMainBoard) continue;
                if (name.includes('ST') || name.includes('退')) continue;

                // --- 3. 停牌检测核心逻辑 ---
                let isSuspended = false;
                let price = item.current;

                // 雪球停牌股特征：volume 为 0 或 current 价格异常
                if (item.volume === 0 || !price || price <= 0) {
                    isSuspended = true;
                    if (!price || price <= 0) continue; // 没价格的脏数据直接扔掉
                }

                // --- 4. 停牌换仓策略逻辑 ---
                // 如果是停牌股，且昨天没持有它，直接跳过
                if (isSuspended && !prevHoldingsSet.has(code)) continue;

                validStocks.push({
                    code: code,
                    name: name,
                    price: price, // 雪球价格已经是元，无需除以 100
                    mktCap: Number((item.market_capital / 100000000).toFixed(2)), // 转换为亿，保留2位小数(与原逻辑一致)
                    is_suspended: isSuspended
                });
            }

            if (validStocks.length >= TARGET_NUM) break;

            pageIndex++;
            // 延迟 1 秒防封
            await new Promise(r => setTimeout(r, 1000));

        } catch (error) {
            // ================= 核心：Cookie 失效报警逻辑 =================
            if (error.response && error.response.status === 400) {
                const alertMsg = '【紧急】微盘Top10：雪球 Cookie 已过期，请尽快更换！';
                console.error(`[CRITICAL] 状态码 400 - ${alertMsg}`);

                try {
                    const title = encodeURIComponent('微盘Top10鉴权失败');
                    const body = encodeURIComponent(alertMsg);
                    // level=timeSensitive 可以在 iOS 突破专注模式强制提醒
                    await axios.get(`${BARK_URL}/${title}/${body}?level=timeSensitive`);
                    console.log('Bark Cookie 失效通知已发送');
                } catch (notifyErr) {
                    console.error('Bark 通知发送失败:', notifyErr.message);
                }

                throw new Error('鉴权失败，已中断执行');
            }
            // ==========================================================

            // 普通网络错误的重试逻辑
            consecutiveFailures++;
            console.error(`第 ${pageIndex} 页获取失败 (${consecutiveFailures}/3):`, error.message);

            if (consecutiveFailures >= 3) {
                const errorMsg = `[CRITICAL] 第 ${pageIndex} 页连续网络请求失败 3 次，策略已停止。`;
                // 连续失败发送普通通知
                try {
                    await axios.get(`${BARK_URL}/${encodeURIComponent('网络异常')}/${encodeURIComponent(errorMsg)}`);
                } catch (e) { }
                throw new Error(errorMsg);
            }

            const waitTime = 2000 * consecutiveFailures;
            console.log(`等待 ${waitTime}ms 后重试当前页...`);
            await new Promise(r => setTimeout(r, waitTime));
        }
    }

    if (validStocks.length === 0) throw new Error('未找到符合条件的股票');
    return validStocks;
}

exports.main = async (event, context) => {
    // 1. 交易日检查
    const isWorking = await isTradingDay();
    if (!isWorking) return { msg: '非交易日，不执行策略更新' };

    // 🟢 新增：获取统一的雪球 Cookie
    const xueqiuCookie = await getStrategyConfig();

    const { dateId, fullTime, dayOfWeek } = getBeijingTime();
    const collection = db.collection(COLLECTION_NAME);

    // 2. 获取昨日持仓 (用于对比停牌股)
    const historyRes = await collection
        .where({ _id: cmd.neq(dateId) })
        .orderBy('_id', 'desc')
        .limit(1)
        .get();

    let prevHoldingsMap = new Map();
    let prevHoldingsSet = new Set();
    if (historyRes.data.length > 0) {
        const prevData = historyRes.data[0];
        console.log(`对比昨日数据日期: ${prevData._id}`);
        (prevData.ranking || []).forEach(item => {
            prevHoldingsMap.set(item.code, item);
            prevHoldingsSet.add(item.code);
        });
    }

    // 3. 爬取当前最新的 Top 10 (传入持仓集合处理停牌锁定)
    try {
        let currentList = await fetchRawMicroCaps(prevHoldingsSet,xueqiuCookie);

        // 4. 生成调仓建议
        const adjustments = [];
        const currentCodes = new Set(currentList.map(i => i.code));

        // A. 卖出 (Sell)
        prevHoldingsMap.forEach((oldItem, code) => {
            if (!currentCodes.has(code)) {
                adjustments.push({
                    code: code,
                    name: oldItem.name,
                    action: 'sell',
                    type: 'out',
                    is_suspended: oldItem.is_suspended || false
                });
            }
        });

        // B. 买入 (Buy)
        currentList.forEach(newItem => {
            if (!prevHoldingsMap.has(newItem.code)) {
                if (!newItem.is_suspended) {
                    adjustments.push({
                        code: newItem.code,
                        name: newItem.name,
                        action: 'buy',
                        type: 'in'
                    });
                }
            }
        });

        // 5. 构造结果
        const resultData = {
            updated_at: fullTime,
            latest_date: dateId,
            latest_portfolio: currentList,
            adjustments: adjustments
        };

        // 6. 存入数据库
        const dbData = {
            date_str: dateId,
            updated_at: fullTime,
            weekday: dayOfWeek,
            ranking: currentList,
            adjustments: adjustments,
            market_data_timestamp: fullTime
        };

        await collection.doc(dateId).set(dbData);

        await app.callFunction({
            name: 'notification',
            data: {
                type: 'micro_cap',
                data: {}
            }
        })
        console.log(`策略数据更新成功: ${dateId}`);

        return {
            success: true,
            result: resultData
        };

    } catch (err) {
        console.error('策略执行严重错误:', err);
        // 返回错误信息给调用方，方便排查
        return {
            success: false,
            error: err.message
        };
    }
};