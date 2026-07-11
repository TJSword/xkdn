// src/store/user.js

import { defineStore } from 'pinia'
import { auth } from '@/lib/cloudbase'
import { callCloudFunction } from '@/services/cloudFunction'
import {
  getAuthSession,
  getAuthSessionUid,
  verifyAuthSession
} from '@/services/authSession'

const USER_INFO_CACHE_KEY = 'xkdn:user-info:v1'
const USER_INFO_CACHE_TTL = 30 * 60 * 1000
let userInfoSyncPromise: Promise<any> | null = null

function canUseLocalStorage() {
  return typeof window !== 'undefined' && !!window.localStorage
}

function readUserInfoCache() {
  if (!canUseLocalStorage()) return null

  try {
    const raw = window.localStorage.getItem(USER_INFO_CACHE_KEY)
    if (!raw) return null

    const cache = JSON.parse(raw)
    if (!cache?.userInfo || typeof cache.syncedAt !== 'number') return null

    return cache
  } catch (error) {
    window.localStorage.removeItem(USER_INFO_CACHE_KEY)
    return null
  }
}

function writeUserInfoCache(userInfo: any) {
  if (!canUseLocalStorage()) return 0

  const syncedAt = Date.now()
  window.localStorage.setItem(
    USER_INFO_CACHE_KEY,
    JSON.stringify({
      userInfo,
      uid: String(userInfo?.uid || ''),
      syncedAt
    })
  )

  return syncedAt
}

function clearUserInfoCache() {
  if (!canUseLocalStorage()) return
  window.localStorage.removeItem(USER_INFO_CACHE_KEY)
}

function isCacheFresh(syncedAt: number) {
  return syncedAt > 0 && Date.now() - syncedAt < USER_INFO_CACHE_TTL
}

function isCredentialsMissingError(error: any) {
  const message = String(
    error?.message ||
    error?.error_description ||
    error?.errorDescription ||
    ''
  )
  const code = String(error?.code || error?.error || '')
  return /credentials not found/i.test(message) || code === 'unauthenticated'
}

function isActiveVip(userInfo: any) {
  if (!userInfo?.isVip) return false
  if (!userInfo.vipExpiry) return true

  const expiry = Number(userInfo.vipExpiry)
  return Number.isFinite(expiry) && expiry > Date.now()
}

function getInitialUserState() {
  const cache = readUserInfoCache()

  if (cache && isCacheFresh(cache.syncedAt)) {
    return {
      userInfo: cache.userInfo,
      lastSyncedAt: cache.syncedAt,
      hasAttemptedLogin: true,
      hasSyncedInCurrentApp: false
    }
  }

  return {
    userInfo: null,
    lastSyncedAt: 0,
    hasAttemptedLogin: false,
    hasSyncedInCurrentApp: false
  }
}

export const useUserStore = defineStore('user', {
  state: (): any => getInitialUserState(),

  getters: {
    isVip: (state) => isActiveVip(state.userInfo),
    isLoggedIn: (state) => state.userInfo !== null,
    isUserInfoFresh: (state) => !!state.userInfo && isCacheFresh(state.lastSyncedAt)
  },

  actions: {
    /**
     * 【核心】在任何认证操作（登录、注册）成功后，调用此内部方法来获取/同步我们自己数据库的用户信息
     * @returns {Promise<any>} 返回从我们数据库获取的用户信息
     */
    async _syncUserInfo(phoneNumber?: any, options: { trackLogin?: boolean } = {}) {
      if (userInfoSyncPromise) return userInfoSyncPromise

      userInfoSyncPromise = (async () => {
        const res: any = await callCloudFunction({
          name: 'loginOrRegister',
          data: {
            action: options.trackLogin ? 'signIn' : 'get',
            phone: phoneNumber
          }
        })
        const userInfo = res?.result
        if (!userInfo || userInfo.success === false || !userInfo.uid) {
          throw new Error(userInfo?.message || '用户资料读取失败')
        }

        this.userInfo = userInfo
        this.lastSyncedAt = writeUserInfoCache(userInfo)
        this.hasAttemptedLogin = true
        this.hasSyncedInCurrentApp = true
        return userInfo
      })()

      try {
        return await userInfoSyncPromise
      } finally {
        userInfoSyncPromise = null
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
      return this._syncUserInfo(phoneNumber, { trackLogin: true })
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

      return this._syncUserInfo(phoneNumber, { trackLogin: true })
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
      const loginState = getAuthSession() || await verifyAuthSession()
      const sessionUid = getAuthSessionUid()

      if (!loginState) {
        this.clearLocalUser()
        return null
      }

      if (
        this.userInfo &&
        sessionUid &&
        String(this.userInfo.uid || '') === sessionUid &&
        isCacheFresh(this.lastSyncedAt)
      ) {
        this.hasAttemptedLogin = true
        return this.userInfo
      }

      const cache = readUserInfoCache()
      if (
        cache &&
        sessionUid &&
        String(cache.uid || cache.userInfo?.uid || '') === sessionUid &&
        isCacheFresh(cache.syncedAt)
      ) {
        this.userInfo = cache.userInfo
        this.lastSyncedAt = cache.syncedAt
        this.hasAttemptedLogin = true
        return this.userInfo
      }

      return this._syncUserInfo()
    },

    clearLocalUser() {
      this.userInfo = null
      this.hasAttemptedLogin = false
      this.hasSyncedInCurrentApp = false
      this.lastSyncedAt = 0
      clearUserInfoCache()
    },

    markAuthSessionAvailable() {
      this.hasAttemptedLogin = false
    },

    /**
     * 退出登录
     */
    async logout() {
      try {
        // 先调用 SDK 的登出方法，清除本地存储的凭证
        await auth.signOut();
      } catch (e) {
        if (!isCredentialsMissingError(e)) {
          console.error("SDK 登出失败:", e);
        }
      } finally {
        this.clearLocalUser()
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
      const res = await callCloudFunction({
        name: 'updateUserHoldings',
        data: { holdings }
      })

      if (res.result.success) {
        // 2. 【关键】云端更新成功后，手动更新本地 store 中的 userInfo
        // 这样你的所有页面都能立即看到最新的持仓，而不用重新拉取用户信息
        if (this.userInfo) {
          this.userInfo.holdings = res.result.data
          this.lastSyncedAt = writeUserInfoCache(this.userInfo)
        }
        return res.result
      } else {
        throw new Error(res.result.msg || '更新失败')
      }
    }
  }
})
