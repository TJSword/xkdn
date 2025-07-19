
<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
  <MessageComponent :messages="messages" />
</template>

<script lang="ts" setup>
  import zhCn from 'element-plus/es/locale/lang/zh-cn'
  // import { provide } from 'vue'
  import { useMessage } from './composables/useMessage'
  import MessageComponent from '@/components/Message.vue'

  // 创建消息系统的实例
  const messageSystem = useMessage()

  // 将 showMessage 函数提供给所有子组件
  provide('showMessage', messageSystem.showMessage)

  // 将消息列表传递给 MessageComponent
  const { messages } = messageSystem
  let locale = zhCn
</script>
