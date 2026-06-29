import type {
  Ics215HaveSource,
  Ics215ResourceColumn,
  Ics215ResourceValue,
  Ics215WorkAssignmentRow,
} from '@/features/ics215/types'
import { applyIcs215NeedRecalc } from '@/features/ics215/ics215-work-assignments-table-shared'
import { normalizeNeedLinkFields } from '@/features/ics215/ics215-need-asset-request-link'
import type { ResourceListItemData } from '@/features/resources/types'
import type { WorkAssignmentTargetType } from '@/lib/work-assignment-target'
import { parseWorkAssignmentTarget } from '@/lib/work-assignment-target'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'

export const HAVE_LINKABLE_TARGET_TYPES: WorkAssignmentTargetType[] = [
  'position',
  'member',
  'single_resource',
  'position_asset',
  'org_chart_asset',
  'resource_category',
]

export type Ics215HaveLinkLocation = {
  rowId: number
  columnId: string
  columnLabel: string
  assigneeKey: string
  assigneeLabel: string
  workAssignment: string
}

/** @deprecated Use Ics215HaveLinkLocation */
export type Ics215HaveAssetLinkLocation = Ics215HaveLinkLocation

function encodeLegacyAssetKey(assetKey: string): string {
  return `org_chart_asset:${assetKey.trim()}`
}

export function getLinkedHaveRefs(value: Ics215ResourceValue | undefined): string[] {
  if (!value) return []
  if (Array.isArray(value.linkedHaveRefs) && value.linkedHaveRefs.length > 0) {
    return [...new Set(value.linkedHaveRefs.map((entry) => entry.trim()).filter(Boolean))]
  }
  if (Array.isArray(value.linkedAssetKeys) && value.linkedAssetKeys.length > 0) {
    return [...new Set(value.linkedAssetKeys.map((key) => encodeLegacyAssetKey(key)))]
  }
  return []
}

export function isHaveLinkedToRoster(value: Ics215ResourceValue | undefined): boolean {
  const refs = getLinkedHaveRefs(value)
  if (refs.length === 0) return false
  return (
    value?.haveSource === 'linked-roster' ||
    value?.haveSource === 'linked-assets' ||
    Boolean(value?.linkedHaveRefs?.length) ||
    Boolean(value?.linkedAssetKeys?.length)
  )
}

/** @deprecated Use isHaveLinkedToRoster */
export function isHaveLinkedToAssets(value: Ics215ResourceValue | undefined): boolean {
  return isHaveLinkedToRoster(value)
}

export function isHaveLinked(value: Ics215ResourceValue | undefined): boolean {
  return isHaveLinkedToRoster(value)
}

export function countLinkedHaveRefs(selectedRefs: string[]): number {
  return [...new Set(selectedRefs.map((entry) => entry.trim()).filter(Boolean))].length
}

export function formatHaveCountFromRefs(selectedRefs: string[]): string {
  return String(countLinkedHaveRefs(selectedRefs))
}

/** Have count shown in the cell — derived from linked refs when roster-linked. */
export function resolveHaveDisplayValue(value: Ics215ResourceValue | undefined): string {
  if (!value) return ''
  if (isHaveLinkedToRoster(value)) {
    const refs = getLinkedHaveRefs(value)
    if (refs.length > 0) {
      return String(refs.length)
    }
  }
  return value.have.trim()
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
    linkedHaveRefs: undefined,
    haveSource: 'manual',
  }
  return options.recalculateNeed === false ? manual : applyIcs215NeedRecalc(manual)
}

export function applyHaveRosterLink(
  value: Ics215ResourceValue,
  selectedRefs: string[],
  eligibleOptions: WorkAssignmentTargetOption[] = [],
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  const uniqueRefs = [...new Set(selectedRefs.map((entry) => entry.trim()).filter(Boolean))]
  if (uniqueRefs.length === 0) {
    return clearHaveRosterLink(value, options)
  }
  const have = formatHaveCountFromRefs(uniqueRefs)
  const linked: Ics215ResourceValue = {
    ...value,
    linkedHaveRefs: uniqueRefs,
    linkedAssetKeys: undefined,
    haveSource: 'linked-roster',
    have,
  }
  return options.recalculateNeed === false ? linked : applyIcs215NeedRecalc(linked)
}

