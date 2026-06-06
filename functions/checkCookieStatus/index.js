const axios = require('axios');
const tcb = require('@cloudbase/node-sdk');
const http = require('http');
const https = require('https');

// --- 配置区域 ---
const app = tcb.init();
const db = app.database();

// Bark 推送地址
const BARK_URL = 'https://api.day.app/pUZ7nRaYpjiHdLb7NjeXPc';

// 网络优化
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

/**
 * 读取主策略集合中的统一 Cookie 配置
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
 * 发送 Bark 紧急通知
 */
async function sendBarkAlert(message) {
    try {
        const title = encodeURIComponent('⚠️ 微盘策略预检失败');
        const body = encodeURIComponent(message);
        const url = `${BARK_URL}/${title}/${body}?level=timeSensitive`;
        await axios.get(url, { timeout: 3000 });
        console.log('Bark 预警通知已发送');
    } catch (err) {
        console.error('Bark 通知发送失败:', err.message);
    }
}

// --- 主函数 ---
exports.main = async () => {
    console.log('开始执行微盘策略 16:00 Cookie 预检...');

    const currentCookie = await getStrategyConfig();

    if (!currentCookie || currentCookie.trim() === '') {
        const msg = '数据库中未配置雪球 Cookie，请立即前往前端页面设置！';
        console.error(msg);
        await sendBarkAlert(msg);
        return { success: false, msg };
    }

    const url = 'https://stock.xueqiu.com/v5/stock/screener/quote/list.json';
    const params = {
        page: 1,
        size: 30,
        order: 'asc',
        order_by: 'market_capital',
        market: 'CN',
        type: 'sh_sz'
    };

    const headers = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://xueqiu.com/hq/screener',
        Origin: 'https://xueqiu.com',
        Cookie: currentCookie,
        Connection: 'keep-alive'
    };

    try {
        const res = await axios.get(url, {
            params,
            headers,
            httpAgent,
            httpsAgent,
            timeout: 5000
        });

        if (res.data.error_code !== 0) {
            throw new Error(res.data.error_description || '雪球业务拦截');
        }

        console.log('✅ 预检通过：Cookie 正常有效，网络连通性良好。');
        return { success: true, msg: '预检通过，Cookie 正常' };
    } catch (error) {
        if (error.response && error.response.status === 400) {
            const msg = '雪球 Cookie 已过期 (400)，请立即在前端页面重新粘贴！';
            console.error(`[CRITICAL] ${msg}`);
            await sendBarkAlert(msg);
            return { success: false, msg };
        } else if (error.response && (error.response.status === 403 || error.response.status === 429)) {
            const msg = `雪球 IP 被封禁或限流 (状态码: ${error.response.status})，请关注！`;
            console.error(msg);
            await sendBarkAlert(msg);
            return { success: false, msg };
        } else {
            const msg = `雪球接口连通性异常: ${error.message}，可能是网络波动。`;
            console.error(msg);
            await sendBarkAlert(msg);
            return { success: false, msg };
        }
    }
};
