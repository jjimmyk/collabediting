import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FusionCascadeMapEmbed } from '@/features/hub/fusion-centers/FusionCascadeMapEmbed'
import { formatFusionCascadeHourLabel } from '@/features/hub/fusion-centers/fusion-cascade-impact-projection'
import type { HubNotificationMapSource } from '@/features/hub/map/hub-notification-map-graphics'
import { TrajectoryHourControl } from '@/features/hub/map-layers/shared/TrajectoryHourControl'
import { NOAA_GNOME_STEP_COUNT } from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'

type FusionCascadingImpactsEmbedProps = {
  visible: boolean
  onVisibleChange: (visible: boolean) => void
  notification: HubNotificationMapSource | null | undefined
  hourIndex: number
  onHourIndexChange: (hourIndex: number) => void
  oilSpillTrajectoryModelsEnabled: boolean
}

export function FusionCascadingImpactsEmbed({
  visible,
  onVisibleChange,
  notification,
  hourIndex,
  onHourIndexChange,
  oilSpillTrajectoryModelsEnabled,
}: FusionCascadingImpactsEmbedProps) {
  return (
    <div className="mt-4 space-y-2 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="fusion-cascade-impacts" className="text-sm font-medium">
          View Cascading Impacts
        </Label>
        <Switch
          id="fusion-cascade-impacts"
          checked={visible}
          onCheckedChange={onVisibleChange}
          aria-label="View Cascading Impacts"
        />
      </div>
      {visible ? (
        <>
          {oilSpillTrajectoryModelsEnabled ? (
            <TrajectoryHourControl
              id="fusion-cascade-notification-hour-slider"
              hourIndex={hourIndex}
              onHourIndexChange={onHourIndexChange}
              stepCount={NOAA_GNOME_STEP_COUNT}
              formatLabel={formatFusionCascadeHourLabel}
              ariaLabel="Fusion cascade trajectory hour"
              label="Cascade trajectory hour"
            />
          ) : null}
          <FusionCascadeMapEmbed
            enabled={visible}
            notification={notification}
            hourIndex={hourIndex}
          />
        </>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        deck.gl arc projections from notification origin to Assets at Risk receptors.
      </p>
    </div>
  )
}
