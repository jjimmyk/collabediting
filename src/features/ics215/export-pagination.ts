import {
  ICS215_EXPORT_FOOTER_LEFT,
  ICS215_MAX_RESOURCE_COLUMNS_PER_PAGE,
} from '@/features/ics215/constants'
import type {
  Ics215ExportLayoutBlock,
  Ics215HeaderCell,
  Ics215PreparedByFooter,
  Ics215WorkAssignmentExportRow,
  Ics215WorkAssignmentsTableBlock,
} from '@/features/ics215/export-layout'
import type { Ics215ResourceColumn, Ics215ResourceValue } from '@/features/ics215/types'
import { ICS215_LEGACY_ASSIGNMENT_ROWS_PER_BLOCK, ICS215_LEGACY_TOTAL_FOOTER_ROWS } from '@/features/ics215/export-legacy-table'
import {
  ICS215_EXPORT_PAGE_METRICS as PAGE,
  ics215DocxPageSegmentCapacityPt,
  ics215PdfPageSegmentCapacityPt,
} from '@/features/ics215/export-page-metrics'

export type Ics215ExportPaginationTarget = 'docx' | 'pdf'

export type Ics215ExportPaginationOptions = {
  target?: Ics215ExportPaginationTarget
}

let activePageSegmentCapacity = ics215DocxPageSegmentCapacityPt()

const PDF_AVG_WIDTH = 0.5
const PDF_BOLD_AVG_WIDTH = 0.53

export type Ics215WorkAssignmentsTableSegment = {
  kind: 'work-assignments-table'
  label: string
  rows: Ics215WorkAssignmentExportRow[]
  resourceColumns: Ics215ResourceColumn[]
  columnTotals: Record<string, Ics215ResourceValue>
  continued: boolean
  showTableHeader: boolean
  showResourceTotalsFooter: boolean
}

export type Ics215PhysicalPageSegment = Ics215WorkAssignmentsTableSegment

export type Ics215PhysicalPage = {
  displayPageNumber: number
  totalPages: number
  headerCells: Ics215HeaderCell[]
  operationalPeriod: string
  segments: Ics215PhysicalPageSegment[]
  preparedByFooter: Ics215PreparedByFooter
  footerLeft: string
}

type PageDraft = {
  headerCells: Ics215HeaderCell[]
  operationalPeriod: string
  segments: Ics215PhysicalPageSegment[]
  usedHeight: number
}

function estimateTextWidth(text: string, fontSize: number, bold: boolean): number {
  const factor = bold ? PDF_BOLD_AVG_WIDTH : PDF_AVG_WIDTH
  return text.length * fontSize * factor
}

export function wrapIcs215TextLines(
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
  return lines.length > 0 ? lines : ['']
}

function flattenWrappedBody(text: string, charsPerLine: number): string[] {
  return wrapIcs215TextLines(text, charsPerLine * PDF_AVG_WIDTH * 10, 10, false).filter(
    (line, index, arr) => line.length > 0 || arr.length === 1 || index < arr.length - 1
  )
}

export function formatIcs215ContinuedLabel(label: string): string {
  const trimmed = label.trim()
  if (trimmed.endsWith('(Continued)')) return trimmed
  return `${trimmed} (Continued)`
}

function remainingHeight(draft: PageDraft): number {
  return activePageSegmentCapacity - draft.usedHeight
}

function addUsedHeight(draft: PageDraft, height: number): void {
  draft.usedHeight += height
}

function createPageDraft(
  headerCells: Ics215HeaderCell[],
  operationalPeriod: string
): PageDraft {
  return { headerCells, operationalPeriod, segments: [], usedHeight: 0 }
}

function addSegmentToDraft(draft: PageDraft, segment: Ics215PhysicalPageSegment): void {
  if (draft.segments.length > 0) {
    addUsedHeight(draft, PAGE.segmentGapPt)
  }
  draft.segments.push(segment)
  addUsedHeight(draft, estimateWorkAssignmentsTableSegmentHeight(segment))
}

function workTableShellHeight(showTableHeader: boolean, continued: boolean): number {
  const continuedLead = continued ? PAGE.legacyContinuedLabelHeightPt : 0
  const headerHeight = showTableHeader ? PAGE.tableLegacyVerticalHeaderHeightPt : 0
  return continuedLead + headerHeight
}

