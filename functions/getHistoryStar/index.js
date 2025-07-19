// 引入 axios 库
// 注意：axios 是第三方库，需要在云函数的 package.json 中声明依赖，并执行 npm install
const axios = require('axios')

// 云函数入口函数
exports.main = async (event, context) => {
    // 目标 URL，可以直接包含查询参数字符串
    const targetUrl = 'https://screw.yhlsd.com/api/ugc/market_star/query_history_star.json'

    try {
        // 使用 axios 发起 GET 请求
        // 我们可以将查询参数作为第二个参数的 `params` 对象的属性传入
        const response = await axios.get(targetUrl, {
            params: {
                tab: 4 // axios 会自动将其拼接成 ?tab=4
            }
        })

        // 请求成功 (axios 默认只将 2xx 状态码视为成功)
        // axios 会自动将 JSON 格式的响应体解析为 JavaScript 对象
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        // 如果请求失败（网络错误、超时、非 2xx 状态码等），axios 会抛出异常
        console.error('Axios request error:', error)

        // 返回一个结构化的错误信息
        if (error.response) {
            // 服务器返回了响应，但状态码不是 2xx
            return {
                success: false,
                error: `Request Failed. Status Code: ${error.response.status}`,
                details: error.response.data
            }
        } else if (error.request) {
            // 请求已发出，但没有收到响应
            return {
                success: false,
                error: 'No response received from server.',
                details: error.message
            }
        } else {
            // 在设置请求时触发了错误
            return {
                success: false,
                error: 'Error setting up the request.',
                details: error.message
            }
        }
    }
}
