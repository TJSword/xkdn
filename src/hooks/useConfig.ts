/*
 * @LastEditors: BoLin
 * @Date: 2023-04-06 14:44:42
 * @LastEditTime: 2023-04-17 09:24:59
 * @FilePath: \digital-twin-system-framework\src\hooks\useConfig.ts
 * @Description: 环境变量
 * @Description: 注意production模式下__PRODUCTION__SERVICE__CONFIG变量中的属性是按需导出的。
 * @Description: 如果需要从__PRODUCTION__SERVICE__CONFIG下解构多个属性，需要配置.env.production的导出项
 */

export function getGlobalConfig() {
    const ENV = (
        import.meta.env.DEV ? (import.meta.env as any) : window.__PRODUCTION__SERVICE__CONFIG
    ) as any
    return ENV
}