function estimateAssignmentBlockHeight(row: Ics215WorkAssignmentExportRow): number {
  const workLines = Math.max(
    1,
    flattenWrappedBody(row.workAssignment, 24).length,
    flattenWrappedBody(row.assignee, 12).length
  )
  const singleRowHeight =
    PAGE.tableRowHeightPt + (workLines - 1) * PAGE.paginationLineHeightPt
  return singleRowHeight * ICS215_LEGACY_ASSIGNMENT_ROWS_PER_BLOCK
}

function estimateWorkAssignmentsTableSegmentHeight(segment: Ics215WorkAssignmentsTableSegment): number {
  let height = workTableShellHeight(segment.showTableHeader, segment.continued)
  for (const row of segment.rows) {
    height += estimateAssignmentBlockHeight(row)
  }
  if (segment.showResourceTotalsFooter) {
    height += PAGE.tableRowHeightPt * ICS215_LEGACY_TOTAL_FOOTER_ROWS
  }
  return height
}

function canFitSegment(draft: PageDraft, segment: Ics215PhysicalPageSegment): boolean {
  const gap = draft.segments.length > 0 ? PAGE.segmentGapPt : 0
  return estimateWorkAssignmentsTableSegmentHeight(segment) + gap <= remainingHeight(draft)
}

function sliceResourceColumns(columns: Ics215ResourceColumn[]): Ics215ResourceColumn[][] {
  if (columns.length === 0) return [[]]
  const slices: Ics215ResourceColumn[][] = []
  for (let index = 0; index < columns.length; index += ICS215_MAX_RESOURCE_COLUMNS_PER_PAGE) {
    slices.push(columns.slice(index, index + ICS215_MAX_RESOURCE_COLUMNS_PER_PAGE))
  }
  return slices
}

function paginateWorkAssignmentsTableBlock(
  block: Ics215WorkAssignmentsTableBlock,
  getCurrentDraft: () => PageDraft,
  startNewDraft: () => void
): void {
  const columnSlices = sliceResourceColumns(block.resourceColumns)
  const totalColumnSlices = columnSlices.length

  columnSlices.forEach((resourceColumns, sliceIndex) => {
    const isHorizontalContinued = sliceIndex > 0
    let rowIndex = 0
    const isLastColumnSlice = sliceIndex === totalColumnSlices - 1

    while (rowIndex < block.rows.length) {
      const isRowContinued = rowIndex > 0
      const draft = getCurrentDraft()
      const segmentLabel =
        isHorizontalContinued || isRowContinued
          ? formatIcs215ContinuedLabel(block.label)
          : block.label
      const showTableHeader = !isHorizontalContinued && !isRowContinued
      const minRows = 1
      let maxRows = block.rows.length - rowIndex

      for (let take = maxRows; take >= minRows; take -= 1) {
        const isLastRowChunk = rowIndex + take >= block.rows.length
        const candidate: Ics215WorkAssignmentsTableSegment = {
          kind: 'work-assignments-table',
          label: segmentLabel,
          rows: block.rows.slice(rowIndex, rowIndex + take),
          resourceColumns,
          columnTotals: block.columnTotals,
          continued: isHorizontalContinued || isRowContinued,
          showTableHeader,
          showResourceTotalsFooter: isLastColumnSlice && isLastRowChunk,
        }
        if (canFitSegment(draft, candidate)) {
          addSegmentToDraft(draft, candidate)
          rowIndex += take
          maxRows = 0
          break
        }
      }

      if (maxRows !== 0) {
        const draft = getCurrentDraft()
        const take = 1
        const isLastRowChunk = rowIndex + take >= block.rows.length
        const forced: Ics215WorkAssignmentsTableSegment = {
          kind: 'work-assignments-table',
          label: segmentLabel,
          rows: block.rows.slice(rowIndex, rowIndex + take),
          resourceColumns,
          columnTotals: block.columnTotals,
          continued: isHorizontalContinued || isRowContinued,
          showTableHeader,
          showResourceTotalsFooter: isLastColumnSlice && isLastRowChunk,
        }
        addSegmentToDraft(draft, forced)
        rowIndex += take
        if (!isLastRowChunk) {
          startNewDraft()
        }
      }
    }
  })

  if (block.rows.length === 0) {
    columnSlices.forEach((resourceColumns, sliceIndex) => {
      const isLastColumnSlice = sliceIndex === columnSlices.length - 1
      const draft = getCurrentDraft()
      const segment: Ics215WorkAssignmentsTableSegment = {
        kind: 'work-assignments-table',
        label: sliceIndex > 0 ? formatIcs215ContinuedLabel(block.label) : block.label,
        rows: [],
        resourceColumns,
        columnTotals: block.columnTotals,
        continued: sliceIndex > 0,
        showTableHeader: sliceIndex === 0,
        showResourceTotalsFooter: isLastColumnSlice,
      }
      if (!canFitSegment(draft, segment)) {
        startNewDraft()
      }
      addSegmentToDraft(getCurrentDraft(), segment)
    })
  }
}

