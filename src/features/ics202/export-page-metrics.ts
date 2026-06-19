import { ICS202_DOCX_CONTENT_WIDTH, ICS202_DOCX_PAGE } from '@/features/ics202/export-docx-layout'

/** Twentieths of a point (dxa) → PDF points for pagination estimates aligned with DOCX layout. */
const PT_PER_DXA = 1 / 20

export const ICS202_EXPORT_PAGE_METRICS = {
  heightPt: ICS202_DOCX_PAGE.heightDxa * PT_PER_DXA,
  marginTopPt: ICS202_DOCX_PAGE.marginDxa * PT_PER_DXA,
  marginBottomPt: ICS202_DOCX_PAGE.marginDxa * PT_PER_DXA,
  footerHeightPt: 28,
  preparedByHeightPt: 58,
  headerTitleHeightPt: 46,
  segmentGapPt: 4,
  contentWidthPt: ICS202_DOCX_CONTENT_WIDTH * PT_PER_DXA,
  boxPaddingPt: 10,
  labelHeightPt: 16,
  bodyLineHeightPt: 12,
  minBodyLines: 1,
} as const
