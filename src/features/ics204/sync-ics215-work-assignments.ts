import type { Ics204AssignedUnitOption } from '@/features/ics204/ics204-assigned-unit-options'
import { resolveIcs204AssignedUnitDisplayLabel } from '@/features/ics204/ics204-assigned-unit-options'
import {
  buildIcs204Ics215ImportSnapshot,
  getIcs215WorkRowsForAssignee,
  isIcs215WorkAssignmentRowPopulated,
  mapIcs215RowsToIcs204WorkAssignments,
  normalizeIcs215Ics204Assignee,
  syncIcs204WorkAssignmentsFromIcs215Import,
} from '@/features/ics204/create-from-ics215'
import type {
  Ics204FormSectionDrafts,
  Ics204FormState,
  Ics204WorkAssignmentRow,
} from '@/features/ics204/types'
import type {
  Ics215FormState,
  Ics215ResourceColumn,
  Ics215ResourceValue,
  Ics215WorkAssignmentRow,
} from '@/features/ics215/types'
import {
  cloneIcs215ResourceColumns,
  cloneIcs215WorkAssignmentRows,
  computeIcs215ResourceTotals,
  createEmptyResourceValues,
  createNextIcs215ResourceColumnId,
  createNextIcs215WorkAssignmentId,
} from '@/features/ics215/utils'

export type Ics215Ics204WorkSyncTooltipState = {
  linked: boolean
  linkedUnitLabels: string[]
  peerHasUnsavedEdits: boolean
  peerUnsavedMessage?: string
}

function mergeResourceColumns(
  base: Ics215ResourceColumn[],
  incoming: Ics215ResourceColumn[]
): Ics215ResourceColumn[] {
  const byId = new Map(base.map((column) => [column.id, column]))
  for (const column of incoming) {
    byId.set(column.id, column)
  }

  const merged: Ics215ResourceColumn[] = []
  const seen = new Set<string>()
  for (const column of base) {
    merged.push(byId.get(column.id) ?? column)
    seen.add(column.id)
  }
  for (const column of incoming) {
    if (!seen.has(column.id)) {
      merged.push(column)
    }
  }
  return merged
}

function resolveResourceColumnForLabel(
  label: string,
  existingColumns: Ics215ResourceColumn[],
  pendingColumns: Ics215ResourceColumn[]
): Ics215ResourceColumn {
  const normalizedLabel = label.trim().toLowerCase()
  const existing =
    existingColumns.find((column) => column.label.trim().toLowerCase() === normalizedLabel) ??
    pendingColumns.find((column) => column.label.trim().toLowerCase() === normalizedLabel)
  if (existing) return existing

  const nextColumn: Ics215ResourceColumn = {
    id: createNextIcs215ResourceColumnId([...existingColumns, ...pendingColumns]),
    label: label.trim(),
  }
  pendingColumns.push(nextColumn)
  return nextColumn
}

export function mapIcs204WorkAssignmentsToIcs215Rows(
  workAssignments: Ics204WorkAssignmentRow[],
  assignee: string,
  existingColumns: Ics215ResourceColumn[]
): { resourceColumns: Ics215ResourceColumn[]; rows: Ics215WorkAssignmentRow[] } {
  const baseColumns = cloneIcs215ResourceColumns(existingColumns)
  const pendingColumns: Ics215ResourceColumn[] = []

  for (const row of workAssignments) {
    for (const requirement of row.resourceRequirements) {
      if (!requirement.resource.trim()) continue
      resolveResourceColumnForLabel(requirement.resource, baseColumns, pendingColumns)
    }
  }

  const resourceColumns = [...baseColumns, ...pendingColumns]
  const rows = workAssignments.map((row, index) => {
    const resourceValues = Object.fromEntries(
      resourceColumns.map((column) => {
        const requirement = row.resourceRequirements.find(
          (entry) => entry.resource.trim().toLowerCase() === column.label.trim().toLowerCase()
        )
        const value: Ics215ResourceValue = requirement
          ? {
              required: requirement.required,
              have: requirement.have,
              need: requirement.need,
            }
          : { required: '', have: '', need: '' }
        return [column.id, value]
      })
    )

    return {
      id: row.id > 0 ? row.id : index + 1,
      assignee,
      workAssignment: row.assignment,
      resourceValues,
      overheadPositions: row.overheadPositions,
      specialEquipmentSupplies: row.specialEquipmentSupplies,
      reportingLocation: row.reportingLocation,
      requestedArrivalTime: row.requestedArrivalTime,
      status: row.priority,
    }
  })

  return {
    resourceColumns,
    rows: cloneIcs215WorkAssignmentRows(rows, resourceColumns),
  }
}

