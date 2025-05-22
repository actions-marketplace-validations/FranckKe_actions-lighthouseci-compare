import { getComparisonLinksObject } from './compare-service'
import { ComparisonResultsByURLInterface } from './types.d'

export interface MarkdownTableCellInterface {
  currentValue: number
  isRegression: boolean
  diffValue: number
  metricUnit: string
  metricType: string
}

export const getMarkdownTableCell = ({
  currentValue,
  isRegression,
  diffValue,
  metricType
}: MarkdownTableCellInterface): string => {
  switch (metricType) {
    case 'performance':
    case 'accessibility':
    case 'seo':
    case 'bestPractices':
    case 'cls':
      return `${currentValue} ${isRegression ? '🔴' : '🟢'} (${
        isRegression ? '+' : ''
      } ${diffValue})`
    case 'lcp':
    case 'tbt':
      return `${currentValue} ms ${isRegression ? '🔴' : '🟢'} (${
        isRegression ? '+' : ''
      }${diffValue} ms)`
    default:
      return ''
  }
}

export const createMarkdownTableRow = ({
  url,
  comparedMetrics,
  link
}: {
  comparedMetrics: ComparisonResultsByURLInterface
  url: string
  link: string
}): string => {
  const urlPathname = new URL(url).pathname
  const { performance, bestPractices, accessibility, seo, lcp, tbt, cls } =
    comparedMetrics[urlPathname]
  return `| [${new URL(url).pathname}](${url}) | ${getMarkdownTableCell({
    currentValue: performance.currentValue,
    isRegression: performance.isRegression,
    diffValue: performance.diff,
    metricType: 'performance',
    metricUnit: ''
  })} | ${getMarkdownTableCell({
    currentValue: accessibility.currentValue,
    isRegression: accessibility.isRegression,
    diffValue: accessibility.diff,
    metricType: 'accessibility',
    metricUnit: ''
  })} | ${getMarkdownTableCell({
    currentValue: seo.currentValue,
    isRegression: seo.isRegression,
    diffValue: seo.diff,
    metricType: 'seo',
    metricUnit: ''
  })} | ${getMarkdownTableCell({
    currentValue: bestPractices.currentValue,
    isRegression: bestPractices.isRegression,
    diffValue: bestPractices.diff,
    metricType: 'bestPractices',
    metricUnit: ''
  })} | ${getMarkdownTableCell({
    currentValue: lcp.currentValue,
    isRegression: lcp.isRegression,
    diffValue: lcp.diff,
    metricUnit: 'ms',
    metricType: 'lcp'
  })} | ${getMarkdownTableCell({
    currentValue: cls.currentValue,
    isRegression: cls.isRegression,
    diffValue: cls.diff,
    metricUnit: '',
    metricType: 'cls'
  })} | ${getMarkdownTableCell({
    currentValue: tbt.currentValue,
    isRegression: tbt.isRegression,
    diffValue: tbt.diff,
    metricUnit: 'ms',
    metricType: 'tbt'
  })} | [Rep](${link}) |`
}
/* istanbul ignore next */
export const formatReportComparisonAsMarkdown = ({
  comparedMetrics,
  inputPath
}: {
  comparedMetrics: ComparisonResultsByURLInterface
  inputPath: string
}): string => {
  const comparison = getComparisonLinksObject({ inputPath })
  return `
| URL | Perf | A11y | SEO | Best P. | LCP | CLS | TBT | Report |
${Object.entries(comparison)
  .map(([url, link]) => {
    return createMarkdownTableRow({ url, comparedMetrics, link })
  })
  .join('\n')}
`.toString()
}
