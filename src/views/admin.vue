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
          在这里管理所有用户信息、查询状态并进行会员续费操作。
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
                  <th>用户ID</th>
                  <th>手机号</th>
                  <th class="sortable-header" @click="toggleSort">
                    会员到期日
                    <span class="sort-icon" v-if="sortOrder === 'asc'">↑</span>
                    <span class="sort-icon" v-else-if="sortOrder === 'desc'">↓</span>
                    <span class="sort-icon" v-else>↕</span>
                  </th>
                  <th class="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td colspan="4" class="text-center no-data">正在加载用户数据...</td>
                </tr>
                <tr v-else v-for="user in users" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.phone }}</td>
                  <td>{{ user.membershipExpiry }}</td>
                  <td class="text-center">
                    <button class="action-button" @click="openRenewalModal(user)">
                      续费/调整
                    </button>
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
  }

  // --- 响应式数据 ---
  const users = ref<User[]>([])
  const searchPhone = ref('')
  const isLoading = ref(true)

  // 新增：筛选和排序状态
  const onlyActive = ref(false) // 仅显示会员
  const sortOrder = ref<'asc' | 'desc' | ''>('') // 排序方向：升序、降序、无

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
      // 切换顺序：空 -> 降序 (最近到期) -> 升序 (最远到期) -> 空
      if (sortOrder.value === '') {
          sortOrder.value = 'desc'
      } else if (sortOrder.value === 'desc') {
          sortOrder.value = 'asc'
      } else {
          sortOrder.value = ''
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
      font-family: 'Noto Sans SC', sans-serif;
      background-color: #121212;
      color: #ffffff;
      min-height: calc(100vh - 6rem);
      padding: 3rem 1rem;
      background: radial-gradient(circle at 15% 50%, #1a2a4a, transparent 40%),
          radial-gradient(circle at 85% 50%, #4a1a2a, transparent 40%), #121212;
  }

  .main-container {
      max-width: 900px;
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
      gap: 1.5rem;
  }
  .content-card {
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
  }
  .portfolio-table {
      width: 100%;
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
  .portfolio-table tr:last-child td {
      border-bottom: none;
  }
  .text-center {
      text-align: center;
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