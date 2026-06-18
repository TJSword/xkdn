const SITE_NAME = '想亏都难'
const DEFAULT_TITLE = `${SITE_NAME} - 投资策略工具与市场温度`
const DEFAULT_DESCRIPTION =
  '想亏都难提供投资策略收益走势、市场温度、LOF 溢价监控、组合分析和投资小工具，帮助用户更直观地观察资产配置与风险收益。'

interface SeoRouteMeta {
  title?: unknown
  description?: unknown
}

const getMetaElement = (name: string) => {
  let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }

  return element
}

const formatTitle = (title?: unknown) => {
  if (typeof title !== 'string' || !title.trim()) return DEFAULT_TITLE
  return title.includes(SITE_NAME) ? title : `${title} - ${SITE_NAME}`
}

const formatDescription = (description?: unknown) => {
  if (typeof description !== 'string' || !description.trim()) return DEFAULT_DESCRIPTION
  return description.trim()
}

export const applyRouteSeo = (meta: SeoRouteMeta = {}) => {
  if (typeof document === 'undefined') return

  document.title = formatTitle(meta.title)
  getMetaElement('description').setAttribute('content', formatDescription(meta.description))
}

