<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 (已分离) -->
      <div class="page-header">
        <a href="#" class="back-button">← 返回仪表盘</a>
        <h1 class="main-title">
          <span class="title-icon">👥</span>
          用户管理
        </h1>
        <p class="subtitle">
          在这里管理所有用户信息、查询状态并进行会员续费操作。
        </p>
      </div>

      <!-- 2. 内容网格 -->
      <div class="content-grid">

        <!-- 用户数据列表卡片 -->
        <div class="content-card">
          <div class="card-header-with-toggle">
            <h2 class="card-title no-border">用户数据列表</h2>
            <!-- 手机号筛选输入框 -->
            <div class="filter-container">
              <input type="text" v-model="searchPhone" placeholder="按手机号筛选..." class="search-input" />
            </div>
          </div>

          <!-- 用户信息表格 -->
          <div class="table-wrapper">
            <table class="portfolio-table">
              <thead>
                <tr>
                  <th>用户ID</th>
                  <th>手机号</th>
                  <th>会员到期日</th>
                  <th class="text-center">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paginatedUsers.length === 0">
                  <td colspan="4" class="text-center no-data">
                    {{ searchPhone ? '没有找到匹配的用户' : '暂无用户数据' }}
                  </td>
                </tr>
                <tr v-for="user in paginatedUsers" :key="user.id">
                  <td>{{ user.id }}</td>
                  <td>{{ user.phone }}</td>
                  <td>{{ user.membershipExpiry }}</td>
                  <td class="text-center">
                    <button class="action-button" @click="openRenewalModal(user)">
                      续费
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页控件 -->
          <div class="pagination-controls" v-if="totalPages > 0">
            <span class="total-count">共 {{ totalFilteredUsers }} 条</span>
            <div class="pagination-buttons">
              <button @click="prevPage" :disabled="currentPage === 1" class="pagination-button">
              </button>
              <button v-for="page in totalPages" :key="page" @click="goToPage(page)"
                :class="['pagination-button', { active: currentPage === page }]">
                {{ page }}
              </button>
              <button @click="nextPage" :disabled="currentPage === totalPages" class="pagination-button">
                >
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 续费模态框 (已修复样式) -->
    <Transition name="modal-fade">
      <div v-if="isModalVisible" class="modal-backdrop" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>会员续费</h3>
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
                <label for="weeks-input">输入续费周数:</label>
                <input id="weeks-input" type="number" v-model.number="weeksToAdd" class="form-input" placeholder="例如: 4" min="1" />
              </div>
              <div class="form-group" v-if="newExpiryDate">
                <label>新的到期时间:</label>
                <p class="info-text highlight">{{ newExpiryDate }}</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="button-secondary" @click="closeModal">取消</button>
            <button class="button-primary" @click="confirmRenewal" :disabled="!weeksToAdd || weeksToAdd <= 0">确认续费</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'

  // --- TypeScript 接口定义 ---
  interface User {
      id: number
      phone: string
      membershipExpiry: string // 格式: YYYY-MM-DD
  }

  // --- 响应式数据 ---
  const allUsers = ref<User[]>([
      { id: 101, phone: '138****1234', membershipExpiry: '2025-08-15' },
      { id: 102, phone: '139****5678', membershipExpiry: '2025-07-22' },
      { id: 103, phone: '158****9900', membershipExpiry: '2026-01-01' },
      { id: 104, phone: '136****4321', membershipExpiry: '2025-09-30' },
      { id: 105, phone: '188****1111', membershipExpiry: '2025-12-31' },
      { id: 106, phone: '131****2222', membershipExpiry: '2025-11-11' },
      { id: 107, phone: '132****3333', membershipExpiry: '2026-02-28' },
      { id: 108, phone: '133****4444', membershipExpiry: '2025-07-31' },
      { id: 109, phone: '134****5555', membershipExpiry: '2025-10-10' },
      { id: 110, phone: '135****6677', membershipExpiry: '2026-03-15' }
  ])

  const searchPhone = ref('')

  // --- 分页状态 ---
  const currentPage = ref(1)
  const itemsPerPage = ref(8) // 每页显示5条

  // --- 筛选逻辑 ---
  const filteredUsers = computed(() => {
      if (!searchPhone.value) {
          return allUsers.value
      }
      return allUsers.value.filter(user => user.phone.includes(searchPhone.value))
  })

  // --- 分页计算 ---
  const totalFilteredUsers = computed(() => filteredUsers.value.length)
  const totalPages = computed(() => Math.ceil(totalFilteredUsers.value / itemsPerPage.value))

  const paginatedUsers = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredUsers.value.slice(start, end)
  })

  // --- 分页方法 ---
  const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages.value) {
          currentPage.value = page
      }
  }
  const prevPage = () => {
      goToPage(currentPage.value - 1)
  }
  const nextPage = () => {
      goToPage(currentPage.value + 1)
  }

  watch(searchPhone, () => {
      currentPage.value = 1
  })

  // --- 模态框逻辑 ---
  const isModalVisible = ref(false)
  const selectedUser = ref<User | null>(null)
  const weeksToAdd = ref<number | null>(null)

  const openRenewalModal = (user: User) => {
      selectedUser.value = user
      isModalVisible.value = true
  }

  const closeModal = () => {
      isModalVisible.value = false
      selectedUser.value = null
      weeksToAdd.value = null
  }

  const newExpiryDate = computed(() => {
      if (!selectedUser.value || !weeksToAdd.value || weeksToAdd.value <= 0) return ''
      const currentExpiryDate = new Date(selectedUser.value.membershipExpiry)
      const daysToAdd = weeksToAdd.value * 7
      currentExpiryDate.setDate(currentExpiryDate.getDate() + daysToAdd)
      const year = currentExpiryDate.getFullYear()
      const month = (currentExpiryDate.getMonth() + 1).toString().padStart(2, '0')
      const day = currentExpiryDate.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
  })

  const confirmRenewal = () => {
      if (!selectedUser.value || !newExpiryDate.value) return
      const userIndex = allUsers.value.findIndex(u => u.id === selectedUser.value!.id)
      if (userIndex !== -1) {
          allUsers.value[userIndex].membershipExpiry = newExpiryDate.value
      }
      closeModal()
  }
</script>

<style scoped>
  /* 恢复为更通用的页面布局 */
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

  .page-header {
      text-align: center;
      margin-bottom: 3rem;
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

  /* 内容网格和卡片 */
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
  }

  .card-header-with-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
  }
  .card-title.no-border {
      border-left: none;
      padding-left: 0;
      margin: 0;
      font-size: 1.4rem;
  }

  .search-input {
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 0.5rem 1rem;
      color: #fff;
      font-size: 0.9rem;
  }

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
  }

  /* 分页控件 */
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
  /* 已修复：确保输入框不会因 padding 溢出 */
  .modal-form .form-input {
      width: 100%;
      background-color: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      color: #fff;
      font-size: 1rem;
      box-sizing: border-box; /* 关键修复 */
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
</style>