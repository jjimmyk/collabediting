import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Ics213rrNumberedBox } from '@/features/resources/ics-213rr-form-layout'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import { getResourceWorkspaceAssignmentLabel } from '@/features/resources/utils'
import {
  collectUniqueTransferAssets,
  getTransferConfirmationStatus,
  type AssetRequestLineItem,
  type AssetRequestTransferRef,
  type AssetRequestWorkspaceContext,
  type AssetTransferConfirmation,
  type AssetTransferResolveAsset,
  type AssetTransferStatus,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'

type AssetRequestTransferSectionProps = {
  mode: 'create' | 'view'
  lineItems?: AssetRequestLineItem[]
  request?: ResourceRequestItem
  workspaceContext?: AssetRequestWorkspaceContext | null
  organizationAssets: ResourceListItemData[]
  workspaceOptions?: AssetWorkspaceOption[]
  confirmations: AssetTransferConfirmation[]
  onConfirmationChange?: (assetKey: string, confirmed: boolean) => void
  onApplyTransfers?: () => void
  isApplying?: boolean
  resolveAsset: AssetTransferResolveAsset
}

function workspaceLabelForId(
  workspaceId: string | null | undefined,
  workspaceOptions: AssetWorkspaceOption[]
): string {
  if (!workspaceId) return 'Unassigned'
  const match = workspaceOptions.find((option) => option.workspaceId === workspaceId)
  return match?.name ?? workspaceId
}

function assetLabel(
  assetKey: string,
  transferRefs: AssetRequestTransferRef[],
  organizationAssets: ResourceListItemData[]
): string {
  const ref = transferRefs.find((entry) => entry.assetKey === assetKey)
  if (ref?.name) return `${ref.name} · ${ref.type || 'Asset'}`
  const asset = organizationAssets.find((entry) => entry.assetKey === assetKey)
  if (asset) return `${asset.name} · ${asset.type || 'Asset'}`
  return assetKey
}

function statusLabel(status: AssetTransferStatus): string {
  if (status === 'pending') return 'Pending'
  if (status === 'applied') return 'Applied'
  if (status === 'already-assigned') return 'Already assigned'
  return 'Skipped'
}

function statusBadgeVariant(
  status: AssetTransferStatus
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'pending') return 'default'
  if (status === 'applied') return 'secondary'
  if (status === 'already-assigned') return 'outline'
  return 'outline'
}

export function AssetRequestTransferSection({
  mode,
  lineItems = [],
  request,
  workspaceContext = null,
  organizationAssets,
  workspaceOptions = [],
  confirmations,
  onConfirmationChange,
  onApplyTransfers,
  isApplying = false,
  resolveAsset,
}: AssetRequestTransferSectionProps) {
  const targetWorkspaceId =
    workspaceContext?.workspaceId ?? request?.sourceWorkspaceId ?? null
  const targetWorkspaceName =
    workspaceContext?.workspaceName ?? request?.sourceWorkspaceName ?? request?.incidentName ?? ''

  const transferRefs =
    mode === 'create'
      ? collectUniqueTransferAssets(lineItems)
      : collectUniqueTransferAssets(request?.items ?? [])

  const pendingCount =
    mode === 'view' && request
      ? confirmations.filter(
          (confirmation) =>
            confirmation.confirmed &&
            getTransferConfirmationStatus(confirmation, resolveAsset) === 'pending'
        ).length
      : 0

  if (!targetWorkspaceId) {
    if (mode === 'create') return null
    return (
      <Ics213rrNumberedBox title="Asset Transfer">
        <p className="text-xs text-muted-foreground">
          This request is not linked to a workspace. Asset transfers are only available for
          workspace-created requests.
        </p>
      </Ics213rrNumberedBox>
    )
  }

  if (transferRefs.length === 0) {
    return (
      <Ics213rrNumberedBox title="Asset Transfer">
        <p className="text-xs text-muted-foreground">
          No assets selected for transfer in requested items.
        </p>
      </Ics213rrNumberedBox>
    )
  }

  return (
    <Ics213rrNumberedBox title="Asset Transfer">
      <p className="mb-3 text-xs text-muted-foreground">
        {mode === 'create'
          ? `Confirm which assets should be transferred to ${targetWorkspaceName} after the request is created. Use Apply Transfers on the request detail to execute.`
          : `Review assets marked for transfer to ${targetWorkspaceName}. Update each asset's Incident / Exercise workspace assignment when ready.`}
      </p>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[720px] border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-muted-foreground">
              {mode === 'create' ? (
                <th className="px-2 py-2 font-semibold">Confirm</th>
              ) : null}
              <th className="px-2 py-2 font-semibold">Asset</th>
              <th className="px-2 py-2 font-semibold">Current workspace</th>
              <th className="px-2 py-2 font-semibold">Target workspace</th>
              {mode === 'view' ? <th className="px-2 py-2 font-semibold">Status</th> : null}
            </tr>
          </thead>
          <tbody>
            {transferRefs.map((ref) => {
              const confirmation = confirmations.find((entry) => entry.assetKey === ref.assetKey)
              const asset = organizationAssets.find((entry) => entry.assetKey === ref.assetKey)
              const currentWorkspaceLabel = asset
                ? getResourceWorkspaceAssignmentLabel(asset) || 'Unassigned'
                : workspaceLabelForId(confirmation?.previousWorkspaceId, workspaceOptions)
              const currentAssignmentId = asset?.assignedWorkspaceId ?? confirmation?.previousWorkspaceId ?? null
              const alreadyThere = currentAssignmentId === targetWorkspaceId
              const status = confirmation
                ? getTransferConfirmationStatus(confirmation, resolveAsset)
                : 'skipped'
              const checkboxDisabled = mode === 'create' && alreadyThere

              return (
                <tr key={ref.assetKey} className="border-b">
                  {mode === 'create' ? (
                    <td className="px-2 py-2">
                      <Checkbox
                        checked={confirmation?.confirmed ?? false}
                        disabled={checkboxDisabled}
                        onCheckedChange={(checked) =>
                          onConfirmationChange?.(ref.assetKey, checked === true)
                        }
                        aria-label={`Confirm transfer for ${ref.name}`}
                      />
                    </td>
                  ) : null}
                  <td className="px-2 py-2 font-medium">
                    {assetLabel(ref.assetKey, transferRefs, organizationAssets)}
                  </td>
                  <td className="px-2 py-2">{currentWorkspaceLabel || 'Unassigned'}</td>
                  <td className="px-2 py-2">{targetWorkspaceName}</td>
                  {mode === 'view' ? (
                    <td className="px-2 py-2">
                      <Badge variant={statusBadgeVariant(status)} className="text-[10px]">
                        {statusLabel(status)}
                      </Badge>
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {mode === 'view' ? (
        <div className="mt-3 flex items-center justify-end gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pendingCount === 0 || isApplying}
            onClick={() => onApplyTransfers?.()}
          >
            {isApplying
              ? 'Applying transfers…'
              : pendingCount > 0
                ? `Apply Transfers (${pendingCount})`
                : 'Apply Transfers'}
          </Button>
        </div>
      ) : null}
    </Ics213rrNumberedBox>
  )
}
