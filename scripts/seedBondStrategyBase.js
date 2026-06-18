'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'bond_strategy_base'
const DOC_ID = 'latest'
const SERIES_CHUNK_SIZE = 100
const ROOT = path.resolve(__dirname, '..')
const DATA_FILE = path.join(ROOT, 'public', 'static', 'bondData.json')

function runCommand(command) {
    const payload = JSON.stringify([
        {
            TableName: COLLECTION,
            CommandType: 'UPDATE',
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

function buildBaseDoc(data) {
    const lastIndex = data.dateList.length - 1
    return {
        _id: DOC_ID,
        strategyId: 'convertible-bond',
        name: '可转债策略',
        dateList: [],
        strategyData: [],
        equalWeight: [],
        latestDate: data.dateList[lastIndex],
        latestStrategyIndexValue: data.strategyData[lastIndex],
        latestEqualWeight: data.equalWeight[lastIndex],
        rebalanceTime: '14:40',
        slippageRate: 0.001,
        equalWeightSource: 'jisilu-cb-index-quote',
        seededAt: new Date().toISOString(),
        source: 'public/static/bondData.json'
    }
}

function main() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    runCommand({
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
        runCommand({
            update: COLLECTION,
            updates: [
                {
                    q: { _id: DOC_ID },
                    u: {
                        $push: {
                            dateList: { $each: data.dateList.slice(start, end) },
                            strategyData: { $each: data.strategyData.slice(start, end) },
                            equalWeight: { $each: data.equalWeight.slice(start, end) }
                        }
                    }
                }
            ]
        })
        console.log(`Seeded bond strategy ${end}/${data.dateList.length}`)
    }
}

main()
