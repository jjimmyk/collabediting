import { ChevronDown, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Item } from '@/components/ui/item'
import { cn } from '@/lib/utils'
import {
  formatMselDeliveryTimestamp,
  groupDeliveriesByInject,
} from '@/features/exercise-msel/delivery-utils'
import type { MselInjectDelivery, MselInjectDeliveryGroup } from '@/features/exercise-msel/types'
import { getExerciseObjectiveLabel } from '@/features/exercise-msel/msel-utils'
import type { ExerciseMselState } from '@/features/exercise-msel/types'

export type InjectsReceivedListProps = {
  deliveries: MselInjectDelivery[]
  objectives: ExerciseMselState['objectives']
  recipientFilterEmail?: string | null
  onFocusOnMap?: (delivery: MselInjectDelivery) => void
}

function buildGroups(
  deliveries: MselInjectDelivery[],
  recipientFilterEmail?: string | null
): MselInjectDeliveryGroup[] {
  const filtered = recipientFilterEmail?.trim()
    ? deliveries.filter(
        (delivery) =>
          delivery.recipientEmail === recipientFilterEmail.trim().toLowerCase()
      )
    : deliveries
  return groupDeliveriesByInject(filtered)
}

export function InjectsReceivedList({
  deliveries,
  objectives,
  recipientFilterEmail,
  onFocusOnMap,
}: InjectsReceivedListProps) {
  const groups = buildGroups(deliveries, recipientFilterEmail)

  if (groups.length === 0) {
    return (
      <div
        className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground"
        data-testid="msel-injects-received-empty"
      >
        No injects received yet.
      </div>
    )
  }

  return (
    <div className="grid gap-3" data-testid="msel-injects-received-list">
      {groups.map((group) => {
        const snapshot = group.injectSnapshot
        const title = snapshot.inject.trim() || `Inject ${group.injectId}`
        const objectiveLabel = getExerciseObjectiveLabel(objectives, snapshot.objectiveId)

        return (
          <Item
            key={group.injectId}
            variant="outline"
            className="flex-col items-stretch"
            data-testid={`msel-received-group-${group.injectId}`}
          >
            <Collapsible defaultOpen>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Toggle ${title}`}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {snapshot.scheduledTime || 'No time set'} · {snapshot.category || 'Operations'} ·{' '}
                    {objectiveLabel} · {group.deliveries.length} deliver
                    {group.deliveries.length === 1 ? 'y' : 'ies'}
                  </p>
                </div>
                {snapshot.mapLocation && onFocusOnMap && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Focus inject ${group.injectId} on map`}
                    onClick={() => onFocusOnMap(group.deliveries[0])}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CollapsibleContent>
                <div className="space-y-2 border-t px-3 py-3">
                  {group.deliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className={cn('rounded-md border px-3 py-2 text-sm')}
                      data-testid={`msel-received-delivery-${delivery.id}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{delivery.recipientEmail}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatMselDeliveryTimestamp(delivery.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sent by {delivery.sentByEmail ?? 'Unknown'} · {delivery.severity}
                      </p>
                      <p className="mt-2 text-xs">{delivery.summary}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Item>
        )
      })}
    </div>
  )
}