function extractLayoutParts(blocks: Ics215ExportLayoutBlock[]): {
  headerCells: Ics215HeaderCell[]
  operationalPeriod: string
  contentBlocks: Exclude<
    Ics215ExportLayoutBlock,
    { kind: 'header-row' } | { kind: 'prepared-by-footer' }
  >[]
  preparedByFooter: Ics215PreparedByFooter
} {
  let headerCells: Ics215HeaderCell[] = []
  let operationalPeriod = ''
  let preparedByFooter: Ics215PreparedByFooter | null = null
  const contentBlocks: Exclude<
    Ics215ExportLayoutBlock,
    { kind: 'header-row' } | { kind: 'prepared-by-footer' }
  >[] = []

  for (const block of blocks) {
    if (block.kind === 'header-row') {
      headerCells = block.cells
      operationalPeriod = block.operationalPeriod
      continue
    }
    if (block.kind === 'prepared-by-footer') {
      preparedByFooter = block.footer
      continue
    }
    contentBlocks.push(block)
  }

  if (headerCells.length === 0) {
    throw new Error('ICS-215 export layout missing header row.')
  }
  if (!preparedByFooter) {
    throw new Error('ICS-215 export layout missing prepared-by footer.')
  }
  if (contentBlocks.length === 0) {
    throw new Error('ICS-215 export layout missing content blocks.')
  }

  return { headerCells, operationalPeriod, contentBlocks, preparedByFooter }
}

export function assertIcs215PaginationInvariants(pages: Ics215PhysicalPage[]): void {
  if (pages.length === 0) {
    throw new Error('ICS-215 export produced no pages.')
  }
  pages.forEach((page, index) => {
    if (page.headerCells.length !== 3) {
      throw new Error('ICS-215 export page missing header cells.')
    }
    if (!page.preparedByFooter?.label) {
      throw new Error('ICS-215 export page missing prepared-by footer.')
    }
    if (page.displayPageNumber !== index + 1) {
      throw new Error('ICS-215 export page numbering is out of sequence.')
    }
    if (page.totalPages !== pages.length) {
      throw new Error('ICS-215 export total page count mismatch.')
    }
    if (page.footerLeft !== ICS215_EXPORT_FOOTER_LEFT) {
      throw new Error('ICS-215 export page missing footer left text.')
    }
  })
}

export function paginateIcs215Export(
  blocks: Ics215ExportLayoutBlock[],
  options: Ics215ExportPaginationOptions = {}
): Ics215PhysicalPage[] {
  activePageSegmentCapacity =
    options.target === 'pdf'
      ? ics215PdfPageSegmentCapacityPt()
      : ics215DocxPageSegmentCapacityPt()

  const { headerCells, operationalPeriod, contentBlocks, preparedByFooter } =
    extractLayoutParts(blocks)
  const drafts: PageDraft[] = []
  let currentDraft = createPageDraft(headerCells, operationalPeriod)
  drafts.push(currentDraft)

  const startNewDraft = () => {
    currentDraft = createPageDraft(headerCells, operationalPeriod)
    drafts.push(currentDraft)
  }

  const getCurrentDraft = () => currentDraft

  for (const block of contentBlocks) {
    if (block.kind === 'work-assignments-table') {
      paginateWorkAssignmentsTableBlock(block, getCurrentDraft, startNewDraft)
    }
  }

  const pages: Ics215PhysicalPage[] = drafts.map((draft, index) => ({
    displayPageNumber: index + 1,
    totalPages: drafts.length,
    headerCells: draft.headerCells,
    operationalPeriod: draft.operationalPeriod,
    segments: draft.segments,
    preparedByFooter,
    footerLeft: ICS215_EXPORT_FOOTER_LEFT,
  }))

  assertIcs215PaginationInvariants(pages)
  return pages
}
