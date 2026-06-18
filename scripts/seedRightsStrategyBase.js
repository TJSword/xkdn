'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'rights_strategy_base'
const DOC_ID = 'latest'
const SERIES_CHUNK_SIZE = 100
const ROOT = path.resolve(__dirname, '..')
const DATA_FILE = path.join(ROOT, 'public', 'static', 'rightsStrategyData.json')

function runCommand(commandType, command) {
    const payload = JSON.stringify([
        {
            TableName: COLLECTION,
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

function ensureCollection() {
    try {
        runCommand('INSERT', {
            insert: COLLECTION,
            documents: [{ _id: '__init__', createdAt: new Date().toISOString() }]
        })
    } catch (error) {
        console.warn(`Collection bootstrap skipped: ${error.message}`)
    }
}

function cleanupCollectionMarker() {
    try {
        runCommand('DELETE', {
            delete: COLLECTION,
            deletes: [{ q: { _id: '__init__' }, limit: 1 }]
        })
    } catch (error) {
        console.warn(`Collection marker cleanup skipped: ${error.message}`)
    }
}

function buildBaseDoc(data) {
    const lastIndex = data.dateList.length - 1
    return {
        _id: DOC_ID,
        strategyId: 'rights-strategy',
        name: '含权策略',
        dateList: [],
        strategyData: [],
        hs300: [],
        dailyReturn: [],
        holdingCount: [],
        turnover: [],
        fee: [],
        latestDate: data.dateList[lastIndex],
        latestStrategyIndexValue: data.strategyData[lastIndex],
        latestHs300: data.hs300[lastIndex],
        latestDailyReturn: data.dailyReturn[lastIndex],
        latestHoldingCount: data.holdingCount[lastIndex],
        latestTurnover: data.turnover[lastIndex],
        latestFee: data.fee[lastIndex],
        rebalanceTime: '14:40',
        slippageRate: 0.001,
        seededAt: new Date().toISOString(),
        source: data.source || 'public/static/rightsStrategyData.json',
        hs300Source: data.hs300Source || 'public/static/allWeatherData.json'
    }
}

function main() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    ensureCollection()
    runCommand('UPDATE', {
        update: COLLECTION,
        updates: [
            {
                q: { _id: DOC_ID },
                u: { $set: buildBaseDoc(data) },
                upsert: true
            }
        ]
    })

    for (let start = 0; start < data.dateList.length; start += SERIES_CHUNK_SIZE) {
        const end = Math.min(start + SERIES_CHUNK_SIZE, data.dateList.length)
        runCommand('UPDATE', {
            update: COLLECTION,
            updates: [
                {
                    q: { _id: DOC_ID },
                    u: {
                        $push: {
                            dateList: { $each: data.dateList.slice(start, end) },
                            strategyData: { $each: data.strategyData.slice(start, end) },
                            hs300: { $each: data.hs300.slice(start, end) },
                            dailyReturn: { $each: data.dailyReturn.slice(start, end) },
                            holdingCount: { $each: data.holdingCount.slice(start, end) },
                            turnover: { $each: data.turnover.slice(start, end) },
                            fee: { $each: data.fee.slice(start, end) }
                        }
                    }
                }
            ]
        })
        console.log(`Seeded rights strategy ${end}/${data.dateList.length}`)
    }

    cleanupCollectionMarker()
}

main()
