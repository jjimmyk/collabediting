import {
  ICS215_TEMPLATE_ASSIGNMENT_ROWS_PER_PAGE,
  ICS215_TEMPLATE_RESOURCE_COLS_PER_PAGE,
} from '@/features/ics215/export-template-constants'
import type { Ics215ExportContext } from '@/features/ics215/export-layout'
import type {
  Ics215FormState,
  Ics215ResourceColumn,
  Ics215ResourceValue,
} from '@/features/ics215/types'
import {
  computeIcs215ColumnTotals,
} from '@/features/ics215/utils'
import { formatWorkAssignmentTargetLabel } from '@/lib/work-assignment-target'

export type Ics215TemplateAssignmentRow = {
  assignee: string
  workAssignment: string
  resourceValues: Record<string, Ics215ResourceValue>
  overheadPositions: string
  specialEquipmentSupplies: string
  reportingLocation: string
  requestedArrivalTime: string
}

export type Ics215TemplatePagePlan = {
  pageNumber: number
  totalPages: number
  assignmentRows: Ics215TemplateAssignmentRow[]
  resourceColumns: Ics215ResourceColumn[]
  columnTotals: Record<string, Ics215ResourceValue>
  showTotals: boolean
  showPreparedBy: boolean
  continued: boolean
}

function sliceAssignments<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]]
  const slices: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    slices.push(items.slice(index, index + size))
  }
  return slices
}

function sliceResourceColumns(columns: Ics215ResourceColumn[]): Ics215ResourceColumn[][] {
  if (columns.length === 0) return [[]]
  const slices: Ics215ResourceColumn[][] = []
  for (let index = 0; index < columns.length; index += ICS215_TEMPLATE_RESOURCE_COLS_PER_PAGE) {
    slices.push(columns.slice(index, index + ICS215_TEMPLATE_RESOURCE_COLS_PER_PAGE))
  }
  return slices
}

function formatOperationalPeriodFrom(form: Ics215FormState): string {
  return [form.operationalPeriodDateFrom, form.operationalPeriodTimeFrom]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
}

function formatOperationalPeriodTo(form: Ics215FormState): string {
  return [form.operationalPeriodDateTo, form.operationalPeriodTimeTo]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
}

export function buildIcs215TemplateHeaderValues(
  form: Ics215FormState,
  context: Ics215ExportContext
): {
  incidentName: string
  incidentLocation: string
  datePrepared: string
  opFrom: string
  opTo: string
  preparedBy: string
} {
  const name = form.preparedByName.trim()
  const title = form.preparedByPositionTitle.trim()
  const preparedBy =
    name.length > 0 && title.length > 0
      ? `${name} / ${title}`
      : name.length > 0
        ? name
        : title

  return {
    incidentName: form.incidentName.trim() || context.incidentName?.trim() || '',
    incidentLocation: context.incidentLocation?.trim() ?? '',
    datePrepared: form.preparedDateTime.trim(),
    opFrom: formatOperationalPeriodFrom(form),
    opTo: formatOperationalPeriodTo(form),
    preparedBy,
  }
}

export function paginateIcs215TemplateExport(
  form: Ics215FormState,
  context: Ics215ExportContext = {}
): Ics215TemplatePagePlan[] {
  const assignmentRows: Ics215TemplateAssignmentRow[] = form.workAssignments.map((row) => ({
    assignee: formatWorkAssignmentTargetLabel(row.assignee, context.roster),
    workAssignment: row.workAssignment,
    resourceValues: row.resourceValues,
    overheadPositions: row.overheadPositions,
    specialEquipmentSupplies: row.specialEquipmentSupplies,
    reportingLocation: row.reportingLocation,
    requestedArrivalTime: row.requestedArrivalTime,
  }))

  const assignmentChunks = sliceAssignments(assignmentRows, ICS215_TEMPLATE_ASSIGNMENT_ROWS_PER_PAGE)
  const resourceSlices = sliceResourceColumns(form.resourceColumns)
  const columnTotals = computeIcs215ColumnTotals(form.resourceColumns, form.workAssignments)

  const pages: Ics215TemplatePagePlan[] = []
  assignmentChunks.forEach((chunk, assignmentChunkIndex) => {
    resourceSlices.forEach((resourceColumns, resourceSliceIndex) => {
      const isLastAssignmentChunk = assignmentChunkIndex === assignmentChunks.length - 1
      const isLastResourceSlice = resourceSliceIndex === resourceSlices.length - 1
      const continued = assignmentChunkIndex > 0 || resourceSliceIndex > 0
      pages.push({
        pageNumber: 0,
        totalPages: 0,
        assignmentRows: chunk,
        resourceColumns,
        columnTotals,
        showTotals: isLastAssignmentChunk && isLastResourceSlice,
        showPreparedBy: isLastAssignmentChunk && isLastResourceSlice,
        continued,
      })
    })
  })

  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      totalPages: 1,
      assignmentRows: [],
      resourceColumns: form.resourceColumns.slice(0, ICS215_TEMPLATE_RESOURCE_COLS_PER_PAGE),
      columnTotals,
      showTotals: true,
      showPreparedBy: true,
      continued: false,
    })
  }

  const totalPages = pages.length
  return pages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
    totalPages,
  }))
}

export function assertIcs215TemplatePaginationInvariants(pages: Ics215TemplatePagePlan[]): void {
  if (pages.length === 0) {
    throw new Error('ICS-215 template export produced no pages.')
  }
  pages.forEach((page, index) => {
    if (page.pageNumber !== index + 1) {
      throw new Error('ICS-215 template page numbering is out of sequence.')
    }
    if (page.totalPages !== pages.length) {
      throw new Error('ICS-215 template total page count mismatch.')
    }
    if (page.assignmentRows.length > ICS215_TEMPLATE_ASSIGNMENT_ROWS_PER_PAGE) {
      throw new Error('ICS-215 template page exceeds assignment row capacity.')
    }
    if (page.resourceColumns.length > ICS215_TEMPLATE_RESOURCE_COLS_PER_PAGE) {
      throw new Error('ICS-215 template page exceeds resource column capacity.')
    }
  })
  const last = pages[pages.length - 1]
  if (!last.showTotals || !last.showPreparedBy) {
    throw new Error('ICS-215 template final page must include totals and prepared-by.')
  }
}
