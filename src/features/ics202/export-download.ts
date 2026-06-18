import type { Ics202ExportLayoutBlock } from '@/features/ics202/export-layout'
import { ICS202_FORM_TITLE_LINES } from '@/features/ics202/export-layout'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const DOCX_TABLE_BORDERS =
  `<w:tblBorders>` +
  `<w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>` +
  `<w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>` +
  `<w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>` +
  `<w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>` +
  `<w:insideH w:val="single" w:sz="6" w:space="0" w:color="000000"/>` +
  `<w:insideV w:val="single" w:sz="6" w:space="0" w:color="000000"/>` +
  `</w:tblBorders>`

function docxParagraph(text: string, opts: { bold?: boolean; size?: number; center?: boolean } = {}) {
  const size = opts.size ?? 18
  const jc = opts.center ? `<w:jc w:val="center"/>` : ''
  const bold = opts.bold ? `<w:b/>` : ''
  return (
    `<w:p><w:pPr><w:spacing w:before="0" w:after="40"/>${jc}</w:pPr>` +
    `<w:r><w:rPr>${bold}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(text || ' ')}</w:t></w:r></w:p>`
  )
}

function docxMultilineParagraphs(text: string, size = 18): string {
  const lines = (text ?? '').split(/\r?\n/)
  if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
    return docxParagraph(' ', { size })
  }
  return lines
    .map((line) => docxParagraph(line.length > 0 ? line : ' ', { size }))
    .join('')
}

function docxLabelParagraph(label: string): string {
  return docxParagraph(label, { bold: true, size: 16 })
}

function docxBoxTable(innerXml: string, widthPct = 5000): string {
  return (
    `<w:tbl>` +
    `<w:tblPr><w:tblW w:w="${widthPct}" w:type="pct"/>${DOCX_TABLE_BORDERS}</w:tblPr>` +
    `<w:tr><w:tc><w:tcPr><w:tcW w:w="${widthPct}" w:type="pct"/>` +
    `<w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tcMar>` +
    `</w:tcPr>${innerXml}</w:tc></w:tr></w:tbl>`
  )
}

