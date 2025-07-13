/*
 * @Author: 吹面不寒
 * @Date: 2023-04-25
 * @LastEditors: BoLin
 * @LastEditTime: 2023-05-16 11:05:22
 * @Description: 自动化创建代理，解决跨域
 * @FilePath: \digital-twin-system-framework\build\createProxy.ts
 */
interface ProxyConfig {
    [key: string]: {
        target: string
        changeOrigin: boolean
        rewrite: (path: string) => string
    }
}

interface Env {
    [key: string]: string
}

export default function createProxy(env: Env): ProxyConfig {
    const regex = /^VITE_API_BASE_URL.*/
    const result: ProxyConfig = {} as ProxyConfig
    for (const key in env) {
        if (regex.test(key)) {
            result[env[key]] = {
                target: env['VITE_API_PROXY_URL_' + key.split('_').at(-1)],
                changeOrigin: true,
                rewrite: path => path.replace(new RegExp(`^${env[key]}`), '')
            }
        }
    }
    return result
}
