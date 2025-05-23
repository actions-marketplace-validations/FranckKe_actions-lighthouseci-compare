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
  metricType,
  currentValue,
  isRegression,
  metricUnit,
  diffValue
}: MarkdownTableCellInterface): string => {
  let diff = ''
  if (
    (metricType === 'performance' ||
      metricType === 'accessibility' ||
      metricType === 'bestPractices' ||
      metricType === 'seo') &&
    currentValue === 100
  ) {
    if (diffValue === 0) {
      diff = ''
    } else {
      diff = ` (${diffValue >= 0 ? '+' : ''}${diffValue})`
    }
    return `${currentValue} 🎉 ${diff}`
  }
  diff = ''
  if (diffValue !== 0) {
    diff = `<br/>${diffValue >= 0 ? '+' : ''}${diffValue}${metricUnit}`
  }

  return `${currentValue}${metricUnit} ${isRegression ? '🔴' : '🟢'}${diff}`
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
  })} | [Link](${link}) |`
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
| URL | Performance | Accessibility | SEO | Best Practice | Report |
|:--- |:---: | :---:| :---:| :---:| :---:|
${Object.entries(comparison)
  .map(([url, link]) => {
    return createMarkdownTableRowSummary({ url, comparedMetrics, link })
  })
  .join('\n')}
`.toString()

  const comparisonDetails = `
| URL | FCP | LCP | CLS | TBT | SI | Report |
|:--- |:---: | :---:| :---:| :---:| :---:| :---:|
${Object.entries(comparison)
  .map(([url, link]) => {
    return createMarkdownTableRowDetails({ url, comparedMetrics, link })
  })
  .join('\n')}
`.toString()

  return `# LighthouseCI Report Comparison
  
  Comparing the current commit with the commit the PR is based on.

  Lighthouse reports are likely to vary between runs, sometimes up to **+-10** points(!). Increasing LighthouseCI runs may improve the accuracy of the results at a resource and time cost.
  
  ## Summary
  ${comparisonSummary}
  
  ## Details
  ${comparisonDetails} 
  
  ## Glossary
  
  - **FCP**: First Contentful Paint - measures loading performance
  - **LCP**: Largest Contentful Paint - measures loading performance
  - **CLS**: Cumulative Layout Shift - measures visual stability
  - **TBT**: Total Blocking Time - measures interactivity
  - **SI**: Speed Index - measures how quickly the contents of a page are visibly populated
  `
}
