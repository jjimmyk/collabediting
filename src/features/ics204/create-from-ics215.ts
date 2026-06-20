import type { Ics204AssignedUnitOption } from '@/features/ics204/ics204-assigned-unit-options'
import type {
  Ics204FormState,
  Ics204Ics215ImportSnapshot,
  Ics204WorkAssignmentRow,
} from '@/features/ics204/types'
import type {
  Ics215FormState,
  Ics215ResourceColumn,
  Ics215WorkAssignmentRow,
} from '@/features/ics215/types'
import {
  cloneIcs215ResourceColumns,
  cloneIcs215WorkAssignmentRows,
} from '@/features/ics215/utils'

export type Ics215AssigneeWithWorkOption = {
  assignee: string
  label: string
  disabled: boolean
  disabledReason?: string
  rowCount: number
  preview: string
  existingIcs204FormId?: string
}

function normalizeAssignee(value: string): string {
  return value.trim().toLowerCase()
}

export function isIcs215WorkAssignmentRowPopulated(row: Ics215WorkAssignmentRow): boolean {
  if (row.workAssignment.trim().length > 0) return true
  if (row.overheadPositions.trim().length > 0) return true
  if (row.specialEquipmentSupplies.trim().length > 0) return true
  if (row.reportingLocation.trim().length > 0) return true
  if (row.requestedArrivalTime.trim().length > 0) return true
  if (row.status.trim().length > 0) return true
  return Object.values(row.resourceValues ?? {}).some(
    (value) =>
      value.required.trim().length > 0 ||
      value.have.trim().length > 0 ||
      value.need.trim().length > 0
  )
}

export function getIcs215WorkRowsForAssignee(
  form: Ics215FormState,
  assignee: string
): Ics215WorkAssignmentRow[] {
  const key = normalizeAssignee(assignee)
  return form.workAssignments.filter(
    (row) => normalizeAssignee(row.assignee) === key && isIcs215WorkAssignmentRowPopulated(row)
  )
}

export function mapIcs215RowToIcs204WorkAssignment(
  row: Ics215WorkAssignmentRow,
  resourceColumns: Ics215ResourceColumn[],
  id: number
): Ics204WorkAssignmentRow {
  const resourceRequirements = resourceColumns
    .map((column) => {
      const value = row.resourceValues?.[column.id]
      if (!value) return null
      const hasValue =
        value.required.trim().length > 0 ||
        value.have.trim().length > 0 ||
        value.need.trim().length > 0
      if (!hasValue) return null
      return {
        resource: column.label,
        required: value.required,
        have: value.have,
        need: value.need,
      }
    })
    .filter((entry): entry is { resource: string; required: string; have: string; need: string } =>
      Boolean(entry)
    )
    .map((entry, index) => ({
      id: index + 1,
      ...entry,
    }))

  return {
    id,
    assignment: row.workAssignment,
    priority: row.status,
    resourceRequirements,
    overheadPositions: row.overheadPositions,
    specialEquipmentSupplies: row.specialEquipmentSupplies,
    reportingLocation: row.reportingLocation,
    requestedArrivalTime: row.requestedArrivalTime,
  }
}

export function mapIcs215RowsToIcs204WorkAssignments(
  rows: Ics215WorkAssignmentRow[],
  resourceColumns: Ics215ResourceColumn[]
): Ics204WorkAssignmentRow[] {
  return rows.map((row, index) =>
    mapIcs215RowToIcs204WorkAssignment(row, resourceColumns, index + 1)
  )
}

export function buildIcs204Ics215ImportSnapshot(
  ics215Form: Ics215FormState,
  assignee: string
): Ics204Ics215ImportSnapshot {
  const resourceColumns = cloneIcs215ResourceColumns(ics215Form.resourceColumns)
  const rows = getIcs215WorkRowsForAssignee(ics215Form, assignee).map((row) => ({
    ...row,
    assignee,
    resourceValues: Object.fromEntries(
      Object.entries(row.resourceValues ?? {}).map(([columnId, value]) => [
        columnId,
        { ...value },
      ])
    ),
  }))

  return {
    assignee,
    resourceColumns,
    workAssignments: cloneIcs215WorkAssignmentRows(rows, resourceColumns),
  }
}

export function syncIcs204WorkAssignmentsFromIcs215Import(
  form: Ics204FormState
): Ics204FormState {
  if (!form.ics215Import) return form
  return {
    ...form,
    workAssignments: mapIcs215RowsToIcs204WorkAssignments(
      form.ics215Import.workAssignments,
      form.ics215Import.resourceColumns
    ),
  }
}

export function buildIcs204PartialFromIcs215(
  ics215Form: Ics215FormState,
  assignee: string
): Partial<Ics204FormState> {
  const ics215Import = buildIcs204Ics215ImportSnapshot(ics215Form, assignee)
  return {
    assignedUnit: assignee,
    ics215Import,
    workAssignments: mapIcs215RowsToIcs204WorkAssignments(
      ics215Import.workAssignments,
      ics215Import.resourceColumns
    ),
  }
}

export function listIcs215AssigneesWithWork(
  ics215Form: Ics215FormState,
  assigneeOptions: Ics204AssignedUnitOption[],
  existingIcs204Forms: Ics204FormState[]
): Ics215AssigneeWithWorkOption[] {
  const eligibleOptions = assigneeOptions.filter((option) => !option.disabled)
  const rowsByAssigneeKey = new Map<string, Ics215WorkAssignmentRow[]>()

  for (const row of ics215Form.workAssignments) {
    if (!row.assignee.trim() || !isIcs215WorkAssignmentRowPopulated(row)) continue
    const matchedOption = eligibleOptions.find(
      (option) => normalizeAssignee(option.value) === normalizeAssignee(row.assignee)
    )
    if (!matchedOption) continue
    const key = normalizeAssignee(matchedOption.value)
    rowsByAssigneeKey.set(key, [...(rowsByAssigneeKey.get(key) ?? []), row])
  }

  return eligibleOptions
    .filter((option) => rowsByAssigneeKey.has(normalizeAssignee(option.value)))
    .map((option) => {
      const rows = rowsByAssigneeKey.get(normalizeAssignee(option.value)) ?? []
      const existingForm = existingIcs204Forms.find(
        (form) => normalizeAssignee(form.assignedUnit) === normalizeAssignee(option.value)
      )
      const preview =
        rows
          .map((row) => row.workAssignment.trim())
          .find((value) => value.length > 0)
          ?.slice(0, 100) ?? 'Work assignments'
      return {
        assignee: option.value,
        label: option.label,
        disabled: Boolean(existingForm),
        disabledReason: existingForm ? 'ICS-204 already exists for this unit' : undefined,
        rowCount: rows.length,
        preview,
        existingIcs204FormId: existingForm?.id,
      }
    })
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function canCreateIcs204FromIcs215(
  ics215Form: Ics215FormState | null,
  assigneeOptions: Ics204AssignedUnitOption[],
  existingIcs204Forms: Ics204FormState[] = []
): boolean {
  if (!ics215Form) return false
  return listIcs215AssigneesWithWork(ics215Form, assigneeOptions, existingIcs204Forms).some(
    (option) => !option.disabled
  )
}
