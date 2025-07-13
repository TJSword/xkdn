/*
 * @LastEditors: BoLin
 * @Date: 2023-04-06 17:30:36
 * @LastEditTime: 2023-04-12 17:25:35
 * @FilePath: \digital-twin-system-framework\build\index.ts
 * @Description: 打包配置
 */
import dotenv from 'dotenv'
import fs, { readFile, writeFileSync } from 'fs-extra'
import path from 'path'
import { createHtmlPlugin } from 'vite-plugin-html'
const GLOBAL_CONFIG_FILE_NAME = '_app.config.js'

// 获取开发环境配置
async function getProducitonConfig() {
    const parentDir = path.dirname(__dirname)
    const envPath = await readFile(path.join(parentDir, '.env.production'), { encoding: 'utf8' })
    const env = dotenv.parse(envPath)

    // 过滤环境变量导出项
    if (Reflect.has(env, 'VITE_ATTRS_EXPORT') && typeof env['VITE_ATTRS_EXPORT'] === 'string') {
        const derivedTerm = JSON.parse(env['VITE_ATTRS_EXPORT'])
        for (const key in env) {
            if (!derivedTerm.includes(key)) {
                Reflect.deleteProperty(env, key)
            }
        }
    }
    return env
}

// 写入_app.config.js
export async function createConfigSource(filePath: string) {
    const config = await getProducitonConfig()
    const variableName = `__PRODUCTION__SERVICE__CONFIG`
    const windowVariable = `window.${variableName}`
    let source = `${windowVariable}=${JSON.stringify(config)};`
    source += `
    Object.freeze(${windowVariable});
    Object.defineProperty(window, "${variableName}", {
      configurable: false,
      writable: false,
    });
  `.replace(/\s/g, '')
    fs.mkdirp(getRootPath(filePath))
    writeFileSync(getRootPath(`${filePath}/${GLOBAL_CONFIG_FILE_NAME}`), source)
}

function getRootPath(...dir: string[]) {
    return path.resolve(process.cwd(), ...dir)
}

export function createScriptTag(command: string, basePath: string) {
    const isBuild = command === 'build'
    return createHtmlPlugin({
        minify: true,
        inject: {
            data: {
                title: 'index'
            },
            tags: isBuild
                ? [
                      {
                          tag: 'script',
                          attrs: {
                              src: `${basePath}${GLOBAL_CONFIG_FILE_NAME}`
                          }
                      }
                  ]
                : []
        }
    })
}
