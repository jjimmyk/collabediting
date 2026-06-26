import { isIcs204WorkAssignmentsLinkedToIcs215 } from '@/features/ics204/sync-ics215-work-assignments'
import type { Ics204FormState, Ics204ResourceAssignedRow } from '@/features/ics204/types'
import {
  createIcs204ResourceAssignedRowFromRosterRef,
  getIcs204ResourceRowRefKey,
} from '@/features/ics204/utils'
import {
  getLinkedHaveRefs,
  removeHaveRosterLinkRefs,
  resolveAssetKeyFromHaveRef,
} from '@/features/ics215/ics215-have-asset-link'
import type { Ics215FormState } from '@/features/ics215/types'
import type { ResourceListItemData } from '@/features/resources/types'
import type { PositionResourceCategoryEntry } from '@/lib/workspace-resource-category-types'
import { normalizeWorkAssignmentTargetKey } from '@/lib/work-assignment-target'
import type { WorkAssignmentTargetOption } from '@/lib/work-assignment-target-options'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type Ics204HaveResourcesSyncContext = {
  roster: WorkspaceRosterMember[]
  assetsByKey: Record<string, ResourceListItemData>
  resourceCategoriesById?: Record<
    string,
    PositionResourceCategoryEntry & { positionName?: string }
  >
  haveLinkTargetOptions: WorkAssignmentTargetOption[]
}

export function collectHaveRefsForAssignee(
  ics215Form: Ics215FormState,
  assignee: string,
  roster: WorkspaceRosterMember[] = []
): string[] {
  const assigneeKey = normalizeWorkAssignmentTargetKey(assignee, roster)
  if (!assigneeKey) return []

  const refs = new Set<string>()
  for (const row of ics215Form.workAssignments) {
    if (normalizeWorkAssignmentTargetKey(row.assignee, roster) !== assigneeKey) continue
    for (const value of Object.values(row.resourceValues ?? {})) {
      for (const ref of getLinkedHaveRefs(value)) {
        refs.add(ref)
      }
    }
  }
  return [...refs]
}

export function collectExistingResourceRefKeys(
  rows: Ics204ResourceAssignedRow[]
): Set<string> {
  const keys = new Set<string>()
  for (const row of rows) {
    const refKey = getIcs204ResourceRowRefKey(row)
    if (refKey) keys.add(refKey)
    const assetKey = row.assetKey ?? row.resourceSnapshot?.assetKey ?? null
    if (assetKey && !assetKey.startsWith('ics204-roster-') && !assetKey.startsWith('ics204-empty-')) {
      keys.add(`org_chart_asset:${assetKey}`)
    }
  }
  return keys
}

function nextResourceRowId(rows: Ics204ResourceAssignedRow[]): number {
  if (rows.length === 0) return 1
  return Math.max(...rows.map((row) => row.id)) + 1
}

function refreshSyncedResourceRow(
  existing: Ics204ResourceAssignedRow | undefined,
  ref: string,
  context: Ics204HaveResourcesSyncContext
): Ics204ResourceAssignedRow {
  const built = createIcs204ResourceAssignedRowFromRosterRef(
    existing?.id ?? nextResourceRowId([]),
    ref,
    context,
    {
      reportingInfoNotes: existing?.reportingInfoNotes ?? '',
      has204A: existing?.has204A ?? false,
      ics204a: existing?.ics204a ?? null,
    }
  )
  return {
    ...built,
    rosterHaveRef: ref,
    manualRosterRef: null,
  }
}

export function mergeResourcesAssignedFrom215(
  existingRows: Ics204ResourceAssignedRow[],
  incoming215Refs: string[],
  context: Ics204HaveResourcesSyncContext
): Ics204ResourceAssignedRow[] {
  const manualRows = existingRows.filter((row) => !row.rosterHaveRef?.trim())
  const existingSyncedByRef = new Map<string, Ics204ResourceAssignedRow>()
  for (const row of existingRows) {
    const ref = row.rosterHaveRef?.trim()
    if (ref) existingSyncedByRef.set(ref, row)
  }

  const incomingSet = new Set(incoming215Refs.map((ref) => ref.trim()).filter(Boolean))
  const syncedRows: Ics204ResourceAssignedRow[] = []
  let nextId = nextResourceRowId([...manualRows, ...existingRows])

  for (const ref of incomingSet) {
    const existing = existingSyncedByRef.get(ref)
    const row = refreshSyncedResourceRow(existing, ref, context)
    syncedRows.push({
      ...row,
      id: existing?.id ?? nextId++,
    })
  }

  return [...manualRows, ...syncedRows]
}

