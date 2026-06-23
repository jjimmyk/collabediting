import { ICS215_FORM_TITLE_LINES } from '@/features/ics215/constants'
import type { Ics215ExportLayoutBlock, Ics215PreparedByFooter } from '@/features/ics215/export-layout'
import {
  assertIcs215DocxLayoutConsistency,
  buildIcs215DocxDocumentRelsXml,
  buildIcs215DocxFooterXml,
  buildIcs215DocxHeaderXml,
  buildIcs215DocxXml,
  ICS215_PDF_CONTENT_WIDTH,
  ICS215_PDF_PAGE,
  ICS215_PDF_ICS_LINE_Y_PT,
} from '@/features/ics215/export-docx-layout'
import {
  assertIcs215PaginationInvariants,
  paginateIcs215Export,
  type Ics215PhysicalPage,
  type Ics215WorkAssignmentsTableSegment,
} from '@/features/ics215/export-pagination'
import {
  ICS215_LEGACY_KINDS_HEADER_LABEL,
  ICS215_LEGACY_RHN_FIELDS,
  ICS215_LEGACY_RHN_LABELS,
  ICS215_LEGACY_TOTAL_ROWS,
  buildIcs215LegacyTableColumnWidths,
  estimateLegacyVerticalHeaderHeight,
  ics215LegacyKindsCol,
  ics215LegacyOverflowStartCol,
  ics215LegacyResourceStartCol,
  estimateLegacyAssignmentBlockHeightPt,
  legacyResourceCellValue,
  scaleLegacyColumnWidthsToPt,
} from '@/features/ics215/export-legacy-table'
import {
  buildIcs215HeaderInfoColumnWidths,
  ICS215_PREPARED_BY_FOOTER_HEIGHT_PT,
  legacyResourceZoneLeftX,
  legacyResourceZoneRightX,
  type Ics215LegacyBorderAfter,
} from '@/features/ics215/export-legacy-geometry'
import { ICS215_BOX_STACK } from '@/features/ics215/export-box-stack'
import type { Ics215ResourceColumn } from '@/features/ics215/types'

export { buildIcs215DocxXml } from '@/features/ics215/export-docx-layout'
export {
  assertIcs215PaginationInvariants,
  paginateIcs215Export,
} from '@/features/ics215/export-pagination'
export type { Ics215PhysicalPage } from '@/features/ics215/export-pagination'

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

