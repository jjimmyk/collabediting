import { ChevronDown, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Item } from '@/components/ui/item'
import { cn } from '@/lib/utils'
import {
  formatMselDeliveryTimestamp,
  groupDeliveriesByInject,
} from '@/features/exercise-msel/delivery-utils'
import { hasInjectMapGeometry } from '@/features/exercise-msel/msel-geometry-utils'
import { MselInjectDetailPanel } from '@/features/exercise-msel/MselInjectDetailPanel'
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
            <Collapsible defaultOpen={false}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label={`Toggle ${title}`}>
                    <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
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
                {hasInjectMapGeometry(snapshot) && onFocusOnMap && (
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
                <div className="space-y-3 border-t px-3 py-3">
                  <MselInjectDetailPanel
                    snapshot={snapshot}
                    objectives={objectives}
                    deliveries={group.deliveries}
                    onFocusOnMap={
                      onFocusOnMap
                        ? () => onFocusOnMap(group.deliveries[0])
                        : undefined
                    }
                  />
                  <div className="grid gap-2 border-t pt-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Notification summary
                    </p>
                    {group.deliveries.map((delivery) => (
                      <div
                        key={delivery.id}
                        className={cn('rounded-md border px-3 py-2 text-xs text-muted-foreground')}
                        data-testid={`msel-received-delivery-summary-${delivery.id}`}
                      >
                        <span className="font-medium text-foreground">{delivery.recipientEmail}</span>
                        {' · '}
                        {formatMselDeliveryTimestamp(delivery.createdAt)}
                        {' · '}
                        {delivery.summary}
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Item>
        )
      })}
    </div>
  )
}
