import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, MapIcon, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { cn } from '@/lib/utils'
import type { AssetWorkspaceOption, ResourceListItemData } from '@/features/resources/types'
import { AssetListHeaderRow } from '@/features/resources/AssetListHeaderRow'
import { ResourceListItemCard } from '@/features/resources/ResourceListItemCard'
import { getAssetMapKey } from '@/data/hub-asset-catalog'
import { USCG_COAST_GUARD_AREA_SITREPS } from '@/data/uscg-coast-guard-area-sitreps'
import { HubAorTreeNode } from '@/features/hub/aor/HubAorTreeNode'
import {
  highlightMatchText,
  hubAorMatchItemClassName,
} from '@/features/hub/aor/highlight-match'
import type { HubAorNodeView } from '@/features/hub/aor/hub-aor-types'
import { filterHubAorAreaViews, searchHubAorHierarchy } from '@/features/hub/aor/hub-aor-search'
import { buildHubAorAreaViews } from '@/features/hub/aor/hub-aor-tree'
import type { HubAorDistrict } from '@/features/hub/aor/hub-aor-types'

type HubAorHierarchyPanelProps = {
  assets: ResourceListItemData[]
  externalSearchQuery?: string
  focusTargetId?: string | null
  glassItemBorderClasses: string
  selectedPanelItemId: string | null
  onSelectPanelItem: (id: string | null) => void
  expandedAssetKey: string | null
  onExpandedAssetKeyChange: (key: string | null) => void
  assetWorkspaceOptions: AssetWorkspaceOption[]
  isAssetAssignmentsLoading: boolean
  onAssetAssignmentChange: (assetKey: string, workspaceId: string | null) => void
  onFocusMap: (mapKey: string, location: [number, number], scale: number) => void
}

