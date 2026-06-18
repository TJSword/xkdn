const { spawnSync } = require('child_process')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'bond_strategy_realtime'

const command = [
    {
        TableName: COLLECTION,
        CommandType: 'INSERT',
        Command: JSON.stringify({
            insert: COLLECTION,
            documents: [
                {
                    _id: '__init__',
                    createdAt: new Date().toISOString(),
                    note: 'Temporary init document for bond realtime collection.'
                }
            ]
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
