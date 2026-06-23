import { fillHaveForResourceValue } from '@/features/resources/workspace-asset-have-lookup'
import type { ResourceListItemData } from '@/features/resources/types'
import type {
  Ics215ResourceColumn,
  Ics215ResourceValue,
  Ics215WorkAssignmentRow,
} from '@/features/ics215/types'
import {
  computeIcs215ColumnTotals,
  createEmptyResourceValues,
  createNextIcs215WorkAssignmentId,
} from '@/features/ics215/utils'
import { normalizeWorkAssignmentTargetValue } from '@/lib/work-assignment-target'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export const ICS215_OVERFLOW_COLUMNS = [
  { key: 'overheadPositions' as const, label: 'Overhead' },
  { key: 'specialEquipmentSupplies' as const, label: 'Special Equip' },
  { key: 'reportingLocation' as const, label: 'Reporting Loc' },
  { key: 'requestedArrivalTime' as const, label: 'Arrival Time' },
  { key: 'status' as const, label: 'Status' },
]

export const EMPTY_RESOURCE_VALUE: Ics215ResourceValue = {
  required: '',
  have: '',
  need: '',
}

export type Ics215WorkAssignmentsTableBaseProps = {
  resourceColumns: Ics215ResourceColumn[]
  workAssignments: Ics215WorkAssignmentRow[]
  workspaceAssets?: ResourceListItemData[]
  autoFillHaveFromAssets?: boolean
  lockedAssignee?: string
  roster?: WorkspaceRosterMember[]
  editing: boolean
  onChange: (next: {
    resourceColumns: Ics215ResourceColumn[]
    workAssignments: Ics215WorkAssignmentRow[]
  }) => void
  onHaveFillComplete?: (filledCount: number) => void
}

