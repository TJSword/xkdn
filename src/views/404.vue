<template>
  <div class="page-wrapper">
    <div class="main-container">
      <!-- 新增：与其他页面一致的返回链接 -->

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
  /* 新增：页面加载动画定义 */
  @keyframes fadeInUp {
      from {
          opacity: 0;
          transform: translateY(20px);
      }
      to {
          opacity: 1;
          transform: translateY(0);
      }
  }

  /* 新增：动态背景动画 */
  @keyframes breatheBackground {
      from {
          background-size: 100% 100%;
      }
      to {
          background-size: 110% 110%;
      }
  }

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
      /* 修改：使用和其他页面一致的动态背景 */
      background: radial-gradient(circle at 20% 80%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 80% 25%, #4a1a2a, transparent 40%), #121212;
      animation: breatheBackground 10s ease-in-out infinite alternate;
  }

  .main-container {
      max-width: 600px; /* 适当减小最大宽度，使其更聚焦 */
      width: 100%;
      margin: 0 auto;
      text-align: center;
  }

  /* 新增：返回主页链接样式 */
  .back-button {
      color: #b0c4de;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s ease;
      display: inline-block;
      margin-bottom: 2rem; /* 与卡片保持距离 */
  }

  .back-button:hover {
      color: #00aaff;
  }

  /* 错误内容卡片样式 */
  .error-card {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 3rem 2.5rem;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }

  /* 修改：为卡片内部元素应用交错动画 */
  .error-code,
  .error-title,
  .error-description,
  .home-button {
      animation: fadeInUp 0.6s ease-out forwards;
      opacity: 0;
  }

  .error-title {
      animation-delay: 0.1s;
  }
  .error-description {
      animation-delay: 0.2s;
  }
  .home-button {
      animation-delay: 0.3s;
  }

  /* 巨大醒目的 "404" */
  .error-code {
      font-size: 8rem;
      font-weight: 900;
      margin: 0;
      color: #00aaff;
      /* 修改：增强的霓虹灯效果 */
      text-shadow: 0 0 10px rgba(0, 170, 255, 0.7), 0 0 25px rgba(0, 170, 255, 0.5),
          0 0 40px rgba(0, 170, 255, 0.2);
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
      color: #b0c4de; /* 使用统一的辅助文字颜色 */
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
      /* 修改：与登录页按钮一致的阴影 */
      box-shadow: none;
  }

  .home-button:hover {
      /* 修改：与登录页按钮一致的悬停效果 */
      transform: translateY(-5px);
      box-shadow: 0 0 15px #00aaff, 0 0 30px rgba(0, 170, 255, 0.5);
  }

  /* ======================================================= */
  /* ========      404 页面响应式样式 (优化版)      ======== */
  /* ======================================================= */

  @media (max-width: 768px) {
      .page-wrapper {
          background: radial-gradient(circle at 50% 20%, #1a2a4a, transparent 70%),
              radial-gradient(circle at 50% 80%, #4a1a2a, transparent 70%), #121212;
          animation: none; /* 在移动端关闭背景呼吸动画以节省性能 */
      }
      .error-card {
          padding: 2.5rem 2rem;
      }
      .error-code {
          font-size: 7rem;
      }
      .error-title {
          font-size: 1.8rem;
      }
  }

  @media (max-width: 576px) {
      .page-wrapper {
          padding: 1rem;
      }
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
          line-height: 1.8;
          margin-bottom: 3rem;
      }
      .home-button {
          width: 80%; /* 占更宽的比例，更易点击 */
          padding: 1rem;
          font-size: 1rem;
      }
      .home-button:hover {
          transform: none; /* 移动端通常没有悬停，取消效果 */
          box-shadow: none;
      }
  }
</style>