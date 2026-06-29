import { Badge } from '@/components/ui/badge'
import { GeospatialCopDashboardPanel } from '@/features/hub/cisa-dashboards/GeospatialCopDashboardPanel'
import { HubDashboardWidgetRenderer } from '@/features/hub/cisa-dashboards/HubDashboardWidgetRenderer'
import { getHubCisaDashboardDefinition } from '@/features/hub/cisa-dashboards/demo-widget-data'
import type { HubCisaDashboardId } from '@/features/hub/cisa-dashboards/types'
import { cn } from '@/lib/utils'

type HubCisaDashboardPanelProps = {
  dashboardId: HubCisaDashboardId
  glassItemBorderClasses?: string
  geospatialCopAisLayerEnabled?: boolean
  onGeospatialCopAisLayerEnabledChange?: (enabled: boolean) => void
  onFocusGeospatialCopMapItem?: (mapKey: string, location: [number, number]) => void
  onEnterPortOfHoustonWorkspace?: () => void
  selectedPanelItemId?: string | null
}

export function HubCisaDashboardPanel({
  dashboardId,
  glassItemBorderClasses = '',
  geospatialCopAisLayerEnabled = false,
  onGeospatialCopAisLayerEnabledChange,
  onFocusGeospatialCopMapItem,
  onEnterPortOfHoustonWorkspace,
  selectedPanelItemId = null,
}: HubCisaDashboardPanelProps) {
  if (dashboardId === 'cisa-national-geospatial-cop') {
    return (
      <GeospatialCopDashboardPanel
        glassItemBorderClasses={glassItemBorderClasses}
        aisLayerEnabled={geospatialCopAisLayerEnabled}
        onAisLayerEnabledChange={onGeospatialCopAisLayerEnabledChange ?? (() => undefined)}
        onFocusMapItem={onFocusGeospatialCopMapItem}
        onEnterIncidentWorkspace={onEnterPortOfHoustonWorkspace}
        selectedPanelItemId={selectedPanelItemId}
      />
    )
  }

  const dashboard = getHubCisaDashboardDefinition(dashboardId)

  return (
    <div className="space-y-4 pb-2">
      <div
        className={cn(
          'rounded-lg border bg-muted/10 px-3 py-3',
          glassItemBorderClasses
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{dashboard.label}</p>
          {dashboard.audience ? (
            <Badge variant="secondary" className="text-[10px]">
              {dashboard.audience}
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{dashboard.description}</p>
      </div>

      <HubDashboardWidgetRenderer
        widgets={dashboard.widgets}
        glassItemBorderClasses={glassItemBorderClasses}
      />
    </div>
  )
}
