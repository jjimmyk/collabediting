import { Badge } from '@/components/ui/badge'
import type { Ics204ResourceAssignedRow } from '@/features/ics204/types'
import { is215NeedSyncedResourceRow } from '@/features/ics204/sync-ics215-need-asset-requests'
import { is215SyncedResourceRow } from '@/features/ics204/sync-ics215-have-resources'
import type { AssetWorkspaceOption } from '@/features/resources/types'
import {
  getTransferConfirmationStatus,
  type AssetTransferResolveAsset,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'

type Ics204AssetRequestStatusBadgesProps = {
  row: Ics204ResourceAssignedRow
  assetRequestsByStorageId: Record<string, ResourceRequestItem>
  workspaceOptions: AssetWorkspaceOption[]
  resolveAsset: AssetTransferResolveAsset
  pendingWorkspaceAssignment?: boolean
}

function workspaceLabelForId(
  workspaceId: string | null | undefined,
  workspaceOptions: AssetWorkspaceOption[]
): string {
  if (!workspaceId) return 'Unassigned'
  const match = workspaceOptions.find((option) => option.workspaceId === workspaceId)
  return match?.name ?? workspaceId
}

function transferStatusLabel(
  request: ResourceRequestItem,
  assetKey: string,
  resolveAsset: AssetTransferResolveAsset
): string | null {
  if (request.status === 'Pending') return 'Request pending approval'
  if (request.status === 'Denied') return 'Request denied'
  const confirmation = request.assetTransferConfirmations?.find(
    (entry) => entry.assetKey === assetKey
  )
  if (!confirmation) return null
  if (!confirmation.confirmed) return 'Pending owner confirmation'
  const status = getTransferConfirmationStatus(confirmation, resolveAsset)
  if (status === 'pending') return 'Transfer approved'
  if (status === 'applied') return 'Transfer applied'
  if (status === 'already-assigned') return 'Already in workspace'
  return null
}

export function Ics204AssetRequestStatusBadges({
  row,
  assetRequestsByStorageId,
  workspaceOptions,
  resolveAsset,
  pendingWorkspaceAssignment = false,
}: Ics204AssetRequestStatusBadgesProps) {
  const needLink = row.assetRequestNeedLink
  const request = needLink
    ? assetRequestsByStorageId[needLink.assetRequestStorageRecordId]
    : undefined
  const assetKey = row.assetKey ?? row.resourceSnapshot?.assetKey ?? needLink?.assetKey ?? null
  const assignedWorkspaceId =
    assetKey != null ? resolveAsset(assetKey)?.assignedWorkspaceId ?? null : null

  return (
    <div className="flex flex-wrap gap-1">
      {is215SyncedResourceRow(row) ? (
        <Badge variant="secondary" className="text-[10px]">
          From ICS-215 Have
        </Badge>
      ) : row.manualRosterRef ? (
        <Badge variant="outline" className="text-[10px]">
          Manual roster
        </Badge>
      ) : null}
      {is215NeedSyncedResourceRow(row) && needLink ? (
        <Badge variant="secondary" className="text-[10px]">
          Requested · {needLink.assetRequestNumber}
        </Badge>
      ) : null}
      {pendingWorkspaceAssignment ? (
        <Badge variant="outline" className="border-dotted text-[10px] text-amber-700 dark:text-amber-400">
          Pending workspace assignment
        </Badge>
      ) : null}
      {assetKey ? (
        <Badge variant="outline" className="text-[10px]">
          {assignedWorkspaceId
            ? `Assigned: ${workspaceLabelForId(assignedWorkspaceId, workspaceOptions)}`
            : 'Unassigned'}
        </Badge>
      ) : null}
      {request && assetKey ? (
        (() => {
          const label = transferStatusLabel(request, assetKey, resolveAsset)
          if (!label) return null
          return (
            <Badge variant="outline" className="text-[10px]">
              Transfer: {label}
            </Badge>
          )
        })()
      ) : null}
    </div>
  )
}
