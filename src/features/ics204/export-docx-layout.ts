import { ICS204_FORM_TITLE_LINES } from '@/features/ics204/constants'
import type {
  Ics204HeaderCell,
  Ics204PersonnelRow,
  Ics204SignatureFooter,
} from '@/features/ics204/export-layout'
import type {
  Ics204PhysicalPage,
  Ics204PhysicalPageSegment,
} from '@/features/ics204/export-pagination'

export const ICS204_DOCX_PAGE = {
  widthDxa: 12240,
  heightDxa: 15840,
  marginDxa: 720,
} as const

/** Space reserved below body for repeating header (title + boxes 1–3). */
export const ICS204_DOCX_HEADER_RESERVE_DXA = 1440

/** Space reserved above bottom margin for signature footer table + ICS expiration line. */
export const ICS204_DOCX_FOOTER_RESERVE_DXA = 2160

export const ICS204_DOCX_CONTENT_WIDTH =
  ICS204_DOCX_PAGE.widthDxa - ICS204_DOCX_PAGE.marginDxa * 2

function allocateProportionalWidths(ratios: readonly number[], totalWidth: number): number[] {
  const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0)
  const widths = ratios.map((ratio) => Math.floor((ratio / ratioSum) * totalWidth))
  const allocated = widths.reduce((sum, width) => sum + width, 0)
  widths[widths.length - 1] += totalWidth - allocated
  return widths
}

const [
  ICS204_DOCX_RESOURCE_ID_COL,
  ICS204_DOCX_RESOURCE_LEADER_COL,
  ICS204_DOCX_RESOURCE_PERSON_COUNT_COL,
  ICS204_DOCX_RESOURCE_CONTACT_COL,
  ICS204_DOCX_RESOURCE_REPORTING_COL,
  ICS204_DOCX_RESOURCE_204A_COL,
] = allocateProportionalWidths([20, 14, 8, 18, 32, 8], ICS204_DOCX_CONTENT_WIDTH)

export const ICS204_DOCX_COL = {
  third: ICS204_DOCX_CONTENT_WIDTH / 3,
  half: ICS204_DOCX_CONTENT_WIDTH / 2,
  resourceId: ICS204_DOCX_RESOURCE_ID_COL,
  resourceLeader: ICS204_DOCX_RESOURCE_LEADER_COL,
  resourcePersonCount: ICS204_DOCX_RESOURCE_PERSON_COUNT_COL,
  resourceContact: ICS204_DOCX_RESOURCE_CONTACT_COL,
  resourceReporting: ICS204_DOCX_RESOURCE_REPORTING_COL,
  resource204A: ICS204_DOCX_RESOURCE_204A_COL,
} as const

export const ICS204_DOCX_RESOURCE_COL_WIDTHS = [
  ICS204_DOCX_COL.resourceId,
  ICS204_DOCX_COL.resourceLeader,
  ICS204_DOCX_COL.resourcePersonCount,
  ICS204_DOCX_COL.resourceContact,
  ICS204_DOCX_COL.resourceReporting,
  ICS204_DOCX_COL.resource204A,
] as const

export const ICS204_PDF_PAGE = {
  widthPt: 612,
  heightPt: 792,
  marginPt: 36,
} as const

export const ICS204_PDF_CONTENT_WIDTH =
  ICS204_PDF_PAGE.widthPt - ICS204_PDF_PAGE.marginPt * 2

/** Signature footer table height in PDF footer (see renderSignatureFooterTableDocx). */
export const ICS204_PDF_SIGNATURE_FOOTER_HEIGHT_PT = 56

/** Baseline Y for ICS expiration line above bottom margin. */
export const ICS204_PDF_ICS_LINE_Y_PT = ICS204_PDF_PAGE.marginPt + 14

