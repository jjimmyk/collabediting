import type { Ics202ExportLayoutBlock } from '@/features/ics202/export-layout'
import { ICS202_FORM_TITLE_LINES } from '@/features/ics202/export-layout'

export const ICS202_DOCX_PAGE = {
  widthDxa: 12240,
  heightDxa: 15840,
  marginDxa: 720,
} as const

export const ICS202_DOCX_CONTENT_WIDTH =
  ICS202_DOCX_PAGE.widthDxa - ICS202_DOCX_PAGE.marginDxa * 2

export const ICS202_DOCX_COL = {
  third: ICS202_DOCX_CONTENT_WIDTH / 3,
  half: ICS202_DOCX_CONTENT_WIDTH / 2,
  quarter: ICS202_DOCX_CONTENT_WIDTH / 4,
  lifeline: ICS202_DOCX_CONTENT_WIDTH / 4,
  om: 800,
  objective: ICS202_DOCX_CONTENT_WIDTH - 800,
} as const

export const ICS202_PDF_PAGE = {
  widthPt: 612,
  heightPt: 792,
  marginPt: 36,
} as const

export const ICS202_PDF_CONTENT_WIDTH =
  ICS202_PDF_PAGE.widthPt - ICS202_PDF_PAGE.marginPt * 2

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

