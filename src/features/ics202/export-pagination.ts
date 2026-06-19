import type {
  Ics202ExportLayoutBlock,
  Ics202HeaderCell,
  Ics202LifelineOption,
  Ics202PreparedByFields,
} from '@/features/ics202/export-layout'
import type { Ics202ObjectiveRow } from '@/features/ics202/types'
import { ICS202_PDF_CONTENT_WIDTH } from '@/features/ics202/export-docx-layout'

export const ICS202_EXPORT_FOOTER_LEFT = 'ICS 202-CG (08/25)  Expiration: 08/35'

const PDF_AVG_WIDTH = 0.5
const PDF_BOLD_AVG_WIDTH = 0.53

export type Ics202PhysicalPageSegment =
  | { kind: 'lifelines'; label: string; options: Ics202LifelineOption[]; continued: boolean }
  | { kind: 'text-box'; label: string; bodyLines: string[]; continued: boolean }
  | {
      kind: 'objectives'
      label: string
      rows: Ics202ObjectiveRow[]
      continued: boolean
      showTableHeader: boolean
    }
  | {
      kind: 'site-safety-plan'
      required: boolean
      locationLines: string[]
      continued: boolean
    }
  | { kind: 'prepared-by'; label: string; fields: Ics202PreparedByFields }

export type Ics202PhysicalPage = {
  displayPageNumber: number
  totalPages: number
  headerCells: Ics202HeaderCell[]
  segments: Ics202PhysicalPageSegment[]
  footerLeft: string
}

const PAGE = {
  heightPt: 792,
  marginTopPt: 36,
  marginBottomPt: 36,
  footerHeightPt: 22,
  headerTitleHeightPt: 44,
  segmentGapPt: 6,
  contentWidthPt: ICS202_PDF_CONTENT_WIDTH,
  boxPaddingPt: 12,
  labelHeightPt: 18,
  bodyLineHeightPt: 11,
  minBodyLines: 2,
} as const

function estimateTextWidth(text: string, fontSize: number, bold: boolean): number {
  const factor = bold ? PDF_BOLD_AVG_WIDTH : PDF_AVG_WIDTH
  return text.length * fontSize * factor
}

export function wrapIcs202TextLines(
  text: string,
  maxWidth: number,
  fontSize: number,
  bold = false
): string[] {
  const paragraphs = text.split('\n')
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    const tokens = paragraph.split(/\s+/).filter(Boolean)
    if (tokens.length === 0) {
      lines.push('')
      continue
    }
    let current = ''
    for (const word of tokens) {
      const candidate = current ? `${current} ${word}` : word
      if (estimateTextWidth(candidate, fontSize, bold) <= maxWidth) {
        current = candidate
        continue
      }
      if (current) {
        lines.push(current)
        current = ''
      }
      if (estimateTextWidth(word, fontSize, bold) > maxWidth) {
        const cutAt = Math.max(
          1,
          Math.floor(maxWidth / (fontSize * (bold ? PDF_BOLD_AVG_WIDTH : PDF_AVG_WIDTH)))
        )
        let remaining = word
        while (estimateTextWidth(remaining, fontSize, bold) > maxWidth) {
          lines.push(remaining.slice(0, cutAt))
          remaining = remaining.slice(cutAt)
        }
        current = remaining
      } else {
        current = word
      }
    }
    if (current) lines.push(current)
  }
  return lines.length > 0 ? lines : [' ']
}

function splitRawLines(text: string): string[] {
  const raw = (text ?? '').split(/\r?\n/)
  if (raw.length === 0 || (raw.length === 1 && raw[0].trim() === '')) {
    return [' ']
  }
  return raw.map((line) => (line.length > 0 ? line : ' '))
}

function flattenWrappedBody(text: string, fontSize = 9): string[] {
  return splitRawLines(text).flatMap((line) =>
    wrapIcs202TextLines(line, PAGE.contentWidthPt - PAGE.boxPaddingPt * 2, fontSize, false)
  )
}

export function formatIcs202ContinuedLabel(label: string): string {
  if (label.endsWith(':')) {
    return `${label.slice(0, -1)} (Continued):`
  }
  return `${label} (Continued)`
}