export function downloadIcs215Docx(filename: string, blocks: Ics215ExportLayoutBlock[]): void {
  const pages = paginateIcs215Export(blocks)
  assertIcs215PaginationInvariants(pages)
  const documentXml = buildIcs215DocxXml(pages)
  assertIcs215DocxLayoutConsistency(documentXml)
  const headerCells = pages[0]?.headerCells ?? []
  const operationalPeriod = pages[0]?.operationalPeriod ?? ''
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
      content: buildIcs215DocxDocumentRelsXml(pages.length),
    },
    { name: 'word/document.xml', content: documentXml },
    {
      name: 'word/header1.xml',
      content: buildIcs215DocxHeaderXml(headerCells, operationalPeriod),
    },
    ...pages.map((page, index) => ({
      name: `word/footer${index + 1}.xml`,
      content: buildIcs215DocxFooterXml(page.preparedByFooter, page.footerLeft),
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

function scaleColumnWidthsToPdf(docxWidths: number[], pdfTableWidth: number): number[] {
  const docxTotal = docxWidths.reduce((sum, width) => sum + width, 0)
  const widths = docxWidths.map((width) => Math.floor((width / docxTotal) * pdfTableWidth))
  widths[widths.length - 1] += pdfTableWidth - widths.reduce((sum, width) => sum + width, 0)
  return widths
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

type PdfTableCell = {
  col: number
  colSpan?: number
  rowSpan?: number
  text: string
  bold?: boolean
  center?: boolean
  right?: boolean
  vertical?: boolean
  fontSize?: number
  vAlign?: 'top' | 'middle'
  maxLines?: number
}

type PdfTableRow = {
  height: number
  cells: PdfTableCell[]
  borderAfter?: Ics215LegacyBorderAfter
  /** Omit internal vertical rules between overflow cols 8–11 (box 15). */
  suppressOverflowVerticalLines?: boolean
}

type DrawPdfTableOptions = {
  drawTop?: boolean
  resourceCount?: number
}

function pdfRotatedTextOps(
  text: string,
  centerX: number,
  centerY: number,
  fontSize: number,
  bold: boolean
): string {
  const sanitized = sanitizeForPdf(text.trim() || ' ')
  const font = bold ? '/F2' : '/F1'
  const textWidth = estimatePdfTextWidth(sanitized, fontSize, bold)
  return (
    'q\n' +
    `1 0 0 1 ${centerX.toFixed(2)} ${centerY.toFixed(2)} cm\n` +
    `0 1 -1 0 0 0 cm\n` +
    `BT\n${font} ${fontSize} Tf\n` +
    `${(-textWidth / 2).toFixed(2)} ${(-fontSize * 0.35).toFixed(2)} Td\n` +
    `(${escapePdfString(sanitized)}) Tj\nET\n` +
    'Q\n'
  )
}

function pdfCellTextLines(
  cell: PdfTableCell,
  cellWidth: number,
  fontSize: number,
  bold: boolean
): string[] {
  const pad = 3
  const maxLines = cell.maxLines ?? (cell.vAlign === 'top' ? 6 : 3)
  return wrapPdfText(sanitizeForPdf(cell.text || ' '), cellWidth - pad * 2, fontSize, bold).slice(
    0,
    maxLines
  )
}

function pdfPlaceCellTextLines(
  textLines: string[],
  rowTop: number,
  rowHeight: number,
  cellX: number,
  cellWidth: number,
  fontSize: number,
  bold: boolean,
  center: boolean,
  right: boolean,
  vAlign: 'top' | 'middle'
): PdfLine[] {
  const pad = 3
  const lineHeight = fontSize + 2
  const blockHeight = textLines.length * lineHeight
  const topY =
    vAlign === 'middle'
      ? rowTop - (rowHeight - blockHeight) / 2 - fontSize
      : rowTop - pad - fontSize
  return textLines.map((line, lineIndex) => {
    const textWidth = estimatePdfTextWidth(line, fontSize, bold)
    let x = center
      ? cellX + pad + Math.max(0, (cellWidth - pad * 2 - textWidth) / 2)
      : right
        ? cellX + cellWidth - pad - textWidth
        : cellX + pad
    const maxX = cellX + cellWidth - pad
    if (x + textWidth > maxX) {
      x = Math.max(cellX + pad, maxX - textWidth)
    }
    return {
      text: line,
      font: bold ? 'F2' : 'F1',
      size: fontSize,
      x,
      y: topY - lineIndex * lineHeight,
      bold,
    }
  })
}

function rowSpanBlockHeight(rows: PdfTableRow[], rowIndex: number, rowSpan: number): number {
  let height = 0
  for (let i = 0; i < rowSpan && rowIndex + i < rows.length; i += 1) {
    height += rows[rowIndex + i].height
  }
  return height
}

function drawPdfTableWithSpans(
  leftX: number,
  topY: number,
  tableWidth: number,
  columnWidths: number[],
  rows: PdfTableRow[],
  options: DrawPdfTableOptions = {}
): { ops: string; lines: PdfLine[]; height: number } {
  const drawTop = options.drawTop ?? true
  const resourceCount = options.resourceCount ?? 0
  const totalHeight = rows.reduce((sum, row) => sum + row.height, 0)
  const bottomY = topY - totalHeight
  let ops = '0.75 w\n'
  if (drawTop) {
    ops += `${leftX.toFixed(2)} ${topY.toFixed(2)} m ${(leftX + tableWidth).toFixed(2)} ${topY.toFixed(2)} l S\n`
  }
  ops += `${leftX.toFixed(2)} ${bottomY.toFixed(2)} m ${(leftX + tableWidth).toFixed(2)} ${bottomY.toFixed(2)} l S\n`
  ops += `${leftX.toFixed(2)} ${bottomY.toFixed(2)} m ${leftX.toFixed(2)} ${topY.toFixed(2)} l S\n`
  ops += `${(leftX + tableWidth).toFixed(2)} ${bottomY.toFixed(2)} m ${(leftX + tableWidth).toFixed(2)} ${topY.toFixed(2)} l S\n`

  const overflowStart =
    resourceCount > 0 ? ics215LegacyOverflowStartCol(resourceCount) : columnWidths.length

  let xOffset = leftX
  for (let col = 1; col < columnWidths.length; col += 1) {
    xOffset += columnWidths[col - 1]
    const isInternalOverflowDivider =
      col > overflowStart && col < overflowStart + 4
    let segmentTop = topY
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex]
      const segmentBottom = segmentTop - row.height
      const suppress = row.suppressOverflowVerticalLines && isInternalOverflowDivider
      if (!suppress) {
        ops += `${xOffset.toFixed(2)} ${segmentBottom.toFixed(2)} m ${xOffset.toFixed(2)} ${segmentTop.toFixed(2)} l S\n`
      }
      segmentTop = segmentBottom
    }
  }

  const zoneLeft = legacyResourceZoneLeftX(columnWidths, leftX)
  const zoneRight = legacyResourceZoneRightX(columnWidths, leftX, resourceCount)

  let rowTop = topY
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    rowTop -= row.height
    if (rowIndex === rows.length - 1) break
    const borderAfter = row.borderAfter ?? 'none'
    if (borderAfter === 'full') {
      ops += `${leftX.toFixed(2)} ${rowTop.toFixed(2)} m ${(leftX + tableWidth).toFixed(2)} ${rowTop.toFixed(2)} l S\n`
    } else if (borderAfter === 'resource-zone' && resourceCount >= 0) {
      ops += `${zoneLeft.toFixed(2)} ${rowTop.toFixed(2)} m ${zoneRight.toFixed(2)} ${rowTop.toFixed(2)} l S\n`
    }
  }

  const lines: PdfLine[] = []
  rowTop = topY
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]
    for (const cell of row.cells) {
      const colSpan = cell.colSpan ?? 1
      const rowSpan = cell.rowSpan ?? 1
      let cellX = leftX
      for (let i = 0; i < cell.col; i += 1) {
        cellX += columnWidths[i]
      }
      let cellWidth = 0
      for (let i = cell.col; i < cell.col + colSpan; i += 1) {
        cellWidth += columnWidths[i]
      }
      const fontSize = cell.fontSize ?? 7
      const bold = cell.bold ?? false
      const vAlign = cell.vAlign ?? (cell.center ? 'middle' : 'top')
      const cellHeight = rowSpan > 1 ? rowSpanBlockHeight(rows, rowIndex, rowSpan) : row.height
      const cellTop = rowTop
      const cellCenterY = cellTop - cellHeight / 2

      if (cell.vertical) {
        ops += pdfRotatedTextOps(cell.text, cellX + cellWidth / 2, cellCenterY, fontSize, bold)
      } else {
        const textLines = pdfCellTextLines({ ...cell, maxLines: cell.maxLines }, cellWidth, fontSize, bold)
        lines.push(
          ...pdfPlaceCellTextLines(
            textLines,
            cellTop,
            cellHeight,
            cellX,
            cellWidth,
            fontSize,
            bold,
            cell.center ?? false,
            cell.right ?? false,
            vAlign
          )
        )
      }
    }
    rowTop -= row.height
  }

  return { ops, lines, height: totalHeight }
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

