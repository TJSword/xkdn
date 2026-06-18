'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'momentum_strategy_base'
const REALTIME_COLLECTION = 'momentum_strategy_realtime'
const DOC_ID = 'latest'
const SERIES_CHUNK_SIZE = 100
const ROOT = path.resolve(__dirname, '..')
const DATA_FILE = path.join(ROOT, 'public', 'static', 'momentumData.json')

function runCommand(collection, commandType, command) {
    const payload = JSON.stringify([
        {
            TableName: collection,
            CommandType: commandType,
            Command: JSON.stringify(command)
        }
    ])
    const escapedPayload = payload.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "''")
    const shellCommand = `$cmd='${escapedPayload}'; npx --yes --package @cloudbase/cli@latest tcb db nosql execute -e ${ENV_ID} --json --command $cmd`

    const result = spawnSync(
        process.platform === 'win32' ? 'powershell.exe' : 'sh',
        process.platform === 'win32' ? ['-NoProfile', '-Command', shellCommand] : ['-lc', shellCommand],
        { cwd: ROOT, stdio: 'inherit', shell: false }
    )

    if (result.status !== 0) {
        throw new Error(`CloudBase command failed with status ${result.status}`)
    }
}

function ensureCollection(collection) {
    try {
        runCommand(collection, 'INSERT', {
            insert: collection,
            documents: [{ _id: '__init__', createdAt: new Date().toISOString() }]
        })
    } catch (error) {
        console.warn(`${collection} bootstrap skipped: ${error.message}`)
    }
}

function cleanupCollectionMarker(collection) {
    try {
        runCommand(collection, 'DELETE', {
            delete: collection,
            deletes: [{ q: { _id: '__init__' }, limit: 1 }]
        })
    } catch (error) {
        console.warn(`${collection} marker cleanup skipped: ${error.message}`)
    }
}

function buildDailyReturn(strategyData) {
    return strategyData.map((value, index) => {
        if (index === 0) return 0
        const previous = Number(strategyData[index - 1])
        return previous ? Number((Number(value) / previous - 1).toFixed(6)) : 0
    })
}

function buildBaseDoc(data, dailyReturn) {
    const lastIndex = data.dateList.length - 1
    return {
        _id: DOC_ID,
        strategyId: 'momentum',
        name: '动量策略',
        dateList: [],
        strategyData: [],
        hs300: [],
        dailyReturn: [],
        latestDate: data.dateList[lastIndex],
        latestStrategyIndexValue: data.strategyData[lastIndex],
        latestHs300: data.hs300[lastIndex],
        latestDailyReturn: dailyReturn[lastIndex],
        latestHolding: {
            code: '159259',
            name: '成长ETF易方达',
            indexName: '成长100',
            weight: 1
        },
        rebalanceTime: '14:50',
        slippageRate: 0.001,
        seededAt: new Date().toISOString(),
        source: 'public/static/momentumData.json',
        hs300Source: 'public/static/allWeatherData.json'
    }
}

function main() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    const dailyReturn = buildDailyReturn(data.strategyData)

    ensureCollection(COLLECTION)
    ensureCollection(REALTIME_COLLECTION)

    runCommand(COLLECTION, 'UPDATE', {
        update: COLLECTION,
        updates: [
            {
                q: { _id: DOC_ID },
                u: { $set: buildBaseDoc(data, dailyReturn) },
                upsert: true
            }
        ]
    })

    for (let start = 0; start < data.dateList.length; start += SERIES_CHUNK_SIZE) {
        const end = Math.min(start + SERIES_CHUNK_SIZE, data.dateList.length)
        runCommand(COLLECTION, 'UPDATE', {
            update: COLLECTION,
            updates: [
                {
                    q: { _id: DOC_ID },
                    u: {
                        $push: {
                            dateList: { $each: data.dateList.slice(start, end) },
                            strategyData: { $each: data.strategyData.slice(start, end) },
                            hs300: { $each: data.hs300.slice(start, end) },
                            dailyReturn: { $each: dailyReturn.slice(start, end) }
                        }
                    }
                }
            ]
        })
        console.log(`Seeded momentum strategy ${end}/${data.dateList.length}`)
    }

    cleanupCollectionMarker(COLLECTION)
    cleanupCollectionMarker(REALTIME_COLLECTION)
}

main()
