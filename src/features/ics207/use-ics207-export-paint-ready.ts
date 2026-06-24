import { useEffect, useMemo, useState } from 'react'
import type { ExportOrgChartIcs207Input } from '@/features/ics207/export-org-chart-ics207'
import {
  buildOrgChartExportPaintInput,
  waitAndPaintExportConnectors,
} from '@/features/roster/org-chart-export-connector-paint'

export function useIcs207ExportPaintReady(
  container: HTMLElement | null,
  exportInput: ExportOrgChartIcs207Input | null,
  readyKey: string
): boolean {
  const paintInput = useMemo(
    () => (exportInput ? buildOrgChartExportPaintInput(exportInput) : null),
    [exportInput]
  )
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!container || !paintInput) {
      setIsReady(false)
      return
    }

    let cancelled = false
    setIsReady(false)

    void waitAndPaintExportConnectors(container, paintInput)
      .then((result) => {
        if (!cancelled) setIsReady(result.ok)
      })
      .catch(() => {
        if (!cancelled) setIsReady(false)
      })

    return () => {
      cancelled = true
    }
  }, [container, paintInput, readyKey])

  return isReady
}
