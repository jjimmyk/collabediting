import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { FusionCascadeArc } from '@/features/hub/fusion-centers/fusion-cascade-arc-data'
import type { FusionCascadeImpactProjection } from '@/features/hub/fusion-centers/fusion-cascade-impact-projection'
import {
  formatFusionCascadeHourLabel,
  getFusionCascadeImpactProjection,
} from '@/features/hub/fusion-centers/fusion-cascade-impact-projection'
import { NOAA_GNOME_STEP_COUNT } from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'
import { cn } from '@/lib/utils'

type FusionCascadeImpactModalProps = {
  open: boolean
  arc: FusionCascadeArc | null
  hourIndex: number
  projection?: FusionCascadeImpactProjection | null
  onClose: () => void
}

function statusClassName(status: FusionCascadeImpactProjection['status']): string {
  switch (status) {
    case 'CRITICAL':
      return 'text-destructive'
    case 'HIGH RISK':
      return 'text-amber-600 dark:text-amber-400'
    case 'ELEVATED':
      return 'text-orange-600 dark:text-orange-400'
    case 'MONITORED':
    default:
      return 'text-muted-foreground'
  }
}

export function FusionCascadeImpactModal({
  open,
  arc,
  hourIndex,
  projection,
  onClose,
}: FusionCascadeImpactModalProps) {
  const resolvedProjection =
    projection ??
    (arc ? getFusionCascadeImpactProjection(arc.threatId, hourIndex) : null)

  return (
    <Dialog
      open={open && arc !== null && resolvedProjection !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-md">
        {arc && resolvedProjection ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-base leading-snug">{arc.resource}</DialogTitle>
              <DialogDescription>
                Consequence engine projection · {arc.threatId} ·{' '}
                {formatFusionCascadeHourLabel(hourIndex)} (hour {hourIndex + 1} of{' '}
                {NOAA_GNOME_STEP_COUNT})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-md border bg-muted/20 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Impact score</p>
                  <p className="font-semibold">{resolvedProjection.impactScore}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Countdown</p>
                  <p className="font-semibold">{resolvedProjection.countdown}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cascade status</p>
                  <p className={cn('font-semibold', statusClassName(resolvedProjection.status))}>
                    {resolvedProjection.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Operational status</p>
                  <p className="font-semibold">{resolvedProjection.operationalStatus}</p>
                </div>
              </div>
              <p className="text-muted-foreground">{resolvedProjection.narrative}</p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
