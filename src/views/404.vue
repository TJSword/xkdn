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

  /* ======================================================= */
  /* ========      404 页面响应式样式 (优化版)      ======== */
  /* ======================================================= */

  /* --- 中等屏幕 / 平板 (<= 768px) --- */
  @media (max-width: 768px) {
      .page-wrapper {
          /* 调整背景以适应纵向屏幕 */
          background: radial-gradient(circle at 50% 20%, #1a2a4a, transparent 60%),
              radial-gradient(circle at 50% 80%, #4a1a2a, transparent 60%), #121212;
      }

      .error-card {
          /* 在平板和较大手机上，稍微减小一点内边距 */
          padding: 2.5rem 2rem;
      }

      .error-code {
          font-size: 7rem; /* 字体比PC小，比手机大 */
      }

      .error-title {
          font-size: 1.8rem;
      }
  }

  /* --- 小型屏幕 / 手机 (<= 576px) --- */
  @media (max-width: 576px) {
      .page-wrapper {
          padding: 1rem; /* 进一步减小页面边距 */
      }

      .error-card {
          padding: 2rem 1.5rem; /* 您已有的规则，很好 */
      }

      .error-code {
          font-size: 6rem; /* 您已有的规则，很好 */
      }

      .error-title {
          font-size: 1.5rem; /* 您已有的规则，很好 */
      }

      .error-description {
          font-size: 0.9rem; /* 您已有的规则，很好 */
          line-height: 1.8; /* 增加一点行高，让文字更易读 */
          margin-bottom: 3rem; /* 增大与按钮的间距，让布局更舒展 */
      }

      .home-button {
          width: 70%; /* 您已有的规则，非常关键 */
          padding: 1rem; /* 您已有的规则，让按钮更大更易点 */
          font-size: 1rem; /* 稍微调整字号 */
      }
  }
</style>