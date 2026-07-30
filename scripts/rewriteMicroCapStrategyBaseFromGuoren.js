'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'micro_cap_strategy_base'
const DOC_ID = 'latest'
const SOURCE_FILE = path.join(ROOT, 'data', 'mc_data.json')
const SERIES_CHUNK_SIZE = 100
const APPLY = process.argv.includes('--apply')

function findTcbCli() {
    const candidates = [
        process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'node_modules', '@cloudbase', 'cli', 'bin', 'tcb'),
        path.join(ROOT, 'node_modules', '@cloudbase', 'cli', 'bin', 'tcb')
    ].filter(Boolean)
    const cli = candidates.find(candidate => fs.existsSync(candidate))
    if (!cli) throw new Error('CloudBase CLI entrypoint not found')
    return cli
}

function parseCliJson(stdout) {
    const lines = String(stdout || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    for (let index = 0; index < lines.length; index += 1) {
        if (!lines[index].startsWith('{') && !lines[index].startsWith('[')) continue
        try {
            return JSON.parse(lines.slice(index).join('\n'))
        } catch {}
    }
    throw new Error('CloudBase CLI returned no JSON result')
}

function runCommand(commandType, command) {
    const payload = JSON.stringify([
        {
            TableName: COLLECTION,
            CommandType: commandType,
            Command: JSON.stringify(command)
        }
    ])
    const result = spawnSync(
        process.execPath,
        [
            findTcbCli(),
            'db',
            'nosql',
            'execute',
            '-e',
            ENV_ID,
            '--json',
            '--command',
            payload
        ],
        {
            cwd: ROOT,
            encoding: 'utf8',
            maxBuffer: 20 * 1024 * 1024,
            shell: false
        }
    )
    if (result.status !== 0) {
        const error = parseCliJson(result.stdout || result.stderr)
        throw new Error(error?.error?.message || `CloudBase command failed with status ${result.status}`)
    }
    return parseCliJson(result.stdout)
}

function findLatestDocument(node) {
    if (!node) return null
    if (typeof node === 'string') {
        const text = node.trim()
        if (!text.startsWith('{') && !text.startsWith('[')) return null
        try {
            return findLatestDocument(JSON.parse(text))
        } catch {
            return null
        }
    }
    if (Array.isArray(node)) {
        for (const item of node) {
            const found = findLatestDocument(item)
            if (found) return found
        }
        return null
    }
    if (typeof node !== 'object') return null
    if (node._id === DOC_ID) return node
    for (const value of Object.values(node)) {
        const found = findLatestDocument(value)
        if (found) return found
    }
    return null
}

function decodeExtendedJson(node) {
    if (Array.isArray(node)) return node.map(decodeExtendedJson)
    if (!node || typeof node !== 'object') return node
    if ('$numberInt' in node) return Number(node.$numberInt)
    if ('$numberLong' in node) return Number(node.$numberLong)
    if ('$numberDouble' in node) return Number(node.$numberDouble)
    if ('$numberDecimal' in node) return Number(node.$numberDecimal)
    return Object.fromEntries(
        Object.entries(node).map(([key, value]) => [key, decodeExtendedJson(value)])
    )
}

function describeShape(node, depth = 0) {
    if (depth > 4 || node === null || node === undefined) return typeof node
    if (typeof node === 'string') return { type: 'string', length: node.length }
    if (Array.isArray(node)) {
        return {
            type: 'array',
            length: node.length,
            first: node.length ? describeShape(node[0], depth + 1) : null
        }
    }
    if (typeof node !== 'object') return typeof node
    return Object.fromEntries(
        Object.entries(node).map(([key, value]) => [key, describeShape(value, depth + 1)])
    )
}

function getExistingDocument() {
    const result = runCommand('QUERY', {
        find: COLLECTION,
        filter: { _id: DOC_ID }
    })
    const document = findLatestDocument(result)
    if (!document) {
        throw new Error(`${COLLECTION}/${DOC_ID} not found; response shape: ${JSON.stringify(describeShape(result))}`)
    }
    return decodeExtendedJson(document)
}

function round(value, digits = 6) {
    const factor = 10 ** digits
    return Math.round(Number(value) * factor) / factor
}

function buildReplacement(source, existing) {
    const chart = source?.chart?.sheet_data
    const dailyChart = source?.daily_chart?.sheet_data
    const dateList = chart?.row?.[0]?.data?.[1]
    const cumulativeReturns = chart?.meas_data?.[1]
    const dailyDates = dailyChart?.row?.[0]?.data?.[1]
    const sourceDailyReturns = dailyChart?.meas_data?.[1]

    if (!Array.isArray(dateList) || !Array.isArray(cumulativeReturns) || dateList.length !== cumulativeReturns.length) {
        throw new Error('mc_data chart date and strategy series are invalid')
    }
    if (!Array.isArray(dailyDates) || !Array.isArray(sourceDailyReturns) || dailyDates.length !== sourceDailyReturns.length) {
        throw new Error('mc_data daily chart date and strategy series are invalid')
    }
    if (dailyDates.length !== dateList.length - 1 || dailyDates.some((date, index) => date !== dateList[index + 1])) {
        throw new Error('mc_data cumulative and daily dates are not aligned')
    }

    const existingDates = Array.isArray(existing.dateList) ? existing.dateList : []
    const existingHs300 = Array.isArray(existing.hs300) ? existing.hs300 : []
    if (existingDates.length !== existingHs300.length) {
        throw new Error('Existing dateList and hs300 lengths are inconsistent')
    }
    const hs300ByDate = new Map(existingDates.map((date, index) => [date, existingHs300[index]]))
    const missingHs300Dates = dateList.filter(date => !hs300ByDate.has(date))
    if (missingHs300Dates.length) {
        throw new Error(`Existing hs300 is missing ${missingHs300Dates.length} source dates, first: ${missingHs300Dates[0]}`)
    }

    const existingStrategyBase = Number(existing.strategyData?.[0])
    const sourceStrategyBase = 1 + Number(cumulativeReturns[0])
    if (!Number.isFinite(existingStrategyBase) || existingStrategyBase <= 0 || sourceStrategyBase <= 0) {
        throw new Error('Existing or source strategy baseline is invalid')
    }
    const strategyScale = existingStrategyBase / sourceStrategyBase
    const strategyData = cumulativeReturns.map(value => round((1 + Number(value)) * strategyScale))
    const dailyReturn = [0, ...sourceDailyReturns.map(value => round(value))]
    const hs300 = dateList.map(date => hs300ByDate.get(date))
    const lastIndex = dateList.length - 1

    return {
        dateList,
        strategyData,
        hs300,
        dailyReturn,
        latestDate: dateList[lastIndex],
        latestStrategyIndexValue: strategyData[lastIndex],
        latestHs300: hs300[lastIndex],
        latestDailyReturn: dailyReturn[lastIndex]
    }
}

function writeReplacement(replacement) {
    runCommand('UPDATE', {
        update: COLLECTION,
        updates: [
            {
                q: { _id: DOC_ID },
                u: {
                    $set: {
                        dateList: [],
                        strategyData: [],
                        hs300: [],
                        dailyReturn: [],
                        latestDate: replacement.latestDate,
                        latestStrategyIndexValue: replacement.latestStrategyIndexValue,
                        latestHs300: replacement.latestHs300,
                        latestDailyReturn: replacement.latestDailyReturn
                    }
                },
                upsert: false
            }
        ]
    })

    for (let start = 0; start < replacement.dateList.length; start += SERIES_CHUNK_SIZE) {
        const end = Math.min(start + SERIES_CHUNK_SIZE, replacement.dateList.length)
        runCommand('UPDATE', {
            update: COLLECTION,
            updates: [
                {
                    q: { _id: DOC_ID },
                    u: {
                        $push: {
                            dateList: { $each: replacement.dateList.slice(start, end) },
                            strategyData: { $each: replacement.strategyData.slice(start, end) },
                            hs300: { $each: replacement.hs300.slice(start, end) },
                            dailyReturn: { $each: replacement.dailyReturn.slice(start, end) }
                        }
                    }
                }
            ]
        })
    }
}

function summarize(document) {
    return {
        fields: Object.keys(document).sort(),
        lengths: {
            dateList: document.dateList?.length || 0,
            strategyData: document.strategyData?.length || 0,
            hs300: document.hs300?.length || 0,
            dailyReturn: document.dailyReturn?.length || 0
        },
        first: {
            date: document.dateList?.[0] || null,
            strategy: document.strategyData?.[0] ?? null,
            hs300: document.hs300?.[0] ?? null,
            dailyReturn: document.dailyReturn?.[0] ?? null
        },
        latest: {
            date: document.dateList?.at(-1) || document.latestDate || null,
            strategy: document.strategyData?.at(-1) ?? document.latestStrategyIndexValue ?? null,
            hs300: document.hs300?.at(-1) ?? document.latestHs300 ?? null,
            dailyReturn: document.dailyReturn?.at(-1) ?? document.latestDailyReturn ?? null
        }
    }
}

function main() {
    const source = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'))
    const existing = getExistingDocument()
    const replacement = buildReplacement(source, existing)

    if (!APPLY) {
        console.log(JSON.stringify({
            mode: 'dry-run',
            target: `${COLLECTION}/${DOC_ID}`,
            existing: summarize(existing),
            replacement: summarize(replacement)
        }, null, 2))
        return
    }

    writeReplacement(replacement)
    const written = getExistingDocument()
    const beforeFields = Object.keys(existing).sort()
    const afterFields = Object.keys(written).sort()
    const fieldsPreserved = JSON.stringify(beforeFields) === JSON.stringify(afterFields)
    const summary = summarize(written)
    const expected = summarize(replacement)
    const verified =
        fieldsPreserved &&
        JSON.stringify(summary.lengths) === JSON.stringify(expected.lengths) &&
        JSON.stringify(summary.first) === JSON.stringify(expected.first) &&
        JSON.stringify(summary.latest) === JSON.stringify(expected.latest)

    console.log(JSON.stringify({
        mode: 'applied',
        target: `${COLLECTION}/${DOC_ID}`,
        fieldsPreserved,
        verified,
        written: summary
    }, null, 2))
    if (!verified) process.exitCode = 1
}

main()
