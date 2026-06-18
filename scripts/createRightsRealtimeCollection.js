'use strict'

const { spawnSync } = require('child_process')
const path = require('path')

const ENV_ID = process.env.TCB_ENV_ID || 'xkdn-9g0lbgfyc7310777'
const COLLECTION = 'rights_strategy_realtime'
const ROOT = path.resolve(__dirname, '..')

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

function main() {
    try {
        runCommand('INSERT', {
            insert: COLLECTION,
            documents: [{ _id: '__init__', createdAt: new Date().toISOString() }]
        })
    } catch (error) {
        console.warn(`Collection bootstrap skipped: ${error.message}`)
    }

    try {
        runCommand('DELETE', {
            delete: COLLECTION,
            deletes: [{ q: { _id: '__init__' }, limit: 1 }]
        })
    } catch (error) {
        console.warn(`Collection marker cleanup skipped: ${error.message}`)
    }
}

main()
