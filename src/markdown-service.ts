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
  metricUnit,
  diffValue
}: MarkdownTableCellInterface): string => {
  return `${currentValue}${metricUnit} ${isRegression ? '🔴' : '🟢'}<br/> ${diffValue > 0 ? '+' : ''}${metricUnit}`
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
  const { fcp, lcp, tbt, cls, speedIndex } = comparedMetrics[urlPathname]
  return `| [${new URL(url).pathname}](${url}) | ${getMarkdownTableCell({
    currentValue: fcp.currentValue,
    isRegression: fcp.isRegression,
    diffValue: fcp.diff,
    metricUnit: 'ms',
    metricType: 'fcp'
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
  })} | ${getMarkdownTableCell({
    currentValue: speedIndex.currentValue,
    isRegression: speedIndex.isRegression,
    diffValue: speedIndex.diff,
    metricUnit: 'ms',
    metricType: 'speedIndex'
  })} | [Link](${link}) |`
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
| URL | Perf | A11y | SEO | Best Practice | Report |
|:--- |:---: | :---:| :---:| :---:| :---:|
${Object.entries(comparison)
  .map(([url, link]) => {
    return createMarkdownTableRowSummary({ url, comparedMetrics, link })
  })
  .join('\n')}
`.toString()

  const comparisonDetails = `
| URL | FCP | LCP | CLS | TBT | Speed I. | Report |
|:--- |:---: | :---:| :---:| :---:| :---:| :---:|
${Object.entries(comparison)
  .map(([url, link]) => {
    return createMarkdownTableRowDetails({ url, comparedMetrics, link })
  })
  .join('\n')}
`.toString()

  return `# Lighthouse Report Comparison\n\n Lighthouse reports are likely to vary between runs \n\n## Summary\n${comparisonSummary}\n\n## Details\n${comparisonDetails} \n\n## Glossary\n\n- **FCP**: First Contentful Paint - measures loading performance. \n- **LCP**: Largest Contentful Paint - measures loading performance. \n- **CLS**: Cumulative Layout Shift - measures visual stability. \n- **TBT**: Total Blocking Time - measures interactivity. \n- **Speed Index**: measures how quickly the contents of a page are visibly populated. \n- **A11y**: Accessibility - measures how accessible the page is. \n- **Best P.**: Best Practices - measures adherence to best practices. \n- **SEO**: Search Engine Optimization - measures how well the page is optimized for search engines. \n`
}
