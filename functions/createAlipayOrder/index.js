const QRCode = require('qrcode');
const AlipaySdkLib = require('alipay-sdk');
// 兼容不同版本的引入
const AlipaySdk = AlipaySdkLib.default || AlipaySdkLib.AlipaySdk || AlipaySdkLib;

const tcb = require('@cloudbase/node-sdk');
const app = tcb.init();
const db = app.database();

// =========================================================
// ★ 核心安全配置：套餐价格表 (后端说了算)
// =========================================================
// const PLAN_CONFIG = {
//     'month': { days: 30, amount: '6.80', name: '尝鲜月卡' },
//     'quarter': { days: 90, amount: '18.80', name: '进阶季卡' },
//     'half': { days: 180, amount: '28.80', name: '实战半年' },
//     'year': { days: 365, amount: '48.80', name: '尊享年卡' },
//     'year2': { days: 730, amount: '88.80', name: '长期主义' },
//     'year3': { days: 1095, amount: '118.80', name: '穿越牛熊' }
// };

const PLAN_CONFIG = {
    // 删除了月、季、半年，因为策略需要时间验证，短期用户容易因波动闹事
    // 删除了2年、3年，因为策略容量有限，不适合通过长周期绑定来透支未来

    // 只保留唯一的年卡，作为唯一的筛选门槛
    'year': { 
        days: 365, 
        amount: '365.00', // 建议定价：1天1块钱，或者 299、599
        name: '实战年卡'  // 名字去掉“尊享”，强调“实战/核心”
    }
};

exports.main = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    // =========================================================
    // 1. 支付宝配置 (请确保填入真实信息)
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

    // 【安全修改】只接收 planId 和 userId
    const { planId } = event;
    const { uid } = app.auth().getUserInfo();
    if (!uid) {
        return { success: false, message: '请先登录' };
    }

    // 强制把订单绑定给当前登录的人
    const userId = uid;
    try {
        if (!planId || !userId) {
            return { success: false, message: '缺少参数: planId 或 userId' };
        }

        // 【安全校验】根据 planId 获取真实配置
        const selectedPlan = PLAN_CONFIG[planId];

        if (!selectedPlan) {
            console.error(`非法请求: 未知的套餐ID ${planId}, 用户 ${userId}`);
            return { success: false, message: '非法的套餐类型' };
        }

        // 提取后端认可的参数
        const { days, amount, name } = selectedPlan;

        console.log(`[创建订单] 用户:${userId}, 套餐:${planId}, 天数:${days}, 金额:${amount}`);

        const alipaySdk = new AlipaySdk(ALIPAY_CONFIG);
        const outTradeNo = 'PAY' + Date.now() + Math.floor(Math.random() * 1000);

        // 调用支付宝接口
        const result = await alipaySdk.exec('alipay.trade.precreate', {
            bizContent: {
                out_trade_no: outTradeNo,
                total_amount: amount, // 使用配置表里的金额
                subject: `会员充值-${name}`,
                product_code: 'FACE_TO_FACE_PAYMENT'
            },
        });

        if (result.code === '10000' && result.qrCode) {

            // 入库：所有数据均来自后端配置，不可篡改
            await db.collection('orders').add({
                outTradeNo: outTradeNo,
                userId: userId,
                planId: planId,
                days: days,            // 存入确定的天数
                totalAmount: amount,   // 存入确定的金额
                planName: name,
                status: 'PENDING',
                createTime: new Date()
            });

            console.log('订单创建成功');

            // 生成 Base64 图片
            const qrCodeBase64 = await QRCode.toDataURL(result.qrCode);

            return {
                success: true,
                message: 'OK',
                data: {
                    outTradeNo: outTradeNo,
                    qrCodeBase64: qrCodeBase64,
                    qrCodeUrl: result.qrCode
                }
            };
        } else {
            return {
                success: false,
                message: result.subMsg || result.msg || '支付宝接口调用失败'
            };
        }

    } catch (error) {
        console.error('系统异常:', error);
        return {
            success: false,
            message: '服务器内部错误: ' + (error.message || '未知错误')
        };
    }
};