<template>
  <div class="page-wrapper">
    <div class="main-container">
      <div class="page-header">
        <router-link to="/home" class="back-button">← 返回首页</router-link>
        <h1 class="main-title">
          <FeaturePageIcon class="title-icon" type="admin-center" :size="52" />
          管理中心
        </h1>
        <p class="subtitle">管理会员、数据源授权与策略数据刷新。</p>
      </div>

      <nav class="admin-tabs" aria-label="管理中心功能">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['admin-tab', { active: activeTab === tab.key }]"
          type="button"
          @click="selectTab(tab.key)"
        >
          <strong>{{ tab.label }}</strong>
          <span>{{ tab.description }}</span>
        </button>
      </nav>

      <section v-if="activeTab === 'users'" class="content-card admin-section">
        <div class="card-header-with-toggle">
          <div>
            <h2 class="card-title">用户数据列表</h2>
            <p class="card-description">查看会员期限、通知渠道和订阅策略，支持快速调整用户资料。</p>
          </div>

          <div class="filter-group">
            <label class="checkbox-label">
              <input v-model="onlyActive" type="checkbox" class="filter-checkbox" />
              <span>仅显示生效会员</span>
            </label>

            <input v-model="searchPhone" type="text" placeholder="按手机号筛选..." class="search-input" />
          </div>
        </div>

        <div class="table-wrapper">
          <table class="portfolio-table">
            <thead>
              <tr>
                <th>手机号</th>
                <th>通知渠道</th>
                <th>通知策略</th>
                <th>备注</th>
                <th class="sortable-header" @click="toggleSort">
                  会员到期日
                  <span class="sort-icon">{{ sortIndicator }}</span>
                </th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading">
                <td colspan="6" class="no-data">
                  <StrategyLoading
                    mode="inline"
                    title="正在加载用户数据"
                    description="同步账号、会员和通知信息"
                    monogram="USR"
                  />
                </td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="6" class="no-data">暂无匹配用户</td>
              </tr>
              <tr v-else v-for="user in users" :key="user.id">
                <td>{{ user.phone }}</td>
                <td class="channel-cell">
                  <span v-if="notificationChannelLabel(user)" class="channel-pill">
                    {{ notificationChannelLabel(user) }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="subscription-cell">
                  <div v-if="activeSubscriptionLabels(user).length" class="subscription-tags">
                    <span
                      v-for="subscription in activeSubscriptionLabels(user)"
                      :key="subscription.key"
                      :class="['subscription-tag', `subscription-tag-${subscription.key}`]"
                    >
                      {{ subscription.tagLabel }}
                    </span>
                  </div>
                  <span v-else>-</span>
                </td>
                <td class="remark-cell" :title="user.remark">{{ user.remark || '-' }}</td>
                <td>{{ user.membershipExpiry }}</td>
                <td>
                  <div class="row-actions">
                    <button class="action-button edit-button" @click="openEditModal(user)">编辑资料</button>
                    <button class="action-button" @click="openRenewalModal(user)">会员调整</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 0" class="pagination-controls">
          <span class="total-count">共 {{ totalUsers }} 条</span>
          <div class="pagination-buttons">
            <button class="pagination-button" :disabled="currentPage === 1" @click="prevPage">&lt;</button>
            <button
              v-for="page in totalPages"
              :key="page"
              :class="['pagination-button', { active: currentPage === page }]"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <button class="pagination-button" :disabled="currentPage === totalPages" @click="nextPage">&gt;</button>
          </div>
        </div>
      </section>

      <section
        v-if="activeTab === 'data-source'"
        class="content-card admin-section cookie-config-card"
        :class="{ expanded: expandedCookieSource === 'xueqiu' }"
      >
        <div
          class="cookie-card-summary-toggle"
          role="button"
          tabindex="0"
          :aria-expanded="expandedCookieSource === 'xueqiu'"
          aria-controls="xueqiu-cookie-editor"
          :aria-label="expandedCookieSource === 'xueqiu' ? '收起雪球 Cookie 编辑区' : '展开雪球 Cookie 编辑区'"
          @click="toggleCookieEditor('xueqiu')"
          @keydown.enter="toggleCookieEditor('xueqiu')"
          @keydown.space.prevent="toggleCookieEditor('xueqiu')"
        >
        <div class="card-header-with-toggle">
          <div>
            <h2 class="card-title">雪球 Cookie</h2>
            <p class="card-description">统一维护雪球授权 Cookie，供 Cookie 校验和微盘策略刷新使用。</p>
          </div>
          <div class="cookie-card-state">
            <span :class="['status-pill', cookieStatus.configured ? 'success' : 'warning']">
              {{ cookieStatus.configured ? '已配置' : '未配置' }}
            </span>
          </div>
        </div>

        <div class="cookie-summary-grid">
          <div class="cookie-summary-item">
            <span>脱敏预览</span>
            <strong>{{ cookieStatus.maskedCookie || '--' }}</strong>
          </div>
          <div class="cookie-summary-item">
            <span>更新时间</span>
            <strong>{{ formatDateTime(cookieStatus.updatedAt) }}</strong>
          </div>
          <div class="cookie-summary-item">
            <span>最近校验</span>
            <strong>{{ lastCookieCheck || '--' }}</strong>
          </div>
        </div>
        </div>

        <div
          v-if="expandedCookieSource === 'xueqiu'"
          id="xueqiu-cookie-editor"
          class="settings-panel cookie-editor-panel"
        >
          <label class="form-label" for="xueqiu-cookie">Cookie 内容</label>
          <textarea
            id="xueqiu-cookie"
            v-model="xueqiuCookie"
            class="cookie-textarea"
            placeholder="在这里粘贴雪球网页版请求头中的完整 Cookie"
          ></textarea>
          <p class="form-help">检查有效性只验证当前 Cookie；重置 Cookie 会重新登录，验证成功后再覆盖保存。</p>
          <div class="settings-actions">
            <button class="button-primary" type="button" :disabled="isSavingCookie || isCheckingCookie || isResettingCookie || !xueqiuCookie.trim()" @click="saveCookieData">
              {{ isSavingCookie ? '保存中...' : '保存 Cookie' }}
            </button>
            <button class="button-secondary" type="button" :disabled="isCheckingCookie || isResettingCookie || isSavingCookie" @click="checkCookie">
              {{ isCheckingCookie ? '检查中...' : '检查有效性' }}
            </button>
            <button class="button-secondary" type="button" :disabled="isResettingCookie || isCheckingCookie || isSavingCookie" @click="resetCookie">
              {{ isResettingCookie ? '重置中...' : '重置 Cookie' }}
            </button>
          </div>
        </div>
      </section>

      <section
        v-if="activeTab === 'data-source'"
        class="content-card admin-section cookie-config-card"
        :class="{ expanded: expandedCookieSource === 'jisilu' }"
      >
        <div
          class="cookie-card-summary-toggle"
          role="button"
          tabindex="0"
          :aria-expanded="expandedCookieSource === 'jisilu'"
          aria-controls="jisilu-cookie-editor"
          :aria-label="expandedCookieSource === 'jisilu' ? '收起集思录 Cookie 编辑区' : '展开集思录 Cookie 编辑区'"
          @click="toggleCookieEditor('jisilu')"
          @keydown.enter="toggleCookieEditor('jisilu')"
          @keydown.space.prevent="toggleCookieEditor('jisilu')"
        >
        <div class="card-header-with-toggle">
          <div>
            <h2 class="card-title">集思录 Cookie</h2>
            <p class="card-description">用于转债全景的实时列表和每日最新指数历史请求，与雪球 Cookie 独立保存。</p>
          </div>
          <div class="cookie-card-state">
            <span :class="['status-pill', jisiluCookieStatus.configured ? 'success' : 'warning']">
              {{ jisiluCookieStatus.configured ? '已配置' : '未配置' }}
            </span>
          </div>
        </div>

        <div class="cookie-summary-grid">
          <div class="cookie-summary-item">
            <span>脱敏预览</span>
            <strong>{{ jisiluCookieStatus.maskedCookie || '--' }}</strong>
          </div>
          <div class="cookie-summary-item">
            <span>更新时间</span>
            <strong>{{ formatDateTime(jisiluCookieStatus.updatedAt) }}</strong>
          </div>
          <div class="cookie-summary-item">
            <span>最近校验</span>
            <strong>{{ lastJisiluCookieCheck || '--' }}</strong>
          </div>
        </div>
        </div>

        <div
          v-if="expandedCookieSource === 'jisilu'"
          id="jisilu-cookie-editor"
          class="settings-panel cookie-editor-panel"
        >
          <label class="form-label" for="jisilu-cookie">Cookie 内容</label>
          <textarea
            id="jisilu-cookie"
            v-model="jisiluCookie"
            class="cookie-textarea"
            placeholder="在这里粘贴集思录网页版请求头中的完整 Cookie"
          ></textarea>
          <p class="form-help">检查有效性只验证当前 Cookie；重置 Cookie 会重新登录，验证成功后再覆盖保存。</p>
          <div class="settings-actions">
            <button class="button-primary" type="button" :disabled="isSavingJisiluCookie || isCheckingJisiluCookie || isResettingJisiluCookie || !jisiluCookie.trim()" @click="saveJisiluCookieData">
              {{ isSavingJisiluCookie ? '保存中...' : '保存 Cookie' }}
            </button>
            <button class="button-secondary" type="button" :disabled="isCheckingJisiluCookie || isResettingJisiluCookie || isSavingJisiluCookie" @click="checkJisiluCookie">
              {{ isCheckingJisiluCookie ? '检查中...' : '检查有效性' }}
            </button>
            <button class="button-secondary" type="button" :disabled="isResettingJisiluCookie || isCheckingJisiluCookie || isSavingJisiluCookie" @click="resetJisiluCookie">
              {{ isResettingJisiluCookie ? '重置中...' : '重置 Cookie' }}
            </button>
          </div>
        </div>
      </section>

      <section
        v-if="activeTab === 'data-source'"
        class="content-card admin-section cookie-config-card"
        :class="{ expanded: expandedCookieSource === 'guoren' }"
      >
        <div
          class="cookie-card-summary-toggle"
          role="button"
          tabindex="0"
          :aria-expanded="expandedCookieSource === 'guoren'"
          aria-controls="guoren-cookie-editor"
          :aria-label="expandedCookieSource === 'guoren' ? '收起果仁 Cookie 编辑区' : '展开果仁 Cookie 编辑区'"
          @click="toggleCookieEditor('guoren')"
          @keydown.enter="toggleCookieEditor('guoren')"
          @keydown.space.prevent="toggleCookieEditor('guoren')"
        >
        <div class="card-header-with-toggle">
          <div>
            <h2 class="card-title">果仁 Cookie</h2>
            <p class="card-description">用于果仁策略数据抓取，与其他数据源凭据独立保存。</p>
          </div>
          <div class="cookie-card-state">
            <span :class="['status-pill', guorenCookieStatus.configured ? 'success' : 'warning']">
              {{ guorenCookieStatus.configured ? '已配置' : '未配置' }}
            </span>
          </div>
        </div>

        <div class="cookie-summary-grid">
          <div class="cookie-summary-item">
            <span>脱敏预览</span>
            <strong>{{ guorenCookieStatus.maskedCookie || '--' }}</strong>
          </div>
          <div class="cookie-summary-item">
            <span>更新时间</span>
            <strong>{{ formatDateTime(guorenCookieStatus.updatedAt) }}</strong>
          </div>
          <div class="cookie-summary-item">
            <span>最近校验</span>
            <strong>{{ lastGuorenCookieCheck || '--' }}</strong>
          </div>
        </div>
        </div>

        <div
          v-if="expandedCookieSource === 'guoren'"
          id="guoren-cookie-editor"
          class="settings-panel cookie-editor-panel"
        >
          <label class="form-label" for="guoren-cookie">Cookie 内容</label>
          <textarea
            id="guoren-cookie"
            v-model="guorenCookie"
            class="cookie-textarea"
            placeholder="在这里粘贴果仁网页版请求头中的完整 Cookie"
          ></textarea>
          <p class="form-help">检查有效性只验证当前 Cookie；重置 Cookie 会重新登录，验证成功后再覆盖保存。</p>
          <div class="settings-actions">
            <button class="button-primary" type="button" :disabled="isSavingGuorenCookie || isCheckingGuorenCookie || isResettingGuorenCookie || !guorenCookie.trim()" @click="saveGuorenCookieData">
              {{ isSavingGuorenCookie ? '保存中...' : '保存 Cookie' }}
            </button>
            <button class="button-secondary" type="button" :disabled="isCheckingGuorenCookie || isResettingGuorenCookie || isSavingGuorenCookie" @click="checkGuorenCookie">
              {{ isCheckingGuorenCookie ? '检查中...' : '检查有效性' }}
            </button>
            <button class="button-secondary" type="button" :disabled="isResettingGuorenCookie || isCheckingGuorenCookie || isSavingGuorenCookie" @click="resetGuorenCookie">
              {{ isResettingGuorenCookie ? '重置中...' : '重置 Cookie' }}
            </button>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'data-view'" class="content-card admin-section">
        <div class="card-header-with-toggle">
          <div>
            <h2 class="card-title">已采集数据</h2>
            <p class="card-description">页面会读取已入库的数据；点击右侧按钮可重新抓取最新果仁微盘策略信号。</p>
          </div>
          <button
            class="button-secondary"
            :disabled="isLoadingCollectedData || isRefreshingGuorenMicrocap"
            @click="refreshGuorenMicrocap"
          >
            {{ isRefreshingGuorenMicrocap ? '更新中...' : '更新果仁信号' }}
          </button>
        </div>

        <div v-if="isLoadingCollectedData" class="no-data">正在加载已采集数据...</div>
        <template v-else-if="collectedData">
          <p class="form-help collected-data-time">更新时间：{{ formatDateTime(collectedData.updatedAt) }}</p>
          <div class="table-wrapper">
            <table class="portfolio-table collected-data-table">
              <thead>
                <tr>
                  <th>股票名称</th>
                  <th>股票代码</th>
                  <th>行业</th>
                  <th>信号</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in collectedData.data" :key="`${row.stockCode}-${index}`">
                  <td>{{ row.stockName }}</td>
                  <td>{{ row.stockCode }}</td>
                  <td>{{ row.industry }}</td>
                  <td>{{ row.signal }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="no-data">暂无已采集数据</div>
      </section>

      <section v-if="activeTab === 'refresh'" class="content-card admin-section">
        <div class="card-header-with-toggle">
          <div>
            <h2 class="card-title">策略刷新入口</h2>
            <p class="card-description">手动触发 LOF、含权、微盘、高股息策略和转债全景的数据更新，适合补跑或验证云函数状态。</p>
          </div>
        </div>

        <div class="refresh-grid">
          <article v-for="item in refreshTasks" :key="item.key" class="refresh-card">
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <span v-if="item.lastRun" class="refresh-time">最近执行：{{ item.lastRun }}</span>
            </div>
            <button
              class="button-primary"
              :disabled="refreshingKey === item.key"
              @click="runRefreshTask(item.key)"
            >
              {{ refreshingKey === item.key ? '刷新中...' : '立即刷新' }}
            </button>
          </article>
        </div>
      </section>
    </div>

    <Transition name="modal-fade">
      <div v-if="isModalVisible" class="modal-backdrop" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>会员时长调整</h3>
            <button class="modal-close-button" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div v-if="selectedUser" class="modal-form">
              <div class="form-group">
                <label>当前用户手机号</label>
                <p class="info-text">{{ selectedUser.phone }}</p>
              </div>
              <div class="form-group">
                <label>当前到期时间</label>
                <p class="info-text">{{ selectedUser.membershipExpiry }}</p>
              </div>
              <div class="form-group">
                <label for="days-input">调整天数（正数增加，负数扣减）</label>
                <input id="days-input" v-model.number="daysToAdd" type="number" min="-3650" max="3650" step="1" class="form-input" placeholder="例如：30 或 -7" />
              </div>
              <div class="form-group">
                <label for="renewal-reason">调整原因</label>
                <textarea id="renewal-reason" v-model="adjustmentReason" class="form-input" maxlength="200" placeholder="请填写本次会员期限调整原因"></textarea>
              </div>
              <div v-if="newExpiryDate" class="form-group">
                <label>调整后到期时间</label>
                <p class="info-text highlight">{{ newExpiryDate }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="button-secondary" @click="closeModal">取消</button>
            <button class="button-primary" :disabled="!daysToAdd || daysToAdd === 0 || !adjustmentReason.trim()" @click="confirmRenewal">
              确认调整
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div v-if="isEditModalVisible" class="modal-backdrop" @click="closeEditModal">
        <div class="modal-content edit-modal-content" @click.stop>
          <div class="modal-header">
            <h3>编辑用户资料</h3>
            <button class="modal-close-button" @click="closeEditModal">×</button>
          </div>
          <form class="modal-form" @submit.prevent="saveUserProfile">
            <div class="form-group">
              <label>用户手机号</label>
              <p class="info-text">{{ editingUser?.phone }}</p>
            </div>
            <div class="form-group">
              <label for="admin-bark-key">Bark ID</label>
              <input
                id="admin-bark-key"
                v-model.trim="editForm.barkKey"
                class="form-input"
                type="text"
                placeholder="未配置"
                @input="handleAdminBarkInput"
              />
            </div>
            <div class="form-group">
              <label for="admin-wechat-key">企业微信 ID（iOS / Android）</label>
              <input
                id="admin-wechat-key"
                v-model.trim="editForm.wechatWebhookKey"
                class="form-input"
                type="text"
                placeholder="可填写 Key 或完整 Webhook 地址"
                @input="handleAdminWechatInput"
              />
              <span class="form-help">Bark ID 和企业微信 ID 只能填写一个。</span>
            </div>
            <div class="form-group">
              <label>通知策略</label>
              <div class="admin-notification-options">
                <label v-for="option in subscriptionOptions" :key="option.key" class="admin-notification-option">
                  <input v-model="editForm.subscriptions[option.key]" type="checkbox" />
                  <span class="admin-notification-option-title">{{ option.label }}</span>
                  <span class="admin-notification-popover">
                    <strong>{{ option.label }}</strong>
                    <span><b>触发：</b>{{ option.trigger }}</span>
                    <span><b>内容：</b>{{ option.content }}</span>
                    <em>示例：{{ option.example }}</em>
                  </span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label for="admin-user-remark">备注</label>
              <textarea
                id="admin-user-remark"
                v-model="editForm.remark"
                class="form-input remark-input"
                maxlength="500"
                placeholder="会员昵称、沟通记录等"
              ></textarea>
              <span class="character-count">{{ editForm.remark.length }}/500</span>
            </div>
            <div class="modal-footer">
              <button type="button" class="button-secondary" @click="closeEditModal">取消</button>
              <button type="submit" class="button-primary" :disabled="isSavingUser">
                {{ isSavingUser ? '保存中...' : '保存资料' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed, inject, onMounted, ref, watch } from 'vue'
  import { callCloudFunction } from '@/services/cloudFunction'

  const showMessage: any = inject('showMessage')

  interface User {
      id: string
      phone: string
      membershipExpiry: string
      isVip: boolean
      barkKey: string
      wechatWebhookKey: string
      subscriptions: NotificationSubscriptions
      remark: string
  }

  interface NotificationSubscriptions {
      momentum: boolean
      convertible: boolean
      micro_cap: boolean
      rights_strategy: boolean
      lof_premium: boolean
      high_dividend: boolean
  }

  type TabKey = 'users' | 'data-source' | 'data-view' | 'refresh'
  type RefreshTaskKey = 'lof' | 'rights' | 'micro_cap' | 'high_dividend' | 'bond_market'
  type CookieSource = 'xueqiu' | 'jisilu' | 'guoren'

  interface CollectedDataRow {
      stockName: string
      stockCode: string
      industry: string
      signal: string | null
  }

  interface CollectedData {
      data: CollectedDataRow[]
      updatedAt: string
  }

  const tabs: Array<{ key: TabKey; label: string; description: string }> = [
      { key: 'users', label: '人员管理', description: '会员、通知、备注' },
      { key: 'data-source', label: '数据源配置', description: '统一维护访问凭据' },
      { key: 'data-view', label: '数据查看', description: '已采集数据总览' },
      { key: 'refresh', label: '策略刷新', description: '手动补跑数据' }
  ]
  const activeTab = ref<TabKey>('users')

  const users = ref<User[]>([])
  const searchPhone = ref('')
  const isLoading = ref(true)
  const onlyActive = ref(true)
  const sortOrder = ref<'asc' | 'desc' | ''>('asc')
  const currentPage = ref(1)
  const itemsPerPage = ref(8)
  const totalUsers = ref(0)
  let debounceTimer: any = null

  const totalPages = computed(() => Math.ceil(totalUsers.value / itemsPerPage.value))
  const sortIndicator = computed(() => {
      if (sortOrder.value === 'asc') return '↑'
      if (sortOrder.value === 'desc') return '↓'
      return '↕'
  })

  const subscriptionOptions = [
      {
          key: 'high_dividend',
          label: '高股息策略',
          tagLabel: '高股息',
          trigger: '每周第一个交易日 9:00 检查；仅在发生调仓时推送。',
          content: '计划执行时间、调出、调入及调仓后持仓；仓位止盈也属于调仓。',
          example: '计划于 2026-08-03 9:30 执行；调出 A 公司，调入 B 公司。'
      },
      {
          key: 'convertible',
          label: '可转债策略',
          tagLabel: '可转债',
          trigger: '交易日 14:40 自动计算排名后通知；不调仓也会通知。',
          content: '有调仓时包含卖出、买入以及当前持仓；无调仓时提示继续持有并展示当前持仓。',
          example: '今日无调仓操作，继续持有。当前持仓：XX转债(123456)、YY转债(113000)。'
      },
      {
          key: 'rights_strategy',
          label: '含权策略',
          tagLabel: '含权',
          trigger: '交易日 14:40 刷新含权策略；只有发生调仓时通知，无调仓不通知。',
          content: '交易日、卖出清单、买入清单，以及对应含权值。',
          example: '交易日：2026-06-15；卖出：A公司(600000) 含权值:12.34。'
      },
      {
          key: 'momentum',
          label: '动量策略',
          tagLabel: '动量',
          trigger: '交易日 14:50 触发调仓；当动量标的切换时通知。',
          content: '卖出标的、买入标的、买入代码、近 20 日涨幅和调仓日期。',
          example: '卖出：中证1000价值ETF华夏；买入：纳指100ETF招商(159659)。'
      },
      {
          key: 'micro_cap',
          label: '微盘股策略',
          tagLabel: '微盘股',
          trigger: '微盘股数据更新完成后通知。',
          content: '提醒数据已更新，并附带更新时间。',
          example: '微盘股数据已更新，请及时查看最新持仓。'
      },
      {
          key: 'lof_premium',
          label: 'LOF 溢价',
          tagLabel: 'LOF溢价',
          trigger: '交易日 14:30，从实时 LOF 刷新结果里筛选符合条件的基金。',
          content: '名称、代码、限购金额、T-2/T-1/实时溢价率。',
          example: '华宝油气LOF(162411) 限购金额：5,000元；实时:1.56%。'
      }
  ] as const

  const refreshTasks = ref([
      {
          key: 'lof' as RefreshTaskKey,
          title: 'LOF 溢价监控',
          description: '拉取并保存最新 LOF 场内价格、估值和折溢价数据。',
          lastRun: ''
      },
      {
          key: 'rights' as RefreshTaskKey,
          title: '含权策略',
          description: '刷新含权策略实时组合和调仓建议。',
          lastRun: ''
      },
      {
          key: 'micro_cap' as RefreshTaskKey,
          title: '微盘股策略',
          description: '刷新微盘 Top10 策略数据，依赖当前雪球 Cookie。',
          lastRun: ''
      },
      {
          key: 'high_dividend' as RefreshTaskKey,
          title: '高股息策略',
          description: '从果仁抓取最近一个已完成交易日的高股息持仓。',
          lastRun: ''
      },
      {
          key: 'bond_market' as RefreshTaskKey,
          title: '转债全景',
          description: '请求当前集思录实时转债列表，并保存一份日内快照。',
          lastRun: ''
      }
  ])
  const refreshingKey = ref<RefreshTaskKey | ''>('')
  const cookieStatus = ref({
      configured: false,
      maskedCookie: '',
      updatedAt: ''
  })
  const xueqiuCookie = ref('')
  const isSavingCookie = ref(false)
  const isCheckingCookie = ref(false)
  const isResettingCookie = ref(false)
  const lastCookieCheck = ref('')
  const jisiluCookieStatus = ref({
      configured: false,
      maskedCookie: '',
      updatedAt: ''
  })
  const jisiluCookie = ref('')
  const isSavingJisiluCookie = ref(false)
  const isCheckingJisiluCookie = ref(false)
  const isResettingJisiluCookie = ref(false)
  const lastJisiluCookieCheck = ref('')
  const guorenCookieStatus = ref({
      configured: false,
      maskedCookie: '',
      updatedAt: ''
  })
  const guorenCookie = ref('')
  const isSavingGuorenCookie = ref(false)
  const isCheckingGuorenCookie = ref(false)
  const isResettingGuorenCookie = ref(false)
  const lastGuorenCookieCheck = ref('')
  const expandedCookieSource = ref<CookieSource | null>(null)
  const collectedData = ref<CollectedData | null>(null)
  const isLoadingCollectedData = ref(false)
  const isRefreshingGuorenMicrocap = ref(false)

  function emptySubscriptions(): NotificationSubscriptions {
      return {
          momentum: false,
          convertible: false,
          micro_cap: false,
          rights_strategy: false,
          lof_premium: false,
          high_dividend: false
      }
  }

  const activeSubscriptionLabels = (user: User) =>
      subscriptionOptions.filter(option => user.subscriptions?.[option.key] === true)

  const notificationChannelLabel = (user: User) => {
      if (user.barkKey) return 'Bark'
      if (user.wechatWebhookKey) return '企业微信'
      return ''
  }

  const notificationChannelValue = (user: User) => user.barkKey || user.wechatWebhookKey || ''

  const fetchUsers = () => {
      isLoading.value = true
      callCloudFunction({
          name: 'getUsers',
          parse: true,
          data: {
              searchPhone: searchPhone.value,
              page: currentPage.value,
              limit: itemsPerPage.value,
              onlyActive: onlyActive.value,
              sortOrder: sortOrder.value
          }
      })
          .then((res: any) => {
              if (res.result?.success) {
                  users.value = res.result.data.users
                  totalUsers.value = res.result.data.total
              } else {
                  showMessage(res.result?.message || '获取失败', 'error')
                  users.value = []
                  totalUsers.value = 0
              }
          })
          .catch(() => {
              showMessage('网络错误，无法加载用户数据', 'error')
              users.value = []
              totalUsers.value = 0
          })
          .finally(() => {
              isLoading.value = false
          })
  }

  const fetchCookieStatus = async () => {
      try {
          const response: any = await callCloudFunction({
              name: 'xueqiuCookieConfig',
              data: { action: 'get' }
          })
          if (response.result?.success) {
              cookieStatus.value = {
                  configured: response.result.data.configured === true,
                  maskedCookie: response.result.data.maskedCookie || '',
                  updatedAt: response.result.data.updatedAt || ''
              }
          }
      } catch (error) {
          console.error('读取雪球 Cookie 状态失败:', error)
      }
  }

  const fetchJisiluCookieStatus = async () => {
      try {
          const response: any = await callCloudFunction({
              name: 'jisiluCookieConfig',
              data: { action: 'get' }
          })
          if (response.result?.success) {
              jisiluCookieStatus.value = {
                  configured: response.result.data.configured === true,
                  maskedCookie: response.result.data.maskedCookie || '',
                  updatedAt: response.result.data.updatedAt || ''
              }
              lastJisiluCookieCheck.value = formatDateTime(response.result.data.lastCheckedAt || '')
          }
      } catch (error) {
          console.error('读取集思录 Cookie 状态失败:', error)
      }
  }

  const fetchGuorenCookieStatus = async () => {
      try {
          const response: any = await callCloudFunction({
              name: 'guorenCookieConfig',
              data: { action: 'get' }
          })
          if (response.result?.success) {
              guorenCookieStatus.value = {
                  configured: response.result.data.configured === true,
                  maskedCookie: response.result.data.maskedCookie || '',
                  updatedAt: response.result.data.updatedAt || ''
              }
              lastGuorenCookieCheck.value = formatDateTime(response.result.data.lastCheckedAt || '')
          }
      } catch (error) {
          console.error('读取果仁 Cookie 状态失败:', error)
      }
  }

  const fetchCollectedData = async () => {
      if (isLoadingCollectedData.value) return

      isLoadingCollectedData.value = true
      try {
          const response: any = await callCloudFunction({ name: 'getGuorenMicrocapData' })
          if (!response.result?.success) throw new Error(response.result?.message || '读取数据失败')
          collectedData.value = response.result.data || null
      } catch (error: any) {
          showMessage(error.message || '读取数据失败', 'error')
      } finally {
          isLoadingCollectedData.value = false
      }
  }

  const refreshGuorenMicrocap = async () => {
      if (isRefreshingGuorenMicrocap.value) return

      isRefreshingGuorenMicrocap.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'strategyTaskGateway',
              data: { action: 'refreshGuorenMicrocap' }
          })
          const result = response.result || {}
          if (result.ok !== true) throw new Error(result.message || '获取最新果仁微盘持仓失败')

          await fetchCollectedData()
          showMessage(`已获取最新果仁微盘持仓，共 ${result.rowCount} 条`, 'success')
      } catch (error: any) {
          showMessage(error.message || '获取最新果仁微盘持仓失败', 'error')
      } finally {
          isRefreshingGuorenMicrocap.value = false
      }
  }

  const selectTab = (tab: TabKey) => {
      activeTab.value = tab
      if (tab === 'data-view') fetchCollectedData()
  }

  const toggleCookieEditor = (source: CookieSource) => {
      expandedCookieSource.value = expandedCookieSource.value === source ? null : source
  }

  const toggleSort = () => {
      if (sortOrder.value === 'asc') {
          sortOrder.value = 'desc'
      } else if (sortOrder.value === 'desc') {
          sortOrder.value = ''
      } else {
          sortOrder.value = 'asc'
      }
      currentPage.value = 1
      fetchUsers()
  }

  watch(onlyActive, () => {
      currentPage.value = 1
      fetchUsers()
  })

  watch(searchPhone, () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
          if (currentPage.value !== 1) {
              currentPage.value = 1
          } else {
              fetchUsers()
          }
      }, 500)
  })

  watch(currentPage, () => {
      fetchUsers()
  })

  const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages.value) currentPage.value = page
  }
  const prevPage = () => goToPage(currentPage.value - 1)
  const nextPage = () => goToPage(currentPage.value + 1)

  const isModalVisible = ref(false)
  const selectedUser = ref<User | null>(null)
  const daysToAdd = ref<number | null>(null)
  const adjustmentReason = ref('')

  const openRenewalModal = (user: User) => {
      selectedUser.value = user
      isModalVisible.value = true
  }

  const closeModal = () => {
      isModalVisible.value = false
      selectedUser.value = null
      daysToAdd.value = null
      adjustmentReason.value = ''
  }

  const newExpiryDate = computed(() => {
      if (!selectedUser.value || daysToAdd.value === null || daysToAdd.value === 0) return ''
      const isNewUserOrExpired =
          selectedUser.value.membershipExpiry === '未设置' ||
          new Date(selectedUser.value.membershipExpiry) < new Date()
      const startDate = isNewUserOrExpired ? new Date() : new Date(selectedUser.value.membershipExpiry)
      startDate.setDate(startDate.getDate() + daysToAdd.value)
      return formatDateObject(startDate)
  })

  const confirmRenewal = () => {
      if (!selectedUser.value || !daysToAdd.value || !adjustmentReason.value.trim()) return

      callCloudFunction({
          name: 'renewMembership',
          parse: true,
          data: {
              userId: selectedUser.value.id,
              daysToAdd: daysToAdd.value,
              reason: adjustmentReason.value.trim()
          }
      })
          .then((res: any) => {
              if (res.result?.success) {
                  showMessage('操作成功！', 'success')
                  closeModal()
                  fetchUsers()
              } else {
                  showMessage(res.result?.message || '操作失败', 'error')
              }
          })
          .catch(() => {
              showMessage('网络错误，操作失败', 'error')
          })
  }

  const isEditModalVisible = ref(false)
  const isSavingUser = ref(false)
  const editingUser = ref<User | null>(null)
  const editForm = ref({
      barkKey: '',
      wechatWebhookKey: '',
      subscriptions: emptySubscriptions(),
      remark: ''
  })

  const openEditModal = (user: User) => {
      editingUser.value = user
      editForm.value = {
          barkKey: user.barkKey || '',
          wechatWebhookKey: user.wechatWebhookKey || '',
          subscriptions: {
              momentum: user.subscriptions?.momentum === true,
              convertible: user.subscriptions?.convertible === true,
              micro_cap: user.subscriptions?.micro_cap === true,
              rights_strategy: user.subscriptions?.rights_strategy === true,
              lof_premium: user.subscriptions?.lof_premium === true,
              high_dividend: user.subscriptions?.high_dividend === true
          },
          remark: user.remark || ''
      }
      isEditModalVisible.value = true
  }

  const closeEditModal = () => {
      isEditModalVisible.value = false
      editingUser.value = null
      editForm.value = {
          barkKey: '',
          wechatWebhookKey: '',
          subscriptions: emptySubscriptions(),
          remark: ''
      }
  }

  const handleAdminBarkInput = (event: Event) => {
      const value = (event.target as HTMLInputElement).value.trim()
      editForm.value.barkKey = value
      if (value) editForm.value.wechatWebhookKey = ''
  }

  const handleAdminWechatInput = (event: Event) => {
      const value = (event.target as HTMLInputElement).value.trim()
      editForm.value.wechatWebhookKey = value
      if (value) editForm.value.barkKey = ''
  }

  const saveUserProfile = async () => {
      if (!editingUser.value) return
      if (editForm.value.barkKey && editForm.value.wechatWebhookKey) {
          showMessage('Bark ID 和企业微信 ID 只能填写一个', 'error')
          return
      }

      isSavingUser.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'updateAdminUser',
              data: {
                  userId: editingUser.value.id,
                  barkKey: editForm.value.barkKey,
                  wechatWebhookKey: editForm.value.wechatWebhookKey,
                  subscriptions: { ...editForm.value.subscriptions },
                  remark: editForm.value.remark
              }
          })

          if (!response.result?.success) throw new Error(response.result?.message || '保存失败')

          showMessage('用户资料已更新', 'success')
          closeEditModal()
          fetchUsers()
      } catch (error: any) {
          showMessage(error.message || '保存失败', 'error')
      } finally {
          isSavingUser.value = false
      }
  }

  const saveCookieData = async () => {
      if (!xueqiuCookie.value.trim()) {
          showMessage('Cookie 不能为空', 'warning')
          return
      }

      isSavingCookie.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'xueqiuCookieConfig',
              data: {
                  action: 'update',
                  cookie: xueqiuCookie.value
              }
          })

          if (!response.result?.success) throw new Error(response.result?.message || '保存失败')

          showMessage('雪球 Cookie 已保存', 'success')
          xueqiuCookie.value = ''
          await fetchCookieStatus()
          expandedCookieSource.value = null
      } catch (error: any) {
          showMessage(error.message || 'Cookie 保存失败', 'error')
      } finally {
          isSavingCookie.value = false
      }
  }

  const checkCookie = async () => {
      if (isCheckingCookie.value) return

      isCheckingCookie.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'strategyTaskGateway',
              data: { action: 'checkXueqiuCookie' }
          })
          const result = response.result || {}
          const message = result.message || result.msg || result.data?.message
          lastCookieCheck.value = formatDateObject(new Date())

          if (result.success === false || result.valid === false || result.data?.valid === false) {
              showMessage(message || 'Cookie 已失效，请重新设置', 'error')
              return
          }

          showMessage(message || 'Cookie 状态正常', 'success')
      } catch (error: any) {
          showMessage(error.message || 'Cookie 状态检查失败', 'error')
      } finally {
          isCheckingCookie.value = false
      }
  }

  const resetCookie = async () => {
      if (isResettingCookie.value) return

      isResettingCookie.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'strategyTaskGateway',
              data: { action: 'resetXueqiuCookie' }
          })
          const result = response.result || {}
          if (result.success === false) throw new Error(result.message || result.msg || 'Cookie 重置失败')
          lastCookieCheck.value = formatDateObject(new Date())
          showMessage(result.message || result.msg || '雪球 Cookie 已重置', 'success')
          await fetchCookieStatus()
      } catch (error: any) {
          showMessage(error.message || 'Cookie 重置失败', 'error')
      } finally {
          isResettingCookie.value = false
      }
  }

  const saveJisiluCookieData = async () => {
      if (!jisiluCookie.value.trim()) {
          showMessage('Cookie 不能为空', 'warning')
          return
      }

      isSavingJisiluCookie.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'jisiluCookieConfig',
              data: {
                  action: 'update',
                  cookie: jisiluCookie.value
              }
          })
          if (!response.result?.success) throw new Error(response.result?.message || '保存失败')

          showMessage('集思录 Cookie 已保存', 'success')
          jisiluCookie.value = ''
          await fetchJisiluCookieStatus()
          expandedCookieSource.value = null
      } catch (error: any) {
          showMessage(error.message || 'Cookie 保存失败', 'error')
      } finally {
          isSavingJisiluCookie.value = false
      }
  }

  const checkJisiluCookie = async () => {
      if (isCheckingJisiluCookie.value) return

      isCheckingJisiluCookie.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'strategyTaskGateway',
              data: { action: 'checkJisiluCookie' }
          })
          const result = response.result || {}
          lastJisiluCookieCheck.value = formatDateObject(new Date())
          if (result.success === false) throw new Error(result.message || 'Cookie 校验失败')
          showMessage(result.message || '集思录 Cookie 状态正常', 'success')
      } catch (error: any) {
          showMessage(error.message || 'Cookie 状态检查失败', 'error')
      } finally {
          isCheckingJisiluCookie.value = false
      }
  }

  const resetJisiluCookie = async () => {
      if (isResettingJisiluCookie.value) return

      isResettingJisiluCookie.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'strategyTaskGateway',
              data: { action: 'resetJisiluCookie' }
          })
          const result = response.result || {}
          if (result.success === false) throw new Error(result.message || 'Cookie 重置失败')
          lastJisiluCookieCheck.value = formatDateObject(new Date())
          showMessage(result.message || '集思录 Cookie 已重置', 'success')
          await fetchJisiluCookieStatus()
      } catch (error: any) {
          showMessage(error.message || 'Cookie 重置失败', 'error')
      } finally {
          isResettingJisiluCookie.value = false
      }
  }

  const saveGuorenCookieData = async () => {
      if (!guorenCookie.value.trim()) {
          showMessage('Cookie 不能为空', 'warning')
          return
      }

      isSavingGuorenCookie.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'guorenCookieConfig',
              data: {
                  action: 'update',
                  cookie: guorenCookie.value
              }
          })
          if (!response.result?.success) throw new Error(response.result?.message || '保存失败')

          showMessage('果仁 Cookie 已保存', 'success')
          guorenCookie.value = ''
          await fetchGuorenCookieStatus()
          expandedCookieSource.value = null
      } catch (error: any) {
          showMessage(error.message || 'Cookie 保存失败', 'error')
      } finally {
          isSavingGuorenCookie.value = false
      }
  }

  const checkGuorenCookie = async () => {
      if (isCheckingGuorenCookie.value) return

      isCheckingGuorenCookie.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'guorenCookieConfig',
              data: { action: 'check' }
          })
          const result = response.result || {}
          lastGuorenCookieCheck.value = formatDateObject(new Date())
          if (result.success === false) throw new Error(result.message || 'Cookie 校验失败')
          showMessage(result.message || '果仁 Cookie 状态正常', 'success')
      } catch (error: any) {
          showMessage(error.message || 'Cookie 状态检查失败', 'error')
      } finally {
          isCheckingGuorenCookie.value = false
      }
  }

  const resetGuorenCookie = async () => {
      if (isResettingGuorenCookie.value) return

      isResettingGuorenCookie.value = true
      try {
          const response: any = await callCloudFunction({
              name: 'guorenCookieConfig',
              data: { action: 'reset' }
          })
          const result = response.result || {}
          if (result.success === false) throw new Error(result.message || 'Cookie 重置失败')
          lastGuorenCookieCheck.value = formatDateObject(new Date())
          showMessage(result.message || '果仁 Cookie 已重置', 'success')
          await fetchGuorenCookieStatus()
      } catch (error: any) {
          showMessage(error.message || 'Cookie 重置失败', 'error')
      } finally {
          isResettingGuorenCookie.value = false
      }
  }

  const runRefreshTask = async (key: RefreshTaskKey) => {
      if (refreshingKey.value) return

      refreshingKey.value = key
      try {
          const callMap: Record<RefreshTaskKey, { name: string; data?: Record<string, any> }> = {
              lof: { name: 'strategyTaskGateway', data: { action: 'refreshLof' } },
              rights: { name: 'strategyTaskGateway', data: { action: 'refreshRightsStrategy' } },
              micro_cap: { name: 'strategyTaskGateway', data: { action: 'refreshMicroCap' } },
              high_dividend: { name: 'strategyTaskGateway', data: { action: 'refreshGuorenHighDividend' } },
              bond_market: { name: 'strategyTaskGateway', data: { action: 'refreshBondMarket' } }
          }
          const task = callMap[key]
          const response: any = await callCloudFunction({
              name: task.name,
              data: task.data || {},
              parse: true
          })
          const result = response.result || {}
          if (result.success === false) throw new Error(result.message || result.msg || '刷新失败')

          const current = refreshTasks.value.find(item => item.key === key)
          if (current) current.lastRun = formatDateObject(new Date())
          showMessage('刷新任务已完成', 'success')
      } catch (error: any) {
          showMessage(error.message || '刷新失败', 'error')
      } finally {
          refreshingKey.value = ''
      }
  }

  function formatDateObject(date: Date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  function formatDateTime(value: string) {
      if (!value) return '--'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return formatDateObject(date)
  }

  onMounted(() => {
      fetchUsers()
      fetchCookieStatus()
      fetchJisiluCookieStatus()
      fetchGuorenCookieStatus()
  })
</script>

<style scoped>
  :global(html),
  :global(body),
  :global(#app) {
      max-width: 100%;
      overflow-x: clip;
  }

  .page-wrapper {
      width: 100%;
      min-height: 100vh;
      padding: 32px 16px 56px;
      background: linear-gradient(180deg, #101820 0%, #17212c 45%, #101820 100%);
      color: #d8e4f2;
      box-sizing: border-box;
  }

  .main-container {
      width: min(1180px, 100%);
      margin: 0 auto;
  }

  .page-header {
      margin-bottom: 24px;
  }

  .back-button {
      display: inline-flex;
      color: #8fb3d9;
      text-decoration: none;
      margin-bottom: 18px;
  }

  .main-title {
      margin: 0;
      font-size: 34px;
      letter-spacing: 0;
      color: #f8fbff;
  }

  .title-icon {
      margin-right: 8px;
  }

  .subtitle {
      margin: 10px 0 0;
      color: #9fb2c8;
  }

  .admin-tabs {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 18px;
  }

  .admin-tab {
      border: 1px solid rgba(143, 179, 217, 0.26);
      background: rgba(255, 255, 255, 0.05);
      color: #b8c9da;
      border-radius: 8px;
      padding: 10px 16px;
      cursor: pointer;
  }

  .admin-tab.active {
      background: #2f80ed;
      color: #fff;
      border-color: #2f80ed;
  }

  .content-card {
      background: rgba(18, 29, 41, 0.92);
      border: 1px solid rgba(143, 179, 217, 0.18);
      border-radius: 8px;
      padding: 22px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
  }

  .card-header-with-toggle {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
  }

  .card-title {
      margin: 0;
      font-size: 20px;
      color: #f4f8fd;
  }

  .filter-group,
  .row-actions,
  .settings-actions,
  .pagination-buttons {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
  }

  .checkbox-label {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      color: #adbed0;
      font-size: 14px;
  }

  .search-input,
  .form-input,
  .cookie-textarea {
      width: 100%;
      border: 1px solid rgba(143, 179, 217, 0.26);
      background: rgba(5, 12, 20, 0.45);
      color: #edf5ff;
      border-radius: 8px;
      padding: 10px 12px;
      outline: none;
  }

  .search-input {
      width: 220px;
  }

  .table-wrapper {
      width: 100%;
      overflow: auto;
      border-radius: 8px;
      border: 1px solid rgba(143, 179, 217, 0.12);
  }

  .portfolio-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 920px;
  }

  .portfolio-table th,
  .portfolio-table td {
      padding: 13px 14px;
      border-bottom: 1px solid rgba(143, 179, 217, 0.12);
      text-align: left;
      vertical-align: middle;
  }

  .portfolio-table th {
      color: #9fbbe0;
      background: rgba(255, 255, 255, 0.04);
      font-weight: 600;
  }

  .sortable-header {
      cursor: pointer;
      user-select: none;
  }

  .key-cell,
  .remark-cell {
      max-width: 160px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
  }

  .subscription-tags {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
  }

  .subscription-tag {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 12px;
      color: #fff;
      background: #64748b;
  }

  .subscription-tag-momentum { background: #7c3aed; }
  .subscription-tag-convertible { background: #0284c7; }
  .subscription-tag-micro_cap { background: #16a34a; }
  .subscription-tag-rights_strategy { background: #dc2626; }
  .subscription-tag-lof_premium { background: #d97706; }

  .action-button,
  .button-primary,
  .button-secondary,
  .pagination-button {
      border: 0;
      border-radius: 8px;
      padding: 9px 13px;
      cursor: pointer;
      color: #fff;
      background: #334155;
      white-space: nowrap;
  }

  .button-primary,
  .edit-button {
      background: #2f80ed;
  }

  .button-secondary {
      background: rgba(148, 163, 184, 0.22);
      color: #dbe7f4;
  }

  button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
  }

  .pagination-controls {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-top: 16px;
      flex-wrap: wrap;
  }

  .pagination-button.active {
      background: #2f80ed;
  }

  .total-count,
  .form-help {
      color: #9fb2c8;
      font-size: 13px;
  }

  .no-data {
      text-align: center;
      color: #9fb2c8;
      padding: 32px;
  }

  .settings-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
      gap: 18px;
  }

  .settings-panel,
  .refresh-card {
      border: 1px solid rgba(143, 179, 217, 0.14);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.035);
      padding: 18px;
  }

  .form-label {
      display: block;
      margin-bottom: 8px;
      color: #c9d8e8;
      font-weight: 600;
  }

  .cookie-textarea {
      min-height: 180px;
      resize: vertical;
      font-family: Consolas, Monaco, monospace;
      line-height: 1.5;
  }

  .status-pill {
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 13px;
  }

  .status-pill.success {
      color: #bbf7d0;
      background: rgba(34, 197, 94, 0.16);
  }

  .status-pill.warning {
      color: #fde68a;
      background: rgba(245, 158, 11, 0.16);
  }

  .summary-panel h3,
  .refresh-card h3 {
      margin: 0 0 12px;
      color: #eef6ff;
  }

  .summary-panel dl {
      margin: 0;
  }

  .summary-panel dl div {
      display: grid;
      grid-template-columns: 90px 1fr;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(143, 179, 217, 0.12);
  }

  .summary-panel dt {
      color: #9fb2c8;
  }

  .summary-panel dd {
      margin: 0;
      color: #e8f1fb;
      word-break: break-all;
  }

  .refresh-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
  }

  .refresh-card {
      display: flex;
      min-height: 190px;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
  }

  .refresh-card p,
  .refresh-time {
      color: #9fb2c8;
      line-height: 1.6;
  }

  .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(2, 6, 12, 0.68);
  }

  .modal-content {
      width: min(560px, 100%);
      max-height: 90vh;
      overflow: auto;
      border-radius: 8px;
      border: 1px solid rgba(143, 179, 217, 0.22);
      background: #142131;
      color: #d8e4f2;
  }

  .edit-modal-content {
      width: min(680px, 100%);
  }

  .modal-header,
  .modal-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 18px 20px;
      border-bottom: 1px solid rgba(143, 179, 217, 0.12);
  }

  .modal-footer {
      justify-content: flex-end;
      border-top: 1px solid rgba(143, 179, 217, 0.12);
      border-bottom: 0;
  }

  .modal-header h3 {
      margin: 0;
  }

  .modal-close-button {
      border: 0;
      background: transparent;
      color: #cdd9e8;
      font-size: 24px;
      cursor: pointer;
  }

  .modal-body,
  .modal-form {
      padding: 20px;
  }

  .modal-form {
      display: grid;
      gap: 16px;
  }

  .form-group {
      display: grid;
      gap: 8px;
  }

  .form-group label {
      color: #c9d8e8;
      font-weight: 600;
  }

  .info-text {
      margin: 0;
      color: #eef6ff;
  }

  .info-text.highlight {
      color: #93c5fd;
      font-weight: 700;
  }

  .remark-input {
      min-height: 100px;
      resize: vertical;
  }

  .character-count {
      color: #8ba2b7;
      text-align: right;
      font-size: 12px;
  }

  .admin-notification-options {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
  }

  .admin-notification-option {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      color: #d8e4f2;
  }

  .admin-notification-popover {
      position: absolute;
      left: 0;
      bottom: calc(100% + 8px);
      z-index: 2;
      display: none;
      width: min(320px, 80vw);
      padding: 12px;
      border-radius: 8px;
      background: #0f172a;
      box-shadow: 0 18px 38px rgba(0, 0, 0, 0.32);
      color: #dbeafe;
      line-height: 1.5;
  }

  .admin-notification-popover span,
  .admin-notification-popover em {
      display: block;
      margin-top: 6px;
      color: #b8c7d9;
  }

  .admin-notification-option:hover .admin-notification-popover,
  .admin-notification-option:focus-within .admin-notification-popover {
      display: block;
  }

  .modal-fade-enter-active,
  .modal-fade-leave-active {
      transition: opacity 0.18s ease;
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
      opacity: 0;
  }

  @media (max-width: 860px) {
      .card-header-with-toggle,
      .settings-grid,
      .refresh-grid {
          grid-template-columns: 1fr;
      }

      .card-header-with-toggle {
          display: grid;
      }

      .refresh-grid {
          display: grid;
      }

      .settings-grid {
          display: grid;
      }

      .admin-notification-options {
          grid-template-columns: 1fr;
      }

      .search-input {
          width: 100%;
      }
  }

  /* Visual alignment with strategy detail pages */
  .page-wrapper {
      padding: 2.5rem 1rem 4rem;
      overflow-x: clip;
      max-width: 100%;
      box-sizing: border-box;
      color: #f4f7fb;
      background: #121212;
  }

  .main-container {
      width: min(1120px, 100%);
      max-width: 100%;
      overflow: clip;
      box-sizing: border-box;
  }

  .page-header {
      margin-bottom: 2.2rem;
      text-align: center;
      animation: fade-in-up 0.45s ease-out forwards;
  }

  .back-button {
      display: inline-block;
      margin-bottom: 1rem;
      color: #b0c4de;
      font-size: 0.9rem;
      transition: color 0.2s ease;
  }

  .back-button:hover {
      color: #0af;
  }

  .main-title {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 0 0.6rem;
      color: #fff;
      font-size: 2.5rem;
      font-weight: 700;
      gap: 1rem;
  }

  .title-icon {
      display: inline-grid;
      width: 50px;
      height: 50px;
      margin: 0;
      color: #d7f5ff;
      background: rgb(0 170 255 / 12%);
      border: 1px solid rgb(0 170 255 / 34%);
      border-radius: 12px;
      box-shadow: 0 0 18px rgb(0 170 255 / 16%);
      place-items: center;
      font-size: 1.6rem;
  }

  .subtitle {
      margin: 0;
      color: #b0c4de;
      font-size: 1rem;
  }

  .admin-tabs {
      display: grid;
      margin-bottom: 1.5rem;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.75rem;
      animation: fade-in-up 0.45s ease-out 0.06s both;
  }

  .admin-tab {
      display: grid;
      min-height: 70px;
      padding: 0.85rem 1rem;
      color: #b0c4de;
      text-align: left;
      background: rgb(0 0 0 / 22%);
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 8px;
      transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
      gap: 0.2rem;
  }

  .admin-tab strong {
      color: #f4f7fb;
      font-size: 0.98rem;
  }

  .admin-tab span {
      overflow: hidden;
      color: #8392a5;
      font-size: 0.78rem;
      text-overflow: ellipsis;
      white-space: nowrap;
  }

  .admin-tab:hover,
  .admin-tab.active {
      color: #0af;
      background: rgb(0 170 255 / 10%);
      border-color: rgb(0 170 255 / 55%);
  }

  .admin-tab.active strong {
      color: #fff;
  }

  .admin-tab.active span {
      color: #9bdcff;
  }

  .content-card {
      padding: 1.25rem;
      overflow: hidden;
      box-sizing: border-box;
      background: rgb(255 255 255 / 5%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 12px;
      box-shadow: none;
      backdrop-filter: blur(10px);
      animation: fade-in-up 0.45s ease-out 0.1s both;
  }

  .content-card:hover {
      border-color: rgb(0 170 255 / 38%);
  }

  .admin-section + .admin-section {
      margin-top: 1.25rem;
  }

  .cookie-config-card {
      padding: 1rem 1.1rem;
  }

  .cookie-config-card + .cookie-config-card {
      margin-top: 0.75rem;
  }

  .cookie-config-card.expanded {
      border-color: rgb(0 170 255 / 38%);
  }

  .cookie-config-card .card-header-with-toggle {
      align-items: center;
      margin-bottom: 0.75rem;
  }

  .cookie-card-summary-toggle {
      border-radius: 8px;
      outline: none;
      cursor: pointer;
  }

  .cookie-card-summary-toggle:focus-visible {
      box-shadow: 0 0 0 2px rgb(0 170 255 / 28%);
  }

  .cookie-card-state {
      display: flex;
      justify-content: flex-end;
      align-items: center;
  }

  .cookie-summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.65rem;
  }

  .cookie-summary-item {
      display: grid;
      padding: 0.62rem 0.75rem;
      min-width: 0;
      background: rgb(0 0 0 / 16%);
      border: 1px solid rgb(255 255 255 / 8%);
      border-radius: 6px;
      gap: 0.25rem;
  }

  .cookie-summary-item span {
      font-size: 0.76rem;
      color: #8392a5;
  }

  .cookie-summary-item strong {
      overflow: hidden;
      font-size: 0.86rem;
      color: #e8f1fb;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
  }

  .cookie-editor-panel {
      margin-top: 0.85rem;
  }

  .cookie-editor-panel .cookie-textarea {
      min-height: 130px;
  }

  .card-header-with-toggle {
      align-items: flex-start;
      margin-bottom: 1.2rem;
      gap: 1rem;
  }

  .card-title {
      padding-left: 1rem;
      margin: 0 0 0.5rem;
      color: #fff;
      border-left: 4px solid #0af;
      font-size: 1.24rem;
      font-weight: 700;
  }

  .card-description {
      margin: 0;
      max-width: 680px;
      color: #b0c4de;
      font-size: 0.92rem;
      line-height: 1.7;
  }

  .filter-group {
      align-items: center;
      justify-content: flex-end;
      padding: 0.55rem;
      background: rgb(0 0 0 / 18%);
      border: 1px solid rgb(255 255 255 / 8%);
      border-radius: 8px;
  }

  .checkbox-label {
      min-height: 38px;
      color: #b0c4de;
      font-size: 0.86rem;
      white-space: nowrap;
      gap: 0.45rem;
  }

  .filter-checkbox,
  .admin-notification-option input {
      width: 16px;
      height: 16px;
      accent-color: #0af;
  }

  .search-input,
  .form-input,
  .cookie-textarea {
      color: #fff;
      background: rgb(0 0 0 / 28%);
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 6px;
      padding: 0.72rem 0.85rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
  }

  .search-input:focus,
  .form-input:focus,
  .cookie-textarea:focus {
      border-color: rgb(0 170 255 / 65%);
      box-shadow: 0 0 0 3px rgb(0 170 255 / 12%);
  }

  .search-input {
      width: 210px;
  }

  .table-wrapper {
      background: rgb(0 0 0 / 14%);
      border: 1px solid rgb(255 255 255 / 9%);
      overflow-x: hidden;
      max-width: 100%;
      box-sizing: border-box;
  }

  .portfolio-table th,
  .portfolio-table td {
      padding: 0.72rem 0.78rem;
      color: #b0c4de;
      border-bottom: 1px solid rgb(255 255 255 / 8%);
      font-size: 0.84rem;
      box-sizing: border-box;
  }

  .portfolio-table th {
      color: #fff;
      background: rgb(0 0 0 / 20%);
      font-size: 0.82rem;
      font-weight: 700;
      white-space: nowrap;
  }

  .portfolio-table tr:last-child td {
      border-bottom: 0;
  }

  .portfolio-table tbody tr:hover td {
      background: rgb(255 255 255 / 3%);
  }

  .subscription-tag {
      min-height: 21px;
      padding: 0.12rem 0.42rem;
      font-size: 0.7rem;
      border: 1px solid transparent;
  }

  .subscription-tag-momentum {
      color: #ffd3c5;
      background: rgb(255 87 34 / 18%);
      border-color: rgb(255 87 34 / 24%);
  }

  .subscription-tag-convertible {
      color: #d6f4ff;
      background: rgb(0 170 255 / 16%);
      border-color: rgb(0 170 255 / 24%);
  }

  .subscription-tag-micro_cap {
      color: #f7f0b2;
      background: rgb(240 230 140 / 14%);
      border-color: rgb(240 230 140 / 25%);
  }

  .subscription-tag-rights_strategy {
      color: #ffd2d2;
      background: rgb(239 68 68 / 16%);
      border-color: rgb(239 68 68 / 24%);
  }

  .subscription-tag-lof_premium {
      color: #ccf7ff;
      background: rgb(45 212 191 / 14%);
      border-color: rgb(45 212 191 / 24%);
  }

  .action-button,
  .button-primary,
  .button-secondary,
  .pagination-button {
      min-height: 32px;
      padding: 0.38rem 0.62rem;
      color: #d7e8fb;
      background: rgb(255 255 255 / 6%);
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 6px;
      transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
      font-weight: 600;
  }

  .button-primary,
  .edit-button {
      color: #dff6ff;
      background: rgb(0 170 255 / 10%);
      border-color: rgb(0 170 255 / 45%);
  }

  .action-button:hover:not(:disabled),
  .button-primary:hover:not(:disabled),
  .button-secondary:hover:not(:disabled),
  .pagination-button:hover:not(:disabled) {
      color: #fff;
      background: rgb(255 255 255 / 11%);
      border-color: rgb(0 170 255 / 45%);
  }

  .button-secondary {
      color: #cfdbe8;
      background: rgb(0 0 0 / 18%);
  }

  .pagination-controls {
      margin-top: 1rem;
      gap: 0.8rem;
  }

  .pagination-button.active {
      color: #fff;
      background: rgb(0 170 255 / 14%);
      border-color: rgb(0 170 255 / 55%);
  }

  .total-count,
  .form-help {
      color: #8392a5;
      font-size: 0.82rem;
      line-height: 1.7;
  }

  .settings-grid {
      align-items: stretch;
      grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
      gap: 1rem;
  }

  .settings-panel,
  .refresh-card {
      position: relative;
      overflow: hidden;
      padding: 1rem;
      background: rgb(0 0 0 / 16%);
      border: 1px solid rgb(255 255 255 / 9%);
      border-radius: 8px;
  }

  .form-label {
      margin-bottom: 0.55rem;
      color: #f4f7fb;
  }

  .cookie-textarea {
      min-height: 210px;
  }

  .status-pill {
      align-self: flex-start;
      padding: 0.34rem 0.65rem;
      border: 1px solid transparent;
      font-size: 0.8rem;
      white-space: nowrap;
  }

  .status-pill.success {
      color: #b8fff8;
      background: rgb(78 205 196 / 12%);
      border-color: rgb(78 205 196 / 28%);
  }

  .status-pill.warning {
      color: #ffe7a4;
      background: rgb(244 201 93 / 12%);
      border-color: rgb(244 201 93 / 28%);
  }

  .summary-panel h3,
  .refresh-card h3 {
      margin: 0 0 0.8rem;
      color: #fff;
      font-size: 1rem;
  }

  .summary-panel dl div {
      grid-template-columns: 86px minmax(0, 1fr);
      padding: 0.7rem 0;
      border-bottom: 1px solid rgb(255 255 255 / 8%);
      gap: 0.75rem;
  }

  .summary-panel dt {
      color: #8392a5;
  }

  .summary-panel dd {
      color: #e8eef5;
  }

  .refresh-grid {
      gap: 1rem;
  }

  .refresh-card {
      min-height: 210px;
      gap: 1rem;
  }

  .refresh-card::before {
      content: '';
      display: block;
      width: 36px;
      height: 3px;
      margin-bottom: 0.2rem;
      background: #0af;
      border-radius: 999px;
  }

  .refresh-card p,
  .refresh-time {
      color: #b0c4de;
  }

  .refresh-card p {
      margin: 0;
      font-size: 0.9rem;
  }

  .refresh-time {
      display: inline-flex;
      margin-top: 0.8rem;
      color: #8392a5;
      font-size: 0.8rem;
  }

  .modal-backdrop {
      background: rgb(0 0 0 / 68%);
      backdrop-filter: blur(10px);
  }

  .modal-content {
      color: #f4f7fb;
      background: #101925;
      border: 1px solid rgb(124 201 255 / 20%);
      border-radius: 12px;
      box-shadow: 0 24px 80px rgb(0 0 0 / 42%);
  }

  .modal-header,
  .modal-footer {
      padding: 1rem 1.2rem;
      border-color: rgb(255 255 255 / 8%);
      gap: 0.8rem;
  }

  .modal-close-button {
      display: inline-grid;
      width: 32px;
      height: 32px;
      color: #b8cce2;
      background: rgb(255 255 255 / 6%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 8px;
      place-items: center;
      font-size: 1.2rem;
  }

  .modal-body,
  .modal-form {
      padding: 1.2rem;
  }

  .form-group label {
      color: #dce8f5;
  }

  .info-text.highlight {
      color: #0af;
  }

  .admin-notification-option {
      padding: 0.7rem;
      background: rgb(0 0 0 / 18%);
      border: 1px solid rgb(255 255 255 / 8%);
  }

  .admin-notification-popover {
      background: #101925;
      border: 1px solid rgb(124 201 255 / 20%);
      box-shadow: 0 18px 45px rgb(0 0 0 / 35%);
  }

  @keyframes fade-in-up {
      from {
          opacity: 0;
          transform: translateY(16px);
      }

      to {
          opacity: 1;
          transform: translateY(0);
      }
  }

  @media (max-width: 860px) {
      .refresh-grid {
          grid-template-columns: 1fr;
      }

      .settings-grid {
          grid-template-columns: 1fr;
      }

      .filter-group {
          justify-content: stretch;
      }

      .overview-item {
          border-right: 0;
          border-bottom: 1px solid rgb(255 255 255 / 8%);
      }

      .overview-item:last-child {
          border-bottom: 0;
      }
  }

  @media (max-width: 640px) {
      .page-wrapper {
          padding: 2rem 0.8rem 3rem;
      }

      .admin-tabs {
          grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .card-header-with-toggle {
          display: flex;
          align-items: stretch;
          flex-direction: column;
      }

      .cookie-config-card .card-header-with-toggle {
          align-items: stretch;
      }

      .cookie-card-state {
          justify-content: flex-start;
      }

      .cookie-summary-grid {
          grid-template-columns: 1fr;
      }

      .main-title {
          font-size: 2rem;
      }

      .title-icon {
          width: 44px;
          height: 44px;
      }

      .content-card {
          padding: 1rem;
      }

      .card-title {
          font-size: 1.15rem;
      }

      .settings-actions,
      .row-actions,
      .pagination-controls {
          align-items: stretch;
      }

      .settings-actions > button,
      .row-actions > button {
          flex: 1 1 auto;
      }
  }

  @media (max-width: 420px) {
      .admin-tabs {
          grid-template-columns: 1fr;
      }
  }

  .main-title .title-icon {
      width: 52px;
      height: 52px;
      margin: 0;
      color: #0af;
      background: transparent;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      filter: drop-shadow(0 0 12px rgb(0 170 255 / 42%));
      font-size: initial;
  }

  .portfolio-table {
      min-width: 0;
      table-layout: fixed;
  }

  .portfolio-table th:nth-child(1),
  .portfolio-table td:nth-child(1) {
      width: 128px;
      padding-left: 1.1rem;
  }

  .portfolio-table th:nth-child(2),
  .portfolio-table td:nth-child(2) {
      width: 96px;
  }

  .portfolio-table th:nth-child(3),
  .portfolio-table td:nth-child(3) {
      width: 250px;
  }

  .portfolio-table th:nth-child(4),
  .portfolio-table td:nth-child(4) {
      width: 86px;
  }

  .portfolio-table th:nth-child(5),
  .portfolio-table td:nth-child(5) {
      width: 145px;
      white-space: nowrap;
  }

  .portfolio-table th:nth-child(6),
  .portfolio-table td:nth-child(6) {
      width: 150px;
      padding-right: 1.15rem;
  }

  .channel-cell {
      min-width: 0;
      white-space: nowrap;
  }

  .channel-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.16rem 0.45rem;
      margin-right: 0.45rem;
      color: #dff6ff;
      background: rgb(0 170 255 / 10%);
      border: 1px solid rgb(0 170 255 / 34%);
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      vertical-align: middle;
      white-space: nowrap;
  }

  .subscription-tags {
      flex-wrap: nowrap;
      overflow: hidden;
  }

  .subscription-tag {
      white-space: nowrap;
  }

  .row-actions {
      flex-wrap: nowrap;
      gap: 0.5rem;
      justify-content: flex-start;
  }

  .row-actions .action-button {
      padding-right: 0.65rem;
      padding-left: 0.65rem;
  }
</style>
