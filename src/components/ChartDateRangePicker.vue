<template>
  <div class="chart-date-range-picker" :style="{ '--range-accent': accent }">
    <button
      class="range-select-button"
      type="button"
      aria-haspopup="dialog"
      :disabled="!minDate || !maxDate"
      @click="openModal"
    >
      <span>时间范围</span>
      <strong>{{ rangeLabel }}</strong>
    </button>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showModal"
          class="range-modal-backdrop"
          :style="{ '--range-accent': accent }"
          @click.self="showModal = false"
        >
          <form class="range-modal" role="dialog" aria-modal="true" aria-label="策略走势图时间范围" @submit.prevent="confirmRange">
            <div class="modal-header">
              <div>
                <span>日期区间</span>
                <h3>策略走势图时间范围</h3>
              </div>
              <button type="button" class="icon-button" aria-label="关闭" title="关闭" @click="showModal = false">×</button>
            </div>

            <div class="range-option-grid">
              <button
                v-for="period in periods"
                :key="period"
                type="button"
                :class="{ active: modalPeriod === period }"
                @click="applyModalPeriod(period)"
              >
                {{ period }}
              </button>
            </div>

            <div class="range-date-fields">
              <label>
                <span>开始日期</span>
                <input
                  v-model="modalStart"
                  type="date"
                  :min="minDate"
                  :max="modalEnd || maxDate"
                  @change="modalPeriod = '自定义'"
                />
              </label>
              <label>
                <span>结束日期</span>
                <input
                  v-model="modalEnd"
                  type="date"
                  :min="modalStart || minDate"
                  :max="maxDate"
                  @change="modalPeriod = '自定义'"
                />
              </label>
            </div>

            <div class="modal-actions">
              <button class="modal-button" type="button" @click="showModal = false">取消</button>
              <button class="modal-button featured-action" type="submit">应用区间</button>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'

  type Period = '近1个月' | '近1年' | '近3年' | '近5年' | '近10年' | '全部' | '自定义'

  const props = withDefaults(defineProps<{
    start: string
    end: string
    minDate: string
    maxDate: string
    accent?: string
  }>(), {
      accent: '#f59e0b'
  })

  const emit = defineEmits<{
    (event: 'update:start', value: string): void
    (event: 'update:end', value: string): void
    (event: 'apply'): void
  }>()

  const periods: Period[] = ['近1个月', '近1年', '近3年', '近5年', '近10年', '全部', '自定义']
  const showModal = ref(false)
  const modalPeriod = ref<Period>('全部')
  const modalStart = ref('')
  const modalEnd = ref('')

  const rangeLabel = computed(() => {
      const period = getPeriod(props.start, props.end)
      if (period !== '自定义') return period
      return `${formatShortDate(props.start)} 至 ${formatShortDate(props.end)}`
  })

  function formatShortDate(value: string) {
      return value ? value.replace(/-/g, '/') : '--'
  }

  function clampDate(value: string) {
      if (!value || value < props.minDate) return props.minDate
      if (value > props.maxDate) return props.maxDate
      return value
  }

  function subtractPeriod(value: string, years: number, months = 0) {
      const [year, month, day] = value.split('-').map(Number)
      if (!year || !month || !day) return props.minDate
      const targetMonthIndex = month - 1 - months
      const targetYear = year - years + Math.floor(targetMonthIndex / 12)
      const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12
      const maxDay = new Date(Date.UTC(targetYear, normalizedMonthIndex + 1, 0)).getUTCDate()
      return [targetYear, normalizedMonthIndex + 1, Math.min(day, maxDay)]
          .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, '0'))
          .join('-')
  }

  function getPresetStart(period: Period) {
      if (period === '全部') return props.minDate
      if (period === '近1个月') return clampDate(subtractPeriod(props.maxDate, 0, 1))
      const years = Number(period.match(/\d+/)?.[0] || 0)
      return clampDate(subtractPeriod(props.maxDate, years))
  }

  function daysBetween(left: string, right: string) {
      const leftTime = Date.parse(`${left}T00:00:00Z`)
      const rightTime = Date.parse(`${right}T00:00:00Z`)
      return Number.isFinite(leftTime) && Number.isFinite(rightTime)
          ? Math.abs(leftTime - rightTime) / 86_400_000
          : Number.POSITIVE_INFINITY
  }

  function getPeriod(start: string, end: string): Period {
      if (!props.minDate || !props.maxDate || (!start && !end)) return '全部'
      if (start === props.minDate && end === props.maxDate) return '全部'
      if (end === props.maxDate) {
          const matched = periods.slice(0, 5).find(period => daysBetween(start, getPresetStart(period)) <= 7)
          if (matched) return matched
      }
      return '自定义'
  }

  function openModal() {
      modalStart.value = clampDate(props.start)
      modalEnd.value = clampDate(props.end)
      modalPeriod.value = getPeriod(modalStart.value, modalEnd.value)
      showModal.value = true
  }

  function applyModalPeriod(period: Period) {
      modalPeriod.value = period
      if (period === '自定义') return
      modalStart.value = getPresetStart(period)
      modalEnd.value = props.maxDate
  }

  function confirmRange() {
      const start = clampDate(modalStart.value)
      const end = clampDate(modalEnd.value)
      emit('update:start', start <= end ? start : end)
      emit('update:end', start <= end ? end : start)
      emit('apply')
      showModal.value = false
  }
