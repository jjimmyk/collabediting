import {
  ICS204_DOCX_CONTENT_WIDTH,
  ICS204_DOCX_FOOTER_RESERVE_DXA,
  ICS204_DOCX_HEADER_RESERVE_DXA,
  ICS204_DOCX_PAGE,
  ICS204_PDF_PAGE,
  ics204PdfSignatureFooterTopY,
} from '@/features/ics204/export-docx-layout'

const PT_PER_DXA = 1 / 20
const DOCX_BODY_LINE_PT = 11
const DOCX_LABEL_LINE_PT = 10
const DOCX_SMALL_LINE_PT = 10
const DOCX_SECTION_SPACER_PT = 4
const DOCX_SECTION_CELL_VERTICAL_MARGIN_PT = (80 + 80) * PT_PER_DXA
const DOCX_SIGNATURE_CELL_VERTICAL_MARGIN_PT = (60 + 60) * PT_PER_DXA

export const ICS204_EXPORT_PAGE_METRICS = {
  heightPt: ICS204_DOCX_PAGE.heightDxa * PT_PER_DXA,
  marginTopPt: ICS204_DOCX_PAGE.marginDxa * PT_PER_DXA,
  marginBottomPt: ICS204_DOCX_PAGE.marginDxa * PT_PER_DXA,
  wordHeaderReservePt: ICS204_DOCX_HEADER_RESERVE_DXA * PT_PER_DXA,
  wordFooterReservePt: ICS204_DOCX_FOOTER_RESERVE_DXA * PT_PER_DXA,
  boxPaddingPt: 100 * PT_PER_DXA * 2,
  segmentGapPt: DOCX_SECTION_SPACER_PT,
  sectionSpacerPt: DOCX_SECTION_SPACER_PT,
  contentWidthPt: ICS204_DOCX_CONTENT_WIDTH * PT_PER_DXA,
  sectionTableCellMarginPt: DOCX_SECTION_CELL_VERTICAL_MARGIN_PT,
  signatureTableCellMarginPt: DOCX_SIGNATURE_CELL_VERTICAL_MARGIN_PT,
  bodyLineHeightPt: DOCX_BODY_LINE_PT,
  paginationLineHeightPt: DOCX_BODY_LINE_PT + 1,
  labelLineHeightPt: DOCX_LABEL_LINE_PT,
  smallLineHeightPt: DOCX_SMALL_LINE_PT,
  tableRowHeightPt: DOCX_BODY_LINE_PT + 4,
  tableHeaderHeightPt: DOCX_LABEL_LINE_PT + 4,
  minBodyLines: 1,
  pageLayoutBufferPt: 40,
  capacitySafetyFactor: 0.52,
  tinyContinuationLineThreshold: 3,
} as const

const ICS204_PDF_HEADER_ESTIMATE_PT = 120
const ICS204_PDF_PAGE_LAYOUT_BUFFER_PT = 24

export function ics204DocxPageSegmentCapacityPt(): number {
  const raw =
    ICS204_EXPORT_PAGE_METRICS.heightPt -
    ICS204_EXPORT_PAGE_METRICS.marginTopPt -
    ICS204_EXPORT_PAGE_METRICS.marginBottomPt -
    ICS204_EXPORT_PAGE_METRICS.wordHeaderReservePt -
    ICS204_EXPORT_PAGE_METRICS.wordFooterReservePt -
    ICS204_EXPORT_PAGE_METRICS.pageLayoutBufferPt
  return Math.floor(raw * ICS204_EXPORT_PAGE_METRICS.capacitySafetyFactor)
}

export function ics204PdfPageSegmentCapacityPt(): number {
  const contentTop = ICS204_PDF_PAGE.heightPt - ICS204_PDF_PAGE.marginPt
  const contentBottom = ics204PdfSignatureFooterTopY() + ICS204_EXPORT_PAGE_METRICS.segmentGapPt
  return Math.floor(
    contentTop -
      contentBottom -
      ICS204_PDF_HEADER_ESTIMATE_PT -
      ICS204_PDF_PAGE_LAYOUT_BUFFER_PT
  )
}
