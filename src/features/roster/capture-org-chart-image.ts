import { toPng } from 'html-to-image'

export type CaptureOrgChartImageOptions = {
  root: HTMLElement
  backgroundColor?: string
  pixelRatio?: number
  /** When true, omit transform overrides that break SVG connector alignment. */
  preserveTransforms?: boolean
}

type NormalizedZoomState = {
  element: HTMLElement
  previousZoom: string
  previousTransform: string
  previousTransformOrigin: string
}

function findCssZoomElement(root: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = root
  while (node) {
    const zoom = node.style.zoom
    if (zoom && zoom !== '1' && zoom !== 'normal') {
      return node
    }
    node = node.parentElement
  }

  return root.querySelector<HTMLElement>('div[style*="zoom"]')
}

function applyNormalizedZoom(root: HTMLElement): NormalizedZoomState | null {
  const zoomElement = findCssZoomElement(root)
  if (!zoomElement) return null

  const zoomValue = Number.parseFloat(zoomElement.style.zoom)
  if (!Number.isFinite(zoomValue) || zoomValue <= 0 || zoomValue === 1) return null

  const previousZoom = zoomElement.style.zoom
  const previousTransform = zoomElement.style.transform
  const previousTransformOrigin = zoomElement.style.transformOrigin

  zoomElement.style.zoom = '1'
  zoomElement.style.transformOrigin = 'top left'
  zoomElement.style.transform = `scale(${zoomValue})`

  return {
    element: zoomElement,
    previousZoom,
    previousTransform,
    previousTransformOrigin,
  }
}

function restoreNormalizedZoom(state: NormalizedZoomState | null): void {
  if (!state) return
  state.element.style.zoom = state.previousZoom
  state.element.style.transform = state.previousTransform
  state.element.style.transformOrigin = state.previousTransformOrigin
}

export function measureOrgChartCaptureSize(root: HTMLElement): { width: number; height: number } {
  const rootRect = root.getBoundingClientRect()
  const elements = [
    ...root.querySelectorAll('[data-org-chart-id]'),
    ...root.querySelectorAll('[data-org-chart-connectors]'),
  ]

  if (elements.length === 0) {
    return {
      width: Math.max(root.scrollWidth, root.offsetWidth, 1),
      height: Math.max(root.scrollHeight, root.offsetHeight, 1),
    }
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const element of elements) {
    const rect = element.getBoundingClientRect()
    if (rect.width <= 0 && rect.height <= 0) continue
    minX = Math.min(minX, rect.left - rootRect.left)
    minY = Math.min(minY, rect.top - rootRect.top)
    maxX = Math.max(maxX, rect.right - rootRect.left)
    maxY = Math.max(maxY, rect.bottom - rootRect.top)
  }

  const padding = 16
  return {
    width: Math.max(Math.ceil(maxX - minX + padding * 2), root.offsetWidth, 1),
    height: Math.max(Math.ceil(maxY - minY + padding * 2), root.offsetHeight, 1),
  }
}

async function captureWithOptions(options: CaptureOrgChartImageOptions): Promise<Uint8Array> {
  const { root } = options
  const measured = measureOrgChartCaptureSize(root)
  const width = Math.max(measured.width, root.scrollWidth, root.offsetWidth)
  const height = Math.max(measured.height, root.scrollHeight, root.offsetHeight)

  if (width <= 0 || height <= 0) {
    throw new Error('Org chart capture target has zero dimensions.')
  }

  const toPngOptions: Parameters<typeof toPng>[1] = {
    backgroundColor: options.backgroundColor ?? '#ffffff',
    pixelRatio: options.pixelRatio ?? 1.5,
    cacheBust: true,
    skipFonts: false,
    width,
    height,
  }

  if (!options.preserveTransforms) {
    toPngOptions.style = {
      transform: 'none',
      margin: '0',
    }
  }

  const dataUrl = await toPng(root, toPngOptions)
  const response = await fetch(dataUrl)
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}

export async function captureOrgChartImage(
  options: CaptureOrgChartImageOptions
): Promise<Uint8Array> {
  return captureWithOptions({ ...options, preserveTransforms: true })
}

export async function captureOrgChartImageNormalized(
  options: CaptureOrgChartImageOptions
): Promise<Uint8Array> {
  const normalized = applyNormalizedZoom(options.root)
  try {
    return await captureWithOptions({ ...options, preserveTransforms: true })
  } finally {
    restoreNormalizedZoom(normalized)
  }
}

export async function captureOrgChartImageWithFallbacks(
  options: CaptureOrgChartImageOptions
): Promise<Uint8Array> {
  const attempts = [
    () => captureOrgChartImage(options),
    () => captureOrgChartImage({ ...options, pixelRatio: 1.25 }),
    () => captureOrgChartImageNormalized(options),
    () => captureWithOptions({ ...options, preserveTransforms: false, pixelRatio: 1.25 }),
  ]

  let lastError: unknown = null
  for (const attempt of attempts) {
    try {
      return await attempt()
    } catch (error: unknown) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Could not capture org chart image.')
}

export function countOrgChartConnectorLines(root: HTMLElement): number {
  return root.querySelectorAll('[data-org-chart-connectors] line').length
}
