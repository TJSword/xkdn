const axios = require('axios');
const tcb = require('@cloudbase/node-sdk');
const http = require('http');
const https = require('https');

// --- 配置区域 ---
const app = tcb.init();
const db = app.database();

// Bark 推送地址在云函数环境变量中配置
const BARK_URL = process.env.MICRO_CAP_BARK_URL || '';

// 网络优化
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

/**
 * 1. 获取北京时间工具函数
 */
function getBeijingTime() {
    const now = new Date();
    const bjTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return {
        dateId: bjTime.toISOString().split('T')[0]
    };
}

/**
 * 2. 交易日检查
 */
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
        console.error('交易日接口超时，默认视为交易日继续执行预检', e.message);
        return true; 
    }
    return false;
}

/**
 * 3. 跨表读取主策略集合中的统一 Cookie 配置
 */
async function getStrategyConfig() {
    try {
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
 * 4. 发送 Bark 紧急通知
 */
async function sendBarkAlert(message) {
    try {
        const title = encodeURIComponent('⚠️ 微盘策略预检失败');
        const body = encodeURIComponent(message);
        // 使用 timeSensitive 级别，确保能突破手机的专注模式/睡眠模式
        const url = `${BARK_URL}/${title}/${body}?level=timeSensitive`;
        await axios.get(url, { timeout: 3000 });
        console.log('Bark 预警通知已发送');
    } catch (err) {
        console.error('Bark 通知发送失败:', err.message);
    }
}

// --- 主函数 ---
exports.main = async (event, context) => {
    console.log('开始执行微盘策略 9:25 预检...');

    // 第一步：校验是否为交易日
    const isWorking = await isTradingDay();
    if (!isWorking) {
        console.log('非交易日，无需预检，程序退出。');
        return { success: true, msg: '非交易日，无需预检' };
    }

    // 第二步：获取 Cookie 配置
    const currentCookie = await getStrategyConfig();
    
    // 如果数据库里压根没配 Cookie，直接报警
    if (!currentCookie || currentCookie.trim() === '') {
        const msg = '数据库中未配置雪球 Cookie，请立即前往前端页面设置！';
        console.error(msg);
        await sendBarkAlert(msg);
        return { success: false, msg };
    }

    // 第三步：向雪球发起极简请求测试鉴权 (只请求 1 条数据)
    const url = 'https://stock.xueqiu.com/v5/stock/screener/quote/list.json';
    const params = {
        page: 1,
        size: 30, // 只拿一条数据验证连通性，极低负载
        order: 'asc',
        order_by: 'market_capital',
        market: 'CN',
        type: 'sh_sz',
    };

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://xueqiu.com/hq/screener',
        'Origin': 'https://xueqiu.com',
        'Cookie': currentCookie,
        'Connection': 'keep-alive'
    };

    try {
        const res = await axios.get(url, {
            params,
            headers,
            httpAgent,
            httpsAgent,
            timeout: 5000 // 5秒超时
        });

        // 业务逻辑错误判断
        if (res.data.error_code !== 0) {
            throw new Error(res.data.error_description || '雪球业务拦截');
        }

        console.log('✅ 预检通过：Cookie 正常有效，网络连通性良好。');
        return { success: true, msg: '预检通过，Cookie 正常' };

    } catch (error) {
        // 重点捕获 400 状态码 (Cookie 鉴权失败)
        if (error.response && error.response.status === 400) {
            const msg = '雪球 Cookie 已过期 (400)！距离策略运行还有5分钟，请立即在前端页面重新粘贴！';
            console.error(`[CRITICAL] ${msg}`);
            await sendBarkAlert(msg);
            return { success: false, msg };
        } 
        // 捕获 403 / 429 等封禁或限流错误
        else if (error.response && (error.response.status === 403 || error.response.status === 429)) {
            const msg = `雪球 IP 被封禁或限流 (状态码: ${error.response.status})，请关注！`;
            console.error(msg);
            await sendBarkAlert(msg);
            return { success: false, msg };
        }
        // 其他网络超时或崩溃错误
        else {
            const msg = `雪球接口连通性异常: ${error.message}，可能是网络波动。`;
            console.error(msg);
            // 这里你可以决定是否要因为普通的网络波动发报警，以防打扰
            await sendBarkAlert(msg); 
            return { success: false, msg };
        }
    }
};