/** Top edge Y of the fixed signature footer table on each PDF page. */
export function ics204PdfSignatureFooterTopY(): number {
  return (
    ICS204_PDF_ICS_LINE_Y_PT +
    7 +
    8 +
    ICS204_PDF_SIGNATURE_FOOTER_HEIGHT_PT
  )
}

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
  opts: { bold?: boolean; size?: number; center?: boolean; after?: number; keepNext?: boolean } = {}
) {
  const size = opts.size ?? 18
  const after = opts.after ?? 40
  const jc = opts.center ? `<w:jc w:val="center"/>` : ''
  const bold = opts.bold ? `<w:b/>` : ''
  const keepNext = opts.keepNext ? `<w:keepNext/>` : ''
  return (
    `<w:p><w:pPr><w:spacing w:before="0" w:after="${after}"/>${keepNext}${jc}</w:pPr>` +
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
  return docxParagraph(label, { bold: true, size: 16, keepNext: true })
}

function docxCantSplitRow(cellsXml: string): string {
  return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cellsXml}</w:tr>`
}

/** Single full-width bordered section: label + body stay in one unbreakable row/cell. */
function docxSectionBox(label: string, bodyXml: string): string {
  return docxFixedTable(
    [ICS204_DOCX_CONTENT_WIDTH],
    docxCantSplitRow(
      docxCell(ICS204_DOCX_CONTENT_WIDTH, docxLabelParagraph(label) + bodyXml)
    )
  )
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

function docxLinesParagraphs(lines: string[], size = 18): string {
  if (lines.length === 0) {
    return docxParagraph(' ', { size })
  }
  return lines.map((line) => docxParagraph(line.length > 0 ? line : ' ', { size })).join('')
}

function renderHeaderContentDocx(headerCells: Ics204HeaderCell[]): string {
  const title = ICS204_FORM_TITLE_LINES.map((line, index) =>
    docxParagraph(line, {
      bold: index === ICS204_FORM_TITLE_LINES.length - 1,
      center: true,
      size: index === ICS204_FORM_TITLE_LINES.length - 1 ? 20 : 16,
    })
  ).join('')

  const col = ICS204_DOCX_COL.third
  const cells = headerCells
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
    title +
    docxSectionSpacer() +
    docxFixedTable([col, col, col], `<w:tr>${cells}</w:tr>`) +
    docxSectionSpacer()
  )
}

function renderSignatureBoxCellDocx(
  widthDxa: number,
  box: Ics204SignatureFooter['preparedBy']
): string {
  return docxCell(
    widthDxa,
    docxLabelParagraph(box.label) +
      docxLabelParagraph('Name:') +
      docxMultilineParagraphs(box.name, 16) +
      docxLabelParagraph('Date/Time:') +
      docxMultilineParagraphs(box.dateTime, 16),
    { mar: 'tight' }
  )
}

function renderSignatureFooterTableDocx(
  footer: Ics204SignatureFooter,
  opts: { includeOuterSpacers?: boolean } = {}
): string {
  const col = ICS204_DOCX_COL.third
  const cols = [col, col, col]
  const row =
    `<w:tr>` +
    renderSignatureBoxCellDocx(col, footer.preparedBy) +
    renderSignatureBoxCellDocx(col, footer.reviewedPsc) +
    renderSignatureBoxCellDocx(col, footer.reviewedOsc) +
    `</w:tr>`
  const table = docxFixedTable(cols, row)
  if (opts.includeOuterSpacers) {
    return docxSectionSpacer() + table + docxSectionSpacer()
  }
  return table
}

function renderIcsExpirationLineDocx(footerLeft: string): string {
  return (
    `<w:p><w:pPr><w:spacing w:before="80" w:after="0"/></w:pPr>` +
    `<w:r><w:rPr><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(footerLeft)}</w:t></w:r></w:p>`
  )
}

function padPersonnelRows(rows: Ics204PersonnelRow[]): Ics204PersonnelRow[] {
  const padded = [...rows]
  while (padded.length < 3) {
    padded.push({ position: ' ', name: ' ', contact: ' ' })
  }
  return padded.slice(0, 3)
}

function renderPersonnelTableDocx(
  segment: Extract<Ics204PhysicalPageSegment, { kind: 'personnel-table' }>
): string {
  const col = ICS204_DOCX_COL.third
  const cols = [col, col, col]
  const headerRow = docxCantSplitRow(
    docxCell(col, docxParagraph('Position', { bold: true, size: 14 })) +
      docxCell(col, docxParagraph('Name', { bold: true, size: 14 })) +
      docxCell(col, docxParagraph('Contact Information', { bold: true, size: 14 }))
  )
  const dataRows = padPersonnelRows(segment.rows)
    .map((row) =>
      docxCantSplitRow(
        docxCell(col, docxParagraph(row.position || ' ', { size: 16 })) +
          docxCell(col, docxParagraph(row.name || ' ', { size: 16 })) +
          docxCell(col, docxMultilineParagraphs(row.contact || ' ', 16))
      )
    )
    .join('')
  const innerTable = docxFixedTable(cols, headerRow + dataRows)
  return (
    docxSectionSpacer() +
    docxFixedTable(
      [ICS204_DOCX_CONTENT_WIDTH],
      docxCantSplitRow(
        docxCell(ICS204_DOCX_CONTENT_WIDTH, docxLabelParagraph(segment.label) + innerTable)
      )
    ) +
    docxSectionSpacer()
  )
}

function renderResourcesTableDocx(
  segment: Extract<Ics204PhysicalPageSegment, { kind: 'resources-table' }>
): string {
  const cols = [...ICS204_DOCX_RESOURCE_COL_WIDTHS]
  const headerLabels = [
    'Resource Identifier',
    'Leader',
    '# of Persons',
    'Contact Information',
    'Reporting Info / Notes',
    '204A',
  ]
  const headerRow = segment.showTableHeader
    ? docxCantSplitRow(
        cols
          .map((width, index) =>
            docxCell(width, docxParagraph(headerLabels[index], { bold: true, size: 12 }))
          )
          .join('')
      )
    : ''
  const bodyRows =
    segment.rows.length === 0
      ? docxCantSplitRow(
          cols
            .map((width, index) =>
              docxCell(
                width,
                docxParagraph(
                  index === cols.length - 1 ? docxCheckboxMark(false) : ' ',
                  { size: index === cols.length - 1 ? 16 : 16, center: index === cols.length - 1 }
                )
              )
            )
            .join('')
        )
      : segment.rows
          .map((row) =>
            docxCantSplitRow(
              docxCell(cols[0], docxMultilineParagraphs(row.resourceIdentifier || ' ', 16)) +
                docxCell(cols[1], docxMultilineParagraphs(row.leader || ' ', 16)) +
                docxCell(cols[2], docxParagraph(row.personCount || ' ', { size: 16 })) +
                docxCell(cols[3], docxMultilineParagraphs(row.contactInformation || ' ', 16)) +
                docxCell(cols[4], docxMultilineParagraphs(row.reportingInfoNotes || ' ', 16)) +
                docxCell(
                  cols[5],
                  docxParagraph(docxCheckboxMark(row.has204A), { size: 16, center: true })
                )
            )
          )
          .join('')
  const innerTable = docxFixedTable(cols, headerRow + bodyRows)
  return (
    docxSectionSpacer() +
    docxFixedTable(
      [ICS204_DOCX_CONTENT_WIDTH],
      docxCantSplitRow(
        docxCell(ICS204_DOCX_CONTENT_WIDTH, docxLabelParagraph(segment.label) + innerTable)
      )
    ) +
    docxSectionSpacer()
  )
}

function renderCommunicationsDocx(
  segment: Extract<Ics204PhysicalPageSegment, { kind: 'communications' }>
): string {
  const half = ICS204_DOCX_COL.half
  const showTable = segment.rows.length > 0
  let inner = ''

  if (showTable) {
    const headerRow = segment.showTableHeader
      ? docxCantSplitRow(
          docxCell(half, docxParagraph('Name/Function', { bold: true, size: 14 })) +
            docxCell(half, docxParagraph('Contact Information', { bold: true, size: 14 }))
        )
      : ''
    const dataRows = segment.rows
      .map((row) =>
        docxCantSplitRow(
          docxCell(half, docxMultilineParagraphs(row.nameFunction || ' ', 16)) +
            docxCell(half, docxMultilineParagraphs(row.contactInformation || ' ', 16))
        )
      )
      .join('')
    inner += docxFixedTable([half, half], headerRow + dataRows)
  }

  if (segment.showEmergency && segment.emergencyLines.length > 0) {
    const emergencyLabel = segment.continued
      ? 'Emergency Communications (Continued):'
      : 'Emergency Communications:'
    inner +=
      docxLabelParagraph(emergencyLabel) +
      docxLinesParagraphs(segment.emergencyLines, 16)
  }

  if (!showTable && inner.trim().length === 0) {
    inner = docxParagraph(' ', { size: 18 })
  }

  return (
    docxSectionSpacer() +
    docxFixedTable(
      [ICS204_DOCX_CONTENT_WIDTH],
      docxCantSplitRow(
        docxCell(ICS204_DOCX_CONTENT_WIDTH, docxLabelParagraph(segment.label) + inner)
      )
    ) +
    docxSectionSpacer()
  )
}

export function renderPhysicalPageSegmentDocx(segment: Ics204PhysicalPageSegment): string {
  switch (segment.kind) {
    case 'personnel-table':
      return renderPersonnelTableDocx(segment)
    case 'resources-table':
      return renderResourcesTableDocx(segment)
    case 'text-box':
      return (
        docxSectionSpacer() +
        docxSectionBox(segment.label, docxLinesParagraphs(segment.bodyLines, 18)) +
        docxSectionSpacer()
      )
    case 'communications':
      return renderCommunicationsDocx(segment)
    default:
      return ''
  }
}

function renderPhysicalPageBodyDocx(page: Ics204PhysicalPage): string {
  return page.segments.map(renderPhysicalPageSegmentDocx).join('')
}

function buildSectionPropertiesXml(footerRelationshipId: string, nextPage: boolean): string {
  const sectionType = nextPage ? `<w:type w:val="nextPage"/>` : ''
  return (
    `<w:sectPr>` +
    `<w:headerReference w:type="default" r:id="rId1"/>` +
    `<w:footerReference w:type="default" r:id="${footerRelationshipId}"/>` +
    `<w:pgSz w:w="${ICS204_DOCX_PAGE.widthDxa}" w:h="${ICS204_DOCX_PAGE.heightDxa}"/>` +
    `<w:pgMar w:top="${ICS204_DOCX_PAGE.marginDxa}" w:right="${ICS204_DOCX_PAGE.marginDxa}" w:bottom="${ICS204_DOCX_PAGE.marginDxa}" w:left="${ICS204_DOCX_PAGE.marginDxa}" w:header="${ICS204_DOCX_HEADER_RESERVE_DXA}" w:footer="${ICS204_DOCX_FOOTER_RESERVE_DXA}" w:gutter="0"/>` +
    sectionType +
    `</w:sectPr>`
  )
}

export function buildIcs204DocxHeaderXml(headerCells: Ics204HeaderCell[]): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    renderHeaderContentDocx(headerCells) +
    `</w:hdr>`
  )
}

export function buildIcs204DocxFooterXml(
  signatureFooter: Ics204SignatureFooter,
  footerLeft: string
): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    renderSignatureFooterTableDocx(signatureFooter) +
    renderIcsExpirationLineDocx(footerLeft) +
    `</w:ftr>`
  )
}

export function buildIcs204DocxDocumentRelsXml(footerPartCount: number): string {
  if (footerPartCount < 1) {
    throw new Error('ICS-204 DOCX export requires at least one footer part.')
  }
  const footerRelationships = Array.from({ length: footerPartCount }, (_, index) => {
    const relationshipId = index + 2
    return (
      `<Relationship Id="rId${relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer${index + 1}.xml"/>`
    )
  }).join('')
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>` +
    footerRelationships +
    `</Relationships>`
  )
}

