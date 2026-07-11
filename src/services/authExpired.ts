let authExpiryPromise: Promise<void> | null = null

export class AuthExpiredError extends Error {
    code = 401

    constructor(message = '登录已失效，请重新登录') {
        super(message)
        this.name = 'AuthExpiredError'
    }
}

export async function handleAuthExpired(message = '登录已失效，请重新登录') {
    if (!authExpiryPromise) {
        authExpiryPromise = (async () => {
            const [{ useUserStore }, { default: router }] = await Promise.all([
                import('@/store/user'),
                import('@/router')
            ])
            const userStore = useUserStore()
            userStore.clearLocalUser()

            const currentRoute = router.currentRoute.value
            if (currentRoute.path !== '/login') {
                await router.replace({
                    path: '/login',
                    query: {
                        redirect: currentRoute.fullPath,
                        reason: message.includes('其他设备') ? 'session-replaced' : 'expired'
                    }
                })
            }
        })().finally(() => {
            authExpiryPromise = null
        })
    }

    await authExpiryPromise

    throw new AuthExpiredError(message)
}
