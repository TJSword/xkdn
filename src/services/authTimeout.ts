export class AuthTimeoutError extends Error {
    constructor(message = '连接超时，请检查网络后重试') {
        super(message)
        this.name = 'AuthTimeoutError'
    }
}

export function withAuthTimeout<T>(request: Promise<T>, message?: string): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new AuthTimeoutError(message)), 12000)
        request.then(resolve, reject).finally(() => clearTimeout(timer))
    })
}