function estimateLegacyAssignmentBlockHeight(
  row: NonNullable<Ics215WorkAssignmentsTableSegment['rows'][number]>,
  columnWidths: number[],
  resourceCount: number
): number {
  const measureLines = (text: string, maxWidth: number, maxLines: number) =>
    wrapPdfText(sanitizeForPdf(text || ' '), maxWidth, 6.5, false).slice(0, maxLines).length

  return estimateLegacyAssignmentBlockHeightPt(row, columnWidths, resourceCount, measureLines)
}

function buildWorkAssignmentsTablePdfRows(
  segment: Ics215WorkAssignmentsTableSegment,
  columnWidths: number[],
  preparedByFooter?: Ics215PreparedByFooter
): PdfTableRow[] {
  const resourceCount = segment.resourceColumns.length
  const kindsCol = ics215LegacyKindsCol()
  const resourceStart = ics215LegacyResourceStartCol()
  const overflowStart = ics215LegacyOverflowStartCol(resourceCount)
  const headerFontSize = 6
  const headerHeight = Math.max(
    48,
    estimateLegacyVerticalHeaderHeight(ICS215_LEGACY_KINDS_HEADER_LABEL, headerFontSize),
    resourceCount > 0
      ? Math.max(
          ...segment.resourceColumns.map((column) =>
            estimateLegacyVerticalHeaderHeight(column.label, headerFontSize, 36)
          )
        )
      : 36
  )
  const rows: PdfTableRow[] = []

  if (segment.showTableHeader) {
    const headerCells: PdfTableCell[] = [
      { col: 0, text: '5. Division/Group/Other', bold: true, fontSize: headerFontSize, vAlign: 'middle' },
      { col: 1, text: '6. Work Assignments', bold: true, fontSize: headerFontSize, vAlign: 'middle' },
      {
        col: kindsCol,
        text: ICS215_LEGACY_KINDS_HEADER_LABEL,
        bold: true,
        fontSize: headerFontSize,
        vertical: true,
      },
    ]
    segment.resourceColumns.forEach((column, index) => {
      headerCells.push({
        col: resourceStart + index,
        text: column.label,
        bold: true,
        fontSize: headerFontSize,
        vertical: true,
      })
    })
    headerCells.push(
      {
        col: overflowStart,
        text: '8. Overhead Position(s)',
        bold: true,
        fontSize: headerFontSize,
        vAlign: 'middle',
      },
      {
        col: overflowStart + 1,
        text: '9. Special Equipment & Supplies',
        bold: true,
        fontSize: headerFontSize,
        vAlign: 'middle',
      },
      {
        col: overflowStart + 2,
        text: '10. Reporting Location',
        bold: true,
        fontSize: headerFontSize,
        vAlign: 'middle',
      },
      {
        col: overflowStart + 3,
        text: '11. Requested Arrival Time',
        bold: true,
        fontSize: headerFontSize,
        vAlign: 'middle',
      }
    )
    rows.push({ height: headerHeight, cells: headerCells, borderAfter: 'full' })
  }

  const bodyRows = segment.rows.length === 0 ? [null] : segment.rows
  for (const row of bodyRows) {
    if (!row) {
      const emptyCells: PdfTableCell[] = []
      for (let col = 0; col < overflowStart + 4; col += 1) {
        emptyCells.push({ col, text: ' ' })
      }
      rows.push({ height: 36, cells: emptyCells, borderAfter: 'full' })
      continue
    }

    const blockHeight = estimateLegacyAssignmentBlockHeight(row, columnWidths, resourceCount)
    const subRowHeight = blockHeight / ICS215_LEGACY_RHN_FIELDS.length

    ICS215_LEGACY_RHN_FIELDS.forEach((field, rhnIndex) => {
      const isFirst = rhnIndex === 0
      const isLast = rhnIndex === ICS215_LEGACY_RHN_FIELDS.length - 1
      const cells: PdfTableCell[] = []

      if (isFirst) {
        cells.push(
          {
            col: 0,
            rowSpan: ICS215_LEGACY_RHN_FIELDS.length,
            text: row.assignee || ' ',
            fontSize: 6.5,
            vAlign: 'top',
            maxLines: 6,
          },
          {
            col: 1,
            rowSpan: ICS215_LEGACY_RHN_FIELDS.length,
            text: row.workAssignment || ' ',
            fontSize: 6.5,
            vAlign: 'top',
            maxLines: 8,
          }
        )
      }

      cells.push({
        col: kindsCol,
        text: ICS215_LEGACY_RHN_LABELS[rhnIndex],
        bold: true,
        right: true,
        fontSize: 6,
        vAlign: 'middle',
      })

      segment.resourceColumns.forEach((column, index) => {
        cells.push({
          col: resourceStart + index,
          text: legacyResourceCellValue(row.resourceValues, column.id, field),
          center: true,
          fontSize: 6.5,
          vAlign: 'middle',
        })
      })

      if (isFirst) {
        cells.push(
          {
            col: overflowStart,
            rowSpan: ICS215_LEGACY_RHN_FIELDS.length,
            text: row.overheadPositions || ' ',
            fontSize: 6.5,
            vAlign: 'top',
            maxLines: 4,
          },
          {
            col: overflowStart + 1,
            rowSpan: ICS215_LEGACY_RHN_FIELDS.length,
            text: row.specialEquipmentSupplies || ' ',
            fontSize: 6.5,
            vAlign: 'top',
            maxLines: 4,
          },
          {
            col: overflowStart + 2,
            rowSpan: ICS215_LEGACY_RHN_FIELDS.length,
            text: row.reportingLocation || ' ',
            fontSize: 6.5,
            vAlign: 'top',
            maxLines: 3,
          },
          {
            col: overflowStart + 3,
            rowSpan: ICS215_LEGACY_RHN_FIELDS.length,
            text: row.requestedArrivalTime || ' ',
            fontSize: 6.5,
            vAlign: 'middle',
            maxLines: 2,
          }
        )
      }

      rows.push({
        height: subRowHeight,
        cells,
        borderAfter: isLast ? 'full' : 'resource-zone',
      })
    })
  }

  if (segment.showResourceTotalsFooter) {
    const footerHeight = 18
    ICS215_LEGACY_TOTAL_ROWS.forEach((totalRow, totalIndex) => {
      const totalCells: PdfTableCell[] = [
        {
          col: 0,
          colSpan: 2,
          text: totalRow.label,
          bold: true,
          fontSize: 6,
          vAlign: 'middle',
          maxLines: 2,
        },
        {
          col: kindsCol,
          text: ICS215_LEGACY_RHN_LABELS[ICS215_LEGACY_RHN_FIELDS.indexOf(totalRow.field)],
          bold: true,
          right: true,
          fontSize: 6,
          vAlign: 'middle',
        },
      ]
      segment.resourceColumns.forEach((column, index) => {
        const totals = segment.columnTotals[column.id]
        totalCells.push({
          col: resourceStart + index,
          text: totals?.[totalRow.field]?.trim() || ' ',
          center: true,
          fontSize: 6.5,
          vAlign: 'middle',
        })
      })
      for (let col = overflowStart; col < overflowStart + 4; col += 1) {
        totalCells.push({ col, text: ' ' })
      }
      rows.push({
        height: footerHeight,
        cells: totalCells,
        borderAfter: totalIndex === ICS215_LEGACY_TOTAL_ROWS.length - 1 ? 'none' : 'full',
      })
    })
  }

  if (segment.showPreparedByFooter && preparedByFooter) {
    const overflowSpan = 4
      rows.push({
        height: ICS215_PREPARED_BY_FOOTER_HEIGHT_PT,
        cells: [
          {
            col: 0,
            colSpan: overflowStart,
            text: ' ',
            fontSize: 6.5,
          },
          {
            col: overflowStart,
            colSpan: overflowSpan,
            text: [
              preparedByFooter.label,
              `Name: ${preparedByFooter.name.trim() || ' '}`,
              `Position/Title: ${preparedByFooter.positionTitle.trim() || ' '}`,
              `Date/Time: ${preparedByFooter.dateTime.trim() || ' '}`,
            ].join('\n'),
            fontSize: 6.5,
            vAlign: 'top',
            maxLines: 5,
          },
        ],
        borderAfter: 'none',
        suppressOverflowVerticalLines: true,
      })
  }

  return rows
}

