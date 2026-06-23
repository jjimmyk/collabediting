import {
  clip,
  endPath,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  StandardFonts,
  rgb,
  type PDFPage,
} from 'pdf-lib'
import {
  ICS207_PDF_CHART_BOX,
  ICS207_PDF_CHART_INNER_PADDING_PT,
  ICS207_PDF_CONTENT_WIDTH,
  ICS207_PDF_FOOTER_BOTTOM_Y,
  ICS207_PDF_HEADER_ROW_BOTTOM_Y,
  ICS207_PDF_HEADER_ROW_HEIGHT_PT,
  ICS207_PDF_PAGE,
  ICS207_PDF_PREPARED_BY_HEIGHT_PT,
  ICS207_PDF_TITLE_TOP_Y,
} from '@/features/ics207/export-template-constants'
import type { Ics207ExportContext } from '@/features/ics207/types'

function clean(value: string | undefined | null): string {
  return (value ?? '').trim()
}

function drawBox(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  lineWidth = 1
): void {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderColor: rgb(0, 0, 0),
    borderWidth: lineWidth,
  })
}

function drawLabel(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>
): void {
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(0, 0, 0),
  })
}

function drawFieldValue(
  page: PDFPage,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  size = 9
): void {
  const trimmed = clean(value)
  if (!trimmed) return
  const maxChars = Math.floor(maxWidth / (size * 0.45))
  const text = trimmed.length > maxChars ? `${trimmed.slice(0, maxChars - 1)}…` : trimmed
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(0, 0, 0),
    maxWidth,
  })
}

function drawTitleAndHeader(
  page: PDFPage,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
  context: Ics207ExportContext
): void {
  const margin = ICS207_PDF_PAGE.marginPt
  const contentWidth = ICS207_PDF_CONTENT_WIDTH
  const third = contentWidth / 3

  drawLabel(page, 'DEPARTMENT OF HOMELAND SECURITY', margin, ICS207_PDF_TITLE_TOP_Y - 12, 8, font)
  drawLabel(
    page,
    'U.S. COAST GUARD',
    margin + contentWidth / 2 - 48,
    ICS207_PDF_TITLE_TOP_Y - 24,
    9,
    boldFont
  )
  drawLabel(
    page,
    'INCIDENT ORGANIZATION CHART (ICS 207-CG)',
    margin + contentWidth / 2 - 108,
    ICS207_PDF_TITLE_TOP_Y - 38,
    10,
    boldFont
  )

  drawBox(page, margin, ICS207_PDF_HEADER_ROW_BOTTOM_Y, third, ICS207_PDF_HEADER_ROW_HEIGHT_PT)
  drawBox(
    page,
    margin + third,
    ICS207_PDF_HEADER_ROW_BOTTOM_Y,
    third,
    ICS207_PDF_HEADER_ROW_HEIGHT_PT
  )
  drawBox(
    page,
    margin + third * 2,
    ICS207_PDF_HEADER_ROW_BOTTOM_Y,
    third,
    ICS207_PDF_HEADER_ROW_HEIGHT_PT
  )

  drawLabel(
    page,
    '1. Incident Name:',
    margin + 4,
    ICS207_PDF_HEADER_ROW_BOTTOM_Y + 30,
    7,
    font
  )
  drawFieldValue(
    page,
    context.incidentName,
    margin + 4,
    ICS207_PDF_HEADER_ROW_BOTTOM_Y + 14,
    third - 8,
    font
  )

  drawLabel(
    page,
    '2. Incident Location:',
    margin + third + 4,
    ICS207_PDF_HEADER_ROW_BOTTOM_Y + 30,
    7,
    font
  )
  drawFieldValue(
    page,
    context.incidentLocation,
    margin + third + 4,
    ICS207_PDF_HEADER_ROW_BOTTOM_Y + 14,
    third - 8,
    font
  )

  drawLabel(
    page,
    '3. Operational Period (Date/Time):',
    margin + third * 2 + 4,
    ICS207_PDF_HEADER_ROW_BOTTOM_Y + 30,
    7,
    font
  )
  drawLabel(page, 'Date:', margin + third * 2 + 4, ICS207_PDF_HEADER_ROW_BOTTOM_Y + 18, 7, font)
  drawFieldValue(
    page,
    context.operationalPeriodDate,
    margin + third * 2 + 28,
    ICS207_PDF_HEADER_ROW_BOTTOM_Y + 18,
    third / 2 - 32,
    font,
    8
  )
  drawLabel(
    page,
    'Time:',
    margin + third * 2 + third / 2,
    ICS207_PDF_HEADER_ROW_BOTTOM_Y + 18,
    7,
    font
  )
  drawFieldValue(
    page,
    context.operationalPeriodTime,
    margin + third * 2 + third / 2 + 24,
    ICS207_PDF_HEADER_ROW_BOTTOM_Y + 18,
    third / 2 - 28,
    font,
    8
  )
}

