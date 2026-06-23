import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib'
import {
  ICS207_PDF_CHART_BOX,
  ICS207_PDF_CONTENT_WIDTH,
  ICS207_PDF_HEADER_ROW_HEIGHT_PT,
  ICS207_PDF_HEADER_ROW_TOP_Y,
  ICS207_PDF_PAGE,
  ICS207_PDF_PREPARED_BY_HEIGHT_PT,
  ICS207_PDF_PREPARED_BY_TOP_Y,
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

function drawFormShell(
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

  const headerRowBottom = ICS207_PDF_HEADER_ROW_TOP_Y - ICS207_PDF_HEADER_ROW_HEIGHT_PT
  drawBox(page, margin, headerRowBottom, third, ICS207_PDF_HEADER_ROW_HEIGHT_PT)
  drawBox(page, margin + third, headerRowBottom, third, ICS207_PDF_HEADER_ROW_HEIGHT_PT)
  drawBox(
    page,
    margin + third * 2,
    headerRowBottom,
    third,
    ICS207_PDF_HEADER_ROW_HEIGHT_PT
  )

  drawLabel(page, '1. Incident Name:', margin + 4, headerRowBottom + 30, 7, font)
  drawFieldValue(page, context.incidentName, margin + 4, headerRowBottom + 14, third - 8, font)

  drawLabel(page, '2. Incident Location:', margin + third + 4, headerRowBottom + 30, 7, font)
  drawFieldValue(
    page,
    context.incidentLocation,
    margin + third + 4,
    headerRowBottom + 14,
    third - 8,
    font
  )

  drawLabel(
    page,
    '3. Operational Period (Date/Time):',
    margin + third * 2 + 4,
    headerRowBottom + 30,
    7,
    font
  )
  drawLabel(page, 'Date:', margin + third * 2 + 4, headerRowBottom + 18, 7, font)
  drawFieldValue(
    page,
    context.operationalPeriodDate,
    margin + third * 2 + 28,
    headerRowBottom + 18,
    third / 2 - 32,
    font,
    8
  )
  drawLabel(page, 'Time:', margin + third * 2 + third / 2, headerRowBottom + 18, 7, font)
  drawFieldValue(
    page,
    context.operationalPeriodTime,
    margin + third * 2 + third / 2 + 24,
    headerRowBottom + 18,
    third / 2 - 28,
    font,
    8
  )

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

  const preparedBottom = ICS207_PDF_PREPARED_BY_TOP_Y - ICS207_PDF_PREPARED_BY_HEIGHT_PT
  const quarter = contentWidth / 4
  drawBox(page, margin, preparedBottom, contentWidth, ICS207_PDF_PREPARED_BY_HEIGHT_PT)
  drawLabel(page, '5. Prepared By:', margin + 4, preparedBottom + 36, 7, font)
  drawLabel(page, 'Name:', margin + 4, preparedBottom + 22, 7, font)
  drawFieldValue(page, context.preparedByName, margin + 36, preparedBottom + 22, quarter - 40, font, 8)
  drawLabel(page, 'Position Title:', margin + quarter + 4, preparedBottom + 22, 7, font)
  drawFieldValue(
    page,
    context.preparedByPositionTitle,
    margin + quarter + 56,
    preparedBottom + 22,
    quarter - 60,
    font,
    8
  )
  drawLabel(page, 'Signature:', margin + quarter * 2 + 4, preparedBottom + 22, 7, font)
  drawLabel(page, 'Date/Time:', margin + quarter * 3 + 4, preparedBottom + 22, 7, font)
  drawFieldValue(
    page,
    context.preparedByDateTime,
    margin + quarter * 3 + 48,
    preparedBottom + 22,
    quarter - 52,
    font,
    8
  )
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function buildIcs207PdfBytes(
  chartPng: Uint8Array,
  context: Ics207ExportContext
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([ICS207_PDF_PAGE.widthPt, ICS207_PDF_PAGE.heightPt])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)

  drawFormShell(page, font, boldFont, context)

  const pngImage = await pdf.embedPng(chartPng)
  const padding = 8
  const boxInnerWidth = ICS207_PDF_CHART_BOX.widthPt - padding * 2
  const boxInnerHeight = ICS207_PDF_CHART_BOX.heightPt - padding * 2
  const scale = Math.min(
    boxInnerWidth / pngImage.width,
    boxInnerHeight / pngImage.height
  )
  const drawWidth = pngImage.width * scale
  const drawHeight = pngImage.height * scale
  const drawX =
    ICS207_PDF_CHART_BOX.xPt + padding + (boxInnerWidth - drawWidth) / 2
  const drawY =
    ICS207_PDF_CHART_BOX.yPt + padding + (boxInnerHeight - drawHeight) / 2

  page.drawImage(pngImage, {
    x: drawX,
    y: drawY,
    width: drawWidth,
    height: drawHeight,
  })

  return pdf.save()
}

export async function downloadIcs207Pdf(
  filename: string,
  chartPng: Uint8Array,
  context: Ics207ExportContext
): Promise<void> {
  const bytes = await buildIcs207PdfBytes(chartPng, context)
  triggerBlobDownload(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), filename)
}

export { buildIcs207PdfBytes as buildIcs207PdfBytesForTest }