/** @deprecated Use applyHaveRosterLink */
export function applyHaveAssetLink(
  value: Ics215ResourceValue,
  selectedKeys: string[],
  workspaceAssets: ResourceListItemData[],
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  void workspaceAssets
  const refs = selectedKeys.map((key) => encodeLegacyAssetKey(key))
  return applyHaveRosterLink(value, refs, [], options)
}

export function clearHaveRosterLink(
  value: Ics215ResourceValue,
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  const cleared: Ics215ResourceValue = {
    ...value,
    have: '',
    linkedAssetKeys: undefined,
    linkedHaveRefs: undefined,
    haveSource: 'manual',
  }
  if (options.recalculateNeed === false) {
    return cleared
  }
  return applyIcs215NeedRecalc(cleared)
}

/** @deprecated Use clearHaveRosterLink */
export function clearHaveAssetLink(
  value: Ics215ResourceValue,
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  return clearHaveRosterLink(value, options)
}

export function removeHaveRosterLinkRefs(
  value: Ics215ResourceValue,
  refsToRemove: string[],
  eligibleOptions: WorkAssignmentTargetOption[] = [],
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  const removeSet = new Set(refsToRemove.map((entry) => entry.trim()).filter(Boolean))
  const remaining = getLinkedHaveRefs(value).filter((ref) => !removeSet.has(ref))
  if (remaining.length === 0) {
    return clearHaveRosterLink(value, options)
  }
  return applyHaveRosterLink(value, remaining, eligibleOptions, options)
}

/** @deprecated Use removeHaveRosterLinkRefs */
export function removeHaveAssetLinkKeys(
  value: Ics215ResourceValue,
  keysToRemove: string[],
  workspaceAssets: ResourceListItemData[],
  options: { recalculateNeed?: boolean } = {}
): Ics215ResourceValue {
  void workspaceAssets
  const removeSet = new Set(keysToRemove)
  const remaining = getLinkedHaveRefs(value).filter((ref) => {
    const parsed = parseWorkAssignmentTarget(ref)
    if (parsed.type === 'org_chart_asset' || parsed.type === 'position_asset') {
      return parsed.assetKey && !removeSet.has(parsed.assetKey)
    }
    return true
  })
  return applyHaveRosterLink(value, remaining, [], options)
}

export function normalizeIcs215ResourceValue(raw: unknown): Ics215ResourceValue {
  if (!raw || typeof raw !== 'object') {
    return { required: '', have: '', need: '' }
  }
  const record = raw as Record<string, unknown>

  const linkedHaveRefs = Array.isArray(record.linkedHaveRefs)
    ? record.linkedHaveRefs
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
    : undefined

  const linkedAssetKeys = Array.isArray(record.linkedAssetKeys)
    ? record.linkedAssetKeys
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
    : undefined

  const migratedRefs =
    linkedHaveRefs && linkedHaveRefs.length > 0
      ? [...new Set(linkedHaveRefs)]
      : linkedAssetKeys && linkedAssetKeys.length > 0
        ? [...new Set(linkedAssetKeys.map((key) => encodeLegacyAssetKey(key)))]
        : undefined

  let haveSource: Ics215HaveSource | undefined =
    record.haveSource === 'manual' ||
    record.haveSource === 'linked-assets' ||
    record.haveSource === 'linked-roster'
      ? record.haveSource
      : undefined

  if (!haveSource && migratedRefs && migratedRefs.length > 0) {
    haveSource = 'linked-roster'
  }

  const normalized: Ics215ResourceValue = {
    required: String(record.required ?? ''),
    have: String(record.have ?? ''),
    need: String(record.need ?? ''),
    linkedHaveRefs: migratedRefs,
    haveSource: haveSource ?? 'manual',
  }

  if (
    migratedRefs &&
    migratedRefs.length > 0 &&
    (normalized.haveSource === 'linked-roster' || normalized.haveSource === 'linked-assets')
  ) {
    return normalizeNeedLinkFields(
      applyIcs215NeedRecalc({
        ...normalized,
        have: formatHaveCountFromRefs(migratedRefs),
      })
    )
  }

  return normalizeNeedLinkFields(normalized)
}

export { normalizeNeedLinkFields } from '@/features/ics215/ics215-need-asset-request-link'

