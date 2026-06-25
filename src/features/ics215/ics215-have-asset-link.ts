import type { Ics215HaveSource, Ics215ResourceColumn, Ics215ResourceValue, Ics215WorkAssignmentRow } from '@/features/ics215/types'
import { applyIcs215NeedRecalc } from '@/features/ics215/ics215-work-assignments-table-shared'
import type { ResourceListItemData } from '@/features/resources/types'

export function isHaveLinkedToAssets(value: Ics215ResourceValue | undefined): boolean {
  return (
    value?.haveSource === 'linked-assets' &&
    Array.isArray(value.linkedAssetKeys) &&
    value.linkedAssetKeys.length > 0
  )
}

export function countSelectedHaveAssets(
  selectedKeys: string[],
  workspaceAssets: ResourceListItemData[]
): number {
  const assignedKeys = new Set(workspaceAssets.map((asset) => asset.assetKey))
  return selectedKeys.filter((key) => assignedKeys.has(key)).length
}

export function formatHaveCountFromAssetKeys(
  selectedKeys: string[],
  workspaceAssets: ResourceListItemData[]
): string {
  return String(countSelectedHaveAssets(selectedKeys, workspaceAssets))
}

export function applyManualHaveValue(
  value: Ics215ResourceValue,
  have: string,
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  const manual: Ics215ResourceValue = {
    ...value,
    have,
    linkedAssetKeys: undefined,
    haveSource: 'manual',
  }
  return options.recalculateNeed === false ? manual : applyIcs215NeedRecalc(manual)
}

export function applyHaveAssetLink(
  value: Ics215ResourceValue,
  selectedKeys: string[],
  workspaceAssets: ResourceListItemData[],
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  const uniqueKeys = [...new Set(selectedKeys)]
  if (uniqueKeys.length === 0) {
    return clearHaveAssetLink(value, options)
  }
  const have = formatHaveCountFromAssetKeys(uniqueKeys, workspaceAssets)
  const linked: Ics215ResourceValue = {
    ...value,
    linkedAssetKeys: uniqueKeys,
    haveSource: 'linked-assets',
    have,
  }
  return options.recalculateNeed === false ? linked : applyIcs215NeedRecalc(linked)
}

export function clearHaveAssetLink(
  value: Ics215ResourceValue,
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  const cleared: Ics215ResourceValue = {
    ...value,
    have: '',
    linkedAssetKeys: undefined,
    haveSource: 'manual',
  }
  if (options.recalculateNeed === false) {
    return cleared
  }
  return applyIcs215NeedRecalc(cleared)
}

export function removeHaveAssetLinkKeys(
  value: Ics215ResourceValue,
  keysToRemove: string[],
  workspaceAssets: ResourceListItemData[],
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  const removeSet = new Set(keysToRemove)
  const remaining = (value.linkedAssetKeys ?? []).filter((key) => !removeSet.has(key))
  if (remaining.length === 0) {
    return clearHaveAssetLink(value, options)
  }
  return applyHaveAssetLink(value, remaining, workspaceAssets, options)
}

export function normalizeIcs215ResourceValue(raw: unknown): Ics215ResourceValue {
  if (!raw || typeof raw !== 'object') {
    return { required: '', have: '', need: '' }
  }
  const record = raw as Record<string, unknown>
  const linkedAssetKeys = Array.isArray(record.linkedAssetKeys)
    ? record.linkedAssetKeys
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
    : undefined

  let haveSource: Ics215HaveSource | undefined =
    record.haveSource === 'manual' || record.haveSource === 'linked-assets'
      ? record.haveSource
      : undefined

  if (!haveSource && linkedAssetKeys && linkedAssetKeys.length > 0) {
    haveSource = 'linked-assets'
  }

  return {
    required: String(record.required ?? ''),
    have: String(record.have ?? ''),
    need: String(record.need ?? ''),
    linkedAssetKeys: linkedAssetKeys && linkedAssetKeys.length > 0 ? linkedAssetKeys : undefined,
    haveSource: haveSource ?? 'manual',
  }
}

export function partitionHaveLinkAssets(
  workspaceAssets: ResourceListItemData[],
  linkedKeys: string[]
): {
  available: ResourceListItemData[]
  staleKeys: string[]
} {
  const availableKeys = new Set(workspaceAssets.map((asset) => asset.assetKey))
  const staleKeys = linkedKeys.filter((key) => !availableKeys.has(key))
  return {
    available: workspaceAssets,
    staleKeys,
  }
}

export function collectLinkedAssetKeysInForm(
  workAssignments: Array<{ id: number; resourceValues: Record<string, Ics215ResourceValue> }>,
  exclude?: { rowId: number; columnId: string }
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of workAssignments) {
    for (const [columnId, value] of Object.entries(row.resourceValues ?? {})) {
      if (exclude && exclude.rowId === row.id && exclude.columnId === columnId) continue
      if (!isHaveLinkedToAssets(value)) continue
      for (const key of value.linkedAssetKeys ?? []) {
        counts[key] = (counts[key] ?? 0) + 1
      }
    }
  }
  return counts
}

export type Ics215HaveAssetLinkLocation = {
  rowId: number
  columnId: string
  columnLabel: string
  assigneeKey: string
  assigneeLabel: string
  workAssignment: string
}

export function buildHaveAssetLinkIndex(
  workAssignments: Ics215WorkAssignmentRow[],
  resourceColumns: Ics215ResourceColumn[],
  resolveAssigneeLabel: (assigneeKey: string) => string,
  exclude?: { rowId: number; columnId: string }
): Map<string, Ics215HaveAssetLinkLocation> {
  const columnLabelById = new Map(resourceColumns.map((column) => [column.id, column.label]))
  const index = new Map<string, Ics215HaveAssetLinkLocation>()

  for (const row of workAssignments) {
    for (const [columnId, value] of Object.entries(row.resourceValues ?? {})) {
      if (exclude && exclude.rowId === row.id && exclude.columnId === columnId) continue
      if (!isHaveLinkedToAssets(value)) continue
      for (const assetKey of value.linkedAssetKeys ?? []) {
        if (index.has(assetKey)) continue
        index.set(assetKey, {
          rowId: row.id,
          columnId,
          columnLabel: columnLabelById.get(columnId) ?? columnId,
          assigneeKey: row.assignee,
          assigneeLabel: resolveAssigneeLabel(row.assignee),
          workAssignment: row.workAssignment,
        })
      }
    }
  }

  return index
}

export function isAssetLinkedElsewhere(
  assetKey: string,
  currentCell: { rowId: number; columnId: string },
  index: Map<string, Ics215HaveAssetLinkLocation>
): boolean {
  const location = index.get(assetKey)
  if (!location) return false
  return location.rowId !== currentCell.rowId || location.columnId !== currentCell.columnId
}

export function getConflictingHaveAssetKeys(
  selectedKeys: string[],
  currentCell: { rowId: number; columnId: string },
  index: Map<string, Ics215HaveAssetLinkLocation>
): string[] {
  return selectedKeys.filter((key) => isAssetLinkedElsewhere(key, currentCell, index))
}

export function formatHaveAssetLinkLocation(location: Ics215HaveAssetLinkLocation): string {
  const assignment =
    location.workAssignment.trim().length > 0 ? location.workAssignment.trim() : 'Work assignment'
  return `${location.assigneeLabel} · ${assignment} · ${location.columnLabel} Have`
}
