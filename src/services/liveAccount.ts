import { callCloudFunction } from '@/services/cloudFunction'

export interface LivePoint {
    date: string
    nav: number
    dailyReturn: number
    drawdown?: number
}
export interface LiveStrategy {
    strategyId: string
    name: string
    color: string
    category: string
    archived: boolean
    description?: string
    points: LivePoint[]
}
export interface LiveHolding {
    strategyId: string
    name: string
    color: string
    weight: number
    recordedDate: string
}
export interface LiveOverview {
    points: LivePoint[]
    strategies: LiveStrategy[]
    snapshots: Array<{ date: string; holdings: LiveHolding[] }>
    updatedAtMs: number
}
async function callLive<T>(action: string, payload: Record<string, string> = {}): Promise<T> {
    const response = await callCloudFunction({ name: 'liveAccount', data: { action, ...payload } })
    if (!response?.result?.success) {
        throw Object.assign(new Error(response?.result?.message || '实盘数据读取失败'), { code: response?.result?.code })
    }
    return response.result.data
}
export const getLiveOverview = () => callLive<LiveOverview>('getOverview')
export const bindLiveAccount = () => callLive<{ configured: boolean }>('bindCurrentAccount')
export const saveLiveStrategyDescription = (strategyId: string, description: string) => callLive<{ strategyId: string; description: string }>('saveStrategyDescription', { strategyId, description })