export function useIcs215WorkAssignmentsTable({
  resourceColumns,
  workAssignments,
  workspaceAssets = [],
  autoFillHaveFromAssets = false,
  lockedAssignee,
  roster = [],
  editing,
  onChange,
  onHaveFillComplete,
}: Ics215WorkAssignmentsTableBaseProps) {
  const hideAssigneeColumn = Boolean(lockedAssignee?.trim())
  const lockedTargetValue = normalizeWorkAssignmentTargetValue(lockedAssignee ?? '', roster)
  const columnTotals = computeIcs215ColumnTotals(resourceColumns, workAssignments)

  const patchRows = (nextRows: Ics215WorkAssignmentRow[]) => {
    onChange({ resourceColumns, workAssignments: nextRows })
  }

  const patchColumns = (nextColumns: Ics215ResourceColumn[]) => {
    const nextRows = workAssignments.map((row) => ({
      ...row,
      resourceValues: {
        ...createEmptyResourceValues(nextColumns),
        ...row.resourceValues,
      },
    }))
    onChange({ resourceColumns: nextColumns, workAssignments: nextRows })
  }

  const patchRow = (rowId: number, patch: Partial<Ics215WorkAssignmentRow>) => {
    patchRows(workAssignments.map((row) => (row.id === rowId ? { ...row, ...patch } : row)))
  }

  const patchResourceValue = (rowId: number, columnId: string, value: Ics215ResourceValue) => {
    patchRows(
      workAssignments.map((row) =>
        row.id === rowId
          ? {
              ...row,
              resourceValues: {
                ...row.resourceValues,
                [columnId]: value,
              },
            }
          : row
      )
    )
  }

  const patchResourceField = (
    rowId: number,
    columnId: string,
    field: keyof Ics215ResourceValue,
    nextValue: string
  ) => {
    const row = workAssignments.find((entry) => entry.id === rowId)
    if (!row) return
    const current = row.resourceValues[columnId] ?? EMPTY_RESOURCE_VALUE
    patchResourceValue(rowId, columnId, { ...current, [field]: nextValue })
  }

  const fillColumnHave = (columnId: string, resourceName: string, overwrite: boolean) => {
    let filledCount = 0
    const nextRows = workAssignments.map((row) => {
      const current = row.resourceValues[columnId] ?? EMPTY_RESOURCE_VALUE
      const result = fillHaveForResourceValue(current, resourceName, workspaceAssets, {
        overwrite,
        onlyIfHaveEmpty: !overwrite,
      })
      if (result.filled) filledCount += 1
      return {
        ...row,
        resourceValues: {
          ...row.resourceValues,
          [columnId]: result.value,
        },
      }
    })
    patchRows(nextRows)
    if (filledCount > 0) {
      onHaveFillComplete?.(filledCount)
    }
  }

  const fillAllColumnsHave = (overwrite: boolean) => {
    let filledCount = 0
    const nextRows = workAssignments.map((row) => {
      const resourceValues = { ...row.resourceValues }
      for (const column of resourceColumns) {
        const current = resourceValues[column.id] ?? EMPTY_RESOURCE_VALUE
        const result = fillHaveForResourceValue(current, column.label, workspaceAssets, {
          overwrite,
          onlyIfHaveEmpty: !overwrite,
        })
        if (result.filled) filledCount += 1
        resourceValues[column.id] = result.value
      }
      return { ...row, resourceValues }
    })
    patchRows(nextRows)
    if (filledCount > 0) {
      onHaveFillComplete?.(filledCount)
    }
  }

  const addAssignment = () => {
    patchRows([
      ...workAssignments,
      {
        id: createNextIcs215WorkAssignmentId(workAssignments),
        assignee: lockedTargetValue,
        workAssignment: '',
        resourceValues: createEmptyResourceValues(resourceColumns),
        overheadPositions: '',
        specialEquipmentSupplies: '',
        reportingLocation: '',
        requestedArrivalTime: '',
        status: '',
      },
    ])
  }

  const deleteAssignment = (rowId: number) => {
    patchRows(workAssignments.filter((row) => row.id !== rowId))
  }

  const deleteResourceColumn = (columnId: string) => {
    patchColumns(resourceColumns.filter((column) => column.id !== columnId))
  }

  const patchColumnLabel = (columnId: string, label: string) => {
    patchColumns(
      resourceColumns.map((column) => (column.id === columnId ? { ...column, label } : column))
    )
  }

  const fixedColumnClass = 'min-w-[8.5rem] align-top'
  const resourceColumnClass = 'min-w-[7.5rem] align-top whitespace-nowrap'
  const legacyResourceColumnClass = 'min-w-[4.5rem] align-top text-center'
  const overflowColumnClass = 'min-w-[9rem] align-top'
  const rhnStubColumnClass = 'min-w-[3rem] align-top'
  const tableMinWidthPx = Math.max(
    960,
    (hideAssigneeColumn ? 0 : 170) +
      170 +
      48 +
      resourceColumns.length * 120 +
      ICS215_OVERFLOW_COLUMNS.length * 144 +
      (editing ? 40 : 0)
  )
  const legacyTableMinWidthPx = Math.max(
    960,
    (hideAssigneeColumn ? 0 : 170) +
      170 +
      48 +
      resourceColumns.length * 72 +
      ICS215_OVERFLOW_COLUMNS.length * 144 +
      (editing ? 40 : 0)
  )
  const leadingColumnCount = hideAssigneeColumn ? 1 : 2

  return {
    hideAssigneeColumn,
    columnTotals,
    patchRow,
    patchResourceValue,
    patchResourceField,
    fillColumnHave,
    fillAllColumnsHave,
    addAssignment,
    deleteAssignment,
    deleteResourceColumn,
    patchColumnLabel,
    fixedColumnClass,
    resourceColumnClass,
    legacyResourceColumnClass,
    overflowColumnClass,
    rhnStubColumnClass,
    tableMinWidthPx,
    legacyTableMinWidthPx,
    leadingColumnCount,
    autoFillHaveFromAssets,
  }
}

export function formatResourceValueDisplay(value: Ics215ResourceValue | undefined): string {
  if (!value) return '—'
  const parts = [value.required, value.have, value.need].map((part) => part.trim())
  if (parts.every((part) => part.length === 0)) return '—'
  return parts.join(', ')
}