export function partitionHaveLinkRefs(
  eligibleOptions: WorkAssignmentTargetOption[],
  linkedRefs: string[],
  nextOpEligibleRefs?: Set<string>,
  workspaceAssignedRefs?: Set<string>
): {
  available: WorkAssignmentTargetOption[]
  staleRefs: string[]
} {
  const optionByValue = new Map(eligibleOptions.map((option) => [option.value, option]))
  const staleRefs = linkedRefs.filter((ref) => {
    if (workspaceAssignedRefs?.has(ref)) return false
    if (!optionByValue.has(ref)) return true
    if (nextOpEligibleRefs && !nextOpEligibleRefs.has(ref)) return true
    return false
  })
  return {
    available: eligibleOptions,
    staleRefs,
  }
}

export function collectWorkspaceAssignedHaveRefs(
  workspaceAssets: ResourceListItemData[],
  haveLinkTargetOptions: WorkAssignmentTargetOption[]
): Set<string> {
  const refs = new Set<string>()
  for (const asset of workspaceAssets) {
    const assetKey = asset.assetKey.trim()
    if (!assetKey) continue
    refs.add(assetKeyToHaveRef(assetKey, haveLinkTargetOptions))
  }
  return refs
}

export function isHaveRefEligibleForConfirm(
  ref: string,
  input: {
    nextOpEligibleRefs: Set<string>
    workspaceAssignedRefs: Set<string>
  }
): boolean {
  const normalized = ref.trim()
  if (!normalized) return false
  return (
    input.nextOpEligibleRefs.has(normalized) || input.workspaceAssignedRefs.has(normalized)
  )
}

export function filterHaveRefsEligibleForConfirm(
  selectedRefs: string[],
  input: {
    nextOpEligibleRefs: Set<string>
    workspaceAssignedRefs: Set<string>
  }
): { eligibleRefs: string[]; strippedRosterOnlyCount: number } {
  const eligibleRefs: string[] = []
  let strippedRosterOnlyCount = 0

  for (const ref of selectedRefs) {
    const normalized = ref.trim()
    if (!normalized) continue
    if (isHaveRefEligibleForConfirm(normalized, input)) {
      eligibleRefs.push(normalized)
      continue
    }
    strippedRosterOnlyCount += 1
  }

  return { eligibleRefs, strippedRosterOnlyCount }
}

export function resolveAssetKeyFromHaveRef(ref: string): string | null {
  const parsed = parseWorkAssignmentTarget(ref)
  if (parsed.type === 'org_chart_asset' || parsed.type === 'position_asset') {
    return parsed.assetKey
  }
  return null
}

export function assetKeyToHaveRef(
  assetKey: string,
  haveLinkTargetOptions: WorkAssignmentTargetOption[]
): string {
  const positionAsset = haveLinkTargetOptions.find(
    (option) =>
      option.targetType === 'position_asset' && resolveAssetKeyFromHaveRef(option.value) === assetKey
  )
  if (positionAsset) return positionAsset.value

  const orgChartAsset = haveLinkTargetOptions.find(
    (option) =>
      option.targetType === 'org_chart_asset' && resolveAssetKeyFromHaveRef(option.value) === assetKey
  )
  if (orgChartAsset) return orgChartAsset.value

  return encodeLegacyAssetKey(assetKey)
}

export function haveRefsToAssetKeys(refs: string[]): string[] {
  return refs
    .map((ref) => resolveAssetKeyFromHaveRef(ref))
    .filter((key): key is string => Boolean(key))
}

/** @deprecated Use partitionHaveLinkRefs */
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

function collectLinkedRefsInForm(
  workAssignments: Array<{ id: number; resourceValues: Record<string, Ics215ResourceValue> }>,
  exclude?: { rowId: number; columnId: string }
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of workAssignments) {
    for (const [columnId, value] of Object.entries(row.resourceValues ?? {})) {
      if (exclude && exclude.rowId === row.id && exclude.columnId === columnId) continue
      if (!isHaveLinkedToRoster(value)) continue
      for (const ref of getLinkedHaveRefs(value)) {
        counts[ref] = (counts[ref] ?? 0) + 1
      }
    }
  }
  return counts
}