function drawChartBoxBorder(
  page: PDFPage,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>
): void {
  drawBox(
    page,
    ICS207_PDF_CHART_BOX.xPt,
    ICS207_PDF_CHART_BOX.yPt,
    ICS207_PDF_CHART_BOX.widthPt,
    ICS207_PDF_CHART_BOX.heightPt
  )
  drawLabel(
    page,
    '4.',
    ICS207_PDF_CHART_BOX.xPt + 4,
    ICS207_PDF_CHART_BOX.yPt + ICS207_PDF_CHART_BOX.heightPt - 12,
    8,
    font
  )
}

function drawPreparedByFooter(
  page: PDFPage,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  context: Ics207ExportContext
): void {
  const margin = ICS207_PDF_PAGE.marginPt
  const contentWidth = ICS207_PDF_CONTENT_WIDTH
  const quarter = contentWidth / 4

  drawBox(page, margin, ICS207_PDF_FOOTER_BOTTOM_Y, contentWidth, ICS207_PDF_PREPARED_BY_HEIGHT_PT)
  for (let i = 1; i < 4; i += 1) {
    const x = margin + quarter * i
    page.drawLine({
      start: { x, y: ICS207_PDF_FOOTER_BOTTOM_Y },
      end: { x, y: ICS207_PDF_FOOTER_BOTTOM_Y + ICS207_PDF_PREPARED_BY_HEIGHT_PT },
      thickness: 1,
      color: rgb(0, 0, 0),
    })
  }

  drawLabel(page, '5. Prepared By:', margin + 4, ICS207_PDF_FOOTER_BOTTOM_Y + 34, 7, font)
  drawLabel(page, 'Name:', margin + 4, ICS207_PDF_FOOTER_BOTTOM_Y + 20, 7, font)
  drawFieldValue(
    page,
    context.preparedByName,
    margin + 36,
    ICS207_PDF_FOOTER_BOTTOM_Y + 20,
    quarter - 40,
    font,
    8
  )
  drawLabel(page, 'Position Title:', margin + quarter + 4, ICS207_PDF_FOOTER_BOTTOM_Y + 20, 7, font)
  drawFieldValue(
    page,
    context.preparedByPositionTitle,
    margin + quarter + 56,
    ICS207_PDF_FOOTER_BOTTOM_Y + 20,
    quarter - 60,
    font,
    8
  )
  drawLabel(
    page,
    'Signature:',
    margin + quarter * 2 + 4,
    ICS207_PDF_FOOTER_BOTTOM_Y + 20,
    7,
    font
  )
  drawLabel(
    page,
    'Date/Time:',
    margin + quarter * 3 + 4,
    ICS207_PDF_FOOTER_BOTTOM_Y + 20,
    7,
    font
  )
  drawFieldValue(
    page,
    context.preparedByDateTime,
    margin + quarter * 3 + 48,
    ICS207_PDF_FOOTER_BOTTOM_Y + 20,
    quarter - 52,
    font,
    8
  )
}

function drawClippedChartImage(
  page: PDFPage,
  pngImage: Awaited<ReturnType<PDFDocument['embedPng']>>
): void {
  const padding = ICS207_PDF_CHART_INNER_PADDING_PT
  const clipX = ICS207_PDF_CHART_BOX.xPt + padding
  const clipY = ICS207_PDF_CHART_BOX.yPt + padding
  const clipWidth = ICS207_PDF_CHART_BOX.widthPt - padding * 2
  const clipHeight = ICS207_PDF_CHART_BOX.heightPt - padding * 2

  const scale = Math.min(clipWidth / pngImage.width, clipHeight / pngImage.height)
  const drawWidth = pngImage.width * scale
  const drawHeight = pngImage.height * scale
  const drawX = clipX + (clipWidth - drawWidth) / 2
  const drawY = clipY + (clipHeight - drawHeight) / 2

  page.pushOperators(
    pushGraphicsState(),
    rectangle(clipX, clipY, clipWidth, clipHeight),
    clip(),
    endPath()
  )
  page.drawImage(pngImage, {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight,
  })
  page.pushOperators(popGraphicsState())
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function buildIcs207PdfBytes(
  chartPng: Uint8Array,
  context: Ics207ExportContext
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([ICS207_PDF_PAGE.widthPt, ICS207_PDF_PAGE.heightPt])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)

  drawTitleAndHeader(page, font, boldFont, context)
  drawChartBoxBorder(page, font)

  const pngImage = await pdf.embedPng(chartPng)
  drawClippedChartImage(page, pngImage)

  drawPreparedByFooter(page, font, context)

  return pdf.save()
}

export async function downloadIcs207Pdf(
  filename: string,
  chartPng: Uint8Array,
  context: Ics207ExportContext
): Promise<void> {
  const bytes = await buildIcs207PdfBytes(chartPng, context)
  triggerBlobDownload(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }), filename)
}

export { buildIcs207PdfBytes as buildIcs207PdfBytesForTest }
