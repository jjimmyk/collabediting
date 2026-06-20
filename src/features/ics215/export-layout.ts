import {
  ICS215_FORM_TITLE_LINES,
} from '@/features/ics215/constants'
import type {
  Ics215FormState,
  Ics215ResourceColumn,
  Ics215ResourceValue,
  Ics215WorkAssignmentRow,
} from '@/features/ics215/types'
import {
  computeIcs215ColumnTotals,
  computeIcs215ResourceTotals,
} from '@/features/ics215/utils'

export type Ics215ExportContext = {
  incidentName?: string
  incidentLocation?: string
}

export type Ics215HeaderCell = {
  label: string
  value: string
}

export type Ics215WorkAssignmentExportRow = {
  assignee: string
  workAssignment: string
  resourceValues: Record<string, Ics215ResourceValue>
  overheadPositions: string
  specialEquipmentSupplies: string
  reportingLocation: string
  requestedArrivalTime: string
}

export type Ics215ResourceTotalsExport = {
  totalResourcesRequired: string
  totalResourcesHaveOnHand: string
  totalResourcesNeedToOrder: string
}

export type Ics215PreparedByFooter = {
  label: string
  name: string
  positionTitle: string
  signature: string
  dateTime: string
}

export type Ics215WorkAssignmentsTableBlock = {
  kind: 'work-assignments-table'
  label: string
  rows: Ics215WorkAssignmentExportRow[]
  resourceColumns: Ics215ResourceColumn[]
  columnTotals: Record<string, Ics215ResourceValue>
  grandTotals: Ics215ResourceTotalsExport
}

export type Ics215ExportLayoutBlock =
  | { kind: 'header-row'; cells: Ics215HeaderCell[]; operationalPeriod: string }
  | Ics215WorkAssignmentsTableBlock
  | { kind: 'prepared-by-footer'; footer: Ics215PreparedByFooter }

function resolveIncidentName(form: Ics215FormState, context: Ics215ExportContext): string {
  return form.incidentName.trim() || context.incidentName?.trim() || ''
}

function resolveIncidentLocation(context: Ics215ExportContext): string {
  return context.incidentLocation?.trim() ?? ''
}

function formatOperationalPeriod(form: Ics215FormState): string {
  const fromParts = [form.operationalPeriodDateFrom, form.operationalPeriodTimeFrom]
    .filter((part) => part.trim().length > 0)
    .join(' ')
  const toParts = [form.operationalPeriodDateTo, form.operationalPeriodTimeTo]
    .filter((part) => part.trim().length > 0)
    .join(' ')
  if (fromParts.length === 0 && toParts.length === 0) return ''
  if (fromParts.length > 0 && toParts.length > 0) {
    return `From: ${fromParts}\nTo: ${toParts}`
  }
  return fromParts.length > 0 ? `From: ${fromParts}` : `To: ${toParts}`
}

function buildHeaderCells(
  form: Ics215FormState,
  context: Ics215ExportContext
): Ics215HeaderCell[] {
  return [
    {
      label: '1. Incident Name:',
      value: resolveIncidentName(form, context),
    },
    {
      label: '2. Incident Location:',
      value: resolveIncidentLocation(context),
    },
    {
      label: '3. Date/Time Prepared:',
      value: form.preparedDateTime.trim(),
    },
  ]
}

function buildWorkAssignmentExportRow(
  row: Ics215WorkAssignmentRow
): Ics215WorkAssignmentExportRow {
  return {
    assignee: row.assignee,
    workAssignment: row.workAssignment,
    resourceValues: row.resourceValues,
    overheadPositions: row.overheadPositions,
    specialEquipmentSupplies: row.specialEquipmentSupplies,
    reportingLocation: row.reportingLocation,
    requestedArrivalTime: row.requestedArrivalTime,
  }
}

function buildPreparedByFooter(form: Ics215FormState): Ics215PreparedByFooter {
  return {
    label: '15. Prepared By:',
    name: form.preparedByName,
    positionTitle: form.preparedByPositionTitle,
    signature: form.preparedBySignature,
    dateTime: form.preparedDateTime.trim(),
  }
}

export function ics215ExportFilenameBase(form: Ics215FormState): string {
  const name = form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_')
  return name.length > 0 ? name : `ICS-215_${form.id.slice(0, 8)}`
}

export function buildIcs215ExportLayout(
  form: Ics215FormState,
  context: Ics215ExportContext = {}
): Ics215ExportLayoutBlock[] {
  const columnTotals = computeIcs215ColumnTotals(form.resourceColumns, form.workAssignments)
  const grandTotals = computeIcs215ResourceTotals(form.resourceColumns, form.workAssignments)

  return [
    {
      kind: 'header-row',
      cells: buildHeaderCells(form, context),
      operationalPeriod: formatOperationalPeriod(form),
    },
    {
      kind: 'work-assignments-table',
      label: 'Work Assignments',
      rows: form.workAssignments.map(buildWorkAssignmentExportRow),
      resourceColumns: form.resourceColumns,
      columnTotals,
      grandTotals,
    },
    {
      kind: 'prepared-by-footer',
      footer: buildPreparedByFooter(form),
    },
  ]
}

export { ICS215_FORM_TITLE_LINES }
