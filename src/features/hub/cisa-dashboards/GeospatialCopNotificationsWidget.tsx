import { useState } from 'react'
import { ChevronDown, Map as MapIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import {
  GEOSPATIAL_COP_GRIST_MILL_SOURCE,
  GEOSPATIAL_COP_NOTIFICATIONS,
  getGeospatialCopNotificationSeverityBadgeClasses,
} from '@/features/hub/cisa-dashboards/geospatial-cop-notifications'
import { cn } from '@/lib/utils'

type GeospatialCopNotificationsWidgetProps = {
  glassItemBorderClasses?: string
  incidentId: string
  selectedPanelItemId?: string | null
  onFocusMapItem?: (mapKey: string, location: [number, number]) => void
}

export function GeospatialCopNotificationsWidget({
  glassItemBorderClasses = '',
  incidentId,
  selectedPanelItemId = null,
  onFocusMapItem,
}: GeospatialCopNotificationsWidgetProps) {
  const [expandedNotificationId, setExpandedNotificationId] = useState<string | null>(null)

  return (
    <section
      className={cn(
        'rounded-lg border bg-muted/10 p-3',
        glassItemBorderClasses
      )}
    >
      <div>
        <p className="text-xs font-medium">Notifications</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {GEOSPATIAL_COP_NOTIFICATIONS.length} alerts · Source: {GEOSPATIAL_COP_GRIST_MILL_SOURCE}{' '}
          · {incidentId}
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-2 px-0.5 pt-1">
        {GEOSPATIAL_COP_NOTIFICATIONS.map((item) => {
          const isOpen = expandedNotificationId === item.id
          return (
            <Item
              key={item.id}
              variant="outline"
              className={cn(
                'flex-col items-stretch p-0',
                glassItemBorderClasses,
                selectedPanelItemId === item.mapKey &&
                  'relative z-10 ring-2 ring-primary/60 ring-offset-2 ring-offset-background bg-primary/5'
              )}
            >
              <Collapsible
                open={isOpen}
                onOpenChange={(open) => setExpandedNotificationId(open ? item.id : null)}
              >
                <div
                  className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                  onClick={() =>
                    setExpandedNotificationId((previous) =>
                      previous === item.id ? null : item.id
                    )
                  }
                >
                  <ItemContent>
                    <ItemTitle>{item.title}</ItemTitle>
                    <ItemDescription>
                      <>
                        <span className="font-medium">Source:</span> {item.owner}
                        <span className="mx-1.5 opacity-50">·</span>
                        {item.timestamp}
                      </>
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Badge className={getGeospatialCopNotificationSeverityBadgeClasses(item.severity)}>
                      {item.severity}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Zoom map to notification"
                      onClick={(event) => {
                        event.stopPropagation()
                        onFocusMapItem?.(item.mapKey, item.location)
                      }}
                    >
                      <MapIcon className="h-4 w-4" />
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Toggle notification details"
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
                  <div className="border-t px-3 py-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <p>
                        <span className="font-medium">Status:</span> {item.status}
                      </p>
                      <p>
                        <span className="font-medium">Owner:</span> {item.owner}
                      </p>
                    </div>
                    <p className="mt-2">
                      <span className="font-medium">Time:</span> {item.timestamp}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium">Impact:</span> {item.impact}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Item>
          )
        })}
      </div>
    </section>
  )
}
