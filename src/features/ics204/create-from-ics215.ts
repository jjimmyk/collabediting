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
import {
  formatWorkAssignmentTargetLabel,
  normalizeWorkAssignmentTargetKey,
  normalizeWorkAssignmentTargetValue,
  parseWorkAssignmentTarget,
} from '@/lib/work-assignment-target'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type Ics215AssigneeWithWorkOption = {
  assignee: string
  label: string
  disabled: boolean
  disabledReason?: string
  rowCount: number
  preview: string
  existingIcs204FormId?: string
}

/** @deprecated Use normalizeWorkAssignmentTargetKey */
export function normalizeIcs215Ics204Assignee(value: string): string {
  return normalizeWorkAssignmentTargetKey(value)
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

export function getIcs215WorkRowsForTarget(
  form: Ics215FormState,
  targetValue: string,
  roster: WorkspaceRosterMember[] = []
): Ics215WorkAssignmentRow[] {
  const key = normalizeWorkAssignmentTargetKey(targetValue, roster)
  if (!key) return []
  return form.workAssignments.filter(
    (row) =>
      normalizeWorkAssignmentTargetKey(row.assignee, roster) === key &&
      isIcs215WorkAssignmentRowPopulated(row)
  )
}

/** @deprecated Use getIcs215WorkRowsForTarget */
export function getIcs215WorkRowsForAssignee(
  form: Ics215FormState,
  assignee: string
): Ics215WorkAssignmentRow[] {
  return getIcs215WorkRowsForTarget(form, assignee)
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
  targetValue: string,
  roster: WorkspaceRosterMember[] = []
): Ics204Ics215ImportSnapshot {
  const normalizedTarget = normalizeWorkAssignmentTargetValue(targetValue, roster)
  const resourceColumns = cloneIcs215ResourceColumns(ics215Form.resourceColumns)
  const rows = getIcs215WorkRowsForTarget(ics215Form, normalizedTarget, roster).map((row) => ({
    ...row,
    assignee: normalizedTarget,
    resourceValues: Object.fromEntries(
      Object.entries(row.resourceValues ?? {}).map(([columnId, value]) => [
        columnId,
        { ...value },
      ])
    ),
  }))

  return {
    assignee: normalizedTarget,
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
  targetValue: string,
  roster: WorkspaceRosterMember[] = []
): Partial<Ics204FormState> {
  const normalizedTarget = normalizeWorkAssignmentTargetValue(targetValue, roster)
  const ics215Import = buildIcs204Ics215ImportSnapshot(ics215Form, normalizedTarget, roster)
  return {
    assignedUnit: normalizedTarget,
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
  existingIcs204Forms: Ics204FormState[],
  roster: WorkspaceRosterMember[] = []
): Ics215AssigneeWithWorkOption[] {
  const eligibleOptions = assigneeOptions.filter((option) => !option.disabled)
  const rowsByTargetKey = new Map<string, Ics215WorkAssignmentRow[]>()

  for (const row of ics215Form.workAssignments) {
    const normalizedRowTarget = normalizeWorkAssignmentTargetValue(row.assignee, roster)
    if (!normalizedRowTarget || !isIcs215WorkAssignmentRowPopulated(row)) continue
    const matchedOption = eligibleOptions.find(
      (option) =>
        normalizeWorkAssignmentTargetKey(option.value, roster) ===
        normalizeWorkAssignmentTargetKey(normalizedRowTarget, roster)
    )
    if (!matchedOption) continue
    const key = normalizeWorkAssignmentTargetKey(matchedOption.value, roster)
    rowsByTargetKey.set(key, [...(rowsByTargetKey.get(key) ?? []), row])
  }

  return eligibleOptions
    .filter((option) =>
      rowsByTargetKey.has(normalizeWorkAssignmentTargetKey(option.value, roster))
    )
    .map((option) => {
      const rows =
        rowsByTargetKey.get(normalizeWorkAssignmentTargetKey(option.value, roster)) ?? []
      const existingForm = existingIcs204Forms.find((form) =>
        normalizeWorkAssignmentTargetKey(form.assignedUnit, roster) ===
        normalizeWorkAssignmentTargetKey(option.value, roster)
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
  existingIcs204Forms: Ics204FormState[] = [],
  roster: WorkspaceRosterMember[] = []
): boolean {
  if (!ics215Form) return false
  return listIcs215AssigneesWithWork(
    ics215Form,
    assigneeOptions,
    existingIcs204Forms,
    roster
  ).some((option) => !option.disabled)
}

export function resolveIcs215TargetLabel(
  targetValue: string,
  roster: WorkspaceRosterMember[] = []
): string {
  return formatWorkAssignmentTargetLabel(targetValue, roster)
}

export function isSameWorkAssignmentTarget(
  left: string,
  right: string,
  roster: WorkspaceRosterMember[] = []
): boolean {
  return (
    normalizeWorkAssignmentTargetKey(left, roster) ===
    normalizeWorkAssignmentTargetKey(right, roster)
  )
}

export function summarizeWorkAssignmentTarget(
  targetValue: string,
  roster: WorkspaceRosterMember[] = []
): string {
  return parseWorkAssignmentTarget(targetValue, roster).label
}
