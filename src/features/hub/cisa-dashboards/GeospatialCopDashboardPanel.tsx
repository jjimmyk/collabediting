import { useMemo, useState } from 'react'
import { ChevronDown, Filter, Layers, Map as MapIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AssetListHeaderRow } from '@/features/resources/AssetListHeaderRow'
import { ResourceListItemCard } from '@/features/resources/ResourceListItemCard'
import {
  countAisVesselsByStatus,
  GEOSPATIAL_COP_AIS_VESSELS,
} from '@/features/hub/cisa-dashboards/geospatial-cop-ais-vessels'
import {
  GEOSPATIAL_COP_AIS_LAYER,
  PORT_OF_HOUSTON_OUTAGE_INCIDENT,
  PORT_OF_HOUSTON_OUTAGE_INCIDENT_MAP_KEY,
} from '@/features/hub/cisa-dashboards/geospatial-cop-dashboard-data'
import {
  filterGeospatialCopImpactedAssetsBySector,
  GEOSPATIAL_COP_IMPACTED_ASSETS,
  GEOSPATIAL_COP_IMPACTED_ASSET_SECTORS,
  type GeospatialCopImpactedAssetSector,
} from '@/features/hub/cisa-dashboards/geospatial-cop-impacted-assets'
import { GEOSPATIAL_COP_IMPACTED_AORS } from '@/features/hub/cisa-dashboards/geospatial-cop-impacted-aors'
import { GeospatialCopNotificationsWidget } from '@/features/hub/cisa-dashboards/GeospatialCopNotificationsWidget'
import { IncidentCategoryBadge } from '@/features/hub/incidents/IncidentCategoryBadge'
import { cn } from '@/lib/utils'

type GeospatialCopDashboardPanelProps = {
  glassItemBorderClasses?: string
  aisLayerEnabled: boolean
  onAisLayerEnabledChange: (enabled: boolean) => void
  onFocusMapItem?: (mapKey: string, location: [number, number]) => void
  onEnterIncidentWorkspace?: () => void
  selectedPanelItemId?: string | null
}

