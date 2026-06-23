import { useEffect, useState } from 'react'
import {
  captureOrgChartFromContainer,
  pngBytesToDataUrl,
} from '@/features/roster/org-chart-export-capture'

export type Ics207OrgChartCaptureState =
  | { status: 'idle' }
  | { status: 'waiting' }
  | { status: 'ready'; pngBytes: Uint8Array; pngDataUrl: string }
  | { status: 'error'; message: string }

export function useIcs207OrgChartCapture(
  container: HTMLElement | null,
  captureKey: string,
  enabled: boolean
): Ics207OrgChartCaptureState {
  const [state, setState] = useState<Ics207OrgChartCaptureState>({ status: 'idle' })

  useEffect(() => {
    if (!enabled || !container) {
      setState({ status: 'idle' })
      return
    }

    let cancelled = false
    setState({ status: 'waiting' })

    void captureOrgChartFromContainer(container)
      .then((pngBytes) => {
        if (cancelled) return
        setState({
          status: 'ready',
          pngBytes,
          pngDataUrl: pngBytesToDataUrl(pngBytes),
        })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Could not capture org chart for ICS-207 export.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [captureKey, container, enabled])

  return state
}
