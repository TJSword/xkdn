// src/store/user.js

import { defineStore } from 'pinia'
import app, { auth } from '@/lib/cloudbase' // 引入你的 cloudbase 实例

export const useUserStore = defineStore('user', {
  // 状态：存储数据的地方
  state: () => ({
    // 用户信息对象，默认为 null
    userInfo: null,
    // 标记是否已经尝试从后端获取过用户信息，防止重复请求
    hasAttemptedLogin: false
  }),

  // Getters：类似于计算属性，用于派生状态
  getters: {
    /**
     * 用户是否为 VIP
     * @returns {boolean}
     */
    isVip: (state: any) => {
      // 使用可选链 (?.) 和双重否定 (!!) 来安全地获取布尔值
      // 即使 userInfo 是 null 也不会报错
      return !!state.userInfo?.isVip
    },
    /**
     * 用户是否已登录（只要有用户信息就算登录）
     * @returns {boolean}
     */
    isLoggedIn: (state) => {
      return state.userInfo !== null
    }
  },

  // Actions：用于处理业务逻辑和异步操作
  actions: {
    /**
     * 异步操作：调用云函数登录或注册，并更新 store 中的状态
     * 这个 action 是幂等的，即使被多次调用，也只会执行一次网络请求。
     */
    async fetchUserInfo() {
      // 如果已经尝试过获取用户信息，则直接返回，避免重复调用云函数
      if (this.hasAttemptedLogin) {
        return
      }

      try {
        const res = await app.callFunction({ name: 'loginOrRegister' })
        this.userInfo = res.result // 将云函数返回的结果存入 state
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.userInfo = null // 如果失败，确保用户信息为 null
      } finally {
        // 无论成功还是失败，都标记为已尝试过
        this.hasAttemptedLogin = true
      }
    },
    async login(loginData: any) {
      const { phoneNumber, verificationCode, verification } = loginData;

      // 1. 验证验证码
      const verificationTokenRes = await auth.verify({
        verification_id: verification.verification_id,
        verification_code: verificationCode
      });

      // 2. 根据是否为老用户，执行登录或注册
      if (verification.is_user) {
        await auth.signIn({
          username: '+86 ' + phoneNumber,
          verification_token: verificationTokenRes.verification_token
        });
      } else {
        // 备注：signUp 成功后，会自动登录
        await auth.signUp({
          phone_number: '+86 ' + phoneNumber,
          verification_code: verificationCode,
          verification_token: verificationTokenRes.verification_token
        });
      }

      // 3. 关键：在登录成功后，立即调用云函数获取用户信息并更新 store
      const userInfoRes = await app.callFunction({ name: 'loginOrRegister', data: { phone: auth.currentUser.phone_number.split(' ')[1] } });
      console.log(userInfoRes)
      // 4. 更新 Pinia 的 state
      this.userInfo = userInfoRes.result;
      this.hasAttemptedLogin = true; // 同样需要更新这个状态

      // 5. 将用户信息返回给调用方（登录组件）
      return this.userInfo;
    },


    /**
     * 退出登录
     */
    async logout() {
      // 如果你的 cloudbase auth 需要调用 signOut
      await auth.signOut()

      // 清空 Pinia store 中的状态
      this.userInfo = null
      this.hasAttemptedLogin = false
    }
  }
})