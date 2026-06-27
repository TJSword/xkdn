<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 -->
      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <FeaturePageIcon class="title-icon" type="about" />
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
            大家好，我是老何。
          </p>
          <p class="card-description">
            做这个网站，不是因为我已经找到了市场的答案。恰恰相反，是因为走过不少弯路，才慢慢明白：投资里最贵的东西，通常不是手续费，而是那些本可以不犯的错。
          </p>
          <p class="card-description">
            市场每天都很热闹，消息、观点和情绪轮番登场。真正有用的东西反而很安静——一组数据、一套规则，以及在该等待的时候，愿意再等一等。
          </p>
          <p class="card-description">
            于是有了“何以有数”。这里把策略、持仓、回撤和变化尽量讲清楚，不负责提供捷径，只希望让每一次决定多一点依据，少一点冲动。
          </p>
          <p class="card-description">
            如果它能帮你少走一点我走过的弯路，这个网站就没有白做。
          </p>
        </div>

        <!-- 卡片二：公众号 -->
        <div class="content-card official-account-card">
          <h2 class="card-title">关注公众号「何以有数」</h2>
          <div class="official-account-content">
            <div class="official-account-copy">
              <span class="official-account-badge">微信公众号</span>
              <p class="card-description">
                网站之外，我也会在同名公众号分享市场观察、策略思考、投资复盘与网站更新。
              </p>
              <p class="official-account-name">微信搜索：<strong>何以有数</strong></p>
              <span class="official-account-tip">也可以扫描二维码关注，手机端可长按识别。</span>
            </div>
            <div class="official-account-qr-area">
              <div class="official-account-qr-frame">
                <img
                  src="@/assets/images/wechat-official-account-qrcode.jpg"
                  alt="何以有数公众号二维码"
                  class="official-account-qr-image"
                >
              </div>
              <span>扫码关注同名公众号</span>
            </div>
          </div>
        </div>

        <!-- 卡片三：会员服务与支持 -->
        <div class="content-card">
          <h2 class="card-title">会员服务与支持</h2>
          <p class="card-description">
            本站目前只提供年度会员，不设置短期套餐。我们希望大家用更长的时间观察策略、理解波动，而不是被短期涨跌牵着走。
          </p>

          <h3 class="membership-section-title">开通说明</h3>
          <ul class="idea-list">
            <li>新用户可获得 <strong>1天全功能体验</strong>。</li>
            <li>年度会员有效期为1年，可通过首页“会员充值”开通或续费。</li>
          </ul>

          <h3 class="membership-section-title">会员专享服务</h3>
          <ul class="idea-list membership-benefit-list">
            <li><strong>完整持仓查看：</strong>查看各策略当前持仓与配置，不只看到收益结果，也能了解策略正在做什么。</li>
            <li><strong>策略变化提醒：</strong>使用通知工具订阅策略变化，发生调仓或配置更新时，由系统主动提醒。</li>
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

        <!-- 卡片四：帮助与加入交流群 -->
        <div class="content-card contact-card">
          <h2 class="card-title">帮助与交流</h2>
          <p class="card-description">
            会员可直接通过首页的 <strong>会员充值</strong> 入口开通或续费。如果您希望 <strong>加入会员专属交流群</strong>
            ，或在充值和使用过程中需要帮助，请通过以下方式联系我。
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

  .membership-section-title {
      display: flex;
      align-items: center;
      margin: 1.2rem 0 0.45rem;
      color: #f1f5f9;
      font-size: 0.95rem;
      gap: 0.5rem;
  }

  .membership-section-title::before {
      width: 6px;
      height: 6px;
      background: #ffc107;
      border-radius: 50%;
      box-shadow: 0 0 8px rgb(255 193 7 / 55%);
      content: '';
  }

  .membership-benefit-list strong {
      color: #f8fafc;
  }

  .official-account-card {
      background:
          radial-gradient(circle at 86% 22%, rgb(7 193 96 / 14%), transparent 34%),
          rgb(255 255 255 / 5%);
  }

  .official-account-card .card-title {
      border-left-color: #07c160;
  }

  .official-account-card:hover {
      border-color: rgb(7 193 96 / 48%);
  }

  .official-account-content {
      display: grid;
      align-items: center;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 2rem;
  }

  .official-account-copy {
      min-width: 0;
  }

  .official-account-badge {
      display: inline-flex;
      padding: 0.28rem 0.65rem;
      margin-bottom: 0.9rem;
      color: #bff7d7;
      font-size: 0.76rem;
      background: rgb(7 193 96 / 12%);
      border: 1px solid rgb(7 193 96 / 26%);
      border-radius: 999px;
  }

  .official-account-name {
      margin: 1rem 0 0.35rem;
      color: #b0c4de;
      font-size: 0.95rem;
  }

  .official-account-name strong {
      color: #e7fff1;
      font-size: 1.08rem;
      letter-spacing: 0.08em;
  }

  .official-account-tip {
      color: #8293a8;
      font-size: 0.82rem;
  }

  .official-account-qr-area {
      display: flex;
      align-items: center;
      color: #91a2b6;
      font-size: 0.78rem;
      flex-direction: column;
  }

  .official-account-qr-frame {
      padding: 0.5rem;
      margin-bottom: 0.65rem;
      width: 176px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 14px 30px rgb(0 0 0 / 28%);
  }

  .official-account-qr-image {
      display: block;
      width: 100%;
      border-radius: 7px;
      aspect-ratio: 1;
      object-fit: cover;
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
      .official-account-content {
          grid-template-columns: 1fr;
          gap: 1.5rem;
      }
      .official-account-copy {
          text-align: center;
      }
      .official-account-qr-area {
          justify-self: center;
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
