import { toPng } from 'html-to-image'

export type CaptureOrgChartImageOptions = {
  root: HTMLElement
  backgroundColor?: string
  pixelRatio?: number
}

export async function captureOrgChartImage(
  options: CaptureOrgChartImageOptions
): Promise<Uint8Array> {
  const { root } = options
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
