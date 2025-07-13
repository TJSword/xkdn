/*
 * @Author: BoLin
 * @Date: 2022-08-02 16:17:08
 * @LastEditors: BoLin
 * @LastEditTime: 2023-04-03 17:39:32
 * @Description: 按需导入echarts组件 https://github.com/apache/echarts/blob/master/src/echarts.all.ts
 * @FilePath: \digital-twin-system-framework\src\plugins\echarts\index.ts
 */
import type { App } from 'vue'
import ECharts from 'vue-echarts'
import { use, registerMap } from 'echarts/core'
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers'
import {
    LineChart,
    BarChart,
    PieChart,
    ScatterChart,
    RadarChart,
    LinesChart,
    MapChart,
    GaugeChart,
    CustomChart,
    PictorialBarChart,
    SankeyChart,
    EffectScatterChart
} from 'echarts/charts'
import {
    PolarComponent,
    GeoComponent,
    SingleAxisComponent,
    ParallelComponent,
    CalendarComponent,
    GraphicComponent,
    ToolboxComponent,
    TooltipComponent,
    AxisPointerComponent,
    BrushComponent,
    TitleComponent,
    TimelineComponent,
    MarkPointComponent,
    MarkLineComponent,
    MarkAreaComponent,
    LegendComponent,
    AriaComponent,
    VisualMapComponent,
    DatasetComponent,
    TransformComponent,
    GridComponent
} from 'echarts/components'

const components = [
    BarChart,
    LinesChart,
    LineChart,
    SankeyChart,
    PictorialBarChart,
    GaugeChart,
    PieChart,
    ScatterChart,
    RadarChart,
    CustomChart,
    MapChart,
    EffectScatterChart,
    SVGRenderer,
    CanvasRenderer,
    PolarComponent,
    GeoComponent,
    SingleAxisComponent,
    ParallelComponent,
    CalendarComponent,
    GraphicComponent,
    VisualMapComponent,
    ToolboxComponent,
    TooltipComponent,
    AxisPointerComponent,
    BrushComponent,
    TitleComponent,
    TimelineComponent,
    MarkPointComponent,
    MarkLineComponent,
    MarkAreaComponent,
    LegendComponent,
    AriaComponent,
    DatasetComponent,
    TransformComponent,
    GridComponent
]

const initEcharts = (app: App) => {
    use([...components])
    app.component('v-chart', ECharts)
}
export { initEcharts }
