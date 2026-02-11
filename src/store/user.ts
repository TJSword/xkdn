// src/store/user.js

import { defineStore } from 'pinia'
import app, { auth } from '@/lib/cloudbase'
export const useUserStore = defineStore('user', {
  state: (): any => ({
    userInfo: null, // 存储从我们自己数据库（通过云函数）获取的用户信息
    hasAttemptedLogin: false // 标记是否已尝试获取用户信息
  }),

  getters: {
    isVip: (state) => !!state.userInfo?.isVip,
    isLoggedIn: (state) => state.userInfo !== null
  },

  actions: {
    /**
     * 【核心】在任何认证操作（登录、注册）成功后，调用此内部方法来获取/同步我们自己数据库的用户信息
     * @returns {Promise<any>} 返回从我们数据库获取的用户信息
     */
    async _syncUserInfo(phoneNumber: any) {
      try {
        // 调用我们自定义的云函数，它会根据当前登录的 tcb 用户，查找或创建我们自己数据库的记录
        const res = await app.callFunction({ name: 'loginOrRegister', data: { phone: phoneNumber } })
        this.userInfo = res.result
        this.hasAttemptedLogin = true
        return this.userInfo
      } catch (error) {
        console.error('同步用户信息失败:', error)
        // 同步失败时，最好也登出，因为 tcb 认证和我们的业务数据库状态不一致
        await this.logout()
        throw error // 把错误继续向上抛出，让调用方知道失败了
      }
    },

    /**
     * 【新增】处理手机号+密码登录
     * @param {object} loginData - 包含 phoneNumber 和 password
     */
    async loginWithPassword(loginData: any) {
      const { phoneNumber, password } = loginData

      // 1. 使用 tcb auth 进行密码登录
      await auth.signIn({
        username: '+86 ' + phoneNumber, // tcb auth 需要国家码前缀
        password: password
      })

      // 2. tcb 登录成功后，同步我们自己数据库的用户信息
      return this._syncUserInfo()
    },

    /**
     * 【新增】处理注册逻辑
     * @param {object} registerData - 包含 phoneNumber, password, verificationCode
     */
    async register(registerData: any) {
      const { phoneNumber, password, verificationCode, verification } = registerData

      // 检查 verification 对象是否存在
      if (!verification || !verification.verification_id) {
        throw new Error("请先获取验证码");
      }

      // 2. 验证短信码，获取 verification_token
      const verificationTokenRes = await auth.verify({
        verification_id: verification.verification_id,
        verification_code: verificationCode
      })

      // 3. 使用 tcb auth 注册新用户
      // 注意：signUp 成功后，tcb 会自动处理登录
      await auth.signUp({
        phone_number: '+86 ' + phoneNumber,
        password: password,
        verification_code: verificationCode,
        verification_token: verificationTokenRes.verification_token
      })

      // 4. tcb 注册并自动登录后，同步我们自己数据库的用户信息
      // 此时 loginOrRegister 云函数会发现是新用户，并为其创建记录

      return this._syncUserInfo(phoneNumber)
    },

    /**
     * 【新增】处理重置密码逻辑
     * @param {object} resetData - 包含 phoneNumber, newPassword, verificationCode
     */
    async resetPassword(resetData: any) {
      const { phoneNumber, newPassword, verificationCode, verification } = resetData

      if (!verification || !verification.verification_id) {
        throw new Error("请先获取验证码");
      }

      // 2. 验证短信码，获取 verification_token
      const verificationTokenRes = await auth.verify({
        verification_id: verification.verification_id,
        verification_code: verificationCode
      })

      // 3. 使用 tcb auth 重置密码
      await auth.resetPassword({
        phone_number: '+86 ' + phoneNumber,
        new_password: newPassword,
        verification_token: verificationTokenRes.verification_token
      })

      // 重置密码成功后，用户并未登录，所以不需要同步信息。
      // 只需返回成功状态即可。
      return { success: true }
    },

    /**
     * 【新增】处理已登录用户修改密码
     * @param {object} changeData - 包含 currentPassword 和 newPassword
     */
    async updatePassword(changeData: any) {
      const { currentPassword, newPassword } = changeData

      // 检查用户是否真的已登录
      if (!auth.currentUser) {
        throw new Error("用户未登录，无法修改密码。")
      }
      const sudoRes: any = await auth.sudo({
        password: currentPassword,
      });
      await auth.setPassword({
        new_password: newPassword,
        sudo_token: sudoRes.sudo_token,
      });
      return { success: true }
    },


    /**
     * 【保留并优化】应用初始化时检查用户登录状态
     */
    async fetchUserInfo() {
      if (this.hasAttemptedLogin) {
        return
      }

      // 检查 tcb 的登录状态
      if (auth.hasLoginState()) {
        // 如果 tcb 认为已登录，则同步我们的用户信息
        await this._syncUserInfo()
      } else {
        // 如果未登录，则标记为已尝试
        this.hasAttemptedLogin = true
        this.userInfo = null
      }
    },

    /**
     * 退出登录
     */
    async logout() {
      try {
        // 先调用 SDK 的登出方法，清除本地存储的凭证
        await app.auth().signOut();
      } catch (e) {
        console.error("SDK 登出失败:", e);
      } finally {
        // 无论 SDK 是否成功，都必须重置 Pinia 的 state
        this.userInfo = null
        this.hasAttemptedLogin = false
        // this.isVip = false; // 等等，重置所有用户相关状态
      }
    },
    /**
     * 【新增】强制刷新用户信息（用于支付成功后更新VIP状态）
     */
    async refreshUserInfo() {
      // 直接调用内部同步方法，无视 hasAttemptedLogin 标记
      // 云函数 loginOrRegister 会根据当前 TCB 登录态返回最新的数据库信息
      return await this._syncUserInfo()
    },

    // async logout() {
    //   if (auth.currentUser) {
    //     await auth.signOut()
    //   }

    //   // 清空 Pinia store 中的状态
    //   this.userInfo = null
    //   this.hasAttemptedLogin = false
    // }

    /**
   * 【新增】更新用户持仓
   * @param {Array} holdings - 清洗后的持仓数组
   */
    async updateHoldings(holdings: any) {
      // 1. 调用你刚才写的云函数 'updateUserHoldings'
      const res = await app.callFunction({
        name: 'updateUserHoldings',
        data: { holdings }
      })

      if (res.result.success) {
        // 2. 【关键】云端更新成功后，手动更新本地 store 中的 userInfo
        // 这样你的所有页面都能立即看到最新的持仓，而不用重新拉取用户信息
        if (this.userInfo) {
          this.userInfo.holdings = res.result.data
        }
        return res.result
      } else {
        throw new Error(res.result.msg || '更新失败')
      }
    }
  }
})