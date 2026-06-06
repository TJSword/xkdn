<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <span class="title-icon">💡</span>
          关于本站
        </h1>
        <p class="subtitle">
          化繁为简，行稳致远。在这里，投资回归本质。
        </p>
      </div>

      <!-- 2. 内容卡片区域 -->
      <div class="content-grid">

        <!-- 卡片一：初衷与理念 -->
        <div class="content-card">
          <h2 class="card-title">初衷与理念</h2>
          <p class="card-description">
            大家好，我是本站的开发者老何。
          </p>
          <p class="card-description">
            最初，我曾想过搭建一个小程序，因为它足够便捷。但后来发现，无论是小程序还是网站，备案审核的流程都颇为周折（笑）。尽管如此，我依然坚持把这个网站做了出来。
          </p>
          <p class="card-description">
            作为一名在市场里摸爬滚滚多年的普通投资者，我走过太多崎岖的弯路。我真心希望通过这个平台，将自己验证过的投资策略和思考系统地分享出来，帮助更多朋友避免重蹈覆辙。过去，我常在交流群里分享一些碎片化的知识，信息一闪而过，效率不高；在其他平台分享，又常常受制于各种规则。
          </p>
          <p class="card-description">
            恰好我具备一些网站开发的能力，便萌生了“自己动手，丰衣足食”的想法。我希望这个网站能成为一个纯粹、高效的投研工具，也希望每一位到访的朋友，都能在这里 <strong>学有所思，思有所得</strong>。
          </p>
        </div>

        <!-- 卡片二：会员服务与支持 -->
        <div class="content-card">
          <h2 class="card-title">会员服务与支持</h2>
          <p class="card-description">
            本站并未开设在线充值入口，因为复杂的审批流程可能会影响网站的纯粹性。我们采用一种更简单直接的方式：
          </p>
          <ul class="idea-list">
            <li><strong>新用户福利：</strong>首次登录，系统将自动赠送您 <strong>1天全功能VIP体验</strong>。</li>
            <li><strong>会员到期：</strong>体验期结束后，您将无法访问受保护的策略页面。</li>
            <!-- <li><strong>核心权益：</strong>会员可享受所有策略模型的每日数据更新、历史回测查看以及未来所有新增功能的使用权。</li> -->
          </ul>
        </div>
        <!-- <div class="content-card cost-card">
          <h2 class="card-title">费用说明与承诺</h2>
          <p class="card-description">
            为了覆盖服务器、数据接口等基础运营成本，本站目前采用象征性的收费模式，定价为 <strong>1元/周</strong>。
          </p>
          <p class="card-description">
            我们承诺，即便未来成本上涨，费用的最高上限也仅会调整至 <strong>2元/周</strong>。我们绝不会将价格设定得更高，因为那将违背我创建这个网站“共享”的初衷。
          </p>
          <p class="card-description">
            如果未来 2元/周 的费用依然无法覆盖基本开销，我将选择关闭网站，而不是进一步提高价格来增加用户的负担。感谢您的理解与支持。
          </p>
        </div> -->

        <!-- 卡片三：如何续费与加入交流群 -->
        <div class="content-card contact-card">
          <h2 class="card-title">续费与交流</h2>
          <p class="card-description">
            如果您觉得这个网站对您有帮助，并愿意支持我继续投入服务器、数据接口和开发维护的成本——无论是通过 <strong>续费会员</strong>的方式，或是希望 <strong>加入会员专属交流群</strong>
            ，与更多志同道合的投资者深度探讨，都请通过以下方式联系我。
          </p>
          <p class="card-description">
            您的每一份支持，都是这个网站能持续运行、不断迭代的动力源泉。感谢！
          </p>

          <div class="contact-info-box">
            <div class="qr-code-area">
              <img src="@/assets/images/wechat-qrcode.jpg" alt="微信二维码" class="qr-code-image">
              <span class="qr-code-caption">微信扫码，添加好友</span>
            </div>
            <div class="wechat-id-area" @click="copyToClipboard('lib-young')" title="点击复制">
              <div class="wechat-id-text">
                <span>微信号</span>
                <strong>lib-young</strong>
              </div>
              <span class="copy-icon">📋</span>
            </div>
          </div>
        </div>

        <!-- 卡片四：常见问题 (FAQ) -->
        <!-- <div class="content-card">
          <h2 class="card-title">常见问题 (FAQ)</h2>
          <div class="faq-container">
            <div v-for="(item, index) in faqList" :key="index" class="faq-item">
              <button class="faq-question" @click="toggleFaq(index)">
                <span>{{ item.question }}</span>
                <span :class="['faq-icon', { 'is-open': openFaqIndex === index }]">+</span>
              </button>
              <div v-if="openFaqIndex === index" class="faq-answer">
                <p style="white-space: pre-line;">{{ item.answer }}</p>
              </div>
            </div>
          </div>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, inject } from 'vue'

  // 从 App.vue 注入 showMessage 函数
  const showMessage: any = inject('showMessage')

  // 控制FAQ的展开
  const openFaqIndex = ref<number | null>(0)
  const toggleFaq = (index: number) => {
      openFaqIndex.value = openFaqIndex.value === index ? null : index
  }

  // FAQ 数据
  const faqList = ref([
      {
          question: '网站的数据来源是什么？可靠吗？',
          answer: '本站所有策略数据均通过正规、付费的第三方金融数据接口获取，确保了数据的准确性和及时性。我们每日会对数据进行清洗和校验，尽最大努力保证您看到的信息是可靠的。'
      },
      {
          question: '未来还会有哪些新的功能或策略？',
          answer: '我们未来的核心方向将聚焦于深度挖掘【红利量化策略】，旨在为用户的【退休养老】或【财务自由】规划提供坚实的基石。\n\n具体而言，我们的开发将围绕两大主线：\n\n1. 策略模型深化：我们将不仅限于现有的红利策略，而是会开发更多细分模型，例如专注于寻找股息持续增长公司的【红利增长型】策略，以及结合盈利能力与股息稳定性的【高质量红利】策略，帮助您构建能够持续产生被动现金流的资产组合。\n\n2. 配套投研工具：我们正在规划一系列辅助工具，如【红利再投复利计算器】和【养老现金流规划】模拟器，让您能更直观地量化和追踪自己的养老金储备进度。我们的目标是，将本站打造成国内领先的、专注于退休规划的红利策略投研平台。您的任何建议都对我们至关重要，欢迎随时与我们交流！'
      }
  ])

  // 点击复制功能
  const copyToClipboard = async (text: string) => {
      try {
          await navigator.clipboard.writeText(text)
          showMessage('微信号已复制！', 'success')
      } catch (err) {
          showMessage('复制失败，请手动复制', 'error')
          console.error('Failed to copy: ', err)
      }
  }
