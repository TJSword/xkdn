/*
 * @LastEditors: BoLin
 * @Date: 2023-03-16 11:25:46
 * @LastEditTime: 2023-07-06 13:58:14
 * @FilePath: \digital-twin-system-framework\vite.config.ts
 * @Description:
 */
import path from 'path'
import { ConfigEnv, UserConfig, defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import eslintPlugin from 'vite-plugin-eslint'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'
import { createScriptTag } from './build'
import createProxy from './build/createProxy'
export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  const ENV = loadEnv(mode, process.cwd())
  const proxy = createProxy(ENV)

  return {
    base: ENV.VITE_PUBLIC_PATH,
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './'),
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
      open: false,
      proxy
    },
    plugins: [
      vue(),

      // vite可以使用jsx/tsx语法
      vueJsx(),

      // 自动导入ElementPlus组件、Vue相关API
      AutoImport({
        imports: ['vue', 'vue-router'],
        resolvers: [ElementPlusResolver()],
        dts: 'types/auto-import.d.ts',
        eslintrc: {
          // 为true的时候, 只需要一次就行, 主要是为了解决自动导入Vue相关api后,eslint报错的问题
          enabled: false
        }
      }),

      // 自动导入全局组件
      Components({
        dirs: ['src/components'],
        extensions: ['vue'],
        // 按需引入,主题色的配置, 需要加上 importStyle: 'sass'
        resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
        dts: 'types/components.d.ts'
      }),

      // 为 Element Plus 组件按需引入样式
      ElementPlus({}),

      // EsLint报错信息显示在浏览器界面上
      eslintPlugin(),

      // 创建script标签引入app.config.js环境变量
      // createScriptTag(command, ENV.VITE_PUBLIC_PATH)
    ],
    build: {
      // 取消计算文件大小,加快打包速度
      reportCompressedSize: false,

      // 静态资源文件分类打包
      rollupOptions: {
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      }
    },
    esbuild: {
      drop: ENV.VITE_DROP_CONSOLE === 'true' ? ['console', 'debugger'] : []
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/style/adapter.scss" as *;`
        }
      }
    }
  }
})
