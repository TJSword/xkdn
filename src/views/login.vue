<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <div class="brand-lockup" aria-label="何以有数">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>何以有数</span>
      </div>
      <h1 class="login-title">{{ pageTitle }}</h1>
      <p class="login-subtitle">{{ pageSubtitle }}</p>

      <form @submit.prevent="handleSubmit">
        <!-- 手机号 (所有模式通用) -->
        <div class="form-group">
          <input type="tel" id="phone" class="input-field" v-model="formData.phoneNumber" placeholder=" "
            autocomplete="username" required>
          <label for="phone" type="number" class="input-label">手机号</label>
        </div>

        <!-- 验证码 (仅在注册和找回密码时显示) -->
        <div v-if="mode !== 'login'" class="form-group-inline">
          <div class="form-group">
            <input type="text" id="code" class="input-field" v-model="formData.verificationCode" placeholder=" "
              autocomplete="one-time-code" required>
            <label for="code" class="input-label">验证码</label>
          </div>
          <button type="button" @click="handleGetCode" :disabled="isCoolingDown" class="get-code-btn">
            {{ getCodeButtonText }}
          </button>
        </div>

        <!-- 密码 (所有模式通用) -->
        <div class="form-group">
          <input type="password" id="password" class="input-field" v-model="formData.password" placeholder=" " required
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'">
          <label for="password" class="input-label">{{ passwordLabel }}</label>
        </div>

        <!-- 确认密码 (仅在注册和找回密码时显示) -->
        <div v-if="mode !== 'login'" class="form-group">
          <input type="password" id="confirmPassword" class="input-field" v-model="formData.confirmPassword" placeholder=" "
            autocomplete="new-password" required>
          <label for="confirmPassword" class="input-label">再次输入密码</label>
        </div>

        <button type="submit" class="submit-btn">{{ submitButtonText }}</button>
      </form>

      <!-- 模式切换链接 -->
      <div class="form-switcher">
        <template v-if="mode === 'login'">
          <a @click.prevent="switchMode('forgot')">忘记密码?</a>
          <span> | </span>
          <a @click.prevent="handleRegisterClick">注册新账号</a>
        </template>
        <template v-else>
          <a @click.prevent="switchMode('login')">已有账号？返回登录</a>
        </template>
      </div>
    </div>

    <footer class="icp-footer">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
        鲁ICP备2025176786号
      </a>
    </footer>

    <!-- 会员过期提示弹窗 (保持不变) -->
    <Transition name="modal-fade">
      <div v-if="isExpiryModalVisible" class="modal-backdrop" @click="closeExpiryModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>会员时光已尽，期待与您再续前缘</h3>
            <button class="modal-close-button" @click="closeExpiryModal">×</button>
          </div>
          <div class="modal-body">
            <p>感谢曾经的陪伴！您的会员体验已到期。</p>
            <p>如果本站的策略与工具曾为您带来价值，并希望能继续与我们一同在投资之路上探索，欢迎<strong>添加开发者微信续费</strong>。期待您的回归！</p>
            <div class="copy-section" @click="copyToClipboard('lib-young')" title="点击复制">
              <span>微信号: <strong>lib-young</strong></span>
              <span class="copy-icon">📋</span>
            </div>
            <button class="modal-confirm-button" @click="closeExpiryModal">好的，我了解了</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref, computed, onMounted, onUnmounted, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { auth } from '@/lib/cloudbase' // 保持对 auth 的引用，用于发送验证码
  import { useUserStore } from '@/store/user'

  const router = useRouter()
  const route = useRoute()
  const userStore = useUserStore()
  const showMessage: any = inject('showMessage')
  let verification: any = null
  // ======== 1. 状态管理 ========
  const mode = ref<'login' | 'register' | 'forgot'>('login')
  const isExpiryModalVisible = ref(false)

  const formData = reactive({
      phoneNumber: '',
      password: '',
      verificationCode: '',
      confirmPassword: ''
  })

  // ======== 2. 计算属性 (动态UI) ========
  const pageTitle = computed(() => {
      if (mode.value === 'register') return '创建新账户'
      if (mode.value === 'forgot') return '重置密码'
      return '欢迎回来'
  })

  const pageSubtitle = computed(() => {
      if (mode.value === 'register') return '使用手机号和密码注册'
      if (mode.value === 'forgot') return '通过手机验证重置您的密码'
      return '使用手机号和密码登录' // <-- 修改：登录提示
  })

  const passwordLabel = computed(() => {
      if (mode.value === 'forgot') return '输入新密码'
      return '密码'
  })

  const submitButtonText = computed(() => {
      if (mode.value === 'register') return '注 册'
      if (mode.value === 'forgot') return '确认重置'
      return '登 录'
  })

  // ======== 3. 核心功能逻辑 ========
  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
      mode.value = newMode
      // 切换模式时清空所有输入字段，避免混淆
      formData.password = ''
      formData.verificationCode = ''
      formData.confirmPassword = ''
  }

  const handleRegisterClick = () => {
      switchMode('register')
  }

  const getErrorMessage = (error: any, fallback: string) => {
      const message = error?.message || error?.error_description || error?.msg || fallback
      if (/验证码.*(无效|失效|不匹配)|verification code.*(does not match|invalid|expired)/i.test(message)) {
          return '验证码无效或已失效，请重新获取验证码。'
      }
      return message
  }

  const handleSubmit = () => {
      switch (mode.value) {
          case 'login':
              handleLogin()
              break
          case 'register':
              handleRegister()
              break
          case 'forgot':
              handleForgotPassword()
              break
      }
  }

  const phoneRegex = /^1[3-9]\d{9}$/
  /**
   * 处理登录（手机号+密码）
   */
  const handleLogin = async () => {
      if (!phoneRegex.test(formData.phoneNumber)) {
          showMessage('请输入有效的手机号！', 'error')
          return
      }
      if (!formData.password) {
          // 登录只需要密码
          showMessage('请输入密码！', 'error')
          return
      }
      try {
          showMessage('正在登录...', 'info')
          // TODO: 调用你的 store 或 API 进行密码登录
          // 你需要在 userStore 中创建一个新的 action，例如 loginWithPassword
          // 这里是示例调用
          await userStore.loginWithPassword({
              phoneNumber: formData.phoneNumber,
              password: formData.password
          })

          // 登录成功后的逻辑保持不变
          // if (userInfo.isVip) {
          showMessage('登录成功', 'success', 3000)
          const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
          router.push(redirect)
          // } else {
          //     openExpiryModal()
          // }
      } catch (error: any) {
          console.error('登录失败:', error)
          showMessage(error.message || '登录失败，请检查手机号或密码', 'error')
      }
  }

  /**
   * 处理注册
   */
  const handleRegister = async () => {
      const { phoneNumber, verificationCode, password, confirmPassword } = formData
      if (!phoneRegex.test(formData.phoneNumber)) {
          showMessage('请输入有效的手机号！', 'error')
          return
      }
      if (!phoneNumber || !verificationCode || !password || !confirmPassword) {
          showMessage('请填写所有必填项！', 'error')
          return
      }
      if (password !== confirmPassword) {
          showMessage('的密码不一致！两次输入', 'error')
          return
      }
      if (password.length < 6) {
          showMessage('密码长度不能少于6位！', 'error')
          return
      }

      try {
          showMessage('正在注册...', 'info')
          if (verification.is_user) {
              showMessage('该手机号已被注册，请直接登录或找回密码。', 'warning', 5000)
              switchMode('login')
              formData.password = ''
              formData.confirmPassword = ''
              formData.verificationCode = ''
              return false
          }
          await userStore.register({
              phoneNumber: formData.phoneNumber,
              password: formData.password,
              verification: verification,
              verificationCode: formData.verificationCode
          })

          showMessage('首次注册,送1天付费体验~', 'success', 5000)
          router.push({ name: 'home', state: { newUser: true } })
          console.log('模拟注册成功:', { phoneNumber, password })
      } catch (error: any) {
          console.error('注册失败:', error)
          showMessage(getErrorMessage(error, '注册失败，请稍后重试'), 'error')
      }
  }

  /**
   * 处理找回/重置密码
   */
  const handleForgotPassword = async () => {
      const { phoneNumber, verificationCode, password, confirmPassword } = formData
      if (!phoneRegex.test(formData.phoneNumber)) {
          showMessage('请输入有效的手机号！', 'error')
          return
      }
      if (!phoneNumber || !verificationCode || !password || !confirmPassword) {
          showMessage('请填写所有必填项！', 'error')
          return
      }
      if (password !== confirmPassword) {
          showMessage('两次输入的密码不一致！', 'error')
          return
      }
      if (password.length < 6) {
          showMessage('新密码长度不能少于6位！', 'error')
          return
      }
      try {
          showMessage('正在重置密码...', 'info')
          await userStore.resetPassword({
              phoneNumber: formData.phoneNumber,
              newPassword: formData.password,
              verification: verification,
              verificationCode: formData.verificationCode
          })
          showMessage('密码重置成功！请使用新密码登录。', 'success')
          switchMode('login')
      } catch (error: any) {
          console.error('重置密码失败:', error)
          showMessage(getErrorMessage(error, '重置密码失败，请稍后重试'), 'error')
      }
  }

  // ======== 4. 辅助功能 (验证码, 弹窗等) ========

  // 获取验证码的逻辑 (仅用于注册和找回密码)
  const cooldownSeconds = ref(0)
  let timer: any = null
  const isCoolingDown = computed(() => cooldownSeconds.value > 0)
  const getCodeButtonText = computed(() => {
      return isCoolingDown.value ? `${cooldownSeconds.value}s` : '获取验证码'
  })

  const startCooldownTimer = () => {
      if (timer) {
          clearInterval(timer)
      }
      timer = setInterval(() => {
          cooldownSeconds.value--
          if (cooldownSeconds.value <= 0) {
              clearInterval(timer)
              localStorage.removeItem('verificationCodeCooldownEnd')
          }
      }, 1000)
  }

  const handleGetCode = async () => {
      if (isCoolingDown.value) return
      if (!phoneRegex.test(formData.phoneNumber)) {
          // <-- 使用常量
          showMessage('请输入有效的手机号！', 'error')
          return
      }
      showMessage('正在发送验证码...', 'info')
      try {
          // 发送验证码的逻辑本身不变
          verification = await auth.getVerification({
              phone_number: '+86 ' + formData.phoneNumber
          })
          showMessage('验证码已发送，请注意查收', 'success')
          const cooldownEndTime = Date.now() + 60 * 1000
          localStorage.setItem('verificationCodeCooldownEnd', String(cooldownEndTime))
          cooldownSeconds.value = 60
          startCooldownTimer()
      } catch (error) {
          showMessage('验证码发送失败，请稍后重试', 'error')
          console.error(error)
      }
  }

  // 弹窗相关
  const openExpiryModal = () => {
      isExpiryModalVisible.value = true
  }
  const closeExpiryModal = () => {
      isExpiryModalVisible.value = false
  }
  const copyToClipboard = async (text: string) => {
      try {
          await navigator.clipboard.writeText(text)
          showMessage('微信号已复制！', 'success')
      } catch (err) {
          showMessage('复制失败，请手动复制', 'error')
      }
  }

  // ======== 5. 生命周期钩子 ========
  onMounted(() => {
      const authReason = String(route.query.reason || '')
      if (authReason === 'session-replaced') {
          showMessage('账号已在其他设备重新登录，请重新验证', 'warning', 5000)
      } else if (authReason === 'expired') {
          showMessage('登录已过期，请重新登录', 'warning', 5000)
      }
      if (authReason) {
          const { reason, ...query } = route.query
          void router.replace({ path: '/login', query })
      }

      const cooldownEndTime = localStorage.getItem('verificationCodeCooldownEnd')
      if (cooldownEndTime) {
          const remainingTime = Number(cooldownEndTime) - Date.now()
          if (remainingTime > 0) {
              cooldownSeconds.value = Math.ceil(remainingTime / 1000)
              startCooldownTimer()
          } else {
              localStorage.removeItem('verificationCodeCooldownEnd')
          }
      }
  })

  onUnmounted(() => {
      if (timer) {
          clearInterval(timer)
      }
  })
