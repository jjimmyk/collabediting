import type { Ics202ExportLayoutBlock } from '@/features/ics202/export-layout'
import { ICS202_FORM_TITLE_LINES } from '@/features/ics202/export-layout'
import {
  assertIcs202DocxLayoutConsistency,
  buildIcs202DocxDocumentRelsXml,
  buildIcs202DocxFooterXml,
  buildIcs202DocxHeaderXml,
  buildIcs202DocxXml,
  ICS202_PDF_CONTENT_WIDTH,
  ICS202_PDF_PAGE,
} from '@/features/ics202/export-docx-layout'
import {
  assertIcs202PaginationInvariants,
  paginateIcs202Export,
  type Ics202PagePreparedBy,
  type Ics202PhysicalPage,
  type Ics202PhysicalPageSegment,
} from '@/features/ics202/export-pagination'

export { buildIcs202DocxXml } from '@/features/ics202/export-docx-layout'
export {
  assertIcs202PaginationInvariants,
  paginateIcs202Export,
} from '@/features/ics202/export-pagination'
export type { Ics202PhysicalPage } from '@/features/ics202/export-pagination'

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

export function downloadIcs202Docx(filename: string, blocks: Ics202ExportLayoutBlock[]): void {
  const pages = paginateIcs202Export(blocks)
  assertIcs202PaginationInvariants(pages)
  const documentXml = buildIcs202DocxXml(pages)
  assertIcs202DocxLayoutConsistency(documentXml)
  const headerCells = pages[0]?.headerCells ?? []
  const footerLeft = pages[0]?.footerLeft ?? 'ICS 202-CG (08/25)  Expiration: 08/35'
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
        `<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>` +
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
      content: buildIcs202DocxDocumentRelsXml(),
    },
    { name: 'word/document.xml', content: documentXml },
    { name: 'word/header1.xml', content: buildIcs202DocxHeaderXml(headerCells) },
    { name: 'word/footer1.xml', content: buildIcs202DocxFooterXml(footerLeft) },
  ]
  const bytes = buildStoredZip(files)
  triggerBlobDownload(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), filename)
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