export function buildIcs204DocxXml(pages: Ics204PhysicalPage[]): string {
  if (pages.length === 0) {
    throw new Error('ICS-204 DOCX export requires at least one page.')
  }

  const body = pages
    .map((page, index) => {
      const pageXml = renderPhysicalPageBodyDocx(page)
      const footerRelationshipId = `rId${index + 2}`
      if (index < pages.length - 1) {
        return (
          pageXml +
          `<w:p><w:pPr>${buildSectionPropertiesXml(footerRelationshipId, true)}</w:pPr></w:p>`
        )
      }
      return pageXml
    })
    .join('')

  const finalFooterRelationshipId = `rId${pages.length + 1}`
  const finalSectPr = buildSectionPropertiesXml(finalFooterRelationshipId, false)
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<w:body>${body}${finalSectPr}</w:body></w:document>`
  )
}

/** Sanity check: every section table uses fixed content width in dxa. */
export function assertIcs204DocxLayoutConsistency(documentXml: string): void {
  if (!documentXml.includes(`w:w="${ICS204_DOCX_CONTENT_WIDTH}" w:type="dxa"`)) {
    throw new Error('ICS-204 DOCX export missing full-width section tables.')
  }
  if (!documentXml.includes('<w:headerReference w:type="default" r:id="rId1"/>')) {
    throw new Error('ICS-204 DOCX export missing default header reference.')
  }
  if (!documentXml.includes('<w:footerReference w:type="default" r:id="rId')) {
    throw new Error('ICS-204 DOCX export missing footer references.')
  }
  if (documentXml.includes('ASSIGNMENT LIST ATTACHMENT (ICS 204-CG)')) {
    throw new Error('ICS-204 DOCX body should not duplicate header title content.')
  }
  if (
    documentXml.includes('9. Prepared By:') ||
    documentXml.includes('10. Reviewed by (PSC):') ||
    documentXml.includes('11. Reviewed by (OSC/ISC):')
  ) {
    throw new Error('ICS-204 signature footer must render in Word footer parts, not document body.')
  }
  if (!documentXml.includes('<w:cantSplit/>')) {
    throw new Error('ICS-204 DOCX export missing cantSplit row guards on section tables.')
  }
  if (documentXml.includes('<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"')) {
    throw new Error('ICS-204 DOCX export still contains legacy pct-width tables.')
  }
}
