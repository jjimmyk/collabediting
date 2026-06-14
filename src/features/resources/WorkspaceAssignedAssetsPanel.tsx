import { Map as MapIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { AssetStatusIndicator } from '@/features/resources/AssetStatusIndicator'
import type { ResourceListItemData } from '@/features/resources/types'
import { getResourceWorkspaceAssignmentLabel } from '@/features/resources/utils'
import { getAssetMapKey } from '@/data/hub-asset-catalog'
import { cn } from '@/lib/utils'

type WorkspaceAssignedAssetsPanelProps = {
  assets: ResourceListItemData[]
  glassItemBorderClasses: string
  workspaceLabel: string
  isLoading?: boolean
  onFocusMap?: (asset: ResourceListItemData) => void
  onUnassign?: (assetKey: string) => void
  onOpenHubAssets?: () => void
}

export function WorkspaceAssignedAssetsPanel({
  assets,
  glassItemBorderClasses,
  workspaceLabel,
  isLoading = false,
  onFocusMap,
  onUnassign,
  onOpenHubAssets,
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
      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent>
          <ItemTitle>No assets assigned</ItemTitle>
          <ItemDescription>
            No assets are currently assigned to {workspaceLabel}. Assign assets from the hub
            Business Units view.
          </ItemDescription>
        </ItemContent>
        {onOpenHubAssets ? (
          <ItemActions>
            <Button type="button" size="sm" variant="outline" onClick={onOpenHubAssets}>
              Open Business Units
            </Button>
          </ItemActions>
        ) : null}
      </Item>
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
            Manage in Business Units
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 px-0.5">
        {assets.map((asset) => (
          <Item
            key={asset.assetKey}
            variant="outline"
            className={cn('flex items-center gap-2 px-3 py-2.5', glassItemBorderClasses)}
          >
            <ItemContent className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <AssetStatusIndicator status={asset.assetStatus} showLabel={false} />
                <div className="min-w-0">
                  <ItemTitle className="truncate text-sm">{asset.name}</ItemTitle>
                  <ItemDescription className="truncate">
                    {asset.type} · {asset.owner}
                  </ItemDescription>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {getResourceWorkspaceAssignmentLabel(asset)}
                  </p>
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
              {onUnassign ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Unassign ${asset.name}`}
                  onClick={() => onUnassign(asset.assetKey)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </ItemActions>
          </Item>
        ))}
      </div>
    </div>
  )
}

export { getAssetMapKey }
