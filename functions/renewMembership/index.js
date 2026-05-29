// renewMembership/index.js (全量)

const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()
const checkUserPermission = require('./auth'); // 引入上面的文件

exports.main = async (event, context) => {
  // 鉴权
  const authCheck = await checkUserPermission(app);
  // 如果要查管理员权限：await checkUserPermission(app, true);

  // 如果没通过，直接返回鉴权模块生成的错误信息
  if (!authCheck.pass) {
    return authCheck.result;
  }
  // 【修改】接收 daysToAdd
  const { userId, daysToAdd } = event;

  if (!userId || !daysToAdd) {
    return { success: false, message: '参数错误' };
  }

  const usersCollection = db.collection('users');

  try {
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.data || userDoc.data.length === 0) {
      return { success: false, message: '用户不存在' };
    }
    const currentUser = userDoc.data[0];
    const now = new Date();
    // 确保 currentExpiry 是有效的 Date 对象，如果无效则视为现在
    const currentExpiryTime = currentUser.vipExpiry ? new Date(currentUser.vipExpiry).getTime() : 0;
    const currentExpiry = new Date(currentExpiryTime);

    // 计算基准时间：
    // 如果是增加时间 (daysToAdd > 0)：通常基于当前到期时间(如果没过期)顺延。
    // 如果是减少时间 (daysToAdd < 0)：也应该基于当前到期时间扣减。
    // 如果用户已经过期了，再扣减就没有意义了（或者是基于现在扣减变成历史时间），
    // 但为了逻辑统一，如果用户已过期(currentExpiry < now)，基准时间设为 now。
    const startDate = currentExpiry > now ? currentExpiry : now;

    // 【核心计算】：当前日期 + 天数 (daysToAdd 为负数时即为减法)
    startDate.setDate(startDate.getDate() + Number(daysToAdd));

    const newExpiryTimestamp = startDate.getTime();
    
    // 【新增重要逻辑】：根据计算后的时间动态判断是否还是 VIP
    // 如果扣减天数导致时间变成了过去，则 isVip 应设为 false
    const isNewVipStatus = newExpiryTimestamp > Date.now();

    const updateResult = await usersCollection.doc(userId).update({
      vipExpiry: newExpiryTimestamp,
      isVip: isNewVipStatus, // 【修改】：使用动态判断的状态
    });

    if (updateResult.updated === 0) {
      return { success: false, message: '续费失败，未找到匹配的用户进行更新。' };
    }

    // 6. 返回成功的响应
    return {
      success: true,
      message: '会员续费成功！',
    };
  } catch (error) {
    // 7. 捕获并处理错误
    console.error('数据库更新失败:', error);
    return {
      success: false,
      message: '服务器内部错误，无法完成续费操作。',
      error: error.message
    };
  }
};