</script>

<style scoped>
  .chart-date-range-picker {
      display: flex;
      justify-content: flex-end;
  }

  .range-select-button,
  .icon-button,
  .modal-button {
      display: inline-flex;
      align-items: center;
      font-family: inherit;
      color: #dbe8f3;
      background: rgb(0 0 0 / 24%);
      border: 1px solid rgb(176 196 222 / 22%);
      border-radius: 7px;
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
  }

  .range-select-button {
      padding: 0.4rem 0.65rem;
      gap: 0.55rem;
      white-space: nowrap;
  }

  .range-select-button:hover,
  .icon-button:hover,
  .modal-button:hover {
      background: color-mix(in srgb, var(--range-accent) 10%, transparent);
      border-color: color-mix(in srgb, var(--range-accent) 48%, transparent);
  }

  .range-select-button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
  }

  .range-select-button span,
  .modal-header span {
      font-size: 0.76rem;
      color: #8fa3bb;
  }

  .range-select-button strong {
      font-size: 0.82rem;
      color: var(--range-accent);
  }

  .modal-fade-enter-active,
  .modal-fade-leave-active {
      transition: opacity 0.2s ease;
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
      opacity: 0;
  }

  .range-modal-backdrop {
      position: fixed;
      z-index: 60;
      display: grid;
      padding: 1rem;
      background: rgb(0 0 0 / 62%);
      backdrop-filter: blur(10px);
      inset: 0;
      place-items: center;
  }

  .range-modal {
      padding: 1.4rem;
      width: min(94vw, 480px);
      background: rgb(18 18 18 / 94%);
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 12px;
      box-shadow: 0 24px 70px rgb(0 0 0 / 58%);
      box-sizing: border-box;
  }

  .modal-header,
  .modal-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
  }

  .modal-header h3 {
      margin: 0.18rem 0 0;
      font-size: 1.18rem;
      color: #fff;
      letter-spacing: 0;
  }

  .icon-button {
      justify-content: center;
      padding: 0;
      width: 2.2rem;
      height: 2.2rem;
      font-size: 1rem;
      color: var(--range-accent);
      line-height: 1;
  }

  .range-option-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0.6rem;
      margin-top: 1.25rem;
  }

  .range-option-grid button {
      padding: 0.5rem 0.45rem;
      font-size: 0.84rem;
      font-family: inherit;
      color: #b0c4de;
      background: rgb(0 0 0 / 22%);
      border: 1px solid rgb(176 196 222 / 18%);
      border-radius: 7px;
      cursor: pointer;
  }

  .range-option-grid button.active {
      color: var(--range-accent);
      background: linear-gradient(90deg, color-mix(in srgb, var(--range-accent) 14%, transparent), color-mix(in srgb, var(--range-accent) 4%, transparent));
      border-color: color-mix(in srgb, var(--range-accent) 68%, transparent);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--range-accent) 10%, transparent), 0 0 18px color-mix(in srgb, var(--range-accent) 12%, transparent);
      font-weight: 700;
  }

  .range-date-fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.8rem;
      margin-top: 1rem;
  }

  .range-date-fields label {
      display: grid;
      font-size: 0.78rem;
      color: #8fa3bb;
      gap: 0.45rem;
  }

  .range-date-fields input {
      padding: 0.58rem 0.65rem;
      min-width: 0;
      font-size: 0.9rem;
      font-family: inherit;
      color: var(--range-accent);
      background: rgb(0 0 0 / 24%);
      border: 1px solid rgb(176 196 222 / 22%);
      border-radius: 7px;
      color-scheme: dark;
  }

  .range-date-fields input[type='date']::-webkit-calendar-picker-indicator {
      opacity: 0.85;
      filter: invert(0.78);
      cursor: pointer;
  }

  .modal-actions {
      justify-content: flex-end;
      margin-top: 1.2rem;
  }

  .modal-button {
      justify-content: center;
      padding: 0.55rem 0.85rem;
      min-width: 5.6rem;
  }

  .featured-action {
      color: var(--range-accent);
      background: color-mix(in srgb, var(--range-accent) 10%, transparent);
      border-color: color-mix(in srgb, var(--range-accent) 48%, transparent);
  }

  @media (max-width: 768px) {
      .chart-date-range-picker,
      .range-select-button {
          width: 100%;
      }

      .range-select-button {
          justify-content: space-between;
      }

      .range-option-grid,
      .range-date-fields {
          grid-template-columns: 1fr;
      }
  }
</style>
