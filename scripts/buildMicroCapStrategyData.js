'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const MICRO_CAP_FILE = path.join(ROOT, 'public', 'static', 'microCapData.json')
const SOURCE_FILE = path.join(ROOT, 'data', 'newdata', 'newmc', '4.json')
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000

function round(value, digits = 2) {
    const factor = 10 ** digits
    return Math.round((Number(value) || 0) * factor) / factor
}

function formatShanghaiDate(timestamp) {
    const date = new Date(Number(timestamp) + SHANGHAI_OFFSET_MS)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function buildSourceRows(source) {
    const times = source.overallReturn?.time || []
    const values = source.overallReturn?.value || []
    const benchmarkValues = source.benchmark?.value || []

    return times
        .map((time, index) => ({
            date: formatShanghaiDate(time),
            strategySource: Number(values[index]),
            benchmarkSource: Number(benchmarkValues[index])
        }))
        .filter(item => item.date && Number.isFinite(item.strategySource) && Number.isFinite(item.benchmarkSource))
}

function main() {
    const data = JSON.parse(fs.readFileSync(MICRO_CAP_FILE, 'utf8'))
    const source = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'))
    const rows = buildSourceRows(source)
    const rowMap = new Map(rows.map(item => [item.date, item]))

    const lastDate = data.dateList[data.dateList.length - 1]
    const baseRow = rowMap.get(lastDate)
    if (!baseRow) {
        throw new Error(`Cannot find source row for current micro-cap tail ${lastDate}`)
    }

    const strategyScale = Number(data.strategyData[data.strategyData.length - 1]) / baseRow.strategySource
    const hs300Scale = Number(data.hs300[data.hs300.length - 1]) / baseRow.benchmarkSource
    const appendRows = rows.filter(item => item.date > lastDate)

    appendRows.forEach(row => {
        data.dateList.push(row.date)
        data.strategyData.push(round(row.strategySource * strategyScale, 2))
        data.hs300.push(round(row.benchmarkSource * hs300Scale, 2))
    })

    fs.writeFileSync(MICRO_CAP_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8')

    console.log(JSON.stringify({
        appended: appendRows.length,
        from: appendRows[0]?.date || null,
        to: appendRows[appendRows.length - 1]?.date || lastDate,
        latestStrategy: data.strategyData[data.strategyData.length - 1],
        latestHs300: data.hs300[data.hs300.length - 1]
    }, null, 2))
}

main()