export function syncIcs204ResourcesAssignedFromIcs215(
  ics204Form: Ics204FormState,
  ics215Form: Ics215FormState,
  context: Ics204HaveResourcesSyncContext
): Ics204FormState {
  const assignee = ics204Form.assignedUnit.trim()
  if (!assignee) return ics204Form

  const incomingRefs = collectHaveRefsForAssignee(ics215Form, assignee, context.roster)
  return {
    ...ics204Form,
    resourcesAssigned: mergeResourcesAssignedFrom215(
      ics204Form.resourcesAssigned,
      incomingRefs,
      context
    ),
  }
}

export function findIcs204FormsFor215ResourceSync(
  ics204Forms: Ics204FormState[],
  ics215Form: Ics215FormState | null
): Ics204FormState[] {
  if (!ics215Form) return []
  return ics204Forms.filter((form) => {
    const assignee = form.assignedUnit.trim()
    if (!assignee) return false
    if (isIcs204WorkAssignmentsLinkedToIcs215(form, ics215Form)) return true
    return collectHaveRefsForAssignee(ics215Form, assignee).length > 0
  })
}

export function syncIcs215HaveResourcesToLinkedIcs204Forms(
  ics215Form: Ics215FormState,
  ics204Forms: Ics204FormState[],
  context: Ics204HaveResourcesSyncContext,
  skipFormIds: Set<string> = new Set()
): Ics204FormState[] {
  return findIcs204FormsFor215ResourceSync(ics204Forms, ics215Form)
    .filter((form) => !skipFormIds.has(form.id))
    .map((form) => syncIcs204ResourcesAssignedFromIcs215(form, ics215Form, context))
}

export function unlinkHaveRefFromIcs215Form(
  ics215Form: Ics215FormState,
  assignee: string,
  ref: string,
  context: Ics204HaveResourcesSyncContext
): Ics215FormState {
  const assigneeKey = normalizeWorkAssignmentTargetKey(assignee, context.roster)
  const trimmedRef = ref.trim()
  if (!assigneeKey || !trimmedRef) return ics215Form

  return {
    ...ics215Form,
    workAssignments: ics215Form.workAssignments.map((row) => {
      if (normalizeWorkAssignmentTargetKey(row.assignee, context.roster) !== assigneeKey) {
        return row
      }
      return {
        ...row,
        resourceValues: Object.fromEntries(
          Object.entries(row.resourceValues ?? {}).map(([columnId, value]) => [
            columnId,
            removeHaveRosterLinkRefs(value, [trimmedRef], context.haveLinkTargetOptions),
          ])
        ),
      }
    }),
  }
}

export function buildInitialResourcesAssignedFromIcs215(
  ics215Form: Ics215FormState,
  assignee: string,
  context: Ics204HaveResourcesSyncContext
): Ics204ResourceAssignedRow[] {
  const refs = collectHaveRefsForAssignee(ics215Form, assignee, context.roster)
  return mergeResourcesAssignedFrom215([], refs, context)
}

export function createManualIcs204ResourceAssignedRowFromRef(
  rows: Ics204ResourceAssignedRow[],
  ref: string,
  context: Ics204HaveResourcesSyncContext
): Ics204ResourceAssignedRow {
  const built = createIcs204ResourceAssignedRowFromRosterRef(
    nextResourceRowId(rows),
    ref,
    context
  )
  return {
    ...built,
    rosterHaveRef: null,
    manualRosterRef: ref,
  }
}

export function resolveHaveRefAssetKey(ref: string): string | null {
  return resolveAssetKeyFromHaveRef(ref)
}

export function is215SyncedResourceRow(row: Ics204ResourceAssignedRow): boolean {
  return Boolean(row.rosterHaveRef?.trim())
}
