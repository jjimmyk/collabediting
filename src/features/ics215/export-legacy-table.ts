import type { Ics215ResourceColumn, Ics215ResourceValue } from '@/features/ics215/types'

/** Matches ICS215_DOCX_CONTENT_WIDTH (kept here to avoid circular imports). */
const ICS215_LEGACY_DOCX_CONTENT_WIDTH = 12240 - 720 * 2

export const ICS215_LEGACY_RHN_FIELDS = ['required', 'have', 'need'] as const
export type Ics215LegacyRhnField = (typeof ICS215_LEGACY_RHN_FIELDS)[number]

export const ICS215_LEGACY_RHN_LABELS = ['REQ', 'HAVE', 'NEED'] as const

export const ICS215_LEGACY_KINDS_HEADER_LABEL = '7. Kinds of Resources'

export const ICS215_LEGACY_TOTAL_ROWS = [
  { field: 'required' as const, label: '12. Total Resources Required' },
  { field: 'have' as const, label: '13. Total Resources Have on Hand' },
  { field: 'need' as const, label: '14. Total Resources Need to Order' },
] as const

export const ICS215_LEGACY_ASSIGNMENT_ROWS_PER_BLOCK = ICS215_LEGACY_RHN_FIELDS.length

export const ICS215_LEGACY_TOTAL_FOOTER_ROWS = ICS215_LEGACY_TOTAL_ROWS.length

function allocateProportionalWidths(ratios: readonly number[], totalWidth: number): number[] {
  const ratioSum = ratios.reduce((sum, ratio) => sum + ratio, 0)
  const widths = ratios.map((ratio) => Math.floor((ratio / ratioSum) * totalWidth))
  const allocated = widths.reduce((sum, width) => sum + width, 0)
  widths[widths.length - 1] += totalWidth - allocated
  return widths
}

/** Legacy IA: assignee | work | kinds (vertical) | R/H/N | one col per resource | overhead × 4 */
export function buildIcs215LegacyTableColumnWidths(
  resourceColumns: Ics215ResourceColumn[]
): number[] {
  const resourceRatios = resourceColumns.map(() => 2)
  return allocateProportionalWidths(
    [10, 16, 4, 4, ...resourceRatios, 10, 12, 12, 8],
    ICS215_LEGACY_DOCX_CONTENT_WIDTH
  )
}

export function ics215LegacyKindsCol(): number {
  return 2
}

export function ics215LegacyRhnCol(): number {
  return 3
}

export function ics215LegacyResourceStartCol(): number {
  return 4
}

export function ics215LegacyOverflowStartCol(resourceCount: number): number {
  return ics215LegacyResourceStartCol() + resourceCount
}

export function ics215LegacyTotalColCount(resourceCount: number): number {
  return ics215LegacyOverflowStartCol(resourceCount) + 4
}

export function legacyResourceCellValue(
  rowValues: Record<string, Ics215ResourceValue>,
  columnId: string,
  field: Ics215LegacyRhnField
): string {
  return rowValues[columnId]?.[field]?.trim() || ' '
}

export function estimateLegacyVerticalHeaderHeight(
  text: string,
  fontSize: number,
  minHeight = 44
): number {
  const trimmed = text.trim()
  const approxWidth = trimmed.length * fontSize * 0.53
  return Math.max(minHeight, approxWidth + 10)
}
