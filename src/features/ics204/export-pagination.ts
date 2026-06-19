import { ICS204_EXPORT_FOOTER_LEFT } from '@/features/ics204/constants'
import type {
  Ics204CommunicationRow,
  Ics204ExportLayoutBlock,
  Ics204HeaderCell,
  Ics204PersonnelRow,
  Ics204ResourceExportRow,
  Ics204SignatureFooter,
} from '@/features/ics204/export-layout'
import {
  ICS204_EXPORT_PAGE_METRICS as PAGE,
  ics204DocxPageSegmentCapacityPt,
  ics204PdfPageSegmentCapacityPt,
} from '@/features/ics204/export-page-metrics'

export type Ics204ExportPaginationTarget = 'docx' | 'pdf'

export type Ics204ExportPaginationOptions = {
  target?: Ics204ExportPaginationTarget
}

let activePageSegmentCapacity = ics204DocxPageSegmentCapacityPt()

const PDF_AVG_WIDTH = 0.5
const PDF_BOLD_AVG_WIDTH = 0.53

export type Ics204PhysicalPageSegment =
  | { kind: 'personnel-table'; label: string; rows: Ics204PersonnelRow[] }
  | {
      kind: 'resources-table'
      label: string
      rows: Ics204ResourceExportRow[]
      continued: boolean
      showTableHeader: boolean
    }
  | { kind: 'text-box'; label: string; bodyLines: string[]; continued: boolean }
  | {
      kind: 'communications'
      label: string
      rows: Ics204CommunicationRow[]
      emergencyLines: string[]
      continued: boolean
      showTableHeader: boolean
      showEmergency: boolean
    }

export type Ics204PhysicalPage = {
  displayPageNumber: number
  totalPages: number
  headerCells: Ics204HeaderCell[]
  segments: Ics204PhysicalPageSegment[]
  signatureFooter: Ics204SignatureFooter
  footerLeft: string
}

type PageDraft = {
  headerCells: Ics204HeaderCell[]
  segments: Ics204PhysicalPageSegment[]
  usedHeight: number
}

function estimateTextWidth(text: string, fontSize: number, bold: boolean): number {
  const factor = bold ? PDF_BOLD_AVG_WIDTH : PDF_AVG_WIDTH
  return text.length * fontSize * factor
}

export function wrapIcs204TextLines(
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
    wrapIcs204TextLines(line, PAGE.contentWidthPt - PAGE.boxPaddingPt * 2, fontSize, false)
  )
}

export function formatIcs204ContinuedLabel(label: string): string {
  if (label.endsWith(':')) {
    return `${label.slice(0, -1)} (Continued):`
  }
  return `${label} (Continued)`
}

function remainingHeight(draft: PageDraft): number {
  return activePageSegmentCapacity - draft.usedHeight
}

function estimatePersonnelTableHeight(rowCount: number): number {
  const rows = Math.max(rowCount, 1)
  return (
    PAGE.sectionSpacerPt * 2 +
    PAGE.sectionTableCellMarginPt * 2 +
    PAGE.labelLineHeightPt +
    PAGE.tableHeaderHeightPt +
    rows * PAGE.tableRowHeightPt
  )
}

function estimateResourcesTableHeight(rowCount: number, showTableHeader: boolean): number {
  const rows = Math.max(rowCount, 1)
  const header = showTableHeader ? PAGE.tableHeaderHeightPt + PAGE.sectionTableCellMarginPt : 0
  return (
    PAGE.sectionSpacerPt * 2 +
    PAGE.sectionTableCellMarginPt * 2 +
    PAGE.labelLineHeightPt +
    header +
    rows * PAGE.tableRowHeightPt
  )
}

function estimateTextBoxHeight(lineCount: number, minLines = PAGE.minBodyLines): number {
  const lines = Math.max(lineCount, minLines)
  return (
    PAGE.sectionSpacerPt * 2 +
    PAGE.sectionTableCellMarginPt * 2 +
    PAGE.labelLineHeightPt +
    lines * PAGE.paginationLineHeightPt
  )
}

function estimateCommunicationsHeight(
  rowCount: number,
  emergencyLineCount: number,
  showTableHeader: boolean,
  showEmergency: boolean
): number {
  const rows = Math.max(rowCount, 1)
  const header = showTableHeader ? PAGE.tableHeaderHeightPt + PAGE.sectionTableCellMarginPt : 0
  const tableRows = rowCount > 0 ? rows * PAGE.tableRowHeightPt : 0
  const emergency =
    showEmergency && emergencyLineCount > 0
      ? PAGE.smallLineHeightPt + emergencyLineCount * PAGE.paginationLineHeightPt
      : 0
  return (
    PAGE.sectionSpacerPt * 2 +
    PAGE.sectionTableCellMarginPt * 2 +
    PAGE.labelLineHeightPt +
    header +
    tableRows +
    emergency
  )
}

