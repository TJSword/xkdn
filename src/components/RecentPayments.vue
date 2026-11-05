<template>
  <section class="payments-card">
    <div class="payments-header">
      <div class="payments-heading">
        <h2>最近付费记录</h2>
        <p class="payments-help">站内支付宝成功订单（含首次开通与续费）；不含手动调整。支付成功不代表会员权益一定到账，到期日为当前状态。</p>
      </div>
      <form class="payments-filters" @submit.prevent="load(1)">
      <div class="payments-select">
      <select v-model="days" aria-label="付费时间范围" :disabled="loading" @change="load(1)">
        <option :value="7">最近 7 天</option>
        <option :value="30">最近 30 天</option>
        <option :value="0">全部</option>
      </select>
      </div>
      <input v-model="phone" aria-label="按手机号筛选付费记录" placeholder="按手机号筛选…" />
      <button type="submit" :disabled="loading">查询</button>
      <button type="button" :disabled="loading" @click="load(page)">刷新</button>
      </form>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="copyMessage" role="status">{{ copyMessage }}</p>
    <div class="payments-table-wrapper">
      <table>
        <thead><tr><th>手机号</th><th>备注</th><th>金额</th><th>套餐</th><th>增加天数</th><th>支付确认时间（北京时间）</th><th>当前会员到期日</th><th>订单号</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="8">正在加载付费记录…</td></tr>
          <tr v-else-if="error"><td colspan="8">付费记录加载失败，请重试</td></tr>
          <tr v-else-if="!records.length"><td colspan="8">暂无符合条件的付费记录</td></tr>
          <tr v-for="record in loading || error ? [] : records" :key="record.id">
            <td>{{ record.phone }}</td><td class="payments-remark">{{ record.remark || '-' }}</td>
            <td>{{ record.totalAmount == null ? '未记录' : `¥${Number(record.totalAmount).toFixed(2)}` }}</td>
            <td>{{ record.planName || '未记录' }}</td><td>{{ record.days ?? '未记录' }}</td>
            <td>{{ record.payTime }}</td><td>{{ record.membershipExpiry }}</td>
            <td><button type="button" :disabled="!record.outTradeNo" title="点击复制订单号" @click="copyOrder(record.outTradeNo)">{{ record.outTradeNo || '未记录' }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="payments-pagination">
      <span>共 {{ total }} 笔 · 第 {{ page }} / {{ Math.max(1, Math.ceil(total / 10)) }} 页</span>
      <button type="button" :disabled="loading || page <= 1" @click="load(page - 1)">上一页</button>
      <button type="button" :disabled="loading || page * 10 >= total" @click="load(page + 1)">下一页</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { callCloudFunction } from '@/services/cloudFunction'

interface Payment {
  id: string
  phone: string
  remark: string
  totalAmount: number | string | null
  planName: string
  days: number | null
  payTime: string
  membershipExpiry: string
  outTradeNo: string
}
const days = ref(30)
const phone = ref('')
const page = ref(1)
const total = ref(0)
const records = ref<Payment[]>([])
const loading = ref(false)
const error = ref('')
const copyMessage = ref('')

async function load(targetPage = 1) {
  if (loading.value) return
  loading.value = true
  error.value = ''
  copyMessage.value = ''
  try {
    const response: any = await callCloudFunction({
      name: 'getRecentPayments', parse: true,
      data: { days: days.value, searchPhone: phone.value, page: targetPage }
    })
    if (!response.result?.success) throw new Error(response.result?.message || '获取付费记录失败')
    records.value = response.result.data.records
    total.value = response.result.data.total
    page.value = targetPage
  } catch (cause: any) {
    records.value = []
    total.value = 0
    error.value = cause?.message || '获取付费记录失败，请重试'
  } finally {
    loading.value = false
  }
}

async function copyOrder(order: string) {
  try {
    await navigator.clipboard.writeText(order)
    copyMessage.value = '订单号已复制'
  } catch {
    copyMessage.value = '复制失败，请选中订单号手动复制'
  }
}
onMounted(() => load())
</script>

<style scoped>
.payments-card { margin-top: 1.25rem; padding: 1.25rem; box-sizing: border-box; border: 1px solid rgb(255 255 255 / 10%); border-radius: 12px; background: rgb(255 255 255 / 5%); backdrop-filter: blur(10px); color: #d8e4f2; }
.payments-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.2rem; }
.payments-heading { flex: 1 1 360px; }
h2 { padding-left: 1rem; margin: 0 0 0.5rem; color: #fff; border-left: 4px solid #0af; font-size: 1.24rem; font-weight: 700; }
.payments-help { margin: 0; max-width: 680px; color: #b0c4de; font-size: 0.92rem; line-height: 1.7; }
.payments-filters, .payments-pagination { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin: 1rem 0; }
.payments-pagination { justify-content: flex-end; }
.payments-filters { margin: 0; padding: 0.55rem; background: rgb(0 0 0 / 18%); border: 1px solid rgb(255 255 255 / 8%); border-radius: 8px; }
input, select, button { padding: 0.5rem 0.75rem; border: 1px solid rgb(255 255 255 / 15%); border-radius: 6px; background: #262626; color: inherit; font: inherit; }
.payments-select { position: relative; }
.payments-select select { appearance: none; padding-right: 2.5rem; color-scheme: dark; }
.payments-select::after { content: ''; position: absolute; right: 1rem; top: 50%; width: 7px; height: 7px; border-right: 1.5px solid #b0c4de; border-bottom: 1.5px solid #b0c4de; transform: translateY(-70%) rotate(45deg); pointer-events: none; }
button { cursor: pointer; }
button:disabled { opacity: 0.5; cursor: default; }
.payments-table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 0.85rem; white-space: nowrap; }
th, td { padding: 0.85rem; text-align: left; border-bottom: 1px solid rgb(255 255 255 / 8%); }
th { color: #8fa1b8; }
.payments-remark { min-width: 100px; max-width: 220px; white-space: normal; overflow-wrap: anywhere; }
@media (max-width: 640px) { .payments-card { padding: 1rem; } .payments-header { flex-direction: column; align-items: stretch; } .payments-heading { flex-basis: auto; } h2 { font-size: 1.15rem; } input { min-width: 0; width: 150px; } }
</style>
