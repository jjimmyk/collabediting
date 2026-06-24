import type { Ics215HaveSource, Ics215ResourceValue } from '@/features/ics215/types'
import { applyHaveWithOptionalNeedRecalc } from '@/features/resources/workspace-asset-have-lookup'
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
  const next = applyHaveWithOptionalNeedRecalc(
    {
      ...value,
      have,
      linkedAssetKeys: undefined,
      haveSource: 'manual',
    },
    have
  )
  return options.recalculateNeed === false ? { ...value, have, linkedAssetKeys: undefined, haveSource: 'manual' } : next
}

export function applyHaveAssetLink(
  value: Ics215ResourceValue,
  selectedKeys: string[],
  workspaceAssets: ResourceListItemData[],
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  const uniqueKeys = [...new Set(selectedKeys)]
  const have = formatHaveCountFromAssetKeys(uniqueKeys, workspaceAssets)
  const linked: Ics215ResourceValue = {
    ...value,
    linkedAssetKeys: uniqueKeys,
    haveSource: 'linked-assets',
    have,
  }
  return options.recalculateNeed === false ? linked : applyHaveWithOptionalNeedRecalc(linked, have)
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
