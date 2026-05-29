const AlipaySdkLib = require('alipay-sdk');
const AlipaySdk = AlipaySdkLib.default || AlipaySdkLib.AlipaySdk || AlipaySdkLib;

const tcb = require('@cloudbase/node-sdk');
const app = tcb.init();
const db = app.database();
const _ = db.command;

exports.main = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    // =========================================================
    // 1. 基础配置 (支付宝参数)
    // =========================================================
    const APP_ID = process.env.ALIPAY_APP_ID;
    const PRIVATE_KEY = process.env.ALIPAY_PRIVATE_KEY;
    const ALIPAY_PUBLIC_KEY = process.env.ALIPAY_PUBLIC_KEY;

    if (!APP_ID || !PRIVATE_KEY || !ALIPAY_PUBLIC_KEY) {
        return { success: false, message: '支付配置缺失，请联系管理员' };
    }

    const ALIPAY_CONFIG = {
        appId: APP_ID,
        privateKey: PRIVATE_KEY,
        alipayPublicKey: ALIPAY_PUBLIC_KEY,
        signType: 'RSA2',
        gateway: 'https://openapi.alipay.com/gateway.do',
        timeout: 5000,
        camelcase: true
    };

    const { outTradeNo } = event;

    // =========================================================
    // 2. 安全鉴权：必须登录，且只能查自己的订单
    // =========================================================
    const { uid } = app.auth().getUserInfo();
    if (!uid) {
        return { success: false, message: '未登录' };
    }

    if (!outTradeNo) {
        return { success: false, message: '缺少参数 outTradeNo' };
    }

    try {
        // 3. 查询订单 (强制校验 userId === uid)
        const orderRes = await db.collection('orders').where({
            outTradeNo: outTradeNo,
            userId: uid // ★ 安全关键：只能查属于自己的订单
        }).get();

        if (orderRes.data.length === 0) {
            return { success: false, message: '订单不存在或无权查看' };
        }

        const order = orderRes.data[0];

        // 【快速失败】如果已经处理过，直接返回成功
        if (order.status === 'SUCCESS') {
            return { success: true, status: 'SUCCESS', message: '支付成功(已处理)' };
        }

        // 4. 去支付宝查询真实状态
        const alipaySdk = new AlipaySdk(ALIPAY_CONFIG);
        const result = await alipaySdk.exec('alipay.trade.query', {
            bizContent: { out_trade_no: outTradeNo },
        });

        if (result.code === '10000') {
            const status = result.tradeStatus;

            // 支付宝状态：支付成功 或 交易结束
            if (status === 'TRADE_SUCCESS' || status === 'TRADE_FINISHED') {
                console.log(`[支付宝确认成功] 订单:${outTradeNo}`);

                // =======================================================
                // 5. 原子更新锁：防止并发重复充值
                // =======================================================
                const updateRes = await db.collection('orders').where({
                    outTradeNo: outTradeNo,
                    status: 'PENDING'
                }).update({
                    status: 'SUCCESS',
                    payTime: new Date(),
                    alipayTradeNo: result.tradeNo
                });

                // 只有抢锁成功 (updated === 1)，才执行加会员逻辑
                if (updateRes.updated === 1) {
                    console.log(`[执行续费] 抢锁成功，正在给用户 ${order.userId} 增加 ${order.days} 天`);

                    // =======================================================
                    // ★★★ 核心融合：直接在此处执行 renewMembership 逻辑 ★★★
                    // =======================================================
                    try {
                        const usersCollection = db.collection('users');
                        const userDoc = await usersCollection.doc(order.userId).get();

                        if (!userDoc.data || userDoc.data.length === 0) {
                            throw new Error('用户不存在，无法充值');
                        }

                        const currentUser = userDoc.data[0];
                        const now = new Date();
                        
                        // 计算逻辑：如果当前未过期，从过期时间开始顺延；如果已过期，从现在开始计算
                        const currentExpiry = currentUser.vipExpiry ? new Date(currentUser.vipExpiry) : now;
                        const startDate = currentExpiry > now ? currentExpiry : now;

                        // 增加天数 (数据来源是安全的 order 表，不是前端传参)
                        startDate.setDate(startDate.getDate() + Number(order.days));
                        const newExpiryTimestamp = startDate.getTime();

                        // 更新用户表
                        await usersCollection.doc(order.userId).update({
                            vipExpiry: newExpiryTimestamp,
                            isVip: true,
                            // user_tier: 'pro' // 如果需要，也可以在这里更新等级
                        });

                        console.log(`[充值完成] 用户有效期已更新至 ${startDate.toLocaleString()}`);
                        
                        return { success: true, status: 'SUCCESS', message: '支付成功且会员已到账' };

                    } catch (renewError) {
                        // 致命错误：钱扣了，订单改了，但加会员失败了
                        console.error('【致命错误】续费逻辑执行失败:', renewError);
                        // 这种情况下，虽然加会员失败，但订单状态已经是 SUCCESS 了。
                        // 建议记录日志，或者发送告警通知管理员人工处理。
                        return { 
                            success: true, 
                            status: 'PAID_BUT_RENEW_FAILED', 
                            message: '支付成功，但会员权益开通异常，请联系客服补单' 
                        };
                    }
                    // =======================================================
                    // ★★★ 融合结束 ★★★
                    // =======================================================

                } else {
                    // updated === 0，说明已经有并发请求处理完了
                    return { success: true, status: 'SUCCESS', message: '支付成功(并发处理)' };
                }

            } else {
                return { success: true, status: 'PENDING', message: '等待支付' };
            }
        } else {
            return { success: false, message: result.subMsg || '支付宝查询失败' };
        }

    } catch (error) {
        console.error('查询异常:', error);
        return { success: false, message: '系统错误: ' + error.message };
    }
};