# NAV 惊鸿策略与小狮子策略请求文档

核对日期：2026-10-16。依据当前代码整理；23:09:29（北京时间）已部署 getAccountObservation 请求前更新 v 的逻辑，12 项本地测试通过，云端状态 Active。23:10:05 NAV 页面真实云端请求返回 success: true，两个策略图表及持仓均正常展示。本机两个策略均取得 241 个走势点。长期稳定性及具体失效窗口尚未验证，详见 nav-v-investigation.md。响应示例均为结构示例，不代表实际收益或持仓。

## 1. 路由与调用关系

| 项目 | 当前实现 |
| --- | --- |
| 页面地址 | `http://localhost:5173/#/nav` |
| Vue Router 路径 | `/nav`，使用 hash 路由 |
| 页面组件 | `src/views/account-observation.vue` |
| 页面权限 | 登录且具备 `app:read` 能力 |
| 前端调用 | `callCloudFunction({ name: 'getAccountObservation' })` |
| 云函数入口 | `functions/getAccountObservation/index.js` → `exports.main` |
| 上游接口 | 同花顺 `stock_card`，POST 表单请求 |

两个策略是同一页面的两个选项卡，没有分别注册页面路由。前端一次调用获取两个策略，切换选项卡只切换本地数据。进入页面和点击刷新时发起调用，目前页面没有定时轮询。

调用链：`/#/nav` → `loadObservation()` → `callCloudFunction()` → CloudBase `app.callFunction()` → `getAccountObservation` → 并行请求两个同花顺子账户。

## 2. 前端使用的云函数接口

### 请求

环境 ID：`xkdn-9g0lbgfyc7310777`。

```ts
import { callCloudFunction } from '@/services/cloudFunction'

const response = await callCloudFunction({
  name: 'getAccountObservation'
})

const result = response.result
if (!result?.success) {
  throw new Error(result?.message || '账户走势加载失败')
}
console.log(result.data.accounts)
```

无业务请求参数。客户端不传 `fund_key`、Cookie 或 userId；云函数从服务端配置读取两个账户并全部返回。云函数内部校验 CloudBase 登录态，当前没有额外校验 `app:read`、VIP 或管理员权限；`app:read` 是页面路由守卫的检查。

这是 CloudBase SDK 调用。当前相关配置中没有声明该函数独立的 HTTP 访问路径，不能把 `/#/nav` 或 `/getAccountObservation` 当作已经确认的 HTTP API 地址。需要普通 HTTP 客户端调用时，应先核实云端 HTTP 访问服务配置；本文件不推测网关地址或鉴权参数。

### 成功响应

以下 JSON 是 `response.result`，外层由 SDK 包装：

```json
{
  "success": true,
  "data": {
    "updatedAt": 1792114200000,
    "accounts": [
      {
        "id": "account-1",
        "label": "惊鸿策略",
        "todayReturn": 0.92,
        "cumulativeReturn": 10,
        "series": [{ "time": 1792114200000, "value": 0.92 }],
        "holdings": [{
          "stockCode": "000001",
          "stockName": "示例证券",
          "quantity": 100,
          "costPrice": 10,
          "currentPrice": 11,
          "marketValue": 1100,
          "holdingReturn": 10
        }]
      },
      {
        "id": "account-2",
        "label": "小狮子策略",
        "todayReturn": 0.5,
        "cumulativeReturn": 8,
        "series": [{ "time": 1792114200000, "value": 0.5 }],
        "holdings": []
      }
    ]
  }
}
```

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `data.updatedAt` | number | 两个账户所有有效走势点的最大时间戳，毫秒；不是请求完成时间 |
| `accounts[].id` | string | 根据服务端配置顺序生成 `account-1`、`account-2` |
| `accounts[].label` | string | 服务端配置的策略名称 |
| `accounts[].todayReturn` | number | 当日收益百分数，`0.92` 表示 `0.92%` |
| `accounts[].cumulativeReturn` | number | 上游 `rate × 100`，百分数 |
| `accounts[].series` | array | 时间升序的当日收益走势，不是历史净值序列 |
| `series[].time` | number | 上游时间戳转为数字，按毫秒使用 |
| `series[].value` | number | 对应时点的收益百分数 |
| `holdings[].stockCode` / `stockName` | string | 证券代码、名称 |
| `holdings[].quantity` | number 或 null | 上游持仓数量，不额外换算单位 |
| `holdings[].costPrice` / `currentPrice` | number 或 null | 成本价、现价 |
| `holdings[].marketValue` | number 或 null | 持仓市值，页面按人民币金额展示 |
| `holdings[].holdingReturn` | number 或 null | `(现价 / 成本价 - 1) × 100`，有效且成本大于零时计算 |

