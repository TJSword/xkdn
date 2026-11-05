import { auth } from '@/lib/cloudbase'
import { AuthTimeoutError, withAuthTimeout } from '@/services/authTimeout'

export type AuthSessionEventType =
  | 'initial'
  | 'sign_in'
  | 'sign_out'

export type AuthSessionEvent = {
  type: AuthSessionEventType
  message?: string
  loginState: any | null
}

type AuthSessionSubscriber = (event: AuthSessionEvent) => void | Promise<void>

const subscribers = new Set<AuthSessionSubscriber>()
let currentLoginState: any | null = null
let initializationPromise: Promise<any | null> | null = null
let listenerRegistered = false
let initialized = false
let sessionInvalidated = false
let sessionRevision = 0

function getLoginStateUid(loginState: any | null) {
  return String(loginState?.user?.uid || '')
}

function isCredentialsMissingError(error: any) {
  const code = String(error?.code || error?.error || '').toLowerCase()
  const message = String(
    error?.message ||
      error?.error_description ||
      error?.errorDescription ||
      error?.errMsg ||
      ''
  )

  return (
    code === 'unauthenticated' ||
    /credentials not found/i.test(message) ||
    /no refresh token found/i.test(message) ||
    /refresh[_ ]token.*expired/i.test(message) ||
    /token updated/i.test(message)
  )
}

function publish(event: AuthSessionEvent) {
  subscribers.forEach(subscriber => {
    Promise.resolve(subscriber(event)).catch(error => {
      console.error('处理 CloudBase 登录态事件失败:', error)
    })
  })
}

function registerLoginStateListener() {
  if (listenerRegistered) return
  listenerRegistered = true

  void auth.onLoginStateChanged((loginState: any | null) => {
    // 失效后仅显式登录成功可以恢复会话，SDK 的迟到通知不能恢复旧凭证。
    if (sessionInvalidated) return
    const previousUid = getLoginStateUid(currentLoginState)
    const nextLoginState = loginState || null
    const nextUid = getLoginStateUid(nextLoginState)
    sessionRevision += 1
    sessionInvalidated = false
    currentLoginState = nextLoginState

    if (!initialized || previousUid === nextUid) return

    if (nextLoginState) {
      publish({ type: 'sign_in', loginState: nextLoginState })
    } else if (previousUid) {
      publish({ type: 'sign_out', loginState: null })
    }
  }).catch(error => {
    console.error('监听 CloudBase 登录态失败:', error)
  })
}

export function subscribeAuthSession(subscriber: AuthSessionSubscriber) {
  subscribers.add(subscriber)
  return () => subscribers.delete(subscriber)
}

export function initializeAuthSession() {
  if (initializationPromise) return initializationPromise

  registerLoginStateListener()
  const revision = sessionRevision
  initializationPromise = withAuthTimeout(auth.getLoginState())
    .then(loginState => {
      if (revision === sessionRevision) currentLoginState = loginState || null
      initialized = true
      publish({ type: 'initial', loginState: currentLoginState })
      return currentLoginState
    })
    .catch(error => {
      if (error instanceof AuthTimeoutError) {
        sessionRevision += 1
        throw error
      }
      if (revision !== sessionRevision) {
        initialized = true
        publish({ type: 'initial', loginState: currentLoginState })
        return currentLoginState
      }
      const fallbackLoginState = auth.hasLoginState() || currentLoginState
      if (fallbackLoginState && !isCredentialsMissingError(error)) {
        currentLoginState = fallbackLoginState
        initialized = true
        publish({ type: 'initial', loginState: currentLoginState })
        return currentLoginState
      }

      currentLoginState = null
      initialized = true
      publish({ type: 'initial', loginState: null })
      return null
    })

  return initializationPromise
}

export function getAuthSession() {
  return currentLoginState
}

export function retryAuthSession() {
  if (sessionInvalidated) return Promise.resolve(null)
  initializationPromise = null
  return initializeAuthSession()
}

export async function completeAuthSignIn() {
  const loginState = await withAuthTimeout(auth.getLoginState())
  if (!loginState) throw new Error('登录状态未能确认，请重新登录')
  sessionRevision += 1
  sessionInvalidated = false
  initialized = true
  currentLoginState = loginState
  initializationPromise = Promise.resolve(loginState)
  publish({ type: 'sign_in', loginState })
}

export function invalidateAuthSession() {
  sessionRevision += 1
  sessionInvalidated = true
  currentLoginState = null
  initializationPromise = Promise.resolve(null)
}

export function getAuthSessionUid() {
  const loginState = getAuthSession()
  return String(loginState?.user?.uid || auth.currentUser?.uid || '')
}

export async function verifyAuthSession() {
  if (sessionInvalidated) return null
  const revision = sessionRevision
  try {
    const loginState = await withAuthTimeout(auth.getLoginState())
    if (revision !== sessionRevision) return currentLoginState
    currentLoginState = loginState || null
    return currentLoginState
  } catch (error) {
    if (error instanceof AuthTimeoutError) throw error
    if (revision !== sessionRevision) return currentLoginState
    if (isCredentialsMissingError(error)) {
      currentLoginState = null
      return null
    }

    currentLoginState = auth.hasLoginState() || currentLoginState
    return currentLoginState
  }
}
