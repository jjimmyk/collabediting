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
