const { spawnSync } = require('child_process')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'all_weather_strategy_base'

const command = [
    {
        TableName: COLLECTION,
        CommandType: 'QUERY',
        Command: JSON.stringify({
            find: COLLECTION,
            filter: { _id: 'latest' },
            projection: {
                latestDate: 1,
                latestStrategyIndexValue: 1,
                dateList: { $slice: -3 },
                strategyData: { $slice: -3 },
                hs300: { $slice: -10 },
                recentAssetWeights: 1,
                hs300Source: 1
            }
        })
    }
]

const payload = JSON.stringify(command)
const escapedPayload = payload.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "''")

const result = spawnSync(
    'powershell.exe',
    [
        '-NoProfile',
        '-Command',
        `$cmd='${escapedPayload}'; npx --yes --package @cloudbase/cli@latest tcb db nosql execute -e ${ENV_ID} --json --command $cmd`
    ],
    {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'inherit',
        shell: false
    }
)

process.exit(result.status || 0)
