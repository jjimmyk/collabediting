import { ICS215_FORM_TITLE_LINES } from '@/features/ics215/constants'
import {
  ICS215_DOCX_CONTENT_WIDTH,
  ICS215_DOCX_FOOTER_RESERVE_DXA,
  ICS215_DOCX_HEADER_RESERVE_DXA,
  ICS215_DOCX_PAGE,
  ICS215_PDF_CONTENT_WIDTH,
  ICS215_PDF_PAGE,
  ICS215_PDF_PREPARED_BY_FOOTER_HEIGHT_PT,
  ICS215_PDF_ICS_LINE_Y_PT,
  ics215PdfPreparedByFooterTopY,
} from '@/features/ics215/export-docx-constants'
import {
  ICS215_LEGACY_KINDS_HEADER_LABEL,
  ICS215_LEGACY_RHN_FIELDS,
  ICS215_LEGACY_RHN_LABELS,
  ICS215_LEGACY_TOTAL_ROWS,
  buildIcs215LegacyTableColumnWidths,
  ics215LegacyKindsCol,
  ics215LegacyOverflowStartCol,
  ics215LegacyResourceStartCol,
  ics215LegacyRhnCol,
  legacyResourceCellValue,
} from '@/features/ics215/export-legacy-table'
import { buildIcs215HeaderInfoColumnWidths } from '@/features/ics215/export-legacy-geometry'
import type { Ics215HeaderCell, Ics215PreparedByFooter } from '@/features/ics215/export-layout'
import type {
  Ics215PhysicalPage,
  Ics215WorkAssignmentsTableSegment,
} from '@/features/ics215/export-pagination'
import type { Ics215ResourceColumn } from '@/features/ics215/types'

export {
  ICS215_DOCX_CONTENT_WIDTH,
  ICS215_DOCX_FOOTER_RESERVE_DXA,
  ICS215_DOCX_HEADER_RESERVE_DXA,
  ICS215_DOCX_PAGE,
  ICS215_PDF_CONTENT_WIDTH,
  ICS215_PDF_PAGE,
  ICS215_PDF_PREPARED_BY_FOOTER_HEIGHT_PT,
  ICS215_PDF_ICS_LINE_Y_PT,
  ics215PdfPreparedByFooterTopY,
} from '@/features/ics215/export-docx-constants'

function allocateProportionalWidths(ratios: readonly number[], totalWidth: number): number[] {
  const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0)
  const widths = ratios.map((ratio) => Math.floor((ratio / ratioSum) * totalWidth))
  const allocated = widths.reduce((sum, width) => sum + width, 0)
  widths[widths.length - 1] += totalWidth - allocated
  return widths
}

