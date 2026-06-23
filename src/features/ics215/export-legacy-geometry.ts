import type { Ics215ResourceColumn } from '@/features/ics215/types'
import { buildIcs215LegacyTableColumnWidths, ics215LegacyKindsCol, ics215LegacyOverflowStartCol } from '@/features/ics215/export-legacy-table'

/** Header boxes 1–4 column ratios: left stack (1+2) | date/time (3) | operational period (4). */
export const ICS215_HEADER_INFO_COL_RATIOS = [26, 12, 14] as const

export const ICS215_PREPARED_BY_FOOTER_HEIGHT_PT = 44

export type Ics215LegacyBorderAfter = 'none' | 'resource-zone' | 'full'

export function buildIcs215HeaderInfoColumnWidths(totalWidth: number): number[] {
  const ratioSum = ICS215_HEADER_INFO_COL_RATIOS.reduce((sum, ratio) => sum + ratio, 0)
  const widths = ICS215_HEADER_INFO_COL_RATIOS.map((ratio) =>
    Math.floor((ratio / ratioSum) * totalWidth)
  )
  widths[widths.length - 1] += totalWidth - widths.reduce((sum, width) => sum + width, 0)
  return widths
}

/** Left edge X of the resource-zone (kinds column) within a legacy work table. */
export function legacyResourceZoneLeftX(
  columnWidths: number[],
  leftX: number
): number {
  let x = leftX
  for (let col = 0; col < ics215LegacyKindsCol(); col += 1) {
    x += columnWidths[col]
  }
  return x
}

/** Right edge X of the resource-zone (last resource column) within a legacy work table. */
export function legacyResourceZoneRightX(
  columnWidths: number[],
  leftX: number,
  resourceCount: number
): number {
  const overflowStart = ics215LegacyOverflowStartCol(resourceCount)
  let x = leftX
  for (let col = 0; col < overflowStart; col += 1) {
    x += columnWidths[col]
  }
  return x
}

/** X-range for boxes 8–11 (overflow columns) — used for box 15 placement. */
export function legacyOverflowColumnRange(
  columnWidths: number[],
  leftX: number,
  resourceCount: number
): { leftX: number; width: number } {
  const start = ics215LegacyOverflowStartCol(resourceCount)
  let x = leftX
  for (let col = 0; col < start; col += 1) {
    x += columnWidths[col]
  }
  let width = 0
  for (let col = start; col < start + 4; col += 1) {
    width += columnWidths[col]
  }
  return { leftX: x, width }
}

/** Width of combined assignee + work columns — aligns header left stack with boxes 5+6. */
export function legacyAssigneeWorkWidth(
  resourceColumns: Ics215ResourceColumn[],
  totalWidth: number
): number {
  const cols = buildIcs215LegacyTableColumnWidths(resourceColumns)
  const docxTotal = cols.reduce((sum, width) => sum + width, 0)
  const assigneeWork = cols[0] + cols[1]
  return Math.floor((assigneeWork / docxTotal) * totalWidth)
}

/** Rotated label vertical extent ≈ horizontal text width at 90°. */
export function estimateLegacyRotatedLabelHeight(
  text: string,
  fontSize: number,
  minHeight = 44
): number {
  const trimmed = text.trim()
  const approxWidth = trimmed.length * fontSize * 0.53
  return Math.max(minHeight, approxWidth + 10)
}