export function mergeAssigneeRowsIntoIcs215Form(
  form: Ics215FormState,
  assignee: string,
  incomingRows: Ics215WorkAssignmentRow[],
  incomingColumns?: Ics215ResourceColumn[]
): Ics215FormState {
  const assigneeKey = normalizeIcs215Ics204Assignee(assignee)
  const otherRows = form.workAssignments.filter(
    (row) => normalizeIcs215Ics204Assignee(row.assignee) !== assigneeKey
  )
  const resourceColumns = incomingColumns
    ? mergeResourceColumns(form.resourceColumns, incomingColumns)
    : cloneIcs215ResourceColumns(form.resourceColumns)
  const normalizedIncoming = cloneIcs215WorkAssignmentRows(
    incomingRows.map((row) => ({
      ...row,
      assignee,
      resourceValues: {
        ...createEmptyResourceValues(resourceColumns),
        ...row.resourceValues,
      },
    })),
    resourceColumns
  )
  const workAssignments = [...otherRows, ...normalizedIncoming]
  const totals = computeIcs215ResourceTotals(resourceColumns, workAssignments)

  return {
    ...form,
    resourceColumns,
    workAssignments,
    ...totals,
  }
}

export function isIcs204WorkAssignmentsLinkedToIcs215(
  form: Ics204FormState,
  ics215Form: Ics215FormState | null
): boolean {
  const assignee = form.assignedUnit.trim()
  if (!assignee || !ics215Form) return false
  if (form.ics215Import) return true
  if (getIcs215WorkRowsForAssignee(ics215Form, assignee).length > 0) return true
  return form.workAssignments.some(
    (row) =>
      row.assignment.trim().length > 0 ||
      row.priority.trim().length > 0 ||
      row.overheadPositions.trim().length > 0 ||
      row.specialEquipmentSupplies.trim().length > 0 ||
      row.reportingLocation.trim().length > 0 ||
      row.requestedArrivalTime.trim().length > 0 ||
      row.resourceRequirements.some(
        (requirement) =>
          requirement.resource.trim().length > 0 ||
          requirement.required.trim().length > 0 ||
          requirement.have.trim().length > 0 ||
          requirement.need.trim().length > 0
      )
  )
}

export function findLinkedIcs204Forms(
  ics204Forms: Ics204FormState[],
  ics215Form: Ics215FormState | null
): Ics204FormState[] {
  return ics204Forms.filter((form) => isIcs204WorkAssignmentsLinkedToIcs215(form, ics215Form))
}

export function syncIcs204WorkAssignmentsToIcs215(
  ics204Form: Ics204FormState,
  ics215Form: Ics215FormState
): Ics215FormState | null {
  const assignee = ics204Form.assignedUnit.trim()
  if (!assignee) return null

  if (ics204Form.ics215Import) {
    return mergeAssigneeRowsIntoIcs215Form(
      ics215Form,
      assignee,
      ics204Form.ics215Import.workAssignments,
      ics204Form.ics215Import.resourceColumns
    )
  }

  const mapped = mapIcs204WorkAssignmentsToIcs215Rows(
    ics204Form.workAssignments,
    assignee,
    ics215Form.resourceColumns
  )
  return mergeAssigneeRowsIntoIcs215Form(
    ics215Form,
    assignee,
    mapped.rows,
    mapped.resourceColumns
  )
}

export function applyIcs215ImportToIcs204Form(
  form: Ics204FormState,
  ics215Form: Ics215FormState
): Ics204FormState {
  const assignee = form.assignedUnit.trim()
  if (!assignee) return form

  const importSnapshot = buildIcs204Ics215ImportSnapshot(ics215Form, assignee)
  return syncIcs204WorkAssignmentsFromIcs215Import({
    ...form,
    ics215Import: importSnapshot,
  })
}

export function syncIcs215WorkAssignmentsToLinkedIcs204Forms(
  ics215Form: Ics215FormState,
  ics204Forms: Ics204FormState[]
): Ics204FormState[] {
  return findLinkedIcs204Forms(ics204Forms, ics215Form).map((form) =>
    applyIcs215ImportToIcs204Form(form, ics215Form)
  )
}

export function finalizeIcs204FormAfterWorkAssignmentsSave(
  ics204Form: Ics204FormState,
  ics215Form: Ics215FormState
): Ics204FormState {
  const assignee = ics204Form.assignedUnit.trim()
  if (!assignee) return ics204Form

  if (ics204Form.ics215Import) {
    return syncIcs204WorkAssignmentsFromIcs215Import(ics204Form)
  }

  return applyIcs215ImportToIcs204Form(ics204Form, ics215Form)
}

