'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'high_dividend_strategy_base'
const DOC_ID = 'latest'
const SERIES_CHUNK_SIZE = 100
const ROOT = path.resolve(__dirname, '..')
const DATA_FILE = path.join(ROOT, 'data', 'hd.json')

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

function formatDate(value) {
    const text = String(value || '')
    if (!/^\d{8}$/.test(text)) throw new Error(`Invalid high-dividend date: ${text}`)
    return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`
}

function round(value, digits = 6) {
    const factor = 10 ** digits
    return Math.round(value * factor) / factor
}

function extractSeries(source) {
    const sheet = source?.chart?.sheet_data
    const rawDates = sheet?.row?.[0]?.data?.[0]
    const cumulativeReturns = sheet?.meas_data?.[1]
    if (!Array.isArray(rawDates) || !Array.isArray(cumulativeReturns) || rawDates.length !== cumulativeReturns.length) {
        throw new Error('Invalid high-dividend chart data')
    }

    const firstGrossValue = 1 + Number(cumulativeReturns[0])
    if (!Number.isFinite(firstGrossValue) || firstGrossValue <= 0) {
        throw new Error('Invalid high-dividend starting value')
    }

    return {
        dateList: rawDates.map(formatDate),
        strategyData: cumulativeReturns.map(value => {
            const grossValue = 1 + Number(value)
            if (!Number.isFinite(grossValue) || grossValue <= 0) throw new Error(`Invalid high-dividend value: ${value}`)
            return round((grossValue / firstGrossValue) * 1000)
        })
    }
}

function main() {
    const source = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    const data = extractSeries(source)

    runCommand('UPDATE', {
        update: COLLECTION,
        updates: [
            {
                q: { _id: DOC_ID },
                u: {
                    $set: {
                        _id: DOC_ID,
                        dateList: [],
                        strategyData: []
                    }
                },
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
                            strategyData: { $each: data.strategyData.slice(start, end) }
                        }
                    }
                }
            ]
        })
        console.log(`Seeded high-dividend strategy ${end}/${data.dateList.length}`)
    }

    console.log(
        `High-dividend strategy ready: ${data.dateList[0]} -> ${data.dateList[data.dateList.length - 1]}, ` +
            `${data.strategyData[0]} -> ${data.strategyData[data.strategyData.length - 1]}`
    )
}

main()
