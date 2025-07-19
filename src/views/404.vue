<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 404 内容卡片 -->
      <div class="error-card">

        <!-- 错误码 -->
        <h1 class="error-code">404</h1>

        <!-- 错误标题 -->
        <h2 class="error-title">路径未找到</h2>

        <!-- 错误描述 -->
        <p class="error-description">
          您似乎偏离了预设的财富增长轨迹。<br>
          所访问的页面可能已被移动、删除，或从未存在过。
        </p>

        <!-- 返回主页按钮 -->
        <router-link to="/home" class="home-button">
          返回主页，重回正轨
        </router-link>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
  // 这个页面不需要特定的逻辑，所以 script 部分为空
</script>

<style scoped>
  /* 继承通用页面样式 */
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem 1rem;
      overflow: hidden;
      background: radial-gradient(circle at 20% 80%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 80% 25%, #4a1a2a, transparent 40%), #121212;
  }

  .main-container {
      max-width: 900px;
      width: 100%;
      margin: 0 auto;
      text-align: center;
  }

  /* 错误内容卡片样式 */
  .error-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 3rem 2rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: border-color 0.3s ease;
  }

  .error-card:hover {
      border-color: rgba(0, 170, 255, 0.5);
  }

  /* 巨大醒目的 "404" */
  .error-code {
      font-size: 8rem;
      font-weight: 900;
      margin: 0;
      color: #00aaff;
      text-shadow: 0 0 10px rgba(0, 170, 255, 0.5), 0 0 25px rgba(0, 170, 255, 0.3);
      line-height: 1;
  }

  /* "路径未找到" 标题 */
  .error-title {
      font-size: 2rem;
      font-weight: 700;
      margin-top: 0.5rem;
      margin-bottom: 1rem;
      color: #ffffff;
  }

  /* 详细描述文字 */
  .error-description {
      font-size: 1rem;
      color: #b0c4de;
      line-height: 1.7;
      margin-bottom: 2.5rem;
      max-width: 450px;
      margin-left: auto;
      margin-right: auto;
  }

  /* 返回主页按钮 */
  .home-button {
      display: inline-block;
      background-color: #00aaff;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.8rem 2.5rem;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 0 15px rgba(0, 170, 255, 0.3);
  }

  .home-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 20px rgba(0, 170, 255, 0.5);
  }

  /* 响应式调整 */
  @media (max-width: 576px) {
      .error-card {
          padding: 2rem 1.5rem;
      }
      .error-code {
          font-size: 6rem;
      }
      .error-title {
          font-size: 1.5rem;
      }
      .error-description {
          font-size: 0.9rem;
      }
      .home-button {
          width: 100%;
          padding: 1rem;
      }
  }
</style>