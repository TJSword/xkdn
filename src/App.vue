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
</script>
