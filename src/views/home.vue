<template>
  <div class="home-page-wrapper">
    <div class="main-container">
      <!-- 标题和副标题 -->
      <h1 class="main-title">想亏都难</h1>
      <p class="subtitle">
        戒掉情绪交易 从这里开始
      </p>

      <!-- 市场温度计 -->
      <div class="market-thermometer-container clickable" @click="openModal" title="点击查看详细图表">
        <div class="thermometer-header">
          <h2 class="section-title">
            当前市场温度: {{ latestTemperature.toFixed(2) }}°C
          </h2>
        </div>

        <p class="thermometer-desc">更新时间: {{ latestDate }}</p>

        <div class="thermometer-gauge">
          <span class="label cheap">冷</span>
          <div class="gauge-bar">
            <div class="indicator" :style="{ left: marketTemperaturePercent }">
              <div class="indicator-head"></div>
              <div class="indicator-line"></div>
            </div>
          </div>
          <span class="label expensive">热</span>
        </div>
      </div>

      <!-- 功能网格 -->
      <div class="features-grid">
        <router-link v-for="card in allFeatureCards" :key="card.id" :to="card.link" :class="['strategy-card', card.cssClass]">
          <div class="card-icon">{{ card.icon }}</div>
          <h2 class="card-title">{{ card.title }}</h2>
          <p class="card-description">{{ card.description }}</p>
        </router-link>
      </div>

      <!-- 新增：页面底部的会员到期信息 -->
      <div class="user-actions-footer">
        <span>👑 会员有效期至: {{ membershipExpiryDate }}</span>
        <span class="separator">|</span>
        <div href="#" @click.prevent="openPasswordModal" class="action-link">修改密码</div>
      </div>

    </div>

    <!-- 模态框 -->
    <Transition name="modal-fade">
      <div v-if="isModalVisible" class="modal-backdrop" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>市场温度与指数走势</h3>
            <button class="modal-close-button" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div ref="echartContainer" class="echart-container"></div>
          </div>
        </div>
      </div>
    </Transition>
    <!-- ======== 新增：网站介绍欢迎弹窗 ======== -->
    <Transition name="modal-fade">
      <div v-if="isWelcomeModalVisible" class="modal-backdrop" @click="closeWelcomeModal">
        <div class="modal-content welcome-modal-content" @click.stop>

          <!-- 这是你要替换到 home.vue 中 isWelcomeModalVisible 控制的那个弹窗里的内容 -->
          <div class="modal-header">
            <h3>🎉 欢迎！很高兴与你相遇</h3>
            <button class="modal-close-button" @click="closeWelcomeModal">×</button>
          </div>
          <div class="modal-body welcome-modal-body">
            <p>你好，我是本站开发者老何。很高兴你能发现这个小小的投研工具站。</p>
            <p>
              创建它的初衷很简单：将我多年投资路上踩过的坑、总结出的有效策略，系统化地分享出来，帮助更多朋友少走弯路。
            </p>

            <h4>在这里，你可以：</h4>
            <ul>
              <li><strong>跟踪市场情绪</strong>：通过首页“市场温度计”，直观把握市场冷暖。</li>
              <li><strong>探索量化策略</strong>：查看全天候、可转债等多个模型的每日动态。</li>
              <li><strong>获取决策辅助</strong>：使用投资小工具，科学管理你的组合。</li>
            </ul>

            <p class="highlight-box">
              我们已为您自动开启了 <strong>7天全功能VIP体验</strong>！<br>
              如果想加入交流群或充值会员，可以点击首页的“关于本站”卡片。
            </p>

            <button class="welcome-modal-button" @click="closeWelcomeModal">开始探索之旅</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="isPasswordModalVisible" class="modal-backdrop" @click="closePasswordModal">
        <div class="modal-content password-modal-content" @click.stop>
          <div class="modal-header">
            <h3>修改您的登录密码</h3>
            <button class="modal-close-button" @click="closePasswordModal">×</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handlePasswordChange">
              <div class="form-group">
                <input type="password" id="currentPassword" class="input-field" v-model="passwordData.currentPassword" placeholder=" "
                  required>
                <label for="currentPassword" class="input-label">当前密码</label>
              </div>
              <div class="form-group">
                <input type="password" id="newPassword" class="input-field" v-model="passwordData.newPassword" placeholder=" " required>
                <label for="newPassword" class="input-label">新密码</label>
              </div>
              <div class="form-group">
                <input type="password" id="confirmNewPassword" class="input-field" v-model="passwordData.confirmNewPassword" placeholder=" "
                  required>
                <label for="confirmNewPassword" class="input-label">确认新密码</label>
              </div>
              <button type="submit" class="submit-btn">确认修改</button>
            </form>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
  import app, { auth } from '@/lib/cloudbase'
  import * as echarts from 'echarts'
  import { useUserStore } from '@/store/user'
  const showMessage: any = inject('showMessage')
  const userStore: any = useUserStore()
  // console.log(userStore.userInfo.admin)

  // --- 接口定义 ---
  interface FeatureCard {
      id: number
      title: string
      description: string
      icon: string
      cssClass: string
      link: string
  }
  interface StarDataItem {
      day: string
      star: number
      china_index: number
  }
  interface ProcessedDataItem extends StarDataItem {
      temperature: number
  }

  // --- 卡片数据定义 (已恢复原状) ---
  const allFeatureCards = ref<FeatureCard[]>([
      {
          id: 1,
          title: '全天候策略',
          description: '多元化资产配置，追求全环境稳定回报。',
          icon: '❂',
          cssClass: 'all-weather',
          link: '/all-weather'
      },
      {
          id: 2,
          title: '长钱策略',
          description: '关注长期价值投资，忽略短期市场波动。',
          icon: '⌛',
          cssClass: 'long-term',
          link: '/long-term'
      },
      // {
      //     id: 6,
      //     title: '现金流策略',
      //     description: '构建持续被动收入，打造你的第二份工资。',
      //     icon: '💰',
      //     cssClass: 'cash-flow-strategy', // 定义一个新的CSS类
      //     link: '/cash-flow' // 指向我们新创建的页面路由
      // },
      {
          id: 3,
          title: '可转债策略',
          description: '基于三低轮动模型，每日动态捕捉交易机会。',
          icon: '🔄',
          cssClass: 'convertible-bond',
          link: '/bonds'
      },
      {
          id: 4,
          title: '微盘股策略',
          description: '日度跟踪微盘组合，纪律化调仓获取贝塔收益。',
          icon: '💎',
          cssClass: 'micro-cap',
          link: '/micro-cap'
      },

      {
          id: 5,
          title: '投资小工具',
          description: '提供再平衡计算器等，辅助科学决策。',
          icon: '🛠️',
          cssClass: 'handy-tools',
          link: '/tools'
      },
      // {
      //     id: 6,
      //     title: '老何的实盘',
      //     description: '记录真实投资操作，分享市场实战经验。',
      //     icon: '🚀',
      //     cssClass: 'personal-ledger',
      //     link: '/ledger'
      // },
      {
          id: 6,
          title: '财富版图',
          description: '将您的资产目标具象化，一步步点亮全国版图。',
          icon: '🗺️',
          cssClass: 'wealth-map', // 定义一个新的CSS类
          link: '/wealth-map' // 定义新的路由路径
      },
      {
          id: 7,
          title: '关于本站',
          description: '了解建站初衷、开发者、会员服务与联系方式。',
          icon: '💡',
          cssClass: 'about-us',
          link: '/about' // 特殊 link 表示它不跳转，而是触发弹窗
      }
  ])

  // --- 会员状态 ---
  const membershipExpiryDate = ref('加载中...')

  // --- 市场温度计与数据处理 ---
  const rawHistoryData = ref<StarDataItem[]>([])
  const processedMarketData = ref<ProcessedDataItem[]>([])
  let minStar = ref(1.8)
  let maxStar = ref(5.98)

  const latestStar = ref(5.98)
  const latestTemperature = ref(0)
  const latestDate = ref('加载中...')
  let pollingInterval: number | null = null

  /**
   * [异步] 获取会员到期时间 (示例)
   */

  function processDataWithLinearMapping() {
      const data = rawHistoryData.value
      if (!data || data.length === 0) return

      const allStars = data.map(item => item.star)
      minStar.value = Math.min(...allStars)
      maxStar.value = Math.max(...allStars)
      const starRange = maxStar.value - minStar.value

      if (starRange === 0) {
          processedMarketData.value = data.map(item => ({ ...item, temperature: 50 }))
      } else {
          processedMarketData.value = data.map(item => {
              const temp = 100 - ((item.star - minStar.value) / starRange) * 100
              return { ...item, temperature: temp }
          })
      }
      updateLatestTemperature(latestStar.value)
  }

  function updateLatestTemperature(starRating: number) {
      if (processedMarketData.value.length === 0) return

      const range = maxStar.value - minStar.value
      if (range === 0) {
          latestTemperature.value = 50
          return
      }
      latestTemperature.value = 100 - ((starRating - minStar.value) / range) * 100
  }

  /**
   * [新函数] 通过一次调用获取所有市场数据（今日和历史）
   */
  const fetchMarketData = () => {
      return app
          .callFunction({
              name: 'getMarketData', // 调用我们新的合并函数
              data: {}
          })
          .then((res: any) => {
              if (res.result?.success) {
                  const { today, history } = res.result.data

                  // --- 从单个响应中填充所有数据 ---

                  // 1. 设置今日星级数据
                  if (today?.result) {
                      latestStar.value = today.result.star
                      latestDate.value = today.result.update_time
                  }

                  // 2. 设置历史星级数据
                  if (history?.result) {
                      rawHistoryData.value = history.result
                      // 设置完历史数据后，处理它以计算温度
                      processDataWithLinearMapping()
                  }
              } else {
                  // 处理云函数本身返回错误的情况
                  console.error('getMarketData 函数执行失败:', res.result?.error)
                  latestDate.value = '数据加载失败'
              }
          })
          .catch((err: any) => {
              console.error('调用 getMarketData 云函数失败:', err)
              latestDate.value = '数据加载失败'
          })
  }
  const isWelcomeModalVisible = ref(false)
  const closeWelcomeModal = () => {
      isWelcomeModalVisible.value = false
  }

  onMounted(async () => {
      // 现在我们并行获取会员信息和所有的市场数据
      await Promise.all([getMembershipExpiry(), fetchMarketData()])

      // --- 您 onMounted 中的其余逻辑保持不变 ---
      if (window.history.state && window.history.state.newUser) {
          setTimeout(() => {
              isWelcomeModalVisible.value = true
          }, 500)

          const newState = { ...window.history.state, newUser: false }
          window.history.replaceState(newState, '')
      }
  })
  onUnmounted(() => {
      if (pollingInterval) {
          clearInterval(pollingInterval)
      }
      if (myChart) {
          myChart.dispose()
      }
  })

  watch(latestStar, newStar => {
      updateLatestTemperature(newStar)
  })

  const marketTemperaturePercent = computed(() => {
      return `${Math.max(0, Math.min(100, latestTemperature.value))}%`
  })

  // --- 模态框与 ECharts 逻辑 (无变化) ---
  const isModalVisible = ref(false)
  const echartContainer = ref<HTMLElement | null>(null)
  let myChart: echarts.ECharts | null = null

  const openModal = () => {
      isModalVisible.value = true
  }
  const closeModal = () => {
      isModalVisible.value = false
  }
  const formatTimestamp = (timestamp: number) => {
      // 1. 处理无效输入
      // 如果 timestamp 是 null, undefined, 0, false 或空字符串，直接返回空字符串
      if (!timestamp) {
          return ''
      }

      // 确保输入是数字类型
      const ts = Number(timestamp)

      // 2. 自动判断并处理时间戳单位（秒或毫秒）
      // JavaScript 的 Date 对象构造函数需要毫秒级时间戳。
      // 如果时间戳的字符串长度是10位，我们假定它是以秒为单位，并将其乘以1000。
      const date = new Date(String(ts).length === 10 ? ts * 1000 : ts)

      // 3. 验证 Date 对象是否有效
      // 如果传入的 timestamp 无法解析成有效日期（例如非数字字符串），date.getTime() 会返回 NaN
      if (isNaN(date.getTime())) {
          console.error('Invalid timestamp provided:', timestamp)
          return '' // 或者可以返回 'Invalid Date'
      }

      // 4. 提取年、月、日、时、分、秒
      const Y = date.getFullYear()

      // getMonth() 返回的月份是从 0 开始的 (0-11)，所以需要加 1。
      // .toString().padStart(2, '0') 用于给个位数前面补 0，例如 1 月会变成 "01"。
      const M = (date.getMonth() + 1).toString().padStart(2, '0')
      const D = date.getDate().toString().padStart(2, '0')
      const h = date.getHours().toString().padStart(2, '0')
      const m = date.getMinutes().toString().padStart(2, '0')
      // const s = date.getSeconds().toString().padStart(2, '0')

      // 5. 拼接成最终的字符串格式
      return `${Y}-${M}-${D} ${h}:${m}`
  }

  const getMembershipExpiry = async () => {
      try {
          // 在这里替换为您的真实API调用
          setTimeout(() => {
              membershipExpiryDate.value = formatTimestamp(userStore.userInfo.vipExpiry)
          }, 1000)
      } catch (error) {
          console.error('获取会员信息失败:', error)
          membershipExpiryDate.value = '获取失败'
      }
  }
  watch(isModalVisible, newValue => {
      if (newValue && processedMarketData.value.length > 0) {
          nextTick(() => {
              if (echartContainer.value) {
                  myChart = echarts.init(echartContainer.value)
                  const dates = processedMarketData.value.map(item => item.day)
                  const temperatureValues = processedMarketData.value.map(item =>
                      item.temperature.toFixed(2)
                  )
                  const indexValues = processedMarketData.value.map(item => item.china_index)

                  const option: echarts.EChartsOption = {
                      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
                      legend: { data: ['市场温度', '中证全指'], textStyle: { color: '#ccc' } },
                      grid: { left: '8%', right: '8%', bottom: '20%' },
                      xAxis: {
                          type: 'category',
                          data: dates,
                          axisLine: { lineStyle: { color: '#8392A5' } }
                      },
                      yAxis: [
                          {
                              type: 'value',
                              name: '市场温度',
                              position: 'left',
                              min: 0,
                              max: 100,
                              axisLine: { show: true, lineStyle: { color: '#5470C6' } },
                              axisLabel: { formatter: '{value} °C' }
                          },
                          {
                              type: 'value',
                              name: '中证全指',
                              position: 'right',
                              scale: true,
                              axisLine: { show: true, lineStyle: { color: '#91CC75' } },
                              axisLabel: { formatter: '{value}' }
                          }
                      ],
                      dataZoom: [
                          { type: 'inside', start: 93, end: 100 },
                          { show: true, type: 'slider', start: 80, end: 100, bottom: 10 }
                      ],
                      series: [
                          {
                              name: '市场温度',
                              type: 'line',
                              yAxisIndex: 0,
                              smooth: true,
                              data: temperatureValues,
                              itemStyle: { color: '#5470C6' }
                          },
                          {
                              name: '中证全指',
                              type: 'line',
                              yAxisIndex: 1,
                              smooth: true,
                              data: indexValues,
                              itemStyle: { color: '#91CC75' }
                          }
                      ]
                  }
                  myChart.setOption(option)
              }
          })
      } else {
          if (myChart) {
              myChart.dispose()
              myChart = null
          }
      }
  })
  const isPasswordModalVisible = ref(false)
  const passwordData = reactive({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
  })

  const openPasswordModal = () => {
      isPasswordModalVisible.value = true
  }
  const closePasswordModal = () => {
      isPasswordModalVisible.value = false
      // 关闭时清空数据
      passwordData.currentPassword = ''
      passwordData.newPassword = ''
      passwordData.confirmNewPassword = ''
  }
  const handlePasswordChange = async () => {
      // 1. 前端校验
      if (
          !passwordData.currentPassword ||
          !passwordData.newPassword ||
          !passwordData.confirmNewPassword
      ) {
          showMessage('请填写所有字段！', 'error')
          return
      }
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
          showMessage('两次输入的新密码不一致！', 'error')
          return
      }
      if (passwordData.newPassword.length < 6) {
          showMessage('新密码长度不能少于6位！', 'error')
          return
      }

      try {
          showMessage('正在修改密码...', 'info')
          const userStore = useUserStore() // 获取 store 实例

          // 确保调用的是 updatePassword
          await userStore.updatePassword({
              currentPassword: passwordData.currentPassword,
              newPassword: passwordData.newPassword
          })

          showMessage('密码修改成功！', 'success')
          closePasswordModal() // 关闭弹窗
      } catch (error: any) {
          console.error('修改密码失败:', error)
          showMessage(error.message || '修改密码失败，请检查当前密码是否正确', 'error')
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

  /* CSS样式部分 (恢复为您的原始样式) */
  .home-page-wrapper {
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      overflow: hidden;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
  }

  .main-container {
      text-align: center;
      max-width: 1200px;
      width: 100%;
      padding-bottom: 2rem;
      /* 给底部留出空间 */
  }

  .main-title {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      text-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
      /* 应用加载动画 */
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
  }

  .subtitle {
      font-size: 1rem;
      color: #b0c4de;
      margin-bottom: 2rem;
      max-width: 550px;
      margin-left: auto;
      margin-right: auto;
      /* 应用加载动画, 延迟0.2秒 */
      animation: fadeInUp 0.5s ease-out 0.2s forwards;
      opacity: 0;
  }

  .market-thermometer-container {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 15px;
      padding: 1.2rem 1.5rem;
      backdrop-filter: blur(10px);
      transition: transform 0.3s ease, border-color 0.3s ease;
      margin: 0 auto 2rem auto;
      text-align: left;
      /* 应用加载动画, 延迟0.4秒 */
      animation: fadeInUp 0.5s ease-out 0.4s forwards;
      opacity: 0;
  }

  .market-thermometer-container.clickable {
      cursor: pointer;
  }

  .market-thermometer-container.clickable:hover {
      transform: scale(1.02);
      border-color: #00aaff;
  }

  .thermometer-header {
      display: flex;
      justify-content: center;
      align-items: baseline;
      margin-bottom: 0.8rem;
  }

  .section-title {
      font-size: 1rem;
      margin: 0;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.9);
  }

  .thermometer-desc {
      margin: 0 0 1.2rem 0;
      color: #b0c4de;
      font-size: 0.75rem;
      text-align: center;
  }

  .thermometer-gauge {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      width: 100%;
  }

  .label {
      font-size: 0.8rem;
      font-weight: bold;
  }

  .label.cheap {
      color: #28a745;
  }

  .label.expensive {
      color: #ff4081;
  }

  .gauge-bar {
      flex-grow: 1;
      height: 10px;
      background: linear-gradient(to right, #28a745, #ffc107 50%, #ff4081);
      border-radius: 5px;
      position: relative;
  }

  .indicator {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: left 0.5s ease-out;
  }

  .indicator-head {
      width: 14px;
      height: 14px;
      background-color: #ffffff;
      border-radius: 50%;
      border: 2px solid #121212;
      position: absolute;
      top: -22px;
  }

  .indicator-line {
      width: 2px;
      height: 28px;
      background-color: #ffffff;
      position: absolute;
      top: -14px;
  }

  .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      /* 应用加载动画, 延迟0.6秒 */
      animation: fadeInUp 0.5s ease-out 0.6s forwards;
      opacity: 0;
  }

  .strategy-card {
      /* 修改：使用更有质感的渐变背景 */
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.2rem;
      overflow: hidden;
      transition: transform 0.4s ease, box-shadow 0.4s ease;
      cursor: pointer;
      backdrop-filter: blur(10px);
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 150px;
      text-align: center;
  }

  .strategy-card:hover {
      transform: translateY(-8px) scale(1.03);
  }
  .wealth-map:hover {
      box-shadow: 0 0 15px #ffd700; /* 金色光晕 */
      border-color: #ffd700;
  }
  .wealth-map .card-icon {
      color: #ffd700;
  }
  .about-us:hover {
      box-shadow: 0 0 15px #ffc107;
      border-color: #ffc107;
  }

  .about-us .card-icon {
      color: #ffc107;
  }

  .card-icon {
      font-size: 2.2rem;
      margin-bottom: 0.6rem;
  }

  .card-title {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
      font-weight: bold;
  }

  .card-description {
      font-size: 0.8rem;
      color: #b0c4de;
      line-height: 1.5;
  }

  .all-weather:hover {
      box-shadow: 0 0 15px #00aaff;
      border-color: #00aaff;
  }

  .all-weather .card-icon {
      color: #00aaff;
  }

  .long-term:hover {
      box-shadow: 0 0 15px #ff4081;
      border-color: #ff4081;
  }

  .long-term .card-icon {
      color: #ff4081;
  }

  .personal-ledger:hover {
      box-shadow: 0 0 15px #00c497;
      border-color: #00c497;
  }

  .personal-ledger .card-icon {
      color: #00c497;
  }

  .handy-tools:hover {
      box-shadow: 0 0 15px #8a2be2;
      border-color: #8a2be2;
  }

  .handy-tools .card-icon {
      color: #8a2be2;
  }

  .micro-cap:hover {
      box-shadow: 0 0 15px #f0e68c;
      border-color: #f0e68c;
  }

  .micro-cap .card-icon {
      color: #f0e68c;
  }

  .convertible-bond:hover {
      box-shadow: 0 0 15px #add8e6;
      border-color: #add8e6;
  }

  .convertible-bond .card-icon {
      color: #add8e6;
  }
  .cash-flow-strategy:hover {
      box-shadow: 0 0 15px #e59866;
      border-color: #e59866;
  }
  .cash-flow-strategy .card-icon {
      color: #e59866;
  }
  /* 页面底部会员信息的样式 */
  .user-actions-footer {
      text-align: center;
      margin-top: 3rem; /* 与上方网格保持足够距离 */
      color: #8392a5; /* 使用一种柔和、不刺眼的颜色 */
      font-size: 0.9rem;
      font-weight: 500;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.8rem; /* 在各项之间创建一些空间 */
      /* 应用加载动画, 延迟0.8秒 */
      animation: fadeInUp 0.5s ease-out 0.8s forwards;
      opacity: 0;
  }

  .user-actions-footer .separator {
      color: rgba(131, 146, 165, 0.5); /* 分隔符颜色更淡一些 */
  }

  .user-actions-footer .action-link {
      color: #8392a5; /* 链接颜色与普通文本一致 */
      padding-top: 1px;
      border-bottom: 1px solid transparent; /* 准备一个透明的下划线，用于悬停效果 */
      cursor: pointer;
      transition: all 0.3s ease; /* 平滑过渡效果 */
  }

  /* 鼠标悬停时，链接才变得突出 */
  .user-actions-footer .action-link:hover {
      color: #00aaff; /* 悬停时变为高亮色 */
      border-bottom-color: #00aaff; /* 显示下划线 */
      /* 修改：添加辉光效果 */
      text-shadow: 0 0 8px rgba(0, 170, 255, 0.7);
  }

  /* --- 之后的所有样式都恢复为您的原始版本 --- */

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
      max-width: 800px;
      transform: scale(1);
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
      font-size: 1.4rem;
  }

  .modal-close-button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 2rem;
      cursor: pointer;
      line-height: 1;
  }

  .echart-container {
      width: 100%;
      height: 450px;
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
  .password-modal-content {
      /* 新增：应用与登录页一致的玻璃拟态效果 */
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);

      /* 修改：减小最大宽度，使其更协调 */
      max-width: 450px !important;
      width: 90%; /* 确保在小屏幕上不会过宽 */

      /* 修改：调整内边距和圆角，使其更精致 */
      padding: 2.5rem;
      border-radius: 20px;
  }

  /* --- 弹窗头部样式 --- */
  .password-modal-content .modal-header {
      padding-bottom: 1.2rem;
      margin-bottom: 2rem; /* 增加与表单的距离 */
      text-align: center; /* 让标题居中 */
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .password-modal-content .modal-header h3 {
      font-size: 1.5rem; /* 适当增大标题字号 */
      font-weight: 700;
  }

  /* 隐藏默认的关闭按钮，因为头部已经居中，不再需要它在角落 */
  .password-modal-content .modal-close-button {
      display: none;
  }

  /* --- 弹窗内表单的样式 --- */
  .password-modal-content .form-group {
      position: relative;
      margin-bottom: 2.2rem; /* 增加输入框之间的垂直间距 */
  }

  /* 复用登录页的输入框和标签样式，确保统一 */
  .password-modal-content .input-field {
      width: 100%;
      background: transparent;
      border: none;
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);
      padding: 10px 5px;
      font-size: 1.1rem;
      color: #ffffff;
      outline: none;
      transition: all 0.3s ease;
      caret-color: #00aaff;
  }

  .password-modal-content .input-field:focus {
      border-bottom-color: #00aaff;
  }

  .password-modal-content .input-label {
      position: absolute;
      top: 10px;
      left: 5px;
      font-size: 1.1rem;
      color: #b0c4de;
      pointer-events: none;
      transition: all 0.3s ease;
  }

  .password-modal-content .input-field:focus + .input-label,
  .password-modal-content .input-field:not(:placeholder-shown) + .input-label {
      top: -18px;
      font-size: 0.9rem;
      color: #00aaff;
  }

  /* --- 弹窗内提交按钮的样式 --- */
  .password-modal-content .submit-btn {
      width: 100%;
      padding: 1rem;
      background: #00aaff;
      border: none;
      border-radius: 10px; /* 圆角与容器协调 */
      color: #ffffff;
      font-size: 1.2rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      margin-top: 1.5rem;
  }

  .password-modal-content .submit-btn:hover {
      transform: translateY(-5px);
      box-shadow: 0 0 15px #00aaff, 0 0 30px rgba(0, 170, 255, 0.5);
  }

  /* ... 之后的响应式和其他样式都保持您原来的版本 ... */
  @media (max-width: 1024px) {
      .features-grid {
          grid-template-columns: repeat(2, 1fr);
      }

      .home-page-wrapper {
          align-items: flex-start;
          overflow-y: auto;
      }
  }

  @media (max-width: 576px) {
      .home-page-wrapper {
          padding: 1.5rem 1rem;
      }

      .main-title {
          font-size: 1.8rem;
      }

      .subtitle {
          font-size: 0.9rem;
      }

      .thermometer-header {
          /* flex-direction: column; */
          /* align-items: flex-start; */
          gap: 0.25rem;
          margin-bottom: 0.5rem;
      }

      .thermometer-desc {
          text-align: center;
      }

      .features-grid {
          grid-template-columns: 1fr;
      }

      .strategy-card {
          min-height: auto;
          padding: 1.5rem;
      }

      .membership-footer {
          margin-top: 2rem;
      }
      .modal-content {
          padding: 1.2rem 1rem;
      }

      /* --- 新增：进一步减小图表高度 --- */
      .echart-container {
          height: 300px; /* 在最小屏幕上可以再小一点 */
      }

      /* --- 新增：适配欢迎弹窗的特定内容 --- */
      .welcome-modal-body h4 {
          font-size: 1.05rem; /* 减小欢迎弹窗内的小标题字号 */
      }
      .welcome-modal-body ul {
          padding-left: 0.5rem; /* 减小列表的左内边距 */
      }
      .welcome-modal-body li {
          font-size: 0.9rem; /* 减小列表项字号 */
      }
      .welcome-modal-button {
          width: 100%; /* 让“开始探索”按钮撑满宽度，更易点击 */
          padding: 0.9rem;
      }
  }

  .welcome-modal-content {
      max-width: 600px; /* 可以比图表弹窗窄一些 */
  }

  .welcome-modal-body {
      text-align: left;
      line-height: 1.8;
      color: #e0e0e0;
  }

  .welcome-modal-body h4 {
      color: #00aaff;
      margin-top: 1.5rem;
      margin-bottom: 0.8rem;
      font-size: 1.1rem;
  }

  .welcome-modal-body ul {
      list-style-type: none;
      padding-left: 1rem;
  }

  .welcome-modal-body li {
      margin-bottom: 0.7rem;
      padding-left: 1.5rem;
      position: relative;
  }

  .welcome-modal-body li::before {
      content: '✓';
      color: #28a745;
      font-weight: bold;
      position: absolute;
      left: 0;
      top: 2px;
  }

  .welcome-modal-body p:last-of-type {
      margin-top: 1.5rem;
      font-weight: 500;
      color: #fff;
      text-align: center;
  }

  .welcome-modal-button {
      display: block;
      width: 50%;
      margin: 1.5rem auto 0;
      padding: 0.8rem 1rem;
      background: #00aaff;
      border: none;
      border-radius: 8px;
      color: #ffffff;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .welcome-modal-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 12px #00aaff;
  }
  .welcome-modal-body .highlight-box {
      background: rgba(0, 170, 255, 0.1);
      border: 1px solid rgba(0, 170, 255, 0.3);
      border-radius: 8px;
      padding: 1rem;
      margin: 1.5rem 0;
      text-align: center;
      line-height: 1.6;
      color: #fff;
  }

  /* ==================================================== */
  /* ========   RESPONSIVE STYLES (Tablet & Mobile)  ======== */
  /* ==================================================== */

  @media (max-width: 1024px) {
      .main-container {
          width: 95%;
          padding-left: 1rem;
          padding-right: 1rem;
          max-width: none;
      }

      .home-page-wrapper {
          align-items: flex-start;
          padding-top: 2rem;
          overflow-y: auto;
      }

      .features-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 1.2rem;
      }

      .main-title {
          font-size: 2rem;
      }
  }

  @media (max-width: 768px) {
      .home-page-wrapper {
          background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
              radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
      }

      .main-container {
          width: 100%;
      }

      .strategy-card {
          padding: 1rem;
          min-height: 140px;
      }

      .modal-content {
          width: 80%;
          padding: 1.5rem;
      }

      .modal-header h3 {
          font-size: 1.2rem;
      }

      .echart-container {
          height: 400px;
      }
      .modal-content {
          width: 80%;
          padding: 1.5rem 1.2rem;
          max-height: 90vh;
          overflow-y: auto;
      }

      .modal-header h3 {
          font-size: 1.2rem;
      }

      .echart-container {
          height: 350px;
      }
      .user-profile-bar {
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
      }
      .password-modal-content {
          padding: 2rem 1.5rem;
      }

      .password-modal-content .modal-header {
          margin-bottom: 1.5rem;
      }

      .password-modal-content .modal-header h3 {
          font-size: 1.3rem;
      }

      .password-modal-content .form-group {
          margin-bottom: 1.5rem;
      }

      .password-modal-content .submit-btn {
          margin-top: 1rem;
      }
  }

  @media (max-width: 576px) {
      .home-page-wrapper {
          padding: 1.5rem 1rem;
      }
      .main-container {
          padding: 0;
      }

      .main-title {
          font-size: 1.8rem;
      }

      .subtitle {
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
      }

      .market-thermometer-container {
          padding: 1rem;
      }

      .thermometer-header {
          align-items: flex-start;
          justify-content: center;
          gap: 0.25rem;
      }
      .thermometer-desc {
          text-align: center;
          margin-top: 0.1rem;
          margin-bottom: 1.2rem;
      }

      .features-grid {
          grid-template-columns: 1fr;
      }

      .strategy-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 0.2rem 1rem 0.8rem;
          min-height: 140px;
      }

      .strategy-card .card-icon {
          font-size: 2.2rem;
          margin: 0 0 0.75rem 0;
      }

      .strategy-card .card-title {
          font-size: 1.15rem;
          line-height: 1.3;
          margin: 0 0 0.5rem 0;
      }

      .strategy-card .card-description {
          font-size: 0.85rem;
          line-height: 1.5;
          color: #b0c4de;
          margin: 0;
          max-width: 90%;
      }

      .membership-footer {
          margin-top: 2.5rem;
          font-size: 0.8rem;
      }

      .welcome-modal-button {
          width: 100%;
      }

      .welcome-modal-body ul {
          padding-left: 0.5rem;
      }

      .echart-container {
          height: 350px;
      }
      .user-actions-footer {
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 2.5rem;
      }

      .user-actions-footer .separator {
          display: none;
      }
  }
</style>