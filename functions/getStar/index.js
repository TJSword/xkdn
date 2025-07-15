// 引入 Node.js 核心模块
const https = require('https')

// 云函数入口函数
exports.main = async (event, context) => {
    const targetUrl = 'https://screw.yhlsd.com/api/ugc/market_star/query_day_star.json'

    // 我们将 https.get 的回调模式封装成一个 Promise，以便能使用 async/await
    return (
        new Promise((resolve, reject) => {
            // 使用 https.get 发起请求
            const req = https.get(targetUrl, res => {
                // 检查 HTTP 状态码
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    // 如果状态码不是 2xx，则视为请求失败
                    // 返回一个包含错误信息的对象来拒绝 Promise
                    return reject({
                        success: false,
                        error: `Request Failed. Status Code: ${res.statusCode}`
                    })
                }

                // 数据是分块(chunk)接收的，我们需要将它们拼接起来
                let rawData = ''
                res.on('data', chunk => {
                    rawData += chunk
                })

                // 当所有数据接收完毕时
                res.on('end', () => {
                    try {
                        // 尝试将接收到的字符串解析为 JSON
                        const parsedData = JSON.parse(rawData)
                        // 成功！返回一个包含数据的对象来解决 Promise
                        resolve({
                            success: true,
                            data: parsedData
                        })
                    } catch (e) {
                        // 如果 JSON 解析失败
                        console.error('JSON parsing error:', e.message)
                        reject({
                            success: false,
                            error: 'Failed to parse JSON response.',
                            details: e.message
                        })
                    }
                })
            })

            // 监听请求本身的错误事件（例如，DNS查找失败、网络不通等）
            req.on('error', e => {
                console.error(`Request error: ${e.message}`)
                reject({
                    success: false,
                    error: 'HTTPS request error.',
                    details: e.message
                })
            })

            // 结束请求（对于GET请求，这是必需的）
            req.end()
        })
            // 统一捕获 Promise 链中可能出现的未处理的拒绝
            .catch(errorResult => {
                // 确保即使Promise被拒绝，云函数本身也返回一个结构化的对象
                return errorResult
            })
    )
}
