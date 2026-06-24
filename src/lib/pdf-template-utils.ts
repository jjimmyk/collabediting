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

export function resolveAdaptiveWidgetPadding(rect: PdfWidgetRect, preferred = 4): number {
  return Math.max(0.75, Math.min(preferred, rect.height * 0.12, rect.width * 0.12))
}

export function truncateTextToFitWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string {
  if (text.length === 0) return text
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text
  let cut = text.length
  while (cut > 0 && font.widthOfTextAtSize(text.slice(0, cut), fontSize) > maxWidth) {
    cut -= 1
  }
  return cut > 0 ? text.slice(0, cut) : ''
}

export function resolveFontSizeForWidgetRect(
  rect: PdfWidgetRect,
  font: PDFFont,
  text: string,
  options: { fontSize?: number; padding?: number } = {}
): { fontSize: number; padding: number; lineHeight: number } {
  const preferredFontSize = options.fontSize ?? 9
  const padding = options.padding ?? resolveAdaptiveWidgetPadding(rect)
  const maxByHeight = Math.max(4, rect.height - padding * 2)
  let fontSize = Math.min(preferredFontSize, maxByHeight)
  const maxWidth = Math.max(1, rect.width - padding * 2)
  const trimmed = text.trim()

  while (fontSize > 4) {
    const firstLineY = rect.y + rect.height - padding - fontSize
    const minY = rect.y + padding
    const lineWidth = trimmed.length > 0 ? font.widthOfTextAtSize(trimmed, fontSize) : 0
    if (firstLineY >= minY && lineWidth <= maxWidth) {
      break
    }
    fontSize -= 0.5
  }

  return {
    fontSize,
    padding,
    lineHeight: Math.max(fontSize + 0.5, Math.min(fontSize * 1.15, rect.height - padding * 2)),
  }
}

export function drawTextInWidgetRect(
  page: PDFPage,
  font: PDFFont,
  rect: PdfWidgetRect,
  text: string,
  options: {
    fontSize?: number
    lineHeight?: number
    padding?: number
    maskBackground?: boolean
    /** Use a fixed font size and clip text that exceeds the widget bounds. */
    clipOverflow?: boolean
  } = {}
): void {
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

  if (options.clipOverflow) {
    const fontSize = options.fontSize ?? 9
    const padding = options.padding ?? resolveAdaptiveWidgetPadding(rect)
    const lineHeight = options.lineHeight ?? Math.max(fontSize + 0.5, fontSize * 1.15)
    const maxWidth = Math.max(1, rect.width - padding * 2)
    const lines = wrapPdfLinesForWidth(trimmed, font, fontSize, maxWidth).map((line) =>
      truncateTextToFitWidth(line, font, fontSize, maxWidth)
    )
    let y = rect.y + rect.height - padding - fontSize
    const minY = rect.y + padding
    for (const line of lines) {
      if (y < minY) break
      if (line.length > 0) {
        page.drawText(line, {
          x: rect.x + padding,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        })
      }
      y -= lineHeight
    }
    return
  }

  const layout = resolveFontSizeForWidgetRect(rect, font, trimmed, options)
  const lineHeight = options.lineHeight ?? layout.lineHeight
  const maxWidth = Math.max(1, rect.width - layout.padding * 2)
  const lines = wrapPdfLinesForWidth(trimmed, font, layout.fontSize, maxWidth)
  let y = rect.y + rect.height - layout.padding - layout.fontSize
  const minY = rect.y + layout.padding
  for (const line of lines) {
    if (y < minY) break
    page.drawText(line, {
      x: rect.x + layout.padding,
      y,
      size: layout.fontSize,
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
