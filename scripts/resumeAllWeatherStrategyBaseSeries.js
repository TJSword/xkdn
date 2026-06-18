'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'all_weather_strategy_base'
const DOC_ID = 'latest'
const SERIES_CHUNK_SIZE = 100
const ROOT = path.resolve(__dirname, '..')
const DATA_FILE = path.join(ROOT, 'public', 'static', 'allWeatherData.json')

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
    const fromDateArg = process.argv.find(arg => arg.startsWith('--after='))
    const afterDate = fromDateArg ? fromDateArg.slice('--after='.length) : '2023-05-30'
    const afterIndex = data.dateList.indexOf(afterDate)

    if (afterIndex < 0) {
        throw new Error(`after date not found: ${afterDate}`)
    }

    for (let start = afterIndex + 1; start < data.dateList.length; start += SERIES_CHUNK_SIZE) {
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
                            hs300: { $each: data.hs300.slice(start, end) }
                        },
                        $set: {
                            hs300Source: 'tencent-newfqkline-sh510300',
                            latestHs300: {
                                tradeDate: data.dateList[data.dateList.length - 1],
                                value: data.hs300[data.hs300.length - 1],
                                source: 'tencent-newfqkline-sh510300'
                            }
                        }
                    }
                }
            ]
        })
        console.log(`Resumed series ${end}/${data.dateList.length}`)
    }
}

main()