function renderLayoutBlockDocx(block: Ics202ExportLayoutBlock): string {
  switch (block.kind) {
    case 'form-title':
      return ICS202_FORM_TITLE_LINES.map((line, index) =>
        docxParagraph(line, {
          bold: index === ICS202_FORM_TITLE_LINES.length - 1,
          center: true,
          size: index === ICS202_FORM_TITLE_LINES.length - 1 ? 20 : 16,
        })
      ).join('')
    case 'header-row': {
      const cellWidth = Math.floor(5000 / block.cells.length)
      const cells = block.cells
        .map((cell) => {
          let inner = docxLabelParagraph(cell.label)
          if (cell.subLabels?.length) {
            inner += cell.subLabels
              .map((sub) => docxParagraph(sub, { size: 14 }))
              .join('')
          }
          inner += docxParagraph(cell.value || ' ', { size: 18 })
          return (
            `<w:tc><w:tcPr><w:tcW w:w="${cellWidth}" w:type="pct"/>` +
            `<w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar>` +
            `</w:tcPr>${inner}</w:tc>`
          )
        })
        .join('')
      return (
        `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${DOCX_TABLE_BORDERS}</w:tblPr>` +
        `<w:tr>${cells}</w:tr></w:tbl>`
      )
    }
    case 'lifelines': {
      const rows: string[] = []
      for (let i = 0; i < block.options.length; i += 4) {
        const slice = block.options.slice(i, i + 4)
        const cells = slice
          .map((opt) => {
            const mark = opt.checked ? '\u2611' : '\u2610'
            return (
              `<w:tc><w:tcPr><w:tcW w:w="1250" w:type="pct"/></w:tcPr>` +
              docxParagraph(`${mark} ${opt.label}`, { size: 16 }) +
              `</w:tc>`
            )
          })
          .join('')
        rows.push(`<w:tr>${cells}</w:tr>`)
      }
      const grid =
        `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${DOCX_TABLE_BORDERS}</w:tblPr>` +
        rows.join('') +
        `</w:tbl>`
      return docxBoxTable(docxLabelParagraph(block.label) + grid)
    }
    case 'text-box':
      return docxBoxTable(
        docxLabelParagraph(block.label) + docxMultilineParagraphs(block.body, 18)
      )
    case 'objectives': {
      const header =
        `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${DOCX_TABLE_BORDERS}</w:tblPr>` +
        `<w:tr>` +
        `<w:tc><w:tcPr><w:tcW w:w="400" w:type="pct"/></w:tcPr>${docxParagraph('O/M', { bold: true, size: 14 })}</w:tc>` +
        `<w:tc><w:tcPr><w:tcW w:w="4600" w:type="pct"/></w:tcPr>${docxParagraph('Objective', { bold: true, size: 14 })}</w:tc>` +
        `</w:tr>`
      const bodyRows =
        block.rows.length === 0
          ? `<w:tr><w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr>${docxParagraph(' ', { size: 18 })}</w:tc></w:tr>`
          : block.rows
              .map((row) => {
                const prefix = [row.kind, row.label].filter(Boolean).join(' ')
                const text = prefix
                  ? `${prefix}  ${row.objective}`
                  : row.objective || ' '
                return (
                  `<w:tr>` +
                  `<w:tc><w:tcPr><w:tcW w:w="400" w:type="pct"/></w:tcPr>${docxParagraph(row.kind || ' ', { size: 16 })}</w:tc>` +
                  `<w:tc><w:tcPr><w:tcW w:w="4600" w:type="pct"/></w:tcPr>${docxMultilineParagraphs(text, 16)}</w:tc>` +
                  `</w:tr>`
                )
              })
              .join('')
      const table = header + bodyRows + `</w:tbl>`
      return docxBoxTable(docxLabelParagraph(block.label) + table)
    }
    case 'site-safety-plan': {
      const yesMark = block.required ? '\u2611' : '\u2610'
      const noMark = block.required ? '\u2610' : '\u2611'
      const row =
        `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${DOCX_TABLE_BORDERS}</w:tblPr>` +
        `<w:tr>` +
        `<w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr>` +
        docxLabelParagraph('8. Site Safety Plan Required:') +
        docxParagraph(`Yes ${yesMark}   No ${noMark}`, { size: 16 }) +
        `</w:tc>` +
        `<w:tc><w:tcPr><w:tcW w:w="2500" w:type="pct"/></w:tcPr>` +
        docxLabelParagraph('9. Site Safety Plan located at:') +
        docxMultilineParagraphs(block.location, 16) +
        `</w:tc>` +
        `</w:tr></w:tbl>`
      return row
    }
    case 'prepared-by': {
      const fields = [
        { label: 'Name:', value: block.fields.name },
        { label: 'Position Title:', value: block.fields.positionTitle },
        { label: 'Signature:', value: block.fields.signature },
        { label: 'Date/Time:', value: block.fields.dateTime },
      ]
      const cells = fields
        .map((field) => {
          return (
            `<w:tc><w:tcPr><w:tcW w:w="1250" w:type="pct"/>` +
            `<w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tcMar>` +
            `</w:tcPr>${docxLabelParagraph(field.label)}${docxMultilineParagraphs(field.value, 16)}</w:tc>`
          )
        })
        .join('')
      return docxBoxTable(
        docxLabelParagraph(block.label) +
          `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${DOCX_TABLE_BORDERS}</w:tblPr>` +
          `<w:tr>${cells}</w:tr></w:tbl>`
      )
    }
    case 'page-break':
      return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`
    case 'page-footer':
      return (
        `<w:p><w:pPr><w:tabs>` +
        `<w:tab w:val="left" w:pos="0"/>` +
        `<w:tab w:val="center" w:pos="4680"/>` +
        `<w:tab w:val="right" w:pos="9360"/>` +
        `</w:tabs><w:spacing w:before="240" w:after="0"/></w:pPr>` +
        `<w:r><w:rPr><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr>` +
        `<w:t xml:space="preserve">${escapeXml(block.left)}\t\t${escapeXml(block.pageLabel)}</w:t></w:r></w:p>`
      )
    default:
      return ''
  }
}

function buildIcs202DocxXml(blocks: Ics202ExportLayoutBlock[]): string {
  const body = blocks.map(renderLayoutBlockDocx).join('')
  const sectPr =
    `<w:sectPr>` +
    `<w:pgSz w:w="12240" w:h="15840"/>` +
    `<w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="0" w:footer="0" w:gutter="0"/>` +
    `</w:sectPr>`
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:body>${body}${sectPr}</w:body></w:document>`
  )
}

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
  const documentXml = buildIcs202DocxXml(blocks)
  const files = [
    {
      name: '[Content_Types].xml',
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
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
      content:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`,
    },
    { name: 'word/document.xml', content: documentXml },
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

function drawBox(
  leftX: number,
  topY: number,
  width: number,
  label: string,
  bodyLines: string[],
  bodySize = 9,
  labelSize = 7
): PdfBoxResult {
  const pad = 6
  const labelLead = 10
  const bodyLead = 11
  const labelLines = wrapPdfText(sanitizeForPdf(label), width - pad * 2, labelSize, true)
  const wrappedBody = bodyLines.flatMap((line) =>
    wrapPdfText(sanitizeForPdf(line), width - pad * 2, bodySize, false)
  )
  const minBodyLines = Math.max(wrappedBody.length, 2)
  const height =
    pad + labelLines.length * labelLead + 4 + minBodyLines * bodyLead + pad
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
  const bodyToRender = wrappedBody.length > 0 ? wrappedBody : [' ']
  for (const line of bodyToRender) {
    pdfLines.push({ text: line, font: 'F1', size: bodySize, x: leftX + pad, y: y - bodySize })
    y -= bodyLead
  }
  return { ops, height, lines: pdfLines }
}

function layoutBlockToPdfElements(
  block: Ics202ExportLayoutBlock,
  margin: number,
  contentWidth: number,
  startY: number
): { elements: Array<{ ops?: string; lines?: PdfLine[]; pageBreak?: boolean }>; nextY: number } {
  const gap = 6
  let y = startY
  const elements: Array<{ ops?: string; lines?: PdfLine[]; pageBreak?: boolean }> = []

  switch (block.kind) {
    case 'form-title': {
      for (let i = 0; i < ICS202_FORM_TITLE_LINES.length; i += 1) {
        const line = ICS202_FORM_TITLE_LINES[i]
        const size = i === ICS202_FORM_TITLE_LINES.length - 1 ? 11 : 8
        const bold = i === ICS202_FORM_TITLE_LINES.length - 1
        const textWidth = estimatePdfTextWidth(sanitizeForPdf(line), size, bold)
        const x = margin + Math.max(0, (contentWidth - textWidth) / 2)
        y -= size + 4
        elements.push({
          lines: [{ text: sanitizeForPdf(line), font: bold ? 'F2' : 'F1', size, x, y, bold }],
        })
      }
      y -= gap
      return { elements, nextY: y }
    }
    case 'header-row': {
      const cellW = contentWidth / block.cells.length
      const cellHeights = block.cells.map((cell) => {
        const labelH = 12
        const valueLines = wrapPdfText(
          sanitizeForPdf(cell.value || ' '),
          cellW - 8,
          8.5,
          false
        )
        return labelH + (cell.subLabels?.length ?? 0) * 9 + valueLines.length * 10 + 10
      })
      const height = Math.max(...cellHeights, 36)
      const bottomY = y - height
      let ops = '0.75 w\n'
      ops += `${margin.toFixed(2)} ${bottomY.toFixed(2)} ${contentWidth.toFixed(2)} ${height.toFixed(2)} re S\n`
      for (let i = 1; i < block.cells.length; i += 1) {
        const x = margin + cellW * i
        ops += `${x.toFixed(2)} ${bottomY.toFixed(2)} m ${x.toFixed(2)} ${y.toFixed(2)} l S\n`
      }
      const lines: PdfLine[] = []
      block.cells.forEach((cell, index) => {
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
      elements.push({ ops, lines })
      y = bottomY - gap
      return { elements, nextY: y }
    }
    case 'lifelines': {
      const optionLines = block.options.map(
        (opt) => `${opt.checked ? '[X]' : '[ ]'} ${opt.label}`
      )
      const body = optionLines.join('\n')
      const box = drawBox(margin, y, contentWidth, block.label, body.split('\n'), 8, 7)
      elements.push({ ops: box.ops, lines: box.lines })
      y -= box.height + gap
      return { elements, nextY: y }
    }
    case 'text-box': {
      const box = drawBox(
        margin,
        y,
        contentWidth,
        block.label,
        (block.body || '').split('\n'),
        9,
        7
      )
      elements.push({ ops: box.ops, lines: box.lines })
      y -= box.height + gap
      return { elements, nextY: y }
    }
    case 'objectives': {
      const body =
        block.rows.length === 0
          ? [' ']
          : block.rows.map((row) => {
              const prefix = [row.kind, row.label].filter(Boolean).join(' ')
              return prefix ? `${prefix}  ${row.objective}` : row.objective || ' '
            })
      const box = drawBox(margin, y, contentWidth, block.label, body, 8.5, 7)
      elements.push({ ops: box.ops, lines: box.lines })
      y -= box.height + gap
      return { elements, nextY: y }
    }
    case 'site-safety-plan': {
      const yes = block.required ? '[X]' : '[ ]'
      const no = block.required ? '[ ]' : '[X]'
      const half = contentWidth / 2
      const height = 44
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
      wrapPdfText(sanitizeForPdf(block.location || ' '), half - 8, 8, false).forEach((line, i) => {
        lines.push({
          text: line,
          font: 'F1',
          size: 8,
          x: margin + half + 4,
          y: y - 20 - i * 10,
        })
      })
      elements.push({ ops, lines })
      y = bottomY - gap
      return { elements, nextY: y }
    }
    case 'prepared-by': {
      const cellW = contentWidth / 4
      const fields = [
        { label: 'Name:', value: block.fields.name },
        { label: 'Position Title:', value: block.fields.positionTitle },
        { label: 'Signature:', value: block.fields.signature },
        { label: 'Date/Time:', value: block.fields.dateTime },
      ]
      const height = 48
      const bottomY = y - height
      let ops = '0.75 w\n'
      ops += `${margin.toFixed(2)} ${bottomY.toFixed(2)} ${contentWidth.toFixed(2)} ${height.toFixed(2)} re S\n`
      for (let i = 1; i < 4; i += 1) {
        const x = margin + cellW * i
        ops += `${x.toFixed(2)} ${bottomY.toFixed(2)} m ${x.toFixed(2)} ${y.toFixed(2)} l S\n`
      }
      const lines: PdfLine[] = [
        {
          text: sanitizeForPdf(block.label),
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
      elements.push({ ops, lines })
      y = bottomY - gap
      return { elements, nextY: y }
    }
    case 'page-footer': {
      y -= 8
      elements.push({
        lines: [
          {
            text: sanitizeForPdf(block.left),
            font: 'F1',
            size: 7,
            x: margin,
            y,
          },
          {
            text: sanitizeForPdf(block.pageLabel),
            font: 'F1',
            size: 7,
            x: margin + contentWidth - estimatePdfTextWidth(block.pageLabel, 7, false),
            y,
          },
        ],
      })
      y -= 12
      return { elements, nextY: y }
    }
    case 'page-break':
      elements.push({ pageBreak: true })
      return { elements, nextY: startY }
    default:
      return { elements, nextY: y }
  }
}

function buildIcs202PdfBytes(blocks: Ics202ExportLayoutBlock[]): Uint8Array {
  const pageWidth = 612
  const pageHeight = 792
  const margin = 36
  const contentWidth = pageWidth - margin * 2
  const contentTop = pageHeight - margin
  const contentBottom = margin + 24

  const pages: Array<{ ops: string; lines: PdfLine[] }> = []
  let currentOps = ''
  let currentLines: PdfLine[] = []
  let y = contentTop

  const startNewPage = () => {
    if (currentOps.length > 0 || currentLines.length > 0) {
      pages.push({ ops: currentOps, lines: currentLines })
    }
    currentOps = ''
    currentLines = []
    y = contentTop
  }

  for (const block of blocks) {
    if (block.kind === 'page-break') {
      startNewPage()
      continue
    }
    const result = layoutBlockToPdfElements(block, margin, contentWidth, y)
    const estimatedHeight = y - result.nextY + 20
    if (y - estimatedHeight < contentBottom && currentLines.length > 0) {
      startNewPage()
      const retry = layoutBlockToPdfElements(block, margin, contentWidth, y)
      if (retry.elements[0]?.ops) currentOps += retry.elements[0].ops
      if (retry.elements[0]?.lines) currentLines.push(...retry.elements[0].lines)
      y = retry.nextY
      continue
    }
    for (const el of result.elements) {
      if (el.pageBreak) {
        startNewPage()
        continue
      }
      if (el.ops) currentOps += el.ops
      if (el.lines) currentLines.push(...el.lines)
    }
    y = result.nextY
  }
  if (currentOps.length > 0 || currentLines.length > 0) {
    pages.push({ ops: currentOps, lines: currentLines })
  }
  if (pages.length === 0) pages.push({ ops: '', lines: [] })

  const stringToLatin1Bytes = (text: string): Uint8Array => {
    const bytes = new Uint8Array(text.length)
    for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff
    return bytes
  }

  const contentStreams = pages.map((page) => {
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
  const bytes = buildIcs202PdfBytes(blocks)
  triggerBlobDownload(new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }), filename)
}

export { buildIcs202PdfBytes, buildIcs202DocxXml }
