// src/lib/cloudbase.ts (或者你的文件名)
import cloudbase from "@cloudbase/js-sdk";

// 1. 直接初始化
// ES 模块机制保证了这行代码在整个应用生命周期中只会被执行一次
const app = cloudbase.init({
  env: 'xkdn-9g0lbgfyc7310777' // 你的环境ID
});

// 2. 在这里只调用一次 auth() 和 database()
const auth = app.auth();
const db = app.database();

// 3. 导出这些已经生成的实例
// 其他文件直接 import { auth } from '@/lib/cloudbase' 即可复用
export { auth, db };

// 4. 导出 app 实例以备不时之需
export default app;