export function GeospatialCopDashboardPanel({
  glassItemBorderClasses = '',
  aisLayerEnabled,
  onAisLayerEnabledChange,
  onFocusMapItem,
  onEnterIncidentWorkspace,
  selectedPanelItemId = null,
}: GeospatialCopDashboardPanelProps) {
  const [incidentOpen, setIncidentOpen] = useState(true)
  const [expandedAorId, setExpandedAorId] = useState<string | null>(null)
  const [expandedAssetKey, setExpandedAssetKey] = useState<string | null>(null)
  const [categoryFilters, setCategoryFilters] = useState<GeospatialCopImpactedAssetSector[]>([])
  const aisCounts = countAisVesselsByStatus(GEOSPATIAL_COP_AIS_VESSELS)
  const incident = PORT_OF_HOUSTON_OUTAGE_INCIDENT
  const incidentMapKey = PORT_OF_HOUSTON_OUTAGE_INCIDENT_MAP_KEY

  const filteredAssets = useMemo(
    () => filterGeospatialCopImpactedAssetsBySector(GEOSPATIAL_COP_IMPACTED_ASSETS, categoryFilters),
    [categoryFilters]
  )

  const toggleCategoryFilter = (sector: GeospatialCopImpactedAssetSector, checked: boolean) => {
    setCategoryFilters((previous) => {
      if (checked) {
        return previous.includes(sector) ? previous : [...previous, sector]
      }
      return previous.filter((entry) => entry !== sector)
    })
  }

  return (
    <div className="space-y-4 pb-2">
      <section
        className={cn(
          'rounded-lg border bg-muted/10 p-3',
          glassItemBorderClasses
        )}
      >
        <p className="text-xs font-medium">Active Incidents</p>
        <div className="mt-3">
          <Item
            variant="outline"
            className={cn(
              'flex-col items-stretch p-0',
              glassItemBorderClasses,
              selectedPanelItemId === incidentMapKey && 'ring-2 ring-primary/60 bg-primary/5'
            )}
          >
            <Collapsible open={incidentOpen} onOpenChange={setIncidentOpen}>
              <div
                className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                onClick={() => setIncidentOpen((open) => !open)}
              >
                <ItemContent>
                  <ItemTitle>{incident.name}</ItemTitle>
                  <ItemDescription>{incident.region}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <IncidentCategoryBadge category={incident.category} />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label={`Enter workspace for ${incident.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onEnterIncidentWorkspace?.()
                    }}
                  >
                    Enter Workspace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Zoom map to incident"
                    onClick={(event) => {
                      event.stopPropagation()
                      onFocusMapItem?.(incidentMapKey, incident.location)
                    }}
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Toggle incident details"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          incidentOpen && 'rotate-180'
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                </ItemActions>
              </div>
              <CollapsibleContent>
                <div className="border-t px-3 py-2 text-sm">
                  <p className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                    {incident.summary}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <p>
                      <span className="font-medium">Status:</span> {incident.status}
                    </p>
                    <p>
                      <span className="font-medium">Severity:</span> {incident.severity}
                    </p>
                    <p>
                      <span className="font-medium">Type:</span> {incident.type}
                    </p>
                    <p>
                      <span className="font-medium">Incident ID:</span> {incident.id}
                    </p>
                  </div>
                  <p className="mt-2">
                    <span className="font-medium">Lead:</span> {incident.lead}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Started:</span> {incident.startedAt}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">Last Update:</span> {incident.lastUpdate}
                  </p>
                  <div className="mt-3 rounded-md border bg-background p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Current situation report
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed">
                      {incident.currentSituationReport}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Last updated by {incident.currentSituationReportUpdatedBy} at{' '}
                      {incident.currentSituationReportUpdatedAt}
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Item>
        </div>
      </section>

      <section
        className={cn(
          'rounded-lg border bg-muted/10 p-3',
          glassItemBorderClasses
        )}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-medium">Map Layers</p>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id={`geospatial-cop-map-layer-${GEOSPATIAL_COP_AIS_LAYER.id}`}
              checked={aisLayerEnabled}
              onCheckedChange={(checked) => onAisLayerEnabledChange(checked === true)}
              className="mt-0.5"
              aria-label={`Toggle ${GEOSPATIAL_COP_AIS_LAYER.label} map layer`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Label
                  htmlFor={`geospatial-cop-map-layer-${GEOSPATIAL_COP_AIS_LAYER.id}`}
                  className="cursor-pointer text-xs font-medium leading-snug"
                >
                  {GEOSPATIAL_COP_AIS_LAYER.label}
                </Label>
                <Badge variant="outline" className="text-[10px]">
                  {GEOSPATIAL_COP_AIS_LAYER.vesselCount} vessels
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {GEOSPATIAL_COP_AIS_LAYER.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                <span>Affected {aisCounts.Affected}</span>
                <span>Delayed {aisCounts.Delayed}</span>
                <span>Normal {aisCounts.Normal}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={cn(
          'rounded-lg border bg-muted/10 p-3',
          glassItemBorderClasses
        )}
      >
        <div>
          <p className="text-xs font-medium">Impacted Areas of Responsibility</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {GEOSPATIAL_COP_IMPACTED_AORS.length} ports · cascading outage risk · {incident.id}
          </p>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {GEOSPATIAL_COP_IMPACTED_AORS.map((aor) => {
            const isOpen = expandedAorId === aor.id
            return (
              <Item
                key={aor.id}
                variant="outline"
                className={cn(
                  'flex-col items-stretch p-0',
                  glassItemBorderClasses,
                  selectedPanelItemId === aor.copMapKey &&
                    'relative z-10 ring-2 ring-primary/60 ring-offset-2 ring-offset-background bg-primary/5'
                )}
              >
                <Collapsible
                  open={isOpen}
                  onOpenChange={(open) => setExpandedAorId(open ? aor.id : null)}
                >
                  <div
                    className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                    onClick={() => setExpandedAorId((previous) => (previous === aor.id ? null : aor.id))}
                  >
                    <ItemContent className="min-w-0 flex-1">
                      <ItemTitle className="truncate">{aor.name}</ItemTitle>
                      <ItemDescription className="truncate">{aor.region}</ItemDescription>
                    </ItemContent>
                    <ItemActions className="ml-auto shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Zoom map to ${aor.name}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onFocusMapItem?.(aor.copMapKey, aor.mapLocation)
                        }}
                      >
                        <MapIcon className="h-4 w-4" />
                      </Button>
                      <Badge
                        variant="destructive"
                        className="shrink-0 border-destructive/30 bg-destructive/15 px-2 text-[10px] font-semibold tabular-nums text-destructive"
                      >
                        Risk {aor.riskScore}
                      </Badge>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Toggle ${aor.name} details`}
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
                    <div className="space-y-3 border-t px-3 py-2.5 text-sm">
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {aor.summary}
                      </p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Terminal Operators
                          </p>
                          <ul className="mt-1 space-y-0.5 text-[11px]">
                            {aor.terminalOperators.map((entry) => (
                              <li key={entry}>{entry}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Cargo Types
                          </p>
                          <ul className="mt-1 space-y-0.5 text-[11px]">
                            {aor.cargoTypes.map((entry) => (
                              <li key={entry}>{entry}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Interdependencies
                          </p>
                          <ul className="mt-1 space-y-0.5 text-[11px]">
                            {aor.interdependencies.map((entry) => (
                              <li key={entry}>{entry}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Item>
            )
          })}
        </div>
      </section>

      <section
        className={cn(
          'rounded-lg border bg-muted/10 p-3',
          glassItemBorderClasses
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium">Impacted Assets</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {filteredAssets.length} of {GEOSPATIAL_COP_IMPACTED_ASSETS.length} assets ·{' '}
              {incident.id}
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <Filter className="h-3.5 w-3.5" />
                {categoryFilters.length > 0
                  ? `Category: ${categoryFilters.length} selected`
                  : 'Category: All'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3">
              <p className="text-xs font-medium">Filter by category</p>
              <div className="mt-3 space-y-2">
                {GEOSPATIAL_COP_IMPACTED_ASSET_SECTORS.map((sector) => (
                  <label key={sector} className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={categoryFilters.includes(sector)}
                      onCheckedChange={(checked) =>
                        toggleCategoryFilter(sector, checked === true)
                      }
                    />
                    {sector}
                  </label>
                ))}
              </div>
              {categoryFilters.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-3 h-7 w-full text-xs"
                  onClick={() => setCategoryFilters([])}
                >
                  Clear filters
                </Button>
              ) : null}
            </PopoverContent>
          </Popover>
        </div>

        <div className="mt-3">
          {filteredAssets.length === 0 ? (
            <Item variant="outline" className={glassItemBorderClasses}>
              <ItemContent>
                <ItemTitle>No matching assets</ItemTitle>
                <ItemDescription>Adjust category filters to show impacted assets.</ItemDescription>
              </ItemContent>
            </Item>
          ) : (
            <div className="flex flex-col gap-2 px-0.5 pt-1">
              <AssetListHeaderRow actionSlotCount={2} />
              {filteredAssets.map((resource) => {
                const listKey = resource.assetKey
                const isOpen = expandedAssetKey === listKey
                return (
                  <ResourceListItemCard
                    key={resource.assetKey}
                    resource={resource}
                    glassItemBorderClasses={glassItemBorderClasses}
                    selected={selectedPanelItemId === resource.copMapKey}
                    open={isOpen}
                    editable={false}
                    readOnlyWorkspaceAssignmentFields
                    showWorkspaceAssignment={false}
                    onOpenChange={(open) => setExpandedAssetKey(open ? listKey : null)}
                    onHeaderClick={() =>
                      setExpandedAssetKey((previous) => (previous === listKey ? null : listKey))
                    }
                    onFocusMap={() =>
                      onFocusMapItem?.(resource.copMapKey, resource.mapLocation)
                    }
                  />
                )
              })}
            </div>
          )}
        </div>
      </section>

      <GeospatialCopNotificationsWidget
        glassItemBorderClasses={glassItemBorderClasses}
        incidentId={incident.id}
        selectedPanelItemId={selectedPanelItemId}
        onFocusMapItem={onFocusMapItem}
      />
    </div>
  )
}