</script>

<style scoped>
  .login-page-wrapper {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow-x: hidden;
      overflow-y: auto;
      padding: 1.25rem 1rem 0.75rem;
      width: 100vw;
      min-height: 100vh;
      font-family: 'Noto Sans SC', sans-serif;
      color: #fff;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #321722, transparent 42%), #121212;
      background-color: #121212;
      animation: breatheBackground 10s ease-in-out infinite alternate;
      box-sizing: border-box;
      flex-direction: column;
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
      position: relative;
      overflow: hidden;
      padding: 2.5rem 3rem 2.75rem;
      margin: auto;
      width: 100%;
      max-width: 420px;
      text-align: center;
      box-sizing: border-box;
      background:
          linear-gradient(135deg, rgb(56 189 248 / 8%), transparent 58%),
          rgb(15 23 42 / 58%);
      border: 1px solid rgb(148 163 184 / 18%);
      border-radius: 10px;
      box-shadow: 0 18px 48px rgb(0 0 0 / 32%);
      -webkit-backdrop-filter: blur(14px);
      backdrop-filter: blur(14px);

      /* animation: fadeIn 0.8s ease-in-out; */
  }

  .login-container::before {
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      height: 2px;
      background: linear-gradient(90deg, #38bdf8, #2dd4bf 58%, transparent);
      content: '';
      opacity: 0.9;
  }

  .brand-lockup {
      display: inline-flex;
      align-items: center;
      margin-bottom: 1.65rem;
      font-size: 0.82rem;
      color: #bfdbfe;
      gap: 0.5rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      animation-delay: 0.05s;
  }

  .brand-mark {
      width: 7px;
      height: 7px;
      background: #38bdf8;
      border-radius: 50%;
      box-shadow: 0 0 12px rgb(56 189 248 / 85%);
  }

  /* --- 新增：为卡片内部元素添加交错动画 --- */
  .login-title,
  .login-subtitle,
  .brand-lockup,
  form,
  .form-switcher {
      /* 关键：应用动画，并设置初始状态为透明 */
      animation: fadeIn 0.6s ease-out forwards;
      opacity: 0;
  }

  /* 设置不同的延迟时间 */
  .login-title {
      animation-delay: 0.1s;
  }

  .login-subtitle {
      animation-delay: 0.2s;
  }

  form {
      animation-delay: 0.3s;
  }

  .form-switcher {
      animation-delay: 0.4s;
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
      margin: 0 0 0.7rem;
      font-size: 1.9rem;
      color: #fff;
      font-weight: 700;
  }

  .login-subtitle {
      margin: 0 0 2.5rem;
      font-size: 0.92rem;
      color: #94a3b8;
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
      padding: 10px 0;
      width: 100%;
      font-size: 0.875rem;
      line-height: 1.4;
      color: #fff;
      background: transparent;
      border: none;
      outline: none;
      transition: border-color 0.3s ease, transform 0.3s ease;
      border-bottom: 2px solid rgb(255 255 255 / 20%);
      caret-color: #fff;
  }

  .input-field:focus {
      border-bottom-color: #38bdf8;
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
  .input-field:not(:placeholder-shown) + .input-label,
  .input-field:-webkit-autofill + .input-label {
      top: -16px;
      font-size: 0.85rem;
      color: #38bdf8;
  }

  .get-code-btn {
      padding: 0.7rem 1rem;
      font-size: 0.9rem;
      white-space: nowrap;
      color: #fff;
      background: rgb(255 255 255 / 15%);
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 8px;
      transition: all 0.3s ease;
      cursor: pointer;
      flex-shrink: 0;
  }

  .get-code-btn:hover:not(:disabled) {
      background: rgb(255 255 255 / 25%);
      border-color: #0af;
  }

  .get-code-btn:disabled {
      color: #b0c4de;
      background: rgb(255 255 255 / 10%);
      cursor: not-allowed;
  }

  .submit-btn {
      padding: 0.72rem 1rem;
      margin-top: 0.85rem;
      width: 100%;
      min-height: 46px;
      font-size: 1.05rem;
      color: #e8fffd;
      background: linear-gradient(90deg, rgb(56 189 248 / 9%), transparent);
      border: 1px solid rgb(56 189 248 / 72%);
      border-radius: 7px;
      box-shadow: 0 0 0 1px rgb(56 189 248 / 12%), 0 0 16px rgb(56 189 248 / 10%);
      transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      font-weight: 700;
      cursor: pointer;
  }

  .submit-btn:hover {
      background: linear-gradient(90deg, rgb(56 189 248 / 14%), transparent);
      border-color: #38bdf8;
      box-shadow: 0 0 0 1px rgb(56 189 248 / 20%), 0 0 22px rgb(56 189 248 / 18%);
      transform: translateY(-1px);
  }

  /* --- 新增：模式切换链接样式 --- */
  .form-switcher {
      margin-top: 1.5rem;
      text-align: center;
  }

  .form-switcher a {
      font-size: 0.9rem;
      text-decoration: none;
      color: #b0c4de;
      transition: color 0.3s ease;
      cursor: pointer;
  }

  .form-switcher a:hover {
      text-decoration: underline;
      color: #0af;
  }

  .form-switcher span {
      margin: 0 0.5rem;
      color: rgb(255 255 255 / 30%);
  }

  .icp-footer {
      margin-top: 1.25rem;
      text-align: center;
      flex: 0 0 auto;
  }

  .icp-footer a {
      font-size: 0.85rem;
      text-decoration: none;
      color: #b0c4de;
      transition: color 0.3s ease;
  }

  .icp-footer a:hover {
      text-decoration: underline;
      color: #0af;
  }

  /* --- 浏览器自动填充样式 (保持不变) --- */
  .input-field:-webkit-autofill,
  .input-field:-webkit-autofill:hover,
  .input-field:-webkit-autofill:focus,
  .input-field:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
      -webkit-text-fill-color: #fff !important;
      caret-color: #fff;
      transition: background-color 5000s ease-in-out 0s;
  }

  /* --- 弹窗样式 (保持不变) --- */
  .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      background-color: rgb(0 0 0 / 70%);
      backdrop-filter: blur(8px);
  }

  .modal-content {
      padding: 1.5rem 2rem;
      width: 90%;
      max-width: 450px;
      color: #e0e0e0;
      background: #1e1e1e;
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 15px;
      box-shadow: 0 10px 30px rgb(0 0 0 / 50%);
      transform: scale(1);
  }

  .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgb(255 255 255 / 10%);
  }

  .modal-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #fff;
  }

  .modal-close-button {
      font-size: 2rem;
      color: #fff;
      background: transparent;
      border: none;
      cursor: pointer;
      line-height: 1;
  }

  .modal-body {
      text-align: left;
      line-height: 1.8;
  }

  .modal-body strong {
      padding-bottom: 2px;
      font-size: 1.05em;
      color: #00c497;
      transition: all 0.3s ease;
      border-bottom: 2px dashed rgb(0 196 151 / 40%);
  }

  .modal-body strong:hover {
      color: #33ffd8;
      border-bottom-color: rgb(0 196 151 / 70%);
  }

  .modal-body p {
      margin-bottom: 1rem;
  }

  .copy-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem 1rem;
      margin: 1.5rem 0;
      background-color: rgb(255 255 255 / 10%);
      border: 1px solid transparent;
      border-radius: 8px;
      transition: all 0.3s ease;
      cursor: pointer;
  }

  .copy-section:hover {
      background-color: rgb(0 170 255 / 10%);
      border-color: #0af;
  }

  .copy-section strong {
      color: #fff;
      font-weight: 700;
  }

  .copy-icon {
      font-size: 1.2rem;
  }

  .modal-confirm-button {
      padding: 0 16px;
      margin-top: 1rem;
      width: 100%;
      min-height: 44px;
      font-size: 0.95rem;
      color: #e8fffd;
      background: linear-gradient(90deg, rgb(56 189 248 / 9%), transparent);
      border: 1px solid rgb(56 189 248 / 72%);
      border-radius: 7px;
      box-shadow: 0 0 0 1px rgb(56 189 248 / 12%), 0 0 16px rgb(56 189 248 / 10%);
      transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
      font-weight: 700;
      cursor: pointer;
  }

  .modal-confirm-button:hover {
      background: linear-gradient(90deg, rgb(56 189 248 / 14%), transparent);
      border-color: #38bdf8;
      box-shadow: 0 0 0 1px rgb(56 189 248 / 20%), 0 0 22px rgb(56 189 248 / 18%);
      transform: translateY(-1px);
  }

  .modal-fade-enter-active,
  .modal-fade-leave-active {
      transition: opacity 0.3s ease;
  }

  .modal-fade-enter-active .modal-content,
  .modal-fade-leave-active .modal-content {
      transition: transform 0.3s ease;
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
      opacity: 0;
  }

  .modal-fade-enter-from .modal-content,
  .modal-fade-leave-to .modal-content {
      transform: scale(0.95);
  }

  /* --- 移动端响应式样式 (保持不变) --- */
  @media (max-width: 768px) {
      .login-page-wrapper {
          background: radial-gradient(circle at 50% 20%, #1a2a4a, transparent 70%),
              radial-gradient(circle at 50% 80%, #4a1a2a, transparent 70%), #121212;
          animation: none;
      }

      .login-container {
          padding: 2rem 1.5rem 2.25rem;
          width: calc(100% - 3rem);
          max-width: 420px;
      }

      .brand-lockup {
          margin-bottom: 1.35rem;
      }

      .login-title {
          font-size: 1.8rem;
      }

      .login-subtitle {
          margin-bottom: 2rem;
          font-size: 0.9rem;
      }

      .input-label {
          font-size: 1rem;
      }

      .input-field {
          font-size: 0.875rem;
      }

      .get-code-btn {
          padding: 0.65rem 0.8rem;
          font-size: 0.85rem;
      }

      .submit-btn {
          padding: 0.72rem 1rem;
          font-size: 1.05rem;
      }

      .modal-content {
          padding: 1.5rem;
          width: 80%;
      }

      .modal-header h3 {
          font-size: 1.1rem;
      }

      .modal-body {
          line-height: 1.7;
      }

      .modal-body p {
          font-size: 0.95rem;
      }

      .copy-section {
          padding: 0.7rem 0.9rem;
          font-size: 0.9rem;
      }

      .modal-confirm-button {
          padding: 0.9rem;
          font-size: 1rem;
      }

      .submit-btn:hover,
      .modal-confirm-button:hover {
          transform: none;
      }
  }
</style>
