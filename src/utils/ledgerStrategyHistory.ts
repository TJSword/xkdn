export interface StrategyNameChange {
    oldName: string
    newName: string
    effectiveDate: string
    changedAtMs: number
    reason: string
}

export const getStrategyNameOnDate = (
    strategy: { name: string; nameHistory?: StrategyNameChange[] },
    date: string
) => {
    const history = strategy.nameHistory || []
    let name = history[0]?.oldName || strategy.name
    for (const change of history) {
        if (change.effectiveDate > date) break
        name = change.newName
    }
    return name
}
