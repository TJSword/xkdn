import app from '@/lib/cloudbase'

export interface LedgerAccountConfig {
    id?: string
    currency: 'CNY'
    openingPrincipal: number
    openingDate: string
}

export interface LedgerStrategy {
    id?: string
    strategyId: string
    name: string
    color: string
    category: string
    sortOrder: number
    archived?: boolean
}

export interface LedgerRecordInput {
    strategyId: string
    date: string
    amount: number
    cashFlow: number
    note: string
}

export interface LedgerRecord extends LedgerRecordInput {
    id: string
    createdAtMs?: number
    updatedAtMs?: number
}

export type DailyLedgerRecordInput = Omit<LedgerRecordInput, 'date'>

export interface LedgerBundle {
    account: LedgerAccountConfig
    strategies: LedgerStrategy[]
    records: LedgerRecord[]
    truncated: boolean
    calculations: 'client'
    defaultEntryDate: string
}

export class InvestmentLedgerApiError extends Error {
    code: string

    constructor(message: string, code = 'UNKNOWN') {
        super(message)
        this.name = 'InvestmentLedgerApiError'
        this.code = code
    }
}

const callLedger = async <T>(action: string, payload: Record<string, unknown> = {}) => {
    const response: any = await app.callFunction({
        name: 'investmentLedger',
        data: { action, ...payload }
    })
    const result = response?.result

    if (!result?.success) {
        throw new InvestmentLedgerApiError(
            result?.message || '投资账本服务暂时不可用',
            result?.code || 'UNKNOWN'
        )
    }

    return result.data as T
}

export const getLedgerBundle = (range: { startDate?: string; endDate?: string } = {}) =>
    callLedger<LedgerBundle>('getBundle', range)

export const getLedgerRecords = (
    range: { startDate?: string; endDate?: string; limit?: number } = {}
) => callLedger<{ records: LedgerRecord[]; truncated: boolean }>('getRecords', range)

export const saveLedgerAccount = (account: LedgerAccountConfig) =>
    callLedger<{ account: LedgerAccountConfig }>('saveAccount', { account })

export const createLedgerStrategy = (
    strategy: Omit<LedgerStrategy, 'id' | 'archived'> & { strategyId?: string }
) => callLedger<{ strategy: LedgerStrategy }>('createStrategy', { strategy })

export const renameLedgerStrategy = (strategyId: string, name: string) =>
    callLedger<{ strategy: LedgerStrategy }>('renameStrategy', { strategyId, name })

export const setLedgerStrategyArchived = (strategyId: string, archived: boolean) =>
    callLedger<{ strategy: LedgerStrategy }>('setStrategyArchived', { strategyId, archived })

export const deleteLedgerStrategy = (strategyId: string) =>
    callLedger<{ strategyId: string; deletedRecords: number }>('deleteStrategy', { strategyId })

export const saveLedgerRecord = (record: LedgerRecordInput, previousRecordId = '') =>
    callLedger<{ record: LedgerRecord }>('saveRecord', { record, previousRecordId })

export const saveLedgerRecords = (
    records: LedgerRecordInput[],
    options: { skipExisting?: boolean } = {}
) =>
    callLedger<{ records: LedgerRecord[]; skipped: number }>('saveRecords', {
        records,
        skipExisting: Boolean(options.skipExisting)
    })

export const saveDailyLedgerRecords = (records: DailyLedgerRecordInput[]) =>
    callLedger<{ date: string; records: LedgerRecord[] }>('saveDailyRecords', { records })

export const deleteLedgerRecord = (recordId: string) =>
    callLedger<{ record: LedgerRecord }>('deleteRecord', { recordId })
