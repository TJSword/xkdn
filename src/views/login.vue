<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <h1 class="login-title">欢迎回来</h1>
      <p class="login-subtitle">使用手机号登录您的账户</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <input type="tel" id="phone" class="input-field" v-model="loginInfo.phoneNumber" placeholder=" " required>
          <label for="phone" class="input-label">手机号</label>
        </div>

        <div class="form-group-inline">
          <div class="form-group">
            <input type="text" id="code" class="input-field" v-model="loginInfo.verificationCode" placeholder=" " required>
            <label for="code" class="input-label">验证码</label>
          </div>
          <button type="button" @click="handleGetCode" :disabled="isCoolingDown" class="get-code-btn">
            {{ getCodeButtonText }}
          </button>
        </div>

        <button type="submit" class="submit-btn">登 录</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref, computed, onMounted, onUnmounted, inject } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import app, { auth } from '@/lib/cloudbase'
  import { useUserStore } from '@/store/user'

  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  // 注入我们在 App.vue 中提供的 showMessage 函数
  const showMessage: any = inject('showMessage')

  let verification: any = null
  interface LoginInfo {
      phoneNumber: string
      verificationCode: string
  }

  const loginInfo = reactive<LoginInfo>({
      phoneNumber: '',
      verificationCode: ''
  })

  const cooldownSeconds = ref(0)
  let timer: any = null

  const isCoolingDown = computed(() => cooldownSeconds.value > 0)

  const getCodeButtonText = computed(() => {
      return isCoolingDown.value ? `${cooldownSeconds.value}秒后重试` : '获取验证码'
  })

  // --- 新增：封装一个启动倒计时的函数 ---
  const startCooldownTimer = () => {
      // 先清除已有的计时器，防止重复执行
      if (timer) {
          clearInterval(timer)
      }
      timer = setInterval(() => {
          cooldownSeconds.value--
          if (cooldownSeconds.value <= 0) {
              clearInterval(timer)
              // 倒计时结束，清理localStorage
              localStorage.removeItem('verificationCodeCooldownEnd')
          }
      }, 1000)
  }

  const handleGetCode = async () => {
      if (isCoolingDown.value) return

      if (!/^1[3-9]\d{9}$/.test(loginInfo.phoneNumber)) {
          showMessage('请输入有效的手机号！', 'error')
          return
      }

      showMessage('正在发送验证码...', 'info')

      try {
          verification = await auth.getVerification({
              phone_number: '+86 ' + loginInfo.phoneNumber
          })

          showMessage('验证码已发送，请注意查收', 'success')

          // --- 修改：保存未来的结束时间戳到 localStorage ---
          const cooldownEndTime = Date.now() + 60 * 1000 // 当前时间 + 60秒
          localStorage.setItem('verificationCodeCooldownEnd', String(cooldownEndTime))

          cooldownSeconds.value = 60
          // --- 修改：调用封装好的函数来启动计时器 ---
          startCooldownTimer()
      } catch (error) {
          showMessage('验证码发送失败，请稍后重试', 'error')
          console.error(error)
      }
  }

  onMounted(() => {
      if (auth.hasLoginState()) {
          auth.signOut()
      }

      // --- 新增：页面加载时检查 localStorage 中的倒计时状态 ---
      const cooldownEndTime = localStorage.getItem('verificationCodeCooldownEnd')
      if (cooldownEndTime) {
          const remainingTime = Number(cooldownEndTime) - Date.now()

          // 如果剩余时间大于0，说明倒计时还未结束
          if (remainingTime > 0) {
              // 设置倒计时秒数
              cooldownSeconds.value = Math.ceil(remainingTime / 1000)
              // 启动倒计时
              startCooldownTimer()
          } else {
              // 如果时间已过，清理掉旧的存储
              localStorage.removeItem('verificationCodeCooldownEnd')
          }
      }
  })

  onUnmounted(() => {
      if (timer) {
          clearInterval(timer)
      }
  })

  const handleLogin = async () => {
      // ... 此处 handleLogin 函数的逻辑保持不变
      if (!loginInfo.phoneNumber || !loginInfo.verificationCode) {
          showMessage('请输入手机号和验证码！', 'error')
          return
      }

      try {
          showMessage(`正在登录...`, 'info')

          const userInfo: any = await userStore.login({
              phoneNumber: loginInfo.phoneNumber,
              verificationCode: loginInfo.verificationCode,
              verification: verification
          })

          if (userInfo.isVip) {
              if (userInfo.isNew) {
                  showMessage('首次登录,送七天付费体验~', 'success', 5000)
              } else {
                  showMessage('登录成功', 'success', 3000)
              }
              router.push('/home')
          } else {
              showMessage('会员已过期,请联系开发者续费', 'error', 10000)
          }
      } catch (error) {
          console.error('登录失败:', error)
          showMessage('登录失败，请检查验证码或稍后重试', 'error')
      }
  }
