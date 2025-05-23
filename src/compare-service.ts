import { ComparisonResultsInterface, RunInterface } from './types.d'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type Result from 'lighthouse/types/lhr/lhr'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { Result as AuditResult } from 'lighthouse/types/lhr/audit-result'
import fs from 'fs'
import path from 'path'
import * as core from '@actions/core'

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
    const ancestorRun = ancestorBuildLHR.filter(
      currentAncestorRun => currentAncestorRun.url === run.url
    )[0]
    if (typeof run.lhr !== 'string' || typeof ancestorRun.lhr !== 'string') {
      const runLHR: Result = run.lhr as Result
      const ancestorRunLHR: Result = ancestorRun.lhr as Result
      // get the performance score, lcp, tbt and cls of the current run and the ancestor run and compare them
      // Performance
      const performance: Result.Category = runLHR.categories.performance
      const ancestorPerformance: Result.Category =
        ancestorRunLHR.categories.performance
      const currentPerformance = parseFloat(
        ((performance.score ? performance.score : 0) * 100).toFixed(0)
      )
      const previousPerformance = parseFloat(
        (
          (ancestorPerformance.score ? ancestorPerformance.score : 0) * 100
        ).toFixed(0)
      )
      const diffPerformance = parseFloat(
        (currentPerformance - previousPerformance).toFixed(0)
      )
      const isPerformanceRegression = diffPerformance < 0

      // SEO
      const seo: Result.Category = runLHR.categories.seo
      const ancestorSEO: Result.Category = ancestorRunLHR.categories.seo
      const currentSEO = parseFloat(
        ((seo.score ? seo.score : 0) * 100).toFixed(0)
      )
      const previousSEO = parseFloat(
        ((ancestorSEO.score ? ancestorSEO.score : 0) * 100).toFixed(0)
      )
      const diffSEO = parseFloat((currentSEO - previousSEO).toFixed(0))
      const isSEORegression = diffSEO < 0

      // Accessibility
      const accessibility: Result.Category = runLHR.categories.accessibility
      const ancestorAccessibility: Result.Category =
        ancestorRunLHR.categories.accessibility
      const currentAccessibility = parseFloat(
        ((accessibility.score ? accessibility.score : 0) * 100).toFixed(0)
      )
      const previousAccessibility = parseFloat(
        (
          (ancestorAccessibility.score ? ancestorAccessibility.score : 0) * 100
        ).toFixed(0)
      )
      const diffAccessibility = parseFloat(
        (currentAccessibility - previousAccessibility).toFixed(0)
      )
      const isAccessibilityRegression = diffAccessibility < 0

      // Best Practices
      const bestPractice: Result.Category = runLHR.categories['best-practices']
      const ancestorBestPractice: Result.Category =
        ancestorRunLHR.categories['best-practices']
      const currentBestPractice = parseFloat(
        ((bestPractice.score ? bestPractice.score : 0) * 100).toFixed(0)
      )
      const previousBestPractice = parseFloat(
        (
          (ancestorBestPractice.score ? ancestorBestPractice.score : 0) * 100
        ).toFixed(0)
      )
      const diffBestPractice = parseFloat(
        (currentBestPractice - previousBestPractice).toFixed(0)
      )
      const isBestPracticeRegression = diffBestPractice < 0

      //  LCP - Largest Contentful Paint
      const lcp: AuditResult = runLHR.audits['largest-contentful-paint']
      const ancestorLCP: AuditResult =
        ancestorRunLHR.audits['largest-contentful-paint']
      const currentLCP = parseFloat(
        (lcp.numericValue ? lcp.numericValue : 0).toFixed(0)
      )
      const previousLCP = parseFloat(
        (ancestorLCP.numericValue ? ancestorLCP.numericValue : 0).toFixed(0)
      )
      const diffLCP = currentLCP - previousLCP
      const isLCPRegression = diffLCP > 0

      //  FCP - First Contentful Paint
      const fcp: AuditResult = runLHR.audits['first-contentful-paint']
      const ancestorFCP: AuditResult =
        ancestorRunLHR.audits['first-contentful-paint']
      const currentFCP = parseFloat(
        (fcp.numericValue ? fcp.numericValue : 0).toFixed(0)
      )
      const previousFCP = parseFloat(
        (ancestorFCP.numericValue ? ancestorFCP.numericValue : 0).toFixed(0)
      )
      const diffFCP = currentFCP - previousFCP
      const isFCPRegression = diffFCP > 0

      // TBT - Total Blocking Time
      const tbt: AuditResult = runLHR.audits['total-blocking-time']
      const ancestorTBT: AuditResult =
        ancestorRunLHR.audits['total-blocking-time']
      const currentTBT = parseFloat(
        (tbt.numericValue ? tbt.numericValue : 0).toFixed(0)
      )
      const previousTBT = parseFloat(
        (ancestorTBT.numericValue ? ancestorTBT.numericValue : 0).toFixed(0)
      )
      const diffTBT = currentTBT - previousTBT
      const isTBTRegression = diffTBT > 0

      // CLS - Cumulative Layout Shift
      const cls: AuditResult = runLHR.audits['cumulative-layout-shift']
      const ancestorCLS: AuditResult =
        ancestorRunLHR.audits['cumulative-layout-shift']
      const currentCLS = parseFloat(
        (cls.numericValue ? cls.numericValue : 0).toFixed(3)
      )
      const previousCLS = parseFloat(
        (ancestorCLS.numericValue ? ancestorCLS.numericValue : 0).toFixed(3)
      )
      const diffCLS = currentCLS - previousCLS
      const isCLSRegression = diffCLS > 0

      // Speed Index
      const speedIndex: AuditResult = runLHR.audits['speed-index']
      const ancestorSpeedIndex: AuditResult =
        ancestorRunLHR.audits['speed-index']
      const currentSpeedIndex = parseFloat(
        (speedIndex.numericValue ? speedIndex.numericValue : 0).toFixed(3)
      )
      const previousSpeedIndex = parseFloat(
        (ancestorSpeedIndex.numericValue
          ? ancestorSpeedIndex.numericValue
          : 0
        ).toFixed(3)
      )
      const diffSpeedIndex = currentSpeedIndex - previousSpeedIndex
      const isSpeedIndexRegression = diffSpeedIndex > 0

      // we will simplify the url to only be the pathname
      console.log('run.url', run.url)
      // if self hosting, the url might be using an invalid port like so:  localhost:PORT
      // if run.url contains the string "PORT" replace it with 3000
      let urlToUse = run.url
      if (run.url.includes('PORT')) {
        urlToUse = run.url.replace(/PORT/g, '3000')
      }
      const url = new URL(urlToUse)
      const urlWithoutPort = url.toString()
      console.log('urlWithoutPort', urlWithoutPort)

      const urlKey = new URL(urlToUse).pathname
      buildLHRObject[urlKey] = {
        performance: {
          currentValue: currentPerformance,
          previousValue: previousPerformance,
          diff: diffPerformance,
          isRegression: isPerformanceRegression
        },
        seo: {
          currentValue: currentSEO,
          previousValue: previousSEO,
          diff: diffSEO,
          isRegression: isSEORegression
        },
        accessibility: {
          currentValue: currentAccessibility,
          previousValue: previousAccessibility,
          diff: diffAccessibility,
          isRegression: isAccessibilityRegression
        },
        bestPractices: {
          currentValue: currentBestPractice,
          previousValue: previousBestPractice,
          diff: diffBestPractice,
          isRegression: isBestPracticeRegression
        },
        fcp: {
          currentValue: currentFCP,
          previousValue: previousFCP,
          diff: diffFCP,
          isRegression: isFCPRegression
        },
        lcp: {
          currentValue: currentLCP,
          previousValue: previousLCP,
          diff: diffLCP,
          isRegression: isLCPRegression
        },
        cls: {
          currentValue: currentCLS,
          previousValue: previousCLS,
          diff: diffCLS,
          isRegression: isCLSRegression
        },
        tbt: {
          currentValue: currentTBT,
          previousValue: previousTBT,
          diff: diffTBT,
          isRegression: isTBTRegression
        },
        speedIndex: {
          currentValue: currentSpeedIndex,
          previousValue: previousSpeedIndex,
          diff: diffSpeedIndex,
          isRegression: isSpeedIndexRegression
        }
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
