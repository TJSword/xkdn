export const comparisonStrategies = [
    { id: 'all_weather', slug: 'all-weather', name: '全天候', color: '#00aaff', asset: '股票、国债、黄金 ETF / 基金', method: '多资产配置', allocation: 'A股20% · 美股20% · 国债30% · 黄金30%', schedule: '历史回测采用年度再平衡', operation: '关注配置偏离，按再平衡规则调整', risk: '多资产可能同时下跌；海外资产存在汇率风险' },
    { id: 'bonds', slug: 'bonds', name: '可转债', color: '#add8e6', asset: '可转债', method: '多因子筛选与轮动', allocation: '10只转债，相同张数持有', schedule: '每日14:40评估；开盘前设置止盈限价单', operation: '需要可转债交易权限及日常执行', risk: '信用风险、强赎与流动性风险' },
    { id: 'high_dividend', slug: 'high-dividend', name: '高股息', color: '#2dd4bf', asset: '高股息股票', method: '质量筛选后按股息率排名', allocation: '5只股票，目标单只20%', schedule: '周末生成名单，下周首个交易日9:30调整', operation: '关注周度名单、排名及权重变化', risk: '分红变化、行业集中及股价下跌' },
    { id: 'rights_strategy', slug: 'rights-strategy', name: '含权', color: '#ef4444', asset: '拟发行可转债的正股', method: '动态含权量排序', allocation: '前5只等权持有', schedule: '周四14:40；登记日可能临时调出', operation: '关注发行事件；可能涉及创业板、科创板权限', risk: '发行进度变化、事件落空及正股波动' },
    { id: 'momentum', slug: 'momentum', name: '动量', color: '#ff5722', asset: 'A股、境外指数与黄金相关标的', method: '比较近20日涨幅，轮动强势资产', allocation: '随动量信号切换标的', schedule: '每日更新动量监控，执行以页面信号为准', operation: '持续关注排名和轮动信号', risk: '趋势反转、震荡换手与跨市场风险' },
    { id: 'micro_cap', slug: 'micro-cap', name: '微盘', color: '#f0e68c', asset: '小市值股票', method: '每日排名与持仓缓冲', allocation: '10只股票，目标单只10%', schedule: '每日检查；1月、4月空仓窗口', operation: '关注排名、权重调整与空仓安排', risk: '流动性不足、集中下跌及交易受限' }
]
