let isRedirectingToLogin = false

export class AuthExpiredError extends Error {
    code = 401

    constructor(message = '登录已失效，请重新登录') {
        super(message)
        this.name = 'AuthExpiredError'
    }
}

export async function handleAuthExpired(message = '登录已失效，请重新登录') {
    if (isRedirectingToLogin) {
        throw new AuthExpiredError(message)
    }

    isRedirectingToLogin = true

    try {
        const [{ useUserStore }, { default: router }] = await Promise.all([
            import('@/store/user'),
            import('@/router')
        ])
        const userStore = useUserStore()

        await userStore.logout()

        const currentRoute = router.currentRoute.value
        if (currentRoute.path !== '/login') {
            await router.replace({
                path: '/login',
                query: { redirect: currentRoute.fullPath }
            })
        }
    } finally {
        isRedirectingToLogin = false
    }

    throw new AuthExpiredError(message)
}