export function HubAorHierarchyPanel({
  assets,
  externalSearchQuery = '',
  focusTargetId = null,
  glassItemBorderClasses,
  selectedPanelItemId,
  onSelectPanelItem,
  expandedAssetKey,
  onExpandedAssetKeyChange,
  assetWorkspaceOptions,
  isAssetAssignmentsLoading,
  onAssetAssignmentChange,
  onFocusMap,
}: HubAorHierarchyPanelProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const [expandedAreaKeys, setExpandedAreaKeys] = useState<Set<string>>(new Set())
  const [expandedDistrictIds, setExpandedDistrictIds] = useState<Set<number>>(new Set())
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set())
  const [visibleAreaSitrepKeys, setVisibleAreaSitrepKeys] = useState<Set<string>>(new Set())

  const effectiveSearchQuery = localSearchQuery.trim() || externalSearchQuery.trim()
  const hasSearchQuery = effectiveSearchQuery.length > 0

  const areaViews = useMemo(() => buildHubAorAreaViews(assets), [assets])
  const searchResult = useMemo(
    () => searchHubAorHierarchy(areaViews, effectiveSearchQuery),
    [areaViews, effectiveSearchQuery]
  )
  const filteredAreaViews = useMemo(
    () => filterHubAorAreaViews(areaViews, searchResult, hasSearchQuery),
    [areaViews, searchResult, hasSearchQuery]
  )

  useEffect(() => {
    if (!hasSearchQuery) return
    setExpandedAreaKeys((previous) => {
      const next = new Set(previous)
      searchResult.expandAreaKeys.forEach((key) => next.add(`aor-area-${key}`))
      return next
    })
    setExpandedDistrictIds((previous) => {
      const next = new Set(previous)
      searchResult.expandDistrictIds.forEach((id) => next.add(id))
      return next
    })
    setExpandedNodeIds((previous) => {
      const next = new Set(previous)
      searchResult.expandNodeIds.forEach((id) => next.add(id))
      return next
    })
  }, [hasSearchQuery, searchResult])

  useEffect(() => {
    if (!focusTargetId) return
    const element = document.querySelector(`[data-aor-node-id="${focusTargetId}"], [data-aor-district-id="${focusTargetId}"], [data-aor-asset-key="${focusTargetId}"]`)
    element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusTargetId, filteredAreaViews])

  const toggleArea = (areaKey: string) => {
    setExpandedAreaKeys((previous) => {
      const next = new Set(previous)
      if (next.has(areaKey)) next.delete(areaKey)
      else next.add(areaKey)
      return next
    })
  }

  const toggleDistrict = (districtId: number) => {
    setExpandedDistrictIds((previous) => {
      const next = new Set(previous)
      if (next.has(districtId)) next.delete(districtId)
      else next.add(districtId)
      return next
    })
  }

  const toggleNode = (nodeId: string) => {
    setExpandedNodeIds((previous) => {
      const next = new Set(previous)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  const toggleAreaSitrep = (areaPanelKey: string) => {
    setVisibleAreaSitrepKeys((previous) => {
      const next = new Set(previous)
      if (next.has(areaPanelKey)) next.delete(areaPanelKey)
      else next.add(areaPanelKey)
      return next
    })
  }

  if (filteredAreaViews.length === 0) {
    return (
      <div className="space-y-3">
        <HubAorSearchBar
          value={localSearchQuery}
          onChange={setLocalSearchQuery}
          hasSearchQuery={hasSearchQuery}
          searchResult={searchResult}
        />
        <Item variant="outline" className={glassItemBorderClasses}>
          <ItemContent>
            <ItemTitle>No matching areas of responsibility</ItemTitle>
            <ItemDescription>
              {hasSearchQuery
                ? `No AORs or assets match "${effectiveSearchQuery}".`
                : 'Try a broader search term.'}
            </ItemDescription>
          </ItemContent>
        </Item>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <HubAorSearchBar
        value={localSearchQuery}
        onChange={setLocalSearchQuery}
        hasSearchQuery={hasSearchQuery}
        searchResult={searchResult}
      />
      {filteredAreaViews.map((areaView) => {
        const areaPanelKey = `aor-area-${areaView.area.key}`
        const isAreaOpen =
          hasSearchQuery && searchResult.expandAreaKeys.has(areaView.area.key)
            ? true
            : expandedAreaKeys.has(areaPanelKey)
        const areaSitrep = USCG_COAST_GUARD_AREA_SITREPS[areaView.area.key]
        const districtCount = areaView.districts.length
        const assetCount =
          areaView.unassignedAssets.length +
          areaView.districts.reduce((sum, district) => sum + countDistrictAssets(district), 0)

        return (
          <Item
            key={areaView.area.key}
            variant="outline"
            className={cn(
              'flex-col items-stretch p-0',
              glassItemBorderClasses,
              selectedPanelItemId === areaPanelKey && 'ring-2 ring-primary/60 bg-primary/5'
            )}
          >
            <Collapsible open={isAreaOpen} onOpenChange={() => toggleArea(areaPanelKey)}>
              <div
                className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                onClick={() => toggleArea(areaPanelKey)}
              >
                <ItemContent>
                  <ItemTitle>{highlightMatchText(areaView.area.name, effectiveSearchQuery)}</ItemTitle>
                  <ItemDescription>
                    {[
                      districtCount > 0
                        ? `${districtCount} ${districtCount === 1 ? 'district' : 'districts'}`
                        : null,
                      assetCount > 0
                        ? `${assetCount} ${assetCount === 1 ? 'asset' : 'assets'}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Zoom map to ${areaView.area.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelectPanelItem(areaPanelKey)
                      onFocusMap(
                        `fema-aor-area-${areaView.area.key}`,
                        areaView.area.location,
                        20_000_000
                      )
                    }}
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Toggle ${areaView.area.name}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ChevronDown
                        className={cn('h-4 w-4 transition-transform', isAreaOpen && 'rotate-180')}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </ItemActions>
              </div>
              <CollapsibleContent>
                <div className="space-y-4 border-t px-2 py-2">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-1/2 text-xs"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleAreaSitrep(areaPanelKey)
                      }}
                    >
                      {visibleAreaSitrepKeys.has(areaPanelKey) ? 'Hide SITREP' : 'Show SITREP'}
                    </Button>
                    {visibleAreaSitrepKeys.has(areaPanelKey) ? (
                      <div
                        className={cn(
                          'space-y-2 rounded-md border px-3 py-2.5 text-sm',
                          glassItemBorderClasses
                        )}
                      >
                        <p>
                          <span className="font-medium">Reporting Period:</span>{' '}
                          {areaSitrep.reportingPeriod}
                        </p>
                        <p>
                          <span className="font-medium">Last Update:</span> {areaSitrep.lastUpdate}
                        </p>
                        <p className="mt-2">
                          <span className="font-medium">Latest SITREP:</span> {areaSitrep.sitrep}{' '}
                          <span className="italic text-muted-foreground">
                            (last updated by {areaSitrep.sitrepUpdatedBy})
                          </span>
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {areaView.unassignedAssets.length > 0 ? (
                    <div className="space-y-2">
                      <p className="px-1 text-xs font-medium text-muted-foreground">
                        Unassigned area assets
                      </p>
                      <AssetListHeaderRow />
                      {areaView.unassignedAssets.map((asset) => (
                        <div key={asset.assetKey} data-aor-asset-key={asset.assetKey}>
                          <ResourceListItemCard
                          resource={asset}
                          glassItemBorderClasses={cn(
                            glassItemBorderClasses,
                            searchResult.directMatchAssetKeys.has(asset.assetKey) &&
                              'ring-2 ring-primary bg-primary/5'
                          )}
                          selected={selectedPanelItemId === `hub-aor-asset-${asset.assetKey}`}
                          open={expandedAssetKey === `hub-aor-asset-${asset.assetKey}`}
                          editable
                          workspaceOptions={assetWorkspaceOptions}
                          assignmentDisabled={isAssetAssignmentsLoading}
                          onAssignmentChange={(workspaceId) =>
                            onAssetAssignmentChange(asset.assetKey, workspaceId)
                          }
                          onOpenChange={(open) =>
                            onExpandedAssetKeyChange(
                              open ? `hub-aor-asset-${asset.assetKey}` : null
                            )
                          }
                          onHeaderClick={() =>
                            onExpandedAssetKeyChange(`hub-aor-asset-${asset.assetKey}`)
                          }
                          onFocusMap={() => {
                            onSelectPanelItem(`hub-aor-asset-${asset.assetKey}`)
                            onFocusMap(getAssetMapKey(asset.assetKey), asset.mapLocation, 30000)
                          }}
                        />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {areaView.districts.length > 0 ? (
                    <div className="space-y-2">
                      <p className="px-1 text-xs font-medium text-muted-foreground">Districts</p>
                      {areaView.districts.map((districtView) => (
                        <HubAorDistrictRow
                          key={districtView.district.id}
                          district={districtView.district}
                          districtView={districtView}
                          searchQuery={effectiveSearchQuery}
                          searchResult={searchResult}
                          hasSearchQuery={hasSearchQuery}
                          isOpen={
                            hasSearchQuery && searchResult.expandDistrictIds.has(districtView.district.id)
                              ? true
                              : expandedDistrictIds.has(districtView.district.id)
                          }
                          onToggle={() => toggleDistrict(districtView.district.id)}
                          expandedNodeIds={expandedNodeIds}
                          onToggleNode={toggleNode}
                          selectedPanelItemId={selectedPanelItemId}
                          onSelectPanelItem={onSelectPanelItem}
                          expandedAssetKey={expandedAssetKey}
                          onExpandedAssetKeyChange={onExpandedAssetKeyChange}
                          glassItemBorderClasses={glassItemBorderClasses}
                          assetWorkspaceOptions={assetWorkspaceOptions}
                          isAssetAssignmentsLoading={isAssetAssignmentsLoading}
                          onAssetAssignmentChange={onAssetAssignmentChange}
                          onFocusMap={onFocusMap}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Item>
        )
      })}
    </div>
  )
}

function countDistrictAssets(district: {
  assets: ResourceListItemData[]
  childNodes: HubAorNodeView[]
}): number {
  return district.assets.length + district.childNodes.reduce(countNodeViewAssets, 0)
}

function countNodeViewAssets(sum: number, node: HubAorNodeView): number {
  return sum + node.assets.length + node.children.reduce(countNodeViewAssets, 0)
}

type HubAorSearchBarProps = {
  value: string
  onChange: (value: string) => void
  hasSearchQuery: boolean
  searchResult: ReturnType<typeof searchHubAorHierarchy>
}

function HubAorSearchBar({ value, onChange, hasSearchQuery, searchResult }: HubAorSearchBarProps) {
  const matchSummary = hasSearchQuery
    ? [
        searchResult.summary.districts > 0
          ? `${searchResult.summary.districts} district${searchResult.summary.districts === 1 ? '' : 's'}`
          : null,
        searchResult.summary.sectors > 0
          ? `${searchResult.summary.sectors} sector${searchResult.summary.sectors === 1 ? '' : 's'}`
          : null,
        searchResult.summary.airStations > 0
          ? `${searchResult.summary.airStations} air station${searchResult.summary.airStations === 1 ? '' : 's'}`
          : null,
        searchResult.summary.subUnits > 0
          ? `${searchResult.summary.subUnits} sub-unit${searchResult.summary.subUnits === 1 ? '' : 's'}`
          : null,
        searchResult.summary.assets > 0
          ? `${searchResult.summary.assets} asset${searchResult.summary.assets === 1 ? '' : 's'}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search AORs and assets…"
          aria-label="Search areas of responsibility and assets"
          className="h-9 pr-8 pl-8 text-sm"
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2"
            aria-label="Clear AOR search"
            onClick={() => onChange('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
      {matchSummary ? (
        <Badge variant="secondary" className="text-[10px] font-normal">
          Matches: {matchSummary}
        </Badge>
      ) : null}
    </div>
  )
}

type HubAorDistrictRowProps = {
  district: HubAorDistrict
  districtView: ReturnType<typeof buildHubAorAreaViews>[number]['districts'][number]
  searchQuery: string
  searchResult: ReturnType<typeof searchHubAorHierarchy>
  hasSearchQuery: boolean
  isOpen: boolean
  onToggle: () => void
  expandedNodeIds: Set<string>
  onToggleNode: (nodeId: string) => void
  selectedPanelItemId: string | null
  onSelectPanelItem: (id: string | null) => void
  expandedAssetKey: string | null
  onExpandedAssetKeyChange: (key: string | null) => void
  glassItemBorderClasses: string
  assetWorkspaceOptions: AssetWorkspaceOption[]
  isAssetAssignmentsLoading: boolean
  onAssetAssignmentChange: (assetKey: string, workspaceId: string | null) => void
  onFocusMap: (mapKey: string, location: [number, number], scale: number) => void
}

function HubAorDistrictRow({
  district,
  districtView,
  searchQuery,
  searchResult,
  hasSearchQuery,
  isOpen,
  onToggle,
  expandedNodeIds,
  onToggleNode,
  selectedPanelItemId,
  onSelectPanelItem,
  expandedAssetKey,
  onExpandedAssetKeyChange,
  glassItemBorderClasses,
  assetWorkspaceOptions,
  isAssetAssignmentsLoading,
  onAssetAssignmentChange,
  onFocusMap,
}: HubAorDistrictRowProps) {
  const panelKey = `aor-${district.id}`
  const isDirectMatch = searchResult.directMatchDistrictIds.has(district.id)
  const isPathMatch =
    hasSearchQuery &&
    (searchResult.visibleDistrictIds.has(district.id) ||
      searchResult.expandDistrictIds.has(district.id))

  return (
    <Item
      variant="outline"
      data-aor-district-id={district.id}
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
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <div className="flex cursor-pointer items-center gap-2 px-3 py-2.5" onClick={onToggle}>
          <ItemContent>
            <ItemTitle className="text-sm">
              {highlightMatchText(district.name, searchQuery)}
            </ItemTitle>
            <ItemDescription>{district.lead}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Zoom map to district"
              onClick={(event) => {
                event.stopPropagation()
                onSelectPanelItem(panelKey)
                onFocusMap(`fema-aor-${district.id}`, district.location, 10_000_000)
              }}
            >
              <MapIcon className="h-4 w-4" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle district details"
                onClick={(event) => event.stopPropagation()}
              >
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                />
              </Button>
            </CollapsibleTrigger>
          </ItemActions>
        </div>
        <CollapsibleContent>
          <div className="space-y-3 border-t px-3 py-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <p>
                <span className="font-medium">Lead:</span> {district.lead}
              </p>
              <p>
                <span className="font-medium">Incidents:</span> {district.incidents}
              </p>
            </div>
            <p>
              <span className="font-medium">Last Update:</span> {district.lastUpdate}
            </p>
            <p>
              <span className="font-medium">Population / Evac:</span> {district.population} /{' '}
              {district.evacuationStatus}
            </p>
            <p>
              <span className="font-medium">Latest SITREP:</span> {district.sitrep}{' '}
              <span className="italic text-muted-foreground">
                (last updated by {district.sitrepUpdatedBy})
              </span>
            </p>

            {districtView.assets.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">District assets</p>
                <AssetListHeaderRow />
                {districtView.assets.map((asset) => (
                  <div key={asset.assetKey} data-aor-asset-key={asset.assetKey}>
                    <ResourceListItemCard
                    resource={asset}
                    glassItemBorderClasses={cn(
                      glassItemBorderClasses,
                      searchResult.directMatchAssetKeys.has(asset.assetKey) &&
                        'ring-2 ring-primary bg-primary/5'
                    )}
                    selected={selectedPanelItemId === `hub-aor-asset-${asset.assetKey}`}
                    open={expandedAssetKey === `hub-aor-asset-${asset.assetKey}`}
                    editable
                    workspaceOptions={assetWorkspaceOptions}
                    assignmentDisabled={isAssetAssignmentsLoading}
                    onAssignmentChange={(workspaceId) =>
                      onAssetAssignmentChange(asset.assetKey, workspaceId)
                    }
                    onOpenChange={(open) =>
                      onExpandedAssetKeyChange(
                        open ? `hub-aor-asset-${asset.assetKey}` : null
                      )
                    }
                    onHeaderClick={() =>
                      onExpandedAssetKeyChange(`hub-aor-asset-${asset.assetKey}`)
                    }
                    onFocusMap={() => {
                      onSelectPanelItem(`hub-aor-asset-${asset.assetKey}`)
                      onFocusMap(getAssetMapKey(asset.assetKey), asset.mapLocation, 30000)
                    }}
                  />
                  </div>
                ))}
              </div>
            ) : null}

            {districtView.childNodes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Sectors, air stations, and sub-units
                </p>
                {districtView.childNodes.map((nodeView) => (
                  <HubAorTreeNode
                    key={nodeView.node.id}
                    nodeView={nodeView}
                    depth={0}
                    searchQuery={searchQuery}
                    searchResult={searchResult}
                    hasSearchQuery={hasSearchQuery}
                    expandedNodeIds={expandedNodeIds}
                    onToggleNode={onToggleNode}
                    selectedPanelItemId={selectedPanelItemId}
                    onSelectPanelItem={(id) => onSelectPanelItem(id)}
                    expandedAssetKey={expandedAssetKey}
                    onToggleAsset={(key) => onExpandedAssetKeyChange(key)}
                    glassItemBorderClasses={glassItemBorderClasses}
                    assetWorkspaceOptions={assetWorkspaceOptions}
                    isAssetAssignmentsLoading={isAssetAssignmentsLoading}
                    onAssetAssignmentChange={onAssetAssignmentChange}
                    onFocusMap={onFocusMap}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Item>
  )
}
