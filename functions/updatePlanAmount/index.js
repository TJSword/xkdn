const tcb = require('@cloudbase/node-sdk');
const checkUserPermission = require('./auth');
const app = tcb.init();
const db = app.database();

// 复用历史记录集合
const COLLECTION_NAME = 'micro_cap_history';
// 定义一个特殊的 ID，用于存放配置
const CONFIG_DOC_ID = '__STRATEGY_CONFIG__';

exports.main = async (event, context) => {
    const authCheck = await checkUserPermission(app,true); 
    // 如果要查管理员权限：await checkUserPermission(app, true);

    // 如果没通过，直接返回鉴权模块生成的错误信息
    if (!authCheck.pass) {
        return authCheck.result;
    }
  // 1. 获取前端传来的参数（可能是 amount，也可能是 cookie）
  const { amount, cookie } = event;

  if (amount === undefined && cookie === undefined) {
      return { success: false, msg: '没有收到要保存的数据' };
  }

  // 2. 动态组装要更新的字段
  const updateData = {
      updated_at: new Date().toISOString()
  };

  if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
          return { success: false, msg: '无效的金额，必须大于0' };
      }
      updateData.next_day_plan_amount = amount;
  }

  if (cookie !== undefined) {
      if (typeof cookie !== 'string' || !cookie.trim()) {
          return { success: false, msg: 'Cookie 不能为空' };
      }
      updateData.xueqiu_cookie = cookie;
  }

  try {
      // 3. 存入数据库：防止互删，改为“存在则 update 局部更新，不存在则 set 初始化”
      const docRef = db.collection(COLLECTION_NAME).doc(CONFIG_DOC_ID);
      const checkRes = await docRef.get();

      if (checkRes.data && checkRes.data.length > 0) {
          // 如果文档已经存在，用 update 只更新传过来的字段，保留其它字段不变
          await docRef.update(updateData);
      } else {
          // 如果是第一次使用，文档不存在，用 set 创建
          updateData.type = 'config'; // 加上标识
          await docRef.set(updateData);
      }

      return { success: true, msg: '配置保存成功', data: updateData };
  } catch (e) {
      console.error('保存配置失败', e);
      return { success: false, msg: '保存失败: ' + e.message };
  }
};