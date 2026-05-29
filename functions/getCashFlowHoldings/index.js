// 云函数：getCashFlowHoldings.js
const tcb = require('@cloudbase/node-sdk');
const app = tcb.init();
const db = app.database();
const checkUserPermission = require('./auth');

// 为现金流策略配置一个独立的文档 ID，便于管理
const CONFIG_ID = 'cash_flow_strategy';

/**
 * 获取现金流策略的持仓配置
 */
exports.main = async (event, context) => {

  // ============================================
  // 一行代码搞定鉴权！
  // ============================================
  const authCheck = await checkUserPermission(app);
  // 如果要查管理员权限：await checkUserPermission(app, true);

  // 如果没通过，直接返回鉴权模块生成的错误信息
  if (!authCheck.pass) {
    return authCheck.result;
  }
  const configCollection = db.collection('strategy_configs');

  try {
    const res = await configCollection.doc(CONFIG_ID).get();

    if (res.data.length === 0) {
      // 如果文档不存在，返回一个空的、结构化的默认值，确保前端不会出错
      return {
        success: true,
        data: {
          holdings: {
            data: [],
            updatedAt: null,
          },
        },
        message: '未找到配置文档，返回默认空值。',
      };
    }

    // 成功找到文档，返回其内容
    return {
      success: true,
      data: res.data[0], // .get() 返回的是一个数组，我们取第一个元素
    };
  } catch (error) {
    console.error('获取现金流持仓配置失败:', error);
    return {
      success: false,
      message: '服务器内部错误，无法获取配置。',
      error: error.message,
    };
  }
};