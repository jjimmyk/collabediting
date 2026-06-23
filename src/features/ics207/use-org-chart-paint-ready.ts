import { useEffect, useState } from 'react'
import { waitForOrgChartPainted } from '@/features/roster/org-chart-export-capture'

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

    void waitForOrgChartPainted(container)
      .then(() => {
        if (!cancelled) setIsReady(true)
      })
      .catch(() => {
        if (!cancelled) setIsReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [container, readyKey])

  return isReady
}
