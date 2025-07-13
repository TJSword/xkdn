# 标准工程说明文档

## 目录

-   [工程简介](#工程简介)
-   [代码获取](#代码获取)
-   [技术栈](#技术栈)
-   [环境准备](#环境准备)
-   [本地运行](#本地运行)
-   [目录说明](#目录说明)
-   [Echarts](#Echarts)
-   [API请求](#API请求)
-   [环境变量](#环境变量)
    -   [.env.development](#envdevelopment)
    -   [.env.produciton](#envproduciton)
    -   [使用环境变量](#使用环境变量)
-   [发布打包](#发布打包)
-   [vscode配置](#vscode配置)
    -   [ESLint - 脚本代码检查](#ESLint---脚本代码检查)
    -   [Prettier - 代码格式化](#Prettier---代码格式化)
    -   [Stylelint - css 格式化](#Stylelint---css-格式化)
    -   [KoroFileHeader - 文件头部注释和函数注释的插件](#KoroFileHeader---文件头部注释和函数注释的插件)
-   [浏览器支持](#浏览器支持)

## 工程简介

`Digital-Twin-System-Framework`(non-Twinning分支上)是一套用于非孪生项目标准的开发工程模板，使用了最新的 `Vue3`、`Vite`、`Element-Plus`、`TypeScript` 、`Echarts5`等主流技术开发，也集成了`Eslint`、`Prettier`、`Stylelint`进行规范编码，保证代码质量。

## 代码获取

从`GitLab`获取代码

```c#
# clone 代码
git clone http://192.168.101.13/fr2/digital-twin-system-framework.git
```

## 技术栈

-   [Vue](https://cn.vuejs.org/ "Vue")：渐进式的JavsScript框架。
-   [Vue-Router](https://router.vuejs.org/zh/guide/ "Vue-Router")：为 Vue.js 提供富有表现力、可配置的、方便的路由。
-   [TypeScript](https://www.tslang.cn/index.html "TypeScript")：JavaScript 语言的超集。
-   [Element-Plus](https://element-plus.gitee.io/zh-CN/ "Element-Plus")：Element UI 的 Vue3 版本。
-   [Vite](https://vitejs.cn/ "Vite")：前端开发与构建工具，极速的服务启动。
-   [Axios](https://www.kancloud.cn/yunye/axios/234845/ "Axios")：基于 promise 的 HTTP 库，可以用在浏览器和 node.js 中。
-   [Echarts](https://echarts.apache.org/zh/index.html "Echarts")：基于 JavaScript 的开源可视化图表库。

## 环境准备

-   [Node.js](https://nodejs.org/en "Node.js") >15.x
-   [Chrome](https://www.google.cn/chrome/browser/desktop/ "Chrome")或[Edge](https://www.microsoft.com/zh-cn/edge?form=MA13FJ "Edge")
-   [Vscode编辑器](https://code.visualstudio.com/ "Vscode编辑器")

## 本地运行

```javascript
# 安装依赖
npm install

# 运行项目
npm run dev

# eslint检查
npm run lint

# stylelint检查
npm run lint:style

# 代码格式化
npm run format

```

## 目录说明

```c
├─ build  
│  ├─ build.ts # 打包命令
│  ├─ createProxy.ts # 自动化创建代理
│  └─ index.ts # 打包配置
├─ public
├─ src
│  ├─ api # 接口服务
│  ├─ assets # 静态图片、Iconfont
│  ├─ components # 全局公共组件（该文件夹下组件会被自动注册到全局，在使用时无需二次引入。）
│  ├─ hooks # 钩子函数（hooks下文件命名，统一用use开头。）
│  │  └─ useConfig.ts # 获取当前环境变量
│  ├─ env.d.ts # 项目环境ts声明文件
│  ├─ App.vue # 项目视图入口
│  ├─ main.ts # 页面程序入口
│  ├─ plugins # 第三方插件
│  ├─ router # 路由配置
│  ├─ style # 全局Css\主题配置
│  ├─ utils
│  │  └─ http.ts # Axios请求封装
│  └─ views # 页面集合
├─ types
│  ├─ auto-import.d.ts # 自动导入elementPlus组件、Vue3API
│  ├─ components.d.ts # 自动导入全局组件
│  └─ global.d.ts # 全局ts类型声明
├─ .env.development # 开发环境变量
├─ .env.production # 生产环境变量
├─ .eslintignore # eslint忽略配置
├─ .eslintrc-auto-import.json # eslint自动导入配置
├─ .eslintrc.js  # eslint校验规则
├─ .gitignore # git忽略项
├─ .prettierignore # prettier格式化忽略配置
├─ .prettierrc.js # prettier格式化配置
├─ .stylelintignore # stylelint格式化忽略配置
├─ .stylelintrc.js  # stylelint格式化配置
├─ index.html # 渲染索引页
├─ package-lock.json  # 锁定依赖包小版本
├─ package.json # 项目依赖配置及启动脚本配置
├─ README.md # 项目说明文档
├─ tsconfig.json # 全局ts声明解析配置
└─ vite.config.ts # 配置运行服务或打包部署
```

## Echarts

`plugins`下的`echarts/index.ts` 是对`echarts`内部的组件进行按需引入。

组件引入文档[https://github.com/apache/echarts/blob/master/src/echarts.all.ts](https://github.com/apache/echarts/blob/master/src/echarts.all.ts "https://github.com/apache/echarts/blob/master/src/echarts.all.ts")

vue-echarts文档[https://www.npmjs.com/package/vue-echarts](https://www.npmjs.com/package/vue-echarts "https://www.npmjs.com/package/vue-echarts")

```javascript
// 如有特殊的echarts图表需要开发，请在这边进行引入。
import {
  LineChart,
  BarChart,
  PieChart,
  ScatterChart,
  RadarChart,
  LinesChart,
  MapChart,
  GaugeChart,
  CustomChart,
  PictorialBarChart,
  SankeyChart,
  EffectScatterChart
} from 'echarts/charts'

...to do something ...
```

```javascript
// 使用方式
<template>
  <div class="radar-chart">
    <v-chart :option="option" :autoresize="true"></v-chart>
  </div>
</template>
<script setup>
  const option = {}
</script>
```

## API请求

`utils` 下的`http.ts` 对axios进行了二次封装，其中包含了错误捕获，防止重复请求，全局loading等配置，提供了常用get、post、put、delete四种请求方式，也支持使用者自定义配置请求。

```javascript
// http.ts
export const request = {
  get: (requestConfig: AxiosRequestConfig, customOptions?: Option) => {
    return new Promise(resolve => {
      const config = {
        method: 'get',
        baseURL: VITE_API_BASE_URL,
        paramsSerializer: function (params: CustomParamsSerializer) {
          return Qs.stringify(params)
        },
        ...requestConfig
      }
      createAxios(config, { ...customOptions }).then(res => resolve(res))
    })
  },
  post: (requestConfig: AxiosRequestConfig, customOptions?: Option) => {
       ... to do something...
  },
  put: (requestConfig: AxiosRequestConfig, customOptions?: Option) => {
       ... to do something...
  },
  delete: (requestConfig: AxiosRequestConfig, customOptions?: Option) => {
       ... to do something...
  }
}

--------------------------------------- 使用方式 ----------------------------------------
// 对应模块的API接口统一存放到 api目录下
// 示例: 第一步创建 api/demo1.ts 导入 request 方法和 baseURL 地址
import { request } from '@/utils/http'
import { getGlobalConfig } from '@/hooks/useConfig'

// 按需解构baseURL地址
const { VITE_API_BASE_URL } = getGlobalConfig()

// 导出对应模块的请求接口
export function getMonthRank(params = {}) {
  return request.get({
    url: '/rank',
    params: params,
    baseURL: VITE_API_BASE_URL
  })
}

// 示例: 第二步在对应组件中使用
<script setup lang="ts">
 import { getMonthRank } from '@/api/demo1.ts'
 getMonthRank().then(res => { ... to do something... })
</script>
```

## 环境变量

### .env.development

```lisp
# 本地环境
NODE_ENV = "development"

# 开发环境下 配置了代理
VITE_API_BASE_URL_1 = "/api"

# 开发环境下 代理的ttp请求URL
VITE_API_PROXY_URL_1 = "http://192.168.1.1:8000"

# 如需添加多个代理地址，必须以'VITE_API_BASE_URL_'为开头
VITE_API_BASE_URL_2 = "/dig"

# 代理的地址必须以'VITE_API_PROXY_URL_'为开头，末位序号必须与代理地址的末位序号相同
VITE_API_PROXY_URL_2 = "http://192.168.1.1:8001"

# 本地环境部署路径
VITE_PUBLIC_PATH = /


```

### .env.produciton

```lisp
 # 生产环境
NODE_ENV = "production"

# BaseUrl
VITE_API_BASE_URL_1 = "http://192.168.1.2:8000"

VITE_API_BASE_URL_2 = "http://192.168.1.2:8001"

# 本地环境部署路径
VITE_PUBLIC_PATH = /

# 是否删除生产环境 console
VITE_DROP_CONSOLE = true

# 构建时需要导出到_app.config.js属性[注意: 属性名用双引号括起来]
VITE_ATTRS_EXPORT = ["VITE_API_BASE_URL_1","VITE_API_BASE_URL_2"]

```

### 使用环境变量

`hooks`下的`useConfig.ts`可按需导出对应的环境变量，需注意在`production`模式下，如果需要从`window.__PRODUCTION__SERVICE__CONFIG`下解构多个属性，需要配置`.env.production` 中的`VITE_ATTRS_EXPORT` 。

```javascript
// useConfig.ts
export function getGlobalConfig() {
  const ENV = (
    import.meta.env.DEV ? (import.meta.env as any) : window.__PRODUCTION__SERVICE__CONFIG
  ) as any

  const { VITE_API_BASE_URL } = ENV
  return {
    VITE_API_BASE_URL
  }
}

```

## 发布打包

```javascript
# 项目打包
npm run build 
```

完成打包后，会在`dist`目录下生成一个名为`_app.config.js`的文件。该文件用于配置生产环境的相关变量，并会被引入到`index.html`中。通过这种方式，能解决一套前端代码部署到多个不同平台的需求。

## vscode配置

如果您使用的 IDE 是[vscode](https://code.visualstudio.com/ "vscode")(推荐)的话，可以安装以下工具来提高开发效率及代码格式化。

#### [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint "ESLint") - 脚本代码检查

```javascript
{
    "editor.codeActionsOnSave": {
        "source.fixAll": false,
        // 开启eslint自动修复
        "source.fixAll.eslint": true
    }
}
```

#### [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode "Prettier") - 代码格式化

```javascript
{
    // 保存的时候自动格式化
    "editor.formatOnSave": true,
    // 默认格式化工具选择prettier
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    // 粘贴时自动格式化
    "editor.formatOnPaste": false
}
```

#### [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint "Stylelint") - css 格式化

```javascript
{
  // 自动检验修复css
  "editor.codeActionsOnSave": {
    "source.fixAll": false,
    // 开启stylelint修复
    "source.fixAll.stylelint": true
  },
    "stylelint.validate": ["css", "scss", "vue", "html"]
}
```

#### [KoroFileHeader](https://marketplace.visualstudio.com/items?itemName=OBKoro1.korofileheader "KoroFileHeader") - 文件头部注释和函数注释的插件

```javascript
  "fileheader.customMade": {
    "Author": "BoLin", // 改成自己的名字
    "Date": "Do not edit",
    "LastEditors": "git config user.name",
    "LastEditTime": "Do not edit",
    "Description": "file content",
    "FilePath": "Do not edit"
  },
  "fileheader.cursorMode": {
    "description": "",
    "param": "params",
    "return": ""
  },
  "fileheader.configObj": {
    "autoAdd": true,
    "autoAlready": true,
    "dateFormat": "YYYY-MM-DD",
    "prohibitAutoAdd": ["json", "md"],
    "wideSame": false,
    "wideNum": 13
  },
  //
```

## 浏览器支持

**本地开发**推荐使用`Chrome 最新版`浏览器，**不支持**`Chrome 80`以下版本。

**生产环境**支持现代浏览器，不支持 IE。

| ie          | Edge            | Firefox         | Chrome          | Safari          |
| ----------- | --------------- | --------------- | --------------- | --------------- |
| not support | last 2 versions | last 2 versions | last 2 versions | last 2 versions |