</script>

<style scoped>
  .login-page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100vw;
      min-height: 100vh;
      overflow: hidden;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
      animation: breatheBackground 10s ease-in-out infinite alternate;
  }

  @keyframes breatheBackground {
      from {
          background-size: 100% 100%;
      }
      to {
          background-size: 110% 110%;
      }
  }

  .login-container {
      width: 100%;
      max-width: 420px;
      padding: 3rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
      text-align: center;
      animation: fadeIn 0.8s ease-in-out;
  }

  @keyframes fadeIn {
      from {
          opacity: 0;
          transform: translateY(20px);
      }
      to {
          opacity: 1;
          transform: translateY(0);
      }
  }

  .login-title {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #ffffff;
      animation: fadeIn 0.5s ease-in-out 0.2s backwards;
  }

  .login-subtitle {
      font-size: 1rem;
      color: #b0c4de;
      margin-bottom: 2.5rem;
      animation: fadeIn 0.5s ease-in-out 0.3s backwards;
  }

  form > .form-group {
      animation: fadeIn 0.5s ease-in-out 0.4s backwards;
  }

  .form-group-inline {
      animation: fadeIn 0.5s ease-in-out 0.5s backwards;
  }

  .submit-btn {
      animation: fadeIn 0.5s ease-in-out 0.6s backwards;
  }

  .form-group {
      position: relative;
      margin-bottom: 1.8rem;
      flex-grow: 1;
  }

  .form-group-inline {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1.8rem;
  }

  .form-group-inline .form-group {
      margin-bottom: 0;
  }

  .input-field {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 2px solid rgba(255, 255, 255, 0.2);
      padding: 10px 0;
      font-size: 1.1rem;
      color: #ffffff;
      outline: none;
      transition: border-color 0.3s ease, transform 0.3s ease;
      caret-color: #ffffff;
  }

  .input-field:focus {
      border-bottom-color: #00aaff;
  }

  .input-field:focus {
      transform: scale(1.02);
  }

  .input-label {
      position: absolute;
      top: 10px;
      left: 0;
      font-size: 1.1rem;
      color: #b0c4de;
      pointer-events: none;
      transition: all 0.3s ease;
  }

  .input-field:focus + .input-label,
  .input-field:not(:placeholder-shown) + .input-label {
      top: -16px;
      font-size: 0.85rem;
      color: #00aaff;
  }

  .get-code-btn {
      padding: 0.7rem 1rem;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #ffffff;
      font-size: 0.9rem;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.3s ease;
      flex-shrink: 0;
  }

  .get-code-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.25);
      border-color: #00aaff;
  }

  .get-code-btn:disabled {
      cursor: not-allowed;
      background: rgba(255, 255, 255, 0.1);
      color: #b0c4de;
  }

  .submit-btn {
      width: 100%;
      padding: 1rem;
      background: #00aaff;
      border: none;
      border-radius: 8px;
      color: #ffffff;
      font-size: 1.2rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      margin-top: 1rem;
      margin-bottom: 3rem;
  }

  .submit-btn:hover {
      transform: translateY(-5px);
      box-shadow: 0 0 15px #00aaff, 0 0 30px rgba(0, 170, 255, 0.5);
  }

  .submit-btn:active {
      transform: translateY(-2px) scale(0.98);
      box-shadow: 0 0 8px #00aaff;
  }

  .input-field:-webkit-autofill,
  .input-field:-webkit-autofill:hover,
  .input-field:-webkit-autofill:focus,
  .input-field:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
      -webkit-text-fill-color: #ffffff !important;
      caret-color: #ffffff;
      transition: background-color 5000s ease-in-out 0s;
  }
</style>