function estimateHeaderRowHeight(cells: Ics202HeaderCell[]): number {
  const cellW = PAGE.contentWidthPt / cells.length
  let maxH = 36
  for (const cell of cells) {
    const valueLines = wrapIcs202TextLines(cell.value || ' ', cellW - 8, 8.5, false)
    maxH = Math.max(maxH, 12 + valueLines.length * 10 + 10)
  }
  return maxH
}

function pageSegmentCapacity(headerCells: Ics202HeaderCell[]): number {
  return (
    PAGE.heightPt -
    PAGE.marginTopPt -
    PAGE.marginBottomPt -
    PAGE.footerHeightPt -
    PAGE.headerTitleHeightPt -
    estimateHeaderRowHeight(headerCells) -
    8
  )
}

function estimateTextBoxHeight(lineCount: number): number {
  const lines = Math.max(lineCount, PAGE.minBodyLines)
  return (
    PAGE.boxPaddingPt +
    PAGE.labelHeightPt +
    4 +
    lines * PAGE.bodyLineHeightPt +
    PAGE.boxPaddingPt
  )
}

function estimateLifelinesHeight(optionCount: number): number {
  const rows = Math.ceil(optionCount / 4)
  return PAGE.boxPaddingPt + PAGE.labelHeightPt + rows * 14 + PAGE.boxPaddingPt + 4
}

function estimateObjectivesHeight(rowCount: number, showTableHeader: boolean): number {
  const rows = Math.max(rowCount, 1)
  const header = showTableHeader ? 14 : 0
  return (
    PAGE.boxPaddingPt +
    PAGE.labelHeightPt +
    header +
    rows * PAGE.bodyLineHeightPt +
    PAGE.boxPaddingPt +
    4
  )
}

function estimateSiteSafetyHeight(locationLineCount: number): number {
  const lines = Math.max(locationLineCount, 1)
  return Math.max(44, PAGE.labelHeightPt + 12 + lines * 10 + PAGE.boxPaddingPt)
}

function estimatePreparedByHeight(): number {
  return 52
}

function computeDisplayPageNumbers(physicalPageCount: number): {
  displayPageNumbers: number[]
  totalPages: number
} {
  const totalPages = Math.max(3, physicalPageCount + 1)
  const displayPageNumbers = Array.from({ length: physicalPageCount }, (_, index) => index + 2)
  return { displayPageNumbers, totalPages }
}

type PageDraft = {
  headerCells: Ics202HeaderCell[]
  segments: Ics202PhysicalPageSegment[]
  usedHeight: number
}

function createPageDraft(headerCells: Ics202HeaderCell[]): PageDraft {
  return { headerCells, segments: [], usedHeight: 0 }
}

function segmentHeight(segment: Ics202PhysicalPageSegment): number {
  switch (segment.kind) {
    case 'lifelines':
      return estimateLifelinesHeight(segment.options.length)
    case 'text-box':
      return estimateTextBoxHeight(segment.bodyLines.length)
    case 'objectives':
      return estimateObjectivesHeight(segment.rows.length, segment.showTableHeader)
    case 'site-safety-plan':
      return estimateSiteSafetyHeight(segment.locationLines.length)
    case 'prepared-by':
      return estimatePreparedByHeight()
    default:
      return 0
  }
}

function addSegmentToDraft(draft: PageDraft, segment: Ics202PhysicalPageSegment): void {
  if (draft.segments.length > 0) {
    draft.usedHeight += PAGE.segmentGapPt
  }
  draft.segments.push(segment)
  draft.usedHeight += segmentHeight(segment)
}

function remainingHeight(draft: PageDraft): number {
  return pageSegmentCapacity(draft.headerCells) - draft.usedHeight
}

function finalizeDrafts(drafts: PageDraft[]): Ics202PhysicalPage[] {
  const { displayPageNumbers, totalPages } = computeDisplayPageNumbers(drafts.length)
  return drafts.map((draft, index) => ({
    displayPageNumber: displayPageNumbers[index],
    totalPages,
    headerCells: draft.headerCells,
    segments: draft.segments,
    footerLeft: ICS202_EXPORT_FOOTER_LEFT,
  }))
}

