import { Badge } from '@/components/ui/badge'
import { HubDashboardWidgetRenderer } from '@/features/hub/cisa-dashboards/HubDashboardWidgetRenderer'
import { getHubCisaDashboardDefinition } from '@/features/hub/cisa-dashboards/demo-widget-data'
import type { HubCisaDashboardId } from '@/features/hub/cisa-dashboards/types'
import { cn } from '@/lib/utils'

type HubCisaDashboardPanelProps = {
  dashboardId: HubCisaDashboardId
  glassItemBorderClasses?: string
}

export function HubCisaDashboardPanel({
  dashboardId,
  glassItemBorderClasses = '',
}: HubCisaDashboardPanelProps) {
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
          <Badge variant="outline" className="text-[10px]">
            Demo data
          </Badge>
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
