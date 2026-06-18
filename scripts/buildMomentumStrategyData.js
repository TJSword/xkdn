'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const MOMENTUM_FILE = path.join(ROOT, 'public', 'static', 'momentumData.json')
const ALL_WEATHER_FILE = path.join(ROOT, 'public', 'static', 'allWeatherData.json')
const NEWDATA_DIR = path.join(ROOT, 'data', 'newdata')
const PYTHON =
    process.env.CODEX_PYTHON ||
    'C:\\Users\\TJSwo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe'

function round(value, digits = 2) {
    const factor = 10 ** digits
    return Math.round((Number(value) || 0) * factor) / factor
}

function readGrowth100Series() {
    const code = `
import json
from pathlib import Path
import pandas as pd

folder = Path(r'''${NEWDATA_DIR.replace(/\\/g, '\\\\')}''')
files = [p for p in folder.glob('*100.xlsx') if '纳斯达克' not in p.name]
if not files:
    raise SystemExit('成长100.xlsx not found')

df = pd.read_excel(files[0])
df = df[df.iloc[:, 2].notna() & df.iloc[:, 6].notna()].copy()
df['date'] = pd.to_datetime(df.iloc[:, 2]).dt.strftime('%Y-%m-%d')
df['close'] = pd.to_numeric(df.iloc[:, 6], errors='coerce')
df = df[df['close'].notna()]
rows = df[['date', 'close']].to_dict(orient='records')
print(json.dumps(rows, ensure_ascii=False))
`
    const result = spawnSync(PYTHON, ['-c', code], {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10
    })

    if (result.status !== 0) {
        throw new Error(result.stderr || result.stdout || 'Failed to read 成长100.xlsx')
    }

    return JSON.parse(result.stdout)
}

function main() {
    const momentum = JSON.parse(fs.readFileSync(MOMENTUM_FILE, 'utf8'))
    const allWeather = JSON.parse(fs.readFileSync(ALL_WEATHER_FILE, 'utf8'))
    const growthRows = readGrowth100Series()
    const growthByDate = new Map(growthRows.map(item => [item.date, Number(item.close)]))
    const allWeatherHs300 = new Map(allWeather.dateList.map((date, index) => [date, Number(allWeather.hs300[index])]))

    const lastDate = momentum.dateList[momentum.dateList.length - 1]
    if (!lastDate || !growthByDate.has(lastDate)) {
        throw new Error(`Cannot find growth100 close for current momentum tail ${lastDate}`)
    }

    const appendDates = growthRows
        .map(item => item.date)
        .filter(date => date > lastDate && growthByDate.has(date))

    let previousDate = lastDate
    let previousStrategy = Number(momentum.strategyData[momentum.strategyData.length - 1])
    let previousHs300 = Number(momentum.hs300[momentum.hs300.length - 1])
    const baseMomentumHs300 = previousHs300
    const baseAllWeatherHs300 = allWeatherHs300.get(lastDate)

    appendDates.forEach(date => {
        const previousClose = growthByDate.get(previousDate)
        const currentClose = growthByDate.get(date)
        if (!previousClose || !currentClose) return

        previousStrategy = round(previousStrategy * (currentClose / previousClose), 2)

        const currentAllWeatherHs300 = allWeatherHs300.get(date)
        if (baseAllWeatherHs300 && currentAllWeatherHs300) {
            previousHs300 = round(baseMomentumHs300 * (currentAllWeatherHs300 / baseAllWeatherHs300), 2)
        }

        momentum.dateList.push(date)
        momentum.strategyData.push(previousStrategy)
        momentum.hs300.push(previousHs300)
        previousDate = date
    })

    fs.writeFileSync(MOMENTUM_FILE, `${JSON.stringify(momentum, null, 2)}\n`, 'utf8')

    console.log(JSON.stringify({
        appended: appendDates.length,
        from: appendDates[0] || null,
        to: appendDates[appendDates.length - 1] || lastDate,
        latestStrategy: momentum.strategyData[momentum.strategyData.length - 1],
        latestHs300: momentum.hs300[momentum.hs300.length - 1]
    }, null, 2))
}

main()