function textBoxShellHeightPt(): number {
  return (
    PAGE.sectionSpacerPt * 2 +
    PAGE.sectionTableCellMarginPt * 2 +
    PAGE.labelLineHeightPt
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

function createPageDraft(headerCells: Ics204HeaderCell[]): PageDraft {
  return { headerCells, segments: [], usedHeight: 0 }
}

function segmentHeight(segment: Ics204PhysicalPageSegment): number {
  switch (segment.kind) {
    case 'personnel-table':
      return estimatePersonnelTableHeight(segment.rows.length)
    case 'resources-table':
      return estimateResourcesTableHeight(segment.rows.length, segment.showTableHeader)
    case 'text-box':
      return estimateTextBoxHeight(
        segment.bodyLines.length,
        segment.continued ? 1 : PAGE.minBodyLines
      )
    case 'communications':
      return estimateCommunicationsHeight(
        segment.rows.length,
        segment.emergencyLines.length,
        segment.showTableHeader,
        segment.showEmergency
      )
    default:
      return 0
  }
}

function addSegmentToDraft(draft: PageDraft, segment: Ics204PhysicalPageSegment): void {
  if (draft.segments.length > 0) {
    draft.usedHeight += PAGE.segmentGapPt
  }
  draft.segments.push(segment)
  draft.usedHeight += segmentHeight(segment)
}

function finalizeDrafts(
  drafts: PageDraft[],
  signatureFooter: Ics204SignatureFooter
): Ics204PhysicalPage[] {
  const { displayPageNumbers, totalPages } = computeDisplayPageNumbers(drafts.length)
  return drafts.map((draft, index) => ({
    displayPageNumber: displayPageNumbers[index],
    totalPages,
    headerCells: draft.headerCells,
    segments: draft.segments,
    signatureFooter,
    footerLeft: ICS204_EXPORT_FOOTER_LEFT,
  }))
}

function textBoxSegmentHeight(lineCount: number, continued: boolean): number {
  return estimateTextBoxHeight(lineCount, continued ? 1 : PAGE.minBodyLines)
}

function canFitSegment(draft: PageDraft, segment: Ics204PhysicalPageSegment): boolean {
  const gap = draft.segments.length > 0 ? PAGE.segmentGapPt : 0
  return remainingHeight(draft) >= segmentHeight(segment) + gap
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

  let lineIndex = 0

  while (lineIndex < lines.length) {
    const isContinued = lineIndex > 0
    const draft = getCurrentDraft()
    const gap = draft.segments.length > 0 ? PAGE.segmentGapPt : 0
    const overhead = textBoxOverheadPt(draft)
    const capacity = remainingHeight(draft)
    const remainingLines = lines.length - lineIndex

    if (capacity <= overhead + PAGE.paginationLineHeightPt) {
      startNewDraft()
      continue
    }

    const maxLines = Math.max(
      1,
      Math.floor((capacity - overhead) / PAGE.paginationLineHeightPt)
    )
    let take = Math.min(maxLines, remainingLines)

    while (take > 0 && textBoxSegmentHeight(take, isContinued) + gap > capacity) {
      take -= 1
    }

    if (take < remainingLines) {
      while (
        take > 1 &&
        remainingLines - take > 0 &&
        remainingLines - take <= PAGE.tinyContinuationLineThreshold &&
        textBoxSegmentHeight(remainingLines, isContinued) + gap > capacity
      ) {
        take -= 1
      }
    }

    while (take > 0 && textBoxSegmentHeight(take, isContinued) + gap > capacity) {
      take -= 1
    }

    if (take <= 0) {
      startNewDraft()
      continue
    }

    addSegmentToDraft(draft, {
      kind: 'text-box',
      label: isContinued ? formatIcs204ContinuedLabel(label) : label,
      bodyLines: lines.slice(lineIndex, lineIndex + take),
      continued: isContinued,
    })
    lineIndex += take
  }
}

function paginatePersonnelTableBlock(
  block: Extract<Ics204ExportLayoutBlock, { kind: 'personnel-table' }>,
  getCurrentDraft: () => PageDraft,
  startNewDraft: () => void
): void {
  const segment: Ics204PhysicalPageSegment = {
    kind: 'personnel-table',
    label: block.label,
    rows: block.rows,
  }
  if (!canFitSegment(getCurrentDraft(), segment)) {
    startNewDraft()
  }
  addSegmentToDraft(getCurrentDraft(), segment)
}

function paginateResourcesTableBlock(
  block: Extract<Ics204ExportLayoutBlock, { kind: 'resources-table' }>,
  getCurrentDraft: () => PageDraft,
  startNewDraft: () => void
): void {
  if (block.rows.length === 0) {
    const draft = getCurrentDraft()
    const segment: Ics204PhysicalPageSegment = {
      kind: 'resources-table',
      label: block.label,
      rows: [],
      continued: false,
      showTableHeader: true,
    }
    if (!canFitSegment(draft, segment)) {
      startNewDraft()
    }
    addSegmentToDraft(getCurrentDraft(), segment)
    return
  }

  let rowIndex = 0

  while (rowIndex < block.rows.length) {
    const isContinued = rowIndex > 0
    const draft = getCurrentDraft()
    const segmentLabel = isContinued ? formatIcs204ContinuedLabel(block.label) : block.label
    const showTableHeader = !isContinued
    const minRows = 1
    let maxRows = block.rows.length - rowIndex

    for (let take = maxRows; take >= minRows; take -= 1) {
      const candidate: Ics204PhysicalPageSegment = {
        kind: 'resources-table',
        label: segmentLabel,
        rows: block.rows.slice(rowIndex, rowIndex + take),
        continued: isContinued,
        showTableHeader,
      }
      if (canFitSegment(draft, candidate)) {
        addSegmentToDraft(draft, candidate)
        rowIndex += take
        maxRows = 0
        break
      }
    }

    if (maxRows !== 0) {
      startNewDraft()
    }
  }
}

function communicationsEmergencyShellHeightPt(): number {
  return (
    PAGE.sectionSpacerPt * 2 +
    PAGE.sectionTableCellMarginPt * 2 +
    PAGE.labelLineHeightPt +
    PAGE.smallLineHeightPt
  )
}

function communicationsEmergencyOverheadPt(draft: PageDraft): number {
  return communicationsEmergencyShellHeightPt() + (draft.segments.length > 0 ? PAGE.segmentGapPt : 0)
}

function communicationsEmergencySegmentHeight(lineCount: number): number {
  return estimateCommunicationsHeight(0, lineCount, false, true)
}

function paginateCommunicationsEmergency(
  label: string,
  emergencyLines: string[],
  getCurrentDraft: () => PageDraft,
  startNewDraft: () => void,
  afterTableSplit = false
): void {
  if (emergencyLines.length === 0) {
    return
  }

  let lineIndex = 0

  while (lineIndex < emergencyLines.length) {
    const isContinued = afterTableSplit || lineIndex > 0
    const draft = getCurrentDraft()
    const gap = draft.segments.length > 0 ? PAGE.segmentGapPt : 0
    const overhead = communicationsEmergencyOverheadPt(draft)
    const capacity = remainingHeight(draft)
    const remainingLines = emergencyLines.length - lineIndex

    if (capacity <= overhead + PAGE.paginationLineHeightPt) {
      startNewDraft()
      continue
    }

    const maxLines = Math.max(
      1,
      Math.floor((capacity - overhead) / PAGE.paginationLineHeightPt)
    )
    let take = Math.min(maxLines, remainingLines)

    while (
      take > 0 &&
      communicationsEmergencySegmentHeight(take) + gap > capacity
    ) {
      take -= 1
    }

    if (take < remainingLines) {
      while (
        take > 1 &&
        remainingLines - take > 0 &&
        remainingLines - take <= PAGE.tinyContinuationLineThreshold &&
        communicationsEmergencySegmentHeight(remainingLines) + gap > capacity
      ) {
        take -= 1
      }
    }

    while (
      take > 0 &&
      communicationsEmergencySegmentHeight(take) + gap > capacity
    ) {
      take -= 1
    }

    if (take <= 0) {
      startNewDraft()
      continue
    }

    addSegmentToDraft(draft, {
      kind: 'communications',
      label: isContinued ? formatIcs204ContinuedLabel(label) : label,
      rows: [],
      emergencyLines: emergencyLines.slice(lineIndex, lineIndex + take),
      continued: isContinued,
      showTableHeader: false,
      showEmergency: true,
    })
    lineIndex += take
  }
}

function paginateCommunicationsBlock(
  block: Extract<Ics204ExportLayoutBlock, { kind: 'communications' }>,
  getCurrentDraft: () => PageDraft,
  startNewDraft: () => void
): void {
  const emergencyLines = flattenWrappedBody(block.emergency, 9)
  const hasEmergency =
    emergencyLines.length > 0 &&
    !(emergencyLines.length === 1 && emergencyLines[0].trim() === '')

  const fullSegment = (): Ics204PhysicalPageSegment => ({
    kind: 'communications',
    label: block.label,
    rows: block.rows,
    emergencyLines: hasEmergency ? emergencyLines : [],
    continued: false,
    showTableHeader: true,
    showEmergency: hasEmergency,
  })

  const tryAddFull = (): boolean => {
    const segment = fullSegment()
    if (canFitSegment(getCurrentDraft(), segment)) {
      addSegmentToDraft(getCurrentDraft(), segment)
      return true
    }
    return false
  }

  if (tryAddFull()) {
    return
  }

  startNewDraft()
  if (tryAddFull()) {
    return
  }

  const tableOnlySegment = (): Ics204PhysicalPageSegment => ({
    kind: 'communications',
    label: block.label,
    rows: block.rows,
    emergencyLines: [],
    continued: false,
    showTableHeader: true,
    showEmergency: false,
  })

  if (!canFitSegment(getCurrentDraft(), tableOnlySegment())) {
    startNewDraft()
  }
  addSegmentToDraft(getCurrentDraft(), tableOnlySegment())

  if (hasEmergency) {
    paginateCommunicationsEmergency(
      block.label,
      emergencyLines,
      getCurrentDraft,
      startNewDraft,
      true
    )
  }
}

function extractLayoutParts(blocks: Ics204ExportLayoutBlock[]): {
  headerCells: Ics204HeaderCell[]
  contentBlocks: Exclude<Ics204ExportLayoutBlock, { kind: 'header-row' } | { kind: 'signature-footer' }>[]
  signatureFooter: Ics204SignatureFooter
} {
  let headerCells: Ics204HeaderCell[] = []
  let signatureFooter: Ics204SignatureFooter | null = null
  const contentBlocks: Exclude<
    Ics204ExportLayoutBlock,
    { kind: 'header-row' } | { kind: 'signature-footer' }
  >[] = []

  for (const block of blocks) {
    if (block.kind === 'header-row') {
      headerCells = block.cells
      continue
    }
    if (block.kind === 'signature-footer') {
      signatureFooter = block.footer
      continue
    }
    contentBlocks.push(block)
  }

  if (headerCells.length === 0) {
    throw new Error('ICS-204 export layout missing header row.')
  }
  if (!signatureFooter) {
    throw new Error('ICS-204 export layout missing signature footer.')
  }
  if (contentBlocks.length === 0) {
    throw new Error('ICS-204 export layout missing content blocks.')
  }

  return { headerCells, contentBlocks, signatureFooter }
}

export function assertIcs204PaginationInvariants(pages: Ics204PhysicalPage[]): void {
  if (pages.length === 0) {
    throw new Error('ICS-204 export produced no pages.')
  }
  pages.forEach((page, index) => {
    if (page.headerCells.length !== 3) {
      throw new Error('ICS-204 export page missing header cells.')
    }
    if (!page.signatureFooter?.preparedBy?.label) {
      throw new Error('ICS-204 export page missing signature footer.')
    }
    if (page.displayPageNumber !== index + 1) {
      throw new Error('ICS-204 export page numbering is out of sequence.')
    }
    if (page.totalPages !== pages.length) {
      throw new Error('ICS-204 export total page count mismatch.')
    }
    if (page.footerLeft !== ICS204_EXPORT_FOOTER_LEFT) {
      throw new Error('ICS-204 export page missing footer left text.')
    }
  })
}

export function paginateIcs204Export(
  blocks: Ics204ExportLayoutBlock[],
  options: Ics204ExportPaginationOptions = {}
): Ics204PhysicalPage[] {
  activePageSegmentCapacity =
    options.target === 'pdf'
      ? ics204PdfPageSegmentCapacityPt()
      : ics204DocxPageSegmentCapacityPt()

  const { headerCells, contentBlocks, signatureFooter } = extractLayoutParts(blocks)
  const drafts: PageDraft[] = []
  let currentDraft = createPageDraft(headerCells)
  drafts.push(currentDraft)

  const startNewDraft = () => {
    currentDraft = createPageDraft(headerCells)
    drafts.push(currentDraft)
  }

  const getCurrentDraft = () => currentDraft

  for (const block of contentBlocks) {
    switch (block.kind) {
      case 'personnel-table':
        paginatePersonnelTableBlock(block, getCurrentDraft, startNewDraft)
        break
      case 'resources-table':
        paginateResourcesTableBlock(block, getCurrentDraft, startNewDraft)
        break
      case 'text-box':
        paginateSplittableLines(
          block.label,
          flattenWrappedBody(block.body, 9),
          getCurrentDraft,
          startNewDraft
        )
        break
      case 'communications':
        paginateCommunicationsBlock(block, getCurrentDraft, startNewDraft)
        break
      default:
        break
    }
  }

  const pages = finalizeDrafts(
    drafts.filter((draft) => draft.segments.length > 0),
    signatureFooter
  )
  assertIcs204PaginationInvariants(pages)
  return pages
}
