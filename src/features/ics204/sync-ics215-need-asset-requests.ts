import { isIcs204WorkAssignmentsLinkedToIcs215 } from '@/features/ics204/sync-ics215-work-assignments'
import type { Ics204AssetRequestNeedLink, Ics204FormState, Ics204ResourceAssignedRow } from '@/features/ics204/types'
import {
  createIcs204ResourceAssignedRowFromAssetRequestAsset,
  getIcs204ResourceRowAssetKey,
} from '@/features/ics204/utils'
import { collectHaveRefsForAssignee } from '@/features/ics204/sync-ics215-have-resources'
import type { Ics204HaveResourcesSyncContext } from '@/features/ics204/sync-ics215-have-resources'
import type { Ics215FormState } from '@/features/ics215/types'
import {
  getResourceRequestLineItems,
  type AssetTransferResolveAsset,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'
import type { AssetWorkspaceOption } from '@/features/resources/types'
import { normalizeWorkAssignmentTargetKey } from '@/lib/work-assignment-target'
import type { WorkspaceRosterMember } from '@/lib/workspace-types'

export type Ics204NeedAssetRequestSyncContext = Ics204HaveResourcesSyncContext & {
  assetRequestsByStorageId: Record<string, ResourceRequestItem>
  workspaceOptions: AssetWorkspaceOption[]
  resolveAsset: AssetTransferResolveAsset
}

export type NeedLinkedAssetEntry = {
  assetKey: string
  link: Ics204AssetRequestNeedLink
  reportingInfoNotes: string
}

function needRowKey(link: Ics204AssetRequestNeedLink): string {
  return `${link.assetRequestStorageRecordId}:${link.assetKey}`
}

function nextResourceRowId(rows: Ics204ResourceAssignedRow[]): number {
  if (rows.length === 0) return 1
  return Math.max(...rows.map((row) => row.id)) + 1
}

export function collectNeedLinkedAssetsForAssignee(
  ics215Form: Ics215FormState,
  assignee: string,
  assetRequestsByStorageId: Record<string, ResourceRequestItem>,
  roster: WorkspaceRosterMember[] = []
): NeedLinkedAssetEntry[] {
  const assigneeKey = normalizeWorkAssignmentTargetKey(assignee, roster)
  if (!assigneeKey) return []

  const entries: NeedLinkedAssetEntry[] = []
  const seen = new Set<string>()

  for (const row of ics215Form.workAssignments) {
    if (normalizeWorkAssignmentTargetKey(row.assignee, roster) !== assigneeKey) continue
    for (const [columnId, value] of Object.entries(row.resourceValues ?? {})) {
      const linkRef = value?.linkedNeedAssetRequest
      const storageRecordId = linkRef?.assetRequestStorageRecordId?.trim()
      if (!storageRecordId || !linkRef) continue
      const request = assetRequestsByStorageId[storageRecordId]
      if (!request) continue

      for (const item of getResourceRequestLineItems(request)) {
        for (const ref of item.assetsToTransfer) {
          const assetKey = ref.assetKey.trim()
          if (!assetKey) continue
          const dedupeKey = needRowKey({
            assetRequestStorageRecordId: storageRecordId,
            assetRequestNumber: linkRef.assetRequestNumber,
            ics215RowId: row.id,
            ics215ColumnId: columnId,
            assetKey,
          })
          if (seen.has(dedupeKey)) continue
          seen.add(dedupeKey)
          entries.push({
            assetKey,
            link: {
              assetRequestStorageRecordId: storageRecordId,
              assetRequestNumber: linkRef.assetRequestNumber,
              ics215RowId: row.id,
              ics215ColumnId: columnId,
              assetKey,
            },
            reportingInfoNotes: [row.reportingLocation.trim(), request.requestNumber.trim()]
              .filter(Boolean)
              .join(' · '),
          })
        }
      }
    }
  }

  return entries
}

export function mergeResourcesAssignedFrom215Need(
  existingRows: Ics204ResourceAssignedRow[],
  incoming: NeedLinkedAssetEntry[],
  context: Ics204NeedAssetRequestSyncContext
): Ics204ResourceAssignedRow[] {
  const incomingKeys = new Set(incoming.map((entry) => needRowKey(entry.link)))

  const preserved = existingRows.filter((row) => {
    const link = row.assetRequestNeedLink
    if (!link?.assetRequestStorageRecordId?.trim()) return true
    return incomingKeys.has(needRowKey(link))
  })

  const byAssetKey = new Map<string, Ics204ResourceAssignedRow>()
  for (const row of preserved) {
    const assetKey = getIcs204ResourceRowAssetKey(row)
    if (assetKey) byAssetKey.set(assetKey, row)
  }

  const result = [...preserved]
  let nextId = nextResourceRowId(result)

  for (const entry of incoming) {
    const existing = byAssetKey.get(entry.assetKey)
    const refreshed = createIcs204ResourceAssignedRowFromAssetRequestAsset(
      existing?.id ?? nextId++,
      entry,
      context,
      existing
    )
    if (existing) {
      const index = result.indexOf(existing)
      result[index] = refreshed
      byAssetKey.set(entry.assetKey, refreshed)
    } else {
      result.push(refreshed)
      byAssetKey.set(entry.assetKey, refreshed)
    }
  }

  return result
}

export function syncIcs204ResourcesAssignedFromIcs215Need(
  ics204Form: Ics204FormState,
  ics215Form: Ics215FormState,
  context: Ics204NeedAssetRequestSyncContext
): Ics204FormState {
  const assignee = ics204Form.assignedUnit.trim()
  if (!assignee) return ics204Form

  const incoming = collectNeedLinkedAssetsForAssignee(
    ics215Form,
    assignee,
    context.assetRequestsByStorageId,
    context.roster
  )

  return {
    ...ics204Form,
    resourcesAssigned: mergeResourcesAssignedFrom215Need(
      ics204Form.resourcesAssigned,
      incoming,
      context
    ),
  }
}

export function findIcs204FormsFor215NeedSync(
  ics204Forms: Ics204FormState[],
  ics215Form: Ics215FormState | null,
  assetRequestsByStorageId: Record<string, ResourceRequestItem>
): Ics204FormState[] {
  if (!ics215Form) return []
  return ics204Forms.filter((form) => {
    const assignee = form.assignedUnit.trim()
    if (!assignee) return false
    if (isIcs204WorkAssignmentsLinkedToIcs215(form, ics215Form)) return true
    if (collectHaveRefsForAssignee(ics215Form, assignee).length > 0) return true
    return (
      collectNeedLinkedAssetsForAssignee(
        ics215Form,
        assignee,
        assetRequestsByStorageId
      ).length > 0
    )
  })
}

export function syncIcs215NeedAssetRequestsToLinkedIcs204Forms(
  ics215Form: Ics215FormState,
  ics204Forms: Ics204FormState[],
  context: Ics204NeedAssetRequestSyncContext,
  skipFormIds: Set<string> = new Set()
): Ics204FormState[] {
  return findIcs204FormsFor215NeedSync(
    ics204Forms,
    ics215Form,
    context.assetRequestsByStorageId
  )
    .filter((form) => !skipFormIds.has(form.id))
    .map((form) => syncIcs204ResourcesAssignedFromIcs215Need(form, ics215Form, context))
}

export function is215NeedSyncedResourceRow(row: Ics204ResourceAssignedRow): boolean {
  return Boolean(row.assetRequestNeedLink?.assetRequestStorageRecordId?.trim())
}
