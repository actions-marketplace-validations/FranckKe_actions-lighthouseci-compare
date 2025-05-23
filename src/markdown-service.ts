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
  diffValue
}: MarkdownTableCellInterface): string => {
  return `${currentValue} ${isRegression ? '🔴' : '🟢'} ${diffValue === 0 ? '' : '\n '}${diffValue > 0 ? '+' : ''}`
}

export const createMarkdownTableRowSummary = ({
  url,
  comparedMetrics,
  link
}: {
  comparedMetrics: ComparisonResultsByURLInterface
  url: string
  link: string
}): string => {
  const urlPathname = new URL(url).pathname
  const { performance, bestPractices, accessibility, seo } =
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
  })} | [Rep](${link}) |`
}

export const createMarkdownTableRowDetails = ({
  url,
  comparedMetrics,
  link
}: {
  comparedMetrics: ComparisonResultsByURLInterface
  url: string
  link: string
}): string => {
  const urlPathname = new URL(url).pathname
  const { lcp, tbt, cls } = comparedMetrics[urlPathname]
  return `| [${new URL(url).pathname}](${url}) | ${getMarkdownTableCell({
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

export const formatReportComparisonAsMarkdown = ({
  comparedMetrics,
  inputPath
}: {
  comparedMetrics: ComparisonResultsByURLInterface
  inputPath: string
}): string => {
  const comparison = getComparisonLinksObject({ inputPath })
  const comparisonSummary = `
| URL | Perf | A11y | SEO | Best P. | Report |
|:--- |:---: | :---:| :---:| :---:| :---:|
${Object.entries(comparison)
  .map(([url, link]) => {
    return createMarkdownTableRowSummary({ url, comparedMetrics, link })
  })
  .join('\n')}
`.toString()

  const comparisonDetails = `
| URL | Perf | A11y | SEO | Best P. | Report |
|:--- |:---: | :---:| :---:| :---:| :---:|
${Object.entries(comparison)
  .map(([url, link]) => {
    return createMarkdownTableRowDetails({ url, comparedMetrics, link })
  })
  .join('\n')}
`.toString()

  return `# Lighthouse Report Comparison\n\n Lighthouse reports are likely to vary between runs ## Summary\n${comparisonSummary}\n\n## Details\n${comparisonDetails}`
}
