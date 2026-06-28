import { useMemo } from 'react'
import { AssetRequestFinanceForm } from '@/features/resources/AssetRequestFinanceForm'
import {
  AssetRequestIncidentDetailsForm,
  type ResourceRequestIncidentOption,
} from '@/features/resources/AssetRequestIncidentDetailsForm'
import { AssetRequestLogisticsForm } from '@/features/resources/AssetRequestLogisticsForm'
import {
  AssetRequestLineItemsSection,
  type AssetRequestItemsView,
} from '@/features/resources/AssetRequestLineItemsSection'
import { AssetRequestPlansForm } from '@/features/resources/AssetRequestPlansForm'
import { AssetRequestRequestedByForm } from '@/features/resources/AssetRequestRequestedByForm'
import { AssetRequestSectionChiefApprovalForm } from '@/features/resources/AssetRequestSectionChiefApprovalForm'
import { AssetRequestTransferSection } from '@/features/resources/AssetRequestTransferSection'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import type {
  AssetTransferConfirmation,
  AssetRequestWorkspaceContext,
  AssetTransferResolveAsset,
  CreateResourceRequestInput,
} from '@/lib/ics-213rr-resource-request'

export type AssetRequestFormBodyProps = {
  formValue: CreateResourceRequestInput
  onChange: (value: CreateResourceRequestInput) => void
  requestedItemsView: AssetRequestItemsView
  onRequestedItemsViewChange: (view: AssetRequestItemsView) => void
  incidentOptions?: ResourceRequestIncidentOption[]
  previewRequestNumber: string
  workspaceContext?: AssetRequestWorkspaceContext | null
  organizationAssets?: ResourceListItemData[]
  orgAssetIdsByKey?: Record<string, string>
  workspaceOptions?: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  glassItemBorderClasses?: string
  resolveAsset?: AssetTransferResolveAsset
  transferConfirmations?: AssetTransferConfirmation[]
}

export function AssetRequestFormBody({
  formValue,
  onChange,
  requestedItemsView,
  onRequestedItemsViewChange,
  incidentOptions = [],
  previewRequestNumber,
  workspaceContext = null,
  organizationAssets = [],
  orgAssetIdsByKey = {},
  workspaceOptions = [],
  positionCatalog = null,
  glassItemBorderClasses = '',
  resolveAsset,
  transferConfirmations = [],
}: AssetRequestFormBodyProps) {
  const assetResolver = useMemo<AssetTransferResolveAsset>(
    () =>
      resolveAsset ??
      ((assetKey) => organizationAssets.find((asset) => asset.assetKey === assetKey) ?? null),
    [organizationAssets, resolveAsset]
  )

  return (
    <div className="space-y-6">
      <AssetRequestIncidentDetailsForm
        value={formValue}
        onChange={onChange}
        incidentOptions={incidentOptions}
        previewRequestNumber={previewRequestNumber}
        workspaceContext={workspaceContext}
      />
      <AssetRequestLineItemsSection
        items={formValue.items}
        view={requestedItemsView}
        onViewChange={onRequestedItemsViewChange}
        onChangeItems={(items) => onChange({ ...formValue, items })}
        organizationAssets={organizationAssets}
        orgAssetIdsByKey={orgAssetIdsByKey}
        workspaceOptions={workspaceOptions}
        positionCatalog={positionCatalog}
        glassItemBorderClasses={glassItemBorderClasses}
        targetWorkspaceId={workspaceContext?.workspaceId ?? null}
      />
      <AssetRequestRequestedByForm value={formValue} onChange={onChange} />
      <AssetRequestSectionChiefApprovalForm value={formValue} onChange={onChange} />
      <AssetRequestPlansForm value={formValue} onChange={onChange} />
      <AssetRequestLogisticsForm value={formValue} onChange={onChange} />
      <AssetRequestFinanceForm value={formValue} onChange={onChange} />
      {workspaceContext ? (
        <AssetRequestTransferSection
          mode="create"
          lineItems={formValue.items}
          workspaceContext={workspaceContext}
          organizationAssets={organizationAssets}
          orgAssetIdsByKey={orgAssetIdsByKey}
          workspaceOptions={workspaceOptions}
          positionCatalog={positionCatalog}
          confirmations={transferConfirmations}
          resolveAsset={assetResolver}
        />
      ) : null}
    </div>
  )
}
