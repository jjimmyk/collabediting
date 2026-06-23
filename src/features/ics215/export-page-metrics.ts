import { ICS215_BOX_STACK } from '@/features/ics215/export-box-stack'
import {
  ICS215_DOCX_CONTENT_WIDTH,
  ICS215_DOCX_FOOTER_RESERVE_DXA,
  ICS215_DOCX_HEADER_RESERVE_DXA,
  ICS215_DOCX_PAGE,
  ICS215_PDF_PAGE,
  ics215PdfPreparedByFooterTopY,
} from '@/features/ics215/export-docx-constants'

const PT_PER_DXA = 1 / 20
const DOCX_BODY_LINE_PT = 11
const DOCX_LABEL_LINE_PT = 10
const DOCX_SMALL_LINE_PT = 9
const DOCX_SECTION_SPACER_PT = 4
const DOCX_SECTION_CELL_VERTICAL_MARGIN_PT = (80 + 80) * PT_PER_DXA
const DOCX_SIGNATURE_CELL_VERTICAL_MARGIN_PT = (60 + 60) * PT_PER_DXA

export const ICS215_EXPORT_PAGE_METRICS = {
  heightPt: ICS215_DOCX_PAGE.heightDxa * PT_PER_DXA,
  marginTopPt: ICS215_DOCX_PAGE.marginDxa * PT_PER_DXA,
  marginBottomPt: ICS215_DOCX_PAGE.marginDxa * PT_PER_DXA,
  wordHeaderReservePt: ICS215_DOCX_HEADER_RESERVE_DXA * PT_PER_DXA,
  wordFooterReservePt: ICS215_DOCX_FOOTER_RESERVE_DXA * PT_PER_DXA,
  boxPaddingPt: 100 * PT_PER_DXA * 2,
  segmentGapPt: ICS215_BOX_STACK.segmentGapPt,
  sectionSpacerPt: ICS215_BOX_STACK.sectionSpacerPt,
  contentWidthPt: ICS215_DOCX_CONTENT_WIDTH * PT_PER_DXA,
  sectionTableCellMarginPt: DOCX_SECTION_CELL_VERTICAL_MARGIN_PT,
  signatureTableCellMarginPt: DOCX_SIGNATURE_CELL_VERTICAL_MARGIN_PT,
  bodyLineHeightPt: DOCX_BODY_LINE_PT,
  paginationLineHeightPt: DOCX_BODY_LINE_PT + 1,
  labelLineHeightPt: DOCX_LABEL_LINE_PT,
  smallLineHeightPt: DOCX_SMALL_LINE_PT,
  tableRowHeightPt: DOCX_BODY_LINE_PT + 4,
  tableHeaderHeightPt: DOCX_LABEL_LINE_PT + 4,
  tableSubHeaderHeightPt: DOCX_SMALL_LINE_PT + 4,
  /** Single legacy IA header row with vertical kinds/resource labels. */
  tableLegacyVerticalHeaderHeightPt: 48,
  /** Boxes 1–4 two-row header grid. */
  tableLegacyHeaderInfoHeightPt: 68,
  legacyContinuedLabelHeightPt: 12,
  minBodyLines: 1,
  pageLayoutBufferPt: 40,
  capacitySafetyFactor: 0.52,
  tinyContinuationLineThreshold: 3,
} as const

const ICS215_PDF_HEADER_ESTIMATE_PT = 148
const ICS215_PDF_PAGE_LAYOUT_BUFFER_PT = 24

export function ics215DocxPageSegmentCapacityPt(): number {
  const raw =
    ICS215_EXPORT_PAGE_METRICS.heightPt -
    ICS215_EXPORT_PAGE_METRICS.marginTopPt -
    ICS215_EXPORT_PAGE_METRICS.marginBottomPt -
    ICS215_EXPORT_PAGE_METRICS.wordHeaderReservePt -
    ICS215_EXPORT_PAGE_METRICS.wordFooterReservePt -
    ICS215_EXPORT_PAGE_METRICS.pageLayoutBufferPt
  return Math.floor(raw * ICS215_EXPORT_PAGE_METRICS.capacitySafetyFactor)
}

export function ics215PdfPageSegmentCapacityPt(): number {
  const contentTop = ICS215_PDF_PAGE.heightPt - ICS215_PDF_PAGE.marginPt
  const contentBottom = ics215PdfPreparedByFooterTopY() + ICS215_EXPORT_PAGE_METRICS.segmentGapPt
  return Math.floor(
    contentTop -
      contentBottom -
      ICS215_PDF_HEADER_ESTIMATE_PT -
      ICS215_PDF_PAGE_LAYOUT_BUFFER_PT
  )
}