function buildPdfWorkTableColumnWidths(
  resourceColumns: Ics215ResourceColumn[],
  tableWidth: number
): number[] {
  return scaleColumnWidthsToPdf(buildIcs215LegacyTableColumnWidths(resourceColumns), tableWidth)
}

function renderPdfHeaderInfoGrid(
  page: Ics215PhysicalPage,
  margin: number,
  contentWidth: number,
  topY: number
): { ops: string; lines: PdfLine[]; height: number; bottomY: number } {
  const colWidths = buildIcs215HeaderInfoColumnWidths(contentWidth)
  const row1Height = 34
  const row2Height = 34
  const height = row1Height + row2Height
  const bottomY = topY - height
  const rowMidY = topY - row1Height
  let ops = '0.75 w\n'
  ops += `${margin.toFixed(2)} ${topY.toFixed(2)} m ${(margin + contentWidth).toFixed(2)} ${topY.toFixed(2)} l S\n`
  ops += `${margin.toFixed(2)} ${bottomY.toFixed(2)} m ${(margin + contentWidth).toFixed(2)} ${bottomY.toFixed(2)} l S\n`
  ops += `${margin.toFixed(2)} ${bottomY.toFixed(2)} m ${margin.toFixed(2)} ${topY.toFixed(2)} l S\n`
  ops += `${(margin + contentWidth).toFixed(2)} ${bottomY.toFixed(2)} m ${(margin + contentWidth).toFixed(2)} ${topY.toFixed(2)} l S\n`
  ops += `${margin.toFixed(2)} ${rowMidY.toFixed(2)} m ${(margin + contentWidth).toFixed(2)} ${rowMidY.toFixed(2)} l S\n`

  let x = margin
  for (let i = 1; i < colWidths.length; i += 1) {
    x += colWidths[i - 1]
    ops += `${x.toFixed(2)} ${bottomY.toFixed(2)} m ${x.toFixed(2)} ${topY.toFixed(2)} l S\n`
  }

  const lines: PdfLine[] = []
  const pad = 4
  const labelSize = 7
  const valueSize = 8.5

  const incidentName = page.headerCells[0]
  const incidentLocation = page.headerCells[1]
  const dateTimePrepared = page.headerCells[2]

  const drawHeaderCell = (
    cellIndex: number,
    rowTop: number,
    rowHeight: number,
    label: string,
    value: string,
    colSpan = 1
  ) => {
    let cellX = margin
    for (let i = 0; i < cellIndex; i += 1) {
      cellX += colWidths[i]
    }
    let cellWidth = 0
    for (let i = cellIndex; i < cellIndex + colSpan; i += 1) {
      cellWidth += colWidths[i]
    }
    let cy = rowTop - pad - labelSize
    lines.push({
      text: sanitizeForPdf(label),
      font: 'F2',
      size: labelSize,
      x: cellX + pad,
      y: cy,
      bold: true,
    })
    cy -= 10
    wrapPdfText(sanitizeForPdf(value || ' '), cellWidth - pad * 2, valueSize, false).forEach((line) => {
      lines.push({ text: line, font: 'F1', size: valueSize, x: cellX + pad, y: cy })
      cy -= 10
    })
  }

  drawHeaderCell(0, topY, row1Height, incidentName.label, incidentName.value)
  drawHeaderCell(1, topY, row1Height, dateTimePrepared.label, dateTimePrepared.value)
  drawHeaderCell(
    2,
    topY,
    row1Height,
    '4. Operational Period (Date/Time):',
    page.operationalPeriod
  )
  drawHeaderCell(0, rowMidY, row2Height, incidentLocation.label, incidentLocation.value)

  return { ops, lines, height, bottomY }
}