function docxParagraph(
  text: string,
  opts: { bold?: boolean; size?: number; center?: boolean; after?: number } = {}
) {
  const size = opts.size ?? 18
  const after = opts.after ?? 40
  const jc = opts.center ? `<w:jc w:val="center"/>` : ''
  const bold = opts.bold ? `<w:b/>` : ''
  return (
    `<w:p><w:pPr><w:spacing w:before="0" w:after="${after}"/>${jc}</w:pPr>` +
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

function docxCellMargins(kind: 'normal' | 'tight' = 'normal'): string {
  if (kind === 'tight') {
    return (
      `<w:tcMar>` +
      `<w:top w:w="60" w:type="dxa"/><w:left w:w="60" w:type="dxa"/>` +
      `<w:bottom w:w="60" w:type="dxa"/><w:right w:w="60" w:type="dxa"/>` +
      `</w:tcMar>`
    )
  }
  return (
    `<w:tcMar>` +
    `<w:top w:w="80" w:type="dxa"/><w:left w:w="100" w:type="dxa"/>` +
    `<w:bottom w:w="80" w:type="dxa"/><w:right w:w="100" w:type="dxa"/>` +
    `</w:tcMar>`
  )
}

function docxCell(
  widthDxa: number,
  inner: string,
  opts: { gridSpan?: number; mar?: 'normal' | 'tight' } = {}
): string {
  const gridSpan = opts.gridSpan ? `<w:gridSpan w:val="${opts.gridSpan}"/>` : ''
  return (
    `<w:tc><w:tcPr>` +
    `<w:tcW w:w="${widthDxa}" w:type="dxa"/>` +
    gridSpan +
    `<w:vAlign w:val="top"/>` +
    docxCellMargins(opts.mar) +
    `</w:tcPr>${inner}</w:tc>`
  )
}

function docxFixedTable(columnWidthsDxa: number[], rowsXml: string): string {
  const totalWidth = columnWidthsDxa.reduce((sum, width) => sum + width, 0)
  const grid = columnWidthsDxa.map((width) => `<w:gridCol w:w="${width}"/>`).join('')
  return (
    `<w:tbl>` +
    `<w:tblPr>` +
    `<w:tblW w:w="${totalWidth}" w:type="dxa"/>` +
    `<w:tblLayout w:type="fixed"/>` +
    DOCX_TABLE_BORDERS +
    `</w:tblPr>` +
    `<w:tblGrid>${grid}</w:tblGrid>` +
    rowsXml +
    `</w:tbl>`
  )
}

function docxSectionSpacer(): string {
  return docxParagraph(' ', { size: 4, after: 0 })
}

function docxCheckboxMark(checked: boolean): string {
  return checked ? '[X]' : '[ ]'
}

/** Single full-width bordered section: label row + content row. */
function docxSectionBox(label: string, bodyXml: string): string {
  return docxFixedTable(
    [ICS202_DOCX_CONTENT_WIDTH],
    `<w:tr>${docxCell(ICS202_DOCX_CONTENT_WIDTH, docxLabelParagraph(label))}</w:tr>` +
      `<w:tr>${docxCell(ICS202_DOCX_CONTENT_WIDTH, bodyXml)}</w:tr>`
  )
}

export function renderLayoutBlockDocx(block: Ics202ExportLayoutBlock): string {
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
      const col = ICS202_DOCX_COL.third
      const cells = block.cells
        .map((cell) => {
          let inner = docxLabelParagraph(cell.label)
          if (cell.subLabels?.length) {
            inner += cell.subLabels.map((sub) => docxParagraph(sub, { size: 14 })).join('')
          }
          inner += docxMultilineParagraphs(cell.value || ' ', 18)
          return docxCell(col, inner, { mar: 'tight' })
        })
        .join('')
      return (
        docxSectionSpacer() +
        docxFixedTable([col, col, col], `<w:tr>${cells}</w:tr>`) +
        docxSectionSpacer()
      )
    }
    case 'lifelines': {
      const col = ICS202_DOCX_COL.lifeline
      const cols = [col, col, col, col]
      const labelRow = `<w:tr>${docxCell(ICS202_DOCX_CONTENT_WIDTH, docxLabelParagraph(block.label), {
        gridSpan: 4,
      })}</w:tr>`
      const gridRows: string[] = []
      for (let i = 0; i < block.options.length; i += 4) {
        const slice = block.options.slice(i, i + 4)
        const cells = slice
          .map((opt) =>
            docxCell(
              col,
              docxParagraph(`${docxCheckboxMark(opt.checked)} ${opt.label}`, { size: 16 })
            )
          )
          .join('')
        gridRows.push(`<w:tr>${cells}</w:tr>`)
      }
      return docxSectionSpacer() + docxFixedTable(cols, labelRow + gridRows.join('')) + docxSectionSpacer()
    }
    case 'text-box':
      return (
        docxSectionSpacer() +
        docxSectionBox(block.label, docxMultilineParagraphs(block.body, 18)) +
        docxSectionSpacer()
      )
    case 'objectives': {
      const omCol = ICS202_DOCX_COL.om
      const objCol = ICS202_DOCX_COL.objective
      const labelRow = `<w:tr>${docxCell(ICS202_DOCX_CONTENT_WIDTH, docxLabelParagraph(block.label), {
        gridSpan: 2,
      })}</w:tr>`
      const headerRow =
        `<w:tr>` +
        docxCell(omCol, docxParagraph('O/M', { bold: true, size: 14 })) +
        docxCell(objCol, docxParagraph('Objective', { bold: true, size: 14 })) +
        `</w:tr>`
      const bodyRows =
        block.rows.length === 0
          ? `<w:tr>${docxCell(ICS202_DOCX_CONTENT_WIDTH, docxParagraph(' ', { size: 18 }), {
              gridSpan: 2,
            })}</w:tr>`
          : block.rows
              .map((row) => {
                const prefix = [row.kind, row.label].filter(Boolean).join(' ')
                const text = prefix ? `${prefix}  ${row.objective}` : row.objective || ' '
                return (
                  `<w:tr>` +
                  docxCell(omCol, docxParagraph(row.kind || ' ', { size: 16 })) +
                  docxCell(objCol, docxMultilineParagraphs(text, 16)) +
                  `</w:tr>`
                )
              })
              .join('')
      return (
        docxSectionSpacer() +
        docxFixedTable([omCol, objCol], labelRow + headerRow + bodyRows) +
        docxSectionSpacer()
      )
    }
    case 'site-safety-plan': {
      const half = ICS202_DOCX_COL.half
      const yesMark = docxCheckboxMark(block.required)
      const noMark = docxCheckboxMark(!block.required)
      const row =
        `<w:tr>` +
        docxCell(
          half,
          docxLabelParagraph('8. Site Safety Plan Required:') +
            docxParagraph(`Yes ${yesMark}   No ${noMark}`, { size: 16 })
        ) +
        docxCell(
          half,
          docxLabelParagraph('9. Site Safety Plan located at:') +
            docxMultilineParagraphs(block.location, 16)
        ) +
        `</w:tr>`
      return docxSectionSpacer() + docxFixedTable([half, half], row) + docxSectionSpacer()
    }
    case 'prepared-by': {
      const col = ICS202_DOCX_COL.quarter
      const cols = [col, col, col, col]
      const fields = [
        { label: 'Name:', value: block.fields.name },
        { label: 'Position Title:', value: block.fields.positionTitle },
        { label: 'Signature:', value: block.fields.signature },
        { label: 'Date/Time:', value: block.fields.dateTime },
      ]
      const labelRow = `<w:tr>${docxCell(ICS202_DOCX_CONTENT_WIDTH, docxLabelParagraph(block.label), {
        gridSpan: 4,
      })}</w:tr>`
      const fieldRow =
        `<w:tr>` +
        fields
          .map((field) =>
            docxCell(
              col,
              docxLabelParagraph(field.label) + docxMultilineParagraphs(field.value, 16),
              { mar: 'tight' }
            )
          )
          .join('') +
        `</w:tr>`
      return (
        docxSectionSpacer() +
        docxFixedTable(cols, labelRow + fieldRow) +
        docxSectionSpacer()
      )
    }
    case 'page-break':
      return `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`
    case 'page-footer': {
      const rightTab = ICS202_DOCX_CONTENT_WIDTH * 20
      return (
        `<w:p><w:pPr><w:tabs>` +
        `<w:tab w:val="clear" w:pos="0"/>` +
        `<w:tab w:val="right" w:pos="${rightTab}"/>` +
        `</w:tabs><w:spacing w:before="240" w:after="0"/></w:pPr>` +
        `<w:r><w:rPr><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr>` +
        `<w:t xml:space="preserve">${escapeXml(block.left)}\t${escapeXml(block.pageLabel)}</w:t></w:r></w:p>`
      )
    }
    default:
      return ''
  }
}

