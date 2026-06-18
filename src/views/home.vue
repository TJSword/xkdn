<template>
  <div class="home-page-wrapper">
    <div class="main-container">
      <h1 class="main-title">想亏都难</h1>
      <p class="subtitle">
        戒掉情绪交易 从这里开始
      </p>

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

      <section class="realtime-nav-panel" aria-label="策略实时净值">
        <div class="realtime-nav-grid">
          <article
            v-for="item in strategyRealtimeNavs"
            :key="item.id"
            class="realtime-nav-card"
            :class="{ 'discipline-cash-card': item.isDisciplineCash }"
            :style="{ '--accent-color': item.accent }"
            role="button"
            tabindex="0"
            @click="openRealtimeChartModal(item)"
            @keydown.enter="openRealtimeChartModal(item)"
          >
            <div class="realtime-card-top">
              <span class="strategy-name">{{ item.name }}</span>
              <span class="realtime-card-time">{{ item.isLoaded ? item.updatedAt : '--' }}</span>
            </div>
            <div class="realtime-card-value">
              <span>当日涨幅</span>
              <strong :class="getRealtimeTone(item.dailyReturn, item.isLoaded)">
                {{ formatRealtimePercent(item.dailyReturn, item.isLoaded) }}
              </strong>
            </div>
            <div class="realtime-card-chart">
              <svg viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden="true">
                <polygon
                  v-if="item.isLoaded"
                  :key="`${item.id}-spark-area-${item.updatedAt}-${item.intraday.length}`"
                  class="realtime-chart-area"
                  :points="sparklineAreaPoints(item)"
                />
                <polyline
                  v-if="item.isLoaded"
                  :key="`${item.id}-spark-glow-${item.updatedAt}-${item.intraday.length}`"
                  class="realtime-chart-line-glow"
                  :points="sparklinePoints(item)"
                  pathLength="1"
                />
                <polyline
                  v-if="item.isLoaded"
                  :key="`${item.id}-spark-line-${item.updatedAt}-${item.intraday.length}`"
                  class="realtime-chart-line"
                  :points="sparklinePoints(item)"
                  pathLength="1"
                />
              </svg>
            </div>
            <div class="realtime-return-grid">
              <span>
                <em>本月</em>
                <strong :class="getRealtimeTone(item.monthReturn, item.isLoaded)">
                  {{ formatRealtimePercent(item.monthReturn, item.isLoaded) }}
                </strong>
              </span>
              <span>
                <em>今年</em>
                <strong :class="getRealtimeTone(item.yearReturn, item.isLoaded)">
                  {{ formatRealtimePercent(item.yearReturn, item.isLoaded) }}
                </strong>
              </span>
            </div>
          </article>
        </div>
      </section>

      <nav class="quick-menu-grid" aria-label="策略菜单">
        <button
          v-for="card in visibleFeatureCards"
          :key="card.id"
          type="button"
          :class="['quick-menu-card', card.cssClass, { 'disabled-card': card.vipOnly && !userStore.isVip }]"
          @click="handleCardClick(card)"
        >
          <span class="quick-menu-head">
            <span class="quick-menu-icon">
              <AllWeatherMenuIcon v-if="card.iconType === 'all-weather'" />
              <StrategyMenuIcon v-else :type="card.iconType" />
            </span>
            <span class="quick-menu-title-wrap">
              <strong>{{ card.title }}</strong>
              <small v-if="card.vipOnly && !userStore.isVip">PRO</small>
            </span>
          </span>
          <span class="quick-menu-desc">{{ card.description }}</span>
        </button>
      </nav>

      <div class="user-actions-footer">
        <span class="membership-status">
          <span class="membership-icon">👑</span>
          <span>{{ membershipStatusText }}</span>
        </span>
        <span class="separator status-separator">|</span>
        <div class="actions-wrapper">
          <div href="#" @click.prevent="openRechargeModal" class="action-link">会员充值</div>
          <span class="separator">|</span>
          <div href="#" @click.prevent="openPasswordModal" class="action-link">修改密码</div>
          <template v-if="userStore.isVip">
            <span class="separator">|</span>
            <div href="#" @click.prevent="openNotificationModal" class="action-link">通知设置</div>
          </template>
          <span class="separator">|</span>
          <div class="wechat-hover-wrapper">
            <button type="button" class="action-link action-button" @click="copyWeChatID">
              加入交流群
            </button>
            <div class="wechat-qr-popover" role="tooltip">
              <img :src="wechatQrCode" alt="开发者微信二维码" class="wechat-qr-image">
              <span class="wechat-qr-title">扫码添加微信</span>
              <span class="wechat-qr-tip">想手动添加的话，轻点“加入交流群”复制微信号：lib-young</span>
            </div>
          </div>
        </div>
      </div>
    </div>

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

    <Transition name="modal-fade">
      <div v-if="selectedRealtimeNav" class="modal-backdrop realtime-chart-backdrop" @click="closeRealtimeChartModal">
        <div
          class="modal-content realtime-chart-modal-content"
          :style="{ '--accent-color': selectedRealtimeNav.accent }"
          @click.stop
        >
          <div class="modal-header realtime-chart-header">
            <div>
              <span class="panel-kicker">分时估值</span>
              <h3>{{ selectedRealtimeNav.name }}</h3>
            </div>
            <button class="modal-close-button" @click="closeRealtimeChartModal">×</button>
          </div>
          <div class="realtime-chart-metrics">
            <div>
              <span>当日涨幅</span>
              <strong :class="getRealtimeTone(selectedRealtimeNav.dailyReturn, selectedRealtimeNav.isLoaded)">
                {{ formatRealtimePercent(selectedRealtimeNav.dailyReturn, selectedRealtimeNav.isLoaded) }}
              </strong>
            </div>
            <div>
              <span>本月涨幅</span>
              <strong :class="getRealtimeTone(selectedRealtimeNav.monthReturn, selectedRealtimeNav.isLoaded)">
                {{ formatRealtimePercent(selectedRealtimeNav.monthReturn, selectedRealtimeNav.isLoaded) }}
              </strong>
            </div>
            <div>
              <span>今年涨幅</span>
              <strong :class="getRealtimeTone(selectedRealtimeNav.yearReturn, selectedRealtimeNav.isLoaded)">
                {{ formatRealtimePercent(selectedRealtimeNav.yearReturn, selectedRealtimeNav.isLoaded) }}
              </strong>
            </div>
            <div>
              <span>更新时间</span>
              <strong>{{ selectedRealtimeNav.isLoaded ? selectedRealtimeNav.updatedAt : '--' }}</strong>
            </div>
          </div>
          <div v-if="selectedRealtimeNav.hasHoldingsAccess === false" class="realtime-allocation-locked">
            会员可查看持仓配置
          </div>
          <div v-else-if="selectedRealtimeNav.allocation?.length" class="realtime-allocation-strip">
            <div
              v-for="asset in selectedRealtimeNav.allocation"
              :key="asset.id"
              class="realtime-allocation-item"
            >
              <span>{{ asset.name }}</span>
              <div class="realtime-allocation-values">
                <strong>{{ formatAllocationPercent(asset.weight) }}</strong>
                <em :class="getRealtimeTone(asset.return ?? 0, asset.return !== null && asset.return !== undefined)">
                  {{ formatRealtimePercent(asset.return ?? 0, asset.return !== null && asset.return !== undefined) }}
                </em>
              </div>
            </div>
          </div>
          <div
            class="realtime-large-chart"
            @mousemove="handleRealtimeChartHover($event, selectedRealtimeNav)"
            @mouseleave="clearRealtimeChartHover"
          >
            <svg viewBox="0 0 640 260" preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" y1="52" x2="640" y2="52" />
              <line x1="0" y1="104" x2="640" y2="104" />
              <line x1="0" y1="156" x2="640" y2="156" />
              <line x1="0" y1="208" x2="640" y2="208" />
              <line class="session-divider" x1="320" y1="0" x2="320" y2="260" />
              <polygon
                v-if="selectedRealtimeNav.isLoaded"
                :key="`${selectedRealtimeNav.id}-large-area-${selectedRealtimeNav.updatedAt}-${selectedRealtimeNav.intraday.length}`"
                class="realtime-chart-area"
                :points="largeChartAreaPoints(selectedRealtimeNav)"
              />
              <polyline
                v-if="selectedRealtimeNav.isLoaded"
                :key="`${selectedRealtimeNav.id}-large-line-${selectedRealtimeNav.updatedAt}-${selectedRealtimeNav.intraday.length}`"
                class="realtime-chart-line"
                :points="largeChartPoints(selectedRealtimeNav)"
                pathLength="1"
              />
            </svg>
            <div class="realtime-chart-axis">
              <span
                v-for="tick in realtimeChartAxis"
                :key="tick.label"
                :style="{ left: tick.left }"
              >
                {{ tick.label }}
              </span>
            </div>
            <div
              v-if="realtimeChartHover"
              class="realtime-chart-tooltip"
              :style="{ left: `${realtimeChartHover.x}px`, top: `${realtimeChartHover.y}px` }"
            >
              <span>{{ realtimeChartHover.time }}</span>
              <strong>{{ formatRealtimeAmount(realtimeChartHover.amount) }}</strong>
              <em :class="getRealtimeTone(realtimeChartHover.change)">
                {{ formatRealtimePercent(realtimeChartHover.change) }}
              </em>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="isWelcomeModalVisible" class="modal-backdrop" @click="closeWelcomeModal">
        <div class="modal-content welcome-modal-content" @click.stop>

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
              我们已为您自动开启了 <strong>1天全功能VIP体验</strong>！<br>
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

    <Transition name="modal-fade">
      <div v-if="isNotificationModalVisible" class="modal-backdrop">
        <div class="modal-content notification-modal-content" @click.stop>
          <div class="modal-header">
            <h3>通知设置</h3>
            <button class="modal-close-button" @click="closeNotificationModal">×</button>
          </div>
          <StrategyLoading
            v-if="notificationLoading"
            mode="panel"
            title="正在读取通知设置"
            description="同步通知渠道与策略订阅"
            icon-type="notification"
          />
          <StrategyLoading
            v-else-if="notificationSaving || notificationTesting"
            mode="panel"
            :title="notificationTesting ? '正在发送测试通知' : '正在保存通知设置'"
            :description="notificationTesting ? '连接通知渠道并等待发送结果' : '更新通知渠道与策略订阅规则'"
            icon-type="notification"
          />
          <form v-else @submit.prevent="saveNotificationSettings">
            <label class="notification-field">
              <span>Bark ID（iOS）</span>
              <input
                v-model.trim="notificationForm.barkKey"
                type="text"
                @input="handleBarkInput"
                placeholder="填写 Bark Key">
            </label>
            <label class="notification-field">
              <span>企业微信 ID（iOS / Android）</span>
              <input
                v-model.trim="notificationForm.wechatWebhookKey"
                type="text"
                @input="handleWechatInput"
                placeholder="填写 Webhook Key">
            </label>
            <p class="notification-channel-tip">
              Bark ID 和企业微信 ID 只能填写一个，企业微信同时支持 iOS 和 Android。
            </p>
            <div class="notification-test-row">
              <button
                class="notification-test-button"
                type="button"
                :disabled="notificationTestDisabled"
                @click="testNotificationSettings">
                {{ notificationTestButtonText }}
              </button>
              <span>发送一条测试消息，不会保存当前设置。</span>
            </div>
            <button class="notification-guide-trigger" type="button" @click="openNotificationGuideModal">
              不知道通知 ID 怎么获取？查看教程
            </button>

            <div class="notification-options">
              <label v-for="option in notificationStrategyOptions" :key="option.key" class="notification-option">
                <input v-model="notificationForm.subscriptions[option.key]" type="checkbox">
                <span class="notification-option-title">{{ option.label }}</span>
                <span class="notification-option-popover">
                  <strong>{{ option.label }}</strong>
                  <span><b>触发：</b>{{ option.trigger }}</span>
                  <span><b>内容：</b>{{ option.content }}</span>
                  <em>示例：{{ option.example }}</em>
                </span>
              </label>
            </div>

            <button class="submit-btn notification-save-button" type="submit" :disabled="notificationSaving">
              {{ notificationSaving ? '保存中...' : '保存设置' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="isNotificationGuideVisible" class="modal-backdrop notification-guide-backdrop" @click="closeNotificationGuideModal">
        <div class="modal-content notification-guide-modal-content" @click.stop>
          <div class="modal-header">
            <h3>通知 ID 获取教程</h3>
            <button class="modal-close-button" @click="closeNotificationGuideModal">×</button>
          </div>

          <div class="notification-guide">
            <div class="notification-guide-item">
              <div class="notification-guide-copy">
                <strong>Bark ID</strong>
                <p>下载 Bark App，打开后复制自己的 Bark Key 即可。</p>
              </div>
              <div class="notification-guide-gallery bark-guide-gallery">
                <button
                  v-for="(image, index) in barkGuideImages"
                  :key="image.src"
                  type="button"
                  @click="openNotificationImageViewer('bark', index)">
                  <img :src="image.src" :alt="image.alt">
                </button>
              </div>
            </div>

            <div class="notification-guide-item">
              <div class="notification-guide-copy">
                <strong>企业微信 ID</strong>
                <p>
                  下载企业微信 App 并完成注册，点击右上角「+」发起群聊并创建新企业，
                  进入群聊后点击右上角三个点，依次进入「消息通知」-「自定义消息推送」，
                  添加并配置机器人后复制 Webhook 里的 key。
                </p>
              </div>
              <div class="notification-guide-gallery wechat-guide-gallery">
                <button
                  v-for="(image, index) in wechatGuideImages"
                  :key="image.src"
                  type="button"
                  @click="openNotificationImageViewer('wechat', index)">
                  <img :src="image.src" :alt="image.alt">
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="isNotificationImageViewerVisible" class="modal-backdrop notification-image-viewer-backdrop" @click="closeNotificationImageViewer">
        <div class="notification-image-viewer" @click.stop>
          <button class="image-viewer-close" type="button" @click="closeNotificationImageViewer">×</button>
          <div class="image-viewer-stage">
            <button
              v-if="currentGuideImageList.length > 1"
              class="image-viewer-nav image-viewer-prev"
              type="button"
              aria-label="上一张"
              @click="showPreviousGuideImage"></button>
            <img :src="currentGuideImage.src" :alt="currentGuideImage.alt">
            <button
              v-if="currentGuideImageList.length > 1"
              class="image-viewer-nav image-viewer-next"
              type="button"
              aria-label="下一张"
              @click="showNextGuideImage"></button>
          </div>
          <div class="image-viewer-caption">
            {{ currentGuideImageIndex + 1 }} / {{ currentGuideImageList.length }} · {{ currentGuideImage.title }}
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="isVipModalVisible" class="modal-backdrop" @click="closeVipModal">
        <div class="modal-content vip-modal-content" @click.stop>
          <div class="modal-header">
            <h3>🚀 解锁 Pro 权限</h3>
            <button class="modal-close-button" @click="closeVipModal">×</button>
          </div>
          <div class="modal-body">
            <p class="vip-modal-desc">
              升级 Pro 会员，解锁全站所有投资策略。
            </p>

            <div class="price-tag">
              体验价 <span class="price-highlight">1元 / 周</span>
            </div>

            <p class="contact-prompt">
              开通会员或咨询，请添加开发者微信：
            </p>

            <div class="wechat-box">
              <span>lib-young</span>
            </div>

            <button class="vip-modal-button" @click="copyWeChatID">
              一键复制微信，立即开通
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="isRechargeModalVisible" class="modal-backdrop" @click="closeRechargeModal">
        <div class="modal-content recharge-modal-content" @click.stop>
          <div class="modal-header">
            <h3>💎 会员充值</h3>
            <button class="modal-close-button" @click="closeRechargeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="recharge-header">
              <p class="recharge-title">
                开通 <span class="plan-name-highlight">{{ selectedPlan.name }}</span>
              </p>
              <p class="recharge-price">
                实付金额: <span class="price-highlight">¥ {{ selectedPlan.price }}</span>
              </p>
            </div>

            <div class="payment-area">

              <StrategyLoading
                v-if="!paymentQrCode"
                mode="panel"
                title="正在生成支付订单"
                description="连接支付服务并创建二维码"
                monogram="PAY"
              />

              <div v-else class="qr-code-container">
                <p class="scan-tip">请使用支付宝扫一扫</p>
                <div class="qr-img-wrapper">
                  <img :src="paymentQrCode" alt="支付二维码" />
                </div>
                <p class="expire-tip">二维码有效期 5 分钟</p>

                <button class="text-btn" @click="paymentQrCode=''; handleGeneratePayment()">
                  刷新二维码
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import app, { auth } from '@/lib/cloudbase'
  import * as echarts from 'echarts'
  import { useUserStore } from '@/store/user'
  import StrategyMenuIcon from '@/components/StrategyMenuIcon.vue'
  import AllWeatherMenuIcon from '@/components/AllWeatherMenuIcon.vue'
  import wechatQrCode from '@/assets/images/wechat-qrcode.jpg'

  const showMessage: any = inject('showMessage')
  const userStore: any = useUserStore()
  const router = useRouter()
  // console.log(userStore.userInfo.admin)

  // --- 接口定义 ---
  interface FeatureCard {
      id: number
      title: string
      description: string
      iconType: string
      cssClass: string
      link: string
      vipOnly?: boolean
      adminOnly?: boolean
  }
  interface StarDataItem {
      day: string
      star: number
      china_index: number
  }
  interface ProcessedDataItem extends StarDataItem {
      temperature: number
  }

  interface StrategyAllocation {
      id: string
      name: string
      weight: number
      targetWeight?: number
      return?: number | null
  }

  interface StrategyRealtimeNav {
      id: string
      name: string
      nav: number
      amount: number
      dailyReturn: number
      monthReturn: number
      yearReturn: number
      updatedAt: string
      accent: string
      trend: number[]
      intraday: number[]
      intradayTimes?: string[]
      allocation?: StrategyAllocation[]
      hasHoldingsAccess?: boolean
      isLoaded?: boolean
      isDisciplineCash?: boolean
  }

  interface RealtimeChartHover {
      x: number
      y: number
      time: string
      amount: number
      change: number
  }

  const strategyRealtimeNavs = ref<StrategyRealtimeNav[]>([
      {
          id: 'all-weather',
          name: '全天候策略',
          nav: 1.0968,
          amount: 0,
          dailyReturn: 0,
          monthReturn: 0,
          yearReturn: 0,
          updatedAt: '--',
          accent: '#00aaff',
          trend: [],
          intraday: [],
          isLoaded: false
      },
      {
          id: 'convertible',
          name: '可转债策略',
          nav: 1.3275,
          amount: 0,
          dailyReturn: 0,
          monthReturn: 0,
          yearReturn: 0,
          updatedAt: '--',
          accent: '#add8e6',
          trend: [],
          intraday: [],
          isLoaded: false
      },
      {
          id: 'rights',
          name: '含权策略',
          nav: 1.1846,
          amount: 0,
          dailyReturn: 0,
          monthReturn: 0,
          yearReturn: 0,
          updatedAt: '--',
          accent: '#ef4444',
          trend: [],
          intraday: [],
          isLoaded: false
      },
      {
          id: 'momentum',
          name: '动量策略',
          nav: 1.5621,
          amount: 0,
          dailyReturn: 0,
          monthReturn: 0,
          yearReturn: 0,
          updatedAt: '--',
          accent: '#ff5722',
          trend: [],
          intraday: [],
          isLoaded: false
      },
      {
          id: 'microcap',
          name: '微盘策略',
          nav: 1.9388,
          amount: 0,
          dailyReturn: 0,
          monthReturn: 0,
          yearReturn: 0,
          updatedAt: '--',
          accent: '#f0e68c',
          trend: [],
          intraday: [],
          isLoaded: false
      }
  ])
  const selectedRealtimeNav = ref<StrategyRealtimeNav | null>(null)
  const realtimeChartHover = ref<RealtimeChartHover | null>(null)
  const realtimeChartTimes = ['09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '14:40', '15:00']
  const realtimeChartAxis = [
      { label: '09:30', left: '0%' },
      { label: '10:30', left: '25%' },
      { label: '11:30', left: 'calc(50% - 18px)' },
      { label: '13:00', left: 'calc(50% + 18px)' },
      { label: '14:00', left: '75%' },
      { label: '15:00', left: '100%' }
  ]

  const TRADING_MINUTES_PER_DAY = 240
  const MORNING_START_MINUTE = 9 * 60 + 30
  const MORNING_END_MINUTE = 11 * 60 + 30
  const AFTERNOON_START_MINUTE = 13 * 60
  const AFTERNOON_END_MINUTE = 15 * 60

  const formatRealtimePercent = (value: number, isLoaded = true) => {
      if (!isLoaded) return '--'
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatRealtimeAmount = (value: number, isLoaded = true) => {
      if (!isLoaded) return '--'
      return value.toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
      })
  }

  const formatAllocationPercent = (value: number) => {
      return `${(value * 100).toFixed(2)}%`
  }

  const getRealtimeTone = (value: number, isLoaded = true) => {
      if (!isLoaded) return 'neutral'
      if (value > 0) return 'positive'
      if (value < 0) return 'negative'
      return 'neutral'
  }

  const openRealtimeChartModal = (item: StrategyRealtimeNav) => {
      selectedRealtimeNav.value = item
      realtimeChartHover.value = null
  }

  const closeRealtimeChartModal = () => {
      selectedRealtimeNav.value = null
      realtimeChartHover.value = null
  }

  const clampNumber = (value: number, min: number, max: number) => {
      return Math.min(Math.max(value, min), Math.max(min, max))
  }

  const parseTradingTime = (time?: string) => {
      if (!time) return null
      const match = time.match(/^(\d{1,2}):(\d{2})/)
      if (!match) return null
      const hours = Number(match[1])
      const minutes = Number(match[2])
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
      return hours * 60 + minutes
  }

  const getTradingProgress = (time?: string, fallbackIndex = 0, fallbackTotal = 1) => {
      const minute = parseTradingTime(time)
      if (minute === null) {
          return fallbackTotal <= 1 ? 0 : fallbackIndex / (fallbackTotal - 1)
      }

      if (minute <= MORNING_END_MINUTE) {
          return clampNumber((minute - MORNING_START_MINUTE) / TRADING_MINUTES_PER_DAY, 0, 0.5)
      }

      if (minute < AFTERNOON_START_MINUTE) return 0.5

      return clampNumber(
          (MORNING_END_MINUTE - MORNING_START_MINUTE + minute - AFTERNOON_START_MINUTE) / TRADING_MINUTES_PER_DAY,
          0.5,
          1
      )
  }

  const getRealtimeChartValues = (item: StrategyRealtimeNav) => {
      if (item.isLoaded) return item.intraday.length >= 2 ? item.intraday : []
      return item.trend
  }

  const getRealtimeChartTimes = (item: StrategyRealtimeNav) => {
      if (item.intraday.length >= 2 && item.intradayTimes?.length === item.intraday.length) return item.intradayTimes
      return undefined
  }

  const findNearestRealtimePoint = (item: StrategyRealtimeNav, ratio: number) => {
      const values = getRealtimeChartValues(item)
      const times = getRealtimeChartTimes(item)
      if (values.length === 0) return null

      let nearestIndex = 0
      let nearestDistance = Number.POSITIVE_INFINITY
      values.forEach((_, index) => {
          const progress = getTradingProgress(times?.[index], index, values.length)
          const distance = Math.abs(progress - ratio)
          if (distance < nearestDistance) {
              nearestIndex = index
              nearestDistance = distance
          }
      })

      return {
          index: nearestIndex,
          value: values[nearestIndex],
          time: times?.[nearestIndex] || realtimeChartTimes[nearestIndex] || item.updatedAt
      }
  }

  const handleRealtimeChartHover = (event: MouseEvent, item: StrategyRealtimeNav) => {
      const point = findNearestRealtimePoint(item, 0)
      if (!point) return

      const chart = event.currentTarget as HTMLElement
      const svg = chart.querySelector('svg')
      const svgRect = svg?.getBoundingClientRect()
      const rect = svgRect || chart.getBoundingClientRect()
      const ratio = clampNumber((event.clientX - rect.left) / rect.width, 0, 1)
      const nearestPoint = findNearestRealtimePoint(item, ratio)
      if (!nearestPoint) return

      const values = getRealtimeChartValues(item)
      const amount = nearestPoint.value
      const baseAmount = values[0] || amount
      const change = baseAmount ? ((amount - baseAmount) / baseAmount) * 100 : 0
      const chartRect = chart.getBoundingClientRect()

      realtimeChartHover.value = {
          x: clampNumber(event.clientX - chartRect.left, 88, chartRect.width - 88),
          y: clampNumber(event.clientY - chartRect.top, 58, chartRect.height - 28),
          time: nearestPoint.time,
          amount,
          change
      }
  }

  const clearRealtimeChartHover = () => {
      realtimeChartHover.value = null
  }

  const buildChartPointList = (values: number[], width: number, height: number, padding: number, times?: string[]) => {
      if (values.length === 0) return []
      const min = Math.min(...values)
      const max = Math.max(...values)
      const range = max - min || 1

      return values.map((value, index) => {
          const x = getTradingProgress(times?.[index], index, values.length) * width
          const y = height - padding - ((value - min) / range) * (height - padding * 2)
          return { x, y }
      })
  }

  const buildChartPoints = (values: number[], width: number, height: number, padding: number, times?: string[]) => {
      return buildChartPointList(values, width, height, padding, times)
          .map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
          .join(' ')
  }

  const buildChartAreaPoints = (chartPoints: Array<{ x: number; y: number }>, height: number, edgeExtension = 0) => {
      if (chartPoints.length === 0) return ''
      const firstPoint = chartPoints[0]
      const lastPoint = chartPoints[chartPoints.length - 1]
      const firstX = Math.max(0, firstPoint.x - edgeExtension)
      const lastX = lastPoint.x + edgeExtension
      const points = [
          `${firstX.toFixed(2)},${height}`,
          `${firstX.toFixed(2)},${firstPoint.y.toFixed(2)}`,
          ...chartPoints.map(point => `${point.x.toFixed(2)},${point.y.toFixed(2)}`),
          `${lastX.toFixed(2)},${lastPoint.y.toFixed(2)}`,
          `${lastX.toFixed(2)},${height}`
      ]

      return points.join(' ')
  }

  const sparklinePoints = (item: StrategyRealtimeNav) => {
      return buildChartPoints(getRealtimeChartValues(item), 120, 44, 4, getRealtimeChartTimes(item))
  }

  const sparklineAreaPoints = (item: StrategyRealtimeNav) => {
      const values = getRealtimeChartValues(item)
      const chartPoints = buildChartPointList(values, 120, 44, 4, getRealtimeChartTimes(item))
      return buildChartAreaPoints(chartPoints, 44, 1.6)
  }

  const largeChartPoints = (item: StrategyRealtimeNav) => {
      return buildChartPoints(getRealtimeChartValues(item), 640, 260, 18, getRealtimeChartTimes(item))
  }

  const largeChartAreaPoints = (item: StrategyRealtimeNav) => {
      const values = getRealtimeChartValues(item)
      const chartPoints = buildChartPointList(values, 640, 260, 18, getRealtimeChartTimes(item))
      return buildChartAreaPoints(chartPoints, 260, 2)
  }

  const allWeatherAssetNameMap: Record<string, string> = {
      freeCashFlow: '自由现金流',
      nasdaq100: '纳斯达克100',
      bond30y: '30年国债',
      gold9999: '黄金'
  }

  const normalizeWeight = (value: unknown) => {
      const number = Number(value)
      return Number.isFinite(number) ? number : 0
  }

  const normalizeDecimalReturn = (value: unknown) => {
      const number = Number(value)
      return Number.isFinite(number) ? number * 100 : null
  }

  const normalizePercentReturn = (value: unknown) => {
      const number = Number(value)
      return Number.isFinite(number) ? number : null
  }

  const getAssetReturnPercent = (asset: any) => {
      const directReturn = normalizeDecimalReturn(asset?.return)
          ?? normalizeDecimalReturn(asset?.dailyReturn)
          ?? normalizeDecimalReturn(asset?.currentReturn)
          ?? normalizePercentReturn(asset?.changePercent)
      if (directReturn !== null) return directReturn

      const currentPrice = Number(asset?.latestMinutePrice ?? asset?.price)
      const prevClose = Number(asset?.prevClose)
      return Number.isFinite(currentPrice) && Number.isFinite(prevClose) && prevClose !== 0
          ? (currentPrice / prevClose - 1) * 100
          : null
  }

  const buildAssetReturnMap = (payload: any) => {
      const map = new Map<string, number>()
      if (payload?.assetReturns && typeof payload.assetReturns === 'object') {
          Object.entries(payload.assetReturns).forEach(([id, value]) => {
              const returnPercent = normalizeDecimalReturn(value)
              if (returnPercent !== null) map.set(id, returnPercent)
          })
      }

      const assets = Array.isArray(payload?.assets) ? payload.assets : []
      assets.forEach((asset: any) => {
          const returnPercent = getAssetReturnPercent(asset)
          if (returnPercent === null) return
          ;[asset.id, asset.code, asset.fullCode, asset.secid].forEach(key => {
              if (key) map.set(String(key), returnPercent)
          })
      })

      return map
  }

  const getHoldingReturnPercent = (holding: any, assetReturnMap: Map<string, number>) => {
      const directReturn = getAssetReturnPercent(holding)
      if (directReturn !== null) return directReturn

      const keys = [holding?.id, holding?.code, holding?.fullCode, holding?.secid]
      for (const key of keys) {
          if (key && assetReturnMap.has(String(key))) return assetReturnMap.get(String(key)) ?? null
      }
      return null
  }

  const getMinuteValueFromTime = (value?: string) => {
      const match = String(value || '').match(/(\d{1,2}):(\d{2})/)
      if (!match) return null

      const hour = Number(match[1])
      const minute = Number(match[2])
      return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null
  }

  const getMinuteTextFromTimestamp = (value?: string) => {
      const match = String(value || '').match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/)
      return match ? `${match[1].padStart(2, '0')}:${match[2]}` : ''
  }

  const normalizeRealtimeDisplayMinute = (value?: string) => {
      const minuteText = getMinuteTextFromTimestamp(value)
      return minuteText === '15:05' ? '15:00' : minuteText
  }

  const fetchAllWeatherRealtime = async (sourcePayload?: any) => {
      try {
          const payload = sourcePayload || (await app.callFunction({
              name: 'getAllWeatherRealtimeInfo',
              data: { action: 'get' }
          })).result?.data
          if (!payload) return

          const allWeatherItem = strategyRealtimeNavs.value.find(item => item.id === 'all-weather')
          if (!allWeatherItem) return

          const hasIntradayPayload = Array.isArray(payload.intraday)
          const rawIntraday = hasIntradayPayload ? payload.intraday : []
          const payloadUpdatedMinute = normalizeRealtimeDisplayMinute(payload.updatedMinute || payload.updatedAt)
          const payloadMinuteValue = getMinuteValueFromTime(payloadUpdatedMinute)
          const intraday =
              payloadMinuteValue === null
                  ? rawIntraday
                  : rawIntraday.filter((point: any) => {
                        const pointMinute = getMinuteValueFromTime(point?.time)
                        return pointMinute !== null && pointMinute <= payloadMinuteValue
                    })
          const intradayAmounts = intraday
              .map((point: any) => Number(point.strategyAmount ?? point.strategyValue ?? point.strategyIndexValue))
              .filter((value: number) => Number.isFinite(value))
          const intradayTimes = intraday
              .map((point: any) => point.time)
              .filter((time: string) => typeof time === 'string' && time.length > 0)
          const canViewHoldings = payload.hasHoldingsAccess !== false
          const weights = canViewHoldings ? payload.weights || payload.assetWeights || {} : {}
          const assetReturnMap = buildAssetReturnMap(payload)
          const allocation = Object.entries(weights).map(([id, weight]) => ({
              id,
              name: allWeatherAssetNameMap[id] || id,
              weight: normalizeWeight(weight),
              targetWeight: normalizeWeight(payload.targetWeights?.[id]),
              return: assetReturnMap.get(id) ?? null
          }))
          const amount = Number(payload.strategyAmount ?? payload.strategyValue ?? payload.strategyIndexValue)
          const dailyReturn = Number(payload.dailyReturn) * 100
          const monthReturn = Number(payload.monthReturn) * 100
          const yearReturn = Number(payload.yearReturn) * 100

          Object.assign(allWeatherItem, {
              amount: Number.isFinite(amount) ? amount : allWeatherItem.amount,
              dailyReturn: Number.isFinite(dailyReturn) ? dailyReturn : allWeatherItem.dailyReturn,
              monthReturn: Number.isFinite(monthReturn) ? monthReturn : allWeatherItem.monthReturn,
              yearReturn: Number.isFinite(yearReturn) ? yearReturn : allWeatherItem.yearReturn,
              updatedAt: payloadUpdatedMinute || allWeatherItem.updatedAt,
              trend: hasIntradayPayload ? intradayAmounts : allWeatherItem.trend,
              intraday: hasIntradayPayload ? intradayAmounts : allWeatherItem.intraday,
              intradayTimes: hasIntradayPayload && intradayTimes.length === intradayAmounts.length ? intradayTimes : [],
              allocation: canViewHoldings ? allocation : [],
              hasHoldingsAccess: canViewHoldings,
              isLoaded: true
          })
      } catch (error) {
          console.warn('全天候实时净值读取失败，继续使用本地展示数据:', error)
      }
  }

  // --- 卡片数据定义 (已恢复原状) ---
  const fetchBondRealtime = async (sourcePayload?: any) => {
      try {
          const payload = sourcePayload || (await app.callFunction({
              name: 'getBondRealtimeInfo',
              data: { action: 'get' }
          })).result?.data
          if (!payload) return

          const bondItem = strategyRealtimeNavs.value.find(item => item.id === 'convertible')
          if (!bondItem) return

          const intraday = Array.isArray(payload.intraday) ? payload.intraday : []
          const intradayAmounts = intraday
              .map((point: any) => Number(point.strategyAmount ?? point.strategyValue ?? point.strategyIndexValue))
              .filter((value: number) => Number.isFinite(value))
          const intradayTimes = intraday
              .map((point: any) => point.time)
              .filter((time: string) => typeof time === 'string' && time.length > 0)
          const canViewHoldings = payload.hasHoldingsAccess !== false
          const holdings = canViewHoldings && Array.isArray(payload.activeHoldings) ? payload.activeHoldings : []
          const assetReturnMap = buildAssetReturnMap(payload)
          const allocation = holdings.map((holding: any, index: number) => ({
              id: holding.code || `bond-${index}`,
              name: holding.name || holding.code || `Bond ${index + 1}`,
              weight: holdings.length ? 1 / holdings.length : 0,
              return: getHoldingReturnPercent(holding, assetReturnMap)
          }))
          const amount = Number(payload.strategyAmount ?? payload.strategyValue ?? payload.strategyIndexValue)
          const dailyReturn = Number(payload.dailyReturn) * 100
          const monthReturn = Number(payload.monthReturn) * 100
          const yearReturn = Number(payload.yearReturn) * 100

          Object.assign(bondItem, {
              amount: Number.isFinite(amount) ? amount : bondItem.amount,
              dailyReturn: Number.isFinite(dailyReturn) ? dailyReturn : bondItem.dailyReturn,
              monthReturn: Number.isFinite(monthReturn) ? monthReturn : bondItem.monthReturn,
              yearReturn: Number.isFinite(yearReturn) ? yearReturn : bondItem.yearReturn,
              updatedAt: normalizeRealtimeDisplayMinute(payload.updatedMinute || payload.updatedAt) || bondItem.updatedAt,
              trend: intradayAmounts.length >= 2 ? intradayAmounts : bondItem.trend,
              intraday: intradayAmounts.length >= 2 ? intradayAmounts : bondItem.intraday,
              intradayTimes: intradayTimes.length === intradayAmounts.length ? intradayTimes : bondItem.intradayTimes,
              allocation: canViewHoldings ? allocation.length ? allocation : bondItem.allocation : [],
              hasHoldingsAccess: canViewHoldings,
              isLoaded: true
          })
      } catch (error) {
          console.warn('Bond realtime data failed, fallback to local preview data:', error)
      }
  }

  const fetchRightsRealtime = async (sourcePayload?: any) => {
      try {
          const payload = sourcePayload || (await app.callFunction({
              name: 'getRightsRealtimeInfo',
              data: { action: 'get' }
          })).result?.data
          if (!payload) return

          const rightsItem = strategyRealtimeNavs.value.find(item => item.id === 'rights')
          if (!rightsItem) return

          const intraday = Array.isArray(payload.intraday) ? payload.intraday : []
          const intradayAmounts = intraday
              .map((point: any) => Number(point.strategyAmount ?? point.strategyValue ?? point.strategyIndexValue))
              .filter((value: number) => Number.isFinite(value))
          const intradayTimes = intraday
              .map((point: any) => point.time)
              .filter((time: string) => typeof time === 'string' && time.length > 0)
          const canViewHoldings = payload.hasHoldingsAccess !== false
          const holdings = canViewHoldings && Array.isArray(payload.activeHoldings) ? payload.activeHoldings : []
          const assetReturnMap = buildAssetReturnMap(payload)
          const allocation = holdings.map((holding: any, index: number) => ({
              id: holding.code || `rights-${index}`,
              name: holding.name || holding.code || `Stock ${index + 1}`,
              weight: Number.isFinite(Number(holding.weight)) ? Number(holding.weight) : holdings.length ? 1 / holdings.length : 0,
              return: getHoldingReturnPercent(holding, assetReturnMap)
          }))
          const amount = Number(payload.strategyAmount ?? payload.strategyValue ?? payload.strategyIndexValue)
          const dailyReturn = Number(payload.dailyReturn) * 100
          const monthReturn = Number(payload.monthReturn) * 100
          const yearReturn = Number(payload.yearReturn) * 100

          Object.assign(rightsItem, {
              amount: Number.isFinite(amount) ? amount : rightsItem.amount,
              dailyReturn: Number.isFinite(dailyReturn) ? dailyReturn : rightsItem.dailyReturn,
              monthReturn: Number.isFinite(monthReturn) ? monthReturn : rightsItem.monthReturn,
              yearReturn: Number.isFinite(yearReturn) ? yearReturn : rightsItem.yearReturn,
              updatedAt: normalizeRealtimeDisplayMinute(payload.updatedMinute || payload.updatedAt) || rightsItem.updatedAt,
              trend: intradayAmounts.length >= 2 ? intradayAmounts : rightsItem.trend,
              intraday: intradayAmounts.length >= 2 ? intradayAmounts : rightsItem.intraday,
              intradayTimes: intradayTimes.length === intradayAmounts.length ? intradayTimes : rightsItem.intradayTimes,
              allocation: canViewHoldings ? allocation.length ? allocation : rightsItem.allocation : [],
              hasHoldingsAccess: canViewHoldings,
              isLoaded: true
          })
      } catch (error) {
          console.warn('Rights realtime data failed, fallback to local preview data:', error)
      }
  }

  const fetchMomentumRealtime = async (sourcePayload?: any) => {
      try {
          const payload = sourcePayload || (await app.callFunction({
              name: 'getMomentumRealtimeInfo',
              data: { action: 'get' }
          })).result?.data
          if (!payload) return

          const momentumItem = strategyRealtimeNavs.value.find(item => item.id === 'momentum')
          if (!momentumItem) return

          const intraday = Array.isArray(payload.intraday) ? payload.intraday : []
          const intradayAmounts = intraday
              .map((point: any) => Number(point.strategyAmount ?? point.strategyValue ?? point.strategyIndexValue))
              .filter((value: number) => Number.isFinite(value))
          const intradayTimes = intraday
              .map((point: any) => point.time)
              .filter((time: string) => typeof time === 'string' && time.length > 0)
          const canViewHoldings = payload.hasHoldingsAccess !== false
          const holdings = canViewHoldings && Array.isArray(payload.activeHoldings) ? payload.activeHoldings : []
          const assetReturnMap = buildAssetReturnMap(payload)
          const allocation = holdings.map((holding: any, index: number) => ({
              id: holding.code || `momentum-${index}`,
              name: holding.name || holding.code || `ETF ${index + 1}`,
              weight: Number.isFinite(Number(holding.weight)) ? Number(holding.weight) : holdings.length ? 1 / holdings.length : 0,
              return: getHoldingReturnPercent(holding, assetReturnMap)
          }))
          const amount = Number(payload.strategyAmount ?? payload.strategyValue ?? payload.strategyIndexValue)
          const dailyReturn = Number(payload.dailyReturn) * 100
          const monthReturn = Number(payload.monthReturn) * 100
          const yearReturn = Number(payload.yearReturn) * 100

          Object.assign(momentumItem, {
              amount: Number.isFinite(amount) ? amount : momentumItem.amount,
              dailyReturn: Number.isFinite(dailyReturn) ? dailyReturn : momentumItem.dailyReturn,
              monthReturn: Number.isFinite(monthReturn) ? monthReturn : momentumItem.monthReturn,
              yearReturn: Number.isFinite(yearReturn) ? yearReturn : momentumItem.yearReturn,
              updatedAt: normalizeRealtimeDisplayMinute(payload.updatedMinute || payload.updatedAt) || momentumItem.updatedAt,
              trend: intradayAmounts.length >= 2 ? intradayAmounts : momentumItem.trend,
              intraday: intradayAmounts.length >= 2 ? intradayAmounts : momentumItem.intraday,
              intradayTimes: intradayTimes.length === intradayAmounts.length ? intradayTimes : momentumItem.intradayTimes,
              allocation: canViewHoldings ? allocation.length ? allocation : momentumItem.allocation : [],
              hasHoldingsAccess: canViewHoldings,
              isLoaded: true
          })
      } catch (error) {
          console.warn('Momentum realtime data failed, fallback to local preview data:', error)
      }
  }

  const fetchMicroCapRealtime = async (sourcePayload?: any) => {
      try {
          const payload = sourcePayload || (await app.callFunction({
              name: 'getMicroCapRealtimeInfo',
              data: { action: 'get' }
          })).result?.data
          if (!payload) return

          const microCapItem = strategyRealtimeNavs.value.find(item => item.id === 'microcap')
          if (!microCapItem) return

          const intraday = Array.isArray(payload.intraday) ? payload.intraday : []
          const intradayAmounts = intraday
              .map((point: any) => Number(point.strategyAmount ?? point.strategyValue ?? point.strategyIndexValue))
              .filter((value: number) => Number.isFinite(value))
          const intradayTimes = intraday
              .map((point: any) => point.time)
              .filter((time: string) => typeof time === 'string' && time.length > 0)
          const canViewHoldings = payload.hasHoldingsAccess !== false
          const showDisciplineCash = payload.disciplineCash === true
          const holdings = canViewHoldings && Array.isArray(payload.activeHoldings) ? payload.activeHoldings : []
          const assetReturnMap = buildAssetReturnMap(payload)
          const allocation = !canViewHoldings && !showDisciplineCash
              ? []
              : showDisciplineCash
              ? [{ id: 'cash', name: '纪律空仓', weight: 1, return: 0 }]
              : holdings.slice(0, 10).map((holding: any, index: number) => ({
                  id: holding.code || `microcap-${index}`,
                  name: holding.name || holding.code || `Stock ${index + 1}`,
                  weight: Number.isFinite(Number(holding.weight)) ? Number(holding.weight) : holdings.length ? 1 / holdings.length : 0,
                  return: getHoldingReturnPercent(holding, assetReturnMap)
              }))
          const amount = Number(payload.strategyAmount ?? payload.strategyValue ?? payload.strategyIndexValue)
          const dailyReturn = Number(payload.dailyReturn) * 100
          const monthReturn = Number(payload.monthReturn) * 100
          const yearReturn = Number(payload.yearReturn) * 100

          Object.assign(microCapItem, {
              amount: Number.isFinite(amount) ? amount : microCapItem.amount,
              dailyReturn: Number.isFinite(dailyReturn) ? dailyReturn : microCapItem.dailyReturn,
              monthReturn: Number.isFinite(monthReturn) ? monthReturn : microCapItem.monthReturn,
              yearReturn: Number.isFinite(yearReturn) ? yearReturn : microCapItem.yearReturn,
              updatedAt: showDisciplineCash
                  ? '纪律空仓'
                  : normalizeRealtimeDisplayMinute(payload.updatedMinute || payload.updatedAt) || microCapItem.updatedAt,
              trend: showDisciplineCash ? [] : intradayAmounts.length >= 2 ? intradayAmounts : microCapItem.trend,
              intraday: showDisciplineCash ? [] : intradayAmounts.length >= 2 ? intradayAmounts : microCapItem.intraday,
              intradayTimes: showDisciplineCash ? [] : intradayTimes.length === intradayAmounts.length ? intradayTimes : microCapItem.intradayTimes,
              allocation: showDisciplineCash || canViewHoldings ? allocation.length ? allocation : microCapItem.allocation : [],
              hasHoldingsAccess: showDisciplineCash || canViewHoldings,
              isDisciplineCash: showDisciplineCash,
              isLoaded: true
          })
      } catch (error) {
          console.warn('Micro-cap realtime data failed, fallback to local preview data:', error)
      }
  }

  const allFeatureCards = ref<FeatureCard[]>([
      {
          id: 1,
          title: '全天候策略',
          description: '多元化资产配置，追求全环境稳定回报。',
          iconType: 'all-weather',
          cssClass: 'all-weather',
          link: '/all-weather'
      },
      // {
      //     id: 2,
      //     title: '长钱策略',
      //     description: '关注长期价值投资，忽略短期市场波动。',
      //     icon: '⌛',
      //     cssClass: 'long-term',
      //     link: '/long-term',
      //     vipOnly: true
      // },
      {
          id: 3,
          title: '可转债策略',
          description: '基于多因子轮动模型，每日动态捕捉交易机会。',
          iconType: 'convertible-bond',
          cssClass: 'convertible-bond',
          link: '/bonds'
      },
      {
          id: 12,
          title: '含权策略',
          description: '按动态含权量轮动，捕捉正股配债价值。',
          iconType: 'rights',
          cssClass: 'rights-strategy',
          link: '/rights-strategy'
      },

      {
          id: 9,
          title: '动量策略',
          description: '依据动量模型，轮动持有最强资产，进攻性强。',
          iconType: 'momentum',
          cssClass: 'momentum-strategy',
          link: '/momentum'
      },
      {
          id: 4,
          title: '微盘股策略',
          description: '周度跟踪微盘组合，纪律化调仓获取贝塔收益。',
          iconType: 'micro-cap',
          cssClass: 'micro-cap',
          link: '/micro-cap'
      },
      // {
      //     id: 99, // 使用一个特殊的ID
      //     title: '微盘股调仓',
      //     description: '监控持仓明细、市值分布及每日资金再平衡。',
      //     icon: '⚖️',
      //     cssClass: 'micro-cap-admin', // 对应下面的CSS类名
      //     link: '/micro-cap-adjustment', // 对应新页面的路由
      //     adminOnly: true // 标记为仅管理员
      // },
      {
          id: 10,
          title: '组合实验室',
          description: '自定义策略配比，回测组合相关性与风险收益特征。',
          iconType: 'portfolio-lab',
          cssClass: 'portfolio-lab', // 对应下面的 CSS
          link: '/portfolio-analysis' // 记得在 router 中注册这个路由
      },
      {
          id: 11,
          title: 'LOF溢价监控',
          description: '聚合场内价格、净值估算与申购状态，观察折溢价机会。',
          iconType: 'lof-monitor',
          cssClass: 'lof-monitor',
          link: '/lof'
      },
      {
          id: 3,
          title: '投资小工具',
          description: '提供再平衡计算器等，辅助科学决策。',
          iconType: 'tools',
          cssClass: 'handy-tools',
          link: '/tools'
      },
      {
          id: 7,
          title: '财富版图',
          description: '将您的资产目标具象化，一步步点亮全国版图。',
          iconType: 'wealth-map',
          cssClass: 'wealth-map',
          link: '/wealth-map'
      },
      {
          id: 14,
          title: '关于本站',
          description: '了解建站初衷、开发者、会员服务与联系方式。',
          iconType: 'about',
          cssClass: 'about-us',
          link: '/about'
      }
  ])

  const visibleFeatureCards = computed(() => {
      return allFeatureCards.value.filter(card => {
          return !card.adminOnly || (userStore.userInfo && userStore.userInfo.admin)
      })
  })

  // --- 会员状态 ---
  const membershipExpiryDate = ref('加载中...')
  const isVipModalVisible = ref(false)
  const openVipModal = () => {
      isVipModalVisible.value = true
  }
  const closeVipModal = () => {
      isVipModalVisible.value = false
  }

  // 创建一个跳转到“关于”页面的函数，给按钮使用
  const copyWeChatID = async () => {
      const wechatID = 'lib-young'
      try {
          // 使用 navigator.clipboard API 写入剪贴板
          await navigator.clipboard.writeText(wechatID)
          // 成功后给出提示
          showMessage('微信号已复制到剪贴板！', 'success')
          // 复制成功后可以自动关闭弹窗，体验更好
          closeVipModal()
      } catch (err) {
          // 如果失败（例如在非安全环境下），给出错误提示
          console.error('复制失败:', err)
          showMessage('复制失败，请手动复制。', 'error')
      }
  }

  // --- 市场温度计与数据处理 ---
  const rawHistoryData = ref<StarDataItem[]>([])
  const processedMarketData = ref<ProcessedDataItem[]>([])
  let minStar = ref(1.8)
  let maxStar = ref(5.98)

  const latestStar = ref(5.98)
  const latestTemperature = ref(0)
  const latestDate = ref('加载中...')
  let pollingInterval: number | null = null

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

  const applyMarketData = (marketData: any) => {
      const { today, history } = marketData || {}

      if (today?.result) {
          latestStar.value = today.result.star
          latestDate.value = today.result.update_time
      }

      if (history?.result) {
          rawHistoryData.value = history.result
          processDataWithLinearMapping()
      }
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
                  applyMarketData(res.result.data)
              } else {
                  // 处理云函数本身返回错误的情况
                  console.log(router)
                  router.push({ name: 'login' })
                  console.error('getMarketData 函数执行失败:', res.result?.error)
                  latestDate.value = '数据加载失败'
              }
          })
          .catch((err: any) => {
              console.log(router)
              router.push({ name: 'login' })
              console.error('调用 getMarketData 云函数失败:', err)
              latestDate.value = '数据加载失败'
          })
  }

  const fetchHomeDashboardData = async () => {
      try {
          const response: any = await app.callFunction({
              name: 'getHomeDashboardData',
              data: {}
          })
          const payload = response.result?.data
          if (!response.result?.success || !payload) {
              throw new Error(response.result?.message || 'getHomeDashboardData returned no data')
          }

          applyMarketData(payload.market)

          const realtime = payload.realtime || {}
          await Promise.all([
              fetchAllWeatherRealtime(realtime.allWeather),
              fetchBondRealtime(realtime.bond),
              fetchRightsRealtime(realtime.rights),
              fetchMomentumRealtime(realtime.momentum),
              fetchMicroCapRealtime(realtime.microCap)
          ])
      } catch (error) {
          console.warn('getHomeDashboardData failed, fallback to split requests:', error)
          await fetchMarketData()
          await Promise.all([
              fetchAllWeatherRealtime(),
              fetchBondRealtime(),
              fetchRightsRealtime(),
              fetchMomentumRealtime(),
              fetchMicroCapRealtime()
          ])
      }
  }

  const isWelcomeModalVisible = ref(false)
  const closeWelcomeModal = () => {
      isWelcomeModalVisible.value = false
  }

  const handleCardClick = (card: FeatureCard) => {
      if (card.vipOnly && !userStore.isVip) {
          // 不再使用 showMessage，而是打开我们的新弹窗
          openRechargeModal()
      } else {
          router.push(card.link)
      }
  }

  // -----------------------------------------------------
  // ======== 新增逻辑：会员充值功能 ========
  // -----------------------------------------------------
  const isRechargeModalVisible = ref(false)
  const isGeneratingQr = ref(false)
  const paymentQrCode = ref('')
  let pollTimer: any | null = null
  const currentOutTradeNo = ref('')

  // 定义套餐数据
  const rechargePlans = [
      {
          id: 'year',
          name: '实战年卡',
          price: 365,
          days: 365,
          isRecommend: false
      }
  ]

  // 默认选中年卡
  const selectedPlan = ref(rechargePlans[0])

  const selectPlan = (plan: any) => {
      if (paymentQrCode.value) {
          // 如果已经生成了二维码，切换套餐需要重置
          paymentQrCode.value = ''
          stopPolling()
      }
      selectedPlan.value = plan
  }
  const openRechargeModal = () => {
      isRechargeModalVisible.value = true

      // 确保选中第一个（也是唯一的）套餐
      selectedPlan.value = rechargePlans[0]

      // 清空旧二维码
      paymentQrCode.value = ''

      // 【核心修改】直接自动触发支付生成逻辑！
      // 建议加一个小延迟，防止弹窗还没渲染完就请求，体验更好
      setTimeout(() => {
          handleGeneratePayment()
      }, 300)
  }

  const closeRechargeModal = () => {
      stopPolling()
      isRechargeModalVisible.value = false
  }

  const stopPolling = () => {
      if (pollTimer) {
          clearInterval(pollTimer)
          pollTimer = null
      }
  }

  const resetRecharge = () => {
      stopPolling()
      paymentQrCode.value = ''
      isGeneratingQr.value = false
  }

  // 修改后的支付发起函数
  const handleGeneratePayment = async () => {
      if (isGeneratingQr.value || paymentQrCode.value) return

      // 1. 用户ID检查
      const realUserId = userStore.userInfo?._id || userStore.userInfo?.id
      if (!realUserId) {
          showMessage('无法获取用户ID，请尝试重新登录', 'error')
          return
      }

      isGeneratingQr.value = true

      try {
          showMessage('正在创建支付宝订单...', 'info')

          // 2. 发送选中的套餐数据（天数 days 和 金额 totalAmount）
          const requestData = {
              planId: selectedPlan.value.id, // 例如 'year', 'month'
              userId: realUserId
          }

          const res = await app.callFunction({
              name: 'createAlipayOrder',
              data: requestData
          })

          const result = res.result

          if (result && result.success) {
              const { qrCodeBase64, outTradeNo } = result.data

              paymentQrCode.value = qrCodeBase64
              currentOutTradeNo.value = outTradeNo

              showMessage('订单创建成功，请扫码支付', 'success')

              stopPolling()
              pollTimer = setInterval(() => {
                  checkPaymentStatus()
              }, 3000)
          } else {
              throw new Error(result?.message || '生成订单失败')
          }
      } catch (error: any) {
          console.error('支付下单失败:', error)
          showMessage(error.message || '支付服务暂不可用，请稍后再试', 'error')
      } finally {
          isGeneratingQr.value = false
      }
  }
  // -----------------------------------------------------
  // 新增：检查支付状态函数
  const checkPaymentStatus = async () => {
      if (!currentOutTradeNo.value) return

      try {
          // 调用刚才新建的 checkAlipayStatus 云函数
          const res = await app.callFunction({
              name: 'checkAlipayStatus',
              data: { outTradeNo: currentOutTradeNo.value }
          })

          const result = res.result
          if (result && result.success) {
              if (result.status === 'SUCCESS') {
                  // --- 支付成功逻辑 ---
                  stopPolling() // 1. 停止轮询
                  showMessage('🎉 支付成功！会员已到账', 'success')

                  // 2. 关闭充值弹窗
                  closeRechargeModal()

                  // 3. 刷新用户信息 (非常重要，否则看不到会员状态变化)
                  // 假设 userStore 有一个 getUerInfo 或 refresh 方法
                  // await userStore.getUserInfo()
                  // 如果没有专门的方法，可以重新加载页面或者手动更新 store 状态
                  await userStore.refreshUserInfo()
                  // setTimeout(() => {
                  //     window.location.reload() // 简单粗暴刷新页面，或者调用获取用户信息的接口
                  // }, 1500)
              }
              // 如果是 PENDING，什么都不做，继续等下一次轮询
          }
      } catch (err) {
          console.error('查询订单状态失败', err)
          // 查询失败不一定要停止轮询，可能是网络波动
      }
  }

  // --- 🎹 键盘彩蛋逻辑 (Secret Codes) ---
  let keyBuffer = '' // 用于存储最近按下的键

  // 定义秘籍映射表：代码 -> 路由路径
  const secretCodes: Record<string, string> = {
      cb: '/cb', // cb = Convertible Bond (惊蛰)
      mc: '/mc', // mc = Micro Cap (微盘)
      zz: '/admin'
  }

  const handleSecretKeydown = (e: KeyboardEvent) => {
      // 1. 安全守卫：如果不是管理员，或者没有用户信息，直接忽略
      if (!userStore.userInfo?.admin) return

      // 2. 防误触：如果用户正在输入框(Input/Textarea)里打字，不触发秘籍
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      // 3. 记录按键：只记录单个字母按键，并转为小写
      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
          keyBuffer += e.key.toLowerCase()
          console.log(keyBuffer)
          // 保持缓存区短小精悍，只保留最后 5 个字符即可
          // (因为你的指令只有2位，保留5位足够容错)
          if (keyBuffer.length > 3) {
              keyBuffer = keyBuffer.slice(-3)
          }

          // 4. 匹配检测
          for (const [code, path] of Object.entries(secretCodes)) {
              if (keyBuffer.endsWith(code)) {
                  // 匹配成功！
                  showMessage(`🚀 识别指令 [${code}]，正在跳转...`, 'success')
                  router.push(path)

                  // 清空缓存，防止连续误触发 (比如 cbcb)
                  keyBuffer = ''
                  break
              }
          }
      }
  }

  onMounted(async () => {
      // 现在我们并行获取会员信息和所有的市场数据
      await fetchHomeDashboardData()

      // --- 您 onMounted 中的其余逻辑保持不变 ---
      if (window.history.state && window.history.state.newUser) {
          setTimeout(() => {
              isWelcomeModalVisible.value = true
          }, 500)

          const newState = { ...window.history.state, newUser: false }
          window.history.replaceState(newState, '')
      }
      // 注册键盘监听
      window.addEventListener('keydown', handleSecretKeydown)
  })
  onUnmounted(() => {
      if (pollingInterval) {
          clearInterval(pollingInterval)
      }
      if (myChart) {
          myChart.dispose()
      }
      stopPolling()

      // 移除键盘监听
      window.removeEventListener('keydown', handleSecretKeydown)
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

  // 【新增】创建 computed 属性来动态显示会员状态
  const membershipStatusText = computed(() => {
      // 在用户信息加载完成前，显示加载状态
      if (!userStore.userInfo) {
          return '会员状态加载中...'
      }

      // 如果用户是 VIP
      if (userStore.isVip) {
          // 返回格式化的到期时间
          return `会员有效期至: ${formatTimestamp(userStore.userInfo.vipExpiry)}`
      } else {
          // 如果用户不是 VIP，返回鼓励升级的文案
          return '升级会员，解锁全部特权'
      }
  })

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

  const isNotificationModalVisible = ref(false)
  const notificationLoading = ref(false)
  const notificationSaving = ref(false)
  const notificationTesting = ref(false)
  const isNotificationGuideVisible = ref(false)
  const isNotificationImageViewerVisible = ref(false)
  const currentGuideImageGroup = ref<'wechat' | 'bark'>('wechat')
  const currentGuideImageIndex = ref(0)
  const wechatGuideImages = [
      {
          src: '/static/notification-guide/wechat-guide-1.png',
          alt: '企业微信点击发起群聊步骤图',
          title: '企业微信：点击发起群聊'
      },
      {
          src: '/static/notification-guide/wechat-guide-2.png',
          alt: '企业微信选择群成员并完成群聊步骤图',
          title: '企业微信：选择成员并完成群聊'
      },
      {
          src: '/static/notification-guide/wechat-guide-3.png',
          alt: '企业微信点击群聊右上角更多步骤图',
          title: '企业微信：点击群聊右上角更多'
      },
      {
          src: '/static/notification-guide/wechat-guide-4.png',
          alt: '企业微信进入消息推送步骤图',
          title: '企业微信：进入消息推送'
      },
      {
          src: '/static/notification-guide/wechat-guide-5.png',
          alt: '企业微信点击 Webhook 地址步骤图',
          title: '企业微信：点击 Webhook 地址'
      },
      {
          src: '/static/notification-guide/wechat-guide-6.png',
          alt: '企业微信复制 Webhook key 步骤图',
          title: '企业微信：复制 key 后面的内容'
      }
  ]
  const barkGuideImages = [
      {
          src: '/static/notification-guide/bark-id-guide.png',
          alt: 'Bark 复制 key 步骤图',
          title: 'Bark：复制自己的 Bark Key'
      }
  ]
  const currentGuideImageList = computed(() =>
      currentGuideImageGroup.value === 'wechat' ? wechatGuideImages : barkGuideImages
  )
  const currentGuideImage = computed(() => currentGuideImageList.value[currentGuideImageIndex.value])
  const notificationStrategyOptions = [
      {
          key: 'convertible',
          label: '可转债策略',
          trigger: '交易日 14:40 自动计算排名后通知；不调仓也会通知。',
          content: '有调仓时包含卖出、买入以及当前持仓；无调仓时提示继续持有并展示当前持仓。',
          example: '今日无调仓操作，继续持有。当前持仓：XX转债(123456)、YY转债(113000)。'
      },
      {
          key: 'rights_strategy',
          label: '含权策略',
          trigger: '交易日 14:40 刷新含权策略；只有发生调仓时通知，无调仓不通知。',
          content: '交易日、卖出清单、买入清单，以及对应含权值。',
          example: '交易日：2026-06-15；卖出：A公司(600000) 含权值:12.34；买入：B公司(000001) 含权值:15.20。'
      },
      {
          key: 'momentum',
          label: '动量策略',
          trigger: '交易日 14:50 触发调仓；当动量标的切换时通知。',
          content: '卖出标的、买入标的、买入代码、近 20 日涨幅和调仓日期。',
          example: '卖出：中证1000价值ETF华夏；买入：纳指100ETF招商(159659)；近20日涨幅：6.23%。'
      },
      {
          key: 'micro_cap',
          label: '微盘股策略',
          trigger: '微盘股数据更新完成后通知。',
          content: '提醒数据已更新，并附带更新时间。',
          example: '微盘股数据已更新，请及时查看最新持仓。更新时间：2026-06-15 09:30:08。'
        },
      {
          key: 'lof_premium',
          label: 'LOF 溢价',
          trigger: '交易日 14:30，从实时 LOF 刷新结果里筛选符合条件的基金。',
          content: '名称、代码、限购金额、T-2/T-1/实时溢价率；条件为可申购、限购金额小于 1 万元、实时溢价率大于 0。',
          example: '华宝油气LOF(162411) 限购金额：5,000元；T-2:1.20% T-1:0.85% 实时:1.56%。'
      }
  ] as const
  const notificationForm = reactive({
      barkKey: '',
      wechatWebhookKey: '',
      subscriptions: {
          momentum: false,
          convertible: false,
          micro_cap: false,
          rights_strategy: false,
          lof_premium: false
      }
  })
  const notificationTestDisabled = computed(
      () =>
          notificationTesting.value ||
          notificationSaving.value ||
          (!notificationForm.barkKey && !notificationForm.wechatWebhookKey)
  )
  const notificationTestButtonText = computed(() => {
      if (notificationTesting.value) return '测试发送中...'
      if (notificationForm.barkKey) return '测试 Bark 通知'
      if (notificationForm.wechatWebhookKey) return '测试企业微信通知'
      return '发送测试通知'
  })

  const openNotificationModal = async () => {
      if (!userStore.isVip) return

      isNotificationModalVisible.value = true
      notificationLoading.value = true
      try {
          const response: any = await app.callFunction({
              name: 'notificationSettings',
              data: { action: 'get' }
          })
          if (!response.result?.success) {
              throw new Error(response.result?.message || '通知设置加载失败')
          }
          applyNotificationSettings(response.result.settings)
      } catch (error: any) {
          console.error('通知设置加载失败:', error)
          showMessage(error.message || '通知设置加载失败', 'error')
          closeNotificationModal()
      } finally {
          notificationLoading.value = false
      }
  }

  const closeNotificationModal = () => {
      isNotificationModalVisible.value = false
  }

  const openNotificationGuideModal = () => {
      isNotificationGuideVisible.value = true
  }

  const closeNotificationGuideModal = () => {
      isNotificationGuideVisible.value = false
  }

  const openNotificationImageViewer = (group: 'wechat' | 'bark', index: number) => {
      currentGuideImageGroup.value = group
      currentGuideImageIndex.value = index
      isNotificationImageViewerVisible.value = true
  }

  const closeNotificationImageViewer = () => {
      isNotificationImageViewerVisible.value = false
  }

  const showPreviousGuideImage = () => {
      currentGuideImageIndex.value =
          (currentGuideImageIndex.value - 1 + currentGuideImageList.value.length) %
          currentGuideImageList.value.length
  }

  const showNextGuideImage = () => {
      currentGuideImageIndex.value = (currentGuideImageIndex.value + 1) % currentGuideImageList.value.length
  }

  const handleBarkInput = (event: Event) => {
      const value = (event.target as HTMLInputElement).value.trim()
      notificationForm.barkKey = value
      if (value) notificationForm.wechatWebhookKey = ''
  }

  const handleWechatInput = (event: Event) => {
      const value = (event.target as HTMLInputElement).value.trim()
      notificationForm.wechatWebhookKey = value
      if (value) notificationForm.barkKey = ''
  }

  const saveNotificationSettings = async () => {
      if (!userStore.isVip) return
      if (notificationForm.barkKey && notificationForm.wechatWebhookKey) {
          showMessage('Bark ID 和企业微信 ID 只能填写一个', 'error')
          return
      }

      notificationSaving.value = true
      try {
          const response: any = await app.callFunction({
              name: 'notificationSettings',
              data: {
                  action: 'update',
                  settings: {
                      barkKey: notificationForm.barkKey,
                      wechatWebhookKey: notificationForm.wechatWebhookKey,
                      subscriptions: { ...notificationForm.subscriptions }
                  }
              }
          })
          if (!response.result?.success) {
              throw new Error(response.result?.message || '通知设置保存失败')
          }
          applyNotificationSettings(response.result.settings)
          showMessage('通知设置已保存', 'success')
          closeNotificationModal()
      } catch (error: any) {
          console.error('通知设置保存失败:', error)
          showMessage(error.message || '通知设置保存失败', 'error')
      } finally {
          notificationSaving.value = false
      }
  }

  const testNotificationSettings = async () => {
      if (!userStore.isVip) return
      if (notificationForm.barkKey && notificationForm.wechatWebhookKey) {
          showMessage('Bark ID 和企业微信 ID 只能填写一个', 'error')
          return
      }
      if (!notificationForm.barkKey && !notificationForm.wechatWebhookKey) {
          showMessage('请先填写 Bark ID 或企业微信 ID', 'error')
          return
      }

      notificationTesting.value = true
      try {
          const response: any = await app.callFunction({
              name: 'notificationSettings',
              data: {
                  action: 'test',
                  settings: {
                      barkKey: notificationForm.barkKey,
                      wechatWebhookKey: notificationForm.wechatWebhookKey,
                      subscriptions: { ...notificationForm.subscriptions }
                  }
              }
          })
          if (!response.result?.success) {
              throw new Error(response.result?.message || '测试通知发送失败')
          }
          showMessage('测试通知已发送，请检查手机或企业微信群', 'success')
      } catch (error: any) {
          console.error('测试通知发送失败:', error)
          showMessage(error.message || '测试通知发送失败', 'error')
      } finally {
          notificationTesting.value = false
      }
  }

  const applyNotificationSettings = (settings: any = {}) => {
      notificationForm.barkKey = settings.barkKey || ''
      notificationForm.wechatWebhookKey = settings.wechatWebhookKey || ''
      notificationForm.subscriptions.momentum = settings.subscriptions?.momentum === true
      notificationForm.subscriptions.convertible = settings.subscriptions?.convertible === true
      notificationForm.subscriptions.micro_cap = settings.subscriptions?.micro_cap === true
      notificationForm.subscriptions.rights_strategy = settings.subscriptions?.rights_strategy === true
      notificationForm.subscriptions.lof_premium = settings.subscriptions?.lof_premium === true
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
      -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
      -webkit-text-fill-color: #fff !important;
      caret-color: #fff;
      transition: background-color 5000s ease-in-out 0s;
  }

  /* CSS样式部分 (恢复为您的原始样式) */
  .home-page-wrapper {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      overflow-x: hidden;
      overflow-y: auto;
      padding: 1rem 1.25rem;
      min-height: 100vh;
      font-family: 'Noto Sans SC', sans-serif;
      color: #fff;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
      background-color: #121212;
      box-sizing: border-box;
  }

  .main-container {
      padding-bottom: 1rem;
      width: 100%;
      max-width: 1200px;
      text-align: center;

      /* 给底部留出空间 */
  }

  .main-title {
      margin-bottom: 0.55rem;
      font-size: 1.9rem;
      opacity: 0;
      text-shadow: 0 0 15px rgb(255 255 255 / 10%);
      font-weight: 700;

      /* 应用加载动画 */
      animation: fadeInUp 0.5s ease-out forwards;
  }

  .subtitle {
      margin-right: auto;
      margin-bottom: 1.45rem;
      margin-left: auto;
      max-width: 550px;
      font-size: 0.92rem;
      color: #b0c4de;
      opacity: 0;

      /* 应用加载动画, 延迟0.2秒 */
      animation: fadeInUp 0.5s ease-out 0.2s forwards;
  }

  .market-thermometer-container {
      padding: 0.8rem 1rem;
      margin: 0 auto 1.28rem;
      text-align: left;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 15px;
      opacity: 0;
      transition: transform 0.3s ease, border-color 0.3s ease;
      backdrop-filter: blur(10px);

      /* 应用加载动画, 延迟0.4秒 */
      animation: fadeInUp 0.5s ease-out 0.4s forwards;
  }

  .market-thermometer-container.clickable {
      cursor: pointer;
  }

  .market-thermometer-container.clickable:hover {
      transform: scale(1.02);
      border-color: #0af;
  }

  .thermometer-header {
      display: flex;
      justify-content: center;
      align-items: baseline;
      margin-bottom: 0.8rem;
  }

  .section-title {
      margin: 0;
      font-size: 1rem;
      color: rgb(255 255 255 / 90%);
      font-weight: bold;
  }

  .thermometer-desc {
      margin: 0 0 0.85rem;
      font-size: 0.75rem;
      text-align: center;
      color: #b0c4de;
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
      position: relative;
      height: 10px;
      background: linear-gradient(to right, #28a745, #ffc107 50%, #ff4081);
      border-radius: 5px;
      flex-grow: 1;
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
      position: absolute;
      top: -22px;
      width: 14px;
      height: 14px;
      background-color: #fff;
      border: 2px solid #121212;
      border-radius: 50%;
  }

  .indicator-line {
      position: absolute;
      top: -14px;
      width: 2px;
      height: 28px;
      background-color: #fff;
  }

  .realtime-nav-panel {
      padding: 0;
      margin: 0 auto 1.05rem;
      text-align: left;
      opacity: 0;
      animation: fadeInUp 0.5s ease-out 0.5s forwards;
  }

  .panel-kicker {
      display: inline-flex;
      align-items: center;
      padding: 0 0.55rem;
      height: 22px;
      font-size: 0.72rem;
      color: #bfdbfe;
      background: rgb(15 23 42 / 36%);
      border: 1px solid rgb(255 255 255 / 14%);
      border-radius: 999px;
      line-height: 1;
  }

  .realtime-card-value span {
      display: block;
      font-size: 0.72rem;
      color: #94a3b8;
      line-height: 1.3;
  }

  .realtime-nav-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(205px, 1fr));
      gap: 1.05rem 0.9rem;
  }

  .realtime-nav-card {
      position: relative;
      overflow: hidden;
      padding: 0.95rem;
      min-width: 0;
      min-height: 170px;
      background:
          linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 15%, transparent), transparent 58%),
          rgb(15 23 42 / 46%);
      border: 1px solid color-mix(in srgb, var(--accent-color) 28%, rgb(255 255 255 / 10%));
      border-radius: 8px;
      transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
      cursor: pointer;
  }

  .realtime-nav-card:focus-visible {
      outline: 2px solid var(--accent-color);
      outline-offset: 3px;
  }

  .realtime-nav-card:hover {
      background:
          linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 21%, transparent), transparent 60%),
          rgb(30 41 59 / 62%);
      border-color: var(--accent-color);
      transform: translateY(-2px);
  }

  .realtime-card-top {
      display: flex;
      justify-content: space-between;
      gap: 0.6rem;
      align-items: center;
      margin-bottom: 0.75rem;
  }

  .strategy-name {
      min-width: 0;
      font-size: 1rem;
      color: #fff;
      font-weight: 700;
      line-height: 1.25;
  }

  .realtime-card-time {
      font-size: 0.72rem;
      color: #94a3b8;
      flex: 0 0 auto;
      line-height: 1;
  }

  .realtime-nav-card.discipline-cash-card {
      background:
          linear-gradient(135deg, rgb(240 230 140 / 16%), transparent 56%),
          rgb(15 23 42 / 52%);
      border-color: rgb(240 230 140 / 50%);
  }

  .realtime-nav-card.discipline-cash-card .realtime-card-time {
      padding: 0.18rem 0.42rem;
      color: #f5eeb2;
      background: rgb(240 230 140 / 10%);
      border: 1px solid rgb(240 230 140 / 42%);
      border-radius: 999px;
  }

  .realtime-card-value {
      margin-bottom: 0.75rem;
  }

  .realtime-card-value strong {
      display: block;
      margin-top: 0.15rem;
      font-size: 1.55rem;
      color: #fff;
      line-height: 1;
      font-weight: 800;
      letter-spacing: 0;
  }

  .realtime-card-chart {
      margin-bottom: 0.55rem;
      width: 100%;
      height: 58px;
  }

  .realtime-nav-card.discipline-cash-card .realtime-card-chart {
      display: flex;
      justify-content: center;
      align-items: center;
  }

  .realtime-card-chart svg {
      display: block;
      overflow: hidden;
      width: 100%;
      height: 100%;
  }

  .realtime-nav-card.discipline-cash-card .realtime-card-chart svg {
      display: none;
  }

  .realtime-card-chart polygon {
      fill: var(--accent-color);
      opacity: 0.14;
  }

  .realtime-card-chart polyline {
      fill: none;
      stroke: var(--accent-color);
      stroke-width: 2.4;
      stroke-linecap: butt;
      stroke-linejoin: round;
      filter: none;
  }

  .realtime-chart-line {
      paint-order: stroke;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: realtime-line-draw 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .realtime-card-chart .realtime-chart-line-glow {
      fill: none;
      opacity: 0.18;
      stroke: var(--accent-color);
      stroke-width: 5.2;
      stroke-linecap: butt;
      stroke-linejoin: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: realtime-line-draw 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .realtime-chart-area {
      opacity: 0;
      animation: realtime-area-fade 0.55s ease-out 0.28s forwards;
  }

  .realtime-return-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.5rem;
  }

  .realtime-return-grid span {
      padding: 0.42rem 0.5rem;
      min-width: 0;
      background: rgb(255 255 255 / 3.5%);
      border: 1px solid rgb(255 255 255 / 6%);
      border-radius: 6px;
  }

  .realtime-return-grid em {
      display: block;
      margin-bottom: 0.22rem;
      font-size: 0.74rem;
      color: #94a3b8;
      line-height: 1.25;
      font-style: normal;
  }

  .realtime-return-grid strong {
      display: block;
      overflow: hidden;
      font-size: 0.86rem;
      line-height: 1.1;
      text-overflow: ellipsis;
      white-space: nowrap;
  }

  .daily-return,
  .estimated-profit {
      font-weight: 700;
      white-space: nowrap;
  }

  .positive {
      color: #f87171 !important;
  }

  .negative {
      color: #22c55e !important;
  }

  .neutral {
      color: #cbd5e1 !important;
  }

  .quick-menu-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.15rem 1rem;
      margin: 0 auto;
      animation: fadeInUp 0.5s ease-out 0.6s forwards;
      opacity: 0;
  }

  .quick-menu-card {
      position: relative;
      display: grid;
      align-items: stretch;
      overflow: hidden;
      padding: 1.2rem 1.35rem;
      min-width: 0;
      min-height: 148px;
      text-align: left;
      color: inherit;
      background:
          linear-gradient(135deg, color-mix(in srgb, var(--menu-accent, #60a5fa) 16%, transparent), transparent 55%),
          rgb(15 23 42 / 42%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 8px;
      transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
      backdrop-filter: blur(10px);
      cursor: pointer;
      grid-template-rows: auto 1fr;
      gap: 0.95rem;
  }

  .quick-menu-card:hover {
      background:
          linear-gradient(135deg, color-mix(in srgb, var(--menu-accent, #60a5fa) 22%, transparent), transparent 58%),
          rgb(30 41 59 / 62%);
      border-color: var(--menu-accent, rgb(96 165 250 / 55%));
      transform: translateY(-2px);
  }

  .quick-menu-icon {
      display: grid;
      width: 58px;
      height: 58px;
      color: var(--menu-accent, #fff);
      place-items: center;
      line-height: 1;
  }

  .quick-menu-card.all-weather:hover .all-weather-visual-icon {
      --all-weather-outer-rotation: 150deg;
      --all-weather-inner-rotation: -200deg;
      --all-weather-core-rotation: 135deg;
      --all-weather-core-scale: 1.08;
      --all-weather-core-glow: 18px;
      --all-weather-dot-scale: 1.35;
  }

  .quick-menu-card:hover .strategy-menu-icon {
      --icon-orbit-outer-opacity: 0.7;
      --icon-orbit-outer-rotation: 145deg;
      --icon-orbit-inner-opacity: 0.5;
      --icon-orbit-inner-rotation: -190deg;
      --icon-node-scale: 1.3;
      --icon-glyph-scale: 1.06;
      --icon-glyph-glow: 5px;
  }

  .quick-menu-card.convertible-bond:hover .strategy-menu-icon {
      --convertible-flow-top-offset: -11;
      --convertible-flow-bottom-offset: 11;
      --convertible-paper-shift: -1px;
      --convertible-paper-glow: 5px;
      --convertible-chart-shift: -1.5px;
      --convertible-chart-glow: 6px;
      --convertible-spark-opacity: 1;
      --convertible-spark-scale: 1.35;
  }

  .quick-menu-card.rights-strategy:hover .strategy-menu-icon {
      --rights-ticket-shift: -2px;
      --rights-ticket-glow: 6px;
      --rights-stock-shift: -1px;
      --rights-stock-glow: 5px;
      --rights-value-glow: 7px;
      --rights-value-scale: 1.14;
      --rights-ranking-shift: -1px;
  }

  .quick-menu-card.momentum-strategy:hover .strategy-menu-icon {
      --momentum-bar-shift: -1px;
      --momentum-leader-glow: 6px;
      --momentum-line-glow: 5px;
      --momentum-line-shift: -1.5px;
      --momentum-spark-opacity: 1;
      --momentum-spark-scale: 1.35;
  }

  .quick-menu-card.micro-cap:hover .strategy-menu-icon {
      --micro-cap-node-scale: 1.12;
      --micro-cap-selected-opacity: 1;
      --micro-cap-glow: 5px;
  }

  .quick-menu-card.portfolio-lab:hover .strategy-menu-icon {
      --lab-flow-offset: -9;
      --lab-input-glow: 5px;
      --lab-flask-glow: 6px;
      --lab-flask-shift: -1px;
      --lab-bubble-shift: -2px;
  }

  .quick-menu-card.lof-monitor:hover .strategy-menu-icon {
      --lof-market-glow: 6px;
      --lof-market-shift: -1.5px;
      --lof-spread-glow: 6px;
      --lof-point-scale: 1.3;
  }

  .quick-menu-card.handy-tools:hover .strategy-menu-icon {
      --tools-panel-glow: 5px;
      --tools-knob-glow: 5px;
      --tools-knob-shift: 3px;
      --tools-knob-two-shift: -3px;
      --tools-knob-three-shift: 2px;
  }

  .quick-menu-card.wealth-map:hover .strategy-menu-icon {
      --wealth-map-glow: 6px;
      --wealth-route-offset: -10;
      --wealth-pin-glow: 7px;
      --wealth-pin-shift: -2px;
  }

  .quick-menu-card.about-us:hover .strategy-menu-icon {
      --about-card-glow: 5px;
      --about-spark-glow: 6px;
      --about-spark-scale: 1.35;
  }

  .quick-menu-head {
      display: grid;
      align-items: center;
      min-width: 0;
      grid-template-columns: auto minmax(0, 1fr);
      gap: 1rem;
  }

  .quick-menu-title-wrap {
      display: grid;
      min-width: 0;
      gap: 0.4rem;
  }

  .quick-menu-title-wrap strong {
      overflow: hidden;
      min-width: 0;
      font-size: 1.15rem;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #fff;
      line-height: 1.15;
  }

  .quick-menu-title-wrap small {
      padding: 0.18rem 0.42rem;
      width: max-content;
      font-size: 0.68rem;
      color: var(--menu-accent, #94a3b8);
      border: 1px solid color-mix(in srgb, var(--menu-accent, #94a3b8) 55%, transparent);
      border-radius: 999px;
      font-weight: 700;
      line-height: 1;
  }

  .quick-menu-desc {
      display: box;
      overflow: hidden;
      font-size: 0.84rem;
      color: #a8b6c9;
      line-height: 1.55;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
  }

  .quick-menu-card.all-weather {
      --menu-accent: #0af;
  }

  .quick-menu-card.convertible-bond {
      --menu-accent: #add8e6;
  }

  .quick-menu-card.rights-strategy {
      --menu-accent: #ef4444;
  }

  .quick-menu-card.momentum-strategy {
      --menu-accent: #ff5722;
  }

  .quick-menu-card.micro-cap {
      --menu-accent: #f0e68c;
  }

  .quick-menu-card.portfolio-lab {
      --menu-accent: #6366f1;
  }

  .quick-menu-card.lof-monitor {
      --menu-accent: #0af;
  }

  .quick-menu-card.about-us {
      --menu-accent: #ffc107;
  }

  .quick-menu-card.wealth-map {
      --menu-accent: #2dd4bf;
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
      position: relative;
      display: flex;
      justify-content: center;
      overflow: hidden;
      padding: 1.2rem;
      min-height: 150px;
      text-align: center;
      text-decoration: none;
      color: inherit;

      /* 修改：使用更有质感的渐变背景 */
      background: linear-gradient(145deg, rgb(255 255 255 / 5%), rgb(255 255 255 / 2%));
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 12px;
      transition: transform 0.4s ease, box-shadow 0.4s ease;
      cursor: pointer;
      backdrop-filter: blur(10px);
      flex-direction: column;
  }

  .disabled-card {
      /* 关键：为伪元素定位做准备 */
      position: relative;
      cursor: not-allowed;

      /* 我们不再使用 filter 和 opacity，因为覆盖层效果更好 */
  }

  /* 创建一个覆盖在卡片上方的“毛玻璃”层 */
  .disabled-card::after {
      /* 直接使用 emoji 作为锁图标 */
      position: absolute;
      top: 0;
      left: 0;
      z-index: 5;

      /* 与卡片圆角保持一致 */

      /* 图标样式与居中 */
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      font-size: 2.5rem;
      color: rgb(255 255 255 / 70%);

      /* 覆盖层样式 */
      background-color: rgb(0 0 0 / 40%);

      /* 兼容 Safari */
      border-radius: 12px;

      /* 动画效果 */
      opacity: 0;
      transition: opacity 0.3s ease;
      content: '🔒';
      -webkit-backdrop-filter: blur(4px);
      backdrop-filter: blur(4px);
  }

  /* 当鼠标悬浮在禁用的卡片上时，显示覆盖层 */
  .disabled-card:hover::after {
      opacity: 1;
  }

  /* 让卡片原有内容在覆盖层之下，并稍微变暗 */
  .disabled-card .card-icon,
  .disabled-card .card-title,
  .disabled-card .card-description {
      opacity: 0.5;
      transition: opacity 0.3s ease;
  }

  /* 确保通用 hover 样式被修改 */
  .strategy-card:not(.disabled-card):hover {
      transform: translateY(-8px) scale(1.03);
  }

  /* 确保特定卡片的 hover 样式也被修改 */
  .long-term:not(.disabled-card):hover {
      border-color: #ff4081;
      box-shadow: 0 0 15px #ff4081;
  }

  .wealth-map:hover {
      border-color: #2dd4bf;
      box-shadow: 0 0 15px #2dd4bf;
  }

  .wealth-map .card-icon {
      color: #2dd4bf;
  }

  .about-us:hover {
      border-color: #ffc107;
      box-shadow: 0 0 15px #ffc107;
  }

  .about-us .card-icon {
      color: #ffc107;
  }

  .market-compass:hover {
      /* 一种青色光晕 */
      border-color: #39cccc;
      box-shadow: 0 0 15px #39cccc;
  }

  .market-compass .card-icon {
      color: #39cccc;
  }

  .card-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 0.6rem;

      /* 👇 新增以下 3 行，锁死图标容器的高度和布局 */
      height: 45px;
      font-size: 2.2rem;
  }

  .card-title {
      margin-bottom: 0.5rem;
      font-size: 1.2rem;
      font-weight: bold;
  }

  .card-description {
      font-size: 0.8rem;
      color: #b0c4de;
      line-height: 1.5;
  }

  .all-weather:hover {
      border-color: #0af;
      box-shadow: 0 0 15px #0af;
  }

  .all-weather .card-icon {
      color: #0af;
  }

  .long-term:hover {
      border-color: #ff4081;
      box-shadow: 0 0 15px #ff4081;
  }

  .long-term .card-icon {
      color: #ff4081;
  }

  /* 选项 A 样式 */

  /* 选项 B 样式 */
  .portfolio-lab:not(.disabled-card):hover {
      border-color: #6366f1;

      /* 深邃的蓝紫光晕 */
      box-shadow: 0 0 15px #6366f1;
  }

  .portfolio-lab .card-icon {
      color: #6366f1;
  }

  .lof-monitor:hover {
      border-color: #0af;
      box-shadow: 0 0 15px rgb(0 170 255 / 70%);
  }

  .lof-monitor .card-icon {
      filter: drop-shadow(0 0 8px rgb(0 170 255 / 55%));
  }

  .handy-tools:hover {
      border-color: #8a2be2;
      box-shadow: 0 0 15px #8a2be2;
  }

  .handy-tools .card-icon {
      color: #8a2be2;
  }

  .micro-cap:hover {
      border-color: #f0e68c;
      box-shadow: 0 0 15px #f0e68c;
  }

  .micro-cap .card-icon {
      color: #f0e68c;
  }

  /* --- 修改：ETF动量策略的卡片样式 (熔岩橙色系) --- */
  .momentum-strategy:not(.disabled-card):hover {
      border-color: #ff5722;

      /* 悬停时的光晕，改为橙红色 */
      box-shadow: 0 0 15px #ff5722;
  }

  .momentum-strategy .card-icon {
      color: #ff5722;

      /* 图标颜色 */
  }

  .micro-cap-admin {
      /* 背景改为深紫色渐变，区别于关于我们的黄色 */

      /* background: linear-gradient(145deg, rgba(157, 78, 221, 0.08), rgba(0, 0, 0, 0.3));
                                                                                                                      border: 1px solid rgba(157, 78, 221, 0.2); */
  }

  .micro-cap-admin:not(.disabled-card):hover {
      /* 悬停时：显示香槟金色的边框和光晕，低调奢华 */
      border-color: #d4af37;
      box-shadow: 0 0 15px rgb(212 175 55 / 30%);
      transform: translateY(-8px) scale(1.03);
  }

  .micro-cap-admin .card-icon {
      color: #d4af37; /* 香槟金图标 */
  }

  .convertible-bond:hover {
      border-color: #add8e6;
      box-shadow: 0 0 15px #add8e6;
  }

  .convertible-bond .card-icon {
      color: #add8e6;
  }

  .rights-strategy:hover {
      border-color: #ef4444;
      box-shadow: 0 0 15px #ef4444;
  }

  .rights-strategy .card-icon {
      color: #ef4444;
  }

  .cash-flow-strategy:hover {
      border-color: #e59866;
      box-shadow: 0 0 15px #e59866;
  }

  .cash-flow-strategy .card-icon {
      color: #e59866;
  }

  /* 页面底部会员信息的样式 */
  .user-actions-footer {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 2rem;

      /* 使用一种柔和、不刺眼的颜色 */
      font-size: 0.9rem;
      text-align: center;

      /* 与上方网格保持足够距离 */
      color: #8392a5;
      opacity: 0;
      font-weight: 500;
      gap: 0.8rem;

      /* 在各项之间创建一些空间 */

      /* 应用加载动画, 延迟0.8秒 */
      animation: fadeInUp 0.5s ease-out 0.8s forwards;
  }

  .actions-wrapper {
      display: flex;
      align-items: center;
      gap: 0.8rem;
  }

  .user-actions-footer,
  .actions-wrapper {
      gap: 0.8rem;
  }

  .membership-status {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
  }

  .membership-icon {
      display: inline-block;
      line-height: 1;
      transform: translateY(-1px);
  }

  .user-actions-footer .separator {
      color: rgb(131 146 165 / 50%);

      /* 分隔符颜色更淡一些 */
  }

  .user-actions-footer .action-link {
      /* 链接颜色与普通文本一致 */
      padding-top: 1px;
      color: #8392a5;
      transition: all 0.3s ease;
      border-bottom: 1px solid transparent;

      /* 准备一个透明的下划线，用于悬停效果 */
      cursor: pointer;

      /* 平滑过渡效果 */
  }

  .user-actions-footer .action-button {
      appearance: none;
      padding: 1px 0 0;
      background: none;
      border-top: 0;
      border-right: 0;
      border-bottom: 1px solid transparent;
      border-left: 0;
      font: inherit;
  }

  .wechat-hover-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
  }

  .wechat-qr-popover {
      position: absolute;
      bottom: calc(100% + 14px);
      left: 50%;
      z-index: 20;
      padding: 0.95rem;
      width: 220px;
      background: rgb(15 23 42 / 96%);
      border: 1px solid rgb(0 170 255 / 35%);
      border-radius: 16px;
      opacity: 0;
      visibility: hidden;
      box-shadow: 0 18px 45px rgb(0 0 0 / 38%), 0 0 20px rgb(0 170 255 / 16%);
      transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s ease;
      backdrop-filter: blur(14px);
      transform: translate(-50%, 8px);
      pointer-events: none;
  }

  .wechat-qr-popover::after {
      position: absolute;
      bottom: -8px;
      left: 50%;
      width: 14px;
      height: 14px;
      background: rgb(15 23 42 / 96%);
      content: '';
      border-right: 1px solid rgb(0 170 255 / 35%);
      border-bottom: 1px solid rgb(0 170 255 / 35%);
      transform: translateX(-50%) rotate(45deg);
  }

  .wechat-hover-wrapper:hover .wechat-qr-popover,
  .wechat-hover-wrapper:focus-within .wechat-qr-popover {
      transform: translate(-50%, 0);
      opacity: 1;
      visibility: visible;
  }

  .wechat-qr-image {
      display: block;
      width: 100%;
      background: #fff;
      border-radius: 12px;
      aspect-ratio: 1;
      object-fit: cover;
  }

  .wechat-qr-title {
      display: block;
      margin-top: 0.75rem;
      font-size: 0.95rem;
      text-align: center;
      color: #fff;
      font-weight: 700;
  }

  .wechat-qr-tip {
      display: block;
      margin-top: 0.35rem;
      font-size: 0.78rem;
      text-align: center;
      color: #b0c4de;
      line-height: 1.5;
  }

  /* 鼠标悬停时，链接才变得突出 */
  .user-actions-footer .action-link:hover {
      color: #0af;

      /* 悬停时变为高亮色 */
      border-bottom-color: #0af;

      /* 显示下划线 */

      /* 修改：添加辉光效果 */
      text-shadow: 0 0 8px rgb(0 170 255 / 70%);
  }

  /* --- 之后的所有样式都恢复为您的原始版本 --- */

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
      max-width: 800px;
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
      font-size: 1.4rem;
  }

  .modal-close-button {
      font-size: 2rem;
      color: #fff;
      background: transparent;
      border: none;
      cursor: pointer;
      line-height: 1;
  }

  .realtime-chart-backdrop {
      padding: 1rem;
  }

  .realtime-chart-modal-content {
      overflow-y: auto;
      padding: 1.35rem;
      width: min(920px, calc(100vw - 2rem));
      max-width: 920px;
      max-height: calc(100vh - 2rem);
      background:
          linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 12%, transparent), rgb(15 23 42 / 97%) 46%),
          rgb(15 23 42 / 96%);
      border: 1px solid color-mix(in srgb, var(--accent-color) 38%, rgb(255 255 255 / 14%));
      border-radius: 10px;
      box-shadow: 0 24px 70px rgb(0 0 0 / 58%);
  }

  .realtime-chart-header {
      align-items: flex-start;
      margin-bottom: 1rem;
  }

  .realtime-chart-header h3 {
      margin: 0.38rem 0 0;
      font-size: 1.45rem;
      color: #fff;
      line-height: 1.2;
  }

  .realtime-chart-metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
  }

  .realtime-chart-metrics div {
      padding: 0.75rem;
      min-width: 0;
      background: rgb(255 255 255 / 4.5%);
      border: 1px solid rgb(255 255 255 / 9%);
      border-radius: 8px;
  }

  .realtime-chart-metrics span {
      display: block;
      margin-bottom: 0.35rem;
      font-size: 0.76rem;
      color: #94a3b8;
      line-height: 1.2;
  }

  .realtime-chart-metrics strong {
      display: block;
      overflow: hidden;
      min-width: 0;
      font-size: 1.05rem;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #f8fafc;
      line-height: 1.2;
  }

  .realtime-allocation-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.65rem;
      margin: -0.15rem 0 1rem;
  }

  .realtime-allocation-locked {
      padding: 0.78rem 0.9rem;
      margin: -0.15rem 0 1rem;
      font-size: 0.82rem;
      color: #94a3b8;
      background: rgb(255 255 255 / 3.5%);
      border: 1px solid color-mix(in srgb, var(--accent-color) 20%, rgb(255 255 255 / 10%));
      border-radius: 8px;
      line-height: 1.4;
  }

  .realtime-allocation-item {
      padding: 0.68rem 0.72rem;
      min-width: 0;
      background: rgb(255 255 255 / 3.5%);
      border: 1px solid color-mix(in srgb, var(--accent-color) 22%, rgb(255 255 255 / 10%));
      border-radius: 8px;
  }

  .realtime-allocation-item span {
      display: block;
      overflow: hidden;
      font-size: 0.72rem;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #94a3b8;
      line-height: 1.2;
  }

  .realtime-allocation-values {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      align-items: baseline;
      margin-top: 0.3rem;
      min-width: 0;
  }

  .realtime-allocation-item strong {
      display: block;
      font-size: 1rem;
      color: #f8fafc;
      line-height: 1.15;
      font-weight: 800;
  }

  .realtime-allocation-item em {
      flex: 0 0 auto;
      font-size: 0.82rem;
      line-height: 1.15;
      font-style: normal;
      font-weight: 700;
  }

  .realtime-large-chart {
      position: relative;
      padding: 1rem 1rem 0.75rem;
      background:
          linear-gradient(180deg, color-mix(in srgb, var(--accent-color) 10%, transparent), transparent 58%),
          rgb(2 6 23 / 48%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 8px;
      cursor: crosshair;
  }

  .realtime-large-chart svg {
      display: block;
      overflow: hidden;
      width: 100%;
      height: 320px;
  }

  .realtime-large-chart line {
      stroke: rgb(255 255 255 / 8%);
      stroke-width: 1;
  }

  .realtime-large-chart .session-divider {
      stroke: rgb(255 255 255 / 14%);
      stroke-dasharray: 5 5;
   }

  .realtime-large-chart polygon {
      fill: var(--accent-color);
      opacity: 0.16;
  }

  .realtime-large-chart polyline {
      fill: none;
      stroke: var(--accent-color);
      stroke-width: 3;
      stroke-linecap: butt;
      stroke-linejoin: round;
      filter: drop-shadow(0 0 8px color-mix(in srgb, var(--accent-color) 55%, transparent));
  }

  @keyframes realtime-line-draw {
      to {
          stroke-dashoffset: 0;
      }
  }

  @keyframes realtime-area-fade {
      to {
          opacity: 0.16;
      }
  }

  .realtime-chart-axis {
      position: relative;
      margin-top: 0.6rem;
      height: 1rem;
      font-size: 0.76rem;
      color: #94a3b8;
      line-height: 1.2;
   }

  .realtime-chart-axis span {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
      white-space: nowrap;
  }

  .realtime-chart-axis span:first-child {
      transform: translateX(0);
  }

  .realtime-chart-axis span:last-child {
      transform: translateX(-100%);
  }

  .realtime-chart-tooltip {
      position: absolute;
      z-index: 2;
      display: grid;
      padding: 0.58rem 0.68rem;
      min-width: 128px;
      color: #e5edf7;
      background: rgb(15 23 42 / 94%);
      border: 1px solid color-mix(in srgb, var(--accent-color) 45%, rgb(255 255 255 / 18%));
      border-radius: 8px;
      box-shadow: 0 12px 26px rgb(0 0 0 / 36%);
      gap: 0.18rem;
      pointer-events: none;
      transform: translate(-50%, calc(-100% - 12px));
  }

  .realtime-chart-tooltip::after {
      position: absolute;
      bottom: -5px;
      left: 50%;
      width: 10px;
      height: 10px;
      background: rgb(15 23 42 / 94%);
      content: '';
      border-right: 1px solid color-mix(in srgb, var(--accent-color) 45%, rgb(255 255 255 / 18%));
      border-bottom: 1px solid color-mix(in srgb, var(--accent-color) 45%, rgb(255 255 255 / 18%));
      transform: translateX(-50%) rotate(45deg);
  }

  .realtime-chart-tooltip span {
      font-size: 0.72rem;
      color: #94a3b8;
      line-height: 1.2;
  }

  .realtime-chart-tooltip strong {
      font-size: 1rem;
      color: #fff;
      line-height: 1.15;
      font-weight: 800;
  }

  .realtime-chart-tooltip em {
      font-size: 0.75rem;
      font-style: normal;
      font-weight: 700;
      line-height: 1.2;
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
      /* 确保在小屏幕上不会过宽 */

      /* 修改：调整内边距和圆角，使其更精致 */
      padding: 2.5rem;
      width: 90%;

      /* 修改：减小最大宽度，使其更协调 */
      max-width: 450px !important;

      /* 新增：应用与登录页一致的玻璃拟态效果 */
      background: rgb(255 255 255 / 8%);
      border: 1px solid rgb(255 255 255 / 15%);
      border-radius: 20px;
      box-shadow: 0 8px 32px 0 rgb(0 0 0 / 37%);
      -webkit-backdrop-filter: blur(15px);
      backdrop-filter: blur(15px);
  }

  /* --- 弹窗头部样式 --- */
  .password-modal-content .modal-header {
      padding-bottom: 1.2rem;
      margin-bottom: 2rem;

      /* 增加与表单的距离 */
      text-align: center;

      /* 让标题居中 */
      border-bottom: 1px solid rgb(255 255 255 / 20%);
  }

  .password-modal-content .modal-header h3 {
      font-size: 1.5rem;

      /* 适当增大标题字号 */
      font-weight: 700;
  }

  /* 隐藏默认的关闭按钮，因为头部已经居中，不再需要它在角落 */
  .password-modal-content .modal-close-button {
      /* display: none; */
  }

  /* --- 弹窗内表单的样式 --- */
  .password-modal-content .form-group {
      position: relative;
      margin-bottom: 2.2rem;

      /* 增加输入框之间的垂直间距 */
  }

  /* 复用登录页的输入框和标签样式，确保统一 */
  .password-modal-content .input-field {
      padding: 10px 5px;
      width: 100%;
      font-size: 1.1rem;
      color: #fff;
      background: transparent;
      border: none;
      outline: none;
      transition: all 0.3s ease;
      border-bottom: 2px solid rgb(255 255 255 / 30%);
      caret-color: #0af;
  }

  .password-modal-content .input-field:focus {
      border-bottom-color: #0af;
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

  .notification-modal-content {
      overflow: visible;
      padding: 2rem;
      width: min(520px, calc(100vw - 2rem));
      max-width: 520px;
      background: rgb(30 30 30 / 96%);
      box-sizing: border-box;
  }

  .notification-loading {
      padding: 2rem 0;
      text-align: center;
      color: #b0c4de;
  }

  .notification-field {
      display: grid;
      margin-bottom: 1.2rem;
      font-size: 0.8rem;
      color: #e0e0e0;
      gap: 0.5rem;
  }

  .notification-field input {
      padding: 0.75rem 0.85rem;
      width: 100%;
      color: #fff;
      background: rgb(255 255 255 / 7%);
      border: 1px solid rgb(255 255 255 / 18%);
      border-radius: 8px;
      outline: none;
      box-sizing: border-box;
  }

  .notification-field input:focus {
      border-color: #0af;
  }

  .notification-channel-tip {
      margin: -0.35rem 0 1.2rem;
      font-size: 0.78rem;
      color: #8392a5;
      line-height: 1.5;
  }

  .notification-test-row {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 0.65rem;
      margin: -0.35rem 0 1.2rem;
      font-size: 0.76rem;
      color: #8392a5;
      line-height: 1.45;
  }

  .notification-test-button {
      padding: 0.55rem 0.75rem;
      color: #bde9ff;
      background: rgb(0 170 255 / 10%);
      border: 1px solid rgb(0 170 255 / 28%);
      border-radius: 8px;
      box-sizing: border-box;
      font-size: 0.8rem;
      font-weight: 700;
      white-space: nowrap;
      cursor: pointer;
  }

  .notification-test-button:hover:not(:disabled) {
      color: #fff;
      background: rgb(0 170 255 / 16%);
  }

  .notification-test-button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
  }

  .notification-guide-trigger {
      padding: 0.75rem 0.9rem;
      margin-bottom: 1.25rem;
      width: 100%;
      font-size: 0.85rem;
      text-align: left;
      color: #bde9ff;
      background: rgb(0 170 255 / 10%);
      border: 1px solid rgb(0 170 255 / 28%);
      border-radius: 8px;
      box-sizing: border-box;
      cursor: pointer;
  }

  .notification-guide-trigger:hover {
      color: #fff;
      background: rgb(0 170 255 / 16%);
  }

  .notification-guide-modal-content {
      overflow-y: auto;
      padding: 2rem;
      width: min(880px, calc(100vw - 2rem));
      max-height: calc(100vh - 4rem);
      background: rgb(30 30 30 / 97%);
  }

  .notification-guide {
      padding: 1rem;
      color: #b0c4de;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 10px;
  }

  .notification-guide h4 {
      margin: 0 0 0.8rem;
      font-size: 0.95rem;
      color: #fff;
  }

  .notification-guide-item + .notification-guide-item {
      padding-top: 0.85rem;
      margin-top: 0.85rem;
      border-top: 1px solid rgb(255 255 255 / 9%);
  }

  .notification-guide-item {
      display: grid;
      gap: 0.75rem;
  }

  .notification-guide-item strong {
      display: block;
      margin-bottom: 0.35rem;
      font-size: 0.85rem;
      color: #dce8f5;
  }

  .notification-guide-item p {
      margin: 0;
      font-size: 0.78rem;
      line-height: 1.65;
  }

  .notification-guide-gallery {
      display: grid;
      gap: 0.55rem;
  }

  .notification-guide-gallery button {
      display: block;
      overflow: hidden;
      padding: 0;
      cursor: zoom-in;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 16%);
      border-radius: 8px;
  }

  .wechat-guide-gallery {
      grid-template-columns: repeat(6, max-content);
      overflow-x: auto;
      padding-bottom: 0.15rem;
  }

  .bark-guide-gallery {
      grid-template-columns: max-content;
      justify-content: start;
  }

  .bark-guide-gallery button {
      width: max-content;
      background: transparent;
  }

  .wechat-guide-gallery button {
      width: max-content;
      background: transparent;
  }

  .notification-guide-gallery img {
      display: block;
      width: auto;
      height: 130px;
      max-height: 130px;
      object-fit: contain;
      object-position: center;
      background: #fff;
      cursor: zoom-in;
      transition: transform 0.2s ease, border-color 0.2s ease;
  }

  .notification-guide-gallery button:hover {
      border-color: rgb(0 170 255 / 55%);
  }

  .notification-guide-gallery button:hover img {
      transform: scale(1.02);
  }

  .bark-guide-gallery img {
      background: transparent;
  }

  .bark-guide-gallery button:hover img {
      transform: none;
  }

  .notification-image-viewer-backdrop {
      z-index: 1300;
  }

  .notification-image-viewer {
      position: relative;
      display: grid;
      padding: 1.25rem;
      width: min(1100px, calc(100vw - 2rem));
      height: min(760px, calc(100vh - 2rem));
      background: rgb(12 16 22 / 96%);
      border: 1px solid rgb(255 255 255 / 14%);
      border-radius: 14px;
      box-shadow: 0 20px 60px rgb(0 0 0 / 55%);
      grid-template-rows: minmax(0, 1fr) auto;
  }

  .image-viewer-stage {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 0;
  }

  .image-viewer-stage img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      min-height: 0;
      background: #fff;
      border-radius: 10px;
  }

  .image-viewer-close,
  .image-viewer-nav {
      position: absolute;
      z-index: 2;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #fff;
      background: rgb(0 0 0 / 48%);
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 999px;
      cursor: pointer;
      backdrop-filter: blur(6px);
  }

  .image-viewer-close {
      top: 0.9rem;
      right: 0.9rem;
      z-index: 3;
      width: 36px;
      height: 36px;
      font-size: 1.5rem;
      line-height: 1;
  }

  .image-viewer-nav {
      top: 50%;
      padding: 0;
      width: 52px;
      height: 52px;
      font-size: 0;
      color: #111;
      background: transparent;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      line-height: 1;
      transform: translateY(-50%);
  }

  .image-viewer-nav::before {
      display: block;
      font-size: 4rem;
      font-weight: 700;
      line-height: 1;
      text-shadow: 0 1px 2px rgb(255 255 255 / 80%), 0 0 8px rgb(255 255 255 / 45%);
  }

  .image-viewer-prev::before {
      content: '\2039';
  }

  .image-viewer-next::before {
      content: '\203A';
  }

  .image-viewer-prev {
      left: 1.75rem;
  }

  .image-viewer-next {
      right: 1.75rem;
  }

  .image-viewer-caption {
      padding-top: 0.9rem;
      font-size: 0.9rem;
      text-align: center;
      color: #dce8f5;
  }

  .notification-options {
      display: grid;
      overflow: visible;
      margin: 1.5rem 0;
      box-sizing: border-box;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.6rem;
  }

  .notification-option {
      position: relative;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      padding: 0.65rem 0.75rem;
      width: 100%;
      min-height: 42px;
      font-size: 0.82rem;
      color: #dce8f5;
      background: rgb(255 255 255 / 6%);
      border-radius: 8px;
      gap: 0.35rem;
      box-sizing: border-box;
      cursor: pointer;
  }

  .notification-option input {
      flex: 0 0 auto;
      margin: 0;
  }

  .notification-option-title {
      flex: 1;
      white-space: nowrap;
  }

  .notification-option-popover {
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      z-index: 20;
      display: grid;
      padding: 0.8rem 0.9rem;
      width: min(310px, calc(100vw - 3rem));
      text-align: left;
      color: #dce8f5;
      background: rgb(12 18 28 / 96%);
      border: 1px solid rgb(0 170 255 / 35%);
      border-radius: 10px;
      opacity: 0;
      box-shadow: 0 12px 28px rgb(0 0 0 / 38%);
      transition: opacity 0.18s ease, transform 0.18s ease;
      gap: 0.45rem;
      box-sizing: border-box;
      pointer-events: none;
      transform: translate(-50%, 6px);
  }

  .notification-option-popover::after {
      position: absolute;
      bottom: -6px;
      left: 50%;
      width: 10px;
      height: 10px;
      background: rgb(12 18 28 / 96%);
      content: '';
      border-right: 1px solid rgb(0 170 255 / 35%);
      border-bottom: 1px solid rgb(0 170 255 / 35%);
      transform: translateX(-50%) rotate(45deg);
  }

  .notification-option-popover strong {
      font-size: 0.86rem;
      color: #fff;
  }

  .notification-option-popover span,
  .notification-option-popover em {
      font-size: 0.76rem;
      line-height: 1.55;
  }

  .notification-option-popover b {
      color: #8fd8ff;
      font-weight: 700;
  }

  .notification-option-popover em {
      color: #b9c9dc;
      font-style: normal;
  }

  .notification-option:hover .notification-option-popover,
  .notification-option:focus-within .notification-option-popover {
      opacity: 1;
      transform: translate(-50%, 0);
  }

  .notification-save-button {
      padding: 0.85rem;
      margin-top: 0;
      width: 100%;
      color: #fff;
      background: #0af;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
  }

  .notification-save-button:hover:not(:disabled) {
      box-shadow: 0 0 12px rgb(0 170 255 / 45%);
  }

  .notification-save-button:disabled {
      cursor: wait;
      opacity: 0.65;
  }

  @media (width <= 576px) {
      .notification-test-row {
          grid-template-columns: 1fr;
      }

      .notification-test-button {
          width: 100%;
      }
  }

  .password-modal-content .input-field:focus + .input-label,
  .password-modal-content .input-field:not(:placeholder-shown) + .input-label {
      top: -18px;
      font-size: 0.9rem;
      color: #0af;
  }

  /* --- 弹窗内提交按钮的样式 --- */
  .password-modal-content .submit-btn {
      padding: 1rem;
      margin-top: 1.5rem;
      width: 100%;
      font-size: 1.2rem;

      /* 圆角与容器协调 */
      color: #fff;
      background: #0af;
      border: none;
      border-radius: 10px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      font-weight: 700;
      cursor: pointer;
  }

  .password-modal-content .submit-btn:hover {
      transform: translateY(-5px);
      box-shadow: 0 0 15px #0af, 0 0 30px rgb(0 170 255 / 50%);
  }

  .vip-modal-content {
      max-width: 450px;

      /* 弹窗可以小一些 */
      text-align: center;
  }

  .vip-modal-content .modal-body p {
      margin-bottom: 1rem;
      color: #e0e0e0;
      line-height: 1.7;
  }

  /* 微信ID的展示框样式 */
  .wechat-box {
      padding: 0.8rem 1rem;
      margin: 1.5rem auto;

      /* 让用户可以轻松选中并复制 */
      width: fit-content;
      font-size: 1.2rem;
      color: #fff;
      background: rgb(0 170 255 / 10%);
      border: 1px solid rgb(0 170 255 / 30%);
      border-radius: 8px;
      font-weight: bold;
      letter-spacing: 1px;
      user-select: all;
  }

  /* 弹窗按钮样式 */
  .vip-modal-button {
      padding: 0.8rem 1rem;
      margin-top: 1rem;
      width: 100%;
      font-size: 1rem;
      color: #fff;
      background: #0af;
      border: none;
      border-radius: 8px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      font-weight: 700;
      cursor: pointer;
  }

  .vip-modal-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 12px #0af;
  }

  .vip-modal-desc {
      margin-bottom: 1.5rem !important;
      font-size: 1rem;
      color: #e0e0e0;

      /* 增加与价格标签的间距 */
  }

  /* 新增：价格标签样式 */
  .price-tag {
      padding: 0.75rem;
      margin: 0 auto 1.5rem;
      width: fit-content;
      font-size: 0.9rem;
      color: #e0e0e0;
      background-color: rgb(255 215 0 / 10%);

      /* 淡金色背景 */
      border: 1px solid rgb(255 215 0 / 40%);

      /* 金色边框 */
      border-radius: 8px;
  }

  /* 新增：联系提示文本样式 */
  .contact-prompt {
      /* 使用次要文本颜色 */
      margin-bottom: 0.8rem !important;
      font-size: 0.9rem;
      color: #b0c4de;

      /* 减小与微信框的间距 */
  }

  /* ------------------------------------------- */

  /* ======== 新增：会员充值弹窗样式 ======== */

  /* ------------------------------------------- */
  .recharge-modal-content {
      padding: 2rem;
      max-width: 450px !important;
      text-align: center;

      /* 玻璃拟态效果 */
      background: rgb(255 255 255 / 8%);
      border: 1px solid rgb(255 255 255 / 15%);
      border-radius: 20px;
      box-shadow: 0 8px 32px 0 rgb(0 0 0 / 37%);
      -webkit-backdrop-filter: blur(15px);
      backdrop-filter: blur(15px);
  }

  .recharge-desc {
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      color: #b0c4de;
  }

  .recharge-form {
      padding: 1rem;
      margin-bottom: 1.5rem;
      background: rgb(0 0 0 / 20%);
      border-radius: 10px;
  }

  .form-label {
      display: block;
      margin-bottom: 0.45rem;
      font-size: 1rem;
      color: #e0e0e0;
  }

  .number-input-group {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
  }

  .week-input {
      width: 60px;
      font-size: 1.5rem;
      text-align: center;
      color: #fff;
      background: transparent;
      border: none;
      border-bottom: 2px solid #0af;
      font-weight: bold;
  }

  /* 去掉输入框的小箭头 */
  .week-input::-webkit-inner-spin-button,
  .week-input::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
  }

  .control-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
      font-size: 1.2rem;
      color: #fff;
      background: rgb(255 255 255 / 10%);
      border: 1px solid rgb(255 255 255 / 20%);
      border-radius: 50%;
      transition: all 0.2s;
      cursor: pointer;
  }

  .control-btn:hover:not(:disabled) {
      background: #0af;
      border-color: #0af;
  }

  .control-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
  }

  .amount-display {
      margin-bottom: 2rem;
      font-size: 1.2rem;
  }

  .amount-display .label {
      margin-right: 0.5rem;
      color: #e0e0e0;
  }

  .amount-display .price {
      font-size: 1.8rem;
      color: #ffd700;
      font-weight: bold;
  }

  .ali-pay-btn {
      padding: 0.8rem;

      /* 支付宝蓝 */
      margin-top: 0;
      width: 100%;
      font-size: 1.1rem;
      color: #fff;
      background: #1677ff;
      border: none;
      border-radius: 8px;
      transition: transform 0.2s;
      font-weight: bold;
      cursor: pointer;
  }

  .ali-pay-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      background: #4096ff;
      box-shadow: 0 4px 12px rgb(22 119 255 / 40%);
  }

  .ali-pay-btn:disabled {
      background: #4a5568;
      cursor: wait;
  }

  .qr-code-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: fadeInUp 0.3s ease-out;
  }

  .qr-img-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
      margin: 10px 0;
      width: 180px;
      height: 180px;
      background: #fff;
      border-radius: 8px;
  }

  .qr-img-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: contain;
  }

  .scan-tip {
      margin-bottom: 0.5rem;
      color: #0af;
      font-weight: bold;
  }

  .expire-tip {
      margin-bottom: 1rem;
      font-size: 0.8rem;
      color: #8392a5;
  }

  .text-btn {
      font-size: 0.9rem;
      text-decoration: underline;
      color: #b0c4de;
      background: none;
      border: none;
      cursor: pointer;
  }

  .text-btn:hover {
      color: #fff;
  }

  /* ... 之后的响应式和其他样式都保持您原来的版本 ... */
  .welcome-modal-content {
      max-width: 600px;

      /* 可以比图表弹窗窄一些 */
  }

  .welcome-modal-body {
      text-align: left;
      line-height: 1.8;
      color: #e0e0e0;
  }

  .welcome-modal-body h4 {
      margin-top: 1.5rem;
      margin-bottom: 0.8rem;
      font-size: 1.1rem;
      color: #0af;
  }

  .welcome-modal-body ul {
      list-style-type: none;
      padding-left: 1rem;
  }

  .welcome-modal-body li {
      position: relative;
      padding-left: 1.5rem;
      margin-bottom: 0.7rem;
  }

  .welcome-modal-body li::before {
      position: absolute;
      top: 2px;
      left: 0;
      color: #28a745;
      content: '✓';
      font-weight: bold;
  }

  .welcome-modal-body p:last-of-type {
      margin-top: 1.5rem;
      text-align: center;
      color: #fff;
      font-weight: 500;
  }

  .welcome-modal-button {
      display: block;
      padding: 0.8rem 1rem;
      margin: 1.5rem auto 0;
      width: 50%;
      font-size: 1rem;
      color: #fff;
      background: #0af;
      border: none;
      border-radius: 8px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      font-weight: 700;
      cursor: pointer;
  }

  .welcome-modal-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 12px #0af;
  }

  .welcome-modal-body .highlight-box {
      padding: 1rem;
      margin: 1.5rem 0;
      text-align: center;
      color: #fff;
      background: rgb(0 170 255 / 10%);
      border: 1px solid rgb(0 170 255 / 30%);
      border-radius: 8px;
      line-height: 1.6;
  }

  @media (min-width: 2000px) and (min-height: 1200px) {
      .home-page-wrapper {
          padding-top: clamp(4.875rem, calc((100vh - 69.625rem) / 2), 13rem);
          padding-bottom: 0.75rem;
      }

      .realtime-nav-card {
          min-height: 190px;
      }

      .quick-menu-card {
          min-height: 175px;
      }
  }

  @media (min-width: 1600px) and (max-height: 1000px) {
      .home-page-wrapper {
          padding-top: clamp(0.7rem, calc((100vh - 57rem) / 2), 2.7rem);
          padding-bottom: 0.55rem;
      }

      .main-container {
          padding-bottom: 0.3rem;
      }

      .main-title {
          margin-bottom: 0.35rem;
          font-size: 1.75rem;
      }

      .subtitle {
          margin-bottom: 0.9rem;
      }

      .market-thermometer-container {
          padding: 0.65rem 0.9rem;
          margin-bottom: 0.9rem;
      }

      .thermometer-header {
          margin-bottom: 0.55rem;
      }

      .thermometer-desc {
          margin-bottom: 0.65rem;
      }

      .realtime-nav-panel {
          margin-bottom: 0.8rem;
      }

      .realtime-nav-grid {
          gap: 0.8rem;
      }

      .realtime-nav-card {
          padding: 0.82rem;
          min-height: 152px;
      }

      .realtime-card-top {
          margin-bottom: 0.55rem;
      }

      .realtime-card-value {
          margin-bottom: 0.55rem;
      }

      .realtime-card-chart {
          margin-bottom: 0.45rem;
          height: 46px;
      }

      .quick-menu-grid {
          gap: 0.85rem;
      }

      .quick-menu-card {
          padding: 1rem 1.12rem;
          min-height: 141px;
          gap: 0.75rem;
      }

      .quick-menu-icon {
          width: 50px;
          height: 50px;
          font-size: 1.55rem;
      }

      .quick-menu-title-wrap strong {
          font-size: 1.06rem;
      }

      .quick-menu-desc {
          font-size: 0.78rem;
          line-height: 1.42;
      }

      .user-actions-footer {
          margin-top: 1.25rem;
      }
  }

  @media (min-width: 1600px) and (max-width: 1999px) and (min-height: 1001px) {
      .home-page-wrapper {
          padding-top: clamp(1rem, calc((100vh - 64.625rem) / 2), 2.7rem);
          padding-bottom: 0.4rem;
      }
  }

  @media (max-width: 1024px) {
      .main-container {
          padding-right: 1rem;
          padding-left: 1rem;
          width: 95%;
          max-width: none;
      }

      .home-page-wrapper {
          align-items: flex-start;
          overflow-y: auto;
          padding-top: 2rem;
      }

      .realtime-nav-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .quick-menu-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
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

      .realtime-nav-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .quick-menu-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .strategy-card {
          padding: 1rem;
          min-height: 140px;
      }

      .modal-content {
          overflow-y: auto;
          padding: 1.5rem 1.2rem;
          width: 80%;
          max-height: 90vh;
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
          padding: 0.8rem;
      }

      .wechat-guide-gallery {
          grid-template-columns: repeat(6, max-content);
      }

      .notification-guide-gallery img {
          height: 130px;
          max-height: 130px;
      }

      .notification-modal-content {
          overflow-x: hidden;
          overflow-y: auto;
          padding: 1.35rem 1rem;
          width: calc(100vw - 1.5rem);
          max-height: calc(100vh - 1.5rem);
      }

      .notification-options {
          grid-template-columns: 1fr;
      }

      .notification-option {
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: 0.5rem;
          row-gap: 0.55rem;
          align-items: center;
          min-width: 0;
      }

      .notification-option-title {
          min-width: 0;
      }

      .notification-option-popover {
          position: static;
          display: none;
          padding: 0.75rem 0.8rem;
          margin-top: 0.2rem;
          width: 100%;
          max-width: none;
          opacity: 1;
          transition: none;
          grid-column: 1 / -1;
          pointer-events: auto;
          transform: none;
      }

      .notification-option-popover::after {
          display: none;
      }

      .notification-option:hover .notification-option-popover,
      .notification-option:focus-within .notification-option-popover {
          display: grid;
          transform: none;
      }

      .main-container {
          padding: 0;
      }

      .main-title {
          font-size: 1.55rem;
      }

      .subtitle {
          margin-bottom: 0.75rem;
          font-size: 0.82rem;
      }

      .market-thermometer-container {
          padding: 0.75rem;
      }

      .realtime-nav-panel {
          padding: 0;
      }

      .realtime-nav-grid {
          grid-template-columns: 1fr;
      }

      .realtime-nav-card {
          padding: 0.75rem;
          min-height: 0;
      }

      .realtime-card-top {
          display: flex;
          margin-bottom: 0.5rem;
      }

      .realtime-card-value {
          margin-bottom: 0.45rem;
      }

      .realtime-card-value strong {
          font-size: 1.4rem;
      }

      .realtime-card-chart {
          margin-bottom: 0.4rem;
          height: 44px;
      }

      .realtime-return-grid span {
          padding: 0.35rem 0.45rem;
      }

      .realtime-return-grid em {
          margin-bottom: 0.12rem;
      }

      .quick-menu-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.65rem;
      }

      .quick-menu-card {
          padding: 0.85rem;
          min-height: 122px;
          gap: 0.6rem;
      }

      .quick-menu-icon {
          width: 32px;
          height: 32px;
      }

      .quick-menu-icon .strategy-menu-icon {
          width: 32px;
          height: 32px;
      }

      .quick-menu-icon .all-weather-visual-icon {
          --all-weather-icon-size: 30px !important;
      }

      .quick-menu-head {
          gap: 0.5rem;
      }

      .quick-menu-title-wrap {
          gap: 0.2rem;
      }

      .quick-menu-title-wrap strong {
          font-size: 0.88rem;
      }

      .quick-menu-desc {
          font-size: 0.7rem;
          line-height: 1.35;
          -webkit-line-clamp: 2;
      }

      .realtime-chart-modal-content {
          padding: 1rem;
      }

      .realtime-chart-metrics {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
      }

      .realtime-allocation-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
      }

      .realtime-large-chart {
          padding: 0.75rem 0.75rem 0.6rem;
      }

      .realtime-large-chart svg {
          height: 230px;
      }

      .thermometer-header {
          justify-content: center;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          gap: 0.25rem;
      }

      .thermometer-desc {
          margin-top: 0.1rem;
          margin-bottom: 1.2rem;
          text-align: center;
      }

      .features-grid {
          grid-template-columns: 1fr;
      }

      .strategy-card {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0.2rem 1rem 0.8rem;
          min-height: 140px;
          text-align: center;
          flex-direction: column;
      }

      .strategy-card .card-icon {
          margin: 0 0 0.75rem;
          font-size: 2.2rem;
      }

      .strategy-card .card-title {
          margin: 0 0 0.5rem;
          font-size: 1.15rem;
          line-height: 1.3;
      }

      .strategy-card .card-description {
          margin: 0;
          max-width: 90%;
          font-size: 0.85rem;
          color: #b0c4de;
          line-height: 1.5;
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

      .welcome-modal-body li {
          font-size: 0.9rem;
      }

      .echart-container {
          height: 350px;
      }

      .user-actions-footer {
          flex-direction: column; /* 整体依然垂直，让“会员状态”在第一行 */
          gap: 0.8rem; /* 增加一点行间距 */
          margin-top: 2.5rem;
      }

      /* 只隐藏第一行的那个竖线（状态和按钮中间的） */
      .user-actions-footer .status-separator {
          display: none;
      }

      /* 注意：删掉或注释掉原代码中的 .user-actions-footer .separator { display: none; } */

      /* 因为我们需要让按钮中间的竖线显示出来 */

      /* 确保按钮组也是横向排列（虽然默认就是 flex-row，但写上更保险） */
      .actions-wrapper {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.45rem;
      }
  }

  /* 套餐选择网格 */
  .plans-grid {
      display: flex;
      justify-content: center; /* 居中 */
      margin-bottom: 20px;
  }

  /* 针对最后两个大套餐，让它们在小屏下占据更多空间，或者直接流式布局 */

  /* 这里我们为了简单，用 flex wrap 或者保持 grid */

  /* .plans-grid {
                                                                                          display: flex;
                                                                                          flex-wrap: wrap;
                                                                                          justify-content: space-between;
                                                                                      } */

  .plan-item {
      position: relative;
      padding: 10px 5px;
      margin-bottom: 10px;
      width: 100%; /* 或者设置一个固定宽度，比如 280px */
      max-width: 300px;
      text-align: center;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 10px;
      transition: all 0.3s ease;
      cursor: pointer;
  }

  .plan-item:hover {
      background: rgb(255 255 255 / 10%);
  }

  /* 选中状态 */
  .plan-item.active {
      background: rgb(255 215 0 / 15%);
      border-color: #ffd700;
      box-shadow: 0 0 10px rgb(255 215 0 / 20%);
  }

  /* 推荐样式 */
  .plan-item.recommend {
      border-color: #ff4081;
  }

  .plan-item.recommend.active {
      background: rgb(255 64 129 / 15%);
      box-shadow: 0 0 10px rgb(255 64 129 / 30%);
  }

  /* 标签 */
  .plan-tag {
      position: absolute;
      top: -8px;
      right: -5px;
      padding: 2px 6px;
      font-size: 0.7rem;
      color: white;
      background: #ff4081;
      border-radius: 4px;
      transform: scale(0.9);
  }

  .plan-item.active .plan-tag {
      background: #ff4081;
  }

  .plan-item.active.active .plan-tag {
      color: #000;

      /* 如果选中了非推荐的但有tag的 */
      background: #ffd700;
  }

  .plan-item.recommend .plan-tag {
      background: #ff4081;
  }

  .plan-name {
      margin-bottom: 5px;
      font-size: 0.9rem;
      color: #e0e0e0;
  }

  .plan-price {
      margin-bottom: 5px;
      color: #ffd700;
  }

  .plan-price .currency {
      font-size: 0.8rem;
  }

  .plan-price .num {
      font-size: 1.4rem;
      font-weight: bold;
  }

  .plan-duration {
      font-size: 0.8rem;
      color: #8392a5;
  }

  /* 调整原来的样式 */
  .recharge-modal-content {
      max-width: 500px !important; /* 稍微宽一点放套餐 */
  }

  /* 头部简明信息 */
  .recharge-header {
      margin-bottom: 2rem;
      text-align: center;
  }

  .recharge-title {
      margin-bottom: 0.5rem;
      font-size: 1.1rem;
      color: #e0e0e0;
  }

  .plan-name-highlight {
      margin: 0 4px;
      font-size: 1.2rem;
      color: #0af;
      font-weight: bold;
  }

  .price-highlight {
      margin-left: 5px;
      font-size: 1.5rem;
      color: #ffd700;
      font-weight: bold;
  }

  /* 加载状态容器 */
  .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px; /* 占位高度，防止弹窗忽大忽小 */
      color: #8392a5;
      flex-direction: column;
  }

  /* 一个简单的纯CSS旋转加载圈 */
  .spinner {
      margin-bottom: 1rem;
      width: 40px;
      height: 40px;
      border: 3px solid rgb(255 255 255 / 10%);
      border-top-color: #0af;
      border-radius: 50%;
      animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
      to {
          transform: rotate(360deg);
      }
  }

  @media (max-width: 576px) {
      .plans-grid {
          /* 移动端强制：一行2个 */
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
      }

      /* 让最后一个（2年卡）在手机上占满一行，显得霸气 */

      /* .plan-item:last-child {
                                                                                                                                                                                  width: 100%;
                                                                                                                                                                                  display: flex;
                                                                                                                                                                                  justify-content: space-between;
                                                                                                                                                                                  align-items: center;
                                                                                                                                                                                  padding: 0 20px;
                                                                                                                                                                                  height: 60px;
                                                                                                                                                                              } */
      .recharge-modal-content {
          padding: 1.5rem 1rem;
      }
  }

  /* 2. PRO 标签基础样式 */
  .pro-tag {
      position: absolute;
      top: 0;
      right: 0;
      z-index: 10; /* 确保层级高于禁用的蒙版 */
      overflow: hidden;
      padding: 4px 12px;
      font-size: 0.75rem;
      color: #121212;
      background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
      box-shadow: -2px 2px 8px rgb(255 215 0 / 30%);
      font-weight: 900;
      border-bottom-left-radius: 12px;
      letter-spacing: 1px;
  }

  /* 3. 为 PRO 标签添加高级感的“扫光”动画 */
  .pro-tag::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
          to right,
          rgb(255 255 255 / 0%) 0%,
          rgb(255 255 255 / 80%) 50%,
          rgb(255 255 255 / 0%) 100%
      );
      transform: skewX(-20deg);
      animation: proShine 3s infinite ease-in-out;
  }

  @keyframes proShine {
      0% {
          left: -100%;
      }

      20%,
      100% {
          left: 200%;
      } /* 留白时间让动画不会太晃眼 */
  }

  /* 5. 为卡片内的图标添加悬浮互动小动画 (Q弹效果) */
  .strategy-card:not(.disabled-card):hover .card-icon {
      animation: iconPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  @keyframes iconPop {
      0% {
          transform: scale(1);
      }

      50% {
          transform: scale(1.2) translateY(-4px);
      }

      100% {
          transform: scale(1.1) translateY(-2px);
      }
  }
</style>
