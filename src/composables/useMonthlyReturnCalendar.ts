import { computed, type Ref, ref } from 'vue'

export interface SelectableCalendarMonth {
    year: number
    month: number
    value: string
}

export interface MonthlyCalendarCell {
    key: string
    day: string
    date: string
    returnValue: number | null
    returnLabel: string
    valueLabel: string
    tooltip: string
    isTradingDay: boolean
    isEmpty: boolean
}

export interface MonthlyCalendarDetail {
    year: number
    month: number
    title: string
    monthReturn: number
    monthReturnLabel: string
    upDays: number
    downDays: number
    bestDay: MonthlyCalendarCell | null
    worstDay: MonthlyCalendarCell | null
    cells: MonthlyCalendarCell[]
}

export interface MonthlyReturnCalendarOptions {
    monthlyRows: Readonly<Ref<any[]>>
    chartDates: Readonly<Ref<string[]>>
    chartStrategyValues: Readonly<Ref<number[]>>
    dateRangeStart: Readonly<Ref<string>>
    dateRangeEnd: Readonly<Ref<string>>
    getDateIndex: (date: string, mode: 'start' | 'end') => number
}

export const calendarWeekdays = ['日', '一', '二', '三', '四', '五', '六']

export const formatCalendarPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return '--'
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
}

export const getCalendarTone = (value: number | null | undefined) => {
    if (value === null || value === undefined || !Number.isFinite(value) || value === 0) return ''
    return value > 0 ? 'positive' : 'negative'
}

export const getDailyCalendarCellStyle = (value: number | null | undefined) => {
    if (value === null || value === undefined || !Number.isFinite(value) || value === 0) return {}
    const opacity = Math.min(Math.abs(value) / 2.5, 1)
    const color = value > 0 ? '255, 87, 34' : '0, 196, 151'
    return {
        backgroundColor: `rgba(${color}, ${0.12 + opacity * 0.58})`,
        borderColor: `rgba(${color}, ${0.22 + opacity * 0.5})`
    }
}

const buildEmptyCalendarCell = (key: string): MonthlyCalendarCell => ({
    key,
    day: '',
    date: '',
    returnValue: null,
    returnLabel: '',
    valueLabel: '',
    tooltip: '',
    isTradingDay: false,
    isEmpty: true
})