function renderPdfWorkAssignmentsTable(
  segment: Ics215WorkAssignmentsTableSegment,
  margin: number,
  contentWidth: number,
  startY: number,
  preparedByFooter: Ics215PreparedByFooter | undefined,
  drawTop: boolean
): { ops: string; lines: PdfLine[]; nextY: number } {
  const gap = ICS215_BOX_STACK.segmentGapPt
  const continuedLead = segment.label.includes('(Continued)') ? 12 : 0
  const tableTopY = startY - continuedLead
  const columnWidths = buildPdfWorkTableColumnWidths(segment.resourceColumns, contentWidth)
  const tableRows = buildWorkAssignmentsTablePdfRows(
    segment,
    columnWidths,
    segment.showPreparedByFooter ? preparedByFooter : undefined
  )
  const inner = drawPdfTableWithSpans(margin, tableTopY, contentWidth, columnWidths, tableRows, {
    drawTop,
    resourceCount: segment.resourceColumns.length,
  })

  const lines: PdfLine[] = []
  if (continuedLead > 0) {
    lines.push({
      text: sanitizeForPdf(segment.label),
      font: 'F2',
      size: 7,
      x: margin,
      y: startY - 7,
      bold: true,
    })
  }
  lines.push(...inner.lines)

  return { ops: inner.ops, lines, nextY: tableTopY - inner.height - gap }
}