### 失败响应

```json
{
  "success": false,
  "code": "SOURCE_ERROR",
  "message": "同花顺登录状态已失效，请更新 Cookie",
  "data": null
}
```

| code | 含义 |
| --- | --- |
| `401`（数字） | 云函数未取得登录用户 uid |
| `SOURCE_NOT_CONFIGURED` | 配置读取失败，或 Cookie / userId 为空，或账户数量不是两个 |
| `SOURCE_VALIDATION_COOKIE_INVALID` | 已保存的 v 缺失、格式或版本不支持、校验不符；重新保存完整 Cookie |
| `SOURCE_ERROR` | 一般上游错误、非 JSON、无有效走势、字段无效等；存在底层 `error.code` 时会原样返回该值 |

SDK 或网络错误也可能直接使调用抛异常，不能只处理 `result.success`。两个上游请求使用 `Promise.all`，任一个失败则本次整体失败，不返回部分成功结果。前端刷新失败时保留上次成功数据。

## 3. 两个策略分别对应的同花顺请求

两个请求使用相同 URL、方法和请求头，只有 `fund_key` 不同。以下 userId 和 fund_key 来自本地管理配置函数的固定映射；读取函数实际使用数据库中已保存的配置，未读取线上数据库核实是否一致。

**URL：** `https://tzzb.10jqka.com.cn/caishen_httpserver/tzzb/caishen_fund/pc/account/v1/stock_card`

**方法：** `POST`；**编码：** `application/x-www-form-urlencoded;charset=UTF-8`；**单次上游超时：** 15000 ms。

### 请求头（两个策略共用）

```http
Accept: application/json, text/plain, */*
Content-Type: application/x-www-form-urlencoded;charset=UTF-8
Cookie: <服务端保存的有效同花顺 Cookie>
Origin: https://tzzb.10jqka.com.cn
Referer: https://tzzb.10jqka.com.cn/pc/index.html
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36
```

### 表单参数

| 参数 | 惊鸿策略 | 小狮子策略 | 说明 |
| --- | --- | --- | --- |
| `terminal` | `1` | `1` | 当前代码固定值 |
| `version` | `0.0.0` | `0.0.0` | 当前代码固定值 |
| `userid` | `669081153` | `669081153` | 同花顺用户标识 |
| `user_id` | `669081153` | `669081153` | 与 userid 相同，代码同时提交 |
| `fund_key` | `154745659` | `164339135` | 策略子账户标识 |

惊鸿策略请求体：

```text
terminal=1&version=0.0.0&userid=669081153&user_id=669081153&fund_key=154745659
```

小狮子策略请求体：

```text
terminal=1&version=0.0.0&userid=669081153&user_id=669081153&fund_key=164339135
```

### 上游响应中当前代码读取的字段

这部分是从消费代码反推的字段约定，并非同花顺官方完整接口协议。字段可能是数字或数字字符串。

