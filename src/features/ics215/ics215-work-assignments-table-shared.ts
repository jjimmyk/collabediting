import { fillHaveForResourceValue } from '@/features/resources/workspace-asset-have-lookup'
import { resolveHaveDisplayValue } from '@/features/ics215/ics215-have-asset-link'
import type { ResourceListItemData } from '@/features/resources/types'
import type {
  Ics215ResourceColumn,
  Ics215ResourceValue,
  Ics215WorkAssignmentRow,
  Ics215WorkAssignmentsDraft,
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

function parseNumericField(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function computeIcs215Need(required: string, have: string): string {
  const req = parseNumericField(required)
  if (req === null) return ''
  const hav = parseNumericField(have) ?? 0
  return String(Math.max(0, req - hav))
}

export function applyIcs215NeedRecalc(value: Ics215ResourceValue): Ics215ResourceValue {
  return {
    ...value,
    need: computeIcs215Need(value.required, value.have),
  }
}

export function recalcIcs215WorkAssignmentsDraftNeed(
  draft: Ics215WorkAssignmentsDraft
): Ics215WorkAssignmentsDraft {
  return {
    ...draft,
    workAssignments: draft.workAssignments.map((row) => ({
      ...row,
      resourceValues: Object.fromEntries(
        Object.entries(row.resourceValues).map(([columnId, value]) => [
          columnId,
          applyIcs215NeedRecalc(value ?? EMPTY_RESOURCE_VALUE),
        ])
      ),
    })),
  }
}

export type Ics215WorkAssignmentsTableLayout = 'default' | 'maximized'

export type Ics215WorkAssignmentsTableBaseProps = {
  resourceColumns: Ics215ResourceColumn[]
  workAssignments: Ics215WorkAssignmentRow[]
  workspaceAssets?: ResourceListItemData[]
  workspaceId?: string | null
  isSupabaseEnabled?: boolean
  getAccessToken?: () => Promise<string | null>
  autoFillHaveFromAssets?: boolean
  lockedAssignee?: string
  roster?: WorkspaceRosterMember[]
  editing: boolean
  canLinkAssets?: boolean
  tableLayout?: Ics215WorkAssignmentsTableLayout
  onRequestEdit?: () => void
  onChange: (next: {
    resourceColumns: Ics215ResourceColumn[]
    workAssignments: Ics215WorkAssignmentRow[]
  }) => void
  onHaveFillComplete?: (filledCount: number) => void
  onPersistWorkAssignments?: (draft: Ics215WorkAssignmentsDraft) => void
}

export function patchResourceValueInDraft(
  draft: Ics215WorkAssignmentsDraft,
  rowId: number,
  columnId: string,
  value: Ics215ResourceValue
): Ics215WorkAssignmentsDraft {
  return {
    ...draft,
    workAssignments: draft.workAssignments.map((row) =>
      row.id === rowId
        ? {
            ...row,
            resourceValues: {
              ...row.resourceValues,
              [columnId]: value,
            },
          }
        : row
    ),
  }
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
                [columnId]: applyIcs215NeedRecalc(value),
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
    if (field === 'need') return
    const next =
      field === 'required' || field === 'have'
        ? applyIcs215NeedRecalc({ ...current, [field]: nextValue })
        : { ...current, [field]: nextValue }
    patchResourceValue(rowId, columnId, next)
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
      ...workAssignments,
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
  const parts = [value.required, resolveHaveDisplayValue(value), value.need].map((part) =>
    part.trim()
  )
  if (parts.every((part) => part.length === 0)) return '—'
  return parts.join(', ')
}
