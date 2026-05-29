const tcb = require('@cloudbase/node-sdk');
const app = tcb.init();
const db = app.database();
const checkUserPermission = require('./auth');
const CONFIG_ID = 'long_term_strategy';

/**
 * 获取长钱策略的配置数据（投资组合和策略调整）
 */
exports.main = async (event, context) => {

  const authCheck = await checkUserPermission(app);
  // 如果要查管理员权限：await checkUserPermission(app, true);

  // 如果没通过，直接返回鉴权模块生成的错误信息
  if (!authCheck.pass) {
    return authCheck.result;
  }
  const configCollection = db.collection('strategy_configs');

  try {
    const res = await configCollection.doc(CONFIG_ID).get();

    // .get() 返回的是一个包含 data 数组的对象
    // 检查 res.data 是否存在且有内容
    if (!res.data || res.data.length === 0) {
      // 如果文档不存在，返回一个符合前端期望的、包含 'adjustment' 的默认空结构
      // --- 这里是唯一的修改点 ---
      return {
        success: true,
        data: {
          portfolio: { updatedAt: null, data: [] },
          adjustment: { updatedAt: null, data: [], explanation: '' }, // 将 sellAlert 替换为 adjustment
        }
      };
    }

    // 正常返回从数据库中查询到的数据
    // 注意：.doc().get() 在 Node SDK 中返回的是 { data: [ Document ] } 结构
    // 如果您确定只有一个文档，取第一个元素是正确的
    return {
      success: true,
      data: res.data[0]
    };

  } catch (error) {
    // 增加对 "DOCUMENT_NOT_EXIST" 错误的特定处理
    if (error.code === 'DATABASE_REQUEST_FAILED' && error.message.includes('document non-exists')) {
      // 这是一个更健壮的方式来处理文档不存在的情况
      return {
        success: true,
        data: {
          portfolio: { updatedAt: null, data: [] },
          adjustment: { updatedAt: null, data: [], explanation: '' },
        }
      };
    }

    console.error('获取策略配置失败:', error);
    return {
      success: false,
      message: '服务器内部错误，无法获取策略配置。',
      error: error.message
    };
  }
};