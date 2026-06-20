import { ICS215_FORM_TITLE_LINES } from '@/features/ics215/constants'
import type { Ics215HeaderCell, Ics215PreparedByFooter } from '@/features/ics215/export-layout'
import type {
  Ics215PhysicalPage,
  Ics215WorkAssignmentsTableSegment,
} from '@/features/ics215/export-pagination'
import type { Ics215ResourceColumn } from '@/features/ics215/types'

export const ICS215_DOCX_PAGE = {
  widthDxa: 12240,
  heightDxa: 15840,
  marginDxa: 720,
} as const

export const ICS215_DOCX_HEADER_RESERVE_DXA = 1680

export const ICS215_DOCX_FOOTER_RESERVE_DXA = 1800

export const ICS215_DOCX_CONTENT_WIDTH =
  ICS215_DOCX_PAGE.widthDxa - ICS215_DOCX_PAGE.marginDxa * 2

export const ICS215_PDF_PAGE = {
  widthPt: 612,
  heightPt: 792,
  marginPt: 36,
} as const

export const ICS215_PDF_CONTENT_WIDTH =
  ICS215_PDF_PAGE.widthPt - ICS215_PDF_PAGE.marginPt * 2

export const ICS215_PDF_PREPARED_BY_FOOTER_HEIGHT_PT = 52

export const ICS215_PDF_ICS_LINE_Y_PT = ICS215_PDF_PAGE.marginPt + 14

export function ics215PdfPreparedByFooterTopY(): number {
  return (
    ICS215_PDF_ICS_LINE_Y_PT +
    7 +
    8 +
    ICS215_PDF_PREPARED_BY_FOOTER_HEIGHT_PT
  )
}

function allocateProportionalWidths(ratios: readonly number[], totalWidth: number): number[] {
  const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0)
  const widths = ratios.map((ratio) => Math.floor((ratio / ratioSum) * totalWidth))
  const allocated = widths.reduce((sum, width) => sum + width, 0)
  widths[widths.length - 1] += totalWidth - allocated
  return widths
}

