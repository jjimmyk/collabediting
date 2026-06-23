/** Shared ICS 202-CG touching-box layout tokens (rendering only — pagination unchanged). */

export const ICS202_BOX_STACK = {
  /** No vertical gap between adjacent sections in preview / export renderers. */
  segmentGapPt: 0,
  sectionSpacerPt: 0,
  borderWidthPt: 0.75,
} as const

/** Preview: outer stack container classes. */
export const ICS202_PREVIEW_STACK_CLASS = 'border border-zinc-900'

/** Preview: segment row — first segment has no top border (outer stack provides it). */
export function ics202PreviewSegmentRowClass(isFirstInStack: boolean): string {
  return isFirstInStack ? '' : 'border-t border-zinc-900'
}
