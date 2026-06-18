'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'all_weather_strategy_base'
const DOC_ID = 'latest'
const ROOT = path.resolve(__dirname, '..')
const DATA_FILE = path.join(ROOT, 'public', 'static', 'allWeatherData.json')
const DATES_TO_PATCH = [
    '2026-06-05',
    '2026-06-08',
    '2026-06-09',
    '2026-06-10',
    '2026-06-11',
    '2026-06-12',
    '2026-06-15',
    '2026-06-16'
]

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

function main() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    const patch = {}

    for (const date of DATES_TO_PATCH) {
        const index = data.dateList.indexOf(date)
        if (index < 0) throw new Error(`date not found: ${date}`)
        patch[`hs300.${index}`] = data.hs300[index]
    }

    patch.hs300HistoricalSource = 'data/newdata/沪深300.xlsx'
    patch.hs300UpdateSource = 'tencent-newfqkline-sh510300'
    patch.latestHs300 = {
        tradeDate: data.dateList[data.dateList.length - 1],
        value: data.hs300[data.hs300.length - 1],
        historicalSource: patch.hs300HistoricalSource,
        updateSource: patch.hs300UpdateSource
    }

    runCommand({
        update: COLLECTION,
        updates: [
            {
                q: { _id: DOC_ID },
                u: { $set: patch }
            }
        ]
    })
}

main()
