import { ICS204_FORM_TITLE_LINES } from '@/features/ics204/constants'
import type { Ics204ExportLayoutBlock, Ics204PersonnelRow, Ics204SignatureFooter } from '@/features/ics204/export-layout'
import {
  assertIcs204DocxLayoutConsistency,
  buildIcs204DocxDocumentRelsXml,
  buildIcs204DocxFooterXml,
  buildIcs204DocxHeaderXml,
  buildIcs204DocxXml,
  ICS204_PDF_CONTENT_WIDTH,
  ICS204_PDF_PAGE,
  ICS204_PDF_SIGNATURE_FOOTER_HEIGHT_PT,
  ics204PdfSignatureFooterTopY,
} from '@/features/ics204/export-docx-layout'
import {
  assertIcs204PaginationInvariants,
  paginateIcs204Export,
  type Ics204PhysicalPage,
  type Ics204PhysicalPageSegment,
} from '@/features/ics204/export-pagination'

export { buildIcs204DocxXml } from '@/features/ics204/export-docx-layout'
export {
  assertIcs204PaginationInvariants,
  paginateIcs204Export,
} from '@/features/ics204/export-pagination'
export type { Ics204PhysicalPage } from '@/features/ics204/export-pagination'

let crc32Table: Uint32Array | null = null
function computeCrc32(bytes: Uint8Array): number {
  if (!crc32Table) {
    crc32Table = new Uint32Array(256)
    for (let i = 0; i < 256; i += 1) {
      let c = i
      for (let k = 0; k < 8; k += 1) {
        c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      }
      crc32Table[i] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    crc = (crc32Table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 1)) >>> 0
  }
  return (crc ^ 0xffffffff) >>> 0
}

