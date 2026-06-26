import { MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { formatMselDeliveryTimestamp } from './delivery-utils'
import {
  getInjectMapFeatures,
  getMapFeatureLabel,
  hasInjectMapGeometry,
} from './msel-geometry-utils'
import { getExerciseObjectiveLabel } from './msel-utils'
import type { ExerciseMselState, MselInjectDelivery, MselInjectSnapshot } from './types'

export type MselInjectDetailPanelProps = {
  snapshot: MselInjectSnapshot
  objectives: ExerciseMselState['objectives']
  deliveries?: MselInjectDelivery[]
  onFocusOnMap?: () => void
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <p className="whitespace-pre-wrap text-sm">{value || '—'}</p>
    </div>
  )
}

export function MselInjectDetailPanel({
  snapshot,
  objectives,
  deliveries,
  onFocusOnMap,
}: MselInjectDetailPanelProps) {
  const mapFeatures = getInjectMapFeatures(snapshot)
  const objectiveLabel = getExerciseObjectiveLabel(objectives, snapshot.objectiveId)

  return (
    <div className="grid gap-3" data-testid={`msel-inject-detail-${snapshot.id}`}>
      <div className="grid gap-3 md:grid-cols-2">
        <DetailField label="Exercise Objective" value={objectiveLabel} />
        <DetailField label="Scheduled Time" value={snapshot.scheduledTime || 'Not set'} />
        <DetailField label="Category" value={snapshot.category || 'Operations'} />
      </div>
      <DetailField label="Inject" value={snapshot.inject} />
      <DetailField label="Expected Action" value={snapshot.expectedAction} />
      {mapFeatures.length > 0 && (
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Map shapes ({mapFeatures.length})
            </Label>
            {onFocusOnMap && hasInjectMapGeometry(snapshot) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={onFocusOnMap}
              >
                <MapPin className="h-3.5 w-3.5" />
                Zoom to map
              </Button>
            )}
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {mapFeatures.map((feature, index) => (
              <li key={feature.id} className="rounded-md border px-2 py-1">
                {getMapFeatureLabel(feature, index)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {deliveries && deliveries.length > 0 && (
        <div className="grid gap-2 border-t pt-3">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Deliveries
          </Label>
          <div className="space-y-2">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-md border px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{delivery.recipientEmail}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatMselDeliveryTimestamp(delivery.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sent by {delivery.sentByEmail ?? 'Unknown'}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {delivery.severity}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
