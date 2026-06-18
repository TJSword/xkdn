'use strict'

const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'all_weather_strategy_base'
const DOC_ID = 'latest'
const RECENT_WEIGHT_LIMIT = 5
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

function chunkArray(array, size) {
    const chunks = []
    for (let index = 0; index < array.length; index += size) {
        chunks.push(array.slice(index, index + size))
    }
    return chunks
}

function buildBaseDoc(data) {
    const lastIndex = data.dateList.length - 1
    const meta = data.assetWeightMeta || {}
    const recentAssetWeights = Array.isArray(data.assetWeights)
        ? data.assetWeights.slice(-RECENT_WEIGHT_LIMIT)
        : []
    const latestWeight = recentAssetWeights[recentAssetWeights.length - 1] || null
    const latestStrategyIndexValue = data.strategyData[lastIndex]
    const assetWeightMeta = {
        assetOrder: meta.assetOrder || [],
        assetNames: meta.assetNames || {},
        targetWeights: meta.targetWeights || {},
        rebalanceDeviationThreshold: meta.rebalanceDeviationThreshold,
        transactionFeeRate: meta.transactionFeeRate,
        calculationStartDate: meta.calculationStartDate,
        calculationEndDate: meta.calculationEndDate
    }

    return {
        _id: DOC_ID,
        dateList: [],
        strategyData: [],
        hs300: [],
        assetWeights: [],
        recentAssetWeights,
        assetWeightMeta,
        latestDate: data.dateList[lastIndex],
        latestStrategyIndexValue,
        latestStrategyAmount: Number((Number(latestStrategyIndexValue) * 100).toFixed(2)),
        latestWeights: latestWeight?.weights || {},
        targetWeights: assetWeightMeta.targetWeights,
        assetOrder: assetWeightMeta.assetOrder,
        assetNames: assetWeightMeta.assetNames,
        seededAt: new Date().toISOString(),
        source: 'public/static/allWeatherData.json'
    }
}

function setBaseDoc(baseDoc) {
    runCommand({
        update: COLLECTION,
        updates: [
            {
                q: { _id: DOC_ID },
                u: { $set: baseDoc },
                upsert: true
            }
        ]
    })
}

function pushSeries(data) {
    const chunks = chunkArray(data.dateList, SERIES_CHUNK_SIZE)
    for (let index = 0; index < chunks.length; index += 1) {
        const start = index * SERIES_CHUNK_SIZE
        const end = start + chunks[index].length
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
                        }
                    }
                }
            ]
        })
        console.log(`Seeded series ${end}/${data.dateList.length}`)
    }
}

function main() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    const metadataOnly = process.argv.includes('--metadata-only')

    setBaseDoc(buildBaseDoc(data))
    if (!metadataOnly) {
        pushSeries(data)
    }

    console.log(`Seeded minimal ${COLLECTION}/${DOC_ID} in ${ENV_ID}`)
}

main()
