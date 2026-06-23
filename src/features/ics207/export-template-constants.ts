/** US Letter landscape — ICS 207-CG org chart form. */
export const ICS207_PDF_PAGE = {
  widthPt: 792,
  heightPt: 612,
  marginPt: 24,
} as const

export const ICS207_PDF_CONTENT_WIDTH =
  ICS207_PDF_PAGE.widthPt - ICS207_PDF_PAGE.marginPt * 2

export const ICS207_PDF_TITLE_HEIGHT_PT = 56
export const ICS207_PDF_HEADER_ROW_HEIGHT_PT = 44
export const ICS207_PDF_PREPARED_BY_HEIGHT_PT = 48
export const ICS207_PDF_CHART_INNER_PADDING_PT = 6

/** Box 5 footer — bottom of page. */
export const ICS207_PDF_FOOTER_BOTTOM_Y = ICS207_PDF_PAGE.marginPt

export const ICS207_PDF_FOOTER_TOP_Y =
  ICS207_PDF_FOOTER_BOTTOM_Y + ICS207_PDF_PREPARED_BY_HEIGHT_PT

/** Header row (boxes 1–3) sits directly above box 4. */
export const ICS207_PDF_HEADER_ROW_BOTTOM_Y =
  ICS207_PDF_PAGE.heightPt -
  ICS207_PDF_PAGE.marginPt -
  ICS207_PDF_TITLE_HEIGHT_PT -
  ICS207_PDF_HEADER_ROW_HEIGHT_PT

export const ICS207_PDF_HEADER_ROW_TOP_Y =
  ICS207_PDF_HEADER_ROW_BOTTOM_Y + ICS207_PDF_HEADER_ROW_HEIGHT_PT

export const ICS207_PDF_TITLE_TOP_Y = ICS207_PDF_PAGE.heightPt - ICS207_PDF_PAGE.marginPt

/** Box 4 — org chart area between header row and prepared-by footer. */
export const ICS207_PDF_CHART_BOX = {
  xPt: ICS207_PDF_PAGE.marginPt,
  yPt: ICS207_PDF_FOOTER_TOP_Y,
  widthPt: ICS207_PDF_CONTENT_WIDTH,
  heightPt: ICS207_PDF_HEADER_ROW_BOTTOM_Y - ICS207_PDF_FOOTER_TOP_Y,
} as const

/** @deprecated Use ICS207_PDF_FOOTER_TOP_Y / footer box geometry. */
export const ICS207_PDF_PREPARED_BY_TOP_Y =
  ICS207_PDF_FOOTER_TOP_Y + ICS207_PDF_PREPARED_BY_HEIGHT_PT

/** Box 4 width:height for HTML preview parity. */
export const ICS207_PDF_CHART_ASPECT_RATIO =
  ICS207_PDF_CHART_BOX.widthPt / ICS207_PDF_CHART_BOX.heightPt

export function assertIcs207PdfGeometry(): void {
  const chartTop = ICS207_PDF_CHART_BOX.yPt + ICS207_PDF_CHART_BOX.heightPt
  if (chartTop !== ICS207_PDF_HEADER_ROW_BOTTOM_Y) {
    throw new Error('ICS-207 chart box must end where the header row begins.')
  }
  if (ICS207_PDF_CHART_BOX.yPt !== ICS207_PDF_FOOTER_TOP_Y) {
    throw new Error('ICS-207 chart box must sit on top of the prepared-by footer.')
  }
  if (ICS207_PDF_CHART_BOX.heightPt <= 400) {
    throw new Error('ICS-207 chart box height is unexpectedly small.')
  }
}

assertIcs207PdfGeometry()
