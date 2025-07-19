const tcb = require('@cloudbase/node-sdk')

const app = tcb.init()
const auth = app.auth()
const db = app.database()
const _ = db.command

exports.main = async (event, context) => {
    // 在实际环境中，您应该使用真实的 uid
    const { uid } = auth.getUserInfo()
    // 为了方便测试，此处我们模拟一个 uid
    const usersCollection = db.collection('users')

    const userRecordResult = await usersCollection.doc(uid).get()

    if (userRecordResult.data.length > 0) {
        // 注意：这里的逻辑假设老用户的数据结构也是扁平的。
        // 如果您需要兼容新旧两种数据结构，这里的逻辑会更复杂。
        const user = userRecordResult.data[0]

        const nowTimestamp = Date.now()
        const updateData = {
            loginCount: _.inc(1),
            lastLoginTime: db.serverDate()
        }

        if (nowTimestamp > user.vipExpiry) {
            updateData.user_tier = 'free'
            updateData.isVip = false
        }

        // 直接传递 updateData 对象进行更新
        await usersCollection.doc(uid).update(updateData)
        return { ...user, ...updateData }
    } else {
        const vipExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime()

        const newUser = {
            createTime: db.serverDate(),
            lastLoginTime: db.serverDate(),
            loginCount: 1,
            isVip: true,
            vipExpiry: vipExpiry,
            user_tier: 'pro',
            phone: event.phone
        }
        // 直接传递 newUser 对象进行创建
        await usersCollection.doc(uid).set(newUser)

        return { ...newUser, isNew: true }
    }
}
