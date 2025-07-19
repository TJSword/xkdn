import cloudbase from "@cloudbase/js-sdk";

// 为了让 TypeScript 知道我们给 window 添加了新属性，先声明一下
declare global {
  interface Window {
    __tcb_app_instance__: any;
  }
}

// 核心函数：获取或创建唯一的 app 实例
function getTcbApp() {
  // 如果 window 对象上还不存在我们的实例
  if (!window.__tcb_app_instance__) {

    // 则进行初始化，并将其存储到 window 上
    window.__tcb_app_instance__ = cloudbase.init({
      env: 'xkdn-9g0lbgfyc7310777' // 你的环境ID
    });
  }

  // 返回这个唯一的实例
  return window.__tcb_app_instance__;
}

// 调用函数获取唯一的 app 实例
const app = getTcbApp();

// 基于这个唯一的 app 实例来创建 auth 和 db
export const auth = app.auth();

export const db = app.database();

// 导出唯一的 app 实例
export default app;