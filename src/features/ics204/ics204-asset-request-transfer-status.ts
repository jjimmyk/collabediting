import type { Ics204ResourceAssignedRow } from '@/features/ics204/types'
import { getIcs204ResourceRowAssetKey } from '@/features/ics204/utils'
import {
  getTransferConfirmationStatus,
  type AssetTransferResolveAsset,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'

export function isIcs204ResourcePendingWorkspaceAssignment(
  row: Ics204ResourceAssignedRow,
  request: ResourceRequestItem | undefined,
  resolveAsset: AssetTransferResolveAsset
): boolean {
  if (!row.assetRequestNeedLink?.assetRequestStorageRecordId?.trim()) return false
  if (!request?.sourceWorkspaceId) return false

  const assetKey = getIcs204ResourceRowAssetKey(row)
  if (!assetKey) return false

  const asset = resolveAsset(assetKey)
  if (asset?.assignedWorkspaceId === request.sourceWorkspaceId) return false

  const confirmation = request.assetTransferConfirmations?.find(
    (entry) => entry.assetKey === assetKey
  )
  if (!confirmation) return true
  if (!confirmation.confirmed) return true

  const status = getTransferConfirmationStatus(confirmation, resolveAsset)
  return status !== 'applied' && status !== 'already-assigned'
}