export function resolveIcs215WorkSyncTooltipFor215(
  ics215Form: Ics215FormState | null,
  ics204Forms: Ics204FormState[],
  assigneeOptions: Ics204AssignedUnitOption[],
  ics204SectionDraftsByFormId: Record<string, Ics204FormSectionDrafts>
): Ics215Ics204WorkSyncTooltipState {
  const linkedForms = findLinkedIcs204Forms(ics204Forms, ics215Form)
  const linkedUnitLabels = linkedForms.map((form) =>
    resolveIcs204AssignedUnitDisplayLabel(form.assignedUnit, assigneeOptions)
  )
  const unsavedForms = linkedForms.filter(
    (form) => ics204SectionDraftsByFormId[form.id]?.['work-assignments'] !== undefined
  )

  return {
    linked: linkedForms.length > 0,
    linkedUnitLabels,
    peerHasUnsavedEdits: unsavedForms.length > 0,
    peerUnsavedMessage:
      unsavedForms.length > 0
        ? `ICS-204 (${unsavedForms
            .map((form) => resolveIcs204AssignedUnitDisplayLabel(form.assignedUnit, assigneeOptions))
            .join(', ')}) has unsaved work-assignment edits.`
        : undefined,
  }
}

export function resolveIcs215WorkSyncTooltipFor204(
  form: Ics204FormState,
  ics215Form: Ics215FormState | null,
  ics215HasUnsavedWorkDraft: boolean,
  assigneeOptions: Ics204AssignedUnitOption[]
): Ics215Ics204WorkSyncTooltipState {
  const linked = isIcs204WorkAssignmentsLinkedToIcs215(form, ics215Form)
  const unitLabel = resolveIcs204AssignedUnitDisplayLabel(form.assignedUnit, assigneeOptions)

  return {
    linked,
    linkedUnitLabels: linked ? [unitLabel] : [],
    peerHasUnsavedEdits: ics215HasUnsavedWorkDraft,
    peerUnsavedMessage: ics215HasUnsavedWorkDraft
      ? 'ICS-215 has unsaved work-assignment edits.'
      : undefined,
  }
}

export function collectAssigneeKeysFromIcs215WorkAssignments(
  form: Ics215FormState
): string[] {
  const keys = new Set<string>()
  for (const row of form.workAssignments) {
    const assignee = row.assignee.trim()
    if (!assignee) continue
    if (!isIcs215WorkAssignmentRowPopulated(row)) continue
    keys.add(normalizeIcs215Ics204Assignee(assignee))
  }
  return [...keys]
}

export function reassignIcs215RowIds(rows: Ics215WorkAssignmentRow[]): Ics215WorkAssignmentRow[] {
  let nextId = 1
  return rows.map((row) => ({
    ...row,
    id: nextId++,
  }))
}

export function ensureIcs204WorkAssignmentIds(
  rows: Ics204WorkAssignmentRow[]
): Ics204WorkAssignmentRow[] {
  let nextId =
    rows.length === 0 ? 1 : Math.max(...rows.map((row) => row.id), 0) + 1
  return rows.map((row) => ({
    ...row,
    id: row.id > 0 ? row.id : nextId++,
  }))
}

export function createIcs215RowsFromIcs204ImportSnapshot(
  assignee: string,
  rows: Ics215WorkAssignmentRow[],
  resourceColumns: Ics215ResourceColumn[]
): Ics215WorkAssignmentRow[] {
  const normalizedRows =
    rows.length === 0
      ? [
          {
            id: 1,
            assignee,
            workAssignment: '',
            resourceValues: createEmptyResourceValues(resourceColumns),
            overheadPositions: '',
            specialEquipmentSupplies: '',
            reportingLocation: '',
            requestedArrivalTime: '',
            status: '',
          },
        ]
      : rows

  return cloneIcs215WorkAssignmentRows(
    reassignIcs215RowIds(
      normalizedRows.map((row) => ({
        ...row,
        assignee,
      }))
    ),
    resourceColumns
  )
}

export function mapIcs204WorkAssignmentsToIcs215ImportRows(
  workAssignments: Ics204WorkAssignmentRow[],
  assignee: string,
  resourceColumns: Ics215ResourceColumn[]
): Ics215WorkAssignmentRow[] {
  return createIcs215RowsFromIcs204ImportSnapshot(
    assignee,
    mapIcs204WorkAssignmentsToIcs215Rows(workAssignments, assignee, resourceColumns).rows,
    resourceColumns
  )
}

export { mapIcs215RowsToIcs204WorkAssignments, createNextIcs215WorkAssignmentId }
