import { useEffect, useState } from 'react'
import {
  resolveIcs207CaptureRoot,
  waitForOrgChartPainted,
} from '@/features/roster/org-chart-export-capture'
import { triggerOrgChartConnectorRedraw } from '@/features/roster/org-chart-connector-dom'

export function useOrgChartPaintReady(
  container: HTMLElement | null,
  readyKey: string
): boolean {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!container) {
      setIsReady(false)
      return
    }

    let cancelled = false
    setIsReady(false)

    const root = resolveIcs207CaptureRoot(container)
    if (root) {
      triggerOrgChartConnectorRedraw(root)
    }

    void waitForOrgChartPainted(container)
      .then(() => {
        if (!cancelled) setIsReady(true)
      })
      .catch(() => {
        if (!cancelled) setIsReady(false)
      })

    return () => {
      cancelled = true
    }
  }, [container, readyKey])

  return isReady
}