export function buildIcs215WorkTableColumnWidths(resourceColumns: Ics215ResourceColumn[]): number[] {
  const resourceRatios = resourceColumns.flatMap(() => [3, 3, 3])
  return allocateProportionalWidths(
    [10, 16, ...resourceRatios, 10, 12, 12, 8],
    ICS215_DOCX_CONTENT_WIDTH
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

function renderHeaderContentDocx(
  headerCells: Ics215HeaderCell[],
  operationalPeriod: string
): string {
  const title = ICS215_FORM_TITLE_LINES.map((line, index) =>
    docxParagraph(line, {
      bold: index === ICS215_FORM_TITLE_LINES.length - 1,
      center: true,
      size: index === ICS215_FORM_TITLE_LINES.length - 1 ? 20 : 16,
    })
  ).join('')

  const col = ICS215_DOCX_CONTENT_WIDTH / 3
  const cells = headerCells
    .map((cell) =>
      docxCell(
        col,
        docxLabelParagraph(cell.label) + docxMultilineParagraphs(cell.value || ' ', 18),
        { mar: 'tight' }
      )
    )
    .join('')

  const operationalPeriodRow = docxCantSplitRow(
    docxCell(
      ICS215_DOCX_CONTENT_WIDTH,
      docxLabelParagraph('4. Operational Period (Date/Time):') +
        docxMultilineParagraphs(operationalPeriod || ' ', 18),
      { mar: 'tight' }
    )
  )

  return (
    title +
    docxSectionSpacer() +
    docxFixedTable([col, col, col], `<w:tr>${cells}</w:tr>`) +
    docxSectionSpacer() +
    docxFixedTable([ICS215_DOCX_CONTENT_WIDTH], operationalPeriodRow) +
    docxSectionSpacer()
  )
}

function renderPreparedByFooterTableDocx(footer: Ics215PreparedByFooter): string {
  const col = ICS215_DOCX_CONTENT_WIDTH / 3
  const cols = [col, col, col]
  const row =
    `<w:tr>` +
    docxCell(
      col,
      docxLabelParagraph(footer.label) +
        docxLabelParagraph('Name:') +
        docxMultilineParagraphs(footer.name, 16),
      { mar: 'tight' }
    ) +
    docxCell(
      col,
      docxLabelParagraph('Position/Title:') + docxMultilineParagraphs(footer.positionTitle, 16),
      { mar: 'tight' }
    ) +
    docxCell(
      col,
      docxLabelParagraph('Date/Time:') + docxMultilineParagraphs(footer.dateTime, 16),
      { mar: 'tight' }
    ) +
    `</w:tr>`
  return docxSectionSpacer() + docxFixedTable(cols, row) + docxSectionSpacer()
}

function renderIcsExpirationLineDocx(footerLeft: string): string {
  return (
    `<w:p><w:pPr><w:spacing w:before="80" w:after="0"/></w:pPr>` +
    `<w:r><w:rPr><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(footerLeft)}</w:t></w:r></w:p>`
  )
}

function resourceCellValue(
  rowValues: Record<string, { required: string; have: string; need: string }>,
  columnId: string,
  field: 'required' | 'have' | 'need'
): string {
  return rowValues[columnId]?.[field]?.trim() || ' '
}

function renderWorkAssignmentsTableDocx(segment: Ics215WorkAssignmentsTableSegment): string {
  const cols = buildIcs215WorkTableColumnWidths(segment.resourceColumns)
  const resourceCount = segment.resourceColumns.length
  const fixedStart = 2
  const fixedEndStart = fixedStart + resourceCount * 3

  let headerRows = ''
  if (segment.showTableHeader) {
    const resourceSpanWidth =
      resourceCount > 0
        ? cols.slice(fixedStart, fixedEndStart).reduce((sum, width) => sum + width, 0)
        : 0
    let mainHeaderCells =
      docxCell(cols[0], docxParagraph('5. Division/Group/Other', { bold: true, size: 12 })) +
      docxCell(cols[1], docxParagraph('6. Work Assignments', { bold: true, size: 12 }))
    if (resourceCount > 0) {
      mainHeaderCells += docxCell(
        resourceSpanWidth,
        docxParagraph('7. Kinds of Resources', { bold: true, size: 12, center: true }),
        { gridSpan: resourceCount * 3 }
      )
    }
    mainHeaderCells +=
      docxCell(cols[fixedEndStart], docxParagraph('8. Overhead Position(s)', { bold: true, size: 12 })) +
      docxCell(cols[fixedEndStart + 1], docxParagraph('9. Special Equipment & Supplies', { bold: true, size: 12 })) +
      docxCell(cols[fixedEndStart + 2], docxParagraph('10. Reporting Location', { bold: true, size: 12 })) +
      docxCell(cols[fixedEndStart + 3], docxParagraph('11. Requested Arrival Time', { bold: true, size: 12 }))
    headerRows += docxCantSplitRow(mainHeaderCells)

    let subHeaderCells =
      docxCell(cols[0], docxParagraph(' ', { size: 10 })) +
      docxCell(cols[1], docxParagraph(' ', { size: 10 }))
    segment.resourceColumns.forEach((column, index) => {
      const baseIndex = fixedStart + index * 3
      const spanWidth = cols[baseIndex] + cols[baseIndex + 1] + cols[baseIndex + 2]
      subHeaderCells += docxCell(
        spanWidth,
        docxLabelParagraph(column.label) +
          docxParagraph('Req', { bold: true, size: 10, center: true, after: 0 }) +
          docxParagraph('Have', { bold: true, size: 10, center: true, after: 0 }) +
          docxParagraph('Need', { bold: true, size: 10, center: true, after: 0 }),
        { gridSpan: 3 }
      )
    })
    subHeaderCells +=
      docxCell(cols[fixedEndStart], docxParagraph(' ', { size: 10 })) +
      docxCell(cols[fixedEndStart + 1], docxParagraph(' ', { size: 10 })) +
      docxCell(cols[fixedEndStart + 2], docxParagraph(' ', { size: 10 })) +
      docxCell(cols[fixedEndStart + 3], docxParagraph(' ', { size: 10 }))
    headerRows += docxCantSplitRow(subHeaderCells)
  }

  const bodyRows =
    segment.rows.length === 0
      ? docxCantSplitRow(cols.map((width) => docxCell(width, docxParagraph(' ', { size: 14 }))).join(''))
      : segment.rows
          .map((row) => {
            let cells =
              docxCell(cols[0], docxMultilineParagraphs(row.assignee || ' ', 14)) +
              docxCell(cols[1], docxMultilineParagraphs(row.workAssignment || ' ', 14))
            segment.resourceColumns.forEach((column, index) => {
              const baseIndex = fixedStart + index * 3
              cells +=
                docxCell(
                  cols[baseIndex],
                  docxParagraph(resourceCellValue(row.resourceValues, column.id, 'required'), {
                    size: 14,
                    center: true,
                  })
                ) +
                docxCell(
                  cols[baseIndex + 1],
                  docxParagraph(resourceCellValue(row.resourceValues, column.id, 'have'), {
                    size: 14,
                    center: true,
                  })
                ) +
                docxCell(
                  cols[baseIndex + 2],
                  docxParagraph(resourceCellValue(row.resourceValues, column.id, 'need'), {
                    size: 14,
                    center: true,
                  })
                )
            })
            cells +=
              docxCell(cols[fixedEndStart], docxMultilineParagraphs(row.overheadPositions || ' ', 14)) +
              docxCell(
                cols[fixedEndStart + 1],
                docxMultilineParagraphs(row.specialEquipmentSupplies || ' ', 14)
              ) +
              docxCell(cols[fixedEndStart + 2], docxMultilineParagraphs(row.reportingLocation || ' ', 14)) +
              docxCell(
                cols[fixedEndStart + 3],
                docxMultilineParagraphs(row.requestedArrivalTime || ' ', 14)
              )
            return docxCantSplitRow(cells)
          })
          .join('')

  let footerRows = ''
  if (segment.showColumnTotals) {
    let totalCells =
      docxCell(cols[0], docxParagraph('Column Totals', { bold: true, size: 12 })) +
      docxCell(cols[1], docxParagraph(' ', { size: 12 }))
    segment.resourceColumns.forEach((column, index) => {
      const baseIndex = fixedStart + index * 3
      const totals = segment.columnTotals[column.id]
      totalCells +=
        docxCell(
          cols[baseIndex],
          docxParagraph(totals?.required?.trim() || ' ', { size: 12, center: true })
        ) +
        docxCell(
          cols[baseIndex + 1],
          docxParagraph(totals?.have?.trim() || ' ', { size: 12, center: true })
        ) +
        docxCell(
          cols[baseIndex + 2],
          docxParagraph(totals?.need?.trim() || ' ', { size: 12, center: true })
        )
    })
    totalCells +=
      docxCell(cols[fixedEndStart], docxParagraph(' ', { size: 12 })) +
      docxCell(cols[fixedEndStart + 1], docxParagraph(' ', { size: 12 })) +
      docxCell(cols[fixedEndStart + 2], docxParagraph(' ', { size: 12 })) +
      docxCell(cols[fixedEndStart + 3], docxParagraph(' ', { size: 12 }))
    footerRows += docxCantSplitRow(totalCells)
  }

  if (segment.showGrandTotals && segment.grandTotals) {
    const labelSpan = cols[0] + cols[1]
    const resourceSpanWidth =
      resourceCount > 0
        ? cols.slice(fixedStart, fixedEndStart).reduce((sum, width) => sum + width, 0)
        : cols[fixedEndStart]
    const valueSpan = resourceCount > 0 ? resourceCount * 3 : 1
    footerRows += docxCantSplitRow(
      docxCell(
        labelSpan,
        docxParagraph('12. Total Resources Required', { bold: true, size: 12 }),
        { gridSpan: 2 }
      ) +
        docxCell(
          resourceSpanWidth,
          docxParagraph(segment.grandTotals.totalResourcesRequired || ' ', {
            size: 12,
            center: true,
          }),
          { gridSpan: valueSpan }
        ) +
        docxCell(cols[fixedEndStart], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[fixedEndStart + 1], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[fixedEndStart + 2], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[fixedEndStart + 3], docxParagraph(' ', { size: 12 }))
    )
    footerRows += docxCantSplitRow(
      docxCell(
        labelSpan,
        docxParagraph('13. Total Resources Have on Hand', { bold: true, size: 12 }),
        { gridSpan: 2 }
      ) +
        docxCell(
          resourceSpanWidth,
          docxParagraph(segment.grandTotals.totalResourcesHaveOnHand || ' ', {
            size: 12,
            center: true,
          }),
          { gridSpan: valueSpan }
        ) +
        docxCell(cols[fixedEndStart], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[fixedEndStart + 1], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[fixedEndStart + 2], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[fixedEndStart + 3], docxParagraph(' ', { size: 12 }))
    )
    footerRows += docxCantSplitRow(
      docxCell(
        labelSpan,
        docxParagraph('14. Total Resources Need to Order', { bold: true, size: 12 }),
        { gridSpan: 2 }
      ) +
        docxCell(
          resourceSpanWidth,
          docxParagraph(segment.grandTotals.totalResourcesNeedToOrder || ' ', {
            size: 12,
            center: true,
          }),
          { gridSpan: valueSpan }
        ) +
        docxCell(cols[fixedEndStart], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[fixedEndStart + 1], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[fixedEndStart + 2], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[fixedEndStart + 3], docxParagraph(' ', { size: 12 }))
    )
  }

  const innerTable = docxFixedTable(cols, headerRows + bodyRows + footerRows)
  return (
    docxSectionSpacer() +
    docxFixedTable(
      [ICS215_DOCX_CONTENT_WIDTH],
      docxCantSplitRow(
        docxCell(ICS215_DOCX_CONTENT_WIDTH, docxLabelParagraph(segment.label) + innerTable)
      )
    ) +
    docxSectionSpacer()
  )
}

function renderPhysicalPageBodyDocx(page: Ics215PhysicalPage): string {
  return page.segments.map(renderWorkAssignmentsTableDocx).join('')
}

function buildSectionPropertiesXml(footerRelationshipId: string, nextPage: boolean): string {
  const sectionType = nextPage ? `<w:type w:val="nextPage"/>` : ''
  return (
    `<w:sectPr>` +
    `<w:headerReference w:type="default" r:id="rId1"/>` +
    `<w:footerReference w:type="default" r:id="${footerRelationshipId}"/>` +
    `<w:pgSz w:w="${ICS215_DOCX_PAGE.widthDxa}" w:h="${ICS215_DOCX_PAGE.heightDxa}"/>` +
    `<w:pgMar w:top="${ICS215_DOCX_PAGE.marginDxa}" w:right="${ICS215_DOCX_PAGE.marginDxa}" w:bottom="${ICS215_DOCX_PAGE.marginDxa}" w:left="${ICS215_DOCX_PAGE.marginDxa}" w:header="${ICS215_DOCX_HEADER_RESERVE_DXA}" w:footer="${ICS215_DOCX_FOOTER_RESERVE_DXA}" w:gutter="0"/>` +
    sectionType +
    `</w:sectPr>`
  )
}

export function buildIcs215DocxHeaderXml(
  headerCells: Ics215HeaderCell[],
  operationalPeriod: string
): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    renderHeaderContentDocx(headerCells, operationalPeriod) +
    `</w:hdr>`
  )
}

