<template>
  <div class="message-container">
    <transition-group name="message" tag="div">
      <div v-for="message in messages" :key="message.id" :class="['message-item', message.type]">
        <div class="message-content">{{ message.text }}</div>
      </div>
    </transition-group>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  import type { PropType } from 'vue'
  import type { Message } from '../composables/useMessage'

  // 使用 defineComponent 创建一个带有明确 `export default` 的组件
  export default defineComponent({
      name: 'MessageComponent', // 组件名
      props: {
          messages: {
              type: Array as PropType<Readonly<Message[]>>,
              required: true
          }
      },
      setup() {
          // 因为所有逻辑都在父组件和 Composable 中，所以 setup 是空的
          return {}
      }
  })
</script>

<style scoped>
  /* 容器样式修改 */
  .message-container {
      position: fixed;
      top: 30px;
      right: 30px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      /* gap: 15px;  <-- 移除这一行 */
  }

  /* 弹窗项目样式修改 */
  .message-item {
      font-family: 'Noto Sans SC', sans-serif;
      color: #ffffff;
      padding: 16px 24px;
      min-width: 280px;
      max-width: 400px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      border-left-width: 5px;
      border-left-style: solid;
      transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
      margin-bottom: 15px; /* <-- 添加这一行 */
  }

  /* 为了避免最后一个弹窗下面有多余的间距，可以添加以下规则 */
  .message-item:last-child {
      margin-bottom: 0;
  }

  .message-item.info {
      border-left-color: #00aaff;
  }

  .message-item.success {
      border-left-color: #4caf50;
  }

  .message-item.error {
      border-left-color: #f44336;
  }

  .message-content {
      font-size: 1rem;
      font-weight: 500;
  }

  .message-enter-active,
  .message-leave-active {
      transition: all 0.4s ease-in-out;
  }
  .message-enter-from,
  .message-leave-to {
      opacity: 0;
      transform: translateX(50px);
  }
</style>