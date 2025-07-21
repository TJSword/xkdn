<template>
  <div class="page-wrapper">
    <div class="main-container">

      <!-- 1. 页面标题 (已分离) -->
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
                <tr v-if="isLoading">
                  <td colspan="4" class="text-center no-data">正在加载用户数据...</td>
                </tr>
                <tr v-else v-for="user in users" :key="user.id">
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
            <span class="total-count">共 {{ totalUsers  }} 条</span>
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
  import { ref, computed, watch, onMounted } from 'vue'
  import app from '@/lib/cloudbase' // **修改**: 明确从您的库中导入 app 实例
  const showMessage: any = inject('showMessage')
  // --- TypeScript 接口定义 (id 修改为 string 以匹配数据库 _id) ---
  interface User {
      id: string
      phone: string
      membershipExpiry: string // 格式: YYYY-MM-DD
  }

  // --- 响应式数据 ---
  const users = ref<User[]>([])
  const searchPhone = ref('')
  const isLoading = ref(true)

  // --- 分页状态 ---
  const currentPage = ref(1)
  const itemsPerPage = ref(8)
  const totalUsers = ref(0)

  // --- 分页计算 ---
  const totalPages = computed(() => Math.ceil(totalUsers.value / itemsPerPage.value))

  // --- 云函数调用逻辑 (已适配您的项目风格) ---

  /**
   * @description: 从后端获取用户数据
   */
  const fetchUsers = () => {
      isLoading.value = true
      app.callFunction({
          name: 'getUsers',
          parse: true, // 按照您的习惯添加
          data: {
              searchPhone: searchPhone.value,
              page: currentPage.value,
              limit: itemsPerPage.value
          }
      })
          .then((res: any) => {
              // 确保云函数执行成功并返回了数据
              if (res.result && res.result.success) {
                  users.value = res.result.data.users
                  totalUsers.value = res.result.data.total
              } else {
                  // 处理云函数返回的业务错误
                  showMessage('获取用户失败', 'error')
                  users.value = []
                  totalUsers.value = 0
              }
          })
          .catch((err: any) => {
              // 处理网络或云函数执行本身的错误
              showMessage('网络错误，无法加载用户数据', 'error')
              users.value = []
              totalUsers.value = 0
          })
          .finally(() => {
              isLoading.value = false
          })
  }

  // --- 组件挂载时首次加载数据 ---
  onMounted(() => {
      fetchUsers()
  })

  // --- 监听搜索和分页变化，重新获取数据 ---
  watch(
      [searchPhone, currentPage],
      (newValues, oldValues) => {
          const newSearch = newValues[0]
          const oldSearch = oldValues[0]

          // 只有在搜索词变化时，才强制重置到第一页
          if (newSearch !== oldSearch) {
              if (currentPage.value !== 1) {
                  currentPage.value = 1 // 这会自动触发 watch 重新执行 fetchUsers
              } else {
                  fetchUsers() // 如果已在第一页，则直接获取
              }
          } else {
              // 否则，说明是页码变化，直接获取新页码的数据
              fetchUsers()
          }
      },
      { immediate: false }
  ) // 设置 immediate: false 避免和 onMounted 重复调用

  // --- 分页方法 (保持不变) ---
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

      // 确定计算的起始日期
      const isNewUserOrExpired =
          selectedUser.value.membershipExpiry === '未设置' ||
          new Date(selectedUser.value.membershipExpiry) < new Date()
      const startDate = isNewUserOrExpired
          ? new Date()
          : new Date(selectedUser.value.membershipExpiry)

      // 增加周数 (setDate 会自动处理月份和年份的进位)
      startDate.setDate(startDate.getDate() + weeksToAdd.value * 7)

      // 格式化为 YYYY-MM-DD HH:mm
      const year = startDate.getFullYear()
      const month = (startDate.getMonth() + 1).toString().padStart(2, '0')
      const day = startDate.getDate().toString().padStart(2, '0')
      const hours = startDate.getHours().toString().padStart(2, '0')
      const minutes = startDate.getMinutes().toString().padStart(2, '0')

      return `${year}-${month}-${day} ${hours}:${minutes}`
  })

  // **修改**: 确认续费逻辑，适配您的调用风格
  const confirmRenewal = () => {
      if (!selectedUser.value || !weeksToAdd.value || weeksToAdd.value <= 0) return

      app.callFunction({
          name: 'renewMembership',
          parse: true,
          data: {
              userId: selectedUser.value.id,
              weeksToAdd: weeksToAdd.value
          }
      })
          .then((res: any) => {
              if (res.result && res.result.success) {
                  showMessage('续费成功！', 'success')
                  closeModal()
                  // **关键**: 续费成功后，刷新当前页的用户列表
                  fetchUsers()
              } else {
                  showMessage('续费失败', 'error')
              }
          })
          .catch((err: any) => {
              console.error('调用云函数 renewMembership 失败:', err)
              showMessage('网络错误，续费操作失败', 'error')
          })
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
  /* ======================================================= */
  /* ========      用户管理页面移动端适配      ======== */
  /* ======================================================= */

  @media (max-width: 768px) {
      /* 步骤一：修正卡片的收缩行为，防止被内部表格撑开 */
      .content-card {
          min-width: 0;
          padding: 1.5rem 1rem; /* 减小卡片内边距 */
      }

      /* 步骤二：确保表格可以滚动，并优化单元格内容 */
      .table-wrapper {
          /* 您已有的 overflow-x: auto; 是正确的 */
          /* 我们可以为滚动条增加样式 */
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
          white-space: nowrap; /* 确保单元格内容不换行 */
          padding: 0.8rem;
      }

      /* 步骤三：调整卡片头部的布局，让搜索框换行 */
      .card-header-with-toggle {
          flex-direction: column; /* 垂直堆叠 */
          align-items: flex-start; /* 左对齐 */
          gap: 1rem;
      }
      .search-input {
          width: 100%; /* 让搜索框撑满宽度 */
          box-sizing: border-box;
      }

      /* 步骤四：优化分页控件的布局 */
      .pagination-controls {
          flex-direction: column; /* 垂直堆叠 */
          align-items: center; /* 居中对齐 */
          gap: 1rem;
      }
      .pagination-buttons {
          /* 让按钮容器可以在需要时换行 */
          flex-wrap: wrap;
          justify-content: center;
      }

      .modal-content {
          padding: 1.5rem 1.2rem; /* 稍微调整内边距，让上下空间更足 */
          max-height: 90vh; /* 新增：限制最大高度 */
          overflow-y: auto; /* 新增：当内容超长时，弹窗内部可以滚动 */
          width: 78%;
      }
      .modal-header h3 {
          font-size: 1.2rem;
      }

      /* --- 新增：适配弹窗表单内部 --- */
      .modal-form .form-group {
          margin-bottom: 1.5rem; /* 稍微增大表单项之间的间距 */
      }
      .modal-form label {
          font-size: 0.9rem; /* 统一标签字号 */
      }
      .modal-form .info-text {
          font-size: 1.05rem; /* 让信息文本更突出一点 */
      }
      .modal-form .form-input {
          padding: 0.9rem; /* 增大输入框内边距，方便点击和输入 */
          font-size: 1.05rem;
      }

      .modal-footer {
          flex-direction: column-reverse;
          gap: 0.8rem;
          margin-top: 2rem; /* 增大与表单的间距 */
          padding-top: 1.2rem;
      }
      .button-secondary,
      .button-primary {
          width: 100%;
          padding: 0.9rem; /* 统一增大按钮内边距 */
      }

      /* 其他通用微调 */
      .main-title {
          font-size: 2rem;
      }
      .subtitle {
          font-size: 1rem;
      }
  }
</style>