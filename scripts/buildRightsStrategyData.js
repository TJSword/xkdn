'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const NEW_DATA_DIR = path.join(ROOT, 'data', 'newdata')
const RIGHTS_STATIC_FILE = path.join(ROOT, 'public', 'static', 'rightsStrategyData.json')
const ALL_WEATHER_FILE = path.join(ROOT, 'public', 'static', 'allWeatherData.json')

function toNumber(value, fallback = null) {
    const text = String(value ?? '').replace(/^\uFEFF/, '').trim()
    if (!text) return fallback
    const number = Number(text)
    return Number.isFinite(number) ? number : fallback
}

function round(value, digits = 4) {
    const factor = 10 ** digits
    return Math.round((Number(value) || 0) * factor) / factor
}

function findRightsCsv() {
    const files = fs.readdirSync(NEW_DATA_DIR)
    const file = files.find(name => name.includes('含权策略') && name.toLowerCase().endsWith('.csv'))
    if (!file) throw new Error('含权策略 CSV not found in data/newdata')
    return path.join(NEW_DATA_DIR, file)
}

function parseCsvLine(line) {
    const result = []
    let current = ''
    let quoted = false

    for (const char of line) {
        if (char === '"') {
            quoted = !quoted
        } else if (char === ',' && !quoted) {
            result.push(current)
            current = ''
        } else {
            current += char
        }
    }
    result.push(current)
    return result.map(item => item.trim())
}

function readRightsCsv() {
    const file = findRightsCsv()
    const lines = fs.readFileSync(file, 'utf8')
        .replace(/^\uFEFF/, '')
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
    const headers = parseCsvLine(lines[0])

    return lines.slice(1).map(line => {
        const values = parseCsvLine(line)
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]))
        return {
            date: row['日期'],
            value: toNumber(row['净值']),
            dailyReturn: toNumber(row['日收益'], 0),
            holdingCount: toNumber(row['持仓数'], 0),
            turnover: toNumber(row['换手率'], 0),
            fee: toNumber(row['手续费'], 0)
        }
    }).filter(row => row.date && Number.isFinite(row.value))
}

function buildHs300Series(dateList) {
    const allWeather = JSON.parse(fs.readFileSync(ALL_WEATHER_FILE, 'utf8'))
    const hs300Map = new Map((allWeather.dateList || []).map((date, index) => [date, allWeather.hs300?.[index]]))
    const firstRaw = hs300Map.get(dateList[0])
    const scale = Number.isFinite(firstRaw) && firstRaw !== 0 ? 1000 / firstRaw : 1

    return dateList.map(date => {
        const value = hs300Map.get(date)
        return Number.isFinite(value) ? round(value * scale, 4) : null
    })
}

function main() {
    const rows = readRightsCsv()
    const dateList = rows.map(row => row.date)
    const data = {
        dateList,
        strategyData: rows.map(row => round(row.value, 4)),
        hs300: buildHs300Series(dateList),
        dailyReturn: rows.map(row => round(row.dailyReturn, 8)),
        holdingCount: rows.map(row => row.holdingCount),
        turnover: rows.map(row => round(row.turnover, 6)),
        fee: rows.map(row => round(row.fee, 4)),
        source: 'data/newdata/含权策略.csv',
        hs300Source: 'public/static/allWeatherData.json',
        updatedAt: new Date().toISOString()
    }

    fs.writeFileSync(RIGHTS_STATIC_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    console.log(`Updated rights strategy data: ${dateList[0]} -> ${dateList[dateList.length - 1]} (${dateList.length} rows)`)
}

main()