/** @deprecated Use collectLinkedRefsInForm */
export function collectLinkedAssetKeysInForm(
  workAssignments: Array<{ id: number; resourceValues: Record<string, Ics215ResourceValue> }>,
  exclude?: { rowId: number; columnId: string }
): Record<string, number> {
  const refCounts = collectLinkedRefsInForm(workAssignments, exclude)
  const assetCounts: Record<string, number> = {}
  for (const [ref, count] of Object.entries(refCounts)) {
    const assetKey = resolveAssetKeyFromHaveRef(ref)
    if (assetKey) {
      assetCounts[assetKey] = (assetCounts[assetKey] ?? 0) + count
    }
  }
  return assetCounts
}

export function buildHaveLinkIndex(
  workAssignments: Ics215WorkAssignmentRow[],
  resourceColumns: Ics215ResourceColumn[],
  resolveAssigneeLabel: (assigneeKey: string) => string,
  exclude?: { rowId: number; columnId: string }
): Map<string, Ics215HaveLinkLocation> {
  const columnLabelById = new Map(resourceColumns.map((column) => [column.id, column.label]))
  const index = new Map<string, Ics215HaveLinkLocation>()

  for (const row of workAssignments) {
    for (const [columnId, value] of Object.entries(row.resourceValues ?? {})) {
      if (exclude && exclude.rowId === row.id && exclude.columnId === columnId) continue
      if (!isHaveLinkedToRoster(value)) continue
      for (const ref of getLinkedHaveRefs(value)) {
        if (index.has(ref)) continue
        index.set(ref, {
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

/** @deprecated Use buildHaveLinkIndex */
export function buildHaveAssetLinkIndex(
  workAssignments: Ics215WorkAssignmentRow[],
  resourceColumns: Ics215ResourceColumn[],
  resolveAssigneeLabel: (assigneeKey: string) => string,
  exclude?: { rowId: number; columnId: string }
): Map<string, Ics215HaveLinkLocation> {
  const refIndex = buildHaveLinkIndex(
    workAssignments,
    resourceColumns,
    resolveAssigneeLabel,
    exclude
  )
  const assetIndex = new Map<string, Ics215HaveLinkLocation>()
  for (const [ref, location] of refIndex.entries()) {
    const assetKey = resolveAssetKeyFromHaveRef(ref)
    if (assetKey && !assetIndex.has(assetKey)) {
      assetIndex.set(assetKey, location)
    }
  }
  return assetIndex
}

export function isHaveRefLinkedElsewhere(
  ref: string,
  currentCell: { rowId: number; columnId: string },
  index: Map<string, Ics215HaveLinkLocation>
): boolean {
  const location = index.get(ref)
  if (!location) return false
  return location.rowId !== currentCell.rowId || location.columnId !== currentCell.columnId
}

/** @deprecated Use isHaveRefLinkedElsewhere */
export function isAssetLinkedElsewhere(
  assetKey: string,
  currentCell: { rowId: number; columnId: string },
  index: Map<string, Ics215HaveLinkLocation>
): boolean {
  for (const [ref, location] of index.entries()) {
    if (resolveAssetKeyFromHaveRef(ref) !== assetKey) continue
    if (location.rowId !== currentCell.rowId || location.columnId !== currentCell.columnId) {
      return true
    }
  }
  return false
}

export function getConflictingHaveRefs(
  selectedRefs: string[],
  currentCell: { rowId: number; columnId: string },
  index: Map<string, Ics215HaveLinkLocation>
): string[] {
  return selectedRefs.filter((ref) => isHaveRefLinkedElsewhere(ref, currentCell, index))
}

/** @deprecated Use getConflictingHaveRefs */
export function getConflictingHaveAssetKeys(
  selectedKeys: string[],
  currentCell: { rowId: number; columnId: string },
  index: Map<string, Ics215HaveLinkLocation>
): string[] {
  return selectedKeys.filter((key) => isAssetLinkedElsewhere(key, currentCell, index))
}

export function formatHaveLinkLocation(location: Ics215HaveLinkLocation): string {
  const assignment =
    location.workAssignment.trim().length > 0 ? location.workAssignment.trim() : 'Work assignment'
  return `${location.assigneeLabel} · ${assignment} · ${location.columnLabel} Have`
}

/** @deprecated Use formatHaveLinkLocation */
export function formatHaveAssetLinkLocation(location: Ics215HaveLinkLocation): string {
  return formatHaveLinkLocation(location)
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
