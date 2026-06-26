import { ChevronDown, MapIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item'
import { cn } from '@/lib/utils'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import { AssetListHeaderRow } from '@/features/resources/AssetListHeaderRow'
import { ResourceListItemCard } from '@/features/resources/ResourceListItemCard'
import { getAssetMapKey } from '@/data/hub-asset-catalog'
import {
  highlightMatchText,
  hubAorMatchItemClassName,
} from '@/features/hub/aor/highlight-match'
import type { HubAorNodeView, HubAorSearchResult } from '@/features/hub/aor/hub-aor-types'
import { HUB_AOR_NODE_KIND_LABELS } from '@/features/hub/aor/hub-aor-types'
import { hubAorSectorBoundaryId } from '@/features/hub/aor/aor-boundary-map-keys'
import { HubAorMapBoundaryToggle } from '@/features/hub/aor/HubAorMapBoundaryToggle'

type HubAorTreeNodeProps = {
  nodeView: HubAorNodeView
  depth: number
  searchQuery: string
  searchResult: HubAorSearchResult
  hasSearchQuery: boolean
  expandedNodeIds: Set<string>
  onToggleNode: (nodeId: string) => void
  selectedPanelItemId: string | null
  onSelectPanelItem: (id: string) => void
  expandedAssetKey: string | null
  onToggleAsset: (key: string | null) => void
  glassItemBorderClasses: string
  assetWorkspaceOptions: AssetWorkspaceOption[]
  isAssetAssignmentsLoading: boolean
  onAssetAssignmentChange: (assetKey: string, workspaceId: string | null) => void
  onFocusMap: (mapKey: string, location: [number, number], scale: number) => void
  enabledBoundaryIds: Set<string>
  onToggleBoundary: (boundaryId: string, checked: boolean) => void
}

export function HubAorTreeNode({
  nodeView,
  depth,
  searchQuery,
  searchResult,
  hasSearchQuery,
  expandedNodeIds,
  onToggleNode,
  selectedPanelItemId,
  onSelectPanelItem,
  expandedAssetKey,
  onToggleAsset,
  glassItemBorderClasses,
  assetWorkspaceOptions,
  isAssetAssignmentsLoading,
  onAssetAssignmentChange,
  onFocusMap,
  enabledBoundaryIds,
  onToggleBoundary,
}: HubAorTreeNodeProps) {
  const { node, children, assets } = nodeView
  const panelKey = `hub-aor-node-${node.id}`
  const isOpen = hasSearchQuery
    ? searchResult.expandNodeIds.has(node.id) || expandedNodeIds.has(node.id)
    : expandedNodeIds.has(node.id)
  const isDirectMatch = searchResult.directMatchNodeIds.has(node.id)
  const isPathMatch =
    hasSearchQuery &&
    (searchResult.visibleNodeIds.has(node.id) || searchResult.expandNodeIds.has(node.id))
  const hasChildren = children.length > 0 || assets.length > 0
  const mapLocation = node.location ?? [-98, 39]

  return (
    <div className={cn('space-y-2', depth > 0 && 'ml-3 border-l border-border/60 pl-2')}>
      <Item
        variant="outline"
        data-aor-node-id={node.id}
        className={cn(
          'flex-col items-stretch p-0',
          glassItemBorderClasses,
          hubAorMatchItemClassName(
            isDirectMatch,
            isPathMatch && !isDirectMatch,
            selectedPanelItemId === panelKey
          )
        )}
      >
        <Collapsible open={isOpen} onOpenChange={() => onToggleNode(node.id)}>
          <div
            className="flex cursor-pointer items-center gap-2 px-3 py-2"
            onClick={() => onToggleNode(node.id)}
          >
            <ItemContent>
              <div className="flex flex-wrap items-center gap-1.5">
                <ItemTitle className="text-sm">
                  {highlightMatchText(node.name, searchQuery)}
                </ItemTitle>
                <Badge variant="outline" className="h-4 px-1 text-[9px] capitalize">
                  {HUB_AOR_NODE_KIND_LABELS[node.kind]}
                </Badge>
              </div>
              {node.lead ? (
                <p className="text-xs text-muted-foreground">{highlightMatchText(node.lead, searchQuery)}</p>
              ) : null}
            </ItemContent>
            <ItemActions>
              {node.kind === 'sector' ? (
                <HubAorMapBoundaryToggle
                  boundaryId={hubAorSectorBoundaryId(node.id)}
                  enabledBoundaryIds={enabledBoundaryIds}
                  ariaLabel={`Show ${node.name} on map`}
                  onToggleBoundary={onToggleBoundary}
                />
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Zoom map to ${node.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectPanelItem(panelKey)
                  const mapKey =
                    node.kind === 'sector'
                      ? hubAorSectorBoundaryId(node.id)
                      : `hub-aor-node-${node.id}`
                  onFocusMap(mapKey, mapLocation, 500_000)
                }}
              >
                <MapIcon className="h-4 w-4" />
              </Button>
              {hasChildren ? (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Toggle ${node.name}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                    />
                  </Button>
                </CollapsibleTrigger>
              ) : null}
            </ItemActions>
          </div>
          {hasChildren ? (
            <CollapsibleContent>
              <div className="space-y-2 border-t px-2 py-2">
                {assets.length > 0 ? (
                  <div className="space-y-2">
                    <p className="px-1 text-xs font-medium text-muted-foreground">Assets</p>
                    <AssetListHeaderRow />
                    {assets.map((asset) => (
                      <HubAorAssetRow
                        key={asset.assetKey}
                        asset={asset}
                        searchQuery={searchQuery}
                        isDirectMatch={searchResult.directMatchAssetKeys.has(asset.assetKey)}
                        panelKey={`hub-aor-asset-${asset.assetKey}`}
                        selectedPanelItemId={selectedPanelItemId}
                        expandedAssetKey={expandedAssetKey}
                        onToggleAsset={onToggleAsset}
                        onSelectPanelItem={onSelectPanelItem}
                        glassItemBorderClasses={glassItemBorderClasses}
                        assetWorkspaceOptions={assetWorkspaceOptions}
                        isAssetAssignmentsLoading={isAssetAssignmentsLoading}
                        onAssetAssignmentChange={onAssetAssignmentChange}
                        onFocusMap={onFocusMap}
                      />
                    ))}
                  </div>
                ) : null}
                {children.map((child) => (
                  <HubAorTreeNode
                    key={child.node.id}
                    nodeView={child}
                    depth={depth + 1}
                    searchQuery={searchQuery}
                    searchResult={searchResult}
                    hasSearchQuery={hasSearchQuery}
                    expandedNodeIds={expandedNodeIds}
                    onToggleNode={onToggleNode}
                    selectedPanelItemId={selectedPanelItemId}
                    onSelectPanelItem={onSelectPanelItem}
                    expandedAssetKey={expandedAssetKey}
                    onToggleAsset={onToggleAsset}
                    glassItemBorderClasses={glassItemBorderClasses}
                    assetWorkspaceOptions={assetWorkspaceOptions}
                    isAssetAssignmentsLoading={isAssetAssignmentsLoading}
                    onAssetAssignmentChange={onAssetAssignmentChange}
                    onFocusMap={onFocusMap}
                    enabledBoundaryIds={enabledBoundaryIds}
                    onToggleBoundary={onToggleBoundary}
                  />
                ))}
              </div>
            </CollapsibleContent>
          ) : null}
        </Collapsible>
      </Item>
    </div>
  )
}

type HubAorAssetRowProps = {
  asset: ResourceListItemData
  searchQuery: string
  isDirectMatch: boolean
  panelKey: string
  selectedPanelItemId: string | null
  expandedAssetKey: string | null
  onToggleAsset: (key: string | null) => void
  onSelectPanelItem: (id: string) => void
  glassItemBorderClasses: string
  assetWorkspaceOptions: AssetWorkspaceOption[]
  isAssetAssignmentsLoading: boolean
  onAssetAssignmentChange: (assetKey: string, workspaceId: string | null) => void
  onFocusMap: (mapKey: string, location: [number, number], scale: number) => void
}

function HubAorAssetRow({
  asset,
  isDirectMatch,
  panelKey,
  selectedPanelItemId,
  expandedAssetKey,
  onToggleAsset,
  onSelectPanelItem,
  glassItemBorderClasses,
  assetWorkspaceOptions,
  isAssetAssignmentsLoading,
  onAssetAssignmentChange,
  onFocusMap,
}: HubAorAssetRowProps) {
  return (
    <div data-aor-asset-key={asset.assetKey}>
      <ResourceListItemCard
        resource={asset}
        glassItemBorderClasses={cn(
          glassItemBorderClasses,
          isDirectMatch && 'ring-2 ring-primary bg-primary/5'
        )}
        selected={selectedPanelItemId === panelKey}
        open={expandedAssetKey === panelKey}
        editable
        workspaceOptions={assetWorkspaceOptions}
        assignmentDisabled={isAssetAssignmentsLoading}
        onAssignmentChange={(workspaceId) => onAssetAssignmentChange(asset.assetKey, workspaceId)}
        onOpenChange={(open) => onToggleAsset(open ? panelKey : null)}
        onHeaderClick={() =>
          onToggleAsset(expandedAssetKey === panelKey ? null : panelKey)
        }
        onFocusMap={() => {
          onSelectPanelItem(panelKey)
          onFocusMap(getAssetMapKey(asset.assetKey), asset.mapLocation, 30000)
        }}
      />
    </div>
  )
}
