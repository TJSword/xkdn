/*
 * @Author: BoLin
 * @Date: 2023-04-03 10:46:05
 * @LastEditors: BoLin
 * @LastEditTime: 2023-04-25 14:32:56
 * @FilePath: \digital-twin-system-framework\src\api\demo2.ts
 */

// 示例
import { request } from '@/utils/http'

export function getMonthRank2(params = {}) {
    return request.post({
        url: '/rank',
        data: params
    })
}
