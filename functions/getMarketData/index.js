const axios = require('axios');

// 将URL定义在顶部，方便管理
const TODAY_STAR_URL = 'https://screw.yhlsd.com/api/ugc/market_star/query_day_star.json';
const HISTORY_STAR_URL = 'https://screw.yhlsd.com/api/ugc/market_star/query_history_star.json?tab=4';

/**
 * 云函数入口函数
 * 并行获取“今日星级”和“历史星级”数据
 */
exports.main = async () => {
  try {
    // 使用 Promise.all 来并行发起两个请求
    // 这比一个接一个地请求要快得多
    const [todayResponse, historyResponse] = await Promise.all([
      axios.get(TODAY_STAR_URL),
      axios.get(HISTORY_STAR_URL)
    ]);

    // 检查两个请求是否都成功 (状态码 200)
    // axios 对于非 2xx 的状态码会抛出错误，会被下面的 catch 捕获，
    // 所以这里的检查更多是为了逻辑上的清晰。
    if (todayResponse.status === 200 && historyResponse.status === 200) {
      // 返回一个包含两个数据集的、结构化的对象
      return {
        success: true,
        data: {
          // 实际内容在 axios 响应的 data 属性中
          today: todayResponse.data,
          history: historyResponse.data
        }
      };
    } else {
      // 这种情况在使用 axios 时不太可能发生，但有助于代码健壮性
      return {
        success: false,
        error: '一个或多个API请求失败。',
        details: {
          todayStatus: todayResponse.status,
          historyStatus: historyResponse.status
        }
      };
    }
  } catch (error) {
    // 这个 catch 块会捕获任何网络错误或 axios 抛出的非 2xx 响应错误
    console.error('在 getMarketData 中发生 Axios 请求错误:', error);
    if (error.response) {
      // 请求已发出，但服务器返回了非 2xx 的状态码
      return {
        success: false,
        error: `请求失败，状态码: ${error.response.status}`,
        details: error.response.data
      };
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      return {
        success: false,
        error: '服务器无响应。',
        details: error.message
      };
    } else {
      // 设置请求时发生了一些错误
      return {
        success: false,
        error: '设置请求时出错。',
        details: error.message
      };
    }
  }
};