export function buildIcs215DocxFooterXml(
  preparedByFooter: Ics215PreparedByFooter,
  footerLeft: string
): string {
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    renderPreparedByFooterTableDocx(preparedByFooter) +
    renderIcsExpirationLineDocx(footerLeft) +
    `</w:ftr>`
  )
}

export function buildIcs215DocxDocumentRelsXml(footerPartCount: number): string {
  if (footerPartCount < 1) {
    throw new Error('ICS-215 DOCX export requires at least one footer part.')
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

export function buildIcs215DocxXml(pages: Ics215PhysicalPage[]): string {
  if (pages.length === 0) {
    throw new Error('ICS-215 DOCX export requires at least one page.')
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

export function assertIcs215DocxLayoutConsistency(documentXml: string): void {
  if (!documentXml.includes(`w:w="${ICS215_DOCX_CONTENT_WIDTH}" w:type="dxa"`)) {
    throw new Error('ICS-215 DOCX export missing full-width section tables.')
  }
  if (!documentXml.includes('<w:headerReference w:type="default" r:id="rId1"/>')) {
    throw new Error('ICS-215 DOCX export missing default header reference.')
  }
  if (!documentXml.includes('<w:footerReference w:type="default" r:id="rId')) {
    throw new Error('ICS-215 DOCX export missing footer references.')
  }
  if (documentXml.includes('OPERATIONAL PLANNING WORKSHEET (ICS 215-CG)')) {
    throw new Error('ICS-215 DOCX body should not duplicate header title content.')
  }
  if (documentXml.includes('15. Prepared By:')) {
    throw new Error('ICS-215 prepared-by footer must render in Word footer parts, not document body.')
  }
  if (!documentXml.includes('<w:cantSplit/>')) {
    throw new Error('ICS-215 DOCX export missing cantSplit row guards on section tables.')
  }
}
