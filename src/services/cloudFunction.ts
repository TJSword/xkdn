import app from '@/lib/cloudbase'
import { AuthExpiredError, handleAuthExpired } from '@/services/authExpired'

type CloudFunctionOptions = {
    name: string
    data?: Record<string, any>
    [key: string]: any
}

const AUTH_EXPIRED_MESSAGES = [
    '未登录',
    '请先登录',
    '登录已失效',
    '登录态',
    '登录凭证',
    'auth expired',
    'unauthorized',
    'invalid token',
    'login required'
]

function getPayloadCode(payload: any) {
    return payload?.code ?? payload?.statusCode ?? payload?.errorCode
}

export function isAuthExpiredPayload(payload: any): boolean {
    if (!payload || typeof payload !== 'object') return false

    const code = getPayloadCode(payload)
    if (code === 401 || code === '401') return true

    const message = String(payload.message || payload.msg || payload.errorMessage || payload.errMsg || '').toLowerCase()
    return AUTH_EXPIRED_MESSAGES.some(keyword => message.includes(keyword.toLowerCase()))
}

export function isAuthExpiredError(error: any): boolean {
    if (error instanceof AuthExpiredError) return true
    if (isAuthExpiredPayload(error)) return true
    if (isAuthExpiredPayload(error?.response?.data)) return true
    if (isAuthExpiredPayload(error?.result)) return true

    const message = String(error?.message || error?.errMsg || '').toLowerCase()
    return AUTH_EXPIRED_MESSAGES.some(keyword => message.includes(keyword.toLowerCase()))
}

export function throwIfAuthExpired(error: any): void {
    if (isAuthExpiredError(error)) {
        throw error
    }
}

export async function callCloudFunction<T = any>(options: CloudFunctionOptions): Promise<T> {
    try {
        const response = await app.callFunction(options)
        if (isAuthExpiredPayload(response?.result)) {
            await handleAuthExpired(response.result.message || response.result.msg)
        }
        return response as T
    } catch (error: any) {
        if (error instanceof AuthExpiredError) {
            throw error
        }
        if (isAuthExpiredError(error)) {
            await handleAuthExpired(error?.message)
        }
        throw error
    }
}
