/*
 * @Author: BoLin
 * @Date: 2022-08-10 09:29:09
 * @LastEditors: BoLin
 * @LastEditTime: 2023-04-03 14:13:04
 * @Description: file content
 * @FilePath: \digital-twin-system-framework\src\components\loading\index.ts
 */
import { createApp, reactive } from 'vue'
import loadComponent from './main.vue'
import type { App } from 'vue'

const msgShow = reactive({
    show: false,
    text: '正在加载中...'
})

const $loading = createApp(loadComponent, { msgShow }).mount(document.createElement('div'))
const loading = {
    show(text = '正在加载中...') {
        msgShow.show = true
        msgShow.text = text
        document.body.appendChild($loading.$el)
    },
    hide() {
        msgShow.show = false
    }
}

const install = (app: App) => {
    app.config.globalProperties.$loading = loading
}

export { install, loading }