function renderPdfPageHeader(
  page: Ics202PhysicalPage,
  margin: number,
  contentWidth: number,
  startY: number
): { ops: string; lines: PdfLine[]; nextY: number } {
  const gap = 6
  let y = startY
  let ops = ''
  const lines: PdfLine[] = []

  for (let i = 0; i < ICS202_FORM_TITLE_LINES.length; i += 1) {
    const line = ICS202_FORM_TITLE_LINES[i]
    const size = i === ICS202_FORM_TITLE_LINES.length - 1 ? 11 : 8
    const bold = i === ICS202_FORM_TITLE_LINES.length - 1
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

function renderPdfPageSegment(
  segment: Ics202PhysicalPageSegment,
  margin: number,
  contentWidth: number,
  startY: number
): { ops: string; lines: PdfLine[]; nextY: number } {
  const gap = 6
  let y = startY

  switch (segment.kind) {
    case 'lifelines': {
      const optionLines = segment.options.map(
        (opt) => `${opt.checked ? '[X]' : '[ ]'} ${opt.label}`
      )
      const box = drawBoxExact(margin, y, contentWidth, segment.label, optionLines, 8, 7, 2)
      y -= box.height + gap
      return { ops: box.ops, lines: box.lines, nextY: y }
    }
    case 'text-box': {
      const box = drawBoxExact(margin, y, contentWidth, segment.label, segment.bodyLines, 9, 7, 1)
      y -= box.height + gap
      return { ops: box.ops, lines: box.lines, nextY: y }
    }
    case 'objectives': {
      const body =
        segment.rows.length === 0
          ? [' ']
          : segment.rows.map((row) => row.objective || ' ')
      const box = drawBoxExact(margin, y, contentWidth, segment.label, body, 8.5, 7, 1)
      y -= box.height + gap
      return { ops: box.ops, lines: box.lines, nextY: y }
    }
    case 'site-safety-plan': {
      if (segment.continued) {
        const label = '9. Site Safety Plan located at: (Continued):'
        const box = drawBoxExact(
          margin,
          y,
          contentWidth,
          label,
          segment.locationLines,
          8,
          7,
          1
        )
        y -= box.height + gap
        return { ops: box.ops, lines: box.lines, nextY: y }
      }
      const yes = segment.required ? '[X]' : '[ ]'
      const no = segment.required ? '[ ]' : '[X]'
      const half = contentWidth / 2
      const height = Math.max(44, 20 + segment.locationLines.length * 10 + 12)
      const bottomY = y - height
      let ops = '0.75 w\n'
      ops += `${margin.toFixed(2)} ${bottomY.toFixed(2)} ${contentWidth.toFixed(2)} ${height.toFixed(2)} re S\n`
      ops += `${(margin + half).toFixed(2)} ${bottomY.toFixed(2)} m ${(margin + half).toFixed(2)} ${y.toFixed(2)} l S\n`
      const lines: PdfLine[] = [
        {
          text: sanitizeForPdf('8. Site Safety Plan Required:'),
          font: 'F2',
          size: 7,
          x: margin + 4,
          y: y - 8,
          bold: true,
        },
        {
          text: sanitizeForPdf(`Yes ${yes}   No ${no}`),
          font: 'F1',
          size: 8,
          x: margin + 4,
          y: y - 20,
        },
        {
          text: sanitizeForPdf('9. Site Safety Plan located at:'),
          font: 'F2',
          size: 7,
          x: margin + half + 4,
          y: y - 8,
          bold: true,
        },
      ]
      segment.locationLines.forEach((line, i) => {
        lines.push({
          text: sanitizeForPdf(line),
          font: 'F1',
          size: 8,
          x: margin + half + 4,
          y: y - 20 - i * 10,
        })
      })
      y = bottomY - gap
      return { ops, lines, nextY: y }
    }
    default:
      return { ops: '', lines: [], nextY: y }
  }
}

function renderPdfPagePreparedBy(
  preparedBy: Ics202PagePreparedBy,
  margin: number,
  contentWidth: number,
  startY: number
): { ops: string; lines: PdfLine[]; nextY: number } {
  const gap = 6
  const cellW = contentWidth / 4
  const fields = [
    { label: 'Name:', value: preparedBy.fields.name },
    { label: 'Position Title:', value: preparedBy.fields.positionTitle },
    { label: 'Signature:', value: preparedBy.fields.signature },
    { label: 'Date/Time:', value: preparedBy.fields.dateTime },
  ]
  const height = 48
  const y = startY
  const bottomY = y - height
  let ops = '0.75 w\n'
  ops += `${margin.toFixed(2)} ${bottomY.toFixed(2)} ${contentWidth.toFixed(2)} ${height.toFixed(2)} re S\n`
  for (let i = 1; i < 4; i += 1) {
    const x = margin + cellW * i
    ops += `${x.toFixed(2)} ${bottomY.toFixed(2)} m ${x.toFixed(2)} ${y.toFixed(2)} l S\n`
  }
  const lines: PdfLine[] = [
    {
      text: sanitizeForPdf(preparedBy.label),
      font: 'F2',
      size: 7,
      x: margin + 4,
      y: y - 8,
      bold: true,
    },
  ]
  fields.forEach((field, index) => {
    const x = margin + cellW * index + 4
    lines.push({
      text: sanitizeForPdf(field.label),
      font: 'F2',
      size: 6.5,
      x,
      y: y - 20,
      bold: true,
    })
    wrapPdfText(sanitizeForPdf(field.value || ' '), cellW - 8, 7.5, false)
      .slice(0, 2)
      .forEach((line, i) => {
        lines.push({ text: line, font: 'F1', size: 7.5, x, y: y - 30 - i * 9 })
      })
  })
  return { ops, lines, nextY: bottomY - gap }
}

function renderPdfPageFooter(
  page: Ics202PhysicalPage,
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

function buildIcs202PdfBytes(pages: Ics202PhysicalPage[]): Uint8Array {
  const pageWidth = ICS202_PDF_PAGE.widthPt
  const pageHeight = ICS202_PDF_PAGE.heightPt
  const margin = ICS202_PDF_PAGE.marginPt
  const contentWidth = ICS202_PDF_CONTENT_WIDTH
  const contentTop = pageHeight - margin

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
    const preparedBy = renderPdfPagePreparedBy(page.preparedBy, margin, contentWidth, y)
    ops += preparedBy.ops
    lines.push(...preparedBy.lines)
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

export function downloadIcs202Pdf(filename: string, blocks: Ics202ExportLayoutBlock[]): void {
  const pages = paginateIcs202Export(blocks)
  assertIcs202PaginationInvariants(pages)
  const bytes = buildIcs202PdfBytes(pages)
  triggerBlobDownload(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), filename)
}
