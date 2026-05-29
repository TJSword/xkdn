const tcb = require('@cloudbase/node-sdk');
const app = tcb.init();
const db = app.database();
const checkUserPermission = require('./auth');
// const _ = db.command; // 在这个逻辑中暂时不需要 command

// 配置文档的固定 ID
const CONFIG_ID = 'long_term_strategy';

/**
 * 更新长钱策略的配置数据（投资组合或策略调整）
 * @param {object} event - 云函数入参
 * @param {string} event.type - 要更新的配置类型，现在支持 'portfolio' 或 'adjustment'
 * @param {Array} event.data - 主要的数据数组
 * @param {string} [event.explanation] - (可选) 仅在 type 为 'adjustment' 时传递，用于更新调整说明
 */
exports.main = async (event, context) => {


  const authCheck = await checkUserPermission(app,true); 
    // 如果要查管理员权限：await checkUserPermission(app, true);

    // 如果没通过，直接返回鉴权模块生成的错误信息
    if (!authCheck.pass) {
        return authCheck.result;
    }
  // --- 修改 1: 解构出新的 'explanation' 字段，并更新 'type' 的合法值 ---
  const { type, data, explanation } = event;

  // 验证传入参数的合法性
  if (!type || !['portfolio', 'adjustment'].includes(type) || !data) {
    return {
      success: false,
      message: "缺少必要参数 (type, data) 或 type 值无效。type 必须是 'portfolio' 或 'adjustment'。"
    };
  }

  // --- 修改 2: 增加对 'adjustment' 类型下 'explanation' 参数的验证 ---
  if (type === 'adjustment' && typeof explanation === 'undefined') {
    // 虽然前端逻辑总是会传一个字符串（哪怕是空字符串），但后端最好做一下防御
    return {
      success: false,
      message: "当 type 为 'adjustment' 时，必须传递 'explanation' 字段。"
    };
  }

  const configCollection = db.collection('strategy_configs');

  // --- 修改 3: 动态构建要更新的数据对象 ---
  let updateData = {};

  // 使用点表示法来更新文档中的嵌套对象
  // 无论是 'portfolio' 还是 'adjustment'，都更新其 data 和 updatedAt 字段
  updateData[`${type}.data`] = data; // 更新数据数组
  updateData[`${type}.updatedAt`] = db.serverDate(); // 更新时间为服务器当前时间

  // 如果类型是 'adjustment'，则额外更新其 explanation 字段
  if (type === 'adjustment') {
    updateData[`${type}.explanation`] = explanation;
  }

  // --- 后续逻辑无需修改 ---
  try {
    const result = await configCollection.doc(CONFIG_ID).update(updateData);

    if (result.updated === 0) {
      // 这种情况可能是文档不存在，可以考虑使用 set + merge: true 来实现 upsert（如果不存在则创建）
      // 但根据当前逻辑，我们假设文档是已存在的
      return { success: false, message: '更新失败，未找到配置文档。' };
    }

    return {
      success: true,
      message: '配置更新成功！'
    };
  } catch (error) {
    console.error('更新策略配置失败:', error);
    return {
      success: false,
      message: '服务器内部错误，无法更新配置。',
      error: error.message
    };
  }
};