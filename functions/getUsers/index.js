const tcb = require('@cloudbase/node-sdk')
const app = tcb.init()
const db = app.database()
const _ = db.command
const checkUserPermission = require('./auth'); // 引入上面的文件

/**
 * 格式化毫秒时间戳为 YYYY-MM-DD HH:mm (强制北京时间)
 * @param {number} timestamp - 毫秒时间戳
 * @returns {string} - 格式化后的日期字符串
 */
function formatTimestamp(timestamp) {
  if (!timestamp || typeof timestamp !== 'number') {
    return '未设置';
  }

  // 1. 创建 Date 对象
  // 2. 加上 8 小时的毫秒数 (8 * 60 * 60 * 1000 = 28800000)
  //    这样就把时间平移到了北京时间
  const beijingDate = new Date(timestamp + 8 * 60 * 60 * 1000);

  // 3. 使用 getUTC... 方法获取时间分量
  //    因为我们在第2步已经手动把时间“拨快”了8小时，
  //    所以这里取 UTC 时间其实就是北京时间
  const year = beijingDate.getUTCFullYear();
  const month = (beijingDate.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = beijingDate.getUTCDate().toString().padStart(2, '0');
  const hours = beijingDate.getUTCHours().toString().padStart(2, '0');
  const minutes = beijingDate.getUTCMinutes().toString().padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 获取用户列表，支持按手机号模糊查询和分页
 */
exports.main = async (event, context) => {

  // ============================================
  // 一行代码搞定鉴权！
  // ============================================
  const authCheck = await checkUserPermission(app, true);
  // 如果要查管理员权限：await checkUserPermission(app, true);

  // 如果没通过，直接返回鉴权模块生成的错误信息
  if (!authCheck.pass) {
    return authCheck.result;
  }
  // 1. 从前端获取参数
  const { searchPhone, page = 1, limit = 8, onlyActive, sortOrder } = event;

  const usersCollection = db.collection('users');
  let query = {};


  // 2. 如果有搜索条件，构建查询
  if (searchPhone) {
    // 使用正则表达式进行模糊查询
    query.phone = db.RegExp({
      regexp: searchPhone,
      options: 'i', // i 表示不区分大小写
    });
  }
  // 【新增代码开始】筛选仅显示生效会员
  if (onlyActive) {
    // 筛选 vipExpiry 大于当前时间的记录
    query.vipExpiry = _.gt(Date.now());
  }

  try {
    // 3. 先获取符合条件的总记录数，用于前端分页
    const totalResult = await usersCollection.where(query).count();
    const total = totalResult.total;

    // 4. 查询分页后的数据
    // 这里需要根据是否有排序参数来决定是否调用 orderBy
    let dbQuery = usersCollection.where(query);

    // 【新增代码开始】处理排序
    if (sortOrder && (sortOrder === 'asc' || sortOrder === 'desc')) {
      // 按照会员到期时间排序
      dbQuery = dbQuery.orderBy('vipExpiry', sortOrder);
    } else {
      // 默认排序：可以按 _id 或创建时间倒序，保证新用户在前
      dbQuery = dbQuery.orderBy('_id', 'desc');
    }

    // 4. 查询分页后的数据
    const usersResult = await dbQuery
      .field({
        phone: true,
        vipExpiry: true,
        isVip: true,
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .get();

    // 5. 格式化数据以匹配前端接口
    const formattedUsers = usersResult.data.map(user => ({
      id: user._id, // 将数据库的 _id 映射为前端的 id
      phone: user.phone || '未设置',
      // 将 vipExpiry 时间戳转换为 YYYY-MM-DD 格式
      membershipExpiry: formatTimestamp(user.vipExpiry),
    }));

    // 6. 返回成功的响应
    return {
      success: true,
      message: '用户列表获取成功',
      data: {
        users: formattedUsers,
        total: total,
      }
    };
  } catch (error) {
    // 7. 捕获并处理错误
    console.error('数据库查询失败:', error);
    return {
      success: false,
      message: '服务器内部错误，无法获取用户列表。',
      error: error.message
    };
  }
};