export function buildIcs202DocxXml(blocks: Ics202ExportLayoutBlock[]): string {
  const body = blocks.map(renderLayoutBlockDocx).join('')
  const sectPr =
    `<w:sectPr>` +
    `<w:pgSz w:w="${ICS202_DOCX_PAGE.widthDxa}" w:h="${ICS202_DOCX_PAGE.heightDxa}"/>` +
    `<w:pgMar w:top="${ICS202_DOCX_PAGE.marginDxa}" w:right="${ICS202_DOCX_PAGE.marginDxa}" w:bottom="${ICS202_DOCX_PAGE.marginDxa}" w:left="${ICS202_DOCX_PAGE.marginDxa}" w:header="0" w:footer="0" w:gutter="0"/>` +
    `</w:sectPr>`
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:body>${body}${sectPr}</w:body></w:document>`
  )
}

/** Sanity check: every section table uses fixed content width in dxa. */
export function assertIcs202DocxLayoutConsistency(documentXml: string): void {
  if (!documentXml.includes(`w:w="${ICS202_DOCX_CONTENT_WIDTH}" w:type="dxa"`)) {
    throw new Error('ICS-202 DOCX export missing full-width section tables.')
  }
  if (documentXml.includes('<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"')) {
    throw new Error('ICS-202 DOCX export still contains legacy pct-width tables.')
  }
}
