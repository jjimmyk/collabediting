import { ICS202_DOCX_CONTENT_WIDTH, ICS202_DOCX_PAGE } from '@/features/ics202/export-docx-layout'

/** Twentieths of a point (dxa) → PDF points for pagination estimates aligned with DOCX layout. */
const PT_PER_DXA = 1 / 20

/** DOCX body paragraph: sz 18 (9pt) + w:after 40 twips (2pt) ≈ 11pt per line. */
const DOCX_BODY_LINE_PT = 11
/** DOCX label paragraph: sz 16 (8pt bold) + w:after 40 twips (2pt) ≈ 10pt. */
const DOCX_LABEL_LINE_PT = 10
/** Checkbox / small text row in lifelines grid. */
const DOCX_SMALL_LINE_PT = 10
/** docxSectionSpacer() — sz 4 paragraph with no after spacing. */
const DOCX_SECTION_SPACER_PT = 4
/** Table cell top+bottom margins (tight w:tcMar 60 dxa ≈ 3pt each). */
const DOCX_TABLE_CELL_MARGIN_PT = 6

export const ICS202_EXPORT_PAGE_METRICS = {
  heightPt: ICS202_DOCX_PAGE.heightDxa * PT_PER_DXA,
  marginTopPt: ICS202_DOCX_PAGE.marginDxa * PT_PER_DXA,
  marginBottomPt: ICS202_DOCX_PAGE.marginDxa * PT_PER_DXA,
  /** Matches buildIcs202DocxXml headerReserveDxa (1440 twips). */
  wordHeaderReservePt: 72,
  /** Matches buildIcs202DocxXml footerReserveDxa (360 twips). */
  wordFooterReservePt: 18,
  preparedByHeightPt: 72,
  /** Horizontal inset inside section table cells (tight w:tcMar 60 dxa). */
  boxPaddingPt: 6,
  segmentGapPt: DOCX_SECTION_SPACER_PT,
  sectionSpacerPt: DOCX_SECTION_SPACER_PT,
  contentWidthPt: ICS202_DOCX_CONTENT_WIDTH * PT_PER_DXA,
  tableCellMarginPt: DOCX_TABLE_CELL_MARGIN_PT,
  bodyLineHeightPt: DOCX_BODY_LINE_PT,
  labelLineHeightPt: DOCX_LABEL_LINE_PT,
  smallLineHeightPt: DOCX_SMALL_LINE_PT,
  minBodyLines: 1,
  /** Conservative capacity so logical pages fit one Word sheet. */
  capacitySafetyFactor: 0.92,
  /** Merge tail continuation chunks with ≤ this many lines when possible. */
  tinyContinuationLineThreshold: 3,
} as const
