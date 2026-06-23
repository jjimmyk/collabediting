/** Shared ICS 215-CG touching-box layout tokens (rendering only — pagination unchanged). */

export const ICS215_BOX_STACK = {
  /** No vertical gap between adjacent segments in preview / export renderers. */
  segmentGapPt: 0,
  sectionSpacerPt: 0,
  borderWidthPt: 0.75,
} as const

export const ICS215_PREVIEW_STACK_CLASS = 'border border-zinc-900'

export function ics215PreviewSegmentRowClass(isFirstInStack: boolean): string {
  return isFirstInStack ? '' : 'border-t border-zinc-900'
}
