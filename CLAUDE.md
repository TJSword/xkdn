# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

这是一个基于 Vue 3 + TypeScript 的金融数据可视化应用，使用 Vite 构建。后端采用腾讯云开发（CloudBase）云函数，提供多种投资策略仪表板和实时数据可视化功能。

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（运行在 5173 端口）
npm run dev

# 生产环境构建
npm run build

# 运行 ESLint 代码检查
npm run lint

# 运行 Stylelint 样式检查
npm run lint:style

# 使用 Prettier 格式化代码
npm run format

# 重置开发环境（清除 node_modules 并重新安装）
npm run reset
```

## 技术架构

### 前端技术栈
- **Vue 3** 使用 Composition API 和 `<script setup>` 语法
- **TypeScript** 提供类型安全
- **Vite** 作为构建工具和开发服务器
- **Element Plus** UI 组件库（自动导入，无需手动引入）
- **ECharts** 图表库通过 `vue-echarts` 集成
- **Pinia** 状态管理
- **Vue Router** 使用 hash 模式进行路由管理

### 后端服务
- **腾讯云开发（CloudBase）** - 云函数位于 `functions/` 目录
- 云数据库通过云函数中的 `@cloudbase/node-sdk` 访问
- 身份验证通过 cloudbase auth SDK 实现

### 核心目录结构
- `src/views/` - 页面组件（基于路由的代码分割）
- `src/components/` - 全局组件（自动注册）
- `src/store/` - Pinia 状态管理（user store 处理认证状态）
- `src/router/` - Vue Router 配置，包含认证守卫
- `src/lib/` - CloudBase SDK 初始化
- `src/utils/` - 封装 Axios 的 HTTP 客户端
- `src/plugins/echarts/` - ECharts 组件注册
- `src/composables/` - Vue 组合式函数
- `src/hooks/` - 自定义 Hooks（如 `useConfig.ts`）
- `functions/` - 后端云函数
- `public/static/` - 静态资源和 JSON 数据文件
- `build/` - 构建相关脚本（如代理配置生成）

## 重要开发模式

### 认证与授权
- 认证通过 CloudBase auth SDK 处理（`src/lib/cloudbase.ts`）
- 用户状态在 `src/store/user.ts` Pinia store 中管理
- 路由守卫在 `src/router/index.ts` 中根据以下条件保护页面：
  - 登录状态
  - VIP 会员资格（`isVip` getter）
  - 管理员角色（user 对象上的 `admin` 标志）
- 管理员路由：`/admin`、`/mc`、`/cb`
- 非 VIP 可访问路由：`/home`、`/all-weather`、`/tools`、`/wealth-map`、`/about`

### HTTP 请求
- 使用 `src/utils/http.ts` 进行 API 调用（封装 Axios，包含加载状态和错误处理）
- CloudBase 操作使用 `src/lib/cloudbase.ts` 中的 `app.callFunction()`
- 代理配置从环境变量自动生成，位于 `build/createProxy.ts`

### 环境配置
- 开发环境：`.env.development` - 使用代理进行 API 调用
- 生产环境：`.env.production` - 直接使用 API URL
- 通过 `src/hooks/useConfig.ts` 中的 `getGlobalConfig()` 访问
- 生产环境变量在构建后导出到 `_app.config.js`

### 组件使用规范
- Element Plus 组件自动导入（无需手动引入）
- `src/components/` 中的全局组件自动注册
- ECharts 图表使用 `<v-chart :option="chartOption">` 组件

### 云函数开发
- 位于 `functions/` 目录
- 每个云函数都有独立的 `package.json`
- 通过 `app.callFunction({ name: 'functionName', data: {...} })` 调用
- 数据库操作使用 `@cloudbase/node-sdk`

### 状态管理
- User store（`src/store/user.ts`）处理：
  - 登录/注册/登出
  - 用户信息与数据库同步
  - VIP 状态
  - 用户持仓数据

### 自动导入配置
- Vue API（`ref`、`computed` 等）通过 `unplugin-auto-import` 自动导入
- Element Plus 组件通过 `unplugin-vue-components` 自动导入
- `src/components/` 中的全局组件自动导入

## 代码质量工具
- ESLint 用于 JS/TS 代码检查
- Stylelint 用于 CSS/SCSS 样式检查
- Prettier 用于代码格式化
- VSCode 保存时自动运行这些工具

## 浏览器支持
- Chrome 最新 2 个版本
- Edge 最新 2 个版本
- Firefox 最新 2 个版本
- Safari 最新 2 个版本
- 不支持 IE