function paginateSplittableLines(
  label: string,
  lines: string[],
  getCurrentDraft: () => PageDraft,
  startNewDraft: () => void
): void {
  let lineIndex = 0
  let isContinued = false

  while (lineIndex < lines.length) {
    let draft = getCurrentDraft()
    const overhead =
      PAGE.boxPaddingPt * 2 + PAGE.labelHeightPt + 4 + (draft.segments.length > 0 ? PAGE.segmentGapPt : 0)
    let capacity = remainingHeight(draft)
    if (capacity <= overhead + PAGE.bodyLineHeightPt) {
      startNewDraft()
      draft = getCurrentDraft()
      isContinued = true
      continue
    }

    const maxLines = Math.max(
      PAGE.minBodyLines,
      Math.floor((capacity - overhead) / PAGE.bodyLineHeightPt)
    )
    const chunk = lines.slice(lineIndex, lineIndex + maxLines)
    if (chunk.length === 0) {
      startNewDraft()
      isContinued = true
      continue
    }

    addSegmentToDraft(draft, {
      kind: 'text-box',
      label: isContinued ? formatIcs202ContinuedLabel(label) : label,
      bodyLines: chunk,
      continued: isContinued,
    })
    lineIndex += chunk.length
    isContinued = true
  }
}

function paginateObjectivesBlock(
  block: Extract<Ics202ExportLayoutBlock, { kind: 'objectives' }>,
  getCurrentDraft: () => PageDraft,
  startNewDraft: () => void
): void {
  if (block.rows.length === 0) {
    const draft = getCurrentDraft()
    const segment: Ics202PhysicalPageSegment = {
      kind: 'objectives',
      label: block.label,
      rows: [],
      continued: false,
      showTableHeader: true,
    }
    if (remainingHeight(draft) < segmentHeight(segment) + (draft.segments.length > 0 ? PAGE.segmentGapPt : 0)) {
      startNewDraft()
    }
    addSegmentToDraft(getCurrentDraft(), segment)
    return
  }

  let rowIndex = 0
  let isContinued = false

  while (rowIndex < block.rows.length) {
    let draft = getCurrentDraft()
    const label = isContinued ? formatIcs202ContinuedLabel(block.label) : block.label
    const showTableHeader = !isContinued
    const overhead =
      PAGE.boxPaddingPt * 2 +
      PAGE.labelHeightPt +
      (showTableHeader ? 14 : 0) +
      (draft.segments.length > 0 ? PAGE.segmentGapPt : 0)

    let capacity = remainingHeight(draft)
    if (capacity <= overhead + PAGE.bodyLineHeightPt) {
      startNewDraft()
      draft = getCurrentDraft()
      isContinued = true
      continue
    }

    const maxRows = Math.max(
      1,
      Math.floor((capacity - overhead) / PAGE.bodyLineHeightPt)
    )
    const chunk = block.rows.slice(rowIndex, rowIndex + maxRows)
    addSegmentToDraft(draft, {
      kind: 'objectives',
      label,
      rows: chunk,
      continued: isContinued,
      showTableHeader,
    })
    rowIndex += chunk.length
    isContinued = true
  }
}

