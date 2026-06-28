import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { AssetListHeaderRow } from '@/features/resources/AssetListHeaderRow'
import { AssetOrgChartPlacementSelect } from '@/features/resources/AssetOrgChartPlacementSelect'
import { AssignAssetToWorkspacePicker } from '@/features/resources/AssignAssetToWorkspacePicker'
import { ResourceListItemCard } from '@/features/resources/ResourceListItemCard'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import { getAssetMapKey } from '@/data/hub-asset-catalog'
import { isOrganizationManagedAssetKey } from '@/lib/organization-asset-catalog'
import type { WorkspaceMemberCheckInStatus } from '@/lib/workspace-types'
import { cn } from '@/lib/utils'

type WorkspaceAssignedAssetsPanelProps = {
  assets: ResourceListItemData[]
  unassignedAssets: ResourceListItemData[]
  workspaceOptions: AssetWorkspaceOption[]
  glassItemBorderClasses: string
  workspaceLabel: string
  activeWorkspaceSupabaseId?: string | null
  isLoading?: boolean
  assignmentDisabled?: boolean
  positionCatalog?: WorkspacePositionCatalog
  orgChartDisabled?: boolean
  updatingAssetCheckInKey?: string | null
  onFocusMap?: (asset: ResourceListItemData) => void
  onAssignmentChange: (assetKey: string, workspaceId: string | null) => void
  onOrgChartPlacementChange?: (assetKey: string, reportsTo: string | null) => void
  onAssignAsset?: (assetKey: string) => void
  onUpdateOrganizationAsset?: (resource: ResourceListItemData) => void
  onAssetCheckInStatusChange?: (assetKey: string, status: WorkspaceMemberCheckInStatus) => void
  ics204LabelsByDocumentId?: Record<string, string>
}

export function WorkspaceAssignedAssetsPanel({
  assets,
  unassignedAssets,
  workspaceOptions,
  glassItemBorderClasses,
  workspaceLabel,
  activeWorkspaceSupabaseId = null,
  isLoading = false,
  assignmentDisabled = false,
  positionCatalog,
  orgChartDisabled = false,
  updatingAssetCheckInKey = null,
  onFocusMap,
  onAssignmentChange,
  onOrgChartPlacementChange,
  onAssignAsset,
  onUpdateOrganizationAsset,
  onAssetCheckInStatusChange,
  ics204LabelsByDocumentId,
}: WorkspaceAssignedAssetsPanelProps) {
  const [expandedAssetKey, setExpandedAssetKey] = useState<string | null>(null)

  if (isLoading) {
    return (
      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent>
          <ItemTitle>Loading assigned assets…</ItemTitle>
        </ItemContent>
      </Item>
    )
  }

  if (assets.length === 0) {
    return (
      <div className="space-y-3">
        <Item variant="outline" className={glassItemBorderClasses}>
          <ItemContent>
            <ItemTitle>No assets assigned</ItemTitle>
            <ItemDescription>
              No assets are currently assigned to {workspaceLabel}. Choose an unassigned asset
              below to assign one to this workspace.
            </ItemDescription>
          </ItemContent>
        </Item>
        {onAssignAsset ? (
          <div className={cn('rounded-md border px-3 py-2.5', glassItemBorderClasses)}>
            <AssignAssetToWorkspacePicker
              assets={unassignedAssets}
              disabled={assignmentDisabled}
              onAssign={onAssignAsset}
            />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <p className="text-xs text-muted-foreground">
          {assets.length} {assets.length === 1 ? 'asset' : 'assets'} assigned to this workspace
        </p>
      </div>
      <div className="flex flex-col gap-2 px-0.5 pt-1">
        <AssetListHeaderRow />
        {assets.map((asset) => {
          const mapKey = getAssetMapKey(asset.assetKey)
          const isOpen = expandedAssetKey === mapKey
          const isOrgAsset = isOrganizationManagedAssetKey(asset.assetKey)

          return (
            <ResourceListItemCard
              key={asset.assetKey}
              resource={asset}
              glassItemBorderClasses={glassItemBorderClasses}
              open={isOpen}
              editable={isOrgAsset}
              organizationManaged={isOrgAsset}
              onSave={isOrgAsset ? onUpdateOrganizationAsset : undefined}
              readOnlyWorkspaceAssignmentFields={!isOrgAsset}
              workspaceOptions={workspaceOptions}
              assignmentDisabled={assignmentDisabled}
              showInlineAssignment
              onAssignmentChange={(workspaceId) => onAssignmentChange(asset.assetKey, workspaceId)}
              canEditAssetCheckInStatus={Boolean(
                asset.assignedWorkspaceId &&
                  asset.assignedWorkspaceId === activeWorkspaceSupabaseId
              )}
              isUpdatingAssetCheckInStatus={updatingAssetCheckInKey === asset.assetKey}
              onAssetCheckInStatusChange={
                onAssetCheckInStatusChange
                  ? (status) => onAssetCheckInStatusChange(asset.assetKey, status)
                  : undefined
              }
              onOpenChange={(open) => setExpandedAssetKey(open ? mapKey : null)}
              onHeaderClick={() =>
                setExpandedAssetKey((previous) => (previous === mapKey ? null : mapKey))
              }
              onFocusMap={
                onFocusMap
                  ? () => {
                      onFocusMap(asset)
                    }
                  : undefined
              }
              headerAddon={
                asset.ics204DocumentId &&
                ics204LabelsByDocumentId?.[asset.ics204DocumentId] ? (
                  <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                    ICS-204: {ics204LabelsByDocumentId[asset.ics204DocumentId]}
                  </Badge>
                ) : null
              }
              footerAddon={
                positionCatalog && onOrgChartPlacementChange ? (
                  <div className="border-t px-3 py-2" onClick={(event) => event.stopPropagation()}>
                    <AssetOrgChartPlacementSelect
                      value={asset.orgChartReportsTo}
                      catalog={positionCatalog}
                      disabled={orgChartDisabled || assignmentDisabled}
                      onChange={(reportsTo) =>
                        onOrgChartPlacementChange(asset.assetKey, reportsTo)
                      }
                    />
                  </div>
                ) : null
              }
            />
          )
        })}
      </div>
      {onAssignAsset && unassignedAssets.length > 0 ? (
        <div className={cn('rounded-md border px-3 py-2.5', glassItemBorderClasses)}>
          <AssignAssetToWorkspacePicker
            assets={unassignedAssets}
            disabled={assignmentDisabled}
            label="Assign another asset"
            onAssign={onAssignAsset}
          />
        </div>
      ) : null}
    </div>
  )
}

export { getAssetMapKey }