</script>

<style scoped>
  /* --- 新增：页面加载动画定义 --- */
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
  /* 继承主页风格 - 完全复用 */
  .page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      background: radial-gradient(circle at 15% 50%, #4a4a1a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a2a1a, transparent 40%), #121212;
  }

  .main-container {
      max-width: 900px;
      margin: 0 auto;
  }

  /* 页面头部 - 图标颜色稍作调整 */
  .page-header {
      text-align: center;
      margin-bottom: 3rem;
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }

  .back-button {
      color: #b0c4de;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.3s ease;
      display: inline-block;
      margin-bottom: 1rem;
  }
  .back-button:hover {
      color: #00aaff;
  }

  .main-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
  }
  .title-icon {
      font-size: 2.8rem;
      color: #ffc107; /* 调整为理念的颜色 */
      text-shadow: 0 0 15px #ffc107;
  }
  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  /* 内容网格和卡片 - 完全复用 */
  .content-grid {
      display: grid;
      gap: 1.5rem;
  }
  .content-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem 2rem;
      backdrop-filter: blur(10px);
      transition: border-color 0.3s ease;
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }
  .content-card:hover {
      border-color: rgba(255, 193, 7, 0.5); /* 调整为理念的颜色 */
  }

  .content-card:nth-child(1) {
      animation-delay: 0.2s;
  }
  .content-card:nth-child(2) {
      animation-delay: 0.3s;
  }
  .content-card:nth-child(3) {
      animation-delay: 0.4s;
  }
  .content-card:nth-child(4) {
      animation-delay: 0.5s;
  }
  .content-card:nth-child(5) {
      animation-delay: 0.6s;
  }

  .card-title {
      font-size: 1.4rem;
      font-weight: bold;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 1rem;
      border-left: 4px solid #ffc107; /* 调整为理念的颜色 */
      padding-left: 1rem;
  }

  .card-description {
      font-size: 0.95rem;
      color: #b0c4de;
      line-height: 1.8;
      margin-bottom: 1rem;
  }
  .card-description:last-child {
      margin-bottom: 0;
  }

  .idea-list {
      list-style-type: '✔ ';
      padding-left: 1.5rem;
      color: #b0c4de;
      line-height: 1.8;
  }

  /* ======== 新增: 联系方式卡片的专属样式 ======== */
  .contact-card .card-title {
      border-left-color: #00c497; /* 使用一种新的、代表“联系”的颜色 */
  }
  .contact-card:hover {
      border-color: rgba(0, 196, 151, 0.5);
  }
  .contact-card .card-description strong {
      /* 1. 使用卡片的强调色（绿色），形成视觉统一 */
      color: #00c497;

      /* 2. 字体稍微放大一点，增加权重 */
      font-size: 1.05em;

      /* 3. 添加一个微妙的虚线底部边框，引导视线 */
      border-bottom: 2px dashed rgba(0, 196, 151, 0.4);

      /* 4. 给底部边框留出一点空间，避免文字和线条贴得太近 */
      padding-bottom: 2px;

      /* 5. 添加过渡效果，让鼠标悬停更平滑 */
      transition: all 0.3s ease;
  }

  /* [可选] 鼠标悬停时，让高亮效果更明显 */
  .contact-card .card-description strong:hover {
      color: #33ffd8; /* 颜色变得更亮 */
      border-bottom-color: rgba(0, 196, 151, 0.7); /* 虚线变得更实 */
  }
  .cost-card .card-title {
      /* 使用一种代表“金钱”、“价值”的颜色，比如柔和的蓝色 */
      border-left-color: #5470c6;
  }
  .cost-card:hover {
      border-color: rgba(84, 112, 198, 0.5);
  }
  .cost-card strong {
      display: inline-block; /* 让 padding 和 margin 生效 */
      background-color: rgba(255, 193, 7, 0.15); /* 使用页面主色调的半透明背景 */
      color: #ffc107; /* 使用页面主色调作为文字颜色 */
      padding: 0.2em 0.7em; /* 调整内边距，使其成为一个舒适的徽章 */
      border-radius: 6px; /* 添加圆角 */
      font-size: 1.1em; /* 让字体比周围文字稍大一点 */
      font-weight: 700; /* 确保是粗体 */
      border: 1px solid rgba(255, 193, 7, 0.3); /* 添加一个微妙的边框 */
      vertical-align: middle; /* [可选] 微调垂直对齐，使其与文本行更协调 */
      margin: 0 0.2em; /* [可选] 与前后文字留出一点空隙 */
  }
  .contact-info-box {
      display: flex;
      align-items: center;
      justify-content: space-around;
      gap: 2rem;
      margin-top: 2rem;
      background-color: rgba(0, 0, 0, 0.2);
      padding: 1.5rem;
      border-radius: 8px;
  }

  .qr-code-area {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
  }

  .qr-code-image {
      width: 140px;
      height: 140px;
      border-radius: 8px;
      border: 2px solid rgba(255, 255, 255, 0.2);
  }

  .qr-code-caption {
      margin-top: 0.75rem;
      font-size: 0.85rem;
      color: #b0c4de;
  }

  .wechat-id-area {
      display: flex;
      align-items: center;
      gap: 1rem;
      background-color: rgba(255, 255, 255, 0.1);
      padding: 1rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.3s ease;
      flex-grow: 1;
  }
  .wechat-id-area:hover {
      border-color: #00c497;
      background-color: rgba(0, 196, 151, 0.1);
  }

  .wechat-id-text {
      display: flex;
      flex-direction: column;
  }

  .wechat-id-text span {
      color: #b0c4de;
      font-size: 0.9rem;
  }
  .wechat-id-text strong {
      color: #ffffff;
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 1px;
  }

  .copy-icon {
      font-size: 1.5rem;
      color: #fff;
  }

  /* FAQ 样式 - 完全复用 */
  .faq-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
  }
  .faq-item {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .faq-item:last-child {
      border-bottom: none;
  }
  .faq-question {
      width: 100%;
      text-align: left;
      padding: 1rem 0;
      background: none;
      border: none;
      color: #fff;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
  }
  .faq-icon {
      font-size: 1.5rem;
      font-weight: bold;
      transition: transform 0.3s ease;
      color: #ffc107; /* 调整为理念的颜色 */
  }
  .faq-icon.is-open {
      transform: rotate(45deg);
  }
  .faq-answer {
      padding-bottom: 1rem;
      color: #b0c4de;
      line-height: 1.7;
  }

  /* 响应式 */
  @media (max-width: 768px) {
      .main-title {
          font-size: 2rem;
      }
      .content-card {
          padding: 1.5rem;
      }
      .contact-info-box {
          flex-direction: column;
      }
      .wechat-id-area {
          width: 100%;
          justify-content: space-between;
      }
  }
</style>