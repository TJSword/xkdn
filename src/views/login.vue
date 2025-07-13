<template>
  <div class="login-page-wrapper">
    <div class="login-container">
      <h1 class="login-title">欢迎回来</h1>
      <p class="login-subtitle">登录您的账户以继续</p>

      <!-- 
        使用 @submit.prevent 来监听表单提交事件。
        .prevent 修饰符可以阻止表单提交时的默认行为（页面刷新）。
      -->
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <!-- 
            使用 v-model 将输入框的值与 script 中的响应式变量双向绑定。
            `placeholder=" "` 是一个保留占位符的小技巧，以确保 :not(:placeholder-shown) 选择器能正常工作。
          -->
          <input type="email" id="email" class="input-field" v-model="credentials.email" placeholder=" " required>
          <label for="email" class="input-label">邮箱地址</label>
        </div>

        <div class="form-group">
          <input type="password" id="password" class="input-field" v-model="credentials.password" placeholder=" " required>
          <label for="password" class="input-label">密码</label>
        </div>

        <div class="login-options">
          <!-- 此处可以添加“记住我”的复选框 -->
          <div></div>
          <a href="#">忘记密码?</a>
        </div>

        <button type="submit" class="submit-btn">登 录</button>
      </form>

      <p class="signup-link">
        还没有账户? <a href="#">立即注册</a>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  // 导入 Vue 3 的 reactive 用于创建响应式对象
  import { reactive } from 'vue'

  // 使用 TypeScript 定义登录凭据的接口，增强类型安全
  interface Credentials {
      email: string
      password: string
  }

  // 使用 reactive 创建一个响应式对象来存储用户的输入
  // 当输入框的值改变时，这个对象会自动更新
  const credentials = reactive<Credentials>({
      email: '',
      password: ''
  })

  // 定义处理登录逻辑的函数
  const handleLogin = () => {
      // 在实际应用中，这里会调用 API 发送登录请求
      // 现在我们先在控制台打印出凭据

      if (!credentials.email || !credentials.password) {
          alert('请输入邮箱和密码！')
          return
      }

      console.log('准备提交的登录信息:')
      console.log('Email:', credentials.email)
      console.log('Password:', credentials.password)

      // 假设的API调用
      // loginApi(credentials).then(response => { ... }).catch(error => { ... });
      alert(`登录成功！\n邮箱: ${credentials.email}`)
  }
</script>

<style scoped>
  /* 
              使用 `scoped` 属性可以确保这里的 CSS 只作用于当前组件，
              不会污染全局样式或影响到其他组件。
            */
  /* @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;700&display=swap'); */

  :root {
      /* CSS 变量定义在这里对 scoped style 不起作用，
                 通常我们会把它们定义在全局的 CSS 文件中，
                 这里为了组件的独立性，直接使用颜色值或在 style 块中重新定义。*/
  }

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
      animation: fadeIn 1s ease-in-out;
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
      transition: border-color 0.3s ease;
  }

  .input-field:focus {
      border-bottom-color: #00aaff;
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

  .login-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      font-size: 0.9rem;
  }

  .login-options a {
      color: #b0c4de;
      text-decoration: none;
      transition: color 0.3s ease;
  }

  .login-options a:hover {
      color: #00aaff;
      text-decoration: underline;
  }

  .signup-link {
      margin-top: 2.5rem;
      font-size: 0.95rem;
      color: #b0c4de;
  }

  .signup-link a {
      color: #ffffff;
      font-weight: 700;
      text-decoration: none;
      transition: color 0.3s ease;
  }

  .signup-link a:hover {
      color: #00aaff;
  }
</style>