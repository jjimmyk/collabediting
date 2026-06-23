import { captureOrgChartImage } from '@/features/roster/capture-org-chart-image'

const MIN_CAPTURE_WIDTH_PX = 80
const MIN_CAPTURE_HEIGHT_PX = 80
const MIN_PNG_BYTES = 8_000
const CONNECTOR_FALLBACK_MS = 3_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

async function nextFrames(count = 2): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }
}

export function resolveOrgChartCaptureTarget(container: HTMLElement): HTMLElement | null {
  const wideRoot = container.querySelector<HTMLElement>('[data-org-chart-wide-root]')
  if (wideRoot) return wideRoot

  return container.querySelector<HTMLElement>('[data-org-chart-export-root]')
}

function countConnectorLines(chartRoot: HTMLElement): number {
  return chartRoot.querySelectorAll('[data-org-chart-connectors] line').length
}

function countOrgChartCards(chartRoot: HTMLElement): number {
  return chartRoot.querySelectorAll('[data-org-chart-id]').length
}

function hasMinimumDimensions(chartRoot: HTMLElement): boolean {
  return (
    chartRoot.offsetWidth >= MIN_CAPTURE_WIDTH_PX &&
    chartRoot.offsetHeight >= MIN_CAPTURE_HEIGHT_PX
  )
}

function isCaptureTargetReady(
  chartRoot: HTMLElement,
  options: { requireConnectors: boolean }
): boolean {
  if (!hasMinimumDimensions(chartRoot)) return false
  if (countOrgChartCards(chartRoot) === 0) return false

  const isWide = chartRoot.hasAttribute('data-org-chart-wide-root')
  if (isWide && options.requireConnectors) {
    return countConnectorLines(chartRoot) > 0
  }

  return true
}

export async function waitForOrgChartCaptureReady(
  container: HTMLElement,
  options: { timeoutMs?: number } = {}
): Promise<HTMLElement> {
  const timeoutMs = options.timeoutMs ?? 15_000
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const target = resolveOrgChartCaptureTarget(container)
    if (target) {
      const requireConnectors = Date.now() - started < CONNECTOR_FALLBACK_MS
      if (isCaptureTargetReady(target, { requireConnectors })) {
        await nextFrames(3)
        if (isCaptureTargetReady(target, { requireConnectors: false })) {
          return target
        }
      }
    }
    await sleep(80)
  }

  throw new Error('Org chart capture timed out before connectors and cards were ready.')
}

export function assertOrgChartCaptureNotBlank(pngBytes: Uint8Array): void {
  if (pngBytes.length < MIN_PNG_BYTES) {
    throw new Error('Org chart screenshot was blank or too small.')
  }
}

export async function captureOrgChartElement(
  target: HTMLElement
): Promise<Uint8Array> {
  const pngBytes = await captureOrgChartImage({
    root: target,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  })
  assertOrgChartCaptureNotBlank(pngBytes)
  return pngBytes
}

export async function captureOrgChartFromContainer(
  container: HTMLElement
): Promise<Uint8Array> {
  const target = await waitForOrgChartCaptureReady(container)
  return captureOrgChartElement(target)
}

export function pngBytesToDataUrl(pngBytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < pngBytes.length; i += 1) {
    binary += String.fromCharCode(pngBytes[i]!)
  }
  return `data:image/png;base64,${btoa(binary)}`
}
