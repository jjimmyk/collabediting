import { useMemo } from 'react'
import { AlertCircle, CloudRain, Droplets, Loader2, MapPin, Network, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FUSION_CASCADE_LAYER_DEFINITION } from '@/features/hub/fusion-centers/fusion-cascade-scenario-data'
import { formatFusionCascadeHourLabel } from '@/features/hub/fusion-centers/fusion-cascade-impact-projection'
import { TrajectoryHourControl } from '@/features/hub/map-layers/shared/TrajectoryHourControl'
import { NOAA_GNOME_LAYER_DEFINITION } from '@/features/hub/map-layers/gnome/noaa-gnome-layer-catalog'
import {
  formatCurrentForcing,
  formatNoaaGnomeHourLabel,
  formatWindForcing,
  getNoaaGnomeHourlyForcing,
  getNoaaGnomeParticlesForHour,
  NOAA_GNOME_STEP_COUNT,
} from '@/features/hub/map-layers/gnome/noaa-gnome-trajectory-data'
import {
  groupWeatherLayersByCategory,
  type WeatherLayerDefinition,
} from './weather-layer-catalog'
import type { WeatherLayerStatus } from './useHubWeatherMapLayers'

type HubMapLayersPanelProps = {
  enabledLayerIds: Set<string>
  layerStatuses: Record<string, WeatherLayerStatus>
  glassItemBorderClasses?: string
  onToggleLayer: (layerId: string) => void
  onHideAll: () => void
  oilSpillTrajectoryModelsEnabled?: boolean
  gnomeLayerEnabled?: boolean
  gnomeHourIndex?: number
  onToggleGnomeLayer?: () => void
  onGnomeHourIndexChange?: (hourIndex: number) => void
  fusionCentersEnabled?: boolean
  fusionCascadeLayerEnabled?: boolean
  onToggleFusionCascadeLayer?: () => void
  fusionCascadeHourIndex?: number
  onFusionCascadeHourIndexChange?: (hourIndex: number) => void
}

function LayerStatusHint({
  status,
  isEnabled,
}: {
  status: WeatherLayerStatus | undefined
  isEnabled: boolean
}) {
  if (!isEnabled) {
    return null
  }

  if (status === 'loading') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading
      </span>
    )
  }

  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-destructive">
        <AlertCircle className="h-3 w-3" />
        Unavailable
      </span>
    )
  }

  return null
}

function groupIcon(group: WeatherLayerDefinition['group']) {
  if (group === 'radar') {
    return <Radio className="h-4 w-4 text-primary" />
  }

  if (group === 'alerts') {
    return <AlertCircle className="h-4 w-4 text-primary" />
  }

  return <CloudRain className="h-4 w-4 text-primary" />
}

