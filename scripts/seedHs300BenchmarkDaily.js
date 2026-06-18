'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'benchmark_hs300_daily'
const DOC_ID = 'latest'
const SERIES_CHUNK_SIZE = 80
const ROOT = path.resolve(__dirname, '..')
const DATA_FILE = path.join(ROOT, 'public', 'static', 'allWeatherData.json')

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

function main() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    const latestIndex = data.dateList.length - 1
    const baseDoc = {
        _id: DOC_ID,
        benchmarkId: 'hs300',
        name: '沪深300',
        displayName: '沪深300',
        code: '510300',
        dateList: [],
        valueData: [],
        latestDate: data.dateList[latestIndex],
        latestValue: data.hs300[latestIndex],
        historicalSource: 'data/newdata/沪深300.xlsx',
        updateSource: 'tencent-newfqkline-sh510300',
        seededAt: new Date().toISOString()
    }

    runCommand('UPDATE', {
        update: COLLECTION,
        updates: [
            {
                q: { _id: DOC_ID },
                u: { $set: baseDoc },
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
                            valueData: { $each: data.hs300.slice(start, end) }
                        }
                    }
                }
            ]
        })
        console.log(`Seeded hs300 benchmark ${end}/${data.dateList.length}`)
    }
}

main()
