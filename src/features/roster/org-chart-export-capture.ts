import { captureOrgChartImage } from '@/features/roster/capture-org-chart-image'

const MIN_CAPTURE_WIDTH_PX = 120
const MIN_CAPTURE_HEIGHT_PX = 120
const MIN_PNG_BYTES = 8_000

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

function isCaptureTargetReady(chartRoot: HTMLElement): boolean {
  if (chartRoot.offsetWidth < MIN_CAPTURE_WIDTH_PX) return false
  if (chartRoot.offsetHeight < MIN_CAPTURE_HEIGHT_PX) return false

  const isWide = chartRoot.hasAttribute('data-org-chart-wide-root')
  if (isWide) {
    return countConnectorLines(chartRoot) > 0 && countOrgChartCards(chartRoot) > 0
  }

  return countOrgChartCards(chartRoot) > 0
}

export async function waitForOrgChartCaptureReady(
  container: HTMLElement,
  options: { timeoutMs?: number } = {}
): Promise<HTMLElement> {
  const timeoutMs = options.timeoutMs ?? 10_000
  const started = Date.now()

  while (Date.now() - started < timeoutMs) {
    const target = resolveOrgChartCaptureTarget(container)
    if (target && isCaptureTargetReady(target)) {
      await nextFrames(3)
      if (isCaptureTargetReady(target)) {
        return target
      }
    }
    await sleep(60)
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

export function pngBytesToDataUrl(pngBytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < pngBytes.length; i += 1) {
    binary += String.fromCharCode(pngBytes[i]!)
  }
  return `data:image/png;base64,${btoa(binary)}`
}
