<template>
    <Transition name="modal-fade">
        <div v-if="calendar" class="modal-backdrop monthly-calendar-backdrop" @click="$emit('close')">
            <div class="modal-content monthly-calendar-modal" :style="{ '--calendar-accent': accent }" @click.stop>
                <div class="monthly-calendar-header">
                    <div>
                        <span>月度下钻</span>
                        <h3>{{ calendar.title }}</h3>
                    </div>
                    <button class="modal-close-button" type="button" aria-label="关闭" @click="$emit('close')">
                        ×
                    </button>
                </div>

                <div class="monthly-calendar-controls">
                    <button type="button" :disabled="!hasPrevious" @click="$emit('navigate', -1)">
                        上一月
                    </button>
                    <button type="button" :disabled="!hasNext" @click="$emit('navigate', 1)">
                        下一月
                    </button>
                </div>

                <div class="monthly-calendar-summary">
                    <div>
                        <span>本月收益</span>
                        <strong :class="getCalendarTone(calendar.monthReturn)">
                            {{ calendar.monthReturnLabel }}
                        </strong>
                    </div>
                    <div>
                        <span>上涨 / 下跌</span>
                        <strong>{{ calendar.upDays }} / {{ calendar.downDays }}</strong>
                    </div>
                    <div>
                        <span>最好一天</span>
                        <strong :class="getCalendarTone(calendar.bestDay?.returnValue)">
                            {{ calendar.bestDay?.returnLabel || '--' }}
                        </strong>
                    </div>
                    <div>
                        <span>最差一天</span>
                        <strong :class="getCalendarTone(calendar.worstDay?.returnValue)">
                            {{ calendar.worstDay?.returnLabel || '--' }}
                        </strong>
                    </div>
                </div>

                <div class="monthly-calendar-weekdays">
                    <span v-for="day in weekdays" :key="day">{{ day }}</span>
                </div>
                <div class="monthly-calendar-grid">
                    <div
                        v-for="cell in calendar.cells"
                        :key="cell.key"
                        class="monthly-calendar-cell"
                        :class="{
                            empty: cell.isEmpty,
                            trading: cell.isTradingDay,
                            positive: (cell.returnValue ?? 0) > 0,
                            negative: (cell.returnValue ?? 0) < 0
                        }"
                        :style="getDailyCalendarCellStyle(cell.returnValue)"
                        :title="cell.tooltip">
                        <span>{{ cell.day }}</span>
                        <strong>{{ cell.returnLabel }}</strong>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import type { MonthlyCalendarDetail } from '@/composables/useMonthlyReturnCalendar'
import {
    getCalendarTone,
    getDailyCalendarCellStyle,
    calendarWeekdays as weekdays
} from '@/composables/useMonthlyReturnCalendar'

withDefaults(
    defineProps<{
        calendar: MonthlyCalendarDetail | null
        hasPrevious: boolean
        hasNext: boolean
        accent?: string
    }>(),
    {
        accent: '#00aaff'
    }
)

defineEmits<{
    close: []
    navigate: [direction: -1 | 1]
}>()
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-backdrop {
    position: fixed;
    z-index: 1000;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1.25rem;
    background: rgb(0 0 0 / 68%);
    backdrop-filter: blur(10px);
}

.modal-content {
    color: #fff;
    background: color-mix(in srgb, #101925 88%, var(--calendar-accent));
    border: 1px solid color-mix(in srgb, var(--calendar-accent) 34%, transparent);
    box-shadow: 0 24px 80px rgb(0 0 0 / 42%);
}

.monthly-calendar-modal {
    overflow: hidden;
    width: min(760px, 100%);
    max-height: min(88vh, 760px);
    padding: 1.25rem;
    border-radius: 14px;
}

.monthly-calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
}

.monthly-calendar-header span {
    display: block;
    margin-bottom: 0.35rem;
    font-size: 0.76rem;
    color: color-mix(in srgb, var(--calendar-accent) 72%, #fff);
    letter-spacing: 0.06em;
}

.monthly-calendar-header h3 {
    margin: 0;
    font-size: 1.18rem;
    line-height: 1.3;
}

.modal-close-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    color: #b8cce2;
    background: rgb(255 255 255 / 6%);
    border: 1px solid rgb(255 255 255 / 10%);
    border-radius: 8px;
    cursor: pointer;
}

.modal-close-button:hover {
    color: #fff;
    background: rgb(255 255 255 / 12%);
}

.monthly-calendar-controls {
    display: grid;
    align-items: center;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.monthly-calendar-controls button {
    padding: 0.5rem 0.75rem;
    color: #d7e8fb;
    text-align: center;
    background: rgb(255 255 255 / 6%);
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 8px;
    cursor: pointer;
}

.monthly-calendar-controls button:hover:not(:disabled),
.monthly-calendar-controls button:focus-visible {
    border-color: color-mix(in srgb, var(--calendar-accent) 72%, #fff);
    outline: none;
}

.monthly-calendar-controls button:disabled {
    opacity: 0.38;
    cursor: not-allowed;
}

.monthly-calendar-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.7rem;
    margin-bottom: 1rem;
}

.monthly-calendar-summary div {
    padding: 0.75rem;
    background: rgb(0 0 0 / 22%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 8px;
}

.monthly-calendar-summary span {
    display: block;
    margin-bottom: 0.32rem;
    font-size: 0.76rem;
    color: #8392a5;
}

.monthly-calendar-summary strong,
.monthly-calendar-cell strong {
    font-variant-numeric: tabular-nums;
}

.positive {
    color: #ff8f66;
}

.negative {
    color: #35d7b1;
}

.monthly-calendar-weekdays,
.monthly-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 0.45rem;
}

.monthly-calendar-weekdays {
    margin-bottom: 0.45rem;
}

.monthly-calendar-weekdays span {
    text-align: center;
    font-size: 0.74rem;
    color: #7f91a6;
}

.monthly-calendar-cell {
    position: relative;
    display: grid;
    min-height: 68px;
    padding: 0.55rem;
    color: #6f8094;
    background: rgb(255 255 255 / 3%);
    border: 1px solid rgb(255 255 255 / 7%);
    border-radius: 8px;
}

.monthly-calendar-cell.empty {
    visibility: hidden;
}

.monthly-calendar-cell.trading {
    color: #f3f8ff;
}

.monthly-calendar-cell span {
    position: relative;
    z-index: 1;
    font-size: 0.75rem;
}

.monthly-calendar-cell strong {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(100% - 1rem);
    transform: translate(-50%, -50%);
    text-align: center;
    font-size: 0.84rem;
}

@media (max-width: 768px) {
    .modal-backdrop {
        align-items: flex-start;
        overflow-y: auto;
        padding: 0.75rem;
    }

    .monthly-calendar-modal {
        padding: 1rem;
        max-height: none;
    }

    .monthly-calendar-summary {
        grid-template-columns: repeat(2, 1fr);
    }

    .monthly-calendar-weekdays,
    .monthly-calendar-grid {
        gap: 0.3rem;
    }

    .monthly-calendar-cell {
        min-height: 54px;
        padding: 0.4rem;
        border-radius: 6px;
    }

    .monthly-calendar-cell strong {
        font-size: 0.72rem;
    }
}
</style>
