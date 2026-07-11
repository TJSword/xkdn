import app from '@/lib/cloudbase'
import { AuthExpiredError, handleAuthExpired } from '@/services/authExpired'
import { verifyAuthSession } from '@/services/authSession'

type CloudFunctionOptions = {
    name: string
    data?: Record<string, any>
    [key: string]: any
}

const AUTH_EXPIRED_CODES = new Set([
    'UNAUTHENTICATED',
    'AUTH_EXPIRED',
    'CREDENTIALS_EXPIRED'
])
const SDK_CREDENTIAL_ERROR_PATTERNS = [
    /credentials not found/i,
    /no refresh token found/i,
    /refresh[_ ]token.*expired/i,
    /token updated/i
]

function getPayloadCode(payload: any) {
    return payload?.code ?? payload?.statusCode ?? payload?.errorCode ?? payload?.error
}

function getPayloadMessage(payload: any) {
    return String(
        payload?.message ||
        payload?.msg ||
        payload?.errorMessage ||
        payload?.error_description ||
        payload?.errMsg ||
        ''
    )
}

function hasAuthExpiredCode(payload: any) {
    const code = String(getPayloadCode(payload) || '').toUpperCase()
    return AUTH_EXPIRED_CODES.has(code)
}

function hasSdkCredentialError(payload: any) {
    return SDK_CREDENTIAL_ERROR_PATTERNS.some(pattern => pattern.test(getPayloadMessage(payload)))
}

export function isAuthExpiredPayload(payload: any): boolean {
    if (!payload || typeof payload !== 'object') return false
    return hasAuthExpiredCode(payload) || hasSdkCredentialError(payload)
}

function isUnauthorizedCandidate(payload: any): boolean {
    const code = getPayloadCode(payload)
    return code === 401 || code === '401'
}

async function shouldExpireSession(payload: any) {
    if (hasSdkCredentialError(payload)) return true
    if (!hasAuthExpiredCode(payload) && !isUnauthorizedCandidate(payload)) return false
    return !(await verifyAuthSession())
}

export function isAuthExpiredError(error: any): boolean {
    if (error instanceof AuthExpiredError) return true
    if (isAuthExpiredPayload(error)) return true
    if (isAuthExpiredPayload(error?.response?.data)) return true
    if (isAuthExpiredPayload(error?.result)) return true

    const message = String(error?.message || error?.errMsg || '')
    return SDK_CREDENTIAL_ERROR_PATTERNS.some(pattern => pattern.test(message))
}

export function throwIfAuthExpired(error: any): void {
    const payloads = [error, error?.response?.data, error?.result]
    if (payloads.some(hasSdkCredentialError)) {
        void handleAuthExpired(error?.message).catch(() => undefined)
        throw error instanceof AuthExpiredError
            ? error
            : new AuthExpiredError(error?.message)
    }

    if (
        payloads.some(payload => hasAuthExpiredCode(payload) || isUnauthorizedCandidate(payload))
    ) {
        void verifyAuthSession().then(loginState => {
            if (!loginState) {
                void handleAuthExpired(error?.message).catch(() => undefined)
            }
        })
    }
}

export async function callCloudFunction<T = any>(options: CloudFunctionOptions): Promise<T> {
    try {
        const response = await app.callFunction(options)
        if (await shouldExpireSession(response?.result)) {
            await handleAuthExpired(response.result.message || response.result.msg)
        }
        return response as T
    } catch (error: any) {
        if (error instanceof AuthExpiredError) {
            throw error
        }
        const payloads = [error, error?.response?.data, error?.result]
        const hasCredentialError = payloads.some(hasSdkCredentialError)
        const hasAuthCandidate = payloads.some(
            payload => hasAuthExpiredCode(payload) || isUnauthorizedCandidate(payload)
        )
        if (hasCredentialError || (hasAuthCandidate && !(await verifyAuthSession()))) {
            await handleAuthExpired(error?.message)
        }
        throw error
    }
}