export function HubMapLayersPanel({
  enabledLayerIds,
  layerStatuses,
  glassItemBorderClasses = '',
  onToggleLayer,
  onHideAll,
  oilSpillTrajectoryModelsEnabled = false,
  gnomeLayerEnabled = false,
  gnomeHourIndex = 0,
  onToggleGnomeLayer,
  onGnomeHourIndexChange,
  fusionCentersEnabled = false,
  fusionCascadeLayerEnabled = false,
  onToggleFusionCascadeLayer,
  fusionCascadeHourIndex = 0,
  onFusionCascadeHourIndexChange,
}: HubMapLayersPanelProps) {
  const groupedLayers = useMemo(() => groupWeatherLayersByCategory(), [])
  const visibleLayerCount =
    enabledLayerIds.size +
    (oilSpillTrajectoryModelsEnabled && gnomeLayerEnabled ? 1 : 0) +
    (fusionCentersEnabled && fusionCascadeLayerEnabled ? 1 : 0)

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-2">
      <section
        className={cn(
          'w-full min-w-0 rounded-lg border bg-muted/10 p-3',
          glassItemBorderClasses
        )}
      >
        <p className="text-sm font-medium">Public weather overlays</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Toggle NOAA radar, alerts, and forecast layers on the hub map. Layer choices are saved
          locally in your browser.
        </p>
      </section>

      {visibleLayerCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs">
              {visibleLayerCount} {visibleLayerCount === 1 ? 'layer' : 'layers'} visible on map
            </p>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onHideAll}>
            Hide all
          </Button>
        </div>
      )}

      {groupedLayers.map(({ group, label, layers }) => (
        <section
          key={group}
          className={cn('w-full min-w-0 overflow-hidden rounded-lg border', glassItemBorderClasses)}
        >
          <div className="flex items-center gap-2 border-b px-3 py-2.5">
            {groupIcon(group)}
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">
                {group === 'radar' && 'Live composite radar mosaic'}
                {group === 'alerts' && 'NWS watches and warnings'}
                {group === 'forecast' && 'WPC excessive rainfall outlook'}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 px-3 py-3">
            {layers.map((layer) => {
              const isEnabled = enabledLayerIds.has(layer.id)
              const status = layerStatuses[layer.id]
              const isLoading = isEnabled && status === 'loading'

              return (
                <div key={layer.id} className="flex items-start gap-2">
                  <Checkbox
                    id={`weather-layer-${layer.id}`}
                    checked={isEnabled}
                    disabled={isLoading}
                    onCheckedChange={() => onToggleLayer(layer.id)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label
                        htmlFor={`weather-layer-${layer.id}`}
                        className={cn(
                          'cursor-pointer font-normal leading-snug',
                          isLoading && 'cursor-wait opacity-70'
                        )}
                      >
                        {layer.label}
                      </Label>
                      <LayerStatusHint status={status} isEnabled={isEnabled} />
                    </div>
                    <p className="text-xs text-muted-foreground">{layer.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {oilSpillTrajectoryModelsEnabled ? (
        <section
          className={cn('w-full min-w-0 overflow-hidden rounded-lg border', glassItemBorderClasses)}
        >
          <div className="flex items-center gap-2 border-b px-3 py-2.5">
            <Droplets className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Oil spill trajectory models</p>
              <p className="text-xs text-muted-foreground">
                NOAA GNOME synthetic particle trajectories
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 px-3 py-3">
            <div className="flex items-start gap-2">
              <Checkbox
                id="noaa-gnome-layer"
                checked={gnomeLayerEnabled}
                onCheckedChange={() => onToggleGnomeLayer?.()}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <Label htmlFor="noaa-gnome-layer" className="cursor-pointer font-normal leading-snug">
                  {NOAA_GNOME_LAYER_DEFINITION.label}
                </Label>
                <p className="text-xs text-muted-foreground">{NOAA_GNOME_LAYER_DEFINITION.description}</p>
              </div>
            </div>

            {gnomeLayerEnabled ? (
              <TrajectoryHourControl
                id="noaa-gnome-hour-slider"
                hourIndex={gnomeHourIndex}
                onHourIndexChange={(next) => onGnomeHourIndexChange?.(next)}
                stepCount={NOAA_GNOME_STEP_COUNT}
                formatLabel={formatNoaaGnomeHourLabel}
                ariaLabel="NOAA GNOME trajectory hour"
              >
                <div className="space-y-1 border-t pt-2">
                  <p className="text-xs font-medium">Forcing conditions</p>
                  {(() => {
                    const forcing = getNoaaGnomeHourlyForcing(gnomeHourIndex)
                    const particleCount = getNoaaGnomeParticlesForHour(gnomeHourIndex).length
                    return (
                      <>
                        <p className="text-[11px] text-muted-foreground">
                          Wind: {formatWindForcing(forcing)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Current: {formatCurrentForcing(forcing)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Particles this hour: {particleCount}
                        </p>
                        <p className="text-[11px] text-muted-foreground">Surface slick: shown</p>
                      </>
                    )
                  })()}
                </div>
              </TrajectoryHourControl>
            ) : null}
          </div>
        </section>
      ) : null}

      {fusionCentersEnabled ? (
        <section
          className={cn('w-full min-w-0 overflow-hidden rounded-lg border', glassItemBorderClasses)}
        >
          <div className="flex items-center gap-2 border-b px-3 py-2.5">
            <Network className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">Fusion Centers</p>
              <p className="text-xs text-muted-foreground">
                Cascading critical infrastructure consequence projections
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 px-3 py-3">
            <div className="flex items-start gap-2">
              <Checkbox
                id="fusion-cascade-layer"
                checked={fusionCascadeLayerEnabled}
                onCheckedChange={() => onToggleFusionCascadeLayer?.()}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <Label htmlFor="fusion-cascade-layer" className="cursor-pointer font-normal leading-snug">
                  {FUSION_CASCADE_LAYER_DEFINITION.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {FUSION_CASCADE_LAYER_DEFINITION.description}
                </p>
              </div>
            </div>

            {fusionCascadeLayerEnabled && oilSpillTrajectoryModelsEnabled ? (
              <TrajectoryHourControl
                id="fusion-cascade-hour-slider"
                hourIndex={fusionCascadeHourIndex}
                onHourIndexChange={(next) => onFusionCascadeHourIndexChange?.(next)}
                stepCount={NOAA_GNOME_STEP_COUNT}
                formatLabel={formatFusionCascadeHourLabel}
                ariaLabel="Fusion cascade trajectory hour"
                label="Cascade trajectory hour"
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  )
}
