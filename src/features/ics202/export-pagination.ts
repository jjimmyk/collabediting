import type {
  Ics202ExportLayoutBlock,
  Ics202HeaderCell,
  Ics202LifelineOption,
  Ics202PreparedByFields,
} from '@/features/ics202/export-layout'
import { ICS202_EXPORT_PAGE_METRICS as PAGE } from '@/features/ics202/export-page-metrics'
import type { Ics202ObjectiveRow } from '@/features/ics202/types'

export const ICS202_EXPORT_FOOTER_LEFT = 'ICS 202-CG (08/25)  Expiration: 08/35'

const PDF_AVG_WIDTH = 0.5
const PDF_BOLD_AVG_WIDTH = 0.53

export type Ics202PagePreparedBy = {
  label: string
  fields: Ics202PreparedByFields
}

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

export type Ics202PhysicalPage = {
  displayPageNumber: number
  totalPages: number
  headerCells: Ics202HeaderCell[]
  segments: Ics202PhysicalPageSegment[]
  preparedBy: Ics202PagePreparedBy
  footerLeft: string
}

type ContentGroup = {
  blocks: Ics202ExportLayoutBlock[]
  preparedBy: Ics202PagePreparedBy
}

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

function pageSegmentCapacity(_headerCells: Ics202HeaderCell[]): number {
  const raw =
    PAGE.heightPt -
    PAGE.marginTopPt -
    PAGE.marginBottomPt -
    PAGE.wordHeaderReservePt -
    PAGE.wordFooterReservePt -
    PAGE.preparedByHeightPt -
    12
  return Math.floor(raw * PAGE.capacitySafetyFactor)
}

function estimateTextBoxHeight(lineCount: number, minLines = PAGE.minBodyLines): number {
  const lines = Math.max(lineCount, minLines)
  return textBoxShellHeightPt() + lines * PAGE.bodyLineHeightPt
}

function estimateLifelinesHeight(optionCount: number): number {
  const rows = Math.ceil(optionCount / 4)
  return (
    PAGE.sectionSpacerPt * 2 +
    PAGE.tableCellMarginPt * 2 +
    PAGE.labelLineHeightPt +
    rows * PAGE.smallLineHeightPt +
    PAGE.tableCellMarginPt * 2
  )
}

function estimateObjectivesHeight(rowCount: number, showTableHeader: boolean): number {
  const rows = Math.max(rowCount, 1)
  const header = showTableHeader ? PAGE.smallLineHeightPt : 0
  return (
    PAGE.sectionSpacerPt * 2 +
    PAGE.tableCellMarginPt * 2 +
    PAGE.labelLineHeightPt +
    header +
    rows * PAGE.bodyLineHeightPt +
    PAGE.tableCellMarginPt * 2
  )
}

function estimateSiteSafetyHeight(locationLineCount: number): number {
  const lines = Math.max(locationLineCount, 1)
  return (
    PAGE.sectionSpacerPt * 2 +
    PAGE.tableCellMarginPt * 2 +
    PAGE.labelLineHeightPt * 2 +
    PAGE.smallLineHeightPt +
    lines * PAGE.bodyLineHeightPt +
    PAGE.tableCellMarginPt * 2
  )
}

function textBoxShellHeightPt(): number {
  return (
    PAGE.sectionSpacerPt * 2 +
    PAGE.tableCellMarginPt * 2 +
    PAGE.labelLineHeightPt +
    PAGE.tableCellMarginPt * 2
  )
}

function textBoxOverheadPt(draft: PageDraft): number {
  return textBoxShellHeightPt() + (draft.segments.length > 0 ? PAGE.segmentGapPt : 0)
}

function computeDisplayPageNumbers(physicalPageCount: number): {
  displayPageNumbers: number[]
  totalPages: number
} {
  const totalPages = Math.max(1, physicalPageCount)
  const displayPageNumbers = Array.from({ length: physicalPageCount }, (_, index) => index + 1)
  return { displayPageNumbers, totalPages }
}

type PageDraft = {
  headerCells: Ics202HeaderCell[]
  preparedBy: Ics202PagePreparedBy
  segments: Ics202PhysicalPageSegment[]
  usedHeight: number
}