export const useMonthlyReturnCalendar = ({
    monthlyRows,
    chartDates,
    chartStrategyValues,
    dateRangeStart,
    dateRangeEnd,
    getDateIndex
}: MonthlyReturnCalendarOptions) => {
    const selectedMonthlyCalendar = ref<MonthlyCalendarDetail | null>(null)

    const selectableCalendarMonths = computed<SelectableCalendarMonth[]>(() =>
        monthlyRows.value
            .flatMap((row: any) =>
                row.months
                    .map((value: string | null, index: number) =>
                        value === null
                            ? null
                            : {
                                  year: row.year,
                                  month: index + 1,
                                  value
                              }
                    )
                    .filter((item: SelectableCalendarMonth | null): item is SelectableCalendarMonth => item !== null)
            )
            .sort((a: SelectableCalendarMonth, b: SelectableCalendarMonth) =>
                a.year === b.year ? a.month - b.month : a.year - b.year
            )
    )

    const selectedCalendarMonthIndex = computed(() => {
        if (!selectedMonthlyCalendar.value) return -1
        return selectableCalendarMonths.value.findIndex(
            item =>
                item.year === selectedMonthlyCalendar.value?.year &&
                item.month === selectedMonthlyCalendar.value?.month
        )
    })

    const previousCalendarMonth = computed(() => {
        const index = selectedCalendarMonthIndex.value
        return index > 0 ? selectableCalendarMonths.value[index - 1] : null
    })

    const nextCalendarMonth = computed(() => {
        const index = selectedCalendarMonthIndex.value
        return index >= 0 && index < selectableCalendarMonths.value.length - 1
            ? selectableCalendarMonths.value[index + 1]
            : null
    })

    const buildMonthlyCalendarDetail = (
        year: number,
        month: number,
        monthReturnValue: string
    ): MonthlyCalendarDetail => {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`
        const selectedStartIndex = getDateIndex(dateRangeStart.value, 'start')
        const selectedEndIndex = getDateIndex(dateRangeEnd.value, 'end')
        const dailyMap = new Map<string, MonthlyCalendarCell>()

        for (let index = selectedStartIndex; index <= selectedEndIndex; index++) {
            const date = chartDates.value[index]
            const value = chartStrategyValues.value[index]
            if (!date?.startsWith(monthKey) || !Number.isFinite(value)) continue

            const previousValue = index > selectedStartIndex ? chartStrategyValues.value[index - 1] : NaN
            const returnValue =
                Number.isFinite(previousValue) && previousValue > 0 ? (value / previousValue - 1) * 100 : null
            const day = String(Number(date.slice(8, 10)))
            const returnLabel = formatCalendarPercent(returnValue)
            const valueLabel = Number.isFinite(value) ? value.toFixed(2) : '--'

            dailyMap.set(date, {
                key: date,
                day,
                date,
                returnValue,
                returnLabel,
                valueLabel,
                tooltip: `${date} | 日涨跌 ${returnLabel} | 净值 ${valueLabel}`,
                isTradingDay: true,
                isEmpty: false
            })
        }

        const daysInMonth = new Date(year, month, 0).getDate()
        const firstDayOffset = new Date(year, month - 1, 1).getDay()
        const cells: MonthlyCalendarCell[] = Array.from({ length: firstDayOffset }, (_, index) =>
            buildEmptyCalendarCell(`empty-start-${year}-${month}-${index}`)
        )

        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${monthKey}-${String(day).padStart(2, '0')}`
            const tradingCell = dailyMap.get(date)
            cells.push(
                tradingCell || {
                    key: date,
                    day: String(day),
                    date,
                    returnValue: null,
                    returnLabel: '',
                    valueLabel: '',
                    tooltip: `${date} | 无交易数据`,
                    isTradingDay: false,
                    isEmpty: false
                }
            )
        }

        while (cells.length % 7 !== 0) {
            cells.push(buildEmptyCalendarCell(`empty-end-${year}-${month}-${cells.length}`))
        }

        const tradingDays = [...dailyMap.values()].filter(
            cell => cell.returnValue !== null && Number.isFinite(cell.returnValue)
        )
        const upDays = tradingDays.filter(cell => (cell.returnValue ?? 0) > 0).length
        const downDays = tradingDays.filter(cell => (cell.returnValue ?? 0) < 0).length
        const bestDay =
            tradingDays.length > 0
                ? [...tradingDays].sort((a, b) => (b.returnValue ?? 0) - (a.returnValue ?? 0))[0]
                : null
        const worstDay =
            tradingDays.length > 0
                ? [...tradingDays].sort((a, b) => (a.returnValue ?? 0) - (b.returnValue ?? 0))[0]
                : null
        const monthReturn = Number(monthReturnValue)

        return {
            year,
            month,
            title: `${year}年${month}月 每日涨跌`,
            monthReturn,
            monthReturnLabel: formatCalendarPercent(monthReturn),
            upDays,
            downDays,
            bestDay,
            worstDay,
            cells
        }
    }

    const openMonthlyCalendar = (year: number, month: number, value: string) => {
        selectedMonthlyCalendar.value = buildMonthlyCalendarDetail(year, month, value)
    }

    const closeMonthlyCalendar = () => {
        selectedMonthlyCalendar.value = null
    }

    const goToAdjacentCalendarMonth = (direction: -1 | 1) => {
        const target = direction < 0 ? previousCalendarMonth.value : nextCalendarMonth.value
        if (!target) return
        openMonthlyCalendar(target.year, target.month, target.value)
    }

    return {
        calendarWeekdays,
        selectedMonthlyCalendar,
        previousCalendarMonth,
        nextCalendarMonth,
        openMonthlyCalendar,
        closeMonthlyCalendar,
        goToAdjacentCalendarMonth,
        getCalendarTone,
        getDailyCalendarCellStyle
    }
}