function renderPdfPageHeader(
  page: Ics215PhysicalPage,
  margin: number,
  contentWidth: number,
  startY: number
): { ops: string; lines: PdfLine[]; nextY: number } {
  const titleGap = 4
  let y = startY
  let ops = ''
  const lines: PdfLine[] = []

  for (let i = 0; i < ICS215_FORM_TITLE_LINES.length; i += 1) {
    const line = ICS215_FORM_TITLE_LINES[i]
    const size = i === ICS215_FORM_TITLE_LINES.length - 1 ? 11 : 8
    const bold = i === ICS215_FORM_TITLE_LINES.length - 1
    const textWidth = estimatePdfTextWidth(sanitizeForPdf(line), size, bold)
    const x = margin + Math.max(0, (contentWidth - textWidth) / 2)
    y -= size + 4
    lines.push({ text: sanitizeForPdf(line), font: bold ? 'F2' : 'F1', size, x, y, bold })
  }
  y -= titleGap

  const headerGrid = renderPdfHeaderInfoGrid(page, margin, contentWidth, y)
  ops += headerGrid.ops
  lines.push(...headerGrid.lines)

  return { ops, lines, nextY: headerGrid.bottomY }
}

function renderPdfPageFooter(
  page: Ics215PhysicalPage,
  margin: number,
  contentWidth: number
): { ops: string; lines: PdfLine[] } {
  const pageLabel = `Page ${page.displayPageNumber} of ${page.totalPages}`
  const y = ICS215_PDF_ICS_LINE_Y_PT
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

function buildIcs215PdfBytes(pages: Ics215PhysicalPage[]): Uint8Array {
  const pageWidth = ICS215_PDF_PAGE.widthPt
  const pageHeight = ICS215_PDF_PAGE.heightPt
  const margin = ICS215_PDF_PAGE.marginPt
  const contentWidth = ICS215_PDF_CONTENT_WIDTH
  const contentTop = pageHeight - margin

  const pdfPages: Array<{ ops: string; lines: PdfLine[] }> = pages.map((page) => {
    let ops = ''
    const lines: PdfLine[] = []
    const header = renderPdfPageHeader(page, margin, contentWidth, contentTop)
    ops += header.ops
    lines.push(...header.lines)
    let y = header.nextY
    page.segments.forEach((segment, segmentIndex) => {
      const drawTop = !(segmentIndex === 0 && segment.showTableHeader)
      const rendered = renderPdfWorkAssignmentsTable(
        segment,
        margin,
        contentWidth,
        y,
        page.preparedByFooter,
        drawTop
      )
      ops += rendered.ops
      lines.push(...rendered.lines)
      y = rendered.nextY
    })
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

export function downloadIcs215Pdf(filename: string, blocks: Ics215ExportLayoutBlock[]): void {
  const pages = paginateIcs215Export(blocks, { target: 'pdf' })
  assertIcs215PaginationInvariants(pages)
  const bytes = buildIcs215PdfBytes(pages)
  triggerBlobDownload(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), filename)
}