function createPageDraft(
  headerCells: Ics202HeaderCell[],
  preparedBy: Ics202PagePreparedBy
): PageDraft {
  return { headerCells, preparedBy, segments: [], usedHeight: 0 }
}

function segmentHeight(segment: Ics202PhysicalPageSegment): number {
  switch (segment.kind) {
    case 'lifelines':
      return estimateLifelinesHeight(segment.options.length)
    case 'text-box':
      return estimateTextBoxHeight(
        segment.bodyLines.length,
        segment.continued ? 1 : PAGE.minBodyLines
      )
    case 'objectives':
      return estimateObjectivesHeight(segment.rows.length, segment.showTableHeader)
    case 'site-safety-plan':
      return estimateSiteSafetyHeight(segment.locationLines.length)
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
    preparedBy: draft.preparedBy,
    footerLeft: ICS202_EXPORT_FOOTER_LEFT,
  }))
}

function paginateSplittableLines(
  label: string,
  lines: string[],
  getCurrentDraft: () => PageDraft,
  startNewDraft: () => void
): void {
  if (lines.length === 0) {
    return
  }

  const initialDraft = getCurrentDraft()
  const initialGap = initialDraft.segments.length > 0 ? PAGE.segmentGapPt : 0
  if (estimateTextBoxHeight(lines.length) + initialGap <= remainingHeight(initialDraft)) {
    addSegmentToDraft(initialDraft, {
      kind: 'text-box',
      label,
      bodyLines: lines,
      continued: false,
    })
    return
  }

  let lineIndex = 0
  let isContinued = false

  while (lineIndex < lines.length) {
    const draft = getCurrentDraft()
    const overhead = textBoxOverheadPt(draft)
    const capacity = remainingHeight(draft)
    const remainingLines = lines.length - lineIndex

    if (capacity <= overhead + PAGE.bodyLineHeightPt) {
      startNewDraft()
      isContinued = true
      continue
    }

    const maxLines = Math.max(1, Math.floor((capacity - overhead) / PAGE.bodyLineHeightPt))
    let take = Math.min(maxLines, remainingLines)

    if (take < remainingLines) {
      const tailLines = remainingLines - take
      if (tailLines > 0 && tailLines <= PAGE.tinyContinuationLineThreshold) {
        if (remainingLines <= maxLines) {
          take = remainingLines
        } else if (take - tailLines >= 1) {
          take -= tailLines
        }
      }
    }

    if (take <= 0) {
      startNewDraft()
      isContinued = true
      continue
    }

    addSegmentToDraft(draft, {
      kind: 'text-box',
      label: isContinued ? formatIcs202ContinuedLabel(label) : label,
      bodyLines: lines.slice(lineIndex, lineIndex + take),
      continued: isContinued,
    })
    lineIndex += take
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
    const segmentLabel = isContinued ? formatIcs202ContinuedLabel(block.label) : block.label
    const showTableHeader = !isContinued
    const overhead =
      estimateObjectivesHeight(showTableHeader ? 1 : 0, showTableHeader) -
      (showTableHeader ? PAGE.bodyLineHeightPt : 0) +
      (draft.segments.length > 0 ? PAGE.segmentGapPt : 0)

    const capacity = remainingHeight(draft)
    if (capacity <= overhead + PAGE.bodyLineHeightPt) {
      startNewDraft()
      isContinued = true
      continue
    }

    const maxRows = Math.max(1, Math.floor((capacity - overhead) / PAGE.bodyLineHeightPt))
    const chunk = block.rows.slice(rowIndex, rowIndex + maxRows)
    addSegmentToDraft(draft, {
      kind: 'objectives',
      label: segmentLabel,
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
    const overhead =
      estimateSiteSafetyHeight(isFirst ? 1 : 1) + (draft.segments.length > 0 ? PAGE.segmentGapPt : 0)
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

function estimateGroupContentHeight(blocks: Ics202ExportLayoutBlock[]): number {
  let total = 0
  for (const block of blocks) {
    let height = 0
    switch (block.kind) {
      case 'lifelines':
        height = estimateLifelinesHeight(block.options.length)
        break
      case 'text-box':
        height = estimateTextBoxHeight(flattenWrappedBody(block.body, 9).length)
        break
      case 'objectives':
        height = estimateObjectivesHeight(block.rows.length, true)
        break
      case 'site-safety-plan':
        height = estimateSiteSafetyHeight(
          flattenWrappedBody(block.location, 8).length > 0
            ? flattenWrappedBody(block.location, 8).length
            : 1
        )
        break
      default:
        break
    }
    if (height > 0) {
      total += height + PAGE.segmentGapPt
    }
  }
  return total
}

function extractContentBlocks(blocks: Ics202ExportLayoutBlock[]): {
  headerCells: Ics202HeaderCell[]
  contentGroups: ContentGroup[]
} {
  let headerCells: Ics202HeaderCell[] = []
  const contentGroups: ContentGroup[] = []
  let currentBlocks: Ics202ExportLayoutBlock[] = []
  let currentPreparedBy: Ics202PagePreparedBy | null = null

  const pushGroup = () => {
    if (currentBlocks.length === 0 || !currentPreparedBy) {
      return
    }
    contentGroups.push({
      blocks: currentBlocks,
      preparedBy: currentPreparedBy,
    })
    currentBlocks = []
    currentPreparedBy = null
  }

  for (const block of blocks) {
    if (block.kind === 'header-row') {
      headerCells = block.cells
      continue
    }
    if (block.kind === 'form-title' || block.kind === 'page-footer' || block.kind === 'page-break') {
      continue
    }
    if (block.kind === 'document-page-break') {
      pushGroup()
      continue
    }
    if (block.kind === 'prepared-by') {
      currentPreparedBy = { label: block.label, fields: block.fields }
      continue
    }
    currentBlocks.push(block)
  }

  pushGroup()

  if (headerCells.length === 0) {
    throw new Error('ICS-202 export layout missing header row.')
  }
  if (contentGroups.length === 0) {
    throw new Error('ICS-202 export layout missing content groups.')
  }

  return { headerCells, contentGroups }
}

export function assertIcs202PaginationInvariants(pages: Ics202PhysicalPage[]): void {
  if (pages.length === 0) {
    throw new Error('ICS-202 export produced no pages.')
  }
  pages.forEach((page, index) => {
    if (page.headerCells.length !== 3) {
      throw new Error('ICS-202 export page missing header cells.')
    }
    if (!page.preparedBy?.label) {
      throw new Error('ICS-202 export page missing prepared-by chrome.')
    }
    if (page.displayPageNumber !== index + 1) {
      throw new Error('ICS-202 export page numbering is out of sequence.')
    }
    if (page.totalPages !== pages.length) {
      throw new Error('ICS-202 export total page count mismatch.')
    }
  })
}

export function paginateIcs202Export(blocks: Ics202ExportLayoutBlock[]): Ics202PhysicalPage[] {
  const { headerCells, contentGroups } = extractContentBlocks(blocks)
  const drafts: PageDraft[] = []
  let currentPreparedBy = contentGroups[0].preparedBy
  let currentDraft = createPageDraft(headerCells, currentPreparedBy)
  drafts.push(currentDraft)

  const startNewDraft = () => {
    currentDraft = createPageDraft(headerCells, currentPreparedBy)
    drafts.push(currentDraft)
  }

  const getCurrentDraft = () => currentDraft

  contentGroups.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      currentPreparedBy = group.preparedBy
      const neededHeight = estimateGroupContentHeight(group.blocks)
      if (remainingHeight(currentDraft) < neededHeight) {
        startNewDraft()
      } else {
        currentDraft.preparedBy = group.preparedBy
      }
    } else {
      currentPreparedBy = group.preparedBy
      currentDraft.preparedBy = group.preparedBy
    }

    for (const block of group.blocks) {
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
        default:
          break
      }
    }
  })

  const pages = finalizeDrafts(drafts.filter((draft) => draft.segments.length > 0))
  assertIcs202PaginationInvariants(pages)
  return pages
}
