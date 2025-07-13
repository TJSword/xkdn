<!--
 * @Author: BoLin
 * @Date: 2023-04-12 17:30:21
 * @LastEditors: BoLin
 * @LastEditTime: 2023-04-25 17:39:23
 * @Description: file content
 * @FilePath: \digital-twin-system-framework\src\App.vue
-->
<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script lang="ts" setup>
  import zhCn from 'element-plus/es/locale/lang/zh-cn'
  let locale = zhCn

  //初始化SDK实例
  import cloudbase from '@cloudbase/js-sdk'
  const app = cloudbase.init({
      env: 'xkdn-9g0lbgfyc7310777'
  })
  const auth = app.auth()
  // await auth.signInAnonymously()
  app.callFunction({
      // 云函数名称
      name: 'login',
      // 传给云函数的参数
      data: {
          a: 1
      }
  })
      .then((res: any) => {
          console.log(res)
      })
      .catch(console.error)
</script>
