const axios = require('axios')

// 云函数入口函数
exports.main = async () => {
    const targetUrl = 'https://screw.yhlsd.com/api/ugc/market_star/query_day_star.json'

    try {
        const response = await axios.get(targetUrl)
        return {
            success: true,
            data: response.data
        }
    } catch (error) {
        console.error('Axios request error:', error)
        if (error.response) {
            return {
                success: false,
                error: `Request Failed. Status Code: ${error.response.status}`,
                details: error.response.data // 响应体中的错误详情
            }
        } else if (error.request) {
            return {
                success: false,
                error: 'No response received from server.',
                details: error.message
            }
        } else {
            return {
                success: false,
                error: 'Error setting up the request.',
                details: error.message
            }
        }
    }
}
