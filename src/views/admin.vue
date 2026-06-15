<template>
  <div class="page-wrapper">
    <div class="main-container">

      <div class="page-header">
        <router-link to="/home" class="back-button">
          ← 返回主页
        </router-link>

        <h1 class="main-title">
          <span class="title-icon">👥</span>
          用户管理
        </h1>
        <p class="subtitle">
          管理会员状态、通知渠道和用户备注。
        </p>
      </div>

      <div class="content-grid">

        <div class="content-card">
          <div class="card-header-with-toggle">
            <h2 class="card-title no-border">用户数据列表</h2>

            <div class="filter-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="onlyActive" class="filter-checkbox" />
                <span>仅显示生效会员</span>
              </label>

              <div class="filter-container">
                <input type="text" v-model="searchPhone" placeholder="按手机号筛选..." class="search-input" />
              </div>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>手机号</th>
                  <th>Bark ID</th>
                  <th>企业微信 ID</th>
                  <th>通知策略</th>
                  <th>备注</th>
                  <th class="sortable-header" @click="toggleSort">
                    会员到期日
                    <span class="sort-icon" v-if="sortOrder === 'asc'">↑</span>
                    <span class="sort-icon" v-else-if="sortOrder === 'desc'">↓</span>
                    <span class="sort-icon" v-else>↕</span>
                  </th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td colspan="7" class="no-data">正在加载用户数据...</td>
                </tr>
                <tr v-else v-for="user in users" :key="user.id">
                  <td>{{ user.phone }}</td>
                  <td class="key-cell" :title="user.barkKey">{{ user.barkKey || '-' }}</td>
                  <td class="key-cell" :title="user.wechatWebhookKey">{{ user.wechatWebhookKey || '-' }}</td>
                  <td class="subscription-cell">
                    <div v-if="activeSubscriptionLabels(user).length" class="subscription-tags">
                      <span
                        v-for="subscription in activeSubscriptionLabels(user)"
                        :key="subscription.key"
                        :class="['subscription-tag', `subscription-tag-${subscription.key}`]">
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

          <div class="pagination-controls" v-if="totalPages > 0">
            <span class="total-count">共 {{ totalUsers }} 条</span>
            <div class="pagination-buttons">
              <button @click="prevPage" :disabled="currentPage === 1" class="pagination-button">
                &lt;
              </button>
              <button v-for="page in totalPages" :key="page" @click="goToPage(page)"
                :class="['pagination-button', { active: currentPage === page }]">
                {{ page }}
              </button>
              <button @click="nextPage" :disabled="currentPage === totalPages" class="pagination-button">
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
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
                <label>当前用户手机号:</label>
                <p class="info-text">{{ selectedUser.phone }}</p>
              </div>
              <div class="form-group">
                <label>当前到期时间:</label>
                <p class="info-text">{{ selectedUser.membershipExpiry }}</p>
              </div>
              <div class="form-group">
                <label for="weeks-input">调整天数 (正数增加，负数扣减):</label>
                <input id="weeks-input" type="number" v-model.number="daysToAdd" class="form-input" placeholder="例如: 30 或 -7" />
              </div>
              <div class="form-group" v-if="newExpiryDate">
                <label>调整后到期时间:</label>
                <p class="info-text highlight">{{ newExpiryDate }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="button-secondary" @click="closeModal">取消</button>
            <button class="button-primary" @click="confirmRenewal" :disabled="!daysToAdd || daysToAdd === 0">
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
                @input="handleAdminBarkInput"
                placeholder="未配置">
            </div>
            <div class="form-group">
              <label for="admin-wechat-key">企业微信 ID（iOS / Android）</label>
              <input
                id="admin-wechat-key"
                v-model.trim="editForm.wechatWebhookKey"
                class="form-input"
                type="text"
                @input="handleAdminWechatInput"
                placeholder="可填写 Key 或完整 Webhook 地址">
              <span class="form-help">Bark ID 和企业微信 ID 只能填写一个。</span>
            </div>
            <div class="form-group">
              <label>通知策略</label>
              <div class="admin-notification-options">
                <div v-for="option in subscriptionOptions" :key="option.key" class="admin-notification-option">
                  <input v-model="editForm.subscriptions[option.key]" type="checkbox">
                  <span class="admin-notification-option-title">{{ option.label }}</span>
                  <span class="admin-notification-popover">
                    <strong>{{ option.label }}</strong>
                    <span><b>触发：</b>{{ option.trigger }}</span>
                    <span><b>内容：</b>{{ option.content }}</span>
                    <em>示例：{{ option.example }}</em>
                  </span>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label for="admin-user-remark">备注</label>
              <textarea
                id="admin-user-remark"
                v-model="editForm.remark"
                class="form-input remark-input"
                maxlength="500"
                placeholder="会员昵称、沟通记录等"></textarea>
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
  import { ref, computed, watch, onMounted, inject } from 'vue'
  import app from '@/lib/cloudbase'

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
  }

  // --- 响应式数据 ---
  const users = ref<User[]>([])
  const searchPhone = ref('')
  const isLoading = ref(true)

  // 新增：筛选和排序状态
  const onlyActive = ref(true) // 默认仅显示生效会员
  const sortOrder = ref<'asc' | 'desc' | ''>('asc') // 默认按会员到期日升序，临近到期排前面

  // --- 分页状态 ---
  const currentPage = ref(1)
  const itemsPerPage = ref(8)
  const totalUsers = ref(0)
  let debounceTimer: any = null

  const totalPages = computed(() => Math.ceil(totalUsers.value / itemsPerPage.value))

  // --- 核心：获取数据 ---
  const fetchUsers = () => {
      isLoading.value = true
      app.callFunction({
          name: 'getUsers',
          parse: true,
          data: {
              searchPhone: searchPhone.value,
              page: currentPage.value,
              limit: itemsPerPage.value,
              // 新增传参
              onlyActive: onlyActive.value,
              sortOrder: sortOrder.value
          }
      })
          .then((res: any) => {
              if (res.result && res.result.success) {
                  users.value = res.result.data.users
                  totalUsers.value = res.result.data.total
              } else {
                  console.log(res)
                  showMessage(res.result.message || '获取失败', 'error')
                  users.value = []
                  totalUsers.value = 0
              }
          })
          .catch((err: any) => {
              showMessage('网络错误，无法加载用户数据', 'error')
              users.value = []
              totalUsers.value = 0
          })
          .finally(() => {
              isLoading.value = false
          })
  }

  // --- 排序逻辑 ---
  const toggleSort = () => {
      // 切换顺序：升序 -> 降序 -> 无排序 -> 升序
      if (sortOrder.value === 'asc') {
          sortOrder.value = 'desc'
      } else if (sortOrder.value === 'desc') {
          sortOrder.value = ''
      } else {
          sortOrder.value = 'asc'
      }
      // 重置到第一页并查询
      currentPage.value = 1
      fetchUsers()
  }

  // --- 生命周期 ---
  onMounted(() => {
      fetchUsers()
  })

  // --- 监听器 ---

  // 监听仅看会员开关
  watch(onlyActive, () => {
      currentPage.value = 1
      fetchUsers()
  })

  // 监听搜索输入
  watch(searchPhone, newValue => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
          if (currentPage.value !== 1) {
              currentPage.value = 1
          } else {
              fetchUsers()
          }
      }, 500)
  })

  // 监听页码
  watch(currentPage, () => {
      fetchUsers()
  })

  // --- 分页方法 ---
  const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages.value) {
          currentPage.value = page
      }
  }
  const prevPage = () => goToPage(currentPage.value - 1)
  const nextPage = () => goToPage(currentPage.value + 1)
  // --- 模态框逻辑 ---
  const isModalVisible = ref(false)
  const selectedUser = ref<User | null>(null)
  const daysToAdd = ref<number | null>(null)

  const openRenewalModal = (user: User) => {
      selectedUser.value = user
      isModalVisible.value = true
  }

  const closeModal = () => {
      isModalVisible.value = false
      selectedUser.value = null
      daysToAdd.value = null
  }

  const newExpiryDate = computed(() => {
      if (!selectedUser.value || daysToAdd.value === null || daysToAdd.value === 0) return ''

      const isNewUserOrExpired =
          selectedUser.value.membershipExpiry === '未设置' ||
          new Date(selectedUser.value.membershipExpiry) < new Date()

      // 如果是扣减时间（负数），通常是基于当前有效时间扣减
      // 如果用户已过期，baseDate 为 now；如果未过期，baseDate 为 expiry
      const startDate = isNewUserOrExpired
          ? new Date()
          : new Date(selectedUser.value.membershipExpiry)

      // 核心计算（JS Date 自动处理负数）
      startDate.setDate(startDate.getDate() + daysToAdd.value)

      const year = startDate.getFullYear()
      const month = (startDate.getMonth() + 1).toString().padStart(2, '0')
      const day = startDate.getDate().toString().padStart(2, '0')
      const hours = startDate.getHours().toString().padStart(2, '0')
      const minutes = startDate.getMinutes().toString().padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}`
  })

  const confirmRenewal = () => {
      if (!selectedUser.value || !daysToAdd.value) return

      app.callFunction({
          name: 'renewMembership',
          parse: true,
          data: {
              userId: selectedUser.value.id,
              daysToAdd: daysToAdd.value // 支持负数
          }
      })
          .then((res: any) => {
              if (res.result && res.result.success) {
                  showMessage('操作成功！', 'success')
                  closeModal()
                  fetchUsers()
              } else {
                  showMessage(res.result.message || '操作失败', 'error')
              }
          })
          .catch((err: any) => {
              console.error(err)
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

  const subscriptionOptions = [
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
          example: '交易日：2026-06-15；卖出：A公司(600000) 含权值:12.34；买入：B公司(000001) 含权值:15.20。'
      },
      {
          key: 'momentum',
          label: '动量策略',
          tagLabel: '动量',
          trigger: '交易日 14:50 触发调仓；当动量标的切换时通知。',
          content: '卖出标的、买入标的、买入代码、近 20 日涨幅和调仓日期。',
          example: '卖出：中证1000价值ETF华夏；买入：纳指100ETF招商(159659)；近20日涨幅：6.23%。'
      },
      {
          key: 'micro_cap',
          label: '微盘股策略',
          tagLabel: '微盘股',
          trigger: '微盘股数据更新完成后通知。',
          content: '提醒数据已更新，并附带更新时间。',
          example: '微盘股数据已更新，请及时查看最新持仓。更新时间：2026-06-15 09:30:08。'
        },
      {
          key: 'lof_premium',
          label: 'LOF 溢价',
          tagLabel: 'LOF溢价',
          trigger: '交易日 14:30，从实时 LOF 刷新结果里筛选符合条件的基金。',
          content: '名称、代码、T-2/T-1/实时溢价率；条件为可申购、申购额度小于 1 万元、实时溢价率大于 0。',
          example: 'XXLOF(161000) T-2:1.20% T-1:0.85% 实时:1.56%。'
      }
  ] as const

  function emptySubscriptions(): NotificationSubscriptions {
      return {
          momentum: false,
          convertible: false,
          micro_cap: false,
          rights_strategy: false,
          lof_premium: false
      }
  }

  const activeSubscriptionLabels = (user: User) =>
      subscriptionOptions.filter(option => user.subscriptions?.[option.key] === true)

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
              lof_premium: user.subscriptions?.lof_premium === true
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
          const response: any = await app.callFunction({
              name: 'updateAdminUser',
              data: {
                  userId: editingUser.value.id,
                  barkKey: editForm.value.barkKey,
                  wechatWebhookKey: editForm.value.wechatWebhookKey,
                  subscriptions: { ...editForm.value.subscriptions },
                  remark: editForm.value.remark
              }
          })

          if (!response.result?.success) {
              throw new Error(response.result?.message || '保存失败')
          }

          showMessage('用户资料已更新', 'success')
          closeEditModal()
          fetchUsers()
      } catch (error: any) {
          console.error('更新用户资料失败:', error)
          showMessage(error.message || '保存失败', 'error')
      } finally {
          isSavingUser.value = false
      }
  }
</script>

<style scoped>
  /* 基础动画 */
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

  /* 页面容器 */
  .page-wrapper {
      display: flex;
      justify-content: center;
      box-sizing: border-box;
      width: 100%;
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: 100vh;
      padding: 3rem 1rem;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
  }

  .main-container {
      width: min(1400px, 100%);
      max-width: 1400px;
      margin: 0 auto;
  }

  /* 头部样式 */
  .page-header {
      text-align: center;
      margin-bottom: 3rem;
      animation: fadeInUp 0.5s ease-out forwards;
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
      color: #00aaff;
  }
  .subtitle {
      font-size: 1.1rem;
      color: #b0c4de;
  }

  /* 卡片样式 */
  .content-grid {
      display: grid;
      min-width: 0;
      gap: 1.5rem;
  }
  .content-card {
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem 2rem;
      backdrop-filter: blur(10px);
      animation: fadeInUp 0.5s ease-out forwards;
      animation-delay: 0.2s;
      opacity: 0;
  }

  /* 筛选区域样式 (Modified) */
  .card-header-with-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap; /* 允许换行 */
      gap: 1rem;
  }
  .card-title.no-border {
      font-size: 1.4rem;
      margin: 0;
  }
  .filter-group {
      display: flex;
      align-items: center;
      gap: 1rem;
  }
  .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #b0c4de;
      font-size: 0.9rem;
      cursor: pointer;
      user-select: none;
  }
  .filter-checkbox {
      cursor: pointer;
      width: 16px;
      height: 16px;
  }
  .search-input {
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      color: #fff;
      font-size: 0.9rem;
      min-width: 200px;
  }

  /* 表格样式 */
  .table-wrapper {
      overflow-x: auto;
      width: 100%;
  }
  .portfolio-table {
      width: 100%;
      min-width: 1180px;
      border-collapse: collapse;
  }
  .portfolio-table th,
  .portfolio-table td {
      padding: 0.9rem 1rem;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .portfolio-table th {
      color: #ffffff;
      font-weight: bold;
  }
  /* 排序表头样式 */
  .sortable-header {
      cursor: pointer;
      user-select: none;
      transition: color 0.2s;
  }
  .sortable-header:hover {
      color: #00aaff;
  }
  .sort-icon {
      margin-left: 4px;
      font-size: 0.8em;
      color: #00aaff;
  }

  .portfolio-table td {
      color: #b0c4de;
      vertical-align: middle;
  }

  .key-cell,
  .remark-cell {
      max-width: 170px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
  }

  .key-cell {
      font-family: monospace;
      font-size: 0.82rem;
  }

  .remark-cell {
      max-width: 220px;
  }

  .subscription-cell {
      min-width: 190px;
  }

  .subscription-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
  }

  .subscription-tag {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
      border: 1px solid transparent;
      border-radius: 999px;
      white-space: nowrap;
  }

  .subscription-tag-momentum {
      color: #bde9ff;
      background: rgb(0 170 255 / 16%);
      border-color: rgb(0 170 255 / 38%);
  }

  .subscription-tag-convertible {
      color: #dfd0ff;
      background: rgb(139 92 246 / 16%);
      border-color: rgb(139 92 246 / 38%);
  }

  .subscription-tag-micro_cap {
      color: #bff5d2;
      background: rgb(34 197 94 / 16%);
      border-color: rgb(34 197 94 / 38%);
  }

  .subscription-tag-rights_strategy {
      color: #ffefb8;
      background: rgb(245 158 11 / 16%);
      border-color: rgb(245 158 11 / 38%);
  }

  .subscription-tag-lof_premium {
      color: #c7f9ff;
      background: rgb(20 184 166 / 16%);
      border-color: rgb(20 184 166 / 38%);
  }
  .portfolio-table tr:last-child td {
      border-bottom: none;
  }
  .no-data {
      padding: 2rem;
      color: #888;
  }
  .action-button {
      background-color: #00aaff;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.4rem 1rem;
      cursor: pointer;
      font-size: 0.9rem;
      white-space: nowrap;
  }

  .row-actions {
      display: flex;
      justify-content: flex-start;
      gap: 0.5rem;
  }

  .edit-button {
      color: #e8ddff;
      background-color: #7656d6;
  }

  /* 分页样式 */
  .pagination-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  .total-count {
      font-size: 0.9rem;
      color: #b0c4de;
  }
  .pagination-buttons {
      display: flex;
      gap: 0.5rem;
  }
  .pagination-button {
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
      border-radius: 6px;
      min-width: 36px;
      height: 36px;
      cursor: pointer;
  }
  .pagination-button.active {
      background-color: #00aaff;
      border-color: #00aaff;
  }
  .pagination-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
  }

  /* 模态框样式 */
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
      width: 90%;
      max-width: 500px;
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
  }
  .modal-close-button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 2rem;
      cursor: pointer;
  }
  .modal-body {
      padding: 0.5rem 0;
  }
  .modal-form .form-group {
      margin-bottom: 1.25rem;
  }
  .modal-form label {
      display: block;
      color: #b0c4de;
      margin-bottom: 0.5rem;
  }
  .modal-form .info-text {
      font-size: 1rem;
      color: #fff;
  }
  .modal-form .info-text.highlight {
      color: #00aaff;
      font-weight: bold;
  }
  .modal-form .form-input {
      width: 100%;
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: #fff;
      font-size: 1rem;
      box-sizing: border-box;
  }

  .edit-modal-content {
      max-width: 560px;
  }

  .remark-input {
      min-height: 110px;
      resize: vertical;
      font-family: inherit;
      line-height: 1.6;
  }

  .character-count {
      display: block;
      margin-top: 0.35rem;
      color: #8392a5;
      font-size: 0.75rem;
      text-align: right;
  }

  .form-help {
      display: block;
      margin-top: 0.35rem;
      color: #8392a5;
      font-size: 0.78rem;
  }

  .admin-notification-options {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.6rem;
  }

  .admin-notification-option {
      position: relative;
      display: flex;
      gap: 0.55rem;
      align-items: center;
      justify-content: flex-start;
      box-sizing: border-box;
      width: 100%;
      min-height: 42px;
      padding: 0.65rem 0.75rem;
      color: #dce8f5;
      font-size: 0.82rem;
      background: rgb(255 255 255 / 6%);
      border: 1px solid rgb(255 255 255 / 10%);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: flex-start;
  }

  .admin-notification-option input {
    
      margin: 0;
  }

  .admin-notification-option-title {
        margin-left:0.4rem;
      white-space: nowrap;
  }

  .admin-notification-popover {
      position: absolute;
      left: 50%;
      bottom: calc(100% + 10px);
      z-index: 20;
      display: grid;
      gap: 0.45rem;
      width: min(310px, 82vw);
      padding: 0.8rem 0.9rem;
      color: #dce8f5;
      text-align: left;
      pointer-events: none;
      background: rgb(12 18 28 / 96%);
      border: 1px solid rgb(0 170 255 / 35%);
      border-radius: 10px;
      box-shadow: 0 12px 28px rgb(0 0 0 / 38%);
      opacity: 0;
      transform: translate(-50%, 6px);
      transition: opacity 0.18s ease, transform 0.18s ease;
  }

  .admin-notification-popover::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -6px;
      width: 10px;
      height: 10px;
      background: rgb(12 18 28 / 96%);
      border-right: 1px solid rgb(0 170 255 / 35%);
      border-bottom: 1px solid rgb(0 170 255 / 35%);
      transform: translateX(-50%) rotate(45deg);
  }

  .admin-notification-popover strong {
      color: #fff;
      font-size: 0.86rem;
  }

  .admin-notification-popover span,
  .admin-notification-popover em {
      font-size: 0.76rem;
      line-height: 1.55;
  }

  .admin-notification-popover b {
      color: #8fd8ff;
      font-weight: 700;
  }

  .admin-notification-popover em {
      color: #b9c9dc;
      font-style: normal;
  }

  .admin-notification-option:hover .admin-notification-popover,
  .admin-notification-option:focus-within .admin-notification-popover {
      opacity: 1;
      transform: translate(-50%, 0);
  }

  .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  .button-secondary,
  .button-primary {
      padding: 0.6rem 1.5rem;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
  }
  .button-secondary {
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #fff;
  }
  .button-primary {
      background-color: #00aaff;
      border: 1px solid #00aaff;
      color: #fff;
  }
  .button-primary:disabled {
      background-color: #555;
      border-color: #555;
      cursor: not-allowed;
  }
  .modal-fade-enter-active,
  .modal-fade-leave-active {
      transition: opacity 0.3s ease;
  }
  .modal-fade-enter-from,
  .modal-fade-leave-to {
      opacity: 0;
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
      .content-card {
          padding: 1.5rem 1rem;
      }
      .table-wrapper::-webkit-scrollbar {
          height: 6px;
      }
      .table-wrapper::-webkit-scrollbar-thumb {
          background: #00aaff;
          border-radius: 3px;
      }
      .portfolio-table th,
      .portfolio-table td {
          white-space: nowrap;
          padding: 0.8rem;
      }

      .card-header-with-toggle {
          flex-direction: column;
          align-items: flex-start;
      }
      .filter-group {
          width: 100%;
          flex-direction: column;
          align-items: flex-start;
      }
      .search-input {
          width: 100%;
          box-sizing: border-box;
      }

      .pagination-controls {
          flex-direction: column;
          gap: 1rem;
      }
      .pagination-buttons {
          flex-wrap: wrap;
          justify-content: center;
      }

      .modal-content {
          padding: 1.5rem 1.2rem;
          max-height: 90vh;
          overflow-y: auto;
          width: 78%;
      }
      .modal-header h3 {
          font-size: 1.2rem;
      }
      .modal-form .form-group {
          margin-bottom: 1.5rem;
      }
      .modal-form label {
          font-size: 0.9rem;
      }
      .modal-form .info-text {
          font-size: 1.05rem;
      }
      .modal-form .form-input {
          padding: 0.9rem;
          font-size: 1.05rem;
      }
      .modal-footer {
          flex-direction: column-reverse;
          gap: 0.8rem;
          margin-top: 2rem;
          padding-top: 1.2rem;
      }
      .button-secondary,
      .button-primary {
          width: 100%;
          padding: 0.9rem;
      }
      .main-title {
          font-size: 2rem;
      }
      .subtitle {
          font-size: 1rem;
      }
  }
</style>
