import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AssetListHeaderRow } from '@/features/resources/AssetListHeaderRow'
import { ResourceListItemCard } from '@/features/resources/ResourceListItemCard'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import { getOrgChartPlacementLabel } from '@/features/roster/workspace-asset-org-chart'
import type { WorkspacePositionCatalog } from '@/features/roster/workspace-positions'
import { isOrganizationManagedAssetKey } from '@/lib/organization-asset-catalog'
import { Plus, Search } from 'lucide-react'

const BROWSE_RESULT_LIMIT = 50

type OrganizationAssetBrowseListProps = {
  assets: ResourceListItemData[]
  selectedKeys: Set<string>
  excludeKeys?: Set<string>
  workspaceOptions: AssetWorkspaceOption[]
  positionCatalog?: WorkspacePositionCatalog | null
  glassItemBorderClasses: string
  onAdd: (asset: ResourceListItemData) => void
  query: string
  onQueryChange: (query: string) => void
  idPrefix: string
  emptyMessage?: string
}

export function OrganizationAssetBrowseList({
  assets,
  selectedKeys,
  excludeKeys = new Set<string>(),
  workspaceOptions,
  positionCatalog = null,
  glassItemBorderClasses,
  onAdd,
  query,
  onQueryChange,
  idPrefix,
  emptyMessage = 'No organization assets available.',
}: OrganizationAssetBrowseListProps) {
  const [expandedAssetKey, setExpandedAssetKey] = useState<string | null>(null)

  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return assets
      .filter((asset) => !selectedKeys.has(asset.assetKey) && !excludeKeys.has(asset.assetKey))
      .filter((asset) => {
        if (!normalized) return true
        return [
          asset.name,
          asset.type,
          asset.owner,
          asset.location,
          asset.assetKey,
          asset.orgChartReportsTo,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      })
      .slice(0, BROWSE_RESULT_LIMIT)
  }, [assets, excludeKeys, query, selectedKeys])

  const totalMatches = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return assets
      .filter((asset) => !selectedKeys.has(asset.assetKey) && !excludeKeys.has(asset.assetKey))
      .filter((asset) => {
        if (!normalized) return true
        return [asset.name, asset.type, asset.owner, asset.location, asset.assetKey]
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      }).length
  }, [assets, excludeKeys, query, selectedKeys])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={`${idPrefix}-search`}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search organization assets"
          className="h-9 pl-7 text-xs"
        />
      </div>

      {assets.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">{emptyMessage}</p>
      ) : filteredAssets.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          {query.trim() ? 'No matching assets.' : 'All matching assets are already selected.'}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Showing {filteredAssets.length} of {totalMatches} matching assets. Expand a row to
            review details, then add it to transfer.
          </p>
          <AssetListHeaderRow showActionSpacer={false} />
          <div className="max-h-[min(50vh,28rem)] space-y-2 overflow-y-auto pr-1">
            {filteredAssets.map((asset) => {
              const isOpen = expandedAssetKey === asset.assetKey
              return (
                <ResourceListItemCard
                  key={asset.assetKey}
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
                  open={isOpen}
                  onOpenChange={(open) => setExpandedAssetKey(open ? asset.assetKey : null)}
                  onHeaderClick={() =>
                    setExpandedAssetKey((previous) =>
                      previous === asset.assetKey ? null : asset.assetKey
                    )
                  }
                  headerActions={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 px-2 text-xs"
                      aria-label={`Add ${asset.name} to transfer`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onAdd(asset)
                        setExpandedAssetKey(null)
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  }
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
