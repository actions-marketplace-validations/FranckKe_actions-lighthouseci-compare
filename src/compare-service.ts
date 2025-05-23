import { ComparisonResultsInterface, RunInterface } from './types.d'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type Result from 'lighthouse/types/lhr/lhr'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import fs from 'fs'
import path from 'path'
import * as core from '@actions/core'

interface MetricConfig {
  outputKey: keyof ComparisonResultsInterface
  lhrKey: string // Corresponds to key in LHR categories or audits
  type: 'category' | 'audit'
  precision: number
  higherIsBetter: boolean // True if a higher value is better (e.g., performance score)
}

const metricsToProcess: MetricConfig[] = [
  {
    outputKey: 'performance',
    lhrKey: 'performance',
    type: 'category',
    precision: 0,
    higherIsBetter: true
  },
  {
    outputKey: 'seo',
    lhrKey: 'seo',
    type: 'category',
    precision: 0,
    higherIsBetter: true
  },
  {
    outputKey: 'accessibility',
    lhrKey: 'accessibility',
    type: 'category',
    precision: 0,
    higherIsBetter: true
  },
  {
    outputKey: 'bestPractices',
    lhrKey: 'best-practices',
    type: 'category',
    precision: 0,
    higherIsBetter: true
  },
  {
    outputKey: 'lcp',
    lhrKey: 'largest-contentful-paint',
    type: 'audit',
    precision: 0,
    higherIsBetter: false
  },
  {
    outputKey: 'fcp',
    lhrKey: 'first-contentful-paint',
    type: 'audit',
    precision: 0,
    higherIsBetter: false
  },
  {
    outputKey: 'tbt',
    lhrKey: 'total-blocking-time',
    type: 'audit',
    precision: 0,
    higherIsBetter: false
  },
  {
    outputKey: 'cls',
    lhrKey: 'cumulative-layout-shift',
    type: 'audit',
    precision: 3,
    higherIsBetter: false
  },
  {
    outputKey: 'speedIndex',
    lhrKey: 'speed-index',
    type: 'audit',
    precision: 0,
    higherIsBetter: false
  }
]

function processMetric(
  config: MetricConfig,
  currentLHR: Result,
  previousLHR: Result
): {
  currentValue: number
  previousValue: number
  diff: number
  isRegression: boolean
} {
  let currentRawValue: number | undefined | null
  let previousRawValue: number | undefined | null

  if (config.type === 'category') {
    currentRawValue = currentLHR.categories[config.lhrKey]?.score
    previousRawValue = previousLHR.categories[config.lhrKey]?.score
  } else {
    // audit
    currentRawValue = currentLHR.audits[config.lhrKey]?.numericValue
    previousRawValue = previousLHR.audits[config.lhrKey]?.numericValue
  }

  let currentValue = currentRawValue ?? 0
  let previousValue = previousRawValue ?? 0

  if (config.type === 'category') {
    currentValue = parseFloat((currentValue * 100).toFixed(config.precision))
    previousValue = parseFloat((previousValue * 100).toFixed(config.precision))
  } else {
    currentValue = parseFloat(currentValue.toFixed(config.precision))
    previousValue = parseFloat(previousValue.toFixed(config.precision))
  }

  const diff = parseFloat(
    (currentValue - previousValue).toFixed(config.precision)
  )
  const isRegression = config.higherIsBetter ? diff < 0 : diff > 0

  return { currentValue, previousValue, diff, isRegression }
}

export const compareLHRs = ({
  runs,
  ancestorRuns
}: {
  runs: RunInterface[]
  ancestorRuns: RunInterface[]
}): {
  [key: string]: ComparisonResultsInterface
} => {
  const parseLHR = (run: RunInterface): RunInterface => {
    const parsedLHR: RunInterface = { ...run }
    try {
      if (typeof run.lhr === 'string') {
        parsedLHR.lhr = JSON.parse(run.lhr) as Result
      }
    } catch (error) {
      if (core.isDebug()) {
        core.debug('Error parsing LHR:')
        core.debug(
          error instanceof Error ? error.message : JSON.stringify(error)
        )
        core.debug('from run:')
        core.debug(JSON.stringify(run, null, 2))
      }
      throw error
    }
    return parsedLHR
  }
  const buildLHR = runs.map(parseLHR)
  const ancestorBuildLHR = ancestorRuns.map(parseLHR)

  if (core.isDebug()) {
    core.debug('buildLHR:')
    core.debug(JSON.stringify(buildLHR, null, 2))

    core.debug('ancestorBuildLHR:')
    core.debug(JSON.stringify(ancestorBuildLHR, null, 2))
  }
  // create object with the url as key
  const buildLHRObject: {
    [key: string]: ComparisonResultsInterface
  } = {}
  for (const run of buildLHR) {
    // find the ancestor run that matches the current run URL
    const ancestorRun = ancestorBuildLHR.find(
      currentAncestorRun => currentAncestorRun.url === run.url
    )

    if (
      ancestorRun &&
      run.lhr &&
      typeof run.lhr === 'object' &&
      ancestorRun.lhr &&
      typeof ancestorRun.lhr === 'object'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const currentLHR: Result = run.lhr as Result
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const previousLHR: Result = ancestorRun.lhr as Result

      const metricResults: Partial<ComparisonResultsInterface> = {}

      for (const metricConfig of metricsToProcess) {
        const result = processMetric(metricConfig, currentLHR, previousLHR)
        metricResults[metricConfig.outputKey] = result
      }

      if (core.isDebug()) {
        core.debug(`Processing URL for LHR comparison: ${run.url}`)
      }
      let urlToUse = run.url
      if (run.url.includes('PORT')) {
        urlToUse = run.url.replace(/PORT/g, '3000')
        if (core.isDebug()) {
          core.debug(
            `Adjusted URL from containing 'PORT' to use port 3000: ${urlToUse} (original: ${run.url})`
          )
        }
      }
      const urlKey = new URL(urlToUse).pathname
      buildLHRObject[urlKey] = metricResults as ComparisonResultsInterface
    } else {
      if (core.isDebug()) {
        let reason = `Skipping LHR comparison for URL: ${run.url}.`
        if (!ancestorRun) {
          reason += ' Ancestor run not found.'
        } else {
          if (!run.lhr || typeof run.lhr !== 'object')
            reason += ' Current LHR is missing or not an object.'
          if (!ancestorRun.lhr || typeof ancestorRun.lhr !== 'object')
            reason += ' Ancestor LHR is missing or not an object.'
        }
        core.debug(reason)
      }
    }
  }
  return buildLHRObject
}

export const readFileAsJson = ({
  filepath
}: {
  filepath: string
}): { [key: string]: string } => {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, filepath), 'utf-8'))
}

export const getComparisonLinksObject = ({
  inputPath
}: {
  inputPath: string
}): { [key: string]: string } => {
  return readFileAsJson({ filepath: inputPath })
}
