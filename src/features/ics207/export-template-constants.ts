/** US Letter landscape — ICS 207-CG org chart form. */
export const ICS207_PDF_PAGE = {
  widthPt: 792,
  heightPt: 612,
  marginPt: 24,
} as const

export const ICS207_PDF_CONTENT_WIDTH =
  ICS207_PDF_PAGE.widthPt - ICS207_PDF_PAGE.marginPt * 2

/** Box 4 — org chart screenshot area (below header row, above prepared-by footer). */
export const ICS207_PDF_CHART_BOX = {
  xPt: ICS207_PDF_PAGE.marginPt,
  yPt: 108,
  widthPt: ICS207_PDF_CONTENT_WIDTH,
  heightPt: 412,
} as const

export const ICS207_PDF_PREPARED_BY_HEIGHT_PT = 52

export const ICS207_PDF_PREPARED_BY_TOP_Y =
  ICS207_PDF_PAGE.heightPt - ICS207_PDF_PAGE.marginPt - ICS207_PDF_PREPARED_BY_HEIGHT_PT

export const ICS207_PDF_HEADER_ROW_HEIGHT_PT = 44

export const ICS207_PDF_HEADER_ROW_TOP_Y =
  ICS207_PDF_PAGE.heightPt - ICS207_PDF_PAGE.marginPt - 72

export const ICS207_PDF_TITLE_TOP_Y = ICS207_PDF_PAGE.heightPt - ICS207_PDF_PAGE.marginPt