| 上游字段 | 当前用途 |
| --- | --- |
| `error_code` | 转字符串后等于 `"0"` 才视为业务成功，并要求存在 `ex_data` |
| `error_msg` | 业务失败时作为错误信息 |
| `ex_data.rate` | 累计收益比例，例如 `0.1` 转为 `10%` |
| `ex_data.now_rate` | 当日收益百分数；数字转换非有限值时回退到最后一个有效走势点 |
| `ex_data.data[].time` | 走势点时间戳 |
| `ex_data.data[].zf` | 走势点收益百分数 |
| `ex_data.position[].code` / `name` | 证券代码、名称 |
| `ex_data.position[].count` / `cost` / `price` / `value` | 数量、成本价、现价、市值 |

数据处理细节：

- 每次查询上游前，从已保存 v 解码状态，更新两个时间字段、实际发送 UA 的哈希和更新计数，再编码为本次请求的 v；其他 Cookie 保持不变，生成值不写回数据库，无额外定时任务。登录凭证自身到期仍需重新授权。
- 上游 HTTP 非成功响应时，服务端记录账户展示 ID、HTTP 状态、Content-Type、`x-request-id`（或 `x-trace-id`）及最多 1200 字符的脱敏正文。过滤配置中的 Cookie / Cookie 值、用户和子账户标识，以及敏感字段和长令牌；原始响应头和请求凭证不写日志，正文不返回页面。此诊断只在 `getAccountObservation` 中添加；管理函数的校验请求仍使用原有请求头。
- 过滤 time 或 zf 转换后非有限数字的走势点，再按时间升序排列；没有有效走势时报错。
- `account-1` 的最后有效走势点若在上海时间 15:00 或之后，最后一个点和当日收益各减 `0.01` 个百分点；不调整累计收益。`account-2` 不做此调整。判断依据是数据点时间，不是请求时钟。
- 只有证券代码和名称均非空的持仓才返回；按市值降序。持仓缺失时返回空数组。
- 持仓数字字段先执行 JavaScript `Number()`：转换后非有限值为 null，但 null、空字符串会转换成 0。`now_rate` 和 `rate` 也受数字转换规则影响。

## 4. 关联的管理接口

`tonghuashunAccountConfig` 用于维护上述数据源配置，不是两个策略各自的数据查询接口。要求已登录且数据库用户 `admin === true`。

该管理函数的 check 仍按旧逻辑直接使用已保存 Cookie，没有采用 NAV 查询函数的请求前 v 更新；旧 v 失效时可能校验失败，而 NAV 请求仍可成功。

| SDK 请求 | 用途 |
| --- | --- |
| `{ name: 'tonghuashunAccountConfig', data: { action: 'get' } }` | 读取配置状态、脱敏 Cookie 提示及更新时间 |
| `{ name: 'tonghuashunAccountConfig', data: { action: 'check' } }` | 请求两个子账户验证 Cookie，并更新校验状态 |
| `{ name: 'tonghuashunAccountConfig', data: { action: 'update', cookie: '<完整 Cookie>' } }` | 保存 Cookie，以及代码中的固定 userId / 两个账户映射 |

配置位置：云数据库 `system_configs/tonghuashun_account`；查询函数读取 `cookie`、`userId`、`accounts`。真实 Cookie 不应写入本文档或前端代码。

## 5. 代码核对位置

- `src/router/index.ts`：`/nav` 页面及权限配置。
- `src/views/account-observation.vue`：`loadObservation`、选项卡及页面刷新行为。
- `src/services/cloudFunction.ts`：SDK 调用与登录失效处理。
- `src/lib/cloudbase.ts`：CloudBase 环境初始化。
- `functions/getAccountObservation/index.js`：上游请求、数据转换和统一返回。
- `functions/getAccountObservation/tonghuashun-cookie.js`：本次请求的 v 状态更新与编码。
- `functions/tonghuashunAccountConfig/index.js`：固定账户映射及 Cookie 管理。
- `cloudbaserc.json`：两个云函数的本地部署配置，超时均为 30 秒。