function buildStoredZip(files: Array<{ name: string; content: string }>): Uint8Array {
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const file of files) {
    const nameBytes = encoder.encode(file.name)
    const contentBytes = encoder.encode(file.content)
    const crc = computeCrc32(contentBytes)
    const header = new Uint8Array(30 + nameBytes.length)
    const headerView = new DataView(header.buffer)
    headerView.setUint32(0, 0x04034b50, true)
    headerView.setUint16(4, 20, true)
    headerView.setUint16(6, 0, true)
    headerView.setUint16(8, 0, true)
    headerView.setUint16(10, 0, true)
    headerView.setUint16(12, 0x21, true)
    headerView.setUint32(14, crc, true)
    headerView.setUint32(18, contentBytes.length, true)
    headerView.setUint32(22, contentBytes.length, true)
    headerView.setUint16(26, nameBytes.length, true)
    headerView.setUint16(28, 0, true)
    header.set(nameBytes, 30)
    parts.push(header, contentBytes)

    const cd = new Uint8Array(46 + nameBytes.length)
    const cdView = new DataView(cd.buffer)
    cdView.setUint32(0, 0x02014b50, true)
    cdView.setUint16(4, 20, true)
    cdView.setUint16(6, 20, true)
    cdView.setUint16(8, 0, true)
    cdView.setUint16(10, 0, true)
    cdView.setUint16(12, 0, true)
    cdView.setUint16(14, 0x21, true)
    cdView.setUint32(16, crc, true)
    cdView.setUint32(20, contentBytes.length, true)
    cdView.setUint32(24, contentBytes.length, true)
    cdView.setUint16(28, nameBytes.length, true)
    cdView.setUint16(30, 0, true)
    cdView.setUint16(32, 0, true)
    cdView.setUint16(34, 0, true)
    cdView.setUint16(36, 0, true)
    cdView.setUint32(38, 0, true)
    cdView.setUint32(42, offset, true)
    cd.set(nameBytes, 46)
    central.push(cd)
    offset += header.length + contentBytes.length
  }
  const cdStart = offset
  let cdSize = 0
  for (const cd of central) {
    parts.push(cd)
    cdSize += cd.length
    offset += cd.length
  }
  const eocd = new Uint8Array(22)
  const eocdView = new DataView(eocd.buffer)
  eocdView.setUint32(0, 0x06054b50, true)
  eocdView.setUint16(4, 0, true)
  eocdView.setUint16(6, 0, true)
  eocdView.setUint16(8, files.length, true)
  eocdView.setUint16(10, files.length, true)
  eocdView.setUint32(12, cdSize, true)
  eocdView.setUint32(16, cdStart, true)
  eocdView.setUint16(20, 0, true)
  parts.push(eocd)
  const totalLength = parts.reduce((acc, part) => acc + part.length, 0)
  const result = new Uint8Array(totalLength)
  let position = 0
  for (const part of parts) {
    result.set(part, position)
    position += part.length
  }
  return result
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadIcs204Docx(filename: string, blocks: Ics204ExportLayoutBlock[]): void {
  const pages = paginateIcs204Export(blocks)
  assertIcs204PaginationInvariants(pages)
  const documentXml = buildIcs204DocxXml(pages)
  assertIcs204DocxLayoutConsistency(documentXml)
  const headerCells = pages[0]?.headerCells ?? []
  const footerOverrides = pages
    .map(
      (_, index) =>
        `<Override PartName="/word/footer${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>`
    )
    .join('')
  const files = [
    {
      name: '[Content_Types].xml',
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
        `<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>` +
        footerOverrides +
        `</Types>`,
    },
    {
      name: '_rels/.rels',
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
        `</Relationships>`,
    },
    {
      name: 'word/_rels/document.xml.rels',
      content: buildIcs204DocxDocumentRelsXml(pages.length),
    },
    { name: 'word/document.xml', content: documentXml },
    { name: 'word/header1.xml', content: buildIcs204DocxHeaderXml(headerCells) },
    ...pages.map((page, index) => ({
      name: `word/footer${index + 1}.xml`,
      content: buildIcs204DocxFooterXml(page.signatureFooter, page.footerLeft),
    })),
  ]
  const bytes = buildStoredZip(files)
  triggerBlobDownload(
    new Blob([bytes.buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
    filename
  )
}

function sanitizeForPdf(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\u2026/g, '...')
    .replace(/\u2022/g, '\u0095')
    .replace(/[^\x09\x0A\x20-\xFF]/g, '?')
}

function escapePdfString(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

const PDF_AVG_WIDTH = 0.5
const PDF_BOLD_AVG_WIDTH = 0.53

function estimatePdfTextWidth(text: string, fontSize: number, bold: boolean): number {
  const factor = bold ? PDF_BOLD_AVG_WIDTH : PDF_AVG_WIDTH
  return text.length * fontSize * factor
}

function wrapPdfText(text: string, maxWidth: number, fontSize: number, bold: boolean): string[] {
  const paragraphs = text.split('\n')
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
      if (estimatePdfTextWidth(candidate, fontSize, bold) <= maxWidth) {
        current = candidate
        continue
      }
      if (current) {
        lines.push(current)
        current = ''
      }
      if (estimatePdfTextWidth(word, fontSize, bold) > maxWidth) {
        const cutAt = Math.max(1, Math.floor(maxWidth / (fontSize * (bold ? PDF_BOLD_AVG_WIDTH : PDF_AVG_WIDTH))))
        let remaining = word
        while (estimatePdfTextWidth(remaining, fontSize, bold) > maxWidth) {
          lines.push(remaining.slice(0, cutAt))
          remaining = remaining.slice(cutAt)
        }
        current = remaining
      } else {
        current = word
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

type PdfLine = { text: string; font: 'F1' | 'F2'; size: number; x: number; y: number; bold?: boolean }

type PdfBoxResult = { ops: string; height: number; lines: PdfLine[] }

function allocateProportionalWidths(ratios: readonly number[], totalWidth: number): number[] {
  const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0)
  const widths = ratios.map((ratio) => Math.floor((ratio / ratioSum) * totalWidth))
  const allocated = widths.reduce((sum, width) => sum + width, 0)
  widths[widths.length - 1] += totalWidth - allocated
  return widths
}

function pdfCheckboxMark(checked: boolean): string {
  return checked ? '[X]' : '[ ]'
}

function padPersonnelRows(rows: Ics204PersonnelRow[]): Ics204PersonnelRow[] {
  const padded = [...rows]
  while (padded.length < 3) {
    padded.push({ position: ' ', name: ' ', contact: ' ' })
  }
  return padded.slice(0, 3)
}

function drawBoxExact(
  leftX: number,
  topY: number,
  width: number,
  label: string,
  bodyLines: string[],
  bodySize = 9,
  labelSize = 7,
  minBodyLines = 1
): PdfBoxResult {
  const pad = 6
  const labelLead = 10
  const bodyLead = 11
  const labelLines = wrapPdfText(sanitizeForPdf(label), width - pad * 2, labelSize, true)
  const bodyToRender =
    bodyLines.length > 0 ? bodyLines.map((line) => sanitizeForPdf(line)) : [' ']
  const renderedBodyLines = Math.max(bodyToRender.length, minBodyLines)
  const height = pad + labelLines.length * labelLead + 4 + renderedBodyLines * bodyLead + pad
  const bottomY = topY - height
  let ops = '0.75 w\n'
  ops += `${leftX.toFixed(2)} ${bottomY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S\n`

  const pdfLines: PdfLine[] = []
  let y = topY - pad - labelSize
  for (const line of labelLines) {
    pdfLines.push({ text: line, font: 'F2', size: labelSize, x: leftX + pad, y, bold: true })
    y -= labelLead
  }
  y -= 4
  for (let i = 0; i < renderedBodyLines; i += 1) {
    const line = bodyToRender[i] ?? ' '
    pdfLines.push({ text: line, font: 'F1', size: bodySize, x: leftX + pad, y: y - bodySize })
    y -= bodyLead
  }
  return { ops, height, lines: pdfLines }
}

function drawPdfTable(
  leftX: number,
  topY: number,
  tableWidth: number,
  columnWidths: number[],
  headerLabels: string[] | null,
  rows: string[][],
  opts: { rowHeight?: number; headerHeight?: number; fontSize?: number; headerFontSize?: number; centerLastCol?: boolean } = {}
): { ops: string; lines: PdfLine[]; height: number } {
  const rowHeight = opts.rowHeight ?? 14
  const headerHeight = opts.headerHeight ?? 14
  const fontSize = opts.fontSize ?? 7.5
  const headerFontSize = opts.headerFontSize ?? 7
  const headerRows = headerLabels ? 1 : 0
  const dataRows = Math.max(rows.length, 1)
  const height = headerRows * headerHeight + dataRows * rowHeight
  const bottomY = topY - height
  let ops = '0.75 w\n'
  ops += `${leftX.toFixed(2)} ${bottomY.toFixed(2)} ${tableWidth.toFixed(2)} ${height.toFixed(2)} re S\n`

  let xOffset = leftX
  for (let col = 1; col < columnWidths.length; col += 1) {
    xOffset += columnWidths[col - 1]
    ops += `${xOffset.toFixed(2)} ${bottomY.toFixed(2)} m ${xOffset.toFixed(2)} ${topY.toFixed(2)} l S\n`
  }

  if (headerLabels) {
    const headerBottom = topY - headerHeight
    ops += `${leftX.toFixed(2)} ${headerBottom.toFixed(2)} m ${(leftX + tableWidth).toFixed(2)} ${headerBottom.toFixed(2)} l S\n`
  }

  const lines: PdfLine[] = []
  let rowTop = topY

  if (headerLabels) {
    let colX = leftX + 3
    headerLabels.forEach((label, index) => {
      const cellWidth = columnWidths[index] - 6
      wrapPdfText(sanitizeForPdf(label), cellWidth, headerFontSize, true)
        .slice(0, 1)
        .forEach((line) => {
          lines.push({
            text: line,
            font: 'F2',
            size: headerFontSize,
            x: colX,
            y: rowTop - 9,
            bold: true,
          })
        })
      colX += columnWidths[index]
    })
    rowTop -= headerHeight
  }

  const renderedRows = rows.length > 0 ? rows : [columnWidths.map((_, index) => (index === columnWidths.length - 1 && opts.centerLastCol ? '[ ]' : ' '))]
  renderedRows.forEach((row) => {
    let colX = leftX + 3
    row.forEach((value, index) => {
      const cellWidth = columnWidths[index] - 6
      const center = opts.centerLastCol && index === columnWidths.length - 1
      const textLines = wrapPdfText(sanitizeForPdf(value || ' '), cellWidth, fontSize, false).slice(0, 2)
      textLines.forEach((line, lineIndex) => {
        const textWidth = estimatePdfTextWidth(line, fontSize, false)
        const x = center ? colX + Math.max(0, (cellWidth - textWidth) / 2) : colX
        lines.push({
          text: line,
          font: 'F1',
          size: fontSize,
          x,
          y: rowTop - 10 - lineIndex * 9,
        })
      })
      colX += columnWidths[index]
    })
    rowTop -= rowHeight
  })

  return { ops, lines, height }
}

function drawPdfSectionWithInner(
  leftX: number,
  topY: number,
  width: number,
  label: string,
  inner: { ops: string; lines: PdfLine[]; height: number },
  innerPad = 6
): PdfBoxResult {
  const pad = 6
  const labelLead = 10
  const labelSize = 7
  const labelLines = wrapPdfText(sanitizeForPdf(label), width - pad * 2, labelSize, true)
  const labelBlockHeight = labelLines.length * labelLead + 4
  const height = pad + labelBlockHeight + innerPad + inner.height + pad
  const bottomY = topY - height
  let ops = '0.75 w\n'
  ops += `${leftX.toFixed(2)} ${bottomY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S\n`
  ops += inner.ops

  const pdfLines: PdfLine[] = []
  let y = topY - pad - labelSize
  for (const line of labelLines) {
    pdfLines.push({ text: line, font: 'F2', size: labelSize, x: leftX + pad, y, bold: true })
    y -= labelLead
  }

  const innerTopY = y - innerPad
  const innerOffsetY = innerTopY - topY
  for (const line of inner.lines) {
    pdfLines.push({ ...line, y: line.y + innerOffsetY })
  }

  return { ops, height, lines: pdfLines }
}

function renderPdfPageHeader(
  page: Ics204PhysicalPage,
  margin: number,
  contentWidth: number,
  startY: number
): { ops: string; lines: PdfLine[]; nextY: number } {
  const gap = 6
  let y = startY
  let ops = ''
  const lines: PdfLine[] = []

  for (let i = 0; i < ICS204_FORM_TITLE_LINES.length; i += 1) {
    const line = ICS204_FORM_TITLE_LINES[i]
    const size = i === ICS204_FORM_TITLE_LINES.length - 1 ? 11 : 8
    const bold = i === ICS204_FORM_TITLE_LINES.length - 1
    const textWidth = estimatePdfTextWidth(sanitizeForPdf(line), size, bold)
    const x = margin + Math.max(0, (contentWidth - textWidth) / 2)
    y -= size + 4
    lines.push({ text: sanitizeForPdf(line), font: bold ? 'F2' : 'F1', size, x, y, bold })
  }
  y -= gap

  const cellW = contentWidth / page.headerCells.length
  const cellHeights = page.headerCells.map((cell) => {
    const labelH = 12
    const valueLines = wrapPdfText(sanitizeForPdf(cell.value || ' '), cellW - 8, 8.5, false)
    return labelH + (cell.subLabels?.length ?? 0) * 9 + valueLines.length * 10 + 10
  })
  const height = Math.max(...cellHeights, 36)
  const bottomY = y - height
  ops += '0.75 w\n'
  ops += `${margin.toFixed(2)} ${bottomY.toFixed(2)} ${contentWidth.toFixed(2)} ${height.toFixed(2)} re S\n`
  for (let i = 1; i < page.headerCells.length; i += 1) {
    const x = margin + cellW * i
    ops += `${x.toFixed(2)} ${bottomY.toFixed(2)} m ${x.toFixed(2)} ${y.toFixed(2)} l S\n`
  }
  page.headerCells.forEach((cell, index) => {
    const x = margin + cellW * index + 4
    let cy = y - 8
    lines.push({
      text: sanitizeForPdf(cell.label),
      font: 'F2',
      size: 7,
      x,
      y: cy,
      bold: true,
    })
    cy -= 10
    cell.subLabels?.forEach((sub) => {
      lines.push({ text: sanitizeForPdf(sub), font: 'F1', size: 6.5, x, y: cy })
      cy -= 9
    })
    wrapPdfText(sanitizeForPdf(cell.value || ' '), cellW - 8, 8.5, false).forEach((line) => {
      lines.push({ text: line, font: 'F1', size: 8.5, x, y: cy })
      cy -= 10
    })
  })
  y = bottomY - gap
  return { ops, lines, nextY: y }
}

function renderPdfPersonnelTable(
  segment: Extract<Ics204PhysicalPageSegment, { kind: 'personnel-table' }>,
  margin: number,
  contentWidth: number,
  startY: number
): { ops: string; lines: PdfLine[]; nextY: number } {
  const gap = 6
  const innerWidth = contentWidth - 12
  const colW = innerWidth / 3
  const columnWidths = [colW, colW, colW]
  const rows = padPersonnelRows(segment.rows).map((row) => [
    row.position || ' ',
    row.name || ' ',
    row.contact || ' ',
  ])
  const inner = drawPdfTable(
    margin + 6,
    startY - 24,
    innerWidth,
    columnWidths,
    ['Position', 'Name', 'Contact Information'],
    rows
  )
  const box = drawPdfSectionWithInner(margin, startY, contentWidth, segment.label, inner)
  return { ops: box.ops, lines: box.lines, nextY: startY - box.height - gap }
}

function renderPdfResourcesTable(
  segment: Extract<Ics204PhysicalPageSegment, { kind: 'resources-table' }>,
  margin: number,
  contentWidth: number,
  startY: number
): { ops: string; lines: PdfLine[]; nextY: number } {
  const gap = 6
  const innerWidth = contentWidth - 12
  const columnWidths = allocateProportionalWidths(
    [20, 14, 8, 18, 32, 8],
    innerWidth
  )
  const headerLabels = segment.showTableHeader
    ? [
        'Resource Identifier',
        'Leader',
        '# of Persons',
        'Contact Information',
        'Reporting Info / Notes',
        '204A',
      ]
    : null
  const rows =
    segment.rows.length === 0
      ? [[' ', ' ', ' ', ' ', ' ', pdfCheckboxMark(false)]]
      : segment.rows.map((row) => [
          row.resourceIdentifier || ' ',
          row.leader || ' ',
          row.personCount || ' ',
          row.contactInformation || ' ',
          row.reportingInfoNotes || ' ',
          pdfCheckboxMark(row.has204A),
        ])
  const inner = drawPdfTable(
    margin + 6,
    startY - 24,
    innerWidth,
    columnWidths,
    headerLabels,
    rows,
    { centerLastCol: true, fontSize: 6.5, headerFontSize: 6 }
  )
  const box = drawPdfSectionWithInner(margin, startY, contentWidth, segment.label, inner)
  return { ops: box.ops, lines: box.lines, nextY: startY - box.height - gap }
}

function renderPdfCommunications(
  segment: Extract<Ics204PhysicalPageSegment, { kind: 'communications' }>,
  margin: number,
  contentWidth: number,
  startY: number
): { ops: string; lines: PdfLine[]; nextY: number } {
  const gap = 6
  const pad = 6
  const labelSize = 7
  const labelLead = 10
  const labelLines = wrapPdfText(sanitizeForPdf(segment.label), contentWidth - pad * 2, labelSize, true)
  const labelBlockHeight = labelLines.length * labelLead + 4

  let innerHeight = 0
  let innerOps = ''
  const innerLines: PdfLine[] = []
  let innerTopY = startY - pad - labelBlockHeight - 6

  if (segment.rows.length > 0) {
    const innerWidth = contentWidth - 12
    const half = innerWidth / 2
    const columnWidths = [half, half]
    const headerLabels = segment.showTableHeader ? ['Name/Function', 'Contact Information'] : null
    const rows = segment.rows.map((row) => [
      row.nameFunction || ' ',
      row.contactInformation || ' ',
    ])
    const table = drawPdfTable(
      margin + 6,
      innerTopY,
      innerWidth,
      columnWidths,
      headerLabels,
      rows
    )
    innerOps += table.ops
    innerLines.push(...table.lines)
    innerHeight += table.height + 6
    innerTopY -= table.height + 6
  }

  if (segment.showEmergency && segment.emergencyLines.length > 0) {
    const emergencyLabel = segment.continued
      ? 'Emergency Communications (Continued):'
      : 'Emergency Communications:'
    const emergencyLabelLines = wrapPdfText(
      sanitizeForPdf(emergencyLabel),
      contentWidth - pad * 2,
      labelSize,
      true
    )
    let y = innerTopY - labelSize
    emergencyLabelLines.forEach((line) => {
      innerLines.push({
        text: line,
        font: 'F2',
        size: labelSize,
        x: margin + pad,
        y,
        bold: true,
      })
      y -= labelLead
    })
    innerHeight += emergencyLabelLines.length * labelLead + 4
    innerTopY = y - 4

    segment.emergencyLines.forEach((line, index) => {
      innerLines.push({
        text: sanitizeForPdf(line),
        font: 'F1',
        size: 9,
        x: margin + pad,
        y: innerTopY - 9 - index * 11,
      })
    })
    innerHeight += segment.emergencyLines.length * 11 + 4
  }

  if (innerHeight === 0) {
    innerHeight = 12
  }

  const height = pad + labelBlockHeight + 6 + innerHeight + pad
  const bottomY = startY - height
  let ops = '0.75 w\n'
  ops += `${margin.toFixed(2)} ${bottomY.toFixed(2)} ${contentWidth.toFixed(2)} ${height.toFixed(2)} re S\n`
  ops += innerOps

  const lines: PdfLine[] = []
  let y = startY - pad - labelSize
  for (const line of labelLines) {
    lines.push({ text: line, font: 'F2', size: labelSize, x: margin + pad, y, bold: true })
    y -= labelLead
  }

  const innerOffsetY = startY - pad - labelBlockHeight - 6 - startY
  for (const line of innerLines) {
    lines.push({ ...line, y: line.y + innerOffsetY })
  }

  return { ops, lines, nextY: startY - height - gap }
}

function renderPdfPageSegment(
  segment: Ics204PhysicalPageSegment,
  margin: number,
  contentWidth: number,
  startY: number
): { ops: string; lines: PdfLine[]; nextY: number } {
  const gap = 6
  let y = startY

  switch (segment.kind) {
    case 'personnel-table':
      return renderPdfPersonnelTable(segment, margin, contentWidth, startY)
    case 'resources-table':
      return renderPdfResourcesTable(segment, margin, contentWidth, startY)
    case 'text-box': {
      const box = drawBoxExact(margin, y, contentWidth, segment.label, segment.bodyLines, 9, 7, 1)
      y -= box.height + gap
      return { ops: box.ops, lines: box.lines, nextY: y }
    }
    case 'communications':
      return renderPdfCommunications(segment, margin, contentWidth, startY)
    default:
      return { ops: '', lines: [], nextY: y }
  }
}

function renderPdfSignatureBoxCell(
  box: Ics204SignatureFooter['preparedBy'],
  leftX: number,
  cellW: number,
  topY: number
): PdfLine[] {
  const lines: PdfLine[] = [
    {
      text: sanitizeForPdf(box.label),
      font: 'F2',
      size: 7,
      x: leftX + 4,
      y: topY - 8,
      bold: true,
    },
    {
      text: sanitizeForPdf('Name:'),
      font: 'F2',
      size: 6.5,
      x: leftX + 4,
      y: topY - 20,
      bold: true,
    },
  ]
  wrapPdfText(sanitizeForPdf(box.name || ' '), cellW - 8, 7.5, false)
    .slice(0, 2)
    .forEach((line, index) => {
      lines.push({ text: line, font: 'F1', size: 7.5, x: leftX + 4, y: topY - 30 - index * 9 })
    })
  lines.push({
    text: sanitizeForPdf('Date/Time:'),
    font: 'F2',
    size: 6.5,
    x: leftX + 4,
    y: topY - 48,
    bold: true,
  })
  wrapPdfText(sanitizeForPdf(box.dateTime || ' '), cellW - 8, 7.5, false)
    .slice(0, 2)
    .forEach((line, index) => {
      lines.push({ text: line, font: 'F1', size: 7.5, x: leftX + 4, y: topY - 58 - index * 9 })
    })
  return lines
}

function renderPdfPageSignatureFooter(
  signatureFooter: Ics204SignatureFooter,
  margin: number,
  contentWidth: number,
  topY: number
): { ops: string; lines: PdfLine[] } {
  const cellW = contentWidth / 3
  const height = ICS204_PDF_SIGNATURE_FOOTER_HEIGHT_PT
  const y = topY
  const bottomY = y - height
  let ops = '0.75 w\n'
  ops += `${margin.toFixed(2)} ${bottomY.toFixed(2)} ${contentWidth.toFixed(2)} ${height.toFixed(2)} re S\n`
  for (let i = 1; i < 3; i += 1) {
    const x = margin + cellW * i
    ops += `${x.toFixed(2)} ${bottomY.toFixed(2)} m ${x.toFixed(2)} ${y.toFixed(2)} l S\n`
  }

  const lines: PdfLine[] = [
    ...renderPdfSignatureBoxCell(signatureFooter.preparedBy, margin, cellW, y),
    ...renderPdfSignatureBoxCell(signatureFooter.reviewedPsc, margin + cellW, cellW, y),
    ...renderPdfSignatureBoxCell(signatureFooter.reviewedOsc, margin + cellW * 2, cellW, y),
  ]
  return { ops, lines }
}

function renderPdfPageFooter(
  page: Ics204PhysicalPage,
  margin: number,
  contentWidth: number
): { ops: string; lines: PdfLine[] } {
  const pageLabel = `Page ${page.displayPageNumber} of ${page.totalPages}`
  const y = margin + 14
  return {
    ops: '',
    lines: [
      {
        text: sanitizeForPdf(page.footerLeft),
        font: 'F1',
        size: 7,
        x: margin,
        y,
      },
      {
        text: sanitizeForPdf(pageLabel),
        font: 'F1',
        size: 7,
        x: margin + contentWidth - estimatePdfTextWidth(pageLabel, 7, false),
        y,
      },
    ],
  }
}

function buildIcs204PdfBytes(pages: Ics204PhysicalPage[]): Uint8Array {
  const pageWidth = ICS204_PDF_PAGE.widthPt
  const pageHeight = ICS204_PDF_PAGE.heightPt
  const margin = ICS204_PDF_PAGE.marginPt
  const contentWidth = ICS204_PDF_CONTENT_WIDTH
  const contentTop = pageHeight - margin
  const signatureFooterTopY = ics204PdfSignatureFooterTopY()

  const pdfPages: Array<{ ops: string; lines: PdfLine[] }> = pages.map((page) => {
    let ops = ''
    const lines: PdfLine[] = []
    const header = renderPdfPageHeader(page, margin, contentWidth, contentTop)
    ops += header.ops
    lines.push(...header.lines)
    let y = header.nextY
    for (const segment of page.segments) {
      const rendered = renderPdfPageSegment(segment, margin, contentWidth, y)
      ops += rendered.ops
      lines.push(...rendered.lines)
      y = rendered.nextY
    }
    const signatureFooter = renderPdfPageSignatureFooter(
      page.signatureFooter,
      margin,
      contentWidth,
      signatureFooterTopY
    )
    ops += signatureFooter.ops
    lines.push(...signatureFooter.lines)
    const footer = renderPdfPageFooter(page, margin, contentWidth)
    ops += footer.ops
    lines.push(...footer.lines)
    return { ops, lines }
  })

  if (pdfPages.length === 0) pdfPages.push({ ops: '', lines: [] })

  const stringToLatin1Bytes = (text: string): Uint8Array => {
    const bytes = new Uint8Array(text.length)
    for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff
    return bytes
  }

  const contentStreams = pdfPages.map((page) => {
    let body = page.ops
    body += 'BT\n'
    let currentFont: string | null = null
    let currentSize = 0
    let prevX = 0
    let prevY = 0
    let placedFirst = false
    for (const line of page.lines) {
      if (currentFont !== line.font || currentSize !== line.size) {
        body += `/${line.font} ${line.size} Tf\n`
        currentFont = line.font
        currentSize = line.size
      }
      const targetX = line.x
      const targetY = line.y
      if (!placedFirst) {
        body += `${targetX.toFixed(2)} ${targetY.toFixed(2)} Td\n`
        placedFirst = true
      } else {
        body += `${(targetX - prevX).toFixed(2)} ${(targetY - prevY).toFixed(2)} Td\n`
      }
      body += `(${escapePdfString(line.text)}) Tj\n`
      prevX = targetX
      prevY = targetY
    }
    body += 'ET\n'
    return body
  })

  const objects: Array<string | Uint8Array> = []
  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push('__pages_placeholder__')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  const pageObjectNumbers: number[] = []
  for (const stream of contentStreams) {
    const pageObjNumber = objects.length + 1
    const contentsObjNumber = pageObjNumber + 1
    pageObjectNumbers.push(pageObjNumber)
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentsObjNumber} 0 R >>`
    )
    const streamBytes = stringToLatin1Bytes(stream)
    objects.push(
      new Uint8Array([
        ...stringToLatin1Bytes(`<< /Length ${streamBytes.length} >>\nstream\n`),
        ...streamBytes,
        ...stringToLatin1Bytes('\nendstream'),
      ])
    )
  }
  objects[1] = `<< /Type /Pages /Count ${pageObjectNumbers.length} /Kids [${pageObjectNumbers.map((n) => `${n} 0 R`).join(' ')}] >>`

  const headerBytes = stringToLatin1Bytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  const chunks: Uint8Array[] = [headerBytes]
  const offsets: number[] = []
  let totalOffset = headerBytes.length
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(totalOffset)
    const objHeader = stringToLatin1Bytes(`${index + 1} 0 obj\n`)
    chunks.push(objHeader)
    totalOffset += objHeader.length
    const content = objects[index]
    const contentBytes = typeof content === 'string' ? stringToLatin1Bytes(content) : content
    chunks.push(contentBytes)
    totalOffset += contentBytes.length
    const objFooter = stringToLatin1Bytes('\nendobj\n')
    chunks.push(objFooter)
    totalOffset += objFooter.length
  }
  const xrefStart = totalOffset
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  chunks.push(stringToLatin1Bytes(xref))
  chunks.push(
    stringToLatin1Bytes(
      `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
    )
  )
  const totalLength = chunks.reduce((acc, part) => acc + part.length, 0)
  const result = new Uint8Array(totalLength)
  let position = 0
  for (const part of chunks) {
    result.set(part, position)
    position += part.length
  }
  return result
}

export function downloadIcs204Pdf(filename: string, blocks: Ics204ExportLayoutBlock[]): void {
  const pages = paginateIcs204Export(blocks, { target: 'pdf' })
  assertIcs204PaginationInvariants(pages)
  const bytes = buildIcs204PdfBytes(pages)
  triggerBlobDownload(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), filename)
}
