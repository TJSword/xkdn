/*
 * @Author: BoLin
 * @Date: 2022-12-13 14:29:24
 * @LastEditors: BoLin
 * @LastEditTime: 2023-04-27 14:49:32
 * @FilePath: \digital-twin-system-framework\src\api\demo1.ts
 */

// 导入request方法和baseURL地址
import { request } from '@/utils/http'
import { getGlobalConfig } from '@/hooks/useConfig'

// 按需解构baseURL地址
const { VITE_API_BASE_URL } = getGlobalConfig()

// 请求当前星级
export function getStarNow(params = {}) {
  return request.get({
    url: "/api/img/tu/girl",
    params: params,
    baseURL: 'https://api.52vmy.cn'
  })
}