function paginateSiteSafetyBlock(
  block: Extract<Ics202ExportLayoutBlock, { kind: 'site-safety-plan' }>,
  getCurrentDraft: () => PageDraft,
  startNewDraft: () => void
): void {
  const locationLines =
    flattenWrappedBody(block.location, 8).length > 0
      ? flattenWrappedBody(block.location, 8)
      : [' ']

  const tryAddSegment = (segment: Ics202PhysicalPageSegment): boolean => {
    const draft = getCurrentDraft()
    const gap = draft.segments.length > 0 ? PAGE.segmentGapPt : 0
    if (remainingHeight(draft) >= segmentHeight(segment) + gap) {
      addSegmentToDraft(draft, segment)
      return true
    }
    return false
  }

  const fullSegment: Ics202PhysicalPageSegment = {
    kind: 'site-safety-plan',
    required: block.required,
    locationLines,
    continued: false,
  }
  if (tryAddSegment(fullSegment)) {
    return
  }

  startNewDraft()
  if (tryAddSegment(fullSegment)) {
    return
  }

  let lineIndex = 0
  while (lineIndex < locationLines.length) {
    const isFirst = lineIndex === 0
    const draft = getCurrentDraft()
    const overhead = estimateSiteSafetyHeight(isFirst ? 1 : 1) + (draft.segments.length > 0 ? PAGE.segmentGapPt : 0)
    const maxLines = Math.max(
      1,
      Math.floor((remainingHeight(draft) - overhead) / 10)
    )
    const chunk = locationLines.slice(lineIndex, lineIndex + maxLines)
    const segment: Ics202PhysicalPageSegment = {
      kind: 'site-safety-plan',
      required: block.required,
      locationLines: chunk,
      continued: !isFirst,
    }
    if (!tryAddSegment(segment)) {
      startNewDraft()
      continue
    }
    lineIndex += chunk.length
  }
}

function paginateAtomicSegment(
  segment: Ics202PhysicalPageSegment,
  getCurrentDraft: () => PageDraft,
  startNewDraft: () => void
): void {
  let draft = getCurrentDraft()
  const height = segmentHeight(segment)
  const gap = draft.segments.length > 0 ? PAGE.segmentGapPt : 0
  if (remainingHeight(draft) < height + gap) {
    startNewDraft()
    draft = getCurrentDraft()
  }
  addSegmentToDraft(draft, segment)
}

function extractContentBlocks(blocks: Ics202ExportLayoutBlock[]): {
  headerCells: Ics202HeaderCell[]
  contentGroups: Ics202ExportLayoutBlock[][]
} {
  let headerCells: Ics202HeaderCell[] = []
  const contentGroups: Ics202ExportLayoutBlock[][] = [[]]

  for (const block of blocks) {
    if (block.kind === 'header-row') {
      headerCells = block.cells
      continue
    }
    if (block.kind === 'form-title' || block.kind === 'page-footer' || block.kind === 'page-break') {
      continue
    }
    if (block.kind === 'document-page-break') {
      contentGroups.push([])
      continue
    }
    contentGroups[contentGroups.length - 1].push(block)
  }

  if (headerCells.length === 0) {
    throw new Error('ICS-202 export layout missing header row.')
  }

  return { headerCells, contentGroups: contentGroups.filter((group) => group.length > 0) }
}

export function paginateIcs202Export(blocks: Ics202ExportLayoutBlock[]): Ics202PhysicalPage[] {
  const { headerCells, contentGroups } = extractContentBlocks(blocks)
  const drafts: PageDraft[] = []
  let currentDraft = createPageDraft(headerCells)
  drafts.push(currentDraft)

  const startNewDraft = () => {
    currentDraft = createPageDraft(headerCells)
    drafts.push(currentDraft)
  }

  const getCurrentDraft = () => currentDraft

  contentGroups.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      startNewDraft()
    }

    for (const block of group) {
      switch (block.kind) {
        case 'lifelines':
          paginateAtomicSegment(
            {
              kind: 'lifelines',
              label: block.label,
              options: block.options,
              continued: false,
            },
            getCurrentDraft,
            startNewDraft
          )
          break
        case 'text-box':
          paginateSplittableLines(
            block.label,
            flattenWrappedBody(block.body, 9),
            getCurrentDraft,
            startNewDraft
          )
          break
        case 'objectives':
          paginateObjectivesBlock(block, getCurrentDraft, startNewDraft)
          break
        case 'site-safety-plan':
          paginateSiteSafetyBlock(block, getCurrentDraft, startNewDraft)
          break
        case 'prepared-by':
          paginateAtomicSegment(
            {
              kind: 'prepared-by',
              label: block.label,
              fields: block.fields,
            },
            getCurrentDraft,
            startNewDraft
          )
          break
        default:
          break
      }
    }
  })

  return finalizeDrafts(drafts.filter((draft) => draft.segments.length > 0))
}
