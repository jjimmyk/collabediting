import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Ics213rrNumberedBox } from '@/features/resources/ics-213rr-form-layout'
import { OrganizationAssetPickerDialog } from '@/features/resources/OrganizationAssetPickerDialog'
import { ResourceListItemCard } from '@/features/resources/ResourceListItemCard'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import { getOrgChartPlacementLabel } from '@/features/roster/workspace-asset-org-chart'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import { getResourceWorkspaceAssignmentLabel } from '@/features/resources/utils'
import { isOrganizationManagedAssetKey } from '@/lib/organization-asset-catalog'
import {
  canReplaceTransferAsset,
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
import { cn } from '@/lib/utils'
import { ChevronDown, Replace } from 'lucide-react'

type AssetRequestTransferSectionProps = {
  mode: 'create' | 'view'
  lineItems?: AssetRequestLineItem[]
  request?: ResourceRequestItem
  workspaceContext?: AssetRequestWorkspaceContext | null
  organizationAssets: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  workspaceOptions?: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  confirmations: AssetTransferConfirmation[]
  onConfirmationChange?: (assetKey: string, confirmed: boolean) => void
  onApplyTransfers?: () => void
  onReplaceTransferAsset?: (oldAssetKey: string, newAsset: ResourceListItemData) => void
  isApplying?: boolean
  isReplacingTransferAsset?: boolean
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

type TransferAssetRowProps = {
  transferRef: AssetRequestTransferRef
  transferRefs: AssetRequestTransferRef[]
  mode: 'create' | 'view'
  request?: ResourceRequestItem
  confirmation?: AssetTransferConfirmation
  asset?: ResourceListItemData
  targetWorkspaceId: string
  targetWorkspaceName: string
  workspaceOptions: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  organizationAssets: ResourceListItemData[]
  orgAssetIdsByKey: Record<string, string>
  glassItemBorderClasses?: string
  resolveAsset: AssetTransferResolveAsset
  onConfirmationChange?: (assetKey: string, confirmed: boolean) => void
  onReplaceTransferAsset?: (oldAssetKey: string, newAsset: ResourceListItemData) => void
  isReplacingTransferAsset?: boolean
}

function TransferAssetRow({
  transferRef,
  transferRefs,
  mode,
  request,
  confirmation,
  asset,
  targetWorkspaceId,
  targetWorkspaceName,
  workspaceOptions,
  positionCatalog = null,
  organizationAssets,
  orgAssetIdsByKey,
  glassItemBorderClasses = '',
  resolveAsset,
  onConfirmationChange,
  onReplaceTransferAsset,
  isReplacingTransferAsset = false,
}: TransferAssetRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)

  const currentWorkspaceLabel = asset
    ? getResourceWorkspaceAssignmentLabel(asset) || 'Unassigned'
    : workspaceLabelForId(confirmation?.previousWorkspaceId, workspaceOptions)
  const currentAssignmentId = asset?.assignedWorkspaceId ?? confirmation?.previousWorkspaceId ?? null
  const alreadyThere = currentAssignmentId === targetWorkspaceId
  const status = confirmation
    ? getTransferConfirmationStatus(confirmation, resolveAsset)
    : 'skipped'
  const checkboxDisabled = mode === 'create' && alreadyThere
  const canReplace =
    mode === 'view' &&
    request != null &&
    canReplaceTransferAsset(request, transferRef.assetKey, resolveAsset)

  const excludeAssetKeys = useMemo(
    () => transferRefs.map((entry) => entry.assetKey),
    [transferRefs]
  )

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded} className="rounded-md border">
      <div className="grid grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto] items-center gap-2 px-2 py-2 text-xs">
        {mode === 'create' ? (
          <Checkbox
            checked={confirmation?.confirmed ?? false}
            disabled={checkboxDisabled}
            onCheckedChange={(checked) =>
              onConfirmationChange?.(transferRef.assetKey, checked === true)
            }
            aria-label={`Confirm transfer for ${transferRef.name}`}
          />
        ) : (
          <span aria-hidden className="w-4" />
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">
            {assetLabel(transferRef.assetKey, transferRefs, organizationAssets)}
          </p>
          {asset ? (
            <p className="truncate text-[10px] text-muted-foreground">
              Org chart: {getOrgChartPlacementLabel(asset.orgChartReportsTo, positionCatalog)}
            </p>
          ) : null}
        </div>
        <p className="truncate">{currentWorkspaceLabel || 'Unassigned'}</p>
        <p className="truncate">{targetWorkspaceName}</p>
        {mode === 'view' ? (
          <Badge variant={statusBadgeVariant(status)} className="justify-self-start text-[10px]">
            {statusLabel(status)}
          </Badge>
        ) : (
          <span />
        )}
        <div className="flex items-center justify-end gap-1">
          {mode === 'view' && onReplaceTransferAsset ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-[10px]"
                disabled={!canReplace || isReplacingTransferAsset}
                title={
                  canReplace
                    ? 'Replace with a different organization asset'
                    : 'Cannot replace an asset that has already been transferred'
                }
                onClick={() => setReplaceOpen(true)}
              >
                <Replace className="h-3 w-3" />
                Replace
              </Button>
              <OrganizationAssetPickerDialog
                assets={organizationAssets}
                orgAssetIdsByKey={orgAssetIdsByKey}
                glassItemBorderClasses={glassItemBorderClasses}
                selected={[]}
                onChange={() => undefined}
                workspaceOptions={workspaceOptions}
                positionCatalog={positionCatalog}
                idPrefix={`transfer-replace-${transferRef.assetKey}`}
                mode="replace-single"
                excludeAssetKeys={excludeAssetKeys}
                showSelectedSection={false}
                open={replaceOpen}
                onOpenChange={setReplaceOpen}
                hideTrigger
                dialogTitle={`Replace ${transferRef.name || 'asset'}`}
                dialogDescription="Choose a different organization asset to transfer instead. This updates all line items that reference the original asset."
                onReplaceSelect={(newAsset) => onReplaceTransferAsset(transferRef.assetKey, newAsset)}
              />
            </>
          ) : null}
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={expanded ? 'Collapse asset details' : 'Expand asset details'}
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent>
        <div className="border-t bg-muted/10 px-2 py-2">
          {asset ? (
            <ResourceListItemCard
              resource={asset}
              glassItemBorderClasses={glassItemBorderClasses}
              editable={false}
              showEditButton={false}
              showMapAction={false}
              readOnlyWorkspaceAssignmentFields
              organizationManaged={isOrganizationManagedAssetKey(asset.assetKey)}
              workspaceOptions={workspaceOptions}
              showCollapsedAssignmentSummary
              orgChartPlacementLabel={getOrgChartPlacementLabel(
                asset.orgChartReportsTo,
                positionCatalog
              )}
              defaultOpen
              showInlineAssignment={false}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Asset details are unavailable. The asset may have been removed from the organization
              catalog.
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AssetRequestTransferSection({
  mode,
  lineItems = [],
  request,
  workspaceContext = null,
  organizationAssets,
  orgAssetIdsByKey = {},
  workspaceOptions = [],
  positionCatalog = null,
  confirmations,
  onConfirmationChange,
  onApplyTransfers,
  onReplaceTransferAsset,
  isApplying = false,
  isReplacingTransferAsset = false,
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
          : `Review assets marked for transfer to ${targetWorkspaceName}. Expand each asset for full details, replace if needed, then apply transfers when ready.`}
      </p>

      <div className="mb-2 hidden gap-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
        {mode === 'create' ? <span>Confirm</span> : null}
        <span>Asset</span>
        <span>Current workspace</span>
        <span>Target workspace</span>
        {mode === 'view' ? <span>Status</span> : <span />}
        <span className="text-right">Actions</span>
      </div>

      <div className="space-y-2">
        {transferRefs.map((transferRef) => {
          const confirmation = confirmations.find((entry) => entry.assetKey === transferRef.assetKey)
          const asset = organizationAssets.find((entry) => entry.assetKey === transferRef.assetKey)
          return (
            <TransferAssetRow
              key={transferRef.assetKey}
              transferRef={transferRef}
              transferRefs={transferRefs}
              mode={mode}
              request={request}
              confirmation={confirmation}
              asset={asset}
              targetWorkspaceId={targetWorkspaceId}
              targetWorkspaceName={targetWorkspaceName}
              workspaceOptions={workspaceOptions}
              positionCatalog={positionCatalog}
              organizationAssets={organizationAssets}
              orgAssetIdsByKey={orgAssetIdsByKey}
              resolveAsset={resolveAsset}
              onConfirmationChange={onConfirmationChange}
              onReplaceTransferAsset={onReplaceTransferAsset}
              isReplacingTransferAsset={isReplacingTransferAsset}
            />
          )
        })}
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
