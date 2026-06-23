import {
  captureOrgChartImageWithFallbacks,
  countOrgChartConnectorLines,
  type CaptureOrgChartImageOptions,
} from '@/features/roster/capture-org-chart-image'
import { triggerOrgChartConnectorRedraw } from '@/features/roster/org-chart-connector-dom'

export const ICS207_CAPTURE_ROOT_ATTR = 'data-ics207-capture-root'
export const ORG_CHART_PAINT_COMPLETE_ATTR = 'data-org-chart-paint-complete'
export const ROSTER_ORG_CHART_LIVE_ROOT_ATTR = 'data-roster-org-chart-live-root'

const MIN_CAPTURE_WIDTH_PX = 1
const MIN_CAPTURE_HEIGHT_PX = 1
const MIN_PNG_BYTES = 1_024
const PAINT_WAIT_MS = 8_000
const CAPTURE_TIMEOUT_MS = 8_000
const CONNECTOR_RETRY_MS = 5_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

async function nextFrames(count = 2): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)

    void promise
      .then((value) => {
        globalThis.clearTimeout(timer)
        resolve(value)
      })
      .catch((error: unknown) => {
        globalThis.clearTimeout(timer)
        reject(error)
      })
  })
}

export function resolveIcs207CaptureRoot(container: HTMLElement): HTMLElement | null {
  const wideRoot = container.querySelector<HTMLElement>('[data-org-chart-wide-root]')
  if (wideRoot) return wideRoot

  const dedicated = container.querySelector<HTMLElement>(`[${ICS207_CAPTURE_ROOT_ATTR}]`)
  if (dedicated) return dedicated

  const liveRoot = container.querySelector<HTMLElement>(`[${ROSTER_ORG_CHART_LIVE_ROOT_ATTR}]`)
  if (liveRoot) return liveRoot

  return container.querySelector<HTMLElement>('[data-org-chart-export-root]')
}

function countOrgChartCards(root: HTMLElement): number {
  return root.querySelectorAll('[data-org-chart-id]').length
}

function hasMinimumDimensions(root: HTMLElement): boolean {
  return (
    root.offsetWidth >= MIN_CAPTURE_WIDTH_PX && root.offsetHeight >= MIN_CAPTURE_HEIGHT_PX
  )
}

function isPaintComplete(root: HTMLElement): boolean {
  return root.hasAttribute(ORG_CHART_PAINT_COMPLETE_ATTR)
}

function isWideOrgChart(root: HTMLElement): boolean {
  return root.hasAttribute('data-org-chart-wide-root')
}

async function ensureWideConnectorsPainted(root: HTMLElement): Promise<void> {
  if (!isWideOrgChart(root)) return

  const cardCount = countOrgChartCards(root)
  if (cardCount <= 1) return

  const started = Date.now()
  while (Date.now() - started < CONNECTOR_RETRY_MS) {
    triggerOrgChartConnectorRedraw(root)
    if (countOrgChartConnectorLines(root) > 0) {
      await nextFrames(2)
      return
    }
    await nextFrames(1)
  }

  if (countOrgChartConnectorLines(root) === 0) {
    throw new Error('Org chart connector lines are not ready. Try exporting again.')
  }
}

export async function waitForOrgChartPainted(
  container: HTMLElement,
  options: { timeoutMs?: number } = {}
): Promise<HTMLElement> {
  const timeoutMs = options.timeoutMs ?? PAINT_WAIT_MS
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const root = resolveIcs207CaptureRoot(container)
    if (root) {
      if (isPaintComplete(root)) {
        await nextFrames(2)
        await ensureWideConnectorsPainted(root)
        return root
      }

      if (countOrgChartCards(root) > 0 && hasMinimumDimensions(root)) {
        if (isWideOrgChart(root) && countOrgChartConnectorLines(root) === 0) {
          await nextFrames(1)
          continue
        }
        await nextFrames(2)
        await ensureWideConnectorsPainted(root)
        return root
      }
    }
    await sleep(50)
  }

  const root = resolveIcs207CaptureRoot(container)
  if (root) {
    await ensureWideConnectorsPainted(root)
    return root
  }

  throw new Error('Org chart preview is not ready to export.')
}

export function assertOrgChartCaptureNotBlank(
  pngBytes: Uint8Array,
  options: { strict?: boolean } = {}
): void {
  const strict = options.strict ?? false
  if (pngBytes.length < MIN_PNG_BYTES) {
    const message = 'Org chart screenshot was blank or too small.'
    if (strict) {
      throw new Error(message)
    }
  }
}

export async function captureOrgChartElement(
  target: HTMLElement,
  options: Omit<CaptureOrgChartImageOptions, 'root'> = {}
): Promise<Uint8Array> {
  await ensureWideConnectorsPainted(target)

  const pngBytes = await withTimeout(
    captureOrgChartImageWithFallbacks({
      root: target,
      backgroundColor: options.backgroundColor ?? '#ffffff',
      pixelRatio: options.pixelRatio ?? 1.5,
    }),
    CAPTURE_TIMEOUT_MS,
    'Org chart screenshot timed out.'
  )
  assertOrgChartCaptureNotBlank(pngBytes)
  return pngBytes
}

export async function captureOrgChartFromContainer(
  container: HTMLElement
): Promise<Uint8Array> {
  const target = await waitForOrgChartPainted(container)
  return captureOrgChartElement(target)
}

export async function captureIcs207Box4ForPdf(input: {
  box4Container: HTMLElement
}): Promise<Uint8Array> {
  await waitForOrgChartPainted(input.box4Container)

  const target = resolveIcs207CaptureRoot(input.box4Container)
  if (!target) {
    throw new Error('Org chart capture root not found in ICS-207 preview.')
  }

  return captureOrgChartElement(target)
}

export function pngBytesToDataUrl(pngBytes: Uint8Array): string {
  const chunkSize = 0x8000
  let binary = ''
  for (let i = 0; i < pngBytes.length; i += chunkSize) {
    binary += String.fromCharCode(...pngBytes.subarray(i, i + chunkSize))
  }
  return `data:image/png;base64,${btoa(binary)}`
}

/** @deprecated Prefer resolving the user's current roster zoom at export time. */
export const waitForOrgChartCaptureReady = waitForOrgChartPainted
