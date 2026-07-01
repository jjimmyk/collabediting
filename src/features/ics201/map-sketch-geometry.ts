import type { Ics201MapSketchVertex } from '@/features/ics201/types'

export type PdfImageRect = {
  x: number
  y: number
  width: number
  height: number
}

export type PdfImageLayout = PdfImageRect & {
  clipX: number
  clipY: number
  clipWidth: number
  clipHeight: number
}

export function verticesToClosedRing(vertices: Ics201MapSketchVertex[]): number[][] {
  if (vertices.length === 0) return []
  const ring = vertices.map((vertex) => [vertex.longitude, vertex.latitude])
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]])
  }
  return ring
}

export function computeClippedImageLayout(
  imageWidth: number,
  imageHeight: number,
  rect: PdfImageRect,
  padding = 4
): PdfImageLayout {
  const clipX = rect.x + padding
  const clipY = rect.y + padding
  const clipWidth = Math.max(1, rect.width - padding * 2)
  const clipHeight = Math.max(1, rect.height - padding * 2)
  const scale = Math.min(clipWidth / imageWidth, clipHeight / imageHeight)
  const drawWidth = imageWidth * scale
  const drawHeight = imageHeight * scale
  const drawX = clipX + (clipWidth - drawWidth) / 2
  const drawY = clipY + (clipHeight - drawHeight) / 2
  return {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight,
    clipX,
    clipY,
    clipWidth,
    clipHeight,
  }
}

export function pngBytesToDataUrl(png: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < png.length; index += 1) {
    binary += String.fromCharCode(png[index]!)
  }
  return `data:image/png;base64,${btoa(binary)}`
}
