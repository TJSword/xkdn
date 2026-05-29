const axios = require('axios')

// ================= 配置区域 =================

const parseEnvList = name => (process.env[name] || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

const MICRO_CAP_BARK = parseEnvList('MICRO_CAP_BARK_KEYS')
const MICRO_CAP_WECHAT = parseEnvList('MICRO_CAP_WECHAT_KEYS')
const BOND_BARK = parseEnvList('BOND_BARK_KEYS')
const BOND_WECHAT = parseEnvList('BOND_WECHAT_KEYS')
const BOND_S2_BARK = parseEnvList('BOND_S2_BARK_KEYS')
const MOMENTUM_BARK = parseEnvList('MOMENTUM_BARK_KEYS')
const MOMENTUM_WECHAT = parseEnvList('MOMENTUM_WECHAT_KEYS')
const BARK_ICON = process.env.BARK_ICON_URL || ''



// ================= 主程序 =================
exports.main = async (event, context) => {
    const { type, data } = event
    let title = ''
    let contentText = ''
    let contentMarkdown = ''

    // 定义本次发送的目标群体，默认为空
    let targetBarkKeys = []
    let targetWechatKeys = []

    switch (type) {
        // --- 场景 1: 动量策略 ---
        case 'momentum':
            title = '⚡ 动量策略调仓提醒'
            targetBarkKeys = MOMENTUM_BARK // 使用名单1
            targetWechatKeys = MOMENTUM_WECHAT // 使用企微
            const switchMsg = `卖出：${data.prevName}\n买入：${data.currentName} (${data.code})\n近20日涨幅：${data.ratio}%`

            contentText = switchMsg

            contentMarkdown = `### ⚡ 动量策略调仓提醒
> **卖出标的**：<font color="comment">${data.prevName}</font>
> **买入标的**：<font color="warning">${data.currentName}</font> (${data.code})
> **阶段涨幅**：<font color="info">${data.ratio}%</font>
> **调仓日期**：${data.date || formatDateSimple()}`
            break;

        // --- 场景 2: 可转债调仓 (支持多只买卖) ---
        case 'convertible':
            targetBarkKeys = BOND_BARK;
            targetWechatKeys = BOND_WECHAT;

            const { sell, buy, holdings } = data;

            // 兼容处理：确保是数组
            const sellList = Array.isArray(sell) ? sell : (sell ? [sell] : []);
            const buyList = Array.isArray(buy) ? buy : (buy ? [buy] : []);

            // 核心判断：是否有买卖操作
            const hasChangeS1 = sellList.length > 0 || buyList.length > 0;

            if (!hasChangeS1) {
                // === 分支 A: 无调仓 (文案优化) ===
                title = '🔄 转债策略调仓提醒';
                const barkHoldingsStr = holdings.map(h => `- ${h.name}(${h.code}) ${h.price}`).join('\n');
                contentText = `今日无调仓操作，继续持有。\n\n当前持仓:\n${barkHoldingsStr}`;

                // 企微 Markdown (绿色提示)
                const wechatHoldingsStr = holdings.map(h => `> ${h.name} (${h.code}) | <font color="warning">${h.price}</font>`).join('\n');
                contentMarkdown = `### 🔄 可转债三低策略调仓提醒
✅ **今日无调仓操作**
---
**📊 当前持仓**：
${wechatHoldingsStr}`;

            } else {
                // === 分支 B: 有调仓 ===
                title = '🔄 转债策略调仓提醒';

                // Bark
                const barkSellStr = sellList.map(i => `${i.name}(${i.code})`).join(',') || '无';
                const barkBuyStr = buyList.map(i => `${i.name}(${i.code})`).join(',') || '无';
                const barkHoldingsStr = holdings.map(h => `- ${h.name}(${h.code}) ${h.price}`).join('\n');
                contentText = `卖出: ${barkSellStr}\n买入: ${barkBuyStr}\n\n当前持仓:\n${barkHoldingsStr}`;

                // 企微 Markdown
                const wechatSellStr = sellList.map(i => `> ❌ <font color="comment">${i.name}</font> (${i.code})`).join('\n');
                const wechatBuyStr = buyList.map(i => `> ✅ <font color="info">${i.name}</font> (${i.code})`).join('\n');
                const wechatHoldingsStr = holdings.map(h => `> ${h.name} (${h.code}) | <font color="warning">${h.price}</font>`).join('\n');
                contentMarkdown = `### 🔄 可转债三低策略调仓提醒
**卖出操作**：
${wechatSellStr}

**买入操作**：
${wechatBuyStr}

---
**📊 当前持仓**：
${wechatHoldingsStr}`;
            }
            break;

        // --- 【新增】场景 2: 策略2 (新逻辑) ---
        case 'convertible_s2':
            targetBarkKeys = BOND_S2_BARK;
            targetWechatKeys = []; // 策略2不发企微

            const { sell: sell2, buy: buy2, holdings: holdings2 } = data;

            // 1. 修正：添加代码 (${h.code}) 到持仓列表
            const s2HoldStr = holdings2.map(h => `- ${h.name}(${h.code}) ${h.price}`).join('\n');

            // 2. 核心判断：是否有买卖操作
            const hasChangeS2 = (sell2 && sell2.length > 0) || (buy2 && buy2.length > 0);

            if (!hasChangeS2) {
                // === 分支 A: 无调仓 (文案优化) ===
                title = '🌱 惊蛰策略调仓';
                contentText = `今日无调仓操作，继续持有。\n\n当前持仓:\n${s2HoldStr}`;
            } else {
                // === 分支 B: 有调仓 ===
                title = '🌱 惊蛰策略调仓';
                const s2SellStr = (sell2 && sell2.length > 0) ? sell2.map(i => `${i.name}(${i.code})`).join(',') : '无';
                const s2BuyStr = (buy2 && buy2.length > 0) ? buy2.map(i => `${i.name}(${i.code})`).join(',') : '无';

                contentText = `卖出: ${s2SellStr}\n买入: ${s2BuyStr}\n\n当前持仓:\n${s2HoldStr}`;
            }
            break;
        // --- 场景 3: 微盘股更新 ---
        case 'micro_cap':
            title = '💎 微盘股数据更新'

            targetBarkKeys = MICRO_CAP_BARK // 
            targetWechatKeys = MICRO_CAP_WECHAT //

            contentText = `微盘股数据已更新，请及时查看最新持仓。\n更新时间：${formatTime()}`

            contentMarkdown = `### 💎 微盘股数据更新
                > 微盘股数据已更新，请及时查看最新持仓。
                > 更新时间：${formatTime()}`
            break;

        default:
            title = '系统通知'
            contentText = JSON.stringify(data)
            contentMarkdown = `### 系统通知\n${JSON.stringify(data)}`
    }

    // --- 发送逻辑 ---
    const tasks = []

    // 发送 Bark
    if (targetBarkKeys.length > 0) {
        targetBarkKeys.forEach(key => tasks.push(sendBark(key, title, contentText)))
    }

    // 发送 企微
    if (targetWechatKeys.length > 0) {
        targetWechatKeys.forEach(key => tasks.push(sendWechat(key, contentMarkdown)))
    }

    const results = await Promise.all(tasks)
    return { success: true, results }
}

// --- 辅助函数 ---
async function sendBark(key, title, content) {
    const encodedTitle = encodeURIComponent(title)
    const encodedContent = encodeURIComponent(content)
    const url = `https://api.day.app/${key}/${encodedTitle}/${encodedContent}?icon=${BARK_ICON}`
    try {
        await axios.get(url, { timeout: 5000 })
        return { status: 'success', channel: 'bark' }
    } catch (e) {
        return { status: 'failed', channel: 'bark', error: e.message }
    }
}

async function sendWechat(key, markdownContent) {
    const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`
    try {
        await axios.post(url, {
            msgtype: "markdown",
            markdown: { content: markdownContent }
        }, { timeout: 5000 })
        return { status: 'success', channel: 'wechat' }
    } catch (e) {
        return { status: 'failed', channel: 'wechat', error: e.message }
    }
}

function formatDateSimple() {
    const d = new Date(new Date().getTime() + 8 * 3600 * 1000);
    return d.toISOString().split('T')[0];
}

function formatTime() {
    const d = new Date(new Date().getTime() + 8 * 3600 * 1000);
    return d.toISOString().replace('T', ' ').substring(0, 19);
}