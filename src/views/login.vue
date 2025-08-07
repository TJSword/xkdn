<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <h1 class="login-title">{{ pageTitle }}</h1>
      <p class="login-subtitle">{{ pageSubtitle }}</p>

      <form @submit.prevent="handleSubmit">
        <!-- 手机号 (所有模式通用) -->
        <div class="form-group">
          <input type="tel" id="phone" class="input-field" v-model="formData.phoneNumber" placeholder=" " required>
          <label for="phone" type="number" class="input-label">手机号</label>
        </div>

        <!-- 验证码 (仅在注册和找回密码时显示) -->
        <div v-if="mode !== 'login'" class="form-group-inline">
          <div class="form-group">
            <input type="text" id="code" class="input-field" v-model="formData.verificationCode" placeholder=" " required>
            <label for="code" class="input-label">验证码</label>
          </div>
          <button type="button" @click="handleGetCode" :disabled="isCoolingDown" class="get-code-btn">
            {{ getCodeButtonText }}
          </button>
        </div>

        <!-- 密码 (所有模式通用) -->
        <div class="form-group">
          <input type="password" id="password" class="input-field" v-model="formData.password" placeholder=" " required
            autocomplete="current-password">
          <label for="password" class="input-label">{{ passwordLabel }}</label>
        </div>

        <!-- 确认密码 (仅在注册和找回密码时显示) -->
        <div v-if="mode !== 'login'" class="form-group">
          <input type="password" id="confirmPassword" class="input-field" v-model="formData.confirmPassword" placeholder=" " required>
          <label for="confirmPassword" class="input-label">再次输入密码</label>
        </div>

        <button type="submit" class="submit-btn">{{ submitButtonText }}</button>
      </form>

      <!-- 模式切换链接 -->
      <div class="form-switcher">
        <template v-if="mode === 'login'">
          <a @click.prevent="switchMode('forgot')">忘记密码?</a>
          <span> | </span>
          <a @click.prevent="switchMode('register')">注册新账号</a>
        </template>
        <template v-else>
          <a @click.prevent="switchMode('login')">已有账号？返回登录</a>
        </template>
      </div>
    </div>

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
  import { useRouter } from 'vue-router'
  import { auth } from '@/lib/cloudbase' // 保持对 auth 的引用，用于发送验证码
  import { useUserStore } from '@/store/user'

  const router = useRouter()
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
          const userInfo: any = await userStore.loginWithPassword({
              phoneNumber: formData.phoneNumber,
              password: formData.password
          })

          // 登录成功后的逻辑保持不变
          if (userInfo.isVip) {
              showMessage('登录成功', 'success', 3000)
              router.push({ name: 'home' })
          } else {
              openExpiryModal()
          }
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

          showMessage('首次注册,送七天付费体验~', 'success', 5000)
          router.push({ name: 'home', state: { newUser: true } })
          console.log('模拟注册成功:', { phoneNumber, password })
      } catch (error: any) {
          console.error('注册失败:', error)
          showMessage(error.message || '注册失败，请稍后重试', 'error')
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
          showMessage(error.message || '重置密码失败，请稍后重试', 'error')
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
      if (auth.hasLoginState()) {
          auth.signOut()
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
      /* animation: fadeIn 0.8s ease-in-out; */
  }
  /* --- 新增：为卡片内部元素添加交错动画 --- */
  .login-title,
  .login-subtitle,
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
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #ffffff;
  }

  .login-subtitle {
      font-size: 1rem;
      color: #b0c4de;
      margin-bottom: 2.5rem;
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
  }

  .submit-btn:hover {
      transform: translateY(-5px);
      box-shadow: 0 0 15px #00aaff, 0 0 30px rgba(0, 170, 255, 0.5);
  }

  /* --- 新增：模式切换链接样式 --- */
  .form-switcher {
      text-align: center;
      margin-top: 1.5rem;
  }

  .form-switcher a {
      color: #b0c4de;
      text-decoration: none;
      cursor: pointer;
      font-size: 0.9rem;
      transition: color 0.3s ease;
  }

  .form-switcher a:hover {
      color: #00aaff;
      text-decoration: underline;
  }

  .form-switcher span {
      color: rgba(255, 255, 255, 0.3);
      margin: 0 0.5rem;
  }

  /* --- 浏览器自动填充样式 (保持不变) --- */
  .input-field:-webkit-autofill,
  .input-field:-webkit-autofill:hover,
  .input-field:-webkit-autofill:focus,
  .input-field:-webkit-autofill:active {
      -webkit-box-shadow: 0 0 0px 1000px transparent inset !important;
      -webkit-text-fill-color: #ffffff !important;
      caret-color: #ffffff;
      transition: background-color 5000s ease-in-out 0s;
  }

  /* --- 弹窗样式 (保持不变) --- */
  .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
  }
  .modal-content {
      background: #1e1e1e;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 15px;
      padding: 1.5rem 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      width: 90%;
      max-width: 450px;
      transform: scale(1);
      color: #e0e0e0;
  }
  .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 1rem;
  }
  .modal-header h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #ffffff;
  }
  .modal-close-button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
  }
  .modal-body {
      text-align: left;
      line-height: 1.8;
  }
  .modal-body strong {
      color: #00c497;
      font-size: 1.05em;
      border-bottom: 2px dashed rgba(0, 196, 151, 0.4);
      padding-bottom: 2px;
      transition: all 0.3s ease;
  }
  .modal-body strong:hover {
      color: #33ffd8;
      border-bottom-color: rgba(0, 196, 151, 0.7);
  }
  .modal-body p {
      margin-bottom: 1rem;
  }
  .copy-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.1);
      padding: 0.8rem 1rem;
      border-radius: 8px;
      margin: 1.5rem 0;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.3s ease;
  }
  .copy-section:hover {
      border-color: #00aaff;
      background-color: rgba(0, 170, 255, 0.1);
  }
  .copy-section strong {
      color: #ffffff;
      font-weight: 700;
  }
  .copy-icon {
      font-size: 1.2rem;
  }
  .modal-confirm-button {
      width: 100%;
      padding: 0.8rem;
      background: #00aaff;
      border: none;
      border-radius: 8px;
      color: #ffffff;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.3s ease;
      margin-top: 1rem;
  }
  .modal-confirm-button:hover {
      transform: translateY(-3px);
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
          width: 75%;
          padding: 2rem 1.5rem;
          margin-top: -5vh;
      }
      .login-title {
          font-size: 1.8rem;
      }
      .login-subtitle {
          font-size: 0.9rem;
          margin-bottom: 2rem;
      }
      .input-field,
      .input-label {
          font-size: 1rem;
      }
      .get-code-btn {
          padding: 0.65rem 0.8rem;
          font-size: 0.85rem;
      }
      .submit-btn {
          padding: 0.9rem;
          font-size: 1.1rem;
      }
      .modal-content {
          width: 80%;
          padding: 1.5rem;
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