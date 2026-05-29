// auth.js - 专门负责查户口
const AUTH_ERROR = { success: false, code: 403, data: null };

/**
 * 统一鉴权函数
 * @param {object} app - TCB 的 app 实例
 * @param {boolean} requireAdmin - 是否必须管理员权限 (默认 false)
 * @returns {Promise<object>} 返回 { pass: true } 或 { pass: false, result: errorObj }
 */
async function checkUserPermission(app, requireAdmin = false) {
    const db = app.database();
    const auth = app.auth();

    // 1. 获取 UID
    const { uid } = auth.getUserInfo();
    if (!uid) {
        return { pass: false, result: { ...AUTH_ERROR, message: '未登录', code: 401 } };
    }

    // 2. 查库
    // 注意：这里复用传入的 app 实例，避免重复连接数据库
    const userRes = await db.collection('users').doc(uid).get();

    if (!userRes.data || userRes.data.length === 0) {
        return { pass: false, result: { ...AUTH_ERROR, message: '用户不存在' } };
    }

    const userData = userRes.data[0];
    const isAdmin = userData.admin === true;

    // 如果要求管理员权限，但不是管理员
    if (requireAdmin && !isAdmin) {
        return { pass: false, result: { ...AUTH_ERROR, message: '需要管理员权限' } };
    }

    // 普通 VIP 检查 (管理员直接放行)
    const now = Date.now();
    const isVip = userData.isVip === true && userData.vipExpiry > now;

    if (!isAdmin && !isVip) {
        return { pass: false, result: { ...AUTH_ERROR, message: '会员已过期或权限不足' } };
    }

    // 3. 通过验证
    return { pass: true };
}

module.exports = checkUserPermission;