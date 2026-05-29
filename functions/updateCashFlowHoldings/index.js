// 云函数：updateCashFlowHoldings.js
const tcb = require('@cloudbase/node-sdk');
const app = tcb.init();
const db = app.database();
const checkUserPermission = require('./auth');

// 同样使用独立的文档 ID
const CONFIG_ID = 'cash_flow_strategy';

/**
 * 更新现金流策略的持仓配置
 * @param {object} event - 云函数入参
 * @param {Array} event.holdings - 持仓数据的数组
 */
exports.main = async (event, context) => {
  // ============================================
  // 一行代码搞定鉴权！
  // ============================================
  const authCheck = await checkUserPermission(app,true);
  // 如果要查管理员权限：await checkUserPermission(app, true);

  // 如果没通过，直接返回鉴权模块生成的错误信息
  if (!authCheck.pass) {
    return authCheck.result;
  }
  const { holdings } = event;

  // 验证入参
  if (!holdings || !Array.isArray(holdings)) {
    return {
      success: false,
      message: "缺少必要参数 'holdings' 或参数类型不正确，应为数组。",
    };
  }

  const configCollection = db.collection('strategy_configs');

  // 构建要更新的数据对象，与 "长钱策略" 的结构保持一致
  // 使用点表示法更新嵌套对象
  const updateData = {
    'holdings.data': holdings, // 更新数据数组
    'holdings.updatedAt': db.serverDate(), // 更新时间为服务器当前时间
  };

  try {
    // 使用 set + merge: true 来实现 "upsert"
    // 如果文档不存在，它会自动创建；如果存在，则会合并更新字段。这比 update 更安全。
    const result = await configCollection.doc(CONFIG_ID).set({
      holdings: {
        data: holdings,
        updatedAt: db.serverDate(),
      }
    }, { merge: true });

    // 在 set 操作中，我们不需要检查 updated 数量
    return {
      success: true,
      message: '持仓配置更新成功！',
    };
  } catch (error) {
    console.error('更新现金流持仓配置失败:', error);
    return {
      success: false,
      message: '服务器内部错误，无法更新配置。',
      error: error.message,
    };
  }
};