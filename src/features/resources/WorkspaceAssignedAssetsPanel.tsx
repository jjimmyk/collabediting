import { Map as MapIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import { AssetStatusIndicator } from '@/features/resources/AssetStatusIndicator'
import { AssetWorkspaceAssignmentSelect } from '@/features/resources/AssetWorkspaceAssignmentSelect'
import { AssignAssetToWorkspacePicker } from '@/features/resources/AssignAssetToWorkspacePicker'
import { AssetOrgChartPlacementSelect } from '@/features/resources/AssetOrgChartPlacementSelect'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import { getAssetMapKey } from '@/data/hub-asset-catalog'
import { cn } from '@/lib/utils'

type WorkspaceAssignedAssetsPanelProps = {
  assets: ResourceListItemData[]
  unassignedAssets: ResourceListItemData[]
  workspaceOptions: AssetWorkspaceOption[]
  glassItemBorderClasses: string
  workspaceLabel: string
  isLoading?: boolean
  assignmentDisabled?: boolean
  positionCatalog?: WorkspacePositionCatalog
  orgChartDisabled?: boolean
  onFocusMap?: (asset: ResourceListItemData) => void
  onAssignmentChange: (assetKey: string, workspaceId: string | null) => void
  onOrgChartPlacementChange?: (assetKey: string, reportsTo: string | null) => void
  onAssignAsset?: (assetKey: string) => void
  onOpenHubAssets?: () => void
  ics204LabelsByDocumentId?: Record<string, string>
}

export function WorkspaceAssignedAssetsPanel({
  assets,
  unassignedAssets,
  workspaceOptions,
  glassItemBorderClasses,
  workspaceLabel,
  isLoading = false,
  assignmentDisabled = false,
  positionCatalog,
  orgChartDisabled = false,
  onFocusMap,
  onAssignmentChange,
  onOrgChartPlacementChange,
  onAssignAsset,
  onOpenHubAssets,
  ics204LabelsByDocumentId,
}: WorkspaceAssignedAssetsPanelProps) {
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
              below or manage assignments from the hub Assets tab.
            </ItemDescription>
          </ItemContent>
          {onOpenHubAssets ? (
            <ItemActions>
              <Button type="button" size="sm" variant="outline" onClick={onOpenHubAssets}>
                Open Hub Assets
              </Button>
            </ItemActions>
          ) : null}
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
        {onOpenHubAssets ? (
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={onOpenHubAssets}>
            Open Hub Assets
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 px-0.5">
        {assets.map((asset) => (
          <Item
            key={asset.assetKey}
            variant="outline"
            className={cn('flex flex-col items-stretch gap-2 px-3 py-2.5', glassItemBorderClasses)}
          >
            <div className="flex items-center gap-2">
              <ItemContent className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <AssetStatusIndicator status={asset.assetStatus} showLabel={false} />
                  <div className="min-w-0">
                    <ItemTitle className="truncate text-sm">{asset.name}</ItemTitle>
                    <ItemDescription className="truncate">
                      {asset.type} · {asset.owner}
                    </ItemDescription>
                    {asset.ics204DocumentId &&
                    ics204LabelsByDocumentId?.[asset.ics204DocumentId] ? (
                      <Badge variant="secondary" className="mt-1 w-fit text-[10px]">
                        ICS-204: {ics204LabelsByDocumentId[asset.ics204DocumentId]}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </ItemContent>
              <ItemActions>
                {onFocusMap ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Zoom map to ${asset.name}`}
                    onClick={() => onFocusMap(asset)}
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                ) : null}
              </ItemActions>
            </div>
            <div className="space-y-1" onClick={(event) => event.stopPropagation()}>
              <Label className="text-[11px] text-muted-foreground">Incident / Exercise workspace</Label>
              <AssetWorkspaceAssignmentSelect
                value={asset.assignedWorkspaceId}
                options={workspaceOptions}
                compact
                disabled={assignmentDisabled}
                onChange={(workspaceId) => onAssignmentChange(asset.assetKey, workspaceId)}
              />
            </div>
            {positionCatalog && onOrgChartPlacementChange ? (
              <div onClick={(event) => event.stopPropagation()}>
                <AssetOrgChartPlacementSelect
                  value={asset.orgChartReportsTo}
                  catalog={positionCatalog}
                  disabled={orgChartDisabled || assignmentDisabled}
                  onChange={(reportsTo) => onOrgChartPlacementChange(asset.assetKey, reportsTo)}
                />
              </div>
            ) : null}
          </Item>
        ))}
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
