import { toPng } from 'html-to-image'

export type CaptureOrgChartImageOptions = {
  root: HTMLElement
  backgroundColor?: string
  pixelRatio?: number
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

async function captureWithOptions(
  root: HTMLElement,
  options: CaptureOrgChartImageOptions
): Promise<Uint8Array> {
  const width = Math.max(root.scrollWidth, root.offsetWidth)
  const height = Math.max(root.scrollHeight, root.offsetHeight)

  if (width <= 0 || height <= 0) {
    throw new Error('Org chart capture target has zero dimensions.')
  }

  const dataUrl = await toPng(root, {
    backgroundColor: options.backgroundColor ?? '#ffffff',
    pixelRatio: options.pixelRatio ?? 2,
    cacheBust: true,
    skipFonts: false,
    width,
    height,
    style: {
      transform: 'none',
      margin: '0',
    },
  })

  const response = await fetch(dataUrl)
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}

export async function captureOrgChartImage(
  options: CaptureOrgChartImageOptions
): Promise<Uint8Array> {
  return captureWithOptions(options.root, options)
}

export async function captureOrgChartImageNormalized(
  options: CaptureOrgChartImageOptions
): Promise<Uint8Array> {
  const normalized = applyNormalizedZoom(options.root)
  try {
    return await captureWithOptions(options.root, options)
  } finally {
    restoreNormalizedZoom(normalized)
  }
}

export async function captureOrgChartImageWithFallbacks(
  options: CaptureOrgChartImageOptions
): Promise<Uint8Array> {
  const attempts = [
    () => captureOrgChartImageNormalized(options),
    () => captureOrgChartImage({ ...options, pixelRatio: 1.5 }),
    () => captureOrgChartImage(options),
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
