<template>
  <main class="permission-unavailable">
    <section class="permission-card" aria-labelledby="permission-title">
      <p class="eyebrow">权限同步</p>
      <h1 id="permission-title">权限暂时无法确认</h1>
      <p>当前网络或服务连接异常，暂时不能确认你是否可以访问目标页面。</p>
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
      <button type="button" :disabled="isRetrying" @click="retry">
        {{ isRetrying ? '正在重试…' : '重试' }}
      </button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isRetrying = ref(false)
const errorMessage = ref('')

async function retry() {
  isRetrying.value = true
  errorMessage.value = ''

  try {
    await userStore.refreshUserInfo()
    const redirect = String(route.query.redirect || '/home')
    await router.replace(
      redirect.startsWith('/') && redirect !== '/permission-unavailable' ? redirect : '/home'
    )
  } catch (error: any) {
    errorMessage.value = error?.message || '仍无法同步权限，请检查网络后重试。'
  } finally {
    isRetrying.value = false
  }
}
</script>

<style scoped>
.permission-unavailable {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #121212;
  color: #f8fafc;
}

.permission-card {
  width: min(100%, 440px);
  padding: 32px;
  border: 1px solid rgb(148 163 184 / 30%);
  border-radius: 16px;
  background: rgb(30 41 59 / 80%);
}

.eyebrow {
  margin: 0 0 8px;
  color: #7dd3fc;
  font-size: 14px;
}

h1 {
  margin: 0 0 16px;
  font-size: 24px;
}

p {
  line-height: 1.7;
}

.error-message {
  color: #fda4af;
}

button {
  min-width: 96px;
  min-height: 40px;
  border: 1px solid #38bdf8;
  border-radius: 6px;
  background: transparent;
  color: #e0f2fe;
  cursor: pointer;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}
</style>