export function buildIcs215WorkTableColumnWidths(resourceColumns: Ics215ResourceColumn[]): number[] {
  return buildIcs215LegacyTableColumnWidths(resourceColumns)
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
  opts: {
    bold?: boolean
    size?: number
    center?: boolean
    right?: boolean
    after?: number
    keepNext?: boolean
    vertical?: boolean
  } = {}
) {
  const size = opts.size ?? 18
  const after = opts.after ?? 40
  const jc = opts.center
    ? `<w:jc w:val="center"/>`
    : opts.right
      ? `<w:jc w:val="right"/>`
      : ''
  const bold = opts.bold ? `<w:b/>` : ''
  const keepNext = opts.keepNext ? `<w:keepNext/>` : ''
  const textDirection = opts.vertical ? `<w:textDirection w:val="tbRl"/>` : ''
  return (
    `<w:p><w:pPr><w:spacing w:before="0" w:after="${after}"/>${keepNext}${jc}${textDirection}</w:pPr>` +
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
  opts: {
    gridSpan?: number
    mar?: 'normal' | 'tight'
    vMerge?: 'restart' | 'continue'
    vertical?: boolean
    vAlign?: 'top' | 'center'
  } = {}
): string {
  const gridSpan = opts.gridSpan ? `<w:gridSpan w:val="${opts.gridSpan}"/>` : ''
  const vMerge = opts.vMerge ? `<w:vMerge w:val="${opts.vMerge}"/>` : ''
  const textDirection = opts.vertical ? `<w:textDirection w:val="tbRl"/>` : ''
  const vAlign = opts.vAlign ?? (opts.vertical ? 'center' : 'top')
  return (
    `<w:tc><w:tcPr>` +
    `<w:tcW w:w="${widthDxa}" w:type="dxa"/>` +
    gridSpan +
    vMerge +
    textDirection +
    `<w:vAlign w:val="${vAlign}"/>` +
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

  const colWidths = buildIcs215HeaderInfoColumnWidths(ICS215_DOCX_CONTENT_WIDTH)
  const incidentName = headerCells[0]
  const incidentLocation = headerCells[1]
  const dateTimePrepared = headerCells[2]

  const row1 =
    docxCell(
      colWidths[0],
      docxLabelParagraph(incidentName.label) + docxMultilineParagraphs(incidentName.value || ' ', 18),
      { mar: 'tight' }
    ) +
    docxCell(
      colWidths[1],
      docxLabelParagraph(dateTimePrepared.label) +
        docxMultilineParagraphs(dateTimePrepared.value || ' ', 18),
      { mar: 'tight' }
    ) +
    docxCell(
      colWidths[2],
      docxLabelParagraph('4. Operational Period (Date/Time):') +
        docxMultilineParagraphs(operationalPeriod || ' ', 18),
      { mar: 'tight' }
    )

  const row2 =
    docxCell(
      colWidths[0],
      docxLabelParagraph(incidentLocation.label) +
        docxMultilineParagraphs(incidentLocation.value || ' ', 18),
      { mar: 'tight' }
    ) +
    docxCell(colWidths[1] + colWidths[2], docxParagraph(' ', { size: 10 }), { gridSpan: 2 })

  return title + docxFixedTable(colWidths, docxCantSplitRow(row1) + docxCantSplitRow(row2))
}

function renderPreparedByFooterTableDocx(footer: Ics215PreparedByFooter): string {
  return docxParagraph(' ', { size: 4, after: 0 })
}

function renderPreparedByInlineRowDocx(
  cols: number[],
  overflowStart: number,
  footer: Ics215PreparedByFooter
): string {
  const overflowWidth = cols.slice(overflowStart).reduce((sum, width) => sum + width, 0)
  const leftWidth = cols.slice(0, overflowStart).reduce((sum, width) => sum + width, 0)
  return docxCantSplitRow(
    docxCell(leftWidth, docxParagraph(' ', { size: 12 }), { gridSpan: overflowStart }) +
      docxCell(
        overflowWidth,
        docxLabelParagraph(footer.label) +
          docxLabelParagraph('Name:') +
          docxMultilineParagraphs(footer.name, 16) +
          docxLabelParagraph('Position/Title:') +
          docxMultilineParagraphs(footer.positionTitle, 16) +
          docxLabelParagraph('Date/Time:') +
          docxMultilineParagraphs(footer.dateTime, 16),
        { gridSpan: 4, mar: 'tight' }
      )
  )
}

function renderIcsExpirationLineDocx(footerLeft: string): string {
  return (
    `<w:p><w:pPr><w:spacing w:before="80" w:after="0"/></w:pPr>` +
    `<w:r><w:rPr><w:sz w:val="14"/><w:szCs w:val="14"/></w:rPr>` +
    `<w:t xml:space="preserve">${escapeXml(footerLeft)}</w:t></w:r></w:p>`
  )
}

function renderWorkAssignmentsTableDocx(
  segment: Ics215WorkAssignmentsTableSegment,
  preparedByFooter?: Ics215PreparedByFooter
): string {
  const cols = buildIcs215LegacyTableColumnWidths(segment.resourceColumns)
  const resourceCount = segment.resourceColumns.length
  const kindsCol = ics215LegacyKindsCol()
  const rhnCol = ics215LegacyRhnCol()
  const resourceStart = ics215LegacyResourceStartCol()
  const overflowStart = ics215LegacyOverflowStartCol(resourceCount)

  let headerRows = ''
  if (segment.showTableHeader) {
    let headerCells =
      docxCell(cols[0], docxParagraph('5. Division/Group/Other', { bold: true, size: 12 }), {
        vAlign: 'center',
      }) +
      docxCell(cols[1], docxParagraph('6. Work Assignments', { bold: true, size: 12 }), {
        vAlign: 'center',
      }) +
      docxCell(
        cols[kindsCol],
        docxParagraph(ICS215_LEGACY_KINDS_HEADER_LABEL, { bold: true, size: 12, vertical: true }),
        { vertical: true, mar: 'tight' }
      ) +
      docxCell(cols[rhnCol], docxParagraph(' ', { size: 10 }))
    segment.resourceColumns.forEach((column, index) => {
      headerCells += docxCell(
        cols[resourceStart + index],
        docxParagraph(column.label, { bold: true, size: 12, vertical: true }),
        { vertical: true, mar: 'tight' }
      )
    })
    headerCells +=
      docxCell(
        cols[overflowStart],
        docxParagraph('8. Overhead Position(s)', { bold: true, size: 12 }),
        { vAlign: 'center' }
      ) +
      docxCell(
        cols[overflowStart + 1],
        docxParagraph('9. Special Equipment & Supplies', { bold: true, size: 12 }),
        { vAlign: 'center' }
      ) +
      docxCell(
        cols[overflowStart + 2],
        docxParagraph('10. Reporting Location', { bold: true, size: 12 }),
        { vAlign: 'center' }
      ) +
      docxCell(
        cols[overflowStart + 3],
        docxParagraph('11. Requested Arrival Time', { bold: true, size: 12 }),
        { vAlign: 'center' }
      )
    headerRows += docxCantSplitRow(headerCells)
  }

  let bodyRows = ''
  if (segment.rows.length === 0) {
    bodyRows = docxCantSplitRow(
      cols.map((width) => docxCell(width, docxParagraph(' ', { size: 14 }))).join('')
    )
  } else {
    for (const row of segment.rows) {
      ICS215_LEGACY_RHN_FIELDS.forEach((field, rhnIndex) => {
        const isFirst = rhnIndex === 0
        let cells = ''
        if (isFirst) {
          cells +=
            docxCell(cols[0], docxMultilineParagraphs(row.assignee || ' ', 14), { vMerge: 'restart' }) +
            docxCell(cols[1], docxMultilineParagraphs(row.workAssignment || ' ', 14), { vMerge: 'restart' }) +
            docxCell(cols[kindsCol], docxParagraph(' ', { size: 14 }), { vMerge: 'restart' })
        } else {
          cells +=
            docxCell(cols[0], docxParagraph(' ', { size: 14 }), { vMerge: 'continue' }) +
            docxCell(cols[1], docxParagraph(' ', { size: 14 }), { vMerge: 'continue' }) +
            docxCell(cols[kindsCol], docxParagraph(' ', { size: 14 }), { vMerge: 'continue' })
        }
        cells += docxCell(
          cols[rhnCol],
          docxParagraph(ICS215_LEGACY_RHN_LABELS[rhnIndex], { bold: true, size: 10, right: true })
        )
        segment.resourceColumns.forEach((column, index) => {
          cells += docxCell(
            cols[resourceStart + index],
            docxParagraph(legacyResourceCellValue(row.resourceValues, column.id, field), {
              size: 14,
              center: true,
            })
          )
        })
        if (isFirst) {
          cells +=
            docxCell(cols[overflowStart], docxMultilineParagraphs(row.overheadPositions || ' ', 14), {
              vMerge: 'restart',
            }) +
            docxCell(
              cols[overflowStart + 1],
              docxMultilineParagraphs(row.specialEquipmentSupplies || ' ', 14),
              { vMerge: 'restart' }
            ) +
            docxCell(
              cols[overflowStart + 2],
              docxMultilineParagraphs(row.reportingLocation || ' ', 14),
              { vMerge: 'restart' }
            ) +
            docxCell(
              cols[overflowStart + 3],
              docxMultilineParagraphs(row.requestedArrivalTime || ' ', 14),
              { vMerge: 'restart' }
            )
        } else {
          cells +=
            docxCell(cols[overflowStart], docxParagraph(' ', { size: 14 }), { vMerge: 'continue' }) +
            docxCell(cols[overflowStart + 1], docxParagraph(' ', { size: 14 }), { vMerge: 'continue' }) +
            docxCell(cols[overflowStart + 2], docxParagraph(' ', { size: 14 }), { vMerge: 'continue' }) +
            docxCell(cols[overflowStart + 3], docxParagraph(' ', { size: 14 }), { vMerge: 'continue' })
        }
        bodyRows += docxCantSplitRow(cells)
      })
    }
  }

  let footerRows = ''
  if (segment.showResourceTotalsFooter) {
    ICS215_LEGACY_TOTAL_ROWS.forEach((totalRow) => {
      let totalCells =
        docxCell(cols[0] + cols[1], docxParagraph(totalRow.label, { bold: true, size: 12 }), {
          gridSpan: 2,
        }) +
        docxCell(cols[kindsCol], docxParagraph(' ', { size: 12 })) +
        docxCell(
          cols[rhnCol],
          docxParagraph(
            ICS215_LEGACY_RHN_LABELS[ICS215_LEGACY_RHN_FIELDS.indexOf(totalRow.field)],
            { bold: true, size: 10, right: true }
          )
        )
      segment.resourceColumns.forEach((column, index) => {
        const totals = segment.columnTotals[column.id]
        totalCells += docxCell(
          cols[resourceStart + index],
          docxParagraph(totals?.[totalRow.field]?.trim() || ' ', { size: 12, center: true })
        )
      })
      totalCells +=
        docxCell(cols[overflowStart], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[overflowStart + 1], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[overflowStart + 2], docxParagraph(' ', { size: 12 })) +
        docxCell(cols[overflowStart + 3], docxParagraph(' ', { size: 12 }))
      footerRows += docxCantSplitRow(totalCells)
    })
  }

  if (segment.showPreparedByFooter && preparedByFooter) {
    footerRows += renderPreparedByInlineRowDocx(cols, overflowStart, preparedByFooter)
  }

  const innerTable = docxFixedTable(cols, headerRows + bodyRows + footerRows)
  if (segment.label.includes('(Continued)')) {
    return docxLabelParagraph(segment.label) + innerTable
  }
  return innerTable
}

function renderPhysicalPageBodyDocx(page: Ics215PhysicalPage): string {
  return page.segments
    .map((segment) => renderWorkAssignmentsTableDocx(segment, page.preparedByFooter))
    .join('')
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
  if (!documentXml.includes('15. Prepared By:')) {
    throw new Error('ICS-215 prepared-by must render in document body.')
  }
  if (!documentXml.includes('<w:cantSplit/>')) {
    throw new Error('ICS-215 DOCX export missing cantSplit row guards on section tables.')
  }
  if (!documentXml.includes('<w:vMerge')) {
    throw new Error('ICS-215 DOCX export missing legacy vertical merge cells.')
  }
}
