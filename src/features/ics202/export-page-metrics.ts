import {
  ICS202_DOCX_CONTENT_WIDTH,
  ICS202_DOCX_FOOTER_RESERVE_DXA,
  ICS202_DOCX_HEADER_RESERVE_DXA,
  ICS202_DOCX_PAGE,
} from '@/features/ics202/export-docx-layout'

/** Twentieths of a point (dxa/twips) → PDF points for pagination estimates aligned with DOCX layout. */
const PT_PER_DXA = 1 / 20

/** DOCX body paragraph: sz 18 (9pt) + w:after 40 twips (2pt) ≈ 11pt per line. */
const DOCX_BODY_LINE_PT = 11
/** DOCX label paragraph: sz 16 (8pt bold) + w:after 40 twips (2pt) ≈ 10pt. */
const DOCX_LABEL_LINE_PT = 10
/** Checkbox / small text row in lifelines grid. */
const DOCX_SMALL_LINE_PT = 10
/** docxSectionSpacer() — sz 4 paragraph with no after spacing. */
const DOCX_SECTION_SPACER_PT = 4
/** Section table cells use normal w:tcMar (80 dxa top + bottom). */
const DOCX_SECTION_CELL_VERTICAL_MARGIN_PT = (80 + 80) * PT_PER_DXA
/** Prepared-by table cells use tight w:tcMar (60 dxa top + bottom). */
const DOCX_PREPARED_BY_CELL_VERTICAL_MARGIN_PT = (60 + 60) * PT_PER_DXA

export const ICS202_EXPORT_PAGE_METRICS = {
  heightPt: ICS202_DOCX_PAGE.heightDxa * PT_PER_DXA,
  marginTopPt: ICS202_DOCX_PAGE.marginDxa * PT_PER_DXA,
  marginBottomPt: ICS202_DOCX_PAGE.marginDxa * PT_PER_DXA,
  wordHeaderReservePt: ICS202_DOCX_HEADER_RESERVE_DXA * PT_PER_DXA,
  /** Footer reserve includes prepared-by table + ICS expiration line (see buildIcs202DocxFooterXml). */
  wordFooterReservePt: ICS202_DOCX_FOOTER_RESERVE_DXA * PT_PER_DXA,
  /** Horizontal inset inside normal section table cells (w:tcMar left+right 100 dxa each). */
  boxPaddingPt: 100 * PT_PER_DXA * 2,
  segmentGapPt: DOCX_SECTION_SPACER_PT,
  sectionSpacerPt: DOCX_SECTION_SPACER_PT,
  contentWidthPt: ICS202_DOCX_CONTENT_WIDTH * PT_PER_DXA,
  sectionTableCellMarginPt: DOCX_SECTION_CELL_VERTICAL_MARGIN_PT,
  preparedByTableCellMarginPt: DOCX_PREPARED_BY_CELL_VERTICAL_MARGIN_PT,
  bodyLineHeightPt: DOCX_BODY_LINE_PT,
  /** Per-line estimate when splitting text boxes across pages. */
  paginationLineHeightPt: DOCX_BODY_LINE_PT + 1,
  labelLineHeightPt: DOCX_LABEL_LINE_PT,
  smallLineHeightPt: DOCX_SMALL_LINE_PT,
  minBodyLines: 1,
  /** Header chrome that extends below the Word header margin reserve. */
  pageLayoutBufferPt: 40,
  /** Applied after buffer so each logical page fills one sheet without soft breaks. */
  capacitySafetyFactor: 0.52,
  /** Merge tail continuation chunks with ≤ this many lines when possible. */
  tinyContinuationLineThreshold: 3,
} as const
