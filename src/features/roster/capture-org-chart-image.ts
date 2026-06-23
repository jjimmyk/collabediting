import { toPng } from 'html-to-image'

export type CaptureOrgChartImageOptions = {
  root: HTMLElement
  backgroundColor?: string
  pixelRatio?: number
}

export async function captureOrgChartImage(
  options: CaptureOrgChartImageOptions
): Promise<Uint8Array> {
  const dataUrl = await toPng(options.root, {
    backgroundColor: options.backgroundColor ?? '#ffffff',
    pixelRatio: options.pixelRatio ?? 2,
    cacheBust: true,
    skipFonts: false,
  })
  const response = await fetch(dataUrl)
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
}

export async function waitForOrgChartLayoutSettle(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 400)
  })
}
