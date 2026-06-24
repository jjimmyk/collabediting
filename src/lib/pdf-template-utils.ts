import { PDFDocument, type PDFFont, type PDFPage, rgb } from 'pdf-lib'

export type PdfWidgetRect = {
  x: number
  y: number
  width: number
  height: number
}

export function wrapPdfLinesForWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const paragraphs = text.split(/\r?\n/)
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    const tokens = paragraph.split(/\s+/).filter(Boolean)
    if (tokens.length === 0) {
      lines.push('')
      continue
    }
    let current = ''
    for (const word of tokens) {
      const candidate = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate
        continue
      }
      if (current) {
        lines.push(current)
        current = ''
      }
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        let remaining = word
        while (remaining.length > 0) {
          let cut = remaining.length
          while (cut > 1 && font.widthOfTextAtSize(remaining.slice(0, cut), fontSize) > maxWidth) {
            cut -= 1
          }
          lines.push(remaining.slice(0, cut))
          remaining = remaining.slice(cut)
        }
      } else {
        current = word
      }
    }
    if (current) lines.push(current)
  }
  return lines.length > 0 ? lines : ['']
}

export function maxLinesForWidgetRect(
  rect: Pick<PdfWidgetRect, 'height'>,
  options: { fontSize?: number; lineHeight?: number; padding?: number } = {}
): number {
  const fontSize = options.fontSize ?? 9
  const lineHeight = options.lineHeight ?? 11
  const padding = options.padding ?? 4
  const usableHeight = Math.max(0, rect.height - padding * 2)
  return Math.max(1, Math.floor((usableHeight + lineHeight - fontSize) / lineHeight))
}

export function splitWrappedLinesIntoChunks(lines: string[], maxLinesPerChunk: number): string[][] {
  if (lines.length === 0) return [[]]
  const chunks: string[][] = []
  for (let index = 0; index < lines.length; index += maxLinesPerChunk) {
    chunks.push(lines.slice(index, index + maxLinesPerChunk))
  }
  return chunks
}

export function splitTextForWidgetRect(
  text: string,
  font: PDFFont,
  rect: PdfWidgetRect,
  options: { fontSize?: number; lineHeight?: number; padding?: number } = {}
): string[] {
  const fontSize = options.fontSize ?? 9
  const padding = options.padding ?? 4
  const maxWidth = Math.max(1, rect.width - padding * 2)
  const lines = wrapPdfLinesForWidth(text.trim(), font, fontSize, maxWidth)
  const maxLines = maxLinesForWidgetRect(rect, options)
  return splitWrappedLinesIntoChunks(lines, maxLines).map((chunk) => chunk.join('\n'))
}

export function drawTextInWidgetRect(
  page: PDFPage,
  font: PDFFont,
  rect: PdfWidgetRect,
  text: string,
  options: { fontSize?: number; lineHeight?: number; maskBackground?: boolean } = {}
): void {
  const fontSize = options.fontSize ?? 9
  const lineHeight = options.lineHeight ?? 11
  const padding = 4
  const trimmed = text.trim()

  if (options.maskBackground) {
    page.drawRectangle({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    })
  }

  if (trimmed.length === 0) return

  const maxWidth = Math.max(1, rect.width - padding * 2)
  const lines = wrapPdfLinesForWidth(trimmed, font, fontSize, maxWidth)
  let y = rect.y + rect.height - padding - fontSize
  const minY = rect.y + padding
  for (const line of lines) {
    if (y < minY) break
    page.drawText(line, {
      x: rect.x + padding,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    y -= lineHeight
  }
}

export function getPdfTextFieldWidgetRect(
  pdfForm: ReturnType<PDFDocument['getForm']>,
  fieldName: string
): PdfWidgetRect | null {
  try {
    const widget = pdfForm.getTextField(fieldName).acroField.getWidgets()[0]
    return widget.getRectangle()
  } catch {
    return null
  }
}

export function setPdfTextFieldSafe(
  pdfForm: ReturnType<PDFDocument['getForm']>,
  fieldNames: Set<string>,
  name: string,
  value: string
): void {
  if (!fieldNames.has(name)) return
  try {
    const field = pdfForm.getTextField(name)
    field.disableRichFormatting()
    field.setText(value ?? '')
  } catch {
    // Non-writable or missing widget — skip.
  }
}
