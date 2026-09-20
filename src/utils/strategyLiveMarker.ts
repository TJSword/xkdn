import type { LineSeriesOption } from 'echarts'

export function createStrategyLiveMarker(
    dates: string[],
    liveStartDate: string,
    visibleDates = dates
): LineSeriesOption['markLine'] {
    // 非交易日起点映射到之后首个可用交易日。
    const markerDate = dates.find(date => date >= liveStartDate)
    const index = markerDate ? visibleDates.indexOf(markerDate) : -1

    return {
        silent: true,
        symbol: 'none',
        lineStyle: { color: '#f5b942', type: 'dashed', width: 2 },
        label: {
            formatter: '实盘起点',
            position: 'insideEndTop',
            rotate: 0,
            align: 'center',
            color: '#f5b942',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            padding: [5, 7],
            borderRadius: 4,
            lineHeight: 18
        },
        data: index >= 0 ? [{ xAxis: markerDate }] : []
    }
}
